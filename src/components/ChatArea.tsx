import React from 'react';
import {
  ArrowLeft,
  Shield,
  Unlock,
  ShieldCheck,
  Clock,
  Image as ImageIcon,
  Camera,
  Send,
  X,
  UserMinus,
  Type,
  Paperclip,
  FileText,
  CornerUpLeft,
  Copy as CopyIcon,
  Trash2,
  CheckSquare,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { UserSession, Message } from '../types';
import { LastSeenStatus } from './LastSeenStatus';
import SecurityHubSidebar from './SecurityHubSidebar';
import { resizeAndCompressImage } from '../utils/image';

interface ChatAreaProps {
  activeRecipient: UserSession;
  setActiveRecipient: (val: UserSession | null) => void;
  realUser: UserSession;
  realMessages: Message[];
  hasMoreMessages: Record<string, boolean>;
  isLoadingOlder: boolean;
  loadOlderMessages: (recipientId: string) => Promise<void>;
  showSecurityHub: boolean;
  setShowSecurityHub: (val: boolean) => void;
  handleLockReal: () => void;
  isCameraAuthorizedReal: boolean;
  setIsCameraAuthorizedReal: (val: boolean) => void;
  handleAuthorizeCamera1Time: () => void;
  addLog: (text: string, type: 'info' | 'success' | 'warn' | 'crypto') => void;
  formatCountdown: (sec: number | null) => string;
  renderMessageContent: (
    text: string | null,
    isMe: boolean,
    isBioAuth: boolean,
    msg: Message,
    onQuoteClick?: (quotedId: string) => void,
    isSelectionModeActive?: boolean
  ) => React.ReactNode;
  setInspectorMessage: (msg: Message) => void;
  attachedImageBase64: string | null;
  setAttachedImageBase64: (val: string | null) => void;
  attachedFile: { fileId: string; fileName: string } | null;
  setAttachedFile: (val: { fileId: string; fileName: string } | null) => void;
  realSelfDestruct: number | null;
  setRealSelfDestruct: (val: number | null) => void;
  isRealDestructOpen: boolean;
  setIsRealDestructOpen: (val: boolean) => void;
  formatDestructLabel: (val: number | null) => string;
  handleSendRealMessage: (
    e: React.FormEvent,
    quote?: { id: string; senderId: string; senderName: string; text: string } | null,
    onSuccess?: () => void
  ) => void;
  handleRetryMessage: (messageId: string) => Promise<void>;
  handleImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRealCamDropdownOpen: boolean;
  setIsRealCamDropdownOpen: (val: boolean) => void;
  setCameraTriggerSource: (val: 'real' | 'guest') => void;
  setCameraFacingMode: (val: 'user' | 'environment') => void;
  setIsCameraOpen: (val: boolean) => void;
  handleSendRemoteCameraRequestReal: (facing: 'user' | 'environment') => void;
  realInput: string;
  setRealInput: (val: string) => void;
  realInputRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement>;
  isCameraRequestingRef: React.MutableRefObject<boolean>;
  systemLogs: any[];
  isPushSubscribed: boolean;
  unsubscribeUserFromPush: () => void;
  subscribeUserToPush: () => void;
  prefWebPush: boolean;
  handleTogglePrefWebPush: () => void;
  prefTelegram: boolean;
  handleTogglePrefTelegram: () => void;
  setRealMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  usersList: UserSession[];
  setUsersList: React.Dispatch<React.SetStateAction<UserSession[]>>;
}

export default function ChatArea({
  activeRecipient,
  setActiveRecipient,
  realUser,
  realMessages,
  hasMoreMessages,
  isLoadingOlder,
  loadOlderMessages,
  showSecurityHub,
  setShowSecurityHub,
  handleLockReal,
  isCameraAuthorizedReal,
  setIsCameraAuthorizedReal,
  handleAuthorizeCamera1Time,
  addLog,
  formatCountdown,
  renderMessageContent,
  setInspectorMessage,
  attachedImageBase64,
  setAttachedImageBase64,
  attachedFile,
  setAttachedFile,
  realSelfDestruct,
  setRealSelfDestruct,
  isRealDestructOpen,
  setIsRealDestructOpen,
  formatDestructLabel,
  handleSendRealMessage,
  handleRetryMessage,
  handleImageFileChange,
  isRealCamDropdownOpen,
  setIsRealCamDropdownOpen,
  setCameraTriggerSource,
  setCameraFacingMode,
  setIsCameraOpen,
  handleSendRemoteCameraRequestReal,
  realInput,
  setRealInput,
  realInputRef,
  isCameraRequestingRef,
  systemLogs,
  isPushSubscribed,
  unsubscribeUserFromPush,
  subscribeUserToPush,
  prefWebPush,
  handleTogglePrefWebPush,
  prefTelegram,
  handleTogglePrefTelegram,
  setRealMessages,
  usersList,
  setUsersList
}: ChatAreaProps) {
  const liveRecipient = usersList.find(u => u.id === activeRecipient.id) || activeRecipient;
  const [isMobileDevice, setIsMobileDevice] = React.useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = React.useState<string[]>([]);
  const [quotedMessage, setQuotedMessage] = React.useState<{ id: string; senderId: string; senderName: string; text: string } | null>(null);
  const isUserAdmin = realUser?.username === 'phong' || realUser?.role === 'admin';
  const [isConfirmingUnlink, setIsConfirmingUnlink] = React.useState(false);
  const [chatFontSize, setChatFontSize] = React.useState<'xs' | 'sm' | 'base' | 'lg'>(() => {
    return (localStorage.getItem('chat_font_size') as 'xs' | 'sm' | 'base' | 'lg') || 'sm';
  });
  const [showFontDropdown, setShowFontDropdown] = React.useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = React.useState<string | null>(null);

  const handleQuoteClick = (quotedMsgId: string) => {
    const element = document.getElementById(`chat-message-${quotedMsgId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(quotedMsgId);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 1500);
    } else {
      addLog('Không tìm thấy tin nhắn được trích dẫn (có thể đã tự hủy hoặc đã bị xóa).', 'warn');
    }
  };
  const [showInputFontDropdown, setShowInputFontDropdown] = React.useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = React.useState(false);

  // Google Drive state & file upload handlers (completely anonymous to end-user)
  const [isGdriveEnabled, setIsGdriveEnabled] = React.useState(false);
  const [isUploadingFile, setIsUploadingFile] = React.useState(false);

  // States and refs for Long-press and Context Menu
  const [contextMenu, setContextMenu] = React.useState<{ msg: Message; x: number; y: number; openedAt: number } | null>(null);
  const longPressTimeoutRef = React.useRef<any>(null);
  const isLongPressActiveRef = React.useRef(false);
  const touchStartPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const hasTouchedRef = React.useRef(false);
  const hasDraggedRef = React.useRef(false);
  const ignoreNextSelectionClearRef = React.useRef(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollContainerRef.current) {
        try {
          scrollContainerRef.current.scrollTop = 0;
        } catch (e) {
          console.error('Scroll error:', e);
        }
      }
    }, 100);
  };

  const startPress = (e: React.MouseEvent | React.TouchEvent, msg: Message) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('a') ||
      target.closest('img') ||
      target.closest('.quote-block-interactive') ||
      target.closest('button')
    ) {
      return; // Ignore interactions with interactive elements inside bubble
    }

    if (e.type === 'touchstart') hasTouchedRef.current = true;
    else if (e.type === 'mousedown' && hasTouchedRef.current) return;
    if ('button' in e && e.button !== 0) return;

    isLongPressActiveRef.current = false;
    hasDraggedRef.current = false;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    touchStartPosRef.current = { x: clientX, y: clientY };

    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      setContextMenu({ msg, x: clientX, y: clientY, openedAt: Date.now() });
      if ('vibrate' in navigator) {
        try { navigator.vibrate(40); } catch {}
      }
    }, 500);
  };

  const movePress = (e: React.MouseEvent | React.TouchEvent) => {
    if (!touchStartPosRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    if (Math.hypot(clientX - touchStartPosRef.current.x, clientY - touchStartPosRef.current.y) > 10) {
      hasDraggedRef.current = true;
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
    }
  };

  const endPress = (e: React.MouseEvent | React.TouchEvent, msg: Message) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('a') ||
      target.closest('img') ||
      target.closest('.quote-block-interactive') ||
      target.closest('button')
    ) {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
      return; // Ignore if user is interacting with an interactive element
    }

    if (e.type === 'mouseup' && hasTouchedRef.current) {
      setTimeout(() => { hasTouchedRef.current = false; }, 300);
      return;
    }
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    if (isLongPressActiveRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressActiveRef.current = false;
      return;
    }
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return; // Ignore clicks that were part of a drag/scroll gesture
    }
    handleBubbleClick(msg);
  };

  const handleBubbleClick = (msg: Message) => {
    if (selectedMessageIds.includes(msg.id)) {
      setSelectedMessageIds(prev => prev.filter(id => id !== msg.id));
    } else {
      setSelectedMessageIds(prev => [...prev, msg.id]);
      if (msg.decryptedText) setInspectorMessage(msg);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    setContextMenu({ msg, x: e.clientX, y: e.clientY, openedAt: Date.now() });
  };

  const handleReplyOption = (msg: Message) => {
    setSelectedMessageIds([msg.id]);
    setContextMenu(null);
    setTimeout(() => realInputRef.current?.focus(), 50);
  };

  const handleCopyOption = (msg: Message) => {
    if (msg.isDestroyed) {
      addLog('Không thể sao chép tin nhắn đã tự hủy.', 'warn');
      setContextMenu(null);
      return;
    }
    let textToCopy = '';
    try {
      const parsed = JSON.parse(msg.decryptedText || '{}');
      textToCopy = parsed.text || msg.decryptedText || '';
    } catch {
      textToCopy = msg.decryptedText || '';
    }
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => addLog('📋 Đã sao chép nội dung tin nhắn vào bộ nhớ tạm.', 'success'))
        .catch(() => addLog('Không thể sao chép tin nhắn.', 'warn'));
    }
    setContextMenu(null);
  };

  const handleDeleteSingleMessage = async (msgId: string) => {
    addLog(`Đang xóa tin nhắn...`, 'info');
    try {
      const res = await fetch('/api/messages/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds: [msgId] })
      });
      if (res.ok && (await res.json()).success) {
        addLog(`Đã xóa tin nhắn thành công!`, 'success');
        setRealMessages(prev => prev.filter(m => m.id !== msgId));
        setSelectedMessageIds(prev => prev.filter(id => id !== msgId));
      } else {
        addLog('Lỗi khi xóa tin nhắn.', 'warn');
      }
    } catch {
      addLog('Lỗi kết nối khi xóa tin nhắn.', 'warn');
    }
  };

  const handleDeleteOption = (msg: Message) => {
    setContextMenu(null);
    handleDeleteSingleMessage(msg.id);
  };

  const handleSelectOption = (msg: Message) => {
    if (!selectedMessageIds.includes(msg.id)) {
      setSelectedMessageIds(prev => [...prev, msg.id]);
      if (msg.decryptedText) setInspectorMessage(msg);
    }
    setContextMenu(null);
  };

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setIsGdriveEnabled(!!data.gdriveEnabled);
        }
      } catch (err) {
        console.error('Error fetching settings in ChatArea:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleGenericFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      addLog('Tệp tin quá lớn. Vui lòng chọn tệp dưới 25MB.', 'warn');
      return;
    }

    addLog(`Đang mã hóa và tải lên tệp tin "${file.name}"...`, 'info');
    setIsUploadingFile(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        try {
          const resultStr = event.target.result as string;
          const commaIdx = resultStr.indexOf(',');
          const base64Data = commaIdx !== -1 ? resultStr.substring(commaIdx + 1) : resultStr;

          const response = await fetch('/api/gdrive/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              mimeType: file.type || 'application/octet-stream',
              base64Data
            })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Truyền tệp thất bại.');
          }

          const resData = await response.json();
          if (resData.success && resData.fileId) {
            setAttachedFile({
              fileId: resData.fileId,
              fileName: resData.fileName || file.name
            });
            addLog(`Tải tệp tin "${file.name}" thành công! Sẵn sàng bấm gửi.`, 'success');
          } else {
            throw new Error('Lỗi máy chủ không trả về mã tệp.');
          }
        } catch (err: any) {
          addLog(`Lỗi đính kèm tệp tin: ${err.message}`, 'warn');
        } finally {
          setIsUploadingFile(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  React.useEffect(() => {
    setSelectedMessageIds([]);
    setQuotedMessage(null);
    setIsConfirmingUnlink(false);
  }, [activeRecipient?.id]);

  React.useEffect(() => {
    if (selectedMessageIds.length === 1) {
      const singleMsgId = selectedMessageIds[0];
      const msg = realMessages.find(m => m.id === singleMsgId);
      if (msg && !msg.isDestroyed) {
        let displayQuoteText = '';
        try {
          const parsed = JSON.parse(msg.decryptedText || '{}');
          if (parsed.type === 'image') {
            displayQuoteText = parsed.text ? `[Hình ảnh] ${parsed.text}` : '[Hình ảnh E2EE]';
          } else {
            displayQuoteText = parsed.text || msg.decryptedText || '';
          }
        } catch {
          displayQuoteText = msg.decryptedText || '';
        }
        const senderName = msg.senderId === realUser.id ? 'Tôi' : activeRecipient?.name || 'Đối tác';
        setQuotedMessage({
          id: msg.id,
          senderId: msg.senderId,
          senderName,
          text: displayQuoteText
        });
        setTimeout(() => {
          if (realInputRef && realInputRef.current) {
            realInputRef.current.focus();
          }
        }, 50);
      } else {
        setQuotedMessage(null);
      }
    } else {
      setQuotedMessage(null);
    }
  }, [selectedMessageIds, realMessages, realUser?.id, activeRecipient?.id, realInputRef]);

  const handleUnlinkPartner = async () => {
    addLog(`Đang gửi yêu cầu hủy liên kết với ${activeRecipient.name}...`, 'info');
    try {
      const res = await fetch('/api/users/unlink-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: realUser.id,
          userAId: realUser.id,
          userBId: activeRecipient.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi từ máy chủ khi hủy liên kết.');
      }

      addLog(data.message || `Đã hủy liên kết thành công với ${activeRecipient.name}!`, 'success');
      
      // Update local state
      setUsersList((prev) => prev.filter((u) => u.id !== activeRecipient.id));
      setActiveRecipient(null);
      setIsConfirmingUnlink(false);
    } catch (err: any) {
      console.error('Error unlinking friend:', err);
      addLog(err.message || 'Có lỗi xảy ra khi hủy liên kết.', 'warn');
    }
  };

  const handleDeleteSelectedMessages = async () => {
    if (selectedMessageIds.length === 0) return;
    addLog(`Đang gửi yêu cầu xóa ${selectedMessageIds.length} tin nhắn đã chọn...`, 'info');
    try {
      const res = await fetch('/api/messages/batch-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messageIds: selectedMessageIds })
      });
      if (!res.ok) {
        throw new Error('Không thể xóa tin nhắn trên máy chủ.');
      }
      const data = await res.json();
      if (data.success) {
        addLog(`Đã xóa thành công ${selectedMessageIds.length} tin nhắn ở cả client và server!`, 'success');
        
        // Delete from local client state immediately
        setRealMessages(prev => prev.filter(m => !selectedMessageIds.includes(m.id)));
        
        // Clear selection
        setSelectedMessageIds([]);
      } else {
        addLog(data.error || 'Lỗi khi xóa tin nhắn.', 'warn');
      }
    } catch (err: any) {
      console.error(err);
      addLog(err.message || 'Lỗi kết nối khi xóa tin nhắn.', 'warn');
    }
  };

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice(typeof window !== 'undefined' && (window.innerWidth < 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent)));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    const textarea = realInputRef.current;
    if (textarea && textarea.tagName === 'TEXTAREA') {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [realInput, realInputRef]);

  React.useEffect(() => {
    if (activeRecipient) {
      // Khi chọn một người nhận chat mới, tự động cuộn ô nhập liệu để nằm ngay phía trên viền dưới màn hình
      setTimeout(() => {
        const el = realInputRef.current;
        if (el) {
          try {
            el.scrollIntoView({
              behavior: 'smooth',
              block: 'end'
            });
          } catch (e) {
            el.scrollIntoView(false);
          }
        }
      }, 300);
    }
  }, [activeRecipient, realInputRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (isMobileDevice) {
        // On mobile, Enter simply creates a new line (default behavior)
        return;
      }

      // On desktop:
      if (e.shiftKey || e.altKey) {
        // Shift+Enter or Alt+Enter inserts a new line (default behavior)
        return;
      } else {
        // Regular Enter sends the message
        e.preventDefault();
        if (realInput.trim() || attachedImageBase64) {
          handleSendRealMessage(e as any, quotedMessage, () => {
            setQuotedMessage(null);
            setSelectedMessageIds([]);
            scrollToBottom();
          });
          // Instant local UI reset
          setQuotedMessage(null);
          setSelectedMessageIds([]);
          scrollToBottom();
        }
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          if (file.size > 8 * 1024 * 1024) {
            addLog('Ảnh sao chép quá lớn. Vui lòng chọn hoặc copy ảnh dưới 8MB.', 'warn');
            return;
          }
          addLog('Phát hiện ảnh dán từ bộ nhớ tạm! Đang tối ưu hóa độ phân giải...', 'info');
          const reader = new FileReader();
          reader.onload = async (event) => {
            if (event.target?.result) {
              const originalBase64 = event.target.result as string;
              try {
                const compressed = await resizeAndCompressImage(originalBase64, 800, 800, 0.7);
                const originalSizeKB = Math.round((originalBase64.length * 3) / 4 / 1024);
                const compressedSizeKB = Math.round((compressed.length * 3) / 4 / 1024);
                addLog(`Nén ảnh dán thành công: ${originalSizeKB}KB ➜ ${compressedSizeKB}KB. Sẵn sàng mã hóa E2EE!`, 'success');
                setAttachedImageBase64(compressed);
              } catch (err) {
                addLog('Lỗi khi nén ảnh dán. Sử dụng ảnh gốc.', 'warn');
                setAttachedImageBase64(originalBase64);
              }
            }
          };
          reader.readAsDataURL(file);
        }
        e.preventDefault();
        break;
      }
    }
  };

  const handleSubmitWithQuote = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendRealMessage(e, quotedMessage, () => {
      setQuotedMessage(null);
      setSelectedMessageIds([]);
      scrollToBottom();
    });
    // Instant local UI reset
    setQuotedMessage(null);
    setSelectedMessageIds([]);
    scrollToBottom();
  };

  // Swipe to go back gesture logic (Option 2) with real-time visual feedback
  const [swipeX, setSwipeX] = React.useState(0);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (activeRecipient && touch.clientX <= 60) { // Detect swipe starting from the left edge (within 60px)
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      setSwipeX(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Only track if swipe is mostly horizontal and in the rightward direction
    if (deltaX > 0 && Math.abs(deltaY) < deltaX * 0.6) {
      setSwipeX(deltaX);
    } else if (deltaX <= 0) {
      setSwipeX(0);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current) return;

    if (swipeX > 80) {
      setActiveRecipient(null);
      setAttachedImageBase64(null);
      addLog('⬅️ Đã quay lại bằng cử chỉ vuốt từ cạnh màn hình.', 'info');
    }

    touchStartRef.current = null;
    setSwipeX(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`${activeRecipient ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full bg-slate-50/50 overflow-hidden relative border-l border-slate-200 select-none md:select-text`}
    >
      {/* Swipe back visual feedback overlay */}
      {swipeX > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 z-50 pointer-events-none flex items-center justify-start pl-3"
          style={{
            width: `${Math.min(swipeX, 150)}px`,
            background: `linear-gradient(to right, rgba(16, 185, 129, ${Math.min(swipeX / 300, 0.15)}) 0%, rgba(16, 185, 129, 0) 100%)`,
            borderLeft: `${Math.min(swipeX / 20, 4)}px solid rgba(16, 185, 129, ${Math.min(swipeX / 100, 0.8)})`,
            transition: 'width 0.05s ease-out'
          }}
        >
          <div 
            className="w-8 h-8 rounded-full bg-white border border-slate-200/80 shadow-md flex items-center justify-center text-dantri-green transition-transform duration-75"
            style={{
              transform: `translateX(${Math.min(swipeX / 3.5 - 8, 18)}px) scale(${Math.min(0.6 + swipeX / 200, 1.15)})`,
              opacity: Math.min(swipeX / 60, 1)
            }}
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </div>
        </div>
      )}

      <div className="flex-1 flex h-full overflow-hidden bg-white">
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-white">
          {/* Header */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 text-left">
            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => {
                  setActiveRecipient(null);
                  setAttachedImageBase64(null);
                }}
                className="p-1.5 h-[30px] w-[30px] flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors md:hidden"
                title="Quay lại danh sách"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <div className="relative shrink-0">
                <img src={liveRecipient.avatar} alt={liveRecipient.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 animate-fade-in" />
                <LastSeenStatus user={liveRecipient} isAdmin={isUserAdmin} variant="compact" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-slate-800 leading-tight">{liveRecipient.name}</h4>
                  {liveRecipient.username && (
                    <span className="font-mono text-[9px] font-bold text-slate-400">
                      @{liveRecipient.username}
                    </span>
                  )}
                </div>
                <LastSeenStatus user={liveRecipient} isAdmin={isUserAdmin} variant="full" />
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-1">
              {isUserAdmin && (
                <div className="relative flex items-center">
                  {!isConfirmingUnlink ? (
                    <button
                      onClick={() => setIsConfirmingUnlink(true)}
                      className="p-1.5 h-[30px] w-[30px] flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 transition-all shadow-sm cursor-pointer"
                      title="Hủy liên kết (Hủy kết bạn) với đối tác này"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1 bg-red-50 border border-red-200 rounded-lg p-1 animate-fade-in text-[8px]">
                      <span className="text-[8px] text-red-700 font-bold px-1 select-none">Hủy?</span>
                      <button
                        onClick={handleUnlinkPartner}
                        className="px-1.5 py-0.5 rounded text-[8px] bg-red-600 text-white font-bold hover:bg-red-700 transition-all cursor-pointer"
                      >
                        Có
                      </button>
                      <button
                        onClick={() => setIsConfirmingUnlink(false)}
                        className="px-1.5 py-0.5 rounded text-[8px] bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowSecurityHub(!showSecurityHub)}
                className={`p-1.5 h-[30px] w-[30px] flex items-center justify-center rounded-lg border transition-all ${
                  showSecurityHub
                    ? 'bg-dantri-green-light border-dantri-green/20 text-dantri-green shadow-xs font-bold'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
                title="Giám sát bảo mật & khóa E2EE"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>

              {/* Font Size Adjuster dropdown */}
              <div className="relative flex items-center">
                <button
                  onClick={() => setShowFontDropdown(!showFontDropdown)}
                  className={`p-1.5 h-[30px] w-[30px] flex items-center justify-center rounded-lg border transition-all ${
                    showFontDropdown
                      ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                  title={`Thay đổi cỡ chữ tin nhắn (Hiện tại: ${chatFontSize === 'xs' ? 'Nhỏ' : chatFontSize === 'sm' ? 'Vừa' : chatFontSize === 'base' ? 'Lớn' : 'Rất lớn'})`}
                >
                  <Type className="w-3.5 h-3.5" />
                </button>

                {showFontDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowFontDropdown(false)} 
                    />
                    <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 animate-fade-in text-left">
                      <div className="px-2.5 py-1 border-b border-slate-100 mb-1 select-none">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cỡ chữ chat</span>
                      </div>
                      {[
                        { key: 'xs', label: 'Nhỏ (12px)', class: 'text-xs' },
                        { key: 'sm', label: 'Vừa (14px)', class: 'text-sm' },
                        { key: 'base', label: 'Lớn (16px)', class: 'text-base' },
                        { key: 'lg', label: 'Rất lớn (18px)', class: 'text-lg' }
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => {
                            setChatFontSize(item.key as any);
                            localStorage.setItem('chat_font_size', item.key);
                            setShowFontDropdown(false);
                            addLog(`🔤 Đã đổi cỡ chữ hiển thị sang: ${item.label}`, 'info');
                          }}
                          className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 transition-colors flex items-center justify-between ${
                            chatFontSize === item.key ? 'text-dantri-green font-bold bg-dantri-green-light/30' : 'text-slate-600'
                          }`}
                        >
                          <span className={item.class}>{item.label}</span>
                          {chatFontSize === item.key && (
                            <span className="w-1.5 h-1.5 rounded-full bg-dantri-green" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleLockReal}
                className="p-1.5 h-[30px] w-[30px] flex items-center justify-center rounded-lg bg-white border border-slate-200 text-dantri-green hover:text-amber-600 hover:bg-slate-50 transition-colors shadow-sm"
                title="Khóa máy bằng mã PIN"
              >
                <Unlock className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>



          {/* Messages Area */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col-reverse scrollbar-none">
            {[...realMessages]
              .filter(
                m => (m.senderId === activeRecipient.id && m.recipientId === realUser.id) ||
                     (m.senderId === realUser.id && m.recipientId === activeRecipient.id)
              )
              .filter(msg => {
                const isUserAdmin = realUser?.username === 'phong' || realUser?.role === 'admin';
                if (isUserAdmin) return true; // Admins see everything
                try {
                  const parsed = JSON.parse(msg.decryptedText || '{}');
                  if (parsed.type === 'camera_request') return false;
                  if (parsed.type === 'image' && parsed.isStealth) return false;
                } catch {}
                return true;
              })
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((msg) => {
                const isMe = msg.senderId === realUser.id;
                const isSelected = selectedMessageIds.includes(msg.id);
                return (
                  <div
                    key={msg.id}
                    id={`chat-message-${msg.id}`}
                    onMouseDown={(e) => startPress(e, msg)}
                    onMouseMove={movePress}
                    onMouseUp={(e) => endPress(e, msg)}
                    onTouchStart={(e) => startPress(e, msg)}
                    onTouchMove={movePress}
                    onTouchEnd={(e) => endPress(e, msg)}
                    onContextMenu={(e) => handleContextMenu(e, msg)}
                    className={`flex flex-col max-w-[85%] cursor-pointer transition-all select-none scroll-mt-20 ${
                      isSelected ? 'opacity-95 scale-[0.99]' : ''
                    } ${isMe ? 'self-end items-end' : 'self-start items-start'} ${
                      msg.id === highlightedMessageId ? 'ring-2 ring-blue-500/80 rounded-2xl scale-[1.02] shadow-md shadow-blue-500/10' : ''
                    }`}
                  >
                    {msg.selfDestructDuration !== null && !msg.isDestroyed && msg.isRead && (
                      <div className="flex items-center space-x-1 text-[9px] text-amber-600 font-mono mb-1 select-none">
                        <Clock className="w-2.5 h-2.5 animate-spin" />
                        <span>Tự hủy sau {formatCountdown(msg.selfDestructTimeRemaining)}</span>
                      </div>
                    )}

                    <div className={`rounded-2xl px-3 py-2.5 ${
                      chatFontSize === 'xs' ? 'text-xs' : chatFontSize === 'sm' ? 'text-sm' : chatFontSize === 'base' ? 'text-base' : 'text-lg'
                    } leading-relaxed transition-all relative overflow-hidden text-left ${
                      isSelected
                        ? `bg-amber-50 border-2 border-amber-400 text-slate-900 animate-pulse ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'}`
                        : isMe
                          ? 'bg-dantri-green-light/80 border border-dantri-green/15 text-slate-850 rounded-tr-none animate-fade-in'
                          : 'bg-slate-100 border border-slate-200 text-slate-850 rounded-tl-none animate-fade-in'
                    } ${msg.isDestroyed ? 'border-red-200 bg-red-50 text-red-600' : ''}`}>
                      {msg.isDestroyed ? (
                        <span className="font-mono text-[9px] italic flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1" />
                          [TIN NHẮN ĐÃ TỰ HỦY]
                        </span>
                      ) : (
                        renderMessageContent(msg.decryptedText, isMe, realUser.isBiometricAuthenticated, msg, handleQuoteClick, selectedMessageIds.length > 0)
                      )}
                      <div className="text-[8px] text-slate-400 font-mono mt-1 flex items-center justify-between gap-2 border-t border-slate-200/60 pt-1 select-none">
                        <div className="flex items-center gap-1.5">
                          <span>ID: {msg.id.substring(4, 8)}</span>
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
                            <span className="flex items-center gap-0.5 text-dantri-green" title="Đang gửi...">
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
                );
              })}

            {hasMoreMessages[activeRecipient.id] !== false && (
              <div className="flex justify-center py-2 select-none">
                <button
                  disabled={isLoadingOlder}
                  onClick={() => loadOlderMessages(activeRecipient.id)}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-dantri-green hover:text-dantri-green-hover text-[10px] font-semibold border border-slate-200 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-sans cursor-pointer shadow-sm"
                >
                  {isLoadingOlder ? (
                    <>
                      <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải tin nhắn cũ...</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3" />
                      <span>Tải thêm tin nhắn cũ</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {realMessages.filter(
              m => (m.senderId === activeRecipient.id && m.recipientId === realUser.id) ||
                   (m.senderId === realUser.id && m.recipientId === activeRecipient.id)
            ).length === 0 && (
              <div className="text-center py-20 text-slate-500 text-xs font-mono max-w-xs mx-auto select-none">
                <div className="text-slate-700 text-2xl mb-2">🤝</div>
                <p>Không có dữ liệu lưu trữ trên thiết bị. Tin nhắn mới sẽ được mã hóa E2EE và đồng bộ thời gian thực.</p>
              </div>
            )}
          </div>

          {/* Quoted message preview */}
          {quotedMessage && (
            <div className="p-2 border-t border-slate-200 bg-dantri-green-light/60 flex items-center justify-between shrink-0 text-left border-l-4 border-l-dantri-green transition-all select-none animate-fade-in">
              <div className="flex flex-col text-[11px] max-w-[85%]">
                <span className="font-bold text-dantri-green flex items-center gap-1">
                  Đang trả lời {quotedMessage.senderName}:
                </span>
                <span className="text-slate-600 truncate max-w-[300px] italic">
                  "{quotedMessage.text}"
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuotedMessage(null);
                  setSelectedMessageIds([]);
                }}
                className="p-1 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer"
                title="Hủy trích dẫn"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Attached image preview */}
          {attachedImageBase64 && (
            <div className="p-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 text-left">
              <div className="flex items-center space-x-2">
                <img src={attachedImageBase64} alt="Attached preview" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                <span className="text-[10px] text-emerald-600 font-mono">Ảnh đính kèm đã sẵn sàng mã hóa E2EE...</span>
              </div>
              <button onClick={() => setAttachedImageBase64(null)} className="p-1 rounded-full bg-white border border-slate-200 text-red-500 hover:text-red-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Attached file preview */}
          {attachedFile && (
            <div className="p-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 text-left">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 flex items-center justify-center bg-slate-200 rounded-lg">
                  <FileText className="w-4 h-4 text-[#008075]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-800 truncate max-w-[200px]">{attachedFile.fileName}</span>
                  <span className="text-[9px] text-emerald-600 font-mono">Tệp tin đã mã hóa E2EE...</span>
                </div>
              </div>
              <button onClick={() => setAttachedFile(null)} className="p-1 rounded-full bg-white border border-slate-200 text-red-500 hover:text-red-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Uploading file status */}
          {isUploadingFile && (
            <div className="p-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 text-left">
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-[#008075] border-t-transparent rounded-full animate-spin"></span>
                <span className="text-[10px] text-slate-500">Đang mã hóa và truyền tải tệp tin bảo mật...</span>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t border-slate-200 bg-white">
            {/* Combined Info & Self-Destruct Row */}
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100 text-[10px] text-slate-500 font-sans relative">
              {/* Left side: Partner Info */}
              <div className="flex items-center gap-1.5 min-w-0 mr-2 text-left">
                <LastSeenStatus user={liveRecipient} isAdmin={isUserAdmin} variant="tiny" />
                <span className="font-extrabold text-slate-800 text-[10px] truncate">
                  {liveRecipient.name}
                </span>
                {liveRecipient.username && (
                  <span className="font-mono text-[9px] font-bold text-dantri-green bg-dantri-green-light px-1 py-0.2 rounded border border-dantri-green/10 truncate shrink-0">
                    @{liveRecipient.username}
                  </span>
                )}
              </div>

              {selectedMessageIds.length > 0 && (
                <div className="flex items-center space-x-1 shrink-0 mr-auto">
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMessageIds([]);
                      setQuotedMessage(null);
                    }}
                    className="px-2 py-0.5 rounded text-[9px] bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold transition-all cursor-pointer font-sans animate-fade-in"
                    title="Bỏ chọn các tin nhắn"
                  >
                    Hủy chọn
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSelectedMessages();
                    }}
                    className="px-2 py-0.5 rounded text-[9px] bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold transition-all cursor-pointer font-sans animate-fade-in"
                    title="Xóa các tin nhắn đã chọn"
                  >
                    Xóa ({selectedMessageIds.length})
                  </button>
                </div>
              )}

              <div className="relative shrink-0 flex items-center space-x-1 font-mono">
                <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                <button
                  type="button"
                  onClick={() => setIsRealDestructOpen(!isRealDestructOpen)}
                  className="px-2 py-0.5 rounded text-[9px] bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold transition-all flex items-center space-x-1 cursor-pointer"
                  title="Bấm để chọn thời gian tự hủy"
                >
                  <span>{formatDestructLabel(realSelfDestruct)}</span>
                  <span className="text-[7px] opacity-70">▼</span>
                </button>

                {isRealDestructOpen && (
                  <>
                    {/* Invisible click-away backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsRealDestructOpen(false)} />
                    <div className="absolute right-0 bottom-full mb-1 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-20 flex flex-col space-y-0.5 min-w-[100px] animate-fade-in text-left font-sans">
                      {[null, 10, 300, 86400, 604800].map((val) => (
                        <button
                          key={val ?? 'off'}
                          type="button"
                          onClick={() => {
                            setRealSelfDestruct(val);
                            setIsRealDestructOpen(false);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[9px] text-left transition-colors w-full cursor-pointer ${realSelfDestruct === val ? 'bg-amber-50 text-amber-850 font-bold border border-amber-200/50' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          {formatDestructLabel(val)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Message/Image sender form */}
            <form onSubmit={handleSubmitWithQuote} className="flex items-end space-x-1.5 pb-0.5">
              {/* Grouped attachment & camera trigger (similar to Telegram ghim icon) */}
              <div className="relative shrink-0">
                {isAttachmentMenuOpen && (
                  <div 
                    className="fixed inset-0 z-40 cursor-default bg-transparent" 
                    onClick={() => setIsAttachmentMenuOpen(false)} 
                  />
                )}
                <button
                  type="button"
                  onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                  className="relative z-50 h-[36px] w-[36px] flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors shrink-0 shadow-sm"
                  title="Đính kèm phương tiện & camera"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>

                {/* Dropdown Menu */}
                <div className={`absolute bottom-full left-0 mb-1 w-60 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden py-1 text-slate-200 text-left ${isAttachmentMenuOpen ? 'block' : 'hidden'}`}>
                  <div className="px-2.5 py-1 text-[8.5px] font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider font-sans mb-1">
                    Đính kèm tệp tin
                  </div>
                  <label className="w-full text-left px-2.5 py-1.5 text-[10px] hover:bg-slate-800 hover:text-white transition-all font-sans flex items-center gap-1.5 cursor-pointer">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                    <span>Đính kèm hình ảnh</span>
                    <input type="file" accept="image/*" onChange={(e) => { handleImageFileChange(e); setIsAttachmentMenuOpen(false); }} className="hidden" />
                  </label>

                  {isGdriveEnabled && (
                    <label className="w-full text-left px-2.5 py-1.5 text-[10px] hover:bg-slate-800 hover:text-white transition-all font-sans flex items-center gap-1.5 cursor-pointer">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Đính kèm tệp tin bảo mật</span>
                      <input type="file" onChange={(e) => { handleGenericFileChange(e); setIsAttachmentMenuOpen(false); }} className="hidden" />
                    </label>
                  )}

                  <div className="px-2.5 py-1 text-[8.5px] font-bold text-amber-500 border-t border-b border-slate-800 uppercase tracking-wider font-sans mt-1">
                    Thiết bị của bạn (Camera)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      isCameraRequestingRef.current = true;
                      setCameraTriggerSource('real');
                      setCameraFacingMode('user');
                      setIsCameraOpen(true);
                      setIsAttachmentMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-[10px] hover:bg-slate-800 hover:text-white transition-all font-sans flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Chụp Camera Trước (Self)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      isCameraRequestingRef.current = true;
                      setCameraTriggerSource('real');
                      setCameraFacingMode('environment');
                      setIsCameraOpen(true);
                      setIsAttachmentMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-[10px] hover:bg-slate-800 hover:text-white transition-all font-sans flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                    Chụp Camera Sau (Self)
                  </button>

                  {isUserAdmin && (
                    <>
                      <div className="px-2.5 py-1 text-[8.5px] font-bold text-amber-500 border-t border-b border-slate-800 uppercase tracking-wider font-sans mt-1">
                        Yêu cầu ghi hình đối tác {liveRecipient?.hasCameraPermission ? '(Đã cấp)' : '(Chưa cấp)'}
                      </div>
                      <button
                        type="button"
                        disabled={!liveRecipient?.hasCameraPermission}
                        onClick={() => {
                          handleSendRemoteCameraRequestReal('user');
                          setIsAttachmentMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 text-[10px] transition-all font-semibold font-sans flex items-center gap-1.5 ${
                          liveRecipient?.hasCameraPermission 
                            ? 'text-amber-300 hover:bg-slate-800 hover:text-amber-100 cursor-pointer' 
                            : 'text-slate-500 opacity-40 blur-[0.5px] cursor-not-allowed'
                        }`}
                        title={!liveRecipient?.hasCameraPermission ? "Đối tác chưa cấp quyền Camera hệ thống" : "Yêu cầu Camera Trước của đối tác"}
                      >
                        <Camera className="w-3 h-3 text-amber-400" />
                        Yêu cầu Camera Trước
                      </button>
                      <button
                        type="button"
                        disabled={!liveRecipient?.hasCameraPermission}
                        onClick={() => {
                          handleSendRemoteCameraRequestReal('environment');
                          setIsAttachmentMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 text-[10px] transition-all font-semibold font-sans flex items-center gap-1.5 ${
                          liveRecipient?.hasCameraPermission 
                            ? 'text-amber-300 hover:bg-slate-800 hover:text-amber-100 cursor-pointer' 
                            : 'text-slate-500 opacity-40 blur-[0.5px] cursor-not-allowed'
                        }`}
                        title={!liveRecipient?.hasCameraPermission ? "Đối tác chưa cấp quyền Camera hệ thống" : "Yêu cầu Camera Sau của đối tác"}
                      >
                        <Camera className="w-3 h-3 text-amber-400" />
                        Yêu cầu Camera Sau
                      </button>
                    </>
                  )}
                </div>
              </div>

              <textarea
                ref={realInputRef as any}
                rows={1}
                value={realInput}
                onChange={(e) => setRealInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={() => {
                  // Sửa lỗi cuộn/lệch giao diện trên iOS Safari khi ẩn bàn phím ảo
                  // Sử dụng scrollIntoView để định vị chính xác ô nhập liệu nằm ngay phía trên viền dưới của màn hình
                  setTimeout(() => {
                    const el = realInputRef.current;
                    if (el) {
                      try {
                        el.scrollIntoView({
                          behavior: 'smooth',
                          block: 'end'
                        });
                      } catch (e) {
                        el.scrollIntoView(false);
                      }
                    }
                  }, 120);
                }}
                disabled={!realUser.isBiometricAuthenticated}
                placeholder={
                  attachedFile
                    ? "Thêm chú thích tệp tin (tùy chọn)..."
                    : attachedImageBase64
                      ? "Thêm chú thích ảnh (tùy chọn)..."
                      : isMobileDevice
                        ? "Nhắn tin..."
                        : "Nhắn tin... (Shift+Enter để xuống dòng)"
                }
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-dantri-green/40 focus:ring-2 focus:ring-dantri-green/5 placeholder:text-slate-400 disabled:opacity-60 resize-none min-h-[36px] max-h-[120px] leading-relaxed scrollbar-none"
              />

              <button
                type="submit"
                disabled={(!realInput.trim() && !attachedImageBase64 && !attachedFile) || !realUser.isBiometricAuthenticated}
                className="h-[36px] w-[36px] flex items-center justify-center bg-dantri-green hover:bg-dantri-green-hover disabled:bg-slate-50 text-white disabled:text-slate-400 rounded-xl border border-slate-200 shadow-sm shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
        <SecurityHubSidebar
          showSecurityHub={showSecurityHub}
          setShowSecurityHub={setShowSecurityHub}
          realUser={realUser}
          activeRecipient={activeRecipient}
          isPushSubscribed={isPushSubscribed}
          subscribeUserToPush={subscribeUserToPush}
          unsubscribeUserFromPush={unsubscribeUserFromPush}
          prefWebPush={prefWebPush}
          handleTogglePrefWebPush={handleTogglePrefWebPush}
          prefTelegram={prefTelegram}
          handleTogglePrefTelegram={handleTogglePrefTelegram}
          systemLogs={systemLogs}
        />
      </div>

      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-50 cursor-default bg-transparent" 
            onMouseDown={() => {
              if (isMobileDevice) return; // Prevent synthetic mousedown from closing menu on mobile
              if (contextMenu && Date.now() - contextMenu.openedAt > 250) {
                setContextMenu(null);
              }
            }}
            onTouchStart={() => {
              if (contextMenu && Date.now() - contextMenu.openedAt > 250) {
                setContextMenu(null);
              }
            }}
            onContextMenu={(e) => { 
              e.preventDefault(); 
              if (contextMenu && Date.now() - contextMenu.openedAt > 250) {
                setContextMenu(null);
              }
            }}
          />
          <div 
            className="fixed bg-white/95 backdrop-blur-md border border-slate-200/85 rounded-2xl shadow-2xl py-1 z-[60] min-w-[150px] animate-fade-in text-left flex flex-col font-sans"
            style={{
              left: `${Math.min(contextMenu.x, window.innerWidth - 170)}px`,
              top: `${Math.min(contextMenu.y, window.innerHeight - 190)}px`
            }}
          >
            <button
              onClick={() => {
                if (Date.now() - contextMenu.openedAt < 400) return;
                handleReplyOption(contextMenu.msg);
              }}
              className="w-full px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium cursor-pointer"
            >
              <CornerUpLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>Trả lời</span>
            </button>
            <button
              onClick={() => {
                if (Date.now() - contextMenu.openedAt < 400) return;
                handleCopyOption(contextMenu.msg);
              }}
              className="w-full px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium cursor-pointer"
            >
              <CopyIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </button>
            <button
              onClick={() => {
                if (Date.now() - contextMenu.openedAt < 400) return;
                handleDeleteOption(contextMenu.msg);
              }}
              className="w-full px-4 py-2.5 text-xs text-red-600 hover:bg-red-50/80 transition-colors flex items-center gap-2 font-medium cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Xóa</span>
            </button>
            <button
              onClick={() => {
                if (Date.now() - contextMenu.openedAt < 400) return;
                handleSelectOption(contextMenu.msg);
              }}
              className="w-full px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>Chọn</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
