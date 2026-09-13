import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getDashboardRouteForRole } from '../components/AuthGuard';
import type { UserRole, ServiceType } from '../lib/types';
import {
  Compass, Mail, Lock, User, Phone, Car, Building2,
  AlertCircle, Loader2, ShieldCheck, CheckCircle2,
  ArrowRight, Eye, EyeOff, Zap, Sparkles, MapPin, MessageSquare
} from 'lucide-react';

// Types de service avec labels et icônes
const SERVICE_OPTIONS: { value: ServiceType; label: string; icon: string }[] = [
  { value: 'moto', label: 'Moto-Taxi (Zémidjan / 2 Roues)', icon: '🏍️' },
  { value: 'taxi', label: 'Taxi Urbain Confort (Berline)', icon: '🚕' },
  { value: 'tricycle', label: 'Tricycle Urbain (Kéké / 3 Roues)', icon: '🛺' },
  { value: 'vip', label: 'Chauffeur Privé / Berline VIP', icon: '🚗' },
  { value: 'moving', label: 'Camionnette / Déménagement', icon: '🚛' },
  { value: 'delivery', label: 'Transport de Marchandises', icon: '📦' },
];

// Composant champ de saisie stable au niveau module (prévient toute perte de focus lors de la frappe)
interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  onClearError?: () => void;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
  error?: string;
  rightAction?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = React.memo(({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onClearError,
  placeholder,
  icon: Icon,
  required = true,
  error,
  rightAction,
}) => (
  <div>
    <label htmlFor={id} className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-amber-400 font-black">*</span>}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <Icon className={`h-4 w-4 ${error ? 'text-red-400' : 'text-amber-400/80'}`} />
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (onClearError) onClearError();
        }}
        placeholder={placeholder}
        className={`w-full bg-slate-950 border rounded-xl pl-10 ${rightAction ? 'pr-10' : 'pr-4'} py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all shadow-inner ${
          error
            ? 'border-red-500/80 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
            : 'border-slate-700/80 hover:border-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
        }`}
      />
      {rightAction && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {rightAction}
        </div>
      )}
    </div>
    {error && (
      <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1">
        <AlertCircle className="w-3.5 h-3.5" />
        {error}
      </p>
    )}
  </div>
));

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as UserRole) || 'CLIENT';

  // État du formulaire
  const [role, setRole] = useState<UserRole>(initialRole);
  const [step, setStep] = useState(1); // Wizard en 2 étapes pour PROVIDER/BUSINESS

  // Champs communs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Champs PROVIDER
  const [serviceType, setServiceType] = useState<ServiceType>('moto');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  // Champs BUSINESS
  const [companyName, setCompanyName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [businessType, setBusinessType] = useState('Commerce & Distribution');

  // État de soumission
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  // Validation des champs en temps réel
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Réinitialiser step lors du changement de rôle
  useEffect(() => {
    setStep(1);
    setErrorMsg(null);
    setFieldErrors({});
  }, [role]);

  // Validation en temps réel du mot de passe
  const passwordStrength = (): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2) return { score, label: 'Faible', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Moyen', color: 'bg-yellow-500' };
    return { score, label: 'Fort', color: 'bg-emerald-500' };
  };

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 3) {
      errors.fullName = 'Nom complet requis (min. 3 caractères)';
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      errors.email = 'Adresse e-mail valide requise';
    }
    if (!phone.trim() || phone.trim().length < 8) {
      errors.phone = 'Numéro de téléphone requis (+228...)';
    }
    if (password.length < 6) {
      errors.password = 'Mot de passe trop court (min. 6 caractères)';
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};

    if (role === 'PROVIDER') {
      if (!vehicleBrand.trim()) errors.vehicleBrand = 'Marque du véhicule requise';
      if (!vehiclePlate.trim() || vehiclePlate.trim().length < 4) errors.vehiclePlate = 'Plaque d\'immatriculation invalide';
    }
    if (role === 'BUSINESS') {
      if (!companyName.trim() || companyName.trim().length < 2) errors.companyName = 'Nom de l\'entreprise requis';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation selon rôle et étape
    if (role !== 'CLIENT' && !validateStep2()) return;
    if (role === 'CLIENT' && !validateStep1()) return;

    setIsSubmitting(true);

    try {
      // 1. Préparation des métadonnées pour le trigger PostgreSQL
      const metaData: Record<string, any> = {
        role,
        full_name: fullName.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
      };

      if (role === 'PROVIDER') {
        metaData.service_type = serviceType;
        metaData.vehicle_brand = vehicleBrand.trim();
        metaData.vehicle_model = vehicleModel.trim() || 'Standard';
        metaData.vehicle_plate = vehiclePlate.trim().toUpperCase();
      } else if (role === 'BUSINESS') {
        metaData.company_name = companyName.trim();
        metaData.registration_number = registrationNumber.trim() || null;
        metaData.business_type = businessType;
      }

      // 2. Inscription Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: metaData },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
          throw new Error('Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.');
        } else if (msg.includes('rate limit') || msg.includes('too many')) {
          throw new Error('Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.');
        } else if (msg.includes('weak password') || msg.includes('password')) {
          throw new Error('Mot de passe trop faible. Choisissez au moins 6 caractères avec des lettres et chiffres.');
        } else if (msg.includes('invalid email')) {
          throw new Error('Adresse e-mail invalide. Veuillez vérifier votre saisie.');
        }
        throw new Error(error.message);
      }

      if (data?.user) {
        if (data.session) {
          try {
            const profilePayload = {
              user_id: data.user.id,
              email: email.trim().toLowerCase(),
              full_name: fullName.trim(),
              phone: phone.trim(),
              whatsapp: whatsapp.trim() || phone.trim(),
              role,
            };

            const { error: profileError } = await supabase
              .from('profiles')
              .upsert(profilePayload, { onConflict: 'user_id' });

            if (profileError) {
              console.warn('Avertissement upsert profil:', profileError.message);
            }

            if (role === 'PROVIDER') {
              await supabase.from('provider_profiles').upsert({
                user_id: data.user.id,
                service_type: serviceType,
                vehicle_brand: vehicleBrand.trim(),
                vehicle_model: vehicleModel.trim() || 'Standard',
                vehicle_plate: vehiclePlate.trim().toUpperCase(),
                subscription_status: 'pending',
                is_online: false,
              }, { onConflict: 'user_id' });
            }

            if (role === 'BUSINESS') {
              await supabase.from('business_profiles').upsert({
                user_id: data.user.id,
                company_name: companyName.trim(),
                registration_number: registrationNumber.trim() || null,
                business_type: businessType,
              }, { onConflict: 'user_id' });
            }
          } catch (dbErr) {
            console.warn('Synchronisation profil (non bloquante):', dbErr);
          }

          await refreshProfile();
          const targetRoute = getDashboardRouteForRole(role);
          navigate(targetRoute, { replace: true });
        } else {
          setEmailConfirmationRequired(true);
        }
      }
    } catch (err: any) {
      console.error('Erreur inscription KONDU:', err);
      setErrorMsg(err.message || 'Une erreur inattendue s\'est produite. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Écran confirmation email ────────────────────────────────────────────
  if (emailConfirmationRequired) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="bg-slate-900/90 backdrop-blur-2xl py-10 px-8 rounded-3xl border border-emerald-500/30 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Compte créé avec succès !</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Un e-mail de confirmation a été envoyé à :<br />
                <strong className="text-amber-400 font-bold text-base">{email}</strong>
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 text-left space-y-2.5">
              <p className="font-semibold text-slate-100 flex items-center gap-1.5 mb-2">
                <Mail className="w-4 h-4 text-amber-400" />
                Étapes suivantes :
              </p>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>Ouvrez votre boîte de réception e-mail.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>Cliquez sur le lien de confirmation envoyé par KONDU.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>Connectez-vous pour accéder à votre tableau de bord.</span>
              </div>
            </div>
            <Link
              to="/login"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
            >
              <span>Aller à la page de connexion</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const needsStep2 = role === 'PROVIDER' || role === 'BUSINESS';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Halos de lumière de fond */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* En-tête avec logo & localisation officielle */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 text-center mb-6">
        <Link to="/" className="inline-flex items-center justify-center gap-3 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
            <Compass className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="text-3xl font-black text-white tracking-tight">KONDU</span>
        </Link>

        {/* Badge de localisation officielle */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3 shadow-md">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>Réseau Officiel — Lomé, Togo 🇹🇬</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Rejoindre le réseau KONDU
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Sélectionnez votre type de compte pour démarrer
        </p>

        {/* Barre de progression wizard */}
        {needsStep2 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                1
              </div>
              <span className={`text-xs font-bold ${step >= 1 ? 'text-amber-400' : 'text-slate-500'}`}>Compte</span>
            </div>
            <div className={`flex-1 max-w-[60px] h-0.5 ${step >= 2 ? 'bg-amber-500' : 'bg-slate-800'} transition-colors`} />
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                2
              </div>
              <span className={`text-xs font-bold ${step >= 2 ? 'text-amber-400' : 'text-slate-500'}`}>
                {role === 'PROVIDER' ? 'Véhicule' : 'Entreprise'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Carte principale Dark Mode Haute Précision */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-900/95 backdrop-blur-2xl py-8 px-6 sm:px-10 rounded-3xl border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
          
          {/* Ligne dorée supérieure d'accentuation */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600" />

          {/* Sélecteur de rôle */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
            {[
              { value: 'CLIENT' as UserRole, icon: <MapPin className="w-4 h-4" />, label: 'Passager' },
              { value: 'PROVIDER' as UserRole, icon: <Car className="w-4 h-4" />, label: 'Chauffeur' },
              { value: 'BUSINESS' as UserRole, icon: <Building2 className="w-4 h-4" />, label: 'Entreprise' },
            ].map(({ value, icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                  role === value
                    ? value === 'BUSINESS'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Message d'erreur global */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="font-medium">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">

            {/* ── ÉTAPE 1 : Informations communes ─────────────────────── */}
            {(step === 1 || role === 'CLIENT') && (
              <>
                <InputField
                  id="fullName"
                  label="Nom et prénoms"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Ex: Koffi Mensah"
                  icon={User}
                  error={fieldErrors.fullName}
                />

                <InputField
                  id="email"
                  label="Adresse e-mail"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="kondutogo@mail.com"
                  icon={Mail}
                  error={fieldErrors.email}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField
                    id="phone"
                    label="Téléphone (Appels)"
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    placeholder="+228 99 25 52 31"
                    icon={Phone}
                    error={fieldErrors.phone}
                  />
                  <InputField
                    id="whatsapp"
                    label="WhatsApp Direct"
                    type="tel"
                    value={whatsapp}
                    onChange={setWhatsapp}
                    placeholder="+228 93 91 92 12"
                    icon={MessageSquare}
                    required={false}
                  />
                </div>

                {/* Mot de passe */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                    Mot de passe <span className="text-amber-400 font-black">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className={`h-4 w-4 ${fieldErrors.password ? 'text-red-400' : 'text-amber-400/80'}`} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      placeholder="••••••••"
                      className={`w-full bg-slate-950 border rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                        fieldErrors.password
                          ? 'border-red-500/80 focus:border-red-400'
                          : 'border-slate-700/80 hover:border-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Indicateur de force */}
                  {password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 flex gap-1 h-1.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-all ${
                              i <= passwordStrength().score ? passwordStrength().color : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-[10px] font-bold ${
                        passwordStrength().color.replace('bg-', 'text-')
                      }`}>
                        {passwordStrength().label}
                      </span>
                    </div>
                  )}
                  {fieldErrors.password && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />{fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Confirmation mot de passe */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                    Confirmer le mot de passe <span className="text-amber-400 font-black">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className={`h-4 w-4 ${fieldErrors.confirmPassword ? 'text-red-400' : 'text-amber-400/80'}`} />
                    </div>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                      placeholder="••••••••"
                      className={`w-full bg-slate-950 border rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                        fieldErrors.confirmPassword
                          ? 'border-red-500/80 focus:border-red-400'
                          : 'border-slate-700/80 hover:border-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                      } ${confirmPassword && confirmPassword === password ? 'border-emerald-500/60' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword === password && (
                    <p className="mt-1.5 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mots de passe identiques
                    </p>
                  )}
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />{fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ── ÉTAPE 2 : Infos PROVIDER ─────────────────────────────── */}
            {step === 2 && role === 'PROVIDER' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                  <Car className="w-4 h-4" />
                  Informations Véhicule & Prestation (Lomé, Togo)
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                    Type de transport <span className="text-amber-400 font-black">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SERVICE_OPTIONS.map(({ value, label, icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setServiceType(value)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs text-left font-semibold transition-all ${
                          serviceType === value
                            ? 'border-amber-400 bg-amber-500/15 text-amber-300 shadow-md'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <span className="text-lg">{icon}</span>
                        <span className="truncate">{label.split(' (')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <InputField
                    id="vehicleBrand"
                    label="Marque"
                    value={vehicleBrand}
                    onChange={setVehicleBrand}
                    placeholder="Ex: Haojue / Toyota"
                    icon={Car}
                    error={fieldErrors.vehicleBrand}
                  />
                  <InputField
                    id="vehicleModel"
                    label="Modèle"
                    value={vehicleModel}
                    onChange={setVehicleModel}
                    placeholder="Ex: 110cc / Corolla"
                    icon={Zap}
                    required={false}
                  />
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                      Plaque Togo <span className="text-amber-400 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => {
                        setVehiclePlate(e.target.value.toUpperCase());
                        if (fieldErrors.vehiclePlate) setFieldErrors((prev) => ({ ...prev, vehiclePlate: '' }));
                      }}
                      placeholder="TG 1234 AB"
                      className={`w-full bg-slate-950 border rounded-xl px-3 py-3 text-sm text-white uppercase placeholder:text-slate-500 focus:outline-none transition-all ${
                        fieldErrors.vehiclePlate
                          ? 'border-red-500/80 focus:border-red-400'
                          : 'border-slate-700/80 hover:border-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                      }`}
                    />
                    {fieldErrors.vehiclePlate && (
                      <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldErrors.vehiclePlate}</p>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1.5">
                    <Sparkles className="w-4 h-4" />
                    Offre de lancement Spéciale Togo
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Bénéficiez de <strong>7 jours d'essai 100% gratuits</strong> dès validation de votre compte à Lomé. Ensuite seulement <strong>200 F CFA/jour</strong> et <strong>0% de commission</strong> prélevée sur vos gains !
                  </p>
                </div>
              </div>
            )}

            {/* ── ÉTAPE 2 : Infos BUSINESS ─────────────────────────────── */}
            {step === 2 && role === 'BUSINESS' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                  <Building2 className="w-4 h-4" />
                  Informations de l'Entreprise (Togo)
                </div>

                <InputField
                  id="companyName"
                  label="Raison sociale / Nom commercial"
                  value={companyName}
                  onChange={setCompanyName}
                  placeholder="Ex: Togo Distribution SARL"
                  icon={Building2}
                  error={fieldErrors.companyName}
                />

                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    id="registrationNumber"
                    label="N° NIF / RCCM"
                    value={registrationNumber}
                    onChange={setRegistrationNumber}
                    placeholder="TG-LOM-..."
                    icon={ShieldCheck}
                    required={false}
                  />
                  <InputField
                    id="businessType"
                    label="Secteur d'activité"
                    value={businessType}
                    onChange={setBusinessType}
                    placeholder="Commerce, Logistique..."
                    icon={Building2}
                    required={false}
                  />
                </div>

                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Avantages Compte Entreprise KONDU
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Plateforme centralisée pour commander des transports et livraisons avec facturation mensuelle et suivi GPS en temps réel.
                  </p>
                </div>
              </div>
            )}

            {/* ── Boutons de soumission / étape ──────────────────────────── */}
            <div className="pt-2">
              {role === 'CLIENT' && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Création de votre compte...</span></>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" /><span>Créer mon compte KONDU</span></>
                  )}
                </button>
              )}

              {needsStep2 && step === 1 && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 transition-all"
                >
                  <span>Continuer vers l'étape 2</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {needsStep2 && step === 2 && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold border border-slate-700 transition-colors"
                  >
                    ← Retour
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Création en cours...</span></>
                    ) : (
                      <><ShieldCheck className="w-4 h-4" /><span>Valider mon inscription</span></>
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Lien connexion */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" className="text-amber-400 font-bold hover:underline hover:text-amber-300 transition-colors">
                Se connecter ici →
              </Link>
            </p>
          </div>

          {/* ── Coordonnées Officielles Togo (Lomé) ──────────────────────── */}
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/20 shadow-lg">
              <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800">
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Siège KONDU — Lomé, Togo
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Support Direct
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                <a
                  href="https://wa.me/22893919212"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/80 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/40 transition-all text-slate-200"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">WA: <strong className="text-emerald-400">+228 93919212</strong></span>
                </a>
                <a
                  href="tel:+22899255231"
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/80 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 transition-all text-slate-200"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Tél: <strong className="text-amber-400">+228 99255231</strong></span>
                </a>
                <a
                  href="mailto:kondutogo@mail.com"
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/80 hover:bg-blue-500/10 border border-slate-800 hover:border-blue-500/40 transition-all text-slate-200"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">Email: <strong className="text-blue-400">kondutogo@mail.com</strong></span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
