import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, UserSession } from '../types';
import {
  encryptMessage,
  decryptMessage,
  extractPublicKey
} from '../utils/crypto';
import { getCameraPermissionSync } from '../utils/cameraPermission';

interface UseMessageLogicProps {
  realUser: UserSession | null;
  setRealUser: React.Dispatch<React.SetStateAction<UserSession | null>>;
  realUserPrivateKey: CryptoKeyPair['privateKey'] | null;
  activeRecipient: UserSession | null;
  usersList: UserSession[];
  fetchUsers: (customUserId?: string) => Promise<void>;
  realSelfDestruct: number | null;
  realInput: string;
  setRealInput: React.Dispatch<React.SetStateAction<string>>;
  attachedImageBase64: string | null;
  setAttachedImageBase64: React.Dispatch<React.SetStateAction<string | null>>;
  attachedFile: { fileId: string; fileName: string } | null;
  setAttachedFile: React.Dispatch<React.SetStateAction<{ fileId: string; fileName: string } | null>>;
  addLog: (text: string, type?: 'info' | 'success' | 'warn' | 'crypto') => void;
  playBeep: (type?: string) => void;
  clearAllNotifications: () => void;
  autoCheckAndResubscribePush: () => void;
}

export default function useMessageLogic({
  realUser,
  setRealUser,
  realUserPrivateKey,
  activeRecipient,
  usersList,
  fetchUsers,
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
}: UseMessageLogicProps) {
  const [realMessages, setRealMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [hasMoreMessages, setHasMoreMessages] = useState<Record<string, boolean>>({});
  const [isLoadingOlder, setIsLoadingOlder] = useState<boolean>(false);
  const [webNotification, setWebNotification] = useState<{ id: string; message: string } | null>(null);

  const realMessagesRef = useRef<Message[]>([]);
  const isFirstPollRef = useRef<boolean>(true);
  const isSendingRef = useRef<boolean>(false);
  const isPollingRef = useRef<boolean>(false);
  const readQueueRef = useRef<string[]>([]);
  const readTimeoutRef = useRef<any>(null);
  const hasSyncedKeysRef = useRef<boolean>(false);
  const hasSyncedPushRef = useRef<boolean>(false);
  const sendQueueRef = useRef<Array<{
    tempId: string;
    textToSend: string;
    imgToSend: string | null;
    fileToSend: { fileId: string; fileName: string } | null;
    quote: { id: string; senderId: string; senderName: string; text: string } | null;
    realSelfDestruct: number | null;
    pubKeySpki: string;
    recipientId: string;
  }>>([]);
  const isProcessingQueueRef = useRef<boolean>(false);

  // Reset flags if user logs out or changes
  useEffect(() => {
    if (!realUser) {
      hasSyncedKeysRef.current = false;
      hasSyncedPushRef.current = false;
    }
  }, [realUser]);

  const pollIntervalRef = useRef<number>(2000);
  const consecutiveNoMsgRef = useRef<number>(0);

  const resetPollingInterval = useCallback(() => {
    pollIntervalRef.current = 2000;
    consecutiveNoMsgRef.current = 0;
  }, []);

  // Also reset polling interval when realInput changes (typing activity)
  useEffect(() => {
    if (realInput) {
      resetPollingInterval();
    }
  }, [realInput, resetPollingInterval]);

  // Sync realMessages to its ref
  useEffect(() => {
    realMessagesRef.current = realMessages;
  }, [realMessages]);

  const decryptSingleMessage = useCallback(async (msg: any): Promise<any> => {
    if (!realUser || !realUserPrivateKey) return msg;
    
    if (msg.isDestroyed) {
      return { ...msg, decryptedText: null };
    }

    if (msg.recipientId === realUser.id) {
      try {
        const payload = msg.encryptedPayload;
        let targetPayload = payload;
        if (payload && typeof payload === 'object' && payload.isMultiDevice) {
          targetPayload = payload.recipientPayload;
        }
        const rawDecrypted = await decryptMessage(targetPayload, realUserPrivateKey);
        
        let isRead = msg.isRead;
        let readAt = msg.readAt;

        if (realUser?.isBiometricAuthenticated && activeRecipient && activeRecipient.id === msg.senderId && !msg.isRead) {
          await fetch('/api/messages/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: msg.id })
          });
          isRead = true;
          readAt = Date.now();
        }

        let selfDestructTimeRemaining = msg.selfDestructDuration;
        if (isRead && readAt !== null && msg.selfDestructDuration !== null) {
          const elapsed = Math.floor((Date.now() - readAt) / 1000);
          selfDestructTimeRemaining = Math.max(0, msg.selfDestructDuration - elapsed);
        }

        return {
          ...msg,
          decryptedText: rawDecrypted,
          isRead,
          readAt,
          selfDestructTimeRemaining
        };
      } catch (e) {
        return { ...msg, decryptedText: '[Lỗi giải mã: Khóa không đúng]' };
      }
    } else if (msg.senderId === realUser.id) {
      const cachedText = localStorage.getItem(`securecrypt_sent_cache_${msg.id}`);
      
      let selfDestructTimeRemaining = msg.selfDestructDuration;
      if (msg.isRead && msg.readAt !== null && msg.selfDestructDuration !== null) {
        const elapsed = Math.floor((Date.now() - msg.readAt) / 1000);
        selfDestructTimeRemaining = Math.max(0, msg.selfDestructDuration - elapsed);
      }

      let decryptedText = cachedText || 'Đã gửi (Mã hóa E2EE)';
      if (!cachedText) {
        const payload = msg.encryptedPayload;
        if (payload && typeof payload === 'object' && payload.isMultiDevice && payload.senderPayload) {
          try {
            decryptedText = await decryptMessage(payload.senderPayload, realUserPrivateKey);
          } catch (decErr) {
            console.warn('Failed to decrypt senderPayload:', decErr);
          }
        }
      }

      return {
        ...msg,
        decryptedText,
        selfDestructTimeRemaining
      };
    }
    return msg;
  }, [realUser, realUserPrivateKey, activeRecipient]);

  const loadOlderMessages = async (recipientId: string) => {
    if (!realUser || !realUserPrivateKey || isLoadingOlder) return;

    // Find the oldest message in the conversation currently loaded
    const conversationMessages = realMessagesRef.current.filter(
      m => (m.senderId === recipientId && m.recipientId === realUser.id) ||
           (m.senderId === realUser.id && m.recipientId === recipientId)
    );

    let oldestTimestamp = Date.now();
    if (conversationMessages.length > 0) {
      oldestTimestamp = Math.min(...conversationMessages.map(m => m.timestamp));
    }

    setIsLoadingOlder(true);
    try {
      const limit = 30;
      const res = await fetch(`/api/messages/conversation?userId=${realUser.id}&recipientId=${recipientId}&limit=${limit}&beforeTimestamp=${oldestTimestamp}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        if (data.length < limit) {
          setHasMoreMessages(prev => ({ ...prev, [recipientId]: false }));
        } else {
          setHasMoreMessages(prev => ({ ...prev, [recipientId]: true }));
        }

        if (data.length > 0) {
          // Decrypt older messages
          const decryptedOlder = await Promise.all(
            data.map(async (msg: any) => decryptSingleMessage(msg))
          );

          // Merge into state
          setRealMessages((prevMessages) => {
            const messageMap = new Map<string, any>(prevMessages.map(m => [m.id, m]));
            for (const msg of decryptedOlder) {
              messageMap.set(msg.id, msg);
            }
            const mergedList = Array.from(messageMap.values());
            mergedList.sort((a, b) => a.timestamp - b.timestamp);
            return mergedList;
          });
        }
      }
    } catch (err) {
      console.error('Error loading older messages:', err);
    } finally {
      setIsLoadingOlder(false);
    }
  };

  // Fetch initial history when opening a chat if not enough messages are locally loaded
  useEffect(() => {
    if (realUser && activeRecipient) {
      const conversationMessages = realMessages.filter(
        m => (m.senderId === activeRecipient.id && m.recipientId === realUser.id) ||
             (m.senderId === realUser.id && m.recipientId === activeRecipient.id)
      );
      
      if (conversationMessages.length < 15) {
        const fetchInitialConversationHistory = async () => {
          try {
            const limit = 30;
            const res = await fetch(`/api/messages/conversation?userId=${realUser.id}&recipientId=${activeRecipient.id}&limit=${limit}`);
            const data = await res.json();
            if (Array.isArray(data)) {
              if (data.length < limit) {
                setHasMoreMessages(prev => ({ ...prev, [activeRecipient.id]: false }));
              } else {
                setHasMoreMessages(prev => ({ ...prev, [activeRecipient.id]: true }));
              }

              const decryptedOlder = await Promise.all(
                data.map(async (msg: any) => decryptSingleMessage(msg))
              );

              setRealMessages((prevMessages) => {
                const messageMap = new Map<string, any>(prevMessages.map(m => [m.id, m]));
                for (const msg of decryptedOlder) {
                  messageMap.set(msg.id, msg);
                }
                const mergedList = Array.from(messageMap.values());
                mergedList.sort((a, b) => a.timestamp - b.timestamp);
                return mergedList;
              });
            }
          } catch (err) {
            console.error('Error fetching initial conversation history:', err);
          }
        };

        fetchInitialConversationHistory();
      } else {
        setHasMoreMessages(prev => {
          if (prev[activeRecipient.id] === undefined) {
            return { ...prev, [activeRecipient.id]: true };
          }
          return prev;
        });
      }
    }
  }, [activeRecipient?.id, realUser?.id, decryptSingleMessage]);

  // Automatically mark unread messages as read when activeRecipient changes, biometric is authenticated, or new unread messages arrive
  useEffect(() => {
    if (!realUser || !realUser.isBiometricAuthenticated || !activeRecipient) return;

    // Find all unread messages from activeRecipient to realUser
    const unreadMessages = realMessages.filter(
      m => m.senderId === activeRecipient.id && m.recipientId === realUser.id && !m.isRead
    );

    if (unreadMessages.length === 0) return;

    const markAsRead = async () => {
      const now = Date.now();
      const updatedIds = new Set(unreadMessages.map(m => m.id));

      // Optimistic state update so badge/UI updates instantly
      setRealMessages(prev => prev.map(m => {
        if (updatedIds.has(m.id)) {
          return {
            ...m,
            isRead: true,
            readAt: now,
            selfDestructTimeRemaining: m.selfDestructDuration
          };
        }
        return m;
      }));

      // Add to batch queue
      unreadMessages.forEach(m => {
        if (!readQueueRef.current.includes(m.id)) {
          readQueueRef.current.push(m.id);
        }
      });

      if (readTimeoutRef.current) {
        clearTimeout(readTimeoutRef.current);
      }

      readTimeoutRef.current = setTimeout(async () => {
        const messageIds = [...readQueueRef.current];
        if (messageIds.length === 0) return;
        readQueueRef.current = [];

        try {
          await fetch('/api/messages/read-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageIds })
          });
        } catch (err) {
          console.error('Error updating batch read status:', err);
        }
      }, 150);
    };

    markAsRead();
  }, [activeRecipient?.id, realUser?.isBiometricAuthenticated, realMessages.length]);

  const pollMessagesReal = useCallback(async () => {
    if (!realUser || !realUserPrivateKey) return;
    if (isPollingRef.current) return { hasNewMessages: false, hasUpdates: false };
    isPollingRef.current = true;
    try {
      const isFirstPoll = isFirstPollRef.current;
      
      let newRawMessages: any[] = [];
      let statusUpdates: any[] = [];
      let deletedIdsOnServer: string[] = [];

      if (isFirstPoll) {
        // Bootstrap: fetch latest 50 messages overall
        const res = await fetch(`/api/messages?userId=${realUser.id}&limit=50`);
        const data = await res.json();
        if (Array.isArray(data)) {
          newRawMessages = data;
        }
        isFirstPollRef.current = false;
      } else {
        // Find maximum timestamp of already loaded messages
        const realMsgs = realMessagesRef.current.filter(m => !m.id.startsWith('temp-') && !m.id.startsWith('opt-'));
        const lastSyncTimestamp = realMsgs.length > 0 
          ? Math.max(...realMsgs.map(m => m.timestamp)) 
          : 0;

        // Pending messages: either unread, or self-destructing and not destroyed yet
        const pendingIds = realMessagesRef.current
          .filter(m => !m.isRead || (m.selfDestructDuration !== null && !m.isDestroyed))
          .map(m => m.id)
          .filter(id => !id.startsWith('temp-') && !id.startsWith('opt-'));

        const loadedIds = realMessagesRef.current
          .slice(-20)
          .map(m => m.id)
          .filter(id => !id.startsWith('temp-') && !id.startsWith('opt-'));

        const res = await fetch(`/api/messages/sync?userId=${realUser.id}&sinceTimestamp=${lastSyncTimestamp}&pendingIds=${pendingIds.join(',')}&loadedIds=${loadedIds.join(',')}&isFocused=${document.hasFocus()}&hasCameraPermission=${getCameraPermissionSync()}`);
        const syncResult = await res.json();
        
        if (syncResult) {
          newRawMessages = syncResult.newMessages || [];
          statusUpdates = syncResult.statusUpdates || [];
          deletedIdsOnServer = syncResult.deletedIds || [];
        }
      }

      // 1. Decrypt any new messages
      const decryptedNewMessages = await Promise.all(
        newRawMessages.map(async (msg: any) => decryptSingleMessage(msg))
      );

      // 2. Update status of pending messages
      const updatedPendingMessages = await Promise.all(
        statusUpdates.map(async (update: any) => {
          const originalMsg = realMessagesRef.current.find(m => m.id === update.id);
          if (!originalMsg) return null;

          // Merge updated fields
          const merged = { ...originalMsg, ...update };

          // If a message just got read/destroyed, recalculate selfDestructTimeRemaining
          if (merged.isDestroyed) {
            merged.decryptedText = null;
          }

          let selfDestructTimeRemaining = merged.selfDestructDuration;
          if (merged.isRead && merged.readAt !== null && merged.selfDestructDuration !== null) {
            const elapsed = Math.floor((Date.now() - merged.readAt) / 1000);
            selfDestructTimeRemaining = Math.max(0, merged.selfDestructDuration - elapsed);
          }
          merged.selfDestructTimeRemaining = selfDestructTimeRemaining;

          return merged;
        })
      );

      // Now merge everything into state
      setRealMessages((prevMessages) => {
        // Filter out any messages that have been deleted on the server
        let filteredPrev = prevMessages;
        if (deletedIdsOnServer.length > 0) {
          const deletedSet = new Set(deletedIdsOnServer);
          filteredPrev = prevMessages.filter(m => !deletedSet.has(m.id));
        }

        // Create a map for easy lookup & replacement
        const messageMap = new Map<string, any>(filteredPrev.map(m => [m.id, m]));

        // Apply status updates
        for (const updated of updatedPendingMessages) {
          if (updated) {
            messageMap.set(updated.id, updated);
          }
        }

        // Add new decrypted messages
        for (const msg of decryptedNewMessages) {
          messageMap.set(msg.id, msg);
        }

        const mergedList = Array.from(messageMap.values());
        mergedList.sort((a, b) => a.timestamp - b.timestamp);

        // Detect if any new message came in for notifications
        const incomingNew = decryptedNewMessages.filter(m => 
          m.recipientId === realUser.id && 
          !prevMessages.some(prev => prev.id === m.id)
        );

        if (!isFirstPoll && incomingNew.length > 0) {
          const sender = usersList.find(u => u.id === incomingNew[0].senderId);
          const senderName = sender ? sender.name : 'Một tác giả';
          const notificationMsg = `Có bài viết mới trên báo Dân trí của tác giả ${senderName}!`;

          const isComputer = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          const isVisible = document.visibilityState === 'visible';

          if (isVisible && isComputer) {
            setWebNotification({
              id: `notif-${Date.now()}`,
              message: notificationMsg
            });
            playBeep('receive');
          }

          if (!isVisible && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('Báo Dân trí', {
                body: notificationMsg,
                icon: '/icon.svg'
              });
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                   new Notification('Báo Dân trí', {
                    body: notificationMsg,
                    icon: '/icon.svg'
                  });
                }
              });
            }
          }
        }

        return mergedList;
      });

      return {
        hasNewMessages: newRawMessages.length > 0,
        hasUpdates: statusUpdates.length > 0 || deletedIdsOnServer.length > 0
      };
    } catch (e) {
      console.error('Error polling real messages:', e);
      return { hasNewMessages: false, hasUpdates: false };
    } finally {
      isPollingRef.current = false;
    }
  }, [realUser, realUserPrivateKey, usersList, playBeep, decryptSingleMessage]);

  const syncDevicePublicKeySpki = useCallback(async () => {
    if (!realUser) return;
    try {
      const localPubSpki = localStorage.getItem(`securecrypt_pub_${realUser.id}`);
      if (!localPubSpki) return;

      const res = await fetch(`/api/users?userId=${realUser.id}&includeSelf=true`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        const meOnServer = data.find(u => u.id === realUser.id);
        if (!meOnServer) return;

        const serverPubOnly = extractPublicKey(meOnServer.publicKeySpki) || meOnServer.publicKeySpki;

        if (serverPubOnly && serverPubOnly !== localPubSpki) {
          addLog(`[ĐỒNG BỘ KHÓA] Phát hiện khóa trên máy chủ bị lệch so với thiết bị này (do thiết bị khác cập nhật). Tiến hành đồng bộ khóa công khai của thiết bị này lên máy chủ để tái thiết lập kết nối...`, 'info');
          
          const updateRes = await fetch('/api/users/publicKey', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId: realUser.id, 
              publicKeySpki: localPubSpki
            })
          });
          
          if (updateRes.ok) {
            setRealUser(prev => prev ? { ...prev, publicKeySpki: localPubSpki } : null);
            addLog(`[ĐỒNG BỘ KHÓA] Đã đồng bộ khóa công khai của thiết bị đang Focus lên máy chủ thành công. Từ bây giờ các tin nhắn mới sẽ mã hóa tương thích với thiết bị này.`, 'success');
          }
        }
      }
    } catch (err) {
      console.error('Error syncing device public key:', err);
    }
  }, [realUser, setRealUser, addLog]);

  // Poll loop with Adaptive Polling
  useEffect(() => {
    if (!realUser) return;

    fetchUsers();
    pollMessagesReal();
    
    if (!hasSyncedKeysRef.current) {
      syncDevicePublicKeySpki();
      hasSyncedKeysRef.current = true;
    }
    
    if (!hasSyncedPushRef.current) {
      autoCheckAndResubscribePush();
      hasSyncedPushRef.current = true;
    }

    let timeoutId: any = null;

    const runPoll = async () => {
      if (document.hasFocus()) {
        const result = await pollMessagesReal();
        const hasNewMsg = result?.hasNewMessages || false;
        const hasUpd = result?.hasUpdates || false;

        if (hasNewMsg) {
          // Reset interval to 2 seconds immediately on new message
          pollIntervalRef.current = 2000;
          consecutiveNoMsgRef.current = 0;
        } else {
          // If no new messages, gradually increase from 2s -> 4s -> 6s -> up to 10s max
          consecutiveNoMsgRef.current += 1;
          if (consecutiveNoMsgRef.current > 5) {
            pollIntervalRef.current = Math.min(10000, pollIntervalRef.current + 2000);
          }
        }
      } else {
        // If not focused, backoff immediately to 10 seconds to save server resources
        pollIntervalRef.current = 10000;
        consecutiveNoMsgRef.current = 0;
      }

      timeoutId = setTimeout(runPoll, pollIntervalRef.current);
    };

    // Start adaptive polling loop
    timeoutId = setTimeout(runPoll, pollIntervalRef.current);

    // Poll users every 10 seconds to reduce server load
    const userInterval = setInterval(() => {
      if (document.hasFocus()) {
        fetchUsers();
      }
    }, 10000);

    const handleFocus = () => {
      // Focus resets polling interval immediately
      pollIntervalRef.current = 2000;
      consecutiveNoMsgRef.current = 0;
      
      clearAllNotifications();
      fetchUsers();
      pollMessagesReal();

      // Restart the loop with fast polling
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(runPoll, pollIntervalRef.current);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      clearInterval(userInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [realUser, activeRecipient?.id, fetchUsers, pollMessagesReal, syncDevicePublicKeySpki, clearAllNotifications, autoCheckAndResubscribePush]);

  // Timer self destruct ticking loop
  useEffect(() => {
    const interval = setInterval(() => {
      const activeMessages = realMessages;
      if (activeMessages.length === 0) return;

      let changed = false;
      const nextMessages = activeMessages.map((msg) => {
        if (msg.isRead && msg.readAt !== null && msg.selfDestructDuration !== null && !msg.isDestroyed) {
          changed = true;
          const elapsed = Math.floor((Date.now() - msg.readAt) / 1000);
          const remaining = Math.max(0, msg.selfDestructDuration - elapsed);

          if (remaining === 0) {
            playBeep('explode');
            addLog(`[TỰ HỦY] Tin nhắn ID (${msg.id.substring(4, 9)}) tự hủy hoàn toàn trên RAM và cơ sở dữ liệu.`, 'warn');
            
            fetch('/api/messages/destroy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messageId: msg.id })
            }).catch(console.error);
            localStorage.removeItem(`securecrypt_sent_cache_${msg.id}`);

            return {
              ...msg,
              selfDestructTimeRemaining: 0,
              isDestroyed: true,
              decryptedText: null,
            };
          } else {
            return {
              ...msg,
              selfDestructTimeRemaining: remaining,
            };
          }
        }
        return msg;
      });

      if (changed) {
        setRealMessages(nextMessages);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [realMessages, playBeep, addLog]);

  const processSendQueue = useCallback(async () => {
    if (isProcessingQueueRef.current) return;
    isProcessingQueueRef.current = true;

    while (sendQueueRef.current.length > 0) {
      const item = sendQueueRef.current[0];
      const {
        tempId,
        textToSend,
        imgToSend,
        fileToSend,
        quote,
        realSelfDestruct,
        pubKeySpki,
        recipientId
      } = item;

      try {
        let contentPayload = '';
        if (fileToSend) {
          contentPayload = JSON.stringify({
            type: 'file',
            fileId: fileToSend.fileId,
            fileName: fileToSend.fileName,
            text: textToSend || fileToSend.fileName,
            quote: quote || undefined
          });
        } else if (imgToSend) {
          contentPayload = JSON.stringify({
            type: 'image',
            image: imgToSend,
            text: textToSend || '',
            quote: quote || undefined
          });
        } else {
          contentPayload = JSON.stringify({
            type: 'text',
            text: textToSend,
            quote: quote || undefined
          });
        }

        // Encrypt for recipient
        const encryptedPayloadForRecipient = await encryptMessage(contentPayload, pubKeySpki);

        // Encrypt for sender (to support multiple devices logged in on the same user)
        const senderPubKey = extractPublicKey(realUser!.publicKeySpki) || localStorage.getItem(`securecrypt_pub_${realUser!.id}`);
        let encryptedPayloadForSender = null;
        if (senderPubKey) {
          try {
            encryptedPayloadForSender = await encryptMessage(contentPayload, senderPubKey);
          } catch (err) {
            console.warn('Failed to encrypt message for sender backup:', err);
          }
        }

        const encryptedPayload = {
          recipientPayload: encryptedPayloadForRecipient,
          senderPayload: encryptedPayloadForSender,
          isMultiDevice: true
        };

        const optimisticMsg = realMessagesRef.current.find(m => m.id === tempId);
        const originalTimestamp = optimisticMsg ? optimisticMsg.timestamp : undefined;

        let res: Response | null = null;
        let attempt = 0;
        const maxRetries = 3;
        const retryDelays = [2000, 3000, 5000]; // Total 10s of retry delay window (2s, 3s, 5s)

        while (true) {
          try {
            // 1. Pre-flight connection probe: Warm up the browser's TCP connection before sending
            if (attempt === 0) {
              try {
                // Send an ultra-small request to force browser to warm up or recreate half-open TCP connections
                await fetch('/api/ping', { method: 'GET', cache: 'no-store' });
              } catch (e) {
                console.warn('[KẾT NỐI] Không thể thực hiện ping làm ấm kết nối:', e);
              }
            } else {
              addLog(`[KẾT NỐI] Phát hiện sự cố mạng. Đang tự động gửi lại (Thử lần ${attempt}/${maxRetries}) sau ${retryDelays[attempt - 1]}ms...`, 'info');
              await new Promise(resolve => setTimeout(resolve, retryDelays[attempt - 1]));
            }

            // 2. Perform actual encrypted payload transmission
            res = await fetch('/api/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                senderId: realUser!.id,
                recipientId: recipientId,
                encryptedPayload,
                selfDestructDuration: realSelfDestruct,
                gdriveFileId: fileToSend ? fileToSend.fileId : null,
                timestamp: originalTimestamp
              })
            });

            if (!res.ok) {
              throw new Error(`Mã phản hồi từ máy chủ: ${res.status}`);
            }

            break; // Success! Break retry loop
          } catch (fetchErr) {
            console.warn(`Lỗi gửi tin nhắn (Thử lần ${attempt}):`, fetchErr);

            attempt++;
            if (attempt > maxRetries) {
              throw new Error(`Đã tự động thử lại ${maxRetries} lần nhưng vẫn thất bại do lỗi kết nối mạng (Failed to fetch). Vui lòng kiểm tra lại đường truyền.`);
            }
          }
        }

        const dbMsg = await res.json();
        localStorage.setItem(`securecrypt_sent_cache_${dbMsg.id}`, contentPayload);

        // Replace optimistic message with real message
        setRealMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempId);
          const locallyDecryptedMsg = {
            ...dbMsg,
            decryptedText: contentPayload,
            selfDestructTimeRemaining: realSelfDestruct,
            status: 'sent' as const
          };
          const next = [...filtered, locallyDecryptedMsg];
          next.sort((a, b) => a.timestamp - b.timestamp);
          return next;
        });

        playBeep('send');
        addLog(`[TRUYỀN TIN] Gửi thành công bản mã ảnh/tin nhắn E2EE lên máy chủ.`, 'success');

        // Remove from queue on success
        sendQueueRef.current.shift();

      } catch (err) {
        console.error('Queue send error:', err);
        // Do not remove optimistic message or restore text to input!
        // Instead, update the message status in the UI to 'failed'
        setRealMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' as const } : m));

        addLog(`Gửi thất bại: ${(err as Error).message}`, 'warn');

        // Remove from queue on failure to prevent blockages
        sendQueueRef.current.shift();
      }
    }

    isProcessingQueueRef.current = false;
    // Trigger poll after queue is cleared to sync statuses
    pollMessagesReal();
  }, [realUser, setRealMessages, playBeep, addLog, pollMessagesReal]);

  const handleSendRealMessage = async (
    e?: React.FormEvent,
    quote?: { id: string; senderId: string; senderName: string; text: string } | null,
    onSuccess?: () => void
  ) => {
    if (e) e.preventDefault();
    if (!realUser || !activeRecipient) return;

    const textToSend = realInput.trim();
    const imgToSend = attachedImageBase64;
    const fileToSend = attachedFile;

    if (!textToSend && !imgToSend && !fileToSend) return;

    // Clear input values instantly from UI
    setRealInput('');
    setAttachedImageBase64(null);
    setAttachedFile(null);

    const currentRecipientOnServer = usersList.find(u => u.id === activeRecipient.id);
    const pubKeySpkiRaw = currentRecipientOnServer?.publicKeySpki;
    const pubKeySpki = extractPublicKey(pubKeySpkiRaw);
    if (!pubKeySpki) {
      addLog(`Không thể gửi. Đối phương "${activeRecipient.name}" chưa đăng ký Khóa công khai E2EE.`, 'warn');
      // Restore inputs on failure
      setRealInput(textToSend);
      setAttachedImageBase64(imgToSend);
      setAttachedFile(fileToSend);
      return;
    }

    addLog(`[MÃ HÓA] Thêm gói tin E2EE gửi tới ${activeRecipient.name} vào hàng đợi...`, 'info');

    const tempId = `opt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Optimistic UI representation
    let contentPayload = '';
    if (fileToSend) {
      contentPayload = JSON.stringify({
        type: 'file',
        fileId: fileToSend.fileId,
        fileName: fileToSend.fileName,
        text: textToSend || fileToSend.fileName,
        quote: quote || undefined
      });
    } else if (imgToSend) {
      contentPayload = JSON.stringify({
        type: 'image',
        image: imgToSend,
        text: textToSend || '',
        quote: quote || undefined
      });
    } else {
      contentPayload = JSON.stringify({
        type: 'text',
        text: textToSend,
        quote: quote || undefined
      });
    }

    const optimisticMsg: Message = {
      id: tempId,
      senderId: realUser.id,
      recipientId: activeRecipient.id,
      timestamp: Date.now(),
      encryptedPayload: {} as any,
      decryptedText: contentPayload,
      isRead: false,
      readAt: null,
      selfDestructDuration: realSelfDestruct,
      selfDestructTimeRemaining: realSelfDestruct,
      isDestroyed: false,
      status: 'sending'
    };

    setRealMessages(prev => [...prev, optimisticMsg]);
    if (onSuccess) {
      onSuccess();
    }

    // Push task into send queue
    sendQueueRef.current.push({
      tempId,
      textToSend,
      imgToSend,
      fileToSend,
      quote: quote || null,
      realSelfDestruct,
      pubKeySpki,
      recipientId: activeRecipient.id
    });

    // Start processing
    processSendQueue();
  };

  // Manual retry function for failed messages
  const handleRetryMessage = useCallback(async (messageId: string) => {
    const msg = realMessagesRef.current.find(m => m.id === messageId);
    if (!msg) return;

    // Set status to 'sending' first
    setRealMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'sending' as const } : m));

    // Get recipient pubKeySpki
    const recipientUser = usersList.find(u => u.id === msg.recipientId);
    const pubKeySpkiRaw = recipientUser?.publicKeySpki;
    const pubKeySpki = extractPublicKey(pubKeySpkiRaw);
    if (!pubKeySpki) {
      addLog(`Không thể gửi lại. Đối phương chưa đăng ký Khóa công khai E2EE.`, 'warn');
      setRealMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'failed' as const } : m));
      return;
    }

    // Parse data from existing E2EE payload structure
    let parsed: any = {};
    try {
      parsed = JSON.parse(msg.decryptedText || '{}');
    } catch (e) {
      parsed = { type: 'text', text: msg.decryptedText };
    }

    const textToSend = parsed.text || '';
    const imgToSend = parsed.image || null;
    let fileToSend = null;
    if (parsed.type === 'file') {
      fileToSend = { fileId: parsed.fileId, fileName: parsed.fileName };
    }

    sendQueueRef.current.push({
      tempId: msg.id,
      textToSend,
      imgToSend,
      fileToSend,
      quote: parsed.quote || null,
      realSelfDestruct: msg.selfDestructDuration,
      pubKeySpki,
      recipientId: msg.recipientId
    });

    processSendQueue();
  }, [setRealMessages, usersList, addLog, processSendQueue]);

  // Online status event listener to automatically retry failed/sending messages
  useEffect(() => {
    const handleOnline = () => {
      addLog('[KẾT NỐI] Thiết bị đã trực tuyến trở lại. Tự động kiểm tra và gửi lại các tin nhắn bị lỗi...', 'info');
      
      const failedMessages = realMessagesRef.current.filter(
        m => m.senderId === realUser?.id && (m.status === 'failed' || m.status === 'sending')
      );

      if (failedMessages.length === 0) return;

      failedMessages.forEach(msg => {
        // Prevent duplicate queuing
        const inQueue = sendQueueRef.current.some(q => q.tempId === msg.id);
        if (inQueue) return;

        setRealMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sending' as const } : m));

        const recipientUser = usersList.find(u => u.id === msg.recipientId);
        const pubKeySpkiRaw = recipientUser?.publicKeySpki;
        const pubKeySpki = extractPublicKey(pubKeySpkiRaw);
        if (!pubKeySpki) return;

        let parsed: any = {};
        try {
          parsed = JSON.parse(msg.decryptedText || '{}');
        } catch (e) {
          parsed = { type: 'text', text: msg.decryptedText };
        }

        const textToSend = parsed.text || '';
        const imgToSend = parsed.image || null;
        let fileToSend = null;
        if (parsed.type === 'file') {
          fileToSend = { fileId: parsed.fileId, fileName: parsed.fileName };
        }

        sendQueueRef.current.push({
          tempId: msg.id,
          textToSend,
          imgToSend,
          fileToSend,
          quote: parsed.quote || null,
          realSelfDestruct: msg.selfDestructDuration,
          pubKeySpki,
          recipientId: msg.recipientId
        });
      });

      processSendQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [realUser?.id, usersList, setRealMessages, processSendQueue, addLog]);

  // Auto dismiss web notification after 10s
  useEffect(() => {
    if (!webNotification) return;
    const timer = setTimeout(() => {
      setWebNotification(null);
    }, 10000);
    return () => clearTimeout(timer);
  }, [webNotification]);

  return {
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
    syncDevicePublicKeySpki
  };
}
