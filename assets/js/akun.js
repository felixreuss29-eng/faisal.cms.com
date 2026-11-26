/* ============================================================
   Faisal — halaman akun pembaca.
   Daftar/masuk lewat Supabase Auth, lalu menampilkan berita
   terbaru dan status notifikasi. Kata sandi tidak pernah
   disimpan di repositori website.
   ============================================================ */
(function () {
  'use strict';

  const FD = window.FaisalData;
  const host = document.querySelector('#akun-panel');
  if (!host || !FD) return;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const pesan = (m) => { if (typeof window.toast === 'function') window.toast(m); };
  const sinkronHeader = () => {
    if (typeof window.perbaruiTampilanAkun === 'function') window.perbaruiTampilanAkun();
  };
  const sinkronLonCeng = () => {
    if (typeof window.terapkanStatusNotifikasi === 'function' && typeof FD.statusNotifikasi === 'function') {
      FD.statusNotifikasi().then((s) => window.terapkanStatusNotifikasi(s === 'aktif'));
    }
  };
  let modus = 'masuk';

  function tampilAuth(info) {
    const daftar = modus === 'daftar';
    host.innerHTML = `
      <section class="panel akun-card">
        <div class="akun-tabs" role="tablist" aria-label="Akun pembaca">
          <button type="button" class="akun-tab${daftar ? '' : ' on'}" data-akun-modus="masuk" role="tab" aria-selected="${!daftar}">Masuk</button>
          <button type="button" class="akun-tab${daftar ? ' on' : ''}" data-akun-modus="daftar" role="tab" aria-selected="${daftar}">Daftar akun</button>
        </div>
        <h2 class="panel-title">${daftar ? 'Buat akun pembaca' : 'Selamat datang kembali'}</h2>
        <p class="meta">${daftar
          ? 'Gratis. Setelah daftar, Anda melihat berita terbaru dan dapat mengaktifkan notifikasi.'
          : 'Masuk untuk melihat berita terbaru dan mengatur notifikasi Anda.'}</p>
        <div id="akun-info" class="alert ${info && info.error ? 'error' : 'success'} ${info ? '' : 'hidden'}" role="status">${info ? esc(info.teks) : ''}</div>
        <form id="form-akun" novalidate>
          <div class="form-field"><label for="akun-email">Alamat email</label><input id="akun-email" name="email" type="email" placeholder="nama@email.com" autocomplete="email" required /></div>
          <div class="form-field"><label for="akun-password">Kata sandi</label><input id="akun-password" name="password" type="password" placeholder="Minimal 8 karakter" autocomplete="${daftar ? 'new-password' : 'current-password'}" required /></div>
          <label class="akun-ingat"><input type="checkbox" name="ingat" checked /> Ingat sesi di perangkat ini</label>
          <button class="btn btn-primary btn-block" type="submit" id="akun-submit">${daftar ? 'Daftar & lihat berita →' : 'Masuk →'}</button>
        </form>
        <p class="secure-note" style="margin-top:16px">Kata sandi diverifikasi langsung oleh Supabase Auth dan tidak disimpan di website ini. Email hanya dipakai untuk akun Anda. Baca <a href="kebijakan-privasi">Kebijakan Privasi</a>.</p>
      </section>`;

    host.querySelectorAll('[data-akun-modus]').forEach((b) => b.addEventListener('click', () => {
      modus = b.dataset.akunModus;
      tampilAuth();
    }));

    const form = host.querySelector('#form-akun');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const tombol = host.querySelector('#akun-submit');
      const infoEl = host.querySelector('#akun-info');
      const email = form.elements.email.value;
      const password = form.elements.password.value;
      const ingat = form.elements.ingat.checked;
      tombol.disabled = true;
      tombol.textContent = 'Memproses…';
      infoEl.classList.add('hidden');
      try {
        if (daftar) {
          const hasil = await FD.daftarPembaca(email, password, ingat);
          if (hasil === 'konfirmasi') {
            infoEl.className = 'alert success';
            infoEl.textContent = 'Akun berhasil dibuat. Buka email Anda untuk mengonfirmasi alamat, lalu pilih tab Masuk.';
            infoEl.classList.remove('hidden');
            return;
          }
        } else {
          await FD.masukPembaca(email, password, ingat);
        }
        // Diminta langsung dari klik tombol agar izin browser tetap muncul.
        try { await FD.aktifkanNotifikasi(); } catch { /* izin bisa diberikan nanti */ }
        await tampilDashboard();
        sinkronHeader();
        sinkronLonCeng();
      } catch (err) {
        infoEl.className = 'alert error';
        infoEl.textContent = err.message || 'Proses gagal. Coba lagi.';
        infoEl.classList.remove('hidden');
      } finally {
        const t = host.querySelector('#akun-submit');
        if (t) {
          t.disabled = false;
          t.textContent = modus === 'daftar' ? 'Daftar & lihat berita →' : 'Masuk →';
        }
      }
    });
  }

  async function tampilDashboard() {
    const email = FD.emailPembaca() || 'Pembaca';
    host.innerHTML = `
      <section class="panel akun-card">
        <span class="badge published">Akun aktif</span>
        <h2 class="panel-title">Berita untuk Anda</h2>
        <p class="meta">Masuk sebagai <strong>${esc(email)}</strong>. Berita terbaru dari redaksi Faisal ada di bawah.</p>
        <div class="akun-notif">
          <div><strong>Notifikasi berita</strong><p class="meta" id="akun-notif-status">Memeriksa status…</p></div>
          <button class="btn btn-outline" type="button" id="akun-notif-btn">Aktifkan</button>
        </div>
        <h3 class="akun-subjudul">Berita terbaru</h3>
        <div id="akun-berita" class="akun-berita"><p class="meta">Memuat berita…</p></div>
        <button class="btn btn-outline" type="button" id="akun-keluar" style="margin-top:20px">Keluar dari akun</button>
      </section>`;

    host.querySelector('#akun-keluar').addEventListener('click', () => {
      FD.keluarPembaca();
      sinkronHeader();
      tampilAuth({ teks: 'Anda sudah keluar dari akun.' });
      pesan('Anda sudah keluar dari akun.');
    });

    const tombol = host.querySelector('#akun-notif-btn');
    const statusTeks = host.querySelector('#akun-notif-status');
    let status = 'belum';
    try { status = await FD.statusNotifikasi(); } catch { /* abai */ }
    const aktif = status === 'aktif';
    statusTeks.textContent = aktif
      ? 'Aktif. Anda akan menerima berita baru pada perangkat ini.'
      : status === 'ditolak'
        ? 'Izin diblokir browser. Aktifkan lewat pengaturan situs.'
        : 'Belum aktif. Aktifkan agar berita baru langsung muncul di perangkat Anda.';
    tombol.textContent = aktif ? 'Sudah aktif' : 'Aktifkan notifikasi';
    tombol.disabled = aktif;
    tombol.addEventListener('click', async () => {
      tombol.disabled = true;
      tombol.textContent = 'Mengaktifkan…';
      try {
        await FD.aktifkanNotifikasi();
        sinkronLonCeng();
        statusTeks.textContent = 'Aktif. Anda akan menerima berita baru pada perangkat ini.';
        tombol.textContent = 'Sudah aktif';
        pesan('Notifikasi berita aktif.');
      } catch (err) {
        statusTeks.textContent = err.message || 'Notifikasi gagal diaktifkan.';
        tombol.disabled = false;
        tombol.textContent = 'Coba lagi';
      }
    });

    muatBerita();
  }

  async function muatBerita() {
    const wadah = host.querySelector('#akun-berita');
    if (!wadah) return;
    try {
      const data = await fetch('assets/js/posts.json', { cache: 'no-store' }).then((r) => r.json());
      const daftar = (data.posts || [])
        .slice()
        .sort((a, b) => new Date(b.updated || b.published || 0) - new Date(a.updated || a.published || 0))
        .slice(0, 5);
      wadah.innerHTML = daftar.length
        ? `<ul class="akun-berita-list">${daftar.map((p) => `
            <li><a href="artikel?id=${encodeURIComponent(p.id)}">
              <span class="kicker">${esc(p.category || 'Berita')}</span>
              <strong>${esc(p.title)}</strong>
              <span class="meta">${esc(waktu(p.published))}</span>
            </a></li>`).join('')}</ul>`
        : '<p class="meta">Belum ada berita yang diterbitkan.</p>';
    } catch {
      wadah.innerHTML = '<p class="meta">Berita belum dapat dimuat. Coba muat ulang halaman.</p>';
    }
  }

  function waktu(iso) {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(new Date(iso));
    } catch { return ''; }
  }

  async function mulai() {
    if (typeof FD.siap !== 'function' || !FD.siap()) {
      tampilAuth({ error: true, teks: 'Layanan akun belum tersedia. Coba lagi nanti.' });
      return;
    }
    try {
      const sesi = await FD.sesiPembaca();
      if (sesi) await tampilDashboard();
      else tampilAuth();
    } catch {
      tampilAuth();
    }
  }

  mulai();
})();
