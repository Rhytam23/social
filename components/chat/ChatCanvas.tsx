import React, { useRef, useEffect, useState } from 'react';
import { ConversationItem, MessageData, ReplyReference } from '../../types/ui';
import { MessageItem } from '../messages/MessageItem';
import { MessageComposer } from '../messages/MessageComposer';
import { IconChevronDown, IconLock, IconPin, IconSearch, IconShield, IconX } from '../ui/icons';

export interface ChatCanvasProps {
  conversation: ConversationItem;
  messages: MessageData[];
  onSendMessage: (content: string, replyToId?: string, attachmentFile?: File) => void;
  replyTarget?: ReplyReference;
  onReplyToMessage: (msg: MessageData) => void;
  onClearReply: () => void;
  onReactToMessage: (msgId: string, emoji: string) => void;
  onDownloadAttachment?: (messageId: string, attachmentId: string) => void;
  onRetryFailedMessage?: (msgId: string) => void;
  onToggleInspector?: () => void;
  onEditMessage?: (msg: MessageData) => void;
  onDeleteMessage?: (msgId: string) => void;
  onForwardMessage?: (msg: MessageData) => void;
  onPinMessage?: (msgId: string) => void;
  onStarMessage?: (msgId: string) => void;
  editingMessage?: MessageData;
  onSaveEditMessage?: (msgId: string, newContent: string) => void;
  onCancelEdit?: () => void;
  onBackToList?: () => void;
}

export const ChatCanvas: React.FC<ChatCanvasProps> = ({
  conversation,
  messages,
  onSendMessage,
  replyTarget,
  onReplyToMessage,
  onClearReply,
  onReactToMessage,
  onDownloadAttachment,
  onRetryFailedMessage,
  onToggleInspector,
  onEditMessage,
  onDeleteMessage,
  onForwardMessage,
  onPinMessage,
  onStarMessage,
  editingMessage,
  onSaveEditMessage,
  onCancelEdit,
  onBackToList,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const pinnedMsg = messages.find((m) => m.id === conversation.pinnedMessageId || m.isPinned);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBottomBtn(scrollHeight - scrollTop - clientHeight > 150);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  // Drag and Drop files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onSendMessage('', replyTarget?.id, e.dataTransfer.files[0]);
    }
  };

  const displayedMessages = inChatSearchQuery.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(inChatSearchQuery.toLowerCase()))
    : messages;

  return (
    <main
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 bg-[var(--canvas-bg)] flex flex-col h-full overflow-hidden relative font-sans"
    >
      {/* Drag Over Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-40 bg-emerald-950/80 backdrop-blur-xs border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center text-emerald-300 font-sans gap-2">
          <IconLock className="w-8 h-8 text-emerald-400" />
          <span className="font-bold text-base">Drop File to Encrypt & Attach</span>
          <span className="text-xs text-emerald-400">File will be encrypted client-side before upload</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="h-14 bg-[var(--surface-1)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] px-4 sm:px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3 truncate">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              aria-label="Back to chat list"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="flex flex-col truncate">
            <div className="flex items-center gap-2 truncate">
              <h2 className="text-sm font-bold text-slate-100 truncate font-sans">
                {conversation.title}
              </h2>
              {conversation.isMuted && (
                <span className="text-[10px] text-slate-500">Muted</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>{conversation.type === 'group' ? 'Group Space' : 'Direct Conversation'}</span>
              <span>•</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>End-to-End Encrypted</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInChatSearch(!showInChatSearch)}
            className={`p-2 rounded-xl transition-colors ${
              showInChatSearch
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
            title="Search in conversation"
          >
            <IconSearch className="w-4 h-4" />
          </button>

          {onToggleInspector && (
            <button
              onClick={onToggleInspector}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <IconShield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Security Context</span>
            </button>
          )}
        </div>
      </div>

      {/* In-Chat Filter Search Bar */}
      {showInChatSearch && (
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2 z-10">
          <IconSearch className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search in this conversation..."
            value={inChatSearchQuery}
            onChange={(e) => setInChatSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          {inChatSearchQuery && (
            <button
              onClick={() => setInChatSearchQuery('')}
              className="text-slate-400 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setShowInChatSearch(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pinned Message Banner */}
      {pinnedMsg && (
        <div className="px-4 py-2 bg-amber-950/30 border-b border-amber-500/20 flex items-center justify-between text-xs font-sans shrink-0">
          <div className="flex items-center gap-2 truncate">
            <IconPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-300 font-semibold shrink-0">Pinned Message:</span>
            <span className="text-slate-200 truncate">{pinnedMsg.content}</span>
          </div>
          <button
            onClick={() => onPinMessage && onPinMessage(pinnedMsg.id)}
            className="text-amber-400 hover:underline text-[11px] shrink-0 font-medium ml-2"
          >
            Unpin
          </button>
        </div>
      )}

      {/* Stream Area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3 relative"
      >
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-2">
          {/* Security Badge Pill */}
          <div className="py-1.5 px-3 my-2 bg-slate-900/60 border border-slate-800/80 rounded-full text-xs text-center flex items-center justify-center gap-2 max-w-fit mx-auto shadow-xs text-slate-400">
            <IconLock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium text-slate-300">
              End-to-End Encrypted via {conversation.type === 'group' ? 'Per-Device Group Key Distribution' : 'X25519 Authenticated Encryption'}
            </span>
          </div>

          {/* Messages */}
          {displayedMessages.length === 0 ? (
            <div className="my-auto text-center text-xs text-slate-500 p-12">
              {inChatSearchQuery
                ? `No messages in this chat match "${inChatSearchQuery}"`
                : 'No messages in this conversation yet. Send a message to establish session ratchet.'}
            </div>
          ) : (
            displayedMessages.map((msg, index) => {
              const isFirstUnread = conversation.unreadCount > 0 && index === displayedMessages.length - conversation.unreadCount;
              return (
                <React.Fragment key={msg.id}>
                  {isFirstUnread && (
                    <div className="my-3 flex items-center gap-3">
                      <div className="flex-1 h-[1px] bg-emerald-500/40" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        Unread Messages
                      </span>
                      <div className="flex-1 h-[1px] bg-emerald-500/40" />
                    </div>
                  )}
                  <MessageItem
                    message={msg}
                    onReplyToMessage={onReplyToMessage}
                    onReactToMessage={onReactToMessage}
                    onDownloadAttachment={onDownloadAttachment ? (attId) => onDownloadAttachment(msg.id, attId) : undefined}
                    onRetryFailedMessage={onRetryFailedMessage}
                    onEditMessage={onEditMessage}
                    onDeleteMessage={onDeleteMessage}
                    onForwardMessage={onForwardMessage}
                    onPinMessage={onPinMessage}
                    onStarMessage={onStarMessage}
                  />
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottomBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white shadow-xl border border-slate-700 transition-all z-20"
          title="Scroll to bottom"
        >
          <IconChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Composer Row */}
      <div className="w-full max-w-4xl mx-auto">
        <MessageComposer
          onSendMessage={onSendMessage}
          replyTarget={replyTarget}
          onClearReply={onClearReply}
          editingMessage={editingMessage}
          onSaveEditMessage={onSaveEditMessage}
          onCancelEdit={onCancelEdit}
        />
      </div>
    </main>
  );
};
