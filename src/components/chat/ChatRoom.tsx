import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, 
  Video, 
  ArrowLeft, 
  Image as ImageIcon, 
  Send, 
  Info, 
  X,
  Sparkles
} from 'lucide-react';
import { Conversation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';
import { MessageBubble } from './MessageBubble';

interface ChatRoomProps {
  conversation: Conversation;
  onBack?: () => void;
  onSendMessage: (conversationId: string, content: { text?: string; mediaUrl?: string; mediaType?: 'image' | 'video' }) => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  conversation,
  onBack,
  onSendMessage,
}) => {
  const { user } = useAuth();
  const { startCall } = useCall();
  const [inputText, setInputText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedMedia) return;

    onSendMessage(conversation.id, {
      text: inputText.trim() || undefined,
      mediaUrl: selectedMedia?.url,
      mediaType: selectedMedia?.type,
    });

    setInputText('');
    setSelectedMedia(null);

    // Optional simulated reply after 1.5 seconds if sent to a friend
    if (conversation.participant.id !== user?.id) {
      setTimeout(() => {
        const replies = [
          'Sounds fantastic! Let’s hop on a call.',
          'Love this perspective! Totally agree.',
          'Got it! Looking into it right now.',
          'Awesome, thanks for sending that over!',
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        onSendMessage(conversation.id, { text: randomReply });
      }, 1500);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedMedia({
        url: event.target?.result as string,
        type: isVideo ? 'video' : 'image',
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* Chat Room Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 -ml-1 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <Avatar
            src={conversation.participant.avatar}
            alt={conversation.participant.name}
            size="md"
            isOnline={conversation.isOnline}
          />

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                {conversation.participant.name}
              </h3>
              {conversation.participant.isVerified && (
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {conversation.isOnline ? (
                <span className="text-emerald-500 font-medium">Active now</span>
              ) : (
                `@${conversation.participant.username}`
              )}
            </p>
          </div>
        </div>

        {/* Action Controls: WebRTC Audio and Video Call Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => startCall(conversation.participant, 'audio')}
            className="p-2.5 rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Start Audio Call (WebRTC)"
            aria-label="Start Audio Call"
          >
            <Phone className="w-5 h-5" />
          </button>

          <button
            onClick={() => startCall(conversation.participant, 'video')}
            className="p-2.5 rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Start Video Call (WebRTC)"
            aria-label="Start Video Call"
          >
            <Video className="w-5 h-5" />
          </button>

          <button
            onClick={() => alert(`Details for @${conversation.participant.username}`)}
            className="p-2.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            title="Conversation Details"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {conversation.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isMe={message.senderId === user?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Media Attachment Preview */}
      {selectedMedia && (
        <div className="relative p-3 bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black">
            {selectedMedia.type === 'video' ? (
              <video src={selectedMedia.url} className="w-full h-full object-cover" />
            ) : (
              <img src={selectedMedia.url} alt="Upload preview" className="w-full h-full object-cover" />
            )}
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-1 right-1 p-0.5 bg-black/60 text-white rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            {selectedMedia.type === 'video' ? 'Video attached' : 'Photo attached'}
          </p>
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,video/*"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          title="Attach photo or video"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <input
          type="text"
          placeholder="Message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-4 py-2.5 text-sm rounded-full bg-zinc-100 dark:bg-zinc-800/80 border-none text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
        />

        <button
          type="submit"
          disabled={!inputText.trim() && !selectedMedia}
          className="p-2.5 rounded-full bg-yanar-gradient text-white shadow-md disabled:opacity-40 hover:opacity-95 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
