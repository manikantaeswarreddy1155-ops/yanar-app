import React, { useState, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal, 
  Sparkles, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Post } from '../../types';
import { Avatar } from '../common/Avatar';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onOpenComments: (post: Post) => void;
  onAddComment: (postId: string, text: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onSave,
  onOpenComments,
  onAddComment,
}) => {
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [showFullCaption, setShowFullCaption] = useState(false);
  const lastTapRef = useRef<number>(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected!
      if (!post.isLiked) {
        onLike(post.id);
        confetti({
          particleCount: 25,
          spread: 40,
          origin: { y: 0.6 },
          colors: ['#ec4899', '#f43f5e', '#a855f7'],
        });
      }
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 900);
    }
    lastTapRef.current = now;
  };

  const handleQuickComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(post.id, commentInput.trim());
    setCommentInput('');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.author.name} on YANAR`,
        text: post.caption,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Post link copied to clipboard! ✨');
    }
  };

  return (
    <article className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 md:rounded-2xl overflow-hidden mb-4 select-none">
      {/* Post Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar
            src={post.author.avatar}
            alt={post.author.name}
            size="sm"
            hasStory={true}
          />
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
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {post.location}
              </p>
            )}
          </div>
        </div>

        <button 
          onClick={() => alert(`Post by @${post.author.username}`)}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Post Media with Double-Tap Heart Overlay */}
      <div 
        onClick={handleDoubleTap}
        className="relative w-full aspect-square bg-zinc-900 flex items-center justify-center cursor-pointer overflow-hidden"
      >
        {post.type === 'video' ? (
          <div className="relative w-full h-full">
            <video
              src={post.mediaUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 text-white backdrop-blur-sm"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <img
            src={post.mediaUrl}
            alt={post.caption}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300"
          />
        )}

        {/* Double-tap animated popping heart */}
        {showHeartPop && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <Heart className="w-24 h-24 text-rose-500 fill-rose-500 filter drop-shadow-lg animate-heart-pop" />
          </div>
        )}
      </div>

      {/* Engagement Action Bar */}
      <div className="px-4 pt-3 pb-1 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike(post.id)}
              className="text-zinc-800 dark:text-zinc-200 hover:text-rose-500 transition-transform active:scale-125"
              aria-label="Like post"
            >
              <Heart
                className={`w-6 h-6 ${
                  post.isLiked ? 'text-rose-500 fill-rose-500' : ''
                }`}
              />
            </button>

            <button
              onClick={() => onOpenComments(post)}
              className="text-zinc-800 dark:text-zinc-200 hover:text-zinc-500 transition-transform active:scale-110"
              aria-label="Comment on post"
            >
              <MessageCircle className="w-6 h-6" />
            </button>

            <button
              onClick={handleShare}
              className="text-zinc-800 dark:text-zinc-200 hover:text-zinc-500 transition-transform active:scale-110"
              aria-label="Share post"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>

          <button
            onClick={() => onSave(post.id)}
            className="text-zinc-800 dark:text-zinc-200 hover:text-zinc-500 transition-transform active:scale-110"
            aria-label="Save post"
          >
            <Bookmark
              className={`w-6 h-6 ${
                post.isSaved ? 'text-zinc-900 dark:text-white fill-current' : ''
              }`}
            />
          </button>
        </div>

        {/* Likes Count */}
        <p className="text-xs font-bold text-zinc-900 dark:text-white">
          {post.likesCount.toLocaleString()} likes
        </p>

        {/* Caption */}
        <div className="text-xs space-y-1">
          <p className="text-zinc-900 dark:text-zinc-100">
            <span className="font-bold mr-1.5">{post.author.username}</span>
            {showFullCaption || post.caption.length <= 110
              ? post.caption
              : `${post.caption.slice(0, 110)}...`}
            {post.caption.length > 110 && !showFullCaption && (
              <button
                onClick={() => setShowFullCaption(true)}
                className="ml-1 text-zinc-400 font-medium hover:underline"
              >
                more
              </button>
            )}
          </p>
        </div>

        {/* Comments Link & Preview */}
        {post.commentsCount > 0 && (
          <button
            onClick={() => onOpenComments(post)}
            className="text-xs text-zinc-500 dark:text-zinc-400 font-medium hover:underline block"
          >
            View all {post.commentsCount} comments
          </button>
        )}

        {/* Recent 1 comment preview */}
        {post.comments.slice(0, 1).map((c) => (
          <p key={c.id} className="text-xs text-zinc-700 dark:text-zinc-300">
            <span className="font-bold mr-1.5">{c.user.username}</span>
            {c.text}
          </p>
        ))}

        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
          {post.createdAt}
        </p>
      </div>

      {/* Quick Comment Input */}
      <form
        onSubmit={handleQuickComment}
        className="flex items-center justify-between px-4 py-2.5 mt-1 border-t border-zinc-100 dark:border-zinc-800/60"
      >
        <input
          type="text"
          placeholder="Add a comment..."
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          className="flex-1 text-xs bg-transparent border-none text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
        />
        {commentInput.trim() && (
          <button
            type="submit"
            className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
          >
            Post
          </button>
        )}
      </form>
    </article>
  );
};
