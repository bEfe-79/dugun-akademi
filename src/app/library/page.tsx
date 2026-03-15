import { createClient } from "@/lib/supabase/server";
import LibraryClient from "@/components/ui/LibraryClient";

export const metadata = { title: "Kutuphane | Dugun Akademi" };

export default async function LibraryPage() {
  const supabase = createClient();

  const [{ data: dictionary }, { data: articles }] = await Promise.all([
    supabase.from("sales_dictionary").select("*").order("term_name"),
    supabase
      .from("knowledge_base")
      .select("id, title, category, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold text-stone-100">
          Kutuphane
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Satis sozlugu ve bilgi bankasi makalelerini kesfedin.
        </p>
      </div>

      <LibraryClient dictionary={dictionary ?? []} articles={articles ?? []} />
    </div>
  );
}
