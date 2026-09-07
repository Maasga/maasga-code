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

| Couche | Technologie |
|---|---|
| Runtime | Cloudflare Pages + Workers (edge) |
| Framework | Hono (SSR JSX) |
| Base de données | Cloudflare D1 (SQLite) |
| Hébergement images | ImgBB API |
| CSS | Tailwind CSS |
| Build | Vite |

### Source de vérité des produits
Le catalogue est **entièrement géré par D1**. Le fichier `src/data/products.ts` exporte un tableau vide — les produits sont chargés depuis D1 au premier démarrage de l'isolate Cloudflare Worker. Un produit supprimé via l'admin est supprimé de D1 et ne réapparaît jamais après un redéploiement.

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
