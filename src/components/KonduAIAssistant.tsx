import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  options?: string[];
}

export const KonduAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const initialMessage: Message = {
    id: '1',
    sender: 'ai',
    text: "Bonjour ! 👋 Je suis **ŋdzemɔ AI**, votre assistant virtuel officiel. Comment puis-je vous aider aujourd'hui sur la plateforme ŋdzemɔ ?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    options: [
      "🚕 Quels sont les services de transport ?",
      "👑 Comment fonctionne l'abonnement VIP (15 000 F) ?",
      "📍 Comment marche le suivi GPRS / GPS temps réel ?",
      "🚗 Comment devenir Chauffeur Partenaire (0% commission) ?",
      "🛍️ Comment commander sur la Boutique ŋdzemɔ ?"
    ]
  };

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Moteur de Réponse Intelligente Basé sur la Connaissance ŋdzemɔ
  const generateAIResponse = (userQuery: string): { response: string; options?: string[] } => {
    const q = userQuery.toLowerCase();

    if (q.includes('service') || q.includes('transport') || q.includes('vtc') || q.includes('moto') || q.includes('taxi') || q.includes('tricycle') || q.includes('keke') || q.includes('déménagement')) {
      return {
        response: "ŋdzemɔ propose 5 catégories de services de mobilité au Togo 🇹🇬 :\n\n1. **Moto-Taxi (Zémidjan)** : Trajets rapides et abordables.\n2. **Taxi Confort** : Berlines climatisées pour vos déplacements urbains.\n3. **Tricycle / Kéké** : Idéal pour les petits groupes et le transport de marchandises.\n4. **Déménagement / Livraisons** : Camions et triporteurs pour gros volumes.\n5. **Transport VIP** : Véhicules premium avec chauffeurs certifiés.",
        options: ["👑 S'abonner au Forfait VIP", "📍 Suivi GPRS en direct", "🚗 Devenir Chauffeur"]
      };
    }

    if (q.includes('vip') || q.includes('15000') || q.includes('5000') || q.includes('abonnement') || q.includes('forfait') || q.includes('prix') || q.includes('tarif')) {
      return {
        response: "👑 **Grille Officielle des Forfaits ŋdzemɔ PRO Togo** 🇹🇬 :\n\n- **Pass 24H Essentiel** : 500 F CFA (Courses illimitées, 0% commission, GPS actif)\n- **Pass 24H Confort** : 1 000 F CFA (Visibilité prioritaire & alertes)\n- **Pass Hebdomadaire (7 Jours)** : 2 500 F CFA (~357 F/jour)\n- **Pass Mensuel Pro (30 Jours)** : 8 000 F CFA (~266 F/jour, support 7j/7)\n- **ŋdzemɔ VIP (30 Jours)** : 15 000 F CFA (Badge VIP Doré, matching prioritaire n°1, direct clients VIP)",
        options: ["🚗 S'abonner au Forfait", "📞 Contacter le Support"]
      };
    }

    if (q.includes('gprs') || q.includes('gps') || q.includes('géolocalisation') || q.includes('position') || q.includes('suivi')) {
      return {
        response: "📍 **Suivi GPRS & Géolocalisation Temps Réel** :\n\n- Les chauffeurs **EN LIGNE** sont géolocalisés en direct avec leur position GPS exacte (latitude/longitude), marque de véhicule et plaque d'immatriculation togolaise (ex: `TG 1234 AB`).\n- L'administration et les passagers peuvent suivre l'arrivée du chauffeur en direct sur la carte GPRS.",
        options: ["🚕 Voir les chauffeurs en ligne", "🚗 Activer mon GPS Chauffeur"]
      };
    }

    if (q.includes('chauffeur') || q.includes('partenaire') || q.includes('inscrire') || q.includes('commission') || q.includes('rejoindre')) {
      return {
        response: "🚗 **Devenir Chauffeur Partenaire ŋdzemɔ** :\n\n- **0% de commission** sur vos courses !\n- Activation simple avec nos forfaits souples (200 F / jour, 1 000 F / semaine, 5 000 F / mois).\n- Géolocalisation GPRS en direct avec vos plaques togolaises certifiées `TG 1234 AB`.\n- Contact WhatsApp direct avec les passagers !",
        options: ["👑 Découvrir les forfaits", "🛍️ Visiter la Boutique"]
      };
    }

    if (q.includes('boutique') || q.includes('produit') || q.includes('commander') || q.includes('shop')) {
      return {
        response: "🛍️ **La Boutique ŋdzemɔ** :\n\nDécouvrez nos équipements et accessoires auto/moto certifiés : casques homologués, supports GPS, kits d'entretien, pièces détachées et équipements chauffeurs. Commandez directement en ligne avec livraison rapide à Lomé et dans tout le Togo !",
        options: ["🛍️ Aller à la Boutique", "🚕 Demander une course"]
      };
    }

    if (q.includes('bonjour') || q.includes('salut') || q.includes('hello') || q.includes('coucou')) {
      return {
        response: "Bonjour ! 😊 Je suis ravi de vous aider. Dites-moi ce que vous aimeriez savoir sur les transports, le suivi GPRS ou les abonnements ŋdzemɔ !",
        options: ["🚕 Services VTC", "📍 Suivi GPRS", "👑 Forfait VIP"]
      };
    }

    return {
      response: "Je comprends votre demande ! ŋdzemɔ est la plateforme leader de mobilité et de services au Togo. Je peux vous renseigner sur la réservation de courses (Moto, Taxi, Tricycle, Déménagement), le suivi GPRS direct des chauffeurs, les forfaits 0% commission, ou la boutique en ligne. Que souhaitez-vous préciser ?",
      options: ["🚕 Services de transport", "📍 Suivi GPRS direct", "👑 Offre VIP (5 000 F)", "🚗 Espace Chauffeurs"]
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const { response, options } = generateAIResponse(text);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <>
      {/* Bouton Flottant Déclencheur (Optimisé Smartphone Android) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black rounded-full shadow-xl shadow-amber-500/25 border border-amber-300 transition-all hover:scale-105 active:scale-95 group"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
          </div>
          <span className="text-xs tracking-wide">Assistant IA</span>
        </button>
      )}

      {/* Widget Modal de Chat IA (Centré et fluide sur mobile) */}
      {isOpen && (
        <div className="fixed bottom-3 sm:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[400px] max-w-[420px] h-[78vh] sm:h-[540px] max-h-[600px] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* En-Tête du Chat */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-4 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md border border-amber-300">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black flex items-center gap-1.5 text-white">
                  ŋdzemɔ AI <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-bold border border-amber-500/30">PRO</span>
                </h3>
                <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  En ligne • Assistance H24
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Corps des Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-slate-950 font-semibold rounded-br-none shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                </div>
                <span className="text-[9px] text-slate-400 px-1 font-mono">{msg.timestamp}</span>

                {/* Boutons d'options suggérées */}
                {msg.options && (
                  <div className="flex flex-wrap gap-1.5 pt-1 max-w-[90%]">
                    {msg.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(opt)}
                        className="text-[11px] font-medium bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-amber-300 transition shadow-2xs text-left"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Animation "En train d'écrire..." */}
            {isTyping && (
              <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 text-xs text-slate-500 w-fit">
                <Bot className="w-4 h-4 text-amber-500 animate-spin" />
                <span>ŋdzemɔ AI analyse votre réponse...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Formulaire de Saisie */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Posez votre question à ŋdzemɔ AI..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim()}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 transition shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </>
  );
};
