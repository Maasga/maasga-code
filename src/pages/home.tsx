import { Layout } from '../components/Layout'
import { products } from '../data/products'
import { reviews } from '../data/store'

export const HomePage = ({ stats, topReviews: propReviews }: { stats?: { clientCount: number; avgNote: number; reviewCount: number }; topReviews?: any[] } = {}) => {
  const featuredProducts = products.filter(p => p.available).slice(0, 3)
  const topReviews = propReviews && propReviews.length > 0
    ? propReviews
    : reviews.filter(r => r.approved && r.note >= 4).slice(0, 3)
  const hasClients = !!(stats?.clientCount && stats.clientCount > 0)
  const displayClients = hasClients ? `${stats!.clientCount}+` : '—'
  const displayNote = stats?.avgNote && stats.avgNote > 0 ? `${stats.avgNote.toFixed(1)}/5` : '—'
  const displayReviews = stats?.reviewCount && stats.reviewCount > 0 ? `${stats.reviewCount}` : '—'

  // Split-écran épinglé « Notre Expertise » — 3 expertises révélées au scroll
  const EXPERTISES = [
    {
      icon: 'ph-duotone ph-shopping-cart-simple',
      iconBg: 'linear-gradient(135deg,var(--accent),var(--accent-cyan))',
      iconColor: '#ffffff',
      title: 'Vente Premium',
      desc: "Des climatiseurs de marques internationales, économes en énergie et adaptés au climat sahélien.",
      features: ['Inverter (Économie 40%)', 'Garantie 1-3 ans constructeur'],
      cta: 'Voir le catalogue',
      href: '/catalogue',
    },
    {
      icon: 'ph-duotone ph-wrench',
      iconBg: 'rgba(202,240,248,0.14)',
      iconColor: 'var(--ice)',
      title: 'Maintenance',
      desc: "Interventions rapides et programmées pour garantir la longévité de vos appareils. SAV 7j/7.",
      features: ['Entretien trimestriel', 'Intervention sous 24h'],
      cta: 'Planifier un entretien',
      href: '/rendez-vous',
    },
    {
      icon: 'ph-duotone ph-chart-line-up',
      iconBg: 'linear-gradient(135deg,var(--accent),var(--accent-cyan))',
      iconColor: '#ffffff',
      title: 'Suivi de Performance',
      desc: "Un espace client dédié pour consulter vos contrats, historiques d'interventions et alertes.",
      features: ['Rapports mensuels', 'Alertes pannes'],
      cta: 'Espace client',
      href: '/espace-client',
    },
  ]

  return (
    <Layout activePage="home" canonicalPath="/" description="MAASGA - N°1 de la climatisation à Ouagadougou, Burkina Faso. Vente, installation et maintenance de climatiseurs. Devis gratuit, techniciens certifiés, SAV 7j/7." jsonLd={JSON.stringify({"@context":"https://schema.org","@type":"LocalBusiness","name":"MAASGA Climatisation","description":"Expert en vente, installation et maintenance de climatiseurs à Ouagadougou","url":"https://maasga-website.pages.dev","telephone":"+22655996418","address":{"@type":"PostalAddress","streetAddress":"Ouagadougou","addressLocality":"Ouagadougou","addressCountry":"BF"},"geo":{"@type":"GeoCoordinates","latitude":12.3714,"longitude":-1.5197},"openingHoursSpecification":{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],"opens":"07:30","closes":"18:00"},"priceRange":"$$","image":"https://maasga-website.pages.dev/og-image.png",...(stats?.avgNote && stats.avgNote > 0 && stats?.reviewCount && stats.reviewCount > 0 ? {"aggregateRating":{"@type":"AggregateRating","ratingValue":String(stats.avgNote.toFixed(1)),"reviewCount":String(stats.reviewCount)}} : {})})}>

      {/* ===== HERO SECTION ===== */}
      <section class="gradient-hero min-h-screen flex items-center relative overflow-hidden pt-20">
        {/* Carrousel photo plein écran — 7 photos, balayage clip-path (GSAP, étape 1B) */}
        <div id="hero-carousel" class="absolute inset-0 pointer-events-none">
          {["/hero/hero-1.jpg","/hero/hero-2.jpg","/hero/hero-3.jpg","/hero/hero-4.jpg","/hero/hero-5.jpg","/hero/hero-6.jpg","/hero/hero-7.jpg"].map((src, i) => (
            <div class={`hero-carousel-slide${i === 0 ? ' active' : ''}`}>
              <img src={src} alt="MAASGA — installation climatisation" loading="eager" decoding="async" fetchpriority={i === 0 ? 'high' : 'low'} />
            </div>
          ))}
          {/* Overlay sombre : z-index:5 pour rester au-dessus des slides (qui montent à z-index 3 pendant la transition) */}
          <div class="absolute inset-0" style="z-index:5; background:linear-gradient(100deg,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.55) 42%,rgba(0,0,0,0.28) 75%,rgba(0,0,0,0.5) 100%),linear-gradient(180deg,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.55) 100%);"></div>
        </div>

        {/* Particules de neige — conservées par-dessus le carrousel */}
        <div id="snow-container" class="absolute inset-0 overflow-hidden pointer-events-none"></div>

        {/* Halos lumineux subtils — parallaxe légère (au-dessus de l'overlay, derrière le texte) */}
        <div class="glow-dot w-96 h-96 top-[-60px] right-[-40px] pointer-events-none" style="z-index:6; background:rgba(0,180,216,0.14);" data-parallax="40"></div>
        <div class="glow-dot w-80 h-80 bottom-[-40px] left-[-40px] pointer-events-none" style="z-index:6; background:rgba(3,105,161,0.16);" data-parallax="-30"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 w-full">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div class="hero-content text-white" data-hero>
              {/* Badge confiance */}
              <div class="eyebrow eyebrow-ice inline-flex items-center gap-2 mb-6">
                <i class="ph-duotone ph-lock-key text-xs" style="color:var(--ice);"></i>
                <span>Techniciens certifiés · Burkina Faso</span>
              </div>

              <h1 data-split-hero class="display-1 text-balance mb-6">
                Le Frais <br /><span class="hero-grad">Réinventé</span> au Burkina.
              </h1>

              <p class="text-lg mb-8 leading-relaxed max-w-lg" style="color:#cbd5e1;">
                Spécialiste en <strong class="text-white">vente, installation et maintenance</strong> de climatiseurs à Ouagadougou. Visite technique gratuite sur site · Devis PDF gratuit · Maintenance trimestrielle.
              </p>

              <div class="flex flex-col sm:flex-row gap-4 mb-8">
                <a href="/catalogue" class="magnetic btn-light font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-3 group">
                  <i class="ph-duotone ph-snowflake" style="color:var(--accent);"></i>
                  <span>Commander une climatisation</span>
                  <i class="ph-duotone ph-arrow-right group-hover:translate-x-1 transition-transform text-sm" style="color:var(--accent);"></i>
                </a>
                <a href="/rendez-vous" class="font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all" style="border:1.5px solid rgba(202,240,248,0.35); color:white; background:rgba(255,255,255,0.06);">
                  <i class="ph-duotone ph-calendar-plus" style="color:var(--ice);"></i>
                  <span>Demander un devis</span>
                </a>
              </div>

              {/* Social proof */}
              <div class="flex items-center gap-4 mb-10">
                <div class="flex -space-x-2">
                  {['M','A','S','K'].map((l, i) => (
                    <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white border-2" style={`background:${['#0369a1','#0077b6','#00b4d8','#48cae4'][i]}; border-color:#0F172A; z-index:${4-i};`}>{l}</div>
                  ))}
                </div>
                <div>
                  <div class="flex items-center gap-1">
                    {[1,2,3,4,5].map(_ => <i class="ph-fill ph-star text-yellow-400" style="font-size:0.65rem;"></i>)}
                    <span class="font-bold text-white text-sm ml-1">{displayNote}</span>
                  </div>
                  <div class="text-xs" style="color:#94a3b8;"><strong class="text-white">{displayClients}</strong> clients satisfaits</div>
                </div>
              </div>

              {/* Stats — compteurs animés */}
              <div class="grid grid-cols-3 gap-4">
                <div class="text-center p-4 rounded-2xl" style="background:rgba(148,163,184,0.08); border:1px solid rgba(148,163,184,0.16);">
                  <div class="text-2xl font-extrabold text-white font-display">
                    {hasClients
                      ? <span data-count={String(stats!.clientCount)} data-suffix="+">0+</span>
                      : displayClients}
                  </div>
                  <div class="text-xs mt-1" style="color:#94a3b8;">Clients satisfaits</div>
                </div>
                <div class="text-center p-4 rounded-2xl" style="background:rgba(148,163,184,0.08); border:1px solid rgba(148,163,184,0.16);">
                  <div class="text-2xl font-extrabold text-white font-display"><span data-count="5" data-suffix=" ans">0 ans</span></div>
                  <div class="text-xs mt-1" style="color:#94a3b8;">D'expérience</div>
                </div>
                <div class="text-center p-4 rounded-2xl" style="background:rgba(148,163,184,0.08); border:1px solid rgba(148,163,184,0.16);">
                  <div class="text-2xl font-extrabold text-white font-display">{displayNote}</div>
                  <div class="text-xs mt-1" style="color:#94a3b8;">Note moyenne{stats?.reviewCount ? ` (${displayReviews} avis)` : ''}</div>
                </div>
              </div>
            </div>

            {/* Visuel mobile */}
            <div class="lg:hidden fade-in-up delay-3">
              <div class="flex flex-wrap gap-3 justify-center">
                {[
                  { icon: "fa-circle-check", color: "#34d399", text: "Validation sur site" },
                  { icon: "fa-file-pdf", color: "#f87171", text: "Devis PDF gratuit" },
                  { icon: "fa-screwdriver-wrench", color: "#caf0f8", text: "SAV réactif" },
                  { icon: "fa-shield-halved", color: "#fbbf24", text: "Techniciens certifiés" }
                ].map(b => (
                  <div class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm" style="background:rgba(148,163,184,0.08); border:1px solid rgba(148,163,184,0.2);">
                    <i class={`fas ${b.icon}`} style={`color:${b.color};`}></i>
                    <span class="font-semibold text-white text-xs">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Indice de scroll */}
        <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce" style="opacity:0.5;">
          <span class="text-xs uppercase tracking-widest text-white mb-2">Découvrir</span>
          <i class="ph-duotone ph-caret-down text-white"></i>
        </div>

        {/* Carte flottante — bas droite */}
        <div class="hidden lg:flex flex-col gap-4 absolute bottom-0 right-10 z-30">
          <a href="/simulateur" class="surface-elevated w-64 p-4 block">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:linear-gradient(135deg,var(--accent),var(--accent-cyan));">
                <i class="fas fa-calculator text-white text-base"></i>
              </div>
              <span class="font-extrabold text-sm font-display" style="color:var(--navy-900);">Exemple de calcul</span>
            </div>
            <div class="text-xs font-bold flex items-center justify-between" style="color:var(--accent);">
              <span>Simulateur BTU Gratuit</span>
              <i class="ph-duotone ph-arrow-right"></i>
            </div>
          </a>
        </div>
      </section>

      {/* ===== BARRE DE GARANTIES ===== */}
      <section class="py-5" style="background:#ffffff; border-bottom:1px solid var(--slate-200); box-shadow:var(--shadow-sm);">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4" data-stagger>
            {[
              { icon: "fa-shield-halved", color: "#10b981", title: "Garantie 1 an", sub: "Constructeur" },
              { icon: "fa-truck-fast", color: "#0369a1", title: "Livraison gratuite", sub: "Ouagadougou" },
              { icon: "fa-screwdriver-wrench", color: "#f59e0b", title: "Installation pro", sub: "24-48h" },
              { icon: "fa-headset", color: "#8b5cf6", title: "SAV réactif", sub: "7j/7" },
            ].map(t => (
              <div class="flex items-center gap-3 justify-center">
                <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={`background:${t.color}14;`}>
                  <i class={`fas ${t.icon} text-lg`} style={`color:${t.color};`}></i>
                </div>
                <div>
                  <div class="text-sm font-bold" style="color:var(--navy-900);">{t.title}</div>
                  <div class="text-xs" style="color:var(--slate-500);">{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MARQUES PARTENAIRES (marquee) ===== */}
      <section class="py-10 bg-white border-y" style="border-color:rgba(3,105,161,0.08);" aria-label="Marques partenaires">
        <p class="text-center text-xs font-bold uppercase tracking-[0.2em] mb-6" style="color:var(--slate-500);">Les grandes marques que nous installons</p>
        <div class="brand-marquee">
          <div class="brand-track">
            {[...["Airwell","LG","Sharp","Nasco","Mona","Solstar","Boreal","Roch"], ...["Airwell","LG","Sharp","Nasco","Mona","Solstar","Boreal","Roch"]].map(b => (
              <span class="brand-item font-display">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== NOTRE EXPERTISE — split-écran épinglé, révélation au scroll ===== */}
      <section id="services" class="expertise-pin bg-white">
        <div class="expertise-stage">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div class="text-center mb-10 lg:mb-12" data-reveal>
              <span class="eyebrow mb-4">Nos engagements</span>
              <h2 data-split class="display-2 mt-4 mb-4" style="color:var(--navy-900);">Notre Expertise</h2>
              <div class="w-20 h-1.5 mx-auto rounded-full" style="background:linear-gradient(90deg,var(--accent),var(--accent-cyan));"></div>
            </div>

            <div class="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* GAUCHE — étapes empilées (texte) */}
              <div class="exp-left order-2 lg:order-1">
                {EXPERTISES.map((s, i) => (
                  <div class={`exp-step${i === 0 ? ' is-active' : ''}`} data-step={String(i)}>
                    <div class="exp-step-icon w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5" style={`background:${s.iconBg}; color:${s.iconColor};`}>
                      <i class={s.icon}></i>
                    </div>
                    <div class="exp-num">Expertise 0{i + 1} <span style="opacity:0.4;">/ 0{EXPERTISES.length}</span></div>
                    <h3 class="exp-title font-display font-extrabold mb-4" style="color:var(--navy-900);">{s.title}</h3>
                    <p class="exp-desc mb-6" style="color:var(--slate-700);">{s.desc}</p>
                    <ul class="text-sm space-y-2 mb-8" style="color:var(--slate-500);">
                      {s.features.map(f => (
                        <li><i class="fas fa-check mr-2" style="color:var(--accent);"></i>{f}</li>
                      ))}
                    </ul>
                    <a href={s.href} class="inline-flex items-center font-semibold group" style="color:var(--accent);">
                      {s.cta} <i class="ph-duotone ph-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                    </a>
                  </div>
                ))}
              </div>

              {/* DROITE — panneau navy épinglé, visuels empilés qui se révèlent */}
              <div class="exp-right order-1 lg:order-2">
                <div class="exp-panel surface-navy">
                  <div class="exp-panel-wm" aria-hidden="true"><i class="ph-duotone ph-wrench"></i></div>
                  {EXPERTISES.map((s, i) => (
                    <div class={`exp-visual${i === 0 ? ' is-active' : ''}`} data-step={String(i)}>
                      <i class={s.icon}></i>
                    </div>
                  ))}
                </div>
                <div class="exp-dots">
                  {EXPERTISES.map((_, i) => (
                    <span class={`exp-dot${i === 0 ? ' is-active' : ''}`} data-step={String(i)}></span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          // Nettoyage si le script est réexécuté (routeur PJAX réinjecte les scripts du <main>)
          if (window.__maasgaExpertiseCleanup) window.__maasgaExpertiseCleanup();
          var section = document.getElementById('services');
          if (!section || !section.classList.contains('expertise-pin')) return;
          var steps = section.querySelectorAll('.exp-step');
          var visuals = section.querySelectorAll('.exp-visual');
          var dots = section.querySelectorAll('.exp-dot');
          var n = steps.length;
          if (!n) return;
          var current = -1;
          function setActive(i) {
            if (i === current) return;
            current = i;
            for (var k = 0; k < steps.length; k++) steps[k].classList.toggle('is-active', k === i);
            for (var v = 0; v < visuals.length; v++) visuals[v].classList.toggle('is-active', v === i);
            for (var d = 0; d < dots.length; d++) dots[d].classList.toggle('is-active', d === i);
          }
          var ticking = false;
          function update() {
            ticking = false;
            var rect = section.getBoundingClientRect();
            var vh = window.innerHeight || document.documentElement.clientHeight;
            var travel = rect.height - vh; // distance de scroll pendant l'épinglage
            if (travel <= 0) { setActive(0); return; }
            var scrolled = Math.min(Math.max(-rect.top, 0), travel);
            var p = scrolled / travel; // 0 → 1
            var idx = Math.floor(p * n);
            if (idx > n - 1) idx = n - 1;
            if (idx < 0) idx = 0;
            setActive(idx);
          }
          function onScroll() {
            if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
          }
          window.addEventListener('scroll', onScroll, { passive: true });
          window.addEventListener('resize', onScroll);
          window.__maasgaExpertiseCleanup = function() {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            window.__maasgaExpertiseCleanup = null;
          };
          setActive(0);
          update();
        })();
      ` }} />

      {/* ===== AVANTAGES ===== */}
      <section class="py-20 px-4 max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div class="text-center mb-14" data-reveal>
          <span class="eyebrow mb-4">Pourquoi MAASGA ?</span>
          <h2 data-split class="display-2 mt-4 mb-3" style="color:var(--navy-900);">Une approche professionnelle</h2>
          <p class="max-w-xl mx-auto" style="color:var(--slate-700);">Une rigueur à chaque étape de votre projet de climatisation.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-stagger>
          {[
            { icon: "fa-clipboard-check", color: "#0369a1", title: "Visite technique gratuite", desc: "Visite technique pour dimensionner correctement vos installations." },
            { icon: "fa-file-pdf",        color: "#ef4444", title: "Devis PDF détaillé", desc: "Devis transparent et complet remis immédiatement après visite technique et installation." },
            { icon: "fa-arrows-rotate",   color: "#10b981", title: "Maintenance trim.", desc: "Plan d'entretien régulier pour garantir les performances et la durée de vie." },
            { icon: "fa-helmet-safety",   color: "#f59e0b", title: "Techniciens qualifiés", desc: "Équipe formée et certifiée, spécialisée en froid et climatisation." }
          ].map(av => (
            <div data-tilt class="surface-elevated p-6 text-center group">
              <div class="tilt-image w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform" style={`background:${av.color}14; border:1px solid ${av.color}26;`}>
                <i class={`fas ${av.icon} text-2xl`} style={`color:${av.color};`}></i>
              </div>
              <div class="tilt-caption">
                <h3 class="font-bold mb-2 font-display" style="color:var(--navy-900);">{av.title}</h3>
                <p class="text-sm leading-relaxed" style="color:var(--slate-700);">{av.desc}</p>
              </div>
              <div class="tilt-shine" aria-hidden="true"></div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PRODUITS VEDETTES ===== */}
      <section id="ventes" class="py-20 overflow-hidden" style="background:var(--slate-50);">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-4" data-reveal>
            <div>
              <span class="eyebrow mb-3">Catalogue</span>
              <h2 data-split class="display-2 mt-3" style="color:var(--navy-900);">Le Meilleur du Froid</h2>
              <p class="mt-2" style="color:var(--slate-700);">Sélection des modèles les plus demandés à Ouagadougou</p>
            </div>
            <a href="/catalogue" class="inline-flex items-center gap-2 font-semibold group transition-colors" style="color:var(--accent);">
              <span>Voir tout le catalogue</span>
              <i class="ph-duotone ph-arrow-right group-hover:translate-x-1 transition-transform text-sm"></i>
            </a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6" data-stagger>
            {featuredProducts.length === 0 ? (
              <div class="col-span-3 text-center py-16">
                <i class="fas fa-box-open text-5xl mb-4" style="color:#94a3b8;"></i>
                <p style="color:var(--slate-500);">Aucun produit disponible pour le moment.</p>
              </div>
            ) : featuredProducts.map(p => (
              <div data-tilt class="surface-elevated overflow-hidden group flex flex-col">
                {/* Image */}
                <div class="tilt-image relative" style="background:linear-gradient(145deg,#f0f7ff,#dbeafe); padding:28px 24px 20px;">
                  <div class="flex items-center justify-center" style="min-height:180px;">
                    {(p as any).imageUrl
                      ? <img src={(p as any).imageUrl} alt={p.name}
                          loading="lazy" width={250} height={180}
                          class="object-contain mx-auto group-hover:scale-105 transition-transform duration-500"
                          style="max-height:180px; max-width:100%; width:auto;" />
                      : <div class="group-hover:scale-105 transition-transform duration-500" style="font-size:6rem; line-height:1;">{p.image}</div>
                    }
                  </div>
                  {p.inverter && (
                    <span class="absolute top-3 right-3 text-xs px-3 py-1 rounded-full font-bold" style="background:linear-gradient(135deg,var(--accent),var(--accent-cyan)); color:#ffffff;">INVERTER</span>
                  )}
                  <span class={`absolute top-3 left-3 text-xs px-3 py-1 rounded-full font-semibold inline-flex items-center gap-1.5 ${p.stock > 3 ? 'badge-stock-ok' : p.stock > 0 ? 'badge-stock-low' : 'badge-stock-out'}`}>
                    <i class={`fas ${p.stock > 3 ? 'fa-circle-check' : p.stock > 0 ? 'fa-triangle-exclamation' : 'fa-circle-xmark'}`}></i>
                    {p.stock > 3 ? 'Disponible' : p.stock > 0 ? 'Stock limité' : 'Rupture'}
                  </span>
                </div>
                {/* Contenu */}
                <div class="p-6 flex flex-col flex-1">
                  <div class="tilt-caption">
                    <div class="text-xs font-bold uppercase tracking-wider mb-1" style="color:var(--accent);">{p.brand}</div>
                    <h3 class="font-extrabold text-lg mb-2 leading-snug font-display" style="color:var(--navy-900);">{p.name}</h3>
                    <p class="text-sm mb-4 leading-relaxed" style="color:var(--slate-500);">{p.description}</p>
                  </div>
                  <div class="flex items-end justify-between mb-5 mt-auto">
                    <div>
                      <div class="text-2xl font-extrabold font-display" style="color:var(--accent);">{p.price.toLocaleString()} <span class="text-sm font-normal" style="color:var(--slate-500);">FCFA</span></div>
                      <div class="text-xs font-semibold mt-0.5" style="color:#10b981;"><i class="fas fa-circle-check mr-1"></i>Installation et livraison offerte</div>
                    </div>
                    <div class="text-right">
                      <div class="text-base font-bold" style="color:var(--navy-900);">{p.btu.toLocaleString()} BTU</div>
                      <div class="text-xs" style="color:var(--slate-500);">{p.surface_min}–{p.surface_max} m²</div>
                    </div>
                  </div>
                  <a href={`/catalogue?product=${p.id}`} class="w-full btn-primary font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm">
                    <i class="fas fa-eye text-sm"></i>
                    <span>Voir &amp; Commander</span>
                  </a>
                  <div class="tilt-shine" aria-hidden="true"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Notice */}
          <div class="mt-8 rounded-2xl p-4 flex items-start gap-3" style="background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.2);">
            <i class="fas fa-triangle-exclamation mt-0.5 flex-shrink-0" style="color:#f59e0b;"></i>
            <p class="text-sm" style="color:var(--slate-700);">
              <strong style="color:#b45309;">Important :</strong> Toute commande est soumise à une Visite technique gratuite préalable sur site. Le paiement est effectué uniquement après cette visite et confirmation du devis.
            </p>
          </div>
        </div>
      </section>

      {/* ===== FONCTIONNALITÉS ===== */}
      <section class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-14" data-reveal>
            <span class="eyebrow mb-4">Plateforme</span>
            <h2 data-split class="display-2 mt-4 mb-3" style="color:var(--navy-900);">Nos fonctionnalités</h2>
            <p style="color:var(--slate-700);">Tout ce dont vous avez besoin sur une seule plateforme.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-stagger>
            {[
              { icon: "fa-table-cells-large", title: "Catalogue complet",  desc: "Tous nos climatiseurs avec fiches techniques, prix et disponibilité en temps réel.", href: "/catalogue",     color: "#0369a1" },
              { icon: "fa-calculator",        title: "Simulateur BTU",    desc: "Calculez la puissance idéale pour votre espace en quelques secondes.",        href: "/simulateur",    color: "#8b5cf6" },
              { icon: "fa-screwdriver-wrench",title: "Installation Pro",  desc: "Pose par nos techniciens certifiés avec vérification finale garantie.",       href: "/rendez-vous",   color: "#10b981" },
              { icon: "fa-calendar-check",    title: "Suivi entretien",   desc: "Rappels automatiques pour la maintenance et suivi de votre historique.",      href: "/espace-client", color: "#f59e0b" }
            ].map(f => (
              <a href={f.href} data-tilt class="surface-elevated p-6 text-center group block">
                <div class="tilt-image w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform" style={`background:${f.color}14; border:1px solid ${f.color}26;`}>
                  <i class={`fas ${f.icon} text-2xl`} style={`color:${f.color};`}></i>
                </div>
                <div class="tilt-caption">
                  <h3 class="font-bold mb-2 font-display" style="color:var(--navy-900);">{f.title}</h3>
                  <p class="text-sm leading-relaxed" style="color:var(--slate-700);">{f.desc}</p>
                </div>
                <div class="tilt-shine" aria-hidden="true"></div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SIMULATEUR CTA ===== */}
      <section class="py-20 relative overflow-hidden" style="background:linear-gradient(135deg,var(--slate-50) 0%,#dbeafe 50%,var(--slate-50) 100%);">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center" data-reveal>
            <div>
              <span class="eyebrow mb-5" style="color:#7c3aed; background:rgba(139,92,246,0.1); border-color:rgba(139,92,246,0.25);">
                <i class="fas fa-calculator mr-1"></i> Outil gratuit
              </span>
              <h2 data-split class="display-2 mt-5 mb-4" style="color:var(--navy-900);">Quel climatiseur pour votre pièce ?</h2>
              <p class="mb-6 leading-relaxed" style="color:var(--slate-700);">
                Notre simulateur BTU calcule en quelques secondes la puissance nécessaire pour climatiser efficacement votre espace.
              </p>
              <div class="space-y-3 mb-8">
                {["Surface de la pièce en m²","Hauteur du plafond","Exposition solaire","Nombre de fenêtres"].map(item => (
                  <div class="flex items-center gap-3">
                    <i class="fas fa-circle-check text-sm" style="color:#10b981;"></i>
                    <span class="text-sm" style="color:var(--slate-700);">{item}</span>
                  </div>
                ))}
              </div>
              <a href="/simulateur" class="btn-primary font-bold px-8 py-4 rounded-2xl inline-flex items-center gap-3">
                <i class="fas fa-calculator"></i>
                <span>Lancer le simulateur BTU</span>
                <i class="ph-duotone ph-arrow-right text-sm"></i>
              </a>
            </div>

            {/* Carte calcul */}
            <div class="surface-elevated p-8">
              <div class="text-center mb-6">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style="background:linear-gradient(135deg,var(--accent),var(--accent-cyan));">
                  <i class="fas fa-calculator text-white text-xl"></i>
                </div>
                <h3 class="font-extrabold text-lg font-display" style="color:var(--navy-900);">Exemple de calcul</h3>
              </div>
              <div class="space-y-3">
                {[
                  { label: "Surface", value: "20 m²", icon: "fa-ruler-combined" },
                  { label: "Plafond", value: "2,8 m", icon: "fa-arrows-up-down" },
                  { label: "Exposition", value: "Forte (sud)", icon: "fa-sun" },
                  { label: "Fenêtres", value: "2 grandes", icon: "fa-border-all" }
                ].map(item => (
                  <div class="flex items-center justify-between rounded-xl px-4 py-3" style="background:var(--slate-50); border:1px solid var(--slate-200);">
                    <div class="flex items-center gap-3">
                      <i class={`fas ${item.icon} w-4 text-sm`} style="color:var(--accent);"></i>
                      <span class="text-sm" style="color:var(--slate-500);">{item.label}</span>
                    </div>
                    <span class="text-sm font-bold" style="color:var(--navy-900);">{item.value}</span>
                  </div>
                ))}
                <div class="rounded-2xl px-4 py-5 text-center mt-4" style="background:linear-gradient(135deg,var(--accent),var(--accent-cyan)); box-shadow:0 8px 30px rgba(3,105,161,0.25);">
                  <div class="text-xs mb-1" style="color:#ffffff; opacity:0.85;">Puissance recommandée</div>
                  <div class="text-3xl font-extrabold font-display" style="color:#ffffff;">12 000 BTU / 1,5 CV</div>
                  <div class="text-xs mt-1" style="color:var(--ice);">→ 2 modèles compatibles</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== AVIS CLIENTS ===== */}
      <section class="py-20 px-4 max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-12" data-reveal>
          <div>
            <span class="eyebrow mb-3">Témoignages</span>
            <h2 data-split class="display-2 mt-3 mb-2" style="color:var(--navy-900);">Ce que disent nos clients</h2>
            <p style="color:var(--slate-700);">Installations réalisées à Ouagadougou et environs</p>
          </div>
          <a href="/avis" class="mt-4 sm:mt-0 inline-flex items-center gap-2 font-semibold" style="color:var(--accent);">
            <span>Voir tous les avis</span>
            <i class="ph-duotone ph-arrow-right text-sm"></i>
          </a>
        </div>

        {topReviews.length === 0 ? (
          <div class="surface text-center py-12">
            <i class="ph-fill ph-star text-4xl mb-3" style="color:#94a3b8;"></i>
            <p style="color:var(--slate-500);">Aucun avis pour le moment. Soyez le premier !</p>
            <a href="/avis" class="btn-primary inline-block mt-4 text-sm font-bold px-6 py-2.5 rounded-xl">Laisser un avis</a>
          </div>
        ) : (
          <>
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
          </>
        )}

        {topReviews.length > 0 && (
          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div class="flex items-center gap-2">
              <div class="flex space-x-0.5">
                {[1,2,3,4,5].map(_ => <i class="ph-fill ph-star text-yellow-400 text-sm"></i>)}
              </div>
              <span class="text-xl font-extrabold font-display" style="color:var(--navy-900);">{displayNote}</span>
            </div>
            <div class="text-sm" style="color:var(--slate-700);">Noté par <strong style="color:var(--navy-900);">{displayClients}</strong> clients à Ouagadougou</div>
            <a href="/avis" class="text-xs font-bold px-4 py-2 rounded-xl" style="background:rgba(3,105,161,0.08); color:var(--accent); border:1px solid rgba(3,105,161,0.2);">Déposer mon avis</a>
          </div>
        )}
      </section>

      {/* ===== FAQ ===== */}
      <section class="py-20 px-4 max-w-4xl mx-auto sm:px-6 lg:px-8">
        <div class="text-center mb-12" data-reveal>
          <span class="eyebrow mb-4">FAQ</span>
          <h2 data-split class="display-2 mt-4 mb-3" style="color:var(--navy-900);">Questions fréquentes</h2>
          <p style="color:var(--slate-700);">Tout ce que vous devez savoir avant de commander</p>
        </div>
        <div class="space-y-3" data-stagger>
          {[
            { q: "Les prix incluent-ils l'installation ?", a: "Oui. Tous nos prix catalogue incluent la livraison et l'installation complète par nos techniciens certifiés. Aucuns frais cachés." },
            { q: "Comment se déroule la visite technique ?", a: "Un technicien MAASGA se déplace gratuitement chez vous pour évaluer les besoins (surface, orientation, nombre de fenêtres). Il vous remet ensuite un devis PDF détaillé. Aucun engagement avant validation." },
            { q: "Quel est le délai d'installation ?", a: "En général, l'installation est réalisée sous 48 à 72h après validation du devis. Pour les urgences (dépannage, panne), nous intervenons sous 24h." },
            { q: "Proposez-vous la maintenance / entretien ?", a: "Oui, nous proposons des contrats de maintenance trimestrielle pour garantir les performances et la longévité de votre équipement. Nettoyage filtres, vérification gaz, contrôle électrique." },
            { q: "Quels modes de paiement acceptez-vous ?", a: "Paiement en espèces, LigdiCash (paiement mobile sécurisé — Orange Money, Moov Money et plus), Wave ou virement bancaire. Le paiement se fait uniquement après la visite technique et votre validation du devis." },
            { q: "Quelle garantie sur les climatiseurs ?", a: "Tous nos climatiseurs sont neufs et bénéficient d'une garantie constructeur (1 à 3 ans selon les marques). MAASGA assure le service après-vente." },
            { q: "Couvrez-vous tout Ouagadougou ?", a: "Oui, nous intervenons dans tous les arrondissements de Ouagadougou et dans les zones périphériques. Contactez-nous pour vérifier la couverture de votre secteur." }
          ].map((faq, i) => (
            <details class="group surface overflow-hidden">
              <summary class="flex items-center justify-between p-5 cursor-pointer list-none">
                <span class="font-bold text-sm pr-4" style="color:var(--navy-900);">{faq.q}</span>
                <i class="ph-duotone ph-caret-down text-xs transition-transform group-open:rotate-180 flex-shrink-0" style="color:var(--accent);"></i>
              </summary>
              <div class="px-5 pb-5 text-sm leading-relaxed" style="color:var(--slate-700);">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* FAQ Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Les prix incluent-ils l'installation ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui. Tous nos prix catalogue incluent la livraison et l'installation complète par nos techniciens certifiés." } },
          { "@type": "Question", "name": "Comment se déroule la visite technique ?", "acceptedAnswer": { "@type": "Answer", "text": "Un technicien MAASGA se déplace gratuitement chez vous pour évaluer les besoins. Il vous remet ensuite un devis PDF détaillé." } },
          { "@type": "Question", "name": "Quel est le délai d'installation ?", "acceptedAnswer": { "@type": "Answer", "text": "En général, l'installation est réalisée sous 48 à 72h après validation du devis." } },
          { "@type": "Question", "name": "Proposez-vous la maintenance / entretien ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, nous proposons des contrats de maintenance trimestrielle pour garantir les performances et la longévité de votre équipement." } },
          { "@type": "Question", "name": "Quels modes de paiement acceptez-vous ?", "acceptedAnswer": { "@type": "Answer", "text": "Paiement en espèces, LigdiCash (Orange Money, Moov Money et plus), Wave ou virement bancaire. Le paiement se fait après la visite technique." } },
          { "@type": "Question", "name": "Quelle garantie sur les climatiseurs ?", "acceptedAnswer": { "@type": "Answer", "text": "Tous nos climatiseurs sont neufs et bénéficient d'une garantie constructeur de 1 à 3 ans." } },
          { "@type": "Question", "name": "Couvrez-vous tout Ouagadougou ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, nous intervenons dans tous les arrondissements de Ouagadougou et dans les zones périphériques." } }
        ]
      }) }} />

      {/* ===== CTA FINAL ===== */}
      <section class="py-20 relative overflow-hidden bg-navy" data-reveal>
        <div class="glow-dot w-80 h-80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style="background:rgba(3,105,161,0.25);" data-parallax="-30"></div>
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <i class="ph-duotone ph-rocket-launch text-5xl mb-4" style="color:var(--ice);"></i>
          <h2 data-split class="display-2 mb-4" style="color:#ffffff;">Prêt à profiter du confort climatisé ?</h2>
          <p class="mb-4 text-lg max-w-2xl mx-auto" style="color:#cbd5e1;">
            Contactez-nous dès aujourd'hui. Visite technique gratuite, devis PDF sous 24h, installation par nos experts certifiés.
          </p>

          <div class="inline-flex items-center gap-2 mb-8 px-5 py-2.5 rounded-full" style="background:rgba(56,189,248,0.12); border:1px solid rgba(56,189,248,0.3);">
            <i class="fas fa-phone text-sm" style="color:#38bdf8;"></i>
            <span class="text-sm font-bold" style="color:var(--ice);">Devis gratuit sous 24h — Appelez le 55 99 64 18</span>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/rendez-vous" class="magnetic btn-light font-extrabold px-10 py-4 rounded-2xl text-lg flex items-center justify-center gap-3">
              <i class="ph-duotone ph-calendar-plus" style="color:var(--accent);"></i>
              <span>Demander un devis gratuit</span>
            </a>
            <a href="/catalogue" class="font-extrabold px-10 py-4 rounded-2xl text-lg flex items-center justify-center gap-3 transition-all" style="border:1.5px solid rgba(202,240,248,0.35); color:white; background:rgba(255,255,255,0.06);">
              <i class="fas fa-table-cells-large"></i>
              <span>Voir le catalogue</span>
            </a>
          </div>
          <p class="text-sm mt-6" style="color:#94a3b8;">
            <i class="ph-duotone ph-shield-check mr-2"></i>
            Visite technique gratuite obligatoire · Paiement après visite · Satisfaction garantie
          </p>
          <div class="flex items-center justify-center gap-4 mt-4">
            <div class="flex -space-x-1.5">
              {['M','A','S'].map((l, i) => (
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white border-2" style={`background:${['#0096c7','#00b4d8','#48cae4'][i]}; border-color:#0F172A; z-index:${3-i};`}>{l}</div>
              ))}
            </div>
            <span class="text-xs" style="color:#94a3b8;">Faites confiance à <strong class="text-white">MAASGA</strong> pour votre climatisation</span>
          </div>
        </div>
      </section>

      {/* ===== GSAP — neige uniquement (le CSS fade-in-up gère le héro) ===== */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          function initSnow() {
            if (typeof gsap === 'undefined') return;
            var container = document.getElementById('snow-container');
            if (!container) return;
            for (var i = 0; i < 50; i++) {
              var dot = document.createElement('div');
              dot.className = 'snow-particle';
              var size = Math.random() * 4 + 2;
              dot.style.width = size + 'px';
              dot.style.height = size + 'px';
              dot.style.left = Math.random() * 100 + '%';
              dot.style.top = Math.random() * 100 + '%';
              container.appendChild(dot);
              gsap.to(dot, {
                y: '+=120', x: '+=' + (Math.random() * 40 - 20),
                opacity: 0, duration: Math.random() * 3 + 2,
                repeat: -1, ease: 'none', delay: Math.random() * 5
              });
            }
          }
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() { setTimeout(initSnow, 150); });
          } else {
            setTimeout(initSnow, 150);
          }
        })();
      ` }} />

      {/* ===== Hero carousel — balayage clip-path GSAP (étape 1B) ===== */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function(){
          var slides = Array.prototype.slice.call(
            document.querySelectorAll('#hero-carousel .hero-carousel-slide')
          );
          if (slides.length < 2) return;
          var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          function start(){
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
          }
          // GSAP est chargé en defer : on tente un court instant avant de démarrer (sinon fallback statique)
          if (window.gsap || reduce) { start(); }
          else { var n = 0, iv = setInterval(function(){ n++; if (window.gsap || n > 60) { clearInterval(iv); start(); } }, 50); }
        })();
      ` }} />

      {/* ===== SplitText — titres de section révélés ligne par ligne au scroll ===== */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function(){
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
          function run(){
            if (!window.gsap || !window.SplitText || !window.ScrollTrigger) return false;
            gsap.registerPlugin(SplitText, ScrollTrigger);
            var go = function(){
              document.querySelectorAll('[data-split]').forEach(function(el){
                var split = new SplitText(el, { type: 'lines', linesClass: 'split-line' });
                gsap.from(split.lines, {
                  yPercent: 110, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.12,
                  scrollTrigger: { trigger: el, start: 'top 85%', once: true }
                });
              });
              ScrollTrigger.refresh();
            };
            if (document.fonts && document.fonts.ready) { document.fonts.ready.then(go); } else { go(); }
            return true;
          }
          if (!run()) { var n = 0, iv = setInterval(function(){ n++; if (run() || n > 60) clearInterval(iv); }, 50); }
        })();
      ` }} />

      {/* ===== SplitText — slogan hero composé mot par mot ===== */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function(){
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
          function run(){
            if (!window.gsap || !window.SplitText) return false;
            var target = document.querySelector('[data-split-hero]');
            if (!target) return true;
            gsap.registerPlugin(SplitText);
            var go = function(){
              var split = new SplitText(target, { type: 'lines,words', linesClass: 'split-line' });
              gsap.from(split.words, {
                yPercent: 120, opacity: 0, duration: 0.9,
                ease: 'power3.out', stagger: 0.035, delay: 0.2
              });
            };
            if (document.fonts && document.fonts.ready) { document.fonts.ready.then(go); } else { go(); }
            return true;
          }
          if (!run()) { var n = 0, iv = setInterval(function(){ n++; if (run() || n > 60) clearInterval(iv); }, 50); }
        })();
      ` }} />

    </Layout>
  )
}
