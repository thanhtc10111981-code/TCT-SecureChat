import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { UserSession } from '../types';

interface ChatPair {
  user1Id: string;
  user1Name: string;
  user2Id: string;
  user2Name: string;
  messageCount: number;
}

interface AdminDeletePostingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  realUser: UserSession | null;
  addLog: (text: string, type: 'info' | 'success' | 'warn' | 'crypto') => void;
}

export default function AdminDeletePostingsModal({
  isOpen,
  onClose,
  realUser,
  addLog
}: AdminDeletePostingsModalProps) {
  const [chatPairs, setChatPairs] = useState<ChatPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingPair, setConfirmingPair] = useState<ChatPair | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchChatPairs = async () => {
    if (!realUser) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/chat-pairs?adminId=${realUser.id}`);
      const data = await res.json();
      if (res.ok) {
        setChatPairs(data);
      } else {
        setError(data.error || 'Lỗi khi tải danh sách cặp chat.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && realUser) {
      fetchChatPairs();
      setConfirmingPair(null);
    }
  }, [isOpen, realUser]);

  const handleDeletePair = async (pair: ChatPair) => {
    if (!realUser) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/clear-chat-pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: realUser.id,
          user1: pair.user1Id,
          user2: pair.user2Id
        })
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`[ADMIN] Đã xóa toàn bộ nội dung hội thoại giữa ${pair.user1Name} và ${pair.user2Name}.`, 'success');
        setConfirmingPair(null);
        fetchChatPairs();
      } else {
        alert(data.error || 'Xóa thất bại.');
      }
    } catch (err) {
      alert('Lỗi kết nối.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#004882] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trash2 className="w-5 h-5 text-amber-300" />
            <h3 className="font-serif text-lg font-bold">Xóa Bài Đăng (Xóa Hội Thoại Cụ Thể)</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            Giao diện quản lý các cuộc hội thoại (bài đăng) hiện có trên hệ thống máy chủ. Chỉ tài khoản quản trị viên mới có quyền truy cập chức năng này.
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-sans flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {confirmingPair ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 font-sans animate-in slide-in-from-top-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Xác nhận xóa toàn bộ hội thoại?</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Bạn đang thực hiện xóa sạch toàn bộ nội dung chat, tệp đính kèm và dữ liệu trao đổi giữa{' '}
                    <strong className="text-amber-800 font-bold">{confirmingPair.user1Name}</strong> và{' '}
                    <strong className="text-amber-800 font-bold">{confirmingPair.user2Name}</strong> trên hệ thống máy chủ. 
                    Thao tác này <strong>không thể hoàn tác</strong>.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 text-xs pt-1">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setConfirmingPair(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleDeletePair(confirmingPair)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Xác nhận Xóa Sạch</span>
                </button>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-[#004882]" />
              <span className="text-xs font-sans">Đang tải danh sách bài đăng...</span>
            </div>
          ) : chatPairs.length === 0 ? (
            <div className="py-12 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-sans">Không tìm thấy cuộc hội thoại nào hoạt động trên hệ thống.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50">
              {chatPairs.map((pair, idx) => (
                <div 
                  key={idx} 
                  className="p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-[#004882]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">
                        {pair.user1Name} <span className="text-slate-400 font-normal">và</span> {pair.user2Name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                        Tài khoản: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">{pair.user1Id}</code> & <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">{pair.user2Id}</code>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-mono font-medium">
                      {pair.messageCount} bài đăng
                    </span>
                    <button
                      type="button"
                      disabled={!!confirmingPair}
                      onClick={() => setConfirmingPair(pair)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-100 rounded-xl transition-all"
                      title="Xóa cuộc hội thoại này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={fetchChatPairs}
            className="text-[#004882] hover:underline font-bold inline-flex items-center gap-1 font-sans"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tải lại danh sách</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-all font-sans"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
