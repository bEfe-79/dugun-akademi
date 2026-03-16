"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LibraryClient from "@/components/ui/LibraryClient";
import type { DictionaryTerm, LibraryArticle } from "@/types";

export default function LibraryPage() {
  const [dictionary, setDictionary] = useState<DictionaryTerm[]>([]);
  const [articles, setArticles]     = useState<LibraryArticle[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("sales_dictionary").select("*").order("term_name"),
      supabase.from("knowledge_base").select("id, title, content, category, created_at, author, published_year, cover_image_url, read_time_minutes, featured_quote")
        .eq("is_published", true).order("created_at", { ascending: false }),
    ]).then(([dict, arts]) => {
      setDictionary(dict.data ?? []);
      setArticles(arts.data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256, color: "#64748b" }}>
      <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" style={{ marginRight: 12 }} />
      Yükleniyor...
    </div>
  );

  return (
    <div style={{ maxWidth: 1024, margin: "0 auto" }} className="space-y-8">
      <div className="animate-fade-up">
        <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 30, fontWeight: 700, color: "#1e293b" }}>
          Satış Kütüphanesi
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Satış bilginizi geliştirin, terimleri keşfedin.
        </p>
      </div>
      <LibraryClient dictionary={dictionary} articles={articles} />
    </div>
  );
}
