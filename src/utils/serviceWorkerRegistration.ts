// Service Worker registration & offline maritime sync utility

export interface ServiceWorkerCacheStatus {
  isRegistered: boolean;
  isServiceWorkerReady: boolean;
  hasSchedulesCached: boolean;
  schedulesCount: number;
  tripsCount: number;
  hasPassengerTicketsCached: boolean;
  ticketsCount: number;
  lastUpdated: string | null;
}

type StatusListener = (status: ServiceWorkerCacheStatus) => void;
const listeners: Set<StatusListener> = new Set();

let currentStatus: ServiceWorkerCacheStatus = {
  isRegistered: false,
  isServiceWorkerReady: false,
  hasSchedulesCached: false,
  schedulesCount: 0,
  tripsCount: 0,
  hasPassengerTicketsCached: false,
  ticketsCount: 0,
  lastUpdated: null,
};

function notifyListeners() {
  listeners.forEach((listener) => listener({ ...currentStatus }));
}

export function subscribeSWStatus(listener: StatusListener): () => void {
  listeners.add(listener);
  listener({ ...currentStatus });
  return () => {
    listeners.delete(listener);
  };
}

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.info('[SW] Service workers not supported in this environment');
    return Promise.resolve(null);
  }

  return navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      console.log('[SW] ServiceWorker registered with scope:', registration.scope);
      currentStatus.isRegistered = true;

      if (registration.active) {
        currentStatus.isServiceWorkerReady = true;
        queryCacheStatus();
      }

      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'activated') {
              currentStatus.isServiceWorkerReady = true;
              queryCacheStatus();
              notifyListeners();
            }
          });
        }
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'OFFLINE_CACHE_STATUS_RESPONSE') {
          currentStatus.hasSchedulesCached = event.data.hasSchedules;
          currentStatus.schedulesCount = event.data.schedulesCount;
          currentStatus.tripsCount = event.data.tripsCount;
          currentStatus.hasPassengerTicketsCached = event.data.hasPassengerTickets;
          currentStatus.ticketsCount = event.data.ticketsCount;
          currentStatus.lastUpdated = event.data.lastUpdated;
          notifyListeners();
        }
      });

      notifyListeners();
      return registration;
    })
    .catch((error) => {
      console.warn('[SW] ServiceWorker registration error:', error);
      return null;
    });
}

export function queryCacheStatus() {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'GET_OFFLINE_CACHE_STATUS',
    });
  }
}

export function cacheSchedulesInServiceWorker(routes: any[], trips: any[], ports: any[], ferries: any[]) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const payload = {
    routes,
    trips,
    ports,
    ferries,
    timestamp: Date.now(),
  };

  // 1. Post to active Service Worker controller
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_FERRY_SCHEDULES',
      payload,
    });
  }

  // 2. Also direct CacheStorage API backup for instant availability
  if ('caches' in window) {
    caches.open('ferryflow-schedules-v2').then((cache) => {
      const scheduleRes = new Response(JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json', 'X-FerryFlow-Cache': 'DIRECT-PUT' },
      });
      const routesRes = new Response(JSON.stringify({ routes, timestamp: Date.now() }), {
        headers: { 'Content-Type': 'application/json' },
      });
      const tripsRes = new Response(JSON.stringify({ trips, timestamp: Date.now() }), {
        headers: { 'Content-Type': 'application/json' },
      });

      return Promise.all([
        cache.put('/api/schedules', scheduleRes.clone()),
        cache.put('/api/offline/schedules', scheduleRes),
        cache.put('/api/routes', routesRes),
        cache.put('/api/trips', tripsRes),
      ]);
    }).catch((e) => console.warn('[SW] Direct cache put warning:', e));
  }

  currentStatus.hasSchedulesCached = true;
  currentStatus.schedulesCount = routes.length;
  currentStatus.tripsCount = trips.length;
  currentStatus.lastUpdated = new Date().toLocaleTimeString();
  notifyListeners();
}

export function cachePassengerTicketsInServiceWorker(bookings: any[]) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const payload = {
    bookings,
    timestamp: Date.now(),
  };

  // 1. Post to active Service Worker controller
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_PASSENGER_STATE',
      payload,
    });
  }

  // 2. Direct CacheStorage API backup
  if ('caches' in window) {
    caches.open('ferryflow-passenger-v2').then((cache) => {
      const res = new Response(JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json' },
      });
      cache.put('/api/offline/passenger-dashboard', res);
    }).catch((e) => console.warn('[SW] Direct passenger cache put warning:', e));
  }

  currentStatus.hasPassengerTicketsCached = true;
  currentStatus.ticketsCount = bookings.length;
  currentStatus.lastUpdated = new Date().toLocaleTimeString();
  notifyListeners();
}
