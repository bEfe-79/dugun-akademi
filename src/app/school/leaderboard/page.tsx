"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  exam_count: number;
  passed_count: number;
  avg_score: number;
  total_score: number;
}

interface Exam { id: string; title: string; group_name: string; }

export default function LeaderboardPage() {
  const [entries, setEntries]     = useState<LeaderboardEntry[]>([]);
  const [exams, setExams]         = useState<Exam[]>([]);
  const [groups, setGroups]       = useState<string[]>([]);
  const [filterGroup, setFilterGroup] = useState("Tümü");
  const [filterExam, setFilterExam]   = useState("");
  const [loading, setLoading]     = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.id) { setLoading(false); return; }
      setCurrentUserId(session.user.id);

      const [subsRes, examsRes] = await Promise.all([
        supabase.from("exam_submissions")
          .select("user_id, exam_id, score, is_passed, exams(group_name), profiles(full_name, avatar_url)")
          .eq("is_finalized", true),
        supabase.from("exams").select("id, title, group_name").eq("is_published", true).order("title"),
      ]);

      const allExams = examsRes.data ?? [];
      setExams(allExams);
      const uniqueGroups = ["Tümü", ...Array.from(new Set(allExams.map((e: any) => e.group_name))).sort()];
      setGroups(uniqueGroups);

      buildLeaderboard(subsRes.data ?? [], "", "Tümü", allExams);
      setLoading(false);

      // state'e kaydet ham veri için
      setRawSubs(subsRes.data ?? []);
    });
  }, []);

  const [rawSubs, setRawSubs] = useState<any[]>([]);

  useEffect(() => {
    if (rawSubs.length > 0) {
      buildLeaderboard(rawSubs, filterExam, filterGroup, exams);
    }
  }, [filterExam, filterGroup, rawSubs]);

  function buildLeaderboard(subs: any[], examId: string, group: string, allExams: Exam[]) {
    let filtered = subs;
    if (examId) {
      filtered = filtered.filter((s: any) => s.exam_id === examId);
    } else if (group !== "Tümü") {
      const groupExamIds = new Set(allExams.filter(e => e.group_name === group).map(e => e.id));
      filtered = filtered.filter((s: any) => groupExamIds.has(s.exam_id));
    }

    const map: Record<string, LeaderboardEntry> = {};
    for (const s of filtered) {
      const uid = s.user_id;
      if (!map[uid]) {
        map[uid] = {
          user_id: uid,
          full_name: s.profiles?.full_name ?? "—",
          avatar_url: s.profiles?.avatar_url ?? null,
          exam_count: 0,
          passed_count: 0,
          avg_score: 0,
          total_score: 0,
        };
      }
      map[uid].exam_count++;
      map[uid].total_score += s.score ?? 0;
      if (s.is_passed) map[uid].passed_count++;
    }

    const result = Object.values(map).map(e => ({
      ...e,
      avg_score: e.exam_count > 0 ? Math.round(e.total_score / e.exam_count) : 0,
    })).sort((a, b) => b.avg_score - a.avg_score || b.passed_count - a.passed_count);

    setEntries(result);
  }

  const top3 = entries.slice(0, 3);
  const rest  = entries.slice(3);
  const myRank = entries.findIndex(e => e.user_id === currentUserId) + 1;

  const medals = ["🥇", "🥈", "🥉"];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256, color: "#64748b" }}>
      <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" style={{ marginRight: 12 }} />
      Yükleniyor...
    </div>
  );

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }} className="space-y-6">

      {/* Başlık */}
      <div className="animate-fade-up">
        <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: "clamp(22px,5vw,30px)", fontWeight: 700, color: "#1e293b" }}>
          Başarı Sıralaması
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Sınav performansına göre sıralama — satış hedefleri dahil değil.
        </p>
      </div>

      {/* Kendi sıran */}
      {myRank > 0 && (
        <div style={{ backgroundColor: "#f0fffe", border: "2px solid #00abaa", borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>📍</span>
          <p style={{ fontSize: 14, color: "#1e293b" }}>
            Mevcut sıralaман: <span style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#00abaa", fontSize: 18 }}>{myRank}.</span>
            {entries[myRank - 1] && (
              <span style={{ color: "#64748b", fontSize: 13 }}> · Ort. %{entries[myRank - 1].avg_score} · {entries[myRank - 1].passed_count} sınav geçildi</span>
            )}
          </p>
        </div>
      )}

      {/* Filtreler */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {/* Grup filtresi */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
          {groups.map(g => (
            <button key={g} onClick={() => { setFilterGroup(g); setFilterExam(""); }}
              style={{ padding: "5px 14px", borderRadius: 99, border: "0.5px solid #e2e8f0", fontSize: 13, cursor: "pointer", transition: "all .15s", backgroundColor: filterGroup === g && !filterExam ? "#00abaa" : "#f8fafc", color: filterGroup === g && !filterExam ? "#fff" : "#64748b", fontWeight: filterGroup === g && !filterExam ? 600 : 400 }}>
              {g}
            </button>
          ))}
        </div>
        {/* Sınav bazlı filtre */}
        <select
          value={filterExam}
          onChange={e => { setFilterExam(e.target.value); setFilterGroup("Tümü"); }}
          style={{ padding: "7px 12px", borderRadius: 10, border: "0.5px solid #e2e8f0", fontSize: 13, color: "#475569", backgroundColor: "#fff", outline: "none", cursor: "pointer" }}>
          <option value="">Tüm Sınavlar</option>
          {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
        </select>
      </div>

      {entries.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "64px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
          <p>Bu filtre için henüz sonuç yok.</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {top3.length >= 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 4 }}>
              {/* 2. — sol */}
              <div className="card" style={{ textAlign: "center", border: top3[1]?.user_id === currentUserId ? "2px solid #00abaa" : "0.5px solid #e2e8f0", backgroundColor: top3[1]?.user_id === currentUserId ? "#f0fffe" : "#fff" }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>🥈</div>
                {top3[1] ? (
                  <>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#e0f7f7", border: "2px solid #00abaa", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#00abaa", overflow: "hidden" }}>
                      {top3[1].avatar_url ? <img src={top3[1].avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : top3[1].full_name[0]}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>{top3[1].full_name}</p>
                    <p style={{ fontFamily: "'Chalet', sans-serif", fontSize: 22, fontWeight: 700, color: "#00abaa" }}>%{top3[1].avg_score}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{top3[1].passed_count} sınav geçti</p>
                  </>
                ) : <p style={{ color: "#94a3b8", fontSize: 13 }}>—</p>}
              </div>

              {/* 1. — orta, daha büyük */}
              <div className="card" style={{ textAlign: "center", border: top3[0]?.user_id === currentUserId ? "2px solid #db0962" : "2px solid #00abaa", backgroundColor: top3[0]?.user_id === currentUserId ? "#fce7f0" : "#f0fffe", transform: "scale(1.03)" }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>🥇</div>
                {top3[0] && (
                  <>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: "#00abaa", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#fff", overflow: "hidden" }}>
                      {top3[0].avatar_url ? <img src={top3[0].avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : top3[0].full_name[0]}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{top3[0].full_name}</p>
                    <p style={{ fontFamily: "'Chalet', sans-serif", fontSize: 26, fontWeight: 700, color: "#00abaa" }}>%{top3[0].avg_score}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{top3[0].passed_count} sınav geçti</p>
                  </>
                )}
              </div>

              {/* 3. — sağ */}
              <div className="card" style={{ textAlign: "center", border: top3[2]?.user_id === currentUserId ? "2px solid #00abaa" : "0.5px solid #e2e8f0", backgroundColor: top3[2]?.user_id === currentUserId ? "#f0fffe" : "#fff" }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>🥉</div>
                {top3[2] ? (
                  <>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#e0f7f7", border: "2px solid #00abaa", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#00abaa", overflow: "hidden" }}>
                      {top3[2].avatar_url ? <img src={top3[2].avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : top3[2].full_name[0]}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>{top3[2].full_name}</p>
                    <p style={{ fontFamily: "'Chalet', sans-serif", fontSize: 22, fontWeight: 700, color: "#00abaa" }}>%{top3[2].avg_score}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{top3[2].passed_count} sınav geçti</p>
                  </>
                ) : <p style={{ color: "#94a3b8", fontSize: 13 }}>—</p>}
              </div>
            </div>
          )}

          {/* Tam liste */}
          <div className="card p-0 overflow-hidden">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ backgroundColor: "#00abaa" }}>
                  {["#", "Personel", "Ort. Puan", "Geçilen", "Katıldığı"].map((h, i) => (
                    <th key={h} style={{ padding: "11px 14px", color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", textAlign: i === 0 ? "center" : i > 1 ? "center" : "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => {
                  const isMe = e.user_id === currentUserId;
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
                      <td style={{ padding: "12px 14px", textAlign: "center", fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: isMe ? "#00abaa" : "#1e293b", fontSize: 16 }}>
                        %{e.avg_score}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, padding: "2px 10px", borderRadius: 99, backgroundColor: "#f0fdf4", color: "#10b981", border: "1px solid #bbf7d0" }}>
                          {e.passed_count}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                        {e.exam_count}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
