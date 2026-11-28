/* ============================================================
   Faisal — perilaku web statis (GitHub Pages ready)
   ============================================================ */

const WPM = 200;
const TZ = 'Asia/Jakarta';
const OWNER_EMAIL = 'felixreuss29@gmail.com';
const FD = window.FaisalData;
const img = (name) => `assets/img/${name}`;
/* ---------- Alamat bersih (tanpa .html di address bar) ---------- */
function rapikanUrl() {
  if (location.protocol === 'file:' || location.pathname.includes('/admin/')) return;
  const p = location.pathname;
  let bersih = null;
  if (p.endsWith('/index.html')) bersih = p.slice(0, -'index.html'.length);
  else if (p.endsWith('.html')) bersih = p.slice(0, -5);
  if (bersih && bersih !== p) history.replaceState(history.state, '', bersih + location.search + location.hash);
}
rapikanUrl();
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Waktu dinamis ---------- */
function formatTanggal(date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(date);
}
function formatJam(date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false
  }).format(date);
}
function waktuRelatif(iso, now = new Date()) {
  const menit = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 60000));
  if (menit < 1) return 'baru saja';
  if (menit < 60) return `${menit} menit lalu`;
  if (menit < 1440) return `${Math.floor(menit / 60)} jam lalu`;
  if (menit < 10080) return `${Math.floor(menit / 1440)} hari lalu`;
  return formatTanggal(new Date(iso));
}
function formatWaktuTerbit(iso) {
  const tanggal = new Date(iso);
  if (Number.isNaN(tanggal.getTime())) return 'Waktu tidak tersedia';
  const hari = new Intl.DateTimeFormat('id-ID', {
    timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric'
  }).format(tanggal);
  return `${hari}, ${formatJam(tanggal)} WIB`;
}
function sumberPostingan(a) {
  return (a && a.sumberRujukan) ? String(a.sumberRujukan) : 'Belum dicantumkan';
}
function kreditFoto(a) {
  return (a && a.kreditFoto) ? String(a.kreditFoto) : 'Dokumentasi Faisal';
}
function infoPostinganHTML(a, ringkas = false) {
  const terbit = formatWaktuTerbit(a.published);
  const diperbarui = formatWaktuTerbit(a.updated || a.published);
  return `<div class="postingan-info${ringkas ? ' ringkas' : ''}">
    <span>Penulis: <strong>Redaksi faisal.cms.com</strong></span>
    <span>Dirangkum dari: <strong>${esc(sumberPostingan(a))}</strong></span>
    <span>Diterbitkan: ${esc(terbit)} · Diperbarui: ${esc(diperbarui)}</span>
  </div>`;
}
function jumlahKata(blocks) {
  const teks = (blocks || []).map((b) => b.text || '').join(' ');
  return teks.trim().split(/\s+/).filter(Boolean).length;
}
function readingMinutes(blocks) {
  return Math.max(1, Math.ceil(jumlahKata(blocks) / WPM));
}
function updateDynamicTime() {
  const sekarang = new Date();
  document.querySelectorAll('[data-clock]').forEach((el) => {
    el.textContent = `${formatTanggal(sekarang)}  ·  ${formatJam(sekarang)} WIB`;
  });
  document.querySelectorAll('[data-relative]').forEach((el) => {
    el.textContent = waktuRelatif(el.dataset.relative, sekarang);
  });
  document.querySelectorAll('[data-reading]').forEach((el) => {
    const article = postinganTerbaru().find((a) => a.id === el.dataset.reading);
    if (article) el.textContent = `${readingMinutes(article.body)} menit baca`;
  });
}
function startClock() {
  updateDynamicTime();
  setInterval(updateDynamicTime, 30000);
}

/* ---------- Ikon UI ---------- */
const IKON_PENGGUNA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></svg>';
const IKON_BULAN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 14.6A8.6 8.6 0 0 1 9.4 3.6a8.6 8.6 0 1 0 11 11Z"/></svg>';
const IKON_MATAHARI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';

/* ---------- Tema ---------- */
function initTheme() {
  const saved = localStorage.getItem('faisal-theme') || 'light';
  document.documentElement.dataset.theme = saved;
  updateThemeButton();
}
function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('faisal-theme', next);
  updateThemeButton();
}
function updateThemeButton() {
  const dark = document.documentElement.dataset.theme === 'dark';
  const ikon = dark ? IKON_MATAHARI : IKON_BULAN;
  const label = dark ? 'Mode terang' : 'Mode gelap';
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
    b.setAttribute('aria-label', 'Aktifkan ' + label.toLowerCase());
    b.title = 'Aktifkan ' + label.toLowerCase();
    let wadah = b.querySelector('.ikon-tema');
    if (!wadah) {
      wadah = document.createElement('span');
      wadah.className = 'ikon-tema';
      wadah.setAttribute('aria-hidden', 'true');
      b.prepend(wadah);
    }
    wadah.innerHTML = ikon;
    const teks = b.querySelector('[data-theme-teks]');
    if (teks) teks.textContent = label;
  });
}

/* ---------- Toast ---------- */
function toast(pesan) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = pesan;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ---------- Penulis, tombol ikuti & jumlah pengikut ---------- */
const KUNCI_IKUTI = 'faisal-ikuti-';
function bacaIkuti() {
  try { return JSON.parse(localStorage.getItem(KUNCI_IKUTI) || '{}'); } catch { return {}; }
}
function tulisIkuti(daftar) {
  try { localStorage.setItem(KUNCI_IKUTI, JSON.stringify(daftar)); } catch { /* abai */ }
}
function peranPenulis(a) {
  const peran = (a && a.author && a.author.role) || 'Penulis Faisal';
  // Di halaman publik, peran pemilik/pemimpin redaksi hanya muncul di profil lengkap.
  return /pemilik|pemimpin redaksi|redaktur utama/i.test(peran) ? 'Redaksi Faisal' : peran;
}
function namaPenulis(a) {
  return (a && a.author && a.author.name) || 'Faisal Akbar';
}
function gambarArtikel(a) {
  const nama = (a && a.image) || 'hero.jpg';
  return nama.startsWith('assets/') ? nama : img(nama);
}
function tombolIkuti(nama, kelas = 'btn btn-outline btn-follow', denganJumlah = false) {
  const id = String(nama || 'Faisal').trim() || 'Faisal';
  const aktif = !!bacaIkuti()[id];
  const jumlah = denganJumlah
    ? `<span class="meta follow-count" data-jumlah-ikuti="${esc(id)}">— pengikut</span>`
    : '';
  return `${jumlah}<button class="${kelas}" type="button" data-follow="${esc(id)}" aria-pressed="${aktif}" aria-label="${aktif ? 'Berhenti mengikuti ' : 'Ikuti '}${esc(id)}">${aktif ? '✓ Mengikuti' : '+ Ikuti'}</button>`;
}
function sinkronTombolIkuti(nama, aktif) {
  document.querySelectorAll('[data-follow]').forEach((b) => {
    if (b.dataset.follow !== nama) return;
    b.setAttribute('aria-pressed', String(aktif));
    b.setAttribute('aria-label', (aktif ? 'Berhenti mengikuti ' : 'Ikuti ') + nama);
    b.textContent = aktif ? '✓ Mengikuti' : '+ Ikuti';
  });
}
function perbaruiJumlahIkuti(nama, jumlah) {
  const angka = jumlah === null || jumlah === undefined ? NaN : Number(jumlah);
  const teks = Number.isFinite(angka) && angka >= 0 ? `${angka} pengikut` : '— pengikut';
  document.querySelectorAll('[data-jumlah-ikuti]').forEach((el) => {
    if (el.dataset.jumlahIkuti === nama) el.textContent = teks;
  });
}
async function sinkronIkuti() {
  if (!FD || typeof FD.statusIkuti !== 'function') return;
  const daftarNama = [...new Set([...document.querySelectorAll('[data-follow]')]
    .map((b) => b.dataset.follow).filter(Boolean))];
  for (const nama of daftarNama) {
    try {
      const aktif = await FD.statusIkuti(nama);
      const lokal = bacaIkuti();
      if (Boolean(lokal[nama]) !== aktif) {
        if (aktif) lokal[nama] = 1; else delete lokal[nama];
        tulisIkuti(lokal);
      }
      sinkronTombolIkuti(nama, aktif);
      perbaruiJumlahIkuti(nama, await FD.jumlahPengikut(nama));
    } catch (e) {
      perbaruiJumlahIkuti(nama, null);
    }
  }
}
function initFollow() {
  // Tombol "Ikuti" hanya tampil di halaman profil lengkap.
  const profil = document.querySelector('#profil-ikuti');
  if (profil) profil.innerHTML = tombolIkuti('Faisal Akbar', 'btn btn-outline btn-follow', true);
  document.addEventListener('click', async (e) => {
    const tombol = e.target.closest('[data-follow]');
    if (!tombol) return;
    const nama = tombol.dataset.follow;
    const daftar = bacaIkuti();
    const aktif = !daftar[nama];
    if (aktif) daftar[nama] = 1; else delete daftar[nama];
    tulisIkuti(daftar);
    sinkronTombolIkuti(nama, aktif);
    toast(aktif ? `Anda mengikuti ${nama}.` : `Anda berhenti mengikuti ${nama}.`);
    if (!FD || typeof FD.simpanIkuti !== 'function') return;
    try {
      const jumlah = await FD.simpanIkuti(nama, aktif);
      perbaruiJumlahIkuti(nama, jumlah);
    } catch (err) {
      toast('Ikutan tersimpan di perangkat ini saja: ' + err.message);
    }
  });
  sinkronIkuti();
}

function terapkanStatusNotifikasi(aktif, keterangan = '') {
  const teks = aktif ? 'Matikan notifikasi berita' : 'Aktifkan notifikasi berita';
  document.querySelectorAll('[data-notif-toggle]').forEach((b) => {
    b.setAttribute('aria-pressed', String(aktif));
    b.classList.toggle('aktif', aktif);
    b.dataset.notifStatus = aktif ? 'aktif' : 'belum';
    b.setAttribute('aria-label', keterangan || teks);
    b.title = keterangan || teks;
    const label = b.querySelector('[data-notif-teks]');
    if (label) label.textContent = teks;
  });
}

async function perbaruiTampilanAkun() {
  const link = document.querySelector('[data-akun-link]');
  if (!link || !FD || typeof FD.emailPembaca !== 'function') return;
  const label = link.querySelector('[data-akun-teks]');
  const avatar = link.querySelector('.akun-avatar');
  const email = FD.emailPembaca();
  if (email) {
    if (label) label.textContent = 'Akun';
    if (avatar) avatar.textContent = email.charAt(0).toUpperCase();
    link.setAttribute('aria-label', 'Akun pembaca: ' + email);
    link.title = 'Akun pembaca: ' + email;
    link.classList.add('masuk');
  } else {
    if (label) label.textContent = 'Masuk';
    if (avatar) avatar.innerHTML = IKON_PENGGUNA;
    link.setAttribute('aria-label', 'Masuk atau daftar akun pembaca');
    link.title = 'Masuk atau daftar akun pembaca';
    link.classList.remove('masuk');
  }
  if (typeof FD.sesiPembaca === 'function' && email) {
    const sah = await FD.sesiPembaca();
    if (!sah && label && avatar) {
      label.textContent = 'Masuk';
      avatar.textContent = '@';
      link.setAttribute('aria-label', 'Masuk atau daftar akun pembaca');
      link.title = 'Masuk atau daftar akun pembaca';
      link.classList.remove('masuk');
    }
  }
}
async function initNotifikasi() {
  const tombol = document.querySelector('[data-notif-toggle]');
  if (!tombol || !FD || typeof FD.statusNotifikasi !== 'function') return;
  const statusAwal = await FD.statusNotifikasi();
  const keterangan = statusAwal === 'ditolak'
    ? 'Izin notifikasi diblokir. Aktifkan lewat pengaturan browser.'
    : statusAwal === 'tidak-didukung'
      ? 'Browser ini belum mendukung notifikasi.'
      : '';
  terapkanStatusNotifikasi(statusAwal === 'aktif', keterangan);
  document.querySelectorAll('[data-notif-toggle]').forEach((b) => {
    b.addEventListener('click', async () => {
      if (keterangan) { toast(keterangan); return; }
      const sedangAktif = b.dataset.notifStatus === 'aktif';
      document.querySelectorAll('[data-notif-toggle]').forEach((x) => { x.disabled = true; });
      try {
        if (sedangAktif) {
          await FD.matikanNotifikasi();
          terapkanStatusNotifikasi(false);
          toast('Notifikasi berita dimatikan.');
        } else {
          await FD.aktifkanNotifikasi();
          terapkanStatusNotifikasi(true);
          toast('Notifikasi berita aktif.');
        }
      } catch (e) {
        toast('Gagal mengatur notifikasi: ' + e.message);
      } finally {
        document.querySelectorAll('[data-notif-toggle]').forEach((x) => { x.disabled = false; });
      }
    });
  });
}

/* ---------- Header & footer ---------- */
const KATEGORI = ['Nasional', 'Olahraga', 'Teknologi', 'Internasional', 'Pendidikan'];
// Tautan lama tetap masuk ke Nasional agar tidak menghasilkan halaman kosong.
const KATEGORI_LAMA = { Politik: 'Nasional', Ekonomi: 'Nasional', Hukum: 'Nasional' };
function kategoriAktif() {
  const pilihan = new URLSearchParams(location.search).get('k');
  if (KATEGORI_LAMA[pilihan]) return KATEGORI_LAMA[pilihan];
  return KATEGORI.includes(pilihan) ? pilihan : 'Nasional';
}
const NAV = ['Beranda', 'Berita Terkini', ...KATEGORI];
const NAV_HREF = {
  'Beranda': './', 'Berita Terkini': 'berita', 'Nasional': 'kategori?k=Nasional',
  'Olahraga': 'kategori?k=Olahraga', 'Teknologi': 'kategori?k=Teknologi',
  'Internasional': 'kategori?k=Internasional', 'Pendidikan': 'kategori?k=Pendidikan'
};
function renderHeader(active = 'Beranda') {
  const host = document.querySelector('[data-site-header]');
  if (!host) return;
  host.innerHTML = `
    <div class="utility">
      <div class="wrap">
        <span data-clock></span>
        <div class="utility-links">
          <a href="tentang">Tentang Kami</a><a href="statis">Pedoman Media Siber</a><a href="statis">Redaksi</a>
          <a href="statis">Karir</a><a href="statis">Iklan</a>
        </div>
      </div>
    </div>
    <div class="masthead">
      <div class="wrap">
        <div class="masthead-top">
          <a class="brand" href="./"><span class="brand-name">Faisal</span><span class="brand-tag">BERITA INDEPENDEN &amp; TERPERCAYA</span></a>
          <div class="header-actions">
            <form class="search-box" data-search-form>
              <label class="sr-only" for="site-search">Cari berita</label>
              <input id="site-search" type="search" placeholder="Cari berita…" />
            </form>
            <div class="language-wrap" data-no-translate>
              <label class="sr-only" for="pilih-bahasa">Pilih bahasa</label>
              <select id="pilih-bahasa" class="language-select" data-bahasa aria-label="Pilih bahasa" title="Pilih bahasa. Terjemahan otomatis; teks asli tetap bahasa Indonesia."></select>
            </div>
            <a class="akun-btn" href="akun" data-akun-link aria-label="Masuk atau daftar akun pembaca" title="Masuk atau daftar akun pembaca">
              <span class="akun-avatar" aria-hidden="true">${IKON_PENGGUNA}</span><span class="akun-teks" data-akun-teks>Masuk</span>
            </a>
            <div class="notif-wrap">
              <button class="icon-btn notif-btn" type="button" data-notif-toggle aria-pressed="false" aria-label="Aktifkan notifikasi berita" title="Aktifkan notifikasi berita">
                <span class="notif-lonceng" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  <span class="notif-silang"></span><span class="notif-titik"></span>
                </span>
              </button>
            </div>
            <button class="icon-btn tema-btn" type="button" data-theme-toggle aria-label="Aktifkan mode gelap"><span class="ikon-tema" aria-hidden="true">${IKON_BULAN}</span></button>
            <a class="btn btn-primary" href="donasi">Dukungan</a>
            <button class="icon-btn menu-toggle" type="button" data-menu-toggle aria-label="Buka menu" aria-expanded="false">☰</button>
          </div>
        </div>
        <nav class="site-nav" aria-label="Navigasi utama">
          ${NAV.map((n) => `<a href="${NAV_HREF[n]}" ${n === active ? 'aria-current="page"' : ''}>${n}</a>`).join('')}
        </nav>
      </div>
    </div>
    <nav class="mobile-nav hidden" aria-label="Navigasi mobile">
      <div class="mobile-nav-head">
        <span class="brand-name">Faisal</span>
        <button class="icon-btn" type="button" data-menu-tutup aria-label="Tutup menu">✕</button>
      </div>
      ${NAV.map((n) => `<a href="${NAV_HREF[n]}">${n}</a>`).join('')}
      <a href="akun">Akun pembaca</a>
      <a href="donasi">Dukungan</a>
      <div class="mobile-bahasa" data-no-translate>
        <label class="sr-only" for="pilih-bahasa-hp">Pilih bahasa</label>
        <select id="pilih-bahasa-hp" data-bahasa-hp aria-label="Pilih bahasa"></select>
      </div>
      <button class="mobile-nav-btn" type="button" data-theme-toggle><span class="ikon-tema" aria-hidden="true">${IKON_BULAN}</span><span data-theme-teks>Mode gelap</span></button>
    </nav>
    <div class="ticker" aria-label="Berita berjalan">
      <div class="wrap" style="display:flex;align-items:center;gap:14px;width:100%">
        <span class="ticker-label">REAKSI</span>
        <div class="ticker-viewport"><div class="ticker-track" data-ticker></div></div>
        <button class="ticker-toggle" type="button" data-ticker-toggle aria-label="Jeda berita berjalan" aria-pressed="false">❚❚</button>
      </div>
    </div>`;
  host.querySelector('[data-search-form]').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = host.querySelector('#site-search').value.trim();
    location.href = `pencarian${q ? '?q=' + encodeURIComponent(q) : ''}`;
  });
  const menu = host.querySelector('.mobile-nav');
  const tombolMenu = host.querySelector('[data-menu-toggle]');
  const tutupMenu = () => {
    menu.classList.add('hidden');
    tombolMenu.setAttribute('aria-expanded', 'false');
  };
  tombolMenu.addEventListener('click', () => {
    const buka = menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !buka);
    tombolMenu.setAttribute('aria-expanded', String(buka));
  });
  menu.querySelector('[data-menu-tutup]').addEventListener('click', tutupMenu);
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', tutupMenu));
  updateThemeButton();
}

function rapikanNav() {
  const nav = document.querySelector('.site-nav');
  if (!nav || getComputedStyle(nav).display === 'none') return;
  let wadah = nav.querySelector('.nav-lainnya');
  if (!wadah) {
    wadah = document.createElement('div');
    wadah.className = 'nav-lainnya';
    wadah.hidden = true;
    wadah.innerHTML = '<button class="nav-lainnya-btn" type="button" aria-expanded="false" aria-controls="nav-lainnya-menu">Lainnya ▾</button><div class="nav-lainnya-menu" id="nav-lainnya-menu" hidden></div>';
    nav.appendChild(wadah);
    const tombol = wadah.querySelector('button');
    const menu = wadah.querySelector('.nav-lainnya-menu');
    tombol.addEventListener('click', (e) => {
      e.stopPropagation();
      const buka = menu.hidden;
      menu.hidden = !buka;
      tombol.setAttribute('aria-expanded', String(buka));
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-lainnya')) {
        menu.hidden = true;
        tombol.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) {
        menu.hidden = true;
        tombol.setAttribute('aria-expanded', 'false');
        tombol.focus();
      }
    });
  }
  const menu = wadah.querySelector('.nav-lainnya-menu');
  Array.from(menu.querySelectorAll('a')).forEach((a) => nav.insertBefore(a, wadah));
  wadah.hidden = false;
  let geser = 0;
  while (nav.scrollWidth > nav.clientWidth + 1 && geser < NAV.length) {
    const tautan = Array.from(nav.children).filter((el) => el.tagName === 'A');
    if (!tautan.length) break;
    menu.insertBefore(tautan[tautan.length - 1], menu.firstChild);
    geser++;
  }
  wadah.hidden = menu.children.length === 0;
  if (wadah.hidden) {
    menu.hidden = true;
    wadah.querySelector('button').setAttribute('aria-expanded', 'false');
  }
}

function renderFooter() {
  const host = document.querySelector('[data-site-footer]');
  if (!host) return;
  const cols = [
    ['Perusahaan', ['Tentang Kami', 'Redaksi', 'Karir', 'Iklan']],
    ['Layanan', ['Berita Terkini', 'Akun Pembaca', 'Dukungan', 'Arsip Berita']],
    ['Hukum', ['Syarat Penggunaan', 'Kebijakan Privasi', 'Koreksi & Hak Jawab', 'Pedoman Media Siber']],
    ['Ikuti Kami', ['Instagram @faisalakbar0423']]
  ];
  const tautan = {
    'Tentang Kami': 'tentang', 'Berita Terkini': 'berita', 'Akun Pembaca': 'akun', 'Dukungan': 'donasi',
    'Syarat Penggunaan': 'disclaimer', 'Kebijakan Privasi': 'kebijakan-privasi',
    'Koreksi & Hak Jawab': 'koreksi', 'Pedoman Media Siber': 'statis',
    'Instagram @faisalakbar0423': 'https://www.instagram.com/faisalakbar0423/'
  };
  const hrefFooter = (label) => tautan[label] || 'statis';
  const eksternal = (label) => (tautan[label] || '').startsWith('http');
  host.innerHTML = `
    <footer class="site-footer">
      <div class="wrap">
        <div class="footer-grid">
          <div>
            <span class="brand-name">Faisal</span>
            <p style="font-size:11px;margin:12px 0 0">Berita independen dan tepercaya untuk Indonesia.</p>
            <p style="font-size:11px;margin:10px 0 0">Email: <a href="mailto:felixreuss29@gmail.com">felixreuss29@gmail.com</a><br />DANA: nomor dukungan ada di halaman dukungan</p>
            <a class="footer-translate" href="https://translate.google.com/translate?sl=id&amp;tl=en&amp;u=${encodeURIComponent(location.href)}">Terjemahkan halaman (semua bahasa)</a>
            <button class="footer-notif" type="button" data-notif-toggle aria-pressed="false"><span data-notif-teks>Aktifkan notifikasi berita</span></button>
          </div>
          ${cols.map(([t, links]) => `<div><h3>${t}</h3><ul>${links.map((l) => `<li><a href="${hrefFooter(l)}" ${eksternal(l) ? 'target="_blank" rel="noopener noreferrer"' : ''}>${l}</a></li>`).join('')}</ul></div>`).join('')}
        </div>
        <div class="footer-bottom">
          <span>© 2026 Faisal. Redaksi: Faisal Akbar. Seluruh hak dilindungi.</span>
          <span>Seluruh berita ditulis dan diterbitkan oleh redaksi Faisal.</span>
        </div>
      </div>
    </footer>`;
}

/* ---------- Konten redaksi: seluruhnya berasal dari unggahan CMS pemilik ---------- */
let POSTINGAN = [];

/* Tidak ada berita contoh, RSS, atau konten pihak ketiga. Satu-satunya
   sumber daftar berita adalah assets/js/posts.json yang ditulis dari CMS. */
/* ---------- Jumlah tampilan & statistik kunjungan ---------- */
async function perbaruiAngka() {
  if (!FD) return;
  try {
    const ringkas = await FD.ringkasan();
    const peta = ringkas.tampilanArtikel || {};
    document.querySelectorAll('[data-view]').forEach((el) => {
      const jumlah = Number(peta[el.dataset.view] || 0);
      el.textContent = `Dilihat ${jumlah} kali`;
    });
    document.querySelectorAll('[data-stat]').forEach((el) => {
      const nilai = ringkas[el.dataset.stat];
      if (nilai !== undefined) el.textContent = String(nilai);
    });
    const wadah = document.querySelector('[data-kunjungan-terbaru]');
    if (wadah) {
      const daftar = ringkas.terbaru || [];
      wadah.innerHTML = daftar.length
        ? daftar.map((k) => `<div class="kunjungan-item"><span>${esc(k.jenis === 'artikel' ? 'Artikel: ' + k.halaman : 'Kunjungan situs')}</span><span class="meta" data-relative="${esc(k.waktu)}">${waktuRelatif(k.waktu)}</span></div>`).join('')
        : '<p class="meta">Belum ada kunjungan tercatat.</p>';
      updateDynamicTime();
    }
    const catatan = document.querySelector('[data-stat-catatan]');
    if (catatan) catatan.textContent = ringkas.lokal
      ? 'Angka masih tersimpan di perangkat ini. Hubungkan Supabase agar pengunjung dan komentar sama di semua perangkat.'
      : 'Angka dihitung dari pengunjung unik per hari (WIB) dan komentar yang tampil untuk semua pembaca.';
  } catch (e) {
    const catatan = document.querySelector('[data-stat-catatan]');
    if (catatan) catatan.textContent = 'Statistik belum dapat dimuat: ' + e.message;
  }
}
function catatKunjunganSekali() {
  if (!FD || document.body.dataset.admin === '1') return;
  FD.catatKunjungan('situs', 'situs').catch(() => {});
  if (document.querySelector('#article-root')) {
    const id = new URLSearchParams(location.search).get('id') || (postinganTerbaru()[0] || {}).id || 'situs';
    FD.catatKunjungan(id, 'artikel').catch(() => {});
  }
}
function kartuTerkiniHTML(a) {
  return cardHTML(a);
}
function gabunganTerkini() {
  return postinganTerbaru().slice(0, 12);
}
function renderBeritaHarian() {
  const host = document.querySelector('#daftar-berita-harian');
  if (!host) return;
  const semua = gabunganTerkini().slice(0, 3);
  if (!semua.length) {
    host.innerHTML = '<div class="empty-state"><h3>Berita belum tersedia</h3><p>Unggah berita melalui <strong>Tulis Postingan</strong> di CMS.</p></div>';
    return;
  }
  host.innerHTML = `<div class="grid-3">${semua.map(kartuTerkiniHTML).join('')}</div>
    <div class="lihat-semua-wrap"><a class="btn btn-outline" href="berita">Lihat semua berita →</a></div>`;
  updateDynamicTime();
}
function renderBeritaPage() {
  const host = document.querySelector('#berita-root');
  if (!host) return;
  const semua = gabunganTerkini();
  if (!semua.length) {
    host.innerHTML = '<div class="empty-state"><h3>Berita belum tersedia</h3><p>Unggah berita melalui menu <strong>Tulis Postingan</strong> di CMS.</p></div>';
    return;
  }
  const kategori = [...new Set(semua.map((a) => a.category))];
  host.innerHTML = `
    <h2 class="sr-only">Daftar berita terkini</h2>
    <div class="filter-bar" aria-label="Filter kategori berita">
      <button class="chip active" type="button" data-berita-filter="Semua">Semua</button>
      ${kategori.map((k) => `<button class="chip" type="button" data-berita-filter="${esc(k)}">${esc(k)}</button>`).join('')}
    </div>
    <p class="result-meta">Menampilkan seluruh berita yang diterbitkan redaksi Faisal.</p>
    <div class="grid-3" id="grid-berita">${semua.map(kartuTerkiniHTML).join('')}</div>
    <p class="meta" style="margin-top:20px">Seluruh berita di situs ini ditulis dan diterbitkan oleh redaksi Faisal. Rujukan sumber dicantumkan pada artikel bila berasal dari bahan bacaan lain.</p>`;
  updateDynamicTime();
  host.querySelectorAll('[data-berita-filter]').forEach((b) => b.addEventListener('click', () => {
    host.querySelectorAll('[data-berita-filter]').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    const pilih = b.dataset.beritaFilter;
    host.querySelector('#grid-berita').innerHTML = semua
      .filter((a) => pilih === 'Semua' || a.category === pilih)
      .map(kartuTerkiniHTML).join('');
    updateDynamicTime();
  }));
}
function renderBeritaKategori() {
  const host = document.querySelector('#berita-kategori');
  if (!host) return;
  const kategori = kategoriAktif();
  const tampil = postinganTerbaru()
    .filter((a) => a.category === kategori)
    .slice(0, 3);
  host.innerHTML = `<div class="section-head"><span class="section-mark"></span><h2 class="section-title">Berita ${esc(kategori.toLowerCase())} dari Redaksi Faisal</h2><a class="section-more" href="berita">Lihat semua →</a></div>
    <p class="meta">Berita pada kategori ini ditulis dan diterbitkan oleh redaksi Faisal.</p>
    ${tampil.length
      ? `<div class="grid-3">${tampil.map(cardHTML).join('')}</div>`
      : '<p class="meta">Belum ada berita pada kategori ini. Unggah melalui menu <strong>Tulis Postingan</strong> di CMS.</p>'}`;
  updateDynamicTime();
}
function perbaruiTicker() {
  const el = document.querySelector('[data-ticker]');
  if (!el) return;
  // News Ticker tetap berjalan, tetapi isinya hanya berita unggahan pemilik.
  const daftar = postinganTerbaru()
    .slice(0, 6)
    .map((a) => ({ judul: a.title, id: a.id }));
  if (!daftar.length) return;
  const isi = daftar.map((x) => `<a class="ticker-item" href="artikel/${encodeURIComponent(x.id)}/">${esc(x.judul)}</a><span class="ticker-dot" aria-hidden="true">•</span>`).join('');
  // Dua grup identik supaya animasi -50% kembali mulus tanpa jeda.
  // Grup kedua semi-transparan untuk pembaca layar, jadi tautannya tidak bisa difokuskan.
  const isiPasif = isi.replace(/<a /g, '<a tabindex="-1" ');
  el.innerHTML = `<div class="ticker-group">${isi}</div><div class="ticker-group" aria-hidden="true">${isiPasif}</div>`;
  el.style.setProperty('--ticker-lama', `${Math.max(24, daftar.length * 9)}s`);
}
function initTickerToggle() {
  const tombol = document.querySelector('[data-ticker-toggle]');
  const baris = document.querySelector('.ticker');
  if (!tombol || !baris) return;
  tombol.addEventListener('click', () => {
    const jeda = baris.classList.toggle('dijeda');
    tombol.setAttribute('aria-pressed', String(jeda));
    tombol.setAttribute('aria-label', jeda ? 'Lanjutkan berita berjalan' : 'Jeda berita berjalan');
    tombol.textContent = jeda ? '▶' : '❚❚';
  });
}
function muatBerita() {
  renderBeritaKategori();
  renderCategory();
  renderSearch();
}

/* ---------- Postingan yang diunggah pemilik dari CMS ---------- */
function postinganTerbaru() {
  return POSTINGAN.slice().sort((a, b) => new Date(b.published || 0) - new Date(a.published || 0));
}
function renderPostingan() {
  const kosong = '<div class="empty-state"><h3>Belum ada berita</h3><p>Gunakan menu <strong>Tulis Postingan</strong> di CMS. Setiap berita yang terbit otomatis tampil di <strong>Berita Terkini</strong>.</p></div>';
  const isi = POSTINGAN.length ? `<div class="grid-3">${postinganTerbaru().map(cardHTML).join('')}</div>` : kosong;
  const beranda = document.querySelector('#daftar-postingan');
  if (beranda) beranda.innerHTML = isi;
  const halamanBerita = document.querySelector('#postingan-root');
  if (halamanBerita) halamanBerita.innerHTML = isi;
  updateDynamicTime();
}
async function muatPostingan() {
  try {
    const res = await fetch('assets/js/posts.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (Array.isArray(data.posts)) POSTINGAN = data.posts;
  } catch (e) {
    console.warn('Postingan admin tidak dapat dimuat:', e.message);
  }
  renderHome();
  renderPostingan();
  if (document.querySelector('#article-root')) renderArticle();
  renderCategory();
  renderSearch();
}

/* ---------- Kartu berita ---------- */
function cardHTML(a) {
  const penulis = namaPenulis(a);
  return `<article class="card">
    <a href="artikel/${encodeURIComponent(a.id)}/"><img src="${gambarArtikel(a)}"${a.imageFit === 'contain' ? ' class="foto-penuh"' : ''} alt="${esc(a.alt || 'Ilustrasi: ' + a.title)}" loading="lazy" /></a>
    <div class="card-tags"><span class="kicker">${esc(a.category)}</span> <span class="sumber-label">${esc(penulis)}</span></div>
    <h3><a href="artikel/${encodeURIComponent(a.id)}/">${esc(a.title)}</a></h3>
    ${a.excerpt ? `<p class="meta card-excerpt">${esc(a.excerpt)}</p>` : ''}
    ${a.sumberRujukan ? `<p class="meta postingan-sumber">Dirangkum dari: ${esc(sumberPostingan(a))}</p>` : ''}
    <div class="card-meta">
      <span class="meta" data-relative="${a.published}">${waktuRelatif(a.published)}</span>
      <span class="meta" data-view="${esc(a.id)}">Dilihat …</span>
    </div>
  </article>`;
}
function rankedHTML(list, label = 'Nasional') {
  return `<ol class="ranked-list">${list.map((t, i) => `<li><span class="rank">${String(i + 1).padStart(2, '0')}</span><div><h3>${esc(t)}</h3><span class="meta">${esc(label)}</span></div></li>`).join('')}</ol>`;
}

/* ---------- Beranda ---------- */
function iklanHTML(kelas) {
  return `<div class="ad-label">Iklan</div>
    <div class="ad-banner ${kelas}" role="group" aria-label="Promosi media sosial Faisal">
      <span class="ad-shimmer" aria-hidden="true"></span>
      <span class="ad-copy">
        <span class="ad-kicker">IKUTI FAISAL</span>
        <strong class="ad-judul">Kabar langsung dari redaksi</strong>
        <span class="ad-detail">Instagram <b>@faisalakbar0423</b> · TikTok <b>felix reuss</b></span>
      </span>
      <span class="ad-links">
        <a class="btn" href="https://www.instagram.com/faisalakbar0423/" target="_blank" rel="noopener noreferrer" aria-label="Buka Instagram Faisal">Instagram ↗</a>
        <a class="btn" href="https://www.tiktok.com/@wangtaouzi0411" target="_blank" rel="noopener noreferrer" aria-label="Buka TikTok Faisal (@wangtaouzi0411)">TikTok ↗</a>
      </span>
    </div>`;
}
function renderHome() {
  const hero = document.querySelector('#hero');
  if (!hero) return;
  hero.innerHTML = `
    ${iklanHTML('ad-leaderboard')}
    <section class="home-about home-about-tanpa-foto" aria-labelledby="judul-tentang-web">
      <div class="home-about-copy">
        <span class="kicker">Kenali Faisal</span>
        <h2 id="judul-tentang-web">Berita yang jelas, sumber yang terang.</h2>
        <p class="home-about-lead">Faisal adalah portal berita Indonesia yang menyajikan kabar nasional, olahraga, teknologi, internasional, dan pendidikan.</p>
        <div class="home-about-list">
          <article class="home-about-item">
            <div><h3>Tentang website ini</h3><p>Faisal Akbar adalah mahasiswa Antar Bangsa, Jakarta Timur. Situs ini dibuat sebagai sarana belajar sekaligus menyampaikan berita tentang peristiwa di Indonesia dan dunia. Faisal menyajikannya dengan bahasa yang jelas, rujukan yang disebutkan, dan pembaruan bila ada perkembangan.</p></div>
          </article>
          <article class="home-about-item">
            <div><h3>Cakupan berita</h3><p>Faisal menyajikan kabar nasional, olahraga, teknologi, internasional, dan pendidikan dari Indonesia serta dunia.</p></div>
          </article>
          <article class="home-about-item">
            <div><h3>Komitmen redaksi</h3><p>Informasi kami rangkum dari sumber yang kredibel. Untuk perkara hukum yang belum diputus pengadilan, kami menjunjung asas praduga tak bersalah.</p></div>
          </article>
          <article class="home-about-item">
            <div><h3>Koreksi &amp; hak jawab</h3><p>Jika menemukan kesalahan atau keberatan atas pemberitaan kami, silakan hubungi redaksi. Koreksi dicatat terbuka dan hak jawab kami beri ruang.</p></div>
          </article>
        </div>
        <div class="home-about-actions">
          <a class="btn btn-primary" href="tentang">Profil lengkap →</a>
          <a class="btn btn-outline" href="berita">Baca berita →</a>
          <a class="btn btn-outline" href="mailto:${OWNER_EMAIL}">Hubungi redaksi →</a>
        </div>
      </div>
    </section>`;
}

/* ---------- Artikel ---------- */
function idArtikelDariURL() {
  const dariQuery = new URLSearchParams(location.search).get('id');
  if (dariQuery) return dariQuery;
  const dariPath = location.pathname.match(/\/artikel\/([^/]+)\/?$/);
  return dariPath ? decodeURIComponent(dariPath[1]) : null;
}
function renderArticle() {
  const host = document.querySelector('#article-root');
  if (!host) return;
  const id = idArtikelDariURL();
  const semua = postinganTerbaru();
  const a = semua.find((x) => x.id === id) || semua[0];
  if (!a) {
    host.innerHTML = '<div class="empty-state"><h3>Berita belum tersedia</h3><p>Unggah berita melalui <strong>Tulis Postingan</strong> di CMS.</p><a class="btn btn-outline" href="berita">Lihat berita</a></div>';
    return;
  }
  document.body.dataset.page = KATEGORI.includes(a.category) ? a.category : 'Beranda';
  document.title = `${a.title} — Faisal`;
  document.querySelectorAll('.site-nav a, .mobile-nav a').forEach((link) => {
    if (link.textContent.trim() === a.category) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const dariAdmin = POSTINGAN.some((p) => p.id === a.id);
  const penulis = namaPenulis(a);
  const peran = peranPenulis(a);
  const bioTeks = penulis === 'Faisal Akbar'
    ? 'Anggota redaksi Faisal yang menulis dan menyunting berita untuk portal ini.'
    : `Penulis Faisal. ${peran}.`;
  const isi = a.body.map((b) => {
    if (b.type === 'h2') return `<h2>${esc(b.text)}</h2>`;
    if (b.type === 'quote') return `<blockquote class="pull-quote"><p>“${esc(b.text)}”</p><cite>— ${esc(b.cite)}</cite></blockquote>`;
    // CMS menerima satu baris per paragraf. Pisahkan juga bila penulis
    // menekan Enter sekali agar artikel tidak jadi satu blok panjang.
    return String(b.text).split(/\n+/).map((bagian) => `<p>${esc(bagian.trim())}</p>`).join('');
  }).join('');
  host.innerHTML = `
    <div class="breadcrumb"><a href="./">Beranda</a> › <a href="kategori?k=${encodeURIComponent(a.category)}">${esc(a.category)}</a> › ${esc(a.title)}</div>
    <div class="article-layout">
      <div>
        <header class="article-head">
          <span class="kicker">${esc(a.category)}</span>
          <h1>${esc(a.title)}</h1>
          <p class="article-lead">${esc(a.excerpt)}</p>
          <div class="byline">
            <img src="${img(a.author.photo)}" alt="Foto ${esc(penulis)}" />
            <div class="byline-penulis"><strong>${esc(penulis)}</strong><span class="meta">${esc(peran)}</span></div>
            <div class="byline-waktu meta"><span data-relative="${a.published}">${waktuRelatif(a.published)}</span> · <span data-view="${esc(a.id)}">Dilihat …</span> · <b data-reading="${a.id}">${readingMinutes(a.body)} menit baca</b></div>
            <div class="share"><span>Bagikan</span><a href="#" data-bagikan="whatsapp" aria-label="WhatsApp — bagikan artikel lewat WhatsApp">WhatsApp</a><a href="#" data-bagikan="telegram" aria-label="Telegram — bagikan artikel lewat Telegram">Telegram</a><a href="#" data-bagikan="email" aria-label="Email — bagikan lewat email">Email</a><a href="#" data-bagikan="link" aria-label="Link — salin tautan artikel">Link</a></div>
          </div>
          ${dariAdmin ? infoPostinganHTML(a) : ''}
        </header>
        <figure class="article-figure${a.imageFit === 'contain' ? ' foto-penuh' : ''}${a.potret ? ' foto-potret' : ''}"><img src="${gambarArtikel(a)}" alt="${esc(a.alt || 'Ilustrasi: ' + a.title)}" /><figcaption>${dariAdmin ? 'Foto: ' + esc(kreditFoto(a)) + '.' : 'Ilustrasi artikel. Foto: Dokumentasi Faisal.'}</figcaption></figure>
        <div class="article-body" style="margin-top:28px">${isi}</div>
        <div class="tags"><span class="tag">#${esc(a.category)}</span><span class="tag">#Faisal</span></div>
        <div class="author-bio"><img src="${img(a.author.photo)}" alt="Foto ${esc(penulis)}" /><div><h3>${esc(penulis)}</h3><div class="meta">${esc(peran)}</div><p class="meta">${esc(bioTeks)}</p></div></div>
        <section class="comments"><h3 class="komentar-judul">Komentar</h3>
          <p class="meta" data-komentar-status>Komentar tampil untuk semua pembaca dan dapat dimoderasi redaksi.</p>
          <div class="comment-form">
            <label class="sr-only" for="nama-komentar">Nama</label>
            <input id="nama-komentar" type="text" placeholder="Nama Anda" maxlength="40" autocomplete="name" />
            <label class="sr-only" for="komentar">Komentar</label>
            <textarea id="komentar" placeholder="Bagikan pandangan Anda tentang artikel ini…" maxlength="1000"></textarea>
            <div class="row"><button class="btn btn-primary" type="button" data-kirim-komentar>Kirim komentar</button></div>
          </div>
          <div id="daftar-komentar">
            <div class="empty-state" id="komentar-kosong"><h4>Belum ada komentar</h4><p>Jadilah yang pertama berbagi pandangan di artikel ini.</p></div>
          </div>
        </section>
      </div>
      <aside>
        <div class="sidebar-section"><div class="section-head"><span class="section-mark"></span><h2 class="section-title" style="font-size:20px">Artikel Terkait</h2></div>
          ${postinganTerbaru().filter((x) => x.id !== a.id).slice(0, 4).map((x) => `<div class="sidebar-item"><a href="artikel/${encodeURIComponent(x.id)}/"><img src="${gambarArtikel(x)}"${x.imageFit === 'contain' ? ' class="foto-penuh"' : ''} alt="Thumbnail ${esc(x.title)}" loading="lazy" /></a><div><span class="kicker">${esc(x.category)}</span><h3><a href="artikel/${encodeURIComponent(x.id)}/">${esc(x.title)}</a></h3><span class="meta" data-relative="${x.published}">${waktuRelatif(x.published)}</span></div></div>`).join('')}
        </div>
        ${iklanHTML('ad-sidebar')}
      </aside>
    </div>`;
  const figcaption = host.querySelector('.article-figure figcaption');
  if (figcaption) figcaption.textContent = `Foto: ${kreditFoto(a)}.`;
  host.querySelectorAll('[data-bagikan]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    // Selalu bagikan URL bersih, bukan URL legacy/Parameter cache.
    const url = location.origin + '/artikel/' + encodeURIComponent(a.id) + '/';
    const pesan = a.title + '\n' + url;
    const cara = b.dataset.bagikan;
    if (cara === 'whatsapp') window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(pesan), '_blank', 'noopener,noreferrer');
    else if (cara === 'telegram') window.open('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(a.title), '_blank', 'noopener,noreferrer');
    else if (cara === 'email') location.href = 'mailto:?subject=' + encodeURIComponent(a.title) + '&body=' + encodeURIComponent(url);
    else navigator.clipboard.writeText(url).then(() => toast('Tautan artikel disalin.')).catch(() => toast(url));
  }));
  const artikelId = a.id;
  const wadahKomentar = host.querySelector('#daftar-komentar');
  const kosongKomentar = host.querySelector('#komentar-kosong');
  const judulKomentar = host.querySelector('.komentar-judul');
  const statusKomentar = host.querySelector('[data-komentar-status]');
  const inputNama = host.querySelector('#nama-komentar');
  if (FD) inputNama.value = FD.namaTersimpan();

  const tampilkanKomentar = (daftar) => {
    judulKomentar.textContent = `Komentar (${daftar.length})`;
    kosongKomentar?.classList.toggle('hidden', daftar.length > 0);
    wadahKomentar.querySelectorAll('.comment').forEach((n) => n.remove());
    daftar.forEach((k) => {
      const inisial = String(k.nama || 'P').trim().charAt(0).toUpperCase();
      const node = document.createElement('div');
      node.className = 'comment';
      node.innerHTML = `<span class="comment-avatar" data-no-translate aria-hidden="true">${esc(inisial)}</span><div><h4>${esc(k.nama || 'Pembaca')} · <span class="meta" data-relative="${esc(k.waktu)}">${waktuRelatif(k.waktu)}</span></h4><p>${esc(k.teks)}</p><a class="kicker" href="statis#hak-jawab">Laporkan</a>${FD && FD.statusPemilik() ? ` <button class="kicker komentar-aksi" type="button" data-hapus-komentar="${esc(k.id)}">Hapus</button>` : ''}</div>`;
      wadahKomentar.appendChild(node);
    });
    wadahKomentar.querySelectorAll('[data-hapus-komentar]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('Hapus komentar ini?')) return;
      try {
        await FD.hapusKomentar(b.dataset.hapusKomentar);
        await muatKomentar();
        toast('Komentar dihapus.');
      } catch (e) { toast('Gagal menghapus: ' + e.message); }
    }));
    updateDynamicTime();
  };
  async function muatKomentar() {
    if (!FD) return;
    try {
      const daftar = await FD.komentar(artikelId);
      tampilkanKomentar(daftar);
      if (statusKomentar) statusKomentar.textContent = FD.siap()
        ? 'Komentar tampil untuk semua pembaca dan dapat dimoderasi redaksi.'
        : 'Supabase belum terhubung; komentar baru tersimpan di perangkat ini.';
    } catch (e) {
      judulKomentar.textContent = 'Komentar';
      if (statusKomentar) statusKomentar.textContent = 'Komentar belum dapat dimuat: ' + e.message;
    }
  }
  muatKomentar();
  host.querySelector('[data-kirim-komentar]').addEventListener('click', async () => {
    const ta = host.querySelector('#komentar');
    const teks = ta.value.trim();
    if (!FD) return;
    try {
      await FD.kirimKomentar(artikelId, inputNama.value, teks);
      ta.value = '';
      await muatKomentar();
      toast(FD.siap() ? 'Komentar terkirim dan tampil untuk semua pembaca.' : 'Komentar tersimpan di perangkat ini.');
    } catch (e) { toast('Gagal mengirim komentar: ' + e.message); }
  });
}

/* ---------- Kategori ---------- */
function renderCategory() {
  const host = document.querySelector('#category-root');
  if (!host) return;
  const daftarKategori = KATEGORI;
  const kategori = kategoriAktif();
  document.title = kategori + ' — Faisal';
  document.querySelectorAll('.site-nav a, .mobile-nav a').forEach((a) => {
    if (a.textContent.trim() === kategori) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const semua = postinganTerbaru().filter((a) => a.category === kategori);
  const utama = semua[0];
  const kartu = semua.map(cardHTML);
  host.innerHTML = `
    <section class="category-band"><div class="wrap"><span class="kicker">Kategori</span><h1>${esc(kategori)}</h1><p>Berita dan analisis ${esc(kategori.toLowerCase())} dari redaksi Faisal.</p></div></section>
    <div class="wrap">
      <div class="filter-bar">${daftarKategori.map((k) => `<a class="chip ${k === kategori ? 'active' : ''}" href="kategori?k=${encodeURIComponent(k)}">${k}</a>`).join('')}</div>
      ${utama ? `<div class="section"><h2 class="sr-only">Sorotan ${esc(kategori)}</h2><div class="split">
        <article class="lead"><a href="artikel/${encodeURIComponent(utama.id)}/"><img src="${gambarArtikel(utama)}"${utama.imageFit === 'contain' ? ' class="foto-penuh"' : ''} alt="${esc(utama.alt || 'Ilustrasi: ' + utama.title)}" /></a><span class="kicker">Utama</span><h3><a href="artikel/${encodeURIComponent(utama.id)}/">${esc(utama.title)}</a></h3></article>
        <div>${rankedHTML(semua.slice(1, 4).map((a) => a.title), kategori)}</div>
      </div></div>` : ''}
      <div class="section"><div class="section-head"><span class="section-mark"></span><h2 class="section-title">Berita ${esc(kategori)}</h2></div><div class="grid-3">${kartu.length ? kartu.join('') : '<p class="meta">Belum ada berita pada kategori ini. Unggah melalui menu <strong>Tulis Postingan</strong> di CMS.</p>'}</div></div>
      ${utama ? '<button class="load-more" type="button">Muat lebih banyak</button>' : ''}
    </div>`;
  const tombol = host.querySelector('.load-more');
  if (tombol) tombol.addEventListener('click', () => toast('Menampilkan artikel berikutnya…'));
}

/* ---------- Pencarian ---------- */
function renderSearch() {
  const host = document.querySelector('#search-root');
  if (!host) return;
  const q = new URLSearchParams(location.search).get('q') || '';
  const kunci = q.toLowerCase();
  const hasil = q ? postinganTerbaru().filter((a) => (a.title + a.category + a.excerpt).toLowerCase().includes(kunci)) : [];
  host.innerHTML = `
    <div class="wrap" style="padding-top:32px">
      <h1 style="font-family:var(--font-display);font-size:32px;margin:0">Pencarian</h1>
      <p class="result-meta">${q ? `${hasil.length} hasil untuk “${esc(q)}”` : 'Masukkan kata kunci pada kolom pencarian di atas.'}</p>
      ${q && !hasil.length ? `<div class="empty-state"><h3>Tidak ada hasil</h3><p>Coba kata kunci lain atau lihat berita terkini.</p><a class="btn btn-outline" href="berita">Lihat berita terkini</a></div>` : ''}
      ${hasil.length ? `<section class="section"><div class="section-head"><span class="section-mark"></span><h2 class="section-title">Hasil pencarian</h2></div><div class="grid-3">${hasil.map(cardHTML).join('')}</div></section>` : ''}
    </div>`;
  updateDynamicTime();
}

/* ---------- Overlay ---------- */
function initOverlays() {
  // Satu overlay aktif pada satu waktu. Di layar HP dua panel sekaligus
  // akan saling menimpa dan menutup isi halaman.
  const tampilPush = () => {
    if (localStorage.getItem('faisal-push') || document.querySelector('.push-prompt')) return;
    const el = document.createElement('aside');
    el.className = 'push-prompt';
    el.innerHTML = `<h4>Izin notifikasi</h4><p>Terima berita baru langsung di perangkat Anda, walau web sedang tertutup.</p><div class="overlay-actions"><button class="btn btn-primary" data-push="izin">Izinkan</button><button class="btn btn-outline" data-push="nanti">Nanti saja</button></div>`;
    document.body.appendChild(el);
    el.querySelectorAll('[data-push]').forEach((b) => b.addEventListener('click', async () => {
      if (b.dataset.push === 'nanti') {
        localStorage.setItem('faisal-push', 'nanti');
        el.remove();
        return;
      }
      b.disabled = true;
      b.textContent = 'Mengaktifkan…';
      try {
        if (FD && typeof FD.aktifkanNotifikasi === 'function') await FD.aktifkanNotifikasi();
        localStorage.setItem('faisal-push', 'aktif');
        toast('Notifikasi berita aktif.');
        terapkanStatusNotifikasi(true);
      } catch (err) {
        localStorage.setItem('faisal-push', 'gagal');
        toast('Gagal mengaktifkan notifikasi: ' + err.message);
      }
      el.remove();
    }));
  };

  if (!localStorage.getItem('faisal-cookie')) {
    const el = document.createElement('aside');
    el.className = 'cookie-banner';
    el.innerHTML = `<h4>Kami menggunakan cookie</h4><p>Untuk mengukur pembaca dan meningkatkan pengalaman Anda.</p><div class="overlay-actions"><button class="btn btn-primary" data-cookie="terima">Terima</button><button class="btn btn-outline" data-cookie="tolak">Tolak</button></div>`;
    document.body.appendChild(el);
    el.querySelectorAll('[data-cookie]').forEach((b) => b.addEventListener('click', () => {
      localStorage.setItem('faisal-cookie', b.dataset.cookie);
      el.remove();
      toast('Preferensi cookie disimpan.');
      tampilPush();
    }));
    return;
  }
  tampilPush();
}

/* ---------- Form umum ---------- */
function initForms() {
  document.querySelectorAll('[data-toast]').forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault();
    toast(el.dataset.toast);
  }));
}

/* ---------- Admin: autentikasi sungguhan lewat Supabase Auth ---------- */
function initAuth() {
  const login = document.querySelector('#form-login');
  if (login) {
    const pesan = document.querySelector('#login-error');
    const gagal = (teks) => {
      if (pesan) {
        pesan.textContent = teks;
        pesan.classList.remove('hidden');
      } else toast(teks);
    };
    login.addEventListener('submit', async (e) => {
      e.preventDefault();
      pesan?.classList.add('hidden');
      const email = login.email.value.trim();
      const sandi = login.password.value;
      const ingat = Boolean(login.querySelector('[name="ingat"]')?.checked);
      if (email.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
        return gagal('Hanya akun pemilik Faisal yang dapat mengakses CMS.');
      }
      if (!sandi) return gagal('Kata sandi wajib diisi.');
      if (!FD.siap()) {
        return gagal('Supabase belum terhubung. Isi Project URL dan anon key di assets/js/supabase-config.js terlebih dahulu.');
      }
      const tombol = login.querySelector('button[type="submit"]');
      if (tombol) { tombol.disabled = true; tombol.textContent = 'Memeriksa kata sandi…'; }
      try {
        await FD.masukPemilik(email, sandi, ingat);
        if (!await FD.sesiPemilik()) throw new Error('Sesi pemilik tidak dapat diverifikasi. Coba lagi.');
        localStorage.removeItem('faisal-account');
        location.href = 'dasbor.html';
      } catch (err) {
        FD.keluarPemilik();
        gagal('Masuk gagal: ' + err.message);
      } finally {
        if (tombol) { tombol.disabled = false; tombol.textContent = 'Masuk ke ruang redaksi →'; }
      }
    });
  }  const lupa = document.querySelector('#form-lupa');
  if (lupa) lupa.addEventListener('submit', (e) => {
    e.preventDefault();
    document.querySelector('#sukses-kirim').classList.remove('hidden');
    toast('Tautan reset dikirim.');
  });
}

/* ---------- Admin: estimasi baca langsung di editor ---------- */
function initEditor() {
  const ta = document.querySelector('#isi');
  const out = document.querySelector('#estimasi-baca');
  if (!ta || !out) return;
  const hitung = () => {
    const kata = jumlahKata([{ text: ta.value }]);
    out.textContent = `${Math.max(1, Math.ceil(kata / WPM))} menit baca`;
  };
  ta.addEventListener('input', hitung);
  hitung();
}

/* ---------- Profil pemilik di sidebar admin ---------- */
function initAdminProfile() {
  if (document.body.dataset.admin !== '1') return;
  const sidebar = document.querySelector('.admin-sidebar');
  if (!sidebar) return;
  const nav = sidebar.querySelector('nav');
  if (nav && !nav.querySelector('[href="posting.html"]')) {
    const tautan = document.createElement('a');
    tautan.href = 'posting.html';
    tautan.textContent = '↑ Tulis Postingan';
    nav.prepend(tautan);
  }
  if (sidebar.querySelector('.admin-profile')) return;
  const profil = document.createElement('div');
  profil.className = 'admin-profile';
  profil.innerHTML = `
    <img src="../assets/img/pemilik-profil-rapi.jpg" alt="Foto profil pemilik Faisal" />
    <div><strong>Faisal Akbar</strong><span>Pemilik & Pemimpin Redaksi</span><span>felixreuss29@gmail.com</span></div>`;
  sidebar.insertBefore(profil, sidebar.querySelector('nav'));
}

/* ---------- Pembatas akses CMS: sesi diverifikasi ke Supabase, bukan penanda lokal ---------- */
async function initAdminGuard() {
  if (document.body.dataset.admin !== '1') return;
  const halaman = location.pathname.split('/').pop();
  if (['login.html', 'lupa-password.html'].includes(halaman)) return;
  document.body.classList.add('guard-checking');
  try {
    if (!await FD.sesiPemilik()) { location.replace('login.html'); return; }
  } catch { location.replace('login.html'); return; }
  document.body.classList.remove('guard-checking');
}

/* ---------- Sidebar admin yang bisa diciutkan ---------- */
function initAdminSidebar() {
  if (document.body.dataset.admin !== '1') return;
  const shell = document.querySelector('.admin-shell');
  const tombol = document.querySelector('[data-sidebar-toggle]');
  if (!shell || !tombol) return;
  const terapkan = (tersembunyi) => {
    shell.classList.toggle('sidebar-hidden', tersembunyi);
    tombol.setAttribute('aria-expanded', String(!tersembunyi));
    tombol.setAttribute('aria-label', tersembunyi ? 'Tampilkan sidebar' : 'Ciutkan sidebar');
  };
  terapkan(localStorage.getItem('faisal-sidebar') === 'hidden');
  tombol.addEventListener('click', () => {
    const tersembunyi = !shell.classList.contains('sidebar-hidden');
    localStorage.setItem('faisal-sidebar', tersembunyi ? 'hidden' : 'shown');
    terapkan(tersembunyi);
  });
}

/* ---------- Filter status di daftar artikel ---------- */
function initArticleFilters() {
  const tombol = document.querySelectorAll('[data-status-filter]');
  if (!tombol.length) return;
  tombol.forEach((b) => b.addEventListener('click', () => {
    tombol.forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    const pilih = b.dataset.statusFilter;
    document.querySelectorAll('[data-status]').forEach((baris) => {
      baris.hidden = pilih !== 'Semua' && baris.dataset.status !== pilih;
    });
  }));
}

/* ---------- Moderasi komentar di dasbor admin ---------- */
async function initModerasi() {
  const masuk = document.querySelector('[data-masuk-pemilik]');
  if (!masuk || !FD) return;
  const status = document.querySelector('[data-status-pemilik]');
  const daftar = document.querySelector('[data-daftar-moderasi]');
  const keluar = document.querySelector('[data-keluar-pemilik]');

  async function perbaruiStatus() {
    const aktif = Boolean(await FD.sesiPemilik());
    masuk.classList.toggle('hidden', aktif);
    keluar?.classList.toggle('hidden', !aktif);
    if (!status) return;
    status.textContent = aktif
      ? 'Anda masuk sebagai pemilik. Komentar dapat dihapus dari sini.'
      : FD.siap()
        ? 'Masuk dengan akun Supabase pemilik untuk menghapus komentar yang tidak pantas.'
        : 'Supabase belum terhubung. Isi URL dan anon key di assets/js/supabase-config.js, lalu jalankan supabase-setup.sql di Supabase.';
  }
  async function muatDaftar() {
    if (!daftar) return;
    try {
      const komentar = await FD.daftarKomentar();
      const jumlah = document.querySelector('[data-stat="komentar"]');
      if (jumlah) jumlah.textContent = String(komentar.length);
      if (!komentar.length) {
        daftar.innerHTML = '<p class="meta">Belum ada komentar pembaca.</p>';
        return;
      }
      daftar.innerHTML = komentar.map((k) => `<div class="moderasi-item">
        <div><strong>${esc(k.nama)}</strong> <span class="meta">· ${esc(k.artikel_id)} · <span data-relative="${esc(k.waktu)}">${waktuRelatif(k.waktu)}</span></span><p>${esc(k.teks)}</p></div>
        ${FD.statusPemilik() ? `<button class="btn btn-outline" type="button" data-hapus-komentar="${esc(k.id)}">Hapus</button>` : ''}
      </div>`).join('');
      updateDynamicTime();
      daftar.querySelectorAll('[data-hapus-komentar]').forEach((b) => b.addEventListener('click', async () => {
        if (!confirm('Hapus komentar ini? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
          await FD.hapusKomentar(b.dataset.hapusKomentar);
          await muatDaftar();
          toast('Komentar dihapus.');
        } catch (e) { toast('Gagal menghapus: ' + e.message); }
      }));
    } catch (e) {
      daftar.innerHTML = '<p class="meta">Gagal memuat komentar: ' + esc(e.message) + '</p>';
    }
  }
  masuk.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = masuk.querySelector('[data-email-pemilik]').value;
    const sandi = masuk.querySelector('[data-sandi-pemilik]').value;
    try {
      await FD.masukPemilik(email, sandi, false);
      if (!await FD.sesiPemilik()) throw new Error('Sesi pemilik tidak dapat diverifikasi.');
      masuk.reset();
      await perbaruiStatus();
      await muatDaftar();
      toast('Berhasil masuk sebagai pemilik.');
    } catch (err) {
      FD.keluarPemilik();
      toast('Masuk gagal: ' + err.message);
      await perbaruiStatus();
    }
  });
  keluar?.addEventListener('click', async () => {
    FD.keluarPemilik();
    await perbaruiStatus();
    await muatDaftar();
    toast('Sesi pemilik diakhiri.');
  });
  await perbaruiStatus();
  muatDaftar();
  const pengikut = document.querySelector('[data-stat="pengikut"]');
  if (pengikut && FD && typeof FD.jumlahPengikut === 'function') {
    try { pengikut.textContent = String(await FD.jumlahPengikut('Faisal Akbar')); }
    catch (e) { pengikut.textContent = '—'; }
  }
}

function sinkronBahasaHP() {
  const hp = document.querySelector('[data-bahasa-hp]');
  const utama = document.querySelector('[data-bahasa]');
  if (!hp || !utama) return;
  hp.innerHTML = utama.innerHTML;
  hp.value = utama.value;
  hp.addEventListener('change', () => {
    utama.value = hp.value;
    utama.dispatchEvent(new Event('change'));
  });
}

/* ---------- SEO: canonical, Open Graph, dan data terstruktur ---------- */
function initSEO() {
  if (document.body.dataset.admin === '1') return;
  const asal = 'https://faisalnews.web.id';
  const bersih = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  let alamat = asal + (bersih === '/' ? '/' : bersih);
  let judul = document.title || 'Faisal — Berita Independen & Terpercaya';
  let deskripsi = document.querySelector('meta[name="description"]')?.content
    || 'Portal berita independen dan tepercaya dari Faisal.';
  let gambar = asal + '/assets/img/hero.jpg';
  let skema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Faisal',
    url: asal + '/',
    description: deskripsi
  };
  if (document.querySelector('#article-root')) {
    const a = postinganTerbaru().find((x) => x.id === idArtikelDariURL());
    if (a) {
      alamat = asal + '/artikel/' + encodeURIComponent(a.id) + '/';
      judul = a.title + ' — Faisal';
      deskripsi = a.excerpt || deskripsi;
      gambar = asal + '/' + gambarArtikel(a).replace(/^\//, '');
      skema = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: a.title,
        description: deskripsi,
        image: gambar,
        url: alamat,
        datePublished: a.published,
        dateModified: a.updated || a.published,
        author: { '@type': 'Person', name: namaPenulis(a) },
        publisher: { '@type': 'Organization', name: 'Faisal' },
        mainEntityOfPage: alamat
      };
    }
  }
  const setMeta = (nama, nilai, atribut = 'property') => {
    let el = document.head.querySelector(`meta[${atribut}="${nama}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute(atribut, nama); document.head.appendChild(el); }
    el.setAttribute('content', nilai);
  };
  let kanonik = document.head.querySelector('link[rel="canonical"]');
  if (!kanonik) { kanonik = document.createElement('link'); kanonik.rel = 'canonical'; document.head.appendChild(kanonik); }
  kanonik.href = alamat;
  setMeta('description', deskripsi, 'name');
  setMeta('og:title', judul);
  setMeta('og:description', deskripsi);
  setMeta('og:type', skema['@type'] === 'NewsArticle' ? 'article' : 'website');
  setMeta('og:url', alamat);
  setMeta('og:image', gambar);
  setMeta('og:site_name', 'Faisal');
  setMeta('twitter:card', 'summary_large_image', 'name');
  setMeta('twitter:title', judul, 'name');
  setMeta('twitter:description', deskripsi, 'name');
  setMeta('twitter:image', gambar, 'name');
  let ld = document.head.querySelector('script[type="application/ld+json"][data-faisal-seo]');
  if (!ld) {
    ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.dataset.faisalSeo = '1';
    document.head.appendChild(ld);
  }
  ld.textContent = JSON.stringify(skema);
}

/* ---------- Inisialisasi ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initAdminGuard();
  initTheme();
  renderHeader(document.body.dataset.page || 'Beranda');
  perbaruiTampilanAkun();
  rapikanNav();
  window.addEventListener('resize', rapikanNav);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rapikanNav);
  initTickerToggle();
  renderFooter();
  if (document.body.dataset.page) initOverlays();
  initForms();
  initFollow();
  initNotifikasi();
  initAuth();
  initEditor();
  initAdminProfile();
  initAdminSidebar();
  initArticleFilters();
  initModerasi();
  if (typeof window.initBahasa === 'function') window.initBahasa();
  sinkronBahasaHP();
  perbaruiAngka();
  catatKunjunganSekali();
  if (document.body.dataset.admin !== '1') {
    // Seluruh konten berasal dari redaksi Faisal. Unggahan CMS dimuat lebih
    // dulu, lalu semua daftar dan News Ticker dirender ulang.
    muatPostingan().then(() => {
      muatBerita();
      perbaruiTicker();
      renderBeritaHarian();
      renderBeritaPage();
      initSEO();
      perbaruiAngka();
      sinkronIkuti();
    });
  }
  startClock();
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', toggleTheme));
});
