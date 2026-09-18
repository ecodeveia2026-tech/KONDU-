-- ==============================================================================
-- KONDU TOGO — MISE À JOUR OFFICIELLE DES PLANS D'ABONNEMENT CHAUFFEURS & VIP
-- Exécutable dans le SQL Editor Supabase
-- ==============================================================================

-- 1. Mise à jour des tarifs et descriptifs des plans existants
UPDATE public.subscription_plans
SET 
    name = 'Pass 24H Essentiel',
    description = 'Accès Chauffeur Pro actif 24h avec courses illimitées. 0% de commission.',
    price_cfa = 500.00,
    duration_days = 1,
    is_vip = false,
    features = '["Courses illimitées pendant 24h", "0% commission KONDU", "GPS en temps réel", "Support standard Lomé"]'::jsonb,
    is_active = true,
    updated_at = NOW()
WHERE code = 'daily_200' OR name ILIKE '%24H Essentiel%';

UPDATE public.subscription_plans
SET 
    name = 'Pass 24H Confort',
    description = 'Accès 24H avec visibilité prioritaire et alertes sonores instantanées.',
    price_cfa = 1000.00,
    duration_days = 1,
    is_vip = false,
    features = '["Courses illimitées pendant 24h", "0% commission", "Visibilité prioritaire passagers", "Support prioritaire"]'::jsonb,
    is_active = true,
    updated_at = NOW()
WHERE code = 'daily_300' OR name ILIKE '%24H Confort%';

UPDATE public.subscription_plans
SET 
    name = 'Pass Hebdomadaire (7 Jours)',
    description = 'Formule 7 jours ultra-rentable pour chauffeurs actifs et réguliers.',
    price_cfa = 2500.00,
    duration_days = 7,
    is_vip = false,
    features = '["Validité 7 jours entiers", "0% commission sur toutes les courses", "Statut Chauffeur Vérifié", "Économique : ~357 F/jour"]'::jsonb,
    is_active = true,
    updated_at = NOW()
WHERE code = 'weekly' OR name ILIKE '%Hebdomadaire%';

UPDATE public.subscription_plans
SET 
    name = 'Pass Mensuel Pro (30 Jours)',
    description = 'Formule mensuelle pour une sérénité totale des chauffeurs professionnels.',
    price_cfa = 8000.00,
    duration_days = 30,
    is_vip = false,
    features = '["Validité 30 jours complets", "0% commission", "Badge Chauffeur Pro", "Assistance dédiée 7j/7"]'::jsonb,
    is_active = true,
    updated_at = NOW()
WHERE (code = 'monthly' OR name ILIKE '%Mensuel%') AND is_vip = false;

UPDATE public.subscription_plans
SET 
    name = 'KONDU VIP (30 Jours)',
    description = 'Statut prestige n°1 : Priorité absolue de matching et badge KONDU VIP doré.',
    price_cfa = 15000.00,
    duration_days = 30,
    is_vip = true,
    features = '["Priorité n°1 dans le matching", "Badge exclusif KONDU VIP Doré", "Visibilité maximale sur la carte", "Support dédié WhatsApp 24/7"]'::jsonb,
    is_active = true,
    updated_at = NOW()
WHERE code = 'vip_monthly' OR is_vip = true OR name ILIKE '%VIP%';

-- 2. Insertion de sécurité avec ON CONFLICT pour garantir la présence des 5 plans
INSERT INTO public.subscription_plans (code, name, description, price_cfa, duration_days, is_vip, features, is_active)
VALUES 
    ('daily_200', 'Pass 24H Essentiel', 'Accès Chauffeur Pro actif 24h avec courses illimitées. 0% de commission.', 500.00, 1, false, 
     '["Courses illimitées pendant 24h", "0% commission KONDU", "GPS en temps réel", "Support standard Lomé"]'::jsonb, true),
     
    ('daily_300', 'Pass 24H Confort', 'Accès 24H avec visibilité prioritaire et alertes sonores instantanées.', 1000.00, 1, false, 
     '["Courses illimitées pendant 24h", "0% commission", "Visibilité prioritaire passagers", "Support prioritaire"]'::jsonb, true),
     
    ('weekly', 'Pass Hebdomadaire (7 Jours)', 'Formule 7 jours ultra-rentable pour chauffeurs actifs et réguliers.', 2500.00, 7, false, 
     '["Validité 7 jours entiers", "0% commission sur toutes les courses", "Statut Chauffeur Vérifié", "Économique : ~357 F/jour"]'::jsonb, true),
     
    ('monthly', 'Pass Mensuel Pro (30 Jours)', 'Formule mensuelle pour une sérénité totale des chauffeurs professionnels.', 8000.00, 30, false, 
     '["Validité 30 jours complets", "0% commission", "Badge Chauffeur Pro", "Assistance dédiée 7j/7"]'::jsonb, true),
     
    ('vip_monthly', 'KONDU VIP (30 Jours)', 'Statut prestige n°1 : Priorité absolue de matching et badge KONDU VIP doré.', 15000.00, 30, true, 
     '["Priorité n°1 dans le matching", "Badge exclusif KONDU VIP Doré", "Visibilité maximale sur la carte", "Support dédié WhatsApp 24/7"]'::jsonb, true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_cfa = EXCLUDED.price_cfa,
    features = EXCLUDED.features,
    is_vip = EXCLUDED.is_vip,
    is_active = true,
    updated_at = NOW();
