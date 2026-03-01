import { Layout } from '../components/Layout'

const realisations = [
  {
    id: 1,
    titre: "Villa 4 pièces — Ouaga 2000",
    type: "Installation complète",
    description: "Installation de 3 splits Daikin 12 000 BTU inverter dans une villa neuve. Travaux réalisés en 1 journée sans nuisance.",
    quartier: "Ouaga 2000",
    date: "Mars 2025",
    surface: "120 m²",
    produits: "3× Daikin 12 000 BTU Inverter",
    note: 5,
    commentaire: "Service impeccable, techniciens ponctuels et propres. Je recommande vivement !",
    client: "M. Traoré",
    emoji: "🏡",
    color: "from-cyan-500/20 to-blue-600/20",
    accent: "#38bdf8"
  },
  {
    id: 2,
    titre: "Bureau open-space — Zone du Bois",
    type: "Installation professionnelle",
    description: "Climatisation d'un espace de travail de 80 m² pour 12 personnes. Choix d'un système VRF pour une gestion individuelle des zones.",
    quartier: "Zone du Bois",
    date: "Février 2025",
    surface: "80 m²",
    produits: "2× Midea 18 000 BTU + 1× Samsung 24 000 BTU",
    note: 5,
    commentaire: "Résultat bluffant. Les employés sont beaucoup plus productifs depuis l'installation.",
    client: "Société AXIM",
    emoji: "🏢",
    color: "from-purple-500/20 to-violet-600/20",
    accent: "#a78bfa"
  },
  {
    id: 3,
    titre: "Appartement F3 — Wemtenga",
    type: "Remplacement appareil",
    description: "Remplacement d'un ancien climatiseur non-inverter par un modèle LG dernière génération. Économie d'énergie estimée à 40 %.",
    quartier: "Wemtenga",
    date: "Janvier 2025",
    surface: "65 m²",
    produits: "1× LG 9 000 BTU Inverter Wi-Fi",
    note: 5,
    commentaire: "Le remplacement a été rapide et propre. La facture d'électricité a déjà baissé.",
    client: "Mme Sawadogo",
    emoji: "🏠",
    color: "from-green-500/20 to-emerald-600/20",
    accent: "#34d399"
  },
  {
    id: 4,
    titre: "Clinique privée — Dassasgho",
    type: "Installation médicale",
    description: "Climatisation de 4 salles de consultation et 1 salle d'attente. Contraintes médicales respectées (niveau sonore et hygiène).",
    quartier: "Dassasgho",
    date: "Décembre 2024",
    surface: "200 m²",
    produits: "5× Midea 9 000 BTU & 12 000 BTU",
    note: 5,
    commentaire: "Très professionnel. Ils ont su s'adapter aux exigences d'un environnement médical.",
    client: "Clinique Santé Plus",
    emoji: "🏥",
    color: "from-red-500/20 to-rose-600/20",
    accent: "#fb7185"
  },
  {
    id: 5,
    titre: "Restaurant — Secteur 15",
    type: "Installation & maintenance",
    description: "Installation de 2 unités murales dans la salle de restauration. Contrat de maintenance trimestrielle signé.",
    quartier: "Secteur 15",
    date: "Novembre 2024",
    surface: "55 m²",
    produits: "2× Samsung 18 000 BTU Inverter",
    note: 5,
    commentaire: "Nos clients profitent maintenant d'une vraie fraîcheur. Le chiffre d'affaires a augmenté !",
    client: "Restaurant Le Délice",
    emoji: "🍽️",
    color: "from-orange-500/20 to-amber-600/20",
    accent: "#f59e0b"
  },
  {
    id: 6,
    titre: "Résidence haut standing — Karpala",
    type: "Multi-installation",
    description: "Équipement complet d'une résidence de 5 chambres avec des appareils inverter haut de gamme. Installation en 2 jours.",
    quartier: "Karpala",
    date: "Octobre 2024",
    surface: "250 m²",
    produits: "5× Daikin 12 000 & 18 000 BTU Inverter",
    note: 5,
    commentaire: "Équipe sérieuse, travail soigné. Les finitions sont parfaites.",
    client: "M. Ouédraogo",
    emoji: "🏘️",
    color: "from-sky-500/20 to-indigo-600/20",
    accent: "#818cf8"
  },
  {
    id: 7,
    titre: "Salle de conférences — Hamdalaye",
    type: "Installation événementiel",
    description: "Climatisation d'une salle de conférences de 100 places. Unité cassette centrale + traitement acoustique.",
    quartier: "Hamdalaye",
    date: "Septembre 2024",
    surface: "150 m²",
    produits: "1× Midea Cassette 36 000 BTU",
    note: 4,
    commentaire: "Parfait pour nos réunions d'affaires. Installation rapide et efficace.",
    client: "Centre d'Affaires PROSPER",
    emoji: "🎤",
    color: "from-teal-500/20 to-cyan-600/20",
    accent: "#2dd4bf"
  },
  {
    id: 8,
    titre: "Boutique vêtements — Zogona",
    type: "Installation commerce",
    description: "Installation d'un split mural dans une boutique commerçante pour améliorer le confort d'achat des clients.",
    quartier: "Zogona",
    date: "Août 2024",
    surface: "35 m²",
    produits: "1× LG 12 000 BTU Inverter",
    note: 5,
    commentaire: "Mes clients restent plus longtemps. Un investissement rentabilisé en 2 mois.",
    client: "Boutique Mode Africaine",
    emoji: "🛍️",
    color: "from-pink-500/20 to-fuchsia-600/20",
    accent: "#f472b6"
  }
]

const StarRating = ({ note }: { note: number }) => (
  <div class="flex items-center space-x-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <i class={`fas fa-star text-xs ${i <= note ? 'text-yellow-400' : 'text-gray-600'}`}></i>
    ))}
  </div>
)

const stats = [
  { icon: "fa-tools", value: "100+", label: "Installations réalisées" },
  { icon: "fa-city", value: "15+", label: "Quartiers couverts" },
  { icon: "fa-building", value: "50+", label: "Entreprises équipées" },
  { icon: "fa-star", value: "3.8/5", label: "Note moyenne clients" },
]

export const RealisationsPage = () => {
  return (
    <Layout title="Nos Réalisations — MAASGA Climatisation Ouagadougou" activePage="realisations" canonicalPath="/realisations" description="Réalisations MAASGA — Plus de 500 installations de climatiseurs à Ouagadougou. Galerie photos, avis clients et devis gratuit.">

      {/* Hero */}
      <section class="gradient-hero py-16 text-white text-center relative overflow-hidden">
        <div class="max-w-4xl mx-auto px-4 relative z-10">
          <div class="inline-flex items-center space-x-2 bg-white/15 border border-white/20 rounded-full px-4 py-2 text-sm mb-4">
            <i class="fas fa-images text-ice-300"></i>
            <span>Projets réalisés à Ouagadougou · Burkina Faso</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-bold mb-4">Nos Réalisations</h1>
          <p class="text-blue-100/90 text-lg max-w-xl mx-auto">
            Découvrez quelques-uns de nos projets d'installation de climatisation, chez des particuliers et des professionnels à Ouagadougou.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section class="py-10 border-b" style="border-color:rgba(56,189,248,0.08);">
        <div class="max-w-5xl mx-auto px-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(s => (
              <div class="glass-card rounded-2xl p-4 text-center">
                <div class="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.2);">
                  <i class={`fas ${s.icon}`} style="color:#38bdf8;"></i>
                </div>
                <div class="text-2xl font-bold text-white">{s.value}</div>
                <div class="text-xs mt-1" style="color:#64748b;">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grid réalisations */}
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {/* Filtre par type */}
        <div class="flex flex-wrap gap-2 mb-10 justify-center">
          {["Tous", "Résidentiel", "Professionnel", "Commercial"].map(f => (
            <button onclick={`filterReal(this,'${f}')`} data-filter={f} class={`filter-real-btn px-4 py-2 rounded-full text-sm font-semibold border transition-all ${f === 'Tous' ? 'active-real' : ''}`} style={f === 'Tous' ? 'background:rgba(56,189,248,0.15); color:#38bdf8; border-color:rgba(56,189,248,0.4);' : 'background:transparent; color:#8ba3c0; border-color:rgba(148,180,220,0.15);'}>
              {f}
            </button>
          ))}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" id="real-grid">
          {realisations.map(r => (
            <div class={`real-card glass-card rounded-2xl overflow-hidden hover-lift reveal`}
              data-type={['Villa','Appartement','Résidence'].some(k => r.titre.includes(k) || r.type.includes('résiden') || r.quartier !== '') ? 'Résidentiel' : 'Professionnel'}>

              {/* Image / cover */}
              <div class={`relative h-40 flex items-center justify-center bg-gradient-to-br ${r.color}`} style="border-bottom:1px solid rgba(56,189,248,0.08);">
                <span class="text-6xl filter drop-shadow-lg">{r.emoji}</span>
                <span class="absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full" style={`background:rgba(11,17,32,0.8); color:${r.accent}; border:1px solid ${r.accent}33;`}>{r.type}</span>
                <span class="absolute top-3 right-3 text-xs font-medium px-2 py-1 rounded-lg" style="background:rgba(11,17,32,0.7); color:#94a3b8;">{r.date}</span>
              </div>

              {/* Content */}
              <div class="p-5">
                <h3 class="font-bold text-white mb-1 text-sm leading-snug">{r.titre}</h3>
                <p class="text-xs mb-3 leading-relaxed" style="color:#8ba3c0;">{r.description}</p>

                <div class="grid grid-cols-2 gap-2 mb-4">
                  <div class="rounded-xl px-3 py-2" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.1);">
                    <div class="text-xs font-medium mb-0.5" style="color:#38bdf8;">Quartier</div>
                    <div class="text-xs font-semibold text-white">{r.quartier}</div>
                  </div>
                  <div class="rounded-xl px-3 py-2" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.1);">
                    <div class="text-xs font-medium mb-0.5" style="color:#38bdf8;">Surface</div>
                    <div class="text-xs font-semibold text-white">{r.surface}</div>
                  </div>
                </div>

                <div class="rounded-xl px-3 py-2 mb-4 text-xs" style="background:rgba(56,189,248,0.04); border:1px solid rgba(56,189,248,0.08); color:#64748b;">
                  <i class="fas fa-snowflake mr-1 text-cyan-600"></i>{r.produits}
                </div>

                {/* Témoignage */}
                <div class="rounded-xl p-3" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06);">
                  <StarRating note={r.note} />
                  <p class="text-xs mt-2 italic leading-relaxed" style="color:#94a3b8;">"{r.commentaire}"</p>
                  <div class="text-xs font-semibold mt-2" style="color:#64748b;">— {r.client}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div class="mt-14 rounded-3xl p-8 text-center reveal" style="background:linear-gradient(135deg,rgba(56,189,248,0.06),rgba(139,92,246,0.06)); border:1px solid rgba(56,189,248,0.15);">
          <div class="text-4xl mb-4">🏠</div>
          <h2 class="text-2xl font-bold mb-3" style="color:#03045e;">Votre projet, notre prochain succès ?</h2>
          <p class="text-sm mb-6 max-w-lg mx-auto" style="color:#8ba3c0;">Rejoignez nos 100+ clients satisfaits. Devis gratuit, installation soignée, garantie constructeur.</p>
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
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function filterReal(btn, filter) {
          // UI buttons
          document.querySelectorAll('.filter-real-btn').forEach(b => {
            b.style.background = 'transparent';
            b.style.color = '#8ba3c0';
            b.style.borderColor = 'rgba(148,180,220,0.15)';
          });
          btn.style.background = 'rgba(56,189,248,0.15)';
          btn.style.color = '#38bdf8';
          btn.style.borderColor = 'rgba(56,189,248,0.4)';
          // Filter cards
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
