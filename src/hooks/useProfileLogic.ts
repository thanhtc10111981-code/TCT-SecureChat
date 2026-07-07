import React, { useState, useEffect } from 'react';
import { UserSession } from '../types';

interface UseProfileLogicProps {
  realUser: UserSession | null;
  setRealUser: React.Dispatch<React.SetStateAction<UserSession | null>>;
  addLog: (text: string, type?: 'info' | 'success' | 'warn' | 'crypto') => void;
  playBeep: (freqOrType?: any, dur?: any) => void;
}

export default function useProfileLogic({
  realUser,
  setRealUser,
  addLog,
  playBeep
}: UseProfileLogicProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [profileName, setProfileName] = useState<string>('');
  const [profilePassword, setProfilePassword] = useState<string>('');
  const [profilePinCode, setProfilePinCode] = useState<string>('');
  const [profilePatternLock, setProfilePatternLock] = useState<string>('');
  const [profilePrefAuthPin, setProfilePrefAuthPin] = useState<boolean>(true);
  const [profilePrefAuthPattern, setProfilePrefAuthPattern] = useState<boolean>(true);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Sync state when realUser updates or modal opens
  useEffect(() => {
    if (realUser && isProfileModalOpen) {
      setProfileName(realUser.name || '');
      setProfilePatternLock(realUser.patternLock || '');
      setProfilePassword('');
      setProfilePinCode('');
      setProfileSuccessMsg(null);
      setProfileErrorMsg(null);

      // Load refocus lock choices from localStorage
      const savedPin = localStorage.getItem(`pref_auth_pin_${realUser.id}`);
      const savedPattern = localStorage.getItem(`pref_auth_pattern_${realUser.id}`);
      setProfilePrefAuthPin(savedPin === null ? true : savedPin === 'true');
      setProfilePrefAuthPattern(savedPattern === null ? true : savedPattern === 'true');
    }
  }, [realUser, isProfileModalOpen]);

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!realUser) return;

    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    if (!profileName.trim()) {
      setProfileErrorMsg('Họ tên không được để trống.');
      return;
    }

    if (!profilePrefAuthPin && !profilePrefAuthPattern) {
      setProfileErrorMsg('Vui lòng chọn ít nhất một hình thức bảo mật để đăng nhập lại sau khi lost focus.');
      return;
    }

    setIsSavingProfile(true);
    try {
      addLog(`[CÀI ĐẶT] Đang cập nhật thông tin cho tài khoản "${realUser.username}"...`, 'info');
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: realUser.id,
          name: profileName,
          password: profilePassword || undefined,
          pinCode: profilePinCode || undefined,
          patternLock: profilePatternLock || undefined
        })
      });

      const userData = await res.json();
      if (!res.ok) {
        setProfileErrorMsg(userData.error || 'Lỗi khi cập nhật thông tin.');
        addLog(`Cập nhật thông tin thất bại: ${userData.error || 'Lỗi chưa rõ'}`, 'warn');
        return;
      }

      // Save refocus lock choices to localStorage
      localStorage.setItem(`pref_auth_pin_${realUser.id}`, String(profilePrefAuthPin));
      localStorage.setItem(`pref_auth_pattern_${realUser.id}`, String(profilePrefAuthPattern));

      // Update state
      setRealUser(prev => prev ? {
        ...prev,
        name: profileName,
        patternLock: userData.user?.patternLock || profilePatternLock,
        hasPinCode: userData.user?.hasPinCode ?? (profilePinCode ? true : prev.hasPinCode)
      } : null);

      setProfileSuccessMsg('Cập nhật thông tin tài khoản thành công!');
      addLog(`Cập nhật tài khoản "${realUser.username}" thành công!`, 'success');
      playBeep('unlock');

      // Clear sensitive fields
      setProfilePassword('');
      setProfilePinCode('');

      // Auto close after success
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setProfileSuccessMsg(null);
      }, 1000);

    } catch (error: any) {
      setProfileErrorMsg('Lỗi kết nối máy chủ.');
      addLog(`Lỗi cập nhật hồ sơ: ${error.message}`, 'warn');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  return {
    isProfileModalOpen,
    setIsProfileModalOpen,
    profileName,
    setProfileName,
    profilePassword,
    setProfilePassword,
    profilePinCode,
    setProfilePinCode,
    profilePatternLock,
    setProfilePatternLock,
    profilePrefAuthPin,
    setProfilePrefAuthPin,
    profilePrefAuthPattern,
    setProfilePrefAuthPattern,
    isSavingProfile,
    profileSuccessMsg,
    setProfileSuccessMsg,
    profileErrorMsg,
    setProfileErrorMsg,
    handleUpdateProfile,
    openProfileModal
  };
}
