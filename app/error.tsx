"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Aiko } from "@/components/robot";

// Pengganti layar galat bawaan Next.js (berbahasa Inggris dan menakutkan bagi anak). Jawaban sudah tersimpan di
// server atau di perangkat, jadi anak cukup menekan Coba lagi.
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="loading-screen" id="main" role="alert">
    <div>
      <Aiko pose="reassure" className="state-aiko"/>
      <h1 className="state-title">Ups, halaman ini tersendat.</h1>
      <p>Jawabanmu tetap aman. Tekan Coba lagi. Kalau masih muncul, panggil kakak pendamping.</p>
      <button className="button primary" onClick={() => retry()}><RotateCcw size={18}/>Coba lagi</button>
    </div>
  </main>;
}
