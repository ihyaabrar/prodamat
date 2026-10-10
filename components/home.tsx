"use client";

import { useState } from "react";
import { ArrowRight, Check, ClipboardCheck, ClipboardList, MousePointerClick, PencilLine, Send } from "lucide-react";
import type { AikoPose } from "@/lib/aiko-art";
import { AikoIcon } from "./robot";
import { Aiko3D } from "./aiko-3d";

// Ketukan pada Aiko memutar gerakan ceria dan mengganti kalimat sapaan secara bergiliran.
const TAPS: { pose: AikoPose; line: React.ReactNode }[] = [
  { pose: "wave", line: <><strong>Hai, aku Aiko!</strong> Aku menemanimu belajar hari ini. Belum tahu jawabannya? Tidak apa-apa.</> },
  { pose: "celebrate", line: <><strong>Hihi, geli!</strong> Yuk, klik Mulai petualangan.</> },
  { pose: "thinking", line: <><strong>Tahukah kamu?</strong> AI ada di peta, kamera, dan rekomendasi video.</> },
  { pose: "reading", line: <><strong>Ayo belajar!</strong> Baca soalnya pelan-pelan, ya.</> },
  { pose: "reassure", line: <><strong>Kamu pasti bisa!</strong> Kakak pendamping siap membantu.</> },
];

export function Home({ onStart, returning, aiko3d }: { onStart: () => void; returning: boolean; aiko3d: boolean }) {
  const [tap, setTap] = useState(0);
  const current = TAPS[tap % TAPS.length];
  return <>
    <section className="hero content-width" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="hero-context">Kelas 5 & 6 · SDN Karangsari Yogyakarta · 13 Oktober 2026</p>
        <h1 id="hero-title">AI di Sekitar Kita</h1>
        <p className="hero-description">Kenali teknologi pintar di sekitarmu, lalu belajar memakainya dengan bijak.</p>
        <div className="hero-actions">
          <button className="button sun hero-cta" onClick={onStart}>{returning ? "Lanjutkan petualangan" : "Mulai petualangan"}<ArrowRight size={22} strokeWidth={2.5}/></button>
          <a className="hero-link" href="#cara-bermain">Lihat cara bermain</a>
        </div>
        <p className="hero-reassurance">10 soal setiap tes · Tidak ada batas waktu</p>
      </div>
      <figure className="hero-art">
        <figcaption className="hero-bubble" aria-live="polite">{current.line}</figcaption>
        <Aiko3D pose={current.pose} replay={tap} enabled={aiko3d} onTap={() => setTap(tap + 1)} framing="bust" tapLabel="Ketuk Aiko untuk mendengar kalimat lain"/>
      </figure>
    </section>

    <section className="journey-section content-width" aria-labelledby="journey-title">
      <h2 id="journey-title">Petualangan hari ini</h2>
      <ol className="journey">
        <li className="stop"><span className="stop-token" aria-hidden="true"><ClipboardList size={26} strokeWidth={2.3}/></span><div><span className="stop-step">Langkah 1 · Pretest</span><h3>Apa yang sudah kamu tahu?</h3><p>10 soal sebelum belajar.</p></div></li>
        <li className="stop"><span className="stop-token art" aria-hidden="true"><AikoIcon name="ai-detective"/></span><div><span className="stop-step">Langkah 2 · Belajar</span><h3>Jadi Detektif AI</h3><p>Materi dan permainan bersama kakak pendamping.</p></div></li>
        <li className="stop"><span className="stop-token" aria-hidden="true"><ClipboardCheck size={26} strokeWidth={2.3}/></span><div><span className="stop-step">Langkah 3 · Posttest</span><h3>Apa yang kamu pelajari?</h3><p>10 soal setelah pendamping membukanya.</p></div></li>
      </ol>
    </section>

    <section id="cara-bermain" className="how-section content-width" aria-labelledby="how-title">
      <div className="how-copy">
        <h2 id="how-title">Cara bermain</h2>
        <ol className="how-steps">
          <li><PencilLine size={22} strokeWidth={2.3} aria-hidden="true"/><span><strong>Tulis nama dan pilih kelas.</strong> Pakai nama yang sama untuk kedua tes.</span></li>
          <li><MousePointerClick size={22} strokeWidth={2.3} aria-hidden="true"/><span><strong>Klik satu jawaban.</strong> Pilihanmu boleh diubah.</span></li>
          <li><Send size={22} strokeWidth={2.3} aria-hidden="true"/><span><strong>Periksa, lalu kirim.</strong> Semua soal harus dijawab dulu.</span></li>
        </ol>
      </div>
      <div className="how-demo" aria-hidden="true">
        <span className="how-demo-label">Contoh (bukan soal tes): Apa warna langit saat cerah?</span>
        <div className="answer-option"><span className="option-letter">A</span><span className="option-text">Hijau</span></div>
        <div className="answer-option selected"><span className="option-letter">B</span><span className="option-text">Biru</span><span className="option-check"><Check size={18} strokeWidth={3}/></span></div>
        <span className="how-demo-note">Jawaban yang kamu klik berubah biru.</span>
      </div>
    </section>
  </>;
}
