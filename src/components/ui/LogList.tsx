import type { DailyLog } from "@/types";

const ACTIVITY_META: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  call:    { label: "Satış Görüşmesi", icon: "📞", color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0" },
  visit:   { label: "Randevu Araması", icon: "📅", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  meeting: { label: "Ekip Toplantısı", icon: "🤝", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  other:   { label: "Diğer",           icon: "📌", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
  demo:    { label: "Demo",            icon: "🎯", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  email:   { label: "E-posta",         icon: "✉️", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
};

export default function LogList({ logs, viewing, today }: { logs: DailyLog[]; viewing: string; today: string }) {
  if (logs.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <span style={{ fontSize: 36, marginBottom: 12 }}>📋</span>
        <p style={{ color: "#64748b", fontWeight: 500 }}>
          {viewing === today ? "Bugüne ait kayıt yok." : "Bu tarihe ait kayıt yok."}
        </p>
        {viewing === today && (
          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
            Yukarıdaki formu kullanarak ilk kaydı ekleyin.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 className="section-title">
          {viewing === today ? "Bugünkü Kayıtlar" : `${viewing} Tarihli Kayıtlar`}
        </h3>
        <span style={{ color: "#94a3b8", fontSize: 14 }}>{logs.length} kayıt</span>
      </div>

      <div className="space-y-2">
        {logs.map(log => {
          const meta = ACTIVITY_META[log.activity_type] ?? ACTIVITY_META.other;
          return (
            <div key={log.id} className="card"
              style={{ border: `1px solid ${meta.border}`, backgroundColor: meta.bg, padding: "14px 16px" }}>
              {/* Saat + badge — mobilde üst üste, sm'de yan yana */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                <p style={{ fontFamily: "monospace", color: "#00abaa", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                  {String(log.log_time).slice(0, 5)}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                    backgroundColor: "white", color: meta.color, border: `1px solid ${meta.border}`,
                    whiteSpace: "nowrap",
                  }}>
                    {meta.icon} {meta.label}
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: 11, marginLeft: "auto", whiteSpace: "nowrap" }}>🔒 Salt okunur</span>
                </div>
              </div>
              <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.6 }}>{log.log_content}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
