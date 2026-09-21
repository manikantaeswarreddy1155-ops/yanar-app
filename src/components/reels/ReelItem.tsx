import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  Music, 
  Volume2, 
  VolumeX, 
  Play, 
  Sparkles,
  Check,
  UserPlus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Reel } from '../../types';
import { Avatar } from '../common/Avatar';

interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
  onLike: (reelId: string) => void;
  onOpenComments: (reel: Reel) => void;
  onToggleFollow?: (userId: string) => void;
}

export const ReelItem: React.FC<ReelItemProps> = ({
  reel,
  isActive,
  onLike,
  onOpenComments,
  onToggleFollow,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef<number>(0);

  // Auto-play when active in viewport, pause when scrolled away
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleVideoClick = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap to like
      if (!reel.isLiked) {
        onLike(reel.id);
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.5 },
          colors: ['#ec4899', '#f43f5e', '#8b5cf6'],
        });
      }
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 900);
    } else {
      togglePlay();
    }
    lastTapRef.current = now;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Reel by ${reel.author.name} on YANAR`,
        text: reel.caption,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Reel link copied to clipboard! ✨');
    }
  };

  return (
    <div className="reel-item relative w-full max-w-[420px] h-[calc(100vh-4.5rem)] md:h-[calc(100vh-2rem)] md:my-4 mx-auto rounded-none md:rounded-3xl overflow-hidden bg-black shadow-2xl flex items-center justify-center select-none">
      {/* Video element */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        loop
        playsInline
        muted={isMuted}
        onClick={handleVideoClick}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Play/Pause Overlay Indicator */}
      {!isPlaying && (
        <div 
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none"
        >
          <div className="w-16 h-16 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md">
            <Play className="w-8 h-8 fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Double-tap popping heart */}
      {showHeartPop && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Heart className="w-28 h-28 text-rose-500 fill-rose-500 filter drop-shadow-2xl animate-heart-pop" />
        </div>
      )}

      {/* Top Bar: Mute control */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
          className="p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Left Bottom: Creator details, Caption, Audio Track */}
      <div className="absolute bottom-4 left-4 right-20 z-20 space-y-3 pointer-events-auto text-white drop-shadow-md">
        {/* Creator Pill */}
        <div className="flex items-center gap-3">
          <Avatar src={reel.author.avatar} alt={reel.author.name} size="md" hasStory={true} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white drop-shadow">
                {reel.author.username}
              </span>
              {reel.author.isVerified && (
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              )}
            </div>
            <p className="text-xs text-white/80">{reel.author.name}</p>
          </div>

          {onToggleFollow && (
            <button
              onClick={() => onToggleFollow(reel.author.id)}
              className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                reel.author.isFollowing
                  ? 'bg-white/20 text-white backdrop-blur-md'
                  : 'bg-rose-500 text-white hover:bg-rose-600'
              }`}
            >
              {reel.author.isFollowing ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3" />
                  <span>Follow</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Caption */}
        <p className="text-xs text-white/95 line-clamp-2 leading-relaxed">
          {reel.caption}
        </p>

        {/* Audio Track Ticker */}
        <div className="flex items-center gap-2 text-xs text-white/90">
          <Music className="w-3.5 h-3.5 animate-bounce" />
          <span className="truncate max-w-[200px] text-[11px] font-medium">
            {reel.audioTrack}
          </span>
        </div>
      </div>

      {/* Right Side: Floating Actions Bar */}
      <div className="absolute bottom-6 right-3 z-20 flex flex-col items-center gap-5">
        {/* Like */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => onLike(reel.id)}
            className="p-3 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-transform active:scale-125"
          >
            <Heart
              className={`w-6 h-6 ${reel.isLiked ? 'text-rose-500 fill-rose-500' : ''}`}
            />
          </button>
          <span className="text-xs font-bold text-white drop-shadow">
            {reel.likesCount >= 1000
              ? `${(reel.likesCount / 1000).toFixed(1)}k`
              : reel.likesCount}
          </span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => onOpenComments(reel)}
            className="p-3 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-transform active:scale-110"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          <span className="text-xs font-bold text-white drop-shadow">
            {reel.commentsCount >= 1000
              ? `${(reel.commentsCount / 1000).toFixed(1)}k`
              : reel.commentsCount}
          </span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleShare}
            className="p-3 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-transform active:scale-110"
          >
            <Send className="w-6 h-6" />
          </button>
          <span className="text-xs font-bold text-white drop-shadow">
            {reel.sharesCount >= 1000
              ? `${(reel.sharesCount / 1000).toFixed(1)}k`
              : reel.sharesCount}
          </span>
        </div>

        {/* Bookmark */}
        <button
          onClick={() => alert('Reel saved to your collection! 🔖')}
          className="p-3 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-transform active:scale-110"
        >
          <Bookmark className="w-6 h-6" />
        </button>

        {/* Spinning Vinyl Audio Disk */}
        <div className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-900 overflow-hidden flex items-center justify-center animate-spin-slow shadow-lg">
          <img
            src={reel.author.avatar}
            alt="Audio"
            className="w-5 h-5 rounded-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};
