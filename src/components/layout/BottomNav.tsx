import React from 'react';
import { Home, Film, Plus, MessageSquare } from 'lucide-react';
import { NavTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  openUploadModal: () => void;
  unreadCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  openUploadModal,
  unreadCount,
}) => {
  const { user } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around h-16 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-2 pb-safe">
      <button
        onClick={() => setActiveTab('home')}
        className={`p-2 transition-colors ${
          activeTab === 'home' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'
        }`}
        aria-label="Home"
      >
        <Home className="w-6 h-6" />
      </button>

      <button
        onClick={() => setActiveTab('reels')}
        className={`p-2 transition-colors ${
          activeTab === 'reels' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'
        }`}
        aria-label="Reels"
      >
        <Film className="w-6 h-6" />
      </button>

      {/* Center Create Button */}
      <button
        onClick={openUploadModal}
        className="w-11 h-11 rounded-full bg-yanar-gradient flex items-center justify-center text-white shadow-lg shadow-rose-500/25 active:scale-95 transition-transform"
        aria-label="Create Post or Reel"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      <button
        onClick={() => setActiveTab('chats')}
        className={`relative p-2 transition-colors ${
          activeTab === 'chats' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'
        }`}
        aria-label="Messages"
      >
        <MessageSquare className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <button
        onClick={() => setActiveTab('profile')}
        className="p-1"
        aria-label="Profile"
      >
        {user ? (
          <div className={`rounded-full p-[2px] ${activeTab === 'profile' ? 'ring-2 ring-rose-500' : ''}`}>
            <Avatar src={user.avatar} alt={user.name} size="xs" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-zinc-400" />
        )}
      </button>
    </nav>
  );
};
