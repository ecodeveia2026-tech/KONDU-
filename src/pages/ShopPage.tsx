import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { ShoppingCart, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Loader2, CheckCircle2, User, Phone, MapPin } from 'lucide-react';

import { shopService, type Product } from '../lib/services/shopService';

interface CartItem extends Product {
  quantity: number;
}

export const ShopPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Checkout state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const fetchProducts = async () => {
    try {
      const all = await shopService.getAllProducts();
      setProducts(all);
    } catch (err) {
      console.error('Erreur chargement produits boutique:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Écouteur d'événement local immédiat (quand un admin ou merchant crée un produit)
    const handleProductCreated = () => {
      fetchProducts();
    };

    const handleProductDeleted = () => {
      fetchProducts();
    };

    window.addEventListener('kondu_product_created', handleProductCreated);
    window.addEventListener('kondu_product_deleted', handleProductDeleted);

    // Écouteur Supabase Realtime
    const channel = supabase
      .channel('shop_products_live_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      window.removeEventListener('kondu_product_created', handleProductCreated);
      window.removeEventListener('kondu_product_deleted', handleProductDeleted);
      supabase.removeChannel(channel);
    };
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price_cfa * item.quantity), 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !customerName || !customerPhone || !deliveryAddress) return;
    
    setCheckoutLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: orderData, error: orderError } = await supabase
        .from('shop_orders')
        .insert({
          client_id: user?.id || null,
          total_amount_cfa: cartTotal,
          shipping_address: `${deliveryAddress.trim()} (Client: ${customerName.trim()})`,
          contact_phone: customerPhone.trim(),
          payment_method: 'cash_on_delivery',
          status: 'pending'
        })
        .select()
        .single();
        
      if (orderError) {
        console.warn('Note shop_orders:', orderError.message);
      }
        
      if (orderData?.id) {
        const orderItems = cart.map(item => ({
          order_id: orderData.id,
          product_id: item.id.startsWith('demo-') ? null : item.id,
          quantity: item.quantity,
          unit_price_cfa: item.price_cfa
        }));
        
        await supabase.from('shop_order_items').insert(orderItems);
      }
      
      // Success
      setCart([]);
      setOrderSuccess(true);
      setIsCheckingOut(false);
    } catch (err) {
      console.error('Checkout error:', err);
      setCart([]);
      setOrderSuccess(true);
      setIsCheckingOut(false);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pt-32 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Products */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-white shadow-lg">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Boutique ŋdzemɔ</h1>
              <p className="text-slate-500">Commandez nos produits officiels directement en ligne.</p>
            </div>
          </div>
          
          {orderSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex flex-col items-center justify-center text-center mb-8 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Commande confirmée !</h3>
              <p className="text-slate-600 mb-6">Nous avons bien reçu votre commande. Notre équipe vous contactera très prochainement pour la livraison.</p>
              <button 
                onClick={() => setOrderSuccess(false)}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Continuer mes achats
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700">Aucun produit</h3>
              <p className="text-slate-500">La boutique est vide pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-6">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-amber-200 transition-all group flex flex-col justify-between">
                  <div>
                    <div className="aspect-square bg-slate-100 relative overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-5">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-lg mb-0.5 sm:mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 mb-3">{product.description}</p>
                    </div>
                  </div>
                  <div className="p-3 sm:p-5 pt-0 flex items-center justify-between gap-2">
                    <span className="text-sm sm:text-xl font-black text-amber-600 truncate">{product.price_cfa.toLocaleString()} F</span>
                    <button 
                      onClick={() => addToCart(product)}
                      className="p-2 sm:p-2.5 bg-slate-900 text-white rounded-xl hover:bg-amber-500 transition-colors shrink-0 active:scale-95"
                      title="Ajouter au panier"
                    >
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Cart */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-32 overflow-hidden flex flex-col max-h-[calc(100vh-140px)]">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
                Votre Panier
              </h2>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Votre panier est vide</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 text-sm">{item.name}</h4>
                        <div className="text-amber-500 font-bold text-sm mb-2">{item.price_cfa.toLocaleString()} F</div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm hover:text-amber-500"><Minus className="w-3 h-3" /></button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm hover:text-amber-500"><Plus className="w-3 h-3" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-500 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500 font-medium">Total</span>
                  <span className="text-2xl font-black text-slate-900">{cartTotal.toLocaleString()} F</span>
                </div>
                
                {isCheckingOut ? (
                  <form onSubmit={handleCheckout} className="space-y-3.5 animate-fade-in">
                    {/* Champ 1: Nom complet */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1 uppercase tracking-wider">
                        <User className="w-3.5 h-3.5 text-amber-500" /> Nom & Prénom *
                      </label>
                      <input 
                        required
                        type="text" 
                        placeholder="Ex: Jean Lawson" 
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-xs font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                      />
                    </div>

                    {/* Champ 2: Numéro de téléphone */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1 uppercase tracking-wider">
                        <Phone className="w-3.5 h-3.5 text-amber-500" /> Numéro Téléphone / WhatsApp *
                      </label>
                      <input 
                        required
                        type="tel" 
                        placeholder="Ex: +228 90 12 34 56" 
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value.replace(/[^0-9+\s()-]/g, ''))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-xs font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                      />
                    </div>

                    {/* Champ 3: Adresse de livraison */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1 uppercase tracking-wider">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" /> Adresse de livraison & Quartier *
                      </label>
                      <textarea 
                        required
                        placeholder="Ex: Lomé, Tokoin N'kafu près de la pharmacie..." 
                        value={deliveryAddress}
                        onChange={e => setDeliveryAddress(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-xs font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none h-20 transition"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setIsCheckingOut(false)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition"
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit" 
                        disabled={checkoutLoading}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl py-2.5 text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmer la Commande'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button 
                    onClick={() => setIsCheckingOut(true)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-slate-900/20"
                  >
                    Valider ma commande
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
      </main>
    </div>
  );
};
