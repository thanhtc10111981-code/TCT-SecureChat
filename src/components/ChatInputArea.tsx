import React from 'react';
import { Clock, Send, Paperclip, Image as ImageIcon, FileText, Camera } from 'lucide-react';
import { UserSession } from '../types';
import { LastSeenStatus } from './LastSeenStatus';

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
  const formatDestructLabelShort = (sec: number | null): string => {
    if (sec === null) return '';
    if (sec === 1) return '1s';
    if (sec === 2) return '2s';
    if (sec === 3) return '3s';
    if (sec === 4) return '4s';
    if (sec === 5) return '5s';
    if (sec === 10) return '10s';
    if (sec === 15) return '15s';
    if (sec === 30) return '30s';
    if (sec === 60) return '1m';
    if (sec === 3600) return '1h';
    if (sec === 86400) return '1d';
    if (sec === 604800) return '1w';
    if (sec >= 604800) return `${Math.floor(sec / 604800)}w`;
    if (sec >= 86400) return `${Math.floor(sec / 86400)}d`;
    if (sec >= 3600) return `${Math.floor(sec / 3600)}h`;
    if (sec >= 60) return `${Math.floor(sec / 60)}m`;
    return `${sec}s`;
  };

  return (
    <div className="p-3 border-t border-slate-200 bg-transparent relative z-10">
      {selectedMessageIds.length > 0 && (
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100 text-[10px] text-slate-500 font-sans relative">
          <div className="flex items-center space-x-1 shrink-0">
            <span className="font-bold text-slate-700">Đã chọn {selectedMessageIds.length} tin nhắn:</span>
          </div>
          <div className="flex items-center space-x-1 shrink-0 ml-auto">
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMessageIds([]);
                setQuotedMessage(null);
              }}
              className="px-2 py-0.5 rounded text-[9px] bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold transition-all cursor-pointer font-sans"
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
              className="px-2 py-0.5 rounded text-[9px] bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold transition-all cursor-pointer font-sans"
              title="Xóa các tin nhắn đã chọn"
            >
              Xóa ({selectedMessageIds.length})
            </button>
          </div>
        </div>
      )}

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


        <div className="flex-1 relative flex items-end">
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
            className={`w-full border rounded-xl pl-3 pr-14 py-1.5 h-[36px] ${
              chatFontSize === 'xs' ? 'text-xs' : chatFontSize === 'sm' ? 'text-sm' : chatFontSize === 'base' ? 'text-base' : 'text-lg'
            } focus:outline-none focus:ring-2 placeholder:text-slate-400 disabled:opacity-60 resize-none min-h-[36px] max-h-[120px] leading-relaxed scrollbar-none ${
              isJiraTheme 
                ? 'bg-[#deebff]/75 border-[#b3d4ff]/60 text-slate-900 focus:border-jira-blue/40 focus:ring-jira-blue/5' 
                : 'bg-dantri-green-light/80 border-dantri-green/15 text-slate-850 focus:border-dantri-green/40 focus:ring-dantri-green/5'
            }`}
          />

          {/* Self-destruct button inside the textarea box */}
          <div className="absolute right-2 bottom-1 shrink-0 flex items-center z-20">
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => setIsRealDestructOpen(!isRealDestructOpen)}
                className={`p-1 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  realSelfDestruct !== null 
                    ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 px-1.5 py-0.5' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Thời gian tự hủy"
              >
                {realSelfDestruct === null ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 font-sans">
                    {formatDestructLabelShort(realSelfDestruct)}
                  </span>
                )}
              </button>

              {isRealDestructOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsRealDestructOpen(false)} />
                  <div className="absolute right-0 bottom-full mb-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-40 flex flex-col space-y-0.5 min-w-[130px] max-h-[220px] overflow-y-auto animate-scale-in text-left font-sans scrollbar-none">
                    {[null, 1, 2, 3, 4, 5, 10, 15, 30, 60, 3600, 86400, 604800].map((val) => (
                      <button
                        key={val ?? 'off'}
                        type="button"
                        onClick={() => {
                          setRealSelfDestruct(val);
                          setIsRealDestructOpen(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[9px] text-left transition-colors w-full cursor-pointer flex items-center justify-between ${
                          realSelfDestruct === val 
                            ? 'bg-amber-50 text-amber-850 font-bold border border-amber-200/50' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{val === null ? 'Tắt tự hủy' : formatDestructLabel(val)}</span>
                        {realSelfDestruct === val && <span className="text-[7px] text-amber-600">●</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

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
    </div>
  );
}
