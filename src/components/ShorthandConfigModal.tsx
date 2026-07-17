import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, HelpCircle, BookOpen, RotateCcw } from 'lucide-react';
import { 
  getCustomShorthands, 
  saveCustomShorthand, 
  deleteCustomShorthand, 
  getSystemShorthands, 
  saveSystemShorthandsLocal 
} from '../utils/localNlpPredictor';

interface ShorthandConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function ShorthandConfigModal({ isOpen, onClose, isAdmin = false }: ShorthandConfigModalProps) {
  // Custom shorthand states
  const [customList, setCustomList] = useState<{ shortcut: string; replacement: string }[]>([]);
  const [newShortcut, setNewShortcut] = useState('');
  const [newReplacement, setNewReplacement] = useState('');
  const [customError, setCustomError] = useState('');

  // System shorthand states (Admin)
  const [systemList, setSystemList] = useState<{ shortcut: string; replacement: string }[]>([]);
  const [newSystemShortcut, setNewSystemShortcut] = useState('');
  const [newSystemReplacement, setNewSystemReplacement] = useState('');
  const [systemError, setSystemError] = useState('');
  const [isSavingSystem, setIsSavingSystem] = useState(false);

  const [activeTab, setActiveTab] = useState<'custom' | 'system'>('custom');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCustomShorthands();
      loadSystemShorthands();
    }
  }, [isOpen]);

  const loadCustomShorthands = () => {
    const dict = getCustomShorthands();
    const list = Object.entries(dict).map(([shortcut, replacement]) => ({
      shortcut,
      replacement,
    }));
    setCustomList(list);
  };

  const loadSystemShorthands = () => {
    const dict = getSystemShorthands();
    const list = Object.entries(dict).map(([shortcut, replacement]) => ({
      shortcut,
      replacement,
    }));
    setSystemList(list);
  };

  // Filter and sort lists alphabetically by shortcut (the left-hand side abbreviation)
  const filteredCustomList = customList
    .filter(item => 
      item.shortcut.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.replacement.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.shortcut.localeCompare(b.shortcut, 'vi'));

  const filteredSystemList = systemList
    .filter(item => 
      item.shortcut.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.replacement.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.shortcut.localeCompare(b.shortcut, 'vi'));

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError('');

    const shortcut = newShortcut.trim().toLowerCase();
    const replacement = newReplacement.trim();

    if (!shortcut || !replacement) {
      setCustomError('Vui lòng nhập đầy đủ cả từ viết tắt và từ thay thế.');
      return;
    }

    if (shortcut.includes(' ')) {
      setCustomError('Từ viết tắt không được chứa khoảng trắng.');
      return;
    }

    saveCustomShorthand(shortcut, replacement);
    setNewShortcut('');
    setNewReplacement('');
    loadCustomShorthands();
  };

  const handleDeleteCustom = (shortcut: string) => {
    deleteCustomShorthand(shortcut);
    loadCustomShorthands();
  };

  const handleAddSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSystemError('');

    const shortcut = newSystemShortcut.trim().toLowerCase();
    const replacement = newSystemReplacement.trim();

    if (!shortcut || !replacement) {
      setSystemError('Vui lòng nhập đầy đủ cả từ viết tắt và từ thay thế.');
      return;
    }

    if (shortcut.includes(' ')) {
      setSystemError('Từ viết tắt không được chứa khoảng trắng.');
      return;
    }

    setIsSavingSystem(true);
    try {
      const currentDict = getSystemShorthands();
      const updatedDict = { ...currentDict, [shortcut]: replacement };

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemShorthands: JSON.stringify(updatedDict) })
      });

      if (res.ok) {
        saveSystemShorthandsLocal(updatedDict);
        setNewSystemShortcut('');
        setNewSystemReplacement('');
        loadSystemShorthands();
      } else {
        setSystemError('Không thể cập nhật cấu hình hệ thống lên máy chủ.');
      }
    } catch (err) {
      setSystemError('Lỗi kết nối khi cập nhật từ điển hệ thống.');
    } finally {
      setIsSavingSystem(false);
    }
  };

  const handleDeleteSystem = async (shortcut: string) => {
    if (!isAdmin) return;

    setIsSavingSystem(true);
    try {
      const currentDict = getSystemShorthands();
      const updatedDict = { ...currentDict };
      delete updatedDict[shortcut];

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemShorthands: JSON.stringify(updatedDict) })
      });

      if (res.ok) {
        saveSystemShorthandsLocal(updatedDict);
        loadSystemShorthands();
      } else {
        alert('Không thể lưu thay đổi từ điển hệ thống.');
      }
    } catch (err) {
      alert('Lỗi kết nối khi xóa từ hệ thống.');
    } finally {
      setIsSavingSystem(false);
    }
  };

  const handleResetSystem = async () => {
    if (!isAdmin) return;
    if (!window.confirm('Bạn có chắc chắn muốn đặt từ điển hệ thống về mặc định của nhà sản xuất?')) {
      return;
    }

    setIsSavingSystem(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemShorthands: null })
      });

      if (res.ok) {
        localStorage.removeItem('securecrypt_system_shorthands');
        loadSystemShorthands();
      } else {
        alert('Không thể đặt lại từ điển hệ thống.');
      }
    } catch (err) {
      alert('Lỗi kết nối khi đặt lại.');
    } finally {
      setIsSavingSystem(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="shorthand-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div id="shorthand-modal-card" className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 animate-scale-in">
        
        {/* Header */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">Cấu hình viết tắt & Sửa lỗi</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('custom'); setSearchQuery(''); }}
            className={`flex-1 py-2.5 px-3 border-b-2 text-center transition-all ${
              activeTab === 'custom'
                ? 'border-emerald-500 text-emerald-600 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Cá nhân (Của bạn)
          </button>
          <button
            onClick={() => { setActiveTab('system'); setSearchQuery(''); }}
            className={`flex-1 py-2.5 px-3 border-b-2 text-center transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'system'
                ? 'border-emerald-500 text-emerald-600 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Từ điển Hệ thống</span>
            {isAdmin ? (
              <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider scale-90">ADMIN</span>
            ) : (
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded scale-90">Chỉ đọc</span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {activeTab === 'custom' && (
            <>
              {/* Form to Add New Custom Rule */}
              <form onSubmit={handleAddCustom} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Thêm quy tắc cá nhân mới</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Viết tắt (gõ liền)</label>
                    <input
                      type="text"
                      placeholder="vd: cv"
                      value={newShortcut}
                      onChange={(e) => setNewShortcut(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Từ đầy đủ (thay thế)</label>
                    <input
                      type="text"
                      placeholder="vd: công việc"
                      value={newReplacement}
                      onChange={(e) => setNewReplacement(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 bg-white"
                    />
                  </div>
                </div>

                {customError && <div className="text-[10px] text-red-500 font-semibold">{customError}</div>}

                <button
                  type="submit"
                  className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Viết Tắt</span>
                </button>
              </form>

              {/* Search and List of Custom Shorthands */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Danh sách cá nhân</span>
                  <span className="text-[10px] text-slate-400 capitalize normal-case font-normal">
                    {searchQuery ? `Tìm thấy: ${filteredCustomList.length}/${customList.length}` : `Tổng: ${customList.length}`}
                  </span>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm viết tắt hoặc thay thế cá nhân..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-8 pr-7 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 bg-slate-50/50"
                  />
                  <div className="absolute left-2.5 top-2 text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {filteredCustomList.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                    {searchQuery ? 'Không tìm thấy từ viết tắt phù hợp.' : 'Bạn chưa thêm quy tắc nào. Hãy thêm ở trên để tự động sửa lỗi theo ý muốn!'}
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 max-h-[220px] overflow-y-auto">
                    {filteredCustomList.map(({ shortcut, replacement }) => (
                      <div key={shortcut} className="flex items-center justify-between p-2 hover:bg-slate-50 text-xs transition-colors">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-100 font-semibold">{shortcut}</span>
                          <span className="text-slate-400">➔</span>
                          <span className="text-slate-700 font-medium">{replacement}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustom(shortcut)}
                          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Xóa quy tắc"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'system' && (
            <div className="space-y-4">
              {/* Help Banner */}
              <div className="text-xs text-slate-500 leading-relaxed bg-blue-50/70 p-2.5 rounded border border-blue-100 flex items-start space-x-1.5">
                <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  {isAdmin 
                    ? "Bạn đang truy cập với quyền Quản trị viên (Admin). Bạn có thể cấu hình từ điển hệ thống để áp dụng quy chuẩn sửa lỗi cho toàn bộ người dùng trong ứng dụng."
                    : "Từ điển chung của hệ thống tự động nhận diện viết tắt và sửa các lỗi chính tả phổ biến nhất cho tất cả người dùng trong phòng chat."
                  }
                </span>
              </div>

              {/* Admin Panel Actions (Add Rule) */}
              {isAdmin && (
                <form onSubmit={handleAddSystem} className="bg-red-50/40 p-3 rounded-lg border border-red-100 space-y-2.5">
                  <div className="text-[11px] font-bold text-red-800 uppercase tracking-wider flex justify-between items-center">
                    <span>Thêm quy tắc hệ thống (ADMIN)</span>
                    <button
                      type="button"
                      onClick={handleResetSystem}
                      disabled={isSavingSystem}
                      className="text-[10px] text-red-600 hover:text-red-800 flex items-center space-x-0.5 transition-all font-semibold hover:underline cursor-pointer disabled:opacity-50"
                      title="Đặt lại từ điển hệ thống về mặc định gốc"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Đặt lại gốc</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Gõ tắt hệ thống</label>
                      <input
                        type="text"
                        placeholder="vd: cv"
                        value={newSystemShortcut}
                        onChange={(e) => setNewSystemShortcut(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-800 bg-white font-mono"
                        disabled={isSavingSystem}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Từ đầy đủ tương ứng</label>
                      <input
                        type="text"
                        placeholder="vd: công việc"
                        value={newSystemReplacement}
                        onChange={(e) => setNewSystemReplacement(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-800 bg-white"
                        disabled={isSavingSystem}
                      />
                    </div>
                  </div>

                  {systemError && <div className="text-[10px] text-red-600 font-semibold">{systemError}</div>}

                  <button
                    type="submit"
                    disabled={isSavingSystem}
                    className="w-full py-1.5 px-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded text-xs font-bold transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isSavingSystem ? 'Đang Lưu...' : 'Thêm Vào Hệ Thống'}</span>
                  </button>
                </form>
              )}

              {/* Search and List of System Shorthands */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Toàn bộ từ điển hệ thống hiện tại</span>
                  <span className="text-[10px] text-slate-400 normal-case font-normal">
                    {searchQuery ? `Tìm thấy: ${filteredSystemList.length}/${systemList.length}` : `Tổng số: ${systemList.length}`}
                  </span>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm viết tắt hoặc thay thế hệ thống..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-8 pr-7 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-800 bg-slate-50/50"
                  />
                  <div className="absolute left-2.5 top-2 text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 max-h-[220px] overflow-y-auto bg-slate-50">
                  {filteredSystemList.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      {searchQuery ? 'Không tìm thấy từ viết tắt phù hợp trong hệ thống.' : 'Từ điển hệ thống trống rỗng.'}
                    </div>
                  ) : (
                    filteredSystemList.map(({ shortcut, replacement }) => (
                      <div key={shortcut} className="flex items-center justify-between p-2 hover:bg-slate-100/60 text-xs transition-colors">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-100 font-semibold">{shortcut}</span>
                          <span className="text-slate-400">➔</span>
                          <span className="text-slate-700 font-medium">{replacement}</span>
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSystem(shortcut)}
                            disabled={isSavingSystem}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                            title="Xóa quy tắc hệ thống này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded text-xs transition-colors cursor-pointer"
          >
            Đóng cấu hình
          </button>
        </div>

      </div>
    </div>
  );
}
