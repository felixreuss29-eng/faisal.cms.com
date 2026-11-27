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
  const KUNCI_IKUTI = 'faisal-ikuti-';
  const KUNCI_PUSH = 'faisal-push';
  const KUNCI_PEMBACA = 'faisal-pembaca-sesi';
  const KUNCI_2FA = 'faisal-2fa-sementara';
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

  /* ---------- Pengikut penulis ---------- */
  function validPenulis(nama) {
    const penulis = String(nama || '').trim().slice(0, 80);
    if (!penulis) throw new Error('Nama penulis tidak valid.');
    return penulis;
  }
  function statusIkuti(nama) {
    const penulis = validPenulis(nama);
    if (!siap()) return Promise.resolve(Boolean(bacaLokal(KUNCI_IKUTI, {})[penulis]));
    return minta('/rest/v1/rpc/faisal_status_ikuti', {
      method: 'POST',
      body: { p_pengunjung: idPengunjung(), p_penulis: penulis }
    }).then((hasil) => hasil === true);
  }
  function jumlahPengikut(nama) {
    const penulis = validPenulis(nama);
    if (!siap()) return Promise.resolve(Number(Boolean(bacaLokal(KUNCI_IKUTI, {})[penulis])));
    return minta('/rest/v1/rpc/faisal_jumlah_pengikut', {
      method: 'POST',
      body: { p_penulis: penulis }
    }).then((hasil) => Number(hasil) || 0);
  }
  async function simpanIkuti(nama, aktif) {
    const penulis = validPenulis(nama);
    const daftar = bacaLokal(KUNCI_IKUTI, {});
    if (aktif) daftar[penulis] = 1; else delete daftar[penulis];
    tulisLokal(KUNCI_IKUTI, daftar);
    if (!siap()) return Number(Boolean(daftar[penulis]));
    const hasil = await minta('/rest/v1/rpc/faisal_simpan_ikuti', {
      method: 'POST',
      body: { p_pengunjung: idPengunjung(), p_penulis: penulis, p_aktif: Boolean(aktif) }
    });
    return Number(hasil) || 0;
  }

  /* ---------- Notifikasi berita (Web Push) ---------- */
  function base64UrlKeArray(b64) {
    const teks = String(b64 || '').replace(/-/g, '+').replace(/_/g, '/');
    const isi = atob(teks + '='.repeat((4 - teks.length % 4) % 4));
    return Uint8Array.from(isi, (c) => c.charCodeAt(0));
  }
  function alamatSW() {
    const skrip = [...document.scripts].find((s) => /app\.js/.test(s.src || ''));
    return skrip ? new URL('../../sw.js?v=37', skrip.src).href : new URL('sw.js?v=37', document.baseURI).href;
  }
  async function statusNotifikasi() {
    if (!('Notification' in window)) return 'tidak-didukung';
    if (Notification.permission === 'denied') return 'ditolak';
    if (Notification.permission !== 'granted') return 'belum';
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'tidak-didukung';
    try {
      const reg = await navigator.serviceWorker.getRegistration(alamatSW());
      const langganan = reg && await reg.pushManager.getSubscription();
      return langganan ? 'aktif' : 'belum';
    } catch { return 'belum'; }
  }
  async function simpanLangganan(langganan) {
    const data = { pengunjung: idPengunjung(), langganan: langganan.toJSON() };
    try {
      await minta('/rest/v1/faisal_push_langganan', {
        method: 'POST',
        prefer: 'return=minimal',
        body: data
      });
    } catch (e) {
      if (!/duplicate key|23505|unique constraint/i.test(e.message)) throw e;
      // Baris sudah ada. Upsert (on_conflict) tidak dipakai karena anon sengaja
      // tidak punya hak SELECT; RLS menolaknya. PATCH memakai policy UPDATE.
      await minta('/rest/v1/faisal_push_langganan?pengunjung=eq.' + encodeURIComponent(data.pengunjung), {
        method: 'PATCH',
        prefer: 'return=minimal',
        body: { langganan: data.langganan }
      });
    }
  }
  async function aktifkanNotifikasi() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      throw new Error('Browser ini belum mendukung notifikasi.');
    }
    const kunci = window.FAISAL_PUSH && window.FAISAL_PUSH.vapidPublicKey;
    if (!kunci) throw new Error('Kunci notifikasi belum tersedia.');
    const izin = await Notification.requestPermission();
    if (izin !== 'granted') throw new Error('Izin notifikasi tidak diberikan.');
    const reg = await navigator.serviceWorker.register(alamatSW());
    await navigator.serviceWorker.ready;
    let langganan = await reg.pushManager.getSubscription();
    if (!langganan) {
      langganan = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlKeArray(kunci)
      });
    }
    if (siap()) await simpanLangganan(langganan);
    try { localStorage.setItem(KUNCI_PUSH, 'aktif'); } catch { /* abai */ }
    return true;
  }
  async function matikanNotifikasi() {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration(alamatSW());
        const langganan = reg && await reg.pushManager.getSubscription();
        if (langganan) await langganan.unsubscribe();
      }
      if (siap()) {
        await minta('/rest/v1/rpc/faisal_hapus_langganan', {
          method: 'POST',
          body: { p_pengunjung: idPengunjung() }
        });
      }
    } finally {
      try { localStorage.setItem(KUNCI_PUSH, 'mati'); } catch { /* abai */ }
    }
    return true;
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

  /* ---------- 2FA (TOTP) -------------------------------------------------
     Kata sandi hanya menghasilkan sesi AAL1. Sesi itu ditaruh di
     sessionStorage sebagai "sedang menunggu 2FA" dan BELUM bisa dipakai
     untuk membuka CMS. Akses penuh baru diberikan setelah kode 6 digit
     dari aplikasi autentikator terverifikasi (AAL2). */

  function dataSesi(hasil, email) {
    return {
      access_token: hasil.access_token,
      refresh_token: hasil.refresh_token || '',
      expires_at: Date.now() + (Number(hasil.expires_in) || 3600) * 1000,
      email: email
    };
  }
  function simpan2FA(sesi, ingat) {
    try {
      sessionStorage.setItem(KUNCI_2FA, JSON.stringify(Object.assign({}, sesi, { ingat: Boolean(ingat) })));
    } catch { /* abai */ }
  }
  function baca2FA() {
    try {
      const s = JSON.parse(sessionStorage.getItem(KUNCI_2FA) || 'null');
      return s && s.access_token ? s : null;
    } catch { return null; }
  }
  function hapus2FA() {
    try { sessionStorage.removeItem(KUNCI_2FA); } catch { /* abai */ }
  }
  function faktorTOTP(user) {
    const daftar = (user && Array.isArray(user.factors)) ? user.factors : [];
    return daftar.filter((f) => f && f.factor_type === 'totp' && f.status === 'verified');
  }
  // AAL bukan field user: Supabase menyimpannya sebagai klaim "aal" di JWT.
  function aalDariToken(token) {
    try {
      const bagian = String(token || '').split('.');
      if (bagian.length < 2 || typeof atob !== 'function') return '';
      const isi = atob(bagian[1].replace(/-/g, '+').replace(/_/g, '/'));
      return String((JSON.parse(isi) || {}).aal || '');
    } catch { return ''; }
  }
  function butuh2FA(user, token) {
    return faktorTOTP(user).length > 0 && aalDariToken(token) !== 'aal2';
  }
  function token2FA() {
    const s = baca2FA();
    if (!s) throw new Error('Sesi masuk habis. Masuk lagi dengan kata sandi.');
    return s.access_token;
  }

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
    const user = hasil.user || {};
    const emailSesi = String(user.email || alamat).toLowerCase();
    if (emailSesi !== PEMILIK) throw new Error('Akun ini bukan pemilik Faisal.');
    const sesi = dataSesi(hasil, emailSesi);
    hapus2FA();
    if (aalDariToken(hasil.access_token) === 'aal2') {
      simpanSesi(sesi, Boolean(ingat));
      return { status: 'lengkap' };
    }
    simpan2FA(sesi, ingat);
    return { status: faktorTOTP(user).length ? 'tantang' : 'daftar' };
  }

  async function daftarFaktor2FA() {
    const user = await minta('/auth/v1/user', { token: token2FA() });
    return (user && Array.isArray(user.factors)) ? user.factors : [];
  }

  async function mulaiDaftar2FA() {
    return minta('/auth/v1/factors', {
      method: 'POST',
      token: token2FA(),
      body: { friendly_name: 'Autentikator Faisal', factor_type: 'totp', issuer: 'Faisal CMS' }
    });
  }

  async function hapusFaktor2FA(id) {
    if (!id) return false;
    await minta('/auth/v1/factors/' + encodeURIComponent(id), { method: 'DELETE', token: token2FA() });
    return true;
  }

  // Membuat tantangan baru lalu memverifikasi kode 6 digit.
  // Dipakai baik untuk pendaftaran pertama maupun setiap kali masuk.
  async function selesaikan2FA(factorId, kode) {
    if (!factorId) throw new Error('Faktor autentikator belum dipilih.');
    const kodeBersih = String(kode || '').replace(/\D/g, '');
    if (kodeBersih.length !== 6) throw new Error('Kode harus terdiri dari 6 angka.');
    const token = token2FA();
    const tantangan = await minta('/auth/v1/factors/' + encodeURIComponent(factorId) + '/challenge', {
      method: 'POST', token: token, body: {}
    });
    if (!tantangan || !tantangan.id) throw new Error('Supabase tidak mengembalikan tantangan. Coba lagi.');
    const hasil = await minta('/auth/v1/factors/' + encodeURIComponent(factorId) + '/verify', {
      method: 'POST',
      token: token,
      body: { challenge_id: tantangan.id, code: kodeBersih }
    });
    if (!hasil || !hasil.access_token) throw new Error('Verifikasi gagal. Periksa kode dan coba lagi.');
    const email = String(((hasil.user || {}).email) || PEMILIK).toLowerCase();
    if (email !== PEMILIK) throw new Error('Akun ini bukan pemilik Faisal.');
    const pending = baca2FA();
    simpanSesi(dataSesi(hasil, email), Boolean(pending && pending.ingat));
    hapus2FA();
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
      if (email === PEMILIK && !butuh2FA(user, sesi.access_token)) return email;
    } catch { /* coba perbarui sesi */ }
    if (await perbaruiSesi()) {
      try {
        const user = await minta('/auth/v1/user', { token: tokenPemilik() });
        const email = String((user && user.email) || '').toLowerCase();
        if (email === PEMILIK && !butuh2FA(user, tokenPemilik())) return email;
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
      hapus2FA();
    } catch { /* abai */ }
  }

  /* ---------- AKUN PEMBACA (terpisah dari akun pemilik/CMS) ----------
     Email dan kata sandi hanya diverifikasi Supabase Auth. Browser
     menyimpan token sesi, bukan kata sandi. */

  function bacaSesiPembaca() {
    let teks = '';
    try { teks = localStorage.getItem(KUNCI_PEMBACA) || sessionStorage.getItem(KUNCI_PEMBACA) || ''; }
    catch { return null; }
    if (!teks) return null;
    try { return JSON.parse(teks); } catch { return null; }
  }
  function simpanSesiPembaca(sesi, ingat) {
    try {
      localStorage.removeItem(KUNCI_PEMBACA);
      sessionStorage.removeItem(KUNCI_PEMBACA);
      (ingat ? localStorage : sessionStorage).setItem(KUNCI_PEMBACA, JSON.stringify(sesi));
    } catch { /* abai */ }
  }
  function tokenPembaca() {
    const sesi = bacaSesiPembaca();
    return (sesi && sesi.access_token) || '';
  }
  function emailPembaca() {
    const sesi = bacaSesiPembaca();
    return (sesi && sesi.email) || '';
  }
  function statusPembaca() { return Boolean(tokenPembaca()); }
  function keluarPembaca() {
    try {
      localStorage.removeItem(KUNCI_PEMBACA);
      sessionStorage.removeItem(KUNCI_PEMBACA);
    } catch { /* abai */ }
  }
  function validPembaca(email, password) {
    const alamat = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alamat)) throw new Error('Alamat email tidak valid.');
    if (alamat === PEMILIK) throw new Error('Akun pemilik memakai halaman CMS: /admin/login.html');
    const sandi = String(password || '');
    if (sandi.length < 8) throw new Error('Kata sandi minimal 8 karakter.');
    return { email: alamat, password: sandi };
  }
  function simpanHasilPembaca(hasil, ingat) {
    const token = hasil && hasil.access_token;
    if (!token) return false;
    simpanSesiPembaca({
      access_token: token,
      refresh_token: hasil.refresh_token || '',
      expires_at: Date.now() + (Number(hasil.expires_in) || 3600) * 1000,
      email: String((hasil.user && hasil.user.email) || '').toLowerCase()
    }, Boolean(ingat));
    return true;
  }
  async function daftarPembaca(email, password, ingat = true) {
    if (!siap()) throw new Error('Supabase belum terhubung');
    const v = validPembaca(email, password);
    let respons;
    try {
      respons = await fetch(konfigurasi().url + '/auth/v1/signup', {
        method: 'POST',
        headers: header(),
        body: JSON.stringify(v),
        signal: sinyal()
      });
    } catch (e) {
      throw new Error('Tidak dapat menghubungi Supabase: ' + e.message);
    }
    const teks = await respons.text();
    let hasil = {};
    try { hasil = JSON.parse(teks); } catch { /* abai */ }
    if (!respons.ok) {
      const m = hasil.msg || hasil.message || hasil.error_description || '';
      throw new Error(/already registered|user already/i.test(m)
        ? 'Email ini sudah terdaftar. Silakan masuk.'
        : (m || 'Pendaftaran gagal. Coba lagi.'));
    }
    if (!simpanHasilPembaca(hasil, ingat)) return 'konfirmasi';
    return 'aktif';
  }
  async function masukPembaca(email, password, ingat = true) {
    if (!siap()) throw new Error('Supabase belum terhubung');
    const v = validPembaca(email, password);
    let respons;
    try {
      respons = await fetch(konfigurasi().url + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: header(),
        body: JSON.stringify(v),
        signal: sinyal()
      });
    } catch (e) {
      throw new Error('Tidak dapat menghubungi Supabase: ' + e.message);
    }
    const teks = await respons.text();
    let hasil = {};
    try { hasil = JSON.parse(teks); } catch { /* abai */ }
    if (!respons.ok) {
      throw new Error(hasil.msg || hasil.message || hasil.error_description || 'Email atau kata sandi salah.');
    }
    if (!simpanHasilPembaca(hasil, ingat)) throw new Error('Supabase tidak mengembalikan sesi masuk.');
    return true;
  }
  async function perbaruiSesiPembaca() {
    const sesi = bacaSesiPembaca();
    if (!sesi || !sesi.refresh_token) return false;
    const ingat = Boolean(localStorage.getItem(KUNCI_PEMBACA));
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
    simpanSesiPembaca({
      access_token: hasil.access_token,
      refresh_token: hasil.refresh_token || sesi.refresh_token,
      expires_at: Date.now() + (Number(hasil.expires_in) || 3600) * 1000,
      email: sesi.email || ''
    }, ingat);
    return true;
  }
  async function sesiPembaca() {
    if (!siap()) return null;
    const sesi = bacaSesiPembaca();
    if (!sesi || !sesi.access_token) return null;
    try {
      const user = await minta('/auth/v1/user', { token: sesi.access_token });
      const email = String((user && user.email) || '').toLowerCase();
      if (email) return email;
    } catch { /* coba perbarui */ }
    if (await perbaruiSesiPembaca()) {
      try {
        const user = await minta('/auth/v1/user', { token: tokenPembaca() });
        const email = String((user && user.email) || '').toLowerCase();
        if (email) return email;
      } catch { /* gagal juga */ }
    }
    keluarPembaca();
    return null;
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
    statusIkuti,
    jumlahPengikut,
    simpanIkuti,
    statusNotifikasi,
    aktifkanNotifikasi,
    matikanNotifikasi,
    masukPemilik,
    keluarPemilik,
    statusPemilik,
    tokenPemilik,
    sesiPemilik,
    daftarFaktor2FA,
    mulaiDaftar2FA,
    hapusFaktor2FA,
    selesaikan2FA,
    daftarPembaca,
    masukPembaca,
    keluarPembaca,
    statusPembaca,
    sesiPembaca,
    emailPembaca,
    namaTersimpan: () => { try { return localStorage.getItem(KUNCI_NAMA) || ''; } catch { return ''; } }
  };
})();
