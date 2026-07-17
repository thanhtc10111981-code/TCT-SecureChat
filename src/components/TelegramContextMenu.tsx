import React from 'react';
import { 
  CornerUpLeft, 
  Copy as CopyIcon, 
  Trash2, 
  CheckSquare, 
  Clock 
} from 'lucide-react';
import { Message, UserSession } from '../types';

interface TelegramContextMenuProps {
  msg: Message;
  realUser: UserSession;
  isJiraTheme: boolean;
  chatFontSize: 'xs' | 'sm' | 'base' | 'lg';
  isTouch: boolean;
  x?: number;
  y?: number;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onSelect: () => void;
  renderMessageContent: (
    text: string | null,
    isMe: boolean,
    isBioAuth: boolean,
    msg: Message,
    onQuoteClick?: (quotedId: string) => void,
    isSelectionModeActive?: boolean
  ) => React.ReactNode;
}

export default function TelegramContextMenu({
  msg,
  realUser,
  isJiraTheme,
  chatFontSize,
  isTouch,
  x,
  y,
  onClose,
  onReact,
  onReply,
  onCopy,
  onDelete,
  onSelect,
  renderMessageContent,
}: TelegramContextMenuProps) {
  const isMe = msg.senderId === realUser.id;
  const originalTouchActiveRef = React.useRef(isTouch);

  React.useEffect(() => {
    if (!isTouch) return;

    const handleGlobalTouchEnd = () => {
      // Once the user lifts their finger from the screen for the first time
      // after the menu mounts, we mark the original touch sequence as completed.
      // We use a small delay to make sure any simulated click events from this release
      // are also completely processed and ignored.
      setTimeout(() => {
        originalTouchActiveRef.current = false;
      }, 150);
    };

    window.addEventListener('touchend', handleGlobalTouchEnd, { once: true, capture: true });
    return () => {
      window.removeEventListener('touchend', handleGlobalTouchEnd, { capture: true });
    };
  }, [isTouch]);

  const handleAction = (callback: () => void) => {
    if (originalTouchActiveRef.current) return;
    callback();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (originalTouchActiveRef.current) return;
    onClose();
  };

  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];

  // SCREEN BOUNDS CALCULATION FOR DESKTOP POSITIONING
  const menuWidth = 224; // w-56 is 14rem = 224px
  const maxCombinedWidth = 300;
  const maxCombinedHeight = 280;

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

  let left = x !== undefined ? x : viewportWidth / 2;
  let top = y !== undefined ? y : viewportHeight / 2;

  // Keep inside bounds with 12px padding
  if (left + maxCombinedWidth > viewportWidth) {
    left = Math.max(12, viewportWidth - maxCombinedWidth - 12);
  } else {
    left = Math.max(12, left);
  }

  if (top + maxCombinedHeight > viewportHeight) {
    top = Math.max(12, viewportHeight - maxCombinedHeight - 12);
  } else {
    top = Math.max(12, top);
  }

  // --- PC / DESKTOP RENDERING (NO HIGH BUBBLE, NO DARK SCREEN) ---
  if (!isTouch) {
    return (
      <div 
        className="fixed inset-0 z-[150] bg-transparent backdrop-blur-none transition-all duration-300 animate-fade-in"
        onClick={handleBackdropClick}
      >
        {/* Transparent backdrop layer to capture outer clicks */}
        <div 
          className="absolute inset-0 cursor-default" 
          onClick={handleBackdropClick} 
        />

        {/* Floating PC Menu at exact mouse position */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute z-10 flex flex-col gap-2 select-none w-56 pointer-events-auto"
          style={{
            left: `${left}px`,
            top: `${top}px`,
          }}
        >
          {/* 1. Quick Reaction Bar (Capsule Style) */}
          {!msg.isDestroyed && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 p-2 bg-white/95 backdrop-blur-md border border-slate-200/50 rounded-full shadow-xl overflow-x-auto max-w-full scrollbar-none animate-scale-up"
            >
              {reactionEmojis.map((emoji) => {
                const hasMyReaction = msg.reactions?.[realUser.id] === emoji;
                return (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(emoji);
                      onClose();
                    }}
                    className={`p-1.5 text-lg rounded-full transition-all duration-150 transform hover:scale-130 active:scale-95 cursor-pointer flex items-center justify-center ${
                      hasMyReaction ? 'bg-amber-100 scale-110' : 'hover:bg-slate-100'
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. Dropdown Menu (Telegram Context Menu) */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 divide-y divide-slate-100 flex flex-col w-full overflow-hidden animate-scale-up"
          >
            <button
              onClick={() => handleAction(onReply)}
              className="w-full px-4 py-3 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3 font-medium cursor-pointer"
            >
              <CornerUpLeft className="w-4 h-4 text-slate-400" />
              <span>Trả lời</span>
            </button>
            
            <button
              onClick={() => handleAction(onCopy)}
              className="w-full px-4 py-3 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3 font-medium cursor-pointer"
            >
              <CopyIcon className="w-4 h-4 text-slate-400" />
              <span>Sao chép</span>
            </button>
            
            <button
              onClick={() => handleAction(onSelect)}
              className="w-full px-4 py-3 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3 font-medium cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-slate-400" />
              <span>Chọn nhiều</span>
            </button>

            <button
              onClick={() => handleAction(onDelete)}
              className="w-full px-4 py-3 text-xs text-red-600 hover:bg-red-50/80 transition-colors flex items-center gap-3 font-medium cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Xóa tin nhắn</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MOBILE / TOUCH RENDERING (DIM SCREEN, HIGH BUBBLE, SCROLL TO CHAT) ---
  return (
    <div 
      className="fixed inset-0 z-[150] flex flex-col justify-end md:justify-center items-center px-4 pb-10 md:pb-4 bg-slate-950/40 backdrop-blur-[6px] transition-all duration-300 animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* Scrollable / Tap-to-dismiss background */}
      <div 
        className="absolute inset-0" 
        onClick={handleBackdropClick} 
      />

      {/* Main Container stacked vertically */}
      <div 
        className={`relative z-10 w-full max-w-sm flex flex-col gap-3.5 select-none ${
          isMe ? 'items-end' : 'items-start'
        }`}
      >
        {/* 1. Quick Reaction Bar (Capsule Style) */}
        {!msg.isDestroyed && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 p-2 bg-white/95 backdrop-blur-md border border-slate-200/50 rounded-full shadow-xl overflow-x-auto max-w-full scrollbar-none animate-scale-up"
          >
            {reactionEmojis.map((emoji) => {
              const hasMyReaction = msg.reactions?.[realUser.id] === emoji;
              return (
                <button
                  key={emoji}
                  onClick={() => {
                    if (originalTouchActiveRef.current) return;
                    onReact(emoji);
                    onClose();
                  }}
                  className={`p-1.5 text-lg rounded-full transition-all duration-150 transform hover:scale-130 active:scale-95 cursor-pointer flex items-center justify-center ${
                    hasMyReaction ? 'bg-amber-100 scale-110' : 'hover:bg-slate-100'
                  }`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        )}

        {/* 2. Highlighted Message Bubble in original form */}
        <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'} animate-scale-up`}>
          {msg.selfDestructDuration !== null && !msg.isDestroyed && msg.isRead && (
            <div className="flex items-center space-x-1 text-[9px] text-amber-600 font-mono mb-1.5 bg-white/80 px-2 py-0.5 rounded-full shadow-sm">
              <Clock className="w-2.5 h-2.5 animate-spin" />
              <span>Tự hủy E2EE hoạt động...</span>
            </div>
          )}

          <div className={`rounded-2xl px-3.5 py-3 shadow-lg border text-left ${
            chatFontSize === 'xs' ? 'text-xs' : chatFontSize === 'sm' ? 'text-sm' : chatFontSize === 'base' ? 'text-base' : 'text-lg'
          } leading-relaxed relative ${
            isMe
              ? isJiraTheme
                ? 'bg-[#deebff] border-[#b3d4ff]/80 text-slate-900 rounded-tr-none'
                : 'bg-dantri-green-light border-dantri-green/30 text-slate-850 rounded-tr-none'
              : 'bg-white border-slate-200 text-slate-850 rounded-tl-none'
          } ${msg.isDestroyed ? 'border-red-200 bg-red-50 text-red-600' : ''}`}>
            {msg.isDestroyed ? (
              <span className="font-mono text-[9px] italic flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1" />
                [TIN NHẮN ĐÃ TỰ HỦY]
              </span>
            ) : (
              <div className="max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
                {renderMessageContent(msg.decryptedText, isMe, realUser.isAppUnlocked, msg, undefined, true)}
              </div>
            )}

            {/* Time and ID Info inside the highlighted bubble */}
            <div className="text-[8px] text-slate-400 font-mono mt-1.5 flex items-center justify-between gap-4 border-t border-slate-100 pt-1 select-none">
              <span>{(() => { const d = new Date(msg.timestamp); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`; })()}</span>
              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* 3. Dropdown Menu (Telegram Context Menu) */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 divide-y divide-slate-100 flex flex-col w-56 overflow-hidden animate-scale-up"
        >
          <button
            onClick={() => handleAction(onReply)}
            className="w-full px-4 py-3 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3 font-medium cursor-pointer"
          >
            <CornerUpLeft className="w-4 h-4 text-slate-400" />
            <span>Trả lời</span>
          </button>
          
          <button
            onClick={() => handleAction(onCopy)}
            className="w-full px-4 py-3 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3 font-medium cursor-pointer"
          >
            <CopyIcon className="w-4 h-4 text-slate-400" />
            <span>Sao chép</span>
          </button>
          
          <button
            onClick={() => handleAction(onSelect)}
            className="w-full px-4 py-3 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3 font-medium cursor-pointer"
          >
            <CheckSquare className="w-4 h-4 text-slate-400" />
            <span>Chọn nhiều</span>
          </button>

          <button
            onClick={() => handleAction(onDelete)}
            className="w-full px-4 py-3 text-xs text-red-600 hover:bg-red-50/80 transition-colors flex items-center gap-3 font-medium cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>Xóa tin nhắn</span>
          </button>
        </div>
      </div>
    </div>
  );
}
