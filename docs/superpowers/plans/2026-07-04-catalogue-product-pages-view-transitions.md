# Catalogue Product Pages + View Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every catalogue product its own page at `/catalogue/:id`, and make the navigation from a catalogue card to that page animate the product image with the browser's native View Transitions API — reproducing the effect from [Animating Multi-Page Navigations with Browser View Transitions and Astro](https://tympanus.net/codrops/2023/10/03/animating-multi-page-navigations-with-browser-view-transitions-and-astro/).

**Architecture:** No new client-side router, no fetch/DOM-swap JS — `/catalogue/:id` is a plain new server-rendered Hono route using a real `<a href>` link from the catalogue card. The morph itself is pure CSS (`@view-transition { navigation: auto }` + a shared `view-transition-name` on the product image), so unsupported browsers (Safari/Firefox at time of writing) just navigate normally with zero visual regression. Getting there requires first de-duplicating the "commander"/"panier" modal HTML+JS that today lives only inside `catalogue.tsx`, into two shared components so the new product page can reuse them instead of copy-pasting ~700 lines.

**Tech Stack:** Hono JSX (`hono/jsx`, SSR only, no client hydration), vanilla JS injected via `dangerouslySetInnerHTML` script blocks, Tailwind CSS compiled via `npm run build:css`, static in-memory `products` data (`src/data/products.ts`, lazily filled from D1 once per Worker isolate).

## Global Constraints

- No new server-side dependencies (Worker bundle ceiling ~1 MB).
- No automated test framework exists in this repo (`package.json`'s `"test"` script is a placeholder `curl`). Verification per task is: `npx tsc --noEmit` (must report no new errors — baseline today is clean) + a manual check via `npm run dev:sandbox` (wrangler, binds `:3000`, serves the last `npm run build`) or the Vite dev server. Do not invent fake unit tests for this codebase.
- Whenever `src/styles/app.css` changes, run `npm run build:css` before checking anything in a browser — the dev server does not auto-compile Tailwind.
- All user-facing strings stay in French, matching the rest of the site.
- Follow the existing code style in each file (plain `var`/`function` in inline `<script>` blocks — not `const`/arrow functions everywhere — matches what's already there; don't rewrite style unrelated to this feature).
- `products` is populated by a global `app.use` middleware in `src/index.tsx` (~line 274) before any route handler runs — any new route can call `products.find(...)` directly without extra loading logic.

---

## Task 1: Move `submitStockAlert` to a global helper in `Layout.tsx`

The new product page needs the "notify me when back in stock" feature (same as catalogue cards today), and this codebase's only mechanism for sharing client-side JS across pages is attaching functions to `window` inside `Layout.tsx` (see `window.showToast`, `window.trapFocus`, `window.releaseFocus` at `src/components/Layout.tsx:977-1029`). Moving `submitStockAlert` there once avoids duplicating it in both `catalogue.tsx` and the new `produit.tsx`.

**Files:**
- Modify: `src/components/Layout.tsx` (insert after the `window.releaseFocus` definition, ~line 1029)
- Modify: `src/pages/catalogue.tsx` (remove the local definition, ~lines 828-859)

**Interfaces:**
- Produces: `window.submitStockAlert(productId: number)` — global, callable from any page's inline `onclick`. Looks for `#stock-phone-{productId}` first, falls back to `#modal-stock-phone`; posts to `/api/stock-alert`; on success replaces the container `#stock-alert-{productId}` (if present) and/or `#modal-stock-form`'s parent with a confirmation message.

- [ ] **Step 1: Add `window.submitStockAlert` to `Layout.tsx`**

In `src/components/Layout.tsx`, find:

```js
          window.releaseFocus = function(modalEl) {
            if (modalEl && modalEl.__focusTrapHandler) {
              modalEl.removeEventListener('keydown', modalEl.__focusTrapHandler);
              delete modalEl.__focusTrapHandler;
            }
            window.__focusTrapStack = window.__focusTrapStack.filter(function(m) { return m !== modalEl; });
          };
        ` }} />
```

Replace with:

```js
          window.releaseFocus = function(modalEl) {
            if (modalEl && modalEl.__focusTrapHandler) {
              modalEl.removeEventListener('keydown', modalEl.__focusTrapHandler);
              delete modalEl.__focusTrapHandler;
            }
            window.__focusTrapStack = window.__focusTrapStack.filter(function(m) { return m !== modalEl; });
          };

          // Stock alert notification (used by catalogue cards and the product detail page)
          window.submitStockAlert = function(productId) {
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
                  var modalForm = document.getElementById('modal-stock-form');
                  if (modalForm) {
                    modalForm.parentElement.innerHTML = '<div style="text-align:center;padding:12px;border-radius:12px;background:rgba(16,185,129,0.1);color:#34d399;border:1px solid rgba(16,185,129,0.2);font-size:0.85rem;"><i class="fas fa-check-circle" style="margin-right:6px;"></i>' + safeMsg + '</div>';
                  }
                } else {
                  alert(data.error || 'Erreur, réessayez.');
                }
              })
              .catch(function() { alert('Erreur réseau.'); });
          };
        ` }} />
```

- [ ] **Step 2: Remove the local `submitStockAlert` from `catalogue.tsx`**

In `src/pages/catalogue.tsx`, find and delete this entire function (it's now provided globally by `Layout.tsx`):

```js
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

```

(Leave the surrounding code — the `openProductDetail` function right after it — untouched for now; it's removed in Task 4.)

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors (these are inline JS strings, not typechecked, so this just confirms the surrounding TSX is still valid).

Run: `npm run build`
Expected: build succeeds (this catches JSX/syntax mistakes the type checker won't).

Manually: `npm run dev:sandbox` after `npm run build`, open `http://localhost:3000/catalogue`, find a sold-out product, click "Me notifier du réapprovisionnement", enter a phone number, submit — confirm the same success message appears as before (behavior unchanged, just relocated).

- [ ] **Step 4: Commit**

```bash
git add src/components/Layout.tsx src/pages/catalogue.tsx
git commit -m "refactor: move stock-alert notification to a global Layout helper"
```

---

## Task 2: Extract `CartModal` into a shared component

**Files:**
- Create: `src/components/CartModal.tsx`
- Modify: `src/pages/catalogue.tsx`

**Interfaces:**
- Produces: `<CartModal />` (no props) — renders the floating cart button, the `#cart-modal` dialog, and defines the globals `addToCart(productId: number, quantity: number)`, `openCartModal()`, `closeCartModal()`, `updateCartBadge()`, `renderCartModal()`, `cartQty(id: number, delta: number)`, `cartRemove(id: number)`, `clearCart()`, `validateCart()`. Reads/writes `localStorage['maasga_cart']`. `validateCart()` calls `openCartOrderModal()`, which is defined by `OrderModal` (Task 3) — both components must be present on any page that uses one of them for cart checkout to work.
- Consumes: `window.__CAT_PRODUCTS__` (optional — `cartQty` uses it only to cap quantity at the product's real stock; falls back to a cap of 99 if the product isn't found, so this never throws).

- [ ] **Step 1: Create `src/components/CartModal.tsx`**

```tsx
export const CartModal = () => {
  return (
    <>
      {/* Bouton panier flottant */}
      <button onclick="openCartModal()" class="fixed bottom-6 right-6 z-40 flex items-center space-x-2 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm text-white transition-all hover:scale-105" style="background:linear-gradient(135deg,#0ea5e9,#3b82f6); border:2px solid rgba(255,255,255,0.15);">
        <i class="fas fa-shopping-cart text-lg"></i>
        <span>Mon panier</span>
        <span id="cart-count-badge" class="hidden ml-1 bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black">0</span>
      </button>

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

      <script dangerouslySetInnerHTML={{ __html: `
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

        // Initialiser le badge au chargement
        updateCartBadge();
      `}} />
    </>
  )
}
```

- [ ] **Step 2: Remove the floating cart button from `catalogue.tsx` and replace with `<CartModal />`**

In `src/pages/catalogue.tsx`, add the import near the top (after the existing `products`/`quartiers` imports):

```tsx
import { CartModal } from '../components/CartModal'
```

Find:

```tsx
      {/* Bouton panier flottant */}
      <button onclick="openCartModal()" class="fixed bottom-6 right-6 z-40 flex items-center space-x-2 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm text-white transition-all hover:scale-105" style="background:linear-gradient(135deg,#0ea5e9,#3b82f6); border:2px solid rgba(255,255,255,0.15);">
        <i class="fas fa-shopping-cart text-lg"></i>
        <span>Mon panier</span>
        <span id="cart-count-badge" class="hidden ml-1 bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black">0</span>
      </button>
```

Replace with:

```tsx
      <CartModal />
```

- [ ] **Step 3: Remove the old `#cart-modal` block from `catalogue.tsx`**

Find the block starting with the comment `{/* ===== MODAL PANIER ===== */}` and the `<div id="cart-modal" ...>` through its closing `</div>` (this is the block now duplicated verbatim inside `CartModal.tsx` — the header `{/* ===== MODAL PANIER ===== */}` down to the matching closing `</div>` right before `{/* Modal Commande / Checkout */}`). Delete the entire block.

- [ ] **Step 4: Remove the now-duplicated cart JS from `catalogue.tsx`'s big inline `<script>`**

Delete these functions from the script block (they now live only in `CartModal.tsx`): `addToCart`, `openCartModal`, `closeCartModal` (plus its `cart-modal` click-outside listener), `updateCartBadge`, `renderCartModal`, `cartQty`, `cartRemove`, `clearCart`, `validateCart`, and the trailing `// Initialiser le badge au chargement\nupdateCartBadge();` call. Also delete the now-orphaned comment `// Gestion du panier (localStorage)` and the `updateQty` function directly below it — `updateQty` only existed to drive the old product-detail modal's quantity stepper (`#modal-qty-input`), which is being removed in Task 4; it has no other caller.

Leave everything else in the script block untouched for now (order-modal functions are removed in Task 3; `__CAT_PRODUCTS__`, the Escape handler, `restorePendingOrder`, `openProductDetail`, and the filtering IIFE are all handled in later tasks).

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npm run build` — expect success.

Manually: `npm run dev:sandbox`, open `/catalogue`, add a product to the cart, open the cart modal (floating button bottom-right), change quantity, remove an item, clear the cart — confirm identical behavior to before the refactor.

- [ ] **Step 6: Commit**

```bash
git add src/components/CartModal.tsx src/pages/catalogue.tsx
git commit -m "refactor: extract cart modal into a shared CartModal component"
```

---

## Task 3: Extract `OrderModal` into a shared component

**Files:**
- Create: `src/components/OrderModal.tsx`
- Modify: `src/pages/catalogue.tsx`

**Interfaces:**
- Produces: `<OrderModal redirectTarget={string} />` — `redirectTarget` is the path (without leading slash) to send the user back to after a forced login, e.g. `"catalogue"` or `` `catalogue/${id}` ``. Renders the `#order-modal` dialog and defines the globals `openOrderModal(productId: number)`, `openCartOrderModal()`, `closeOrderModal()`, `resetOrderModal()`, `checkSessionAndUpdateUI()`, `prefillOrderForm()`, `submitOrder()`, `requestOrderLocation()`, `createAccountAfterOrder()`, `skipAccountCreation()`, `toggleRegisterPwd()`. Also runs the "restore pending order after login" logic on load.
- Consumes: `window.__CAT_PRODUCTS__` (to look up product name/price for the order summary and notes), `window.showToast`/`window.trapFocus`/`window.releaseFocus` (global, from `Layout.tsx`), and — only when the order context is `'cart'` (i.e. checkout was triggered via `validateCart()`) — the global `updateCartBadge()` function from `CartModal`. Any page using `<OrderModal />` for single-product ordering only (not cart checkout) does not strictly need `<CartModal />` present, but this codebase's pages that need "Commander" also want "Ajouter au panier", so in practice both are always used together (see Task 5).

- [ ] **Step 1: Create `src/components/OrderModal.tsx`**

```tsx
import { quartiersByArrondissement } from '../data/quartiers'

export const OrderModal = ({ redirectTarget }: { redirectTarget: string }) => {
  return (
    <>
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

            {/* Méthodes de paiement */}
            <div>
              <label class="block text-sm font-semibold mb-3" style="color:#03045e;">
                <i class="fas fa-wallet mr-1" style="color:#0077b6;"></i>Mode de paiement
              </label>

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
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

              <div id="order-pay-detail-a_confirmer" class="order-pay-detail rounded-xl p-4 mt-2" style="background:rgba(0,119,182,0.03); border:1px solid rgba(0,119,182,0.1);">
                <div class="flex items-center gap-2 mb-2">
                  <i class="fas fa-info-circle text-sm" style="color:#0077b6;"></i>
                  <span class="text-sm font-bold" style="color:#03045e;">Confirmation téléphonique</span>
                </div>
                <p class="text-xs leading-relaxed" style="color:#64748b;">
                  Un conseiller MAASGA vous contactera sous 2h pour confirmer votre commande et convenir du mode de paiement.
                </p>
              </div>

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

        // ===== PANNEAUX DYNAMIQUES PAIEMENT (modal commande) =====
        function showOrderPayDetail(method) {
          document.querySelectorAll('.order-pay-detail').forEach(function(el) { el.style.display = 'none'; });
          var panel = document.getElementById('order-pay-detail-' + method);
          if (panel) {
            panel.style.display = 'block';
            panel.style.animation = 'fadeSlideIn 0.25s ease forwards';
          }
        }
        showOrderPayDetail('a_confirmer');
        document.querySelectorAll('input[name="order-payment"]').forEach(function(r) {
          r.addEventListener('change', function() { showOrderPayDetail(this.value); });
        });
        var _ocn = document.getElementById('order-card-number');
        if (_ocn) _ocn.addEventListener('input', function() { var v=this.value.replace(/\\D/g,'').substring(0,16); this.value=v.replace(/(\\d{4})(?=\\d)/g,'$1 '); });
        var _oce = document.getElementById('order-card-expiry');
        if (_oce) _oce.addEventListener('input', function() { var v=this.value.replace(/\\D/g,'').substring(0,4); if(v.length>=3) v=v.substring(0,2)+' / '+v.substring(2); this.value=v; });
        var _ocv = document.getElementById('order-card-cvv');
        if (_ocv) _ocv.addEventListener('input', function() { this.value=this.value.replace(/\\D/g,'').substring(0,4); });

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
          const paymentRadio = document.querySelector('input[name="order-payment"]:checked');
          const paymentMethod = paymentRadio ? paymentRadio.value : null;

          if (!name || !phone) {
            showToast('Merci de renseigner votre nom et votre téléphone.', 'warning');
            return;
          }

          if (paymentMethod && paymentMethod !== 'a_confirmer') {
            try {
              const sessionData = __SESSION_CHECKED__ && __SESSION_DATA__ ? __SESSION_DATA__ : await checkSessionAndUpdateUI();
              if (!sessionData || !sessionData.loggedIn) {
                try {
                  const pendingOrder = {
                    name, phone, quartier, email, notes, paymentMethod,
                    context: window.__ORDER_CONTEXT__ || {},
                    timestamp: Date.now()
                  };
                  localStorage.setItem('maasga_pending_order', JSON.stringify(pendingOrder));
                } catch(e) {}
                showToast('Veuillez vous connecter avant de procéder au paiement.', 'warning');
                setTimeout(() => { window.location.href = '/espace-client?redirect=${redirectTarget}'; }, 1500);
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
      `}} />
    </>
  )
}
```

Note the one behavioral change from the original: the hardcoded `/espace-client?redirect=catalogue` inside `submitOrder` is now `` `/espace-client?redirect=${redirectTarget}` `` — a JS template literal built at **server render time** (it's inside the outer `dangerouslySetInnerHTML` template string, so `${redirectTarget}` is substituted by TSX before the string ever reaches the browser, same mechanism the original file already uses for `window.__CAT_PRODUCTS__`).

- [ ] **Step 2: Wire `OrderModal` into `catalogue.tsx`**

Add the import:

```tsx
import { OrderModal } from '../components/OrderModal'
```

Find the old `{/* Modal Commande / Checkout */}` block (the `<div id="order-modal" ...>` through its matching closing `</div>`, identical to the HTML now inside `OrderModal.tsx`) and delete it, replacing it with:

```tsx
      <OrderModal redirectTarget="catalogue" />
```

Place this line right after `<CartModal />` (from Task 2).

- [ ] **Step 3: Remove the now-duplicated order JS from `catalogue.tsx`'s inline `<script>`**

Delete from the script block: the `restorePendingOrder` IIFE, `showOrderPayDetail` + its initial call + the payment-method-change listeners + the three card-formatting `addEventListener` calls, `__ORDER_GPS__`, `requestOrderLocation`, `openOrderModal`, `openCartOrderModal`, `closeOrderModal` (and its `order-modal` click-outside listener), `resetOrderModal`, `__SESSION_DATA__`/`__SESSION_CHECKED__`, `checkSessionAndUpdateUI`, `prefillOrderForm`, `submitOrder`, `createAccountAfterOrder`, `skipAccountCreation`, `toggleRegisterPwd`.

What remains in `catalogue.tsx`'s script after Tasks 1–3: the `window.__CAT_PRODUCTS__` assignment, `TECH_LABELS`, the global Escape-key handler, `openProductDetail`, the `esc()` helper, and the client-side instant filtering IIFE at the bottom. (`TECH_LABELS`, `openProductDetail`, and `esc()` are removed in Task 4.)

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npm run build` — expect success.

Manually: `npm run dev:sandbox`, open `/catalogue`, click "Commander" on an in-stock product, fill the form, submit with the default "Téléphone" payment method — confirm the success screen appears. Then test the login-required path: select "LigdiCash", fill the form, submit while logged out — confirm you're redirected to `/espace-client?redirect=catalogue` (check the URL bar) and that, after logging in, `restorePendingOrder` reopens the order modal with the form refilled.

- [ ] **Step 5: Commit**

```bash
git add src/components/OrderModal.tsx src/pages/catalogue.tsx
git commit -m "refactor: extract order/checkout modal into a shared OrderModal component"
```

---

## Task 4: Remove the old product-detail modal from `catalogue.tsx` and switch cards to real links

**Files:**
- Modify: `src/pages/catalogue.tsx`

**Interfaces:**
- Produces: card images now carry an inline `style` with `view-transition-name: product-image-{id}` for the transition in Task 7. The two "Voir les détails" buttons become `<a href={'/catalogue/' + p.id}>` links.

- [ ] **Step 1: Delete the old `#product-detail-modal` HTML block**

Find the block starting with the comment `{/* Modal Détail Produit */}` and the `<div id="product-detail-modal" ...>` through its matching closing `</div>` (right before `{/* ===== MODAL PANIER ===== */}` was — now before `<CartModal />` usage). Delete the entire block.

- [ ] **Step 2: Delete `openProductDetail`, its `esc()` helper, `TECH_LABELS`, and the modal's click-outside listener from the script block**

Delete the `esc()` helper function, the `openProductDetail(id)` function (the large one that fills in `#modal-*` elements), the `TECH_LABELS` object, and the `document.getElementById('product-detail-modal').addEventListener('click', ...)` block right after it.

- [ ] **Step 3: Trim the Escape-key handler's modal list**

Find:

```js
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
```

Replace with:

```js
        // Global Escape key handler for all modals
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            var modals = ['cart-modal', 'order-modal', 'compare-modal'];
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
```

- [ ] **Step 4: Change both "Voir les détails" buttons to links, and add the transition name to the card image**

Find (in-stock branch):

```tsx
                          <button onclick={`openProductDetail(${p.id})`} class="w-full font-semibold py-2 rounded-xl flex items-center justify-center space-x-2 text-sm transition-colors" style="background:rgba(56,189,248,0.1); color:#38bdf8; border:1px solid rgba(56,189,248,0.25);">
                            <i class="fas fa-info-circle text-xs"></i>
                            <span>Voir les détails</span>
                          </button>
```

Replace with:

```tsx
                          <a href={`/catalogue/${p.id}`} class="w-full font-semibold py-2 rounded-xl flex items-center justify-center space-x-2 text-sm transition-colors" style="background:rgba(56,189,248,0.1); color:#38bdf8; border:1px solid rgba(56,189,248,0.25);">
                            <i class="fas fa-info-circle text-xs"></i>
                            <span>Voir les détails</span>
                          </a>
```

Find (rupture branch):

```tsx
                          <button onclick={`openProductDetail(${p.id})`} class="w-full font-semibold py-2 rounded-xl flex items-center justify-center space-x-2 text-sm transition-colors" style="background:rgba(56,189,248,0.08); color:#38bdf8; border:1px solid rgba(56,189,248,0.2);">
                            <i class="fas fa-info-circle text-xs"></i>
                            <span>Voir les détails</span>
                          </button>
```

Replace with:

```tsx
                          <a href={`/catalogue/${p.id}`} class="w-full font-semibold py-2 rounded-xl flex items-center justify-center space-x-2 text-sm transition-colors" style="background:rgba(56,189,248,0.08); color:#38bdf8; border:1px solid rgba(56,189,248,0.2);">
                            <i class="fas fa-info-circle text-xs"></i>
                            <span>Voir les détails</span>
                          </a>
```

Find the card image block:

```tsx
                      {(p as any).imageUrl
                        ? <img src={(p as any).imageUrl} alt={p.name} class="w-32 h-32 object-contain mx-auto mb-2" loading="lazy" />
                        : <img src="/static/ac-placeholder.svg" alt={p.name} class="w-32 h-32 object-contain mx-auto mb-2" loading="lazy" />
                      }
```

Replace with:

```tsx
                      {(p as any).imageUrl
                        ? <img src={(p as any).imageUrl} alt={p.name} style={`view-transition-name: product-image-${p.id}`} class="w-32 h-32 object-contain mx-auto mb-2" loading="lazy" />
                        : <img src="/static/ac-placeholder.svg" alt={p.name} style={`view-transition-name: product-image-${p.id}`} class="w-32 h-32 object-contain mx-auto mb-2" loading="lazy" />
                      }
```

- [ ] **Step 5: Create the shared tech-spec labels module**

Create `src/data/techSpecLabels.ts` (this replaces the client-only `TECH_LABELS` object deleted in Step 2, as a server-usable TypeScript module for the new product page in Task 5):

```ts
export const TECH_SPEC_LABELS: Record<string, string> = {
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
}
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npm run build` — expect success.

Manually: `npm run dev:sandbox`, open `/catalogue`, click "Voir les détails" on any product — confirm it now performs a full page navigation to `/catalogue/{id}` (which 404s/redirects until Task 6 adds the route — that's expected at this point in the plan). Confirm the catalogue grid, filters, cart, and order flow all still work exactly as before.

- [ ] **Step 7: Commit**

```bash
git add src/pages/catalogue.tsx src/data/techSpecLabels.ts
git commit -m "refactor: remove product-detail modal from catalogue, link to dedicated product page"
```

---

## Task 5: Create the `ProductDetailPage`

**Files:**
- Create: `src/pages/produit.tsx`

**Interfaces:**
- Produces: `ProductDetailPage({ product }: { product: Product })` — a full SSR page using `Layout`, `CartModal`, and `OrderModal`.
- Consumes: `Product` type from `../data/products`, `TECH_SPEC_LABELS` from `../data/techSpecLabels`, `CartModal` from `../components/CartModal`, `OrderModal` from `../components/OrderModal`, `Layout` from `../components/Layout`. Relies on the global `window.submitStockAlert` (Task 1), `window.showToast`/`window.trapFocus`/`window.releaseFocus` (already global via `Layout.tsx`), and the global `addToCart`/`openOrderModal` functions provided by `CartModal`/`OrderModal`.

- [ ] **Step 1: Create `src/pages/produit.tsx`**

```tsx
import { Layout } from '../components/Layout'
import { CartModal } from '../components/CartModal'
import { OrderModal } from '../components/OrderModal'
import { TECH_SPEC_LABELS } from '../data/techSpecLabels'
import type { Product } from '../data/products'

const CV_MAP: Record<number, number> = { 9000: 1, 12000: 1.5, 18000: 2, 24000: 3, 36000: 5 }

export const ProductDetailPage = ({ product: p }: { product: Product }) => {
  const inStock = p.stock > 0 && p.available
  const stockLabel = p.stock > 3 ? '✓ Disponible' : p.stock > 0 ? '⚠ Stock limité' : '✗ Rupture'
  const stockStyle = p.stock > 3
    ? 'background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.25);'
    : p.stock > 0
      ? 'background:rgba(245,158,11,0.15); color:#fbbf24; border:1px solid rgba(245,158,11,0.25);'
      : 'background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.25);'
  const imageUrl = (p as any).imageUrl || '/static/ac-placeholder.svg'
  const metaDescription = p.description
    ? p.description.slice(0, 155)
    : `Climatiseur ${p.name} — ${p.brand}, ${p.btu.toLocaleString()} BTU. Prix, fiche technique, commande en ligne à Ouagadougou.`

  return (
    <Layout
      title={`${p.name} — MAASGA Ouagadougou`}
      activePage="catalogue"
      canonicalPath={`/catalogue/${p.id}`}
      description={metaDescription}
    >
      <section class="gradient-hero py-8 text-white relative overflow-hidden">
        <div class="glow-dot w-72 h-72 top-0 right-0" style="background:rgba(14,165,233,0.1);"></div>
        <div class="max-w-5xl mx-auto px-4 relative z-10">
          <a href="/catalogue" class="inline-flex items-center space-x-2 text-sm font-semibold" style="color:#bae6fd;">
            <i class="fas fa-arrow-left"></i>
            <span>Retour au catalogue</span>
          </a>
        </div>
      </section>

      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image */}
          <div class="glass-card rounded-2xl p-8 flex items-center justify-center" style="background:linear-gradient(145deg,#e8f2ff,#f0f7ff); min-height:320px;">
            <img
              src={imageUrl}
              alt={p.name}
              style={`view-transition-name: product-image-${p.id}; max-height:280px; max-width:100%; width:auto; object-fit:contain;`}
              loading="eager"
            />
          </div>

          {/* Info */}
          <div>
            <div class="text-xs font-bold uppercase tracking-wider mb-1" style="color:#38bdf8;">{p.brand}</div>
            <h1 class="font-bold text-white text-2xl mb-1 leading-tight">{p.name}</h1>
            <p class="text-sm mb-4" style="color:#64748b;">Réf: {p.model}</p>

            <div class="flex flex-wrap gap-2 mb-5">
              {p.inverter && (
                <span class="text-xs text-white px-2 py-1 rounded-lg font-semibold" style="background:linear-gradient(135deg,#0ea5e9,#3b82f6);">INVERTER</span>
              )}
              <span class="text-xs px-2 py-1 rounded-lg font-medium" style="background:rgba(56,189,248,0.1); color:#38bdf8;">{p.energy_class}</span>
              {p.warranty && (
                <span class="text-xs px-2 py-1 rounded-lg font-medium" style="background:rgba(52,211,153,0.1); color:#34d399;">{p.warranty}</span>
              )}
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div class="rounded-lg px-2 py-2 text-center" style="background:rgba(56,189,248,0.07); border:1px solid rgba(56,189,248,0.15);">
                <div class="text-xs font-medium" style="color:#38bdf8;">Puissance</div>
                <div class="text-sm font-bold text-white">{p.btu.toLocaleString()} BTU</div>
                <div class="text-xs" style="color:#38bdf8;">{CV_MAP[p.btu] || 1} CV</div>
              </div>
              <div class="rounded-lg px-2 py-2 text-center" style="background:rgba(52,211,153,0.07); border:1px solid rgba(52,211,153,0.15);">
                <div class="text-xs font-medium" style="color:#34d399;">Surface</div>
                <div class="text-sm font-bold text-white">{p.surface_min}-{p.surface_max} m²</div>
              </div>
              <div class="rounded-lg px-2 py-2 text-center" style="background:rgba(139,92,246,0.07); border:1px solid rgba(139,92,246,0.15);">
                <div class="text-xs font-medium" style="color:#a78bfa;">Énergie</div>
                <div class="text-sm font-bold text-white">{p.energy_class}</div>
              </div>
              <div class="rounded-lg px-2 py-2 text-center" style={stockStyle}>
                <div class="text-xs font-medium">Stock</div>
                <div class="text-sm font-bold">{stockLabel}</div>
              </div>
            </div>

            <div class="pt-4 mb-5" style="border-top:1px solid rgba(56,189,248,0.1);">
              <div class="text-2xl font-bold text-white">{p.price.toLocaleString()} <span class="text-sm" style="color:#8ba3c0;">FCFA</span></div>
              <div class="text-xs font-semibold" style="color:#34d399;">Installation et livraison offerte</div>
            </div>

            {inStock ? (
              <div class="space-y-3">
                <div class="flex items-center space-x-3 p-3 rounded-xl" style="background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.25);">
                  <label class="text-sm font-semibold" style="color:#03045e;">Quantité</label>
                  <div class="flex items-center space-x-3 ml-auto">
                    <button type="button" onclick="pdpUpdateQty(-1)" class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(56,189,248,0.15); color:#38bdf8; font-weight:bold;">−</button>
                    <input type="number" id="pdp-qty-input" value="1" min="1" max={String(p.stock)} class="w-12 text-center font-bold rounded-lg" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.2); color:#111827; padding:6px;" />
                    <button type="button" onclick="pdpUpdateQty(1)" class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(56,189,248,0.15); color:#38bdf8; font-weight:bold;">+</button>
                  </div>
                </div>
                <div class="flex gap-3">
                  <button type="button" onclick={`addToCart(${p.id}, parseInt(document.getElementById('pdp-qty-input').value))`} class="flex-1 btn-primary text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 text-sm">
                    <i class="fas fa-shopping-cart"></i>
                    <span>Ajouter au panier</span>
                  </button>
                  <button type="button" onclick={`openOrderModal(${p.id})`} class="flex-1 font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 text-sm" style="background:rgba(56,189,248,0.1); color:#38bdf8; border:1px solid rgba(56,189,248,0.25);">
                    <i class="fas fa-shopping-bag"></i>
                    <span>Commander</span>
                  </button>
                </div>
              </div>
            ) : (
              <div class="space-y-2">
                <div class="w-full font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 text-sm" style="background:rgba(255,255,255,0.05); color:#64748b; border:1px solid rgba(255,255,255,0.08);">
                  <i class="fas fa-ban text-xs"></i>
                  <span>Rupture de stock</span>
                </div>
                <button type="button" onclick={`document.getElementById('stock-form-${p.id}').classList.toggle('hidden')`} class="w-full flex items-center justify-center space-x-2 text-xs py-2 rounded-lg" style="color:#38bdf8; background:rgba(56,189,248,0.05);">
                  <i class="fas fa-bell"></i>
                  <span>Me notifier du réapprovisionnement</span>
                </button>
                <div id={`stock-form-${p.id}`} class="hidden mt-2 flex gap-2">
                  <input type="tel" id={`stock-phone-${p.id}`} placeholder="Ex: 55 99 64 18" class="flex-1 text-xs px-3 py-2 rounded-lg" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.2); color:#03045e;" />
                  <button type="button" onclick={`submitStockAlert(${p.id})`} class="text-xs px-3 py-2 rounded-lg font-semibold" style="background:rgba(16,185,129,0.1); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
                    <i class="fas fa-check"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {p.description && (
          <div class="glass-card rounded-2xl p-6 mt-8">
            <h2 class="text-sm font-bold mb-2 text-white">Description</h2>
            <p class="text-sm leading-relaxed" style="color:#8ba3c0;">{p.description}</p>
          </div>
        )}

        {p.features && p.features.length > 0 && (
          <div class="glass-card rounded-2xl p-6 mt-6">
            <h2 class="text-sm font-bold mb-3 text-white">Fonctionnalités</h2>
            <div class="flex flex-wrap gap-2">
              {p.features.map(f => (
                <span class="text-xs px-3 py-1 rounded-full" style="background:rgba(56,189,248,0.08); color:#38bdf8; border:1px solid rgba(56,189,248,0.15);">{f}</span>
              ))}
            </div>
          </div>
        )}

        {p.techSpecs && Object.keys(p.techSpecs).length > 0 && (
          <div class="glass-card rounded-2xl p-6 mt-6">
            <h2 class="text-sm font-bold mb-3 text-white"><i class="fas fa-microchip mr-2" style="color:#38bdf8;"></i>Caractéristiques techniques</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(p.techSpecs).map(([k, v]) => (
                <div class="flex justify-between items-center px-3 py-2 rounded-lg" style="background:rgba(56,189,248,0.04); border:1px solid rgba(56,189,248,0.1);">
                  <span class="text-xs" style="color:#8ba3c0;">{TECH_SPEC_LABELS[k] || k}</span>
                  <span class="text-xs font-semibold text-white">{v ?? ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {p.media && p.media.length > 0 && (
          <div class="glass-card rounded-2xl p-6 mt-6">
            <h2 class="text-sm font-bold mb-3 text-white"><i class="fas fa-image mr-2" style="color:#38bdf8;"></i>Galerie</h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {p.media.map(m => (
                m.type === 'image'
                  ? <img src={m.url} alt={m.caption || p.name} class="w-full aspect-video object-cover rounded-xl" loading="lazy" />
                  : <video src={m.url} class="w-full aspect-video object-cover rounded-xl" controls></video>
              ))}
            </div>
          </div>
        )}
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        window.__CAT_PRODUCTS__ = ${JSON.stringify([{
          id: p.id, name: p.name, brand: p.brand, model: p.model,
          btu: p.btu, price: p.price, stock: p.stock, energy_class: p.energy_class,
          surface_min: p.surface_min, surface_max: p.surface_max,
          description: p.description, features: p.features,
          inverter: p.inverter, available: p.available,
          image: p.image, imageUrl: (p as any).imageUrl || '',
          warranty: (p as any).warranty || '',
          techSpecs: p.techSpecs || null,
          media: p.media || []
        }]).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\\//g, '\\u002f')};

        function pdpUpdateQty(delta) {
          var input = document.getElementById('pdp-qty-input');
          var newVal = parseInt(input.value || '1') + delta;
          var max = parseInt(input.max || '99');
          if (newVal >= 1 && newVal <= max) input.value = String(newVal);
        }

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
      `}} />

      <CartModal />
      <OrderModal redirectTarget={`catalogue/${p.id}`} />
    </Layout>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` — expect no errors (this is the first real type-check of the new file — pay attention to `Product`/`TechSpecs`/`MediaItem` field access matching `src/data/products.ts`).

Run: `npm run build` — expect success.

This page isn't reachable yet (no route wired) — full manual verification happens after Task 6.

- [ ] **Step 3: Commit**

```bash
git add src/pages/produit.tsx
git commit -m "feat: add ProductDetailPage for catalogue product detail view"
```

---

## Task 6: Wire the `/catalogue/:id` route

**Files:**
- Modify: `src/index.tsx`

**Interfaces:**
- Produces: `GET /catalogue/:id` — renders `ProductDetailPage` for a valid product id, otherwise redirects to `/catalogue?error=produit_introuvable`.

- [ ] **Step 1: Import `ProductDetailPage`**

In `src/index.tsx`, find:

```ts
import { CataloguePage } from './pages/catalogue'
```

Replace with:

```ts
import { CataloguePage } from './pages/catalogue'
import { ProductDetailPage } from './pages/produit'
```

- [ ] **Step 2: Add the route**

Find:

```ts
app.get('/catalogue', (c) => {
  const brand = c.req.query('brand')
  const btu = c.req.query('btu')
  const inverter = c.req.query('inverter')
  const available = c.req.query('available')
  const product = c.req.query('product')
  const page = Math.max(1, parseInt(c.req.query('page') || '1') || 1)
  return c.html(<CataloguePage filters={{ brand, btu, inverter, available, product }} page={page} />)
})
```

Replace with:

```ts
app.get('/catalogue', (c) => {
  const brand = c.req.query('brand')
  const btu = c.req.query('btu')
  const inverter = c.req.query('inverter')
  const available = c.req.query('available')
  const product = c.req.query('product')
  const page = Math.max(1, parseInt(c.req.query('page') || '1') || 1)
  return c.html(<CataloguePage filters={{ brand, btu, inverter, available, product }} page={page} />)
})

app.get('/catalogue/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  const product = products.find(p => p.id === id)
  if (!Number.isFinite(id) || !product) return c.redirect('/catalogue?error=produit_introuvable')
  return c.html(<ProductDetailPage product={product} />)
})
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npm run build` — expect success.

Manually: `npm run dev:sandbox`, then:
- Visit `/catalogue`, click "Voir les détails" on an in-stock product — confirm you land on `/catalogue/{id}` with the full product detail page (image, specs, price, description, features, tech specs).
- On that page, click "Ajouter au panier" — confirm the floating cart badge updates.
- Click "Commander" — confirm the order modal opens and a test submission with the "Téléphone" payment method succeeds.
- Visit a sold-out product's detail page — confirm "Rupture de stock" and the notify-me form appear, and that submitting it works (reuses `window.submitStockAlert` from Task 1).
- Visit `/catalogue/999999` (an id that doesn't exist) — confirm you're redirected to `/catalogue?error=produit_introuvable`.
- Click "Retour au catalogue" from a product page — confirm it goes back to `/catalogue`.

- [ ] **Step 4: Commit**

```bash
git add src/index.tsx
git commit -m "feat: add GET /catalogue/:id route for product detail pages"
```

---

## Task 7: Add the View Transitions CSS and verify the morph effect

**Files:**
- Modify: `src/styles/app.css`

**Interfaces:**
- Produces: navigating from a catalogue card to its product page (and back) morphs the shared product image, in browsers that support cross-document View Transitions (Chrome/Edge 126+ at time of writing). No JS is added by this task.

- [ ] **Step 1: Add the `@view-transition` rule**

In `src/styles/app.css`, add near the top of the file (after the `:root` design-token block, before the first `@layer`/utility rules — anywhere at the top level works since this is a top-level at-rule, not scoped to a selector):

```css
/* ─── View Transitions : morph de l'image produit entre catalogue et fiche produit ─── */
@view-transition {
  navigation: auto;
}
```

- [ ] **Step 2: Disable the transition duration under `prefers-reduced-motion`**

Find the existing reduced-motion block:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
  html.js-ready [data-reveal],
  html.js-ready [data-stagger] > *,
  html.js-ready [data-hero] > * {
    opacity: 1 !important;
    transform: none !important;
  }
  .float, .animate-pulse-slow, .shimmer, .animate-bounce { animation: none !important; }
}
```

Replace with:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0.001ms !important;
  }
  html.js-ready [data-reveal],
  html.js-ready [data-stagger] > *,
  html.js-ready [data-hero] > * {
    opacity: 1 !important;
    transform: none !important;
  }
  .float, .animate-pulse-slow, .shimmer, .animate-bounce { animation: none !important; }
}
```

(`::view-transition-*` are top-layer pseudo-elements, not matched by `*, *::before, *::after`, so they need to be listed explicitly — this is why the generic reduced-motion rule above it doesn't already cover them.)

- [ ] **Step 3: Rebuild CSS**

Run: `npm run build:css`
Expected: exits 0, `public/static/tailwind.css` is regenerated (this file must be rebuilt any time `app.css` changes — the dev server does not do this automatically, per `CLAUDE.md`).

- [ ] **Step 4: Verify the transition in a browser (Chrome or Edge)**

Run: `npm run build && npm run dev:sandbox` (wrangler sandbox serves the built `dist/`, more reliable for this than the Vite dev server per `CLAUDE.md`'s local-dev notes).

Open `http://localhost:3000/catalogue` in Chrome or Edge (this must be a real browser check — the effect only exists on real navigation, cannot be verified via `curl` or a type-check):
- Click "Voir les détails" on a product card — confirm the product image visibly morphs/grows smoothly from its card position/size into its full position/size on the product page, instead of an abrupt page flash.
- Click "Retour au catalogue" — confirm the reverse morph happens on the way back.
- Open Chrome DevTools → Rendering → enable "Emulate CSS media feature prefers-reduced-motion: reduce", reload, repeat the navigation — confirm the page navigates instantly with no visible morph (but still navigates correctly).
- If Firefox or Safari is available, repeat the catalogue→product click — confirm it's a normal instant navigation with no error in the console and no broken layout (graceful degradation, no `@view-transition` support).

- [ ] **Step 5: Full regression pass**

Since this plan touched shared components used across the whole catalogue flow, do one more full pass on `/catalogue` itself: filters (brand/BTU/inverter/availability), pagination, "Comparer" (select 2-3 products, open comparison modal), cart (add/remove/change quantity), and a full order submission — confirm nothing regressed from the original single-file `catalogue.tsx`.

- [ ] **Step 6: Commit**

```bash
git add src/styles/app.css public/static/tailwind.css
git commit -m "feat: add native View Transitions for catalogue product image morph"
```

---

## Self-Review Notes

- **Spec coverage:** every decision in `docs/superpowers/specs/2026-07-04-catalogue-product-pages-view-transitions-design.md` maps to a task — route/URL scheme (Task 6), modal removal + link switch (Task 4), shared order flow via extraction (Tasks 2-3), panier kept / comparer dropped on the product page (Task 5), image-only `view-transition-name` (Tasks 4 & 5), CSS-only native transition with reduced-motion override (Task 7), `TECH_LABELS` moved server-side (Task 4 Step 5).
- **Placeholder scan:** no TBD/TODO left; every step has literal code or an exact manual-check script.
- **Type consistency:** `OrderModal`'s prop is `redirectTarget: string` everywhere it's declared and consumed (catalogue.tsx passes `"catalogue"`, produit.tsx passes `` `catalogue/${p.id}` ``); `CartModal`/`OrderModal` both take no other props; `ProductDetailPage`'s prop is `{ product: Product }` matching the `Product` type exported from `src/data/products.ts`, consumed identically by the new route in `src/index.tsx`.
- **Out of scope carried over from the design doc, intentionally not tasked here:** sitemap.xml entries per product, edge caching for `/catalogue/:id`, and the separate (still unbuilt) fetch+swap page-transition pipeline.
