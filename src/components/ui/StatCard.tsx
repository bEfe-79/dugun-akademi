interface Props {
  label: string;
  value: string;
  icon: string;
  sub?: string;
  accent?: boolean;
  rateColor?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  sub,
  accent,
  rateColor,
}: Props) {
  return (
    <div
      className={`card relative overflow-hidden hover:border-surface-4 transition-colors duration-200 ${
        accent
          ? "border-brand-500/30 bg-gradient-to-br from-brand-900/30 to-surface-1"
          : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {accent && (
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
        )}
      </div>
      <p className="label">{label}</p>
      <p
        className={`text-2xl font-bold font-display mt-1 ${
          rateColor ?? (accent ? "text-brand-300" : "text-stone-100")
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-stone-600 text-xs mt-1">{sub}</p>}
    </div>
  );
}
