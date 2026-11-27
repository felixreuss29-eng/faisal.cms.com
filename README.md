# Faisal — Portal Berita & CMS

Versi web nyata dari desain `Faisal_Portal_Design.figcraft`. Statis, tanpa build step, siap diunggah ke GitHub Pages.

## Isi repository

```
index.html              Beranda (desktop/tablet/mobile, light & dark)
berita.html             Seluruh berita redaksi + filter kategori
artikel.html            Halaman artikel + estimasi baca otomatis (juga jadi dasar halaman statis)
artikel/<id>/index.html Halaman artikel hasil generate saat deploy, lengkap dengan meta sharing
scripts/generate-article-pages.js  Generator halaman artikel statis + sitemap
kategori.html           Halaman kategori/daftar berita
pencarian.html          Hasil pencarian (termasuk empty state)
donasi.html             Dukungan sukarela untuk pemilik via DANA
tentang.html            Tentang Faisal, prinsip redaksi, pemilik & kontak
statis.html             Pedoman Media Siber, redaksi, hak jawab, privasi, cookie & peta situs
404.html                Halaman tidak ditemukan
admin/
  login.html            Masuk
  lupa-password.html    Reset kata sandi + state sukses
  dasbor.html           Dasbor ringkas
  daftar-artikel.html   Daftar artikel dari posts.json + filter status
  editor.html           Editor + estimasi baca langsung + alur persetujuan
  posting.html          Unggah postingan dan foto lewat Edge Function Supabase
assets/css/style.css    Design token, komponen, responsive, dark mode
assets/js/data.js       Kompatibilitas lama; tidak berisi berita contoh
assets/js/posts.json    Postingan yang diunggah dari admin CMS
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

1. Isi **Pemilik repository** (`felixreuss29-eng`), **Nama repository** (`faisal.cms.com`), dan **Cabang** (`main`), lalu **Cek koneksi**.
2. Token GitHub **tidak diisi di browser**. Simpan token sebagai Supabase Secret `GITHUB_TOKEN` (token klasik dengan izin **repo**, atau fine-grained dengan **Contents: read & write** + **Metadata: read**). Edge Function `simpan-postingan` memakai secret itu di server.
3. Isi judul, kategori, ringkasan, foto (opsional, ada pratinjau), teks alternatif, dan isi postingan.
4. Klik **Unggah & terbitkan**. Website akan menyimpan foto ke `assets/img/upload/` dan menambah data ke `assets/js/posts.json` lewat GitHub Contents API.
5. Tunggu 1–3 menit sampai GitHub Pages selesai deploy. Postingan muncul di beranda, `berita.html`, hasil pencarian, dan halaman statis `artikel/<id>/` yang dibuat otomatis saat deploy.
6. Untuk menghapus, buka bagian **Kelola postingan** pada halaman yang sama → **Muat daftar postingan** → **Hapus** pada judul yang dimaksud → konfirmasi. Postingan dan fotonya dihapus dari repository lewat GitHub Contents API.

**Keamanan:** browser tidak menyimpan token GitHub. CMS mengirim judul/isi lewat Edge Function Supabase memakai `apikey` publishable + token sesi pemilik; fungsi memakai Secret `GITHUB_TOKEN` untuk menulis ke repository. Pastikan **Verify JWT with legacy secret = OFF** pada kedua Edge Function (`simpan-postingan` / slug aktifnya, dan `kirim-notifikasi-`). Cabut token di GitHub bila perlu.

## Dukungan sukarela untuk pemilik

1. Pembaca membuka `donasi.html` dan mengirim dukungan lewat DANA ke `0895323964130` a/n Faisal Akbar.
2. Nominal terserah pembaca; tidak ada paket, formulir, bukti transfer wajib, status pengajuan, atau riwayat di perangkat.
3. Jika ingin, pembaca dapat mengirim email ke `felixreuss29@gmail.com`. Ini opsional dan tidak dipakai untuk membuka artikel.
4. Seluruh artikel tetap gratis dan terbuka tanpa kode akses atau paywall.

Nomor yang ditampilkan adalah nomor akun DANA penerima dukungan, bukan nomor kontak pribadi untuk keperluan lain. Tidak ada data donasi yang ditulis ke repository atau ke Supabase.

## Menghubungkan komentar & statistik kunjungan (Supabase)

Komentar dan angka kunjungan baru sama di semua perangkat setelah Supabase dihubungkan:

1. Buat project di https://supabase.com/dashboard (pilih region terdekat, misalnya Singapore).
2. Buka **SQL Editor → New query**, salin seluruh isi `supabase-setup.sql`, lalu **Run**. File ini membuat tabel komentar (`faisal_komentar`), kunjungan (`faisal_statistik`), kebijakan RLS, dan fungsi `faisal_ringkasan_statistik`. Tabel `subscriptions` dan bucket `bukti` dari skema lama tidak lagi dibuat; hapus keduanya manual di dashboard bila masih ada. Tidak ada alamat email pembaca yang ditulis ke repositori atau ke Supabase oleh kode publik.
3. Buka **Authentication → Users → Add user → Create new user**, pakai email `felixreuss29@gmail.com`, isi kata sandi, lalu centang **Auto Confirm User** (atau konfirmasi lewat email). Email ini harus sama dengan kebijakan pemilik di SQL.
4. Buka **Project Settings → API Keys**, salin **Project URL** dan **Publishable key** (`sb_publishable_...`). Isi keduanya di `assets/js/supabase-config.js`:

   ```js
   window.FAISAL_SUPABASE = {
     url: 'https://xxxx.supabase.co',
     anonKey: 'sb_publishable_...'
   };
   ```

   **Jangan** memasukkan `service_role` / `secret key` ke repo; kunci itu hanya untuk server. `Publishable key` memang boleh dipublikasikan dan akan dipakai browser sebagai `apikey`. Kunci `anon` lama (diawali `eyJ`) juga masih berfungsi sampai awal 2027.
5. Commit dan push. Setelah deploy, buka `admin/login.html`, masukkan email + kata sandi Supabase pemilik, lalu **Masuk ke ruang redaksi**. CMS memakai kata sandi saja; tidak ada kode 6 digit atau aplikasi autentikator. Buka dasbor admin → **Moderasi komentar** untuk menghapus komentar. Angka di dasbor dan "Dilihat N kali" langsung memakai data Supabase. Sesi dicek ulang ke Supabase setiap kali membuka halaman admin; centang **Ingat sesi** menyimpannya di perangkat itu; tanpa centangan, sesi berhenti saat browser ditutup.

Sebelum langkah 4 selesai, halaman publik tetap berfungsi dengan catatan "Supabase belum terhubung": komentar dan kunjungan tersimpan lokal di browser masing-masing. **Halaman admin tidak bisa dimasuki siapa pun** sampai konfigurasi dan user pemilik tersedia.

### Pengikut & notifikasi berita baru

Jalankan ulang seluruh `supabase-setup.sql` setelah perubahan ini agar tabel `faisal_pengikut` dan `faisal_push_langganan` beserta fungsi RPC-nya tersedia. Kode publik sudah memakai RPC; tidak ada data identitas pengikut yang dibuka lewat `SELECT`.

Untuk mengaktifkan notifikasi ke perangkat pembaca:

1. Pasang Supabase CLI dan login (`supabase login`), lalu hubungkan project (`supabase link --project-ref ywvdmicxhnbgzomvgman`).
2. Kunci VAPID publik sudah ada di `assets/js/config.js`. Kunci privat ada di `supabase/functions/kirim-notifikasi-/.env` (file ini **diabaikan git**). Jangan pernah memasukkan kunci privat ke repository.
3. Set rahasia server: `supabase secrets set --env-file supabase/functions/kirim-notifikasi-/.env` cukup untuk 3 kunci `VAPID_*`. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` otomatis tersedia di runtime Edge Function (dashboard menolak nama rahasia berawalan `SUPABASE_`). `service_role` hanya dipakai Edge Function, tidak pernah dikirim ke browser.
4. Deploy: `supabase functions deploy kirim-notifikasi-`. Nama fungsi sengaja berakhir dengan tanda minus karena CMS memanggil `/functions/v1/kirim-notifikasi-`.
5. Setiap kali pemilik menekan **Unggah & terbitkan** di CMS, Edge Function dipanggil dengan token sesi pemilik dan mengirim notifikasi ke semua langganan. Pembaca mengaktifkan notifikasi lewat pop-up atau tombol **Aktifkan notifikasi berita** di footer; iPhone perlu menambahkan web ke Home Screen dulu (Safari iOS 16.4+).

Untuk mengaktifkan unggahan CMS tanpa PAT di browser:

1. Buat GitHub token klasik dengan scope `repo` (atau fine-grained dengan **Contents: Read and write** untuk repo `faisal.cms.com`), lalu simpan sebagai Supabase Secret `GITHUB_TOKEN` di **Dashboard → Project Settings → Edge Functions → Secrets**. Token ini tidak pernah dikirim ke browser.
2. Deploy fungsi: `supabase functions deploy simpan-postingan`.
3. Di `admin/posting.html`, klik **Cek koneksi**. Fungsi memverifikasi token sesi pemilik sebelum membaca/menulis `assets/js/posts.json`.

## Hal yang sudah berfungsi

- Waktu nyata: tanggal, jam WIB (`Asia/Jakarta`) dan waktu relatif dihitung ulang tiap 30 detik dari `Date` dan `Intl.DateTimeFormat('id-ID')`.
- Estimasi baca: dihitung dari jumlah kata ÷ 200 wpm saat halaman dibuka; di editor diperbarui saat mengetik.
- Dark mode tersimpan di `localStorage`, tombol berlabel aksesibel.
- Pilihan bahasa di header: 24 bahasa (Indonesia, Inggris, Arab, Mandarin, Jepang, Korea, dll.) plus opsi Google Translate untuk bahasa lain. Seluruh teks halaman, termasuk isi artikel dan berita, diterjemahkan otomatis dan di-cache di browser (`faisal-bahasa`, `faisal-terjemahan`); versi Indonesia tetap menjadi acuan. Terjemahan mencoba dua alamat Google (`translate_a/single` dan `translate_a/t`), lalu penyedia cadangan MyMemory bila Google diblokir/terkena batas permintaan di browser tertentu (misalnya browser dalam aplikasi). Bila masih gagal atau hanya sebagian, muncul pemberitahuan dengan tautan Google Translate yang dibuka di tab yang sama (popup sering diblokir di WebView).
- Responsif 1440 / 768 / 390: hamburger, grid satu kolom di mobile, area sentuh minimal 44px, fokus keyboard terlihat.
- State UI: skeleton tidak dipakai karena konten langsung tersedia; empty state (pencarian), error (email/kata sandi), sukses (reset sandi), toast, cookie banner, pop-up izin push, validasi form.
- Status admin tidak hanya warna: setiap badge punya teks (Draf, Review, Revisi/Ditolak, Disetujui, Terbit) dan ikon titik. Sidebar CMS bisa diciutkan; filter status di daftar artikel berfungsi.
- Halaman `statis.html` berisi Pedoman Media Siber, identitas redaksi, hak jawab, kebijakan privasi, karir, iklan, cookie, dan peta situs.
- Komentar artikel tampil untuk semua pengunjung lewat Supabase (`faisal_komentar`), lengkap dengan nama, waktu WIB, dan tombol hapus untuk pemilik yang sudah masuk dengan akun Supabase. Jika Supabase belum terhubung, komentar jatuh ke penyimpanan lokal (`faisal-komentar-<id>`) dan diberi catatan demikian; tombol bagikan WhatsApp, Telegram, email, dan salin tautan tetap berfungsi nyata (WhatsApp memakai `api.whatsapp.com` tanpa nomor pribadi).
- Statistik kunjungan: satu pengunjung dihitung sekali per hari per halaman (`faisal_statistik`, pengenal acak di browser). Dasbor menampilkan pengunjung hari ini, total pengunjung unik, jumlah tampilan artikel, kunjungan terbaru, jumlah pengikut, dan panel moderasi; kartu berita serta halaman artikel menampilkan "Dilihat N kali".
- Pengikut penulis: tombol "Ikuti" hanya tampil di halaman profil lengkap (`tentang.html`) dan tersinkron lewat Supabase (`faisal_pengikut`); jumlah pengikut tampil di profil dan dasbor, tanpa daftar identitas pembaca. Peran "Pemilik & Pemimpin Redaksi" juga hanya tercantum di profil lengkap.
- Notifikasi berita: Web Push lewat `sw.js` + Edge Function `kirim-notifikasi-`, dikirim otomatis setelah berita diterbitkan dari CMS. Bisa dimatikan dari footer.
- Gambar lokal bertema berita, tidak lagi placeholder gunung. Semua kartu memakai foto lokal milik website; tidak ada placeholder khusus berita pihak ketiga. Foto artikel yang besar dikompres ke WebP (kualitas 82, dimensi tetap) agar lebih ringan di HP; referensi di `posts.json` ikut diperbarui.
- Seluruh berita: tulisan redaksi di `assets/js/data.js` dan unggahan CMS di `assets/js/posts.json` → beranda/`berita.html`/kategori/pencarian/News Ticker. Tidak ada `news.json` dan tidak ada konten RSS pihak ketiga.
- Unggah postingan dari CMS: form admin → GitHub Contents API → `posts.json` + foto → tampil di beranda, `berita.html`, pencarian, dan halaman artikel.
- Media sosial hanya Instagram `@faisalakbar0423`; Facebook, X/Twitter, dan YouTube dihapus karena belum tersedia.
- Halaman `tentang.html` berisi misi, prinsip redaksi, tim, pemilik, dan kontak.
- Foto profil pemilik dipakai di sidebar CMS, halaman masuk, dan halaman tentang kami.
- Audit Lighthouse otomatis: skor 100/100 untuk aksesibilitas, best practices, dan SEO pada halaman utama, artikel, kategori, serta dasbor (light dan dark).
- Dukungan sukarela: halaman `donasi.html` menampilkan nomor DANA `0895323964130` a/n Faisal Akbar tanpa paket, nominal tetap, formulir, bukti wajib, status, atau riwayat. Email pemilik `felixreuss29@gmail.com` hanya sebagai kontak opsional. Semua artikel terbuka gratis tanpa kode akses.
- Tidak ada newsletter atau formulir langganan email di website maupun dokumentasi. Halaman hukum: `tentang.html`, `kebijakan-privasi.html`, `disclaimer.html`, `koreksi.html`.

## Yang masih kurang / perlu ditambahkan

1. **Backend & CMS penuh** — tidak ada lagi artikel contoh di `assets/js/data.js`; seluruh berita berasal dari `assets/js/posts.json`. Unggahan admin memakai Edge Function `simpan-postingan` dengan token GitHub sebagai Supabase Secret (bukan disimpan di browser). Belum ada versioning konten, penjadwalan terbit, atau pengelolaan media yang lengkap.
2. **Autentikasi nyata** — kata sandi login dan sesi admin diverifikasi Supabase Auth; email selain `felixreuss29@gmail.com`, kata sandi salah, dan penanda buatan di browser ditolak. Alur verifikasi kode 6 digit sengaja tidak dipakai; masuk cukup email + kata sandi. Unggah postingan memakai token sesi pemilik, bukan PAT di browser.
3. **WYSIWYG & upload media** — editor lama masih `textarea` dan berlabel pratinjau; unggah foto nyata ada di `posting.html`, tetapi belum ada rich text atau pengelola aset.
4. **Alur persetujuan persisten** — tabel alur hanya contoh; tombol "Kirim review" belum mengubah data/status di server maupun menyimpan riwayat.
5. **Komentar & statistik bersama** — kode dan SQL sudah siap, tetapi `assets/js/supabase-config.js` masih kosong dan `supabase-setup.sql` belum dijalankan. Sebelum dihubungkan, komentar dan angka kunjungan hanya tersimpan di perangkat masing-masing. Panel moderasi juga baru bisa menghapus komentar setelah akun pemilik Supabase dibuat. Belum ada anti-spam otomatis selain batas panjang teks/nama.
6. **SEO & metadata lengkap** — `robots.txt`, `sitemap.xml`, canonical, Open Graph, Twitter card, dan JSON-LD (NewsArticle/WebSite) sudah memakai `https://faisalnews.web.id`. Daftarkan sitemap ke Google Search Console setelah domain stabil.
7. **Analitik & iklan** — slot iklan masih placeholder; belum ada integrasi ads/analytics.
8. **QA lanjutan** — audit Lighthouse otomatis sudah dijalankan (aksesibilitas, best practices, SEO = 100 pada halaman utama, artikel, kategori, dan dasbor; light & dark). Namun uji pembaca layar manual dan tinjauan visual manusia pada 1440/768/390 belum dilakukan.
9. **Desain yang belum tersalin penuh** — layout tablet admin 768 dan beberapa state UI baru belum direbuild di file desain setelah perubahan warna.
10. **Lisensi foto** — seluruh kartu memakai foto lokal milik website. Foto profil pemilik adalah file yang Anda kirim. Bila pemilik menambahkan foto pihak lain melalui CMS, kredit dan izin penggunaan tetap menjadi tanggung jawab pemilik.
11. **Terjemahan mesin** — terjemahan dihasilkan otomatis oleh Google Translate (atau MyMemory bila Google tidak dapat diakses) dan dapat salah pada istilah khusus; teks asli bahasa Indonesia tetap menjadi rujukan. Pembaca juga bisa membuka versi Google Translate penuh lewat tautan di footer atau opsi "Bahasa lain"; tautan itu sengaja dibuka di tab yang sama agar bekerja di browser dalam aplikasi.

## Lisensi

Lihat `HAK-CIPTA.md`. Repo ini memakai **All Rights Reserved** (tanpa file `LICENSE`). Seluruh berita ditulis dan diterbitkan oleh redaksi Faisal; foto dari pihak ketiga tetap dikreditkan sesuai sumbernya. Tidak ada konten RSS pihak ketiga yang disalin ke website.

## Catatan

Email pemilik yang dipakai untuk akun admin dan kontak opsional dukungan: `felixreuss29@gmail.com`. Dukungan sukarela: DANA `0895323964130` a/n Faisal Akbar (nomor akun penerima, bukan kontak pribadi). Instagram: `@faisalakbar0423`. TikTok: `@wangtaouzi0411` (nama tampil `felix reuss`). Nama yang ditampilkan di profil admin: Faisal Akbar.

Karena situs ini statis di GitHub Pages, tidak ada pembayaran yang diproses otomatis oleh website, dan tidak ada data donasi yang disimpan. Faisal belum terdaftar sebagai perusahaan pers di Dewan Pers dan tidak menyatakan diri sebagai badan hukum; lihat `disclaimer.html`.
