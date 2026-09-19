// ==============================================================================
// ŋdzemɔ - SERVICE OFFICIEL SUPABASE STORAGE (PHOTOS DE PROFIL & DOCUMENTS)
// Conforme aux règles ŋdzemɔ : isolation des comptes, sécurité, fallback DataURL
// ==============================================================================

import { supabase } from '../supabase';

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

class StorageService {
  private bucketName: string = 'avatars';
  private maxSizeBytes: number = 10 * 1024 * 1024; // 10 Mo max

  /**
   * Convertit un fichier en Data URL (Base64) pour affichage instantané et stockage direct
   */
  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload ou mise à jour de la photo de profil d'un utilisateur avec double garantie
   */
  public async uploadAvatar(userId: string, file: File): Promise<UploadResult> {
    try {
      // 1. Validation du type d'image (Accepte toutes les images)
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          error: 'Veuillez sélectionner un fichier image (JPG, PNG, WEBP, etc.).',
        };
      }

      // 2. Validation de la taille maximale (10 Mo max)
      if (file.size > this.maxSizeBytes) {
        return {
          success: false,
          error: 'La photo est trop volumineuse (maximum 10 Mo).',
        };
      }

      // Génération préalable de la Data URL de fallback pour garantie absolue
      const dataUrl = await this.fileToDataUrl(file);

      // 3. Tentative d'upload vers Supabase Storage
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

      let publicUrl = dataUrl; // URL par défaut = Data URL Base64

      try {
        // Nettoyage des anciens avatars si possible
        const { data: oldFiles } = await supabase.storage.from(this.bucketName).list(userId);
        if (oldFiles && oldFiles.length > 0) {
          const filesToRemove = oldFiles.map((f) => `${userId}/${f.name}`);
          await supabase.storage.from(this.bucketName).remove(filesToRemove);
        }

        // Upload dans le bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(this.bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from(this.bucketName)
            .getPublicUrl(uploadData.path);

          if (urlData?.publicUrl) {
            publicUrl = urlData.publicUrl;
          }
        } else {
          console.warn('[StorageService] Fallback sur Base64 Data URL suite à Supabase Storage:', uploadError?.message);
        }
      } catch (storageErr) {
        console.warn('[StorageService] Storage exception, utilisation de la Data URL:', storageErr);
      }

      // 4. Enregistrement direct et garanti dans la table `profiles`
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          photo_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (profileError) {
        console.error('[StorageService] Erreur mise à jour profil:', profileError.message);
        return {
          success: false,
          error: `Erreur mise à jour du profil : ${profileError.message}`,
        };
      }

      return {
        success: true,
        publicUrl,
      };
    } catch (err: any) {
      console.error('[StorageService] Exception uploadAvatar:', err);
      return {
        success: false,
        error: err.message || 'Erreur inattendue lors de l\'importation de la photo.',
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

  /**
   * Upload d'une image de produit pour la Boutique avec Fallback
   */
  public async uploadShopImage(file: File): Promise<UploadResult> {
    try {
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          error: 'Veuillez sélectionner un fichier image valide.',
        };
      }

      const dataUrl = await this.fileToDataUrl(file);
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      let targetBucket = 'shop_images';
      let filePath = `products/${fileName}`;

      let publicUrl = dataUrl;

      try {
        let { data: uploadData, error: uploadError } = await supabase.storage
          .from(targetBucket)
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError && (uploadError.message.includes('not found') || uploadError.message.includes('Bucket'))) {
          targetBucket = this.bucketName;
          filePath = `shop_products/${fileName}`;
          const fallbackRes = await supabase.storage
            .from(targetBucket)
            .upload(filePath, file, { cacheControl: '3600', upsert: false });

          uploadData = fallbackRes.data;
          uploadError = fallbackRes.error;
        }

        if (!uploadError && uploadData) {
          const finalPath = uploadData.path || filePath;
          const { data: urlData } = supabase.storage
            .from(targetBucket)
            .getPublicUrl(finalPath);

          if (urlData?.publicUrl) {
            publicUrl = urlData.publicUrl;
          }
        }
      } catch (err) {
        console.warn('[StorageService] Fallback image produit vers Data URL:', err);
      }

      return {
        success: true,
        publicUrl,
      };
    } catch (err: any) {
      console.error('[StorageService] Exception uploadShopImage:', err);
      return {
        success: false,
        error: err.message || 'Erreur lors du téléversement de l\'image produit.',
      };
    }
  }
}

export const storageService = new StorageService();
