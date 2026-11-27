// Membuat halaman artikel statis untuk setiap postingan CMS.
// Tujuannya: judul, deskripsi, dan gambar sharing tetap benar saat dibuka
// oleh Google, WhatsApp, Facebook, dan Telegram (yang tidak menjalankan JS).
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ASAL = 'https://faisalnews.web.id';
const postsPath = path.join(ROOT, 'assets/js/posts.json');
const templatePath = path.join(ROOT, 'artikel.html');
const sitemapPath = path.join(ROOT, 'sitemap.xml');

const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8')).posts || [];
const template = fs.readFileSync(templatePath, 'utf8');

const esc = (nilai) => String(nilai == null ? '' : nilai)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const enc = (nilai) => encodeURIComponent(String(nilai));
const urlArtikel = (id) => `${ASAL}/artikel/${enc(id)}/`;

const gambarArtikel = (a) => {
  const nama = a.image || 'hero.jpg';
  return nama.startsWith('assets/') ? nama : `assets/img/${nama}`;
};
const kreditFoto = (a) => a.kreditFoto || 'Dokumentasi Faisal';
const namaPenulis = (a) => (a.author && a.author.name) || 'Faisal Akbar';
const peranPenulis = (a) => {
  const peran = (a.author && a.author.role) || 'Penulis Faisal';
  return /pemilik|pemimpin redaksi|redaktur utama/i.test(peran) ? 'Redaksi Faisal' : peran;
};
const jumlahKata = (body) => (body || []).map((b) => b.text || '').join(' ').trim().split(/\s+/).filter(Boolean).length;
const menitBaca = (body) => Math.max(1, Math.ceil(jumlahKata(body) / 200));
const waktuTerbit = (iso) => {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(new Date(iso)) + ' WIB';
  } catch (_) {
    return String(iso || '');
  }
};

function isiArtikel(a) {
  return (a.body || []).map((b) => {
    if (b.type === 'h2') return `<h2>${esc(b.text)}</h2>`;
    if (b.type === 'quote') return `<blockquote class="pull-quote"><p>“${esc(b.text)}”</p><cite>— ${esc(b.cite)}</cite></blockquote>`;
    return String(b.text || '').split(/\n+/).map((p) => `<p>${esc(p.trim())}</p>`).join('');
  }).join('');
}

function artikelStatik(a) {
  const gambar = gambarArtikel(a);
  const penulis = namaPenulis(a);
  const peran = peranPenulis(a);
  const terkait = posts.filter((x) => x.id !== a.id).slice(0, 4).map((x) => `
          <div class="sidebar-item"><a href="/artikel/${enc(x.id)}/"><img src="/${esc(gambarArtikel(x))}" alt="Thumbnail ${esc(x.title)}" loading="lazy" /></a><div><span class="kicker">${esc(x.category)}</span><h3><a href="/artikel/${enc(x.id)}/">${esc(x.title)}</a></h3></div></div>`).join('');
  return `<div class="breadcrumb"><a href="/">Beranda</a> › <a href="/kategori?k=${enc(a.category)}">${esc(a.category)}</a> › ${esc(a.title)}</div>
    <div class="article-layout">
      <div>
        <header class="article-head">
          <span class="kicker">${esc(a.category)}</span>
          <h1>${esc(a.title)}</h1>
          <p class="article-lead">${esc(a.excerpt)}</p>
          <div class="byline">
            <img src="/assets/img/${esc((a.author && a.author.photo) || 'pemilik-profil-rapi.jpg')}" alt="Foto ${esc(penulis)}" />
            <div class="byline-penulis"><strong>${esc(penulis)}</strong><span class="meta">${esc(peran)}</span></div>
            <div class="byline-waktu meta">${esc(waktuTerbit(a.published))} · ${menitBaca(a.body)} menit baca</div>
          </div>
          <div class="postingan-info">
            <span>Penulis: <strong>Redaksi faisal.cms.com</strong></span>
            <span>Dirangkum dari: <strong>${esc(a.sumberRujukan || 'Belum dicantumkan')}</strong></span>
            <span>Diterbitkan: ${esc(waktuTerbit(a.published))} · Diperbarui: ${esc(waktuTerbit(a.updated || a.published))}</span>
          </div>
        </header>
        <figure class="article-figure"><img src="/${esc(gambar)}" alt="${esc(a.alt || 'Ilustrasi: ' + a.title)}" /><figcaption>Foto: ${esc(kreditFoto(a))}.</figcaption></figure>
        <div class="article-body" style="margin-top:28px">${isiArtikel(a)}</div>
        <div class="tags"><span class="tag">#${esc(a.category)}</span><span class="tag">#Faisal</span></div>
        <div class="author-bio"><img src="/assets/img/${esc((a.author && a.author.photo) || 'pemilik-profil-rapi.jpg')}" alt="Foto ${esc(penulis)}" /><div><h3>${esc(penulis)}</h3><div class="meta">${esc(peran)}</div><p class="meta">Anggota redaksi Faisal yang menulis dan menyunting berita untuk portal ini.</p></div></div>
        <section class="comments"><h3 class="komentar-judul">Komentar</h3>
          <p class="meta">Komentar tampil untuk semua pembaca dan dapat dimoderasi redaksi.</p>
          <div class="comment-form">
            <label class="sr-only" for="nama-komentar">Nama</label>
            <input id="nama-komentar" type="text" placeholder="Nama Anda" maxlength="40" autocomplete="name" />
            <label class="sr-only" for="komentar">Komentar</label>
            <textarea id="komentar" placeholder="Bagikan pandangan Anda tentang artikel ini…" maxlength="1000"></textarea>
            <div class="row"><button class="btn btn-primary" type="button" data-kirim-komentar>Kirim komentar</button></div>
          </div>
          <div id="daftar-komentar"><div class="empty-state" id="komentar-kosong"><h4>Belum ada komentar</h4><p>Jadilah yang pertama berbagi pandangan di artikel ini.</p></div></div>
        </section>
      </div>
      <aside><div class="sidebar-section"><div class="section-head"><span class="section-mark"></span><h2 class="section-title" style="font-size:20px">Artikel Terkait</h2></div>${terkait}</div></aside>
    </div>`;
}

function halamanArtikel(a) {
  const alamat = urlArtikel(a.id);
  const judul = `${a.title} — Faisal`;
  const deskripsi = a.excerpt || 'Berita dari redaksi Faisal.';
  const gambar = `${ASAL}/${gambarArtikel(a)}`;
  const ld = JSON.stringify({
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
  });
  const meta = `<meta name="description" content="${esc(deskripsi)}" />
  <link rel="canonical" href="${esc(alamat)}" />
  <meta property="og:title" content="${esc(judul)}" />
  <meta property="og:description" content="${esc(deskripsi)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${esc(alamat)}" />
  <meta property="og:image" content="${esc(gambar)}" />
  <meta property="og:site_name" content="Faisal" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(judul)}" />
  <meta name="twitter:description" content="${esc(deskripsi)}" />
  <meta name="twitter:image" content="${esc(gambar)}" />
  <script type="application/ld+json">${ld}</script>`;

  return template
    .replace('<meta charset="utf-8" />', '<meta charset="utf-8" />\n  <base href="/" />')
    .replace('<title>Artikel — Faisal</title>', `<title>${esc(judul)}</title>`)
    .replace('<meta name="description" content="Baca artikel pilihan redaksi Faisal." />', meta)
    .replace('<div id="article-root"></div>', `<div id="article-root">${artikelStatik(a)}</div>`);
}

function perbaruiSitemap() {
  const barisLama = fs.readFileSync(sitemapPath, 'utf8').split(/\r?\n/)
    .filter((baris) => baris.trim() && !baris.trim().startsWith('<?xml') && !baris.includes('<urlset') && !baris.includes('</urlset>') && !baris.includes('/artikel?id='));
  const barisArtikel = posts.map((a) => `  <url><loc>${urlArtikel(a.id)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
  fs.writeFileSync(sitemapPath, [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...barisLama,
    ...barisArtikel,
    '</urlset>',
    ''
  ].join('\n'));
}

for (const a of posts) {
  const folder = path.join(ROOT, 'artikel', String(a.id));
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'index.html'), halamanArtikel(a));
}
perbaruiSitemap();
console.log(`${posts.length} halaman artikel statis dibuat.`);
