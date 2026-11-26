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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ error: 'Gunakan POST.' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const publik = Deno.env.get('VAPID_PUBLIC_KEY');
  const privat = Deno.env.get('VAPID_PRIVATE_KEY');
  if (!url || !anon || !service || !publik || !privat) {
    return json({ error: 'Konfigurasi server belum lengkap.' }, 500);
  }

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  const { data: sesi } = await createClient(url, anon).auth.getUser(token);
  if (String(sesi?.user?.email || '').toLowerCase() !== 'felixreuss29@gmail.com') {
    return json({ error: 'Hanya pemilik Faisal yang boleh mengirim notifikasi.' }, 403);
  }

  const isi = await req.json();
  const judul = String(isi?.judul || '').trim().slice(0, 160);
  const id = String(isi?.id || '').trim().slice(0, 120);
  const ringkasan = String(isi?.ringkasan || '').trim().slice(0, 240);
  if (!judul) return json({ error: 'Judul wajib diisi.' }, 400);

  webpush.setVapidDetails('mailto:felixreuss29@gmail.com', publik, privat);
  const admin = createClient(url, service);
  const { data: daftar } = await admin.from('faisal_push_langganan').select('id, langganan');
  const payload = JSON.stringify({
    judul,
    ringkasan: ringkasan || 'Ada berita baru dari Faisal. Baca sekarang.',
    url: 'https://felixreuss29-eng.github.io/faisal.cms.com/artikel?id=' + encodeURIComponent(id)
  });

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
});
