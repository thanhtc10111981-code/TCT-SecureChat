import React from 'react';
import {
  ArrowLeft,
  ArrowDown,
  Clock,
  X,
  FileText,
  CornerUpLeft,
  Copy as CopyIcon,
  Trash2,
  CheckSquare,
} from 'lucide-react';
import { UserSession, Message } from '../types';
import SecurityHubSidebar from './SecurityHubSidebar';
import { resizeAndCompressImage } from '../utils/image';
import ChatHeader from './ChatHeader';
import MessageItem from './MessageItem';
import ChatInputArea from './ChatInputArea';
import TelegramContextMenu from './TelegramContextMenu';

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
  realInputRef: React.RefObject<HTMLTextAreaElement>;
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
  handleSelfDestruct: (messageId: string) => void;
  usersList: UserSession[];
  setUsersList: React.Dispatch<React.SetStateAction<UserSession[]>>;
  disguiseArticleTitle: string;
  disguiseArticleContent: string;
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
  handleSelfDestruct,
  usersList,
  setUsersList,
  disguiseArticleTitle,
  disguiseArticleContent
}: ChatAreaProps) {
  const liveRecipient = usersList.find(u => u.id === activeRecipient.id) || activeRecipient;
  const [isMobileDevice, setIsMobileDevice] = React.useState(false);
  const [viewportStyle, setViewportStyle] = React.useState<React.CSSProperties>({});
  const [selectedMessageIds, setSelectedMessageIds] = React.useState<string[]>([]);
  const [quotedMessage, setQuotedMessage] = React.useState<{ id: string; senderId: string; senderName: string; text: string } | null>(null);
  const isUserAdmin = realUser?.username === 'phong' || realUser?.role === 'admin';
  const isJiraTheme = realUser?.theme === 'jira';

  const [isConfirmingUnlink, setIsConfirmingUnlink] = React.useState(false);
  const [chatFontSize, setChatFontSize] = React.useState<'xs' | 'sm' | 'base' | 'lg'>(() => {
    return (localStorage.getItem('chat_font_size') as 'xs' | 'sm' | 'base' | 'lg') || 'sm';
  });
  const [disguiseOpacity, setDisguiseOpacity] = React.useState<number>(() => {
    const val = localStorage.getItem('chat_disguise_opacity');
    return val ? parseFloat(val) : 0.6;
  });

  const renderDisguiseBackground = () => {
    if (isJiraTheme) return null;

    const displayTitle = disguiseArticleTitle || "Mã hóa đầu cuối (E2EE) trở thành lá chắn tối cao bảo vệ thông tin cá nhân năm 2026";
    const displayContent = disguiseArticleContent || `Trong bối cảnh các cuộc tấn công mạng nhằm vào dữ liệu người dùng ngày càng gia tăng, cơ chế mã hóa đầu cuối (End-to-End Encryption - E2EE) đã trở thành tiêu chuẩn bắt buộc cho mọi nền tảng truyền thông bảo mật.
Mã hóa đầu cuối (E2EE) là hệ thống truyền thông trong đó chỉ những người đang trò chuyện trực tiếp mới có thể đọc được nội dung tin nhắn. Về mặt kỹ thuật, tin nhắn được mã hóa thành bản mã (ciphertext) ngay tại thiết bị người gửi bằng khóa công khai (Public Key) của người nhận và chỉ có thể giải mã bằng khóa riêng tư (Private Key) tương ứng lưu trữ cục bộ.
Tại sao máy chủ cũng không thể đọc tin nhắn? Trong các ứng dụng trò chuyện thông thường, tin nhắn được truyền qua mạng dưới dạng văn bản rõ hoặc chỉ được mã hóa trên đường truyền (Transit Encryption). Khi tin nhắn đến máy chủ, nó sẽ được giải mã để máy chủ lưu trữ hoặc xử lý. Điều này có nghĩa là quản trị viên máy chủ hoặc bất kỳ tin tặc nào xâm nhập được vào máy chủ đều có thể đọc toàn bộ tin nhắn của bạn.
Với E2EE, máy chủ chỉ đóng vai trò là một bưu tá trung chuyển các gói tin mã hóa nhị phân. Do không giữ Khóa riêng tư RSA hay khóa đối xứng AES của thiết bị người dùng, máy chủ hoàn toàn không có khả năng giải mật mã. Kể cả khi cơ sở dữ liệu bị rò rỉ, kẻ tấn công cũng chỉ thu về được các bản mã vô nghĩa.`;

    const paragraphs = displayContent.split('\n').filter(p => p.trim() !== '');

    return (
      <div 
        className="absolute inset-0 p-6 md:p-8 overflow-y-auto select-none pointer-events-none transition-opacity duration-300 flex flex-col justify-start"
        style={{ opacity: disguiseOpacity }}
      >
        <div className="text-[10px] text-slate-500 font-sans uppercase tracking-wider mb-2 flex items-center gap-1.5 font-semibold">
          <span>Trang chủ</span>
          <span>&gt;</span>
          <span>Sức mạnh số</span>
          <span>&gt;</span>
          <span>Công nghệ</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold font-serif text-slate-800 leading-tight mb-3">
          {displayTitle}
        </h1>
        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-sans mb-3">
          <span>Thứ năm, 16/07/2026 - 18:10</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full" />
          <span>Theo Dân trí</span>
        </div>
        <div className="h-[1px] bg-slate-200 w-full mb-3" />
        <div className="flex items-center gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100/50 mb-4 text-[10px] text-slate-500">
          <span className="font-bold shrink-0">Nghe bài viết:</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600"><span className="text-[8px]">▶</span> Nam miền Bắc</span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600"><span className="text-[8px]">▶</span> Nam miền Trung</span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600"><span className="text-[8px]">▶</span> Nữ miền Nam</span>
          </div>
        </div>
        <div className="space-y-3 font-serif text-sm md:text-base text-slate-700 leading-relaxed max-w-3xl">
          {paragraphs.map((p, index) => (
            <p key={index} className={index === 0 ? "font-bold text-slate-800 text-[13px] md:text-sm leading-relaxed" : ""}>
              {p}
            </p>
          ))}
        </div>
      </div>
    );
  };
  const [highlightedMessageId, setHighlightedMessageId] = React.useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = React.useState(false);
  const [showInputFontDropdown, setShowInputFontDropdown] = React.useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = React.useState(false);
  const [isGdriveEnabled, setIsGdriveEnabled] = React.useState(false);
  const [isUploadingFile, setIsUploadingFile] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState<{ msg: Message; x: number; y: number; openedAt: number; isTouch?: boolean } | null>(null);
  const [activeEmojiPickerMsgId, setActiveEmojiPickerMsgId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (realUser && !realUser.isAppUnlocked) {
      setContextMenu(null);
    }
  }, [realUser?.isAppUnlocked]);

  const longPressTimeoutRef = React.useRef<any>(null);
  const isLongPressActiveRef = React.useRef(false);
  const touchStartPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const hasTouchedRef = React.useRef(false);
  const hasDraggedRef = React.useRef(false);
  const ignoreNextSelectionClearRef = React.useRef(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const lastTouchTimeRef = React.useRef<number>(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setShowScrollBottom(Math.abs(target.scrollTop) > 150);
  };

  const handleQuoteClick = (quotedMsgId: string) => {
    const element = document.getElementById(`chat-message-${quotedMsgId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(quotedMsgId);
      setTimeout(() => setHighlightedMessageId(null), 1500);
    } else {
      addLog('Không tìm thấy tin nhắn được trích dẫn (có thể đã tự hủy hoặc đã bị xóa).', 'warn');
    }
  };

  const handleReactToMessage = async (msgId: string, emoji: string) => {
    try {
      // Optimistic update
      setRealMessages((prev) =>
        prev.map((m) => {
          if (m.id === msgId) {
            const current = m.reactions || {};
            const updated = { ...current };
            if (updated[realUser.id] === emoji) {
              delete updated[realUser.id];
            } else {
              updated[realUser.id] = emoji;
            }
            return { ...m, reactions: updated };
          }
          return m;
        })
      );

      const response = await fetch(`/api/messages/${msgId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: realUser.id,
          emoji,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to react');
      }

      const resData = await response.json();
      if (resData && resData.reactions) {
        setRealMessages((prev) =>
          prev.map((m) => {
            if (m.id === msgId) {
              return { ...m, reactions: resData.reactions };
            }
            return m;
          })
        );
      }
    } catch (err) {
      addLog('Lỗi khi thả biểu tượng cảm xúc.', 'warn');
      console.error('Error reacting to message:', err);
    }
  };

  const scrollToBottom = () => { setTimeout(() => { if (scrollContainerRef.current) { try { scrollContainerRef.current.scrollTop = 0; } catch (e) {} } }, 100); };

  const startPress = (e: React.MouseEvent | React.TouchEvent, msg: Message) => {
    const isTouch = 'touches' in e;
    if (!isTouch && (e as React.MouseEvent).button === 2) {
      return;
    }
    if (isTouch) {
      lastTouchTimeRef.current = Date.now();
    } else if (Date.now() - lastTouchTimeRef.current < 800) {
      return;
    }

    const target = e.target as HTMLElement;
    if (
      target.closest('a') ||
      target.closest('button') ||
      target.closest('img') ||
      target.closest('.quote-block-interactive') ||
      target.closest('.file-card') ||
      target.closest('.emoji-picker') ||
      target.closest('.reaction-button') ||
      target.closest('.lucide') ||
      target.tagName === 'A' ||
      target.tagName === 'BUTTON'
    ) {
      return;
    }

    if (activeEmojiPickerMsgId) {
      setActiveEmojiPickerMsgId(null);
    }

    hasDraggedRef.current = false;
    hasTouchedRef.current = isTouch;
    
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    touchStartPosRef.current = { x: clientX, y: clientY };

    isLongPressActiveRef.current = false;
    longPressTimeoutRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      ignoreNextSelectionClearRef.current = true;
      
      const x = clientX;
      const y = clientY;
      setContextMenu({ msg, x, y, openedAt: Date.now(), isTouch });
      if (navigator.vibrate) {
        try { navigator.vibrate(60); } catch (vErr) {}
      }
    }, 600);
  };

  const movePress = (e: React.MouseEvent | React.TouchEvent) => {
    const isTouch = 'touches' in e;
    if (!isTouch && (e as React.MouseEvent).button === 2) {
      return;
    }
    if (!isTouch && Date.now() - lastTouchTimeRef.current < 800) {
      return;
    }

    if (!touchStartPosRef.current) return;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    const diffX = Math.abs(clientX - touchStartPosRef.current.x);
    const diffY = Math.abs(clientY - touchStartPosRef.current.y);
    
    if (diffX > 8 || diffY > 8) {
      hasDraggedRef.current = true;
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
    }
  };

  const endPress = (e: React.MouseEvent | React.TouchEvent, msg: Message) => {
    const isTouch = e.type === 'touchend';
    if (!isTouch && (e as React.MouseEvent).button === 2) {
      return;
    }
    if (!isTouch && Date.now() - lastTouchTimeRef.current < 800) {
      return;
    }

    const target = e.target as HTMLElement;
    if (
      target.closest('a') ||
      target.closest('button') ||
      target.closest('img') ||
      target.closest('.quote-block-interactive') ||
      target.closest('.file-card') ||
      target.closest('.emoji-picker') ||
      target.closest('.reaction-button') ||
      target.closest('.lucide') ||
      target.tagName === 'A' ||
      target.tagName === 'BUTTON'
    ) {
      return;
    }

    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    
    if (isLongPressActiveRef.current) {
      ignoreNextSelectionClearRef.current = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (hasDraggedRef.current) {
      return;
    }

    if (isTouch && !hasTouchedRef.current) {
      return;
    }

    if (ignoreNextSelectionClearRef.current) {
      ignoreNextSelectionClearRef.current = false;
      return;
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
    setContextMenu({ msg, x: e.clientX, y: e.clientY, openedAt: Date.now(), isTouch: false });
  };

  const handleReplyOption = (msg: Message) => {
    setQuotedMessage({
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.senderId === realUser.id ? 'Tôi' : activeRecipient?.name || 'Đối tác',
      text: msg.decryptedText || ''
    });
    setSelectedMessageIds([msg.id]);
    setContextMenu(null);
  };

  const handleCopyOption = (msg: Message) => {
    if (msg.isDestroyed) {
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
        setRealMessages(prev => prev.filter(m => !selectedMessageIds.includes(m.id)));
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
    if (!isMobileDevice || typeof window === 'undefined' || !window.visualViewport) {
      setViewportStyle({});
      return;
    }

    const vv = window.visualViewport;

    const updateViewport = () => {
      const isKeyboardActive = window.innerHeight - vv.height > 120;
      if (isKeyboardActive) {
        setViewportStyle({
          position: 'fixed',
          height: `${vv.height}px`,
          top: `${vv.offsetTop}px`,
          left: 0,
          right: 0,
          zIndex: 45,
        });
        try {
          window.scrollTo(0, 0);
        } catch (e) {}
      } else {
        setViewportStyle({});
      }
    };

    vv.addEventListener('resize', updateViewport);
    vv.addEventListener('scroll', updateViewport);

    updateViewport();

    const handleFocusIn = () => {
      setTimeout(updateViewport, 80);
      setTimeout(updateViewport, 200);
    };
    const handleFocusOut = () => {
      setTimeout(updateViewport, 80);
      setTimeout(updateViewport, 200);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      vv.removeEventListener('resize', updateViewport);
      vv.removeEventListener('scroll', updateViewport);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, [isMobileDevice]);

  React.useEffect(() => {
    const textarea = realInputRef.current;
    if (textarea && textarea.tagName === 'TEXTAREA') {
      textarea.style.height = 'auto';
      const targetHeight = realInput ? Math.min(textarea.scrollHeight, 120) : 36;
      textarea.style.height = `${targetHeight}px`;
    }
  }, [realInput, realInputRef]);

  React.useEffect(() => {
    if (activeRecipient) {
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
        return;
      }
      if (e.shiftKey || e.altKey) {
        return;
      } else {
        e.preventDefault();
        if (realInput.trim() || attachedImageBase64) {
          handleSendRealMessage(e as any, quotedMessage, () => {
            setQuotedMessage(null);
            setSelectedMessageIds([]);
            scrollToBottom();
            setTimeout(() => {
              realInputRef.current?.focus();
            }, 50);
          });
          setQuotedMessage(null);
          setSelectedMessageIds([]);
          scrollToBottom();
          realInputRef.current?.focus();
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
      setTimeout(() => {
        realInputRef.current?.focus();
      }, 50);
    });
    setQuotedMessage(null);
    setSelectedMessageIds([]);
    scrollToBottom();
    realInputRef.current?.focus();
  };

  const handleChatBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // Check if the click is on a message bubble, button, link, input, textarea, label, emoji picker, context menu, etc.
    const isInteractive = target.closest(
      '.message-bubble, button, a, input, textarea, label, [role="button"], .reaction-button, .emoji-picker, .context-menu'
    );
    
    if (!isInteractive) {
      if (document.activeElement === realInputRef.current) {
        realInputRef.current?.blur();
        
        // Reset scroll position of window for iOS Safari and scroll to bottom of chat area after a small timeout
        setTimeout(() => {
          try {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
          } catch (err) {}
          scrollToBottom();
        }, 80);
      }
    }
  };

  const [swipeX, setSwipeX] = React.useState(0);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (activeRecipient && touch.clientX <= 60) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      setSwipeX(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

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
      style={viewportStyle}
    >
      {/* Swipe back visual feedback overlay */}
      {swipeX > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 z-50 pointer-events-none flex items-center justify-start pl-3"
          style={{
            width: `${Math.min(swipeX, 150)}px`,
            background: `linear-gradient(to right, ${isJiraTheme ? 'rgba(0, 82, 204' : 'rgba(16, 185, 129'}, ${Math.min(swipeX / 300, 0.15)}) 0%, ${isJiraTheme ? 'rgba(0, 82, 204' : 'rgba(16, 185, 129'}, 0) 100%)`,
            borderLeft: `${Math.min(swipeX / 20, 4)}px solid ${isJiraTheme ? 'rgba(0, 82, 204' : 'rgba(16, 185, 129'}, ${Math.min(swipeX / 100, 0.8)})`,
            transition: 'width 0.05s ease-out'
          }}
        >
          <div 
            className={`w-8 h-8 rounded-full bg-white border border-slate-200/80 shadow-md flex items-center justify-center transition-transform duration-75 ${isJiraTheme ? 'text-jira-blue' : 'text-dantri-green'}`}
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
          <ChatHeader
            activeRecipient={activeRecipient}
            liveRecipient={liveRecipient}
            isUserAdmin={isUserAdmin}
            isJiraTheme={isJiraTheme}
            setActiveRecipient={setActiveRecipient}
            setAttachedImageBase64={setAttachedImageBase64}
            isConfirmingUnlink={isConfirmingUnlink}
            setIsConfirmingUnlink={setIsConfirmingUnlink}
            handleUnlinkPartner={handleUnlinkPartner}
            showSecurityHub={showSecurityHub}
            setShowSecurityHub={setShowSecurityHub}
            chatFontSize={chatFontSize}
            setChatFontSize={setChatFontSize}
            handleLockReal={handleLockReal}
            addLog={addLog}
            disguiseOpacity={disguiseOpacity}
            setDisguiseOpacity={setDisguiseOpacity}
          />

          {renderDisguiseBackground()}

          {/* Messages Area */}
          <div ref={scrollContainerRef} onScroll={handleScroll} onClick={handleChatBackgroundClick} className="flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col-reverse scrollbar-none bg-transparent relative z-10">
            {[...realMessages]
              .filter(
                m => (m.senderId === activeRecipient.id && m.recipientId === realUser.id) ||
                     (m.senderId === realUser.id && m.recipientId === activeRecipient.id)
              )
              .filter(msg => {
                if (isUserAdmin) return true; // Admins see everything
                try {
                  const parsed = JSON.parse(msg.decryptedText || '{}');
                  if (parsed.type === 'camera_request') return false;
                  if (parsed.type === 'image' && parsed.isStealth) return false;
                } catch {}
                return true;
              })
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((msg) => (
                <MessageItem
                  key={msg.id}
                  msg={msg}
                  realUser={realUser}
                  isUserAdmin={isUserAdmin}
                  isJiraTheme={isJiraTheme}
                  chatFontSize={chatFontSize}
                  selectedMessageIds={selectedMessageIds}
                  highlightedMessageId={highlightedMessageId}
                  formatCountdown={formatCountdown}
                  renderMessageContent={renderMessageContent}
                  handleQuoteClick={handleQuoteClick}
                  startPress={startPress}
                  movePress={movePress}
                  endPress={endPress}
                  handleContextMenu={handleContextMenu}
                  handleReactToMessage={handleReactToMessage}
                  handleRetryMessage={handleRetryMessage}
                  isMobileDevice={isMobileDevice}
                  activeEmojiPickerMsgId={activeEmojiPickerMsgId}
                  setActiveEmojiPickerMsgId={setActiveEmojiPickerMsgId}
                  onSelfDestruct={handleSelfDestruct}
                  partnerUsername={activeRecipient.username}
                />
              ))}

            {hasMoreMessages[activeRecipient.id] !== false && (
              <div className="flex justify-center py-2 select-none">
                <button
                  disabled={isLoadingOlder}
                  onClick={() => loadOlderMessages(activeRecipient.id)}
                  className={`px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold border border-slate-200 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-sans cursor-pointer shadow-sm ${isJiraTheme ? 'text-jira-blue hover:text-jira-blue-hover' : 'text-dantri-green hover:text-dantri-green-hover'}`}
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
            <div className={`p-2 border-t border-slate-200 flex items-center justify-between shrink-0 text-left border-l-4 transition-all select-none animate-fade-in ${
              isJiraTheme 
                ? 'bg-[#deebff]/50 border-l-jira-blue text-[#0747a6]' 
                : 'bg-dantri-green-light/60 border-l-dantri-green text-dantri-green'
            }`}>
              <div className="flex flex-col text-[11px] max-w-[85%]">
                <span className={`font-bold flex items-center gap-1 ${
                  isJiraTheme ? 'text-jira-blue' : 'text-dantri-green'
                }`}>
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

          {/* Floating Scroll to Bottom Button */}
          {showScrollBottom && (
            <button
              type="button"
              onClick={() => scrollToBottom()}
              className={`absolute bottom-32 right-4 z-40 p-2.5 rounded-full shadow-lg border bg-white/95 backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer animate-fade-in ${
                isJiraTheme 
                  ? 'border-slate-200/80 text-jira-blue hover:text-white hover:bg-jira-blue bg-white' 
                  : 'border-slate-200/80 text-dantri-green hover:text-white hover:bg-dantri-green bg-white'
              }`}
              title="Cuộn xuống dưới cùng"
            >
              <ArrowDown className="w-4.5 h-4.5" />
            </button>
          )}

          <ChatInputArea
            liveRecipient={liveRecipient}
            realUser={realUser}
            isUserAdmin={isUserAdmin}
            isJiraTheme={isJiraTheme}
            chatFontSize={chatFontSize}
            selectedMessageIds={selectedMessageIds}
            setSelectedMessageIds={setSelectedMessageIds}
            quotedMessage={quotedMessage}
            setQuotedMessage={setQuotedMessage}
            attachedImageBase64={attachedImageBase64}
            setAttachedImageBase64={setAttachedImageBase64}
            attachedFile={attachedFile}
            setAttachedFile={setAttachedFile}
            isUploadingFile={isUploadingFile}
            realSelfDestruct={realSelfDestruct}
            setRealSelfDestruct={setRealSelfDestruct}
            isRealDestructOpen={isRealDestructOpen}
            setIsRealDestructOpen={setIsRealDestructOpen}
            formatDestructLabel={formatDestructLabel}
            realInput={realInput}
            setRealInput={setRealInput}
            realInputRef={realInputRef}
            isMobileDevice={isMobileDevice}
            isAttachmentMenuOpen={isAttachmentMenuOpen}
            setIsAttachmentMenuOpen={setIsAttachmentMenuOpen}
            isGdriveEnabled={isGdriveEnabled}
            handleImageFileChange={handleImageFileChange}
            handleGenericFileChange={handleGenericFileChange}
            isCameraRequestingRef={isCameraRequestingRef}
            setCameraTriggerSource={setCameraTriggerSource}
            setCameraFacingMode={setCameraFacingMode}
            setIsCameraOpen={setIsCameraOpen}
            handleSendRemoteCameraRequestReal={handleSendRemoteCameraRequestReal}
            handleSubmitWithQuote={handleSubmitWithQuote}
            handleDeleteSelectedMessages={handleDeleteSelectedMessages}
            handleKeyDown={handleKeyDown}
            handlePaste={handlePaste}
          />
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
        <TelegramContextMenu
          msg={contextMenu.msg}
          realUser={realUser}
          isJiraTheme={isJiraTheme}
          chatFontSize={chatFontSize}
          isTouch={!!contextMenu.isTouch}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onReact={(emoji) => handleReactToMessage(contextMenu.msg.id, emoji)}
          onReply={() => handleReplyOption(contextMenu.msg)}
          onCopy={() => handleCopyOption(contextMenu.msg)}
          onDelete={() => handleDeleteOption(contextMenu.msg)}
          onSelect={() => handleSelectOption(contextMenu.msg)}
          renderMessageContent={renderMessageContent}
        />
      )}
    </div>
  );
}
