import { User, Post, Story, Reel, Conversation, Message, Comment } from '../types';
import { CURRENT_USER, DEMO_USERS, INITIAL_POSTS, INITIAL_REELS, INITIAL_STORIES, INITIAL_CONVERSATIONS } from './mockData';

const KEYS = {
  USER: 'yanar_user',
  USERS: 'yanar_users',
  POSTS: 'yanar_posts',
  REELS: 'yanar_reels',
  STORIES: 'yanar_stories',
  CONVERSATIONS: 'yanar_conversations',
};

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage save error:', err);
  }
}

export const StorageService = {
  // Current user
  getCurrentUser(): User {
    return getStored<User>(KEYS.USER, CURRENT_USER);
  },

  updateCurrentUser(updates: Partial<User>): User {
    const current = this.getCurrentUser();
    const updated = { ...current, ...updates };
    setStored(KEYS.USER, updated);
    return updated;
  },

  // Users
  getUsers(): User[] {
    return getStored<User[]>(KEYS.USERS, DEMO_USERS);
  },

  toggleFollowUser(userId: string): { user: User; currentUser: User } {
    const users = this.getUsers();
    let targetUser = users.find(u => u.id === userId);
    const currentUser = this.getCurrentUser();

    if (targetUser) {
      const isFollowing = !targetUser.isFollowing;
      targetUser = {
        ...targetUser,
        isFollowing,
        followersCount: isFollowing ? targetUser.followersCount + 1 : Math.max(0, targetUser.followersCount - 1),
      };

      const updatedUsers = users.map(u => (u.id === userId ? targetUser! : u));
      setStored(KEYS.USERS, updatedUsers);

      const updatedCurrentUser = {
        ...currentUser,
        followingCount: isFollowing ? currentUser.followingCount + 1 : Math.max(0, currentUser.followingCount - 1),
      };
      setStored(KEYS.USER, updatedCurrentUser);

      return { user: targetUser, currentUser: updatedCurrentUser };
    }

    return { user: targetUser || DEMO_USERS[0], currentUser };
  },

  // Posts
  getPosts(): Post[] {
    return getStored<Post[]>(KEYS.POSTS, INITIAL_POSTS);
  },

  toggleLikePost(postId: string): Post[] {
    const posts = this.getPosts();
    const updated = posts.map(post => {
      if (post.id === postId) {
        const isLiked = !post.isLiked;
        return {
          ...post,
          isLiked,
          likesCount: isLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1),
        };
      }
      return post;
    });
    setStored(KEYS.POSTS, updated);
    return updated;
  },

  toggleSavePost(postId: string): Post[] {
    const posts = this.getPosts();
    const updated = posts.map(post => {
      if (post.id === postId) {
        return { ...post, isSaved: !post.isSaved };
      }
      return post;
    });
    setStored(KEYS.POSTS, updated);
    return updated;
  },

  addComment(postId: string, text: string): Post[] {
    const posts = this.getPosts();
    const currentUser = this.getCurrentUser();
    const newComment: Comment = {
      id: `c_${Date.now()}`,
      user: currentUser,
      text,
      createdAt: 'Just now',
      likesCount: 0,
    };

    const updated = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          commentsCount: post.commentsCount + 1,
          comments: [newComment, ...post.comments],
        };
      }
      return post;
    });
    setStored(KEYS.POSTS, updated);
    return updated;
  },

  createPost(data: { mediaUrl: string; caption: string; location?: string; type?: 'image' | 'video' }): Post {
    const posts = this.getPosts();
    const currentUser = this.getCurrentUser();
    const newPost: Post = {
      id: `post_${Date.now()}`,
      author: currentUser,
      type: data.type || 'image',
      mediaUrl: data.mediaUrl,
      caption: data.caption,
      location: data.location,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isSaved: false,
      createdAt: 'Just now',
      comments: [],
    };

    const updated = [newPost, ...posts];
    setStored(KEYS.POSTS, updated);

    // Update user post count
    this.updateCurrentUser({ postsCount: currentUser.postsCount + 1 });

    return newPost;
  },

  // Reels
  getReels(): Reel[] {
    return getStored<Reel[]>(KEYS.REELS, INITIAL_REELS);
  },

  toggleLikeReel(reelId: string): Reel[] {
    const reels = this.getReels();
    const updated = reels.map(reel => {
      if (reel.id === reelId) {
        const isLiked = !reel.isLiked;
        return {
          ...reel,
          isLiked,
          likesCount: isLiked ? reel.likesCount + 1 : Math.max(0, reel.likesCount - 1),
        };
      }
      return reel;
    });
    setStored(KEYS.REELS, updated);
    return updated;
  },

  createReel(data: { videoUrl: string; caption: string; audioTrack?: string }): Reel {
    const reels = this.getReels();
    const currentUser = this.getCurrentUser();
    const newReel: Reel = {
      id: `reel_${Date.now()}`,
      author: currentUser,
      videoUrl: data.videoUrl,
      caption: data.caption,
      audioTrack: data.audioTrack || `${currentUser.name} • Original Audio`,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isLiked: false,
      isSaved: false,
      createdAt: 'Just now',
    };

    const updated = [newReel, ...reels];
    setStored(KEYS.REELS, updated);
    return newReel;
  },

  // Stories
  getStories(): Story[] {
    return getStored<Story[]>(KEYS.STORIES, INITIAL_STORIES);
  },

  addStory(mediaUrl: string, type: 'image' | 'video' = 'image'): Story {
    const stories = this.getStories();
    const currentUser = this.getCurrentUser();
    const newStory: Story = {
      id: `story_${Date.now()}`,
      user: currentUser,
      mediaUrl,
      type,
      hasUnseen: false,
      createdAt: 'Just now',
    };

    const updated = [newStory, ...stories.filter(s => s.user.id !== currentUser.id)];
    setStored(KEYS.STORIES, updated);
    return newStory;
  },

  markStorySeen(storyId: string): Story[] {
    const stories = this.getStories();
    const updated = stories.map(s => (s.id === storyId ? { ...s, hasUnseen: false } : s));
    setStored(KEYS.STORIES, updated);
    return updated;
  },

  // Conversations & Messages
  getConversations(): Conversation[] {
    return getStored<Conversation[]>(KEYS.CONVERSATIONS, INITIAL_CONVERSATIONS);
  },

  sendMessage(conversationId: string, content: { text?: string; mediaUrl?: string; mediaType?: 'image' | 'video' }): { conversation: Conversation; message: Message } {
    const conversations = this.getConversations();
    const currentUser = this.getCurrentUser();
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      text: content.text,
      mediaUrl: content.mediaUrl,
      mediaType: content.mediaType,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered',
    };

    let updatedConv: Conversation | null = null;
    const updated = conversations.map(c => {
      if (c.id === conversationId) {
        updatedConv = {
          ...c,
          lastMessage: newMessage,
          messages: [...c.messages, newMessage],
        };
        return updatedConv;
      }
      return c;
    });

    setStored(KEYS.CONVERSATIONS, updated);
    return { conversation: updatedConv || conversations[0], message: newMessage };
  },

  markMessagesRead(conversationId: string): void {
    const conversations = this.getConversations();
    const updated = conversations.map(c => {
      if (c.id === conversationId) {
        return {
          ...c,
          unreadCount: 0,
          messages: c.messages.map(m => ({ ...m, status: 'read' as const })),
        };
      }
      return c;
    });
    setStored(KEYS.CONVERSATIONS, updated);
  },
};
