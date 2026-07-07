/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Eye, EyeOff, Lock, BookOpen, WifiOff, ShieldAlert } from 'lucide-react';
import { UserSession } from '../types';
import { Point, matchPattern } from '../lib/patternMatcher';

interface BiometricOverlayProps {
  user: UserSession;
  onAuthenticate: (userId: string) => void;
  onResetKeys?: (userId: string) => void;
  defaultAuthMode?: 'pin' | 'password' | 'pattern';
  forcePasswordOnly?: boolean;
  isPinEnabled?: boolean;
  isPasswordEnabled?: boolean;
}

export default function BiometricOverlay({
  user,
  onAuthenticate,
  onResetKeys,
  defaultAuthMode,
  forcePasswordOnly,
  isPinEnabled = true,
  isPasswordEnabled = true,
}: BiometricOverlayProps) {
  // Load user profile specific options
  const userPinPref = (() => {
    const saved = localStorage.getItem(`pref_auth_pin_${user.id}`);
    return saved === null ? true : saved === 'true';
  })();

  const userPatternPref = (() => {
    const saved = localStorage.getItem(`pref_auth_pattern_${user.id}`);
    return saved === null ? true : saved === 'true';
  })();

  const pinActive = isPinEnabled !== false;
  const pwdActive = isPasswordEnabled !== false;
  
  const isPinAvail = pinActive && (!!user.pinCode || !!user.hasPinCode) && userPinPref;
  const isPatternAvail = !!user.patternLock && userPatternPref;
  const isPwdAvail = forcePasswordOnly || (!isPinAvail && !isPatternAvail);

  const [authMode, setAuthMode] = useState<'pin' | 'password' | 'pattern'>(() => {
    if (forcePasswordOnly && isPwdAvail) return 'password';
    if (defaultAuthMode === 'pin' && isPinAvail) return 'pin';
    if (defaultAuthMode === 'password' && isPwdAvail) return 'password';
    if (defaultAuthMode === 'pattern' && isPatternAvail) return 'pattern';
    
    if (isPinAvail) return 'pin';
    if (isPatternAvail) return 'pattern';
    return 'password';
  });

  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Pattern authentication states
  const [patternPoints, setPatternPoints] = useState<Point[]>([]);
  const [isPatternDrawing, setIsPatternDrawing] = useState(false);
  
  // Custom states for silent pattern visual feedback (instead of text alerts)
  // 'idle' | 'drawing' | 'success' | 'failed'
  const [patternStatus, setPatternStatus] = useState<'idle' | 'drawing' | 'success' | 'failed'>('idle');

  const showStroke = (() => {
    const saved = localStorage.getItem(`pref_show_pattern_stroke_${user.id}`);
    return saved === null ? true : saved === 'true';
  })();

  // Reset states when user, defaultAuthMode or forcePasswordOnly changes
  useEffect(() => {
    setPinInput('');
    setPinError(false);
    setPasswordInput('');
    setPasswordError(false);
    setPatternPoints([]);
    setPatternStatus('idle');

    let nextMode: 'pin' | 'password' | 'pattern' = authMode;
    if (forcePasswordOnly && isPwdAvail) {
      nextMode = 'password';
    } else {
      // Check if current mode is still available
      if (authMode === 'pin' && !isPinAvail) {
        nextMode = isPatternAvail ? 'pattern' : 'password';
      } else if (authMode === 'password' && !isPwdAvail) {
        nextMode = isPinAvail ? 'pin' : (isPatternAvail ? 'pattern' : 'password');
      } else if (authMode === 'pattern' && !isPatternAvail) {
        nextMode = isPinAvail ? 'pin' : 'password';
      }
    }
    setAuthMode(nextMode);
  }, [user.id, defaultAuthMode, forcePasswordOnly, isPinEnabled, isPasswordEnabled, user.pinCode, user.hasPinCode, user.patternLock]);

  const handlePatternPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (patternStatus === 'failed') return;
    e.preventDefault();
    setIsPatternDrawing(true);
    setPatternStatus('drawing');
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPatternPoints([{ x, y }]);
  };

  const handlePatternPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPatternDrawing || patternStatus === 'failed') return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Use functional state updater to avoid stale closure state and keep coordinates precise
    setPatternPoints(prev => {
      const lastPoint = prev[prev.length - 1];
      if (!lastPoint || Math.abs(lastPoint.x - x) > 2 || Math.abs(lastPoint.y - y) > 2) {
        return [...prev, { x, y }];
      }
      return prev;
    });
  };

  const handlePatternPointerUp = () => {
    if (!isPatternDrawing || patternStatus === 'failed') return;
    setIsPatternDrawing(false);

    if (!user.patternLock) {
      setPatternStatus('failed');
      setPatternPoints([]);
      setTimeout(() => setPatternStatus('idle'), 800);
      return;
    }

    try {
      const registeredPoints = JSON.parse(user.patternLock);
      if (!Array.isArray(registeredPoints) || registeredPoints.length < 2) {
        setPatternStatus('failed');
        setPatternPoints([]);
        setTimeout(() => setPatternStatus('idle'), 800);
        return;
      }

      // Check matching similarity score
      setPatternPoints(currentPoints => {
        const similarity = matchPattern(currentPoints, registeredPoints);
        console.log(`[Pattern Lock Verification] Similarity score: ${similarity}%`);

        if (similarity >= 70) {
          setPatternStatus('success');
          setTimeout(() => {
            onAuthenticate(user.id);
          }, 350);
        } else {
          setPatternStatus('failed');
          setTimeout(() => {
            setPatternStatus('idle');
            setPatternPoints([]);
          }, 800);
        }
        return currentPoints;
      });
    } catch (err) {
      setPatternStatus('failed');
      setPatternPoints([]);
      setTimeout(() => setPatternStatus('idle'), 800);
    }
  };

  const handlePinKeyPress = async (num: string) => {
    setPinError(false);
    if (pinInput.length < 4) {
      const nextPin = pinInput + num;
      setPinInput(nextPin);
      
      // Auto-submit if 4 digits
      if (nextPin.length === 4) {
        try {
          const res = await fetch('/api/auth/verify-credential', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, type: 'pin', value: nextPin })
          });
          const data = await res.json();
          if (data.success) {
            setTimeout(() => {
              onAuthenticate(user.id);
            }, 300);
          } else {
            setTimeout(() => {
              setPinError(true);
              setPinInput('');
            }, 200);
          }
        } catch (err) {
          console.error('Error verifying PIN:', err);
          setTimeout(() => {
            setPinError(true);
            setPinInput('');
          }, 200);
        }
      }
    }
  };

  const handlePinDelete = () => {
    setPinInput(pinInput.slice(0, -1));
  };

  const handlePinClear = () => {
    setPinInput('');
  };

  // Programmatically blur any active input element outside this overlay on mount or mode change,
  // and focus the password input if in password mode.
  useEffect(() => {
    const activeEl = document.activeElement;
    if (activeEl instanceof HTMLElement) {
      const parentOverlay = activeEl.closest(`[id^="auth-overlay-"]`);
      if (!parentOverlay || parentOverlay.id !== `auth-overlay-${user.id}`) {
        activeEl.blur();
      }
    }

    if (authMode === 'password') {
      setTimeout(() => {
        const passwordInput = document.getElementById(`password-input-${user.id}`);
        if (passwordInput) {
          (passwordInput as HTMLInputElement).focus();
        }
      }, 50);
    }
  }, [authMode, user.id]);

  // Listen to physical keyboard events for PIN entry
  useEffect(() => {
    if (authMode !== 'pin') return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')
      ) {
        // Only ignore if the active element is inside this specific auth overlay
        const parentOverlay = activeEl.closest(`[id^="auth-overlay-"]`);
        if (parentOverlay && parentOverlay.id === `auth-overlay-${user.id}`) {
          return;
        }
      }

      let digit: string | null = null;
      if (/^[0-9]$/.test(e.key)) {
        digit = e.key;
      } else if (e.code && /^Digit[0-9]$/.test(e.code)) {
        digit = e.code.charAt(5);
      } else if (e.code && /^Numpad[0-9]$/.test(e.code)) {
        digit = e.code.charAt(6);
      }

      if (digit !== null) {
        e.preventDefault();
        handlePinKeyPress(digit);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handlePinDelete();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handlePinClear();
      }
    };

    // Auto-blur any outside input/textarea when window or document gains focus
    const handleWindowFocus = () => {
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLElement) {
        const parentOverlay = activeEl.closest(`[id^="auth-overlay-"]`);
        if (!parentOverlay || parentOverlay.id !== `auth-overlay-${user.id}`) {
          activeEl.blur();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('focusin', handleWindowFocus);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('focusin', handleWindowFocus);
    };
  }, [authMode, pinInput, user.id]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(false);
    try {
      const res = await fetch('/api/auth/verify-credential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, type: 'password', value: passwordInput })
      });
      const data = await res.json();
      if (data.success) {
        setTimeout(() => {
          onAuthenticate(user.id);
        }, 300);
      } else {
        setPasswordError(true);
        setPasswordInput('');
      }
    } catch (err) {
      console.error('Error verifying password:', err);
      setPasswordError(true);
      setPasswordInput('');
    }
  };

  return (
    <div id={`auth-overlay-${user.id}`} className="absolute inset-0 bg-slate-50/98 flex flex-col items-center justify-between p-6 z-50 rounded-2xl overflow-hidden border border-slate-200">
      {/* Top Security Status */}
      {authMode !== 'pattern' && (
        <div className="w-full flex flex-col items-center text-center mt-6">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5 text-[#c8102e]" />
          </div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight font-sans uppercase">
            Xác minh Tác giả / CTV
          </h2>
          <p className="text-[11px] text-slate-500 mt-1 font-sans">
            Mở khóa phân mục bình luận của <span className="text-[#004882] font-bold">{user.name}</span>
          </p>
        </div>
      )}

      {/* Center Auth Console */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xs my-4">
        <AnimatePresence mode="wait">
          {authMode === 'pin' ? (
            <motion.div
              key="pin-auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col items-center"
            >
              {/* Pin Display Dots */}
              <div className="flex justify-center space-x-4 mb-6">
                {[0, 1, 2, 3].map((index) => (
                  <motion.div
                    key={index}
                    animate={
                      pinError
                        ? { x: [-10, 10, -10, 10, 0] }
                        : pinInput.length > index
                        ? { scale: [1, 1.3, 1] }
                        : {}
                    }
                    transition={pinError ? { duration: 0.4 } : { duration: 0.2 }}
                    className={`w-4 h-4 rounded-full border ${
                      pinError
                        ? 'border-red-500 bg-red-100'
                        : pinInput.length > index
                        ? 'bg-[#004882] border-[#004882] shadow-sm'
                        : 'border-slate-300 bg-slate-100'
                    }`}
                  />
                ))}
              </div>

              <div className="text-center h-4 mb-4">
                {pinError && <p className="text-[10px] text-red-600 font-sans font-semibold">Mã PIN nghiệp vụ không chính xác.</p>}
                {!pinError && (
                  <p className="text-[10px] text-slate-400 font-sans">Nhập 4 chữ số mã PIN nghiệp vụ.</p>
                )}
              </div>

              {/* Secure PIN Pad */}
              <div className="grid grid-cols-3 gap-2.5 w-full max-w-[220px]">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlePinKeyPress(num)}
                    id={`pin-btn-${user.id}-${num}`}
                    className="w-12 h-12 rounded-xl bg-white border border-slate-250 flex items-center justify-center text-sm font-bold text-slate-700 active:bg-red-50 active:border-[#c8102e] active:text-[#c8102e] shadow-sm transition-all font-mono"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handlePinClear}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-[10px] font-semibold text-slate-500 hover:text-slate-800"
                >
                  Xóa
                </button>
                <button
                  type="button"
                  onClick={() => handlePinKeyPress('0')}
                  id={`pin-btn-${user.id}-0`}
                  className="w-12 h-12 rounded-xl bg-white border border-slate-250 flex items-center justify-center text-sm font-bold text-slate-700 active:bg-red-50 active:border-[#c8102e] active:text-[#c8102e] shadow-sm transition-all font-mono"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handlePinDelete}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-[10px] font-semibold text-slate-500 hover:text-slate-800"
                >
                  Lùi
                </button>
              </div>
            </motion.div>
          ) : authMode === 'password' ? (
            <motion.form
              key="password-auth"
              onSubmit={handlePasswordSubmit}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col items-center max-w-[220px]"
              autoComplete="off"
            >
              <div className="relative w-full mb-3">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordError(false);
                    setPasswordInput(e.target.value);
                  }}
                  placeholder="Nhập mật khẩu..."
                  className={`w-full bg-white border ${passwordError ? 'border-red-500' : 'border-slate-300'} rounded-xl px-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#c8102e] text-center pr-10 font-sans shadow-sm`}
                  id={`password-input-${user.id}`}
                  autoComplete="new-password"
                  name="secure-device-password-field"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="text-center h-4 mb-4">
                {passwordError && <p className="text-[10px] text-red-600 font-sans font-semibold">Mật khẩu nghiệp vụ chưa chính xác.</p>}
                {!passwordError && (
                  <p className="text-[9px] text-slate-400 font-sans">
                    Nhập mật khẩu nghiệp vụ của bạn.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-[#c8102e] hover:bg-red-800 text-white font-bold rounded-xl py-2 text-xs font-sans transition-all shadow-sm"
                id={`password-submit-${user.id}`}
              >
                Xác thực Tác giả
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="pattern-auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 top-0 bottom-[145px] bg-white flex flex-col z-20"
            >
              {/* Dân Trí Camouflage Header */}
              <div className="bg-[#00483d] text-white py-3 px-4 flex items-center justify-between border-b border-slate-100 shrink-0 select-none">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold tracking-widest text-sm font-sans">DÂN TRÍ</span>
                  <span className="text-[7px] bg-red-600 text-white font-mono font-bold px-1 py-0.5 rounded uppercase">Nóng 24h</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] opacity-90 font-sans font-medium">
                  <span>Ý kiến Bạn đọc</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>

              {/* Spacious drawing canvas container reacting with background transitions */}
              <div 
                className={`flex-1 relative select-none transition-colors duration-300 flex flex-col items-center justify-center p-6 ${
                  patternStatus === 'drawing' ? 'bg-sky-50/70' : 
                  patternStatus === 'failed' ? 'bg-rose-50/90' : 
                  patternStatus === 'success' ? 'bg-emerald-50/80' : 
                  'bg-slate-50'
                }`}
              >
                {/* Genuine Camouflage Reader Feedback Stream (No security-related sensitive keywords) */}
                <div className="text-left space-y-3 pointer-events-none select-none max-w-[280px] w-full px-2">
                  <div className="border-b border-slate-200 pb-1.5">
                    <p className="text-[10px] font-extrabold text-[#00483d] uppercase font-sans tracking-wide">
                      Ý kiến bạn đọc nổi bật (03)
                    </p>
                    <p className="text-[8px] text-slate-400 font-sans mt-0.5">
                      Đã đồng bộ tự động từ máy chủ
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="space-y-0.5 bg-slate-100/40 p-2 rounded-lg border border-slate-200/30">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-700">Độc giả Quốc Anh (Hà Nội)</span>
                        <span className="text-[8px] text-slate-400">10 phút trước</span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-sans leading-normal">
                        "Ủng hộ tác giả bám sát đề tài thực tế. Bài viết phản ánh rất sinh động về tiến độ số hóa hiện nay."
                      </p>
                    </div>

                    <div className="space-y-0.5 bg-slate-100/40 p-2 rounded-lg border border-slate-200/30">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-700">Độc giả Minh Tuấn (TP.HCM)</span>
                        <span className="text-[8px] text-slate-400">24 phút trước</span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-sans leading-normal">
                        "Mục ý kiến này rất hay, giúp ban biên tập nắm bắt phản hồi trực tiếp từ bạn đọc một cách nhanh chóng nhất."
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 text-center border-t border-slate-150">
                    <p className="text-[9px] text-slate-400 font-sans leading-normal">
                      Vuốt nhẹ màn hình tại đây để lướt xem các đóng góp ý kiến khác hoặc cuộn xem các bài viết liên quan.
                    </p>
                  </div>

                  {/* Totally camouflaged status indicator that looks like a refresh loader */}
                  <div className="pt-1 flex justify-center">
                    <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-sans border ${
                      patternStatus === 'drawing' ? 'bg-sky-50 border-sky-150 text-sky-700 animate-pulse' :
                      patternStatus === 'failed' ? 'bg-slate-100 border-slate-200 text-slate-500' :
                      patternStatus === 'success' ? 'bg-emerald-50 border-emerald-150 text-emerald-700 animate-pulse' :
                      'bg-slate-50 border-slate-150 text-slate-400'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${
                        patternStatus === 'drawing' ? 'bg-sky-500 animate-ping' :
                        patternStatus === 'failed' ? 'bg-slate-400' :
                        patternStatus === 'success' ? 'bg-emerald-500 animate-ping' :
                        'bg-slate-300'
                      }`} />
                      {patternStatus === 'drawing' && "Đang tải dữ liệu..."}
                      {patternStatus === 'failed' && "Đã cuộn cuối danh sách"}
                      {patternStatus === 'success' && "Đang tải bài viết..."}
                      {patternStatus === 'idle' && "Cập nhật bình luận tự động"}
                    </span>
                  </div>
                </div>

                {/* Secret Invisible Drawing Event Layer */}
                <div
                  onPointerDown={handlePatternPointerDown}
                  onPointerMove={handlePatternPointerMove}
                  onPointerUp={handlePatternPointerUp}
                  className="absolute inset-0 z-30 touch-none select-none cursor-crosshair bg-transparent"
                />

                {/* Draw stroke path overlay if showStroke and points exist */}
                {showStroke && patternPoints.length > 0 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-50 opacity-90">
                    <polyline
                      points={patternPoints.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>

              {/* Minimalist camouflage footer */}
              <div className="h-6 bg-slate-100 border-t border-slate-200 px-3 flex items-center justify-center shrink-0 z-10 select-none">
                <span className="text-[8px] text-slate-400 font-sans uppercase tracking-widest">Dan Tri Media Inc © 2026</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Mode Toggle & Fallbacks */}
      <div className="w-full flex flex-col items-center space-y-4 mb-4 z-30 relative">
        {forcePasswordOnly ? (
          <div className="w-full max-w-xs bg-red-50 border border-red-200 text-red-800 text-[10px] rounded-xl p-3 leading-relaxed font-sans text-center shadow-sm animate-fade-in">
            <span className="font-bold flex items-center justify-center mb-1 text-red-900 uppercase tracking-tight text-[9px]">
              <Lock className="w-3.5 h-3.5 mr-1 shrink-0 text-[#c8102e]" />
              Thiết bị đã khóa cứng an toàn
            </span>
            Ứng dụng phát hiện tab đã bị ẩn/mất tiêu điểm (off-screen). Buộc phải dùng <strong>mật khẩu đăng nhập</strong> của {user.name} để truy cập lại.
          </div>
        ) : (
          ((isPinAvail ? 1 : 0) + (isPwdAvail ? 1 : 0) + (isPatternAvail ? 1 : 0)) > 1 && (
            <div className="flex bg-slate-100 border border-slate-200 rounded-full p-1 w-full max-w-sm justify-between shadow-inner">
              {isPinAvail && (
                <button
                  onClick={() => setAuthMode('pin')}
                  id={`switch-to-pin-btn-${user.id}`}
                  className={`flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-full text-[10px] font-sans transition-all font-semibold ${
                    authMode === 'pin'
                      ? 'bg-white text-[#c8102e] border border-slate-200 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Mã PIN</span>
                </button>
              )}
              {isPwdAvail && (
                <button
                  onClick={() => setAuthMode('password')}
                  id={`switch-to-pwd-btn-${user.id}`}
                  className={`flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-full text-[10px] font-sans transition-all font-semibold ${
                    authMode === 'password'
                      ? 'bg-white text-[#c8102e] border border-slate-200 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Mật khẩu</span>
                </button>
              )}
              {isPatternAvail && (
                <button
                  onClick={() => setAuthMode('pattern')}
                  id={`switch-to-pattern-btn-${user.id}`}
                  className={`flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-full text-[10px] font-sans transition-all font-semibold ${
                    authMode === 'pattern'
                      ? 'bg-white text-[#00483d] border border-slate-200 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Vẽ hình</span>
                </button>
              )}
            </div>
          )
        )}

        {/* Informative Security Badge */}
        <div className="text-center w-full max-w-xs px-2">
          <p className="text-[10px] text-slate-500 font-sans max-w-xs leading-relaxed flex items-center justify-center space-x-1">
            <ShieldAlert className="w-3 h-3 text-[#c8102e] shrink-0" />
            <span>Dữ liệu xác thực được mã hóa RSA-2048 đầu cuối an toàn.</span>
          </p>

          {onResetKeys && (
            <button
              onClick={() => onResetKeys(user.id)}
              className="text-[9px] text-[#004882]/80 hover:text-[#004882] underline mt-2 block mx-auto font-sans font-semibold"
            >
              Cấp lại mã khóa RSA-2048 cho thiết bị này
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
