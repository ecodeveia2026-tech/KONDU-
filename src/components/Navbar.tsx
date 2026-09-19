import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardRouteForRole } from './AuthGuard';
import { 
  Compass, 
  Car, 
  ShieldCheck, 
  Building2, 
  HelpCircle, 
  LogIn, 
  LogOut, 
  Menu, 
  X, 
  Crown,
  LayoutDashboard
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, role, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getRoleBadge = () => {
    if (!role) return null;
    switch (role) {
      case 'ADMIN':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-2 py-0.5 rounded-full font-semibold">ADMIN</span>;
      case 'PROVIDER':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Car className="w-3 h-3" /> PRO</span>;
      case 'BUSINESS':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Building2 className="w-3 h-3" /> BUSINESS</span>;
      case 'CLIENT':
      default:
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full font-semibold">CLIENT</span>;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo ŋdzemɔ */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo-ndzemo.png"
              alt="ŋdzemɔ"
              className="h-12 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center gap-5">
            <a href="/#services" className="text-sm font-semibold text-slate-700 hover:text-amber-600 transition-colors">
              Nos Services
            </a>
            <a href="/#news" className="text-sm font-semibold text-slate-700 hover:text-amber-600 transition-colors">
              Actualités
            </a>
            <a href="/#contact" className="text-sm font-semibold text-slate-700 hover:text-amber-600 transition-colors">
              Nous contacter
            </a>
            <a href="/#pro" className="text-sm font-semibold text-slate-700 hover:text-amber-600 transition-colors flex items-center gap-1.5">
              <Car className="w-4 h-4 text-amber-500" />
              Espace Chauffeur
            </a>
            <Link to="/shop" className="text-sm font-bold text-amber-700 hover:text-amber-800 transition-colors flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <Crown className="w-4 h-4 text-amber-500 fill-amber-500/30" />
              Boutique
            </Link>
            <Link to="/support" className="text-sm font-semibold text-slate-700 hover:text-amber-600 transition-colors flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              Support
            </Link>
          </nav>

          {/* Actions Authentification */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={getDashboardRouteForRole(role)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-bold border border-slate-200 transition-all shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-500" />
                  <span>Mon Espace</span>
                  {getRoleBadge()}
                </Link>
                <button
                  onClick={handleSignOut}
                  title="Se déconnecter"
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-sm font-bold transition-colors"
                >
                  <LogIn className="w-4 h-4 text-amber-500" />
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="gold-gradient-btn px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-amber-500/20"
                >
                  <ShieldCheck className="w-4 h-4" />
                  S'inscrire
                </Link>
              </div>
            )}
          </div>

          {/* Bouton Menu Mobile */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <Link
                to={getDashboardRouteForRole(role)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-700 text-xs font-semibold"
              >
                Dashboard
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Déroulant Mobile Optimisé Smartphone & Android */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/98 backdrop-blur-xl border-b border-slate-200 px-4 pt-3 pb-6 space-y-2 text-slate-900 shadow-xl animate-fade-up">
          <Link
            to="/#services"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-amber-600 font-bold text-sm"
          >
            Nos Services de Mobilité
          </Link>
          <Link
            to="/#pro"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-amber-600 font-bold text-sm flex items-center gap-2"
          >
            <Car className="w-4 h-4 text-amber-500" /> Espace Chauffeur (0% Commission)
          </Link>
          <Link
            to="/#business"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-amber-600 font-bold text-sm flex items-center gap-2"
          >
            <Building2 className="w-4 h-4 text-blue-500" /> Entreprises & Commerçants
          </Link>
          <a
            href="/#news"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-amber-600 font-bold text-sm"
          >
            📰 Actualités KONDU
          </a>
          <a
            href="/#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-amber-600 font-bold text-sm"
          >
            📞 Nous contacter
          </a>
          <Link
            to="/#pro"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl bg-amber-50 text-amber-900 font-bold text-sm flex items-center gap-2 border border-amber-200"
          >
            <Crown className="w-4 h-4 text-amber-600" /> KONDU VIP (15 000 F / mois)
          </Link>
          <Link
            to="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-800 hover:text-amber-600 font-bold text-sm flex items-center gap-2"
          >
            🛍️ Boutique KONDU
          </Link>
          <Link
            to="/support"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-amber-600 font-bold text-sm flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" /> Centre d'Aide & Support
          </Link>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {user ? (
              <>
                <Link
                  to={getDashboardRouteForRole(role)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-amber-500 text-slate-950 font-extrabold text-sm shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Accéder à mon Dashboard ({profile?.full_name || role})
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-sm font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm font-bold border border-slate-200"
                >
                  <LogIn className="w-4 h-4 text-amber-500" />
                  Connexion
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="gold-gradient-btn flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-extrabold text-slate-950 shadow-sm"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
