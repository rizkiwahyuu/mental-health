// Cortisoul Service Worker — Web Push Notification Handler
// File ini harus berada di /public/sw.js agar bisa diakses di root domain

self.addEventListener("install", (event) => {
  console.log("[SW] Installing Cortisoul service worker...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Cortisoul service worker activated.");
  event.waitUntil(self.clients.claim());
});

// Tangani push notification yang masuk dari server
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Cortisoul", body: event.data?.text() || "Ada pengingat untukmu!" };
  }

  const title = data.title || "Cortisoul 💙";
  const options = {
    body: data.body || "Sudahkah kamu menulis jurnal hari ini?",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.tag || "cortisoul-notification",
    data: data.url ? { url: data.url } : {},
    actions: [
      { action: "open", title: "Tulis Jurnal", icon: "/favicon.ico" },
      { action: "close", title: "Nanti Saja" },
    ],
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Tangani klik pada notifikasi
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/journal/new";

  if (event.action === "close") return;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Jika ada tab Cortisoul yang sudah terbuka, fokus ke sana
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // Jika tidak ada tab yang terbuka, buka tab baru
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
