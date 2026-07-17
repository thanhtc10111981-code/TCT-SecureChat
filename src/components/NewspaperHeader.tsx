import React, { useMemo } from 'react';
import { 
  Newspaper, 
  Trash2, 
  Database, 
  Layers, 
  ChevronDown, 
  Search, 
  Bell, 
  HelpCircle, 
  LogOut,
  Shield
} from 'lucide-react';
import { UserSession } from '../types';

interface NewspaperHeaderProps {
  realUser: UserSession | null;
  onOpenDeletePostings: () => void;
  onOpenSqlQuery: () => void;
  onLogout?: () => void;
  showSecurityHub?: boolean;
  setShowSecurityHub?: (val: boolean) => void;
}

export default function NewspaperHeader({ 
  realUser, 
  onOpenDeletePostings, 
  onOpenSqlQuery,
  onLogout,
  showSecurityHub,
  setShowSecurityHub
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

  const isJiraTheme = realUser?.theme === 'jira';

  if (isJiraTheme) {
    // RENDER JIRA SOFTWARE TOP NAVIGATION HEADER
    return (
      <header className="h-12 bg-white border-b border-jira-border flex items-center justify-between px-4 sticky top-0 z-30 select-none text-left">
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <div className="flex items-center space-x-1.5 cursor-pointer">
            <div className="w-6 h-6 rounded bg-jira-blue flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-[14px] text-[#0052cc] tracking-tight">Jira Software</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 text-xs font-semibold text-[#42526e]">
            <button className="flex items-center space-x-0.5 px-3 py-1.5 rounded hover:bg-[#ebecf0] transition-colors focus:outline-none">
              <span>Projects</span>
              <ChevronDown className="w-3 h-3 text-[#5e6c84]" />
            </button>
            <button className="flex items-center space-x-0.5 px-3 py-1.5 rounded hover:bg-[#ebecf0] transition-colors focus:outline-none">
              <span>Filters</span>
              <ChevronDown className="w-3 h-3 text-[#5e6c84]" />
            </button>
            <button className="flex items-center space-x-0.5 px-3 py-1.5 rounded hover:bg-[#ebecf0] transition-colors focus:outline-none">
              <span>Dashboards</span>
              <ChevronDown className="w-3 h-3 text-[#5e6c84]" />
            </button>
            <button className="flex items-center space-x-0.5 px-3 py-1.5 rounded hover:bg-[#ebecf0] transition-colors focus:outline-none">
              <span>People</span>
              <ChevronDown className="w-3 h-3 text-[#5e6c84]" />
            </button>
            <button className="flex items-center space-x-0.5 px-3 py-1.5 rounded hover:bg-[#ebecf0] transition-colors focus:outline-none">
              <span>Apps</span>
              <ChevronDown className="w-3 h-3 text-[#5e6c84]" />
            </button>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          {/* Admin features styled beautifully for Jira theme */}
          {realUser?.role === 'admin' && (
            <div className="flex items-center space-x-2 border-r border-jira-border pr-3">
              <button
                onClick={onOpenDeletePostings}
                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2 py-1.5 rounded transition-all flex items-center gap-1 focus:outline-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Xóa bài đăng</span>
              </button>

              <button
                onClick={onOpenSqlQuery}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1.5 rounded transition-all flex items-center gap-1 focus:outline-none"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Truy vấn SQL</span>
              </button>
            </div>
          )}

          {/* Search Box */}
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 text-[#5e6c84] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search Jira" 
              disabled
              className="bg-[#fafbfc] border border-jira-border rounded-md pl-8 pr-3 py-1 text-xs focus:outline-none w-36 focus:w-48 transition-all cursor-not-allowed" 
            />
          </div>

          <button className="p-1.5 rounded-full hover:bg-slate-100 text-[#5e6c84] relative focus:outline-none">
            <Bell className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setShowSecurityHub?.(!showSecurityHub)}
            className={`p-1.5 rounded-full transition-all focus:outline-none cursor-pointer ${
              showSecurityHub
                ? 'bg-[#deebff] text-[#0747a6]'
                : 'text-[#5e6c84] hover:bg-slate-100'
            }`}
            title="Giám sát bảo mật & khóa E2EE"
          >
            <Shield className="w-4 h-4" />
          </button>
          
          <button className="p-1.5 rounded-full hover:bg-slate-100 text-[#5e6c84] focus:outline-none">
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* User Profile Info and Logout */}
          <div className="flex items-center gap-2 border-l border-jira-border pl-3">
            <img 
              src={realUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80'} 
              alt={realUser?.name} 
              className="w-7 h-7 rounded-full border border-jira-border shrink-0 object-cover" 
            />
            <div className="hidden md:flex flex-col text-left select-none">
              <span className="text-[11px] font-bold text-jira-slate leading-tight">{realUser?.name}</span>
              <span className="text-[9px] text-[#5e6c84] leading-tight uppercase font-mono">@{realUser?.username}</span>
            </div>
            
            {onLogout && (
              <button
                onClick={onLogout}
                title="Đăng xuất"
                className="p-1.5 rounded-md hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors focus:outline-none"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>
    );
  }

  // RENDER ORIGINAL DÂN TRÍ CAMOUFLAGE HEADER
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
      <div className="bg-slate-50 border-y border-slate-200/80 text-slate-700 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-6 h-11 text-xs uppercase font-bold tracking-wider whitespace-nowrap">
            <a href="#home" className="text-slate-600 hover:text-dantri-green transition-colors">Trang chủ</a>
            <a href="#society" className="text-slate-600 hover:text-dantri-green transition-colors">Xã hội</a>
            
            <a href="#tech" className="text-dantri-green font-extrabold border-b-[3px] border-dantri-green h-full flex items-center gap-1.5 px-1">
              <Newspaper className="w-3.5 h-3.5" />
              SỨC MẠNH SỐ (BẢO MẬT)
            </a>
            
            <a href="#contributor" className="text-slate-600 hover:text-dantri-green transition-colors mr-2">Bạn đọc góp ý</a>
            
            <span className="text-slate-300">|</span>

            <button
              onClick={() => setShowSecurityHub?.(!showSecurityHub)}
              className={`text-xs uppercase font-bold tracking-wider whitespace-nowrap px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors focus:outline-none cursor-pointer ${
                showSecurityHub
                  ? 'bg-dantri-green-light text-dantri-green'
                  : 'text-slate-600 hover:text-dantri-green'
              }`}
              title="Giám sát bảo mật & khóa E2EE"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>GIÁM SÁT BẢO MẬT & KHÓA E2EE</span>
            </button>

            {/* Admin-only functional options inside the main menu */}
            {realUser?.role === 'admin' && (
              <>
                <span className="text-slate-300 hidden sm:inline">|</span>
                
                <button
                  onClick={onOpenDeletePostings}
                  className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 px-2 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-colors focus:outline-none cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  XÓA BÀI ĐĂNG
                </button>

                <button
                  onClick={onOpenSqlQuery}
                  className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-colors focus:outline-none cursor-pointer"
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
