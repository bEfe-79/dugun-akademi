"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import ProgressCard from "@/components/ui/ProgressCard";
import AnnouncementsWidget from "@/components/ui/AnnouncementsWidget";
import StatCard from "@/components/ui/StatCard";

function fmt(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n ?? 0);
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Record<string, number & string> | null>(null);
  const [announcements, setAnnouncements] = useState<Record<string, string>[]>([]);
  const [activityCounts, setActivityCounts] = useState<Record<string, number>>({});
  const [logCount, setLogCount] = useState(0);
  const [hasLogToday, setHasLogToday] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.id) { setLoading(false); return; }
      const userId = session.user.id;
      const today = new Date().toISOString().split("T")[0];
      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

      const [profileRes, annoRes, logsRes, todayRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("announcements").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(5),
        supabase.from("daily_logs").select("activity_type").eq("user_id", userId).gte("log_date", firstOfMonth),
        supabase.from("daily_logs").select("id").eq("user_id", userId).eq("log_date", today).limit(1),
      ]);

      setProfile(profileRes.data);
      setAnnouncements(annoRes.data ?? []);

      const counts = (logsRes.data ?? []).reduce((acc: Record<string, number>, l: { activity_type: string }) => {
        acc[l.activity_type] = (acc[l.activity_type] ?? 0) + 1;
        return acc;
      }, {});
      setActivityCounts(counts);
      setLogCount(logsRes.data?.length ?? 0);
      setHasLogToday((todayRes.data?.length ?? 0) > 0);
      setLoading(false);
    });
  }, []);

  const target = profile?.monthly_target ?? 0;
  const sales  = profile?.current_sales ?? 0;
  const rate   = target > 0 ? +((sales / target) * 100).toFixed(1) : 0;

  const h = new Date().getHours();
  const greeting = h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar";

  let rateColor = "#ef4444";
  if (rate >= 100) rateColor = "#10b981";
  else if (rate >= 75) rateColor = "#f59e0b";
  else if (rate >= 50) rateColor = "#f97316";

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256, color: "#64748b" }}>
      <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" style={{ marginRight: 12 }} />
      Yükleniyor...
    </div>
  );

  return (
    <div style={{ maxWidth: 1152, margin: "0 auto" }} className="space-y-6">

      {/* Başlık */}
      <div className="animate-fade-up">
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 4 }}>{greeting},</p>
        <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 700, color: "#1e293b" }}>
          {profile?.full_name ?? "Hoş geldiniz"} 👋
        </h1>
      </div>

      {/* Stat kartları — mobilde 2 kolon, büyük ekranda 4 kolon */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 12,
      }} className="stagger">
        <style>{`@media(min-width:1024px){.stat-grid{grid-template-columns:repeat(4,1fr)!important}}`}</style>
        <div style={{ display: "contents" }} className="stat-grid">
          <StatCard label="Aylık Hedef"    value={fmt(target)} icon="🎯" sub="Bu ayki hedefiniz" />
          <StatCard label="Gerçekleşen"    value={fmt(sales)}  icon="💰" sub="Tamamlanan satışlar" accent />
          <StatCard label="Başarı Oranı"   value={`%${rate}`}  icon="📊"
            sub={rate >= 100 ? "🏆 Hedef aşıldı!" : "Hedefe devam"} rateColor={rateColor} />
          <StatCard label="Bu Ay Aktivite" value={String(logCount)} icon="📋" sub="Toplam kayıt" />
        </div>
      </div>

      {/* Hızlı erişim: Satış Günlüğü */}
      <div className="animate-fade-up">
        <Link href="/logs" style={{ textDecoration: "none" }}>
          <div className="card cursor-pointer transition-all hover:shadow-md"
            style={{ border: "2px solid #00abaa", backgroundColor: "#f0fffe", padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#00abaa", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 20 }}>📝</span>
                </div>
                <div>
                  <p style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 15, marginBottom: 2 }}>
                    Satış Günlüğü
                  </p>
                  <p style={{ color: "#64748b", fontSize: 13 }}>
                    {hasLogToday ? "✅ Bugün kayıt girildi" : "⚠️ Bugün henüz kayıt girilmedi"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 13, color: "#00abaa", fontWeight: 600 }}>
                  {hasLogToday ? "Yeni Kayıt Ekle" : "Kayıt Gir"}
                </span>
                <span style={{ fontSize: 18, color: "#00abaa" }}>→</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Alt bölüm: Progress + Duyurular */}
      {/* Mobilde tek kolon, desktop'ta iki kolon */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 20,
      }}>
        <style>{`@media(min-width:768px){.bottom-grid{grid-template-columns:1fr 1fr!important}}`}</style>
        <div style={{ display: "contents" }} className="bottom-grid">
          <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <ProgressCard
              monthlyTarget={target}
              currentSales={sales}
              successRate={rate}
              activityCounts={activityCounts}
            />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <AnnouncementsWidget announcements={announcements as any} />
          </div>
        </div>
      </div>

    </div>
  );
}
