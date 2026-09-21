import React, { useState } from 'react';
import { 
  Grid, 
  Film, 
  Bookmark, 
  Settings, 
  Sparkles, 
  Heart, 
  MessageCircle, 
  Play, 
  ExternalLink 
} from 'lucide-react';
import { Post, Reel } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { EditProfileModal } from './EditProfileModal';
import { PostDetailModal } from './PostDetailModal';

interface ProfileViewProps {
  posts: Post[];
  reels: Reel[];
  onLikePost: (postId: string) => void;
  onSavePost: (postId: string) => void;
}

type ProfileTab = 'posts' | 'reels' | 'saved';

export const ProfileView: React.FC<ProfileViewProps> = ({
  posts,
  reels,
  onLikePost,
  onSavePost,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  if (!user) return null;

  // Filter user's own posts / saved posts
  const userPosts = posts.filter((p) => p.author.id === user.id || p.author.username === user.username);
  const displayPosts = userPosts.length > 0 ? userPosts : posts; // Fallback to all demo posts for visual richness
  const savedPosts = posts.filter((p) => p.isSaved);

  const highlights = [
    { title: 'Tokyo 🗼', cover: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=200&q=80' },
    { title: 'Studio 📸', cover: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&q=80' },
    { title: 'Nature 🌲', cover: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80' },
    { title: 'WebRTC ⚡', cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=200&q=80' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-12 space-y-8 select-none">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-12">
        <div className="flex-shrink-0">
          <Avatar
            src={user.avatar}
            alt={user.name}
            size="2xl"
            hasStory={true}
          />
        </div>

        <div className="flex-1 space-y-4 text-center md:text-left">
          {/* Username & Action Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
              {user.username}
              {user.isVerified && (
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
              )}
            </h1>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors"
            >
              Edit Profile
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Profile link copied to clipboard! ✨');
              }}
              className="px-4 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors"
            >
              Share Profile
            </button>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center md:justify-start gap-8 text-sm">
            <div>
              <span className="font-bold text-zinc-900 dark:text-white mr-1">
                {displayPosts.length}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">posts</span>
            </div>
            <div>
              <span className="font-bold text-zinc-900 dark:text-white mr-1">
                {user.followersCount.toLocaleString()}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">followers</span>
            </div>
            <div>
              <span className="font-bold text-zinc-900 dark:text-white mr-1">
                {user.followingCount.toLocaleString()}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">following</span>
            </div>
          </div>

          {/* Bio & Link */}
          <div className="text-xs md:text-sm space-y-1">
            <p className="font-bold text-zinc-900 dark:text-white">{user.name}</p>
            <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
              {user.bio}
            </p>
            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-rose-500 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Story Highlights Bar */}
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
        {highlights.map((h, i) => (
          <div key={i} className="flex flex-col items-center flex-shrink-0 space-y-1.5 cursor-pointer group">
            <div className="w-16 h-16 rounded-full p-[2px] border-2 border-zinc-200 dark:border-zinc-800 group-hover:border-rose-500 transition-colors">
              <img
                src={h.cover}
                alt={h.title}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {h.title}
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 flex justify-center gap-12">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 py-3 text-xs font-bold uppercase tracking-wider border-t-2 -mt-[1px] transition-colors ${
            activeTab === 'posts'
              ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Grid className="w-4 h-4" />
          Posts
        </button>

        <button
          onClick={() => setActiveTab('reels')}
          className={`flex items-center gap-2 py-3 text-xs font-bold uppercase tracking-wider border-t-2 -mt-[1px] transition-colors ${
            activeTab === 'reels'
              ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
              : 'border-zinc-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Film className="w-4 h-4" />
          Reels
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 py-3 text-xs font-bold uppercase tracking-wider border-t-2 -mt-[1px] transition-colors ${
            activeTab === 'saved'
              ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Saved
        </button>
      </div>

      {/* Grid Content */}
      {activeTab === 'posts' && (
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {displayPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="group relative aspect-square bg-zinc-900 md:rounded-xl overflow-hidden cursor-pointer"
            >
              <img
                src={post.mediaUrl}
                alt={post.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Hover overlay with like & comment counts */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs md:text-sm">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 fill-white" />
                  {post.likesCount}
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 fill-white" />
                  {post.commentsCount}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'reels' && (
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {reels.map((reel) => (
            <div
              key={reel.id}
              className="group relative aspect-[9/16] bg-zinc-900 md:rounded-xl overflow-hidden cursor-pointer"
            >
              <video
                src={reel.videoUrl}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-bold drop-shadow">
                <Play className="w-3.5 h-3.5 fill-white" />
                {reel.likesCount}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {savedPosts.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-zinc-400 text-xs">
              No saved posts yet. Tap the bookmark icon on any post to save it here.
            </div>
          ) : (
            savedPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="group relative aspect-square bg-zinc-900 md:rounded-xl overflow-hidden cursor-pointer"
              >
                <img
                  src={post.mediaUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover"
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Post Detail Modal */}
      <PostDetailModal
        post={selectedPost}
        isOpen={Boolean(selectedPost)}
        onClose={() => setSelectedPost(null)}
        onLike={onLikePost}
        onSave={onSavePost}
      />
    </div>
  );
};
