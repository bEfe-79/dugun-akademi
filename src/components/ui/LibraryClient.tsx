"use client";
import { useState, useMemo } from "react";
import type { DictionaryTerm, LibraryArticle } from "@/types";

type Tab = "dictionary" | "articles";

export default function LibraryClient({
  dictionary, articles,
}: { dictionary: DictionaryTerm[]; articles: LibraryArticle[] }) {
  const [tab, setTab] = useState<Tab>("dictionary");
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<LibraryArticle | null>(null);

  const filteredDict = useMemo(() =>
    dictionary.filter(d =>
      d.term_name.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase())
    ), [dictionary, search]);

  const filteredArticles = useMemo(() =>
    articles.filter(a =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
    ), [articles, search]);

  const TAB_LABELS: Record<Tab, string> = {
    dictionary: "Satış Sözlüğü",
    articles:   "Kitap Önerileri",
  };

  return (
    <div className="space-y-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex rounded-xl p-1 gap-1" style={{ backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}>
          {(["dictionary", "articles"] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setSearch(""); setSelectedArticle(null); }}
              style={{
                padding: "8px 16px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                cursor: "pointer", border: "none", transition: "all 0.15s",
                backgroundColor: tab === t ? "#ffffff" : "transparent",
                color: tab === t ? "#00abaa" : "#64748b",
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8", fontSize: 16 }}>🔍</span>
          <input type="text" className="input pl-9"
            placeholder={tab === "dictionary" ? "Terim ara…" : "Kitap ara…"}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Dictionary */}
      {tab === "dictionary" && (
        filteredDict.length === 0
          ? <Empty />
          : <div className="grid sm:grid-cols-2 gap-3 stagger">
              {filteredDict.map(term => (
                <div key={term.id} className="card hover:shadow-md transition-shadow duration-150">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 16 }}>
                      {term.term_name}
                    </h4>
                    {term.category && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                        backgroundColor: "#e0f7f7", color: "#00abaa", border: "1px solid #b2eded",
                        flexShrink: 0,
                      }}>
                        {term.category}
                      </span>
                    )}
                  </div>
                  <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>{term.description}</p>
                </div>
              ))}
            </div>
      )}

      {/* Articles list */}
      {tab === "articles" && !selectedArticle && (
        filteredArticles.length === 0
          ? <Empty />
          : <div className="space-y-2 stagger">
              {filteredArticles.map(article => (
                <button key={article.id} onClick={() => setSelectedArticle(article)}
                  className="card w-full text-left hover:shadow-md transition-all duration-150"
                  style={{ cursor: "pointer", border: "1px solid #e2e8f0" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 600, color: "#1e293b", fontSize: 15 }}
                        className="truncate">{article.title}</p>
                      <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
                        {article.category} · {new Date(article.created_at).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    <span style={{ color: "#00abaa", flexShrink: 0 }}>→</span>
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
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
              backgroundColor: "#e0f7f7", color: "#00abaa", border: "1px solid #b2eded",
              display: "inline-block", marginBottom: 8,
            }}>
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

function Empty() {
  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center">
      <span style={{ fontSize: 36, marginBottom: 12 }}>🔍</span>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>Sonuç bulunamadı.</p>
    </div>
  );
}
