import React, { useMemo } from 'react';
import { Newspaper, Trash2, Database } from 'lucide-react';
import { UserSession } from '../types';

interface NewspaperHeaderProps {
  realUser: UserSession | null;
  onOpenDeletePostings: () => void;
  onOpenSqlQuery: () => void;
}

export default function NewspaperHeader({ 
  realUser, 
  onOpenDeletePostings, 
  onOpenSqlQuery 
}: NewspaperHeaderProps) {
  // Format the current local date in Vietnamese format
  const formattedDate = useMemo(() => {
    const now = new Date();
    const daysOfWeek = [
      'Chủ nhật',
      'Thứ hai',
      'Thứ ba',
      'Thứ tư',
      'Thứ năm',
      'Thứ sáu',
      'Thứ bảy'
    ];
    const dayName = daysOfWeek[now.getDay()];
    const dateStr = String(now.getDate()).padStart(2, '0');
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    const yearStr = now.getFullYear();
    return `${dayName}, ngày ${dateStr}/${monthStr}/${yearStr}`;
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm text-left">
      {/* Top ribbon utility bar */}
      <div className="hidden md:block border-b border-slate-100 bg-slate-50 py-1.5 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[11px] text-slate-500">
          <div className="flex items-center space-x-4">
            <span>{formattedDate}</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Hà Nội: 28°C - Nhiều mây, mát mẻ
            </span>
          </div>
          <div className="flex items-center space-x-4 font-medium">
            <a href="#about" className="hover:text-dantri-green">Giới thiệu</a>
            <span>•</span>
            <a href="#contact" className="hover:text-dantri-green">Liên hệ tòa soạn</a>
            <span>•</span>
            <span className="text-dantri-red font-bold font-sans">Hotline: 0916.020.120</span>
          </div>
        </div>
      </div>

      {/* Brand logo & header banner */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 select-none">
            <div className="font-serif font-black text-4xl md:text-[44px] text-dantri-green flex items-baseline tracking-tight">
              Dân trí
              <span className="text-dantri-red text-4xl leading-none ml-0.5 animate-pulse">.</span>
            </div>
            <div className="hidden md:block h-8 w-px bg-slate-200" />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-[10px] text-slate-500 font-sans tracking-wide uppercase font-semibold">
                Báo điện tử của Bộ Lao động - Thương binh và Xã hội
              </span>
              <span className="text-[10px] text-dantri-green font-serif italic font-medium mt-0.5">
                Nhân văn - Tin cậy - Kịp thời
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dantri Green main horizontal categories navigation */}
      <div className="bg-dantri-green text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-6 h-11 text-xs uppercase font-bold tracking-wider whitespace-nowrap">
            <a href="#home" className="hover:text-amber-300">Trang chủ</a>
            <a href="#society" className="hover:text-amber-300">Xã hội</a>
            
            <a href="#tech" className="text-amber-300 font-extrabold border-b-[3px] border-amber-300 h-full flex items-center gap-1.5 px-1">
              <Newspaper className="w-3.5 h-3.5" />
              SỨC MẠNH SỐ (BẢO MẬT)
            </a>
            
            <a href="#contributor" className="hover:text-amber-300 mr-2">Bạn đọc góp ý</a>

            {/* Admin-only functional options inside the main menu */}
            {realUser?.role === 'admin' && (
              <>
                <span className="text-white/30 hidden sm:inline">|</span>
                
                <button
                  onClick={onOpenDeletePostings}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 transition-colors focus:outline-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  XÓA BÀI ĐĂNG
                </button>

                <button
                  onClick={onOpenSqlQuery}
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition-colors focus:outline-none"
                >
                  <Database className="w-3.5 h-3.5" />
                  TRUY VẤN CSDL
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
