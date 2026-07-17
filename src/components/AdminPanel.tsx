import React from 'react';
import {
  ArrowLeft,
  Send,
  Check,
  Edit2,
  UserPlus,
  Plus,
  Users,
  Shield,
  Fingerprint,
  Key,
  Lock,
  Link,
  Unlink,
  Trash2
} from 'lucide-react';
import { UserSession } from '../types';
import PatternSetupComponent from './PatternSetupComponent';
import GDriveGuide from './GDriveGuide';

interface AdminPanelProps {
  setIsAdminPanelOpen: (val: boolean) => void;
  telegramBotToken: string;
  setTelegramBotToken: (val: string) => void;
  handleSaveTelegramBotToken: () => void;
  saveTokenSuccessMsg: string | null;
  saveTokenErrorMsg: string | null;
  isSavingToken: boolean;
  testTelegramChatId: string;
  setTestTelegramChatId: (val: string) => void;
  testLoading: boolean;
  handleTestTelegramConnection: () => void;
  testSuccessMsg: string | null;
  testErrorMsg: string | null;
  editingUser: UserSession | null;
  setEditingUser: (user: UserSession | null) => void;
  adminSuccessMsg: string | null;
  setAdminSuccessMsg: (val: string | null) => void;
  adminErrorMsg: string | null;
  setAdminErrorMsg: (val: string | null) => void;
  editName: string;
  setEditName: (val: string) => void;
  editRole: 'admin' | 'user';
  setEditRole: (val: 'admin' | 'user') => void;
  editPassword: string;
  setEditPassword: (val: string) => void;
  editPinCode: string;
  setEditPinCode: (val: string) => void;
  editAvatar: string;
  setEditAvatar: (val: string) => void;
  editTelegramChatId: string;
  setEditTelegramChatId: (val: string) => void;
  editPatternLock: string;
  setEditPatternLock: (val: string) => void;
  editAllowDelayLock: boolean;
  setEditAllowDelayLock: (val: boolean) => void;
  editTheme: string;
  setEditTheme: (val: string) => void;
  handleAdminUpdateUser: () => void;
  newUsername: string;
  setNewUsername: (val: string) => void;
  newName: string;
  setNewName: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  newRole: 'admin' | 'user';
  setNewRole: (val: 'admin' | 'user') => void;
  newPinCode: string;
  setNewPinCode: (val: string) => void;
  newTelegramChatId: string;
  setNewTelegramChatId: (val: string) => void;
  newAllowDelayLock: boolean;
  setNewAllowDelayLock: (val: boolean) => void;
  newTheme: string;
  setNewTheme: (val: string) => void;
  handleAdminCreateUser: (e?: any) => void;
  allUsersList: UserSession[];
  isAuthBioEnabled: boolean;
  handleToggleAuthBio: () => void;
  isAuthPinEnabled: boolean;
  handleToggleAuthPin: () => void;
  isAuthPwdEnabled: boolean;
  handleToggleAuthPwd: () => void;
  isKeySharingEnabled: boolean;
  handleToggleKeySharing: () => void;
  handleAdminUnlinkPair: (userAId: string, userBId: string) => void;
  handleAdminDeleteUser: (userId: string) => void;
  disguiseArticleTitle: string;
  setDisguiseArticleTitle: (val: string) => void;
  disguiseArticleContent: string;
  setDisguiseArticleContent: (val: string) => void;
  isSavingDisguise: boolean;
  saveDisguiseSuccessMsg: string | null;
  saveDisguiseErrorMsg: string | null;
  handleSaveDisguiseArticle: () => void;
}

export default function AdminPanel({
  setIsAdminPanelOpen,
  telegramBotToken,
  setTelegramBotToken,
  handleSaveTelegramBotToken,
  saveTokenSuccessMsg,
  saveTokenErrorMsg,
  isSavingToken,
  testTelegramChatId,
  setTestTelegramChatId,
  testLoading,
  handleTestTelegramConnection,
  testSuccessMsg,
  testErrorMsg,
  editingUser,
  setEditingUser,
  adminSuccessMsg,
  setAdminSuccessMsg,
  adminErrorMsg,
  setAdminErrorMsg,
  editName,
  setEditName,
  editRole,
  setEditRole,
  editPassword,
  setEditPassword,
  editPinCode,
  setEditPinCode,
  editAvatar,
  setEditAvatar,
  editTelegramChatId,
  setEditTelegramChatId,
  editPatternLock,
  setEditPatternLock,
  editAllowDelayLock,
  setEditAllowDelayLock,
  editTheme,
  setEditTheme,
  handleAdminUpdateUser,
  newUsername,
  setNewUsername,
  newName,
  setNewName,
  newPassword,
  setNewPassword,
  newRole,
  setNewRole,
  newPinCode,
  setNewPinCode,
  newTelegramChatId,
  setNewTelegramChatId,
  newAllowDelayLock,
  setNewAllowDelayLock,
  newTheme,
  setNewTheme,
  handleAdminCreateUser,
  allUsersList,
  isAuthBioEnabled,
  handleToggleAuthBio,
  isAuthPinEnabled,
  handleToggleAuthPin,
  isAuthPwdEnabled,
  handleToggleAuthPwd,
  isKeySharingEnabled,
  handleToggleKeySharing,
  handleAdminUnlinkPair,
  handleAdminDeleteUser,
  disguiseArticleTitle,
  setDisguiseArticleTitle,
  disguiseArticleContent,
  setDisguiseArticleContent,
  isSavingDisguise,
  saveDisguiseSuccessMsg,
  saveDisguiseErrorMsg,
  handleSaveDisguiseArticle
}: AdminPanelProps) {
  const [deletingUserId, setDeletingUserId] = React.useState<string | null>(null);

  // Google Drive Admin configuration states
  const [gdriveClientId, setGdriveClientId] = React.useState('');
  const [gdriveClientSecret, setGdriveClientSecret] = React.useState('');
  const [gdriveFolderId, setGdriveFolderId] = React.useState('');
  const [gdriveEnabled, setGdriveEnabled] = React.useState(false);
  const [isSavingGdrive, setIsSavingGdrive] = React.useState(false);
  const [gdriveSuccessMsg, setGdriveSuccessMsg] = React.useState<string | null>(null);
  const [gdriveErrorMsg, setGdriveErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchGdriveSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setGdriveClientId(data.gdriveClientId || '');
          setGdriveClientSecret(data.gdriveClientSecret || '');
          setGdriveFolderId(data.gdriveFolderId || '');
          setGdriveEnabled(!!data.gdriveEnabled);
        }
      } catch (err) {
        console.error('Lỗi khi fetch cài đặt Google Drive:', err);
      }
    };
    fetchGdriveSettings();
  }, []);

  const handleSaveGdriveSettings = async () => {
    setIsSavingGdrive(true);
    setGdriveSuccessMsg(null);
    setGdriveErrorMsg(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gdriveClientId,
          gdriveClientSecret,
          gdriveFolderId,
          gdriveEnabled
        })
      });
      if (!res.ok) throw new Error('Không thể cập nhật cấu hình Google Drive.');
      setGdriveSuccessMsg('Cấu hình Google Drive đã được lưu thành công.');
    } catch (err: any) {
      setGdriveErrorMsg(err.message || 'Lỗi lưu cấu hình.');
    } finally {
      setIsSavingGdrive(false);
    }
  };

  const handleLinkGdrive = async () => {
    setGdriveSuccessMsg(null);
    setGdriveErrorMsg(null);
    if (!gdriveClientId || !gdriveClientSecret) {
      setGdriveErrorMsg('Vui lòng nhập Client ID và Client Secret trước khi liên kết Google Drive.');
      return;
    }

    try {
      // First save the credentials so the callback endpoint has them
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gdriveClientId,
          gdriveClientSecret,
          gdriveFolderId,
          gdriveEnabled: true
        })
      });

      const redirectUri = `${window.location.origin}/api/admin/gdrive/callback`;
      const res = await fetch('/api/admin/gdrive/auth-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: gdriveClientId, redirectUri })
      });
      if (!res.ok) throw new Error('Không thể lấy URL ủy quyền Google.');
      const data = await res.json();
      
      // Open popup
      const popup = window.open(data.authUrl, 'gdrive_auth', 'width=600,height=600,left=100,top=100');
      
      // Poll popup to detect when it closes
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          // Refresh configuration to see if it succeeded
          fetch('/api/settings')
            .then(r => r.json())
            .then(data => {
              if (data.gdriveRefreshToken) {
                setGdriveEnabled(true);
                setGdriveSuccessMsg('Đã liên kết tài khoản Google Drive và lấy được Refresh Token thành công!');
              }
            });
        }
      }, 1000);
    } catch (err: any) {
      setGdriveErrorMsg(err.message || 'Lỗi liên kết Google Drive.');
    }
  };

  // Calculate active connections (pairs)
  const activePairings = React.useMemo(() => {
    const pairings: { userA: UserSession; userB: UserSession }[] = [];
    const processedPairs = new Set<string>();

    allUsersList.forEach((user) => {
      const friends = user.friends || [];
      friends.forEach((friendId) => {
        const friendUser = allUsersList.find((u) => u.id === friendId);
        if (friendUser) {
          const [idA, idB] = [user.id, friendUser.id].sort();
          const pairKey = `${idA}-${idB}`;
          if (!processedPairs.has(pairKey)) {
            processedPairs.add(pairKey);
            pairings.push({
              userA: user.id === idA ? user : friendUser,
              userB: user.id === idB ? user : friendUser,
            });
          }
        }
      });
    });

    return pairings;
  }, [allUsersList]);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 p-5 overflow-y-auto text-left">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
        <button onClick={() => setIsAdminPanelOpen(false)} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại</span>
        </button>
        <span className="text-[10px] font-bold font-mono text-[#005699] uppercase">BẢNG QUẢN TRỊ CỘNG TÁC VIÊN</span>
      </div>

      {/* --- TELEGRAM CONFIGURATION AREA --- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 text-left space-y-3 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase font-mono tracking-wider">
          <Send className="w-3.5 h-3.5 text-[#005699]" />
          <span>CẤU HÌNH TELEGRAM BOT THÔNG BÁO</span>
        </h3>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Cung cấp Token của Bot Telegram để hệ thống gửi thông báo tự động cho thành viên khi họ offline trên web.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            autoComplete="off"
            value={telegramBotToken}
            onChange={(e) => setTelegramBotToken(e.target.value)}
            placeholder="Nhập Telegram Bot Token..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#005699] font-mono"
          />
          <button
            type="button"
            disabled={isSavingToken}
            onClick={handleSaveTelegramBotToken}
            className="px-4 py-1.5 bg-[#005699] hover:bg-[#004882] text-white font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1 shrink-0 disabled:opacity-50"
          >
            {isSavingToken ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{isSavingToken ? 'Đang lưu...' : 'Lưu Token'}</span>
          </button>
        </div>

        {saveTokenSuccessMsg && (
          <p className="text-[10px] text-green-600 bg-green-50 border border-green-200/50 p-2 rounded-lg font-medium leading-relaxed mt-1">
            ✅ {saveTokenSuccessMsg}
          </p>
        )}
        {saveTokenErrorMsg && (
          <p className="text-[10px] text-red-600 bg-red-50 border border-red-200/50 p-2.5 rounded-lg leading-relaxed mt-1 font-mono">
            ❌ {saveTokenErrorMsg}
          </p>
        )}

        {/* TEST CONNECTION REGION */}
        <div className="pt-3 border-t border-slate-100 mt-2 space-y-2">
          <label className="block text-[9px] uppercase font-mono text-[#005699] font-bold">Kiểm tra kết nối Telegram</label>
          <div className="flex gap-2">
            <input
              type="text"
              autoComplete="off"
              value={testTelegramChatId}
              onChange={(e) => setTestTelegramChatId(e.target.value)}
              placeholder="Nhập Chat ID để nhận tin nhắn thử..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#005699] font-mono"
            />
            <button
              type="button"
              disabled={testLoading}
              onClick={handleTestTelegramConnection}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1 shrink-0 disabled:opacity-50"
            >
              {testLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Send className="w-3.5 h-3.5 text-[#005699]" />
              )}
              <span>Gửi Test</span>
            </button>
          </div>

          {testSuccessMsg && (
            <p className="text-[10px] text-green-600 bg-green-50 border border-green-200/50 p-2 rounded-lg font-medium leading-relaxed mt-1">
              ✅ {testSuccessMsg}
            </p>
          )}
          {testErrorMsg && (
            <div className="text-[10px] text-red-600 bg-red-50 border border-red-200/50 p-2.5 rounded-lg leading-relaxed mt-1 space-y-1">
              <p className="font-bold">❌ Gửi tin thất bại:</p>
              <p className="font-mono text-[9px] break-all">{testErrorMsg}</p>
              <p className="text-[10px] text-slate-600 mt-1.5 bg-white/70 p-1.5 rounded border border-red-100">
                💡 <strong>Mẹo quan trọng:</strong> Để nhận được tin nhắn, người nhận bắt buộc phải mở Telegram, tìm tên Bot của bạn (được tạo qua <em>@BotFather</em>) và bấm nút <strong>Bắt đầu (Start / /start)</strong> trước. Nếu không, Telegram sẽ chặn không cho Bot gửi tin nhắn.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- SECURITY & KEY SHARING CONFIGURATION AREA --- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 text-left space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase font-mono tracking-wider">
          <Shield className="w-3.5 h-3.5 text-[#005699]" />
          <span>CẤU HÌNH BẢO MẬT & CHIA SẺ KHÓA HỆ THỐNG</span>
        </h3>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Quản lý toàn cục các phương thức xác thực đầu cuối bắt buộc và kiểm soát tính năng đồng bộ hóa cặp khóa mật mã giữa các thiết bị của thành viên.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Sinh trắc */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Fingerprint className="w-3.5 h-3.5 text-slate-500" />
                Xác thực Sinh trắc
              </span>
              <p className="text-[9px] text-slate-400">Yêu cầu Touch ID / Face ID trên thiết bị vật lý.</p>
            </div>
            <button
              onClick={handleToggleAuthBio}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isAuthBioEnabled ? 'bg-[#005699]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isAuthBioEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Mã PIN */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Xác thực Mã PIN
              </span>
              <p className="text-[9px] text-slate-400">Cho phép xác minh nhanh qua mã số PIN.</p>
            </div>
            <button
              onClick={handleToggleAuthPin}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isAuthPinEnabled ? 'bg-[#005699]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isAuthPinEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Mật khẩu */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                Xác thực Mật khẩu
              </span>
              <p className="text-[9px] text-slate-400">Dùng mật khẩu tài khoản để mở khóa hộp thư.</p>
            </div>
            <button
              onClick={handleToggleAuthPwd}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isAuthPwdEnabled ? 'bg-[#005699]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isAuthPwdEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Chia sẻ khóa */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Chia sẻ Khóa Bí Mật
              </span>
              <p className="text-[9px] text-slate-400">Đồng bộ an toàn khóa riêng giữa các thiết bị.</p>
            </div>
            <button
              onClick={handleToggleKeySharing}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isKeySharingEnabled ? 'bg-[#005699]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isKeySharingEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* --- DISGUISE ARTICLE CONFIGURATION AREA --- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 text-left space-y-3 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase font-mono tracking-wider">
          <Edit2 className="w-3.5 h-3.5 text-[#005699]" />
          <span>CẤU HÌNH BÀI BÁO NGỤY TRANG (DÂN TRÍ)</span>
        </h3>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Tùy chỉnh tiêu đề và nội dung chi tiết của bài báo làm nền cho khung chat khi chạy chế độ ngụy trang. Khi để trống, hệ thống sẽ hiển thị bài báo mặc định về Mật mã học E2EE.
        </p>

        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Tiêu đề bài báo ngụy trang
            </label>
            <input
              type="text"
              value={disguiseArticleTitle}
              onChange={(e) => setDisguiseArticleTitle(e.target.value)}
              placeholder="Ví dụ: Trí tuệ nhân tạo dự đoán Tây Ban Nha hay Argentina vô địch World Cup 2026..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50 font-sans text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Nội dung chi tiết bài báo (mỗi dòng là một đoạn văn)
            </label>
            <textarea
              value={disguiseArticleContent}
              onChange={(e) => setDisguiseArticleContent(e.target.value)}
              placeholder="Nhập nội dung chi tiết tại đây. Mỗi dòng mới sẽ là một đoạn văn bản trong bài báo ngụy trang."
              rows={5}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50 font-sans leading-relaxed text-slate-800"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex-1 mr-4 text-left">
              {saveDisguiseSuccessMsg && (
                <span className="inline-flex text-[10px] text-green-600 font-semibold items-center gap-1 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100">
                  <Check className="w-3 h-3" />
                  {saveDisguiseSuccessMsg}
                </span>
              )}
              {saveDisguiseErrorMsg && (
                <span className="inline-flex text-[10px] text-red-600 font-semibold bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                  {saveDisguiseErrorMsg}
                </span>
              )}
            </div>

            <button
              onClick={handleSaveDisguiseArticle}
              disabled={isSavingDisguise}
              className="px-4 py-2 bg-[#005699] hover:bg-[#004073] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {isSavingDisguise ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Cập nhật bài viết</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- GOOGLE DRIVE STORAGE CONFIGURATION AREA --- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 text-left space-y-3.5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase font-mono tracking-wider">
          <svg className="w-3.5 h-3.5 text-[#008075]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.344 15.115l-4.704-8.15c-.24-.416-.677-.677-1.155-.677h-2.97c-.478 0-.915.26-1.155.677l-4.704 8.15c-.237.412-.237.923 0 1.335l1.485 2.573c.24.416.677.677 1.155.677h9.41c.478 0 .915-.26 1.155-.677l1.485-2.573c.237-.412.237-.923 0-1.335zm-6.19 1.554h-2.31l3.52-6.1h2.31l-3.52 6.1z"/>
          </svg>
          <span>CẤU HÌNH LƯU TRỮ GOOGLE DRIVE (ẨN DANH)</span>
        </h3>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Sử dụng tài khoản Google Drive của Admin làm máy chủ lưu trữ file đính kèm. Khung chat sẽ không hiển thị thông tin gì liên quan đến Google Drive (người dùng hoàn toàn không biết cơ chế và nơi lưu trữ tệp tin).
        </p>

        <GDriveGuide />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[9px] uppercase font-mono text-slate-500 font-bold">Client ID</label>
            <input
              type="text"
              autoComplete="off"
              value={gdriveClientId}
              onChange={(e) => setGdriveClientId(e.target.value)}
              placeholder="Nhập Google OAuth2 Client ID..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#008075] font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[9px] uppercase font-mono text-slate-500 font-bold">Client Secret</label>
            <input
              type="password"
              autoComplete="off"
              value={gdriveClientSecret}
              onChange={(e) => setGdriveClientSecret(e.target.value)}
              placeholder="Nhập Google OAuth2 Client Secret..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#008075] font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[9px] uppercase font-mono text-slate-500 font-bold">Folder ID (Không bắt buộc)</label>
            <input
              type="text"
              autoComplete="off"
              value={gdriveFolderId}
              onChange={(e) => setGdriveFolderId(e.target.value)}
              placeholder="Nhập Google Drive Folder ID (mặc định là Root)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#008075] font-mono"
            />
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <div className="flex items-center gap-2 py-1">
              <input
                id="gdriveEnabledCheckbox"
                type="checkbox"
                checked={gdriveEnabled}
                onChange={(e) => setGdriveEnabled(e.target.checked)}
                className="w-3.5 h-3.5 text-[#008075] border-slate-300 rounded focus:ring-[#008075]"
              />
              <label htmlFor="gdriveEnabledCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                Kích hoạt truyền file qua Google Drive
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={isSavingGdrive}
            onClick={handleSaveGdriveSettings}
            className="px-4 py-1.5 bg-[#008075] hover:bg-[#00665e] text-white font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1 shrink-0 disabled:opacity-50"
          >
            {isSavingGdrive ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Lưu cấu hình</span>
          </button>

          <button
            type="button"
            onClick={handleLinkGdrive}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <svg className="w-3.5 h-3.5 text-[#008075]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.415 0-6.19-2.775-6.19-6.19s2.775-6.19 6.19-6.19c1.485 0 2.859.531 3.93 1.428l3.125-3.125C19.123 2.122 15.937 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.897 0 10.864-4.257 11.66-9.842v-3.353H12.24z"/>
            </svg>
            <span>Liên kết tài khoản Google Drive</span>
          </button>
        </div>

        {gdriveSuccessMsg && (
          <p className="text-[10px] text-green-600 bg-green-50 border border-green-200/50 p-2 rounded-lg font-medium leading-relaxed mt-1">
            ✅ {gdriveSuccessMsg}
          </p>
        )}
        {gdriveErrorMsg && (
          <p className="text-[10px] text-red-600 bg-red-50 border border-red-200/50 p-2.5 rounded-lg leading-relaxed mt-1 font-mono">
            ❌ {gdriveErrorMsg}
          </p>
        )}
      </div>

      {editingUser ? (
        /* --- FORM SỬA THÔNG TIN THÀNH VIÊN --- */
        <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-2xl mb-5 text-left space-y-3.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200/40">
            <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Sửa tài khoản: <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">@{editingUser.username}</span></span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingUser(null);
                setAdminSuccessMsg(null);
                setAdminErrorMsg(null);
              }}
              className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold"
            >
              Hủy bỏ
            </button>
          </div>

          {adminSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-[10px]">
              {adminSuccessMsg}
            </div>
          )}
          {adminErrorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-xl text-[10px]">
              {adminErrorMsg}
            </div>
          )}

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[9px] uppercase font-mono text-amber-800 mb-1">Tên Hiển Thị (Display Name)</label>
              <input
                type="text"
                autoComplete="off"
                data-lpignore="true"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nhập tên hiển thị mới..."
                className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] uppercase font-mono text-amber-800 mb-1">Vai Trò</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full bg-white border border-amber-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                >
                  <option value="user">Người dùng</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] uppercase font-mono text-amber-800 mb-1">Giao diện hiển thị</label>
                <select
                  value={editTheme}
                  onChange={(e) => setEditTheme(e.target.value)}
                  className="w-full bg-white border border-amber-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                >
                  <option value="dantri">Báo Dân trí</option>
                  <option value="jira">Jira Software</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] uppercase font-mono text-amber-800 mb-1">Mật khẩu mới (Bỏ trống = giữ nguyên)</label>
                <input
                  type="text"
                  autoComplete="off"
                  data-lpignore="true"
                  style={{ WebkitTextSecurity: 'disc' } as any}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-mono text-amber-800 mb-1">Mã PIN mới (Bỏ trống = giữ nguyên)</label>
                <input
                  type="text"
                  autoComplete="off"
                  maxLength={4}
                  value={editPinCode}
                  onChange={(e) => setEditPinCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Mã PIN 4 số..."
                  className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] uppercase font-mono text-amber-800 mb-1">Ảnh Đại Diện (Avatar URL)</label>
                <input
                  type="text"
                  autoComplete="off"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="Đường dẫn ảnh..."
                  className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-mono text-amber-800 mb-1">Telegram Chat ID (Cho offline alert)</label>
                <input
                  type="text"
                  autoComplete="off"
                  value={editTelegramChatId}
                  onChange={(e) => setEditTelegramChatId(e.target.value)}
                  placeholder="Chat ID (VD: 987654321)..."
                  className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Cấu hình tự chọn thời gian khóa */}
            <div className="bg-amber-50/50 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
              <div className="text-left">
                <span className="block text-[11px] font-bold text-slate-700">Tự chọn thời gian khóa màn hình</span>
                <span className="block text-[9px] text-slate-500 leading-normal">Cho phép người dùng này tự cấu hình thời gian trì hoãn khóa (sau 5, 30, 60 phút) khi click icon ổ khóa. Nếu tắt, hệ thống sẽ bắt buộc khóa ngay khi mất focus.</span>
              </div>
              <button
                type="button"
                onClick={() => setEditAllowDelayLock(!editAllowDelayLock)}
                className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none shrink-0 ${editAllowDelayLock ? 'bg-amber-600' : 'bg-slate-200'}`}
              >
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: editAllowDelayLock ? 'translateX(22px)' : 'translateX(2px)' }} />
              </button>
            </div>

            {/* Admin pattern setup field */}
            <div className="border-t border-dashed border-amber-200 pt-3">
              <PatternSetupComponent
                patternLock={editPatternLock}
                onChangePattern={(pat) => setEditPatternLock(pat || '')}
                label="Cấu hình Mẫu hình vẽ (Bảo mật cho thành viên)"
                userId={editingUser?.id}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleAdminUpdateUser}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>LƯU THAY ĐỔI</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setAdminSuccessMsg(null);
                  setAdminErrorMsg(null);
                }}
                className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                <span>HỦY</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* --- FORM TẠO TÀI KHOẢN MỚI --- */
        <>
          <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1">
            <UserPlus className="w-4 h-4 text-[#005699]" />
            <span>Tạo Tài Khoản Bạn Bè</span>
          </h3>
          <p className="text-[10px] text-slate-400 mb-4 leading-relaxed font-sans">Admin có thể tự tạo tài khoản/mật khẩu và đưa cho bạn bè cùng truy cập trang web này để chat thật.</p>

          {adminSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-[10px] mb-3">
              {adminSuccessMsg}
            </div>
          )}
          {adminErrorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-xl text-[10px] mb-3">
              {adminErrorMsg}
            </div>
          )}

          <div className="space-y-3.5 text-xs text-left">
            <div>
              <label className="block text-[9px] uppercase font-mono text-slate-500 mb-1">Username (Tên đăng nhập)</label>
              <input
                type="text"
                autoComplete="off"
                data-lpignore="true"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAdminCreateUser(e);
                  }
                }}
                placeholder="Ví dụ: nam, hoa, minh"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase font-mono text-slate-500 mb-1">Tên Hiển Thị (Display Name)</label>
              <input
                type="text"
                autoComplete="off"
                data-lpignore="true"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAdminCreateUser(e);
                  }
                }}
                placeholder="Ví dụ: Anh Nam bảo mật"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase font-mono text-slate-500 mb-1">Mật khẩu</label>
              <input
                type="text"
                autoComplete="off"
                data-lpignore="true"
                style={{ WebkitTextSecurity: 'disc' } as any}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAdminCreateUser(e);
                  }
                }}
                placeholder="Nhập mật khẩu"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] uppercase font-mono text-slate-500 mb-1">Vai Trò</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                >
                  <option value="user">Người dùng</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] uppercase font-mono text-slate-500 mb-1">Giao diện hiển thị</label>
                <select
                  value={newTheme}
                  onChange={(e) => setNewTheme(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                >
                  <option value="dantri">Báo Dân trí</option>
                  <option value="jira">Jira Software</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] uppercase font-mono text-slate-500 mb-1">Mã PIN Mở Khóa (4 số)</label>
                <input
                  type="text"
                  autoComplete="off"
                  maxLength={4}
                  value={newPinCode}
                  onChange={(e) => setNewPinCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Mặc định: 1234"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-mono text-slate-500 mb-1">Telegram Chat ID (Offline alert)</label>
                <input
                  type="text"
                  autoComplete="off"
                  value={newTelegramChatId}
                  onChange={(e) => setNewTelegramChatId(e.target.value)}
                  placeholder="Không bắt buộc..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            {/* Cho phép tự chọn thời gian khóa */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
              <div className="text-left">
                <span className="block text-[11px] font-bold text-slate-700">Tự chọn thời gian khóa</span>
                <span className="block text-[9px] text-slate-400 leading-normal">Cho phép tự cấu hình thời gian trì hoãn khóa (mặc định được bật). Nếu tắt, người dùng sẽ bị khóa ngay khi mất focus.</span>
              </div>
              <button
                type="button"
                onClick={() => setNewAllowDelayLock(!newAllowDelayLock)}
                className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none shrink-0 ${newAllowDelayLock ? 'bg-[#005699]' : 'bg-slate-200'}`}
              >
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: newAllowDelayLock ? 'translateX(22px)' : 'translateX(2px)' }} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleAdminCreateUser()}
              className="w-full py-2.5 bg-[#005699] hover:bg-[#004882] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all shadow-sm font-sans"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>TẠO TÀI KHOẢN MỚI</span>
            </button>
          </div>
        </>
      )}

      {/* --- DANH SÁCH THÀNH VIÊN HIỆN CÓ --- */}
      <div className="mt-6 pt-5 border-t border-slate-200 space-y-3 text-left">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-[#005699]" />
          <span>Danh Sách Thành Viên Hiện Có ({allUsersList.length})</span>
        </h3>
        <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
          Danh sách hiển thị tất cả tài khoản người dùng đang hoạt động trong cơ sở dữ liệu. Nhấn "Sửa" để thay đổi thông tin chi tiết.
        </p>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto divide-y divide-slate-100 shadow-sm">
          {allUsersList.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 font-mono">
              Đang tải danh sách thành viên...
            </div>
          ) : (
            allUsersList.map((u) => (
              <div key={u.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full border border-slate-100 shrink-0 object-cover animate-fade-in" />
                  <div className="text-left">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <span>{u.name}</span>
                      {u.role === 'admin' && (
                        <span className="text-[8px] bg-red-100 text-red-700 font-mono px-1 rounded uppercase scale-90 font-bold">Admin</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">@{u.username}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 font-sans flex items-center gap-1 select-none">
                      <span className={`w-1.5 h-1.5 rounded-full ${u.allowDelayLock ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      <span>{u.allowDelayLock ? 'Tự chọn TG khóa' : 'Khóa ngay (lost focus)'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(u);
                      setEditName(u.name);
                      setEditRole(u.role === 'admin' ? 'admin' : 'user');
                      setEditPinCode('');
                      setEditPassword('');
                      setEditAvatar(u.avatar || '');
                      setEditTelegramChatId(u.telegramChatId || '');
                      setEditPatternLock(u.patternLock || '');
                      setEditAllowDelayLock(!!u.allowDelayLock);
                      setEditTheme(u.theme || 'dantri');
                      setAdminErrorMsg(null);
                      setAdminSuccessMsg(null);
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold text-[#005699] hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg flex items-center gap-1 transition-all"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Sửa</span>
                  </button>

                  {deletingUserId === u.id ? (
                    <div className="flex items-center gap-1 animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => {
                          handleAdminDeleteUser(u.id);
                          setDeletingUserId(null);
                        }}
                        className="px-2 py-1 text-[9px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-sm"
                      >
                        Có, xóa!
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingUserId(null)}
                        className="px-2 py-1 text-[9px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeletingUserId(u.id)}
                      className="px-2.5 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- QUẢN LÝ LIÊN KẾT CẶP ĐÔI SECTION --- */}
      <div className="mt-6 pt-5 border-t border-slate-200 space-y-3 text-left">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase font-mono tracking-wider">
          <Link className="w-4 h-4 text-[#005699]" />
          <span>Danh Sách Cặp Đôi Đang Liên Kết ({activePairings.length})</span>
        </h3>
        <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
          Danh sách hiển thị tất cả các cặp tài khoản đang được liên kết (kết bạn) để trò chuyện bảo mật mã hóa E2EE trong hệ thống. Nhấn "Hủy Liên Kết" để gỡ bỏ quan hệ kết bạn giữa hai tài khoản này.
        </p>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto divide-y divide-slate-100 shadow-sm">
          {activePairings.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 font-mono">
              Hiện chưa có cặp thành viên nào được liên kết với nhau.
            </div>
          ) : (
            activePairings.map((pair, index) => (
              <div key={index} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors gap-3">
                <div className="flex items-center gap-2 max-w-[70%]">
                  {/* User A */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <img src={pair.userA.avatar} alt={pair.userA.name} className="w-6 h-6 rounded-full border border-slate-100 object-cover" />
                    <span className="font-bold text-slate-800 truncate max-w-[80px]">{pair.userA.name}</span>
                  </div>

                  {/* Indicator */}
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[8px] font-mono shrink-0">
                    <span>🤝</span>
                    <span className="hidden sm:inline">LIÊN KẾT</span>
                  </div>

                  {/* User B */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <img src={pair.userB.avatar} alt={pair.userB.name} className="w-6 h-6 rounded-full border border-slate-100 object-cover" />
                    <span className="font-bold text-slate-800 truncate max-w-[80px]">{pair.userB.name}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Bạn có chắc chắn muốn hủy liên kết giữa ${pair.userA.name} và ${pair.userB.name}?`)) {
                      handleAdminUnlinkPair(pair.userA.id, pair.userB.id);
                    }
                  }}
                  className="px-2 py-1 text-[9px] font-bold text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-lg flex items-center gap-1 transition-all shrink-0 font-sans"
                >
                  <Unlink className="w-3 h-3" />
                  <span>Hủy liên kết</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
