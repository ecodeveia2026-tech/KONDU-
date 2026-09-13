import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
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
  Activity,
  AlertTriangle,
  ShieldCheck
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

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'providers' | 'orders' | 'plans' | 'incidents' | 'audit'>('users');

  // Données globales
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminActionLog[]>([]);
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
    } catch (err) {
      console.error('Erreur chargement données admin:', err);
    }
  };

  useEffect(() => {
    loadAdminData();
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
            onClick={() => setActiveTab('incidents')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'incidents' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Signalements & Incidents ({incidents.filter((i) => i.status !== 'RESOLVED').length})</span>
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

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Journal d'Audit Sécurité ({auditLogs.length})</span>
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
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      prov.profile?.is_verified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {prov.profile?.is_verified ? '✓ Vérifié KYC' : '⚠ Non vérifié'}
                    </span>
                    <button
                      onClick={() => handleValidateProvider(prov.user_id, prov.profile?.is_verified ? 'VERIFIED' : 'PENDING')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        prov.profile?.is_verified
                          ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow'
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

        {/* --- ONGLET 3 : INCIDENTS & SIGNALEMENTS DE SÉCURITÉ --- */}
        {activeTab === 'incidents' && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Signalements et Réclamations de Sécurité</h2>
              </div>
              <span className="text-xs text-slate-400">
                {incidents.filter((i) => i.status !== 'RESOLVED').length} incident(s) en attente
              </span>
            </div>

            {incidents.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-2">
                <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">Aucun incident ou signalement en cours.</p>
                <p className="text-xs text-slate-500">Toutes les opérations se déroulent normalement sur le réseau KONDU.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800 text-xs">
                {incidents.map((inc) => (
                  <div key={inc.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {inc.status}
                        </span>
                        <span className="font-bold text-white uppercase">{inc.type}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(inc.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm">{inc.description}</p>
                      {inc.resolution && (
                        <p className="text-emerald-400 text-xs bg-emerald-500/10 p-2 rounded-lg mt-1">
                          <strong>Résolution :</strong> {inc.resolution}
                        </p>
                      )}
                    </div>

                    {inc.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolveIncident(inc.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow self-start md:self-auto shrink-0"
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

        {/* --- ONGLET 4 : FORFAITS & PRIX --- */}
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

        {/* --- ONGLET 5 : COURSES EN DIRECT --- */}
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

        {/* --- ONGLET 6 : JOURNAL D'AUDIT SÉCURITÉ --- */}
        {activeTab === 'audit' && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Registre Immuable des Décisions Administratives</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Horodatage</th>
                    <th className="p-3">Action Exécutée</th>
                    <th className="p-3">Motif & Justification</th>
                    <th className="p-3">Détails Techniques</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500">
                        Aucun journal d'audit enregistré.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/40">
                        <td className="p-3 text-slate-400 font-mono text-[11px]">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-3 font-bold text-amber-400">
                          {log.action_type}
                        </td>
                        <td className="p-3 text-slate-200">
                          {log.reason}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-slate-400">
                          {log.details ? JSON.stringify(log.details) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
