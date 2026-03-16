"use client";
import { useState, useMemo } from "react";
import type { DictionaryTerm } from "@/types";

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  author?: string;
  published_year?: number;
  cover_image_url?: string;
  read_time_minutes?: number;
  featured_quote?: string;
}

type Tab = "dictionary" | "articles";

function parseTerm(termName: string) {
  const m = termName.match(/^(.+?)\s*\((.+)\)$/);
  return m ? { name: m[1].trim(), full: m[2].trim() } : { name: termName, full: "" };
}

export default function LibraryClient({
  dictionary, articles,
}: { dictionary: DictionaryTerm[]; articles: Article[] }) {
  const [tab, setTab] = useState<Tab>("dictionary");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(articles.map(a => a.category).filter(Boolean)));
    return ["Tümü", ...cats.sort()];
  }, [articles]);

  const filteredDict = useMemo(() =>
    dictionary.filter(d =>
      d.term_name.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase())
    ), [dictionary, search]);

  const filteredArticles = useMemo(() =>
    articles.filter(a => {
      const matchSearch = !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        (a.author ?? "").toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === "Tümü" || a.category === selectedCategory;
      return matchSearch && matchCat;
    }), [articles, search, selectedCategory]);

  return (
    <div className="space-y-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>

      {/* Tabs + Search */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ display: "flex", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 12, padding: 4, gap: 4 }}>
          {([["dictionary", "📖 Satış Sözlüğü"], ["articles", "📚 Kitap Önerileri"]] as [Tab, string][]).map(([t, l]) => (
            <button key={t} onClick={() => { setTab(t); setSearch(""); setSelectedArticle(null); setSelectedCategory("Tümü"); }}
              style={{
                padding: "8px 16px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                cursor: "pointer", border: "none", transition: "all 0.15s",
                backgroundColor: tab === t ? "#ffffff" : "transparent",
                color: tab === t ? "#00abaa" : "#64748b",
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
          <input type="text"
            style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b", backgroundColor: "#fff", outline: "none" }}
            placeholder={tab === "dictionary" ? "Terim ara…" : "Kitap veya yazar ara…"}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* DICTIONARY TAB */}
      {tab === "dictionary" && (
        filteredDict.length === 0
          ? <Empty text={search ? "Arama sonucu bulunamadı." : "Henüz terim eklenmemiş."} />
          : <div className="card p-0 overflow-hidden">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ backgroundColor: "#00abaa" }}>
                    {["Terim", "Açılım", "Kategori", "Açıklama"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDict.map(term => {
                    const { name, full } = parseTerm(term.term_name);
                    return (
                      <tr key={term.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#e6f7f7")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>{name}</td>
                        <td style={{ padding: "12px 14px", color: "#475569", fontSize: 13 }}>{full || "—"}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: "#e0f7f7", color: "#00abaa", border: "1px solid #b2eded", whiteSpace: "nowrap" }}>
                            {term.category}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>{term.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ padding: "10px 14px", borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#94a3b8" }}>
                {filteredDict.length} terim
              </div>
            </div>
      )}

      {/* ARTICLES TAB — LIST */}
      {tab === "articles" && !selectedArticle && (
        <div className="space-y-5">
          {/* Kategori filtreleme */}
          {categories.length > 2 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
                  padding: "6px 14px", borderRadius: 99, fontSize: 13, fontWeight: 500,
                  cursor: "pointer", border: "none", transition: "all 0.15s",
                  backgroundColor: selectedCategory === cat ? "#00abaa" : "#ffffff",
                  color: selectedCategory === cat ? "#ffffff" : "#64748b",
                  outline: selectedCategory === cat ? "none" : "1px solid #e2e8f0",
                }}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {filteredArticles.length === 0 ? (
            <Empty text={search || selectedCategory !== "Tümü" ? "Arama sonucu bulunamadı." : "Henüz kitap eklenmemiş."} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredArticles.map(article => (
                <button key={article.id} onClick={() => setSelectedArticle(article)}
                  style={{ textAlign: "left", cursor: "pointer", border: "none", backgroundColor: "transparent", padding: 0 }}>
                  <div className="card" style={{ height: "100%", padding: 0, overflow: "hidden", transition: "box-shadow 0.2s, transform 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,171,170,0.15)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ""; (e.currentTarget as HTMLDivElement).style.transform = ""; }}>

                    {/* Kapak */}
                    <div style={{
                      height: 180, backgroundColor: "#e0f7f7", display: "flex", alignItems: "center", justifyContent: "center",
                      overflow: "hidden", position: "relative",
                    }}>
                      {article.cover_image_url ? (
                        <img src={article.cover_image_url} alt={article.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 40 }}>📚</span>
                        </div>
                      )}
                      {/* Kategori badge */}
                      <span style={{
                        position: "absolute", top: 10, right: 10,
                        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                        backgroundColor: "rgba(255,255,255,0.92)", color: "#00abaa",
                        border: "1px solid #b2eded",
                      }}>
                        {article.category}
                      </span>
                    </div>

                    {/* İçerik */}
                    <div style={{ padding: "16px" }}>
                      <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 15, marginBottom: 4, lineHeight: 1.3 }}>
                        {article.title}
                      </h3>
                      {article.author && (
                        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 8 }}>
                          {article.author}{article.published_year ? ` · ${article.published_year}` : ""}
                        </p>
                      )}
                      {article.read_time_minutes && (
                        <p style={{ color: "#94a3b8", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                          ⏱ {article.read_time_minutes} dk okuma
                        </p>
                      )}
                      {article.content && (
                        <p style={{ color: "#64748b", fontSize: 13, marginTop: 8, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {article.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ARTICLES TAB — DETAIL */}
      {tab === "articles" && selectedArticle && (
        <div className="space-y-6 animate-fade-up">
          <button onClick={() => setSelectedArticle(null)}
            style={{ color: "#00abaa", fontSize: 14, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
            ← Kitap Listesine Dön
          </button>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Hero */}
            <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
              {/* Kapak */}
              <div style={{
                width: 200, minHeight: 260, backgroundColor: "#e0f7f7",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {selectedArticle.cover_image_url ? (
                  <img src={selectedArticle.cover_image_url} alt={selectedArticle.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 64 }}>📚</span>
                )}
              </div>

              {/* Meta bilgiler */}
              <div style={{ flex: 1, padding: "28px 32px", minWidth: 240 }}>
                <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, backgroundColor: "#e0f7f7", color: "#00abaa", border: "1px solid #b2eded", display: "inline-block", marginBottom: 12 }}>
                  {selectedArticle.category}
                </span>
                <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 24, fontWeight: 700, color: "#1e293b", marginBottom: 8, lineHeight: 1.3 }}>
                  {selectedArticle.title}
                </h1>
                {selectedArticle.author && (
                  <p style={{ color: "#475569", fontSize: 15, marginBottom: 4 }}>
                    ✍️ {selectedArticle.author}
                  </p>
                )}
                {selectedArticle.published_year && (
                  <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 4 }}>
                    📅 {selectedArticle.published_year}
                  </p>
                )}
                {selectedArticle.read_time_minutes && (
                  <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 16 }}>
                    ⏱ {selectedArticle.read_time_minutes} dakika okuma
                  </p>
                )}
                <p style={{ color: "#64748b", fontSize: 13 }}>
                  Eklenme: {new Date(selectedArticle.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Öne çıkan alıntı */}
            {selectedArticle.featured_quote && (
              <div style={{ margin: "0 32px", padding: "20px 24px", backgroundColor: "#f0fffe", border: "1px solid #b2eded", borderRadius: 12, borderLeft: "4px solid #00abaa" }}>
                <p style={{ fontFamily: "'Chalet', sans-serif", color: "#1e293b", fontSize: 16, lineHeight: 1.7, fontStyle: "italic" }}>
                  "{selectedArticle.featured_quote}"
                </p>
              </div>
            )}

            {/* İçerik */}
            <div style={{ padding: "28px 32px" }}>
              <h2 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 17, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>
                Kitap Özeti
              </h2>
              <div style={{ color: "#475569", fontSize: 15, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
                {selectedArticle.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", textAlign: "center" }}>
      <span style={{ fontSize: 36, marginBottom: 12 }}>🔍</span>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>{text}</p>
    </div>
  );
}
