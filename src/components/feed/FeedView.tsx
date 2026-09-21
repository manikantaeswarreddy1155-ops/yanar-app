import React, { useState } from 'react';
import { Post, Story } from '../../types';
import { StoriesBar } from './StoriesBar';
import { PostCard } from './PostCard';
import { CommentsModal } from './CommentsModal';

interface FeedViewProps {
  posts: Post[];
  stories: Story[];
  onLikePost: (postId: string) => void;
  onSavePost: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onAddStory: () => void;
  onStoryViewed?: (storyId: string) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  posts,
  stories,
  onLikePost,
  onSavePost,
  onAddComment,
  onAddStory,
  onStoryViewed,
}) => {
  const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null);

  const activePostInModal = selectedPostForComments
    ? posts.find((p) => p.id === selectedPostForComments.id) || selectedPostForComments
    : null;

  return (
    <div className="w-full max-w-[630px] mx-auto pb-20 md:pb-10 pt-2">
      {/* Stories Carousel */}
      <div className="mb-4 md:rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <StoriesBar
          stories={stories}
          onAddStory={onAddStory}
          onStoryViewed={onStoryViewed}
        />
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={onLikePost}
            onSave={onSavePost}
            onOpenComments={(p) => setSelectedPostForComments(p)}
            onAddComment={onAddComment}
          />
        ))}
      </div>

      {/* Comments Drawer / Modal */}
      <CommentsModal
        post={activePostInModal}
        isOpen={Boolean(selectedPostForComments)}
        onClose={() => setSelectedPostForComments(null)}
        onAddComment={onAddComment}
      />
    </div>
  );
};
