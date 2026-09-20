import React, { useState } from 'react';
import { RichText } from './RichText';
import { MessageData } from '../../types/ui';
import {
  IconCheck,
  IconCheckCheck,
  IconCopy,
  IconDownload,
  IconEdit,
  IconFile,
  IconForward,
  IconPin,
  IconStar,
  IconTrash,
  IconThread,
} from '../ui/icons';
import { VoiceMessagePreview } from './VoiceMessagePreview';
import { Avatar } from '../ui/avatar';
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
}) => {
  const isSelf = message.isSelf;
  const [actionsOpen, setActionsOpen] = useState(false);
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

  const quickEmojis = ['👍', '❤️', '💡', '🔥'];


  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <>
      <div
        className={`anim-message flex items-start gap-3 my-2 max-w-[88%] sm:max-w-[72%] font-sans ${
          isSelf ? 'self-end flex-row-reverse' : 'self-start flex-row'
        }`}
      >
        {/* User Avatar */}
        <Avatar name={isSelf ? 'You' : message.senderName} size="sm" className="mt-0.5" />

        <div className={`flex flex-col gap-1 min-w-0 ${isSelf ? 'items-end' : 'items-start'}`}>
          {/* Header Metadata Line */}
          <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">
              {isSelf ? 'You' : message.senderName}
            </span>
            <span className="text-slate-600">•</span>
            <span>{message.timestamp}</span>

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

          {/* Bubble Box */}
          <div
            className={`px-3.5 py-2.5 rounded-2xl border text-sm leading-relaxed relative group transition-colors min-w-0 max-w-full ${
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

            {/* Contextual Action Hover Toolbar (Desktop & Mobile Touch Menu) */}
            <div
              className={`absolute -top-3.5 ${actionsOpen ? 'flex' : 'hidden'} group-hover:flex group-focus-within:flex items-center gap-1 floating !rounded-xl p-1 z-20 ${
                isSelf ? 'right-2' : 'left-2'
              }`}
            >
              {quickEmojis.map((e) => (
                <button
                  key={e}
                  onClick={() => onReactToMessage(message.id, e)}
                  className="p-1 hover:bg-slate-800 text-xs rounded-lg transition-colors"
                  title={`React with ${e}`}
                >
                  {e}
                </button>
              ))}

              <div className="w-[1px] h-3.5 bg-slate-800 mx-0.5" />

              <button
                onClick={() => onReplyToMessage(message)}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                title="Reply"
              >
                Reply
              </button>

              <button
                onClick={handleCopyText}
                className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                title="Copy text"
              >
                <IconCopy className="w-3.5 h-3.5" />
              </button>

              {onForwardMessage && (
                <button
                  onClick={() => onForwardMessage(message)}
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                  title="Forward message"
                >
                  <IconForward className="w-3.5 h-3.5" />
                </button>
              )}

              {onOpenThread && !message.threadRootId && (
                <button
                  onClick={() => onOpenThread(message)}
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                  title="Reply in thread"
                >
                  <IconThread className="w-3.5 h-3.5" />
                </button>
              )}

              {onPinMessage && (
                <button
                  onClick={() => onPinMessage(message.id)}
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                  title={message.isPinned ? 'Unpin message' : 'Pin message'}
                >
                  <IconPin className="w-3.5 h-3.5" />
                </button>
              )}

              {onStarMessage && (
                <button
                  onClick={() => onStarMessage(message.id)}
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                  title={message.isStarred ? 'Unstar message' : 'Star message'}
                >
                  <IconStar className="w-3.5 h-3.5" />
                </button>
              )}

              {!isSelf && onReportMessage && (
                <button
                  onClick={() => onReportMessage(message)}
                  className="p-1 text-slate-300 hover:text-rose-400 hover:bg-slate-800 rounded-lg text-xs leading-none"
                  title="Report message"
                  aria-label="Report message"
                >
                  &#9873;
                </button>
              )}

              {isSelf && onEditMessage && (
                <button
                  onClick={() => onEditMessage(message)}
                  className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                  title="Edit message"
                >
                  <IconEdit className="w-3.5 h-3.5" />
                </button>
              )}

              {isSelf && onDeleteMessage && (
                <button
                  onClick={() => onDeleteMessage(message.id)}
                  className="p-1 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg"
                  title="Delete message locally"
                >
                  <IconTrash className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => setShowInfoModal(true)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                title="Message info"
              >
                Info
              </button>
            </div>
          </div>

          {/* Delivery Status Indicator */}
          <div className="px-1 flex items-center gap-1">{statusIndicators[message.status]}</div>
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
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage}
            alt="Attachment preview"
            className="max-w-full max-h-[85vh] rounded-2xl border border-slate-800 shadow-2xl"
          />
        </div>
      )}
    </>
  );
};
