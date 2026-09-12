import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../lib/types';
import { Loader2 } from 'lucide-react';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

// Fonction utilitaire pour obtenir la route de dashboard par défaut d'un rôle
export const getDashboardRouteForRole = (role: UserRole | null | undefined): string => {
  switch (role) {
    case 'ADMIN':
      return '/dashboard/admin';
    case 'PROVIDER':
      return '/dashboard/provider';
    case 'BUSINESS':
      return '/dashboard/business';
    case 'CLIENT':
    default:
      return '/dashboard/client';
  }
};

// Écran de chargement moderne
export const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Synchronisation sécurisée KONDU...' }) => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
    <div className="relative flex items-center justify-center mb-6">
      <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
      <div className="absolute w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 animate-pulse"></div>
    </div>
    <h2 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
      KONDU
    </h2>
    <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
      {message}
    </p>
  </div>
);

// Route protégée par rôle
export const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen message="Vérification de vos accès..." />;
  }

  // 1. Si non connecté -> Redirection vers /login avec sauvegarde de la page cible
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Si des rôles spécifiques sont requis et que l'utilisateur n'a pas le bon rôle
  if (allowedRoles && allowedRoles.length > 0 && role) {
    if (!allowedRoles.includes(role)) {
      // Redirection automatique vers le dashboard propre à son rôle
      return <Navigate to={getDashboardRouteForRole(role)} replace />;
    }
  }

  return <>{children}</>;
};

// Route publique réservée aux utilisateurs NON connectés (ex: /login, /register)
export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Chargement..." />;
  }

  // Si l'utilisateur est déjà connecté, on l'envoie directement à son Dashboard !
  if (user && role) {
    return <Navigate to={getDashboardRouteForRole(role)} replace />;
  }

  return <>{children}</>;
};
