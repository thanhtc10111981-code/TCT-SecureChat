import React from 'react';
import { Clock, Loader2, AlertCircle, Smile } from 'lucide-react';
import { Message, UserSession } from '../types';

interface MessageItemProps {
  key?: string;
  msg: Message;
  realUser: UserSession;
  isUserAdmin: boolean;
  isJiraTheme: boolean;
  chatFontSize: 'xs' | 'sm' | 'base' | 'lg';
  selectedMessageIds: string[];
  highlightedMessageId: string | null;
  formatCountdown: (sec: number | null) => string;
  renderMessageContent: (
    text: string | null,
    isMe: boolean,
    isBioAuth: boolean,
    msg: Message,
    onQuoteClick?: (quotedId: string) => void,
    isSelectionModeActive?: boolean
  ) => React.ReactNode;
  handleQuoteClick: (msgId: string) => void;
  startPress: (e: React.MouseEvent | React.TouchEvent, msg: Message) => void;
  movePress: (e: React.MouseEvent | React.TouchEvent) => void;
  endPress: (e: React.MouseEvent | React.TouchEvent, msg: Message) => void;
  handleContextMenu: (e: React.MouseEvent, msg: Message) => void;
  handleReactToMessage: (msgId: string, emoji: string) => void;
  handleRetryMessage: (messageId: string) => Promise<void>;
  isMobileDevice: boolean;
  activeEmojiPickerMsgId: string | null;
  setActiveEmojiPickerMsgId: (val: string | null) => void;
  onSelfDestruct?: (messageId: string) => void;
}

export default function MessageItem({
  msg,
  realUser,
  isUserAdmin,
  isJiraTheme,
  chatFontSize,
  selectedMessageIds,
  highlightedMessageId,
  formatCountdown,
  renderMessageContent,
  handleQuoteClick,
  startPress,
  movePress,
  endPress,
  handleContextMenu,
  handleReactToMessage,
  handleRetryMessage,
  isMobileDevice,
  activeEmojiPickerMsgId,
  setActiveEmojiPickerMsgId,
  onSelfDestruct,
}: MessageItemProps) {
  const isMe = msg.senderId === realUser.id;
  const isSelected = selectedMessageIds.includes(msg.id);
  const emojiPickerRef = React.useRef<HTMLDivElement>(null);

  const [localRemaining, setLocalRemaining] = React.useState<number | null>(() => {
    if (msg.isRead && msg.readAt !== null && msg.selfDestructDuration !== null && !msg.isDestroyed) {
      const elapsed = Math.floor((Date.now() - msg.readAt) / 1000);
      return Math.max(0, msg.selfDestructDuration - elapsed);
    }
    return msg.selfDestructTimeRemaining ?? msg.selfDestructDuration;
  });

  React.useEffect(() => {
    if (msg.isRead && msg.readAt !== null && msg.selfDestructDuration !== null) {
      const elapsed = Math.floor((Date.now() - msg.readAt) / 1000);
      setLocalRemaining(Math.max(0, msg.selfDestructDuration - elapsed));
    } else {
      setLocalRemaining(msg.selfDestructTimeRemaining ?? msg.selfDestructDuration);
    }
  }, [msg.isRead, msg.readAt, msg.selfDestructDuration, msg.selfDestructTimeRemaining]);

  React.useEffect(() => {
    if (!msg.isRead || msg.readAt === null || msg.selfDestructDuration === null || msg.isDestroyed) {
      return;
    }

    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return; // Pause ticking loop when hidden

      const elapsed = Math.floor((Date.now() - msg.readAt!) / 1000);
      const remaining = Math.max(0, msg.selfDestructDuration! - elapsed);

      setLocalRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        if (onSelfDestruct) {
          onSelfDestruct(msg.id);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [msg.isRead, msg.readAt, msg.selfDestructDuration, msg.isDestroyed, msg.id, onSelfDestruct]);

  React.useEffect(() => {
    if (activeEmojiPickerMsgId !== msg.id) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setActiveEmojiPickerMsgId(null);
      }
    };

    document.addEventListener('click', handleOutsideClick, true);
    return () => {
      document.removeEventListener('click', handleOutsideClick, true);
    };
  }, [activeEmojiPickerMsgId, msg.id, setActiveEmojiPickerMsgId]);

  // Group and count reactions
  const reactionsGrouped = (() => {
    if (!msg.reactions) return [];
    const counts: Record<string, { count: number; users: string[] }> = {};
    Object.entries(msg.reactions).forEach(([userId, emoji]) => {
      if (emoji) {
        if (!counts[emoji]) {
          counts[emoji] = { count: 0, users: [] };
        }
        counts[emoji].count += 1;
        counts[emoji].users.push(userId);
      }
    });
    return Object.entries(counts).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      users: data.users,
      hasMyReaction: data.users.includes(realUser.id),
    }));
  })();

  return (
    <div
      className={`flex items-center gap-2 max-w-[85%] relative group ${
        isMe ? 'self-end flex-row-reverse' : 'self-start flex-row'
      }`}
    >
      <div
        id={`chat-message-${msg.id}`}
        onMouseDown={(e) => startPress(e, msg)}
        onMouseMove={movePress}
        onMouseUp={(e) => endPress(e, msg)}
        onTouchStart={(e) => startPress(e, msg)}
        onTouchMove={movePress}
        onTouchEnd={(e) => endPress(e, msg)}
        onContextMenu={(e) => handleContextMenu(e, msg)}
        className={`flex flex-col cursor-pointer transition-all select-none scroll-mt-20 ${
          isSelected ? 'opacity-95 scale-[0.99]' : ''
        } ${isMe ? 'items-end' : 'items-start'} ${
          msg.id === highlightedMessageId ? 'ring-2 ring-blue-500/80 rounded-2xl scale-[1.02] shadow-md shadow-blue-500/10' : ''
        }`}
      >
        {msg.selfDestructDuration !== null && !msg.isDestroyed && msg.isRead && (
          <div className="flex items-center space-x-1 text-[9px] text-amber-600 font-mono mb-1 select-none">
            <Clock className="w-2.5 h-2.5 animate-spin" />
            <span>Tự hủy sau {formatCountdown(localRemaining)}</span>
          </div>
        )}

        <div className={`message-bubble rounded-2xl px-3 py-2.5 ${
          chatFontSize === 'xs' ? 'text-xs' : chatFontSize === 'sm' ? 'text-sm' : chatFontSize === 'base' ? 'text-base' : 'text-lg'
        } leading-relaxed transition-all relative overflow-visible text-left ${
          isSelected
            ? `bg-amber-50 border-2 border-amber-400 text-slate-900 animate-pulse ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'}`
            : isMe
              ? isJiraTheme
                ? 'bg-[#deebff]/75 border border-[#b3d4ff]/60 text-slate-900 rounded-tr-none animate-fade-in'
                : 'bg-dantri-green-light/80 border border-dantri-green/15 text-slate-850 rounded-tr-none animate-fade-in'
              : 'bg-slate-100 border border-slate-200 text-slate-850 rounded-tl-none animate-fade-in'
        } ${msg.isDestroyed ? 'border-red-200 bg-red-50 text-red-600' : ''}`}>
          {msg.isDestroyed ? (
            <span className="font-mono text-[9px] italic flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1" />
              [TIN NHẮN ĐÃ TỰ HỦY]
            </span>
          ) : (
            renderMessageContent(msg.decryptedText, isMe, realUser.isAppUnlocked, msg, handleQuoteClick, selectedMessageIds.length > 0)
          )}

          {/* Reaction Badges */}
          {reactionsGrouped.length > 0 && (
            <div className={`absolute bottom-[-10px] ${isMe ? 'right-3' : 'left-3'} z-10 flex items-center gap-1 p-0.5 px-1.5 bg-white border border-slate-100 rounded-full shadow-sm text-[11px] select-none font-sans font-medium`}>
              {reactionsGrouped.map(({ emoji, count, hasMyReaction }) => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReactToMessage(msg.id, emoji);
                  }}
                  className={`reaction-button flex items-center gap-0.5 px-1.5 py-0.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer outline-none focus:outline-none focus:ring-0 ${
                    hasMyReaction 
                      ? isJiraTheme 
                        ? 'bg-blue-50/80 text-jira-blue font-bold' 
                        : 'bg-emerald-50/80 text-dantri-green font-bold'
                      : 'text-slate-600'
                  }`}
                  title={emoji}
                >
                  <span className="text-[13px] leading-none">{emoji}</span>
                  {count > 1 && <span className="text-[9px] font-semibold">{count}</span>}
                </button>
              ))}
            </div>
          )}

          <div className="text-[8px] text-slate-400 font-mono mt-1 flex items-center justify-between gap-2 border-t border-slate-200/60 pt-1 select-none">
            <div className="flex items-center gap-1.5">
              <span>{(() => { const d = new Date(msg.timestamp); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`; })()}</span>
              {isUserAdmin && (
                <span className={`font-semibold px-1 rounded text-[7px] tracking-wider ${
                  msg.isRead 
                    ? 'text-emerald-600 bg-emerald-50 border border-emerald-100/50' 
                    : 'text-slate-500 bg-slate-100 border border-slate-150/50'
                }`}>
                  {msg.isRead ? '● ĐÃ ĐỌC' : '○ CHƯA ĐỌC'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {isMe && msg.status === 'sending' && (
                <span className={`flex items-center gap-0.5 ${isJiraTheme ? 'text-jira-blue' : 'text-dantri-green'}`} title="Đang gửi...">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                </span>
              )}
              {isMe && msg.status === 'failed' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRetryMessage(msg.id);
                  }}
                  className="flex items-center gap-0.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-1 rounded border border-red-200 transition-all cursor-pointer font-bold select-none text-[7px]"
                  title="Gửi lỗi. Nhấp để gửi lại"
                >
                  <AlertCircle className="w-2 h-2 text-red-500" />
                  <span>Lỗi - Gửi lại</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Hover Smiley Reaction Trigger & Picker */}
      {!msg.isDestroyed && !isMobileDevice && (
        <div className="relative self-center shrink-0 z-30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveEmojiPickerMsgId(activeEmojiPickerMsgId === msg.id ? null : msg.id);
            }}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
            title="Thả cảm xúc"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {/* Emoji Picker Dropdown */}
          {activeEmojiPickerMsgId === msg.id && (
            <div 
              ref={emojiPickerRef}
              className={`emoji-picker absolute bottom-full mb-1 z-50 flex items-center gap-1 p-1 bg-white border border-slate-200 shadow-xl rounded-full animate-fade-in ${isMe ? 'right-0' : 'left-0'}`}
            >
              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReactToMessage(msg.id, emoji);
                    setActiveEmojiPickerMsgId(null);
                  }}
                  className="p-1.5 hover:bg-slate-50 rounded-full transition-transform hover:scale-125 cursor-pointer text-sm"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
