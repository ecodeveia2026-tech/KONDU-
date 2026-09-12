import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass, MapPin, ArrowRight, Phone, Star, Shield,
  CheckCircle2, Car, Bike, Truck, Crown, Building2,
  Menu, X, ChevronDown, Users, TrendingUp, Download,
  Zap, Clock, MessageCircle
} from 'lucide-react';

/* ─── TÉLÉPHONE MOCKUP avec Google Maps réel ─────────────────────────────── */
const PhoneMockup: React.FC = () => (
  <div className="phone-mockup animate-float-phone">
    <div className="phone-screen">

      {/* ── GOOGLE MAPS EMBED (Cotonou, Bénin) ── */}
      <iframe
        title="KONDU Google Maps"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31736.10743899537!2d2.373604!3d6.3590282!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1024a9a9df256dcd%3A0xa6c2df70e2778e27!2sCotonou%2C%20B%C3%A9nin!5e0!3m2!1sfr!2sfr!4v1710000000000!5m2!1sfr!2sfr"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          pointerEvents: 'none',
          zIndex: 1
        }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />

      {/* En-tête app KONDU coloré */}
      <div className="phone-app-header" style={{ zIndex: 10 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 8, marginRight: 7,
          background: 'linear-gradient(135deg, #f59e0b 0%, #0ea5e9 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Compass style={{ width: 14, height: 14, color: 'white' }} />
        </div>
        <span style={{
          fontWeight: 900, fontSize: 14,
          background: 'linear-gradient(135deg, #f59e0b, #0ea5e9)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>KONDU</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700 }}>En ligne</span>
        </div>
      </div>

      {/* Pin départ animé par-dessus Google Maps */}
      <div style={{
        position: 'absolute', top: '38%', left: '40%',
        width: 24, height: 24, background: '#0ea5e9',
        borderRadius: '50%', border: '3px solid white',
        boxShadow: '0 2px 10px rgba(14,165,233,0.6)', zIndex: 8
      }}>
        <div style={{
          position: 'absolute', inset: -7,
          borderRadius: '50%', background: 'rgba(14,165,233,0.25)',
          animation: 'ping 1.5s ease-in-out infinite'
        }} />
      </div>

      {/* Pin arrivée animé */}
      <div style={{
        position: 'absolute', top: '52%', left: '58%',
        width: 24, height: 24, background: '#f59e0b',
        borderRadius: '50%', border: '3px solid white',
        boxShadow: '0 2px 10px rgba(245,158,11,0.6)', zIndex: 8
      }}>
        <div style={{
          position: 'absolute', inset: -7,
          borderRadius: '50%', background: 'rgba(245,158,11,0.25)',
          animation: 'ping 2s ease-in-out infinite 0.5s'
        }} />
      </div>

      {/* Icône moto chauffeur animé */}
      <div style={{
        position: 'absolute', top: '44%', left: '38%',
        fontSize: 18, zIndex: 4,
        animation: 'carMove 4s ease-in-out infinite'
      }}>🏍️</div>

      {/* Carte du bas */}
      <div className="phone-bottom-card">
        <p style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>Définissez votre trajet</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', borderRadius: 8, padding: '5px 8px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0ea5e9', flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: '#475569', fontWeight: 500 }}>Étoile Rouge / Centre-ville</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', borderRadius: 8, padding: '5px 8px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: '#475569', fontWeight: 500 }}>Aéroport Int. / Haie Vive</span>
          </div>
        </div>
        <button style={{
          width: '100%', background: '#0ea5e9', color: 'white',
          border: 'none', borderRadius: 10, padding: '7px 0',
          fontSize: 10, fontWeight: 800, cursor: 'pointer'
        }}>
          Confirmer l'arrivée →
        </button>
      </div>

    </div>
  </div>
);

/* ─── NAVBAR ──────────────────────────────────────────────────────────────── */
const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(255,255,255,0.97)' : 'white',
      borderBottom: '1px solid #f1f5f9',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s ease',
      boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 68 }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #0ea5e9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(14,165,233,0.35)'
          }}>
            <Compass style={{ width: 22, height: 22, color: 'white', strokeWidth: 2.5 }} />
          </div>
          <span style={{
            fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #0ea5e9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            KONDU
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginLeft: 48, flex: 1 }}>
          {[
            { label: 'Accueil', href: '#hero' },
            { label: 'À Propos', href: '#about' },
            { label: 'Nos services', href: '#services', hasArrow: true },
            { label: 'Actualités', href: '#news' },
            { label: 'F.A.Q', href: '#faq' },
            { label: 'Nous contacter', href: '#contact' },
          ].map(({ label, href, hasArrow }) => (
            <a
              key={label}
              href={href}
              style={{
                fontSize: 14, fontWeight: 500, color: '#374151',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3,
                transition: 'color 0.2s'
              }}
              className="nav-link"
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0ea5e9')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#374151')}
            >
              {label}
              {hasArrow && <ChevronDown style={{ width: 14, height: 14 }} />}
            </a>
          ))}
        </div>

        {/* CTA */}
        <Link
          to="/register"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#0ea5e9', color: 'white',
            padding: '10px 20px', borderRadius: 12,
            fontWeight: 700, fontSize: 14, textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(14,165,233,0.35)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#0284c7';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#0ea5e9';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Download style={{ width: 16, height: 16 }} />
          Télécharger l'application
        </Link>
      </div>
    </nav>
  );
};

/* ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────── */
export const LandingPage: React.FC = () => {
  const [counters, setCounters] = useState({ chauffeurs: 0, courses: 0, villes: 0 });

  useEffect(() => {
    const targets = { chauffeurs: 1200, courses: 48000, villes: 12 };
    const duration = 2500;
    const steps = 80;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / steps, 3);
      setCounters({
        chauffeurs: Math.round(targets.chauffeurs * ease),
        courses: Math.round(targets.courses * ease),
        villes: Math.round(targets.villes * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'white', overflowX: 'hidden' }}>
      <Navbar />

      {/* ══════════════════════════════════════════
          HERO SECTION — Style BKG Speed
          Fond blanc, titre noir massif à gauche,
          téléphone au centre, photo chauffeur à droite
          ══════════════════════════════════════════ */}
      <section
        id="hero"
        style={{
          background: 'white',
          paddingTop: 68,
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Décorations de fond subtiles */}
        <div style={{
          position: 'absolute', top: '10%', right: '-5%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', left: '-8%',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '60px 24px 40px',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 40, alignItems: 'center', minHeight: 'calc(100vh - 68px)'
        }}>
          {/* ── COLONNE GAUCHE : Texte & CTAs ────────────────────────── */}
          <div style={{ animation: 'slideInLeft 0.8s ease-out forwards' }}>
            {/* Badge de confiance */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#f0f9ff', border: '1px solid #bae6fd',
              borderRadius: 100, padding: '6px 16px', marginBottom: 24
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0284c7' }}>
                Disponible dans 12 villes d'Afrique
              </span>
            </div>

            {/* Titre principal — style BKG Speed */}
            <h1 style={{
              fontSize: 'clamp(40px, 5vw, 72px)',
              fontWeight: 900,
              color: '#0f172a',
              lineHeight: 1.05,
              letterSpacing: '-2px',
              marginBottom: 24
            }}>
              KONDU,<br />
              <span style={{ color: '#0f172a' }}>déplacez-vous</span><br />
              <span style={{ color: '#0f172a' }}>sans attendre</span>
            </h1>

            {/* Sous-titre */}
            <p style={{
              fontSize: 18, fontWeight: 400, color: '#64748b',
              lineHeight: 1.7, marginBottom: 36,
              maxWidth: 440
            }}>
              Transport, livraison et déménagement simplifiés pour vous offrir une expérience fluide{' '}
              <strong style={{ color: '#0f172a', fontWeight: 700 }}>partout en Afrique.</strong>
            </p>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
              <Link
                to="/register?role=CLIENT"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  background: '#0ea5e9', color: 'white',
                  padding: '14px 28px', borderRadius: 14,
                  fontWeight: 800, fontSize: 16, textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(14,165,233,0.35)',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#0284c7';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(14,165,233,0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#0ea5e9';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(14,165,233,0.35)';
                }}
              >
                <MapPin style={{ width: 20, height: 20 }} />
                Commander une course
                <ArrowRight style={{ width: 18, height: 18 }} />
              </Link>

              <Link
                to="/register?role=PROVIDER"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  background: 'white', color: '#0f172a',
                  padding: '14px 28px', borderRadius: 14,
                  fontWeight: 700, fontSize: 16, textDecoration: 'none',
                  border: '2px solid #e2e8f0',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0ea5e9';
                  e.currentTarget.style.color = '#0ea5e9';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#0f172a';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Car style={{ width: 20, height: 20 }} />
                Devenir chauffeur
              </Link>
            </div>

            {/* Badges de confiance — comme BKG Speed */}
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {[
                { icon: <Shield style={{ width: 18, height: 18, color: '#22c55e' }} />, value: '100%', label: 'Chauffeurs vérifiés' },
                { icon: <Clock style={{ width: 18, height: 18, color: '#0ea5e9' }} />, value: '< 3 min', label: "Temps d'attente" },
                { icon: <Star style={{ width: 18, height: 18, color: '#f59e0b' }} />, value: '4.9/5', label: 'Note moyenne' },
              ].map(({ icon, value, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{value}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── COLONNE DROITE : Téléphone + Photos flottantes ─────────── */}
          <div style={{
            position: 'relative', display: 'flex',
            justifyContent: 'center', alignItems: 'center',
            minHeight: 520, animation: 'slideInRight 0.8s ease-out 0.2s both'
          }}>

            {/* Photo chauffeur haut droite — comme BKG Speed */}
            <div
              className="animate-float"
              style={{
                position: 'absolute', top: 10, right: 0,
                width: 170, height: 120,
                borderRadius: 18, overflow: 'hidden',
                boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
                border: '3px solid white'
              }}
            >
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 8
              }}>
                <span style={{ fontSize: 48 }}>👩🏾‍✈️</span>
                <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: '3px 10px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>Chauffeure Pro ★ 4.9</span>
                </div>
              </div>
            </div>

            {/* TÉLÉPHONE CENTRAL */}
            <PhoneMockup />

            {/* Badge "Chauffeur en route" flottant sur le téléphone */}
            <div
              className="animate-float"
              style={{
                position: 'absolute', top: '35%', left: 0,
                background: 'white', borderRadius: 14,
                padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                border: '1px solid #f1f5f9',
                display: 'flex', alignItems: 'center', gap: 10,
                animation: 'float 4s ease-in-out infinite 1s'
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
              }}>🏍️</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>Chauffeur en route</div>
                <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>Arrivée dans 2 min 🟢</div>
              </div>
            </div>

            {/* Photo passagers bas gauche — comme BKG Speed */}
            <div
              style={{
                position: 'absolute', bottom: 30, left: 0,
                width: 150, height: 105,
                borderRadius: 18, overflow: 'hidden',
                boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                border: '3px solid white',
                animation: 'float 5s ease-in-out infinite 2s'
              }}
            >
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 4
              }}>
                <span style={{ fontSize: 40 }}>🚗</span>
                <span style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>Moto-taxi • 500 F</span>
              </div>
            </div>

            {/* Badge 0% commission */}
            <div
              style={{
                position: 'absolute', bottom: 20, right: 10,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: 14, padding: '10px 16px',
                boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
                animation: 'float 3.5s ease-in-out infinite 0.5s'
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>0%</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Commission</div>
            </div>

          </div>
        </div>

        {/* Texte "Prêt à embarquer" — comme BKG Speed en bas droite */}
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px 40px',
          display: 'flex', justifyContent: 'flex-end'
        }}>
          <div style={{ textAlign: 'right', maxWidth: 280 }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
              Prêt à embarquer pour une aventure passionnante avec KONDU ?
            </p>
            <Link
              to="/register"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                color: '#0ea5e9', fontWeight: 700, fontSize: 14,
                textDecoration: 'none', marginTop: 12
              }}
            >
              Rejoindre maintenant <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
          </div>
        </div>

        {/* Scroll down */}
        <div style={{ textAlign: 'center', paddingBottom: 30 }}>
          <a href="#vehicles" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#94a3b8', textDecoration: 'none', fontSize: 12, fontWeight: 500 }}>
            <span>Découvrez nos véhicules</span>
            <ChevronDown style={{ width: 20, height: 20 }} />
          </a>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          VÉHICULES DÉFILANTS
          ══════════════════════════════════════════ */}
      <section id="vehicles" style={{ background: '#f8fafc', padding: '60px 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
            Nos Véhicules
          </p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, color: '#0f172a', letterSpacing: -1 }}>
            Un véhicule pour chaque besoin
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', marginTop: 12, maxWidth: 500, margin: '12px auto 0' }}>
            Moto-taxi, Tricycle, Taxi, VIP, Camion — tous les prestataires vérifiés près de chez vous.
          </p>
        </div>

        {/* Ticker row 1 */}
        <div className="ticker-wrap" style={{ marginBottom: 12 }}>
          <div className="animate-ticker">
            {[
              { emoji: '🏍️', label: 'Moto-Taxi', price: 'dès 300 F', bg: '#fef3c7', border: '#fde68a' },
              { emoji: '🚕', label: 'Taxi Confort', price: 'dès 1 500 F', bg: '#dbeafe', border: '#bfdbfe' },
              { emoji: '🛺', label: 'Tricycle (Kéké)', price: 'dès 600 F', bg: '#dcfce7', border: '#bbf7d0' },
              { emoji: '🚗', label: 'Berline VIP', price: 'dès 4 000 F', bg: '#f3e8ff', border: '#e9d5ff' },
              { emoji: '🚛', label: 'Déménagement', price: 'dès 12 000 F', bg: '#ffedd5', border: '#fed7aa' },
              { emoji: '📦', label: 'Livraison Express', price: 'dès 500 F', bg: '#ffe4e6', border: '#fecdd3' },
              // Duplicate for seamless loop
              { emoji: '🏍️', label: 'Moto-Taxi', price: 'dès 300 F', bg: '#fef3c7', border: '#fde68a' },
              { emoji: '🚕', label: 'Taxi Confort', price: 'dès 1 500 F', bg: '#dbeafe', border: '#bfdbfe' },
              { emoji: '🛺', label: 'Tricycle (Kéké)', price: 'dès 600 F', bg: '#dcfce7', border: '#bbf7d0' },
              { emoji: '🚗', label: 'Berline VIP', price: 'dès 4 000 F', bg: '#f3e8ff', border: '#e9d5ff' },
              { emoji: '🚛', label: 'Déménagement', price: 'dès 12 000 F', bg: '#ffedd5', border: '#fed7aa' },
              { emoji: '📦', label: 'Livraison Express', price: 'dès 500 F', bg: '#ffe4e6', border: '#fecdd3' },
            ].map((v, i) => (
              <div key={i} style={{
                flexShrink: 0, width: 180, margin: '0 10px',
                background: v.bg, border: `2px solid ${v.border}`,
                borderRadius: 20, padding: '20px 16px',
                textAlign: 'center', transition: 'all 0.25s ease',
                cursor: 'pointer'
              }}>
                <div style={{ fontSize: 42, marginBottom: 8 }}>{v.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{v.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0ea5e9' }}>{v.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS SECTION
          ══════════════════════════════════════════ */}
      <section style={{ background: 'white', padding: '70px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, textAlign: 'center' }}>
          {[
            { value: `${counters.chauffeurs.toLocaleString()}+`, label: 'Chauffeurs actifs', icon: '🏍️' },
            { value: `${counters.courses.toLocaleString()}+`, label: 'Courses effectuées', icon: '🗺️' },
            { value: `${counters.villes}+`, label: 'Villes desservies', icon: '🏙️' },
          ].map(({ value, label, icon }) => (
            <div key={label} style={{
              padding: '32px 20px', borderRadius: 24,
              background: '#f8fafc', border: '1px solid #f1f5f9'
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: '#0ea5e9', letterSpacing: -1 }}>{value}</div>
              <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500, marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SERVICES SECTION
          ══════════════════════════════════════════ */}
      <section id="services" style={{ background: '#f8fafc', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
              Nos Services
            </p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, color: '#0f172a', letterSpacing: -1 }}>
              Tout ce dont vous avez besoin,<br />
              <span style={{ color: '#0ea5e9' }}>en un clic.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              { emoji: '🏍️', title: 'Moto-Taxi Express', desc: 'Le Zémidjan réinventé. Chauffeur vérifié, GPS en direct, prix fixe.', tag: 'Le + rapide', color: '#fef3c7' },
              { emoji: '🚕', title: 'Taxi Urbain Confort', desc: 'Berlines climatisées, chauffeurs professionnels. Pour vos RDV.', tag: 'Le + confort', color: '#dbeafe' },
              { emoji: '🛺', title: 'Tricycle (Kéké)', desc: 'Parfait pour les petits trajets de quartier. Économique et rapide.', tag: 'Le + éco', color: '#dcfce7' },
              { emoji: '🚗', title: 'Chauffeur VIP', desc: 'Véhicule de prestige avec chauffeur en costume. Aéroport, événements.', tag: 'Le + luxe', color: '#f3e8ff' },
              { emoji: '🚛', title: 'Déménagement & Transport', desc: 'Camions et manutentionnaires pour déménagements et gros achats.', tag: 'Le + grand', color: '#ffedd5' },
              { emoji: '🏢', title: 'KONDU Business', desc: 'Dashboard pro pour entreprises. Multi-commandes, facturation, rapports.', tag: 'Pour entreprises', color: '#f0f9ff' },
            ].map(({ emoji, title, desc, tag, color }) => (
              <div
                key={title}
                style={{
                  background: 'white', borderRadius: 20, padding: '28px 24px',
                  border: '1px solid #f1f5f9', transition: 'all 0.3s ease', cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(14,165,233,0.1)';
                  e.currentTarget.style.borderColor = '#bae6fd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#f1f5f9';
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 16, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 16 }}>
                  {emoji}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f0f9ff', borderRadius: 100, padding: '3px 12px', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0284c7' }}>{tag}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{desc}</p>
                <Link to="/register?role=CLIENT" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0ea5e9', fontWeight: 700, fontSize: 13, textDecoration: 'none', marginTop: 16 }}>
                  En savoir plus <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION CHAUFFEUR PRO — fond sombre
          ══════════════════════════════════════════ */}
      <section id="pro" style={{ background: '#0f172a', padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)', width: 300, height: 300, background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
              Espace Chauffeur Pro
            </p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, color: 'white', letterSpacing: -1, marginBottom: 20 }}>
              Gagnez <span style={{ color: '#f59e0b' }}>100%</span><br />de vos courses.
            </h2>
            <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.7, marginBottom: 36 }}>
              Finis les 25% de commission. Chez KONDU, payez un forfait fixe et gardez <strong style={{ color: 'white' }}>l'intégralité de vos gains</strong> sur chaque trajet.
            </p>
            {[
              'Courses illimitées avec forfait journalier dès 200 F CFA',
              'Badge Chauffeur Vérifié visible sur la carte',
              'GPS temps réel — clients vous voient instantanément',
              'Contact direct client via bouton WhatsApp',
            ].map((text) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <CheckCircle2 style={{ width: 18, height: 18, color: '#f59e0b', flexShrink: 0 }} />
                <span style={{ fontSize: 15, color: '#cbd5e1' }}>{text}</span>
              </div>
            ))}
            <Link
              to="/register?role=PROVIDER"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 32,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#030712',
                padding: '14px 28px', borderRadius: 14, fontWeight: 800, fontSize: 16,
                textDecoration: 'none', boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
                transition: 'all 0.25s ease'
              }}
            >
              <Car style={{ width: 20, height: 20 }} />
              Rejoindre KONDU PRO →
            </Link>
          </div>

          {/* Tarifs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { period: 'Pass 24H', price: '200 F', unit: '/jour', highlight: false, features: ['Courses illimitées', '0% commission', 'GPS actif'] },
              { period: 'Pass 7 Jours', price: '1 500 F', unit: '/semaine', highlight: true, features: ['7 jours illimités', '0% commission', 'Badge Vérifié'] },
              { period: 'Pass Mensuel', price: '4 000 F', unit: '/mois', highlight: false, features: ['30 jours illimités', '0% commission', 'Priorité matching'] },
              { period: 'KONDU VIP', price: '5 000 F', unit: '/mois', highlight: false, features: ['Badge VIP doré', 'Support 24/7', 'Priorité absolue'] },
            ].map(({ period, price, unit, highlight, features }) => (
              <div key={period} style={{
                background: highlight ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                border: highlight ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, padding: '20px 16px',
                position: 'relative'
              }}>
                {highlight && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: '#f59e0b', color: '#030712', fontSize: 10, fontWeight: 900,
                    padding: '3px 12px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap'
                  }}>⭐ Populaire</div>
                )}
                <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{period}</p>
                <div style={{ margin: '8px 0 12px' }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: highlight ? '#f59e0b' : 'white' }}>{price}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}> {unit}</span>
                </div>
                {features.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <CheckCircle2 style={{ width: 13, height: 13, color: highlight ? '#f59e0b' : '#22c55e', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{f}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA FINAL
          ══════════════════════════════════════════ */}
      <section style={{ background: '#f8fafc', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🚀</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, color: '#0f172a', letterSpacing: -1, marginBottom: 16 }}>
            Prêt à embarquer ?
          </h2>
          <p style={{ fontSize: 18, color: '#64748b', marginBottom: 36, lineHeight: 1.6 }}>
            Inscription gratuite. Sans engagement. Transport révolutionné en Afrique.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/register?role=CLIENT"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: '#0ea5e9', color: 'white',
                padding: '16px 36px', borderRadius: 16,
                fontWeight: 800, fontSize: 17, textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(14,165,233,0.35)'
              }}
            >
              <MapPin style={{ width: 22, height: 22 }} />
              Créer mon compte Passager
            </Link>
            <Link
              to="/register?role=PROVIDER"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'white', color: '#0f172a',
                padding: '16px 32px', borderRadius: 16,
                fontWeight: 700, fontSize: 16, textDecoration: 'none',
                border: '2px solid #e2e8f0'
              }}
            >
              <Car style={{ width: 20, height: 20 }} />
              S'inscrire comme Chauffeur
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════ */}
      <footer style={{ background: '#0f172a', borderTop: '1px solid #1e293b', padding: '48px 24px 28px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #0ea5e9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(14,165,233,0.3)' }}>
                  <Compass style={{ width: 20, height: 20, color: 'white', strokeWidth: 2.5 }} />
                </div>
                <span style={{
                  fontSize: 22, fontWeight: 900,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #0ea5e9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>KONDU</span>
              </div>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                La plateforme de mobilité africaine. Transport, livraison et services à portée de main.
              </p>
            </div>
            {[
              { title: 'Services', links: ['Moto-Taxi', 'Taxi Confort', 'Tricycle', 'Berline VIP', 'Déménagement'] },
              { title: 'Chauffeurs', links: ['Pass 24H — 200 F', 'Pass 7 Jours', 'KONDU VIP', 'KONDU Business', 'Devenir partenaire'] },
              { title: 'Support', links: ["Centre d'aide", 'Contact', 'F.A.Q', "Conditions d'utilisation", 'Confidentialité'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>{title}</h4>
                {links.map((link) => (
                  <a key={link} href="#" style={{ display: 'block', fontSize: 14, color: '#64748b', marginBottom: 10, textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#0ea5e9')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                  >{link}</a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#475569' }}>
              © {new Date().getFullYear()} KONDU. Tous droits réservés.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {[
                { icon: '📱', label: 'WhatsApp' },
                { icon: '📘', label: 'Facebook' },
                { icon: '📸', label: 'Instagram' },
              ].map(({ icon, label }) => (
                <a key={label} href="#" title={label} style={{
                  width: 36, height: 36, borderRadius: 10, background: '#1e293b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, textDecoration: 'none', transition: 'background 0.2s'
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#1e293b')}
                >{icon}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
