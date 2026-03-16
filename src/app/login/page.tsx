import LoginForm from "@/components/ui/LoginForm";

export const metadata = { title: "Giriş | Düğün Akademi" };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#f1f5f9" }}>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-5">
            <div style={{
              width: 80, height: 80,
              borderRadius: 22,
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,171,170,0.35), 0 2px 8px rgba(0,0,0,0.12)",
            }}>
              <img src="/logo.png" alt="Düğün Akademi" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
          </div>
          <h1 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 28, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
            Düğün Akademi
          </h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>Satış Ekibi Portalı</p>
        </div>

        {/* Card */}
        <div className="card shadow-sm">
          <h2 style={{ fontFamily: "'Chalet', sans-serif", fontSize: 20, fontWeight: 600, color: "#1e293b", marginBottom: 24 }}>
            Hesabınıza giriş yapın
          </h2>
          <LoginForm />
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          © {new Date().getFullYear()} Düğün Akademi
        </p>
      </div>
    </main>
  );
}
