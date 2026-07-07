import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RotateCw, Image, ShieldAlert } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Data: string) => void;
  defaultFacingMode?: 'user' | 'environment';
}

export default function CameraModal({ isOpen, onClose, onCapture, defaultFacingMode = 'user' }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(defaultFacingMode);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync facingMode when defaultFacingMode changes on open
  useEffect(() => {
    if (isOpen) {
      setFacingMode(defaultFacingMode);
    }
  }, [isOpen, defaultFacingMode]);

  // Start Camera Stream
  const startCamera = async () => {
    setError(null);
    setIsCapturing(true);
    
    // Stop any existing streams first
    stopCamera();

    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => {
          console.warn("Video play interrupted:", e);
        });
      }
      setIsCapturing(false);
    } catch (err) {
      console.warn("Error starting camera:", err);
      setError(
        'Không thể truy cập camera trực tiếp. Bạn có thể sử dụng nút "Chụp từ camera hệ thống" ở bên dưới.'
      );
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Toggle Front / Back Camera
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Capture Image Snapshot
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the current video frame on canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Get high-quality jpeg compressed base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(dataUrl);
        onClose();
      }
    } catch (e) {
      console.error("Capture snapshot failed:", e);
      setError("Không thể ghi lại khung ảnh từ camera.");
    }
  };

  // Handle native file input camera trigger
  const handleNativeCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onCapture(event.target.result as string);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
      {/* Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-md overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold font-mono tracking-wider text-emerald-400 uppercase">
              CHỤP ẢNH CAMERA E2EE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Video Frame / Preview Area */}
        <div className="relative aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden">
          {!error ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover transform scale-x-100"
              playsInline
              muted
              autoPlay
            />
          ) : (
            <div className="p-6 text-center text-slate-400 flex flex-col items-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-amber-500 animate-pulse" />
              <p className="text-xs leading-relaxed max-w-[280px]">{error}</p>
            </div>
          )}

          {/* Loading overlay */}
          {isCapturing && (
            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-xs font-mono text-emerald-400">
              Đang khởi tạo camera...
            </div>
          )}
        </div>

        {/* Controls row */}
        <div className="p-5 space-y-4 bg-slate-950/40">
          
          {/* Main Direct Camera Capture Actions */}
          {!error && (
            <div className="flex items-center justify-center gap-6">
              {/* Switch camera mode */}
              <button
                type="button"
                onClick={toggleCamera}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-full transition-all"
                title="Đổi camera"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Shutter snapshot button */}
              <button
                type="button"
                onClick={captureSnapshot}
                className="w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full border-4 border-slate-900 ring-2 ring-emerald-500/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-slate-950" />
                </div>
              </button>

              {/* Spacer matching change camera button */}
              <div className="w-10 h-10" />
            </div>
          )}

          {/* Fallback Mobile Device Camera Capture */}
          <div className="text-center">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleNativeCapture}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Image className="w-4 h-4" />
              <span>Chụp từ camera hệ thống (Khuyên dùng)</span>
            </button>
            <p className="text-[9px] text-slate-500 mt-2 font-mono leading-normal">
              Bảo mật tuyệt đối: Ảnh chụp được mã hóa cục bộ ngay trên thiết bị bằng thuật toán khóa riêng tư trước khi truyền qua mạng.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
