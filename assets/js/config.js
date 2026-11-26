/* ============================================================
   Faisal — konfigurasi tampilan publik
   ============================================================
   Pengambilan berita dari RSS pihak ketiga sudah dinonaktifkan.
   Seluruh berita berasal dari redaksi Faisal. File ini tetap dimuat
   agar halaman lama tidak menemukan skrip yang hilang, tetapi tidak
   lagi menyimpan pengaturan aktif.
   ============================================================ */
(function () {
  'use strict';
  window.FAISAL_CONFIG = window.FAISAL_CONFIG || {};

  // Kunci publik VAPID untuk Web Push. Aman dipublikasikan.
  // Kunci privatnya hanya disimpan sebagai Supabase secret di Edge Function.
  window.FAISAL_PUSH = {
    vapidPublicKey: 'BF5TrNW_zdE56fa28VIQFmlWdLjRJZG1mZbcKXJKoZtQGidXTFHeQjGdjb_D1ATqQXA1K11oiOe77_MxT8VE2Mw'
  };
})();
