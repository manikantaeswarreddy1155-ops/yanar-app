export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  isVerified?: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  website?: string;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
}

export interface Post {
  id: string;
  author: User;
  type: 'image' | 'video';
  mediaUrl: string;
  caption: string;
  location?: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: string;
  comments: Comment[];
}

export interface Story {
  id: string;
  user: User;
  mediaUrl: string;
  type: 'image' | 'video';
  hasUnseen?: boolean;
  createdAt: string;
}

export interface Reel {
  id: string;
  author: User;
  videoUrl: string;
  caption: string;
  audioTrack: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  createdAt: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage?: Message;
  unreadCount: number;
  messages: Message[];
  isOnline: boolean;
  typing?: boolean;
}

export interface CallSession {
  id: string;
  peer: User;
  type: 'audio' | 'video';
  direction: 'incoming' | 'outgoing';
  status: 'calling' | 'ringing' | 'connected' | 'ended';
  durationSeconds: number;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

export type NavTab = 'home' | 'reels' | 'chats' | 'profile';
