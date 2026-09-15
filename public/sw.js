// FerryFlow Maritime Service Worker v2.0
// Provides robust offline caching of route schedules, passenger bookings, and dashboard states
// ensures seamless access even when sailing across Mumbai Harbour beyond cellular range.

const CACHE_NAME = 'ferryflow-maritime-cache-v2';
const SCHEDULES_CACHE = 'ferryflow-schedules-v2';
const PASSENGER_CACHE = 'ferryflow-passenger-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/metadata.json',
  '/manifest.json',
];

// Fallback emergency schedule data if cache is empty during sudden network drop
const EMERGENCY_FALLBACK_SCHEDULES = {
  source: 'service-worker-offline-fallback',
  offline: true,
  cachedAt: new Date().toISOString(),
  routes: [
    {
      id: 'route-gateway-mandwa',
      name: 'Gateway Terminal ⇄ Riverfront (Mandwa)',
      originPortId: 'port-gateway',
      destinationPortId: 'port-riverfront',
      distanceKm: 19.4,
      estimatedDurationMin: 45,
      baseFareInr: 180,
      vehicleFareInr: 850,
      status: 'active',
    },
    {
      id: 'route-gateway-island',
      name: 'Gateway Terminal ⇄ Island Terminal (Elephanta)',
      originPortId: 'port-gateway',
      destinationPortId: 'port-island',
      distanceKm: 11.2,
      estimatedDurationMin: 35,
      baseFareInr: 140,
      vehicleFareInr: 0,
      status: 'active',
    },
    {
      id: 'route-harbor-island',
      name: 'Harbor Point (Belapur) ⇄ Island Terminal',
      originPortId: 'port-harbor',
      destinationPortId: 'port-island',
      distanceKm: 13.8,
      estimatedDurationMin: 30,
      baseFareInr: 160,
      vehicleFareInr: 0,
      status: 'active',
    },
  ],
  trips: [
    {
      id: 'trip-101',
      tripNumber: 'FF-101',
      routeId: 'route-gateway-mandwa',
      ferryId: 'ferry-101',
      originPortId: 'port-gateway',
      destinationPortId: 'port-riverfront',
      departureTime: '14:30',
      scheduledArrivalTime: '15:15',
      estimatedArrivalTime: '15:15',
      delayMinutes: 0,
      status: 'boarding',
      passengerCapacity: 250,
      bookedPassengers: 142,
      vehicleCapacity: 30,
      bookedVehicles: 18,
    },
    {
      id: 'trip-102',
      tripNumber: 'FF-102',
      routeId: 'route-gateway-mandwa',
      ferryId: 'ferry-102',
      originPortId: 'port-riverfront',
      destinationPortId: 'port-gateway',
      departureTime: '14:45',
      scheduledArrivalTime: '15:30',
      estimatedArrivalTime: '15:38',
      delayMinutes: 8,
      status: 'in_transit',
      passengerCapacity: 200,
      bookedPassengers: 116,
      vehicleCapacity: 24,
      bookedVehicles: 12,
    },
    {
      id: 'trip-103',
      tripNumber: 'FF-103',
      routeId: 'route-gateway-island',
      ferryId: 'ferry-103',
      originPortId: 'port-gateway',
      destinationPortId: 'port-island',
      departureTime: '15:00',
      scheduledArrivalTime: '15:35',
      estimatedArrivalTime: '15:35',
      delayMinutes: 0,
      status: 'scheduled',
      passengerCapacity: 120,
      bookedPassengers: 88,
      vehicleCapacity: 0,
      bookedVehicles: 0,
    },
  ],
};

// Install Event: Precache static core app shell and prime initial offline schedules
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('[FerryFlow SW] Pre-caching static assets non-blocking warning:', err);
        });
      }),
      caches.open(SCHEDULES_CACHE).then((cache) => {
        const res = new Response(JSON.stringify(EMERGENCY_FALLBACK_SCHEDULES), {
          headers: { 'Content-Type': 'application/json', 'X-FerryFlow-Cache': 'INITIAL_PRECACHE' },
        });
        return Promise.all([
          cache.put('/api/schedules', res.clone()),
          cache.put('/api/offline/schedules', res.clone()),
        ]);
      }),
    ]).then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup stale cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (![CACHE_NAME, SCHEDULES_CACHE, PASSENGER_CACHE].includes(key)) {
            console.log('[FerryFlow SW] Removing stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message Event: Receive critical schedule & passenger offline snapshot from React state
self.addEventListener('message', (event) => {
  if (!event.data) return;

  const { type, payload } = event.data;

  if (type === 'CACHE_FERRY_SCHEDULES') {
    // Cache complete routes and schedules payload in multiple endpoints
    caches.open(SCHEDULES_CACHE).then((cache) => {
      const timestamp = new Date().toISOString();
      const schedulesPayload = {
        ...payload,
        cachedAt: timestamp,
        source: 'service-worker-cache',
        version: '2.0-maritime-offline',
      };

      const schedulesResponse = new Response(JSON.stringify(schedulesPayload), {
        headers: { 'Content-Type': 'application/json', 'X-FerryFlow-Cache': 'CACHE-HIT' },
      });

      const routesResponse = new Response(JSON.stringify({
        routes: payload.routes || [],
        timestamp,
        source: 'service-worker-cache',
      }), {
        headers: { 'Content-Type': 'application/json', 'X-FerryFlow-Cache': 'CACHE-HIT' },
      });

      const tripsResponse = new Response(JSON.stringify({
        trips: payload.trips || [],
        timestamp,
        source: 'service-worker-cache',
      }), {
        headers: { 'Content-Type': 'application/json', 'X-FerryFlow-Cache': 'CACHE-HIT' },
      });

      return Promise.all([
        cache.put('/api/schedules', schedulesResponse.clone()),
        cache.put('/api/offline/schedules', schedulesResponse.clone()),
        cache.put('/api/routes', routesResponse),
        cache.put('/api/trips', tripsResponse),
      ]).then(() => {
        console.log('[FerryFlow SW] Successfully cached route schedules to Service Worker');
      });
    });
  }

  if (type === 'CACHE_PASSENGER_STATE') {
    // Cache passenger tickets and offline dashboard snapshot
    caches.open(PASSENGER_CACHE).then((cache) => {
      const response = new Response(JSON.stringify({
        ...payload,
        cachedAt: new Date().toISOString(),
        version: '2.0-passenger-tickets',
      }), {
        headers: { 'Content-Type': 'application/json', 'X-FerryFlow-Cache': 'CACHE-HIT' },
      });
      cache.put('/api/offline/passenger-dashboard', response);
      console.log('[FerryFlow SW] Successfully cached passenger tickets & state to Service Worker');
    });
  }

  if (type === 'GET_OFFLINE_CACHE_STATUS') {
    Promise.all([
      caches.open(SCHEDULES_CACHE).then(c => c.match('/api/schedules').then(r => r || c.match('/api/offline/schedules'))),
      caches.open(PASSENGER_CACHE).then(c => c.match('/api/offline/passenger-dashboard')),
    ]).then(async ([schedulesRes, passengerRes]) => {
      const schedulesData = schedulesRes ? await schedulesRes.json() : null;
      const passengerData = passengerRes ? await passengerRes.json() : null;

      event.source.postMessage({
        type: 'OFFLINE_CACHE_STATUS_RESPONSE',
        hasSchedules: !!schedulesData,
        schedulesCount: schedulesData?.routes?.length || 0,
        tripsCount: schedulesData?.trips?.length || 0,
        hasPassengerTickets: !!passengerData,
        ticketsCount: passengerData?.bookings?.length || 0,
        lastUpdated: schedulesData?.cachedAt || passengerData?.cachedAt || null,
      });
    });
  }
});

// Helper to check if a request is for ferry schedule data
function isFerryScheduleApi(url) {
  const p = url.pathname;
  return (
    p === '/api/schedules' ||
    p === '/api/routes' ||
    p === '/api/trips' ||
    p === '/api/offline/schedules' ||
    p === '/api/live-schedules'
  );
}

// Fetch Event: Network-First with Offline Cache Fallback for Ferry Schedules
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Handle Ferry Schedule APIs: Network-first, cached view fallback when offline
  if (isFerryScheduleApi(url)) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(SCHEDULES_CACHE).then((cache) => {
              cache.put(event.request, clone);
              // Also sync to general /api/schedules if it was a schedule call
              if (url.pathname === '/api/schedules') {
                cache.put('/api/offline/schedules', networkResponse.clone());
              }
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Network unavailable: Provide cached view for ferry schedules
          console.info('[FerryFlow SW] Network offline. Serving cached view for schedule:', url.pathname);
          const cache = await caches.open(SCHEDULES_CACHE);
          let cachedResponse = await cache.match(event.request);

          if (!cachedResponse) {
            // Try matching normalized /api/schedules or /api/offline/schedules
            cachedResponse = await cache.match('/api/schedules') || await cache.match('/api/offline/schedules');
          }

          if (cachedResponse) {
            const data = await cachedResponse.json();
            const headers = new Headers(cachedResponse.headers);
            headers.set('X-FerryFlow-Cache', 'HIT-OFFLINE');
            headers.set('X-FerryFlow-Offline', 'true');
            headers.set('Content-Type', 'application/json');

            // If a specific sub-resource was requested (e.g., /api/routes or /api/trips)
            let returnData = data;
            if (url.pathname === '/api/routes' && data.routes) {
              returnData = { routes: data.routes, cached: true, offline: true, timestamp: data.cachedAt };
            } else if (url.pathname === '/api/trips' && data.trips) {
              returnData = { trips: data.trips, cached: true, offline: true, timestamp: data.cachedAt };
            }

            return new Response(JSON.stringify(returnData), {
              status: 200,
              statusText: 'OK (Offline Cache)',
              headers,
            });
          }

          // Emergency fallback if no cache entry exists yet
          return new Response(JSON.stringify(EMERGENCY_FALLBACK_SCHEDULES), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-FerryFlow-Cache': 'EMERGENCY_FALLBACK',
              'X-FerryFlow-Offline': 'true',
            },
          });
        })
    );
    return;
  }

  // 2. Handle Passenger Offline Tickets Dashboard
  if (url.pathname === '/api/offline/passenger-dashboard') {
    event.respondWith(
      caches.open(PASSENGER_CACHE).then(async (cache) => {
        const cached = await cache.match('/api/offline/passenger-dashboard');
        return cached || new Response(JSON.stringify({ bookings: [] }), {
          headers: { 'Content-Type': 'application/json', 'X-FerryFlow-Cache': 'EMPTY_DEFAULT' },
        });
      })
    );
    return;
  }

  // 3. Navigation requests: Network-first, fallback to cached app shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 4. Static assets: Cache-first with background revalidation
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Revalidate in background if online
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        return new Response('Network unavailable (FerryFlow Offline Maritime Mode)', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      });
    })
  );
});
