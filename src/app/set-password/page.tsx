"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.id) { router.push("/login"); return; }
      const { data } = await supabase.from("profiles").select("full_name, password_changed").eq("id", session.user.id).maybeSingle();
      if (data?.password_changed) { router.push("/dashboard"); return; }
      setUserName(data?.full_name ?? "");
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
    if (updateError) { setError("Şifre güncellenemedi: " + updateError.message); setLoading(false); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await supabase.from("profiles").update({ password_changed: true }).eq("id", session.user.id);
    }
    router.push("/dashboard");
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
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#e0f7f7", border: "2px solid #00abaa", display: "flex", alignItems: "center", justifyContent: "center", color: "#00abaa", fontWeight: 700, fontSize: 16 }}>
                🔐
              </div>
              <div>
                <h2 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
                  Şifrenizi Belirleyin
                </h2>
                {userName && <p style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>Hoş geldiniz, {userName}</p>}
              </div>
            </div>
            <div style={{ backgroundColor: "#f0fffe", border: "1px solid #b2eded", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ color: "#00abaa", flexShrink: 0 }}>ℹ</span>
              <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.5 }}>
                Güvenliğiniz için sisteme ilk girişinizde yeni bir şifre belirlemeniz zorunludur.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Yeni Şifre</label>
              <input
                type="password" className="input"
                placeholder="En az 8 karakter"
                value={password} onChange={e => setPassword(e.target.value)}
                required minLength={8} autoComplete="new-password" />
              {/* Güç göstergesi */}
              {password.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, backgroundColor:
                        password.length >= i * 3 ? (password.length >= 12 ? "#10b981" : password.length >= 8 ? "#f59e0b" : "#ef4444") : "#e2e8f0" }} />
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
                required autoComplete="new-password" />
              {confirm.length > 0 && password !== confirm && (
                <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>Şifreler eşleşmiyor</p>
              )}
              {confirm.length > 0 && password === confirm && (
                <p style={{ fontSize: 12, color: "#10b981", marginTop: 4 }}>✓ Şifreler eşleşiyor</p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl px-4 py-3" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
                <span style={{ color: "#ef4444", flexShrink: 0 }}>⚠</span>
                <p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Kaydediliyor…</>
              ) : "Şifremi Belirle ve Giriş Yap →"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          © {new Date().getFullYear()} Düğün Akademi
        </p>
      </div>
    </main>
  );
}
