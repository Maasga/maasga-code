import { Layout } from '../components/Layout'
import { products, type Product } from '../data/products'
import { CheckoutModals } from '../components/CheckoutModals'
import { TECH_LABELS } from '../data/techSpecsLabels'
import { SITE_URL } from '../types'

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
  // Puissance électrique absorbée : fiche technique si renseignée, sinon estimation
  // à partir de la puissance frigorifique (1 W = 3,412 BTU/h) et d'un EER typique.
  const specWatts = parseFloat(String(product.techSpecs?.cooling_input_power || '').replace(',', '.').replace(/[^\d.]/g, ''))
  const energyWatts = Number.isFinite(specWatts) && specWatts > 100
    ? Math.round(specWatts)
    : Math.round(product.btu / 3.412 / (product.inverter ? 3.4 : 2.8))
  const energySource = Number.isFinite(specWatts) && specWatts > 100
    ? `puissance absorbée ${energyWatts} W selon la fiche technique`
    : `puissance absorbée estimée à ${energyWatts} W`
  const desc = product.description
    ? (product.description.length > 155 ? product.description.slice(0, 152) + '…' : product.description)
    : `${product.brand} ${product.model} — climatiseur ${product.btu.toLocaleString('fr-FR')} BTU (${cv} CV) chez MAASGA Ouagadougou. Livraison et installation incluses.`

  // Données structurées schema.org : fiche produit enrichie dans Google (prix, disponibilité)
  const productUrl = `${SITE_URL}/catalogue/${product.id}`
  const image = product.imageUrl && /^https?:\/\//.test(product.imageUrl) ? product.imageUrl : (product.imageUrl ? `${SITE_URL}${product.imageUrl}` : `${SITE_URL}/og-image.png`)
  const jsonLd = JSON.stringify([
    {
      "@context": "https://schema.org", "@type": "Product",
      name: product.name, brand: { "@type": "Brand", name: product.brand }, model: product.model, sku: product.model,
      description: desc, image, url: productUrl, category: "Climatiseurs",
      additionalProperty: [
        { "@type": "PropertyValue", name: "Puissance", value: `${product.btu} BTU (${cv} CV)` },
        { "@type": "PropertyValue", name: "Surface conseillée", value: `${product.surface_min}–${product.surface_max} m²` },
        { "@type": "PropertyValue", name: "Classe énergétique", value: product.energy_class },
      ],
      offers: {
        "@type": "Offer", url: productUrl, priceCurrency: "XOF", price: String(product.price),
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: "MAASGA Climatisation" },
      },
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Catalogue", item: `${SITE_URL}/catalogue` },
        { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
      ],
    },
  ]).replace(/</g, "\\u003c") // aucun </script> possible dans le JSON-LD
  return (
    <Layout title={`${product.name} — MAASGA Ouagadougou`} activePage="catalogue" canonicalPath={`/catalogue/${product.id}`} description={desc} jsonLd={jsonLd} ogImage={image} ogType="product">
      <section class="pb-16 pt-6">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Fil d'Ariane / retour */}
          <a href="/catalogue" class="inline-flex items-center space-x-2 text-sm font-semibold mb-6 transition-colors" style="color:#0369a1;">
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
                  <h4 class="text-sm font-bold" style="color:#e2e8f0;"><i class="fas fa-image mr-2" style="color:#0369a1;"></i>Galerie</h4>
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
              <div class="text-xs font-bold uppercase tracking-wider mb-1" style="color:#0369a1;">{product.brand}</div>
              <h1 class="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-1">{product.name}</h1>
              <div class="text-xs mb-4" style="color:#64748b;">Réf: {product.model}</div>

              {/* Badges */}
              <div class="flex flex-wrap gap-2 mb-5">
                {product.inverter && (
                  <span class="text-xs text-white px-2.5 py-1 rounded-lg font-semibold" style="background:linear-gradient(135deg,#0ea5e9,#3b82f6);">INVERTER</span>
                )}
                <span class="text-xs px-2.5 py-1 rounded-lg font-medium" style="background:rgba(56,189,248,0.1); color:#0369a1;">{product.energy_class}</span>
                {product.warranty && (
                  <span class="text-xs px-2.5 py-1 rounded-lg font-medium" style="background:rgba(52,211,153,0.1); color:#047857;">{product.warranty}</span>
                )}
                <span class={`text-xs px-2.5 py-1 rounded-full font-semibold ${product.stock > 3 ? 'badge-stock-ok' : product.stock > 0 ? 'badge-stock-low' : 'badge-stock-out'}`}>
                  {product.stock > 3 ? '✓ Disponible' : product.stock > 0 ? '⚠ Stock limité' : '✗ Rupture de stock'}
                </span>
              </div>

              {/* Specs clés */}
              <div class="grid grid-cols-2 gap-3 mb-5">
                <div class="rounded-xl px-3 py-3 text-center" style="background:rgba(56,189,248,0.07); border:1px solid rgba(56,189,248,0.15);">
                  <div class="text-xs font-medium" style="color:#0369a1;">Puissance</div>
                  <div class="text-lg font-bold text-white">{product.btu.toLocaleString('fr-FR')} BTU</div>
                  <div class="text-xs" style="color:#0369a1;">{cv} CV</div>
                </div>
                <div class="rounded-xl px-3 py-3 text-center" style="background:rgba(52,211,153,0.07); border:1px solid rgba(52,211,153,0.15);">
                  <div class="text-xs font-medium" style="color:#047857;">Surface</div>
                  <div class="text-lg font-bold text-white">{product.surface_min}-{product.surface_max} m²</div>
                  <div class="text-xs" style="color:#047857;">recommandée</div>
                </div>
              </div>

              {/* Prix */}
              <div class="rounded-2xl p-4 mb-5" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.15);">
                <div class="text-2xl font-bold text-white">{product.price.toLocaleString('fr-FR')} <span class="text-sm" style="color:#475569;">FCFA</span></div>
                <div class="text-xs font-semibold mt-0.5" style="color:#047857;">Installation et livraison offertes</div>
              </div>

              {/* Description */}
              {product.description && (
                <div class="mb-5">
                  <h4 class="text-sm font-bold mb-2 text-white">Description</h4>
                  <p class="text-sm leading-relaxed" style="color:#475569;">{product.description}</p>
                </div>
              )}

              {/* Fonctionnalités */}
              {product.features && product.features.length > 0 && (
                <div class="mb-5">
                  <h4 class="text-sm font-bold mb-2 text-white">Fonctionnalités</h4>
                  <div class="flex flex-wrap gap-2">
                    {product.features.map(f => (
                      <span class="text-xs px-2.5 py-1 rounded-full" style="background:rgba(56,189,248,0.06); color:#475569; border:1px solid rgba(56,189,248,0.1);">{f}</span>
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
                      <button type="button" onclick="var i=document.getElementById('pd-qty');i.value=Math.max(1,(parseInt(i.value||'1')-1));" class="w-9 h-9 rounded-lg font-bold" style="background:rgba(56,189,248,0.12); color:#0369a1;">−</button>
                      <input type="number" id="pd-qty" value="1" min="1" max={String(product.stock)} class="w-14 text-center font-bold rounded-lg py-2" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.2); color:#03045e;" aria-label="Quantité" />
                      <button type="button" onclick={`var i=document.getElementById('pd-qty');i.value=Math.min(${product.stock},(parseInt(i.value||'1')+1));`} class="w-9 h-9 rounded-lg font-bold" style="background:rgba(56,189,248,0.12); color:#0369a1;">+</button>
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
                  <a href={`/simulateur?product=${product.id}`} class="w-full flex items-center justify-center space-x-2 text-xs py-1 transition-colors" style="color:#0369a1;">
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
                    <button onclick={`document.getElementById('stock-form-${product.id}').classList.toggle('hidden')`} class="w-full flex items-center justify-center space-x-2 text-sm py-2 rounded-lg transition-colors" style="color:#0369a1; background:rgba(56,189,248,0.05);">
                      <i class="fas fa-bell"></i>
                      <span>Me notifier du réapprovisionnement</span>
                    </button>
                    <div id={`stock-form-${product.id}`} class="hidden mt-2 flex gap-2">
                      <input type="tel" id={`stock-phone-${product.id}`} placeholder="Ex: 55 99 64 18" class="flex-1 text-sm px-3 py-2 rounded-lg" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.2); color:#03045e;" aria-label="Quantité" />
                      <button onclick={`submitStockAlert(${product.id})`} class="text-sm px-4 py-2 rounded-lg font-semibold" style="background:rgba(16,185,129,0.1); color:#047857; border:1px solid rgba(16,185,129,0.2);">
                        <i class="fas fa-check"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Estimation de consommation électrique (FCFA / mois) */}
          <div class="glass-card rounded-3xl p-6 sm:p-8 mt-10" id="energy-estimator" data-watts={String(energyWatts)} data-duty={String(product.inverter ? 0.6 : 0.85)}>
            <h2 class="text-lg font-bold mb-1 flex items-center space-x-2" style="color:#03045e;">
              <i class="fas fa-bolt" style="color:#b45309;" aria-hidden="true"></i>
              <span>Combien va-t-il consommer ?</span>
            </h2>
            <p class="text-sm mb-5" style="color:#475569;">
              Estimation indicative pour ce modèle ({energySource}). Ajustez selon votre usage et le tarif figurant sur votre facture.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
              <label class="block">
                <span class="block text-sm font-semibold mb-2" style="color:#03045e;">Heures d’utilisation par jour : <output id="ee-hours-out">8</output> h</span>
                <input id="ee-hours" type="range" min="1" max="24" step="1" value="8" class="w-full" style="accent-color:#0369a1;" />
              </label>
              <label class="block">
                <span class="block text-sm font-semibold mb-2" style="color:#03045e;">Tarif électricité (FCFA/kWh)</span>
                <input id="ee-tariff" type="number" min="1" max="1000" step="1" value="110" inputmode="numeric" class="w-full rounded-xl px-4 py-2.5" style="border:1.5px solid rgba(3,105,161,0.25); color:#03045e; background:#fff;" />
              </label>
              <div class="rounded-2xl p-4 text-center" style="background:rgba(3,105,161,0.07);" aria-live="polite">
                <div class="text-xs font-semibold uppercase tracking-wide" style="color:#475569;">Coût estimé</div>
                <div class="text-2xl font-extrabold" style="color:#03045e;"><span id="ee-month">—</span> <span class="text-sm font-semibold">FCFA/mois</span></div>
                <div class="text-xs" style="color:#475569;"><span id="ee-kwh">—</span> kWh/mois</div>
              </div>
            </div>
            {product.inverter && (
              <p class="text-xs mt-4 flex items-center gap-2" style="color:#047857;">
                <i class="fas fa-leaf" aria-hidden="true"></i>
                Technologie Inverter : le compresseur module sa vitesse au lieu de s’arrêter et redémarrer, d’où une consommation moyenne plus faible.
              </p>
            )}
          </div>
          <script dangerouslySetInnerHTML={{ __html: `
            (function () {
              var box = document.getElementById('energy-estimator');
              if (!box) return;
              var watts = parseFloat(box.getAttribute('data-watts')) || 0;
              var duty = parseFloat(box.getAttribute('data-duty')) || 0.8;
              var hours = document.getElementById('ee-hours'), tariff = document.getElementById('ee-tariff');
              var fmt = function (n) { return Math.round(n).toLocaleString('fr-FR'); };
              function update() {
                var h = Math.min(24, Math.max(1, parseInt(hours.value, 10) || 8));
                var t = Math.min(1000, Math.max(1, parseFloat(tariff.value) || 110));
                document.getElementById('ee-hours-out').textContent = h;
                var kwh = watts * duty / 1000 * h * 30;
                document.getElementById('ee-kwh').textContent = fmt(kwh);
                document.getElementById('ee-month').textContent = fmt(kwh * t);
              }
              hours.addEventListener('input', update);
              tariff.addEventListener('input', update);
              update();
            })();
          ` }} />

          {/* Caractéristiques techniques */}
          {techEntries.length > 0 && (
            <div class="glass-card rounded-3xl p-6 sm:p-8 mt-10">
              <h2 class="text-lg font-bold text-white mb-5 flex items-center space-x-2">
                <i class="fas fa-microchip" style="color:#0369a1;"></i>
                <span>Caractéristiques techniques</span>
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {techEntries.map(([key, value]) => (
                  <div class="flex items-center justify-between py-2 border-b border-white/5">
                    <span class="text-sm" style="color:#475569;">{TECH_LABELS[key] || key}</span>
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
