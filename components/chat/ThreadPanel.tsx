import React, { useEffect, useRef } from 'react';
import { MessageData } from '../../types/ui';
import { MessageItem } from '../messages/MessageItem';
import { MessageComposer } from '../messages/MessageComposer';
import { IconX } from '../ui/icons';

export interface ThreadPanelProps {
  root: MessageData;
  replies: MessageData[];
  onClose: () => void;
  onSend: (content: string, attachmentFile?: File, voiceDurationMs?: number) => void;
  onReactToMessage: (msgId: string, emoji: string) => void;
  onDownloadAttachment?: (messageId: string, attachmentId: string) => void;
  onRetryFailedMessage?: (msgId: string) => void;
  onTyping?: () => void;
  canPost?: boolean;
}

/** Side panel (full screen on phones) showing one message and the replies in its thread. */
export const ThreadPanel: React.FC<ThreadPanelProps> = ({
  root,
  replies,
  onClose,
  onSend,
  onReactToMessage,
  onDownloadAttachment,
  onRetryFailedMessage,
  onTyping,
  canPost = true,
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [replies.length]);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      aria-label="Thread"
      className="fixed inset-0 z-40 md:absolute md:inset-y-0 md:left-auto md:right-0 md:w-96 bg-[var(--surface-1)] md:border-l border-[var(--border-subtle)] shadow-[var(--shadow-pop)] flex flex-col animate-in slide-in-from-right outline-none"
    >
      <header className="h-14 px-4 flex items-center justify-between border-b border-[var(--border-subtle)] shrink-0">
        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Thread</h2>
          <span className="text-[11px] text-[var(--text-muted)]">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </span>
        </div>
        <button onClick={onClose} aria-label="Close thread" className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-2)]">
          <IconX className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        <MessageItem message={root} onReplyToMessage={() => {}} onReactToMessage={onReactToMessage} onDownloadAttachment={onDownloadAttachment ? (a) => onDownloadAttachment(root.id, a) : undefined} />
        <div className="flex items-center gap-3 my-2" role="separator">
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Replies</span>
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
        </div>
        {replies.length === 0 && <p className="text-xs text-[var(--text-muted)] text-center py-4">No replies yet. Start the conversation.</p>}
        {replies.map((m) => (
          <MessageItem
            key={m.id}
            message={m}
            onReplyToMessage={() => {}}
            onReactToMessage={onReactToMessage}
            onDownloadAttachment={onDownloadAttachment ? (a) => onDownloadAttachment(m.id, a) : undefined}
            onRetryFailedMessage={onRetryFailedMessage}
          />
        ))}
        <div ref={endRef} />
      </div>

      {canPost ? (
        <MessageComposer onSendMessage={(content, _replyId, file, voiceMs) => onSend(content, file, voiceMs)} onTyping={onTyping} />
      ) : (
        <p className="p-4 text-xs text-center text-[var(--text-muted)] border-t border-[var(--border-subtle)]">Only admins can post in this group.</p>
      )}
    </aside>
  );
};
