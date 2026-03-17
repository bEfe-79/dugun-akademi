"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import LogForm from "@/components/ui/LogForm";
import LogList from "@/components/ui/LogList";
import type { DailyLog } from "@/types";

export default function LogsPage() {
  const today = new Date().toISOString().split("T")[0];
  const [viewing, setViewing]           = useState(today);
  const [logs, setLogs]                 = useState<DailyLog[]>([]);
  const [loading, setLoading]           = useState(true);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [customDate, setCustomDate]     = useState("");

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

  const prevDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (i + 1));
    return d.toISOString().split("T")[0];
  });

  const viewingLabel = viewing === today
    ? "Bugün"
    : new Date(viewing + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long" });

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }} className="space-y-6">
      <div className="animate-fade-up">
        <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 700, color: "#1e293b" }}>
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

      {/* Tarih Seçici — mobilde dikey, masaüstünde yatay */}
      <div className="animate-fade-up">
        <div style={{ borderRadius: 12, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", overflow: "hidden" }}>

          {/* Üst satır: Bugün + Önceki Günler toggle + Tarih input */}
          <div style={{ display: "flex", alignItems: "stretch" }}>
            <button
              onClick={() => { selectDate(today); setAccordionOpen(false); }}
              style={{
                padding: "12px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer",
                border: "none", borderRight: "1px solid #e2e8f0",
                backgroundColor: viewing === today ? "#00abaa" : "#ffffff",
                color: viewing === today ? "#ffffff" : "#475569",
                transition: "all 0.15s", flexShrink: 0, whiteSpace: "nowrap",
              }}>
              Bugün
            </button>

            <button
              onClick={() => setAccordionOpen(o => !o)}
              style={{
                padding: "12px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                border: "none", borderRight: "1px solid #e2e8f0",
                backgroundColor: (viewing !== today && !customDate) ? "#e0f7f7" : "#ffffff",
                color: (viewing !== today && !customDate) ? "#00abaa" : "#64748b",
                transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6,
                flexShrink: 0, whiteSpace: "nowrap",
              }}>
              {(viewing !== today && !customDate) ? viewingLabel : "Önceki"}
              <span style={{ fontSize: 10, transition: "transform 0.2s", transform: accordionOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
            </button>

            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "8px 12px" }}>
              <input
                type="date"
                value={customDate}
                max={today}
                onChange={handleCustomDate}
                style={{
                  padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0",
                  fontSize: 13, color: customDate ? "#00abaa" : "#94a3b8",
                  backgroundColor: "#f8fafc", outline: "none", cursor: "pointer",
                  maxWidth: "100%",
                }}
                title="Belirli bir tarih seç"
              />
            </div>
          </div>

          {/* Accordion — önceki 5 gün, mobilde sarmalayan flex */}
          {accordionOpen && (
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 8,
              padding: "12px 14px",
              borderTop: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
            }}>
              {prevDays.map(d => (
                <button key={d} onClick={() => selectDate(d)} style={{
                  padding: "7px 14px", fontSize: 13, fontWeight: viewing === d ? 600 : 400,
                  borderRadius: 8, cursor: "pointer", border: "none", whiteSpace: "nowrap",
                  backgroundColor: viewing === d ? "#00abaa" : "#ffffff",
                  color: viewing === d ? "#ffffff" : "#64748b",
                  border: viewing === d ? "1px solid #00abaa" : "1px solid #e2e8f0",
                  transition: "all 0.15s",
                }}>
                  {new Date(d + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                </button>
              ))}
            </div>
          )}
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
