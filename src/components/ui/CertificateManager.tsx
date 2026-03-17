"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Certificate {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  issued_at: string;
  user_id: string;
  exam_id: string | null;
  profiles?: { full_name: string; avatar_url?: string } | null;
  exams?: { title: string } | null;
}

interface Profile { id: string; full_name: string; avatar_url?: string; }
interface Exam    { id: string; title: string; }

const inp: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b", backgroundColor: "#fff", outline: "none", fontFamily: "inherit" };
const lbl = { display: "block", fontSize: 11, fontWeight: 700 as const, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 };
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={lbl}>{label}</label>{children}</div>;
}

export default function CertificateManager() {
  const [certs, setCerts]       = useState<Certificate[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [exams, setExams]       = useState<Exam[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState<{ type: "error"|"success"; text: string } | null>(null);
  const [filterUser, setFilterUser] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const [certsRes, profilesRes, examsRes] = await Promise.all([
      supabase.from("certificates").select("*, profiles(full_name, avatar_url), exams(title)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, avatar_url").order("full_name"),
      supabase.from("exams").select("id, title").eq("is_published", true).order("title"),
    ]);
    setCerts(certsRes.data ?? []);
    setProfiles(profilesRes.data ?? []);
    setExams(examsRes.data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const file = fileRef.current?.files?.[0];
    if (!file) { setMsg({ type: "error", text: "Dosya seçiniz." }); setSaving(false); return; }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
    const userId = fd.get("user_id") as string;
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("certificates").upload(path, file, { upsert: true });
    if (uploadErr) { setMsg({ type: "error", text: "Dosya yüklenemedi: " + uploadErr.message }); setSaving(false); return; }
    const file_url = supabase.storage.from("certificates").getPublicUrl(path).data.publicUrl;

    const { data: { session } } = await supabase.auth.getSession();
    const examId = fd.get("exam_id") as string;
    const { error } = await supabase.from("certificates").insert({
      user_id:   userId,
      exam_id:   examId || null,
      title:     fd.get("title"),
      file_url,
      file_type: ext === "pdf" ? "pdf" : ["png","jpg","jpeg"].includes(ext) ? ext : "pdf",
      issued_at: fd.get("issued_at") || new Date().toISOString().split("T")[0],
      issued_by: session?.user?.id,
    });

    if (error) setMsg({ type: "error", text: error.message });
    else { setMsg({ type: "success", text: "Sertifika yüklendi!" }); setShowAdd(false); load(); }
    setSaving(false); setTimeout(() => setMsg(null), 4000);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" sertifikasını silmek istediğinizden emin misiniz?`)) return;
    const { error } = await supabase.from("certificates").delete().eq("id", id);
    if (error) setMsg({ type: "error", text: error.message });
    else { setMsg({ type: "success", text: "Silindi." }); load(); }
    setTimeout(() => setMsg(null), 3000);
  }

  async function exportExcel() {
    const { utils, writeFile } = await import("xlsx");
    const data = filterUser ? certs.filter(c => c.user_id === filterUser) : certs;
    const wsData = [
      ["Personel", "Sertifika Başlığı", "Sınav", "Veriliş Tarihi", "Dosya URL"],
      ...data.map(c => [c.profiles?.full_name ?? "", c.title, c.exams?.title ?? "", c.issued_at, c.file_url]),
    ];
    const ws = utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 25 }, { wch: 35 }, { wch: 25 }, { wch: 15 }, { wch: 60 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Sertifikalar");
    writeFile(wb, "sertifikalar.xlsx", { bookSST: false, type: "binary", FS: ";" });
  }

  const filtered = filterUser ? certs.filter(c => c.user_id === filterUser) : certs;

  return (
    <div className="space-y-5">
      {msg && (
        <div style={{ display: "flex", gap: 8, borderRadius: 12, padding: "12px 16px", backgroundColor: msg.type === "error" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${msg.type === "error" ? "#fecaca" : "#bbf7d0"}` }}>
          <span style={{ color: msg.type === "error" ? "#ef4444" : "#10b981", flexShrink: 0 }}>{msg.type === "error" ? "⚠" : "✓"}</span>
          <p style={{ color: msg.type === "error" ? "#dc2626" : "#059669", fontSize: 14 }}>{msg.text}</p>
        </div>
      )}

      {/* Toolbar — mobilde wrap */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <select style={{ ...inp, width: "auto", minWidth: 160, flex: "1 1 160px" }} value={filterUser} onChange={e => setFilterUser(e.target.value)}>
          <option value="">Tüm Personel</option>
          {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
        <span style={{ color: "#94a3b8", fontSize: 13, flexShrink: 0 }}>{filtered.length} sertifika</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={exportExcel}
            style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#475569", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
            ⬇ Excel
          </button>
          <button onClick={() => setShowAdd(!showAdd)}
            style={{ padding: "8px 14px", borderRadius: 10, border: "none", backgroundColor: "#00abaa", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
            {showAdd ? "İptal" : "+ Sertifika Yükle"}
          </button>
        </div>
      </div>

      {/* Yükleme formu */}
      {showAdd && (
        <div className="card space-y-4" style={{ border: "1px solid #b2eded", backgroundColor: "#f0fffe" }}>
          <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 17 }}>Sertifika Yükle</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            {/* Mobilde tek kolon, 480px üstünde iki kolon */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
              <style>{`@media(min-width:480px){.cert-form-grid{grid-template-columns:1fr 1fr!important}}`}</style>
              <div style={{ display: "contents" }} className="cert-form-grid">
                <F label="Personel">
                  <select name="user_id" style={inp} required>
                    <option value="">Seçiniz…</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </F>
                <F label="İlgili Sınav (opsiyonel)">
                  <select name="exam_id" style={inp}>
                    <option value="">— Yok —</option>
                    {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
                  </select>
                </F>
              </div>
              {/* Başlık — tam genişlik */}
              <F label="Sertifika Başlığı">
                <input name="title" style={inp} placeholder="ör. Temel Satış Sınavı Başarı Sertifikası" required />
              </F>
              <div style={{ display: "contents" }} className="cert-form-grid">
                <F label="Veriliş Tarihi">
                  <input name="issued_at" type="date" style={inp} defaultValue={new Date().toISOString().split("T")[0]} />
                </F>
                <F label="Dosya (PDF / PNG / JPG)">
                  <input type="file" ref={fileRef} accept=".pdf,.png,.jpg,.jpeg" style={{ ...inp, padding: "7px 14px" }} required />
                </F>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="submit" disabled={saving}
                style={{ padding: "10px 24px", borderRadius: 10, border: "none", backgroundColor: "#00abaa", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Yükleniyor…" : "Yükle"}
              </button>
              <button type="button" onClick={() => setShowAdd(false)}
                style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#64748b", fontSize: 14, cursor: "pointer" }}>
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Yükleniyor…</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "64px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
          <p>Henüz sertifika yüklenmemiş.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {/* Tablo — mobilde yatay scroll */}
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 640 }}>
              <thead>
                <tr style={{ backgroundColor: "#00abaa" }}>
                  {["Personel", "Sertifika", "Sınav", "Tarih", "Tür", "İşlem"].map(h => (
                    <th key={h} style={{ padding: "11px 14px", color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(cert => (
                  <tr key={cert.id}
                    style={{ borderBottom: "0.5px solid #f1f5f9", transition: "background .15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "#e6f7f7"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = ""}>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#e0f7f7", border: "2px solid #00abaa", display: "flex", alignItems: "center", justifyContent: "center", color: "#00abaa", fontWeight: 700, fontSize: 12, overflow: "hidden", flexShrink: 0 }}>
                          {cert.profiles?.avatar_url
                            ? <img src={cert.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : (cert.profiles?.full_name?.[0] ?? "?")}
                        </div>
                        <span style={{ fontWeight: 500, color: "#1e293b", whiteSpace: "nowrap" }}>{cert.profiles?.full_name ?? "—"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px", fontWeight: 500, color: "#1e293b", minWidth: 180 }}>{cert.title}</td>
                    <td style={{ padding: "11px 14px", color: "#64748b", fontSize: 13, whiteSpace: "nowrap" }}>{cert.exams?.title ?? "—"}</td>
                    <td style={{ padding: "11px 14px", color: "#64748b", fontSize: 13, whiteSpace: "nowrap" }}>
                      {new Date(cert.issued_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: cert.file_type === "pdf" ? "#fce7f0" : "#e0f7f7", color: cert.file_type === "pdf" ? "#db0962" : "#00abaa", border: `1px solid ${cert.file_type === "pdf" ? "#f0b2cc" : "#b2eded"}` }}>
                        {cert.file_type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => window.open(cert.file_url, "_blank")}
                          style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#475569", cursor: "pointer", whiteSpace: "nowrap" }}>
                          Görüntüle
                        </button>
                        <button onClick={() => handleDelete(cert.id, cert.title)}
                          style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#ef4444", cursor: "pointer" }}>
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
