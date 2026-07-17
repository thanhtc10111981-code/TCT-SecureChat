import React, { useState } from 'react';
import { 
  RefreshCw, 
  Unlock, 
  ChevronDown, 
  Search, 
  Bell, 
  HelpCircle, 
  MoreHorizontal, 
  Layers, 
  CheckSquare, 
  Play, 
  Plus, 
  Info,
  ExternalLink,
  BookOpen,
  X,
  Database,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Trash2
} from 'lucide-react';

interface EditorialLoginScreenProps {
  loginUsername: string;
  setLoginUsername: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  loginError: string | null;
  isLoggingIn: boolean;
  onLogin: (e?: any) => void;
}

export default function EditorialLoginScreen({
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  loginError,
  isLoggingIn,
  onLogin
}: EditorialLoginScreenProps) {
  const [selectedLoginStyle, setSelectedLoginStyle] = useState<'dantri' | 'jira'>('dantri');
  const [rememberMe, setRememberMe] = useState(true);
  const passwordInputRef = React.useRef<HTMLInputElement>(null);

  // States for database connection trace
  const [showSecretPrompt, setShowSecretPrompt] = useState(false);
  const [secretPassword, setSecretPassword] = useState('');
  const [traceLogs, setTraceLogs] = useState<string[]>([]);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [isFetchingTrace, setIsFetchingTrace] = useState(false);
  const [showTraceLogsView, setShowTraceLogsView] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [traceStatusMsg, setTraceStatusMsg] = useState<string | null>(null);

  // Added States for DB connection checking & querying
  const [activeTab, setActiveTab] = useState<'logs' | 'db' | 'notif'>('logs');
  const [dbQuery, setDbQuery] = useState('SELECT id, username, name, role FROM users ORDER BY id;');
  const [dbQueryResults, setDbQueryResults] = useState<any>(null);
  const [isDbQuerying, setIsDbQuerying] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message?: string; timestamp?: string; executionTimeMs?: number; error?: string } | null>(null);
  const [isDbTesting, setIsDbTesting] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // States for push notification log management
  const [notifLogs, setNotifLogs] = useState<string>('');
  const [isFetchingNotifLogs, setIsFetchingNotifLogs] = useState<boolean>(false);
  const [debugUsers, setDebugUsers] = useState<any[]>([]);
  const [isFetchingDebugUsers, setIsFetchingDebugUsers] = useState<boolean>(false);
  const [isClearingNotifLogs, setIsClearingNotifLogs] = useState<boolean>(false);
  const [clearingUserId, setClearingUserId] = useState<string | null>(null);

  const fetchNotifLogs = async () => {
    setIsFetchingNotifLogs(true);
    try {
      const res = await fetch('/api/debug-notification-logs');
      const text = await res.text();
      setNotifLogs(text);
    } catch (err: any) {
      console.error(err);
      setNotifLogs('Lỗi tải logs: ' + err.message);
    } finally {
      setIsFetchingNotifLogs(false);
    }
  };

  const handleClearNotifLogs = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ log gửi thông báo đẩy?')) return;
    setIsClearingNotifLogs(true);
    try {
      const res = await fetch('/api/debug-notification-logs/clear', { method: 'POST' });
      if (res.ok) {
        setNotifLogs('Logs đã được xóa sạch.');
        setTraceStatusMsg('Đã xóa sạch toàn bộ log thông báo đẩy!');
      } else {
        alert('Lỗi khi xóa logs');
      }
    } catch (err: any) {
      alert('Lỗi kết nối: ' + err.message);
    } finally {
      setIsClearingNotifLogs(false);
    }
  };

  const fetchDebugUsers = async () => {
    setIsFetchingDebugUsers(true);
    try {
      const res = await fetch('/api/debug-users');
      if (res.ok) {
        const data = await res.json();
        setDebugUsers(data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsFetchingDebugUsers(false);
    }
  };

  const handleClearUserPushSubscriptions = async (userId: string) => {
    const userToClear = debugUsers.find(u => u.id === userId);
    const subCount = userToClear?.pushSubscriptionsCount || 0;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa toàn bộ ${subCount} subscriptions của user "${userId}" không?`)) {
      return;
    }
    setClearingUserId(userId);
    try {
      const res = await fetch('/api/debug/query-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: secretPassword,
          query: `UPDATE users SET push_subscriptions = '[]'::jsonb WHERE id = '${userId}';`
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTraceStatusMsg(`Đã xóa sạch subscriptions của user "${userId}" thành công!`);
        // Refresh the debug users list
        await fetchDebugUsers();
      } else {
        alert(data.error || 'Xóa thất bại.');
      }
    } catch (err: any) {
      alert('Lỗi kết nối: ' + err.message);
    } finally {
      setClearingUserId(null);
    }
  };

  const handleSecretDotClick = () => {
    setShowSecretPrompt(true);
    setSecretPassword('');
    setTraceError(null);
  };

  const handleVerifySecretPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTraceError(null);
    setIsFetchingTrace(true);

    try {
      const res = await fetch('/api/debug/error-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: secretPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setTraceLogs(data.logs || []);
        setShowSecretPrompt(false);
        setShowTraceLogsView(true);
        // Load initial values
        fetchNotifLogs();
        fetchDebugUsers();
      } else {
        setTraceError(data.error || 'Có lỗi xảy ra khi lấy log trace.');
      }
    } catch (err: any) {
      console.error('[DEBUG] Verify secret password failed:', err);
      const detailedError = `${err.name || 'Error'}: ${err.message || String(err)}${err.stack ? '\nStack:\n' + err.stack : ''}`;
      setTraceError('Không thể kết nối đến API debug: ' + detailedError);
    } finally {
      setIsFetchingTrace(false);
    }
  };

  const handleRefreshTrace = async () => {
    setTraceStatusMsg('Đang làm mới...');
    try {
      const res = await fetch('/api/debug/error-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: secretPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setTraceLogs(data.logs || []);
        setTraceStatusMsg(`Làm mới thành công lúc ${new Date().toLocaleTimeString()}`);
      } else {
        setTraceStatusMsg(`Lỗi làm mới: ${data.error || 'Mã lỗi ' + res.status}`);
      }
    } catch (err) {
      console.error(err);
      setTraceStatusMsg('Lỗi kết nối: ' + (err as Error).message);
    }
  };

  const handleClearTrace = async () => {
    setShowClearConfirm(false);
    setTraceStatusMsg('Đang xóa logs...');
    try {
      const res = await fetch('/api/debug/error-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: secretPassword, clear: true })
      });
      const data = await res.json();
      if (res.ok) {
        setTraceLogs([]);
        setTraceStatusMsg('Đã xóa sạch toàn bộ log trace thành công!');
      } else {
        setTraceStatusMsg(`Lỗi xóa: ${data.error || 'Mã lỗi ' + res.status}`);
      }
    } catch (err) {
      console.error(err);
      setTraceStatusMsg('Lỗi kết nối khi xóa: ' + (err as Error).message);
    }
  };

  const handleTestDbConnection = async () => {
    setIsDbTesting(true);
    setDbTestResult(null);
    try {
      const res = await fetch('/api/debug/query-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: secretPassword,
          testConnection: true
        })
      });
      const data = await res.json();
      setDbTestResult(data);
    } catch (err: any) {
      setDbTestResult({
        success: false,
        error: err.stack || err.message || String(err)
      });
    } finally {
      setIsDbTesting(false);
    }
  };

  const handleExecuteDbQuery = async () => {
    if (!dbQuery.trim()) return;
    setIsDbQuerying(true);
    setDbQueryResults(null);
    setDbError(null);
    try {
      const res = await fetch('/api/debug/query-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: secretPassword,
          query: dbQuery.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDbQueryResults(data);
      } else {
        setDbError(data.error || 'Thực thi câu lệnh thất bại.');
      }
    } catch (err: any) {
      setDbError(err.stack || err.message || String(err));
    } finally {
      setIsDbQuerying(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const renderTraceModals = () => {
    return (
      <>
        {/* Secret Password Prompt Modal */}
        {showSecretPrompt && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2 text-slate-800">
                  <Unlock className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-sm uppercase tracking-wide">Trình Trace Lỗi Hệ Thống</span>
                </div>
                <button 
                  onClick={() => setShowSecretPrompt(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleVerifySecretPassword} className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Trình gỡ lỗi nâng cao để kiểm tra trạng thái kết nối Database thầm lặng của hệ thống Docker On-Premises. Vui lòng nhập mật khẩu xác thực:
                </p>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Mật khẩu xác minh</label>
                  <input 
                    type="password"
                    autoFocus
                    placeholder="••••••••"
                    value={secretPassword}
                    onChange={(e) => setSecretPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>

                {traceError && (
                  <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                    <span className="font-bold">Lỗi:</span> {traceError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowSecretPrompt(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    disabled={isFetchingTrace}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    {isFetchingTrace ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Xác nhận'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Trace Logs Viewer Modal */}
        {showTraceLogsView && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/90 backdrop-blur-xs p-4">
            <div className="w-full max-w-4xl h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col text-left overflow-hidden">
              {/* Header */}
              <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-mono text-xs font-bold text-slate-200 uppercase tracking-wider">DATABASE TRACE LOGS & TOOLS (ON-PREM CONSOLE)</span>
                  </div>
                  {traceStatusMsg && (
                    <span className="text-[11px] text-emerald-400 font-sans">{traceStatusMsg}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {activeTab === 'logs' && (
                    <>
                      <button 
                        onClick={handleRefreshTrace}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer font-sans"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Làm mới</span>
                      </button>
                      
                      {showClearConfirm ? (
                        <div className="flex items-center gap-1.5 bg-red-950/90 border border-red-900 rounded p-1">
                          <span className="text-[10px] text-red-300 font-sans">Chắc xóa?</span>
                          <button 
                            onClick={handleClearTrace}
                            className="px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-sans font-bold cursor-pointer"
                          >
                            Có
                          </button>
                          <button 
                            onClick={() => setShowClearConfirm(false)}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-sans cursor-pointer"
                          >
                            Không
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setShowClearConfirm(true);
                            setTraceStatusMsg(null);
                          }}
                          className="p-1.5 rounded bg-red-950/60 border border-red-900 text-red-200 text-xs flex items-center gap-1 cursor-pointer font-sans hover:bg-red-900/80"
                        >
                          <span>Xóa sạch logs</span>
                        </button>
                      )}
                    </>
                  )}

                  <button 
                    onClick={() => {
                      setShowTraceLogsView(false);
                      setTraceStatusMsg(null);
                    }}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="bg-slate-900 px-6 border-b border-slate-800 flex gap-4 shrink-0 select-none overflow-x-auto whitespace-nowrap">
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                    activeTab === 'logs'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  CONSOLE ERROR LOGS
                </button>
                <button
                  onClick={() => setActiveTab('db')}
                  className={`py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                    activeTab === 'db'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  KIỂM TRA & TRUY VẤN DB
                </button>
                <button
                  onClick={() => {
                    setActiveTab('notif');
                    fetchNotifLogs();
                    fetchDebugUsers();
                  }}
                  className={`py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                    activeTab === 'notif'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  QUẢN LÝ THÔNG BÁO PUSH & TELEGRAM
                </button>
              </div>

              {activeTab === 'logs' && (
                <>
                  {/* Logs Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-3 font-mono text-xs">
                    {traceLogs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                        <span className="text-3xl">📭</span>
                        <span>Chưa có log lỗi nào được ghi lại trên máy chủ.</span>
                        <span className="text-[10px]">Mọi thứ đang chạy bình thường hoặc chưa phát sinh console.error</span>
                      </div>
                    ) : (
                      traceLogs.map((log, index) => {
                        const isRefused = log.includes('ECONNREFUSED');
                        return (
                          <div 
                            key={index} 
                            className={`p-3.5 rounded border leading-relaxed relative group ${
                              isRefused 
                                ? 'bg-red-950/40 border-red-900/60 text-red-200' 
                                : 'bg-slate-900/60 border-slate-800 text-slate-300'
                            }`}
                          >
                            <button 
                              onClick={() => copyToClipboard(log, index)}
                              className="absolute top-2.5 right-2.5 p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              {copiedIndex === index ? 'Đã copy' : 'Copy'}
                            </button>
                            <div className="text-[10px] text-slate-500 mb-1 select-none border-b border-slate-800 pb-1 flex justify-between">
                              <span>Log #{traceLogs.length - index}</span>
                              {isRefused && <span className="text-red-400 font-bold">⚠️ ECONNREFUSED - KHÔNG KẾT NỐI ĐƯỢC DB</span>}
                            </div>
                            <pre className="whitespace-pre-wrap break-all text-[11px] font-mono leading-5">{log}</pre>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Suggestions Panel */}
                  <div className="bg-slate-900 p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5 leading-relaxed font-sans shrink-0">
                    <p className="font-semibold text-amber-500 flex items-center gap-1 select-none">
                      💡 Gợi ý khắc phục lỗi Docker PostgreSQL:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Lỗi ECONNREFUSED</strong> nghĩa là ứng dụng không thể kết nối đến địa chỉ IP/port của DB.</li>
                      <li>Nếu chạy trong cùng một Docker Compose, hãy đặt host trong file <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-200">.env</code> là tên container PostgreSQL (ví dụ: <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-200">SQL_HOST=postgres-db</code>) thay vì <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-200">localhost</code> hay <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-200">127.0.0.1</code>.</li>
                      <li>Nếu chạy container riêng lẻ, hãy đảm bảo cả container App và container DB cùng nằm trong một Docker Network (ví dụ: <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-200">docker network connect</code>).</li>
                    </ul>
                  </div>
                </>
              )}

              {activeTab === 'db' && (
                /* Tab DB connection & query */
                <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800 min-h-0">
                  {/* Left: inputs */}
                  <div className="w-full md:w-5/12 p-6 overflow-y-auto flex flex-col space-y-5">
                    {/* section 1: Test DB */}
                    <div>
                      <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 font-sans flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-emerald-500" />
                        Kiểm tra kết nối Database
                      </h4>
                      <p className="text-[11px] text-slate-500 mb-3 font-sans leading-relaxed">
                        Thực hiện kết nối và đo độ trễ tới máy chủ PostgreSQL (bằng lệnh <code className="bg-slate-900 px-1 py-0.5 rounded font-mono text-emerald-400">SELECT NOW();</code>).
                      </p>
                      
                      <button
                        onClick={handleTestDbConnection}
                        disabled={isDbTesting}
                        className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-900 text-slate-300 hover:text-white rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer active:scale-[0.98]"
                      >
                        {isDbTesting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                        ) : (
                          <Database className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                        <span>{isDbTesting ? 'Đang kết nối...' : 'Kiểm tra kết nối CSDL'}</span>
                      </button>

                      {/* DB Test Result status */}
                      {dbTestResult && (
                        <div className={`mt-3 p-3 rounded-xl border text-xs font-sans flex flex-col gap-1 ${
                          dbTestResult.success 
                            ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300'
                            : 'bg-red-950/20 border-red-900/60 text-red-300'
                        }`}>
                          <div className="flex items-center gap-1.5 font-bold">
                            {dbTestResult.success ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span>Kết nối CSDL Thành công!</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <span>Lỗi kết nối CSDL!</span>
                              </>
                            )}
                          </div>
                          {dbTestResult.success ? (
                            <div className="text-[11px] space-y-0.5 text-slate-400 font-mono mt-1">
                              <div>• Độ trễ: <span className="text-emerald-400 font-bold">{dbTestResult.executionTimeMs} ms</span></div>
                              <div>• Server time: <span className="text-slate-300">{dbTestResult.timestamp}</span></div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-red-400 font-mono mt-1 whitespace-pre-wrap break-all">
                              {dbTestResult.error}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <hr className="border-slate-900" />

                    {/* section 2: Query box */}
                    <div className="flex-1 flex flex-col min-h-0">
                      <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5 font-sans flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-emerald-500" />
                        Nhập câu lệnh SQL
                      </h4>
                      <p className="text-[11px] text-slate-500 mb-3 font-sans leading-relaxed">
                        Chạy câu lệnh SQL thô trực tiếp lên Database và hiển thị kết quả.
                      </p>

                      <div className="mb-3 space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Truy cập nhanh (Presets)</div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            {
                              label: 'Users',
                              sql: 'SELECT id, username, name, role, pin_code, telegram_chat_id FROM users ORDER BY id;'
                            },
                            {
                              label: 'Tin nhắn mới nhất',
                              sql: 'SELECT id, sender_id, recipient_id, timestamp, is_read, is_destroyed FROM messages ORDER BY timestamp DESC LIMIT 10;'
                            },
                            {
                              label: 'Cấu hình hệ thống',
                              sql: 'SELECT * FROM settings;'
                            }
                          ].map((p, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setDbQuery(p.sql);
                                setDbQueryResults(null);
                                setDbError(null);
                              }}
                              className="px-2 py-1 text-[10px] font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer"
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <textarea
                        value={dbQuery}
                        onChange={(e) => setDbQuery(e.target.value)}
                        placeholder="SELECT * FROM users;"
                        className="w-full h-32 p-3 bg-slate-950 text-emerald-400 border border-slate-800 rounded-xl font-mono text-[11px] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 leading-relaxed resize-none"
                      />

                      <button
                        onClick={handleExecuteDbQuery}
                        disabled={isDbQuerying || !dbQuery.trim()}
                        className="w-full mt-3 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-900 text-white disabled:text-slate-500 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer active:scale-[0.98]"
                      >
                        {isDbQuerying ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current text-white" />
                        )}
                        <span>{isDbQuerying ? 'Đang thực thi SQL...' : 'Thực thi SQL (Run)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: results */}
                  <div className="w-full md:w-7/12 p-6 overflow-y-auto flex flex-col bg-slate-950/40">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3 font-sans flex items-center gap-1.5 shrink-0">
                      <Terminal className="w-4 h-4 text-emerald-500" />
                      Kết quả truy vấn
                    </h4>

                    {isDbQuerying && (
                      <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center text-slate-500 gap-2 font-sans">
                        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                        <span className="text-xs">Đang truy vấn PostgreSQL...</span>
                      </div>
                    )}

                    {!isDbQuerying && !dbQueryResults && !dbError && (
                      <div className="flex-1 min-h-[200px] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-600 gap-2 p-6 font-sans">
                        <Terminal className="w-8 h-8 text-slate-700" />
                        <p className="text-xs text-center leading-relaxed">Hãy nhập câu lệnh SQL ở ô bên trái và nhấn nút "Thực thi SQL" để chạy truy vấn và xem kết quả trực quan tại đây.</p>
                      </div>
                    )}

                    {dbError && (
                      <div className="p-4 bg-red-950/20 border border-red-900/60 text-red-300 rounded-xl text-xs font-mono flex items-start gap-2 whitespace-pre-wrap break-all leading-relaxed">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                           <div className="font-bold mb-1 font-sans text-red-400">Thực thi câu lệnh thất bại:</div>
                          {dbError}
                        </div>
                      </div>
                    )}

                    {!isDbQuerying && dbQueryResults && (
                      <div className="flex-1 flex flex-col min-h-0 space-y-3">
                        {/* Stats header */}
                        <div className="bg-emerald-950/20 border border-emerald-900/60 p-3 rounded-xl flex items-center justify-between text-[11px] font-sans text-emerald-300 shrink-0 flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>Thực thi thành công!</span>
                            <span className="bg-emerald-900/40 text-emerald-200 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase">{dbQueryResults.command}</span>
                          </div>
                          <div className="flex gap-3 text-slate-400 font-mono text-[10px]">
                            <span>Rows: {dbQueryResults.rowCount !== null ? dbQueryResults.rowCount : 'N/A'}</span>
                            <span>Time: {dbQueryResults.executionTimeMs}ms</span>
                          </div>
                        </div>

                        {/* Data table */}
                        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80 flex flex-col">
                          {!dbQueryResults.rows || dbQueryResults.rows.length === 0 ? (
                            <div className="p-6 text-slate-500 text-xs text-center font-sans">
                              Câu lệnh hoàn thành thành công nhưng không trả về kết quả hoặc không có hàng nào.
                            </div>
                          ) : (
                            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                              <table className="w-full text-left border-collapse font-mono text-[10px] text-slate-300">
                                <thead className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
                                  <tr>
                                    {Object.keys(dbQueryResults.rows[0]).map((key, kIdx) => (
                                      <th key={kIdx} className="px-3 py-2 font-bold text-slate-400 border-r border-slate-800 last:border-r-0">
                                        {key}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-900">
                                  {dbQueryResults.rows.map((row: any, rIdx: number) => (
                                    <tr key={rIdx} className="hover:bg-slate-900/50 transition-colors">
                                      {Object.entries(row).map(([key, val], cIdx) => {
                                        let disp = '';
                                        if (val === null) {
                                          disp = 'NULL';
                                        } else if (typeof val === 'object') {
                                          disp = JSON.stringify(val);
                                        } else {
                                          disp = String(val);
                                        }
                                        const isNull = val === null;
                                        return (
                                          <td key={cIdx} className={`px-3 py-2 border-r border-slate-900 last:border-r-0 max-w-[200px] truncate ${
                                            isNull ? 'text-slate-600 italic' : 'text-slate-300'
                                          }`} title={disp}>
                                            {disp}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'notif' && (
                /* Tab Notification management */
                <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800 min-h-0">
                  {/* Left: User subscription counts */}
                  <div className="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-sans flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-emerald-500" />
                        Subscriptions Người Dùng ({debugUsers.length})
                      </h4>
                      <button 
                        onClick={fetchDebugUsers}
                        disabled={isFetchingDebugUsers}
                        className="text-[11px] text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isFetchingDebugUsers ? 'animate-spin' : ''}`} />
                        <span>Làm mới</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                      Mỗi trình duyệt/thiết bị đăng ký nhận thông báo đẩy sẽ tạo ra 1 Subscription. Dưới đây là thống kê số lượng subscriptions đã tích lũy của từng tài khoản.
                    </p>

                    {isFetchingDebugUsers && debugUsers.length === 0 ? (
                      <div className="flex items-center justify-center p-8 text-slate-500 text-xs">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-500 mr-2" />
                        Đang tải danh sách người dùng...
                      </div>
                    ) : (
                      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                        <table className="w-full text-left border-collapse font-sans text-xs text-slate-300">
                          <thead>
                            <tr className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                              <th className="px-3 py-2.5 font-bold">Tài khoản</th>
                              <th className="px-3 py-2.5 font-bold text-center">Prefs</th>
                              <th className="px-3 py-2.5 font-bold text-center">Subscriptions</th>
                              <th className="px-3 py-2.5 font-bold text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900">
                            {debugUsers.map((u) => {
                              const prefs = u.notificationPreferences || { webPush: true, telegram: true };
                              return (
                                <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                                  <td className="px-3 py-3">
                                    <div className="font-bold text-slate-200">{u.name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">ID: {u.id}</div>
                                    {u.telegramChatId && (
                                      <div className="text-[10px] text-sky-400 font-mono mt-0.5">TG ChatID: {u.telegramChatId}</div>
                                    )}
                                  </td>
                                  <td className="px-3 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <span className={`px-1 rounded text-[9px] font-bold ${prefs.webPush !== false ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-slate-900 text-slate-500'}`} title="Web Push">
                                        WP
                                      </span>
                                      <span className={`px-1 rounded text-[9px] font-bold ${prefs.telegram !== false ? 'bg-sky-950 text-sky-400 border border-sky-900' : 'bg-slate-900 text-slate-500'}`} title="Telegram">
                                        TG
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-center font-mono font-bold text-emerald-400">
                                    {u.pushSubscriptionsCount}
                                  </td>
                                  <td className="px-3 py-3 text-right">
                                    <button
                                      disabled={clearingUserId === u.id || u.pushSubscriptionsCount === 0}
                                      onClick={() => handleClearUserPushSubscriptions(u.id)}
                                      className="px-2 py-1 text-[10px] bg-red-950/60 hover:bg-red-900 border border-red-900/60 text-red-200 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-red-950/60 disabled:hover:text-red-200 font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                                    >
                                      {clearingUserId === u.id ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-3 h-3" />
                                      )}
                                      <span>Xóa</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Right: Notification delivery logs */}
                  <div className="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col bg-slate-950/40 min-h-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-sans flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-emerald-500" />
                        Log Gửi Thông Báo Gần Nhất
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={fetchNotifLogs}
                          disabled={isFetchingNotifLogs}
                          className="px-2.5 py-1 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${isFetchingNotifLogs ? 'animate-spin' : ''}`} />
                          <span>Làm mới</span>
                        </button>
                        <button
                          onClick={handleClearNotifLogs}
                          disabled={isClearingNotifLogs}
                          className="px-2.5 py-1 text-[10px] font-bold bg-red-950/60 hover:bg-red-900 border border-red-900 text-red-200 hover:text-white rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Xóa log file</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 font-sans leading-relaxed mb-3">
                      Lịch sử gửi thông báo thời gian thực đến Apple/Google Push Server và Telegram Bot. Giúp bạn theo dõi trực tiếp các lỗi Web Push 403, 404 hoặc cooldown.
                    </p>

                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed min-h-[250px] max-h-[480px]">
                      {isFetchingNotifLogs ? (
                        <div className="h-full flex items-center justify-center text-slate-500 gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                          <span>Đang tải log file...</span>
                        </div>
                      ) : notifLogs ? (
                        <pre className="whitespace-pre-wrap break-all">{notifLogs}</pre>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">
                          Chưa có log thông báo đẩy nào được ghi lại.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  };

  React.useEffect(() => {
    if (loginUsername && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, []);

  if (selectedLoginStyle === 'dantri') {
    return (
      <div className="min-h-screen bg-[#f4f5f6] text-slate-900 flex flex-col items-center justify-center font-sans antialiased p-4 relative">
        {/* Floating Theme Selector */}
        <div className="absolute top-4 right-4 z-50 bg-white/90 backdrop-blur border border-slate-200 rounded-full p-1.5 shadow-md flex items-center gap-1">
          <button 
            type="button"
            onClick={() => setSelectedLoginStyle('dantri')}
            className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all ${
              selectedLoginStyle === 'dantri' 
                ? 'bg-dantri-green text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Báo Dân trí
          </button>
          <button 
            type="button"
            onClick={() => setSelectedLoginStyle('jira')}
            className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all ${
              selectedLoginStyle === 'jira' 
                ? 'bg-jira-blue text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Jira Software
          </button>
        </div>

        {/* Render a beautiful clean newspaper editorial login screen */}
        <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-3xl shadow-xl relative overflow-hidden text-left">
          <div className="text-center mb-6 relative z-10">
            <div className="font-serif font-black text-5xl text-dantri-green flex items-baseline justify-center tracking-tight select-none mb-1">
              Dân trí
              <span 
                onClick={handleSecretDotClick} 
                className="text-dantri-red text-5xl leading-none ml-0.5 animate-pulse cursor-pointer hover:scale-125 active:scale-95 transition-transform inline-block"
                title="Database Trace Console"
              >
                .
              </span>
            </div>
            <div className="text-[9px] text-slate-400 font-sans tracking-widest font-bold border-b border-slate-100 pb-3.5">
              CỔNG THÔNG TIN TOÀ SOẠN & ĐÓNG GÓP Ý KIẾN
            </div>
            <h2 className="text-sm font-bold text-slate-800 mt-5 uppercase tracking-wide font-sans">Đăng Nhập Tài Khoản Tác Giả</h2>
            <p className="text-xs text-slate-500 mt-1">Sử dụng tài khoản cộng tác viên để truy cập và soạn chuyên đề.</p>
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs mb-4">
              {loginError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1.5 font-sans">Tên tài khoản</label>
              <input
                type="text"
                autoComplete="off"
                data-lpignore="true"
                autoFocus={!loginUsername}
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    passwordInputRef.current?.focus();
                  }
                }}
                placeholder="Nhập tên tài khoản truy cập"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-dantri-green focus:ring-2 focus:ring-dantri-green/10"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1.5 font-sans">Mật khẩu thành viên</label>
              <input
                ref={passwordInputRef}
                type="text"
                autoComplete="off"
                data-lpignore="true"
                style={{ WebkitTextSecurity: 'disc' } as any}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onLogin(e);
                  }
                }}
                placeholder="Nhập mật khẩu truy cập"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-dantri-green focus:ring-2 focus:ring-dantri-green/10"
              />
            </div>

            <button
              type="button"
              onClick={() => onLogin()}
              disabled={isLoggingIn}
              className="w-full bg-dantri-green hover:bg-dantri-green-hover text-white font-bold py-3 px-4 rounded-xl text-xs tracking-wider uppercase font-sans transition-all flex items-center justify-center space-x-2 shadow-sm focus:outline-none"
            >
              {isLoggingIn ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>KẾT NỐI TOÀ SOẠN</span>
                </>
              )}
            </button>
          </div>
        </div>
        {renderTraceModals()}
      </div>
    );
  }

  // JIRA SOFTWARE STYLE LOGIN
  return (
    <div className="min-h-screen bg-[#fafbfe] text-[#172b4d] flex flex-col font-sans antialiased text-left relative">
      
      {/* Top Floating Theme Switcher */}
      <div className="absolute top-16 right-4 z-50 bg-white border border-slate-200 rounded-full p-1.5 shadow-md flex items-center gap-1">
        <button 
          type="button"
          onClick={() => setSelectedLoginStyle('dantri')}
          className="px-3 py-1 text-[11px] font-bold rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
        >
          Báo Dân trí
        </button>
        <button 
          type="button"
          onClick={() => setSelectedLoginStyle('jira')}
          className="px-3 py-1 text-[11px] font-bold rounded-full bg-jira-blue text-white shadow-sm transition-all"
        >
          Jira Software
        </button>
      </div>

      {/* JIRA TOP MENU BAR */}
      <header className="h-12 bg-white border-b border-jira-border flex items-center justify-between px-4 shrink-0 select-none">
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <div className="flex items-center space-x-1.5 cursor-pointer">
            <div className="w-6 h-6 rounded bg-jira-blue flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-[14px] text-[#0052cc] tracking-tight">Jira Software</span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center space-x-1 text-xs font-semibold text-[#42526e]">
            <button className="flex items-center space-x-0.5 px-3 py-1.5 rounded hover:bg-[#ebecf0] transition-colors">
              <span>Projects</span>
              <ChevronDown className="w-3 h-3 text-[#5e6c84]" />
            </button>
            <button className="flex items-center space-x-0.5 px-3 py-1.5 rounded hover:bg-[#ebecf0] transition-colors">
              <span>Filters</span>
              <ChevronDown className="w-3 h-3 text-[#5e6c84]" />
            </button>
            <button className="flex items-center space-x-0.5 px-3 py-1.5 rounded hover:bg-[#ebecf0] transition-colors">
              <span>Dashboards</span>
              <ChevronDown className="w-3 h-3 text-[#5e6c84]" />
            </button>
            <button className="flex items-center space-x-0.5 px-3 py-1.5 rounded hover:bg-[#ebecf0] transition-colors">
              <span>People</span>
              <ChevronDown className="w-3 h-3 text-[#5e6c84]" />
            </button>
            <button className="flex items-center space-x-0.5 px-3 py-1.5 rounded hover:bg-[#ebecf0] transition-colors">
              <span>Apps</span>
              <ChevronDown className="w-3 h-3 text-[#5e6c84]" />
            </button>
            <button className="ml-1 px-3 py-1 bg-jira-blue hover:bg-jira-blue-hover text-white rounded font-bold transition-all text-[11px]">
              Create
            </button>
          </nav>
        </div>

        {/* Right tools */}
        <div className="flex items-center space-x-2">
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 text-[#5e6c84] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search" 
              disabled
              className="bg-[#fafbfc] border border-jira-border rounded-md pl-8 pr-3 py-1 text-xs focus:outline-none w-40 cursor-not-allowed" 
            />
          </div>
          <button className="p-1.5 rounded-full hover:bg-slate-100 text-[#5e6c84] relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
          </button>
          <button className="p-1.5 rounded-full hover:bg-slate-100 text-[#5e6c84]">
            <HelpCircle className="w-4 h-4" />
          </button>
          <button className="px-3 py-1 border border-[#0052cc] text-[#0052cc] hover:bg-slate-50 rounded font-bold text-xs transition-colors">
            Log In
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 bg-[#f4f5f7] flex flex-col justify-center">
        <div className="max-w-6xl w-full mx-auto">
          
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-[#dfe1e6] mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-[#172b4d] tracking-tight flex items-center gap-2 select-none">
              <span>System Dashboard</span>
              <span 
                onClick={handleSecretDotClick} 
                className="text-slate-300 hover:text-slate-500 cursor-pointer text-xs ml-0.5"
                title="Database Trace Console"
              >
                .
              </span>
            </h1>
            <button className="p-1 rounded hover:bg-[#ebecf0] text-[#5e6c84]">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: INTRODUCTION PANEL */}
            <div className="lg:col-span-7 bg-white border border-jira-border rounded-[8px] p-6 shadow-sm space-y-5">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-jira-slate">Welcome to Jira Software</h2>
                <p className="text-xs text-[#5e6c84] leading-relaxed font-normal">
                  Track and manage agile software development projects with premium performance, absolute end-to-end cryptographic security (E2EE), and a customizable collaborative experience.
                </p>
              </div>

              {/* STUNNING INTERACTIVE BOARD SIMULATION WITH TAILWIND CSS */}
              <div className="bg-[#fafbfc] border border-jira-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[#5e6c84] font-bold font-mono tracking-wider uppercase">
                  <span>🚀 LIVE KANBAN CHAT ENGINE</span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ONLINE
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* Column 1 */}
                  <div className="bg-[#f4f5f7] rounded p-2 text-left space-y-1.5 min-h-[140px]">
                    <div className="text-[10px] font-bold text-[#5e6c84] uppercase">To Do</div>
                    <div className="bg-white p-2 rounded shadow-xs border border-jira-border space-y-1">
                      <span className="text-[9px] font-bold bg-[#deebff] text-[#0747a6] px-1 rounded">SEC-204</span>
                      <p className="text-[10px] text-slate-800 font-medium">Bảo mật RSA-2048</p>
                    </div>
                    <div className="bg-white p-2 rounded shadow-xs border border-jira-border space-y-1">
                      <span className="text-[9px] font-bold bg-[#deebff] text-[#0747a6] px-1 rounded">SEC-301</span>
                      <p className="text-[10px] text-slate-800 font-medium">Lưu khóa cục bộ</p>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="bg-[#deebff]/50 rounded p-2 text-left space-y-1.5 min-h-[140px]">
                    <div className="text-[10px] font-bold text-[#0747a6] uppercase">In Progress</div>
                    <div className="bg-white p-2 rounded shadow-xs border-l-2 border-amber-500 border-t border-r border-b border-jira-border space-y-1 animate-pulse">
                      <span className="text-[9px] font-bold bg-[#fff0b3] text-[#a06800] px-1 rounded">CHAT-452</span>
                      <p className="text-[10px] text-slate-800 font-medium">Mã hóa tin nhắn E2E</p>
                    </div>
                  </div>

                  {/* Column 3 */}
                  <div className="bg-[#e3fcef]/50 rounded p-2 text-left space-y-1.5 min-h-[140px]">
                    <div className="text-[10px] font-bold text-[#006644] uppercase">Done</div>
                    <div className="bg-white p-2 rounded shadow-xs border border-jira-border space-y-1 opacity-75">
                      <span className="text-[9px] font-bold bg-[#e3fcef] text-[#006644] px-1 rounded">SYS-101</span>
                      <p className="text-[10px] text-slate-800 font-medium">Xác thực Sinh trắc</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Help Box */}
              <div className="flex items-start gap-2.5 p-3 bg-blue-50/50 border border-[#b3d4ff]/40 rounded-lg text-xs leading-relaxed text-[#0747a6]">
                <Info className="w-4 h-4 shrink-0 text-[#0747a6] mt-0.5" />
                <div className="text-left font-normal font-sans space-y-1">
                  <span className="font-bold">Hệ thống phân quyền thông minh:</span>
                  <p>Mỗi tài khoản được cấp phát một bộ Khóa riêng tư RSA ngầm, thông tin tin nhắn được mã hóa E2E hoàn toàn mà không đi qua bản rõ trên máy chủ.</p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: LOGIN PANEL */}
            <div className="lg:col-span-5 bg-white border border-jira-border rounded-[8px] p-6 shadow-sm space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-jira-slate">Log In</h2>
                <p className="text-[11px] text-[#5e6c84]">Welcome back! Please enter your user account credentials.</p>
              </div>

              {loginError && (
                <div className="bg-[#ffebe6] border border-[#ffbdad] text-[#bf2600] p-3 rounded text-xs">
                  {loginError}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); onLogin(e); }} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#5e6c84] mb-1">Username</label>
                  <input 
                    type="text"
                    autoComplete="off"
                    data-lpignore="true"
                    autoFocus={selectedLoginStyle === 'jira'}
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Enter your username..."
                    className="w-full bg-[#fafbfc] border border-jira-border hover:bg-[#ebecf0] focus:bg-white focus:border-[#0052cc] rounded px-3 py-2 text-xs focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5e6c84] mb-1">Password</label>
                  <input 
                    type="text"
                    autoComplete="off"
                    data-lpignore="true"
                    style={{ WebkitTextSecurity: 'disc' } as any}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password..."
                    className="w-full bg-[#fafbfc] border border-jira-border hover:bg-[#ebecf0] focus:bg-white focus:border-[#0052cc] rounded px-3 py-2 text-xs focus:outline-none transition-all"
                  />
                </div>

                {/* Keep Me Logged In */}
                <div className="flex items-center justify-between pt-1 select-none">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#5e6c84]">
                    <input 
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#dfe1e6] text-[#0052cc] focus:ring-[#0052cc]/30 w-3.5 h-3.5"
                    />
                    <span>Remember my login on this device</span>
                  </label>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-jira-blue hover:bg-jira-blue-hover text-white font-bold py-2 px-4 rounded text-xs transition-all flex items-center justify-center space-x-2 shadow-xs focus:outline-none"
                >
                  {isLoggingIn ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Log In</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick info links like Jira */}
              <div className="pt-4 border-t border-[#dfe1e6] flex flex-col space-y-1 text-[11px]">
                <a href="#help" className="text-[#0052cc] hover:underline flex items-center gap-0.5">
                  <span>Can't access your account?</span>
                </a>
                <span className="text-[#5e6c84]">
                  Not a member? Ask your <strong className="text-slate-700">System Admin</strong> to create an account for you.
                </span>
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 border-t border-jira-border bg-white flex items-center justify-between px-6 text-[11px] text-[#5e6c84] shrink-0">
        <span>Powered by Atlassian Jira & E2EE Crypto Shield</span>
        <div className="flex space-x-4">
          <a href="#terms" className="hover:underline">Terms of Service</a>
          <a href="#privacy" className="hover:underline">Privacy Policy</a>
        </div>
      </footer>
      {renderTraceModals()}
    </div>
  );
}
