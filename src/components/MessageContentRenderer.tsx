import React from 'react';
import { Trash2, Lock, AlertCircle, Camera } from 'lucide-react';
import { Message } from '../types';
import FileAttachmentCard from './FileAttachmentCard';
import { linkify } from '../utils/linkify';

interface MessageContentRendererProps {
  decryptedText: string | null;
  isMe: boolean;
  isBioAuth: boolean;
  msg: Message;
  setLightboxImage: (val: string | null) => void;
  setLightboxCaption: (val: string | null) => void;
  setIsLightboxOpen: (val: boolean) => void;
  onQuoteClick?: (quotedMsgId: string) => void;
  isSelectionModeActive?: boolean;
}

export function MessageContentRenderer({
  decryptedText,
  isMe,
  isBioAuth,
  msg,
  setLightboxImage,
  setLightboxCaption,
  setIsLightboxOpen,
  onQuoteClick,
  isSelectionModeActive = false,
}: MessageContentRendererProps): React.JSX.Element {
  const wasSelectionActiveRef = React.useRef(false);
  const lastActiveTimeRef = React.useRef(0);

  React.useEffect(() => {
    if (isSelectionModeActive) {
      wasSelectionActiveRef.current = true;
      lastActiveTimeRef.current = Date.now();
    } else {
      if (wasSelectionActiveRef.current) {
        lastActiveTimeRef.current = Date.now();
        wasSelectionActiveRef.current = false;
      }
    }
  }, [isSelectionModeActive]);

  const shouldBlockClick = isSelectionModeActive || (Date.now() - lastActiveTimeRef.current < 500);

  if (msg.isDestroyed) {
    return (
      <span className="italic text-slate-400 text-[11px] flex items-center space-x-1 font-mono">
        <Trash2 className="w-3.5 h-3.5" />
        <span>[TIN NHẮN ĐÃ TỰ HỦY]</span>
      </span>
    );
  }

  if (!isBioAuth && !isMe) {
    return (
      <span className="italic text-slate-400 text-[11px] flex items-center space-x-1 font-mono">
        <Lock className="w-3.5 h-3.5" />
        <span>[Tin nhắn bị khóa - Xác thực để xem]</span>
      </span>
    );
  }

  if (decryptedText === null) {
    return <span className="italic text-slate-400 font-mono">[Đang giải mã...]</span>;
  }

  if (
    decryptedText.startsWith('[Lỗi giải mã') ||
    decryptedText.includes('Lỗi giải mã') ||
    decryptedText === 'Lỗi giải mã phần mềm'
  ) {
    return (
      <span className="text-red-500 text-[11px] flex items-center space-x-1.5 font-mono font-medium py-1">
        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
        <span>{decryptedText}</span>
      </span>
    );
  }

  try {
    const parsed = JSON.parse(decryptedText);
    const quoteBlock = parsed.quote ? (
      <div
        onMouseDown={(e) => { if (!isSelectionModeActive) e.stopPropagation(); }}
        onMouseUp={(e) => { if (!isSelectionModeActive) e.stopPropagation(); }}
        onTouchStart={(e) => { if (!isSelectionModeActive) e.stopPropagation(); }}
        onTouchEnd={(e) => { if (!isSelectionModeActive) e.stopPropagation(); }}
        onClick={(e) => {
          if (shouldBlockClick) return;
          e.stopPropagation();
          if (parsed.quote.id && onQuoteClick) {
            onQuoteClick(parsed.quote.id);
          }
        }}
        className={`quote-block-interactive mb-1.5 p-1.5 px-2 bg-slate-900/5 hover:bg-slate-900/10 active:scale-[0.98] rounded border-l-2 border-blue-500 text-[10px] text-slate-500 font-sans max-w-full select-none transition-all ${
          isSelectionModeActive ? 'pointer-events-none' : 'cursor-pointer'
        }`}
      >
        <span className="block font-bold text-slate-700 mb-0.5">
          {parsed.quote.senderName}
        </span>
        <span className="block truncate max-w-[220px] text-slate-450 italic">
          "{parsed.quote.text}"
        </span>
      </div>
    ) : null;

    if (parsed.type === 'image') {
      if (parsed.isStealth && !isMe) {
        return (
          <div className="space-y-2">
            {quoteBlock}
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded font-mono border border-amber-200 flex items-center gap-1.5 w-max">
              <Camera className="w-3.5 h-3.5" />
              <span>CHỤP ẨN TỪ XA CỦA ĐỐI TÁC (Tự hủy trong 10s)</span>
            </span>
            <img
              src={parsed.image}
              alt="Remote Snap"
              onClick={(e) => {
                if (shouldBlockClick) return;
                e.stopPropagation();
                setLightboxImage(parsed.image);
                setLightboxCaption("Ảnh camera nền tự động chụp từ xa");
                setIsLightboxOpen(true);
              }}
              className={`max-w-full sm:max-w-xs max-h-48 rounded-xl object-contain border border-slate-200 hover:opacity-90 ${
                isSelectionModeActive ? 'pointer-events-none' : 'cursor-pointer'
              }`}
              referrerPolicy="no-referrer"
            />
            {parsed.text && <p className="whitespace-pre-wrap break-words font-sans mt-1">{linkify(parsed.text)}</p>}
          </div>
        );
      } else {
        return (
          <div className="space-y-2">
            {quoteBlock}
            <img
              src={parsed.image}
              alt="Encrypted E2EE Attachment"
              onClick={(e) => {
                if (shouldBlockClick) return;
                e.stopPropagation();
                setLightboxImage(parsed.image);
                setLightboxCaption(parsed.text || "Ảnh đính kèm mã hóa E2EE");
                setIsLightboxOpen(true);
              }}
              className={`max-w-full sm:max-w-xs max-h-48 rounded-xl object-contain border border-slate-200 hover:opacity-90 ${
                isSelectionModeActive ? 'pointer-events-none' : 'cursor-pointer'
              }`}
              referrerPolicy="no-referrer"
            />
            {parsed.text && <p className="whitespace-pre-wrap break-words font-sans mt-1">{linkify(parsed.text)}</p>}
          </div>
        );
      }
    } else if (parsed.type === 'file') {
      return (
        <FileAttachmentCard
          fileId={parsed.fileId}
          fileName={parsed.fileName}
          text={parsed.text}
          quoteBlock={quoteBlock}
          isSelectionModeActive={isSelectionModeActive}
        />
      );
    } else if (parsed.type === 'text') {
      return (
        <div className="space-y-1">
          {quoteBlock}
          <p className="whitespace-pre-wrap break-words font-sans">{linkify(parsed.text)}</p>
        </div>
      );
    }
  } catch {
    // If not valid JSON, treat as plain text message
    return <p className="whitespace-pre-wrap break-words font-sans">{linkify(decryptedText)}</p>;
  }

  return <p className="whitespace-pre-wrap break-words font-sans">{linkify(decryptedText)}</p>;
}
