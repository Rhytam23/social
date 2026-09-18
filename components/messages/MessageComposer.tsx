import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { MessageData, ReplyReference } from '../../types/ui';
import { IconFile, IconMic, IconPaperclip, IconSend, IconX } from '../ui/icons';

export interface MessageComposerProps {
  onSendMessage: (content: string, replyToId?: string, attachmentFile?: File) => void;
  replyTarget?: ReplyReference;
  onClearReply?: () => void;
  editingMessage?: MessageData;
  onSaveEditMessage?: (msgId: string, newContent: string) => void;
  onCancelEdit?: () => void;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  replyTarget,
  onClearReply,
  editingMessage,
  onSaveEditMessage,
  onCancelEdit,
  disabled = false,
}) => {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
    }
  }, [editingMessage]);

  const handleSend = () => {
    if (editingMessage && onSaveEditMessage) {
      if (content.trim()) {
        onSaveEditMessage(editingMessage.id, content);
        setContent('');
        if (onCancelEdit) onCancelEdit();
      }
      return;
    }

    if ((!content.trim() && !selectedFile) || disabled) return;
    onSendMessage(content, replyTarget?.id, selectedFile || undefined);
    setContent('');
    setSelectedFile(null);
    if (onClearReply) onClearReply();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Record simulated voice note
  const handleToggleVoiceRecord = () => {
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
      // Create a dummy voice file
      const voiceFile = new File(['voice_audio_bytes'], `voice-note-${Date.now()}.wav`, {
        type: 'audio/wav',
      });
      onSendMessage('', replyTarget?.id, voiceFile);
      setRecordingSeconds(0);
    } else {
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
      const interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
      setTimeout(() => clearInterval(interval), 30000);
    }
  };

  const canSend = (content.trim().length > 0 || selectedFile !== null || editingMessage !== undefined) && !disabled;

  return (
    <div className="p-3 sm:p-4 bg-gradient-to-t from-[var(--canvas-bg)] to-transparent flex flex-col gap-2 font-sans shrink-0">
      <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl p-2.5 shadow-lg flex flex-col gap-2 transition-all focus-within:border-slate-500/50">
        
        {/* Editing Message Banner */}
        {editingMessage && (
          <div className="flex items-center justify-between px-3 py-2 bg-slate-950/60 border border-amber-500/30 rounded-xl text-xs">
            <div className="flex flex-col truncate pr-2">
              <span className="font-semibold text-amber-400">Editing Message</span>
              <span className="text-slate-400 truncate text-[11px] mt-0.5">{editingMessage.content}</span>
            </div>
            <button
              onClick={onCancelEdit}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Cancel editing"
            >
              <IconX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Quoted Reply Target Banner */}
        {!editingMessage && replyTarget && (
          <div className="flex items-center justify-between px-3 py-2 bg-[var(--canvas-bg)] border border-[var(--border-subtle)] rounded-xl text-xs">
            <div className="flex flex-col truncate pr-2">
              <span className="font-semibold text-slate-300">
                Replying to <span className="text-white">{replyTarget.senderName}</span>
              </span>
              <span className="text-slate-400 truncate text-[11px] mt-0.5">{replyTarget.snippet}</span>
            </div>
            <button
              onClick={onClearReply}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Cancel reply"
            >
              <IconX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Selected File Banner */}
        {selectedFile && (
          <div className="flex items-center justify-between px-3 py-2 bg-[var(--canvas-bg)] border border-[var(--border-subtle)] rounded-xl text-xs">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                <IconFile className="w-4 h-4" />
              </div>
              <div className="flex flex-col truncate">
                <span className="font-medium text-slate-200 truncate text-xs">{selectedFile.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Encrypted attachment
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Remove attachment"
            >
              <IconX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Voice Note Recording Bar */}
        {isRecordingVoice ? (
          <div className="flex items-center justify-between px-3 py-2 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-semibold text-rose-300">Recording Encrypted Voice Note...</span>
              <span className="font-mono text-slate-300">0:0{recordingSeconds}</span>
            </div>

            <button
              onClick={handleToggleVoiceRecord}
              className="py-1 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs"
            >
              Send Voice Note
            </button>
          </div>
        ) : (
          /* Main Input Row */
          <div className="flex items-end gap-2 px-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              id="file-upload-input"
            />

            {/* Attach File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-40 shrink-0"
              title="Attach encrypted document or image"
            >
              <IconPaperclip className="w-5 h-5" />
            </button>

            {/* Record Voice Note Button */}
            <button
              type="button"
              onClick={handleToggleVoiceRecord}
              disabled={disabled}
              className="p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-40 shrink-0"
              title="Record encrypted voice note"
            >
              <IconMic className="w-5 h-5" />
            </button>

            {/* Text Area */}
            <div className="flex-1 py-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={editingMessage ? 'Edit message...' : 'Write an encrypted message...'}
                disabled={disabled}
                rows={1}
                className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none resize-none min-h-[24px] max-h-32 py-1 leading-relaxed font-sans"
              />
            </div>

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                canSend
                  ? 'bg-slate-100 text-slate-950 hover:bg-white active:scale-95 shadow-md'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-60'
              }`}
              title="Send message (Enter)"
            >
              <IconSend className="w-4 h-4 translate-x-[0.5px]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
