"use client";
import { useState, useMemo } from "react";
import type { DictionaryTerm, LibraryArticle } from "@/types";

type Tab = "dictionary" | "articles";

export default function LibraryClient({
  dictionary,
  articles,
}: {
  dictionary: DictionaryTerm[];
  articles: LibraryArticle[];
}) {
  const [tab, setTab] = useState<Tab>("dictionary");
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] =
    useState<LibraryArticle | null>(null);

  const filteredDict = useMemo(
    () =>
      dictionary.filter(
        (d) =>
          d.term_name.toLowerCase().includes(search.toLowerCase()) ||
          d.description.toLowerCase().includes(search.toLowerCase())
      ),
    [dictionary, search]
  );

  const filteredArticles = useMemo(
    () =>
      articles.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.category.toLowerCase().includes(search.toLowerCase())
      ),
    [articles, search]
  );

  return (
    <div className="space-y-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex bg-surface-2 border border-surface-3 rounded-xl p-1 shrink-0">
          {(["dictionary", "articles"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setSearch("");
                setSelectedArticle(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                tab === t
                  ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                  : "text-stone-500 hover:text-stone-200"
              }`}
            >
              {t === "dictionary" ? "📖 Sözlük" : "📚 Makaleler"}
            </button>
          ))}
        </div>

        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
            🔍
          </span>
          <input
            type="text"
            className="input pl-9"
            placeholder={tab === "dictionary" ? "Terim ara…" : "Makale ara…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Dictionary */}
      {tab === "dictionary" && (
        <div>
          {filteredDict.length === 0 ? (
            <Empty />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 stagger">
              {filteredDict.map((term) => (
                <div
                  key={term.id}
                  className="card hover:border-surface-4 transition-colors duration-150"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-display font-bold text-stone-100">
                      {term.term_name}
                    </h4>
                    {term.category && (
                      <span className="badge bg-brand-500/10 border-brand-500/20 text-brand-400 shrink-0">
                        {term.category}
                      </span>
                    )}
                  </div>
                  <p className="text-stone-400 text-sm leading-relaxed">
                    {term.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Articles list */}
      {tab === "articles" && !selectedArticle && (
        <div>
          {filteredArticles.length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-2.5 stagger">
              {filteredArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="card w-full text-left hover:border-brand-500/30 hover:bg-surface-2 transition-all duration-150 group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-stone-100 font-semibold group-hover:text-brand-300 transition-colors truncate">
                        {article.title}
                      </p>
                      <p className="text-stone-500 text-xs mt-0.5">
                        {article.category} ·{" "}
                        {new Date(article.created_at).toLocaleDateString(
                          "tr-TR"
                        )}
                      </p>
                    </div>
                    <span className="text-stone-600 group-hover:text-brand-400 transition-colors shrink-0">
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Article detail */}
      {tab === "articles" && selectedArticle && (
        <div className="card animate-fade-up space-y-5">
          <button
            onClick={() => setSelectedArticle(null)}
            className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1.5 transition-colors"
          >
            ← Geri
          </button>
          <div>
            <span className="badge bg-brand-500/10 border-brand-500/20 text-brand-400 mb-3">
              {selectedArticle.category}
            </span>
            <h2 className="font-display text-2xl font-bold text-stone-100 mt-2 mb-1">
              {selectedArticle.title}
            </h2>
            <p className="text-stone-600 text-xs">
              {new Date(selectedArticle.created_at).toLocaleDateString(
                "tr-TR",
                { day: "numeric", month: "long", year: "numeric" }
              )}
            </p>
          </div>
          <div className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap border-t border-surface-3 pt-5">
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
      <span className="text-4xl mb-4">🔍</span>
      <p className="text-stone-500 text-sm">Sonuç bulunamadı.</p>
    </div>
  );
}
