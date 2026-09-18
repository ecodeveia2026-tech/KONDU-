import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Navbar } from '../../components/Navbar';
import { NotificationCenter } from '../../components/NotificationCenter';
import { locationService } from '../../lib/services/locationService';
import { storageService } from '../../lib/services/storageService';
import { shopService } from '../../lib/services/shopService';
import type { Order } from '../../lib/types';
import confetti from 'canvas-confetti';
import { 
  PlusCircle, 
  FileText, 
  Send,
  Loader2,
  Camera,
  Building2
} from 'lucide-react';

export const BusinessDashboard: React.FC = () => {
  const { user, profile, businessProfile, refreshProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceType, setServiceType] = useState<'delivery' | 'moving' | 'taxi'>('delivery');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [cargoDetails, setCargoDetails] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('5000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodCategory, setProdCategory] = useState('Général');
  const [prodStock, setProdStock] = useState('50');
  const [prodImageFile, setProdImageFile] = useState<File | null>(null);
  const [prodImagePreview, setProdImagePreview] = useState<string | null>(null);
  const [isSubmittingProd, setIsSubmittingProd] = useState(false);
  const [prodFormError, setProdFormError] = useState<string | null>(null);

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

  const loadMyProducts = async () => {
    if (!user) return;
    try {
      const all = await shopService.getAllProducts();
      // Filtrer pour afficher les produits créés par ce business ou globaux
      const mine = all.filter(p => !p.business_id || p.business_id === user.id);
      setMyProducts(mine);
    } catch (err) {
      console.error('Erreur chargement produits entreprise:', err);
    }
  };

  useEffect(() => {
    loadBusinessOrders();
    loadMyProducts();
  }, [user]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!prodName.trim()) {
      setProdFormError('Le nom du produit est obligatoire.');
      return;
    }
    const priceNum = parseFloat(prodPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setProdFormError('Le prix doit être supérieur à 0.');
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
        stock_quantity: parseInt(prodStock) || 50,
        imageFile: prodImageFile,
        business_id: user.id
      });

      if (!result.success || !result.product) {
        setProdFormError(result.error || 'Erreur lors de la création du produit.');
        return;
      }

      setMyProducts((prev) => [result.product!, ...prev.filter(p => p.id !== result.product!.id)]);
      setProdName('');
      setProdPrice('');
      setProdDescription('');
      setProdImageFile(null);
      setProdImagePreview(null);
      setShowAddProduct(false);
      confetti({ particleCount: 30, spread: 60 });
      alert(`✅ Produit « ${result.product.name} » créé avec succès et visible en boutique !`);
    } catch (err: any) {
      setProdFormError(err.message || 'Erreur lors de la création du produit.');
    } finally {
      setIsSubmittingProd(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingLogo(true);

    try {
      const res = await storageService.uploadAvatar(user.id, file);
      if (res.success) {
        await refreshProfile();
        confetti({ particleCount: 40, spread: 50 });
        alert('Votre photo de profil / logo entreprise a été mis à jour avec succès !');
      } else {
        alert(res.error || 'Erreur lors du téléversement du logo.');
      }
    } catch (err: any) {
      console.error('Erreur téléversement logo entreprise:', err);
      alert('Erreur lors du téléversement du logo.');
    } finally {
      setIsUploadingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleCreateBusinessOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      let lat = 6.1375; // Lomé, Togo par défaut
      let lng = 1.2123;
      try {
        const pos = await locationService.getCurrentPosition();
        lat = pos.latitude;
        lng = pos.longitude;
      } catch {
        // Fallback sur le centre de Lomé
      }

      const { error } = await supabase.from('orders').insert({
        client_id: user.id,
        service_type: serviceType,
        status: 'searching',
        pickup_address: pickupAddress.trim(),
        pickup_latitude: lat,
        pickup_longitude: lng,
        pickup_lat: lat,
        pickup_lng: lng,
        destination_address: dropoffAddress.trim(),
        destination_latitude: lat + 0.02,
        destination_longitude: lng + 0.02,
        dropoff_address: dropoffAddress.trim(),
        dropoff_lat: lat + 0.02,
        dropoff_lng: lng + 0.02,
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* En-tête Espace Business */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            {/* Logo de l'entreprise avec upload */}
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 border-2 border-blue-300 overflow-hidden flex items-center justify-center text-blue-700 font-black text-2xl shadow-sm">
                {profile?.avatar_url || profile?.photo_url ? (
                  <img
                    src={profile.avatar_url || profile.photo_url || ''}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingLogo}
                title="Modifier le logo"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow transition-transform group-hover:scale-110"
              >
                {isUploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">KONDU BUSINESS</span>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                  Compte Entreprise
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {businessProfile?.company_name || profile?.full_name} 🏢
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Gestion centralisée des déménagements, livraisons de marchandises et courses pour votre structure
              </p>
            </div>
          </div>

          <NotificationCenter />
        </div>

        {/* Grille des statistiques Entreprise */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold block">Total des Expéditions</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{orders.length}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold block">Courses en Cours</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {orders.filter((o) => ['searching', 'accepted', 'in_progress'].includes(o.status)).length}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold block">Commission Économisée</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {orders.length * 500} F CFA
            </span>
          </div>
        </div>

        {/* Formulaire Nouvelle Demande Pro & Historique */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              Lancer une expédition pro / Déménagement
            </h2>

            <form onSubmit={handleCreateBusinessOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type de besoin</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="delivery">Transport de Marchandises / Colis volumineux</option>
                  <option value="moving">Déménagement de bureaux / Meubles</option>
                  <option value="taxi">Déplacement Collaborateur / Taxi Pro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Point de départ / Entrepôt</label>
                <input
                  type="text"
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Ex: Siège Akpakpa ou Zone Industrielle"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Point de livraison</label>
                <input
                  type="text"
                  required
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  placeholder="Ex: Boutique Ganhi ou Client final"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Détails de la marchandise / Volume</label>
                <textarea
                  required
                  value={cargoDetails}
                  onChange={(e) => setCargoDetails(e.target.value)}
                  placeholder="Ex: 10 cartons de vêtements, 1 bureau démonté..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Budget alloué (F CFA)</label>
                <input
                  type="number"
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Envoyer la demande aux transporteurs</span>
              </button>
            </form>
          </div>

          {/* Liste des commandes de l'entreprise */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-blue-600" />
                Journal des expéditions de l'entreprise
              </h2>

              {orders.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-2xl border border-slate-200">Aucune expédition enregistrée pour le moment.</p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                  {orders.map((ord) => (
                    <div key={ord.id} className="py-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 uppercase">{ord.service_type}</span>
                        <span className="text-amber-600 font-extrabold">{ord.estimated_price} F CFA</span>
                      </div>
                      <p className="text-slate-600">
                        <strong>De :</strong> {ord.pickup_address} &rarr; <strong>Vers :</strong> {ord.dropoff_address}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>{new Date(ord.created_at).toLocaleDateString()}</span>
                        <span className="capitalize text-slate-700 font-semibold">{ord.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Catalogue Produits Business */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-600" />
                    Catalogue Produits de l'Entreprise
                  </h3>
                  <p className="text-xs text-slate-500">Publiez vos articles pour les rendre commandables sur KONDU Shop</p>
                </div>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nouveau produit</span>
                </button>
              </div>

              {myProducts.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <p className="text-xs text-slate-500">Vous n'avez pas encore publié de produit dans votre catalogue.</p>
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="text-xs text-amber-600 hover:underline font-bold"
                  >
                    + Enregistrer votre premier produit
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {myProducts.map((prod) => (
                    <div key={prod.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-3 flex gap-3 items-center">
                      <img
                        src={prod.image_url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=300&q=80'}
                        alt={prod.name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">{prod.name}</div>
                        <div className="text-amber-600 font-extrabold text-xs mt-0.5">{Number(prod.price_cfa).toLocaleString()} F CFA</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Stock : {prod.stock_quantity ?? 50}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* Modal d'ajout de produit pour Entreprise */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4 text-slate-900">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
              <span>Ajouter un produit à votre catalogue</span>
              <button onClick={() => setShowAddProduct(false)} className="text-slate-400 hover:text-slate-900">✕</button>
            </h3>

            {prodFormError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs">
                {prodFormError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nom du produit *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="ex: Cartons d'emballage renforcés"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Prix (F CFA) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="5000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quantité Stock</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="50"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Catégorie</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="Général">Général</option>
                  <option value="Équipement Moto">Équipement & Accessoires</option>
                  <option value="Alimentaire">Alimentaire & Restauration</option>
                  <option value="Technologie">Technologie & Matériel</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Caractéristiques du produit..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Image du produit</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setProdImageFile(e.target.files[0]);
                      setProdImagePreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }}
                  className="w-full text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                />
                {prodImagePreview && (
                  <img src={prodImagePreview} alt="Aperçu" className="w-16 h-16 rounded-xl object-cover mt-2 border border-amber-300" />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProd}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                >
                  {isSubmittingProd ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Publier le produit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
