import Image from "next/image";
import Link from "next/link";
import { HelpCircle } from "lucide-react";

export function InstitutionHeader({ admin, onHelp, onHome }: { admin: boolean; onHelp: () => void; onHome: () => void }) {
  return <header className="site-header">
    <div className="institution-header content-width">
      <Link href="/" onClick={onHome} className="institution-identity" aria-label="AI di Sekitar Kita, beranda">
        <Image src="/branding/uad.png" width={1683} height={1683} className="institution-seal" alt="Lambang Universitas Ahmad Dahlan" priority sizes="(max-width: 600px) 42px, 68px"/>
        <span className="institution-copy"><strong>Program Studi Magister Informatika</strong><span>Fakultas Teknologi Industri</span></span>
      </Link>
      <Image src="/branding/uad-wordmark.png" width={2296} height={330} className="institution-wordmark" alt="UAD Universitas Ahmad Dahlan" priority sizes="(max-width: 600px) 104px, 210px"/>
    </div>
    <div className="navigation-row content-width">
      <span className="activity-name">AI di Sekitar Kita</span>
      <nav aria-label="Navigasi utama">
        <Link href="/" onClick={onHome} className={`nav-link ${!admin ? "active" : ""}`} aria-current={!admin ? "page" : undefined}>Beranda</Link>
        <Link href="/pendamping" className={`nav-link ${admin ? "active" : ""}`} aria-current={admin ? "page" : undefined}>Pendamping</Link>
        <button className="nav-link" onClick={onHelp}><HelpCircle size={17} aria-hidden="true"/>Bantuan</button>
      </nav>
    </div>
  </header>;
}
