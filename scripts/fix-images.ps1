# Ganti foto placeholder bertema gunung dengan foto berita nyata dari RSS ANTARA.
# Dijalankan sekali saat menyiapkan aset: ./scripts/fix-images.ps1
$base = 'https://img.antaranews.com/cache/800x533/'
$map = @'
hero.jpg|2026/11/25/rapat-pembahasan-mekanisme-pengisian-wapres-2913999.jpg
news1.jpg|2026/11/25/1000483006.jpg
news2.jpg|2026/11/25/raker-gubernur-bi-dengan-komisi-xi-dpr-2914063.jpg
news3.jpg|2026/11/25/bupati-lombok-barat-nonaktif-LAZ.jpg
news4.jpg|2026/11/25/IMG_0563_1.jpg
politik1.jpg|2026/11/25/1000665156.jpg
politik2.jpg|2026/11/25/1001762936_1.jpg
politik3.jpg|2026/11/23/Wawancara-khusus-dengan-Menteri-Luar-Negeri-230725-Bay-3.jpg
politik4.jpg|2026/11/25/1001644708.jpg
politik5.jpg|2026/11/25/9a85e0ca-e7ec-4169-8af4-6d0e940a3fbc.jpeg
politik6.jpg|2026/11/25/Tonny-Harjono-AU.jpg
olahraga1.jpg|2026/11/25/jafar.jpeg
olahraga2.jpg|2026/11/25/928142.jpg
ekonomi1.jpg|2026/11/25/WhatsApp-Image-2026-11-25-at-13.02.46-1.jpeg
ekonomi2.jpg|2026/11/05/Ekspor-Mobil-Listrik-Di-China-051126-str-3.jpg
opini1.jpg|2026/11/25/perkembangan-aksesi-indonesia-pada-oecd-2913919.jpg
opini2.jpg|2026/11/25/PLTP-Karaha-Tasikmalaya.jpg
galeri1.jpg|2026/11/25/Pesta-Adat-Ngarot-Lelea-251126-DS-5.jpg
galeri2.jpg|2026/11/25/bdd611e3-abe2-4a56-b0d8-835084d15b2d-1.jpeg
galeri3.jpg|2026/11/25/Potensi-garam-di-Sabu-Raijua-25112026-KH-6-copy.jpg
hiburan1.jpg|2026/06/08/IMG_1575.jpeg
hiburan2.jpg|2026/11/TNI-AL-AS-GELAR-CARAT-2026-FOKUS-PENANGGULANGAN-BENCANA.jpg
infografis.jpg|2026/11/25/IMG_9784.jpeg
video1.jpg|2026/11/MENKUM-NYATAKAN-DOKUMEN-KEWARGANEGARAAN-AMRAN-SUGIONO-SAH-DAN-BENAR.jpg
author1.jpg|2026/11/25/20468_1.jpg
author2.jpg|2026/11/25/85695.jpg
author3.jpg|2026/11/25/WhatsApp-Image-2026-11-25-at-15.10.04.jpeg
author4.jpg|2026/11/25/WhatsApp-Image-2026-11-25-at-11.32.47.jpeg
'@
$dir = Join-Path $PSScriptRoot '..\assets\img'
$gagal = 0
foreach ($baris in ($map -split "`n")) {
  if (-not $baris.Trim()) { continue }
  $bagian = $baris -split '\|'
  if ($bagian.Count -ne 2) { continue }
  $nama = $bagian[0].Trim()
  $url = $base + $bagian[1].Trim()
  $tujuan = Join-Path $dir $nama
  & curl.exe -fsSL --max-time 30 -o $tujuan $url
  if ($LASTEXITCODE -ne 0) {
    Write-Output "GAGAL $nama"
    $gagal++
  } else {
    Write-Output ("OK   {0}  {1} bytes" -f $nama, (Get-Item $tujuan).Length)
  }
}
Write-Output "Selesai. Gagal: $gagal"
