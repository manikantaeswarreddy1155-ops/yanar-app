import React, { useState } from 'react';
import { 
  Home, 
  Film, 
  MessageSquare, 
  PlusSquare, 
  User as UserIcon, 
  Sun, 
  Moon, 
  Sparkles,
  ChevronDown,
  LogOut,
  Database
} from 'lucide-react';
import { NavTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';
import { isSupabaseConfigured } from '../../services/supabaseClient';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  openUploadModal: () => void;
  unreadMessagesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openUploadModal,
  unreadMessagesCount,
}) => {
  const { user, demoUsers, switchUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-6 h-6" /> },
    { id: 'reels', label: 'Reels', icon: <Film className="w-6 h-6" /> },
    { 
      id: 'chats', 
      label: 'Messages', 
      icon: <MessageSquare className="w-6 h-6" />,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined 
    },
    { id: 'profile', label: 'Profile', icon: <UserIcon className="w-6 h-6" /> },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-18 xl:w-64 h-screen sticky top-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-6 select-none z-30 transition-all">
      {/* Top section: Logo & Nav items */}
      <div className="space-y-6">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 px-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-yanar-gradient flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="hidden xl:inline text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
            YAN<span className="text-yanar-gradient">AR</span>
          </span>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1.5 pt-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-3.5 py-3 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-rose-500 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="hidden xl:inline text-[15px]">{item.label}</span>
              </button>
            );
          })}

          {/* Upload Button */}
          <button
            onClick={openUploadModal}
            className="w-full flex items-center gap-4 px-3.5 py-3 rounded-xl font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all group"
          >
            <div className="w-6 h-6 rounded-lg border-2 border-dashed border-zinc-400 dark:border-zinc-500 group-hover:border-rose-500 flex items-center justify-center transition-colors">
              <PlusSquare className="w-4 h-4 text-zinc-600 dark:text-zinc-300 group-hover:text-rose-500 transition-colors" />
            </div>
            <span className="hidden xl:inline text-[15px] font-medium">Create</span>
          </button>
        </nav>
      </div>

      {/* Bottom section: Settings, Switcher & User Profile */}
      <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800/80">
        {/* Supabase indicator badge */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/60 rounded-lg">
          <Database className="w-3.5 h-3.5 text-emerald-500" />
          <span className="truncate">
            {isSupabaseConfigured ? 'Supabase: Connected' : 'Storage: Free-Tier Ready (Local)'}
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="hidden xl:inline text-sm font-medium">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        {/* User Account / Switcher */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={user.avatar} alt={user.name} size="sm" />
                <div className="hidden xl:block text-left truncate">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    @{user.username}
                  </p>
                </div>
              </div>
              <ChevronDown className="hidden xl:block w-4 h-4 text-zinc-400" />
            </button>

            {/* Switch user popover */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 space-y-1">
                <p className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Switch Account
                </p>
                {demoUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u);
                      setShowUserMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                      u.id === user.id
                        ? 'bg-zinc-100 dark:bg-zinc-800/80 font-semibold'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <Avatar src={u.avatar} alt={u.name} size="xs" />
                    <div className="truncate">
                      <p className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                        {u.name}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">@{u.username}</p>
                    </div>
                  </button>
                ))}

                <div className="pt-2 mt-1 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
