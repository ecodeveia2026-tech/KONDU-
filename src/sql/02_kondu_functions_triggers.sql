-- ==============================================================================
-- KONDU - FONCTIONS POSTGRESQL & DÉCLENCHEURS AUTOMATIQUES
-- ==============================================================================

-- A. Fonction sécurisée pour vérifier si l'utilisateur courant est un Administrateur
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- B. Déclencheur automatique de création de profil après inscription Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role public.user_role;
    v_full_name TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
    v_phone TEXT;
    v_service_type public.service_type;
    v_provider_type public.provider_type;
BEGIN
    -- Récupération du rôle
    BEGIN
        v_role := COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'CLIENT'::public.user_role);
    EXCEPTION WHEN OTHERS THEN
        v_role := 'CLIENT'::public.user_role;
    END;

    -- Récupération des informations de contact
    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    v_first_name := split_part(v_full_name, ' ', 1);
    v_last_name := NULLIF(substring(v_full_name from length(v_first_name) + 2), '');
    v_phone := COALESCE(new.raw_user_meta_data->>'phone', new.phone);

    -- 1. Insertion dans public.profiles
    INSERT INTO public.profiles (
        user_id,
        email,
        full_name,
        first_name,
        last_name,
        phone,
        whatsapp,
        role,
        photo_url,
        avatar_url,
        status,
        is_verified
    ) VALUES (
        new.id,
        new.email,
        v_full_name,
        v_first_name,
        v_last_name,
        v_phone,
        COALESCE(new.raw_user_meta_data->>'whatsapp', v_phone),
        v_role,
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'avatar_url',
        'ACTIVE',
        CASE WHEN v_role = 'ADMIN' THEN true ELSE false END
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = NOW();

    -- 2. Création conditionnelle du profil spécialisé
    IF v_role = 'PROVIDER' THEN
        BEGIN
            v_service_type := COALESCE((new.raw_user_meta_data->>'service_type')::public.service_type, 'moto'::public.service_type);
        EXCEPTION WHEN OTHERS THEN
            v_service_type := 'moto'::public.service_type;
        END;

        BEGIN
            v_provider_type := COALESCE((new.raw_user_meta_data->>'provider_type')::public.provider_type, 'TAXI_MOTO'::public.provider_type);
        EXCEPTION WHEN OTHERS THEN
            v_provider_type := 'TAXI_MOTO'::public.provider_type;
        END;

        INSERT INTO public.provider_profiles (
            user_id,
            service_type,
            provider_type,
            vehicle_brand,
            vehicle_model,
            vehicle_plate,
            whatsapp_number,
            subscription_status,
            is_online,
            is_available
        ) VALUES (
            new.id,
            v_service_type,
            v_provider_type,
            new.raw_user_meta_data->>'vehicle_brand',
            COALESCE(new.raw_user_meta_data->>'vehicle_model', 'Standard'),
            new.raw_user_meta_data->>'vehicle_plate',
            COALESCE(new.raw_user_meta_data->>'whatsapp', v_phone),
            'PENDING',
            false,
            true
        ) ON CONFLICT (user_id) DO NOTHING;

    ELSIF v_role = 'BUSINESS' THEN
        INSERT INTO public.business_profiles (
            user_id,
            business_name,
            company_name,
            registration_number,
            business_type,
            phone,
            whatsapp,
            contact_email,
            status
        ) VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'company_name', new.raw_user_meta_data->>'business_name', v_full_name),
            COALESCE(new.raw_user_meta_data->>'company_name', new.raw_user_meta_data->>'business_name', v_full_name),
            new.raw_user_meta_data->>'registration_number',
            COALESCE(new.raw_user_meta_data->>'business_type', 'COMMERCE'),
            v_phone,
            COALESCE(new.raw_user_meta_data->>'whatsapp', v_phone),
            new.email,
            'ACTIVE'
        ) ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- C. Calcul de distance Haversine en kilomètres
CREATE OR REPLACE FUNCTION public.haversine_distance(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    r DOUBLE PRECISION := 6371; -- Rayon terrestre en kilomètres
    dlat DOUBLE PRECISION;
    dlon DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN 99999.0;
    END IF;
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    a := sin(dlat / 2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)^2;
    c := 2 * asin(sqrt(a));
    RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- D. Fonction atomique d'acceptation de course (Concurrency-safe avec FOR UPDATE)
CREATE OR REPLACE FUNCTION public.accept_order_atomically(
    p_order_id UUID,
    p_provider_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_order public.orders%ROWTYPE;
    v_provider public.provider_profiles%ROWTYPE;
BEGIN
    -- 1. Vérification du prestataire
    SELECT * INTO v_provider
    FROM public.provider_profiles
    WHERE user_id = p_provider_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Profil prestataire introuvable.');
    END IF;

    -- 2. Verrouillage exclusif de la commande avec FOR UPDATE (empêche la concurrence)
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Commande inexistante.');
    END IF;

    IF v_order.status != 'SEARCHING' AND v_order.status != 'CREATED' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cette commande a déjà été attribuée à un autre chauffeur.');
    END IF;

    -- 3. Mise à jour atomique du statut
    UPDATE public.orders
    SET provider_id = p_provider_id,
        status = 'PROVIDER_ACCEPTED',
        accepted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id;

    -- 4. Marquer le chauffeur indisponible
    UPDATE public.provider_profiles
    SET is_available = false,
        updated_at = NOW()
    WHERE user_id = p_provider_id;

    -- 5. Enregistrement dans l'historique immuable
    INSERT INTO public.order_events (order_id, actor_user_id, event_type, previous_status, new_status, metadata)
    VALUES (
        p_order_id, 
        p_provider_id, 
        'PROVIDER_ACCEPTED', 
        v_order.status::text, 
        'PROVIDER_ACCEPTED', 
        jsonb_build_object('provider_id', p_provider_id, 'timestamp', NOW())
    );

    -- 6. Notification du client
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
        v_order.client_id,
        'Course acceptée !',
        'Un chauffeur a pris en charge votre demande et arrive vers vous.',
        'order',
        '/dashboard/client'
    );

    RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'status', 'PROVIDER_ACCEPTED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- E. Recherche de chauffeurs en temps réel avec coordonnées GPS réelles et priorité VIP
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
        pr.photo_url AS avatar_url,
        p.service_type,
        p.vehicle_brand,
        p.vehicle_model,
        p.vehicle_plate,
        p.is_vip,
        p.rating_avg,
        p.total_ratings,
        p.current_lat,
        p.current_lng,
        ROUND(public.haversine_distance(p_client_lat, p_client_lng, p.current_lat, p.current_lng)::numeric, 2)::DOUBLE PRECISION AS distance_km
    FROM public.provider_profiles p
    JOIN public.profiles pr ON pr.user_id = p.user_id
    WHERE p.service_type = p_service_type
      AND p.is_online = true
      AND p.is_available = true
      AND p.current_lat IS NOT NULL
      AND p.current_lng IS NOT NULL
      AND (p.location_updated_at IS NULL OR p.location_updated_at >= (NOW() - (p_max_age_minutes || ' minutes')::INTERVAL))
      AND public.haversine_distance(p_client_lat, p_client_lng, p.current_lat, p.current_lng) <= p_max_radius_km
    ORDER BY 
        p.is_vip DESC,
        distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- F. Déclencheur pour synchroniser automatiquement geom dans driver_locations
CREATE OR REPLACE FUNCTION public.sync_driver_location_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_driver_location_geom ON public.driver_locations;
CREATE TRIGGER trg_driver_location_geom
    BEFORE INSERT OR UPDATE OF latitude, longitude ON public.driver_locations
    FOR EACH ROW EXECUTE FUNCTION public.sync_driver_location_geom();
