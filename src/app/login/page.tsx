import LoginForm from "@/components/ui/LoginForm";

export const metadata = { title: "Giriş | Düğün Akademi" };

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 mb-4">
            <img src="/logo.png" alt="logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="font-display text-3xl font-bold text-stone-100 mb-1">
            Düğün Akademi
          </h1>
          <p className="text-stone-500 text-sm">Satış Ekibi Portalı</p>
        </div>

        <div className="card">
          <h2 className="font-display text-xl font-semibold text-stone-200 mb-6">
            Hesabınıza giriş yapın
          </h2>
          <LoginForm />
        </div>

        <p className="text-center text-stone-600 text-xs mt-6">
          © {new Date().getFullYear()} Düğün Akademi
        </p>
      </div>
    </main>
  );
}
