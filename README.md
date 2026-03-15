# 🎯 Düğün Akademi — Next.js 14 Kurulum & Deploy Rehberi

## 📐 Mimari

```
dugunakademi.com  (Vercel — Next.js 14 App Router)
│
├── /login              ← Supabase Auth login
├── /dashboard          ← KPI + Progress + Duyurular
├── /logs               ← Satış günlüğü (immutable)
├── /library            ← Sözlük + Makaleler
└── /admin              ← Admin paneli (rol korumalı)
        │
        ▼
   Supabase
   ├── Auth (kullanıcı yönetimi)
   ├── profiles          (hedef / satış / rol)
   ├── daily_logs        (immutable trigger)
   ├── sales_dictionary
   ├── knowledge_base
   └── announcements
```

---

## 📁 Dosya Yapısı

```
dugunakademi/
├── .env.local.example       ← Env şablonu
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── supabase/
│   └── migration.sql        ← Supabase SQL Editor'da çalıştır
│
└── src/
    ├── middleware.ts         ← Auth koruma + admin guard
    ├── types/index.ts        ← TypeScript type tanımları
    │
    ├── lib/
    │   └── supabase/
    │       ├── client.ts     ← Browser client
    │       └── server.ts     ← Server Component client
    │
    ├── app/
    │   ├── layout.tsx        ← Root layout (Playfair Display + DM Sans)
    │   ├── globals.css       ← Tailwind + custom utilities
    │   ├── page.tsx          ← / → /dashboard redirect
    │   ├── login/page.tsx    ← Login sayfası
    │   ├── dashboard/
    │   │   ├── layout.tsx    ← App shell (sidebar + topbar)
    │   │   └── page.tsx      ← Dashboard
    │   ├── logs/
    │   │   ├── layout.tsx
    │   │   └── page.tsx      ← Satış günlüğü
    │   ├── library/
    │   │   ├── layout.tsx
    │   │   └── page.tsx      ← Kütüphane
    │   └── admin/
    │       ├── layout.tsx
    │       └── page.tsx      ← Admin paneli
    │
    └── components/
        ├── layout/
        │   ├── Sidebar.tsx
        │   └── TopBar.tsx
        └── ui/
            ├── LoginForm.tsx
            ├── StatCard.tsx
            ├── ProgressCard.tsx
            ├── AnnouncementsWidget.tsx
            ├── LogForm.tsx
            ├── LogList.tsx
            ├── LibraryClient.tsx
            └── AdminClient.tsx
```

---

## ADIM 1 — Supabase Kurulumu

### 1.1 Tabloları oluştur
1. Supabase dashboard → **SQL Editor** → **New Query**
2. `supabase/migration.sql` içeriğini yapıştır → **Run**

### 1.2 Kullanıcı oluştur
Supabase → **Authentication** → **Users** → **Add User**:
- E-posta: `admin@dugunakademi.com`
- Şifre: Güçlü bir şifre belirle
- `Email Confirm` → manuel confirm et

### 1.3 Admin rolü ata
SQL Editor'da:
```sql
UPDATE public.profiles
SET role = 'admin', full_name = 'Admin Adı'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@dugunakademi.com');
```

### 1.4 API Key'leri al
Supabase → **Settings** → **API**:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ADIM 2 — Lokal Geliştirme

```bash
# Bağımlılıkları yükle
npm install

# Env dosyasını oluştur
cp .env.local.example .env.local
# .env.local'i düzenle: Supabase URL ve anon key'i gir

# Geliştirme sunucusunu başlat
npm run dev
# → http://localhost:3000
```

---

## ADIM 3 — Vercel Deploy

### 3.1 GitHub'a push et
```bash
git init
git add .
git commit -m "feat: Düğün Akademi portalı"
git remote add origin https://github.com/KULLANICIN/dugunakademi.git
git push -u origin main
```

### 3.2 Vercel'e import et
1. [vercel.com](https://vercel.com) → **Add New Project**
2. GitHub repo'yu seç → **Import**
3. **Framework**: Next.js (otomatik algılanır)
4. **Root Directory**: `./` (değiştirme)
5. Environment Variables ekle:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |

6. **Deploy** →  ilk deploy ~2 dakika sürer

---

## ADIM 4 — GoDaddy DNS (dugunakademi.com)

### Vercel'de domain ekle
Vercel → Project → **Settings** → **Domains** → `dugunakademi.com` + `www.dugunakademi.com`

### GoDaddy DNS kayıtları
GoDaddy → My Products → dugunakademi.com → **DNS** → **Manage**:

| Type  | Name | Value                    | TTL |
|-------|------|--------------------------|-----|
| A     | @    | `76.76.21.21`            | 600 |
| CNAME | www  | `cname.vercel-dns.com`   | 600 |

> ⏱️ DNS yayılması: 5 dk — 48 saat (genellikle 30 dk)

Vercel SSL sertifikasını otomatik yükler.

---

## 🔒 Güvenlik Özellikleri

| Katman | Çözüm |
|--------|-------|
| Kimlik doğrulama | Supabase Auth (JWT tabanlı) |
| Route koruması | `middleware.ts` (server-side) |
| Admin koruması | middleware + page seviyesinde çift kontrol |
| Günlük immutability | DB trigger (UPDATE+DELETE engeli) + RLS (no policy) |
| Veri izolasyonu | RLS: personel yalnızca kendi loglarını görür |
| Cookie | Supabase SSR — httpOnly, Secure (prod'da) |

---

## 🎨 Tasarım Sistemi

- **Tema**: Koyu lüks (dark luxury)
- **Font Display**: Playfair Display (serif)
- **Font Body**: DM Sans (sans-serif)
- **Ana Renk**: Bronz/kırmızı (`brand-500: #e25a1a`)
- **Yüzey**: Sıcak siyah (`surface: #0f0d0b`)
- **Animasyonlar**: Staggered fade-up, progress bar cubic-bezier

---

## ❓ Sık Karşılaşılan Sorunlar

**Login sonrası yönlendirme çalışmıyor**
→ `middleware.ts` root'ta (`src/middleware.ts`) olmalı, `src/app/` altında değil.

**Admin paneli görünmüyor**
→ `profiles` tablosunda `role = 'admin'` güncellendi mi kontrol et.

**RLS hatası / veri gelmiyor**
→ SQL Editor'da `SELECT * FROM profiles WHERE id = auth.uid();` çalıştır. RLS politikaları eksiksiz mi kontrol et.

**Vercel build hatası**
→ Environment Variables eksik olabilir. `NEXT_PUBLIC_` prefix zorunlu.
