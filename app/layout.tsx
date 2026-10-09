import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI di Sekitar Kita · Petualangan Belajar",
  description: "Kenali AI dan gunakan dengan bijak. Pretest dan posttest untuk siswa kelas V dan VI SDN Karangsari Yogyakarta.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
