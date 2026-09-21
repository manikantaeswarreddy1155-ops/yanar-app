import React from 'react';

interface AvatarProps {
  src: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hasStory?: boolean;
  storySeen?: boolean;
  isOnline?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-lg',
  '2xl': 'w-28 h-28 text-2xl',
};

const ringPadding = {
  xs: 'p-[1.5px]',
  sm: 'p-[2px]',
  md: 'p-[2.5px]',
  lg: 'p-[3px]',
  xl: 'p-[3.5px]',
  '2xl': 'p-[4px]',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User avatar',
  size = 'md',
  hasStory = false,
  storySeen = false,
  isOnline = false,
  className = '',
  onClick,
}) => {
  const avatarImage = (
    <img
      src={src}
      alt={alt}
      onError={(e) => {
        // Fallback to placeholder if Unsplash image fails to load
        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=18181b&color=fff`;
      }}
      className={`${sizeClasses[size]} rounded-full object-cover select-none bg-zinc-800`}
    />
  );

  return (
    <div
      onClick={onClick}
      className={`relative inline-block ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {hasStory ? (
        <div
          className={`rounded-full ${ringPadding[size]} ${
            storySeen
              ? 'bg-zinc-400 dark:bg-zinc-700'
              : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 animate-pulse-slow'
          }`}
        >
          <div className="rounded-full p-[2px] bg-white dark:bg-zinc-950">
            {avatarImage}
          </div>
        </div>
      ) : (
        avatarImage
      )}

      {isOnline && (
        <span className="absolute bottom-0 right-0 block w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-950 rounded-full shadow-sm" />
      )}
    </div>
  );
};
