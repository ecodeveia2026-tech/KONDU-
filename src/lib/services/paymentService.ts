// ==============================================================================
// KONDU - SERVICE OFFICIEL DE GESTION DES PAIEMENTS & ABONNEMENTS
// Conforme aux règles KONDU : AUCUNE SIMULATION de paiement fictif
// Les paiements doivent être validés côté serveur / webhook
// ==============================================================================

import { supabase } from '../supabase';
import type { SubscriptionPlan } from '../types';

export interface PaymentInitiationResult {
  success: boolean;
  requiresExternalConfig?: boolean;
  message: string;
  paymentUrl?: string;
  transactionReference?: string;
}

class PaymentService {
  /**
   * Vérifie si une passerelle de paiement en ligne (T-Money / Moov Money / FedaPay) est configurée
   */
  public isPaymentGatewayConfigured(): boolean {
    const gatewayKey = import.meta.env.VITE_PAYMENT_PUBLIC_KEY || '';
    return Boolean(gatewayKey && gatewayKey.length > 5);
  }

  /**
   * Initialise une transaction de paiement réelle pour un abonnement chauffeur ou VIP
   */
  public async initiateSubscriptionPayment(
    userId: string,
    plan: SubscriptionPlan,
    phoneNumber?: string,
    operator?: 'TMONEY' | 'MOOV_MONEY' | 'CARD'
  ): Promise<PaymentInitiationResult> {
    const isConfigured = this.isPaymentGatewayConfigured();

    // RÈGLE STRICTE KONDU : Si l'API de paiement n'est pas configurée, NE JAMAIS SIMULER DE FAUX PAIEMENT !
    if (!isConfigured) {
      return {
        success: false,
        requiresExternalConfig: true,
        message:
          'L\'intégration directe Mobile Money (T-Money / Moov Money Togo) nécessite la configuration des clés d\'API marchandes. Veuillez contacter l\'administration KONDU ou régler directement via le support officiel (+228 93919212 / +228 99255231).',
      };
    }

    try {
      const transactionRef = `TX-KONDU-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Enregistrement de la transaction en statut PENDING dans la table payment_transactions
      const { error: txError } = await supabase.from('payment_transactions').insert({
        user_id: userId,
        amount: plan.price_cfa,
        currency: 'XOF',
        provider: operator || 'TMONEY',
        transaction_reference: transactionRef,
        status: 'PENDING',
        payment_method: operator || 'MOBILE_MONEY',
        metadata: {
          plan_id: plan.id,
          plan_name: plan.name,
          phone_number: phoneNumber,
          duration_days: plan.duration_days,
          is_vip: plan.is_vip,
        },
      });

      if (txError) {
        console.error('[PaymentService] Erreur création transaction:', txError.message);
        return {
          success: false,
          message: 'Erreur lors de l\'enregistrement de la transaction.',
        };
      }

      return {
        success: true,
        transactionReference: transactionRef,
        message: 'Transaction initiée. En attente de confirmation par le fournisseur de paiement.',
      };
    } catch (err: any) {
      console.error('[PaymentService] Exception initiateSubscriptionPayment:', err);
      return {
        success: false,
        message: err.message || 'Erreur inattendue lors de l\'initiation du paiement.',
      };
    }
  }

  /**
   * Activation administrative ou manuelle d'un abonnement après confirmation de paiement réel
   */
  public async activateSubscriptionDirectly(
    userId: string,
    plan: SubscriptionPlan,
    adminApprovalReference: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date();
      const expires = new Date();
      expires.setDate(now.getDate() + plan.duration_days);

      // 1. Insertion dans la table subscriptions
      const { error: subErr } = await supabase.from('subscriptions').insert({
        user_id: userId,
        plan_id: plan.id,
        status: 'ACTIVE',
        starts_at: now.toISOString(),
        expires_at: expires.toISOString(),
        amount_paid: plan.price_cfa,
        currency: 'XOF',
        payment_reference: adminApprovalReference,
      });

      if (subErr) {
        return { success: false, error: subErr.message };
      }

      // 2. Mise à jour du statut dans provider_profiles
      const { error: provErr } = await supabase
        .from('provider_profiles')
        .update({
          subscription_status: 'active',
          is_vip: plan.is_vip,
          vip_expires_at: plan.is_vip ? expires.toISOString() : null,
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId);

      if (provErr) {
        return { success: false, error: provErr.message };
      }

      // 3. Notification de l'utilisateur
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Abonnement activé avec succès !',
        message: `Votre forfait ${plan.name} (${plan.price_cfa} F CFA) est actif jusqu'au ${expires.toLocaleDateString()}.`,
        type: 'subscription',
        link: '/dashboard/provider',
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

export const paymentService = new PaymentService();
