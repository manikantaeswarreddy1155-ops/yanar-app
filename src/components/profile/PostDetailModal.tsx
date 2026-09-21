import React from 'react';
import { X, Heart, MessageCircle, Send, Bookmark, Sparkles } from 'lucide-react';
import { Post } from '../../types';
import { Avatar } from '../common/Avatar';

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  onLike,
  onSave,
}) => {
  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/85 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-4xl h-[90vh] md:h-[80vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Media Preview Column */}
        <div className="w-full md:w-3/5 h-1/2 md:h-full bg-black flex items-center justify-center overflow-hidden">
          {post.type === 'video' ? (
            <video
              src={post.mediaUrl}
              controls
              autoPlay
              loop
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt={post.caption}
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Content & Comments Column */}
        <div className="w-full md:w-2/5 h-1/2 md:h-full flex flex-col justify-between bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800">
            <Avatar src={post.author.avatar} alt={post.author.name} size="sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-zinc-900 dark:text-white">
                  {post.author.username}
                </span>
                {post.author.isVerified && (
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                )}
              </div>
              {post.location && (
                <p className="text-[11px] text-zinc-500">{post.location}</p>
              )}
            </div>
          </div>

          {/* Scrollable Caption & Comments */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Caption */}
            <div className="flex items-start gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
              <Avatar src={post.author.avatar} alt={post.author.name} size="xs" />
              <div>
                <p>
                  <span className="font-bold mr-1.5 text-zinc-900 dark:text-white">
                    {post.author.username}
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300">{post.caption}</span>
                </p>
                <span className="text-[10px] text-zinc-400 mt-1 block">{post.createdAt}</span>
              </div>
            </div>

            {/* Comments List */}
            {post.comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2.5">
                <Avatar src={c.user.avatar} alt={c.user.name} size="xs" />
                <div>
                  <p>
                    <span className="font-bold mr-1.5 text-zinc-900 dark:text-white">
                      {c.user.username}
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300">{c.text}</span>
                  </p>
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">{c.createdAt}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onLike(post.id)}
                  className="text-zinc-800 dark:text-zinc-200 hover:text-rose-500"
                >
                  <Heart
                    className={`w-6 h-6 ${post.isLiked ? 'text-rose-500 fill-rose-500' : ''}`}
                  />
                </button>
                <button className="text-zinc-800 dark:text-zinc-200">
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Post link copied!');
                  }}
                  className="text-zinc-800 dark:text-zinc-200"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>

              <button
                onClick={() => onSave(post.id)}
                className="text-zinc-800 dark:text-zinc-200"
              >
                <Bookmark
                  className={`w-6 h-6 ${post.isSaved ? 'text-zinc-900 dark:text-white fill-current' : ''}`}
                />
              </button>
            </div>

            <p className="text-xs font-bold text-zinc-900 dark:text-white">
              {post.likesCount.toLocaleString()} likes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
