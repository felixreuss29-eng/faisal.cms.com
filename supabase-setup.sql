-- Faisal CMS — skema Supabase: donasi, komentar publik, dan statistik kunjungan
-- Jalankan file ini di Supabase Dashboard → SQL Editor → New query → Run

-- 1. Tabel pengajuan langganan
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nama text not null,
  wa text not null,
  paket text not null,
  jumlah integer not null,
  bukti_path text,
  status text not null default 'menunggu'
    check (status in ('menunggu', 'aktif', 'ditolak')),
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- 2. Pembaca hanya melihat pengajuannya sendiri
drop policy if exists "pembaca lihat sendiri" on public.subscriptions;
create policy "pembaca lihat sendiri" on public.subscriptions
for select to authenticated
using (email = auth.jwt() ->> 'email');

-- 3. Pembaca bisa mengajukan langganan
drop policy if exists "pembaca ajukan" on public.subscriptions;
create policy "pembaca ajukan" on public.subscriptions
for insert to authenticated
with check (email = auth.jwt() ->> 'email');

-- 4. Pemilik bisa melihat dan mengubah semua pengajuan
drop policy if exists "pemilik kelola" on public.subscriptions;
create policy "pemilik kelola" on public.subscriptions
for all to authenticated
using (auth.jwt() ->> 'email' = 'felixreuss29@gmail.com')
with check (auth.jwt() ->> 'email' = 'felixreuss29@gmail.com');

-- 5. Bucket privat untuk bukti transfer
insert into storage.buckets (id, name, public)
values ('bukti', 'bukti', false)
on conflict (id) do nothing;

-- 6. Upload bukti hanya ke folder email sendiri
drop policy if exists "upload bukti sendiri" on storage.objects;
create policy "upload bukti sendiri" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'bukti'
  and (storage.foldername(name))[1] = auth.jwt() ->> 'email'
);

-- 7. Bukti bisa dilihat oleh pemilik atau pemilik file-nya
drop policy if exists "lihat bukti sendiri" on storage.objects;
create policy "lihat bukti sendiri" on storage.objects
for select to authenticated
using (
  bucket_id = 'bukti'
  and (
    (storage.foldername(name))[1] = auth.jwt() ->> 'email'
    or auth.jwt() ->> 'email' = 'felixreuss29@gmail.com'
  )
);

-- 8. Pemilik bisa mengelola semua bukti
drop policy if exists "pemilik kelola bukti" on storage.objects;
create policy "pemilik kelola bukti" on storage.objects
for all to authenticated
using (bucket_id = 'bukti' and auth.jwt() ->> 'email' = 'felixreuss29@gmail.com')
with check (bucket_id = 'bukti' and auth.jwt() ->> 'email' = 'felixreuss29@gmail.com');

-- ============================================================
-- KOMENTAR PUBLIK
-- Komentar langsung tampil untuk semua pembaca. Pemilik yang masuk
-- dengan Supabase Auth boleh menghapus komentar yang tidak pantas.
-- ============================================================

-- 9. Tabel komentar
create table if not exists public.faisal_komentar (
  id uuid primary key default gen_random_uuid(),
  artikel_id text not null,
  nama text not null check (char_length(nama) between 1 and 40),
  teks text not null check (char_length(teks) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.faisal_komentar enable row level security;

-- 10. Semua orang boleh membaca komentar
drop policy if exists "komentar dibaca semua" on public.faisal_komentar;
create policy "komentar dibaca semua" on public.faisal_komentar
for select to anon, authenticated
using (true);

-- 11. Semua orang boleh mengirim komentar (batasan panjang ada di tabel)
drop policy if exists "komentar ditulis pembaca" on public.faisal_komentar;
create policy "komentar ditulis pembaca" on public.faisal_komentar
for insert to anon, authenticated
with check (true);

-- 12. Hanya pemilik yang boleh menghapus komentar
drop policy if exists "pemilik hapus komentar" on public.faisal_komentar;
create policy "pemilik hapus komentar" on public.faisal_komentar
for delete to authenticated
using (auth.jwt() ->> 'email' = 'felixreuss29@gmail.com');

-- ============================================================
-- STATISTIK KUNJUNGAN
-- Satu pengunjung dihitung sekali per hari per halaman. Pengenal
-- pengunjung dibuat acak di browser, bukan nama atau alamat IP.
-- ============================================================

-- 13. Tabel kunjungan unik harian
create table if not exists public.faisal_statistik (
  id uuid primary key default gen_random_uuid(),
  pengunjung text not null,
  hari date not null,
  halaman text not null,
  jenis text not null check (jenis in ('situs', 'artikel')),
  created_at timestamptz not null default now(),
  constraint faisal_statistik_unik unique (pengunjung, hari, halaman)
);

alter table public.faisal_statistik enable row level security;

-- 14. Pengunjung hanya boleh mencatat kunjungannya sendiri
drop policy if exists "catat kunjungan" on public.faisal_statistik;
create policy "catat kunjungan" on public.faisal_statistik
for insert to anon, authenticated
with check (
  char_length(pengunjung) between 8 and 64
  and char_length(halaman) between 1 and 120
);

-- Tidak ada policy SELECT untuk anon: angka ringkas dibaca lewat fungsi di bawah.

-- 15. Ringkasan angka untuk dasbor (tanpa membuka data mentah pengunjung)
create or replace function public.faisal_ringkasan_statistik(hari_param date)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'pengunjungHariIni', (select count(*)::int from faisal_statistik where hari = hari_param and jenis = 'situs'),
    'pengunjungTotal', (select count(distinct pengunjung)::int from faisal_statistik),
    'tampilanArtikel', coalesce((
      select jsonb_object_agg(halaman, jumlah) from (
        select halaman, count(*)::int as jumlah
        from faisal_statistik where jenis = 'artikel' group by halaman
      ) x
    ), '{}'::jsonb),
    'tampilanArtikelTotal', (select count(*)::int from faisal_statistik where jenis = 'artikel'),
    'terbaru', coalesce((
      select jsonb_agg(jsonb_build_object(
        'halaman', halaman, 'jenis', jenis, 'waktu', created_at
      ) order by created_at desc) from (
        select halaman, jenis, created_at
        from faisal_statistik order by created_at desc limit 6
      ) y
    ), '[]'::jsonb)
  );
$$;

grant execute on function public.faisal_ringkasan_statistik(date) to anon, authenticated;
