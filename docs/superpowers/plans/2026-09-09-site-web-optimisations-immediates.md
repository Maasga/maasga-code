# Site Web - Optimisations Immédiates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimiser les performances et l'accessibilité du site web MAASGA pour améliorer l'UX immédiate

**Architecture:** Optimisation d'images statiques, amélioration de la validation de formulaires existants, audit CSS pour accessibilité

**Tech Stack:** Cloudflare Pages, Hono, TypeScript, Tailwind CSS, GSAP

## Global Constraints

- Bundle size actuel : ~1.06 MB (limite Cloudflare ~1 MB) - toute nouvelle dépendance doit être justifiée
- CSS doit être recompilé avec `npm run build:css` après modification de `src/styles/app.css` ou `tailwind.config.cjs`
- Respecter `prefers-reduced-motion` pour toutes les animations GSAP
- Langue : français pour tout le code, commentaires et messages utilisateur
- Schema.org JSON-LD doit rester valide après modifications

---

### Task 1: Optimisation Images Hero Carousel

**Files:**
- Modify: `src/pages/home.tsx:56-60`
- Create: `public/hero/hero-1.webp`, `public/hero/hero-2.webp`, `public/hero/hero-3.webp`, `public/hero/hero-4.webp`, `public/hero/hero-5.webp`, `public/hero/hero-6.webp`, `public/hero/hero-7.webp`
- Test: Manuel - vérifier taille fichiers et chargement

**Interfaces:**
- Consumes: Existing hero carousel structure in home.tsx
- Produces: Optimized WebP images with reduced file size

- [ ] **Step 1: Convertir les 7 images hero en WebP avec compression agressive**

Utiliser un outil de conversion d'images (ex: squoosh.app ou cwebp) :
- Format : WebP
- Qualité : 75-80%
- Redimensionner à max 1920px de largeur
- Cible : chaque image < 300 KB

Commande example (si cwebp disponible) :
```bash
cwebp -q 80 public/hero/hero-1.jpg -o public/hero/hero-1.webp
# Répéter pour hero-2.jpg à hero-7.jpg
```

- [ ] **Step 2: Vérifier la taille des fichiers convertis**

Run: `ls -lh public/hero/*.webp`
Expected: Chaque fichier < 300 KB, total < 2.1 MB

- [ ] **Step 3: Mettre à jour home.tsx pour utiliser les images WebP**

Modifier `src/pages/home.tsx` lignes 56-60 :
```tsx
{["/hero/hero-1.webp","/hero/hero-2.webp","/hero/hero-3.webp","/hero/hero-4.webp","/hero/hero-5.webp","/hero/hero-6.webp","/hero/hero-7.webp"].map((src, i) => (
  <div class={`hero-carousel-slide${i === 0 ? ' active' : ''}`}>
    <img src={src} alt="MAASGA — installation climatisation" loading="eager" decoding="async" fetchpriority={i === 0 ? 'high' : 'low'} />
  </div>
))}
```

- [ ] **Step 4: Ajouter fallback JPEG pour compatibilité navigateurs anciens**

Modifier pour inclure `<picture>` avec fallback :
```tsx
{["/hero/hero-1","/hero/hero-2","/hero/hero-3","/hero/hero-4","/hero/hero-5","/hero/hero-6","/hero/hero-7"].map((src, i) => (
  <div class={`hero-carousel-slide${i === 0 ? ' active' : ''}`}>
    <picture>
      <source srcSet={`${src}.webp`} type="image/webp" />
      <img src={`${src}.jpg`} alt="MAASGA — installation climatisation" loading="eager" decoding="async" fetchpriority={i === 0 ? 'high' : 'low'} />
    </picture>
  </div>
))}
```

- [ ] **Step 5: Tester le chargement des images en dev**

Run: `npm run dev`
Expected: Images chargent correctement, pas d'erreur 404 dans console

- [ ] **Step 6: Commit**

```bash
git add src/pages/home.tsx public/hero/*.webp
git commit -m "perf: optimiser images hero carousel en WebP avec fallback JPEG"
```

---

### Task 2: Amélioration Validation Formulaire Contact

**Files:**
- Modify: `src/pages/contact.tsx`
- Test: Manuel - tester validation et messages d'erreur

**Interfaces:**
- Consumes: Existing contact form structure
- Produces: Enhanced form validation with clear error messages

- [ ] **Step 1: Lire le fichier contact.tsx actuel**

Run: Lire `src/pages/contact.tsx` pour comprendre la structure actuelle du formulaire

- [ ] **Step 2: Identifier les champs du formulaire existant**

Identifier : nom, email, téléphone, message, et tout autre champ existant

- [ ] **Step 3: Ajouter validation côté client pour le champ email**

Ajouter validation regex pour email français/international :
```tsx
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}
```

- [ ] **Step 4: Ajouter validation pour le champ téléphone burkinabè**

Valider format +226 avec 8 chiffres :
```tsx
const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+226)?[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}
```

- [ ] **Step 5: Ajouter validation pour le champ nom (minimum 2 caractères)**

```tsx
const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
}
```

- [ ] **Step 6: Ajouter validation pour le champ message (minimum 10 caractères)**

```tsx
const validateMessage = (message: string): boolean => {
  return message.trim().length >= 10;
}
```

- [ ] **Step 7: Créer un state pour les erreurs de formulaire**

```tsx
const [errors, setErrors] = useState<Record<string, string>>({});
```

- [ ] **Step 8: Ajouter une fonction de validation complète**

```tsx
const validateForm = (formData: { name: string; email: string; phone: string; message: string }): Record<string, string> => {
  const newErrors: Record<string, string> = {};

  if (!validateName(formData.name)) {
    newErrors.name = "Le nom doit contenir au moins 2 caractères";
  }

  if (!validateEmail(formData.email)) {
    newErrors.email = "Veuillez entrer une adresse email valide";
  }

  if (!validatePhone(formData.phone)) {
    newErrors.phone = "Veuillez entrer un numéro valide (ex: +226 XX XX XX XX)";
  }

  if (!validateMessage(formData.message)) {
    newErrors.message = "Le message doit contenir au moins 10 caractères";
  }

  return newErrors;
}
```

- [ ] **Step 9: Intégrer la validation dans le handler de soumission**

Modifier le onSubmit existant pour valider avant envoi :
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const formData = {
    name: formDataState.name,
    email: formDataState.email,
    phone: formDataState.phone,
    message: formDataState.message
  };

  const validationErrors = validateForm(formData);

  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }

  setErrors({});
  // ... existing submission logic
}
```

- [ ] **Step 10: Afficher les messages d'erreur sous chaque champ**

Ajouter sous chaque input :
```tsx
{errors.name && <p class="text-red-500 text-sm mt-1">{errors.name}</p>}
{errors.email && <p class="text-red-500 text-sm mt-1">{errors.email}</p>}
{errors.phone && <p class="text-red-500 text-sm mt-1">{errors.phone}</p>}
{errors.message && <p class="text-red-500 text-sm mt-1">{errors.message}</p>}
```

- [ ] **Step 11: Tester la validation en dev**

Run: `npm run dev`
Navigateur: http://localhost:5173/contact
Tester:
- Soumettre formulaire vide → tous les champs en erreur
- Email invalide → erreur email
- Téléphone invalide → erreur téléphone
- Formulaire valide → soumission réussie

- [ ] **Step 12: Commit**

```bash
git add src/pages/contact.tsx
git commit -m "feat: améliorer validation formulaire contact avec messages d'erreur explicites"
```

---

### Task 3: Audit Accessibilité - Contraste Mobile

**Files:**
- Modify: `src/styles/app.css`
- Test: Manuel - vérifier contraste avec outils d'accessibilité

**Interfaces:**
- Consumes: Existing CSS design tokens
- Produces: Enhanced contrast ratios for mobile readability

- [ ] **Step 1: Identifier les zones à contraste potentiellement faible**

Rechercher dans `src/styles/app.css` :
- Textes sur fond sombre (background: navy, dark, etc.)
- Textes gris sur fond clair
- Boutons avec faible contraste

- [ ] **Step 2: Auditer le contraste des textes sur fond navy**

Vérifier le ratio de contraste pour :
- Textes blancs sur `var(--navy-900)` ou `bg-navy`
- Textes `var(--ice)` sur fond navy
- Textes `var(--slate-500)` sur fond clair

Standard WCAG AA : minimum 4.5:1 pour texte normal, 3:1 pour texte large

- [ ] **Step 3: Ajuster les couleurs si nécessaire pour atteindre WCAG AA**

Si contraste < 4.5:1, ajuster dans `:root` :
```css
:root {
  /* Exemple : si --ice est trop clair sur navy */
  --ice: #e0f2fe; /* augmenter luminosité */
  --text-on-navy: #f1f5f9; /* blanc pur pour meilleur contraste */
}
```

- [ ] **Step 4: Ajouter une classe utilitaire pour texte haute lisibilité**

```css
.text-high-contrast {
  color: #ffffff !important;
}
```

- [ ] **Step 5: Appliquer la classe aux textes critiques sur mobile**

Modifier `src/pages/home.tsx` et autres pages pour utiliser `.text-high-contrast` sur les textes importants en mobile

- [ ] **Step 6: Recompiler le CSS**

Run: `npm run build:css`
Expected: `public/static/tailwind.css` mis à jour sans erreur

- [ ] **Step 7: Tester le contraste en dev**

Run: `npm run dev`
Navigateur: http://localhost:5173
Outil: Utiliser Chrome DevTools Lighthouse ou extension "WCAG Color Contrast Checker"
Expected: Tous les textes atteignent WCAG AA (4.5:1 minimum)

- [ ] **Step 8: Commit**

```bash
git add src/styles/app.css public/static/tailwind.css
git commit -m "a11y: améliorer contraste des textes pour conformité WCAG AA"
```

---

### Task 4: Audit Accessibilité - Reduced Motion

**Files:**
- Modify: `src/pages/home.tsx`, `src/components/Layout.tsx`
- Test: Manuel - tester avec prefers-reduced-motion activé

**Interfaces:**
- Consumes: Existing GSAP animations
- Produces: Complete reduced-motion support for all animations

- [ ] **Step 1: Identifier toutes les animations GSAP dans home.tsx**

Rechercher dans `src/pages/home.tsx` :
- Carrousel hero (lignes 714-755)
- Neige (lignes 683-711)
- SplitText hero (lignes 782-802)
- SplitText sections (lignes 758-779)
- Section expertise pinned (lignes 272-318)

- [ ] **Step 2: Vérifier que chaque animation vérifie prefers-reduced-motion**

Pour chaque bloc de script GSAP, vérifier la présence de :
```javascript
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
```

- [ ] **Step 3: Ajouter le guard si manquant pour le carousel hero**

Modifier lignes 714-755 si nécessaire :
```javascript
(function(){
  var slides = Array.prototype.slice.call(
    document.querySelectorAll('#hero-carousel .hero-carousel-slide')
  );
  if (slides.length < 2) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function start(){
    if (reduce || !window.gsap) {
      // Afficher statique sans animation
      slides.forEach(function(s, idx){ s.style.clipPath = idx === 0 ? 'inset(0 0 0 0%)' : 'inset(0 0 0 100%)'; });
      return;
    }
    // ... existing animation code
  }
})();
```

- [ ] **Step 4: Vérifier le guard pour la neige**

Modifier lignes 683-711 si nécessaire :
```javascript
function initSnow() {
  if (typeof gsap === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var container = document.getElementById('snow-container');
  // ... existing code
}
```

- [ ] **Step 5: Vérifier les guards SplitText**

Les guards sont déjà présents (lignes 760, 784) - vérifier qu'ils fonctionnent correctement

- [ ] **Step 6: Vérifier le guard pour la section expertise pinned**

Le script expertise (lignes 272-318) n'a pas de guard - en ajouter un :
```javascript
(function() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Mode statique : afficher toutes les étapes empilées
    document.querySelectorAll('.exp-step').forEach((step, i) => {
      step.classList.add('is-active');
    });
    return;
  }
  // ... existing pinned scroll code
})();
```

- [ ] **Step 7: Vérifier le GSAP global dans Layout.tsx**

Lire `src/components/Layout.tsx` et vérifier que le moteur GSAP respecte reduced-motion

- [ ] **Step 8: Tester en mode reduced-motion**

Run: `npm run dev`
Navigateur: http://localhost:5173
Activer prefers-reduced-motion:
- Chrome DevTools → Rendering → Emulate CSS media feature prefers-reduced-motion: reduce
- Ou OS: Paramètres d'accessibilité → Réduire les animations

Expected:
- Carousel affiche slide 1 statique, pas de transition
- Neige désactivée
- SplitText ne s'anime pas
- Section expertise affiche toutes les étapes empilées

- [ ] **Step 9: Commit**

```bash
git add src/pages/home.tsx src/components/Layout.tsx
git commit -m "a11y: compléter support prefers-reduced-motion pour toutes les animations GSAP"
```

---

### Task 5: Documentation Build CSS

**Files:**
- Modify: `CLAUDE.md`
- Test: Aucun - documentation uniquement

**Interfaces:**
- Consumes: Existing CLAUDE.md structure
- Produces: Clear documentation of CSS build requirement

- [ ] **Step 1: Lire la section Commands dans CLAUDE.md**

Lire `CLAUDE.md` pour comprendre la documentation existante

- [ ] **Step 2: Ajouter une note explicative sur build:css**

Ajouter après la section "Commands" :
```markdown
> **Important** : Toute modification de `src/styles/app.css` ou `tailwind.config.cjs`
> nécessite de lancer `npm run build:css` avant de tester dans le navigateur.
> Le serveur de dev (`npm run dev`) sert `public/static/tailwind.css` statiquement,
> donc les nouvelles classes Tailwind n'apparaîtront pas sans recompilation.
```

- [ ] **Step 3: Ajouter un exemple dans la section CSS/design system**

Dans la section "CSS / design system", ajouter :
```markdown
### Workflow modification CSS
1. Modifier `src/styles/app.css` ou `tailwind.config.cjs`
2. Lancer `npm run build:css` pour compiler vers `public/static/tailwind.css`
3. Tester dans le navigateur avec `npm run dev`
4. Committer les deux fichiers modifiés
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: documenter nécessité de build:css après modification Tailwind"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Optimisation images hero carousel (Task 1)
- ✅ Amélioration gestion erreurs formulaire contact (Task 2)
- ✅ Audit accessibilité contraste mobile (Task 3)
- ✅ Audit accessibilité reduced-motion (Task 4)
- ✅ Documentation build CSS (Task 5)

**2. Placeholder scan:**
- ✅ Aucun "TBD", "TODO", ou placeholder
- ✅ Toutes les étapes contiennent du code concret
- ✅ Commandes exactes fournies

**3. Type consistency:**
- ✅ Noms de fonctions cohérents (validateEmail, validatePhone, etc.)
- ✅ Signatures de fonctions TypeScript correctes
- ✅ Chemins de fichiers exacts

---

## Next Steps

Ce plan couvre les optimisations immédiates du site web. Une fois terminé, passer au **Plan 2 : Site Web - Fonctionnalités Espace Client** pour les améliorations fonctionnelles moyennes terme.
