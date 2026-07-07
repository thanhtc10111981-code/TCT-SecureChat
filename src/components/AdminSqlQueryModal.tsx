import React, { useState, useEffect } from 'react';
import { X, Play, Terminal, HelpCircle, AlertTriangle, Database, CheckCircle2, RefreshCw } from 'lucide-react';
import { UserSession } from '../types';

interface AdminSqlQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  realUser: UserSession | null;
  addLog: (text: string, type: 'info' | 'success' | 'warn' | 'crypto') => void;
}

interface QueryResult {
  success: boolean;
  command?: string;
  rowCount?: number | null;
  rows?: any[];
  fields?: { name: string; dataTypeID: number }[];
  executionTimeMs?: number;
  error?: string;
}

const PRESETS = [
  {
    label: 'Xem tất cả Users',
    sql: 'SELECT id, username, name, role, biometric_type, pin_code, telegram_chat_id FROM users ORDER BY role ASC, id ASC;'
  },
  {
    label: 'Xem tất cả Messages',
    sql: 'SELECT id, sender_id, recipient_id, timestamp, is_read, is_destroyed FROM messages ORDER BY timestamp DESC LIMIT 50;'
  },
  {
    label: 'Kiểm tra Cấu hình',
    sql: 'SELECT id, is_strict_real_mode, telegram_bot_token, is_auth_bio_enabled, is_auth_pin_enabled, is_auth_pwd_enabled FROM settings;'
  },
  {
    label: 'Mẫu Tạo bảng Thử nghiệm',
    sql: `CREATE TABLE IF NOT EXISTS system_notices (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    label: 'Mẫu Chèn dữ liệu Thử nghiệm',
    sql: `INSERT INTO system_notices (title, content) 
VALUES ('Thông báo khẩn', 'Hệ thống chuẩn bị bảo trì định kỳ lúc 02:00 sáng mai.')
RETURNING *;`
  },
  {
    label: 'Mẫu Truy vấn Thử nghiệm',
    sql: 'SELECT * FROM system_notices ORDER BY id DESC;'
  },
  {
    label: 'Mẫu Xóa bảng Thử nghiệm',
    sql: 'DROP TABLE IF EXISTS system_notices;'
  }
];

export default function AdminSqlQueryModal({
  isOpen,
  onClose,
  realUser,
  addLog
}: AdminSqlQueryModalProps) {
  const [query, setQuery] = useState('');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [viewingCell, setViewingCell] = useState<{ colName: string; value: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && !query) {
      // Set default preset
      setQuery(PRESETS[0].sql);
      setResult(null);
    }
  }, [isOpen]);

  const handleExecute = async () => {
    if (!realUser || !query.trim()) return;
    setExecuting(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/query-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: realUser.id,
          query: query.trim()
        })
      });

      const data = await res.json();
      setResult(data);

      if (res.ok && data.success) {
        addLog(`[SQL] Thực thi câu lệnh thành công (${data.command}).`, 'success');
      } else {
        addLog(`[SQL] Lỗi thực thi câu lệnh SQL: ${data.error || 'Lỗi không xác định.'}`, 'warn');
      }
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || 'Lỗi kết nối máy chủ.'
      });
      addLog('[SQL] Lỗi kết nối khi gửi câu lệnh truy vấn.', 'warn');
    } finally {
      setExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#004882] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-amber-300" />
            <h3 className="font-serif text-lg font-bold">Bảng Điều Khiển & Truy Vấn CSDL PostgreSQL</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          {/* Left panel: Editor & Presets */}
          <div className="w-full md:w-5/12 p-5 md:overflow-y-auto flex flex-col space-y-4 shrink-0">
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 font-sans flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#004882]" />
                Nhập câu lệnh SQL
              </h4>
              <p className="text-[11px] text-slate-500 mb-2 font-sans">
                Hỗ trợ đầy đủ các lệnh DDL (CREATE, ALTER, DROP), DML (INSERT, UPDATE, DELETE) và DQL (SELECT).
              </p>
              
              <div className="relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-64 p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl border border-slate-800 focus:ring-2 focus:ring-[#004882] focus:outline-none resize-none leading-relaxed"
                  placeholder="Nhập câu lệnh PostgreSQL tại đây..."
                />
                
                <div className="absolute bottom-3 right-3">
                  <button
                    onClick={handleExecute}
                    disabled={executing || !query.trim()}
                    className="flex items-center space-x-1.5 bg-[#004882] hover:bg-[#003865] disabled:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md transition-all active:scale-95"
                  >
                    {executing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>Thực thi (Run)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SQL Presets */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 font-sans flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#004882]" />
                Các truy vấn mẫu tiện ích
              </h4>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(preset.sql);
                      setResult(null);
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-all font-sans text-left leading-tight"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: Results Output */}
          <div className="w-full md:w-7/12 p-5 md:overflow-hidden flex flex-col bg-slate-50 shrink-0 md:shrink">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3 font-sans shrink-0">
              Kết quả truy vấn CSDL
            </h4>

            {executing && (
              <div className="flex-1 min-h-[150px] md:min-h-0 flex flex-col items-center justify-center text-slate-400 space-y-2 shrink-0">
                <RefreshCw className="w-8 h-8 animate-spin text-[#004882]" />
                <span className="text-xs font-sans">Đang thực thi truy vấn trực tiếp trên Database...</span>
              </div>
            )}

            {!executing && !result && (
              <div className="flex-1 min-h-[150px] md:min-h-0 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 space-y-1 p-8">
                <Database className="w-10 h-10 text-slate-300" />
                <p className="text-xs font-sans text-center">Bấm nút "Thực thi (Run)" ở bên trái để chạy câu lệnh SQL và xem kết quả trực quan tại đây.</p>
              </div>
            )}

            {!executing && result && (
              <div className="flex-1 flex flex-col md:overflow-hidden">
                {result.success ? (
                  <div className="flex-1 flex flex-col md:overflow-hidden space-y-3">
                    {/* Execution Stats Badge */}
                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between text-xs font-sans text-emerald-800 shrink-0 flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold">Chạy thành công!</span>
                        <span>Mã lệnh: <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">{result.command}</code></span>
                      </div>
                      <div className="flex space-x-4 font-semibold text-[11px]">
                        <span>Hàng bị ảnh hưởng: {result.rowCount !== null ? result.rowCount : 'N/A'}</span>
                        <span>Thời gian: {result.executionTimeMs}ms</span>
                      </div>
                    </div>

                    {/* Output Data Table */}
                    <div className="flex-1 min-h-[250px] md:min-h-0 border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col relative">
                      <div className="bg-slate-50 border-b border-slate-100 px-3 py-1.5 text-[10px] text-slate-500 font-sans flex items-center shrink-0">
                        <span>💡 Mẹo: Nhấp vào ô bất kỳ có nội dung để xem chi tiết đầy đủ và sao chép (Copy) dữ liệu cột.</span>
                      </div>
                      {!result.rows || result.rows.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center p-6 text-slate-400 text-xs font-sans">
                          Không có hàng nào được trả về (hoặc thao tác DDL/DML đã hoàn thành).
                        </div>
                      ) : (
                        <div className="flex-1 overflow-auto">
                          <table className="w-full text-left border-collapse text-xs font-sans">
                            <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
                              <tr>
                                {result.fields && result.fields.length > 0 ? (
                                  result.fields.map((f, i) => (
                                    <th key={i} className="px-3 py-2 font-bold text-slate-700 bg-slate-100 font-mono text-[11px] border-r border-slate-200 last:border-0">
                                      {f.name}
                                    </th>
                                  ))
                                ) : (
                                  Object.keys(result.rows[0]).map((key, i) => (
                                    <th key={i} className="px-3 py-2 font-bold text-slate-700 bg-slate-100 font-mono text-[11px] border-r border-slate-200 last:border-0">
                                      {key}
                                    </th>
                                  ))
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {result.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                                  {result.fields && result.fields.length > 0 ? (
                                    result.fields.map((f, cIdx) => {
                                      const val = row[f.name];
                                      let displayVal = '';
                                      if (val === null) {
                                        displayVal = 'NULL';
                                      } else if (typeof val === 'object') {
                                        displayVal = JSON.stringify(val);
                                      } else {
                                        displayVal = String(val);
                                      }
                                      const isNull = val === null;
                                      return (
                                        <td
                                          key={cIdx}
                                          onClick={() => !isNull && setViewingCell({ colName: f.name, value: displayVal })}
                                          className={`px-3 py-2 font-mono text-[11px] border-r border-slate-200 last:border-0 max-w-xs truncate transition-all duration-150 ${
                                            isNull 
                                              ? 'text-slate-300 italic' 
                                              : 'text-slate-700 cursor-pointer hover:bg-sky-50 hover:text-sky-800'
                                          }`}
                                          title={isNull ? 'Giá trị NULL' : 'Nhấp để xem chi tiết & Sao chép'}
                                        >
                                          {displayVal}
                                        </td>
                                      );
                                    })
                                  ) : (
                                    Object.entries(row).map(([key, val], cIdx) => {
                                      let displayVal = '';
                                      if (val === null) {
                                        displayVal = 'NULL';
                                      } else if (typeof val === 'object') {
                                        displayVal = JSON.stringify(val);
                                      } else {
                                        displayVal = String(val);
                                      }
                                      const isNull = val === null;
                                      return (
                                        <td
                                          key={cIdx}
                                          onClick={() => !isNull && setViewingCell({ colName: key, value: displayVal })}
                                          className={`px-3 py-2 font-mono text-[11px] border-r border-slate-200 last:border-0 max-w-xs truncate transition-all duration-150 ${
                                            isNull 
                                              ? 'text-slate-300 italic' 
                                              : 'text-slate-700 cursor-pointer hover:bg-sky-50 hover:text-sky-800'
                                          }`}
                                          title={isNull ? 'Giá trị NULL' : 'Nhấp để xem chi tiết & Sao chép'}
                                        >
                                          {displayVal}
                                        </td>
                                      );
                                    })
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-xs font-sans text-red-700 flex items-start gap-2.5 animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h5 className="font-bold">Lỗi khi thực thi câu lệnh SQL:</h5>
                      <pre className="bg-red-100/50 p-2.5 rounded-lg border border-red-200/50 font-mono text-[10px] text-red-800 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {result.error}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Cell Detail Dialog */}
        {viewingCell && (
          <div className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col h-[70vh] animate-in slide-in-from-bottom-4 duration-200">
              <div className="bg-slate-100 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-[#004882]" />
                  <span className="font-sans font-bold text-xs text-slate-700">
                    Chi tiết cột: <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-[#004882]">{viewingCell.colName}</code>
                  </span>
                </div>
                <button
                  onClick={() => { setViewingCell(null); setCopied(false); }}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 p-5 overflow-auto bg-slate-50 font-mono text-xs text-slate-800 break-all select-all whitespace-pre-wrap leading-relaxed select-text">
                {viewingCell.value}
              </div>

              <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
                <span className="text-[10px] text-slate-500 font-sans">
                  Độ dài: <strong className="text-slate-700">{viewingCell.value.length} ký tự</strong>
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(viewingCell.value);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all text-xs font-sans flex items-center space-x-1.5"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 animate-bounce" />
                        <span>Đã sao chép!</span>
                      </>
                    ) : (
                      <span>Sao chép toàn bộ</span>
                    )}
                  </button>
                  <button
                    onClick={() => { setViewingCell(null); setCopied(false); }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all border border-slate-200 text-xs font-sans"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-all font-sans text-xs"
          >
            Đóng bảng điều khiển
          </button>
        </div>

      </div>
    </div>
  );
}
