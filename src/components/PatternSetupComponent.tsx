import React, { useState, useRef, useEffect } from 'react';
import { Lock, Unlock, RefreshCw, Trash2, PenTool, Check, Info } from 'lucide-react';
import { Point, matchPattern } from '../lib/patternMatcher';

interface PatternSetupComponentProps {
  patternLock: string | null;
  onChangePattern: (pattern: string | null) => void;
  label?: string;
  userId?: string;
}

export default function PatternSetupComponent({
  patternLock,
  onChangePattern,
  label = "Mẫu hình bảo mật (Vẽ hình)",
  userId
}: PatternSetupComponentProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Testing pattern states
  const [isTestingMode, setIsTestingMode] = useState(false);
  const [testPoints, setTestPoints] = useState<Point[]>([]);
  const [isTestDrawing, setIsTestDrawing] = useState(false);
  const [testScore, setTestScore] = useState<number | null>(null);
  const [testMatchStatus, setTestMatchStatus] = useState<'success' | 'failed' | null>(null);
  const testCanvasRef = useRef<HTMLDivElement>(null);

  // Read showStroke preference from localStorage based on userId
  const [showStroke, setShowStroke] = useState<boolean>(() => {
    if (!userId) return false;
    const saved = localStorage.getItem(`pref_show_pattern_stroke_${userId}`);
    return saved === null ? false : saved === 'true';
  });

  const handleToggleStroke = (checked: boolean) => {
    setShowStroke(checked);
    if (userId) {
      localStorage.setItem(`pref_show_pattern_stroke_${userId}`, String(checked));
    }
  };

  // Parse registered pattern to see if one exists
  const hasRegistered = !!patternLock && patternLock.startsWith('[');

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isRecordingMode) return;
    e.preventDefault();
    setIsDrawing(true);
    
    if (canvasRef.current) {
      canvasRef.current.setPointerCapture(e.pointerId);
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setPoints([{ x, y }]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || !isRecordingMode) return;
    e.preventDefault();
    
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Use functional state updater to avoid stale state issues and optimize points sequence
      setPoints(prev => {
        const lastPoint = prev[prev.length - 1];
        if (!lastPoint || Math.abs(lastPoint.x - x) > 2 || Math.abs(lastPoint.y - y) > 2) {
          return [...prev, { x, y }];
        }
        return prev;
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || !isRecordingMode) return;
    e.preventDefault();
    setIsDrawing(false);
    if (canvasRef.current) {
      canvasRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const handleSave = () => {
    if (points.length < 5) {
      alert("Mẫu hình quá ngắn hoặc quá ít điểm. Vui lòng vẽ một nét rõ ràng hơn!");
      return;
    }
    const serialized = JSON.stringify(points);
    onChangePattern(serialized);
    setIsRecordingMode(false);
    setPoints([]);
  };

  const handleCancel = () => {
    setIsRecordingMode(false);
    setPoints([]);
  };

  const handleClear = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mẫu hình vẽ bảo mật này?")) {
      onChangePattern(null);
      setIsTestingMode(false);
    }
  };

  // Test drawing handlers
  const handleTestPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsTestDrawing(true);
    setTestScore(null);
    setTestMatchStatus(null);
    if (testCanvasRef.current) {
      testCanvasRef.current.setPointerCapture(e.pointerId);
      const rect = testCanvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setTestPoints([{ x, y }]);
    }
  };

  const handleTestPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTestDrawing) return;
    e.preventDefault();
    if (testCanvasRef.current) {
      const rect = testCanvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setTestPoints(prev => {
        const lastPoint = prev[prev.length - 1];
        if (!lastPoint || Math.abs(lastPoint.x - x) > 2 || Math.abs(lastPoint.y - y) > 2) {
          return [...prev, { x, y }];
        }
        return prev;
      });
    }
  };

  const handleTestPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTestDrawing) return;
    e.preventDefault();
    setIsTestDrawing(false);
    if (testCanvasRef.current) {
      testCanvasRef.current.releasePointerCapture(e.pointerId);
    }

    if (!patternLock) return;
    try {
      const registered = JSON.parse(patternLock);
      if (Array.isArray(registered) && registered.length >= 2) {
        // Compare drawn testPoints with registered points
        setTestPoints(currentPoints => {
          const score = matchPattern(currentPoints, registered);
          setTestScore(score);
          if (score >= 70) {
            setTestMatchStatus('success');
          } else {
            setTestMatchStatus('failed');
          }
          return currentPoints;
        });
      }
    } catch (err) {
      console.error('Error in handleTestPointerUp matchPattern:', err);
    }
  };

  return (
    <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3 text-left">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wide">
          {label}
        </label>
        
        {hasRegistered ? (
          <span className="text-[9px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase">
            <Unlock className="w-2.5 h-2.5 shrink-0" />
            Đã đăng ký
          </span>
        ) : (
          <span className="text-[9px] font-bold bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase">
            <Lock className="w-2.5 h-2.5 shrink-0" />
            Chưa thiết lập
          </span>
        )}
      </div>

      {!isRecordingMode ? (
        <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-150 shadow-xs">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-slate-400" />
            <div className="text-[11px] text-slate-600 font-sans leading-normal">
              {hasRegistered 
                ? "Bấm nút bên cạnh để đổi, vẽ thử hoặc xóa mẫu hình vẽ hiện tại."
                : "Mẫu hình vẽ chưa được đăng ký. Hãy tạo để sử dụng."}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasRegistered && (
              <>
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-all border border-slate-200"
                  title="Xóa mẫu hình vẽ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTestingMode(prev => !prev);
                    setTestPoints([]);
                    setTestScore(null);
                    setTestMatchStatus(null);
                  }}
                  className={`px-2.5 py-1.5 text-[10px] font-bold border rounded-lg flex items-center gap-1 transition-all ${
                    isTestingMode 
                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      : 'text-amber-600 hover:bg-amber-50/50 border-amber-200'
                  }`}
                >
                  <span>{isTestingMode ? "Đóng Test" : "Khớp thử"}</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                setIsRecordingMode(true);
                setIsTestingMode(false);
                setPoints([]);
              }}
              className="px-2.5 py-1.5 text-[10px] font-bold text-[#005699] hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1 transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{hasRegistered ? "Vẽ lại" : "Đăng ký vẽ"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] text-slate-500 flex items-start gap-1 leading-normal font-sans">
            <Info className="w-3.5 h-3.5 text-[#005699] shrink-0 mt-0.5" />
            <span>
              <strong>Hướng dẫn vẽ hình:</strong> Hãy nhấn giữ chuột (hoặc chạm màn hình) và di chuyển để vẽ một hình tùy ý (ngôi sao, chữ cái, hình học...). Nét vẽ hiển thị trực quan trên màn hình để bạn dễ theo dõi.
            </span>
          </div>

          {/* Draw Area with SVG overlay */}
          <div
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`w-full h-32 rounded-xl bg-slate-900 flex flex-col items-center justify-center relative cursor-crosshair overflow-hidden select-none touch-none border border-slate-800 transition-all ${
              isDrawing ? 'ring-2 ring-emerald-500/30 border-emerald-500/50' : ''
            }`}
          >
            {/* Render the drawing path visually */}
            {points.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-25">
                <polyline
                  points={points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}

            {points.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                  Nhấp giữ và Vẽ mẫu hình vào đây
                </p>
                <p className="text-[9px] text-slate-500 mt-1 font-sans">
                  (Nét vẽ hiển thị trực quan để bạn dễ theo dõi)
                </p>
              </div>
            ) : (
              <div className="text-center z-10 animate-pulse bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block mr-1.5" />
                <span className="text-[10px] text-emerald-400 font-bold font-mono">
                  Đang vẽ nét: {points.length} tọa độ...
                </span>
                <p className="text-[9px] text-slate-400 mt-1 font-sans">
                  Thả chuột/tay ra để hoàn tất vẽ mẫu hình
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={handleCancel}
              className="px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={points.length < 5}
              onClick={handleSave}
              className={`px-3 py-1 text-[10px] font-bold text-white rounded-lg flex items-center gap-1 transition-all shadow-xs ${
                points.length >= 5
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Lưu mẫu hình</span>
            </button>
          </div>
        </div>
      )}

      {isTestingMode && hasRegistered && (
        <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl space-y-3 shadow-xs animate-fade-in">
          <div className="text-[10px] text-amber-800 flex items-start gap-1 leading-normal font-sans">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Khu vực vẽ thử nghiệm:</strong> Hãy vẽ mẫu hình của bạn vào ô màu xanh lá bên dưới để kiểm tra độ khớp với mẫu hình hiện tại.
            </span>
          </div>

          <div
            ref={testCanvasRef}
            onPointerDown={handleTestPointerDown}
            onPointerMove={handleTestPointerMove}
            onPointerUp={handleTestPointerUp}
            className={`w-full h-32 rounded-xl bg-emerald-950/95 flex flex-col items-center justify-center relative cursor-crosshair overflow-hidden select-none touch-none border border-emerald-800/60 transition-all ${
              isTestDrawing ? 'ring-2 ring-amber-400/50 border-amber-400/50' : ''
            }`}
          >
            {/* Draw lines */}
            {testPoints.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-25">
                <polyline
                  points={testPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}

            {testPoints.length === 0 ? (
              <div className="text-center p-4 select-none pointer-events-none">
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-sans">
                  Vẽ thử mẫu hình bảo mật vào đây
                </p>
                <p className="text-[9px] text-emerald-500/80 mt-1 font-sans">
                  (Thả chuột hoặc nhấc tay ra để nhận kết quả khớp lập tức)
                </p>
              </div>
            ) : (
              <div className="text-center z-10 bg-emerald-950/90 p-2 rounded-xl border border-emerald-900 select-none pointer-events-none">
                {isTestDrawing ? (
                  <span className="text-[10px] text-amber-400 font-bold font-mono animate-pulse">
                    Đang nhận nét vẽ thử: {testPoints.length} điểm...
                  </span>
                ) : testMatchStatus === 'success' ? (
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-emerald-400 font-bold font-sans flex items-center justify-center gap-1 uppercase">
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Trùng khớp thành công! ({testScore}%)</span>
                    </span>
                    <p className="text-[9px] text-emerald-500">Mẫu hình này sẽ mở khóa màn hình thành công.</p>
                  </div>
                ) : testMatchStatus === 'failed' ? (
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-red-400 font-bold font-sans flex items-center justify-center gap-1 uppercase">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Không khớp ({testScore}%)</span>
                    </span>
                    <p className="text-[9px] text-emerald-600">Độ khớp cần đạt từ 70% trở lên. Hãy vẽ lại cẩn thận hơn.</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-slate-400 font-sans leading-normal">Mẹo: Bạn có thể vẽ theo chiều xuôi hoặc ngược lại đều khớp.</p>
            <button
              type="button"
              onClick={() => {
                setTestPoints([]);
                setTestScore(null);
                setTestMatchStatus(null);
              }}
              className="px-2 py-1 text-[9px] font-bold text-amber-700 bg-amber-100/50 hover:bg-amber-100 rounded-md border border-amber-200 transition-all"
            >
              Xóa nét vẽ thử
            </button>
          </div>
        </div>
      )}

      {userId && (
        <div className="border-t border-slate-200/60 pt-2 mt-2">
          <label className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-all">
            <input
              type="checkbox"
              checked={showStroke}
              onChange={(e) => handleToggleStroke(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-[#005699] border-slate-300 focus:ring-[#005699]"
            />
            <div className="text-left select-none">
              <span className="block text-[11px] font-bold text-slate-700">Hiển thị nét vẽ khi mở khóa</span>
              <span className="block text-[9px] text-slate-400 font-sans">Nếu tắt, nét vẽ sẽ ẩn hoàn toàn để ngụy trang</span>
            </div>
          </label>
        </div>
      )}
    </div>
  );
}
