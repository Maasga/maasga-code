import { CGUModal, initCGUModal } from './CGUModal'

export const AnimatedIcon = ({ src, trigger = "hover", size = 20, colors = "primary:#0077b6,secondary:#caf0f8", class: className = "" }: { src: string, trigger?: string, size?: number, colors?: string, class?: string }) => {
  return (
    <lord-icon
      src={src}
      trigger={trigger}
      colors={colors}
      class={className}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  )
}

export const Layout = ({ children, title = "MAASGA - Expert Froid & Climatisation Burkina Faso", activePage = "", description = "MAASGA - Spécialiste vente, installation et maintenance de climatiseurs à Ouagadougou, Burkina Faso. Devis gratuit, techniciens certifiés.", canonicalPath = "", jsonLd }: {
  children: any
  title?: string
  activePage?: string
  description?: string
  canonicalPath?: string
  jsonLd?: string
}) => {
  // SITE_URL centralisé — modifier ici si le domaine change
  const siteUrl = typeof globalThis !== 'undefined' && (globalThis as any).MAASGA_SITE_URL
    ? (globalThis as any).MAASGA_SITE_URL
    : 'https://maasga-website.pages.dev'
  const canonical = canonicalPath ? `${siteUrl}${canonicalPath}` : ''
  return (
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={description} />
        <meta name="keywords" content="climatisation Ouagadougou, installation climatiseur Burkina Faso, technicien clim Ouaga, MAASGA, vente climatiseur Ouaga" />
        {canonical && <link rel="canonical" href={canonical} />}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${siteUrl}/og-image.png`} />
        {canonical && <meta property="og:url" content={canonical} />}
        <meta property="og:locale" content="fr_BF" />
        <meta property="og:site_name" content="MAASGA Climatisation" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${siteUrl}/og-image.png`} />
        <meta name="theme-color" content="#e8f4ff" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />
        <noscript><link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" /></noscript>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js" defer crossorigin="anonymous"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js" defer crossorigin="anonymous"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/SplitText.min.js" defer crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js" defer crossorigin="anonymous"></script>
        <link rel="stylesheet" href="/static/tailwind.css" />
        <link rel="stylesheet" href="/static/style.css" />
        <title>{title}</title>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" media="print" onload="this.media='all'" />
        <noscript><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" /></noscript>
        <link href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/duotone/style.css" rel="stylesheet" media="print" onload="this.media='all'" />
        <link href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/fill/style.css" rel="stylesheet" media="print" onload="this.media='all'" />
        <script src="https://cdn.lordicon.com/lordicon.js" defer></script>

        {/* Global Agentation System — Control via ?agentation=1 */}
        <script type="importmap">{`{
          "imports": {
            "react": "https://esm.sh/react@18.3.1",
            "react-dom/client": "https://esm.sh/react-dom@18.3.1/client?external=react"
          }
        }`}</script>
        <script type="module" dangerouslySetInnerHTML={{ __html: `
          (async function() {
            try {
              var qs = new URLSearchParams(window.location.search);
              if (qs.get('agentation') === '1') localStorage.setItem('maasga_agentation', '1');
              if (qs.get('agentation') === '0') localStorage.removeItem('maasga_agentation');
              if (localStorage.getItem('maasga_agentation') !== '1') return;

              const [reactMod, domMod, agentMod] = await Promise.all([
                import('react'),
                import('react-dom/client'),
                import('https://esm.sh/agentation@3.0.2?external=react,react-dom/client')
              ]);

              const { Agentation } = agentMod;
              function mount() {
                if (document.getElementById('agentation-root')) return;
                const host = document.createElement('div');
                host.id = 'agentation-root';
                document.body.appendChild(host);
                domMod.createRoot(host).render(reactMod.createElement(Agentation, {}));
              }
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', mount, { once: true });
              } else { mount(); }
              console.info('[Agentation] activé (public)');
            } catch (e) {
              console.error('[Agentation] échec:', e);
            }
          })();
        ` }} />

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
      <body class="min-h-screen pb-16 md:pb-0" style="background-color:#f8fbff; color:#03045e;" onload="window.initCGUModal?.()">

        {/* js-ready : pose immédiatement la classe pour activer l'état initial caché
            des reveals. Si JS est désactivé, la classe n'est jamais posée → contenu visible. */}
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('js-ready');` }} />

        {/* PAGE LOADER — affiché uniquement au premier chargement de la session */}
        <div id="page-loader" style="position:fixed;inset:0;z-index:999999;background:#ffffff;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:opacity 0.3s ease,visibility 0.3s ease;">
          <div style="position:relative;margin-bottom:1.5rem;">
            <div style="width:72px;height:72px;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,119,182,0.2);animation:loader-pulse 1.5s ease-in-out infinite;">
              <img src="/logo-site.png" alt="MAASGA" style="width:100%;height:100%;object-fit:cover;" />
            </div>
            <div style="position:absolute;top:-8px;right:-8px;font-size:1.4rem;animation:loader-spin 2s linear infinite;color:#0077b6;">❄</div>
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
        `}</style>

        {/* Skip to content — accessibility */}
        <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[99999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-white" style="background:#0ea5e9;">Aller au contenu principal</a>

        {/* PAGE TRANSITION OVERLAY */}
        <div id="page-transition" style="position:fixed; inset:0; z-index:99999; background:#f8fbff; display:flex; align-items:center; justify-content:center; transition:opacity 0.3s ease; pointer-events:none; opacity:0;">
          <i class="fas fa-snowflake text-3xl" style="color:#38bdf8; animation:spin 1s linear infinite;"></i>
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
              <img src="/logo-site.png" alt="MAASGA Logo" class="h-9 sm:h-10 w-auto rounded-lg" />
              <span class="hidden sm:inline text-sm font-bold uppercase tracking-widest" style="color:#03045e;">MAASGA</span>
            </a>

            {/* Nav Desktop — visible xl+ */}
            <nav class="hidden xl:flex items-center gap-0.5 whitespace-nowrap" aria-label="Navigation principale">
              {[
                { href: "/", icon: "https://cdn.lordicon.com/gmzxduhd.json", label: "Accueil", key: "home" },
                { href: "/simulateur", icon: "https://cdn.lordicon.com/qnpnzjqz.json", label: "Simulateur", key: "simulateur" },
                { href: "/catalogue", icon: "https://cdn.lordicon.com/msetzzbt.json", label: "Catalogue", key: "catalogue" },
                { href: "/contrat-maintenance", icon: "https://cdn.lordicon.com/becezzra.json", label: "Maintenance", key: "maintenance" },
                { href: "/rendez-vous", icon: "https://cdn.lordicon.com/wmluxarr.json", label: "Rendez-vous", key: "rdv" },
                { href: "/avis", icon: "https://cdn.lordicon.com/hbwbeoul.json", label: "Avis", key: "avis" },
                { href: "/a-propos", icon: "https://cdn.lordicon.com/jyvscvfr.json", label: "À propos", key: "apropos" },
                { href: "/contact", icon: "https://cdn.lordicon.com/diuoeasy.json", label: "Contact", key: "contact" },
              ].map(n => (
                <a href={n.href} class={`nav-link flex items-center gap-1.5 font-semibold px-2.5 py-2 rounded-lg transition-all text-xs uppercase tracking-wide ${activePage===n.key ? 'active' : ''}`} {...(activePage===n.key ? {'aria-current': 'page'} : {})}>
                  <AnimatedIcon src={n.icon} size={18} colors={activePage===n.key ? 'primary:#0077b6,secondary:#00b4d8' : 'primary:#94a3b8,secondary:#cbd5e1'} />
                  {n.label}
                </a>
              ))}
            </nav>

            {/* Nav Tablet — visible lg only (condensed) */}
            <nav class="hidden lg:flex xl:hidden items-center gap-0.5 whitespace-nowrap" aria-label="Navigation principale">
              {[
                { href: "/", icon: "https://cdn.lordicon.com/gmzxduhd.json", label: "Accueil", key: "home" },
                { href: "/catalogue", icon: "https://cdn.lordicon.com/msetzzbt.json", label: "Catalogue", key: "catalogue" },
                { href: "/contrat-maintenance", icon: "https://cdn.lordicon.com/becezzra.json", label: "Maintenance", key: "maintenance" },
                { href: "/rendez-vous", icon: "https://cdn.lordicon.com/wmluxarr.json", label: "Rendez-vous", key: "rdv" },
                { href: "/avis", icon: "https://cdn.lordicon.com/hbwbeoul.json", label: "Avis", key: "avis" },
                { href: "/contact", icon: "https://cdn.lordicon.com/diuoeasy.json", label: "Contact", key: "contact" },
              ].map(n => (
                <a href={n.href} class={`nav-link flex items-center gap-1.5 font-semibold px-2.5 py-2 rounded-lg transition-all text-xs uppercase tracking-wide ${activePage===n.key ? 'active' : ''}`} {...(activePage===n.key ? {'aria-current': 'page'} : {})}>
                  <AnimatedIcon src={n.icon} size={18} colors={activePage===n.key ? 'primary:#0077b6,secondary:#00b4d8' : 'primary:#94a3b8,secondary:#cbd5e1'} />
                  {n.label}
                </a>
              ))}
              {/* Plus dropdown */}
              <div class="relative" id="nav-more-wrapper">
                <button onclick="document.getElementById('nav-more-dropdown').classList.toggle('hidden')" class="nav-link flex items-center gap-1.5 font-semibold px-2.5 py-2 rounded-lg transition-all text-xs uppercase tracking-wide" aria-label="Plus de pages" aria-expanded="false" aria-controls="nav-more-dropdown">
                  <i class="fas fa-ellipsis-h text-[10px]" style="color:#94a3b8;"></i>
                  Plus
                </button>
                <div id="nav-more-dropdown" class="hidden absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl py-2" style="background:rgba(255,255,255,0.98); backdrop-filter:blur(20px); border:1px solid rgba(0,119,182,0.12); z-index:60;">
                  {[
                    { href: "/a-propos", icon: "https://cdn.lordicon.com/jyvscvfr.json", label: "À propos", key: "apropos" },
                    { href: "/espace-client", icon: "https://cdn.lordicon.com/kthelypq.json", label: "Espace client", key: "client" },
                  ].map(n => (
                    <a href={n.href} class={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all hover:bg-blue-50 ${activePage===n.key ? 'font-bold' : ''}`} style={activePage===n.key ? 'color:#0077b6' : 'color:#334155'}>
                      <AnimatedIcon src={n.icon} size={18} colors="primary:#0077b6,secondary:#00b4d8" />
                      {n.label}
                    </a>
                  ))}
                </div>
              </div>
            </nav>

            {/* Actions */}
            <div class="flex items-center gap-1.5 sm:gap-2">
              <a href="/espace-client" id="user-nav-btn" class="hidden lg:flex items-center justify-center w-9 h-9 rounded-full transition-all hover:bg-blue-50" style="color:#0077b6;" title="Espace client" aria-label="Espace client">
                <i class="fas fa-user text-sm"></i>
              </a>
              <a href="/rendez-vous" class="hidden sm:flex items-center gap-1.5 btn-primary text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 rounded-full shadow-md">
                <i class="fas fa-calendar-plus text-xs"></i>
                <span class="hidden md:inline">Rendez-vous</span>
                <span class="md:hidden">RDV</span>
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
                { href: "/", icon: "https://cdn.lordicon.com/gmzxduhd.json", label: "Accueil", key: "home" },
                { href: "/simulateur", icon: "https://cdn.lordicon.com/qnpnzjqz.json", label: "Simulateur BTU", key: "simulateur" },
                { href: "/catalogue", icon: "https://cdn.lordicon.com/msetzzbt.json", label: "Catalogue", key: "catalogue" },
                { href: "/contrat-maintenance", icon: "https://cdn.lordicon.com/becezzra.json", label: "Maintenance", key: "maintenance" },
                { href: "/rendez-vous", icon: "https://cdn.lordicon.com/wmluxarr.json", label: "Rendez-vous", key: "rdv" },
                { href: "/avis", icon: "https://cdn.lordicon.com/hbwbeoul.json", label: "Avis clients", key: "avis" },
                { href: "/contact", icon: "https://cdn.lordicon.com/diuoeasy.json", label: "Contact", key: "contact" },
                { href: "/a-propos", icon: "https://cdn.lordicon.com/jyvscvfr.json", label: "À propos", key: "apropos" },
              ].map(n => (
                <a href={n.href} class={`flex items-center gap-2.5 py-3 px-3.5 rounded-xl text-sm font-semibold transition-all ${activePage===n.key ? 'mobile-nav-active' : 'hover:bg-blue-50'}`} style={activePage===n.key ? 'background:rgba(0,119,182,0.08); color:#0077b6;' : ''} {...(activePage===n.key ? {'aria-current': 'page'} : {})}>
                  <AnimatedIcon src={n.icon} size={20} colors={activePage===n.key ? 'primary:#0077b6,secondary:#00b4d8' : 'primary:#94a3b8,secondary:#cbd5e1'} />
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
        <main id="main-content" role="main" class="pt-20">
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
                    <img src="/logo-site.png" alt="MAASGA Logo" class="w-full h-full object-cover" loading="lazy" />
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
                        <AnimatedIcon src="https://cdn.lordicon.com/kthelypq.json" size={12} trigger="hover" colors="primary:#0077b6,secondary:#caf0f8" />
                      </div>
                      <span>Malick KOMPAORE - Directeur Commercial</span>
                    </div>
                    <div class="flex items-center space-x-2 mb-3">
                      <div style="width:22px;height:22px;border-radius:50%;background:rgba(0,119,182,0.18);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <AnimatedIcon src="https://cdn.lordicon.com/tftunupn.json" size={12} trigger="hover" colors="primary:#0077b6,secondary:#caf0f8" />
                      </div>
                      <a href="tel:+22607494444" class="hover:text-white transition">+226 07 49 44 44</a>
                    </div>
                    <div class="flex items-center space-x-2 mb-2">
                      <div style="width:22px;height:22px;border-radius:50%;background:rgba(124,58,237,0.18);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <AnimatedIcon src="https://cdn.lordicon.com/kthelypq.json" size={12} trigger="hover" colors="primary:#7c3aed,secondary:#caf0f8" />
                      </div>
                      <span>Sherif SAWADOGO - Directeur Technique</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <div style="width:22px;height:22px;border-radius:50%;background:rgba(124,58,237,0.18);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <AnimatedIcon src="https://cdn.lordicon.com/tftunupn.json" size={12} trigger="hover" colors="primary:#7c3aed,secondary:#caf0f8" />
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
                      <AnimatedIcon src="https://cdn.lordicon.com/yqzmiobz.json" size={14} trigger="hover" colors="primary:#0ea5e9,secondary:#caf0f8" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
                <div class="mt-5 p-3 rounded-xl text-xs" style="background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.12); color:#64748b;">
                  <AnimatedIcon src="https://cdn.lordicon.com/zzaxpnyy.json" size={14} trigger="hover" colors="primary:#0ea5e9,secondary:#caf0f8" class="mr-2" />
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

        {/* Loader hide + Scroll Reveal + Scroll Progress + Back-to-top + Counter animation + Page transitions */}
        <script dangerouslySetInnerHTML={{ __html: `
          // Hide loader (rapide si déjà visité)
          (function() {
            function hideLoader() {
              var l = document.getElementById('page-loader');
              if (!l || l.style.display === 'none') return;
              l.style.opacity = '0';
              l.style.visibility = 'hidden';
              setTimeout(function() { l.style.display = 'none'; }, 350);
            }
            // Use DOMContentLoaded instead of load — don't wait for external fonts/images
            if (document.readyState !== 'loading') { setTimeout(hideLoader, 50); }
            else { document.addEventListener('DOMContentLoaded', function() { setTimeout(hideLoader, 50); }); }
          })();

          document.addEventListener('DOMContentLoaded', function() {
            // Close "Plus" dropdown on outside click
            document.addEventListener('click', function(e) {
              var dd = document.getElementById('nav-more-dropdown');
              var wr = document.getElementById('nav-more-wrapper');
              if (dd && wr && !wr.contains(e.target)) dd.classList.add('hidden');
            });
            // Close mobile menu on link click
            document.querySelectorAll('#mobile-menu a').forEach(function(a) {
              a.addEventListener('click', function() {
                var m = document.getElementById('mobile-menu');
                if (m) m.classList.remove('open');
              });
            });

            // Profile avatar: show first letter of name when logged in
            (function() {
              fetch('/api/session-check', { credentials: 'same-origin' })
                .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                .then(function(data) {
                  if (data && data.loggedIn && data.name) {
                    var btn = document.getElementById('user-nav-btn');
                    if (!btn) return;
                    var letter = data.name.trim().charAt(0).toUpperCase();
                    btn.innerHTML = '<span style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#0077b6,#0ea5e9);color:#fff;font-weight:800;font-size:0.85rem;display:flex;align-items:center;justify-content:center;pointer-events:none;">' + letter + '</span>';
                    btn.style.padding = '0';
                    btn.title = data.name;
                  }
                })
                .catch(function() {});
            })();

            // Scroll reveal (+ left/right variants) — classe legacy .visible
            var observer = new IntersectionObserver(function(entries) {
              entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                  entry.target.classList.add('visible');
                  observer.unobserve(entry.target);
                }
              });
            }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
            document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(function(el) { observer.observe(el); });

            // Moteur de révélation data-* — robuste, indépendant de GSAP.
            // Ajoute .in dès que l'élément entre à l'écran (CSS gère l'anim + cascade).
            var revealObserver = new IntersectionObserver(function(entries) {
              entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                  entry.target.classList.add('in');
                  revealObserver.unobserve(entry.target);
                }
              });
            }, { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });
            document.querySelectorAll('[data-reveal],[data-stagger],[data-hero]').forEach(function(el) { revealObserver.observe(el); });

            var backToTop = document.getElementById('back-to-top');
            var headerPill = document.getElementById('header-pill');
            window.addEventListener('scroll', function() {
              var scrollTop = window.scrollY;
              if (backToTop) backToTop.style.display = scrollTop > 400 ? 'flex' : 'none';
              if (headerPill) headerPill.classList.toggle('scrolled', scrollTop > 20);
            }, { passive: true });

            // Animated number counters
            var counterObserver = new IntersectionObserver(function(entries) {
              entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                  var el = entry.target;
                  var target = el.getAttribute('data-count');
                  var isNum = /^\\d+$/.test(target);
                  if (isNum) {
                    var end = parseInt(target);
                    var duration = 1800;
                    var start = 0;
                    var startTime = null;
                    function animate(timestamp) {
                      if (!startTime) startTime = timestamp;
                      var progress = Math.min((timestamp - startTime) / duration, 1);
                      var eased = 1 - Math.pow(1 - progress, 3);
                      el.textContent = Math.floor(eased * end) + (el.getAttribute('data-suffix') || '');
                      if (progress < 1) requestAnimationFrame(animate);
                    }
                    requestAnimationFrame(animate);
                  }
                  counterObserver.unobserve(el);
                }
              });
            }, { threshold: 0.3 });
            document.querySelectorAll('[data-count]').forEach(function(el) { counterObserver.observe(el); });
          });

          // Page transitions for internal links (rapide)
          document.addEventListener('click', function(e) {
            var link = e.target.closest('a[href]');
            if (!link) return;
            var href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('tel:') || href.startsWith('mailto:') || link.target === '_blank') return;
            e.preventDefault();
            var overlay = document.getElementById('page-transition');
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'all';
            setTimeout(function() { window.location.href = href; }, 150);
          });
        `}} />

        {/* ─── MOTEUR D'ANIMATION GSAP DÉCLARATIF (perf-safe) ───────────────
             Piloté par attributs data-* sur n'importe quelle page :
               data-reveal    → apparition au scroll
               data-stagger   → enfants directs révélés en cascade
               data-parallax  → parallax léger (valeur = intensité px, borné ±60)
               .magnetic      → CTA magnétique (desktop pointer:fine uniquement)
             FALLBACK : le contenu est visible par défaut ; l'état caché (opacity:0)
             n'existe que sous html.gsap-ready, posé seulement quand GSAP répond.
             Si GSAP absent/lent ou reduced-motion → tout reste visible. */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

            function initGsap() {
              if (!window.gsap || !window.ScrollTrigger) return false;
              var gsap = window.gsap;
              gsap.registerPlugin(window.ScrollTrigger);

              // Les reveals/cascades sont gérés en CSS+IntersectionObserver (robuste).
              // GSAP n'ajoute QUE des enrichissements : parallax + CTA magnétiques.
              if (reduce) return true;

              gsap.utils.toArray('[data-parallax]').forEach(function(el) {
                var amount = parseFloat(el.getAttribute('data-parallax')) || 30;
                amount = Math.max(-80, Math.min(80, amount));
                gsap.to(el, {
                  y: amount, ease: 'none',
                  scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 }
                });
              });

              if (finePointer) {
                document.querySelectorAll('.magnetic').forEach(function(btn) {
                  btn.addEventListener('mousemove', function(e) {
                    var r = btn.getBoundingClientRect();
                    var mx = e.clientX - r.left - r.width / 2;
                    var my = e.clientY - r.top - r.height / 2;
                    gsap.to(btn, { x: mx * 0.22, y: my * 0.3, duration: 0.4, ease: 'power3.out' });
                  });
                  btn.addEventListener('mouseleave', function() {
                    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
                  });
                });
              }
              return true;
            }

            // GSAP chargé en defer : on tente jusqu'à ~3s, sinon le contenu reste visible
            if (!initGsap()) {
              var tries = 0;
              var iv = setInterval(function() {
                tries++;
                if (initGsap() || tries > 60) clearInterval(iv);
              }, 50);
            }
          })();
        `}} />

        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            const hasAccepted = localStorage.getItem('maasga_cgu_accepted') === 'true'
            if (!hasAccepted) {
              setTimeout(() => {
                const modal = document.getElementById('cgu-modal')
                if (modal) modal.classList.remove('hidden')
              }, 500)
            }
            const checkbox = document.getElementById('accept-cgu')
            const acceptBtn = document.getElementById('accept-btn')
            if (checkbox && acceptBtn) {
              checkbox.addEventListener('change', () => {
                acceptBtn.disabled = !checkbox.checked
              })
            }
            window.acceptCGU = () => {
              const checkbox = document.getElementById('accept-cgu')
              if (checkbox?.checked) {
                localStorage.setItem('maasga_cgu_accepted', 'true');
                // Legacy: also keep version info in a separate key (does not bloat the check key)
                localStorage.setItem('maasga_cgu_meta', JSON.stringify({
                  timestamp: new Date().toISOString(),
                  version: '1.0'
                }))
                const modal = document.getElementById('cgu-modal')
                if (modal) modal.classList.add('hidden')
              }
            }
          })()
        `}} />

        {/* Barre mobile fixe Call/WhatsApp/RDV — visible uniquement sur mobile */}
        <div class="md:hidden fixed bottom-0 left-0 right-0 z-50 flex" style="background:rgba(11,17,32,0.97); border-top:1px solid rgba(56,189,248,0.18); padding-bottom:env(safe-area-inset-bottom);">
          <a href="tel:+22655996418" class="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70" style="color:#38bdf8;">
            <i class="fas fa-phone text-base"></i>
            <span class="text-xs font-semibold">Appeler</span>
          </a>
          <div style="width:1px; background:rgba(56,189,248,0.15);"></div>
          <a href="https://wa.me/22655996418?text=Bonjour%20MAASGA" target="_blank" rel="noopener noreferrer" class="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70" style="color:#25D366;">
            <i class="fab fa-whatsapp text-base"></i>
            <span class="text-xs font-semibold">WhatsApp</span>
          </a>
          <div style="width:1px; background:rgba(56,189,248,0.15);"></div>
          <a href="/rendez-vous" class="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70" style="color:#a78bfa;">
            <i class="fas fa-calendar-check text-base"></i>
            <span class="text-xs font-semibold">RDV</span>
          </a>
          <div style="width:1px; background:rgba(56,189,248,0.15);"></div>
          <a href="/catalogue" class="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70" style="color:#f59e0b;">
            <i class="fas fa-th-large text-base"></i>
            <span class="text-xs font-semibold">Catalogue</span>
          </a>
        </div>

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
                  { icon: "🌡️", label: "Urgence — panne clim", msg: "Bonjour MAASGA, j'ai une urgence : mon climatiseur est en panne, pouvez-vous intervenir rapidement ?" },
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

        <script dangerouslySetInnerHTML={{ __html: `
          function toggleWaPanel() {
            const panel = document.getElementById('wa-panel');
            const iconOpen = document.getElementById('wa-icon-open');
            const iconClose = document.getElementById('wa-icon-close');
            const dot = document.getElementById('wa-notif-dot');
            const isOpen = panel.style.display !== 'none';
            if (isOpen) {
              panel.style.display = 'none';
              iconOpen.style.display = '';
              iconClose.style.display = 'none';
            } else {
              panel.style.display = '';
              panel.style.animation = 'none';
              void panel.offsetWidth;
              panel.style.animation = 'waPop 0.22s cubic-bezier(.34,1.56,.64,1) both';
              iconOpen.style.display = 'none';
              iconClose.style.display = '';
              dot.style.display = 'none';
            }
          }
          function closeWaPanel() {
            document.getElementById('wa-panel').style.display = 'none';
            document.getElementById('wa-icon-open').style.display = '';
            document.getElementById('wa-icon-close').style.display = 'none';
          }
          function openWa(msg) {
            window.open('https://wa.me/22655996418?text=' + encodeURIComponent(msg), '_blank');
          }
          // Auto-open after 30s on first visit (only if user hasn't dismissed, no DNT)
          if (!sessionStorage.getItem('wa_shown') && navigator.doNotTrack !== '1') {
            setTimeout(function() {
              if (document.getElementById('wa-panel').style.display === 'none') {
                toggleWaPanel();
                sessionStorage.setItem('wa_shown', '1');
              }
            }, 30000);
          }
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
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var consent = localStorage.getItem('maasga_cookies_accepted');
            if (consent === null) {
              setTimeout(function() {
                var b = document.getElementById('cookie-banner');
                if (b) b.style.display = 'block';
              }, 2000);
            }
          })();
          function handleCookieConsent(accepted) {
            localStorage.setItem('maasga_cookies_accepted', accepted ? 'true' : 'false');
            document.getElementById('cookie-banner').style.display = 'none';
            if (accepted && typeof gtag === 'function') {
              gtag('consent', 'update', { analytics_storage: 'granted' });
            }
          }
        `}} />
        <style dangerouslySetInnerHTML={{ __html: '@keyframes slideUp { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }' }} />

        {/* Toast Notification System */}
        <div id="toast-container" class="fixed top-4 right-4 z-[99999] flex flex-col gap-3 pointer-events-none" style="max-width:380px;"></div>
        <script dangerouslySetInnerHTML={{ __html: `
          window.showToast = function(msg, type) {
            type = type || 'info';
            var colors = {
              success: 'linear-gradient(135deg,#059669,#10b981)',
              error: 'linear-gradient(135deg,#dc2626,#ef4444)',
              warning: 'linear-gradient(135deg,#d97706,#f59e0b)',
              info: 'linear-gradient(135deg,#0ea5e9,#3b82f6)'
            };
            var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
            var container = document.getElementById('toast-container');
            var el = document.createElement('div');
            el.className = 'pointer-events-auto flex items-center space-x-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-medium';
            el.style.cssText = 'background:' + (colors[type]||colors.info) + ';animation:slideInRight .35s ease-out;border:1px solid rgba(255,255,255,0.15);';
            var ico = document.createElement('i');
            ico.className = 'fas ' + (icons[type]||icons.info) + ' text-lg opacity-90';
            var sp = document.createElement('span');
            sp.textContent = msg;
            el.appendChild(ico);
            el.appendChild(sp);
            container.appendChild(el);
            setTimeout(function() {
              el.style.animation = 'fadeOutRight .35s ease-in forwards';
              setTimeout(function() { el.remove(); }, 350);
            }, 4000);
          };

          // Focus trap utility for modals
          window.__focusTrapStack = [];
          window.trapFocus = function(modalEl) {
            var focusable = modalEl.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
            if (focusable.length === 0) return;
            var first = focusable[0];
            var last = focusable[focusable.length - 1];
            function handler(e) {
              if (e.key !== 'Tab') return;
              if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
              } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
              }
            }
            modalEl.__focusTrapHandler = handler;
            modalEl.addEventListener('keydown', handler);
            window.__focusTrapStack.push(modalEl);
            first.focus();
          };
          window.releaseFocus = function(modalEl) {
            if (modalEl && modalEl.__focusTrapHandler) {
              modalEl.removeEventListener('keydown', modalEl.__focusTrapHandler);
              delete modalEl.__focusTrapHandler;
            }
            window.__focusTrapStack = window.__focusTrapStack.filter(function(m) { return m !== modalEl; });
          };
        ` }} />

        {/* ─── Lenis smooth scroll (se synchronise au ticker GSAP existant) ─── */}
        <div id="cursor-dot" aria-hidden="true"></div>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            function boot(){
              if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
              if (typeof Lenis === 'undefined') return;
              var lenis = new Lenis({ duration: 1.1, smoothWheel: true });
              window.__lenis = lenis;
              var usingGsap = false;
              // Fallback rAF : garantit que Lenis avance même si GSAP tarde (jamais de scroll figé)
              function raf(t){ if (!usingGsap) { lenis.raf(t); requestAnimationFrame(raf); } }
              requestAnimationFrame(raf);
              function wire(){
                if (window.gsap && window.ScrollTrigger) {
                  lenis.on('scroll', ScrollTrigger.update);
                  gsap.ticker.add(function(t){ lenis.raf(t * 1000); });
                  gsap.ticker.lagSmoothing(0);
                  usingGsap = true; // stoppe le fallback à sa prochaine frame
                  return true;
                }
                return false;
              }
              if (!wire()) { var n = 0, iv = setInterval(function(){ n++; if (wire() || n > 60) clearInterval(iv); }, 50); }
            }
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
          })();
        ` }} />

        {/* ─── Curseur custom (desktop only) — la magnétique reste gérée par le moteur GSAP ─── */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            if (window.matchMedia('(hover: none)').matches) return;
            function boot(){
              if (!window.gsap) return false;
              var dot = document.getElementById('cursor-dot');
              if (!dot) return true;
              gsap.set(dot, { xPercent: -50, yPercent: -50 });
              var xTo = gsap.quickTo(dot, 'x', { duration: 0.35, ease: 'power3' });
              var yTo = gsap.quickTo(dot, 'y', { duration: 0.35, ease: 'power3' });
              window.addEventListener('mousemove', function(e){ dot.style.opacity = '1'; xTo(e.clientX); yTo(e.clientY); });
              document.querySelectorAll('a, button, .magnetic, [data-magnetic]').forEach(function(el){
                el.addEventListener('mouseenter', function(){ dot.classList.add('hovering'); });
                el.addEventListener('mouseleave', function(){ dot.classList.remove('hovering'); });
              });
              return true;
            }
            if (!boot()) { var n = 0, iv = setInterval(function(){ n++; if (boot() || n > 60) clearInterval(iv); }, 50); }
          })();
        ` }} />
      </body>
    </html>
  )
}

