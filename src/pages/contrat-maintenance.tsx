import { Layout } from '../components/Layout'

const renderCell = (val: string) => {
  if (val === '✅') {
    return <span><i class="fas fa-check-circle text-fg-success-bright"></i></span>;
  }
  if (val.includes('✅')) {
    const rest = val.replace('✅', '').trim();
    return <span><i class="fas fa-check-circle text-fg-success-bright"></i>{rest ? ` ${rest}` : ''}</span>;
  }
  return val;
};

export const ContratMaintenancePage = ({ success, error, clientName, clientPhone }: {
  success?: boolean
  error?: string
  clientName?: string
  clientPhone?: string
}) => (
  <Layout 
    title="Contrats de Maintenance Climatisation — MAASGA" 
    activePage="maintenance" 
    canonicalPath="/contrat-maintenance"
    description="Contrats de maintenance préventive pour climatisation à Ouagadougou. Tarification par équipement dégressive : Résidentiel, Professionnel / PME, Industriel et Sur Mesure."
  >
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes fadeSlideIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
      .calc-pill { transition: all 0.2s ease; }
      .calc-pill.active { background:#0077b6 !important; color:#ffffff !important; border-color:#0077b6 !important; }
      .formula-card { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
      .formula-card.card-active { border-color:#0077b6 !important; box-shadow:0 18px 40px rgba(0,119,182,0.18) !important; transform:translateY(-4px); }
    `}} />

    {/* Hero */}
    <section class="gradient-hero py-16 text-white text-center relative overflow-hidden reveal">
      <div class="relative z-10 max-w-4xl mx-auto px-4">
        <div class="inline-flex items-center space-x-2 rounded-full px-4 py-2 text-sm mb-4 font-medium" style="background-color:rgba(var(--rgb-slate-100),0.1); border-color:rgba(var(--rgb-slate-200),0.1);">
          <i class="fas fa-shield-alt"></i><span>Maintenance préventive · MAASGA (v2)</span>
        </div>
        <h1 class="text-4xl md:text-5xl font-extrabold mb-4">Contrats de Maintenance</h1>
        <p class="text-blue-100 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Tarification équitable par équipement : tarif dégressif calculé selon votre nombre de climatiseurs et la fréquence de visite souhaitée.
        </p>
      </div>
    </section>

    {/* Avantages maintenance */}
    <section class="py-12 px-4 reveal">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-10">
          <h2 class="text-2xl font-extrabold mb-3 text-fg-heading">Pourquoi un contrat de maintenance ?</h2>
          <p class="text-sm max-w-xl mx-auto" style="color:var(--fg-subtle);">Un climatiseur bien entretenu consomme jusqu'à 30% d'énergie en moins et dure 2× plus longtemps.</p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: 'fa-bolt', color: '#eab308', label: '-30% énergie', desc: 'Économies sur votre facture d\'électricité' },
            { icon: 'fa-heart', color: '#ef4444', label: '2× durée de vie', desc: 'Votre climatiseur dure plus longtemps' },
            { icon: 'fa-wind', color: '#0ea5e9', label: 'Air pur', desc: 'Filtres propres, air sain garanti' },
            { icon: 'fa-tools', color: '#16a34a', label: 'Zéro panne', desc: 'Diagnostic précoce des problèmes' }
          ].map((a, i) => (
            <div key={i} class="glass-card rounded-2xl p-5 text-center card-hover">
              <div class="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3" style={`background:${a.color}15;`}>
                <i class={`fas ${a.icon}`} style={`color:${a.color}; font-size:1.2rem;`}></i>
              </div>
              <div class="text-sm font-bold mb-1" style="color:var(--fg-heading);">{a.label}</div>
              <div class="text-xs text-fg-subtle">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* SIMULATEUR DYNAMIQUE INTERACTIF (v2) */}
    <section id="sim-section" class="py-10 px-4 reveal transition-all duration-300" style="background:linear-gradient(180deg,var(--surface-subtle) 0%,var(--surface-info) 100%);">
      <div class="max-w-4xl mx-auto">
        <div class="glass-card rounded-3xl p-6 md:p-8 shadow-xl" style="border:2px solid var(--line-accent); background:var(--surface-card);">
          <div class="flex items-center space-x-3 mb-6">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center" style="background:linear-gradient(135deg,#0077b6,#00b4d8); color:#fff; box-shadow:0 6px 16px rgba(0,119,182,0.25);">
              <i class="fas fa-calculator text-xl"></i>
            </div>
            <div>
              <h2 class="text-xl md:text-2xl font-black text-fg-heading">Simulateur de contrat dynamique</h2>
              <p class="text-xs md:text-sm" style="color:var(--fg-subtle);">Estimez votre tarif en direct selon votre parc de climatiseurs</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Nombre de climatiseurs */}
            <div class="p-4 rounded-2xl bg-surface-subtle border border-line">
              <label class="block text-xs font-bold uppercase tracking-wider mb-2" style="color:var(--fg-heading);">
                1. Nombre de climatiseurs
              </label>
              <div class="flex items-center justify-between mb-3 bg-white p-2 rounded-xl border" style="border-color:var(--line-strong);">
                <button type="button" id="ac-minus-btn" class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg hover:bg-slate-100 transition cursor-pointer text-fg-brand">
                  <i class="fas fa-minus"></i>
                </button>
                <div class="text-center">
                  <span id="sim-ac-count" class="text-3xl font-extrabold text-fg-heading">2</span>
                  <span class="text-xs ml-1 font-semibold text-fg-subtle">climatiseur(s)</span>
                </div>
                <button type="button" id="ac-plus-btn" class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg hover:bg-slate-100 transition cursor-pointer text-fg-brand">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
              {/* Chips rapides */}
              <div class="flex flex-wrap gap-1.5">
                {[1, 2, 4, 8, 12, 20].map(cnt => (
                  <button key={cnt} type="button" data-count={cnt} class="ac-quick-chip px-2.5 py-1 text-xs font-semibold rounded-lg border transition cursor-pointer bg-surface-card text-fg-body" style="border-color:var(--line);">
                    {cnt} clim
                  </button>
                ))}
              </div>
            </div>

            {/* Fréquence de visites */}
            <div class="p-4 rounded-2xl bg-surface-subtle border border-line">
              <label class="block text-xs font-bold uppercase tracking-wider mb-2" style="color:var(--fg-heading);">
                2. Fréquence des visites
              </label>
              <div class="grid grid-cols-3 gap-2 mb-3">
                {[
                  { id: 'Essentiel', visits: 1, label: 'Essentiel', sub: '1 visite/an' },
                  { id: 'Confort', visits: 2, label: 'Confort', sub: '2 visites/an' },
                  { id: 'Pro', visits: 3, label: 'Pro', sub: '3 visites/an' }
                ].map(freq => (
                  <button key={freq.id} type="button" data-freq={freq.id} data-visits={freq.visits} class="freq-chip p-2 rounded-xl text-center border calc-pill transition cursor-pointer bg-surface-card text-fg-body" style="border-color:var(--line);">
                    <div class="font-bold text-xs">{freq.label}</div>
                    <div class="text-[10px] opacity-75">{freq.sub}</div>
                  </button>
                ))}
              </div>
              <div class="text-[11px] p-2 rounded-lg text-fg-brand" style="background:rgba(var(--rgb-brand),0.06);">
                <i class="fas fa-info-circle mr-1"></i> Grille dégressive : 8 500 F (1-4) · 7 500 F (5-8) · 6 000 F (9-15) · 5 000 F (16+)
              </div>
            </div>
          </div>

          {/* Boîte de résultat calculé en direct */}
          <div class="p-5 rounded-2xl mb-5" style="background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%); border:1.5px solid #86efac;">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left items-center">
              <div>
                <div class="text-xs font-semibold text-fg-success-deep">Tarif unitaire applicable :</div>
                <div id="res-unit-rate" class="text-lg font-bold" style="color:#14532d;">8 500 F <span class="text-xs font-normal">/ unité / visite</span></div>
              </div>
              <div>
                <div class="text-xs font-semibold text-fg-success-deep">Par visite globale :</div>
                <div id="res-visit-price" class="text-lg font-bold" style="color:#14532d;">17 000 F CFA</div>
              </div>
              <div class="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0" style="border-color:#86efac;">
                <div class="text-xs font-bold uppercase tracking-wider text-fg-success-deep">Total annuel estimé :</div>
                <div id="res-total-annual" class="text-2xl md:text-3xl font-black" style="color:#14532d;">34 000 F CFA</div>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <button type="button" id="sim-cta-btn" onclick="openMaintenanceModalWithSim()" class="flex-1 font-bold py-3.5 px-6 rounded-xl text-white text-center transition-all hover:-translate-y-0.5 cursor-pointer flex items-center justify-center space-x-2" style="background:linear-gradient(135deg,#0077b6,#00b4d8); box-shadow:0 8px 20px rgba(0,119,182,0.3);">
              <i class="fas fa-check-circle"></i>
              <span>Souscrire avec cette configuration</span>
            </button>
            <a href="#offres-cards" class="px-5 py-3.5 rounded-xl font-semibold text-sm text-center border transition-all hover:bg-slate-50 flex items-center justify-center space-x-1.5" style="border-color:var(--line-strong); color:var(--fg-muted);">
              <span>Voir les 4 formules</span>
              <i class="fas fa-arrow-down text-xs"></i>
            </a>
          </div>
        </div>
      </div>
    </section>

    {/* LES 4 FORMULES DE MAINTENANCE (v2) */}
    <section id="offres-cards" class="py-14 px-4 reveal" style="background:linear-gradient(180deg,var(--surface-info) 0%,var(--surface-accent) 100%);">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-10">
          <h2 class="text-2xl md:text-3xl font-extrabold mb-3 text-fg-heading">Nos 4 formules de maintenance</h2>
          <p class="text-sm max-w-xl mx-auto" style="color:var(--fg-subtle);">
            Chaque formule est adaptée à votre taille de parc. Les tarifs unitaires sont dégressifs selon vos équipements.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch">

          {/* CARTE 1 — RÉSIDENTIEL */}
          <div id="card-residentiel" class="formula-card glass-card rounded-3xl p-6 relative flex flex-col justify-between" style="border:2px solid rgba(var(--rgb-brand),0.15); background:var(--surface-card);">
            <div>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider text-fg-brand" style="background:rgba(var(--rgb-brand),0.08);">
                  1 à 4 clims
                </span>
                <div class="w-9 h-9 rounded-full flex items-center justify-center bg-surface-muted text-fg-brand">
                  <i class="fas fa-home"></i>
                </div>
              </div>
              <h3 class="text-lg font-black mb-1 text-fg-heading">RÉSIDENTIEL</h3>
              <div class="text-xs font-medium mb-3 text-fg-subtle">Fréquence : <strong>Essentiel (1x) ou Confort (2x)</strong></div>

              <div class="p-3 rounded-2xl mb-4 bg-surface-subtle border border-line">
                <div class="text-2xl font-black text-fg-heading">8 500 <span class="text-xs font-bold text-slate-500">F / clim / visite</span></div>
                <div class="text-[11px] mt-0.5 text-fg-subtle">Tarif unitaire applicable de 1 à 4 climatiseurs</div>
              </div>

              <div class="text-xs font-bold uppercase tracking-wider mb-2 text-fg-heading">Ce qui est inclus :</div>
              <div class="space-y-2 mb-6">
                {[
                  'Nettoyage des filtres',
                  'Vérification complète du système',
                  'Contrôle performances de refroidissement',
                  'Vérification du gaz réfrigérant',
                  'Diagnostic technique'
                ].map((f, index) => (
                  <div key={index} class="flex items-start space-x-2 text-xs">
                    <i class="fas fa-check-circle mt-0.5 flex-shrink-0 text-fg-success-bright text-[0.75rem]"></i>
                    <span class="text-fg-body">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div class="text-[11px] text-center mb-4 p-2 rounded-xl bg-surface-muted text-fg-subtle">
                <i class="fas fa-check mr-1 text-blue-500"></i>Logements et petits bureaux
              </div>
              <button type="button" onclick="simulateFormula('residentiel')" class="w-full text-center font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer text-sm flex items-center justify-center space-x-1.5" style="background:rgba(var(--rgb-brand),0.08); color:var(--fg-brand); border:1.5px solid rgba(var(--rgb-brand),0.2);">
                <i class="fas fa-calculator text-xs"></i>
                <span>Simuler mon prix</span>
              </button>
            </div>
          </div>

          {/* CARTE 2 — PROFESSIONNEL / PME ⭐ RECOMMANDÉ */}
          <div id="card-professionnel" class="formula-card glass-card rounded-3xl p-6 relative flex flex-col justify-between" style="border:2px solid var(--line-brand); background:var(--surface-card); box-shadow:0 12px 32px rgba(var(--rgb-brand),0.12);">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-extrabold shadow-md whitespace-nowrap" style="background:linear-gradient(135deg,#0077b6,#00b4d8); color:#ffffff;">
              <i class="fas fa-star mr-1"></i>RECOMMANDÉ
            </div>
            <div>
              <div class="flex items-center justify-between mb-4 mt-1">
                <span class="text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider text-fg-brand" style="background:rgba(var(--rgb-brand),0.1);">
                  5 à 15 clims
                </span>
                <div class="w-9 h-9 rounded-full flex items-center justify-center bg-surface-accent text-fg-brand">
                  <i class="fas fa-building"></i>
                </div>
              </div>
              <h3 class="text-lg font-black mb-1 text-fg-heading">PROFESSIONNEL / PME</h3>
              <div class="text-xs font-medium mb-3 text-fg-subtle">Fréquence : <strong>Confort (2x) ou Pro (3x)</strong></div>

              <div class="p-3 rounded-2xl mb-4 bg-surface-info border border-line-accent">
                <div class="text-2xl font-black text-fg-heading">7 500 à 6 000 <span class="text-xs font-bold text-slate-500">F / unité / visite</span></div>
                <div class="text-[11px] mt-0.5 text-fg-subtle">7 500 F (5-8 clims) · 6 000 F (9-15 clims)</div>
              </div>

              <div class="text-xs font-bold uppercase tracking-wider mb-2 text-fg-heading">Ce qui est inclus :</div>
              <div class="space-y-2 mb-4">
                {[
                  'Nettoyage unité intérieure + extérieure',
                  'Vérification du gaz réfrigérant',
                  'Diagnostic complet du système',
                  'Priorité sur les interventions',
                  'Conseils d\'optimisation énergétique'
                ].map((f, index) => (
                  <div key={index} class="flex items-start space-x-2 text-xs">
                    <i class="fas fa-check-circle mt-0.5 flex-shrink-0 text-fg-success-bright text-[0.75rem]"></i>
                    <span class="text-fg-body">{f}</span>
                  </div>
                ))}
              </div>

              <div class="p-2.5 rounded-xl mb-4" style="background:linear-gradient(135deg,rgba(var(--rgb-brand),0.06),rgba(0,180,216,0.06)); border:1px solid rgba(var(--rgb-brand),0.15);">
                <div class="text-[11px] font-bold text-fg-brand"><i class="fas fa-gift mr-1"></i>Bonus client inclus :</div>
                <div class="text-[11px] mt-0.5 text-fg-body">1 diagnostic panne offert dans l'année</div>
              </div>
            </div>

            <div>
              <div class="text-[11px] text-center mb-4 p-2 rounded-xl bg-surface-muted text-fg-subtle">
                <i class="fas fa-check mr-1 text-blue-500"></i>Bureaux, commerces, PME
              </div>
              <button type="button" onclick="simulateFormula('professionnel')" class="w-full text-center font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer text-sm text-white flex items-center justify-center space-x-1.5" style="background:linear-gradient(135deg,#0077b6,#00b4d8); box-shadow:0 6px 18px rgba(0,119,182,0.3);">
                <i class="fas fa-calculator text-xs"></i>
                <span>Simuler mon prix</span>
              </button>
            </div>
          </div>

          {/* CARTE 3 — INDUSTRIEL 🏆 MEILLEUR CHOIX */}
          <div id="card-industriel" class="formula-card glass-card rounded-3xl p-6 relative flex flex-col justify-between" style="border:2px solid rgba(var(--rgb-navy),0.25); background:var(--surface-card);">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-extrabold shadow-md whitespace-nowrap" style="background:linear-gradient(135deg,#03045e,#0077b6); color:#ffffff;">
              <i class="fas fa-crown mr-1"></i>MEILLEUR CHOIX
            </div>
            <div>
              <div class="flex items-center justify-between mb-4 mt-1">
                <span class="text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider text-fg-heading" style="background:rgba(var(--rgb-navy),0.08);">
                  16 clims et +
                </span>
                <div class="w-9 h-9 rounded-full flex items-center justify-center bg-surface-muted text-fg-heading">
                  <i class="fas fa-industry"></i>
                </div>
              </div>
              <h3 class="text-lg font-black mb-1 text-fg-heading">INDUSTRIEL</h3>
              <div class="text-xs font-medium mb-3 text-fg-subtle">Fréquence : <strong>Pro (3x) ou contrat sur mesure</strong></div>

              <div class="p-3 rounded-2xl mb-4 bg-surface-subtle border border-line">
                <div class="text-2xl font-black text-fg-heading">Dès 5 000 <span class="text-xs font-bold text-slate-500">F / unité / visite</span></div>
                <div class="text-[11px] mt-0.5 text-fg-subtle">Sur devis · Base de négociation dégressive selon volume</div>
              </div>

              <div class="text-xs font-bold uppercase tracking-wider mb-2 text-fg-heading">Ce qui est inclus :</div>
              <div class="space-y-2 mb-3">
                {[
                  'Nettoyage complet professionnel',
                  'Vérification approfondie gaz et pression',
                  'Diagnostic complet du système',
                  'Intervention prioritaire garantie',
                  'Suivi technique & rapport personnalisé'
                ].map((f, index) => (
                  <div key={index} class="flex items-start space-x-2 text-xs">
                    <i class="fas fa-check-circle mt-0.5 flex-shrink-0 text-fg-success-bright text-[0.75rem]"></i>
                    <span class="text-fg-body">{f}</span>
                  </div>
                ))}
              </div>

              <div class="p-2.5 rounded-xl mb-4" style="background:rgba(var(--rgb-navy),0.04); border:1px solid rgba(var(--rgb-navy),0.08);">
                <div class="text-[11px] font-bold mb-1 text-fg-heading"><i class="fas fa-shield-alt mr-1"></i>Avantages exclusifs :</div>
                <div class="text-[11px] space-y-0.5 text-fg-body">
                  <div>• 1 recharge de gaz gratuite (si nécessaire)</div>
                  <div>• 10% de réduction sur réparations</div>
                  <div>• Support technique prioritaire</div>
                </div>
              </div>
            </div>

            <div>
              <div class="text-[11px] text-center mb-4 p-2 rounded-xl bg-surface-muted text-fg-subtle">
                <i class="fas fa-check mr-1 text-blue-500"></i>Usines, hôtels, gros parcs
              </div>
              <button type="button" onclick="openMaintenanceModal('industriel')" class="w-full text-center font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer text-sm flex items-center justify-center space-x-1.5" style="background:rgba(var(--rgb-navy),0.08); color:var(--fg-heading); border:1.5px solid rgba(var(--rgb-navy),0.2);">
                <i class="fas fa-file-invoice text-xs"></i>
                <span>Demander un devis</span>
              </button>
            </div>
          </div>

          {/* CARTE 4 — SUR MESURE (Sobre) */}
          <div id="card-sur_mesure" class="formula-card glass-card rounded-3xl p-6 relative flex flex-col justify-between" style="border:1.5px solid var(--line-strong); background:var(--surface-card);">
            <div>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider bg-surface-muted text-fg-muted">
                  CONTRAT PERSONNALISÉ
                </span>
                <div class="w-9 h-9 rounded-full flex items-center justify-center bg-surface-subtle text-fg-muted">
                  <i class="fas fa-handshake"></i>
                </div>
              </div>
              <h3 class="text-lg font-black mb-1" style="color:#1e293b;">SUR MESURE</h3>
              <div class="text-xs font-medium mb-3 text-fg-subtle">Parcs mixtes & Multi-sites</div>

              <div class="p-3 rounded-2xl mb-4 bg-surface-subtle border border-line">
                <div class="text-2xl font-black" style="color:#1e293b;">Sur devis</div>
                <div class="text-[11px] mt-0.5 text-fg-subtle">Selon vos besoins et votre cahier des charges</div>
              </div>

              <p class="text-xs leading-relaxed mb-4 text-fg-muted">
                Votre parc ou vos exigences ne rentrent pas dans une formule standard ? Décrivez-nous votre besoin (plusieurs sites, chambres froides, astreinte, délai garanti SLA), nous construisons un contrat adapté.
              </p>

              <div class="p-2.5 rounded-xl mb-4 bg-surface-subtle border border-line">
                <div class="text-[11px] font-bold mb-0.5 text-fg-body"><i class="fas fa-cogs mr-1"></i>Prestations flexibles :</div>
                <div class="text-[11px] text-fg-subtle">SLA garanti, astreintes WE, parc froid mixte.</div>
              </div>
            </div>

            <div>
              <div class="text-[11px] text-center mb-4 p-2 rounded-xl bg-surface-subtle text-fg-subtle">
                <i class="fas fa-check mr-1 text-slate-500"></i>Multi-sites, parcs mixtes, SLA
              </div>
              <button type="button" onclick="openMaintenanceModal('sur_mesure')" class="w-full text-center font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer text-sm mb-2 flex items-center justify-center space-x-1.5" style="background:#334155; color:var(--fg-on-dark);">
                <i class="fas fa-handshake text-xs"></i>
                <span>Demander un contrat personnalisé</span>
              </button>
              <a href="https://wa.me/22655996418?text=Bonjour%20MAASGA%2C%20je%20souhaite%20un%20contrat%20de%20maintenance%20sur%20mesure%20pour%20mon%20parc%20de%20climatiseurs." target="_blank" rel="noopener noreferrer" class="w-full inline-flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-semibold border text-slate-700 hover:bg-slate-50 transition">
                <i class="fab fa-whatsapp text-green-600"></i>
                <span>Discuter sur WhatsApp</span>
              </a>
            </div>
          </div>

        </div>

        {/* Tableau Comparatif Rapide */}
        <div class="mt-14 max-w-4xl mx-auto glass-card rounded-3xl p-6 md:p-8 reveal shadow-lg" style="background:var(--surface-card); border:1px solid var(--line);">
          <h3 class="font-extrabold text-lg md:text-xl text-center mb-6 text-fg-heading">
            <i class="fas fa-chart-bar mr-2 text-fg-brand"></i>Comparatif des formules
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-xs md:text-sm">
              <thead>
                <tr style="border-bottom:2px solid rgba(var(--rgb-brand),0.12);">
                  <th class="text-left py-3 px-3 font-bold text-fg-heading">Critère</th>
                  <th class="text-center py-3 px-3 font-bold text-fg-brand">Résidentiel</th>
                  <th class="text-center py-3 px-3 font-bold text-fg-brand">Pro / PME ⭐</th>
                  <th class="text-center py-3 px-3 font-bold text-fg-heading">Industriel 🏆</th>
                  <th class="text-center py-3 px-3 font-bold text-fg-muted">Sur Mesure</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Cible de parc', '1 à 4 clims', '5 à 15 clims', '16+ clims', 'Tout volume'],
                  ['Tarif unitaire / clim / visite', '8 500 F', '7 500 F ou 6 000 F', 'Dès 5 000 F', 'Sur devis'],
                  ['Fréquence type', '1 ou 2 visites/an', '2 ou 3 visites/an', '3+ visites/an', 'Selon besoin'],
                  ['Diagnostic panne offert', '—', '✅ 1 / an', '✅ Prioritaire', '✅ Inclus'],
                  ['Recharge gaz offerte', '—', '—', '✅ 1 (si besoin)', 'Sur mesure'],
                  ['Réduction sur réparations', '—', '—', '✅ 10%', 'Négociée'],
                  ['Support & intervention', 'Standard', 'Prioritaire', 'Haute priorité', 'SLA Garanti'],
                ].map((row, idx) => (
                  <tr key={idx} style="border-bottom:1px solid rgba(var(--rgb-brand),0.06);">
                    <td class="py-2.5 px-3 font-medium text-fg-body">{row[0]}</td>
                    <td class="py-2.5 px-3 text-center text-fg-subtle">{renderCell(row[1])}</td>
                    <td class="py-2.5 px-3 text-center font-semibold text-fg-brand">{renderCell(row[2])}</td>
                    <td class="py-2.5 px-3 text-center font-semibold text-fg-heading">{renderCell(row[3])}</td>
                    <td class="py-2.5 px-3 text-center text-fg-muted">{renderCell(row[4])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    {/* MODAL DE SOUSCRIPTION & DEVIS (v2) */}
    <div id="maintenance-modal" data-lenis-prevent class="hidden fixed inset-0 z-50 flex items-start justify-center p-4 pt-6" style="background:rgba(var(--rgb-black),0.65); backdrop-filter:blur(6px);">
      <div class="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden bg-surface-card" style="max-height:92vh; overflow-y:auto;">
        {/* Modal Header */}
        <div class="flex items-center justify-between px-6 py-4 sticky top-0 z-10 bg-surface-subtle" style="border-bottom:2px solid var(--line);">
          <div>
            <h3 class="font-extrabold text-lg text-fg-heading">
              <i class="fas fa-file-contract mr-2 text-fg-brand"></i>Demande de Contrat de Maintenance
            </h3>
            <p class="text-xs mt-0.5 text-fg-subtle">Traitement rapide · Confirmation technique sous 2h</p>
          </div>
          <button type="button" onclick="closeMaintenanceModal()" class="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer text-fg-subtle">
            <i class="fas fa-times text-base"></i>
          </button>
        </div>

        <div class="px-6 py-6">
          {error && (
            <div class="mb-6 p-4 rounded-xl flex items-center space-x-3" style="background:rgba(var(--rgb-red),0.08); border:1px solid rgba(var(--rgb-red),0.15);">
              <i class="fas fa-exclamation-circle text-xl text-fg-danger-bright"></i>
              <span class="text-sm" style="color:var(--fg-danger-bright);">{error}</span>
            </div>
          )}

          {success ? (
            <div class="py-6 px-2 text-center space-y-6">
              <div class="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style="background:rgba(22,163,74,0.12); border:2px solid rgba(22,163,74,0.3);">
                <i class="fas fa-check-circle text-3xl text-fg-success-bright"></i>
              </div>
              <div class="space-y-2">
                <h4 class="text-xl font-extrabold text-fg-heading">Demande transmise avec succès !</h4>
                <p class="text-sm max-w-md mx-auto leading-relaxed" style="color:var(--fg-muted);">
                  Votre demande a été enregistrée. Notre équipe technique vous contactera sous <strong>2h</strong> par <span class="text-fg-whatsapp font-bold"><i class="fab fa-whatsapp"></i> WhatsApp</span> pour confirmer les détails et planifier la 1ère visite.
                </p>
              </div>

              <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="/espace-client" class="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5 text-sm inline-flex items-center justify-center gap-2" style="background:linear-gradient(135deg,#0077b6,#00b4d8); box-shadow:0 8px 24px rgba(0,119,182,0.3);">
                  <i class="fas fa-user-circle"></i>
                  <span>Voir mon Espace Client</span>
                </a>
                <button type="button" onclick="closeMaintenanceModal()" class="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold transition-all hover:bg-slate-100 text-sm cursor-pointer" style="color:var(--fg-subtle); border:1.5px solid var(--line-strong);">
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <form method="post" action="/api/maintenance/request" class="space-y-5">
              <div class="hidden" aria-hidden="true"><input type="text" name="website" tabIndex={-1} autoComplete="off" /></div>
              <input type="hidden" name="request_type" value="contrat" />
              <input type="hidden" name="payment_method" value="a_la_visite" />

              {/* Sélection de la formule */}
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider mb-2" style="color:var(--fg-heading);">Formule souhaitée</label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" id="modal-formula-selector">
                  {[
                    { id: 'residentiel', label: 'Résidentiel', range: '1-4 clims' },
                    { id: 'professionnel', label: 'Pro / PME', range: '5-15 clims' },
                    { id: 'industriel', label: 'Industriel', range: '16+ clims' },
                    { id: 'sur_mesure', label: 'Sur Mesure', range: 'Multi-sites' }
                  ].map(f => (
                    <label key={f.id} class="cursor-pointer">
                      <input type="radio" name="plan_type" value={f.id} class="hidden peer" />
                      <div class="peer-checked:border-blue-600 peer-checked:bg-blue-50 border-2 rounded-xl p-2.5 text-center transition hover:border-blue-300" style="border-color:var(--line);">
                        <div class="text-xs font-bold text-fg-heading">{f.label}</div>
                        <div class="text-[10px] text-fg-subtle">{f.range}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Paramètres dynamiques (clims + fréquence) */}
              <div id="modal-ac-config" class="p-4 rounded-2xl bg-surface-subtle border border-line">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label class="block text-xs font-semibold mb-1" style="color:var(--fg-heading);">Nombre de climatiseurs</label>
                    <input type="number" id="modal-nb-clims" name="nb_climatiseurs" min={1} max={200} value={2} class="w-full rounded-xl px-3 py-2.5 text-sm font-bold border" style="border-color:var(--line-strong); color:var(--fg-heading);" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold mb-1" style="color:var(--fg-heading);">Fréquence de visite</label>
                    <select id="modal-freq-select" name="frequence_visites" class="w-full rounded-xl px-3 py-2.5 text-sm font-medium border" style="border-color:var(--line-strong); color:var(--fg-heading);">
                      <option value="Essentiel">Essentiel (1 visite/an)</option>
                      <option value="Confort" selected>Confort (2 visites/an)</option>
                      <option value="Pro">Pro (3 visites/an)</option>
                    </select>
                  </div>
                </div>
                {/* Récapitulatif tarifaire calculé */}
                <div id="modal-pricing-recap" class="p-3 rounded-xl flex items-center justify-between bg-surface-accent border border-line-accent">
                  <div>
                    <div class="text-[11px] font-semibold text-fg-link">Tarif unitaire applicable :</div>
                    <div id="modal-unit-label" class="text-xs font-bold text-fg-heading">8 500 F / unité</div>
                  </div>
                  <div class="text-right">
                    <div class="text-[11px] font-semibold text-fg-link">Estimation globale :</div>
                    <div id="modal-total-label" class="text-base font-extrabold text-fg-heading">34 000 F CFA / an</div>
                  </div>
                </div>
              </div>

              {/* Champs spécifiques Industriel / Sur Mesure */}
              <div id="modal-custom-fields" class="space-y-4" style="display:none;">
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--fg-heading);">Nom de l'établissement ou nombre de site(s)</label>
                  <input type="text" name="type_etablissement" placeholder="Ex: Hôtel 30 chambres, Clinique 2 sites..." class="w-full rounded-xl px-4 py-2.5 text-sm border" style="border-color:var(--line-strong); color:var(--fg-heading);" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--fg-heading);">Exigences particulières (SLA, astreinte, froid commercial)</label>
                  <textarea name="exigences" rows={2} placeholder="Ex: Astreinte week-end demandée, présence de chambres froides..." class="w-full rounded-xl px-4 py-2 text-sm border resize-none" style="border-color:var(--line-strong); color:var(--fg-heading);"></textarea>
                </div>
              </div>

              {/* Coordonnées client */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--fg-heading);">Nom complet <span style="color:#e11d48;">*</span></label>
                  <input type="text" name="name" required value={clientName || ''} placeholder="Votre nom" class="w-full rounded-xl px-4 py-2.5 text-sm border" style="border-color:var(--line-strong); color:var(--fg-heading);" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--fg-heading);">Téléphone WhatsApp <span style="color:#e11d48;">*</span></label>
                  <div class="flex rounded-xl overflow-hidden border" style="border-color:var(--line-strong);">
                    <div class="flex items-center px-3 text-xs font-bold bg-surface-muted text-fg-brand border-r border-line-strong whitespace-nowrap">🇧🇫 +226</div>
                    <input type="tel" name="phone" required value={clientPhone || ''} placeholder="55 99 64 18" class="flex-1 px-3 py-2.5 text-sm outline-none bg-surface-card" style="color:var(--fg-heading);" />
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--fg-heading);">Quartier <span style="color:#94a3b8; font-weight:400;">(optionnel)</span></label>
                  <input type="text" name="quartier" placeholder="Ouaga 2000, Somgandé, Pissy..." class="w-full rounded-xl px-4 py-2.5 text-sm border" style="border-color:var(--line-strong); color:var(--fg-heading);" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--fg-heading);">Date souhaitée de 1ère visite</label>
                  <input type="date" name="preferred_date" class="w-full rounded-xl px-4 py-2.5 text-sm border" style="border-color:var(--line-strong); color:var(--fg-heading);" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold mb-1" style="color:var(--fg-heading);">Notes ou précisions complémentaires</label>
                <textarea name="description" rows={2} placeholder="Marque des climatiseurs, pannes récentes observées..." class="w-full rounded-xl px-4 py-2 text-sm border resize-none" style="border-color:var(--line-strong); color:var(--fg-heading);"></textarea>
              </div>

              {/* Règlement info */}
              <div class="p-3 rounded-xl text-xs text-fg-success-deep" style="background:#f0fdf4; border:1px solid #bbf7d0;">
                <i class="fas fa-info-circle mr-1 text-green-600"></i>
                <span>Le contrat est validé ensemble sous 2h. Le règlement s'effectue directement lors de la première visite technique — aucun paiement en ligne requis.</span>
              </div>

              <button type="submit" id="submit-maintenance" class="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all hover:-translate-y-0.5 cursor-pointer shadow-lg" style="background:linear-gradient(135deg,#0077b6,#00b4d8);">
                <i class="fas fa-check-circle"></i>
                <span id="submit-btn-text">Confirmer ma demande de contrat</span>
              </button>

              <div class="text-center">
                <a href="https://wa.me/22655996418?text=Bonjour%20MAASGA%2C%20je%20souhaite%20des%20renseignements%20sur%20un%20contrat%20de%20maintenance." target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-500 hover:text-green-600 transition">
                  <i class="fab fa-whatsapp text-green-600"></i>
                  <span>Préférez-vous échanger directement sur WhatsApp ? Cliquez ici</span>
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>

    {/* Bannière WhatsApp en bas de page */}
    <section class="py-10 px-4 reveal">
      <div class="max-w-3xl mx-auto text-center glass-card rounded-3xl p-8 shadow-md" style="background:linear-gradient(135deg,rgba(var(--rgb-whatsapp),0.06),rgba(22,163,74,0.06)); border:1px solid rgba(var(--rgb-whatsapp),0.18);">
        <i class="fab fa-whatsapp text-4xl mb-3" style="color:var(--fg-whatsapp);"></i>
        <h3 class="text-xl font-bold mb-2 text-fg-heading">Une question ou un besoin spécifique ?</h3>
        <p class="text-sm mb-5" style="color:var(--fg-subtle);">Nos conseillers techniques répondent à vos questions en direct sur WhatsApp pour évaluer vos besoins d'entretien.</p>
        <a href="https://wa.me/22655996418?text=Bonjour%20MAASGA%2C%20je%20souhaite%20des%20informations%20sur%20vos%20contrats%20de%20maintenance." target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5" style="background:#25d366; box-shadow:0 8px 24px rgba(var(--rgb-whatsapp),0.3);">
          <i class="fab fa-whatsapp text-lg"></i>
          <span>Écrire à notre conseiller WhatsApp</span>
        </a>
      </div>
    </section>

    {/* Logique JavaScript Simulateur et Modal (v2) */}
    <script dangerouslySetInnerHTML={{ __html: `
      // ─── Logique tarifaire dégressive v2.1 ─────────────────────────
      var simState = {
        acCount: 2,
        frequency: 'Confort',
        visits: 2
      };

      function getUnitRate(count) {
        if (count <= 4) return 8500;
        if (count <= 8) return 7500;
        if (count <= 15) return 6000;
        return 5000;
      }

      function formatNumber(num) {
        return num.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, " ");
      }

      function updateSimulatorUI() {
        var count = simState.acCount;
        var visits = simState.visits;
        var unitRate = getUnitRate(count);
        var visitPrice = unitRate * count;
        var totalAnnual = visitPrice * visits;

        // Simulator display
        var acDisplay = document.getElementById('sim-ac-count');
        if (acDisplay) acDisplay.textContent = count;

        var unitDisplay = document.getElementById('res-unit-rate');
        if (unitDisplay) unitDisplay.innerHTML = formatNumber(unitRate) + ' F <span class="text-xs font-normal">/ unité / visite</span>';

        var visitDisplay = document.getElementById('res-visit-price');
        if (visitDisplay) visitDisplay.textContent = formatNumber(visitPrice) + ' F CFA';

        var totalDisplay = document.getElementById('res-total-annual');
        if (totalDisplay) {
          if (count >= 16) {
            totalDisplay.innerHTML = '<span class="text-xl font-bold">Sur devis</span> <span class="text-xs font-normal">(dès ' + formatNumber(totalAnnual) + ' F)</span>';
          } else {
            totalDisplay.textContent = formatNumber(totalAnnual) + ' F CFA';
          }
        }

        // Active card highlighting
        var cards = ['residentiel', 'professionnel', 'industriel', 'sur_mesure'];
        cards.forEach(function(c) {
          var el = document.getElementById('card-' + c);
          if (el) el.classList.remove('card-active');
        });
        if (count <= 4) {
          var el = document.getElementById('card-residentiel');
          if (el) el.classList.add('card-active');
        } else if (count <= 15) {
          var el = document.getElementById('card-professionnel');
          if (el) el.classList.add('card-active');
        } else {
          var el = document.getElementById('card-industriel');
          if (el) el.classList.add('card-active');
        }

        // Quick chip active styling
        document.querySelectorAll('.ac-quick-chip').forEach(function(chip) {
          if (parseInt(chip.getAttribute('data-count'), 10) === count) {
            chip.style.background = '#0077b6';
            chip.style.color = '#ffffff';
            chip.style.borderColor = '#0077b6';
          } else {
            chip.style.background = '#ffffff';
            chip.style.color = '#334155';
            chip.style.borderColor = '#e2e8f0';
          }
        });

        // Freq chips active styling
        document.querySelectorAll('.freq-chip').forEach(function(chip) {
          if (chip.getAttribute('data-freq') === simState.frequency) {
            chip.classList.add('active');
          } else {
            chip.classList.remove('active');
          }
        });
      }

      // Quick chips listener
      document.querySelectorAll('.ac-quick-chip').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var c = parseInt(this.getAttribute('data-count'), 10);
          if (!isNaN(c) && c >= 1) {
            simState.acCount = c;
            updateSimulatorUI();
          }
        });
      });

      // Minus / Plus buttons
      document.getElementById('ac-minus-btn')?.addEventListener('click', function() {
        if (simState.acCount > 1) {
          simState.acCount--;
          updateSimulatorUI();
        }
      });
      document.getElementById('ac-plus-btn')?.addEventListener('click', function() {
        simState.acCount++;
        updateSimulatorUI();
      });

      // Frequency selector
      document.querySelectorAll('.freq-chip').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var f = this.getAttribute('data-freq');
          var v = parseInt(this.getAttribute('data-visits'), 10) || 2;
          simState.frequency = f;
          simState.visits = v;
          updateSimulatorUI();
        });
      });

      // Simulate formula from card CTA
      function simulateFormula(plan) {
        var count = (plan === 'residentiel') ? 2 : 8;
        simState.acCount = count;
        simState.frequency = 'Confort';
        simState.visits = 2;
        updateSimulatorUI();
        var simSec = document.getElementById('sim-section');
        if (simSec) {
          simSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
          simSec.style.boxShadow = '0 0 0 4px rgba(0,119,182,0.35)';
          setTimeout(function() {
            simSec.style.boxShadow = '';
          }, 1800);
        }
      }

      // Initialize simulator
      updateSimulatorUI();

      // ─── Modal interactions ──────────────────────────────────────────
      function openMaintenanceModalWithSim() {
        var plan = 'residentiel';
        if (simState.acCount >= 16) plan = 'industriel';
        else if (simState.acCount >= 5) plan = 'professionnel';
        openMaintenanceModal(plan, simState.acCount, simState.frequency);
      }

      function openMaintenanceModal(plan, count, freq) {
        fetch('/api/session-check', { credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.loggedIn) {
              _doOpenMaintenanceModal(plan, count, freq);
            } else {
              window.location.href = '/espace-client?redirect=contrat-maintenance&error=' + encodeURIComponent('Veuillez vous connecter pour choisir une offre de contrat de maintenance.');
            }
          })
          .catch(function() {
            window.location.href = '/espace-client?redirect=contrat-maintenance';
          });
      }

      function _doOpenMaintenanceModal(plan, count, freq) {
        var modal = document.getElementById('maintenance-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        if (window.__lenis) window.__lenis.stop();

        // Check radio plan
        var targetPlan = plan || 'residentiel';
        var radio = document.querySelector('input[name="plan_type"][value="' + targetPlan + '"]');
        if (radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change'));
        }

        // Set ac count and frequency
        var c = count || (targetPlan === 'residentiel' ? 2 : (targetPlan === 'professionnel' ? 8 : (targetPlan === 'industriel' ? 20 : 5)));
        var nbInput = document.getElementById('modal-nb-clims');
        if (nbInput) nbInput.value = c;

        var f = freq || (targetPlan === 'professionnel' ? 'Confort' : 'Essentiel');
        var freqSelect = document.getElementById('modal-freq-select');
        if (freqSelect) freqSelect.value = f;

        updateModalRecap();
      }

      function closeMaintenanceModal() {
        var modal = document.getElementById('maintenance-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        document.body.classList.remove('modal-open');
        if (window.__lenis) window.__lenis.start();

        if (window.history && window.history.replaceState && (window.location.search.indexOf('success') !== -1 || window.location.search.indexOf('error') !== -1)) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      function updateModalRecap() {
        var selRadio = document.querySelector('input[name="plan_type"]:checked');
        var plan = selRadio ? selRadio.value : 'residentiel';
        var isCustom = plan === 'sur_mesure';
        var isIndus = plan === 'industriel';

        var acConfig = document.getElementById('modal-ac-config');
        var customFields = document.getElementById('modal-custom-fields');
        var submitText = document.getElementById('submit-btn-text');

        if (customFields) customFields.style.display = (isCustom || isIndus) ? 'block' : 'none';
        if (acConfig) acConfig.style.display = isCustom ? 'none' : 'block';

        if (submitText) {
          submitText.textContent = isCustom ? 'Envoyer ma demande personnalisée' : (isIndus ? 'Demander mon devis industriel' : 'Confirmer ma souscription');
        }

        if (!isCustom) {
          var count = parseInt(document.getElementById('modal-nb-clims')?.value || '2', 10);
          var freq = document.getElementById('modal-freq-select')?.value || 'Confort';
          var visits = freq === 'Essentiel' ? 1 : (freq === 'Pro' ? 3 : 2);
          var rate = getUnitRate(count);
          var total = rate * count * visits;

          var unitLabel = document.getElementById('modal-unit-label');
          var totalLabel = document.getElementById('modal-total-label');

          if (isIndus) {
            if (unitLabel) unitLabel.textContent = 'Dès 5 000 F / unité (dégressif)';
            if (totalLabel) totalLabel.textContent = 'Sur devis (sous 2h)';
          } else {
            if (unitLabel) unitLabel.textContent = formatNumber(rate) + ' F / unité / visite';
            if (totalLabel) totalLabel.textContent = formatNumber(total) + ' F CFA / an';
          }
        }
      }

      // Listeners for modal controls
      document.querySelectorAll('input[name="plan_type"]').forEach(function(r) {
        r.addEventListener('change', updateModalRecap);
      });
      document.getElementById('modal-nb-clims')?.addEventListener('input', updateModalRecap);
      document.getElementById('modal-freq-select')?.addEventListener('change', updateModalRecap);

      // Close on backdrop / Esc
      document.getElementById('maintenance-modal')?.addEventListener('click', function(e) {
        if (e.target === this) closeMaintenanceModal();
      });
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeMaintenanceModal();
      });

      window.openMaintenanceModal = openMaintenanceModal;
      window.openMaintenanceModalWithSim = openMaintenanceModalWithSim;
      window.closeMaintenanceModal = closeMaintenanceModal;
      window.simulateFormula = simulateFormula;

      // Auto-open modal if query params present
      var urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') || urlParams.get('error')) {
        document.getElementById('maintenance-modal')?.classList.remove('hidden');
      }
    `}} />

    {/* Auto-fill form from session data */}
    <script dangerouslySetInnerHTML={{ __html: `
      (function() {
        fetch('/api/session-check', { credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data && data.loggedIn) {
              var form = document.getElementById('maintenance-modal');
              if (!form) return;
              if (data.name) {
                var el = form.querySelector('input[name="name"]');
                if (el && !el.value) el.value = data.name;
              }
              if (data.phone) {
                var el = form.querySelector('input[name="phone"]');
                if (el && !el.value) el.value = data.phone.replace(/^\\+?226\\s*/, '');
              }
              if (data.email) {
                var el = form.querySelector('input[name="email"]');
                if (el && !el.value) el.value = data.email;
              }
              if (data.quartier) {
                var el = form.querySelector('input[name="quartier"]');
                if (el && !el.value) el.value = data.quartier;
              }
            }
          })
          .catch(function() {});
      })();
    `}} />
  </Layout>
)
