-- Faisal CMS — skema Supabase untuk langganan otomatis
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
