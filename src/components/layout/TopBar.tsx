"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
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

  function isActive(href: string) {
    if (href === "/library") return pathname.startsWith("/library");
    if (href === "/school/trainings") return pathname.startsWith("/school");
    return pathname === href;
  }

  return (
    <>
      <header className="shrink-0 h-14 flex items-center justify-between px-4 md:px-8"
        style={{ backgroundColor: "#ffffff", borderBottom: "0.5px solid #f1f5f9", position: "relative", zIndex: 10, boxShadow: "0 1px 0 #f1f5f9" }}>

        {/* Mobil: hamburger + logo merkez */}
        <div className="flex items-center gap-3 md:hidden">
          <button onClick={() => setMenuOpen(true)} aria-label="Menüyü aç"
            style={{ width: 36, height: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 8, border: "none", background: "none", cursor: "pointer", padding: 0 }}>
            <span style={{ width: 22, height: 2, borderRadius: 2, backgroundColor: "#475569", display: "block" }} />
            <span style={{ width: 15, height: 2, borderRadius: 2, backgroundColor: "#475569", display: "block" }} />
            <span style={{ width: 22, height: 2, borderRadius: 2, backgroundColor: "#475569", display: "block" }} />
          </button>
        </div>

        {/* Mobil: Logo merkez */}
        <div className="flex md:hidden items-center gap-2 absolute left-1/2" style={{ transform: "translateX(-50%)" }}>
          <img src="/logo.png" alt="Düğün Akademi"
            style={{ width: 28, height: 28, borderRadius: 8, objectFit: "contain", backgroundColor: "#f8fafc", padding: 2 }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <span style={{ fontWeight: 800, color: "#1e293b", fontSize: 13, letterSpacing: "-0.2px" }}>
            Düğün Akademi
          </span>
        </div>

        {/* Desktop: greeting */}
        <div className="hidden md:block">
          <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 2 }}>İyi günler</p>
          <p style={{ color: "#1e293b", fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px" }}>
            Selam {profile?.full_name} 👋
          </p>
        </div>

        {/* Sağ: tarih + çıkış */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="hidden sm:flex" style={{ alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 99, fontSize: 11, color: "#64748b", backgroundColor: "#f8fafc", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#00abaa", display: "inline-block" }} />
            {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
          </span>
          {/* Mobil: avatar + çıkış */}
          <div className="flex md:hidden items-center gap-2">
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#00abaa,#007a7a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,171,170,.3)" }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (profile?.full_name?.[0] ?? "?")}
            </div>
          </div>
          <button onClick={logout}
            style={{ color: "#64748b", fontSize: 14, padding: "6px 12px", borderRadius: 8, background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
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

        {/* Drawer header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px", borderBottom: "0.5px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="Düğün Akademi"
              style={{ width: 36, height: 36, borderRadius: 10, objectFit: "contain", backgroundColor: "#f8fafc", padding: 3, flexShrink: 0 }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <div>
              <p style={{ fontWeight: 800, color: "#1e293b", fontSize: 14, letterSpacing: "-0.2px" }}>
                {profile?.team_name ?? "Düğün Akademi"}
              </p>
              <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>Satış Portalı</p>
            </div>
          </div>
          <button onClick={() => setMenuOpen(false)} aria-label="Kapat"
            style={{ width: 32, height: 32, borderRadius: 8, border: "0.5px solid #e2e8f0", background: "#f8fafc", fontSize: 18, color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ×
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
          <p style={{ padding: "0 12px", marginBottom: 8, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Menü</p>
          {NAV.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", borderRadius: 12, overflow: "hidden", backgroundColor: active ? "#fef2f5" : "transparent" }}>
                  <div style={{ width: 4, alignSelf: "stretch", flexShrink: 0, backgroundColor: active ? "#db0962" : "transparent", borderRadius: "0 3px 3px 0", minHeight: 44 }} />
                  <div style={{ flex: 1, padding: "12px 14px", fontSize: 14, fontWeight: active ? 700 : 500, color: active ? "#db0962" : "#475569" }}>
                    {item.label}
                  </div>
                </div>
              </Link>
            );
          })}

          {profile?.role === "admin" && (
            <>
              <p style={{ padding: "0 12px", marginTop: 16, marginBottom: 8, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Yönetim</p>
              {ADMIN_NAV.map(item => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{ textDecoration: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", borderRadius: 12, overflow: "hidden", backgroundColor: active ? "#fef2f5" : "transparent" }}>
                      <div style={{ width: 4, alignSelf: "stretch", flexShrink: 0, backgroundColor: active ? "#db0962" : "transparent", borderRadius: "0 3px 3px 0", minHeight: 44 }} />
                      <div style={{ flex: 1, padding: "12px 14px", fontSize: 14, fontWeight: active ? 700 : 500, color: active ? "#db0962" : "#475569" }}>
                        {item.label}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: "0.5px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: "linear-gradient(135deg,#00abaa,#007a7a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, boxShadow: "0 2px 8px rgba(0,171,170,.3)" }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (profile?.full_name?.[0] ?? "?")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#1e293b", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.full_name ?? "—"}</p>
              <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 1 }}>{ROLE_LABELS[profile?.role ?? "staff"] ?? profile?.role}</p>
            </div>
            <button onClick={logout} style={{ flexShrink: 0, color: "#ef4444", fontSize: 13, background: "none", border: "0.5px solid #fecaca", borderRadius: 8, cursor: "pointer", padding: "6px 10px", fontWeight: 600 }}>
              Çıkış
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
