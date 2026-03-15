"use client";
import { useState, useMemo } from "react";
import type { Profile, DailyLog, ActivityType } from "@/types";
import { ACTIVITY_META } from "@/types";

type Tab = "logs" | "users";

function fmt(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n ?? 0);
}

export default function AdminClient({
  profiles,
  logs,
  defaultTab = "logs",
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
  const [sortCol, setSortCol] = useState<string>("log_date");
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
      let av: string = "", bv: string = "";
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
    const headers = ["Personel", "Tarih", "Saat", "Aktivite", "Not", "Kayit Zamani"];
    const rows = filteredLogs.map(l => [
      l.profiles?.full_name ?? "",
      l.log_date,
      String(l.log_time).slice(0, 5),
      ACTIVITY_META[l.activity_type as ActivityType]?.label ?? l.activity_type,
      `"${(l.log_content ?? "").replace(/"/g, '""')}"`,
      new Date(l.created_at).toLocaleString("tr-TR"),
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
      ["Personel", "Tarih", "Saat", "Aktivite", "Not", "Kayit Zamani"],
      ...filteredLogs.map(l => [
        l.profiles?.full_name ?? "",
        l.log_date,
        String(l.log_time).slice(0, 5),
        ACTIVITY_META[l.activity_type as ActivityType]?.label ?? l.activity_type,
        l.log_content ?? "",
        new Date(l.created_at).toLocaleString("tr-TR"),
      ]),
    ];
    const ws = utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 50 }, { wch: 20 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Gunlukler");
    writeFile(wb, `gunlukler-${filterDateFrom || "tum"}.xlsx`);
  }

  const activeToday = new Set(logs.filter(l => l.log_date === todayStr).map(l => l.user_id)).size;

  const SortBtn = ({ col, label }: { col: string; label: string }) => (
    <button onClick={() => toggleSort(col)}
      className="flex items-center gap-1 hover:text-stone-200 transition-colors group">
      {label}
      <span className="text-stone-600 group-hover:text-stone-400 text-xs">
        {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {[
          { label: "Toplam Personel", value: String(staffProfiles.length), icon: "👥" },
          { label: "Bugun Aktif", value: `${activeToday}/${staffProfiles.length}`, icon: "🟢", accent: true },
          { label: "Bugun Log", value: String(logs.filter(l => l.log_date === todayStr).length), icon: "📋" },
          { label: "Gorutulen", value: String(filteredLogs.length), icon: "🔍" },
        ].map(c => (
          <div key={c.label} className={`card ${c.accent ? "border-emerald-500/20 bg-emerald-900/10" : ""}`}>
            <span className="text-xl mb-2 block">{c.icon}</span>
            <p className="label">{c.label}</p>
            <p className={`text-2xl font-bold font-display ${c.accent ? "text-emerald-400" : "text-stone-100"}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-2 border border-surface-3 rounded-xl p-1 w-fit">
        {(["logs", "users"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              tab === t ? "bg-brand-500/20 text-brand-300 border border-brand-500/30" : "text-stone-500 hover:text-stone-200"
            }`}>
            {t === "logs" ? "📋 Gunlukler" : "👥 Personel"}
          </button>
        ))}
      </div>

      {/* Logs tab */}
      {tab === "logs" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="card space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="label">Personel</label>
                <select className="input w-44" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
                  <option value="">Tumu</option>
                  {staffProfiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Baslangic Tarihi</label>
                <input type="date" className="input w-40" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="label">Bitis Tarihi</label>
                <input type="date" className="input w-40" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
              </div>
              <div className="flex gap-2 ml-auto">
                <button onClick={exportCSV} className="btn-ghost text-xs px-4 py-2">⬇ CSV</button>
                <button onClick={exportExcel} className="btn-primary text-xs px-4 py-2">⬇ Excel</button>
              </div>
            </div>

            {/* Activity type multi-select */}
            <div>
              <label className="label mb-2">Aktivite Filtresi (coklu secim)</label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(ACTIVITY_META) as [ActivityType, typeof ACTIVITY_META[ActivityType]][]).map(([k, v]) => (
                  <button key={k} onClick={() => toggleType(k)}
                    className={`badge transition-all ${filterTypes.includes(k) ? v.color : "bg-surface-2 border-surface-4 text-stone-500 hover:text-stone-300"}`}>
                    {v.icon} {v.label}
                  </button>
                ))}
                {filterTypes.length > 0 && (
                  <button onClick={() => setFilterTypes([])}
                    className="text-xs text-stone-500 hover:text-stone-300 px-2 py-1 rounded-lg border border-surface-3 hover:border-surface-4 transition-colors">
                    Temizle ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-3 bg-surface-2">
                    <th className="text-left px-4 py-3 text-stone-500 font-semibold text-xs uppercase tracking-wider">
                      <SortBtn col="full_name" label="Personel" />
                    </th>
                    <th className="text-left px-4 py-3 text-stone-500 font-semibold text-xs uppercase tracking-wider">
                      <SortBtn col="log_date" label="Tarih" />
                    </th>
                    <th className="text-left px-4 py-3 text-stone-500 font-semibold text-xs uppercase tracking-wider">
                      <SortBtn col="log_time" label="Saat" />
                    </th>
                    <th className="text-left px-4 py-3 text-stone-500 font-semibold text-xs uppercase tracking-wider">
                      <SortBtn col="activity_type" label="Aktivite" />
                    </th>
                    <th className="text-left px-4 py-3 text-stone-500 font-semibold text-xs uppercase tracking-wider">Not</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-3">
                  {filteredLogs.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-stone-600">Kayit bulunamadi.</td></tr>
                  ) : filteredLogs.map(log => {
                    const meta = ACTIVITY_META[log.activity_type as ActivityType] ?? ACTIVITY_META.other;
                    return (
                      <tr key={log.id} className="hover:bg-surface-2 transition-colors duration-100">
                        <td className="px-4 py-3 font-medium text-stone-200">{log.profiles?.full_name ?? "—"}</td>
                        <td className="px-4 py-3 text-stone-400 font-mono text-xs">{log.log_date}</td>
                        <td className="px-4 py-3 text-brand-400 font-mono font-bold">{String(log.log_time).slice(0, 5)}</td>
                        <td className="px-4 py-3"><span className={`badge ${meta.color}`}>{meta.icon} {meta.label}</span></td>
                        <td className="px-4 py-3 text-stone-400 max-w-xs truncate" title={log.log_content}>{log.log_content}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredLogs.length > 0 && (
              <div className="px-4 py-3 border-t border-surface-3 text-xs text-stone-600 flex justify-between">
                <span>{filteredLogs.length} kayit</span>
                <span>🔒 Veriler salt okunur</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users tab */}
      {tab === "users" && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-3 bg-surface-2">
                  {["Personel", "Rol", "Aylik Hedef", "Gerceklesen", "Basari", "Son Giris"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-stone-500 font-semibold text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-3">
                {profiles.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-stone-600">Veri yok.</td></tr>
                ) : profiles.map(p => {
                  const rate = p.monthly_target > 0 ? Math.round((p.current_sales / p.monthly_target) * 100) : 0;
                  const loggedToday = logs.some(l => l.user_id === p.id && l.log_date === todayStr);
                  return (
                    <tr key={p.id} className="hover:bg-surface-2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div className="w-7 h-7 rounded-full bg-brand-600/30 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-xs">
                              {p.full_name?.[0] ?? "?"}
                            </div>
                            {loggedToday && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-surface-1" />}
                          </div>
                          <span className="font-medium text-stone-200">{p.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${p.role === "admin" ? "bg-violet-500/15 border-violet-500/30 text-violet-300" : "bg-surface-3 border-surface-4 text-stone-400"}`}>
                          {p.role === "admin" ? "Admin" : "Personel"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-400">{fmt(p.monthly_target)}</td>
                      <td className="px-4 py-3 text-stone-200 font-medium">{fmt(p.current_sales)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${rate >= 100 ? "bg-emerald-500" : rate >= 75 ? "bg-amber-500" : "bg-brand-500"}`}
                              style={{ width: `${Math.min(rate, 100)}%` }} />
                          </div>
                          <span className={`font-bold text-xs ${rate >= 100 ? "text-emerald-400" : rate >= 75 ? "text-amber-400" : "text-rose-400"}`}>%{rate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stone-500 text-xs">
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
