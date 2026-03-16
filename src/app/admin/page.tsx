"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminClient from "@/components/ui/AdminClient";
import UserManagement from "@/components/ui/UserManagement";
import type { Profile, DailyLog } from "@/types";

type Tab = "logs" | "users" | "management";

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [logs, setLogs] = useState<(DailyLog & { profiles?: { full_name: string } })[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("logs");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.id) { setIsAdmin(false); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
      if (profile?.role !== "admin") { setIsAdmin(false); return; }
      setIsAdmin(true);
      const [profilesRes, logsRes] = await Promise.all([
        supabase.from("profiles")
          .select("id, full_name, first_name, last_name, role, monthly_target, current_sales, last_login, phone, team_name, team_logo_url, avatar_url")
          .order("full_name"),
        supabase.from("daily_logs")
          .select("*, profiles(full_name)")
          .order("log_date", { ascending: false })
          .order("log_time", { ascending: false })
          .limit(1000),
      ]);
      setProfiles(profilesRes.data ?? []);
      setLogs(logsRes.data ?? []);
    });
  }, []);

  if (isAdmin === null) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256, color: "#64748b" }}>
      <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" style={{ marginRight: 12 }} />
      Yükleniyor...
    </div>
  );

  if (!isAdmin) return (
    <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
      <p style={{ color: "#64748b", fontSize: 16 }}>Bu sayfaya erişim yetkiniz yok.</p>
    </div>
  );

  const TABS: { id: Tab; label: string }[] = [
    { id: "logs",       label: "📋 Günlükler" },
    { id: "users",      label: "👥 Personel" },
    { id: "management", label: "⚙️ Kullanıcı Yönetimi" },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }} className="space-y-8">
      <div className="animate-fade-up">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 30, fontWeight: 700, color: "#1e293b" }}>
            Admin Paneli
          </h1>
          <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, backgroundColor: "#e0f7f7", color: "#00abaa", border: "1px solid #b2eded" }}>
            Yönetici
          </span>
        </div>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Tüm personel aktivitelerini görüntüleyin ve raporlayın.
        </p>
      </div>

      <div style={{ display: "flex", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 12, padding: 4, width: "fit-content", gap: 4, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 16px", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer",
            border: "none", transition: "all 0.15s",
            backgroundColor: tab === t.id ? "#ffffff" : "transparent",
            color: tab === t.id ? "#00abaa" : "#64748b",
            boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "logs"       && <AdminClient profiles={profiles} logs={logs} />}
      {tab === "users"      && <AdminClient profiles={profiles} logs={logs} defaultTab="users" />}
      {tab === "management" && <UserManagement />}
    </div>
  );
}
