import Link from "next/link";
import { Aiko } from "@/components/robot";

// Alamat yang tidak ada (misalnya salah ketik di Chromebook): arahkan anak kembali ke Beranda dengan bahasa yang ramah.
export default function NotFound() {
  return <main className="loading-screen" id="main">
    <div>
      <Aiko pose="reassure" className="state-aiko"/>
      <h1 className="state-title">Halaman ini tidak ditemukan.</h1>
      <p>Mungkin alamatnya salah ketik. Yuk, kembali ke Beranda.</p>
      <Link className="button primary" href="/">Ke Beranda</Link>
    </div>
  </main>;
}
