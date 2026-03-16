"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import LogForm from "@/components/ui/LogForm";
import LogList from "@/components/ui/LogList";
import type { DailyLog } from "@/types";

export default function LogsPage() {
  const today = new Date().toISOString().split("T")[0];
  const [viewing, setViewing] = useState(today);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [customDate, setCustomDate] = useState("");

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

  function selectDate(d: string) {
    setViewing(d);
    setAccordionOpen(false);
    setCustomDate("");
  }

  function handleCustomDate(e: React.ChangeEvent<HTMLInputElement>) {
    const d = e.target.value;
    setCustomDate(d);
    if (d) { setViewing(d); setAccordionOpen(false); }
  }

  // Son 5 gün (bugün hariç)
  const prevDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (i + 1));
    return d.toISOString().split("T")[0];
  });

  const viewingLabel = viewing === today
    ? "Bugün"
    : new Date(viewing + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long" });

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

      {/* Tarih Seçici */}
      <div className="animate-fade-up">
        <div style={{ display: "flex", alignItems: "stretch", gap: 0, borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>

          {/* Bugün butonu — her zaman görünür */}
          <button
            onClick={() => { selectDate(today); setAccordionOpen(false); }}
            style={{
              padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
              border: "none", borderRight: "1px solid #e2e8f0",
              backgroundColor: viewing === today ? "#00abaa" : "#ffffff",
              color: viewing === today ? "#ffffff" : "#475569",
              transition: "all 0.15s", flexShrink: 0,
            }}>
            Bugün
          </button>

          {/* Accordion toggle — önceki 5 gün */}
          <button
            onClick={() => setAccordionOpen(o => !o)}
            style={{
              padding: "12px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer",
              border: "none", borderRight: "1px solid #e2e8f0",
              backgroundColor: (viewing !== today && !customDate) ? "#e0f7f7" : "#ffffff",
              color: (viewing !== today && !customDate) ? "#00abaa" : "#64748b",
              transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
            }}>
            {(viewing !== today && !customDate) ? viewingLabel : "Önceki Günler"}
            <span style={{ fontSize: 10, transition: "transform 0.2s", transform: accordionOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
          </button>

          {/* Accordion içeriği — satır içi açılır */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: accordionOpen ? "8px 12px" : "0",
            width: accordionOpen ? "auto" : 0, overflow: "hidden",
            transition: "all 0.25s ease", flexShrink: 0,
          }}>
            {prevDays.map(d => (
              <button key={d} onClick={() => selectDate(d)} style={{
                padding: "6px 12px", fontSize: 13, fontWeight: viewing === d ? 600 : 400,
                borderRadius: 8, cursor: "pointer", border: "none", whiteSpace: "nowrap",
                backgroundColor: viewing === d ? "#00abaa" : "#f1f5f9",
                color: viewing === d ? "#ffffff" : "#64748b",
                transition: "all 0.15s",
              }}>
                {new Date(d + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
              </button>
            ))}
          </div>

          {/* Tarih seç input */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", paddingRight: 12 }}>
            <input
              type="date"
              value={customDate}
              max={today}
              onChange={handleCustomDate}
              style={{
                marginLeft: "auto", padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0",
                fontSize: 13, color: customDate ? "#00abaa" : "#94a3b8", backgroundColor: "#f8fafc",
                outline: "none", cursor: "pointer",
              }}
              title="Belirli bir tarih seç"
            />
          </div>
        </div>
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
