# Pemeriksaan rebuild frontend Prodamat

9 Oktober 2026. Mode Anti-Slop During; ENERGY 2 / RHYTHM 2 / MOTION 1. Lingkup: frontend lokal Next.js, belum database atau deployment. Arah Nunito, biru/cream, maskot Aiko, nama/kelas, dan header mengikuti keputusan pengguna.

## Hard Gate: PASS

- Dua logo disalin utuh dari paket identitas visual resmi UAD. Sumber dan ukuran tercatat di ../../public/branding/SOURCES.md. Logo bundar di kiri, divider emas dan prodi/fakultas dibuat dengan HTML, logotype di kanan. Tidak menggunakan banner atau logo dari screenshot kiriman.
- Build produksi dan TypeScript lulus. Uji model lulus untuk pendaftaran, peserta kembali, pemisahan kelas, migrasi data, peringkat seri, dan pengamanan formula CSV.
- Label input terhubung; pilihan kelas/soal memakai radio native; soal memakai fieldset/legend. Keyboard Space memilih jawaban; Enter membuka Bantuan; Escape menutup dialog dan fokus kembali ke tombol Bantuan. Tanda centang menyertai warna jawaban terpilih.
- Teks soal ponsel terukur 20 px, pilihan jawaban 64 px tinggi. Tombol dan nomor soal minimal 44 px. Reduced motion meniadakan transisi.
- Kontras token: teks utama 12,28:1, teks sekunder 6,24:1, putih/biru tombol 5,85:1, status sukses 6,40:1, label tombol nonaktif 5,62:1. Batas kontrol memakai #7e8b9d yang lebih gelap dari batas awal #8b96a5 (sekitar 3:1).
- Beranda dan dashboard diuji melalui iframe pada viewport nominal 360/390/768/1024/1366. Lebar dokumen dan scrollWidth sama: 345/375/753/1009/1351 px ketika scrollbar tampil. Pada hub dan soal 360 px tanpa scrollbar, keduanya sama-sama 360 px. Kedua logo termuat; tidak ada overflow horizontal dokumen. Tabel memakai gulir lokal.
- Data contoh diberi label simulasi. Data kosong karena pencarian/filter menyebut sebab dan tindakan berikutnya. Loading serta kegagalan penyimpanan punya pesan yang konkret; kegagalan storage diperiksa melalui kode, tidak diklaim disimulasikan dalam browser.

## Purpose-Gate: PASS

- Header mengikuti referensi pengguna; navigasi berada di bawah kelompok institusi. Huruf kapital dan jarak huruf fakultas merupakan arahan eksplisit pengguna.
- Biru menandai tindakan dan pilihan; emas menandai pencapaian; latar terang membantu kegiatan kelas. Logo resmi tidak diwarnai ulang. Nunito dipertahankan untuk keterbacaan dan karakter ramah.
- Form ponsel mendahulukan isian, soal menampilkan satu tugas, hasil menonjolkan posttest, dashboard mendahulukan fase kegiatan. Rata-rata dipindahkan ke Analisis soal.
- Aiko memberi petunjuk dan umpan balik. Chip mengambang, bintang dekoratif, serta panah pada bagian yang tidak bisa diklik dihapus. Radius membedakan kelompok/form; bayangan lapisan hanya pada dialog, selain ilustrasi maskot yang dipertahankan.

## Liveliness: PASS

- Beranda menggabungkan judul dan ajakan dengan Aiko serta urutan kegiatan. Form, latihan, soal, hasil, rekap, dan peringkat punya susunan sesuai tugas masing-masing.
- Warna terpilih, centang, progres jawaban, status tersimpan, dan umpan balik latihan merespons tindakan nyata. Tidak ada animasi dekoratif berulang atau angka hasil rekaan.
- Bahasa siswa singkat, tanpa batas waktu dan dengan izin belum tahu. Nama panjang dapat membungkus; input dibatasi 60 karakter sesuai model.

## Craftsmanship & Quality Locks: PASS

- Browser menguji daftar **Uji Tampilan**, kelas V, latihan tombol, Space untuk jawaban pertama, lanjut soal, simpan/kembali, lalu melanjutkan dari soal belum dijawab. Semua 10 pretest terkirim; posttest tetap terkunci sampai pendamping membuka sesi.
- Perubahan Belajar dan Posttest di tab dashboard terbaca pada tab siswa melalui storage event. Semua 10 posttest terkirim. Hasil peserta uji benar-benar menunjukkan pretest 6/10, posttest 2/10, perubahan -4 poin. Pembahasan dapat dibuka dan diganti jenis tes.
- Sesi ditutup menampilkan peringkat akhir. Filter nama Uji Tampilan tetap menampilkan peringkat 2; filter kelas VI menghasilkan pesan kosong. Data contoh memiliki tiga juara bersama peringkat 1, diikuti peringkat 4, sesuai aturan seri.
- Analisis contoh berisi 10 soal; rata-rata pasangan lengkap pretest 5,3 dan posttest 8,9. Unduhan CSV berhasil dibuka: 20 baris simulasi, 28 kolom termasuk seluruh jawaban, sumber CONTOH.
- Bantuan, logo sebagai tautan beranda, Beranda dari hasil, Cara bermain, pergantian jenis pembahasan, sesi, filter, simulasi, dan ekspor bekerja. Navigasi Beranda diperbaiki agar juga mengembalikan state layar siswa ketika URL sudah /.
- React review: state tetap pada pengendali alur, listener dibersihkan, derivasi skor tidak disimpan sebagai state tambahan, identitas daftar stabil, nama di-escape React, tidak ada fetch baru atau dependensi tambahan. Native dialog mengembalikan fokus saat ditutup.
- Console error beranda/dashboard kosong. Peserta uji disimpan sebagai data demo lokal; data lama dipertahankan. Sesi dikembalikan ke Pretest dan simulasi dimatikan. Harness QA dihapus setelah pengujian.

Bukti: ../screenshots/rebuild-home.jpg, ../screenshots/rebuild-dashboard.jpg, ../screenshots/rebuild-mobile-dashboard.jpg.

Referensi skill: https://github.com/miqdadbadjuber/anti-slop/blob/main/skills/antislop/SKILL.md dan https://github.com/miqdadbadjuber/anti-slop/blob/main/skills/antislop-ui/SKILL.md.

## Revisi 2, Ceria tapi fokus (9 Oktober 2026)

Mode Anti-Slop During. ENERGY 3 / RHYTHM 2 / MOTION 2. Alasan setiap keputusan ada di konsep-ui.md bagian Revisi 2.

### Hard Gate: PASS

- R-02: tidak ada em dash di komponen dan CSS (grep kosong).
- R-03: diuji pada 360, 600, 800, dan 1024 px. scrollWidth sama dengan lebar viewport di beranda, hub, soal, dan hasil. Nama panjang (Muhammad Rizky Ananda Pratama) membungkus tanpa memotong. Nomor soal 44 px, tombol utama 58 sampai 60 px.
- R-17, R-18, R-36, R-38: tidak ada angka, testimoni, atau klaim baru. Contoh jawaban di beranda diberi label "Contoh" dan tidak dapat diklik.
- R-23: tidak ada aset baru. Aiko memakai SVG yang sudah ada, hanya ditambah grup lengan untuk lambaian.
- R-24, R-26: navigasi tidak berubah. Semua tombol baru punya aksi.
- R-25: putih di biru 5,85:1; teks konteks hero 4,88:1; teks gelap di kuning 9,04:1; teks sekunder 6,10 sampai 6,91:1; hijau di hijau muda 5,72:1; pill kuning 7,36:1; batas komponen 3,4:1.
- R-27: loading, kegagalan simpan (label merah "Belum tersimpan"), tahap terkunci dengan alasan, dan kosong di dashboard tetap ada.
- R-32: Tab mencapai tombol dengan outline 3 px; Escape menutup dialog Bantuan dan fokus kembali ke tombol Bantuan; pilihan kelas dan jawaban tetap radio native dengan cincin fokus.
- R-33: perubahan ditulis langsung di file sumber; tidak ada skrip patch di repo.
- R-35: typecheck dan build produksi lulus; console dan log server tanpa error. Klik-uji: Mulai petualangan -> form; nama + Kelas 5 -> Ayo masuk aktif -> hub; Mulai pretest -> latihan; pilih latihan -> Aiko berubah pesan, tombol aktif; Mulai pretest -> soal 1; pilih jawaban -> centang + Lanjut aktif; soal 10 -> Periksa jawaban -> dialog -> Kirim -> layar selesai -> Kembali ke petualanganku -> hub (pretest hijau); /pendamping -> Posttest -> hub menampilkan posttest aktif; posttest selesai -> Lihat hasil -> bilah nilai dan pembahasan terbuka; Simpan & keluar -> hub dengan "1 dari 10 soal".
- Animasi diperiksa melalui CSSOM karena panel uji memakai prefers-reduced-motion: semua animasi sekali jalan (wave 2 kali), dan aturan reduced-motion mematikannya serta menyembunyikan perayaan.

### Purpose-Gate: PASS

Kuning, hijau, bayangan tepi bawah, ikon, ilustrasi Aiko, dan setiap gerak punya alasan tertulis di tabel Revisi 2. Tidak ada gradien, glow, grid latar, atau badge dekoratif. Panah hanya pada tombol yang membawa ke langkah berikutnya.

### Liveliness: PASS

Dial dinyatakan. Titik fokus per layar: hero (judul + tombol kuning), hub (tahap sekarang), soal (kartu soal), selesai (Aiko + centang), hasil (kartu nilai). Aksen kuning terbatas pada momen mulai dan hasil. Motif identitas: gelembung instruksi Aiko dan benda yang "bisa ditekan". RHYTHM 2: hero biru terbelah, jalur terbuka di atas latar, panel kuning muda dengan contoh, berbeda satu sama lain.

### Craftsmanship dan Quality Locks: PASS

Tidak ada bagian template; setiap bagian berasal dari alur kegiatan. Palet: biru inti, hijau status, kuning aksen, netral. Radius bervariasi (tombol 14, kartu jawaban 18, kartu 20 sampai 28, token bulat). Dashboard pendamping hanya mengikuti token baru; strukturnya tidak diubah.
