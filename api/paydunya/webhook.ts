// ==============================================================================
// ŋdzemɔ — VERCEL SERVERLESS FUNCTION : Webhook PayDunya (IPN)
// Reçoit les notifications de paiement de PayDunya et met à jour Supabase
// ⚠️ NE JAMAIS exposer ce fichier côté client
// ==============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PAYDUNYA_MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY || '';

// Grille tarifaire officielle (source de vérité côté serveur)
const OFFICIAL_PLANS: Record<string, { price_cfa: number; duration_days: number; is_vip: boolean }> = {
  'plan-journalier':   { price_cfa: 200,   duration_days: 1,  is_vip: false },
  'plan-hebdomadaire': { price_cfa: 1000,  duration_days: 7,  is_vip: false },
  'plan-mensuel':      { price_cfa: 3000,  duration_days: 30, is_vip: false },
  'plan-trimestriel':  { price_cfa: 7500,  duration_days: 90, is_vip: false },
  'plan-vip':          { price_cfa: 15000, duration_days: 30, is_vip: true  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // PayDunya envoie des requêtes POST pour les notifications IPN
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  // Vérifier la configuration serveur
  if (!SUPABASE_SERVICE_KEY || !PAYDUNYA_MASTER_KEY) {
    console.error('[Webhook] Configuration serveur incomplète.');
    return res.status(503).json({ error: 'Configuration serveur incomplète.' });
  }

  try {
    const payload = req.body || {};

    console.log('[Webhook PayDunya] Notification reçue — event_type:', payload.data?.bill?.status);

    // 1. Vérifier la signature PayDunya (hash du master_key dans le payload)
    const receivedHash = payload.data?.hash;
    if (!receivedHash) {
      console.warn('[Webhook] Hash absent dans le payload PayDunya.');
      return res.status(400).json({ error: 'Signature manquante.' });
    }

    // PayDunya envoie le SHA512 du master_key dans le champ hash
    const crypto = await import('crypto');
    const expectedHash = crypto.createHash('sha512').update(PAYDUNYA_MASTER_KEY).digest('hex');

    if (receivedHash !== expectedHash) {
      console.warn('[Webhook] Signature invalide — requête rejetée.');
      return res.status(403).json({ error: 'Signature invalide.' });
    }

    // 2. Extraire les données du paiement
    const invoiceData = payload.data?.bill || {};
    const customData = payload.custom_data || {};

    const transactionRef = customData.transaction_ref;
    const userId = customData.user_id;
    const planId = customData.plan_id;
    const receivedAmount = parseFloat(invoiceData.total_amount || '0');
    const paymentStatus = invoiceData.status; // 'completed', 'cancelled', 'failed'
    const externalEventId = payload.data?.invoice?.token || invoiceData.invoice_token || String(Date.now());

    if (!transactionRef || !userId) {
      console.warn('[Webhook] Données custom_data manquantes (transaction_ref, user_id).');
      return res.status(400).json({ error: 'Données de transaction manquantes.' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 3. Idempotence — vérifier si cet événement a déjà été traité
    const { data: existingEvent } = await supabase
      .from('payment_events')
      .select('id, processed')
      .eq('external_event_id', externalEventId)
      .maybeSingle();

    if (existingEvent?.processed) {
      console.log('[Webhook] Événement déjà traité:', externalEventId);
      return res.status(200).json({ message: 'Événement déjà traité.' });
    }

    // 4. Récupérer la transaction existante
    const { data: transaction, error: txFetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_reference', transactionRef)
      .maybeSingle();

    if (txFetchError || !transaction) {
      console.error('[Webhook] Transaction introuvable:', transactionRef);
      return res.status(404).json({ error: 'Transaction introuvable.' });
    }

    // 5. Vérifier le montant côté serveur (ne jamais faire confiance au frontend)
    const plan = OFFICIAL_PLANS[planId];
    if (plan && paymentStatus === 'completed') {
      const tolerance = 1; // 1 F CFA de tolérance pour les arrondis
      if (Math.abs(receivedAmount - plan.price_cfa) > tolerance) {
        console.error(`[Webhook] Montant incohérent: reçu=${receivedAmount}, attendu=${plan.price_cfa}`);
        // Enregistrer mais ne pas activer
        await supabase.from('payment_events').insert({
          transaction_id: transaction.id,
          provider: 'PAYDUNYA',
          event_type: 'amount_mismatch',
          external_event_id: externalEventId + '_mismatch',
          payload: { received: receivedAmount, expected: plan.price_cfa },
          signature_verified: true,
          processed: false,
        });
        return res.status(400).json({ error: 'Montant incohérent.' });
      }
    }

    // 6. Enregistrer l'événement webhook (idempotence garantie par UNIQUE sur external_event_id)
    const { data: eventRecord } = await supabase.from('payment_events').insert({
      transaction_id: transaction.id,
      provider: 'PAYDUNYA',
      event_type: paymentStatus === 'completed' ? 'payment_completed' : `payment_${paymentStatus}`,
      external_event_id: externalEventId,
      payload: payload,
      signature_verified: true,
      processed: false,
    }).select().single();

    // 7. Mettre à jour le statut de la transaction
    const now = new Date().toISOString();
    let newStatus: string;

    if (paymentStatus === 'completed') {
      newStatus = 'COMPLETED';
      await supabase.from('payment_transactions').update({
        status: 'COMPLETED',
        completed_at: now,
        updated_at: now,
      }).eq('transaction_reference', transactionRef);

    } else if (paymentStatus === 'cancelled') {
      newStatus = 'REFUNDED';
      await supabase.from('payment_transactions').update({
        status: 'REFUNDED',
        failed_at: now,
        updated_at: now,
      }).eq('transaction_reference', transactionRef);

    } else {
      newStatus = 'FAILED';
      await supabase.from('payment_transactions').update({
        status: 'FAILED',
        failed_at: now,
        updated_at: now,
      }).eq('transaction_reference', transactionRef);
    }

    // 8. Activer l'abonnement UNIQUEMENT si paiement confirmé
    if (paymentStatus === 'completed' && plan) {
      console.log(`[Webhook] Activation abonnement ${planId} pour utilisateur ${userId}`);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

      // Créer l'entrée d'abonnement
      const { error: subError } = await supabase.from('subscriptions').insert({
        user_id: userId,
        plan_id: planId,
        status: 'ACTIVE',
        starts_at: now,
        expires_at: expiresAt.toISOString(),
        amount_paid: plan.price_cfa,
        currency: 'XOF',
        payment_reference: transactionRef,
      });

      if (subError) {
        console.error('[Webhook] Erreur création abonnement:', subError.message);
      } else {
        // Mettre à jour provider_profiles
        const { error: provError } = await supabase
          .from('provider_profiles')
          .update({
            subscription_status: 'ACTIVE',
            is_vip: plan.is_vip,
            vip_expires_at: plan.is_vip ? expiresAt.toISOString() : null,
            updated_at: now,
          })
          .eq('user_id', userId);

        if (provError) {
          // Fallback minuscules
          await supabase.from('provider_profiles').update({
            subscription_status: 'active',
            is_vip: plan.is_vip,
            vip_expires_at: plan.is_vip ? expiresAt.toISOString() : null,
            updated_at: now,
          }).eq('user_id', userId);
        }

        // Notification utilisateur
        await supabase.from('notifications').insert({
          user_id: userId,
          title: '✅ Paiement confirmé — Abonnement activé !',
          message: `Votre forfait ŋdzemɔ est actif jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}.`,
          type: 'subscription',
          link: '/dashboard/provider',
        });

        console.log(`[Webhook] Abonnement activé avec succès pour ${userId}`);
      }
    }

    // 9. Marquer l'événement comme traité
    if (eventRecord?.id) {
      await supabase.from('payment_events').update({
        processed: true,
        processed_at: now,
      }).eq('id', eventRecord.id);
    }

    console.log(`[Webhook] Traitement terminé — Transaction ${transactionRef} → ${newStatus}`);
    return res.status(200).json({ message: 'Notification traitée avec succès.' });

  } catch (err: any) {
    console.error('[Webhook PayDunya] Exception:', err.message);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}
