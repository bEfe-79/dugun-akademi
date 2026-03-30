"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError("E-posta veya şifre hatalı. Lütfen tekrar deneyin."); setLoading(false); return; }
    // İlk giriş kontrolü
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data: profile } = await supabase.from("profiles").select("password_changed").eq("id", session.user.id).maybeSingle();
      if (!profile?.password_changed) { window.location.href = "/set-password"; return; }
    }
    window.location.href = "/dashboard";
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError("Lütfen e-posta adresinizi girin."); return; }
    setError(""); setResetLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) { setError("Bir hata oluştu: " + resetError.message); setResetLoading(false); return; }
    setResetSent(true); setResetLoading(false);
  }

  // Şifre sıfırlama gönderildi ekranı
  if (resetSent) {
    return (
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 18, marginBottom: 8 }}>
          Mail Gönderildi!
        </h3>
        <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderildi. Lütfen gelen kutunuzu kontrol edin.
        </p>
        <button onClick={() => { setResetMode(false); setResetSent(false); }}
          style={{ fontSize: 13, color: "#00abaa", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
          ← Giriş sayfasına dön
        </button>
      </div>
    );
  }

  // Şifre sıfırlama formu
  if (resetMode) {
    return (
      <form onSubmit={handleReset} className="space-y-5">
        <div>
          <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 17, marginBottom: 6 }}>
            Şifre Sıfırlama
          </h3>
          <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
            E-posta adresinizi girin. Şifre sıfırlama bağlantısı gönderilecektir.
          </p>
        </div>
        <div>
          <label className="label">E-posta</label>
          <input type="email" className="input" placeholder="ornek@dugunakademi.com"
            value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        {error && (
          <div className="flex items-start gap-2 rounded-xl px-4 py-3" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
            <span style={{ color: "#ef4444", flexShrink: 0 }}>⚠</span>
            <p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p>
          </div>
        )}
        <button type="submit" disabled={resetLoading} className="btn-primary w-full">
          {resetLoading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Gönderiliyor…</>
          ) : "Sıfırlama Linki Gönder →"}
        </button>
        <button type="button" onClick={() => { setResetMode(false); setError(""); }}
          style={{ width: "100%", textAlign: "center", fontSize: 13, color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>
          ← Giriş sayfasına dön
        </button>
      </form>
    );
  }

  // Normal giriş formu
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label">E-posta</label>
        <input type="email" className="input" placeholder="ornek@dugunakademi.com"
          value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <label className="label" style={{ margin: 0 }}>Şifre</label>
          <button type="button" onClick={() => { setResetMode(true); setError(""); }}
            style={{ fontSize: 12, color: "#00abaa", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            Şifremi unuttum?
          </button>
        </div>
        <input type="password" className="input" placeholder="••••••••"
          value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
      </div>
      {error && (
        <div className="flex items-start gap-2 rounded-xl px-4 py-3" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
          <span style={{ color: "#ef4444", flexShrink: 0 }}>⚠</span>
          <p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p>
        </div>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Giriş yapılıyor…</>
        ) : "Giriş Yap →"}
      </button>
    </form>
  );
}
