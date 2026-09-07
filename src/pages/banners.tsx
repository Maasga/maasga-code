// Page admin : Gestion des bannieres du carrousel et des marques de l'accueil
// Accessible via GET /admin/banners (adminAuth)
// CRUD via POST /api/admin/banners/* et /api/admin/brands/*

export const AdminBannersPage = ({
  banners,
  brands,
  success,
  error,
}: {
  banners: any[]
  brands: any[]
  success?: string
  error?: string
}) => (
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Bannieres &amp; Marques - MAASGA Admin</title>
      <link rel="stylesheet" href="/static/tailwind.css" />
      <link rel="stylesheet" href="/static/admin-tokens.css" />
      <link rel="stylesheet" href="/static/style.css" />
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        .card { background: var(--admin-card-bg); border: 1px solid var(--admin-border); border-radius: 1rem; padding: 1.25rem; }
        .btn-danger { background: var(--admin-danger-light); color: var(--admin-danger); border: 1px solid rgba(220,38,38,0.25); padding: 0.375rem 0.875rem; border-radius: 0.625rem; font-size: 0.8rem; cursor: pointer; transition: opacity 0.15s; }
        .btn-danger:hover { opacity: 0.85; }
        .btn-edit { background: var(--admin-accent-light); color: var(--admin-accent); border: 1px solid rgba(3,105,161,0.25); padding: 0.375rem 0.875rem; border-radius: 0.625rem; font-size: 0.8rem; cursor: pointer; transition: opacity 0.15s; }
        .btn-edit:hover { opacity: 0.85; }
        .badge-active { background: var(--admin-success-light); color: var(--admin-success); border: 1px solid rgba(5,150,105,0.25); padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.72rem; font-weight: 600; }
        .badge-inactive { background: var(--admin-danger-light); color: var(--admin-danger); border: 1px solid rgba(220,38,38,0.2); padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.72rem; font-weight: 600; }
        .modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; align-items: center; justify-content: center; }
        .modal.open { display: flex; }
        .modal-box { background: var(--admin-card-bg); border: 1px solid var(--admin-border); border-radius: 1.25rem; padding: 1.75rem; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(15,23,42,0.12); }
        .preview-img { width: 100%; height: 120px; object-fit: cover; border-radius: 0.75rem; border: 1px solid var(--admin-border); margin-top: 0.5rem; background: var(--admin-bg); }
        .section-title { font-size: 1rem; font-weight: 700; color: var(--admin-accent); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
        .drag-handle { cursor: grab; color: var(--admin-text-muted); padding: 0 0.5rem; }
        .banner-row { background: var(--admin-bg); border: 1px solid var(--admin-border); border-radius: 0.75rem; transition: box-shadow 0.15s; }
        .banner-row:hover { box-shadow: var(--admin-shadow-card); }
        .form-label { display: block; font-size: 0.75rem; font-weight: 500; margin-bottom: 0.25rem; color: var(--admin-text-muted); }
        .cancel-btn { flex: 1; font-size: 0.875rem; color: var(--admin-text-muted); background: var(--admin-bg-elevated); border: 1px solid var(--admin-border); border-radius: 0.75rem; padding: 0.5rem; cursor: pointer; transition: background 0.15s; }
        .cancel-btn:hover { background: var(--admin-border); }
      `}} />
    </head>
    <body class="admin-ui min-h-screen" style="background: var(--admin-bg);">
      <div class="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold flex items-center gap-3" style="color: var(--admin-text-primary);">
              <i class="fas fa-images" style="color: var(--admin-accent);"></i>
              Bannieres &amp; Marques
            </h1>
            <p class="text-sm mt-1" style="color: var(--admin-text-muted);">Gestion du carrousel et de la barre de marques de l'application mobile</p>
          </div>
          <a href="/admin" class="text-sm flex items-center gap-1" style="color: var(--admin-accent);">
            <i class="fas fa-arrow-left text-xs"></i> Admin
          </a>
        </div>

        {/* Feedback */}
        {success && (
          <div class="mb-4 p-3 rounded-xl text-sm font-medium" style="background: var(--admin-success-light); border: 1px solid rgba(5,150,105,0.25); color: var(--admin-success);">
            <i class="fas fa-check-circle mr-2"></i>{success}
          </div>
        )}
        {error && (
          <div class="mb-4 p-3 rounded-xl text-sm font-medium" style="background: var(--admin-danger-light); border: 1px solid rgba(220,38,38,0.25); color: var(--admin-danger);">
            <i class="fas fa-exclamation-circle mr-2"></i>{error}
          </div>
        )}

        {/* SECTION BANNIERES */}
        <div class="card mb-6">
          <div class="flex items-center justify-between mb-4">
            <div class="section-title"><i class="fas fa-film"></i> Bannieres du carrousel ({banners.length})</div>
            <button class="btn-primary" onclick="document.getElementById('modal-add-banner').classList.add('open')">
              <i class="fas fa-plus mr-1"></i> Ajouter
            </button>
          </div>

          {banners.length === 0 ? (
            <p class="text-sm text-center py-6" style="color: var(--admin-text-muted);">Aucune banniere. Cliquez sur Ajouter pour creer la premiere.</p>
          ) : (
            <div class="space-y-3">
              {banners.map((b: any) => (
                <div class="banner-row flex items-center gap-4 p-3">
                  {/* Previsualisation */}
                  <img
                    src={b.image_url}
                    alt={b.title}
                    style="width:100px;height:56px;object-fit:cover;border-radius:0.5rem;flex-shrink:0;background:var(--admin-bg);"
                    onerror="this.style.background='var(--admin-bg-elevated)';this.src='';"
                  />
                  {/* Infos */}
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-sm truncate" style="color: var(--admin-text-primary);">{b.title}</div>
                    {b.subtitle && <div class="text-xs truncate" style="color: var(--admin-text-muted);">{b.subtitle}</div>}
                    <div class="flex items-center gap-2 mt-1 flex-wrap">
                      <span class={b.is_active ? 'badge-active' : 'badge-inactive'}>
                        {b.is_active ? 'Actif' : 'Masque'}
                      </span>
                      {b.target_page && (
                        <span class="text-xs px-2 py-0.5 rounded-full" style="color: var(--admin-accent); background: var(--admin-accent-light); border: 1px solid rgba(3,105,161,0.15);">
                          {b.target_page}
                        </span>
                      )}
                      <span class="text-xs" style="color: var(--admin-text-muted);">Ordre : {b.display_order}</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div class="flex gap-2 flex-shrink-0">
                    <button class="btn-edit" onclick={`openEditBanner(${b.id},'${b.title.replace(/'/g,"\\'")}','${(b.subtitle||'').replace(/'/g,"\\'")}','${b.image_url.replace(/'/g,"\\'")}','${(b.target_page||'').replace(/'/g,"\\'")}',${b.display_order},${b.is_active})`}>
                      <i class="fas fa-pen"></i>
                    </button>
                    <form method="post" action={`/api/admin/banners/${b.id}/delete`} onsubmit="return confirm('Supprimer cette banniere ?')">
                      <button type="submit" class="btn-danger"><i class="fas fa-trash"></i></button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION MARQUES */}
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <div class="section-title"><i class="fas fa-tags"></i> Marques affichees ({brands.length})</div>
            <button class="btn-primary" onclick="document.getElementById('modal-add-brand').classList.add('open')">
              <i class="fas fa-plus mr-1"></i> Ajouter
            </button>
          </div>
          <p class="text-xs mb-4" style="color: var(--admin-text-muted);">
            <i class="fas fa-info-circle mr-1" style="color: var(--admin-accent);"></i>
            La cle asset correspond au fichier <code style="color: var(--admin-accent);">assets/brands/&lt;cle&gt;.png</code> dans l'application Flutter.
            Si une URL logo est fournie, elle est utilisee en priorite.
          </p>

          {brands.length === 0 ? (
            <p class="text-sm text-center py-6" style="color: var(--admin-text-muted);">Aucune marque configuree.</p>
          ) : (
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {brands.map((br: any) => (
                <div class="banner-row flex items-center gap-3 p-3">
                  {/* Logo / initiale */}
                  <div class="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden" style="background: var(--admin-accent-light); border: 1px solid rgba(3,105,161,0.15);">
                    {br.logo_url ? (
                      <img src={br.logo_url} alt={br.name} style="width:40px;height:40px;object-fit:contain;" onerror="this.style.display='none';this.nextSibling.style.display='block';" />
                    ) : null}
                    <span class="font-bold text-sm" style={`color: var(--admin-accent); ${br.logo_url ? 'display:none' : ''}`}>{br.name.substring(0,2)}</span>
                  </div>
                  {/* Infos */}
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-sm" style="color: var(--admin-text-primary);">{br.name}</div>
                    <div class="text-xs truncate" style="color: var(--admin-text-muted);">
                      {br.asset_key ? `asset: ${br.asset_key}` : ''}
                      {br.logo_url ? ' + URL logo' : ''}
                    </div>
                    <span class={br.is_active ? 'badge-active' : 'badge-inactive'}>
                      {br.is_active ? 'Visible' : 'Masquee'} - Ordre {br.display_order}
                    </span>
                  </div>
                  {/* Actions */}
                  <div class="flex gap-2 flex-shrink-0">
                    <button class="btn-edit" onclick={`openEditBrand(${br.id},'${br.name.replace(/'/g,"\\'")}','${(br.logo_url||'').replace(/'/g,"\\'")}','${(br.asset_key||'').replace(/'/g,"\\'")}',${br.display_order},${br.is_active})`}>
                      <i class="fas fa-pen"></i>
                    </button>
                    <form method="post" action={`/api/admin/brands/${br.id}/delete`} onsubmit="return confirm('Supprimer cette marque ?')">
                      <button type="submit" class="btn-danger"><i class="fas fa-trash"></i></button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>{/* end max-w */}

      {/* MODALE AJOUTER BANNIERE */}
      <div id="modal-add-banner" class="modal" onclick="if(event.target===this)this.classList.remove('open')">
        <div class="modal-box">
          <h2 class="text-lg font-bold mb-4 flex items-center gap-2" style="color: var(--admin-text-primary);">
            <i class="fas fa-film" style="color: var(--admin-accent);"></i>Nouvelle banniere
          </h2>
          <form method="post" action="/api/admin/banners/create" class="space-y-3">
            <div>
              <label class="form-label">Titre *</label>
              <input name="title" required class="input-field" placeholder="ex: Soldes d'ete" />
            </div>
            <div>
              <label class="form-label">Sous-titre</label>
              <input name="subtitle" class="input-field" placeholder="ex: Economisez jusqu'a 30%" />
            </div>
            <div>
              <label class="form-label">URL de l'image *</label>
              <input name="image_url" required class="input-field" placeholder="https://..." oninput="updatePreview('preview-add-banner',this.value)" />
              <img id="preview-add-banner" class="preview-img" style="display:none;" />
            </div>
            <div>
              <label class="form-label">Page cible (optionnel)</label>
              <select name="target_page" class="input-field">
                <option value="">-- Aucune --</option>
                <option value="/catalog">Catalogue</option>
                <option value="/rdv">Rendez-vous</option>
                <option value="/simulator">Simulateur BTU</option>
                <option value="/maintenance">Maintenance</option>
                <option value="/support">Support</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label">Ordre d'affichage</label>
                <input name="display_order" type="number" min="0" value="0" class="input-field" />
              </div>
              <div class="flex items-center gap-2 mt-5">
                <input type="checkbox" name="is_active" id="cb-add-active" value="1" checked class="w-4 h-4 accent-cyan-500" />
                <label for="cb-add-active" class="text-sm" style="color: var(--admin-text-primary);">Activer</label>
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="submit" class="btn-primary flex-1">Enregistrer</button>
              <button type="button" onclick="document.getElementById('modal-add-banner').classList.remove('open')" class="cancel-btn">Annuler</button>
            </div>
          </form>
        </div>
      </div>

      {/* MODALE MODIFIER BANNIERE */}
      <div id="modal-edit-banner" class="modal" onclick="if(event.target===this)this.classList.remove('open')">
        <div class="modal-box">
          <h2 class="text-lg font-bold mb-4 flex items-center gap-2" style="color: var(--admin-text-primary);">
            <i class="fas fa-pen" style="color: var(--admin-accent);"></i>Modifier la banniere
          </h2>
          <form id="form-edit-banner" method="post" class="space-y-3">
            <input type="hidden" id="edit-banner-id" name="id" />
            <div>
              <label class="form-label">Titre *</label>
              <input id="edit-banner-title" name="title" required class="input-field" />
            </div>
            <div>
              <label class="form-label">Sous-titre</label>
              <input id="edit-banner-subtitle" name="subtitle" class="input-field" />
            </div>
            <div>
              <label class="form-label">URL de l'image *</label>
              <input id="edit-banner-image" name="image_url" required class="input-field" oninput="updatePreview('preview-edit-banner',this.value)" />
              <img id="preview-edit-banner" class="preview-img" />
            </div>
            <div>
              <label class="form-label">Page cible</label>
              <select id="edit-banner-target" name="target_page" class="input-field">
                <option value="">-- Aucune --</option>
                <option value="/catalog">Catalogue</option>
                <option value="/rdv">Rendez-vous</option>
                <option value="/simulator">Simulateur BTU</option>
                <option value="/maintenance">Maintenance</option>
                <option value="/support">Support</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label">Ordre d'affichage</label>
                <input id="edit-banner-order" name="display_order" type="number" min="0" class="input-field" />
              </div>
              <div class="flex items-center gap-2 mt-5">
                <input type="checkbox" id="edit-banner-active" name="is_active" value="1" class="w-4 h-4 accent-cyan-500" />
                <label for="edit-banner-active" class="text-sm" style="color: var(--admin-text-primary);">Activer</label>
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="submit" class="btn-primary flex-1">Mettre a jour</button>
              <button type="button" onclick="document.getElementById('modal-edit-banner').classList.remove('open')" class="cancel-btn">Annuler</button>
            </div>
          </form>
        </div>
      </div>

      {/* MODALE AJOUTER MARQUE */}
      <div id="modal-add-brand" class="modal" onclick="if(event.target===this)this.classList.remove('open')">
        <div class="modal-box">
          <h2 class="text-lg font-bold mb-4 flex items-center gap-2" style="color: var(--admin-text-primary);">
            <i class="fas fa-tags" style="color: var(--admin-accent);"></i>Nouvelle marque
          </h2>
          <form method="post" action="/api/admin/brands/create" class="space-y-3">
            <div>
              <label class="form-label">Nom de la marque *</label>
              <input name="name" required class="input-field" placeholder="ex: DAIKIN" style="text-transform:uppercase;" />
            </div>
            <div>
              <label class="form-label">Cle asset Flutter</label>
              <input name="asset_key" class="input-field" placeholder="ex: daikin -> assets/brands/daikin.png" />
            </div>
            <div>
              <label class="form-label">URL logo (optionnel, prioritaire sur l'asset)</label>
              <input name="logo_url" class="input-field" placeholder="https://..." oninput="updatePreview('preview-add-brand',this.value)" />
              <img id="preview-add-brand" class="preview-img" style="display:none;height:60px;width:auto;" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label">Ordre d'affichage</label>
                <input name="display_order" type="number" min="0" value="0" class="input-field" />
              </div>
              <div class="flex items-center gap-2 mt-5">
                <input type="checkbox" name="is_active" id="cb-add-brand-active" value="1" checked class="w-4 h-4 accent-cyan-500" />
                <label for="cb-add-brand-active" class="text-sm" style="color: var(--admin-text-primary);">Visible</label>
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="submit" class="btn-primary flex-1">Enregistrer</button>
              <button type="button" onclick="document.getElementById('modal-add-brand').classList.remove('open')" class="cancel-btn">Annuler</button>
            </div>
          </form>
        </div>
      </div>

      {/* MODALE MODIFIER MARQUE */}
      <div id="modal-edit-brand" class="modal" onclick="if(event.target===this)this.classList.remove('open')">
        <div class="modal-box">
          <h2 class="text-lg font-bold mb-4 flex items-center gap-2" style="color: var(--admin-text-primary);">
            <i class="fas fa-pen" style="color: var(--admin-accent);"></i>Modifier la marque
          </h2>
          <form id="form-edit-brand" method="post" class="space-y-3">
            <input type="hidden" id="edit-brand-id" name="id" />
            <div>
              <label class="form-label">Nom *</label>
              <input id="edit-brand-name" name="name" required class="input-field" style="text-transform:uppercase;" />
            </div>
            <div>
              <label class="form-label">Cle asset Flutter</label>
              <input id="edit-brand-assetkey" name="asset_key" class="input-field" />
            </div>
            <div>
              <label class="form-label">URL logo</label>
              <input id="edit-brand-logo" name="logo_url" class="input-field" oninput="updatePreview('preview-edit-brand',this.value)" />
              <img id="preview-edit-brand" class="preview-img" style="height:60px;width:auto;" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label">Ordre d'affichage</label>
                <input id="edit-brand-order" name="display_order" type="number" min="0" class="input-field" />
              </div>
              <div class="flex items-center gap-2 mt-5">
                <input type="checkbox" id="edit-brand-active" name="is_active" value="1" class="w-4 h-4 accent-cyan-500" />
                <label for="edit-brand-active" class="text-sm" style="color: var(--admin-text-primary);">Visible</label>
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="submit" class="btn-primary flex-1">Mettre a jour</button>
              <button type="button" onclick="document.getElementById('modal-edit-brand').classList.remove('open')" class="cancel-btn">Annuler</button>
            </div>
          </form>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function updatePreview(id, url) {
          var img = document.getElementById(id);
          if (!img) return;
          if (url && url.startsWith('http')) {
            img.style.display = 'block';
            img.src = url;
          } else {
            img.style.display = 'none';
          }
        }

        function openEditBanner(id, title, subtitle, imageUrl, targetPage, displayOrder, isActive) {
          document.getElementById('edit-banner-id').value = id;
          document.getElementById('edit-banner-title').value = title;
          document.getElementById('edit-banner-subtitle').value = subtitle;
          document.getElementById('edit-banner-image').value = imageUrl;
          document.getElementById('edit-banner-order').value = displayOrder;
          document.getElementById('edit-banner-active').checked = !!isActive;
          var sel = document.getElementById('edit-banner-target');
          for (var i = 0; i < sel.options.length; i++) {
            sel.options[i].selected = sel.options[i].value === targetPage;
          }
          var img = document.getElementById('preview-edit-banner');
          if (imageUrl) { img.src = imageUrl; img.style.display = 'block'; }
          document.getElementById('form-edit-banner').action = '/api/admin/banners/' + id + '/update';
          document.getElementById('modal-edit-banner').classList.add('open');
        }

        function openEditBrand(id, name, logoUrl, assetKey, displayOrder, isActive) {
          document.getElementById('edit-brand-id').value = id;
          document.getElementById('edit-brand-name').value = name;
          document.getElementById('edit-brand-logo').value = logoUrl;
          document.getElementById('edit-brand-assetkey').value = assetKey;
          document.getElementById('edit-brand-order').value = displayOrder;
          document.getElementById('edit-brand-active').checked = !!isActive;
          var img = document.getElementById('preview-edit-brand');
          if (logoUrl) { img.src = logoUrl; img.style.display = 'block'; }
          document.getElementById('form-edit-brand').action = '/api/admin/brands/' + id + '/update';
          document.getElementById('modal-edit-brand').classList.add('open');
        }
      `}} />
    </body>
  </html>
)
