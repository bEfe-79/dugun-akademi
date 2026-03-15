"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@/types";
import { ROLE_LABELS } from "@/types";

const NAV = [
  { href: "/dashboard", icon: "◈", label: "Dashboard" },
  { href: "/logs",      icon: "◎", label: "Satış Günlüğü" },
  { href: "/library",   icon: "◉", label: "Kütüphane" },
];

const ADMIN_NAV = [
  { href: "/admin", icon: "⬡", label: "Admin Paneli" },
];

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-surface-1 border-r border-surface-3">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-lg shrink-0 overflow-hidden">
          {profile?.team_logo_url
            ? <img src={profile.team_logo_url} alt="logo" className="w-full h-full object-cover" />
            : <img src="/logo.png" alt="logo" className="w-full h-full object-contain p-1" />
          }
        </div>
        <div>
          <p className="font-display font-bold text-stone-100 text-sm leading-tight">
            {profile?.team_name ?? "Düğün Akademi"}
          </p>
          <p className="text-stone-600 text-xs">Satış Portalı</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-bold text-stone-600 uppercase tracking-widest">Menü</p>
        {NAV.map(item => (
          <NavItem key={item.href} {...item} active={pathname === item.href} />
        ))}

        {profile?.role === "admin" && (
          <>
            <p className="px-3 mt-5 mb-2 text-[10px] font-bold text-stone-600 uppercase tracking-widest">Yönetim</p>
            {ADMIN_NAV.map(item => (
              <NavItem key={item.href} {...item} active={pathname.startsWith(item.href)} />
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-surface-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0 overflow-hidden">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              : (profile?.full_name?.[0] ?? "?")
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-stone-300 text-sm font-medium truncate">{profile?.full_name ?? "—"}</p>
            <p className="text-stone-600 text-xs">{ROLE_LABELS[profile?.role ?? "staff"] ?? profile?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: string; label: string; active: boolean }) {
  return (
    <Link href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
        active
          ? "bg-brand-500/15 text-brand-300 border border-brand-500/25"
          : "text-stone-500 hover:text-stone-200 hover:bg-surface-2"
      }`}>
      <span className={`text-base ${active ? "text-brand-400" : "text-stone-600"}`}>{icon}</span>
      {label}
    </Link>
  );
}
