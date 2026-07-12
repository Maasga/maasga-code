import { Layout } from '../components/Layout'

// Types de projets — exemples de services proposés (pas de faux témoignages)
const typesDeProjet = [
  {
    id: 1,
    titre: "Villas & Résidences",
    type: "Résidentiel",
    description: "Installation de climatiseurs splits dans les villas et résidences. Étude thermique sur site, dimensionnement BTU adapté, installation soignée et mise en service incluse.",
    exemples: ["Villa 3 à 5 pièces", "Résidence haut standing", "Appartements"],
    icon: "fa-home",
    color: "from-cyan-500/20 to-blue-600/20",
    accent: "#38bdf8"
  },
  {
    id: 2,
    titre: "Bureaux & Open-spaces",
    type: "Professionnel",
    description: "Climatisation d'espaces de travail pour un confort optimal des équipes. Systèmes split ou cassette selon la configuration.",
    exemples: ["Bureaux privés", "Open-spaces", "Salles de réunion"],
    icon: "fa-building",
    color: "from-purple-500/20 to-violet-600/20",
    accent: "#a78bfa"
  },
  {
    id: 3,
    titre: "Commerces & Boutiques",
    type: "Commercial",
    description: "Solutions de climatisation pour les espaces commerciaux. Amélioration du confort client et de l'expérience d'achat.",
    exemples: ["Boutiques", "Restaurants", "Pharmacies"],
    icon: "fa-store",
    color: "from-green-500/20 to-emerald-600/20",
    accent: "#34d399"
  },
  {
    id: 4,
    titre: "Locaux médicaux",
    type: "Professionnel",
    description: "Climatisation adaptée aux contraintes médicales : niveau sonore bas, filtration renforcée, contrôle hygiénique.",
    exemples: ["Cliniques", "Cabinets médicaux", "Laboratoires"],
    icon: "fa-hospital",
    color: "from-red-500/20 to-rose-600/20",
    accent: "#fb7185"
  },
  {
    id: 5,
    titre: "Maintenance & SAV",
    type: "Service",
    description: "Entretien préventif et dépannage de climatiseurs toutes marques. Nettoyage, recharge gaz, vérification électrique.",
    exemples: ["Nettoyage périodique", "Recharge de gaz", "Dépannage urgent"],
    icon: "fa-tools",
    color: "from-orange-500/20 to-amber-600/20",
    accent: "#f59e0b"
  },
  {
    id: 6,
    titre: "Événementiel & Conférences",
    type: "Commercial",
    description: "Climatisation temporaire ou permanente de salles d'événements, conférences et espaces de réception.",
    exemples: ["Salles de conférences", "Espaces événementiels", "Hôtels"],
    icon: "fa-calendar-alt",
    color: "from-teal-500/20 to-cyan-600/20",
    accent: "#2dd4bf"
  },
]

export const RealisationsPage = ({ realisations = [] }: { realisations?: any[] }) => {
  const hasRealisations = realisations.length > 0
  return (
    <Layout title="Nos Services — MAASGA Climatisation Ouagadougou" activePage="realisations" canonicalPath="/realisations" description="Services MAASGA — Installation, maintenance et dépannage de climatiseurs à Ouagadougou. Résidentiel, professionnel, commercial.">

      {/* Hero */}
      <section class="gradient-hero py-16 text-white text-center relative overflow-hidden">
        <div class="max-w-4xl mx-auto px-4 relative z-10">
          <div class="inline-flex items-center space-x-2 bg-white/15 border border-white/20 rounded-full px-4 py-2 text-sm mb-4">
            <i class="fas fa-snowflake text-ice-300"></i>
            <span>Services de climatisation · Ouagadougou, Burkina Faso</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-bold mb-4">Nos Services & Réalisations</h1>
          <p class="text-blue-100/90 text-lg max-w-xl mx-auto">
            Découvrez les types de projets que nous réalisons pour des particuliers et des professionnels à Ouagadougou.
          </p>
        </div>
      </section>

      {/* Services */}
      <section class="py-10" style="border-bottom:1px solid rgba(56,189,248,0.08);">
        <div class="max-w-5xl mx-auto px-4">
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: "fa-shield-alt", value: "Certifiés", label: "Techniciens formés" },
              { icon: "fa-map-marker-alt", value: "Ouagadougou", label: "Zone d'intervention" },
              { icon: "fa-clock", value: "48-72h", label: "Délai d'installation" },
            ].map(s => (
              <div class="glass-card rounded-2xl p-4 text-center">
                <div class="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.2);">
                  <i class={`fas ${s.icon}`} style="color:#38bdf8;"></i>
                </div>
                <div class="text-lg font-bold text-white">{s.value}</div>
                <div class="text-xs mt-1" style="color:#64748b;">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grille des types de projets */}
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {/* Filtre par type */}
        <div class="flex flex-wrap gap-2 mb-10 justify-center">
          {["Tous", "Résidentiel", "Professionnel", "Commercial", "Service"].map(f => (
            <button onclick={`filterReal(this,'${f}')`} data-filter={f} class={`filter-real-btn px-4 py-2 rounded-full text-sm font-semibold border transition-all ${f === 'Tous' ? 'active-real' : ''}`} style={f === 'Tous' ? 'background:rgba(56,189,248,0.15); color:#38bdf8; border-color:rgba(56,189,248,0.4);' : 'background:transparent; color:#8ba3c0; border-color:rgba(148,180,220,0.15);'}>
              {f}
            </button>
          ))}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" id="real-grid">
          {typesDeProjet.map(r => (
            <div data-tilt class={`real-card glass-card rounded-2xl overflow-hidden reveal`} data-type={r.type}>
              <div class={`tilt-image relative h-40 flex items-center justify-center bg-gradient-to-br ${r.color}`} style="border-bottom:1px solid rgba(56,189,248,0.08);">
                <i class={`fas ${r.icon} text-5xl`} style={`color:${r.accent}; opacity:0.6;`}></i>
                <span class="absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full" style={`background:rgba(11,17,32,0.8); color:${r.accent}; border:1px solid ${r.accent}33;`}>{r.type}</span>
              </div>
              <div class="tilt-caption p-5">
                <h3 class="font-bold text-white mb-2 text-base leading-snug">{r.titre}</h3>
                <p class="text-xs mb-4 leading-relaxed" style="color:#8ba3c0;">{r.description}</p>
                <div class="space-y-1.5 mb-4">
                  {r.exemples.map(ex => (
                    <div class="flex items-center space-x-2 text-xs" style="color:#94a3b8;">
                      <i class="fas fa-check text-xs" style={`color:${r.accent};`}></i>
                      <span>{ex}</span>
                    </div>
                  ))}
                </div>
                <a href="/rendez-vous" class="inline-flex items-center space-x-2 text-xs font-semibold rounded-xl px-4 py-2 transition-all" style={`color:${r.accent}; background:rgba(56,189,248,0.05); border:1px solid ${r.accent}22;`}>
                  <i class="fas fa-calendar-plus"></i>
                  <span>Demander un devis</span>
                </a>
              </div>
              <div class="tilt-shine" aria-hidden="true"></div>
            </div>
          ))}
        </div>

        {/* Galerie des réalisations desde DB */}
        {hasRealisations ? (
        <div class="mt-14 reveal">
          <h2 class="text-2xl font-bold text-white mb-8 text-center">Nos dernières réalisations</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {realisations.map((r: any) => (
              <div data-tilt class="glass-card rounded-2xl overflow-hidden">
                {r.image_url ? (
                  <img src={r.image_url} alt={r.title} loading="lazy" class="tilt-image w-full h-48 object-cover" />
                ) : (
                  <div class="tilt-image w-full h-48 flex items-center justify-center" style="background:rgba(56,189,248,0.07); border-bottom:1px solid rgba(56,189,248,0.08);">
                    <i class="fas fa-snowflake text-4xl" style="color:#38bdf8; opacity:0.4;"></i>
                  </div>
                )}
                <div class="tilt-caption p-5">
                  {r.is_featured ? <span class="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2" style="background:rgba(251,191,36,0.15); color:#fbbf24;">⭐ À la une</span> : null}
                  <h3 class="font-bold text-white mb-1 text-sm leading-snug">{r.title}</h3>
                  {r.description && <p class="text-xs mb-2 leading-relaxed" style="color:#8ba3c0;">{r.description}</p>}
                  <div class="flex items-center justify-between mt-3">
                    {r.category && <span class="text-xs px-2 py-0.5 rounded-full" style="background:rgba(56,189,248,0.1); color:#38bdf8;">{r.category}</span>}
                    {r.quartier && <span class="text-xs" style="color:#64748b;"><i class="fas fa-map-marker-alt mr-1"></i>{r.quartier}</span>}
                  </div>
                </div>
                <div class="tilt-shine" aria-hidden="true"></div>
              </div>
            ))}
          </div>
        </div>
        ) : (
        <div data-tilt class="mt-14 rounded-3xl p-8 text-center reveal" style="background:rgba(56,189,248,0.04); border:1px solid rgba(56,189,248,0.1);">
          <i class="tilt-image fas fa-camera text-3xl mb-3" style="color:#38bdf8; opacity:0.5;"></i>
          <h3 class="text-lg font-bold mb-2 text-white">Galerie photos en préparation</h3>
          <p class="text-sm mb-4 max-w-lg mx-auto" style="color:#8ba3c0;">Nous préparons une galerie de nos installations réelles. En attendant, consultez les avis de nos clients.</p>
          <a href="/avis" class="inline-flex items-center space-x-2 font-semibold text-sm" style="color:#38bdf8;">
            <span>Voir les avis clients</span>
            <i class="fas fa-arrow-right"></i>
          </a>
          <div class="tilt-shine" aria-hidden="true"></div>
        </div>
        )}

        {/* CTA */}
        <div data-tilt class="mt-8 rounded-3xl p-8 text-center reveal" style="background:linear-gradient(135deg,rgba(56,189,248,0.06),rgba(139,92,246,0.06)); border:1px solid rgba(56,189,248,0.15);">
          <div class="tilt-image text-4xl mb-4">❄️</div>
          <h2 class="text-2xl font-bold mb-3 text-white">Votre projet de climatisation ?</h2>
          <p class="text-sm mb-6 max-w-lg mx-auto" style="color:#8ba3c0;">Visite technique gratuite, devis PDF sous 24h, installation par nos techniciens certifiés.</p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/rendez-vous" class="btn-primary text-white font-bold px-8 py-3.5 rounded-2xl inline-flex items-center justify-center space-x-2">
              <i class="fas fa-calendar-check"></i>
              <span>Demander un devis gratuit</span>
            </a>
            <a href="/catalogue" class="font-bold px-8 py-3.5 rounded-2xl inline-flex items-center justify-center space-x-2 transition-all hover:bg-white/5" style="color:#38bdf8; border:1px solid rgba(56,189,248,0.25);">
              <i class="fas fa-th-large"></i>
              <span>Voir le catalogue</span>
            </a>
          </div>
          <div class="tilt-shine" aria-hidden="true"></div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function filterReal(btn, filter) {
          document.querySelectorAll('.filter-real-btn').forEach(b => {
            b.style.background = 'transparent';
            b.style.color = '#8ba3c0';
            b.style.borderColor = 'rgba(148,180,220,0.15)';
          });
          btn.style.background = 'rgba(56,189,248,0.15)';
          btn.style.color = '#38bdf8';
          btn.style.borderColor = 'rgba(56,189,248,0.4)';
          document.querySelectorAll('.real-card').forEach(card => {
            if (filter === 'Tous') {
              card.style.display = '';
            } else {
              card.style.display = card.dataset.type === filter ? '' : 'none';
            }
          });
        }
      `}} />

    </Layout>
  )
}
