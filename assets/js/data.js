/* Konten contoh. Di situs nyata, ini diganti oleh API/CMS. */
const AUTHORS = {
  faisal: { name: 'Faisal Akbar', role: 'Pemilik & Pemimpin Redaksi', photo: 'pemilik-profil-rapi.jpg', email: 'felixreuss29@gmail.com' }
};

const ARTICLES = [
  {
    id: 'pilkada-2027',
    category: 'Politik',
    title: 'KPU Tetapkan Jadwal Pilkada 2027, Ini Rangkaian Tahapannya',
    excerpt: 'Komisi Pemilihan Umum merilis kalender pemilihan kepala daerah berikutnya, dari pencalonan hingga pelantikan.',
    image: 'hero.jpg',
    author: AUTHORS.faisal,
    published: '2026-11-25T09:12:00+07:00',
    updated: '2026-11-25T10:15:00+07:00',
    featured: true,
    body: [
      { type: 'p', text: 'Komisi Pemilihan Umum telah menetapkan kalender penyelenggaraan pemilihan kepala daerah tahun 2027. Jadwal tersebut mencakup seluruh tahapan, mulai dari persiapan administrasi dan pencalonan hingga penghitungan suara serta pelantikan kepala daerah terpilih.' },
      { type: 'p', text: 'Penetapan jadwal ini menjadi acuan bagi kantor KPU di seluruh daerah untuk menyusun rencana kerja dan anggaran. KPU mengimbau partisipasi warga sejak awal, terutama pada tahapan pemutakhiran data pemilih yang kerap menjadi titik kritis.' },
      { type: 'h2', text: '1. Pemutakhiran data pemilih' },
      { type: 'p', text: 'Tahap awal difokuskan pada pemutakhiran daftar pemilih secara berjenjang. Petugas akan melakukan pencocokan dan penelitian langsung ke rumah tangga, lalu mempublikasikan daftar hasil untuk mendapat masukan warga sebelum ditetapkan.' },
      { type: 'p', text: 'KPU membuka kanal pengaduan daring agar warga dapat melaporkan data yang tidak sesuai. Setiap masukan diverifikasi oleh panitia pemutakhiran sebelum dimasukkan ke dalam daftar pemilih tetap.' },
      { type: 'h2', text: '2. Pencalonan dan verifikasi' },
      { type: 'p', text: 'Partai politik mengajukan pasangan calon melalui kantor KPU daerah dengan melengkapi persyaratan administratif. Berkas yang diterima akan diperiksa pada tahap verifikasi faktual untuk memastikan keabsahan dukungan dan identitas calon.' },
      { type: 'p', text: 'Calon dari jalur perseorangan wajib menunjukkan bukti dukungan yang tersebar di sejumlah kecamatan sesuai ketentuan. KPU akan mengumumkan hasil verifikasi secara terbuka sebelum menetapkan daftar calon tetap.' },
      { type: 'quote', text: 'Jadwal yang jelas memberi kepastian bagi penyelenggara maupun warga. Kami mengajak semua pihak menjaga tahapan tetap tertib.', cite: 'Juru Bicara KPU' },
      { type: 'h2', text: '3. Kampanye dan pemungutan suara' },
      { type: 'p', text: 'Masa kampanye dimulai setelah penetapan calon tetap dan dibatasi oleh ketentuan waktu yang berlaku. KPU akan mengawasi pelaksanaan kampanye, termasuk materi yang disebarkan melalui media sosial, agar tetap mematuhi aturan yang ditetapkan.' },
      { type: 'p', text: 'Pada hari pemungutan suara, warga dapat menggunakan hak pilih di tempat pemungutan suara yang telah ditentukan berdasarkan domisili. Informasi lokasi dan jadwal dapat diakses melalui portal resmi KPU.' },
      { type: 'h2', text: '4. Penghitungan dan penetapan hasil' },
      { type: 'p', text: 'Penghitungan suara dilakukan di tempat pemungutan suara, kemudian dilanjutkan secara berjenjang hingga tingkat daerah. Hasil penghitungan diunggah ke portal publik agar dapat dipantau oleh warga.' },
      { type: 'p', text: 'Setelah hasil ditetapkan, kepala daerah terpilih dilantik sesuai jadwal yang ditentukan. KPU menegaskan seluruh tahapan dapat dipantau publik sebagai bentuk komitmen terhadap transparansi penyelenggaraan pemilu.' }
    ]
  },
  {
    id: 'inflasi-november',
    category: 'Ekonomi',
    title: 'Inflasi November Turun ke 2,8 Persen, Daya Beli Warga Mulai Pulih',
    excerpt: 'Tekanan harga pangan melandai dan permintaan domestik membaik menjelang akhir tahun.',
    image: 'news2.jpg',
    author: AUTHORS.faisal,
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
    author: AUTHORS.faisal,
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
    image: 'gedung-mk.jpg',
    alt: 'Gedung Mahkamah Konstitusi Republik Indonesia.',
    author: AUTHORS.faisal,
    published: '2026-11-25T04:10:00+07:00',
    body: [
      { type: 'p', text: 'Mahkamah Konstitusi menggelar sidang perdana sengketa hasil pemilihan kepala daerah kabupaten. Majelis hakim membacakan jadwal pemeriksaan dan memberi kesempatan kepada pemohon untuk melengkapi bukti pendukung dalam tiga hari kerja.' },
      { type: 'p', text: 'Sidang ini menjadi yang pertama menggunakan batas waktu 14 hari kerja sesuai ketentuan yang berlaku. Panitera menyebut sistem pendaftaran berkas daring sudah digunakan sejak pekan lalu.' }
    ]
  }
];

const POPULAR = [
  'Prabowo Ajukan Andi Amran Sulaiman dan Sugiono sebagai Calon Wakil Presiden Pengganti Gibran',
  'Rupiah Cetak Rekor Terlemah Sepanjang Sejarah, Sempat Tembus Rp18.400 per Dolar AS',
  'KPU Tetapkan Jadwal Pilkada 2027, Ini Rangkaian Tahapannya',
  'Sengketa Pilkada: MK Gelar Sidang Perdana',
  'Pengamat: Stabilitas Aturan Jadi Kunci Pemilu 2027'
];
