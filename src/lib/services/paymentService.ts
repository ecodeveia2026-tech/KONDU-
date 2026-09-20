// ==============================================================================
// ŋdzemɔ - SERVICE OFFICIEL DE GESTION DES PAIEMENTS & ABONNEMENTS
// Architecture sécurisée : frontend → backend Vercel → PayDunya
// Les clés secrètes PayDunya restent EXCLUSIVEMENT côté serveur
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

export interface TransactionStatus {
  reference: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  amount: number;
  currency: string;
  planName?: string;
  planId?: string;
  isVip?: boolean;
  completedAt?: string;
  failedAt?: string;
}

class PaymentService {
  /**
   * Vérifie si le backend PayDunya est accessible (Vercel Serverless)
   * Ne vérifie PAS les clés côté client — elles sont exclusivement serveur
   */
  public isPaymentGatewayConfigured(): boolean {
    // La configuration est toujours considérée comme possible via le backend
    // On laisse le serveur signaler si les clés sont absentes
    return true;
  }

  /**
   * Initialise une transaction de paiement via le backend sécurisé Vercel
   * Le frontend n'a JAMAIS accès aux clés PayDunya
   */
  public async initiateSubscriptionPayment(
    _userId: string,
    plan: SubscriptionPlan,
    _phoneNumber?: string,
    _operator?: string
  ): Promise<PaymentInitiationResult> {
    try {
      // Récupérer le JWT de l'utilisateur connecté
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return {
          success: false,
          message: 'Session expirée. Veuillez vous reconnecter.',
        };
      }

      const siteBaseUrl = window.location.origin;
      const returnUrl = `${siteBaseUrl}/payment/callback?status=success&ref=PENDING`;
      const cancelUrl = `${siteBaseUrl}/payment/callback?status=cancelled&ref=PENDING`;

      // Appel au backend sécurisé (Vercel Serverless Function)
      const response = await fetch('/api/paydunya/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          authToken: session.access_token,
          returnUrl,
          cancelUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Si le backend indique que PayDunya n'est pas configuré
        if (response.status === 503) {
          return {
            success: false,
            requiresExternalConfig: true,
            message: data.error || 'Le service de paiement nécessite une configuration. Contactez l\'administration ŋdzemɔ.',
          };
        }
        return {
          success: false,
          message: data.error || 'Erreur lors de la création du paiement.',
        };
      }

      return {
        success: true,
        paymentUrl: data.paymentUrl,
        transactionReference: data.transactionReference,
        message: 'Paiement initié. Redirection vers PayDunya en cours...',
      };

    } catch (err: any) {
      console.error('[PaymentService] Exception initiateSubscriptionPayment:', err.message);
      return {
        success: false,
        message: 'Service de paiement temporairement indisponible.',
      };
    }
  }

  /**
   * Vérifie le statut d'une transaction via le backend sécurisé
   */
  public async checkTransactionStatus(transactionRef: string): Promise<TransactionStatus | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return null;

      const response = await fetch(
        `/api/paydunya/check-status?ref=${encodeURIComponent(transactionRef)}&authToken=${encodeURIComponent(session.access_token)}`
      );

      if (!response.ok) return null;
      return await response.json() as TransactionStatus;

    } catch (err: any) {
      console.error('[PaymentService] checkTransactionStatus:', err.message);
      return null;
    }
  }

  /**
   * Activation administrative ou manuelle d'un abonnement après confirmation de paiement réel
   * Utilisé uniquement par les admins ou après vérification côté serveur
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
      let { error: provErr } = await supabase
        .from('provider_profiles')
        .update({
          subscription_status: 'ACTIVE',
          is_vip: plan.is_vip,
          vip_expires_at: plan.is_vip ? expires.toISOString() : null,
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId);

      // Fallback si la colonne attend des minuscules
      if (provErr && provErr.message.includes('subscription_status')) {
        const retry = await supabase
          .from('provider_profiles')
          .update({
            subscription_status: 'active' as any,
            is_vip: plan.is_vip,
            vip_expires_at: plan.is_vip ? expires.toISOString() : null,
            updated_at: now.toISOString(),
          })
          .eq('user_id', userId);
        provErr = retry.error;
      }

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
