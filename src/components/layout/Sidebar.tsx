"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@/types";
import { ROLE_LABELS } from "@/types";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/logs",      label: "Satış Günlüğü" },
  { href: "/library",   label: "Satış Kütüphanesi" },
];
const ADMIN_NAV = [{ href: "/admin", label: "Admin Paneli" }];

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r"
      style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "#e2e8f0" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, overflow: "hidden", flexShrink: 0,
          boxShadow: "0 4px 12px rgba(0,171,170,0.25)",
        }}>
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
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2" style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Menü
        </p>
        {NAV.map(item => (
          <NavItem key={item.href} href={item.href} label={item.label}
            active={item.href === "/library" ? pathname.startsWith("/library") : pathname === item.href} />
        ))}

        {profile?.role === "admin" && (
          <>
            <p className="px-3 mt-5 mb-2" style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
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
          <div style={{
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
            backgroundColor: "#e0f7f7", border: "2px solid #00abaa",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#00abaa", fontWeight: 700, fontSize: 13,
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
