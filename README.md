# AI di Sekitar Kita

Frontend pretest dan posttest Prodamat untuk siswa kelas V dan VI SDN Karangsari Yogyakarta. Dibangun dengan Next.js, React, TypeScript, CSS responsif, ikon Lucide, font Nunito lokal, serta maskot SVG.

## Menjalankan

```sh
npm install
npm run dev
```

Buka URL lokal yang ditampilkan terminal. `npm run typecheck` memeriksa TypeScript; `npm run build` membuat build produksi. `npm run start` menjalankan build produksi.

## Mencoba alur lengkap

1. Pada beranda klik **Mulai petualangan**.
2. Isi nama lengkap dan pilih kelas **5 (V)** atau **6 (VI)**. Peserta baru terdaftar otomatis. Nama dan kelas yang sama membuka hasil peserta yang sudah terdaftar.
3. Buka pretest, coba tombol latihan, lalu jawab sepuluh soal. Pilihan tersimpan setiap kali dipilih; refresh dan masuk kembali dengan nama dan kelas yang sama untuk melanjutkan.
4. Periksa jawaban lalu kirim. Nilai dan pembahasan belum ditampilkan.
5. Buka `/pendamping` di tab lain pada browser yang sama. Pilih **Belajar**, kemudian **Posttest** untuk membuka sesi berikutnya. Tab peserta mengikuti perubahan melalui event storage.
6. Kembali ke peserta, selesaikan posttest, lalu lihat nilai dan pembahasan kedua tes.
7. Coba filter kelas, pencarian nama, peringkat, analisis soal, dan unduh CSV di dashboard. Tombol **Lihat data contoh** hanya mengganti tampilan data, tidak menimpa jawaban lokal.

## Batas frontend

- Semua data disimpan dalam `localStorage` browser pada origin yang sama, dengan key `prodamat.ai-demo.v1`. Tidak ada API atau database. Pengaturan di satu perangkat belum diteruskan ke perangkat lain.
- Halaman pendamping adalah demo tanpa autentikasi. Jangan gunakan untuk mengumpulkan data kegiatan sebenarnya.
- Skoring dan kunci jawaban berada di frontend agar prototipe dapat dicoba. Sebelum penggunaan nyata, pindahkan kunci, otorisasi sesi, validasi pengiriman, dan skoring ke server.
- Tidak ada pengiriman data ke layanan AI. Data peserta berupa nama dan kelas. ID internal tidak perlu diisi siswa.
- Peringatan ditampilkan bila browser tidak dapat menyimpan jawaban. Data yang gagal disimpan hanya tersedia selama halaman tetap terbuka.
- Setiap peserta bisa mengirim sekali per jenis tes. Jawaban yang belum lengkap tidak bisa dikirim. Posttest membutuhkan pretest yang sudah dikirim dan fase posttest yang dibuka.
- Peserta dapat berganti melalui **Ganti peserta**. Jawaban setiap peserta tetap terpisah di penyimpanan lokal.
- Rata-rata dan selisih dihitung dari peserta dengan pasangan pretest–posttest lengkap. Kedua instrumen berbeda; perubahan nilai adalah ringkasan deskriptif.

## Sumber soal

Seluruh 20 soal dan kunci di `lib/questions.json` diimpor dari `Pretest_Posttest_Pelatihan_AI_di_Sekitar_Kita.docx` yang diberikan pengguna. Skor adalah 1 poin untuk setiap jawaban benar, maksimal 10. Penjelasan pembahasan ditambahkan di `lib/model.ts`.

## Struktur

- `app/`: layout, halaman peserta, halaman pendamping, dan CSS.
- `components/experience.tsx`: pengendali alur dan penyimpanan lokal.
- `components/home.tsx`: beranda dan petunjuk singkat.
- `components/student.tsx`: masuk peserta, petunjuk, halaman selesai, dan hasil.
- `components/quiz.tsx`: pilihan jawaban, navigasi, dan konfirmasi pengiriman.
- `components/admin.tsx`: pengaturan fase, rekap, analisis, dan ekspor CSV.
- `lib/model.ts`: tipe data, validasi penyimpanan, aturan sesi, dan skoring demo.

Tahap berikutnya adalah menghubungkan API, database, dan autentikasi admin sebelum deployment kegiatan ke Vercel.

## Peringkat dan identitas

Peringkat pendamping menggunakan nilai posttest tertinggi dari pasangan tes lengkap. Nilai seri berbagi peringkat (1, 1, 3); urutan nama hanya untuk tampilan. Peringkat sementara menjadi akhir saat sesi ditutup. CSV menyertakan nama, kelas, peringkat, nilai, dan jawaban; nama yang menyerupai formula dinetralkan.

Penyimpanan skema versi 2 tetap menggunakan key lama. Hasil demo berkode dari versi 1 dipertahankan dengan nama Peserta demo, tanpa otomatis mengaitkan ke nama siswa baru.

Nama Program Studi Magister Informatika dan Fakultas Teknologi Industri mengikuti proposal. Kedua logo bersumber dari paket identitas visual resmi UAD: https://uad.ac.id/identitas-visual-universitas/. Sumber aset dicatat di `public/branding/SOURCES.md`. Header terdiri dari logo bundar, teks prodi/fakultas dalam HTML, dan logotype UAD di kanan, bukan gambar banner.

## Rebuild tampilan

Seluruh halaman memakai desain yang konsisten: Nunito, latar terang, biru sebagai tindakan utama, aksen emas untuk hasil, dan Aiko sebagai teman belajar. Form di ponsel mendahulukan nama dan kelas; soal tampil satu per layar; hasil menonjolkan posttest. Dashboard mendahulukan sesi, lalu jumlah peserta dan rekap. Rata-rata ada pada tab Analisis soal.

Arah Anti-Slop During serta keputusan desain tercatat di `output/ui-concept/konsep-ui.md`; bukti pemeriksaan implementasi ada di `output/ui-concept/delivery-gate.md`.
