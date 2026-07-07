/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowRight, Key, Lock, Unlock, Database, Cpu, X } from 'lucide-react';
import { Message } from '../types';

interface CryptoInspectorProps {
  message: Message;
  senderName: string;
  recipientName: string;
  onClose: () => void;
}

export default function CryptoInspector({
  message,
  senderName,
  recipientName,
  onClose,
}: CryptoInspectorProps) {
  const payload = message.encryptedPayload;

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-5 z-40 rounded-[32px] overflow-hidden text-slate-100 border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold tracking-wider uppercase font-mono text-emerald-400">
            Cryptographic Payload Inspector
          </span>
        </div>
        <button
          onClick={onClose}
          id="close-inspector-btn"
          className="p-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-4 my-3 pr-1 text-left font-mono scrollbar-thin">
        {/* Connection status */}
        <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-3 text-xs leading-relaxed">
          <div className="flex items-center space-x-1.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-emerald-400">Kênh truyền bảo mật tối cao (E2EE)</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Tin nhắn này được mã hóa trực tiếp trên thiết bị của <strong className="text-slate-300">{senderName}</strong> và chỉ có thể giải mã bằng khóa bí mật lưu trên phần cứng của <strong className="text-slate-300">{recipientName}</strong>.
          </p>
        </div>

        {/* Step 1: RSA Public Key of Recipient */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
            <Key className="w-3.5 h-3.5 text-blue-400" />
            <span>1. Khóa công khai RSA-2048 của {recipientName}</span>
          </div>
          <p className="text-[9px] text-slate-500">
            Sử dụng để đóng gói (wrap) khóa đối xứng AES-GCM.
          </p>
          <div className="bg-slate-900 border border-slate-800/80 rounded p-2 text-[9px] text-blue-400/90 break-all select-all font-mono h-12 overflow-y-auto">
            MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA{payload.encryptedKey.substring(0, 80)}...
          </div>
        </div>

        {/* Step 2: Ephemeral AES-GCM Key & IV */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-xs font-semibold text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Khóa AES-256</span>
            </div>
            <p className="text-[9px] text-slate-500">Được mã hóa bằng RSA:</p>
            <div className="bg-slate-900 border border-slate-800/80 rounded p-1.5 text-[9px] text-amber-400/90 break-all select-all h-8 overflow-hidden text-ellipsis">
              {payload.encryptedKey}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-xs font-semibold text-slate-300">
              <Database className="w-3.5 h-3.5 text-purple-400" />
              <span>IV (Véc-tơ khởi tạo)</span>
            </div>
            <p className="text-[9px] text-slate-500">Đảm bảo tính ngẫu nhiên:</p>
            <div className="bg-slate-900 border border-slate-800/80 rounded p-1.5 text-[9px] text-purple-400/90 break-all select-all h-8 overflow-hidden text-ellipsis">
              {payload.iv}
            </div>
          </div>
        </div>

        {/* Step 3: Ciphertext */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
            <Lock className="w-3.5 h-3.5 text-red-400" />
            <span>3. Bản mã gửi qua mạng (Ciphertext)</span>
          </div>
          <p className="text-[9px] text-slate-500">
            Dữ liệu thô truyền đi. Bên ngoài không thể xem được nội dung gốc.
          </p>
          <div className="bg-slate-900 border border-slate-800/80 rounded p-2 text-[10px] text-red-400 break-all font-mono h-12 overflow-y-auto select-all">
            {payload.ciphertext}
          </div>
        </div>

        {/* Step 4: Decryption Pipeline */}
        <div className="border border-slate-800 rounded-lg p-3 bg-slate-900/40">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200 mb-2">
            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quy trình giải mã ở máy nhận</span>
          </div>
          
          <div className="flex flex-col space-y-2 text-[10px] text-slate-400 font-mono">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-slate-800 flex items-center justify-center text-slate-300">1</div>
              <span>Khóa riêng RSA mở khóa AES-256 từ bản mã hóa.</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-slate-800 flex items-center justify-center text-slate-300">2</div>
              <span>Sử dụng khóa AES-256 đối xứng đã giải mã cùng IV.</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-slate-800 flex items-center justify-center text-slate-300">3</div>
              <span>Giải mã thành công nội dung văn bản gốc (Plaintext).</span>
            </div>
          </div>
        </div>

        {/* Decrypted plain text */}
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-emerald-400">Nội dung giải mã (Plaintext):</span>
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded p-2.5 text-xs text-emerald-200 font-sans leading-relaxed select-all">
            {message.isDestroyed ? (
              <span className="text-red-400 font-mono text-[10px] uppercase">
                [TIN NHẮN ĐÃ TỰ HỦY TRÊN BỘ NHỚ]
              </span>
            ) : (
              message.decryptedText || 'Đang giải mã...'
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-[10px] text-slate-500">
        <span>Giao thức: RSA-OAEP + AES-256 GCM</span>
        <span>An toàn tuyệt đối</span>
      </div>
    </div>
  );
}
