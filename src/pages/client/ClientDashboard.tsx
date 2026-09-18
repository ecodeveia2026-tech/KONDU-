import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Heart,
  Filter,
  Search,
  Compass,
  ChevronDown,
  ChevronUp,
  Clock,
  Radio,
  Check,
  X
} from 'lucide-react';

export const ClientDashboard: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const urlService = searchParams.get('service') as ServiceType | null;

  // Coordonnées GPS réelles du client
  const [clientLat, setClientLat] = useState<number>(6.1375); // Lomé par défaut
  const [clientLng, setClientLng] = useState<number>(1.2123);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(true);

  // Prestataires disponibles aux alentours
  const [nearbyProviders, setNearbyProviders] = useState<ProviderProfile[]>([]);
  const [favoriteProviderIds, setFavoriteProviderIds] = useState<string[]>([]);

  // Filtres de recherche des chauffeurs à proximité
  const [filterRadiusKm, setFilterRadiusKm] = useState<number>(5); // 1, 3, 5, 10, 30 km
  const [filterServiceType, setFilterServiceType] = useState<ServiceType | 'all'>('all');
  const [filterVipOnly, setFilterVipOnly] = useState<boolean>(false);
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState<boolean>(false);
  const [filterSearchQuery, setFilterSearchQuery] = useState<string>('');
  const [filterSortBy, setFilterSortBy] = useState<'distance' | 'rating'>('distance');
  const [showDriverList, setShowDriverList] = useState<boolean>(true);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // Formulaire de commande (pré-sélectionné si passé dans l'URL)
  const [serviceType, setServiceType] = useState<ServiceType>(urlService || 'moto');
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
      // On charge tous les types de chauffeurs disponibles dans un rayon large pour alimenter le filtre en direct
      const providers = await orderService.getNearbyAvailableProviders(
        'all',
        clientLat,
        clientLng,
        30.0
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
        subscription_status: 'ACTIVE',
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
  }, [clientLat, clientLng, user]);

  // Calcul mémorisé des chauffeurs filtrés et triés selon les critères du passager
  const filteredAndSortedProviders = useMemo(() => {
    return nearbyProviders
      .map((p) => {
        const distKm = (p.current_lat && p.current_lng)
          ? orderService.calculateHaversineDistance(clientLat, clientLng, p.current_lat, p.current_lng)
          : 999;
        
        // Estimation de la durée d'approche (base 25 km/h circulation Lomé)
        const durationMin = Math.max(1, Math.round((distKm / 25) * 60));

        return {
          ...p,
          calculatedDistanceKm: distKm,
          calculatedDurationMinutes: durationMin
        };
      })
      .filter((p) => {
        // 1. Rayon de distance
        if (p.calculatedDistanceKm > filterRadiusKm) return false;

        // 2. Type de véhicule
        if (filterServiceType !== 'all' && p.service_type !== filterServiceType) return false;

        // 3. Option VIP uniquement
        if (filterVipOnly && !p.is_vip) return false;

        // 4. Option Favoris uniquement
        if (filterFavoritesOnly && !favoriteProviderIds.includes(p.user_id)) return false;

        // 5. Recherche textuelle
        if (filterSearchQuery.trim()) {
          const q = filterSearchQuery.toLowerCase();
          const name = p.profile?.full_name?.toLowerCase() || '';
          const brand = p.vehicle_brand?.toLowerCase() || '';
          const model = p.vehicle_model?.toLowerCase() || '';
          const plate = p.vehicle_plate?.toLowerCase() || '';
          if (!name.includes(q) && !brand.includes(q) && !model.includes(q) && !plate.includes(q)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (filterSortBy === 'distance') {
          if (a.is_vip !== b.is_vip) return a.is_vip ? -1 : 1; // Priorité aux chauffeurs VIP
          return a.calculatedDistanceKm - b.calculatedDistanceKm;
        } else {
          return (b.rating_avg || 5) - (a.rating_avg || 5);
        }
      });
  }, [nearbyProviders, clientLat, clientLng, filterRadiusKm, filterServiceType, filterVipOnly, filterFavoritesOnly, filterSearchQuery, filterSortBy, favoriteProviderIds]);

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

  // Initialisation et écoute GPS Realtime des chauffeurs à proximité
  useEffect(() => {
    fetchRealGps();
    loadNearbyProviders();
    loadOrders();

    const providerChannel = supabase
      .channel('live-provider-locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'provider_profiles',
        },
        () => {
          loadNearbyProviders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(providerChannel);
    };
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
        alert('Votre photo de profil a été mise à jour avec succès !');
      } else {
        alert(res.error || 'Erreur lors du téléversement de la photo.');
      }
    } catch (err: any) {
      console.error('Erreur téléversement photo client:', err);
      alert('Erreur lors du téléversement de la photo.');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* En-tête du Dashboard Client */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            {/* Avatar & Upload Photo Client */}
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-300 overflow-hidden flex items-center justify-center text-amber-700 font-black text-2xl shadow-sm">
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
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Espace Passager</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  0% Commission
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Bonjour, {profile?.full_name || 'Passager'} 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
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
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm transition-colors"
              title="Actualiser"
            >
              <RotateCw className="w-5 h-5 text-amber-600" />
            </button>
            <NotificationCenter />
          </div>
        </div>

        {/* Indicateur de position GPS réelle */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <div className={`w-2.5 h-2.5 rounded-full ${gpsLoading ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></div>
            <span>
              <strong>Position GPS :</strong> Lat {clientLat.toFixed(4)}, Lng {clientLng.toFixed(4)}
              {gpsAccuracy && ` (Précision: ±${gpsAccuracy}m)`}
            </span>
          </div>
          <button
            onClick={fetchRealGps}
            className="text-amber-600 hover:underline font-semibold flex items-center gap-1"
          >
            <Navigation className="w-3.5 h-3.5" /> Re-calibrer mon GPS
          </button>
        </div>

        {/* --- COMMANDE ACTIVE EN COURS --- */}
        {activeOrder && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-amber-400 shadow-lg space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Course en cours #{activeOrder.id.slice(0, 8)}</h3>
                  <span className="text-xs text-amber-700 uppercase font-semibold">
                    Statut : {activeOrder.status === 'searching' ? 'Recherche d’un chauffeur à proximité...' : 'Chauffeur confirmé'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-amber-600">{activeOrder.estimated_price} F CFA</span>
                <span className="text-[10px] text-slate-500 block">Paiement direct chauffeur</span>
              </div>
            </div>

            {/* Fiche Chauffeur s'il a accepté */}
            {activeOrder.provider ? (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 overflow-hidden flex items-center justify-center font-bold text-xl text-amber-700 shadow-sm">
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
                      <h4 className="font-bold text-slate-900 text-base">
                        {activeOrder.provider.profile?.full_name || 'Chauffeur Partenaire'}
                      </h4>
                      {activeOrder.provider.is_vip && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-amber-200">
                          <Crown className="w-3 h-3 text-amber-600" /> VIP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {activeOrder.provider.vehicle_brand} {activeOrder.provider.vehicle_model} • Plaque: <strong className="text-slate-900 font-mono">{activeOrder.provider.vehicle_plate || 'TG 1234 AB'}</strong>
                    </p>
                    <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Note : ⭐ {activeOrder.provider.rating_avg.toFixed(1)}
                    </p>
                  </div>
                </div>

                {/* Boutons d'appel, WhatsApp directs et favoris */}
                <div className="flex items-center gap-2">
                  {activeOrder.provider.profile?.phone && (
                    <a
                      href={`tel:${activeOrder.provider.profile.phone}`}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-sm"
                    >
                      <Phone className="w-4 h-4 text-amber-600" />
                      <span>Appeler</span>
                    </a>
                  )}
                  {activeOrder.provider.profile?.whatsapp && (
                    <a
                      href={`https://wa.me/${activeOrder.provider.profile.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
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
                          ? "bg-amber-100 text-amber-700 border-amber-300"
                          : "bg-white text-slate-400 hover:text-slate-900 border-slate-200"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${favoriteProviderIds.includes(activeOrder.provider!.user_id) ? "fill-amber-500 text-amber-600" : ""}`} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin shrink-0 text-amber-600" />
                <span>Nous informons les chauffeurs connectés à proximité de votre position. Veuillez patienter...</span>
              </div>
            )}

            {/* Adresses Départ / Arrivée */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1 font-semibold flex items-center gap-1 text-emerald-600">
                  <MapPin className="w-3.5 h-3.5" /> Point de départ
                </span>
                <span className="text-slate-900 font-medium">{activeOrder.pickup_address}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1 font-semibold flex items-center gap-1 text-red-600">
                  <MapPin className="w-3.5 h-3.5" /> Destination
                </span>
                <span className="text-slate-900 font-medium">{activeOrder.dropoff_address}</span>
              </div>
            </div>

            {/* Bouton d'annulation */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleCancelOrder}
                className="text-xs text-red-600 hover:text-red-700 hover:underline font-semibold"
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
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-amber-600" />
                Commander un transport
              </h2>

              {/* Sélection du véhicule */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Choix du Véhicule</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setServiceType('moto')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      serviceType === 'moto'
                        ? 'bg-amber-50 border-amber-400 text-amber-800 font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Bike className="w-5 h-5 text-amber-600" />
                    <span className="text-xs">Moto-Taxi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('taxi')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      serviceType === 'taxi'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Car className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs">Taxi Confort</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('tricycle')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      serviceType === 'tricycle'
                        ? 'bg-yellow-50 border-yellow-400 text-yellow-800 font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <span className="text-xs">Tricycle</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setServiceType('vip')}
                    className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-2 ${
                      serviceType === 'vip'
                        ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span className="text-xs">Berline VIP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('moving')}
                    className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-2 ${
                      serviceType === 'moving'
                        ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-purple-600" />
                    <span className="text-xs">Déménagement</span>
                  </button>
                </div>
              </div>

              {/* Formulaire Adresses */}
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Point de ramassage
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Ex: Étoile Rouge, en face de la pharmacie"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-600" /> Destination
                  </label>
                  <input
                    type="text"
                    required
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                    placeholder="Ex: Aéroport ou Carrefour Club des Rois"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Instructions chauffeur (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: 2 sacs de voyage, tee-shirt blanc"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Tarif Estimé Direct</span>
                    <span className="text-xl font-extrabold text-amber-600">{calculateEstimatedFare()} F CFA</span>
                  </div>
                  <div className="text-right text-[10px] text-emerald-600 font-bold">
                    0 F Commission KONDU
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingOrder || Boolean(activeOrder)}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Colonne Droite : Radar GPRS, Filtre de Proximité & Carte Interactive */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* --- PANNEAU DE FILTRE DE PROXIMITÉ AVANCÉ --- */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              
              {/* En-tête avec Radar en direct et Compteur */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Filter className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      Filtre des Chauffeurs Proches
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Localisation instantanée basée sur votre position GPS
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-600 animate-ping" />
                    {filteredAndSortedProviders.length} chauffeur{filteredAndSortedProviders.length > 1 ? 's' : ''} trouvé{filteredAndSortedProviders.length > 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setShowDriverList(!showDriverList)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full transition flex items-center gap-1"
                  >
                    {showDriverList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showDriverList ? 'Masquer liste' : 'Voir liste'}
                  </button>
                </div>
              </div>

              {/* 1. Sélecteur de Rayon de Proximité (Distance Max) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-amber-600" /> Rayon de Proximité :
                  </label>
                  <span className="text-xs font-bold text-amber-700">
                    {filterRadiusKm >= 999 ? 'Tout Lomé & Environs' : `Moins de ${filterRadiusKm} km`}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { label: '< 1 km', value: 1, hint: 'Très proche' },
                    { label: '< 3 km', value: 3, hint: 'Quartier' },
                    { label: '< 5 km', value: 5, hint: 'Recommandé' },
                    { label: '< 10 km', value: 10, hint: 'Lomé Centre' },
                    { label: 'Tout Lomé', value: 999, hint: 'Illimité' },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setFilterRadiusKm(r.value)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center ${
                        filterRadiusKm === r.value
                          ? 'bg-amber-500 text-slate-950 shadow-sm border border-amber-600 scale-[1.02]'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{r.label}</span>
                      <span className={`text-[9px] font-normal ${filterRadiusKm === r.value ? 'text-slate-900' : 'text-slate-400'}`}>
                        {r.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Filtre par Type de Véhicule */}
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-2">
                  <Car className="w-3.5 h-3.5 text-amber-600" /> Type de Véhicule :
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Tous les véhicules', icon: null },
                    { id: 'moto', label: 'Moto (Zémidjan)', icon: Bike },
                    { id: 'taxi', label: 'Taxi Urbain', icon: Car },
                    { id: 'tricycle', label: 'Tricycle (Kéké)', icon: Zap },
                    { id: 'vip', label: 'Berline VIP', icon: Crown },
                    { id: 'moving', label: 'Déménagement', icon: Truck },
                  ].map((s) => {
                    const Icon = s.icon;
                    const isSelected = filterServiceType === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setFilterServiceType(s.id as ServiceType | 'all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Filtres VIP, Favoris, Tri et Barre de Recherche */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-slate-100 items-center">
                {/* Recherche par nom / véhicule / plaque */}
                <div className="sm:col-span-5 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={filterSearchQuery}
                    onChange={(e) => setFilterSearchQuery(e.target.value)}
                    placeholder="Chauffeur, marque, plaque TG..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                  {filterSearchQuery && (
                    <button
                      onClick={() => setFilterSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Filtres Rapides VIP & Favoris */}
                <div className="sm:col-span-4 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterVipOnly(!filterVipOnly)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1 flex-1 justify-center ${
                      filterVipOnly
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Crown className={`w-3.5 h-3.5 ${filterVipOnly ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span>VIP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1 flex-1 justify-center ${
                      filterFavoritesOnly
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${filterFavoritesOnly ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                    <span>Favoris</span>
                  </button>
                </div>

                {/* Tri */}
                <div className="sm:col-span-3">
                  <select
                    value={filterSortBy}
                    onChange={(e) => setFilterSortBy(e.target.value as 'distance' | 'rating')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="distance">📍 Plus proches</option>
                    <option value="rating">⭐ Mieux notés</option>
                  </select>
                </div>
              </div>

              {/* Message de réinitialisation si aucun chauffeur ne correspond */}
              {filteredAndSortedProviders.length === 0 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Aucun chauffeur ne correspond exactement à ce filtre dans un rayon de {filterRadiusKm} km.</span>
                  </div>
                  <button
                    onClick={() => {
                      setFilterRadiusKm(10);
                      setFilterServiceType('all');
                      setFilterVipOnly(false);
                      setFilterFavoritesOnly(false);
                      setFilterSearchQuery('');
                    }}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shrink-0 transition"
                  >
                    Élargir la recherche
                  </button>
                </div>
              )}
            </div>

            {/* --- VOLET DÉTAILLÉ DES CHAUFFEURS PROCHES FILTRÉS --- */}
            {showDriverList && filteredAndSortedProviders.length > 0 && (
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-amber-600" /> Chauffeurs disponibles les plus proches
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Triés par proximité GPS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {filteredAndSortedProviders.map((driver) => {
                    const distDisplay = driver.calculatedDistanceKm < 1
                      ? `${Math.round(driver.calculatedDistanceKm * 1000)} m`
                      : `${driver.calculatedDistanceKm.toFixed(1)} km`;
                    const isSelected = selectedDriverId === driver.user_id;

                    return (
                      <div
                        key={driver.user_id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-50/60 border-amber-400 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 overflow-hidden flex items-center justify-center font-bold text-lg text-amber-800 shrink-0 relative">
                            {driver.profile?.avatar_url ? (
                              <img src={driver.profile.avatar_url} alt={driver.profile.full_name} className="w-full h-full object-cover" />
                            ) : (
                              driver.profile?.full_name?.charAt(0) || 'C'
                            )}
                            {driver.is_vip && (
                              <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 shadow">
                                <Crown className="w-2.5 h-2.5 text-slate-950" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h5 className="font-bold text-slate-900 text-xs truncate">
                                {driver.profile?.full_name || 'Chauffeur Partenaire'}
                              </h5>
                              {driver.is_vip && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border border-amber-200 shrink-0">
                                  VIP
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 truncate mt-0.5">
                              {driver.vehicle_brand} {driver.vehicle_model} • <strong className="font-mono text-slate-800">{driver.vehicle_plate || 'TG 1234 AB'}</strong>
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-[11px]">
                              <span className="font-extrabold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-amber-600" /> {distDisplay}
                              </span>
                              <span className="text-slate-500 flex items-center gap-0.5">
                                <Clock className="w-3 h-3 text-slate-400" /> ~{driver.calculatedDurationMinutes} min
                              </span>
                              <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                                ⭐ {driver.rating_avg.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions : WhatsApp, Appel, Favori et Choix */}
                        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-200/60">
                          <div className="flex items-center gap-1">
                            {driver.profile?.whatsapp && (
                              <a
                                href={`https://wa.me/${driver.profile.whatsapp.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Contacter sur WhatsApp"
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {driver.profile?.phone && (
                              <a
                                href={`tel:${driver.profile.phone}`}
                                title="Appeler directement"
                                className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 transition"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleToggleFavorite(driver.user_id)}
                              title={favoriteProviderIds.includes(driver.user_id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                              className={`p-1.5 rounded-lg border transition ${
                                favoriteProviderIds.includes(driver.user_id)
                                  ? "bg-amber-100 text-amber-700 border-amber-300"
                                  : "bg-white text-slate-400 hover:text-slate-800 border-slate-200"
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${favoriteProviderIds.includes(driver.user_id) ? "fill-amber-500 text-amber-600" : ""}`} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDriverId(driver.user_id);
                              setServiceType(driver.service_type);
                              confetti({ particleCount: 35, spread: 50 });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-2xs'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Chauffeur Choisi
                              </>
                            ) : (
                              <>
                                <Navigation className="w-3 h-3" /> Choisir ce chauffeur
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- CARTE INTERACTIVE EN DIRECT AVEC MARQUEURS FILTRÉS --- */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-amber-600" /> Carte Interactive des Chauffeurs Proches
                </span>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {filteredAndSortedProviders.length} Chauffeur{filteredAndSortedProviders.length > 1 ? 's' : ''} sur la carte
                </span>
              </div>

              <LiveMap
                centerLat={clientLat}
                centerLng={clientLng}
                zoom={14}
                providers={filteredAndSortedProviders}
                className="h-[480px] w-full rounded-2xl border border-slate-200 shadow-sm"
              />
            </div>
          </div>

        </div>

        {/* Historique des courses passées */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
            <History className="w-5 h-5 text-amber-600" />
            <span>Historique de mes trajets</span>
          </div>

          {pastOrders.length === 0 ? (
            <p className="text-slate-500 text-xs py-4">Aucun trajet passé enregistré.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {pastOrders.map((ord) => (
                <div key={ord.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm capitalize">{ord.service_type}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ord.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {ord.status === 'completed' ? 'Terminé' : 'Annulé'}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">
                      De : {ord.pickup_address} &rarr; Vers : {ord.dropoff_address}
                    </p>
                    <span className="text-[10px] text-slate-400">{new Date(ord.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="text-right font-extrabold text-amber-600 text-sm">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl text-slate-900">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
              <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Votre course est terminée !</h3>
            <p className="text-xs text-slate-500">Comment s'est déroulé votre trajet avec votre chauffeur ?</p>

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
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Un commentaire sur le trajet (Optionnel)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              rows={3}
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
              >
                Plus tard
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-xl text-xs font-bold shadow-sm"
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
