import React from 'react';
import {
  Shield,
  X,
  Cpu,
  Bell,
  Terminal
} from 'lucide-react';
import { UserSession } from '../types';

interface SecurityHubSidebarProps {
  showSecurityHub: boolean;
  setShowSecurityHub: (val: boolean) => void;
  realUser: UserSession;
  activeRecipient: UserSession;
  isPushSubscribed: boolean;
  subscribeUserToPush: () => void;
  unsubscribeUserFromPush: () => void;
  prefWebPush: boolean;
  handleTogglePrefWebPush: () => void;
  prefTelegram: boolean;
  handleTogglePrefTelegram: () => void;
  systemLogs: Array<{ id: string; time: string; type: 'info' | 'success' | 'warn' | 'crypto'; text: string }>;
}

export default function SecurityHubSidebar({
  showSecurityHub,
  setShowSecurityHub,
  realUser,
  activeRecipient,
  isPushSubscribed,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  prefWebPush,
  handleTogglePrefWebPush,
  prefTelegram,
  handleTogglePrefTelegram,
  systemLogs
}: SecurityHubSidebarProps) {
  if (!showSecurityHub) return null;

  const isJiraTheme = realUser?.theme === 'jira';

  return (
    <div className="hidden xl:flex w-80 shrink-0 flex-col bg-slate-50/50 border-l border-slate-200 h-full overflow-hidden text-left">
      {/* Header */}
      <div className="bg-slate-100/80 border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className={`flex items-center space-x-2 ${isJiraTheme ? 'text-jira-blue' : 'text-[#005699]'}`}>
          <Shield className={`w-4 h-4 shrink-0 animate-pulse ${isJiraTheme ? 'text-jira-blue' : 'text-[#005699]'}`} />
          <h3 className="text-xs font-extrabold uppercase tracking-wider font-mono text-slate-800">
            GIÁM SÁT BẢO MẬT
          </h3>
        </div>
        <button
          onClick={() => setShowSecurityHub(false)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          title="Đóng bảng giám sát"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {/* Khóa an toàn */}
        <div className="space-y-2 text-left">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center space-x-1.5 border-b border-slate-200 pb-1.5">
            <Cpu className={`w-3.5 h-3.5 ${isJiraTheme ? 'text-jira-blue' : 'text-[#005699]'}`} />
            <span>Bản đồ khóa E2EE</span>
          </h4>
          <div className="space-y-3.5 text-xs font-mono">
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>Khóa của bạn ({realUser.name}):</span>
                <span className="text-emerald-600 font-bold">RSA ACTIVE</span>
              </div>
              <div className="bg-white border border-slate-200 p-2.5 rounded-xl text-[9px] text-slate-600 break-all select-all leading-relaxed max-h-[60px] overflow-y-auto scrollbar-none">
                {realUser.publicKeySpki || 'Chưa cài đặt.'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>Khóa đối tác ({activeRecipient.name}):</span>
                {activeRecipient.publicKeySpki ? (
                  <span className="text-emerald-600 font-bold">RSA ACTIVE</span>
                ) : (
                  <span className="text-red-500 font-bold">WAITING</span>
                )}
              </div>
              <div className="bg-white border border-slate-200 p-2.5 rounded-xl text-[9px] text-slate-600 break-all select-all leading-relaxed max-h-[60px] overflow-y-auto scrollbar-none">
                {activeRecipient.publicKeySpki || 'Chưa cài đặt khóa từ đối tác.'}
              </div>
            </div>
          </div>
        </div>

        {/* Cấu hình Nhận Thông Báo (PWA) */}
        <div className="space-y-2.5 text-left bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm">
          <h4 className={`text-[10px] font-bold uppercase tracking-wider font-mono flex items-center space-x-1.5 border-b border-slate-100 pb-1.5 ${
            isJiraTheme ? 'text-jira-blue' : 'text-[#008075]'
          }`}>
            <Bell className="w-3.5 h-3.5" />
            <span>Cấu hình thông báo PWA</span>
          </h4>

          {/* Web Push Registration Status */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
              <span>Thiết bị hiện tại:</span>
              {isPushSubscribed ? (
                <span className={`font-bold flex items-center gap-0.5 ${isJiraTheme ? 'text-jira-blue' : 'text-[#008075]'}`}>● ĐÃ LIÊN KẾT</span>
              ) : (
                <span className="text-slate-400 font-bold">CHƯA LIÊN KẾT</span>
              )}
            </div>

            {isPushSubscribed ? (
              <button
                type="button"
                onClick={unsubscribeUserFromPush}
                className="w-full py-1.5 text-center text-[10px] font-bold font-mono text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl transition-all"
              >
                Hủy liên kết thông báo đẩy
              </button>
            ) : (
              <button
                type="button"
                onClick={subscribeUserToPush}
                className={`w-full py-1.5 text-center text-[10px] font-bold font-mono text-white border rounded-xl transition-all shadow-sm animate-pulse cursor-pointer ${
                  isJiraTheme 
                    ? 'bg-jira-blue hover:bg-jira-blue-hover border-jira-blue' 
                    : 'bg-[#008075] hover:bg-[#00665d] border-[#008075]'
                }`}
              >
                Nhận thông báo đẩy trên iPhone/PC
              </button>
            )}
          </div>

          {/* Preference Channels Toggles */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-[9px] font-mono text-slate-400 uppercase">Kênh thông báo nhận tin bài:</div>

            {/* Web Push Toggle */}
            <div className="flex items-center justify-between group">
              <span className="text-[10px] text-slate-600 font-mono">Thông báo đẩy (Web Push)</span>
              <button
                type="button"
                onClick={handleTogglePrefWebPush}
                className={`w-8 h-4 rounded-full transition-colors relative focus:outline-none ${
                  prefWebPush 
                    ? isJiraTheme ? 'bg-jira-blue' : 'bg-[#008075]' 
                    : 'bg-slate-200'
                }`}
              >
                <span className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform" style={{ transform: prefWebPush ? 'translateX(18px)' : 'translateX(2px)' }} />
              </button>
            </div>

            {/* Telegram Toggle */}
            <div className="flex items-center justify-between group">
              <span className="text-[10px] text-slate-600 font-mono">Thông báo Telegram</span>
              <button
                type="button"
                onClick={handleTogglePrefTelegram}
                className={`w-8 h-4 rounded-full transition-colors relative focus:outline-none ${
                  prefTelegram 
                    ? isJiraTheme ? 'bg-jira-blue' : 'bg-[#008075]' 
                    : 'bg-slate-200'
                }`}
              >
                <span className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform" style={{ transform: prefTelegram ? 'translateX(18px)' : 'translateX(2px)' }} />
              </button>
            </div>
          </div>

          {/* Info Footer */}
          <p className="text-[8px] text-slate-400 font-mono leading-relaxed mt-1">
            * Mặc định khi offline, hệ thống sẽ đẩy thông báo qua Telegram nếu được cấu hình ID.
          </p>
        </div>

        {/* Nhật ký truyền tin bảo mật */}
        <div className="space-y-2 text-left flex flex-col h-[calc(100%-180px)] min-h-[300px]">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center space-x-1.5 border-b border-slate-200 pb-1.5">
            <Terminal className={`w-3.5 h-3.5 ${isJiraTheme ? 'text-jira-blue' : 'text-[#005699]'}`} />
            <span>Nhật ký thời gian thực</span>
          </h4>
          <div className="flex-1 overflow-y-auto bg-white border border-slate-200 p-3 rounded-2xl space-y-2.5 font-mono text-[9px] text-left scrollbar-thin">
            {systemLogs.map((log) => {
              let badgeColor = 'bg-slate-100 text-slate-500';
              let textColor = 'text-slate-600';
              if (log.type === 'success') {
                badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200/85';
                textColor = 'text-emerald-800';
              } else if (log.type === 'warn') {
                badgeColor = 'bg-amber-50 text-amber-700 border border-amber-200/85';
                textColor = 'text-amber-800';
              } else if (log.type === 'crypto') {
                badgeColor = 'bg-purple-50 text-purple-700 border border-purple-200/85';
                textColor = 'text-purple-800';
              }

              return (
                <div key={log.id} className="space-y-0.5 leading-relaxed">
                  <div className="flex items-center space-x-1 select-none">
                    <span className="text-[8px] text-slate-400">{log.time}</span>
                    <span className={`text-[7px] font-bold px-1 rounded uppercase ${badgeColor}`}>
                      {log.type === 'crypto' ? 'CIPHER' : log.type}
                    </span>
                  </div>
                  <p className={`${textColor} pl-0.5`}>{log.text}</p>
                </div>
              );
            })}
            {systemLogs.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-400 text-center select-none py-10">
                <p>Không có nhật ký bảo mật...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
