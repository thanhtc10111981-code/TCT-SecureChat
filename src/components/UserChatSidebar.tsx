import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Shield, Settings, Unlock, LogOut, MessageSquare, Plus, CheckCircle2, AlertCircle, Bell, User, Download
} from 'lucide-react';
import { UserSession, Message } from '../types';
import { LastSeenStatus } from './LastSeenStatus';

interface UserChatSidebarProps {
  usersList: UserSession[];
  realUser: UserSession;
  realMessages: Message[];
  activeRecipient: UserSession | null;
  setActiveRecipient: (user: UserSession | null) => void;
  setIsAdminPanelOpen: (open: boolean) => void;
  handleLockReal: () => void;
  handleLogoutReal: () => void;
  fetchUsers: () => Promise<void>;
  onOpenNotificationConfig: () => void;
  onOpenProfileEdit: () => void;
  isPWAInstalled?: boolean;
  onOpenPWAInstall?: () => void;
  lockDelay?: number;
  lockAtTimestamp?: number | null;
  updateLockDelayReal?: (delaySecs: number) => void;
}

export default function UserChatSidebar({
  usersList,
  realUser,
  realMessages,
  activeRecipient,
  setActiveRecipient,
  setIsAdminPanelOpen,
  handleLockReal,
  handleLogoutReal,
  fetchUsers,
  onOpenNotificationConfig,
  onOpenProfileEdit,
  isPWAInstalled,
  onOpenPWAInstall,
  lockDelay = 0,
  lockAtTimestamp = null,
  updateLockDelayReal = () => {},
}: UserChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [friendPassword, setFriendPassword] = useState('');
  const [addFriendError, setAddFriendError] = useState<string | null>(null);
  const [addFriendSuccess, setAddFriendSuccess] = useState<string | null>(null);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [isLockDropdownOpen, setIsLockDropdownOpen] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const isUserAdmin = realUser?.username === 'phong' || realUser?.role === 'admin';

  useEffect(() => {
    if (!lockAtTimestamp || lockDelay <= 0) {
      setTimeLeftStr('');
      return;
    }
    const updateTimeLeft = () => {
      const diff = Math.max(0, Math.floor((lockAtTimestamp - Date.now()) / 1000));
      if (diff === 0) {
        setTimeLeftStr('');
        return;
      }
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setTimeLeftStr(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    };
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [lockAtTimestamp, lockDelay]);

  // Filter other users, excluding current user
  const otherUsers = usersList.filter(u => u.id !== realUser.id);
  
  // Search filter
  const filteredUsers = otherUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Custom sort to prioritize: unread count > 0, then newest message exchange timestamp
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const unreadA = realMessages.filter(
      m => m.senderId === a.id && m.recipientId === realUser.id && !m.isRead
    ).length;
    const unreadB = realMessages.filter(
      m => m.senderId === b.id && m.recipientId === realUser.id && !m.isRead
    ).length;

    // Prioritize unread messages
    if (unreadA > 0 && unreadB === 0) return -1;
    if (unreadB > 0 && unreadA === 0) return 1;

    // Sort by latest message exchange timestamp (newest first)
    const msgsA = realMessages
      .filter(
        m => (m.senderId === a.id && m.recipientId === realUser.id) || 
             (m.senderId === realUser.id && m.recipientId === a.id)
      )
      .sort((x, y) => x.timestamp - y.timestamp);
    const lastMsgA = msgsA.length > 0 ? msgsA[msgsA.length - 1] : null;

    const msgsB = realMessages
      .filter(
        m => (m.senderId === b.id && m.recipientId === realUser.id) || 
             (m.senderId === realUser.id && m.recipientId === b.id)
      )
      .sort((x, y) => x.timestamp - y.timestamp);
    const lastMsgB = msgsB.length > 0 ? msgsB[msgsB.length - 1] : null;

    if (lastMsgA && lastMsgB) {
      return lastMsgB.timestamp - lastMsgA.timestamp;
    }
    if (lastMsgA && !lastMsgB) return -1;
    if (!lastMsgA && lastMsgB) return 1;

    return a.name.localeCompare(b.name);
  });

  const handleAddFriend = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    setAddFriendError(null);
    setAddFriendSuccess(null);
    setIsAddingFriend(true);

    try {
      const res = await fetch('/api/users/add-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: realUser.id,
          friendUsername,
          friendPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setAddFriendError(data.error || 'Có lỗi xảy ra.');
        setIsAddingFriend(false);
        return;
      }

      setAddFriendSuccess(data.message);
      setFriendUsername('');
      setFriendPassword('');
      await fetchUsers();
      setTimeout(() => {
        setIsAddFriendOpen(false);
        setAddFriendSuccess(null);
      }, 1500);
    } catch (err) {
      setAddFriendError('Lỗi kết nối máy chủ.');
    } finally {
      setIsAddingFriend(false);
    }
  };

  return (
    <div className="w-full md:w-80 border-r border-slate-200 bg-[#fbfbfb] flex flex-col shrink-0 h-full text-slate-800">
      {/* Header Profile / Controls */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <img 
              src={realUser.avatar} 
              alt={realUser.name} 
              className="w-9 h-9 rounded-full object-cover border border-slate-200" 
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1 font-sans">
              <span>{realUser.name}</span>
              {realUser.role === 'admin' && (
                <span className="text-[7.5px] bg-red-100 border border-red-200 text-red-600 font-bold px-1.5 py-0.5 rounded uppercase">Tòa soạn</span>
              )}
            </h4>
            <span className="text-[9px] text-slate-400 font-sans tracking-wide block">Tác giả biên soạn</span>
          </div>
        </div>

        {/* Control Tools */}
        <div className="flex items-center space-x-1">
          {!isPWAInstalled && onOpenPWAInstall && (
            <button
              onClick={onOpenPWAInstall}
              className="p-1.5 rounded-lg bg-teal-50 border border-teal-200 text-[#008075] hover:bg-teal-100 hover:text-[#006e65] transition-all shadow-sm flex items-center justify-center relative"
              title="Cài đặt Ứng dụng PWA"
            >
              <Download className="w-3.5 h-3.5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#008075]"></span>
              </span>
            </button>
          )}
          <button
            onClick={onOpenProfileEdit}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-dantri-green hover:text-dantri-green-hover hover:border-dantri-green/35 transition-all shadow-sm"
            title="Cài đặt thông tin cá nhân"
          >
            <User className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenNotificationConfig}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-teal-600 hover:text-teal-800 hover:border-teal-500/35 transition-all shadow-sm"
            title="Cấu hình nhận thông báo tin bài"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
          {realUser.role === 'admin' && (
            <button
              onClick={() => setIsAdminPanelOpen(true)}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-dantri-green hover:border-dantri-green/30 transition-all shadow-sm"
              title="Quản trị cộng tác viên"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
          {realUser.allowDelayLock ? (
            <div className="relative">
              <button
                onClick={() => setIsLockDropdownOpen(!isLockDropdownOpen)}
                className={`p-1.5 rounded-lg border transition-all shadow-sm flex items-center gap-1 ${
                  lockDelay > 0 
                    ? 'bg-amber-50 border-amber-300 text-amber-600 hover:bg-amber-100' 
                    : 'bg-white border-slate-200 text-dantri-green hover:text-amber-600 hover:border-amber-500/20'
                }`}
                title={`Cấu hình tự khóa (Hiện tại: ${lockDelay > 0 ? `${lockDelay / 60} phút` : 'Khóa ngay'})`}
              >
                <Unlock className="w-3.5 h-3.5" />
                {timeLeftStr && (
                  <span className="text-[9px] font-mono font-bold leading-none select-none bg-amber-200/60 px-1 py-0.5 rounded text-amber-800">{timeLeftStr}</span>
                )}
              </button>
              
              {isLockDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsLockDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs animate-fade-in text-left">
                    <div className="px-2.5 py-1 text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                      Thời gian tự khóa
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateLockDelayReal(0);
                        handleLockReal();
                        setIsLockDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-bold text-red-600 flex items-center justify-between"
                    >
                      <span>Khóa luôn</span>
                      {lockDelay === 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateLockDelayReal(300);
                        setIsLockDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-between"
                    >
                      <span>Sau 5 phút</span>
                      {lockDelay === 300 && <span className="w-1.5 h-1.5 rounded-full bg-[#008075]" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateLockDelayReal(1800);
                        setIsLockDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-between"
                    >
                      <span>Sau 30 phút</span>
                      {lockDelay === 1800 && <span className="w-1.5 h-1.5 rounded-full bg-[#008075]" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateLockDelayReal(3600);
                        setIsLockDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-between"
                    >
                      <span>Sau 60 phút</span>
                      {lockDelay === 3600 && <span className="w-1.5 h-1.5 rounded-full bg-[#008075]" />}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={handleLockReal}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-dantri-green hover:text-amber-600 hover:border-amber-500/20 transition-all shadow-sm"
              title="Khóa bảo mật trang soạn bài"
            >
              <Unlock className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleLogoutReal}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-500/25 transition-all shadow-sm"
            title="Thoát phiên làm việc"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-slate-200 bg-white">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm chuyên đề, tác giả..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-slate-400 transition-colors placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Contacts List Section */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-none">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[10px] font-bold tracking-wider font-sans text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-dantri-green" />
            <span>CHUYÊN ĐỀ ĐÓNG GÓP ({filteredUsers.length})</span>
          </span>
          <button
            onClick={() => {
              setIsAddFriendOpen(!isAddFriendOpen);
              setAddFriendError(null);
              setAddFriendSuccess(null);
            }}
            className="flex items-center gap-1 text-[9px] bg-slate-100 hover:bg-slate-250 border border-slate-200 hover:border-slate-300 text-dantri-green font-bold px-2 py-1 rounded-xl transition-all select-none"
            title="Liên kết tác giả mới"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>KẾT NỐI</span>
          </button>
        </div>

        {isAddFriendOpen && (
          <div className="p-3 bg-white border border-slate-200 shadow-md rounded-2xl space-y-2.5 mb-3 text-left">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-[9px] font-bold text-dantri-green uppercase">KẾT NỐI TÁC GIẢ</span>
              <button 
                type="button" 
                onClick={() => setIsAddFriendOpen(false)} 
                className="text-slate-400 hover:text-slate-600 text-[10px]"
              >
                Đóng
              </button>
            </div>

            {addFriendError && (
              <div className="text-[9px] bg-red-50 border border-red-200 text-red-600 p-2 rounded-lg leading-relaxed">
                {addFriendError}
              </div>
            )}
            {addFriendSuccess && (
              <div className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-700 p-2 rounded-lg leading-relaxed">
                {addFriendSuccess}
              </div>
            )}

            <div className="space-y-1 text-xs">
              <label className="block text-[8.5px] text-slate-400 uppercase font-sans">Tên tài khoản tác giả (Username)</label>
              <input
                type="text"
                autoComplete="off"
                data-lpignore="true"
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddFriend(e);
                  }
                }}
                placeholder="Nhập tên tài khoản tác giả..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="block text-[8.5px] text-slate-400 uppercase font-sans">Mật khẩu xác minh</label>
              <input
                type="text"
                autoComplete="off"
                data-lpignore="true"
                style={{ WebkitTextSecurity: 'disc' } as any}
                value={friendPassword}
                onChange={(e) => setFriendPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddFriend(e);
                  }
                }}
                placeholder="Nhập mật khẩu xác minh..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={() => handleAddFriend()}
              disabled={isAddingFriend}
              className="w-full py-2 bg-dantri-green hover:bg-dantri-green-hover disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold rounded-xl text-[10px] flex items-center justify-center gap-1 transition-all shadow-sm"
            >
              {isAddingFriend ? 'ĐANG KẾT NỐI...' : 'XÁC NHẬN KẾT NỐI'}
            </button>
          </div>
        )}

        {sortedUsers.map((u) => {
          // Find last message exchange
          const relativeMsgs = [...realMessages]
            .filter(
              m => (m.senderId === u.id && m.recipientId === realUser.id) || 
                   (m.senderId === realUser.id && m.recipientId === u.id)
            )
            .sort((a, b) => a.timestamp - b.timestamp);
          const lastMsg = relativeMsgs[relativeMsgs.length - 1];
          const isSelected = activeRecipient?.id === u.id;
          const unreadCountForUser = realMessages.filter(
            m => m.senderId === u.id && m.recipientId === realUser.id && !m.isRead
          ).length;

          // Helper dynamic titles to camouflage the contacts as news columns
          const getCamouflageTitle = (userId: string, name: string) => {
            if (userId === 'phong') return `Chuyên khảo: Công nghệ xác thực sinh trắc học vật lý tại Việt Nam`;
            if (userId === 'linh') return `Nghiên cứu: Ứng dụng tự hủy mảng nhớ RAM chống mã độc khai thác`;
            return `Chuyên đề đóng góp ý kiến về An toàn số - Biên tập viên ${name}`;
          };

          return (
            <div
              key={u.id}
              onClick={() => setActiveRecipient(u)}
              className={`p-3 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-dantri-green-light/70 border-dantri-green/30 shadow-xs ring-1 ring-dantri-green/15' 
                  : unreadCountForUser > 0
                    ? 'bg-emerald-50/90 border-emerald-300/70 hover:bg-emerald-100/80 shadow-xs animate-[pulse_2s_infinite]'
                    : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-xs'
              }`}
            >
              <div className="relative shrink-0 mt-0.5">
                <img 
                  src={u.avatar} 
                  alt={u.name} 
                  className="w-9 h-9 rounded-full object-cover border border-slate-200" 
                />
                <LastSeenStatus user={u} isAdmin={isUserAdmin} variant="compact" />
              </div>
 
              <div className="text-left flex-1 min-w-0">
                <span className="text-[8px] font-bold text-dantri-red uppercase font-sans tracking-wider block mb-0.5">
                  {u.role === 'admin' ? 'TÒA SOẠN CHÍNH' : 'SỨC MẠNH SỐ'}
                </span>
                <h4 className="font-serif text-xs font-bold text-slate-800 leading-snug line-clamp-2 hover:text-dantri-green transition-colors">
                  {getCamouflageTitle(u.id, u.name)}
                </h4>
                <div className="flex items-center justify-between mt-1.5 text-[9px] text-slate-450 font-sans">
                  <span className="font-medium truncate max-w-[100px] text-slate-500">B.tập: {u.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span>
                      {lastMsg 
                        ? (lastMsg.isDestroyed ? '⚠️ Đã hủy' : (lastMsg.senderId === realUser.id ? 'Đã gửi' : 'Bài mới'))
                        : (u.publicKeySpki ? 'Mật mã' : 'Chờ khóa')}
                    </span>
                    {unreadCountForUser > 0 && (
                      <span className="px-1.5 py-0.5 text-[8px] font-bold bg-dantri-red text-white rounded-full min-w-[14px] h-[14px] flex items-center justify-center animate-pulse font-sans">
                        {unreadCountForUser}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center py-10 px-4 bg-white border border-slate-200 rounded-2xl shadow-inner">
            <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400 leading-relaxed">
              {searchQuery ? 'Không tìm thấy tác giả hoặc chủ đề phù hợp.' : 'Chưa có cộng tác viên nào khác kết nối.'}
            </p>
            {realUser.role === 'admin' && (
              <button
                onClick={() => setIsAdminPanelOpen(true)}
                className="mt-3.5 inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-dantri-green hover:text-dantri-green-hover text-[10px] font-bold font-sans px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm"
              >
                <Plus className="w-3 h-3" /> THÊM TÁC GIẢ MỚI
              </button>
            )}
          </div>
        )}
      </div>

      {!isPWAInstalled && onOpenPWAInstall && (
        <div className="mx-3 mb-2 p-2.5 bg-teal-50/40 border border-teal-100 rounded-xl text-left flex items-start gap-2 animate-fade-in">
          <Download className="w-3.5 h-3.5 text-[#008075] shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1 min-w-0">
            <span className="block text-[10px] font-bold text-slate-850">Trải nghiệm ứng dụng PWA</span>
            <span className="block text-[9px] text-slate-500 leading-normal">Bảo mật tối đa, nhận tin tức tức thời không cần mở trình duyệt.</span>
            <button
              onClick={onOpenPWAInstall}
              className="mt-1 text-[9px] font-bold text-[#008075] hover:text-[#006e65] hover:underline flex items-center gap-0.5 cursor-pointer focus:outline-none"
            >
              Cài đặt ngay &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Database Quick Information Label */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 select-none text-left">
        <span className="text-[9px] text-slate-400 block font-sans uppercase tracking-wider font-semibold">Cơ sở dữ liệu Tòa soạn:</span>
        <div className="flex items-center space-x-1 text-[9px] text-dantri-green font-sans mt-0.5 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Hệ thống đồng bộ Thời gian thực (Live)</span>
        </div>
      </div>
    </div>
  );
}
