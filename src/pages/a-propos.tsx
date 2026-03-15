import { Layout } from '../components/Layout'

export const AProposPage = () => {
  const jsonLdOrg = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MAASGA Climatisation",
    "url": "https://maasga-website.pages.dev",
    "logo": "https://maasga-website.pages.dev/og-image.png",
    "description": "Expert en vente, installation et maintenance de climatiseurs à Ouagadougou, Burkina Faso",
    "foundingDate": "2019",
    "areaServed": { "@type": "City", "name": "Ouagadougou" },
    "contactPoint": { "@type": "ContactPoint", "telephone": "+22655996418", "contactType": "customer service", "availableLanguage": "French" }
  })
  return (
    <Layout title="À propos de MAASGA - Expert Climatisation Burkina Faso" activePage="apropos" canonicalPath="/a-propos" description="À propos de MAASGA — Expert climatisation depuis 5 ans à Ouagadougou, Burkina Faso. Équipe certifiée, +500 installations, SAV réactif." jsonLd={jsonLdOrg}>

      {/* Hero */}
      <section class="gradient-hero py-20 text-white relative overflow-hidden">
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
          <div class="absolute -bottom-20 -left-20 w-80 h-80 bg-ice-400/5 rounded-full blur-3xl"></div>
        </div>
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="inline-flex items-center space-x-2 bg-white/15 border border-white/20 rounded-full px-4 py-2 text-sm mb-6">
            <i class="fas fa-building text-ice-300"></i>
            <span>Notre histoire · Nos valeurs</span>
          </div>
          <h1 class="text-5xl font-bold mb-6">À propos de MAASGA</h1>
          <p class="text-xl text-blue-100/90 leading-relaxed max-w-2xl">
            Spécialiste en climatisation au Burkina Faso depuis 5 ans. Notre mission : apporter le confort thermique à chaque foyer et entreprise du pays avec professionnalisme et intégrité.
          </p>
        </div>
      </section>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Notre histoire */}
        <section class="mb-16 reveal">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 class="text-3xl font-bold mb-6" style="color:#03045e;">Notre histoire</h2>
              <div class="space-y-4 leading-relaxed" style="color:#111827;">
                <p>
                  Fondée à Ouagadougou, MAASGA est née d'une conviction : le marché burkinabé méritait un prestataire de climatisation <strong>vraiment professionnel</strong>, transparent et orienté client.
                </p>
                <p>
                  Face à un marché informel et des installations souvent mal dimensionnées, nous avons imposé une méthode rigoureuse : <strong>Visite technique gratuite obligatoire avant toute installation</strong>, devis PDF détaillé, et suivi post-installation régulier.
                </p>
                <p>
                  Aujourd'hui, MAASGA compte plus de <strong>500 clients satisfaits</strong> à Ouagadougou et ambitionne de devenir la référence nationale en froid et climatisation au Burkina Faso.
                </p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              {[
                { val: "100+", label: "Installations réalisées", icon: "fa-tools", color: "from-blue-500 to-blue-600" },
                { val: "5 ans", label: "D'expérience", icon: "fa-star", color: "from-yellow-500 to-orange-500" },
                { val: "99%", label: "Taux de satisfaction", icon: "fa-smile", color: "from-green-500 to-emerald-600" },
                { val: "<2h", label: "Délai de réponse", icon: "fa-bolt", color: "from-purple-500 to-primary-600" }
              ].map(s => (
                <div class={`bg-gradient-to-br ${s.color} text-white rounded-2xl p-5 text-center hover-lift`}>
                  <i class={`fas ${s.icon} text-2xl mb-2`} style="color:#ffffff;"></i>
                  <div class="text-2xl font-bold" style="color:#ffffff;">{s.val}</div>
                  <div class="text-xs mt-1" style="color:#ffffff; opacity:0.9;">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Nos valeurs */}
        <section class="mb-16 reveal">
          <div class="text-center mb-10">
            <h2 class="text-3xl font-bold text-white mb-3">Nos valeurs</h2>
            <p class="max-w-xl mx-auto" style="color:#8ba3c0;">Les principes qui guident chacune de nos interventions.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "fa-shield-alt", color: "#38bdf8",  bg: "rgba(56,189,248,0.1)",  title: "Intégrité",   desc: "Transparence totale dans nos devis et nos pratiques. Ce que nous promettons, nous le réalisons." },
              { icon: "fa-graduation-cap", color: "#34d399", bg: "rgba(52,211,153,0.1)",  title: "Expertise",  desc: "Techniciens formés et certifiés en froid et climatisation. Mise à jour permanente des compétences." },
              { icon: "fa-clock",          color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  title: "Réactivité", desc: "Réponse sous 2h, déplacement rapide. Votre confort ne peut pas attendre." },
              { icon: "fa-leaf",           color: "#a78bfa", bg: "rgba(167,139,250,0.1)", title: "Durabilité", desc: "Nous préconisons des solutions économes en énergie et respectueuses de l'environnement." }
            ].map(v => (
              <div class="glass-card rounded-2xl p-6 text-center hover:-translate-y-1 transition-all hover-lift">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={`background:${v.bg}; border:1px solid ${v.bg.replace('0.1','0.25')};`}>
                  <i class={`fas ${v.icon} text-2xl`} style={`color:${v.color};`}></i>
                </div>
                <h3 class="font-bold text-white mb-2">{v.title}</h3>
                <p class="text-sm leading-relaxed" style="color:#8ba3c0;">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Notre équipe */}
        <section class="mb-16 rounded-3xl p-10 reveal" style="background:rgba(56,189,248,0.04); border:1px solid rgba(56,189,248,0.1);">
          <div class="text-center mb-10">
            <h2 class="text-3xl font-bold mb-3" style="color:#03045e;">Notre équipe</h2>
            <p style="color:#475569;">Des professionnels passionnés par leur métier.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">

            {/* Directeur Technique */}
            <div class="glass-card rounded-2xl p-6 text-center hover-lift">
              <div class="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden" style="border:3px solid rgba(0,119,182,0.25); box-shadow:0 4px 20px rgba(0,119,182,0.15);">
                <img src="/cherif.jpeg" alt="Sherif SAWADOGO" loading="lazy" width={112} height={112} class="w-full h-full object-cover" />
              </div>
              <h3 class="font-extrabold text-lg mb-1" style="color:#03045e;">Sherif SAWADOGO</h3>
              <p class="text-sm font-semibold mb-1" style="color:#0077b6;">Directeur Technique</p>
              <p class="text-xs mb-3" style="color:#64748b;">Chef d'équipe installation · 8 ans d'expérience</p>
              <div class="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold" style="background:rgba(0,119,182,0.08); color:#0077b6; border:1px solid rgba(0,119,182,0.2);">
                <i class="fas fa-hard-hat text-xs" style="color:#ffffff; background:#0077b6; padding:3px 4px; border-radius:4px;"></i>
                <span>Directeur technique</span>
              </div>
            </div>

            {/* Directeur Commercial */}
            <div class="glass-card rounded-2xl p-6 text-center hover-lift">
              <div class="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden" style="border:3px solid rgba(0,119,182,0.25); box-shadow:0 4px 20px rgba(0,119,182,0.15);">
                <img src="/malick.jpg" alt="Kompaore Abdoul Malick" loading="lazy" width={112} height={112} class="w-full h-full object-cover" />
              </div>
              <h3 class="font-extrabold text-lg mb-1" style="color:#03045e;">Kompaore Abdoul Malick</h3>
              <p class="text-sm font-semibold mb-1" style="color:#0077b6;">Directeur Commercial</p>
              <p class="text-xs mb-3" style="color:#64748b;">Devis & relation client · 4 ans d'expérience</p>
              <div class="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold" style="background:rgba(0,119,182,0.08); color:#0077b6; border:1px solid rgba(0,119,182,0.2);">
                <i class="fas fa-handshake text-xs" style="color:#ffffff; background:#0077b6; padding:3px 4px; border-radius:4px;"></i>
                <span>Expert commercial</span>
              </div>
            </div>

            {/* Directrice Marketing */}
            <div class="glass-card rounded-2xl p-6 text-center hover-lift">
              <div class="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden" style="border:3px solid rgba(0,119,182,0.25); box-shadow:0 4px 20px rgba(0,119,182,0.15);">
                <img src="/ines.jpeg" alt="Inès" loading="lazy" width={112} height={112} class="w-full h-full object-cover" />
              </div>
              <h3 class="font-extrabold text-lg mb-1" style="color:#03045e;">Inès</h3>
              <p class="text-sm font-semibold mb-1" style="color:#0077b6;">Directrice Marketing</p>
              <p class="text-xs mb-3" style="color:#64748b;">Stratégie & communication</p>
              <div class="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold" style="background:rgba(0,119,182,0.08); color:#0077b6; border:1px solid rgba(0,119,182,0.2);">
                <i class="fas fa-bullhorn text-xs" style="color:#ffffff; background:#0077b6; padding:3px 4px; border-radius:4px;"></i>
                <span>Directrice marketing</span>
              </div>
            </div>

          </div>
        </section>

        {/* Zones d'intervention */}
        <section class="mb-16 reveal">
          <div class="text-center mb-10">
            <h2 class="text-3xl font-bold text-white mb-3">Zones d'intervention</h2>
            <p style="color:#8ba3c0;">MAASGA intervient dans tout Ouagadougou et les communes environnantes.</p>
          </div>
          <div class="glass-card rounded-2xl p-8">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                "Ouaga 2000","Wemtenga","Pissy","Gounghin","Dassasgo","Patte d'Oie",
                "Tanghin","Zogona","Bilbalogho","Kalgondin","Secteur 15","Secteur 22",
                "Secteur 25","Secteur 30","Tampouy","Quartier Zone du Bois"
              ].map(q => (
                <div class="flex items-center space-x-2 py-2 px-3 rounded-xl" style="background:rgba(56,189,248,0.07); border:1px solid rgba(56,189,248,0.12);">
                  <i class="fas fa-map-marker-alt text-xs" style="color:#38bdf8;"></i>
                  <span class="text-sm font-medium" style="color:#7a9cc4;">{q}</span>
                </div>
              ))}
            </div>
            <div class="mt-4 text-center text-sm" style="color:#64748b;">
              <i class="fas fa-info-circle mr-2" style="color:#38bdf8;"></i>
              Votre quartier n'est pas listé ? Contactez-nous, nous étudions chaque demande.
            </div>
          </div>
        </section>

        {/* CTA */}
        <section class="text-center gradient-hero text-white rounded-3xl p-12">
          <i class="fas fa-snowflake text-5xl text-ice-300 mb-4 animate-pulse-slow"></i>
          <h2 class="text-3xl font-bold mb-4">Travaillons ensemble</h2>
          <p class="text-blue-100/90 mb-8 max-w-xl mx-auto">
            Faites confiance aux experts MAASGA pour votre projet  de climatisation. Devis gratuit, intervention rapide.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/rendez-vous" class="btn-primary text-white font-bold px-8 py-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg">
              <i class="fas fa-calendar-plus"></i>
              <span>Prendre rendez-vous</span>
            </a>
            <a href="/contact" class="font-bold px-8 py-4 rounded-2xl flex items-center justify-center space-x-2" style="background:transparent; border:2px solid #ffffff; color:#ffffff;">
              <i class="fas fa-envelope"></i>
              <span>Nous contacter</span>
            </a>
          </div>
        </section>
      </div>
    </Layout>
  )
}
