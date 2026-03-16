import type { Announcement } from "@/types";

const TYPE_META = {
  quote_of_day:  { icon: "✦", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  announcement:  { icon: "◈", color: "#00abaa", bg: "#f0fffe", border: "#b2eded" },
  alert:         { icon: "⚠", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
};

export default function AnnouncementsWidget({ announcements }: { announcements: Announcement[] }) {
  const quote = announcements.find(a => a.type === "quote_of_day");
  const rest  = announcements.filter(a => a.type !== "quote_of_day");

  return (
    <div className="card h-full flex flex-col gap-4">
      <h3 className="section-title">Duyurular</h3>

      {quote && (
        <div className="p-4 rounded-xl" style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            ✦ Günün Sözü
          </p>
          <p style={{ fontFamily: "'Chalet', sans-serif", color: "#1e293b", fontSize: 14, lineHeight: 1.6, fontStyle: "italic" }}>
            "{quote.title}"
          </p>
          {quote.body && <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>{quote.body}</p>}
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto">
        {rest.length === 0 && !quote && (
          <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "32px 0" }}>Aktif duyuru yok.</p>
        )}
        {rest.map(a => {
          const meta = TYPE_META[a.type as keyof typeof TYPE_META] ?? TYPE_META.announcement;
          return (
            <div key={a.id} className="flex gap-3 p-3 rounded-xl"
              style={{ backgroundColor: meta.bg, border: `1px solid ${meta.border}` }}>
              <span style={{ color: meta.color, flexShrink: 0, marginTop: 2 }}>{meta.icon}</span>
              <div>
                <p style={{ color: "#1e293b", fontSize: 14, fontWeight: 500 }}>{a.title}</p>
                {a.body && <p style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{a.body}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
