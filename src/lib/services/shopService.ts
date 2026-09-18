import { supabase } from '../supabase';
import { storageService } from './storageService';

export interface Product {
  id: string;
  name: string;
  description: string;
  price_cfa: number;
  image_url: string;
  category?: string;
  stock_quantity?: number;
  is_active?: boolean;
  business_id?: string | null;
  created_at?: string;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price_cfa: number;
  category?: string;
  stock_quantity?: number;
  imageFile?: File | null;
  defaultImageUrl?: string;
  business_id?: string | null;
}

export const BASE_SHOP_PRODUCTS: Product[] = [
  {
    id: 'base-prod-1',
    name: 'Casque Moto Homologué VIP (Norme CE)',
    description: 'Casque intégral renforcé avec visière anti-rayures et ventilation optimisée pour le climat togolais.',
    price_cfa: 18500,
    category: 'Équipement Moto',
    stock_quantity: 45,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'base-prod-2',
    name: 'Sac Isotherme Grand Volume KONDU Express',
    description: 'Sac de livraison étanche 45L avec bandes réfléchissantes nocturnes et isolation thermique haute densité.',
    price_cfa: 15000,
    category: 'Alimentaire',
    stock_quantity: 30,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: 'base-prod-3',
    name: 'Support Smartphone Guidon Anti-Vibration',
    description: 'Fixation universelle aluminium avec recharge USB rapide 2.1A pour guidon moto et tricycle.',
    price_cfa: 8500,
    category: 'Technologie',
    stock_quantity: 80,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80',
    created_at: new Date(Date.now() - 3600000 * 15).toISOString()
  },
  {
    id: 'base-prod-4',
    name: 'Huile Moteur Synthétique 10W40 (Bidon 1L)',
    description: 'Lubrifiant premium spécial fortes chaleurs et trajets urbains intensifs à Lomé.',
    price_cfa: 4500,
    category: 'Pièces Détachées',
    stock_quantity: 120,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
    created_at: new Date(Date.now() - 3600000 * 10).toISOString()
  }
];

const LOCAL_STORAGE_KEY = 'kondu_shop_custom_products';

class ShopService {
  /**
   * Récupère tous les produits personnalisés sauvegardés localement
   */
  getLocalProducts(): Product[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Sauvegarde un produit dans le cache local persistant
   */
  saveLocalProduct(product: Product) {
    try {
      const current = this.getLocalProducts();
      const updated = [product, ...current.filter(p => p.id !== product.id)];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Impossible d\'écrire dans localStorage:', err);
    }
  }

  /**
   * Récupère tous les produits disponibles pour la boutique
   */
  async getAllProducts(): Promise<Product[]> {
    let supabaseProducts: Product[] = [];

    try {
      const { data, error } = await supabase
        .from('shop_products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        supabaseProducts = data as Product[];
      }
    } catch (err) {
      console.warn('[ShopService] Erreur lecture Supabase shop_products:', err);
    }

    // Récupérer les produits locaux
    const localProducts = this.getLocalProducts();

    // Fusionner les listes sans doublons
    const productMap = new Map<string, Product>();

    // 1. D'abord les produits de base
    BASE_SHOP_PRODUCTS.forEach(p => productMap.set(p.id, p));

    // 2. Ensuite les produits locaux personnalisés
    localProducts.forEach(p => productMap.set(p.id, p));

    // 3. Enfin les produits Supabase (prioritaires)
    supabaseProducts.forEach(p => productMap.set(p.id, p));

    // Retourner triés du plus récent au plus ancien
    return Array.from(productMap.values()).sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }

  /**
   * Créer et enregistrer un produit
   */
  async createProduct(input: CreateProductInput): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
      if (!input.name?.trim()) {
        return { success: false, error: 'Le nom du produit est obligatoire.' };
      }
      if (!input.price_cfa || input.price_cfa <= 0) {
        return { success: false, error: 'Le prix doit être un montant valide supérieur à 0 F CFA.' };
      }

      let imageUrl = input.defaultImageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';

      // 1. Traitement de l'image si fichier fourni
      if (input.imageFile) {
        try {
          const uploadRes = await storageService.uploadShopImage(input.imageFile);
          if (uploadRes.success && uploadRes.publicUrl) {
            imageUrl = uploadRes.publicUrl;
          } else {
            // Secours Data URL immédiat pour garantir l'image
            const reader = new FileReader();
            const dataUrlPromise = new Promise<string>((resolve) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => resolve(imageUrl);
              reader.readAsDataURL(input.imageFile!);
            });
            imageUrl = await dataUrlPromise;
          }
        } catch {
          // Si l'upload échoue, on conserve l'image par défaut sans bloquer
        }
      }

      const newId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();

      const productPayload: Product = {
        id: newId,
        name: input.name.trim(),
        description: input.description?.trim() || '',
        price_cfa: Number(input.price_cfa),
        category: input.category || 'Général',
        stock_quantity: input.stock_quantity ?? 100,
        image_url: imageUrl,
        business_id: input.business_id || null,
        is_active: true,
        created_at: nowIso
      };

      // 2. Tentative d'insertion dans Supabase
      try {
        const { data: dbData, error: dbError } = await supabase
          .from('shop_products')
          .insert({
            name: productPayload.name,
            description: productPayload.description,
            price_cfa: productPayload.price_cfa,
            category: productPayload.category,
            stock_quantity: productPayload.stock_quantity,
            image_url: productPayload.image_url,
            business_id: productPayload.business_id,
            is_active: true
          })
          .select()
          .single();

        if (!dbError && dbData) {
          productPayload.id = dbData.id;
          productPayload.created_at = dbData.created_at || nowIso;
        } else if (dbError) {
          console.warn('[ShopService] Avertissement BDD Supabase shop_products (sauvegarde en cache local actif):', dbError.message);
        }
      } catch (dbEx) {
        console.warn('[ShopService] Exception lors de l\'insert Supabase shop_products:', dbEx);
      }

      // 3. Sauvegarde dans le cache local pour garantie totale d'affichage immédiat
      this.saveLocalProduct(productPayload);

      // 4. Déclencher l'événement global pour mise à jour en direct de tous les composants
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kondu_product_created', { detail: productPayload }));
      }

      return {
        success: true,
        product: productPayload
      };
    } catch (err: any) {
      console.error('[ShopService] Erreur fatale createProduct:', err);
      return {
        success: false,
        error: err.message || 'Erreur imprévue lors de la création du produit.'
      };
    }
  }

  /**
   * Supprimer un produit
   */
  async deleteProduct(productId: string): Promise<boolean> {
    try {
      await supabase.from('shop_products').delete().eq('id', productId);
    } catch (err) {
      console.warn('Erreur suppression Supabase:', err);
    }

    try {
      const current = this.getLocalProducts();
      const updated = current.filter(p => p.id !== productId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kondu_product_deleted', { detail: { id: productId } }));
    }

    return true;
  }
}

export const shopService = new ShopService();
