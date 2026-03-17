"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import ProgressCard from "@/components/ui/ProgressCard";
import AnnouncementsWidget from "@/components/ui/AnnouncementsWidget";
import type { Announcement } from "@/types";

export default function DashboardPage() {
  const [profile, setProfile]           = useState<Record<string, any> | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activityCounts, setActivityCounts] = useState<Record<string, number>>({});
  const [logCount, setLogCount]         = useState(0);
  const [hasLogToday, setHasLogToday]   = useState(false);
  const [loading, setLoading]           = useState(true);

  // Satış Okulu verileri
  const [schoolData, setSchoolData] = useState({
    trainingsCompleted: 0,
    examsPassed: 0,
    examsPending: 0,
    rank: 0,
    urgentExam: null as { title: string; daysLeft: number } | null,
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.id) { setLoading(false); return; }
      const userId = session.user.id;
      const today = new Date().toISOString().split("T")[0];
      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

      const [profileRes, annoRes, logsRes, todayRes, compRes, subRes, assignRes, allSubsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("announcements").select("*").eq("is_active", true).order("priority", { ascending: false }).order("created_at", { ascending: false }).limit(5),
        supabase.from("daily_logs").select("activity_type").eq("user_id", userId).gte("log_date", firstOfMonth),
        supabase.from("daily_logs").select("id").eq("user_id", userId).eq("log_date", today).limit(1),
        // Satış Okulu
        supabase.from("training_completions").select("id").eq("user_id", userId),
        supabase.from("exam_submissions").select("exam_id, is_passed, is_finalized").eq("user_id", userId),
        supabase.from("exam_assignments").select("exam_id, due_date, exams(title)").eq("user_id", userId),
        supabase.from("exam_submissions").select("user_id, score").eq("is_finalized", true),
      ]);

      setProfile(profileRes.data);
      setAnnouncements(annoRes.data ?? []);

      const counts = (logsRes.data ?? []).reduce((acc: Record<string, number>, l: any) => {
        acc[l.activity_type] = (acc[l.activity_type] ?? 0) + 1;
        return acc;
      }, {});
      setActivityCounts(counts);
      setLogCount(logsRes.data?.length ?? 0);
      setHasLogToday((todayRes.data?.length ?? 0) > 0);

      // Satış Okulu hesapla
      const submissions = subRes.data ?? [];
      const assignments = assignRes.data ?? [];
      const finalizedIds = new Set(submissions.filter((s: any) => s.is_finalized).map((s: any) => s.exam_id));
      const passedCount = submissions.filter((s: any) => s.is_passed && s.is_finalized).length;
      const pendingCount = assignments.filter((a: any) => !finalizedIds.has(a.exam_id)).length;

      // Yaklaşan sınav deadline
      let urgentExam: { title: string; daysLeft: number } | null = null;
      const pending = assignments.filter((a: any) => !finalizedIds.has(a.exam_id) && a.due_date);
      if (pending.length > 0) {
        pending.sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        const nearest = pending[0];
        const daysLeft = Math.ceil((new Date(nearest.due_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 7) urgentExam = { title: (nearest.exams as any)?.title ?? "Sınav", daysLeft };
      }

      // Sıralama hesapla
      const allSubs = allSubsRes.data ?? [];
      const scoreMap: Record<string, number[]> = {};
      allSubs.forEach((s: any) => {
        if (!scoreMap[s.user_id]) scoreMap[s.user_id] = [];
        scoreMap[s.user_id].push(s.score ?? 0);
      });
      const avgScores = Object.entries(scoreMap).map(([uid, scores]) => ({
        uid, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      })).sort((a, b) => b.avg - a.avg);
      const rank = avgScores.findIndex(e => e.uid === userId) + 1;

      setSchoolData({
        trainingsCompleted: compRes.data?.length ?? 0,
        examsPassed: passedCount,
        examsPending: pendingCount,
        rank: rank > 0 ? rank : 0,
        urgentExam,
      });

      setLoading(false);
    });
  }, []);

  const h = new Date().getHours();
  const greeting = h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar";

  // Duyuruları 3'e böl
  const quote = announcements.find(a => a.type === "quote_of_day");
  const others = announcements.filter(a => a.type !== "quote_of_day").slice(0, 2);
  const annoBoxes = [
    ...(quote ? [quote] : []),
    ...others,
  ].slice(0, 3);

  const TYPE_META: Record<string, { icon: string; color: string; bg: string; border: string; label: string }> = {
    quote_of_day:  { icon: "✦", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", label: "Günün Sözü" },
    announcement:  { icon: "◈", color: "#00abaa", bg: "#f0fffe", border: "#b2eded", label: "Duyuru" },
    alert:         { icon: "⚠", color: "#ef4444", bg: "#fef2f2", border: "#fecaca", label: "Uyarı" },
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256, color: "#64748b" }}>
      <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" style={{ marginRight: 12 }} />
      Yükleniyor...
    </div>
  );

  return (
    <div style={{ maxWidth: 1152, margin: "0 auto" }} className="space-y-5">

      {/* Başlık */}
      <div className="animate-fade-up">
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 4 }}>{greeting},</p>
        <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: "clamp(22px,5vw,28px)", fontWeight: 700, color: "#1e293b" }}>
          {profile?.full_name ?? "Hoş geldiniz"} 👋
        </h1>
      </div>

      {/* Aktivite kartı */}
      <div className="card animate-fade-up"
        style={{ borderLeft: "3px solid #00abaa", borderRadius: "0 12px 12px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
          Bu Ay Aktivite
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontFamily: "'Chalet', sans-serif", fontSize: 32, fontWeight: 700, color: "#00abaa", lineHeight: 1 }}>{logCount}</p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>toplam kayıt</p>
          </div>
          <div style={{ width: "0.5px", height: 40, backgroundColor: "#e2e8f0", flexShrink: 0 }} className="hidden sm:block" />
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", flex: 1 }}>
            {Object.entries(activityCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([type, count]) => {
              const labels: Record<string, string> = { call: "Satış Görüşmesi", visit: "Randevu Araması", meeting: "Ekip Toplantısı", other: "Diğer" };
              return (
                <div key={type}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#1e293b" }}>{count}</p>
                  <p style={{ fontSize: 11, color: "#94a3b8" }}>{labels[type] ?? type}</p>
                </div>
              );
            })}
            {Object.keys(activityCounts).length === 0 && (
              <p style={{ fontSize: 13, color: "#94a3b8" }}>Henüz bu ay kayıt girilmedi.</p>
            )}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, backgroundColor: hasLogToday ? "#f0fdf4" : "#fff7ed", border: `1px solid ${hasLogToday ? "#bbf7d0" : "#fde68a"}`, borderRadius: 99, padding: "4px 12px", flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: hasLogToday ? "#10b981" : "#f59e0b", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: hasLogToday ? "#059669" : "#92400e", fontWeight: 600 }}>
              {hasLogToday ? "Bugün girildi" : "Bugün kayıt yok"}
            </span>
          </div>
        </div>
      </div>

      {/* Satış Okulu kartı */}
      <div className="animate-fade-up" style={{ backgroundColor: "#fce7f0", border: "2px solid #db0962", borderRadius: 12, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🎓</span>
            <span style={{ fontFamily: "'Chalet', sans-serif", fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Satış Okulu</span>
          </div>
          <Link href="/school/trainings" style={{ fontSize: 13, color: "#db0962", textDecoration: "none", fontWeight: 600 }}>
            Devam Et →
          </Link>
        </div>

        {/* 4 mini stat — mobilde 2x2, masaüstünde 4 yan yana */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 10 }}>
          <style>{`@media(min-width:480px){.school-grid{grid-template-columns:repeat(4,1fr)!important}}`}</style>
          <div style={{ display: "contents" }} className="school-grid">
            {[
              { label: "Eğitim Tamamlandı", value: schoolData.trainingsCompleted, color: "#00abaa" },
              { label: "Sınav Geçildi",      value: schoolData.examsPassed,        color: "#00abaa" },
              { label: "Bekleyen Sınav",     value: schoolData.examsPending,       color: schoolData.examsPending > 0 ? "#db0962" : "#00abaa" },
              { label: "Sıralama",           value: schoolData.rank > 0 ? `${schoolData.rank}.` : "—", color: "#00abaa" },
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: "#fff", borderRadius: 8, padding: "12px 10px", textAlign: "center" }}>
                <p style={{ fontFamily: "'Chalet', sans-serif", fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</p>
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, lineHeight: 1.3 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Yaklaşan sınav uyarısı */}
        {schoolData.urgentExam && (
          <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
            <span style={{ fontSize: 13, color: "#92400e" }}>
              <strong>{schoolData.urgentExam.title}</strong> için son {schoolData.urgentExam.daysLeft} gün kaldı
            </span>
          </div>
        )}
      </div>

      {/* Alt satır: Satış Günlüğü + Duyurular */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }} className="animate-fade-up">
        <style>{`@media(min-width:768px){.bottom-grid{grid-template-columns:1fr 2fr!important}}`}</style>
        <div style={{ display: "contents" }} className="bottom-grid">

          {/* Satış Günlüğü */}
          <Link href="/logs" style={{ textDecoration: "none" }}>
            <div className="card" style={{ border: "2px solid #00abaa", backgroundColor: "#f0fffe", display: "flex", flexDirection: "column", gap: 14, height: "100%", cursor: "pointer", transition: "box-shadow .2s" }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,171,170,0.15)"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#00abaa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📝</div>
                <div>
                  <p style={{ fontWeight: 600, color: "#1e293b", fontSize: 15, marginBottom: 2 }}>Satış Günlüğü</p>
                  <p style={{ color: "#64748b", fontSize: 13 }}>
                    {hasLogToday ? "✅ Bugün kayıt girildi" : "⚠️ Bugün henüz kayıt yok"}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "center", padding: "8px", borderRadius: 10, backgroundColor: "#00abaa", color: "#fff", fontSize: 13, fontWeight: 600 }}>
                Yeni Kayıt Ekle →
              </div>
            </div>
          </Link>

          {/* Duyurular — 3 kutu yan yana */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Duyurular</p>

            {annoBoxes.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "24px 0" }}>Aktif duyuru yok.</p>
            ) : (
              /* Masaüstünde 3 yan yana, mobilde alt alta */
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, flex: 1 }}>
                <style>{`@media(min-width:600px){.ann-grid{grid-template-columns:repeat(${annoBoxes.length},1fr)!important}}`}</style>
                <div style={{ display: "contents" }} className="ann-grid">
                  {annoBoxes.map(a => {
                    const meta = TYPE_META[a.type] ?? TYPE_META.announcement;
                    return (
                      <div key={a.id} style={{ padding: "12px 14px", backgroundColor: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          {meta.icon} {meta.label}
                        </p>
                        <p style={{ fontSize: 13, fontWeight: a.type === "quote_of_day" ? 400 : 600, color: "#1e293b", fontStyle: a.type === "quote_of_day" ? "italic" : "normal", lineHeight: 1.5, flex: 1 }}>
                          {a.type === "quote_of_day" ? `"${a.title}"` : a.title}
                        </p>
                        {a.body && a.type !== "quote_of_day" && (
                          <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>{a.body}</p>
                        )}
                        {a.body && a.type === "quote_of_day" && (
                          <p style={{ fontSize: 12, color: "#94a3b8" }}>{a.body}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/*
        ── GİZLENEN ALANLAR ──
        Satış hedefi / gerçekleşen / başarı oranı kartları gizlendi.
        İleride tekrar açmak için aşağıdaki blokun yorumunu kaldır.

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }} className="stagger">
        <StatCard label="Aylık Hedef"    value={fmt(target)} icon="🎯" sub="Bu ayki hedefiniz" />
        <StatCard label="Gerçekleşen"    value={fmt(sales)}  icon="💰" sub="Tamamlanan satışlar" accent />
        <StatCard label="Başarı Oranı"   value={`%${rate}`}  icon="📊" sub={rate >= 100 ? "🏆 Hedef aşıldı!" : "Hedefe devam"} rateColor={rateColor} />
        <StatCard label="Bu Ay Aktivite" value={String(logCount)} icon="📋" sub="Toplam kayıt" />
      </div>

      <ProgressCard monthlyTarget={target} currentSales={sales} successRate={rate} activityCounts={activityCounts} />
      */}

    </div>
  );
}
