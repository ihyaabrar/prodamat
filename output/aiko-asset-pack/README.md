# Aiko Asset Pack

Paket aset terpisah untuk **AI di Sekitar Kita**. Dibuat mengikuti robot Aiko, palet, dan bentuk aplikasi yang diperiksa pada 10 Oktober 2026. Kode aplikasi tidak diubah. Tidak berisi database, data siswa, logo UAD, kredensial, atau kode backend.

## Isi

- `svg/static/`: 6 pose Aiko diam, latar transparan.
- `svg/animated/`: 6 pose SVG dengan gerakan singkat dan dukungan `prefers-reduced-motion`. Putaran terbatas, tanpa JavaScript.
- `svg/icons/`: Detektif AI, data aman, tes selesai, dan belajar pola.
- `png/512/`: 6 robot + 4 ikon transparan. Lebar 512 px; tinggi robot 538 px.
- `png/1024/`: 6 robot transparan. Lebar 1024 px; tinggi robot 1075 px.
- `three/aiko.glb`: geometri 3D asli, material, dan 6 klip animasi. Bisa dipakai di Three.js, Blender, atau editor yang menerima glTF 2.0.
- `three/aiko-model.mjs`: sumber model prosedural yang bisa diubah ukuran, warna, atau pose.
- `three/mount-aiko.mjs`: viewer transparan dengan `setPose`, `play`, `pause`, `render`, dan `dispose`.
- `examples/`: contoh penggunaan terpisah; belum dipasang ke aplikasi.
- `theme.json`, `manifest.json`: palet dan daftar aset.

## Coba galeri

Di folder ini jalankan `node serve.mjs`, lalu buka **http://127.0.0.1:3004/**. Tidak perlu instalasi untuk melihat galeri: Three.js dan Nunito sudah disertakan untuk penggunaan offline. Internet hanya diperlukan jika ingin memasang dependency untuk regenerasi.

Jangan membuka galeri melalui `file://`; modul 3D perlu server HTTP. SVG dan PNG bisa langsung dibuka tanpa server.

## Pilih pose sesuai momen

| File 2D | Klip 3D | Penggunaan |
| --- | --- | --- |
| `aiko-idle` | `Idle` | Menunggu atau bantuan, gunakan diam selama soal |
| `aiko-wave` | `Wave` | Sapaan setelah masuk |
| `aiko-thinking` | `Think` | Petunjuk sebelum menjawab, bukan indikator benar/salah |
| `aiko-reading` | `Read` | Materi belajar di antara tes |
| `aiko-celebrate` | `Celebrate` | Setelah pengiriman tes berhasil |
| `aiko-reassure` | `Reassure` | Mendorong anak melengkapi jawaban |

Animasi SVG hanya diputar 1–3 kali saat file dimuat. Untuk memutar ulang, muat ulang elemen gambar dengan key baru. SVG animasi tetap tampil sebagai pose diam di perangkat yang mengurangi gerakan. PNG selalu diam. Klip model 3D bisa diulang oleh aplikasi pemakai, tetapi viewer bawaan sengaja memutar sekali.

## Pasang SVG atau PNG nanti

Salin **hanya aset yang dipilih** ke folder publik aplikasi. Contoh biasa:

```html
<img src="/aiko/aiko-wave.svg" width="200" height="210" alt="Aiko menyapa" />
```

Untuk gambar dekoratif di samping teks yang sudah menjelaskan maknanya, gunakan `alt=""`. Hindari memuat banyak salinan SVG yang sama secara inline dengan ID yang sama; `<img>` mengisolasi ID dan animasinya. Tidak ada font atau gambar eksternal di dalam SVG.

## Pasang 3D nanti

`examples/embed.html` bekerja langsung pada server galeri. `examples/Aiko3D.tsx.example` memberi contoh lifecycle React, termasuk cleanup. Ini file contoh agar tidak ikut dikompilasi sebagai kode aplikasi.

Untuk proyek bundler, instal **three@0.186.1** dan, bila memakai TypeScript, **@types/three**. Salin dua modul `three/*.mjs` beserta fallback SVG ke lokasi yang sesuai; jangan salin seluruh folder vendor ke bundler. Untuk HTML biasa gunakan import map seperti galeri ini.

```js
import { mountAiko } from './three/mount-aiko.mjs';
const aiko = mountAiko(document.querySelector('#aiko'), {
  pose: 'Wave', animate: false, fallback: '/aiko/aiko-wave.svg'
});
if (aiko.available) {
  aiko.setPose('Celebrate', true);
  // aiko.pause(); aiko.play();
}
// Saat komponen dilepas:
aiko.dispose();
```

Container harus memiliki ukuran nyata, misalnya `width: 240px; height: 260px`. Viewer memakai kamera ortografis, latar alpha, DPR maksimal 1.5, jeda saat tidak terlihat/tab tidak aktif, dan pose diam untuk reduced motion. WebGL 2 tidak tersedia akan memakai SVG. Posisi depan model adalah +Z, sumbu atas +Y; tinggi sekitar 3.6 unit. Model tidak memerlukan tekstur atau jaringan. Material putih kebiruan matte, bukan logam mengilap.

GLB menyimpan node transform dengan AnimationClips, bukan skeleton humanoid. Gunakan nama klip persis sesuai tabel. Loading GLB sendiri dapat menggunakan `GLTFLoader` dan `AnimationMixer`. Semua gerakan dan buku sudah tersimpan di GLB.

## Regenerasi & pemeriksaan

```text
npm install
npm run generate
npm run export:3d
npm run verify
```

Font sudah disertakan; regenerasi mempertahankan font yang ada jika proyek induk tidak tersedia. Paket ini bisa dipindahkan ke folder lain. `tools/verify.mjs` memeriksa PNG transparan, struktur SVG, berkas vendor, validitas GLB melalui glTF Validator, dan pemutaran keenam klip dari GLB yang dimuat ulang.

Rujukan API: [Three.js GLTFExporter](https://threejs.org/docs/pages/GLTFExporter.html), [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html). Three.js 0.186.1 berlisensi MIT; Nunito berlisensi SIL OFL. Lisensinya ada di `vendor/`. Aset Aiko turunan karakter pada aplikasi pengguna, dibuat untuk proyek ini; tidak memakai logo atau karakter pihak ketiga tambahan.
