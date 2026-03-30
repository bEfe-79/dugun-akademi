"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.id) { router.push("/login"); return; }
      const uid = session.user.id;
      const [profileRes, msgRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("announcements")
          .select("id, is_read_by")
          .eq("is_active", true)
          .or(`target_user_id.is.null,target_user_id.eq.${uid}`)
          .eq("type", "admin_message"),
      ]);
      setProfile(profileRes.data);
      const unread = (msgRes.data ?? []).filter((m: any) => {
        const readBy: string[] = m.is_read_by ?? [];
        return !readBy.includes(uid);
      }).length;
      setUnreadCount(unread);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256, color: "#64748b" }}>
      <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" style={{ marginRight: 12 }} />
      Yükleniyor...
    </div>
  );

  const MENU = [
    { href: "/account", label: "Profil Bilgileri", icon: "👤", active: true },
    { href: "/account/password", label: "Şifre Değiştir", icon: "🔐", active: false },
    { href: "/account/messages", label: "Mesajlarım", icon: "✉️", active: false, badge: unreadCount },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }} className="space-y-6">
      <div className="animate-fade-up">
        <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: "clamp(22px,5vw,28px)", fontWeight: 700, color: "#1e293b" }}>
          Hesabım
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Profil ve hesap ayarlarınızı yönetin.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        <style>{`@media(min-width:768px){.account-grid{grid-template-columns:220px 1fr!important}}`}</style>
        <div style={{ display: "contents" }} className="account-grid">

          {/* Sol menü */}
          <div style={{ backgroundColor: "#fff", borderRadius: 20, boxShadow: "0 4px 16px rgba(0,0,0,.06)", padding: 20, height: "fit-content" }}>
            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "0.5px solid #f1f5f9" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#00abaa,#007a7a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18, flexShrink: 0, overflow: "hidden" }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (profile?.full_name?.[0] ?? "?")}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, color: "#1e293b", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.full_name}</p>
                <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 1 }}>Satış Profesyoneli</p>
              </div>
            </div>
            {/* Menü */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {MENU.map(item => (
                <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", borderRadius: 10, overflow: "hidden", backgroundColor: item.active ? "#fef2f5" : "transparent" }}>
                    <div style={{ width: 4, alignSelf: "stretch", flexShrink: 0, backgroundColor: item.active ? "#db0962" : "transparent", borderRadius: "0 3px 3px 0", minHeight: 40 }} />
                    <div style={{ flex: 1, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: item.active ? 700 : 500, color: item.active ? "#db0962" : "#475569" }}>
                        {item.icon} {item.label}
                      </span>
                      {item.badge ? (
                        <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "#db0962", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>{item.badge}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sağ: Profil bilgileri */}
          <div style={{ backgroundColor: "#fff", borderRadius: 20, boxShadow: "0 4px 16px rgba(0,0,0,.06)", padding: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 20 }}>Profil Bilgileri</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Ad Soyad",    value: profile?.full_name ?? "—" },
                { label: "Telefon",     value: profile?.phone ?? "—" },
                { label: "Ekip",        value: profile?.team_name ?? "—" },
                { label: "Rol",         value: profile?.role === "admin" ? "Yönetici" : "Satış Profesyoneli" },
              ].map(f => (
                <div key={f.label} style={{ backgroundColor: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>{f.label}</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>{f.value}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, backgroundColor: "#f0fffe", border: "1px solid #b2eded", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>ℹ️</span>
              <p style={{ fontSize: 13, color: "#475569" }}>Profil bilgilerini güncellemek için yöneticinizle iletişime geçin.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
