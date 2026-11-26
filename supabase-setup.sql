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

-- ============================================================
-- PENGIKUT PENULIS
-- Tombol "Ikuti" menyimpan pengenal acak browser + nama penulis.
-- Tidak ada policy SELECT/INSERT/DELETE langsung untuk anon:
-- semua akses lewat fungsi di bawah agar data mentah tidak terbuka.
-- ============================================================

-- 8. Tabel pengikut (satu baris per pengunjung per penulis)
create table if not exists public.faisal_pengikut (
  id uuid primary key default gen_random_uuid(),
  pengunjung text not null check (char_length(pengunjung) between 8 and 80),
  penulis text not null check (char_length(penulis) between 1 and 80),
  created_at timestamptz not null default now(),
  constraint faisal_pengikut_unik unique (pengunjung, penulis)
);

alter table public.faisal_pengikut enable row level security;

-- 9. Jumlah pengikut (hanya angka, tanpa daftar identitas)
create or replace function public.faisal_jumlah_pengikut(p_penulis text)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from public.faisal_pengikut
  where penulis = left(coalesce(p_penulis, ''), 80);
$$;

-- 10. Status ikuti untuk pengunjung ini
create or replace function public.faisal_status_ikuti(p_pengunjung text, p_penulis text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.faisal_pengikut
    where pengunjung = left(coalesce(p_pengunjung, ''), 80)
      and penulis = left(coalesce(p_penulis, ''), 80)
  );
$$;

-- 11. Simpan atau batalkan ikutan, lalu kembalikan jumlah terbaru
create or replace function public.faisal_simpan_ikuti(
  p_pengunjung text,
  p_penulis text,
  p_aktif boolean
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pengunjung text := left(coalesce(p_pengunjung, ''), 80);
  v_penulis text := left(coalesce(p_penulis, ''), 80);
  v_jumlah bigint;
begin
  if char_length(v_pengunjung) < 8 or char_length(v_penulis) < 1 then
    raise exception 'Data pengikut tidak valid.';
  end if;

  if p_aktif then
    insert into public.faisal_pengikut (pengunjung, penulis)
    values (v_pengunjung, v_penulis)
    on conflict (pengunjung, penulis) do nothing;
  else
    delete from public.faisal_pengikut
    where pengunjung = v_pengunjung and penulis = v_penulis;
  end if;

  select count(*) into v_jumlah
  from public.faisal_pengikut where penulis = v_penulis;
  return v_jumlah;
end;
$$;

grant execute on function public.faisal_jumlah_pengikut(text) to anon, authenticated;
grant execute on function public.faisal_status_ikuti(text, text) to anon, authenticated;
grant execute on function public.faisal_simpan_ikuti(text, text, boolean) to anon, authenticated;

-- ============================================================
-- NOTIFIKASI BERITA (WEB PUSH)
-- Browser menyimpan langganan push. Edge Function membacanya
-- memakai service_role (hanya sebagai secret server), lalu
-- mengirim notifikasi saat pemilik menerbitkan berita baru.
-- ============================================================

-- 12. Tabel langganan push
create table if not exists public.faisal_push_langganan (
  id uuid primary key default gen_random_uuid(),
  pengunjung text not null check (char_length(pengunjung) between 8 and 80),
  langganan jsonb not null check (jsonb_typeof(langganan) = 'object'),
  dibuat timestamptz not null default now(),
  constraint faisal_push_langganan_unik unique (pengunjung)
);

alter table public.faisal_push_langganan enable row level security;

-- 13. Pembaca boleh menyimpan/memperbarui langganannya sendiri
drop policy if exists "simpan langganan push" on public.faisal_push_langganan;
create policy "simpan langganan push" on public.faisal_push_langganan
for insert to anon, authenticated
with check (char_length(pengunjung) between 8 and 80);

drop policy if exists "perbarui langganan push" on public.faisal_push_langganan;
create policy "perbarui langganan push" on public.faisal_push_langganan
for update to anon, authenticated
using (char_length(pengunjung) between 8 and 80)
with check (char_length(pengunjung) between 8 and 80);

-- Tidak ada policy SELECT/DELETE untuk anon; hapus lewat fungsi di bawah.
create or replace function public.faisal_hapus_langganan(p_pengunjung text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.faisal_push_langganan
  where pengunjung = left(coalesce(p_pengunjung, ''), 80);
$$;

grant execute on function public.faisal_hapus_langganan(text) to anon, authenticated;
