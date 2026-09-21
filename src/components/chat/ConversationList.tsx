import React, { useState } from 'react';
import { Search, Sparkles, Image, Video } from 'lucide-react';
import { Conversation } from '../../types';
import { Avatar } from '../common/Avatar';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participant.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white mb-3">
          Messages
        </h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900/60">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-400">
            No conversations found.
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = conv.id === selectedId;
            const lastMsg = conv.messages[conv.messages.length - 1];

            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-zinc-100 dark:bg-zinc-900'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={conv.participant.avatar}
                    alt={conv.participant.name}
                    size="md"
                    isOnline={conv.isOnline}
                  />

                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                        {conv.participant.name}
                      </p>
                      {conv.participant.isVerified && (
                        <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                      )}
                    </div>

                    {/* Last message preview */}
                    <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {lastMsg?.mediaType === 'image' && <Image className="w-3.5 h-3.5 inline mr-0.5" />}
                      {lastMsg?.mediaType === 'video' && <Video className="w-3.5 h-3.5 inline mr-0.5" />}
                      <span className="truncate">
                        {lastMsg?.text || (lastMsg?.mediaType ? 'Sent an attachment' : 'Started a conversation')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                  <span className="text-[10px] text-zinc-400">
                    {lastMsg?.createdAt || ''}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-rose-500 rounded-full">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
