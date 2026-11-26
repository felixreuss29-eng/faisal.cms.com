// Faisal — kirim Web Push saat berita baru diterbitkan.
// Deploy: supabase functions deploy kirim-notifikasi
// Rahasia (VAPID privat & service_role) hanya disimpan sebagai Supabase secret.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SITUS = 'https://felixreuss29-eng.github.io/faisal.cms.com';
const PEMILIK = 'felixreuss29@gmail.com';

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

  // SUPABASE_URL, SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY
  // disuntikkan otomatis oleh runtime Edge Function Supabase.
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const publik = Deno.env.get('VAPID_PUBLIC_KEY');
  const privat = Deno.env.get('VAPID_PRIVATE_KEY');
  const subject = Deno.env.get('VAPID_SUBJECT') || `mailto:${PEMILIK}`;
  if (!url || !anon || !service || !publik || !privat) {
    return json({ error: 'Konfigurasi server belum lengkap.' }, 500);
  }

  const header = req.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'Sesi pemilik diperlukan.' }, 401);
  const pembaca = createClient(url, anon);
  const { data: userData, error: authError } = await pembaca.auth.getUser(token);
  if (authError || String(userData.user?.email || '').toLowerCase() !== PEMILIK) {
    return json({ error: 'Hanya pemilik Faisal yang boleh mengirim notifikasi.' }, 403);
  }

  let isi: Record<string, unknown>;
  try { isi = await req.json(); }
  catch { return json({ error: 'Isi permintaan bukan JSON.' }, 400); }

  const judul = String(isi.judul || '').trim().slice(0, 160);
  const id = String(isi.id || '').trim().slice(0, 120);
  const ringkasan = String(isi.ringkasan || '').trim().slice(0, 240);
  if (!judul) return json({ error: 'Judul wajib diisi.' }, 400);

  webpush.setVapidDetails(subject, publik, privat);
  const admin = createClient(url, service);
  const { data: langganan, error: dbError } = await admin
    .from('faisal_push_langganan')
    .select('id, langganan');
  if (dbError) return json({ error: dbError.message }, 500);

  const payload = JSON.stringify({
    judul,
    ringkasan: ringkasan || 'Ada berita baru dari Faisal. Baca sekarang.',
    url: `${SITUS}/artikel?id=${encodeURIComponent(id)}`
  });

  const hasil = await Promise.allSettled((langganan || []).map(async (baris) => {
    try {
      await webpush.sendNotification(baris.langganan, payload);
      return true;
    } catch (e: any) {
      const kode = Number(e?.statusCode || 0);
      if (kode === 404 || kode === 410) {
        await admin.from('faisal_push_langganan').delete().eq('id', baris.id);
      }
      return false;
    }
  }));

  return json({
    dikirim: hasil.filter((h) => h.status === 'fulfilled' && h.value === true).length,
    total: hasil.length
  });
});
