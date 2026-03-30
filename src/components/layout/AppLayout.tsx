"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import type { Profile } from "@/types";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();

      // Session yok → login'e yönlendir
      if (!session?.user?.id) { router.push("/login"); return; }

      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", session.user.id).maybeSingle();

      setProfile(profileData);

      // İlk giriş kontrolü — set-password sayfasında değilse yönlendir
      if (!profileData?.password_changed && pathname !== "/set-password") {
        router.push("/set-password");
        return;
      }
    }

    checkSession();

    // Session değişikliklerini dinle (expire, logout vb.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login");
      }
      if (event === "TOKEN_REFRESHED" && session?.user?.id) {
        // Token yenilendi, session devam ediyor — bir şey yapmaya gerek yok
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#f8fafc" }}>
      <Sidebar profile={profile} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar profile={profile} />
        <main
          style={{ flex: 1, overflowY: "auto", backgroundColor: "#f8fafc" }}
          className="px-5 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </main>
      </div>
      <BottomNav profile={profile} />
    </div>
  );
}
