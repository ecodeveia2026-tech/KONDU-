-- ==============================================================================
-- KONDU - POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- MODÈLE DENY BY DEFAULT AVEC CONTRÔLE D'ACCÈS PAR RÔLE ET PROPRIÉTÉ
-- ==============================================================================

-- 1. ACTIVATION DE LA RLS SUR L'ENSEMBLE DES 25 TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;


-- 2. POLITIQUES RLS SUR PROFILES
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

CREATE POLICY "profiles_select_public" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "profiles_admin_all" ON public.profiles
    FOR ALL USING (public.is_admin());


-- 3. POLITIQUES RLS SUR PROVIDER_PROFILES
DROP POLICY IF EXISTS "provider_profiles_select" ON public.provider_profiles;
DROP POLICY IF EXISTS "provider_profiles_insert" ON public.provider_profiles;
DROP POLICY IF EXISTS "provider_profiles_update" ON public.provider_profiles;
DROP POLICY IF EXISTS "provider_profiles_admin" ON public.provider_profiles;

CREATE POLICY "provider_profiles_select" ON public.provider_profiles
    FOR SELECT USING (true);

CREATE POLICY "provider_profiles_insert" ON public.provider_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "provider_profiles_update" ON public.provider_profiles
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "provider_profiles_admin" ON public.provider_profiles
    FOR ALL USING (public.is_admin());


-- 4. POLITIQUES RLS SUR BUSINESS_PROFILES
DROP POLICY IF EXISTS "business_profiles_select" ON public.business_profiles;
DROP POLICY IF EXISTS "business_profiles_insert" ON public.business_profiles;
DROP POLICY IF EXISTS "business_profiles_update" ON public.business_profiles;
DROP POLICY IF EXISTS "business_profiles_admin" ON public.business_profiles;

CREATE POLICY "business_profiles_select" ON public.business_profiles
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "business_profiles_insert" ON public.business_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "business_profiles_update" ON public.business_profiles
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "business_profiles_admin" ON public.business_profiles
    FOR ALL USING (public.is_admin());


-- 5. POLITIQUES RLS SUR VEHICLES
DROP POLICY IF EXISTS "vehicles_select" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_modify" ON public.vehicles;

CREATE POLICY "vehicles_select" ON public.vehicles
    FOR SELECT USING (true);

CREATE POLICY "vehicles_modify" ON public.vehicles
    FOR ALL USING (auth.uid() = provider_id OR public.is_admin());


-- 6. POLITIQUES RLS SUR PROVIDER_DOCUMENTS (Données sensibles KYC)
DROP POLICY IF EXISTS "provider_docs_select" ON public.provider_documents;
DROP POLICY IF EXISTS "provider_docs_modify" ON public.provider_documents;

CREATE POLICY "provider_docs_select" ON public.provider_documents
    FOR SELECT USING (auth.uid() = provider_id OR public.is_admin());

CREATE POLICY "provider_docs_modify" ON public.provider_documents
    FOR ALL USING (auth.uid() = provider_id OR public.is_admin());


-- 7. POLITIQUES RLS SUR DRIVER_LOCATIONS (Positions GPS)
DROP POLICY IF EXISTS "driver_loc_select" ON public.driver_locations;
DROP POLICY IF EXISTS "driver_loc_insert" ON public.driver_locations;

CREATE POLICY "driver_loc_select" ON public.driver_locations
    FOR SELECT USING (true);

CREATE POLICY "driver_loc_insert" ON public.driver_locations
    FOR INSERT WITH CHECK (auth.uid() = provider_id OR public.is_admin());


-- 8. POLITIQUES RLS SUR SERVICE_TYPES & SUBSCRIPTION_PLANS
DROP POLICY IF EXISTS "service_types_select" ON public.service_types;
DROP POLICY IF EXISTS "service_types_admin" ON public.service_types;
CREATE POLICY "service_types_select" ON public.service_types FOR SELECT USING (true);
CREATE POLICY "service_types_admin" ON public.service_types FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "subscription_plans_select" ON public.subscription_plans;
DROP POLICY IF EXISTS "subscription_plans_admin" ON public.subscription_plans;
CREATE POLICY "subscription_plans_select" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "subscription_plans_admin" ON public.subscription_plans FOR ALL USING (public.is_admin());


-- 9. POLITIQUES RLS SUR ORDERS (Cœur opérationnel)
DROP POLICY IF EXISTS "orders_select_participants" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_client" ON public.orders;
DROP POLICY IF EXISTS "orders_update_participants" ON public.orders;

CREATE POLICY "orders_select_participants" ON public.orders
    FOR SELECT USING (
        auth.uid() = client_id 
        OR auth.uid() = provider_id 
        OR (status IN ('CREATED', 'SEARCHING'))
        OR public.is_admin()
    );

CREATE POLICY "orders_insert_client" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = client_id OR public.is_admin());

CREATE POLICY "orders_update_participants" ON public.orders
    FOR UPDATE USING (
        auth.uid() = client_id 
        OR auth.uid() = provider_id 
        OR public.is_admin()
    );


-- 10. POLITIQUES RLS SUR ORDER_EVENTS & MATCHING_REQUESTS
DROP POLICY IF EXISTS "order_events_select" ON public.order_events;
CREATE POLICY "order_events_select" ON public.order_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o 
            WHERE o.id = order_id AND (o.client_id = auth.uid() OR o.provider_id = auth.uid())
        ) OR public.is_admin()
    );

DROP POLICY IF EXISTS "matching_requests_policy" ON public.matching_requests;
CREATE POLICY "matching_requests_policy" ON public.matching_requests
    FOR ALL USING (auth.uid() = provider_id OR public.is_admin());


-- 11. POLITIQUES RLS SUR SUBSCRIPTIONS & PAYMENTS
DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert" ON public.subscriptions;
CREATE POLICY "subscriptions_select" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "subscriptions_insert" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "payment_tx_select" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_tx_insert" ON public.payment_transactions;
CREATE POLICY "payment_tx_select" ON public.payment_transactions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "payment_tx_insert" ON public.payment_transactions FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "payment_events_admin" ON public.payment_events;
CREATE POLICY "payment_events_admin" ON public.payment_events FOR ALL USING (public.is_admin());


-- 12. POLITIQUES RLS SUR CONVERSATIONS & MESSAGES
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
CREATE POLICY "conversations_select" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp 
            WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
        ) OR public.is_admin()
    );

DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;

CREATE POLICY "messages_select" ON public.messages
    FOR SELECT USING (
        auth.uid() = sender_id 
        OR auth.uid() = receiver_id 
        OR (order_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.orders o 
            WHERE o.id = order_id AND (o.client_id = auth.uid() OR o.provider_id = auth.uid())
        ))
        OR public.is_admin()
    );

CREATE POLICY "messages_insert" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id OR public.is_admin());


-- 13. POLITIQUES RLS SUR NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_user" ON public.notifications;
CREATE POLICY "notifications_user" ON public.notifications
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());


-- 14. POLITIQUES RLS SUR RATINGS & REVIEWS
DROP POLICY IF EXISTS "ratings_select" ON public.ratings;
DROP POLICY IF EXISTS "ratings_insert" ON public.ratings;
CREATE POLICY "ratings_select" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "ratings_insert" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = reviewer_id OR public.is_admin());

DROP POLICY IF EXISTS "reviews_select" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = client_id OR public.is_admin());


-- 15. POLITIQUES RLS SUR FAVORITES & SAVED_ADDRESSES
DROP POLICY IF EXISTS "favorites_policy" ON public.favorites;
CREATE POLICY "favorites_policy" ON public.favorites FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "saved_addresses_policy" ON public.saved_addresses;
CREATE POLICY "saved_addresses_policy" ON public.saved_addresses FOR ALL USING (auth.uid() = user_id OR public.is_admin());


-- 16. POLITIQUES RLS SUR INCIDENTS & SUPPORT
DROP POLICY IF EXISTS "incidents_policy" ON public.incidents;
CREATE POLICY "incidents_policy" ON public.incidents FOR ALL USING (auth.uid() = reporter_id OR public.is_admin());

DROP POLICY IF EXISTS "support_tickets_policy" ON public.support_tickets;
CREATE POLICY "support_tickets_policy" ON public.support_tickets FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "support_messages_policy" ON public.support_messages;
CREATE POLICY "support_messages_policy" ON public.support_messages FOR ALL USING (auth.uid() = sender_id OR public.is_admin());


-- 17. POLITIQUES RLS SUR AUDIT & ADMIN
DROP POLICY IF EXISTS "audit_logs_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_admin" ON public.audit_logs FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin_actions_admin" ON public.admin_actions;
CREATE POLICY "admin_actions_admin" ON public.admin_actions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "system_settings_select" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_admin" ON public.system_settings;
CREATE POLICY "system_settings_select" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "system_settings_admin" ON public.system_settings FOR ALL USING (public.is_admin());
