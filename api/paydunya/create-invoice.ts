// ==============================================================================
// ŋdzemɔ — VERCEL SERVERLESS FUNCTION : Création d'une facture PayDunya
// Les clés secrètes sont dans les variables d'environnement Vercel (JAMAIS côté client)
// ==============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// --- Configuration serveur (variables d'environnement Vercel) ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PAYDUNYA_MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY || '';
const PAYDUNYA_PRIVATE_KEY = process.env.PAYDUNYA_PRIVATE_KEY || '';
const PAYDUNYA_TOKEN = process.env.PAYDUNYA_TOKEN || '';
const PAYDUNYA_MODE = process.env.PAYDUNYA_MODE || 'test';

// Endpoint PayDunya
const PAYDUNYA_BASE_URL = PAYDUNYA_MODE === 'live'
  ? 'https://app.paydunya.com/api/v1'
  : 'https://app.paydunya.com/sandbox-api/v1';

// Grille tarifaire officielle ŋdzemɔ (côté serveur — source de vérité pour les prix)
const OFFICIAL_PLANS: Record<string, { name: string; price_cfa: number; duration_days: number; is_vip: boolean }> = {
  'plan-journalier': { name: 'Forfait Journalier (24h)', price_cfa: 200, duration_days: 1, is_vip: false },
  'plan-hebdomadaire': { name: 'Forfait Hebdomadaire (7 Jours)', price_cfa: 1000, duration_days: 7, is_vip: false },
  'plan-mensuel': { name: 'Forfait Mensuel (30 Jours)', price_cfa: 3000, duration_days: 30, is_vip: false },
  'plan-trimestriel': { name: 'Forfait Trimestriel (90 Jours)', price_cfa: 7500, duration_days: 90, is_vip: false },
  'plan-vip': { name: 'ŋdzemɔ VIP (30 Jours)', price_cfa: 15000, duration_days: 30, is_vip: true },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });

  // Vérifier que les clés serveur sont configurées
  if (!PAYDUNYA_MASTER_KEY || !PAYDUNYA_PRIVATE_KEY || !PAYDUNYA_TOKEN) {
    console.error('[PayDunya] Clés API non configurées dans les variables Vercel.');
    return res.status(503).json({
      error: 'Le service de paiement n\'est pas encore configuré. Veuillez contacter l\'administration ŋdzemɔ.',
    });
  }

  if (!SUPABASE_SERVICE_KEY) {
    console.error('[PayDunya] SUPABASE_SERVICE_ROLE_KEY non configurée.');
    return res.status(503).json({ error: 'Configuration serveur incomplète.' });
  }

  try {
    // 1. Extraire et valider les données de la requête
    const { planId, returnUrl, cancelUrl, authToken } = req.body || {};

    if (!planId || !authToken) {
      return res.status(400).json({ error: 'Données manquantes (planId, authToken requis).' });
    }

    // 2. Vérifier l'utilisateur authentifié via le JWT Supabase
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(authToken);

    if (authError || !user) {
      return res.status(401).json({ error: 'Utilisateur non authentifié.' });
    }

    // 3. Récupérer le prix RÉEL depuis la config serveur (ne pas faire confiance au frontend)
    const plan = OFFICIAL_PLANS[planId];
    if (!plan) {
      return res.status(400).json({ error: `Plan « ${planId} » introuvable dans la grille tarifaire.` });
    }

    // 4. Générer une référence de transaction unique
    const transactionRef = `TX-NDZEMO-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 5. Enregistrer la transaction en statut PENDING dans Supabase
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { error: txError } = await supabaseAdmin.from('payment_transactions').insert({
      user_id: user.id,
      provider: 'PAYDUNYA',
      transaction_reference: transactionRef,
      amount: plan.price_cfa,
      currency: 'XOF',
      status: 'PENDING',
      payment_method: 'PAYDUNYA',
      metadata: {
        plan_id: planId,
        plan_name: plan.name,
        duration_days: plan.duration_days,
        is_vip: plan.is_vip,
      },
    });

    if (txError) {
      console.error('[PayDunya] Erreur enregistrement transaction:', txError.message);
      return res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la transaction.' });
    }

    // 6. Construire la requête PayDunya
    const siteBaseUrl = returnUrl
      ? new URL(returnUrl).origin
      : req.headers.origin || req.headers.referer || 'https://kondu.vercel.app';

    const invoicePayload = {
      invoice: {
        total_amount: plan.price_cfa,
        description: `Abonnement ${plan.name} — ŋdzemɔ Togo`,
        items: {
          item_0: {
            name: plan.name,
            quantity: 1,
            unit_price: String(plan.price_cfa),
            total_price: String(plan.price_cfa),
            description: `Forfait chauffeur ŋdzemɔ — ${plan.duration_days} jour(s)`,
          },
        },
      },
      store: {
        name: 'ŋdzemɔ Togo',
        tagline: 'Votre super app de transport',
        phone: '+228 93919212',
        website_url: String(siteBaseUrl),
      },
      actions: {
        cancel_url: cancelUrl || `${siteBaseUrl}/payment/callback?status=cancelled&ref=${transactionRef}`,
        return_url: returnUrl || `${siteBaseUrl}/payment/callback?status=success&ref=${transactionRef}`,
        callback_url: `${siteBaseUrl}/api/paydunya/webhook`,
      },
      custom_data: {
        transaction_ref: transactionRef,
        user_id: user.id,
        plan_id: planId,
      },
    };

    // 7. Appeler l'API PayDunya (côté serveur uniquement)
    console.log(`[PayDunya] Création facture pour ${plan.name} — ${plan.price_cfa} F CFA — Réf: ${transactionRef}`);

    const pdResponse = await fetch(`${PAYDUNYA_BASE_URL}/checkout-invoice/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': PAYDUNYA_MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PAYDUNYA_PRIVATE_KEY,
        'PAYDUNYA-TOKEN': PAYDUNYA_TOKEN,
      },
      body: JSON.stringify(invoicePayload),
    });

    const pdData = await pdResponse.json();

    if (pdData.response_code !== '00' || !pdData.response_text) {
      console.error('[PayDunya] Réponse API erreur:', pdData.response_code, pdData.response_text);

      // Mettre à jour la transaction en FAILED
      await supabaseAdmin.from('payment_transactions')
        .update({ status: 'FAILED', failed_at: new Date().toISOString() })
        .eq('transaction_reference', transactionRef);

      return res.status(400).json({
        error: pdData.response_text || 'Erreur lors de la création de la facture PayDunya.',
      });
    }

    // 8. Retourner l'URL de paiement au frontend (JAMAIS les clés secrètes)
    console.log(`[PayDunya] Facture créée — Token: ${pdData.token} — Statut: OK`);

    return res.status(200).json({
      success: true,
      paymentUrl: pdData.response_text, // URL de redirection PayDunya
      transactionReference: transactionRef,
      invoiceToken: pdData.token,
      amount: plan.price_cfa,
      planName: plan.name,
    });
  } catch (err: any) {
    console.error('[PayDunya] Exception create-invoice:', err.message);
    return res.status(500).json({ error: 'Erreur serveur inattendue.' });
  }
}
