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
    const article = ARTICLES.find((a) => a.id === el.dataset.reading);
    if (article) el.textContent = `${readingMinutes(article.body)} menit baca`;
  });
}
function startClock() {
  updateDynamicTime();
  setInterval(updateDynamicTime, 30000);
}

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
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
    b.setAttribute('aria-label', dark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
    b.textContent = dark ? '☀' : '☾';
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
  return peran === 'Pemilik & Redaktur Utama' ? 'Pemilik & Pemimpin Redaksi' : peran;
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
const KATEGORI = ['Politik', 'Nasional', 'Ekonomi', 'Olahraga', 'Hukum', 'Teknologi', 'Internasional', 'Pendidikan'];
function kategoriAktif() {
  const pilihan = new URLSearchParams(location.search).get('k');
  return KATEGORI.includes(pilihan) ? pilihan : 'Politik';
}
const NAV = ['Beranda', 'Berita Terkini', ...KATEGORI];
const NAV_HREF = {
  'Beranda': './', 'Berita Terkini': 'berita', 'Politik': 'kategori?k=Politik',
  'Nasional': 'kategori?k=Nasional', 'Ekonomi': 'kategori?k=Ekonomi', 'Olahraga': 'kategori?k=Olahraga',
  'Hukum': 'kategori?k=Hukum', 'Teknologi': 'kategori?k=Teknologi',
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
        <a class="brand" href="./"><span class="brand-name">Faisal</span><span class="brand-tag">BERITA INDEPENDEN &amp; TERPERCAYA</span></a>
        <nav class="site-nav" aria-label="Navigasi utama">
          ${NAV.map((n) => `<a href="${NAV_HREF[n]}" ${n === active ? 'aria-current="page"' : ''}>${n}</a>`).join('')}
        </nav>
        <div class="header-actions">
          <form class="search-box" data-search-form>
            <label class="sr-only" for="site-search">Cari berita</label>
            <input id="site-search" type="search" placeholder="Cari berita…" />
          </form>
          <div class="language-wrap" data-no-translate>
            <label class="sr-only" for="pilih-bahasa">Pilih bahasa</label>
            <select id="pilih-bahasa" class="language-select" data-bahasa aria-label="Pilih bahasa" title="Pilih bahasa. Terjemahan otomatis; teks asli tetap bahasa Indonesia."></select>
          </div>
          <button class="icon-btn notif-btn" type="button" data-notif-toggle aria-pressed="false" aria-label="Aktifkan notifikasi berita" title="Aktifkan notifikasi berita">
            <span class="notif-lonceng" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span class="notif-silang"></span><span class="notif-titik"></span>
            </span>
          </button>
          <button class="icon-btn" type="button" data-theme-toggle aria-label="Aktifkan mode gelap">☾</button>
          <a class="btn btn-primary" href="donasi">Dukungan</a>
          <button class="icon-btn menu-toggle" type="button" data-menu-toggle aria-label="Buka menu" aria-expanded="false">☰</button>
        </div>
      </div>
    </div>
    <nav class="mobile-nav hidden" aria-label="Navigasi mobile">
      ${NAV.map((n) => `<a href="${NAV_HREF[n]}">${n}</a>`).join('')}
      <a href="donasi">Dukungan</a>
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
  host.querySelector('[data-menu-toggle]').addEventListener('click', (e) => {
    const menu = host.querySelector('.mobile-nav');
    menu.classList.toggle('hidden');
    e.currentTarget.setAttribute('aria-expanded', String(!menu.classList.contains('hidden')));
  });
  updateThemeButton();
}
function renderFooter() {
  const host = document.querySelector('[data-site-footer]');
  if (!host) return;
  const cols = [
    ['Perusahaan', ['Tentang Kami', 'Redaksi', 'Karir', 'Iklan']],
    ['Layanan', ['Berita Terkini', 'Dukungan', 'Newsletter', 'Arsip Berita']],
    ['Hukum', ['Syarat Penggunaan', 'Kebijakan Privasi', 'Koreksi & Hak Jawab', 'Pedoman Media Siber']],
    ['Ikuti Kami', ['Instagram @faisalakbar0423']]
  ];
  const tautan = {
    'Tentang Kami': 'tentang', 'Berita Terkini': 'berita', 'Dukungan': 'donasi',
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
            <p style="font-size:11px;margin:10px 0 0">Pemilik &amp; Pemimpin Redaksi: Faisal Akbar<br />Email: <a href="mailto:felixreuss29@gmail.com">felixreuss29@gmail.com</a><br />QRIS: tersedia di halaman dukungan</p>
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

/* ---------- Konten redaksi: data contoh + unggahan CMS ---------- */
let POSTINGAN = [];

/* Berita dari RSS pihak ketiga sudah tidak dipakai. Semua kartu dan artikel
   berasal dari data contoh redaksi atau unggahan CMS pemilik. */
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
    const id = new URLSearchParams(location.search).get('id') || 'pilkada-2027';
    FD.catatKunjungan(id, 'artikel').catch(() => {});
  }
}
function kartuTerkiniHTML(a) {
  return cardHTML(a);
}
function gabunganTerkini() {
  return [...postinganTerbaru(), ...ARTICLES]
    .sort((a, b) => new Date(b.published || 0) - new Date(a.published || 0))
    .slice(0, 12);
}
function renderBeritaHarian() {
  const host = document.querySelector('#daftar-berita-harian');
  if (!host) return;
  const semua = gabunganTerkini();
  if (!semua.length) {
    host.innerHTML = '<div class="empty-state"><h3>Berita belum tersedia</h3><p>Unggah berita melalui <strong>Tulis Postingan</strong> di CMS.</p></div>';
    return;
  }
  host.innerHTML = `<div class="grid-3">${semua.map(kartuTerkiniHTML).join('')}</div>`;
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
  const tampil = [...postinganTerbaru(), ...ARTICLES]
    .filter((a) => a.category === kategori)
    .sort((a, b) => new Date(b.published || 0) - new Date(a.published || 0))
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
  // News Ticker tetap berjalan, tetapi isinya hanya berita redaksi Faisal.
  const daftar = [...postinganTerbaru(), ...ARTICLES]
    .sort((a, b) => new Date(b.published || 0) - new Date(a.published || 0))
    .slice(0, 6)
    .map((a) => ({ judul: a.title, id: a.id }));
  if (!daftar.length) return;
  const isi = daftar.map((x) => `<a class="ticker-item" href="artikel?id=${encodeURIComponent(x.id)}">${esc(x.judul)}</a><span class="ticker-dot" aria-hidden="true">•</span>`).join('');
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
  const kosong = '<div class="empty-state"><h3>Belum ada berita dari pemilik</h3><p>Gunakan menu <strong>Tulis Postingan</strong> di CMS. Setiap berita yang terbit otomatis tampil di <strong>Berita Terkini</strong> dan di bagian ini.</p></div>';
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
  renderPostingan();
  if (document.querySelector('#article-root')) renderArticle();
  renderCategory();
  renderSearch();
}

/* ---------- Kartu berita ---------- */
function cardHTML(a) {
  const penulis = namaPenulis(a);
  return `<article class="card">
    <a href="artikel?id=${a.id}"><img src="${gambarArtikel(a)}" alt="${esc(a.alt || 'Ilustrasi: ' + a.title)}" loading="lazy" /></a>
    <div class="card-tags"><span class="kicker">${esc(a.category)}</span> <span class="sumber-label">${esc(penulis)}</span></div>
    <h3><a href="artikel?id=${a.id}">${esc(a.title)}</a></h3>
    ${a.excerpt ? `<p class="meta card-excerpt">${esc(a.excerpt)}</p>` : ''}
    ${a.sumberRujukan ? `<p class="meta postingan-sumber">Dirangkum dari: ${esc(sumberPostingan(a))}</p>` : ''}
    <div class="card-meta">
      <span class="meta" data-relative="${a.published}">${waktuRelatif(a.published)}</span>
      <span class="meta" data-view="${esc(a.id)}">Dilihat …</span>
      ${tombolIkuti(penulis, 'btn-follow follow-kicker')}
    </div>
  </article>`;
}
function rankedHTML(list, label = 'Politik') {
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
        <p class="home-about-lead">Faisal adalah portal berita Indonesia yang menyajikan kabar politik, nasional, ekonomi, olahraga, hukum, teknologi, internasional, dan pendidikan.</p>
        <div class="home-about-list">
          <article class="home-about-item">
            <span class="home-about-num" aria-hidden="true">I</span>
            <div><h3>Tentang website ini</h3><p>Faisal menghadirkan berita Indonesia dan dunia dengan bahasa yang jelas, rujukan yang disebutkan, dan pembaruan bila ada perkembangan.</p></div>
          </article>
          <article class="home-about-item">
            <span class="home-about-num" aria-hidden="true">II</span>
            <div><h3>Pemilik &amp; Pemimpin Redaksi</h3><p>Faisal Akbar adalah mahasiswa Antar Bangsa, Jakarta Timur. Situs ini dibuat sebagai sarana belajar sekaligus menyampaikan berita kepada pembaca.</p></div>
          </article>
          <article class="home-about-item">
            <span class="home-about-num" aria-hidden="true">III</span>
            <div><h3>Komitmen redaksi</h3><p>Informasi kami rangkum dari sumber yang kredibel. Untuk perkara hukum yang belum diputus pengadilan, kami menjunjung asas praduga tak bersalah.</p></div>
          </article>
          <article class="home-about-item">
            <span class="home-about-num" aria-hidden="true">IV</span>
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

  const latest = document.querySelector('#latest');
  if (latest) latest.innerHTML = `<div class="grid-3">${ARTICLES.map(cardHTML).join('')}</div>`;

  const politikUtama = ARTICLES[0];
  document.querySelector('#politik').innerHTML = `
    <div class="split">
      <article class="lead"><a href="artikel?id=${politikUtama.id}"><img src="${img('politik3.jpg')}" alt="Ilustrasi suasana rapat politik" /></a><span class="kicker">Politik</span><h3><a href="artikel?id=${politikUtama.id}">${esc(politikUtama.title)}</a></h3></article>
      <div>${rankedHTML(['Komisi II Minta Aturan Turunan Segera Ditetapkan', 'Pengamat: Stabilitas Aturan Jadi Kunci Pemilu 2027', 'KPU Buka Pendaftaran Tenaga Ad Hoc Pemilu', 'Warga Mulai Cek Daftar Pemilih di Kanal Daring'])}</div>
    </div>`;

  document.querySelector('#populer-list').innerHTML = `
    <div class="populer-grid">${POPULAR.map((t, i) => `<div class="pop-row"><span class="num">${String(i + 1).padStart(2, '0')}</span><img src="${img(['hero.jpg', 'politik1.jpg', 'politik2.jpg', 'olahraga1.jpg', 'ekonomi1.jpg'][i])}" alt="Thumb ${i + 1}" loading="lazy" /><h3>${esc(t)}</h3></div>`).join('')}</div>`;
}

/* ---------- Artikel ---------- */
function renderArticle() {
  const host = document.querySelector('#article-root');
  if (!host) return;
  const params = new URLSearchParams(location.search);
  const a = ARTICLES.find((x) => x.id === params.get('id'))
    || POSTINGAN.find((x) => x.id === params.get('id'))
    || ARTICLES[0];
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
    ? 'Pemilik dan pemimpin redaksi Faisal. Mengelola arah redaksi dan memverifikasi berita yang diterbitkan.'
    : `Penulis Faisal. ${peran}.`;
  const isi = a.body.map((b) => {
    if (b.type === 'h2') return `<h2>${esc(b.text)}</h2>`;
    if (b.type === 'quote') return `<blockquote class="pull-quote"><p>“${esc(b.text)}”</p><cite>— ${esc(b.cite)}</cite></blockquote>`;
    return `<p>${esc(b.text)}</p>`;
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
            ${tombolIkuti(penulis, 'btn btn-outline btn-follow', true)}
            <div class="byline-waktu meta"><span data-relative="${a.published}">${waktuRelatif(a.published)}</span> · <span data-view="${esc(a.id)}">Dilihat …</span> · <b data-reading="${a.id}">${readingMinutes(a.body)} menit baca</b></div>
            <div class="share"><span>Bagikan</span><a href="#" data-bagikan="email" aria-label="Email — bagikan lewat email">Email</a><a href="#" data-bagikan="link" aria-label="Link — salin tautan artikel">Link</a></div>
          </div>
          ${dariAdmin ? infoPostinganHTML(a) : ''}
        </header>
        <figure class="article-figure"><img src="${gambarArtikel(a)}" alt="${esc(a.alt || 'Ilustrasi: ' + a.title)}" /><figcaption>${dariAdmin ? 'Foto: ' + esc(kreditFoto(a)) + '.' : 'Ilustrasi artikel. Foto: Dokumentasi Faisal.'}</figcaption></figure>
        <div class="article-body" style="margin-top:28px">${isi}</div>
        <div class="tags"><span class="tag">#Pilkada2027</span><span class="tag">#KPU</span><span class="tag">#Pemilih</span><span class="tag">#Demokrasi</span></div>
        <div class="correction"><strong>Catatan redaksi</strong><br />Jadwal dan tahapan mengikuti kalender resmi penyelenggara pemilu, diperbarui pada <span data-clock></span>.</div>
        <div class="author-bio"><img src="${img(a.author.photo)}" alt="Foto ${esc(penulis)}" /><div><h3>${esc(penulis)}</h3><div class="meta">${esc(peran)} · Faisal</div><p class="meta">${esc(bioTeks)}</p></div>${tombolIkuti(penulis, 'btn btn-outline btn-follow', true)}</div>
        <section class="comments"><h3 class="komentar-judul">Komentar</h3>
          <p class="meta" data-komentar-status>Komentar tampil untuk semua pembaca dan dapat dimoderasi pemilik.</p>
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
          ${ARTICLES.filter((x) => x.id !== a.id).slice(0, 4).map((x) => `<div class="sidebar-item"><a href="artikel?id=${x.id}"><img src="${img(x.image)}" alt="Thumbnail ${esc(x.title)}" loading="lazy" /></a><div><span class="kicker">${esc(x.category)}</span><h3><a href="artikel?id=${x.id}">${esc(x.title)}</a></h3><span class="meta" data-relative="${x.published}">${waktuRelatif(x.published)}</span></div></div>`).join('')}
        </div>
        ${iklanHTML('ad-sidebar')}
        <div class="sidebar-section"><div class="section-head"><span class="section-mark"></span><h2 class="section-title" style="font-size:20px">Terpopuler</h2></div>${rankedHTML(POPULAR)}</div>
        <div class="panel" style="background:var(--accent-soft);border-color:var(--accent-line)"><h2 class="panel-title" style="font-size:18px">Rangkuman harian redaksi</h2><p class="meta">Berita penting pilihan redaksi, setiap pagi di email Anda.</p><form data-newsletter><input type="email" placeholder="Alamat email" autocomplete="email" required aria-label="Alamat email" /><label class="check-row"><input type="checkbox" data-newsletter-setuju required /><span>Saya setuju email saya digunakan untuk rangkuman harian sesuai <a href="kebijakan-privasi">Kebijakan Privasi</a></span></label><button class="btn btn-primary" type="submit">Daftar</button></form><p class="meta" style="margin-top:8px">Berhenti berlangganan: <a href="mailto:felixreuss29@gmail.com">felixreuss29@gmail.com</a>.</p></div>
      </aside>
    </div>`;
  if (dariAdmin) {
    host.querySelector('.correction')?.remove();
    const tags = host.querySelector('.tags');
    if (tags) tags.innerHTML = `<span class="tag">#${esc(a.category)}</span><span class="tag">#Faisal</span>`;
    const figcaption = host.querySelector('.article-figure figcaption');
    if (figcaption) figcaption.textContent = `Foto: ${kreditFoto(a)}.`;
  }
  host.querySelectorAll('[data-bagikan]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    const url = location.href;
    if (b.dataset.bagikan === 'email') location.href = 'mailto:?subject=' + encodeURIComponent(a.title) + '&body=' + encodeURIComponent(url);
    else navigator.clipboard.writeText(url).then(() => toast('Tautan artikel disalin.')).catch(() => toast(url));
  }));
  const artikelId = params.get('id') || a.id;
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
        ? 'Komentar tampil untuk semua pembaca dan dapat dimoderasi pemilik.'
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
  const semua = [...ARTICLES, ...POSTINGAN]
    .filter((a) => a.category === kategori)
    .sort((a, b) => new Date(b.published || 0) - new Date(a.published || 0));
  const utama = semua[0];
  const kartu = semua.map(cardHTML);
  host.innerHTML = `
    <section class="category-band"><div class="wrap"><span class="kicker">Kategori</span><h1>${esc(kategori)}</h1><p>Berita dan analisis ${esc(kategori.toLowerCase())} dari redaksi Faisal.</p></div></section>
    <div class="wrap">
      <div class="filter-bar">${daftarKategori.map((k) => `<a class="chip ${k === kategori ? 'active' : ''}" href="kategori?k=${encodeURIComponent(k)}">${k}</a>`).join('')}</div>
      ${utama ? `<div class="section"><h2 class="sr-only">Sorotan ${esc(kategori)}</h2><div class="split">
        <article class="lead"><a href="artikel?id=${esc(utama.id)}"><img src="${gambarArtikel(utama)}" alt="${esc(utama.alt || 'Ilustrasi: ' + utama.title)}" /></a><span class="kicker">Utama</span><h3><a href="artikel?id=${esc(utama.id)}">${esc(utama.title)}</a></h3></article>
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
  const hasil = q ? ARTICLES.filter((a) => (a.title + a.category + a.excerpt).toLowerCase().includes(kunci)) : [];
  const hasilAdmin = q ? POSTINGAN.filter((a) => (a.title + a.category + a.excerpt).toLowerCase().includes(kunci)) : [];
  const jumlah = hasil.length + hasilAdmin.length;
  host.innerHTML = `
    <div class="wrap" style="padding-top:32px">
      <h1 style="font-family:var(--font-display);font-size:32px;margin:0">Pencarian</h1>
      <p class="result-meta">${q ? `${jumlah} hasil untuk “${esc(q)}”` : 'Masukkan kata kunci pada kolom pencarian di atas.'}</p>
      ${q && !jumlah ? `<div class="empty-state"><h3>Tidak ada hasil</h3><p>Coba kata kunci lain atau lihat berita terkini.</p><a class="btn btn-outline" href="berita">Lihat berita terkini</a></div>` : `
        ${hasilAdmin.length ? `<section class="section"><div class="section-head"><span class="section-mark"></span><h2 class="section-title">Postingan pemilik</h2></div><div class="grid-3">${hasilAdmin.map(cardHTML).join('')}</div></section>` : ''}
        ${hasil.length ? `<section class="section"><div class="section-head"><span class="section-mark"></span><h2 class="section-title">Arsip redaksi</h2></div><div class="grid-3">${hasil.map(cardHTML).join('')}</div></section>` : ''}`}
    </div>`;
  updateDynamicTime();
}

/* ---------- Overlay ---------- */
function initOverlays() {
  if (!localStorage.getItem('faisal-cookie')) {
    const el = document.createElement('aside');
    el.className = 'cookie-banner';
    el.innerHTML = `<h4>Kami menggunakan cookie</h4><p>Untuk mengukur pembaca dan meningkatkan pengalaman Anda.</p><div class="overlay-actions"><button class="btn btn-primary" data-cookie="terima">Terima</button><button class="btn btn-outline" data-cookie="tolak">Tolak</button></div>`;
    document.body.appendChild(el);
    el.querySelectorAll('[data-cookie]').forEach((b) => b.addEventListener('click', () => {
      localStorage.setItem('faisal-cookie', b.dataset.cookie);
      el.remove();
      toast('Preferensi cookie disimpan.');
    }));
  }
  if (!localStorage.getItem('faisal-push')) {
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
  }
}

/* ---------- Form umum ---------- */
function initForms() {
  document.querySelectorAll('[data-newsletter]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = f.querySelector('input[type="email"]');
    const setuju = f.querySelector('[data-newsletter-setuju]');
    if (!input.checkValidity()) return toast('Alamat email tidak valid. Contoh: nama@email.com');
    if (!setuju) return toast('Persetujuan belum tersedia pada formulir ini.');
    if (!setuju.checked) {
      setuju.focus();
      return toast('Centang persetujuan terlebih dahulu untuk menerima rangkuman.');
    }
    const email = input.value.trim();
    const pesan = `Permintaan rangkuman harian Faisal\nEmail: ${email}\n\nSaya setuju email saya digunakan untuk menerima rangkuman harian sesuai Kebijakan Privasi Faisal.`;
    const tautan = `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent('Permintaan rangkuman harian Faisal')}&body=${encodeURIComponent(pesan)}`;
    const a = document.createElement('a');
    a.href = tautan;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('Permintaan disiapkan di aplikasi email Anda. Kirim pesannya untuk bergabung.');
    input.value = '';
    setuju.checked = false;
  }));
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
  }
  const lupa = document.querySelector('#form-lupa');
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
  if (halaman === 'login-2fa.html') { location.replace('login.html'); return; }
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

/* ---------- Inisialisasi ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initAdminGuard();
  initTheme();
  renderHeader(document.body.dataset.page || 'Beranda');
  initTickerToggle();
  renderFooter();
  renderHome();
  renderArticle();
  renderCategory();
  renderSearch();
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
      perbaruiAngka();
      sinkronIkuti();
    });
  }
  startClock();
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', toggleTheme));
});
