// ==============================================================================
// KONDU - SERVICE OFFICIEL SUPABASE STORAGE (PHOTOS DE PROFIL & DOCUMENTS)
// Conforme aux règles KONDU : isolation des comptes, sécurité, taille maximale
// ==============================================================================

import { supabase } from '../supabase';

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

class StorageService {
  private bucketName: string = 'avatars';
  private maxSizeBytes: number = 2 * 1024 * 1024; // 2 Mo max

  /**
   * Upload ou mise à jour de la photo de profil d'un utilisateur
   */
  public async uploadAvatar(userId: string, file: File): Promise<UploadResult> {
    try {
      // 1. Validation du type MIME
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Format non supporté. Veuillez choisir une image JPG, PNG ou WEBP.',
        };
      }

      // 2. Validation de la taille maximale
      if (file.size > this.maxSizeBytes) {
        return {
          success: false,
          error: 'La photo ne doit pas dépasser 2 Mo.',
        };
      }

      // 3. Nom de fichier sécurisé lié à l'ID utilisateur
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

      // 4. Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        // Si le bucket n'existe pas ou politique RLS spécifique, on tente un fallback gracieux
        console.error('[StorageService] Erreur upload:', uploadError.message);
        return {
          success: false,
          error: `Erreur upload: ${uploadError.message}`,
        };
      }

      // 5. Récupération de l'URL publique
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(uploadData.path);

      const publicUrl = urlData.publicUrl;

      // 6. Mise à jour automatique de la table profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          photo_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (profileError) {
        console.warn('[StorageService] Avertissement update profiles:', profileError.message);
      }

      return {
        success: true,
        publicUrl,
      };
    } catch (err: any) {
      console.error('[StorageService] Exception uploadAvatar:', err);
      return {
        success: false,
        error: err.message || 'Erreur inattendue lors du téléversement.',
      };
    }
  }

  /**
   * Suppression de la photo de profil
   */
  public async removeAvatar(userId: string, currentUrl?: string | null): Promise<boolean> {
    try {
      if (currentUrl && currentUrl.includes(this.bucketName)) {
        const parts = currentUrl.split(`${this.bucketName}/`);
        if (parts.length > 1) {
          const path = parts[1];
          await supabase.storage.from(this.bucketName).remove([path]);
        }
      }

      await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          photo_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return true;
    } catch (err) {
      console.error('[StorageService] Erreur suppression avatar:', err);
      return false;
    }
  }
}

export const storageService = new StorageService();
