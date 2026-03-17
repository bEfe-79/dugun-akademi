import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase — service role key ile
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { submissionId } = await req.json();
    if (!submissionId) return NextResponse.json({ error: "submissionId gerekli." }, { status: 400 });

    // 1. Submission'ı al
    const { data: sub, error: subErr } = await supabase
      .from("exam_submissions")
      .select("id, exam_id, user_id, answers, is_finalized")
      .eq("id", submissionId)
      .maybeSingle();

    if (subErr || !sub) return NextResponse.json({ error: "Sınav bulunamadı." }, { status: 404 });
    if (sub.is_finalized) return NextResponse.json({ error: "Bu sınav zaten kilitlenmiş." }, { status: 400 });

    // 2. Doğru cevapları server'da al (client'a gönderilmez)
    const { data: questions } = await supabase
      .from("exam_questions")
      .select("id, correct_answer")
      .eq("exam_id", sub.exam_id);

    if (!questions?.length) return NextResponse.json({ error: "Sorular bulunamadı." }, { status: 404 });

    // 3. Puanı hesapla
    const answers = sub.answers as Record<string, string>;
    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correct_answer) correct++;
    }
    const score = Math.round((correct / questions.length) * 100);

    // 4. Sınavın geçme notunu al
    const { data: exam } = await supabase
      .from("exams")
      .select("passing_score")
      .eq("id", sub.exam_id)
      .maybeSingle();

    const is_passed = score >= (exam?.passing_score ?? 70);

    // 5. Submission'ı kilitle (trigger zaten sonradan değişimi engelliyor)
    const { error: updateErr } = await supabase
      .from("exam_submissions")
      .update({ score, is_passed, is_finalized: true, finalized_at: new Date().toISOString() })
      .eq("id", submissionId);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    return NextResponse.json({ score, is_passed, correct, total: questions.length });
  } catch (err) {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
