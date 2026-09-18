import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass, MapPin, ArrowRight, Star, Shield,
  CheckCircle2, Car, ChevronDown, Download, Clock, Zap,
  Phone, Mail, MessageSquare, ShieldCheck,
  LogIn, LogOut, Menu, X, LayoutDashboard, Smartphone
} from 'lucide-react';
import { KonduAIAssistant } from '../components/KonduAIAssistant';
import { useAuth } from '../context/AuthContext';
import { getDashboardRouteForRole } from '../components/AuthGuard';

/* ─── ICÔNE OFFICIELLE WHATSAPP SVG (Logo officiel vert avec bulle & téléphone blanc) ─── */
export const OfficialWhatsAppBadge: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="24" fill="#25D366"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M24 8C15.163 8 8 15.163 8 24c0 3.024.84 5.856 2.301 8.269L8.08 40l7.824-2.227A15.93 15.93 0 0024 40c8.837 0 16-7.163 16-16S32.837 8 24 8zm-1.792 23.776c-3.92-2-6.464-5.904-6.624-6.272-.16-.368-1.264-1.68-1.264-3.216 0-1.536.8-2.288 1.088-2.608.288-.304.64-.384.848-.384.208 0 .432.016.608.016.192.016.464-.08.72.624.272.624.928 2.256 1.008 2.416.08.16.144.352.032.56-.112.208-.176.352-.336.544-.16.192-.352.432-.496.576-.16.16-.336.336-.144.672.192.336.864 1.424 1.856 2.304 1.28 1.136 2.352 1.488 2.688 1.648.336.16.528.144.72-.08.192-.224.832-.976 1.056-1.312.224-.336.448-.272.752-.16.304.112 1.952.928 2.288 1.088.336.16.56.24.64.384.08.144.08.832-.224 1.68-.304.848-1.808 1.632-2.512 1.68-.704.048-1.632.256-5.312-1.68z" fill="white"/>
  </svg>
);

/* ─── TÉLÉPHONE MOCKUP avec Google Maps réel ─────────────────────────────── */
const PhoneMockup: React.FC = () => (
  <div className="phone-mockup animate-float-phone">
    <div className="phone-screen">

      {/* ── GOOGLE MAPS EMBED (Lomé, Togo) ── */}
      <iframe
        title="KONDU Google Maps Lomé Togo"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63467.43343360408!2d1.185671!3d6.172504!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1023e1c113185419%3A0x3224b5422caf411d!2sLom%C3%A9%2C%20Togo!5e0!3m2!1sfr!2stg!4v1710000000000!5m2!1sfr!2stg"
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
            <span style={{ fontSize: 9, color: '#475569', fontWeight: 500 }}>Déckon / Grand Marché Lomé</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', borderRadius: 8, padding: '5px 8px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: '#475569', fontWeight: 500 }}>Aéroport Int. / Baguida</span>
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

/* ─── NAVBAR RÉACTIVE AUTHENTIFIÉE ─────────────────────────────────────────── */
const Navbar: React.FC<{ onOpenDownload: () => void }> = ({ onOpenDownload }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, role, signOut } = useAuth();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(255,255,255,0.98)' : 'white',
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

        {/* Nav links desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginLeft: 36, flex: 1 }} className="hidden md:flex">
          {[
            { label: 'Accueil', href: '#hero' },
            { label: 'Nos services', href: '#services', hasArrow: true },
            { label: 'Boutique', href: '/shop' },
            { label: 'Actualités', href: '#news' },
            { label: 'Nous contacter', href: '#contact' },
          ].map(({ label, href, hasArrow }) => (
            <a
              key={label}
              href={href}
              style={{
                fontSize: 14, fontWeight: 600, color: '#374151',
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

        {/* Actions Authentification */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link
                to={getDashboardRouteForRole(role)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: 'white',
                  padding: '9px 18px', borderRadius: 12,
                  fontWeight: 800, fontSize: 13, textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(14,165,233,0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                <LayoutDashboard style={{ width: 16, height: 16 }} />
                <span>Mon Espace</span>
                <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 7px', borderRadius: 20, fontSize: 10, textTransform: 'uppercase' }}>
                  {role || 'COMPTE'}
                </span>
              </Link>
              <button
                onClick={() => signOut()}
                title="Se déconnecter"
                style={{
                  padding: '9px 12px', borderRadius: 12, background: '#f8fafc',
                  border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer'
                }}
              >
                <LogOut style={{ width: 16, height: 16 }} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link
                to="/login"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: '#0f172a', fontWeight: 700, fontSize: 13,
                  textDecoration: 'none', padding: '9px 16px', borderRadius: 12,
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease'
                }}
              >
                <LogIn style={{ width: 15, height: 15, color: '#f59e0b' }} />
                Connexion
              </Link>
              <Link
                to="/register"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#0f172a',
                  padding: '9px 16px', borderRadius: 12,
                  fontWeight: 800, fontSize: 13, textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(245,158,11,0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                <ShieldCheck style={{ width: 15, height: 15 }} />
                S'inscrire
              </Link>
            </div>
          )}

          <button
            onClick={onOpenDownload}
            style={{
              display: 'none', alignItems: 'center', gap: 6,
              background: '#0ea5e9', color: 'white',
              padding: '9px 16px', borderRadius: 12,
              fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(14,165,233,0.3)',
              transition: 'all 0.2s ease'
            }}
            className="lg:flex"
          >
            <Download style={{ width: 15, height: 15 }} />
            Application
          </button>

          {/* Bouton Hamburger Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: '8px', borderRadius: 10, background: '#f8fafc',
              border: '1px solid #e2e8f0', color: '#334155', cursor: 'pointer'
            }}
            className="md:hidden"
          >
            {mobileMenuOpen ? <X style={{ width: 22, height: 22 }} /> : <Menu style={{ width: 22, height: 22 }} />}
          </button>
        </div>
      </div>

      {/* Menu Déroulant Mobile */}
      {mobileMenuOpen && (
        <div style={{
          background: 'white', borderBottom: '1px solid #e2e8f0',
          padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14
        }} className="md:hidden">
          <a href="#hero" onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>Accueil</a>
          <a href="#services" onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>Nos services</a>
          <Link to="/shop" onClick={() => setMobileMenuOpen(false)} style={{ color: '#d97706', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>Boutique Officielle</Link>
          <a href="#news" onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>Actualités</a>
          <a href="#contact" onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>Nous contacter</a>
          <button onClick={() => { setMobileMenuOpen(false); onOpenDownload(); }} style={{ background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 12, padding: '10px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download style={{ width: 16, height: 16 }} /> Télécharger l'application
          </button>
        </div>
      )}
    </nav>
  );
};

/* ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────── */
export const LandingPage: React.FC = () => {
  const { user, role } = useAuth();
  const [counters, setCounters] = useState({ chauffeurs: 0, courses: 0, villes: 0 });
  const [dynamicPhraseIndex, setDynamicPhraseIndex] = useState(0);

  // États pour le formulaire de contact rapide
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // États des Modales
  const [showCharterModal, setShowCharterModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const dynamicPhrases = [
    'partout en Afrique',
    'sans attendre ⚡',
    'en toute sécurité 🛡️',
    'au meilleur tarif 💎'
  ];

  useEffect(() => {
    const phraseTimer = setInterval(() => {
      setDynamicPhraseIndex((prev) => (prev + 1) % dynamicPhrases.length);
    }, 2800);
    return () => clearInterval(phraseTimer);
  }, []);

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
      <Navbar onOpenDownload={() => setShowDownloadModal(true)} />

      {/* ══════════════════════════════════════════
          HERO SECTION — Style BKG Speed Animé
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
        {/* Décorations de fond subtiles avec animation orb-float */}
        <div className="orb-float" style={{
          position: 'absolute', top: '10%', right: '-5%',
          width: 450, height: 450,
          background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />
        <div className="orb-float" style={{
          position: 'absolute', bottom: '5%', left: '-8%',
          width: 520, height: 520,
          background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none', animationDelay: '-3s'
        }} />

        <div className="max-w-7xl mx-auto px-6 pt-16 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center min-h-[calc(100vh-68px)] relative z-10">
          {/* ── COLONNE GAUCHE : Texte & CTAs ────────────────────────── */}
          <div style={{ animation: 'slideInLeft 0.8s ease-out forwards' }}>
            {/* Badge de confiance */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#f0f9ff', border: '1px solid #bae6fd',
              borderRadius: 100, padding: '6px 16px', marginBottom: 24,
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.12)'
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0284c7' }}>
                Disponible dans 12 villes d'Afrique
              </span>
            </div>

            {/* Titre principal — Animation Motion Design Professionnelle WOW */}
            <h1 style={{
              fontSize: 'clamp(44px, 5.8vw, 78px)',
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: '-2.5px',
              marginBottom: 24,
              position: 'relative'
            }}>
              <span className="kondu-gradient-title inline-flex items-center gap-3">
                KONDU,
                <span className="relative inline-flex items-center justify-center">
                  <Zap className="w-10 h-10 text-amber-500 speed-icon-animated inline-block" />
                </span>
              </span>
              <br />
              <span className="deplacez-animated-text">
                déplacez-vous
              </span>
              <br />
              <span key={dynamicPhraseIndex} className="sans-attendre-animated phrase-motion-in inline-flex items-center gap-3">
                {dynamicPhrases[dynamicPhraseIndex]}
                <span className="radar-dot ml-1 align-middle" />
              </span>
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
                to={user ? getDashboardRouteForRole(role) : "/register?role=CLIENT"}
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
                {user ? "Accéder à mon espace" : "Commander une course"}
                <ArrowRight style={{ width: 18, height: 18 }} />
              </Link>

              <Link
                to={user?.id && role === 'PROVIDER' ? "/dashboard/provider" : "/register?role=PROVIDER"}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
            {[
              { id: 'moto', image: '/images/service_moto_taxi.jpg', title: 'Moto-Taxi Express', desc: 'Le Zémidjan réinventé. Chauffeur vérifié, GPS en direct, prix fixe.', tag: 'Le + rapide', badgeBg: '#fef3c7', badgeColor: '#d97706' },
              { id: 'taxi', image: '/images/service_taxi_confort.jpg', title: 'Taxi Urbain Confort', desc: 'Berlines climatisées, chauffeurs professionnels. Pour vos RDV.', tag: 'Le + confort', badgeBg: '#dbeafe', badgeColor: '#0284c7' },
              { id: 'tricycle', image: '/images/service_tricycle_keke.jpg', title: 'Tricycle (Kéké)', desc: 'Parfait pour les petits trajets de quartier. Économique et rapide.', tag: 'Le + éco', badgeBg: '#dcfce7', badgeColor: '#15803d' },
              { id: 'vip', image: '/images/service_vip.jpg', title: 'Chauffeur VIP', desc: 'Véhicule de prestige avec chauffeur en costume. Aéroport, événements.', tag: 'Le + luxe', badgeBg: '#f3e8ff', badgeColor: '#7e22ce' },
              { id: 'moving', image: '/images/service_demenagement.jpg', title: 'Déménagement & Transport', desc: 'Camions et manutentionnaires pour déménagements et gros achats.', tag: 'Le + grand', badgeBg: '#ffedd5', badgeColor: '#c2410c' },
              { id: 'business', image: '/images/service_business.jpg', title: 'KONDU Business', desc: 'Dashboard pro pour entreprises. Multi-commandes, facturation, rapports.', tag: 'Pour entreprises', badgeBg: '#f0f9ff', badgeColor: '#0369a1' },
            ].map(({ id, image, title, desc, tag, badgeBg, badgeColor }) => {
              const serviceDestination = id === 'business'
                ? (user ? '/dashboard/business' : '/register?role=BUSINESS')
                : (user ? `/dashboard/client?service=${id}` : '/register?role=CLIENT');

              return (
                <div
                  key={title}
                  style={{
                    background: 'white', borderRadius: 24, overflow: 'hidden',
                    border: '1px solid #f1f5f9', transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    display: 'flex', flexDirection: 'column'
                  }}
                  className="group hover:-translate-y-2 hover:shadow-2xl hover:border-amber-400/40"
                >
                  {/* Photo réelle HD avec badge superposé */}
                  <div style={{ position: 'relative', width: '100%', height: 210, overflow: 'hidden', background: '#f1f5f9' }}>
                    <img 
                      src={image} 
                      alt={title} 
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        transition: 'transform 0.5s ease'
                      }}
                      className="group-hover:scale-105"
                    />
                    <div style={{
                      position: 'absolute', top: 14, left: 14,
                      background: badgeBg, borderRadius: 100,
                      padding: '5px 14px', border: '1px solid rgba(255,255,255,0.8)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: badgeColor }}>{tag}</span>
                    </div>
                  </div>

                  {/* Contenu textuel */}
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>{title}</h3>
                      <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>{desc}</p>
                    </div>
                    <Link 
                      to={serviceDestination} 
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        color: '#0ea5e9', fontWeight: 800, fontSize: 14,
                        textDecoration: 'none', transition: 'color 0.2s'
                      }}
                      className="group-hover:text-amber-500"
                    >
                      {id === 'business' ? 'Accéder à KONDU Business' : 'Commander ce service'} <ArrowRight style={{ width: 16, height: 16 }} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION CHAUFFEUR PRO — fond sombre
          ══════════════════════════════════════════ */}
      <section id="pro" style={{ background: '#0f172a', padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)', width: 300, height: 300, background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-[60px] items-center relative z-10">
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
              'Courses illimitées avec forfait journalier dès 500 F CFA',
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
              to={user ? (role === 'PROVIDER' ? '/dashboard/provider' : getDashboardRouteForRole(role)) : '/register?role=PROVIDER'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 32,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#030712',
                padding: '14px 28px', borderRadius: 14, fontWeight: 800, fontSize: 16,
                textDecoration: 'none', boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
                transition: 'all 0.25s ease'
              }}
            >
              <Car style={{ width: 20, height: 20 }} />
              {user ? (role === 'PROVIDER' ? 'Mon Dashboard Chauffeur →' : 'Accéder à mon Espace →') : 'Rejoindre KONDU PRO →'}
            </Link>
          </div>

          {/* Tarifs Officiels KONDU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { period: 'Pass 24H Essentiel', price: '500 F', unit: '/jour', highlight: false, features: ['Courses illimitées 24h', '0% commission KONDU', 'GPS temps réel actif'] },
              { period: 'Pass 24H Confort', price: '1 000 F', unit: '/jour', highlight: false, features: ['Courses illimitées 24h', '0% commission', 'Visibilité prioritaire'] },
              { period: 'Pass Hebdomadaire (7 Jours)', price: '2 500 F', unit: '/semaine', highlight: true, features: ['7 jours illimités', '0% commission', 'Badge Vérifié', 'Économique : 357 F/j'] },
              { period: 'Pass Mensuel Pro (30 Jours)', price: '8 000 F', unit: '/mois', highlight: false, features: ['30 jours illimités', '0% commission', 'Support dédié 7j/7'] },
              { period: 'KONDU VIP (30 Jours)', price: '15 000 F', unit: '/mois', highlight: true, features: ['Badge VIP Doré exclusif', 'Priorité matching n°1', 'Assistance WhatsApp 24/7'] },
            ].map(({ period, price, unit, highlight, features }) => (
              <div key={period} style={{
                background: highlight ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                border: highlight ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, padding: '18px 14px',
                position: 'relative'
              }}>
                {highlight && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: '#f59e0b', color: '#030712', fontSize: 10, fontWeight: 900,
                    padding: '3px 12px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap'
                  }}>⭐ Recommandé</div>
                )}
                <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{period}</p>
                <div style={{ margin: '8px 0 12px' }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: highlight ? '#f59e0b' : 'white' }}>{price}</span>
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
          SECTION ACTUALITÉS (id="news")
          ══════════════════════════════════════════ */}
      <section id="news" style={{ background: '#ffffff', padding: '90px 24px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          {/* En-tête de section */}
          <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 60px' }}>
            <span style={{
              fontSize: 12, fontWeight: 800, color: '#f59e0b', background: '#fef3c7',
              padding: '6px 16px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: 1.5
            }}>
              📰 Actualités & Médias
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: '#0f172a', letterSpacing: -1, marginTop: 16, marginBottom: 12 }}>
              Dernières Informations KONDU Togo
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6 }}>
              Découvrez les dernières innovations de mobilité, le déploiement du radar GPRS direct et l'expansion de nos services au Togo.
            </p>
          </div>

          {/* Grille d'articles de presse / actualités */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
            
            {/* Article 1 */}
            <div style={{
              background: '#f8fafc', borderRadius: 24, padding: 28, border: '1px solid #e2e8f0',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s'
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#0ea5e9', background: '#e0f2fe', padding: '4px 10px', borderRadius: 8 }}>
                  GPRS & GÉOLOCALISATION
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 14, marginBottom: 10, lineHeight: 1.4 }}>
                  Déploiement du Radar GPRS Temps Réel à Lomé
                </h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
                  Tous les chauffeurs partenaires certifiés sont géolocalisés en direct avec leurs plaques d'immatriculation togolaises certifiées (ex: TG 1234 AB) pour un suivi transparent et sécurisé.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>17 Septembre 2026</span>
                <span style={{ fontSize: 13, color: '#0ea5e9', fontWeight: 800 }}>Lire plus &rarr;</span>
              </div>
            </div>

            {/* Article 2 */}
            <div style={{
              background: '#f8fafc', borderRadius: 24, padding: 28, border: '1px solid #e2e8f0',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s'
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', background: '#fef3c7', padding: '4px 10px', borderRadius: 8 }}>
                  FORFAIT VIP 15 000 F
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 14, marginBottom: 10, lineHeight: 1.4 }}>
                  Nouveau Programme KONDU VIP Togo
                </h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
                  Bénéficiez du statut VIP à 15 000 F CFA / mois pour des trajets prioritaires en berlines climatisées avec chauffeurs partenaires de prestige.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>15 Septembre 2026</span>
                <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 800 }}>Découvrir VIP &rarr;</span>
              </div>
            </div>

            {/* Article 3 */}
            <div style={{
              background: '#f8fafc', borderRadius: 24, padding: 28, border: '1px solid #e2e8f0',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s'
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', background: '#d1fae5', padding: '4px 10px', borderRadius: 8 }}>
                  BOUTIQUE KONDU
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 14, marginBottom: 10, lineHeight: 1.4 }}>
                  Ouverture de la Boutique d'Équipements Auto/Moto
                </h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
                  Supports GPS pour guidon, casques certifiés et accessoires auto livrés directement à votre domicile à Lomé et dans les préfectures du Togo.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>10 Septembre 2026</span>
                <span style={{ fontSize: 13, color: '#10b981', fontWeight: 800 }}>Voir Boutique &rarr;</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION NOUS CONTACTER (id="contact")
          ══════════════════════════════════════════ */}
      <section id="contact" style={{ background: '#f8fafc', padding: '90px 24px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          {/* En-tête de section */}
          <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 60px' }}>
            <span style={{
              fontSize: 12, fontWeight: 800, color: '#0ea5e9', background: '#e0f2fe',
              padding: '6px 16px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: 1.5
            }}>
              📞 Service Client & Support
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: '#0f172a', letterSpacing: -1, marginTop: 16, marginBottom: 12 }}>
              Nous Contacter
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6 }}>
              Notre équipe d'assistance basée à Lomé est à votre disposition 7j/7 pour répondre à toutes vos demandes.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40 }}>
            
            {/* Colonne Gauche : Coordonnées Directes */}
            <div style={{ background: 'white', borderRadius: 28, padding: 36, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>
                Coordonnées Officielle KONDU Togo
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* Siège / Localisation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(245,158,11,0.15)' }}>
                    <MapPin style={{ width: 24, height: 24, color: '#d97706' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Adresse du Siège</h4>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>Lomé, Togo 🇹🇬 (Boulevard du 13 Janvier / Tokoin)</p>
                  </div>
                </div>

                {/* WhatsApp Direct */}
                <a href="https://wa.me/22893919212" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: '#e8f5e9', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(37,211,102,0.2)' }}>
                    <OfficialWhatsAppBadge size={32} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>WhatsApp Direct</h4>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#25D366', marginTop: 2 }}>+228 93 91 92 12</p>
                  </div>
                </a>

                {/* Téléphone Direct */}
                <a href="tel:+22899255231" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: '#fff7ed', border: '1px solid #ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(234,88,12,0.15)' }}>
                    <Phone style={{ width: 24, height: 24, color: '#ea580c' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Ligne Téléphonique</h4>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#ea580c', marginTop: 2 }}>+228 99 25 52 31</p>
                  </div>
                </a>

                {/* Email Officiel */}
                <a href="mailto:kondutogo@mail.com" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: '#e0f2fe', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(2,132,199,0.15)' }}>
                    <Mail style={{ width: 24, height: 24, color: '#0284c7' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Email Officiel</h4>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#0284c7', marginTop: 2 }}>kondutogo@mail.com</p>
                  </div>
                </a>

              </div>
            </div>

            {/* Colonne Droite : Formulaire de Message */}
            <div style={{ background: 'white', borderRadius: 28, padding: 36, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>
                Envoyer un Message Instantané
              </h3>

              <form onSubmit={(e) => {
                e.preventDefault();
                alert(`Merci ${contactName || 'à vous'} ! Votre message a été envoyé à l'équipe KONDU Togo. Nous vous contacterons rapidement au ${contactPhone}.`);
                setContactName('');
                setContactPhone('');
                setContactMessage('');
              }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Votre Nom Complet *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ex: Kodjo Koffi"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: 14, fontWeight: 600, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Votre Téléphone ou WhatsApp *</label>
                  <input
                    type="text"
                    inputMode="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => {
                      // Autoriser uniquement la saisie des chiffres, le +, les espaces et les tirets
                      const cleaned = e.target.value.replace(/[^0-9+\s()-]/g, '');
                      setContactPhone(cleaned);
                    }}
                    placeholder="Ex: +228 90 00 00 00"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: 14, fontWeight: 600, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Votre Message / Question *</label>
                  <textarea
                    required
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Comment pouvons-nous vous aider ?"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: 14, fontWeight: 600, outline: 'none', resize: 'none' }}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '14px 24px', borderRadius: 14, background: '#f59e0b', color: '#0f172a',
                    fontWeight: 900, fontSize: 15, border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(245,158,11,0.3)', marginTop: 8
                  }}
                >
                  Envoyer mon Message &rarr;
                </button>
              </form>
            </div>

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
              to={user ? getDashboardRouteForRole(role) : '/register?role=CLIENT'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: '#0ea5e9', color: 'white',
                padding: '16px 36px', borderRadius: 16,
                fontWeight: 800, fontSize: 17, textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(14,165,233,0.35)'
              }}
            >
              <MapPin style={{ width: 22, height: 22 }} />
              {user ? `Accéder à mon Espace (${role || 'DASHBOARD'})` : 'Créer mon compte Passager'}
            </Link>
            <Link
              to={user ? (role === 'PROVIDER' ? '/dashboard/provider' : '/register?role=PROVIDER') : '/register?role=PROVIDER'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'white', color: '#0f172a',
                padding: '16px 32px', borderRadius: 16,
                fontWeight: 700, fontSize: 16, textDecoration: 'none',
                border: '2px solid #e2e8f0'
              }}
            >
              <Car style={{ width: 20, height: 20 }} />
              {user ? (role === 'PROVIDER' ? 'Dashboard Chauffeur' : 'Devenir Chauffeur Pro') : "S'inscrire comme Chauffeur"}
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
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 12 }}>
                La plateforme de mobilité de référence à <strong>Lomé, Togo 🇹🇬</strong>. Transport, livraison et services avec <strong>0% de commission</strong>.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#cbd5e1' }}>
                <a href="https://wa.me/22893919212" target="_blank" rel="noreferrer" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MessageSquare style={{ width: 15, height: 15, color: '#22c55e' }} /> WhatsApp: +228 93 91 92 12
                </a>
                <a href="tel:+22899255231" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone style={{ width: 15, height: 15, color: '#f59e0b' }} /> Appel: +228 99 25 52 31
                </a>
                <a href="mailto:kondutogo@mail.com" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail style={{ width: 15, height: 15, color: '#38bdf8' }} /> Email: kondutogo@mail.com
                </a>
              </div>
            </div>
            {[
              { title: 'Services', links: ['Moto-Taxi', 'Taxi Confort', 'Tricycle', 'Berline VIP', 'Déménagement'] },
              { title: 'Chauffeurs', links: ['Pass 24H Essentiel — 500 F', 'Pass 24H Confort — 1 000 F', 'Pass Hebdo — 2 500 F', 'Pass Mensuel — 8 000 F', 'KONDU VIP — 15 000 F'] }
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>{title}</h4>
                {links.map((link) => (
                  <span key={link} style={{ display: 'block', fontSize: 14, color: '#94a3b8', marginBottom: 10 }}>{link}</span>
                ))}
              </div>
            ))}

            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Support & Charte</h4>
              <button 
                onClick={() => setShowCharterModal(true)}
                style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: 8, 
                  background: 'rgba(14,165,233,0.15)', border: '1px solid #0ea5e9', 
                  color: '#38bdf8', borderRadius: 12, padding: '8px 14px', 
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 12
                }}
              >
                <ShieldCheck style={{ width: 16, height: 16 }} />
                Charte de Bonne Conduite
              </button>
              <span style={{ display: 'block', fontSize: 13, color: '#94a3b8' }}>Lomé, Togo 🇹🇬 (Tokoin)</span>
              <span style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Support H24 & Assistant IA</span>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#64748b' }}>
              © {new Date().getFullYear()} KONDU Togo. Tous droits réservés. Modèle équitable à 0% de commission.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <a href="https://wa.me/22893919212" target="_blank" rel="noreferrer" title="WhatsApp +228 93919212" style={{
                padding: '6px 12px', borderRadius: 10, background: '#14532d', color: '#86efac',
                fontSize: 12, fontWeight: 700, textDecoration: 'none'
              }}>
                WhatsApp +228 93919212
              </a>
              <a href="tel:+22899255231" title="Appel +228 99255231" style={{
                padding: '6px 12px', borderRadius: 10, background: '#78350f', color: '#fde68a',
                fontSize: 12, fontWeight: 700, textDecoration: 'none'
              }}>
                Appel +228 99255231
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal Officiel de la Charte de Bonne Conduite */}
      {showCharterModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'white', borderRadius: 28, maxWidth: 750, width: '100%',
            maxHeight: '90vh', overflowY: 'auto', padding: 32, position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setShowCharterModal(false)}
              style={{
                position: 'absolute', top: 20, right: 20, width: 36, height: 36,
                borderRadius: '50%', background: '#f1f5f9', border: 'none',
                fontWeight: 800, color: '#64748b', cursor: 'pointer', fontSize: 16
              }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck style={{ width: 24, height: 24, color: '#0284c7' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Charte Officielle de Bonne Conduite KONDU Togo
                </h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontWeight: 600 }}>
                  Document Officiel d'Exploitation & de Conduite Professionnelle — Version 1.0
                </p>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '16px 0 24px' }} />

            <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 16, borderLeft: '4px solid #0ea5e9' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>1. Préambule & Esprit KONDU</h4>
                <p style={{ margin: 0, fontSize: 13 }}>
                  La plateforme KONDU offre un modèle équitable à 0% de commission au Togo. Chaque utilisateur (Chauffeur, Client, Business) s'engage à maintenir une conduite exemplaire, respectueuse et sécurisée.
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, color: '#0ea5e9' }}>🚕 Engagements des Chauffeurs & Prestataires</h4>
                <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>GPS Réel Obligatoire</strong> : Le mode ONLINE nécessite la position GPS exacte. L'utilisation de Fake GPS entraîne une suspension immédiate.</li>
                  <li><strong>Conformité du Véhicule</strong> : Papiers à jour, casques obligatoires pour motos, entretien mécanique et propreté exemplaire.</li>
                  <li><strong>Courtoisie & Sécurité</strong> : Tolérance zéro pour l'alcool, la vitesse excessive ou l'impolitesse envers les clients.</li>
                  <li><strong>Respect du Tarif</strong> : Interdiction absolue de demander des montants supérieurs au prix affiché.</li>
                </ul>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, color: '#f59e0b' }}>👤 Engagements des Clients</h4>
                <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>Position Exacte & Ponctualité</strong> : Indiquer l'adresse précise et être prêt dès l'arrivée du chauffeur.</li>
                  <li><strong>Respect des Équipements</strong> : Prenez soin du véhicule et adoptez une attitude courtoise.</li>
                  <li><strong>Objets Prohibés</strong> : Interdiction de transporter des matières dangereuses, illégales ou interdites par la loi togolaise.</li>
                </ul>
              </div>

              <div style={{ background: '#fef2f2', padding: 16, borderRadius: 16, border: '1px solid #fecaca' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 800, color: '#dc2626' }}>⚖️ Sanctions & Tolérance Zéro</h4>
                <p style={{ margin: 0, fontSize: 12, color: '#991b1b' }}>
                  Toute tentative de fraude, fausse position GPS, comportement irrespectueux ou marchandage illégal entraînera une suspension temporaire ou définitive du compte KONDU.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setShowCharterModal(false)}
                style={{
                  padding: '12px 24px', borderRadius: 14, background: '#0ea5e9', color: 'white',
                  fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(14,165,233,0.3)'
                }}
              >
                J'ai lu et j'accepte la Charte KONDU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Téléchargement / Installation Application PWA */}
      {showDownloadModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'white', borderRadius: 28, maxWidth: 520, width: '100%',
            padding: 32, position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setShowDownloadModal(false)}
              style={{
                position: 'absolute', top: 20, right: 20, width: 36, height: 36,
                borderRadius: '50%', background: '#f1f5f9', border: 'none',
                fontWeight: 800, color: '#64748b', cursor: 'pointer', fontSize: 16
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 12px 24px rgba(14,165,233,0.3)', marginBottom: 16
              }}>
                <Smartphone style={{ width: 32, height: 32, color: 'white' }} />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
                Installer l'Application KONDU
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                Profitez de KONDU en un clic directement depuis votre écran d'accueil, sans passer par un store.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>🤖</span>
                  <strong style={{ fontSize: 14, color: '#0f172a' }}>Sur Android (Chrome) :</strong>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b', paddingLeft: 28 }}>
                  Appuyez sur les <strong>trois points (⋮)</strong> en haut à droite, puis sélectionnez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>🍏</span>
                  <strong style={{ fontSize: 14, color: '#0f172a' }}>Sur iPhone / iPad (Safari) :</strong>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b', paddingLeft: 28 }}>
                  Appuyez sur l'icône de <strong>partage</strong> (carré avec flèche vers le haut), puis faites défiler et choisissez <strong>« Sur l'écran d'accueil »</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDownloadModal(false)}
              style={{
                width: '100%', padding: '14px', borderRadius: 16,
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white',
                fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(14,165,233,0.35)'
              }}
            >
              Compris, j'installe l'application
            </button>
          </div>
        </div>
      )}

      {/* Assistant IA KONDU Officiel */}
      <KonduAIAssistant />
    </div>
  );
};
