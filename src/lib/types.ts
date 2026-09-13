// ==============================================================================
// KONDU - TYPES TYPESCRIPT COMPLETS
// ==============================================================================

export type UserRole = 'CLIENT' | 'PROVIDER' | 'BUSINESS' | 'ADMIN';

export type ServiceType = 'moto' | 'taxi' | 'tricycle' | 'vip' | 'moving' | 'delivery';

export type SubscriptionStatus = 
  | 'pending' | 'active' | 'expired' | 'suspended' | 'cancelled'
  | 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'FAILED';

export type OrderStatus = 'created' | 'searching' | 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';

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
