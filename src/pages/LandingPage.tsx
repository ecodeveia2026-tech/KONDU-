import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass, Car, Bike, Zap, Crown, Truck, CheckCircle2,
  ArrowRight, MapPin, Building2, Sparkles, Phone, Star,
  Shield, Clock, ChevronDown, Menu, X, Play,
  TrendingUp, Users, Award, Headphones
} from 'lucide-react';

// ─── Composant Navbar intégré ───────────────────────────────────────────────
const LandingNav: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-gray-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 text-white stroke-[2.5]" />
            </div>
            <span className={`text-2xl font-black tracking-tight transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>
              KONDU
            </span>
          </Link>

          {/* Nav links desktop */}
          <div className="hidden lg:flex items-center gap-8">
            {[
              { label: 'Accueil', href: '#hero' },
              { label: 'Nos Services', href: '#services' },
              { label: 'Chauffeurs Pro', href: '#pro' },
              { label: 'Entreprises', href: '#business' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className={`text-sm font-semibold transition-colors hover:text-amber-500 ${
                  scrolled ? 'text-slate-600' : 'text-white/80'
                }`}
              >
                {label}
              </a>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/login"
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                scrolled
                  ? 'text-slate-700 hover:text-amber-600'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 transition-all"
            >
              Commencer →
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2 rounded-lg ${scrolled ? 'text-slate-700' : 'text-white'}`}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white rounded-2xl shadow-2xl mx-2 mb-4 p-4 space-y-2 border border-gray-100">
            {[
              { label: 'Accueil', href: '#hero' },
              { label: 'Nos Services', href: '#services' },
              { label: 'Chauffeurs Pro', href: '#pro' },
              { label: 'Entreprises', href: '#business' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-slate-700 font-semibold hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-colors"
              >
                {label}
              </a>
            ))}
            <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
              <Link to="/login" className="px-4 py-3 text-center text-slate-700 font-semibold bg-gray-50 rounded-xl">
                Connexion
              </Link>
              <Link to="/register" className="px-4 py-3 text-center text-white font-bold bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow">
                Commencer
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// ─── Composant Vehicle Card pour le carousel ─────────────────────────────────
interface VehicleCardProps {
  emoji: string;
  label: string;
  price: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ emoji, label, price, color, bgColor, borderColor, description }) => (
  <div className={`vehicle-card flex-shrink-0 w-52 mx-3 rounded-2xl p-5 border ${borderColor} ${bgColor} cursor-pointer`}>
    <div className="text-5xl mb-3 text-center">{emoji}</div>
    <h3 className={`font-bold text-sm text-center ${color} mb-1`}>{label}</h3>
    <p className="text-xs text-slate-500 text-center mb-3">{description}</p>
    <div className={`text-center font-black text-base ${color}`}>{price}</div>
  </div>
);

// ─── Données véhicules ────────────────────────────────────────────────────────
const vehicles: VehicleCardProps[] = [
  { emoji: '🏍️', label: 'Moto-Taxi', price: 'dès 300 F', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', description: 'Zémidjan rapide et économique' },
  { emoji: '🚕', label: 'Taxi Confort', price: 'dès 1 500 F', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'Berline climatisée tout confort' },
  { emoji: '🛺', label: 'Tricycle (Kéké)', price: 'dès 600 F', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', description: 'Parfait pour le quartier' },
  { emoji: '🚗', label: 'Berline VIP', price: 'dès 4 000 F', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'Chauffeur privé premium' },
  { emoji: '🚛', label: 'Camion / Déménagement', price: 'dès 12 000 F', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'Transport de lourds & meubles' },
  { emoji: '📦', label: 'Livraison Express', price: 'dès 500 F', color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', description: 'Colis et marchandises rapides' },
];

// Doubled for seamless loop
const vehiclesLoop = [...vehicles, ...vehicles];

// ─── Composant principal LandingPage ─────────────────────────────────────────
export const LandingPage: React.FC = () => {
  const [activeService, setActiveService] = useState(0);
  const [counters, setCounters] = useState({ drivers: 0, rides: 0, cities: 0, satisfaction: 0 });
  const statsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // Counter animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const targets = { drivers: 1200, rides: 48000, cities: 12, satisfaction: 98 };
          const duration = 2000;
          const steps = 60;
          const interval = duration / steps;

          let step = 0;
          const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const ease = 1 - Math.pow(1 - progress, 3);
            setCounters({
              drivers: Math.round(targets.drivers * ease),
              rides: Math.round(targets.rides * ease),
              cities: Math.round(targets.cities * ease),
              satisfaction: Math.round(targets.satisfaction * ease),
            });
            if (step >= steps) clearInterval(timer);
          }, interval);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const services = [
    { icon: '🏍️', title: 'Moto-Taxi Express', desc: 'Le Zémidjan réinventé. Chauffeur vérifié, GPS en direct, prix fixe sans surprise.', tag: 'Le plus rapide', color: 'from-amber-400 to-orange-400' },
    { icon: '🚕', title: 'Taxi Urbain Confort', desc: 'Berlines climatisées, chauffeurs pros en costume. Idéal pour vos rendez-vous d\'affaires.', tag: 'Le plus confort', color: 'from-blue-400 to-cyan-400' },
    { icon: '🛺', title: 'Tricycle (Kéké)', desc: 'Parfait pour les petits trajets de quartier. Économique, pratique, partout disponible.', tag: 'Le plus économique', color: 'from-green-400 to-emerald-400' },
    { icon: '🚗', title: 'Chauffeur VIP', desc: 'Véhicule de prestige avec chauffeur en costume. Pour vos événements et aéroport.', tag: 'Le plus luxueux', color: 'from-purple-400 to-violet-400' },
    { icon: '🚛', title: 'Déménagement & Transport', desc: 'Camions et manutentionnaires pour déménagements, gros achats, transferts professionnels.', tag: 'Le plus grand', color: 'from-orange-400 to-red-400' },
  ];

  const testimonials = [
    { name: 'Adjoua K.', role: 'Cliente depuis 6 mois', rating: 5, text: 'Je commande mon Zémidjan chaque matin depuis KONDU. Le chauffeur arrive en moins de 3 minutes. Parfait !', avatar: '👩🏾' },
    { name: 'Kouassi M.', role: 'Chauffeur Pro KONDU', rating: 5, text: 'Avec KONDU, je garde 100% de mes courses. J\'ai doublé mes revenus par rapport aux applications avec commission !', avatar: '👨🏿' },
    { name: 'Aminata D.', role: 'Responsable Logistique', rating: 5, text: 'Notre entreprise utilise KONDU Business pour toutes nos livraisons. Le tableau de bord est excellent.', avatar: '👩🏾‍💼' },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <LandingNav />

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 35%, #0f172a 70%, #030712 100%)',
        }}
      >
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />

        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px] animate-pulse-glow" style={{ animationDelay: '-1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-400/5 rounded-full blur-[150px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* LEFT — Text content */}
            <div className="text-center lg:text-left space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-bold animate-fade-in-up">
                <Sparkles className="w-4 h-4 text-amber-400 animate-wiggle" />
                <span>0% Commission • Paiement Direct au Chauffeur</span>
              </div>

              {/* Headline */}
              <div className="animate-fade-in-up delay-200">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tight">
                  Déplacez-vous{' '}
                  <span className="gold-gradient-text">sans attendre</span>
                  <br />
                  <span className="text-3xl sm:text-4xl lg:text-5xl text-slate-300 font-bold">partout en Afrique.</span>
                </h1>
              </div>

              {/* Subheadline */}
              <p className="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up delay-300">
                Transport, livraison et déménagement simplifiés.{' '}
                <strong className="text-white">Moto-taxi, Taxi, Tricycle, VIP.</strong>{' '}
                Chauffeurs vérifiés, GPS en direct, prix transparents.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in-up delay-400">
                <Link
                  to="/register?role=CLIENT"
                  className="w-full sm:w-auto gold-gradient-btn px-8 py-4 rounded-2xl text-base font-extrabold flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/30 group"
                >
                  <MapPin className="w-5 h-5" />
                  <span>Commander une Course</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/register?role=PROVIDER"
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-base font-bold border border-white/20 hover:border-amber-500/50 flex items-center justify-center gap-2 transition-all backdrop-blur-sm group"
                >
                  <Car className="w-5 h-5 text-amber-400" />
                  <span>Devenir Chauffeur Pro</span>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 animate-fade-in-up delay-500">
                {[
                  { icon: <Shield className="w-4 h-4" />, label: '100% Chauffeurs vérifiés', color: 'text-emerald-400' },
                  { icon: <Clock className="w-4 h-4" />, label: 'Arrivée < 3 min', color: 'text-amber-400' },
                  { icon: <Star className="w-4 h-4" />, label: '4.9/5 satisfaction', color: 'text-yellow-400' },
                ].map(({ icon, label, color }) => (
                  <div key={label} className={`flex items-center gap-2 text-sm font-semibold ${color}`}>
                    {icon}
                    <span className="text-slate-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Booking Card */}
            <div className="relative animate-fade-in-right delay-300">
              {/* Floating badges */}
              <div className="absolute -top-6 -left-6 z-20 animate-float">
                <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping-slow" />
                  En ligne maintenant
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 z-20 animate-float-delay">
                <div className="bg-amber-500 text-slate-900 text-xs font-bold px-3 py-2 rounded-xl shadow-lg">
                  🏆 0% Commission
                </div>
              </div>

              {/* Main card */}
              <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                {/* Top shimmer */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Compass className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">KONDU — Trajet en direct</p>
                      <p className="text-slate-400 text-xs">GPS actif • Matching instantané</p>
                    </div>
                    <span className="ml-auto text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                      LIVE
                    </span>
                  </div>

                  {/* Vehicle selector */}
                  <div className="mb-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Type de véhicule</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 0, icon: '🏍️', label: 'Moto-Taxi', active: 'border-amber-500 bg-amber-500/10' },
                        { id: 1, icon: '🚕', label: 'Taxi', active: 'border-blue-500 bg-blue-500/10' },
                        { id: 2, icon: '🛺', label: 'Tricycle', active: 'border-green-500 bg-green-500/10' },
                      ].map(({ id, icon, label, active }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setActiveService(id)}
                          className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                            activeService === id
                              ? `${active} text-white border-2`
                              : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <span className="text-xl">{icon}</span>
                          <span className="text-xs font-semibold">{label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { id: 3, icon: '🚗', label: 'VIP', active: 'border-purple-500 bg-purple-500/10' },
                        { id: 4, icon: '🚛', label: 'Déménagement', active: 'border-orange-500 bg-orange-500/10' },
                      ].map(({ id, icon, label, active }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setActiveService(id)}
                          className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-2 ${
                            activeService === id
                              ? `${active} text-white border-2`
                              : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <span className="text-lg">{icon}</span>
                          <span className="text-xs font-semibold">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pickup / Dropoff */}
                  <div className="space-y-3 mb-5">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-emerald-400" />
                      <input
                        type="text"
                        defaultValue="Étoile Rouge / Centre-ville"
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-red-400" />
                      <input
                        type="text"
                        defaultValue="Aéroport / Haie Vive"
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Price estimate */}
                  <div className="bg-slate-800/80 rounded-2xl p-4 flex items-center justify-between mb-5 border border-slate-700">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Prix estimé</span>
                      <span className="text-xl font-black text-amber-400">
                        {['400-600 F', '1 500-2 500 F', '600-900 F', '4 000-6 000 F', '12 000-25 000 F'][activeService]} CFA
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 font-bold block">Commission KONDU : 0 F</span>
                      <span className="text-[10px] text-slate-500">100% pour le chauffeur</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    to="/register?role=CLIENT"
                    className="w-full gold-gradient-btn py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <span>Trouver un chauffeur maintenant</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="flex justify-center mt-16 animate-bounce-subtle">
            <a href="#vehicles" className="flex flex-col items-center gap-2 text-slate-500 hover:text-amber-400 transition-colors">
              <span className="text-xs font-medium">Découvrez nos véhicules</span>
              <ChevronDown className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* ── VEHICLES TICKER ──────────────────────────────────────────────── */}
      <section id="vehicles" className="py-20 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-sm font-bold mb-4">
            <Bike className="w-4 h-4" />
            Tous nos véhicules disponibles
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Un véhicule pour <span className="gold-gradient-text">chaque besoin</span>
          </h2>
          <p className="mt-3 text-slate-500 max-w-xl mx-auto">
            Moto-taxi, tricycle, taxi confort, berline VIP ou camion — KONDU connecte tous les prestataires de mobilité vérifiés près de chez vous.
          </p>
        </div>

        {/* Row 1 — scroll left */}
        <div className="vehicle-ticker-wrap mb-4">
          <div className="animate-ticker">
            {vehiclesLoop.map((v, i) => (
              <VehicleCard key={i} {...v} />
            ))}
          </div>
        </div>

        {/* Row 2 — scroll right */}
        <div className="vehicle-ticker-wrap">
          <div className="animate-ticker-reverse">
            {[...vehiclesLoop].reverse().map((v, i) => (
              <VehicleCard key={i} {...v} />
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS SECTION ────────────────────────────────────────────────── */}
      <section ref={statsRef} className="py-20 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-[120px]" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: `${counters.drivers.toLocaleString()}+`, label: 'Chauffeurs actifs', icon: <Users className="w-6 h-6" />, color: 'text-amber-400' },
              { value: `${counters.rides.toLocaleString()}+`, label: 'Courses effectuées', icon: <TrendingUp className="w-6 h-6" />, color: 'text-emerald-400' },
              { value: `${counters.cities}+`, label: 'Villes desservies', icon: <MapPin className="w-6 h-6" />, color: 'text-blue-400' },
              { value: `${counters.satisfaction}%`, label: 'Satisfaction clients', icon: <Star className="w-6 h-6" />, color: 'text-yellow-400' },
            ].map(({ value, label, icon, color }) => (
              <div key={label} className="space-y-3">
                <div className={`flex justify-center ${color}`}>{icon}</div>
                <div className={`text-4xl sm:text-5xl font-black ${color} text-shadow-glow`}>{value}</div>
                <div className="text-slate-400 text-sm font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES SECTION ─────────────────────────────────────────────── */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-bold mb-4">
              <Sparkles className="w-4 h-4" />
              Nos Services
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900">
              Tout ce dont vous avez besoin,{' '}
              <span className="gold-gradient-text">en un clic.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-amber-200 bg-white hover:bg-amber-50/30 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-2 cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  {service.icon}
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold mb-3">
                  {service.tag}
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{service.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{service.desc}</p>
                <Link
                  to="/register?role=CLIENT"
                  className="mt-4 inline-flex items-center gap-1.5 text-amber-600 font-bold text-sm group-hover:gap-2.5 transition-all"
                >
                  Commander →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROVIDER SECTION ─────────────────────────────────────────────── */}
      <section id="pro" className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-[80px] -translate-y-1/2" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold mb-6">
                <Car className="w-4 h-4" />
                Espace Chauffeur Professionnel
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6">
                Gagnez <span className="gold-gradient-text">100%</span> de vos courses.
                <br />
                <span className="text-2xl text-slate-300">Abonnements dès 200 F / jour.</span>
              </h2>
              <p className="text-slate-400 text-base leading-relaxed mb-8">
                Finis les 25% prélevés sur chaque trajet. Chez KONDU, vous payez un forfait fixe et gardez <strong className="text-white">l'intégralité de vos gains</strong>.
              </p>

              <div className="space-y-4">
                {[
                  { icon: <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />, text: 'Badge Chauffeur Vérifié affiché sur la carte' },
                  { icon: <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />, text: 'GPS temps réel — visibilité maximale pour les clients' },
                  { icon: <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />, text: 'Contact direct client via bouton WhatsApp' },
                  { icon: <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />, text: 'Statistiques de courses et revenus en temps réel' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    {icon}
                    <span className="text-slate-300 text-sm">{text}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/register?role=PROVIDER"
                className="mt-10 inline-flex items-center gap-3 gold-gradient-btn px-8 py-4 rounded-2xl text-base font-extrabold shadow-xl shadow-amber-500/25"
              >
                <Car className="w-5 h-5" />
                <span>Rejoindre KONDU PRO</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Pricing cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { period: 'Pass 24H', price: '200 F', unit: '/jour', color: 'border-slate-700', highlight: false, features: ['Courses illimitées 24h', '0% commission', 'GPS actif', 'Appel direct client'] },
                { period: 'Pass 7 Jours', price: '1 500 F', unit: '/semaine', color: 'border-amber-500', highlight: true, features: ['7 jours activité illimitée', '0% commission', 'Badge Vérifié', 'WhatsApp activé'] },
                { period: 'KONDU VIP', price: '5 000 F', unit: '/mois', color: 'border-amber-400/40', highlight: false, features: ['Priorité absolue matching', 'Badge VIP doré', 'Support 24/7', '30 jours complets'] },
              ].map(({ period, price, unit, color, highlight, features }) => (
                <div
                  key={period}
                  className={`relative rounded-2xl p-5 border ${color} ${
                    highlight
                      ? 'bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 shadow-2xl shadow-amber-500/15 scale-105'
                      : 'bg-slate-900/50'
                  }`}
                >
                  {highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                      ⭐ Le Plus Populaire
                    </div>
                  )}
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{period}</p>
                  <div className="flex items-end gap-1 mb-4">
                    <span className={`text-2xl font-black ${highlight ? 'text-amber-400' : 'text-white'}`}>{price}</span>
                    <span className="text-slate-400 text-xs mb-1">{unit}</span>
                  </div>
                  <ul className="space-y-2 mb-5">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${highlight ? 'text-amber-400' : 'text-emerald-400'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/register?role=PROVIDER"
                    className={`w-full py-2.5 rounded-xl text-xs font-bold text-center block transition-all ${
                      highlight
                        ? 'gold-gradient-btn shadow-lg shadow-amber-500/25'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    Activer
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BUSINESS SECTION ─────────────────────────────────────────────── */}
      <section id="business" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-bold mb-6">
                <Building2 className="w-4 h-4" />
                Solutions Entreprises
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-6">
                Optimisez la logistique de votre{' '}
                <span className="blue-gradient-text">entreprise.</span>
              </h2>
              <p className="text-slate-500 text-base leading-relaxed mb-8">
                Centralisez vos commandes de transport, suivez vos livraisons en temps réel et gérez votre flotte depuis un tableau de bord professionnel dédié.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { title: 'Multi-commandes simultanées', desc: 'Lancez plusieurs livraisons en même temps avec suivi centralisé.' },
                  { title: 'Flotte camions & déménageurs', desc: 'Accès direct aux camions avec manutentionnaires disponibles.' },
                  { title: 'Facturation & rapports Pro', desc: 'Exportez vos relevés de transport pour votre comptabilité.' },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <div className="p-2 rounded-xl bg-blue-500 text-white shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
                      <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/register?role=BUSINESS"
                className="inline-flex items-center gap-3 btn-glow-blue px-8 py-4 rounded-2xl text-base font-bold shadow-xl shadow-blue-500/20"
              >
                <Building2 className="w-5 h-5" />
                <span>Créer un compte Business</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Business preview card */}
            <div className="relative">
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                  <span className="text-white font-bold text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    Dashboard Business
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">KONDU Entreprise</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: 'Livraisons du mois', value: '48', unit: 'trajets', color: 'text-white' },
                    { label: 'Économies commissions', value: '~120 000', unit: 'F CFA', color: 'text-emerald-400' },
                    { label: 'Prestataires actifs', value: '12', unit: 'disponibles', color: 'text-blue-400' },
                    { label: 'Satisfaction équipe', value: '98%', unit: 'approbation', color: 'text-amber-400' },
                  ].map(({ label, value, unit, color }) => (
                    <div key={label} className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
                      <span className="text-xs text-slate-400 block mb-1">{label}</span>
                      <span className={`text-xl font-black ${color}`}>{value}</span>
                      <span className="text-slate-500 text-[10px] block">{unit}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-xs text-slate-400">
                  <p className="font-semibold text-slate-300 mb-2">Adapté pour :</p>
                  <div className="flex flex-wrap gap-2">
                    {['Boutiques E-commerce', 'Grossistes & Marchés', 'PME & Bureaux', 'Hôtels & Restaurants'].map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300 text-[11px]">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Ils font confiance à <span className="gold-gradient-text">KONDU</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, rating, text, avatar }) => (
              <div key={name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 hover:-translate-y-2">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl">
                    {avatar}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{name}</p>
                    <p className="text-slate-400 text-xs">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-amber-500/8 rounded-full blur-[120px]" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="glass-panel p-10 sm:p-16 rounded-3xl border border-amber-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />
            <div className="relative z-10">
              <div className="text-5xl mb-6 animate-wiggle inline-block">🚀</div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
                Prêt à embarquer ?
              </h2>
              <p className="text-slate-300 text-base max-w-xl mx-auto mb-10">
                Rejoignez la communauté KONDU. Inscription gratuite. Sans engagement. Transport révolutionné en Afrique.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register?role=CLIENT"
                  className="w-full sm:w-auto gold-gradient-btn px-10 py-4 rounded-2xl text-base font-extrabold shadow-2xl shadow-amber-500/30 flex items-center justify-center gap-3"
                >
                  <MapPin className="w-5 h-5" />
                  <span>Créer mon compte Passager</span>
                </Link>
                <Link
                  to="/register?role=PROVIDER"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-base font-bold border border-white/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Car className="w-5 h-5 text-amber-400" />
                  <span>S'inscrire comme Chauffeur</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-white stroke-[2.5]" />
                </div>
                <span className="text-xl font-black text-white">KONDU</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                La plateforme de mobilité africaine. Transport, livraison et services à portée de main.
              </p>
            </div>
            {[
              { title: 'Services', links: ['Moto-Taxi', 'Taxi Confort', 'Tricycle', 'Berline VIP', 'Déménagement'] },
              { title: 'Pour les pros', links: ['Pass 24H', 'Pass 7 jours', 'KONDU VIP', 'KONDU Business', 'Devenir partenaire'] },
              { title: 'Support', links: ['Centre d\'aide', 'Contact', 'Signaler un problème', 'Conditions d\'utilisation'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-white font-bold text-sm mb-4">{title}</h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-slate-400 text-sm hover:text-amber-400 transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-xs">
              © {new Date().getFullYear()} KONDU. Tous droits réservés.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-amber-500 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <Phone className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-amber-500 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <Headphones className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
