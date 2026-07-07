import React, { useState, useEffect } from 'react';
import { UserSession } from '../types';

export default function useAdminLogic(
  realUser: UserSession | null,
  addLog: (text: string, type: 'info' | 'success' | 'warn' | 'crypto') => void,
  fetchUsers: () => Promise<void>,
  playBeep: (freqOrType?: any, dur?: any) => void,
  isStrictRealMode: boolean,
  setIsStrictRealMode: (val: boolean) => void,
  setRealMessages: React.Dispatch<React.SetStateAction<any[]>>,
  telegramBotToken: string,
  setTelegramBotToken: React.Dispatch<React.SetStateAction<string>>,
  isAuthBioEnabled: boolean,
  setIsAuthBioEnabled: React.Dispatch<React.SetStateAction<boolean>>,
  isAuthPinEnabled: boolean,
  setIsAuthPinEnabled: React.Dispatch<React.SetStateAction<boolean>>,
  isAuthPwdEnabled: boolean,
  setIsAuthPwdEnabled: React.Dispatch<React.SetStateAction<boolean>>
) {
  // Admin Account Creation Panel state
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [newBiometric, setNewBiometric] = useState<'fingerprint' | 'face'>('fingerprint');
  const [newPinCode, setNewPinCode] = useState('');
  const [newAllowDelayLock, setNewAllowDelayLock] = useState(true);
  const [adminSuccessMsg, setAdminSuccessMsg] = useState<string | null>(null);
  const [adminErrorMsg, setAdminErrorMsg] = useState<string | null>(null);

  // Telegram & Web notifications configuration
  const [newTelegramChatId, setNewTelegramChatId] = useState('');
  const [testTelegramChatId, setTestTelegramChatId] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testSuccessMsg, setTestSuccessMsg] = useState<string | null>(null);
  const [testErrorMsg, setTestErrorMsg] = useState<string | null>(null);
  const [saveTokenSuccessMsg, setSaveTokenSuccessMsg] = useState<string | null>(null);
  const [saveTokenErrorMsg, setSaveTokenErrorMsg] = useState<string | null>(null);
  const [isSavingToken, setIsSavingToken] = useState(false);

  // States for Admin viewing & editing all users
  const [allUsersList, setAllUsersList] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editBiometric, setEditBiometric] = useState<'fingerprint' | 'face'>('fingerprint');
  const [editPinCode, setEditPinCode] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editTelegramChatId, setEditTelegramChatId] = useState('');
  const [editPatternLock, setEditPatternLock] = useState('');
  const [editAllowDelayLock, setEditAllowDelayLock] = useState(false);

  const fetchAllUsersForAdmin = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllUsersList(data);
      }
    } catch (e) {
      console.error('Error fetching all users for admin:', e);
    }
  };

  const handleAdminCreateUser = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    setAdminSuccessMsg(null);
    setAdminErrorMsg(null);

    if (!newUsername.trim() || !newPassword || !newName.trim()) {
      setAdminErrorMsg('Vui lòng nhập đầy đủ Username, Tên và Mật khẩu.');
      return;
    }

    try {
      addLog(`[ADMIN] Đang tạo tài khoản mới cho "${newUsername}"...`, 'info');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          name: newName,
          role: newRole,
          biometricType: newBiometric,
          pinCode: newPinCode || '1234',
          telegramChatId: newTelegramChatId,
          allowDelayLock: newAllowDelayLock
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setAdminErrorMsg(data.error || 'Lỗi khi tạo người dùng.');
        addLog(`Tạo tài khoản thất bại: ${data.error}`, 'warn');
        return;
      }

      setAdminSuccessMsg(`Tạo tài khoản "${newName}" thành công! Cung cấp thông tin này cho bạn của bạn.`);
      addLog(`Tạo tài khoản thành viên "${newUsername}" thành công!`, 'success');
      playBeep('unlock');

      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewPinCode('');
      setNewTelegramChatId('');
      setNewAllowDelayLock(true);
      
      fetchUsers();
      fetchAllUsersForAdmin();

    } catch (err) {
      setAdminErrorMsg('Lỗi kết nối máy chủ.');
      addLog(`Tạo tài khoản thất bại: ${(err as Error).message}`, 'warn');
    }
  };

  const handleAdminUpdateUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingUser) return;
    setAdminSuccessMsg(null);
    setAdminErrorMsg(null);

    if (!editName.trim()) {
      setAdminErrorMsg('Tên hiển thị không được để trống.');
      return;
    }

    try {
      addLog(`[ADMIN] Đang cập nhật thông tin tài khoản "${editingUser.username}"...`, 'info');
      const res = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: editName,
          role: editRole,
          biometricType: editBiometric,
          pinCode: editPinCode || undefined,
          password: editPassword || undefined,
          avatar: editAvatar || undefined,
          telegramChatId: editTelegramChatId,
          patternLock: editPatternLock || undefined,
          allowDelayLock: editAllowDelayLock
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setAdminErrorMsg(data.error || 'Lỗi khi cập nhật người dùng.');
        addLog(`Cập nhật tài khoản thất bại: ${data.error}`, 'warn');
        return;
      }

      setAdminSuccessMsg(`Cập nhật tài khoản "${editName}" thành công!`);
      addLog(`Cập nhật thông tin thành viên "${editingUser.username}" thành công!`, 'success');
      playBeep('unlock');

      setEditingUser(null);
      setEditPassword('');
      setEditPinCode('');
      setEditAvatar('');
      setEditTelegramChatId('');
      setEditPatternLock('');
      setEditAllowDelayLock(false);
      fetchAllUsersForAdmin();
      fetchUsers();
    } catch (err) {
      setAdminErrorMsg('Lỗi kết nối máy chủ.');
      addLog(`Cập nhật tài khoản thất bại: ${(err as Error).message}`, 'warn');
    }
  };

  const handleAdminUnlinkPair = async (userAId: string, userBId: string) => {
    if (!realUser) return;
    try {
      addLog(`[ADMIN] Đang yêu cầu hủy liên kết giữa "${userAId}" và "${userBId}"...`, 'info');
      const res = await fetch('/api/users/unlink-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: realUser.id,
          userAId,
          userBId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        addLog(`Hủy liên kết thất bại: ${data.error || 'Lỗi không xác định'}`, 'warn');
        return;
      }

      addLog(`Đã hủy liên kết thành công giữa "${userAId}" và "${userBId}"!`, 'success');
      playBeep('unlock');
      fetchAllUsersForAdmin();
      fetchUsers();
    } catch (err: any) {
      console.error('Error in handleAdminUnlinkPair:', err);
      addLog(`Lỗi khi hủy liên kết: ${err.message}`, 'warn');
    }
  };

  const handleAdminDeleteUser = async (targetUserId: string) => {
    if (!realUser) return;
    try {
      addLog(`[ADMIN] Đang tiến hành xóa tài khoản "${targetUserId}"...`, 'info');
      const res = await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: realUser.id,
          targetUserId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        addLog(`Xóa tài khoản thất bại: ${data.error || 'Lỗi không xác định'}`, 'warn');
        return;
      }

      addLog(`Đã xóa tài khoản "${targetUserId}" thành công!`, 'success');
      playBeep('explode');
      fetchAllUsersForAdmin();
      fetchUsers();
    } catch (err: any) {
      console.error('Error in handleAdminDeleteUser:', err);
      addLog(`Lỗi khi xóa tài khoản: ${err.message}`, 'warn');
    }
  };

  useEffect(() => {
    if (isAdminPanelOpen) {
      fetchAllUsersForAdmin();
    }
  }, [isAdminPanelOpen]);

  const handleAdminClearAllChats = async () => {
    try {
      await fetch('/api/messages/clear', { method: 'POST' });
      setRealMessages([]);
      addLog('Admin đã ra lệnh xóa sạch toàn bộ tin nhắn khỏi Máy Chủ.', 'warn');
      playBeep('explode');
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStrictRealMode = async () => {
    const nextVal = !isStrictRealMode;
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStrictRealMode: nextVal })
      });
      if (res.ok) {
        setIsStrictRealMode(nextVal);
        addLog(`[CẤU HÌNH] Đã chuyển hệ thống sang chế độ ${nextVal ? 'CHẠY THẬT (NGHIÊM NGẶT)' : 'MÔ PHỎNG/GIẢ LẬP'}.`, 'warn');
      }
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  };

  const handleSaveTelegramBotToken = async () => {
    setIsSavingToken(true);
    setSaveTokenSuccessMsg(null);
    setSaveTokenErrorMsg(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramBotToken: telegramBotToken })
      });
      if (res.ok) {
        setSaveTokenSuccessMsg('Lưu cấu hình Bot Token Telegram thành công!');
        addLog('[CẤU HÌNH] Đã đồng bộ Bot Token Telegram quản trị lên Máy Chủ.', 'success');
        setTimeout(() => setSaveTokenSuccessMsg(null), 3500);
      } else {
        const errData = await res.json();
        setSaveTokenErrorMsg(errData.error || 'Có lỗi xảy ra khi lưu Token.');
      }
    } catch (e: any) {
      console.error(e);
      setSaveTokenErrorMsg(e.message || 'Lỗi kết nối mạng.');
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleTestTelegramConnection = async () => {
    setTestLoading(true);
    setTestSuccessMsg(null);
    setTestErrorMsg(null);
    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: telegramBotToken, chatId: testTelegramChatId })
      });
      const data = await res.json();
      if (res.ok) {
        setTestSuccessMsg('Gửi bản tin thử nghiệm thành công! Hãy kiểm tra Bot Telegram của bạn.');
        addLog(`[TELEGRAM] Đã bắn tin nhắn test bảo mật tới Chat ID: ${testTelegramChatId}`, 'success');
      } else {
        setTestErrorMsg(data.error || 'Yêu cầu thất bại.');
      }
    } catch (e) {
      setTestErrorMsg('Lỗi kết nối mạng.');
    } finally {
      setTestLoading(false);
    }
  };

  const handleToggleAuthBio = async () => {
    const nextVal = !isAuthBioEnabled;
    if (!nextVal && !isAuthPinEnabled && !isAuthPwdEnabled) {
      addLog('[CẢNH BÁO] Phải giữ lại ít nhất một phương thức xác thực!', 'warn');
      return;
    }
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAuthBioEnabled: nextVal })
      });
      if (res.ok) {
        setIsAuthBioEnabled(nextVal);
        addLog(`[CẤU HÌNH] Đã ${nextVal ? 'BẬT' : 'TẮT'} phương thức xác thực Sinh trắc học.`, 'success');
      }
    } catch (e) {
      console.error('Error saving settings:', e);
      addLog('[LỖI] Không thể lưu cấu hình sinh trắc học.', 'warn');
    }
  };

  const handleToggleAuthPin = async () => {
    const nextVal = !isAuthPinEnabled;
    if (!nextVal && !isAuthBioEnabled && !isAuthPwdEnabled) {
      addLog('[CẢNH BÁO] Phải giữ lại ít nhất một phương thức xác thực!', 'warn');
      return;
    }
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAuthPinEnabled: nextVal })
      });
      if (res.ok) {
        setIsAuthPinEnabled(nextVal);
        addLog(`[CẤU HÌNH] Đã ${nextVal ? 'BẬT' : 'TẮT'} phương thức xác thực Mã PIN.`, 'success');
      }
    } catch (e) {
      console.error('Error saving settings:', e);
      addLog('[LỖI] Không thể lưu cấu hình Mã PIN.', 'warn');
    }
  };

  const handleToggleAuthPwd = async () => {
    const nextVal = !isAuthPwdEnabled;
    if (!nextVal && !isAuthBioEnabled && !isAuthPinEnabled) {
      addLog('[CẢNH BÁO] Phải giữ lại ít nhất một phương thức xác thực!', 'warn');
      return;
    }
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAuthPwdEnabled: nextVal })
      });
      if (res.ok) {
        setIsAuthPwdEnabled(nextVal);
        addLog(`[CẤU HÌNH] Đã ${nextVal ? 'BẬT' : 'TẮT'} phương thức xác thực Mật khẩu.`, 'success');
      }
    } catch (e) {
      console.error('Error saving settings:', e);
      addLog('[LỖI] Không thể lưu cấu hình Mật khẩu.', 'warn');
    }
  };

  return {
    isAdminPanelOpen,
    setIsAdminPanelOpen,
    newUsername,
    setNewUsername,
    newPassword,
    setNewPassword,
    newName,
    setNewName,
    newRole,
    setNewRole,
    newBiometric,
    setNewBiometric,
    newPinCode,
    setNewPinCode,
    newAllowDelayLock,
    setNewAllowDelayLock,
    adminSuccessMsg,
    setAdminSuccessMsg,
    adminErrorMsg,
    setAdminErrorMsg,
    telegramBotToken,
    setTelegramBotToken,
    newTelegramChatId,
    setNewTelegramChatId,
    testTelegramChatId,
    setTestTelegramChatId,
    testLoading,
    setTestLoading,
    testSuccessMsg,
    setTestSuccessMsg,
    testErrorMsg,
    setTestErrorMsg,
    allUsersList,
    setAllUsersList,
    editingUser,
    setEditingUser,
    editName,
    setEditName,
    editRole,
    setEditRole,
    editBiometric,
    setEditBiometric,
    editPinCode,
    setEditPinCode,
    editPassword,
    setEditPassword,
    editAvatar,
    setEditAvatar,
    editTelegramChatId,
    setEditTelegramChatId,
    editPatternLock,
    setEditPatternLock,
    editAllowDelayLock,
    setEditAllowDelayLock,
    isAuthBioEnabled,
    setIsAuthBioEnabled,
    isAuthPinEnabled,
    setIsAuthPinEnabled,
    isAuthPwdEnabled,
    setIsAuthPwdEnabled,
    handleAdminCreateUser,
    fetchAllUsersForAdmin,
    handleAdminUpdateUser,
    handleAdminClearAllChats,
    handleToggleStrictRealMode,
    handleSaveTelegramBotToken,
    handleTestTelegramConnection,
    saveTokenSuccessMsg,
    saveTokenErrorMsg,
    isSavingToken,
    handleToggleAuthBio,
    handleToggleAuthPin,
    handleToggleAuthPwd,
    handleAdminUnlinkPair,
    handleAdminDeleteUser
  };
}
