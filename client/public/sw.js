const CACHE_NAME = 'memoai-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline recordings
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncRecordings());
  }
});

async function syncRecordings() {
  try {
    // Get pending recordings from IndexedDB
    const db = await openDB();
    const transaction = db.transaction(['recordings'], 'readonly');
    const store = transaction.objectStore('recordings');
    const recordings = await store.getAll();
    
    // Sync recordings that haven't been uploaded
    for (const recording of recordings) {
      if (!recording.synced) {
        try {
          await fetch('/api/recordings', {
            method: 'POST',
            body: JSON.stringify(recording),
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          // Mark as synced
          const updateTransaction = db.transaction(['recordings'], 'readwrite');
          const updateStore = updateTransaction.objectStore('recordings');
          recording.synced = true;
          await updateStore.put(recording);
        } catch (error) {
          console.error('Failed to sync recording:', error);
        }
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MemoAI', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
