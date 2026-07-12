# 🚀 MAASGA - Configuration Finale

## 1️⃣ GOOGLE ANALYTICS ✅ (Mise en place facile)

### Étape 1: Créer un compte Google Analytics
1. Va sur [Google Analytics](https://analytics.google.com)
2. Clique "Créer un compte"
3. Nom: "MAASGA Climatisation"
4. URL du site: `https://www.maasga-climatisation.sn`
5. Accepte les conditions → Crée

### Étape 2: Récupère ton ID GA
- Dans Google Analytics, va à **Admin** → **Propriété** → **Balises Google**
- Copie l'ID (format: `G-XXXXXXXXXX`)

### Étape 3: Remplace le placeholder
Ouvre `src/components/Layout.tsx` et remplace **2 fois** :
```
G-XXXXXXXXXX  →  G-TON_VRAI_ID
```

### Test
Après déploiement, visite le site et va dans Google Analytics:
- **Realtime** → Tu dois voir tes visites en direct ✅

---

## 2️⃣ SMS NOTIFICATIONS ✅ (10 min de setup)

### Option A: Twilio (Payant - Recommandé pour SMS fiable)

#### Étape 1: Créer compte Twilio
1. Va sur [Twilio.com](https://www.twilio.com)
2. Crée un compte gratuit (crédit $15)
3. Va à **Console** → **Account**
4. Copie:
   - **Account SID** → `AC...`
   - **Auth Token** → `...`
5. Va à **Phone Numbers** → Achète un numéro (+1, +221, etc.)

#### Étape 2: Ajouter au wrangler.jsonc
Ouvre `wrangler.jsonc` et ajoute ceci:
```jsonc
{
  "name": "webapp",
  "compatibility_date": "2026-02-21",
  "pages_build_output_dir": "./dist",
  "d1_databases": [...],
  
  // ➕ AJOUTE CES LIGNES:
  "env": {
    "production": {
      "vars": {
        "TWILIO_ACCOUNT_SID": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "TWILIO_AUTH_TOKEN": "your_auth_token_here_keep_secret",
        "TWILIO_FROM": "+221770000000"  // Ton numéro Twilio
      }
    }
  }
}
```

#### Étape 3: Déployer
```powershell
npm run build
npx wrangler pages deploy dist --project-name maasga-website
```

**Résultat**: SMS auto-envoyé après chaque RDV confirmé ✅

---

### Option B: API Orange Money ou Infratel (Gratuit Sénégal)
À implémenter si tu veux envoyer via opérateur local sénégalais.

---

## 3️⃣ BACKUP AUTOMATIQUE D1 ✅

### Étape 1: S'abonner à Cloudflare Workers Crons

D1 n'a pas de backup auto natif, mais tu peux utiliser une **Scheduled Function**:

#### Créer un script de backup
Crée le fichier `functions/backup-d1.ts`:
```typescript
// functions/backup-d1.ts
export async function onRequest(context: { env: any }) {
  const db = context.env.DB
  
  // Exporter la DB en JSON
  const products = await db.prepare('SELECT * FROM products').all()
  const clients = await db.prepare('SELECT * FROM clients').all()
  const appointments = await db.prepare('SELECT * FROM appointments').all()
  
  const backup = {
    timestamp: new Date().toISOString(),
    products: products.results,
    clients: clients.results,
    appointments: appointments.results
  }
  
  // Sauvegarder sur Durable Objects ou KV Store
  await context.env.BACKUP_KV.put(
    'backup-' + new Date().toISOString().split('T')[0],
    JSON.stringify(backup),
    { expirationTtl: 30 * 24 * 60 * 60 } // 30 jours
  )
  
  return new Response('✅ Backup créé', { status: 200 })
}
```

#### Alternative simple: Export manuel quotidien
```powershell
# Chaque jour à 2h du matin:
npx wrangler d1 execute maasga_db --remote --command "SELECT * FROM products" > backup_$(date +%Y%m%d).sql
```

---

## 4️⃣ DOMAIN PERSONNALISÉ ✅

### Étape 1: Acheter un domaine
Options pour `.sn` (Sénégal):
- **Registry.sn** (officiel) → domaines.sn
- **Namecheap.com** → $7-15/an (international)
- **OVH.com** → $5-10/an

**Exemple**: `maasga-climatisation.sn` ou `climatisation.sn`

### Étape 2: Pointer vers Cloudflare

#### Si domaine chez Cloudflare (le plus facile):
1. Ajoute le domaine dans Cloudflare
2. Copie les **2 Nameservers** donnés
3. Va chez ton registrar → **Nameservers** → Colle les 2
4. Attends 24h

#### Si domaine ailleurs (e.g., Namecheap):
1. Va chez Namecheap → Domaine → **Nameservers**
2. Change vers les Nameservers Cloudflare
3. Attends propagation (~4h-24h)

### Étape 3: Ajouter custom domain en Cloudflare Pages
```powershell
npx wrangler pages project add-domain maasga-website \
  --domain maasga-climatisation.sn
```

**Résultat**:
- ❌ Avant: `https://eab99858.maasga-website.pages.dev`
- ✅ Après: `https://maasga-climatisation.sn`

---

## 📋 CHECKLIST DE VÉRIFICATION

- [ ] Google Analytics ID ajouté dans Layout.tsx
- [ ] GA affichage en temps réel fonctionne
- [ ] Compte Twilio créé + variables ajoutées
- [ ] SMS reçu lors d'un test RDV
- [ ] Wrangler relogué
- [ ] Build déployé
- [ ] Domaine acheté
- [ ] Domaine pointé vers Cloudflare
- [ ] Custom domain configuré en Pages
- [ ] Site accessible via domaine personnel

---

## 🔐 SÉCURITÉ - Protéger tes secrets

**Ne JAMAIS commit** les tokens Twilio en git!

```powershell
# En développement local
cp .env.example .env
# Puis ajoute tes secrets locaux

# En production (Cloudflare)
# Les secrets vont en wrangler.jsonc → env.production.vars
# ❌ Pas dans git!  
# ✅ Dans les secrets Cloudflare via UI ou CLI
```

---

## 📚 RÉSUMÉ

| Feature | Status | Temps | Coût |
|---------|--------|-------|------|
| Google Analytics | ✅ Impl | 5 min | Gratuit |
| SMS (Twilio) | ✅ Impl | 10 min | $0-1/SMS |
| Backup D1 | 📝 Setup | 15 min | Gratuit (KV store) |
| Domain | 📝 Config | 5 min | $10-15/an |
| **TOTAL** | **✅ READY** | **35 min** | **~$1-2/mois** |

---

## 🆘 Dépannage

### SMS ne s'envoie pas
- Vérifier les credentials Twilio
- Vérifier le format du numéro `+221...`
- Voir logs Cloudflare Workers

### Domain ne fonctionne pas
- Attendre propagation DNS (24h max)
- Vérifier nameservers dans registrar
- Vérifier CNAME en Cloudflare

### GA n'enregistre pas les visites
- Vérifier ID GA correct
- Attendre 24h pour historique
- Vérifier pas de blocker (ublock, etc.)

---

**Besoin d'aide?** Les features sont prêtes à 100%, c'est juste du setup cloud ☁️
