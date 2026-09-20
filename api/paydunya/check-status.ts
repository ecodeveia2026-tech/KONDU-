// ==============================================================================
// ŋdzemɔ — VERCEL SERVERLESS FUNCTION : Vérification du statut d'une transaction
// Interroge Supabase (pas PayDunya directement) pour retourner le statut
// ==============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée.' });

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(503).json({ error: 'Configuration serveur incomplète.' });
  }

  try {
    const { ref, authToken } = req.query as { ref?: string; authToken?: string };

    if (!ref || !authToken) {
      return res.status(400).json({ error: 'Référence de transaction et token requis.' });
    }

    // Vérifier l'utilisateur authentifié
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(String(authToken));

    if (authError || !user) {
      return res.status(401).json({ error: 'Utilisateur non authentifié.' });
    }

    // Récupérer la transaction (appartenant à cet utilisateur uniquement)
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .select('id, transaction_reference, status, amount, currency, metadata, created_at, completed_at, failed_at')
      .eq('transaction_reference', String(ref))
      .eq('user_id', user.id) // Sécurité : l'utilisateur ne peut voir que ses propres transactions
      .maybeSingle();

    if (txError || !transaction) {
      return res.status(404).json({ error: 'Transaction introuvable.' });
    }

    // Retourner uniquement les informations nécessaires (jamais les clés ou infos sensibles)
    return res.status(200).json({
      reference: transaction.transaction_reference,
      status: transaction.status,           // PENDING, COMPLETED, FAILED, REFUNDED
      amount: transaction.amount,
      currency: transaction.currency,
      planName: transaction.metadata?.plan_name,
      planId: transaction.metadata?.plan_id,
      isVip: transaction.metadata?.is_vip,
      createdAt: transaction.created_at,
      completedAt: transaction.completed_at,
      failedAt: transaction.failed_at,
    });

  } catch (err: any) {
    console.error('[check-status] Exception:', err.message);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}
