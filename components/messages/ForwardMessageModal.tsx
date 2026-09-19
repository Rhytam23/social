import React, { useState } from 'react';
import { ConversationItem, MessageData } from '../../types/ui';
import { IconForward, IconSearch, IconX } from '../ui/icons';

export interface ForwardMessageModalProps {
  message: MessageData | null;
  conversations: ConversationItem[];
  isOpen: boolean;
  onClose: () => void;
  onForwardToConversation: (targetConvId: string, message: MessageData) => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  message,
  conversations,
  isOpen,
  onClose,
  onForwardToConversation,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen || !message) return null;

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm floating overflow-hidden flex flex-col p-5 gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <IconForward className="w-4 h-4 text-emerald-400" />
            Forward Message
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Message Snippet */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300">
          <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Preview</span>
          <p className="truncate text-slate-200">{message.content}</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search conversation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field pl-9 pr-3"
          />
        </div>

        {/* List of Conversations */}
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto text-xs">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onForwardToConversation(c.id, message);
                onClose();
              }}
              className="p-2.5 bg-slate-950/40 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left flex items-center justify-between transition-colors"
            >
              <span className="font-semibold text-slate-200">{c.title}</span>
              <span className="text-[10px] text-emerald-400 font-medium">Forward</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
