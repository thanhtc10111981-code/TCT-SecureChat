import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, RefreshCw, EyeOff, Shield, Download } from 'lucide-react';
import { motion } from 'motion/react';
import ScreenShield from './ScreenShield';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  captionText?: string | null;
  userEmail?: string;
  isAdmin?: boolean;
}

export default function ImageLightbox({ isOpen, onClose, imageSrc, captionText, userEmail, isAdmin }: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isMouseDown, setIsMouseDown] = useState(false);

  const touchStartRef = React.useRef<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const touchStartDistRef = React.useRef<number | null>(null);
  const touchStartScaleRef = React.useRef<number>(1);
  const mouseStartRef = React.useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const hasMovedRef = React.useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset states when the lightbox is closed
  useEffect(() => {
    if (!isOpen) {
      setScale(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setIsMouseDown(false);
    }
  }, [isOpen]);

  if (!isOpen || !imageSrc) return null;

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 4));
  };
  
  const handleZoomOut = () => {
    setScale(prev => {
      const next = Math.max(prev - 0.25, 1);
      if (next === 1) {
        setOffset({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  const handleDownload = () => {
    if (!imageSrc || !isAdmin) return;
    const a = document.createElement('a');
    a.href = imageSrc;
    a.download = `secured_camera_capture_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    hasMovedRef.current = false;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        offsetX: offset.x,
        offsetY: offset.y
      };
      touchStartDistRef.current = null;
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      touchStartDistRef.current = dist;
      touchStartScaleRef.current = scale;

      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;
      touchStartRef.current = {
        x: midX,
        y: midY,
        offsetX: offset.x,
        offsetY: offset.y
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStartRef.current && touchStartDistRef.current === null) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMovedRef.current = true;
      }

      if (scale > 1) {
        const maxOffset = scale * 180;
        const newX = Math.min(Math.max(touchStartRef.current.offsetX + dx, -maxOffset), maxOffset);
        const newY = Math.min(Math.max(touchStartRef.current.offsetY + dy, -maxOffset), maxOffset);
        setOffset({ x: newX, y: newY });
      }
    } else if (e.touches.length === 2 && touchStartDistRef.current && touchStartRef.current) {
      hasMovedRef.current = true;
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);

      const multiplier = dist / touchStartDistRef.current;
      const newScale = Math.min(Math.max(touchStartScaleRef.current * multiplier, 1), 4);
      setScale(newScale);

      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;
      const dx = midX - touchStartRef.current.x;
      const dy = midY - touchStartRef.current.y;

      if (newScale > 1) {
        const maxOffset = newScale * 180;
        const newX = Math.min(Math.max(touchStartRef.current.offsetX + dx, -maxOffset), maxOffset);
        const newY = Math.min(Math.max(touchStartRef.current.offsetY + dy, -maxOffset), maxOffset);
        setOffset({ x: newX, y: newY });
      } else {
        setOffset({ x: 0, y: 0 });
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    touchStartDistRef.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    hasMovedRef.current = false;
    if (scale > 1) {
      setIsMouseDown(true);
      mouseStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: offset.x,
        offsetY: offset.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMouseDown && mouseStartRef.current && scale > 1) {
      const dx = e.clientX - mouseStartRef.current.x;
      const dy = e.clientY - mouseStartRef.current.y;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMovedRef.current = true;
      }

      const maxOffset = scale * 180;
      const newX = Math.min(Math.max(mouseStartRef.current.offsetX + dx, -maxOffset), maxOffset);
      const newY = Math.min(Math.max(mouseStartRef.current.offsetY + dy, -maxOffset), maxOffset);
      setOffset({ x: newX, y: newY });
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsMouseDown(false);
    mouseStartRef.current = null;
  };

  const handleOuterClick = () => {
    if (!hasMovedRef.current) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/98 backdrop-blur-md flex flex-col justify-between">
      {/* Wrapped in ScreenShield for absolute protection during image inspection */}
      <ScreenShield userEmail={userEmail || 'IMG-INSPECTION'} isEnabled={true} onClose={onClose}>
        
        {/* Header toolbar */}
        <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between z-50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-red-950/40 text-red-400 rounded-lg border border-red-500/20">
              <Shield className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 tracking-wide uppercase font-mono">BẢO MẬT CHI TIẾT ẢNH</span>
              <span className="text-[10px] text-slate-400 block font-mono">E2EE Decrypted • Không chụp ảnh màn hình</span>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleZoomIn} 
              className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-800 transition-colors"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button 
              onClick={handleZoomOut} 
              className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-800 transition-colors"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button 
              onClick={handleRotate} 
              className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-800 transition-colors"
              title="Xoay hình"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button 
              onClick={handleReset} 
              className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-800 transition-colors"
              title="Đặt lại"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            {isAdmin && (
              <button 
                onClick={handleDownload} 
                className="p-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 rounded-lg border border-emerald-900/35 transition-colors"
                title="Lưu ảnh về máy"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            <div className="w-px h-6 bg-slate-800 mx-1" />
            <button 
              onClick={onClose} 
              className="p-2 bg-red-950/80 hover:bg-red-900 text-red-200 rounded-lg border border-red-900/35 transition-colors"
              title="Đóng (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Display Area */}
        <div 
          onClick={handleOuterClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`flex-1 flex items-center justify-center p-6 min-h-screen select-none ${
            scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-out'
          }`}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-full max-h-[80vh] flex flex-col items-center cursor-default"
          >
            <motion.div
              style={{ scale, rotate: rotation, x: offset.x, y: offset.y }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl flex justify-center items-center select-none"
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Image itself with referrerPolicy & context protection */}
              <img 
                src={imageSrc} 
                alt="E2EE Inspect" 
                referrerPolicy="no-referrer"
                onDragStart={(e) => e.preventDefault()}
                className="max-w-[90vw] max-h-[70vh] object-contain transition-all select-none pointer-events-none"
              />
              
              {/* Overlay warning on the image */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/15 via-transparent to-slate-950/5 pointer-events-none" />
            </motion.div>

            {/* Caption Overlay */}
            {captionText && (
              <div className="mt-4 max-w-lg bg-slate-900/90 border border-slate-800 text-slate-200 text-xs px-4 py-3 rounded-xl shadow-xl text-center leading-relaxed">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-mono font-bold mb-1">CHÚ THÍCH TIN NHẮN</span>
                {captionText}
              </div>
            )}
          </div>
        </div>

        {/* Footer Warning Label */}
        <div className="absolute bottom-4 inset-x-0 text-center pointer-events-none z-50">
          <span className="inline-flex items-center space-x-1.5 bg-slate-950/90 border border-slate-800 px-3.5 py-1.5 rounded-full text-[10px] text-slate-400 font-mono tracking-wider">
            <EyeOff className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>KHÔNG CHỤP ẢNH MÀN HÌNH CHAT HOẶC MÀN HÌNH XEM ẢNH GỬI TỪ CHAT</span>
          </span>
        </div>

      </ScreenShield>
    </div>
  );
}
