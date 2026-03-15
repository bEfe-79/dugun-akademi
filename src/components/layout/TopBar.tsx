"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

export default function TopBar({ profile }: { profile: Profile | null }) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="shrink-0 h-14 flex items-center justify-between px-6 md:px-8 bg-surface-1 border-b border-surface-3">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 md:hidden">
        <span className="text-xl">💍</span>
        <span className="font-display font-bold text-stone-200 text-sm">
          Düğün Akademi
        </span>
      </div>

      {/* Desktop greeting */}
      <p className="hidden md:block text-stone-500 text-sm">
        Merhaba,{" "}
        <span className="text-stone-200 font-medium">{profile?.full_name}</span>
      </p>

      <div className="flex items-center gap-3">
        <span className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500 bg-surface-2 border border-surface-3 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {new Date().toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
          })}
        </span>
        <button
          onClick={logout}
          className="text-stone-500 hover:text-stone-200 text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-2"
        >
          Çıkış →
        </button>
      </div>
    </header>
  );
}
