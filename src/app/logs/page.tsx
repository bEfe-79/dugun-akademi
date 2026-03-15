import { createClient } from "@/lib/supabase/server";
import LogForm from "@/components/ui/LogForm";
import LogList from "@/components/ui/LogList";

export const metadata = { title: "Satış Günlüğü | Düğün Akademi" };

interface Props {
  searchParams: { date?: string };
}

export default async function LogsPage({ searchParams }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];
  const viewing = searchParams.date ?? today;

  const { data: logs } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user!.id)
    .eq("log_date", viewing)
    .order("log_time", { ascending: true });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold text-stone-100">
          Satış Günlüğü
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Saat bazlı aktivitelerinizi kaydedin.{" "}
          <span className="text-brand-400">
            Kaydedilen veriler düzenlenemez.
          </span>
        </p>
      </div>

      {viewing === today && (
        <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <LogForm userId={user!.id} today={today} />
        </div>
      )}

      {/* Tarih filtresi */}
      <div
        className="flex items-center gap-2 flex-wrap animate-fade-up"
        style={{ animationDelay: "0.15s" }}
      >
        <span className="label mb-0 mr-1">Tarih:</span>
        {days.map((d) => (
          <a
            key={d}
            href={`/logs?date=${d}`}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              d === viewing
                ? "bg-brand-500/20 border-brand-500/40 text-brand-300"
                : "bg-surface-2 border-surface-3 text-stone-500 hover:text-stone-200"
            }`}
          >
            {d === today
              ? "Bugün"
              : new Date(d + "T12:00:00").toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "short",
                })}
          </a>
        ))}
      </div>

      <LogList logs={logs ?? []} viewing={viewing} today={today} />
    </div>
  );
}
