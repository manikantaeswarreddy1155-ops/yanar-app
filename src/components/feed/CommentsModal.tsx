import React, { useState } from 'react';
import { X, Send, Heart } from 'lucide-react';
import { Post } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';

interface CommentsModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  post,
  isOpen,
  onClose,
  onAddComment,
}) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');

  if (!isOpen || !post) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText.trim());
    setCommentText('');
  };

  const handleEmojiClick = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg h-[80vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            Comments ({post.commentsCount})
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post Summary / Caption Header */}
        <div className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800">
          <Avatar src={post.author.avatar} alt={post.author.name} size="sm" />
          <div className="text-xs">
            <span className="font-bold text-zinc-900 dark:text-white mr-1.5">
              {post.author.username}
            </span>
            <span className="text-zinc-600 dark:text-zinc-300">{post.caption}</span>
            <p className="text-[10px] text-zinc-400 mt-1">{post.createdAt}</p>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {post.comments.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-sm">
              No comments yet. Be the first to start the conversation!
            </div>
          ) : (
            post.comments.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3 group">
                <div className="flex items-start gap-3">
                  <Avatar src={c.user.avatar} alt={c.user.name} size="sm" />
                  <div className="text-xs space-y-0.5">
                    <p>
                      <span className="font-bold text-zinc-900 dark:text-white mr-1.5">
                        {c.user.username}
                      </span>
                      <span className="text-zinc-700 dark:text-zinc-300">{c.text}</span>
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-medium">
                      <span>{c.createdAt}</span>
                      {c.likesCount > 0 && <span>{c.likesCount} likes</span>}
                      <button className="hover:text-zinc-600 dark:hover:text-zinc-200">Reply</button>
                    </div>
                  </div>
                </div>

                <button className="p-1 text-zinc-400 hover:text-rose-500">
                  <Heart className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Emoji Bar */}
        <div className="flex items-center justify-around px-4 py-2 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800/50">
          {['❤️', '🔥', '🙌', '👏', '😍', '✨', '💯', '🚀'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="text-lg hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800"
        >
          {user && <Avatar src={user.avatar} alt={user.name} size="xs" />}
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="p-2 text-rose-500 hover:text-rose-600 disabled:opacity-40 font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
