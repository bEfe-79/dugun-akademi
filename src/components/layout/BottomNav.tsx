"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Profile } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  match: (p: string) => boolean;
}

export default function BottomNav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Desktop'ta hiç render etme
  if (isDesktop) return null;

  const NAV: NavItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      match: (p) => p === "/dashboard",
      icon: (active) => (
        <div style={{ width: 18, height: 13, border: `2.5px solid ${active ? "#db0962" : "#94a3b8"}`, borderRadius: 3 }} />
      ),
    },
    {
      href: "/school/trainings",
      label: "Satış Okulu",
      match: (p) => p.startsWith("/school"),
      icon: () => <span style={{ fontSize: 18, lineHeight: 1 }}>🎓</span>,
    },
    {
      href: "/logs",
      label: "Günlük",
      match: (p) => p.startsWith("/logs"),
      icon: () => <span style={{ fontSize: 18, lineHeight: 1 }}>📝</span>,
    },
    {
      href: "/library",
      label: "Kütüphane",
      match: (p) => p.startsWith("/library"),
      icon: () => <span style={{ fontSize: 18, lineHeight: 1 }}>📚</span>,
    },
  ];

  const adminItem: NavItem = {
    href: "/admin",
    label: "Admin",
    match: (p) => p.startsWith("/admin"),
    icon: () => <span style={{ fontSize: 18, lineHeight: 1 }}>⚙️</span>,
  };

  const items = profile?.role === "admin" ? [...NAV, adminItem] : NAV;

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      background: "#fff",
      display: "grid",
      gridTemplateColumns: `repeat(${items.length}, 1fr)`,
      padding: "8px 4px 16px",
      boxShadow: "0 -2px 20px rgba(0,0,0,.07)",
    }}>
      {items.map(item => {
        const active = item.match(pathname);
        return (
          <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 14,
                background: active ? "#fce7f0" : "#f8fafc",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background .15s",
              }}>
                {item.icon(active)}
              </div>
              <p style={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                color: active ? "#db0962" : "#94a3b8",
                transition: "color .15s",
              }}>
                {item.label}
              </p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
