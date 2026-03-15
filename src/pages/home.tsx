import { Layout } from '../components/Layout'
import { products } from '../data/products'
import { reviews } from '../data/store'

export const HomePage = ({ stats, topReviews: propReviews }: { stats?: { clientCount: number; avgNote: number; reviewCount: number }; topReviews?: any[] } = {}) => {
  const featuredProducts = products.filter(p => p.available).slice(0, 3)
  const topReviews = propReviews && propReviews.length > 0
    ? propReviews
    : reviews.filter(r => r.approved && r.note >= 4).slice(0, 3)
  const displayClients = stats?.clientCount && stats.clientCount > 0 ? `${stats.clientCount}+` : '—'
  const displayNote = stats?.avgNote && stats.avgNote > 0 ? `${stats.avgNote.toFixed(1)}/5` : '—'
  const displayReviews = stats?.reviewCount && stats.reviewCount > 0 ? `${stats.reviewCount}` : '—'

  return (
    <Layout activePage="home" canonicalPath="/" description="MAASGA - N°1 de la climatisation à Ouagadougou, Burkina Faso. Vente, installation et maintenance de climatiseurs. Devis gratuit, techniciens certifiés, SAV 7j/7." jsonLd={JSON.stringify({"@context":"https://schema.org","@type":"LocalBusiness","name":"MAASGA Climatisation","description":"Expert en vente, installation et maintenance de climatiseurs à Ouagadougou","url":"https://maasga-website.pages.dev","telephone":"+22655996418","address":{"@type":"PostalAddress","streetAddress":"Ouagadougou","addressLocality":"Ouagadougou","addressCountry":"BF"},"geo":{"@type":"GeoCoordinates","latitude":12.3714,"longitude":-1.5197},"openingHoursSpecification":{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],"opens":"07:30","closes":"18:00"},"priceRange":"$$","image":"https://maasga-website.pages.dev/og-image.png",...(stats?.avgNote && stats.avgNote > 0 && stats?.reviewCount && stats.reviewCount > 0 ? {"aggregateRating":{"@type":"AggregateRating","ratingValue":String(stats.avgNote.toFixed(1)),"reviewCount":String(stats.reviewCount)}} : {})})}>

      {/* ===== HERO SECTION ===== */}
      <section class="gradient-hero min-h-screen flex items-center relative overflow-hidden pt-20">
        {/* Background Video (Lower opacity) */}
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          preload="metadata"
          aria-hidden="true"
          class="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style="z-index: 0; opacity: 0.2; object-position: 80% 50%;"
        >
          <source src="/HOMZ3.mp4" type="video/mp4" />
        </video>

        {/* Snow particles container */}
        <div id="snow-container" class="absolute inset-0 overflow-hidden pointer-events-none"></div>

        {/* Glow blobs */}
        <div class="glow-dot w-96 h-96 top-[-80px] right-[-80px]" style="background:rgba(0,180,216,0.15);"></div>
        <div class="glow-dot w-80 h-80 bottom-[-60px] left-[-60px]" style="background:rgba(0,119,182,0.12);"></div>

        {/* Floating snowflakes */}
        <i class="fas fa-snowflake absolute top-24 left-10 text-5xl float" style="color:rgba(202,240,248,0.12);"></i>
        <i class="fas fa-snowflake absolute bottom-40 right-20 text-3xl float" style="color:rgba(202,240,248,0.08); animation-delay:1s;"></i>
        <i class="fas fa-snowflake absolute top-1/2 left-1/4 text-7xl float" style="color:rgba(202,240,248,0.05); animation-delay:2s;"></i>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 w-full">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div class="hero-content text-white">
              {/* Badge */}
              <div class="inline-flex items-center space-x-2 rounded-full px-4 py-2 text-sm mb-6 fade-in-up" style="background:rgba(202,240,248,0.1); border:1px solid rgba(202,240,248,0.25);">
                <i class="fas fa-shield-alt text-xs" style="color:#caf0f8;"></i>
                <span style="color:#caf0f8;">Techniciens certifiés · Burkina Faso</span>
              </div>

              <h1 class="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 fade-in-up delay-1">
                Le Frais <br /><span style="color:#caf0f8;">Réinventé</span> au Burkina.
              </h1>

              <p class="text-lg mb-8 leading-relaxed max-w-lg fade-in-up delay-2" style="color:#caf0f8; opacity:0.9;">
                Spécialiste en <strong class="text-white">vente, installation et maintenance</strong> de climatiseurs à Ouagadougou. Visite technique gratuite sur site · Devis PDF gratuit · Maintenance trimestrielle.
              </p>

              <div class="flex flex-col sm:flex-row gap-4 mb-8 fade-in-up delay-3">
                <a href="/catalogue" class="font-bold px-8 py-4 rounded-xl flex items-center justify-center space-x-3 group transition-all shadow-xl active:scale-95" style="background:linear-gradient(135deg,#ffffff 0%,#caf0f8 50%,#0077b6 100%); color:#03045e; box-shadow:0 8px 30px rgba(0,119,182,0.4), 0 2px 8px rgba(0,180,216,0.3); border:1px solid rgba(255,255,255,0.6);">
                  <i class="fas fa-snowflake" style="color:#0077b6;"></i>
                  <span>Commander une climatisation</span>
                  <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform text-sm" style="color:#0077b6;"></i>
                </a>
                <a href="/rendez-vous" class="btn-secondary font-bold px-8 py-4 rounded-xl flex items-center justify-center space-x-3" style="border-color:rgba(202,240,248,0.35); color:white; background:rgba(255,255,255,0.1);">
                  <i class="fas fa-calendar-plus"></i>
                  <span>Demander un devis</span>
                </a>
              </div>

              {/* Social proof */}
              <div class="flex items-center space-x-4 mb-10 fade-in-up delay-3">
                <div class="flex -space-x-2">
                  {['M','A','S','K'].map((l, i) => (
                    <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white border-2" style={`background:${['#0077b6','#0096c7','#00b4d8','#48cae4'][i]}; border-color:#03045e; z-index:${4-i};`}>{l}</div>
                  ))}
                </div>
                <div>
                  <div class="flex items-center space-x-1">
                    {[1,2,3,4,5].map(_ => <i class="fas fa-star text-yellow-400" style="font-size:0.65rem;"></i>)}
                    <span class="font-bold text-white text-sm ml-1">{displayNote}</span>
                  </div>
                  <div class="text-xs" style="color:#caf0f8; opacity:0.7;"><strong class="text-white">{displayClients}</strong> clients satisfaits</div>
                </div>
              </div>

              {/* Stats */}
              <div class="grid grid-cols-3 gap-4 fade-in-up delay-4">
                {[
                  { val: displayClients, label: "Clients satisfaits" },
                  { val: "5 ans", label: "D'expérience" },
                  { val: displayNote, label: `Note moyenne${stats?.reviewCount ? ` (${displayReviews} avis)` : ''}` }
                ].map(s => (
                  <div class="text-center p-4 rounded-2xl hover-lift" style="background:rgba(202,240,248,0.08); border:1px solid rgba(202,240,248,0.15);">
                    <div class="text-2xl font-extrabold text-white">{s.val}</div>
                    <div class="text-xs mt-1" style="color:#caf0f8; opacity:0.7;">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

         

            {/* Mobile visual */}
            <div class="lg:hidden fade-in-up delay-3">
              <div class="flex flex-wrap gap-3 justify-center">
                {[
                  { icon: "fa-check-circle", color: "#34d399", text: "Validation sur site" },
                  { icon: "fa-file-pdf", color: "#f87171", text: "Devis PDF gratuit" },
                  { icon: "fa-tools", color: "#caf0f8", text: "SAV réactif" },
                  { icon: "fa-shield-alt", color: "#fbbf24", text: "Techniciens certifiés" }
                ].map(b => (
                  <div class="flex items-center space-x-2 rounded-xl px-3 py-2 text-sm" style="background:rgba(202,240,248,0.08); border:1px solid rgba(202,240,248,0.2);">
                    <i class={`fas ${b.icon}`} style={`color:${b.color};`}></i>
                    <span class="font-semibold text-white text-xs">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Scroll hint */}
        <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce" style="opacity:0.5;">
          <span class="text-xs uppercase tracking-widest text-white mb-2">Découvrir</span>
          <i class="fas fa-chevron-down text-white"></i>
        </div>

        {/* Floating Cards - Bottom Right */}
        <div class="hidden lg:flex flex-col gap-4 absolute bottom-0 right-10 z-30">
          {/* Exemple de calcul Card */}
          <a href="/simulateur" class="w-64 bg-white rounded-2xl p-4 shadow-2xl hover:scale-105 transition-transform duration-500 block border border-blue-100">
            <div class="flex items-center space-x-3 mb-2">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:linear-gradient(135deg,#0077b6,#00b4d8);">
                <i class="fas fa-calculator text-white text-base"></i>
              </div>
              <span class="font-extrabold text-sm" style="color:#03045e;">Exemple de calcul</span>
            </div>
            <div class="text-xs text-blue-600 font-bold flex items-center justify-between">
              <span>Simulateur BTU Gratuit</span>
              <i class="fas fa-arrow-right"></i>
            </div>
          </a>
        </div>
      </section>

      {/* ===== TRUST GUARANTEE BAR ===== */}
      <section class="py-5" style="background:#ffffff; border-top:3px solid #caf0f8; border-bottom:1px solid rgba(0,119,182,0.1); box-shadow:0 2px 12px rgba(0,119,182,0.06);">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "fa-shield-alt", color: "#34d399", title: "Garantie 1 an", sub: "Constructeur" },
              { icon: "fa-truck", color: "#0077b6", title: "Livraison gratuite", sub: "Ouagadougou" },
              { icon: "fa-tools", color: "#fbbf24", title: "Installation pro", sub: "24-48h" },
              { icon: "fa-headset", color: "#a78bfa", title: "SAV réactif", sub: "7j/7" },
            ].map(t => (
              <div class="flex items-center space-x-3 justify-center">
                <i class={`fas ${t.icon} text-xl`} style={`color:${t.color};`}></i>
                <div>
                  <div class="text-sm font-bold" style="color:#03045e;">{t.title}</div>
                  <div class="text-xs" style="color:#64748b;">{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== NOTRE EXPERTISE ===== */}
      <section id="services" class="py-24 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-20">
            <div class="inline-block text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4" style="color:#0077b6; background:rgba(0,119,182,0.08); border:1px solid rgba(0,119,182,0.2);">Nos engagements</div>
            <h2 class="text-4xl font-extrabold mb-4 reveal" style="color:#03045e;">Notre Expertise</h2>
            <div class="w-20 h-1.5 mx-auto rounded-full" style="background:linear-gradient(90deg,#0077b6,#00b4d8);"></div>
          </div>

          <div class="grid md:grid-cols-3 gap-10 reveal">
            {/* Vente */}
            <div class="card-hover p-8 rounded-3xl group" style="background:#eff6ff; border:1px solid rgba(0,119,182,0.12);">
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:rotate-12 transition-transform" style="background:linear-gradient(135deg,#0077b6,#00b4d8); color:#ffffff;">
                <i class="fas fa-shopping-cart" style="color:#ffffff;"></i>
              </div>
              <h3 class="text-2xl font-extrabold mb-4" style="color:#03045e;">Vente Premium</h3>
              <p class="mb-6" style="color:#475569;">Des climatiseurs de marques internationales, économes en énergie et adaptés au climat sahélien.</p>
              <ul class="text-sm space-y-2 mb-8" style="color:#64748b;">
                <li><i class="fas fa-check mr-2" style="color:#0077b6;"></i>Inverter (Économie 40%)</li>
                <li><i class="fas fa-check mr-2" style="color:#0077b6;"></i>Garantie 1-3 ans constructeur</li>
              </ul>
              <a href="/catalogue" class="inline-flex items-center font-semibold text-sm group-hover:translate-x-1 transition-transform" style="color:#0077b6;">
                Voir le catalogue <i class="fas fa-arrow-right ml-2"></i>
              </a>
            </div>

            {/* Maintenance — carte centrale mise en valeur */}
            <div class="card-hover p-8 rounded-3xl shadow-2xl scale-105 relative overflow-hidden" style="background:linear-gradient(135deg,#03045e 0%,#0077b6 100%); color:#ffffff;">
              <div class="absolute top-0 right-0 p-4 text-8xl" style="opacity:0.1; color:#ffffff;">
                <i class="fas fa-tools"></i>
              </div>
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6" style="background:rgba(202,240,248,0.2); color:#ffffff;">
                <i class="fas fa-tools" style="color:#ffffff;"></i>
              </div>
              <h3 class="text-2xl font-extrabold mb-4" style="color:#ffffff;">Maintenance</h3>
              <p class="mb-6" style="color:#caf0f8;">Interventions rapides et programmées pour garantir la longévité de vos appareils. SAV 7j/7.</p>
              <ul class="text-sm space-y-2 mb-8" style="color:#caf0f8; opacity:0.85;">
                <li><i class="fas fa-check mr-2" style="color:#caf0f8;"></i>Entretien trimestriel</li>
                <li><i class="fas fa-check mr-2" style="color:#caf0f8;"></i>Intervention sous 24h</li>
              </ul>
              <a href="/rendez-vous" class="block text-center bg-white font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors" style="color:#03045e;">
                Planifier un entretien
              </a>
            </div>

            {/* Suivi */}
            <div class="card-hover p-8 rounded-3xl group" style="background:#eff6ff; border:1px solid rgba(0,119,182,0.12);">
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:rotate-12 transition-transform" style="background:linear-gradient(135deg,#0077b6,#00b4d8); color:#ffffff;">
                <i class="fas fa-chart-line" style="color:#ffffff;"></i>
              </div>
              <h3 class="text-2xl font-extrabold mb-4" style="color:#03045e;">Suivi de Performance</h3>
              <p class="mb-6" style="color:#475569;">Un espace client dédié pour consulter vos contrats, historiques d'interventions et alertes.</p>
              <ul class="text-sm space-y-2 mb-8" style="color:#64748b;">
                <li><i class="fas fa-check mr-2" style="color:#0077b6;"></i>Rapports mensuels</li>
                <li><i class="fas fa-check mr-2" style="color:#0077b6;"></i>Alertes pannes</li>
              </ul>
              <a href="/espace-client" class="inline-flex items-center font-semibold text-sm group-hover:translate-x-1 transition-transform" style="color:#0077b6;">
                Espace client <i class="fas fa-arrow-right ml-2"></i>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== AVANTAGES ===== */}
      <section class="py-20 px-4 max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div class="text-center mb-14">
          <div class="inline-block text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4" style="color:#0077b6; background:rgba(0,119,182,0.08); border:1px solid rgba(0,119,182,0.2);">Pourquoi MAASGA ?</div>
          <h2 class="text-3xl md:text-4xl font-extrabold mb-3" style="color:#03045e;">Une approche professionnelle</h2>
          <p class="max-w-xl mx-auto" style="color:#475569;">Une rigueur à chaque étape de votre projet de climatisation.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 reveal">
          {[
            { icon: "fa-clipboard-check", color: "#0077b6", glow: "rgba(0,119,182,0.1)",  title: "Visite technique gratuite", desc: "Visite technique pour dimensionner correctement vos installations." },
            { icon: "fa-file-pdf",        color: "#f87171", glow: "rgba(248,113,113,0.1)", title: "Devis PDF détaillé", desc: "Devis transparent et complet remis immédiatement après visite technique  et  installation." },
            { icon: "fa-sync-alt",        color: "#34d399", glow: "rgba(52,211,153,0.1)",  title: "Maintenance tri.", desc: "Plan d'entretien régulier pour garantir les performances et la durée de vie." },
            { icon: "fa-helmet-safety",    color: "#fbbf24", glow: "rgba(251,191,36,0.1)",  title: "Techniciens qualifiés", desc: "Équipe formée et certifiée, spécialisée en froid et climatisation." }
          ].map(av => (
            <div class="card-hover rounded-3xl p-6 text-center group" style="background:#ffffff; border:1px solid rgba(0,119,182,0.1);">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform" style={`background:${av.glow}; border:1px solid ${av.glow.replace('0.1','0.25')};`}>
                <i class={`fas ${av.icon} text-2xl`} style={`color:${av.color};`}></i>
              </div>
              <h3 class="font-bold mb-2" style="color:#03045e;">{av.title}</h3>
              <p class="text-sm leading-relaxed" style="color:#475569;">{av.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PRODUITS VEDETTES ===== */}
      <section id="ventes" class="py-20 overflow-hidden" style="background:#f8fbff;">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
            <div>
              <span class="text-xs font-bold tracking-widest uppercase" style="color:#0077b6;"></span>
              <h2 class="text-4xl font-extrabold mt-2" style="color:#03045e;">Le Meilleur du Froid</h2>
              <p class="mt-2" style="color:#475569;">Sélection des modèles les plus demandés à Ouagadougou</p>
            </div>
            <a href="/catalogue" class="inline-flex items-center space-x-2 font-semibold group transition-colors" style="color:#0077b6;">
              <span>Voir tout le catalogue</span>
              <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform text-sm"></i>
            </a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 reveal">
            {featuredProducts.length === 0 ? (
              <div class="col-span-3 text-center py-16">
                <i class="fas fa-box-open text-5xl mb-4" style="color:#caf0f8;"></i>
                <p style="color:#64748b;">Aucun produit disponible pour le moment.</p>
              </div>
            ) : featuredProducts.map(p => (
              <div class="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 group card-hover flex flex-col">
                {/* Image zone */}
                <div class="relative" style="background:linear-gradient(145deg,#f0f7ff,#dbeafe); padding:28px 24px 20px;">
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
                    <span class="absolute top-3 right-3 text-xs px-3 py-1 rounded-full font-bold" style="background:linear-gradient(135deg,#0077b6,#00b4d8); color:#ffffff;">INVERTER</span>
                  )}
                  <span class={`absolute top-3 left-3 text-xs px-3 py-1 rounded-full font-semibold ${p.stock > 3 ? 'badge-stock-ok' : p.stock > 0 ? 'badge-stock-low' : 'badge-stock-out'}`}>
                    {p.stock > 3 ? '✓ Disponible' : p.stock > 0 ? '⚠ Stock limité' : '✗ Rupture'}
                  </span>
                </div>
                {/* Contenu */}
                <div class="p-6 flex flex-col flex-1">
                  <div class="text-xs font-bold uppercase tracking-wider mb-1" style="color:#0077b6;">{p.brand}</div>
                  <h3 class="font-extrabold text-lg mb-2 leading-snug" style="color:#03045e;">{p.name}</h3>
                  <p class="text-sm mb-4 leading-relaxed" style="color:#64748b;">{p.description}</p>
                  <div class="flex items-end justify-between mb-5 mt-auto">
                    <div>
                      <div class="text-2xl font-extrabold" style="color:#0077b6;">{p.price.toLocaleString()} <span class="text-sm font-normal" style="color:#64748b;">FCFA</span></div>
                      <div class="text-xs font-semibold mt-0.5" style="color:#34d399;"><i class="fas fa-check-circle mr-1"></i>Installation et livraison offerte</div>
                    </div>
                    <div class="text-right">
                      <div class="text-base font-bold" style="color:#03045e;">{p.btu.toLocaleString()} BTU</div>
                      <div class="text-xs" style="color:#64748b;">{p.surface_min}–{p.surface_max} m²</div>
                    </div>
                  </div>
                  <a href={`/catalogue?product=${p.id}`} class="w-full btn-primary font-bold py-3.5 rounded-2xl flex items-center justify-center space-x-2 group-hover:shadow-lg transition-all text-sm" style="color:#ffffff;">
                    <i class="fas fa-eye text-sm" style="color:#ffffff;"></i>
                    <span style="color:#ffffff;">Voir & Commander</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Notice */}
          <div class="mt-8 rounded-2xl p-4 flex items-start space-x-3" style="background:rgba(251,191,36,0.06); border:1px solid rgba(251,191,36,0.2);">
            <i class="fas fa-exclamation-triangle mt-0.5 flex-shrink-0" style="color:#fbbf24;"></i>
            <p class="text-sm" style="color:#475569;">
              <strong style="color:#b45309;">Important :</strong> Toute commande est soumise à une Visite technique gratuite préalable sur site. Le paiement est effectué uniquement après cette visite et confirmation du devis.
            </p>
          </div>
        </div>
      </section>

      {/* ===== FONCTIONNALITÉS ===== */}
      <section class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-14">
            <div class="inline-block text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4" style="color:#0077b6; background:rgba(0,119,182,0.08); border:1px solid rgba(0,119,182,0.2);">Plateforme</div>
            <h2 class="text-3xl md:text-4xl font-extrabold mb-3" style="color:#03045e;">Nos fonctionnalités</h2>
            <p style="color:#475569;">Tout ce dont vous avez besoin sur une seule plateforme.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 reveal">
            {[
              { icon: "fa-th-large",       title: "Catalogue complet",  desc: "Tous nos climatiseurs avec fiches techniques, prix et disponibilité en temps réel.", href: "/catalogue",     color: "#0077b6" },
              { icon: "fa-calculator",     title: "Simulateur BTU",    desc: "Calculez la puissance idéale pour votre espace en quelques secondes.",        href: "/simulateur",    color: "#a78bfa" },
              { icon: "fa-tools",          title: "Installation Pro",  desc: "Pose par nos techniciens certifiés avec vérification finale garantie.",       href: "/rendez-vous",   color: "#34d399" },
              { icon: "fa-calendar-check", title: "Suivi entretien",   desc: "Rappels automatiques pour la maintenance et suivi de votre historique.",      href: "/espace-client", color: "#fbbf24" }
            ].map(f => (
              <a href={f.href} class="card-hover rounded-3xl p-6 text-center group block" style="background:#f8fbff; border:1px solid rgba(0,119,182,0.1);">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform" style={`background:${f.color}18; border:1px solid ${f.color}33;`}>
                  <i class={`fas ${f.icon} text-2xl`} style={`color:${f.color};`}></i>
                </div>
                <h3 class="font-bold mb-2" style="color:#03045e;">{f.title}</h3>
                <p class="text-sm leading-relaxed" style="color:#475569;">{f.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SIMULATEUR CTA ===== */}
      <section class="py-20 relative overflow-hidden" style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 50%,#eff6ff 100%);">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center reveal">
            <div>
              <div class="inline-flex items-center space-x-2 rounded-full px-4 py-2 text-sm font-semibold mb-5" style="background:rgba(167,139,250,0.12); border:1px solid rgba(167,139,250,0.3); color:#7c3aed;">
                <i class="fas fa-calculator"></i>
                <span>Outil gratuit</span>
              </div>
              <h2 class="text-3xl font-extrabold mb-4" style="color:#03045e;">Quel climatiseur pour votre pièce ?</h2>
              <p class="mb-6 leading-relaxed" style="color:#475569;">
                Notre simulateur BTU calcule en quelques secondes la puissance nécessaire pour climatiser efficacement votre espace.
              </p>
              <div class="space-y-3 mb-8">
                {["Surface de la pièce en m²","Hauteur du plafond","Exposition solaire","Nombre de fenêtres"].map(item => (
                  <div class="flex items-center space-x-3">
                    <i class="fas fa-check-circle text-sm" style="color:#34d399;"></i>
                    <span class="text-sm" style="color:#475569;">{item}</span>
                  </div>
                ))}
              </div>
              <a href="/simulateur" class="font-bold px-8 py-4 rounded-2xl inline-flex items-center space-x-3" style="background:#ffffff; color:#0077b6; border:2px solid rgba(0,119,182,0.3); box-shadow:0 4px 14px rgba(0,119,182,0.15); transition:all 0.3s ease;">
                <i class="fas fa-calculator"></i>
                <span>Lancer le simulateur BTU</span>
                <i class="fas fa-arrow-right text-sm"></i>
              </a>
            </div>

            {/* Calculator card */}
            <div class="bg-white rounded-3xl p-8 shadow-xl" style="border:1px solid rgba(0,119,182,0.1);">
              <div class="text-center mb-6">
                <div class="text-5xl mb-3">🧮</div>
                <h3 class="font-extrabold text-lg" style="color:#03045e;">Exemple de calcul</h3>
              </div>
              <div class="space-y-3">
                {[
                  { label: "Surface", value: "20 m²", icon: "fa-ruler-combined" },
                  { label: "Plafond", value: "2,8 m", icon: "fa-arrows-alt-v" },
                  { label: "Exposition", value: "Forte (sud)", icon: "fa-sun" },
                  { label: "Fenêtres", value: "2 grandes", icon: "fa-border-all" }
                ].map(item => (
                  <div class="flex items-center justify-between rounded-xl px-4 py-3" style="background:#f8fbff; border:1px solid rgba(0,119,182,0.1);">
                    <div class="flex items-center space-x-3">
                      <i class={`fas ${item.icon} w-4 text-sm`} style="color:#0077b6;"></i>
                      <span class="text-sm" style="color:#64748b;">{item.label}</span>
                    </div>
                    <span class="text-sm font-bold" style="color:#03045e;">{item.value}</span>
                  </div>
                ))}
                <div class="rounded-2xl px-4 py-5 text-center mt-4" style="background:linear-gradient(135deg,#0077b6,#00b4d8); box-shadow:0 8px 30px rgba(0,119,182,0.25);">
                  <div class="text-xs mb-1" style="color:#ffffff; opacity:0.8;">Puissance recommandée</div>
                  <div class="text-3xl font-extrabold" style="color:#ffffff;">12 000 BTU / 1,5 CV</div>
                  <div class="text-xs mt-1" style="color:#caf0f8;">→ 2 modèles compatibles</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== AVIS CLIENTS ===== */}
      <section class="py-20 px-4 max-w-7xl mx-auto sm:px-6 lg:px-8 reveal">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-12">
          <div>
            <div class="text-xs font-bold uppercase tracking-widest mb-3" style="color:#0077b6;">Témoignages</div>
            <h2 class="text-3xl font-extrabold mb-2" style="color:#03045e;">Ce que disent nos clients</h2>
            <p style="color:#475569;">Installations réalisées à Ouagadougou et environs</p>
          </div>
          <a href="/avis" class="mt-4 sm:mt-0 inline-flex items-center space-x-2 font-semibold" style="color:#0077b6;">
            <span>Voir tous les avis</span>
            <i class="fas fa-arrow-right text-sm"></i>
          </a>
        </div>

        {topReviews.length === 0 ? (
          <div class="text-center py-12 rounded-3xl" style="background:#f8fbff; border:1px solid rgba(0,119,182,0.1);">
            <i class="fas fa-star text-4xl mb-3" style="color:#caf0f8;"></i>
            <p style="color:#64748b;">Aucun avis pour le moment. Soyez le premier !</p>
            <a href="/avis" class="inline-block mt-4 text-sm font-bold px-6 py-2.5 rounded-xl" style="background:#ffffff; color:#0077b6; border:2px solid rgba(0,119,182,0.3); box-shadow:0 4px 14px rgba(0,119,182,0.12);">Laisser un avis</a>
          </div>
        ) : (
          <div class="relative">
            <div id="testimonial-carousel" class="flex gap-6 overflow-x-auto scroll-smooth pb-4" style="scrollbar-width:none; -webkit-overflow-scrolling:touch;">
              {[...topReviews, ...topReviews].map((r, idx) => (
                <div class="rounded-3xl p-6 flex-shrink-0 shadow-sm hover:shadow-lg transition-all" style="min-width:320px; max-width:360px; background:#ffffff; border:1px solid rgba(0,119,182,0.1);">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex space-x-0.5">
                      {[1,2,3,4,5].map(s => (
                        <i class={`fas fa-star text-sm ${s <= r.note ? 'star-filled' : 'star-empty'}`}></i>
                      ))}
                    </div>
                    <span class="text-xs" style="color:#94a3b8;">{r.date}</span>
                  </div>
                  <p class="text-sm leading-relaxed mb-4 italic" style="color:#475569;">"{r.comment}"</p>
                  <div class="flex items-center space-x-3">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center" style="background:rgba(0,119,182,0.08); border:1px solid rgba(0,119,182,0.15);">
                      <i class="fas fa-user text-sm" style="color:#0077b6;"></i>
                    </div>
                    <div>
                      <div class="text-sm font-bold" style="color:#03045e;">{r.name}</div>
                      <div class="text-xs" style="color:#64748b;">{r.service}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div class="flex justify-center mt-6 space-x-2">
              {topReviews.map((_, i) => (
                <button onclick={`scrollCarousel(${i})`} class="carousel-dot h-2.5 rounded-full transition-all" style={i === 0 ? 'background:#0077b6; width:20px;' : 'background:rgba(0,119,182,0.25); width:10px;'}></button>
              ))}
            </div>
            <script dangerouslySetInnerHTML={{ __html: `
              (function() {
                var c = document.getElementById('testimonial-carousel');
                if (!c) return;
                var cw = 344, ci = 0, tc = ${topReviews.length};
                var dots = document.querySelectorAll('.carousel-dot');
                function ud(i) { dots.forEach(function(d,j){ d.style.background = j===i ? '#0077b6' : 'rgba(0,119,182,0.25)'; d.style.width = j===i ? '20px' : '10px'; }); }
                window.scrollCarousel = function(i) { ci = i; c.scrollTo({ left: i * cw, behavior: 'smooth' }); ud(i); };
                setInterval(function() { ci = (ci + 1) % tc; c.scrollTo({ left: ci * cw, behavior: 'smooth' }); ud(ci); }, 4500);
              })();
            ` }} />
          </div>
        )}

        {topReviews.length > 0 && (
          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div class="flex items-center space-x-2">
              <div class="flex space-x-0.5">
                {[1,2,3,4,5].map(_ => <i class="fas fa-star text-yellow-400 text-sm"></i>)}
              </div>
              <span class="text-xl font-extrabold" style="color:#03045e;">{displayNote}</span>
            </div>
            <div class="text-sm" style="color:#475569;">Noté par <strong style="color:#03045e;">{displayClients}</strong> clients à Ouagadougou</div>
            <a href="/avis" class="text-xs font-bold px-4 py-2 rounded-xl" style="background:rgba(0,119,182,0.08); color:#0077b6; border:1px solid rgba(0,119,182,0.2);">Déposer mon avis</a>
          </div>
        )}
      </section>

      {/* ===== FAQ ===== */}
      <section class="py-20 px-4 max-w-4xl mx-auto sm:px-6 lg:px-8 reveal">
        <div class="text-center mb-12">
          <div class="inline-block text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4" style="color:#0077b6; background:rgba(0,119,182,0.08); border:1px solid rgba(0,119,182,0.2);">FAQ</div>
          <h2 class="text-3xl md:text-4xl font-extrabold mb-3" style="color:#03045e;">Questions fréquentes</h2>
          <p style="color:#475569;">Tout ce que vous devez savoir avant de commander</p>
        </div>
        <div class="space-y-3">
          {[
            { q: "Les prix incluent-ils l'installation ?", a: "Oui. Tous nos prix catalogue incluent la livraison et l'installation complète par nos techniciens certifiés. Aucuns frais cachés." },
            { q: "Comment se déroule la visite technique ?", a: "Un technicien MAASGA se déplace gratuitement chez vous pour évaluer les besoins (surface, orientation, nombre de fenêtres). Il vous remet ensuite un devis PDF détaillé. Aucun engagement avant validation." },
            { q: "Quel est le délai d'installation ?", a: "En général, l'installation est réalisée sous 48 à 72h après validation du devis. Pour les urgences (dépannage, panne), nous intervenons sous 24h." },
            { q: "Proposez-vous la maintenance / entretien ?", a: "Oui, nous proposons des contrats de maintenance trimestrielle pour garantir les performances et la longévité de votre équipement. Nettoyage filtres, vérification gaz, contrôle électrique." },
            { q: "Quels modes de paiement acceptez-vous ?", a: "Paiement en espèces, LigdiCash (paiement mobile sécurisé — Orange Money, Moov Money et plus), Wave ou virement bancaire. Le paiement se fait uniquement après la visite technique et votre validation du devis." },
            { q: "Quelle garantie sur les climatiseurs ?", a: "Tous nos climatiseurs sont neufs et bénéficient d'une garantie constructeur (1 à 3 ans selon les marques). MAASGA assure le service après-vente." },
            { q: "Couvrez-vous tout Ouagadougou ?", a: "Oui, nous intervenons dans tous les arrondissements de Ouagadougou et dans les zones périphériques. Contactez-nous pour vérifier la couverture de votre secteur." }
          ].map((faq, i) => (
            <details class="group rounded-2xl overflow-hidden" style="background:#ffffff; border:1px solid rgba(0,119,182,0.1);">
              <summary class="flex items-center justify-between p-5 cursor-pointer list-none">
                <span class="font-bold text-sm pr-4" style="color:#03045e;">{faq.q}</span>
                <i class="fas fa-chevron-down text-xs transition-transform group-open:rotate-180 flex-shrink-0" style="color:#0077b6;"></i>
              </summary>
              <div class="px-5 pb-5 text-sm leading-relaxed" style="color:#475569;">
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
      <section class="py-20 relative overflow-hidden reveal" style="background:linear-gradient(135deg,#03045e 0%,#0077b6 100%);">
        <div class="glow-dot w-80 h-80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style="background:rgba(0,180,216,0.15);"></div>
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <i class="fas fa-snowflake text-4xl mb-5 animate-pulse-slow" style="color:#caf0f8;"></i>
          <h2 class="text-3xl md:text-4xl font-extrabold mb-4" style="color:#ffffff;">Prêt à profiter du confort climatisé ?</h2>
          <p class="mb-4 text-lg max-w-2xl mx-auto" style="color:#caf0f8; opacity:0.9;">
            Contactez-nous dès aujourd'hui. Visite technique gratuite, devis PDF sous 24h, installation par nos experts certifiés.
          </p>

          <div class="inline-flex items-center space-x-2 mb-8 px-5 py-2.5 rounded-full" style="background:rgba(56,189,248,0.12); border:1px solid rgba(56,189,248,0.3);">
            <i class="fas fa-phone-alt text-sm" style="color:#38bdf8;"></i>
            <span class="text-sm font-bold" style="color:#caf0f8;">Devis gratuit sous 24h — Appelez le 55 99 64 18</span>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/rendez-vous" class="bg-white font-extrabold px-10 py-4 rounded-2xl text-lg flex items-center justify-center space-x-3 hover:bg-blue-50 transition-all shadow-lg" style="color:#03045e;">
              <i class="fas fa-calendar-plus" style="color:#0077b6;"></i>
              <span>Demander un devis gratuit</span>
            </a>
            <a href="/catalogue" class="btn-secondary font-extrabold px-10 py-4 rounded-2xl text-lg flex items-center justify-center space-x-3" style="border-color:rgba(202,240,248,0.35); color:white; background:rgba(255,255,255,0.1);">
              <i class="fas fa-th-large"></i>
              <span>Voir le catalogue</span>
            </a>
          </div>
          <p class="text-sm mt-6" style="color:#caf0f8; opacity:0.6;">
            <i class="fas fa-shield-alt mr-2"></i>
            Visite technique gratuite obligatoire · Paiement après visite · Satisfaction garantie
          </p>
          <div class="flex items-center justify-center space-x-4 mt-4">
            <div class="flex -space-x-1.5">
              {['M','A','S'].map((l, i) => (
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white border-2" style={`background:${['#0096c7','#00b4d8','#48cae4'][i]}; border-color:#03045e; z-index:${3-i};`}>{l}</div>
              ))}
            </div>
            <span class="text-xs" style="color:#caf0f8; opacity:0.6;">Faites confiance à <strong class="text-white">MAASGA</strong> pour votre climatisation</span>
          </div>
        </div>
      </section>

      {/* ===== GSAP — snow only (le CSS fade-in-up gère le héro) ===== */}
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

    </Layout>
  )
}
