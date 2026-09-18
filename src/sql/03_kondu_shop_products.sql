-- =================================================================
-- KONDU - MODULE E-COMMERCE & BOUTIQUE : SCHÉMA SQL & POLITIQUES RLS
-- Script d'initialisation des tables de produits et commandes d'articles
-- =================================================================

-- 1. Table des produits de la boutique / Marchands Business
CREATE TABLE IF NOT EXISTS public.shop_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_cfa NUMERIC(12, 2) NOT NULL CHECK (price_cfa >= 0),
    image_url TEXT,
    category TEXT DEFAULT 'Général',
    stock_quantity INTEGER DEFAULT 100 CHECK (stock_quantity >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index pour accélérer la recherche des produits actifs par catégorie
CREATE INDEX IF NOT EXISTS idx_shop_products_active_category 
ON public.shop_products(is_active, category);

CREATE INDEX IF NOT EXISTS idx_shop_products_business 
ON public.shop_products(business_id);

-- 3. Table des commandes d'articles / boutique
CREATE TABLE IF NOT EXISTS public.shop_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_amount_cfa NUMERIC(12, 2) NOT NULL CHECK (total_amount_cfa >= 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    shipping_address TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    payment_method TEXT DEFAULT 'cash_on_delivery',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_orders_client 
ON public.shop_orders(client_id);

-- 4. Table des articles de commande
CREATE TABLE IF NOT EXISTS public.shop_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.shop_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price_cfa NUMERIC(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shop_order_items_order 
ON public.shop_order_items(order_id);

-- 5. Activation RLS
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;

-- 6. Politiques RLS pour shop_products
DROP POLICY IF EXISTS "Public select active shop_products" ON public.shop_products;
CREATE POLICY "Public select active shop_products"
ON public.shop_products FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users insert shop_products" ON public.shop_products;
CREATE POLICY "Authenticated users insert shop_products"
ON public.shop_products FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users update own or admin shop_products" ON public.shop_products;
CREATE POLICY "Authenticated users update own or admin shop_products"
ON public.shop_products FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users delete own or admin shop_products" ON public.shop_products;
CREATE POLICY "Authenticated users delete own or admin shop_products"
ON public.shop_products FOR DELETE
USING (auth.role() = 'authenticated');

-- 7. Politiques RLS pour shop_orders
DROP POLICY IF EXISTS "Clients and admins read shop_orders" ON public.shop_orders;
CREATE POLICY "Clients and admins read shop_orders"
ON public.shop_orders FOR SELECT
USING (auth.uid() = client_id OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Clients insert shop_orders" ON public.shop_orders;
CREATE POLICY "Clients insert shop_orders"
ON public.shop_orders FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- 8. Politiques RLS pour shop_order_items
DROP POLICY IF EXISTS "Clients read own shop_order_items" ON public.shop_order_items;
CREATE POLICY "Clients read own shop_order_items"
ON public.shop_order_items FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Clients insert shop_order_items" ON public.shop_order_items;
CREATE POLICY "Clients insert shop_order_items"
ON public.shop_order_items FOR INSERT
WITH CHECK (true);

-- 9. Configuration du Storage Bucket pour les produits
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shop_products', 'shop_products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access shop_products bucket" ON storage.objects;
CREATE POLICY "Public Access shop_products bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop_products');

DROP POLICY IF EXISTS "Authenticated Upload shop_products bucket" ON storage.objects;
CREATE POLICY "Authenticated Upload shop_products bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'shop_products' AND auth.role() = 'authenticated');
