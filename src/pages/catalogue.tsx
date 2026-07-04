import { Layout } from '../components/Layout'
import { products } from '../data/products'
import { quartiersByArrondissement } from '../data/quartiers'

export const CataloguePage = ({ filters, page = 1 }: { filters?: { brand?: string; btu?: string; inverter?: string; available?: string; product?: string }; page?: number }) => {
  const ITEMS_PER_PAGE = 12
  // Server-side filtering
  let filtered = [...products]
  if (filters?.brand && filters.brand !== 'all') filtered = filtered.filter(p => p.brand === filters.brand)
  if (filters?.btu && filters.btu !== 'all') filtered = filtered.filter(p => String(p.btu) === filters.btu)
  if (filters?.inverter === 'true') filtered = filtered.filter(p => p.inverter)
  if (filters?.inverter === 'false') filtered = filtered.filter(p => !p.inverter)
  if (filters?.available === 'true') filtered = filtered.filter(p => p.available && p.stock > 0)
  const totalFiltered = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedProducts = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const allProducts = [...products]

  const brands = [...new Set(products.map(p => p.brand))]
  const btuList = [...new Set(products.map(p => p.btu))].sort((a, b) => a - b)
  const selectedProduct = filters?.product ? products.find(p => p.id === parseInt(filters.product!)) : null

  return (
    <Layout title="Catalogue Climatiseurs - MAASGA Ouagadougou" activePage="catalogue" canonicalPath="/catalogue" description="Catalogue climatiseurs MAASGA — Découvrez nos modèles split, inverter et classiques à Ouagadougou. Prix compétitifs, fiches techniques, commande en ligne.">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
      `}} />

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

          {/* ===== BOUTON TOGGLE FILTRES MOBILE ===== */}
          <button type="button" id="toggle-filters-btn" class="lg:hidden w-full flex items-center justify-center space-x-2 glass-card rounded-2xl py-3 px-4 mb-2 text-white font-semibold" aria-label="Afficher/masquer les filtres" onclick="var s=document.getElementById('sidebar-filters');var b=this;if(s.classList.contains('hidden')){s.classList.remove('hidden');b.querySelector('span').textContent='Masquer les filtres';b.querySelector('i').classList.replace('fa-sliders-h','fa-times')}else{s.classList.add('hidden');b.querySelector('span').textContent='Filtres';b.querySelector('i').classList.replace('fa-times','fa-sliders-h')}">
            <i class="fas fa-sliders-h" style="color:#38bdf8;"></i>
            <span>Filtres</span>
          </button>

          {/* ===== SIDEBAR FILTRES ===== */}
          <aside id="sidebar-filters" class="hidden lg:block lg:w-64 flex-shrink-0 reveal">
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
                <strong class="text-white">{totalFiltered}</strong> climatiseur{totalFiltered > 1 ? 's' : ''} trouvé{totalFiltered > 1 ? 's' : ''}
                {totalPages > 1 && <span class="ml-2 text-xs">(page {currentPage}/{totalPages})</span>}
              </p>
              <div class="flex items-center space-x-2 text-sm" style="color:#64748b;">
                <i class="fas fa-info-circle" style="color:#38bdf8;"></i>
                <span>Prix en FCFA, installation offerte</span>
              </div>
            </div>

            {totalFiltered === 0 ? (
              <div class="text-center py-20 glass-card rounded-2xl">
                <i class="fas fa-search text-4xl mb-4" style="color:#1e2a3a;"></i>
                <p class="text-lg font-medium text-white">Aucun produit ne correspond</p>
                <a href="/catalogue" class="mt-4 inline-block" style="color:#38bdf8;">Réinitialiser les filtres</a>
              </div>
            ) : (
              <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 reveal" id="products-grid">
                {paginatedProducts.map(p => (
                  <div {...((p.available && p.stock !== 0) ? { 'data-tilt': true } : {})} data-brand={p.brand} data-btu={String(p.btu)} data-inverter={String(p.inverter)} data-stock={String(p.stock)} data-available={String(p.available)} data-id={String(p.id)} data-name={p.name} data-price={String(p.price)} data-model={p.model} data-energy={p.energy_class} data-image={p.image} class={`product-card glass-card rounded-2xl overflow-hidden transition-all duration-300 group ${!p.available || p.stock === 0 ? 'opacity-60' : 'hover-lift'}`}>
                    {/* Image */}
                    <div class="tilt-image relative p-6 text-center" style="background:linear-gradient(145deg,#e8f2ff,#f0f7ff);">
                      {(p as any).imageUrl
                        ? <img src={(p as any).imageUrl} alt={p.name} class="w-32 h-32 object-contain mx-auto mb-2" loading="lazy" />
                        : <img src="/static/ac-placeholder.svg" alt={p.name} class="w-32 h-32 object-contain mx-auto mb-2" loading="lazy" />
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
                      <div class="tilt-caption">
                        <div class="text-xs font-bold uppercase tracking-wider mb-1" style="color:#38bdf8;">{p.brand}</div>
                        <h3 class="font-bold text-white text-sm mb-1 leading-tight">{p.name}</h3>
                        <p class="text-xs mb-3" style="color:#64748b;">Réf: {p.model}</p>
                      </div>

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
                          <div id={`stock-alert-${p.id}`} class="w-full">
                            <button onclick={`document.getElementById('stock-form-${p.id}').classList.toggle('hidden')`} class="w-full flex items-center justify-center space-x-2 text-xs py-1.5 rounded-lg transition-colors" style="color:#38bdf8; background:rgba(56,189,248,0.05);">
                              <i class="fas fa-bell"></i>
                              <span>Me notifier du réapprovisionnement</span>
                            </button>
                            <div id={`stock-form-${p.id}`} class="hidden mt-2 flex gap-2">
                              <input type="tel" id={`stock-phone-${p.id}`} placeholder="Ex: 55 99 64 18" class="flex-1 text-xs px-3 py-2 rounded-lg" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.2); color:#03045e;" />
                              <button onclick={`submitStockAlert(${p.id})`} class="text-xs px-3 py-2 rounded-lg font-semibold" style="background:rgba(16,185,129,0.1); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
                                <i class="fas fa-check"></i>
                              </button>
                            </div>
                          </div>
                          <button id={`compare-btn-${p.id}`} onclick={`toggleCompare(${p.id})`} class="w-full font-semibold py-1.5 rounded-xl flex items-center justify-center space-x-2 text-xs transition-all" style="background:rgba(167,139,250,0.07); color:#a78bfa; border:1px solid rgba(167,139,250,0.18);">
                            <i class="fas fa-balance-scale text-xs"></i>
                            <span>Comparer</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <div class="tilt-shine" aria-hidden="true"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination serveur */}
            {totalPages > 1 && (
              <nav class="mt-8 flex items-center justify-center gap-2 flex-wrap" aria-label="Pagination catalogue">
                {currentPage > 1 && (
                  <a href={`/catalogue?${new URLSearchParams({...(filters?.brand && filters.brand !== 'all' ? {brand: filters.brand} : {}), ...(filters?.btu && filters.btu !== 'all' ? {btu: filters.btu} : {}), ...(filters?.inverter ? {inverter: filters.inverter} : {}), ...(filters?.available ? {available: filters.available} : {}), page: String(currentPage - 1)}).toString()}`}
                    class="px-4 py-2 rounded-xl text-sm font-medium transition-colors" style="background:rgba(56,189,248,0.08); color:#38bdf8; border:1px solid rgba(56,189,248,0.2);">
                    <i class="fas fa-chevron-left mr-1"></i> Précédent
                  </a>
                )}
                {Array.from({length: totalPages}, (_, i) => i + 1).map(p => (
                  <a href={`/catalogue?${new URLSearchParams({...(filters?.brand && filters.brand !== 'all' ? {brand: filters.brand} : {}), ...(filters?.btu && filters.btu !== 'all' ? {btu: filters.btu} : {}), ...(filters?.inverter ? {inverter: filters.inverter} : {}), ...(filters?.available ? {available: filters.available} : {}), page: String(p)}).toString()}`}
                    class={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${p === currentPage ? 'text-white' : ''}`}
                    style={p === currentPage ? 'background:linear-gradient(135deg,#0ea5e9,#3b82f6); color:white;' : 'background:rgba(56,189,248,0.05); color:#8ba3c0; border:1px solid rgba(56,189,248,0.1);'}
                    aria-current={p === currentPage ? 'page' : undefined}>
                    {p}
                  </a>
                ))}
                {currentPage < totalPages && (
                  <a href={`/catalogue?${new URLSearchParams({...(filters?.brand && filters.brand !== 'all' ? {brand: filters.brand} : {}), ...(filters?.btu && filters.btu !== 'all' ? {btu: filters.btu} : {}), ...(filters?.inverter ? {inverter: filters.inverter} : {}), ...(filters?.available ? {available: filters.available} : {}), page: String(currentPage + 1)}).toString()}`}
                    class="px-4 py-2 rounded-xl text-sm font-medium transition-colors" style="background:rgba(56,189,248,0.08); color:#38bdf8; border:1px solid rgba(56,189,248,0.2);">
                    Suivant <i class="fas fa-chevron-right ml-1"></i>
                  </a>
                )}
              </nav>
            )}

            <div id="catalogue-pagination" class="hidden"></div>

            {/* Notice bas de page */}
            <div class="mt-8 rounded-2xl p-6" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.15);">
              <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="flex items-start space-x-4">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.2);">
                    <i class="fas fa-clipboard-check text-xl" style="color:#38bdf8;"></i>
                  </div>
                  <div>
                    <h4 class="font-bold text-white mb-1">Votre achat en 5 étapes</h4>
                    <p class="text-sm" style="color:#8ba3c0;">
                      1. Choisissez votre climatiseur · 2. Passez commande en ligne · 3. Confirmez le paiement · 4. Livraison à domicile · 5. Installation professionnelle
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
            <h3 id="modal-product-name" class="font-bold text-lg leading-tight pr-4" style="color:#03045e;">—</h3>
            <button onclick="var m=document.getElementById('product-detail-modal');m.classList.add('hidden');if(window.releaseFocus)window.releaseFocus(m);" class="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors" style="color:#38bdf8;" aria-label="Fermer les détails produit">
              <i class="fas fa-times"></i>
            </button>
          </div>
          {/* Body */}
          <div class="space-y-5">
            {/* Image — grande zone centrée */}
            <div id="modal-image-wrap" class="w-full flex items-center justify-center" style="background:linear-gradient(145deg,#e8f2ff,#f0f7ff); min-height:220px; padding:24px 32px;">
              <img id="modal-image-emoji" src="/static/ac-placeholder.svg" alt="Climatiseur" style="max-height:220px; max-width:100%; width:auto; object-fit:contain;" loading="lazy" />
            </div>
            <div class="px-6 space-y-5">
            {/* Marque + ref + badges */}
            <div>
              <div id="modal-brand" class="text-xs font-bold uppercase tracking-wider mb-1" style="color:#38bdf8;">—</div>
              <div id="modal-ref" class="text-xs mb-3" style="color:#64748b;">Réf: —</div>
              <div class="flex flex-wrap gap-2" id="modal-badges"></div>
            </div>
            {/* Key specs */}
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4" id="modal-key-specs"></div>
            {/* Price */}
            <div class="rounded-2xl p-4" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.15);">
              <div class="flex items-end justify-between">
                <div>
                  <div id="modal-price" class="text-2xl font-bold" style="color:#03045e;">—</div>
                  <div class="text-xs font-semibold mt-0.5" style="color:#34d399;">Installation et livraison offerte</div>
                </div>
                <div id="modal-stock-badge" class="text-xs px-3 py-1 rounded-full font-semibold"></div>
              </div>
            </div>
            {/* Description */}
            <div id="modal-description-wrap" class="hidden">
              <h4 class="text-sm font-bold mb-2" style="color:#03045e;">Description</h4>
              <p id="modal-description" class="text-sm leading-relaxed" style="color:#334155;"></p>
            </div>
            {/* Features */}
            <div id="modal-features-wrap" class="hidden">
              <h4 class="text-sm font-bold mb-2" style="color:#03045e;">Fonctionnalités</h4>
              <div id="modal-features" class="flex flex-wrap gap-2"></div>
            </div>
            {/* Tech Specs */}
            <div id="modal-techspecs-wrap" class="hidden">
              <h4 class="text-sm font-bold mb-3" style="color:#03045e;"><i class="fas fa-microchip mr-2" style="color:#0077b6;"></i>Caractéristiques techniques</h4>
              <div id="modal-techspecs" class="grid grid-cols-1 sm:grid-cols-2 gap-2"></div>
            </div>
            {/* Galerie Média */}
            <div id="modal-media-wrap" class="hidden">
              <h4 class="text-sm font-bold mb-3" style="color:#03045e;"><i class="fas fa-image mr-2" style="color:#0077b6;"></i>Galerie</h4>
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
                <label class="text-sm font-semibold" style="color:#03045e;">Quantité</label>
                <div class="flex items-center space-x-3">
                  <button type="button" onclick="updateQty(-1)" class="w-8 h-8 rounded-lg flex items-center justify-center text-center" style="background:rgba(56,189,248,0.15); color:#38bdf8; font-weight:bold;">−</button>
                  <input type="number" id="modal-qty-input" value="1" min="1" class="w-12 text-center font-bold rounded-lg" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.2); color:#111827; padding:6px;" />
                  <button type="button" onclick="updateQty(1)" class="w-8 h-8 rounded-lg flex items-center justify-center text-center" style="background:rgba(56,189,248,0.15); color:#38bdf8; font-weight:bold;">+</button>
                </div>
              </div>
            </div>
            {/* CTA */}
            <div id="modal-cta" class="flex gap-3 pt-2"></div>
            </div>{/* /px-6 */}
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
            <button onclick="closeCartModal()" class="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors" style="color:#38bdf8;" aria-label="Fermer le panier">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <div id="cart-empty-msg" class="text-center py-12">
              <i class="fas fa-shopping-cart text-4xl mb-4" style="color:#94a3b8;"></i>
              <p class="font-medium" style="color:#111827;">Votre panier est vide</p>
              <p class="text-sm mt-1" style="color:#64748b;">Ajoutez des climatiseurs depuis le catalogue</p>
            </div>
            <div id="cart-items-list" class="hidden space-y-3"></div>
          </div>
          <div id="cart-footer" class="hidden px-6 py-4 flex-shrink-0" style="border-top:1px solid rgba(56,189,248,0.12);">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-semibold" style="color:#475569;">Total estimé</span>
              <span id="cart-total" class="text-xl font-bold" style="color:#111827;">0 FCFA</span>
            </div>
            <div class="text-xs mb-4 px-3 py-2 rounded-xl" style="background:rgba(52,211,153,0.08); color:#34d399; border:1px solid rgba(52,211,153,0.2);">
              <i class="fas fa-shield-alt mr-1"></i> Livraison et installation comprises. Paiement sécurisé.
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
      <div id="order-modal" class="hidden fixed inset-0 z-50 flex items-end sm:items-start justify-center sm:pt-6 p-0 sm:p-4" style="background:rgba(0,0,0,0.6); backdrop-filter:blur(4px);" role="dialog" aria-modal="true" aria-label="Passer commande">
        <div class="w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden" style="background:#ffffff; max-height:95vh; display:flex; flex-direction:column;">
          {/* Header blanc */}
          <div class="flex items-center justify-between px-6 py-4 flex-shrink-0" style="background:#f8fafc; border-bottom:2px solid #e2e8f0;">
            <h3 class="font-extrabold text-lg flex items-center space-x-2" style="color:#03045e;">
              <i class="fas fa-shopping-bag" style="color:#0077b6;"></i>
              <span>Passer commande</span>
            </h3>
            <button onclick="closeOrderModal()" class="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors" style="color:#64748b;" aria-label="Fermer la commande">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5" style="background:#ffffff;">
            {/* Statut connexion — masqué/visible dynamiquement via JS */}
            <div id="order-login-banner" class="rounded-xl px-4 py-3 text-sm flex items-center justify-between" style="background:#eff6ff; border:1px solid #bfdbfe;">
              <span style="color:#1e40af; font-weight:500;">Déjà client MAASGA ?</span>
              <a href="/espace-client?redirect=catalogue" style="color:#0077b6; font-weight:700;">Se connecter →</a>
            </div>
            <div id="order-logged-banner" class="rounded-xl px-4 py-3 text-sm flex items-center justify-between" style="display:none; background:#f0fdf4; border:1px solid #bbf7d0;">
              <span style="color:#166534; font-weight:500;"><i class="fas fa-check-circle mr-1"></i>Connecté en tant que <strong id="order-logged-name"></strong></span>
              <a href="/espace-client" style="color:#166534; font-weight:600; font-size:0.75rem;">Mon espace →</a>
            </div>

            {/* Récapitulatif */}
            <div id="order-summary-box" style="display:none; background:#f0f9ff; border:2px solid #bae6fd; border-radius:14px; padding:14px;">
              <div style="font-size:0.75rem; font-weight:700; color:#0077b6; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;">Récapitulatif</div>
              <div id="order-summary-content" style="font-size:0.875rem; color:#111827; font-weight:500;"></div>
            </div>

            {/* Champs formulaire */}
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-bold mb-1.5" style="color:#111827;">Nom complet <span style="color:#ef4444;">*</span></label>
                <input id="order-name" type="text" placeholder="Ex: Amadou Traoré" class="w-full px-4 py-3 rounded-xl text-sm" style="background:#f8fafc; border:1.5px solid #cbd5e1; color:#111827; outline:none;" />
              </div>
              <div>
                <label class="block text-sm font-bold mb-1.5" style="color:#111827;">Téléphone (Whatsapp) <span style="color:#ef4444;">*</span></label>
                <input id="order-phone" type="tel" placeholder="Ex: 07 07 07 07 07" class="w-full px-4 py-3 rounded-xl text-sm" style="background:#f8fafc; border:1.5px solid #cbd5e1; color:#111827; outline:none;" />
              </div>
              <div>
                <label class="block text-sm font-bold mb-1.5" style="color:#111827;">Quartier / Secteur <span style="color:#ef4444;">*</span></label>
                <select id="order-quartier" class="w-full px-4 py-3 rounded-xl text-sm" style="background:#f8fafc; border:1.5px solid #cbd5e1; color:#111827; outline:none;">
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
                <label class="block text-sm font-bold mb-1.5" style="color:#111827;">Position GPS <span style="color:#64748b; font-weight:400;">(optionnel)</span></label>
                <button type="button" id="order-gps-btn" onclick="requestOrderLocation()" style="width:100%; padding:11px 16px; border-radius:12px; background:#f0f9ff; border:1.5px solid #bae6fd; color:#0077b6; font-weight:700; font-size:0.875rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                  <i class="fas fa-crosshairs"></i>
                  <span id="order-gps-label">Partager ma position</span>
                </button>
                <div id="order-gps-status" style="display:none; margin-top:8px; font-size:0.75rem; padding:8px 12px; border-radius:8px;"></div>
              </div>
              <div>
                <label class="block text-sm font-bold mb-1.5" style="color:#111827;">Email <span style="color:#64748b; font-weight:400;">(optionnel)</span></label>
                <input id="order-email" type="email" placeholder="Ex: amadou@gmail.com" class="w-full px-4 py-3 rounded-xl text-sm" style="background:#f8fafc; border:1.5px solid #cbd5e1; color:#111827; outline:none;" />
              </div>
              <div>
                <label class="block text-sm font-bold mb-1.5" style="color:#111827;">Notes / Instructions</label>
                <textarea id="order-notes" rows={2} placeholder="Ex: Appartement au 3ème étage, installer dans le salon" class="w-full px-4 py-3 rounded-xl text-sm resize-none" style="background:#f8fafc; border:1.5px solid #cbd5e1; color:#111827; outline:none;"></textarea>
              </div>
            </div>

            {/* Méthodes de paiement */}
            <div>
              <label class="block text-sm font-semibold mb-3" style="color:#03045e;">
                <i class="fas fa-wallet mr-1" style="color:#0077b6;"></i>Mode de paiement
              </label>

              {/* Payment method grid — same layout as maintenance */}
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {/* Confirmer par telephone */}
                <label class="cursor-pointer">
                  <input type="radio" name="order-payment" value="a_confirmer" class="hidden peer" checked />
                  <div class="peer-checked:border-blue-500 peer-checked:bg-blue-50 border-2 rounded-xl p-3 text-center transition-all hover:border-blue-300" style="border-color:#e2e8f0;">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style="background:rgba(0,119,182,0.08);">
                      <i class="fas fa-phone-alt" style="color:#0077b6;"></i>
                    </div>
                    <div class="text-xs font-bold" style="color:#03045e;">Téléphone</div>
                    <div class="text-[10px] mt-0.5" style="color:#94a3b8;">Un conseiller appelle</div>
                  </div>
                </label>
                {/* LigdiCash */}
                <label class="cursor-pointer">
                  <input type="radio" name="order-payment" value="ligdicash" class="hidden peer" />
                  <div class="peer-checked:border-green-500 peer-checked:bg-green-50 border-2 rounded-xl p-3 text-center transition-all hover:border-green-400" style="border-color:#e2e8f0;">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style="background:linear-gradient(135deg,#00b4d8,#0077b6);">
                      <i class="fas fa-lock" style="color:#fff;"></i>
                    </div>
                    <div class="text-xs font-bold" style="color:#03045e;">LigdiCash</div>
                    <div class="text-[10px] mt-0.5" style="color:#94a3b8;">Paiement sécurisé</div>
                  </div>
                </label>
                {/* Wave */}
                <label class="cursor-pointer">
                  <input type="radio" name="order-payment" value="wave" class="hidden peer" />
                  <div class="peer-checked:border-blue-500 peer-checked:bg-blue-50 border-2 rounded-xl p-3 text-center transition-all hover:border-blue-300" style="border-color:#e2e8f0;">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style="background:#1a6ef5;">
                      <i class="fas fa-bolt" style="color:#fff;"></i>
                    </div>
                    <div class="text-xs font-bold" style="color:#03045e;">Wave</div>
                    <div class="text-[10px] mt-0.5" style="color:#94a3b8;">Paiement instantané</div>
                  </div>
                </label>
                {/* Carte bancaire */}
                <label class="cursor-pointer">
                  <input type="radio" name="order-payment" value="carte_bancaire" class="hidden peer" />
                  <div class="peer-checked:border-slate-700 peer-checked:bg-slate-50 border-2 rounded-xl p-3 text-center transition-all hover:border-slate-400" style="border-color:#e2e8f0;">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style="background:#1e293b;">
                      <i class="fas fa-credit-card" style="color:#fff;"></i>
                    </div>
                    <div class="text-xs font-bold" style="color:#03045e;">Carte bancaire</div>
                    <div class="text-[10px] mt-0.5" style="color:#94a3b8;">Visa / Mastercard</div>
                  </div>
                </label>
              </div>

              {/* ══════ Dynamic payment detail panels ══════ */}

              {/* Confirmer par telephone — detail */}
              <div id="order-pay-detail-a_confirmer" class="order-pay-detail rounded-xl p-4 mt-2" style="background:rgba(0,119,182,0.03); border:1px solid rgba(0,119,182,0.1);">
                <div class="flex items-center gap-2 mb-2">
                  <i class="fas fa-info-circle text-sm" style="color:#0077b6;"></i>
                  <span class="text-sm font-bold" style="color:#03045e;">Confirmation téléphonique</span>
                </div>
                <p class="text-xs leading-relaxed" style="color:#64748b;">
                  Un conseiller MAASGA vous contactera sous 2h pour confirmer votre commande et convenir du mode de paiement.
                </p>
              </div>

              {/* LigdiCash — detail */}
              <div id="order-pay-detail-ligdicash" class="order-pay-detail rounded-xl p-4 mt-2" style="display:none; background:rgba(0,180,216,0.03); border:1px solid rgba(0,119,182,0.2);">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-6 h-6 rounded-md flex items-center justify-center" style="background:linear-gradient(135deg,#00b4d8,#0077b6);">
                    <i class="fas fa-lock" style="color:#fff; font-size:0.65rem;"></i>
                  </div>
                  <span class="text-sm font-bold" style="color:#03045e;">LigdiCash — Paiement sécurisé</span>
                </div>
                <div class="flex items-start gap-3 p-3 rounded-lg mb-2" style="background:rgba(0,119,182,0.06);">
                  <div class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5" style="background:linear-gradient(135deg,#00b4d8,#0077b6);">
                    <i class="fas fa-external-link-alt" style="color:#fff;"></i>
                  </div>
                  <div>
                    <div class="text-xs font-bold mb-1" style="color:#0077b6;">Vous serez redirigé vers LigdiCash</div>
                    <div class="text-[10px] leading-relaxed" style="color:#64748b;">
                      LigdiCash est une plateforme de paiement sécurisée. Vous pourrez payer via <strong>Orange Money</strong>, <strong>Moov Money</strong> ou tout autre moyen accepté sur la plateforme.
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 text-[10px]" style="color:#64748b;">
                  <i class="fas fa-shield-alt" style="color:#22c55e;"></i>
                  <span>Transaction chiffrée — Données sécurisées</span>
                </div>
              </div>

              {/* Wave — detail */}
              <div id="order-pay-detail-wave" class="order-pay-detail rounded-xl p-4 mt-2" style="display:none; background:rgba(26,110,245,0.03); border:1px solid rgba(26,110,245,0.15);">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-6 h-6 rounded-md flex items-center justify-center" style="background:#1a6ef5;">
                    <i class="fas fa-bolt" style="color:#fff; font-size:0.65rem;"></i>
                  </div>
                  <span class="text-sm font-bold" style="color:#03045e;">Wave</span>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs font-semibold mb-1" style="color:#334155;">Numéro Wave</label>
                    <div class="flex rounded-xl overflow-hidden" style="border:1.5px solid rgba(26,110,245,0.25);">
                      <div class="flex items-center px-3 text-xs font-bold" style="background:rgba(26,110,245,0.06); color:#1a6ef5; border-right:1px solid rgba(26,110,245,0.15);">+226</div>
                      <input type="tel" id="order-wave-phone" placeholder="XX XX XX XX" class="flex-1 px-3 py-2.5 text-sm outline-none" style="background:#f5f8ff; color:#03045e;" />
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="p-3 rounded-lg text-center" style="background:rgba(26,110,245,0.06);">
                      <div class="w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-2" style="background:#1a6ef5;">
                        <i class="fas fa-qrcode text-2xl" style="color:#fff;"></i>
                      </div>
                      <div class="text-[10px] font-bold" style="color:#1a6ef5;">QR Code</div>
                      <div class="text-[10px]" style="color:#64748b;">Scanner pour payer</div>
                    </div>
                    <div class="p-3 rounded-lg text-center" style="background:rgba(26,110,245,0.06);">
                      <div class="w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-2" style="background:rgba(26,110,245,0.1);">
                        <i class="fas fa-mobile-alt text-2xl" style="color:#1a6ef5;"></i>
                      </div>
                      <div class="text-[10px] font-bold" style="color:#1a6ef5;">Notification</div>
                      <div class="text-[10px]" style="color:#64748b;">Valider sur l'app</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carte bancaire — detail */}
              <div id="order-pay-detail-carte_bancaire" class="order-pay-detail rounded-xl p-4 mt-2" style="display:none; background:rgba(30,41,59,0.02); border:1px solid rgba(30,41,59,0.12);">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-6 h-6 rounded-md flex items-center justify-center" style="background:#1e293b;">
                    <i class="fas fa-credit-card" style="color:#fff; font-size:0.65rem;"></i>
                  </div>
                  <span class="text-sm font-bold" style="color:#03045e;">Carte bancaire</span>
                  <div class="flex items-center gap-1 ml-auto">
                    <i class="fab fa-cc-visa text-lg" style="color:#1a1f71;"></i>
                    <i class="fab fa-cc-mastercard text-lg" style="color:#eb001b;"></i>
                  </div>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs font-semibold mb-1" style="color:#334155;">Numéro de carte</label>
                    <div class="relative">
                      <input type="text" id="order-card-number" placeholder="0000 0000 0000 0000" maxlength={19} inputmode="numeric" autocomplete="cc-number"
                        class="w-full rounded-xl px-4 py-2.5 text-sm outline-none pr-12" style="border:1.5px solid rgba(30,41,59,0.2); background:#f8fafc; color:#03045e; letter-spacing:0.1em;" />
                      <i class="fas fa-lock absolute right-4 top-1/2 -translate-y-1/2 text-xs" style="color:#94a3b8;"></i>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-semibold mb-1" style="color:#334155;">Expiration</label>
                      <input type="text" id="order-card-expiry" placeholder="MM / AA" maxlength={7} inputmode="numeric" autocomplete="cc-exp"
                        class="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style="border:1.5px solid rgba(30,41,59,0.2); background:#f8fafc; color:#03045e;" />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold mb-1" style="color:#334155;">CVV</label>
                      <div class="relative">
                        <input type="text" id="order-card-cvv" placeholder="123" maxlength={4} inputmode="numeric" autocomplete="cc-csc"
                          class="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style="border:1.5px solid rgba(30,41,59,0.2); background:#f8fafc; color:#03045e;" />
                        <i class="fas fa-question-circle absolute right-3 top-1/2 -translate-y-1/2 text-xs" style="color:#94a3b8;" title="Code à 3 chiffres au dos de la carte"></i>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold mb-1" style="color:#334155;">Titulaire de la carte</label>
                    <input type="text" id="order-card-holder" placeholder="NOM COMPLET" autocomplete="cc-name"
                      class="w-full rounded-xl px-4 py-2.5 text-sm outline-none uppercase" style="border:1.5px solid rgba(30,41,59,0.2); background:#f8fafc; color:#03045e;" />
                  </div>
                  <div class="flex items-center gap-2 p-2.5 rounded-lg" style="background:rgba(22,163,74,0.06);">
                    <i class="fas fa-shield-alt text-xs" style="color:#16a34a;"></i>
                    <span class="text-[10px]" style="color:#16a34a;">Paiement sécurisé — chiffrement SSL 256 bits</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="order-form-footer" class="px-6 py-4 flex-shrink-0" style="background:#f8fafc; border-top:2px solid #e2e8f0;">
            <button id="order-submit-btn" onclick="submitOrder()" class="w-full py-4 rounded-2xl text-white font-bold text-sm" style="background:linear-gradient(135deg,#0077b6,#0ea5e9); box-shadow:0 4px 16px rgba(0,119,182,0.3);">
              <i class="fas fa-check mr-2"></i>Confirmer la commande
            </button>
            <p class="text-xs text-center mt-2" style="color:#64748b;"><i class="fas fa-lock mr-1"></i>Paiement sécurisé · Livraison & installation incluses</p>
          </div>

          <div id="order-success-msg" class="hidden px-6 py-8 text-center">
            <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style="background:rgba(52,211,153,0.15); border:2px solid rgba(52,211,153,0.3);">
              <i class="fas fa-check text-2xl" style="color:#34d399;"></i>
            </div>
            <h4 class="font-bold text-lg mb-2" style="color:#03045e;">Commande confirmée !</h4>
            <p class="text-sm mb-1" style="color:#8ba3c0;">Merci pour votre achat.</p>
            <p class="text-sm" style="color:#8ba3c0;">Votre commande est en cours de traitement. Vous recevrez un appel sous <strong style="color:#38bdf8;">2h</strong> pour planifier la livraison et l'installation.</p>

            <div id="create-account-section" style="margin-top:20px; text-align:left;">
              <div style="background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.15); border-radius:14px; padding:16px;">
                <div style="font-size:0.82rem; font-weight:700; color:#111827; margin-bottom:8px;">
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
        (function() {
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

        // Restaurer commande en attente après connexion
        (function restorePendingOrder() {
          try {
            var raw = localStorage.getItem('maasga_pending_order');
            if (!raw) return;
            var pending = JSON.parse(raw);
            // Vérifier que le contexte n'est pas trop ancien (max 30 min)
            if (Date.now() - pending.timestamp > 30 * 60 * 1000) {
              localStorage.removeItem('maasga_pending_order');
              return;
            }
            // Vérifier qu'on est bien connecté maintenant
            fetch('/api/session-check', { credentials: 'same-origin' }).then(function(r) { return r.json(); }).then(function(data) {
              if (!data.loggedIn) return;
              // Supprimer immédiatement pour ne pas re-déclencher
              localStorage.removeItem('maasga_pending_order');
              // Restaurer le contexte et ouvrir le modal
              if (pending.context && pending.context.type === 'single' && pending.context.productId) {
                setTimeout(function() {
                  if (typeof openOrderModal === 'function') {
                    openOrderModal(pending.context.productId);
                    // Pré-remplir les champs
                    setTimeout(function() {
                      if (pending.name) { var el = document.getElementById('order-name'); if(el) el.value = pending.name; }
                      if (pending.phone) { var el = document.getElementById('order-phone'); if(el) el.value = pending.phone; }
                      if (pending.quartier) { var el = document.getElementById('order-quartier'); if(el) el.value = pending.quartier; }
                      if (pending.email) { var el = document.getElementById('order-email'); if(el) el.value = pending.email; }
                      if (pending.notes) { var el = document.getElementById('order-notes'); if(el) el.value = pending.notes; }
                      if (pending.paymentMethod) {
                        var radio = document.querySelector('input[name="order-payment"][value="' + pending.paymentMethod + '"]');
                        if (radio) radio.checked = true;
                      }
                      showToast('Votre commande précédente a été restaurée. Vous pouvez la finaliser.', 'success');
                    }, 300);
                  }
                }, 500);
              } else if (pending.context && pending.context.type === 'cart') {
                setTimeout(function() {
                  if (typeof openCartOrderModal === 'function') {
                    openCartOrderModal();
                    setTimeout(function() {
                      if (pending.name) { var el = document.getElementById('order-name'); if(el) el.value = pending.name; }
                      if (pending.phone) { var el = document.getElementById('order-phone'); if(el) el.value = pending.phone; }
                      if (pending.quartier) { var el = document.getElementById('order-quartier'); if(el) el.value = pending.quartier; }
                      if (pending.email) { var el = document.getElementById('order-email'); if(el) el.value = pending.email; }
                      if (pending.notes) { var el = document.getElementById('order-notes'); if(el) el.value = pending.notes; }
                      if (pending.paymentMethod) {
                        var radio = document.querySelector('input[name="order-payment"][value="' + pending.paymentMethod + '"]');
                        if (radio) radio.checked = true;
                      }
                      showToast('Votre commande précédente a été restaurée. Vous pouvez la finaliser.', 'success');
                    }, 300);
                  }
                }, 500);
              }
            });
          } catch(e) { localStorage.removeItem('maasga_pending_order'); }
        })();

        // Stock alert notification
        function submitStockAlert(productId) {
          // Try card-level phone input first, then modal-level
          var phoneEl = document.getElementById('stock-phone-' + productId) || document.getElementById('modal-stock-phone');
          var phone = phoneEl ? phoneEl.value.trim() : '';
          if (!phone || phone.length < 8) {
            alert('Veuillez saisir un numéro de téléphone valide.');
            return;
          }
          var fd = new FormData();
          fd.append('product_id', String(productId));
          fd.append('phone', phone);
          fetch('/api/stock-alert', { method: 'POST', body: fd })
            .then(function(r) { return r.json(); })
            .then(function(data) {
              if (data.ok) {
                var safeMsg = (data.message || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
                var container = document.getElementById('stock-alert-' + productId);
                if (container) {
                  container.innerHTML = '<div class="text-xs text-center py-2 rounded-lg" style="background:rgba(16,185,129,0.1); color:#34d399; border:1px solid rgba(16,185,129,0.2);"><i class="fas fa-check-circle mr-1"></i>' + safeMsg + '</div>';
                }
                // Also update modal if open
                var modalForm = document.getElementById('modal-stock-form');
                if (modalForm) {
                  modalForm.parentElement.innerHTML = '<div style="text-align:center;padding:12px;border-radius:12px;background:rgba(16,185,129,0.1);color:#34d399;border:1px solid rgba(16,185,129,0.2);font-size:0.85rem;"><i class="fas fa-check-circle" style="margin-right:6px;"></i>' + safeMsg + '</div>';
                }
              } else {
                alert(data.error || 'Erreur, réessayez.');
              }
            })
            .catch(function() { alert('Erreur réseau.'); });
        }

        function openProductDetail(id) {
          const p = window.__CAT_PRODUCTS__.find(x => x.id === id);
          if (!p) return;

          // HTML escape helper to prevent XSS from product data
          function esc(s) {
            var d = document.createElement('div');
            d.appendChild(document.createTextNode(s || ''));
            return d.innerHTML;
          }

          document.getElementById('modal-product-name').textContent = p.name;
          document.getElementById('modal-brand').textContent = p.brand;
          document.getElementById('modal-ref').textContent = 'Réf: ' + (p.model || '—');

          // Image
          const imgWrap = document.getElementById('modal-image-wrap');
          if (p.imageUrl) {
            imgWrap.innerHTML = '<img src="' + esc(p.imageUrl) + '" alt="' + esc(p.name) + '" style="max-height:220px; max-width:100%; width:auto; object-fit:contain;" loading="lazy" />';
          } else {
            imgWrap.innerHTML = '<img src="/static/ac-placeholder.svg" alt="' + esc(p.name) + '" style="max-height:220px; max-width:100%; width:auto; object-fit:contain;" loading="lazy" />';
          }

          // Badges
          const badges = document.getElementById('modal-badges');
          let badgeHtml = '';
          if (p.inverter) badgeHtml += '<span style="background:linear-gradient(135deg,#0ea5e9,#3b82f6);color:white;font-size:0.7rem;padding:2px 8px;border-radius:6px;font-weight:700;">INVERTER</span>';
          badgeHtml += '<span style="background:rgba(56,189,248,0.1);color:#38bdf8;font-size:0.7rem;padding:2px 8px;border-radius:6px;font-weight:600;">' + esc(p.energy_class) + '</span>';
          if (p.warranty) badgeHtml += '<span style="background:rgba(52,211,153,0.1);color:#34d399;font-size:0.7rem;padding:2px 8px;border-radius:6px;font-weight:600;">' + esc(p.warranty) + '</span>';
          badges.innerHTML = badgeHtml;

          // Key specs
          const cvMap = {9000:1,12000:1.5,18000:2,24000:3,36000:5};
          const keySpecs = document.getElementById('modal-key-specs');
          keySpecs.innerHTML = [
            {label:'Puissance', val: (p.btu||0).toLocaleString() + ' BTU<br><span style="font-size:0.75rem;color:#38bdf8;">' + (cvMap[p.btu]||1) + ' CV</span>', color:'rgba(56,189,248,0.07)', border:'rgba(56,189,248,0.15)', lcolor:'#38bdf8'},
            {label:'Surface', val: p.surface_min + '–' + p.surface_max + ' m²', color:'rgba(52,211,153,0.07)', border:'rgba(52,211,153,0.15)', lcolor:'#34d399'},
            {label:'Énergie', val: p.energy_class, color:'rgba(139,92,246,0.07)', border:'rgba(139,92,246,0.15)', lcolor:'#a78bfa'},
            {label:'Stock', val: p.stock > 3 ? 'Disponible' : p.stock > 0 ? 'Limité' : 'Rupture', color:p.stock>3?'rgba(52,211,153,0.07)':p.stock>0?'rgba(245,158,11,0.07)':'rgba(239,68,68,0.07)', border:p.stock>3?'rgba(52,211,153,0.15)':p.stock>0?'rgba(245,158,11,0.15)':'rgba(239,68,68,0.15)', lcolor:p.stock>3?'#34d399':p.stock>0?'#fbbf24':'#f87171'}
          ].map(s => '<div style="border-radius:10px;padding:8px;text-align:center;background:'+s.color+';border:1px solid '+s.border+';"><div style="font-size:0.65rem;font-weight:600;color:'+s.lcolor+';">'+s.label+'</div><div style="font-size:0.85rem;font-weight:700;color:#111827;margin-top:2px;">'+s.val+'</div></div>').join('');

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
            document.getElementById('modal-features').innerHTML = feats.map(f => '<span style="background:rgba(56,189,248,0.08);color:#38bdf8;border:1px solid rgba(56,189,248,0.15);font-size:0.75rem;padding:3px 10px;border-radius:20px;">'+esc(f)+'</span>').join('');
            featWrap.classList.remove('hidden');
          } else featWrap.classList.add('hidden');

          // Tech Specs
          const tsWrap = document.getElementById('modal-techspecs-wrap');
          const ts = p.techSpecs;
          if (ts && Object.keys(ts).length > 0) {
            document.getElementById('modal-techspecs').innerHTML = Object.entries(ts).map(([k,v]) =>
              '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;border-radius:8px;background:rgba(56,189,248,0.04);border:1px solid rgba(56,189,248,0.1);">' +
                '<span style="font-size:0.7rem;color:#475569;">' + esc(TECH_LABELS[k]||k) + '</span>' +
                '<span style="font-size:0.75rem;font-weight:600;color:#111827;">' + esc(v) + '</span>' +
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
              mainDisplay.innerHTML = '<img src="' + esc(first.url) + '" alt="' + esc(first.caption||'') + '" style="width:100%;height:100%;object-fit:contain;" loading="lazy" />';
            } else {
              mainDisplay.innerHTML = '<video src="' + first.url + '" style="width:100%;height:100%;object-fit:contain;" controls></video>';
            }
            
            // Render thumbnails
            media.forEach((item, idx) => {
              const thumb = document.createElement('div');
              thumb.style.cssText = 'flex-shrink:0;width:80px;height:60px;border-radius:8px;overflow:hidden;cursor:pointer;border:2px solid rgba(56,189,248,0.2);background:rgba(0,0,0,0.5);' + (idx===0?'border-color:rgba(56,189,248,0.6);':'');
              if (item.type === 'image') {
                thumb.innerHTML = '<img src="' + esc(item.url) + '" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />';
              } else {
                thumb.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#000;color:#38bdf8;"><i class="fas fa-play" style="font-size:1.5rem;"></i></div>';
                const video = document.createElement('video');
                video.src = item.url;
                video.style.display = 'none';
              }
              thumb.onclick = () => {
                // Update main display
                if (item.type === 'image') {
                  mainDisplay.innerHTML = '<img src="' + esc(item.url) + '" alt="' + esc(item.caption||'') + '" style="width:100%;height:100%;object-fit:contain;" loading="lazy" />';
                } else {
                  mainDisplay.innerHTML = '<video src="' + esc(item.url) + '" style="width:100%;height:100%;object-fit:contain;" controls></video>';
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
            document.getElementById('modal-cta').innerHTML = '<div style="flex:1;text-align:center;"><button type="button" onclick="this.nextElementSibling.classList.toggle(\\\'hidden\\\')" style="width:100%;background:rgba(56,189,248,0.1);color:#38bdf8;font-weight:600;padding:12px;border-radius:12px;font-size:0.85rem;border:1px solid rgba(56,189,248,0.25);cursor:pointer;"><i class="fas fa-bell" style="margin-right:6px;"></i>Me notifier</button><div class="hidden" style="margin-top:8px;display:flex;gap:8px;" id="modal-stock-form"><input type="tel" id="modal-stock-phone" placeholder="Ex: 55 99 64 18" style="flex:1;padding:10px;border-radius:10px;font-size:0.85rem;background:rgba(56,189,248,0.05);border:1px solid rgba(56,189,248,0.2);color:#03045e;" /><button type="button" onclick="submitStockAlert('+p.id+')" style="padding:10px 16px;border-radius:10px;background:rgba(16,185,129,0.1);color:#34d399;border:1px solid rgba(16,185,129,0.2);font-weight:700;cursor:pointer;"><i class="fas fa-check"></i></button></div></div>';
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

        // ===== PANNEAUX DYNAMIQUES PAIEMENT (modal commande) =====
        function showOrderPayDetail(method) {
          document.querySelectorAll('.order-pay-detail').forEach(function(el) { el.style.display = 'none'; });
          var panel = document.getElementById('order-pay-detail-' + method);
          if (panel) {
            panel.style.display = 'block';
            panel.style.animation = 'fadeSlideIn 0.25s ease forwards';
          }
        }
        // Initial state
        showOrderPayDetail('a_confirmer');
        // Listen to payment method changes
        document.querySelectorAll('input[name="order-payment"]').forEach(function(r) {
          r.addEventListener('change', function() { showOrderPayDetail(this.value); });
        });
        // Card number formatting: auto-space every 4 digits
        var _ocn = document.getElementById('order-card-number');
        if (_ocn) _ocn.addEventListener('input', function() { var v=this.value.replace(/\\D/g,'').substring(0,16); this.value=v.replace(/(\\d{4})(?=\\d)/g,'$1 '); });
        // Card expiry formatting: MM / YY
        var _oce = document.getElementById('order-card-expiry');
        if (_oce) _oce.addEventListener('input', function() { var v=this.value.replace(/\\D/g,'').substring(0,4); if(v.length>=3) v=v.substring(0,2)+' / '+v.substring(2); this.value=v; });
        // CVV: digits only
        var _ocv = document.getElementById('order-card-cvv');
        if (_ocv) _ocv.addEventListener('input', function() { this.value=this.value.replace(/\\D/g,'').substring(0,4); });

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
                + '<div style="font-weight:600;color:#111827;font-size:0.85rem;">' + item.name + '</div>'
                + '<div style="font-size:0.7rem;color:#38bdf8;margin-top:2px;">' + item.brand + '</div>'
                + '<div style="font-size:0.7rem;color:#8ba3c0;margin-top:2px;">' + item.price.toLocaleString() + ' FCFA / unité</div>'
              + '</div>'
              + '<div style="display:flex;align-items:center;gap:6px;">'
                + '<button onclick="cartQty(' + item.id + ',-1)" style="width:28px;height:28px;border-radius:8px;background:rgba(56,189,248,0.1);color:#38bdf8;font-weight:bold;border:none;cursor:pointer;">−</button>'
                + '<span style="font-weight:bold;color:#111827;width:24px;text-align:center;">' + item.quantity + '</span>'
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
              + '<span style="color:#111827;font-weight:700;">' + prod.price.toLocaleString() + ' FCFA</span>'
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
                + '<span style="color:#111827;font-weight:600;">' + (item.price * item.quantity).toLocaleString() + ' FCFA</span>'
                + '</div>';
            }).join('') + '<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(56,189,248,0.15);display:flex;justify-content:space-between;">'
              + '<span style="font-weight:700;color:#111827;">Total</span>'
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

        // Cache session state to avoid repeated fetches
        var __SESSION_DATA__ = null;
        var __SESSION_CHECKED__ = false;

        async function checkSessionAndUpdateUI() {
          if (__SESSION_CHECKED__) return __SESSION_DATA__;
          try {
            const r = await fetch('/api/session-check', { credentials: 'same-origin' });
            __SESSION_DATA__ = await r.json();
            __SESSION_CHECKED__ = true;
          } catch(e) {
            __SESSION_DATA__ = { loggedIn: false };
            __SESSION_CHECKED__ = true;
          }
          // Update banners
          var loginBanner = document.getElementById('order-login-banner');
          var loggedBanner = document.getElementById('order-logged-banner');
          var loggedName = document.getElementById('order-logged-name');
          var caSection = document.getElementById('create-account-section');
          if (__SESSION_DATA__ && __SESSION_DATA__.loggedIn) {
            if (loginBanner) loginBanner.style.display = 'none';
            if (loggedBanner) { loggedBanner.style.display = 'flex'; }
            if (loggedName) loggedName.textContent = __SESSION_DATA__.name || 'Client';
            if (caSection) caSection.style.display = 'none';
            // Pre-fill form from server data
            if (__SESSION_DATA__.name) {
              var el = document.getElementById('order-name');
              if (el && !el.value) el.value = __SESSION_DATA__.name;
            }
            if (__SESSION_DATA__.phone) {
              var el = document.getElementById('order-phone');
              if (el && !el.value) el.value = __SESSION_DATA__.phone;
            }
            if (__SESSION_DATA__.email) {
              var el = document.getElementById('order-email');
              if (el && !el.value) el.value = __SESSION_DATA__.email;
            }
            if (__SESSION_DATA__.quartier) {
              var el = document.getElementById('order-quartier');
              if (el && !el.value) el.value = __SESSION_DATA__.quartier;
            }
          } else {
            if (loginBanner) loginBanner.style.display = 'flex';
            if (loggedBanner) loggedBanner.style.display = 'none';
          }
          return __SESSION_DATA__;
        }

        function prefillOrderForm() {
          // First try localStorage (fast, synchronous)
          try {
            const saved = JSON.parse(localStorage.getItem('maasga_client_info') || '{}');
            if (saved.name) document.getElementById('order-name').value = saved.name;
            if (saved.phone) document.getElementById('order-phone').value = saved.phone;
            if (saved.quartier) document.getElementById('order-quartier').value = saved.quartier;
            if (saved.email) document.getElementById('order-email').value = saved.email;
          } catch(e) {}
          // Then check session (async, may override with server data)
          checkSessionAndUpdateUI();
        }

        async function submitOrder() {
          const name = document.getElementById('order-name').value.trim();
          const phone = document.getElementById('order-phone').value.trim();
          const quartier = document.getElementById('order-quartier').value.trim();
          const email = document.getElementById('order-email').value.trim();
          const notes = document.getElementById('order-notes').value.trim();
          const paymentRadio = document.querySelector('input[name="order-payment"]:checked');
          const paymentMethod = paymentRadio ? paymentRadio.value : null;

          if (!name || !phone) {
            showToast('Merci de renseigner votre nom et votre téléphone.', 'warning');
            return;
          }

          // Si un mode de paiement en ligne est sélectionné, vérifier la connexion
          if (paymentMethod && paymentMethod !== 'a_confirmer') {
            try {
              // Use cached session if available, otherwise re-check
              const sessionData = __SESSION_CHECKED__ && __SESSION_DATA__ ? __SESSION_DATA__ : await checkSessionAndUpdateUI();
              if (!sessionData || !sessionData.loggedIn) {
                // Sauvegarder le contexte de commande avant de rediriger vers la connexion
                try {
                  const pendingOrder = {
                    name, phone, quartier, email, notes, paymentMethod,
                    context: window.__ORDER_CONTEXT__ || {},
                    timestamp: Date.now()
                  };
                  localStorage.setItem('maasga_pending_order', JSON.stringify(pendingOrder));
                } catch(e) {}
                showToast('Veuillez vous connecter avant de procéder au paiement.', 'warning');
                setTimeout(() => { window.location.href = '/espace-client?redirect=catalogue'; }, 1500);
                return;
              }
            } catch(e) {
              // Si la vérification échoue, continuer quand même
            }
          }

          const btn = document.getElementById('order-submit-btn');
          btn.disabled = true;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Envoi en cours…';
          const ctx = window.__ORDER_CONTEXT__ || {};
          let orderNotes = notes;
          let totalAmount = 0;
          if (ctx.type === 'single') {
            const prod = window.__CAT_PRODUCTS__.find(p => p.id === ctx.productId);
            if (prod) {
              orderNotes = (notes ? notes + ' | ' : '') + 'Produit: ' + prod.name;
              totalAmount = prod.price;
            }
          } else if (ctx.type === 'cart' && Array.isArray(ctx.items)) {
            const cartStr = ctx.items.map(i => i.name + ' x' + i.quantity).join(', ');
            orderNotes = (notes ? notes + ' | ' : '') + 'Panier: ' + cartStr;
            totalAmount = ctx.items.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
          }
          const product_id = ctx.type === 'single' ? ctx.productId : null;
          try {
            const res = await fetch('/api/order/create', {
              method: 'POST',
              credentials: 'same-origin',
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
                payment_method: paymentMethod || 'a_confirmer'
              })
            });
            if (res.ok) {
              const orderData = await res.json().catch(() => ({}));
              localStorage.setItem('maasga_client_info', JSON.stringify({ name, phone, quartier, email }));
              if (ctx.type === 'cart') {
                localStorage.removeItem('maasga_cart');
                updateCartBadge();
              }

              // Si paiement en ligne sélectionné, initier le paiement
              if (paymentMethod && paymentMethod !== 'a_confirmer' && totalAmount > 0) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Redirection paiement…';
                try {
                  const payRes = await fetch('/api/payment/initiate', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      payment_type: 'order',
                      order_id: orderData.orderId || null,
                      amount: totalAmount,
                      method: paymentMethod,
                      description: 'Commande MAASGA - ' + (ctx.type === 'cart' ? 'Panier' : 'Produit')
                    })
                  });
                  const payData = await payRes.json().catch(() => ({}));
                  if (payData.redirect_url) {
                    window.location.href = payData.redirect_url;
                    return;
                  }
                } catch(pe) {
                  // Paiement échoué, montrer quand même le succès de commande
                }
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
          if (!password || password.length < 8) {
            showToast('Mot de passe trop court (minimum 8 caractères).', 'warning');
            return;
          }
          if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
            showToast('Le mot de passe doit contenir des lettres et des chiffres.', 'warning');
            return;
          }
          const btn = event.target.closest('button');
          btn.disabled = true;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i>Création...';
          try {
            const res = await fetch('/api/register', {
              method: 'POST',
              credentials: 'same-origin',
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

        // ─── CLIENT-SIDE INSTANT FILTERING + PAGINATION ───
        (function() {
          const form = document.querySelector('form[action="/catalogue"]');
          if (!form) return;
          const grid = document.getElementById('products-grid');
          const countEl = document.getElementById('product-count');
          const liveCount = document.getElementById('filter-live-count');
          const paginationEl = document.getElementById('catalogue-pagination');
          if (!grid) return;

          const ITEMS_PER_PAGE = 12;
          let currentPage = 1;

          function applyFilters() {
            const brand = form.querySelector('input[name="brand"]:checked')?.value || 'all';
            const btu = form.querySelector('input[name="btu"]:checked')?.value || 'all';
            const inverter = form.querySelector('input[name="inverter"]:checked')?.value || 'all';
            const available = form.querySelector('input[name="available"]')?.checked;

            const cards = grid.querySelectorAll('.product-card');
            const matchingCards = [];
            cards.forEach(card => {
              let show = true;
              if (brand !== 'all' && card.dataset.brand !== brand) show = false;
              if (btu !== 'all' && card.dataset.btu !== btu) show = false;
              if (inverter === 'true' && card.dataset.inverter !== 'true') show = false;
              if (inverter === 'false' && card.dataset.inverter !== 'false') show = false;
              if (available && (card.dataset.available !== 'true' || card.dataset.stock === '0')) show = false;
              card._matchesFilter = show;
              if (show) matchingCards.push(card);
            });

            const totalVisible = matchingCards.length;
            const totalPages = Math.max(1, Math.ceil(totalVisible / ITEMS_PER_PAGE));
            if (currentPage > totalPages) currentPage = 1;

            // Apply pagination: show only current page items
            let idx = 0;
            cards.forEach(card => {
              if (!card._matchesFilter) {
                card.style.display = 'none';
                return;
              }
              const pageOfCard = Math.floor(idx / ITEMS_PER_PAGE) + 1;
              card.style.display = pageOfCard === currentPage ? '' : 'none';
              idx++;
            });

            const visible = Math.min(ITEMS_PER_PAGE, totalVisible - (currentPage - 1) * ITEMS_PER_PAGE);

            if (countEl) {
              countEl.innerHTML = '<strong class="text-white">' + totalVisible + '</strong> climatiseur' + (totalVisible > 1 ? 's' : '') + ' trouvé' + (totalVisible > 1 ? 's' : '');
            }
            if (liveCount) {
              if (totalPages > 1) {
                liveCount.textContent = 'Page ' + currentPage + ' / ' + totalPages + ' (' + totalVisible + ' résultats)';
              } else {
                liveCount.textContent = totalVisible === cards.length ? '' : totalVisible + ' / ' + cards.length + ' affichés';
              }
            }

            // Render pagination
            if (paginationEl) {
              if (totalPages <= 1) {
                paginationEl.innerHTML = '';
              } else {
                let html = '';
                const btnBase = 'px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ';
                const btnActive = 'background:linear-gradient(135deg,#2563eb,#0284c7); color:white; box-shadow:0 2px 8px rgba(37,99,235,0.3);';
                const btnNormal = 'background:rgba(56,189,248,0.08); color:#8ba3c0; border:1px solid rgba(56,189,248,0.15);';
                const btnDisabled = 'background:rgba(255,255,255,0.03); color:#475569; cursor:not-allowed;';
                // Prev
                html += '<button onclick="window._catPage(' + (currentPage - 1) + ')" class="' + btnBase + '" style="' + (currentPage <= 1 ? btnDisabled : btnNormal) + '"' + (currentPage <= 1 ? ' disabled' : '') + '><i class="fas fa-chevron-left text-xs"></i></button>';
                // Page buttons
                for (let i = 1; i <= totalPages; i++) {
                  if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
                    if (i === 3 || i === totalPages - 2) html += '<span class="px-1 text-gray-500">…</span>';
                    continue;
                  }
                  html += '<button onclick="window._catPage(' + i + ')" class="' + btnBase + '" style="' + (i === currentPage ? btnActive : btnNormal) + '">' + i + '</button>';
                }
                // Next
                html += '<button onclick="window._catPage(' + (currentPage + 1) + ')" class="' + btnBase + '" style="' + (currentPage >= totalPages ? btnDisabled : btnNormal) + '"' + (currentPage >= totalPages ? ' disabled' : '') + '><i class="fas fa-chevron-right text-xs"></i></button>';
                paginationEl.innerHTML = html;
              }
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

          // Pagination navigation
          window._catPage = function(p) {
            const cards = grid.querySelectorAll('.product-card');
            const totalMatching = Array.from(cards).filter(c => c._matchesFilter).length;
            const totalPages = Math.max(1, Math.ceil(totalMatching / ITEMS_PER_PAGE));
            if (p < 1 || p > totalPages) return;
            currentPage = p;
            applyFilters();
            grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
          };

          // Listen to all filter changes
          form.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
            input.addEventListener('change', function(e) {
              e.preventDefault();
              currentPage = 1;
              applyFilters();
            });
          });

          // Prevent form submission (use JS filtering instead)
          form.addEventListener('submit', function(e) {
            e.preventDefault();
            currentPage = 1;
            applyFilters();
          });

          // Apply initial filters from URL params
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has('brand') || urlParams.has('btu') || urlParams.has('inverter') || urlParams.has('available')) {
            applyFilters();
          }
        })();

        window.openCartModal = openCartModal;
        window.openProductDetail = openProductDetail;
        window.submitStockAlert = submitStockAlert;
        window.updateQty = updateQty;
        window.closeCartModal = closeCartModal;
        window.clearCart = clearCart;
        window.validateCart = validateCart;
        window.closeOrderModal = closeOrderModal;
        window.requestOrderLocation = requestOrderLocation;
        window.submitOrder = submitOrder;
        window.addToCart = addToCart;
        window.openOrderModal = openOrderModal;
        window.cartQty = cartQty;
        window.cartRemove = cartRemove;
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
            <button onclick="closeCompareModal()" class="hover:text-white p-1 text-2xl leading-none" style="color:#64748b;" aria-label="Fermer la comparaison">&times;</button>
          </div>
          <div id="compare-content" class="overflow-auto p-6" style="max-height:calc(90vh - 70px);">
            {/* Filled by JS */}
          </div>
        </div>
      </div>

      {/* ===== JS COMPARATEUR ===== */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
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
              html += '<img src="' + (p.imageUrl || '/static/ac-placeholder.svg') + '" alt="' + p.name + '" style="width:50px;height:50px;object-fit:contain;margin-bottom:4px;" loading="lazy" />';
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

          window.toggleCompare = toggleCompare;
          window.clearCompare = clearCompare;
          window.openCompareModal = openCompareModal;
          window.closeCompareModal = closeCompareModal;
        })();
      `}} />
    </Layout>
  )
}

