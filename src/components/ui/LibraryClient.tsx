"use client";
import { useState, useMemo, useEffect, useRef } from "react";
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

type Tab  = "dictionary" | "articles";
type View = "card" | "list";

const STORAGE_KEY = "da_fav_terms";

function parseTerm(termName: string) {
  const m = termName.match(/^(.+?)\s*\((.+)\)$/);
  return m ? { name: m[1].trim(), full: m[2].trim() } : { name: termName, full: "" };
}

export default function LibraryClient({
  dictionary, articles,
}: { dictionary: DictionaryTerm[]; articles: Article[] }) {
  const [tab, setTab]                     = useState<Tab>("dictionary");
  const [view, setView]                   = useState<View>("card");
  const [search, setSearch]               = useState("");
  const [activeCat, setActiveCat]         = useState("Tümü");
  const [activeLetter, setActiveLetter]   = useState("");
  const [showFavsOnly, setShowFavsOnly]   = useState(false);
  const [favs, setFavs]                   = useState<Set<string>>(new Set());
  const [selectedArticle, setSelectedArticle]   = useState<Article | null>(null);
  const [selectedArticleCat, setSelectedArticleCat] = useState("Tümü");

  const listWrapRef = useRef<HTMLDivElement>(null);
  const overlayRef  = useRef<HTMLDivElement>(null);
  const hideTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Favorileri localStorage'dan yükle
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFavs(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  function saveFavs(next: Set<string>) {
    setFavs(new Set(next));
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch {}
  }

  function toggleFav(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next = new Set(favs);
    next.has(id) ? next.delete(id) : next.add(id);
    if (next.size === 0 && showFavsOnly) { setShowFavsOnly(false); setActiveCat("Tümü"); }
    saveFavs(next);
  }

  const dictCats = useMemo(() =>
    ["Tümü", ...Array.from(new Set(dictionary.map(d => d.category))).sort()],
    [dictionary]);

  const letters = useMemo(() =>
    Array.from(new Set(dictionary.map(d => parseTerm(d.term_name).name[0]?.toUpperCase()).filter(Boolean))).sort(),
    [dictionary]);

  const filteredDict = useMemo(() =>
    dictionary.filter(d => {
      const { name } = parseTerm(d.term_name);
      if (showFavsOnly && !favs.has(d.id)) return false;
      if (!showFavsOnly && activeCat !== "Tümü" && d.category !== activeCat) return false;
      if (activeLetter && name[0]?.toUpperCase() !== activeLetter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!d.term_name.toLowerCase().includes(q) && !d.description.toLowerCase().includes(q)) return false;
      }
      return true;
    }), [dictionary, search, activeCat, activeLetter, showFavsOnly, favs]);

  const articleCats = useMemo(() =>
    ["Tümü", ...Array.from(new Set(articles.map(a => a.category))).sort()],
    [articles]);

  const filteredArticles = useMemo(() =>
    articles.filter(a => {
      if (selectedArticleCat !== "Tümü" && a.category !== selectedArticleCat) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!a.title.toLowerCase().includes(q) && !(a.author ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    }), [articles, search, selectedArticleCat]);

  function setCat(cat: string) { setActiveCat(cat); setActiveLetter(""); setShowFavsOnly(false); }
  function toggleLetter(l: string) { setActiveLetter(prev => prev === l ? "" : l); }
  function toggleFavFilter() {
    const next = !showFavsOnly;
    setShowFavsOnly(next);
    if (next) { setActiveCat("Tümü"); setActiveLetter(""); }
  }

  // Liste overlay — hover ile göster
  function handleRowEnter(e: React.MouseEvent<HTMLTableRowElement>, term: DictionaryTerm) {
    const wrap = listWrapRef.current;
    const ov   = overlayRef.current;
    if (!wrap || !ov) return;
    clearTimeout(hideTimer.current ?? undefined);
    const { name, full } = parseTerm(term.term_name);
    ov.innerHTML = `
      <div style="font-size:15px;font-weight:600;color:#00abaa;margin-bottom:3px">${name}</div>
      ${full ? `<div style="font-size:12px;color:#94a3b8;font-style:italic;margin-bottom:10px">${full}</div>` : ""}
      <div style="font-size:13px;color:#475569;line-height:1.7;user-select:text;cursor:text">${term.description}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px">
        <span style="display:inline-block;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:500;background:#db0962;color:#fff">${term.category}</span>
      </div>`;
    const rowRect  = e.currentTarget.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    ov.style.top     = (rowRect.top - wrapRect.top) + "px";
    ov.style.display = "block";
  }

  function handleRowLeave(e: React.MouseEvent) {
    const ov = overlayRef.current;
    if (!ov) return;
    if (e.relatedTarget instanceof Node && ov.contains(e.relatedTarget)) return;
    hideTimer.current = setTimeout(() => { if (ov) ov.style.display = "none"; }, 100);
  }

  function handleOverlayLeave() {
    hideTimer.current = setTimeout(() => { if (overlayRef.current) overlayRef.current.style.display = "none"; }, 100);
  }

  function handleOverlayEnter() {
    clearTimeout(hideTimer.current ?? undefined);
  }

  // Sağ kenarda kart flip kontrolü
  function applyFlip() {
    const grid = document.getElementById("dictGrid");
    if (!grid) return;
    const gRight = grid.getBoundingClientRect().right;
    grid.querySelectorAll<HTMLDivElement>(".dict-card").forEach(card => {
      const slot = card.parentElement;
      if (!slot) return;
      const r = slot.getBoundingClientRect();
      if (r.right + 80 > gRight) card.style.transformOrigin = "right top";
      else card.style.transformOrigin = "left top";
    });
  }

  useEffect(() => {
    if (view === "card") setTimeout(applyFlip, 60);
  }, [view, filteredDict]);

  const hasFavs = favs.size > 0;
  const btnBase: React.CSSProperties = { padding: "5px 14px", borderRadius: 99, border: "0.5px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#64748b", fontSize: 13, cursor: "pointer", transition: "all .15s" };
  const btnActive: React.CSSProperties = { ...btnBase, backgroundColor: "#00abaa", color: "#fff", border: "0.5px solid #00abaa" };
  const btnFavActive: React.CSSProperties = { ...btnBase, backgroundColor: "#f59e0b", color: "#fff", border: "0.5px solid #f59e0b" };

  return (
    <div className="space-y-5 animate-fade-up" style={{ animationDelay: "0.1s" }}>

      {/* Tab bar */}
      <div style={{ display: "flex", border: "0.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden", backgroundColor: "#f8fafc" }}>
        {([["dictionary", "📖 Satış Sözlüğü"], ["articles", "📚 Satış Kütüphanesi"]] as [Tab, string][]).map(([t, l]) => (
          <button key={t} onClick={() => { setTab(t); setSearch(""); setSelectedArticle(null); setActiveCat("Tümü"); setActiveLetter(""); setShowFavsOnly(false); }}
            style={{ flex: 1, padding: "12px 16px", border: "none", borderRight: t === "dictionary" ? "0.5px solid #e2e8f0" : "none", backgroundColor: tab === t ? "#fff" : "transparent", color: tab === t ? "#00abaa" : "#64748b", fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all .15s", boxShadow: tab === t ? "inset 0 -2px 0 #00abaa" : "none" }}>
            {l}
          </button>
        ))}
      </div>

      {/* Arama + view toggle */}
      <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, backgroundColor: "#fff", border: "0.5px solid #e2e8f0", borderRadius: 12, padding: "10px 16px", flex: 1 }}>
          <span style={{ color: "#94a3b8", fontSize: 16, flexShrink: 0 }}>🔍</span>
          <input type="text"
            style={{ border: "none", outline: "none", flex: 1, fontSize: 14, backgroundColor: "transparent", color: "#1e293b" }}
            placeholder={tab === "dictionary" ? "Terim veya açıklama ara…" : "Kitap veya yazar ara…"}
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>Temizle</button>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", border: "0.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
          {(["card", "list"] as View[]).map((v, i) => (
            <button key={v} onClick={() => setView(v)}
              style={{ flex: 1, width: 42, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderBottom: i === 0 ? "0.5px solid #e2e8f0" : "none", backgroundColor: view === v ? "#00abaa" : "#f8fafc", color: view === v ? "#fff" : "#94a3b8", cursor: "pointer", transition: "all .15s", fontSize: 17, position: "relative" }}>
              {view === v && <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", backgroundColor: "#db0962" }} />}
              {v === "card" ? "⊞" : "☰"}
            </button>
          ))}
        </div>
      </div>

      {/* ── SÖZLÜK ── */}
      {tab === "dictionary" && (
        <div className="space-y-4">
          {/* Filtreler */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {dictCats.map(cat => (
              <button key={cat} onClick={() => setCat(cat)} style={!showFavsOnly && activeCat === cat ? btnActive : btnBase}>{cat}</button>
            ))}
            {hasFavs && (
              <button onClick={toggleFavFilter} style={{ ...(showFavsOnly ? btnFavActive : btnBase), marginLeft: "auto" }}>
                {showFavsOnly ? `★ Favorilerim (${favs.size})` : `☆ Favorilerim (${favs.size})`}
              </button>
            )}
          </div>

          {/* A-Z */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {letters.map(l => (
              <button key={l} onClick={() => toggleLetter(l)}
                style={{ width: 28, height: 28, borderRadius: 6, border: "0.5px solid #e2e8f0", backgroundColor: activeLetter === l ? "#00abaa" : "transparent", color: activeLetter === l ? "#fff" : "#64748b", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, transition: "all .15s" }}>
                {l}
              </button>
            ))}
          </div>

          <p style={{ fontSize: 13, color: "#94a3b8" }}>
            {showFavsOnly ? `${filteredDict.length} favori terim` : `${filteredDict.length} terim gösteriliyor`}
          </p>

          {filteredDict.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Sonuç bulunamadı.</div>
          ) : view === "card" ? (
            // ── KART GÖRÜNÜMÜ ──
            <div id="dictGrid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {filteredDict.map(term => {
                const { name, full } = parseTerm(term.term_name);
                return (
                  <div key={term.id} style={{ position: "relative", height: 140 }}>
                    <div className="dict-card"
                      style={{ position: "absolute", inset: 0, background: "#fff", border: "0.5px solid #e2e8f0", borderRadius: 14, padding: 18, cursor: "default", zIndex: 1, display: "flex", flexDirection: "column", gap: 6, overflow: "hidden", transition: "border-color .2s, box-shadow .25s, width .28s cubic-bezier(0.22,1,0.36,1)", transformOrigin: "left top" }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.borderColor = "#00abaa";
                        el.style.boxShadow = "0 0 0 2px #00abaa, 0 20px 60px rgba(0,0,0,0.18), 0 6px 20px rgba(0,171,170,0.28)";
                        el.style.width = "calc(100% + 80px)";
                        el.style.zIndex = "100";
                        el.style.overflow = "visible";
                        const desc = el.querySelector(".dict-desc") as HTMLElement;
                        if (desc) { desc.style.maxHeight = "200px"; desc.style.opacity = "1"; }
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.borderColor = "#e2e8f0";
                        el.style.boxShadow = "none";
                        el.style.width = "100%";
                        el.style.zIndex = "1";
                        el.style.overflow = "hidden";
                        const desc = el.querySelector(".dict-desc") as HTMLElement;
                        if (desc) { desc.style.maxHeight = "0"; desc.style.opacity = "0"; }
                      }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", lineHeight: 1.3, flex: 1 }}>{name}</span>
                        <button onClick={e => toggleFav(term.id, e)}
                          style={{ flexShrink: 0, cursor: "pointer", opacity: favs.has(term.id) ? 1 : 0.3, color: favs.has(term.id) ? "#f59e0b" : "inherit", fontSize: 16, lineHeight: 1, background: "none", border: "none", padding: 0 }}>
                          {favs.has(term.id) ? "★" : "☆"}
                        </button>
                      </div>
                      {full && <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", lineHeight: 1.4 }}>{full}</div>}
                      <div className="dict-desc" style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, maxHeight: 0, overflow: "hidden", opacity: 0, transition: "max-height .25s ease, opacity .2s ease", cursor: "text", userSelect: "text" }}>
                        {term.description}
                      </div>
                      <div style={{ marginTop: "auto", paddingTop: 6 }}>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500, backgroundColor: "#db0962", color: "#fff" }}>{term.category}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // ── LİSTE GÖRÜNÜMÜ ──
            <div ref={listWrapRef} style={{ border: "0.5px solid #e2e8f0", borderRadius: 12, backgroundColor: "#fff", position: "relative", overflow: "visible" }}>
              <div ref={overlayRef}
                onMouseEnter={handleOverlayEnter}
                onMouseLeave={handleOverlayLeave}
                style={{ display: "none", position: "absolute", left: -2, right: -2, background: "#fff", border: "2px solid #00abaa", borderRadius: 12, padding: "16px 18px", zIndex: 200, boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,171,170,0.25)", whiteSpace: "normal", pointerEvents: "auto" }} />
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead>
                  <tr style={{ backgroundColor: "#00abaa" }}>
                    {[["Terim", "25%"], ["Açılım", "35%"], ["Kategori", "20%"], ["Fav", "20%"]].map(([h, w]) => (
                      <th key={h} style={{ width: w, padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: ".05em", textAlign: "center", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDict.map((term, i) => {
                    const { name, full } = parseTerm(term.term_name);
                    return (
                      <tr key={term.id}
                        style={{ borderBottom: i < filteredDict.length - 1 ? "0.5px solid #f1f5f9" : "none", transition: "background .15s", cursor: "default" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "#f0fffe"; handleRowEnter(e, term); }}
                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = ""; handleRowLeave(e); }}>
                        <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>{name}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: "#64748b", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>{full || "—"}</td>
                        <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "middle" }}>
                          <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 500, backgroundColor: "#db0962", color: "#fff" }}>{term.category}</span>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "middle" }}>
                          <button onClick={e => toggleFav(term.id, e)}
                            style={{ cursor: "pointer", opacity: favs.has(term.id) ? 1 : 0.3, color: favs.has(term.id) ? "#f59e0b" : "inherit", fontSize: 16, background: "none", border: "none", padding: 0 }}>
                            {favs.has(term.id) ? "★" : "☆"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── KİTAP ÖNERİLERİ ── */}
      {tab === "articles" && !selectedArticle && (
        <div className="space-y-5">
          {articleCats.length > 2 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {articleCats.map(cat => (
                <button key={cat} onClick={() => setSelectedArticleCat(cat)} style={selectedArticleCat === cat ? btnActive : btnBase}>{cat}</button>
              ))}
            </div>
          )}
          {filteredArticles.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Sonuç bulunamadı.</div>
          ) : view === "card" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {filteredArticles.map(article => (
                <button key={article.id} onClick={() => setSelectedArticle(article)} style={{ textAlign: "left", cursor: "pointer", border: "none", backgroundColor: "transparent", padding: 0 }}>
                  <div style={{ backgroundColor: "#fff", border: "0.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden", transition: "box-shadow 0.2s, transform 0.2s", height: "100%" }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = "0 8px 24px rgba(0,171,170,0.15)"; el.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = ""; el.style.transform = ""; }}>
                    <div style={{ height: 180, backgroundColor: "#e0f7f7", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                      {article.cover_image_url ? <img src={article.cover_image_url} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 40 }}>📚</span>}
                      <span style={{ position: "absolute", top: 10, right: 10, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, backgroundColor: "rgba(255,255,255,0.92)", color: "#00abaa", border: "1px solid #b2eded" }}>{article.category}</span>
                    </div>
                    <div style={{ padding: 16 }}>
                      <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 15, marginBottom: 4, lineHeight: 1.3 }}>{article.title}</h3>
                      {article.author && <p style={{ color: "#64748b", fontSize: 13, marginBottom: 6 }}>{article.author}{article.published_year ? ` · ${article.published_year}` : ""}</p>}
                      {article.read_time_minutes && <p style={{ color: "#94a3b8", fontSize: 12 }}>⏱ {article.read_time_minutes} dk</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ border: "0.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden", backgroundColor: "#fff" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead>
                  <tr style={{ backgroundColor: "#00abaa" }}>
                    {[["Kitap Adı", "35%"], ["Yazar", "25%"], ["Kategori", "20%"], ["Yıl", "10%"], ["Süre", "10%"]].map(([h, w]) => (
                      <th key={h} style={{ width: w, padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: ".05em", textAlign: "center", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map((a, i) => (
                    <tr key={a.id}
                      style={{ borderBottom: i < filteredArticles.length - 1 ? "0.5px solid #f1f5f9" : "none", cursor: "pointer", transition: "background .15s" }}
                      onClick={() => setSelectedArticle(a)}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "#f0fffe"}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = ""}>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, color: "#00abaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>{a.title}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>{a.author || "—"}</td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}><span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 500, backgroundColor: "#db0962", color: "#fff" }}>{a.category}</span></td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#94a3b8", textAlign: "center" }}>{a.published_year || "—"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#94a3b8", textAlign: "center" }}>{a.read_time_minutes ? `${a.read_time_minutes} dk` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── KİTAP DETAY ── */}
      {tab === "articles" && selectedArticle && (
        <div className="space-y-6 animate-fade-up">
          <button onClick={() => setSelectedArticle(null)} style={{ color: "#00abaa", fontSize: 14, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
            ← Kitap Listesine Dön
          </button>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <div style={{ width: 200, minHeight: 260, backgroundColor: "#e0f7f7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {selectedArticle.cover_image_url ? <img src={selectedArticle.cover_image_url} alt={selectedArticle.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 64 }}>📚</span>}
              </div>
              <div style={{ flex: 1, padding: "28px 32px", minWidth: 240 }}>
                <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, backgroundColor: "#e0f7f7", color: "#00abaa", border: "1px solid #b2eded", display: "inline-block", marginBottom: 12 }}>{selectedArticle.category}</span>
                <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 24, fontWeight: 700, color: "#1e293b", marginBottom: 8, lineHeight: 1.3 }}>{selectedArticle.title}</h1>
                {selectedArticle.author && <p style={{ color: "#475569", fontSize: 15, marginBottom: 4 }}>✍️ {selectedArticle.author}</p>}
                {selectedArticle.published_year && <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 4 }}>📅 {selectedArticle.published_year}</p>}
                {selectedArticle.read_time_minutes && <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 16 }}>⏱ {selectedArticle.read_time_minutes} dakika okuma</p>}
              </div>
            </div>
            {selectedArticle.featured_quote && (
              <div style={{ margin: "0 32px 24px", padding: "20px 24px", backgroundColor: "#f0fffe", border: "1px solid #b2eded", borderRadius: 12, borderLeft: "4px solid #00abaa" }}>
                <p style={{ fontFamily: "'Chalet', sans-serif", color: "#1e293b", fontSize: 16, lineHeight: 1.7, fontStyle: "italic" }}>"{selectedArticle.featured_quote}"</p>
              </div>
            )}
            <div style={{ padding: "0 32px 32px" }}>
              <h2 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 17, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Kitap Özeti</h2>
              <div style={{ color: "#475569", fontSize: 15, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{selectedArticle.content}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
