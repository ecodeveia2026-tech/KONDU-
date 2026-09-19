import { createClient } from '@supabase/supabase-js';

// Configuration officielle ŋdzemɔ Togo
const DEFAULT_SUPABASE_URL = 'https://aiufvthczqelhljrqmxz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdWZ2dGhjenFlbGhsanJxbXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDUwNTMsImV4cCI6MjEwNDg4MTA1M30.3cIPafTNwdjvOtVE0TwgMf2CVS0FXTaS3Mh1P4gbV94';

// Récupération des variables d'environnement avec fallback garanti sur le projet officiel
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.trim().length > 10)
  ? import.meta.env.VITE_SUPABASE_URL.trim()
  : DEFAULT_SUPABASE_URL;

const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY.trim().length > 20)
  ? import.meta.env.VITE_SUPABASE_ANON_KEY.trim()
  : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co') &&
  supabaseAnonKey.length > 20
);

// Fallback de stockage sécurisé pour mobile (si localStorage est restreint en navigation privée)
const getSafeStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const testKey = '__kondu_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    }
  } catch (e) {
    console.warn('localStorage non accessible, utilisation du stockage mémoire temporaire');
  }

  // Stockage mémoire de secours
  const memoryStore: Record<string, string> = {};
  return {
    getItem: (key: string) => memoryStore[key] || null,
    setItem: (key: string, value: string) => { memoryStore[key] = value; },
    removeItem: (key: string) => { delete memoryStore[key]; },
  };
};

// Initialisation du client Supabase officiel ŋdzemɔ
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: getSafeStorage(),
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

