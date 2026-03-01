import { Layout } from '../components/Layout'
import { products } from '../data/products'
import { quartiersByArrondissement } from '../data/quartiers'

export const CataloguePage = ({ filters }: { filters?: { brand?: string; btu?: string; inverter?: string; available?: string; product?: string } }) => {
  // Always render all products; JS handles client-side filtering
  let filtered = [...products]
  const allProducts = [...products]

  const brands = [...new Set(products.map(p => p.brand))]
  const btuList = [...new Set(products.map(p => p.btu))].sort((a, b) => a - b)
  const selectedProduct = filters?.product ? products.find(p => p.id === parseInt(filters.product!)) : null

  return (
    <Layout title="Catalogue Climatiseurs - MAASGA Ouagadougou" activePage="catalogue" canonicalPath="/catalogue" description="Catalogue climatiseurs MAASGA — Découvrez nos modèles split, inverter et classiques à Ouagadougou. Prix compétitifs, fiches techniques, commande en ligne.">

      {/* Hero */}
      <section class="gradient-hero py-16 text-white text-center relative overflow-hidden">
        <div class="glow-dot w-72 h-72 top-0 right-0" style="background:rgba(14,165,233,0.1);"></div>
        <div class="max-w-7xl mx-auto px-4 relative z-10">
          <h1 class="text-4xl md:text-5xl font-bold mb-3">Catalogue Climatiseurs</h1>
          <p class="text-lg max-w-xl mx-auto mb-6" style="color:rgba(186,230,253,0.8);">
            Tous nos modèles disponibles à Ouagadougou. Prix, fiches techniques, disponibilité en temps réel.
          </p>
       
        </div>
      </section>

      {/* Bouton panier flottant */}
      <button onclick="openCartModal()" class="fixed bottom-6 right-6 z-40 flex items-center space-x-2 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm text-white transition-all hover:scale-105" style="background:linear-gradient(135deg,#0ea5e9,#3b82f6); border:2px solid rgba(255,255,255,0.15);">
        <i class="fas fa-shopping-cart text-lg"></i>
        <span>Mon panier</span>
        <span id="cart-count-badge" class="hidden ml-1 bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black">0</span>
      </button>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="flex flex-col lg:flex-row gap-8">

          {/* ===== SIDEBAR FILTRES ===== */}
          <aside class="lg:w-64 flex-shrink-0 reveal">
            <form method="get" action="/catalogue" class="glass-card rounded-2xl p-6 sticky top-24">
              <div class="flex items-center justify-between mb-5">
                <h3 class="font-bold text-white flex items-center space-x-2">
                  <i class="fas fa-sliders-h" style="color:#38bdf8;"></i>
                  <span>Filtres</span>
                </h3>
                <a href="/catalogue" class="text-xs hover:text-red-400 transition-colors" style="color:#64748b;">Réinitialiser</a>
              </div>

              {/* Marque */}
              <div class="mb-5">
                <label class="block text-xs font-semibold uppercase tracking-wider mb-3" style="color:#38bdf8;">Marque</label>
                <div class="space-y-2">
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="brand" value="all" class="accent-cyan-400" checked={!filters?.brand || filters.brand === 'all'} />
                    <span class="text-sm" style="color:#7a9cc4;">Toutes les marques</span>
                  </label>
                  {brands.map(b => (
                    <label class="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="brand" value={b} class="accent-cyan-400" checked={filters?.brand === b} />
                      <span class="text-sm" style="color:#7a9cc4;">{b}</span>
                      <span class="ml-auto text-xs px-2 py-0.5 rounded-full" style="background:rgba(56,189,248,0.1); color:#38bdf8;">
                        {products.filter(p => p.brand === b).length}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* BTU */}
              <div class="mb-5">
                <label class="block text-xs font-semibold uppercase tracking-wider mb-3" style="color:#38bdf8;">Puissance BTU</label>
                <div class="space-y-2">
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="btu" value="all" class="accent-cyan-400" checked={!filters?.btu || filters.btu === 'all'} />
                    <span class="text-sm" style="color:#7a9cc4;">Toutes puissances</span>
                  </label>
                  {btuList.map(b => (
                    <label class="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="btu" value={String(b)} class="accent-cyan-400" checked={filters?.btu === String(b)} />
                      <span class="text-sm" style="color:#7a9cc4;">{b.toLocaleString()} BTU / {({ 9000: 1, 12000: 1.5, 18000: 2, 24000: 3, 36000: 5 }[b] || 1)} CV</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Inverter */}
              <div class="mb-5">
                <label class="block text-xs font-semibold uppercase tracking-wider mb-3" style="color:#38bdf8;">Technologie</label>
                <div class="space-y-2">
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="inverter" value="all" class="accent-cyan-400" checked={!filters?.inverter} />
                    <span class="text-sm" style="color:#7a9cc4;">Toutes</span>
                  </label>
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="inverter" value="true" class="accent-cyan-400" checked={filters?.inverter === 'true'} />
                    <span class="text-sm" style="color:#7a9cc4;">Inverter uniquement</span>
                    <span class="ml-auto text-xs px-2 py-0.5 rounded-full" style="background:rgba(52,211,153,0.1); color:#34d399;">ECO</span>
                  </label>
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="inverter" value="false" class="accent-cyan-400" checked={filters?.inverter === 'false'} />
                    <span class="text-sm" style="color:#7a9cc4;">Non-Inverter</span>
                  </label>
                </div>
              </div>

              {/* Disponibilité */}
              <div class="mb-6">
                <label class="block text-xs font-semibold uppercase tracking-wider mb-3" style="color:#38bdf8;">Disponibilité</label>
                <label class="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" name="available" value="true" class="accent-cyan-400 w-4 h-4" checked={filters?.available === 'true'} />
                  <span class="text-sm" style="color:#7a9cc4;">En stock uniquement</span>
                </label>
              </div>

              <button type="submit" class="w-full btn-primary text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 hidden">
                <i class="fas fa-search"></i>
                <span>Appliquer les filtres</span>
              </button>
              <p class="text-center text-xs mt-3" style="color:#64748b;" id="filter-live-count"></p>
            </form>
          </aside>

          {/* ===== GRILLE PRODUITS ===== */}
          <div class="flex-1">
            <div class="flex items-center justify-between mb-6">
              <p style="color:#8ba3c0;" id="product-count">
                <strong class="text-white">{filtered.length}</strong> climatiseur{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
              </p>
              <div class="flex items-center space-x-2 text-sm" style="color:#64748b;">
                <i class="fas fa-info-circle" style="color:#38bdf8;"></i>
                <span>Prix en FCFA, installation offerte</span>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div class="text-center py-20 glass-card rounded-2xl">
                <i class="fas fa-search text-4xl mb-4" style="color:#1e2a3a;"></i>
                <p class="text-lg font-medium text-white">Aucun produit ne correspond</p>
                <a href="/catalogue" class="mt-4 inline-block" style="color:#38bdf8;">Réinitialiser les filtres</a>
              </div>
            ) : (
              <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 reveal" id="products-grid">
                {filtered.map(p => (
                  <div data-brand={p.brand} data-btu={String(p.btu)} data-inverter={String(p.inverter)} data-stock={String(p.stock)} data-available={String(p.available)} data-id={String(p.id)} data-name={p.name} data-price={String(p.price)} data-model={p.model} data-energy={p.energy_class} data-image={p.image} class={`product-card glass-card rounded-2xl overflow-hidden transition-all duration-300 group ${!p.available || p.stock === 0 ? 'opacity-60' : 'hover-lift'}`}>
                    {/* Image */}
                    <div class="relative p-6 text-center" style="background:linear-gradient(145deg,#e8f2ff,#f0f7ff);">
                      {(p as any).imageUrl
                        ? <img src={(p as any).imageUrl} alt={p.name} class="w-32 h-32 object-contain mx-auto mb-2" loading="lazy" />
                        : <div class="text-6xl mb-2">{p.image}</div>
                      }
                      <div class="flex items-center justify-center space-x-2">
                        {p.inverter && (
                          <span class="text-xs text-white px-2 py-1 rounded-lg font-semibold" style="background:linear-gradient(135deg,#0ea5e9,#3b82f6);">INVERTER</span>
                        )}
                        <span class="text-xs px-2 py-1 rounded-lg font-medium" style="background:rgba(56,189,248,0.1); color:#38bdf8;">{p.energy_class}</span>
                      </div>
                      <span class={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full font-semibold ${p.stock > 3 ? 'badge-stock-ok' : p.stock > 0 ? 'badge-stock-low' : 'badge-stock-out'}`}>
                        {p.stock > 3 ? '✓ Disponible' : p.stock > 0 ? '⚠ Stock limité' : '✗ Rupture'}
                      </span>
                    </div>

                    {/* Info */}
                    <div class="p-5">
                      <div class="text-xs font-bold uppercase tracking-wider mb-1" style="color:#38bdf8;">{p.brand}</div>
                      <h3 class="font-bold text-white text-sm mb-1 leading-tight">{p.name}</h3>
                      <p class="text-xs mb-3" style="color:#64748b;">Réf: {p.model}</p>

                      <div class="grid grid-cols-2 gap-2 my-3">
                        <div class="rounded-lg px-2 py-2 text-center" style="background:rgba(56,189,248,0.07); border:1px solid rgba(56,189,248,0.15);">
                          <div class="text-xs font-medium" style="color:#38bdf8;">Puissance</div>
                          <div class="text-sm font-bold text-white">{p.btu.toLocaleString()} BTU</div>
                          <div class="text-xs" style="color:#38bdf8;">{({ 9000: 1, 12000: 1.5, 18000: 2, 24000: 3, 36000: 5 }[p.btu] || 1)} CV</div>
                        </div>
                        <div class="rounded-lg px-2 py-2 text-center" style="background:rgba(52,211,153,0.07); border:1px solid rgba(52,211,153,0.15);">
                          <div class="text-xs font-medium" style="color:#34d399;">Surface</div>
                          <div class="text-sm font-bold text-white">{p.surface_min}-{p.surface_max} m²</div>
                        </div>
                      </div>

                      <div class="flex flex-wrap gap-1 mb-4">
                        {p.features.slice(0, 3).map(f => (
                          <span class="text-xs px-2 py-0.5 rounded-full" style="background:rgba(56,189,248,0.06); color:#8ba3c0; border:1px solid rgba(56,189,248,0.1);">{f}</span>
                        ))}
                        {p.features.length > 3 && (
                          <span class="text-xs" style="color:#64748b;">+{p.features.length - 3}</span>
                        )}
                      </div>

                      <div class="pt-3 mb-4" style="border-top:1px solid rgba(56,189,248,0.1);">
                        <div class="text-lg font-bold text-white">{p.price.toLocaleString()} <span class="text-xs" style="color:#8ba3c0;">FCFA</span></div>
                        <div class="text-xs font-semibold" style="color:#34d399;">Installation et livraison offerte</div>
                      </div>

                      {p.stock > 0 && p.available ? (
                        <div class="space-y-2">
                          <button onclick={`openProductDetail(${p.id})`} class="w-full font-semibold py-2 rounded-xl flex items-center justify-center space-x-2 text-sm transition-colors" style="background:rgba(56,189,248,0.1); color:#38bdf8; border:1px solid rgba(56,189,248,0.25);">
                            <i class="fas fa-info-circle text-xs"></i>
                            <span>Voir les détails</span>
                          </button>
                          <button onclick={`openOrderModal(${p.id})`} class="w-full btn-primary text-white font-semibold py-2.5 rounded-xl flex items-center justify-center space-x-2 text-sm">
                            <i class="fas fa-shopping-bag text-xs"></i>
                            <span>Commander</span>
                          </button>
                          <a href={`/simulateur?product=${p.id}`} class="w-full flex items-center justify-center space-x-2 text-xs py-1 transition-colors" style="color:#38bdf8;">
                            <i class="fas fa-calculator"></i>
                            <span>Vérifier compatibilité BTU</span>
                          </a>
                          <button id={`compare-btn-${p.id}`} onclick={`toggleCompare(${p.id})`} class="w-full font-semibold py-1.5 rounded-xl flex items-center justify-center space-x-2 text-xs transition-all" style="background:rgba(167,139,250,0.07); color:#a78bfa; border:1px solid rgba(167,139,250,0.18);">
                            <i class="fas fa-balance-scale text-xs"></i>
                            <span>Comparer</span>
                          </button>
                        </div>
                      ) : (
                        <div class="space-y-2">
                          <button onclick={`openProductDetail(${p.id})`} class="w-full font-semibold py-2 rounded-xl flex items-center justify-center space-x-2 text-sm transition-colors" style="background:rgba(56,189,248,0.08); color:#38bdf8; border:1px solid rgba(56,189,248,0.2);">
                            <i class="fas fa-info-circle text-xs"></i>
                            <span>Voir les détails</span>
                          </button>
                          <div class="w-full font-semibold py-2.5 rounded-xl flex items-center justify-center space-x-2 text-sm cursor-not-allowed" style="background:rgba(255,255,255,0.05); color:#64748b; border:1px solid rgba(255,255,255,0.08);">
                            <i class="fas fa-ban text-xs"></i>
                            <span>Rupture de stock</span>
                          </div>
                          <a href="/rendez-vous" class="w-full flex items-center justify-center space-x-2 text-xs py-1" style="color:#38bdf8;">
                            <i class="fas fa-bell"></i>
                            <span>Me notifier du réapprovisionnement</span>
                          </a>
                          <button id={`compare-btn-${p.id}`} onclick={`toggleCompare(${p.id})`} class="w-full font-semibold py-1.5 rounded-xl flex items-center justify-center space-x-2 text-xs transition-all" style="background:rgba(167,139,250,0.07); color:#a78bfa; border:1px solid rgba(167,139,250,0.18);">
                            <i class="fas fa-balance-scale text-xs"></i>
                            <span>Comparer</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notice bas de page */}
            <div class="mt-8 rounded-2xl p-6" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.15);">
              <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="flex items-start space-x-4">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.2);">
                    <i class="fas fa-clipboard-check text-xl" style="color:#38bdf8;"></i>
                  </div>
                  <div>
                    <h4 class="font-bold text-white mb-1">Processus de commande MAASGA</h4>
                    <p class="text-sm" style="color:#8ba3c0;">
                      1. Demande en ligne · 2. Visite technique gratuite · 3. Devis PDF · 4. Validation & paiement · 5. Installation pro
                    </p>
                  </div>
                </div>
                <a href="/rendez-vous" class="flex-shrink-0 btn-primary text-white font-semibold px-6 py-3 rounded-xl text-sm whitespace-nowrap">
                  <i class="fas fa-calendar mr-2"></i>Prendre RDV
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Détail Produit */}
      <div id="product-detail-modal" class="hidden fixed inset-0 z-50 flex items-start justify-center p-4 pt-8" style="background:rgba(0,0,0,0.85); backdrop-filter:blur(6px);" role="dialog" aria-modal="true" aria-labelledby="modal-product-name">
        <div class="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl" style="background:#ffffff; border:1px solid rgba(59,130,246,0.15); max-height:90vh; overflow-y:auto;">
          {/* Header */}
          <div class="flex items-center justify-between px-6 py-4" style="background:rgba(56,189,248,0.05); border-bottom:1px solid rgba(56,189,248,0.12);">
            <h3 id="modal-product-name" class="font-bold text-white text-lg leading-tight pr-4">—</h3>
            <button onclick="var m=document.getElementById('product-detail-modal');m.classList.add('hidden');if(window.releaseFocus)window.releaseFocus(m);" class="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors" style="color:#38bdf8;">
              <i class="fas fa-times"></i>
            </button>
          </div>
          {/* Body */}
          <div class="p-6 space-y-6">
            {/* Image + badges */}
            <div class="flex items-center gap-5">
              <div id="modal-image-wrap" class="w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0" style="background:linear-gradient(145deg,#e8f2ff,#f0f7ff); border:1px solid rgba(59,130,246,0.15);">
                <span id="modal-image-emoji" class="text-5xl">❄️</span>
              </div>
              <div>
                <div id="modal-brand" class="text-xs font-bold uppercase tracking-wider mb-1" style="color:#38bdf8;">—</div>
                <div id="modal-ref" class="text-xs mb-2" style="color:#64748b;">Réf: —</div>
                <div class="flex flex-wrap gap-2" id="modal-badges"></div>
              </div>
            </div>
            {/* Key specs */}
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4" id="modal-key-specs"></div>
            {/* Price */}
            <div class="rounded-2xl p-4" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.15);">
              <div class="flex items-end justify-between">
                <div>
                  <div id="modal-price" class="text-2xl font-bold text-white">—</div>
                  <div class="text-xs font-semibold mt-0.5" style="color:#34d399;">Installation et livraison offerte</div>
                </div>
                <div id="modal-stock-badge" class="text-xs px-3 py-1 rounded-full font-semibold"></div>
              </div>
            </div>
            {/* Description */}
            <div id="modal-description-wrap" class="hidden">
              <h4 class="text-sm font-bold text-white mb-2">Description</h4>
              <p id="modal-description" class="text-sm leading-relaxed" style="color:#6b8aaa;"></p>
            </div>
            {/* Features */}
            <div id="modal-features-wrap" class="hidden">
              <h4 class="text-sm font-bold text-white mb-2">Fonctionnalités</h4>
              <div id="modal-features" class="flex flex-wrap gap-2"></div>
            </div>
            {/* Tech Specs */}
            <div id="modal-techspecs-wrap" class="hidden">
              <h4 class="text-sm font-bold text-white mb-3"><i class="fas fa-microchip mr-2" style="color:#38bdf8;"></i>Caractéristiques techniques</h4>
              <div id="modal-techspecs" class="grid grid-cols-1 sm:grid-cols-2 gap-2"></div>
            </div>
            {/* Galerie Média */}
            <div id="modal-media-wrap" class="hidden">
              <h4 class="text-sm font-bold text-white mb-3"><i class="fas fa-image mr-2" style="color:#38bdf8;"></i>Galerie</h4>
              <div class="space-y-3">
                <div id="modal-media-main" class="rounded-2xl overflow-hidden" 
                  style="background:linear-gradient(145deg,#e8f2ff,#f0f7ff); aspect-ratio:16/9; border:1px solid rgba(59,130,246,0.15); display:flex; align-items:center; justify-content:center;">
                  {/* Main image/video will be inserted here */}
                </div>
                <div id="modal-media-thumbs" class="flex gap-2 overflow-x-auto pb-2" style="border-bottom:1px solid rgba(56,189,248,0.1);"></div>
              </div>
            </div>
            {/* Quantité */}
            <div id="modal-quantity-wrap" class="hidden p-4 rounded-xl" style="background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.25);">
              <div class="flex items-center justify-between">
                <label class="text-sm font-semibold text-white">Quantité</label>
                <div class="flex items-center space-x-3">
                  <button type="button" onclick="updateQty(-1)" class="w-8 h-8 rounded-lg flex items-center justify-center text-center" style="background:rgba(56,189,248,0.15); color:#38bdf8; font-weight:bold;">−</button>
                  <input type="number" id="modal-qty-input" value="1" min="1" class="w-12 text-center font-bold rounded-lg" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.2); color:white; padding:6px;" />
                  <button type="button" onclick="updateQty(1)" class="w-8 h-8 rounded-lg flex items-center justify-center text-center" style="background:rgba(56,189,248,0.15); color:#38bdf8; font-weight:bold;">+</button>
                </div>
              </div>
            </div>
            {/* CTA */}
            <div id="modal-cta" class="flex gap-3 pt-2"></div>
          </div>
        </div>
      </div>

      {/* ===== MODAL PANIER ===== */}
      <div id="cart-modal" class="hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style="background:rgba(0,0,0,0.8); backdrop-filter:blur(6px);" role="dialog" aria-modal="true" aria-label="Panier">
        <div class="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden" style="background:#ffffff; border:1px solid rgba(59,130,246,0.2); max-height:90vh; display:flex; flex-direction:column;">
          <div class="flex items-center justify-between px-6 py-4 flex-shrink-0" style="background:rgba(59,130,246,0.05); border-bottom:1px solid rgba(59,130,246,0.1);">
            <h3 class="font-bold text-slate-800 text-lg flex items-center space-x-2">
              <i class="fas fa-shopping-cart" style="color:#38bdf8;"></i>
              <span>Mon panier</span>
              <span id="cart-modal-count" class="text-xs px-2 py-0.5 rounded-full font-bold" style="background:rgba(236,72,153,0.2); color:#f472b6;">0 article</span>
            </h3>
            <button onclick="closeCartModal()" class="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors" style="color:#38bdf8;">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <div id="cart-empty-msg" class="text-center py-12">
              <i class="fas fa-shopping-cart text-4xl mb-4" style="color:#1e2a3a;"></i>
              <p class="text-white font-medium">Votre panier est vide</p>
              <p class="text-sm mt-1" style="color:#64748b;">Ajoutez des climatiseurs depuis le catalogue</p>
            </div>
            <div id="cart-items-list" class="hidden space-y-3"></div>
          </div>
          <div id="cart-footer" class="hidden px-6 py-4 flex-shrink-0" style="border-top:1px solid rgba(56,189,248,0.12);">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-semibold" style="color:#7a9cc4;">Total estimé</span>
              <span id="cart-total" class="text-xl font-bold text-white">0 FCFA</span>
            </div>
            <div class="text-xs mb-4 px-3 py-2 rounded-xl" style="background:rgba(251,191,36,0.08); color:#fbbf24; border:1px solid rgba(251,191,36,0.2);">
              <i class="fas fa-info-circle mr-1"></i> Commande sous réserve de Visite technique gratuite. Un conseiller vous rappellera.
            </div>
            <div class="flex gap-3">
              <button onclick="clearCart()" class="flex-none px-4 py-3 rounded-xl text-sm font-semibold" style="background:rgba(239,68,68,0.1); color:#f87171; border:1px solid rgba(239,68,68,0.2);">
                <i class="fas fa-trash mr-1"></i>Vider
              </button>
              <button onclick="validateCart()" class="flex-1 py-3 rounded-xl text-sm font-bold text-white" style="background:linear-gradient(135deg,#0ea5e9,#3b82f6);">
                <i class="fas fa-check mr-2"></i>Valider ma commande
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Commande / Checkout */}
      <div id="order-modal" class="hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style="background:rgba(0,0,0,0.85); backdrop-filter:blur(6px);" role="dialog" aria-modal="true" aria-label="Passer commande">
        <div class="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden" style="background:#ffffff; border:1px solid rgba(59,130,246,0.2); max-height:92vh; display:flex; flex-direction:column;">
          <div class="flex items-center justify-between px-6 py-4 flex-shrink-0" style="background:rgba(56,189,248,0.07); border-bottom:1px solid rgba(56,189,248,0.12);">
            <h3 class="font-bold text-white text-lg flex items-center space-x-2">
              <i class="fas fa-shopping-bag" style="color:#38bdf8;"></i>
              <span>Passer commande</span>
            </h3>
            <button onclick="closeOrderModal()" class="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors" style="color:#38bdf8;">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            <div class="rounded-xl px-4 py-3 text-sm flex items-center justify-between" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.1);">
              <span style="color:#8ba3c0;">Déjà client MAASGA ?</span>
              <a href="/espace-client" style="color:#38bdf8; font-weight:600;">Se connecter pour préremplir →</a>
            </div>

            <div id="order-summary-box" style="display:none; background:rgba(56,189,248,0.04); border:1px solid rgba(56,189,248,0.12); border-radius:14px; padding:12px;">
              <div class="text-xs font-semibold mb-2" style="color:#38bdf8; text-transform:uppercase; letter-spacing:0.05em;">Récapitulatif</div>
              <div id="order-summary-content" style="font-size:0.82rem; color:#a0c0d8;"></div>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color:#7a9cc4;">Nom complet *</label>
                <input id="order-name" type="text" placeholder="Ex: Amadou Traoré" class="w-full px-4 py-3 rounded-xl text-white text-sm" style="background:rgba(15,23,42,0.7); border:1px solid rgba(56,189,248,0.2); outline:none;" />
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color:#7a9cc4;">Téléphone *</label>
                <input id="order-phone" type="tel" placeholder="Ex: 07 07 07 07 07" class="w-full px-4 py-3 rounded-xl text-white text-sm" style="background:rgba(15,23,42,0.7); border:1px solid rgba(56,189,248,0.2); outline:none;" />
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color:#7a9cc4;">Quartier / Secteur *</label>
                <select id="order-quartier" class="w-full px-4 py-3 rounded-xl text-white text-sm" style="background:#141c2e; border:1px solid rgba(56,189,248,0.2); outline:none;">
                  <option value="">Sélectionner votre quartier</option>
                  {(() => {
                    const grouped = quartiersByArrondissement()
                    return Object.entries(grouped).map(([arr, qList]) => (
                      <optgroup label={`Arrondissement ${arr}`}>
                        {qList.map(q => <option value={q.name}>{q.name}</option>)}
                      </optgroup>
                    ))
                  })()}
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color:#7a9cc4;">Position GPS <span style="color:#8ba3c0;">(optionnel)</span></label>
                <button type="button" id="order-gps-btn" onclick="requestOrderLocation()" style="width:100%; padding:11px 16px; border-radius:12px; background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.25); color:#38bdf8; font-weight:600; font-size:0.82rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                  <i class="fas fa-crosshairs"></i>
                  <span id="order-gps-label">Partager ma position</span>
                </button>
                <div id="order-gps-status" style="display:none; margin-top:8px; font-size:0.72rem; padding:8px 12px; border-radius:8px;"></div>
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color:#7a9cc4;">Email (optionnel)</label>
                <input id="order-email" type="email" placeholder="Ex: amadou@gmail.com" class="w-full px-4 py-3 rounded-xl text-white text-sm" style="background:rgba(15,23,42,0.7); border:1px solid rgba(56,189,248,0.2); outline:none;" />
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color:#7a9cc4;">Notes / Instructions</label>
                <textarea id="order-notes" rows={2} placeholder="Ex: Appartement au 3ème étage, installer dans le salon" class="w-full px-4 py-3 rounded-xl text-white text-sm resize-none" style="background:rgba(15,23,42,0.7); border:1px solid rgba(56,189,248,0.2); outline:none;"></textarea>
              </div>
            </div>

            <div>
              <div class="text-xs font-semibold mb-3" style="color:#7a9cc4; text-transform:uppercase; letter-spacing:0.05em;">Méthode de paiement</div>
              <div class="space-y-2">
                <label class="flex items-center gap-3 px-4 py-3 rounded-xl" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); opacity:0.5; cursor:not-allowed;">
                  <input type="radio" name="order-payment" value="orange_money" disabled />
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:#ff6600;">
                    <i class="fas fa-mobile-alt text-white text-xs"></i>
                  </div>
                  <div>
                    <div class="text-sm font-semibold text-white">Orange Money</div>
                    <div class="text-xs" style="color:#64748b;">Bientôt disponible</div>
                  </div>
                </label>
                <label class="flex items-center gap-3 px-4 py-3 rounded-xl" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); opacity:0.5; cursor:not-allowed;">
                  <input type="radio" name="order-payment" value="moov_money" disabled />
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:#003399;">
                    <i class="fas fa-mobile-alt text-white text-xs"></i>
                  </div>
                  <div>
                    <div class="text-sm font-semibold text-white">Moov Money</div>
                    <div class="text-xs" style="color:#64748b;">Bientôt disponible</div>
                  </div>
                </label>
                <label class="flex items-center gap-3 px-4 py-3 rounded-xl" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); opacity:0.5; cursor:not-allowed;">
                  <input type="radio" name="order-payment" value="wave" disabled />
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:#1a6ef5;">
                    <i class="fas fa-bolt text-white text-xs"></i>
                  </div>
                  <div>
                    <div class="text-sm font-semibold text-white">Wave</div>
                    <div class="text-xs" style="color:#64748b;">Bientôt disponible</div>
                  </div>
                </label>
                <label class="flex items-center gap-3 px-4 py-3 rounded-xl" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); opacity:0.5; cursor:not-allowed;">
                  <input type="radio" name="order-payment" value="carte" disabled />
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(148,163,184,0.2);">
                    <i class="fas fa-credit-card" style="color:#94a3b8; font-size:0.75rem;"></i>
                  </div>
                  <div>
                    <div class="text-sm font-semibold text-white">Carte bancaire</div>
                    <div class="text-xs" style="color:#64748b;">Bientôt disponible</div>
                  </div>
                </label>
              </div>
              <div class="text-xs mt-3 px-3 py-2 rounded-xl" style="background:rgba(251,191,36,0.06); color:#fbbf24; border:1px solid rgba(251,191,36,0.15);">
                <i class="fas fa-info-circle mr-1"></i> La méthode de paiement sera confirmée avec votre conseiller MAASGA.
              </div>
            </div>
          </div>

          <div id="order-form-footer" class="px-6 py-4 flex-shrink-0" style="border-top:1px solid rgba(56,189,248,0.12);">
            <button id="order-submit-btn" onclick="submitOrder()" class="w-full py-3.5 rounded-xl text-white font-bold text-sm" style="background:linear-gradient(135deg,#0ea5e9,#3b82f6);">
              <i class="fas fa-check mr-2"></i>Confirmer la commande
            </button>
            <p class="text-xs text-center mt-2" style="color:#475569;">Un conseiller MAASGA vous contactera pour confirmer</p>
          </div>

          <div id="order-success-msg" class="hidden px-6 py-8 text-center">
            <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style="background:rgba(52,211,153,0.15); border:2px solid rgba(52,211,153,0.3);">
              <i class="fas fa-check text-2xl" style="color:#34d399;"></i>
            </div>
            <h4 class="font-bold text-white text-lg mb-2">Commande reçue !</h4>
            <p class="text-sm mb-1" style="color:#8ba3c0;">Merci pour votre confiance.</p>
            <p class="text-sm" style="color:#8ba3c0;">Un conseiller MAASGA vous appellera dans les <strong style="color:#38bdf8;">24h</strong> pour confirmer votre commande.</p>

            <div id="create-account-section" style="margin-top:20px; text-align:left;">
              <div style="background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.15); border-radius:14px; padding:16px;">
                <div style="font-size:0.82rem; font-weight:700; color:white; margin-bottom:8px;">
                  <i class="fas fa-user-circle" style="color:#38bdf8; margin-right:6px;"></i>Créer votre compte MAASGA
                </div>
                <p style="font-size:0.95rem; color:#7ab8d4; margin-bottom:14px; line-height:1.5;">Suivez vos commandes et RDV. Ne re-remplissez plus jamais les formulaires.</p>
                <a href="/espace-client" style="display:block; width:100%; padding:11px; border-radius:10px; background:rgba(56,189,248,0.15); color:#38bdf8; font-weight:700; font-size:0.82rem; border:1px solid rgba(56,189,248,0.25); text-align:center; text-decoration:none;">
                  <i class="fas fa-user-plus" style="margin-right:6px;"></i>Créer mon compte
                </a>
              </div>
            </div>

            <button onclick="closeOrderModal()" class="mt-4 px-8 py-3 rounded-xl font-semibold text-sm" style="background:rgba(56,189,248,0.1); color:#38bdf8; border:1px solid rgba(56,189,248,0.25);">Fermer</button>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        window.__CAT_PRODUCTS__ = ${JSON.stringify(allProducts.map(p => ({
          id: p.id, name: p.name, brand: p.brand, model: p.model,
          btu: p.btu, price: p.price, stock: p.stock, energy_class: p.energy_class,
          surface_min: p.surface_min, surface_max: p.surface_max,
          description: p.description, features: p.features,
          inverter: p.inverter, available: p.available,
          image: p.image, imageUrl: (p as any).imageUrl || '',
          warranty: (p as any).warranty || '',
          techSpecs: p.techSpecs || null,
          media: p.media || []
        }))).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\//g, '\\u002f')};

        const TECH_LABELS = {
          power_source: 'Source de courant',
          cooling_capacity: 'Capacité refroidissement',
          cooling_input_power: 'Puissance refroid. entrée',
          nominal_cooling_current: 'Courant nominal refroid.',
          max_input_consumption: 'Max. Consommation entrée',
          max_current: 'Courant max',
          starting_current: 'Courant de démarrage',
          compressor_type: 'Type de compresseur',
          indoor_airflow: "Débit d'air intérieur",
          indoor_noise: 'Bruit intérieur',
          refrigerant_type: 'Type de réfrigérant',
          design_pressure: 'Pression de conception',
          operating_temp: 'Temp. de fonctionnement',
          ambient_temp_cooling: 'Temp. ambiante refroid.'
        };

        // Global Escape key handler for all modals
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            var modals = ['product-detail-modal', 'cart-modal', 'order-modal', 'compare-modal'];
            modals.forEach(function(id) {
              var m = document.getElementById(id);
              if (m && !m.classList.contains('hidden')) {
                m.classList.add('hidden');
                document.body.style.overflow = '';
                if (window.releaseFocus) window.releaseFocus(m);
              }
            });
          }
        });

        function openProductDetail(id) {
          const p = window.__CAT_PRODUCTS__.find(x => x.id === id);
          if (!p) return;

          document.getElementById('modal-product-name').textContent = p.name;
          document.getElementById('modal-brand').textContent = p.brand;
          document.getElementById('modal-ref').textContent = 'Réf: ' + (p.model || '—');

          // Image
          const imgWrap = document.getElementById('modal-image-wrap');
          const imgEmoji = document.getElementById('modal-image-emoji');
          if (p.imageUrl) {
            imgWrap.innerHTML = '<img src="' + p.imageUrl + '" alt="' + p.name + '" style="width:100%;height:100%;object-fit:contain;" />';
          } else {
            imgWrap.innerHTML = '<span id="modal-image-emoji" style="font-size:3rem;">' + (p.image || '❄️') + '</span>';
          }

          // Badges
          const badges = document.getElementById('modal-badges');
          let badgeHtml = '';
          if (p.inverter) badgeHtml += '<span style="background:linear-gradient(135deg,#0ea5e9,#3b82f6);color:white;font-size:0.7rem;padding:2px 8px;border-radius:6px;font-weight:700;">INVERTER</span>';
          badgeHtml += '<span style="background:rgba(56,189,248,0.1);color:#38bdf8;font-size:0.7rem;padding:2px 8px;border-radius:6px;font-weight:600;">' + p.energy_class + '</span>';
          if (p.warranty) badgeHtml += '<span style="background:rgba(52,211,153,0.1);color:#34d399;font-size:0.7rem;padding:2px 8px;border-radius:6px;font-weight:600;">' + p.warranty + '</span>';
          badges.innerHTML = badgeHtml;

          // Key specs
          const cvMap = {9000:1,12000:1.5,18000:2,24000:3,36000:5};
          const keySpecs = document.getElementById('modal-key-specs');
          keySpecs.innerHTML = [
            {label:'Puissance', val: (p.btu||0).toLocaleString() + ' BTU<br><span style="font-size:0.75rem;color:#38bdf8;">' + (cvMap[p.btu]||1) + ' CV</span>', color:'rgba(56,189,248,0.07)', border:'rgba(56,189,248,0.15)', lcolor:'#38bdf8'},
            {label:'Surface', val: p.surface_min + '–' + p.surface_max + ' m²', color:'rgba(52,211,153,0.07)', border:'rgba(52,211,153,0.15)', lcolor:'#34d399'},
            {label:'Énergie', val: p.energy_class, color:'rgba(139,92,246,0.07)', border:'rgba(139,92,246,0.15)', lcolor:'#a78bfa'},
            {label:'Stock', val: p.stock > 3 ? 'Disponible' : p.stock > 0 ? 'Limité' : 'Rupture', color:p.stock>3?'rgba(52,211,153,0.07)':p.stock>0?'rgba(245,158,11,0.07)':'rgba(239,68,68,0.07)', border:p.stock>3?'rgba(52,211,153,0.15)':p.stock>0?'rgba(245,158,11,0.15)':'rgba(239,68,68,0.15)', lcolor:p.stock>3?'#34d399':p.stock>0?'#fbbf24':'#f87171'}
          ].map(s => '<div style="border-radius:10px;padding:8px;text-align:center;background:'+s.color+';border:1px solid '+s.border+';"><div style="font-size:0.65rem;font-weight:600;color:'+s.lcolor+';">'+s.label+'</div><div style="font-size:0.85rem;font-weight:700;color:white;margin-top:2px;">'+s.val+'</div></div>').join('');

          // Price
          document.getElementById('modal-price').textContent = (p.price||0).toLocaleString() + ' FCFA';
          const sb = document.getElementById('modal-stock-badge');
          if (p.stock > 3) { sb.textContent='✓ Disponible'; sb.style.cssText='background:rgba(16,185,129,0.15);color:#34d399;border:1px solid rgba(16,185,129,0.25);'; }
          else if (p.stock > 0) { sb.textContent='⚠ Stock limité'; sb.style.cssText='background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.25);'; }
          else { sb.textContent='✗ Rupture'; sb.style.cssText='background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.25);'; }

          // Description
          const descWrap = document.getElementById('modal-description-wrap');
          if (p.description) { document.getElementById('modal-description').textContent = p.description; descWrap.classList.remove('hidden'); }
          else descWrap.classList.add('hidden');

          // Features
          const featWrap = document.getElementById('modal-features-wrap');
          const feats = Array.isArray(p.features) ? p.features : [];
          if (feats.length > 0) {
            document.getElementById('modal-features').innerHTML = feats.map(f => '<span style="background:rgba(56,189,248,0.08);color:#38bdf8;border:1px solid rgba(56,189,248,0.15);font-size:0.75rem;padding:3px 10px;border-radius:20px;">'+f+'</span>').join('');
            featWrap.classList.remove('hidden');
          } else featWrap.classList.add('hidden');

          // Tech Specs
          const tsWrap = document.getElementById('modal-techspecs-wrap');
          const ts = p.techSpecs;
          if (ts && Object.keys(ts).length > 0) {
            document.getElementById('modal-techspecs').innerHTML = Object.entries(ts).map(([k,v]) =>
              '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;border-radius:8px;background:rgba(56,189,248,0.04);border:1px solid rgba(56,189,248,0.1);">' +
                '<span style="font-size:0.7rem;color:#6b8aaa;">' + (TECH_LABELS[k]||k) + '</span>' +
                '<span style="font-size:0.75rem;font-weight:600;color:#e2e8f0;">' + v + '</span>' +
              '</div>'
            ).join('');
            tsWrap.classList.remove('hidden');
          } else tsWrap.classList.add('hidden');

          // Galerie Média
          const mediaWrap = document.getElementById('modal-media-wrap');
          const media = Array.isArray(p.media) ? p.media : [];
          if (media.length > 0) {
            const mainDisplay = document.getElementById('modal-media-main');
            const thumbsContainer = document.getElementById('modal-media-thumbs');
            thumbsContainer.innerHTML = '';
            
            // Render main display for first media
            const first = media[0];
            if (first.type === 'image') {
              mainDisplay.innerHTML = '<img src="' + first.url + '" alt="' + (first.caption||'') + '" style="width:100%;height:100%;object-fit:contain;" />';
            } else {
              mainDisplay.innerHTML = '<video src="' + first.url + '" style="width:100%;height:100%;object-fit:contain;" controls></video>';
            }
            
            // Render thumbnails
            media.forEach((item, idx) => {
              const thumb = document.createElement('div');
              thumb.style.cssText = 'flex-shrink:0;width:80px;height:60px;border-radius:8px;overflow:hidden;cursor:pointer;border:2px solid rgba(56,189,248,0.2);background:rgba(0,0,0,0.5);' + (idx===0?'border-color:rgba(56,189,248,0.6);':'');
              if (item.type === 'image') {
                thumb.innerHTML = '<img src="' + item.url + '" style="width:100%;height:100%;object-fit:cover;" />';
              } else {
                thumb.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#000;color:#38bdf8;"><i class="fas fa-play" style="font-size:1.5rem;"></i></div>';
                const video = document.createElement('video');
                video.src = item.url;
                video.style.display = 'none';
              }
              thumb.onclick = () => {
                // Update main display
                if (item.type === 'image') {
                  mainDisplay.innerHTML = '<img src="' + item.url + '" alt="' + (item.caption||'') + '" style="width:100%;height:100%;object-fit:contain;" />';
                } else {
                  mainDisplay.innerHTML = '<video src="' + item.url + '" style="width:100%;height:100%;object-fit:contain;" controls></video>';
                }
                // Update thumbnails border
                Array.from(thumbsContainer.children).forEach((t) => t.style.borderColor = 'rgba(56,189,248,0.2)');
                thumb.style.borderColor = 'rgba(56,189,248,0.6)';
              };
              thumbsContainer.appendChild(thumb);
            });
            mediaWrap.classList.remove('hidden');
          } else mediaWrap.classList.add('hidden');

          // CTA
          const qtyWrap = document.getElementById('modal-quantity-wrap');
          const qtyInput = document.getElementById('modal-qty-input');
          
          if (p.stock > 0 && p.available) {
            qtyWrap.classList.remove('hidden');
            qtyInput.value = '1';
            qtyInput.max = String(p.stock);
            
            const currentProductId = p.id;
            document.getElementById('modal-cta').innerHTML = 
              '<button type="button" onclick="addToCart('+currentProductId+', parseInt(document.getElementById(\\'modal-qty-input\\').value))" style="flex:2;background:linear-gradient(135deg,#0ea5e9,#3b82f6);color:white;font-weight:700;padding:12px;border-radius:12px;text-align:center;font-size:0.85rem;text-decoration:none;border:none;cursor:pointer;"><i class="fas fa-shopping-cart" style="margin-right:6px;"></i>Ajouter au panier</button>' +
              '<button type="button" onclick="openOrderModal('+currentProductId+')" style="flex:1;background:rgba(56,189,248,0.1);color:#38bdf8;font-weight:600;padding:12px;border-radius:12px;text-align:center;font-size:0.85rem;border:1px solid rgba(56,189,248,0.25);cursor:pointer;"><i class="fas fa-shopping-bag"></i><br><span>Cmd</span></button>';
          } else {
            qtyWrap.classList.add('hidden');
            document.getElementById('modal-cta').innerHTML = '<a href="/rendez-vous" style="flex:1;background:rgba(56,189,248,0.1);color:#38bdf8;font-weight:600;padding:12px;border-radius:12px;text-align:center;font-size:0.85rem;text-decoration:none;border:1px solid rgba(56,189,248,0.25);"><i class="fas fa-bell" style="margin-right:6px;"></i>Me notifier</a>';
          }

          var pdm = document.getElementById('product-detail-modal');
          pdm.classList.remove('hidden');
          if (window.trapFocus) window.trapFocus(pdm);
        }

        document.getElementById('product-detail-modal').addEventListener('click', function(e) {
          if (e.target === this) { this.classList.add('hidden'); if (window.releaseFocus) window.releaseFocus(this); }
        });

        // Gestion du panier (localStorage)
        function updateQty(delta) {
          const input = document.getElementById('modal-qty-input');
          const newVal = parseInt(input.value || '1') + delta;
          const max = parseInt(input.max || '99');
          if (newVal >= 1 && newVal <= max) input.value = String(newVal);
        }

        function addToCart(productId, quantity) {
          const prod = window.__CAT_PRODUCTS__.find(p => p.id === productId);
          if (!prod) return;
          
          let cart = JSON.parse(localStorage.getItem('maasga_cart') || '[]');
          const existing = cart.find(item => item.id === productId);
          
          if (existing) {
            existing.quantity = Math.min((existing.quantity || 1) + quantity, prod.stock);
          } else {
            cart.push({
              id: productId,
              name: prod.name,
              brand: prod.brand,
              price: prod.price,
              quantity: quantity
            });
          }
          
          localStorage.setItem('maasga_cart', JSON.stringify(cart));
          updateCartBadge();
          
          // Feedback utilisateur
          const btn = event.target.closest('button') || event.target;
          const originalText = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check"></i> Ajouté!';
          btn.style.background = 'rgba(52,211,153,0.25)';
          btn.style.color = '#34d399';
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = 'linear-gradient(135deg,#0ea5e9,#3b82f6)';
            btn.style.color = 'white';
          }, 2000);
        }

        // ===== GESTION DU MODAL PANIER =====
        function openCartModal() {
          renderCartModal();
          var cm = document.getElementById('cart-modal');
          cm.classList.remove('hidden');
          if (window.trapFocus) window.trapFocus(cm);
        }
        function closeCartModal() {
          var cm = document.getElementById('cart-modal');
          cm.classList.add('hidden');
          if (window.releaseFocus) window.releaseFocus(cm);
        }
        document.getElementById('cart-modal').addEventListener('click', function(e) {
          if (e.target === this) closeCartModal();
        });

        function updateCartBadge() {
          const cart = JSON.parse(localStorage.getItem('maasga_cart') || '[]');
          const badge = document.getElementById('cart-count-badge');
          const total = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);
          if (total > 0) {
            badge.textContent = total;
            badge.classList.remove('hidden');
          } else {
            badge.classList.add('hidden');
          }
        }

        function renderCartModal() {
          const cart = JSON.parse(localStorage.getItem('maasga_cart') || '[]');
          const emptyMsg = document.getElementById('cart-empty-msg');
          const itemsList = document.getElementById('cart-items-list');
          const footer = document.getElementById('cart-footer');
          const countEl = document.getElementById('cart-modal-count');
          const totalQty = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);
          countEl.textContent = totalQty + ' article' + (totalQty > 1 ? 's' : '');

          if (cart.length === 0) {
            emptyMsg.classList.remove('hidden');
            itemsList.classList.add('hidden');
            footer.classList.add('hidden');
            return;
          }
          emptyMsg.classList.add('hidden');
          itemsList.classList.remove('hidden');
          footer.classList.remove('hidden');

          let total = 0;
          itemsList.innerHTML = cart.map(item => {
            total += item.price * (item.quantity || 1);
            return '<div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;background:rgba(56,189,248,0.05);border:1px solid rgba(56,189,248,0.1);">'
              + '<div style="flex:1;">'
                + '<div style="font-weight:600;color:white;font-size:0.85rem;">' + item.name + '</div>'
                + '<div style="font-size:0.7rem;color:#38bdf8;margin-top:2px;">' + item.brand + '</div>'
                + '<div style="font-size:0.7rem;color:#8ba3c0;margin-top:2px;">' + item.price.toLocaleString() + ' FCFA / unité</div>'
              + '</div>'
              + '<div style="display:flex;align-items:center;gap:6px;">'
                + '<button onclick="cartQty(' + item.id + ',-1)" style="width:28px;height:28px;border-radius:8px;background:rgba(56,189,248,0.1);color:#38bdf8;font-weight:bold;border:none;cursor:pointer;">−</button>'
                + '<span style="font-weight:bold;color:white;width:24px;text-align:center;">' + item.quantity + '</span>'
                + '<button onclick="cartQty(' + item.id + ',1)" style="width:28px;height:28px;border-radius:8px;background:rgba(56,189,248,0.1);color:#38bdf8;font-weight:bold;border:none;cursor:pointer;">+</button>'
                + '<button onclick="cartRemove(' + item.id + ')" style="width:28px;height:28px;border-radius:8px;background:rgba(239,68,68,0.1);color:#f87171;border:none;cursor:pointer;margin-left:4px;"><i class="fas fa-trash" style="font-size:0.7rem;"></i></button>'
              + '</div>'
            + '</div>';
          }).join('');

          document.getElementById('cart-total').textContent = total.toLocaleString() + ' FCFA';
        }

        function cartQty(id, delta) {
          let cart = JSON.parse(localStorage.getItem('maasga_cart') || '[]');
          const item = cart.find(i => i.id === id);
          if (item) {
            const prod = window.__CAT_PRODUCTS__.find(p => p.id === id);
            item.quantity = Math.max(1, Math.min(item.quantity + delta, prod ? prod.stock : 99));
            localStorage.setItem('maasga_cart', JSON.stringify(cart));
            renderCartModal();
            updateCartBadge();
          }
        }

        function cartRemove(id) {
          let cart = JSON.parse(localStorage.getItem('maasga_cart') || '[]');
          cart = cart.filter(i => i.id !== id);
          localStorage.setItem('maasga_cart', JSON.stringify(cart));
          renderCartModal();
          updateCartBadge();
        }

        function clearCart() {
          localStorage.removeItem('maasga_cart');
          renderCartModal();
          updateCartBadge();
        }

        function validateCart() {
          const cart = JSON.parse(localStorage.getItem('maasga_cart') || '[]');
          if (cart.length === 0) return;
          closeCartModal();
          openCartOrderModal();
        }

        // ===== GESTION MODAL COMMANDE =====
        let __ORDER_GPS__ = null;

        function requestOrderLocation() {
          const btn = document.getElementById('order-gps-btn');
          const label = document.getElementById('order-gps-label');
          const status = document.getElementById('order-gps-status');
          if (!navigator.geolocation) {
            status.textContent = '\u274c G\u00e9olocalisation non support\u00e9e par votre navigateur.';
            status.style.cssText = 'display:block; background:rgba(239,68,68,0.08); color:#f87171; border:1px solid rgba(239,68,68,0.2);';
            return;
          }
          label.textContent = 'Localisation en cours\u2026';
          btn.style.opacity = '0.7';
          btn.disabled = true;
          navigator.geolocation.getCurrentPosition(
            function(pos) {
              __ORDER_GPS__ = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) };
              btn.style.cssText = 'width:100%; padding:11px 16px; border-radius:12px; background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.3); color:#34d399; font-weight:600; font-size:0.82rem; cursor:default; display:flex; align-items:center; justify-content:center; gap:8px;';
              label.innerHTML = '<i class="fas fa-check" style="margin-right:4px;"></i>Position partag\u00e9e (\u00b1' + __ORDER_GPS__.accuracy + 'm)';
              btn.disabled = false;
              status.style.display = 'none';
            },
            function(err) {
              btn.style.opacity = '1';
              btn.disabled = false;
              label.textContent = 'Partager ma position';
              let msg = 'Erreur de localisation.';
              if (err.code === 1) msg = '\u274c Permission refus\u00e9e. Autorisez la localisation dans votre navigateur.';
              else if (err.code === 2) msg = '\u274c Position indisponible. V\u00e9rifiez votre GPS.';
              else if (err.code === 3) msg = '\u274c D\u00e9lai d\u00e9pass\u00e9. R\u00e9essayez.';
              status.textContent = msg;
              status.style.cssText = 'display:block; background:rgba(239,68,68,0.08); color:#f87171; border:1px solid rgba(239,68,68,0.2); border-radius:8px; padding:8px 12px; font-size:0.72rem; margin-top:8px;';
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
          );
        }

        function openOrderModal(productId) {
          const prod = window.__CAT_PRODUCTS__.find(p => p.id === productId);
          window.__ORDER_CONTEXT__ = { type: 'single', productId };
          const box = document.getElementById('order-summary-box');
          const content = document.getElementById('order-summary-content');
          if (prod) {
            content.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;">'
              + '<span>' + prod.name + ' — 1 unité</span>'
              + '<span style="color:white;font-weight:700;">' + prod.price.toLocaleString() + ' FCFA</span>'
              + '</div>';
            box.style.display = 'block';
          } else {
            box.style.display = 'none';
          }
          resetOrderModal();
          prefillOrderForm();
          var om = document.getElementById('order-modal');
          om.classList.remove('hidden');
          if (window.trapFocus) window.trapFocus(om);
        }

        function openCartOrderModal() {
          const cart = JSON.parse(localStorage.getItem('maasga_cart') || '[]');
          window.__ORDER_CONTEXT__ = { type: 'cart', items: cart };
          const box = document.getElementById('order-summary-box');
          const content = document.getElementById('order-summary-content');
          if (cart.length > 0) {
            let total = 0;
            content.innerHTML = cart.map(item => {
              total += item.price * (item.quantity || 1);
              return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">'
                + '<span>' + item.name + ' x' + item.quantity + '</span>'
                + '<span style="color:white;font-weight:600;">' + (item.price * item.quantity).toLocaleString() + ' FCFA</span>'
                + '</div>';
            }).join('') + '<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(56,189,248,0.15);display:flex;justify-content:space-between;">'
              + '<span style="font-weight:700;color:white;">Total</span>'
              + '<span style="font-weight:700;color:#38bdf8;">' + total.toLocaleString() + ' FCFA</span>'
              + '</div>';
            box.style.display = 'block';
          } else {
            box.style.display = 'none';
          }
          resetOrderModal();
          prefillOrderForm();
          var om2 = document.getElementById('order-modal');
          om2.classList.remove('hidden');
          if (window.trapFocus) window.trapFocus(om2);
        }

        function closeOrderModal() {
          var om = document.getElementById('order-modal');
          om.classList.add('hidden');
          if (window.releaseFocus) window.releaseFocus(om);
          resetOrderModal();
        }

        function resetOrderModal() {
          document.getElementById('order-success-msg').classList.add('hidden');
          document.getElementById('order-form-footer').classList.remove('hidden');
          const btn = document.getElementById('order-submit-btn');
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check mr-2"></i>Confirmer la commande';
            btn.style.background = 'linear-gradient(135deg,#0ea5e9,#3b82f6)';
          }
          const caSection = document.getElementById('create-account-section');
          if (caSection) caSection.style.display = '';
          const pwdInput = document.getElementById('register-password');
          if (pwdInput) pwdInput.value = '';
          // Réinitialiser GPS
          __ORDER_GPS__ = null;
          const gpsBtn = document.getElementById('order-gps-btn');
          if (gpsBtn) {
            gpsBtn.style.cssText = 'width:100%; padding:11px 16px; border-radius:12px; background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.25); color:#38bdf8; font-weight:600; font-size:0.82rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;';
            gpsBtn.disabled = false;
          }
          const gpsLabel = document.getElementById('order-gps-label');
          if (gpsLabel) gpsLabel.textContent = 'Partager ma position';
          const gpsStatus = document.getElementById('order-gps-status');
          if (gpsStatus) gpsStatus.style.display = 'none';
        }

        function prefillOrderForm() {
          try {
            const saved = JSON.parse(localStorage.getItem('maasga_client_info') || '{}');
            if (saved.name) document.getElementById('order-name').value = saved.name;
            if (saved.phone) document.getElementById('order-phone').value = saved.phone;
            if (saved.quartier) document.getElementById('order-quartier').value = saved.quartier;
            if (saved.email) document.getElementById('order-email').value = saved.email;
          } catch(e) {}
        }

        async function submitOrder() {
          const name = document.getElementById('order-name').value.trim();
          const phone = document.getElementById('order-phone').value.trim();
          const quartier = document.getElementById('order-quartier').value.trim();
          const email = document.getElementById('order-email').value.trim();
          const notes = document.getElementById('order-notes').value.trim();
          if (!name || !phone) {
            showToast('Merci de renseigner votre nom et votre téléphone.', 'warning');
            return;
          }
          const btn = document.getElementById('order-submit-btn');
          btn.disabled = true;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Envoi en cours…';
          const ctx = window.__ORDER_CONTEXT__ || {};
          let orderNotes = notes;
          if (ctx.type === 'single') {
            const prod = window.__CAT_PRODUCTS__.find(p => p.id === ctx.productId);
            if (prod) orderNotes = (notes ? notes + ' | ' : '') + 'Produit: ' + prod.name;
          } else if (ctx.type === 'cart' && Array.isArray(ctx.items)) {
            const cartStr = ctx.items.map(i => i.name + ' x' + i.quantity).join(', ');
            orderNotes = (notes ? notes + ' | ' : '') + 'Panier: ' + cartStr;
          }
          const product_id = ctx.type === 'single' ? ctx.productId : null;
          try {
            const res = await fetch('/api/order/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                client_name: name,
                client_phone: phone,
                client_email: email || null,
                client_address: quartier || null,
                latitude: __ORDER_GPS__ ? __ORDER_GPS__.lat : null,
                longitude: __ORDER_GPS__ ? __ORDER_GPS__.lng : null,
                product_id: product_id,
                notes: orderNotes || null,
                type: 'vente',
                payment_method: 'a_confirmer'
              })
            });
            if (res.ok) {
              localStorage.setItem('maasga_client_info', JSON.stringify({ name, phone, quartier, email }));
              if (ctx.type === 'cart') {
                localStorage.removeItem('maasga_cart');
                updateCartBadge();
              }
              document.getElementById('order-form-footer').classList.add('hidden');
              document.getElementById('order-success-msg').classList.remove('hidden');
              ['order-name','order-phone','order-quartier','order-email','order-notes'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
              });
            } else {
              const err = await res.json().catch(() => ({}));
              btn.disabled = false;
              btn.innerHTML = '<i class="fas fa-check mr-2"></i>Confirmer la commande';
              btn.style.background = 'linear-gradient(135deg,#0ea5e9,#3b82f6)';
              showToast('Erreur: ' + (err.error || 'Veuillez réessayer.'), 'error');
            }
          } catch(e) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check mr-2"></i>Confirmer la commande';
            btn.style.background = 'linear-gradient(135deg,#0ea5e9,#3b82f6)';
            showToast('Erreur réseau. Vérifiez votre connexion.', 'error');
          }
        }

        document.getElementById('order-modal').addEventListener('click', function(e) {
          if (e.target === this) closeOrderModal();
        });

        async function createAccountAfterOrder() {
          const savedInfo = JSON.parse(localStorage.getItem('maasga_client_info') || '{}');
          const password = document.getElementById('register-password').value.trim();
          if (!password || password.length < 6) {
            showToast('Mot de passe trop court (minimum 6 caractères).', 'warning');
            return;
          }
          const btn = event.target.closest('button');
          btn.disabled = true;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i>Création...';
          try {
            const res = await fetch('/api/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: savedInfo.name || '',
                phone: savedInfo.phone || '',
                email: savedInfo.email || null,
                password
              })
            });
            const data = await res.json();
            if (data.success) {
              document.getElementById('create-account-section').innerHTML =
                '<div style="text-align:center; color:#34d399; font-size:0.82rem; padding:14px; background:rgba(52,211,153,0.08); border:1px solid rgba(52,211,153,0.2); border-radius:12px;">'
                + '<i class="fas fa-check-circle" style="margin-right:6px;"></i>'
                + 'Compte créé ! <a href="/espace-client" style="color:#38bdf8; font-weight:700; margin-left:6px;">Se connecter →</a>'
                + '</div>';
            } else {
              btn.disabled = false;
              btn.innerHTML = '<i class="fas fa-user-plus" style="margin-right:6px;"></i>Créer mon compte';
              showToast(data.error || 'Erreur. Veuillez réessayer.', 'error');
            }
          } catch(e) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus" style="margin-right:6px;"></i>Créer mon compte';
            showToast('Erreur réseau.', 'error');
          }
        }

        function skipAccountCreation() {
          document.getElementById('create-account-section').style.display = 'none';
        }

        function toggleRegisterPwd() {
          const input = document.getElementById('register-password');
          const icon = document.getElementById('reg-eye-icon');
          if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
          } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
          }
        }

        // Initialiser le badge au chargement
        updateCartBadge();

        // ─── CLIENT-SIDE INSTANT FILTERING ───
        (function() {
          const form = document.querySelector('form[action="/catalogue"]');
          if (!form) return;
          const grid = document.getElementById('products-grid');
          const countEl = document.getElementById('product-count');
          const liveCount = document.getElementById('filter-live-count');
          if (!grid) return;

          function applyFilters() {
            const brand = form.querySelector('input[name="brand"]:checked')?.value || 'all';
            const btu = form.querySelector('input[name="btu"]:checked')?.value || 'all';
            const inverter = form.querySelector('input[name="inverter"]:checked')?.value || 'all';
            const available = form.querySelector('input[name="available"]')?.checked;

            const cards = grid.querySelectorAll('.product-card');
            let visible = 0;
            cards.forEach(card => {
              let show = true;
              if (brand !== 'all' && card.dataset.brand !== brand) show = false;
              if (btu !== 'all' && card.dataset.btu !== btu) show = false;
              if (inverter === 'true' && card.dataset.inverter !== 'true') show = false;
              if (inverter === 'false' && card.dataset.inverter !== 'false') show = false;
              if (available && (card.dataset.available !== 'true' || card.dataset.stock === '0')) show = false;
              card.style.display = show ? '' : 'none';
              if (show) visible++;
            });

            if (countEl) {
              countEl.innerHTML = '<strong class="text-white">' + visible + '</strong> climatiseur' + (visible > 1 ? 's' : '') + ' trouvé' + (visible > 1 ? 's' : '');
            }
            if (liveCount) {
              liveCount.textContent = visible === cards.length ? '' : visible + ' / ' + cards.length + ' affichés';
            }

            // Update URL without reload
            const params = new URLSearchParams();
            if (brand !== 'all') params.set('brand', brand);
            if (btu !== 'all') params.set('btu', btu);
            if (inverter !== 'all') params.set('inverter', inverter);
            if (available) params.set('available', 'true');
            const qs = params.toString();
            history.replaceState(null, '', '/catalogue' + (qs ? '?' + qs : ''));
          }

          // Listen to all filter changes
          form.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
            input.addEventListener('change', function(e) {
              e.preventDefault();
              applyFilters();
            });
          });

          // Prevent form submission (use JS filtering instead)
          form.addEventListener('submit', function(e) {
            e.preventDefault();
            applyFilters();
          });

          // Apply initial filters from URL params
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has('brand') || urlParams.has('btu') || urlParams.has('inverter') || urlParams.has('available')) {
            applyFilters();
          }
        })();
      `}} />

      {/* ===== BARRE COMPARATEUR ===== */}
      <div id="compare-bar" class="hidden fixed bottom-16 md:bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl" style="background:rgba(11,17,32,0.97); border:1px solid rgba(167,139,250,0.35); min-width:280px; max-width:90vw;">
        <i class="fas fa-balance-scale flex-shrink-0" style="color:#a78bfa;"></i>
        <span id="compare-count" class="text-sm font-semibold text-white flex-1">0 sélectionné</span>
        <button onclick="openCompareModal()" id="compare-open-btn" disabled class="btn-primary text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed">
          Comparer
        </button>
        <button onclick="clearCompare()" class="text-xs px-3 py-2 rounded-xl" style="background:rgba(255,255,255,0.07); color:#8ba3c0;">
          Effacer
        </button>
      </div>

      {/* ===== MODALE COMPARATEUR ===== */}
      <div id="compare-modal" class="hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onclick="if(event.target===this)closeCompareModal()" role="dialog" aria-modal="true" aria-label="Comparaison produits">
        <div class="rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden" style="background:#141c2e; border:1px solid rgba(148,180,220,0.12); max-height:90vh;">
          <div class="flex items-center justify-between px-6 py-4" style="border-bottom:1px solid rgba(56,189,248,0.1);">
            <h3 class="font-bold text-white text-lg flex items-center space-x-2">
              <i class="fas fa-balance-scale text-purple-400"></i>
              <span>Comparaison produits</span>
            </h3>
            <button onclick="closeCompareModal()" class="hover:text-white p-1 text-2xl leading-none" style="color:#64748b;">&times;</button>
          </div>
          <div id="compare-content" class="overflow-auto p-6" style="max-height:calc(90vh - 70px);">
            {/* Filled by JS */}
          </div>
        </div>
      </div>

      {/* ===== JS COMPARATEUR ===== */}
      <script dangerouslySetInnerHTML={{ __html: `
        const compareSelected = new Set();
        const MAX_COMPARE = 3;

        function toggleCompare(id) {
          const btn = document.getElementById('compare-btn-' + id);
          if (compareSelected.has(id)) {
            compareSelected.delete(id);
            if (btn) { btn.style.background = 'rgba(167,139,250,0.07)'; btn.style.borderColor = 'rgba(167,139,250,0.18)'; btn.querySelector('span').textContent = 'Comparer'; }
          } else {
            if (compareSelected.size >= MAX_COMPARE) {
              showToast('Vous pouvez comparer au maximum 3 produits.', 'warning');
              return;
            }
            compareSelected.add(id);
            if (btn) { btn.style.background = 'rgba(167,139,250,0.25)'; btn.style.borderColor = 'rgba(167,139,250,0.5)'; btn.querySelector('span').textContent = 'Sélectionné ✓'; }
          }
          updateCompareBar();
        }

        function updateCompareBar() {
          const bar = document.getElementById('compare-bar');
          const count = compareSelected.size;
          const countEl = document.getElementById('compare-count');
          const openBtn = document.getElementById('compare-open-btn');
          if (count === 0) {
            bar.classList.add('hidden');
          } else {
            bar.classList.remove('hidden');
            countEl.textContent = count + ' produit' + (count > 1 ? 's' : '') + ' sélectionné' + (count > 1 ? 's' : '');
            openBtn.disabled = count < 2;
          }
        }

        function clearCompare() {
          compareSelected.forEach(id => {
            const btn = document.getElementById('compare-btn-' + id);
            if (btn) { btn.style.background = 'rgba(167,139,250,0.07)'; btn.style.borderColor = 'rgba(167,139,250,0.18)'; btn.querySelector('span').textContent = 'Comparer'; }
          });
          compareSelected.clear();
          updateCompareBar();
        }

        function openCompareModal() {
          const modal = document.getElementById('compare-modal');
          const content = document.getElementById('compare-content');
          const ids = [...compareSelected];
          // Gather product data from DOM
          const cards = document.querySelectorAll('.product-card');
          const products = {};
          cards.forEach(card => {
            const id = parseInt(card.dataset.id);
            if (ids.includes(id)) {
              products[id] = {
                id: id, name: card.dataset.name, brand: card.dataset.brand, btu: card.dataset.btu,
                price: card.dataset.price, model: card.dataset.model, energy: card.dataset.energy,
                inverter: card.dataset.inverter === 'true', stock: parseInt(card.dataset.stock), image: card.dataset.image
              };
            }
          });
          const cols = ids.map(id => products[id]).filter(Boolean);
          const rows = [
            { label: 'Marque', fn: p => p.brand },
            { label: 'Modèle', fn: p => p.model },
            { label: 'Puissance', fn: p => Number(p.btu).toLocaleString('fr-FR') + ' BTU' },
            { label: 'Prix', fn: p => Number(p.price).toLocaleString('fr-FR') + ' FCFA' },
            { label: 'Inverter', fn: p => p.inverter ? '<span style="color:#34d399;">✓ Oui</span>' : '<span style="color:#f87171;">✗ Non</span>' },
            { label: 'Classe énergie', fn: p => p.energy },
            { label: 'Stock', fn: p => p.stock > 0 ? '<span style="color:#34d399;">' + p.stock + ' dispo</span>' : '<span style="color:#f87171;">Rupture</span>' },
          ];

          let html = '<div style="display:grid; grid-template-columns: 140px repeat(' + cols.length + ', 1fr); gap:0;">';
          // Header
          html += '<div style="background:rgba(56,189,248,0.05); padding:12px; font-weight:700; font-size:0.75rem; color:#38bdf8; text-transform:uppercase;">Caractéristique</div>';
          cols.forEach(p => {
            html += '<div style="background:rgba(56,189,248,0.05); padding:12px; text-align:center; border-left:1px solid rgba(56,189,248,0.08);">';
            html += '<div style="font-size:1.8rem; margin-bottom:4px;">' + p.image + '</div>';
            html += '<div style="font-size:0.7rem; color:#38bdf8; font-weight:700; text-transform:uppercase;">' + p.brand + '</div>';
            html += '<div style="font-size:0.8rem; color:white; font-weight:600; line-height:1.3; margin-bottom:6px;">' + p.name + '</div>';
            html += '<a href="/rendez-vous?product=' + p.id + '" style="display:inline-block; background:linear-gradient(135deg,#0ea5e9,#3b82f6); color:white; padding:5px 10px; border-radius:8px; font-size:0.7rem; font-weight:700; text-decoration:none;">Commander</a>';
            html += '</div>';
          });
          // Rows
          rows.forEach((row, ri) => {
            const bg = ri % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
            html += '<div style="background:' + bg + '; padding:10px 12px; font-size:0.75rem; font-weight:600; color:#8ba3c0; border-top:1px solid rgba(56,189,248,0.06);">' + row.label + '</div>';
            cols.forEach(p => {
              html += '<div style="background:' + bg + '; padding:10px 12px; text-align:center; font-size:0.82rem; color:white; border-left:1px solid rgba(56,189,248,0.06); border-top:1px solid rgba(56,189,248,0.06);">' + row.fn(p) + '</div>';
            });
          });
          html += '</div>';

          content.innerHTML = html;
          modal.classList.remove('hidden');
          if (window.trapFocus) window.trapFocus(modal);
        }

        function closeCompareModal() {
          var cm = document.getElementById('compare-modal');
          cm.classList.add('hidden');
          if (window.releaseFocus) window.releaseFocus(cm);
        }
      `}} />
    </Layout>
  )
}

