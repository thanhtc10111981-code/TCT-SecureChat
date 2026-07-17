import { EventEmitter } from 'events';

export const syncEmitter = new EventEmitter();

// Set max listeners to 0 to allow unlimited concurrent SSE connections without warning traces
syncEmitter.setMaxListeners(0);

/**
 * Notify that a user's data (messages, status, etc.) has changed
 * so that active clients for that user can perform an incremental sync.
 */
export function notifyUserUpdate(userId: string) {
  if (!userId) return;
  console.log(`[SSE] Emitting update event for user: ${userId}`);
  syncEmitter.emit('update', userId);
}
