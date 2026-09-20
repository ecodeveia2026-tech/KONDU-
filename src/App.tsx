import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoleRoute, PublicOnlyRoute } from './components/AuthGuard';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ClientDashboard } from './pages/client/ClientDashboard';
import { ProviderDashboard } from './pages/provider/ProviderDashboard';
import { BusinessDashboard } from './pages/business/BusinessDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SupportPage } from './pages/SupportPage';
import { ShopPage } from './pages/ShopPage';
import { PaymentCallback } from './pages/PaymentCallback';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 1. Route publique : Page d'accueil avec Carrousel de Véhicules animé */}
          <Route path="/" element={<LandingPage />} />
          
          {/* 2. Routes Publiques d'Authentification (Redirigent automatiquement vers le dashboard si déjà connecté) */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />

          {/* 3. Dashboard Client / Passager */}
          <Route
            path="/dashboard/client"
            element={
              <RoleRoute allowedRoles={['CLIENT']}>
                <ClientDashboard />
              </RoleRoute>
            }
          />

          {/* 4. Dashboard Chauffeur / ŋdzemɔ PRO */}
          <Route
            path="/dashboard/provider"
            element={
              <RoleRoute allowedRoles={['PROVIDER']}>
                <ProviderDashboard />
              </RoleRoute>
            }
          />

          {/* 5. Dashboard Entreprise / ŋdzemɔ BUSINESS */}
          <Route
            path="/dashboard/business"
            element={
              <RoleRoute allowedRoles={['BUSINESS']}>
                <BusinessDashboard />
              </RoleRoute>
            }
          />

          {/* 6. Dashboard Super Admin */}
          <Route
            path="/dashboard/admin"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </RoleRoute>
            }
          />

          {/* 7. Page Support & Assistance */}
          <Route path="/support" element={<SupportPage />} />

          {/* 8. Boutique Publique */}
          <Route path="/shop" element={<ShopPage />} />

          {/* 9. Page de retour paiement PayDunya */}
          <Route path="/payment/callback" element={<PaymentCallback />} />

          {/* 10. Redirection par défaut vers l'accueil */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
