import React from 'react';
import { 
  Bike, 
  Car, 
  Truck, 
  Crown, 
  Users, 
  Zap, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface VehicleCardProps {
  id: string;
  name: string;
  category: string;
  description: string;
  baseFare: string;
  capacity: string;
  speed: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  gradient: string;
  borderGlow: string;
  features: string[];
}

const VEHICLES: VehicleCardProps[] = [
  {
    id: 'moto',
    name: 'Moto-Taxi Express',
    category: 'Zémidjan / Boda-Boda',
    description: 'Le choix n°1 pour esquiver les embouteillages aux heures de pointe avec un casque fourni.',
    baseFare: 'Dès 300 F CFA',
    capacity: '1 Passager',
    speed: 'Ultra-rapide',
    badge: 'POPULAIRE',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: <Bike className="w-10 h-10 text-amber-400" />,
    gradient: 'from-amber-500/15 via-slate-900 to-slate-950',
    borderGlow: 'hover:border-amber-500/60 hover:shadow-amber-500/20',
    features: ['Casque de sécurité certifié', 'Trajets courts et directs', '0% commission prélevée']
  },
  {
    id: 'taxi',
    name: 'Taxi Urbain Confort',
    category: 'Berline & Citadine',
    description: 'Confort optimal, climatisation disponible et espace bagages pour vos trajets sereins.',
    baseFare: 'Dès 1 000 F CFA',
    capacity: '1 à 4 Passagers',
    speed: 'Confortable',
    badge: 'CONFORT',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: <Car className="w-10 h-10 text-emerald-400" />,
    gradient: 'from-emerald-500/15 via-slate-900 to-slate-950',
    borderGlow: 'hover:border-emerald-500/60 hover:shadow-emerald-500/20',
    features: ['Véhicule 4 portes climatisé', 'Chauffeur professionnel vérifié', 'Partage de position en direct']
  },
  {
    id: 'tricycle',
    name: 'Tricycle Urbain (Kéké)',
    category: '3 Roues Économique',
    description: 'Pratique, aéré et idéal pour faire les marchés, transporter petits colis ou voyager à plusieurs.',
    baseFare: 'Dès 500 F CFA',
    capacity: '1 à 3 Passagers',
    speed: 'Économique',
    badge: 'ÉCONOMIQUE',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    icon: <Zap className="w-10 h-10 text-yellow-400" />,
    gradient: 'from-yellow-500/15 via-slate-900 to-slate-950',
    borderGlow: 'hover:border-yellow-500/60 hover:shadow-yellow-500/20',
    features: ['Accès aux ruelles étroites', 'Espace pour sacs et marchandises', 'Tarif de groupe avantageux']
  },
  {
    id: 'vip',
    name: 'KONDU VIP Berline',
    category: 'Chauffeur Privé & Affaires',
    description: 'Véhicule haut standing avec chauffeur en tenue, discrétion assurée et matching prioritaire immédiat.',
    baseFare: 'Dès 2 500 F CFA',
    capacity: '1 à 4 Passagers',
    speed: 'Premium',
    badge: 'VIP DORÉ',
    badgeColor: 'bg-amber-400/25 text-amber-200 border-amber-400/50 shadow-sm shadow-amber-400/30',
    icon: <Crown className="w-10 h-10 text-amber-300 fill-amber-300/20" />,
    gradient: 'from-amber-400/20 via-slate-900 to-slate-950',
    borderGlow: 'hover:border-amber-300 hover:shadow-amber-400/30',
    features: ['Véhicule haut de gamme récent', 'Matching n°1 prioritaire', 'Assistance personnalisée 24/7']
  },
  {
    id: 'moving',
    name: 'Camionnette Déménagement',
    category: 'Logistique & Mobiliers',
    description: 'Fourgonnettes et camionnettes équipées pour le transport de meubles, déménagements et gros cartons.',
    baseFare: 'Dès 10 000 F CFA',
    capacity: 'Jusqu’à 1.5 Tonne',
    speed: 'Sécurisé',
    badge: 'LOURD & MEUBLES',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    icon: <Truck className="w-10 h-10 text-purple-400" />,
    gradient: 'from-purple-500/15 via-slate-900 to-slate-950',
    borderGlow: 'hover:border-purple-500/60 hover:shadow-purple-500/20',
    features: ['Volume de chargement spacieux', 'Manutentionnaires sur demande', 'Assurance transport dédiée']
  },
  {
    id: 'delivery',
    name: 'Transport Marchandises Pro',
    category: 'Commerçants & Entreprises',
    description: 'Expéditions quotidiennes et distribution de stock pour boutiques et commerçants KONDU BUSINESS.',
    baseFare: 'Sur Devis / Direct',
    capacity: 'Grand Volume',
    speed: 'Express Pro',
    badge: 'ENTREPRISES',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: <ShieldCheck className="w-10 h-10 text-blue-400" />,
    gradient: 'from-blue-500/15 via-slate-900 to-slate-950',
    borderGlow: 'hover:border-blue-500/60 hover:shadow-blue-500/20',
    features: ['Facturation professionnelle', 'Suivi multi-destinations', 'Carnet d’adresses récurrent']
  }
];

export const VehicleShowcase: React.FC = () => {
  // Duplication de la liste pour assurer une boucle infinie de défilement fluide
  const duplicatedVehicles = [...VEHICLES, ...VEHICLES];

  return (
    <section className="py-20 bg-slate-950/80 relative overflow-hidden border-y border-slate-800/60">
      
      {/* Effets lumineux de fond */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Mobilité Multi-Véhicules & Déménagement
        </div>
        
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
          Trouvez le véhicule adapté <br className="hidden sm:block" />
          <span className="gold-gradient-text">en quelques secondes chrono</span>
        </h2>
        
        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          Du deux-roues ultra-rapide au camion de déménagement, bénéficiez de chauffeurs vérifiés à proximité avec <strong className="text-amber-400 font-semibold">0% de commission</strong> sur vos trajets.
        </p>
      </div>

      {/* Ticker / Carrousel Défilant Continu */}
      <div className="relative w-full overflow-hidden py-4 mask-radial">
        
        {/* Masques de fondu sur les bords gauche et droit */}
        <div className="absolute top-0 bottom-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-slate-950 to-transparent z-20 pointer-events-none"></div>
        <div className="absolute top-0 bottom-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-slate-950 to-transparent z-20 pointer-events-none"></div>

        {/* Rail de défilement animé CSS */}
        <div className="animate-ticker flex gap-6 px-4">
          {duplicatedVehicles.map((vehicle, index) => (
            <div
              key={`${vehicle.id}-${index}`}
              className={`w-[320px] sm:w-[360px] flex-shrink-0 rounded-2xl bg-gradient-to-b ${vehicle.gradient} p-6 border border-slate-800 shadow-xl transition-all duration-300 ${vehicle.borderGlow} group flex flex-col justify-between`}
            >
              {/* Entête de carte */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/60 shadow-inner group-hover:scale-110 transition-transform">
                    {vehicle.icon}
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${vehicle.badgeColor}`}>
                    {vehicle.badge}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {vehicle.category}
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  {vehicle.name}
                </h3>
                <p className="text-slate-300 text-sm mt-2 line-clamp-2 leading-relaxed">
                  {vehicle.description}
                </p>

                {/* Métadonnées rapides */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>{vehicle.capacity}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{vehicle.speed}</span>
                  </div>
                </div>

                {/* Liste des points forts */}
                <ul className="mt-3 space-y-1 text-[11px] text-slate-300">
                  {vehicle.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pied de carte avec tarif et action */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">Tarif Indicatif</span>
                  <span className="text-base font-extrabold text-amber-400">{vehicle.baseFare}</span>
                </div>
                <Link
                  to="/register?role=CLIENT"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-amber-500 text-white hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                >
                  <span>Commander</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Petit indicateur d'action */}
      <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Passez le curseur sur un véhicule pour figer le défilement et découvrir les détails</span>
      </div>
    </section>
  );
};
