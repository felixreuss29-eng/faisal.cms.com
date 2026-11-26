/* Ambil berita dari beberapa RSS ANTARA, simpan sebagai JSON + foto lokal.
   Dipakai oleh GitHub Actions (harian) dan bisa dijalankan manual:
   node scripts/update-news.mjs

   Memakai curl sebagai pengambil data karena lebih stabil di beberapa jaringan
   dibanding fetch Node; curl tersedia di Windows maupun GitHub Actions.

   Sumber:
   - terkini.xml              -> diklasifikasikan ke delapan kategori
   - dunia-internasional.xml  -> default Internasional
   - humaniora.xml            -> hanya artikel bertema Pendidikan
                                 (ANTARA tidak menyediakan RSS khusus pendidikan) */

import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const CURL = process.platform === 'win32' ? 'curl.exe' : 'curl';
const ROOT = process.cwd();
const JSON_PATH = join(ROOT, 'assets', 'js', 'news.json');
const IMG_DIR = join(ROOT, 'assets', 'img', 'berita');

const SUMBER = [
  { url: 'https://www.antaranews.com/rss/terkini.xml', batas: 10 },
  { url: 'https://www.antaranews.com/rss/dunia-internasional.xml', batas: 8, utama: 'Internasional' },
  { url: 'https://www.antaranews.com/rss/humaniora.xml', batas: 20, hanyaJika: /pendidikan|sekolah|anak tk|taman kanak|program indonesia pintar|\bpip\b|siswa|pelajar|mahasiswa|guru|dosen|kampus|universitas/i }
];
const BATAS_TOTAL = 24;
/* Hak cipta foto ANTARA tetap pada ANTARA/fotografer. Secara default kode ini
   tidak mengunduh/menyimpan foto dan publik hanya menampilkan judul, ringkasan
   pendek, sumber, waktu terbit, serta tautan ke artikel asli. */
const SIMPAN_GAMBAR_FOTO_ANTARA = false;
// Berita yang tidak ingin ditampilkan. Filter ini berlaku setiap kali RSS diambil,
// jadi artikel yang diblokir tidak akan muncul lagi setelah pembaruan harian.
const DIBLOKIR = [
  /perampasan\s+aset/i,
  /uu\s+(no\s*)?perampasan/i
];
const PENDIDIKAN = /pendidikan|kependidikan|sekolah|\bsd\b|\bsmp\b|\bsma\b|\btk\b|anak tk|taman kanak|program indonesia pintar|\bpip\b|siswa|pelajar|mahasiswa|guru|dosen|kampus|universitas|akademi|kurikulum|beasiswa|belajar|pembelajaran|pddikti|kemdikbud|mendikbud|ristekdikti|paud|kuliah|wisuda|akreditasi|\butbk\b|\bsnbt\b|\bspmb\b|ujian|tenaga pendidik/i;
const INTERNASIONAL = /internasional|dunia|asing|mancanegara|luar negeri|global|amerika|eropa|asia|china|tiongkok|jepang|korea|india|russia|rusia|ukraina|israel|palestina|arab|saudi|uae|emirat|singapura|malaysia|vietnam|filipina|thailand|australia|inggris|britain|prancis|jerman|belanda|turki|iran|irak|suriah|yaman|houthi|pbb|perserikatan bangsa|vatican|paus|kyoto|shanghai|swiss|taipei|taiwan|mesir|pakistan|afghanistan|bangsa-bangsa|negara maju/i;

const ambilTeks = (url) => execFileSync(CURL, ['-fsSL', '--max-time', '30', url], {
  encoding: 'utf8', maxBuffer: 16 * 1024 * 1024
});
const unduhGambar = (url, nama) => {
  try {
    execFileSync(CURL, ['-fsSL', '--max-time', '30', '-o', join(IMG_DIR, nama), url], { stdio: 'ignore' });
    return `assets/img/berita/${nama}`;
  } catch {
    return null;
  }
};

const decode = (s = '') => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/\s+/g, ' ')
  .trim();

const tag = (xml, name) => decode((xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i')) || [])[1] || '');
const atribut = (xml, name, attr) => decode((xml.match(new RegExp(`<${name}\\b[^>]*\\b${attr}="([^"]+)"`, 'i')) || [])[1] || '');

function kategori(title) {
  const t = title.toLowerCase();
  if (PENDIDIKAN.test(t)) return 'Pendidikan';
  if (INTERNASIONAL.test(t)) return 'Internasional';
  if (/dpr|dprd|presiden|pemilu|pilkada|kpu|partai|wapres|cawapres|menteri|kabinet|parlemen|koalisi|mpr|mpk/.test(t)) return 'Politik';
  if (/rupiah|inflasi|pangan|ekspor|impor|harga|pasar|industri|otomotif|bank|ekonomi|belanja|transaksi|investasi|anggaran|ieu|oecd|bhumi/.test(t)) return 'Ekonomi';
  if (/timnas|pertandingan|pemain|juara|badminton|bulu tangkis|persib|liga|tinju|atlet|sepak bola|pon|syed modi|ganda/.test(t)) return 'Olahraga';
  if (/polisi|polda|polres|pengadilan|mahkamah|mk |kasus|narkoba|hukum|korupsi|kpk|bupati|sabu|tipikor/.test(t)) return 'Hukum';
  if (/teknologi|digital|internet|kecerdasan|data/.test(t)) return 'Teknologi';
  return 'Nasional';
}

function ringkas(teks, panjang = 190) {
  if (teks.length <= panjang) return teks;
  return teks.slice(0, panjang).replace(/\s+\S*$/, '') + '…';
}

const feed = SUMBER.map((s) => ({ ...s, xml: ambilTeks(s.url) }));
await mkdir(IMG_DIR, { recursive: true });

const articles = [];
const dilihat = new Set();
for (const sumber of feed) {
  const items = [...sumber.xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m) => m[1]).slice(0, sumber.batas);
  for (const item of items) {
    if (articles.length >= BATAS_TOTAL) break;
    const title = tag(item, 'title');
    const link = tag(item, 'link');
    if (!title || !link) continue;
    if (DIBLOKIR.some((re) => re.test(title))) continue;
    if (sumber.hanyaJika && !sumber.hanyaJika.test(title)) continue;
    const id = 'berita-' + ((link.match(/\/(\d{6,})\//) || [])[1] || String(dilihat.size + 1));
    if (dilihat.has(id)) continue;
    dilihat.add(id);
    const urlGambar = SIMPAN_GAMBAR_FOTO_ANTARA
      ? (atribut(item, 'media:content', 'url') || atribut(item, 'enclosure', 'url'))
      : null;
    const image = urlGambar ? unduhGambar(urlGambar, `${id}.jpg`) : null;
    const description = tag(item, 'description');
    // description adalah ringkasan singkat dari RSS; content:encoded tidak dipakai
    // agar isi artikel sumber tidak ikut tersalin ke repositori.
    const excerpt = ringkas(description);
    const publishedDate = tag(item, 'pubDate');
    const published = publishedDate && !Number.isNaN(Date.parse(publishedDate))
      ? new Date(publishedDate).toISOString()
      : new Date().toISOString();
    const kredit = ringkas(tag(item, 'media:description').split(/ ANTARA|\(ANTARA/)[0], 90);
    const terdeteksi = kategori(title);
    articles.push({
      id,
      title,
      link,
      category: terdeteksi === 'Nasional' && sumber.utama ? sumber.utama : terdeteksi,
      excerpt: excerpt || 'Baca berita lengkapnya melalui tautan sumber.',
      published,
      image,
      kredit: kredit || 'ANTARA',
      sumber: 'ANTARA News'
    });
  }
}

await writeFile(JSON_PATH, JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: SUMBER[0].url,
  sources: SUMBER.map((s) => s.url),
  sourceName: 'ANTARA News',
  articles
}, null, 2));

// Bersihkan foto lama hanya bila pengunduhan foto diaktifkan. Jika tidak,
// berkas lama sengaja dibiarkan agar tidak menghapus konten tanpa konfirmasi.
if (SIMPAN_GAMBAR_FOTO_ANTARA) {
  const dipakai = new Set(articles.map((a) => a.image).filter(Boolean).map((p) => p.split('/').pop()));
  for (const nama of await readdir(IMG_DIR)) {
    if (/^berita-\d+\.jpg$/.test(nama) && !dipakai.has(nama)) {
      await unlink(join(IMG_DIR, nama)).catch(() => {});
    }
  }
}

const ringkasan = Object.entries(articles.reduce((acc, a) => {
  acc[a.category] = (acc[a.category] || 0) + 1;
  return acc;
}, {})).map(([k, v]) => `${k}: ${v}`).join(', ');
console.log(`Update selesai: ${articles.length} artikel (${ringkasan}), ${articles.filter((a) => a.image).length} foto tersimpan. Tampilkan foto ANTARA: ${SIMPAN_GAMBAR_FOTO_ANTARA ? 'ya' : 'tidak'}.`);
