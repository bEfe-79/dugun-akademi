// src/app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import ProgressCard from "@/components/ui/ProgressCard";
import AnnouncementsWidget from "@/components/ui/AnnouncementsWidget";
import StatCard from "@/components/ui/StatCard";

export const metadata = { title: "Dashboard | Düğün Akademi" };

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: announcements }, { data: recentLogs }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user!.id).single(),
      supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("daily_logs")
        .select("activity_type")
        .eq("user_id", user!.id)
        .gte("log_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]),
    ]);

  const successRate =
    profile && profile.monthly_target > 0
      ? +((profile.current_sales / profile.monthly_target) * 100).toFixed(1)
      : 0;

  const activityCounts = (recentLogs ?? []).reduce(
    (acc, l) => ({ ...acc, [l.activity_type]: (acc[l.activity_type] ?? 0) + 1 }),
    {} as Record<string, number>
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Günaydın";
    if (h < 18) return "İyi günler";
    return "İyi akşamlar";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="animate-fade-up">
        <p className="text-stone-500 text-sm mb-1">{greeting()},</p>
        <h1 className="font-display text-3xl font-bold text-stone-100">
          {profile?.full_name ?? "—"}
          <span className="gradient-text"> 👋</span>
        </h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard
          label="Aylık Hedef"
          value={formatCurrency(profile?.monthly_target ?? 0)}
          icon="🎯"
          sub="Bu ayki hedefiniz"
        />
        <StatCard
          label="Gerçekleşen"
          value={formatCurrency(profile?.current_sales ?? 0)}
          icon="💰"
          sub="Tamamlanan satışlar"
          accent
        />
        <StatCard
          label="Başarı Oranı"
          value={`%${successRate}`}
          icon="📊"
          sub={successRate >= 100 ? "🎉 Hedef aşıldı!" : "Hedefe kalan var"}
          rateColor={rateColor(successRate)}
        />
        <StatCard
          label="Bu Ay Aktivite"
          value={String(recentLogs?.length ?? 0)}
          icon="📋"
          sub="Toplam kayıt"
        />
      </div>

      {/* Progress + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 stagger">
        <div className="lg:col-span-3">
          <ProgressCard
            monthlyTarget={profile?.monthly_target ?? 0}
            currentSales={profile?.current_sales ?? 0}
            successRate={successRate}
            activityCounts={activityCounts}
          />
        </div>
        <div className="lg:col-span-2">
          <AnnouncementsWidget announcements={announcements ?? []} />
        </div>
      </div>
    </div>
  );
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
}

function rateColor(rate: number) {
  if (rate >= 100) return "text-emerald-400";
  if (rate >= 75)  return "text-amber-400";
  if (rate >= 50)  return "text-orange-400";
  return "text-rose-400";
}
