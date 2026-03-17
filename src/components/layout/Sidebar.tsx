"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@/types";
import { ROLE_LABELS } from "@/types";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  {
    label: "Satış Okulu",
    children: [
      { href: "/school/trainings",    label: "Eğitimler" },
      { href: "/school/exams",        label: "Sınavlar" },
      { href: "/school/certificates", label: "Sertifikalar" },
    ],
  },
  { href: "/logs",    label: "Satış Günlüğü" },
  { href: "/library", label: "Satış Kütüphanesi" },
];
const ADMIN_NAV = [{ href: "/admin", label: "Admin Paneli" }];

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const isSchool = pathname.startsWith("/school");

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r"
      style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "#e2e8f0" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,171,170,0.25)" }}>
          {profile?.team_logo_url
            ? <img src={profile.team_logo_url} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <img src="/logo.png" alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          }
        </div>
        <div>
          <p style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 14, lineHeight: 1.2 }}>
            {profile?.team_name ?? "Düğün Akademi"}
          </p>
          <p style={{ color: "#94a3b8", fontSize: 11 }}>Satış Portalı</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <p className="px-3 mb-2" style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Menü
        </p>

        {NAV.map(item => {
          if ("children" in item) {
            // Satış Okulu grup
            return (
              <div key={item.label}>
                {/* Grup başlığı */}
                <div style={{
                  display: "flex", alignItems: "center", padding: "8px 12px",
                  borderRadius: 10, fontSize: 14, fontWeight: 600,
                  color: isSchool ? "#00abaa" : "#475569",
                  backgroundColor: isSchool ? "#e0f7f7" : "transparent",
                  border: isSchool ? "1px solid #b2eded" : "1px solid transparent",
                  marginBottom: 2,
                }}>
                  <span style={{ marginRight: 8, fontSize: 13 }}>🎓</span>
                  {item.label}
                </div>
                {/* Alt linkler */}
                <div style={{ paddingLeft: 12, display: "flex", flexDirection: "column", gap: 1, marginBottom: 4 }}>
                  {item.children.map(child => {
                    const active = pathname.startsWith(child.href);
                    return (
                      <Link key={child.href} href={child.href} style={{
                        display: "flex", alignItems: "center", padding: "7px 12px",
                        borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: "none",
                        backgroundColor: active ? "#f0fffe" : "transparent",
                        color: active ? "#00abaa" : "#64748b",
                        borderLeft: active ? "2px solid #00abaa" : "2px solid transparent",
                        transition: "all 0.15s",
                      }}>
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }
          // Normal link
          const active = item.href === "/library"
            ? pathname.startsWith("/library")
            : pathname === item.href;
          return (
            <NavItem key={item.href} href={item.href!} label={item.label} active={active} />
          );
        })}

        {profile?.role === "admin" && (
          <>
            <p className="px-3 mt-4 mb-2" style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Yönetim
            </p>
            {ADMIN_NAV.map(item => (
              <NavItem key={item.href} href={item.href} label={item.label}
                active={pathname.startsWith(item.href)} />
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "#e2e8f0" }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, overflow: "hidden", backgroundColor: "#e0f7f7", border: "2px solid #00abaa", display: "flex", alignItems: "center", justifyContent: "center", color: "#00abaa", fontWeight: 700, fontSize: 13 }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt={profile.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : (profile?.full_name?.[0] ?? "?")}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "#1e293b", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile?.full_name ?? "—"}
            </p>
            <p style={{ color: "#94a3b8", fontSize: 11 }}>
              {ROLE_LABELS[profile?.role ?? "staff"] ?? profile?.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", padding: "10px 12px",
      borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none",
      transition: "all 0.15s",
      backgroundColor: active ? "#e0f7f7" : "transparent",
      color: active ? "#00abaa" : "#475569",
      border: active ? "1px solid #b2eded" : "1px solid transparent",
    }}>
      {label}
    </Link>
  );
}
