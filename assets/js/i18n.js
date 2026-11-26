/* ============================================================
   Faisal — pilihan bahasa & terjemahan otomatis halaman
   ============================================================ */
(function () {
  'use strict';

  var BAHASA = [
    ['id', 'Indonesia'], ['en', 'English'], ['ar', 'العربية'], ['zh-CN', '中文 (简体)'],
    ['zh-TW', '中文 (繁體)'], ['ja', '日本語'], ['ko', '한국어'], ['fr', 'Français'],
    ['es', 'Español'], ['de', 'Deutsch'], ['pt', 'Português'], ['ru', 'Русский'],
    ['hi', 'हिन्दी'], ['tr', 'Türkçe'], ['it', 'Italiano'], ['vi', 'Tiếng Việt'],
    ['th', 'ไทย'], ['ms', 'Bahasa Melayu'], ['ur', 'اردو'], ['bn', 'বাংলা'],
    ['nl', 'Nederlands'], ['pl', 'Polski'], ['sv', 'Svenska'], ['fa', 'فارسی']
  ];
  // Dua alamat Google + satu penyedia cadangan. Dicoba berurutan agar
  // tetap berfungsi di browser yang memblokir salah satu penyedia.
  var API = 'https://translate.googleapis.com/translate_a/single';
  var API_T = 'https://translate.googleapis.com/translate_a/t';
  var CADANGAN = 'https://api.mymemory.translated.net/get';
  var KUNCI_BAHASA = 'faisal-bahasa';
  var KUNCI_CACHE = 'faisal-terjemahan';
  var ATRIBUT = ['placeholder', 'aria-label', 'alt', 'title'];
  var LEWATI = 'script,style,noscript,code,pre,kbd,textarea,' +
    '[data-no-translate],[data-clock],[data-relative],[aria-hidden="true"],.toast,.ticker-toggle';

  var asliTeks = new WeakMap();
  var asliAtr = new WeakMap();
  var riwayat = [];
  var antrean = [];
  var cache = {};
  var bahasa = 'id';
  var aktif = false;
  var sedang = false;
  var timer = null;
  var generasi = 0;
  var gagalSemua = false;
  var sebagian = false;

  try { cache = JSON.parse(localStorage.getItem(KUNCI_CACHE) || '{}') || {}; } catch (e) { cache = {}; }

  function simpanCache() {
    try { localStorage.setItem(KUNCI_CACHE, JSON.stringify(cache)); }
    catch (e) {
      var kunci = Object.keys(cache);
      kunci.slice(0, Math.ceil(kunci.length / 2)).forEach(function (k) { delete cache[k]; });
      try { localStorage.setItem(KUNCI_CACHE, JSON.stringify(cache)); } catch (e2) { /* penuh */ }
    }
  }
  function namaBahasa(kode) {
    var ditemukan = BAHASA.filter(function (b) { return b[0] === kode; })[0];
    return ditemukan ? ditemukan[1] : 'Indonesia';
  }
  function valid(kode) {
    return BAHASA.some(function (b) { return b[0] === kode; });
  }
  // Tidak memakai \p{L}/u atau optional chaining supaya tetap bisa dijalankan
  // oleh WebView lama (browser dalam aplikasi dan perangkat HP lama).
  function teksAman(s) {
    if (!s || typeof s !== 'string' || s.length > 1500) return false;
    var t = s.trim();
    if (!t || (!/[A-Za-z]/.test(t) && !/[^\x00-\x7F]/.test(t))) return false;
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
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var nilai = node.nodeValue ? node.nodeValue.trim() : '';
      if (!teksAman(nilai) || !boleh(node.parentElement) || asliTeks.has(node)) continue;
      antrean.push({ node: node, asli: nilai, atribut: null });
    }
    var elemen = root.querySelectorAll('[' + ATRIBUT.join('],[') + ']');
    Array.prototype.forEach.call(elemen, function (el) {
      if (!boleh(el)) return;
      ATRIBUT.forEach(function (a) {
        var nilai = el.getAttribute(a);
        var tersimpan = asliAtr.get(el);
        if (!nilai || !teksAman(nilai) || (tersimpan && tersimpan.has(a))) return;
        antrean.push({ node: el, asli: nilai.trim(), atribut: a });
      });
    });
  }

  function ambilJson(url) {
    return fetch(url, { credentials: 'omit' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }
  function pecahHasil(gabungan, jumlah) {
    var pecahan = String(gabungan || '').split('\n');
    var hasil = [];
    for (var i = 0; i < jumlah; i++) hasil.push(pecahan[i] || '');
    return hasil;
  }
  async function googleBatch(daftar, target) {
    var q = encodeURIComponent(daftar.join('\n'));
    var t = encodeURIComponent(target);
    try {
      var json = await ambilJson(API + '?client=gtx&sl=id&tl=' + t + '&dt=t&q=' + q);
      if (json && Array.isArray(json[0])) {
        var gabungan = json[0].map(function (s) { return (s && s[0]) || ''; }).join('');
        var hasil = pecahHasil(gabungan, daftar.length);
        if (hasil.some(Boolean)) return hasil;
      }
    } catch (e) { /* coba alamat kedua */ }
    try {
      var json2 = await ambilJson(API_T + '?client=gtx&sl=id&tl=' + t + '&dt=t&q=' + q);
      if (Array.isArray(json2)) {
        var gabungan2 = typeof json2[0] === 'string'
          ? json2[0]
          : json2.map(function (s) { return (s && s[0]) || ''; }).join('\n');
        var hasil2 = pecahHasil(gabungan2, daftar.length);
        if (hasil2.some(Boolean)) return hasil2;
      }
    } catch (e2) { /* pakai penyedia cadangan */ }
    return null;
  }
  var sisaCadangan = 80;
  async function terjemahCadanganBanyak(daftar, target) {
    var hasil = [];
    for (var i = 0; i < daftar.length; i += 5) {
      var bagian = daftar.slice(i, i + 5);
      var terjemahan = await Promise.all(bagian.map(function (teks) {
        return terjemahCadangan(teks, target).catch(function () { return ''; });
      }));
      hasil = hasil.concat(terjemahan);
    }
    return hasil;
  }
  async function terjemahCadangan(teks, target) {
    if (sisaCadangan <= 0) return '';
    sisaCadangan--;
    var url = CADANGAN + '?q=' + encodeURIComponent(teks) + '&langpair=id|' + encodeURIComponent(target);
    var json = await ambilJson(url);
    if (!json || json.responseStatus !== 200 || !json.responseData) return '';
    var hasil = json.responseData.translatedText || '';
    if (/^\[/.test(hasil)) return '';
    return hasil.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  }

  async function terjemahBanyak(daftar, target) {
    var i = 0;
    var berhasil = 0;
    while (i < daftar.length) {
      var bagian = [];
      var panjang = 0;
      while (i < daftar.length && bagian.length < 20 && panjang + daftar[i].length + 1 <= 2500) {
        bagian.push(daftar[i]);
        panjang += daftar[i].length + 1;
        i++;
      }
      if (!bagian.length) { bagian.push(daftar[i]); i++; }
      var belum = bagian.filter(function (t) { return !cache[target + '|' + t]; });
      if (belum.length) {
        var hasil = await googleBatch(belum, target);
        if (hasil) {
          belum.forEach(function (teks, idx) {
            if (hasil[idx] && hasil[idx] !== teks) {
              cache[target + '|' + teks] = hasil[idx];
              berhasil++;
            }
          });
        } else {
          var cadanganHasil = await terjemahCadanganBanyak(belum, target);
          belum.forEach(function (teks, idx) {
            var cadangan = cadanganHasil[idx];
            if (cadangan && cadangan !== teks) {
              cache[target + '|' + teks] = cadangan;
              berhasil++;
            }
          });
        }
      }
    }
    simpanCache();
    return berhasil;
  }

  async function prosesAntrean() {
    if (!aktif || sedang || bahasa === 'id' || !antrean.length) return;
    sedang = true;
    var gen = generasi;
    var daftar = antrean;
    antrean = [];
    var unik = [];
    daftar.forEach(function (d) {
      if (teksAman(d.asli) && unik.indexOf(d.asli) === -1) unik.push(d.asli);
    });
    var berhasil = await terjemahBanyak(unik, bahasa);
    if (gen !== generasi) {
      sedang = false;
      if (antrean.length) prosesAntrean();
      return;
    }
    var diterjemahkan = unik.filter(function (t) { return !!cache[bahasa + '|' + t]; }).length;
    var belum = unik.length - diterjemahkan;
    gagalSemua = unik.length > 0 && diterjemahkan === 0;
    sebagian = !gagalSemua && belum > 5;
    daftar.forEach(function (d) {
      var hasil = cache[bahasa + '|' + d.asli];
      if (!hasil || hasil === d.asli) return;
      if (d.atribut) {
        if (!d.node.isConnected) return;
        var tersimpan = asliAtr.get(d.node);
        if (tersimpan && tersimpan.has(d.atribut)) return;
        if (!tersimpan) { tersimpan = new Map(); asliAtr.set(d.node, tersimpan); }
        tersimpan.set(d.atribut, d.asli);
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
    if (gagalSemua || sebagian) tampilkanPeringatan();
  }

  function kembalikanAsli() {
    riwayat.forEach(function (d) {
      if (d.atribut) {
        if (d.node.isConnected) d.node.setAttribute(d.atribut, d.asli);
        var tersimpan = asliAtr.get(d.node);
        if (tersimpan) tersimpan.delete(d.atribut);
      } else {
        if (d.node.parentNode) d.node.nodeValue = d.asli;
        asliTeks.delete(d.node);
      }
    });
    riwayat = [];
    antrean = [];
    gagalSemua = false;
    sebagian = false;
    var notice = document.getElementById('faisal-terjemahan-peringatan');
    if (notice && notice.parentNode) notice.parentNode.removeChild(notice);
  }

  function tautanGoogle(target) {
    var t = valid(target) && target !== 'id' ? target : 'en';
    return 'https://translate.google.com/translate?sl=id&tl=' + encodeURIComponent(t) +
      '&u=' + encodeURIComponent(location.href);
  }
  function tampilkanPeringatan() {
    var el = document.getElementById('faisal-terjemahan-peringatan');
    if (!el) {
      el = document.createElement('div');
      el.id = 'faisal-terjemahan-peringatan';
      el.className = 'translation-notice';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.innerHTML = (gagalSemua
      ? 'Terjemahan otomatis tidak dapat diakses di browser ini.'
      : 'Sebagian teks belum sempat diterjemahkan di browser ini.') +
      ' <a href="' + tautanGoogle(bahasa) + '">Buka terjemahan lengkap →</a>';
  }

  function tungguSelesai() {
    return new Promise(function (resolve) {
      function cek() {
        if (!sedang) resolve();
        else setTimeout(cek, 100);
      }
      cek();
    });
  }

  async function gantiBahasa(kode) {
    if (!valid(kode)) kode = 'id';
    generasi++;
    kembalikanAsli();
    bahasa = kode;
    sisaCadangan = 80;
    try { localStorage.setItem(KUNCI_BAHASA, kode); } catch (e) { /* abai */ }
    document.documentElement.lang = kode;
    if (typeof window.toast === 'function') {
      window.toast(kode === 'id' ? 'Bahasa dikembalikan ke Indonesia.'
        : 'Menerjemahkan halaman ke ' + namaBahasa(kode) + '…');
    }
    if (kode !== 'id') {
      await tungguSelesai();
      kumpulkan(document.body);
      await prosesAntrean();
    }
    if (typeof window.toast === 'function') {
      if (kode === 'id') window.toast('Teks asli bahasa Indonesia dipulihkan.');
      else if (gagalSemua) window.toast('Terjemahan gagal di browser ini. Gunakan tautan Google di halaman.');
      else if (sebagian) window.toast('Terjemahan sebagian tersedia. Tautan Google disediakan untuk versi lengkap.');
      else window.toast('Halaman diterjemahkan ke ' + namaBahasa(kode) + '.');
    }
  }

  window.initBahasa = function () {
    if (document.body.dataset.admin === '1') {
      document.documentElement.lang = 'id';
      return;
    }
    var pilih = document.querySelector('[data-bahasa]');
    if (!pilih) return;
    pilih.innerHTML = BAHASA.map(function (b) {
      return '<option value="' + b[0] + '">' + b[1] + '</option>';
    }).join('') + '<option value="google">Bahasa lain (Google Translate)</option>';
    try { bahasa = localStorage.getItem(KUNCI_BAHASA) || 'id'; } catch (e) { bahasa = 'id'; }
    if (!valid(bahasa)) bahasa = 'id';
    pilih.value = bahasa;
    document.documentElement.lang = bahasa;
    aktif = true;

    pilih.addEventListener('change', function () {
      var nilai = pilih.value;
      if (nilai === 'google') {
        pilih.value = bahasa;
        // Navigasi di tab yang sama: jendela popup sering diblokir di browser dalam aplikasi.
        window.location.href = tautanGoogle(bahasa);
        return;
      }
      gantiBahasa(nilai);
    });

    kumpulkan(document.body);
    if (bahasa !== 'id') prosesAntrean();

    var pengamat = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        kumpulkan(document.body);
        prosesAntrean();
      }, 250);
    });
    pengamat.observe(document.body, { childList: true, subtree: true, characterData: true });
  };
})();
