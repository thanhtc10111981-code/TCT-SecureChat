import React from 'react';
import { UserSession } from '../types';

interface LastSeenStatusProps {
  user: UserSession;
  isAdmin: boolean;
  variant?: 'compact' | 'full' | 'tiny';
}

export function formatLastSeen(lastSeen: number | null | undefined): string {
  if (!lastSeen) return 'Ngoại tuyến';
  
  const now = Date.now();
  const diffMs = now - lastSeen;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  
  if (diffSec < 10) {
    return 'Vừa mới hoạt động';
  }
  if (diffSec < 60) {
    return 'Hoạt động dưới 1 phút trước';
  }
  if (diffMin < 60) {
    return `Hoạt động ${diffMin} phút trước`;
  }
  if (diffHour < 24) {
    return `Hoạt động ${diffHour} giờ trước`;
  }
  
  const date = new Date(lastSeen);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `Hoạt động ngày ${day}/${month} lúc ${hours}:${minutes}`;
}

export const LastSeenStatus: React.FC<LastSeenStatusProps> = ({
  user,
  isAdmin,
  variant = 'full',
}) => {
  if (!isAdmin) return null;

  if (variant === 'tiny') {
    const titleText = user.isFocused 
      ? 'Đang hoạt động (on focus)' 
      : user.isOnline 
        ? 'Chạy ngầm (mất tập trung)' 
        : formatLastSeen(user.lastSeen);

    const dotColor = user.isFocused 
      ? 'bg-emerald-500 animate-pulse' 
      : user.isOnline 
        ? 'bg-amber-400' 
        : 'bg-slate-300';

    return (
      <div 
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}
        title={titleText}
      />
    );
  }

  if (variant === 'compact') {
    // Return compact indicator dot with a tooltip
    const titleText = user.isFocused 
      ? 'Đang hoạt động (on focus)' 
      : user.isOnline 
        ? 'Chạy ngầm (mất tập trung)' 
        : formatLastSeen(user.lastSeen);

    const dotColor = user.isFocused 
      ? 'bg-emerald-500 animate-pulse' 
      : user.isOnline 
        ? 'bg-amber-400' 
        : 'bg-slate-300';

    return (
      <div 
        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${dotColor}`}
        title={titleText}
      />
    );
  }

  // Full detailed display for ChatArea header
  return (
    <p className="text-[9.5px] mt-0.5 leading-none flex items-center gap-1">
      {user.isFocused ? (
        <>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-700 font-bold">Đang hoạt động (on focus)</span>
        </>
      ) : user.isOnline ? (
        <>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-700 font-bold">Chạy ngầm (mất tập trung)</span>
        </>
      ) : (
        <>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span className="text-slate-600 font-bold">{formatLastSeen(user.lastSeen)}</span>
        </>
      )}
    </p>
  );
};
