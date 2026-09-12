import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  Send, 
  CheckCircle2, 
  Loader2
} from 'lucide-react';

export const SupportPage: React.FC = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Course & Chauffeur');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Veuillez vous connecter pour envoyer un ticket de réclamation.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        subject: subject.trim(),
        category,
        status: 'open',
        priority: 'normal',
      });

      if (error) throw error;

      setTicketSent(true);
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error('Erreur envoi ticket:', err);
      alert('Erreur: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        {/* Titre & Présentation */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" /> Assistance & Réclamations
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Comment pouvons-nous vous aider ?
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Notre équipe est disponible 24/7 pour assister les passagers, les chauffeurs partenaires et les entreprises.
          </p>
        </div>

        {/* Canaux de contact direct */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">WhatsApp Officiel</h3>
            <p className="text-xs text-slate-400">Assistance instantanée et signalement d'objets perdus.</p>
            <a
              href="https://wa.me/22997000000"
              target="_blank"
              rel="noreferrer"
              className="inline-block px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              Ouvrir WhatsApp
            </a>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">Ligne Téléphonique</h3>
            <p className="text-xs text-slate-400">Appel direct d'urgence en cas d'incident sur un trajet.</p>
            <a
              href="tel:+22997000000"
              className="inline-block px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700"
            >
              Appeler le Standard
            </a>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">Support Entreprises</h3>
            <p className="text-xs text-slate-400">Pour les partenariats, facturation et grands commerçants.</p>
            <a
              href="mailto:contact@kondu.app"
              className="inline-block px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700"
            >
              contact@kondu.app
            </a>
          </div>
        </div>

        {/* Formulaire de création de ticket */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 max-w-2xl mx-auto space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-amber-400" />
            Envoyer un message à l'équipe support
          </h2>

          {ticketSent ? (
            <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-base text-white">Ticket transmis avec succès !</h4>
              <p className="text-xs">Un conseiller technique vous répondra dans les plus brefs délais.</p>
              <button
                onClick={() => setTicketSent(false)}
                className="mt-3 text-xs text-amber-400 underline font-bold"
              >
                Envoyer une autre demande
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                >
                  <option value="Course & Chauffeur">Problème sur un trajet ou chauffeur</option>
                  <option value="Abonnement Chauffeur">Abonnement ou paiement forfait</option>
                  <option value="Compte & Profil">Compte, téléphone ou connexion</option>
                  <option value="Objets Perdus">Objet oublié dans un véhicule</option>
                  <option value="Autre">Autre demande générale</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Objet de la demande</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Signalement de course ou question abonnement"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Détails de votre message</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Expliquez précisément votre situation..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                  rows={4}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full gold-gradient-btn py-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Soumettre le ticket d'assistance</span>
              </button>
            </form>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
};
