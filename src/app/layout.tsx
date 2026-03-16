import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Düğün Akademi | Satış Portalı",
  description: "Düğün Akademi Satış Ekibi Yönetim Portalı",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="antialiased" style={{ fontFamily: "'Chalet', sans-serif", backgroundColor: "#f1f5f9", color: "#1e293b" }}>
        {children}
      </body>
    </html>
  );
}
