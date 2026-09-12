import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Heart, Car, Building2, Crown, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Colonne 1 : Présentation & Identité */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Compass className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">KONDU</span>
            </Link>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              La plateforme de mobilité et de mise en relation de référence. Déplacez-vous, transportez vos marchandises et développez votre activité professionnelle avec <strong className="text-amber-400">0% de commission</strong> sur les courses.
            </p>

            <div className="flex items-center gap-3 pt-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Plateforme Sécurisée</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-amber-400">
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
              <li><Link to="/register?role=CLIENT" className="hover:text-amber-400 transition-colors">Déménagement & Meubles</Link></li>
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
                <Link to="/#pro" className="hover:text-amber-400 transition-colors">
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
                <Link to="/#vip" className="hover:text-amber-300 transition-colors flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  Adhésion VIP
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 4 : Assistance & Contact */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase">Support & Contact</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Hub Principal Ouest-Africain</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>support@kondu.app</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>WhatsApp Assistance 24/7</span>
              </li>
              <li className="pt-2">
                <Link to="/support" className="inline-flex items-center gap-1 text-xs text-amber-400 font-semibold hover:underline">
                  Ouvrir un ticket d'aide &rarr;
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Ligne inférieure de copyright */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} KONDU. Tous droits réservés. Modèle économique équitable à 0% de commission.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Conçu avec excellence <Heart className="w-3 h-3 text-red-500 fill-red-500" /> pour l'Afrique
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
