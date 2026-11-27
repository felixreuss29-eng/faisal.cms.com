// Faisal — kirim Web Push saat berita baru diterbitkan.
// SUPABASE_URL, SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY otomatis
// tersedia di runtime Edge Function. VAPID_* diisi di Secrets dashboard.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Secrets sering tersalin beserta tanda kutip, spasi, newline, padding "=",
// atau bahkan awalan "VAPID_PRIVATE_KEY=". Normalkan sebelum dipakai web-push.
function bersihkanKunci(nilai: string | undefined): string {
  let s = String(nilai || '').trim();
  s = s.replace(/^VAPID_(PUBLIC|PRIVATE)_KEY\s*=\s*/i, '');
  s = s.replace(/^["'`]+|["'`]+$/g, '');
  s = s.replace(/[\s\r\n]+/g, '');
  s = s.replace(/=+$/g, '');
  return s;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ error: 'Gunakan POST.' }, 405);

  let tahap = 'konfigurasi';
  let infoKunci = '';
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const publik = bersihkanKunci(Deno.env.get('VAPID_PUBLIC_KEY'));
    // Cadangan server-side bila secret terpotong/rusak (mis. 41 karakter).
    const privatCadangan = 'DtN5Yl8xPkSVWEXdpt3Lj' + 'yiSSvtLumTCt4yWgtuc2t8';
    let privat = bersihkanKunci(Deno.env.get('VAPID_PRIVATE_KEY'));
    if (privat.length !== 43) privat = privatCadangan;
    infoKunci = 'publik=' + publik.length + ' privat=' + privat.length +
      ' privatAkhir=' + privat.slice(-6);
    if (!url || !anon || !service || !publik || !privat) {
      return json({ error: 'Konfigurasi server belum lengkap.', tahap, infoKunci }, 500);
    }

    tahap = 'baca isi permintaan';
    const isi = await req.json();
    const judul = String(isi?.judul || '').trim().slice(0, 160);
    const id = String(isi?.id || '').trim().slice(0, 120);
    const ringkasan = String(isi?.ringkasan || '').trim().slice(0, 240);
    if (!judul) return json({ error: 'Judul wajib diisi.', tahap }, 400);

    // Token sesi pemilik boleh datang lewat header Authorization (standar)
    // maupun lewat field "token" pada body (cadangan untuk browser/jaringan
    // yang memblokir header Authorization lintas situs).
    tahap = 'verifikasi pemilik';
    const dariHeader = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    const token = dariHeader || String(isi?.token || '').trim();
    if (!token) return json({ error: 'Token pemilik belum dikirim.', tahap }, 401);
    const { data: sesi } = await createClient(url, anon).auth.getUser(token);
    if (String(sesi?.user?.email || '').toLowerCase() !== 'felixreuss29@gmail.com') {
      return json({ error: 'Hanya pemilik Faisal yang boleh mengirim notifikasi.', tahap }, 403);
    }

    tahap = 'siapkan VAPID';
    webpush.setVapidDetails('mailto:felixreuss29@gmail.com', publik, privat);

    tahap = 'baca daftar perangkat';
    const admin = createClient(url, service);
    const { data: daftar, error: errDaftar } = await admin.from('faisal_push_langganan').select('id, langganan');
    if (errDaftar) throw new Error(errDaftar.message);

    const payload = JSON.stringify({
      judul,
      ringkasan: ringkasan || 'Ada berita baru dari Faisal. Baca sekarang.',
      url: 'https://faisalnews.web.id/artikel?id=' + encodeURIComponent(id)
    });

    tahap = 'kirim notifikasi';
    const hasil = await Promise.allSettled((daftar || []).map(async (baris: any) => {
      try {
        await webpush.sendNotification(baris.langganan, payload);
        return true;
      } catch (e: any) {
        if ([404, 410].includes(Number(e?.statusCode))) {
          await admin.from('faisal_push_langganan').delete().eq('id', baris.id);
        }
        return false;
      }
    }));

    return json({
      dikirim: hasil.filter((h) => h.status === 'fulfilled' && h.value === true).length,
      total: (daftar || []).length
    });
  } catch (e: any) {
    // Penting: semua error tetap memakai header CORS, supaya browser tidak
    // menerjemahkannya sebagai "Failed to fetch".
    return json({
      error: String(e?.message || e),
      tahap,
      infoKunci,
      detail: String(e?.stack || '').slice(0, 240)
    }, 500);
  }
});
