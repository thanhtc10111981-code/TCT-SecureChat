import React, { useState, useEffect } from 'react';
import { Shield, EyeOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScreenShieldProps {
  children: React.ReactNode;
  userEmail?: string;
  isEnabled?: boolean;
  onClose?: () => void;
}

export default function ScreenShield({ children, userEmail = 'SECURE CHAT', isEnabled = true, onClose }: ScreenShieldProps) {
  const [isProtected, setIsProtected] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!isEnabled) return;

    // Detect when the window loses focus (such as when taking a screenshot with snipping tool, switching windows, etc.)
    const handleBlur = () => {
      setIsProtected(true);
    };

    const handleFocus = () => {
      // Small timeout to allow returning cleanly
      setTimeout(() => {
        setIsProtected(false);
      }, 300);
    };

    // Detect common keyboard shortcuts for screenshot, inspection, and print
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
        return;
      }

      // 1. Intercept Print Screen key (PrtScn)
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        setIsProtected(true);
        setShowWarning(true);
        // Clear clipboard immediately if possible
        navigator.clipboard?.writeText('⚠️ Bảo mật cao: Không được phép sao chép nội dung chat!');
      }

      // 2. Intercept Ctrl+P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowWarning(true);
      }

      // 3. Intercept Ctrl+Shift+S (Snipping shortcuts on some environments)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        setIsProtected(true);
        setShowWarning(true);
      }
    };

    // Listen to visibilitychange
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsProtected(true);
      } else {
        setTimeout(() => {
          setIsProtected(false);
        }, 300);
      }
    };

    // Prevent copying, cutting and right-clicking globally
    const handleCopyCut = (e: ClipboardEvent) => {
      e.preventDefault();
      setShowWarning(true);
      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', '⚠️ Bảo mật cao: Không được phép sao chép nội dung chat!');
      }
    };

    const handleContextMenuGlobal = (e: MouseEvent) => {
      e.preventDefault();
      setShowWarning(true);
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopyCut);
    document.addEventListener('cut', handleCopyCut);
    document.addEventListener('contextmenu', handleContextMenuGlobal);

    // Prevent drag and drop of media assets
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopyCut);
      document.removeEventListener('cut', handleCopyCut);
      document.removeEventListener('contextmenu', handleContextMenuGlobal);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, [isEnabled]);

  // Clear warning after 4 seconds
  useEffect(() => {
    if (showWarning) {
      const t = setTimeout(() => setShowWarning(false), 4000);
      return () => clearTimeout(t);
    }
  }, [showWarning]);

  // CSS class to disable text selection and context menus
  const shieldClasses = isEnabled
    ? 'select-none pointer-events-auto [content-visibility:auto]'
    : '';

  return (
    <div 
      className={`relative w-full h-full ${shieldClasses}`}
      onContextMenu={(e) => {
        if (isEnabled) {
          e.preventDefault();
          setShowWarning(true);
        }
      }}
    >
      {/* Dynamic Print stylesheets to block screenshots during printing */}
      {isEnabled && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { display: none !important; }
            html { display: none !important; }
          }
        `}} />
      )}

      {/* Main App Content */}
      <div className={`transition-all duration-300 ${isProtected ? 'blur-[40px] saturate-50 pointer-events-none scale-[0.98]' : ''}`}>
        {children}
      </div>

      {/* Repeating Anti-Photography Watermark Overlay */}
      {isEnabled && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03] select-none z-40 grid grid-cols-4 grid-rows-6 gap-8 p-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div 
              key={i} 
              className="text-[9px] font-mono text-slate-400 font-bold tracking-widest whitespace-nowrap -rotate-12 transform select-none"
            >
              🔐 SECURE SCREEN • {userEmail.toUpperCase()} • {new Date().toLocaleDateString()}
            </div>
          ))}
        </div>
      )}

      {/* Focus Loss Protection Screen */}
      <AnimatePresence>
        {isProtected && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              window.focus();
              setIsProtected(false);
            }}
            className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center text-center p-6 z-50 select-none cursor-pointer"
            title="Nhấp để quay lại trò chuyện"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm flex flex-col items-center shadow-2xl cursor-default"
            >
              <div className="p-4 bg-red-950/30 text-red-400 rounded-full border border-red-500/20 mb-4 animate-pulse">
                <EyeOff className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">LÁ CHẮN BẢO MẬT KÍCH HOẠT</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Nội dung trò chuyện được mã hóa đầu cuối (E2EE) và bảo vệ nghiêm ngặt. Để tiếp tục cuộc hội thoại, vui lòng nhấp vào đây hoặc nhấp lại vào cửa sổ ứng dụng này.
              </p>
              <div className="mt-4 flex items-center space-x-1.5 text-[10px] text-emerald-400 font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                <Shield className="w-3.5 h-3.5" />
                <span>ANTI-SCREENSHOT ACTIVE</span>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="mt-5 w-full py-2 bg-red-950/40 hover:bg-red-900/60 text-red-200 hover:text-red-100 border border-red-500/30 rounded-xl font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Đóng ảnh bảo mật & Quay lại
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating alert notification when user attempts screenshots or right clicks */}
      <AnimatePresence>
        {showWarning && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 12 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-950/95 border border-red-500/35 text-red-200 text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 z-50 font-sans backdrop-blur select-none"
          >
            <Shield className="w-4 h-4 text-red-400 animate-bounce shrink-0" />
            <div className="text-left">
              <span className="font-bold block text-red-300">CẢNH BÁO BẢO MẬT!</span>
              <span className="text-[10px] text-red-400/90 leading-tight">Mọi hành vi chụp ảnh màn hình, lưu ảnh hoặc sao chép văn bản đều bị chặn nhằm duy trì tính ẩn danh tuyệt đối.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
