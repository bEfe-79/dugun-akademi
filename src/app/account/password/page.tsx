"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function translateError(msg: string): string {
  if (msg.includes("New password should be different")) return "Yeni şifre eski şifrenizle aynı olamaz.";
  if (msg.includes("Password should be at least"))      return "Şifre en az 8 karakter olmalıdır.";
  if (msg.includes("Auth session missing"))              return "Oturum süresi dolmuş. Lütfen tekrar giriş yapın.";
  return "Bir hata oluştu. Lütfen tekrar deneyin.";
}

export default function PasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const MENU = [
    { href: "/account",          label: "Profil Bilgileri", icon: "👤" },
    { href: "/account/password", label: "Şifre Değiştir",  icon: "🔐", active: true },
    { href: "/account/messages", label: "Mesajlarım",      icon: "✉️" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Şifre en az 8 karakter olmalıdır."); return; }
    if (password !== confirm)  { setError("Şifreler eşleşmiyor."); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) { setError(translateError(updateError.message)); setLoading(false); return; }
    setSuccess(true);
    setTimeout(() => router.push("/account"), 2000);
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }} className="space-y-6">
      <div className="animate-fade-up">
        <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: "clamp(22px,5vw,28px)", fontWeight: 700, color: "#1e293b" }}>Hesabım</h1>
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
                    <div style={{ flex: 1, padding: "10px 12px" }}>
                      <span style={{ fontSize: 13, fontWeight: (item as any).active ? 700 : 500, color: (item as any).active ? "#db0962" : "#475569" }}>
                        {item.icon} {item.label}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sağ: Şifre formu */}
          <div style={{ backgroundColor: "#fff", borderRadius: 20, boxShadow: "0 4px 16px rgba(0,0,0,.06)", padding: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 20 }}>Şifre Değiştir</p>

            {success ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <p style={{ fontFamily: "'Chalet', sans-serif", fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Şifre güncellendi!</p>
                <p style={{ color: "#64748b", fontSize: 14 }}>Profil sayfasına yönlendiriliyorsunuz…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" style={{ maxWidth: 400 }}>
                <div>
                  <label className="label">Yeni Şifre</label>
                  <input type="password" className="input" placeholder="En az 8 karakter"
                    value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
                  {password.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                        {[1,2,3,4].map(i => (
                          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, backgroundColor:
                            password.length >= i * 3
                              ? (password.length >= 12 ? "#10b981" : password.length >= 8 ? "#f59e0b" : "#ef4444")
                              : "#e2e8f0" }} />
                        ))}
                      </div>
                      <p style={{ fontSize: 11, color: password.length >= 12 ? "#10b981" : password.length >= 8 ? "#f59e0b" : "#ef4444" }}>
                        {password.length >= 12 ? "Güçlü şifre" : password.length >= 8 ? "Orta güçlü" : "Zayıf şifre"}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">Şifre Tekrar</label>
                  <input type="password" className="input" placeholder="Şifrenizi tekrar girin"
                    value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" />
                  {confirm.length > 0 && password !== confirm && (
                    <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>Şifreler eşleşmiyor</p>
                  )}
                  {confirm.length > 0 && password === confirm && (
                    <p style={{ fontSize: 12, color: "#10b981", marginTop: 4 }}>✓ Şifreler eşleşiyor</p>
                  )}
                </div>
                {error && (
                  <div style={{ display: "flex", gap: 8, backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px" }}>
                    <span style={{ color: "#ef4444", flexShrink: 0 }}>⚠</span>
                    <p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p>
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "Kaydediliyor…" : "Şifremi Güncelle →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
