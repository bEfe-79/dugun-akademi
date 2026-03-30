"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

export default function TopBar({ profile }: { profile: Profile | null }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile?.id) return;
    const supabase = createClient();
    supabase.from("announcements")
      .select("id, is_read_by")
      .eq("is_active", true)
      .eq("type", "admin_message")
      .or(`target_user_id.is.null,target_user_id.eq.${profile.id}`)
      .then(({ data }) => {
        const unread = (data ?? []).filter((m: any) => {
          const readBy: string[] = m.is_read_by ?? [];
          return !readBy.includes(profile.id);
        }).length;
        setUnreadCount(unread);
      });
  }, [profile?.id, pathname]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="shrink-0 h-14 flex items-center justify-between px-4 md:px-8"
      style={{ backgroundColor: "#ffffff", borderBottom: "0.5px solid #f1f5f9", position: "relative", zIndex: 10, boxShadow: "0 1px 0 #f1f5f9" }}>

      {/* Mobil: Logo */}
      <div className="flex lg:hidden items-center gap-2">
        <img src="/logo.png" alt="Düğün Akademi"
          style={{ width: 28, height: 28, borderRadius: 8, objectFit: "contain", backgroundColor: "#f8fafc", padding: 2 }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        <span style={{ fontWeight: 800, color: "#1e293b", fontSize: 13, letterSpacing: "-0.2px" }}>
          Düğün Akademi
        </span>
      </div>

      {/* Desktop: greeting */}
      <div className="hidden lg:block">
        <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 2 }}>İyi günler</p>
        <p style={{ color: "#1e293b", fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px" }}>
          Selam {profile?.full_name} 👋
        </p>
      </div>

      {/* Sağ */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="hidden sm:flex" style={{ alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 99, fontSize: 11, color: "#64748b", backgroundColor: "#f8fafc", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#00abaa", display: "inline-block" }} />
          {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
        </span>

        {/* Zil ikonu — mesaj bildirimi */}
        <a href="/account/messages" style={{ position: "relative", textDecoration: "none" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: "0 1px 4px rgba(0,0,0,.06)", cursor: "pointer" }}>
            🔔
          </div>
          {unreadCount > 0 && (
            <div style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: "50%", backgroundColor: "#db0962", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
            </div>
          )}
        </a>

        {/* Mobil: avatar */}
        <a href="/account" style={{ textDecoration: "none" }}>
          <div className="flex lg:hidden" style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#00abaa,#007a7a)", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,171,170,.3)", flexShrink: 0 }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : (profile?.full_name?.[0] ?? "?")}
          </div>
        </a>

        <button onClick={logout}
          style={{ color: "#64748b", fontSize: 14, padding: "6px 12px", borderRadius: 8, background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
          Çıkış →
        </button>
      </div>
    </header>
  );
}
