-- ============================================================
-- Düğün Akademi — Supabase Migration
-- Supabase SQL Editor'da çalıştır
-- ============================================================

-- ── 1. PROFILES (Supabase Auth users'ı extend eder) ─────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       TEXT         NOT NULL DEFAULT '',
    role            TEXT         NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    monthly_target  NUMERIC(12,2) NOT NULL DEFAULT 0,
    current_sales   NUMERIC(12,2) NOT NULL DEFAULT 0,
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 2. DAILY_LOGS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    log_content     TEXT         NOT NULL,
    activity_type   TEXT         NOT NULL CHECK (activity_type IN ('visit','call','email','meeting','demo','other')),
    log_date        DATE         NOT NULL,
    log_time        TIME         NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    -- updated_at kasıtlı YOK — immutability
);

-- ── 3. SALES_DICTIONARY ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sales_dictionary (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    term_name   TEXT         NOT NULL UNIQUE,
    description TEXT         NOT NULL,
    category    TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 4. KNOWLEDGE_BASE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title        TEXT         NOT NULL,
    content      TEXT         NOT NULL,
    category     TEXT         NOT NULL,
    is_published BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 5. ANNOUNCEMENTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT         NOT NULL,
    body        TEXT,
    type        TEXT         NOT NULL DEFAULT 'announcement'
                    CHECK (type IN ('announcement','quote_of_day','alert')),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date      ON public.daily_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_kb_category          ON public.knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_dict_term            ON public.sales_dictionary(term_name);

-- ── IMMUTABILITY TRIGGER ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.prevent_log_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Günlük kayıtları değiştirilemez.';
END;
$$;

DROP TRIGGER IF EXISTS trg_logs_immutable ON public.daily_logs;
CREATE TRIGGER trg_logs_immutable
    BEFORE UPDATE OR DELETE ON public.daily_logs
    FOR EACH ROW EXECUTE FUNCTION public.prevent_log_update();

-- ── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements  ENABLE ROW LEVEL SECURITY;

-- Profiles: herkes kendi profilini okuyabilir; admin hepsini okur
CREATE POLICY "profiles_self_read" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_admin_read" ON public.profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "profiles_self_update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_admin_update" ON public.profiles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Daily logs: personel kendi kayıtlarını ekler/okur; admin hepsini okur
CREATE POLICY "logs_insert_own" ON public.daily_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "logs_select_own" ON public.daily_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "logs_admin_select" ON public.daily_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
-- UPDATE ve DELETE yok — trigger + RLS çift katman immutability

-- Dictionary & Library: tüm oturum açmış kullanıcılar okuyabilir
CREATE POLICY "dict_authenticated_read" ON public.sales_dictionary
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "kb_authenticated_read" ON public.knowledge_base
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_published = TRUE);

-- Announcements: tüm kullanıcılar aktif olanları okur
CREATE POLICY "announcements_read" ON public.announcements
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);

-- ── SEED DATA ────────────────────────────────────────────────
-- NOT: Kullanıcıları Supabase Auth'dan oluştur, profilleri otomatik yaratılır.
-- Ardından aşağıdaki sözlük ve duyuruları ekle:

INSERT INTO public.sales_dictionary (term_name, description, category) VALUES
    ('BANT',        'Budget, Authority, Need, Timeline — nitelikli müşteri belirleme çerçevesi.', 'Metodoloji'),
    ('Churn Rate',  'Belirli bir dönemde kaybedilen müşteri oranı.', 'Metrik'),
    ('CAC',         'Customer Acquisition Cost — bir müşteriyi kazanmanın toplam maliyeti.', 'Metrik'),
    ('Pipeline',    'Satış hunisindeki aktif fırsatların toplam değeri ve görünürlüğü.', 'Kavram'),
    ('Upsell',      'Müşteriye mevcut ürünün daha gelişmiş sürümünü satma stratejisi.', 'Strateji'),
    ('SPIN Selling','Situation, Problem, Implication, Need-Payoff — sorgulamaya dayalı satış tekniği.', 'Metodoloji'),
    ('NPS',         'Net Promoter Score — müşteri memnuniyeti ve sadakatini ölçen metrik.', 'Metrik')
ON CONFLICT (term_name) DO NOTHING;

INSERT INTO public.knowledge_base (title, content, category) VALUES
    ('Etkili Soğuk Arama Teknikleri',
     E'İlk 10 saniyede değer önerisini netleştir.\n\nKendini ve şirketini tanıt, ardından neden aradığını tek cümleyle ifade et. İzin iste: "2 dakikanız var mı?"\n\nSes tonunu enerjik ama doğal tut. Gülümseyerek konuşmak ses tonuna yansır.',
     'Teknik'),
    ('İtiraz Yönetimi Rehberi',
     E'En sık karşılaşılan 7 itiraz ve yanıtları:\n\n1. "Pahalı" → Değeri somutlaştır, ROI hesapla\n2. "Şu an değil" → Ertelemenin maliyetini göster\n3. "Zaten başka biriyle çalışıyoruz" → Fark yaratan özelliği vurgula\n4. "Düşüneceğim" → Karar engelini bul\n5. "Bütçemiz yok" → Esnek ödeme seçeneklerini sun\n6. "Üst yönetime danışmam lazım" → Bir sonraki adımı netleştir\n7. "Güvenmiyorum" → Referans ve vaka çalışması paylaş',
     'Rehber'),
    ('Düğün Sektöründe Müşteri Psikolojisi',
     E'Gelin adayları ve damatlar yüksek duygusal yatırım içindedir. Karar süreci:\n\n• Hayal → İlham → Araştırma → Karşılaştırma → Karar\n\nEmpati kur: "Hayalinizdeki düğün nasıl?" sorusuyla başla.\nUrgency yarat: "Tarihiniz çok popüler, {ay} için sadece 2 slotumuz kaldı."\nSosyal kanıt kullan: Fotoğraflar, yorumlar, referanslar.',
     'Strateji')
ON CONFLICT DO NOTHING;

INSERT INTO public.announcements (title, body, type, is_active) VALUES
    ('Portala Hoş Geldiniz! 🎉',
     'Düğün Akademi Satış Portalı artık aktif. Günlük kayıtlarınızı düzenli tutmayı unutmayın.',
     'announcement', TRUE),
    ('"Başarı şansa değil, hazırlığa inanır."',
     '— Lucius Annaeus Seneca',
     'quote_of_day', TRUE)
ON CONFLICT DO NOTHING;
