"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { ROLE_LABELS } from "@/types";

interface ProfileWithEmail extends Profile { email?: string; }

async function getToken() {
  const { data: { session } } = await createClient().auth.getSession();
  return session?.access_token ?? "";
}

async function uploadFile(bucket: string, file: File, userId: string): Promise<string | null> {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

const HOVER_COLOR = "#e6f7f7"; // #00abaa 3 ton açığı

export default function UserManagement() {
  const [profiles, setProfiles] = useState<ProfileWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<ProfileWithEmail | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const teamLogoRef     = useRef<HTMLInputElement>(null);
  const avatarRef       = useRef<HTMLInputElement>(null);
  const editTeamLogoRef = useRef<HTMLInputElement>(null);
  const editAvatarRef   = useRef<HTMLInputElement>(null);

  const [newFirst, setNewFirst]   = useState("");
  const [newLast, setNewLast]     = useState("");
  const [newEmail, setNewEmail]   = useState("");
  const [newPass, setNewPass]     = useState("");
  const [newRole, setNewRole]     = useState("staff");
  const [newTarget, setNewTarget] = useState(0);
  const [newPhone, setNewPhone]   = useState("");
  const [newTeam, setNewTeam]     = useState("");

  const [editFirst, setEditFirst]     = useState("");
  const [editLast, setEditLast]       = useState("");
  const [editRole, setEditRole]       = useState("staff");
  const [editTarget, setEditTarget]   = useState(0);
  const [editSales, setEditSales]     = useState(0);
  const [editPass, setEditPass]       = useState("");
  const [editPhone, setEditPhone]     = useState("");
  const [editTeam, setEditTeam]       = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

  async function fetchProfiles() {
    setLoading(true);
    const token = await getToken();
    const res = await fetch("/api/admin/users", { headers: { authorization: `Bearer ${token}` } });
    if (res.ok) setProfiles(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchProfiles(); }, []);

  function resetAdd() {
    setNewFirst(""); setNewLast(""); setNewEmail(""); setNewPass("");
    setNewRole("staff"); setNewTarget(0); setNewPhone(""); setNewTeam("");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSaving(true);
    const token = await getToken();
    let team_logo_url: string | null = null;
    let avatar_url: string | null = null;
    if (teamLogoRef.current?.files?.[0]) team_logo_url = await uploadFile("team-logos", teamLogoRef.current.files[0], "tmp-" + Date.now());
    if (avatarRef.current?.files?.[0])   avatar_url    = await uploadFile("avatars",    avatarRef.current.files[0],    "tmp-" + Date.now());

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ first_name: newFirst, last_name: newLast, email: newEmail, password: newPass, role: newRole, monthly_target: newTarget, phone: newPhone, team_name: newTeam, team_logo_url, avatar_url }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setSuccess("Kullanıcı başarıyla oluşturuldu!");
    setShowAddForm(false); resetAdd();
    await fetchProfiles(); setSaving(false);
    setTimeout(() => setSuccess(""), 4000);
  }

  function startEdit(p: ProfileWithEmail) {
    setEditingUser(p);
    setEditFirst(p.first_name ?? p.full_name.split(" ")[0]);
    setEditLast(p.last_name ?? p.full_name.split(" ").slice(1).join(" "));
    setEditRole(p.role); setEditTarget(p.monthly_target); setEditSales(p.current_sales);
    setEditPass(""); setEditPhone(p.phone ?? ""); setEditTeam(p.team_name ?? "");
    setEditLogoUrl(p.team_logo_url ?? ""); setEditAvatarUrl(p.avatar_url ?? "");
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setError(""); setSaving(true);
    const token = await getToken();
    let team_logo_url = editLogoUrl;
    let avatar_url    = editAvatarUrl;
    if (editTeamLogoRef.current?.files?.[0]) team_logo_url = await uploadFile("team-logos", editTeamLogoRef.current.files[0], editingUser.id) ?? team_logo_url;
    if (editAvatarRef.current?.files?.[0])   avatar_url    = await uploadFile("avatars",    editAvatarRef.current.files[0],    editingUser.id) ?? avatar_url;

    const body: Record<string, unknown> = { id: editingUser.id, first_name: editFirst, last_name: editLast, role: editRole, monthly_target: editTarget, current_sales: editSales, phone: editPhone, team_name: editTeam, team_logo_url, avatar_url };
    if (editPass) body.password = editPass;

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setSuccess("Kullanıcı güncellendi!"); setEditingUser(null);
    await fetchProfiles(); setSaving(false);
    setTimeout(() => setSuccess(""), 4000);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`${name} adlı kullanıcıyı silmek istediğinizden emin misiniz?`)) return;
    setError(""); setSaving(true);
    const token = await getToken();
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setSuccess("Kullanıcı silindi.");
    await fetchProfiles(); setSaving(false);
    setTimeout(() => setSuccess(""), 4000);
  }

  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b", backgroundColor: "#fff", outline: "none" };
  const labelStyle = { display: "block", fontSize: 11, fontWeight: 700 as const, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 };

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <div><label style={labelStyle}>{label}</label>{children}</div>;
  }

  return (
    <div className="space-y-5">
      {error && <div style={{ display: "flex", gap: 8, backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px" }}><span style={{ color: "#ef4444" }}>⚠</span><p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p></div>}
      {success && <div style={{ display: "flex", gap: 8, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 16px" }}><span style={{ color: "#10b981" }}>✓</span><p style={{ color: "#059669", fontSize: 14 }}>{success}</p></div>}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ color: "#64748b", fontSize: 14 }}>{profiles.length} kullanıcı</p>
        <button onClick={() => { setShowAddForm(!showAddForm); setError(""); }} className="btn-primary" style={{ fontSize: 14 }}>
          {showAddForm ? "İptal" : "+ Yeni Personel Ekle"}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="card space-y-4" style={{ border: "1px solid #b2eded", backgroundColor: "#f0fffe" }}>
          <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 18 }}>Yeni Personel Ekle</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Ad"><input style={inputStyle} placeholder="Ayşe" value={newFirst} onChange={e => setNewFirst(e.target.value)} required /></Field>
              <Field label="Soyad"><input style={inputStyle} placeholder="Kaya" value={newLast} onChange={e => setNewLast(e.target.value)} /></Field>
              <Field label="E-posta"><input type="email" style={inputStyle} placeholder="ayse@sirket.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} required /></Field>
              <Field label="Şifre"><input type="password" style={inputStyle} placeholder="En az 6 karakter" value={newPass} onChange={e => setNewPass(e.target.value)} required minLength={6} /></Field>
              <Field label="Telefon (90XXXXXXXXXX)"><input style={inputStyle} placeholder="905551234567" value={newPhone} onChange={e => setNewPhone(e.target.value)} /></Field>
              <Field label="Rol">
                <select style={inputStyle} value={newRole} onChange={e => setNewRole(e.target.value)}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Aylık Hedef (₺)"><input type="number" style={inputStyle} placeholder="150000" value={newTarget || ""} onChange={e => setNewTarget(+e.target.value)} /></Field>
              <Field label="Ekip Adı"><input style={inputStyle} placeholder="Satış Ekibi A" value={newTeam} onChange={e => setNewTeam(e.target.value)} /></Field>
              <Field label="Ekip Logosu"><input type="file" ref={teamLogoRef} accept="image/*" style={{ ...inputStyle, padding: "7px 14px" }} /></Field>
              <Field label="Personel Fotoğrafı"><input type="file" ref={avatarRef} accept="image/*" style={{ ...inputStyle, padding: "7px 14px" }} /></Field>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? "Oluşturuluyor…" : "Kullanıcı Oluştur"}</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-ghost">İptal</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit form */}
      {editingUser && (
        <div className="card space-y-4" style={{ border: "1px solid #fde68a", backgroundColor: "#fffbeb" }}>
          <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 18 }}>Düzenle: {editingUser.full_name}</h3>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Ad"><input style={inputStyle} value={editFirst} onChange={e => setEditFirst(e.target.value)} required /></Field>
              <Field label="Soyad"><input style={inputStyle} value={editLast} onChange={e => setEditLast(e.target.value)} /></Field>
              <Field label="Rol">
                <select style={inputStyle} value={editRole} onChange={e => setEditRole(e.target.value)}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Telefon"><input style={inputStyle} value={editPhone} onChange={e => setEditPhone(e.target.value)} /></Field>
              <Field label="Aylık Hedef (₺)"><input type="number" style={inputStyle} value={editTarget || ""} onChange={e => setEditTarget(+e.target.value)} /></Field>
              <Field label="Gerçekleşen Satış (₺)"><input type="number" style={inputStyle} value={editSales || ""} onChange={e => setEditSales(+e.target.value)} /></Field>
              <Field label="Ekip Adı"><input style={inputStyle} value={editTeam} onChange={e => setEditTeam(e.target.value)} /></Field>
              <Field label="Yeni Şifre (opsiyonel)"><input type="password" style={inputStyle} placeholder="Boş bırakırsan değişmez" value={editPass} onChange={e => setEditPass(e.target.value)} /></Field>
              <Field label="Ekip Logosu">
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {editLogoUrl && <img src={editLogoUrl} alt="logo" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />}
                  <input type="file" ref={editTeamLogoRef} accept="image/*" style={{ ...inputStyle, padding: "7px 14px" }} />
                </div>
              </Field>
              <Field label="Personel Fotoğrafı">
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {editAvatarUrl && <img src={editAvatarUrl} alt="avatar" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />}
                  <input type="file" ref={editAvatarRef} accept="image/*" style={{ ...inputStyle, padding: "7px 14px" }} />
                </div>
              </Field>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? "Kaydediliyor…" : "Kaydet"}</button>
              <button type="button" onClick={() => setEditingUser(null)} className="btn-ghost">İptal</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0", color: "#64748b" }}>
          <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" style={{ marginRight: 12 }} />
          Yükleniyor...
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ backgroundColor: "#00abaa" }}>
                  {["Personel", "Rol", "E-posta", "Telefon", "Ekip", "Hedef", "Gerç.", "Başarı", "İşlemler"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "#ffffff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>Kullanıcı bulunamadı.</td></tr>
                ) : profiles.map(p => {
                  const rate = p.monthly_target > 0 ? Math.round((p.current_sales / p.monthly_target) * 100) : 0;
                  const isHovered = hoveredRow === p.id;
                  return (
                    <tr key={p.id}
                      style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: isHovered ? HOVER_COLOR : "#ffffff", transition: "background-color 0.15s", cursor: "default" }}
                      onMouseEnter={() => setHoveredRow(p.id)}
                      onMouseLeave={() => setHoveredRow(null)}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "#e0f7f7", border: "2px solid #00abaa", display: "flex", alignItems: "center", justifyContent: "center", color: "#00abaa", fontWeight: 700, fontSize: 13, overflow: "hidden", flexShrink: 0 }}>
                            {p.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (p.full_name?.[0] ?? "?")}
                          </div>
                          <span style={{ fontWeight: 500, color: "#1e293b", whiteSpace: "nowrap" }}>{p.full_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, backgroundColor: p.role === "admin" ? "#f5f3ff" : "#f8fafc", color: p.role === "admin" ? "#8b5cf6" : "#64748b", border: `1px solid ${p.role === "admin" ? "#ddd6fe" : "#e2e8f0"}`, whiteSpace: "nowrap" }}>
                          {ROLE_LABELS[p.role] ?? p.role}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 13 }}>{p.email ?? "—"}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 13, whiteSpace: "nowrap" }}>{p.phone ?? "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {p.team_logo_url && <img src={p.team_logo_url} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover" }} />}
                          <span style={{ color: "#64748b", fontSize: 13 }}>{p.team_name ?? "—"}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 13, whiteSpace: "nowrap" }}>
                        {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(p.monthly_target)}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#1e293b", fontWeight: 500, fontSize: 13, whiteSpace: "nowrap" }}>
                        {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(p.current_sales)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 48, height: 6, backgroundColor: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 99, width: `${Math.min(rate, 100)}%`, backgroundColor: rate >= 100 ? "#10b981" : rate >= 75 ? "#f59e0b" : "#00abaa" }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: rate >= 100 ? "#10b981" : rate >= 75 ? "#f59e0b" : "#ef4444" }}>%{rate}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => startEdit(p)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#475569", cursor: "pointer", whiteSpace: "nowrap" }}>Düzenle</button>
                          <button onClick={() => handleDelete(p.id, p.full_name)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#ef4444", cursor: "pointer" }}>Sil</button>
                        </div>
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
