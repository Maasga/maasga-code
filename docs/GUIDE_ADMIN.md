# MAASGA — Guide de Configuration Rapide

> **Site en production**: https://maasga-website.pages.dev
> **Admin**: https://maasga-website.pages.dev/admin
> **Mot de passe initial admin**: `Maasga@2026`
> **ADMIN_SECRET (pour reset)**: `ma voiture de reve`

---

## Accès Admin

1. Allez sur https://maasga-website.pages.dev/admin
2. Connectez-vous avec le mot de passe initial `Maasga@2026`
3. **Changez le mot de passe immédiatement** via Paramètres

### Si vous oubliez le mot de passe admin:
1. Allez sur https://maasga-website.pages.dev/admin/reset-password
2. Entrez le secret: `ma voiture de reve`
3. Définissez un nouveau mot de passe

---

## Google Analytics (GA4)

**Déjà configuré** avec l'ID `G-LCQJE6963G`.

- Console: https://analytics.google.com
- Les données sont collectées après que le visiteur accepte les cookies
- Voir les stats en temps réel: Analytics → Rapports → Temps réel

---

## Notifications Admin

### Telegram (recommandé)
Pour recevoir des notifications Telegram quand un client passe commande, prend RDV, ou envoie un message :

1. Créez un bot Telegram via [@BotFather](https://t.me/BotFather):
   - Envoyez `/newbot` et donnez-lui un nom (ex: `MAASGA Notifs`)
   - Copiez le **Bot Token**

2. Obtenez votre **Chat ID**:
   - Envoyez un message à votre bot
   - Allez sur `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Trouvez `chat.id` dans la réponse

3. Configurez les secrets Cloudflare:
```powershell
cd "c:\Users\sayta\Downloads\Compressed\webapp (1)\webapp"
$env:CLOUDFLARE_ACCOUNT_ID = "f489c6f9ffecc57e8a188b26df8fed8c"
echo "<VOTRE_BOT_TOKEN>" | npx wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name maasga-website
echo "<VOTRE_CHAT_ID>" | npx wrangler pages secret put TELEGRAM_CHAT_ID --project-name maasga-website
```

### WhatsApp
Les notifications WhatsApp sont automatiques via le numéro 55 99 64 18 configuré.

### Email
Les notifications sont stockées dans la base de données D1 et visibles dans le panneau admin via l'onglet Notifications.

---

## SMS (Twilio) — Optionnel

Pour envoyer des SMS de confirmation aux clients:

1. Créez un compte sur https://www.twilio.com/console
2. Configurez les secrets:
```powershell
echo "<ACCOUNT_SID>" | npx wrangler pages secret put TWILIO_ACCOUNT_SID --project-name maasga-website
echo "<AUTH_TOKEN>" | npx wrangler pages secret put TWILIO_AUTH_TOKEN --project-name maasga-website
echo "+1234567890" | npx wrangler pages secret put TWILIO_FROM --project-name maasga-website
```

---

## Google OAuth (Connexion Google) — Optionnel

Pour permettre aux clients de se connecter via Google:

1. Allez sur https://console.cloud.google.com
2. Créez un projet "MAASGA"
3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Authorized redirect URI: `https://maasga-website.pages.dev/api/auth/google/callback`
5. Configurez les secrets:
```powershell
echo "<CLIENT_ID>" | npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name maasga-website
echo "<CLIENT_SECRET>" | npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name maasga-website
```

---

## Paiements LigdiCash — Optionnel

Pour activer les paiements mobiles (Orange Money, Moov Money):

1. Créez un compte sur https://app.ligdicash.com
2. Configurez les secrets:
```powershell
echo "<API_KEY>" | npx wrangler pages secret put LIGDICASH_API_KEY --project-name maasga-website
echo "<AUTH_TOKEN>" | npx wrangler pages secret put LIGDICASH_AUTH_TOKEN --project-name maasga-website
```

---

## Domaine Personnalisé

1. Achetez un domaine (ex: `maasga.bf` ou `maasga-climatisation.com`)
2. Dans Cloudflare Dashboard → Pages → maasga-website → Custom Domains
3. Ajoutez votre domaine et suivez les instructions DNS

---

## Maintenance & Backup

### Backup D1 (base de données)
```powershell
$env:CLOUDFLARE_ACCOUNT_ID = "f489c6f9ffecc57e8a188b26df8fed8c"

# Exporter les produits
npx wrangler d1 execute maasga_db --remote --command "SELECT * FROM products"

# Exporter les clients
npx wrangler d1 execute maasga_db --remote --command "SELECT id, name, phone, email, quartier FROM clients"

# Exporter les commandes
npx wrangler d1 execute maasga_db --remote --command "SELECT * FROM orders"
```

### Voir les logs en temps réel
```powershell
npx wrangler pages deployment tail --project-name maasga-website
```

### Redéployer
```powershell
cd "c:\Users\sayta\Downloads\Compressed\webapp (1)\webapp"
$env:CLOUDFLARE_ACCOUNT_ID = "f489c6f9ffecc57e8a188b26df8fed8c"
npm run build
npx wrangler pages deploy dist --project-name maasga-website --commit-dirty=true
```

---

## URLs Importantes

| Service | URL |
|---------|-----|
| Site web | https://maasga-website.pages.dev |
| Admin | https://maasga-website.pages.dev/admin |
| Espace client | https://maasga-website.pages.dev/espace-client |
| Google Analytics | https://analytics.google.com |
| Cloudflare Dashboard | https://dash.cloudflare.com |
| Twilio | https://www.twilio.com/console |
| LigdiCash | https://app.ligdicash.com |

---

## Checklist Finale

- [x] Site en production
- [x] Google Analytics GA4 configuré (G-LCQJE6963G)
- [x] Bannière de consentement cookies
- [x] ADMIN_SECRET configuré
- [x] Mot de passe initial admin défini
- [x] Images OG (partage social) PNG
- [x] Icônes PWA (192x192, 512x512)
- [x] Favicon PNG
- [x] Notifications admin (D1 + Telegram)
- [x] Réinitialisation mot de passe client
- [x] Sécurité renforcée (59 corrections)
- [ ] Telegram bot (à configurer)
- [ ] SMS Twilio (optionnel)
- [ ] Google OAuth (optionnel)
- [ ] LigdiCash (optionnel)
- [ ] Domaine personnalisé (optionnel)
