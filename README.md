# AI di Sekitar Kita

Frontend pretest dan posttest Prodamat untuk siswa kelas V dan VI SDN Karangsari Yogyakarta. Dibangun dengan Next.js, React, TypeScript, CSS responsif, ikon Lucide, font Nunito lokal, serta maskot SVG.

## Menjalankan

```sh
npm install
npx vercel env pull .env.local
npm run dev
```

Buat juga `.env.development.local` (tidak ikut git) agar uji lokal tidak menyentuh data kegiatan asli:

```sh
PRODAMAT_ACTIVITY_ID=uji-lokal
PENDAMPING_PASSWORD=<kata sandi uji lokal>
```

Perintah lain: `npm run typecheck`, `npm run build`, `npm run db:migrate` (menerapkan `db/schema.sql`, idempoten), dan `npm run test:api` (26 uji alur API terhadap `npm run dev`; hanya jalan bila `PRODAMAT_ACTIVITY_ID` diawali `uji`, datanya dihapus di akhir).

## Mencoba alur lengkap

1. Pada beranda klik **Mulai petualangan**, isi nama lengkap, pilih kelas **5** atau **6**. Nama dan kelas yang sama di perangkat mana pun melanjutkan peserta yang sama.
2. Buka pretest, coba latihan, lalu jawab sepuluh soal. Setiap pilihan langsung disimpan ke server (label Menyimpan, Tersimpan, atau Gagal menyimpan dengan tombol Coba lagi).
3. Periksa lalu kirim. Nilai dihitung server; nilai dan pembahasan baru tampil setelah posttest.
4. Buka `/pendamping` di perangkat lain, masuk dengan kata sandi pendamping, pilih **Belajar** lalu **Posttest**. Perangkat siswa mengikuti dalam sekitar 8 detik selama halamannya terbuka.
5. Selesaikan posttest, lalu lihat nilai dan pembahasan kedua tes.
6. Dashboard diperbarui otomatis setiap 10 detik. Coba filter kelas, pencarian, peringkat, analisis soal, dan unduh CSV. **Lihat data contoh** memakai data simulasi dari server tanpa menyentuh data kegiatan.

## Backend dan keamanan

- Data di Neon Postgres (`db/schema.sql`): `activity` (tahap kegiatan), `participant`, `attempt` (10 jawaban, waktu kirim, nilai), `session`, `login_failure`.
- API ada di `app/api/*` (Route Handlers). Logika server di `lib/server/`; kunci jawaban, pembahasan, dan skoring hanya di `lib/server/content.ts` (ditandai `server-only`). Soal untuk siswa dikirim tanpa kunci.
- Sesi memakai token acak di cookie HttpOnly; database hanya menyimpan hash token. Siswa 7 hari, pendamping 12 jam.
- Pendamping masuk dengan `PENDAMPING_PASSWORD` (variabel lingkungan di Vercel). Setelah 8 kali salah dalam 15 menit dari IP yang sama, percobaan ditolak sementara.
- Semua permintaan yang mengubah data harus berasal dari origin aplikasi sendiri.
- Menyimpan dan mengirim jawaban diperiksa dalam satu pernyataan SQL: tahap harus cocok, tes belum dikirim, posttest butuh pretest terkirim, dan kiriman harus lengkap 10 jawaban. Kiriman ganda tidak mengubah nilai.
- `PRODAMAT_ACTIVITY_ID` memisahkan data per kegiatan (default `prodamat-2026`).
- Rata-rata dan selisih dihitung dari peserta dengan pasangan pretest dan posttest lengkap. Kedua instrumen berbeda; perubahan nilai adalah ringkasan deskriptif.

## Sumber soal

Seluruh 20 soal dan kunci di `lib/questions.json` diimpor dari `Pretest_Posttest_Pelatihan_AI_di_Sekitar_Kita.docx` yang diberikan pengguna. Skor adalah 1 poin untuk setiap jawaban benar, maksimal 10. Penjelasan pembahasan ditambahkan di `lib/model.ts`.

## Struktur

- `app/`: layout, halaman peserta, halaman pendamping, dan CSS.
- `components/experience.tsx`: pengendali alur siswa, sinkronisasi dengan API, dan status simpan.
- `components/home.tsx`: beranda dan petunjuk singkat.
- `components/student.tsx`: masuk peserta, petunjuk, halaman selesai, dan hasil.
- `components/quiz.tsx`: pilihan jawaban, navigasi, dan konfirmasi pengiriman.
- `components/admin.tsx`: masuk pendamping, pengaturan fase, rekap, analisis, dan ekspor CSV.
- `lib/model.ts`: tipe dan aturan yang aman untuk browser. `lib/api.ts`: pemanggil API.
- `lib/server/`: koneksi database, sesi, konten soal berkunci, dan query.
- `db/schema.sql`, `scripts/`: skema, migrasi, dan uji API.

## Deployment

- Repo: https://github.com/ihyaabrar/prodamat (privat). Setiap push ke `main` di-deploy otomatis oleh proyek Vercel `ihyaabrars-projects/prodamat`.
- Region fungsi `sin1` (Singapura) diatur di `vercel.json`, sama dengan database Neon `prodamat-db`.
- Variabel database (`DATABASE_URL` dan lainnya) dikelola integrasi Neon di Vercel. `PENDAMPING_PASSWORD` diisi sendiri oleh pemilik lewat `npx vercel env add PENDAMPING_PASSWORD production`. Untuk lokal: `npx vercel env pull .env.local`. Jangan commit file `.env*`.
- Paket Hobby hanya men-deploy commit yang penulisnya terhubung ke akun GitHub pemilik. Repo ini memakai email noreply GitHub di konfigurasi git lokal.

## Peringkat dan identitas

Peringkat pendamping menggunakan nilai posttest tertinggi dari pasangan tes lengkap. Nilai seri berbagi peringkat (1, 1, 3); urutan nama hanya untuk tampilan. Peringkat sementara menjadi akhir saat sesi ditutup. CSV menyertakan nama, kelas, peringkat, nilai, dan jawaban; nama yang menyerupai formula dinetralkan.


Nama Program Studi Magister Informatika dan Fakultas Teknologi Industri mengikuti proposal. Kedua logo bersumber dari paket identitas visual resmi UAD: https://uad.ac.id/identitas-visual-universitas/. Sumber aset dicatat di `public/branding/SOURCES.md`. Header terdiri dari logo bundar, teks prodi/fakultas dalam HTML, dan logotype UAD di kanan, bukan gambar banner.

## Rebuild tampilan

Seluruh halaman memakai desain yang konsisten: Nunito, latar terang, biru sebagai tindakan utama, aksen emas untuk hasil, dan Aiko sebagai teman belajar. Form di ponsel mendahulukan nama dan kelas; soal tampil satu per layar; hasil menonjolkan posttest. Dashboard mendahulukan sesi, lalu jumlah peserta dan rekap. Rata-rata ada pada tab Analisis soal.

Arah Anti-Slop During serta keputusan desain tercatat di `output/ui-concept/konsep-ui.md`; bukti pemeriksaan implementasi ada di `output/ui-concept/delivery-gate.md`.
