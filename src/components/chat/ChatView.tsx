import React, { useState } from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import { Conversation } from '../../types';
import { ConversationList } from './ConversationList';
import { ChatRoom } from './ChatRoom';

interface ChatViewProps {
  conversations: Conversation[];
  onSendMessage: (conversationId: string, content: { text?: string; mediaUrl?: string; mediaType?: 'image' | 'video' }) => void;
  onMarkRead: (conversationId: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversations,
  onSendMessage,
  onMarkRead,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id || null);

  const activeConversation = conversations.find((c) => c.id === selectedId) || null;

  const handleSelect = (conv: Conversation) => {
    setSelectedId(conv.id);
    onMarkRead(conv.id);
  };

  return (
    <div className="w-full h-[calc(100vh-4rem)] md:h-screen flex bg-white dark:bg-zinc-950 overflow-hidden border-x border-zinc-200 dark:border-zinc-800">
      {/* Conversations List (full width on mobile if none selected, or hidden when chat open) */}
      <div
        className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full ${
          selectedId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      {/* Active Chat Room (full width on mobile when selected) */}
      <div
        className={`flex-1 h-full ${
          selectedId ? 'flex' : 'hidden md:flex'
        } flex-col`}
      >
        {activeConversation ? (
          <ChatRoom
            conversation={activeConversation}
            onBack={() => setSelectedId(null)}
            onSendMessage={onSendMessage}
          />
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-zinc-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-2">
                Your Messages <Sparkles className="w-4 h-4 text-rose-500" />
              </h3>
              <p className="text-sm text-zinc-500 max-w-sm mt-1">
                Send private photos, videos, and start real-time WebRTC voice or video calls with your friends.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
