/* ============================================================
   Faisal — service worker untuk notifikasi berita baru.
   Hanya menampilkan notifikasi yang dikirim Edge Function
   Supabase; tidak menyimpan konten artikel di cache.
   ============================================================ */
const SITUS = 'https://faisalnews.web.id/';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try { data = event.data.json(); }
    catch { data = { ringkasan: event.data.text() }; }
  }
  const judul = String(data.judul || 'Berita baru dari Faisal').slice(0, 120);
  const isi = String(data.ringkasan || 'Ada berita baru. Baca sekarang.').slice(0, 240);
  const ikon = new URL('assets/img/favicon.png?v=32', self.registration.scope).href;
  const tujuan = new URL(data.url || SITUS + 'artikel', self.location.origin).href;
  event.waitUntil(self.registration.showNotification(judul, {
    body: isi,
    icon: ikon,
    badge: ikon,
    tag: 'faisal-berita-' + String(data.id || Date.now()),
    data: { url: tujuan },
    lang: 'id'
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const tujuan = (event.notification.data && event.notification.data.url) || SITUS;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((daftar) => {
    for (const klien of daftar) {
      if ('focus' in klien) {
        klien.navigate(tujuan);
        return klien.focus();
      }
    }
    return self.clients.openWindow(tujuan);
  }));
});
