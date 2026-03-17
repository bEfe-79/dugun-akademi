"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const ACTIVITY_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  call:    { label: "Satış Görüşmesi", icon: "📞", color: "#00abaa", bg: "rgba(0,171,170,.1)" },
  meeting: { label: "Ekip Toplantısı", icon: "🤝", color: "#db0962", bg: "rgba(219,9,98,.08)" },
  visit:   { label: "Randevu Araması", icon: "📅", color: "#3b82f6", bg: "rgba(59,130,246,.08)" },
  demo:    { label: "Demo",            icon: "🎯", color: "#8b5cf6", bg: "rgba(139,92,246,.08)" },
  email:   { label: "E-posta",         icon: "✉️", color: "#f59e0b", bg: "rgba(245,158,11,.08)" },
  other:   { label: "Diğer",           icon: "📌", color: "#64748b", bg: "rgba(100,116,139,.08)" },
};

export default function DashboardPage() {
  const [profile, setProfile]       = useState<Record<string, any> | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activityCounts, setActivityCounts] = useState<Record<string, number>>({});
  const [logCount, setLogCount]     = useState(0);
  const [hasLogToday, setHasLogToday] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [schoolData, setSchoolData] = useState({
    trainingsCompleted: 0,
    examsPassed: 0,
    examsPending: 0,
    rank: 0,
    progress: 0,
    urgentExam: null as { title: string; daysLeft: number } | null,
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.id) { setLoading(false); return; }
      const userId = session.user.id;
      const today = new Date().toISOString().split("T")[0];
      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

      const [profileRes, annoRes, logsRes, todayRes, trainTotalRes, compRes, subRes, assignRes, allSubsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("announcements").select("*").eq("is_active", true).order("priority", { ascending: false }).limit(3),
        supabase.from("daily_logs").select("activity_type").eq("user_id", userId).gte("log_date", firstOfMonth),
        supabase.from("daily_logs").select("id").eq("user_id", userId).eq("log_date", today).limit(1),
        supabase.from("trainings").select("id").eq("is_published", true),
        supabase.from("training_completions").select("id").eq("user_id", userId),
        supabase.from("exam_submissions").select("exam_id,is_passed,is_finalized").eq("user_id", userId),
        supabase.from("exam_assignments").select("exam_id,due_date,exams(title)").eq("user_id", userId),
        supabase.from("exam_submissions").select("user_id,score").eq("is_finalized", true),
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

      // Satış Okulu
      const submissions = subRes.data ?? [];
      const assignments = assignRes.data ?? [];
      const finalizedIds = new Set(submissions.filter((s: any) => s.is_finalized).map((s: any) => s.exam_id));
      const passedCount  = submissions.filter((s: any) => s.is_passed && s.is_finalized).length;
      const pendingCount = assignments.filter((a: any) => !finalizedIds.has(a.exam_id)).length;
      const completedCount = compRes.data?.length ?? 0;
      const totalTrainings = trainTotalRes.data?.length ?? 0;
      const progress = totalTrainings > 0 ? Math.round((completedCount / totalTrainings) * 100) : 0;

      // Yaklaşan deadline
      let urgentExam: { title: string; daysLeft: number } | null = null;
      const pending = assignments.filter((a: any) => !finalizedIds.has(a.exam_id) && a.due_date);
      if (pending.length > 0) {
        pending.sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        const nearest = pending[0];
        const daysLeft = Math.ceil((new Date(nearest.due_date).getTime() - new Date(today).getTime()) / 86400000);
        if (daysLeft <= 7) urgentExam = { title: (nearest.exams as any)?.title ?? "Sınav", daysLeft };
      }

      // Sıralama
      const allSubs = allSubsRes.data ?? [];
      const scoreMap: Record<string, number[]> = {};
      allSubs.forEach((s: any) => { if (!scoreMap[s.user_id]) scoreMap[s.user_id] = []; scoreMap[s.user_id].push(s.score ?? 0); });
      const sorted = Object.entries(scoreMap).map(([uid, scores]) => ({ uid, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) })).sort((a, b) => b.avg - a.avg);
      const rank = sorted.findIndex(e => e.uid === userId) + 1;

      setSchoolData({ trainingsCompleted: completedCount, examsPassed: passedCount, examsPending: pendingCount, rank: rank > 0 ? rank : 0, progress, urgentExam });
      setLoading(false);
    });
  }, []);

  const h = new Date().getHours();
  const greeting = h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar";

  const TYPE_META: Record<string, { icon: string; color: string; bg: string; label: string }> = {
    quote_of_day: { icon: "✦", color: "#f59e0b", bg: "#fffbeb", label: "Günün Sözü" },
    announcement: { icon: "◈", color: "#3b82f6", bg: "#eff6ff", label: "Duyuru" },
    alert:        { icon: "⚠", color: "#ef4444", bg: "#fef2f2", label: "Uyarı" },
  };

  // Aktivite kartları için ilk 4 tür
  const activityCards = Object.entries(activityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Toplam kayıt kartını ekle
  const allCards = [
    { key: "total", label: "Toplam Kayıt", icon: "📋", color: "#475569", bg: "rgba(100,116,139,.08)", value: logCount },
    ...activityCards.map(([type, count]) => ({
      key: type,
      label: ACTIVITY_META[type]?.label ?? type,
      icon: ACTIVITY_META[type]?.icon ?? "📌",
      color: ACTIVITY_META[type]?.color ?? "#64748b",
      bg: ACTIVITY_META[type]?.bg ?? "rgba(100,116,139,.08)",
      value: count,
    })),
  ].slice(0, 4);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256, color: "#64748b" }}>
      <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" style={{ marginRight: 12 }} />
      Yükleniyor...
    </div>
  );

  return (
    <div style={{ maxWidth: 1152, margin: "0 auto" }} className="space-y-4">

      {/* Greeting — sadece masaüstünde, mobilde TopBar'da */}
      <div className="hidden md:block animate-fade-up">
        <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 3 }}>{greeting}</p>
        <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 26, fontWeight: 700, color: "#1e293b", letterSpacing: "-0.3px" }}>
          Selam {profile?.full_name ?? "Hoş geldiniz"} 👋
        </h1>
      </div>

      {/* Bento grid — masaüstünde sol+sağ, mobilde dikey */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        <style>{`@media(min-width:1024px){.bento-grid{grid-template-columns:1fr 240px!important}}`}</style>
        <div style={{ display: "contents" }} className="bento-grid">

          {/* Sol bölüm */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

            {/* Satış Okulu kartı */}
            <div className="animate-fade-up" style={{ backgroundColor: "#fff", borderRadius: 20, boxShadow: "0 8px 30px rgba(0,0,0,.04),0 2px 8px rgba(0,0,0,.03)", padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 4 }}>Satış Okulu</p>
                  <p style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 16 }}>Gelişim Takibi</p>
                </div>
                <Link href="/school/trainings" style={{ textDecoration: "none", fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 99, backgroundColor: "#fce7f0", color: "#a0174a" }}>
                  Devam Et →
                </Link>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                {/* Ring grafik */}
                <div style={{ position: "relative", width: 108, height: 108, flexShrink: 0 }}>
                  <svg viewBox="0 0 108 108" width="108" height="108">
                    <circle cx="54" cy="54" r="44" fill="none" stroke="#f1f5f9" strokeWidth="9" />
                    <circle cx="54" cy="54" r="44" fill="none" stroke="#db0962" strokeWidth="9"
                      strokeDasharray="276"
                      strokeDashoffset={276 - (276 * schoolData.progress / 100)}
                      strokeLinecap="round"
                      transform="rotate(-90 54 54)" />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: "#db0962", lineHeight: 1 }}>%{schoolData.progress}</p>
                    <p style={{ fontSize: 9, color: "#94a3b8", marginTop: 3 }}>tamamlandı</p>
                  </div>
                </div>

                {/* 3 stat */}
                <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 0 }}>
                  {[
                    { label: "Eğitim\nTamamlandı", value: schoolData.trainingsCompleted, color: "#1e293b", bg: "#f8fafc" },
                    { label: "Sınav\nGeçildi",      value: schoolData.examsPassed,        color: "#1e293b", bg: "#f8fafc" },
                    { label: "Genel\nSıralama",     value: schoolData.rank > 0 ? `${schoolData.rank}.` : "—", color: "#00abaa", bg: "#f0fffe" },
                  ].map(s => (
                    <div key={s.label} style={{ flex: 1, backgroundColor: s.bg, borderRadius: 14, padding: "16px 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, minWidth: 0 }}>
                      <p style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textAlign: "center", lineHeight: 1.4, whiteSpace: "pre-line" }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inner progress */}
              <div style={{ marginTop: 20, backgroundColor: "#f8fafc", borderRadius: 12, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Genel İlerleme</p>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "#db0962" }}>%{schoolData.progress}</p>
                </div>
                <div style={{ height: 6, borderRadius: 99, backgroundColor: "#e2e8f0", overflow: "hidden" }}>
                  <div style={{ width: `${schoolData.progress}%`, height: "100%", borderRadius: 99, backgroundColor: "#db0962", transition: "width .4s ease" }} />
                </div>
              </div>

              {/* Deadline uyarısı */}
              {schoolData.urgentExam && (
                <div style={{ marginTop: 12, backgroundColor: "#fffbeb", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                  <span style={{ fontSize: 13, color: "#92400e" }}>
                    <strong>{schoolData.urgentExam.title}</strong> için son {schoolData.urgentExam.daysLeft} gün kaldı
                  </span>
                </div>
              )}
            </div>

            {/* Aktivite kartları */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
              <style>{`@media(min-width:640px){.act-grid{grid-template-columns:repeat(4,1fr)!important}}`}</style>
              <div style={{ display: "contents" }} className="act-grid">
                {allCards.map(c => (
                  <div key={c.key} className="animate-fade-up" style={{ backgroundColor: "#fff", borderRadius: 20, boxShadow: "0 8px 30px rgba(0,0,0,.04),0 2px 8px rgba(0,0,0,.03)", padding: 18 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 18 }}>
                      {c.icon}
                    </div>
                    <p style={{ fontSize: 30, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</p>
                    <p style={{ fontSize: 12, fontWeight: 500, color: "#64748b", marginTop: 5 }}>{c.label}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sağ panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Satış Günlüğü */}
            <Link href="/logs" style={{ textDecoration: "none" }}>
              <div className="animate-fade-up" style={{ backgroundColor: "#f0fffe", backgroundImage: "linear-gradient(150deg,#f0fffe,#e6f9f8)", borderRadius: 20, boxShadow: "0 8px 30px rgba(0,0,0,.04),0 2px 8px rgba(0,0,0,.03)", padding: 18, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: "#00abaa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 4px 12px rgba(0,171,170,.3)", flexShrink: 0 }}>
                    📝
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>Satış Günlüğü</p>
                    <p style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                      {hasLogToday ? "✅ Bugün kayıt girildi" : "⚠️ Bugün henüz kayıt yok"}
                    </p>
                  </div>
                </div>
                <div style={{ backgroundColor: "#00abaa", borderRadius: 12, padding: 10, textAlign: "center", color: "#fff", fontSize: 12, fontWeight: 700, boxShadow: "0 4px 12px rgba(0,171,170,.25)" }}>
                  + Yeni Kayıt Ekle
                </div>
              </div>
            </Link>

            {/* Duyurular */}
            <div className="animate-fade-up" style={{ backgroundColor: "#fff", borderRadius: 20, boxShadow: "0 8px 30px rgba(0,0,0,.04),0 2px 8px rgba(0,0,0,.03)", padding: 18, flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 12 }}>Duyurular</p>
              {announcements.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "24px 0" }}>Aktif duyuru yok.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {announcements.map(a => {
                    const meta = TYPE_META[a.type] ?? TYPE_META.announcement;
                    return (
                      <div key={a.id} style={{ padding: "12px 14px", backgroundColor: meta.bg, borderRadius: 12 }}>
                        <p style={{ fontSize: 9, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 5 }}>
                          {meta.icon} {meta.label}
                        </p>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", lineHeight: 1.45 }}>
                          {a.type === "quote_of_day" ? `"${a.title}"` : a.title}
                        </p>
                        {a.body && <p style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{a.body}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/*
        ── GİZLENEN ALANLAR ──
        Satış hedefi / gerçekleşen / başarı oranı kartları gizlendi.
        Geri açmak için bu blokun yorumunu kaldır.

      <StatCard label="Aylık Hedef" ... />
      <StatCard label="Gerçekleşen" ... />
      <StatCard label="Başarı Oranı" ... />
      <ProgressCard ... />
      */}

    </div>
  );
}
