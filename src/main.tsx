import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Toàn cục bắt lỗi runtime để hiển thị nếu bị màn hình trắng
window.addEventListener('error', (event) => {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="background: #1e1e2e; color: #f38ba8; padding: 24px; font-family: monospace; border: 2px solid #f38ba8; margin: 20px; border-radius: 8px;">
        <h3 style="margin-top: 0;">⚠️ Lỗi Runtime: ${event.message}</h3>
        <p><b>File:</b> ${event.filename}:${event.lineno}:${event.colno}</p>
        <pre style="background: #11111b; padding: 12px; border-radius: 4px; overflow: auto; max-height: 200px;">${event.error?.stack || 'No stack trace available'}</pre>
        <p style="color: #a6adc8; font-size: 12px; margin-bottom: 0;">Trình duyệt hoặc môi trường iframe chặn tài nguyên hoặc gặp lỗi nhập môn mã hóa.</p>
      </div>
    `;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="background: #1e1e2e; color: #f38ba8; padding: 24px; font-family: monospace; border: 2px solid #f38ba8; margin: 20px; border-radius: 8px;">
        <h3 style="margin-top: 0;">⚠️ Lỗi Bất Đồng Bộ (Promise): ${event.reason?.message || event.reason}</h3>
        <pre style="background: #11111b; padding: 12px; border-radius: 4px; overflow: auto; max-height: 200px;">${event.reason?.stack || 'No stack trace available'}</pre>
      </div>
    `;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

