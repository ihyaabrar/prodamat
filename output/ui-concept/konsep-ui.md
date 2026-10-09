# Konsep perbaikan UI Prodamat

Tanggal: 9 Oktober 2026
Status: diterapkan ke frontend pada 9 Oktober 2026. Pemeriksaan implementasi tercatat di delivery-gate.md. Catatan revisi sketsa di bawah tetap menjadi riwayat konsep.
Metode: Anti-Slop During, dipilih dalam percakapan ini. Tidak ada instalasi global atau perubahan AGENTS.md.

## Arah yang dipertahankan

Pengguna menyukai UI sekarang dan menginginkan pengalaman yang nyaman bagi siswa SD kelas V dan VI. Pertahankan font Nunito, latar terang, warna biru, bahasa Indonesia yang ramah, maskot Aiko yang sudah ada, form nama dan kelas, serta satu soal per layar. Perbaikan berfokus pada hierarki, penempatan identitas, dan pengurangan elemen yang bersaing dengan tugas siswa.

Design Read: aplikasi pelatihan AI untuk siswa SD dan pendamping, dengan karakter ramah dan teratur. ENERGY 2 / RHYTHM 2 / MOTION 1. Huruf dan ilustrasi memberi kehangatan; perubahan komposisi mengikuti tugas setiap layar; gerakan hanya sebagai respons interaksi.

## Masalah yang terlihat

1. Header aplikasi dan strip institusi merupakan dua blok terpisah. Logo UAD tampak ditambahkan setelah desain utama, bukan menjadi bagian dari identitas halaman.
2. Teks pengantar, label, bintang, chip mengambang, dan kartu petualangan sama-sama meminta perhatian. Anak membutuhkan satu langkah berikutnya yang jelas.
3. Pada layar kecil, pengantar dan Aiko menghabiskan ruang sebelum isian nama dan kelas muncul.
4. Dashboard mendahulukan empat metrik dan perbandingan nilai sebelum rekap. Pendamping terutama perlu membuka sesi, memantau siswa yang belum selesai, dan melihat peringkat.

## Header yang direkomendasikan

Satu header yang menyatukan logo dan identitas penyelenggara:

```text
DESKTOP
[Logo UAD bundar] | Program Studi Magister Informatika        [Logo UAD memanjang]
                 | FAKULTAS TEKNOLOGI INDUSTRI
                                                    Beranda  Pendamping  Bantuan
```

- Logo UAD bundar, garis pembatas vertikal tipis berwarna emas, dan dua baris identitas prodi membentuk kelompok di kiri. Logo UAD memanjang ditempatkan terpisah di ujung kanan. Susunan ini mengikuti referensi terbaru pengguna, bukan dua logo yang bersebelahan.
- Dua baris identitas memakai perataan kiri dan berada di tengah tinggi logo. Nama prodi menjadi baris paling kuat. Tulisan Universitas Ahmad Dahlan di bawah nama fakultas dihapus sesuai revisi pengguna; nama universitas sudah terdapat dalam logo yang dikirim.
- Baris identitas desktop sekitar 98 px. Navigasi aplikasi ditempatkan pada baris utilitas di bawahnya agar tidak menyela komposisi logo pada referensi.
- Nama aplikasi, AI di Sekitar Kita, menjadi judul konten. Ikon buku pada header saat ini tidak lagi menjadi logo utama yang bersaing dengan lambang kampus.
- Beranda menuju halaman peserta, Pendamping menuju dashboard yang sudah ada, Bantuan membuka dialog yang sudah ada. Tautan Cara bermain dapat ditempatkan dekat tombol mulai, karena petunjuk relevan saat siswa hendak mulai.
- Pada ponsel, logo sekitar 40 px, teks prodi boleh membungkus, dan Bantuan tetap memiliki area sentuh 44 px. Pendamping dapat masuk baris utilitas yang rapat. Identitas lengkap tetap terbaca.
- Pada layar soal, identitas kampus tetap ringkas; ruang utama diberikan kepada soal dan pilihan jawaban.
- Kedua logo implementasi berasal dari paket identitas visual resmi UAD, menggantikan salinan proposal dan kiriman pengguna sesuai instruksi terbaru. Sumber dicatat di public/branding/SOURCES.md. Header dibangun dengan HTML/CSS. Warna logotype resmi dibiarkan utuh. Pada ponsel, kelompok prodi tetap di kiri dan logo memanjang tetap di kanan, dengan teks prodi membungkus agar muat.
- Arahan khusus pengguna: huruf kapital dan jarak huruf pada baris fakultas dipertahankan sesuai contoh kiriman. Ini merupakan arahan identitas pengguna, bukan pilihan dekorasi generik. Garis vertikal memisahkan logo dari identitas program sebagaimana referensi.

## Komposisi per halaman

### Beranda siswa

Judul AI di Sekitar Kita, kalimat pendek tentang kegiatan, tombol Mulai petualangan, dan Aiko menjadi kelompok utama. SDN Karangsari dan kelas V/VI memberi konteks kegiatan. Aiko tetap menjadi teman belajar; hilangkan chip mengambang dan bintang di sekelilingnya karena tidak membantu siswa memilih langkah.

Alur pretest, belajar, posttest ditampilkan sebagai urutan kegiatan yang ringkas. Tahap yang bisa dikerjakan mempunyai tombol jelas; tahap lain berupa informasi status. Tiga tahap dipertahankan karena sesuai kegiatan dalam proposal, bukan sebagai susunan kartu pemasaran.

### Nama dan kelas

Judul Kenalan dulu, yuk! langsung diikuti label Nama lengkapmu, dua pilihan Kelas 5 dan Kelas 6, serta tombol Ayo masuk. Petunjuk nama yang sama saat posttest tetap ada. Pada desktop, Aiko mendampingi form; pada ponsel, form muncul lebih awal dan Aiko menjadi ilustrasi kecil agar tidak menggeser isian jauh ke bawah.

Form menggunakan placeholder Tulis nama lengkapmu. Pesan kesalahan muncul di dekat field yang perlu diperbaiki. Nama panjang membungkus dan tidak memotong tombol atau identitas kelas.

### Halaman soal dan hasil

Pertahankan satu soal per layar, pilihan jawaban besar, navigasi yang bisa kembali, dan penyimpanan bertahap. Tuliskan Soal 3 dari 10 dan jumlah terjawab secara jelas. Jawaban terpilih menggunakan tanda centang dan warna, bukan warna saja. Tombol Lanjut menjadi tindakan utama. Hasil menonjolkan nilai posttest dan penjelasan singkat; perbandingan pretest tetap tersedia.

### Dashboard pendamping

Judul konkret: Pantau kegiatan siswa. Urutkan halaman sebagai berikut:

1. Pengaturan fase kegiatan dan status sesi.
2. Ringkasan jumlah peserta terdaftar, selesai pretest, dan selesai posttest dari data aktif.
3. Tab Peserta, Peringkat, dan Analisis soal dengan pencarian serta filter kelas.
4. Ekspor CSV dekat rekap.

Rata-rata nilai menjadi informasi pada Analisis soal atau ringkasan hasil, bukan kartu utama yang bersaing dengan pengaturan sesi.

Di tab Peringkat, letakkan penanda juara di atas tabel. Kolom utama: peringkat, nama, kelas, nilai posttest. Nilai seri berbagi peringkat, sesuai aturan sekarang. Gunakan label Peringkat sementara sebelum sesi ditutup. Jangan menampilkan siswa yang belum mengirim posttest sebagai peserta bernilai nol.

## Alasan keputusan visual

| Keputusan | Alasan |
|---|---|
| Header menyatukan logo dan nama prodi | Identitas penyelenggara terbaca sebagai satu kelompok, tanpa menyela konten. |
| Latar terang #FCFCF8 | Mempertahankan arah yang disukai pengguna dan suasana kegiatan belajar di kelas. |
| Teks utama #243449 | Membuat soal dan petunjuk mudah dibaca pada latar terang. |
| Biru utama #3158DF | Meneruskan identitas aplikasi; dipusatkan pada tindakan utama dan pilihan aktif. |
| Oranye #F6B95C sebagai aksen terbatas | Memberi penekanan pada pencapaian, dengan teks gelap di atasnya. Bukan pengganti logo resmi. |
| Nunito | Mempertahankan karakter ramah yang sudah disukai pengguna; label dan soal menggunakan ukuran yang nyaman dibaca. |
| Aiko yang sudah ada | Menghubungkan halaman dengan pengalaman belajar anak, terutama petunjuk dan umpan balik. |
| Mengurangi bintang, titik dekoratif, dan chip | Mengembalikan perhatian ke langkah berikutnya. |
| Radius input 10 px, panel 16 px | Membedakan field dan kelompok konten sambil mempertahankan karakter lembut. |
| Bayangan hanya pada dialog | Menjelaskan lapisan yang sedang meminta perhatian. |
| Area sentuh minimal 44 px, pilihan soal sekitar 56 px | Memberi ruang klik dan ketuk yang nyaman. |
| Animasi hanya respons interaksi | Menunjukkan pilihan dan fokus tanpa mengganggu saat membaca soal. |
| Dashboard mendahulukan sesi | Mendukung keputusan pendamping saat kegiatan berlangsung. |

## Ketentuan saat implementasi

- Uji pada lebar 360, 390, 768, 1024, dan 1366 px. Tidak boleh ada overflow horizontal atau identitas yang terpotong.
- Ukuran label form dan teks soal tidak dibuat kecil demi memasukkan seluruh konten ke satu layar. Gulir vertikal diperbolehkan bila diperlukan.
- Target ukuran saat implementasi: isian dan label utama 16 px, teks soal 20 px pada ponsel dan 24 px pada desktop, serta petunjuk pendukung 14 px. Sketsa posisi tidak menjadi ukuran tipografi final.
- Kontras teks biasa minimal 4,5:1; teks besar dan batas komponen yang penting minimal 3:1.
- Tab, Shift+Tab, Enter, Space, dan Escape mengikuti perilaku native yang tepat; fokus terlihat jelas.
- Empty state menyebut sebab dan langkah berikutnya. Peringkat kosong: Belum ada posttest yang dikirim. Selesaikan posttest untuk menampilkan peringkat.
- Loading state: Menyiapkan hasil siswa. Error state menjelaskan operasi yang gagal dan cara mencoba kembali; peringatan gagal menyimpan tidak disamarkan.
- Pertahankan penjelasan pratinjau dan penyimpanan lokal secara jujur. Data contoh hanya muncul dengan label contoh.
- Logo tidak terdistorsi, tidak diberi efek atau warna baru, dan tidak diulang berlebihan pada setiap bagian.
- Header, beranda/form, soal, dashboard, dan peringkat diperbarui bertahap. Setelah implementasi, verifikasi alur daftar, lanjut tes, kirim jawaban, buka posttest, lihat hasil, filter peringkat, dan ekspor.

## Delivery Gate, lingkup konsep

- Hard Gate: PASS untuk konsep. Nama prodi dan fakultas berasal dari proposal; kedua logo memakai aset dari proposal dan kiriman pengguna. Ketentuan kontras, mobile, keyboard, dan semua state tercantum. Tidak ada kontrol atau fitur aplikasi baru yang diklaim telah dibuat.
- Purpose-Gate: PASS untuk konsep. Alasan warna, tipografi, ilustrasi, susunan header, radius, dan gerakan ditulis di tabel keputusan.
- Liveliness: PASS untuk konsep. Dials 2/2/1 mengikuti UI ramah anak yang disukai pengguna. Form menjadi fokus saat masuk, soal saat tes, pengaturan sesi saat mendampingi, dan juara saat melihat peringkat.
- Craftsmanship dan Quality Locks: PASS untuk konsep. Susunan mengikuti pekerjaan siswa dan pendamping, tanpa angka hasil atau logo rekaan. Sketsa hanya menunjukkan layout dan diberi label statis. Verifikasi aplikasi hasil implementasi belum dilakukan karena frontend belum diubah.

Bukti pemeriksaan sketsa: dibuka di browser lokal; header desktop dan representasi ponsel menampilkan identitas lengkap. Logo dari proposal dan Aiko dari komponen yang sudah ada berhasil dimuat. Lebar halaman 1265 px sama dengan scrollWidth, sehingga sketsa pada ukuran pemeriksaan tidak meluber. Console error kosong. Tidak ada elemen button, input, select, atau link dalam sketsa karena seluruhnya merupakan ilustrasi layout statis.

Kontras warna yang dihitung: teks utama di latar terang 12,28:1; teks sekunder 6,24:1; teks putih pada tombol biru 5,85:1; teks gelap pada aksen oranye 7,23:1. Pengujian interaksi dan breakpoint aplikasi baru dilakukan setelah implementasi, bukan diklaim lulus dari sketsa.

Revisi dua logo: kedua gambar berhasil dimuat pada sketsa desktop dan ponsel. Header desktop memiliki clientWidth dan scrollWidth yang sama, 843 px; header representasi ponsel juga sama, 328 px. Tidak ada baris teks Universitas Ahmad Dahlan di bawah nama fakultas. Logo kiriman tetap memuat nama universitas sebagai bagian dari gambar. Console error kosong. Bukti visual revisi: konsep-dua-logo.jpg. Frontend utama belum diubah.

Revisi terbaru sesuai contoh pengguna: logo bundar dan nama prodi berada di kiri dengan garis pembatas emas; logo UAD memanjang berada terpisah di kanan. Navigasi berada pada baris di bawah identitas. Kedua logo termuat; lebar dan scrollWidth header sama pada sketsa desktop (843 px) dan representasi ponsel (328 px); console error kosong. Bukti terbaru: konsep-header-sesuai-contoh.jpg. Empat blok Delivery Gate tetap PASS dalam lingkup konsep; huruf kapital dan jarak huruf fakultas merupakan arahan eksplisit pengguna. Frontend utama belum diubah.

Referensi aturan: https://github.com/miqdadbadjuber/anti-slop/blob/main/skills/antislop/SKILL.md dan https://github.com/miqdadbadjuber/anti-slop/blob/main/skills/antislop-ui/SKILL.md.

## Revisi 2: Ceria tapi fokus (9 Oktober 2026)

Permintaan pengguna: UI lebih menarik dan tidak membuat anak pusing. Mode Anti-Slop During dipilih ulang di percakapan ini, dial dinaikkan atas pilihan pengguna.

Design Read: aplikasi kuis belajar untuk siswa kelas 5 dan 6 (plus dashboard pendamping), gaya kelas yang hangat dan teratur. ENERGY 3 / RHYTHM 2 / MOTION 2. Header identitas UAD, Nunito, biru, dan Aiko dipertahankan.

Masalah yang diperbaiki: terlalu banyak teks abu-abu yang sama kuat; layar soal memuat sekitar sepuluh elemen (judul, label waktu, progress, peta soal, dua catatan); hub tidak menunjukkan langkah yang harus dikerjakan sekarang.

| Keputusan | Alasan satu baris |
|---|---|
| Gelembung Aiko di setiap layar siswa, satu instruksi | Motif identitas: anak selalu tahu satu hal yang harus dilakukan berikutnya. |
| Hero biru penuh dengan judul AI di Sekitar Kita | Nama kegiatan menjadi titik fokus pertama; biru sudah menjadi warna aplikasi. |
| Tombol kuning hanya pada momen penting (mulai, periksa jawaban, lihat hasil, nilai) | Satu aksen yang disengaja menandai awal dan akhir petualangan. |
| Hijau hanya untuk selesai dan jawaban tepat | Status dibaca dari warna dan ikon centang, tidak dari teks saja. |
| Jalur 3 langkah di beranda dan hub | Mengikuti urutan kegiatan nyata di proposal (pretest, materi, posttest), bukan template. |
| Hub: tahap sekarang berbingkai biru tebal, selesai hijau, terkunci abu putus-putus dengan alasan | Satu titik fokus per layar; anak tidak menebak tombol mana yang bisa diklik. |
| Tepi bawah tebal pada tombol, kartu jawaban, dan pilihan kelas | Bayangan sebagai penanda benda yang bisa ditekan; turun 2 sampai 3 px saat diklik. |
| Layar soal: progres di dalam kartu soal, nomor soal dipindah ke bawah | Soal dan pilihan jawaban menjadi hal pertama yang terlihat, terutama di ponsel. |
| Pilihan kelas sebagai kartu besar berangka 5 dan 6 | Angka besar lebih cepat dikenali anak daripada radio kecil. |
| Hasil: nilai besar di kartu kuning, perbandingan pretest/posttest sebagai bilah | Anak membaca panjang bilah lebih cepat daripada dua angka. |
| Ikon Lucide dengan stroke 2,3 sampai 2,5 | Sudah dipakai proyek; ujung bulat cocok dengan Nunito, dan setiap ikon mewakili tindakannya (pensil, klik, kirim, kunci, centang). |
| Gerak: centang muncul, kartu soal bergeser masuk, gelembung muncul, Aiko melambai dua kali, perayaan sekali saat tes selesai | Setiap gerak adalah umpan balik atau penanda layar baru; tidak ada loop; dimatikan untuk prefers-reduced-motion. |
| Tema terang saja | Dipakai di kelas dan proyektor; arah terang sudah dipilih pengguna. |
| Batas komponen #808c9d | Kontras 3,4:1 terhadap putih untuk kartu jawaban dan tombol sekunder. |
