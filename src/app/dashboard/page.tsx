import { createClient } from "@/lib/supabase/server";
import ProgressCard from "@/components/ui/ProgressCard";
import AnnouncementsWidget from "@/components/ui/AnnouncementsWidget";
import StatCard from "@/components/ui/StatCard";

export const metadata = { title: "Dashboard | Düğün Akademi" };

function formatCurrency(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  const { data: profile } = userId ? await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle() : { data: null };

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentLogs } = userId ? await supabase
    .from("daily_logs")
    .select("activity_type")
    .eq("user_id", userId)
    .gte("log_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split("T")[0]) : { data: [] };

  const successRate = profile?.monthly_target > 0
    ? +((profile.current_sales / profile.monthly_target) * 100).toFixed(1)
    : 0;

  const activityCounts = (recentLogs ?? []).reduce(
    (acc, l) => ({ ...acc, [l.activity_type]: (acc[l.activity_type] ?? 0) + 1 }),
    {} as Record<string, number>
  );

  const rateColor = successRate >= 100
    ? "text-emerald-400"
    : successRate >= 75
    ? "text-amber-400"
    : successRate >= 50
    ? "text-orange-400"
    : "text-rose-400";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="animate-fade-up">
        <p className="text-stone-500 text-sm mb-1">{greeting},</p>
        <h1 className="font-display text-3xl font-bold text-stone-100">
          {profile?.full_name ??
