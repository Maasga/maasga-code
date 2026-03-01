import { Layout } from '../components/Layout'

interface ClientOrder {
  id: number
  type: string
  status: string
  notes?: string
  total_price?: number
  created_at: string
  product_name?: string
  btu?: number
  brand?: string
  image?: string
}

interface ClientRdv {
  id: number
  date: string
  heure_debut: string
  heure_fin: string
  type: string
  status: string
  quartier: string
  notes?: string
  created_at: string
}

export const EspaceClientPage = ({ error, tab, loggedIn, fixUrl, sessionClientId, clientName, clientPhone, clientEmail, clientQuartier, clientOrders, clientRdvs, clientSince }: {
  error?: string
  tab?: string
  loggedIn?: boolean
  fixUrl?: boolean
  sessionClientId?: number
  clientName?: string
  clientPhone?: string
  clientEmail?: string
  clientQuartier?: string
  clientOrders?: ClientOrder[]
  clientRdvs?: ClientRdv[]
  clientSince?: string
}) => {
  if (loggedIn) {
    const sessionScript = fixUrl && sessionClientId
      ? `document.cookie='maasga_session=${sessionClientId}_'+Date.now()+'; path=/; max-age=86400; samesite=lax';history.replaceState({},'','/espace-client');`
      : `history.replaceState({},'','/espace-client');`
    return <>
      <script dangerouslySetInnerHTML={{ __html: sessionScript }} />
      <ClientDashboard
        clientName={clientName || 'Client'}
        clientPhone={clientPhone || ''}
        clientEmail={clientEmail || ''}
        clientQuartier={clientQuartier || ''}
        orders={clientOrders || []}
        rdvs={clientRdvs || []}
        clientSince={clientSince || ''}
      />
    </>
  }
  return <ClientLogin error={error} defaultTab={tab} />
}

const ClientLogin = ({ error, defaultTab }: { error?: string; defaultTab?: string }) => (
  <Layout title="Espace Client MAASGA - Connexion" activePage="client" canonicalPath="/espace-client" description="Espace client MAASGA — Connectez-vous pour suivre vos installations, rendez-vous et factures.">

    <section class="gradient-hero py-16 text-white text-center relative overflow-hidden reveal">
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:url('data:image/svg+xml,...') repeat;opacity:0.03;pointer-events:none;"></div>
      <div class="relative z-10">
        <div class="inline-flex items-center space-x-2 bg-white bg-opacity-10 rounded-full px-4 py-2 text-sm mb-4 font-medium">
          <i class="fas fa-user-shield"></i><span>Espace sécurisé · MAASGA</span>
        </div>
        <h1 class="text-4xl font-bold mb-4">Espace Client</h1>
        <p class="text-blue-100 text-lg">Suivez vos commandes, rendez-vous et installations</p>
      </div>
    </section>

    <div class="min-h-screen flex items-start justify-center pt-12 pb-20 px-4" style="background:linear-gradient(180deg,#f0f9ff 0%,#e0f2fe 100%);">
      <div class="w-full max-w-md">
        <div class="glass-card rounded-3xl p-8 reveal">

          {/* Tabs */}
          <div class="flex rounded-2xl p-1 mb-6" style="background:rgba(0,119,182,0.08); border:1px solid rgba(0,119,182,0.12);">
            <button id="tab-login" onclick="switchTab('login')" class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all" style={defaultTab === 'signup' ? 'background:transparent; color:#0077b6;' : 'background:linear-gradient(135deg,#0077b6,#00b4d8); color:#ffffff; box-shadow:0 4px 12px rgba(0,119,182,0.3);'}>
              <i class="fas fa-sign-in-alt mr-1.5"></i>Connexion
            </button>
            <button id="tab-signup" onclick="switchTab('signup')" class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all" style={defaultTab === 'signup' ? 'background:linear-gradient(135deg,#0077b6,#00b4d8); color:#ffffff; box-shadow:0 4px 12px rgba(0,119,182,0.3);' : 'background:transparent; color:#0077b6;'}>
              <i class="fas fa-user-plus mr-1.5"></i>S'inscrire
            </button>
          </div>

          {error && (
            <div class="mb-5 rounded-xl p-3 flex items-center space-x-2 text-sm" style="background:rgba(248,113,113,0.1); border:1px solid rgba(248,113,113,0.3); color:#ef4444;">
              <i class="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Formulaire Connexion */}
          <div id="form-login" style={defaultTab === 'signup' ? 'display:none;' : ''}>
            <form method="post" action="/api/login" class="space-y-4">
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Email ou téléphone</label>
                <input type="text" name="identifier" required placeholder="email@exemple.com ou 70 00 00 00"
                  class="w-full rounded-xl px-4 py-3 text-sm transition-all outline-none" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" />
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Mot de passe</label>
                <div class="relative">
                  <input type="password" name="password" required placeholder="••••••••"
                    class="w-full rounded-xl px-4 py-3 pr-12 text-sm transition-all outline-none" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" id="pwd-input" />
                  <button type="button" onclick="togglePwd()" class="absolute right-4 top-1/2 -translate-y-1/2" style="color:#94a3b8;">
                    <i class="fas fa-eye text-sm" id="eye-icon"></i>
                  </button>
                </div>
              </div>
              <button type="submit" class="w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all hover:-translate-y-0.5" style="background:linear-gradient(135deg,#03045e,#0077b6); box-shadow:0 8px 24px rgba(0,119,182,0.35);">
                <i class="fas fa-sign-in-alt"></i>
                <span>Se connecter</span>
              </button>
            </form>
          </div>

          {/* Formulaire Inscription */}
          <div id="form-signup" style={defaultTab === 'signup' ? '' : 'display:none;'}>
            <form method="post" action="/api/register" class="space-y-4">
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Nom complet <span style="color:#e11d48;">*</span></label>
                <input type="text" name="name" required placeholder="Votre nom et prénom"
                  class="w-full rounded-xl px-4 py-3 text-sm outline-none" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" />
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Téléphone <span style="color:#e11d48;">*</span></label>
                <div class="flex rounded-xl overflow-hidden" style="border:1.5px solid rgba(0,119,182,0.2);">
                  <div class="flex items-center px-3 text-sm font-bold" style="background:rgba(0,119,182,0.06); color:#0077b6; border-right:1px solid rgba(0,119,182,0.15); white-space:nowrap;">
                    🇧🇫 +226
                  </div>
                  <input type="tel" name="phone" required placeholder="70 00 00 00"
                    class="flex-1 px-4 py-3 text-sm outline-none" style="background:#f8fbff; color:#03045e;" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Email <span style="color:#94a3b8; font-weight:400;">(optionnel)</span></label>
                  <input type="email" name="email" placeholder="votre@email.com"
                    class="w-full rounded-xl px-4 py-3 text-sm outline-none" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" />
                </div>
                <div>
                  <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Quartier <span style="color:#e11d48;">*</span></label>
                  <input type="text" name="quartier" required placeholder="Ouaga 2000…"
                    class="w-full rounded-xl px-4 py-3 text-sm outline-none" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Mot de passe <span style="color:#e11d48;">*</span></label>
                <div class="relative">
                  <input type="password" name="password" required placeholder="••••••••" minlength={6}
                    class="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" id="pwd-signup" />
                  <button type="button" onclick="togglePwdSignup()" class="absolute right-4 top-1/2 -translate-y-1/2" style="color:#94a3b8;">
                    <i class="fas fa-eye text-sm" id="eye-signup"></i>
                  </button>
                </div>
              </div>
              <button type="submit" class="w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all hover:-translate-y-0.5" style="background:linear-gradient(135deg,#03045e,#0077b6); box-shadow:0 8px 24px rgba(0,119,182,0.35);">
                <i class="fas fa-user-plus"></i>
                <span>Créer mon compte</span>
              </button>
            </form>
          </div>

          <p class="text-center text-xs mt-4" style="color:#94a3b8;">
            <i class="fas fa-lock mr-1"></i>Connexion sécurisée · Données protégées
          </p>
        </div>
      </div>
    </div>

    <script dangerouslySetInnerHTML={{ __html: `
      function togglePwd() {
        var i=document.getElementById('pwd-input'),e=document.getElementById('eye-icon');
        i.type=i.type==='password'?'text':'password'; e.className='fas fa-eye'+(i.type==='text'?'-slash':'');
      }
      function togglePwdSignup() {
        var i=document.getElementById('pwd-signup'),e=document.getElementById('eye-signup');
        i.type=i.type==='password'?'text':'password'; e.className='fas fa-eye'+(i.type==='text'?'-slash':'');
      }
      function switchTab(tab) {
        var isLogin=tab==='login';
        document.getElementById('form-login').style.display=isLogin?'block':'none';
        document.getElementById('form-signup').style.display=isLogin?'none':'block';
        var tl=document.getElementById('tab-login'),ts=document.getElementById('tab-signup');
        var activeStyle='background:linear-gradient(135deg,#0077b6,#00b4d8);color:#ffffff;box-shadow:0 4px 12px rgba(0,119,182,0.3);';
        var inactiveStyle='background:transparent;color:#0077b6;box-shadow:none;';
        tl.style.cssText=isLogin?activeStyle:inactiveStyle;
        ts.style.cssText=isLogin?inactiveStyle:activeStyle;
      }
    `}} />
  </Layout>
)

// Format date helper
function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return dateStr }
}

// Status badge helpers
function orderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'En attente', validation_terrain: 'Visite terrain', validated: 'Validée',
    installed: 'Installée', cancelled: 'Annulée', commande: 'Commande'
  }
  return map[status] || status
}
function orderStatusColor(status: string): string {
  if (status === 'installed') return 'color:#34d399; background:rgba(52,211,153,0.12);'
  if (status === 'validated') return 'color:#38bdf8; background:rgba(56,189,248,0.12);'
  if (status === 'cancelled') return 'color:#f87171; background:rgba(248,113,113,0.12);'
  return 'color:#fbbf24; background:rgba(251,191,36,0.12);'
}
function rdvStatusLabel(status: string): string {
  const map: Record<string, string> = { pending: 'En attente', confirmed: 'Confirmé', done: 'Effectué' }
  return map[status] || status
}
function rdvStatusColor(status: string): string {
  if (status === 'done') return 'color:#34d399; background:rgba(52,211,153,0.12);'
  if (status === 'confirmed') return 'color:#38bdf8; background:rgba(56,189,248,0.12);'
  return 'color:#fbbf24; background:rgba(251,191,36,0.12);'
}
function rdvTypeLabel(type: string): string {
  return type === 'installation' ? 'Installation' : type === 'devis' ? 'Devis / Visite' : type
}

const ClientDashboard = ({ clientName, clientPhone, clientEmail, clientQuartier, orders, rdvs, clientSince }: {
  clientName: string
  clientPhone: string
  clientEmail: string
  clientQuartier: string
  orders: ClientOrder[]
  rdvs: ClientRdv[]
  clientSince: string
}) => {
  const initials = clientName.split(' ').map((n: string) => n[0] || '').join('').toUpperCase().slice(0, 2) || '?'
  const totalOrders = orders.length
  const installedCount = orders.filter(o => o.status === 'installed').length
  const pendingRdvs = rdvs.filter(r => r.status === 'pending' || r.status === 'confirmed')
  const nextRdv = pendingRdvs.length > 0 ? pendingRdvs[0] : null

  return (
    <Layout title={`Mon profil — ${clientName}`} activePage="client">

      {/* Hero profil */}
      <section class="gradient-hero py-12 text-white relative overflow-hidden">
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar initiales */}
            <div class="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xl flex-shrink-0" style="background:rgba(255,255,255,0.2); border:2px solid rgba(255,255,255,0.3);">
              {initials}
            </div>
            <div class="text-center sm:text-left flex-1">
              <div class="text-sm mb-1" style="color:rgba(186,230,253,0.8);">Mon compte MAASGA</div>
              <h1 class="text-3xl font-bold mb-2">{clientName}</h1>
              <div class="flex flex-wrap gap-3 justify-center sm:justify-start text-sm" style="color:rgba(186,230,253,0.75);">
                {clientPhone && <span><i class="fas fa-phone mr-1.5"></i>{clientPhone}</span>}
                {clientEmail && <span><i class="fas fa-envelope mr-1.5"></i>{clientEmail}</span>}
                {clientQuartier && <span><i class="fas fa-map-marker-alt mr-1.5"></i>{clientQuartier}</span>}
                {clientSince && <span><i class="fas fa-star mr-1.5"></i>Membre depuis {formatDate(clientSince)}</span>}
              </div>
            </div>
            <a href="/api/logout" class="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all hover:bg-white/25" style="background:rgba(255,255,255,0.15); color:#ffffff; border:1px solid rgba(255,255,255,0.2);">
              <i class="fas fa-sign-out-alt"></i>
              <span>Déconnexion</span>
            </a>
          </div>
        </div>
      </section>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats */}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 reveal">
          {[
            { icon: "fa-shopping-bag",  color: "#0077b6", bg: "rgba(0,119,182,0.08)",   label: "Commandes",    val: String(totalOrders) },
            { icon: "fa-tools",         color: "#16a34a", bg: "rgba(22,163,74,0.08)",   label: "Installations", val: String(installedCount) },
            { icon: "fa-calendar-check",color: "#7c3aed", bg: "rgba(124,58,237,0.08)",  label: "Rendez-vous",   val: String(rdvs.length) },
            { icon: "fa-clock",         color: "#d97706", bg: "rgba(217,119,6,0.08)",   label: "RDV en cours",  val: String(pendingRdvs.length) }
          ].map(s => (
            <div class="glass-card rounded-2xl p-4 flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={`background:${s.bg};`}>
                <i class={`fas ${s.icon}`} style={`color:${s.color};`}></i>
              </div>
              <div>
                <div class="text-xs font-medium" style="color:#64748b;">{s.label}</div>
                <div class="text-xl font-bold" style="color:#03045e;">{s.val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Alerte prochain RDV */}
        {nextRdv && (
          <div class="mb-6 rounded-2xl p-5 reveal flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style="background:linear-gradient(135deg,#0077b6,#00b4d8); color:#ffffff;">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(255,255,255,0.2);">
                <i class="fas fa-bell text-white text-lg"></i>
              </div>
              <div>
                <div class="text-xs font-medium" style="color:rgba(186,230,253,0.9);">Prochain rendez-vous</div>
                <div class="text-lg font-bold">{formatDate(nextRdv.date)} · {nextRdv.heure_debut}–{nextRdv.heure_fin}</div>
                <div class="text-sm" style="color:rgba(186,230,253,0.8);">{rdvTypeLabel(nextRdv.type)}{nextRdv.quartier ? ` · ${nextRdv.quartier}` : ''}</div>
              </div>
            </div>
            <a href={`https://wa.me/22655996418?text=Bonjour MAASGA, je confirme mon RDV du ${nextRdv.date}`} target="_blank"
              class="flex items-center space-x-2 bg-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors flex-shrink-0" style="color:#0077b6;">
              <i class="fab fa-whatsapp" style="color:#25d366;"></i>
              <span>Confirmer par WhatsApp</span>
            </a>
          </div>
        )}

        <div class="space-y-6">
          {/* Mes commandes */}
          <div class="glass-card rounded-2xl p-6 reveal">
            <div class="flex items-center justify-between mb-5">
              <h3 class="font-bold flex items-center space-x-2" style="color:#03045e;">
                <i class="fas fa-shopping-bag" style="color:#0077b6;"></i>
                <span>Mes commandes</span>
              </h3>
              <span class="text-xs px-2.5 py-1 rounded-full font-bold" style="background:rgba(0,119,182,0.1); color:#0077b6;">{totalOrders}</span>
            </div>
            {orders.length === 0 ? (
              <div class="text-center py-8">
                <i class="fas fa-box-open text-4xl mb-3" style="color:#cbd5e1;"></i>
                <p class="text-sm mb-4" style="color:#64748b;">Aucune commande pour le moment</p>
                <a href="/catalogue" class="inline-flex items-center space-x-2 text-sm font-bold px-5 py-2.5 rounded-xl btn-primary text-white">
                  <i class="fas fa-th-large"></i><span>Voir le catalogue</span>
                </a>
              </div>
            ) : (
              <div class="space-y-3">
                {orders.map(o => (
                  <div class="flex items-center justify-between p-4 rounded-xl" style="background:#f0f7ff; border:1px solid rgba(0,119,182,0.08);">
                    <div class="flex items-center space-x-3">
                      <div class="text-2xl">{o.image || '❄️'}</div>
                      <div>
                        <div class="text-sm font-semibold" style="color:#03045e;">{o.product_name || `Commande #${o.id}`}</div>
                        <div class="text-xs" style="color:#64748b;">#{o.id} · {formatDate(o.created_at)}{o.brand ? ` · ${o.brand}` : ''}{o.btu ? ` · ${(o.btu/1000).toFixed(0)}k BTU` : ''}</div>
                        {o.total_price ? <div class="text-xs font-bold mt-0.5" style="color:#0077b6;">{o.total_price.toLocaleString()} FCFA</div> : null}
                      </div>
                    </div>
                    <span class="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap" style={orderStatusColor(o.status)}>{orderStatusLabel(o.status)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mes rendez-vous */}
          <div class="glass-card rounded-2xl p-6 reveal">
            <div class="flex items-center justify-between mb-5">
              <h3 class="font-bold flex items-center space-x-2" style="color:#03045e;">
                <i class="fas fa-calendar-alt" style="color:#16a34a;"></i>
                <span>Mes rendez-vous</span>
              </h3>
              <span class="text-xs px-2.5 py-1 rounded-full font-bold" style="background:rgba(22,163,74,0.1); color:#16a34a;">{rdvs.length}</span>
            </div>
            {rdvs.length === 0 ? (
              <div class="text-center py-8">
                <i class="fas fa-calendar text-4xl mb-3" style="color:#cbd5e1;"></i>
                <p class="text-sm mb-4" style="color:#64748b;">Aucun rendez-vous enregistré</p>
                <a href="/rendez-vous" class="inline-flex items-center space-x-2 text-sm font-bold px-5 py-2.5 rounded-xl btn-primary text-white">
                  <i class="fas fa-calendar-plus"></i><span>Prendre rendez-vous</span>
                </a>
              </div>
            ) : (
              <div class="space-y-3">
                {rdvs.map(r => (
                  <div class="p-4 rounded-xl" style="background:rgba(22,163,74,0.04); border:1px solid rgba(22,163,74,0.12);">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <div class="text-sm font-semibold" style="color:#03045e;">{rdvTypeLabel(r.type)}</div>
                        <div class="text-xs mt-0.5" style="color:#64748b;">{formatDate(r.date)} · {r.heure_debut}–{r.heure_fin}{r.quartier ? ` · ${r.quartier}` : ''}</div>
                        {r.notes && <div class="text-xs mt-1" style="color:#94a3b8;">{r.notes}</div>}
                      </div>
                      <span class="text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap" style={rdvStatusColor(r.status)}>{rdvStatusLabel(r.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 reveal">
            <a href="/rendez-vous" class="flex items-center justify-center space-x-2 p-4 rounded-2xl font-bold text-sm btn-primary text-white">
              <i class="fas fa-calendar-plus"></i><span>Nouveau RDV</span>
            </a>
            <a href="/catalogue" class="flex items-center justify-center space-x-2 p-4 rounded-2xl font-bold text-sm" style="background:#f0f7ff; color:#0077b6; border:1px solid rgba(0,119,182,0.12);">
              <i class="fas fa-th-large"></i><span>Catalogue</span>
            </a>
            <a href={`https://wa.me/22655996418?text=Bonjour MAASGA, j'ai besoin d'aide.`} target="_blank" class="flex items-center justify-center space-x-2 p-4 rounded-2xl font-bold text-sm" style="background:rgba(37,211,102,0.08); color:#16a34a; border:1px solid rgba(37,211,102,0.15);">
              <i class="fab fa-whatsapp"></i><span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  )
}
