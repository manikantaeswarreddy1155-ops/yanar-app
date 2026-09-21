import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'yanar.sqlite');
export const db = new DatabaseSync(DB_PATH);

// Run schema
const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schemaSql);

// Helper functions
function seedInitialData() {
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const userCount = countStmt.get().count;

  if (userCount > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial data into SQLite database...');

  // Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, name, email, password, avatar, bio, website, is_verified, followers_count, following_count, posts_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialUsers = [
    [
      'usr_me',
      'alexrivers',
      'Alex Rivers',
      'alex@yanar.io',
      'password123',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      'Visual storyteller & Creative technologist ✨ | Tokyo & SF ✈️ | Building the future of social 🚀',
      'https://yanar.io/alex',
      1,
      14200,
      489,
      38
    ],
    [
      'usr_1',
      'elena_lens',
      'Elena Rostova',
      'elena@yanar.io',
      'password123',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      'Cinema & analog frames 🎞️ Capturing shadows and neon lights.',
      'https://elena.lens',
      1,
      28400,
      312,
      142
    ],
    [
      'usr_2',
      'marcus_dev',
      'Marcus Vance',
      'marcus@yanar.io',
      'password123',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      'Frontend craftsman, WebRTC enthusiast 💻 Coffee & dark mode always.',
      'https://marcus.codes',
      0,
      8930,
      540,
      65
    ],
    [
      'usr_3',
      'sarah_wanderlust',
      'Sarah Chen',
      'sarah@yanar.io',
      'password123',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      'Alpine wanderer 🏔️ Chasing sunrises across 40+ countries. Let’s explore.',
      'https://wander.sarah',
      1,
      95400,
      620,
      312
    ],
    [
      'usr_4',
      'neo_beats',
      'Neo Thorne',
      'neo@yanar.io',
      'password123',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
      'Electronic soundscapes & vinyl selector 🎚️ Catch my weekly live sets.',
      'https://sound.neo',
      0,
      15600,
      410,
      89
    ],
    [
      'usr_5',
      'maya_culinary',
      'Maya Patel',
      'maya@yanar.io',
      'password123',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      'Plant-forward gastronomy 🥑 Food styling & cozy studio recipes.',
      'https://maya.kitchen',
      1,
      51200,
      780,
      220
    ],
  ];

  for (const u of initialUsers) {
    insertUser.run(...u);
  }

  // Seed Followers
  const insertFollower = db.prepare('INSERT OR IGNORE INTO followers (follower_id, following_id) VALUES (?, ?)');
  insertFollower.run('usr_me', 'usr_1');
  insertFollower.run('usr_me', 'usr_3');
  insertFollower.run('usr_me', 'usr_5');

  // Seed Posts
  const insertPost = db.prepare(`
    INSERT INTO posts (id, author_id, type, media_url, caption, location, likes_count, comments_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialPosts = [
    [
      'post_1',
      'usr_1',
      'image',
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=85',
      'Midnight neon vibes in Shibuya. The rain reflections turn the streets into liquid mirrors 🌧️✨ Shot on 35mm f/1.4.',
      'Shibuya, Tokyo, Japan',
      3842,
      2,
      '2 hours ago'
    ],
    [
      'post_2',
      'usr_3',
      'image',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85',
      'Quiet morning awakening at Yosemite Valley. The fog clearing over the granite monoliths was nothing short of spiritual 🌲⛰️',
      'Yosemite National Park, California',
      6120,
      2,
      '5 hours ago'
    ],
    [
      'post_3',
      'usr_me',
      'image',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=85',
      'Building the next evolution of social connectivity with the team today. Super excited to show what we have been crafting with WebRTC audio/video! 🚀🔥',
      'YANAR HQ, San Francisco',
      1240,
      1,
      '1 day ago'
    ],
    [
      'post_4',
      'usr_5',
      'image',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=85',
      'Colorful superfood nourish bowl with sesame-crusted tofu, pickled radishes, and creamy tahini drizzle 🥗✨ Healthy fuel for creation.',
      'SoHo, New York',
      4180,
      1,
      '1 day ago'
    ],
  ];

  for (const p of initialPosts) {
    insertPost.run(...p);
  }

  // Seed Comments
  const insertComment = db.prepare(`
    INSERT INTO comments (id, post_id, user_id, text, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const initialComments = [
    ['c1', 'post_1', 'usr_2', 'The color grading is immaculate! Which film preset is this?', '1h ago'],
    ['c2', 'post_1', 'usr_3', 'Makes me want to hop on the next flight to Tokyo ✈️', '45m ago'],
    ['c3', 'post_2', 'usr_me', 'Incredible lighting! That 6am wake up was definitely worth it.', '3h ago'],
    ['c4', 'post_2', 'usr_4', 'Pure peace. Frame worthy shot!', '2h ago'],
    ['c5', 'post_3', 'usr_2', 'WebRTC in the browser feels like magic when it connects smoothly ⚡', '18h ago'],
    ['c6', 'post_4', 'usr_1', 'Looks too pretty to eat! Can you share the tahini dressing ratio?', '22h ago'],
  ];

  for (const c of initialComments) {
    insertComment.run(...c);
  }

  // Seed Reels
  const insertReel = db.prepare(`
    INSERT INTO reels (id, author_id, video_url, caption, audio_track, likes_count, comments_count, shares_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialReels = [
    [
      'reel_1',
      'usr_1',
      'https://assets.mixkit.co/videos/preview/mixkit-taking-photos-of-a-model-in-a-studio-41440-large.mp4',
      'Studio lighting setups that will elevate your portrait game in 30 seconds 📸⚡',
      'Elena Rostova • Original Audio (Tokyo Chill)',
      18400,
      642,
      1240,
      '3h ago'
    ],
    [
      'reel_2',
      'usr_3',
      'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-42407-large.mp4',
      'Night hyperlapse over the skyline. Look at those endless light arteries 🌃🚗',
      'Neo Thorne • Synth Wave Echoes',
      34900,
      1120,
      4520,
      '1d ago'
    ],
    [
      'reel_3',
      'usr_4',
      'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-playing-on-a-synthesizer-41398-large.mp4',
      'Analog synthesizer modular jam sessions. Which patch cord is your favorite? 🎹🎛️',
      'Neo Thorne • Modular Sunrise Jam',
      12300,
      419,
      920,
      '2d ago'
    ],
    [
      'reel_4',
      'usr_5',
      'https://assets.mixkit.co/videos/preview/mixkit-cutting-vegetables-on-a-wooden-board-42861-large.mp4',
      'Knife skills 101: Uniform julienne cuts will change how your stir fry cooks! 🥕🔪',
      'Maya Patel • Lo-fi Kitchen Beats',
      27800,
      840,
      3100,
      '3d ago'
    ],
  ];

  for (const r of initialReels) {
    insertReel.run(...r);
  }

  // Seed Stories
  const insertStory = db.prepare('INSERT INTO stories (id, user_id, media_url, type, created_at) VALUES (?, ?, ?, ?, ?)');
  insertStory.run('story_me', 'usr_me', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', 'image', '30m ago');
  insertStory.run('story_1', 'usr_1', 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80', 'image', '2h ago');
  insertStory.run('story_2', 'usr_3', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', 'image', '4h ago');
  insertStory.run('story_3', 'usr_2', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80', 'image', '6h ago');

  // Seed Conversations & Messages
  const insertConv = db.prepare('INSERT INTO conversations (id, user1_id, user2_id) VALUES (?, ?, ?)');
  const insertMsg = db.prepare(`
    INSERT INTO messages (id, conversation_id, sender_id, text, media_url, media_type, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertConv.run('conv_1', 'usr_me', 'usr_1');
  insertMsg.run('m1', 'conv_1', 'usr_1', 'Hey Alex! Loved your latest shot of the studio setup.', null, null, 'read', '10:45 AM');
  insertMsg.run('m2', 'conv_1', 'usr_me', 'Thank you Elena! Trying out the new anamorphic prime lenses.', null, null, 'read', '10:48 AM');
  insertMsg.run('m3', 'conv_1', 'usr_1', 'Are you free for a quick video call to review the lookbook drafts?', null, null, 'delivered', '11:02 AM');
  insertMsg.run('m4', 'conv_1', 'usr_1', 'Here is the draft hero shot we are aiming for!', 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80', 'image', 'delivered', '11:03 AM');

  insertConv.run('conv_2', 'usr_me', 'usr_2');
  insertMsg.run('m2_1', 'conv_2', 'usr_2', 'WebRTC data channels are performing smoothly under testing!', null, null, 'read', 'Yesterday');
  insertMsg.run('m2_2', 'conv_2', 'usr_me', 'Awesome! Let’s test the audio and screen sharing flow together.', null, null, 'read', 'Yesterday');

  insertConv.run('conv_3', 'usr_me', 'usr_3');
  insertMsg.run('m3_1', 'conv_3', 'usr_3', 'Yosemite permits just opened up for next month if you want to join!', null, null, 'read', '2d ago');
  insertMsg.run('m3_2', 'conv_3', 'usr_me', 'Count me in! Packing the drone and hiking boots.', null, null, 'read', '2d ago');

  console.log('Database seeded successfully!');
}

seedInitialData();
