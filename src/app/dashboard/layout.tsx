"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import type { Profile } from "@/types";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.id) return;
      supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle()
        .then(({ data }) => setProfile(data));
    });
  }, []);

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
