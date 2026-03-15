"use client";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ACTIVITY_META, type ActivityType } from "@/types";

export default function LogForm({ today }: { today: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [userId, setUserId] = useState<string | null>(null);
  const [logContent, setLogContent] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("call");
  const [logTime, setLogTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) setUserId(session.user.id);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!userId) { setError("Oturum bulunamadi."); return; }
    if (!logContent.trim() || !logTime) { setError("Saat ve not alanlari zorunludur."); return; }

    const supabase = createClient();
    const { error: dbErr } = await supabase.from("daily_logs").insert({
      user_id: userId,
      log_content: logContent.trim(),
      activity_type: activityType,
      log_date: today,
      log_time: logTime,
    });

    if (dbErr) { setError("Kayit sirasinda hata: " + dbErr.message); return; }

    setLogContent("");
    setSuccess(true);
    startTransition(() => router.refresh());
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Yeni Kayit Ekle</h3>
        <span className="text-xs text-stone-600 bg-surface-2 border border-surface-3 px-2.5 py-1 rounded-full">
          🔒 Salt okunur
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Saat</label>
            <input type="time" className="input" value={logTime}
              onChange={(e) => setLogTime(e.target.value)} required />
          </div>
          <div>
            <label className="label">Aktivite Turu</label>
            <select className="input" value={activityType}
              onChange={(e) => setActivityType(e.target.value as ActivityType)}>
              {(Object.entries(ACTIVITY_META) as [ActivityType, typeof ACTIVITY_META[ActivityType]][]).map(([key, meta]) => (
                <option key={key} value={key}>{meta.icon} {meta.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Aktivite Notu</label>
          <textarea className="input resize-none" rows={3}
            placeholder="Bugun ne yaptiniz? Musteri adi, gorusme detayi, sonuc..."
            value={logContent} onChange={(e) => setLogContent(e.target.value)} required />
          <p className="text-stone-600 text-xs mt-1">{logContent.length} karakter</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
            <span className="text-rose-400">⚠</span>
            <p className="text-rose-300 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <span className="text-emerald-400">✓</span>
            <p className="text-emerald-300 text-sm">Kayit basariyla eklendi!</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={isPending || !userId} className="btn-primary">
            {isPending ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Kaydediliyor...</>
            ) : "💾 Kaydet"}
          </button>
          <p className="text-stone-600 text-xs">Kaydedildikten sonra duzenlenemez.</p>
        </div>
      </form>
    </div>
  );
}
