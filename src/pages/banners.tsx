// Page admin : Gestion des bannieres du carrousel et des marques de l'accueil
// Accessible via GET /admin/banners (adminAuth)
// CRUD via POST /api/admin/banners/* et /api/admin/brands/*

// ── helpers securite (locaux, identiques a ceux dans admin.tsx) ──
const JS_LIT_UNSAFE = /[\\'\\r\\n\u2028\u2029]/g
const JS_LIT_ESC: Record<string, string> = {
  '\\': '\\\\',
  "'": "\\'",
  '\r': '\\r',
  '\n': '\\n',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
}
const jsA = (v: any): string =>
  (v === null || v === undefined ? '' : String(v)).replace(JS_LIT_UNSAFE, (ch) => JS_LIT_ESC[ch])

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
      <title>Bannières &amp; Marques — MAASGA Admin</title>
      <link rel="stylesheet" href="/static/tailwind.css" />
      <link rel="stylesheet" href="/static/admin-tokens.css" />
      <link rel="stylesheet" href="/static/style.css" />
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        *,*::before,*::after{box-sizing:border-box}
        body{font-family:'Inter',system-ui,sans-serif}
        .pw{max-width:1100px;margin:0 auto;padding:2rem 1rem}
        .card{background:var(--admin-card-bg);border:1px solid var(--admin-border);border-radius:1.25rem;padding:1.5rem;margin-bottom:1.75rem}
        .ch{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem}
        .st{font-size:1rem;font-weight:700;color:var(--admin-accent);display:flex;align-items:center;gap:.5rem}
        .ss{font-size:.75rem;color:var(--admin-text-muted);margin-top:.2rem}
        .bc{display:flex;align-items:stretch;background:var(--admin-bg);border:1px solid var(--admin-border);border-radius:1rem;overflow:hidden;transition:box-shadow .2s,transform .15s}
        .bc:hover{box-shadow:0 4px 24px rgba(3,105,161,.1);transform:translateY(-1px)}
        .bthumb{width:140px;min-width:140px;height:88px;object-fit:cover;background:var(--admin-bg-elevated);flex-shrink:0}
        .bthumb-ph{width:140px;min-width:140px;height:88px;background:var(--admin-bg-elevated);display:flex;align-items:center;justify-content:center;color:var(--admin-text-muted);font-size:1.5rem;flex-shrink:0}
        .bbody{flex:1;min-width:0;padding:.75rem 1rem;display:flex;flex-direction:column;justify-content:space-between}
        .bt{font-weight:700;font-size:.9rem;color:var(--admin-text-primary)}
        .bsub{font-size:.75rem;color:var(--admin-text-muted);margin-top:.15rem}
        .bm{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-top:.35rem}
        .ba{display:flex;gap:.5rem;align-items:flex-start;padding:.75rem;flex-shrink:0}
        .brc{background:var(--admin-bg);border:1px solid var(--admin-border);border-radius:1rem;padding:1rem;display:flex;align-items:center;gap:.75rem;transition:box-shadow .2s,transform .15s}
        .brc:hover{box-shadow:0 4px 16px rgba(3,105,161,.1);transform:translateY(-1px)}
        .blw{width:52px;height:52px;border-radius:12px;background:var(--admin-accent-light);border:1px solid rgba(3,105,161,.15);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .blw img{width:40px;height:40px;object-fit:contain}
        .bi{font-size:1rem;font-weight:800;color:var(--admin-accent)}
        .bdg{display:inline-flex;align-items:center;gap:.3rem;padding:.15rem .55rem;border-radius:9999px;font-size:.68rem;font-weight:600;line-height:1.6}
        .bdg-a{background:var(--admin-success-light);color:var(--admin-success);border:1px solid rgba(5,150,105,.2)}
        .bdg-i{background:var(--admin-danger-light);color:var(--admin-danger);border:1px solid rgba(220,38,38,.2)}
        .bdg-p{background:var(--admin-accent-light);color:var(--admin-accent);border:1px solid rgba(3,105,161,.15)}
        .bdg-o{background:rgba(148,163,184,.1);color:var(--admin-text-muted);border:1px solid var(--admin-border)}
        .bico{width:32px;height:32px;border-radius:.5rem;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.8rem;transition:opacity .15s,transform .1s}
        .bico:hover{opacity:.8;transform:scale(1.05)}
        .bico-e{background:var(--admin-accent-light);color:var(--admin-accent)}
        .bico-d{background:var(--admin-danger-light);color:var(--admin-danger)}
        .modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:60;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(2px)}
        .modal.open{display:flex}
        .mbox{background:var(--admin-card-bg);border:1px solid var(--admin-border);border-radius:1.5rem;padding:1.75rem;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);animation:mIn .2s ease}
        @keyframes mIn{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:none}}
        .mt{font-size:1.15rem;font-weight:700;color:var(--admin-text-primary);display:flex;align-items:center;gap:.6rem;margin-bottom:1.25rem}
        .fg{margin-bottom:1rem}
        .fl{display:block;font-size:.72rem;font-weight:600;color:var(--admin-text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.35rem}
        .fr{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
        .uz{border:2px dashed var(--admin-border);border-radius:.875rem;padding:1.25rem;text-align:center;cursor:pointer;transition:border-color .2s,background .2s;position:relative;background:var(--admin-bg)}
        .uz:hover,.uz.dv{border-color:var(--admin-accent);background:var(--admin-accent-light)}
        .uzi{font-size:1.5rem;color:var(--admin-text-muted);margin-bottom:.4rem}
        .uzt{font-size:.8rem;color:var(--admin-text-muted)}
        .uzt strong{color:var(--admin-accent)}
        .up{display:flex;align-items:center;gap:.5rem;font-size:.78rem;color:var(--admin-accent);margin-top:.5rem}
        .pw-img{position:relative;margin-top:.75rem;border-radius:.75rem;overflow:hidden;border:1px solid var(--admin-border);background:var(--admin-bg-elevated);display:none}
        .pw-img.vis{display:block}
        .pw-img img{width:100%;height:140px;object-fit:cover;display:block}
        .pw-img img.sm{height:80px;object-fit:contain}
        .pw-clr{position:absolute;top:.4rem;right:.4rem;width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;border:none;cursor:pointer;font-size:.65rem;display:flex;align-items:center;justify-content:center}
        .br{display:flex;gap:.75rem;padding-top:.5rem}
        .bcl{flex:1;font-size:.875rem;color:var(--admin-text-muted);background:var(--admin-bg-elevated);border:1px solid var(--admin-border);border-radius:.75rem;padding:.6rem;cursor:pointer;transition:background .15s}
        .bcl:hover{background:var(--admin-border)}
        .dor{text-align:center;font-size:.72rem;color:var(--admin-text-muted);margin:.5rem 0;position:relative}
        .dor::before,.dor::after{content:'';position:absolute;top:50%;width:42%;height:1px;background:var(--admin-border)}
        .dor::before{left:0}.dor::after{right:0}
        .emp{text-align:center;padding:3rem 1rem;color:var(--admin-text-muted)}
        .emp i{font-size:2.5rem;margin-bottom:.75rem;opacity:.4;display:block}
        #tb{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:#1e293b;color:#f1f5f9;border-radius:.75rem;padding:.65rem 1.25rem;font-size:.82rem;z-index:9999;display:none;align-items:center;gap:.5rem;box-shadow:0 8px 24px rgba(0,0,0,.3);max-width:90vw}
        #tb.show{display:flex;animation:tIn .25s ease}
        @keyframes tIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      `}} />
    </head>
    <body class="admin-ui min-h-screen" style="background:var(--admin-bg);">
      <div class="pw">

        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.75rem;">
          <div>
            <h1 style="font-size:1.6rem;font-weight:800;color:var(--admin-text-primary);display:flex;align-items:center;gap:.6rem;margin:0;">
              <i class="fas fa-images" style="color:var(--admin-accent);"></i>
              Bannières &amp; Marques
            </h1>
            <p style="font-size:.8rem;color:var(--admin-text-muted);margin-top:.35rem;">Gérez le carrousel de l'accueil et la barre des marques partenaires</p>
          </div>
          <a href="/admin" style="display:flex;align-items:center;gap:.35rem;font-size:.82rem;color:var(--admin-accent);text-decoration:none;margin-top:.35rem;">
            <i class="fas fa-arrow-left"></i> Admin
          </a>
        </div>

        {success && (
          <div style="margin-bottom:1rem;padding:.75rem 1rem;border-radius:.875rem;font-size:.85rem;font-weight:500;background:var(--admin-success-light);border:1px solid rgba(5,150,105,.25);color:var(--admin-success);display:flex;align-items:center;gap:.5rem;">
            <i class="fas fa-check-circle"></i>{success}
          </div>
        )}
        {error && (
          <div style="margin-bottom:1rem;padding:.75rem 1rem;border-radius:.875rem;font-size:.85rem;font-weight:500;background:var(--admin-danger-light);border:1px solid rgba(220,38,38,.25);color:var(--admin-danger);display:flex;align-items:center;gap:.5rem;">
            <i class="fas fa-exclamation-circle"></i>{error}
          </div>
        )}

        {/* ── BANNIÈRES ── */}
        <div class="card">
          <div class="ch">
            <div>
              <div class="st"><i class="fas fa-film"></i> Bannières du carrousel</div>
              <div class="ss">{banners.length} bannière{banners.length !== 1 ? 's' : ''} configurée{banners.length !== 1 ? 's' : ''}</div>
            </div>
            <button class="btn-primary" style="font-size:.83rem;" onclick="openAddBanner()">
              <i class="fas fa-plus mr-1"></i> Ajouter
            </button>
          </div>
          {banners.length === 0 ? (
            <div class="emp">
              <i class="fas fa-film"></i>
              <p style="font-size:.85rem;margin:0;">Aucune bannière. Cliquez sur <strong>Ajouter</strong> pour créer la première.</p>
            </div>
          ) : (
            <div style="display:flex;flex-direction:column;gap:.75rem;">
              {banners.map((b: any) => (
                <div class="bc">
                  {b.image_url ? (
                    <img src={b.image_url} alt={b.title} class="bthumb" onerror="this.style.display='none';this.nextSibling.style.display='flex';" />
                  ) : null}
                  <div class="bthumb-ph" style={b.image_url ? 'display:none;' : ''}>
                    <i class="fas fa-image"></i>
                  </div>
                  <div class="bbody">
                    <div>
                      <div class="bt">{b.title}</div>
                      {b.subtitle && <div class="bsub">{b.subtitle}</div>}
                    </div>
                    <div class="bm">
                      <span class={b.is_active ? 'bdg bdg-a' : 'bdg bdg-i'}>{b.is_active ? 'Actif' : 'Masqué'}</span>
                      {b.target_page && <span class="bdg bdg-p"><i class="fas fa-link" style="font-size:.6rem;"></i>{b.target_page}</span>}
                      <span class="bdg bdg-o">#{b.display_order}</span>
                    </div>
                  </div>
                  <div class="ba">
                    <button class="bico bico-e" title="Modifier"
                      onclick={`openEditBanner(${b.id},'${jsA(b.title)}','${jsA(b.subtitle||'')}','${jsA(b.image_url)}','${jsA(b.target_page||'')}',${b.display_order},${b.is_active?1:0})`}>
                      <i class="fas fa-pen"></i>
                    </button>
                    <form method="post" action={`/api/admin/banners/${b.id}/delete`} onsubmit="return confirm('Supprimer cette banniere ?')" style="margin:0;">
                      <button type="submit" class="bico bico-d" title="Supprimer"><i class="fas fa-trash"></i></button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── MARQUES ── */}
        <div class="card">
          <div class="ch">
            <div>
              <div class="st"><i class="fas fa-tags"></i> Marques partenaires</div>
              <div class="ss">{brands.length} marque{brands.length !== 1 ? 's' : ''} affichée{brands.length !== 1 ? 's' : ''} dans l'app</div>
            </div>
            <button class="btn-primary" style="font-size:.83rem;" onclick="document.getElementById('modal-add-brand').classList.add('open')">
              <i class="fas fa-plus mr-1"></i> Ajouter
            </button>
          </div>
          <div style="display:flex;align-items:center;gap:.5rem;padding:.6rem .875rem;border-radius:.75rem;margin-bottom:1rem;font-size:.75rem;color:var(--admin-accent);background:var(--admin-accent-light);border:1px solid rgba(3,105,161,.15);">
            <i class="fas fa-info-circle"></i>
            La cle asset = <code style="background:rgba(3,105,161,.12);padding:.1rem .35rem;border-radius:.3rem;">assets/brands/&lt;cle&gt;.png</code> dans Flutter. L'URL logo est prioritaire.
          </div>
          {brands.length === 0 ? (
            <div class="emp"><i class="fas fa-tags"></i><p style="font-size:.85rem;margin:0;">Aucune marque configuree.</p></div>
          ) : (
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.75rem;">
              {brands.map((br: any) => (
                <div class="brc">
                  <div class="blw">
                    {br.logo_url ? (
                      <img src={br.logo_url} alt={br.name} onerror="this.style.display='none';this.nextSibling.style.display='flex';" />
                    ) : null}
                    <span class="bi" style={br.logo_url ? 'display:none;' : ''}>{(br.name||'?').substring(0,2)}</span>
                  </div>
                  <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;font-size:.85rem;color:var(--admin-text-primary);">{br.name}</div>
                    <div style="font-size:.7rem;color:var(--admin-text-muted);margin-top:.15rem;">{br.asset_key ? `asset: ${br.asset_key}` : 'Pas de cle asset'}</div>
                    <div style="margin-top:.3rem;display:flex;gap:.4rem;flex-wrap:wrap;">
                      <span class={br.is_active ? 'bdg bdg-a' : 'bdg bdg-i'}>{br.is_active ? 'Visible' : 'Masquee'}</span>
                      <span class="bdg bdg-o">#{br.display_order}</span>
                    </div>
                  </div>
                  <div style="display:flex;gap:.4rem;margin-left:auto;flex-shrink:0;">
                    <button class="bico bico-e" title="Modifier"
                      onclick={`openEditBrand(${br.id},'${jsA(br.name)}','${jsA(br.logo_url||'')}','${jsA(br.asset_key||'')}',${br.display_order},${br.is_active?1:0})`}>
                      <i class="fas fa-pen"></i>
                    </button>
                    <form method="post" action={`/api/admin/brands/${br.id}/delete`} onsubmit="return confirm('Supprimer cette marque ?')" style="margin:0;">
                      <button type="submit" class="bico bico-d" title="Supprimer"><i class="fas fa-trash"></i></button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>{/* end pw */}

      {/* ═══ MODALE AJOUTER BANNIÈRE ═══ */}
      <div id="modal-add-banner" class="modal" onclick="if(event.target===this)this.classList.remove('open')">
        <div class="mbox">
          <div class="mt"><i class="fas fa-film" style="color:var(--admin-accent);"></i>Nouvelle bannière</div>
          <form id="form-add-banner" method="post" action="/api/admin/banners/create">
            <input type="hidden" id="ab-img" name="image_url" value="" />
            <div class="fg"><label class="fl">Titre *</label><input name="title" required class="input-field" placeholder="Ex: Soldes d'ete" /></div>
            <div class="fg"><label class="fl">Sous-titre</label><input name="subtitle" class="input-field" placeholder="Ex: Economisez jusqu'a 30%" /></div>
            <div class="fg">
              <label class="fl">Image de la banniere *</label>
              <div class="uz" id="ab-zone" onclick="document.getElementById('ab-file').click()">
                <input type="file" id="ab-file" accept="image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;" onchange="hBU('a')" />
                <div class="uzi"><i class="fas fa-cloud-upload-alt"></i></div>
                <div class="uzt"><strong>Cliquez</strong> ou glissez une image ici</div>
                <div class="uzt" style="font-size:.7rem;margin-top:.2rem;">JPG, PNG, WebP — max 10 MB</div>
              </div>
              <div id="ab-prog" class="up" style="display:none;"><i class="fas fa-spinner fa-spin"></i> Upload en cours...</div>
              <div id="ab-pw" class="pw-img"><img id="ab-prev" src="" alt="Apercu" /><button type="button" class="pw-clr" onclick="clrBI('a')"><i class="fas fa-times"></i></button></div>
              <div class="dor">ou</div>
              <input id="ab-url" class="input-field" type="url" placeholder="https://... coller une URL" oninput="sBUI('a',this.value)" />
            </div>
            <div class="fg">
              <label class="fl">Page cible</label>
              <select name="target_page" class="input-field">
                <option value="">-- Aucune --</option>
                <option value="/catalog">Catalogue</option>
                <option value="/rdv">Rendez-vous</option>
                <option value="/simulator">Simulateur BTU</option>
                <option value="/maintenance">Maintenance</option>
                <option value="/support">Support</option>
              </select>
            </div>
            <div class="fr">
              <div><label class="fl">Ordre</label><input name="display_order" type="number" min="0" value="0" class="input-field" /></div>
              <div style="display:flex;align-items:flex-end;padding-bottom:.1rem;">
                <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.85rem;color:var(--admin-text-primary);">
                  <input type="checkbox" name="is_active" id="cb-add-active" value="1" checked class="w-4 h-4 accent-cyan-500" />Activer
                </label>
              </div>
            </div>
            <div class="br">
              <button type="submit" class="btn-primary flex-1"><i class="fas fa-save mr-1"></i> Enregistrer</button>
              <button type="button" class="bcl" onclick="document.getElementById('modal-add-banner').classList.remove('open')">Annuler</button>
            </div>
          </form>
        </div>
      </div>

      {/* ═══ MODALE MODIFIER BANNIÈRE ═══ */}
      <div id="modal-edit-banner" class="modal" onclick="if(event.target===this)this.classList.remove('open')">
        <div class="mbox">
          <div class="mt"><i class="fas fa-pen" style="color:var(--admin-accent);"></i>Modifier la bannière</div>
          <form id="form-edit-banner" method="post">
            <input type="hidden" id="eb-id" name="id" />
            <input type="hidden" id="eb-img" name="image_url" value="" />
            <div class="fg"><label class="fl">Titre *</label><input id="eb-title" name="title" required class="input-field" /></div>
            <div class="fg"><label class="fl">Sous-titre</label><input id="eb-sub" name="subtitle" class="input-field" /></div>
            <div class="fg">
              <label class="fl">Image de la banniere</label>
              <div class="uz" id="eb-zone" onclick="document.getElementById('eb-file').click()">
                <input type="file" id="eb-file" accept="image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;" onchange="hBU('e')" />
                <div class="uzi"><i class="fas fa-cloud-upload-alt"></i></div>
                <div class="uzt"><strong>Remplacer</strong> l'image actuelle</div>
              </div>
              <div id="eb-prog" class="up" style="display:none;"><i class="fas fa-spinner fa-spin"></i> Upload en cours...</div>
              <div id="eb-pw" class="pw-img"><img id="eb-prev" src="" alt="Apercu" /><button type="button" class="pw-clr" onclick="clrBI('e')"><i class="fas fa-times"></i></button></div>
              <div class="dor">ou</div>
              <input id="eb-url" class="input-field" type="url" placeholder="https://... coller une URL" oninput="sBUI('e',this.value)" />
            </div>
            <div class="fg">
              <label class="fl">Page cible</label>
              <select id="eb-target" name="target_page" class="input-field">
                <option value="">-- Aucune --</option>
                <option value="/catalog">Catalogue</option>
                <option value="/rdv">Rendez-vous</option>
                <option value="/simulator">Simulateur BTU</option>
                <option value="/maintenance">Maintenance</option>
                <option value="/support">Support</option>
              </select>
            </div>
            <div class="fr">
              <div><label class="fl">Ordre</label><input id="eb-order" name="display_order" type="number" min="0" class="input-field" /></div>
              <div style="display:flex;align-items:flex-end;padding-bottom:.1rem;">
                <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.85rem;color:var(--admin-text-primary);">
                  <input type="checkbox" id="eb-active" name="is_active" value="1" class="w-4 h-4 accent-cyan-500" />Active
                </label>
              </div>
            </div>
            <div class="br">
              <button type="submit" class="btn-primary flex-1"><i class="fas fa-save mr-1"></i> Mettre a jour</button>
              <button type="button" class="bcl" onclick="document.getElementById('modal-edit-banner').classList.remove('open')">Annuler</button>
            </div>
          </form>
        </div>
      </div>

      {/* ═══ MODALE AJOUTER MARQUE ═══ */}
      <div id="modal-add-brand" class="modal" onclick="if(event.target===this)this.classList.remove('open')">
        <div class="mbox">
          <div class="mt"><i class="fas fa-tags" style="color:var(--admin-accent);"></i>Nouvelle marque</div>
          <form method="post" action="/api/admin/brands/create">
            <input type="hidden" id="abr-logo" name="logo_url" value="" />
            <div class="fg"><label class="fl">Nom *</label><input name="name" required class="input-field" placeholder="Ex: DAIKIN" style="text-transform:uppercase;" /></div>
            <div class="fg"><label class="fl">Cle asset Flutter</label><input name="asset_key" class="input-field" placeholder="Ex: daikin" /></div>
            <div class="fg">
              <label class="fl">Logo (optionnel)</label>
              <div class="uz" onclick="document.getElementById('abr-file').click()">
                <input type="file" id="abr-file" accept="image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;" onchange="hBRL('a')" />
                <div class="uzi"><i class="fas fa-image"></i></div>
                <div class="uzt"><strong>Cliquez</strong> pour uploader un logo</div>
              </div>
              <div id="abr-prog" class="up" style="display:none;"><i class="fas fa-spinner fa-spin"></i> Upload en cours...</div>
              <div id="abr-pw" class="pw-img"><img id="abr-prev" class="sm" src="" alt="Logo" /><button type="button" class="pw-clr" onclick="clrBRL('a')"><i class="fas fa-times"></i></button></div>
              <div class="dor">ou</div>
              <input id="abr-url" class="input-field" type="url" placeholder="https://... URL du logo" oninput="sBRLI('a',this.value)" />
            </div>
            <div class="fr">
              <div><label class="fl">Ordre</label><input name="display_order" type="number" min="0" value="0" class="input-field" /></div>
              <div style="display:flex;align-items:flex-end;padding-bottom:.1rem;">
                <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.85rem;color:var(--admin-text-primary);">
                  <input type="checkbox" name="is_active" id="cb-add-brand-active" value="1" checked class="w-4 h-4 accent-cyan-500" />Visible
                </label>
              </div>
            </div>
            <div class="br">
              <button type="submit" class="btn-primary flex-1"><i class="fas fa-save mr-1"></i> Enregistrer</button>
              <button type="button" class="bcl" onclick="document.getElementById('modal-add-brand').classList.remove('open')">Annuler</button>
            </div>
          </form>
        </div>
      </div>

      {/* ═══ MODALE MODIFIER MARQUE ═══ */}
      <div id="modal-edit-brand" class="modal" onclick="if(event.target===this)this.classList.remove('open')">
        <div class="mbox">
          <div class="mt"><i class="fas fa-pen" style="color:var(--admin-accent);"></i>Modifier la marque</div>
          <form id="form-edit-brand" method="post">
            <input type="hidden" id="ebr-id" name="id" />
            <input type="hidden" id="ebr-logo" name="logo_url" value="" />
            <div class="fg"><label class="fl">Nom *</label><input id="ebr-name" name="name" required class="input-field" style="text-transform:uppercase;" /></div>
            <div class="fg"><label class="fl">Cle asset Flutter</label><input id="ebr-ak" name="asset_key" class="input-field" /></div>
            <div class="fg">
              <label class="fl">Logo</label>
              <div class="uz" onclick="document.getElementById('ebr-file').click()">
                <input type="file" id="ebr-file" accept="image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;" onchange="hBRL('e')" />
                <div class="uzi"><i class="fas fa-image"></i></div>
                <div class="uzt"><strong>Remplacer</strong> le logo</div>
              </div>
              <div id="ebr-prog" class="up" style="display:none;"><i class="fas fa-spinner fa-spin"></i> Upload en cours...</div>
              <div id="ebr-pw" class="pw-img"><img id="ebr-prev" class="sm" src="" alt="Logo" /><button type="button" class="pw-clr" onclick="clrBRL('e')"><i class="fas fa-times"></i></button></div>
              <div class="dor">ou</div>
              <input id="ebr-url" class="input-field" type="url" placeholder="https://... URL du logo" oninput="sBRLI('e',this.value)" />
            </div>
            <div class="fr">
              <div><label class="fl">Ordre</label><input id="ebr-order" name="display_order" type="number" min="0" class="input-field" /></div>
              <div style="display:flex;align-items:flex-end;padding-bottom:.1rem;">
                <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.85rem;color:var(--admin-text-primary);">
                  <input type="checkbox" id="ebr-active" name="is_active" value="1" class="w-4 h-4 accent-cyan-500" />Visible
                </label>
              </div>
            </div>
            <div class="br">
              <button type="submit" class="btn-primary flex-1"><i class="fas fa-save mr-1"></i> Mettre a jour</button>
              <button type="button" class="bcl" onclick="document.getElementById('modal-edit-brand').classList.remove('open')">Annuler</button>
            </div>
          </form>
        </div>
      </div>

      <div id="tb"><i id="tb-ic" class="fas fa-check-circle"></i><span id="tb-msg"></span></div>

      <script dangerouslySetInnerHTML={{ __html: `
        function sT(msg,type){
          var t=document.getElementById('tb');
          document.getElementById('tb-msg').textContent=msg;
          document.getElementById('tb-ic').className=type==='error'?'fas fa-exclamation-circle':'fas fa-check-circle';
          t.style.background=type==='error'?'#7f1d1d':'#1e293b';
          t.classList.add('show');
          setTimeout(function(){t.classList.remove('show');},3500);
        }
        function upImg(file,onOk,onErr,pid){
          var p=document.getElementById(pid);
          if(p)p.style.display='flex';
          var fd=new FormData();fd.append('image',file);
          fetch('/api/admin/upload/image',{method:'POST',body:fd})
            .then(function(r){return r.json();})
            .then(function(d){if(p)p.style.display='none';if(d.error){onErr(d.error);return;}onOk(d.url);})
            .catch(function(){if(p)p.style.display='none';onErr('Erreur reseau');});
        }
        // Banner upload helpers (m: 'a'=add, 'e'=edit)
        var bpfx={a:{img:'ab-img',prog:'ab-prog',pw:'ab-pw',prev:'ab-prev',url:'ab-url',file:'ab-file'},e:{img:'eb-img',prog:'eb-prog',pw:'eb-pw',prev:'eb-prev',url:'eb-url',file:'eb-file'}};
        function hBU(m){var ids=bpfx[m];var f=document.getElementById(ids.file);if(!f||!f.files[0])return;upImg(f.files[0],function(url){sBU(m,url);sT('Image uploadee.','success');},function(e){sT(e,'error');f.value='';},ids.prog);}
        function sBU(m,url){var ids=bpfx[m];document.getElementById(ids.img).value=url;var pr=document.getElementById(ids.prev),pw=document.getElementById(ids.pw);if(pr)pr.src=url;if(pw)pw.classList.add('vis');var ui=document.getElementById(ids.url);if(ui)ui.value=url;}
        function sBUI(m,val){var ids=bpfx[m];document.getElementById(ids.img).value=val;var pr=document.getElementById(ids.prev),pw=document.getElementById(ids.pw);if(val&&val.startsWith('http')){if(pr)pr.src=val;if(pw)pw.classList.add('vis');}else{if(pw)pw.classList.remove('vis');}}
        function clrBI(m){var ids=bpfx[m];document.getElementById(ids.img).value='';var pr=document.getElementById(ids.prev),pw=document.getElementById(ids.pw);if(pr)pr.src='';if(pw)pw.classList.remove('vis');var ui=document.getElementById(ids.url);if(ui)ui.value='';var fi=document.getElementById(ids.file);if(fi)fi.value='';}
        function openAddBanner(){clrBI('a');document.getElementById('modal-add-banner').classList.add('open');}
        function openEditBanner(id,title,subtitle,imageUrl,targetPage,displayOrder,isActive){
          document.getElementById('eb-id').value=id;
          document.getElementById('eb-title').value=title;
          document.getElementById('eb-sub').value=subtitle;
          document.getElementById('eb-order').value=displayOrder;
          document.getElementById('eb-active').checked=!!isActive;
          sBU('e',imageUrl);
          var sel=document.getElementById('eb-target');
          for(var i=0;i<sel.options.length;i++)sel.options[i].selected=sel.options[i].value===targetPage;
          document.getElementById('form-edit-banner').action='/api/admin/banners/'+id+'/update';
          document.getElementById('modal-edit-banner').classList.add('open');
        }
        // Brand logo helpers
        var brpfx={a:{logo:'abr-logo',prog:'abr-prog',pw:'abr-pw',prev:'abr-prev',url:'abr-url',file:'abr-file'},e:{logo:'ebr-logo',prog:'ebr-prog',pw:'ebr-pw',prev:'ebr-prev',url:'ebr-url',file:'ebr-file'}};
        function hBRL(m){var ids=brpfx[m];var f=document.getElementById(ids.file);if(!f||!f.files[0])return;upImg(f.files[0],function(url){sBRL(m,url);sT('Logo uploade.','success');},function(e){sT(e,'error');f.value='';},ids.prog);}
        function sBRL(m,url){var ids=brpfx[m];document.getElementById(ids.logo).value=url;var pr=document.getElementById(ids.prev),pw=document.getElementById(ids.pw);if(pr)pr.src=url;if(pw)pw.classList.add('vis');var ui=document.getElementById(ids.url);if(ui)ui.value=url;}
        function sBRLI(m,val){var ids=brpfx[m];document.getElementById(ids.logo).value=val;var pr=document.getElementById(ids.prev),pw=document.getElementById(ids.pw);if(val&&val.startsWith('http')){if(pr)pr.src=val;if(pw)pw.classList.add('vis');}else{if(pw)pw.classList.remove('vis');}}
        function clrBRL(m){var ids=brpfx[m];document.getElementById(ids.logo).value='';var pr=document.getElementById(ids.prev),pw=document.getElementById(ids.pw);if(pr)pr.src='';if(pw)pw.classList.remove('vis');var ui=document.getElementById(ids.url);if(ui)ui.value='';var fi=document.getElementById(ids.file);if(fi)fi.value='';}
        function openEditBrand(id,name,logoUrl,assetKey,displayOrder,isActive){
          document.getElementById('ebr-id').value=id;
          document.getElementById('ebr-name').value=name;
          document.getElementById('ebr-ak').value=assetKey;
          document.getElementById('ebr-order').value=displayOrder;
          document.getElementById('ebr-active').checked=!!isActive;
          sBRL('e',logoUrl);
          document.getElementById('form-edit-brand').action='/api/admin/brands/'+id+'/update';
          document.getElementById('modal-edit-brand').classList.add('open');
        }
        // Drag & drop
        document.querySelectorAll('.uz').forEach(function(zone){
          zone.addEventListener('dragover',function(e){e.preventDefault();zone.classList.add('dv');});
          zone.addEventListener('dragleave',function(){zone.classList.remove('dv');});
          zone.addEventListener('drop',function(e){
            e.preventDefault();zone.classList.remove('dv');
            var files=e.dataTransfer&&e.dataTransfer.files;
            if(!files||!files[0])return;
            var inp=zone.querySelector('input[type="file"]');
            if(!inp)return;
            try{var dt=new DataTransfer();dt.items.add(files[0]);inp.files=dt.files;inp.dispatchEvent(new Event('change'));}catch(_){}
          });
        });
        // Prevent submit without image
        document.getElementById('form-add-banner').addEventListener('submit',function(e){
          if(!document.getElementById('ab-img').value.trim()){
            e.preventDefault();
            sT("Veuillez uploader ou saisir une URL d'image pour la banniere.",'error');
          }
        });
      `}} />
    </body>
  </html>
)
