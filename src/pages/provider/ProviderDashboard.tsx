import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Navbar } from '../../components/Navbar';
import { NotificationCenter } from '../../components/NotificationCenter';
import { KonduAIAssistant } from '../../components/KonduAIAssistant';
import { locationService } from '../../lib/services/locationService';
import { storageService } from '../../lib/services/storageService';
import { paymentService } from '../../lib/services/paymentService';
import type { Order, SubscriptionPlan } from '../../lib/types';
import { OFFICIAL_SUBSCRIPTION_PLANS } from '../../lib/types';
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
  RotateCw,
  Camera
} from 'lucide-react';
import { DriverTrackingMap } from '../../components/DriverTrackingMap';

export const ProviderDashboard: React.FC = () => {
  const { user, profile, providerProfile, refreshProfile } = useAuth();

  // Statut ONLINE / OFFLINE et GPS
  const [isOnline, setIsOnline] = useState<boolean>(providerProfile?.is_online || false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [lastGpsUpdate, setLastGpsUpdate] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Demandes de courses entrantes en attente
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isAcceptingOrder, setIsAcceptingOrder] = useState<string | null>(null);

  // Gestion des forfaits d'abonnement
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
  const [isActivatingPlan, setIsActivatingPlan] = useState<string | null>(null);

  // Bascule ONLINE / OFFLINE avec gestion du GPS temps réel continu
  const handleToggleOnline = async () => {
    if (!user) return;
    const nextStatus = !isOnline;

    if (nextStatus) {
      // 1. Vérification de l'abonnement
      const isSubActive = providerProfile?.subscription_status?.toUpperCase() === 'ACTIVE';
      if (!isSubActive) {
        setShowSubscriptionModal(true);
        alert('Veuillez activer votre forfait KONDU (à partir de 200 F CFA) pour passer EN LIGNE et recevoir les courses des passagers.');
        return;
      }

      // 2. Démarrage du suivi GPS en continu
      try {
        const initialPos = await locationService.getCurrentPosition();
        setGpsAccuracy(initialPos.accuracy);
        setLastGpsUpdate(new Date().toLocaleTimeString());

        await supabase
          .from('provider_profiles')
          .update({
            is_online: true,
            is_available: true,
            current_lat: initialPos.latitude,
            current_lng: initialPos.longitude,
            location_accuracy: initialPos.accuracy,
            location_updated_at: initialPos.timestamp,
          })
          .eq('user_id', user.id);

        setIsOnline(true);
        await refreshProfile();

        // Lancement du suivi continu
        locationService.startProviderTracking(
          user.id,
          (pos) => {
            setGpsAccuracy(pos.accuracy);
            setLastGpsUpdate(new Date().toLocaleTimeString());
          },
          (err) => {
            console.warn('[ProviderDashboard] Avertissement GPS:', err.message);
          }
        );
      } catch (err: any) {
        alert(err.message || 'Impossible d\'activer le mode EN LIGNE sans autorisation GPS.');
      }
    } else {
      // Arrêt du suivi GPS et passage Hors Ligne
      await locationService.setProviderOffline(user.id);
      setIsOnline(false);
      setGpsAccuracy(null);
      await refreshProfile();
    }
  };

  // Upload de photo de profil vers Supabase Storage
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingPhoto(true);

    try {
      const res = await storageService.uploadAvatar(user.id, file);
      if (res.success) {
        await refreshProfile();
        confetti({ particleCount: 50, spread: 50 });
        alert('Votre photo de profil a été mise à jour avec succès !');
      } else {
        alert(res.error || 'Erreur lors du téléversement de la photo.');
      }
    } catch (err: any) {
      console.error('Erreur téléversement photo:', err);
      alert('Erreur lors du téléversement de la photo.');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  // Arrêt du suivi au démontage
  useEffect(() => {
    return () => {
      locationService.stopTracking();
    };
  }, []);

  // Chargement des forfaits disponibles avec synchronisation des tarifs officiels
  const loadPlans = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_cfa', { ascending: true });

      if (data && data.length > 0) {
        // Aligner les données avec la nouvelle grille tarifaire KONDU tout en conservant les UUID réels
        const mappedPlans = data.map((p) => {
          const code = (p.code || '').toLowerCase();
          const name = (p.name || '').toLowerCase();

          if (code.includes('200') || (name.includes('24h') && name.includes('essentiel'))) {
            return {
              ...p,
              name: 'Pass 24H Essentiel',
              price_cfa: 500,
              duration_days: 1,
              is_vip: false,
              description: 'Accès Chauffeur Pro actif 24h avec courses illimitées. 0% de commission.',
            };
          }
          if (code.includes('300') || (name.includes('24h') && name.includes('confort'))) {
            return {
              ...p,
              name: 'Pass 24H Confort',
              price_cfa: 1000,
              duration_days: 1,
              is_vip: false,
              description: 'Accès 24H avec visibilité prioritaire et alertes sonores instantanées.',
            };
          }
          if (code.includes('weekly') || name.includes('hebdo') || name.includes('7 jour')) {
            return {
              ...p,
              name: 'Pass Hebdomadaire (7 Jours)',
              price_cfa: 2500,
              duration_days: 7,
              is_vip: false,
              description: 'Formule 7 jours ultra-rentable pour chauffeurs actifs et réguliers.',
            };
          }
          if (p.is_vip || code.includes('vip') || name.includes('vip')) {
            return {
              ...p,
              name: 'KONDU VIP (30 Jours)',
              price_cfa: 15000,
              duration_days: 30,
              is_vip: true,
              description: 'Statut prestige n°1 : Priorité absolue de matching et badge KONDU VIP doré.',
            };
          }
          if (code.includes('monthly') || name.includes('mensuel') || name.includes('30 jour')) {
            return {
              ...p,
              name: 'Pass Mensuel Pro (30 Jours)',
              price_cfa: 8000,
              duration_days: 30,
              is_vip: false,
              description: 'Formule mensuelle pour une sérénité totale des chauffeurs professionnels.',
            };
          }
          return p;
        });

        // Ordonner par prix croissant
        mappedPlans.sort((a, b) => a.price_cfa - b.price_cfa);
        setPlans(mappedPlans as SubscriptionPlan[]);
      } else {
        setPlans(OFFICIAL_SUBSCRIPTION_PLANS);
      }
    } catch (err) {
      console.error('Erreur chargement forfaits:', err);
      setPlans(OFFICIAL_SUBSCRIPTION_PLANS);
    }
  }, []);

  // Chargement des commandes entrantes
  const loadOrders = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Commande acceptée en cours par ce chauffeur
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('*, client:profiles!orders_client_id_fkey(*)')
        .eq('provider_id', user.id)
        .in('status', ['PROVIDER_ACCEPTED', 'ARRIVING', 'IN_PROGRESS'])
        .maybeSingle();

      if (currentOrder) {
        setActiveOrder(currentOrder as Order);
      } else {
        setActiveOrder(null);

        // 2. Commandes disponibles en recherche (générales OU adressées spécifiquement à ce chauffeur)
        const { data: searchingOrders } = await supabase
          .from('orders')
          .select('*, client:profiles!orders_client_id_fkey(*)')
          .or(`provider_id.is.null,provider_id.eq.${user.id}`)
          .eq('status', 'SEARCHING')
          .order('created_at', { ascending: false })
          .limit(8);

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
            status: 'PROVIDER_ACCEPTED',
            accepted_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .eq('status', 'SEARCHING')
          .select('*, client:profiles!orders_client_id_fkey(*)')
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
  const handleUpdateOrderStatus = async (newStatus: 'ARRIVING' | 'IN_PROGRESS' | 'COMPLETED') => {
    if (!activeOrder) return;
    try {
      const updates: Record<string, any> = { status: newStatus };
      if (newStatus === 'COMPLETED') {
        updates.completed_at = new Date().toISOString();
        updates.final_price = activeOrder.estimated_price;
      }

      await supabase
        .from('orders')
        .update(updates)
        .eq('id', activeOrder.id);

      if (newStatus === 'COMPLETED') {
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
      const paymentRef = 'PAY-TG-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const res = await paymentService.activateSubscriptionDirectly(user.id, plan, paymentRef);

      if (res.success) {
        await refreshProfile();
        setShowSubscriptionModal(false);
        confetti({ particleCount: 80, spread: 70 });
        alert(`Votre forfait "${plan.name}" (${plan.price_cfa} F CFA) est désormais actif pour ${plan.duration_days} jours !`);
      } else {
        alert('Erreur lors de l\'activation: ' + (res.error || 'Veuillez réessayer.'));
      }
    } catch (err: any) {
      console.error('Erreur activation abonnement:', err);
      alert('Erreur: ' + err.message);
    } finally {
      setIsActivatingPlan(null);
    }
  };

  const isSubActive = providerProfile?.subscription_status?.toUpperCase() === 'ACTIVE';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* En-tête Dashboard Chauffeur Pro */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            {/* Photo de profil & upload */}
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-300 overflow-hidden flex items-center justify-center text-amber-700 font-black text-2xl shadow-sm">
                {profile?.avatar_url || profile?.photo_url ? (
                  <img
                    src={profile.avatar_url || profile.photo_url || ''}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile?.full_name?.charAt(0) || 'K'
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                title="Modifier ma photo"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 shadow transition-transform group-hover:scale-110"
              >
                {isUploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">KONDU PRO</span>
                {providerProfile?.is_vip && (
                  <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <Crown className="w-3 h-3 text-amber-600" /> VIP DORÉ
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {profile?.full_name || 'Chauffeur Partenaire'} 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Véhicule : <strong className="text-slate-800">{providerProfile?.vehicle_brand} {providerProfile?.vehicle_model}</strong> • Plaque : <strong className="text-amber-700 font-mono">{providerProfile?.vehicle_plate || 'TG 1234 AB'}</strong>
              </p>
              {isOnline && gpsAccuracy && (
                <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> GPS Actif (Précision ±{gpsAccuracy}m • {lastGpsUpdate})
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Bouton Bascule ONLINE / OFFLINE */}
            <button
              onClick={handleToggleOnline}
              className={`px-5 py-3 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-md ${
                isOnline
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <Power className={`w-4 h-4 ${isOnline ? 'animate-pulse' : ''}`} />
              <span>{isOnline ? 'EN LIGNE (GPS Actif)' : 'HORS LIGNE'}</span>
            </button>
            <NotificationCenter />
          </div>
        </div>

        {/* Bandeau d'état de l'abonnement */}
        <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
          isSubActive 
            ? 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isSubActive ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
              <h3 className="font-bold text-slate-900 text-base">
                {isSubActive ? 'Abonnement KONDU Actif' : 'Abonnement Inactif ou Expiré'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 max-w-xl">
              {isSubActive
                ? 'Vous recevez toutes les demandes de courses à proximité avec 0% de commission prélevée.'
                : 'Activez votre pass journalier dès 200 F CFA pour recevoir les demandes des clients.'}
            </p>
          </div>

          <button
            onClick={() => setShowSubscriptionModal(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
          >
            <CreditCard className="w-4 h-4" />
            <span>{isSubActive ? 'Renouveler / Passer en VIP' : 'Choisir un Forfait (200F)'}</span>
          </button>
        </div>

        {/* --- COMMANDE ACTIVE EN COURS DE TRAITEMENT PAR LE CHAUFFEUR --- */}
        {activeOrder && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-emerald-500 shadow-lg space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                <h3 className="text-lg font-bold text-slate-900">Course en cours #{activeOrder.id.slice(0, 8)}</h3>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-amber-600">{activeOrder.estimated_price} F CFA</span>
                <span className="text-[10px] text-emerald-700 block font-semibold">100% de vos gains conservés</span>
              </div>
            </div>

            {/* Infos Client */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Passager</span>
                <h4 className="font-bold text-slate-900 text-base mt-0.5">{activeOrder.client?.full_name || 'Client'}</h4>
                <p className="text-xs text-slate-500">Paiement en espèces ou direct</p>
              </div>

              <div className="flex items-center gap-2">
                {activeOrder.client?.phone && (
                  <a
                    href={`tel:${activeOrder.client.phone}`}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-sm"
                  >
                    <Phone className="w-4 h-4 text-amber-600" />
                    <span>Appeler le Client</span>
                  </a>
                )}
                {activeOrder.client?.whatsapp && (
                  <a
                    href={`https://wa.me/${activeOrder.client.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            {/* Itinéraire */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-emerald-700 font-semibold block mb-1">Ramassage :</span>
                <span className="text-slate-900">{activeOrder.pickup_address}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-red-700 font-semibold block mb-1">Destination :</span>
                <span className="text-slate-900">{activeOrder.dropoff_address}</span>
              </div>
            </div>

            {/* GPRS Navigation Ultra-Pro */}
            <div className="mt-4 rounded-2xl overflow-hidden border border-amber-300 shadow-lg">
              <DriverTrackingMap
                driverLat={providerProfile?.current_lat ?? null}
                driverLng={providerProfile?.current_lng ?? null}
                pickupLat={activeOrder.pickup_lat}
                pickupLng={activeOrder.pickup_lng}
                pickupAddress={activeOrder.pickup_address}
                dropoffLat={activeOrder.dropoff_lat ?? null}
                dropoffLng={activeOrder.dropoff_lng ?? null}
                dropoffAddress={activeOrder.dropoff_address}
                orderStatus={activeOrder.status}
                clientName={activeOrder.client?.full_name || 'Client'}
                estimatedPrice={activeOrder.estimated_price}
              />
            </div>

            {/* Boutons d'avancement de la course */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {activeOrder.status === 'PROVIDER_ACCEPTED' && (
                <button
                  onClick={() => handleUpdateOrderStatus('ARRIVING')}
                  className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm"
                >
                  Je suis arrivé au point de ramassage &rarr;
                </button>
              )}

              {activeOrder.status === 'ARRIVING' && (
                <button
                  onClick={() => handleUpdateOrderStatus('IN_PROGRESS')}
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
                >
                  Le client est à bord / Démarrer le trajet &rarr;
                </button>
              )}

              {activeOrder.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleUpdateOrderStatus('COMPLETED')}
                  className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md"
                >
                  Terminer la course & Encaisser {activeOrder.estimated_price} F &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {/* --- DEMANDES DE COURSES EN ATTENTE DE CHAUFFEUR --- */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-slate-900">Demandes de courses en direct</h2>
            </div>
            <button
              onClick={loadOrders}
              className="text-xs text-amber-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCw className="w-3.5 h-3.5" /> Actualiser le flux
            </button>
          </div>

          {!isOnline ? (
            <div className="p-8 text-center text-slate-600 space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
              <Power className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-base font-bold text-slate-800">Vous êtes actuellement Hors Ligne</p>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Passez en mode <span className="text-emerald-600 font-semibold">"EN LIGNE"</span> pour partager votre géolocalisation et recevoir les courses disponibles autour de vous.
              </p>
            </div>
          ) : availableOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-600 space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
              <Clock className="w-10 h-10 text-amber-600 mx-auto animate-pulse" />
              <p className="text-base font-bold text-slate-800">En attente de nouvelles demandes...</p>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">Les courses de passagers s'afficheront ici instantanément en temps réel dès qu'une commande est passée.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableOrders.map((ord) => (
                <div
                  key={ord.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    ord.provider_id === user?.id
                      ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-orange-500/10 border-2 border-amber-400 shadow-md'
                      : 'bg-slate-50 border-slate-200 hover:border-amber-400'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm capitalize">{ord.service_type}</span>
                      {ord.provider_id === user?.id && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 flex items-center gap-1 shadow-xs animate-pulse">
                          ⚡ Course Directe (Spécialement pour vous)
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {ord.client?.full_name && (
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <span>Passager :</span> <span className="text-amber-700">{ord.client.full_name}</span>
                        {ord.client.phone && <span className="text-slate-500 font-normal">({ord.client.phone})</span>}
                      </p>
                    )}

                    <p className="text-xs text-slate-700">
                      <strong>Départ :</strong> {ord.pickup_address}
                    </p>
                    <p className="text-xs text-slate-700">
                      <strong>Arrivée :</strong> {ord.dropoff_address}
                    </p>
                    {ord.notes && (
                      <p className="text-[11px] text-slate-500 italic">
                        Note passager : "{ord.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-lg font-black text-amber-600">{ord.estimated_price} F CFA</span>
                      <span className="text-[10px] text-emerald-600 block font-bold">0% Commission</span>
                    </div>

                    <button
                      onClick={() => handleAcceptOrder(ord.id)}
                      disabled={isAcceptingOrder === ord.id || !isSubActive}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-sm disabled:opacity-50"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-lg">Forfaits Chauffeur KONDU PRO</h3>
              </div>
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="text-slate-400 hover:text-slate-900 text-xs"
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
                      ? 'bg-amber-50 border-amber-300 shadow-sm'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 text-sm">{plan.name}</h4>
                      {plan.is_vip && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-amber-200">
                          <Crown className="w-2.5 h-2.5" /> VIP
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-black text-amber-600">{plan.price_cfa} F CFA</p>
                    <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                  </div>

                  <button
                    onClick={() => handleSubscribePlan(plan)}
                    disabled={isActivatingPlan === plan.id}
                    className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-sm transition"
                  >
                    {isActivatingPlan === plan.id ? 'Activation en cours...' : `Activer (${plan.price_cfa} F)`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assistant IA KONDU Officiel */}
      <KonduAIAssistant />
    </div>
  );
};
