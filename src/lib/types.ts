// ==============================================================================
// KONDU - TYPES TYPESCRIPT COMPLETS
// ==============================================================================

export type UserRole = 'CLIENT' | 'PROVIDER' | 'BUSINESS' | 'ADMIN';

export type ServiceType = 'moto' | 'taxi' | 'tricycle' | 'vip' | 'moving' | 'delivery';

export type SubscriptionStatus = 
  | 'pending' | 'active' | 'expired' | 'suspended' | 'cancelled'
  | 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'FAILED';

export type OrderStatus = 'CREATED' | 'SEARCHING' | 'PROVIDER_ACCEPTED' | 'ARRIVING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  whatsapp?: string | null;
  role: UserRole;
  avatar_url?: string | null;
  photo_url?: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProviderProfile {
  id: string;
  user_id: string;
  service_type: ServiceType;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_plate?: string | null;
  vehicle_year?: number | null;
  vehicle_color?: string | null;
  vehicle_photo_url?: string | null;
  identity_card_url?: string | null;
  driving_license_url?: string | null;
  is_online: boolean;
  is_available: boolean;
  current_lat?: number | null;
  current_lng?: number | null;
  location_accuracy?: number | null;
  location_updated_at?: string | null;
  subscription_status: SubscriptionStatus;
  is_vip: boolean;
  vip_expires_at?: string | null;
  rating_avg: number;
  total_ratings: number;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface BusinessProfile {
  id: string;
  user_id: string;
  company_name: string;
  registration_number?: string | null;
  business_type?: string | null;
  address?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  price_cfa: number;
  duration_days: number;
  is_vip: boolean;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  starts_at: string;
  expires_at: string;
  amount_paid: number;
  currency: string;
  payment_reference?: string | null;
  created_at: string;
  plan?: SubscriptionPlan;
}

export interface Order {
  id: string;
  client_id: string;
  provider_id?: string | null;
  service_type: ServiceType;
  status: OrderStatus;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  estimated_distance_km?: number | null;
  estimated_price: number;
  final_price?: number | null;
  currency: string;
  notes?: string | null;
  cancelled_by?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  accepted_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  client?: Profile;
  provider?: ProviderProfile & { full_name?: string; phone?: string; whatsapp?: string; avatar_url?: string };
}

export interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  client_id: string;
  provider_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'order' | 'subscription' | 'payment' | 'system';
  is_read: boolean;
  link?: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  order_id?: string | null;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  commission_rate: { percentage: number };
  gps_freshness_minutes: { minutes: number };
  base_fares: Record<ServiceType, number>;
}

export const OFFICIAL_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_daily_essentiel_500',
    code: 'daily_essentiel_500',
    name: 'Pass 24H Essentiel',
    description: 'Accès Chauffeur Pro actif 24h avec courses illimitées. 0% de commission.',
    price_cfa: 500,
    duration_days: 1,
    is_vip: false,
    features: ['Courses illimitées pendant 24h', '0% commission KONDU', 'Visibilité GPS en direct', 'Support standard Lomé'],
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'plan_daily_confort_1000',
    code: 'daily_confort_1000',
    name: 'Pass 24H Confort',
    description: 'Accès 24H avec visibilité prioritaire et alertes sonores instantanées.',
    price_cfa: 1000,
    duration_days: 1,
    is_vip: false,
    features: ['Courses illimitées 24h', '0% commission', 'Visibilité prioritaire passagers', 'Support réactif prioritaire'],
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'plan_weekly_2500',
    code: 'weekly_2500',
    name: 'Pass Hebdomadaire (7 Jours)',
    description: 'Formule 7 jours ultra-rentable pour chauffeurs actifs et réguliers.',
    price_cfa: 2500,
    duration_days: 7,
    is_vip: false,
    features: ['Accès illimité 7 jours complets', '0% commission sur toutes les courses', 'Badge Chauffeur Actif', 'Économique (~357 F/jour)'],
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'plan_monthly_8000',
    code: 'monthly_8000',
    name: 'Pass Mensuel Pro (30 Jours)',
    description: 'Formule mensuelle pour une sérénité totale des chauffeurs professionnels.',
    price_cfa: 8000,
    duration_days: 30,
    is_vip: false,
    features: ['Validité 30 jours complets', '0% commission KONDU', 'Badge Chauffeur Pro Certifié', 'Assistance prioritaire 7j/7'],
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'plan_vip_15000',
    code: 'vip_15000',
    name: 'KONDU VIP (30 Jours)',
    description: 'Statut prestige n°1 : Priorité absolue de matching et badge KONDU VIP doré.',
    price_cfa: 15000,
    duration_days: 30,
    is_vip: true,
    features: ['Priorité n°1 dans le matching', 'Badge exclusif KONDU VIP Doré', 'Visibilité maximale sur la carte', 'Accès direct aux clients VIP & Entreprises', 'Support dédié WhatsApp 24/7'],
    is_active: true,
    created_at: new Date().toISOString()
  }
];

