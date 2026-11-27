// Faisal CMS — jembatan aman untuk menulis posts.json ke GitHub.
// Token GitHub disimpan sebagai Supabase Secret bernama GITHUB_TOKEN.
// Token tidak pernah dikirim ke browser.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const OWNER = 'felixreuss29-eng';
const REPO = 'faisal.cms.com';
const BRANCH = 'main';
const PEMILIK = 'felixreuss29@gmail.com';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ error: 'Gunakan POST.' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    const gh = Deno.env.get('GITHUB_TOKEN');
    if (!url || !anon) return json({ error: 'Konfigurasi Supabase belum lengkap.' }, 500);
    if (!gh) return json({ error: 'Secret GITHUB_TOKEN belum dipasang di Supabase.' }, 500);

    const isi = await req.json();
    const dariHeader = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    const token = dariHeader || String(isi?.token || '').trim();
    if (!token) return json({ error: 'Token sesi pemilik belum dikirim.' }, 401);

    const { data: sesi } = await createClient(url, anon).auth.getUser(token);
    if (String(sesi?.user?.email || '').toLowerCase() !== PEMILIK) {
      return json({ error: 'Hanya pemilik Faisal yang boleh menulis postingan.' }, 403);
    }

    const aksi = String(isi?.aksi || '').trim();
    const path = String(isi?.path || '').replace(/^\/+/, '');
    const pesan = String(isi?.message || 'Perbaruan postingan Faisal').slice(0, 200);
    const sha = String(isi?.sha || '').trim();
    const content = String(isi?.content || '').replace(/\s/g, '');
    const headers = {
      Authorization: 'Bearer ' + gh,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };
    const dasar = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;

    let respons: Response;
    if (aksi === 'cek') {
      respons = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}`, { headers });
    } else if (aksi === 'baca') {
      if (!path) return json({ error: 'Path wajib diisi.' }, 400);
      respons = await fetch(`${dasar}/${encodeURI(path)}?ref=${encodeURIComponent(BRANCH)}`, { headers });
      if (respons.status === 404) return json({ data: null });
    } else if (aksi === 'tulis') {
      if (!path || !content) return json({ error: 'Path dan isi wajib diisi.' }, 400);
      const badan: Record<string, string> = { message: pesan, content, branch: BRANCH };
      if (sha) badan.sha = sha;
      respons = await fetch(`${dasar}/${encodeURI(path)}`, {
        method: 'PUT', headers, body: JSON.stringify(badan)
      });
    } else if (aksi === 'hapus') {
      if (!path || !sha) return json({ error: 'Path dan SHA wajib diisi.' }, 400);
      respons = await fetch(`${dasar}/${encodeURI(path)}`, {
        method: 'DELETE', headers,
        body: JSON.stringify({ message: pesan, sha, branch: BRANCH })
      });
    } else {
      return json({ error: 'Aksi tidak dikenali.' }, 400);
    }

    const teks = await respons.text();
    let data: unknown = teks;
    try { data = JSON.parse(teks); } catch { /* balasan bukan JSON */ }
    if (!respons.ok) {
      const rincian = (data as { message?: string })?.message || 'GitHub menolak permintaan.';
      return json({ error: rincian, status: respons.status }, respons.status);
    }
    return json({ data });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Kesalahan server.' }, 500);
  }
});
