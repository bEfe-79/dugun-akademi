import type { Announcement } from "@/types";

const TYPE_META = {
  quote_of_day: {
    icon: "✦",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  announcement: {
    icon: "◈",
    color: "text-brand-400",
    bg: "bg-brand-500/10 border-brand-500/20",
  },
  alert: {
    icon: "⚠",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
};

export default function AnnouncementsWidget({
  announcements,
}: {
  announcements: Announcement[];
}) {
  const quote = announcements.find((a) => a.type === "quote_of_day");
  const rest = announcements.filter((a) => a.type !== "quote_of_day");

  return (
    <div className="card h-full flex flex-col gap-4">
      <h3 className="section-title">Duyurular</h3>

      {quote && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-900/20 to-surface-2 border border-amber-500/15 shrink-0">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">
            ✦ Günün Sözü
          </p>
          <p className="font-display text-stone-200 text-sm leading-relaxed italic">
            "{quote.title}"
          </p>
          {quote.body && (
            <p className="text-stone-500 text-xs mt-2">{quote.body}</p>
          )}
        </div>
      )}

      <div className="flex-1 space-y-2.5 overflow-y-auto">
        {rest.length === 0 && !quote && (
          <p className="text-stone-600 text-sm text-center py-8">
            Aktif duyuru yok.
          </p>
        )}
        {rest.map((a) => {
          const meta =
            TYPE_META[a.type as keyof typeof TYPE_META] ??
            TYPE_META.announcement;
          return (
            <div
              key={a.id}
              className={`flex gap-3 p-3 rounded-xl border ${meta.bg}`}
            >
              <span className={`${meta.color} shrink-0 mt-0.5`}>
                {meta.icon}
              </span>
              <div>
                <p className="text-stone-200 text-sm font-medium leading-snug">
                  {a.title}
                </p>
                {a.body && (
                  <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">
                    {a.body}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
