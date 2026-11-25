/* Ambil berita terkini dari RSS ANTARA, simpan sebagai JSON + foto lokal.
   Dipakai oleh GitHub Actions (harian) dan bisa dijalankan manual:
   node scripts/update-news.mjs

   Memakai curl sebagai pengambil data karena lebih stabil di beberapa jaringan
   dibanding fetch Node; curl tersedia di Windows maupun GitHub Actions.        */

import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const CURL = process.platform === 'win32' ? 'curl.exe' : 'curl';
const RSS_URL = 'https://www.antaranews.com/rss/terkini.xml';
const ROOT = process.cwd();
const JSON_PATH = join(ROOT, 'assets', 'js', 'news.json');
const IMG_DIR = join(ROOT, 'assets', 'img', 'berita');
const BATAS = 12;

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

const rss = ambilTeks(RSS_URL);
const items = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m) => m[1]).slice(0, BATAS);
await mkdir(IMG_DIR, { recursive: true });

const articles = [];
for (const item of items) {
  const title = tag(item, 'title');
  const link = tag(item, 'link');
  if (!title || !link) continue;
  const id = 'berita-' + ((link.match(/\/(\d{6,})\//) || [])[1] || String(articles.length + 1));
  const urlGambar = atribut(item, 'media:content', 'url') || atribut(item, 'enclosure', 'url');
  const image = urlGambar ? unduhGambar(urlGambar, `${id}.jpg`) : null;
  const description = tag(item, 'description');
  const excerpt = ringkas(tag(item, 'content:encoded') || description);
  const publishedDate = tag(item, 'pubDate');
  const published = publishedDate && !Number.isNaN(Date.parse(publishedDate))
    ? new Date(publishedDate).toISOString()
    : new Date().toISOString();
  const kredit = ringkas(tag(item, 'media:description').split(/ ANTARA|\(ANTARA/)[0], 90);
  articles.push({
    id,
    title,
    link,
    category: kategori(title),
    excerpt: excerpt || 'Baca berita lengkapnya melalui tautan sumber.',
    published,
    image,
    kredit: kredit || 'ANTARA',
    sumber: 'ANTARA News'
  });
}

await writeFile(JSON_PATH, JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: RSS_URL,
  sourceName: 'ANTARA News',
  articles
}, null, 2));

console.log(`Update selesai: ${articles.length} artikel, ${articles.filter((a) => a.image).length} foto tersimpan.`);
