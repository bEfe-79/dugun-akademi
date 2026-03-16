"use client";
import { useEffect, useRef } from "react";

interface Props {
  monthlyTarget: number;
  currentSales: number;
  successRate: number;
  activityCounts: Record<string, number>;
}

const ACTIVITY_COLORS: Record<string, string> = {
  visit: "#3b82f6", call: "#10b981", email: "#f59e0b",
  meeting: "#8b5cf6", demo: "#ef4444", other: "#94a3b8",
};
const ACTIVITY_LABELS: Record<string, string> = {
  visit: "Ziyaret", call: "Arama", email: "E-posta",
  meeting: "Toplantı", demo: "Demo", other: "Diğer",
};

function fmt(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n ?? 0);
}

export default function ProgressCard({ monthlyTarget, currentSales, successRate, activityCounts }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const pct = Math.min(successRate, 100);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    setTimeout(() => {
      bar.style.transition = "width 1.4s cubic-bezier(0.34,1.56,0.64,1)";
      bar.style.width = `${pct}%`;
    }, 100);
  }, [pct]);

  const barColor = pct >= 100 ? "#10b981" : pct >= 75 ? "#f59e0b" : pct >= 50 ? "#f97316" : "#00abaa";
  const totalActivity = Object.values(activityCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Aylık Hedef İlerlemesi</h3>
        <span style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Chalet', sans-serif", color: barColor }}>
          %{successRate}
        </span>
      </div>

      <div className="flex items-end justify-between text-sm">
        <div>
          <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 2 }}>Gerçekleşen</p>
          <p style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 600, color: "#1e293b" }}>{fmt(currentSales)}</p>
        </div>
        <div className="text-right">
          <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 2 }}>Hedef</p>
          <p style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 600, color: "#64748b" }}>{fmt(monthlyTarget)}</p>
        </div>
      </div>

      <div>
        <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#e2e8f0" }}>
          <div ref={barRef} className="h-full rounded-full" style={{ width: "0%", backgroundColor: barColor }} />
        </div>
        {pct >= 100 && <p style={{ color: "#10b981", fontSize: 12, fontWeight: 700, marginTop: 4 }}>✓ Hedef aşıldı!</p>}
      </div>

      {totalActivity > 0 && (
        <div>
          <p className="label mb-3">Bu Ay Aktivite Dağılımı</p>
          <div className="space-y-2">
            {Object.entries(activityCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <span style={{ color: "#64748b", fontSize: 12, width: 64, flexShrink: 0 }}>
                  {ACTIVITY_LABELS[type] ?? type}
                </span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#e2e8f0" }}>
                  <div className="h-full rounded-full" style={{
                    width: `${(count / totalActivity) * 100}%`,
                    backgroundColor: ACTIVITY_COLORS[type] ?? "#94a3b8",
                    transition: "width 0.8s ease",
                  }} />
                </div>
                <span style={{ color: "#64748b", fontSize: 12, width: 16, textAlign: "right" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
