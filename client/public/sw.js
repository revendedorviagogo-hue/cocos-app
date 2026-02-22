/**
 * SERVICE WORKER - PWA COCOS
 * 
 * Gerencia cache, offline mode, e sincronização de dados
 */

const CACHE_NAME = 'cocos-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-192.png',
  '/logo-512.png',
  '/maskable_icon.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache aberto, adicionando assets...');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[SW] Erro ao cachear alguns assets:', err);
        // Continuar mesmo se alguns assets falharem
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de cache: Network First, Fall back to Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar requisições para APIs externas
  if (url.origin !== location.origin) {
    return;
  }

  // Para HTML, usar Network First
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a resposta bem-sucedida
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Se falhar, tentar cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Usando cache para:', request.url);
              return cachedResponse;
            }
            // Se não tiver no cache, retornar página offline
            return caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Para outros assets, usar Cache First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        // Cache respostas bem-sucedidas
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Sincronização em background (quando voltar online)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    console.log('[SW] Sincronizando dados...');
    // Aqui você pode adicionar lógica para sincronizar dados com o servidor
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Erro ao sincronizar:', error);
    return Promise.reject(error);
  }
}

// Notificações push
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nova notificação',
      icon: '/logo-192.png',
      badge: '/logo-192.png',
      tag: 'cocos-notification',
      requireInteraction: false
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'Cocos', options)
    );
  }
});

// Click em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event);
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Se janela já aberta, focar nela
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === '/' && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      // Senão, abrir nova janela
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

console.log('[SW] Service Worker carregado');
