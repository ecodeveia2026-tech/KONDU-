-- ==============================================================================
-- KONDU - DONNÉES INITIALES OFFICIELLES (SEEDS)
-- ==============================================================================

-- 1. TYPES DE SERVICES OFFICIELS
INSERT INTO public.service_types (code, name, description, icon, base_fare, per_km_rate, is_active)
VALUES 
    ('PASSENGER_TRANSPORT', 'Transport de Personnes (Moto & Taxi)', 'Courses individuelles et partagées dans Lomé et environs.', 'navigation', 300.00, 150.00, true),
    ('DELIVERY', 'Livraison & Colis Express', 'Acheminement rapide de colis, plis et commandes alimentaires.', 'package', 500.00, 200.00, true),
    ('GOODS_TRANSPORT', 'Transport de Marchandises', 'Véhicules utilitaires pour le transport d''équipements et marchandises.', 'truck', 2500.00, 400.00, true),
    ('MOVING', 'Déménagement & Gros Volume', 'Camionnettes et transporteurs pour les déménagements et gros volumes.', 'home', 10000.00, 800.00, true),
    ('PRIVATE_DRIVER', 'Chauffeur Privé & VIP', 'Service haut de gamme avec véhicules climatisés et chauffeurs dédiés.', 'shield-check', 3500.00, 500.00, true),
    ('COMMERCIAL_TRANSPORT', 'Transport Commercial B2B', 'Solutions dédiées aux entreprises et commerces partenaires.', 'briefcase', 5000.00, 450.00, true),
    ('ERRAND', 'Courses & Commissions', 'Délégation d''achats et formalités rapides en ville.', 'shopping-bag', 400.00, 150.00, true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    base_fare = EXCLUDED.base_fare,
    per_km_rate = EXCLUDED.per_km_rate;


-- 2. FORFAITS D'ABONNEMENT OFFICIELS KONDU
INSERT INTO public.subscription_plans (code, name, description, price_cfa, duration_days, is_vip, features, is_active)
VALUES 
    ('daily_200', 'Pass 24H Essentiel', 'Accès illimité aux courses pendant 24 heures. 0% de commission.', 500.00, 1, false, 
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
    features = EXCLUDED.features;


-- 3. PARAMÈTRES SYSTÈME INITIAUX
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('commission_rate', '{"percentage": 0}'::jsonb, 'Pourcentage de commission prélevé sur les courses (0% au lancement)'),
    ('gps_freshness_minutes', '{"minutes": 20}'::jsonb, 'Fraîcheur maximale de position GPS pour être éligible au matching'),
    ('official_contact', '{"whatsapp": "+228 93919212", "phone": "+228 99255231", "email": "kondutogo@mail.com", "city": "Lomé", "country": "Togo"}'::jsonb, 'Coordonnées officielles KONDU Togo')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description;
