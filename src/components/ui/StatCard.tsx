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
      style={{
        ...(accent ? { border: "2px solid #00abaa", backgroundColor: "#f0fffe" } : {}),
        padding: "14px 16px", // mobilde biraz daha kompakt
      }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        {accent && <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#00abaa" }} />}
      </div>
      <p className="label" style={{ fontSize: 11 }}>{label}</p>
      <p style={{
        fontSize: "clamp(18px, 4vw, 24px)",
        fontWeight: 700,
        fontFamily: "'Chalet', sans-serif",
        marginTop: 4,
        color: rateColor ?? (accent ? "#00abaa" : "#1e293b"),
        lineHeight: 1.2,
      }}>
        {value}
      </p>
      {sub && <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 4, lineHeight: 1.3 }}>{sub}</p>}
    </div>
  );
}
