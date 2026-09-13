import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { LiveMap } from '../../components/LiveMap';
import { NotificationCenter } from '../../components/NotificationCenter';
import { Navbar } from '../../components/Navbar';
import { orderService } from '../../lib/services/orderService';
import { storageService } from '../../lib/services/storageService';
import type { Order, ProviderProfile, ServiceType } from '../../lib/types';
import confetti from 'canvas-confetti';
import { 
  Bike, 
  Car, 
  Zap, 
  Crown, 
  Truck, 
  MapPin, 
  Navigation, 
  Phone, 
  MessageSquare, 
  Star, 
  ShieldCheck, 
  History,
  RotateCw,
  Loader2,
  Camera,
  Heart
} from 'lucide-react';

export const ClientDashboard: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();

  // Coordonnées GPS réelles du client
  const [clientLat, setClientLat] = useState<number>(6.1375); // Lomé par défaut
  const [clientLng, setClientLng] = useState<number>(1.2123);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(true);

  // Prestataires disponibles aux alentours
  const [nearbyProviders, setNearbyProviders] = useState<ProviderProfile[]>([]);
  const [favoriteProviderIds, setFavoriteProviderIds] = useState<string[]>([]);

  // Formulaire de commande
  const [serviceType, setServiceType] = useState<ServiceType>('moto');
  const [pickupAddress, setPickupAddress] = useState('Position actuelle (GPS Lomé)');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Commande active en cours
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Modal d'évaluation
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Historique des courses passées
  const [pastOrders, setPastOrders] = useState<Order[]>([]);

  // Récupération de la position GPS réelle de l'utilisateur
  const fetchRealGps = useCallback(() => {
    setGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setClientLat(pos.coords.latitude);
          setClientLng(pos.coords.longitude);
          setGpsAccuracy(Math.round(pos.coords.accuracy));
          setGpsLoading(false);
        },
        (err) => {
          console.warn('Géolocalisation refusée ou non disponible:', err.message);
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    } else {
      setGpsLoading(false);
    }
  }, []);

  // Chargement des chauffeurs réellement proches avec calcul de distance et priorité VIP
  const loadNearbyProviders = useCallback(async () => {
    try {
      const providers = await orderService.getNearbyAvailableProviders(
        serviceType,
        clientLat,
        clientLng,
        20.0
      );

      // Adaptation au format ProviderProfile pour la carte LiveMap
      const mappedProviders: ProviderProfile[] = providers.map((p) => ({
        id: p.user_id,
        user_id: p.user_id,
        service_type: p.service_type,
        vehicle_brand: p.vehicle_brand,
        vehicle_model: p.vehicle_model,
        vehicle_plate: p.vehicle_plate,
        is_online: true,
        is_available: true,
        current_lat: p.current_lat,
        current_lng: p.current_lng,
        subscription_status: 'active',
        is_vip: p.is_vip,
        rating_avg: p.rating_avg,
        total_ratings: p.total_ratings,
        wallet_balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile: {
          id: p.user_id,
          user_id: p.user_id,
          email: '',
          full_name: p.full_name,
          phone: p.phone,
          whatsapp: p.whatsapp,
          role: 'PROVIDER',
          avatar_url: p.avatar_url,
          is_verified: true,
          created_at: '',
          updated_at: '',
        },
      }));

      setNearbyProviders(mappedProviders);

      if (user) {
        const favs = await orderService.getFavorites(user.id);
        setFavoriteProviderIds(favs);
      }
    } catch (err) {
      console.error('Erreur chargement chauffeurs proches:', err);
    }
  }, [serviceType, clientLat, clientLng, user]);

  // Chargement de la commande active et de l'historique
  const loadOrders = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Commande active non terminée
      const { data: activeData, error: activeErr } = await supabase
        .from('orders')
        .select('*, provider:provider_profiles(*, profile:profiles(*))')
        .eq('client_id', user.id)
        .in('status', ['created', 'searching', 'accepted', 'arriving', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!activeErr) {
        setActiveOrder((activeData as Order) || null);
      }

      // 2. Historique des courses terminées
      const { data: pastData } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', user.id)
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (pastData) {
        setPastOrders(pastData as Order[]);
      }
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
    }
  }, [user]);

  // Initialisation
  useEffect(() => {
    fetchRealGps();
    loadNearbyProviders();
    loadOrders();
  }, [fetchRealGps, loadNearbyProviders, loadOrders]);

  // Écoute en temps réel de la commande active
  useEffect(() => {
    if (!activeOrder?.id) return;

    const channel = supabase
      .channel(`order-live-${activeOrder.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${activeOrder.id}`,
        },
        async (payload) => {
          const updated = payload.new as Order;
          if (updated.status === 'completed') {
            confetti({ particleCount: 80, spread: 60 });
            setShowReviewModal(true);
          }
          await loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrder?.id, loadOrders]);

  // Estimation du tarif indicatif
  const calculateEstimatedFare = () => {
    switch (serviceType) {
      case 'moto': return 500;
      case 'taxi': return 2000;
      case 'tricycle': return 800;
      case 'vip': return 5000;
      case 'moving': return 15000;
      default: return 500;
    }
  };

  // Création d'une nouvelle demande de course
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!dropoffAddress.trim()) {
      alert('Veuillez renseigner l\'adresse ou le repère de destination.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const estimatedPrice = calculateEstimatedFare();

      const { data, error } = await supabase
        .from('orders')
        .insert({
          client_id: user.id,
          service_type: serviceType,
          status: 'searching',
          pickup_address: pickupAddress || 'Position GPS',
          pickup_lat: clientLat,
          pickup_lng: clientLng,
          dropoff_address: dropoffAddress.trim(),
          dropoff_lat: clientLat + 0.02, // Coordonnée estimée
          dropoff_lng: clientLng + 0.02,
          estimated_price: estimatedPrice,
          currency: 'XOF',
          notes: notes.trim() || null,
        })
        .select('*, provider:provider_profiles(*, profile:profiles(*))')
        .single();

      if (error) throw error;

      setActiveOrder(data as Order);
      setDropoffAddress('');
      setNotes('');
      confetti({ particleCount: 50, spread: 50 });
    } catch (err: any) {
      console.error('Erreur création commande:', err);
      alert('Impossible d\'enregistrer la demande: ' + (err.message || 'Erreur réseau'));
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Annulation de la commande
  const handleCancelOrder = async () => {
    if (!activeOrder) return;
    if (!confirm('Êtes-vous sûr de vouloir annuler cette demande de course ?')) return;

    try {
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancelled_by: user?.id,
          cancellation_reason: 'Annulé par le client',
        })
        .eq('id', activeOrder.id);

      setActiveOrder(null);
      await loadOrders();
    } catch (err) {
      console.error('Erreur annulation:', err);
    }
  };

  // Soumission de l'évaluation post-course avec validation
  const handleReviewSubmit = async () => {
    if (!activeOrder?.provider_id || !user) return;
    try {
      const res = await orderService.submitReview(
        activeOrder.id,
        user.id,
        activeOrder.provider_id,
        reviewRating,
        reviewComment
      );

      if (res.success) {
        confetti({ particleCount: 60, spread: 60 });
      }
      setShowReviewModal(false);
      setActiveOrder(null);
      await loadOrders();
    } catch (err) {
      console.error('Erreur envoi avis:', err);
      setShowReviewModal(false);
    }
  };

  // Upload de photo de profil Client
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingPhoto(true);

    try {
      const res = await storageService.uploadAvatar(user.id, file);
      if (res.success) {
        await refreshProfile();
        confetti({ particleCount: 50, spread: 50 });
      } else {
        alert(res.error || 'Erreur lors du téléversement de la photo.');
      }
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Ajout / Retrait des Chauffeurs Favoris
  const handleToggleFavorite = async (providerId: string) => {
    if (!user) return;
    const isFav = favoriteProviderIds.includes(providerId);

    if (isFav) {
      await orderService.removeFavorite(user.id, providerId);
      setFavoriteProviderIds((prev) => prev.filter((id) => id !== providerId));
    } else {
      await orderService.addFavorite(user.id, providerId);
      setFavoriteProviderIds((prev) => [...prev, providerId]);
      confetti({ particleCount: 40, spread: 40 });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* En-tête du Dashboard Client */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            {/* Avatar & Upload Photo Client */}
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-2 border-amber-500/40 overflow-hidden flex items-center justify-center text-amber-400 font-black text-2xl shadow-lg shadow-amber-500/10">
                {profile?.avatar_url || profile?.photo_url ? (
                  <img
                    src={profile.avatar_url || profile.photo_url || ''}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile?.full_name?.charAt(0) || 'P'
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
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Espace Passager</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  0% Commission
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Bonjour, {profile?.full_name || 'Passager'} 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Commandez une course ou suivez votre chauffeur en direct
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchRealGps();
                loadNearbyProviders();
                loadOrders();
              }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Actualiser"
            >
              <RotateCw className="w-5 h-5 text-amber-400" />
            </button>
            <NotificationCenter />
          </div>
        </div>

        {/* Indicateur de position GPS réelle */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <div className={`w-2.5 h-2.5 rounded-full ${gpsLoading ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></div>
            <span>
              <strong>Position GPS :</strong> Lat {clientLat.toFixed(4)}, Lng {clientLng.toFixed(4)}
              {gpsAccuracy && ` (Précision: ±${gpsAccuracy}m)`}
            </span>
          </div>
          <button
            onClick={fetchRealGps}
            className="text-amber-400 hover:underline font-semibold flex items-center gap-1"
          >
            <Navigation className="w-3.5 h-3.5" /> Re-calibrer mon GPS
          </button>
        </div>

        {/* --- COMMANDE ACTIVE EN COURS --- */}
        {activeOrder && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-2 border-amber-500/50 shadow-2xl shadow-amber-500/10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping"></span>
                <div>
                  <h3 className="text-lg font-bold text-white">Course en cours #{activeOrder.id.slice(0, 8)}</h3>
                  <span className="text-xs text-amber-300 uppercase font-semibold">
                    Statut : {activeOrder.status === 'searching' ? 'Recherche d’un chauffeur à proximité...' : 'Chauffeur confirmé'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-amber-400">{activeOrder.estimated_price} F CFA</span>
                <span className="text-[10px] text-slate-400 block">Paiement direct chauffeur</span>
              </div>
            </div>

            {/* Fiche Chauffeur s'il a accepté */}
            {activeOrder.provider ? (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 overflow-hidden flex items-center justify-center font-bold text-xl text-amber-400 shadow">
                    {activeOrder.provider.profile?.avatar_url ? (
                      <img
                        src={activeOrder.provider.profile.avatar_url}
                        alt={activeOrder.provider.profile.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      activeOrder.provider.profile?.full_name?.charAt(0) || 'C'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base">
                        {activeOrder.provider.profile?.full_name || 'Chauffeur Partenaire'}
                      </h4>
                      {activeOrder.provider.is_vip && (
                        <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Crown className="w-3 h-3 text-amber-400" /> VIP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {activeOrder.provider.vehicle_brand} {activeOrder.provider.vehicle_model} • Plaque: <strong className="text-white">{activeOrder.provider.vehicle_plate}</strong>
                    </p>
                    <p className="text-xs text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Note : ⭐ {activeOrder.provider.rating_avg.toFixed(1)}
                    </p>
                  </div>
                </div>

                {/* Boutons d'appel, WhatsApp directs et favoris */}
                <div className="flex items-center gap-2">
                  {activeOrder.provider.profile?.phone && (
                    <a
                      href={`tel:${activeOrder.provider.profile.phone}`}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 shadow"
                    >
                      <Phone className="w-4 h-4 text-amber-400" />
                      <span>Appeler</span>
                    </a>
                  )}
                  {activeOrder.provider.profile?.whatsapp && (
                    <a
                      href={`https://wa.me/${activeOrder.provider.profile.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  {activeOrder.provider?.user_id && (
                    <button
                      onClick={() => handleToggleFavorite(activeOrder.provider!.user_id)}
                      title={favoriteProviderIds.includes(activeOrder.provider!.user_id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                      className={`p-2.5 rounded-xl border transition-colors ${
                        favoriteProviderIds.includes(activeOrder.provider!.user_id)
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                          : "bg-slate-800 text-slate-400 hover:text-white border-slate-700"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${favoriteProviderIds.includes(activeOrder.provider!.user_id) ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin shrink-0 text-amber-400" />
                <span>Nous informons les chauffeurs connectés à proximité de votre position. Veuillez patienter...</span>
              </div>
            )}

            {/* Adresses Départ / Arrivée */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1 font-semibold flex items-center gap-1 text-emerald-400">
                  <MapPin className="w-3.5 h-3.5" /> Point de départ
                </span>
                <span className="text-white font-medium">{activeOrder.pickup_address}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1 font-semibold flex items-center gap-1 text-red-400">
                  <MapPin className="w-3.5 h-3.5" /> Destination
                </span>
                <span className="text-white font-medium">{activeOrder.dropoff_address}</span>
              </div>
            </div>

            {/* Bouton d'annulation */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleCancelOrder}
                className="text-xs text-red-400 hover:text-red-300 hover:underline font-semibold"
              >
                Annuler cette course
              </button>
            </div>
          </div>
        )}

        {/* Grille Principale : Carte Réelle & Formulaire de Commande */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Colonne Gauche : Formulaire de Commande */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-amber-400" />
                Commander un transport
              </h2>

              {/* Sélection du véhicule */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Choix du Véhicule</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setServiceType('moto')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      serviceType === 'moto'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Bike className="w-5 h-5" />
                    <span className="text-xs">Moto-Taxi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('taxi')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      serviceType === 'taxi'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Car className="w-5 h-5" />
                    <span className="text-xs">Taxi Confort</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('tricycle')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      serviceType === 'tricycle'
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Zap className="w-5 h-5" />
                    <span className="text-xs">Tricycle</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setServiceType('vip')}
                    className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-2 ${
                      serviceType === 'vip'
                        ? 'bg-amber-400/25 border-amber-400 text-amber-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-xs">Berline VIP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('moving')}
                    className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-2 ${
                      serviceType === 'moving'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-purple-400" />
                    <span className="text-xs">Déménagement</span>
                  </button>
                </div>
              </div>

              {/* Formulaire Adresses */}
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Point de ramassage
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Ex: Étoile Rouge, en face de la pharmacie"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-400" /> Destination
                  </label>
                  <input
                    type="text"
                    required
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                    placeholder="Ex: Aéroport ou Carrefour Club des Rois"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Instructions chauffeur (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: 2 sacs de voyage, tee-shirt blanc"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tarif Estimé Direct</span>
                    <span className="text-xl font-extrabold text-amber-400">{calculateEstimatedFare()} F CFA</span>
                  </div>
                  <div className="text-right text-[10px] text-emerald-400 font-bold">
                    0 F Commission KONDU
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingOrder || Boolean(activeOrder)}
                  className="w-full gold-gradient-btn py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recherche du chauffeur...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      <span>Lancer la recherche</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Colonne Droite : Carte Interactive en Temps Réel */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-panel p-4 rounded-3xl border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-amber-400" /> Chauffeurs disponibles autour de vous
                </span>
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {nearbyProviders.length} Chauffeurs en ligne
                </span>
              </div>

              <LiveMap
                centerLat={clientLat}
                centerLng={clientLng}
                zoom={14}
                providers={nearbyProviders}
                className="h-[480px] w-full rounded-2xl"
              />
            </div>
          </div>

        </div>

        {/* Historique des courses passées */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <History className="w-5 h-5 text-amber-400" />
            <span>Historique de mes trajets</span>
          </div>

          {pastOrders.length === 0 ? (
            <p className="text-slate-500 text-xs py-4">Aucun trajet passé enregistré.</p>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {pastOrders.map((ord) => (
                <div key={ord.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm capitalize">{ord.service_type}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ord.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {ord.status === 'completed' ? 'Terminé' : 'Annulé'}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1">
                      De : {ord.pickup_address} &rarr; Vers : {ord.dropoff_address}
                    </p>
                    <span className="text-[10px] text-slate-500">{new Date(ord.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="text-right font-extrabold text-amber-400 text-sm">
                    {ord.final_price || ord.estimated_price} F CFA
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Modal d'évaluation post-course */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Votre course est terminée !</h3>
            <p className="text-xs text-slate-400">Comment s'est déroulé votre trajet avec votre chauffeur ?</p>

            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= reviewRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Un commentaire sur le trajet (Optionnel)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              rows={3}
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Plus tard
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                className="flex-1 gold-gradient-btn py-2.5 rounded-xl text-xs font-bold"
              >
                Envoyer ma note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
