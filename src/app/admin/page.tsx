import { createClient } from "@/lib/supabase/server";
import AdminClient from "@/components/ui/AdminClient";

export const metadata = { title: "Admin Paneli | Dugun Akademi" };

export default async function AdminPage() {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  const { data: profile } = userId
    ? await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
    : { data: null };

  if (profile?.role !== "admin") {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center">
        <p className="text-stone-400 text-lg">Bu sayfaya erisim yetkiniz yok.</p>
      </div>
    );
  }

  const [{ data: profiles }, { data: logs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, monthly_target, current_sales, last_login")
      .order("full_name"),
    supabase
      .from("daily_logs")
      .select("*, profiles(full_name)")
      .order("log_date", { ascending: false })
      .order("log_time", { ascending: false })
      .limit(1000),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="animate-fade-up">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-stone-100">
            Admin Paneli
          </h1>
          <span className="badge bg-brand-500/15 border-brand-500/30 text-brand-400">
            Yonetici
          </span>
        </div>
        <p className="text-stone-500 text-sm mt-1">
          Tum personel aktivitelerini goruntuleyin ve raporlayin.
        </p>
      </div>

      <AdminClient profiles={profiles ?? []} logs={logs ?? []} />
    </div>
  );
}
