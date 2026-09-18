import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { LiveMap } from '../../components/LiveMap';
import { KonduAIAssistant } from '../../components/KonduAIAssistant';
import type { Profile, ProviderProfile, Order, SubscriptionPlan, UserRole } from '../../lib/types';
import { OFFICIAL_SUBSCRIPTION_PLANS } from '../../lib/types';
import { shopService } from '../../lib/services/shopService';
import { 
  Home,
  ArrowLeft,
  ShoppingBag, 
  Package,
  Users, 
  Car, 
  DollarSign,
  BarChart3,
  Target,
  Share2,
  Zap,
  Info,
  Settings,
  CheckCircle, 
  XCircle, 
  Crown, 
  Search, 
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Plus,
  Upload,
  X,
  Loader2,
  Menu,
  Navigation,
  MapPin,
  Activity,
  Radio,
  Phone,
  MessageSquare,
  Calendar,
  Filter,
  Eye,
  TrendingUp,
  Monitor
} from 'lucide-react';

export interface Incident {
  id: string;
  reporter_id: string;
  order_id?: string;
  provider_id?: string;
  type: string;
  description: string;
  status: 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  resolution?: string;
  created_at: string;
}

export interface AdminActionLog {
  id: string;
  action_type: string;
  reason: string;
  created_at: string;
  details?: any;
}

export type AdminTab = 
  | 'accueil' 
  | 'gprs'
  | 'ventes' 
  | 'produits' 
  | 'clients' 
  | 'chauffeurs' 
  | 'revenus' 
  | 'analytiques' 
  | 'marketing' 
  | 'affiliation' 
  | 'automatisations' 
  | 'plus' 
  | 'parametres';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('accueil');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Données globales
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminActionLog[]>([]);
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [shopOrders, setShopOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // État Modal Ajout de Produit
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodCategory, setProdCategory] = useState('Général');
  const [prodStock, setProdStock] = useState('100');
  const [prodImageFile, setProdImageFile] = useState<File | null>(null);
  const [prodImagePreview, setProdImagePreview] = useState<string | null>(null);
  const [isSubmittingProd, setIsSubmittingProd] = useState(false);
  const [prodFormError, setProdFormError] = useState<string | null>(null);

  // Synchronisation des forfaits d'abonnement
  const [isSyncingPlans, setIsSyncingPlans] = useState(false);
  const [planSyncMessage, setPlanSyncMessage] = useState<string | null>(null);

  const handleProdImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setProdFormError('Format non supporté. Veuillez choisir une image JPG, PNG ou WEBP.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setProdFormError('L\'image ne doit pas dépasser 5 Mo.');
        return;
      }
      setProdFormError(null);
      setProdImageFile(file);
      setProdImagePreview(URL.createObjectURL(file));
    }
  };

  const handleResetProdForm = () => {
    setProdName('');
    setProdPrice('');
    setProdDescription('');
    setProdCategory('Général');
    setProdStock('100');
    setProdImageFile(null);
    setProdImagePreview(null);
    setProdFormError(null);
    setIsSubmittingProd(false);
    setShowAddProductModal(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce produit de la boutique ?')) return;
    try {
      await shopService.deleteProduct(productId);
      setShopProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err: any) {
      alert(`Erreur suppression produit : ${err.message}`);
    }
  };

  const handleToggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('shop_products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;
      setShopProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_active: !currentStatus } : p))
      );
    } catch (err: any) {
      alert(`Erreur mise à jour statut : ${err.message}`);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      setProdFormError('Le nom du produit est obligatoire.');
      return;
    }
    const priceNum = parseFloat(prodPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setProdFormError('Le prix doit être un nombre supérieur à 0.');
      return;
    }

    setIsSubmittingProd(true);
    setProdFormError(null);

    try {
      const result = await shopService.createProduct({
        name: prodName,
        description: prodDescription,
        price_cfa: priceNum,
        category: prodCategory,
        stock_quantity: parseInt(prodStock) || 100,
        imageFile: prodImageFile,
        business_id: user?.id || null
      });

      if (!result.success || !result.product) {
        setProdFormError(result.error || 'Erreur lors de la création du produit.');
        setIsSubmittingProd(false);
        return;
      }

      // Mise à jour immédiate de la liste locale du Dashboard Admin
      setShopProducts((prev) => [result.product!, ...prev.filter(p => p.id !== result.product!.id)]);

      // Réinitialisation et fermeture
      handleResetProdForm();
      alert(`✅ Produit « ${result.product.name} » créé avec succès ! Il est immédiatement visible dans la boutique.`);
    } catch (err: any) {
      console.error('Exception création produit:', err);
      setProdFormError(err.message || 'Erreur inattendue.');
      setIsSubmittingProd(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // 1. Tous les profils
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profData) setProfiles(profData as Profile[]);

      // 2. Profils prestataires
      const { data: provData } = await supabase
        .from('provider_profiles')
        .select('*, profile:profiles(*)')
        .order('created_at', { ascending: false });

      if (provData) setProviders(provData as ProviderProfile[]);

      // 3. Commandes récentes
      const { data: ordData } = await supabase
        .from('orders')
        .select('*, client:profiles(*)')
        .order('created_at', { ascending: false })
        .limit(25);

      if (ordData) setOrders(ordData as Order[]);

      // 4. Plans d'abonnements avec synchronisation des nouveaux tarifs officiels
      const { data: planData } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_cfa', { ascending: true });

      if (planData && planData.length > 0) {
        let hasOldPrices = false;
        const mappedPlans = planData.map((p) => {
          const code = (p.code || '').toLowerCase();
          const name = (p.name || '').toLowerCase();

          if (code.includes('200') || (name.includes('24h') && name.includes('essentiel'))) {
            if (p.price_cfa !== 500) hasOldPrices = true;
            return {
              ...p,
              name: 'Pass 24H Essentiel',
              price_cfa: 500,
              duration_days: 1,
              is_vip: false,
              description: 'Accès illimité aux courses pendant 24 heures. 0% de commission.',
            };
          }
          if (code.includes('300') || (name.includes('24h') && name.includes('confort'))) {
            if (p.price_cfa !== 1000) hasOldPrices = true;
            return {
              ...p,
              name: 'Pass 24H Confort',
              price_cfa: 1000,
              duration_days: 1,
              is_vip: false,
              description: 'Accès 24H avec support prioritaire et alertes sonores instantanées.',
            };
          }
          if (code.includes('weekly') || name.includes('hebdo') || name.includes('7 jour')) {
            if (p.price_cfa !== 2500) hasOldPrices = true;
            return {
              ...p,
              name: 'Pass Hebdomadaire (7 Jours)',
              price_cfa: 2500,
              duration_days: 7,
              is_vip: false,
              description: 'Formule 7 jours économique et rentable pour chauffeurs réguliers.',
            };
          }
          if (p.is_vip || code.includes('vip') || name.includes('vip')) {
            if (p.price_cfa !== 15000) hasOldPrices = true;
            return {
              ...p,
              name: 'KONDU VIP (30 Jours)',
              price_cfa: 15000,
              duration_days: 30,
              is_vip: true,
              description: 'Priorité absolue de matching et visibilité maximale sur la carte.',
            };
          }
          if (code.includes('monthly') || name.includes('mensuel') || name.includes('30 jour')) {
            if (p.price_cfa !== 8000) hasOldPrices = true;
            return {
              ...p,
              name: 'Pass Mensuel Pro (30 Jours)',
              price_cfa: 8000,
              duration_days: 30,
              is_vip: false,
              description: 'Formule mensuelle pour une tranquillité totale des chauffeurs pros.',
            };
          }
          return p;
        });

        mappedPlans.sort((a, b) => a.price_cfa - b.price_cfa);
        setPlans(mappedPlans as SubscriptionPlan[]);

        // Si la base contient encore d'anciens prix, tenter une synchronisation automatique en tâche de fond
        if (hasOldPrices) {
          silentUpdateDatabasePlans();
        }
      } else {
        setPlans(OFFICIAL_SUBSCRIPTION_PLANS);
      }

      // 5. Incidents et signalements
      const { data: incData } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (incData) setIncidents(incData as Incident[]);

      // 6. Journal des actions admin
      const { data: logData } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (logData) setAuditLogs(logData as AdminActionLog[]);

      // 7. Boutique (Produits et Commandes)
      const allShopProds = await shopService.getAllProducts();
      setShopProducts(allShopProds);
      
      const { data: shopOrdData } = await supabase
        .from('shop_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (shopOrdData) setShopOrders(shopOrdData);
    } catch (err) {
      console.error('Erreur chargement données admin:', err);
    }
  };

  // Synchronisation des forfaits officiels dans la base de données Supabase
  const executePlansDbSync = async (): Promise<boolean> => {
    try {
      // 1. Pass 24H Essentiel -> 500 F CFA
      await supabase
        .from('subscription_plans')
        .update({
          name: 'Pass 24H Essentiel',
          price_cfa: 500,
          duration_days: 1,
          is_vip: false,
          description: 'Accès illimité aux courses pendant 24 heures. 0% de commission.',
          features: ['Courses illimitées pendant 24h', '0% commission KONDU', 'GPS en temps réel', 'Support standard Lomé'],
          is_active: true
        })
        .or('code.eq.daily_200,code.eq.daily_essentiel_500,name.ilike.%24H Essentiel%');

      // 2. Pass 24H Confort -> 1 000 F CFA
      await supabase
        .from('subscription_plans')
        .update({
          name: 'Pass 24H Confort',
          price_cfa: 1000,
          duration_days: 1,
          is_vip: false,
          description: 'Accès 24H avec support prioritaire et alertes sonores instantanées.',
          features: ['Courses illimitées pendant 24h', '0% commission', 'Visibilité prioritaire passagers', 'Support prioritaire'],
          is_active: true
        })
        .or('code.eq.daily_300,code.eq.daily_confort_1000,name.ilike.%24H Confort%');

      // 3. Pass Hebdomadaire (7 Jours) -> 2 500 F CFA
      await supabase
        .from('subscription_plans')
        .update({
          name: 'Pass Hebdomadaire (7 Jours)',
          price_cfa: 2500,
          duration_days: 7,
          is_vip: false,
          description: 'Formule 7 jours économique et rentable pour chauffeurs réguliers.',
          features: ['Validité 7 jours entiers', '0% commission sur toutes les courses', 'Statut Chauffeur Vérifié', 'Économique : ~357 F/jour'],
          is_active: true
        })
        .or('code.eq.weekly,code.eq.weekly_2500,name.ilike.%Hebdomadaire%');

      // 4. Pass Mensuel Pro (30 Jours) -> 8 000 F CFA
      await supabase
        .from('subscription_plans')
        .update({
          name: 'Pass Mensuel Pro (30 Jours)',
          price_cfa: 8000,
          duration_days: 30,
          is_vip: false,
          description: 'Formule mensuelle pour une tranquillité totale des chauffeurs pros.',
          features: ['Validité 30 jours complets', '0% commission', 'Badge Chauffeur Pro', 'Assistance dédiée 7j/7'],
          is_active: true
        })
        .or('code.eq.monthly,code.eq.monthly_8000,name.ilike.%Mensuel Pro%');

      // 5. KONDU VIP (30 Jours) -> 15 000 F CFA
      await supabase
        .from('subscription_plans')
        .update({
          name: 'KONDU VIP (30 Jours)',
          price_cfa: 15000,
          duration_days: 30,
          is_vip: true,
          description: 'Priorité absolue de matching et visibilité maximale sur la carte.',
          features: ['Priorité n°1 dans le matching', 'Badge exclusif KONDU VIP Doré', 'Visibilité maximale sur la carte', 'Support dédié WhatsApp 24/7'],
          is_active: true
        })
        .or('code.eq.vip_monthly,code.eq.vip_15000,name.ilike.%VIP%');

      return true;
    } catch (e) {
      console.warn('Sync plans warning:', e);
      return false;
    }
  };

  const silentUpdateDatabasePlans = async () => {
    await executePlansDbSync();
  };

  const handleManualSyncPlans = async () => {
    setIsSyncingPlans(true);
    setPlanSyncMessage(null);
    const ok = await executePlansDbSync();
    setIsSyncingPlans(false);
    if (ok) {
      setPlanSyncMessage('✅ Grille tarifaire officielle synchronisée avec succès dans Supabase !');
      setTimeout(() => setPlanSyncMessage(null), 5000);
    } else {
      setPlanSyncMessage('⚠️ Impossible de synchroniser la base (vérifiez vos permissions admin).');
    }
  };

  useEffect(() => {
    loadAdminData();

    const adminGprsChannel = supabase
      .channel('admin-gprs-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'provider_profiles' },
        () => {
          loadAdminData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadAdminData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(adminGprsChannel);
    };
  }, []);

  // Validation ou suspension d'un profil utilisateur
  const handleToggleVerification = async (profileId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', profileId);

      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, is_verified: !currentStatus } : p))
      );

      if (user) {
        await supabase.from('admin_actions').insert({
          admin_id: user.id,
          action_type: !currentStatus ? 'VERIFY_PROFILE' : 'UNVERIFY_PROFILE',
          reason: `Action administrative sur profil ${profileId}`,
          details: { profile_id: profileId, new_status: !currentStatus },
        });
      }
    } catch (err) {
      console.error('Erreur modification vérification:', err);
    }
  };

  // Validation KYC approfondie d'un Chauffeur Partenaire
  const handleValidateProvider = async (providerUserId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'VERIFIED' ? 'PENDING' : 'VERIFIED';
    try {
      await supabase
        .from('provider_profiles')
        .update({
          verification_status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', providerUserId);

      // Met également à jour profiles.is_verified
      await supabase
        .from('profiles')
        .update({ is_verified: nextStatus === 'VERIFIED' })
        .eq('user_id', providerUserId);

      setProviders((prev) =>
        prev.map((p) => (p.user_id === providerUserId ? { ...p, verification_status: nextStatus } : p))
      );

      if (user) {
        await supabase.from('admin_actions').insert({
          admin_id: user.id,
          target_user_id: providerUserId,
          action_type: nextStatus === 'VERIFIED' ? 'APPROVE_PROVIDER' : 'REVOKE_PROVIDER',
          reason: `Statut vérification chauffeur mis à ${nextStatus}`,
          details: { provider_user_id: providerUserId, new_status: nextStatus },
        });
      }
      alert(`Statut chauffeur mis à jour : ${nextStatus}`);
    } catch (err) {
      console.error('Erreur validation chauffeur:', err);
    }
  };

  // Traitement et résolution d'un incident de sécurité
  const handleResolveIncident = async (incidentId: string) => {
    const resolutionNotes = prompt('Indiquez la décision ou note de clôture de cet incident :');
    if (!resolutionNotes) return;

    try {
      await supabase
        .from('incidents')
        .update({
          status: 'RESOLVED',
          resolution: resolutionNotes,
          resolved_by: user?.id || null,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', incidentId);

      setIncidents((prev) =>
        prev.map((inc) => (inc.id === incidentId ? { ...inc, status: 'RESOLVED', resolution: resolutionNotes } : inc))
      );

      if (user) {
        await supabase.from('admin_actions').insert({
          admin_id: user.id,
          action_type: 'RESOLVE_INCIDENT',
          reason: resolutionNotes,
          details: { incident_id: incidentId },
        });
      }
      alert('Signalement classé comme résolu avec succès.');
    } catch (err) {
      console.error('Erreur résolution incident:', err);
    }
  };

  // Modification du rôle d'un utilisateur par l'admin
  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    try {
      await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      setProfiles((prev) =>
        prev.map((p) => (p.user_id === userId ? { ...p, role: newRole } : p))
      );

      if (user) {
        await supabase.from('admin_actions').insert({
          admin_id: user.id,
          target_user_id: userId,
          action_type: 'CHANGE_ROLE',
          reason: `Changement de rôle vers ${newRole}`,
          details: { user_id: userId, new_role: newRole },
        });
      }
      alert(`Rôle mis à jour avec succès : ${newRole}`);
    } catch (err) {
      console.error('Erreur changement rôle:', err);
    }
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery)
  );

  const navItems = [
    { id: 'accueil', label: 'Accueil', icon: Home },
    { id: 'gprs', label: 'Suivi GPRS Direct', icon: Navigation, badge: providers.filter(p => p.is_online).length || 'LIVE' },
    { id: 'ventes', label: 'Ventes', icon: ShoppingBag, badge: shopOrders.length + orders.length },
    { id: 'produits', label: 'Produits', icon: Package, badge: shopProducts.length },
    { id: 'clients', label: 'Clients', icon: Users, badge: profiles.length },
    { id: 'chauffeurs', label: 'Chauffeurs', icon: Car, badge: providers.length },
    { id: 'revenus', label: 'Revenus', icon: DollarSign },
    { id: 'analytiques', label: 'Analytiques', icon: BarChart3 },
    { id: 'marketing', label: 'Marketing', icon: Target },
    { id: 'affiliation', label: 'Affiliation', icon: Share2 },
    { id: 'automatisations', label: 'Automatisations', icon: Zap, badge: incidents.filter((i) => i.status !== 'RESOLVED').length },
    { id: 'plus', label: 'Plus', icon: Info, badge: auditLogs.length },
    { id: 'parametres', label: 'Paramètres', icon: Settings },
  ];

  const currentNavItem = navItems.find((item) => item.id === activeTab) || navItems[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Dynamic Navbar */}
      <div className="w-full md:hidden">
        <Navbar />
      </div>

      {/* Barre de navigation latérale (Sidebar) style épuré et moderne */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-4 space-y-6 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* En-tête Sidebar */}
        <div className="px-3 py-2 flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-wider flex items-center gap-2">
              KONDU <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">ADMIN</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Tableau de bord</p>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="md:hidden p-1 text-slate-500 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bouton de Retour à l'Accueil du Site */}
        <Link
          to="/"
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200/90 transition-all shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <ArrowLeft className="w-4 h-4 text-amber-600" />
            <span>Retour à l'Accueil</span>
          </div>
          <Home className="w-3.5 h-3.5 text-amber-600" />
        </Link>

        {/* Liste des menus de navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as AdminTab);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-50 text-amber-700 font-bold border border-amber-200/80 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (typeof item.badge === 'string' || item.badge > 0) && (
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Pied de Sidebar : Infos Compte Admin */}
        <div className="pt-4 border-t border-slate-200 px-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs border border-amber-200 shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.email || 'Super Admin'}</p>
              <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                En ligne
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Zone de contenu principal à droite */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Topbar Administrateur */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">KONDU ADMINISTRATION</span>
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Système Actif
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
                {currentNavItem.label}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 transition shadow-xs border border-amber-400"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Retour Accueil KONDU</span>
            </Link>
            <button
              onClick={loadAdminData}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center gap-2 border border-slate-200 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
              <span>Actualiser</span>
            </button>
          </div>
        </header>

        {/* Contenu dynamique des Onglets */}
        <main className="p-4 sm:p-6 space-y-6 flex-1">

          {/* === 1. ACCUEIL (Tableau de Bord Général) === */}
          {activeTab === 'accueil' && (
            <div className="space-y-6">
              {/* Cartes de statistiques synthétiques */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Total Utilisateurs Inscrits</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">{profiles.length}</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Chauffeurs Partenaires</span>
                  <span className="text-2xl font-black text-amber-600 mt-1 block">{providers.length}</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Chauffeurs En Ligne (GPS)</span>
                  <span className="text-2xl font-black text-emerald-600 mt-1 block">
                    {providers.filter((p) => p.is_online).length}
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Courses & Commandes</span>
                  <span className="text-2xl font-black text-blue-600 mt-1 block">{orders.length + shopOrders.length}</span>
                </div>
              </div>

              {/* Raccourcis & Vue Rapide */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dernières commandes boutique */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-amber-600" />
                      Ventes Boutique Récentes
                    </h3>
                    <button onClick={() => setActiveTab('ventes')} className="text-xs text-amber-600 font-bold hover:underline">
                      Voir tout ({shopOrders.length})
                    </button>
                  </div>
                  {shopOrders.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">Aucune commande boutique pour le moment.</p>
                  ) : (
                    <div className="space-y-3">
                      {shopOrders.slice(0, 4).map((so) => (
                        <div key={so.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                          <div>
                            <div className="font-bold text-slate-900">{so.customer_name}</div>
                            <div className="text-[10px] text-slate-500">{so.delivery_address}</div>
                          </div>
                          <div className="font-bold text-amber-600 text-sm">{so.total_amount} F</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Courses Récentes */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Car className="w-4 h-4 text-amber-600" />
                      Dernières Courses VTC / Moto
                    </h3>
                    <button onClick={() => setActiveTab('ventes')} className="text-xs text-amber-600 font-bold hover:underline">
                      Voir tout ({orders.length})
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">Aucune course enregistrée.</p>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 4).map((ord) => (
                        <div key={ord.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-900 uppercase">{ord.service_type}</span>
                            <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{ord.pickup_address} &rarr; {ord.dropoff_address}</div>
                          </div>
                          <div className="font-bold text-amber-600">{ord.estimated_price} F</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* === ONGLET SUIVI GPRS DIRECT EN TEMPS RÉEL === */}
          {activeTab === 'gprs' && (
            <div className="space-y-6">
              {/* En-tête du radar GPRS */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Navigation className="w-6 h-6 text-amber-600" />
                      Radar & Suivi GPRS Direct en Temps Réel
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Supervisez en direct la position GPS réelle de vos chauffeurs connectés et suivez les demandes clients actives à Lomé.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadAdminData()}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4 text-amber-600" />
                    <span>Actualiser GPRS</span>
                  </button>
                </div>
              </div>

              {/* Cartes KPI GPRS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-xs font-semibold">Chauffeurs En Ligne</span>
                    <div className="text-2xl font-black text-emerald-600 mt-1">
                      {providers.filter((p) => p.is_online).length}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                      <Radio className="w-3 h-3 animate-pulse" /> Signal GPS GPRS Actif
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Car className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-xs font-semibold">Demandes Clients Actives</span>
                    <div className="text-2xl font-black text-amber-600 mt-1">
                      {orders.filter((o) => o.status === 'searching' || o.status === 'arriving' || o.status === 'in_progress').length}
                    </div>
                    <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-0.5">
                      <Activity className="w-3 h-3" /> En cours de traitement
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center text-amber-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-xs font-semibold">Flotte Chauffeurs VIP</span>
                    <div className="text-2xl font-black text-amber-600 mt-1">
                      {providers.filter((p) => p.is_vip && p.is_online).length}
                    </div>
                    <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-0.5">
                      <Crown className="w-3 h-3 text-amber-600" /> Service de Prestige
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center text-amber-600">
                    <Crown className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-xs font-semibold">Précision Moyenne GPS</span>
                    <div className="text-2xl font-black text-blue-600 mt-1">±5m - 12m</div>
                    <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3" /> Haversine Géodésique
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center text-blue-600">
                    <Navigation className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Grille Carte GPRS & Activités */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Colonne Carte Interactive GPRS (2/3) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-amber-600" />
                        Carte GPRS Interactive de Lomé & Environs
                      </span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Chauffeurs ({providers.filter((p) => p.is_online).length})
                        </span>
                        <span className="flex items-center gap-1 text-blue-600 font-semibold">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Commandes ({orders.filter((o) => o.status === 'searching' || o.status === 'in_progress').length})
                        </span>
                      </div>
                    </div>

                    {/* Carte Leaflet Realtime GPRS */}
                    <LiveMap
                      centerLat={6.1375}
                      centerLng={1.2123}
                      zoom={13}
                      providers={providers.filter((p) => p.is_online)}
                      className="h-[520px] w-full rounded-2xl overflow-hidden shadow-md border border-slate-200"
                    />
                  </div>
                </div>

                {/* Colonne Droite : Flux d'Activités & Chauffeurs (1/3) */}
                <div className="space-y-4">
                  {/* Demandes clients actives */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-600" />
                        Demandes Clients Récentes
                      </span>
                      <span className="bg-amber-100 text-amber-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                        {orders.length}
                      </span>
                    </h3>

                    {orders.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">Aucune demande active en ce moment.</p>
                    ) : (
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {orders.slice(0, 5).map((ord) => (
                          <div key={ord.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 uppercase">{ord.service_type}</span>
                              <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                {ord.estimated_price} F CFA
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px] truncate">
                              📍 De: <strong className="text-slate-800">{ord.pickup_address}</strong>
                            </p>
                            <p className="text-slate-600 text-[11px] truncate">
                              🏁 Vers: <strong className="text-slate-800">{ord.dropoff_address || (ord as any).destination_address}</strong>
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                              <span>Client: {ord.client?.full_name || 'Client Utilisateur'}</span>
                              <span className="text-emerald-600 font-semibold uppercase">{ord.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chauffeurs en ligne GPRS */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                        Chauffeurs GPRS en Ligne
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                        {providers.filter((p) => p.is_online).length} actifs
                      </span>
                    </h3>

                    {providers.filter((p) => p.is_online).length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">Aucun chauffeur en ligne pour le moment.</p>
                    ) : (
                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {providers
                          .filter((p) => p.is_online)
                          .map((prov) => (
                            <div key={prov.id || prov.user_id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                  {prov.profile?.full_name || 'Chauffeur Partenaire'}
                                  {prov.is_vip && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                                </span>
                                <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                  {prov.vehicle_plate || 'TG 1234 AB'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-600">
                                <span>{prov.vehicle_brand} {prov.vehicle_model} ({prov.service_type})</span>
                                <span className="text-emerald-600 font-semibold">⭐ {prov.rating_avg?.toFixed(1) || '5.0'}</span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                                <span>GPS: {prov.current_lat ? prov.current_lat.toFixed(4) : '6.1375'}, {prov.current_lng ? prov.current_lng.toFixed(4) : '1.2123'}</span>
                                {prov.profile?.phone && (
                                  <a href={`tel:${prov.profile.phone}`} className="text-amber-600 font-bold hover:underline flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> Appeler
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === 2. VENTES (Commandes Boutique & Courses VTC) === */}
          {activeTab === 'ventes' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                  Historique Global des Ventes & Commandes
                </h3>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Commandes Boutique en ligne</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Client</th>
                          <th className="p-3">Adresse & Contact</th>
                          <th className="p-3">Montant Total</th>
                          <th className="p-3">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {shopOrders.length === 0 ? (
                          <tr><td colSpan={5} className="p-4 text-center text-slate-500">Aucune commande boutique.</td></tr>
                        ) : (
                          shopOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50">
                              <td className="p-3 font-mono text-[11px] text-slate-500">{new Date(order.created_at).toLocaleString()}</td>
                              <td className="p-3 font-bold text-slate-900">{order.customer_name}</td>
                              <td className="p-3 text-slate-600">{order.customer_phone} - {order.delivery_address}</td>
                              <td className="p-3 font-bold text-amber-600">{order.total_amount} F CFA</td>
                              <td className="p-3 text-emerald-600 font-bold capitalize">{order.status}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-4 border-t border-slate-100">2. Historique des Courses VTC / Moto</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Service</th>
                          <th className="p-3">Trajet</th>
                          <th className="p-3">Statut</th>
                          <th className="p-3">Prix</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.length === 0 ? (
                          <tr><td colSpan={4} className="p-4 text-center text-slate-500">Aucune course enregistrée.</td></tr>
                        ) : (
                          orders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-900 uppercase">{ord.service_type}</td>
                              <td className="p-3 text-slate-600">{ord.pickup_address} &rarr; {ord.dropoff_address}</td>
                              <td className="p-3 text-amber-600 capitalize font-bold">{ord.status}</td>
                              <td className="p-3 font-bold text-amber-600">{ord.estimated_price} F CFA</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === 3. PRODUITS (Catalogue Boutique & Création) === */}
          {activeTab === 'produits' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600" />
                    Catalogue des Produits de la Boutique
                  </h3>
                  <p className="text-xs text-slate-500">Gérez les articles disponibles à la vente en ligne sur KONDU</p>
                </div>
                <button 
                  onClick={() => setShowAddProductModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-2 hover:bg-amber-400 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Ajouter un Produit
                </button>
              </div>

              {shopProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-3">
                  <Package className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">Aucun produit dans le catalogue.</p>
                  <button 
                    onClick={() => setShowAddProductModal(true)}
                    className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200"
                  >
                    Créer le premier produit
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {shopProducts.map((prod) => (
                    <div key={prod.id} className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 flex flex-col group hover:border-amber-400/80 transition">
                      <div className="aspect-square bg-slate-200 flex-shrink-0 relative">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400"><ShoppingBag className="w-10 h-10" /></div>
                        )}
                        <span className={`absolute top-2 right-2 px-2 py-0.5 font-bold text-[10px] rounded-full ${
                          prod.is_active ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {prod.is_active ? 'En ligne' : 'Inactif'}
                        </span>
                        {prod.category && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm text-slate-900 font-bold text-[10px] rounded-lg border border-slate-200 shadow-sm">
                            {prod.category}
                          </span>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="font-bold text-slate-900 text-sm truncate">{prod.name}</div>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{prod.description || 'Aucune description'}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-amber-600 font-black text-base">{Number(prod.price_cfa).toLocaleString()} F CFA</span>
                            <span className="text-[11px] text-slate-500 font-medium">Stock: {prod.stock_quantity ?? 100}</span>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleToggleProductStatus(prod.id, prod.is_active)}
                              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                                prod.is_active
                                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                              }`}
                            >
                              {prod.is_active ? 'Désactiver' : 'Activer'}
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl transition"
                              title="Supprimer le produit"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === 4. CLIENTS (Utilisateurs & Profils) === */}
          {activeTab === 'clients' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-600" />
                    Répertoire des Comptes Clients & Utilisateurs
                  </h3>
                  <p className="text-xs text-slate-500">Total : {profiles.length} utilisateur(s) enregistré(s)</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom, email..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Utilisateur</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Rôle Actuel</th>
                      <th className="p-3">Vérification</th>
                      <th className="p-3">Modifier Rôle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProfiles.map((prof) => (
                      <tr key={prof.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{prof.full_name}</div>
                          <div className="text-[11px] text-slate-500">{prof.email}</div>
                        </td>
                        <td className="p-3 font-mono text-slate-700">{prof.phone || 'Non renseigné'}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            prof.role === 'ADMIN' ? 'bg-red-100 text-red-800 border border-red-200' :
                            prof.role === 'PROVIDER' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            prof.role === 'BUSINESS' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {prof.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleVerification(prof.id, prof.is_verified)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
                              prof.is_verified
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {prof.is_verified ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5" />}
                            <span>{prof.is_verified ? 'Vérifié' : 'Non Vérifié'}</span>
                          </button>
                        </td>
                        <td className="p-3">
                          <select
                            value={prof.role}
                            onChange={(e) => handleChangeRole(prof.user_id, e.target.value as UserRole)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-900 focus:outline-none"
                          >
                            <option value="CLIENT">Passager (CLIENT)</option>
                            <option value="PROVIDER">Chauffeur (PROVIDER)</option>
                            <option value="BUSINESS">Entreprise (BUSINESS)</option>
                            <option value="ADMIN">Super Admin (ADMIN)</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === 5. CHAUFFEURS (Prestataires VTC & Véhicules) === */}
          {activeTab === 'chauffeurs' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-600" />
                Flotte de Chauffeurs Partenaires & Véhicules ({providers.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((prov) => (
                  <div key={prov.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{prov.profile?.full_name || 'Chauffeur'}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        prov.is_online ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {prov.is_online ? 'En Ligne' : 'Hors Ligne'}
                      </span>
                    </div>

                    <p className="text-slate-600">
                      Service : <strong className="text-amber-600 uppercase">{prov.service_type}</strong>
                    </p>
                    <p className="text-slate-600">
                      Véhicule : {prov.vehicle_brand} {prov.vehicle_model} (<strong className="text-amber-700 font-mono">{prov.vehicle_plate || 'TG 1234 AB'}</strong>)
                    </p>
                    <p className="text-slate-600">
                      Abonnement : <strong className="text-slate-900 capitalize">{prov.subscription_status}</strong>
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        prov.profile?.is_verified ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {prov.profile?.is_verified ? '✓ Verified KYC' : '⚠ Non vérifié'}
                      </span>
                      <button
                        onClick={() => handleValidateProvider(prov.user_id, prov.profile?.is_verified ? 'VERIFIED' : 'PENDING')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          prov.profile?.is_verified
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        {prov.profile?.is_verified ? 'Suspendre' : 'Valider Chauffeur'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === 6. REVENUS (Statistiques Financières) === */}
          {activeTab === 'revenus' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Aperçu Financier & Revenus Globaux
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500">Chiffre d'Affaires Boutique</span>
                  <span className="text-2xl font-black text-amber-600 block">
                    {shopOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)} F CFA
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500">Volume Total des Courses VTC</span>
                  <span className="text-2xl font-black text-blue-600 block">
                    {orders.reduce((sum, o) => sum + (o.estimated_price || 0), 0)} F CFA
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500">Abonnements VIP Chauffeurs</span>
                  <span className="text-2xl font-black text-emerald-600 block">
                    {providers.filter(p => p.subscription_status === 'active').length * 15000} F CFA / mois
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* === 7. ANALYTIQUES (Performances & Graphiques - Design Maquette Officielle) === */}
          {activeTab === 'analytiques' && (
            <div className="space-y-6 relative pb-16">
              {/* Carte Principale Analytique */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
                
                {/* 1. Barre Supérieure : Date & Filtre Entonnoir */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-700 shadow-xs">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>August 18, 2026 – September 17, 2026</span>
                  </div>

                  <button className="relative p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 transition shadow-xs">
                    <Filter className="w-4 h-4 text-slate-700" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 border border-white"></span>
                  </button>
                </div>

                {/* 2. Barre de Métriques Sous Forme de Pilules */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition">
                    <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Résumé</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition border border-emerald-200/60">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ventes</span>
                  </button>
                  <button className="flex items-center gap-2 px-4.5 py-2 rounded-full bg-blue-100/90 text-blue-700 text-xs font-bold transition shadow-xs border border-blue-200">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Visites</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold transition border border-sky-200/60">
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    <span>Clients</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold transition border border-amber-200/60">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    <span>Taux de conversion</span>
                  </button>
                </div>

                {/* 3. Graphique Vectoriel Analytique (Courbe et Remplissage Dégradé) */}
                <div className="pt-4 pb-2">
                  <div className="relative w-full h-64 sm:h-72">
                    {/* Grille de fond (Lignes Horizontales) */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-2">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
                        <span className="text-[11px] font-medium text-slate-400 w-8 text-right">0.4</span>
                        <div className="flex-1"></div>
                      </div>
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
                        <span className="text-[11px] font-medium text-slate-400 w-8 text-right">0.2</span>
                        <div className="flex-1"></div>
                      </div>
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                        <span className="text-[11px] font-medium text-slate-400 w-8 text-right">0</span>
                        <div className="flex-1"></div>
                      </div>
                    </div>

                    {/* Rendu Graphique SVG */}
                    <div className="absolute inset-0 pl-10 pt-2 pb-6">
                      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 200">
                        <defs>
                          <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                            <stop offset="40%" stopColor="#fbbf24" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Surface Ombrée en Dégradé */}
                        <path
                          d="M 0,200 L 40,200 Q 75,0 90,20 T 130,200 L 1000,200 Z"
                          fill="url(#amberGradient)"
                        />

                        {/* Ligne Jaune Ambre Principale */}
                        <path
                          d="M 0,200 L 40,200 Q 75,0 90,20 T 130,200 L 1000,200"
                          fill="none"
                          stroke="#eab308"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Axe X (Graduations de dates) */}
                  <div className="pl-10 flex justify-between text-[10px] sm:text-[11px] font-medium text-slate-400 pt-2 border-t border-slate-200 overflow-x-auto">
                    <span>août 18</span>
                    <span>août 20</span>
                    <span>août 22</span>
                    <span>août 24</span>
                    <span>août 26</span>
                    <span>août 28</span>
                    <span>août 30</span>
                    <span>sept. 01</span>
                    <span>sept. 03</span>
                    <span>sept. 05</span>
                    <span>sept. 07</span>
                    <span>sept. 09</span>
                    <span>sept. 11</span>
                    <span>sept. 13</span>
                    <span>sept. 15</span>
                    <span>sept. 17</span>
                  </div>
                </div>

              </div>

              {/* 4. Cartes Côtes à Côte : Visites par pays & Appareils */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Carte Visites par Pays */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Visites par pays</h3>
                  
                  <div className="bg-blue-50/70 hover:bg-blue-50 border border-blue-100/80 p-3.5 rounded-2xl flex items-center justify-between transition">
                    <div className="flex items-center gap-3">
                      <span className="text-xl leading-none">🇹🇬</span>
                      <span className="text-xs font-semibold text-slate-800">Togo</span>
                    </div>
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                  </div>
                </div>

                {/* Carte Appareils */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Appareils</h3>

                  <div className="bg-blue-50/70 hover:bg-blue-50 border border-blue-100/80 p-3.5 rounded-2xl flex items-center justify-between transition">
                    <div className="flex items-center gap-3 text-slate-700">
                      <Monitor className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-semibold text-slate-800">Desktop</span>
                    </div>
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                  </div>
                </div>

              </div>

              {/* 5. Sous-Menu Filtres de Trafic */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm flex flex-wrap items-center gap-3">
                <button className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition">
                  Sources de trafic (Medium)
                </button>
                <button className="px-5 py-2 rounded-full text-xs font-bold bg-slate-900 text-white shadow-sm transition">
                  Sources de trafic
                </button>
                <button className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition">
                  Référents
                </button>
              </div>

              {/* 6. Bouton Flottant de Support / Chat Jaune */}
              <button 
                title="Support en ligne"
                className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 border border-amber-300"
              >
                <MessageSquare className="w-5 h-5 fill-slate-950 text-slate-950" />
              </button>

            </div>
          )}

          {/* === 8. MARKETING (Offres VIP & Abonnements) === */}
          {activeTab === 'marketing' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-600" />
                    Marketing & Tarification VIP (15 000 F / mois)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Grille tarifaire officielle des forfaits chauffeurs et prestataires KONDU Togo.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {planSyncMessage && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                      {planSyncMessage}
                    </span>
                  )}
                  <button
                    onClick={handleManualSyncPlans}
                    disabled={isSyncingPlans}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                  >
                    {isSyncingPlans ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>Synchroniser avec la BDD</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <div 
                    key={plan.id} 
                    className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                      plan.is_vip 
                        ? 'bg-amber-50/70 border-amber-300 shadow-sm ring-1 ring-amber-300/50' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">{plan.name}</h4>
                        {plan.is_vip ? (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                            <Crown className="w-3 h-3 text-amber-600" /> VIP
                          </span>
                        ) : plan.duration_days === 7 ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            ⭐ Populaire
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-black text-amber-600">
                          {plan.price_cfa} F CFA
                        </span>
                        <span className="text-xs text-slate-500">
                          / {plan.duration_days === 1 ? 'jour' : `${plan.duration_days} jours`}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{plan.description}</p>

                      {plan.features && plan.features.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                          {plan.features.map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Code : {plan.code}</span>
                      <span className="text-emerald-600 font-bold">Actif</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === 9. AFFILIATION (Programme Partenaires) === */}
          {activeTab === 'affiliation' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-amber-600" />
                Programme d'Affiliation & Parrainages
              </h3>
              <p className="text-xs text-slate-500">Suivi des liens de parrainage et commissions partenaires.</p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                Aucune campagne de parrainage active pour le moment.
              </div>
            </div>
          )}

          {/* === 10. AUTOMATISATIONS (Signalements & Incidents) === */}
          {activeTab === 'automatisations' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-600" />
                  Gestion des Automatisations & Signalements
                </h3>
                <span className="text-xs text-slate-500">
                  {incidents.filter((i) => i.status !== 'RESOLVED').length} incident(s) en attente
                </span>
              </div>

              {incidents.length === 0 ? (
                <div className="py-10 text-center text-slate-500 space-y-2">
                  <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">Aucun signalement d'incident en cours.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {inc.status}
                          </span>
                          <span className="font-bold text-slate-900 uppercase">{inc.type}</span>
                        </div>
                        <p className="text-slate-700 text-sm">{inc.description}</p>
                      </div>

                      {inc.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleResolveIncident(inc.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                        >
                          Traiter & Clôturer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === 11. PLUS (Journal d'Audit Sécurité) === */}
          {activeTab === 'plus' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Registre Immuable des Actions Administratives</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Horodatage</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Motif</th>
                      <th className="p-3">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.length === 0 ? (
                      <tr><td colSpan={4} className="p-4 text-center text-slate-500">Aucun journal d'audit enregistré.</td></tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-500 font-mono text-[11px]">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="p-3 font-bold text-amber-600">{log.action_type}</td>
                          <td className="p-3 text-slate-800">{log.reason}</td>
                          <td className="p-3 font-mono text-[10px] text-slate-500">{log.details ? JSON.stringify(log.details) : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === 12. PARAMÈTRES (Configuration Système) === */}
          {activeTab === 'parametres' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-600" />
                Paramètres & État du Système KONDU
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-sm">Supabase Backend Status</div>
                  <p className="text-emerald-600 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Connecté (PostgreSQL, Auth, Storage, Realtime)
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-sm">Version de la Plateforme</div>
                  <p className="text-slate-700">KONDU v2.5.0 Production</p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Modal Création Produit */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                Ajouter un nouveau produit en ligne
              </h3>
              <button 
                onClick={handleResetProdForm}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {prodFormError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{prodFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              {/* Nom du produit */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nom du Produit *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="ex: Casque Moto Homologué VIP"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Prix F CFA & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Prix (F CFA) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="ex: 15000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quantité Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="ex: 100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Catégorie du Produit</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="Général">Général</option>
                  <option value="Équipement Moto">Équipement Moto & Casques</option>
                  <option value="Pièces Détachées">Pièces Détachées & Entretien</option>
                  <option value="Accessoires VIP">Accessoires VIP & Automobile</option>
                  <option value="Alimentaire">Alimentaire & Restauration</option>
                  <option value="Technologie">Technologie & High-Tech</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description du Produit</label>
                <textarea
                  rows={3}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Détails du produit, caractéristiques..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Importation Photo / Image */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Photo / Image du Produit</label>
                <p className="text-[11px] text-slate-500 mb-2">Formats acceptés : JPG, PNG, WEBP (Taille max: 5 Mo)</p>

                {prodImagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-amber-500/50 bg-slate-100 aspect-video flex items-center justify-center">
                    <img src={prodImagePreview} alt="Aperçu" className="h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => { setProdImageFile(null); setProdImagePreview(null); }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 hover:border-amber-500 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-amber-600 mb-2" />
                      <p className="text-slate-700 font-medium text-xs">Cliquez ou glissez une image ici</p>
                      <p className="text-slate-400 text-[10px]">PNG, JPG, WEBP jusqu'à 5 Mo</p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,image/webp,image/jpg" 
                      onChange={handleProdImageSelect} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetProdForm}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProd}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-2 transition disabled:opacity-50 shadow-sm"
                >
                  {isSubmittingProd ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Créer le Produit
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assistant IA KONDU Officiel */}
      <KonduAIAssistant />
    </div>
  );
};
