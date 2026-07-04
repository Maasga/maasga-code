# ❄️ Architecture Technique & Guide Fonctionnel : MAASGA

Ce document détaille l'architecture, les technologies et la logique métier de la plateforme web **MAASGA**.

## 1. Stack Technique principal

La plateforme est construite sur une architecture **Server-Side Rendering (SSR)** moderne et ultra-performante, optimisée pour l'écosystème **Cloudflare**.

*   **Framework Backend** : [Hono](https://hono.dev/) - Un framework web ultra-rapide conçu pour les Edge Workers (Cloudflare Workers/Pages).
*   **Runtime** : Cloudflare Pages Functions (V8 Isolation).
*   **Base de Données** : [Cloudflare D1](https://developers.cloudflare.com/d1/) - Base de données relationnelle SQL native à Cloudflare.
*   **Build Tool** : [Vite 6](https://vitejs.dev/) - Utilisé pour le développement local et la transformation des assets.
*   **Langage** : TypeScript (TSX) pour une sécurité typée de bout en bout.
*   **UI / Styling** : 
    *   **Tailwind CSS** : Pour le design utility-first.
    *   **GSAP & Vanilla JS** : Pour les animations (neige, transitions, modales).
    *   **FontAwesome** : Iconographie.

---

## 2. Architecture logicielle

### Routage et Entrée (`src/index.tsx`)
Le fichier `index.tsx` est le cerveau du site. Il gère :
*   Les **Middlewares** (Sécurité CSP, gestion des sessions admin, gestion des erreurs).
*   Le **Routage Public** (Accueil, Catalogue, RDV, Devis).
*   Le **Routage API** (Validation de commande, envoi de mails via Brevo, notifications Telegram).
*   Le **Routage Admin** (Protégé par un secret/session).

### Structure des Composants
Le site utilise le moteur de rendu JSX de Hono. Contrairement à React classique, le rendu est fait sur le serveur et envoyé sous forme de HTML pur au navigateur, ce qui garantit un **SEO parfait** et un chargement instantané.
*   **Layout.tsx** : Enveloppe commune (Header, Footer, Modales globales, Système Agentation).
*   **Pages/** : Chaque fichier `.tsx` dans ce dossier représente une vue complète (Admin, Home, Catalogue, etc.).

---

## 3. Fonctionnalités & Logique Métier

### A. Le Catalogue & Commande
*   **Filtrage Dynamique** : Les produits sont filtrés côté serveur (BTU, Marque, Inverter).
*   **Système de Panier** : Géré en local via `localStorage` pour persister les choix du client sans base de données intermédiaire.
*   **Flux de Commande** : 
    1. Sélection produit.
    2. Formulaire avec capture de position GPS (HTML5 Geolocation).
    3. Choix du mode de paiement (LigdiCash, Wave, etc.).
    4. Notification immédiate à l'administrateur via **Telegram** et **Email**.

### B. Prise de Rendez-vous (RDV)
Logique sophistiquée permettant de choisir un motif (Panne, Installation, Entretien) et de capturer les détails du logement pour préparer la visite technique.

### C. Système de Maintenance
Le site inclut une logique de suivi de maintenance prédictive :
*   Les contrats sont enregistrés en base.
*   Le système calcule les dates de rappel (trimestrielles/semestrielles).
*   L'admin reçoit des alertes quand une maintenance est due.

---

## 4. Back-office (Dashboard Admin)

Le fichier `src/pages/admin.tsx` est une application complète en soi (plus de 5000 lignes) gérant :
*   **Gestion des Stocks** : Mise à jour en temps réel des disponibilités.
*   **Suivi des Commandes** : Un tunnel de vente en 5 étapes (En attente, Payée, Visite terrain, Devis, Installé).
*   **Audit Log** : Chaque action administrative critique est enregistrée en base pour la traçabilité.
*   **Gestion des Avis** : Modération des témoignages clients avant publication.

---

## 5. Intégrations Externes

*   **LigdiCash / Wave** : Passerelles de paiement pour les transactions locales au Burkina.
*   **Brevo (ex-Sendinblue)** : Envoi d'emails transactionnels et de devis PDF.
*   **Telegram Bot API** : Pour les alertes "Push" en temps réel aux techniciens lors d'une nouvelle commande.
*   **Cloudinary** : Hébergement optimisé des photos de produits et réalisations.
*   **Agentation** : Système intelligent d'assistance injecté dynamiquement.

---

## 6. Base de données (D1)

Le schéma SQL (`migrations/`) contient les tables critiques :
*   `products` : Catalogue technique.
*   `orders` & `order_items` : Historique des ventes.
*   `appointments` : Planning des techniciens.
*   `users` / `clients` : Carnet d'adresses.
*   `audit_logs` : Historique de sécurité.

---

## 7. Performance & SEO
*   **Image Optimization** : Utilisation de WebP pour toutes les images.
*   **Zéro JS lourd** : Pas de framework client massif (pas d'hydratation Next/React), uniquement du Vanilla JS pour une interactivité légère.
*   **Cache Edge** : Déployé sur les 300+ centres de données de Cloudflare pour une latence minimale à Ouagadougou.
