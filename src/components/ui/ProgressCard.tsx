"use client";
import { useEffect, useRef } from "react";

interface Props {
  monthlyTarget: number;
  currentSales: number;
  successRate: number;
  activityCounts: Record<string, number>;
}

const ACTIVITY_COLORS: Record<string, string> = {
  visit:   "bg-blue-500",
  call:    "bg-emerald-500",
  email:   "bg-amber-500",
  meeting: "bg-violet-500",
  demo:    "bg-rose-500",
  other:   "bg-stone-500",
};

const ACTIVITY_LABELS: Record<string, string> = {
  visit:   "Ziyaret",
  call:    "Arama",
  email:   "E-posta",
  meeting: "Toplantı",
  demo:    "Demo",
  other:   "Diğer",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

export default function ProgressCard({
  monthlyTarget,
  currentSales,
  successRate,
  activityCounts,
}: Props) {
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

  const barColor =
    pct >= 100 ? "bg-emerald-500" :
    pct >= 75  ? "bg-amber-500"   :
    pct >= 50  ? "bg-orange-500"  : "bg-brand-500";

  const totalActivity = Object.values(activityCounts).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="card space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Aylık Hedef İlerlemesi</h3>
        <span
          className={`text-2xl font-bold font-display ${
            pct >= 100
              ? "text-emerald-400"
              : pct >= 75
              ? "text-amber-400"
              : "text-brand-400"
          }`}
        >
          %{successRate}
        </span>
      </div>

      <div className="flex items-end justify-between text-sm">
        <div>
          <p className="text-stone-500 text-xs mb-0.5">Gerçekleşen</p>
          <p className="text-stone-100 font-semibold font-display">
            {formatCurrency(currentSales)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-stone-500 text-xs mb-0.5">Hedef</p>
          <p className="text-stone-400 font-semibold font-display">
            {formatCurrency(monthlyTarget)}
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="h-3 bg-surface-3 rounded-full overflow-hidden">
          <div
            ref={barRef}
            className={`h-full rounded-full ${barColor}`}
            style={{ width: "0%" }}
          />
        </div>
        {pct >= 100 && (
          <p className="text-emerald-400 text-xs font-bold mt-1">
            ✓ Hedef aşıldı!
          </p>
        )}
      </div>

      {totalActivity > 0 && (
        <div>
          <p className="label mb-3">Bu Ay Aktivite Dağılımı</p>
          <div className="space-y-2">
            {Object.entries(activityCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-stone-500 text-xs w-16 shrink-0">
                    {ACTIVITY_LABELS[type] ?? type}
                  </span>
                  <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${ACTIVITY_COLORS[type] ?? "bg-stone-500"}`}
                      style={{
                        width: `${(count / totalActivity) * 100}%`,
                        transition: "width 0.8s ease",
                      }}
                    />
                  </div>
                  <span className="text-stone-400 text-xs w-4 text-right">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
