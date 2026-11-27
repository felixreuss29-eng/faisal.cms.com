-- Faisal — pembersihan data uji/supabase lama.
-- Jalankan manual di Supabase Dashboard → SQL Editor → New query → Run
-- hanya setelah memastikan tidak ada data yang masih dibutuhkan.

-- 1. Hapus komentar percobaan. Sesuaikan nama/isi jika perlu.
delete from public.faisal_komentar
where lower(nama) in ('test', 'testing', 'uji', 'coba', 'admin')
   or lower(teks) like '%test%' or lower(teks) like '%coba%';

-- 2. Hapus tabel langganan lama (donasi kini QRIS sukarela, tanpa formulir).
drop table if exists public.subscriptions cascade;

-- 3. Hapus bucket penyimpanan bukti lama dan isinya.
delete from storage.objects where bucket_id = 'bukti';
delete from storage.buckets where id = 'bukti';

-- 4. Pastikan tidak ada akun pembaca uji yang tertinggal selain pemilik.
-- periksa dulu di Authentication → Users, lalu hapus manual akun uji di sana.
