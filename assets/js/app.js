/* ============================================================
   Faisal — perilaku web statis (GitHub Pages ready)
   ============================================================ */

const WPM = 200;
const TZ = 'Asia/Jakarta';
const OWNER_EMAIL = 'felixreuss29@gmail.com';
const img = (name) => `assets/img/${name}`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function hashTeks(teks) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(teks));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

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

/* ---------- Header & footer ---------- */
const NAV = ['Beranda', 'Berita Terkini', 'Politik', 'Nasional', 'Ekonomi', 'Olahraga', 'Hukum', 'Opini', 'Teknologi'];
const NAV_HREF = {
  'Beranda': 'index.html', 'Berita Terkini': 'berita.html', 'Politik': 'kategori.html',
  'Nasional': 'kategori.html', 'Ekonomi': 'kategori.html', 'Olahraga': 'kategori.html',
  'Hukum': 'kategori.html', 'Opini': 'kategori.html', 'Teknologi': 'kategori.html'
};
function renderHeader(active = 'Beranda') {
  const host = document.querySelector('[data-site-header]');
  if (!host) return;
  host.innerHTML = `
    <div class="utility">
      <div class="wrap">
        <span data-clock></span>
        <div class="utility-links">
          <a href="tentang.html">Tentang Kami</a><a href="statis.html">Pedoman Media Siber</a><a href="statis.html">Redaksi</a>
          <a href="statis.html">Karir</a><a href="statis.html">Iklan</a>
        </div>
      </div>
    </div>
    <div class="masthead">
      <div class="wrap">
        <a class="brand" href="index.html"><span class="brand-name">Faisal</span><span class="brand-tag">BERITA INDEPENDEN &amp; TERPERCAYA</span></a>
        <nav class="site-nav" aria-label="Navigasi utama">
          ${NAV.map((n) => `<a href="${NAV_HREF[n]}" ${n === active ? 'aria-current="page"' : ''}>${n}</a>`).join('')}
        </nav>
        <div class="header-actions">
          <form class="search-box" data-search-form>
            <label class="sr-only" for="site-search">Cari berita</label>
            <input id="site-search" type="search" placeholder="Cari berita…" />
          </form>
          <button class="icon-btn" type="button" data-theme-toggle aria-label="Aktifkan mode gelap">☾</button>
          <a class="btn btn-primary" href="langganan.html">Langganan</a>
          <button class="icon-btn menu-toggle" type="button" data-menu-toggle aria-label="Buka menu" aria-expanded="false">☰</button>
        </div>
      </div>
    </div>
    <nav class="mobile-nav hidden" aria-label="Navigasi mobile">
      ${NAV.map((n) => `<a href="${NAV_HREF[n]}">${n}</a>`).join('')}
      <a href="langganan.html">Langganan</a><a href="login.html">Masuk CMS</a>
    </nav>
    <div class="ticker">
      <div class="wrap" style="display:flex;align-items:center;gap:14px;width:100%">
        <span class="ticker-label">REAKSI</span>
        <span class="ticker-text" data-ticker>Topik terkini sedang dimuat…</span>
      </div>
    </div>`;
  host.querySelector('[data-search-form]').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = host.querySelector('#site-search').value.trim();
    location.href = `pencarian.html${q ? '?q=' + encodeURIComponent(q) : ''}`;
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
    ['Layanan', ['Berita Terkini', 'Langganan', 'Newsletter', 'Arsip Berita']],
    ['Hukum', ['Pedoman Media Siber', 'Hak Jawab', 'Kebijakan Privasi', 'Cookie']],
    ['Ikuti Kami', ['Instagram @faisalakbar0423']]
  ];
  const tautan = {
    'Tentang Kami': 'tentang.html', 'Berita Terkini': 'berita.html', 'Langganan': 'langganan.html',
    'Instagram @faisalakbar0423': 'https://www.instagram.com/faisalakbar0423/'
  };
  const hrefFooter = (label) => tautan[label] || 'statis.html';
  const eksternal = (label) => (tautan[label] || '').startsWith('http');
  host.innerHTML = `
    <footer class="site-footer">
      <div class="wrap">
        <div class="footer-grid">
          <div>
            <span class="brand-name">Faisal</span>
            <p style="font-size:11px;margin:12px 0 0">Berita independen dan tepercaya untuk Indonesia.</p>
            <p style="font-size:11px;margin:10px 0 0">Pemilik: <a href="mailto:felixreuss29@gmail.com">felixreuss29@gmail.com</a><br />WhatsApp: <a href="https://wa.me/6281286484770">081286484770</a><br />QRIS: tersedia di halaman langganan</p>
          </div>
          ${cols.map(([t, links]) => `<div><h3>${t}</h3><ul>${links.map((l) => `<li><a href="${hrefFooter(l)}" ${eksternal(l) ? 'target="_blank" rel="noopener noreferrer"' : ''}>${l}</a></li>`).join('')}</ul></div>`).join('')}
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Faisal Media. Seluruh hak dilindungi.</span>
          <span>Diterbitkan dengan prinsip kejurnalisme yang terbuka dan bertanggung jawab.</span>
        </div>
      </div>
    </footer>`;
}

/* ---------- Berita harian dari RSS (diperbarui GitHub Actions) ---------- */
let BERITA = { articles: [], generatedAt: '', sourceName: 'ANTARA News' };
let POSTINGAN = [];
let AKSES = { hash: '' };

async function muatAkses() {
  try {
    const res = await fetch('assets/js/access.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      AKSES.hash = data.hash || '';
    }
  } catch (e) {
    console.warn('Data akses tidak dapat dimuat:', e.message);
  }
  terapkanAkses();
}
function terapkanAkses() {
  const aktif = !!AKSES.hash && localStorage.getItem('faisal-akses') === AKSES.hash;
  document.querySelectorAll('.paywall').forEach((el) => el.classList.toggle('hidden', aktif));
  const status = document.querySelector('[data-akses-status]');
  if (status) status.textContent = aktif ? 'Langganan aktif pada perangkat ini.' : '';
}

function beritaCardHTML(a, denganRingkasan = true) {
  const gambar = a.image
    ? `<a href="${esc(a.link)}" target="_blank" rel="noopener noreferrer"><img src="${a.image.startsWith('assets/') ? a.image : img(a.image)}" alt="Foto berita: ${esc(a.title)}" loading="lazy" /></a>`
    : '';
  return `<article class="card">
    ${gambar}
    <div style="margin-top:10px"><span class="kicker">${esc(a.category)}</span> <span class="sumber-label">${esc(a.sumber || 'ANTARA News')}</span></div>
    <h3><a href="${esc(a.link)}" target="_blank" rel="noopener noreferrer">${esc(a.title)}</a></h3>
    ${denganRingkasan ? `<p class="meta card-excerpt">${esc(a.excerpt)}</p>` : ''}
    <span class="meta" data-relative="${a.published}">${waktuRelatif(a.published)}</span>
  </article>`;
}
function labelPembaruan() {
  document.querySelectorAll('[data-news-updated]').forEach((el) => {
    if (!BERITA.generatedAt) return;
    const t = new Date(BERITA.generatedAt);
    el.textContent = `Diperbarui otomatis ${formatTanggal(t)}, ${formatJam(t)} WIB · Sumber: ${BERITA.sourceName || 'ANTARA News'}`;
  });
}
function renderBeritaHarian() {
  const host = document.querySelector('#daftar-berita-harian');
  if (!host) return;
  if (!BERITA.articles.length) {
    host.innerHTML = '<div class="empty-state"><h3>Berita belum tersedia</h3><p>Jalankan <code>node scripts/update-news.mjs</code> atau tunggu pembaruan harian oleh GitHub Actions.</p></div>';
    return;
  }
  host.innerHTML = `<div class="grid-3">${BERITA.articles.slice(0, 6).map((a) => beritaCardHTML(a, false)).join('')}</div>`;
  labelPembaruan();
  updateDynamicTime();
}
function renderBeritaPage() {
  const host = document.querySelector('#berita-root');
  if (!host) return;
  const semua = BERITA.articles;
  if (!semua.length) {
    host.innerHTML = '<div class="empty-state"><h3>Berita belum tersedia</h3><p>Data harian dibuat oleh <code>scripts/update-news.mjs</code>.</p></div>';
    return;
  }
  const kategori = [...new Set(semua.map((a) => a.category))];
  host.innerHTML = `
    <h2 class="sr-only">Daftar berita terkini</h2>
    <div class="filter-bar" aria-label="Filter kategori berita">
      <button class="chip active" type="button" data-berita-filter="Semua">Semua</button>
      ${kategori.map((k) => `<button class="chip" type="button" data-berita-filter="${esc(k)}">${esc(k)}</button>`).join('')}
    </div>
    <p class="result-meta" data-news-updated></p>
    <div class="grid-3" id="grid-berita">${semua.map((a) => beritaCardHTML(a)).join('')}</div>
    <p class="meta" style="margin-top:20px">Seluruh judul dan foto bersumber dari <a href="https://www.antaranews.com" target="_blank" rel="noopener noreferrer">ANTARA News</a>. Klik judul untuk membaca di situs sumber.</p>`;
  labelPembaruan();
  updateDynamicTime();
  host.querySelectorAll('[data-berita-filter]').forEach((b) => b.addEventListener('click', () => {
    host.querySelectorAll('[data-berita-filter]').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    const pilih = b.dataset.beritaFilter;
    host.querySelector('#grid-berita').innerHTML = semua
      .filter((a) => pilih === 'Semua' || a.category === pilih)
      .map((a) => beritaCardHTML(a)).join('');
    updateDynamicTime();
  }));
}
function renderBeritaKategori() {
  const host = document.querySelector('#berita-kategori');
  if (!host || !BERITA.articles.length) return;
  const pilihan = BERITA.articles.filter((a) => a.category === 'Politik');
  const tampil = (pilihan.length ? pilihan : BERITA.articles).slice(0, 3);
  host.innerHTML = `<div class="section-head"><span class="section-mark"></span><h2 class="section-title">Berita terkini dari ANTARA</h2><a class="section-more" href="berita.html">Lihat semua →</a></div>
    <p class="meta" data-news-updated></p>
    <div class="grid-3">${tampil.map((a) => beritaCardHTML(a, false)).join('')}</div>`;
  labelPembaruan();
  updateDynamicTime();
}
function perbaruiTicker() {
  const el = document.querySelector('[data-ticker]');
  if (!el || !BERITA.articles.length) return;
  const potong = (s) => s.length > 72 ? s.slice(0, 69).replace(/\s+\S*$/, '') + '…' : s;
  // Utamakan topik yang sedang ramai; jika tidak ada, pakai tiga berita terbaru.
  const kataViral = ['cpns', 'pongkor', 'km 50', 'hoaks', 'badak', 'pilkada', 'pemilu', 'inflasi', 'slank', 'pon'];
  const pilihan = kataViral
    .map((k) => BERITA.articles.find((a) => a.title.toLowerCase().includes(k)))
    .filter(Boolean)
    .slice(0, 3);
  const daftar = pilihan.length ? pilihan : BERITA.articles.slice(0, 3);
  el.textContent = daftar.map((a) => potong(a.title)).join(' · ');
}
async function muatBerita() {
  try {
    const res = await fetch('assets/js/news.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (Array.isArray(data.articles)) BERITA = data;
  } catch (e) {
    console.warn('Berita harian tidak dapat dimuat:', e.message);
  }
  perbaruiTicker();
  renderBeritaHarian();
  renderBeritaPage();
  renderBeritaKategori();
  renderSearch();
}

/* ---------- Postingan yang diunggah admin dari CMS ---------- */
function renderPostingan() {
  const kosong = '<p class="meta">Belum ada postingan dari admin. Gunakan menu <strong>Tulis Postingan</strong> di CMS untuk menambah.</p>';
  const isi = POSTINGAN.length ? `<div class="grid-3">${POSTINGAN.map(cardHTML).join('')}</div>` : kosong;
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
  renderSearch();
}

/* ---------- Kartu berita ---------- */
function cardHTML(a) {
  return `<article class="card">
    <a href="artikel.html?id=${a.id}"><img src="${img(a.image)}" alt="Ilustrasi: ${esc(a.title)}" loading="lazy" /></a>
    <div style="margin-top:10px"><span class="kicker">${esc(a.category)}</span></div>
    <h3><a href="artikel.html?id=${a.id}">${esc(a.title)}</a></h3>
    <span class="meta" data-relative="${a.published}">${waktuRelatif(a.published)}</span>
  </article>`;
}
function rankedHTML(list) {
  return `<ol class="ranked-list">${list.map((t, i) => `<li><span class="rank">${String(i + 1).padStart(2, '0')}</span><div><h3>${esc(t)}</h3><span class="meta">Politik</span></div></li>`).join('')}</ol>`;
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
        <a class="btn" href="https://www.tiktok.com/@felixreuss" target="_blank" rel="noopener noreferrer" aria-label="Buka TikTok Faisal">TikTok ↗</a>
      </span>
    </div>`;
}
function renderHome() {
  const hero = document.querySelector('#hero');
  if (!hero) return;
  const [utama, ...lain] = ARTICLES;
  hero.innerHTML = `
    ${iklanHTML('ad-leaderboard')}
    <div class="hero-grid" style="margin-top:24px">
      <article class="hero-main">
        <a href="artikel.html?id=${utama.id}"><img src="${img(utama.image)}" alt="Ilustrasi: ${esc(utama.title)}" /></a>
        <div class="hero-overlay">
          <span class="kicker">${esc(utama.category)}</span>
          <h2><a href="artikel.html?id=${utama.id}">${esc(utama.title)}</a></h2>
          <div class="meta">${esc(utama.author.name)} · <span data-relative="${utama.published}">${waktuRelatif(utama.published)}</span></div>
        </div>
      </article>
      <div class="featured">
        ${lain.slice(0, 2).map((a) => `<article class="featured-item">
          <a href="artikel.html?id=${a.id}"><img src="${img(a.image)}" alt="Ilustrasi: ${esc(a.title)}" loading="lazy" /></a>
          <div><span class="kicker">${esc(a.category)}</span><h3><a href="artikel.html?id=${a.id}">${esc(a.title)}</a></h3><span class="meta" data-relative="${a.published}">${waktuRelatif(a.published)}</span></div>
        </article>`).join('')}
      </div>
    </div>`;

  document.querySelector('#latest').innerHTML = `<div class="grid-3">${ARTICLES.map(cardHTML).join('')}</div>`;

  document.querySelector('#politik').innerHTML = `
    <div class="split">
      <article class="lead"><a href="artikel.html?id=${utama.id}"><img src="${img('politik3.jpg')}" alt="Ilustrasi suasana rapat politik" /></a><span class="kicker">Politik</span><h3><a href="artikel.html?id=${utama.id}">${esc(utama.title)}</a></h3></article>
      <div>${rankedHTML(['Komisi II Minta Aturan Turunan Segera Ditetapkan', 'Pengamat: Stabilitas Aturan Jadi Kunci Pemilu 2027', 'KPU Buka Pendaftaran Tenaga Ad Hoc Pemilu', 'Warga Mulai Cek Daftar Pemilih di Kanal Daring'])}</div>
    </div>`;

  document.querySelector('#populer-fakta').innerHTML = `
    <div class="two-col">
      <section class="panel"><h2 class="panel-title">Terpopuler</h2>
        ${POPULAR.map((t, i) => `<div class="pop-row"><span class="num">${String(i + 1).padStart(2, '0')}</span><img src="${img(['news4.jpg', 'politik1.jpg', 'politik2.jpg', 'olahraga1.jpg', 'ekonomi1.jpg'][i])}" alt="Thumb ${i + 1}" loading="lazy" /><h3>${esc(t)}</h3></div>`).join('')}
      </section>
      <section class="panel panel-teal"><h2 class="panel-title">Cek Fakta</h2>
        ${[['Hoaks: KPU Umumkan Pemenang Pilkada 2027', 'Palsu'], ['Video Pejabat Terima Suap adalah Manipulasi', 'Palsu'], ['Angka Inflasi 2,8 Persen Sesuai Data BPS', 'Fakta']].map(([t, s]) => `<div class="fact-row"><span class="fact-icon ${s === 'Fakta' ? 'true' : 'false'}" aria-label="${s}">${s === 'Fakta' ? '✓' : '✕'}</span><div><h3>${esc(t)}</h3><span class="meta">${s} · <span data-relative="${ARTICLES[0].published}">${waktuRelatif(ARTICLES[0].published)}</span></span></div></div>`).join('')}
      </section>
    </div>`;

  document.querySelector('#opini').innerHTML = `<div class="opinion-grid">${OPINIONS.map((o) => `<article class="opinion-card"><div class="opinion-head"><img src="${img(o.author.photo)}" alt="Foto ${esc(o.author.name)}" loading="lazy" /><div><span class="kicker">Opini</span><div class="meta">${esc(o.author.name)} · ${esc(o.author.role)}</div></div></div><h3>${esc(o.title)}</h3><a class="kicker" href="statis.html">Baca opini →</a></article>`).join('')}</div>`;

  document.querySelector('#media').innerHTML = `
    <div class="media-grid">
      <div class="video-box"><img src="${img('video1.jpg')}" alt="Ringkasan sidang sengketa pilkada" /><button class="play-btn" type="button" data-toast="Memutar video…">▶</button><div class="media-caption">Ringkasan Sidang Perdana Sengketa Pilkada</div></div>
      <div>${[['Peta Sebaran Kursi DPR Hasil Pemilu 2024', 'infografis.jpg'], ['Alur Penghitungan Suara Pilkada', 'galeri1.jpg']].map(([t, f]) => `<div class="infographic"><img src="${img(f)}" alt="Infografis: ${esc(t)}" loading="lazy" /><div><span class="kicker kicker-teal">Infografis</span><h3>${esc(t)}</h3><span class="meta">25 Nov 2026</span></div></div>`).join('')}</div>
    </div>`;
}

/* ---------- Artikel ---------- */
function renderArticle() {
  const host = document.querySelector('#article-root');
  if (!host) return;
  const params = new URLSearchParams(location.search);
  const a = ARTICLES.find((x) => x.id === params.get('id'))
    || POSTINGAN.find((x) => x.id === params.get('id'))
    || ARTICLES[0];
  const dariAdmin = POSTINGAN.some((p) => p.id === a.id);
  const isi = a.body.map((b) => {
    if (b.type === 'h2') return `<h2>${esc(b.text)}</h2>`;
    if (b.type === 'quote') return `<blockquote class="pull-quote"><p>“${esc(b.text)}”</p><cite>— ${esc(b.cite)}</cite></blockquote>`;
    return `<p>${esc(b.text)}</p>`;
  }).join('');
  host.innerHTML = `
    <div class="breadcrumb"><a href="index.html">Beranda</a> › <a href="kategori.html">${esc(a.category)}</a> › ${esc(a.title)}</div>
    <div class="article-layout">
      <div>
        <header class="article-head">
          <span class="kicker">${esc(a.category)}</span>
          <h1>${esc(a.title)}</h1>
          <p class="article-lead">${esc(a.excerpt)}</p>
          <div class="byline">
            <img src="${img(a.author.photo)}" alt="Foto ${esc(a.author.name)}" />
            <div><strong>${esc(a.author.name)}</strong><span class="meta">${esc(a.author.role)}</span></div>
            <div class="meta"><span data-relative="${a.published}">${waktuRelatif(a.published)}</span> · <b data-reading="${a.id}">${readingMinutes(a.body)} menit baca</b></div>
            <div class="share"><span>Bagikan</span><a href="#" data-bagikan="wa" aria-label="WA — bagikan ke WhatsApp">WA</a><a href="#" data-bagikan="email" aria-label="Email — bagikan lewat email">Email</a><a href="#" data-bagikan="link" aria-label="Link — salin tautan artikel">Link</a></div>
          </div>
        </header>
        <figure class="article-figure"><img src="${img(a.image)}" alt="Ilustrasi: ${esc(a.title)}" /><figcaption>Ilustrasi artikel. Foto: Dokumentasi Faisal.</figcaption></figure>
        <div class="article-body" style="margin-top:28px">${isi}</div>
        <section class="paywall" style="margin-top:32px">
          <span class="kicker">Langganan</span><h3>Artikel ini hanya untuk pelanggan</h3>
          <p>Dukung jurnalisme independen dan baca seluruh artikel tanpa batas. Mulai dari Rp 10.000 per bulan.</p>
          <div class="paywall-actions"><a class="btn btn-primary" href="langganan.html">Lihat Paket Langganan</a></div>
          <p class="meta" style="margin-top:14px">Sudah bayar via QRIS dan mengirim bukti? Masukkan kode akses yang dikirim pemilik setelah bukti dicek.</p>
          <form class="akses-form" data-akses-form>
            <label class="sr-only" for="kode-akses">Kode akses langganan</label>
            <input id="kode-akses" type="text" placeholder="Kode akses dari pemilik" autocomplete="off" required />
            <button class="btn btn-outline" type="submit">Buka akses</button>
          </form>
          <span class="error hidden" data-akses-error>Kode tidak valid. Periksa kembali pesan dari pemilik.</span>
          <p class="meta" data-akses-status aria-live="polite"></p>
          <p class="meta">Belum berlangganan? <a href="langganan.html#form-konfirmasi">Kirim bukti pembayaran di sini.</a> Bantuan: <a href="https://wa.me/6281286484770">081286484770</a> · <a href="mailto:felixreuss29@gmail.com">felixreuss29@gmail.com</a></p>
        </section>
        <div class="tags"><span class="tag">#Pilkada2027</span><span class="tag">#KPU</span><span class="tag">#Pemilih</span><span class="tag">#Demokrasi</span></div>
        <div class="correction"><strong>Catatan redaksi</strong><br />Jadwal dan tahapan mengikuti kalender resmi penyelenggara pemilu, diperbarui pada <span data-clock></span>.</div>
        <div class="author-bio"><img src="${img(a.author.photo)}" alt="Foto penulis" /><div><h3>${esc(a.author.name)}</h3><div class="meta">${esc(a.author.role)} · Faisal</div><p class="meta">Meliput dinamika parlemen dan proses pemilu sejak 2015.</p></div><button class="btn btn-outline" data-toast="Anda mengikuti penulis ini">+ Ikuti penulis</button></div>
        <section class="comments"><h3 class="komentar-judul">Komentar</h3>
          <div class="comment-form"><label class="sr-only" for="komentar">Komentar</label><textarea id="komentar" placeholder="Bagikan pandangan Anda tentang artikel ini…"></textarea><div class="row"><button class="btn btn-primary" type="button" data-kirim-komentar>Kirim</button></div></div>
          <div id="daftar-komentar">
            <div class="empty-state" id="komentar-kosong"><h4>Belum ada komentar</h4><p>Jadilah yang pertama berbagi pandangan. Komentar tersimpan di perangkat Anda.</p></div>
          </div>
        </section>
      </div>
      <aside>
        <div class="sidebar-section"><div class="section-head"><span class="section-mark"></span><h2 class="section-title" style="font-size:20px">Artikel Terkait</h2></div>
          ${ARTICLES.filter((x) => x.id !== a.id).slice(0, 4).map((x) => `<div class="sidebar-item"><a href="artikel.html?id=${x.id}"><img src="${img(x.image)}" alt="Thumbnail ${esc(x.title)}" loading="lazy" /></a><div><span class="kicker">${esc(x.category)}</span><h3><a href="artikel.html?id=${x.id}">${esc(x.title)}</a></h3><span class="meta" data-relative="${x.published}">${waktuRelatif(x.published)}</span></div></div>`).join('')}
        </div>
        ${iklanHTML('ad-sidebar')}
        <div class="sidebar-section"><div class="section-head"><span class="section-mark"></span><h2 class="section-title" style="font-size:20px">Terpopuler</h2></div>${rankedHTML(POPULAR)}</div>
        <div class="panel" style="background:var(--accent-soft);border-color:var(--accent-line)"><h2 class="panel-title" style="font-size:18px">Rangkuman harian redaksi</h2><p class="meta">Berita penting pilihan redaksi, setiap pagi di email Anda.</p><form data-newsletter><input type="email" placeholder="Alamat email" required aria-label="Alamat email" /><button class="btn btn-primary" type="submit">Daftar</button></form></div>
      </aside>
    </div>`;
  if (dariAdmin) {
    host.querySelector('.paywall')?.remove();
    host.querySelector('.correction')?.remove();
    const tags = host.querySelector('.tags');
    if (tags) tags.innerHTML = `<span class="tag">#${esc(a.category)}</span><span class="tag">#Faisal</span>`;
    const bio = host.querySelector('.author-bio p.meta');
    if (bio) bio.textContent = 'Pemilik dan redaktur utama Faisal.';
    const figcaption = host.querySelector('.article-figure figcaption');
    if (figcaption) figcaption.textContent = a.alt ? `Foto: ${esc(a.alt)}.` : 'Foto: Dokumentasi Faisal.';
  }
  host.querySelectorAll('[data-bagikan]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    const url = location.href;
    if (b.dataset.bagikan === 'wa') window.open('https://wa.me/?text=' + encodeURIComponent(a.title + ' — ' + url), '_blank', 'noopener,noreferrer');
    else if (b.dataset.bagikan === 'email') location.href = 'mailto:?subject=' + encodeURIComponent(a.title) + '&body=' + encodeURIComponent(url);
    else navigator.clipboard.writeText(url).then(() => toast('Tautan artikel disalin.')).catch(() => toast(url));
  }));
  host.querySelector('[data-akses-form]')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = host.querySelector('#kode-akses');
    const kode = input.value.trim();
    const galat = host.querySelector('[data-akses-error]');
    if (!kode) return toast('Masukkan kode akses dari pemilik.');
    if (!AKSES.hash) return toast('Kode akses belum disiapkan pemilik.');
    const cocok = (await hashTeks(kode)) === AKSES.hash;
    galat.classList.toggle('hidden', cocok);
    if (!cocok) return;
    localStorage.setItem('faisal-akses', AKSES.hash);
    terapkanAkses();
    const ditandai = tandaiTerverifikasiDenganKode();
    toast(ditandai
      ? 'Akses terbuka. Status pengajuan pada perangkat ini sudah terverifikasi.'
      : 'Akses langganan terbuka pada perangkat ini.');
  });
  const kunciKomentar = 'faisal-komentar-' + (params.get('id') || 'default');
  const bacaKomentar = () => { try { return JSON.parse(localStorage.getItem(kunciKomentar) || '[]'); } catch { return []; } };
  const isiKomentar = (k) => `<img src="${img('author4.jpg')}" alt="Foto Anda" /><div><h4>Anda · <span class="meta" data-relative="${k.waktu}">${waktuRelatif(k.waktu)}</span></h4><p>${esc(k.teks)}</p><button class="kicker komentar-aksi" type="button" data-toast="Balasan belum tersedia">Balas</button> <a class="kicker" href="statis.html#hak-jawab">Laporkan</a></div>`;
  const perbaruiKomentar = () => {
    const daftar = bacaKomentar();
    host.querySelector('.komentar-judul').textContent = `Komentar (${daftar.length})`;
    host.querySelector('#komentar-kosong')?.classList.toggle('hidden', daftar.length > 0);
    host.querySelectorAll('#daftar-komentar .comment[data-saya]').forEach((n) => n.remove());
    const wadah = host.querySelector('#daftar-komentar');
    daftar.slice().reverse().forEach((k) => {
      const node = document.createElement('div');
      node.className = 'comment';
      node.dataset.saya = '1';
      node.innerHTML = isiKomentar(k);
      wadah.prepend(node);
    });
    updateDynamicTime();
    host.querySelectorAll('.comment[data-saya] [data-toast]').forEach((el) => el.addEventListener('click', (e) => {
      e.preventDefault();
      toast(el.dataset.toast);
    }));
  };
  perbaruiKomentar();
  host.querySelector('[data-kirim-komentar]').addEventListener('click', () => {
    const ta = host.querySelector('#komentar');
    const teks = ta.value.trim();
    if (!teks) return toast('Komentar tidak boleh kosong.');
    const daftar = bacaKomentar();
    daftar.push({ teks, waktu: new Date().toISOString() });
    localStorage.setItem(kunciKomentar, JSON.stringify(daftar));
    ta.value = '';
    perbaruiKomentar();
    toast('Komentar tersimpan di perangkat ini.');
  });
}

/* ---------- Kategori ---------- */
function renderCategory() {
  const host = document.querySelector('#category-root');
  if (!host) return;
  const topik = ['Semua', 'Pemilu', 'DPR', 'KPU', 'Partai', 'Hukum', 'Kebijakan'];
  host.innerHTML = `
    <section class="category-band"><div class="wrap"><span class="kicker">Kategori</span><h1>Politik</h1><p>Liputan mendalam parlemen, pemilu, kebijakan publik, dan dinamika kekuasaan.</p></div></section>
    <div class="wrap">
      <div class="filter-bar">${topik.map((t, i) => `<button class="chip ${i === 0 ? 'active' : ''}" data-filter type="button">${t}</button>`).join('')}<select aria-label="Urutkan"><option>Terbaru</option><option>Terpopuler</option></select></div>
      <div class="section"><h2 class="sr-only">Sorotan politik</h2><div class="split">
        <article class="lead"><a href="artikel.html?id=${ARTICLES[0].id}"><img src="${img(ARTICLES[0].image)}" alt="Berita utama politik" /></a><span class="kicker">Utama</span><h3><a href="artikel.html?id=${ARTICLES[0].id}">${esc(ARTICLES[0].title)}</a></h3></article>
        <div>${rankedHTML(['Sengketa Pilkada: MK Gelar Sidang Perdana', 'Komisi II Minta Aturan Turunan Segera Ditetapkan', 'Warga Mulai Cek Daftar Pemilih di Kanal Daring'])}</div>
      </div></div>
      <div class="section"><div class="section-head"><span class="section-mark"></span><h2 class="section-title">Berita Politik</h2></div><div class="grid-3">${ARTICLES.map(cardHTML).join('')}</div></div>
      <button class="load-more" data-toast="Menampilkan artikel berikutnya…">Muat lebih banyak</button>
    </div>`;
  host.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => {
    host.querySelectorAll('[data-filter]').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
  }));
}

/* ---------- Pencarian ---------- */
function renderSearch() {
  const host = document.querySelector('#search-root');
  if (!host) return;
  const q = new URLSearchParams(location.search).get('q') || '';
  const kunci = q.toLowerCase();
  const hasil = q ? ARTICLES.filter((a) => (a.title + a.category + a.excerpt).toLowerCase().includes(kunci)) : [];
  const hasilBerita = q ? BERITA.articles.filter((a) => (a.title + a.category + a.excerpt).toLowerCase().includes(kunci)) : [];
  const hasilAdmin = q ? POSTINGAN.filter((a) => (a.title + a.category + a.excerpt).toLowerCase().includes(kunci)) : [];
  const jumlah = hasil.length + hasilBerita.length + hasilAdmin.length;
  host.innerHTML = `
    <div class="wrap" style="padding-top:32px">
      <h1 style="font-family:var(--font-display);font-size:32px;margin:0">Pencarian</h1>
      <p class="result-meta">${q ? `${jumlah} hasil untuk “${esc(q)}”` : 'Masukkan kata kunci pada kolom pencarian di atas.'}</p>
      ${q && !jumlah ? `<div class="empty-state"><h3>Tidak ada hasil</h3><p>Coba kata kunci lain atau lihat berita terkini.</p><a class="btn btn-outline" href="berita.html">Lihat berita terkini</a></div>` : `
        ${hasilAdmin.length ? `<section class="section"><div class="section-head"><span class="section-mark"></span><h2 class="section-title">Postingan admin</h2></div><div class="grid-3">${hasilAdmin.map(cardHTML).join('')}</div></section>` : ''}
        ${hasilBerita.length ? `<section class="section"><div class="section-head"><span class="section-mark"></span><h2 class="section-title">Berita terkini · ANTARA News</h2></div><div class="grid-3">${hasilBerita.map((a) => beritaCardHTML(a, false)).join('')}</div></section>` : ''}
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
  if (!localStorage.getItem('faisal-push') && Math.random() > 0.5) {
    const el = document.createElement('aside');
    el.className = 'push-prompt';
    el.innerHTML = `<h4>Izin notifikasi</h4><p>Terima berita penting langsung di perangkat Anda.</p><div class="overlay-actions"><button class="btn btn-primary" data-push="izin">Izinkan</button><button class="btn btn-outline" data-push="nanti">Nanti saja</button></div>`;
    document.body.appendChild(el);
    el.querySelectorAll('[data-push]').forEach((b) => b.addEventListener('click', () => {
      localStorage.setItem('faisal-push', b.dataset.push);
      el.remove();
    }));
  }
}

/* ---------- Form umum ---------- */
function initForms() {
  document.querySelectorAll('[data-newsletter]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = f.querySelector('input[type="email"]');
    if (!input.checkValidity()) return toast('Alamat email tidak valid.');
    toast('Terima kasih! Newsletter akan dikirim ke ' + input.value);
    input.value = '';
  }));
  document.querySelectorAll('[data-toast]').forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault();
    toast(el.dataset.toast);
  }));
}

/* ---------- Admin: autentikasi ---------- */
function initAuth() {
  const login = document.querySelector('#form-login');
  if (login) login.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = login.email.value.trim();
    const err = document.querySelector('#email-error');
    const ok = email.toLowerCase() === OWNER_EMAIL.toLowerCase();
    err.textContent = ok ? 'Email tidak ditemukan. Periksa kembali alamat email Anda.' : 'Hanya akun pemilik Faisal yang dapat mengakses CMS.';
    err.classList.toggle('hidden', ok);
    if (!ok) return;
    if (!login.password.value.trim()) return toast('Kata sandi wajib diisi.');
    localStorage.setItem('faisal-account', email);
    location.href = 'login-2fa.html';
  });
  const otp = document.querySelector('#otp-row');
  if (otp) {
    const inputs = [...otp.querySelectorAll('input')];
    inputs.forEach((inp, i) => inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '').slice(0, 1);
      if (inp.value && i < inputs.length - 1) inputs[i + 1].focus();
    }));
    document.querySelector('#verifikasi')?.addEventListener('click', () => {
      if (inputs.some((i) => !i.value)) return toast('Lengkapi enam digit kode.');
      location.href = 'dasbor.html';
    });
    document.querySelector('#kirim-ulang')?.addEventListener('click', (e) => {
      e.preventDefault();
      toast('Kode baru telah dikirim.');
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

/* ---------- Langganan: pembayaran QRIS + konfirmasi pemilik ---------- */
const METODE_BAYAR = 'QRIS';
const OWNER_WHATSAPP = '081286484770';
const OWNER_WHATSAPP_API = '6281286484770';
const HARGA_PAKET = { 'Digital': 10000, 'Digital Plus': 15000, 'Koran + Digital': 10000 };
const rupiah = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);

function ambilPengajuan() {
  try { return JSON.parse(localStorage.getItem('faisal-subscriptions') || '[]'); }
  catch { return []; }
}
function simpanPengajuan(rec) {
  const semua = ambilPengajuan();
  semua.unshift(rec);
  try {
    localStorage.setItem('faisal-subscriptions', JSON.stringify(semua));
  } catch {
    semua[0] = { ...rec, bukti: '' };
    localStorage.setItem('faisal-subscriptions', JSON.stringify(semua));
    toast('Bukti terlalu besar untuk disimpan. Kirim bukti langsung ke pemilik.');
  }
  return semua;
}
/* Kode akses hanya diberikan pemilik setelah bukti dicek, jadi memasukkan
   kode yang benar menandai pengajuan pada perangkat ini sebagai terverifikasi. */
function tandaiTerverifikasiDenganKode() {
  const semua = ambilPengajuan();
  if (!semua.length) return 0;
  const waktu = new Date().toISOString();
  let berubah = 0;
  semua.forEach((r) => {
    if (r.status === 'Menunggu verifikasi' || r.status === 'Ditolak') {
      r.status = 'Terverifikasi';
      r.verifiedAt = waktu;
      berubah++;
    }
  });
  if (!berubah) return 0;
  try {
    localStorage.setItem('faisal-subscriptions', JSON.stringify(semua));
  } catch {
    return 0;
  }
  return berubah;
}
function labelStatus(r) {
  if (r.status !== 'Terverifikasi') return r.status;
  if (!r.verifiedAt) return 'Terverifikasi';
  const t = new Date(r.verifiedAt);
  return `Terverifikasi · ${formatTanggal(t)}, ${formatJam(t)} WIB`;
}
function kelasStatus(r) {
  return r.status === 'Terverifikasi' ? 'published' : 'review';
}
function kompresGambar(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('Bukti pembayaran wajib diunggah.'));
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error('Bukti harus berupa JPG, PNG, atau WebP.'));
    if (file.size > 10 * 1024 * 1024) return reject(new Error('Ukuran bukti maksimal 10 MB.'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Bukti tidak dapat dibaca.'));
    reader.onload = () => {
      const gambar = new Image();
      gambar.onerror = () => reject(new Error('File bukti bukan gambar yang valid.'));
      gambar.onload = () => {
        const skala = Math.min(1, 1200 / Math.max(gambar.width, gambar.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(gambar.width * skala);
        canvas.height = Math.round(gambar.height * skala);
        canvas.getContext('2d').drawImage(gambar, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      gambar.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function lihatBukti(dataUrl) {
  const dialog = document.querySelector('#dialog-bukti');
  if (!dialog || !dataUrl) return toast('Bukti tidak tersedia pada perangkat ini.');
  document.querySelector('#gambar-bukti').src = dataUrl;
  dialog.showModal();
}
function validasiLangganan(form) {
  const el = (nama) => form.elements.namedItem(nama);
  const nama = (el('nama')?.value || '').trim();
  const email = (el('email')?.value || '').trim();
  const wa = (el('wa')?.value || '').replace(/\D/g, '');
  const paket = el('paket')?.value || '';
  const setuju = form.querySelector('#setuju').checked;
  const fileBukti = el('bukti')?.files?.[0];
  const buktiValid = !!fileBukti && /^image\/(jpeg|png|webp)$/.test(fileBukti.type) && fileBukti.size <= 10 * 1024 * 1024;
  const cek = {
    nama: nama.length >= 2,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    wa: /^08\d{8,11}$/.test(wa),
    paket: Object.hasOwn(HARGA_PAKET, paket),
    bukti: buktiValid,
    setuju
  };
  form.querySelectorAll('[data-error]').forEach((el) => el.classList.toggle('hidden', cek[el.dataset.error]));
  const pertama = Object.keys(cek).find((k) => !cek[k]);
  if (pertama) {
    form.querySelector(pertama === 'setuju' ? '#setuju' : `[name="${pertama}"]`)?.focus();
    return null;
  }
  return {
    nama, email,
    wa: '0' + wa.slice(1),
    paket,
    jumlah: HARGA_PAKET[paket],
    catatan: (el('catatan')?.value || '').trim(),
    buktiFile: fileBukti,
    waktu: new Date().toISOString(),
    status: 'Menunggu verifikasi'
  };
}
function pesanLangganan(d) {
  return [
    'Konfirmasi langganan Faisal',
    `Nama: ${d.nama}`,
    `Email: ${d.email}`,
    `WhatsApp: ${d.wa}`,
    `Paket: ${d.paket}`,
    `Jumlah: ${rupiah(d.jumlah)}`,
    `Metode pembayaran: ${METODE_BAYAR}`,
    d.catatan ? `Catatan: ${d.catatan}` : null,
    'Bukti pembayaran: saya kirimkan foto bukti pada pesan ini.',
    '',
    'Saya sudah membayar via QRIS. Mohon verifikasi bukti dan aktifkan langganan saya.'
  ].filter((baris) => baris !== null).join('\n');
}
function tampilkanHasil(selector, d, tautan, kanal) {
  const box = document.querySelector(selector);
  if (!box) return;
  box.classList.remove('hidden');
  box.innerHTML = `<h3>Pengajuan tersimpan di perangkat ini</h3>
    <p><strong>${esc(d.nama)}</strong> · ${esc(d.paket)} · ${rupiah(d.jumlah)}</p>
    <p>Status: <span class="badge ${kelasStatus(d)}">${esc(labelStatus(d))}</span></p>
    <p>Pesan sudah disiapkan untuk ${esc(kanal)} ke ${esc(kanal === 'WhatsApp' ? OWNER_WHATSAPP : OWNER_EMAIL)}. Jika aplikasi tidak terbuka otomatis, gunakan tautan di bawah.</p>
    <p class="meta">${d.status === 'Terverifikasi'
      ? 'Kode akses sudah dimasukkan pada perangkat ini. Status terverifikasi berlaku untuk catatan di perangkat ini.'
      : 'Bukti pembayaran tersimpan di perangkat ini. Browser tidak bisa melampirkan file otomatis, jadi kirim foto bukti yang sama secara manual di ' + esc(kanal) + '. Setelah bukti dicek, pemilik akan mengirim kode akses untuk membuka artikel.'}</p>
    <div class="contact-row"><a class="btn btn-primary" href="${esc(tautan)}" ${kanal === 'WhatsApp' ? 'target="_blank" rel="noopener"' : ''}>Buka ${esc(kanal)}</a><button class="btn btn-outline" type="button" data-lihat-bukti>Lihat bukti</button></div>`;
  box.querySelector('[data-lihat-bukti]')?.addEventListener('click', () => lihatBukti(d.bukti));
}
function kirimPengajuan(d, kanal) {
  if (localStorage.getItem('faisal-akses')) {
    d.status = 'Terverifikasi';
    d.verifiedAt = new Date().toISOString();
  }
  simpanPengajuan(d);
  const pesan = pesanLangganan(d);
  let tautan;
  if (kanal === 'WhatsApp') {
    tautan = `https://wa.me/${OWNER_WHATSAPP_API}?text=${encodeURIComponent(pesan)}`;
    const direct = document.querySelector('#wa-direct');
    if (direct) direct.href = tautan;
    const a = document.createElement('a');
    a.href = tautan;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    tautan = `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent('Konfirmasi langganan Faisal — ' + d.nama)}&body=${encodeURIComponent(pesan)}`;
    const direct = document.querySelector('#email-direct');
    if (direct) direct.href = tautan;
    const a = document.createElement('a');
    a.href = tautan;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  tampilkanHasil('#hasil-pengajuan', d, tautan, kanal === 'WhatsApp' ? 'WhatsApp' : 'email');
  renderRiwayatPengajuan();
  toast('Pengajuan langganan tersimpan. Pesan dibuka untuk dikirim ke pemilik.');
}
function renderRiwayatPengajuan() {
  const host = document.querySelector('#daftar-pengajuan');
  if (!host) return;
  const semua = ambilPengajuan();
  if (!semua.length) {
    host.innerHTML = '<p class="meta">Belum ada pengajuan dari perangkat ini. Isi formulir di atas untuk memulai.</p>';
    return;
  }
  host.innerHTML = semua.map((r, i) => `<div class="history-item">
    <div><strong>${esc(r.nama)}</strong><span class="meta">${esc(r.email)} · ${esc(r.wa)} · ${esc(r.paket)} · ${rupiah(r.jumlah)}</span><span class="meta">Diajukan ${formatTanggal(new Date(r.waktu))}, ${formatJam(new Date(r.waktu))} WIB</span><span class="meta">Bukti: ${r.bukti ? 'sudah diunggah' : 'belum tersedia'}</span></div>
    <span class="badge ${kelasStatus(r)}">${esc(labelStatus(r))}</span>
    ${r.bukti ? `<button class="kicker" type="button" data-lihat-bukti-index="${i}">Lihat bukti</button>` : ''}
  </div>`).join('');
  host.querySelectorAll('[data-lihat-bukti-index]').forEach((b) => b.addEventListener('click', () => lihatBukti(semua[Number(b.dataset.lihatBuktiIndex)].bukti)));
}
function cekStatusLangganan() {
  const input = document.querySelector('#cek-email');
  const box = document.querySelector('#hasil-status');
  if (!input || !box) return;
  const email = input.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Masukkan alamat email yang valid.');
  const cocok = ambilPengajuan().find((r) => r.email.toLowerCase() === email.toLowerCase());
  box.classList.remove('hidden');
  if (!cocok) {
    box.innerHTML = '<h3>Tidak ada pengajuan</h3><p>Email ini belum terdaftar pada perangkat ini. Kirim konfirmasi melalui WhatsApp atau email pemilik.</p>';
    return;
  }
  box.innerHTML = `<h3>Status pengajuan</h3>
    <p><strong>${esc(cocok.nama)}</strong> · ${esc(cocok.paket)} · ${rupiah(cocok.jumlah)}</p>
    <p>Status: <span class="badge ${kelasStatus(cocok)}">${esc(labelStatus(cocok))}</span></p>
    <p class="meta">Diajukan ${formatTanggal(new Date(cocok.waktu))}, ${formatJam(new Date(cocok.waktu))} WIB. Konfirmasi akhir dikirim ke ${esc(cocok.email)} / WhatsApp ${esc(cocok.wa)}.</p>
    <p class="meta">Bukti pembayaran: ${cocok.bukti ? (cocok.status === 'Terverifikasi' ? 'sudah diunggah dan sudah cocok dengan kode akses yang dimasukkan' : 'sudah diunggah dan perlu dicek pemilik') : 'belum tersedia'}.</p>`;
}
function initLangganan() {
  const form = document.querySelector('#form-konfirmasi');
  if (!form) return;
  const select = document.querySelector('#paket-pilihan');
  const pilih = (paket) => {
    select.value = paket;
    document.querySelectorAll('.plan').forEach((p) => p.classList.toggle('selected', p.dataset.paket === paket));
    document.querySelectorAll('[data-pilih-paket]').forEach((b) => {
      const aktif = b.dataset.pilihPaket === paket;
      b.textContent = aktif ? 'Paket dipilih ✓' : 'Pilih paket';
      b.classList.toggle('btn-primary', aktif);
      b.classList.toggle('btn-outline', !aktif);
    });
  };
  document.querySelectorAll('[data-pilih-paket]').forEach((b) => b.addEventListener('click', () => {
    pilih(b.dataset.pilihPaket);
    document.querySelector('#form-konfirmasi').scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast(`Paket ${b.dataset.pilihPaket} dipilih. Lengkapi formulir konfirmasi.`);
  }));
  select.addEventListener('change', () => pilih(select.value));
  document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      toast('Tersalin ke papan klip.');
    } catch {
      toast(`Salin manual: ${b.dataset.copy}`);
    }
  }));
  const kirim = async (kanal) => {
    const d = validasiLangganan(form);
    if (!d) return;
    try {
      d.bukti = await kompresGambar(d.buktiFile);
      delete d.buktiFile;
      kirimPengajuan(d, kanal);
    } catch (err) {
      toast(err.message);
    }
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    kirim('WhatsApp');
  });
  document.querySelector('#kirim-email')?.addEventListener('click', () => kirim('email'));
  document.querySelector('#bukti')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.querySelector('#bukti-preview');
    if (!file) return preview.classList.add('hidden');
    document.querySelector('#bukti-preview-img').src = URL.createObjectURL(file);
    preview.classList.remove('hidden');
  });
  document.querySelector('#tutup-bukti')?.addEventListener('click', () => document.querySelector('#dialog-bukti').close());
  document.querySelector('#btn-cek')?.addEventListener('click', cekStatusLangganan);
  if (localStorage.getItem('faisal-akses')) tandaiTerverifikasiDenganKode();
  renderRiwayatPengajuan();
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
    <img src="../assets/img/pemilik-profil.jpg" alt="Foto profil pemilik Faisal" />
    <div><strong>Faisal Akbar</strong><span>Pemilik & Redaktur Utama</span><span>felixreuss29@gmail.com</span></div>`;
  sidebar.insertBefore(profil, sidebar.querySelector('nav'));
}

/* ---------- Pembatas akses CMS (bukan pengganti autentikasi server) ---------- */
function initAdminGuard() {
  if (document.body.dataset.admin !== '1') return;
  const halaman = location.pathname.split('/').pop();
  const publicAuth = ['login.html', 'lupa-password.html'].includes(halaman);
  const masuk = (localStorage.getItem('faisal-account') || '').toLowerCase() === OWNER_EMAIL.toLowerCase();
  if (!publicAuth && !masuk) {
    location.replace('login.html');
    return;
  }
  if (halaman === 'login-2fa.html' && !masuk) location.replace('login.html');
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

/* ---------- Inisialisasi ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initAdminGuard();
  initTheme();
  renderHeader(document.body.dataset.page || 'Beranda');
  renderFooter();
  renderHome();
  renderArticle();
  renderCategory();
  renderSearch();
  if (document.body.dataset.page) initOverlays();
  initForms();
  initAuth();
  initEditor();
  initLangganan();
  initAdminProfile();
  initAdminSidebar();
  initArticleFilters();
  if (document.body.dataset.admin !== '1') {
    muatBerita();
    muatPostingan();
    muatAkses();
  }
  startClock();
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', toggleTheme));
});
