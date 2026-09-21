import React, { useState, useEffect } from 'react';
import { NavTab, Post, Reel, Story, Conversation, User } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CallProvider } from './context/CallContext';
import { ApiClient } from './services/apiClient';
import { socketService } from './services/socketService';
import { StorageService } from './services/storageService';

// Layout
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { BottomNav } from './components/layout/BottomNav';
import { RightSidebar } from './components/layout/RightSidebar';

// Views
import { FeedView } from './components/feed/FeedView';
import { ReelsView } from './components/reels/ReelsView';
import { ChatView } from './components/chat/ChatView';
import { ProfileView } from './components/profile/ProfileView';

// Modals
import { CallModal } from './components/calling/CallModal';
import { UploadModal } from './components/upload/UploadModal';
import { AuthModal } from './components/auth/AuthModal';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Load from live SQLite database via ApiClient
  useEffect(() => {
    async function loadData() {
      const [fetchedPosts, fetchedReels, fetchedStories, fetchedConvs, fetchedUsers] = await Promise.all([
        ApiClient.getPosts(),
        ApiClient.getReels(),
        ApiClient.getStories(),
        ApiClient.getConversations(user?.id || 'usr_me'),
        ApiClient.getUsers(),
      ]);

      setPosts(fetchedPosts);
      setReels(fetchedReels);
      setStories(fetchedStories);
      setConversations(fetchedConvs);
      setUsers(fetchedUsers);
    }

    loadData();
  }, [user?.id]);

  // Connect WebSocket for real-time messaging & call signaling
  useEffect(() => {
    if (user?.id) {
      socketService.connect(user.id);

      // Listen for real-time chat messages
      const unsubscribe = socketService.onChatMessage((data) => {
        const { conversationId, message } = data;
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === conversationId) {
              return {
                ...c,
                unreadCount: c.unreadCount + 1,
                messages: [...c.messages, message as any],
              };
            }
            return c;
          })
        );
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user?.id]);

  // Post handlers (backed by SQLite database)
  const handleLikePost = async (postId: string) => {
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      })
    );

    await ApiClient.toggleLikePost(postId, user?.id || 'usr_me');
  };

  const handleSavePost = (postId: string) => {
    const updated = StorageService.toggleSavePost(postId);
    setPosts(updated);
  };

  const handleAddComment = async (postId: string, text: string) => {
    const newComment = await ApiClient.addComment(postId, text, user?.id || 'usr_me');
    if (newComment) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, commentsCount: p.commentsCount + 1, comments: [newComment, ...p.comments] }
            : p
        )
      );
    } else {
      // Fallback
      setPosts(StorageService.getPosts());
    }
  };

  // Reel handlers
  const handleLikeReel = async (reelId: string) => {
    setReels((prev) =>
      prev.map((r) => {
        if (r.id === reelId) {
          const isLiked = !r.isLiked;
          return {
            ...r,
            isLiked,
            likesCount: isLiked ? r.likesCount + 1 : Math.max(0, r.likesCount - 1),
          };
        }
        return r;
      })
    );

    await ApiClient.toggleLikeReel(reelId, user?.id || 'usr_me');
  };

  // Story handlers
  const handleStoryViewed = (storyId: string) => {
    const updated = StorageService.markStorySeen(storyId);
    setStories(updated);
  };

  // Follow handler
  const handleToggleFollow = async (targetUserId: string) => {
    const updatedUser = await ApiClient.toggleFollow(targetUserId, user?.id || 'usr_me');
    if (updatedUser) {
      setUsers((prev) => prev.map((u) => (u.id === targetUserId ? updatedUser : u)));
      setPosts((prev) =>
        prev.map((p) => (p.author.id === targetUserId ? { ...p, author: updatedUser } : p))
      );
    }
  };

  // Chat handlers
  const handleSendMessage = async (
    conversationId: string,
    content: { text?: string; mediaUrl?: string; mediaType?: 'image' | 'video' }
  ) => {
    // Optimistic local add
    const tempMsg = {
      id: `msg_${Date.now()}`,
      senderId: user?.id || 'usr_me',
      text: content.text,
      mediaUrl: content.mediaUrl,
      mediaType: content.mediaType,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered' as const,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, tempMsg] }
          : c
      )
    );

    // Send to backend database
    await ApiClient.sendMessage(conversationId, {
      senderId: user?.id || 'usr_me',
      text: content.text,
      mediaUrl: content.mediaUrl,
      mediaType: content.mediaType,
    });
  };

  const handleMarkRead = (conversationId: string) => {
    StorageService.markMessagesRead(conversationId);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
    );
  };

  // Creation handlers
  const handleCreatePost = (data: { mediaUrl: string; caption: string; location?: string; type?: 'image' | 'video' }) => {
    // Save to database
    ApiClient.createPost({
      authorId: user?.id || 'usr_me',
      mediaUrl: data.mediaUrl,
      caption: data.caption,
      location: data.location,
      type: data.type,
    }).then((newPost) => {
      setPosts((prev) => [newPost, ...prev.filter(p => p.id !== newPost.id)]);
    });

    // Instant local feedback
    const localPost = StorageService.createPost(data);
    setPosts((prev) => [localPost, ...prev]);
    setActiveTab('home');
    return localPost;
  };

  const handleCreateReel = (data: { videoUrl: string; caption: string; audioTrack?: string }) => {
    ApiClient.createReel({
      authorId: user?.id || 'usr_me',
      videoUrl: data.videoUrl,
      caption: data.caption,
      audioTrack: data.audioTrack,
    }).then((newReel) => {
      setReels((prev) => [newReel, ...prev.filter(r => r.id !== newReel.id)]);
    });

    const localReel = StorageService.createReel(data);
    setReels((prev) => [localReel, ...prev]);
    setActiveTab('reels');
    return localReel;
  };

  const handleAddStory = (mediaUrl: string, type: 'image' | 'video' = 'image') => {
    ApiClient.createStory({
      userId: user?.id || 'usr_me',
      mediaUrl,
      type,
    }).then((newStory) => {
      setStories((prev) => [newStory, ...prev.filter(s => s.id !== newStory.id)]);
    });

    const localStory = StorageService.addStory(mediaUrl, type);
    setStories((prev) => [localStory, ...prev]);
    return localStory;
  };

  // Total unread messages
  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Desktop Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openUploadModal={() => setIsUploadModalOpen(true)}
        unreadMessagesCount={totalUnread}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top App Bar */}
        {activeTab !== 'reels' && activeTab !== 'chats' && (
          <TopHeader
            setActiveTab={setActiveTab}
            unreadCount={totalUnread}
          />
        )}

        {/* View Switcher */}
        <main className="flex-1 flex justify-center w-full">
          {activeTab === 'home' && (
            <div className="flex justify-center w-full">
              <FeedView
                posts={posts}
                stories={stories}
                onLikePost={handleLikePost}
                onSavePost={handleSavePost}
                onAddComment={handleAddComment}
                onAddStory={() => setIsUploadModalOpen(true)}
                onStoryViewed={handleStoryViewed}
              />
              <RightSidebar
                users={users}
                onToggleFollow={handleToggleFollow}
                setActiveTab={setActiveTab}
              />
            </div>
          )}

          {activeTab === 'reels' && (
            <ReelsView
              reels={reels}
              onLikeReel={handleLikeReel}
              onToggleFollow={handleToggleFollow}
            />
          )}

          {activeTab === 'chats' && (
            <ChatView
              conversations={conversations}
              onSendMessage={handleSendMessage}
              onMarkRead={handleMarkRead}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              posts={posts}
              reels={reels}
              onLikePost={handleLikePost}
              onSavePost={handleSavePost}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openUploadModal={() => setIsUploadModalOpen(true)}
          unreadCount={totalUnread}
        />
      </div>

      {/* Global Modals */}
      <CallModal />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onCreatePost={handleCreatePost}
        onCreateReel={handleCreateReel}
        onAddStory={handleAddStory}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CallProvider>
          <AppContent />
        </CallProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
