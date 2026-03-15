import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminClient from "@/components/ui/AdminClient";

export const metadata = { title: "Admin Paneli | Düğün Akademi" };

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

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
            Yönetici
          </span>
        </div>
        <p className="text-stone-500 text-sm mt-1">
          Tüm personel aktivitelerini görüntüleyin ve raporlayın.
        </p>
      </div>

      <AdminClient profiles={profiles ?? []} logs={logs ?? []} />
    </div>
  );
}
