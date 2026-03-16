interface Props {
  label: string;
  value: string;
  icon: string;
  sub?: string;
  accent?: boolean;
  rateColor?: string;
}

export default function StatCard({ label, value, icon, sub, accent, rateColor }: Props) {
  return (
    <div className="card hover:shadow-md transition-shadow duration-200"
      style={accent ? { border: "2px solid #00abaa", backgroundColor: "#f0fffe" } : {}}>
      <div className="flex items-start justify-between mb-3">
        <span style={{ fontSize: 24 }}>{icon}</span>
        {accent && <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#00abaa" }} />}
      </div>
      <p className="label">{label}</p>
      <p style={{
        fontSize: 24, fontWeight: 700, fontFamily: "'Chalet', sans-serif", marginTop: 4,
        color: rateColor ?? (accent ? "#00abaa" : "#1e293b")
      }}>
        {value}
      </p>
      {sub && <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}
