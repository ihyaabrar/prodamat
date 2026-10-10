# Konsep Aiko 3D di aplikasi siswa

Tanggal: 10 Oktober 2026. Status: disetujui dan diterapkan 10 Oktober 2026 (komponen `components/aiko-3d.tsx`, mesin `lib/aiko3d/engine.ts`).

Design Read: maskot 3D sebagai pemanis di aplikasi tes anak SD, gaya hangat dan teratur, dial tetap ENERGY 3 / RHYTHM 2 / MOTION 2. Aiko 3D hanya muncul di momen sapaan dan perayaan; layar yang menuntut fokus tetap tenang.

## Tujuan

Anak merasa disambut dan dirayakan oleh Aiko yang "hidup", tanpa mengganggu saat mengerjakan soal dan tanpa membuat Chromebook sekolah lambat.

## Di mana Aiko 3D muncul

| Layar | Gerakan | Alasan |
|---|---|---|
| Beranda (hero) | Kotak biru menjadi "layar": Aiko tampil dari kepala sampai dada, sedikit miring, badan terpotong tepi bawah kotak, dan tangan kanannya keluar melewati tepi kanan kotak. Melambai saat dibuka, lalu diam bernapas. Kepala menoleh pelan mengikuti kursor atau sentuhan. Diketuk: memutar gerakan ceria dan ganti kalimat di gelembung. | Kesan pertama; satu-satunya tempat interaksi bebas. |
| Halaman petualangan | Pose mengikuti tahap: melambai saat posttest dibuka, membaca saat waktu belajar, merayakan saat kedua tes selesai, diam saat menunggu. | Perubahan tahap jadi terasa tanpa membaca. |
| Selesai tes | Merayakan: lompat dua kali dan konfeti sekali. | Momen penghargaan paling kuat. |
| Hasil | Merayakan bila nilai naik atau tinggi; menenangkan bila sama atau turun. | Selaras dengan pesan hasil yang ramah. |

Tidak muncul di: layar soal, form nama dan kelas, dialog, dan dashboard pendamping. Di layar-layar itu Aiko tetap 2D atau tidak tampil.

## Pengaman agar tidak membebani Chromebook

1. Gambar 2D tampil lebih dulu; three.js dimuat belakangan saat browser senggang, lalu Aiko 3D muncul perlahan menggantikan gambar 2D di tempat yang sama. Tidak pernah ada kotak kosong.
2. Tetap 2D bila: WebGL tidak tersedia, pengaturan kurangi gerak aktif, mode hemat data, memori perangkat 2 GB atau kurang, atau kecepatan render di bawah 22 fps selama 2 detik pertama (render dibatasi 30 fps). Perangkat yang tersendat ditandai untuk sisa sesi browser. Parameter `?aiko3d=paksa` melewati pemeriksaan ini untuk meninjau, dan mencatat fps di console.
3. Satu renderer dipakai bergantian antar layar; rendering berhenti saat Aiko tidak terlihat atau tab tidak aktif; kepadatan piksel dibatasi 1,5.
4. Hanya inti three.js dan RoundedBoxGeometry yang dibundel (tanpa OrbitControls), dimuat dari server aplikasi sendiri, bukan CDN.
5. Saklar pendamping: dashboard mendapat pilihan "Aiko 3D" (aktif/mati) yang berlaku untuk semua perangkat siswa dalam beberapa detik, seperti pergantian tahap. Bila saat gladi atau hari-H ada Chromebook yang tersendat, pendamping mematikannya tanpa perlu deploy ulang.

## Karakter dan gerak

- Model sama dengan pratinjau `output/aiko-3d`: leher pendek, tulisan oranye UAD di dada, wajah tanpa garis kilau.
- Gerakan sekali jalan sesuai manifest aset; napas dan kedip saat diam sangat halus dan berhenti saat Aiko tidak terlihat.
- Ekspresi per pose ditambahkan: mata menyipit saat berpikir, mata bulat berbinar saat merayakan, alis lembut saat menenangkan.

## Ukuran unduhan

Terukur sekitar 135 KB terkompresi (gzip), diunduh sekali lalu tersimpan di cache browser. Halaman soal tidak memuatnya sama sekali.

## Rencana uji

- Ukur fps dan waktu muat di Chromebook sekolah saat gladi 12 Oktober, dengan beberapa perangkat sekaligus di Wi-Fi sekolah.
- Uji fallback: matikan WebGL, aktifkan kurangi gerak, matikan saklar dari dashboard.
- Bila hasil gladi tidak lancar, saklar dimatikan dan aplikasi kembali sepenuhnya 2D.
