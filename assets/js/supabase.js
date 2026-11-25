/* ============================================================
   Faisal — komentar bersama & statistik kunjungan (Supabase REST)
   Implementasi memakai fetch langsung, tanpa build step.
   ============================================================ */
(function () {
  'use strict';

  const KUNCI_PENGUNJUNG = 'faisal-pengunjung';
  const KUNCI_TOKEN = 'faisal-supabase-token';
  const KUNCI_SESI = 'faisal-sesi-pemilik';
  const KUNCI_KOMENTAR = 'faisal-komentar-';
  const KUNCI_STATISTIK = 'faisal-statistik-lokal';
  const KUNCI_STATISTIK_TERKIRIM = 'faisal-statistik-terkirim';
  const KUNCI_NAMA = 'faisal-nama-komentar';
  const PEMILIK = 'felixreuss29@gmail.com';

  function konfigurasi() {
    const c = window.FAISAL_SUPABASE || {};
    return { url: String(c.url || '').replace(/\/+$/, ''), key: String(c.anonKey || '').trim() };
  }
  function siap() {
    const c = konfigurasi();
    const aman = /^https:\/\//.test(c.url) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(c.url);
    return aman && c.key.length > 20;
  }
  function header(token) {
    const c = konfigurasi();
    // Kunci publishable/anon memang bukan JWT, jadi hanya dikirim lewat apikey.
    // Authorization: Bearer dipakai khusus untuk token sesi pengguna pemilik.
    const kepala = { apikey: c.key, 'Content-Type': 'application/json' };
    if (token) kepala.Authorization = 'Bearer ' + token;
    return kepala;
  }
  function sinyal() {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      return AbortSignal.timeout(9000);
    }
    const pengendali = new AbortController();
    setTimeout(() => pengendali.abort(), 9000);
    return pengendali.signal;
  }
  async function minta(jalur, opsi = {}) {
    const c = konfigurasi();
    if (!siap()) throw new Error('Supabase belum terhubung');
    const { method = 'GET', body = null, token = null, prefer = '' } = opsi;
    const kepala = header(token);
    if (prefer) kepala.Prefer = prefer;
    let respons;
    try {
      respons = await fetch(c.url + jalur, {
        method,
        headers: kepala,
        body: body === null ? undefined : JSON.stringify(body),
        signal: sinyal()
      });
    } catch (e) {
      throw new Error('Tidak dapat menghubungi Supabase: ' + e.message);
    }
    const teks = await respons.text();
    if (!respons.ok) {
      let pesan = teks.slice(0, 180);
      try {
        const j = JSON.parse(teks);
        pesan = j.message || j.msg || j.error_description || pesan;
      } catch { /* teks biasa */ }
      throw new Error(pesan || ('HTTP ' + respons.status));
    }
    if (!teks) return null;
    try { return JSON.parse(teks); } catch { return teks; }
  }

  function bacaLokal(kunci, kosong) {
    try { return JSON.parse(localStorage.getItem(kunci) || JSON.stringify(kosong)); }
    catch { return kosong; }
  }
  function tulisLokal(kunci, nilai) {
    try { localStorage.setItem(kunci, JSON.stringify(nilai)); }
    catch { /* penyimpanan penuh */ }
  }
  function hariWIB(tgl = new Date()) {
    const bagian = new Intl.DateTimeFormat('en-ID', {
      timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(tgl);
    const ambil = (t) => (bagian.find((x) => x.type === t) || {}).value || '';
    return `${ambil('year')}-${ambil('month')}-${ambil('day')}`;
  }
  function idPengunjung() {
    let id = '';
    try { id = localStorage.getItem(KUNCI_PENGUNJUNG) || ''; } catch { /* abai */ }
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2);
      try { localStorage.setItem(KUNCI_PENGUNJUNG, id); } catch { /* abai */ }
    }
    return id;
  }
  function dariBaris(k) {
    return {
      id: k.id,
      artikel_id: k.artikel_id,
      nama: k.nama || 'Pembaca',
      teks: k.teks,
      waktu: k.created_at || k.waktu,
      lokal: Boolean(k.lokal)
    };
  }
  function validKomentar(nama, teks) {
    const n = String(nama || '').trim();
    const t = String(teks || '').trim();
    if (!t) throw new Error('Komentar tidak boleh kosong.');
    if (t.length > 1000) throw new Error('Komentar maksimal 1000 karakter.');
    if (n.length > 40) throw new Error('Nama maksimal 40 karakter.');
    return { nama: n.slice(0, 40) || 'Pembaca', teks: t };
  }

  async function catatKunjungan(halaman, jenis) {
    const namaHalaman = String(halaman || 'situs').slice(0, 120);
    const tipe = jenis === 'artikel' ? 'artikel' : 'situs';
    if (!siap()) {
      const daftar = bacaLokal(KUNCI_STATISTIK, []);
      const kunci = [idPengunjung(), hariWIB(), tipe, namaHalaman].join('|');
      if (daftar.some((x) => x.kunci === kunci)) return;
      daftar.push({ kunci, hari: hariWIB(), jenis: tipe, halaman: namaHalaman, waktu: new Date().toISOString() });
      tulisLokal(KUNCI_STATISTIK, daftar.slice(-500));
      return;
    }
    // Catatan: `resolution=ignore-duplicates` butuh hak SELECT untuk
    // memeriksa baris lama, sedangkan anon sengaja tidak punya hak itu.
    // Jadi duplikat dicegah lokal, lalu kode 409 tetap ditelan bila terjadi.
    const kunci = [idPengunjung(), hariWIB(), tipe, namaHalaman].join('|');
    const terkirim = bacaLokal(KUNCI_STATISTIK_TERKIRIM, []);
    if (terkirim.includes(kunci)) return;
    try {
      await minta('/rest/v1/faisal_statistik', {
        method: 'POST',
        prefer: 'return=minimal',
        body: { pengunjung: idPengunjung(), hari: hariWIB(), halaman: namaHalaman, jenis: tipe }
      });
    } catch (e) {
      if (!/duplicate key|23505|unique constraint/i.test(e.message)) throw e;
    }
    if (!terkirim.includes(kunci)) {
      terkirim.push(kunci);
      tulisLokal(KUNCI_STATISTIK_TERKIRIM, terkirim.slice(-200));
    }
  }

  function ringkasanLokal() {
    const daftar = bacaLokal(KUNCI_STATISTIK, []);
    const hari = hariWIB();
    const artikel = {};
    daftar.filter((x) => x.jenis === 'artikel').forEach((x) => {
      artikel[x.halaman] = (artikel[x.halaman] || 0) + 1;
    });
    return {
      pengunjungHariIni: daftar.filter((x) => x.hari === hari && x.jenis === 'situs').length,
      pengunjungTotal: new Set(daftar.map((x) => String(x.kunci).split('|')[0])).size,
      tampilanArtikel: artikel,
      tampilanArtikelTotal: Object.values(artikel).reduce((a, b) => a + b, 0),
      terbaru: daftar.slice(-6).reverse().map((x) => ({ halaman: x.halaman, jenis: x.jenis, waktu: x.waktu })),
      lokal: true
    };
  }
  async function ringkasan() {
    if (!siap()) return ringkasanLokal();
    const hasil = await minta('/rest/v1/rpc/faisal_ringkasan_statistik', {
      method: 'POST',
      body: { hari_param: hariWIB() }
    });
    return {
      pengunjungHariIni: Number(hasil && hasil.pengunjungHariIni) || 0,
      pengunjungTotal: Number(hasil && hasil.pengunjungTotal) || 0,
      tampilanArtikel: (hasil && hasil.tampilanArtikel) || {},
      tampilanArtikelTotal: Number(hasil && hasil.tampilanArtikelTotal) || 0,
      terbaru: Array.isArray(hasil && hasil.terbaru) ? hasil.terbaru : [],
      lokal: false
    };
  }

  async function komentar(artikelId) {
    const id = String(artikelId || 'default');
    if (!siap()) return bacaLokal(KUNCI_KOMENTAR + id, []).map(dariBaris);
    const baris = await minta('/rest/v1/faisal_komentar?artikel_id=eq.' + encodeURIComponent(id) +
      '&select=id,artikel_id,nama,teks,created_at&order=created_at.desc&limit=100');
    return (Array.isArray(baris) ? baris : []).map(dariBaris);
  }
  async function kirimKomentar(artikelId, nama, teks) {
    const id = String(artikelId || 'default');
    const data = validKomentar(nama, teks);
    try { localStorage.setItem(KUNCI_NAMA, data.nama); } catch { /* abai */ }
    if (!siap()) {
      const daftar = bacaLokal(KUNCI_KOMENTAR + id, []);
      const baris = {
        id: 'lokal-' + Date.now().toString(36),
        artikel_id: id,
        nama: data.nama,
        teks: data.teks,
        waktu: new Date().toISOString(),
        lokal: true
      };
      daftar.push(baris);
      tulisLokal(KUNCI_KOMENTAR + id, daftar.slice(-100));
      return dariBaris(baris);
    }
    const baris = await minta('/rest/v1/faisal_komentar', {
      method: 'POST',
      prefer: 'return=representation',
      body: { artikel_id: id, nama: data.nama, teks: data.teks }
    });
    return dariBaris(Array.isArray(baris) ? baris[0] : baris);
  }
  async function daftarKomentar() {
    if (!siap()) {
      const semua = [];
      for (let i = 0; i < localStorage.length; i++) {
        const kunci = localStorage.key(i);
        if (!kunci || !kunci.startsWith(KUNCI_KOMENTAR)) continue;
        bacaLokal(kunci, []).forEach((k) => semua.push(dariBaris({ ...k, artikel_id: k.artikel_id || kunci.slice(KUNCI_KOMENTAR.length) })));
      }
      return semua.sort((a, b) => String(b.waktu).localeCompare(String(a.waktu))).slice(0, 100);
    }
    const baris = await minta('/rest/v1/faisal_komentar?select=id,artikel_id,nama,teks,created_at&order=created_at.desc&limit=100');
    return (Array.isArray(baris) ? baris : []).map(dariBaris);
  }
  async function hapusKomentar(id) {
    const kunci = String(id || '');
    if (!kunci) throw new Error('Komentar tidak ditemukan.');
    if (!siap()) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(KUNCI_KOMENTAR)) continue;
        const sisa = bacaLokal(k, []).filter((x) => x.id !== kunci);
        if (sisa.length) tulisLokal(k, sisa); else localStorage.removeItem(k);
      }
      return;
    }
    await minta('/rest/v1/faisal_komentar?id=eq.' + encodeURIComponent(kunci), {
      method: 'DELETE',
      token: tokenPemilik()
    });
  }

  function bacaSesi() {
    let teks = '';
    try { teks = localStorage.getItem(KUNCI_SESI) || sessionStorage.getItem(KUNCI_SESI) || ''; }
    catch { return null; }
    if (!teks) return null;
    try { return JSON.parse(teks); } catch { return null; }
  }
  function simpanSesi(sesi, ingat) {
    try {
      localStorage.removeItem(KUNCI_SESI);
      sessionStorage.removeItem(KUNCI_SESI);
      localStorage.removeItem(KUNCI_TOKEN);
      sessionStorage.removeItem(KUNCI_TOKEN);
    } catch { /* abai */ }
    try { (ingat ? localStorage : sessionStorage).setItem(KUNCI_SESI, JSON.stringify(sesi)); }
    catch { /* abai */ }
  }
  function tokenPemilik() {
    const sesi = bacaSesi();
    return (sesi && sesi.access_token) || '';
  }
  function statusPemilik() { return Boolean(tokenPemilik()); }

  async function masukPemilik(email, password, ingat = false) {
    const c = konfigurasi();
    if (!siap()) throw new Error('Supabase belum terhubung');
    const alamat = String(email || '').trim();
    if (alamat.toLowerCase() !== PEMILIK) throw new Error('Hanya akun pemilik yang boleh masuk.');
    if (!password) throw new Error('Kata sandi wajib diisi.');
    let respons;
    try {
      respons = await fetch(c.url + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: header(),
        body: JSON.stringify({ email: alamat, password: String(password) }),
        signal: sinyal()
      });
    } catch (e) {
      throw new Error('Tidak dapat menghubungi Supabase: ' + e.message);
    }
    const teks = await respons.text();
    let hasil = {};
    try { hasil = JSON.parse(teks); } catch { /* abai */ }
    if (!respons.ok) {
      throw new Error(hasil.msg || hasil.message || hasil.error_description || 'Kata sandi salah atau akun belum dikonfirmasi.');
    }
    if (!hasil.access_token) throw new Error('Supabase tidak mengembalikan sesi masuk.');
    const emailSesi = String((hasil.user && hasil.user.email) || alamat).toLowerCase();
    if (emailSesi !== PEMILIK) throw new Error('Akun ini bukan pemilik Faisal.');
    simpanSesi({
      access_token: hasil.access_token,
      refresh_token: hasil.refresh_token || '',
      expires_at: Date.now() + (Number(hasil.expires_in) || 3600) * 1000,
      email: emailSesi
    }, Boolean(ingat));
    return true;
  }

  async function perbaruiSesi() {
    const sesi = bacaSesi();
    if (!sesi || !sesi.refresh_token) return false;
    const ingat = Boolean(localStorage.getItem(KUNCI_SESI));
    let respons;
    try {
      respons = await fetch(konfigurasi().url + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: header(),
        body: JSON.stringify({ refresh_token: sesi.refresh_token }),
        signal: sinyal()
      });
    } catch { return false; }
    if (!respons.ok) return false;
    let hasil = {};
    try { hasil = await respons.json(); } catch { return false; }
    if (!hasil.access_token) return false;
    simpanSesi({
      access_token: hasil.access_token,
      refresh_token: hasil.refresh_token || sesi.refresh_token,
      expires_at: Date.now() + (Number(hasil.expires_in) || 3600) * 1000,
      email: sesi.email || PEMILIK
    }, ingat);
    return true;
  }

  // Memeriksa sesi ke server Supabase, bukan hanya membaca penanda di browser.
  async function sesiPemilik() {
    if (!siap()) return null;
    const sesi = bacaSesi();
    if (!sesi || !sesi.access_token) return null;
    try {
      const user = await minta('/auth/v1/user', { token: sesi.access_token });
      const email = String((user && user.email) || '').toLowerCase();
      if (email === PEMILIK) return email;
    } catch { /* coba perbarui sesi */ }
    if (await perbaruiSesi()) {
      try {
        const user = await minta('/auth/v1/user', { token: tokenPemilik() });
        const email = String((user && user.email) || '').toLowerCase();
        if (email === PEMILIK) return email;
      } catch { /* gagal juga */ }
    }
    keluarPemilik();
    return null;
  }

  function keluarPemilik() {
    try {
      localStorage.removeItem(KUNCI_SESI);
      sessionStorage.removeItem(KUNCI_SESI);
      localStorage.removeItem(KUNCI_TOKEN);
      sessionStorage.removeItem(KUNCI_TOKEN);
      localStorage.removeItem('faisal-account');
    } catch { /* abai */ }
  }

  window.FaisalData = {
    siap,
    siapDipakai: siap,
    hariWIB,
    catatKunjungan,
    ringkasan,
    komentar,
    kirimKomentar,
    daftarKomentar,
    hapusKomentar,
    masukPemilik,
    keluarPemilik,
    statusPemilik,
    sesiPemilik,
    namaTersimpan: () => { try { return localStorage.getItem(KUNCI_NAMA) || ''; } catch { return ''; } }
  };
})();
