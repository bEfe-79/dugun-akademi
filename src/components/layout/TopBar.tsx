"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { ROLE_LABELS } from "@/types";

const NAV = [
  { href: "/dashboard",        label: "Dashboard" },
  { href: "/school/trainings", label: "Satış Okulu" },
  { href: "/logs",             label: "Satış Günlüğü" },
  { href: "/library",          label: "Satış Kütüphanesi" },
];
const ADMIN_NAV = [{ href: "/admin", label: "Admin Paneli" }];

export default function TopBar({ profile }: { profile: Profile | null }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="shrink-0 h-14 flex items-center justify-between px-4 md:px-8 border-b"
        style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", position: "relative", zIndex: 10 }}>
        <div className="flex items-center gap-3 md:hidden">
          <button onClick={() => setMenuOpen(true)} aria-label="Menüyü aç"
            style={{ width: 36, height: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 8, border: "none", background: "none", cursor: "pointer", padding: 0 }}>
            <span style={{ width: 20, height: 2, borderRadius: 2, backgroundColor: "#64748b", display: "block" }} />
            <span style={{ width: 20, height: 2, borderRadius: 2, backgroundColor: "#64748b", display: "block" }} />
            <span style={{ width: 20, height: 2, borderRadius: 2, backgroundColor: "#64748b", display: "block" }} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,171,170,0.2)", flexShrink: 0 }}>
              {profile?.team_logo_url
                ? <img src={profile.team_logo_url} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <img src="/logo.png" alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
            </div>
            <span style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
              {profile?.team_name ?? "Düğün Akademi"}
            </span>
          </div>
        </div>

        <p className="hidden md:block" style={{ color: "#64748b", fontSize: 14 }}>
          Merhaba, <span style={{ color: "#1e293b", fontWeight: 500 }}>{profile?.full_name}</span>
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="hidden sm:flex" style={{ alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, border: "0.5px solid #e2e8f0", fontSize: 12, color: "#64748b", backgroundColor: "#f8fafc" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#00abaa", display: "inline-block" }} />
            {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
          </span>
          <button onClick={logout} style={{ color: "#64748b", fontSize: 14, padding: "6px 12px", borderRadius: 8, background: "none", border: "none", cursor: "pointer" }}>
            Çıkış →
          </button>
        </div>
      </header>

      {/* Overlay */}
      <div onClick={() => setMenuOpen(false)}
        style={{ position: "fixed", inset: 0, zIndex: 40, backgroundColor: "rgba(0,0,0,0.45)", opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? "auto" : "none", transition: "opacity 0.25s ease" }} />

      {/* Drawer */}
      <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50, width: 280, backgroundColor: "#ffffff", boxShadow: "4px 0 24px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", transform: menuOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.28s cubic-bezier(0.22,1,0.36,1)" }}
        className="md:hidden">

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px", borderBottom: "0.5px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,171,170,0.25)", flexShrink: 0 }}>
              {profile?.team_logo_url
                ? <img src={profile.team_logo_url} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <img src="/logo.png" alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
            </div>
            <div>
              <p style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 14, lineHeight: 1.2 }}>
                {profile?.team_name ?? "Düğün Akademi"}
              </p>
              <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>Satış Portalı</p>
            </div>
          </div>
          <button onClick={() => setMenuOpen(false)} aria-label="Menüyü kapat"
            style={{ width: 32, height: 32, borderRadius: 8, border: "0.5px solid #e2e8f0", background: "#f8fafc", fontSize: 18, color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ×
          </button>
        </div>

        <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
          <p style={{ padding: "0 12px", marginBottom: 8, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Menü</p>
          {NAV.map(item => {
            const active = item.href === "/library"
              ? pathname.startsWith("/library")
              : item.href === "/school/trainings"
              ? pathname.startsWith("/school")
              : pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                style={{ display: "flex", alignItems: "center", padding: "12px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none", backgroundColor: active ? "#e0f7f7" : "transparent", color: active ? "#00abaa" : "#475569", border: active ? "1px solid #b2eded" : "1px solid transparent", transition: "all 0.15s" }}>
                {item.label}
              </Link>
            );
          })}

          {profile?.role === "admin" && (
            <>
              <p style={{ padding: "0 12px", marginTop: 20, marginBottom: 8, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Yönetim</p>
              {ADMIN_NAV.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  style={{ display: "flex", alignItems: "center", padding: "12px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none", backgroundColor: pathname.startsWith(item.href) ? "#e0f7f7" : "transparent", color: pathname.startsWith(item.href) ? "#00abaa" : "#475569", border: pathname.startsWith(item.href) ? "1px solid #b2eded" : "1px solid transparent", transition: "all 0.15s" }}>
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "0.5px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, overflow: "hidden", backgroundColor: "#e0f7f7", border: "2px solid #00abaa", display: "flex", alignItems: "center", justifyContent: "center", color: "#00abaa", fontWeight: 700, fontSize: 14 }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt={profile?.full_name ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (profile?.full_name?.[0] ?? "?")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#1e293b", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.full_name ?? "—"}</p>
              <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 1 }}>{ROLE_LABELS[profile?.role ?? "staff"] ?? profile?.role}</p>
            </div>
            <button onClick={logout} style={{ flexShrink: 0, color: "#ef4444", fontSize: 13, background: "none", border: "0.5px solid #fecaca", borderRadius: 8, cursor: "pointer", padding: "6px 10px" }}>
              Çıkış
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
