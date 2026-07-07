import React from 'react';
import { HelpCircle, Copy, Check, ExternalLink, ChevronDown, ChevronUp, AlertCircle, ShieldAlert } from 'lucide-react';

export default function GDriveGuide() {
  const [isOpen, setIsOpen] = React.useState(true); // Open by default so they see it immediately
  const [copiedText, setCopiedText] = React.useState<string | null>(null);

  const originUrl = window.location.origin;
  const currentRedirectUrl = `${originUrl}/api/admin/gdrive/callback`;

  // Dynamically generate both DEV and PRE/Preview URLs to help user configure both
  let devRedirectUrl = currentRedirectUrl;
  let preRedirectUrl = currentRedirectUrl;

  if (originUrl.includes('-dev-')) {
    preRedirectUrl = currentRedirectUrl.replace('-dev-', '-pre-');
  } else if (originUrl.includes('-pre-')) {
    devRedirectUrl = currentRedirectUrl.replace('-pre-', '-dev-');
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleCopyFullGuide = () => {
    const fullText = `HƯỚNG DẪN KHẮC PHỤC LỖI KHÔNG ĐĂNG NHẬP ĐƯỢC (ERROR 403 / GOOGLE VERIFICATION)

Để sửa lỗi "Error 403: access_denied / Has not completed the Google verification process", bạn có 2 cách thực hiện cực kỳ đơn giản sau:

CÁCH 1: CHUYỂN ỨNG DỤNG SANG TRẠNG THÁI PUBLIC (KHUYÊN DÙNG)
1. Truy cập vào Google Cloud Console: https://console.cloud.google.com/
2. Vào menu góc trái > APIs & Services > OAuth consent screen.
3. Nhìn xuống mục "Publishing status" (Trạng thái xuất bản).
4. Bấm vào nút "PUBLISH APP" (Xuất bản ứng dụng) và xác nhận. Khi trạng thái chuyển sang "In production" (Đang hoạt động), mọi tài khoản Gmail của bạn đều có thể liên kết tự do mà không bị chặn bởi lỗi 403.

CÁCH 2: THÊM EMAIL VÀO DANH SÁCH NGƯỜI DÙNG THỬ NGHIỆM (TEST USERS)
Nếu bạn muốn giữ ứng dụng ở chế độ thử nghiệm (Testing):
1. Tại màn hình OAuth consent screen, cuộn xuống phần "Test users" (Người dùng thử nghiệm).
2. Bấm nút "+ ADD USERS" (Thêm người dùng).
3. Dán chính xác các email của bạn vào (ví dụ: thanhtc.gmobile@gmail.com và thanhtc10111981@gmail.com).
4. Bấm "SAVE" (Lưu) lại.`;

    copyToClipboard(fullText, 'full');
  };

  return (
    <div className="bg-[#f0faf9] border border-emerald-200/50 rounded-xl p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#008075] hover:text-[#00665e] transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>HƯỚNG DẪN KHẮC PHỤC LỖI GOOGLE VERIFICATION (403 ACCESS DENIED)</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
        </button>

        <button
          type="button"
          onClick={handleCopyFullGuide}
          className="px-2 py-1 bg-white border border-emerald-200 hover:bg-emerald-50 text-[10px] font-semibold text-[#008075] rounded-md transition-all flex items-center gap-1 cursor-pointer"
        >
          {copiedText === 'full' ? (
            <>
              <Check className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span>Đã copy hướng dẫn!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy HD khắc phục lỗi 403</span>
            </>
          )}
        </button>
      </div>

      {/* 403 Error Solution Highlight */}
      <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex gap-2.5 text-rose-950">
        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed space-y-2 flex-1">
          <strong className="text-rose-800 block font-bold text-xs">CÁCH KHẮC PHỤC LỖI GOOGLE VERIFICATION (ERROR 403: ACCESS_DENIED):</strong>
          <p>
            Do dự án Google Cloud của bạn mặc định đang ở trạng thái <span className="font-semibold text-rose-700">Testing</span> (Thử nghiệm), Google chỉ cho phép các email được chỉ định mới có quyền đăng nhập. Hãy chọn 1 trong 2 cách đơn giản sau để giải quyết:
          </p>
          
          <div className="space-y-2">
            <div className="bg-emerald-50/80 border border-emerald-150 p-2.5 rounded-md">
              <span className="font-bold text-emerald-800 text-[11px] block mb-1">Cách 1: Xuất bản Ứng dụng (Khuyên Dùng & Triệt Để Nhất 🌟)</span>
              <p className="text-slate-700 text-[10px] mb-1.5">Cách này giúp mọi Gmail của bạn đều có thể liên kết tự do mà không cần thêm từng email thủ công.</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[10px] pl-1 font-medium">
                <li>Truy cập <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener noreferrer" className="text-[#008075] hover:underline inline-flex items-center gap-0.5 font-bold">Màn hình đồng ý OAuth <ExternalLink className="w-2.5 h-2.5" /></a>.</li>
                <li>Tìm mục <strong className="text-slate-800">Publishing status (Trạng thái xuất bản)</strong> ở ngay phía trên.</li>
                <li>Bấm nút <strong className="text-emerald-700 font-bold">"PUBLISH APP" (Xuất bản ứng dụng)</strong> và bấm xác nhận để đưa ứng dụng sang trạng thái hoạt động (In Production).</li>
              </ol>
            </div>

            <div className="bg-white/80 border border-rose-100 p-2.5 rounded-md">
              <span className="font-bold text-rose-800 text-[11px] block mb-1">Cách 2: Thêm Email vào danh sách Test Users (Nếu muốn giữ Thử nghiệm)</span>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[10px] pl-1 font-medium">
                <li>Vẫn tại màn hình đồng ý OAuth, cuộn xuống dưới cùng tìm mục <strong className="text-rose-800">"Test users" (Người dùng thử nghiệm)</strong>.</li>
                <li>Bấm nút <strong className="text-emerald-700 font-bold">+ ADD USERS</strong>.</li>
                <li>Nhập chính xác các tài khoản email của bạn (ví dụ: <code className="bg-amber-100 px-1 rounded text-rose-700">thanhtc.gmobile@gmail.com</code> và <code className="bg-amber-100 px-1 rounded text-rose-700 font-mono">thanhtc10111981@gmail.com</code>) rồi nhấn <strong className="text-slate-800">SAVE</strong>.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200/50 rounded-lg p-2.5 flex gap-2 text-amber-950">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-[10px] leading-relaxed">
          <strong className="text-amber-800 block mb-0.5 font-bold">Lưu ý về Callback URL (Nếu gặp lỗi Redirect URI Mismatch):</strong>
          Hãy chắc chắn rằng bạn đã thêm <strong>CẢ HAI</strong> đường link callback ở phần bên dưới vào cấu hình Client ID của bạn để tránh lỗi mismatch khi chuyển đổi giữa môi trường Phát triển và Xem trước.
        </div>
      </div>

      {isOpen && (
        <div className="text-[11px] text-slate-700 space-y-3.5 pt-2 border-t border-emerald-100/50">
          <div className="space-y-3">
            <span className="font-bold text-slate-800 block">Dán 2 địa chỉ Callback này vào mục "Authorized redirect URIs" trên Google Console:</span>
            
            {/* DEV Redirect */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">1. Callback môi trường DEV (Phát triển)</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={devRedirectUrl}
                  className="flex-1 bg-slate-100 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(devRedirectUrl, 'dev')}
                  className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-slate-600 rounded transition-all flex items-center gap-1 cursor-pointer"
                >
                  {copiedText === 'dev' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText === 'dev' ? 'Đã copy' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* PRE/Preview Redirect */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">2. Callback môi trường PREVIEW (Xem trước/Chia sẻ)</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={preRedirectUrl}
                  className="flex-1 bg-slate-100 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(preRedirectUrl, 'pre')}
                  className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-slate-600 rounded transition-all flex items-center gap-1 cursor-pointer"
                >
                  {copiedText === 'pre' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText === 'pre' ? 'Đã copy' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-1.5 border-t border-dashed border-emerald-100">
            <span className="font-bold text-slate-800 block">Các bước bổ sung để kiểm tra nếu lỗi vẫn tiếp diễn:</span>
            <ul className="list-disc list-inside text-slate-600 space-y-1 leading-relaxed pl-1">
              <li>Đảm bảo đã điền đúng <strong className="text-slate-700">Client ID</strong> và <strong className="text-slate-700">Client Secret</strong> vào các ô nhập phía dưới.</li>
              <li>Khi cửa sổ đăng nhập Google hiện lên, hãy chọn tài khoản Gmail đã thêm ở bước <strong className="text-rose-700 font-bold">Test users</strong> ở trên.</li>
              <li>Nếu Google hiển thị cảnh báo ứng dụng chưa được xác minh, bấm vào chữ <strong className="text-slate-800">Advanced (Nâng cao)</strong> ở góc dưới bên trái, sau đó bấm <strong className="text-red-600 underline">Go to securechat... (unsafe)</strong> để tiếp tục cấp quyền.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
