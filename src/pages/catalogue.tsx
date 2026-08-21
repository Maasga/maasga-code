import { Layout } from '../components/Layout'
import { products } from '../data/products'
import { CheckoutModals } from '../components/CheckoutModals'

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

      {/* Panier + commande (composant partagé avec la fiche produit) */}
      <CheckoutModals products={allProducts} redirectTarget="catalogue" />

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
                        ? <img src={(p as any).imageUrl} alt={p.name} class="w-32 h-32 object-contain mx-auto mb-2" loading="lazy" style={`view-transition-name: product-image-${p.id}`} />
                        : <img src="/static/ac-placeholder.svg" alt={p.name} class="w-32 h-32 object-contain mx-auto mb-2" loading="lazy" style={`view-transition-name: product-image-${p.id}`} />
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
                          <a href={`/catalogue/${p.id}`} class="w-full font-semibold py-2 rounded-xl flex items-center justify-center space-x-2 text-sm transition-colors" style="background:rgba(56,189,248,0.1); color:#38bdf8; border:1px solid rgba(56,189,248,0.25);">
                            <i class="fas fa-info-circle text-xs"></i>
                            <span>Voir les détails</span>
                          </a>
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
                          <a href={`/catalogue/${p.id}`} class="w-full font-semibold py-2 rounded-xl flex items-center justify-center space-x-2 text-sm transition-colors" style="background:rgba(56,189,248,0.08); color:#38bdf8; border:1px solid rgba(56,189,248,0.2);">
                            <i class="fas fa-info-circle text-xs"></i>
                            <span>Voir les détails</span>
                          </a>
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

      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
        // window.__CAT_PRODUCTS__ + le flux panier/commande sont fournis par <CheckoutModals /> (composant partagé).

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
            // Les valeurs viennent de data-* rendus côté serveur depuis la base
            // (nom, marque, modèle saisis en admin). Comme on assemble du HTML à la
            // main, chaque valeur textuelle passe par esc() — sinon un nom de
            // produit contenant du balisage s'exécute dans la modale.
            function esc(v) {
              return String(v == null ? '' : v)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            }
            const rows = [
              { label: 'Marque', fn: p => esc(p.brand) },
              { label: 'Modèle', fn: p => esc(p.model) },
              { label: 'Puissance', fn: p => Number(p.btu).toLocaleString('fr-FR') + ' BTU' },
              { label: 'Prix', fn: p => Number(p.price).toLocaleString('fr-FR') + ' FCFA' },
              { label: 'Inverter', fn: p => p.inverter ? '<span style="color:#34d399;">✓ Oui</span>' : '<span style="color:#f87171;">✗ Non</span>' },
              { label: 'Classe énergie', fn: p => esc(p.energy) },
              { label: 'Stock', fn: p => p.stock > 0 ? '<span style="color:#34d399;">' + Number(p.stock) + ' dispo</span>' : '<span style="color:#f87171;">Rupture</span>' },
            ];

            let html = '<div style="display:grid; grid-template-columns: 140px repeat(' + cols.length + ', 1fr); gap:0;">';
            // Header
            html += '<div style="background:rgba(56,189,248,0.05); padding:12px; font-weight:700; font-size:0.75rem; color:#38bdf8; text-transform:uppercase;">Caractéristique</div>';
            cols.forEach(p => {
              html += '<div style="background:rgba(56,189,248,0.05); padding:12px; text-align:center; border-left:1px solid rgba(56,189,248,0.08);">';
              // dataset expose 'image' (data-image), pas 'imageUrl' : l'ancienne clé
              // était toujours undefined, donc toutes les vignettes tombaient sur le placeholder.
              html += '<img src="' + esc(p.image || '/static/ac-placeholder.svg') + '" alt="' + esc(p.name) + '" style="width:50px;height:50px;object-fit:contain;margin-bottom:4px;" loading="lazy" />';
              html += '<div style="font-size:0.7rem; color:#38bdf8; font-weight:700; text-transform:uppercase;">' + esc(p.brand) + '</div>';
              html += '<div style="font-size:0.8rem; color:white; font-weight:600; line-height:1.3; margin-bottom:6px;">' + esc(p.name) + '</div>';
              html += '<a href="/rendez-vous?product=' + Number(p.id) + '" style="display:inline-block; background:linear-gradient(135deg,#0ea5e9,#3b82f6); color:white; padding:5px 10px; border-radius:8px; font-size:0.7rem; font-weight:700; text-decoration:none;">Commander</a>';
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

