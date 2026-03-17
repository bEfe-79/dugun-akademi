"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Tab = "trainings" | "exams" | "leaderboard" | "certificates";

interface Training {
  id: string; title: string; description: string; content_type: string;
  content_url: string | null; content_text: string | null;
  group_name: string; order_index: number; completed?: boolean;
}
interface ExamAssignment {
  id: string; exam_id: string; due_date: string | null;
  exams: { id: string; title: string; description: string; group_name: string; passing_score: number; time_limit_minutes: number | null };
  submission?: { score: number | null; is_passed: boolean | null; is_finalized: boolean } | null;
}
interface Certificate {
  id: string; title: string; file_url: string; file_type: string;
  issued_at: string; exams?: { title: string } | null;
}
interface LeaderboardEntry {
  user_id: string; full_name: string; avatar_url: string | null;
  exam_count: number; passed_count: number; avg_score: number;
}

export default function SchoolPage() {
  const [tab, setTab]                   = useState<Tab>("trainings");
  const [userId, setUserId]             = useState<string | null>(null);
  const [trainings, setTrainings]       = useState<Training[]>([]);
  const [assignments, setAssignments]   = useState<ExamAssignment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading]           = useState(true);

  // Leaderboard state
  const [lbEntries, setLbEntries]       = useState<LeaderboardEntry[]>([]);
  const [lbExams, setLbExams]           = useState<{ id: string; title: string; group_name: string }[]>([]);
  const [lbGroups, setLbGroups]         = useState<string[]>([]);
  const [lbFilterGroup, setLbFilterGroup] = useState("Tümü");
  const [lbFilterExam, setLbFilterExam]   = useState("");
  const [rawSubs, setRawSubs]           = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.id) { setLoading(false); return; }
      const uid = session.user.id;
      setUserId(uid);

      const [trainRes, assignRes, certRes, compRes, subsRes, examsRes] = await Promise.all([
        supabase.from("trainings").select("*").eq("is_published", true).order("group_name").order("order_index"),
        supabase.from("exam_assignments").select("*, exams(id,title,description,group_name,passing_score,time_limit_minutes)").eq("user_id", uid),
        supabase.from("certificates").select("*, exams(title)").eq("user_id", uid).order("issued_at", { ascending: false }),
        supabase.from("training_completions").select("training_id").eq("user_id", uid),
        supabase.from("exam_submissions").select("user_id, exam_id, score, is_passed, exams(group_name), profiles(full_name, avatar_url)").eq("is_finalized", true),
        supabase.from("exams").select("id, title, group_name").eq("is_published", true).order("title"),
      ]);

      // Eğitimler
      const completedIds = new Set((compRes.data ?? []).map((c: any) => c.training_id));
      setTrainings((trainRes.data ?? []).map((t: any) => ({ ...t, completed: completedIds.has(t.id) })));

      // Sınavlar + submission'lar
      const examIds = (assignRes.data ?? []).map((a: any) => a.exam_id);
      let submissionsMap: Record<string, any> = {};
      if (examIds.length > 0) {
        const { data: subs } = await supabase.from("exam_submissions").select("exam_id, score, is_passed, is_finalized").eq("user_id", uid).in("exam_id", examIds);
        (subs ?? []).forEach((s: any) => { submissionsMap[s.exam_id] = s; });
      }
      setAssignments((assignRes.data ?? []).map((a: any) => ({ ...a, submission: submissionsMap[a.exam_id] ?? null })));
      setCertificates(certRes.data ?? []);

      // Leaderboard
      const allExams = examsRes.data ?? [];
      setLbExams(allExams);
      setLbGroups(["Tümü", ...Array.from(new Set(allExams.map((e: any) => e.group_name))).sort() as string[]]);
      setRawSubs(subsRes.data ?? []);
      buildLeaderboard(subsRes.data ?? [], "", "Tümü", allExams);

      setLoading(false);
    });
  }, []);

  // Leaderboard filtre değişince yeniden hesapla
  useEffect(() => {
    if (rawSubs.length > 0 || lbEntries.length >= 0) {
      buildLeaderboard(rawSubs, lbFilterExam, lbFilterGroup, lbExams);
    }
  }, [lbFilterExam, lbFilterGroup, rawSubs]);

  function buildLeaderboard(subs: any[], examId: string, group: string, allExams: any[]) {
    let filtered = subs;
    if (examId) {
      filtered = filtered.filter((s: any) => s.exam_id === examId);
    } else if (group !== "Tümü") {
      const ids = new Set(allExams.filter((e: any) => e.group_name === group).map((e: any) => e.id));
      filtered = filtered.filter((s: any) => ids.has(s.exam_id));
    }
    const map: Record<string, LeaderboardEntry> = {};
    for (const s of filtered) {
      const uid = s.user_id;
      if (!map[uid]) map[uid] = { user_id: uid, full_name: s.profiles?.full_name ?? "—", avatar_url: s.profiles?.avatar_url ?? null, exam_count: 0, passed_count: 0, avg_score: 0 };
      map[uid].exam_count++;
      map[uid].avg_score += s.score ?? 0;
      if (s.is_passed) map[uid].passed_count++;
    }
    const result = Object.values(map).map(e => ({ ...e, avg_score: e.exam_count > 0 ? Math.round(e.avg_score / e.exam_count) : 0 }))
      .sort((a, b) => b.avg_score - a.avg_score || b.passed_count - a.passed_count);
    setLbEntries(result);
  }

  async function toggleComplete(trainingId: string, completed: boolean) {
    if (!userId) return;
    const supabase = createClient();
    if (completed) await supabase.from("training_completions").delete().eq("user_id", userId).eq("training_id", trainingId);
    else await supabase.from("training_completions").insert({ user_id: userId, training_id: trainingId });
    setTrainings(prev => prev.map(t => t.id === trainingId ? { ...t, completed: !completed } : t));
  }

  const groupedTrainings = trainings.reduce((acc, t) => {
    (acc[t.group_name] = acc[t.group_name] || []).push(t);
    return acc;
  }, {} as Record<string, Training[]>);

  const completedCount = trainings.filter(t => t.completed).length;
  const passedCount    = assignments.filter(a => a.submission?.is_passed).length;
  const myRank         = lbEntries.findIndex(e => e.user_id === userId) + 1;
  const medals         = ["🥇", "🥈", "🥉"];
  const top3           = lbEntries.slice(0, 3);

  const TABS: { id: Tab; label: string }[] = [
    { id: "trainings",    label: "Eğitimler" },
    { id: "exams",        label: "Sınavlar" },
    { id: "leaderboard",  label: "Sıralama" },
    { id: "certificates", label: "Sertifikalar" },
  ];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256, color: "#64748b" }}>
      <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" style={{ marginRight: 12 }} />
      Yükleniyor...
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }} className="space-y-6">

      {/* Başlık */}
      <div className="animate-fade-up">
        <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: "clamp(22px,5vw,30px)", fontWeight: 700, color: "#1e293b" }}>
          Satış Okulu
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Gelişimini takip et, sınavlara hazırlan.</p>
      </div>

      {/* Özet kartlar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
        {[
          { label: "Eğitim",     value: trainings.length,   sub: "toplam" },
          { label: "Tamamlanan", value: completedCount,     sub: "eğitim",       accent: true },
          { label: "Sınav",      value: assignments.length, sub: "atandı" },
          { label: "Geçilen",    value: passedCount,        sub: "sınav",        pink: true },
          { label: "Sertifika",  value: certificates.length,sub: "kazanıldı" },
        ].map(c => (
          <div key={c.label} style={{ backgroundColor: c.accent ? "#f0fffe" : c.pink ? "#fce7f0" : "#fff", border: c.accent ? "2px solid #00abaa" : c.pink ? "2px solid #db0962" : "0.5px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{c.label}</p>
            <p style={{ fontFamily: "'Chalet', sans-serif", fontSize: 24, fontWeight: 700, color: c.accent ? "#00abaa" : c.pink ? "#db0962" : "#1e293b" }}>{c.value}</p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 12, padding: 4, gap: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "10px 6px", borderRadius: 10, border: "none",
            fontSize: "clamp(11px,3vw,14px)", fontWeight: 500, cursor: "pointer",
            transition: "all 0.15s", whiteSpace: "nowrap",
            backgroundColor: tab === t.id ? "#ffffff" : "transparent",
            color: tab === t.id ? "#00abaa" : "#64748b",
            boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── EĞİTİMLER ── */}
      {tab === "trainings" && (
        <div className="space-y-6">
          {Object.keys(groupedTrainings).length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: "64px 0", color: "#94a3b8" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
              <p>Henüz eğitim eklenmemiş.</p>
            </div>
          )}
          {Object.entries(groupedTrainings).map(([group, items]) => (
            <div key={group}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>{group}</p>
              <div className="space-y-2">
                {items.map(t => (
                  <div key={t.id} className="card"
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", flexWrap: "wrap", borderLeft: `3px solid ${t.completed ? "#00abaa" : "#e2e8f0"}`, borderRadius: "0 12px 12px 0" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: t.completed ? "#e0f7f7" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>
                      {t.content_type === "pdf" ? "📄" : t.content_type === "video" ? "▶️" : "📝"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: "#1e293b", marginBottom: 3 }}>{t.title}</p>
                      {t.description && <p style={{ color: "#94a3b8", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</p>}
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: "#e0f7f7", color: "#00abaa", border: "1px solid #b2eded", display: "inline-block", marginTop: 4 }}>
                        {t.content_type === "pdf" ? "PDF" : t.content_type === "video" ? "Video" : "Metin"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {(t.content_url || t.content_text) && (
                        <button onClick={() => t.content_url ? window.open(t.content_url, "_blank") : alert(t.content_text ?? "")}
                          style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#475569", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                          {t.content_type === "video" ? "▶ İzle" : t.content_type === "pdf" ? "📄 Aç" : "📝 Oku"}
                        </button>
                      )}
                      <button onClick={() => toggleComplete(t.id, t.completed ?? false)}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "none", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", fontWeight: 600, backgroundColor: t.completed ? "#f0fdf4" : "#00abaa", color: t.completed ? "#10b981" : "#fff", outline: t.completed ? "1px solid #bbf7d0" : "none" }}>
                        {t.completed ? "✓ Tamamlandı" : "Tamamla"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SINAVLAR ── */}
      {tab === "exams" && (
        <div className="space-y-4">
          {assignments.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: "64px 0", color: "#94a3b8" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
              <p>Henüz atanmış sınav yok.</p>
            </div>
          )}
          {assignments.map(a => {
            const sub = a.submission;
            const isFinalized = sub?.is_finalized ?? false;
            const isPassed    = sub?.is_passed ?? null;
            return (
              <div key={a.id} className="card" style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                  <div>
                    <p style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 16, marginBottom: 4 }}>{a.exams.title}</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>📚 {a.exams.group_name}</span>
                      {a.exams.time_limit_minutes && <span style={{ fontSize: 12, color: "#94a3b8" }}>⏱ {a.exams.time_limit_minutes} dk</span>}
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>Geçme: %{a.exams.passing_score}</span>
                      {a.due_date && <span style={{ fontSize: 12, color: "#f59e0b" }}>📅 Son: {new Date(a.due_date).toLocaleDateString("tr-TR")}</span>}
                    </div>
                  </div>
                  {isFinalized ? (
                    <span style={{ fontSize: 13, fontWeight: 700, padding: "4px 14px", borderRadius: 99, backgroundColor: isPassed ? "#f0fdf4" : "#fef2f2", color: isPassed ? "#10b981" : "#ef4444", border: `1px solid ${isPassed ? "#bbf7d0" : "#fecaca"}`, flexShrink: 0 }}>
                      {isPassed ? `✓ Geçti · %${sub?.score}` : `✗ Kaldı · %${sub?.score}`}
                    </span>
                  ) : sub ? (
                    <span style={{ fontSize: 13, fontWeight: 600, padding: "4px 14px", borderRadius: 99, backgroundColor: "#fffbeb", color: "#f59e0b", border: "1px solid #fde68a", flexShrink: 0 }}>Devam ediyor</span>
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 600, padding: "4px 14px", borderRadius: 99, backgroundColor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", flexShrink: 0 }}>Başlanmadı</span>
                  )}
                </div>
                {a.exams.description && <p style={{ color: "#64748b", fontSize: 13, marginBottom: 12 }}>{a.exams.description}</p>}
                {!isFinalized && (
                  <a href={`/school/exams/${a.exam_id}`}
                    style={{ display: "inline-block", padding: "9px 20px", borderRadius: 10, border: "none", backgroundColor: "#00abaa", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
                    {sub ? "Devam Et →" : "Sınava Başla →"}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── SIRALAMA ── */}
      {tab === "leaderboard" && (
        <div className="space-y-5">
          <div>
            <p style={{ color: "#64748b", fontSize: 14 }}>Sınav performansına göre sıralama — satış hedefleri dahil değil.</p>
          </div>

          {/* Kendi sıran */}
          {myRank > 0 && (
            <div style={{ backgroundColor: "#f0fffe", border: "2px solid #00abaa", borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 20 }}>📍</span>
              <p style={{ fontSize: 14, color: "#1e293b" }}>
                Mevcut sıralaман: <span style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#00abaa", fontSize: 18 }}>{myRank}.</span>
                {lbEntries[myRank - 1] && (
                  <span style={{ color: "#64748b", fontSize: 13 }}> · Ort. %{lbEntries[myRank - 1].avg_score} · {lbEntries[myRank - 1].passed_count} sınav geçildi</span>
                )}
              </p>
            </div>
          )}

          {/* Filtreler */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
              {lbGroups.map(g => (
                <button key={g} onClick={() => { setLbFilterGroup(g); setLbFilterExam(""); }}
                  style={{ padding: "5px 14px", borderRadius: 99, border: "0.5px solid #e2e8f0", fontSize: 13, cursor: "pointer", transition: "all .15s", backgroundColor: lbFilterGroup === g && !lbFilterExam ? "#00abaa" : "#f8fafc", color: lbFilterGroup === g && !lbFilterExam ? "#fff" : "#64748b" }}>
                  {g}
                </button>
              ))}
            </div>
            <select value={lbFilterExam} onChange={e => { setLbFilterExam(e.target.value); setLbFilterGroup("Tümü"); }}
              style={{ padding: "7px 12px", borderRadius: 10, border: "0.5px solid #e2e8f0", fontSize: 13, color: "#475569", backgroundColor: "#fff", outline: "none", cursor: "pointer" }}>
              <option value="">Tüm Sınavlar</option>
              {lbExams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
            </select>
          </div>

          {lbEntries.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
              <p>Bu filtre için henüz sonuç yok.</p>
            </div>
          ) : (
            <>
              {/* Top 3 podium */}
              {top3.length >= 2 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[top3[1], top3[0], top3[2]].map((e, idx) => {
                    if (!e) return <div key={idx} />;
                    const rank = idx === 1 ? 0 : idx === 0 ? 1 : 2;
                    const isMe = e.user_id === userId;
                    const isFirst = rank === 0;
                    return (
                      <div key={e.user_id} className="card" style={{ textAlign: "center", border: isMe ? `2px solid #db0962` : isFirst ? "2px solid #00abaa" : "0.5px solid #e2e8f0", backgroundColor: isFirst ? "#f0fffe" : "#fff", transform: isFirst ? "scale(1.03)" : "none" }}>
                        <div style={{ fontSize: isFirst ? 26 : 22, marginBottom: 8 }}>{medals[rank]}</div>
                        <div style={{ width: isFirst ? 42 : 36, height: isFirst ? 42 : 36, borderRadius: "50%", backgroundColor: "#e0f7f7", border: `2px solid #00abaa`, margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: isFirst ? 16 : 14, color: "#00abaa", overflow: "hidden" }}>
                          {e.avatar_url ? <img src={e.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : e.full_name[0]}
                        </div>
                        <p style={{ fontSize: isFirst ? 14 : 13, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>{e.full_name}{isMe ? " ★" : ""}</p>
                        <p style={{ fontFamily: "'Chalet', sans-serif", fontSize: isFirst ? 26 : 22, fontWeight: 700, color: "#00abaa" }}>%{e.avg_score}</p>
                        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{e.passed_count} geçti</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tam liste */}
              <div className="card p-0 overflow-hidden">
                <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 400 }}>
                    <thead>
                      <tr style={{ backgroundColor: "#00abaa" }}>
                        {["#", "Personel", "Ort. Puan", "Geçilen", "Katıldığı"].map((h, i) => (
                          <th key={h} style={{ padding: "11px 14px", color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", textAlign: i === 0 || i > 1 ? "center" : "left", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lbEntries.map((e, i) => {
                        const isMe = e.user_id === userId;
                        return (
                          <tr key={e.user_id}
                            style={{ borderBottom: "0.5px solid #f1f5f9", backgroundColor: isMe ? "#f0fffe" : "#fff", transition: "background .15s" }}
                            onMouseEnter={ev => { if (!isMe) (ev.currentTarget as HTMLTableRowElement).style.backgroundColor = "#e6f7f7"; }}
                            onMouseLeave={ev => { if (!isMe) (ev.currentTarget as HTMLTableRowElement).style.backgroundColor = "#fff"; }}>
                            <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 700, color: i < 3 ? "#00abaa" : "#94a3b8", fontSize: i < 3 ? 16 : 14 }}>
                              {i < 3 ? medals[i] : i + 1}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "#e0f7f7", border: isMe ? "2px solid #db0962" : "2px solid #00abaa", display: "flex", alignItems: "center", justifyContent: "center", color: "#00abaa", fontWeight: 700, fontSize: 12, overflow: "hidden", flexShrink: 0 }}>
                                  {e.avatar_url ? <img src={e.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : e.full_name[0]}
                                </div>
                                <span style={{ fontWeight: isMe ? 700 : 500, color: isMe ? "#00abaa" : "#1e293b", whiteSpace: "nowrap" }}>
                                  {e.full_name}{isMe && " (Sen)"}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "center", fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: isMe ? "#00abaa" : "#1e293b", fontSize: 16 }}>%{e.avg_score}</td>
                            <td style={{ padding: "12px 14px", textAlign: "center" }}>
                              <span style={{ fontSize: 13, fontWeight: 600, padding: "2px 10px", borderRadius: 99, backgroundColor: "#f0fdf4", color: "#10b981", border: "1px solid #bbf7d0" }}>{e.passed_count}</span>
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>{e.exam_count}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── SERTİFİKALAR ── */}
      {tab === "certificates" && (
        <div>
          {certificates.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
              <p style={{ fontFamily: "'Chalet', sans-serif", fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Henüz sertifikan yok</p>
              <p style={{ fontSize: 14 }}>Sınavları başarıyla tamamladığında sertifikalarını burada göreceksin.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
              {certificates.map(cert => (
                <div key={cert.id} className="card animate-fade-up" style={{ border: "2px solid #00abaa", padding: 0, overflow: "hidden" }}>
                  <div style={{ height: 160, backgroundColor: "#e0f7f7", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {cert.file_type === "pdf" ? (
                      <div style={{ textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 6 }}>📄</div><span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: "#db0962", color: "#fff" }}>PDF</span></div>
                    ) : (
                      <img src={cert.file_url} alt={cert.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )}
                    {cert.exams?.title && (
                      <span style={{ position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: "rgba(255,255,255,0.92)", color: "#00abaa", border: "1px solid #b2eded" }}>{cert.exams.title}</span>
                    )}
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#00abaa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Düğün Akademi · Satış Okulu</div>
                    <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 15, marginBottom: 4 }}>{cert.title}</h3>
                    <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>📅 {new Date(cert.issued_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => window.open(cert.file_url, "_blank")} style={{ flex: 1, padding: "7px 0", borderRadius: 10, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#475569", fontSize: 13, cursor: "pointer" }}>👁 Görüntüle</button>
                      <button onClick={() => { const a = document.createElement("a"); a.href = cert.file_url; a.download = cert.title; a.target = "_blank"; a.click(); }} style={{ flex: 1, padding: "7px 0", borderRadius: 10, border: "none", backgroundColor: "#00abaa", color: "#fff", fontSize: 13, cursor: "pointer" }}>⬇ İndir</button>
                      <button onClick={async () => { if (navigator.share) { try { await navigator.share({ title: cert.title, url: cert.file_url }); } catch {} } else { await navigator.clipboard.writeText(cert.file_url); alert("Link kopyalandı!"); } }} style={{ padding: "7px 12px", borderRadius: 10, border: "1px solid #db0962", backgroundColor: "#fce7f0", color: "#db0962", fontSize: 13, cursor: "pointer" }}>↗</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
