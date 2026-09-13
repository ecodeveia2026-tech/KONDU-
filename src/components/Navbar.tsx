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
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo KONDU */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-white">KONDU</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              </div>
              <p className="text-[10px] tracking-wider uppercase text-amber-400 font-semibold">Mobilité & Services</p>
            </div>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/#services" className="text-sm font-semibold text-slate-200 hover:text-amber-400 transition-colors">
              Nos Services
            </Link>
            <Link to="/#pro" className="text-sm font-semibold text-slate-200 hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <Car className="w-4 h-4 text-amber-400" />
              Espace Chauffeur (0% Commission)
            </Link>
            <Link to="/#business" className="text-sm font-semibold text-slate-200 hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-sky-400" />
              Entreprises
            </Link>
            <Link to="/#vip" className="text-sm font-bold text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
              <Crown className="w-4 h-4 text-amber-400 fill-amber-400/30" />
              KONDU VIP
            </Link>
            <Link to="/support" className="text-sm font-semibold text-slate-200 hover:text-amber-400 transition-colors flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              Support
            </Link>
          </nav>

          {/* Actions Authentification */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={getDashboardRouteForRole(role)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-700 transition-all hover:border-amber-500/50 shadow-md"
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-400" />
                  <span>Mon Espace</span>
                  {getRoleBadge()}
                </Link>
                <button
                  onClick={handleSignOut}
                  title="Se déconnecter"
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/80 text-sm font-medium transition-colors"
                >
                  <LogIn className="w-4 h-4 text-amber-400" />
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="gold-gradient-btn px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20"
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
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold"
              >
                Dashboard
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Déroulant Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/#services"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-amber-400 font-medium text-sm"
          >
            Nos Services
          </Link>
          <Link
            to="/#pro"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-amber-400 font-medium text-sm flex items-center gap-2"
          >
            <Car className="w-4 h-4 text-amber-400" /> Espace Chauffeur (0% Commission)
          </Link>
          <Link
            to="/#business"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-amber-400 font-medium text-sm flex items-center gap-2"
          >
            <Building2 className="w-4 h-4 text-blue-400" /> Entreprises & Commerçants
          </Link>
          <Link
            to="/#vip"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-amber-300 hover:text-amber-200 font-medium text-sm flex items-center gap-2"
          >
            <Crown className="w-4 h-4 text-amber-400" /> KONDU VIP (5 000 F/mois)
          </Link>
          <Link
            to="/support"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-amber-400 font-medium text-sm flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" /> Centre d'Aide & Support
          </Link>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            {user ? (
              <>
                <Link
                  to={getDashboardRouteForRole(role)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Accéder à mon Dashboard ({profile?.full_name || role})
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-semibold"
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
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-medium"
                >
                  <LogIn className="w-4 h-4 text-amber-400" />
                  Connexion
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="gold-gradient-btn flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
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
