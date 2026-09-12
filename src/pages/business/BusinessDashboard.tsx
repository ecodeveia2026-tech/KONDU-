import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Navbar } from '../../components/Navbar';
import { NotificationCenter } from '../../components/NotificationCenter';
import type { Order } from '../../lib/types';
import confetti from 'canvas-confetti';
import { 
  PlusCircle, 
  FileText, 
  Send,
  Loader2
} from 'lucide-react';

export const BusinessDashboard: React.FC = () => {
  const { user, profile, businessProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceType, setServiceType] = useState<'delivery' | 'moving' | 'taxi'>('delivery');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [cargoDetails, setCargoDetails] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('5000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBusinessOrders = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setOrders(data as Order[]);
      }
    } catch (err) {
      console.error('Erreur chargement commandes entreprise:', err);
    }
  };

  useEffect(() => {
    loadBusinessOrders();
  }, [user]);

  const handleCreateBusinessOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('orders').insert({
        client_id: user.id,
        service_type: serviceType,
        status: 'searching',
        pickup_address: pickupAddress.trim(),
        pickup_lat: 6.3703,
        pickup_lng: 2.3912,
        dropoff_address: dropoffAddress.trim(),
        dropoff_lat: 6.3900,
        dropoff_lng: 2.4100,
        estimated_price: parseFloat(estimatedBudget) || 5000,
        currency: 'XOF',
        notes: `[ENTREPRISE: ${businessProfile?.company_name || 'Pro'}] ` + cargoDetails.trim(),
      });

      if (error) throw error;

      setPickupAddress('');
      setDropoffAddress('');
      setCargoDetails('');
      confetti({ particleCount: 60, spread: 60 });
      await loadBusinessOrders();
      alert('Demande de transport professionnel enregistrée avec succès !');
    } catch (err: any) {
      console.error('Erreur création transport pro:', err);
      alert('Erreur: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* En-tête Espace Business */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">KONDU BUSINESS</span>
              <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                Compte Entreprise
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {businessProfile?.company_name || profile?.full_name} 🏢
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Gestion centralisée des déménagements, livraisons de marchandises et courses pour votre structure
            </p>
          </div>

          <NotificationCenter />
        </div>

        {/* Grille des statistiques Entreprise */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Total des Expéditions</span>
            <span className="text-2xl font-black text-white mt-1 block">{orders.length}</span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Courses en Cours</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">
              {orders.filter((o) => ['searching', 'accepted', 'in_progress'].includes(o.status)).length}
            </span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Commission Économisée</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">
              {orders.length * 500} F CFA
            </span>
          </div>
        </div>

        {/* Formulaire Nouvelle Demande Pro & Historique */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-400" />
              Lancer une expédition pro / Déménagement
            </h2>

            <form onSubmit={handleCreateBusinessOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Type de besoin</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="delivery">Transport de Marchandises / Colis volumineux</option>
                  <option value="moving">Déménagement de bureaux / Meubles</option>
                  <option value="taxi">Déplacement Collaborateur / Taxi Pro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Point de départ / Entrepôt</label>
                <input
                  type="text"
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Ex: Siège Akpakpa ou Zone Industrielle"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Point de livraison</label>
                <input
                  type="text"
                  required
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  placeholder="Ex: Boutique Ganhi ou Client final"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Détails de la marchandise / Volume</label>
                <textarea
                  required
                  value={cargoDetails}
                  onChange={(e) => setCargoDetails(e.target.value)}
                  placeholder="Ex: 10 cartons de vêtements, 1 bureau démonté..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Budget alloué (F CFA)</label>
                <input
                  type="number"
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Envoyer la demande aux transporteurs</span>
              </button>
            </form>
          </div>

          {/* Liste des commandes de l'entreprise */}
          <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Journal des expéditions de l'entreprise
            </h2>

            {orders.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Aucune expédition enregistrée pour le moment.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {orders.map((ord) => (
                  <div key={ord.id} className="py-4 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white uppercase">{ord.service_type}</span>
                      <span className="text-amber-400 font-extrabold">{ord.estimated_price} F CFA</span>
                    </div>
                    <p className="text-slate-400">
                      <strong>De :</strong> {ord.pickup_address} &rarr; <strong>Vers :</strong> {ord.dropoff_address}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>{new Date(ord.created_at).toLocaleDateString()}</span>
                      <span className="capitalize text-slate-300 font-semibold">{ord.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
};
