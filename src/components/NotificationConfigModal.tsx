import React from 'react';
import {
  Bell,
  X,
  Smartphone,
  Send,
  RefreshCw,
  Check,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface NotificationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefWebPush: boolean;
  setPrefWebPush: (val: boolean) => void;
  prefTelegram: boolean;
  setPrefTelegram: (val: boolean) => void;
  isPushSubscribed: boolean;
  subscribeUserToPush: () => void;
  unsubscribeUserFromPush: () => void;
  userTelegramChatIdInput: string;
  setUserTelegramChatIdInput: (val: string) => void;
  notificationConfigSuccess: string | null;
  notificationConfigError: string | null;
  isSavingNotificationConfig: boolean;
  onSave: () => void;
}

export default function NotificationConfigModal({
  isOpen,
  onClose,
  prefWebPush,
  setPrefWebPush,
  prefTelegram,
  setPrefTelegram,
  isPushSubscribed,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  userTelegramChatIdInput,
  setUserTelegramChatIdInput,
  notificationConfigSuccess,
  notificationConfigError,
  isSavingNotificationConfig,
  onSave
}: NotificationConfigModalProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-fade-in flex flex-col max-h-[90%]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#008075]/10 border border-[#008075]/25 flex items-center justify-center text-[#008075]">
              <Bell className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Kênh Nhận Tin Bài</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">CHANNEL PREFERENCES</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Alert messages */}
          {notificationConfigSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs flex items-center gap-2 font-medium text-left">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{notificationConfigSuccess}</span>
            </div>
          )}

          {notificationConfigError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-2xl text-xs flex items-center gap-2 font-medium text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{notificationConfigError}</span>
            </div>
          )}

          {/* Channel 1: PWA Web Push */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#008075]" />
                <span>Thông báo PWA (Web Push)</span>
              </span>
              <button
                type="button"
                onClick={() => setPrefWebPush(!prefWebPush)}
                className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none ${prefWebPush ? 'bg-[#008075]' : 'bg-slate-200'}`}
              >
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: prefWebPush ? 'translateX(20px)' : 'translateX(2px)' }} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Nhận tin tức "Bài đăng mới" tức thời thông qua thông báo đẩy PWA của trình duyệt trên điện thoại hoặc máy tính.
            </p>

            {/* Device subscription link state */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
              <span className="text-slate-500 font-mono">Trạng thái thiết bị:</span>
              <div className="flex items-center gap-2">
                {isPushSubscribed ? (
                  <>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> ĐÃ LIÊN KẾT
                    </span>
                    <button
                      type="button"
                      onClick={unsubscribeUserFromPush}
                      className="text-[9px] font-bold text-red-600 hover:underline"
                    >
                      Hủy liên kết
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> CHƯA LIÊN KẾT
                    </span>
                    <button
                      type="button"
                      onClick={subscribeUserToPush}
                      className="text-[9px] font-bold text-[#008075] hover:underline"
                    >
                      Liên kết ngay
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Channel 2: Telegram */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Send className="w-4 h-4 text-[#0088cc]" />
                <span>Thông báo Telegram</span>
              </span>
              <button
                type="button"
                onClick={() => setPrefTelegram(!prefTelegram)}
                className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none ${prefTelegram ? 'bg-[#0088cc]' : 'bg-slate-200'}`}
              >
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: prefTelegram ? 'translateX(20px)' : 'translateX(2px)' }} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Nhận tin tức và thông tin truyền tin bảo mật qua kênh Telegram cá nhân khi bạn không online trên hệ thống.
            </p>

            {/* Telegram Chat ID Configuration */}
            <div className="pt-2 border-t border-slate-200/60 space-y-2">
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Telegram Chat ID cá nhân</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ví dụ: 123456789"
                  className="flex-1 text-[11px] bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-[#0088cc]/30"
                  value={userTelegramChatIdInput}
                  onChange={(e) => setUserTelegramChatIdInput(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="p-2.5 bg-[#0088cc]/5 border border-[#0088cc]/10 rounded-xl space-y-1 text-[9px] text-slate-500 leading-relaxed">
                <span className="font-bold text-[#0088cc] uppercase font-mono block">Hướng dẫn lấy Chat ID:</span>
                <p>1. Tìm bot <strong className="text-slate-700 font-mono">@userinfobot</strong> trên Telegram và gửi tin nhắn bất kỳ để lấy ID của bạn.</p>
                <p>2. Khởi chạy bot của hệ thống bằng cách tìm kiếm bot của dự án và nhấn <strong className="text-slate-700 font-mono">/start</strong> để cho phép nhận tin nhắn.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-150 rounded-xl transition-all"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onSave}
            disabled={isSavingNotificationConfig}
            className="px-4 py-2 text-xs font-bold text-white bg-[#008075] hover:bg-[#00665d] rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            {isSavingNotificationConfig ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Lưu cấu hình</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
