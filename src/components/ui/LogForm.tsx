"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const ACTIVITY_TYPES = [
  { value: "call",    label: "Satış Görüşmesi",  icon: "📞" },
  { value: "visit",   label: "Randevu Araması",   icon: "📅" },
  { value: "meeting", label: "Ekip Toplantısı",   icon: "🤝" },
  { value: "other",   label: "Diğer",             icon: "📌" },
];

export default function LogForm({ today }: { today: string }) {
  const userIdRef = useRef<string | null>(null);
  const [logContent, setLogContent] = useState("");
  const [activityType, setActivityType] = useState("call");
  const [logTime, setLogTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) userIdRef.current = session.user.id;
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(false);
    if (!userIdRef.current) { setError("Oturum bulunamadı."); return; }
    if (!logContent.trim() || !logTime) { setError("Saat ve not alanları zorunludur."); return; }

    setSaving(true);
    const { error: dbErr } = await createClient().from("daily_logs").insert({
      user_id: userIdRef.current,
      log_content: logContent.trim(),
      activity_type: activityType,
      log_date: today,
      log_time: logTime,
    });

    if (dbErr) { setError("Kayıt hatası: " + dbErr.message); setSaving(false); return; }

    setLogContent("");
    setSuccess(true);
    setSaving(false);
    setTimeout(() => {
      setSuccess(false);
      window.location.reload();
    }, 1000);
  }

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Yeni Kayıt Ekle</h3>
        <span style={{ fontSize: 12, color: "#94a3b8", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: 99 }}>
          🔒 Salt okunur
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Saat</label>
            <input
              type="time"
              className="input"
              value={logTime}
              onChange={e => setLogTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Aktivite Türü</label>
            <select className="input" value={activityType} onChange={e => setActivityType(e.target.value)}>
              {ACTIVITY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Aktivite Notu</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Bugün ne yaptınız? Müşteri adı, görüşme detayı, sonuç…"
            value={logContent}
            onChange={e => setLogContent(e.target.value)}
            required
          />
          <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>{logContent.length} karakter</p>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px" }}>
            <span style={{ color: "#ef4444" }}>⚠</span>
            <p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p>
          </div>
        )}
        {success && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 16px" }}>
            <span style={{ color: "#10b981" }}>✓</span>
            <p style={{ color: "#059669", fontSize: 14 }}>Kayıt eklendi, sayfa yenileniyor…</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Kaydediliyor…</>
              : "💾 Kaydet"}
          </button>
          <p style={{ color: "#94a3b8", fontSize: 12 }}>Kaydedildikten sonra düzenlenemez.</p>
        </div>
      </form>
    </div>
  );
}
