/* ProposalFast service worker.
 * Network-first for hashed static assets and icons only.
 * Documents, auth, and API routes are never intercepted, so sessions,
 * server actions, and Stripe webhooks stay on the network.
 */
const CACHE_NAME = "proposalfast-static-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(path) {
  return (
    path.startsWith("/_next/static/") ||
    path.startsWith("/icons/") ||
    path === "/logo.svg"
  );
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === "basic" && response.status !== 206) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  // Leave auth, API, RSC, and navigations to the network untouched.
  if (
    path.startsWith("/api/") ||
    path.startsWith("/auth") ||
    request.mode === "navigate" ||
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Action") ||
    request.headers.get("Next-Router-Prefetch")
  ) {
    return;
  }

  if (!isStaticAsset(path)) return;

  event.respondWith(networkFirst(request));
});
