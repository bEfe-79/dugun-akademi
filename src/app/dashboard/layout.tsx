import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  let profile = null;
  if (userId) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    profile = data;
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#f5f6f8" }}>
      <Sidebar profile={profile} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar profile={profile} />
        <main style={{ flex: 1, overflowY: "auto", padding: "32px", backgroundColor: "#f5f6f8" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
