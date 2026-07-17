/**
 * Helper to convert VAPID public key from URL-safe base64 to Uint8Array for Web Push subscription.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  try {
    if (!base64String || typeof base64String !== 'string') {
      return new Uint8Array(0);
    }
    const cleanBase64String = base64String.trim();
    if (!cleanBase64String) {
      return new Uint8Array(0);
    }
    const padding = '='.repeat((4 - (cleanBase64String.length % 4)) % 4);
    const base64 = (cleanBase64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (err) {
    console.warn('[PWA] urlBase64ToUint8Array failed safely:', err);
    return new Uint8Array(0);
  }
}
