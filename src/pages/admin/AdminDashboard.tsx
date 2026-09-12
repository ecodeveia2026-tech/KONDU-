import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Navbar } from '../../components/Navbar';
import type { Profile, ProviderProfile, Order, SubscriptionPlan, UserRole } from '../../lib/types';
import { 
  Users, 
  Car, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Crown, 
  Search, 
  RefreshCw,
  Activity
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'providers' | 'orders' | 'plans'>('users');

  // Données globales
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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

      // 4. Plans d'abonnements
      const { data: planData } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_cfa', { ascending: true });

      if (planData) setPlans(planData as SubscriptionPlan[]);
    } catch (err) {
      console.error('Erreur chargement données admin:', err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Validation ou suspension d'un profil
  const handleToggleVerification = async (profileId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', profileId);

      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, is_verified: !currentStatus } : p))
      );
    } catch (err) {
      console.error('Erreur modification vérification:', err);
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* En-tête Administration */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">CONSOLE D'ADMINISTRATION GLOBALE</span>
              <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                Accès Super Admin
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Supervision & Paramètres KONDU 🛡️
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Gestion des comptes, validation des prestataires, modération des forfaits et audit
            </p>
          </div>

          <button
            onClick={loadAdminData}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 border border-slate-700 self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span>Actualiser</span>
          </button>
        </div>

        {/* Statistiques Globales Réelles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Total Utilisateurs Inscrits</span>
            <span className="text-2xl font-black text-white mt-1 block">{profiles.length}</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Chauffeurs Partenaires</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">{providers.length}</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Chauffeurs Actifs / En Ligne</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">
              {providers.filter((p) => p.is_online).length}
            </span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Total Courses Enregistrées</span>
            <span className="text-2xl font-black text-blue-400 mt-1 block">{orders.length}</span>
          </div>
        </div>

        {/* Onglets de navigation Admin */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Utilisateurs ({profiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('providers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'providers' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Chauffeurs Pro ({providers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'orders' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Courses Récentes ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'plans' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Grille Forfaits & Tarifs</span>
          </button>
        </div>

        {/* --- ONGLET 1 : GESTION DES UTILISATEURS --- */}
        {activeTab === 'users' && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">Répertoire des comptes utilisateurs</h2>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, email..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Utilisateur</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Rôle Actuel</th>
                    <th className="p-3">Statut Vérification</th>
                    <th className="p-3">Actions Rôle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredProfiles.map((prof) => (
                    <tr key={prof.id} className="hover:bg-slate-900/40">
                      <td className="p-3">
                        <div className="font-bold text-white">{prof.full_name}</div>
                        <div className="text-[11px] text-slate-500">{prof.email}</div>
                      </td>
                      <td className="p-3 font-mono">{prof.phone || 'Non renseigné'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          prof.role === 'ADMIN' ? 'bg-red-500/20 text-red-300' :
                          prof.role === 'PROVIDER' ? 'bg-amber-500/20 text-amber-300' :
                          prof.role === 'BUSINESS' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {prof.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleVerification(prof.id, prof.is_verified)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            prof.is_verified
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {prof.is_verified ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3" />}
                          <span>{prof.is_verified ? 'Vérifié' : 'Non Vérifié'}</span>
                        </button>
                      </td>
                      <td className="p-3">
                        <select
                          value={prof.role}
                          onChange={(e) => handleChangeRole(prof.user_id, e.target.value as UserRole)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
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

        {/* --- ONGLET 2 : PRESTATAIRES & CHAUFFEURS --- */}
        {activeTab === 'providers' && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800">
              Flotte de Chauffeurs Partenaires & Véhicules
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((prov) => (
                <div key={prov.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{prov.profile?.full_name || 'Chauffeur'}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      prov.is_online ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {prov.is_online ? 'En Ligne' : 'Hors Ligne'}
                    </span>
                  </div>

                  <p className="text-slate-400">
                    Service : <strong className="text-amber-400 uppercase">{prov.service_type}</strong>
                  </p>
                  <p className="text-slate-400">
                    Véhicule : {prov.vehicle_brand} {prov.vehicle_model} ({prov.vehicle_plate})
                  </p>
                  <p className="text-slate-400">
                    Abonnement : <strong className="text-white capitalize">{prov.subscription_status}</strong>
                  </p>
                  <p className="text-slate-400">
                    Note : ⭐ {prov.rating_avg.toFixed(1)} ({prov.total_ratings} avis)
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ONGLET 3 : FORFAITS & PRIX --- */}
        {activeTab === 'plans' && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800">
              Configuration des Forfaits d'Abonnements Chauffeur
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div key={plan.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm">{plan.name}</h3>
                    {plan.is_vip && <Crown className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-2xl font-black text-amber-400">{plan.price_cfa} F CFA</p>
                  <p className="text-xs text-slate-400">Durée : {plan.duration_days} jours</p>
                  <p className="text-xs text-slate-500">{plan.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ONGLET 4 : COURSES EN DIRECT --- */}
        {activeTab === 'orders' && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800">
              Journal des courses récentes sur la plateforme
            </h2>

            <div className="divide-y divide-slate-800 text-xs">
              {orders.map((ord) => (
                <div key={ord.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-white uppercase">{ord.service_type}</span> • Statut : <strong className="text-amber-400 capitalize">{ord.status}</strong>
                    <p className="text-slate-400 mt-0.5">
                      {ord.pickup_address} &rarr; {ord.dropoff_address}
                    </p>
                  </div>
                  <div className="font-bold text-amber-400 text-sm">
                    {ord.estimated_price} F CFA
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
