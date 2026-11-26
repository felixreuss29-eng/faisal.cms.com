-- Faisal CMS — skema Supabase: komentar publik dan statistik kunjungan
-- Jalankan file ini di Supabase Dashboard → SQL Editor → New query → Run
--
-- Catatan: donasi adalah dukungan sukarela tanpa formulir, bukti, status,
-- maupun riwayat. Skema lama public.subscriptions dan bucket "bukti" sengaja
-- tidak dibuat lagi. Jika masih ada dari konfigurasi sebelumnya, hapus manual
-- di Supabase Dashboard setelah memastikan tidak ada data yang dibutuhkan.

-- ============================================================
-- KOMENTAR PUBLIK
-- Komentar langsung tampil untuk semua pembaca. Pemilik yang masuk
-- dengan Supabase Auth boleh menghapus komentar yang tidak pantas.
-- ============================================================

-- 1. Tabel komentar
create table if not exists public.faisal_komentar (
  id uuid primary key default gen_random_uuid(),
  artikel_id text not null,
  nama text not null check (char_length(nama) between 1 and 40),
  teks text not null check (char_length(teks) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.faisal_komentar enable row level security;

-- 2. Semua orang boleh membaca komentar
drop policy if exists "komentar dibaca semua" on public.faisal_komentar;
create policy "komentar dibaca semua" on public.faisal_komentar
for select to anon, authenticated
using (true);

-- 3. Semua orang boleh mengirim komentar (batasan panjang ada di tabel)
drop policy if exists "komentar ditulis pembaca" on public.faisal_komentar;
create policy "komentar ditulis pembaca" on public.faisal_komentar
for insert to anon, authenticated
with check (true);

-- 4. Hanya pemilik yang boleh menghapus komentar
drop policy if exists "pemilik hapus komentar" on public.faisal_komentar;
create policy "pemilik hapus komentar" on public.faisal_komentar
for delete to authenticated
using (auth.jwt() ->> 'email' = 'felixreuss29@gmail.com');

-- ============================================================
-- STATISTIK KUNJUNGAN
-- Satu pengunjung dihitung sekali per hari per halaman. Pengenal
-- pengunjung dibuat acak di browser, bukan nama atau alamat IP.
-- ============================================================

-- 5. Tabel kunjungan unik harian
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

-- 6. Pengunjung hanya boleh mencatat kunjungannya sendiri
drop policy if exists "catat kunjungan" on public.faisal_statistik;
create policy "catat kunjungan" on public.faisal_statistik
for insert to anon, authenticated
with check (
  char_length(pengunjung) between 8 and 64
  and char_length(halaman) between 1 and 120
);

-- Tidak ada policy SELECT untuk anon: angka ringkas dibaca lewat fungsi di bawah.

-- 7. Ringkasan angka untuk dasbor (tanpa membuka data mentah pengunjung)
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
