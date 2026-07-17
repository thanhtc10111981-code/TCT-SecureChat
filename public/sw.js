// Service Worker for Jira Software PWA
const CACHE_NAME = 'jira-software-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event (Network-First style for API/Dynamic content, Cache-First for static assets)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip caching for API requests and hot updates
  if (url.pathname.startsWith('/api') || url.hostname !== self.location.hostname) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Ignore network errors during background update */});
        
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback to index.html for SPA routes
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

// Compact IndexedDB Helper for badges
function getBadgeDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open('jira-pwa-badge-db', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('badgeStore')) {
        db.createObjectStore('badgeStore');
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = () => resolve(null);
  });
}

async function getBadgeCount() {
  const db = await getBadgeDB();
  if (!db) return 0;
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction('badgeStore', 'readonly');
      const store = transaction.objectStore('badgeStore');
      const request = store.get('count');
      request.onsuccess = () => resolve(request.result || 0);
      request.onerror = () => resolve(0);
    } catch (e) {
      resolve(0);
    }
  });
}

async function updateBadgeCount(count) {
  const db = await getBadgeDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction('badgeStore', 'readwrite');
      const store = transaction.objectStore('badgeStore');
      const request = store.put(count, 'count');
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    } catch (e) {
      resolve();
    }
  });
}

async function incrementBadgeCount() {
  const current = await getBadgeCount();
  const next = current + 1;
  await updateBadgeCount(next);
  if ('setAppBadge' in navigator) {
    await navigator.setAppBadge(next).catch(() => {});
  } else if ('setAppBadge' in self) {
    await self.setAppBadge(next).catch(() => {});
  }
}

async function resetBadgeCount() {
  await updateBadgeCount(0);
  if ('clearAppBadge' in navigator) {
    await navigator.clearAppBadge().catch(() => {});
  } else if ('clearAppBadge' in self) {
    await self.clearAppBadge().catch(() => {});
  }
}

// Push Notification Event
self.addEventListener('push', (event) => {
  let title = 'Jira Software';
  let body = 'Thông báo mới';
  let icon = '/icon.svg';
  let tag = 'jira-new-message';

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) title = data.title;
      if (data.body) body = data.body;
      if (data.icon) icon = data.icon;
      if (data.tag) tag = data.tag;
    } catch (e) {
      // If payload is plain text, use it as body
      const text = event.data.text();
      if (text) body = text;
    }
  }

  const options = {
    body: body,
    icon: icon,
    badge: icon,
    tag: tag,
    renotify: true,
    vibrate: [100, 50, 100],
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      incrementBadgeCount()
    ])
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window tab open with the same URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message Listener to handle clearing notifications from client-side
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'clear-notifications') {
    event.waitUntil(
      Promise.all([
        self.registration.getNotifications().then((notifications) => {
          if (notifications && notifications.length > 0) {
            notifications.forEach((notification) => {
              notification.close();
            });
          }
        }),
        resetBadgeCount()
      ])
    );
  }
});

