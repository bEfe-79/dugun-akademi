"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@/types";
import { ROLE_LABELS } from "@/types";

const NAV = [
  { href: "/dashboard",        label: "Dashboard" },
  { href: "/school/trainings", label: "Satış Okulu" },
  { href: "/logs",             label: "Satış Günlüğü" },
  { href: "/library",          label: "Satış Kütüphanesi" },
];
const ADMIN_NAV = [{ href: "/admin", label: "Admin Paneli" }];

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/library") return pathname.startsWith("/library");
    if (href === "/school/trainings") return pathname.startsWith("/school");
    if (href === "/admin") return pathname.startsWith("/admin");
    return pathname === href;
  }

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col"
      style={{ backgroundColor: "#ffffff", borderRight: "0.5px solid #f1f5f9" }}>

      {/* Logo */}
      <div style={{ padding: "20px 18px 16px", borderBottom: "0.5px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
        <img
          src="/logo.png"
          alt="Düğün Akademi"
          style={{ width: 36, height: 36, borderRadius: 10, objectFit: "contain", backgroundColor: "#f8fafc", padding: 3, flexShrink: 0 }}
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            el.style.display = "none";
            const fallback = el.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        {/* Fallback logo */}
        <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#00abaa", alignItems: "center", justifyContent: "center", display: "none", flexShrink: 0 }}>
          <div style={{ width: 16, height: 10, border: "2px solid #fff", borderRadius: 2 }} />
        </div>
        <div>
          <p style={{ fontWeight: 800, color: "#1e293b", fontSize: 13, lineHeight: 1.2, letterSpacing: "-0.2px" }}>
            {profile?.team_name ?? "Düğün Akademi"}
          </p>
          <p style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>Satış Portalı</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        <p style={{ padding: "0 12px", marginBottom: 8, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Menü
        </p>
        {NAV.map(item => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center",
                borderRadius: 12, overflow: "hidden",
                backgroundColor: active ? "#fef2f5" : "transparent",
                transition: "background .15s",
              }}>
                {/* Pembe sol çizgi */}
                <div style={{
                  width: 4, alignSelf: "stretch", flexShrink: 0,
                  backgroundColor: active ? "#db0962" : "transparent",
                  borderRadius: "0 3px 3px 0",
                  minHeight: 40,
                  transition: "background .15s",
                }} />
                <div style={{
                  flex: 1, padding: "10px 12px",
                  fontSize: 14, fontWeight: active ? 700 : 500,
                  color: active ? "#db0962" : "#475569",
                }}>
                  {item.label}
                </div>
              </div>
            </Link>
          );
        })}

        {profile?.role === "admin" && (
          <>
            <p style={{ padding: "0 12px", marginTop: 16, marginBottom: 8, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Yönetim
            </p>
            {ADMIN_NAV.map(item => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    borderRadius: 12, overflow: "hidden",
                    backgroundColor: active ? "#fef2f5" : "transparent",
                    transition: "background .15s",
                  }}>
                    <div style={{
                      width: 4, alignSelf: "stretch", flexShrink: 0,
                      backgroundColor: active ? "#db0962" : "transparent",
                      borderRadius: "0 3px 3px 0",
                      minHeight: 40,
                    }} />
                    <div style={{
                      flex: 1, padding: "10px 12px",
                      fontSize: 14, fontWeight: active ? 700 : 500,
                      color: active ? "#db0962" : "#475569",
                    }}>
                      {item.label}
                    </div>
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User */}
      <div style={{ padding: "14px 16px", borderTop: "0.5px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #00abaa, #007a7a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 800, fontSize: 14,
          overflow: "hidden", boxShadow: "0 2px 8px rgba(0,171,170,.3)",
        }}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (profile?.full_name?.[0] ?? "?")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "#1e293b", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {profile?.full_name ?? "—"}
          </p>
          <p style={{ color: "#94a3b8", fontSize: 11 }}>
            {ROLE_LABELS[profile?.role ?? "staff"] ?? profile?.role}
          </p>
        </div>
      </div>
    </aside>
  );
}
