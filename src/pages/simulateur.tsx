import { Layout } from '../components/Layout'

export const SimulateurPage = ({ 
  product,
  productBtu,
  productName,
  productBrand,
  productModel
}: { 
  product?: number
  productBtu?: number
  productName?: string
  productBrand?: string
  productModel?: string
}) => {
  return (
    <Layout title="Simulateur BTU Climatisation - MAASGA" activePage="simulateur" canonicalPath="/simulateur" description="Simulateur BTU gratuit — Calculez la puissance idéale pour votre climatiseur. Recommandation personnalisée adaptée à Ouagadougou.">

      {/* Hero */}
      <section class="gradient-hero py-16 text-white text-center relative overflow-hidden">
        <div class="absolute inset-0 pointer-events-none">
          <i class="fas fa-calculator absolute top-8 right-8 text-white/10 text-5xl"></i>
        </div>
        <div class="max-w-4xl mx-auto px-4 relative z-10">
          <div class="inline-flex items-center space-x-2 bg-white/15 border border-white/20 rounded-full px-4 py-2 text-sm mb-4">
            <i class="fas fa-calculator text-ice-300"></i>
            <span>Outil gratuit · Résultat immédiat</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-bold mb-4">Simulateur BTU</h1>
          <p class="text-blue-100/90 text-lg max-w-xl mx-auto">
            Calculez la puissance de climatisation nécessaire pour votre espace et trouvez les modèles compatibles.
          </p>
        </div>
      </section>

      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* MODE COMPARAISON (si produit sélectionné) */}
        {product && productBtu && (
          <div class="mb-12 rounded-3xl p-8 reveal" style="background:linear-gradient(135deg,rgba(56,189,248,0.06),rgba(99,102,241,0.06)); border:1px solid rgba(148,180,220,0.1);">
            <div class="flex items-start space-x-4 mb-6">
              <div class="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                <i class="fas fa-balance-scale"></i>
              </div>
              <div class="flex-1">
                <h2 class="text-2xl font-bold text-white mb-1">Mode Comparaison</h2>
                <p class="text-sm" style="color:#8ba3c0;">Vérifiez si ce climatiseur est adapté à votre espace</p>
              </div>
            </div>
            
            {/* Produit sélectionné */}
            <div class="rounded-xl p-5 mb-4 hover-lift" style="background:var(--bg-card); border:1px solid rgba(148,180,220,0.12);">
              <div class="flex items-center space-x-4">
                <div class="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(56,189,248,0.1);">
                  <div class="text-3xl">❄️</div>
                </div>
                <div class="flex-1">
                  <p class="text-xs uppercase tracking-wide mb-1" style="color:#94a3b8;">Climatiseur sélectionné</p>
                  <p class="text-lg font-bold text-white">{productBrand} {productModel}</p>
                  <p class="text-sm" style="color:#94a3b8;">{productName}</p>
                </div>
                <div class="text-right">
                  <div class="text-3xl font-bold" style="color:#38bdf8;">{productBtu.toLocaleString('fr-FR')} BTU</div>
                  <div class="text-sm font-semibold" style="color:#38bdf8;">{productBtu === 9000 ? '1' : productBtu === 12000 ? '1,5' : productBtu === 18000 ? '2' : productBtu === 24000 ? '3' : '5'} CV</div>
                </div>
              </div>
            </div>

            <div class="text-sm text-center rounded-lg p-3 mb-6" style="color:#94a3b8; background:rgba(56,189,248,0.08);">
              <i class="fas fa-info-circle mr-2"></i>
              Entrez les dimensions de votre pièce pour voir si ce modèle convient. Une coche ✓ = combinaison idéale · Un point d'exclamation ⚠ = surdimensionné · Une croix ✗ = insuffisant
            </div>
          </div>
        )}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* ===== FORMULAIRE ===== */}
          <div>
            <div class="glass-card rounded-3xl p-8 reveal">
              <h2 class="text-xl font-bold text-white mb-6 flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.2);">
                  <i class="fas fa-ruler-combined text-cyan-400"></i>
                </div>
                <span>Décrivez votre pièce</span>
              </h2>

              <form method="get" action="/simulateur" class="space-y-5" id="btu-form">

                {/* Longueur et Largeur */}
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-semibold mb-2" style="color:#94a3b8;">
                      Longueur <span class="text-red-500">*</span>
                      <span class="text-gray-400 font-normal ml-1">(m)</span>
                    </label>
                    <div class="relative">
                      <input
                        type="number"
                        name="longueur"
                        min="1" max="50" required
                        placeholder="Ex: 5"
                        class="input-field w-full rounded-xl px-4 py-3 pr-12 text-white"
                        id="longueur-input"
                      />
                      <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">m</span>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-semibold mb-2" style="color:#94a3b8;">
                      Largeur <span class="text-red-500">*</span>
                      <span class="text-gray-400 font-normal ml-1">(m)</span>
                    </label>
                    <div class="relative">
                      <input
                        type="number"
                        name="largeur"
                        min="1" max="50" required
                        placeholder="Ex: 4"
                        class="input-field w-full rounded-xl px-4 py-3 pr-12 text-white"
                        id="largeur-input"
                      />
                      <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">m</span>
                    </div>
                  </div>
                </div>

                {/* Hauteur plafond */}
                <div>
                  <label class="block text-sm font-semibold mb-2" style="color:#94a3b8;">
                    Hauteur du plafond
                    <span class="text-gray-400 font-normal ml-1">(optionnel, en m)</span>
                  </label>
                  <select name="hauteur" class="input-field w-full rounded-xl px-4 py-3 text-white">
                    <option value="2.5">Standard: 2,5 m</option>
                    <option value="2.7">Moyen: 2,7 m</option>
                    <option value="3.0">Haut: 3,0 m</option>
                    <option value="3.5">Très haut: 3,5 m+</option>
                  </select>
                </div>

                {/* Fenêtres */}
                <div>
                  <label class="block text-sm font-semibold mb-2" style="color:#94a3b8;">
                    Nombre de fenêtres / ouvertures
                  </label>
                  <div class="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map(n => (
                      <label class="cursor-pointer">
                        <input type="radio" name="fenetres" value={String(n)} class="sr-only peer" checked={n === 1} />
                        <div class="peer-checked:bg-cyan-500 peer-checked:text-white peer-checked:border-cyan-500 border-2 border-gray-700/50 rounded-xl py-2 text-center text-sm font-semibold text-gray-300 hover:border-cyan-500/50 transition-all">
                          {n === 3 ? '3+' : n}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Exposition */}
                <div>
                  <label class="block text-sm font-semibold mb-2" style="color:#94a3b8;">
                    Exposition solaire de la pièce
                  </label>
                  <div class="space-y-2">
                    {[
                      { val: "faible", label: "Faible", desc: "Peu de soleil direct, côté nord", icon: "fa-cloud", color: "text-blue-500" },
                      { val: "moyenne", label: "Moyenne", desc: "Soleil partiel, côté est/ouest", icon: "fa-cloud-sun", color: "text-yellow-500" },
                      { val: "forte", label: "Forte", desc: "Plein soleil, côté sud", icon: "fa-sun", color: "text-orange-500" }
                    ].map(e => (
                      <label class="cursor-pointer block">
                        <input type="radio" name="exposition" value={e.val} class="sr-only peer" checked={e.val === 'moyenne'} />
                        <div class="peer-checked:bg-cyan-900/20 peer-checked:border-cyan-500/50 border-2 border-gray-700/50 rounded-xl px-4 py-3 flex items-center space-x-3 hover:border-cyan-500/30 transition-all hover-lift">
                          <i class={`fas ${e.icon} ${e.color} text-lg w-6`}></i>
                          <div>
                            <div class="text-sm font-semibold text-white">{e.label}</div>
                            <div class="text-xs" style="color:#94a3b8;">{e.desc}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Type de pièce */}
                <div>
                  <label class="block text-sm font-semibold mb-2" style="color:#94a3b8;">Type de pièce</label>
                  <div class="grid grid-cols-2 gap-2">
                    {[
                      { val: "chambre", label: "Chambre", icon: "fa-bed" },
                      { val: "salon", label: "Salon", icon: "fa-couch" },
                      { val: "bureau", label: "Bureau", icon: "fa-briefcase" },
                      { val: "commerce", label: "Commerce/Boutique", icon: "fa-store" }
                    ].map(t => (
                      <label class="cursor-pointer">
                        <input type="radio" name="type_piece" value={t.val} class="sr-only peer" checked={t.val === 'chambre'} />
                        <div class="peer-checked:bg-cyan-900/20 peer-checked:border-cyan-500/50 border-2 border-gray-700/50 rounded-xl py-3 px-3 flex items-center space-x-2 hover:border-cyan-500/30 transition-all hover-lift">
                          <i class={`fas ${t.icon} text-primary-500 text-sm w-4`}></i>
                          <span class="text-xs font-medium text-gray-300">{t.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" class="w-full btn-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-3 shadow-lg text-base">
                  <i class="fas fa-calculator"></i>
                  <span>Calculer la puissance BTU</span>
                  <i class="fas fa-arrow-right text-sm"></i>
                </button>
              </form>
            </div>
          </div>

          {/* ===== RÉSULTAT + INFO ===== */}
          <div class="space-y-6">

            {/* Zone résultat (JS dynamique) */}
            <div class="glass-card rounded-3xl p-8 reveal" id="result-zone">
              <h3 class="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <i class="fas fa-chart-bar text-cyan-400"></i>
                <span>Résultat du calcul</span>
              </h3>

              <div id="result-empty" class="text-center py-8 text-gray-400">
                <i class="fas fa-arrow-left text-3xl mb-3"></i>
                <p class="text-sm">Remplissez le formulaire et lancez le calcul pour voir le résultat BTU recommandé.</p>
              </div>

              <div id="result-content" class="hidden">
                <div class="bg-gradient-to-br from-primary-600 to-ice-600 text-white rounded-2xl p-6 text-center mb-6">
                  <div class="text-xs opacity-80 uppercase tracking-wider mb-2">Puissance recommandée</div>
                  <div class="text-5xl font-bold mb-1" id="result-btu">--</div>
                  <div class="text-ice-200 text-sm">BTU/h · CV</div>
                  <div class="mt-3 text-xs opacity-80" id="result-surface">Pour une surface de -- m²</div>
                </div>

                <div class="space-y-3 mb-6">
                  <div class="flex items-center justify-between rounded-xl px-4 py-3" style="background:rgba(52,211,153,0.08); border:1px solid rgba(52,211,153,0.15);">
                    <span class="text-sm" style="color:#94a3b8;">Surface couverte</span>
                    <span class="font-semibold text-white" id="res-surf">--</span>
                  </div>
                  <div class="flex items-center justify-between rounded-xl px-4 py-3" style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.15);">
                    <span class="text-sm" style="color:#94a3b8;">Indice de confort</span>
                    <span class="font-semibold" style="color:#34d399;" id="res-confort">--</span>
                  </div>
                  <div class="flex items-center justify-between rounded-xl px-4 py-3" style="background:rgba(167,139,250,0.08); border:1px solid rgba(167,139,250,0.15);">
                    <span class="text-sm" style="color:#94a3b8;">Modèles compatibles</span>
                    <span class="font-semibold text-white" id="res-nb">--</span>
                  </div>
                </div>

                {/* Comparaison produit (si en mode comparaison) */}
                <div id="comparison-zone" class="hidden mb-6 rounded-xl p-5" style="background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(56,189,248,0.08)); border:1px solid rgba(148,180,220,0.12);">
                  <h4 class="text-sm font-bold text-white mb-4 flex items-center space-x-2">
                    <i class="fas fa-exchange-alt" style="color:#38bdf8;"></i>
                    <span>Comparaison avec le produit sélectionné</span>
                  </h4>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="rounded-lg p-4 text-center" style="background:var(--bg-card); border:1px solid rgba(148,180,220,0.12);">
                      <div class="text-xs uppercase mb-2" style="color:#94a3b8;">Recommandation</div>
                      <div class="text-2xl font-bold mb-1" style="color:#38bdf8;" id="comp-recommended">--</div>
                      <div class="text-xs" style="color:#8ba3c0;" id="comp-recommended-cv">-- CV</div>
                    </div>
                    <div class="rounded-lg p-4 text-center" style="background:var(--bg-card); border:1px solid rgba(148,180,220,0.12);">
                      <div class="text-xs uppercase mb-2" style="color:#94a3b8;">Votre climatiseur</div>
                      <div class="text-2xl font-bold mb-1" style="color:#a78bfa;" id="comp-product">--</div>
                      <div class="text-xs" style="color:#8ba3c0;" id="comp-product-cv">-- CV</div>
                    </div>
                  </div>
                  <div class="mt-4 p-4 rounded-lg text-center text-sm font-semibold" id="comp-verdict">--</div>
                </div>

                <a id="see-products-btn" href="/catalogue" class="w-full btn-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 shadow-md mb-3">
                  <i class="fas fa-th-large text-sm"></i>
                  <span>Voir les climatiseurs compatibles</span>
                  <i class="fas fa-arrow-right text-sm"></i>
                </a>

                <a id="demander-devis-btn" href="/rendez-vous"
                  class="w-full flex items-center justify-center space-x-2 font-bold py-3.5 rounded-xl mb-4"
                  style="background:linear-gradient(135deg,rgba(52,211,153,0.12),rgba(16,185,129,0.08)); color:#34d399; border:1.5px solid rgba(52,211,153,0.3);">
                  <i class="fas fa-file-invoice-dollar text-sm"></i>
                  <span>Demander un devis personnalisé</span>
                  <i class="fas fa-arrow-right text-sm"></i>
                </a>

                {/* Option multi-unités */}
                <div id="multi-unit-option" class="hidden rounded-xl p-4" style="background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2);">
                  <div class="flex items-start space-x-3">
                    <i class="fas fa-clone" style="color:#818cf8; margin-top:2px;"></i>
                    <div class="flex-1">
                      <p class="text-sm font-semibold mb-1" style="color:#818cf8;">Option Multi-unités</p>
                      <p class="text-xs mb-3" style="color:#94a3b8;" id="multi-unit-desc">Installation de plusieurs climatiseurs pour une couverture optimale :</p>
                      <div id="multi-unit-units" class="space-y-2 mb-3"></div>
                      <div class="flex items-center space-x-2">
                        <a id="see-multi-btn" href="/catalogue" class="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors">
                          <i class="fas fa-th-large mr-1"></i>Voir le catalogue
                        </a>
                        <a id="devis-multi-btn" href="/rendez-vous" class="text-xs px-3 py-1.5 rounded-lg transition-colors" style="color:#111827; border:1px solid #111827;">
                          <i class="fas fa-file-invoice-dollar mr-1"></i>Devis multi-unités
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Avertissement */}
            <div class="rounded-2xl p-5 reveal" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.15);">
              <div class="flex items-start space-x-3">
                <i class="fas fa-info-circle text-amber-500 mt-0.5 flex-shrink-0 text-lg"></i>
                <div>
                  <p class="text-sm font-semibold mb-1" style="color:#fbbf24;">Calcul indicatif</p>
                  <p class="text-xs leading-relaxed font-bold" style="color:#03045e;">
                    Ce simulateur fournit une estimation basée sur des paramètres standards. Une Visite technique gratuite sur site par nos experts est <strong>recommandée avant toute installation</strong> pour garantir un dimensionnement précis et adapté à votre configuration réelle.
                  </p>
                </div>
              </div>
            </div>

            {/* Guide BTU */}
            <div class="glass-card rounded-2xl p-6 reveal">
              <h4 class="font-bold text-white mb-4 flex items-center space-x-2">
                <i class="fas fa-book text-cyan-400"></i>
                <span>Guide rapide BTU</span>
              </h4>
              <div class="space-y-3">
                {[
                  { btu: 9000, cv: 1, surf: "9 – 15 m²", usage: "Chambre, bureau individuel" },
                  { btu: 12000, cv: 1.5, surf: "15 – 25 m²", usage: "Salon, chambre principale" },
                  { btu: 18000, cv: 2, surf: "25 – 40 m²", usage: "Grand salon, open space" },
                  { btu: 24000, cv: 3, surf: "35 – 55 m²", usage: "Grand commerce, restaurant" },
                  { btu: 36000, cv: 5, surf: "55 – 80 m²", usage: "Grande salle, boutique" }
                ].map(g => (
                  <div class="flex items-center justify-between py-2 border-b border-gray-700/30 last:border-0">
                    <div>
                      <span class="text-sm font-bold text-cyan-400">{(g.btu / 1000).toFixed(0)} 000 BTU / {g.cv} CV</span>
                      <span class="text-xs ml-2" style="color:#94a3b8;">· {g.surf}</span>
                    </div>
                    <span class="text-xs" style="color:#94a3b8;">{g.usage}</span>
                  </div>
                ))}
              </div>
              <div class="mt-4 p-3 rounded-xl text-xs" style="background:rgba(56,189,248,0.08); color:#94a3b8;">
                <i class="fas fa-lightbulb mr-1"></i>
                En climat tropical (Ouagadougou), il est recommandé de majorer de 10 à 15% la puissance calculée.
              </div>
            </div>

            {/* CTA RDV */}
            <div class="bg-gradient-to-br from-primary-700 to-ice-700 text-white rounded-2xl p-6 text-center reveal">
              <i class="fas fa-phone-alt text-3xl mb-3 opacity-90"></i>
              <h4 class="font-bold text-lg mb-2">Besoin d'un avis expert ?</h4>
              <p class="text-sm mb-4" style="color:#111827;">Nos techniciens se déplacent gratuitement pour dimensionner votre projet.</p>
              <a href="/rendez-vous" class="bg-white text-primary-700 font-bold px-6 py-3 rounded-xl inline-flex items-center space-x-2 hover:bg-blue-50 transition-colors shadow-md">
                <i class="fas fa-calendar-check"></i>
                <span>Prendre rendez-vous</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Script calcul BTU */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
        // Mode comparaison: récupérer le BTU du produit passé en paramètre
        const PRODUCT_BTU = ${productBtu ? productBtu : 'null'};

        // Données produits pour le simulateur
        const PRODUCTS = [
          { id:1, btu:9000 }, { id:2, btu:12000 }, { id:3, btu:18000 },
          { id:4, btu:9000 }, { id:5, btu:12000 }, { id:6, btu:24000 },
          { id:7, btu:18000 }, { id:8, btu:24000 }, { id:9, btu:36000 }
        ];

        // Conversion BTU vers CV — paliers marché Burkina Faso (1, 1.5, 2, 3, 5 CV)
        const BTU_TO_CV = {
          9000: 1,
          12000: 1.5,
          18000: 2,
          24000: 3,
          36000: 5
        };
        const CV_LABEL = {
          9000: '1', 12000: '1,5', 18000: '2', 24000: '3', 36000: '5'
        };

        // Paliers disponibles sur le marché
        const PALIERS = [9000, 12000, 18000, 24000, 36000];

        function calculateBTU(surface, hauteur, fenetres, exposition, type_piece) {
          // Base: 450 BTU/m2
          let base = surface * 450;

          // Ajustement hauteur (volume thermique)
          if (hauteur >= 3.5) base *= 1.12;
          else if (hauteur >= 3.0) base *= 1.08;
          else if (hauteur >= 2.7) base *= 1.04;

          // Ajustement fenetres
          base += fenetres * 500;

          // Ajustement exposition solaire
          if (exposition === 'forte') base *= 1.15;
          else if (exposition === 'moyenne') base *= 1.08;

          // Ajustement type piece
          if (type_piece === 'commerce') base *= 1.20;
          else if (type_piece === 'salon')   base *= 1.05;
          else if (type_piece === 'bureau')  base *= 1.03;

          // Selection du palier optimal
          let selected = PALIERS[0];
          for (let i = 0; i < PALIERS.length; i++) {
            if (base >= PALIERS[i] * 0.85) selected = PALIERS[i];
          }
          return selected;
        }

        function getComparisonVerdict(recommendedBtu, productBtu) {
          if (!PRODUCT_BTU) return null;
          
          if (productBtu >= recommendedBtu * 1.1) {
            return { 
              status: 'SURDIMENSIONNÉ', 
              style: 'background:rgba(251,191,36,0.1); color:#fbbf24; border:1px solid rgba(251,191,36,0.2);',
              icon: '⚠',
              text: "Ce modèle est plus puissant que nécessaire. Cela fonctionne, mais consomme plus d'électricité."
            };
          }
          if (productBtu >= recommendedBtu * 0.9 && productBtu <= recommendedBtu * 1.1) {
            return { 
              status: 'PARFAIT ✓', 
              style: 'background:rgba(52,211,153,0.1); color:#34d399; border:1px solid rgba(52,211,153,0.2);',
              icon: '✓',
              text: 'Excellente combinaison! Ce climatiseur convient parfaitement à votre espace.'
            };
          }
          if (productBtu >= recommendedBtu * 0.75) {
            return { 
              status: 'BON CHOIX', 
              style: 'background:rgba(56,189,248,0.1); color:#38bdf8; border:1px solid rgba(56,189,248,0.2);',
              icon: '✓',
              text: "Acceptable pour votre espace, mais légèrement moins puissant que l'optimal."
            };
          }
          return { 
            status: 'INSUFFISANT ✗', 
              style: 'background:rgba(248,113,113,0.1); color:#f87171; border:1px solid rgba(248,113,113,0.2);',
            icon: '✗',
            text: 'Attention: ce modèle est trop faible pour refroidir efficacement votre pièce.'
          };
        }

        document.getElementById('btu-form').addEventListener('submit', function(e) {
          e.preventDefault();
          const data = new FormData(this);
          const longueur = parseFloat(data.get('longueur')) || 5;
          const largeur = parseFloat(data.get('largeur')) || 4;
          const surface = longueur * largeur;
          const hauteur = parseFloat(data.get('hauteur')) || 2.5;
          const fenetres = parseInt(data.get('fenetres')) || 1;
          const exposition = data.get('exposition') || 'moyenne';
          const type_piece = data.get('type_piece') || 'chambre';

          const btu = calculateBTU(surface, hauteur, fenetres, exposition, type_piece);
          const cv = BTU_TO_CV[btu] || 1;
          const compatibles = PRODUCTS.filter(p => p.btu === btu);

          document.getElementById('result-empty').classList.add('hidden');
          document.getElementById('result-content').classList.remove('hidden');
          document.getElementById('result-btu').textContent = btu.toLocaleString('fr-FR') + ' BTU / ' + (CV_LABEL[btu] || cv) + ' CV';
          document.getElementById('result-surface').textContent = 'Pour une surface approximative de ' + surface.toFixed(0) + ' m²';
          document.getElementById('res-surf').textContent = surface.toFixed(0) + ' m² (approx.)';
          document.getElementById('res-confort').textContent = 'Adapté ✓';
          document.getElementById('res-nb').textContent = compatibles.length + ' modèle(s)';
          document.getElementById('see-products-btn').href = '/catalogue?btu=' + btu;

          // Update devis request link with surface + BTU
          var devisBtn = document.getElementById('demander-devis-btn');
          if (devisBtn) devisBtn.href = '/rendez-vous?surface=' + surface.toFixed(0) + '&btu=' + btu + '&type=devis';

          // ── Option multi-unités ──────────────────────────────────────────
          const multiUnit = document.getElementById('multi-unit-option');
          const multiUnitsEl = document.getElementById('multi-unit-units');
          const multiDevisBtn = document.getElementById('devis-multi-btn');

          // Préparer les options selon le BTU recommandé
          let multiOptions = null;
          if (btu === 24000) {
            // 3 CV → alternative 2× 1,5 CV
            multiOptions = {
              desc: 'Pour couvrir uniformément votre espace avec 2 unités :',
              units: [
                { btu: 12000, cv: '1,5', label: '1ère unité — 12 000 BTU / 1,5 CV' },
                { btu: 12000, cv: '1,5', label: '2ème unité — 12 000 BTU / 1,5 CV' }
              ],
              avantage: 'Refroidissement plus homogène · Maintenance facilitée · Chaque unité peut fonctionner seule'
            };
          } else if (btu === 36000) {
            // 5 CV → alternative 2 CV + 3 CV
            multiOptions = {
              desc: 'Grande surface — installation bi-split recommandée :',
              units: [
                { btu: 18000, cv: '2',   label: 'Unité principale — 18 000 BTU / 2 CV' },
                { btu: 24000, cv: '3',   label: 'Unité secondaire — 24 000 BTU / 3 CV' }
              ],
              avantage: "Couvre jusqu'à 80 m² · Zones de confort distinctes · Consommation optimisée"
            };
          }

          if (multiOptions) {
            document.getElementById('multi-unit-desc').textContent = multiOptions.desc;
            multiUnitsEl.innerHTML = multiOptions.units.map(u =>
              '<div class="flex items-center justify-between rounded-lg px-3 py-2" style="background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.15);">'
              + '<span class="text-xs text-gray-300">' + u.label + '</span>'
              + '<span class="text-xs font-bold" style="color:#818cf8;">BTU: ' + u.btu.toLocaleString('fr-FR') + '</span>'
              + '</div>'
            ).join('')
            + '<div class="mt-2 text-xs px-2" style="color:#94a3b8;"><i class="fas fa-check-circle mr-1" style="color:#818cf8;"></i>' + multiOptions.avantage + '</div>';
            if (multiDevisBtn) multiDevisBtn.href = '/rendez-vous?surface=' + surface.toFixed(0) + '&btu=' + btu + '&type=devis';
            multiUnit.classList.remove('hidden');
          } else {
            multiUnit.classList.add('hidden');
          }

          // Afficher comparaison produit si en mode comparaison
          if (PRODUCT_BTU) {
            const verdict = getComparisonVerdict(btu, PRODUCT_BTU);
            if (verdict) {
              const compZone = document.getElementById('comparison-zone');
              compZone.classList.remove('hidden');
              
              const productCv = BTU_TO_CV[PRODUCT_BTU] || 1;
              document.getElementById('comp-recommended').textContent = btu.toLocaleString('fr-FR');
              document.getElementById('comp-recommended-cv').textContent = (CV_LABEL[btu] || cv) + ' CV';
              document.getElementById('comp-product').textContent = PRODUCT_BTU.toLocaleString('fr-FR');
              document.getElementById('comp-product-cv').textContent = (CV_LABEL[PRODUCT_BTU] || productCv) + ' CV';
              
              const verdictDiv = document.getElementById('comp-verdict');
              verdictDiv.className = 'mt-4 p-4 rounded-lg text-center text-sm font-semibold';
              verdictDiv.style.cssText = verdict.style;
              verdictDiv.textContent = verdict.icon + ' ' + verdict.status + ' · ' + verdict.text;
            }
          }

          // Scroll vers résultat sur mobile
          document.getElementById('result-zone').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        })();
      `}} />
    </Layout>
  )
}
