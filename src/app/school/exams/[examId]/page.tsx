"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  order_index: number;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  group_name: string;
  passing_score: number;
  time_limit_minutes: number | null;
}

export default function ExamTakePage({ params }: { params: { examId: string } }) {
  const router = useRouter();
  const [exam, setExam]         = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers]   = useState<Record<string, string>>({});
  const [current, setCurrent]   = useState(0);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult]     = useState<{ score: number; is_passed: boolean } | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [userId, setUserId]     = useState<string | null>(null);
  const [alreadyFinalized, setAlreadyFinalized] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.id) { router.push("/login"); return; }
      const uid = session.user.id;
      setUserId(uid);

      const [examRes, qRes, subRes] = await Promise.all([
        supabase.from("exams").select("id,title,description,group_name,passing_score,time_limit_minutes").eq("id", params.examId).maybeSingle(),
        // correct_answer burada çekilmiyor — sadece soru metni ve şıklar
        supabase.from("exam_questions").select("id,question_text,option_a,option_b,option_c,option_d,order_index").eq("exam_id", params.examId).order("order_index"),
        supabase.from("exam_submissions").select("id,answers,is_finalized,score,is_passed").eq("exam_id", params.examId).eq("user_id", uid).maybeSingle(),
      ]);

      setExam(examRes.data);
      setQuestions(qRes.data ?? []);

      if (subRes.data) {
        setSubmissionId(subRes.data.id);
        setAnswers(subRes.data.answers ?? {});
        if (subRes.data.is_finalized) {
          setAlreadyFinalized(true);
          setResult({ score: subRes.data.score, is_passed: subRes.data.is_passed });
        }
      }
      setLoading(false);
    });
  }, [params.examId]);

  async function saveAnswer(questionId: string, answer: string) {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    const supabase = createClient();
    const uid = userId;
    if (!uid) return;
    if (submissionId) {
      await supabase.from("exam_submissions").update({ answers: newAnswers }).eq("id", submissionId);
    } else {
      const { data } = await supabase.from("exam_submissions").insert({ exam_id: params.examId, user_id: uid, answers: newAnswers }).select("id").single();
      if (data) setSubmissionId(data.id);
    }
  }

  async function finalizeExam() {
    if (!submissionId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/school/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ score: data.score, is_passed: data.is_passed });
        setAlreadyFinalized(true);
      }
    } catch {}
    setSaving(false);
    setShowModal(false);
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256, color: "#64748b" }}>
      <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" style={{ marginRight: 12 }} />
      Yükleniyor...
    </div>
  );

  if (!exam) return <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>Sınav bulunamadı.</div>;

  // Sonuç ekranı
  if (alreadyFinalized && result) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", paddingTop: 40 }}>
        <div className="card" style={{ textAlign: "center", padding: "40px 32px", border: `2px solid ${result.is_passed ? "#00abaa" : "#ef4444"}` }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>{result.is_passed ? "🏆" : "📝"}</div>
          <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 24, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
            {result.is_passed ? "Tebrikler!" : "Tekrar Dene"}
          </h1>
          <p style={{ color: "#64748b", fontSize: 15, marginBottom: 20 }}>
            {exam.title} sınavını tamamladın.
          </p>
          <div style={{ fontFamily: "'Chalet', sans-serif", fontSize: 48, fontWeight: 700, color: result.is_passed ? "#00abaa" : "#ef4444", marginBottom: 8 }}>
            %{result.score}
          </div>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>Geçme notu: %{exam.passing_score}</p>
          <div style={{ padding: "12px 20px", borderRadius: 12, backgroundColor: result.is_passed ? "#f0fdf4" : "#fef2f2", border: `1px solid ${result.is_passed ? "#bbf7d0" : "#fecaca"}`, marginBottom: 24 }}>
            <p style={{ fontWeight: 700, color: result.is_passed ? "#10b981" : "#ef4444", fontSize: 15 }}>
              {result.is_passed ? "✓ Sınavı Geçtin!" : "✗ Sınavı Geçemedin"}
            </p>
          </div>
          <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 20 }}>🔒 Bu sınav sonucu kilitlenmiştir.</p>
          <button onClick={() => router.push("/school/trainings")}
            style={{ padding: "10px 24px", borderRadius: 10, border: "none", backgroundColor: "#00abaa", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Satış Okulu'na Dön
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;
  const pct = Math.round((answeredCount / questions.length) * 100);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }} className="space-y-6">

      {/* Üst bilgi */}
      <div>
        <button onClick={() => router.push("/school/trainings")}
          style={{ color: "#00abaa", fontSize: 14, background: "none", border: "none", cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
          ← Satış Okulu
        </button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: "clamp(18px,4vw,22px)", fontWeight: 700, color: "#1e293b" }}>{exam.title}</h1>
          <span style={{ fontSize: 13, fontWeight: 600, padding: "4px 12px", borderRadius: 99, backgroundColor: "#fffbeb", color: "#f59e0b", border: "1px solid #fde68a", flexShrink: 0 }}>
            Soru {current + 1} / {questions.length}
          </span>
        </div>
        {/* Progress */}
        <div style={{ height: 6, borderRadius: 99, backgroundColor: "#e2e8f0", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 99, backgroundColor: "#00abaa", width: `${pct}%`, transition: "width 0.3s" }} />
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{answeredCount} / {questions.length} soru yanıtlandı</p>
      </div>

      {/* Soru */}
      {q && (
        <div className="card" style={{ padding: "20px 24px" }}>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>Soru {current + 1}</p>
          <p style={{ fontSize: 16, fontWeight: 500, color: "#1e293b", lineHeight: 1.6, marginBottom: 20 }}>{q.question_text}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(["a","b","c","d"] as const).map(opt => {
              const text = q[`option_${opt}` as keyof Question] as string;
              const selected = answers[q.id] === opt;
              return (
                <button key={opt} onClick={() => saveAnswer(q.id, opt)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, border: selected ? "2px solid #00abaa" : "1px solid #e2e8f0", backgroundColor: selected ? "#f0fffe" : "#fff", cursor: "pointer", textAlign: "left", transition: "all .15s" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", border: selected ? "none" : "2px solid #e2e8f0", backgroundColor: selected ? "#00abaa" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {selected && <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#fff" }} />}
                  </div>
                  <span style={{ fontSize: 14, color: selected ? "#1e293b" : "#475569", fontWeight: selected ? 500 : 400 }}>{text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigasyon */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
          style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#64748b", fontSize: 14, cursor: current === 0 ? "not-allowed" : "pointer", opacity: current === 0 ? 0.4 : 1 }}>
          ← Önceki
        </button>
        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
            style={{ padding: "10px 24px", borderRadius: 10, border: "none", backgroundColor: "#00abaa", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Sonraki →
          </button>
        ) : null}
        <button onClick={() => setShowModal(true)}
          style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #db0962", backgroundColor: "#fce7f0", color: "#db0962", fontSize: 14, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>
          Sınavı Tamamla
        </button>
      </div>

      {/* Soru navigasyon dots */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {questions.map((q2, i) => (
          <button key={q2.id} onClick={() => setCurrent(i)}
            style={{ width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, backgroundColor: i === current ? "#00abaa" : answers[q2.id] ? "#e0f7f7" : "#f1f5f9", color: i === current ? "#fff" : answers[q2.id] ? "#00abaa" : "#94a3b8" }}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Onay Modalı */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div className="card" style={{ maxWidth: 420, width: "100%", textAlign: "center", padding: "32px 28px" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: "#fce7f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22 }}>⚠️</div>
            <h2 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>
              Sınavı tamamlamak istiyor musunuz?
            </h2>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 8 }}>
              {answeredCount < questions.length && (
                <span style={{ color: "#f59e0b", fontWeight: 600 }}>⚠ {questions.length - answeredCount} soru yanıtsız bırakıldı.<br/></span>
              )}
              Bu işlem geri alınamaz. Cevaplarınız kaydedilecek ve sınav kilitlenecektir.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} disabled={saving}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#64748b", fontSize: 14, cursor: "pointer" }}>
                İptal
              </button>
              <button onClick={finalizeExam} disabled={saving}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", backgroundColor: "#db0962", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Gönderiliyor…" : "Evet, Tamamla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
