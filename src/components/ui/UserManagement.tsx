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

const HOVER_COLOR = "#e6f7f7";

export default function UserManagement() {
  const [profiles, setProfiles] = useState<ProfileWithEmail[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [editUser, setEditUser] = useState<ProfileWithEmail | null>(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // refs for file inputs
  const addLogoRef   = useRef<HTMLInputElement>(null);
  const addAvatarRef = useRef<HTMLInputElement>(null);
  const editLogoRef  = useRef<HTMLInputElement>(null);
  const editAvatarRef= useRef<HTMLInputElement>(null);

  // uncontrolled add form
  const addFormRef = useRef<HTMLFormElement>(null);

  async function fetchProfiles() {
    setLoading(true);
    const token = await getToken();
    const res = await fetch("/api/admin/users", { headers: { authorization: `Bearer ${token}` } });
    if (res.ok) setProfiles(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchProfiles(); }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setSaving(true);
    const fd = new FormData(e.currentTarget);
    const token = await getToken();

    let team_logo_url: string | null = null;
    let avatar_url:    string | null = null;
    if (addLogoRef.current?.files?.[0])   team_logo_url = await uploadFile("team-logos", addLogoRef.current.files[0],   "tmp-" + Date.now());
    if (addAvatarRef.current?.files?.[0]) avatar_url    = await uploadFile("avatars",    addAvatarRef.current.files[0],  "tmp-" + Date.now());

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({
        first_name:     fd.get("first_name"),
        last_name:      fd.get("last_name"),
        email:          fd.get("email"),
        password:       fd.get("password"),
        role:           fd.get("role"),
        monthly_target: Number(fd.get("monthly_target") || 0),
        phone:          fd.get("phone"),
        team_name:      fd.get("team_name"),
        team_logo_url,
        avatar_url,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setSuccess("Kullanıcı başarıyla oluşturuldu!");
    setShowAdd(false);
    addFormRef.current?.reset();
    await fetchProfiles(); setSaving(false);
    setTimeout(() => setSuccess(""), 4000);
  }

  // edit form — still use state but each field is separate useState to avoid re-render issues
  const [ef, setEf] = useState({ first_name: "", last_name: "", role: "staff", monthly_target: 0, current_sales: 0, password: "", phone: "", team_name: "", team_logo_url: "", avatar_url: "" });

  function startEdit(p: ProfileWithEmail) {
    setEditUser(p);
    setEf({
      first_name:     p.first_name ?? p.full_name.split(" ")[0],
      last_name:      p.last_name  ?? p.full_name.split(" ").slice(1).join(" "),
      role:           p.role,
      monthly_target: p.monthly_target,
      current_sales:  p.current_sales,
      password:       "",
      phone:          p.phone ?? "",
      team_name:      p.team_name ?? "",
      team_logo_url:  p.team_logo_url ?? "",
      avatar_url:     p.avatar_url ?? "",
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setError(""); setSaving(true);
    const token = await getToken();

    let team_logo_url = ef.team_logo_url;
    let avatar_url    = ef.avatar_url;
    if (editLogoRef.current?.files?.[0])   team_logo_url = await uploadFile("team-logos", editLogoRef.current.files[0],  editUser.id) ?? team_logo_url;
    if (editAvatarRef.current?.files?.[0]) avatar_url    = await uploadFile("avatars",    editAvatarRef.current.files[0], editUser.id) ?? avatar_url;

    const body: Record<string, unknown> = { id: editUser.id, ...ef, team_logo_url, avatar_url };
    if (!ef.password) delete body.password;

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setSuccess("Kullanıcı güncellendi!"); setEditUser(null);
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

  const inp = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b", backgroundColor: "#fff", outline: "none", fontFamily: "inherit" } as React.CSSProperties;
  const lbl = { display: "block", fontSize: 11, fontWeight: 700 as const, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 };

  function F({ label, children }: { label: string; children: React.ReactNode }) {
    return <div><label style={lbl}>{label}</label>{children}</div>;
  }

  return (
    <div className="space-y-5">
      {error   && <div style={{ display: "flex", gap: 8, backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px" }}><span style={{ color: "#ef4444" }}>⚠</span><p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p></div>}
      {success && <div style={{ display: "flex", gap: 8, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 16px" }}><span style={{ color: "#10b981" }}>✓</span><p style={{ color: "#059669", fontSize: 14 }}>{success}</p></div>}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ color: "#64748b", fontSize: 14 }}>{profiles.length} kullanıcı</p>
        <button onClick={() => { setShowAdd(!showAdd); setError(""); }} className="btn-primary" style={{ fontSize: 14 }}>
          {showAdd ? "İptal" : "+ Yeni Personel Ekle"}
        </button>
      </div>

      {/* ADD FORM - fully uncontrolled */}
      {showAdd && (
        <div className="card space-y-4" style={{ border: "1px solid #b2eded", backgroundColor: "#f0fffe" }}>
          <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 18 }}>Yeni Personel Ekle</h3>
          <form ref={addFormRef} onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Ad"><input name="first_name" style={inp} placeholder="Ayşe" required /></F>
              <F label="Soyad"><input name="last_name" style={inp} placeholder="Kaya" /></F>
              <F label="E-posta"><input name="email" type="email" style={inp} placeholder="ayse@sirket.com" required /></F>
              <F label="Şifre"><input name="password" type="password" style={inp} placeholder="En az 6 karakter" required minLength={6} /></F>
              <F label="Telefon (90XXXXXXXXXX)"><input name="phone" style={inp} placeholder="905551234567" /></F>
              <F label="Rol">
                <select name="role" style={inp}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </F>
              <F label="Aylık Hedef (₺)"><input name="monthly_target" type="number" style={inp} placeholder="150000" /></F>
              <F label="Ekip Adı"><input name="team_name" style={inp} placeholder="Satış Ekibi A" /></F>
              <F label="Ekip Logosu"><input type="file" ref={addLogoRef} accept="image/*" style={{ ...inp, padding: "7px 14px" }} /></F>
              <F label="Personel Fotoğrafı"><input type="file" ref={addAvatarRef} accept="image/*" style={{ ...inp, padding: "7px 14px" }} /></F>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? "Oluşturuluyor…" : "Kullanıcı Oluştur"}</button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost">İptal</button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT FORM */}
      {editUser && (
        <div className="card space-y-4" style={{ border: "1px solid #fde68a", backgroundColor: "#fffbeb" }}>
          <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 18 }}>Düzenle: {editUser.full_name}</h3>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Ad"><input style={inp} value={ef.first_name} onChange={e => setEf(f => ({ ...f, first_name: e.target.value }))} required /></F>
              <F label="Soyad"><input style={inp} value={ef.last_name} onChange={e => setEf(f => ({ ...f, last_name: e.target.value }))} /></F>
              <F label="Rol">
                <select style={inp} value={ef.role} onChange={e => setEf(f => ({ ...f, role: e.target.value }))}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </F>
              <F label="Telefon"><input style={inp} value={ef.phone} onChange={e => setEf(f => ({ ...f, phone: e.target.value }))} /></F>
              <F label="Aylık Hedef (₺)"><input type="number" style={inp} value={ef.monthly_target || ""} onChange={e => setEf(f => ({ ...f, monthly_target: +e.target.value }))} /></F>
              <F label="Gerçekleşen Satış (₺)"><input type="number" style={inp} value={ef.current_sales || ""} onChange={e => setEf(f => ({ ...f, current_sales: +e.target.value }))} /></F>
              <F label="Ekip Adı"><input style={inp} value={ef.team_name} onChange={e => setEf(f => ({ ...f, team_name: e.target.value }))} /></F>
              <F label="Yeni Şifre (opsiyonel)"><input type="password" style={inp} placeholder="Boş bırakırsan değişmez" value={ef.password} onChange={e => setEf(f => ({ ...f, password: e.target.value }))} /></F>
              <F label="Ekip Logosu">
                {ef.team_logo_url && <img src={ef.team_logo_url} alt="logo" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", marginBottom: 6 }} />}
                <input type="file" ref={editLogoRef} accept="image/*" style={{ ...inp, padding: "7px 14px" }} />
              </F>
              <F label="Personel Fotoğrafı">
                {ef.avatar_url && <img src={ef.avatar_url} alt="avatar" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", marginBottom: 6 }} />}
                <input type="file" ref={editAvatarRef} accept="image/*" style={{ ...inp, padding: "7px 14px" }} />
              </F>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? "Kaydediliyor…" : "Kaydet"}</button>
              <button type="button" onClick={() => setEditUser(null)} className="btn-ghost">İptal</button>
            </div>
          </form>
        </div>
      )}

      {/* TABLE */}
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
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "#ffffff", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8" }}>Kullanıcı bulunamadı.</td></tr>
                ) : profiles.map(p => {
                  const rate = p.monthly_target > 0 ? Math.round((p.current_sales / p.monthly_target) * 100) : 0;
                  const isHov = hoveredRow === p.id;
                  return (
                    <tr key={p.id}
                      style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: isHov ? HOVER_COLOR : "#ffffff", transition: "background-color 0.15s", cursor: "default" }}
                      onMouseEnter={() => setHoveredRow(p.id)} onMouseLeave={() => setHoveredRow(null)}>
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
                      <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 13, whiteSpace: "nowrap" }}>{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(p.monthly_target)}</td>
                      <td style={{ padding: "12px 16px", color: "#1e293b", fontWeight: 500, fontSize: 13, whiteSpace: "nowrap" }}>{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(p.current_sales)}</td>
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
