import { User, Post, Reel, Story, Conversation, Message, Comment } from '../types';
import { StorageService } from './storageService';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const API_BASE = `${BACKEND_URL.replace(/\/+$/, '')}/api`;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Backend API unreachable at ${endpoint}, falling back to local storage:`, err);
    return null;
  }
}

export const ApiClient = {
  // Auth
  async login(credentials: { identifier: string; password?: string }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Login failed' };
      }
      return { success: true, user: data.user };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      return { success: false, error: errorMsg };
    }
  },

  async signup(userData: { username: string; name: string; email: string; password: string }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      return { success: true, user: data.user };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      return { success: false, error: errorMsg };
    }
  },

  async getDemoUsers(): Promise<User[]> {
    const data = await request<{ success: boolean; users: User[] }>('/auth/demo-users');
    if (data?.success && data.users) {
      return data.users;
    }
    return StorageService.getUsers().slice(0, 5);
  },

  // Posts
  async getPosts(): Promise<Post[]> {
    const data = await request<{ success: boolean; posts: Post[] }>('/posts');
    if (data?.success && data.posts) {
      return data.posts;
    }
    return StorageService.getPosts();
  },

  async createPost(postData: { authorId: string; type?: 'image' | 'video'; mediaUrl: string; caption: string; location?: string }): Promise<Post> {
    const data = await request<{ success: boolean; post: Post }>('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
    if (data?.success && data.post) {
      return data.post;
    }
    return StorageService.createPost(postData);
  },

  async toggleLikePost(postId: string, userId = 'usr_me'): Promise<{ isLiked: boolean; likesCount: number }> {
    const data = await request<{ success: boolean; isLiked: boolean; likesCount: number }>(`/posts/${postId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    if (data?.success) {
      return { isLiked: data.isLiked, likesCount: data.likesCount };
    }
    const updated = StorageService.toggleLikePost(postId);
    const post = updated.find(p => p.id === postId);
    return { isLiked: Boolean(post?.isLiked), likesCount: post?.likesCount || 0 };
  },

  async addComment(postId: string, text: string, userId = 'usr_me'): Promise<Comment | null> {
    const data = await request<{ success: boolean; comment: Comment }>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ userId, text }),
    });
    if (data?.success && data.comment) {
      return data.comment;
    }
    StorageService.addComment(postId, text);
    return null;
  },

  // Reels
  async getReels(): Promise<Reel[]> {
    const data = await request<{ success: boolean; reels: Reel[] }>('/reels');
    if (data?.success && data.reels) {
      return data.reels;
    }
    return StorageService.getReels();
  },

  async createReel(reelData: { authorId: string; videoUrl: string; caption: string; audioTrack?: string }): Promise<Reel> {
    const data = await request<{ success: boolean; reel: Reel }>('/reels', {
      method: 'POST',
      body: JSON.stringify(reelData),
    });
    if (data?.success && data.reel) {
      return data.reel;
    }
    return StorageService.createReel(reelData);
  },

  async toggleLikeReel(reelId: string, userId = 'usr_me'): Promise<{ isLiked: boolean; likesCount: number }> {
    const data = await request<{ success: boolean; isLiked: boolean; likesCount: number }>(`/reels/${reelId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    if (data?.success) {
      return { isLiked: data.isLiked, likesCount: data.likesCount };
    }
    const updated = StorageService.toggleLikeReel(reelId);
    const reel = updated.find(r => r.id === reelId);
    return { isLiked: Boolean(reel?.isLiked), likesCount: reel?.likesCount || 0 };
  },

  // Stories
  async getStories(): Promise<Story[]> {
    const data = await request<{ success: boolean; stories: Story[] }>('/stories');
    if (data?.success && data.stories) {
      return data.stories;
    }
    return StorageService.getStories();
  },

  async createStory(storyData: { userId: string; mediaUrl: string; type?: 'image' | 'video' }): Promise<Story> {
    const data = await request<{ success: boolean; story: Story }>('/stories', {
      method: 'POST',
      body: JSON.stringify(storyData),
    });
    if (data?.success && data.story) {
      return data.story;
    }
    return StorageService.addStory(storyData.mediaUrl, storyData.type);
  },

  // Conversations & Messages
  async getConversations(userId = 'usr_me'): Promise<Conversation[]> {
    const data = await request<{ success: boolean; conversations: Conversation[] }>(`/conversations?userId=${userId}`);
    if (data?.success && data.conversations) {
      return data.conversations;
    }
    return StorageService.getConversations();
  },

  async sendMessage(conversationId: string, content: { senderId?: string; text?: string; mediaUrl?: string; mediaType?: 'image' | 'video' }): Promise<Message | null> {
    const data = await request<{ success: boolean; message: Message }>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(content),
    });
    if (data?.success && data.message) {
      return data.message;
    }
    const res = StorageService.sendMessage(conversationId, content);
    return res.message;
  },

  // Users
  async getUsers(): Promise<User[]> {
    const data = await request<{ success: boolean; users: User[] }>('/users');
    if (data?.success && data.users) {
      return data.users;
    }
    return StorageService.getUsers();
  },

  async toggleFollow(targetUserId: string, currentUserId = 'usr_me'): Promise<User | null> {
    const data = await request<{ success: boolean; user: User }>(`/users/${targetUserId}/follow`, {
      method: 'POST',
      body: JSON.stringify({ currentUserId }),
    });
    if (data?.success && data.user) {
      return data.user;
    }
    const res = StorageService.toggleFollowUser(targetUserId);
    return res.user;
  },

  async updateProfile(updates: Partial<User>): Promise<User | null> {
    const data = await request<{ success: boolean; user: User }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (data?.success && data.user) {
      return data.user;
    }
    return StorageService.updateCurrentUser(updates);
  },

  // Upload
  async uploadMedia(base64: string): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64 }),
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.url;
    } catch {
      return null;
    }
  },
};
