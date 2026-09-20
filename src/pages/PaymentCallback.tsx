// ==============================================================================
// ŋdzemɔ — PAGE DE RETOUR PAIEMENT PAYDUNYA
// Affichée après redirection depuis PayDunya (succès, échec ou annulation)
// Vérifie le statut réel de la transaction côté serveur
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowRight, RefreshCw, Home } from 'lucide-react';
import { paymentService } from '../lib/services/paymentService';
import type { TransactionStatus } from '../lib/services/paymentService';

export const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'cancelled' | 'pending'>('loading');
  const [transaction, setTransaction] = useState<TransactionStatus | null>(null);
  const [checkCount, setCheckCount] = useState(0);

  const urlStatus = searchParams.get('status');
  const ref = searchParams.get('ref');

  useEffect(() => {
    if (!ref || ref === 'PENDING') {
      // Pas de référence valide — statut basé sur l'URL
      if (urlStatus === 'cancelled') setStatus('cancelled');
      else setStatus('failed');
      return;
    }

    // Vérifier le statut réel via le backend (pas seulement l'URL de retour)
    verifyTransactionStatus();
  }, [ref, urlStatus]);

  // Polling jusqu'à 3 fois si PENDING (le webhook peut arriver après la redirection)
  useEffect(() => {
    if (status === 'pending' && checkCount < 3) {
      const timer = setTimeout(() => {
        verifyTransactionStatus();
        setCheckCount(c => c + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, checkCount]);

  const verifyTransactionStatus = async () => {
    if (!ref || ref === 'PENDING') return;

    try {
      const tx = await paymentService.checkTransactionStatus(ref);
      if (!tx) {
        setStatus(urlStatus === 'cancelled' ? 'cancelled' : 'failed');
        return;
      }

      setTransaction(tx);

      switch (tx.status) {
        case 'COMPLETED':
          setStatus('success');
          break;
        case 'FAILED':
          setStatus('failed');
          break;
        case 'REFUNDED':
          setStatus('cancelled');
          break;
        case 'PENDING':
          // Peut arriver si le webhook n'est pas encore arrivé
          setStatus('pending');
          break;
        default:
          setStatus('failed');
      }
    } catch {
      setStatus(urlStatus === 'cancelled' ? 'cancelled' : 'failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-6">

        {/* Logo ŋdzemɔ */}
        <div className="flex justify-center">
          <img src="/logo-ndzemo.png" alt="ŋdzemɔ" className="h-12 w-auto" />
        </div>

        {/* État : Chargement */}
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Vérification du paiement...</h1>
            <p className="text-sm text-slate-500">Nous vérifions votre transaction auprès de PayDunya.</p>
          </div>
        )}

        {/* État : En attente (webhook pas encore reçu) */}
        {status === 'pending' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Paiement en cours de confirmation</h1>
            <p className="text-sm text-slate-500">
              Votre paiement est en cours de traitement. La confirmation peut prendre quelques instants.
            </p>
            <div className="text-xs text-slate-400">
              Vérification automatique... ({checkCount}/3)
            </div>
          </div>
        )}

        {/* État : Succès */}
        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Paiement confirmé !</h1>
            {transaction && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left space-y-1">
                <p className="text-sm font-semibold text-emerald-800">{transaction.planName}</p>
                <p className="text-xs text-emerald-600">
                  {Number(transaction.amount).toLocaleString()} {transaction.currency}
                </p>
                <p className="text-xs text-slate-500 font-mono break-all">Réf : {transaction.reference}</p>
              </div>
            )}
            <p className="text-sm text-slate-600">
              Votre abonnement ŋdzemɔ est maintenant actif. Vous pouvez commencer à recevoir des courses !
            </p>
            <Link
              to="/dashboard/provider"
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition"
            >
              Accéder à mon dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* État : Échec */}
        {status === 'failed' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Paiement échoué</h1>
            <p className="text-sm text-slate-500">
              Votre paiement n'a pas pu être confirmé. Aucun montant n'a été débité.
            </p>
            {ref && ref !== 'PENDING' && (
              <p className="text-xs text-slate-400 font-mono break-all">Réf : {ref}</p>
            )}
            <Link
              to="/dashboard/provider"
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-slate-900 hover:bg-slate-700 text-white font-bold rounded-2xl transition"
            >
              Réessayer <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* État : Annulé */}
        {status === 'cancelled' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Paiement annulé</h1>
            <p className="text-sm text-slate-500">
              Vous avez annulé le paiement. Aucun montant n'a été débité.
            </p>
            <Link
              to="/dashboard/provider"
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-slate-900 hover:bg-slate-700 text-white font-bold rounded-2xl transition"
            >
              Retour au dashboard <Home className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Lien retour accueil */}
        <Link to="/" className="block text-xs text-slate-400 hover:text-slate-600 transition">
          ← Retour à l'accueil ŋdzemɔ
        </Link>
      </div>
    </div>
  );
};

export default PaymentCallback;
