"use client";
import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, DailyLog } from "@/types";

const ACTIVITY_META: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  call:    { label: "Satış Görüşmesi", icon: "📞", color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0" },
  visit:   { label: "Randevu Araması", icon: "📅", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  meeting: { label: "Ekip Toplantısı", icon: "🤝", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  other:   { label: "Diğer",           icon: "📌", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
  demo:    { label: "Demo",            icon: "🎯", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  email:   { label: "E-posta",         icon: "✉️", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
};

type Tab = "logs" | "users" | "messages";

function fmt(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n ?? 0);
}

export default function AdminClient({
  profiles,
  logs: initialLogs,
  defaultTab = "logs",
}: {
  profiles: (Profile & { last_login?: string })[];
  logs: (DailyLog & { profiles?: { full_name: string } })[];
  defaultTab?: Tab;
}) {
  const [tab, setTab]           = useState<Tab>(defaultTab);
  const [logs, setLogs]         = useState(initialLogs);
  const [filterUser, setFilterUser]       = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo]   = useState("");
  const [filterTypes, setFilterTypes]     = useState<string[]>([]);
  const [searchText, setSearchText]       = useState("");
  const [sortCol, setSortCol]   = useState("log_date");
  const [sortDir, setSortDir]   = useState<"asc" | "desc">("desc");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // initialLogs değişince sync et
  useEffect(() => { setLogs(initialLogs); }, [initialLogs]);

  const todayStr      = new Date().toISOString().split("T")[0];
  const staffProfiles = profiles.filter(p => p.role === "staff");

  const filteredLogs = useMemo(() => {
    let result = logs.filter(l => {
      if (filterUser && l.user_id !== filterUser) return false;
      if (filterDateFrom && l.log_date < filterDateFrom) return false;
      if (filterDateTo   && l.log_date > filterDateTo)   return false;
      if (filterTypes.length > 0 && !filterTypes.includes(l.activity_type)) return false;
      if (searchText) {
        const q    = searchText.toLowerCase();
        const name = l.profiles?.full_name?.toLowerCase() ?? "";
        const note = l.log_content?.toLowerCase() ?? "";
        if (!name.includes(q) && !note.includes(q)) return false;
      }
      return true;
    });
    return [...result].sort((a, b) => {
      let av = "", bv = "";
      if      (sortCol === "full_name")     { av = a.profiles?.full_name ?? ""; bv = b.profiles?.full_name ?? ""; }
      else if (sortCol === "log_date")      { av = a.log_date;           bv = b.log_date; }
      else if (sortCol === "log_time")      { av = String(a.log_time);   bv = String(b.log_time); }
      else if (sortCol === "activity_type") { av = a.activity_type;      bv = b.activity_type; }
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [logs, filterUser, filterDateFrom, filterDateTo, filterTypes, searchText, sortCol, sortDir]);

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  function toggleType(t: string) {
    setFilterTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function handleDeleteLog(id: string) {
    if (!confirm("Bu kaydı silmek istediğinizden emin misiniz?")) return;
    setDeletingId(id);
    const { error } = await createClient().from("daily_logs").delete().eq("id", id);
    if (!error) setLogs(prev => prev.filter(l => l.id !== id));
    setDeletingId(null);
  }

  async function exportCSV() {
    const headers = ["Personel", "Tarih", "Saat", "Aktivite", "Not"];
    const rows = filteredLogs.map(l => [
      l.profiles?.full_name ?? "", l.log_date,
      String(l.log_time).slice(0, 5),
      ACTIVITY_META[l.activity_type]?.label ?? l.activity_type,
      `"${(l.log_content ?? "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `gunlukler-${filterDateFrom || "tum"}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  async function exportExcel() {
    const { utils, writeFile } = await import("xlsx");
    const wsData = [
      ["Personel", "Tarih", "Saat", "Aktivite", "Not"],
      ...filteredLogs.map(l => [
        l.profiles?.full_name ?? "", l.log_date,
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

  const SortBtn = ({ col, label }: { col: string; label: string }) => (
    <button onClick={() => toggleSort(col)}
      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#ffffff", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", whiteSpace: "nowrap" as const }}>
      {label} <span style={{ fontSize: 10 }}>{sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div style={{ display: "flex", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 12, padding: 4, gap: 4, width: "fit-content", flexWrap: "wrap" }}>
        {([
          { id: "logs",     label: "📋 Günlükler" },
          { id: "users",    label: "👥 Personel" },
          { id: "messages", label: "✉️ Mesajlar" },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer",
            border: "none", transition: "all 0.15s", whiteSpace: "nowrap",
            backgroundColor: tab === t.id ? "#ffffff" : "transparent",
            color: tab === t.id ? "#00abaa" : "#64748b",
            boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── LOGS TAB ── */}
      {tab === "logs" && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              <style>{`@media(min-width:640px){.filter-grid{grid-template-columns:1fr 1fr!important}}`}</style>
              <div style={{ display: "contents" }} className="filter-grid">
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>Personel</label>
                  <select className="input" style={{ width: "100%" }} value={filterUser} onChange={e => setFilterUser(e.target.value)}>
                    <option value="">Tümü</option>
                    {staffProfiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>Başlangıç Tarihi</label>
                  <input type="date" className="input" style={{ width: "100%" }} value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>Bitiş Tarihi</label>
                  <input type="date" className="input" style={{ width: "100%" }} value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <button onClick={exportCSV}   className="btn-ghost"   style={{ fontSize: 13, flex: 1 }}>⬇ CSV</button>
                  <button onClick={exportExcel} className="btn-primary" style={{ fontSize: 13, flex: 1 }}>⬇ Excel</button>
                </div>
              </div>
            </div>

            {/* Metin arama */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>Metin Ara</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px" }}>
                <span style={{ color: "#94a3b8", flexShrink: 0 }}>🔍</span>
                <input type="text"
                  style={{ border: "none", outline: "none", flex: 1, fontSize: 14, backgroundColor: "transparent", color: "#1e293b" }}
                  placeholder="Personel adı veya not içinde ara…"
                  value={searchText} onChange={e => setSearchText(e.target.value)} />
                {searchText && (
                  <button onClick={() => setSearchText("")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>✕</button>
                )}
              </div>
            </div>

            {/* Aktivite filtresi */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>Aktivite Filtresi</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(ACTIVITY_META).map(([k, v]) => (
                  <button key={k} onClick={() => toggleType(k)} style={{
                    fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99, cursor: "pointer",
                    border: `1px solid ${filterTypes.includes(k) ? v.border : "#e2e8f0"}`,
                    backgroundColor: filterTypes.includes(k) ? v.bg : "#ffffff",
                    color: filterTypes.includes(k) ? v.color : "#64748b",
                    transition: "all 0.15s", whiteSpace: "nowrap",
                  }}>
                    {v.icon} {v.label}
                  </button>
                ))}
                {filterTypes.length > 0 && (
                  <button onClick={() => setFilterTypes([])} style={{ fontSize: 12, color: "#94a3b8", padding: "4px 10px", borderRadius: 99, border: "1px solid #e2e8f0", backgroundColor: "white", cursor: "pointer" }}>
                    Temizle ×
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 640 }}>
                <thead>
                  <tr style={{ backgroundColor: "#00abaa" }}>
                    <th style={{ textAlign: "left", padding: "12px 16px" }}><SortBtn col="full_name"     label="Personel" /></th>
                    <th style={{ textAlign: "left", padding: "12px 16px" }}><SortBtn col="log_date"      label="Tarih" /></th>
                    <th style={{ textAlign: "left", padding: "12px 16px" }}><SortBtn col="log_time"      label="Saat" /></th>
                    <th style={{ textAlign: "left", padding: "12px 16px" }}><SortBtn col="activity_type" label="Aktivite" /></th>
                    <th style={{ textAlign: "left", padding: "12px 16px", color: "#ffffff", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Not</th>
                    <th style={{ padding: "12px 16px", color: "#ffffff", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", textAlign: "center" }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>Kayıt bulunamadı.</td></tr>
                  ) : filteredLogs.map(log => {
                    const meta = ACTIVITY_META[log.activity_type] ?? ACTIVITY_META.other;
                    return (
                      <tr key={log.id}
                        style={{ borderBottom: "1px solid #f1f5f9", transition: "background-color 0.15s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "#e6f7f7"}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = ""}>
                        <td style={{ padding: "12px 16px", fontWeight: 500, color: "#1e293b", whiteSpace: "nowrap" }}>{log.profiles?.full_name ?? "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#64748b", fontFamily: "monospace", fontSize: 13, whiteSpace: "nowrap" }}>{log.log_date}</td>
                        <td style={{ padding: "12px 16px", color: "#00abaa", fontFamily: "monospace", fontWeight: 700, whiteSpace: "nowrap" }}>{String(log.log_time).slice(0, 5)}</td>
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, backgroundColor: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                            {meta.icon} {meta.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748b", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.log_content}>
                          {log.log_content}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <button onClick={() => handleDeleteLog(log.id)} disabled={deletingId === log.id}
                            style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#ef4444", cursor: "pointer", opacity: deletingId === log.id ? 0.5 : 1, whiteSpace: "nowrap" }}>
                            {deletingId === log.id ? "…" : "Sil"}
                          </button>
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
                <span>⚠ Silinen kayıtlar geri alınamaz</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── USERS TAB ── */}
      {tab === "users" && (
        <div className="card p-0 overflow-hidden">
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 700 }}>
              <thead>
                <tr style={{ backgroundColor: "#00abaa" }}>
                  {["Personel", "Rol", "Aylık Hedef", "Gerçekleşen", "Başarı", "Son Giriş"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "#ffffff", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>Veri yok.</td></tr>
                ) : profiles.map(p => {
                  const rate       = p.monthly_target > 0 ? Math.round((p.current_sales / p.monthly_target) * 100) : 0;
                  const loggedToday = initialLogs.some(l => l.user_id === p.id && l.log_date === todayStr);
                  return (
                    <tr key={p.id}
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background-color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "#e6f7f7"}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = ""}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "#e0f7f7", border: "2px solid #00abaa", display: "flex", alignItems: "center", justifyContent: "center", color: "#00abaa", fontWeight: 700, fontSize: 13, overflow: "hidden" }}>
                              {p.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (p.full_name?.[0] ?? "?")}
                            </div>
                            {loggedToday && <span style={{ position: "absolute", top: -1, right: -1, width: 10, height: 10, borderRadius: "50%", backgroundColor: "#10b981", border: "2px solid white" }} />}
                          </div>
                          <span style={{ fontWeight: 500, color: "#1e293b", whiteSpace: "nowrap" }}>{p.full_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, backgroundColor: p.role === "admin" ? "#f5f3ff" : "#f8fafc", color: p.role === "admin" ? "#8b5cf6" : "#64748b", border: `1px solid ${p.role === "admin" ? "#ddd6fe" : "#e2e8f0"}`, whiteSpace: "nowrap" }}>
                          {p.role === "admin" ? "Yönetici" : "Satış Pro"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b", whiteSpace: "nowrap" }}>{fmt(p.monthly_target)}</td>
                      <td style={{ padding: "12px 16px", color: "#1e293b", fontWeight: 500, whiteSpace: "nowrap" }}>{fmt(p.current_sales)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 48, height: 6, backgroundColor: "#e2e8f0", borderRadius: 99, overflow: "hidden", flexShrink: 0 }}>
                            <div style={{ height: "100%", borderRadius: 99, width: `${Math.min(rate, 100)}%`, backgroundColor: rate >= 100 ? "#10b981" : rate >= 75 ? "#f59e0b" : "#00abaa" }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: rate >= 100 ? "#10b981" : rate >= 75 ? "#f59e0b" : "#ef4444", whiteSpace: "nowrap" }}>%{rate}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12, whiteSpace: "nowrap" }}>
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

      {/* ── MESSAGES TAB ── */}
      {tab === "messages" && <MessagesPanel profiles={profiles} />}
    </div>
  );
}

// ── MESAJ PANELİ ─────────────────────────────────────────────────────────────
function MessagesPanel({ profiles }: { profiles: Profile[] }) {
  const [targetType, setTargetType]     = useState<"all" | "single">("all");
  const [targetUserId, setTargetUserId] = useState("");
  const [title, setTitle]   = useState("");
  const [body, setBody]     = useState("");
  const [sending, setSending]   = useState(false);
  const [msg, setMsg]           = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const supabase = createClient();
  const staffProfiles = profiles.filter(p => p.role === "staff");

  async function loadHistory() {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("type", "admin_message")
      .order("created_at", { ascending: false })
      .limit(20);
    setSentMessages(data ?? []);
    setLoadingHistory(false);
  }

  useEffect(() => { loadHistory(); }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setMsg({ type: "error", text: "Başlık zorunludur." }); return; }
    if (targetType === "single" && !targetUserId) { setMsg({ type: "error", text: "Lütfen bir personel seçin." }); return; }
    setSending(true); setMsg(null);

    const { error } = await supabase.from("announcements").insert({
      title:     title.trim(),
      body:      body.trim() || null,
      type:      "admin_message",
      is_active: true,
      priority:  0,
    });

    if (error) {
      setMsg({ type: "error", text: "Gönderilemedi: " + error.message });
    } else {
      setMsg({ type: "success", text: targetType === "all" ? "Tüm personele mesaj gönderildi!" : "Mesaj gönderildi!" });
      setTitle(""); setBody(""); setTargetType("all"); setTargetUserId("");
      loadHistory();
    }
    setSending(false);
    setTimeout(() => setMsg(null), 4000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu mesajı silmek istediğinizden emin misiniz?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    loadHistory();
  }

  const inp: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b", backgroundColor: "#fff", outline: "none", fontFamily: "inherit" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 700 as const, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 };

  return (
    <div className="space-y-5">
      {msg && (
        <div style={{ display: "flex", gap: 8, borderRadius: 12, padding: "12px 16px", backgroundColor: msg.type === "error" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${msg.type === "error" ? "#fecaca" : "#bbf7d0"}` }}>
          <span style={{ color: msg.type === "error" ? "#ef4444" : "#10b981", flexShrink: 0 }}>{msg.type === "error" ? "⚠" : "✓"}</span>
          <p style={{ color: msg.type === "error" ? "#dc2626" : "#059669", fontSize: 14 }}>{msg.text}</p>
        </div>
      )}

      <div className="card space-y-4" style={{ border: "1px solid #b2eded", backgroundColor: "#f0fffe" }}>
        <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 17 }}>Yeni Mesaj Gönder</h3>
        <form onSubmit={handleSend} className="space-y-4">

          <div>
            <label style={lbl}>Alıcı</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={() => { setTargetType("all"); setTargetUserId(""); }}
                style={{ padding: "8px 18px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", backgroundColor: targetType === "all" ? "#00abaa" : "#f1f5f9", color: targetType === "all" ? "#fff" : "#64748b", transition: "all .15s" }}>
                👥 Tüm Personel
              </button>
              <button type="button" onClick={() => setTargetType("single")}
                style={{ padding: "8px 18px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", backgroundColor: targetType === "single" ? "#00abaa" : "#f1f5f9", color: targetType === "single" ? "#fff" : "#64748b", transition: "all .15s" }}>
                👤 Belirli Personel
              </button>
            </div>
          </div>

          {targetType === "single" && (
            <div>
              <label style={lbl}>Personel Seç</label>
              <select style={inp} value={targetUserId} onChange={e => setTargetUserId(e.target.value)} required>
                <option value="">Seçiniz…</option>
                {staffProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={lbl}>Başlık</label>
            <input style={inp} placeholder="Mesaj başlığı…" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div>
            <label style={lbl}>İçerik (opsiyonel)</label>
            <textarea style={{ ...inp, resize: "none" } as React.CSSProperties} rows={3} placeholder="Mesaj detayı…" value={body} onChange={e => setBody(e.target.value)} />
          </div>

          <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8 }}>
            <span style={{ flexShrink: 0 }}>ℹ️</span>
            <p style={{ fontSize: 12, color: "#92400e", lineHeight: 1.5 }}>
              Mesajlar şu an dashboard duyurular bölümünde görünüyor. Yakında ayrı bir mesajlaşma arayüzüne taşınacak.
            </p>
          </div>

          <button type="submit" disabled={sending}
            style={{ padding: "10px 24px", borderRadius: 10, border: "none", backgroundColor: "#00abaa", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {sending ? "Gönderiliyor…" : "Mesaj Gönder →"}
          </button>
        </form>
      </div>

      {/* Gönderilen mesajlar */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Gönderilen Mesajlar</p>
        {loadingHistory ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>Yükleniyor…</div>
        ) : sentMessages.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>✉️</div>
            <p>Henüz mesaj gönderilmemiş.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sentMessages.map(m => (
              <div key={m.id} className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: "#1e293b", fontSize: 14, marginBottom: 3 }}>{m.title}</p>
                  {m.body && <p style={{ color: "#64748b", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.body}</p>}
                  <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>
                    {new Date(m.created_at).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button onClick={() => handleDelete(m.id)}
                  style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#ef4444", cursor: "pointer", flexShrink: 0 }}>
                  Sil
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
