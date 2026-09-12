# Guide SEO & Analytics - MAASGA

Documentation complète pour la configuration des outils SEO/Analytics et la migration vers un domaine personnalisé.

---

## 📋 Table des matières

1. [État actuel](#état-actuel)
2. [Google Search Console](#google-search-console)
3. [Sitemap.xml](#sitemapxml)
4. [Robots.txt & Noindex](#robotstxt--noindex)
5. [Google Analytics](#google-analytics)
6. [Migration vers domaine personnalisé](#migration-vers-domaine-personnalisé)
7. [Checklist de migration](#checklist-de-migration)

---

## 📍 État actuel

### ✅ Déjà configuré
- **Robots.txt** : Configuré dans `src/index.tsx` - bloque `/admin` et `/api/`
- **Sitemap.xml** : Généré dynamiquement dans `src/index.tsx` - inclut les pages principales
- **URL centralisée** : `SITE_URL` dans `src/types.ts` facilite les changements de domaine

### ⚠️ À configurer
- **Google Search Console** : Création de propriété et vérification
- **Google Analytics** : Intégration GA4 et tracking des événements

### 🔄 URL actuelle
- **Site** : `https://maasga-website.pages.dev`
- **Configuration** : `src/types.ts` → `export const SITE_URL = 'https://maasga-website.pages.dev'`

---

## 🔍 Google Search Console

### 1. Création de la propriété

1. Se connecter à [Google Search Console](https://search.google.com/search-console)
2. Cliquer sur "Ajouter une propriété"
3. Sélectionner "Type de flux d'URL" et entrer : `https://maasga-website.pages.dev`
4. Choisir la méthode de vérification recommandée : **DNS TXT**

### 2. Vérification DNS TXT

#### Via Cloudflare Pages (recommandé)
1. Dans Cloudflare Pages → Settings → Custom domains
2. Ajouter votre domaine (même temporaire pour la vérification)
3. Cloudflare affichera l'enregistrement TXT à ajouter
4. Copier cet enregistrement et l'ajouter à votre fournisseur DNS

#### Méthode alternative : Fichier HTML
1. Télécharger le fichier de vérification HTML fourni par Google
2. Placer dans `public/` du projet
3. Ajouter une route dans `src/index.tsx` :
   ```typescript
   app.get('/google123456789.html', (c) => {
     return c.html(' contenu du fichier de vérification ')
   })
   ```

### 3. Configuration post-vérification

#### Paramètres géographiques
1. Dans GSC → Settings → Paramètres géographiques
2. Sélectionner : **Burkina Faso**
3. Cela aide Google à cibler le bon marché

#### Liens internationaux
- Optionnel : Si vous envisagez des versions multilingues
- Pour l'instant : Français uniquement → pas de configuration nécessaire

#### Sitemap
1. Dans GSC → Sitemaps
2. Ajouter : `https://maasga-website.pages.dev/sitemap.xml`
3. Google l'indexera automatiquement

### 4. Surveillance

#### Points clés à surveiller
- **Indexation** : Pages indexées vs total
- **Erreurs d'exploration** : 404, 5xx, redirections
- **Problèmes de pages** : Contenu dupliqué, balises meta
- **Performance** : Core Web Vitals (LCP, FID, CLS)
- **Backlinks** : Sites qui pointent vers MAASGA

#### Rapports utiles
- **Performance** : Vitesse de chargement et expérience utilisateur
- **Améliorations** : HTTPS, accessibilité, SEO mobile
- **Liens** : Liens externes et internes

---

## 🗺️ Sitemap.xml

### État actuel

Le sitemap est généré dynamiquement dans `src/index.tsx` (lignes 538-557) :

```typescript
app.get('/sitemap.xml', (c) => {
  const now = new Date().toISOString().split('T')[0]
  const pages = [
    { path: '/', freq: 'weekly', priority: '1.0' },
    { path: '/catalogue', freq: 'weekly', priority: '0.9' },
    { path: '/simulateur', freq: 'monthly', priority: '0.8' },
    { path: '/rendez-vous', freq: 'monthly', priority: '0.8' },
    { path: '/realisations', freq: 'monthly', priority: '0.7' },
    { path: '/avis', freq: 'weekly', priority: '0.7' },
    { path: '/a-propos', freq: 'monthly', priority: '0.6' },
    { path: '/contact', freq: 'monthly', priority: '0.7' },
    { path: '/espace-client', freq: 'monthly', priority: '0.6' },
    { path: '/contrat-maintenance', freq: 'monthly', priority: '0.7' }
  ]
  // ... génération XML
})
```

### Améliorations recommandées

#### 1. Ajouter les pages légales

Dans `src/index.tsx`, ajouter au tableau `pages` :

```typescript
const pages = [
  // ... pages existantes
  { path: '/mentions-legales', freq: 'monthly', priority: '0.3' },
  { path: '/politique-de-confidentialite', freq: 'monthly', priority: '0.3' }
]
```

#### 2. Sitemap de produits (optionnel pour l'avenir)

Pour inclure dynamiquement les produits du catalogue :

```typescript
// Nouvelle route pour sitemap produits
app.get('/sitemap-products.xml', async (c) => {
  const db = c.env.DB
  if (!db) return c.text('Service unavailable', 503)
  
  const products = await getProducts(db)
  const now = new Date().toISOString().split('T')[0]
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${products.map(p => `  <url><loc>${SITE_URL}/catalogue/product/${p.id}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('\n')}
</urlset>`
  
  return new Response(xml, { 
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' } 
  })
})
```

#### 3. Sitemap index (si plusieurs sitemaps)

```typescript
app.get('/sitemap-index.xml', (c) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-products.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
</sitemapindex>`
  
  return new Response(xml, { 
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' } 
  })
})
```

---

## 🤖 Robots.txt & Noindex

### État actuel

Robots.txt configuré dans `src/index.tsx` (lignes 530-535) :

```typescript
app.get('/robots.txt', (c) => {
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${SITE_URL}/sitemap.xml`,
    { headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=86400' } }
  )
})
```

### Configuration actuelle
- ✅ Bloque `/admin` (zone d'administration)
- ✅ Bloque `/api/` (endpoints techniques)
- ✅ Autorise l'indexation des pages publiques
- ✅ Référence le sitemap
- ✅ Cache de 24h pour les performances

### Vérifications supplémentaires

#### 1. Meta robots dans Layout.tsx

Vérifier que chaque page a les meta tags appropriés dans `src/components/Layout.tsx` :

```typescript
// Meta robots standards
<meta name="robots" content="index, follow" />
<meta name="googlebot" content="index, follow" />
```

#### 2. Pages à noindexer (si nécessaire)

Pour les pages qui ne doivent pas être indexées :

```typescript
// Dans le Layout.tsx ou page spécifique
<meta name="robots" content="noindex, nofollow" />
```

**Pages à potentiellement noindexer :**
- Pages de développement/temporaires
- Pages d'erreur personnalisées
- Pages de test

#### 3. X-Robots-Tag pour endpoints API

Pour les endpoints API qui retournent du HTML :

```typescript
// Dans src/index.tsx, pour les endpoints concernés
app.get('/api/...', (c) => {
  return c.html('...', {
    headers: { 'X-Robots-Tag': 'noindex, nofollow' }
  })
})
```

---

## 📊 Google Analytics

### 1. Création du compte GA4

1. Se connecter à [Google Analytics](https://analytics.google.com)
2. Cliquer sur "Démarrer la mesure"
3. Créer un compte : "MAASGA Climatisation"
4. Créer une propriété GA4
5. Sélectionner "Web" comme flux de données
6. Entrer l'URL : `https://maasga-website.pages.dev`
7. Obtenir le **Measurement ID** (format : `G-XXXXXXXXXX`)

### 2. Intégration dans le code

#### Option A : Via Layout.tsx (recommandée pour commencer)

Dans `src/components/Layout.tsx`, ajouter dans le `<head>` :

```typescript
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX' // Remplacer par votre ID

// Dans le return, avant la fermeture du </head>
<script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}></script>
<script dangerouslySetInnerHTML={{
  __html: `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  `
}} />
```

#### Option B : Via environment variable (plus sécurisée pour production)

1. Ajouter dans `src/types.ts` :
   ```typescript
   export const GA_MEASUREMENT_ID = typeof process !== 'undefined' 
     ? process.env.GA_MEASUREMENT_ID || 'G-XXXXXXXXXX'
     : 'G-XXXXXXXXXX'
   ```

2. Configurer dans Cloudflare Pages :
   ```bash
   # Dans wrangler.toml ou dashboard Cloudflare
   [vars]
   GA_MEASUREMENT_ID = "G-XXXXXXXXXX"
   ```

3. Utiliser dans Layout.tsx :
   ```typescript
   import { GA_MEASUREMENT_ID } from '../types'
   
   <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}></script>
   ```

### 3. Événements personnalisés à tracker

#### Navigation PJAX (déjà partiellement implémenté)

Dans `src/components/Layout.tsx`, le code de navigation PJAX inclut déjà :

```typescript
gtag('event', 'page_view', {
  page_title: document.title,
  page_location: window.location.href,
  page_path: window.location.pathname
})
```

#### Événements de conversion à ajouter

**Soumission de formulaire contact :**
```typescript
// Dans src/pages/contact.tsx, après soumission réussie
gtag('event', 'generate_lead', {
  event_category: 'form',
  event_label: 'contact_form'
})
```

**Soumission de rendez-vous :**
```typescript
// Dans src/pages/rendez-vous.tsx
gtag('event', 'appointment_booked', {
  event_category: 'booking',
  event_label: 'rdv_form'
})
```

**Soumission d'avis :**
```typescript
// Dans src/pages/avis.tsx
gtag('event', 'review_submitted', {
  event_category: 'engagement',
  event_label: 'review_form',
  value: rating // Note donnée
})
```

**Ajout au panier :**
```typescript
// Dans src/components/CheckoutModals.tsx
gtag('event', 'add_to_cart', {
  event_category: 'ecommerce',
  event_label: productId,
  value: price
})
```

**Clics CTA principaux :**
```typescript
// Sur les boutons principaux (catalogue, devis, etc.)
gtag('event', 'cta_click', {
  event_category: 'engagement',
  event_label: buttonLabel
})
```

### 4. Configuration des objectifs (Goals)

Dans Google Analytics → Admin → Objectifs :

1. **Objectif de rendez-vous** :
   - Type : Événement
   - Condition : `appointment_booked`

2. **Objectif de contact** :
   - Type : Événement
   - Condition : `generate_lead`

3. **Objectif d'avis** :
   - Type : Événement
   - Condition : `review_submitted`

4. **Objectif de panier** :
   - Type : Événement
   - Condition : `add_to_cart`

### 5. Audience et segmentation

Créer des audiences personnalisées :

- **Visiteurs Burkina Faso** : Basé sur la géolocalisation
- **Visiteurs mobiles** : Basé sur l'appareil
- **Visiteurs intéressés par l'achat** : Qui ont visité le catalogue
- **Visiteurs clients** : Qui ont visité l'espace client

---

## 🌐 Migration vers domaine personnalisé

### Préparation

#### Quand vous aurez votre vrai domaine (ex: `maasga.bf` ou `maasga-climatisation.com`)

### Étape 1 : Changer SITE_URL

Dans `src/types.ts` :

```typescript
// AVANT
export const SITE_URL = 'https://maasga-website.pages.dev'

// APRÈS
export const SITE_URL = 'https://maasga.bf' // Votre nouveau domaine
```

### Étape 2 : Redéployer le site

```bash
npm run build
npm run deploy
```

### Étape 3 : Configurer Cloudflare Pages

1. Dans Cloudflare Pages → Settings → Custom domains
2. Ajouter votre domaine personnalisé
3. Cloudflare affichera les enregistrements DNS à configurer :
   - **A record** : Pointe vers l'IP de Cloudflare
   - **CNAME record** : Pointe vers votre Pages project
4. Configurer ces enregistrements chez votre registrar
5. Activer SSL automatique (Cloudflare le fait par défaut)

### Étape 4 : Redirection 301 (très important)

#### Option A : Via Cloudflare Page Rules (recommandée)

1. Cloudflare → Rules → Page Rules
2. Créer une règle :
   - **URL pattern** : `maasga-website.pages.dev/*`
   - **Setting** : Forwarding URL
   - **Status code** : 301 - Permanent Redirect
   - **Destination URL** : `https://maasga.bf/$1`

#### Option B : Via Cloudflare Workers

```javascript
// Dans un Worker Cloudflare
export default {
  async fetch(request) {
    const url = new URL(request.url)
    if (url.hostname === 'maasga-website.pages.dev') {
      return Response.redirect(`https://maasga.bf${url.pathname}${url.search}`, 301)
    }
    return fetch(request)
  }
}
```

#### Option C : Via meta tag temporaire (en attendant)

Dans `src/components/Layout.tsx` :

```typescript
<link rel="canonical" href="https://maasga.bf" />
```

### Étape 5 : Migration Google Search Console

#### 1. Ajouter la nouvelle propriété

1. Dans GSC, ajouter une nouvelle propriété pour `https://maasga.bf`
2. Vérifier la propriété (même méthode que précédemment)

#### 2. Utiliser l'outil "Changement d'adresse"

1. Dans l'ancienne propriété (`maasga-website.pages.dev`)
2. Settings → Changement d'adresse
3. Sélectionner la nouvelle propriété (`maasga.bf`)
4. Suivre les 3 étapes de validation :
   - **301 redirects** : Vérifier que la redirection est en place
   - **Sitemaps** : Vérifier que le sitemap est accessible
   - **Verification** : Confirmer que vous possédez les deux sites

#### 3. Google transférera automatiquement
- L'autorité SEO (PageRank)
- Les backlinks
- L'historique d'indexation
- Les données de performance

### Étape 6 : Migration Google Analytics

#### Option A : Conserver la même propriété GA4 (simple)

1. Dans GA4 → Admin → Propriété
2. Flux de données → Web
3. Ajouter le nouveau domaine comme flux de données additionnel
4. Les données seront fusionnées automatiquement

#### Option B : Créer une nouvelle propriété (propre)

1. Créer une nouvelle propriété GA4 pour `maasga.bf`
2. Configurer un nouveau Data Stream
3. Mettre à jour le `GA_MEASUREMENT_ID` dans le code
4. Les données historiques restent accessibles dans l'ancienne propriété

**Recommandation :** Option B pour une séparation propre des données.

### Étape 7 : Mettre à jour les références externes

- **Google My Business** : Mettre à jour l'URL du site web
- **Réseaux sociaux** : Mettre à jour les liens vers le site
- **Partenaires** : Informer les partenaires du changement
- **Emails signature** : Mettre à jour les liens
- **Documents** : Mettre à jour les PDF, présentations, etc.

---

## ✅ Checklist de migration

### Avant la migration
- [ ] Sauvegarder les données Analytics actuelles
- [ ] Exporter les rapports GSC importants
- [ ] Noter les KPIs actuels (trafic, conversions, classement)
- [ ] Préparer le nouveau domaine chez le registrar
- [ ] Préparer les enregistrements DNS

### Pendant la migration
- [ ] Changer `SITE_URL` dans `src/types.ts`
- [ ] Redéployer le site
- [ ] Configurer le domaine dans Cloudflare Pages
- [ ] Configurer les enregistrements DNS
- [ ] Vérifier la propagation DNS (24-48h)
- [ ] Configurer la redirection 301
- [ ] Tester la redirection (ancien → nouveau)
- [ ] Vérifier que le site fonctionne sur le nouveau domaine

### Après la migration
- [ ] Ajouter la nouvelle propriété GSC
- [ ] Configurer le changement d'adresse dans GSC
- [ ] Créer ou mettre à jour la propriété GA4
- [ ] Mettre à jour le `GA_MEASUREMENT_ID` si nécessaire
- [ ] Vérifier que le tracking fonctionne
- [ ] Mettre à jour Google My Business
- [ ] Mettre à jour les réseaux sociaux
- [ ] Mettre à jour les partenaires
- [ ] Surveiller le trafic pendant 2-4 semaines
- [ ] Vérifier que les classements SEO sont maintenus

### Surveillance post-migration
- [ ] Vérifier que le trafic redirige correctement
- [ ] Surveiller les erreurs 404
- [ ] Vérifier que les backlinks pointent vers le nouveau domaine
- [ ] Surveiller les Core Web Vitals
- [ ] Vérifier que les conversions sont toujours trackées

---

## 🔧 Ressources utiles

### Liens officiels
- [Google Search Console](https://search.google.com/search-console)
- [Google Analytics](https://analytics.google.com)
- [Google Tag Manager](https://tagmanager.google.com)
- [Google My Business](https://business.google.com)

### Documentation Google
- [Guide de migration de domaine](https://developers.google.com/search/docs/crawling-indexing/site-move)
- [Documentation GA4](https://support.google.com/analytics/answer/9304153)
- [Sitemaps XML](https://developers.google.com/search/docs/crawling-indexing/sitemaps)

### Outils de test
- [Test de robots.txt](https://developers.google.com/search/tools/robots-testing-tool)
- [Test de sitemap](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- [Test de redirection](https://httpstatus.io/)
- [PageSpeed Insights](https://pagespeed.web.dev/)

---

## 📞 Support

En cas de problème lors de la migration :

1. **Cloudflare Pages** : Documentation et support Cloudflare
2. **Google Search Console** : Centre d'aide Google
3. **Google Analytics** : Communauté Google Analytics
4. **DNS** : Support de votre registrar

---

## 📝 Notes importantes

### SEO
- La redirection 301 est **critique** pour préserver le SEO
- Le changement d'adresse dans GSC prend **2-4 semaines** pour être complet
- Les classements peuvent fluctuer pendant cette période

### Analytics
- Les données ne sont pas transférées entre propriétés GA4
- Conservez l'ancienne propriété pour l'historique
- Configurez des rapports personnalisés pour suivre la migration

### Performance
- Surveillez les Core Web Vitals après la migration
- Le nouveau domaine peut avoir des performances différentes
- Cloudflare CDN aide à maintenir la performance

---

**Document créé le :** 2026-09-09  
**Dernière mise à jour :** 2026-09-09  
**Version :** 1.0