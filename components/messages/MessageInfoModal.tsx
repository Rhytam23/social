import React from 'react';
import { MessageData } from '../../types/ui';
import { IconCheckCheck, IconLock, IconShield, IconX } from '../ui/icons';

export interface MessageInfoModalProps {
  message: MessageData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MessageInfoModal: React.FC<MessageInfoModalProps> = ({
  message,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !message) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <IconShield className="w-4 h-4 text-emerald-400" />
            Message Security Details
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Message Snippet */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col gap-1 text-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Message Content</span>
          <p className="text-slate-200 line-clamp-3 leading-relaxed">{message.content}</p>
        </div>

        {/* Timestamps & Delivery Details */}
        <div className="flex flex-col gap-2.5 text-xs font-sans">
          <div className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-800 rounded-xl">
            <span className="text-slate-400">Delivered</span>
            <span className="text-slate-200 font-mono text-[11px] flex items-center gap-1.5">
              <IconCheckCheck className="w-3.5 h-3.5 text-slate-400" />
              {message.timestamp}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-800 rounded-xl">
            <span className="text-slate-400">Read Receipt</span>
            <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1.5 font-semibold">
              <IconCheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              {message.status === 'read' ? `${message.timestamp} (Verified)` : 'Pending'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-800 rounded-xl">
            <span className="text-slate-400">Encryption</span>
            <span className="text-slate-200 font-mono text-[11px] flex items-center gap-1">
              <IconLock className="w-3 h-3 text-emerald-400" />
              v{message.encryptionVersion} X25519/XSalsa20-Poly1305
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
        >
          Close Information
        </button>
      </div>
    </div>
  );
};
