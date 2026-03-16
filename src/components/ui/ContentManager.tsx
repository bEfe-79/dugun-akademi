"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DictTerm {
  id: string;
  term_name: string;
  description: string;
  category: string;
  acronym_full?: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  is_published: boolean;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: "announcement" | "quote_of_day" | "alert";
  is_active: boolean;
  priority: number;
}

type Tab = "dictionary" | "articles" | "announcements";

// ── Helpers ───────────────────────────────────────────────────────────────────
const inp = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b",
  backgroundColor: "#fff", outline: "none", fontFamily: "inherit",
} as React.CSSProperties;

const lbl = {
  display: "block", fontSize: 11, fontWeight: 700 as const,
  color: "#64748b", textTransform: "uppercase" as const,
  letterSpacing: "0.08em", marginBottom: 6,
};

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={lbl}>{label}</label>{children}</div>;
}

function Alert({ type, msg }: { type: "error" | "success"; msg: string }) {
  return (
    <div style={{
      display: "flex", gap: 8, borderRadius: 12, padding: "12px 16px",
      backgroundColor: type === "error" ? "#fef2f2" : "#f0fdf4",
      border: `1px solid ${type === "error" ? "#fecaca" : "#bbf7d0"}`,
    }}>
      <span style={{ color: type === "error" ? "#ef4444" : "#10b981" }}>{type === "error" ? "⚠" : "✓"}</span>
      <p style={{ color: type === "error" ? "#dc2626" : "#059669", fontSize: 14 }}>{msg}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function ContentManager() {
  const [tab, setTab] = useState<Tab>("dictionary");

  const TABS: { id: Tab; label: string }[] = [
    { id: "dictionary",    label: "📖 Satış Sözlüğü" },
    { id: "articles",      label: "📚 Kitap Önerileri" },
    { id: "announcements", label: "📣 Duyurular" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div style={{ display: "flex", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 12, padding: 4, width: "fit-content", gap: 4, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 16px", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer",
            border: "none", transition: "all 0.15s",
            backgroundColor: tab === t.id ? "#ffffff" : "transparent",
            color: tab === t.id ? "#00abaa" : "#64748b",
            boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "dictionary"    && <DictionaryManager />}
      {tab === "articles"      && <ArticlesManager />}
      {tab === "announcements" && <AnnouncementsManager />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DICTIONARY MANAGER
// ══════════════════════════════════════════════════════════════════════════════
function DictionaryManager() {
  const [terms, setTerms]       = useState<DictTerm[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [editTerm, setEditTerm] = useState<DictTerm | null>(null);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState<{ type: "error"|"success"; text: string } | null>(null);
  const [search, setSearch]     = useState("");
  const addFormRef  = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data } = await createClient().from("sales_dictionary").select("*").order("term_name");
    setTerms(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const term_name = `${fd.get("term_name")}${fd.get("acronym_full") ? ` (${fd.get("acronym_full")})` : ""}`;
    const { error } = await createClient().from("sales_dictionary").insert({
      term_name,
      description: fd.get("description"),
      category:    fd.get("category") || "Genel",
    });
    if (error) { setMsg({ type: "error", text: error.message }); }
    else { setMsg({ type: "success", text: "Terim eklendi!" }); setShowAdd(false); addFormRef.current?.reset(); load(); }
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!editTerm) return; setSaving(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const term_name = `${fd.get("term_name")}${fd.get("acronym_full") ? ` (${fd.get("acronym_full")})` : ""}`;
    const { error } = await createClient().from("sales_dictionary").update({
      term_name,
      description: fd.get("description"),
      category:    fd.get("category") || "Genel",
    }).eq("id", editTerm.id);
    if (error) { setMsg({ type: "error", text: error.message }); }
    else { setMsg({ type: "success", text: "Terim güncellendi!" }); setEditTerm(null); load(); }
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" terimini silmek istediğinizden emin misiniz?`)) return;
    const { error } = await createClient().from("sales_dictionary").delete().eq("id", id);
    if (error) setMsg({ type: "error", text: error.message });
    else { setMsg({ type: "success", text: "Terim silindi." }); load(); }
    setTimeout(() => setMsg(null), 3000);
  }

  async function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true); setMsg(null);
    try {
      const { read, utils } = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb  = read(buf);
      const ws  = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json<Record<string, string>>(ws);

      const inserts = rows
        .filter(r => r["Terim"] || r["terim"])
        .map(r => {
          const terim    = (r["Terim"]    || r["terim"]    || "").trim();
          const acilim   = (r["Açılım"]  || r["acilim"]   || r["Acilim"] || "").trim();
          const aciklama = (r["Açıklama"]|| r["aciklama"]  || r["Aciklama"] || "").trim();
          const kategori = (r["Kategori"]|| r["kategori"]  || "Genel").trim();
          const term_name = acilim ? `${terim} (${acilim})` : terim;
          return { term_name, description: aciklama || "—", category: kategori };
        });

      if (inserts.length === 0) { setMsg({ type: "error", text: "Dosyada uygun satır bulunamadı." }); setSaving(false); return; }

      const { error } = await createClient().from("sales_dictionary").upsert(inserts, { onConflict: "term_name" });
      if (error) setMsg({ type: "error", text: error.message });
      else { setMsg({ type: "success", text: `${inserts.length} terim yüklendi!` }); load(); }
    } catch (err) {
      setMsg({ type: "error", text: "Dosya okunamadı: " + String(err) });
    }
    setSaving(false); setTimeout(() => setMsg(null), 4000);
    if (fileRef.current) fileRef.current.value = "";
  }

  // Parse term_name → kısaltma + açılım
  function parseTerm(t: DictTerm) {
    const m = t.term_name.match(/^(.+?)\s*\((.+)\)$/);
    return m ? { name: m[1].trim(), full: m[2].trim() } : { name: t.term_name, full: "" };
  }

  const filtered = terms.filter(t =>
    t.term_name.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {msg && <Alert type={msg.type} msg={msg.text} />}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input type="text" placeholder="Terim ara…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inp, width: 220 }} />
        <button onClick={() => { setShowAdd(!showAdd); setEditTerm(null); }} className="btn-primary" style={{ fontSize: 13 }}>
          {showAdd ? "İptal" : "+ Terim Ekle"}
        </button>
        <label className="btn-ghost" style={{ fontSize: 13, cursor: "pointer" }}>
          📥 Excel Yükle
          <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleExcelUpload} disabled={saving} />
        </label>
        <a href="/sozluk-sablonu.xlsx" download style={{ fontSize: 13, color: "#00abaa", textDecoration: "none" }}>⬇ Şablon İndir</a>
        <span style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 13 }}>{terms.length} terim</span>
      </div>

      {/* Excel format info */}
      <div style={{ backgroundColor: "#f0fffe", border: "1px solid #b2eded", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#475569" }}>
        📋 Excel kolon sırası: <strong>Terim</strong> · <strong>Açılım</strong> · <strong>Açıklama</strong> · <strong>Kategori</strong>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card space-y-4" style={{ border: "1px solid #b2eded", backgroundColor: "#f0fffe" }}>
          <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 17 }}>Yeni Terim Ekle</h3>
          <form ref={addFormRef} onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Terim (Kısaltma)"><input name="term_name" style={inp} placeholder="ör. ROI" required /></F>
              <F label="Açılım"><input name="acronym_full" style={inp} placeholder="ör. Return on Investment" /></F>
              <F label="Kategori"><input name="category" style={inp} placeholder="ör. Finans, Metodoloji…" /></F>
              <div className="sm:col-span-1" />
              <div className="sm:col-span-2">
                <F label="Açıklama">
                  <textarea name="description" rows={3} required style={{ ...inp, resize: "none" }}
                    placeholder="Bu terimin kısa açıklaması…" />
                </F>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? "Ekleniyor…" : "Ekle"}</button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost">İptal</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit form */}
      {editTerm && (
        <div className="card space-y-4" style={{ border: "1px solid #fde68a", backgroundColor: "#fffbeb" }}>
          <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 17 }}>Düzenle: {editTerm.term_name}</h3>
          <form ref={editFormRef} onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Terim (Kısaltma)"><input name="term_name" style={inp} defaultValue={parseTerm(editTerm).name} required /></F>
              <F label="Açılım"><input name="acronym_full" style={inp} defaultValue={parseTerm(editTerm).full} /></F>
              <F label="Kategori"><input name="category" style={inp} defaultValue={editTerm.category} /></F>
              <div />
              <div className="sm:col-span-2">
                <F label="Açıklama">
                  <textarea name="description" rows={3} required style={{ ...inp, resize: "none" }} defaultValue={editTerm.description} />
                </F>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? "Kaydediliyor…" : "Kaydet"}</button>
              <button type="button" onClick={() => setEditTerm(null)} className="btn-ghost">İptal</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Yükleniyor…</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
          {search ? "Arama sonucu bulunamadı." : "Henüz terim eklenmemiş."}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ backgroundColor: "#00abaa" }}>
                {["Terim", "Açılım", "Kategori", "Açıklama", "İşlem"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const { name, full } = parseTerm(t);
                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#e6f7f7")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap" }}>{name}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 13 }}>{full || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: "#e0f7f7", color: "#00abaa", border: "1px solid #b2eded" }}>{t.category}</span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={t.description}>{t.description}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setEditTerm(t); setShowAdd(false); }} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#475569", cursor: "pointer" }}>Düzenle</button>
                        <button onClick={() => handleDelete(t.id, t.term_name)} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#ef4444", cursor: "pointer" }}>Sil</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ARTICLES MANAGER
// ══════════════════════════════════════════════════════════════════════════════
function ArticlesManager() {
  const [articles, setArticles]   = useState<Article[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [editArt, setEditArt]     = useState<Article | null>(null);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState<{ type: "error"|"success"; text: string } | null>(null);
  const addFormRef  = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  async function load() {
    setLoading(true);
    const { data } = await createClient().from("knowledge_base").select("*").order("created_at", { ascending: false });
    setArticles(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const { error } = await createClient().from("knowledge_base").insert({
      title:        fd.get("title"),
      content:      fd.get("content"),
      category:     fd.get("category") || "Genel",
      is_published: fd.get("is_published") === "true",
    });
    if (error) setMsg({ type: "error", text: error.message });
    else { setMsg({ type: "success", text: "Makale eklendi!" }); setShowAdd(false); addFormRef.current?.reset(); load(); }
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!editArt) return; setSaving(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const { error } = await createClient().from("knowledge_base").update({
      title:        fd.get("title"),
      content:      fd.get("content"),
      category:     fd.get("category") || "Genel",
      is_published: fd.get("is_published") === "true",
    }).eq("id", editArt.id);
    if (error) setMsg({ type: "error", text: error.message });
    else { setMsg({ type: "success", text: "Makale güncellendi!" }); setEditArt(null); load(); }
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" makalesini silmek istediğinizden emin misiniz?`)) return;
    const { error } = await createClient().from("knowledge_base").delete().eq("id", id);
    if (error) setMsg({ type: "error", text: error.message });
    else { setMsg({ type: "success", text: "Makale silindi." }); load(); }
    setTimeout(() => setMsg(null), 3000);
  }

  async function togglePublish(art: Article) {
    const { error } = await createClient().from("knowledge_base").update({ is_published: !art.is_published }).eq("id", art.id);
    if (!error) load();
  }

  const ArticleForm = ({ formRef, onSubmit, defaultValues }: { formRef: React.RefObject<HTMLFormElement>; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; defaultValues?: Article }) => (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <F label="Başlık"><input name="title" style={inp} placeholder="Kitap / Makale Adı" required defaultValue={defaultValues?.title} /></F>
        </div>
        <F label="Kategori"><input name="category" style={inp} placeholder="ör. Satış, Liderlik, Kişisel Gelişim" defaultValue={defaultValues?.category} /></F>
        <F label="Yayın Durumu">
          <select name="is_published" style={inp} defaultValue={defaultValues ? String(defaultValues.is_published) : "true"}>
            <option value="true">Yayında</option>
            <option value="false">Gizli</option>
          </select>
        </F>
        <div className="sm:col-span-2">
          <F label="İçerik / Özet">
            <textarea name="content" rows={8} required style={{ ...inp, resize: "vertical" }}
              placeholder="Kitap özeti, okuma notları veya tavsiye nedeni…"
              defaultValue={defaultValues?.content} />
          </F>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Kaydediliyor…" : (defaultValues ? "Güncelle" : "Ekle")}</button>
        <button type="button" onClick={() => defaultValues ? setEditArt(null) : setShowAdd(false)} className="btn-ghost">İptal</button>
      </div>
    </form>
  );

  return (
    <div className="space-y-5">
      {msg && <Alert type={msg.type} msg={msg.text} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>{articles.length} makale</span>
        <button onClick={() => { setShowAdd(!showAdd); setEditArt(null); }} className="btn-primary" style={{ fontSize: 13 }}>
          {showAdd ? "İptal" : "+ Yeni Ekle"}
        </button>
      </div>

      {showAdd && (
        <div className="card space-y-4" style={{ border: "1px solid #b2eded", backgroundColor: "#f0fffe" }}>
          <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 17 }}>Yeni Kitap / Makale Ekle</h3>
          <ArticleForm formRef={addFormRef} onSubmit={handleAdd} />
        </div>
      )}

      {editArt && (
        <div className="card space-y-4" style={{ border: "1px solid #fde68a", backgroundColor: "#fffbeb" }}>
          <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 17 }}>Düzenle: {editArt.title}</h3>
          <ArticleForm formRef={editFormRef} onSubmit={handleEdit} defaultValues={editArt} />
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Yükleniyor…</div>
      ) : articles.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Henüz makale eklenmemiş.</div>
      ) : (
        <div className="space-y-2">
          {articles.map(a => (
            <div key={a.id} className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <p style={{ fontWeight: 600, color: "#1e293b", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</p>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: "#e0f7f7", color: "#00abaa", border: "1px solid #b2eded", flexShrink: 0 }}>{a.category}</span>
                  {!a.is_published && <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0", flexShrink: 0 }}>Gizli</span>}
                </div>
                <p style={{ color: "#94a3b8", fontSize: 12 }}>
                  {new Date(a.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => togglePublish(a)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: `1px solid ${a.is_published ? "#bbf7d0" : "#e2e8f0"}`, backgroundColor: a.is_published ? "#f0fdf4" : "#f8fafc", color: a.is_published ? "#10b981" : "#64748b", cursor: "pointer" }}>
                  {a.is_published ? "Gizle" : "Yayınla"}
                </button>
                <button onClick={() => { setEditArt(a); setShowAdd(false); }} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#475569", cursor: "pointer" }}>Düzenle</button>
                <button onClick={() => handleDelete(a.id, a.title)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#ef4444", cursor: "pointer" }}>Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS MANAGER
// ══════════════════════════════════════════════════════════════════════════════
function AnnouncementsManager() {
  const [items, setItems]       = useState<Announcement[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [editItem, setEditItem] = useState<Announcement | null>(null);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState<{ type: "error"|"success"; text: string } | null>(null);
  const addFormRef  = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  async function load() {
    setLoading(true);
    const { data } = await createClient().from("announcements").select("*").order("priority", { ascending: false }).order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const { error } = await createClient().from("announcements").insert({
      title:     fd.get("title"),
      body:      fd.get("body"),
      type:      fd.get("type"),
      is_active: fd.get("is_active") === "true",
      priority:  Number(fd.get("priority") || 0),
    });
    if (error) setMsg({ type: "error", text: error.message });
    else { setMsg({ type: "success", text: "Duyuru eklendi!" }); setShowAdd(false); addFormRef.current?.reset(); load(); }
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!editItem) return; setSaving(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const { error } = await createClient().from("announcements").update({
      title:     fd.get("title"),
      body:      fd.get("body"),
      type:      fd.get("type"),
      is_active: fd.get("is_active") === "true",
      priority:  Number(fd.get("priority") || 0),
    }).eq("id", editItem.id);
    if (error) setMsg({ type: "error", text: error.message });
    else { setMsg({ type: "success", text: "Duyuru güncellendi!" }); setEditItem(null); load(); }
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" duyurusunu silmek istediğinizden emin misiniz?`)) return;
    const { error } = await createClient().from("announcements").delete().eq("id", id);
    if (error) setMsg({ type: "error", text: error.message });
    else { setMsg({ type: "success", text: "Duyuru silindi." }); load(); }
    setTimeout(() => setMsg(null), 3000);
  }

  async function toggleActive(item: Announcement) {
    const { error } = await createClient().from("announcements").update({ is_active: !item.is_active }).eq("id", item.id);
    if (!error) load();
  }

  const TYPE_LABELS: Record<string, string> = {
    announcement: "📢 Duyuru",
    quote_of_day: "✦ Günün Sözü",
    alert:        "⚠ Uyarı",
  };

  const AnnouncementForm = ({ formRef, onSubmit, dv }: { formRef: React.RefObject<HTMLFormElement>; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; dv?: Announcement }) => (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <F label="Başlık"><input name="title" style={inp} placeholder="Duyuru başlığı…" required defaultValue={dv?.title} /></F>
        </div>
        <F label="Tür">
          <select name="type" style={inp} defaultValue={dv?.type ?? "announcement"}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </F>
        <F label="Durum">
          <select name="is_active" style={inp} defaultValue={dv ? String(dv.is_active) : "true"}>
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </select>
        </F>
        <F label="Öncelik (yüksek = üstte)">
          <input name="priority" type="number" style={inp} placeholder="0" defaultValue={dv?.priority ?? 0} />
        </F>
        <div />
        <div className="sm:col-span-2">
          <F label="İçerik / Alt Metin">
            <textarea name="body" rows={3} style={{ ...inp, resize: "none" }}
              placeholder="Duyuru detayı veya alıntı kaynağı…" defaultValue={dv?.body} />
          </F>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Kaydediliyor…" : (dv ? "Güncelle" : "Ekle")}</button>
        <button type="button" onClick={() => dv ? setEditItem(null) : setShowAdd(false)} className="btn-ghost">İptal</button>
      </div>
    </form>
  );

  return (
    <div className="space-y-5">
      {msg && <Alert type={msg.type} msg={msg.text} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>{items.length} duyuru</span>
        <button onClick={() => { setShowAdd(!showAdd); setEditItem(null); }} className="btn-primary" style={{ fontSize: 13 }}>
          {showAdd ? "İptal" : "+ Yeni Duyuru"}
        </button>
      </div>

      {showAdd && (
        <div className="card space-y-4" style={{ border: "1px solid #b2eded", backgroundColor: "#f0fffe" }}>
          <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 17 }}>Yeni Duyuru Ekle</h3>
          <AnnouncementForm formRef={addFormRef} onSubmit={handleAdd} />
        </div>
      )}

      {editItem && (
        <div className="card space-y-4" style={{ border: "1px solid #fde68a", backgroundColor: "#fffbeb" }}>
          <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 17 }}>Düzenle: {editItem.title}</h3>
          <AnnouncementForm formRef={editFormRef} onSubmit={handleEdit} dv={editItem} />
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Yükleniyor…</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Henüz duyuru eklenmemiş.</div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", opacity: item.is_active ? 1 : 0.5 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <p style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{item.title}</p>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: "#e0f7f7", color: "#00abaa", border: "1px solid #b2eded" }}>
                    {TYPE_LABELS[item.type]}
                  </span>
                  {item.priority > 0 && (
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>Öncelik: {item.priority}</span>
                  )}
                  {!item.is_active && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0" }}>Pasif</span>
                  )}
                </div>
                {item.body && <p style={{ color: "#64748b", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.body}</p>}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => toggleActive(item)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: `1px solid ${item.is_active ? "#bbf7d0" : "#e2e8f0"}`, backgroundColor: item.is_active ? "#f0fdf4" : "#f8fafc", color: item.is_active ? "#10b981" : "#64748b", cursor: "pointer" }}>
                  {item.is_active ? "Pasife Al" : "Aktifleştir"}
                </button>
                <button onClick={() => { setEditItem(item); setShowAdd(false); }} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#475569", cursor: "pointer" }}>Düzenle</button>
                <button onClick={() => handleDelete(item.id, item.title)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#ef4444", cursor: "pointer" }}>Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
