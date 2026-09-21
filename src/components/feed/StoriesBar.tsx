import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Story } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { StoryViewer } from './StoryViewer';

interface StoriesBarProps {
  stories: Story[];
  onAddStory: () => void;
  onStoryViewed?: (storyId: string) => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  stories,
  onAddStory,
  onStoryViewed,
}) => {
  const { user } = useAuth();
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);

  // Group stories by user (or display individual creator stories)
  const myStory = stories.find(s => s.user.id === user?.id);
  const otherStories = stories.filter(s => s.user.id !== user?.id);

  return (
    <>
      <div className="flex items-center gap-4 px-4 py-4 overflow-x-auto no-scrollbar border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
        {/* Current user add / view story */}
        <div className="flex flex-col items-center flex-shrink-0 space-y-1.5 cursor-pointer group">
          <div className="relative" onClick={() => (myStory ? setSelectedStoryIndex(0) : onAddStory())}>
            <Avatar
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
              alt={user?.name || 'You'}
              size="lg"
              hasStory={Boolean(myStory)}
              storySeen={!myStory?.hasUnseen}
            />
            {!myStory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddStory();
                }}
                className="absolute bottom-0 right-0 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950 shadow-sm group-hover:scale-110 transition-transform"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            )}
          </div>
          <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium truncate max-w-[70px]">
            Your Story
          </span>
        </div>

        {/* Other users' stories */}
        {otherStories.map((story, index) => {
          const globalIndex = myStory ? index + 1 : index;
          return (
            <div
              key={story.id}
              onClick={() => setSelectedStoryIndex(globalIndex)}
              className="flex flex-col items-center flex-shrink-0 space-y-1.5 cursor-pointer group"
            >
              <Avatar
                src={story.user.avatar}
                alt={story.user.name}
                size="lg"
                hasStory={true}
                storySeen={!story.hasUnseen}
                className="group-hover:scale-105 transition-transform"
              />
              <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[72px]">
                {story.user.username}
              </span>
            </div>
          );
        })}
      </div>

      {/* Story Viewer Modal */}
      {selectedStoryIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={selectedStoryIndex}
          onClose={() => setSelectedStoryIndex(null)}
          onStoryViewed={onStoryViewed}
        />
      )}
    </>
  );
};
