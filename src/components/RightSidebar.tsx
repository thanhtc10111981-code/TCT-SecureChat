import React from 'react';
import { Cpu, ShieldCheck, Terminal } from 'lucide-react';
import { UserSession } from '../types';

interface Log {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warn' | 'crypto';
  text: string;
}

interface RightSidebarProps {
  realUser: UserSession | null;
  isStrictRealMode: boolean;
  systemLogs: Log[];
}

export default function RightSidebar({ realUser, isStrictRealMode, systemLogs }: RightSidebarProps) {
  return (
    <section className="lg:col-span-3 flex flex-col space-y-6 text-left">
      {/* Key Management / Crypto Hub */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b-2 border-dantri-green">
          <div className="flex items-center space-x-2 text-dantri-green">
            <span className="w-2 h-4 bg-dantri-green inline-block rounded-xs" />
            <h3 className="text-xs font-extrabold uppercase tracking-wide font-sans">
              QUẢN LÝ KHÓA AN TOÀN
            </h3>
          </div>
          <Cpu className="w-4 h-4 text-dantri-green" />
        </div>

        <div className="space-y-3.5 text-xs font-mono">
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500 font-sans">
                <span>Tác giả hiện tại:</span>
                <span className="text-dantri-green font-bold">{realUser ? realUser.name : 'Chưa đăng nhập'}</span>
              </div>
              {realUser && (
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[10px] text-slate-600 break-all leading-normal max-h-[80px] overflow-y-auto font-mono">
                  <p className="text-dantri-green font-bold mb-1 font-sans">Mã khóa SPKI Public Key:</p>
                  {realUser.publicKeySpki || 'Chưa khởi tạo khóa.'}
                </div>
              )}
            </div>
          </div>

          {!isStrictRealMode && (
            <div className="bg-dantri-green-light border border-dantri-green/10 p-3 rounded-lg space-y-1 text-[10px] text-slate-700 font-sans leading-relaxed">
              <div className="flex items-center space-x-1 text-dantri-green font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Bảo mật E2EE Tòa soạn:</span>
              </div>
              <p className="text-slate-600 text-[10px]">
                Tin nhắn & tài liệu chuyên đề được mã hóa đầu cuối tại trình duyệt. Chỉ có thiết bị của hai thành viên mới nắm giữ khóa giải mã (Private Key).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Security Network Logs */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col flex-1 min-h-[260px] max-h-[480px] shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b-2 border-dantri-green">
          <div className="flex items-center space-x-2 text-dantri-green">
            <span className="w-2 h-4 bg-dantri-green inline-block rounded-xs" />
            <h3 className="text-xs font-extrabold uppercase tracking-wide font-sans">
              TRUYỀN TIN BẢO MẬT
            </h3>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        <div className="flex-1 overflow-y-auto mt-3 space-y-2.5 font-mono text-[10px] text-left pr-1 scrollbar-thin">
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
                <div className="flex items-center space-x-1.5 select-none">
                  <span className="text-[9px] text-slate-400">{log.time}</span>
                  <span className={`text-[8px] font-bold px-1 py-0.2 rounded uppercase ${badgeColor}`}>
                    {log.type === 'crypto' ? 'CIPHER' : log.type}
                  </span>
                </div>
                <p className={`${textColor} pl-0.5`}>{log.text}</p>
              </div>
            );
          })}

          {systemLogs.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-400 text-center select-none py-10">
              <p>Hệ thống bảo mật đang tải...</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
