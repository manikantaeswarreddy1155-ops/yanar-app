import React from 'react';
import { Sparkles, MessageSquare, Sun, Moon } from 'lucide-react';
import { NavTab } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface TopHeaderProps {
  setActiveTab: (tab: NavTab) => void;
  unreadCount: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ setActiveTab, unreadCount }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div 
        onClick={() => setActiveTab('home')}
        className="flex items-center gap-2 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-lg bg-yanar-gradient flex items-center justify-center shadow-md">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
          YAN<span className="text-yanar-gradient">AR</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          onClick={() => setActiveTab('chats')}
          className="relative p-2 text-zinc-700 dark:text-zinc-200"
        >
          <MessageSquare className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
