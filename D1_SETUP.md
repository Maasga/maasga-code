# 🗄️ Cloudflare D1 Database Setup - MAASGA

## 📋 Statut actuel
- ✅ `wrangler.jsonc` : Configuration D1 ajoutée
- ✅ `migrations/0001_init_schema.sql` : Schéma complet créé
- ✅ `src/db.ts` : Fonctions d'accès D1 prêtes
- ⏳ Migration du code : En cours

---

## 🚀 Étapes de déploiement

### 1️⃣ **Créer la D1 Database (local)**
```bash
# Créer une nouvelle DB locale
wrangler d1 create maasga_db

# Cela génère un database_id dans wrangler.jsonc
```

### 2️⃣ **Initialiser le schéma**
```bash
# Exécuter les migrations locales
wrangler d1 execute maasga_db --local --file ./migrations/0001_init_schema.sql
```

### 3️⃣ **Vérifier en local**
```bash
# Tester les requêtes
wrangler d1 execute maasga_db --local "SELECT * FROM appointments;"
```

### 4️⃣ **Publier en production**
```bash
# Créer la DB en production Cloudflare
# Puis copier le database_id dans wrangler.jsonc

# Vérifier que le database_id est dans wrangler.jsonc
```

---

## 📊 Schéma de la base (créé)

### Tables principales
- **appointments** : RDV clients (rendez-vous)
- **orders** : Commandes générées 
- **products** : Catalogue de produits
- **reviews** : Avis et commentaires clients
- **clients** : Base clients

---

## 🔄 Migration du code (phases)

### Phase 1 (ACTUEL) - Mode hybride
- Données en mémoire (arrays/store.ts)
- D1 disponible mais pas encore utilisé
- Zéro rupture avec le code existant

### Phase 2 (SEMAINE 1)
- Endpoints `GET /api/appointments` lisent de D1
- Endpoints `POST` écrivent AUSSI dans D1
- Mode dual: mémoire + D1

### Phase 3 (SEMAINE 2)
- Tous les endpoints utilisent D1 uniquement
- Performances testées
- Données persistantes en production

---

## 🛠️ Commandes utiles

```bash
# Dev local avec D1
npm run dev

# Vérifier la DB locale
wrangler d1 list
wrangler d1 execute maasga_db --local

# Quand prêt pour prod
wrangler deploy --name admin-maasga
```

---

## 📝 Notes

- **Sans database_id**: Erreur "Database not found"
  → Exécute `wrangler d1 create maasga_db`
  
- **Données perdues au restart local?** C'est normal en dev
  → En prod Cloudflare, les données persistent 100%

- **Limite D1 gratuit**: Vous avez les requêtes illimitées
  → Parfait pour MAASGA

---

## ✅ Prochaines étapes

1. **Exécuter dans terminal**:
   ```bash
   wrangler d1 create maasga_db
   ```

2. **Copier le database_id** généré vers `wrangler.jsonc`

3. **Initialiser le schéma**:
   ```bash
   wrangler d1 execute maasga_db --local --file ./migrations/0001_init_schema.sql
   ```

4. **Tester un GET**:
   ```bash
   wrangler d1 execute maasga_db --local "SELECT COUNT(*) as appointments FROM appointments;"
   ```

---

## 🎯 Avantage production

Une fois déployé en Cloudflare Pages + D1:
- ✅ Tous les RDV sont sauvegardés
- ✅ Toutes les commandes persistent
- ✅ Zéro perte de données
- ✅ Prêt pour client réel
