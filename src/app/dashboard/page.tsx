import { createClient } from "@/lib/supabase/server";
import ProgressCard from "@/components/ui/ProgressCard";
import AnnouncementsWidget from "@/components/ui/AnnouncementsWidget";
import StatCard from "@/components/ui/StatCard";
import Link from "next/link";

export const metadata = { title: "Dashboard | Düğün Akademi" };

function fmt(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n ?? 0);
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  const [profileRes, annoRes, logsRes] = await Promise.all([
    userId ? supabase.from("profiles").select("*").eq("id", userId).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("announcements").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(5),
    userId ? supabase.from("daily_logs").select("activity_type").eq("user_id", userId)
        .gte("log_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0])
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
  const greeting = h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar";

  let rateColor = "#ef4444";
  if (rate >= 100) rateColor = "#10b981";
  else if (rate >= 75) rateColor = "#f59e0b";
  else if (rate >= 50) rateColor = "#f97316";

  const today = new Date().toISOString().split("T")[0];
  const { data: todayLogs } = userId
    ? await supabase.from("daily_logs").select("id").eq("user_id", userId).eq("log_date", today).limit(1)
    : { data: [] };
  const hasLogToday = (todayLogs?.length ?? 0) > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="animate-fade-up">
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 4 }}>{greeting},</p>
        <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 30, fontWeight: 700, color: "#1e293b" }}>
          {profile?.full_name ?? session?.user?.email ?? "Hoş geldiniz"} 👋
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard label="Aylık Hedef" value={fmt(target)} icon="🎯" sub="Bu ayki hedefiniz" />
        <StatCard label="Gerçekleşen" value={fmt(sales)} icon="💰" sub="Tamamlanan satışlar" accent />
        <StatCard label="Başarı Oranı" value={`%${rate}`} icon="📊"
          sub={rate >= 100 ? "🎉 Hedef aşıldı!" : "Hedefe devam"} rateColor={rateColor} />
        <StatCard label="Bu Ay Aktivite" value={String(logs.length)} icon="📋" sub="Toplam kayıt" />
      </div>

      {/* Hızlı erişim: Satış Günlüğü */}
      <div className="animate-fade-up">
        <Link href="/logs" style={{ textDecoration: "none" }}>
          <div className="card flex items-center justify-between p-5 cursor-pointer transition-all hover:shadow-md"
            style={{ border: "2px solid #00abaa", backgroundColor: "#f0fffe" }}>
            <div className="flex items-center gap-4">
              <div style={{
                width: 48, height: 48, borderRadius: 14, backgroundColor: "#00abaa",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0
              }}>
                📋
              </div>
              <div>
                <p style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 16 }}>
                  Satış Günlüğü
                </p>
                <p style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>
                  {hasLogToday
                    ? `Bugün ${todayLogs?.length ?? 0} kayıt girdiniz. Devam edin →`
                    : "Bugün henüz kayıt girmediniz. Hemen ekleyin →"}
                </p>
              </div>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: 10, backgroundColor: "#00abaa",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 18, flexShrink: 0
            }}>
              →
            </div>
          </div>
        </Link>
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
