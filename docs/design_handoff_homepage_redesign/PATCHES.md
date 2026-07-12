# Patches — Refonte homepage MAASGA

Fichiers concernés : `src/pages/home.tsx`, `src/components/Layout.tsx`, `src/styles/app.css`.

---

## 1. Hero — carrousel plein écran de 7 photos (remplace vidéo + halos)

### `src/styles/app.css` — ajouter à la fin du fichier

```css
/* ─── Hero photo carousel ─── */
@keyframes heroCarouselZoom {
  0%   { transform: scale(1); }
  100% { transform: scale(1.12); }
}
.hero-carousel-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 1.4s ease;
}
.hero-carousel-slide.active { opacity: 1; }
.hero-carousel-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: heroCarouselZoom 9s ease-in-out infinite alternate;
}
```

### `src/pages/home.tsx` — dans la section `<section class="gradient-hero ...">`

**AVANT** (bloc vidéo + halos + flocons décoratifs, juste après l'ouverture de la section) :
```tsx
        {/* Background Video (faible opacité) */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          class="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style="z-index: 0; opacity: 0.18; object-position: 80% 50%;"
        >
          <source src="/HOMZ3.mp4" type="video/mp4" />
        </video>

        {/* Particules de neige */}
        <div id="snow-container" class="absolute inset-0 overflow-hidden pointer-events-none"></div>

        {/* Halos lumineux — parallax léger */}
        <div class="glow-dot w-96 h-96 top-[-80px] right-[-80px]" style="background:rgba(3,105,161,0.35);" data-parallax="40"></div>
        <div class="glow-dot w-80 h-80 bottom-[-60px] left-[-60px]" style="background:rgba(0,180,216,0.18);" data-parallax="-30"></div>

        {/* Flocons flottants discrets */}
        <i class="fas fa-snowflake absolute top-24 left-10 text-5xl float" style="color:rgba(202,240,248,0.10);" data-parallax="40"></i>
        <i class="fas fa-snowflake absolute bottom-40 right-20 text-3xl float" style="color:rgba(202,240,248,0.07); animation-delay:1s;" data-parallax="-30"></i>
        <i class="fas fa-snowflake absolute top-1/2 left-1/4 text-7xl float" style="color:rgba(202,240,248,0.05); animation-delay:2s;" data-parallax="25"></i>
```

**APRÈS** :
```tsx
        {/* Carrousel photo plein écran — 7 photos, fondu + zoom léger */}
        <div id="hero-carousel" class="absolute inset-0 pointer-events-none">
          {["/hero/hero-1.jpg","/hero/hero-2.jpg","/hero/hero-3.jpg","/hero/hero-4.jpg","/hero/hero-5.jpg","/hero/hero-6.jpg","/hero/hero-7.jpg"].map((src, i) => (
            <div class={`hero-carousel-slide${i === 0 ? ' active' : ''}`}>
              <img src={src} alt="MAASGA — installation climatisation" loading={i === 0 ? 'eager' : 'lazy'} />
            </div>
          ))}
          <div class="absolute inset-0" style="background:linear-gradient(100deg,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.55) 42%,rgba(0,0,0,0.28) 75%,rgba(0,0,0,0.5) 100%),linear-gradient(180deg,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.55) 100%);"></div>
        </div>

        {/* Particules de neige — conservées par-dessus le carrousel */}
        <div id="snow-container" class="absolute inset-0 overflow-hidden pointer-events-none"></div>
```

**Script d'autoplay** — ajouter juste avant `</Layout>` en fin de fichier, à côté du script GSAP neige existant :
```tsx
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          var slides = document.querySelectorAll('#hero-carousel .hero-carousel-slide');
          if (!slides.length) return;
          var i = 0;
          setInterval(function() {
            slides[i].classList.remove('active');
            i = (i + 1) % slides.length;
            slides[i].classList.add('active');
          }, 4000);
        })();
      ` }} />
```

> Place les 7 fichiers de `assets/hero/*.jpg` dans `public/hero/` (créer le dossier).

---

## 2. Avis clients — défilement continu gauche→droite + apparition améliorée

### `src/styles/app.css` — ajouter

```css
/* ─── Testimonials marquee ─── */
@keyframes testimonialMarquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.testimonial-track {
  display: flex;
  gap: 1.5rem;
  width: max-content;
  animation: testimonialMarquee 32s linear infinite;
}
.testimonial-track:hover { animation-play-state: paused; }
.testimonial-card-in {
  opacity: 0;
  transform: translateY(24px) scale(0.96);
  transition: opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1);
}
.testimonial-card-in.in { opacity: 1; transform: none; }
```

### `src/pages/home.tsx` — section `{/* ===== AVIS CLIENTS ===== */}`

**AVANT** (le bloc du carrousel avec points de pagination) :
```tsx
          <div class="relative">
            <div id="testimonial-carousel" class="flex gap-6 overflow-x-auto scroll-smooth pb-4" style="scrollbar-width:none; -webkit-overflow-scrolling:touch;">
              {[...topReviews, ...topReviews].map((r, idx) => (
                <div class="surface-elevated p-6 flex-shrink-0" style="min-width:320px; max-width:360px;">
                  ...
                </div>
              ))}
            </div>
            <div class="flex justify-center mt-6 space-x-2">
              {topReviews.map((_, i) => (
                <button onclick={`scrollCarousel(${i})`} class="carousel-dot h-2.5 rounded-full transition-all" style={i === 0 ? 'background:var(--accent); width:20px;' : 'background:rgba(3,105,161,0.25); width:10px;'}></button>
              ))}
            </div>
            <script dangerouslySetInnerHTML={{ __html: `...scrollCarousel logic...` }} />
          </div>
```

**APRÈS** :
```tsx
          <div class="relative" style="overflow:hidden;" data-reveal>
            <div class="testimonial-track">
              {[...topReviews, ...topReviews, ...topReviews].map((r, idx) => (
                <div class="surface-elevated p-6 flex-shrink-0 testimonial-card-in" style={`min-width:320px; max-width:360px; transition-delay:${0.08 * (idx % topReviews.length)}s;`} data-testimonial-card>
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex space-x-0.5">
                      {[1,2,3,4,5].map(s => (
                        <i class={`ph-fill ph-star text-sm ${s <= r.note ? 'star-filled' : 'star-empty'}`}></i>
                      ))}
                    </div>
                    <span class="text-xs" style="color:#94a3b8;">{r.date}</span>
                  </div>
                  <p class="text-sm leading-relaxed mb-4 italic" style="color:var(--slate-700);">"{r.comment}"</p>
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center" style="background:rgba(3,105,161,0.08); border:1px solid rgba(3,105,161,0.15);">
                      <i class="ph-duotone ph-user text-sm" style="color:var(--accent);"></i>
                    </div>
                    <div>
                      <div class="text-sm font-bold" style="color:var(--navy-900);">{r.name}</div>
                      <div class="text-xs" style="color:var(--slate-500);">{r.service}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <script dangerouslySetInnerHTML={{ __html: `
            (function() {
              var cards = document.querySelectorAll('[data-testimonial-card]');
              if (!cards.length) return;
              var io = new IntersectionObserver(function(entries) {
                entries.forEach(function(e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
              }, { threshold: 0.1 });
              cards.forEach(function(c) { io.observe(c); });
            })();
          ` }} />
```

Note : tripler la liste (`...topReviews, ...topReviews, ...topReviews`) donne assez de largeur pour une boucle fluide même avec peu d'avis ; ajuste à `2x` si `topReviews.length` est déjà grand (6+).

---

## 3. Icônes de qualité + animées

### `src/components/Layout.tsx` — dans `<head>`, juste après la ligne Font Awesome existante

**AVANT :**
```tsx
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" media="print" onload="this.media='all'" />
        <noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" /></noscript>
```

**APRÈS :**
```tsx
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" media="print" onload="this.media='all'" />
        <noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" /></noscript>
        <link href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/duotone/style.css" rel="stylesheet" media="print" onload="this.media='all'" />
        <link href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/fill/style.css" rel="stylesheet" media="print" onload="this.media='all'" />
```

> ⚠️ Le CSP dans `src/index.tsx` (middleware sécurité) autorise déjà `cdn.jsdelivr.net` — pas de changement nécessaire côté CSP.

### `src/pages/home.tsx` — remplacements d'icônes recommandés (page d'accueil uniquement)

Remplacer ces classes Font Awesome par leur équivalent Phosphor duotone (qualité et cohérence supérieures) :
- `fas fa-shield-halved` → `ph-duotone ph-shield-check`
- `fas fa-snowflake` → `ph-duotone ph-snowflake`
- `fas fa-arrow-right` → `ph-duotone ph-arrow-right`
- `fas fa-calendar-plus` → `ph-duotone ph-calendar-plus`
- `fas fa-chart-line` → `ph-duotone ph-chart-line-up`
- `fas fa-screwdriver-wrench` → `ph-duotone ph-wrench`
- `fas fa-cart-shopping` → `ph-duotone ph-shopping-cart-simple`
- `fas fa-star` (badges, pas les avis) → `ph-fill ph-star`
- `fas fa-chevron-down` → `ph-duotone ph-caret-down`

Garder Font Awesome pour `fa-whatsapp` (logo de marque) ou utiliser `ph-fill ph-whatsapp-logo` (Phosphor a aussi ce logo).

---

## 4. Header — navigation complète dans la pill flottante

Le header actuel (`Layout.tsx`) affiche déjà la nav complète en xl+ et un menu mobile en grille — pas de changement nécessaire côté structure/liens. Ce patch documente juste l'alignement visuel utilisé dans la maquette validée (logo réel + séparateurs + icônes Phosphor par lien + bouton dégradé), pour référence si tu retouches le style de la pill desktop :

```tsx
<div class="... rounded-full ..." style="display:flex;align-items:center;gap:20px;padding:8px 10px 8px 14px;">
  <div style="display:flex;align-items:center;gap:8px;">
    <img src="/logo-site.png" alt="MAASGA" style="width:26px;height:26px;" />
    <span style="font-family:'Sora',sans-serif;font-weight:800;font-size:13.5px;">MAASGA</span>
  </div>
  <div style="width:1px;align-self:stretch;background:rgba(148,163,184,0.18);"></div>
  {/* 8 liens : Accueil, Catalogue, Maintenance, Simulateur, Rendez-vous, Avis, À propos, Contact — icône Phosphor duotone + label, 10.5px */}
  <div style="width:1px;align-self:stretch;background:rgba(148,163,184,0.18);"></div>
  {/* Espace client (icône + label) */}
  {/* Bouton "Rendez-vous" — fond linear-gradient(135deg,#0369A1,#00b4d8), icône ph-calendar-plus */}
</div>
```

Assets : `assets/maasga-logo.png` dans ce dossier (copie du vrai logo `public/logo-site.png` — aucune action nécessaire, déjà dans ton repo).

### Icônes animées Lordicon supplémentaires

Le composant `AnimatedIcon` existe déjà dans `Layout.tsx` et est utilisé dans la nav/footer. L'étendre à la homepage :

**Badge "Techniciens certifiés" du hero** — remplacer :
```tsx
<i class="fas fa-shield-halved text-xs" style="color:var(--ice);"></i>
```
par :
```tsx
<AnimatedIcon src="https://cdn.lordicon.com/lbjtvqiv.json" trigger="loop" size={16} colors="primary:#caf0f8,secondary:#00b4d8" />
```
(icône vérifiée visuellement : cadenas — cohérent avec "certifié/sécurisé". Import `AnimatedIcon` déjà exporté par `Layout.tsx`, donc `import { AnimatedIcon } from '../components/Layout'` en haut de `home.tsx`.)

**CTA final** — avant `<h2 class="display-2 mb-4" ...>Prêt à profiter du confort climatisé ?</h2>`, ajouter :
```tsx
<AnimatedIcon src="https://cdn.lordicon.com/fttvwdlw.json" trigger="loop" size={48} colors="primary:#caf0f8,secondary:#00b4d8" class="mx-auto mb-3" />
```
(icône vérifiée : fusée — évoque rapidité d'installation. Remplace ou complète le `<i class="fas fa-snowflake" ...>` existant juste au-dessus du H2, au choix.)
