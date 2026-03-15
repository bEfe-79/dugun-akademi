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

      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", session.user.id).maybeSingle();

      if (profile?.role !== "admin") { setIsAdmin(false); return; }
      setIsAdmin(true);

      const [profilesRes, logsRes] = await Promise.all([
        supabase.from("profiles")
          .select("id, full_name, role, monthly_target, current_sales, last_login")
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
    <div className="flex items-center justify-center h-64 text-stone-500">Yukleniyor...</div>
  );

  if (!isAdmin) return (
    <div className="max-w-xl mx-auto mt-20 text-center">
      <p className="text-stone-400 text-lg">Bu sayfaya erisim yetkiniz yok.</p>
    </div>
  );

  const TABS = [
    { id: "logs" as Tab,       label: "📋 Gunlukler"    },
    { id: "users" as Tab,      label: "👥 Personel"     },
    { id: "management" as Tab, label: "⚙️ Kullanici Yonetimi" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="animate-fade-up">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-stone-100">Admin Paneli</h1>
          <span className="badge bg-brand-500/15 border-brand-500/30 text-brand-400">Yonetici</span>
        </div>
        <p className="text-stone-500 text-sm mt-1">Tum personel aktivitelerini goruntuleyin ve raporlayin.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-2 border border-surface-3 rounded-xl p-1 w-fit flex-wrap gap-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              tab === t.id
                ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                : "text-stone-500 hover:text-stone-200"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "logs" && <AdminClient profiles={profiles} logs={logs} />}
      {tab === "users" && <AdminClient profiles={profiles} logs={logs} defaultTab="users" />}
      {tab === "management" && <UserManagement initialProfiles={profiles} />}
    </div>
  );
}
