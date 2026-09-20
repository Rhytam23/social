import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { MessageData, ReplyReference } from '../../types/ui';
import { IconFile, IconMic, IconPaperclip, IconSend, IconX } from '../ui/icons';
import { wrapSelection } from '../../lib/messaging/richText';

const MAX_FILE_BYTES = 25 * 1024 * 1024;

export interface MessageComposerProps {
  onSendMessage: (content: string, replyToId?: string, attachmentFile?: File, voiceDurationMs?: number) => void;
  replyTarget?: ReplyReference;
  onClearReply?: () => void;
  editingMessage?: MessageData;
  onSaveEditMessage?: (msgId: string, newContent: string) => void;
  onCancelEdit?: () => void;
  onTyping?: () => void;
  /** People who can be @mentioned in this conversation (groups). */
  mentionCandidates?: Array<{ id: string; name: string; username?: string }>;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  replyTarget,
  onClearReply,
  editingMessage,
  onSaveEditMessage,
  onCancelEdit,
  onTyping,
  mentionCandidates = [],
  disabled = false,
}) => {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [composerError, setComposerError] = useState<string | null>(null);
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

  const mentionMatches =
    mentionQuery === null
      ? []
      : mentionCandidates
          .filter((c) => c.name.toLowerCase().includes(mentionQuery.toLowerCase()) || (c.username ?? '').toLowerCase().startsWith(mentionQuery.toLowerCase()))
          .slice(0, 5);

  const pickMention = (c: { name: string; username?: string }) => {
    const handle = c.username || c.name.split(/\s+/)[0];
    setContent((prev) => prev.replace(/(^|\s)@[\w.]{0,30}$/, (_m, lead: string) => `${lead}@${handle} `));
    setMentionQuery(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionMatches.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((i) => (e.key === 'ArrowDown' ? (i + 1) % mentionMatches.length : (i - 1 + mentionMatches.length) % mentionMatches.length));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        pickMention(mentionMatches[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setMentionQuery(null);
        return;
      }
    }
    // Ctrl/Cmd+B bold, +I italic, +E code, applied around the selection.
    if ((e.ctrlKey || e.metaKey) && ['b', 'i', 'e'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      const marker = { b: '**', i: '*', e: '`' }[e.key.toLowerCase() as 'b' | 'i' | 'e'];
      const el = e.currentTarget;
      const next = wrapSelection(content, el.selectionStart, el.selectionEnd, marker);
      setContent(next.value);
      requestAnimationFrame(() => el.setSelectionRange(next.start, next.end));
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setComposerError(`"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)}MB - the limit is 25MB.`);
      e.target.value = '';
      return;
    }
    setComposerError(null);
    setSelectedFile(file);
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingSecondsRef = useRef(0);

  // Clean up recording resources on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStartVoiceRecord = async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setComposerError('Microphone access is not supported in this browser.');
      return;
    }

    setComposerError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorder.mimeType || 'audio/webm',
          });
          const ext = audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
          const voiceFile = new File([audioBlob], `voice-note-${Date.now()}.${ext}`, {
            type: audioBlob.type,
          });
          onSendMessage('', replyTarget?.id, voiceFile, recordingSecondsRef.current * 1000);
        }
        // Cleanup tracks
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        audioChunksRef.current = [];
      };

      mediaRecorder.start(250);
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          recordingSecondsRef.current = prev + 1;
          return prev + 1;
        });
      }, 1000);
    } catch {
      setComposerError('Microphone access was denied or is unavailable.');
    }
  };

  const handleStopAndSendVoiceRecord = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
  };

  const handleCancelVoiceRecord = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    audioChunksRef.current = [];
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
  };

  const canSend = (content.trim().length > 0 || selectedFile !== null || editingMessage !== undefined) && !disabled;

  return (
    <div className="p-3 sm:p-4 bg-gradient-to-t from-[var(--canvas-bg)] to-transparent flex flex-col gap-2 font-sans shrink-0">
      <div className="panel p-2.5 flex flex-col gap-2 transition-[border-color,box-shadow] focus-within:border-[var(--accent-line)] focus-within:shadow-[0_0_0_3px_var(--accent-subtle)]">

        {composerError && (
          <div className="flex items-center justify-between px-3 py-2 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            <span>{composerError}</span>
            <button onClick={() => setComposerError(null)} className="p-1 text-rose-400 hover:text-white rounded-lg hover:bg-rose-900/40 transition-colors">
              <IconX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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
              <span className="font-mono text-slate-300">{Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCancelVoiceRecord}
                className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStopAndSendVoiceRecord}
                className="py-1 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
              >
                Send Voice Note
              </button>
            </div>
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
              onClick={handleStartVoiceRecord}
              disabled={disabled}
              className="p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-40 shrink-0"
              title="Record encrypted voice note"
            >
              <IconMic className="w-5 h-5" />
            </button>

            {/* Text Area */}
            <div className="flex-1 py-1 relative">
              {mentionMatches.length > 0 && (
                <ul role="listbox" aria-label="Mention someone" className="absolute bottom-full left-0 mb-2 w-56 bg-[var(--surface-1)] border border-[var(--border-strong)] rounded-xl shadow-[var(--shadow-pop)] p-1 z-30">
                  {mentionMatches.map((c, i) => (
                    <li key={c.id} role="option" aria-selected={i === mentionIndex}>
                      <button
                        type="button"
                        onMouseDown={(ev) => {
                          ev.preventDefault();
                          pickMention(c);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-primary)] ${i === mentionIndex ? 'bg-[var(--surface-2)]' : ''}`}
                      >
                        {c.name}
                        {c.username && <span className="text-[var(--text-muted)]"> @{c.username}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (e.target.value) onTyping?.();
                  const upToCaret = e.target.value.slice(0, e.target.selectionStart);
                  const m = /(^|\s)@([\w.]{0,30})$/.exec(upToCaret);
                  setMentionQuery(m && mentionCandidates.length > 0 ? m[2] : null);
                  setMentionIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={editingMessage ? 'Edit message...' : 'Write an encrypted message...'}
                aria-label="Message"
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
              aria-label="Send message"
              className={`pressable w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                canSend
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:bg-[var(--accent-primary-hover)] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]'
                  : 'bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed'
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
