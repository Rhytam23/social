import React from 'react';
import { ConversationItem, MessageData } from '../../types/ui';
import { EmptyState } from '../ui/primitives';
import { Button } from '../ui/button';
import { IconStar } from '../ui/icons';

export interface SavedMessagesViewProps {
  saved: MessageData[];
  conversations: ConversationItem[];
  onOpenConversation: (conversationId: string) => void;
  onUnsave: (messageId: string) => void;
}

/** Personal bookmarks. Only message ids are stored on the server; text is decrypted here on this device. */
export const SavedMessagesView: React.FC<SavedMessagesViewProps> = ({ saved, conversations, onOpenConversation, onUnsave }) => {
  if (saved.length === 0) {
    return (
      <EmptyState
        icon={<IconStar className="w-6 h-6" />}
        title="Nothing saved yet"
        description="Use the star on any message to keep it here. Only the message id is stored on the server, never its text."
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-3xl mx-auto w-full font-sans">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Saved messages</h2>
      <p className="text-xs text-[var(--text-muted)] mb-5">Bookmarks are private to you.</p>
      <ul className="flex flex-col gap-3">
        {saved.map((m) => {
          const conv = conversations.find((c) => c.id === m.conversationId);
          return (
            <li key={m.id} className="p-4 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>
                  <strong className="text-[var(--text-secondary)]">{m.senderName}</strong> · {conv?.title ?? 'Conversation'} · {m.timestamp}
                </span>
              </div>
              <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words">
                {m.content || (m.attachments?.[0] ? `Attachment: ${m.attachments[0].fileName}` : 'Message not available on this device')}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="tertiary" onClick={() => onOpenConversation(m.conversationId)}>
                  Open conversation
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onUnsave(m.id)}>
                  Remove
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
