"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { ROLE_LABELS } from "@/types";

interface ProfileWithEmail extends Profile { email?: string; }

async function getToken() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? "";
}

async function uploadFile(bucket: string, file: File, userId: string): Promise<string | null> {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) { console.error(error); return null; }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export default function UserManagement() {
  const [profiles, setProfiles] = useState<ProfileWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<ProfileWithEmail | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const teamLogoRef = useRef<HTMLInputElement>(null);
  const avatarRef    = useRef<HTMLInputElement>(null);
  const editTeamLogoRef = useRef<HTMLInputElement>(null);
  const editAvatarRef   = useRef<HTMLInputElement>(null);

  const [newUser, setNewUser] = useState({
    first_name: "", last_name: "", email: "", password: "",
    role: "staff", monthly_target: 0, phone: "", team_name: "",
  });

  const [editForm, setEditForm] = useState({
    first_name: "", last_name: "", role: "staff",
    monthly_target: 0, current_sales: 0,
    password: "", phone: "", team_name: "",
    team_logo_url: "", avatar_url: "",
  });

  async function fetchProfiles() {
    setLoading(true);
    const token = await getToken();
    const res = await fetch("/api/admin/users", {
      headers: { authorization: `Bearer ${token}` },
    });
    if (res.ok) setProfiles(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchProfiles(); }, []);

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSaving(true);
    const token = await getToken();

    // Upload team logo if selected
    let team_logo_url: string | null = null;
    if (teamLogoRef.current?.files?.[0]) {
      team_logo_url = await uploadFile("team-logos", teamLogoRef.current.files[0], "temp-" + Date.now());
    }
    let avatar_url: string | null = null;
    if (avatarRef.current?.files?.[0]) {
      avatar_url = await uploadFile("avatars", avatarRef.current.files[0], "temp-" + Date.now());
    }

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...newUser, team_logo_url, avatar_url }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }

    setSuccess("Kullanıcı başarıyla oluşturuldu!");
    setShowAddForm(false);
    setNewUser({ first_name: "", last_name: "", email: "", password: "", role: "staff", monthly_target: 0, phone: "", team_name: "" });
    await fetchProfiles();
    setSaving(false);
    setTimeout(() => setSuccess(""), 4000);
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setError(""); setSaving(true);
    const token = await getToken();

    let team_logo_url = editForm.team_logo_url;
    let avatar_url    = editForm.avatar_url;

    if (editTeamLogoRef.current?.files?.[0]) {
      team_logo_url = await uploadFile("team-logos", editTeamLogoRef.current.files[0], editingUser.id) ?? team_logo_url;
    }
    if (editAvatarRef.current?.files?.[0]) {
      avatar_url = await uploadFile("avatars", editAvatarRef.current.files[0], editingUser.id) ?? avatar_url;
    }

    const body: Record<string, unknown> = {
      id: editingUser.id,
      ...editForm,
      team_logo_url,
      avatar_url,
    };
    if (!editForm.password) delete body.password;

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }

    setSuccess("Kullanıcı güncellendi!");
    setEditingUser(null);
    await fetchProfiles();
    setSaving(false);
    setTimeout(() => setSuccess(""), 4000);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`${name} adlı kullanıcıyı silmek istediğinizden emin misiniz?\nBu işlem geri alınamaz.`)) return;
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
    await fetchProfiles();
    setSaving(false);
    setTimeout(() => setSuccess(""), 4000);
  }

  function startEdit(p: ProfileWithEmail) {
    setEditingUser(p);
    setEditForm({
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

  const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <span className="text-rose-400 shrink-0">⚠</span>
          <p className="text-rose-300 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          <span className="text-emerald-400">✓</span>
          <p className="text-emerald-300 text-sm">{success}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-stone-400 text-sm">{profiles.length} kullanıcı</p>
        <button onClick={() => { setShowAddForm(!showAddForm); setError(""); }}
          className="btn-primary text-sm">
          {showAddForm ? "İptal" : "+ Yeni Personel Ekle"}
        </button>
      </div>

      {/* ADD FORM */}
      {showAddForm && (
        <div className="card border-brand-500/20 space-y-5">
          <h3 className="section-title">Yeni Personel Ekle</h3>
          <form onSubmit={handleAddUser} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Ad">
                <input className="input" placeholder="Ayşe" value={newUser.first_name}
                  onChange={e => setNewUser(u => ({ ...u, first_name: e.target.value }))} required />
              </FormField>
              <FormField label="Soyad">
                <input className="input" placeholder="Kaya" value={newUser.last_name}
                  onChange={e => setNewUser(u => ({ ...u, last_name: e.target.value }))} />
              </FormField>
              <FormField label="E-posta">
                <input type="email" className="input" placeholder="ayse@sirket.com" value={newUser.email}
                  onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} required />
              </FormField>
              <FormField label="Şifre">
                <input type="password" className="input" placeholder="En az 6 karakter" value={newUser.password}
                  onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} required minLength={6} />
              </FormField>
              <FormField label="Telefon (90XXXXXXXXXX)">
                <input className="input" placeholder="905551234567" value={newUser.phone}
                  onChange={e => setNewUser(u => ({ ...u, phone: e.target.value }))}
                  pattern="[0-9]{12}" title="90 ile başlayan 12 haneli numara" />
              </FormField>
              <FormField label="Rol">
                <select className="input" value={newUser.role}
                  onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Aylık Hedef (₺)">
                <input type="number" className="input" placeholder="150000" value={newUser.monthly_target || ""}
                  onChange={e => setNewUser(u => ({ ...u, monthly_target: +e.target.value }))} />
              </FormField>
              <FormField label="Ekip Adı">
                <input className="input" placeholder="Satış Ekibi A" value={newUser.team_name}
                  onChange={e => setNewUser(u => ({ ...u, team_name: e.target.value }))} />
              </FormField>
              <FormField label="Ekip Logosu">
                <input type="file" ref={teamLogoRef} accept="image/*"
                  className="input text-stone-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-surface-3 file:text-stone-300 file:text-xs cursor-pointer" />
              </FormField>
              <FormField label="Personel Fotoğrafı">
                <input type="file" ref={avatarRef} accept="image/*"
                  className="input text-stone-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-surface-3 file:text-stone-300 file:text-xs cursor-pointer" />
              </FormField>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-ghost">İptal</button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT FORM */}
      {editingUser && (
        <div className="card border-amber-500/20 space-y-5">
          <h3 className="section-title">Düzenle: {editingUser.full_name}</h3>
          <form onSubmit={handleEditUser} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Ad">
                <input className="input" value={editForm.first_name}
                  onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} required />
              </FormField>
              <FormField label="Soyad">
                <input className="input" value={editForm.last_name}
                  onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} />
              </FormField>
              <FormField label="Rol">
                <select className="input" value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Telefon">
                <input className="input" value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </FormField>
              <FormField label="Aylık Hedef (₺)">
                <input type="number" className="input" value={editForm.monthly_target || ""}
                  onChange={e => setEditForm(f => ({ ...f, monthly_target: +e.target.value }))} />
              </FormField>
              <FormField label="Gerçekleşen Satış (₺)">
                <input type="number" className="input" value={editForm.current_sales || ""}
                  onChange={e => setEditForm(f => ({ ...f, current_sales: +e.target.value }))} />
              </FormField>
              <FormField label="Ekip Adı">
                <input className="input" value={editForm.team_name}
                  onChange={e => setEditForm(f => ({ ...f, team_name: e.target.value }))} />
              </FormField>
              <FormField label="Yeni Şifre (boş bırakırsan değişmez)">
                <input type="password" className="input" placeholder="Opsiyonel" value={editForm.password}
                  onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} />
              </FormField>
              <FormField label="Ekip Logosu Güncelle">
                <div className="space-y-2">
                  {editForm.team_logo_url && (
                    <img src={editForm.team_logo_url} alt="logo" className="w-10 h-10 rounded-lg object-cover" />
                  )}
                  <input type="file" ref={editTeamLogoRef} accept="image/*"
                    className="input text-stone-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-surface-3 file:text-stone-300 file:text-xs cursor-pointer" />
                </div>
              </FormField>
              <FormField label="Personel Fotoğrafı Güncelle">
                <div className="space-y-2">
                  {editForm.avatar_url && (
                    <img src={editForm.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                  )}
                  <input type="file" ref={editAvatarRef} accept="image/*"
                    className="input text-stone-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-surface-3 file:text-stone-300 file:text-xs cursor-pointer" />
                </div>
              </FormField>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button type="button" onClick={() => setEditingUser(null)} className="btn-ghost">İptal</button>
            </div>
          </form>
        </div>
      )}

      {/* TABLE */}
      {loading ? (
        <div className="card flex items-center justify-center py-16 text-stone-500">
          <span className="w-5 h-5 border-2 border-stone-600 border-t-stone-300 rounded-full animate-spin mr-3" />
          Yükleniyor...
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-3 bg-surface-2">
                  {["Personel", "Rol", "E-posta", "Telefon", "Ekip", "Hedef", "Gerç.", "Başarı", "İşlemler"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-stone-500 font-semibold text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-3">
                {profiles.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-stone-600">Kullanıcı bulunamadı.</td></tr>
                ) : profiles.map(p => {
                  const rate = p.monthly_target > 0 ? Math.round((p.current_sales / p.monthly_target) * 100) : 0;
                  return (
                    <tr key={p.id} className="hover:bg-surface-2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {p.avatar_url
                            ? <img src={p.avatar_url} alt={p.full_name} className="w-7 h-7 rounded-full object-cover" />
                            : <div className="w-7 h-7 rounded-full bg-brand-600/30 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-xs">
                                {p.full_name?.[0] ?? "?"}
                              </div>
                          }
                          <span className="font-medium text-stone-200 whitespace-nowrap">{p.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge whitespace-nowrap ${p.role === "admin" ? "bg-violet-500/15 border-violet-500/30 text-violet-300" : "bg-surface-3 border-surface-4 text-stone-400"}`}>
                          {ROLE_LABELS[p.role] ?? p.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-400 text-xs">{p.email ?? "—"}</td>
                      <td className="px-4 py-3 text-stone-400 text-xs whitespace-nowrap">{p.phone ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {p.team_logo_url && <img src={p.team_logo_url} alt="" className="w-5 h-5 rounded object-cover" />}
                          <span className="text-stone-400 text-xs">{p.team_name ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stone-400 text-xs">{fmt(p.monthly_target)}</td>
                      <td className="px-4 py-3 text-stone-200 text-xs font-medium">{fmt(p.current_sales)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${rate >= 100 ? "bg-emerald-500" : rate >= 75 ? "bg-amber-500" : "bg-brand-500"}`}
                              style={{ width: `${Math.min(rate, 100)}%` }} />
                          </div>
                          <span className={`font-bold text-xs ${rate >= 100 ? "text-emerald-400" : rate >= 75 ? "text-amber-400" : "text-rose-400"}`}>%{rate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => startEdit(p)}
                            className="text-xs px-2.5 py-1.5 bg-surface-3 hover:bg-surface-4 border border-surface-4 text-stone-300 rounded-lg transition-colors whitespace-nowrap">
                            Düzenle
                          </button>
                          <button onClick={() => handleDelete(p.id, p.full_name)}
                            className="text-xs px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg transition-colors">
                            Sil
                          </button>
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

function fmt(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n ?? 0);
}
