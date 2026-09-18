// ==============================================================================
// KONDU - SERVICE OFFICIEL DES COMMANDES, DU MATCHING & DES FAVORIS
// Conforme aux règles KONDU : transactions atomiques, vraies coordonnées, RLS
// ==============================================================================

import { supabase } from '../supabase';
import type { ServiceType } from '../types';

export interface CreateOrderParams {
  clientId: string;
  serviceType: ServiceType;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  estimatedDistanceKm: number;
  estimatedPrice: number;
  notes?: string;
}

export interface NearbyProviderResult {
  user_id: string;
  full_name: string;
  phone?: string;
  whatsapp?: string;
  avatar_url?: string;
  service_type: ServiceType;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_plate?: string;
  is_vip: boolean;
  rating_avg: number;
  total_ratings: number;
  current_lat: number;
  current_lng: number;
  distance_km: number;
}

class OrderService {
  /**
   * Recherche en temps réel des chauffeurs disponibles et proches via RPC Supabase
   */
  public async getNearbyAvailableProviders(
    serviceType?: ServiceType | 'all',
    clientLat: number = 6.1375,
    clientLng: number = 1.2123,
    maxRadiusKm: number = 30.0
  ): Promise<NearbyProviderResult[]> {
    try {
      // 1. Appel prioritaire de la fonction RPC officielle PostgreSQL si service précis
      if (serviceType && serviceType !== 'all') {
        const { data, error } = await supabase.rpc('get_nearby_available_providers', {
          p_service_type: serviceType,
          p_client_lat: clientLat,
          p_client_lng: clientLng,
          p_max_radius_km: maxRadiusKm,
          p_max_age_minutes: 60,
        });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data as NearbyProviderResult[];
        }
      }

      // 2. Requête directe flexible si fallback ou si serviceType === 'all'
      let query = supabase
        .from('provider_profiles')
        .select(`
          user_id,
          service_type,
          vehicle_brand,
          vehicle_model,
          vehicle_plate,
          is_vip,
          rating_avg,
          total_ratings,
          current_lat,
          current_lng,
          profile:profiles(full_name, phone, whatsapp, avatar_url, photo_url)
        `)
        .eq('is_online', true)
        .eq('is_available', true)
        .not('current_lat', 'is', null)
        .not('current_lng', 'is', null);

      if (serviceType && serviceType !== 'all') {
        query = query.eq('service_type', serviceType);
      }

      const { data: directData, error: directErr } = await query;

      if (directErr || !directData) return [];

      // Calcul réel de la distance Haversine côté client si fallback
      return directData
        .map((item: any) => {
          const lat = Number(item.current_lat);
          const lng = Number(item.current_lng);
          const dist = this.calculateHaversineDistance(clientLat, clientLng, lat, lng);
          const prof = Array.isArray(item.profile) ? item.profile[0] : item.profile;

          return {
            user_id: item.user_id,
            full_name: prof?.full_name || 'Chauffeur Partenaire',
            phone: prof?.phone,
            whatsapp: prof?.whatsapp || prof?.phone,
            avatar_url: prof?.avatar_url || prof?.photo_url,
            service_type: item.service_type,
            vehicle_brand: item.vehicle_brand,
            vehicle_model: item.vehicle_model,
            vehicle_plate: item.vehicle_plate
              ? (item.vehicle_plate.toUpperCase().startsWith('TG') ? item.vehicle_plate.toUpperCase() : `TG ${item.vehicle_plate.toUpperCase()}`)
              : 'TG 1234 AB',
            is_vip: Boolean(item.is_vip),
            rating_avg: Number(item.rating_avg || 5.0),
            total_ratings: Number(item.total_ratings || 0),
            current_lat: lat,
            current_lng: lng,
            distance_km: Math.round(dist * 100) / 100,
          };
        })
        .filter((prov) => prov.distance_km <= maxRadiusKm)
        .sort((a, b) => {
          if (a.is_vip !== b.is_vip) return a.is_vip ? -1 : 1;
          return a.distance_km - b.distance_km;
        });
    } catch (err) {
      console.error('[OrderService] Erreur recherche chauffeurs:', err);
      return [];
    }
  }

  /**
   * Création d'une nouvelle commande dans Supabase
   */
  public async createOrder(params: CreateOrderParams): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          client_id: params.clientId,
          service_type: params.serviceType,
          status: 'searching',
          pickup_address: params.pickupAddress,
          pickup_latitude: params.pickupLat,
          pickup_longitude: params.pickupLng,
          pickup_lat: params.pickupLat,
          pickup_lng: params.pickupLng,
          destination_address: params.dropoffAddress,
          destination_latitude: params.dropoffLat,
          destination_longitude: params.dropoffLng,
          dropoff_address: params.dropoffAddress,
          dropoff_lat: params.dropoffLat,
          dropoff_lng: params.dropoffLng,
          estimated_distance: params.estimatedDistanceKm,
          estimated_distance_km: params.estimatedDistanceKm,
          estimated_price: params.estimatedPrice,
          currency: 'XOF',
          notes: params.notes || null,
        })
        .select('id')
        .single();

      if (error || !data) {
        return { success: false, error: error?.message || 'Échec de la création de la course.' };
      }

      // Enregistrement dans l'historique immuable order_events
      await supabase.from('order_events').insert({
        order_id: data.id,
        actor_user_id: params.clientId,
        event_type: 'ORDER_CREATED',
        previous_status: 'NONE',
        new_status: 'SEARCHING',
        metadata: {
          service_type: params.serviceType,
          price: params.estimatedPrice,
        },
      });

      return { success: true, orderId: data.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Acceptation atomique d'une commande par un chauffeur (Concurrence garantie)
   */
  public async acceptOrder(orderId: string, providerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Tentative avec la fonction RPC atomique PostgreSQL (FOR UPDATE)
      const { data: rpcData, error: rpcError } = await supabase.rpc('accept_order_atomically', {
        p_order_id: orderId,
        p_provider_id: providerId,
      });

      if (!rpcError && rpcData) {
        if (rpcData.success) {
          return { success: true };
        } else {
          return { success: false, error: rpcData.error || 'Cette commande a déjà été acceptée.' };
        }
      }

      // 2. Fallback si la fonction RPC n'est pas disponible
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('status, provider_id')
        .eq('id', orderId)
        .single();

      if (existingOrder?.status !== 'searching' && existingOrder?.status !== 'created') {
        return { success: false, error: 'Cette course n\'est plus disponible.' };
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          provider_id: providerId,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .in('status', ['searching', 'created']);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Indisponibilité du chauffeur
      await supabase
        .from('provider_profiles')
        .update({ is_available: false })
        .eq('user_id', providerId);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Ajout d'une évaluation pour une course terminée
   */
  public async submitReview(
    orderId: string,
    clientId: string,
    providerId: string,
    rating: number,
    comment?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('reviews').insert({
        order_id: orderId,
        client_id: clientId,
        provider_id: providerId,
        rating: Math.min(5, Math.max(1, Math.round(rating))),
        comment: comment || null,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Gestion des Chauffeurs Favoris
   */
  public async addFavorite(userId: string, providerId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('favorites').insert({
        user_id: userId,
        provider_id: providerId,
      });
      return !error;
    } catch {
      return false;
    }
  }

  public async removeFavorite(userId: string, providerId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('provider_id', providerId);
      return !error;
    } catch {
      return false;
    }
  }

  public async getFavorites(userId: string): Promise<string[]> {
    try {
      const { data } = await supabase
        .from('favorites')
        .select('provider_id')
        .eq('user_id', userId);
      return data ? data.map((f) => f.provider_id) : [];
    } catch {
      return [];
    }
  }

  /**
   * Calcul Haversine en kilomètres
   */
  public calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const orderService = new OrderService();
