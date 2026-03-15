"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { ROLE_LABELS } from "@/types";

const NAV = [
  { href: "/dashboard", icon: "◈", label: "Dashboard" },
  { href: "/logs",      icon: "◎", label: "Satış Günlüğü" },
  { href: "/library",   icon: "◉", label: "Kütüphane" },
];
const ADMIN_NAV = [{ href: "/admin", icon: "⬡", label: "Admin Paneli" }];

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
      <header className="shrink-0 h-14 flex items-center justify-between px-4 md:px-8 bg-surface-1 border-b border-surface-3">
        {/* Mobile: hamburger + logo */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-surface-2 transition-colors"
            aria-label="Menüyü aç"
          >
            <span className="w-5 h-0.5 bg-stone-400 rounded-full" />
            <span className="w-5 h-0.5 bg-stone-400 rounded-full" />
            <span className="w-5 h-0.5 bg-stone-400 rounded-full" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center overflow-hidden shrink-0">
              {profile?.team_logo_url
                ? <img src={profile.team_logo_url} alt="logo" className="w-full h-full object-cover" />
                : <img src="/logo.png" alt="logo" className="w-full h-full object-contain p-0.5" />
              }
            </div>
            <span className="font-display font-bold text-stone-100 text-sm">
              {profile?.team_name ?? "Düğün Akademi"}
            </span>
          </div>
        </div>

        {/* Desktop: greeting */}
        <p className="hidden md:block text-stone-500 text-sm">
          Merhaba, <span className="text-stone-200 font-medium">{profile?.full_name}</span>
        </p>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500 bg-surface-2 border border-surface-3 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
          </span>
          <button
            onClick={logout}
            className="text-stone-500 hover:text-stone-200 text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-2"
          >
            Çıkış →
          </button>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-surface-1 border-r border-surface-3 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-surface-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center overflow-hidden shrink-0">
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
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-2 text-stone-400 hover:text-stone-200 transition-colors text-lg"
              >
                ×
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              <p className="px-3 mb-2 text-[10px] font-bold text-stone-600 uppercase tracking-widest">Menü</p>
              {NAV.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    pathname === item.href
                      ? "bg-brand-500/15 text-brand-300 border border-brand-500/25"
                      : "text-stone-500 hover:text-stone-200 hover:bg-surface-2"
                  }`}
                >
                  <span className={`text-base ${pathname === item.href ? "text-brand-400" : "text-stone-600"}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              ))}

              {profile?.role === "admin" && (
                <>
                  <p className="px-3 mt-5 mb-2 text-[10px] font-bold text-stone-600 uppercase tracking-widest">Yönetim</p>
                  {ADMIN_NAV.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                        pathname.startsWith(item.href)
                          ? "bg-brand-500/15 text-brand-300 border border-brand-500/25"
                          : "text-stone-500 hover:text-stone-200 hover:bg-surface-2"
                      }`}
                    >
                      <span className={`text-base ${pathname.startsWith(item.href) ? "text-brand-400" : "text-stone-600"}`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
            </nav>

            {/* User */}
            <div className="px-4 py-4 border-t border-surface-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-600/30 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold shrink-0 overflow-hidden">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                    : (profile?.full_name?.[0] ?? "?")
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-stone-300 text-sm font-medium truncate">{profile?.full_name ?? "—"}</p>
                  <p className="text-stone-600 text-xs">{ROLE_LABELS[profile?.role ?? "staff"] ?? profile?.role}</p>
                </div>
                <button onClick={logout} className="text-stone-500 hover:text-rose-400 text-xs transition-colors">
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
