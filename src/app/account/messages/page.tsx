"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Message {
  id: string;
  title: string;
  body: string | null;
  created_at: string;
  is_read_by: string[];
  target_user_id: string | null;
}

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId]     = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.id) { router.push("/login"); return; }
      const uid = session.user.id;
      setUserId(uid);

      const { data } = await supabase
        .from("announcements")
        .select("id, title, body, created_at, is_read_by, target_user_id")
        .eq("is_active", true)
        .eq("type", "admin_message")
        .or(`target_user_id.is.null,target_user_id.eq.${uid}`)
        .order("created_at", { ascending: false });

      const msgs = data ?? [];
      setMessages(msgs);
      setUnreadCount(msgs.filter(m => !(m.is_read_by ?? []).includes(uid)).length);
      setLoading(false);

      // Tüm mesajları okundu olarak işaretle
      for (const msg of msgs) {
        const readBy: string[] = msg.is_read_by ?? [];
        if (!readBy.includes(uid)) {
          await supabase.from("announcements").update({
            is_read_by: [...readBy, uid],
          }).eq("id", msg.id);
        }
      }
    });
  }, []);

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 60)  return `${mins} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    return `${days} gün önce`;
  }

  const MENU = [
    { href: "/account",          label: "Profil Bilgileri", icon: "👤" },
    { href: "/account/password", label: "Şifre Değiştir",  icon: "🔐" },
    { href: "/account/messages", label: "Mesajlarım",      icon: "✉️", active: true, badge: unreadCount },
  ];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256, color: "#64748b" }}>
      <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" style={{ marginRight: 12 }} />
      Yükleniyor...
    </div>
  );

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
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {MENU.map(item => (
                <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", borderRadius: 10, overflow: "hidden", backgroundColor: (item as any).active ? "#fef2f5" : "transparent" }}>
                    <div style={{ width: 4, alignSelf: "stretch", flexShrink: 0, backgroundColor: (item as any).active ? "#db0962" : "transparent", borderRadius: "0 3px 3px 0", minHeight: 40 }} />
                    <div style={{ flex: 1, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: (item as any).active ? 700 : 500, color: (item as any).active ? "#db0962" : "#475569" }}>
                        {item.icon} {item.label}
                      </span>
                      {(item as any).badge > 0 && (
                        <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "#db0962", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>{(item as any).badge}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sağ: Inbox */}
          <div style={{ backgroundColor: "#fff", borderRadius: 20, boxShadow: "0 4px 16px rgba(0,0,0,.06)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 4 }}>Gelen Kutusu</p>
                <p style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 16 }}>Mesajlarım</p>
              </div>
              {unreadCount > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99, backgroundColor: "#fce7f0", color: "#a0174a", border: "1px solid #f0b2cc" }}>
                  {unreadCount} okunmamış
                </span>
              )}
            </div>

            {messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", color: "#94a3b8" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✉️</div>
                <p style={{ fontFamily: "'Chalet', sans-serif", fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Gelen kutunuz boş</p>
                <p style={{ fontSize: 14 }}>Yöneticinizden mesaj geldiğinde burada görünecek.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {messages.map(msg => {
                  const isRead = (msg.is_read_by ?? []).includes(userId ?? "");
                  return (
                    <div key={msg.id} style={{
                      padding: "14px 16px",
                      backgroundColor: isRead ? "#f8fafc" : "#fef2f5",
                      borderRadius: 12,
                      borderLeft: `3px solid ${isRead ? "#e2e8f0" : "#db0962"}`,
                      transition: "background .2s",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: isRead ? "#e2e8f0" : "#db0962", flexShrink: 0, marginTop: 3 }} />
                          <p style={{ fontWeight: isRead ? 500 : 700, color: isRead ? "#475569" : "#1e293b", fontSize: 14 }}>{msg.title}</p>
                        </div>
                        <p style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>{timeAgo(msg.created_at)}</p>
                      </div>
                      {msg.body && (
                        <p style={{ fontSize: 13, color: isRead ? "#94a3b8" : "#64748b", marginLeft: 16, lineHeight: 1.5 }}>{msg.body}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
