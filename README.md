# KONDU — Plateforme de Mobilité, Mise en Relation et Services

> **Application web moderne de mobilité urbaine, transport de passagers et logistique professionnelle.**  
> *Modèle économique équitable : **0% de commission sur les courses** pour les chauffeurs et forfaits d'adhésion transparents dès 200 F CFA.*

---

## 🚀 1. Architecture Officielle

- **Frontend** : React 19, TypeScript, TailwindCSS v4, Lucide Icons, Leaflet (Cartographie OpenStreetMap réelle sans dépendance bloquante).
- **Backend & Authentification** : Supabase Auth, PostgreSQL, Row Level Security (RLS), Supabase Realtime & Storage.
- **Hébergement & Déploiement** : Vercel (Production CI/CD).
- **Gestion de Code** : Git & GitHub.

---

## 🛵 2. Rôles et Espaces Dédiés

1. **Passager (`CLIENT`)** :
   - Recherche et commande de trajets (Moto-Taxi, Taxi Urbain, Tricycle, Berline VIP, Camionnette Déménagement).
   - Géolocalisation GPS réelle et carte interactive.
   - Fiche chauffeur avec appel direct et WhatsApp.
   - Historique des courses et notation après trajet.

2. **Chauffeur / Prestataire (`PROVIDER` - KONDU PRO)** :
   - Bascule EN LIGNE / HORS LIGNE avec partage de position GPS en direct.
   - Forfaits d'abonnement :
     - Pass 24H Essentiel : **200 F CFA / jour**
     - Pass 24H Confort : **300 F CFA / jour**
     - Pass 7 Jours : **1 500 F CFA / semaine**
     - Pass Mensuel : **5 000 F CFA / mois**
     - KONDU VIP : **5 000 F CFA / mois** (Matching prioritaire n°1, badge doré et visibilité maximale sur la carte).
   - Réception et acceptation atomique des commandes (protection contre la concurrence simultanée).

3. **Entreprise (`BUSINESS` - KONDU BUSINESS)** :
   - Déménagements d'entreprises, transferts de bureaux et livraisons de marchandises régulières.
   - Facturation centralisée et gestion multi-courses.

4. **Super Administrateur (`ADMIN`)** :
   - Supervision globale des utilisateurs et validation des documents chauffeurs.
   - Configuration dynamique des prix et forfaits.
   - Modération et journal d'audit d'administration.

---

## 🛠️ 3. Installation et Lancement Local

### Prérequis
- **Node.js** v20+ ou v22+
- **NPM**

### Démarrage
```bash
# 1. Cloner le projet
git clone <url-du-depot>
cd KONDU

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 4. Lancer le serveur de développement
npm run dev
```

---

## 🗄️ 4. Configuration de la Base de Données Supabase

1. Connectez-vous à votre console [Supabase](https://supabase.com).
2. Rendez-vous dans le **SQL Editor**.
3. Copiez et exécutez le script SQL situé dans : [`src/sql/supabase_schema.sql`](./src/sql/supabase_schema.sql).
4. Le script configure automatiquement :
   - Toutes les tables et index de haute performance.
   - Le déclencheur `handle_new_user()` créant automatiquement les profils après inscription.
   - La fonction atomique `accept_order_atomically()` évitant les conflits d'acceptation de course.
   - Les politiques de sécurité hermétiques **Row Level Security (RLS)**.

---

## 🔐 5. Sécurité & Bonnes Pratiques

- **Aucune fausse donnée** : Les coordonnées GPS proviennent de l'API standard Geolocation du navigateur.
- **Variables sensibles** : Aucune clé `service_role` ou privée n'est exposée au frontend.
- **Règles de rôle strictes** : Les redirections et gardes d'authentification (`AuthGuard`) empêchent l'accès aux tableaux de bord non autorisés.
