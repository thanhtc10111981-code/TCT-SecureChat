import React from 'react';
import { FileText, Download } from 'lucide-react';
import { linkify } from '../utils/linkify';

interface FileAttachmentCardProps {
  fileId: string;
  fileName: string;
  text?: string;
  quoteBlock?: React.ReactNode;
  isSelectionModeActive?: boolean;
}

export default function FileAttachmentCard({ fileId, fileName, text, quoteBlock, isSelectionModeActive = false }: FileAttachmentCardProps) {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const wasSelectionActiveRef = React.useRef(false);
  const lastActiveTimeRef = React.useRef(0);

  React.useEffect(() => {
    if (isSelectionModeActive) {
      wasSelectionActiveRef.current = true;
      lastActiveTimeRef.current = Date.now();
    } else {
      if (wasSelectionActiveRef.current) {
        lastActiveTimeRef.current = Date.now();
        wasSelectionActiveRef.current = false;
      }
    }
  }, [isSelectionModeActive]);

  const shouldBlockClick = isSelectionModeActive || (Date.now() - lastActiveTimeRef.current < 500);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (shouldBlockClick) return;
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const res = await fetch(`/api/gdrive/download/${fileId}`);
      if (!res.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi khi tải file:', err);
      alert('Không thể tải tệp tin. Vui lòng kiểm tra lại kết nối hoặc cấu hình lưu trữ file.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-2 py-1 max-w-[280px]">
      {quoteBlock}
      <div 
        onClick={handleDownload} 
        className={`flex items-center gap-3 bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl transition-colors ${
          isSelectionModeActive ? 'pointer-events-none' : 'cursor-pointer hover:bg-slate-100/80'
        }`}
      >
        <div className="h-10 w-10 flex items-center justify-center bg-slate-200/50 rounded-lg shrink-0">
          <FileText className="w-5 h-5 text-[#008075]" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold text-slate-800 truncate" title={fileName}>
            {fileName}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">Tệp mã hóa bảo mật</p>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading || isSelectionModeActive}
          className={`h-8 w-8 flex items-center justify-center bg-[#008075] hover:bg-[#00665e] disabled:bg-slate-300 text-white rounded-lg transition-colors shadow-sm shrink-0 ${
            isSelectionModeActive ? 'pointer-events-none' : 'cursor-pointer'
          }`}
          title="Tải tệp về máy"
        >
          {isDownloading ? (
            <span className="text-[9px] font-bold animate-pulse">...</span>
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>
      </div>
      {text && text !== fileName && (
        <p className="whitespace-pre-wrap break-words font-sans text-xs text-slate-750 mt-1">{linkify(text)}</p>
      )}
    </div>
  );
}
