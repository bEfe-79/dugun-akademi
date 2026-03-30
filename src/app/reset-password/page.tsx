"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function translateError(msg: string): string {
  if (msg.includes("New password should be different")) return "Yeni şifre eski şifrenizle aynı olamaz.";
  if (msg.includes("Password should be at least")) return "Şifre en az 8 karakter olmalıdır.";
  if (msg.includes("Auth session missing")) return "Oturum süresi dolmuş. Lütfen tekrar sıfırlama talebi oluşturun.";
  if (msg.includes("Token has expired")) return "Sıfırlama linki süresi dolmuş. Lütfen yeni bir link talep edin.";
  if (msg.includes("Invalid token")) return "Geçersiz sıfırlama linki. Lütfen yeni bir link talep edin.";
  if (msg.includes("Network")) return "Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.";
  return "Bir hata oluştu. Lütfen tekrar deneyin.";
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Şifre en az 8 karakter olmalıdır."); return; }
    if (password !== confirm) { setError("Şifreler eşleşmiyor."); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(translateError(updateError.message));
      setLoading(false);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await supabase.from("profiles").update({ password_changed: true }).eq("id", session.user.id);
    }
    setSuccess(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#f1f5f9" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-5">
            <div style={{ width: 80, height: 80, borderRadius: 22, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,171,170,0.35)" }}>
              <img src="/logo.png" alt="Düğün Akademi" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
          </div>
          <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 28, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
            Düğün Akademi
          </h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>Satış Ekibi Portalı</p>
        </div>

        <div className="card shadow-sm">
          {success ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
                Şifre Güncellendi!
              </h2>
              <p style={{ color: "#64748b", fontSize: 14 }}>Dashboard'a yönlendiriliyorsunuz…</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>
                Yeni Şifre Belirle
              </h2>
              <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>
                Lütfen hesabınız için yeni bir şifre belirleyin.
              </p>

              {!ready && (
                <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
                  <p style={{ color: "#92400e", fontSize: 13 }}>⚠ Geçersiz veya süresi dolmuş link. Lütfen yeni bir sıfırlama talebi oluşturun.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label">Yeni Şifre</label>
                  <input
                    type="password" className="input"
                    placeholder="En az 8 karakter"
                    value={password} onChange={e => setPassword(e.target.value)}
                    required minLength={8} disabled={!ready} autoComplete="new-password" />
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
                  <input
                    type="password" className="input"
                    placeholder="Şifrenizi tekrar girin"
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    required disabled={!ready} autoComplete="new-password" />
                  {confirm.length > 0 && password !== confirm && (
                    <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>Şifreler eşleşmiyor</p>
                  )}
                  {confirm.length > 0 && password === confirm && (
                    <p style={{ fontSize: 12, color: "#10b981", marginTop: 4 }}>✓ Şifreler eşleşiyor</p>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl px-4 py-3"
                    style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
                    <span style={{ color: "#ef4444", flexShrink: 0 }}>⚠</span>
                    <p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading || !ready} className="btn-primary w-full">
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Kaydediliyor…</>
                  ) : "Şifremi Güncelle →"}
                </button>

                <button type="button" onClick={() => router.push("/login")}
                  style={{ width: "100%", textAlign: "center", fontSize: 13, color: "#64748b", background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>
                  ← Giriş sayfasına dön
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          © {new Date().getFullYear()} Düğün Akademi
        </p>
      </div>
    </main>
  );
}
