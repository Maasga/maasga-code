// Admin Tab Component
import { products } from '../../../data/products'
import {
  reviews,
  appointments,
  orders,
  clients,
  maintenanceDueCount,
  pendingMaintenanceContractsCount,
  pendingMaintenanceRequestsCount,
  pendingMaintenanceContracts,
  notifications
} from '../../../data/store'
import { SITE_URL } from '../../../types'
import { LIBELLES_CHAMPS, COLONNES_MODELE, CATEGORIES, MAX_LIGNES_PAR_LOT } from '../../../utils/importProduits'
import { useAdminCommandesData } from '../../../hooks/useAdminCommandesData'
import { useAdminMaintenanceData } from '../../../hooks/useAdminMaintenanceData'
import { CommandesTable } from '../CommandesTable'
import { CommandesKPIs } from '../CommandesKPIs'
import { CommandesProcessDiagram } from '../CommandesProcessDiagram'
import { OrderDetailModal } from '../OrderDetailModal'
import { BulkActionsToolbar } from '../BulkActionsToolbar'
import { AdminLayout, jsonForScript, jsAttr, CLIENT_ESC_HELPER } from '../AdminLayout'

export const AdminProduitsPage = ({ success, deleted }: { success?: string; deleted?: string }) => (
  <AdminLayout activePage="produits">
    {(success || deleted) && (
      <div class={`mb-6 rounded-xl p-4 flex items-center space-x-2 ${success ? 'border' : 'border'}`} style={success ? 'background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.3);' : 'background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.3);'}>
        <i class={`fas ${success ? 'fa-check-circle text-green-400' : 'fa-trash text-red-400'}`}></i>
        <span class={`font-medium text-sm ${success ? 'text-green-300' : 'text-red-300'}`}>
          {success ? 'Stock mis à jour avec succès.' : 'Produit supprimé.'}
        </span>
      </div>
    )}

    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 class="text-xl font-bold" style="color:var(--admin-text-primary)">Gestion des produits</h2>
        <p class="text-sm mt-1" style="color:var(--admin-text-muted)">{products.length} produits au catalogue · {products.filter(p => p.available && p.stock > 0).length} disponibles</p>
      </div>
      <div class="flex items-center gap-2">
        <button id="btn-ouvrir-import-masse"
          class="inline-flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-2.5 text-sm font-medium text-purple-300 hover:bg-purple-500/20 transition-colors">
          <i class="fas fa-file-import"></i>
          <span class="hidden sm:inline">Importer en masse</span>
          <span class="sm:hidden">Importer</span>
        </button>
        <button onclick="document.getElementById('add-product-modal').classList.remove('hidden')"
          class="btn-primary font-semibold px-5 py-2.5 rounded-xl flex items-center space-x-2 text-sm shadow-md">
          <i class="fas fa-plus"></i>
          <span class="hidden sm:inline">Ajouter un produit</span>
          <span class="sm:hidden">Ajouter</span>
        </button>
      </div>
    </div>

    {/* ===== MÉDIATHÈQUE CENTRALISÉE PAR MARQUE ===== */}
    <div class="mb-6 rounded-2xl card-shadow overflow-hidden" style="background:var(--admin-card-bg); border:1px solid rgba(168,85,247,0.2);">
      <button type="button" onclick="toggleMediatheque()"
        class="w-full flex items-center justify-between px-5 py-4 text-left">
        <div class="flex items-center gap-3">
          <i class="fas fa-photo-video text-purple-400"></i>
          <span class="font-semibold text-sm" style="color:var(--admin-text-primary)">Médiathèque par marque</span>
          <span class="text-xs text-purple-300/70 hidden sm:inline">Uploadez des images une fois, affectez-les à n'importe quel produit</span>
        </div>
        <i id="mediatheque-chevron" class="fas fa-chevron-down text-xs" style="color:var(--admin-text-muted);transition:transform 0.2s;"></i>
      </button>
      <div id="mediatheque-panel" class="hidden p-5" style="border-top:1px solid rgba(168,85,247,0.1);">
        {/* Upload form */}
        <div class="flex flex-wrap gap-3 mb-5 items-end">
          <div>
            <label class="block text-xs mb-1" style="color:var(--admin-text-muted);">Marque</label>
            <input id="mediatheque-brand" type="text" placeholder="LG, Samsung…" list="mediatheque-brands-list"
              class="input-field text-xs w-32" />
            <datalist id="mediatheque-brands-list">
              {['LG', 'Samsung', 'Daikin', 'Midea', 'Panasonic', 'Gree', 'Hisense', 'TCL', 'Airwell', 'Carrier', 'Fujitsu', 'Mitsubishi', 'Toshiba', 'Hitachi'].map(b => <option value={b} />)}
            </datalist>
          </div>
          <div>
            <label class="block text-xs mb-1" style="color:var(--admin-text-muted);">Libellé (optionnel)</label>
            <input id="mediatheque-label" type="text" placeholder="Logo officiel 2024"
              class="input-field text-xs w-44" />
          </div>
          <div>
            <label class="block text-xs mb-1" style="color:var(--admin-text-muted);">Image(s)</label>
            <label class="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold" style="background:rgba(168,85,247,0.12); color:#d8b4fe; border:1px solid rgba(168,85,247,0.3);">
              <i class="fas fa-cloud-upload-alt"></i>
              <span>Choisir les fichiers</span>
              <input id="mediatheque-files" type="file" accept="image/*" multiple class="hidden" onchange="uploadMediatheque()" />
            </label>
          </div>
          <div id="mediatheque-uploading" class="hidden text-xs text-purple-300 flex items-center gap-1">
            <i class="fas fa-spinner fa-spin"></i>Upload…
          </div>
        </div>
        {/* Filtres par marque */}
        <div class="flex items-center gap-2 mb-4 flex-wrap">
          <span class="text-xs" style="color:var(--admin-text-muted)">Filtrer :</span>
          <button onclick="filterMediatheque('')" data-brand-filter="" class="brand-filter-btn text-xs px-2.5 py-1 rounded-lg font-semibold" style="background:rgba(168,85,247,0.2); color:#d8b4fe;">Toutes</button>
          {['LG', 'Samsung', 'Daikin', 'Midea', 'Panasonic', 'Gree', 'Hisense', 'TCL', 'Airwell', 'Carrier'].map(b => (
            <button onclick={`filterMediatheque('${b}')`} data-brand-filter={b} class="brand-filter-btn text-xs px-2.5 py-1 rounded-lg font-semibold" style="background:rgba(148,163,184,0.08); color:#94a3b8;">{b}</button>
          ))}
        </div>
        {/* Grille d'images */}
        <div id="mediatheque-grid" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-64 overflow-y-auto"></div>
        <p id="mediatheque-empty" class="hidden text-center text-xs text-gray-500 py-6">Aucune image dans la médiathèque. Uploadez des images ci-dessus.</p>
      </div>
    </div>

    {/* Modal affectation d'une image médiathèque à un produit ou à la marque entière */}
    <div id="assign-media-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.75); backdrop-filter:blur(4px);">
      <div class="rounded-2xl p-6 w-full max-w-sm shadow-2xl" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
        <h3 class="font-bold mb-4 flex items-center gap-2" style="color:var(--admin-text-primary);">
          <i class="fas fa-link text-purple-400"></i>
          Affecter l'image médiathèque
        </h3>
        <div class="mb-4 flex justify-center">
          <img id="assign-media-preview" src="" class="w-28 h-28 object-contain rounded-xl" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);" />
        </div>
        <input type="hidden" id="assign-media-id" />
        <input type="hidden" id="assign-media-brand-name" />

        {/* Portée d'affectation */}
        <div class="mb-4">
          <label class="block text-xs font-semibold mb-2" style="color:var(--admin-text-muted);">Portée d'affectation</label>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border" style="border-color:var(--admin-border); background:var(--admin-bg);">
              <input type="radio" name="assign-scope" value="brand" checked onchange="toggleAssignScopeUI()" class="accent-purple-500" />
              <span class="text-xs font-semibold" style="color:var(--admin-text-primary);">
                Tous les climatiseurs <span id="assign-brand-badge" class="text-purple-400 font-bold"></span> (Global)
              </span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border" style="border-color:var(--admin-border); background:var(--admin-bg);">
              <input type="radio" name="assign-scope" value="single" onchange="toggleAssignScopeUI()" class="accent-purple-500" />
              <span class="text-xs font-semibold" style="color:var(--admin-text-primary);">Un seul produit spécifique</span>
            </label>
          </div>
        </div>

        {/* Choix du produit si scope == single */}
        <div id="assign-product-wrapper" class="hidden mb-4">
          <label class="block text-xs mb-1" style="color:var(--admin-text-muted);">Produit cible</label>
          <select id="assign-product-select" class="w-full rounded-xl px-3 py-2 text-xs" style="background:var(--admin-card-bg); border:1px solid var(--admin-border); color:var(--admin-text-primary);">
            {products.map(p => <option value={String(p.id)}>{p.name} — {p.brand}</option>)}
          </select>
        </div>

        {/* Emplacement d'utilisation */}
        <div class="mb-5">
          <label class="block text-xs font-semibold mb-2" style="color:var(--admin-text-muted);">Utiliser comme</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="assign-target" value="main" checked class="accent-purple-500" />
              <span class="text-xs" style="color:var(--admin-text-primary);">Image principale</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="assign-target" value="gallery" class="accent-purple-500" />
              <span class="text-xs" style="color:var(--admin-text-primary);">Galerie photos</span>
            </label>
          </div>
        </div>

        <div class="flex gap-3">
          <button type="button" onclick="document.getElementById('assign-media-modal').classList.add('hidden')"
            class="flex-1 py-2.5 rounded-xl text-xs font-semibold" style="background:rgba(148,163,184,0.1); color:#94a3b8;">Annuler</button>
          <button type="button" onclick="confirmAssignMedia()"
            class="flex-1 py-2.5 rounded-xl text-xs font-semibold" style="background:rgba(168,85,247,0.2); color:#d8b4fe; border:1px solid rgba(168,85,247,0.3);">
            <i class="fas fa-check mr-1"></i>Affecter
          </button>
        </div>
      </div>
    </div>

    <script dangerouslySetInnerHTML={{ __html: `
      ${CLIENT_ESC_HELPER}
      // ===== MÉDIATHÈQUE CENTRALISÉE =====
      var _mediathequeFilter = '';

      function toggleMediatheque() {
        var panel = document.getElementById('mediatheque-panel');
        var chevron = document.getElementById('mediatheque-chevron');
        var wasHidden = panel.classList.contains('hidden');
        panel.classList.toggle('hidden', !wasHidden);
        chevron.style.transform = wasHidden ? 'rotate(180deg)' : '';
        if (wasHidden) loadMediatheque();
      }

      function loadMediatheque() {
        var url = '/api/admin/media/brand' + (_mediathequeFilter ? '?brand=' + encodeURIComponent(_mediathequeFilter) : '');
        fetch(url).then(function(r){ return r.json(); }).then(function(d) {
          renderMediatheque(d.images || []);
        }).catch(function() { renderMediatheque([]); });
      }

      function renderMediatheque(images) {
        var grid = document.getElementById('mediatheque-grid');
        var empty = document.getElementById('mediatheque-empty');
        grid.innerHTML = '';
        if (!images.length) { empty.classList.remove('hidden'); return; }
        empty.classList.add('hidden');
        images.forEach(function(img) {
          var div = document.createElement('div');
          div.className = 'relative group rounded-xl overflow-hidden cursor-pointer';
          div.style.cssText = 'aspect-ratio:1/1; background:#0a1628;';
          var image = document.createElement('img');
          image.src = img.url;
          image.className = 'w-full h-full object-cover';
          image.title = (img.label || '') + (img.label && img.brand ? ' — ' : '') + (img.brand || '');
          var overlay = document.createElement('div');
          overlay.className = 'absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity';
          overlay.style.cssText = 'background:rgba(0,0,0,0.65);';
          var badge = document.createElement('span');
          badge.className = 'text-xs font-bold px-2 py-0.5 rounded-full';
          badge.style.cssText = 'background:rgba(168,85,247,0.4); color:#d8b4fe;';
          badge.textContent = img.brand;
          var btnAssign = document.createElement('button');
          btnAssign.type = 'button';
          btnAssign.className = 'text-xs px-2.5 py-1 rounded-lg font-semibold';
          btnAssign.style.cssText = 'background:rgba(16,185,129,0.35); color:#34d399;';
          btnAssign.textContent = 'Affecter';
          btnAssign.addEventListener('click', (function(i) { return function(e) { e.stopPropagation(); openAssignModal(i); }; })(img));
          var btnDel = document.createElement('button');
          btnDel.type = 'button';
          btnDel.className = 'text-xs px-2.5 py-1 rounded-lg font-semibold';
          btnDel.style.cssText = 'background:rgba(239,68,68,0.35); color:#f87171;';
          btnDel.textContent = 'Supprimer';
          btnDel.addEventListener('click', (function(i) { return function(e) { e.stopPropagation(); deleteFromMediatheque(i.id); }; })(img));
          overlay.appendChild(badge);
          overlay.appendChild(btnAssign);
          overlay.appendChild(btnDel);
          div.appendChild(image);
          div.appendChild(overlay);
          grid.appendChild(div);
        });
      }

      function filterMediatheque(brand) {
        _mediathequeFilter = brand;
        document.querySelectorAll('.brand-filter-btn').forEach(function(btn) {
          var active = btn.getAttribute('data-brand-filter') === brand;
          btn.style.background = active ? 'rgba(168,85,247,0.2)' : 'rgba(148,163,184,0.08)';
          btn.style.color = active ? '#d8b4fe' : '#94a3b8';
        });
        loadMediatheque();
      }

      function uploadMediatheque() {
        var brandInput = document.getElementById('mediatheque-brand');
        var brand = (brandInput ? brandInput.value : '').trim() || (_mediathequeFilter || '');
        var label = document.getElementById('mediatheque-label').value.trim();
        var input = document.getElementById('mediatheque-files');
        if (!brand) { showToast("Veuillez renseigner ou filtrer par marque avant l'upload.", "warning"); input.value = ''; return; }
        if (!input.files || !input.files.length) return;
        var upl = document.getElementById('mediatheque-uploading');
        upl.classList.remove('hidden');
        var files = Array.from(input.files);
        var done = 0;
        var errors = 0;
        var lastErr = '';
        files.forEach(function(file) {
          var fd = new FormData();
          fd.append('brand', brand);
          fd.append('label', label);
          fd.append('image', file);
          fetch('/api/admin/media/brand/upload', { method: 'POST', body: fd })
            .then(function(r){ return r.json(); })
            .then(function(d) {
              if (d.error) { errors++; lastErr = d.error; }
              done++;
              if (done === files.length) {
                upl.classList.add('hidden');
                input.value = '';
                if (errors > 0) showToast(lastErr || (errors + " erreur(s) d'upload."), "error");
                else showToast(files.length + " image(s) envoyée(s) dans la médiathèque.", "success");
                loadMediatheque();
              }
            })
            .catch(function() {
              errors++; done++;
              if (done === files.length) { upl.classList.add('hidden'); input.value = ''; showToast("Erreur réseau lors de l'upload.", "error"); loadMediatheque(); }
            });
        });
      }

      function deleteFromMediatheque(id) {
        if (!confirm('Supprimer cette image de la médiathèque ?')) return;
        var fd = new FormData();
        fd.append('id', String(id));
        fetch('/api/admin/media/brand/delete', { method: 'POST', body: fd })
          .then(function(r){ return r.json(); })
          .then(function(d) {
            if (d.success) { showToast('Image supprimée.', 'success'); loadMediatheque(); }
            else showToast('Erreur : ' + (d.error || ''), 'error');
          }).catch(function() { showToast('Erreur réseau.', 'error'); });
      }

      function toggleAssignScopeUI() {
        var scopeEl = document.querySelector('input[name="assign-scope"]:checked');
        var scope = scopeEl ? scopeEl.value : 'brand';
        var wrapper = document.getElementById('assign-product-wrapper');
        if (wrapper) wrapper.classList.toggle('hidden', scope !== 'single');
      }

      function openAssignModal(img) {
        document.getElementById('assign-media-preview').src = img.url;
        document.getElementById('assign-media-id').value = String(img.id);
        document.getElementById('assign-media-brand-name').value = img.brand || '';
        document.getElementById('assign-brand-badge').textContent = img.brand ? (img.brand + ' ') : '';
        
        var radBrand = document.querySelector('input[name="assign-scope"][value="brand"]');
        if (radBrand) radBrand.checked = true;
        toggleAssignScopeUI();

        document.getElementById('assign-media-modal').classList.remove('hidden');
      }

      function confirmAssignMedia() {
        var mediaId = document.getElementById('assign-media-id').value;
        var scopeEl = document.querySelector('input[name="assign-scope"]:checked');
        var scope = scopeEl ? scopeEl.value : 'brand';
        var productId = document.getElementById('assign-product-select').value;
        var targetEl = document.querySelector('input[name="assign-target"]:checked');
        var target = targetEl ? targetEl.value : 'main';

        var fd = new FormData();
        fd.append('media_id', mediaId);
        fd.append('scope', scope);
        fd.append('product_id', productId);
        fd.append('target', target);

        fetch('/api/admin/media/brand/assign', { method: 'POST', body: fd })
          .then(function(r){ return r.json(); })
          .then(function(d) {
            document.getElementById('assign-media-modal').classList.add('hidden');
            if (d.success) {
              showToast(d.message || "Image affectée avec succès.", "success");
              setTimeout(function(){ location.reload(); }, 1200);
            } else {
              showToast("Erreur : " + (d.error || "Échec de l'affectation"), "error");
            }
          }).catch(function() { showToast("Erreur réseau.", "error"); });
      }

      // Fermer modal affectation sur clic extérieur
      document.getElementById('assign-media-modal').addEventListener('click', function(e) {
        if (e.target === this) this.classList.add('hidden');
      });
    `}} />

    {/* Résumé stock */}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="rounded-xl p-4 text-center" style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25);">
        <div class="text-2xl font-bold text-green-400">{products.filter(p => p.stock > 3).length}</div>
        <div class="text-xs text-green-300/80 font-medium mt-1">En stock</div>
      </div>
      <div class="rounded-xl p-4 text-center" style="background:rgba(249,115,22,0.1); border:1px solid rgba(249,115,22,0.25);">
        <div class="text-2xl font-bold text-orange-400">{products.filter(p => p.stock > 0 && p.stock <= 3).length}</div>
        <div class="text-xs text-orange-300/80 font-medium mt-1">Stock limité</div>
      </div>
      <div class="rounded-xl p-4 text-center" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25);">
        <div class="text-2xl font-bold text-red-400">{products.filter(p => p.stock === 0).length}</div>
        <div class="text-xs text-red-300/80 font-medium mt-1">Rupture</div>
      </div>
    </div>

    {/* Low stock alerts */}
    {products.filter(p => p.stock <= 3).length > 0 && (
    <div class="mb-6 rounded-xl p-4" style="background:rgba(249,115,22,0.08); border:1px solid rgba(249,115,22,0.2);">
      <h3 class="text-sm font-bold text-orange-400 mb-2"><i class="fas fa-exclamation-triangle mr-1"></i>Alertes stock bas</h3>
      <div class="flex flex-wrap gap-2">
        {products.filter(p => p.stock <= 3).map(p => (
          <span class="text-xs px-3 py-1.5 rounded-xl font-medium" style={`background:${p.stock === 0 ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.15)'}; color:${p.stock === 0 ? '#f87171' : '#fb923c'}; border:1px solid ${p.stock === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.2)'};`}>
            {p.name} <strong>({p.stock})</strong>
          </span>
        ))}
      </div>
    </div>
    )}

    {/* Quick stock movement form */}
    <div class="mb-6 rounded-xl p-4 flex flex-wrap items-end gap-3" style="background:var(--admin-bg); border:1px solid var(--admin-border);">
      <form method="post" action="/api/admin/stock/movement" class="flex flex-wrap items-end gap-3 w-full">
        <div>
          <label class="block text-xs mb-1" style="color:var(--admin-text-muted);">Produit</label>
          <select name="product_id" required class="input-field text-xs">
            {products.map(p => <option value={p.id}>{p.name} (stock: {p.stock})</option>)}
          </select>
        </div>
        <div>
          <label class="block text-xs mb-1" style="color:var(--admin-text-muted);">Type</label>
          <select name="type" class="input-field text-xs">
            <option value="entree">Entrée (+)</option>
            <option value="sortie">Sortie (-)</option>
            <option value="ajustement">Ajustement</option>
            <option value="retour">Retour</option>
          </select>
        </div>
        <div>
          <label class="block text-xs mb-1" style="color:var(--admin-text-muted);">Quantité (+/-)</label>
          <input name="quantity" type="number" required class="input-field text-xs w-24" placeholder="ex: 5 ou -2" />
        </div>
        <div class="flex-1 min-w-[120px]">
          <label class="block text-xs mb-1" style="color:var(--admin-text-muted);">Raison</label>
          <input name="reason" class="input-field text-xs w-full" placeholder="Réapprovisionnement, vente, etc." />
        </div>
        <button type="submit" class="btn-primary px-4 py-2 rounded-xl text-xs font-semibold"><i class="fas fa-exchange-alt mr-1"></i>Enregistrer</button>
      </form>
    </div>

    {/* Stock movements history (loaded via JS) */}
    <div class="mb-6">
      <button onclick="toggleStockHistory()" class="text-xs text-cyan-400 hover:underline mb-2"><i class="fas fa-history mr-1"></i>Voir l'historique des mouvements de stock</button>
      <div id="stock-history" class="hidden rounded-xl overflow-hidden" style="background:var(--admin-bg-elevated); border:1px solid var(--admin-border);">
        <div id="stock-history-content" class="p-4 text-xs" style="color:var(--admin-text-muted)">Chargement...</div>
      </div>
    </div>
    <script dangerouslySetInnerHTML={{__html: `
      function toggleStockHistory() {
        var el = document.getElementById('stock-history');
        if (el.classList.contains('hidden')) {
          el.classList.remove('hidden');
          loadStockHistory();
        } else {
          el.classList.add('hidden');
        }
      }
      function loadStockHistory() {
        fetch('/api/admin/stock/movements').then(r=>r.json()).then(data => {
          var c = document.getElementById('stock-history-content');
          if (!data.length) { c.innerHTML = '<p class="text-gray-500">Aucun mouvement enregistré</p>'; return; }
          var html = '<table class="w-full text-xs"><thead><tr>'
            + ['Date','Produit','Type','Qté','Avant','Après','Raison'].map(h=>'<th class="text-left py-2 px-3 text-gray-500 font-medium">'+h+'</th>').join('')
            + '</tr></thead><tbody>';
          data.forEach(function(m) {
            var typeColors = {entree:'#34d399',sortie:'#f87171',ajustement:'#fbbf24',vente:'#f87171',retour:'#60a5fa'};
            var typeLabels = {entree:'Entrée',sortie:'Sortie',ajustement:'Ajust.',vente:'Vente',retour:'Retour'};
            html += '<tr class="border-t border-gray-800/50">'
              + '<td class="py-2 px-3 text-gray-400">'+_esc((m.created_at||'').substring(0,16))+'</td>'
              + '<td class="py-2 px-3" style="color:var(--admin-text-primary)">'+_esc(m.product_name||'#'+m.product_id)+'</td>'
              + '<td class="py-2 px-3"><span style="color:'+(typeColors[m.movement_type]||'#94a3b8')+'">'+_esc(typeLabels[m.movement_type]||m.movement_type)+'</span></td>'
              + '<td class="py-2 px-3 font-mono '+(m.quantity>0?'text-green-400':'text-red-400')+'">'+(m.quantity>0?'+':'')+_esc(m.quantity)+'</td>'
              + '<td class="py-2 px-3 text-gray-500">'+_esc(m.stock_before)+'</td>'
              + '<td class="py-2 px-3 font-semibold" style="color:var(--admin-text-primary)">'+_esc(m.stock_after)+'</td>'
              + '<td class="py-2 px-3 text-gray-400">'+_esc(m.reason||'-')+'</td>'
              + '</tr>';
          });
          html += '</tbody></table>';
          c.innerHTML = html;
        }).catch(function(){ document.getElementById('stock-history-content').innerHTML = '<p class="text-red-400">Erreur de chargement</p>'; });
      }
    `}} />

    <div class="rounded-2xl  card-shadow overflow-hidden" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b" style="background:#f1f5f9;">
            <tr>
              {["Produit", "Marque", "BTU", "Prix", "Stock"].map(h => (
                <th class="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style="color: var(--admin-text-muted)">{h}</th>
              ))}
              <th class="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap hidden lg:table-cell" style="color: var(--admin-text-muted)">Inverter</th>
              <th class="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap hidden md:table-cell" style="color: var(--admin-text-muted)">Image</th>
              <th class="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style="color: var(--admin-text-muted)">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y" style="border-color: var(--admin-border)" data-paginate="20">
            {products.map(p => (
              <tr class="hover:bg-[rgba(3,105,161,0.04)] transition-colors">
                <td class="py-4 px-4">
                  <div class="flex items-center space-x-3 min-w-0">
                    {(p as any).imageUrl
                      ? <img src={(p as any).imageUrl} alt={p.name} class="w-10 h-10 object-contain rounded-lg border flex-shrink-0" style="background:var(--admin-bg); border-color:var(--admin-border);" />
                      : <span class="text-2xl flex-shrink-0">{p.image}</span>
                    }
                    <div class="min-w-0">
                      <div class="font-semibold text-xs leading-tight truncate max-w-36" style="color: var(--admin-text-primary)">{p.name}</div>
                      <div class="text-xs" style="color: var(--admin-text-muted)">{p.model}</div>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-4 text-xs font-medium whitespace-nowrap" style="color: var(--admin-text-muted)">{p.brand}</td>
                <td class="py-4 px-4 text-xs whitespace-nowrap" style="color: var(--admin-text-muted)">{p.btu.toLocaleString()}</td>
                <td class="py-4 px-4 font-semibold text-xs whitespace-nowrap" style="color: var(--admin-text-primary)">{p.price.toLocaleString()} F</td>
                <td class="py-4 px-4">
                  <form method="post" action="/api/admin/produit/stock" class="flex items-center space-x-2">
                    <input type="hidden" name="id" value={String(p.id)} />
                    <input type="number" name="stock" value={String(p.stock)} min="0" max="99"
                      class={`w-16 border rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-none focus:border-blue-500 transition-colors ${p.stock === 0 ? 'border-red-500/40 text-red-400' : p.stock <= 3 ? 'border-orange-500/40 text-orange-400' : 'border-green-500/40 text-green-400'}`} style="background:var(--admin-bg);" />
                    <button type="submit" class="text-xs text-blue-400 hover:text-blue-300 px-2 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap" style="background:rgba(59,130,246,0.12);">MAJ</button>
                  </form>
                </td>
                <td class="py-4 px-4 hidden lg:table-cell">
                  <span class={`text-xs px-2.5 py-1 rounded-full font-semibold ${p.inverter ? 'text-blue-400' : 'text-gray-500'}`} style={p.inverter ? 'background:rgba(59,130,246,0.12);' : 'background:rgba(148,163,184,0.1);'}>
                    {p.inverter ? 'Oui' : 'Non'}
                  </span>
                </td>
                {/* Colonne image upload */}
                <td class="py-4 px-4 hidden md:table-cell">
                  <form method="post" action="/api/admin/produit/image" enctype="multipart/form-data" class="flex items-center space-x-1">
                    <input type="hidden" name="id" value={String(p.id)} />
                    <label class="cursor-pointer flex items-center space-x-1 text-xs text-purple-400 hover:text-purple-300 px-2 py-1.5 rounded-lg font-semibold transition-colors" style="background:rgba(168,85,247,0.12); border:1px solid rgba(168,85,247,0.25);">
                      <i class="fas fa-camera text-xs"></i>
                      <span>Photo</span>
                      <input type="file" name="image" accept="image/*" class="hidden"
                        onchange="this.closest('form').submit()" />
                    </label>
                    {(p as any).imageUrl && (
                      <span class="text-xs text-green-600 font-medium">?</span>
                    )}
                  </form>
                  <button type="button" data-gallery-id={String(p.id)}
                    class="flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 px-2 py-1.5 rounded-lg font-semibold transition-colors mt-1" style="background:rgba(14,165,233,0.1); border:1px solid rgba(14,165,233,0.2);">
                    <i class="fas fa-images text-xs"></i>
                    <span>Galerie</span>
                  </button>
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center space-x-1">
                    <a href={`/catalogue?product=${p.id}`} target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg transition-colors" style="" title="Voir">
                      <i class="fas fa-eye text-xs"></i>
                    </a>
                    <button 
                      data-product={jsonForScript({
                        id: p.id, name: p.name, brand: p.brand, model: p.model,
                        btu: p.btu, price: p.price, stock: p.stock, energy_class: p.energy_class,
                        surface_min: p.surface_min || '', surface_max: p.surface_max || '',
                        description: p.description, inverter: p.inverter,
                        features: p.features, techSpecs: p.techSpecs || {},
                        media: p.media || []
                      })}
                      onclick="editProductFromData(this)"
                      class="text-orange-400 hover:text-orange-300 p-1.5 rounded-lg transition-colors" title="Modifier">
                      <i class="fas fa-edit text-xs"></i>
                    </button>
                    <button class="text-red-400 hover:text-red-300 p-1.5 rounded-lg transition-colors" title="Supprimer"
                      onclick={`if(confirm('Supprimer ce produit ?')) { document.getElementById('del-form-${p.id}').submit(); }`}>
                      <i class="fas fa-trash text-xs"></i>
                    </button>
                    <form id={`del-form-${p.id}`} method="post" action="/api/admin/produit/delete" class="hidden">
                      <input type="hidden" name="id" value={String(p.id)} />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Modal ajout produit */}
    <div id="add-product-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="rounded-3xl p-4 sm:p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-bold text-lg" style="color:var(--admin-text-primary);">
            <i class="fas fa-plus-circle text-primary-600 mr-2"></i>Ajouter un produit
          </h3>
          <button onclick="document.getElementById('add-product-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-300 p-1">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <form method="post" action="/api/admin/produit/add" enctype="multipart/form-data" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Nom du produit *</label>
              <input type="text" name="name" required placeholder="Ex: Climatiseur Split Inverter 12000 BTU" class="input-field text-sm" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">
                <i class="fas fa-image text-purple-500 mr-1"></i>Photo du produit
              </label>
              <div class="flex items-center space-x-3">
                <label class="flex-1 cursor-pointer border-2 border-dashed rounded-xl p-3 text-center transition-all" style="border-color:rgba(168,85,247,0.3); background:transparent;" onmouseover="this.style.borderColor='rgba(168,85,247,0.5)'" onmouseout="this.style.borderColor='rgba(168,85,247,0.3)'">
                  <i class="fas fa-cloud-upload-alt text-purple-400 text-xl mb-1"></i>
                  <p class="text-xs text-purple-400 font-medium">Cliquer pour choisir une image</p>
                  <p class="text-xs" style="color:var(--admin-text-muted)">JPG, PNG, WEBP (max 2 Mo)</p>
                  <input type="file" name="image" accept="image/*" class="hidden"
                    onchange="const r=new FileReader();r.onload=e=>{document.getElementById('preview-img').src=e.target.result;document.getElementById('preview-img').classList.remove('hidden')};r.readAsDataURL(this.files[0])" />
                </label>
                <img id="preview-img" src="" alt="Aperçu" class="hidden w-16 h-16 object-contain rounded-xl border border-gray-700/50" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Marque *</label>
              <input type="text" name="brand" required placeholder="Ex: SAMSUNG, LG, DAIKIN" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Modèle / Référence</label>
              <input type="text" name="model" placeholder="Ex: AR12TX..." class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Puissance BTU *</label>
              <select name="btu" required class="input-field text-sm">
                <option value="9000">9 000 BTU</option>
                <option value="12000" selected>12 000 BTU</option>
                <option value="18000">18 000 BTU</option>
                <option value="24000">24 000 BTU</option>
                <option value="30000">30 000 BTU</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Prix FCFA *</label>
              <input type="number" name="price" required min="0" placeholder="Ex: 280000" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Stock initial *</label>
              <input type="number" name="stock" required min="0" value="0" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Classe énergie</label>
              <select name="energy_class" class="input-field text-sm">
                <option value="A">A</option><option value="A+">A+</option>
                <option value="A++" selected>A++</option><option value="A+++">A+++</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Surface min m²</label>
              <input type="number" name="surface_min" min="1" placeholder="Ex: 15" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Surface max m²</label>
              <input type="number" name="surface_max" min="1" placeholder="Ex: 25" class="input-field text-sm" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Description</label>
            <textarea name="description" rows={2} placeholder="Description technique du produit..." class="input-field text-sm resize-none"></textarea>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Mentions / Fonctionnalités</label>
            <div id="features-add" class="space-y-2 mb-3">
              <input type="hidden" name="features_json" class="features-input" value="[]" />
              <div class="flex flex-wrap gap-2 mb-2" id="features-add-tags"></div>
              <div class="flex gap-2">
                <input type="text" placeholder="Ajouter une mention (ex: Mode Turbo)" class="flex-1 input-field text-sm" id="features-add-input" />
                <button type="button" onclick="addFeatureToAdd()" class="bg-purple-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-600">+</button>
              </div>
            </div>
          </div>
          {/* Caractéristiques techniques */}
          <div class="pt-4" style="border-top:1px solid var(--admin-border);">
            <button type="button" onclick="this.nextElementSibling.classList.toggle('hidden')"
              class="w-full flex items-center justify-between text-sm font-semibold mb-3 focus:outline-none" style="color:var(--admin-accent);">
              <span><i class="fas fa-microchip mr-2"></i>Caractéristiques techniques (optionnel)</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div class="hidden">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Source de courant</label>
                  <input type="text" name="power_source" placeholder="ex: 220V/1Ph/50Hz" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Capacité refroidissement</label>
                  <input type="text" name="cooling_capacity" placeholder="ex: 3500 W" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Puissance refroid. entrée</label>
                  <input type="text" name="cooling_input_power" placeholder="ex: 1150 W" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Courant nominal refroid.</label>
                  <input type="text" name="nominal_cooling_current" placeholder="ex: 5.5 A" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Max. Conso. entrée</label>
                  <input type="text" name="max_input_consumption" placeholder="ex: 1400 W" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Courant max</label>
                  <input type="text" name="max_current" placeholder="ex: 6.5 A" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Courant de démarrage</label>
                  <input type="text" name="starting_current" placeholder="ex: 45 A" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Type de compresseur</label>
                  <input type="text" name="compressor_type" placeholder="ex: Rotatif" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Débit d'air intérieur</label>
                  <input type="text" name="indoor_airflow" placeholder="ex: 600 m³/h" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Bruit intérieur</label>
                  <input type="text" name="indoor_noise" placeholder="ex: 26-42 dB(A)" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Type de réfrigérant</label>
                  <input type="text" name="refrigerant_type" placeholder="ex: R32" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Pression de conception</label>
                  <input type="text" name="design_pressure" placeholder="ex: 4.3/1.9 MPa" class="input-field text-sm" />
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Température de fonctionnement</label>
                  <input type="text" name="operating_temp" placeholder="ex: -15°C · 50°C" class="input-field text-sm" />
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Température ambiante (refroid.)</label>
                  <input type="text" name="ambient_temp_cooling" placeholder="ex: 18°C · 43°C" class="input-field text-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Section Upload Média (Images + Vidéos) */}
          <div class="pt-4" style="border-top:1px solid rgba(56,189,248,0.15);">
            <button type="button" onclick="toggleMediaSectionAdd()"
              class="w-full flex items-center justify-between text-sm font-semibold mb-3 focus:outline-none" style="color:#38bdf8;">
              <span><i class="fas fa-images mr-2"></i>Images & Vidéos (optionnel)</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div id="media-add-section" class="hidden">
              <div class="flex items-center space-x-3 mb-3">
                <label class="flex-1 cursor-pointer border-2 border-dashed rounded-xl p-4 text-center hover:border-pink-400 transition-all" style="border-color:rgba(236,72,153,0.3);">
                  <i class="fas fa-cloud-upload-alt text-pink-400 text-2xl mb-2"></i>
                  <p class="text-xs text-pink-400 font-medium">Cliquer pour ajouter des fichiers</p>
                  <p class="text-xs text-gray-400">Images (JPG, PNG, WEBP) ou Vidéos (MP4, WebM)</p>
                  <input type="file" id="media-add-input" name="media_files" multiple accept="image/*,video/*" class="hidden"
                    onchange="previewMediaAdd()" />
                </label>
              </div>
              <div id="media-add-preview" class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3"></div>
              <input type="hidden" name="media_json" id="add-media-json" value="[]" />
              <p class="text-xs text-gray-500 italic">Extensions : JPG, PNG, WEBP (images), MP4, WebM (vidéos). Max 10 fichiers, 50 Mo chacun.</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-4">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" name="inverter" id="inverter-check" class="accent-blue-600 w-4 h-4" />
              <span class="text-sm font-medium" style="color:var(--admin-text-primary);">Technologie Inverter</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" name="available" id="available-check" checked class="accent-green-600 w-4 h-4" />
              <span class="text-sm font-medium" style="color:var(--admin-text-primary);">Disponible à la vente</span>
            </label>
          </div>
          <div class="flex space-x-3 pt-2">
            <button type="button" onclick="document.getElementById('add-product-modal').classList.add('hidden')"
              class="flex-1 border-2 font-semibold py-3 rounded-xl text-sm hover:bg-cyan-900/10 transition-colors" style="border-color:var(--admin-border); color:var(--admin-text-muted);">
              Annuler
            </button>
            <button type="submit" class="flex-1 btn-primary font-semibold py-3 rounded-xl text-sm shadow-md">
              <i class="fas fa-plus mr-2"></i>Ajouter le produit
            </button>
          </div>
        </form>
      </div>
    </div>

    {/* Modal Édition produit */}
    <div id="edit-product-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="rounded-3xl p-4 sm:p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-bold text-lg" style="color:var(--admin-text-primary);">
            <i class="fas fa-edit-circle text-primary-600 mr-2"></i>Modifier le produit
          </h3>
          <button onclick="document.getElementById('edit-product-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-300 p-1">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <form id="edit-form" method="post" action="/api/admin/produit/update" enctype="multipart/form-data" class="space-y-4">
          <input type="hidden" id="edit-id" name="id" />
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Nom du produit *</label>
              <input type="text" id="edit-name" name="name" required placeholder="Ex: Climatiseur Split Inverter 12000 BTU" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Marque *</label>
              <input type="text" id="edit-brand" name="brand" required placeholder="Ex: SAMSUNG" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Modèle / Référence</label>
              <input type="text" id="edit-model" name="model" placeholder="Ex: AR12TX..." class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Puissance BTU *</label>
              <select id="edit-btu" name="btu" required class="input-field text-sm">
                <option value="9000">9 000 BTU</option>
                <option value="12000">12 000 BTU</option>
                <option value="18000">18 000 BTU</option>
                <option value="24000">24 000 BTU</option>
                <option value="30000">30 000 BTU</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Prix FCFA *</label>
              <input type="number" id="edit-price" name="price" required min="0" placeholder="Ex: 280000" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Stock *</label>
              <input type="number" id="edit-stock" name="stock" required min="0" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Classe énergie</label>
              <select id="edit-energy_class" name="energy_class" class="input-field text-sm">
                <option value="A">A</option><option value="A+">A+</option>
                <option value="A++">A++</option><option value="A+++">A+++</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Surface min m²</label>
              <input type="number" id="edit-surface_min" name="surface_min" min="1" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Surface max m²</label>
              <input type="number" id="edit-surface_max" name="surface_max" min="1" class="input-field text-sm" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Description</label>
            <textarea id="edit-description" name="description" rows={2} placeholder="Description technique du produit..." class="input-field text-sm resize-none"></textarea>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Mentions / Fonctionnalités</label>
            <div id="features-edit" class="space-y-2 mb-3">
              <input type="hidden" name="features_json" class="features-input" value="[]" />
              <div class="flex flex-wrap gap-2 mb-2" id="features-edit-tags"></div>
              <div class="flex gap-2">
                <input type="text" placeholder="Ajouter une mention (ex: Mode Turbo)" class="flex-1 input-field text-sm" id="features-edit-input" />
                <button type="button" onclick="addFeatureToEdit()" class="bg-purple-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-600">+</button>
              </div>
            </div>
          </div>
          {/* Caractéristiques techniques */}
          <div class="pt-4" style="border-top:1px solid rgba(56,189,248,0.15);">
            <button type="button" onclick="this.nextElementSibling.classList.toggle('hidden')"
              class="w-full flex items-center justify-between text-sm font-semibold mb-3 focus:outline-none" style="color:#38bdf8;">
              <span><i class="fas fa-microchip mr-2"></i>Caractéristiques techniques (optionnel)</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div class="hidden">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Source de courant</label>
                  <input type="text" id="edit-power_source" name="power_source" placeholder="ex: 220V/1Ph/50Hz" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Capacité refroidissement</label>
                  <input type="text" id="edit-cooling_capacity" name="cooling_capacity" placeholder="ex: 3500 W" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Puissance refroid. entrée</label>
                  <input type="text" id="edit-cooling_input_power" name="cooling_input_power" placeholder="ex: 1150 W" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Courant nominal refroid.</label>
                  <input type="text" id="edit-nominal_cooling_current" name="nominal_cooling_current" placeholder="ex: 5.5 A" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Max. Conso. entrée</label>
                  <input type="text" id="edit-max_input_consumption" name="max_input_consumption" placeholder="ex: 1400 W" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Courant max</label>
                  <input type="text" id="edit-max_current" name="max_current" placeholder="ex: 6.5 A" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Courant de démarrage</label>
                  <input type="text" id="edit-starting_current" name="starting_current" placeholder="ex: 45 A" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Type de compresseur</label>
                  <input type="text" id="edit-compressor_type" name="compressor_type" placeholder="ex: Rotatif" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Débit d'air intérieur</label>
                  <input type="text" id="edit-indoor_airflow" name="indoor_airflow" placeholder="ex: 600 m³/h" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Bruit intérieur</label>
                  <input type="text" id="edit-indoor_noise" name="indoor_noise" placeholder="ex: 26-42 dB(A)" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Type de réfrigérant</label>
                  <input type="text" id="edit-refrigerant_type" name="refrigerant_type" placeholder="ex: R32" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Pression de conception</label>
                  <input type="text" id="edit-design_pressure" name="design_pressure" placeholder="ex: 4.3/1.9 MPa" class="input-field text-sm" />
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Température de fonctionnement</label>
                  <input type="text" id="edit-operating_temp" name="operating_temp" placeholder="ex: -15°C · 50°C" class="input-field text-sm" />
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-semibold mb-1" style="color:var(--admin-text-muted);">Température ambiante (refroid.)</label>
                  <input type="text" id="edit-ambient_temp_cooling" name="ambient_temp_cooling" placeholder="ex: 18°C · 43°C" class="input-field text-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Section Upload Média (Images + Vidéos) */}
          <div class="pt-4" style="border-top:1px solid rgba(56,189,248,0.15);">
            <button type="button" onclick="toggleMediaSectionEdit()"
              class="w-full flex items-center justify-between text-sm font-semibold mb-3 focus:outline-none" style="color:#38bdf8;">
              <span><i class="fas fa-images mr-2"></i>Images & Vidéos (optionnel)</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div id="media-edit-section" class="hidden">
              <div class="flex items-center space-x-3 mb-3">
                <label class="flex-1 cursor-pointer border-2 border-dashed rounded-xl p-4 text-center hover:border-pink-400 transition-all" style="border-color:rgba(236,72,153,0.3);">
                  <i class="fas fa-cloud-upload-alt text-pink-400 text-2xl mb-2"></i>
                  <p class="text-xs text-pink-400 font-medium">Cliquer pour ajouter des fichiers</p>
                  <p class="text-xs text-gray-400">Images (JPG, PNG, WEBP) ou Vidéos (MP4, WebM)</p>
                  <input type="file" id="media-edit-input" name="media_files" multiple accept="image/*,video/*" class="hidden"
                    onchange="previewMediaEdit()" />
                </label>
              </div>
              <div id="media-edit-preview" class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3"></div>
              <input type="hidden" name="media_json" id="edit-media-json" value="[]" />
              <p class="text-xs text-gray-500 italic">Extensions : JPG, PNG, WEBP (images), MP4, WebM (vidéos). Max 10 fichiers, 50 Mo chacun.</p>
            </div>
          </div>

          <div class="space-y-3">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" id="edit-inverter" name="inverter" class="accent-blue-600 w-4 h-4" />
              <span class="text-sm text-gray-300 font-medium">Technologie Inverter</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" id="edit-available" name="available" checked class="accent-green-600 w-4 h-4" />
              <span class="text-sm text-gray-300 font-medium">Disponible à la vente</span>
            </label>
          </div>
          <div class="flex space-x-3 pt-2">
            <button type="button" onclick="document.getElementById('edit-product-modal').classList.add('hidden')"
              class="flex-1 border-2 border-gray-600 text-gray-400 font-semibold py-3 rounded-xl text-sm hover:bg-cyan-900/10 transition-colors">
              Annuler
            </button>
            <button type="submit" class="flex-1 btn-primary font-semibold py-3 rounded-xl text-sm shadow-md">
              <i class="fas fa-check mr-2"></i>Mettre à jour
            </button>
          </div>
        </form>
      </div>
    </div>

    <script dangerouslySetInnerHTML={{ __html: `
      function editProductFromData(btn) {
        try {
          var p = JSON.parse(btn.getAttribute('data-product'));
          editProduct(p.id, p.name, p.brand, p.model, p.btu, p.price, p.stock, p.energy_class, p.surface_min, p.surface_max, p.description, p.inverter, JSON.stringify(p.features || []), JSON.stringify(p.techSpecs || {}), JSON.stringify(p.media || []));
        } catch(e) { console.error('editProductFromData error:', e); }
      }
      function editProduct(id, name, brand, model, btu, price, stock, energyClass, surfaceMin, surfaceMax, description, inverter, featuresJson, techSpecsJson, mediaJson) {
        document.getElementById('edit-id').value = id;
        document.getElementById('edit-name').value = name;
        document.getElementById('edit-brand').value = brand;
        document.getElementById('edit-model').value = model;
        document.getElementById('edit-btu').value = btu;
        document.getElementById('edit-price').value = price;
        document.getElementById('edit-stock').value = stock;
        document.getElementById('edit-energy_class').value = energyClass;
        document.getElementById('edit-surface_min').value = surfaceMin || '';
        document.getElementById('edit-surface_max').value = surfaceMax || '';
        document.getElementById('edit-description').value = description;
        document.getElementById('edit-inverter').checked = inverter === 1 || inverter === true;
        loadFeaturesForEdit(featuresJson);
        loadMediaForEdit(mediaJson);
        try {
          const ts = JSON.parse(techSpecsJson || '{}');
          const fields = ['power_source','cooling_capacity','cooling_input_power','nominal_cooling_current',
            'max_input_consumption','max_current','starting_current','compressor_type',
            'indoor_airflow','indoor_noise','refrigerant_type','design_pressure','operating_temp','ambient_temp_cooling'];
          fields.forEach(f => {
            const el = document.getElementById('edit-' + f);
            if (el) el.value = ts[f] || '';
          });
        } catch(e) {}
        document.getElementById('edit-product-modal').classList.remove('hidden');
      }

      let addFeatures = [];
      let editFeatures = [];

      function renderFeatures(features, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = features.map((f, i) => 
          \`<span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center space-x-1">
            <span>\${_esc(f)}</span>
            <button type="button" onclick="removeFeature('\${containerId}', \${i})" class="hover:text-red-600 font-bold">&times;</button>
          </span>\`
        ).join('');
        
        const mode = containerId.includes('add') ? 'add' : 'edit';
        const features_list = mode === 'add' ? addFeatures : editFeatures;
        document.querySelector(\`#features-\${mode} .features-input\`).value = JSON.stringify(features_list);
      }

      function addFeatureToAdd() {
        const input = document.getElementById('features-add-input');
        const value = input.value.trim();
        if (value && !addFeatures.includes(value)) {
          addFeatures.push(value);
          renderFeatures(addFeatures, 'features-add-tags');
          input.value = '';
        }
      }

      function addFeatureToEdit() {
        const input = document.getElementById('features-edit-input');
        const value = input.value.trim();
        if (value && !editFeatures.includes(value)) {
          editFeatures.push(value);
          renderFeatures(editFeatures, 'features-edit-tags');
          input.value = '';
        }
      }

      function removeFeature(containerId, index) {
        const mode = containerId.includes('add') ? 'add' : 'edit';
        const features_list = mode === 'add' ? addFeatures : editFeatures;
        features_list.splice(index, 1);
        renderFeatures(features_list, containerId);
      }

      function loadFeaturesForEdit(featuresJson) {
        editFeatures = JSON.parse(featuresJson || '[]');
        renderFeatures(editFeatures, 'features-edit-tags');
      }

      // ===== MEDIA UPLOAD MANAGEMENT =====
      window.addMediaArray = [];
      window.editMediaArray = [];

      function toggleMediaSectionAdd() {
        document.getElementById('media-add-section').classList.toggle('hidden');
      }

      function toggleMediaSectionEdit() {
        document.getElementById('media-edit-section').classList.toggle('hidden');
      }

      function compressImage(file) {
        return new Promise((resolve) => {
          if (!file.type.startsWith('image/')) {
            resolve(file); 
            return;
          }
          
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              
              // Max 1200px width
              if (width > 1200) {
                height = Math.round((height * 1200) / width);
                width = 1200;
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              
              // Convert to blob with quality 0.7 for jpeg
              canvas.toBlob((blob) => {
                resolve(blob);
              }, 'image/jpeg', 0.7);
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        });
      }

      function validateMediaFile(file) {
        const maxImageSize = 10 * 1024 * 1024; // 10 MB
        const maxVideoSize = 50 * 1024 * 1024; // 50 MB
        const maxSize = file.type.startsWith('video/') ? maxVideoSize : maxImageSize;
        
        if (file.size > maxSize) {
          const typeName = file.type.startsWith('video/') ? 'Vidéo' : 'Image';
          const maxSizeMB = Math.round(maxSize / (1024 * 1024));
          showToast(typeName + ' trop volumineux. Max: ' + maxSizeMB + ' MB (fichier: ' + Math.round(file.size / (1024 * 1024)) + ' MB)', 'warning');
          return false;
        }
        return true;
      }

      function previewMediaAdd() {
        const input = document.getElementById('media-add-input');
        const previewContainer = document.getElementById('media-add-preview');
        previewContainer.innerHTML = '';
        window.addMediaArray = [];

        if (!input.files || input.files.length === 0) return;

        Array.from(input.files).slice(0, 10).forEach((file, idx) => {
          // Validate file size
          if (!validateMediaFile(file)) {
            return;
          }

          if (file.type.startsWith('image/')) {
            compressImage(file).then(compressedFile => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const mediaItem = {
                  type: 'image',
                  url: e.target.result,
                  caption: ''
                };
                window.addMediaArray.push(mediaItem);
                document.getElementById('add-media-json').value = JSON.stringify(window.addMediaArray);

                const thumb = document.createElement('div');
                thumb.className = 'relative rounded-lg overflow-hidden group';
                thumb.style.aspectRatio = '1/1';
                thumb.style.background = '#0a1628';
                thumb.innerHTML = '<img src="' + e.target.result + '" class="w-full h-full object-cover" />' +
                  '<button type="button" onclick="removeMediaAdd(' + (window.addMediaArray.length - 1) + ')" class="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">&times;</button>' +
                  '<span class="absolute bottom-1 left-1 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">IMG</span>';
                previewContainer.appendChild(thumb);
              };
              reader.readAsDataURL(compressedFile);
            });
          } else {
            const reader = new FileReader();
            reader.onload = (e) => {
              const mediaItem = {
                type: 'video',
                url: e.target.result,
                caption: ''
              };
              window.addMediaArray.push(mediaItem);
              document.getElementById('add-media-json').value = JSON.stringify(window.addMediaArray);

              const thumb = document.createElement('div');
              thumb.className = 'relative rounded-lg overflow-hidden group';
              thumb.style.aspectRatio = '1/1';
              thumb.style.background = '#0a1628';
              thumb.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#000;"><i class="fas fa-play" style="color:#38bdf8;font-size:1.5rem;"></i></div>' +
                '<button type="button" onclick="removeMediaAdd(' + (window.addMediaArray.length - 1) + ')" class="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">&times;</button>' +
                '<span class="absolute bottom-1 left-1 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">VID</span>';
              previewContainer.appendChild(thumb);
            };
            reader.readAsDataURL(file);
          }
        });
      }

      // Rendu centralisé des miniatures du modal d'édition.
      // TOUTES les modifications (ajout, suppression, chargement initial) passent ici.
      // Utilise exclusivement l'API DOM — jamais innerHTML avec des données utilisateur.
      function renderEditMediaThumbs() {
        var previewContainer = document.getElementById('media-edit-preview');
        if (!previewContainer) return;
        previewContainer.innerHTML = '';
        window.editMediaArray.forEach(function(item, idx) {
          var thumb = document.createElement('div');
          thumb.className = 'relative rounded-lg overflow-hidden group';
          thumb.style.cssText = 'aspect-ratio:1/1; background:#0a1628;';
          if (item.type === 'image') {
            var img = document.createElement('img');
            img.src = item.url;
            img.className = 'w-full h-full object-cover';
            thumb.appendChild(img);
          } else {
            var vidBox = document.createElement('div');
            vidBox.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#000;';
            var icon = document.createElement('i');
            icon.className = 'fas fa-play';
            icon.style.cssText = 'color:#38bdf8;font-size:1.5rem;';
            vidBox.appendChild(icon);
            thumb.appendChild(vidBox);
          }
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs';
          btn.textContent = '\u00d7';
          btn.addEventListener('click', (function(i) { return function() { removeMediaEdit(i); }; })(idx));
          var badge = document.createElement('span');
          badge.className = 'absolute bottom-1 left-1 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded';
          badge.textContent = item.type === 'image' ? 'IMG' : 'VID';
          thumb.appendChild(btn);
          thumb.appendChild(badge);
          previewContainer.appendChild(thumb);
        });
      }

      function previewMediaEdit() {
        var input = document.getElementById('media-edit-input');
        if (!input.files || input.files.length === 0) return;
        // CORRIGÉ : on ne réinitialise PAS editMediaArray — les médias existants
        // sont conservés, les nouveaux fichiers sont ajoutés par-dessus.
        Array.from(input.files).slice(0, 10).forEach(function(file) {
          if (!validateMediaFile(file)) return;
          if (file.type.startsWith('image/')) {
            compressImage(file).then(function(compressedFile) {
              var reader = new FileReader();
              reader.onload = function(e) {
                window.editMediaArray.push({ type: 'image', url: e.target.result, caption: '' });
                document.getElementById('edit-media-json').value = JSON.stringify(window.editMediaArray);
                renderEditMediaThumbs();
              };
              reader.readAsDataURL(compressedFile);
            });
          } else {
            var reader = new FileReader();
            reader.onload = function(e) {
              window.editMediaArray.push({ type: 'video', url: e.target.result, caption: '' });
              document.getElementById('edit-media-json').value = JSON.stringify(window.editMediaArray);
              renderEditMediaThumbs();
            };
            reader.readAsDataURL(file);
          }
        });
        input.value = '';
      }

      function removeMediaAdd(index) {
        window.addMediaArray.splice(index, 1);
        document.getElementById('add-media-json').value = JSON.stringify(window.addMediaArray);
        previewMediaAdd();
      }

      function removeMediaEdit(index) {
        window.editMediaArray.splice(index, 1);
        document.getElementById('edit-media-json').value = JSON.stringify(window.editMediaArray);
        // CORRIGÉ : appel direct à renderEditMediaThumbs, PAS previewMediaEdit
        renderEditMediaThumbs();
      }

      function loadMediaForEdit(mediaJson) {
        window.editMediaArray = JSON.parse(mediaJson || '[]');
        document.getElementById('edit-media-json').value = JSON.stringify(window.editMediaArray);
        renderEditMediaThumbs();
      }
    `}} />

    {/* ===== MODAL GALERIE PRODUIT ===== */}
    <div id="gallery-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.75); backdrop-filter:blur(4px);">
      <div class="w-full max-w-2xl rounded-2xl p-6 shadow-2xl" style="background:var(--admin-card-bg); border:1px solid rgba(14,165,233,0.2);">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg flex items-center gap-2" style="color:var(--admin-text-primary);">
            <i class="fas fa-images" style="color:var(--admin-accent);"></i>
            <span>Galerie photos — <span id="gallery-modal-name"></span></span>
          </h3>
          <button type="button" onclick="closeGalleryModal()" class="text-xl" style="color:var(--admin-text-muted);">&times;</button>
        </div>
        <label class="cursor-pointer block border-2 border-dashed rounded-xl p-4 text-center hover:border-cyan-400 transition-all mb-4" style="border-color:rgba(14,165,233,0.3);">
          <i class="fas fa-cloud-upload-alt text-cyan-400 text-2xl mb-1"></i>
          <p class="text-sm text-cyan-400 font-semibold">Cliquer pour ajouter des photos</p>
          <p class="text-xs mt-0.5" style="color:var(--admin-text-muted)">JPG, PNG, WebP — max 5 MB chacune — plusieurs fichiers acceptés</p>
          <input type="file" id="gallery-file-input" accept="image/*" multiple class="hidden" onchange="handleGalleryUpload(this)" />
        </label>
        <div id="gallery-uploading" class="hidden mb-3 text-xs text-cyan-400 text-center">
          <i class="fas fa-spinner fa-spin mr-1"></i>Upload en cours...
        </div>
        <div id="gallery-grid" class="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto"></div>
        <p id="gallery-empty" class="hidden text-center text-gray-500 text-sm py-6">Aucune photo dans la galerie</p>
        <div class="flex justify-end mt-4">
          <button type="button" onclick="closeGalleryModal()" class="px-4 py-2 rounded-xl text-sm font-semibold" style="background:rgba(255,255,255,0.06); color:#94a3b8;">Fermer</button>
        </div>
      </div>
    </div>
    <script dangerouslySetInnerHTML={{ __html: `
      var _galleryProdId = null;

      function openGalleryModal(productId, productName) {
        _galleryProdId = productId;
        document.getElementById('gallery-modal-name').textContent = productName || ('Produit #' + productId);
        document.getElementById('gallery-modal').classList.remove('hidden');
        loadGallery(productId);
      }

      function closeGalleryModal() {
        document.getElementById('gallery-modal').classList.add('hidden');
        _galleryProdId = null;
      }

      function loadGallery(productId) {
        fetch('/api/admin/produit/gallery/' + productId)
          .then(function(r){ return r.json(); })
          .then(function(d){ renderGallery(d.gallery || []); })
          .catch(function(){ renderGallery([]); });
      }

      function renderGallery(gallery) {
        var grid = document.getElementById('gallery-grid');
        var empty = document.getElementById('gallery-empty');
        grid.innerHTML = '';
        if (!gallery.length) { empty.classList.remove('hidden'); return; }
        empty.classList.add('hidden');
        gallery.forEach(function(item, idx) {
          var div = document.createElement('div');
          div.className = 'relative group rounded-xl overflow-hidden';
          div.style.cssText = 'aspect-ratio:1/1;background:#0a1628;';
          var img = document.createElement('img');
          img.src = item.url;
          img.className = 'w-full h-full object-cover';
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity';
          btn.innerHTML = '<i class="fas fa-trash" style="font-size:0.6rem;"></i>';
          btn.onclick = function(){ removeGalleryImg(item.url, item.deleteUrl || ''); };
          div.appendChild(img);
          div.appendChild(btn);
          grid.appendChild(div);
        });
      }

      function handleGalleryUpload(input) {
        var files = Array.from(input.files);
        if (!files.length) return;
        var upl = document.getElementById('gallery-uploading');
        upl.classList.remove('hidden');
        var done = 0;
        var lastGallery = null;
        files.forEach(function(file) {
          var fd = new FormData();
          fd.append('id', String(_galleryProdId));
          fd.append('image', file);
          fetch('/api/admin/produit/gallery/add', { method: 'POST', body: fd })
            .then(function(r){ return r.json(); })
            .then(function(d){
              if (d.gallery) lastGallery = d.gallery;
              done++;
              if (done === files.length) {
                upl.classList.add('hidden');
                input.value = '';
                if (lastGallery) renderGallery(lastGallery);
                else loadGallery(_galleryProdId);
              }
            })
            .catch(function(){
              done++;
              if (done === files.length) { upl.classList.add('hidden'); input.value = ''; }
            });
        });
      }

      function removeGalleryImg(url, deleteUrl) {
        if (!confirm('Supprimer cette photo de la galerie ?')) return;
        var fd = new FormData();
        fd.append('id', String(_galleryProdId));
        fd.append('url', url);
        fd.append('delete_url', deleteUrl);
        fetch('/api/admin/produit/gallery/remove', { method: 'POST', body: fd })
          .then(function(r){ return r.json(); })
          .then(function(d){ if (d.gallery) renderGallery(d.gallery); })
          .catch(function(){ alert('Erreur suppression'); });
      }

      document.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-gallery-id]');
        if (!btn) return;
        var id = parseInt(btn.getAttribute('data-gallery-id'));
        var row = btn.closest('tr');
        var nameEl = row ? row.querySelector('td .font-semibold') : null;
        openGalleryModal(id, nameEl ? nameEl.textContent : '');
      });
    ` }} />
    {/* Import en masse — Produits (tableur quelconque) */}
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    <div id="modal-import-masse" class="hidden fixed inset-0 bg-black/60 z-50 items-center justify-center p-4">
      <div class="w-full max-w-6xl rounded-2xl p-6 shadow-2xl max-h-[88vh] overflow-y-auto" style="background:var(--admin-card-bg); border:1px solid rgba(168,85,247,0.15);">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold flex items-center gap-2" style="color:var(--admin-text-primary);">
            <span class="h-2 w-2 rounded-full bg-purple-400"></span>
            Import en masse — Produits
          </h2>
          <button id="btn-fermer-import-masse" class="text-xl" style="color:var(--admin-text-muted);">&times;</button>
        </div>

        <ol class="flex flex-wrap items-center gap-2 mb-5 text-xs">
          <li data-puce="1" class="px-3 py-1 rounded-full">1. Fichier</li>
          <li data-puce="2" class="px-3 py-1 rounded-full">2. Correspondance</li>
          <li data-puce="3" class="px-3 py-1 rounded-full">3. Aperçu</li>
          <li data-puce="4" class="px-3 py-1 rounded-full">4. Résultat</li>
        </ol>

        {/* Étape 1 — fichier */}
        <section data-etape="1">
          <div id="zone-depot" class="rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors" style="border-color:rgba(168,85,247,0.3);">
            <p class="text-sm mb-1" style="color:var(--admin-text-primary)">Glisse ton fichier <span class="font-medium" style="color:var(--admin-accent)">.xlsx</span>, <span class="font-medium" style="color:var(--admin-accent)">.xls</span> ou <span class="font-medium" style="color:var(--admin-accent)">.csv</span> ici, ou clique pour parcourir</p>
            <p class="text-xs" style="color:var(--admin-text-muted)">N'importe quel tableau fournisseur convient : les colonnes sont reconnues automatiquement, aucun format n'est imposé.</p>
            <input id="input-fichier" type="file" accept=".xlsx,.xls,.csv" class="hidden" />
          </div>
          <div class="mt-3 flex items-center justify-between gap-3 flex-wrap">
            <button id="btn-modele" type="button" class="text-xs text-purple-300 hover:text-purple-200 underline">Télécharger un modèle (simple commodité)</button>
            <div id="choix-feuille" class="hidden text-xs text-gray-400 flex items-center gap-2">
              <label for="select-feuille">Feuille :</label>
              <select id="select-feuille" class="input-field text-xs w-auto"></select>
            </div>
          </div>
          <div id="etat-lecture" class="hidden mt-4 rounded-xl p-3 text-xs"></div>
        </section>

        {/* Étape 2 — correspondance des colonnes */}
        <section data-etape="2" class="hidden">
          <div class="flex items-start justify-between gap-3 flex-wrap mb-3">
            <p class="text-xs text-gray-400 max-w-md">Voici ce que le système a compris de chaque colonne. Corrige si besoin — toute modification relance l'analyse.</p>
            <div class="text-xs text-gray-400 flex items-center gap-2">
              <label for="input-entete">Ligne d'en-tête :</label>
              <input id="input-entete" type="number" min="0" class="input-field text-xs w-20" />
              <span class="text-gray-600">0 = aucune</span>
            </div>
          </div>
          <div class="max-h-80 overflow-auto rounded-xl" style="border:1px solid rgba(148,163,184,0.15);">
            <table class="w-full text-xs text-left">
              <thead class="sticky top-0" style="background:#f1f5f9; color: var(--admin-text-muted)">
                <tr>
                  <th class="px-3 py-2">Colonne du fichier</th>
                  <th class="px-3 py-2">Exemples</th>
                  <th class="px-3 py-2">Champ MAASGA</th>
                  <th class="px-3 py-2">Détection</th>
                </tr>
              </thead>
              <tbody id="tbody-mapping" class="divide-y" style="border-color: var(--admin-border); color: var(--admin-text-primary)"></tbody>
            </table>
          </div>
          <div id="alertes-analyse" class="mt-3 space-y-1 text-xs"></div>
          <div class="mt-4 flex items-center justify-end gap-3">
            <button id="btn-retour-1" class="rounded-xl px-4 py-2 text-sm" style="color:var(--admin-text-muted)">Retour</button>
            <button id="btn-vers-apercu" class="rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500">Voir l'aperçu</button>
          </div>
        </section>

        {/* Étape 3 — aperçu enrichi */}
        <section data-etape="3" class="hidden">
          <div id="resume-import" class="mb-3 text-sm"></div>
          <div class="flex items-center justify-between gap-3 flex-wrap mb-3 text-xs text-gray-400">
            <div class="flex items-center gap-3 flex-wrap">
              <span class="text-gray-500">Origine de chaque valeur :</span>
              <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full inline-block" style="background:#94a3b8;"></span>fichier</span>
              <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full inline-block" style="background:#60a5fa;"></span>déduit</span>
              <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full inline-block" style="background:#475569;"></span>défaut</span>
            </div>
            <div class="flex items-center gap-2">
              <label for="select-strategie">Produit déjà au catalogue :</label>
              <select id="select-strategie" class="input-field text-xs w-auto">
                <option value="maj">Mettre à jour la fiche</option>
                <option value="ignorer">Laisser inchangée</option>
                <option value="creer">Créer une fiche de plus</option>
              </select>
            </div>
          </div>
          <div class="max-h-80 overflow-auto rounded-xl" style="border:1px solid rgba(148,163,184,0.15);">
            <table class="w-full text-xs text-left whitespace-nowrap">
              <thead class="sticky top-0" style="background:#f1f5f9; color: var(--admin-text-muted)">
                <tr>
                  <th class="px-3 py-2">Ligne</th>
                  <th class="px-3 py-2">Nom</th>
                  <th class="px-3 py-2">Marque</th>
                  <th class="px-3 py-2">Catégorie</th>
                  <th class="px-3 py-2">BTU</th>
                  <th class="px-3 py-2">Prix FCFA</th>
                  <th class="px-3 py-2">Stock</th>
                  <th class="px-3 py-2">Surfaces m²</th>
                  <th class="px-3 py-2">Classe</th>
                  <th class="px-3 py-2">Inverter</th>
                  <th class="px-3 py-2">Modèle</th>
                  <th class="px-3 py-2">Prix gros.</th>
                  <th class="px-3 py-2">Dispo</th>
                  <th class="px-3 py-2">Description</th>
                  <th class="px-3 py-2">Mentions</th>
                  <th class="px-3 py-2">Réfrigérant</th>
                  <th class="px-3 py-2">Compresseur</th>
                  <th class="px-3 py-2">Garantie</th>
                  <th class="px-3 py-2">État</th>
                </tr>
              </thead>
              <tbody id="tbody-apercu" class="divide-y" style="border-color: var(--admin-border); color: var(--admin-text-primary)"></tbody>
            </table>
          </div>
          <div id="barre-progression" class="hidden mt-3">
            <div class="h-1.5 w-full rounded-full overflow-hidden" style="background:rgba(148,163,184,0.15);">
              <div id="jauge-progression" class="h-1.5 rounded-full bg-purple-500 transition-all" style="width:0%"></div>
            </div>
            <p id="texte-progression" class="mt-1 text-xs text-gray-400"></p>
          </div>
          <div class="mt-4 flex items-center justify-end gap-3">
            <button id="btn-retour-2" class="rounded-xl px-4 py-2 text-sm" style="color:var(--admin-text-muted)">Retour</button>
            <button id="btn-confirmer-import" class="rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed">Confirmer l'import</button>
          </div>
        </section>

        {/* Étape 4 — résultat */}
        <section data-etape="4" class="hidden">
          <div id="zone-resultat" class="rounded-xl p-4 text-sm"></div>
          <div id="detail-resultat" class="mt-3 max-h-64 overflow-auto text-xs text-gray-300 space-y-1"></div>
          <div class="mt-4 flex items-center justify-end gap-3">
            <button id="btn-nouvel-import" class="rounded-xl px-4 py-2 text-sm" style="color:var(--admin-text-muted)">Importer un autre fichier</button>
            <button id="btn-terminer-import" class="rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500">Terminer</button>
          </div>
        </section>
      </div>
    </div>
    <script dangerouslySetInnerHTML={{__html: `
      (function () {
        // Aucun _esc ici : toutes les cellules sont construites avec
        // createElement + textContent, jamais par concatenation de HTML — le
        // contenu d'un tableur fournisseur est une entree non fiable.
        // Referentiels injectes depuis le moteur serveur (src/utils/importProduits.ts) :
        // aucune copie cote navigateur, donc aucune divergence possible.
        var LIBELLES_CHAMPS = ${jsonForScript(LIBELLES_CHAMPS)};
        var COLONNES_MODELE = ${jsonForScript(COLONNES_MODELE)};
        var CATEGORIES = ${jsonForScript(CATEGORIES)};
        var MAX_LOT = ${jsonForScript(MAX_LIGNES_PAR_LOT)};
        var COULEURS_ORIGINE = { fichier: '#94a3b8', deduit: '#60a5fa', defaut: '#475569' };
        var TITRES_ORIGINE = {
          fichier: 'Valeur lue dans le fichier',
          deduit: 'Déduit du libellé',
          defaut: 'Valeur par défaut (aucune donnée dans le fichier)'
        };

        var modal = document.getElementById('modal-import-masse');
        var btnOuvrir = document.getElementById('btn-ouvrir-import-masse');
        if (!modal || !btnOuvrir) return;

        var zoneDepot = document.getElementById('zone-depot');
        var inputFichier = document.getElementById('input-fichier');
        var choixFeuille = document.getElementById('choix-feuille');
        var selectFeuille = document.getElementById('select-feuille');
        var etatLecture = document.getElementById('etat-lecture');
        var inputEntete = document.getElementById('input-entete');
        var tbodyMapping = document.getElementById('tbody-mapping');
        var alertesAnalyse = document.getElementById('alertes-analyse');
        var resumeImport = document.getElementById('resume-import');
        var selectStrategie = document.getElementById('select-strategie');
        var tbodyApercu = document.getElementById('tbody-apercu');
        var barreProgression = document.getElementById('barre-progression');
        var jaugeProgression = document.getElementById('jauge-progression');
        var texteProgression = document.getElementById('texte-progression');
        var btnConfirmer = document.getElementById('btn-confirmer-import');
        var zoneResultat = document.getElementById('zone-resultat');
        var detailResultat = document.getElementById('detail-resultat');

        var classeur = null;
        var etat = neutre();

        function neutre() {
          return {
            lignes: [], feuille: '', indexEntete: null, detection: [], mapping: {},
            corrections: {}, produits: [], avertissements: [], resume: null, occupe: false
          };
        }

        // ---------- navigation ----------

        function montrerEtape(n) {
          var sections = modal.querySelectorAll('[data-etape]');
          for (var i = 0; i < sections.length; i++) {
            sections[i].classList.toggle('hidden', sections[i].getAttribute('data-etape') !== String(n));
          }
          var puces = modal.querySelectorAll('[data-puce]');
          for (var j = 0; j < puces.length; j++) {
            var num = Number(puces[j].getAttribute('data-puce'));
            var actif = num === n;
            var fait = num < n;
            puces[j].style.background = actif ? 'rgba(168,85,247,0.18)' : (fait ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.08)');
            puces[j].style.color = actif ? '#d8b4fe' : (fait ? '#6ee7b7' : '#94a3b8');
          }
        }

        function ouvrirModal() { modal.classList.remove('hidden'); modal.classList.add('flex'); montrerEtape(1); }
        function fermerModal() { modal.classList.add('hidden'); modal.classList.remove('flex'); }

        function reinitialiser() {
          classeur = null;
          etat = neutre();
          inputFichier.value = '';
          choixFeuille.classList.add('hidden');
          etatLecture.classList.add('hidden');
          tbodyMapping.textContent = '';
          tbodyApercu.textContent = '';
          alertesAnalyse.textContent = '';
          resumeImport.textContent = '';
          detailResultat.textContent = '';
          barreProgression.classList.add('hidden');
          montrerEtape(1);
        }

        function message(cible, texte, ton) {
          var fonds = {
            info: 'background:rgba(96,165,250,0.1); border:1px solid rgba(96,165,250,0.3); color:#93c5fd;',
            ok: 'background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); color:#6ee7b7;',
            erreur: 'background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#fca5a5;'
          };
          cible.classList.remove('hidden');
          cible.style.cssText = fonds[ton] || fonds.info;
          cible.textContent = texte;
        }

        // ---------- lecture du fichier ----------

        function lireFichier(fichier) {
          var reader = new FileReader();
          reader.onload = function (e) {
            try {
              classeur = XLSX.read(e.target.result, { type: 'array' });
            } catch (err) {
              message(etatLecture, 'Fichier illisible : ce n\\'est pas un tableur exploitable.', 'erreur');
              return;
            }
            if (!classeur.SheetNames || !classeur.SheetNames.length) {
              message(etatLecture, 'Ce fichier ne contient aucune feuille.', 'erreur');
              return;
            }
            selectFeuille.textContent = '';
            classeur.SheetNames.forEach(function (nom) {
              var opt = document.createElement('option');
              opt.value = nom;
              opt.textContent = nom;
              selectFeuille.appendChild(opt);
            });
            choixFeuille.classList.toggle('hidden', classeur.SheetNames.length < 2);
            chargerFeuille(classeur.SheetNames[0]);
          };
          reader.onerror = function () { message(etatLecture, 'Lecture du fichier impossible.', 'erreur'); };
          reader.readAsArrayBuffer(fichier);
        }

        // sheet_to_json en mode header:1 -> tableau de tableaux. Volontairement brut :
        // la détection d'en-tête et tout l'enrichissement restent côté serveur.
        function chargerFeuille(nom) {
          var feuille = classeur.Sheets[nom];
          if (!feuille) return;
          etat = neutre();
          etat.feuille = nom;
          etat.lignes = XLSX.utils.sheet_to_json(feuille, { header: 1, defval: '' });
          if (!etat.lignes.length) {
            message(etatLecture, 'La feuille "' + nom + '" est vide.', 'erreur');
            return;
          }
          selectFeuille.value = nom;
          analyser();
        }

        // ---------- analyse (serveur) ----------

        function poster(charge) {
          return fetch('/api/admin/produits/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(charge)
          }).then(function (r) { return r.json().catch(function () { return { succes: false, message: 'Réponse serveur illisible.' }; }); });
        }

        // Découpage en lots. L'en-tête est renvoyée avec chaque lot pour que le
        // serveur garde la main sur la détection, et decalageLigne conserve les
        // numéros de ligne du tableur d'origine — donc les clés de corrections.
        function lots() {
          var idx = etat.indexEntete === null ? -1 : etat.indexEntete;
          var entete = idx >= 0 ? etat.lignes.slice(0, idx + 1) : [];
          var donnees = etat.lignes.slice(idx >= 0 ? idx + 1 : 0);
          var sortie = [];
          for (var i = 0; i < donnees.length; i += MAX_LOT) {
            sortie.push({ lignes: entete.concat(donnees.slice(i, i + MAX_LOT)), decalageLigne: i });
          }
          if (!sortie.length) sortie.push({ lignes: etat.lignes.slice(0), decalageLigne: 0 });
          return sortie;
        }

        function analyser() {
          if (etat.occupe || !etat.lignes.length) return Promise.resolve();
          etat.occupe = true;
          message(etatLecture, 'Analyse du fichier…', 'info');

          // Passe de découverte : elle seule détecte la ligne d'en-tête et propose
          // un mapping. Les lots suivants reçoivent ce mapping explicitement, pour
          // que tous les lots interprètent les colonnes de la même façon.
          var decouverte = etat.indexEntete !== null
            ? Promise.resolve(null)
            : poster({ mode: 'analyse', feuille: etat.feuille, lignes: etat.lignes.slice(0, 120) });

          return decouverte.then(function (rep) {
            if (rep) {
              if (!rep.succes) throw new Error(rep.message || 'Analyse impossible.');
              etat.indexEntete = rep.indexEntete;
              etat.detection = rep.colonnes || [];
              etat.mapping = {};
              etat.detection.forEach(function (col) { etat.mapping[String(col.index)] = col.champ; });
            }
            var tranches = lots();
            var produits = [];
            var resume = { total: 0, aCreer: 0, aMettreAJour: 0, enErreur: 0 };
            var avertissements = [];
            var chaine = Promise.resolve();
            tranches.forEach(function (tranche, i) {
              chaine = chaine.then(function () {
                return poster({
                  mode: 'analyse',
                  feuille: etat.feuille,
                  lignes: tranche.lignes,
                  decalageLigne: tranche.decalageLigne,
                  indexEntete: etat.indexEntete,
                  mapping: etat.mapping,
                  corrections: etat.corrections
                }).then(function (r) {
                  if (!r.succes) throw new Error(r.message || 'Analyse impossible.');
                  produits = produits.concat(r.produits || []);
                  if (r.resume) {
                    resume.total += r.resume.total; resume.aCreer += r.resume.aCreer;
                    resume.aMettreAJour += r.resume.aMettreAJour; resume.enErreur += r.resume.enErreur;
                  }
                  if (i === 0) avertissements = r.avertissements || [];
                });
              });
            });
            return chaine.then(function () {
              etat.produits = produits;
              etat.resume = resume;
              etat.avertissements = avertissements;
              rendreLecture();
              rendreMapping();
              rendreApercu();
              montrerEtape(2);
            });
          }).catch(function (err) {
            message(etatLecture, (err && err.message) || 'Analyse impossible.', 'erreur');
            montrerEtape(1);
          }).then(function () { etat.occupe = false; });
        }

        function rendreLecture() {
          var bouts = ['Feuille "' + etat.feuille + '"'];
          bouts.push(etat.indexEntete >= 0 ? 'en-tête ligne ' + (etat.indexEntete + 1) : 'aucune en-tête détectée');
          bouts.push(etat.produits.length + ' ligne(s) de données');
          message(etatLecture, bouts.join(' · '), 'ok');
          inputEntete.value = String(etat.indexEntete >= 0 ? etat.indexEntete + 1 : 0);
        }

        // ---------- étape 2 : correspondance ----------

        function rendreMapping() {
          tbodyMapping.textContent = '';
          etat.detection.forEach(function (col) {
            var tr = document.createElement('tr');
            tr.appendChild(cellule(col.entete || '(colonne ' + (col.index + 1) + ')', 'px-3 py-2 text-white'));
            tr.appendChild(cellule((col.echantillon || []).join(' · ') || '—', 'px-3 py-2 text-gray-400'));

            var tdSelect = document.createElement('td');
            tdSelect.className = 'px-3 py-2';
            var select = document.createElement('select');
            select.className = 'rounded-lg px-2 py-1 text-xs text-white';
            select.style.cssText = 'background:#0b1220; border:1px solid rgba(148,163,184,0.2);';
            var vide = document.createElement('option');
            vide.value = '';
            vide.textContent = 'Ignorer cette colonne';
            select.appendChild(vide);
            LIBELLES_CHAMPS.forEach(function (paire) {
              var opt = document.createElement('option');
              opt.value = paire[0];
              opt.textContent = paire[1];
              select.appendChild(opt);
            });
            var choisi = etat.mapping[String(col.index)];
            select.value = choisi ? choisi : '';
            select.addEventListener('change', function () {
              etat.mapping[String(col.index)] = select.value || null;
              analyser();
            });
            tdSelect.appendChild(select);
            tr.appendChild(tdSelect);

            var impose = (etat.mapping[String(col.index)] || null) !== (col.champ || null);
            var libelles = { exacte: 'intitulé reconnu', approchee: 'intitulé proche', contenu: 'déduit du contenu', aucune: 'non reconnue' };
            var couleurs = { exacte: '#6ee7b7', approchee: '#93c5fd', contenu: '#fcd34d', aucune: '#94a3b8' };
            var tdConf = document.createElement('td');
            tdConf.className = 'px-3 py-2';
            var span = document.createElement('span');
            span.textContent = impose ? 'choix manuel' : (libelles[col.confiance] || col.confiance);
            span.style.color = impose ? '#d8b4fe' : (couleurs[col.confiance] || '#94a3b8');
            tdConf.appendChild(span);
            tr.appendChild(tdConf);

            tbodyMapping.appendChild(tr);
          });

          alertesAnalyse.textContent = '';
          etat.avertissements.forEach(function (a) {
            var p = document.createElement('p');
            p.className = 'text-amber-300';
            p.textContent = '· ' + a;
            alertesAnalyse.appendChild(p);
          });
        }

        // ---------- étape 3 : aperçu enrichi ----------

        function cellule(texte, classes) {
          var td = document.createElement('td');
          td.className = classes || 'px-3 py-2';
          td.textContent = texte === null || texte === undefined || texte === '' ? '—' : String(texte);
          return td;
        }

        function pastille(origine) {
          var point = document.createElement('span');
          point.className = 'h-1.5 w-1.5 rounded-full inline-block ml-1 align-middle';
          point.style.background = COULEURS_ORIGINE[origine] || 'transparent';
          point.title = TITRES_ORIGINE[origine] || '';
          return point;
        }

        // Cellule éditable : la correction est envoyée au serveur dans
        // « corrections » et relance l'analyse, donc l'aperçu reste exactement ce
        // qui sera écrit.
        function celluleEditable(produit, champ, type) {
          var td = document.createElement('td');
          td.className = 'px-3 py-2';
          var valeur = produit.champs[champ];
          var controle;
          if (champ === 'categorie') {
            controle = document.createElement('select');
            var connues = CATEGORIES.slice(0);
            if (valeur && connues.indexOf(valeur) === -1) connues.push(valeur);
            connues.forEach(function (cat) {
              var opt = document.createElement('option');
              opt.value = cat;
              opt.textContent = cat;
              controle.appendChild(opt);
            });
            controle.value = valeur || '';
          } else if (champ === 'disponible') {
            controle = document.createElement('select');
            ['oui', 'non'].forEach(function (label) {
              var opt = document.createElement('option');
              opt.value = label;
              opt.textContent = label;
              controle.appendChild(opt);
            });
            controle.value = valeur ? 'oui' : 'non';
            controle.className = 'rounded-lg px-2 py-1 text-xs text-white w-20';
            controle.style.cssText = 'background:#0b1220; border:1px solid rgba(148,163,184,0.2);';
          } else {
            controle = document.createElement('input');
            controle.type = type || 'text';
            controle.value = valeur === null || valeur === undefined ? '' : String(valeur);
          }
          if (champ !== 'disponible') {
            var largeur = (champ === 'modele' || champ === 'garantie') ? 'w-32'
              : champ === 'prixGrossisteFcfa' ? 'w-28'
              : (type === 'number' ? 'w-24' : 'w-44');
            controle.className = 'rounded-lg px-2 py-1 text-xs text-white ' + largeur;
            controle.style.cssText = 'background:#0b1220; border:1px solid rgba(148,163,184,0.2);';
          }
          controle.addEventListener('change', function () {
            var cle = String(produit.ligne);
            if (!etat.corrections[cle]) etat.corrections[cle] = {};
            etat.corrections[cle][champ] = controle.value;
            analyser();
          });
          td.appendChild(controle);
          td.appendChild(pastille(produit.origines[champ]));
          return td;
        }

        // Cellule en lecture seule avec troncature à 80 caractères et tooltip natif.
        function celluleTronquee(texte, origine) {
          var td = document.createElement('td');
          td.className = 'px-3 py-2';
          var s = (texte === null || texte === undefined || texte === '') ? '—' : String(texte);
          var affiche = s.length > 80 ? s.slice(0, 80) + '…' : s;
          td.textContent = affiche;
          if (s !== '—' && s.length > 80) td.title = s;
          if (origine) td.appendChild(pastille(origine));
          return td;
        }

        function rendreApercu() {
          tbodyApercu.textContent = '';
          etat.produits.forEach(function (p) {
            var tr = document.createElement('tr');
            if (p.erreurs && p.erreurs.length) tr.style.background = 'rgba(239,68,68,0.06)';

            tr.appendChild(cellule(p.ligne, 'px-3 py-2 text-gray-500'));
            tr.appendChild(celluleEditable(p, 'nom', 'text'));
            tr.appendChild(celluleEditable(p, 'marque', 'text'));
            tr.appendChild(celluleEditable(p, 'categorie', 'text'));
            tr.appendChild(celluleEditable(p, 'puissanceBtu', 'number'));
            tr.appendChild(celluleEditable(p, 'prixFcfa', 'number'));
            tr.appendChild(celluleEditable(p, 'stockInitial', 'number'));

            var tdSurf = cellule(p.champs.surfaceMin + ' – ' + p.champs.surfaceMax, 'px-3 py-2');
            tdSurf.appendChild(pastille(p.origines.surfaceMin));
            tr.appendChild(tdSurf);

            var tdClasse = cellule(p.champs.classeEnergie, 'px-3 py-2');
            tdClasse.appendChild(pastille(p.origines.classeEnergie));
            tr.appendChild(tdClasse);

            var tdInv = cellule(p.champs.inverter ? 'oui' : 'non', 'px-3 py-2');
            tdInv.appendChild(pastille(p.origines.inverter));
            tr.appendChild(tdInv);

            // --- Champs optionnels : éditables ---
            tr.appendChild(celluleEditable(p, 'modele', 'text'));
            tr.appendChild(celluleEditable(p, 'prixGrossisteFcfa', 'number'));
            tr.appendChild(celluleEditable(p, 'disponible', 'bool'));

            // --- Champs optionnels : lecture seule avec troncature ---
            tr.appendChild(celluleTronquee(p.champs.description, p.origines.description));
            var mentionsTexte = Array.isArray(p.champs.mentions) ? p.champs.mentions.join(', ') : (p.champs.mentions || '');
            tr.appendChild(celluleTronquee(mentionsTexte, p.origines.mentions));
            tr.appendChild(celluleTronquee(p.champs.refrigerant, p.origines.refrigerant));
            tr.appendChild(celluleTronquee(p.champs.compresseur, p.origines.compresseur));

            // --- Garantie : éditable ---
            tr.appendChild(celluleEditable(p, 'garantie', 'text'));

            var tdEtat = document.createElement('td');
            tdEtat.className = 'px-3 py-2 space-y-1';
            if (p.erreurs && p.erreurs.length) {
              tdEtat.appendChild(etiquette(p.erreurs.length + ' erreur(s)', '#fca5a5', 'rgba(239,68,68,0.12)', p.erreurs.join(' · ')));
            } else if (p.doublon) {
              tdEtat.appendChild(etiquette('mise à jour #' + p.doublon.id, '#d8b4fe', 'rgba(168,85,247,0.14)', 'Déjà au catalogue : ' + p.doublon.nom));
            } else {
              tdEtat.appendChild(etiquette('nouveau', '#6ee7b7', 'rgba(16,185,129,0.12)', 'Sera créé'));
            }
            if (p.alertes && p.alertes.length) {
              tdEtat.appendChild(etiquette('à vérifier', '#fcd34d', 'rgba(251,191,36,0.12)', p.alertes.join(' · ')));
            }
            tr.appendChild(tdEtat);

            tbodyApercu.appendChild(tr);
          });

          var r = etat.resume || { total: 0, aCreer: 0, aMettreAJour: 0, enErreur: 0 };
          resumeImport.textContent = '';
          var phrase = document.createElement('span');
          phrase.className = r.enErreur > 0 ? 'text-amber-300' : 'text-emerald-300';
          phrase.textContent = r.aCreer + ' à créer · ' + r.aMettreAJour + ' à mettre à jour'
            + (r.enErreur > 0 ? ' · ' + r.enErreur + ' ligne(s) non importable(s), ignorée(s)' : '');
          resumeImport.appendChild(phrase);
          btnConfirmer.disabled = (r.aCreer + r.aMettreAJour) === 0;
        }

        function etiquette(texte, couleur, fond, titre) {
          var span = document.createElement('span');
          span.className = 'inline-block rounded-full px-2 py-0.5';
          span.style.cssText = 'color:' + couleur + '; background:' + fond + ';';
          span.textContent = texte;
          if (titre) span.title = titre;
          return span;
        }

        // ---------- exécution ----------

        function executer() {
          if (etat.occupe) return;
          etat.occupe = true;
          btnConfirmer.disabled = true;
          var tranches = lots();
          var total = { crees: 0, misAJour: 0, ignorees: [], erreurs: [] };
          var echec = null;
          barreProgression.classList.toggle('hidden', tranches.length < 2);

          var chaine = Promise.resolve();
          tranches.forEach(function (tranche, i) {
            chaine = chaine.then(function () {
              if (echec) return;
              texteProgression.textContent = 'Lot ' + (i + 1) + ' sur ' + tranches.length + '…';
              jaugeProgression.style.width = Math.round((i / tranches.length) * 100) + '%';
              return poster({
                mode: 'execution',
                feuille: etat.feuille,
                lignes: tranche.lignes,
                decalageLigne: tranche.decalageLigne,
                indexEntete: etat.indexEntete,
                mapping: etat.mapping,
                corrections: etat.corrections,
                strategieDoublon: selectStrategie.value
              }).then(function (r) {
                total.crees += r.crees || 0;
                total.misAJour += r.misAJour || 0;
                total.ignorees = total.ignorees.concat(r.ignorees || []);
                total.erreurs = total.erreurs.concat(r.erreurs || []);
                // Un lot refusé n'écrit rien : on arrête plutôt que d'importer à moitié
                // sans le dire. Les lots déjà écrits sont rapportés tels quels.
                if (!r.succes && (r.crees || 0) + (r.misAJour || 0) === 0 && tranches.length > 1) {
                  echec = r.message || 'Lot ' + (i + 1) + ' refusé.';
                } else if (!r.succes && tranches.length === 1) {
                  echec = r.message || 'Import refusé.';
                }
              });
            });
          });

          chaine.then(function () {
            jaugeProgression.style.width = '100%';
            afficherResultat(total, echec);
          }).catch(function () {
            afficherResultat(total, 'Erreur réseau pendant l\\'import.');
          }).then(function () {
            etat.occupe = false;
            btnConfirmer.disabled = false;
          });
        }

        function afficherResultat(total, echec) {
          montrerEtape(4);
          var parts = [];
          if (total.crees) parts.push(total.crees + ' créé(s)');
          if (total.misAJour) parts.push(total.misAJour + ' mis à jour');
          if (total.ignorees.length) parts.push(total.ignorees.length + ' ignoré(s)');
          if (total.erreurs.length) parts.push(total.erreurs.length + ' en erreur');
          var ecrit = total.crees + total.misAJour;
          message(zoneResultat, echec ? echec : 'Import terminé : ' + (parts.join(', ') || 'rien à écrire') + '.', echec ? 'erreur' : (ecrit ? 'ok' : 'info'));

          detailResultat.textContent = '';
          total.erreurs.forEach(function (e) {
            var p = document.createElement('p');
            p.className = 'text-red-300';
            p.textContent = 'Ligne ' + e.ligne + ' : ' + (e.messages || []).join(' · ');
            detailResultat.appendChild(p);
          });
          total.ignorees.forEach(function (o) {
            var p = document.createElement('p');
            p.className = 'text-gray-400';
            p.textContent = 'Ligne ' + o.ligne + ' : ' + o.raison;
            detailResultat.appendChild(p);
          });
          if (ecrit > 0) {
            var p = document.createElement('p');
            p.className = 'text-gray-400 mt-2';
            p.textContent = 'Les photos restent à ajouter depuis chaque fiche produit.';
            detailResultat.appendChild(p);
          }
        }

        // ---------- modèle facultatif ----------

        // Généré à partir des mêmes intitulés que ceux reconnus par le serveur : le
        // modèle reste donc synchronisé par construction, contrairement au fichier
        // .xlsx auquel l'ancienne interface renvoyait et qui n'existait pas.
        function telechargerModele() {
          var entetes = COLONNES_MODELE.map(function (c) { return c[0]; });
          var exemple = COLONNES_MODELE.map(function (c) { return c[1]; });
          var feuille = XLSX.utils.aoa_to_sheet([entetes, exemple]);
          var wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, feuille, 'Produits');
          XLSX.writeFile(wb, 'modele_import_produits_MAASGA.xlsx');
        }

        // ---------- branchements ----------

        btnOuvrir.addEventListener('click', ouvrirModal);
        document.getElementById('btn-fermer-import-masse').addEventListener('click', fermerModal);
        document.getElementById('btn-modele').addEventListener('click', telechargerModele);
        document.getElementById('btn-retour-1').addEventListener('click', function () { montrerEtape(1); });
        document.getElementById('btn-vers-apercu').addEventListener('click', function () { montrerEtape(3); });
        document.getElementById('btn-retour-2').addEventListener('click', function () { montrerEtape(2); });
        document.getElementById('btn-nouvel-import').addEventListener('click', reinitialiser);
        document.getElementById('btn-terminer-import').addEventListener('click', function () {
          fermerModal();
          window.location.reload();
        });
        btnConfirmer.addEventListener('click', executer);
        selectFeuille.addEventListener('change', function () { chargerFeuille(selectFeuille.value); });

        // L'admin peut corriger une détection d'en-tête ratée : 0 = fichier sans en-tête.
        inputEntete.addEventListener('change', function () {
          var saisi = parseInt(inputEntete.value, 10);
          if (isNaN(saisi) || saisi < 0) saisi = 0;
          etat.indexEntete = saisi === 0 ? -1 : saisi - 1;
          etat.detection = [];
          etat.mapping = {};
          etat.corrections = {};
          // Nouvelle passe de découverte avec l'en-tête imposée.
          var impose = etat.indexEntete;
          etat.indexEntete = null;
          poster({ mode: 'analyse', feuille: etat.feuille, lignes: etat.lignes.slice(0, 120), indexEntete: impose })
            .then(function (rep) {
              if (!rep.succes) throw new Error(rep.message || 'Analyse impossible.');
              etat.indexEntete = impose;
              etat.detection = rep.colonnes || [];
              etat.mapping = {};
              etat.detection.forEach(function (col) { etat.mapping[String(col.index)] = col.champ; });
              return analyser();
            })
            .catch(function (err) { message(etatLecture, (err && err.message) || 'Analyse impossible.', 'erreur'); });
        });

        zoneDepot.addEventListener('click', function () { inputFichier.click(); });
        zoneDepot.addEventListener('dragover', function (e) { e.preventDefault(); zoneDepot.style.borderColor = 'rgba(168,85,247,0.6)'; });
        zoneDepot.addEventListener('dragleave', function () { zoneDepot.style.borderColor = 'rgba(168,85,247,0.3)'; });
        zoneDepot.addEventListener('drop', function (e) {
          e.preventDefault();
          zoneDepot.style.borderColor = 'rgba(168,85,247,0.3)';
          if (e.dataTransfer.files.length) lireFichier(e.dataTransfer.files[0]);
        });
        inputFichier.addEventListener('change', function (e) {
          if (e.target.files.length) lireFichier(e.target.files[0]);
        });

        montrerEtape(1);
      })();
    `}} />
  </AdminLayout>
)

// ============================================================
// PAGE RDV
// ============================================================
