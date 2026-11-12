import { CGUModal, initCGUModal } from './CGUModal'
import { SITE_URL } from '../types'
import { asset } from '../generated/asset-manifest'

const PAGE_LABELS: Record<string, string> = {
  home: "Accueil",
  simulateur: "Simulateur",
  catalogue: "Catalogue",
  maintenance: "Maintenance",
  rdv: "Rendez-vous",
  avis: "Avis",
  apropos: "À propos",
  contact: "Contact",
  client: "Espace client",
  realisations: "Réalisations",
}

// Mapping route → libellé pour le texte de l'overlay de transition de page
// (client-side, voir bloc ASYNC PAGE TRANSITIONS). Couvre toutes les routes
// publiques définies dans src/index.tsx ; /admin* n'a pas besoin d'entrée
// puisqu'il est exclu du pipeline de transition.
const ROUTE_LABELS: Record<string, string> = {
  "/": PAGE_LABELS.home,
  "/catalogue": PAGE_LABELS.catalogue,
  "/contrat-maintenance": PAGE_LABELS.maintenance,
  "/simulateur": PAGE_LABELS.simulateur,
  "/rendez-vous": PAGE_LABELS.rdv,
  "/avis": PAGE_LABELS.avis,
  "/a-propos": PAGE_LABELS.apropos,
  "/contact": PAGE_LABELS.contact,
  "/realisations": PAGE_LABELS.realisations,
  "/espace-client": PAGE_LABELS.client,
}

// Icônes Font Awesome (déjà chargé, fiable) — remplace l'ancien AnimatedIcon
// basé sur Lordicon : la plupart des IDs Lordicon gratuits renvoyaient 404 et
// le player Lottie plantait en boucle (voir CLAUDE.md, "known issue").
export const NavIcon = ({ icon, color = '#94a3b8', size = 16, class: className = '' }: { icon: string, color?: string, size?: number, class?: string }) => {
  return <i class={`fas ${icon} ${className}`} style={{ color, fontSize: `${size}px`, width: `${size + 4}px`, textAlign: 'center' }} aria-hidden="true"></i>
}

export const Layout = ({ children, title = "MAASGA - Expert Froid & Climatisation Burkina Faso", activePage = "", description = "MAASGA - Spécialiste vente, installation et maintenance de climatiseurs à Ouagadougou, Burkina Faso. Devis gratuit, techniciens certifiés.", canonicalPath = "", jsonLd, ogImage, ogType = "website", noindex = false }: {
  children: any
  title?: string
  activePage?: string
  description?: string
  canonicalPath?: string
  jsonLd?: string
  /** Image de partage (URL absolue) — par défaut og-image.png */
  ogImage?: string
  ogType?: string
  /** Pages privées (profil client…) : exclues des moteurs */
  noindex?: boolean
}) => {
  // SITE_URL importé depuis src/types.ts — modifier là-bas quand le domaine change.
  const siteUrl = SITE_URL
  const canonical = canonicalPath ? `${siteUrl}${canonicalPath}` : ''
  return (
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="description" content={description} />
        {canonical && <link rel="canonical" href={canonical} />}
        {noindex && <meta name="robots" content="noindex,nofollow" />}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content={ogType} />
        <meta property="og:image" content={ogImage || `${siteUrl}/og-image.png`} />
        {canonical && <meta property="og:url" content={canonical} />}
        <meta property="og:locale" content="fr_BF" />
        <meta property="og:site_name" content="MAASGA Climatisation" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage || `${siteUrl}/og-image.png`} />
        <meta name="theme-color" content="#e8f4ff" />
        <link rel="manifest" href="/manifest.json" />
        {canonicalPath === "/" && <link rel="preload" as="image" href="/hero/hero-1.webp" imagesrcset="/hero/hero-1-800.webp 800w, /hero/hero-1.webp 1600w" imagesizes="100vw" fetchpriority="high" />}
        <link rel="apple-touch-icon" href="/logo-512.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />
        <noscript><link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" /></noscript>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js" defer crossorigin="anonymous"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js" defer crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js" defer crossorigin="anonymous"></script>
        <link rel="stylesheet" href={asset("/static/tailwind.css")} />
        <link rel="stylesheet" href={asset("/static/style.css")} />
        <title>{title}</title>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" media="print" onload="this.media='all'" />
        <noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" /></noscript>

        {/* Google Analytics GA4 — consent-aware (load async FIRST, then configure) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-LCQJE6963G"></script>
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', { analytics_storage: 'denied' });
          if (localStorage.getItem('maasga_cookies_accepted') === 'true') {
            gtag('consent', 'update', { analytics_storage: 'granted' });
          }
          gtag('js', new Date());
          gtag('config', 'G-LCQJE6963G', { page_path: window.location.pathname, anonymize_ip: true });
        `}} />
        {/* JSON-LD Structured Data injection point */}
        {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
      </head>
      <body class="min-h-screen pb-16 md:pb-0" style="background-color:#f8fbff; color:var(--ink);" onload="window.initCGUModal?.()">

        {/* js-ready : pose immédiatement la classe pour activer l'état initial caché
            des reveals. Si JS est désactivé, la classe n'est jamais posée → contenu visible. */}
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('js-ready');` }} />

        {/* PAGE LOADER — affiché uniquement au premier chargement de la session */}
        <div id="page-loader" style="position:fixed;inset:0;z-index:999999;background:#ffffff;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:opacity 0.3s ease,visibility 0.3s ease;">
          <div style="position:relative;margin-bottom:1.5rem;">
            <div style="width:72px;height:72px;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,119,182,0.2);animation:loader-pulse 1.5s ease-in-out infinite;">
              <img src="/logo-site.webp" width="192" height="192" alt="MAASGA" style="width:100%;height:100%;object-fit:cover;" />
            </div>
          </div>
          <div style="color:#03045e;font-size:1.6rem;font-weight:800;letter-spacing:0.1em;margin-bottom:0.4rem;">MAASGA</div>
          <div style="color:#0077b6;font-size:0.75rem;letter-spacing:0.2em;margin-bottom:2rem;font-weight:600;">FROID &amp; CLIMATISATION</div>
          <div style="display:flex;gap:6px;">
            <span style="width:8px;height:8px;border-radius:50%;background:#0077b6;animation:loader-bounce 0.8s ease-in-out infinite;"></span>
            <span style="width:8px;height:8px;border-radius:50%;background:#0077b6;animation:loader-bounce 0.8s ease-in-out 0.15s infinite;"></span>
            <span style="width:8px;height:8px;border-radius:50%;background:#0077b6;animation:loader-bounce 0.8s ease-in-out 0.3s infinite;"></span>
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          // Cacher immédiatement le loader si déjà visité dans la session
          (function(){
            var l=document.getElementById('page-loader');
            if(!l)return;
            if(sessionStorage.getItem('maasga_loaded')){
              l.style.display='none';
            } else {
              sessionStorage.setItem('maasga_loaded','1');
            }
          })();
        `}} />
        <style>{`
          @keyframes loader-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes loader-pulse { 0%,100%{transform:scale(1);box-shadow:0 0 30px rgba(0,180,216,0.5)} 50%{transform:scale(1.08);box-shadow:0 0 60px rgba(0,180,216,0.9)} }
          @keyframes loader-bounce { 0%,100%{transform:translateY(0);opacity:0.5} 50%{transform:translateY(-10px);opacity:1} }
          @keyframes float-up { 0%{transform:translateY(20px);opacity:0} 100%{transform:translateY(0);opacity:1} }
          @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
          @keyframes glow-pulse { 0%,100%{box-shadow:0 0 10px rgba(0,119,182,0.2)} 50%{box-shadow:0 0 30px rgba(0,119,182,0.5)} }
          @keyframes slide-in-left { from{transform:translateX(-30px);opacity:0} to{transform:translateX(0);opacity:1} }
          @keyframes slide-in-right { from{transform:translateX(30px);opacity:0} to{transform:translateX(0);opacity:1} }
          .reveal { opacity:0; transform:translateY(28px); transition:opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1); }
          .reveal.visible { opacity:1; transform:none; }
          .reveal-left { opacity:0; transform:translateX(-30px); transition:opacity 0.7s ease, transform 0.7s ease; }
          .reveal-left.visible { opacity:1; transform:none; }
          .reveal-right { opacity:0; transform:translateX(30px); transition:opacity 0.7s ease, transform 0.7s ease; }
          .reveal-right.visible { opacity:1; transform:none; }
          .card-hover { transition:transform 0.3s ease, box-shadow 0.3s ease; }
          .card-hover:hover { transform:translateY(-6px); box-shadow:0 20px 40px rgba(0,119,182,0.18); }
          .btn-glow:hover { animation:glow-pulse 1s ease-in-out infinite; }
          .stagger-1{transition-delay:0.05s} .stagger-2{transition-delay:0.12s} .stagger-3{transition-delay:0.19s} .stagger-4{transition-delay:0.26s} .stagger-5{transition-delay:0.33s} .stagger-6{transition-delay:0.40s}
          /* Mobile menu animation */
          .mobile-menu { display:none; opacity:0; transform:translateY(-8px); transition:opacity 0.25s ease, transform 0.25s ease; }
          .mobile-menu.open { display:block; opacity:1; transform:translateY(0); animation:menuSlideIn 0.25s ease forwards; }
          @keyframes menuSlideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
          .mobile-nav-active { background:rgba(0,119,182,0.08); color:#0077b6; font-weight:700; }
          body.modal-open { overflow: hidden !important; height: 100vh !important; }
        `}</style>

        {/* Skip to content — accessibility */}
        <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[99999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-white" style="background:#0ea5e9;">Aller au contenu principal</a>

        {/* PAGE TRANSITION OVERLAY — grand texte qui traverse pendant le fetch async */}
        <div id="page-transition" style="position:fixed; inset:0; z-index:99999; background:#03045e; display:flex; align-items:center; justify-content:center; overflow:hidden; transition:opacity 0.3s ease; pointer-events:none; opacity:0;">
          <span id="page-transition-text" class="pt-text"></span>
        </div>

        {/* BACK TO TOP */}
        <button id="back-to-top" onclick="window.scrollTo({top:0,behavior:'smooth'})" aria-label="Retour en haut" style="position:fixed; bottom:6rem; right:1.5rem; z-index:9998; width:44px; height:44px; border-radius:50%; background:rgba(14,165,233,0.9); color:white; border:none; cursor:pointer; display:none; align-items:center; justify-content:center; font-size:1rem; box-shadow:0 4px 20px rgba(14,165,233,0.35); transition:all 0.3s ease; backdrop-filter:blur(10px);">
          <i class="fas fa-chevron-up"></i>
        </button>

        {/* HEADER — floating pill */}
        <header class="fixed w-full z-50 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4">
          <div id="header-pill" class="max-w-7xl mx-auto flex justify-between items-center glass rounded-full px-4 sm:px-6 py-2.5 sm:py-3 shadow-lg">

            {/* Logo */}
            <a href="/" class="font-extrabold tracking-tight flex items-center shrink-0 gap-2">
              <img src="/logo-site.webp" width="192" height="192" alt="MAASGA Logo" class="h-9 sm:h-10 w-auto rounded-lg" />
              <span class="hidden sm:inline text-sm font-bold uppercase tracking-widest" style="color:#03045e;">MAASGA</span>
            </a>

            {/* Nav Desktop — visible xl+ */}
            <nav class="hidden xl:flex items-center gap-0.5 whitespace-nowrap" aria-label="Navigation principale">
              {[
                { href: "/", icon: "fa-house", label: "Accueil", key: "home" },
                { href: "/simulateur", icon: "fa-calculator", label: "Simulateur", key: "simulateur" },
                { href: "/catalogue", icon: "fa-snowflake", label: "Catalogue", key: "catalogue" },
                { href: "/contrat-maintenance", icon: "fa-screwdriver-wrench", label: "Maintenance", key: "maintenance" },
                { href: "/rendez-vous", icon: "fa-calendar-check", label: "Rendez-vous", key: "rdv" },
                { href: "/avis", icon: "fa-star", label: "Avis", key: "avis" },
                { href: "/a-propos", icon: "fa-circle-info", label: "À propos", key: "apropos" },
                { href: "/contact", icon: "fa-envelope", label: "Contact", key: "contact" },
              ].map(n => (
                <a href={n.href} class={`nav-link flex items-center gap-1.5 font-semibold px-2.5 py-2 rounded-lg transition-all text-xs uppercase tracking-wide ${activePage===n.key ? 'active' : ''}`} {...(activePage===n.key ? {'aria-current': 'page'} : {})}>
                  <NavIcon icon={n.icon} size={14} color={activePage===n.key ? '#0077b6' : '#94a3b8'} />
                  {n.label}
                </a>
              ))}
            </nav>

            {/* Nav Tablet — visible lg only (condensed) */}
            <nav class="hidden lg:flex xl:hidden items-center gap-0.5 whitespace-nowrap" aria-label="Navigation principale">
              {[
                { href: "/", icon: "fa-house", label: "Accueil", key: "home" },
                { href: "/catalogue", icon: "fa-snowflake", label: "Catalogue", key: "catalogue" },
                { href: "/contrat-maintenance", icon: "fa-screwdriver-wrench", label: "Maintenance", key: "maintenance" },
                { href: "/rendez-vous", icon: "fa-calendar-check", label: "Rendez-vous", key: "rdv" },
                { href: "/avis", icon: "fa-star", label: "Avis", key: "avis" },
                { href: "/contact", icon: "fa-envelope", label: "Contact", key: "contact" },
              ].map(n => (
                <a href={n.href} class={`nav-link flex items-center gap-1.5 font-semibold px-2.5 py-2 rounded-lg transition-all text-xs uppercase tracking-wide ${activePage===n.key ? 'active' : ''}`} {...(activePage===n.key ? {'aria-current': 'page'} : {})}>
                  <NavIcon icon={n.icon} size={14} color={activePage===n.key ? '#0077b6' : '#94a3b8'} />
                  {n.label}
                </a>
              ))}
              {/* Plus dropdown */}
              <div class="relative" id="nav-more-wrapper">
                <button onclick="document.getElementById('nav-more-dropdown').classList.toggle('hidden')" class={`nav-link flex items-center gap-1.5 font-semibold px-2.5 py-2 rounded-lg transition-all text-xs uppercase tracking-wide ${['apropos','client'].includes(activePage) ? 'active' : ''}`} aria-label="Plus de pages" aria-expanded="false" aria-controls="nav-more-dropdown">
                  <i class="fas fa-ellipsis-h text-[10px]" style="color:#94a3b8;"></i>
                  Plus
                </button>
                <div id="nav-more-dropdown" class="hidden absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl py-2" style="background:rgba(255,255,255,0.98); backdrop-filter:blur(20px); border:1px solid rgba(0,119,182,0.12); z-index:60;">
                  {[
                    { href: "/a-propos", icon: "fa-circle-info", label: "À propos", key: "apropos" },
                    { href: "/espace-client", icon: "fa-user", label: "Espace client", key: "client" },
                  ].map(n => (
                    <a href={n.href} class={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all hover:bg-blue-50 ${activePage===n.key ? 'font-bold' : ''}`} style={activePage===n.key ? 'color:#0077b6' : 'color:#334155'}>
                      <NavIcon icon={n.icon} size={14} color="#0077b6" />
                      {n.label}
                    </a>
                  ))}
                </div>
              </div>
            </nav>

            {/* Indicateur de page — visible uniquement quand la nav desktop/tablette est masquée (<1024px) */}
            {activePage && PAGE_LABELS[activePage] && (
              <span class="eyebrow lg:hidden">{PAGE_LABELS[activePage]}</span>
            )}

            {/* Actions */}
            <div class="flex items-center gap-1.5 sm:gap-2">
              <a href="/espace-client" id="user-nav-btn" class="hidden lg:flex items-center justify-center w-9 h-9 rounded-full transition-all hover:bg-blue-50" style="color:#0077b6;" title="Espace client" aria-label="Espace client">
                <i class="fas fa-user text-sm"></i>
              </a>
              <button onclick="var m=document.getElementById('mobile-menu');var b=this.querySelector('i');if(m.classList.contains('open')){m.classList.remove('open');b.className='fas fa-bars text-lg';}else{m.classList.add('open');b.className='fas fa-times text-lg';}this.setAttribute('aria-expanded',m.classList.contains('open'))" class="lg:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-blue-50 transition-colors" style="color:#475569;" aria-label="Menu de navigation" aria-expanded="false" aria-controls="mobile-menu">
                <i class="fas fa-bars text-lg"></i>
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          <div id="mobile-menu" class="mobile-menu lg:hidden max-w-7xl mx-auto mt-2 rounded-2xl shadow-xl overflow-hidden" style="background:rgba(248,251,255,0.98); backdrop-filter:blur(20px); border:1px solid rgba(0,119,182,0.12);">
            {/* Quick contact bar */}
            <div class="flex items-center justify-end px-5 py-3" style="background:rgba(0,119,182,0.04); border-bottom:1px solid rgba(0,119,182,0.08);">
              <a href="/espace-client" class="flex items-center gap-2 text-xs font-semibold" style="color:#0077b6;">
                <i class="fas fa-user"></i>
                <span>Espace client</span>
              </a>
            </div>
            {/* Navigation grid */}
            <div class="grid grid-cols-2 gap-1 p-3">
              {[
                { href: "/", icon: "fa-house", label: "Accueil", key: "home" },
                { href: "/simulateur", icon: "fa-calculator", label: "Simulateur BTU", key: "simulateur" },
                { href: "/catalogue", icon: "fa-snowflake", label: "Catalogue", key: "catalogue" },
                { href: "/contrat-maintenance", icon: "fa-screwdriver-wrench", label: "Maintenance", key: "maintenance" },
                { href: "/rendez-vous", icon: "fa-calendar-check", label: "Rendez-vous", key: "rdv" },
                { href: "/avis", icon: "fa-star", label: "Avis clients", key: "avis" },
                { href: "/contact", icon: "fa-envelope", label: "Contact", key: "contact" },
                { href: "/a-propos", icon: "fa-circle-info", label: "À propos", key: "apropos" },
              ].map(n => (
                <a href={n.href} class={`flex items-center gap-2.5 py-3 px-3.5 rounded-xl text-sm font-semibold transition-all ${activePage===n.key ? 'mobile-nav-active' : 'hover:bg-blue-50'}`} style={activePage===n.key ? 'background:rgba(0,119,182,0.08); color:#0077b6;' : ''} {...(activePage===n.key ? {'aria-current': 'page'} : {})}>
                  <NavIcon icon={n.icon} size={16} color={activePage===n.key ? '#0077b6' : '#94a3b8'} />
                  <span>{n.label}</span>
                </a>
              ))}
            </div>
            {/* CTA */}
            <div class="px-3 pb-3">
              <a href="/rendez-vous" class="flex items-center justify-center gap-2 btn-primary text-white text-sm font-bold px-4 py-3 rounded-xl w-full">
                <i class="fas fa-calendar-plus"></i>Prendre rendez-vous
              </a>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main id="main-content" role="main" class="pt-20 pb-20 md:pb-0">
          {children}
        </main>

        {/* CGU MODAL */}
        <CGUModal />

        {/* FOOTER */}
        <footer style="background:linear-gradient(135deg,#ffffff 0%,#e0f2fe 50%,#bae6fd 100%); margin-top:5rem; position:relative; overflow:hidden;">
          <div style="position:absolute;top:-60px;right:-60px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.08);pointer-events:none;"></div>
          <div style="position:absolute;bottom:-40px;left:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.06);pointer-events:none;"></div>
          <div class="cyan-line"></div>
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-10">

              <div class="md:col-span-2">
                <div class="flex items-center space-x-3 mb-5">
                  <div class="w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-white/20">
                    <img src="/logo-site.webp" width="192" height="192" alt="MAASGA Logo" class="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div>
                    <div class="font-bold text-white text-xl tracking-wide">MAASGA</div>
                    <div class="text-xs font-medium" style="color:#1e3a5f;">Froid &amp; Climatisation</div>
                  </div>
                </div>
                <p class="text-sm leading-relaxed max-w-sm" style="color:#1e3a5f;">
                  Spécialiste en vente, installation et maintenance de systèmes de climatisation à Ouagadougou et dans tout le Burkina Faso.
                </p>
                <div class="mt-5 space-y-3">
                  <div class="text-sm" style="color:#1e3a5f;">
                    <div class="font-semibold mb-3" style="color:#03045e;">Directeurs</div>
                    <div class="flex items-center space-x-2 mb-2">
                      <div style="width:22px;height:22px;border-radius:50%;background:rgba(0,119,182,0.18);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <NavIcon icon="fa-user" size={11} color="#0077b6" />
                      </div>
                      <span>Malick KOMPAORE - Directeur Commercial</span>
                    </div>
                    <div class="flex items-center space-x-2 mb-3">
                      <div style="width:22px;height:22px;border-radius:50%;background:rgba(0,119,182,0.18);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <NavIcon icon="fa-phone" size={11} color="#0077b6" />
                      </div>
                      <a href="tel:+22607494444" class="hover:text-white transition">+226 07 49 44 44</a>
                    </div>
                    <div class="flex items-center space-x-2 mb-2">
                      <div style="width:22px;height:22px;border-radius:50%;background:rgba(124,58,237,0.18);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <NavIcon icon="fa-user" size={11} color="#7c3aed" />
                      </div>
                      <span>Sherif SAWADOGO - Directeur Technique</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <div style="width:22px;height:22px;border-radius:50%;background:rgba(124,58,237,0.18);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <NavIcon icon="fa-phone" size={11} color="#7c3aed" />
                      </div>
                      <a href="tel:+22655996418" class="hover:text-white transition">+226 55 99 64 18</a>
                    </div>
                  </div>
                  <div class="pt-3 border-t flex items-center gap-4" style="border-color:rgba(0,0,0,0.1);">
                    <a href="https://wa.me/22655996418" target="_blank" rel="noopener noreferrer" class="flex items-center space-x-2 text-sm font-semibold transition-all hover:scale-105" style="color:#16a34a;">
                      <i class="fab fa-whatsapp text-xl" style="color:#25d366;"></i><span>WhatsApp</span>
                    </a>
                    <a href="mailto:maasgabf@gmail.com" class="flex items-center space-x-2 text-sm font-semibold transition-all hover:scale-105" style="color:#0077b6;">
                      <div style="width:22px;height:22px;border-radius:50%;background:rgba(0,119,182,0.15);display:flex;align-items:center;justify-content:center;">
                        <i class="fas fa-envelope text-xs" style="color:#0077b6;"></i>
                      </div><span>maasgabf@gmail.com</span>
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="font-semibold text-white mb-5 text-sm uppercase tracking-widest" style="color:#38bdf8;">Navigation</h4>
                <ul class="space-y-3 text-sm" style="color:#64748b;">
                  {["/", "/catalogue", "/contrat-maintenance", "/simulateur", "/rendez-vous", "/avis", "/a-propos", "/contact"].map((href, i) => (
                    <li><a href={href} class="hover:text-white hover:pl-1 transition-all block">
                      {["Accueil","Catalogue","Maintenance","Simulateur BTU","Prendre RDV","Avis clients","À propos","Contact"][i]}
                    </a></li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 class="font-semibold mb-5 text-sm uppercase tracking-widest" style="color:#38bdf8;">Services</h4>
                <ul class="space-y-3 text-sm" style="color:#64748b;">
                  {["Vente climatiseurs","Installation pro","Maintenance tri.","Devis gratuit","SAV réactif","Techniciens certifiés"].map(s => (
                    <li class="flex items-center space-x-2">
                      <NavIcon icon="fa-circle-check" size={13} color="#0ea5e9" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
                <div class="mt-5 p-3 rounded-xl text-xs" style="background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.12); color:#64748b;">
                  <NavIcon icon="fa-location-dot" size={13} color="#0ea5e9" class="mr-2" />
                  Ouagadougou, Secteurs 35
                  <div class="mt-1 ml-5" style="color:#475569;">Burkina Faso</div>
                </div>
              </div>
            </div>

            <div class="cyan-line mt-10 mb-6"></div>
            <div class="flex flex-col md:flex-row justify-between items-center text-xs gap-4" style="color:#475569;">
              <span>© 2026 MAASGA - Tous droits réservés</span>
              <div class="flex items-center space-x-3 text-xs">
                <button onclick="document.getElementById('cgu-modal').classList.remove('hidden')" class="hover:text-white transition">
                  <i class="fas fa-file-contract mr-1"></i>Conditions & Politique
                </button>
              </div>
              <span class="mt-2 md:mt-0">Spécialiste Froid & Climatisation · Ouagadougou · Burkina Faso</span>
            </div>
          </div>
        </footer>

        {/* Loader hide + Scroll Reveal + Scroll Progress + Back-to-top + Counter animation */}
        <script dangerouslySetInnerHTML={{ __html: `window.__MAASGA_ROUTE_LABELS__ = ${JSON.stringify(ROUTE_LABELS)};` }} />
        <script src={asset("/static/js/site.js")} defer></script>

        {/* ─── MOTEUR D'ANIMATION GSAP DÉCLARATIF (perf-safe) ───────────────
             Piloté par attributs data-* sur n'importe quelle page :
               data-reveal    → apparition au scroll
               data-stagger   → enfants directs révélés en cascade
               data-parallax  → parallax léger (valeur = intensité px, borné ±60)
               .magnetic      → CTA magnétique (desktop pointer:fine uniquement)
             FALLBACK : le contenu est visible par défaut ; l'état caché (opacity:0)
             n'existe que sous html.gsap-ready, posé seulement quand GSAP répond.
             Si GSAP absent/lent ou reduced-motion → tout reste visible. */}
        

        {/* ASYNC PAGE TRANSITIONS — fetch + swap de <main>, overlay texte qui glisse */}
        

        



        {/* BARRE D'ACTIONS MOBILE — les 4 actions qui convertissent, toujours à portée de pouce (< md) */}
        <nav class="mobile-action-bar md:hidden" aria-label="Actions rapides">
          <a href="tel:+22655996418" class="mab-item">
            <i class="fas fa-phone" aria-hidden="true"></i><span>Appeler</span>
          </a>
          <button type="button" onclick="toggleWaPanel()" class="mab-item" aria-controls="wa-panel">
            <i class="fab fa-whatsapp" aria-hidden="true"></i><span>WhatsApp</span>
          </button>
          <a href="/simulateur" class={`mab-item ${activePage === 'simulateur' ? 'is-active' : ''}`} {...(activePage === 'simulateur' ? { 'aria-current': 'page' } : {})}>
            <i class="fas fa-calculator" aria-hidden="true"></i><span>Simulateur</span>
          </a>
          <a href="/rendez-vous" class="mab-item mab-primary" {...(activePage === 'rdv' ? { 'aria-current': 'page' } : {})}>
            <i class="fas fa-calendar-check" aria-hidden="true"></i><span>Rendez-vous</span>
          </a>
        </nav>

        {/* WhatsApp Pre-Chat Widget */}
        <div id="wa-widget" style="position:fixed; bottom:1.5rem; left:1.5rem; z-index:9999;">

          {/* Panel */}
          <div id="wa-panel" style="display:none; position:absolute; bottom:72px; left:0; width:300px; border-radius:18px; overflow:hidden; box-shadow:0 24px 64px rgba(0,0,0,0.45); transform-origin:bottom left; animation:waPop 0.22s cubic-bezier(.34,1.56,.64,1) both;">
            {/* Header WhatsApp */}
            <div style="background:#075E54; padding:14px 14px 20px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:44px; height:44px; border-radius:50%; background:#128C7E; display:flex; align-items:center; justify-content:center; flex-shrink:0; border:2px solid rgba(255,255,255,0.2);">
                  <i class="fab fa-whatsapp" style="color:white; font-size:1.5rem;"></i>
                </div>
                <div style="flex:1;">
                  <div style="color:white; font-weight:700; font-size:0.9rem; line-height:1.2;">MAASGA Support</div>
                  <div style="color:rgba(255,255,255,0.75); font-size:0.72rem; margin-top:2px;">🟢 En ligne · Répond rapidement</div>
                </div>
                <button onclick="closeWaPanel()" style="color:rgba(255,255,255,0.65); background:none; border:none; cursor:pointer; font-size:1.15rem; padding:4px; line-height:1; border-radius:50%; transition:all 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='none'">✕</button>
              </div>
            </div>

            {/* Chat area */}
            <div style="background:#e5ddd5; padding:14px 12px 16px;">
              {/* Message bubble */}
              <div style="display:flex; gap:6px; margin-bottom:14px;">
                <div style="background:white; border-radius:0 10px 10px 10px; padding:10px 12px; box-shadow:0 1px 2px rgba(0,0,0,0.12); max-width:85%;">
                  <p style="color:#111; font-size:0.83rem; line-height:1.5; margin:0 0 4px;">Bonjour 👋 Comment puis-je vous aider ?</p>
                  <span style="color:#888; font-size:0.68rem; display:block; text-align:right;">MAASGA Climatisation</span>
                </div>
              </div>

              {/* Quick replies */}
              <div style="display:flex; flex-direction:column; gap:7px;">
                {[
                  { icon: "🔧", label: "Demander un devis", msg: "Bonjour MAASGA, je souhaite un devis pour l'installation ou la maintenance d'un climatiseur." },
                  { icon: "📅", label: "Prendre un rendez-vous", href: "/rendez-vous" },
                  { icon: "💰", label: "Connaître les tarifs", msg: "Bonjour MAASGA, quels sont vos tarifs pour l'installation et la maintenance de climatiseurs ?" },
                  { icon: "🌡️", label: "Urgence — panne clim", msg: "Bonjour MAASGA, j'ai une urgence : mon climatiseur est en panne, pouvez-vous intervenir rapidement ?" },
                  { icon: "📦", label: "Infos sur les produits", msg: "Bonjour MAASGA, je voudrais des informations sur vos modèles de climatiseurs disponibles." },
                ].map(opt => (
                  opt.href
                    ? <a href={opt.href}
                        style="display:flex; align-items:center; gap:8px; background:white; border-radius:20px; padding:8px 14px; font-size:0.8rem; font-weight:600; color:#075E54; text-decoration:none; box-shadow:0 1px 3px rgba(0,0,0,0.1); transition:all 0.18s; border:none; cursor:pointer;"
                        onmouseover="this.style.background='#128C7E'; this.style.color='white';" onmouseout="this.style.background='white'; this.style.color='#075E54';">
                        <span>{opt.icon}</span><span>{opt.label}</span>
                        <i class="fas fa-arrow-right" style="margin-left:auto; font-size:0.65rem; opacity:0.6;"></i>
                      </a>
                    : <button
                        onclick={`openWa(${JSON.stringify(opt.msg)})`}
                        style="display:flex; align-items:center; gap:8px; background:white; border-radius:20px; padding:8px 14px; font-size:0.8rem; font-weight:600; color:#075E54; text-align:left; box-shadow:0 1px 3px rgba(0,0,0,0.1); transition:all 0.18s; border:none; cursor:pointer; width:100%;"
                        onmouseover="this.style.background='#128C7E'; this.style.color='white';" onmouseout="this.style.background='white'; this.style.color='#075E54';">
                        <span>{opt.icon}</span><span>{opt.label}</span>
                        <i class="fab fa-whatsapp" style="margin-left:auto; font-size:0.85rem; opacity:0.7;"></i>
                      </button>
                ))}
              </div>

              <p style="text-align:center; font-size:0.65rem; color:#666; margin-top:12px; margin-bottom:0;">Propulsé par WhatsApp · Réponse en &lt; 30 min</p>
            </div>
          </div>

          {/* Main button */}
          <button onclick="toggleWaPanel()" id="wa-btn" class="whatsapp-float" aria-label="Discuter sur WhatsApp" style="border:none; cursor:pointer; position:relative;">
            <i id="wa-icon-open" class="fab fa-whatsapp" style="transition:all 0.2s;"></i>
            <i id="wa-icon-close" class="fas fa-times" style="display:none; transition:all 0.2s;"></i>
            <span id="wa-notif-dot" style="position:absolute; top:3px; right:3px; width:11px; height:11px; background:#ff3b30; border-radius:50%; border:2px solid white; animation:waDot 1.8s ease-in-out infinite;"></span>
          </button>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes waPop { from { opacity:0; transform:scale(0.85) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
          @keyframes waDot { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.4); opacity:0.6; } }
          @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
          #back-to-top:hover { transform:scale(1.1) translateY(-2px); box-shadow:0 8px 30px rgba(14,165,233,0.5); }
        ` }} />

        

        {/* Cookie Consent Banner */}
        <div id="cookie-banner" style="display:none; position:fixed; bottom:0; left:0; right:0; z-index:99998; background:rgba(11,17,32,0.97); backdrop-filter:blur(12px); border-top:1px solid rgba(56,189,248,0.2); padding:16px 24px; animation:slideUp 0.3s ease-out;">
          <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div class="flex items-center gap-2 text-sm" style="color:#e2e8f0; flex:1;">
              <i class="fas fa-cookie-bite" style="color:#f59e0b; font-size:1.1rem;"></i>
              <span>Ce site utilise des cookies pour améliorer votre expérience et analyser le trafic via Google Analytics.
                <button onclick="document.getElementById('cgu-modal').classList.remove('hidden')" class="underline hover:no-underline" style="color:#38bdf8;">En savoir plus</button>
              </span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button onclick="handleCookieConsent(false)" class="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-gray-700" style="background:rgba(255,255,255,0.1); color:#94a3b8; border:1px solid rgba(255,255,255,0.15);">
                Refuser
              </button>
              <button onclick="handleCookieConsent(true)" class="px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90" style="background:linear-gradient(135deg,#0ea5e9,#3b82f6); color:white; border:none; box-shadow:0 2px 8px rgba(14,165,233,0.3);">
                Accepter
              </button>
            </div>
          </div>
        </div>
        
        <style dangerouslySetInnerHTML={{ __html: '@keyframes slideUp { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }' }} />

        {/* Toast Notification System */}
        <div id="toast-container" class="fixed top-4 right-4 z-[99999] flex flex-col gap-3 pointer-events-none" style="max-width:380px;"></div>
        

        {/* ─── Lenis smooth scroll (se synchronise au ticker GSAP existant) ─── */}
        

      </body>
    </html>
  )
}



