import { Layout } from '../components/Layout'
import { products, type Product } from '../data/products'
import { CheckoutModals } from '../components/CheckoutModals'
import { TECH_LABELS } from '../data/techSpecsLabels'

const BTU_TO_CV: Record<number, string> = { 9000: '1', 12000: '1,5', 18000: '2', 24000: '3', 36000: '5' }

/**
 * Fiche produit dédiée — /catalogue/:id.
 *
 * L'image porte `view-transition-name: product-image-{id}`, identique à la carte
 * du catalogue → le navigateur morphe l'image entre les deux pages via l'API
 * View Transitions (déclenchée par le routeur PJAX de Layout.tsx qui enveloppe le
 * swap dans document.startViewTransition). Le flux panier/commande est fourni par
 * le composant partagé <CheckoutModals />.
 */
export const ProductDetailPage = ({ product }: { product: Product }) => {
  const allProducts = [...products]
  const inStock = product.stock > 0 && product.available
  const cv = BTU_TO_CV[product.btu] || '1'
  const techEntries = product.techSpecs
    ? Object.entries(product.techSpecs).filter(([, v]) => v != null && v !== '')
    : []
  const desc = product.description
    ? (product.description.length > 155 ? product.description.slice(0, 152) + '…' : product.description)
    : `${product.brand} ${product.model} — climatiseur ${product.btu.toLocaleString('fr-FR')} BTU (${cv} CV) chez MAASGA Ouagadougou. Livraison et installation incluses.`

  return (
    <Layout title={`${product.name} — MAASGA Ouagadougou`} activePage="catalogue" canonicalPath={`/catalogue/${product.id}`} description={desc}>
      <section class="pb-16 pt-6">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Fil d'Ariane / retour */}
          <a href="/catalogue" class="inline-flex items-center space-x-2 text-sm font-semibold mb-6 transition-colors" style="color:#38bdf8;">
            <i class="fas fa-arrow-left"></i>
            <span>Retour au catalogue</span>
          </a>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

            {/* ===== Colonne image ===== */}
            <div class="glass-card rounded-3xl overflow-hidden">
              <div class="w-full flex items-center justify-center p-8" style="background:linear-gradient(145deg,#e8f2ff,#f0f7ff); min-height:320px;">
                <img
                  src={product.imageUrl || '/static/ac-placeholder.svg'}
                  alt={product.name}
                  class="max-h-80 w-auto object-contain"
                  loading="eager"
                  style={`view-transition-name: product-image-${product.id}`}
                />
              </div>

              {/* Galerie média */}
              {product.media && product.media.length > 0 && (
                <div class="p-5 space-y-3">
                  <h4 class="text-sm font-bold" style="color:#e2e8f0;"><i class="fas fa-image mr-2" style="color:#38bdf8;"></i>Galerie</h4>
                  <div class="flex gap-3 overflow-x-auto pb-2">
                    {product.media.map(m => (
                      m.type === 'video'
                        ? <video src={m.url} controls preload="metadata" class="h-28 rounded-xl flex-shrink-0" style="background:#000;"></video>
                        : <img src={m.url} alt={m.caption || product.name} loading="lazy" class="h-28 w-auto object-cover rounded-xl flex-shrink-0" style="border:1px solid rgba(56,189,248,0.15);" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ===== Colonne infos ===== */}
            <div>
              <div class="text-xs font-bold uppercase tracking-wider mb-1" style="color:#38bdf8;">{product.brand}</div>
              <h1 class="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-1">{product.name}</h1>
              <div class="text-xs mb-4" style="color:#64748b;">Réf: {product.model}</div>

              {/* Badges */}
              <div class="flex flex-wrap gap-2 mb-5">
                {product.inverter && (
                  <span class="text-xs text-white px-2.5 py-1 rounded-lg font-semibold" style="background:linear-gradient(135deg,#0ea5e9,#3b82f6);">INVERTER</span>
                )}
                <span class="text-xs px-2.5 py-1 rounded-lg font-medium" style="background:rgba(56,189,248,0.1); color:#38bdf8;">{product.energy_class}</span>
                {product.warranty && (
                  <span class="text-xs px-2.5 py-1 rounded-lg font-medium" style="background:rgba(52,211,153,0.1); color:#34d399;">{product.warranty}</span>
                )}
                <span class={`text-xs px-2.5 py-1 rounded-full font-semibold ${product.stock > 3 ? 'badge-stock-ok' : product.stock > 0 ? 'badge-stock-low' : 'badge-stock-out'}`}>
                  {product.stock > 3 ? '✓ Disponible' : product.stock > 0 ? '⚠ Stock limité' : '✗ Rupture de stock'}
                </span>
              </div>

              {/* Specs clés */}
              <div class="grid grid-cols-2 gap-3 mb-5">
                <div class="rounded-xl px-3 py-3 text-center" style="background:rgba(56,189,248,0.07); border:1px solid rgba(56,189,248,0.15);">
                  <div class="text-xs font-medium" style="color:#38bdf8;">Puissance</div>
                  <div class="text-lg font-bold text-white">{product.btu.toLocaleString('fr-FR')} BTU</div>
                  <div class="text-xs" style="color:#38bdf8;">{cv} CV</div>
                </div>
                <div class="rounded-xl px-3 py-3 text-center" style="background:rgba(52,211,153,0.07); border:1px solid rgba(52,211,153,0.15);">
                  <div class="text-xs font-medium" style="color:#34d399;">Surface</div>
                  <div class="text-lg font-bold text-white">{product.surface_min}-{product.surface_max} m²</div>
                  <div class="text-xs" style="color:#34d399;">recommandée</div>
                </div>
              </div>

              {/* Prix */}
              <div class="rounded-2xl p-4 mb-5" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.15);">
                <div class="text-2xl font-bold text-white">{product.price.toLocaleString('fr-FR')} <span class="text-sm" style="color:#8ba3c0;">FCFA</span></div>
                <div class="text-xs font-semibold mt-0.5" style="color:#34d399;">Installation et livraison offertes</div>
              </div>

              {/* Description */}
              {product.description && (
                <div class="mb-5">
                  <h4 class="text-sm font-bold mb-2 text-white">Description</h4>
                  <p class="text-sm leading-relaxed" style="color:#8ba3c0;">{product.description}</p>
                </div>
              )}

              {/* Fonctionnalités */}
              {product.features && product.features.length > 0 && (
                <div class="mb-5">
                  <h4 class="text-sm font-bold mb-2 text-white">Fonctionnalités</h4>
                  <div class="flex flex-wrap gap-2">
                    {product.features.map(f => (
                      <span class="text-xs px-2.5 py-1 rounded-full" style="background:rgba(56,189,248,0.06); color:#8ba3c0; border:1px solid rgba(56,189,248,0.1);">{f}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              {inStock ? (
                <div class="space-y-3">
                  <div class="flex items-center gap-3">
                    <label class="text-sm font-semibold text-white">Quantité</label>
                    <div class="flex items-center gap-2">
                      <button type="button" onclick="var i=document.getElementById('pd-qty');i.value=Math.max(1,(parseInt(i.value||'1')-1));" class="w-9 h-9 rounded-lg font-bold" style="background:rgba(56,189,248,0.12); color:#38bdf8;">−</button>
                      <input type="number" id="pd-qty" value="1" min="1" max={String(product.stock)} class="w-14 text-center font-bold rounded-lg py-2" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.2); color:#fff;" />
                      <button type="button" onclick={`var i=document.getElementById('pd-qty');i.value=Math.min(${product.stock},(parseInt(i.value||'1')+1));`} class="w-9 h-9 rounded-lg font-bold" style="background:rgba(56,189,248,0.12); color:#38bdf8;">+</button>
                    </div>
                  </div>
                  <button onclick={`addToCart(${product.id}, parseInt(document.getElementById('pd-qty').value||'1'))`} class="w-full font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 text-sm text-white" style="background:linear-gradient(135deg,#0ea5e9,#3b82f6);">
                    <i class="fas fa-cart-plus"></i>
                    <span>Ajouter au panier</span>
                  </button>
                  <button onclick={`openOrderModal(${product.id})`} class="w-full btn-primary text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 text-sm">
                    <i class="fas fa-shopping-bag"></i>
                    <span>Commander maintenant</span>
                  </button>
                  <a href={`/simulateur?product=${product.id}`} class="w-full flex items-center justify-center space-x-2 text-xs py-1 transition-colors" style="color:#38bdf8;">
                    <i class="fas fa-calculator"></i>
                    <span>Vérifier la compatibilité BTU avec ma pièce</span>
                  </a>
                </div>
              ) : (
                <div class="space-y-3">
                  <div class="w-full font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 text-sm cursor-not-allowed" style="background:rgba(255,255,255,0.05); color:#64748b; border:1px solid rgba(255,255,255,0.08);">
                    <i class="fas fa-ban"></i>
                    <span>Rupture de stock</span>
                  </div>
                  <div id={`stock-alert-${product.id}`} class="w-full">
                    <button onclick={`document.getElementById('stock-form-${product.id}').classList.toggle('hidden')`} class="w-full flex items-center justify-center space-x-2 text-sm py-2 rounded-lg transition-colors" style="color:#38bdf8; background:rgba(56,189,248,0.05);">
                      <i class="fas fa-bell"></i>
                      <span>Me notifier du réapprovisionnement</span>
                    </button>
                    <div id={`stock-form-${product.id}`} class="hidden mt-2 flex gap-2">
                      <input type="tel" id={`stock-phone-${product.id}`} placeholder="Ex: 55 99 64 18" class="flex-1 text-sm px-3 py-2 rounded-lg" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.2); color:#fff;" />
                      <button onclick={`submitStockAlert(${product.id})`} class="text-sm px-4 py-2 rounded-lg font-semibold" style="background:rgba(16,185,129,0.1); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
                        <i class="fas fa-check"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Caractéristiques techniques */}
          {techEntries.length > 0 && (
            <div class="glass-card rounded-3xl p-6 sm:p-8 mt-10">
              <h2 class="text-lg font-bold text-white mb-5 flex items-center space-x-2">
                <i class="fas fa-microchip" style="color:#38bdf8;"></i>
                <span>Caractéristiques techniques</span>
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {techEntries.map(([key, value]) => (
                  <div class="flex items-center justify-between py-2 border-b border-white/5">
                    <span class="text-sm" style="color:#8ba3c0;">{TECH_LABELS[key] || key}</span>
                    <span class="text-sm font-semibold text-white text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Panier + commande (composant partagé avec le catalogue) */}
      <CheckoutModals products={allProducts} redirectTarget={`catalogue/${product.id}`} />
    </Layout>
  )
}
