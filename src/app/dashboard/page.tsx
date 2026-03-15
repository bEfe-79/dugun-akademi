import { createClient } from "@/lib/supabase/server";
import ProgressCard from "@/components/ui/ProgressCard";
import AnnouncementsWidget from "@/components/ui/AnnouncementsWidget";
import StatCard from "@/components/ui/StatCard";

export const metadata = { title: "Dashboard | Dugun Akademi" };

function fmt(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency", currency: "TRY", maximumFractionDigits: 0,
  }).format(n ?? 0);
}

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  const [profileRes, annoRes, logsRes] = await Promise.all([
    userId
      ? supabase.from("profiles").select("*").eq("id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("announcements").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(5),
    userId
      ? supabase.from("daily_logs").select("activity_type").eq("user_id", userId).gte("log_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0])
      : Promise.resolve({ data: [] }),
  ]);

  const profile = profileRes.data;
  const announcements = annoRes.data ?? [];
  const logs = logsRes.data ?? [];

  const target = profile?.monthly_target ?? 0;
  const sales = profile?.current_sales ?? 0;
  const rate = target > 0 ? +((sales / target) * 100).toFixed(1) : 0;

  const counts = logs.reduce((acc: Record<string, number>, l: { activity_type: string }) => {
    acc[l.activity_type] = (acc[l.activity_type] ?? 0) + 1;
    return acc;
  }, {});

  const h = new Date().getHours();
  const greeting = h < 12 ? "Gunaydın" : h < 18 ? "Iyi gunler" : "Iyi aksamlar";

  let rateColor = "text-rose-400";
  if (rate >= 100) { rateColor = "text-emerald-400"; }
  else if (rate >= 75) { rateColor = "text-amber-400"; }
  else if (rate >= 50) { rateColor = "text-orange-400"; }

  const name = profile?.full_name ?? sessionData?.session?.user?.email ?? "Hos geldiniz";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="animate-fade-up">
        <p className="text-stone-500 text-sm mb-1">{greeting},</p>
        <h1 className="font-display text-3xl font-bold text-stone-100">
          {name} <span className="gradient-text">👋</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard label="Aylik Hedef" value={fmt(target)} icon="🎯" sub="Bu ayki hedefiniz" />
        <StatCard label="Gerceklesen" value={fmt(sales)} icon="💰" sub="Tamamlanan satislar" accent />
        <StatCard label="Basari Orani" value={`%${rate}`} icon="📊" sub={rate >= 100 ? "Hedef asildi!" : "Hedefe devam"} rateColor={rateColor} />
        <StatCard label="Bu Ay Aktivite" value={String(logs.length)} icon="📋" sub="Toplam kayit" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 stagger">
        <div className="lg:col-span-3">
          <ProgressCard monthlyTarget={target} currentSales={sales} successRate={rate} activityCounts={counts} />
        </div>
        <div className="lg:col-span-2">
          <AnnouncementsWidget announcements={announcements} />
        </div>
      </div>
    </div>
  );
}
