import type { DailyLog } from "@/types";
import { ACTIVITY_META } from "@/types";

export default function LogList({
  logs,
  viewing,
  today,
}: {
  logs: DailyLog[];
  viewing: string;
  today: string;
}) {
  if (logs.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-4">📋</span>
        <p className="text-stone-400 font-medium">
          {viewing === today
            ? "Bugüne ait kayıt yok."
            : "Bu tarihe ait kayıt yok."}
        </p>
        {viewing === today && (
          <p className="text-stone-600 text-sm mt-1">
            Yukarıdaki formu kullanarak ilk kaydı ekleyin.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="section-title">
          {viewing === today ? "Bugünkü Kayıtlar" : `${viewing} Tarihli Kayıtlar`}
        </h3>
        <span className="text-stone-500 text-sm">{logs.length} kayıt</span>
      </div>

      <div className="space-y-2.5">
        {logs.map((log) => {
          const meta =
            ACTIVITY_META[log.activity_type as keyof typeof ACTIVITY_META] ??
            ACTIVITY_META.other;
          return (
            <div
              key={log.id}
              className="card py-4 flex gap-4 hover:border-surface-4 transition-colors duration-150"
            >
              <div className="shrink-0 text-center">
                <p className="font-mono text-brand-400 text-sm font-bold">
                  {String(log.log_time).slice(0, 5)}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`badge ${meta.color}`}>
                    {meta.icon} {meta.label}
                  </span>
                  <span className="text-stone-600 text-xs ml-auto">
                    🔒 Salt okunur
                  </span>
                </div>
                <p className="text-stone-300 text-sm leading-relaxed">
                  {log.log_content}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
