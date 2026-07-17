import React from 'react';
import { ArrowLeft, UserMinus, Shield, Type, Unlock, Eye } from 'lucide-react';
import { UserSession } from '../types';
import { LastSeenStatus } from './LastSeenStatus';

interface ChatHeaderProps {
  activeRecipient: UserSession;
  liveRecipient: UserSession;
  isUserAdmin: boolean;
  isJiraTheme: boolean;
  setActiveRecipient: (val: UserSession | null) => void;
  setAttachedImageBase64: (val: string | null) => void;
  isConfirmingUnlink: boolean;
  setIsConfirmingUnlink: (val: boolean) => void;
  handleUnlinkPartner: () => void;
  showSecurityHub: boolean;
  setShowSecurityHub: (val: boolean) => void;
  chatFontSize: 'xs' | 'sm' | 'base' | 'lg';
  setChatFontSize: (val: 'xs' | 'sm' | 'base' | 'lg') => void;
  handleLockReal: () => void;
  addLog: (text: string, type: 'info' | 'success' | 'warn' | 'crypto') => void;
  disguiseOpacity: number;
  setDisguiseOpacity: (val: number) => void;
}

export default function ChatHeader({
  activeRecipient,
  liveRecipient,
  isUserAdmin,
  isJiraTheme,
  setActiveRecipient,
  setAttachedImageBase64,
  isConfirmingUnlink,
  setIsConfirmingUnlink,
  handleUnlinkPartner,
  showSecurityHub,
  setShowSecurityHub,
  chatFontSize,
  setChatFontSize,
  handleLockReal,
  addLog,
  disguiseOpacity,
  setDisguiseOpacity,
}: ChatHeaderProps) {
  const [showFontDropdown, setShowFontDropdown] = React.useState(false);
  const [showOpacityDropdown, setShowOpacityDropdown] = React.useState(false);

  return (
    <div className="bg-slate-50 border-b border-slate-200 px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 flex items-center justify-between shrink-0 text-left">
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
              ? isJiraTheme 
                ? 'bg-[#deebff] border-[#b3d4ff] text-[#0747a6] shadow-xs font-bold'
                : 'bg-dantri-green-light border-dantri-green/20 text-dantri-green shadow-xs font-bold'
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
                      chatFontSize === item.key 
                        ? isJiraTheme 
                          ? 'text-jira-blue font-bold bg-[#deebff]/50' 
                          : 'text-dantri-green font-bold bg-dantri-green-light/30' 
                        : 'text-slate-600'
                    }`}
                  >
                    <span className={item.class}>{item.label}</span>
                    {chatFontSize === item.key && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isJiraTheme ? 'bg-jira-blue' : 'bg-dantri-green'}`} />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Disguise Background Opacity slider */}
        {!isJiraTheme && (
          <div className="relative flex items-center">
            <button
              onClick={() => setShowOpacityDropdown(!showOpacityDropdown)}
              className={`p-1.5 h-[30px] w-[30px] flex items-center justify-center rounded-lg border transition-all ${
                showOpacityDropdown
                  ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
              title={`Độ mờ bài viết ngụy trang (Hiện tại: ${Math.round(disguiseOpacity * 100)}%)`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {showOpacityDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowOpacityDropdown(false)} 
                />
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-20 animate-fade-in text-left">
                  <div className="border-b border-slate-100 pb-1.5 mb-2 select-none flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Độ mờ bài viết</span>
                    <span className="text-[10px] font-bold text-dantri-green">{Math.round(disguiseOpacity * 100)}%</span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={Math.round(disguiseOpacity * 100)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) / 100;
                        setDisguiseOpacity(val);
                        localStorage.setItem('chat_disguise_opacity', val.toString());
                      }}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                    />
                    <div className="flex justify-between text-[8px] text-slate-400 font-bold select-none px-0.5">
                      <span>ẨN (0%)</span>
                      <span>VỪA (50%)</span>
                      <span>RÕ (100%)</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={handleLockReal}
          className={`p-1.5 h-[30px] w-[30px] flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:text-amber-600 hover:bg-slate-50 transition-colors shadow-sm ${isJiraTheme ? 'text-jira-blue' : 'text-dantri-green'}`}
          title="Khóa máy bằng mã PIN"
        >
          <Unlock className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
