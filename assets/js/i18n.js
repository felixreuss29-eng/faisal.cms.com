/* ============================================================
   Faisal — pilihan bahasa & terjemahan otomatis halaman
   ============================================================ */
(function () {
  'use strict';

  const BAHASA = [
    ['id', 'Indonesia'], ['en', 'English'], ['ar', 'العربية'], ['zh-CN', '中文 (简体)'],
    ['zh-TW', '中文 (繁體)'], ['ja', '日本語'], ['ko', '한국어'], ['fr', 'Français'],
    ['es', 'Español'], ['de', 'Deutsch'], ['pt', 'Português'], ['ru', 'Русский'],
    ['hi', 'हिन्दी'], ['tr', 'Türkçe'], ['it', 'Italiano'], ['vi', 'Tiếng Việt'],
    ['th', 'ไทย'], ['ms', 'Bahasa Melayu'], ['ur', 'اردو'], ['bn', 'বাংলা'],
    ['nl', 'Nederlands'], ['pl', 'Polski'], ['sv', 'Svenska'], ['fa', 'فارسی']
  ];
  const API = 'https://translate.googleapis.com/translate_a/single';
  const KUNCI_BAHASA = 'faisal-bahasa';
  const KUNCI_CACHE = 'faisal-terjemahan';
  const ATRIBUT = ['placeholder', 'aria-label', 'alt', 'title'];
  const LEWATI = 'script,style,noscript,code,pre,kbd,textarea,' +
    '[data-no-translate],[data-clock],[data-relative],[aria-hidden="true"],.toast,.ticker-toggle';

  const asliTeks = new WeakMap();
  const asliAtr = new WeakMap();
  let riwayat = [];
  let antrean = [];
  let cache = {};
  let bahasa = 'id';
  let aktif = false;
  let sedang = false;
  let timer = null;

  try { cache = JSON.parse(localStorage.getItem(KUNCI_CACHE) || '{}') || {}; } catch { cache = {}; }

  function simpanCache() {
    try { localStorage.setItem(KUNCI_CACHE, JSON.stringify(cache)); }
    catch {
      const kunci = Object.keys(cache);
      kunci.slice(0, Math.ceil(kunci.length / 2)).forEach((k) => delete cache[k]);
      try { localStorage.setItem(KUNCI_CACHE, JSON.stringify(cache)); } catch { /* penuh */ }
    }
  }
  function namaBahasa(kode) {
    return (BAHASA.find((b) => b[0] === kode) || ['id', 'Indonesia'])[1];
  }
  function valid(kode) { return BAHASA.some((b) => b[0] === kode); }
  function teksAman(s) {
    if (!s || !/\p{L}/u.test(s) || s.includes('\n') || s.length > 1500) return false;
    const t = s.trim();
    if (/^[\w.+-]+@[\w.-]+\.\w+$/.test(t)) return false;
    if (/^\s*(https?:\/\/|www\.)/i.test(t)) return false;
    if (/^\s*FAISAL-/i.test(t)) return false;
    if (/^\+?\d[\d\s.-]*$/.test(t)) return false;
    return true;
  }
  function boleh(el) {
    return !!el && !el.closest(LEWATI);
  }

  function kumpulkan(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      const nilai = node.nodeValue ? node.nodeValue.trim() : '';
      if (!teksAman(nilai) || !boleh(node.parentElement) || asliTeks.has(node)) continue;
      antrean.push({ node, asli: nilai, atribut: null });
    }
    root.querySelectorAll('[' + ATRIBUT.join('],[') + ']').forEach((el) => {
      if (!boleh(el)) return;
      ATRIBUT.forEach((a) => {
        const nilai = el.getAttribute(a);
        if (!nilai || !teksAman(nilai) || asliAtr.get(el)?.has(a)) return;
        antrean.push({ node: el, asli: nilai.trim(), atribut: a });
      });
    });
  }

  async function terjemahBanyak(daftar, target) {
    let i = 0;
    while (i < daftar.length) {
      const bagian = [];
      let panjang = 0;
      while (i < daftar.length && bagian.length < 20 && panjang + daftar[i].length + 1 <= 2500) {
        bagian.push(daftar[i]);
        panjang += daftar[i].length + 1;
        i++;
      }
      if (!bagian.length) { bagian.push(daftar[i]); i++; }
      if (!bagian.some((t) => !cache[target + '|' + t])) continue;
      const url = API + '?client=gtx&sl=id&tl=' + encodeURIComponent(target) +
        '&dt=t&q=' + encodeURIComponent(bagian.join('\n'));
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        const gabungan = Array.isArray(json && json[0])
          ? json[0].map((s) => (s && s[0]) || '').join('') : '';
        const pecahan = gabungan.split('\n');
        bagian.forEach((teks, idx) => {
          const hasil = pecahan[idx];
          if (hasil) cache[target + '|' + teks] = hasil;
        });
      } catch {
        for (const teks of bagian) {
          if (cache[target + '|' + teks]) continue;
          try {
            const res = await fetch(API + '?client=gtx&sl=id&tl=' + encodeURIComponent(target) +
              '&dt=t&q=' + encodeURIComponent(teks));
            const hasil = (await res.json())?.[0]?.[0]?.[0];
            if (hasil) cache[target + '|' + teks] = hasil;
          } catch { /* biarkan teks asli */ }
        }
      }
    }
    simpanCache();
  }

  async function prosesAntrean() {
    if (!aktif || sedang || bahasa === 'id' || !antrean.length) return;
    sedang = true;
    const daftar = antrean;
    antrean = [];
    const unik = [...new Set(daftar.map((d) => d.asli).filter(teksAman))];
    await terjemahBanyak(unik, bahasa);
    daftar.forEach((d) => {
      const hasil = cache[bahasa + '|' + d.asli];
      if (!hasil || hasil === d.asli) return;
      if (d.atribut) {
        if (!d.node.isConnected || asliAtr.get(d.node)?.has(d.atribut)) return;
        if (!asliAtr.has(d.node)) asliAtr.set(d.node, new Map());
        asliAtr.get(d.node).set(d.atribut, d.asli);
        d.node.setAttribute(d.atribut, hasil);
      } else {
        if (!d.node.parentNode || asliTeks.has(d.node)) return;
        asliTeks.set(d.node, d.asli);
        d.node.nodeValue = hasil;
      }
      riwayat.push(d);
    });
    sedang = false;
    if (antrean.length) prosesAntrean();
  }

  function kembalikanAsli() {
    riwayat.forEach((d) => {
      if (d.atribut) {
        if (d.node.isConnected) d.node.setAttribute(d.atribut, d.asli);
        asliAtr.get(d.node)?.delete(d.atribut);
      } else {
        if (d.node.parentNode) d.node.nodeValue = d.asli;
        asliTeks.delete(d.node);
      }
    });
    riwayat = [];
    antrean = [];
  }

  async function gantiBahasa(kode) {
    if (!valid(kode)) kode = 'id';
    kembalikanAsli();
    bahasa = kode;
    try { localStorage.setItem(KUNCI_BAHASA, kode); } catch { /* abai */ }
    document.documentElement.lang = kode;
    if (typeof window.toast === 'function') {
      window.toast(kode === 'id' ? 'Bahasa dikembalikan ke Indonesia.'
        : 'Menerjemahkan halaman ke ' + namaBahasa(kode) + '…');
    }
    if (kode !== 'id') {
      kumpulkan(document.body);
      await prosesAntrean();
    }
    if (typeof window.toast === 'function') {
      window.toast(kode === 'id' ? 'Teks asli bahasa Indonesia dipulihkan.'
        : 'Halaman diterjemahkan ke ' + namaBahasa(kode) + '.');
    }
  }

  window.initBahasa = function () {
    if (document.body.dataset.admin === '1') {
      document.documentElement.lang = 'id';
      return;
    }
    const pilih = document.querySelector('[data-bahasa]');
    if (!pilih) return;
    pilih.innerHTML = BAHASA.map(([kode, nama]) =>
      '<option value="' + kode + '">' + nama + '</option>').join('') +
      '<option value="google">Bahasa lain (Google Translate)</option>';
    try { bahasa = localStorage.getItem(KUNCI_BAHASA) || 'id'; } catch { bahasa = 'id'; }
    if (!valid(bahasa)) bahasa = 'id';
    pilih.value = bahasa;
    document.documentElement.lang = bahasa;
    aktif = true;

    pilih.addEventListener('change', () => {
      const nilai = pilih.value;
      if (nilai === 'google') {
        pilih.value = bahasa;
        window.open('https://translate.google.com/translate?sl=auto&tl=en&u=' +
          encodeURIComponent(location.href), '_blank', 'noopener');
        if (typeof window.toast === 'function') {
          window.toast('Pilih bahasa apa pun di halaman Google Translate.');
        }
        return;
      }
      gantiBahasa(nilai);
    });

    kumpulkan(document.body);
    if (bahasa !== 'id') prosesAntrean();

    const pengamat = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        kumpulkan(document.body);
        prosesAntrean();
      }, 250);
    });
    pengamat.observe(document.body, { childList: true, subtree: true, characterData: true });
  };
})();
