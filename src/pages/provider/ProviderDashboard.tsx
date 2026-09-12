import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Navbar } from '../../components/Navbar';
import { NotificationCenter } from '../../components/NotificationCenter';
import type { Order, SubscriptionPlan } from '../../lib/types';
import confetti from 'canvas-confetti';
import { 
  Power, 
  Navigation, 
  Crown, 
  CreditCard, 
  Phone, 
  MessageSquare, 
  Clock, 
  Loader2, 
  RotateCw
} from 'lucide-react';

export const ProviderDashboard: React.FC = () => {
  const { user, profile, providerProfile, refreshProfile } = useAuth();

  // Statut ONLINE / OFFLINE et GPS
  const [isOnline, setIsOnline] = useState<boolean>(providerProfile?.is_online || false);

  // Demandes de courses entrantes en attente
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isAcceptingOrder, setIsAcceptingOrder] = useState<string | null>(null);

  // Gestion des forfaits d'abonnement
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
  const [isActivatingPlan, setIsActivatingPlan] = useState<string | null>(null);

  // Bascule ONLINE / OFFLINE avec gestion du GPS
  const handleToggleOnline = async () => {
    if (!user) return;
    const nextStatus = !isOnline;

    if (nextStatus) {
      // Demande de géolocalisation
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            await supabase
              .from('provider_profiles')
              .update({
                is_online: true,
                current_lat: lat,
                current_lng: lng,
                location_updated_at: new Date().toISOString(),
              })
              .eq('user_id', user.id);

            setIsOnline(true);
            await refreshProfile();
          },
          (err) => {
            alert('Impossible d\'activer le mode EN LIGNE sans autorisation GPS.');
            console.warn('GPS refusé:', err);
          },
          { enableHighAccuracy: true }
        );
      }
    } else {
      await supabase
        .from('provider_profiles')
        .update({ is_online: false })
        .eq('user_id', user.id);

      setIsOnline(false);
      await refreshProfile();
    }
  };

  // Chargement des forfaits disponibles
  const loadPlans = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_cfa', { ascending: true });

      if (data) {
        setPlans(data as SubscriptionPlan[]);
      }
    } catch (err) {
      console.error('Erreur chargement forfaits:', err);
    }
  }, []);

  // Chargement des commandes entrantes
  const loadOrders = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Commande acceptée en cours par ce chauffeur
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('*, client:profiles(*)')
        .eq('provider_id', user.id)
        .in('status', ['accepted', 'arriving', 'in_progress'])
        .maybeSingle();

      if (currentOrder) {
        setActiveOrder(currentOrder as Order);
      } else {
        setActiveOrder(null);

        // 2. Commandes disponibles en recherche
        const { data: searchingOrders } = await supabase
          .from('orders')
          .select('*, client:profiles(*)')
          .eq('status', 'searching')
          .order('created_at', { ascending: false })
          .limit(5);

        if (searchingOrders) {
          setAvailableOrders(searchingOrders as Order[]);
        }
      }
    } catch (err) {
      console.error('Erreur chargement commandes chauffeur:', err);
    }
  }, [user]);

  useEffect(() => {
    loadPlans();
    loadOrders();

    if (!user) return;

    // Écoute en temps réel des nouvelles commandes
    const channel = supabase
      .channel('orders-provider-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadPlans, loadOrders]);

  // Acceptation atomique d'une course
  const handleAcceptOrder = async (orderId: string) => {
    if (!user) return;
    setIsAcceptingOrder(orderId);

    try {
      // Tentative via la fonction atomique SQL
      const { data, error } = await supabase.rpc('accept_order_atomically', {
        p_order_id: orderId,
        p_provider_id: user.id,
      });

      if (error || (data && !data.success)) {
        // Fallback avec mise à jour conditionnelle si la fonction RPC n'est pas encore créée en base distante
        const { data: updateData, error: updateErr } = await supabase
          .from('orders')
          .update({
            provider_id: user.id,
            status: 'accepted',
            accepted_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .eq('status', 'searching')
          .select('*, client:profiles(*)')
          .single();

        if (updateErr) {
          alert('Cette course a déjà été acceptée par un autre chauffeur.');
        } else {
          setActiveOrder(updateData as Order);
          confetti({ particleCount: 70, spread: 70 });
        }
      } else {
        confetti({ particleCount: 70, spread: 70 });
        await loadOrders();
      }
    } catch (err: any) {
      console.error('Erreur acceptation:', err);
      alert('Erreur: ' + (err.message || 'Impossible d\'accepter la course'));
    } finally {
      setIsAcceptingOrder(null);
    }
  };

  // Mise à jour de l'état de la course en cours
  const handleUpdateOrderStatus = async (newStatus: 'arriving' | 'in_progress' | 'completed') => {
    if (!activeOrder) return;
    try {
      const updates: Record<string, any> = { status: newStatus };
      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
        updates.final_price = activeOrder.estimated_price;
      }

      await supabase
        .from('orders')
        .update(updates)
        .eq('id', activeOrder.id);

      if (newStatus === 'completed') {
        confetti({ particleCount: 100, spread: 80 });
        setActiveOrder(null);
      }
      await loadOrders();
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
    }
  };

  // Souscription ou activation de forfait d'abonnement
  const handleSubscribePlan = async (plan: SubscriptionPlan) => {
    if (!user) return;
    setIsActivatingPlan(plan.id);

    try {
      const now = new Date();
      const expires = new Date();
      expires.setDate(now.getDate() + plan.duration_days);

      // Création de l'enregistrement d'abonnement
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        starts_at: now.toISOString(),
        expires_at: expires.toISOString(),
        amount_paid: plan.price_cfa,
        currency: 'XOF',
        payment_reference: 'PAY-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      });

      // Mise à jour du profil prestataire
      await supabase
        .from('provider_profiles')
        .update({
          subscription_status: 'active',
          is_vip: plan.is_vip,
          vip_expires_at: plan.is_vip ? expires.toISOString() : null,
        })
        .eq('user_id', user.id);

      await refreshProfile();
      setShowSubscriptionModal(false);
      confetti({ particleCount: 80, spread: 70 });
      alert(`Votre forfait "${plan.name}" est désormais actif pour ${plan.duration_days} jours !`);
    } catch (err: any) {
      console.error('Erreur activation abonnement:', err);
      alert('Erreur: ' + err.message);
    } finally {
      setIsActivatingPlan(null);
    }
  };

  const isSubActive = providerProfile?.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* En-tête Dashboard Chauffeur Pro */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">KONDU PRO</span>
              {providerProfile?.is_vip && (
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Crown className="w-3 h-3 text-amber-400" /> VIP DORÉ
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {profile?.full_name || 'Chauffeur Partenaire'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Véhicule : <strong className="text-slate-200">{providerProfile?.vehicle_brand} {providerProfile?.vehicle_model}</strong> • Plaque : <strong className="text-amber-400">{providerProfile?.vehicle_plate}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Bouton Bascule ONLINE / OFFLINE */}
            <button
              onClick={handleToggleOnline}
              className={`px-5 py-3 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg ${
                isOnline
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
              }`}
            >
              <Power className={`w-4 h-4 ${isOnline ? 'animate-pulse' : ''}`} />
              <span>{isOnline ? 'EN LIGNE (GPS Actif)' : 'HORS LIGNE'}</span>
            </button>
            <NotificationCenter />
          </div>
        </div>

        {/* Bandeau d'état de l'abonnement */}
        <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl ${
          isSubActive 
            ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border-amber-500/30' 
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isSubActive ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
              <h3 className="font-bold text-white text-base">
                {isSubActive ? 'Abonnement KONDU Actif' : 'Abonnement Inactif ou Expiré'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              {isSubActive
                ? 'Vous recevez toutes les demandes de courses à proximité avec 0% de commission prélevée.'
                : 'Activez votre pass journalier dès 200 F CFA pour recevoir les demandes des clients.'}
            </p>
          </div>

          <button
            onClick={() => setShowSubscriptionModal(true)}
            className="px-5 py-2.5 rounded-xl gold-gradient-btn text-xs font-bold flex items-center justify-center gap-2 shadow"
          >
            <CreditCard className="w-4 h-4" />
            <span>{isSubActive ? 'Renouveler / Passer en VIP' : 'Choisir un Forfait (200F)'}</span>
          </button>
        </div>

        {/* --- COMMANDE ACTIVE EN COURS DE TRAITEMENT PAR LE CHAUFFEUR --- */}
        {activeOrder && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                <h3 className="text-lg font-bold text-white">Course en cours #{activeOrder.id.slice(0, 8)}</h3>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-amber-400">{activeOrder.estimated_price} F CFA</span>
                <span className="text-[10px] text-emerald-400 block font-semibold">100% de vos gains conservés</span>
              </div>
            </div>

            {/* Infos Client */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Passager</span>
                <h4 className="font-bold text-white text-base mt-0.5">{activeOrder.client?.full_name || 'Client'}</h4>
                <p className="text-xs text-slate-400">Paiement en espèces ou direct</p>
              </div>

              <div className="flex items-center gap-2">
                {activeOrder.client?.phone && (
                  <a
                    href={`tel:${activeOrder.client.phone}`}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                  >
                    <Phone className="w-4 h-4 text-amber-400" />
                    <span>Appeler le Client</span>
                  </a>
                )}
                {activeOrder.client?.whatsapp && (
                  <a
                    href={`https://wa.me/${activeOrder.client.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            {/* Itinéraire */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-emerald-400 font-semibold block mb-1">Ramassage :</span>
                <span className="text-white">{activeOrder.pickup_address}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-red-400 font-semibold block mb-1">Destination :</span>
                <span className="text-white">{activeOrder.dropoff_address}</span>
              </div>
            </div>

            {/* Boutons d'avancement de la course */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {activeOrder.status === 'accepted' && (
                <button
                  onClick={() => handleUpdateOrderStatus('arriving')}
                  className="px-5 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Je suis arrivé au point de ramassage &rarr;
                </button>
              )}

              {activeOrder.status === 'arriving' && (
                <button
                  onClick={() => handleUpdateOrderStatus('in_progress')}
                  className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  Le client est à bord / Démarrer le trajet &rarr;
                </button>
              )}

              {activeOrder.status === 'in_progress' && (
                <button
                  onClick={() => handleUpdateOrderStatus('completed')}
                  className="px-6 py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25"
                >
                  Terminer la course & Encaisser {activeOrder.estimated_price} F &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {/* --- DEMANDES DE COURSES EN ATTENTE DE CHAUFFEUR --- */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Demandes de courses en direct</h2>
            </div>
            <button
              onClick={loadOrders}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCw className="w-3.5 h-3.5" /> Actualiser le flux
            </button>
          </div>

          {!isOnline ? (
            <div className="p-8 text-center text-slate-400 space-y-3">
              <Power className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Vous êtes actuellement Hors Ligne</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Passez en mode "EN LIGNE" pour partager votre géolocalisation et recevoir les courses disponibles autour de vous.
              </p>
            </div>
          ) : availableOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Clock className="w-8 h-8 text-amber-400/60 mx-auto animate-pulse" />
              <p className="text-sm text-slate-300 font-semibold">En attente de nouvelles demandes...</p>
              <p className="text-xs text-slate-500">Les courses s'afficheront ici instantanément en temps réel.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm capitalize">{ord.service_type}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      <strong>Départ :</strong> {ord.pickup_address}
                    </p>
                    <p className="text-xs text-slate-300">
                      <strong>Arrivée :</strong> {ord.dropoff_address}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-lg font-black text-amber-400">{ord.estimated_price} F CFA</span>
                      <span className="text-[10px] text-emerald-400 block font-bold">0% Commission</span>
                    </div>

                    <button
                      onClick={() => handleAcceptOrder(ord.id)}
                      disabled={isAcceptingOrder === ord.id || !isSubActive}
                      className="px-5 py-2.5 rounded-xl gold-gradient-btn text-xs font-extrabold shadow disabled:opacity-50"
                    >
                      {isAcceptingOrder === ord.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Accepter la course</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Modal de sélection et d'activation de forfait */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-lg">Forfaits Chauffeur KONDU PRO</h3>
              </div>
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Fermer &times;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between ${
                    plan.is_vip
                      ? 'bg-amber-400/10 border-amber-400/50 shadow-lg shadow-amber-400/10'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-white text-sm">{plan.name}</h4>
                      {plan.is_vip && (
                        <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5" /> VIP
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-black text-amber-400">{plan.price_cfa} F CFA</p>
                    <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
                  </div>

                  <button
                    onClick={() => handleSubscribePlan(plan)}
                    disabled={isActivatingPlan === plan.id}
                    className="mt-5 w-full py-2.5 rounded-xl gold-gradient-btn text-xs font-extrabold shadow"
                  >
                    {isActivatingPlan === plan.id ? 'Activation en cours...' : `Activer (${plan.price_cfa} F)`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
