"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { ROLE_LABELS } from "@/types";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/logs",      label: "Satış Günlüğü" },
  { href: "/library",   label: "Satış Kütüphanesi" },
];
const ADMIN_NAV = [{ href: "/admin", label: "Admin Paneli" }];

export default function TopBar({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="shrink-0 h-14 flex items-center justify-between px-4 md:px-8 border-b"
        style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>

        {/* Mobile: hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <button onClick={() => setMenuOpen(true)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: "transparent" }}>
            <span className="w-5 h-0.5 rounded-full" style={{ backgroundColor: "#64748b" }} />
            <span className="w-5 h-0.5 rounded-full" style={{ backgroundColor: "#64748b" }} />
            <span className="w-5 h-0.5 rounded-full" style={{ backgroundColor: "#64748b" }} />
          </button>
          <div className="flex items-center gap-2">
            <div style={{ width: 28, height: 28, borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,171,170,0.2)" }}>
              <img src="/logo.png" alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <span style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
              {profile?.team_name ?? "Düğün Akademi"}
            </span>
          </div>
        </div>

        {/* Desktop greeting */}
        <p className="hidden md:block" style={{ color: "#64748b", fontSize: 14 }}>
          Merhaba, <span style={{ color: "#1e293b", fontWeight: 500 }}>{profile?.full_name}</span>
        </p>

        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
            style={{ fontSize: 12, color: "#64748b", backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#00abaa" }} />
            {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
          </span>
          <button onClick={logout}
            style={{ color: "#64748b", fontSize: 14, padding: "6px 12px", borderRadius: 8, transition: "all 0.15s", background: "none", border: "none", cursor: "pointer" }}>
            Çıkış →
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={() => setMenuOpen(false)} />

          <div className="absolute left-0 top-0 bottom-0 w-72 flex flex-col shadow-2xl"
            style={{ backgroundColor: "#ffffff" }}>

            <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: "#e2e8f0" }}>
              <div className="flex items-center gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,171,170,0.25)" }}>
                  {profile?.team_logo_url
                    ? <img src={profile.team_logo_url} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <img src="/logo.png" alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  }
                </div>
                <div>
                  <p style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
                    {profile?.team_name ?? "Düğün Akademi"}
                  </p>
                  <p style={{ color: "#94a3b8", fontSize: 11 }}>Satış Portalı</p>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)}
                style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "none", fontSize: 20, color: "#64748b", cursor: "pointer" }}>
                ×
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              <p className="px-3 mb-2" style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Menü</p>
              {NAV.map(item => {
                const active = item.href === "/library" ? pathname.startsWith("/library") : pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", padding: "12px", borderRadius: 10,
                      fontSize: 14, fontWeight: 500, textDecoration: "none",
                      backgroundColor: active ? "#e0f7f7" : "transparent",
                      color: active ? "#00abaa" : "#475569",
                      border: active ? "1px solid #b2eded" : "1px solid transparent",
                    }}>
                    {item.label}
                  </Link>
                );
              })}

              {profile?.role === "admin" && (
                <>
                  <p className="px-3 mt-5 mb-2" style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Yönetim</p>
                  {ADMIN_NAV.map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                      style={{
                        display: "flex", alignItems: "center", padding: "12px", borderRadius: 10,
                        fontSize: 14, fontWeight: 500, textDecoration: "none",
                        backgroundColor: pathname.startsWith(item.href) ? "#e0f7f7" : "transparent",
                        color: pathname.startsWith(item.href) ? "#00abaa" : "#475569",
                        border: pathname.startsWith(item.href) ? "1px solid #b2eded" : "1px solid transparent",
                      }}>
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
            </nav>

            <div className="px-4 py-4 border-t" style={{ borderColor: "#e2e8f0" }}>
              <div className="flex items-center gap-3">
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                  backgroundColor: "#e0f7f7", border: "2px solid #00abaa",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#00abaa", fontWeight: 700, fontSize: 14,
                }}>
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt={profile.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : (profile?.full_name?.[0] ?? "?")
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: "#1e293b", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {profile?.full_name ?? "—"}
                  </p>
                  <p style={{ color: "#94a3b8", fontSize: 11 }}>{ROLE_LABELS[profile?.role ?? "staff"]}</p>
                </div>
                <button onClick={logout} style={{ color: "#ef4444", fontSize: 12, background: "none", border: "none", cursor: "pointer" }}>
                  Çıkış
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
