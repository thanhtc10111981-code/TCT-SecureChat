import React, { useState, useEffect } from 'react';
import { UserSession } from '../types';
import { urlBase64ToUint8Array } from '../utils/helpers';

interface UsePwaAndNotificationsProps {
  realUser: UserSession | null;
  setRealUser: React.Dispatch<React.SetStateAction<UserSession | null>>;
  addLog: (text: string, type?: 'info' | 'success' | 'warn' | 'crypto') => void;
}

export default function usePwaAndNotifications({
  realUser,
  setRealUser,
  addLog
}: UsePwaAndNotificationsProps) {
  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPWAInstallPrompt, setShowPWAInstallPrompt] = useState<boolean>(false);
  const [pwaOS, setPwaOS] = useState<'android-pc' | 'ios' | 'other'>('other');
  const [isPWAInstalled, setIsPWAInstalled] = useState<boolean>(false);

  // Notification states
  const [prefWebPush, setPrefWebPush] = useState<boolean>(true);
  const [prefTelegram, setPrefTelegram] = useState<boolean>(true);
  const [isPushSubscribed, setIsPushSubscribed] = useState<boolean>(false);
  const [vapidPublicKey, setVapidPublicKey] = useState<string>('');
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [userTelegramChatIdInput, setUserTelegramChatIdInput] = useState<string>('');
  const [notificationConfigSuccess, setNotificationConfigSuccess] = useState<string | null>(null);
  const [notificationConfigError, setNotificationConfigError] = useState<string | null>(null);
  const [isSavingNotificationConfig, setIsSavingNotificationConfig] = useState<boolean>(false);

  // Fetch VAPID key & Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered successfully:', reg.scope);
          return reg.pushManager.getSubscription();
        })
        .then((sub) => {
          setIsPushSubscribed(!!sub);
        })
        .catch((err) => {
          console.error('[PWA] Service Worker registration failed:', err);
        });
    }

    const fetchVapidKey = async () => {
      try {
        const res = await fetch('/api/push/vapid-public-key');
        if (res.ok) {
          const data = await res.json();
          if (data.publicKey) {
            setVapidPublicKey(data.publicKey);
          }
        }
      } catch (err) {
        console.warn('[PWA] Không thể tải VAPID public key từ máy chủ:', err);
      }
    };
    fetchVapidKey();
  }, []);

  // Detect platform & check installation status
  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroidOrPCDevice = /Android|Windows|Macintosh|Linux|CrOS/.test(ua) && !isIOSDevice;
    
    if (isIOSDevice) {
      setPwaOS('ios');
    } else if (isAndroidOrPCDevice) {
      setPwaOS('android-pc');
    } else {
      setPwaOS('other');
    }

    const checkIsInstalled = () => {
      const isEventInstalled = localStorage.getItem('pwa_installed_event') === 'true';
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true || isEventInstalled;
      setIsPWAInstalled(standalone);
    };
    
    checkIsInstalled();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsPWAInstalled(e.matches);
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('[PWA] Đã bắt được sự kiện beforeinstallprompt (Android/PC)');
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] Ứng dụng đã được cài đặt thành công (appinstalled)!');
      localStorage.setItem('pwa_installed_event', 'true');
      setIsPWAInstalled(true);
      setShowPWAInstallPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Show installation prompt 3 seconds after logging in
  useEffect(() => {
    if (realUser) {
      const isEventInstalled = localStorage.getItem('pwa_installed_event') === 'true';
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true || isEventInstalled;
      const isDismissed = localStorage.getItem('pwa_prompt_dismissed_permanently') === 'true';
      if (!standalone && !isDismissed) {
        const timer = setTimeout(() => {
          setShowPWAInstallPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setShowPWAInstallPrompt(false);
    }
  }, [realUser]);

  // Fetch preferences when user changes
  useEffect(() => {
    if (!realUser) return;
    setUserTelegramChatIdInput(realUser.telegramChatId || '');
    const fetchPrefs = async () => {
      try {
        const res = await fetch(`/api/users/notification-preferences?userId=${realUser.id}`);
        if (res.ok) {
          const data = await res.json();
          const prefs = data.preferences || {};
          setPrefWebPush(prefs.webPush !== false);
          setPrefTelegram(prefs.telegram !== false);
          if (data.telegramChatId !== undefined) {
            setUserTelegramChatIdInput(data.telegramChatId || '');
          }
        }
      } catch (e) {
        console.error('Error fetching notification preferences:', e);
      }
    };
    fetchPrefs();
  }, [realUser]);

  const triggerPWAInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          addLog('[PWA] Đã cài đặt ứng dụng làm PWA thành công! Trải nghiệm chế độ bảo mật toàn màn hình tối đa.', 'success');
          localStorage.setItem('pwa_installed_event', 'true');
          setIsPWAInstalled(true);
        } else {
          addLog('[PWA] Người dùng đã từ chối cài đặt nhanh PWA.', 'info');
        }
      } catch (err: any) {
        console.error('[PWA] Lỗi kích hoạt prompt cài đặt:', err);
      } finally {
        setDeferredPrompt(null);
        setShowPWAInstallPrompt(false);
      }
    } else {
      addLog('[PWA] Hiện tại thiết bị không thể kích hoạt cài đặt nhanh. Bạn có thể cài đặt thủ công qua menu trình duyệt.', 'info');
    }
  };

  const subscribeUserToPush = async () => {
    if (!realUser) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      addLog('[PWA] Trình duyệt này không hỗ trợ Thông báo đẩy.', 'warn');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        setIsPushSubscribed(true);
        return;
      }

      if (Notification.permission === 'denied') {
        addLog('[PWA] Quyền nhận thông báo bị từ chối bởi người dùng.', 'warn');
        return;
      }

      if (!vapidPublicKey) {
        addLog('[PWA] Chưa tải được khóa công khai VAPID từ máy chủ.', 'warn');
        return;
      }

      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      };

      const sub = await reg.pushManager.subscribe(subscribeOptions);
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: realUser.id, subscription: sub })
      });

      if (res.ok) {
        setIsPushSubscribed(true);
        addLog('[PWA] Đã liên kết thiết bị thành công để nhận Thông báo đẩy (Web Push) Dân trí!', 'success');
        
        // Tự động bật cấu hình Web Push để người dùng không phải kích hoạt thủ công
        setPrefWebPush(true);
        await fetch('/api/users/notification-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: realUser.id, webPush: true })
        }).catch(e => console.error('[PWA] Lỗi tự động bật cấu hình Web Push:', e));
        addLog('[CÀI ĐẶT] Đã tự động kích hoạt cấu hình nhận tin tức tức thời (Web Push: BẬT).', 'info');
      } else {
        addLog('[PWA] Lỗi đồng bộ đăng ký đẩy với máy chủ.', 'warn');
      }
    } catch (err: any) {
      addLog(`[PWA] Không thể đăng ký thông báo đẩy: ${err.message || err}`, 'warn');
    }
  };

  const unsubscribeUserFromPush = async () => {
    if (!realUser) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: realUser.id, subscription: sub })
        });
      }
      setIsPushSubscribed(false);
      addLog('[PWA] Đã hủy đăng ký nhận thông báo đẩy trên thiết bị này.', 'info');
    } catch (err) {
      addLog('[PWA] Lỗi xảy ra khi hủy đăng ký thông báo đẩy.', 'warn');
    }
  };

  const autoCheckAndResubscribePush = async () => {
    if (!realUser) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      if (Notification.permission === 'default') {
        console.log('[PWA] Quyền thông báo đang ở trạng thái mặc định. Tiến hành tự động yêu cầu quyền để liên kết thiết bị...');
        addLog('[PWA] Đang tự động kiểm tra và yêu cầu liên kết thông báo đẩy cho thiết bị...', 'info');
        
        setTimeout(async () => {
          try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              addLog('[PWA] Đã được cấp quyền nhận thông báo! Đang tự động tiến hành liên kết thiết bị...', 'info');
              await subscribeUserToPush();
            } else {
              addLog('[PWA] Người dùng chưa cấp quyền nhận thông báo đẩy. Bạn có thể bật lại trong cài đặt trình duyệt bất kỳ lúc nào.', 'warn');
            }
          } catch (e: any) {
            console.error('[PWA] Lỗi yêu cầu quyền tự động:', e);
          }
        }, 1500);
        return;
      }

      if (Notification.permission === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!sub) {
          console.log('[PWA] Quyền thông báo được cấp (granted) nhưng subscription bị mất (do iOS dọn dẹp hoặc chưa tạo). Tiến hành tự động đăng ký lại...');
          const subscribeOptions = {
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          };
          const newSub = await reg.pushManager.subscribe(subscribeOptions);
          const res = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: realUser.id, subscription: newSub })
          });
          
          if (res.ok) {
            setIsPushSubscribed(true);
            addLog('[PWA] Tự động liên kết thiết bị nhận Thông báo đẩy thành công!', 'success');
            
            // Tự động bật cấu hình Web Push để người dùng không phải kích hoạt thủ công
            setPrefWebPush(true);
            await fetch('/api/users/notification-preferences', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: realUser.id, webPush: true })
            }).catch(e => console.error('[PWA] Lỗi tự động bật cấu hình Web Push:', e));
            addLog('[CÀI ĐẶT] Đã tự động kích hoạt cấu hình nhận tin tức tức thời (Web Push: BẬT).', 'info');
          }
        } else {
          setIsPushSubscribed(true);
          const res = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: realUser.id, subscription: sub })
          });
          if (res.ok) {
            console.log('[PWA] Đồng bộ liên kết thông báo đẩy của thiết bị với máy chủ thành công!');
            
            // Tự động bật cấu hình Web Push để người dùng không phải kích hoạt thủ công
            setPrefWebPush(true);
            await fetch('/api/users/notification-preferences', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: realUser.id, webPush: true })
            }).catch(e => console.error('[PWA] Lỗi tự động bật cấu hình Web Push:', e));
            addLog('[CÀI ĐẶT] Đã tự động đồng bộ & kích hoạt cấu hình nhận tin tức tức thời (Web Push: BẬT).', 'info');
          }
        }
      } else {
        setIsPushSubscribed(false);
      }
    } catch (err: any) {
      console.warn('[PWA] Lỗi tự động kiểm tra và liên kết thông báo đẩy:', err);
    }
  };

  const handleTogglePrefWebPush = async () => {
    if (!realUser) return;
    const newVal = !prefWebPush;
    setPrefWebPush(newVal);
    try {
      await fetch('/api/users/notification-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: realUser.id, webPush: newVal })
      });
      addLog(`[CÀI ĐẶT] Đã ${newVal ? 'BẬT' : 'TẮT'} kênh nhận thông báo PWA Web Push thành công.`, 'info');
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePrefTelegram = async () => {
    if (!realUser) return;
    const newVal = !prefTelegram;
    setPrefTelegram(newVal);
    try {
      await fetch('/api/users/notification-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: realUser.id, telegram: newVal })
      });
      addLog(`[CÀI ĐẶT] Đã ${newVal ? 'BẬT' : 'TẮT'} kênh nhận thông báo Telegram BOT thành công.`, 'info');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNotificationConfig = async () => {
    if (!realUser) return;
    setIsSavingNotificationConfig(true);
    setNotificationConfigSuccess(null);
    setNotificationConfigError(null);

    try {
      const resPref = await fetch('/api/users/notification-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: realUser.id,
          webPush: prefWebPush,
          telegram: prefTelegram,
          telegramChatId: userTelegramChatIdInput
        })
      });

      if (!resPref.ok) {
        throw new Error('Lỗi cập nhật máy chủ.');
      }

      setRealUser(prev => prev ? { ...prev, telegramChatId: userTelegramChatIdInput } : null);
      setNotificationConfigSuccess('Cập nhật cấu hình kênh truyền thông tin bài thành công!');
      addLog('[CÀI ĐẶT] Lưu thành công cấu hình truyền tin bài tức thời (Web Push & Telegram).', 'success');

      setTimeout(() => {
        setIsNotificationModalOpen(false);
        setNotificationConfigSuccess(null);
      }, 1000);

    } catch (error: any) {
      setNotificationConfigError(error.message || 'Lỗi hệ thống khi lưu cấu hình.');
      addLog(`Cấu hình thất bại: ${error.message}`, 'warn');
    } finally {
      setIsSavingNotificationConfig(false);
    }
  };

  const clearAllNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
    try {
      // 1. Dọn dẹp cục bộ qua Service Worker chính (ready)
      const reg = await navigator.serviceWorker.ready;
      if (reg.getNotifications) {
        const notifications = await reg.getNotifications();
        if (notifications && notifications.length > 0) {
          notifications.forEach((notification) => {
            notification.close();
          });
        }
      }

      // 2. Dự phòng: Quét qua tất cả các Service Worker đang chạy và gửi tín hiệu dọn dẹp
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const r of registrations) {
        if (r.getNotifications) {
          const notifications = await r.getNotifications();
          notifications.forEach(n => n.close());
        }
        if (r.active) {
          r.active.postMessage({ action: 'clear-notifications' });
        }
      }

      addLog('[PWA] Đã tự động dọn dẹp toàn bộ các thông báo cũ khỏi trung tâm thông báo thiết bị.', 'info');
    } catch (err) {
      console.warn('[PWA] Không thể dọn dẹp các thông báo cũ:', err);
    }
  };

  return {
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
  };
}
