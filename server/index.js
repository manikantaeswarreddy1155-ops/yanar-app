import express from 'express';
import cors from 'cors';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import multer from 'multer';
import { db } from './db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Setup uploads directory
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// -------------------------------------------------------------
// WebSocket Real-Time Engine (Chat & WebRTC Signaling)
// -------------------------------------------------------------
const wss = new WebSocketServer({ server });
const clients = new Map(); // userId -> WebSocket

wss.on('connection', (ws) => {
  let currentUserId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'register': {
          currentUserId = data.userId;
          clients.set(currentUserId, ws);
          // Broadcast user online status
          broadcast({ type: 'user_online', userId: currentUserId, isOnline: true });
          break;
        }

        case 'chat_message': {
          const { recipientId, message: msgData } = data;
          const targetWs = clients.get(recipientId);
          if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(JSON.stringify({ type: 'chat_message', message: msgData }));
          }
          break;
        }

        case 'webrtc_signal': {
          // Relay SDP offer/answer/candidates or call ring to recipient
          const { targetUserId, signal } = data;
          const targetWs = clients.get(targetUserId);
          if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(JSON.stringify({
              type: 'webrtc_signal',
              fromUserId: currentUserId,
              signal,
            }));
          }
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    if (currentUserId) {
      clients.delete(currentUserId);
      broadcast({ type: 'user_online', userId: currentUserId, isOnline: false });
    }
  });
});

function broadcast(payload) {
  const str = JSON.stringify(payload);
  for (const client of clients.values()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(str);
    }
  }
}

// -------------------------------------------------------------
// REST API Routes
// -------------------------------------------------------------

// 1. Auth & Users
app.post('/api/auth/login', (req, res) => {
  const { identifier, email, username, password } = req.body;
  const loginKey = (identifier || username || email || '').trim().toLowerCase();

  if (!loginKey) {
    return res.status(400).json({ success: false, error: 'Please enter your username or email' });
  }

  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?').get(loginKey, loginKey);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Account not found with this username or email' });
  }

  if (user.password && password && user.password !== password) {
    return res.status(401).json({ success: false, error: 'Incorrect password' });
  }

  res.json({ success: true, user: formatUser(user) });
});

app.post('/api/auth/signup', (req, res) => {
  const { username, name, email, password } = req.body;

  if (!username?.trim() || !name?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({ success: false, error: 'All fields (Name, Username, Email, Password) are required' });
  }

  const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
  const cleanEmail = email.trim().toLowerCase();

  // Check for duplicate username or email
  const existing = db.prepare('SELECT id, username, email FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?').get(cleanUsername, cleanEmail);
  if (existing) {
    if (existing.username.toLowerCase() === cleanUsername) {
      return res.status(400).json({ success: false, error: 'Username is already taken. Please choose another.' });
    }
    return res.status(400).json({ success: false, error: 'An account with this email already exists. Please sign in instead.' });
  }

  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=f43f5e&color=fff&bold=true&size=256`;
  const bio = 'Hey there! I am new to YANAR ✨';

  const insertStmt = db.prepare(`
    INSERT INTO users (id, username, name, email, password, avatar, bio, website, is_verified, followers_count, following_count, posts_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0)
  `);

  try {
    insertStmt.run(id, cleanUsername, name.trim(), cleanEmail, password, avatar, bio, '');
    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.status(201).json({ success: true, user: formatUser(newUser) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create user account: ' + err.message });
  }
});

app.get('/api/auth/demo-users', (_req, res) => {
  const demoUsers = db.prepare('SELECT * FROM users LIMIT 5').all();
  res.json({ success: true, users: demoUsers.map(formatUser) });
});

app.get('/api/users', (_req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY followers_count DESC').all();
  res.json({ success: true, users: users.map(formatUser) });
});

app.put('/api/users/profile', (req, res) => {
  const { id, name, username, bio, website, avatar } = req.body;
  const updateStmt = db.prepare(`
    UPDATE users
    SET name = COALESCE(?, name),
        username = COALESCE(?, username),
        bio = COALESCE(?, bio),
        website = COALESCE(?, website),
        avatar = COALESCE(?, avatar)
    WHERE id = ?
  `);

  updateStmt.run(name, username, bio, website, avatar, id);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.json({ success: true, user: formatUser(updated) });
});

app.post('/api/users/:id/follow', (req, res) => {
  const targetId = req.params.id;
  const currentUserId = req.body.currentUserId || 'usr_me';

  const check = db.prepare('SELECT * FROM followers WHERE follower_id = ? AND following_id = ?').get(currentUserId, targetId);

  if (check) {
    // Unfollow
    db.prepare('DELETE FROM followers WHERE follower_id = ? AND following_id = ?').run(currentUserId, targetId);
    db.prepare('UPDATE users SET followers_count = MAX(0, followers_count - 1) WHERE id = ?').run(targetId);
    db.prepare('UPDATE users SET following_count = MAX(0, following_count - 1) WHERE id = ?').run(currentUserId);
  } else {
    // Follow
    db.prepare('INSERT INTO followers (follower_id, following_id) VALUES (?, ?)').run(currentUserId, targetId);
    db.prepare('UPDATE users SET followers_count = followers_count + 1 WHERE id = ?').run(targetId);
    db.prepare('UPDATE users SET following_count = following_count + 1 WHERE id = ?').run(currentUserId);
  }

  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
  const isFollowing = !check;
  res.json({ success: true, user: { ...formatUser(targetUser), isFollowing } });
});

// 2. Posts
app.get('/api/posts', (_req, res) => {
  const posts = db.prepare(`
    SELECT p.*, u.username, u.name, u.avatar, u.bio, u.is_verified
    FROM posts p
    JOIN users u ON p.author_id = u.id
    ORDER BY p.created_at DESC
  `).all();

  const formatted = posts.map(p => {
    // Fetch comments for post
    const comments = db.prepare(`
      SELECT c.*, u.username, u.name, u.avatar, u.is_verified
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC
    `).all(p.id);

    return {
      id: p.id,
      author: {
        id: p.author_id,
        username: p.username,
        name: p.name,
        avatar: p.avatar,
        bio: p.bio,
        isVerified: Boolean(p.is_verified),
      },
      type: p.type,
      mediaUrl: p.media_url,
      caption: p.caption,
      location: p.location,
      likesCount: p.likes_count,
      commentsCount: comments.length,
      isLiked: false,
      isSaved: false,
      createdAt: p.created_at,
      comments: comments.map(c => ({
        id: c.id,
        user: {
          id: c.user_id,
          username: c.username,
          name: c.name,
          avatar: c.avatar,
          isVerified: Boolean(c.is_verified),
        },
        text: c.text,
        createdAt: c.created_at,
        likesCount: 0,
      })),
    };
  });

  res.json({ success: true, posts: formatted });
});

app.post('/api/posts', (req, res) => {
  const { authorId = 'usr_me', type = 'image', mediaUrl, caption, location } = req.body;
  const id = `post_${Date.now()}`;

  const insert = db.prepare(`
    INSERT INTO posts (id, author_id, type, media_url, caption, location, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  insert.run(id, authorId, type, mediaUrl, caption, location || '');
  db.prepare('UPDATE users SET posts_count = posts_count + 1 WHERE id = ?').run(authorId);

  const post = db.prepare(`
    SELECT p.*, u.username, u.name, u.avatar, u.bio, u.is_verified
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.id = ?
  `).get(id);

  res.json({
    success: true,
    post: {
      id: post.id,
      author: {
        id: post.author_id,
        username: post.username,
        name: post.name,
        avatar: post.avatar,
        bio: post.bio,
        isVerified: Boolean(post.is_verified),
      },
      type: post.type,
      mediaUrl: post.media_url,
      caption: post.caption,
      location: post.location,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isSaved: false,
      createdAt: 'Just now',
      comments: [],
    },
  });
});

app.post('/api/posts/:id/like', (req, res) => {
  const postId = req.params.id;
  const userId = req.body.userId || 'usr_me';

  const check = db.prepare('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?').get(postId, userId);

  if (check) {
    db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(postId, userId);
    db.prepare('UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').run(postId);
  } else {
    db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(postId, userId);
    db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').run(postId);
  }

  const post = db.prepare('SELECT likes_count FROM posts WHERE id = ?').get(postId);
  res.json({ success: true, isLiked: !check, likesCount: post?.likes_count || 0 });
});

app.post('/api/posts/:id/comments', (req, res) => {
  const postId = req.params.id;
  const { userId = 'usr_me', text } = req.body;
  const id = `c_${Date.now()}`;

  db.prepare('INSERT INTO comments (id, post_id, user_id, text) VALUES (?, ?, ?, ?)').run(id, postId, userId, text);
  db.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?').run(postId);

  const comment = db.prepare(`
    SELECT c.*, u.username, u.name, u.avatar, u.is_verified
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(id);

  res.json({
    success: true,
    comment: {
      id: comment.id,
      user: {
        id: comment.user_id,
        username: comment.username,
        name: comment.name,
        avatar: comment.avatar,
        isVerified: Boolean(comment.is_verified),
      },
      text: comment.text,
      createdAt: 'Just now',
      likesCount: 0,
    },
  });
});

// 3. Reels
app.get('/api/reels', (_req, res) => {
  const reels = db.prepare(`
    SELECT r.*, u.username, u.name, u.avatar, u.bio, u.is_verified
    FROM reels r
    JOIN users u ON r.author_id = u.id
    ORDER BY r.created_at DESC
  `).all();

  const formatted = reels.map(r => ({
    id: r.id,
    author: {
      id: r.author_id,
      username: r.username,
      name: r.name,
      avatar: r.avatar,
      bio: r.bio,
      isVerified: Boolean(r.is_verified),
    },
    videoUrl: r.video_url,
    caption: r.caption,
    audioTrack: r.audio_track,
    likesCount: r.likes_count,
    commentsCount: r.comments_count,
    sharesCount: r.shares_count,
    isLiked: false,
    isSaved: false,
    createdAt: r.created_at,
  }));

  res.json({ success: true, reels: formatted });
});

app.post('/api/reels', (req, res) => {
  const { authorId = 'usr_me', videoUrl, caption, audioTrack } = req.body;
  const id = `reel_${Date.now()}`;

  db.prepare(`
    INSERT INTO reels (id, author_id, video_url, caption, audio_track, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(id, authorId, videoUrl, caption, audioTrack || 'Original Audio');

  const reel = db.prepare(`
    SELECT r.*, u.username, u.name, u.avatar, u.bio, u.is_verified
    FROM reels r
    JOIN users u ON r.author_id = u.id
    WHERE r.id = ?
  `).get(id);

  res.json({
    success: true,
    reel: {
      id: reel.id,
      author: {
        id: reel.author_id,
        username: reel.username,
        name: reel.name,
        avatar: reel.avatar,
        bio: reel.bio,
        isVerified: Boolean(reel.is_verified),
      },
      videoUrl: reel.video_url,
      caption: reel.caption,
      audioTrack: reel.audio_track,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isLiked: false,
      isSaved: false,
      createdAt: 'Just now',
    },
  });
});

app.post('/api/reels/:id/like', (req, res) => {
  const reelId = req.params.id;
  const userId = req.body.userId || 'usr_me';

  const check = db.prepare('SELECT * FROM reel_likes WHERE reel_id = ? AND user_id = ?').get(reelId, userId);

  if (check) {
    db.prepare('DELETE FROM reel_likes WHERE reel_id = ? AND user_id = ?').run(reelId, userId);
    db.prepare('UPDATE reels SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').run(reelId);
  } else {
    db.prepare('INSERT INTO reel_likes (reel_id, user_id) VALUES (?, ?)').run(reelId, userId);
    db.prepare('UPDATE reels SET likes_count = likes_count + 1 WHERE id = ?').run(reelId);
  }

  const reel = db.prepare('SELECT likes_count FROM reels WHERE id = ?').get(reelId);
  res.json({ success: true, isLiked: !check, likesCount: reel?.likes_count || 0 });
});

// 4. Stories
app.get('/api/stories', (_req, res) => {
  const stories = db.prepare(`
    SELECT s.*, u.username, u.name, u.avatar, u.is_verified
    FROM stories s
    JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC
  `).all();

  const formatted = stories.map(s => ({
    id: s.id,
    user: {
      id: s.user_id,
      username: s.username,
      name: s.name,
      avatar: s.avatar,
      isVerified: Boolean(s.is_verified),
    },
    mediaUrl: s.media_url,
    type: s.type,
    hasUnseen: true,
    createdAt: s.created_at,
  }));

  res.json({ success: true, stories: formatted });
});

app.post('/api/stories', (req, res) => {
  const { userId = 'usr_me', mediaUrl, type = 'image' } = req.body;
  const id = `story_${Date.now()}`;

  db.prepare(`
    INSERT INTO stories (id, user_id, media_url, type, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(id, userId, mediaUrl, type);

  const story = db.prepare(`
    SELECT s.*, u.username, u.name, u.avatar, u.is_verified
    FROM stories s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `).get(id);

  res.json({
    success: true,
    story: {
      id: story.id,
      user: {
        id: story.user_id,
        username: story.username,
        name: story.name,
        avatar: story.avatar,
        isVerified: Boolean(story.is_verified),
      },
      mediaUrl: story.media_url,
      type: story.type,
      hasUnseen: false,
      createdAt: 'Just now',
    },
  });
});

// 5. Conversations & Messages
app.get('/api/conversations', (req, res) => {
  const userId = req.query.userId || 'usr_me';

  const convs = db.prepare(`
    SELECT c.*,
      CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END AS other_user_id
    FROM conversations c
    WHERE c.user1_id = ? OR c.user2_id = ?
    ORDER BY c.updated_at DESC
  `).all(userId, userId, userId);

  const formatted = convs.map(c => {
    const otherUser = db.prepare('SELECT * FROM users WHERE id = ?').get(c.other_user_id);
    const messages = db.prepare(`
      SELECT * FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(c.id);

    return {
      id: c.id,
      participant: formatUser(otherUser),
      isOnline: clients.has(c.other_user_id),
      unreadCount: 0,
      messages: messages.map(m => ({
        id: m.id,
        senderId: m.sender_id,
        text: m.text,
        mediaUrl: m.media_url,
        mediaType: m.media_type,
        status: m.status,
        createdAt: m.created_at,
      })),
    };
  });

  res.json({ success: true, conversations: formatted });
});

app.post('/api/conversations/:id/messages', (req, res) => {
  const conversationId = req.params.id;
  const { senderId = 'usr_me', text, mediaUrl, mediaType } = req.body;
  const id = `msg_${Date.now()}`;

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  db.prepare(`
    INSERT INTO messages (id, conversation_id, sender_id, text, media_url, media_type, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'delivered', ?)
  `).run(id, conversationId, senderId, text || null, mediaUrl || null, mediaType || null, timeStr);

  db.prepare(`UPDATE conversations SET updated_at = datetime('now') WHERE id = ?`).run(conversationId);

  const newMsg = {
    id,
    senderId,
    text,
    mediaUrl,
    mediaType,
    status: 'delivered',
    createdAt: timeStr,
  };

  // Find recipient and send real-time WebSocket packet
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
  if (conv) {
    const recipientId = conv.user1_id === senderId ? conv.user2_id : conv.user1_id;
    const recipientWs = clients.get(recipientId);
    if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
      recipientWs.send(JSON.stringify({
        type: 'chat_message',
        conversationId,
        message: newMsg,
      }));
    }
  }

  res.json({ success: true, message: newMsg });
});

// 6. Media Uploads
app.post('/api/upload', upload.single('media'), (req, res) => {
  if (!req.file) {
    // If base64 payload provided in body
    if (req.body.base64) {
      const matches = req.body.base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1].includes('video') ? '.mp4' : '.jpg';
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
        const filePath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));
        const fileUrl = `http://127.0.0.1:${PORT}/uploads/${filename}`;
        return res.json({ success: true, url: fileUrl });
      }
    }
    return res.status(400).json({ success: false, error: 'No media file provided' });
  }

  const fileUrl = `http://127.0.0.1:${PORT}/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

// Helper to format user row
function formatUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    avatar: row.avatar,
    bio: row.bio,
    website: row.website,
    isVerified: Boolean(row.is_verified),
    followersCount: row.followers_count || 0,
    followingCount: row.following_count || 0,
    postsCount: row.posts_count || 0,
  };
}

// Start Server
server.listen(PORT, () => {
  console.log(`YANAR Backend & WebSocket server running on http://127.0.0.1:${PORT}`);
  console.log(`Database connected: SQLite (node:sqlite)`);
});
