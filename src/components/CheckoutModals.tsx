import { quartiersByArrondissement } from '../data/quartiers'

/**
 * CheckoutModals — panier + commande partagés entre le catalogue et la fiche produit.
 *
 * Rend : le bouton panier flottant, la modale panier (#cart-modal), la modale
 * commande/checkout (#order-modal) et tout le JS associé (addToCart, cart*, order*,
 * paiement, restauration de commande en attente). Le script définit
 * `window.__CAT_PRODUCTS__` à partir de la prop `products` (les lookups panier/commande
 * s'appuient dessus) et expose sur `window` toutes les fonctions appelées via onclick.
 *
 * Le tout est IIFE-wrappé + exposé sur window : le routeur PJAX (Layout.tsx) réexécute
 * les scripts du <main> à chaque navigation, donc pas de `const`/`let` top-level qui
 * planterait « already declared » à la 2e visite.
 *
 * @param products        produits à sérialiser dans window.__CAT_PRODUCTS__
 * @param redirectTarget  chemin (sans slash initial) de retour après connexion forcée,
 *                        ex: "catalogue" ou `catalogue/${id}`
 */
export const CheckoutModals = ({ products, redirectTarget }: { products: any[], redirectTarget: string }) => {
  return (
    <>
      {/* Bouton panier flottant */}
      <button onclick="openCartModal()" class="fixed bottom-6 right-6 z-40 flex items-center space-x-2 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm text-white transition-all hover:scale-105" style="background:linear-gradient(135deg,#0ea5e9,#3b82f6); border:2px solid rgba(255,255,255,0.15);">
        <i class="fas fa-shopping-cart text-lg"></i>
        <span>Mon panier</span>
        <span id="cart-count-badge" class="hidden ml-1 bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black">0</span>
      </button>

      {/* ===== MODAL PANIER ===== */}
      <div id="cart-modal" data-lenis-prevent class="hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style="background:rgba(0,0,0,0.8); backdrop-filter:blur(6px);" role="dialog" aria-modal="true" aria-label="Panier">
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
      <div id="order-modal" data-lenis-prevent class="hidden fixed inset-0 z-50 flex items-end sm:items-start justify-center sm:pt-6 p-0 sm:p-4" style="background:rgba(0,0,0,0.6); backdrop-filter:blur(4px);" role="dialog" aria-modal="true" aria-label="Passer commande">
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
              <a href={`/espace-client?redirect=${redirectTarget}`} style="color:#0077b6; font-weight:700;">Se connecter →</a>
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

            {/* Notice contact WhatsApp & Email */}
            <div id="order-contact-notice" class="rounded-2xl p-4" style="background:linear-gradient(135deg,rgba(0,119,182,0.06),rgba(37,211,102,0.04)); border:1.5px solid rgba(0,119,182,0.15);">
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5" style="background:linear-gradient(135deg,#0077b6,#00b4d8);">
                  <i class="fas fa-headset" style="color:#fff; font-size:1rem;"></i>
                </div>
                <div>
                  <div class="text-sm font-bold mb-1" style="color:#03045e;">Comment ça fonctionne ?</div>
                  <p class="text-xs leading-relaxed mb-3" style="color:#475569;">
                    Après validation de votre commande, <strong style="color:#0077b6;">un conseiller MAASGA vous contactera directement</strong> par <span style="color:#25d366; font-weight:700;"><i class="fab fa-whatsapp"></i> WhatsApp</span> et par <span style="color:#0077b6; font-weight:700;"><i class="fas fa-envelope"></i> e-mail</span> afin de finaliser les modalités de paiement et de livraison.
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold" style="background:rgba(37,211,102,0.1); color:#16a34a;">
                      <i class="fab fa-whatsapp"></i> Contact WhatsApp
                    </span>
                    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold" style="background:rgba(0,119,182,0.08); color:#0077b6;">
                      <i class="fas fa-envelope"></i> Confirmation par e-mail
                    </span>
                    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold" style="background:rgba(234,179,8,0.1); color:#d97706;">
                      <i class="fas fa-clock"></i> Réponse sous 2h
                    </span>
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
            <p class="text-sm mb-3" style="color:#8ba3c0;">Votre commande est enregistrée. Un conseiller MAASGA vous contactera sous <strong style="color:#25d366;">2h</strong> par <strong style="color:#25d366;"><i class="fab fa-whatsapp"></i> WhatsApp</strong> et par <strong style="color:#0077b6;"><i class="fas fa-envelope"></i> e-mail</strong> pour finaliser les modalités de paiement et de livraison.</p>

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
        window.__CAT_PRODUCTS__ = ${JSON.stringify(products.map((p: any) => ({
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

        // Restaurer commande en attente après connexion
        (function restorePendingOrder() {
          try {
            var raw = localStorage.getItem('maasga_pending_order');
            if (!raw) return;
            var pending = JSON.parse(raw);
            if (Date.now() - pending.timestamp > 30 * 60 * 1000) {
              localStorage.removeItem('maasga_pending_order');
              return;
            }
            fetch('/api/session-check', { credentials: 'same-origin' }).then(function(r) { return r.json(); }).then(function(data) {
              if (!data.loggedIn) return;
              localStorage.removeItem('maasga_pending_order');
              if (pending.context && pending.context.type === 'single' && pending.context.productId) {
                setTimeout(function() {
                  if (typeof openOrderModal === 'function') {
                    openOrderModal(pending.context.productId);
                    setTimeout(function() {
                      if (pending.name) { var el = document.getElementById('order-name'); if(el) el.value = pending.name; }
                      if (pending.phone) { var el = document.getElementById('order-phone'); if(el) el.value = pending.phone; }
                      if (pending.quartier) { var el = document.getElementById('order-quartier'); if(el) el.value = pending.quartier; }
                      if (pending.email) { var el = document.getElementById('order-email'); if(el) el.value = pending.email; }
                      if (pending.notes) { var el = document.getElementById('order-notes'); if(el) el.value = pending.notes; }
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
                      showToast('Votre commande précédente a été restaurée. Vous pouvez la finaliser.', 'success');
                    }, 300);
                  }
                }, 500);
              }
            });
          } catch(e) { localStorage.removeItem('maasga_pending_order'); }
        })();

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
          document.body.classList.add('modal-open');
          if (window.__lenis) window.__lenis.stop();
          if (window.trapFocus) window.trapFocus(cm);
        }
        function closeCartModal() {
          var cm = document.getElementById('cart-modal');
          cm.classList.add('hidden');
          document.body.classList.remove('modal-open');
          if (window.__lenis) window.__lenis.start();
          if (window.releaseFocus) window.releaseFocus(cm);
        }
        var _cartModalEl = document.getElementById('cart-modal');
        if (_cartModalEl) _cartModalEl.addEventListener('click', function(e) {
          if (e.target === this) closeCartModal();
        });

        function updateCartBadge() {
          const cart = JSON.parse(localStorage.getItem('maasga_cart') || '[]');
          const badge = document.getElementById('cart-count-badge');
          if (!badge) return;
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
          checkLoginAndProceed(function() {
            closeCartModal();
            _doOpenCartOrderModal();
          }, { type: 'cart' });
        }

        // ===== GESTION MODAL COMMANDE =====
        let __ORDER_GPS__ = null;

        function requestOrderLocation() {
          const btn = document.getElementById('order-gps-btn');
          const label = document.getElementById('order-gps-label');
          const status = document.getElementById('order-gps-status');
          if (!navigator.geolocation) {
            status.textContent = '❌ Géolocalisation non supportée par votre navigateur.';
            status.style.cssText = 'display:block; background:rgba(239,68,68,0.08); color:#f87171; border:1px solid rgba(239,68,68,0.2);';
            return;
          }
          label.textContent = 'Localisation en cours…';
          btn.style.opacity = '0.7';
          btn.disabled = true;
          navigator.geolocation.getCurrentPosition(
            function(pos) {
              __ORDER_GPS__ = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) };
              btn.style.cssText = 'width:100%; padding:11px 16px; border-radius:12px; background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.3); color:#34d399; font-weight:600; font-size:0.82rem; cursor:default; display:flex; align-items:center; justify-content:center; gap:8px;';
              label.innerHTML = '<i class="fas fa-check" style="margin-right:4px;"></i>Position partagée (±' + __ORDER_GPS__.accuracy + 'm)';
              btn.disabled = false;
              status.style.display = 'none';
            },
            function(err) {
              btn.style.opacity = '1';
              btn.disabled = false;
              label.textContent = 'Partager ma position';
              let msg = 'Erreur de localisation.';
              if (err.code === 1) msg = '❌ Permission refusée. Autorisez la localisation dans votre navigateur.';
              else if (err.code === 2) msg = '❌ Position indisponible. Vérifiez votre GPS.';
              else if (err.code === 3) msg = '❌ Délai dépassé. Réessayez.';
              status.textContent = msg;
              status.style.cssText = 'display:block; background:rgba(239,68,68,0.08); color:#f87171; border:1px solid rgba(239,68,68,0.2); border-radius:8px; padding:8px 12px; font-size:0.72rem; margin-top:8px;';
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
          );
        }

        function openOrderModal(productId) {
          checkLoginAndProceed(function() {
            _doOpenOrderModal(productId);
          }, { type: 'single', productId: productId });
        }

        function _doOpenOrderModal(productId) {
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
          document.body.classList.add('modal-open');
          if (window.__lenis) window.__lenis.stop();
          if (window.trapFocus) window.trapFocus(om);
        }

        function openCartOrderModal() {
          checkLoginAndProceed(function() {
            _doOpenCartOrderModal();
          }, { type: 'cart' });
        }

        function _doOpenCartOrderModal() {
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
          document.body.classList.add('modal-open');
          if (window.__lenis) window.__lenis.stop();
          if (window.trapFocus) window.trapFocus(om2);
        }

        function closeOrderModal() {
          var om = document.getElementById('order-modal');
          om.classList.add('hidden');
          document.body.classList.remove('modal-open');
          if (window.__lenis) window.__lenis.start();
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

        var __SESSION_DATA__ = null;
        var __SESSION_CHECKED__ = false;

        function checkLoginAndProceed(callback, context) {
          fetch('/api/session-check', { credentials: 'same-origin' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
              if (data.loggedIn) {
                callback();
              } else {
                try {
                  localStorage.setItem('maasga_pending_order', JSON.stringify({
                    context: context,
                    timestamp: Date.now()
                  }));
                } catch(e) {}
                var target = window.location.pathname + window.location.search;
                window.location.href = '/espace-client?redirect=' + encodeURIComponent(target);
              }
            })
            .catch(function() {
              window.location.href = '/espace-client?redirect=' + encodeURIComponent(window.location.pathname);
            });
        }

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
          var loginBanner = document.getElementById('order-login-banner');
          var loggedBanner = document.getElementById('order-logged-banner');
          var loggedName = document.getElementById('order-logged-name');
          var caSection = document.getElementById('create-account-section');
          if (__SESSION_DATA__ && __SESSION_DATA__.loggedIn) {
            if (loginBanner) loginBanner.style.display = 'none';
            if (loggedBanner) { loggedBanner.style.display = 'flex'; }
            if (loggedName) loggedName.textContent = __SESSION_DATA__.name || 'Client';
            if (caSection) caSection.style.display = 'none';
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
          try {
            const saved = JSON.parse(localStorage.getItem('maasga_client_info') || '{}');
            if (saved.name) document.getElementById('order-name').value = saved.name;
            if (saved.phone) document.getElementById('order-phone').value = saved.phone;
            if (saved.quartier) document.getElementById('order-quartier').value = saved.quartier;
            if (saved.email) document.getElementById('order-email').value = saved.email;
          } catch(e) {}
          checkSessionAndUpdateUI();
        }

        async function submitOrder() {
          const name = document.getElementById('order-name').value.trim();
          const phone = document.getElementById('order-phone').value.trim();
          const quartier = document.getElementById('order-quartier').value.trim();
          const email = document.getElementById('order-email').value.trim();
          const notes = document.getElementById('order-notes').value.trim();
          const paymentMethod = 'a_confirmer';

          if (!name || !phone) {
            showToast('Merci de renseigner votre nom et votre téléphone.', 'warning');
            return;
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

        var _orderModalEl = document.getElementById('order-modal');
        if (_orderModalEl) _orderModalEl.addEventListener('click', function(e) {
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

        // Fermeture des modales panier/commande à la touche Échap
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            ['cart-modal', 'order-modal'].forEach(function(id) {
              var m = document.getElementById(id);
              if (m && !m.classList.contains('hidden')) {
                m.classList.add('hidden');
                document.body.style.overflow = '';
                if (window.releaseFocus) window.releaseFocus(m);
              }
            });
          }
        });

        // Initialiser le badge au chargement
        updateCartBadge();

        // Exposer les fonctions appelées via onclick (script réexécuté par le routeur PJAX)
        window.addToCart = addToCart;
        window.openCartModal = openCartModal;
        window.closeCartModal = closeCartModal;
        window.clearCart = clearCart;
        window.validateCart = validateCart;
        window.cartQty = cartQty;
        window.cartRemove = cartRemove;
        window.openOrderModal = openOrderModal;
        window.openCartOrderModal = openCartOrderModal;
        window.closeOrderModal = closeOrderModal;
        window.requestOrderLocation = requestOrderLocation;
        window.submitOrder = submitOrder;
        window.createAccountAfterOrder = createAccountAfterOrder;
        window.skipAccountCreation = skipAccountCreation;
        window.toggleRegisterPwd = toggleRegisterPwd;
        })();
      ` }} />
    </>
  )
}
