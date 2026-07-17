import React, { useState, useEffect, useRef } from 'react';
import { Message, UserSession } from '../types';
import useAdminLogic from './useAdminLogic';
import usePwaAndNotifications from './usePwaAndNotifications';
import useProfileLogic from './useProfileLogic';
import useCameraLogic from './useCameraLogic';
import useMessageLogic from './useMessageLogic';
import {
  generateE2EKeyPair,
  exportPublicKey,
  encryptMessage,
  decryptMessage,
  exportPrivateKey,
  importPrivateKey,
  encryptPrivateKeyWithPassword,
  decryptPrivateKeyWithPassword,
  extractPublicKey,
  extractEncryptedPrivateKey,
  shiftObfuscate,
  shiftDeobfuscate
} from '../utils/crypto';
import {
  isKeySharingJson,
  encryptPrivateKeyWithPassword as encryptPrivateKeyWithPasswordShared,
  decryptPrivateKeyWithPassword as decryptPrivateKeyWithPasswordShared
} from '../utils/cryptoSharing';
import { resizeAndCompressImage } from '../utils/image';
import { playBeep } from '../utils/audio';
import { urlBase64ToUint8Array } from '../utils/helpers';
import { getCameraPermissionSync } from '../utils/cameraPermission';

export default function useAppLogic() {
  const appMode = 'real';

  const [systemLogs, setSystemLogs] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'success' | 'warn' | 'crypto' }>>([]);
  
  // Add a log line to system diagnostics panel
  const addLog = (text: string, type: 'info' | 'success' | 'warn' | 'crypto' = 'info') => {
    const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    setSystemLogs((prev) => [
      { id: Math.random().toString(), time, text, type },
      ...prev.slice(0, 49),
    ]);
  };

  // 2. REAL MULTI-USER MODE STATE
  const [realUser, setRealUser] = useState<UserSession | null>(null);
  const [realUserPrivateKey, setRealUserPrivateKey] = useState<CryptoKeyPair['privateKey'] | null>(null);

  // Authentication mode fallback for locks
  const [realDefaultAuthMode, setRealDefaultAuthMode] = useState<'pin' | 'password' | 'pattern'>('pin');
  const [realForcePasswordOnly, setRealForcePasswordOnly] = useState<boolean>(false);

  // PWA and Notifications custom hook
  const {
    deferredPrompt,
    setDeferredPrompt,
    showPWAInstallPrompt,
    setShowPWAInstallPrompt,
    pwaOS,
    isPWAInstalled,
    prefWebPush,
    setPrefWebPush,
    prefTelegram,
    setPrefTelegram,
    isPushSubscribed,
    setIsPushSubscribed,
    vapidPublicKey,
    setVapidPublicKey,
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    userTelegramChatIdInput,
    setUserTelegramChatIdInput,
    notificationConfigSuccess,
    setNotificationConfigSuccess,
    notificationConfigError,
    setNotificationConfigError,
    isSavingNotificationConfig,
    setIsSavingNotificationConfig,
    triggerPWAInstall,
    subscribeUserToPush,
    unsubscribeUserFromPush,
    autoCheckAndResubscribePush,
    handleTogglePrefWebPush,
    handleTogglePrefTelegram,
    handleSaveNotificationConfig,
    clearAllNotifications
  } = usePwaAndNotifications({ realUser, setRealUser, addLog });

  // Profile Edit custom hook
  const {
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
  } = useProfileLogic({ realUser, setRealUser, addLog, playBeep });
  
  // Login input states
  const [loginUsername, setLoginUsername] = useState(() => {
    const saved = localStorage.getItem('dantri_last_logged_in_username');
    return (saved && saved !== 'undefined') ? saved : '';
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Chat lists and states
  const [activeRecipient, setActiveRecipient] = useState<UserSession | null>(null);
  const [usersList, setUsersList] = useState<UserSession[]>([]);
  const realInputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const currentUserPasswordRef = useRef<string>('');

  const focusRealInput = () => {
    setTimeout(() => {
      if (realInputRef.current) {
        realInputRef.current.focus();
      }
    }, 150);
  };

  // Focus chat input when user authenticates or when conversation changes
  useEffect(() => {
    if (realUser?.isAppUnlocked && activeRecipient) {
      focusRealInput();
    }
  }, [realUser?.isAppUnlocked, activeRecipient?.id]);

  const [realInput, setRealInput] = useState('');
  const [realSelfDestruct, setRealSelfDestruct] = useState<number | null>(() => {
    const val = localStorage.getItem('securecrypt_self_destruct_real');
    return val !== null ? (val === 'null' ? null : Number(val)) : 86400;
  });

  // Dropdown states for self destruct options to save screen space
  const [isRealDestructOpen, setIsRealDestructOpen] = useState(false);

  // Attached Google Drive File state
  const [attachedFile, setAttachedFile] = useState<{ fileId: string; fileName: string } | null>(null);

  // Telegram & Web notifications configuration
  const [telegramBotToken, setTelegramBotToken] = useState('');

  // Camera & Remote Camera custom hook
  const {
    cameraTriggerSource,
    setCameraTriggerSource,
    isCameraOpen,
    setIsCameraOpen,
    isCameraOpenRef,
    isCameraAuthorizedReal,
    setIsCameraAuthorizedReal,
    isRealCamDropdownOpen,
    setIsRealCamDropdownOpen,
    cameraFacingMode,
    setCameraFacingMode,
    attachedImageBase64,
    setAttachedImageBase64,
    remoteCameraAction,
    setRemoteCameraAction,
    handleImageFileChange,
    handleCameraCapture,
    captureSilently,
    handleAuthorizeCamera1Time,
    handleSendRemoteCameraRequestReal,
    handleAcceptAndCaptureReal,
    handleDeclineCameraRequestReal,
    handleSendRemoteCameraResponse,
    isCameraRequestingRef
  } = useCameraLogic({
    realUser,
    activeRecipient,
    usersList,
    realSelfDestruct,
    addLog,
    playBeep,
    pollMessagesReal: () => pollMessagesReal(),
    realInput,
    setRealInput,
    handleSendRealMessage: async () => { await handleSendRealMessage(); }
  });

  // Message & Polling custom hook
  const {
    realMessages,
    setRealMessages,
    unreadCount,
    setUnreadCount,
    hasMoreMessages,
    setHasMoreMessages,
    isLoadingOlder,
    setIsLoadingOlder,
    webNotification,
    setWebNotification,
    isFirstPollRef,
    loadOlderMessages,
    pollMessagesReal,
    handleSendRealMessage,
    handleRetryMessage,
    decryptSingleMessage,
    syncDevicePublicKeySpki,
    handleSelfDestruct
  } = useMessageLogic({
    realUser,
    setRealUser,
    realUserPrivateKey,
    activeRecipient,
    usersList,
    fetchUsers,
    fetchUsersStatus,
    realSelfDestruct,
    realInput,
    setRealInput,
    attachedImageBase64,
    setAttachedImageBase64,
    attachedFile,
    setAttachedFile,
    addLog,
    playBeep,
    clearAllNotifications,
    autoCheckAndResubscribePush,
    onSSEUpdate: () => { fetchUnreadCount(); },
  });

  // Sync self destruct selections to localStorage
  useEffect(() => {
    localStorage.setItem('securecrypt_self_destruct_real', String(realSelfDestruct));
  }, [realSelfDestruct]);

  const isChoosingFileRef = useRef(false);

  // Lightbox & Protection states
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxCaption, setLightboxCaption] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isStrictRealMode, setIsStrictRealMode] = useState(false);
  const [showSecurityHub, setShowSecurityHub] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  // Auto-close lightbox if screen gets locked
  useEffect(() => {
    if (realUser && !realUser.isAppUnlocked) {
      setIsLightboxOpen(false);
      setLightboxImage(null);
    }
  }, [realUser?.isAppUnlocked]);

  // Auth methods configurations
  const [isAuthBioEnabled, setIsAuthBioEnabled] = useState<boolean>(true);
  const [isAuthPinEnabled, setIsAuthPinEnabled] = useState<boolean>(true);
  const [isAuthPwdEnabled, setIsAuthPwdEnabled] = useState<boolean>(true);
  const [isKeySharingEnabled, setIsKeySharingEnabled] = useState<boolean>(false);
  const [disguiseArticleTitle, setDisguiseArticleTitle] = useState<string>('');
  const [disguiseArticleContent, setDisguiseArticleContent] = useState<string>('');

  const [inspectorMessage, setInspectorMessage] = useState<Message | null>(null);
  const [inspectorUser, setInspectorUser] = useState<string | null>(null);
  const [pipelineTransit, setPipelineTransit] = useState<{
    id: string;
    senderId: string;
    recipientId: string;
    text: string;
    progress: number;
  } | null>(null);

  // Settings initial fetch
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data) {
          if (typeof data.isStrictRealMode === 'boolean') {
            setIsStrictRealMode(data.isStrictRealMode);
          }
          if (typeof data.telegramBotToken === 'string') {
            setTelegramBotToken(data.telegramBotToken);
          }
          if (typeof data.isAuthBioEnabled === 'boolean') {
            setIsAuthBioEnabled(data.isAuthBioEnabled);
          }
          if (typeof data.isAuthPinEnabled === 'boolean') {
            setIsAuthPinEnabled(data.isAuthPinEnabled);
          }
          if (typeof data.isAuthPwdEnabled === 'boolean') {
            setIsAuthPwdEnabled(data.isAuthPwdEnabled);
          }
          if (typeof data.isKeySharingEnabled === 'boolean') {
            setIsKeySharingEnabled(data.isKeySharingEnabled);
          }
          if (typeof data.disguiseArticleTitle === 'string') {
            setDisguiseArticleTitle(data.disguiseArticleTitle);
          }
          if (typeof data.disguiseArticleContent === 'string') {
            setDisguiseArticleContent(data.disguiseArticleContent);
          }
          if (typeof data.systemShorthands === 'string' && data.systemShorthands) {
            localStorage.setItem('securecrypt_system_shorthands', data.systemShorthands);
          }
        }
      } catch (e) {
        console.error('Error fetching settings:', e);
      }
    };
    fetchSettings();
  }, []);

  // Delay Lock States & Synchronization
  const [lockDelay, setLockDelay] = useState<number>(0);
  const [lockAtTimestamp, setLockAtTimestamp] = useState<number | null>(null);

  useEffect(() => {
    if (realUser) {
      const savedDelayStr = localStorage.getItem(`pref_lock_delay_${realUser.id}`);
      const savedDelay = savedDelayStr ? parseInt(savedDelayStr, 10) : 0;
      setLockDelay(savedDelay);

      const savedLockAtStr = localStorage.getItem(`securecrypt_lock_at_${realUser.id}`);
      const savedLockAt = savedLockAtStr ? parseInt(savedLockAtStr, 10) : null;
      setLockAtTimestamp(savedLockAt);
    } else {
      setLockDelay(0);
      setLockAtTimestamp(null);
    }
  }, [realUser?.id]);

  // Countdown Timer to automatically lock the app when delay lock is active
  useEffect(() => {
    if (!realUser || !realUser.isAppUnlocked || !realUser.allowDelayLock || lockDelay <= 0 || !lockAtTimestamp) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= lockAtTimestamp) {
        // If the application is currently on focus, do not lock, instead reset the countdown
        if (document.visibilityState === 'visible') {
          const expireAt = Date.now() + lockDelay * 1000;
          setLockAtTimestamp(expireAt);
          localStorage.setItem(`securecrypt_lock_at_${realUser.id}`, expireAt.toString());
          addLog(`[BẢO MẬT] Đã hết thời gian đếm ngược tự khóa nhưng phát hiện bạn đang sử dụng ứng dụng (on focus). Tự động gia hạn bộ đếm thêm ${lockDelay / 60} phút.`, 'info');
        } else {
          // Time is up and application is not on focus! Lock immediately.
          let nextDefaultMode: 'pin' | 'pattern' | 'password' = 'pin';
          const savedPin = localStorage.getItem(`pref_auth_pin_${realUser.id}`);
          const savedPattern = localStorage.getItem(`pref_auth_pattern_${realUser.id}`);
          const isPinPref = savedPin === null ? true : savedPin === 'true';
          const isPatternPref = savedPattern === null ? true : savedPattern === 'true';

          if (isPatternPref && realUser.patternLock) {
            nextDefaultMode = 'pattern';
          } else if (isPinPref && realUser.pinCode) {
            nextDefaultMode = 'pin';
          } else {
            nextDefaultMode = 'pin';
          }

          setRealUser((prev) => prev ? { ...prev, isAppUnlocked: false } : null);
          setRealDefaultAuthMode(nextDefaultMode);
          setRealForcePasswordOnly(false);
          setLockAtTimestamp(null);
          localStorage.removeItem(`securecrypt_lock_at_${realUser.id}`);

          addLog(`[BẢO MẬT] Đã hết thời gian trì hoãn khóa (${lockDelay / 60} phút) khi ứng dụng không hoạt động (lost focus). Hệ thống tự động khóa bảo mật để bảo vệ dữ liệu của bạn.`, 'warn');
          playBeep('lock');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [realUser?.id, realUser?.isAppUnlocked, realUser?.allowDelayLock, lockDelay, lockAtTimestamp]);

  // Auto lock when blur/inactive
  useEffect(() => {
    let focusTimeout: any = null;

    const handleInactive = () => {
      if (isChoosingFileRef.current || isCameraOpenRef.current || isCameraRequestingRef.current) {
        return;
      }

      // Skip locking if delay lock is enabled for this user and a delay option is selected (>0)
      if (realUser?.allowDelayLock && lockDelay > 0) {
        addLog(`[BẢO MẬT] Phát hiện mất focus. Đang kích hoạt thời gian trì hoãn tự khóa (${lockDelay / 60} phút).`, 'info');
        return;
      }

      let shouldAddLog = false;
      let nextDefaultMode: 'pin' | 'pattern' | 'password' = 'pin';

      setRealUser((prev) => {
        if (prev && prev.isAppUnlocked) {
          shouldAddLog = true;
          // Determine default auth mode based on user choices in localStorage
          const savedPin = localStorage.getItem(`pref_auth_pin_${prev.id}`);
          const savedPattern = localStorage.getItem(`pref_auth_pattern_${prev.id}`);
          const isPinPref = savedPin === null ? true : savedPin === 'true';
          const isPatternPref = savedPattern === null ? true : savedPattern === 'true';

          if (isPatternPref && prev.patternLock) {
            nextDefaultMode = 'pattern';
          } else if (isPinPref && prev.pinCode) {
            nextDefaultMode = 'pin';
          } else {
            nextDefaultMode = 'pin';
          }

          setRealDefaultAuthMode(nextDefaultMode);
          setRealForcePasswordOnly(false);
          return { ...prev, isAppUnlocked: false };
        }
        return prev;
      });

      if (shouldAddLog) {
        addLog(`Phát hiện màn hình không hoạt động (off-screen). Tự động khóa bảo mật, yêu cầu ${(nextDefaultMode as string) === 'pattern' ? 'vẽ hình' : 'mã PIN'} để tiếp tục.`, 'warn');
        playBeep('lock');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleInactive();
      }
    };

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'file')) {
        isChoosingFileRef.current = true;
      }
    };

    const handleWindowFocus = () => {
      if (focusTimeout) clearTimeout(focusTimeout);
      focusTimeout = setTimeout(() => {
        isChoosingFileRef.current = false;
      }, 800);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleInactive);
    document.addEventListener('click', handleGlobalClick);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleInactive);
      document.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('focus', handleWindowFocus);
      if (focusTimeout) clearTimeout(focusTimeout);
    };
  }, [realUser?.id, realUser?.allowDelayLock, lockDelay]);



  async function fetchUsers(customUserId?: string) {
    try {
      const uId = customUserId || realUser?.id;
      const url = uId ? `/api/users?userId=${uId}&isFocused=${document.visibilityState === 'visible'}&hasCameraPermission=${getCameraPermissionSync()}` : '/api/users';
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsersList(data);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  }

  async function fetchUsersStatus(customUserId?: string) {
    try {
      const uId = customUserId || realUser?.id;
      if (!uId) return;
      const url = `/api/users/status?userId=${uId}&isFocused=${document.visibilityState === 'visible'}&hasCameraPermission=${getCameraPermissionSync()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsersList(prev => {
          const statusMap = new Map(data.map(item => [item.id, item]));
          return prev.map(user => {
            const status = statusMap.get(user.id);
            if (status) {
              return {
                ...user,
                isOnline: status.isOnline,
                isFocused: status.isFocused,
                lastSeen: status.lastSeen,
                hasCameraPermission: status.hasCameraPermission
              };
            }
            return {
              ...user,
              isOnline: false,
              isFocused: false,
              hasCameraPermission: false
            };
          });
        });
      }
    } catch (e) {
      console.error('Error fetching users status:', e);
    }
  }

  const adminLogic = useAdminLogic(
    realUser,
    addLog,
    fetchUsers,
    playBeep,
    isStrictRealMode,
    setIsStrictRealMode,
    setRealMessages,
    telegramBotToken,
    setTelegramBotToken,
    isAuthBioEnabled,
    setIsAuthBioEnabled,
    isAuthPinEnabled,
    setIsAuthPinEnabled,
    isAuthPwdEnabled,
    setIsAuthPwdEnabled,
    isKeySharingEnabled,
    setIsKeySharingEnabled,
    disguiseArticleTitle,
    setDisguiseArticleTitle,
    disguiseArticleContent,
    setDisguiseArticleContent
  );

  const handleLoginReal = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    addLog(`[HỆ THỐNG THẬT] Thử xác thực đăng nhập tài khoản "${loginUsername}"...`, 'info');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Đăng nhập thất bại.');
        addLog(`Đăng nhập thất bại cho "${loginUsername}": ${data.error}`, 'warn');
        setIsLoggingIn(false);
        return;
      }

      addLog(`Tài khoản "${data.name}" đăng nhập thành công. Vai trò: ${data.role.toUpperCase()}`, 'success');
      playBeep('unlock');

      localStorage.setItem('dantri_last_logged_in_username', data.username);

      // Save password securely in RAM for background key synchronization
      currentUserPasswordRef.current = loginPassword;
      sessionStorage.setItem(`temp_auth_key_${data.id}`, shiftObfuscate(loginPassword));

      let privKeyObj: CryptoKeyPair['privateKey'] | null = null;
      const serverPubOnly = extractPublicKey(data.publicKeySpki) || data.publicKeySpki;
      let spkiPub = serverPubOnly;
      let activeServerPubKeySpki = data.publicKeySpki;

      const storedPrivBase64 = localStorage.getItem(`securecrypt_priv_${data.id}`);
      const storedPubSpki = localStorage.getItem(`securecrypt_pub_${data.id}`);

      if (storedPrivBase64 && storedPubSpki) {
        addLog(`[MẬT MÃ] Tìm thấy Khóa riêng tư an toàn trong bộ nhớ cục bộ localStorage của thiết bị.`, 'info');
        privKeyObj = await importPrivateKey(storedPrivBase64);
        spkiPub = storedPubSpki;

        // If isKeySharingEnabled is ON, check if we need to sync our key in sharing format to server
        if (isKeySharingEnabled) {
          const isServerSharedJson = isKeySharingJson(data.publicKeySpki);
          if (!isServerSharedJson) {
            addLog(`[MẬT MÃ] Chế độ Chia Sẻ Khóa đang BẬT nhưng máy chủ chưa có gói chia sẻ. Đang mã hóa và đẩy Khóa riêng tư hiện tại lên máy chủ...`, 'info');
            const encPrivPayload = await encryptPrivateKeyWithPasswordShared(storedPrivBase64, loginPassword);
            const dualKeyJson = JSON.stringify({
              spki: storedPubSpki,
              encryptedPriv: JSON.parse(encPrivPayload)
            });

            await fetch('/api/users/publicKey', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                userId: data.id, 
                publicKeySpki: dualKeyJson
              })
            });
            activeServerPubKeySpki = dualKeyJson;
            addLog(`[MẬT MÃ] Đã đồng bộ và tải khóa chia sẻ đã mã hóa lên máy chủ thành công.`, 'success');
          } else if (serverPubOnly !== storedPubSpki) {
            // Tự động khôi phục và cập nhật khóa cục bộ khi phát hiện lệch khóa
            addLog(`[MẬT MÃ] Phát hiện khóa trên máy chủ khác với khóa cục bộ. Tiến hành khôi phục khóa chia sẻ từ máy chủ...`, 'info');
            const encPrivText = extractEncryptedPrivateKey(data.publicKeySpki);
            let decryptedPrivBase64: string | null = null;
            if (encPrivText) {
              try {
                decryptedPrivBase64 = await decryptPrivateKeyWithPasswordShared(encPrivText, loginPassword);
              } catch (decErr: any) {
                addLog(`[CẢNH BÁO] Không thể giải mã khóa chia sẻ từ máy chủ: ${decErr.message}`, 'warn');
              }
            }

            if (decryptedPrivBase64) {
              // Giải mã thành công: ghi đè Khóa từ máy chủ vào localStorage của chính nó để đồng bộ với thiết bị kia
              localStorage.setItem(`securecrypt_priv_${data.id}`, decryptedPrivBase64);
              localStorage.setItem(`securecrypt_pub_${data.id}`, serverPubOnly);
              privKeyObj = await importPrivateKey(decryptedPrivBase64);
              spkiPub = serverPubOnly;
              addLog(`[MẬT MÃ] Đồng bộ khóa từ máy chủ vào thiết bị thành công! Cả hai thiết bị hiện tại đã dùng chung một cặp khóa.`, 'success');
            } else {
              // Giải mã thất bại (do sai mật khẩu khóa cũ hoặc dữ liệu lỗi): Lúc này mới thực hiện tạo khóa mới.
              addLog(`[MẬT MÃ] Không thể giải mã khóa chia sẻ trên máy chủ (mật khẩu không khớp hoặc dữ liệu lỗi). Tiến hành tạo cặp khóa mới...`, 'warn');
              const keyPair = await generateE2EKeyPair();
              const pubBase64 = await exportPublicKey(keyPair.publicKey);
              const privBase64 = await exportPrivateKey(keyPair.privateKey);

              localStorage.setItem(`securecrypt_priv_${data.id}`, privBase64);
              localStorage.setItem(`securecrypt_pub_${data.id}`, pubBase64);

              addLog(`[MẬT MÃ] Đang mã hóa khóa riêng tư mới để đẩy lên làm gói chia sẻ...`, 'info');
              const encPrivPayload = await encryptPrivateKeyWithPasswordShared(privBase64, loginPassword);
              const uploadValue = JSON.stringify({
                spki: pubBase64,
                encryptedPriv: JSON.parse(encPrivPayload)
              });

              await fetch('/api/users/publicKey', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  userId: data.id, 
                  publicKeySpki: uploadValue
                })
              });
              activeServerPubKeySpki = uploadValue;
              privKeyObj = keyPair.privateKey;
              spkiPub = pubBase64;
              addLog(`[MẬT MÃ] Đã sinh và đồng bộ khóa mới thành công lên máy chủ.`, 'success');
            }
          }
        } else {
          // Key sharing is OFF. Check if the server does not have our raw public key
          if (serverPubOnly !== storedPubSpki) {
            addLog(`[MẬT MÃ] Phát hiện khóa trên máy chủ bị lệch hoặc chưa đăng ký. Đang cập nhật khóa công khai của thiết bị này lên máy chủ...`, 'info');
            await fetch('/api/users/publicKey', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                userId: data.id, 
                publicKeySpki: storedPubSpki
              })
            });
            activeServerPubKeySpki = storedPubSpki;
            addLog(`[MẬT MÃ] Đã cập nhật khóa công khai của thiết bị hiện tại lên máy chủ thành công.`, 'success');
          }
        }
      } else {
        // Device does NOT have E2E keys in local storage (new device or fresh login)
        let resolvedPrivBase64: string | null = null;
        let resolvedPubSpki: string | null = null;
        
        // Key sharing is ON and server contains a shared key package
        if (isKeySharingEnabled && isKeySharingJson(data.publicKeySpki)) {
          addLog(`[MẬT MÃ] Phát hiện gói Khóa riêng tư chia sẻ trên máy chủ. Đang tiến hành khôi phục khóa...`, 'info');
          const encPrivText = extractEncryptedPrivateKey(data.publicKeySpki);
          if (encPrivText) {
            try {
              resolvedPrivBase64 = await decryptPrivateKeyWithPasswordShared(encPrivText, loginPassword);
              resolvedPubSpki = serverPubOnly;
              addLog(`[MẬT MÃ] Khôi phục Khóa riêng tư dùng chung thành công!`, 'success');
            } catch (decErr: any) {
              addLog(`[CẢNH BÁO] Không thể giải mã Khóa riêng tư chia sẻ từ máy chủ (có thể sai mật khẩu khóa cũ): ${decErr.message}.`, 'warn');
            }
          }
        }

        if (resolvedPrivBase64 && resolvedPubSpki) {
          localStorage.setItem(`securecrypt_priv_${data.id}`, resolvedPrivBase64);
          localStorage.setItem(`securecrypt_pub_${data.id}`, resolvedPubSpki);
          privKeyObj = await importPrivateKey(resolvedPrivBase64);
          spkiPub = resolvedPubSpki;
        } else {
          addLog(`[MẬT MÃ] Chưa tìm thấy cặp khóa cục bộ. Tiến hành sinh cặp khóa RSA-2048 mới cho thiết bị này...`, 'warn');
          const keyPair = await generateE2EKeyPair();
          const pubBase64 = await exportPublicKey(keyPair.publicKey);
          const privBase64 = await exportPrivateKey(keyPair.privateKey);

          localStorage.setItem(`securecrypt_priv_${data.id}`, privBase64);
          localStorage.setItem(`securecrypt_pub_${data.id}`, pubBase64);

          let uploadValue = pubBase64;
          if (isKeySharingEnabled) {
            addLog(`[MẬT MÃ] Đang mã hóa khóa riêng tư mới để đẩy lên làm gói chia sẻ...`, 'info');
            const encPrivPayload = await encryptPrivateKeyWithPasswordShared(privBase64, loginPassword);
            uploadValue = JSON.stringify({
              spki: pubBase64,
              encryptedPriv: JSON.parse(encPrivPayload)
            });
          }

          await fetch('/api/users/publicKey', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId: data.id, 
              publicKeySpki: uploadValue
            })
          });
          activeServerPubKeySpki = uploadValue;

          privKeyObj = keyPair.privateKey;
          spkiPub = pubBase64;
          addLog(`[MẬT MÃ] Đã sinh và đăng ký khóa thành công. Khóa riêng tư đã được lưu cục bộ trên thiết bị này${isKeySharingEnabled ? ' và đẩy gói mã hóa chia sẻ lên máy chủ.' : '.'}`, 'success');
        }
      }

      const loggedInUser: UserSession = {
        ...data,
        isAppUnlocked: false,
        publicKeySpki: activeServerPubKeySpki,
        keyPair: privKeyObj ? { publicKey: {} as any, privateKey: privKeyObj } : null
      };

      setRealUser(loggedInUser);
      setRealUserPrivateKey(privKeyObj);
      setIsLoggingIn(false);
      
      setLoginUsername('');
      setLoginPassword('');
      setLoginError(null);
      
      fetchUsers(loggedInUser.id);

    } catch (err) {
      setLoginError('Không kết nối được tới máy chủ.');
      addLog(`Lỗi đăng nhập: ${(err as Error).message}`, 'warn');
      setIsLoggingIn(false);
    }
  };



  // Process incoming silent camera requests
  useEffect(() => {
    if (!realUser || !realMessages.length) return;
    
    const handleSilentRequestReal = async () => {
      const pendingReq = realMessages.find(m => {
        if (m.recipientId !== realUser.id || m.isDestroyed) return false;
        try {
          const parsed = JSON.parse(m.decryptedText || '{}');
          if (parsed.type !== 'camera_request') return false;
          
          const isProcessed = localStorage.getItem(`camera_req_processed_${m.id}`) === 'captured' || 
                              localStorage.getItem(`camera_req_processed_${m.id}`) === 'declined';
          return !isProcessed;
        } catch {
          return false;
        }
      });

      if (!pendingReq) return;

      try {
        const parsed = JSON.parse(pendingReq.decryptedText || '{}');
        const facingMode = parsed.facingMode || 'user';
        
        addLog(`[HỆ THỐNG] Đang tự động xử lý yêu cầu chụp ảnh bảo mật thầm lặng bằng Camera ${facingMode === 'user' ? 'trước' : 'sau'}...`, 'info');
        localStorage.setItem(`camera_req_processed_${pendingReq.id}`, 'captured');
        
        try {
          const base64Data = await captureSilently(facingMode);
          const compressed = await resizeAndCompressImage(base64Data, 800, 800, 0.7);
          
          const senderUser = usersList.find(u => u.id === pendingReq.senderId);
          const senderPubKey = senderUser ? extractPublicKey(senderUser.publicKeySpki) : null;
          if (!senderUser || !senderPubKey) {
            addLog('Không tìm thấy khóa công khai của người yêu cầu để gửi phản hồi.', 'warn');
            return;
          }
          
          const payloadObj = {
            type: 'image',
            image: compressed,
            isStealth: true,
            text: 'Ảnh chụp từ thiết bị đối tác theo yêu cầu bảo mật'
          };
          const payloadStr = JSON.stringify(payloadObj);
          
          // Encrypt for recipient
          const encryptedPayloadForRecipient = await encryptMessage(payloadStr, senderPubKey);

          // Encrypt for sender (myself)
          const myPubKey = extractPublicKey(realUser.publicKeySpki) || localStorage.getItem(`securecrypt_pub_${realUser.id}`);
          let encryptedPayloadForSender = null;
          if (myPubKey) {
            try {
              encryptedPayloadForSender = await encryptMessage(payloadStr, myPubKey);
            } catch (err) {
              console.warn('Failed to encrypt silent camera response for sender backup:', err);
            }
          }

          const encryptedPayload = {
            recipientPayload: encryptedPayloadForRecipient,
            senderPayload: encryptedPayloadForSender,
            isMultiDevice: true
          };
          
          const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              senderId: realUser.id,
              recipientId: pendingReq.senderId,
              encryptedPayload,
              selfDestructDuration: realSelfDestruct
            })
          });
          
          if (res.ok) {
            const dbMsg = await res.json();
            playBeep('send');
            addLog(`[HỆ THỐNG] Đã tự động chụp và gửi phản hồi ảnh bảo mật E2EE thành công tới Quản trị viên Phong.`, 'success');
            
            // Đánh dấu tin nhắn yêu cầu camera thầm lặng đó là đã đọc cục bộ và trên máy chủ
            setRealMessages((prev) =>
              prev.map((msg) =>
                msg.id === pendingReq.id ? { ...msg, isRead: true, readAt: Date.now() } : msg
              )
            );

            await fetch('/api/messages/read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messageId: pendingReq.id })
            }).catch(err => console.error('Lỗi khi đánh dấu tin nhắn yêu cầu thầm lặng đã đọc:', err));
            
            pollMessagesReal();
          }
        } catch (err) {
          console.error(err);
          addLog('Lỗi xử lý chụp ảnh tự động. Vui lòng kiểm tra quyền truy cập Camera của trình duyệt.', 'warn');
        }
      } catch (err) {
        console.error(err);
      }
    };

    handleSilentRequestReal();
  }, [realMessages, isCameraAuthorizedReal, realUser]);



  // Authenticate and lock methods
  const handleAuthenticateReal = () => {
    if (!realUser) return;
    playBeep('unlock');
    setRealUser(prev => prev ? { ...prev, isAppUnlocked: true } : null);
    setRealDefaultAuthMode('pin');
    setRealForcePasswordOnly(false);
    addLog(`Chào mừng quay lại, ${realUser.name}. Thiết bị đã mở khóa thành công!`, 'success');

    // Reset and start delay lock timer if allowed and set
    const savedDelayStr = localStorage.getItem(`pref_lock_delay_${realUser.id}`);
    const savedDelay = savedDelayStr ? parseInt(savedDelayStr, 10) : 0;
    if (realUser.allowDelayLock && savedDelay > 0) {
      const expireAt = Date.now() + savedDelay * 1000;
      setLockAtTimestamp(expireAt);
      localStorage.setItem(`securecrypt_lock_at_${realUser.id}`, expireAt.toString());
      addLog(`[BẢO MẬT] Đã kích hoạt thời gian trì hoãn tự khóa sau ${savedDelay / 60} phút.`, 'info');
    } else {
      setLockAtTimestamp(null);
      localStorage.removeItem(`securecrypt_lock_at_${realUser.id}`);
    }
  };

  const handleLockReal = () => {
    if (!realUser) return;
    playBeep('lock');
    setRealUser(prev => prev ? { ...prev, isAppUnlocked: false } : null);
    setLockAtTimestamp(null);
    if (localStorage) {
      localStorage.removeItem(`securecrypt_lock_at_${realUser.id}`);
    }
    addLog('Bạn đã chủ động khóa thiết bị. Khóa bảo mật tạm cô lập.', 'warn');
  };

  const updateLockDelayReal = (delaySecs: number) => {
    if (!realUser) return;
    setLockDelay(delaySecs);
    localStorage.setItem(`pref_lock_delay_${realUser.id}`, delaySecs.toString());

    if (delaySecs > 0) {
      const expireAt = Date.now() + delaySecs * 1000;
      setLockAtTimestamp(expireAt);
      localStorage.setItem(`securecrypt_lock_at_${realUser.id}`, expireAt.toString());
      addLog(`[BẢO MẬT] Thiết lập trì hoãn khóa sau ${delaySecs / 60} phút. Đã khởi động lại bộ đếm ngược.`, 'success');
    } else {
      setLockAtTimestamp(null);
      localStorage.removeItem(`securecrypt_lock_at_${realUser.id}`);
      addLog(`[BẢO MẬT] Đã tắt chế độ trì hoãn khóa. Hệ thống sẽ tự động khóa ngay khi mất focus.`, 'info');
    }
  };

  const handleResetKeysReal = async () => {
    if (!realUser) return;
    try {
      addLog('Đang reset cặp khóa E2EE của bạn...', 'info');
      await fetch('/api/users/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: realUser.id })
      });
      
      localStorage.removeItem(`securecrypt_priv_${realUser.id}`);
      localStorage.removeItem(`securecrypt_pub_${realUser.id}`);
      
      setRealUser(prev => prev ? { ...prev, isAppUnlocked: false, publicKeySpki: null } : null);
      setRealUserPrivateKey(null);
      setRealMessages([]);
      addLog('Đã xóa sạch khóa cũ và lịch sử tin nhắn của bạn trên máy chủ.', 'warn');
    } catch (e) {
      addLog('Không thể reset khóa trên server.', 'warn');
    }
  };

  const handleLogoutReal = () => {
    isFirstPollRef.current = true;
    setRealUser(null);
    setRealUserPrivateKey(null);
    setActiveRecipient(null);
    setRealMessages([]);
    setAttachedImageBase64(null);
    addLog('Đã đăng xuất an toàn khỏi hệ thống.', 'info');
  };

  // Auto dismiss web notification after 10s
  useEffect(() => {
    if (!webNotification) return;
    const timer = setTimeout(() => {
      setWebNotification(null);
    }, 10000);
    return () => clearTimeout(timer);
  }, [webNotification]);

  const fetchUnreadCount = React.useCallback(async () => {
    if (!realUser) return;
    try {
      const res = await fetch(`/api/messages/unread-count?userId=${realUser.id}`);
      const data = await res.json();
      if (typeof data.count === 'number') {
        setUnreadCount(data.count);
      }
    } catch (e) {
      console.error('Error fetching unread count:', e);
    }
  }, [realUser?.id]);

  // Fetch unread count on key events: chat transition, user changes, and successful screen lock unlock
  useEffect(() => {
    if (!realUser?.id || !realUser?.isAppUnlocked) return;
    fetchUnreadCount();
  }, [activeRecipient?.id, realUser?.id, realUser?.isAppUnlocked, fetchUnreadCount]);

  // Tab activation visibility listener in useAppLogic
  useEffect(() => {
    if (!realUser?.id || !realUser?.isAppUnlocked) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [realUser?.id, realUser?.isAppUnlocked, fetchUnreadCount]);

  // Flash tabbar title and manage PWA app badge based on unread count from server
  useEffect(() => {
    // Badging API for installed apps (Chrome PWA / taskbar badge)
    if (typeof navigator !== 'undefined') {
      if (unreadCount > 0) {
        if ('setAppBadge' in navigator) {
          navigator.setAppBadge(unreadCount).catch((err) => {
            console.warn('Failed to set app badge:', err);
          });
        }
      } else {
        if ('clearAppBadge' in navigator) {
          navigator.clearAppBadge().catch((err) => {
            console.warn('Failed to clear app badge:', err);
          });
        }
      }
    }

    if (webNotification) {
      let showAlt = false;
      const interval = setInterval(() => {
        document.title = showAlt 
          ? `🔴 (${unreadCount || '!'}) TIN NHẮN MỚI!` 
          : `💬 (${unreadCount}) Jira Software`;
        showAlt = !showAlt;
      }, 800);
      return () => {
        clearInterval(interval);
      };
    } else {
      if (unreadCount > 0) {
        document.title = `(${unreadCount}) Jira Software`;
      } else {
        document.title = 'Jira Software';
      }
    }
  }, [unreadCount, webNotification]);

  return {
    appMode,
    cameraTriggerSource,
    setCameraTriggerSource,
    isCameraAuthorizedReal,
    setIsCameraAuthorizedReal,
    realDefaultAuthMode,
    setRealDefaultAuthMode,
    realForcePasswordOnly,
    setRealForcePasswordOnly,
    realUser,
    setRealUser,
    realUserPrivateKey,
    setRealUserPrivateKey,
    prefWebPush,
    setPrefWebPush,
    prefTelegram,
    setPrefTelegram,
    isPushSubscribed,
    setIsPushSubscribed,
    vapidPublicKey,
    setVapidPublicKey,
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    userTelegramChatIdInput,
    setUserTelegramChatIdInput,
    notificationConfigSuccess,
    setNotificationConfigSuccess,
    notificationConfigError,
    setNotificationConfigError,
    isSavingNotificationConfig,
    setIsSavingNotificationConfig,
    loginUsername,
    setLoginUsername,
    loginPassword,
    setLoginPassword,
    loginError,
    setLoginError,
    isLoggingIn,
    setIsLoggingIn,
    activeRecipient,
    setActiveRecipient,
    unreadCount,
    setUnreadCount,
    usersList,
    setUsersList,
    realMessages,
    setRealMessages,
    handleSelfDestruct,
    hasMoreMessages,
    setHasMoreMessages,
    isLoadingOlder,
    setIsLoadingOlder,
    loadOlderMessages,
    realInputRef,
    isFirstPollRef,
    realInput,
    setRealInput,
    realSelfDestruct,
    setRealSelfDestruct,
    isRealDestructOpen,
    setIsRealDestructOpen,
    isCameraOpen,
    setIsCameraOpen,
    isRealCamDropdownOpen,
    setIsRealCamDropdownOpen,
    cameraFacingMode,
    setCameraFacingMode,
    remoteCameraAction,
    setRemoteCameraAction,
    isCameraRequestingRef,
    attachedImageBase64,
    setAttachedImageBase64,
    attachedFile,
    setAttachedFile,
    lightboxImage,
    setLightboxImage,
    lightboxCaption,
    setLightboxCaption,
    isLightboxOpen,
    setIsLightboxOpen,
    isStrictRealMode,
    setIsStrictRealMode,
    showSecurityHub,
    setShowSecurityHub,
    selectedArticle,
    setSelectedArticle,
    systemLogs,
    setSystemLogs,
    inspectorMessage,
    setInspectorMessage,
    inspectorUser,
    setInspectorUser,
    pipelineTransit,
    setPipelineTransit,
    playBeep,
    addLog,
    subscribeUserToPush,
    unsubscribeUserFromPush,
    handleTogglePrefWebPush,
    handleTogglePrefTelegram,
    handleSaveNotificationConfig,
    showPWAInstallPrompt,
    setShowPWAInstallPrompt,
    pwaOS,
    isPWAInstalled,
    triggerPWAInstall,
    fetchUsers,
    fetchUsersStatus,
    handleLoginReal,
    pollMessagesReal,
    handleSendRealMessage,
    handleRetryMessage,
    handleImageFileChange,
    handleCameraCapture,
    captureSilently,
    handleAuthorizeCamera1Time,
    handleSendRemoteCameraRequestReal,
    handleAcceptAndCaptureReal,
    handleDeclineCameraRequestReal,
    handleSendRemoteCameraResponse,
    handleAuthenticateReal,
    handleLockReal,
    updateLockDelayReal,
    lockDelay,
    lockAtTimestamp,
    handleResetKeysReal,
    handleLogoutReal,
    webNotification,
    setWebNotification,
    // User Profile Edit States & Handlers
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
    openProfileModal,
    handleUpdateProfile,
    ...adminLogic
  };
}
