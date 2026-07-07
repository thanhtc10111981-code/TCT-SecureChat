let lastCheckedPermission = false;

if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
  try {
    navigator.permissions.query({ name: 'camera' as PermissionName })
      .then((result) => {
        lastCheckedPermission = result.state === 'granted';
        result.onchange = () => {
          lastCheckedPermission = result.state === 'granted';
        };
      })
      .catch((err) => {
        console.warn('Permissions query error:', err);
      });
  } catch (e) {
    console.warn('Permissions query catch:', e);
  }
}

export function getCameraPermissionSync(): boolean {
  return lastCheckedPermission;
}
