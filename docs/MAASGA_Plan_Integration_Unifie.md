# MAASGA — Plan d'intégration unifié
### Handoff Claude Design + couches Codrops, dans l'ordre, code prêt à coller

**Stack réelle du site :** Hono JSX + Tailwind + GSAP + Lordicon, librairies chargées par **CDN jsdelivr** (déjà autorisé par ton CSP).
**Fichiers touchés :** `src/pages/home.tsx`, `src/components/Layout.tsx`, `src/styles/app.css`.
**Décision hero :** option 2 — carrousel 7 photos avec **transition à balayage clip-path (GSAP)**, pas de WebGL en phase 1.
**Règle d'or :** tout par CDN, aucune nouvelle dépendance npm. Chaque script est protégé par un garde `prefers-reduced-motion` et désactivé sur mobile quand c'est un effet de survol.

---

## Ordre de déploiement (vue d'ensemble)

| Étape | Contenu | Fichiers | Risque | Poids |
|---|---|---|---|---|
| **0** | Appliquer le handoff Claude Design | tous | faible | ~0 |
| **1A** | Lenis (smooth scroll) | Layout, app.css | faible | ~5 Ko |
| **1B** | Hero : transition clip-path GSAP (option 2) | home, app.css | faible | 0 |
| **1C** | SplitText sur le slogan + titres | Layout, home | faible | inclus GSAP |
| **2A** | Tilt 3D des cartes services | home | faible | 0 |
| **2B** | Curseur custom + boutons magnétiques (desktop) | Layout, app.css | moyen | 0 |
| **3** | *(optionnel)* Hero distortion WebGL OGL | home | élevé | ~8 Ko |

On mesure les perfs (Lighthouse mobile + fps au scroll) après l'étape 1, puis après l'étape 2. Rien ne descend sous 50 fps.

---

## ⚙️ Prérequis commun : vérifier la version de GSAP

Ouvre `Layout.tsx` et repère la balise qui charge GSAP (`.../gsap@X.Y.Z/...`). **Charge ScrollTrigger et SplitText depuis exactement la même version.** Si ta version est antérieure à **3.13.0**, passe à 3.13.0 partout : c'est à partir de cette version que SplitText, ScrollTrigger et les autres plugins bonus sont **gratuits**. Dans les exemples ci-dessous j'utilise `3.13.0` — remplace par ta version si elle est ≥ 3.13.

---

# ÉTAPE 0 — Appliquer le handoff

Applique d'abord le paquet Claude Design **tel quel** (les 4 patchs de `PATCHES.md` + les 7 photos dans `public/hero/`). Il pose déjà deux briques qui vont dans le bon sens : le **marquee des avis** et les **reveals IntersectionObserver**. Une seule nuance : le patch hero installe une transition en simple fondu (`.active` + opacity). **L'étape 1B ci-dessous la remplace** par la version clip-path. Donc applique le hero du handoff normalement, on l'écrase juste après.

---

# ÉTAPE 1A — Lenis (smooth scroll)

Le plus gros gain de sensation « premium » pour un poids minime. Il se synchronise avec GSAP/ScrollTrigger.

### `Layout.tsx` — dans `<head>`, après les scripts GSAP existants

```tsx
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js"></script>
```

*(Si ScrollTrigger est déjà chargé chez toi, ne remets que la ligne Lenis.)*

### `app.css` — ajouter

```css
/* ─── Lenis smooth scroll ─── */
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: hidden; }
```

### `Layout.tsx` — script d'init, juste avant `</body>`

```tsx
<script dangerouslySetInnerHTML={{ __html: `
  (function(){
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof Lenis === 'undefined') return;
    var lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function(t){ lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(t){ lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }
    window.__lenis = lenis;
  })();
` }} />
```

> ⚠️ Si un menu mobile en overlay bloque le scroll interne, ajoute `data-lenis-prevent` sur son conteneur scrollable.

---

# ÉTAPE 1B — Hero : transition à balayage clip-path (option 2)

Remplace le fondu simple du handoff par un **balayage latéral** de la photo entrante + un léger recentrage de zoom. Effet Codrops, 100 % GSAP/CSS, robuste.

### `app.css` — REMPLACER le bloc hero du handoff

**AVANT** (celui posé à l'étape 0) :
```css
.hero-carousel-slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1.4s ease; }
.hero-carousel-slide.active { opacity: 1; }
.hero-carousel-slide img { width: 100%; height: 100%; object-fit: cover; animation: heroCarouselZoom 9s ease-in-out infinite alternate; }
```

**APRÈS** :
```css
/* ─── Hero carousel — transition balayage (clip-path) ─── */
.hero-carousel-slide {
  position: absolute; inset: 0; opacity: 1;
  clip-path: inset(0 0 0 100%);
  will-change: clip-path;
}
.hero-carousel-slide:first-child { clip-path: inset(0 0 0 0%); }
.hero-carousel-slide img {
  width: 100%; height: 100%; object-fit: cover;
  will-change: transform;
}
```
*(On abandonne le keyframe `heroCarouselZoom` : c'est désormais GSAP qui anime le zoom, pour éviter deux animations concurrentes sur le même `transform`. Tu peux supprimer le `@keyframes heroCarouselZoom`.)*

### `home.tsx` — REMPLACER le script d'autoplay du handoff

**AVANT** (le `setInterval` qui bascule la classe `.active`) — le supprimer.

**APRÈS** :
```tsx
<script dangerouslySetInnerHTML={{ __html: `
  (function(){
    var slides = Array.prototype.slice.call(
      document.querySelectorAll('#hero-carousel .hero-carousel-slide')
    );
    if (slides.length < 2) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !window.gsap) {
      slides.forEach(function(s, idx){ s.style.clipPath = idx === 0 ? 'inset(0 0 0 0%)' : 'inset(0 0 0 100%)'; });
      return;
    }
    slides.forEach(function(s, idx){ s.style.zIndex = idx === 0 ? 2 : 1; });
    var i = 0, DELAY = 4200;

    function next(){
      var cur = slides[i];
      var n = (i + 1) % slides.length;
      var inc = slides[n];
      var img = inc.querySelector('img');
      inc.style.zIndex = 3;
      gsap.set(inc, { clipPath: 'inset(0 0 0 100%)' });
      if (img) gsap.set(img, { scale: 1.14, xPercent: 4 });
      var tl = gsap.timeline({ onComplete: function(){
        cur.style.zIndex = 1; inc.style.zIndex = 2;
        gsap.set(cur, { clipPath: 'inset(0 0 0 100%)' });
        i = n;
      }});
      tl.to(inc, { clipPath: 'inset(0 0 0 0%)', duration: 1.15, ease: 'power2.inOut' }, 0);
      if (img) tl.to(img, { scale: 1, xPercent: 0, duration: 1.6, ease: 'power2.out' }, 0);
    }

    var timer = setInterval(next, DELAY);
    var hero = document.getElementById('hero-carousel');
    if (hero) {
      hero.addEventListener('mouseenter', function(){ clearInterval(timer); });
      hero.addEventListener('mouseleave', function(){ timer = setInterval(next, DELAY); });
    }
  })();
` }} />
```

> ⚠️ **z-index de l'overlay :** dans le markup hero du handoff, le div de dégradé sombre est le dernier enfant de `#hero-carousel`. Ajoute-lui `style="z-index:5"` pour qu'il reste **au-dessus** des slides (qui montent jusqu'à z-index 3 pendant la transition) et garde le texte lisible.

---

# ÉTAPE 1C — SplitText sur le slogan et les titres

Ton slogan « La fraîcheur que le Burkina mérite » qui se compose mot par mot au chargement. Élégant, quasi gratuit en poids.

### `Layout.tsx` — dans `<head>`, avec les autres scripts GSAP

```tsx
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js"></script>
```

### `home.tsx` — ajouter l'attribut sur le titre du hero

Sur l'élément de ton slogan/titre hero (le `<h1>`), ajoute `data-split-hero` :
```tsx
<h1 data-split-hero class="...tes classes existantes...">La fraîcheur que le Burkina mérite</h1>
```

### `app.css` — ajouter

```css
.split-line { overflow: hidden; }
```

### `home.tsx` — script, en fin de fichier

```tsx
<script dangerouslySetInnerHTML={{ __html: `
  (function(){
    if (!window.gsap || !window.SplitText) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(SplitText);
    var run = function(){
      var target = document.querySelector('[data-split-hero]');
      if (!target) return;
      var split = new SplitText(target, { type: 'lines,words', linesClass: 'split-line' });
      gsap.from(split.words, {
        yPercent: 120, opacity: 0, duration: 0.9,
        ease: 'power3.out', stagger: 0.035, delay: 0.2
      });
    };
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(run); }
    else { run(); }
  })();
` }} />
```

> On attend `document.fonts.ready` pour que la police Sora soit chargée avant de découper — sinon les coupures de ligne sautent. Tu peux réutiliser le même motif sur tes titres de section en leur mettant un `data-split` et un déclenchement au scroll via ScrollTrigger.

---

# ÉTAPE 2A — Tilt 3D des cartes services

Chaque carte de service s'incline légèrement vers le curseur. Vanilla + GSAP, désactivé au toucher.

### `home.tsx` — sur chaque carte de service

Ajoute `data-tilt` au conteneur de carte :
```tsx
<div data-tilt class="...classes carte existantes...">...</div>
```

### `home.tsx` — script

```tsx
<script dangerouslySetInnerHTML={{ __html: `
  (function(){
    if (window.matchMedia('(hover: none)').matches || !window.gsap) return;
    document.querySelectorAll('[data-tilt]').forEach(function(card){
      var rect = null;
      card.addEventListener('mousemove', function(e){
        rect = rect || card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(card, {
          rotateY: x * 9, rotateX: -y * 9,
          transformPerspective: 800, transformOrigin: 'center',
          duration: 0.4, ease: 'power2.out'
        });
      });
      card.addEventListener('mouseleave', function(){
        rect = null;
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
      });
    });
  })();
` }} />
```

---

# ÉTAPE 2B — Curseur custom + boutons magnétiques (desktop)

Signature « site design ». Entièrement caché au toucher (mobile intact).

### `Layout.tsx` — juste avant `</body>`

```tsx
<div id="cursor-dot" aria-hidden="true"></div>
```

### `app.css` — ajouter

```css
/* ─── Curseur custom (desktop only) ─── */
#cursor-dot {
  position: fixed; top: 0; left: 0;
  width: 22px; height: 22px;
  border: 1.5px solid var(--accent, #0369A1);
  border-radius: 50%;
  pointer-events: none; z-index: 9999; opacity: 0;
  transition: opacity .3s, width .25s, height .25s, background .25s;
}
#cursor-dot.hovering { width: 44px; height: 44px; background: rgba(3,105,161,0.08); }
@media (hover: none) { #cursor-dot { display: none !important; } }
```

### `Layout.tsx` — script, avant `</body>`

```tsx
<script dangerouslySetInnerHTML={{ __html: `
  (function(){
    if (window.matchMedia('(hover: none)').matches || !window.gsap) return;
    var dot = document.getElementById('cursor-dot');
    if (!dot) return;
    gsap.set(dot, { xPercent: -50, yPercent: -50 });
    var xTo = gsap.quickTo(dot, 'x', { duration: 0.35, ease: 'power3' });
    var yTo = gsap.quickTo(dot, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('mousemove', function(e){
      dot.style.opacity = '1'; xTo(e.clientX); yTo(e.clientY);
    });
    document.querySelectorAll('a, button, [data-magnetic]').forEach(function(el){
      el.addEventListener('mouseenter', function(){ dot.classList.add('hovering'); });
      el.addEventListener('mouseleave', function(){ dot.classList.remove('hovering'); });
    });
    document.querySelectorAll('[data-magnetic]').forEach(function(el){
      var r = null;
      el.addEventListener('mousemove', function(e){
        r = r || el.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width/2);
        var my = e.clientY - (r.top + r.height/2);
        gsap.to(el, { x: mx*0.25, y: my*0.25, duration: 0.4, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', function(){
        r = null; gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' });
      });
    });
  })();
` }} />
```

### Où mettre `data-magnetic`

Sur tes boutons d'appel à l'action : « Rendez-vous » (header), « Demander un devis », le CTA final. Exemple :
```tsx
<a data-magnetic href="/rendez-vous" class="...classes bouton...">Rendez-vous</a>
```

---

# ÉTAPE 3 — (Optionnel) Hero distortion WebGL

Si après l'étape 2 les perfs restent bonnes et que tu veux pousser le « waouh » encore plus loin, tu peux remplacer le balayage clip-path par une **transition liquide WebGL** entre les 7 photos, avec la micro-librairie **OGL** (~8 Ko, pas Three.js).

**Principe :** deux textures (photo courante + suivante) mélangées via une texture de displacement, progression animée 0→1 par GSAP. C'est l'effet hero signature de Codrops.

**Garde-fous obligatoires pour Ouaga :**
- **Lazy-load** OGL et les shaders : ne les charger que quand le hero est visible (`IntersectionObserver`).
- **Fallback** : si WebGL indisponible ou connexion lente, on retombe sur le balayage clip-path de l'étape 1B (déjà en place — donc aucun risque de page cassée).
- **Test 3G simulé** (DevTools → Network → Slow 3G) : si le hero met plus de ~4 s à s'afficher, on **garde la version clip-path** et on s'arrête là.

Je te fournirai le code OGL complet + le loader conditionnel dans un second temps, une fois les étapes 1 et 2 validées en local — pour ne pas tout empiler d'un coup.

---

## Récapitulatif des attributs à poser dans le markup

Pour que les scripts s'accrochent, ajoute simplement ces attributs à tes éléments existants :

- `data-split-hero` → le `<h1>` du slogan hero
- `data-tilt` → chaque carte de service
- `data-magnetic` → chaque bouton CTA important
- `style="z-index:5"` → le div overlay du hero (lisibilité du texte)
- `data-lenis-prevent` → tout conteneur à scroll interne (menu overlay mobile)

## Vérification avant push

```bash
npm run build:css && npm run dev      # test local
# Lighthouse mobile ≥ 90, scroll fluide à 60 fps
git add -A && git commit -m "Codrops: Lenis, hero clip-path, SplitText, tilt, curseur magnetique"
git push
npm run deploy                        # ou laisse la CI Cloudflare le faire
```
