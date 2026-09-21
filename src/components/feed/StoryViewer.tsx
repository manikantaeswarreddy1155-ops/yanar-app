import React, { useState, useEffect } from 'react';
import { X, Heart, Send, Pause, Play } from 'lucide-react';
import { Story } from '../../types';
import { Avatar } from '../common/Avatar';

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  onStoryViewed?: (storyId: string) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialIndex,
  onClose,
  onStoryViewed,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [replyText, setReplyText] = useState('');

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (currentStory && onStoryViewed) {
      onStoryViewed(currentStory.id);
    }
  }, [currentStory, onStoryViewed]);

  // 5-second auto progression timer
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Go to next story or close
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2; // updates every 100ms, 100/2 * 100ms = 5000ms = 5s
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, stories.length, onClose]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none animate-fade-in">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 text-white/80 hover:text-white bg-black/40 rounded-full backdrop-blur-sm"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Container */}
      <div 
        className="relative w-full max-w-sm h-full max-h-[86vh] md:rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl flex flex-col justify-between"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Top Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 p-3 pt-4 space-y-2 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex gap-1">
            {stories.map((s, idx) => {
              let barProgress = 0;
              if (idx < currentIndex) barProgress = 100;
              else if (idx === currentIndex) barProgress = progress;

              return (
                <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-100 ease-linear"
                    style={{ width: `${barProgress}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* User info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar src={currentStory.user.avatar} alt={currentStory.user.name} size="sm" />
              <div>
                <span className="text-xs font-bold text-white block">
                  {currentStory.user.username}
                </span>
                <span className="text-[10px] text-white/70 block">
                  {currentStory.createdAt}
                </span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(!isPaused);
              }}
              className="p-1 text-white/80 hover:text-white"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Media */}
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {currentStory.type === 'video' ? (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              loop
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover"
            />
          )}

          {/* Left / Right tap zones */}
          <div 
            onClick={handlePrev}
            className="absolute left-0 top-16 bottom-16 w-1/3 cursor-pointer z-10"
          />
          <div 
            onClick={handleNext}
            className="absolute right-0 top-16 bottom-16 w-1/3 cursor-pointer z-10"
          />
        </div>

        {/* Bottom Reply Bar */}
        <div className="relative z-20 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={`Reply to ${currentStory.user.username}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && replyText.trim()) {
                  alert(`Sent reply: "${replyText}" to @${currentStory.user.username}`);
                  setReplyText('');
                }
              }}
              className="w-full px-4 py-2 text-xs rounded-full bg-white/20 border border-white/20 text-white placeholder-white/70 focus:outline-none focus:bg-white/30 backdrop-blur-md"
            />
          </div>

          <button
            onClick={() => setIsLiked(!isLiked)}
            className="p-2 text-white transition-transform active:scale-125"
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'text-rose-500 fill-rose-500' : ''}`} />
          </button>

          {replyText.trim() && (
            <button
              onClick={() => {
                alert(`Sent reply: "${replyText}" to @${currentStory.user.username}`);
                setReplyText('');
              }}
              className="p-2 text-white"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
