import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Düğün Akademi | Satış Portalı",
  description: "Düğün Akademi Satış Ekibi Yönetim Portalı",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="bg-surface text-stone-200 font-body antialiased">
        {children}
      </body>
    </html>
  );
}
