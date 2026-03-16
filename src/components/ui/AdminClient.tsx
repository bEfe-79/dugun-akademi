"use client";
import { useState, useMemo } from "react";
import type { Profile, DailyLog, ActivityType } from "@/types";

const ACTIVITY_META: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  call:    { label: "Satış Görüşmesi", icon: "📞", color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0" },
  visit:   { label: "Randevu Araması", icon: "📅", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  meeting: { label: "Ekip Toplantısı", icon: "🤝", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  demo:    { label: "Demo",            icon: "🎯", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  email:   { label: "E-posta",         icon: "✉️", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  other:   { label: "Diğer",           icon: "📌", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
};

type Tab = "logs" | "users";

function fmt(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n ?? 0);
}

export default function AdminClient({
  profiles, logs, defaultTab = "logs",
}: {
  profiles: (Profile & { last_login?: string })[];
  logs: (DailyLog & { profiles?: { full_name: string } })[];
  defaultTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [filterUser, setFilterUser] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [sortCol, setSortCol] = useState("log_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const staffProfiles = profiles.filter(p => p.role === "staff");
  const todayStr = new Date().toISOString().split("T")[0];

  const filteredLogs = useMemo(() => {
    let result = logs.filter(l => {
      if (filterUser && l.user_id !== filterUser) return false;
      if (filterDateFrom && l.log_date < filterDateFrom) return false;
      if (filterDateTo && l.log_date > filterDateTo) return false;
      if (filterTypes.length > 0 && !filterTypes.includes(l.activity_type)) return false;
      return true;
    });
    result = [...result].sort((a, b) => {
      let av = "", bv = "";
      if (sortCol === "full_name") { av = a.profiles?.full_name ?? ""; bv = b.profiles?.full_name ?? ""; }
      else if (sortCol === "log_date") { av = a.log_date; bv = b.log_date; }
      else if (sortCol === "log_time") { av = String(a.log_time); bv = String(b.log_time); }
      else if (sortCol === "activity_type") { av = a.activity_type; bv = b.activity_type; }
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return result;
  }, [logs, filterUser, filterDateFrom, filterDateTo, filterTypes, sortCol, sortDir]);

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  function toggleType(t: string) {
    setFilterTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function exportCSV() {
    const headers = ["Personel", "Tarih", "Saat", "Aktivite", "Not"];
    const rows = filteredLogs.map(l => [
      l.profiles?.full_name ?? "",
      l.log_date,
      String(l.log_time).slice(0, 5),
      ACTIVITY_META[l.activity_type]?.label ?? l.activity_type,
      `"${(l.log_content ?? "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gunlukler-${filterDateFrom || "tum"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportExcel() {
    const { utils, writeFile } = await import("xlsx");
    const wsData = [
      ["Personel", "Tarih", "Saat", "Aktivite", "Not"],
      ...filteredLogs.map(l => [
        l.profiles?.full_name ?? "",
        l.log_date,
        String(l.log_time).slice(0, 5),
        ACTIVITY_META[l.activity_type]?.label ?? l.activity_type,
        l.log_content ?? "",
      ]),
    ];
    const ws = utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 20 }, { wch: 50 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Günlükler");
    writeFile(wb, `gunlukler-${filterDateFrom || "tum"}.xlsx`);
  }

  const activeToday = new Set(logs.filter(l => l.log_date === todayStr).map(l => l.user_id)).size;

  const SortBtn = ({ col, label }: { col: string; label: string }) => (
    <button onClick={() => toggleSort(col)}
      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {label}
      <span style={{ fontSize: 10 }}>{sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {[
          { label: "Toplam Personel", value: String(staffProfiles.length), icon: "👥", accent: false },
          { label: "Bugün Aktif", value: `${activeToday}/${staffProfiles.length}`, icon: "🟢", accent: true },
          { label: "Bugün Log", value: String(logs.filter(l => l.log_date === todayStr).length), icon: "📋", accent: false },
          { label: "Görüntülenen", value: String(filteredLogs.length), icon: "🔍", accent: false },
        ].map(c => (
          <div key={c.label} className="card"
            style={c.accent ? { border: "2px solid #00abaa", backgroundColor: "#f0fffe" } : {}}>
            <span style={{ fontSize: 22, display: "block", marginBottom: 8 }}>{c.icon}</span>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Chalet', sans-serif", color: c.accent ? "#00abaa" : "#1e293b", marginTop: 4 }}>
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 12, padding: 4, width: "fit-content", gap: 4 }}>
        {(["logs", "users"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer",
            border: "none", transition: "all 0.15s",
            backgroundColor: tab === t ? "#ffffff" : "transparent",
            color: tab === t ? "#00abaa" : "#64748b",
            boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}>
            {t === "logs" ? "📋 Günlükler" : "👥 Personel"}
          </button>
        ))}
      </div>

      {/* Logs tab */}
      {tab === "logs" && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="label">Personel</label>
                <select className="input" style={{ width: 176 }} value={filterUser} onChange={e => setFilterUser(e.target.value)}>
                  <option value="">Tümü</option>
                  {staffProfiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Başlangıç Tarihi</label>
                <input type="date" className="input" style={{ width: 160 }} value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="label">Bitiş Tarihi</label>
                <input type="date" className="input" style={{ width: 160 }} value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button onClick={exportCSV} className="btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }}>⬇ CSV</button>
                <button onClick={exportExcel} className="btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>⬇ Excel</button>
              </div>
            </div>

            <div>
              <label className="label mb-2">Aktivite Filtresi (çoklu seçim)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(ACTIVITY_META).map(([k, v]) => (
                  <button key={k} onClick={() => toggleType(k)} style={{
                    fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99, cursor: "pointer",
                    border: `1px solid ${filterTypes.includes(k) ? v.border : "#e2e8f0"}`,
                    backgroundColor: filterTypes.includes(k) ? v.bg : "#ffffff",
                    color: filterTypes.includes(k) ? v.color : "#64748b",
                    transition: "all 0.15s",
                  }}>
                    {v.icon} {v.label}
                  </button>
                ))}
                {filterTypes.length > 0 && (
                  <button onClick={() => setFilterTypes([])} style={{
                    fontSize: 12, color: "#94a3b8", padding: "4px 10px", borderRadius: 99,
                    border: "1px solid #e2e8f0", backgroundColor: "white", cursor: "pointer",
                  }}>
                    Temizle ×
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                    <th style={{ textAlign: "left", padding: "12px 16px" }}><SortBtn col="full_name" label="Personel" /></th>
                    <th style={{ textAlign: "left", padding: "12px 16px" }}><SortBtn col="log_date" label="Tarih" /></th>
                    <th style={{ textAlign: "left", padding: "12px 16px" }}><SortBtn col="log_time" label="Saat" /></th>
                    <th style={{ textAlign: "left", padding: "12px 16px" }}><SortBtn col="activity_type" label="Aktivite" /></th>
                    <th style={{ textAlign: "left", padding: "12px 16px", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Not</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>Kayıt bulunamadı.</td></tr>
                  ) : filteredLogs.map(log => {
                    const meta = ACTIVITY_META[log.activity_type] ?? ACTIVITY_META.other;
                    return (
                      <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                        <td style={{ padding: "12px 16px", fontWeight: 500, color: "#1e293b" }}>{log.profiles?.full_name ?? "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#64748b", fontFamily: "monospace", fontSize: 13 }}>{log.log_date}</td>
                        <td style={{ padding: "12px 16px", color: "#00abaa", fontFamily: "monospace", fontWeight: 700 }}>{String(log.log_time).slice(0, 5)}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, backgroundColor: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                            {meta.icon} {meta.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748b", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.log_content}>
                          {log.log_content}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredLogs.length > 0 && (
              <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8" }}>
                <span>{filteredLogs.length} kayıt</span>
                <span>🔒 Veriler salt okunur</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users tab */}
      {tab === "users" && (
        <div className="card p-0 overflow-hidden">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                  {["Personel", "Rol", "Aylık Hedef", "Gerçekleşen", "Başarı", "Son Giriş"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>Veri yok.</td></tr>
                ) : profiles.map(p => {
                  const rate = p.monthly_target > 0 ? Math.round((p.current_sales / p.monthly_target) * 100) : 0;
                  const loggedToday = logs.some(l => l.user_id === p.id && l.log_date === todayStr);
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ position: "relative" }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: "50%", backgroundColor: "#e0f7f7",
                              border: "2px solid #00abaa", display: "flex", alignItems: "center",
                              justifyContent: "center", color: "#00abaa", fontWeight: 700, fontSize: 13, overflow: "hidden",
                            }}>
                              {p.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (p.full_name?.[0] ?? "?")}
                            </div>
                            {loggedToday && <span style={{ position: "absolute", top: -1, right: -1, width: 10, height: 10, borderRadius: "50%", backgroundColor: "#10b981", border: "2px solid white" }} />}
                          </div>
                          <span style={{ fontWeight: 500, color: "#1e293b" }}>{p.full_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                          backgroundColor: p.role === "admin" ? "#f5f3ff" : "#f8fafc",
                          color: p.role === "admin" ? "#8b5cf6" : "#64748b",
                          border: `1px solid ${p.role === "admin" ? "#ddd6fe" : "#e2e8f0"}`,
                        }}>
                          {p.role === "admin" ? "Sayfa Yöneticisi" : "Satış Profesyoneli"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{fmt(p.monthly_target)}</td>
                      <td style={{ padding: "12px 16px", color: "#1e293b", fontWeight: 500 }}>{fmt(p.current_sales)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 64, height: 6, backgroundColor: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: 99,
                              width: `${Math.min(rate, 100)}%`,
                              backgroundColor: rate >= 100 ? "#10b981" : rate >= 75 ? "#f59e0b" : "#00abaa",
                            }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: rate >= 100 ? "#10b981" : rate >= 75 ? "#f59e0b" : "#ef4444" }}>%{rate}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12 }}>
                        {p.last_login ? new Date(p.last_login).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
