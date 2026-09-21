import React from 'react';
import { Sparkles, Check, UserPlus } from 'lucide-react';
import { User, NavTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';

interface RightSidebarProps {
  users: User[];
  onToggleFollow: (userId: string) => void;
  setActiveTab: (tab: NavTab) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  users,
  onToggleFollow,
  setActiveTab,
}) => {
  const { user } = useAuth();
  const suggestions = users.filter(u => u.id !== user?.id).slice(0, 4);

  return (
    <aside className="hidden lg:block w-80 py-8 px-4 space-y-6 select-none">
      {/* Current User Snapshot */}
      {user && (
        <div className="flex items-center justify-between p-2">
          <div 
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <Avatar src={user.avatar} alt={user.name} size="md" />
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-rose-500 transition-colors">
                {user.username}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {user.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('profile')}
            className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
          >
            View
          </button>
        </div>
      )}

      {/* Suggested for you */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Suggested For You
          </span>
          <span className="text-xs font-semibold text-zinc-400 cursor-pointer hover:text-zinc-200">
            See All
          </span>
        </div>

        <div className="space-y-2">
          {suggestions.map((sUser) => (
            <div
              key={sUser.id}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900/60 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={sUser.avatar} alt={sUser.name} size="sm" />
                <div className="truncate">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                      {sUser.username}
                    </p>
                    {sUser.isVerified && (
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">
                    Suggested for you
                  </p>
                </div>
              </div>

              <button
                onClick={() => onToggleFollow(sUser.id)}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  sUser.isFollowing
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                    : 'bg-rose-500 text-white hover:bg-rose-600'
                }`}
              >
                {sUser.isFollowing ? (
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
            </div>
          ))}
        </div>
      </div>

      {/* Trending Tags */}
      <div className="p-3.5 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 space-y-2.5">
        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
          🔥 Trending in YANAR
        </p>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {['#tokyostyle', '#webrtc2026', '#cinematography', '#fooddesign', '#digitalnomad'].map(
            (tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium hover:text-rose-500 cursor-pointer transition-colors"
              >
                {tag}
              </span>
            )
          )}
        </div>
      </div>

      {/* Footers */}
      <div className="px-2 text-[11px] text-zinc-400 dark:text-zinc-600 space-y-2">
        <p className="space-x-2">
          <span>About</span>•<span>Help</span>•<span>Press</span>•<span>API</span>•
          <span>Jobs</span>•<span>Privacy</span>•<span>Terms</span>
        </p>
        <p>© 2026 YANAR SOCIAL FROM ANGRAVITY</p>
      </div>
    </aside>
  );
};
