import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile, ProviderProfile, BusinessProfile, UserRole } from '../lib/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  providerProfile: ProviderProfile | null;
  businessProfile: BusinessProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isConfigured: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  // CRITIQUE : isLoading doit rester true jusqu'à ce que l'auth ET le profil soient chargés
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Ref pour éviter les setState après démontage
  const isMounted = useRef(true);

  // ─── Chargement du profil depuis Supabase ────────────────────────────────
  const loadProfile = useCallback(async (currentUser: User): Promise<void> => {
    if (!isMounted.current) return;

    try {
      // Tentative avec retry (le trigger peut avoir un délai de 100-300ms)
      let profileData = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!profileData && attempts < maxAttempts) {
        attempts++;
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (error) {
          console.error(`[AuthContext] Erreur chargement profil (tentative ${attempts}):`, error.message);
        }

        if (data) {
          profileData = data;
        } else if (attempts < maxAttempts) {
          // Attente progressive entre tentatives (délai trigger Supabase)
          await new Promise((r) => setTimeout(r, 300 * attempts));
        }
      }

      if (!isMounted.current) return;

      if (profileData) {
        // CORRECTION PRIORITAIRE : Forcer le rôle ADMIN pour daaup2580@gmail.com
        if (currentUser.email === 'daaup2580@gmail.com' && profileData.role !== 'ADMIN') {
          profileData.role = 'ADMIN';
          // Met à jour la base de données de manière asynchrone pour la prochaine fois
          supabase.from('profiles').update({ role: 'ADMIN' }).eq('user_id', currentUser.id).then(({ error }) => {
            if (error) console.error('Erreur lors de la mise à jour forcée du rôle ADMIN:', error.message);
          });
        }

        setProfile(profileData as Profile);
        setRole(profileData.role as UserRole);

        // Chargement du profil spécialisé selon le rôle
        if (profileData.role === 'PROVIDER') {
          const { data: provData } = await supabase
            .from('provider_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .maybeSingle();
          if (provData && isMounted.current) {
            setProviderProfile(provData as ProviderProfile);
          }
        } else if (profileData.role === 'BUSINESS') {
          const { data: busData } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .maybeSingle();
          if (busData && isMounted.current) {
            setBusinessProfile(busData as BusinessProfile);
          }
        }
      } else {
        // Fallback : profil non encore créé par le trigger — on crée depuis les metadata
        let metaRole = (currentUser.user_metadata?.role as UserRole) || 'CLIENT';
        if (currentUser.email === 'daaup2580@gmail.com') {
          metaRole = 'ADMIN';
        }
        const metaName = currentUser.user_metadata?.full_name
          || currentUser.email?.split('@')[0]
          || 'Utilisateur';

        // Tentative de création du profil si absent
        const { error: upsertError } = await supabase.from('profiles').upsert({
          user_id: currentUser.id,
          email: currentUser.email || '',
          full_name: metaName,
          phone: currentUser.user_metadata?.phone || '',
          whatsapp: currentUser.user_metadata?.whatsapp || currentUser.user_metadata?.phone || '',
          role: metaRole,
        }, { onConflict: 'user_id' });

        if (upsertError) {
          console.warn('[AuthContext] Avertissement upsert profil fallback:', upsertError.message);
        }

        if (isMounted.current) {
          const fallbackProfile: Profile = {
            id: currentUser.id,
            user_id: currentUser.id,
            email: currentUser.email || '',
            full_name: metaName,
            role: metaRole,
            is_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setProfile(fallbackProfile);
          setRole(metaRole);
        }
      }
    } catch (err) {
      console.error('[AuthContext] Erreur critique chargement profil:', err);
    }
  }, []);

  // ─── Rechargement manuel du profil ──────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    if (user && isMounted.current) {
      await loadProfile(user);
    }
  }, [user, loadProfile]);

  // ─── Déconnexion complète ────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      if (isMounted.current) setIsLoading(true);
      await supabase.auth.signOut();
    } catch (e) {
      console.error('[AuthContext] Erreur déconnexion:', e);
    } finally {
      if (isMounted.current) {
        setUser(null);
        setSession(null);
        setProfile(null);
        setProviderProfile(null);
        setBusinessProfile(null);
        setRole(null);
        setIsLoading(false);
      }
    }
  }, []);

  // ─── Initialisation de l'auth au montage ────────────────────────────────
  useEffect(() => {
    isMounted.current = true;

    async function initAuth() {
      try {
        // Récupération de la session Supabase stockée
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthContext] Erreur getSession:', error.message);
        }

        if (!isMounted.current) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          // CRITIQUE : attendre que le profil soit chargé AVANT de mettre isLoading=false
          await loadProfile(initialSession.user);
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
          setRole(null);
        }
      } catch (err) {
        console.error('[AuthContext] Erreur initialisation auth:', err);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Écouteur en temps réel des changements d'état Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted.current) return;

        console.log('[AuthContext] Auth event:', event);

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setProfile(null);
          setProviderProfile(null);
          setBusinessProfile(null);
          setRole(null);
          setIsLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (currentSession?.user) {
            setSession(currentSession);
            setUser(currentSession.user);
            // Ne pas mettre isLoading=true ici pour éviter le flash
            await loadProfile(currentSession.user);
          }
        }

        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        providerProfile,
        businessProfile,
        role,
        isLoading,
        isConfigured: isSupabaseConfigured,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('[ŋdzemɔ] useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};
