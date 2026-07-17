import React from 'react';
import { Clock, Send, Paperclip, Image as ImageIcon, FileText, Camera, Settings } from 'lucide-react';
import { UserSession } from '../types';
import { LastSeenStatus } from './LastSeenStatus';
import { ShorthandConfigModal } from './ShorthandConfigModal';

interface ChatInputAreaProps {
  liveRecipient: UserSession;
  realUser: UserSession;
  isUserAdmin: boolean;
  isJiraTheme: boolean;
  selectedMessageIds: string[];
  setSelectedMessageIds: (val: string[]) => void;
  quotedMessage: { id: string; senderId: string; senderName: string; text: string } | null;
  setQuotedMessage: (val: { id: string; senderId: string; senderName: string; text: string } | null) => void;
  attachedImageBase64: string | null;
  setAttachedImageBase64: (val: string | null) => void;
  attachedFile: { fileId: string; fileName: string } | null;
  setAttachedFile: (val: { fileId: string; fileName: string } | null) => void;
  isUploadingFile: boolean;
  realSelfDestruct: number | null;
  setRealSelfDestruct: (val: number | null) => void;
  isRealDestructOpen: boolean;
  setIsRealDestructOpen: (val: boolean) => void;
  formatDestructLabel: (val: number | null) => string;
  realInput: string;
  setRealInput: (val: string) => void;
  realInputRef: React.RefObject<HTMLTextAreaElement>;
  isMobileDevice: boolean;
  isAttachmentMenuOpen: boolean;
  setIsAttachmentMenuOpen: (val: boolean) => void;
  isGdriveEnabled: boolean;
  handleImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGenericFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isCameraRequestingRef: React.MutableRefObject<boolean>;
  setCameraTriggerSource: (val: 'real' | 'guest') => void;
  setCameraFacingMode: (val: 'user' | 'environment') => void;
  setIsCameraOpen: (val: boolean) => void;
  handleSendRemoteCameraRequestReal: (facing: 'user' | 'environment') => void;
  handleSubmitWithQuote: (e: React.FormEvent) => void;
  handleDeleteSelectedMessages: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  chatFontSize: 'xs' | 'sm' | 'base' | 'lg';
}

export default function ChatInputArea({
  liveRecipient,
  realUser,
  isUserAdmin,
  isJiraTheme,
  selectedMessageIds,
  setSelectedMessageIds,
  quotedMessage,
  setQuotedMessage,
  attachedImageBase64,
  setAttachedImageBase64,
  attachedFile,
  setAttachedFile,
  isUploadingFile,
  realSelfDestruct,
  setRealSelfDestruct,
  isRealDestructOpen,
  setIsRealDestructOpen,
  formatDestructLabel,
  realInput,
  setRealInput,
  realInputRef,
  isMobileDevice,
  isAttachmentMenuOpen,
  setIsAttachmentMenuOpen,
  isGdriveEnabled,
  handleImageFileChange,
  handleGenericFileChange,
  isCameraRequestingRef,
  setCameraTriggerSource,
  setCameraFacingMode,
  setIsCameraOpen,
  handleSendRemoteCameraRequestReal,
  handleSubmitWithQuote,
  handleDeleteSelectedMessages,
  handleKeyDown,
  handlePaste,
  chatFontSize,
}: ChatInputAreaProps) {
  const [enableShorthand, setEnableShorthand] = React.useState(() => {
    return localStorage.getItem('securecrypt_enable_shorthand') === 'true';
  });
  const [isShorthandModalOpen, setIsShorthandModalOpen] = React.useState(false);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setEnableShorthand(checked);
    localStorage.setItem('securecrypt_enable_shorthand', checked ? 'true' : 'false');
  };

  return (
    <div className="p-3 border-t border-slate-200 bg-transparent relative z-10">
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

        <div className="flex items-center space-x-1.5 shrink-0 font-sans ml-auto mr-2">
          <label className="flex items-center space-x-1 cursor-pointer select-none text-[9px] font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 transition-colors" title="Tự động sửa lỗi chính tả và các từ viết tắt khi gửi tin nhắn">
            <input
              type="checkbox"
              checked={enableShorthand}
              onChange={handleCheckboxChange}
              className="rounded text-dantri-green focus:ring-dantri-green w-2.5 h-2.5 cursor-pointer"
            />
            <span>Sửa viết tắt & lỗi gõ</span>
          </label>
          <button
            type="button"
            onClick={() => setIsShorthandModalOpen(true)}
            className="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200 bg-white transition-all cursor-pointer flex items-center justify-center"
            title="Cấu hình từ viết tắt cá nhân"
          >
            <Settings className="w-2.5 h-2.5" />
          </button>
        </div>

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
        {/* Grouped attachment & camera trigger */}
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
              className="w-full text-left px-2.5 py-1.5 text-[10px] hover:bg-slate-800 hover:text-white transition-all font-sans flex items-center gap-1.5 w-full text-left"
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
              className="w-full text-left px-2.5 py-1.5 text-[10px] hover:bg-slate-800 hover:text-white transition-all font-sans flex items-center gap-1.5 w-full text-left"
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
          ref={realInputRef}
          rows={1}
          value={realInput}
          onChange={(e) => setRealInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => {
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
          disabled={!realUser.isAppUnlocked}
          placeholder={
            attachedFile
              ? "Thêm chú thích tệp tin (tùy chọn)..."
              : attachedImageBase64
                ? "Thêm chú thích ảnh (tùy chọn)..."
                : isMobileDevice
                  ? "Nhắn tin..."
                  : "Nhắn tin... (Shift+Enter để xuống dòng)"
          }
          className={`flex-1 border rounded-xl px-3 py-1.5 h-[36px] ${
            chatFontSize === 'xs' ? 'text-xs' : chatFontSize === 'sm' ? 'text-sm' : chatFontSize === 'base' ? 'text-base' : 'text-lg'
          } focus:outline-none focus:ring-2 placeholder:text-slate-400 disabled:opacity-60 resize-none min-h-[36px] max-h-[120px] leading-relaxed scrollbar-none ${
            isJiraTheme 
              ? 'bg-[#deebff]/75 border-[#b3d4ff]/60 text-slate-900 focus:border-jira-blue/40 focus:ring-jira-blue/5' 
              : 'bg-dantri-green-light/80 border-dantri-green/15 text-slate-850 focus:border-dantri-green/40 focus:ring-dantri-green/5'
          }`}
        />

        <button
          type="submit"
          disabled={(!realInput.trim() && !attachedImageBase64 && !attachedFile) || !realUser.isAppUnlocked}
          className={`h-[36px] w-[36px] flex items-center justify-center disabled:bg-slate-50 text-white disabled:text-slate-400 rounded-xl border border-slate-200 shadow-sm shrink-0 ${
            isJiraTheme 
              ? 'bg-jira-blue hover:bg-jira-blue-hover' 
              : 'bg-dantri-green hover:bg-dantri-green-hover'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
      <ShorthandConfigModal isOpen={isShorthandModalOpen} onClose={() => setIsShorthandModalOpen(false)} isAdmin={isUserAdmin} />
    </div>
  );
}
