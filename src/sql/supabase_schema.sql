-- ==============================================================================
-- KONDU - SCHÉMA OFFICIEL POSTGRESQL & POLITIQUES DE SÉCURITÉ RLS SUPABASE
-- Plateforme de Mobilité, Mise en relation & Services
-- ==============================================================================

-- 1. EXTENSIONS NÉCESSAIRES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('CLIENT', 'PROVIDER', 'BUSINESS', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_type AS ENUM ('moto', 'taxi', 'tricycle', 'vip', 'moving', 'delivery');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('pending', 'active', 'expired', 'suspended', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('created', 'searching', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. TABLES PRINCIPALES
-- ==============================================================================

-- Table des profils utilisateurs généraux liés à auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    role user_role NOT NULL DEFAULT 'CLIENT',
    avatar_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des profils professionnels / Prestataires (KONDU PRO)
CREATE TABLE IF NOT EXISTS public.provider_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    service_type service_type NOT NULL DEFAULT 'moto',
    vehicle_brand TEXT,
    vehicle_model TEXT,
    vehicle_plate TEXT,
    vehicle_year INT,
    vehicle_color TEXT,
    vehicle_photo_url TEXT,
    identity_card_url TEXT,
    driving_license_url TEXT,
    is_online BOOLEAN NOT NULL DEFAULT false,
    is_available BOOLEAN NOT NULL DEFAULT true,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    location_accuracy DOUBLE PRECISION,
    location_updated_at TIMESTAMPTZ,
    subscription_status subscription_status NOT NULL DEFAULT 'pending',
    is_vip BOOLEAN NOT NULL DEFAULT false,
    vip_expires_at TIMESTAMPTZ,
    rating_avg NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    total_ratings INT NOT NULL DEFAULT 0,
    wallet_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des profils entreprises (KONDU BUSINESS)
CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    registration_number TEXT,
    business_type TEXT,
    address TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des forfaits d'abonnement (Configurable par l'Admin)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    price_cfa NUMERIC(10, 2) NOT NULL,
    duration_days INT NOT NULL,
    is_vip BOOLEAN NOT NULL DEFAULT false,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des abonnements souscrits
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status subscription_status NOT NULL DEFAULT 'active',
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XOF',
    payment_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XOF',
    provider TEXT NOT NULL, -- 'moov', 'mtn', 'fedapay', 'cinetpay', 'manual'
    transaction_ref TEXT NOT NULL UNIQUE,
    status payment_status NOT NULL DEFAULT 'pending',
    idempotency_key TEXT UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des événements de webhook de paiement (Idempotence)
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des commandes / courses / transports
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    service_type service_type NOT NULL,
    status order_status NOT NULL DEFAULT 'created',
    pickup_address TEXT NOT NULL,
    pickup_lat DOUBLE PRECISION NOT NULL,
    pickup_lng DOUBLE PRECISION NOT NULL,
    dropoff_address TEXT NOT NULL,
    dropoff_lat DOUBLE PRECISION NOT NULL,
    dropoff_lng DOUBLE PRECISION NOT NULL,
    estimated_distance_km NUMERIC(6, 2),
    estimated_price NUMERIC(10, 2) NOT NULL,
    final_price NUMERIC(10, 2),
    currency TEXT NOT NULL DEFAULT 'XOF',
    notes TEXT,
    cancelled_by UUID REFERENCES public.profiles(user_id),
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Historique des changements de statut d'une commande
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status order_status NOT NULL,
    changed_by UUID REFERENCES public.profiles(user_id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages de messagerie en temps réel
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Avis et évaluations post-course
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tickets de support client / prestataire
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL,
    status ticket_status NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'normal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_staff BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications utilisateurs
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'order', 'subscription', 'payment', 'system'
    is_read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configuration système globale
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Journal d'audit d'administration
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(user_id),
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. INDEX DE HAUTE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_service ON public.provider_profiles(service_type);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_online_avail ON public.provider_profiles(is_online, is_available, subscription_status);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_coords ON public.provider_profiles(current_lat, current_lng);
CREATE INDEX IF NOT EXISTS idx_orders_client ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_provider ON public.orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_messages_order ON public.messages(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);

-- ==============================================================================
-- 5. FONCTIONS MÉTIER & DÉCLENCHEURS (TRIGGERS)
-- ==============================================================================

-- A. Déclencheur de création automatique de profil après inscription Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role public.user_role;
    v_full_name TEXT;
    v_phone TEXT;
    v_service_type public.service_type;
BEGIN
    -- Récupération des métadonnées envoyées lors du signUp
    v_role := COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'CLIENT'::public.user_role);
    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    v_phone := new.raw_user_meta_data->>'phone';
    
    -- Insertion dans profiles
    INSERT INTO public.profiles (user_id, email, full_name, phone, role)
    VALUES (new.id, new.email, v_full_name, v_phone, v_role)
    ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;

    -- Création conditionnelle du profil spécialisé
    IF v_role = 'PROVIDER' THEN
        v_service_type := COALESCE((new.raw_user_meta_data->>'service_type')::public.service_type, 'moto'::public.service_type);
        INSERT INTO public.provider_profiles (
            user_id,
            service_type,
            vehicle_brand,
            vehicle_model,
            vehicle_plate
        ) VALUES (
            new.id,
            v_service_type,
            new.raw_user_meta_data->>'vehicle_brand',
            new.raw_user_meta_data->>'vehicle_model',
            new.raw_user_meta_data->>'vehicle_plate'
        ) ON CONFLICT (user_id) DO NOTHING;
    ELSIF v_role = 'BUSINESS' THEN
        INSERT INTO public.business_profiles (
            user_id,
            company_name,
            registration_number,
            business_type
        ) VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'company_name', v_full_name),
            new.raw_user_meta_data->>'registration_number',
            new.raw_user_meta_data->>'business_type'
        ) ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Déclencheur sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- B. Fonction atomique d'acceptation de course (Prévient la concurrence entre 2 chauffeurs)
CREATE OR REPLACE FUNCTION public.accept_order_atomically(
    p_order_id UUID,
    p_provider_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_order public.orders%ROWTYPE;
    v_provider public.provider_profiles%ROWTYPE;
BEGIN
    -- 1. Vérifier le statut de l'abonnement du prestataire
    SELECT * INTO v_provider
    FROM public.provider_profiles
    WHERE user_id = p_provider_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Profil prestataire introuvable.');
    END IF;

    IF v_provider.subscription_status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Votre abonnement est inactif. Veuillez renouveler votre forfait.');
    END IF;

    -- 2. Verrouillage exclusif de la commande avec FOR UPDATE
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Commande inexistante.');
    END IF;

    IF v_order.status != 'searching' AND v_order.status != 'created' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cette commande a déjà été acceptée par un autre chauffeur.');
    END IF;

    -- 3. Mise à jour de la commande
    UPDATE public.orders
    SET provider_id = p_provider_id,
        status = 'accepted',
        accepted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id;

    -- 4. Marquer le chauffeur comme non disponible pour d'autres commandes immédiates
    UPDATE public.provider_profiles
    SET is_available = false,
        updated_at = NOW()
    WHERE user_id = p_provider_id;

    -- 5. Enregistrer l'historique
    INSERT INTO public.order_status_history (order_id, status, changed_by, notes)
    VALUES (p_order_id, 'accepted', p_provider_id, 'Commande acceptée par le chauffeur');

    -- 6. Notifier le client
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
        v_order.client_id,
        'Chauffeur en route !',
        'Un chauffeur a accepté votre demande et arrive vers vous.',
        'order',
        '/dashboard/client'
    );

    RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- C. Calcul de distance Haversine en kilomètres
CREATE OR REPLACE FUNCTION public.haversine_distance(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    r DOUBLE PRECISION := 6371; -- Rayon moyen de la terre en km
    dlat DOUBLE PRECISION;
    dlon DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
BEGIN
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    a := sin(dlat / 2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)^2;
    c := 2 * asin(sqrt(a));
    RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- D. Recherche de chauffeurs disponibles avec fraîcheur GPS et priorité VIP
CREATE OR REPLACE FUNCTION public.get_nearby_available_providers(
    p_service_type public.service_type,
    p_client_lat DOUBLE PRECISION,
    p_client_lng DOUBLE PRECISION,
    p_max_radius_km DOUBLE PRECISION DEFAULT 15.0,
    p_max_age_minutes INT DEFAULT 20
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    phone TEXT,
    whatsapp TEXT,
    avatar_url TEXT,
    service_type public.service_type,
    vehicle_brand TEXT,
    vehicle_model TEXT,
    vehicle_plate TEXT,
    is_vip BOOLEAN,
    rating_avg NUMERIC(3, 2),
    total_ratings INT,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    distance_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.user_id,
        pr.full_name,
        pr.phone,
        pr.whatsapp,
        pr.avatar_url,
        p.service_type,
        p.vehicle_brand,
        p.vehicle_model,
        p.vehicle_plate,
        p.is_vip,
        p.rating_avg,
        p.total_ratings,
        p.current_lat,
        p.current_lng,
        ROUND(public.haversine_distance(p_client_lat, p_client_lng, p_current_lat, p.current_lng)::numeric, 2)::DOUBLE PRECISION AS distance_km
    FROM public.provider_profiles p
    JOIN public.profiles pr ON pr.user_id = p.user_id
    WHERE p.service_type = p_service_type
      AND p.is_online = true
      AND p.is_available = true
      AND p.subscription_status = 'active'
      AND p.current_lat IS NOT NULL
      AND p.current_lng IS NOT NULL
      AND p.location_updated_at >= (NOW() - (p_max_age_minutes || ' minutes')::INTERVAL)
      AND public.haversine_distance(p_client_lat, p_client_lng, p.current_lat, p.current_lng) <= p_max_radius_km
    ORDER BY 
        p.is_vip DESC, -- Priorité VIP
        distance_km ASC; -- Proximité
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================================
-- 6. POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Activation RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper pour vérifier si l'utilisateur courant est ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- PROFILES ---
CREATE POLICY "Lecture profil public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Modification propre profil" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin gestion profils" ON public.profiles FOR ALL USING (public.is_admin());

-- --- PROVIDER_PROFILES ---
CREATE POLICY "Lecture providers actifs" ON public.provider_profiles FOR SELECT USING (true);
CREATE POLICY "Modification propre provider" ON public.provider_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin gestion providers" ON public.provider_profiles FOR ALL USING (public.is_admin());

-- --- BUSINESS_PROFILES ---
CREATE POLICY "Lecture propre business" ON public.business_profiles FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Modification propre business" ON public.business_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin gestion business" ON public.business_profiles FOR ALL USING (public.is_admin());

-- --- SUBSCRIPTION_PLANS ---
CREATE POLICY "Lecture plans publique" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "Admin modification plans" ON public.subscription_plans FOR ALL USING (public.is_admin());

-- --- SUBSCRIPTIONS ---
CREATE POLICY "Lecture propre abonnement" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Création abonnement utilisateur" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admin gestion abonnements" ON public.subscriptions FOR ALL USING (public.is_admin());

-- --- PAYMENTS ---
CREATE POLICY "Lecture propre paiement" ON public.payments FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Création paiement" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admin gestion paiements" ON public.payments FOR ALL USING (public.is_admin());

-- --- ORDERS ---
CREATE POLICY "Lecture commande par participant" ON public.orders FOR SELECT 
USING (auth.uid() = client_id OR auth.uid() = provider_id OR (status = 'searching' AND EXISTS (SELECT 1 FROM public.provider_profiles WHERE user_id = auth.uid() AND subscription_status = 'active')) OR public.is_admin());

CREATE POLICY "Création commande client" ON public.orders FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Mise a jour commande participant" ON public.orders FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = provider_id OR public.is_admin());

-- --- MESSAGES ---
CREATE POLICY "Lecture messages participants" ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());
CREATE POLICY "Envoi message participant" ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- --- NOTIFICATIONS ---
CREATE POLICY "Lecture notifications propres" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Mise a jour notifications propres" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- --- SETTINGS & AUDIT ---
CREATE POLICY "Lecture parametres" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Admin gestion parametres" ON public.system_settings FOR ALL USING (public.is_admin());
CREATE POLICY "Admin audit logs" ON public.admin_audit_logs FOR ALL USING (public.is_admin());

-- ==============================================================================
-- 7. DONNÉES INITIALES (SEED DE DÉMARRAGE)
-- ==============================================================================

-- Forfaits d'abonnements officiels KONDU
INSERT INTO public.subscription_plans (code, name, description, price_cfa, duration_days, is_vip, features)
VALUES 
    ('daily_200', 'Pass 24H Essentiel', 'Accès illimité aux courses pendant 24 heures. 0% de commission.', 500, 1, false, '["Courses illimitées pendant 24h", "0% commission KONDU", "GPS en temps réel", "Support standard Lomé"]'::jsonb),
    ('daily_300', 'Pass 24H Confort', 'Accès 24H avec visibilité prioritaire et alertes instantanées.', 1000, 1, false, '["Courses illimitées pendant 24h", "0% commission", "Visibilité prioritaire passagers", "Support prioritaire"]'::jsonb),
    ('weekly', 'Pass Hebdomadaire (7 Jours)', 'Formule 7 jours ultra-rentable pour chauffeurs réguliers.', 2500, 7, false, '["Validité 7 jours entiers", "0% commission sur toutes les courses", "Statut Chauffeur Vérifié", "Économique : ~357 F/jour"]'::jsonb),
    ('monthly', 'Pass Mensuel Pro (30 Jours)', 'Formule mensuelle pour une sérénité totale des chauffeurs professionnels.', 8000, 30, false, '["Validité 30 jours complets", "0% commission", "Badge Chauffeur Pro", "Assistance dédiée 7j/7"]'::jsonb),
    ('vip_monthly', 'KONDU VIP (30 Jours)', 'Statut prestige n°1 : Priorité absolue de matching et badge KONDU VIP doré.', 15000, 30, true, '["Priorité n°1 dans le matching", "Badge exclusif KONDU VIP Doré", "Visibilité maximale sur la carte", "Support dédié WhatsApp 24/7"]'::jsonb)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_cfa = EXCLUDED.price_cfa,
    features = EXCLUDED.features;

-- Paramètres système par défaut
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('commission_rate', '{"percentage": 0}'::jsonb, 'Pourcentage de commission KONDU prélevé sur les courses (0% au lancement)'),
    ('gps_freshness_minutes', '{"minutes": 20}'::jsonb, 'Délai maximal de fraîcheur GPS pour qu''un chauffeur soit éligible au matching'),
    ('base_fares', '{"moto": 300, "taxi": 1000, "tricycle": 500, "vip": 2500, "moving": 10000}'::jsonb, 'Tarifs de base indicatifs en F CFA')
ON CONFLICT (key) DO NOTHING;
