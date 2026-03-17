"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import type { Profile } from "@/types";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.id) return;
      supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle()
        .then(({ data }) => setProfile(data));
    });
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#f8fafc" }}>
      {/* Sidebar — sadece lg ve üstünde görünür */}
      <Sidebar profile={profile} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar profile={profile} />
        <main
          style={{ flex: 1, overflowY: "auto", backgroundColor: "#f8fafc" }}
          className="px-5 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </main>
      </div>

      {/* BottomNav — lg ve üstünde kendisi hidden */}
      <BottomNav profile={profile} />
    </div>
  );
}
