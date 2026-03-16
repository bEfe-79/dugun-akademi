"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import LogForm from "@/components/ui/LogForm";
import LogList from "@/components/ui/LogList";
import type { DailyLog } from "@/types";

export default function LogsPage() {
  const [viewing, setViewing] = useState(() => new Date().toISOString().split("T")[0]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];

  const fetchLogs = useCallback(async (date: string) => {
    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) { setLoading(false); return; }
    const { data } = await supabase
      .from("daily_logs").select("*")
      .eq("user_id", session.user.id).eq("log_date", date)
      .order("log_time", { ascending: true });
    setLogs(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(viewing); }, [viewing, fetchLogs]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  });

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }} className="space-y-8">
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
        <LogForm today={today} onSaved={() => fetchLogs(today)} />
      )}

      {/* Tarih filtresi */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginRight: 4 }}>
          Tarih:
        </span>
        {days.map(d => (
          <button key={d} onClick={() => setViewing(d)} style={{
            fontSize: 13, padding: "6px 14px", borderRadius: 8, cursor: "pointer",
            transition: "all 0.15s", border: "none",
            backgroundColor: d === viewing ? "#e0f7f7" : "#ffffff",
            color: d === viewing ? "#00abaa" : "#64748b",
            outline: d === viewing ? "1px solid #b2eded" : "1px solid #e2e8f0",
            fontWeight: d === viewing ? 600 : 400,
          }}>
            {d === today ? "Bugün" : new Date(d + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0", color: "#64748b" }}>
          <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" style={{ marginRight: 8 }} />
          Yükleniyor...
        </div>
      ) : (
        <LogList logs={logs} viewing={viewing} today={today} />
      )}
    </div>
  );
}
