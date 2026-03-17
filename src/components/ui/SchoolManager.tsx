"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import CertificateManager from "@/components/ui/CertificateManager";

type Tab = "trainings" | "exams" | "assignments" | "results" | "certificates";

interface Training { id: string; title: string; description: string; content_type: string; content_url: string | null; content_text: string | null; group_name: string; order_index: number; is_published: boolean; }
interface Exam     { id: string; title: string; description: string; group_name: string; passing_score: number; time_limit_minutes: number | null; is_published: boolean; }
interface Profile  { id: string; full_name: string; }
interface Question { id?: string; question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_answer: string; order_index: number; }
interface Submission { id: string; exam_id: string; user_id: string; score: number | null; is_passed: boolean | null; is_finalized: boolean; finalized_at: string | null; profiles?: { full_name: string }; exams?: { title: string }; }
interface Assignment { id: string; exam_id: string; user_id: string; due_date: string | null; exams?: { title: string }; profiles?: { full_name: string }; }

const inp: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b", backgroundColor: "#fff", outline: "none", fontFamily: "inherit" };
const lbl = { display: "block", fontSize: 11, fontWeight: 700 as const, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 };
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={lbl}>{label}</label>{children}</div>;
}
function Msg({ type, text }: { type: "error"|"success"; text: string }) {
  return (
    <div style={{ display: "flex", gap: 8, borderRadius: 12, padding: "12px 16px", backgroundColor: type === "error" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${type === "error" ? "#fecaca" : "#bbf7d0"}` }}>
      <span style={{ color: type === "error" ? "#ef4444" : "#10b981", flexShrink: 0 }}>{type === "error" ? "⚠" : "✓"}</span>
      <p style={{ color: type === "error" ? "#dc2626" : "#059669", fontSize: 14 }}>{text}</p>
    </div>
  );
}

export default function SchoolManager() {
  const [tab, setTab] = useState<Tab>("trainings");
  const supabase = createClient();

  const TABS: { id: Tab; label: string }[] = [
    { id: "trainings",    label: "📚 Eğitimler" },
    { id: "exams",        label: "📝 Sınavlar" },
    { id: "assignments",  label: "📋 Atamalar" },
    { id: "results",      label: "📊 Sonuçlar" },
    { id: "certificates", label: "🏆 Sertifikalar" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar — mobilde scroll */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        <div style={{ display: "flex", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 12, padding: 4, gap: 4, width: "max-content", minWidth: "100%" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "8px 14px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 500,
              cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
              backgroundColor: tab === t.id ? "#ffffff" : "transparent",
              color: tab === t.id ? "#00abaa" : "#64748b",
              boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {tab === "trainings"    && <TrainingsManager />}
      {tab === "exams"        && <ExamsManager />}
      {tab === "assignments"  && <AssignmentsManager />}
      {tab === "results"      && <ResultsManager />}
      {tab === "certificates" && <CertificateManager />}
    </div>
  );
}

// ── EĞİTİMLER ────────────────────────────────────────────────────
function TrainingsManager() {
  const [items, setItems]     = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Training | null>(null);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{ type: "error"|"success"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("trainings").select("*").order("group_name").order("order_index");
    setItems(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function uploadTrainingFile(file: File): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const path = `trainings/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("trainings").upload(path, file, { upsert: true });
    if (error) return null;
    return supabase.storage.from("trainings").getPublicUrl(path).data.publicUrl;
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    let content_url: string | null = fd.get("content_url") as string || null;
    if (fileRef.current?.files?.[0]) content_url = await uploadTrainingFile(fileRef.current.files[0]);
    const { error } = await supabase.from("trainings").insert({
      title: fd.get("title"), description: fd.get("description") || null,
      content_type: fd.get("content_type"), content_url,
      content_text: fd.get("content_text") || null,
      group_name: fd.get("group_name") || "Genel",
      order_index: Number(fd.get("order_index") || 0),
      is_published: fd.get("is_published") === "true",
    });
    if (error) setMsg({ type: "error", text: error.message });
    else { setMsg({ type: "success", text: "Eğitim eklendi!" }); setShowAdd(false); load(); }
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!editItem) return; setSaving(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    let content_url: string | null = fd.get("content_url") as string || editItem.content_url;
    if (editFileRef.current?.files?.[0]) content_url = await uploadTrainingFile(editFileRef.current.files[0]);
    const { error } = await supabase.from("trainings").update({
      title: fd.get("title"), description: fd.get("description") || null,
      content_type: fd.get("content_type"), content_url,
      content_text: fd.get("content_text") || null,
      group_name: fd.get("group_name") || "Genel",
      order_index: Number(fd.get("order_index") || 0),
      is_published: fd.get("is_published") === "true",
    }).eq("id", editItem.id);
    if (error) setMsg({ type: "error", text: error.message });
    else { setMsg({ type: "success", text: "Güncellendi!" }); setEditItem(null); load(); }
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" silinsin mi?`)) return;
    const { error } = await supabase.from("trainings").delete().eq("id", id);
    if (error) setMsg({ type: "error", text: error.message });
    else { setMsg({ type: "success", text: "Silindi." }); load(); }
    setTimeout(() => setMsg(null), 3000);
  }

  function TrainingForm({ onSubmit, dv, fRef }: { onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; dv?: Training; fRef: React.RefObject<HTMLInputElement> }) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          <style>{`@media(min-width:480px){.tr-grid{grid-template-columns:1fr 1fr!important}}`}</style>
          <div style={{ display: "contents" }} className="tr-grid">
            <div style={{ gridColumn: "1/-1" }}><F label="Başlık"><input name="title" style={inp} required defaultValue={dv?.title} /></F></div>
            <F label="İçerik Türü">
              <select name="content_type" style={inp} defaultValue={dv?.content_type ?? "pdf"}>
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
                <option value="text">Metin</option>
              </select>
            </F>
            <F label="Grup / Kategori"><input name="group_name" style={inp} placeholder="Temel Satış" defaultValue={dv?.group_name ?? "Genel"} /></F>
            <F label="Harici Link (URL)"><input name="content_url" style={inp} placeholder="https://..." defaultValue={dv?.content_url ?? ""} /></F>
            <F label="Dosya Yükle (PDF/Video)"><input type="file" ref={fRef} accept=".pdf,video/*" style={{ ...inp, padding: "7px 14px" }} /></F>
            <F label="Sıra"><input name="order_index" type="number" style={inp} defaultValue={dv?.order_index ?? 0} /></F>
            <F label="Durum">
              <select name="is_published" style={inp} defaultValue={String(dv?.is_published ?? true)}>
                <option value="true">Yayında</option>
                <option value="false">Gizli</option>
              </select>
            </F>
            <div style={{ gridColumn: "1/-1" }}>
              <F label="Açıklama"><textarea name="description" rows={2} style={{ ...inp, resize: "none" }} defaultValue={dv?.description ?? ""} /></F>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <F label="Metin İçerik (metin türü için)"><textarea name="content_text" rows={4} style={{ ...inp, resize: "vertical" }} defaultValue={dv?.content_text ?? ""} /></F>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="submit" disabled={saving} style={{ padding: "10px 24px", borderRadius: 10, border: "none", backgroundColor: "#00abaa", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {saving ? "Kaydediliyor…" : dv ? "Güncelle" : "Ekle"}
          </button>
          <button type="button" onClick={() => dv ? setEditItem(null) : setShowAdd(false)} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#64748b", fontSize: 14, cursor: "pointer" }}>İptal</button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      {msg && <Msg type={msg.type} text={msg.text} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>{items.length} eğitim</span>
        <button onClick={() => { setShowAdd(!showAdd); setEditItem(null); }} style={{ padding: "8px 16px", borderRadius: 10, border: "none", backgroundColor: "#00abaa", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {showAdd ? "İptal" : "+ Yeni Eğitim"}
        </button>
      </div>

      {showAdd && (
        <div className="card space-y-4" style={{ border: "1px solid #b2eded", backgroundColor: "#f0fffe" }}>
          <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 17 }}>Yeni Eğitim</h3>
          <TrainingForm onSubmit={handleAdd} fRef={fileRef} />
        </div>
      )}
      {editItem && (
        <div className="card space-y-4" style={{ border: "1px solid #fde68a", backgroundColor: "#fffbeb" }}>
          <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 17 }}>Düzenle: {editItem.title}</h3>
          <TrainingForm onSubmit={handleEdit} dv={editItem} fRef={editFileRef} />
        </div>
      )}

      {loading ? <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Yükleniyor…</div>
      : items.length === 0 ? <div className="card" style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Henüz eğitim eklenmemiş.</div>
      : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", opacity: item.is_published ? 1 : 0.6, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <p style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{item.title}</p>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: "#e0f7f7", color: "#00abaa", border: "1px solid #b2eded" }}>{item.content_type.toUpperCase()}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{item.group_name}</span>
                  {!item.is_published && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, backgroundColor: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0" }}>Gizli</span>}
                </div>
                {item.description && <p style={{ color: "#94a3b8", fontSize: 12 }}>{item.description}</p>}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => { setEditItem(item); setShowAdd(false); }} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#475569", cursor: "pointer" }}>Düzenle</button>
                <button onClick={() => handleDelete(item.id, item.title)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#ef4444", cursor: "pointer" }}>Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SINAVLAR ─────────────────────────────────────────────────────
function ExamsManager() {
  const [exams, setExams]       = useState<Exam[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [editQuestions, setEditQuestions] = useState(false);
  const [selectedExam, setSelectedExam]   = useState<Exam | null>(null);
  const [questions, setQuestions]         = useState<Question[]>([]);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{ type: "error"|"success"; text: string } | null>(null);
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("exams").select("*").order("created_at", { ascending: false });
    setExams(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function loadQuestions(examId: string) {
    const { data } = await supabase.from("exam_questions").select("*").eq("exam_id", examId).order("order_index");
    setQuestions(data ?? []);
  }

  async function handleAddExam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const { data, error } = await supabase.from("exams").insert({
      title: fd.get("title"), description: fd.get("description") || null,
      group_name: fd.get("group_name") || "Genel",
      passing_score: Number(fd.get("passing_score") || 70),
      time_limit_minutes: fd.get("time_limit") ? Number(fd.get("time_limit")) : null,
      is_published: fd.get("is_published") === "true",
    }).select().single();
    if (error) setMsg({ type: "error", text: error.message });
    else { setMsg({ type: "success", text: "Sınav oluşturuldu! Şimdi soru ekleyebilirsiniz." }); setShowAdd(false); setSelectedExam(data); setEditQuestions(true); setQuestions([]); load(); }
    setSaving(false); setTimeout(() => setMsg(null), 4000);
  }

  async function handleDeleteExam(id: string, title: string) {
    if (!confirm(`"${title}" sınavını silmek istediğinizden emin misiniz? Tüm sorular ve sonuçlar silinecektir.`)) return;
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) setMsg({ type: "error", text: error.message });
    else { setMsg({ type: "success", text: "Silindi." }); load(); }
    setTimeout(() => setMsg(null), 3000);
  }

  async function handleSaveQuestion(q: Question, examId: string) {
    if (q.id) {
      await supabase.from("exam_questions").update({ question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, correct_answer: q.correct_answer, order_index: q.order_index }).eq("id", q.id);
    } else {
      await supabase.from("exam_questions").insert({ ...q, exam_id: examId });
    }
    loadQuestions(examId);
  }

  async function handleDeleteQuestion(id: string, examId: string) {
    await supabase.from("exam_questions").delete().eq("id", id);
    loadQuestions(examId);
  }

  return (
    <div className="space-y-5">
      {msg && <Msg type={msg.type} text={msg.text} />}

      {!editQuestions && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ color: "#94a3b8", fontSize: 13 }}>{exams.length} sınav</span>
            <button onClick={() => { setShowAdd(!showAdd); setEditExam(null); }} style={{ padding: "8px 16px", borderRadius: 10, border: "none", backgroundColor: "#00abaa", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {showAdd ? "İptal" : "+ Yeni Sınav"}
            </button>
          </div>

          {showAdd && (
            <div className="card space-y-4" style={{ border: "1px solid #b2eded", backgroundColor: "#f0fffe" }}>
              <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 17 }}>Yeni Sınav Oluştur</h3>
              <form onSubmit={handleAddExam} className="space-y-4">
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
                  <style>{`@media(min-width:480px){.ex-grid{grid-template-columns:1fr 1fr!important}}`}</style>
                  <div style={{ display: "contents" }} className="ex-grid">
                    <div style={{ gridColumn: "1/-1" }}><F label="Sınav Adı"><input name="title" style={inp} required /></F></div>
                    <F label="Grup"><input name="group_name" style={inp} placeholder="Temel Satış" /></F>
                    <F label="Geçme Notu (%)"><input name="passing_score" type="number" style={inp} defaultValue={70} min={0} max={100} /></F>
                    <F label="Süre Sınırı (dk, opsiyonel)"><input name="time_limit" type="number" style={inp} placeholder="Boş = sınırsız" /></F>
                    <F label="Durum">
                      <select name="is_published" style={inp} defaultValue="true">
                        <option value="true">Yayında</option>
                        <option value="false">Gizli</option>
                      </select>
                    </F>
                    <div style={{ gridColumn: "1/-1" }}><F label="Açıklama"><textarea name="description" rows={2} style={{ ...inp, resize: "none" }} /></F></div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" disabled={saving} style={{ padding: "10px 24px", borderRadius: 10, border: "none", backgroundColor: "#00abaa", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{saving ? "Oluşturuluyor…" : "Oluştur ve Soru Ekle"}</button>
                  <button type="button" onClick={() => setShowAdd(false)} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#64748b", fontSize: 14, cursor: "pointer" }}>İptal</button>
                </div>
              </form>
            </div>
          )}

          {loading ? <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Yükleniyor…</div>
          : exams.length === 0 ? <div className="card" style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Henüz sınav oluşturulmamış.</div>
          : (
            <div className="space-y-2">
              {exams.map(ex => (
                <div key={ex.id} className="card" style={{ padding: "14px 16px", opacity: ex.is_published ? 1 : 0.6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <p style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{ex.title}</p>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{ex.group_name}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: "#e0f7f7", color: "#00abaa", border: "1px solid #b2eded" }}>Geçme: %{ex.passing_score}</span>
                        {ex.time_limit_minutes && <span style={{ fontSize: 11, color: "#94a3b8" }}>⏱ {ex.time_limit_minutes} dk</span>}
                        {!ex.is_published && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, backgroundColor: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0" }}>Gizli</span>}
                      </div>
                      {ex.description && <p style={{ color: "#94a3b8", fontSize: 12 }}>{ex.description}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => { setSelectedExam(ex); setEditQuestions(true); loadQuestions(ex.id); }} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "1px solid #b2eded", backgroundColor: "#e0f7f7", color: "#00abaa", cursor: "pointer", whiteSpace: "nowrap" }}>Sorular</button>
                      <button onClick={() => handleDeleteExam(ex.id, ex.title)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#ef4444", cursor: "pointer" }}>Sil</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Soru editörü */}
      {editQuestions && selectedExam && (
        <QuestionEditor
          exam={selectedExam}
          questions={questions}
          onSave={handleSaveQuestion}
          onDelete={handleDeleteQuestion}
          onBack={() => { setEditQuestions(false); setSelectedExam(null); }}
        />
      )}
    </div>
  );
}

function QuestionEditor({ exam, questions, onSave, onDelete, onBack }: { exam: Exam; questions: Question[]; onSave: (q: Question, examId: string) => void; onDelete: (id: string, examId: string) => void; onBack: () => void; }) {
  const [newQ, setNewQ] = useState<Question>({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "a", order_index: questions.length });

  return (
    <div className="space-y-5">
      <button onClick={onBack} style={{ color: "#00abaa", fontSize: 14, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>← Sınavlara Dön</button>
      <div>
        <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 18, marginBottom: 4 }}>{exam.title}</h3>
        <p style={{ color: "#94a3b8", fontSize: 13 }}>{questions.length} soru</p>
      </div>

      {/* Mevcut sorular */}
      {questions.map((q, i) => (
        <div key={q.id} className="card" style={{ border: "0.5px solid #e2e8f0", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
            <p style={{ fontWeight: 600, color: "#1e293b", fontSize: 14, flex: 1 }}>{i + 1}. {q.question_text}</p>
            <button onClick={() => onDelete(q.id!, exam.id)} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 8, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#ef4444", cursor: "pointer", flexShrink: 0 }}>Sil</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {(["a","b","c","d"] as const).map(opt => (
              <div key={opt} style={{ padding: "6px 10px", borderRadius: 8, fontSize: 13, backgroundColor: q.correct_answer === opt ? "#e0f7f7" : "#f8fafc", color: q.correct_answer === opt ? "#00abaa" : "#64748b", border: q.correct_answer === opt ? "1px solid #b2eded" : "1px solid #e2e8f0", fontWeight: q.correct_answer === opt ? 600 : 400 }}>
                {opt.toUpperCase()}) {q[`option_${opt}` as keyof Question] as string}
                {q.correct_answer === opt && " ✓"}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Yeni soru formu */}
      <div className="card space-y-4" style={{ border: "1px solid #b2eded", backgroundColor: "#f0fffe" }}>
        <h4 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 15 }}>Yeni Soru Ekle</h4>
        <F label="Soru"><textarea rows={2} style={{ ...inp, resize: "none" }} value={newQ.question_text} onChange={e => setNewQ(q => ({ ...q, question_text: e.target.value }))} /></F>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {(["a","b","c","d"] as const).map(opt => (
            <F key={opt} label={`Şık ${opt.toUpperCase()}`}>
              <input style={inp} value={newQ[`option_${opt}` as keyof Question] as string} onChange={e => setNewQ(q => ({ ...q, [`option_${opt}`]: e.target.value }))} />
            </F>
          ))}
        </div>
        <F label="Doğru Cevap">
          <select style={inp} value={newQ.correct_answer} onChange={e => setNewQ(q => ({ ...q, correct_answer: e.target.value }))}>
            {(["a","b","c","d"] as const).map(opt => <option key={opt} value={opt}>Şık {opt.toUpperCase()}</option>)}
          </select>
        </F>
        <button onClick={() => { if (!newQ.question_text || !newQ.option_a || !newQ.option_b || !newQ.option_c || !newQ.option_d) return alert("Tüm alanları doldurunuz."); onSave({ ...newQ, order_index: questions.length }, exam.id); setNewQ({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "a", order_index: questions.length + 1 }); }} style={{ padding: "10px 24px", borderRadius: 10, border: "none", backgroundColor: "#00abaa", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          + Soruyu Ekle
        </button>
      </div>
    </div>
  );
}

// ── ATAMALAR ─────────────────────────────────────────────────────
function AssignmentsManager() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [exams, setExams]       = useState<Exam[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState<{ type: "error"|"success"; text: string } | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const [aRes, pRes, eRes] = await Promise.all([
      supabase.from("exam_assignments").select("*, exams(title), profiles(full_name)").order("assigned_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name").order("full_name"),
      supabase.from("exams").select("id, title").eq("is_published", true).order("title"),
    ]);
    setAssignments(aRes.data ?? []);
    setProfiles(pRes.data ?? []);
    setExams(eRes.data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleAssign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const examId = fd.get("exam_id") as string;
    const dueDate = fd.get("due_date") as string || null;
    const { data: { session } } = await supabase.auth.getSession();

    if (bulkMode) {
      const inserts = profiles.map(p => ({ exam_id: examId, user_id: p.id, assigned_by: session?.user?.id, due_date: dueDate }));
      const { error } = await supabase.from("exam_assignments").upsert(inserts, { onConflict: "exam_id,user_id" });
      if (error) setMsg({ type: "error", text: error.message });
      else { setMsg({ type: "success", text: `${profiles.length} kullanıcıya atandı!` }); load(); }
    } else {
      const userId = fd.get("user_id") as string;
      const { error } = await supabase.from("exam_assignments").upsert({ exam_id: examId, user_id: userId, assigned_by: session?.user?.id, due_date: dueDate }, { onConflict: "exam_id,user_id" });
      if (error) setMsg({ type: "error", text: error.message });
      else { setMsg({ type: "success", text: "Sınav atandı!" }); load(); }
    }
    setSaving(false); setTimeout(() => setMsg(null), 3000);
  }

  async function handleRemove(id: string) {
    if (!confirm("Bu atamayı kaldırmak istediğinizden emin misiniz?")) return;
    const { error } = await supabase.from("exam_assignments").delete().eq("id", id);
    if (error) setMsg({ type: "error", text: error.message });
    else { setMsg({ type: "success", text: "Kaldırıldı." }); load(); }
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div className="space-y-5">
      {msg && <Msg type={msg.type} text={msg.text} />}

      <div className="card space-y-4" style={{ border: "1px solid #b2eded", backgroundColor: "#f0fffe" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 17, flex: 1 }}>Sınav Ata</h3>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", cursor: "pointer" }}>
            <input type="checkbox" checked={bulkMode} onChange={e => setBulkMode(e.target.checked)} />
            Tüm personele toplu ata
          </label>
        </div>
        <form onSubmit={handleAssign} className="space-y-4">
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
            <style>{`@media(min-width:480px){.as-grid{grid-template-columns:1fr 1fr!important}}`}</style>
            <div style={{ display: "contents" }} className="as-grid">
              <F label="Sınav">
                <select name="exam_id" style={inp} required>
                  <option value="">Seçiniz…</option>
                  {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
                </select>
              </F>
              {!bulkMode && (
                <F label="Personel">
                  <select name="user_id" style={inp} required={!bulkMode}>
                    <option value="">Seçiniz…</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </F>
              )}
              <F label="Son Tarih (opsiyonel)">
                <input name="due_date" type="date" style={inp} />
              </F>
            </div>
          </div>
          <button type="submit" disabled={saving} style={{ padding: "10px 24px", borderRadius: 10, border: "none", backgroundColor: "#00abaa", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {saving ? "Atanıyor…" : bulkMode ? "Tüm Personele Ata" : "Ata"}
          </button>
        </form>
      </div>

      {loading ? <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Yükleniyor…</div>
      : assignments.length === 0 ? <div className="card" style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Henüz atama yapılmamış.</div>
      : (
        <div className="card p-0 overflow-hidden">
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 500 }}>
              <thead>
                <tr style={{ backgroundColor: "#00abaa" }}>
                  {["Personel", "Sınav", "Son Tarih", "İşlem"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id} style={{ borderBottom: "0.5px solid #f1f5f9" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "#e6f7f7"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = ""}>
                    <td style={{ padding: "10px 14px", fontWeight: 500, color: "#1e293b" }}>{a.profiles?.full_name ?? "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{a.exams?.title ?? "—"}</td>
                    <td style={{ padding: "10px 14px", color: a.due_date ? "#f59e0b" : "#94a3b8", fontSize: 12 }}>{a.due_date ? new Date(a.due_date).toLocaleDateString("tr-TR") : "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={() => handleRemove(a.id)} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 8, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#ef4444", cursor: "pointer" }}>Kaldır</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SONUÇLAR ─────────────────────────────────────────────────────
function ResultsManager() {
  const [subs, setSubs]         = useState<Submission[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filterExam, setFilterExam] = useState("");
  const [exams, setExams]       = useState<Exam[]>([]);
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const [subsRes, examsRes] = await Promise.all([
      supabase.from("exam_submissions").select("*, profiles(full_name), exams(title)").eq("is_finalized", true).order("finalized_at", { ascending: false }),
      supabase.from("exams").select("id, title").order("title"),
    ]);
    setSubs(subsRes.data ?? []);
    setExams(examsRes.data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function exportExcel() {
    const { utils, writeFile } = await import("xlsx");
    const filtered = filterExam ? subs.filter(s => s.exam_id === filterExam) : subs;
    const wsData = [
      ["Personel", "Sınav", "Puan", "Durum", "Tamamlanma Tarihi"],
      ...filtered.map(s => [
        s.profiles?.full_name ?? "",
        s.exams?.title ?? "",
        s.score ?? "",
        s.is_passed ? "Geçti" : "Kaldı",
        s.finalized_at ? new Date(s.finalized_at).toLocaleDateString("tr-TR") : "",
      ]),
    ];
    const ws = utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 25 }, { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 18 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Sonuçlar");
    writeFile(wb, "sinav-sonuclari.xlsx", { bookSST: false, type: "binary", FS: ";" });
  }

  const filtered = filterExam ? subs.filter(s => s.exam_id === filterExam) : subs;

  return (
    <div className="space-y-5">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <select style={{ ...inp, width: "auto", minWidth: 160, flex: "1 1 160px" }} value={filterExam} onChange={e => setFilterExam(e.target.value)}>
          <option value="">Tüm Sınavlar</option>
          {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
        </select>
        <span style={{ color: "#94a3b8", fontSize: 13, flexShrink: 0 }}>{filtered.length} sonuç</span>
        <button onClick={exportExcel} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#475569", fontSize: 13, cursor: "pointer", marginLeft: "auto", whiteSpace: "nowrap" }}>⬇ Excel</button>
      </div>

      {loading ? <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Yükleniyor…</div>
      : filtered.length === 0 ? <div className="card" style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Henüz tamamlanmış sınav yok.</div>
      : (
        <div className="card p-0 overflow-hidden">
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 500 }}>
              <thead>
                <tr style={{ backgroundColor: "#00abaa" }}>
                  {["Personel", "Sınav", "Puan", "Durum", "Tarih"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} style={{ borderBottom: "0.5px solid #f1f5f9" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "#e6f7f7"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = ""}>
                    <td style={{ padding: "10px 14px", fontWeight: 500, color: "#1e293b" }}>{s.profiles?.full_name ?? "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{s.exams?.title ?? "—"}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: s.is_passed ? "#00abaa" : "#ef4444" }}>%{s.score}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: s.is_passed ? "#f0fdf4" : "#fef2f2", color: s.is_passed ? "#10b981" : "#ef4444", border: `1px solid ${s.is_passed ? "#bbf7d0" : "#fecaca"}` }}>
                        {s.is_passed ? "✓ Geçti" : "✗ Kaldı"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#94a3b8", fontSize: 12, whiteSpace: "nowrap" }}>
                      {s.finalized_at ? new Date(s.finalized_at).toLocaleDateString("tr-TR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
