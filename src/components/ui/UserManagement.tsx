"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

interface Props {
  initialProfiles: Profile[];
}

async function getAuthToken() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? "";
}

export default function UserManagement({ initialProfiles }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newUser, setNewUser] = useState({
    email: "", password: "", full_name: "",
    role: "staff", monthly_target: 0,
  });

  const [editForm, setEditForm] = useState({
    full_name: "", role: "staff",
    monthly_target: 0, current_sales: 0, password: "",
  });

  async function refreshProfiles() {
    const token = await getAuthToken();
    const res = await fetch("/api/admin/users", {
      headers: { authorization: `Bearer ${token}` },
    });
    if (res.ok) setProfiles(await res.json());
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const token = await getAuthToken();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(newUser),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setSuccess("Kullanici basariyla olusturuldu!");
    setShowAddForm(false);
    setNewUser({ email: "", password: "", full_name: "", role: "staff", monthly_target: 0 });
    await refreshProfiles();
    setLoading(false);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setError(""); setLoading(true);
    const token = await getAuthToken();
    const body: Record<string, unknown> = {
      id: editingUser.id,
      full_name: editForm.full_name,
      role: editForm.role,
      monthly_target: editForm.monthly_target,
      current_sales: editForm.current_sales,
    };
    if (editForm.password) body.password = editForm.password;

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setSuccess("Kullanici guncellendi!");
    setEditingUser(null);
    await refreshProfiles();
    setLoading(false);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleDeleteUser(id: string, name: string) {
    if (!confirm(`${name} adli kullaniciyi silmek istediginizden emin misiniz? Bu islem geri alinamaz.`)) return;
    setError(""); setLoading(true);
    const token = await getAuthToken();
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setSuccess("Kullanici silindi.");
    await refreshProfiles();
    setLoading(false);
    setTimeout(() => setSuccess(""), 3000);
  }

  function startEdit(p: Profile) {
    setEditingUser(p);
    setEditForm({
      full_name: p.full_name,
      role: p.role,
      monthly_target: p.monthly_target,
      current_sales: p.current_sales,
      password: "",
    });
  }

  return (
    <div className="space-y-6">
      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <span className="text-rose-400">⚠</span>
          <p className="text-rose-300 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          <span className="text-emerald-400">✓</span>
          <p className="text-emerald-300 text-sm">{success}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-stone-400 text-sm">{profiles.length} kullanici</p>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary text-sm">
          {showAddForm ? "İptal" : "+ Yeni Personel Ekle"}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="card border-brand-500/20 space-y-4">
          <h3 className="section-title">Yeni Personel Ekle</h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Ad Soyad</label>
                <input className="input" placeholder="Ayse Kaya" value={newUser.full_name}
                  onChange={e => setNewUser(u => ({ ...u, full_name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">E-posta</label>
                <input type="email" className="input" placeholder="ayse@sirket.com" value={newUser.email}
                  onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Sifre</label>
                <input type="password" className="input" placeholder="En az 6 karakter" value={newUser.password}
                  onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} required minLength={6} />
              </div>
              <div>
                <label className="label">Rol</label>
                <select className="input" value={newUser.role}
                  onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                  <option value="staff">Personel</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="label">Aylik Hedef (TL)</label>
                <input type="number" className="input" placeholder="150000" value={newUser.monthly_target || ""}
                  onChange={e => setNewUser(u => ({ ...u, monthly_target: +e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Olusturuluyor..." : "Kullanici Olustur"}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-ghost">İptal</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit modal */}
      {editingUser && (
        <div className="card border-amber-500/20 space-y-4">
          <h3 className="section-title">Kullanici Duzenle: {editingUser.full_name}</h3>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Ad Soyad</label>
                <input className="input" value={editForm.full_name}
                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Rol</label>
                <select className="input" value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="staff">Personel</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="label">Aylik Hedef (TL)</label>
                <input type="number" className="input" value={editForm.monthly_target || ""}
                  onChange={e => setEditForm(f => ({ ...f, monthly_target: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Gerceklesen Satis (TL)</label>
                <input type="number" className="input" value={editForm.current_sales || ""}
                  onChange={e => setEditForm(f => ({ ...f, current_sales: +e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Yeni Sifre (bos birakirsan degismez)</label>
                <input type="password" className="input" placeholder="Yeni sifre (opsiyonel)"
                  value={editForm.password}
                  onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button type="button" onClick={() => setEditingUser(null)} className="btn-ghost">İptal</button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-3 bg-surface-2">
                {["Personel", "Rol", "E-posta", "Aylik Hedef", "Gerceklesen", "Basari", "Islemler"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-stone-500 font-semibold text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-3">
              {profiles.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-stone-600">Kullanici bulunamadi.</td></tr>
              ) : profiles.map(p => {
                const rate = p.monthly_target > 0 ? Math.round((p.current_sales / p.monthly_target) * 100) : 0;
                return (
                  <tr key={p.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-600/30 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-xs">
                          {p.full_name?.[0] ?? "?"}
                        </div>
                        <span className="font-medium text-stone-200">{p.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${p.role === "admin" ? "bg-violet-500/15 border-violet-500/30 text-violet-300" : "bg-surface-3 border-surface-4 text-stone-400"}`}>
                        {p.role === "admin" ? "Admin" : "Personel"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-400 text-xs">{(p as unknown as Record<string, string>).email ?? "—"}</td>
                    <td className="px-4 py-3 text-stone-400">{fmt(p.monthly_target)}</td>
                    <td className="px-4 py-3 text-stone-200 font-medium">{fmt(p.current_sales)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${rate >= 100 ? "bg-emerald-500" : rate >= 75 ? "bg-amber-500" : "bg-brand-500"}`}
                            style={{ width: `${Math.min(rate, 100)}%` }} />
                        </div>
                        <span className={`font-bold text-xs ${rate >= 100 ? "text-emerald-400" : rate >= 75 ? "text-amber-400" : "text-rose-400"}`}>%{rate}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(p)}
                          className="text-xs px-3 py-1.5 bg-surface-3 hover:bg-surface-4 border border-surface-4 text-stone-300 rounded-lg transition-colors">
                          Duzenle
                        </button>
                        <button onClick={() => handleDeleteUser(p.id, p.full_name)}
                          className="text-xs px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg transition-colors">
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
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n ?? 0);
}
