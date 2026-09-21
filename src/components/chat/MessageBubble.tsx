import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMe }) => {
  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-3 max-w-[80%]`}>
      <div
        className={`relative px-4 py-2.5 rounded-2xl text-xs md:text-sm leading-relaxed break-words shadow-sm overflow-hidden ${
          isMe
            ? 'bg-gradient-to-tr from-rose-500 to-purple-600 text-white rounded-br-xs'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-xs'
        }`}
      >
        {/* Media Attachment if present */}
        {message.mediaUrl && (
          <div className="mb-2 rounded-xl overflow-hidden max-w-xs">
            {message.mediaType === 'video' ? (
              <video
                src={message.mediaUrl}
                controls
                className="w-full max-h-60 object-cover rounded-xl"
              />
            ) : (
              <img
                src={message.mediaUrl}
                alt="Attachment"
                className="w-full max-h-60 object-cover rounded-xl hover:scale-105 transition-transform cursor-pointer"
                onClick={() => window.open(message.mediaUrl, '_blank')}
              />
            )}
          </div>
        )}

        {/* Text */}
        {message.text && <p>{message.text}</p>}
      </div>

      {/* Timestamp & Status */}
      <div className="flex items-center gap-1 mt-1 px-1">
        <span className="text-[10px] text-zinc-400 font-medium">
          {message.createdAt}
        </span>
        {isMe && (
          <span className="text-zinc-400">
            {message.status === 'read' ? (
              <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <Check className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </span>
        )}
      </div>
    </div>
  );
};
