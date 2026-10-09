# Tahap backend Prodamat

Status 9 Oktober 2026: backend selesai dibangun dan diuji (Neon sin1, Route Handlers, sesi cookie, login pendamping). Lihat README bagian Backend dan keamanan. Ekspor CSV dibuat di dashboard dari data rekap, bukan endpoint terpisah.

## Hasil yang dituju

Siswa mengisi nama dan kelas dari Chromebook masing-masing. Jawaban tersimpan di database yang sama. Pendamping masuk ke dashboard, mengatur tahap kegiatan, memantau hasil, melihat peringkat posttest, dan mengunduh rekap. Nilai dihitung server setelah jawaban dikirim.

## Arsitektur

- Pertahankan Next.js dan desain frontend yang sudah disepakati.
- Gunakan Next.js Route Handlers untuk API peserta dan pendamping.
- Rekomendasi penyimpanan: Neon Postgres melalui Vercel Marketplace. Periksa paket, region, dan akses yang tersedia sebelum provisioning. Database ini khusus Prodamat, terpisah dari proyek lain.
- Gunakan region database dekat region fungsi; tentukan pilihan nyata dari integrasi saat tersedia.
- Jangan menyimpan data kegiatan pada filesystem fungsi atau mengganti database bersama dengan localStorage.
- Pisahkan soal publik dari kunci jawaban dan penjelasan. Kunci tidak masuk bundel browser; pembahasan diberikan setelah kedua tes selesai.

## Data dan aturan

| Data | Isi dan aturan |
|---|---|
| Kegiatan | ID kegiatan, fase pretest/belajar/posttest/ditutup, waktu perubahan. |
| Peserta | ID internal, nama tampilan, nama ternormalisasi, kelas V/VI, ID kegiatan, waktu daftar. Nama 2–60 karakter. |
| Percobaan tes | ID peserta, jenis tes, 10 pilihan nullable, revisi, waktu kirim, skor server 0–10. Satu percobaan per peserta dan jenis tes. |
| Sesi akses | Token cookie yang diverifikasi server, peran peserta/pendamping, kedaluwarsa. Kredensial pendamping tidak pernah dikirim ke browser. |

Nama dan kelas yang sama melanjutkan peserta yang sudah terdaftar dalam kegiatan yang sama, mengikuti aturan frontend. Nama dengan kelas berbeda tetap terpisah. ID internal tidak perlu diisi anak.

Posttest memerlukan pretest terkirim dan fase posttest terbuka. Setiap kiriman lengkap hanya diterima sekali; pengulangan permintaan mengembalikan hasil yang sama. Jawaban atau fase tidak boleh berubah sesudah kiriman diterima. Validasi fase, kelengkapan, dan pengiriman menggunakan transaksi agar permintaan bersamaan tidak menggandakan hasil.

Peringkat berdasarkan skor posttest dari kedua tes lengkap. Nilai seri berbagi peringkat 1, 1, 3. Filter tidak menghitung ulang peringkat. Rata-rata memakai pasangan tes lengkap. Data demo lokal tidak otomatis dianggap hasil kegiatan asli atau diunggah ke database.

## Kontrak API

| Permintaan | Fungsi |
|---|---|
| POST /api/peserta | Validasi nama/kelas, daftar atau lanjutkan peserta, buat sesi peserta. |
| GET /api/peserta/saya | Fase kegiatan dan progres peserta yang memiliki sesi. |
| GET /api/soal?jenis=pretest | Soal dan opsi tanpa kunci, dengan akses/fase yang diperiksa. |
| PATCH /api/jawaban | Simpan pilihan peserta; validasi indeks, opsi, fase, revisi, dan status kirim. |
| POST /api/kirim | Validasi 10 jawaban, hitung skor server, catat kiriman secara atomik. |
| GET /api/hasil | Nilai dan pembahasan peserta sendiri setelah kedua tes selesai. |
| POST /api/pendamping/masuk | Verifikasi akses pendamping, cookie HttpOnly, pembatasan percobaan masuk. |
| POST /api/pendamping/keluar | Akhiri sesi pendamping. |
| GET /api/pendamping/rekap | Peserta, hasil, peringkat, dan analisis untuk pendamping. |
| PATCH /api/pendamping/fase | Ubah tahap kegiatan setelah otorisasi pendamping. |
| GET /api/pendamping/ekspor | CSV hasil kegiatan, dengan escaping dan perlindungan formula. |

Permintaan mutasi memeriksa origin dan sesi. Rekap seluruh siswa tidak diberikan oleh endpoint peserta. Nama, kelas, token, dan isi kredensial tidak ditulis ke log diagnostik.

## Perubahan perilaku frontend

- Tetap satu soal per layar, pilihan besar, tanpa batas waktu.
- Penyimpanan menunjukkan status proses, tersimpan di server, atau gagal dengan tombol coba lagi. Tombol kirim menunggu penyimpanan selesai.
- Draft lokal boleh membantu saat koneksi terputus, tetapi tidak disebut berhasil tersimpan bersama sebelum respons server berhasil.
- Pembaruan fase dan rekap dilakukan berkala selama halaman aktif; permintaan dihentikan saat tab tidak terlihat.
- Dashboard pendamping memiliki layar masuk dan tombol keluar; siswa tetap memakai nama dan kelas.
- Simulasi tetap diberi label terpisah dan tidak mengubah hasil kegiatan.

## Urutan penyelesaian

1. Pulihkan koneksi tim yang dikonfirmasi dan verifikasi izin proyek/integrasi.
2. Buat atau tautkan proyek khusus Prodamat; provision database melalui integrasi yang nyata.
3. Tarik environment secara aman; verifikasi nama variabel tanpa mencetak nilainya.
4. Buat skema, migrasi, sesi, dan API dengan validasi serta skoring server.
5. Hubungkan frontend dan pesan status penyimpanan ke API.
6. Uji dua peserta, simpan/lanjut, pergantian fase, kirim ganda, akses dashboard, hasil seri, filter, serta CSV pada database sebenarnya.
7. Build produksi, deploy preview Vercel, verifikasi URL preview, kemudian selesaikan deployment kegiatan.

## Kriteria selesai

- Dua perangkat membaca fase yang sama; jawaban tidak bergantung pada browser pendamping.
- Refresh dan daftar kembali dengan nama/kelas yang sama melanjutkan progres.
- Peserta tidak dapat membuka rekap pendamping atau mengirim skor buatan sendiri.
- Pretest tidak langsung membocorkan kunci; hasil lengkap diberikan setelah posttest.
- Kiriman ganda dan pergantian fase bersamaan ditangani secara konsisten.
- Nilai, peringkat, analisis, dan CSV sesuai jawaban yang tersimpan.
- Build dan pengujian database/API/browser lulus; URL deployment dapat dibuka.

Referensi: https://vercel.com/docs/storage dan https://vercel.com/docs/integrations/install-an-integration. Panduan lokal Vercel Bootstrap mengharuskan linkage dan environment diverifikasi sebelum migrasi atau menjalankan backend yang bergantung pada sumber daya tersebut.
