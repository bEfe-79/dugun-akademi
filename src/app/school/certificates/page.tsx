"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Certificate {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  issued_at: string;
  created_at: string;
  exam_id: string | null;
  exams?: { title: string } | null;
}

export default function CertificatesPage() {
  const [certs, setCerts]     = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.id) { setLoading(false); return; }
      const { data } = await supabase
        .from("certificates")
        .select("*, exams(title)")
        .eq("user_id", session.user.id)
        .order("issued_at", { ascending: false });
      setCerts(data ?? []);
      setLoading(false);
    });
  }, []);

  function handleDownload(cert: Certificate) {
    const a = document.createElement("a");
    a.href = cert.file_url;
    a.download = cert.title;
    a.target = "_blank";
    a.click();
  }

  async function handleShare(cert: Certificate) {
    if (navigator.share) {
      try {
        await navigator.share({ title: cert.title, url: cert.file_url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(cert.file_url);
      alert("Sertifika linki kopyalandı!");
    }
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256, color: "#64748b" }}>
      <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" style={{ marginRight: 12 }} />
      Yükleniyor...
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }} className="space-y-8">

      {/* Başlık */}
      <div className="animate-fade-up">
        <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: "clamp(22px,5vw,30px)", fontWeight: 700, color: "#1e293b" }}>
          Sertifikalarım
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Tamamladığın sınavlara ait sertifikalarını görüntüle ve indir.
        </p>
      </div>

      {/* Sayaç */}
      {certs.length > 0 && (
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ backgroundColor: "#fff", border: "0.5px solid #e2e8f0", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#e0f7f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏆</div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Toplam Sertifika</p>
              <p style={{ fontFamily: "'Chalet', sans-serif", fontSize: 24, fontWeight: 700, color: "#00abaa" }}>{certs.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Boş durum */}
      {certs.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
          <p style={{ fontFamily: "'Chalet', sans-serif", fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
            Henüz sertifikan yok
          </p>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            Sınavları başarıyla tamamladığında sertifikalarını burada göreceksin.
          </p>
        </div>
      )}

      {/* Sertifika grid */}
      {certs.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {certs.map(cert => (
            <div key={cert.id} className="card animate-fade-up"
              style={{ border: "2px solid #00abaa", padding: 0, overflow: "hidden" }}>

              {/* Önizleme alanı */}
              <div style={{ height: 180, backgroundColor: "#e0f7f7", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                {cert.file_type === "pdf" ? (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>📄</div>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, backgroundColor: "#db0962", color: "#fff" }}>PDF</span>
                  </div>
                ) : (
                  <img
                    src={cert.file_url}
                    alt={cert.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                {/* Sınav badge */}
                {cert.exams?.title && (
                  <span style={{ position: "absolute", top: 10, right: 10, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, backgroundColor: "rgba(255,255,255,0.92)", color: "#00abaa", border: "1px solid #b2eded" }}>
                    {cert.exams.title}
                  </span>
                )}
              </div>

              {/* İçerik */}
              <div style={{ padding: "16px 18px" }}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#00abaa", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Düğün Akademi · Satış Okulu
                  </span>
                </div>
                <h3 style={{ fontFamily: "'Chalet', sans-serif", fontWeight: 700, color: "#1e293b", fontSize: 16, marginBottom: 4, lineHeight: 1.3 }}>
                  {cert.title}
                </h3>
                <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 14 }}>
                  📅 {new Date(cert.issued_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </p>

                {/* Aksiyon butonları */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => window.open(cert.file_url, "_blank")}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#475569", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
                    👁 Görüntüle
                  </button>
                  <button
                    onClick={() => handleDownload(cert)}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "none", backgroundColor: "#00abaa", color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
                    ⬇ İndir
                  </button>
                  <button
                    onClick={() => handleShare(cert)}
                    style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #db0962", backgroundColor: "#fce7f0", color: "#db0962", fontSize: 13, cursor: "pointer" }}>
                    ↗
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
