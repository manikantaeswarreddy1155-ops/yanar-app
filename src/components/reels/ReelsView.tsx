import React, { useState, useRef } from 'react';
import { Reel } from '../../types';
import { ReelItem } from './ReelItem';
import { CommentsModal } from '../feed/CommentsModal';

interface ReelsViewProps {
  reels: Reel[];
  onLikeReel: (reelId: string) => void;
  onToggleFollow?: (userId: string) => void;
}

export const ReelsView: React.FC<ReelsViewProps> = ({
  reels,
  onLikeReel,
  onToggleFollow,
}) => {
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [selectedReelForComments, setSelectedReelForComments] = useState<Reel | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const currentIndex = Math.round(scrollTop / clientHeight);
    if (currentIndex !== activeReelIndex && currentIndex >= 0 && currentIndex < reels.length) {
      setActiveReelIndex(currentIndex);
    }
  };

  // Turn selected reel into a pseudo-post for the comments modal
  const pseudoPost = selectedReelForComments
    ? {
        id: selectedReelForComments.id,
        author: selectedReelForComments.author,
        type: 'video' as const,
        mediaUrl: selectedReelForComments.videoUrl,
        caption: selectedReelForComments.caption,
        likesCount: selectedReelForComments.likesCount,
        commentsCount: selectedReelForComments.commentsCount,
        createdAt: selectedReelForComments.createdAt,
        comments: [
          {
            id: 'rc1',
            user: selectedReelForComments.author,
            text: 'Drop a comment if you enjoyed this reel! 🔥',
            createdAt: '1h ago',
            likesCount: 12,
          },
        ],
      }
    : null;

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] md:h-screen flex justify-center bg-black overflow-hidden select-none">
      {/* Scrollable vertical snap container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="reels-container w-full h-full overflow-y-scroll no-scrollbar py-2"
      >
        {reels.map((reel, index) => (
          <ReelItem
            key={reel.id}
            reel={reel}
            isActive={index === activeReelIndex}
            onLike={onLikeReel}
            onOpenComments={(r) => setSelectedReelForComments(r)}
            onToggleFollow={onToggleFollow}
          />
        ))}
      </div>

      {/* Reel Comments Sheet */}
      {pseudoPost && (
        <CommentsModal
          post={pseudoPost}
          isOpen={Boolean(selectedReelForComments)}
          onClose={() => setSelectedReelForComments(null)}
          onAddComment={(_postId, text) => {
            alert(`Comment added to reel: "${text}" ✨`);
            setSelectedReelForComments(null);
          }}
        />
      )}
    </div>
  );
};
