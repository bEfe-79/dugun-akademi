import { createClient } from "@/lib/supabase/server";
import LogForm from "@/components/ui/LogForm";
import LogList from "@/components/ui/LogList";

export const metadata = { title: "Satış Günlüğü | Düğün Akademi" };

interface Props { searchParams: { date?: string } }

export default async function LogsPage({ searchParams }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const viewing = searchParams.date ?? today;

  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  const { data: logs } = userId
    ? await supabase.from("daily_logs").select("*")
        .eq("user_id", userId).eq("log_date", viewing)
        .order("log_time", { ascending: true })
    : { data: [] };

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="animate-fade-up">
        <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 30, fontWeight: 700, color: "#1e293b" }}>
          Satış Günlüğü
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Saat bazlı aktivitelerinizi kaydedin.{" "}
          <span style={{ color: "#00abaa" }}>Kaydedilen veriler düzenlenemez.</span>
        </p>
      </div>

      {viewing === today && (
        <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <LogForm today={today} />
        </div>
      )}

      {/* Tarih filtresi */}
      <div className="flex items-center gap-2 flex-wrap animate-fade-up" style={{ animationDelay: "0.15s" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginRight: 4 }}>
          Tarih:
        </span>
        {days.map(d => (
          <a key={d} href={`/logs?date=${d}`} style={{
            fontSize: 13, padding: "6px 14px", borderRadius: 8, textDecoration: "none", transition: "all 0.15s",
            backgroundColor: d === viewing ? "#e0f7f7" : "#ffffff",
            color: d === viewing ? "#00abaa" : "#64748b",
            border: d === viewing ? "1px solid #b2eded" : "1px solid #e2e8f0",
            fontWeight: d === viewing ? 600 : 400,
          }}>
            {d === today ? "Bugün" : new Date(d + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
          </a>
        ))}
      </div>

      <LogList logs={logs ?? []} viewing={viewing} today={today} />
    </div>
  );
}
