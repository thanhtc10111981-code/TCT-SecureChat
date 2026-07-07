import React from 'react';
import { RefreshCw, Unlock } from 'lucide-react';

interface EditorialLoginScreenProps {
  loginUsername: string;
  setLoginUsername: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  loginError: string | null;
  isLoggingIn: boolean;
  onLogin: (e?: any) => void;
}

export default function EditorialLoginScreen({
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  loginError,
  isLoggingIn,
  onLogin
}: EditorialLoginScreenProps) {
  const passwordInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (loginUsername && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f5f6] text-slate-900 flex flex-col items-center justify-center font-sans antialiased p-4">
      {/* Render a beautiful clean newspaper editorial login screen */}
      <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-3xl shadow-xl relative overflow-hidden text-left">
        <div className="text-center mb-6 relative z-10">
          <div className="font-serif font-black text-5xl text-dantri-green flex items-baseline justify-center tracking-tight select-none mb-1">
            Dân trí
            <span className="text-dantri-red text-5xl leading-none ml-0.5 animate-pulse">.</span>
          </div>
          <div className="text-[9px] text-slate-400 font-sans tracking-widest font-bold border-b border-slate-100 pb-3.5">
            CỔNG THÔNG TIN TOÀ SOẠN & ĐÓNG GÓP Ý KIẾN
          </div>
          <h2 className="text-sm font-bold text-slate-800 mt-5 uppercase tracking-wide font-sans">Đăng Nhập Tài Khoản Tác Giả</h2>
          <p className="text-xs text-slate-500 mt-1">Sử dụng tài khoản cộng tác viên để truy cập và soạn chuyên đề.</p>
        </div>

        {loginError && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs mb-4">
            {loginError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1.5 font-sans">Tên tài khoản</label>
            <input
              type="text"
              autoComplete="off"
              data-lpignore="true"
              autoFocus={!loginUsername}
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  passwordInputRef.current?.focus();
                }
              }}
              placeholder="Nhập tên tài khoản truy cập"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-dantri-green focus:ring-2 focus:ring-dantri-green/10"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1.5 font-sans">Mật khẩu thành viên</label>
            <input
              ref={passwordInputRef}
              type="text"
              autoComplete="off"
              data-lpignore="true"
              style={{ WebkitTextSecurity: 'disc' } as any}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onLogin(e);
                }
              }}
              placeholder="Nhập mật khẩu truy cập"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-dantri-green focus:ring-2 focus:ring-dantri-green/10"
            />
          </div>

          <button
            type="button"
            onClick={() => onLogin()}
            disabled={isLoggingIn}
            className="w-full bg-dantri-green hover:bg-dantri-green-hover text-white font-bold py-3 px-4 rounded-xl text-xs tracking-wider uppercase font-sans transition-all flex items-center justify-center space-x-2 shadow-sm focus:outline-none"
          >
            {isLoggingIn ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>KẾT NỐI TOÀ SOẠN</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
