/* Lynk Service Worker — Web Push + offline shell */
const CACHE_NAME = "lynk-v1";
const APP_URL = self.registration?.scope || "/";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "Lynk", body: "New notification", icon: "/icon.png", url: "/" };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (e) {
    try {
      data.body = event.data.text();
    } catch (_) {}
  }

  const options = {
    body: data.body || "",
    icon: data.icon || "/icon.png",
    badge: data.badge || data.icon || "/icon.png",
    image: data.image || undefined,
    data: { url: data.url || "/", ...data },
    vibrate: [120, 60, 120],
    tag: data.tag || "lynk-push",
    renotify: true,
    requireInteraction: false,
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Dismiss" }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title || "Lynk", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if ("focus" in client) {
          await client.focus();
          if (client.navigate) {
            try { await client.navigate(targetUrl); } catch (_) {}
          }
          client.postMessage({ type: "NOTIFICATION_CLICK", url: targetUrl });
          return;
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
