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
  Loader2,
  MapPin
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
            <HelpCircle className="w-4 h-4" /> Assistance & Réclamations — Lomé, Togo 🇹🇬
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Comment pouvons-nous vous aider ?
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Notre équipe à <strong className="text-white">Lomé</strong> est disponible 24/7 pour assister les passagers, les chauffeurs partenaires et les entreprises togolaises.
          </p>
        </div>

        {/* Canaux de contact direct Togo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 text-center space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">WhatsApp Officiel</h3>
            <p className="text-xs text-slate-400">Assistance instantanée, réservation et signalements.</p>
            <p className="text-sm font-black text-emerald-400">+228 93 91 92 12</p>
            <a
              href="https://wa.me/22893919212"
              target="_blank"
              rel="noreferrer"
              className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
            >
              Écrire sur WhatsApp
            </a>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 text-center space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">Ligne Téléphonique Directe</h3>
            <p className="text-xs text-slate-400">Appel direct pour urgence ou course en cours.</p>
            <p className="text-sm font-black text-amber-400">+228 99 25 52 31</p>
            <a
              href="tel:+22899255231"
              className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-md"
            >
              Appeler le Standard
            </a>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 text-center space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">Email & Entreprises</h3>
            <p className="text-xs text-slate-400">Pour les partenariats, réclamations et facturation.</p>
            <p className="text-sm font-black text-blue-400">kondutogo@mail.com</p>
            <a
              href="mailto:kondutogo@mail.com"
              className="inline-block px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all"
            >
              Envoyer un e-mail
            </a>
          </div>
        </div>

        {/* Formulaire de création de ticket */}
        <div className="bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 max-w-2xl mx-auto space-y-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" />
              Envoyer un message à l'équipe support
            </h2>
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Lomé, Togo
            </span>
          </div>

          {ticketSent ? (
            <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-base text-white">Ticket transmis avec succès !</h4>
              <p className="text-xs">Un conseiller de l'équipe KONDU Togo vous répondra dans les plus brefs délais.</p>
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
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Course & Chauffeur">Problème sur un trajet ou chauffeur</option>
                  <option value="Abonnement Chauffeur">Abonnement ou forfait chauffeur</option>
                  <option value="Compte & Profil">Compte, téléphone ou connexion</option>
                  <option value="Objets Perdus">Objet oublié dans un véhicule</option>
                  <option value="Autre">Autre demande générale</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Objet de la demande</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Demande de renseignement à Lomé"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Détails de votre message</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Expliquez précisément votre situation..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400"
                  rows={4}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
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
