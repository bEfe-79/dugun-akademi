import { createClient } from "@/lib/supabase/server";
import LibraryClient from "@/components/ui/LibraryClient";

export const metadata = { title: "Satış Kütüphanesi | Düğün Akademi" };

export default async function LibraryPage() {
  const supabase = createClient();

  const [{ data: dictionary }, { data: articles }] = await Promise.all([
    supabase.from("sales_dictionary").select("*").order("term_name"),
    supabase.from("knowledge_base").select("id, title, category, created_at")
      .eq("is_published", true).order("created_at", { ascending: false }),
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="animate-fade-up">
        <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 30, fontWeight: 700, color: "#1e293b" }}>
          Satış Kütüphanesi
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Satış bilginizi geliştirin, terimleri keşfedin.
        </p>
      </div>

      <LibraryClient dictionary={dictionary ?? []} articles={articles ?? []} />
    </div>
  );
}
