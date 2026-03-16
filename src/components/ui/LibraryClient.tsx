"use client";
import { useState, useMemo } from "react";
import type { DictionaryTerm, LibraryArticle } from "@/types";

type Tab = "dictionary" | "articles";

function parseTerm(termName: string) {
  const m = termName.match(/^(.+?)\s*\((.+)\)$/);
  return m ? { name: m[1].trim(), full: m[2].trim() } : { name: termName, full: "" };
}

export default function LibraryClient({
  dictionary, articles,
}: { dictionary: DictionaryTerm[]; articles: LibraryArticle[] }) {
  const [tab, setTab]                       = useState<Tab>("dictionary");
  const [search, setSearch]                 = useState("");
  const [selectedArticle, setSelectedArticle] = useState<LibraryArticle | null>(null);

  const filteredDict = useMemo(() =>
    dictionary.filter(d =>
      d.term_name.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase())
    ), [dictionary, search]);

  const filteredArticles = useMemo(() =>
    articles.filter(a =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
    ), [articles, search]);

  return (
    <div className="space-y-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
      {/* Tabs + Search */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ display: "flex", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 12, padding: 4, gap: 4 }}>
          {([["dictionary", "📖 Satış Sözlüğü"], ["articles", "📚 Kitap Önerileri"]] as [Tab, string][]).map(([t, l]) => (
            <button key={t} onClick={() => { setTab(t); setSearch(""); setSelectedArticle(null); }}
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
            placeholder={tab === "dictionary" ? "Terim ara…" : "Kitap ara…"}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Dictionary */}
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
                        <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                          {term.description}
                        </td>
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

      {/* Articles list */}
      {tab === "articles" && !selectedArticle && (
        filteredArticles.length === 0
          ? <Empty text={search ? "Arama sonucu bulunamadı." : "Henüz makale eklenmemiş."} />
          : <div className="space-y-2">
              {filteredArticles.map(article => (
                <button key={article.id} onClick={() => setSelectedArticle(article)}
                  className="card w-full text-left hover:shadow-md transition-all duration-150"
                  style={{ cursor: "pointer", display: "block" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 600, color: "#1e293b", fontSize: 15, marginBottom: 4 }}>
                        {article.title}
                      </p>
                      <p style={{ color: "#94a3b8", fontSize: 12 }}>
                        {article.category} · {new Date(article.created_at).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    <span style={{ color: "#00abaa", flexShrink: 0, fontSize: 18 }}>→</span>
                  </div>
                </button>
              ))}
            </div>
      )}

      {/* Article detail */}
      {tab === "articles" && selectedArticle && (
        <div className="card animate-fade-up space-y-5">
          <button onClick={() => setSelectedArticle(null)}
            style={{ color: "#00abaa", fontSize: 14, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            ← Geri
          </button>
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: "#e0f7f7", color: "#00abaa", border: "1px solid #b2eded", display: "inline-block", marginBottom: 8 }}>
              {selectedArticle.category}
            </span>
            <h2 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
              {selectedArticle.title}
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 12 }}>
              {new Date(selectedArticle.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div style={{ color: "#475569", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap", borderTop: "1px solid #e2e8f0", paddingTop: 20 }}>
            {selectedArticle.content}
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
