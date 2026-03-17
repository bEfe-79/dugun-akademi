"use client";
import { useRef, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const ACTIVITY_TYPES = [
  { value: "call",    label: "Satış Görüşmesi", icon: "📞" },
  { value: "visit",   label: "Randevu Araması",  icon: "📅" },
  { value: "meeting", label: "Ekip Toplantısı",  icon: "🤝" },
  { value: "other",   label: "Diğer",            icon: "📌" },
];

interface Props { today: string; onSaved: () => void; }

export default function LogForm({ today, onSaved }: Props) {
  const userIdRef   = useRef<string | null>(null);
  const formRef     = useRef<HTMLFormElement>(null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) userIdRef.current = session.user.id;
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setSuccess(false);
    if (!userIdRef.current) { setError("Oturum bulunamadı."); return; }
    const fd = new FormData(e.currentTarget);
    const logTime    = fd.get("logTime") as string;
    const activity   = fd.get("activity") as string;
    const logContent = (fd.get("logContent") as string).trim();
    if (!logTime || !logContent) { setError("Saat ve not alanları zorunludur."); return; }
    setSaving(true);
    const { error: dbErr } = await createClient().from("daily_logs").insert({
      user_id: userIdRef.current, log_content: logContent,
      activity_type: activity, log_date: today, log_time: logTime,
    });
    if (dbErr) { setError("Kayıt hatası: " + dbErr.message); setSaving(false); return; }
    formRef.current?.reset();
    setSuccess(true); setSaving(false);
    setTimeout(() => { setSuccess(false); onSaved(); }, 800);
  }

  const now = new Date();
  const defaultTime = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const inp: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b", backgroundColor: "#fff", outline: "none" };

  return (
    <div className="card space-y-5">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <h3 className="section-title">Yeni Kayıt Ekle</h3>
        <span style={{ fontSize: 12, color: "#94a3b8", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: 99 }}>
          🔒 Salt okunur
        </span>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {/* Saat + Aktivite — mobilde alt alta, sm'de yan yana */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          <style>{`@media(min-width:480px){.log-form-grid{grid-template-columns:1fr 1fr!important}}`}</style>
          <div style={{ display: "contents" }} className="log-form-grid">
            <div>
              <label className="label">Saat</label>
              <input type="time" name="logTime" defaultValue={defaultTime} required style={inp} />
            </div>
            <div>
              <label className="label">Aktivite Türü</label>
              <select name="activity" defaultValue="call" style={inp}>
                {ACTIVITY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="label">Aktivite Notu</label>
          <textarea name="logContent" rows={4} required
            placeholder="Bugün ne yaptınız? Müşteri adı, görüşme detayı, sonuç…"
            style={{ ...inp, resize: "none", fontFamily: "inherit", lineHeight: 1.6 }} />
        </div>

        {error && (
          <div style={{ display: "flex", gap: 8, backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px" }}>
            <span style={{ color: "#ef4444", flexShrink: 0 }}>⚠</span>
            <p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p>
          </div>
        )}
        {success && (
          <div style={{ display: "flex", gap: 8, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 16px" }}>
            <span style={{ color: "#10b981", flexShrink: 0 }}>✓</span>
            <p style={{ color: "#059669", fontSize: 14 }}>Kayıt eklendi!</p>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Kaydediliyor…" : "💾 Kaydet"}
          </button>
          <p style={{ color: "#94a3b8", fontSize: 12 }}>Kaydedildikten sonra düzenlenemez.</p>
        </div>
      </form>
    </div>
  );
}
