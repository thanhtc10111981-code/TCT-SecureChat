import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Share, PlusSquare, ArrowUp, X, Sparkles, Smartphone, ShieldCheck, Zap } from 'lucide-react';

interface PWAInstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  pwaOS: 'android-pc' | 'ios' | 'other';
  onInstall: () => void;
}

export default function PWAInstallPromptModal({
  isOpen,
  onClose,
  pwaOS,
  onInstall
}: PWAInstallPromptModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
        {/* Background Click to Close (saves dismissal so it doesn't prompt again) */}
        <div className="absolute inset-0" onClick={() => {
          localStorage.setItem('pwa_prompt_dismissed_permanently', 'true');
          onClose();
        }} />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md my-auto max-h-[82dvh] overflow-y-auto bg-white border border-slate-100 rounded-2xl shadow-2xl z-10 flex flex-col"
        >
          {/* Header Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#008075] via-[#004882] to-[#008075]" />

          {/* Close button */}
          <button
            onClick={() => {
              localStorage.setItem('pwa_prompt_dismissed_permanently', 'true');
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors z-20"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 pb-8">
            {/* Title / Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 text-[#008075]">
                <Download className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-[#008075] uppercase tracking-wider">Cài đặt ứng dụng</span>
                <h3 className="text-lg font-serif font-bold text-slate-900 leading-tight">Nâng Cấp Trải Nghiệm PWA</h3>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <span className="block text-[10px] font-bold text-slate-700">Tốc Độ Siêu Tốc</span>
                <span className="block text-[9px] text-slate-400">Tải ngay lập tức</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <span className="block text-[10px] font-bold text-slate-700">Full-Screen</span>
                <span className="block text-[9px] text-slate-400">Chống chụp màn hình</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <Sparkles className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                <span className="block text-[10px] font-bold text-slate-700">Đẩy Tức Thời</span>
                <span className="block text-[9px] text-slate-400">Không bỏ lỡ tin tức</span>
              </div>
            </div>

            {/* Platform Specific content */}
            {pwaOS === 'ios' ? (
              /* iOS / Safari Guide */
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    Do chính sách bảo mật của Apple, trình duyệt Safari không cho phép cài đặt tự động bằng một nút bấm. Hãy thực hiện theo hướng dẫn nhanh dưới đây:
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold mt-0.5">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800">
                        Nhấn nút "Chia sẻ" (Share) trên thanh công cụ Safari
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                        Biểu tượng có dạng: 
                        <span className="inline-flex p-1 bg-slate-100 rounded text-slate-600">
                          <Share className="w-3.5 h-3.5" />
                        </span>
                        (Thường nằm dưới cùng của màn hình iPhone)
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold mt-0.5">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800">
                        Cuộn xuống và chọn "Thêm vào MH chính" (Add to Home Screen)
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                        Biểu tượng có dạng:
                        <span className="inline-flex p-1 bg-slate-100 rounded text-slate-600">
                          <PlusSquare className="w-3.5 h-3.5" />
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold mt-0.5">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800">
                        Nhấn "Thêm" (Add) ở góc trên bên phải để hoàn tất
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Ứng dụng sẽ xuất hiện trên màn hình chính như một ứng dụng độc lập tuyệt đẹp!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Animated Pointer indicator pointing to the bottom for mobile Safari */}
                <div className="hidden sm:block text-center pt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 animate-pulse">
                    Mẹo: Chạy mượt mà, độc lập hoàn toàn khỏi thanh điều hướng Safari!
                  </span>
                </div>
              </div>
            ) : (
              /* Android & PC Automatic Setup Prompt */
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bằng cách lưu ứng dụng này trực tiếp về màn hình chính của bạn, bạn sẽ có thể chạy ứng dụng ở chế độ cửa sổ chuyên dụng, tự động kết nối và nhận thông báo đẩy nhanh gấp 5 lần, đồng thời tối ưu hóa khả năng chống trích xuất dữ liệu.
                </p>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-800">Thông tin gói cài đặt:</span>
                  </div>
                  <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside">
                    <li>Kích thước: cực nhẹ (&lt; 1MB)</li>
                    <li>Tương thích: Google Chrome, Microsoft Edge, Brave, v.v.</li>
                    <li>Khả năng: Offline, chạy nền nhận thông báo tức thời</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2">
              {pwaOS === 'ios' ? (
                <button
                  onClick={() => {
                    localStorage.setItem('pwa_prompt_dismissed_permanently', 'true');
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 bg-[#008075] hover:bg-[#006e65] text-white text-xs font-bold rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-1.5"
                >
                  Tôi đã hiểu, để tôi thêm
                </button>
              ) : (
                <button
                  onClick={onInstall}
                  className="w-full py-2.5 px-4 bg-[#008075] hover:bg-[#006e65] text-white text-xs font-bold rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-1.5 hover:shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Cài đặt Ngay (Tự động)
                </button>
              )}
              
              <button
                onClick={() => {
                  localStorage.setItem('pwa_prompt_dismissed_permanently', 'true');
                  onClose();
                }}
                className="w-full py-2 px-4 bg-transparent hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-xs font-medium rounded-xl transition-all text-center"
              >
                Để sau
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
