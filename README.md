# Faisal — Portal Berita & CMS

Versi web nyata dari desain `Faisal_Portal_Design.figcraft`. Statis, tanpa build step, siap diunggah ke GitHub Pages.

## Isi repository

```
index.html              Beranda (desktop/tablet/mobile, light & dark)
berita.html             Seluruh berita redaksi + filter kategori
artikel.html            Halaman artikel + estimasi baca otomatis
kategori.html           Halaman kategori/daftar berita
pencarian.html          Hasil pencarian (termasuk empty state)
donasi.html             Donasi pembaca + QRIS, konfirmasi email
tentang.html            Tentang Faisal, prinsip redaksi, pemilik & kontak
statis.html             Pedoman Media Siber, redaksi, hak jawab, privasi, cookie & peta situs
404.html                Halaman tidak ditemukan
admin/
  login.html            Masuk
  login-2fa.html        Halaman lama, otomatis dialihkan ke login.html
  lupa-password.html    Reset kata sandi + state sukses
  dasbor.html           Dasbor ringkas
  daftar-artikel.html   Daftar artikel + status berlabel
  editor.html           Editor + estimasi baca langsung + alur persetujuan
  posting.html          Unggah postingan, foto, dan kode terima kasih donasi ke GitHub
assets/css/style.css    Design token, komponen, responsive, dark mode
assets/js/data.js       Contoh konten (placeholder API/CMS)
assets/js/posts.json    Postingan yang diunggah dari admin CMS
assets/js/access.json   Sidik jari (hash SHA-256) kode terima kasih donasi
assets/js/app.js        Perilaku: jam, waktu relatif, tema, toast, form, cookie, push
assets/js/i18n.js       Pilihan bahasa + terjemahan otomatis seluruh teks halaman
assets/js/supabase.js   Komentar bersama, moderasi pemilik, dan statistik kunjungan (REST)
assets/img/*.jpg        Foto berita lokal (menggantikan placeholder gunung)
assets/img/pemilik-profil.jpg  Foto profil pemilik di CMS & tentang kami
assets/img/upload/*.jpg  Foto postingan hasil unggahan admin
scripts/fix-images.ps1  Pengganti satu kali untuk foto placeholder (bersifat historis)
.github/workflows/      Deploy GitHub Pages
Faisal_Portal_Design.figcraft  Sumber desain (tidak dipakai saat runtime)
```

## Menjalankan di komputer

Karena halaman memakai `fetch`-free relative path, cukup server statis biasa:

```powershell
python -m http.server 8000
```

Lalu buka `http://localhost:8000`. Alternatif: `npx serve .`.

Semua tautan memakai path relatif, jadi tetap berfungsi bila repository dipasang di `https://USERNAME.github.io/NAMA-REPO/`.

## Unggah ke GitHub + deploy

1. Buat repository baru di GitHub (boleh kosong, tanpa README).
2. Di folder ini:

   ```powershell
   git init
   git add .
   git commit -m "Initial Faisal web portal"
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git branch -M main
   git push -u origin main
   ```

3. Di GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Workflow `.github/workflows/deploy.yml` akan publish otomatis setiap `push` ke `main`.
5. Akses `https://USERNAME.github.io/NAMA-REPO/`.

Jika ingin deploy manual tanpa Actions: **Settings → Pages → Deploy from a branch → main / (root)**.

## Pembaruan berita

Website ini **tidak lagi mengambil berita dari RSS pihak ketiga**, termasuk ANTARA News. Seluruh berita ditulis dan diterbitkan oleh redaksi Faisal.

Cara menambah berita:

1. Buka `admin/posting.html` → **Tulis Postingan** di CMS.
2. Isi judul, kategori, ringkasan, **sumber rujukan (wajib)**, foto beserta kreditnya (opsional), dan isi postingan.
3. Klik **Unggah & terbitkan**. Berita masuk ke `assets/js/posts.json` lewat GitHub Contents API, lalu GitHub Pages otomatis deploy.
4. Berita muncul di beranda, `berita.html`, kategori, pencarian, News Ticker, dan halaman artikel.

Tidak ada workflow penjadwalan berita lagi; satu-satunya GitHub Actions yang dipakai adalah deploy GitHub Pages.

## Unggah postingan dari admin (tanpa backend)

Buka `admin/posting.html` → menu **Tulis Postingan** di sidebar CMS.

1. Isi **Pemilik repository**, **Nama repository**, **Cabang** (`main`), dan **Personal Access Token**, lalu **Simpan pengaturan** dan **Cek koneksi**.
2. Buat token di GitHub → *Settings → Developer settings → Tokens*. Token klasik perlu izin **repo**; fine-grained perlu **Contents: read & write** + **Metadata: read**.
3. Isi judul, kategori, ringkasan, foto (opsional, ada pratinjau), teks alternatif, dan isi postingan.
4. Klik **Unggah & terbitkan**. Website akan menyimpan foto ke `assets/img/upload/` dan menambah data ke `assets/js/posts.json` lewat GitHub Contents API.
5. Tunggu 1–3 menit sampai GitHub Pages selesai deploy. Postingan muncul di beranda, `berita.html`, hasil pencarian, dan `artikel.html?id=…`.
6. Untuk menghapus, buka bagian **Kelola postingan** pada halaman yang sama → **Muat daftar postingan** → **Hapus** pada judul yang dimaksud → konfirmasi. Postingan dan fotonya dihapus dari repository lewat GitHub Contents API.

**Keamanan:** token disimpan di `localStorage` browser perangkat ini. Pakai hanya di perangkat pemilik, jangan di komputer bersama, dan cabut token di GitHub bila perlu. Ini bukan sistem login produksi — hanya cara praktis satu pemilik mengirim konten ke repository statis.

## Alur donasi dan kode terima kasih (manual)

1. Pembaca memindai QRIS di `donasi.html` (Store baju faisal, NMID IDI 026596688139), mengisi formulir, dan **wajib mengunggah bukti transfer**.
2. Pembaca mengirim data + foto bukti ke email `felixreuss29@gmail.com`. Nomor telepon pribadi pemilik tidak ditampilkan di website maupun dokumentasi.
3. Pemilik memeriksa bukti, lalu membuka `admin/posting.html` → **Kode terima kasih untuk pendukung**, mengisi kode, dan klik **Simpan kode ke website**. Repository hanya menyimpan hash SHA-256 kode di `assets/js/access.json`, bukan kode aslinya.
4. Pemilik mengirim kode tersebut ke pembaca lewat email.
5. Pembaca memasukkan kode pada kolom **Kode terima kasih** di halaman artikel. Paywall terbuka dan status tersimpan di perangkatnya.

Kode bisa diganti kapan saja lewat halaman admin; pembaca perlu memasukkan kode baru setelah deploy selesai. Saat kode yang benar dimasukkan, pengajuan dengan status “Menunggu verifikasi” pada **perangkat yang sama** otomatis ditandai “Terverifikasi” beserta jamnya; status ini hanya catatan lokal, bukan data server. Ini pembatasan sisi klien, bukan pengganti autentikasi server.

## Menghubungkan komentar & statistik kunjungan (Supabase)

Komentar dan angka kunjungan baru sama di semua perangkat setelah Supabase dihubungkan:

1. Buat project di https://supabase.com/dashboard (pilih region terdekat, misalnya Singapore).
2. Buka **SQL Editor → New query**, salin seluruh isi `supabase-setup.sql`, lalu **Run**. File ini membuat tabel komentar (`faisal_komentar`), kunjungan (`faisal_statistik`), kebijakan RLS, dan fungsi `faisal_ringkasan_statistik`. Tabel `subscriptions` di file yang sama adalah skema lama yang saat ini tidak dipakai website; tidak ada alamat email pembaca yang ditulis ke repositori atau ke tabel itu oleh kode publik.
3. Buka **Authentication → Users → Add user → Create new user**, pakai email `felixreuss29@gmail.com`, isi kata sandi, lalu centang **Auto Confirm User** (atau konfirmasi lewat email). Email ini harus sama dengan kebijakan pemilik di SQL.
4. Buka **Project Settings → API Keys**, salin **Project URL** dan **Publishable key** (`sb_publishable_...`). Isi keduanya di `assets/js/supabase-config.js`:

   ```js
   window.FAISAL_SUPABASE = {
     url: 'https://xxxx.supabase.co',
     anonKey: 'sb_publishable_...'
   };
   ```

   **Jangan** memasukkan `service_role` / `secret key` ke repo; kunci itu hanya untuk server. `Publishable key` memang boleh dipublikasikan dan akan dipakai browser sebagai `apikey`. Kunci `anon` lama (diawali `eyJ`) juga masih berfungsi sampai awal 2027.
5. Commit dan push. Setelah deploy, buka `admin/login.html`, masukkan email + kata sandi Supabase pemilik, lalu **Masuk ke ruang redaksi**. Buka dasbor admin → **Moderasi komentar** untuk menghapus komentar. Angka di dasbor dan "Dilihat N kali" langsung memakai data Supabase. Sesi dicek ulang ke Supabase setiap kali membuka halaman admin; centang **Ingat sesi** menyimpannya di perangkat itu; tanpa centangan, sesi berhenti saat browser ditutup.

Sebelum langkah 4 selesai, halaman publik tetap berfungsi dengan catatan "Supabase belum terhubung": komentar dan kunjungan tersimpan lokal di browser masing-masing. **Halaman admin tidak bisa dimasuki siapa pun** sampai konfigurasi dan user pemilik tersedia.

## Hal yang sudah berfungsi

- Waktu nyata: tanggal, jam WIB (`Asia/Jakarta`) dan waktu relatif dihitung ulang tiap 30 detik dari `Date` dan `Intl.DateTimeFormat('id-ID')`.
- Estimasi baca: dihitung dari jumlah kata ÷ 200 wpm saat halaman dibuka; di editor diperbarui saat mengetik.
- Dark mode tersimpan di `localStorage`, tombol berlabel aksesibel.
- Pilihan bahasa di header: 24 bahasa (Indonesia, Inggris, Arab, Mandarin, Jepang, Korea, dll.) plus opsi Google Translate untuk bahasa lain. Seluruh teks halaman, termasuk isi artikel dan berita, diterjemahkan otomatis dan di-cache di browser (`faisal-bahasa`, `faisal-terjemahan`); versi Indonesia tetap menjadi acuan. Terjemahan mencoba dua alamat Google (`translate_a/single` dan `translate_a/t`), lalu penyedia cadangan MyMemory bila Google diblokir/terkena batas permintaan di browser tertentu (misalnya browser dalam aplikasi). Bila masih gagal atau hanya sebagian, muncul pemberitahuan dengan tautan Google Translate yang dibuka di tab yang sama (popup sering diblokir di WebView).
- Responsif 1440 / 768 / 390: hamburger, grid satu kolom di mobile, area sentuh minimal 44px, fokus keyboard terlihat.
- State UI: skeleton tidak dipakai karena konten langsung tersedia; empty state (pencarian), error (email/kata sandi), sukses (reset sandi), toast, cookie banner, pop-up izin push, validasi form.
- Status admin tidak hanya warna: setiap badge punya teks (Draf, Review, Revisi/Ditolak, Disetujui, Terbit) dan ikon titik. Sidebar CMS bisa diciutkan; filter status di daftar artikel berfungsi.
- Halaman `statis.html` berisi Pedoman Media Siber, identitas redaksi, hak jawab, kebijakan privasi, karir, iklan, cookie, dan peta situs.
- Komentar artikel tampil untuk semua pengunjung lewat Supabase (`faisal_komentar`), lengkap dengan nama, waktu WIB, dan tombol hapus untuk pemilik yang sudah masuk dengan akun Supabase. Jika Supabase belum terhubung, komentar jatuh ke penyimpanan lokal (`faisal-komentar-<id>`) dan diberi catatan demikian; tombol bagikan email/salin tautan tetap berfungsi nyata.
- Statistik kunjungan: satu pengunjung dihitung sekali per hari per halaman (`faisal_statistik`, pengenal acak di browser). Dasbor menampilkan pengunjung hari ini, total pengunjung unik, jumlah tampilan artikel, kunjungan terbaru, dan panel moderasi; kartu berita serta halaman artikel menampilkan "Dilihat N kali".
- Gambar lokal bertema berita, tidak lagi placeholder gunung. Semua kartu memakai foto lokal milik website; tidak ada placeholder khusus berita pihak ketiga.
- Seluruh berita: tulisan redaksi di `assets/js/data.js` dan unggahan CMS di `assets/js/posts.json` → beranda/`berita.html`/kategori/pencarian/News Ticker. Tidak ada `news.json` dan tidak ada konten RSS pihak ketiga.
- Unggah postingan dari CMS: form admin → GitHub Contents API → `posts.json` + foto → tampil di beranda, `berita.html`, pencarian, dan halaman artikel.
- Media sosial hanya Instagram `@faisalakbar0423`; Facebook, X/Twitter, dan YouTube dihapus karena belum tersedia.
- Halaman `tentang.html` berisi misi, prinsip redaksi, tim, pemilik, dan kontak.
- Foto profil pemilik dipakai di sidebar CMS, halaman masuk, dan halaman tentang kami.
- Audit Lighthouse otomatis: skor 100/100 untuk aksesibilitas, best practices, dan SEO pada halaman utama, artikel, kategori, serta dasbor (light dan dark).
- Donasi: pilih nominal → kirim dukungan via QRIS (gambar QR di `assets/img/qris.jpg`) → **wajib unggah bukti transfer** → formulir membuat pesan konfirmasi siap dikirim ke email pemilik `felixreuss29@gmail.com`. Bukti dikompresi dan tersimpan di browser bersama riwayat/status; pengguna tetap harus mengirim foto bukti manual karena browser tidak bisa melampirkannya ke email.
- Formulir rangkuman harian memakai checkbox persetujuan wajib dan mengirim permintaan lewat aplikasi email pengguna; alamat email tidak disimpan di file publik repositori. Halaman hukum: `tentang.html`, `kebijakan-privasi.html`, `disclaimer.html`, `koreksi.html`.

## Yang masih kurang / perlu ditambahkan

1. **Backend & CMS penuh** — artikel contoh masih di `assets/js/data.js`, dan unggahan admin memakai GitHub Contents API (bukan database). Belum ada versioning Konten, penjadwalan terbit, atau pengelolaan media yang lengkap.
2. **Autentikasi nyata** — kata sandi login dan sesi admin diverifikasi Supabase Auth; email selain `felixreuss29@gmail.com`, kata sandi salah, dan penanda buatan di browser ditolak. Sebelum `assets/js/supabase-config.js` diisi dan `supabase-setup.sql` dijalankan, **tidak ada yang bisa masuk** (termasuk pemilik). Alur 2 langkah lama yang menerima enam digit apa pun sudah dihapus; `login-2fa.html` kini hanya mengalihkan ke `login.html`. Unggah postingan tetap memakai token GitHub di browser pemilik, bukan sesi pengguna.
3. **WYSIWYG & upload media** — editor lama masih `textarea` dan berlabel pratinjau; unggah foto nyata ada di `posting.html`, tetapi belum ada rich text atau pengelola aset.
4. **Alur persetujuan persisten** — tabel alur hanya contoh; tombol "Kirim review" belum mengubah data/status di server maupun menyimpan riwayat.
5. **Verifikasi pembayaran otomatis** — donasi memakai QRIS statis → bukti wajib → konfirmasi email → kode terima kasih manual. QRIS statis tidak punya webhook, jadi donasi tidak bisa terkonfirmasi otomatis. Skema Supabase untuk approval + masa aktif 1 bulan sudah disiapkan di `supabase-setup.sql`, tetapi belum dipasang karena URL dan publishable key belum diisi di `assets/js/supabase-config.js`. Pencarian juga masih filter array lokal.
6. **Komentar & statistik bersama** — kode dan SQL sudah siap, tetapi `assets/js/supabase-config.js` masih kosong dan `supabase-setup.sql` belum dijalankan. Sebelum dihubungkan, komentar dan angka kunjungan hanya tersimpan di perangkat masing-masing. Panel moderasi juga baru bisa menghapus komentar setelah akun pemilik Supabase dibuat. Belum ada anti-spam otomatis selain batas panjang teks/nama.
7. **SEO & metadata lengkap** — `robots.txt` sudah ada, tetapi belum ada canonical URL, Open Graph/Twitter card, JSON-LD, dan sitemap.xml (URL final deploy belum diketahui).
8. **Analitik & iklan** — slot iklan masih placeholder; belum ada integrasi ads/analytics.
9. **QA lanjutan** — audit Lighthouse otomatis sudah dijalankan (aksesibilitas, best practices, SEO = 100 pada halaman utama, artikel, kategori, dan dasbor; light & dark). Namun uji pembaca layar manual dan tinjauan visual manusia pada 1440/768/390 belum dilakukan.
10. **Desain yang belum tersalin penuh** — layout tablet admin 768 dan beberapa state UI baru belum direbuild di file desain setelah perubahan warna.
11. **Lisensi foto** — seluruh kartu memakai foto lokal milik website. Foto profil pemilik adalah file yang Anda kirim. Bila pemilik menambahkan foto pihak lain melalui CMS, kredit dan izin penggunaan tetap menjadi tanggung jawab pemilik.
12. **Terjemahan mesin** — terjemahan dihasilkan otomatis oleh Google Translate (atau MyMemory bila Google tidak dapat diakses) dan dapat salah pada istilah khusus; teks asli bahasa Indonesia tetap menjadi rujukan. Pembaca juga bisa membuka versi Google Translate penuh lewat tautan di footer atau opsi "Bahasa lain"; tautan itu sengaja dibuka di tab yang sama agar bekerja di browser dalam aplikasi.

## Lisensi

Lihat `HAK-CIPTA.md`. Repo ini memakai **All Rights Reserved** (tanpa file `LICENSE`). Seluruh berita dan foto yang tampil adalah materi redaksi Faisal; tidak ada konten RSS pihak ketiga yang disalin ke website.

## Catatan

Email pemilik yang dipakai untuk konfirmasi donasi dan akun admin: `felixreuss29@gmail.com`. Nomor telepon/WhatsApp pribadi sengaja tidak dicantumkan. Donasi: QRIS statis di `assets/img/qris.jpg` (Store baju faisal, NMID IDI 026596688139). Instagram: `@faisalakbar0423`. TikTok: `@wangtaouzi0411` (nama tampil `felix reuss`). Nama yang ditampilkan di profil admin: Faisal Akbar.

Karena situs ini statis di GitHub Pages, pesan konfirmasi dan permintaan rangkuman dibuka di aplikasi email pengguna dan dikirim oleh mereka sendiri. Tidak ada pembayaran yang diproses otomatis oleh website. Faisal belum terdaftar sebagai perusahaan pers di Dewan Pers dan tidak menyatakan diri sebagai badan hukum; lihat `disclaimer.html`.
