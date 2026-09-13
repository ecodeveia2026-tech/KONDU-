import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getDashboardRouteForRole } from '../components/AuthGuard';
import { Compass, Mail, Lock, LogIn, AlertCircle, Loader2, ArrowRight, MapPin, MessageSquare, Phone } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      // 1. Authentification Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Adresse e-mail ou mot de passe incorrect.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Veuillez confirmer votre adresse e-mail avant de vous connecter.');
        }
        throw error;
      }

      if (data?.user) {
        // 2. Synchronisation immédiate du profil
        await refreshProfile();

        // 3. Récupération du rôle pour redirection instantanée
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .maybeSingle();

        const targetRole = profile?.role || data.user.user_metadata?.role || 'CLIENT';
        const targetDashboard = getDashboardRouteForRole(targetRole);

        const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname;
        if (fromPath && !fromPath.startsWith('/login') && !fromPath.startsWith('/register')) {
          navigate(fromPath, { replace: true });
        } else {
          navigate(targetDashboard, { replace: true });
        }
      }
    } catch (err: any) {
      console.error('Erreur de connexion:', err);
      setErrorMsg(err.message || 'Une erreur est survenue lors de la connexion. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Halos lumineux de fond */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 text-center">
        <Link to="/" className="inline-flex items-center justify-center gap-3 mb-4 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
            <Compass className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="text-3xl font-black text-white tracking-tight">KONDU</span>
        </Link>

        {/* Badge Lomé Togo */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3 shadow-md">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>Plateforme Officielle — Lomé, Togo 🇹🇬</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Connexion à votre compte
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
          Accédez à votre espace Passager, Chauffeur Pro, Entreprise ou Admin
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-slate-900/95 backdrop-blur-2xl py-8 px-6 sm:px-10 rounded-3xl border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
          
          {/* Ligne d'accentuation dorée */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600" />

          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Adresse e-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-amber-400/80" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kondutogo@mail.com"
                  className="w-full bg-slate-950 border border-slate-700/80 hover:border-slate-600 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Mot de passe
                </label>
                <Link to="/support" className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                  Besoin d'aide ?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-amber-400/80" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 hover:border-slate-600 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Vérification des identifiants...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Vous n'avez pas encore de compte ?{' '}
              <Link to="/register" className="text-amber-400 font-bold hover:underline hover:text-amber-300 inline-flex items-center gap-1 transition-colors">
                Créer un compte KONDU <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>

          {/* Coordonnées Officielles Togo (Lomé) */}
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/20 shadow-lg">
              <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800">
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Assistance — Lomé, Togo
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  24/7
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <a
                  href="https://wa.me/22893919212"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/80 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/40 transition-all text-slate-200"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">WA: <strong className="text-emerald-400">+228 93919212</strong></span>
                </a>
                <a
                  href="tel:+22899255231"
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/80 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 transition-all text-slate-200"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Tél: <strong className="text-amber-400">+228 99255231</strong></span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
