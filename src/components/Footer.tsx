import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Heart, Car, Building2, Crown, Mail, Phone, MapPin, MessageSquare } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Colonne 1 : Présentation & Identité */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Compass className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">KONDU</span>
            </Link>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              La plateforme de mobilité et de mise en relation de référence à <strong className="text-white">Lomé, Togo</strong>. Déplacez-vous en moto, taxi ou tricycle avec <strong className="text-amber-400">0% de commission</strong> sur les courses.
            </p>

            <div className="flex items-center gap-3 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Plateforme Sécurisée</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-amber-400 font-semibold">
                <Crown className="w-4 h-4" />
                <span>Option VIP 5 000 F</span>
              </div>
            </div>
          </div>

          {/* Colonne 2 : Services Mobilité */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase">Mobilité & Trajets</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/register?role=CLIENT" className="hover:text-amber-400 transition-colors">Moto-Taxi (Zémidjan)</Link></li>
              <li><Link to="/register?role=CLIENT" className="hover:text-amber-400 transition-colors">Taxi Urbain Confort</Link></li>
              <li><Link to="/register?role=CLIENT" className="hover:text-amber-400 transition-colors">Tricycle (Kéké)</Link></li>
              <li><Link to="/register?role=CLIENT" className="hover:text-amber-400 transition-colors">Chauffeur Privé VIP</Link></li>
              <li><Link to="/register?role=CLIENT" className="hover:text-amber-400 transition-colors">Transport de Marchandises</Link></li>
            </ul>
          </div>

          {/* Colonne 3 : Espace Professionnel */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase">Professionnels</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/register?role=PROVIDER" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-amber-400" />
                  Devenir Chauffeur Pro
                </Link>
              </li>
              <li>
                <Link to="/register?role=PROVIDER" className="hover:text-amber-400 transition-colors">
                  Forfaits 200F / 300F / mois
                </Link>
              </li>
              <li>
                <Link to="/register?role=BUSINESS" className="hover:text-blue-400 transition-colors flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  Espace Entreprise
                </Link>
              </li>
              <li>
                <Link to="/register?role=CLIENT" className="hover:text-amber-300 transition-colors flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  Adhésion VIP Togo
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 4 : Coordonnées Réelles Togo (Lomé) */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase">Contact & Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Siège : <strong>Lomé, Togo 🇹🇬</strong></span>
              </li>
              <li>
                <a
                  href="https://wa.me/22893919212"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>WhatsApp : <strong>+228 93 91 92 12</strong></span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+22899255231"
                  className="flex items-center gap-2 text-slate-300 hover:text-amber-400 transition-colors"
                >
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Appel : <strong>+228 99 25 52 31</strong></span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:kondutogo@mail.com"
                  className="flex items-center gap-2 text-slate-300 hover:text-blue-400 transition-colors"
                >
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Email : <strong>kondutogo@mail.com</strong></span>
                </a>
              </li>
              <li className="pt-2">
                <Link to="/support" className="inline-flex items-center gap-1 text-xs text-amber-400 font-bold hover:underline">
                  Ouvrir un ticket d'aide &rarr;
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Ligne inférieure de copyright */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} KONDU Togo. Tous droits réservés. Modèle équitable à 0% de commission.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              Conçu avec excellence <Heart className="w-3 h-3 text-red-500 fill-red-500" /> à Lomé, Togo
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
