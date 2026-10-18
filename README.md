# MAASGA — Back-office & Catalogue

> Site en production : **https://maasga-website.pages.dev**
> Admin : **https://maasga-website.pages.dev/admin**

---

## Démarrage rapide

```bash
npm install
npm run dev        # serveur local sur http://localhost:5173
npm run build      # build de production → dist/
npm run deploy     # build + déploiement Cloudflare Pages
```

## Base de données D1

```bash
# Appliquer toutes les migrations (production)
npx wrangler d1 migrations apply maasga_db --remote

# Appliquer en local (dev)
npx wrangler d1 migrations apply maasga_db --local
```

## Régénérer les types Cloudflare

```bash
npm run cf-typegen
```

---

## Fonctionnalités principales

### Catalogue produits
- Ajout / édition / suppression unitaire depuis `/admin/produits`
- **Import en masse** via fichier Excel (`.xlsx`, `.xls`, `.csv`) — colonnes reconnues automatiquement, aucun format imposé. Voir [IMPORT_EXCEL.md](docs/IMPORT_EXCEL.md)
- **Médiathèque centralisée par marque** — upload une fois, affectation à n'importe quel produit. Voir ci-dessous.

### Médiathèque par marque

Permet d'uploader des visuels une seule fois (logos, photos produit par fabricant) puis de les affecter à n'importe quel produit sans ressaisir le fichier.

**Accès :** `Admin → Produits & Stock → panneau "Médiathèque par marque"` (collapsible en haut de la page).

1. **Uploader** — Saisir la marque (LG, Samsung…), un libellé optionnel, puis choisir un ou plusieurs fichiers JPG/PNG/WebP (max 5 Mo chacun). Les images sont hébergées sur ImgBB.
2. **Filtrer** — Cliquer sur une marque pour n'afficher que ses images.
3. **Affecter** — Survoler une miniature → bouton **Affecter** → choisir le produit cible et le type d'utilisation (image principale ou galerie) → confirmer.
4. **Supprimer** — Survoler une miniature → bouton **Supprimer** → l'image est retirée d'ImgBB et de la médiathèque.

### Galerie multi-images par produit
Depuis la liste des produits, colonne **Image** → bouton **Galerie** pour ajouter/supprimer des photos supplémentaires sur un produit existant. Les images sont uploadées vers ImgBB à la volée.

---

## Architecture technique

L'application a été entièrement refactorisée selon une architecture modulaire et découplée :

```
src/
├── repositories/          # Accès aux données Cloudflare D1 (requêtes SQL isolées)
│   ├── product.repository.ts
│   ├── order.repository.ts
│   ├── appointment.repository.ts
│   ├── client.repository.ts
│   ├── maintenance.repository.ts
│   ├── sav.repository.ts
│   └── banner.repository.ts
├── services/              # Logique métier pure (indépendante du framework HTTP)
│   ├── pricing.service.ts # Calcul des devis et forfaits maintenance climatisation
│   ├── storage.service.ts # Upload ImgBB et validation magic bytes
│   ├── auth.service.ts    # Sessions admin, hachage PBKDF2 et jetons
│   └── session.service.ts # Cookies et sessions espace client
├── routes/                # Sous-routeurs Hono modulaires
│   ├── web/               # Pages publiques SSR & formulaires (accueil, catalogue, contact)
│   ├── client/            # Espace client authentifié (commandes, devis, SAV, factures)
│   ├── admin/             # Back-office web & endpoints API admin internes
│   ├── api-mobile/        # Contrats REST versionnés pour les applications Flutter
│   │   ├── client.routes.ts # /api/mobile/v1/* (catalogue, RDV, devis, push-tokens)
│   │   └── admin.routes.ts  # /api/mobile/admin/* (CRUD admin, KPIs, modération)
│   ├── cron/              # Tâches planifiées (rappels de visites de maintenance)
│   └── telegram/          # Webhook & commandes du bot Telegram interne
├── components/admin/      # Interface d'administration découpée
│   ├── AdminLayout.tsx    # Shell HTML, navigation sidebar et sécurité
│   └── tabs/              # 14 onglets indépendants (Dashboard, Produits, RDV, Clients, etc.)
└── __tests__/             # Tests unitaires automatisés Vitest
    ├── pricing.service.test.ts
    ├── security.test.ts
    └── helpers.test.ts
```

| Couche | Technologie | Rôle |
|---|---|---|
| **Runtime** | Cloudflare Pages + Workers (Edge) | Exécution ultra-rapide sans serveur |
| **Framework Web** | Hono v4 (JSX SSR) | Routage léger, typé et modulaire |
| **Base de données** | Cloudflare D1 (SQLite distribué) | Persistance transactionnelle |
| **Stockage Fichiers** | Cloudflare R2 & ImgBB API | Bannières, visuels produits et pièces jointes |
| **Styles** | Tailwind CSS v3 | Design system et mise en page responsive |
| **Tests** | Vitest v5 | Tests unitaires & validation de sécurité |
| **CI/CD** | GitHub Actions | Build Tailwind+Vite, Vitest, et déploiement Cloudflare Pages |

---

## Tests automatisés & Qualité

La suite de tests unitaires valide la logique métier, la sécurité et le calcul tarifaire :

```bash
# Lancer les tests unitaires
npm test

# Lancer Vitest en mode interactif / watch
npx vitest
```

Les tests couvrent notamment :
- **Moteur de tarification (`pricing.service.ts`)** : Formule résidentielle par paliers d'unités de clim, forfaits Confort (2 visites) et Pro (3 visites), devis sur-mesure.
- **Sécurité & Authentification (`security.test.ts`)** : Vérification des signatures d'images (magic bytes anti-spoofing JPEG/PNG/WebP), échappement XSS HTML, validation des mots de passe admin.
- **Utilitaires (`helpers.test.ts`)** : Formatage monétaire en FCFA, normalisation des numéros de téléphone et détection de collision de planning.

---

## Pipeline CI/CD

Un workflow GitHub Actions automatisé est configuré dans `.github/workflows/deploy.yml` :
1. **Compilation** : `npm run build:css` (Tailwind) + `vite build` (bundle SSR `dist/_worker.js`).
2. **Tests** : Exécution de `vitest run`. En cas d'échec d'un test, le déploiement est immédiatement bloqué.
3. **Déploiement Cloudflare** : Publication automatique vers Cloudflare Pages via `cloudflare/wrangler-action`.

---

## Modèle de Paiement & Transactions

Les commandes et contrats de maintenance enregistrent l'intention d'achat en base de données D1 :
- **Modèle actuel** : Règlement hors application (à la livraison / sur facture / virement d'acompte) avec suivi du statut dans l'espace client et l'admin mobile/web (`pending`, `completed`, `cancelled`).
- **Évolution paiement en ligne** : Les repositories (`order.repository.ts`, `appointment.repository.ts`) et les tables D1 intègrent déjà les champs de référence transactionnelle pour brancher un agrégateur tel que CinetPay, FedaPay ou Orange Money via une route webhook dédiée avec idempotence.

---

## Variables d'environnement (secrets Cloudflare)

| Variable | Usage | Requis |
|---|---|---|
| `ADMIN_SECRET` | Secret de réinitialisation mot de passe admin | ✅ |
| `ADMIN_INITIAL_PASSWORD` | Mot de passe admin initial | ✅ |
| `IMGBB_API_KEY` | Upload images produit et médiathèque | ✅ |
| `TELEGRAM_BOT_TOKEN` | Notifications Telegram | Optionnel |
| `TELEGRAM_CHAT_ID` | Chat ID pour les notifs | Optionnel |
| `GOOGLE_CLIENT_ID` | Connexion Google OAuth | Optionnel |
| `GOOGLE_CLIENT_SECRET` | Connexion Google OAuth | Optionnel |
| `BREVO_API_KEY` | Envoi d'emails transactionnels | Optionnel |

Configurer un secret :
```bash
echo "VALEUR" | npx wrangler pages secret put NOM_VARIABLE --project-name maasga-website
```

---

## Migrations D1

Les migrations sont dans `migrations/`. Elles s'appliquent dans l'ordre numérique.

```bash
# Voir les migrations en attente
npx wrangler d1 migrations list maasga_db --remote

# Appliquer toutes les migrations en attente
npx wrangler d1 migrations apply maasga_db --remote
```

| Migration | Contenu |
|---|---|
| 0001 | Schéma initial (products, appointments, clients…) |
| 0002 | Données de démonstration |
| … | … |
| 0042 | Bannières carrousel + table marques |
| 0043 | Table `brand_media_library` (médiathèque par marque) |

---

## Déploiement manuel

```bash
$env:CLOUDFLARE_ACCOUNT_ID = "f489c6f9ffecc57e8a188b26df8fed8c"
npm run build
npx wrangler pages deploy dist --project-name maasga-website
```

## Voir les logs en temps réel

```bash
npx wrangler pages deployment tail --project-name maasga-website
```
