// ==============================================================================
// ŋdzemɔ - SERVICE OFFICIEL DE GÉOLOCALISATION RÉELLE & SUIVI GPS
// Conforme aux règles ŋdzemɔ : pas de simulation, coordonnées réelles avec précision
// ==============================================================================

import { supabase } from '../supabase';

export interface GpsPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: string;
}

export interface GpsError {
  code: number;
  message: string;
}

class LocationService {
  private watchId: number | null = null;
  private lastUpdateTimestamp: number = 0;
  private minIntervalMs: number = 10000; // Fréquence d'envoi minimale vers Supabase (10 sec)

  /**
   * Obtient la position GPS ponctuelle actuelle avec haute précision
   */
  public async getCurrentPosition(): Promise<GpsPosition> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject({ code: 0, message: 'La géolocalisation n\'est pas supportée par ce navigateur.' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: new Date(pos.timestamp).toISOString(),
          });
        },
        (err) => {
          let errorMsg = 'Erreur lors de la récupération de la position GPS.';
          if (err.code === err.PERMISSION_DENIED) {
            errorMsg = 'Permission GPS refusée. Veuillez autoriser la localisation sur votre appareil.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errorMsg = 'Signal GPS indisponible. Vérifiez que la localisation est activée.';
          } else if (err.code === err.TIMEOUT) {
            errorMsg = 'Délai d\'attente GPS dépassé. Veuillez réessayer.';
          }
          reject({ code: err.code, message: errorMsg });
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  /**
   * Démarre le suivi GPS en temps réel d'un chauffeur en ligne et synchronise Supabase
   */
  public startProviderTracking(
    userId: string,
    onPositionUpdate?: (pos: GpsPosition) => void,
    onError?: (err: GpsError) => void
  ): void {
    if (this.watchId !== null) {
      this.stopTracking();
    }

    if (!('geolocation' in navigator)) {
      if (onError) onError({ code: 0, message: 'Géolocalisation non supportée sur cet appareil.' });
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        const gpsData: GpsPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: new Date(pos.timestamp).toISOString(),
        };

        if (onPositionUpdate) {
          onPositionUpdate(gpsData);
        }

        // Throttling pour éviter de saturer la base de données
        if (now - this.lastUpdateTimestamp >= this.minIntervalMs) {
          this.lastUpdateTimestamp = now;
          await this.syncPositionToSupabase(userId, gpsData);
        }
      },
      (err) => {
        console.warn('[LocationService] Erreur watchPosition:', err.message);
        if (onError) {
          onError({ code: err.code, message: err.message });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000,
      }
    );
  }

  /**
   * Arrête immédiatement le suivi GPS actif
   */
  public stopTracking(): void {
    if (this.watchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Synchronise la position en base de données Supabase
   */
  public async syncPositionToSupabase(userId: string, pos: GpsPosition): Promise<void> {
    try {
      // 1. Mise à jour de la table provider_profiles
      await supabase
        .from('provider_profiles')
        .update({
          current_lat: pos.latitude,
          current_lng: pos.longitude,
          location_accuracy: pos.accuracy,
          location_updated_at: pos.timestamp,
        })
        .eq('user_id', userId);

      // 2. Enregistrement de l'historique dans driver_locations
      await supabase.from('driver_locations').insert({
        provider_id: userId,
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy,
        heading: pos.heading,
        speed: pos.speed,
        is_online: true,
      });
    } catch (e) {
      console.error('[LocationService] Erreur synchronisation position Supabase:', e);
    }
  }

  /**
   * Passe le chauffeur en mode Hors Ligne dans Supabase et désactive le suivi
   */
  public async setProviderOffline(userId: string): Promise<void> {
    this.stopTracking();
    try {
      await supabase
        .from('provider_profiles')
        .update({
          is_online: false,
          is_available: false,
          location_updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      // On ne crée plus de fausse position (0,0) dans driver_locations
      // pour indiquer le passage hors ligne, afin de ne pas fausser l'historique GPS.
    } catch (e) {
      console.error('[LocationService] Erreur passage Hors Ligne:', e);
    }
  }
}

export const locationService = new LocationService();
