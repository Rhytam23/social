import React, { useEffect, useRef, useState } from 'react';
import { RichText } from './RichText';
import { MessageData } from '../../types/ui';
import {
  IconCheck,
  IconCheckCheck,
  IconDownload,
  IconFile,
  IconPin,
  IconStar,
  IconMoreVertical,
  IconThread,
  IconX,
} from '../ui/icons';
import { VoiceMessagePreview } from './VoiceMessagePreview';
import { Avatar } from '../ui/avatar';
import { VerifiedBadge } from '../brand/VerifiedBadge';
import { MessageInfoModal } from './MessageInfoModal';

export interface MessageItemProps {
  message: MessageData;
  onReplyToMessage: (msg: MessageData) => void;
  onReactToMessage: (msgId: string, emoji: string) => void;
  onDownloadAttachment?: (attachmentId: string) => void;
  onRetryFailedMessage?: (msgId: string) => void;
  onEditMessage?: (msg: MessageData) => void;
  onDeleteMessage?: (msgId: string) => void;
  onForwardMessage?: (msg: MessageData) => void;
  onPinMessage?: (msgId: string) => void;
  onStarMessage?: (msgId: string) => void;
  /** Opens the thread under this message (reply count is shown when > 0). */
  onOpenThread?: (msg: MessageData) => void;
  threadReplyCount?: number;
  /** Report someone else's message to platform administrators. */
  onReportMessage?: (msg: MessageData) => void;
  /** True when the previous message is from the same person in the same minute: the name and photo are not repeated. */
  continuation?: boolean;
  /** The sender is a platform admin: show the verified badge next to the name. */
  senderVerified?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onReplyToMessage,
  onReactToMessage,
  onDownloadAttachment,
  onRetryFailedMessage,
  onEditMessage,
  onDeleteMessage,
  onForwardMessage,
  onPinMessage,
  onStarMessage,
  onOpenThread,
  threadReplyCount = 0,
  onReportMessage,
  continuation = false,
  senderVerified = false,
}) => {
  const isSelf = message.isSelf;
  const [actionsOpen, setActionsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (message.isDeletedLocally) {
    return (
      <div
        className={`my-1.5 px-3 py-1.5 rounded-xl border text-xs text-slate-500 italic max-w-[75%] font-sans ${
          isSelf ? 'self-end bg-slate-950/20 border-slate-900' : 'self-start bg-slate-950/20 border-slate-900'
        }`}
      >
        This message was deleted.
      </div>
    );
  }

  const statusIndicators = {
    sending: <span className="text-[10px] text-slate-500 font-sans">Sending...</span>,
    sent: <IconCheck className="w-3.5 h-3.5 text-slate-500" />,
    delivered: <IconCheckCheck className="w-4 h-4 text-slate-500" />,
    read: <IconCheckCheck className="w-4 h-4 text-emerald-400" />,
    failed: (
      <button
        onClick={() => onRetryFailedMessage && onRetryFailedMessage(message.id)}
        className="text-[11px] text-rose-400 hover:underline flex items-center gap-1 font-sans"
      >
        <span>Delivery failed.</span>
        <span className="font-semibold font-sans">Retry</span>
      </button>
    ),
  };

  const quickEmojis = ['👍', '❤️', '😂'];


  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content);
  };

  const moreItems: Array<{ key: string; label: string; run: () => void; danger?: boolean; hidden?: boolean }> = [
    { key: 'copy', label: 'Copy text', run: handleCopyText },
    { key: 'forward', label: 'Forward', run: () => onForwardMessage?.(message), hidden: !onForwardMessage },
    { key: 'thread', label: 'Reply in thread', run: () => onOpenThread?.(message), hidden: !(onOpenThread && !message.threadRootId) },
    { key: 'pin', label: message.isPinned ? 'Unpin' : 'Pin', run: () => onPinMessage?.(message.id), hidden: !onPinMessage },
    { key: 'star', label: message.isStarred ? 'Unstar' : 'Star', run: () => onStarMessage?.(message.id), hidden: !onStarMessage },
    { key: 'edit', label: 'Edit', run: () => onEditMessage?.(message), hidden: !(isSelf && onEditMessage) },
    { key: 'info', label: 'Message info', run: () => setShowInfoModal(true) },
    { key: 'report', label: 'Report', run: () => onReportMessage?.(message), danger: true, hidden: isSelf || !onReportMessage },
    { key: 'delete', label: 'Delete on this device', run: () => onDeleteMessage?.(message.id), danger: true, hidden: !(isSelf && onDeleteMessage) },
  ];

  return (
    <>
      <div
        className={`anim-message flex items-start gap-3 ${continuation ? 'mt-0' : 'mt-4'} mb-0.5 max-w-[88%] sm:max-w-[72%] font-sans ${
          isSelf ? 'self-end flex-row-reverse' : 'self-start flex-row'
        }`}
      >
        {/* User Avatar */}
        {continuation ? <span className="w-8 shrink-0" aria-hidden="true" /> : <Avatar name={isSelf ? 'You' : message.senderName} size="sm" className="mt-0.5" />}

        <div className={`flex flex-col gap-1 min-w-0 ${isSelf ? 'items-end' : 'items-start'}`}>
          {/* Name and time once per run of messages; flags always show */}
          {(!continuation || message.isEdited || message.isPinned || message.isStarred) && (
          <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400">
            {!continuation && (
              <>
                <span className="font-semibold text-slate-300 inline-flex items-center gap-1">
                  {isSelf ? 'You' : message.senderName}
                  {senderVerified && !isSelf && <VerifiedBadge className="w-3.5 h-3.5" />}
                </span>
                <span>{message.timestamp}</span>
              </>
            )}

            {message.isEdited && (
              <span className="text-[10px] text-slate-500 italic">(edited)</span>
            )}

            {message.isPinned && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-semibold">
                <IconPin className="w-3 h-3" />
                <span>Pinned</span>
              </span>
            )}

            {message.isStarred && (
              <IconStar className="w-3 h-3 text-amber-400" />
            )}
          </div>
          )}

          {/* Bubble Box */}
          <div
            title={continuation ? message.timestamp : undefined}
            className={`px-3.5 py-2 rounded-2xl border text-sm leading-relaxed relative group transition-colors min-w-0 max-w-full ${
              isSelf
                ? 'bg-[var(--accent-subtle)] border-emerald-500/20 text-slate-100 rounded-tr-md'
                : 'bg-[var(--surface-1)] border-[var(--border-subtle)] text-slate-200 rounded-tl-md shadow-[var(--edge-light)]'
            }`}
          >
            {/* Quoted Reply Reference */}
            {message.replyTo && (
              <div className="mb-2.5 p-2.5 bg-black/15 border-l-2 border-emerald-500/60 text-xs text-slate-300 rounded-r-lg">
                <span className="font-semibold block text-slate-200 mb-0.5">
                  {message.replyTo.senderName}
                </span>
                <span className="truncate block opacity-80 text-[11px]">{message.replyTo.snippet}</span>
              </div>
            )}

            {/* Text Content */}
            {message.content && (
              <div className="font-sans text-sm leading-relaxed text-slate-100 break-words">
                <RichText text={message.content} />
              </div>
            )}

            {/* Encrypted Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-col gap-2 pt-2">
                {message.attachments.map((att) => {
                  if (att.isVoiceNote) {
                    return (
                      <VoiceMessagePreview
                        key={att.id}
                        duration={att.duration || '0:00'}
                        isSelf={isSelf}
                        url={att.url}
                        isDownloading={att.isDownloading}
                        downloadError={att.downloadError}
                        onRequestDownload={() => onDownloadAttachment && onDownloadAttachment(att.id)}
                      />
                    );
                  }

                  const isImage = att.mimeType.startsWith('image/') || att.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);

                  return (
                    <div
                      key={att.id}
                      className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                          <IconFile className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="font-medium text-slate-200 truncate font-sans">
                            {att.fileName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {att.fileSize} • {att.downloadError ? <span className="text-rose-400">{att.downloadError}</span> : 'E2EE Encrypted'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isImage && att.url && (
                          <button
                            onClick={() => setPreviewImage(att.url || null)}
                            className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-lg text-xs"
                          >
                            Preview
                          </button>
                        )}
                        {att.url ? (
                          <a
                            href={att.url}
                            download={att.fileName}
                            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 text-xs"
                            title="Save decrypted file"
                          >
                            <IconDownload className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </a>
                        ) : (
                          <button
                            onClick={() => onDownloadAttachment && onDownloadAttachment(att.id)}
                            disabled={att.isDownloading}
                            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 text-xs disabled:opacity-50"
                            title="Decrypt & Download"
                          >
                            {att.isDownloading ? (
                              <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <IconDownload className="w-3.5 h-3.5" />
                            )}
                            <span>{att.isDownloading ? 'Decrypting...' : 'Decrypt'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Reaction Pills */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {message.reactions.map((r, idx) => (
                  <button
                    key={idx}
                    onClick={() => onReactToMessage(message.id, r.emoji)}
                    className={`px-2.5 py-0.5 text-xs rounded-full border transition-all flex items-center gap-1 ${
                      r.userReacted
                        ? 'bg-slate-700 border-slate-500 text-white font-bold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>{r.emoji}</span>
                    <span className="text-[10px]">{r.count}</span>
                  </button>
                ))}
              </div>
            )}

            {threadReplyCount > 0 && onOpenThread && (
              <button
                onClick={() => onOpenThread(message)}
                className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 hover:underline"
              >
                <IconThread className="w-3.5 h-3.5" />
                {threadReplyCount} {threadReplyCount === 1 ? 'reply' : 'replies'}
              </button>
            )}

            {/* Touch devices have no hover: a small button opens the same actions. */}
            <button
              type="button"
              onClick={() => setActionsOpen((o) => !o)}
              aria-label="Message actions"
              aria-expanded={actionsOpen}
              className="md:hidden absolute top-1 right-1 w-6 h-6 rounded-full text-slate-400 hover:bg-slate-800 flex items-center justify-center text-sm leading-none"
            >
              &#8943;
            </button>

            {/* Hover toolbar: quick reactions, reply, and one menu for everything else */}
            <div
              className={`absolute -top-3.5 ${actionsOpen || moreOpen ? 'flex' : 'hidden'} group-hover:flex group-focus-within:flex items-center gap-0.5 floating !rounded-xl p-1 z-20 ${
                isSelf ? 'right-2' : 'left-2'
              }`}
            >
              {quickEmojis.map((e) => (
                <button
                  key={e}
                  onClick={() => onReactToMessage(message.id, e)}
                  className="p-1 hover:bg-[var(--surface-2)] text-xs rounded-lg transition-colors"
                  title={`React with ${e}`}
                >
                  {e}
                </button>
              ))}

              <div className="w-px h-3.5 bg-[var(--border-strong)] mx-0.5" />

              <button
                onClick={() => onReplyToMessage(message)}
                className="px-1.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] rounded-lg"
                title="Reply"
              >
                Reply
              </button>

              <div ref={moreRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMoreOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={moreOpen}
                  aria-label="More message actions"
                  title="More"
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] rounded-lg"
                >
                  <IconMoreVertical className="w-3.5 h-3.5" />
                </button>
                {moreOpen && (
                  <div role="menu" className={`absolute top-8 z-30 w-44 p-1 floating animate-in zoom-in-95 ${isSelf ? 'right-0' : 'left-0'}`}>
                    {moreItems
                      .filter((item) => !item.hidden)
                      .map((item) => (
                        <button
                          key={item.key}
                          role="menuitem"
                          onClick={() => {
                            item.run();
                            setMoreOpen(false);
                            setActionsOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 rounded-lg text-left text-xs hover:bg-[var(--surface-2)] ${item.danger ? 'text-[var(--danger-neutral)]' : 'text-[var(--text-primary)]'}`}
                        >
                          {item.label}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Status Indicator */}
          {isSelf && <div className="px-1 flex items-center gap-1">{statusIndicators[message.status]}</div>}
        </div>
      </div>

      {/* Message Info Inspection Modal */}
      <MessageInfoModal
        message={message}
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />

      {/* Image Lightbox Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setPreviewImage(null)}
            aria-label="Close preview"
            className="absolute top-4 right-4 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-2)] rounded-full"
          >
            <IconX className="w-4 h-4" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage}
            alt="Attachment preview"
            decoding="async"
            className="max-w-full max-h-[85vh] rounded-xl border border-[var(--border-strong)] shadow-[var(--shadow-pop)]"
          />
        </div>
      )}
    </>
  );
};
