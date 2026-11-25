/* Konten contoh. Di situs nyata, ini diganti oleh API/CMS. */
const AUTHORS = {
  andi: { name: 'Andi Wijaya', role: 'Redaktur Politik', photo: 'author1.jpg', email: 'andi@faisal.id' },
  siti: { name: 'Siti Rahma', role: 'Kolumnis', photo: 'author1.jpg' },
  budi: { name: 'Budi Santoso', role: 'Analis Politik', photo: 'author2.jpg' },
  rina: { name: 'Rina Puspita', role: 'Redaksi Cek Fakta', photo: 'author3.jpg' }
};

const ARTICLES = [
  {
    id: 'ruu-pemilu',
    category: 'Politik',
    title: 'DPR Sahkan RUU Pemilu, Ini Enam Poin Perubahan yang Disepakati',
    excerpt: 'Persetujuan rapat paripurna menutup pembahasan enam bulan dan mengubah sejumlah ketentuan teknis penyelenggaraan pemilu.',
    image: 'hero.jpg',
    author: AUTHORS.andi,
    published: '2026-11-25T09:12:00+07:00',
    updated: '2026-11-25T10:15:00+07:00',
    featured: true,
    body: [
      { type: 'p', text: 'Dewan Perwakilan Rakyat mengesahkan Rancangan Undang-Undang Pemilu dalam rapat paripurna yang berlangsung hingga malam hari. Persetujuan ini menutup pembahasan yang berjalan selama enam bulan sejak draf pertama diperkenalkan kepada publik. Pimpinan rapat menyatakan keputusan diambil secara musyawarah setelah seluruh fraksi menyampaikan pendiriannya.' },
      { type: 'p', text: 'Keputusan tersebut diambil setelah fraksi-fraksi mencapai kesepakatan atas sejumlah pasal yang sempat menjadi perdebatan, terutama yang berkaitan dengan ambang batas pencalonan, mekanisme seleksi internal partai, dan batas waktu penyelesaian sengketa hasil. Paket perubahan ini kemudian dibawa ke tahap pengesahan bersama antara DPR dan pemerintah.' },
      { type: 'h2', text: '1. Ambang batas pencalonan' },
      { type: 'p', text: 'Aturan baru menetapkan ambang batas pencalonan presiden sebesar 20 persen kursi DPR atau 25 persen suara sah nasional. Ketentuan ini menggantikan formulasi sebelumnya yang dianggap memberi ruang terlalu sempit bagi partai menengah. Fraksi kecil semula meminta penyesuaian bertahap dengan masa transisi dua siklus pemilu, namun mayoritas fraksi sepakat angka tersebut cukup untuk menjaga stabilitas sistem kepartaian tanpa mengunci persaingan politik.' },
      { type: 'p', text: 'Penetapan angka ini juga disertai kewajiban partai untuk menunjukkan dukungan yang tersebar di sejumlah provinsi. KPU akan memverifikasi data dukungan tersebut sebelum menetapkan daftar calon tetap. Verifikasi dilakukan dengan sistem informasi pencalonan yang terhubung secara langsung dengan data hasil pemilu sebelumnya, sehingga mengurangi kemungkinan duplikasi dukungan.' },
      { type: 'h2', text: '2. Mekanisme nominasi' },
      { type: 'p', text: 'Partai politik kini diwajibkan mengajukan calon melalui mekanisme seleksi internal yang terdokumentasi. Setiap tahapan seleksi harus dicatat, mulai dari pendaftaran calon, penyaringan, hingga penetapan nama oleh badan pengurus. KPU akan memverifikasi kelengkapan administrasi sebelum menetapkan daftar calon tetap. Dokumentasi internal menjadi syarat tambahan yang tidak boleh diabaikan.' },
      { type: 'p', text: 'Aturan ini dimaksudkan untuk meningkatkan akuntabilitas proses pencalonan sekaligus memberi kepastian bagi kader partai yang mengikuti seleksi. Beberapa partai menyambut ketentuan ini karena dianggap dapat mengurangi praktik penunjukan calon tanpa proses yang jelas. Namun, partai lain meminta pedoman teknis yang lebih rinci agar tidak menimbulkan perbedaan interpretasi di daerah.' },
      { type: 'quote', text: 'Kami ingin aturan yang stabil, tidak berubah setiap siklus pemilu. Kepastian hukum adalah kunci kepercayaan publik.', cite: 'Ketua Komisi II DPR' },
      { type: 'h2', text: '3. Sengketa hasil pemilu' },
      { type: 'p', text: 'Mahkamah Konstitusi tetap menjadi lembaga pertama yang memeriksa sengketa hasil, dengan batas waktu penyelesaian yang diperketat menjadi 14 hari kerja sejak permohonan didaftarkan. Perubahan ini menjadi perhatian khusus karena sengketa hasil kerap menjadi titik ketegangan setelah pemungutan suara. Pemerintah dan DPR sepakat bahwa percepatan penanganan perlu diimbangi dengan jaminan akses bagi pemohon untuk mengajukan bukti.' },
      { type: 'p', text: 'Untuk mendukung percepatan tersebut, MK akan menambah jumlah hakim dan staf pendukung pada masa sengketa. Sistem pendaftaran perkara juga akan diperbarui agar pemohon dapat memantau perkembangan berkas secara daring. Pembaruan ini diharapkan mengurangi antrean perkara dan memberi transparansi yang lebih besar kepada publik.' },
      { type: 'h2', text: '4. Kampanye digital' },
      { type: 'p', text: 'RUU Pemilu juga mengatur kampanye digital untuk pertama kalinya secara eksplisit. Konten kampanye yang dibayarkan wajib diberi penanda yang jelas, dan platform diminta menyediakan repositori iklan politik yang dapat diakses publik. Ketentuan ini menjadi respons terhadap maraknya konten bersponsor yang tidak transparan pada media sosial.' },
      { type: 'p', text: 'KPU akan menerbitkan pedoman teknis tentang format penanda iklan dan kewajiban pelaporan. Partaipolitik dan calon yang melanggar dapat dikenakan sanksi administratif berupa penghentian konten atau pembatalan jadwal kampanye. Pengawasan dilakukan bersama antara KPU, Komisi Pemilihan Umum daerah, dan lembaga pengawas media.' },
      { type: 'h2', text: '5. Tenaga ad hoc pemilu' },
      { type: 'p', text: 'Penyelenggara pemilu diberi kewenangan merekrut tenaga ad hoc dengan kriteria yang lebih jelas, termasuk batas usia, pendidikan minimum, dan larangan menjadi anggota partai politik pada masa bertugas. Rekrutmen dilakukan secara terbuka dan hasilnya diumumkan di setiap kantor kecamatan. Langkah ini diambil untuk mengurangi ketergantungan pada tenaga sukarela yang jumlahnya tidak menentu.' },
      { type: 'p', text: 'Tenaga ad hoc akan menerima pelatihan standar sebelum bertugas dan mendapatkan kontrak kerja yang menjamin hak upah. KPU memperkirakan kebutuhan tenaga tambahan meningkat sekitar 15 persen dibanding siklus sebelumnya, terutama di wilayah dengan jumlah pemilih yang bertambah signifikan.' },
      { type: 'h2', text: '6. Transparansi hasil' },
      { type: 'p', text: 'Setiap hasil penghitungan suara kini wajib diunggah ke portal publik dalam waktu maksimal 24 jam setelah penghitungan di tempat pemungutan suara selesai. Portal tersebut juga menampilkan versi teduh dari formulir hasil agar warga dapat membandingkan data tanpa harus mengunduh berkas berukuran besar. KPU menyebut transparansi sebagai upaya menekan potensi sengketa.' },
      { type: 'p', text: 'Dengan enam perubahan ini, DPR berharap penyelenggaraan pemilu berikutnya lebih tertib, lebih cepat, dan lebih mudah diawasi publik. RUU masih memerlukan penandatanganan presiden sebelum berlaku penuh. Setelah diundangkan, pemerintah dan KPU memiliki waktu enam bulan untuk menyiapkan seluruh peraturan turunan.' }
    ]
  },
  {
    id: 'inflasi-november',
    category: 'Ekonomi',
    title: 'Inflasi November Turun ke 2,8 Persen, Daya Beli Warga Mulai Pulih',
    excerpt: 'Tekanan harga pangan melandai dan permintaan domestik membaik menjelang akhir tahun.',
    image: 'news2.jpg',
    author: AUTHORS.andi,
    published: '2026-11-25T07:40:00+07:00',
    body: [
      { type: 'p', text: 'Laju inflasi tahunan Indonesia turun ke 2,8 persen pada November 2026, terendah dalam delapan bulan terakhir. Penurunan ini terutama ditopang oleh melandainya harga komoditas pangan strategis serta membaiknya pasokan di sejumlah pasar tradisional. Badan Pusat Statistik mencatat inflasi bulanannya sebesar 0,21 persen.' },
      { type: 'p', text: 'Perbaikan daya beli terlihat dari meningkatnya transaksi ritel dan konsumsi rumah tangga pada kuartal keempat. Pemerintah menyebut stabilitas harga menjadi prasyarat utama agar pertumbuhan ekonomi tetap terjaga menjelang akhir tahun.' }
    ]
  },
  {
    id: 'timnas-jepang',
    category: 'Olahraga',
    title: 'Timnas Indonesia Taklukkan Jepang 2-0 di Laga Uji Coba',
    excerpt: 'Dua gol lahir dari skema serangan balik yang disiapkan pelatih sejak awal babak kedua.',
    image: 'olahraga1.jpg',
    author: AUTHORS.andi,
    published: '2026-11-25T05:20:00+07:00',
    body: [
      { type: 'p', text: 'Tim nasional Indonesia menang 2-0 atas Jepang dalam pertandingan uji coba yang digelar di Stadion Utama Gelora Bung Karno. Kedua gol dicetak pada babak kedua setelah pelatih melakukan perubahan formasi yang memberi ruang lebih bagi serangan balik cepat.' },
      { type: 'p', text: 'Hasil ini menjadi modal penting menjelang fase kualifikasi berikutnya. Pelatih mengapresiasi disiplin pemain dalam menjaga transisi bertahan, meski mengakui masih ada pekerjaan rumah pada akurasi umpan panjang.' }
    ]
  },
  {
    id: 'mk-sengketa',
    category: 'Hukum',
    title: 'MK Gelar Sidang Sengketa Hasil Pilkada Kabupaten',
    excerpt: 'Permohonan diperiksa dengan batas waktu 14 hari kerja sesuai aturan terbaru.',
    image: 'news4.jpg',
    author: AUTHORS.andi,
    published: '2026-11-25T04:10:00+07:00',
    body: [
      { type: 'p', text: 'Mahkamah Konstitusi menggelar sidang perdana sengketa hasil pemilihan kepala daerah kabupaten. Majelis hakim membacakan jadwal pemeriksaan dan memberi kesempatan kepada pemohon untuk melengkapi bukti pendukung dalam tiga hari kerja.' },
      { type: 'p', text: 'Sidang ini menjadi yang pertama menggunakan batas waktu 14 hari kerja setelah disahkannya perubahan aturan pemilu. Panitera menyebut sistem pendaftaran berkas daring sudah digunakan sejak pekan lalu.' }
    ]
  }
];

const OPINIONS = [
  { title: 'Demokrasi di Tangan Warga', author: AUTHORS.siti, image: 'opini1.jpg' },
  { title: 'Menjaga Netralitas Aparatur Negara', author: AUTHORS.budi, image: 'author2.jpg' },
  { title: 'Cek Fakta: Hoaks yang Beredar Menjelang Pilkada', author: AUTHORS.rina, image: 'opini2.jpg' }
];

const POPULAR = [
  'DPR Sahkan RUU Pemilu, Ini Enam Poin Perubahannya',
  'KPU Tetapkan Jadwal Pilkada 2027',
  'Sengketa Pilkada: MK Gelar Sidang Perdana',
  'Timnas Indonesia Menang 2-0 atas Jepang',
  'Inflasi Turun ke 2,8 Persen di November'
];
