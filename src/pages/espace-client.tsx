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

interface ClientMaintenanceContract {
  id: number
  plan_type: string
  plan_price: number
  start_date: string
  end_date: string
  status: string
  total_visits: number
  completed_visits: number
  next_visit_date?: string
  notes?: string
}

interface ClientMaintenanceVisit {
  id: number
  contract_id?: number
  visit_type: string
  visit_date: string
  status: string
  technician?: string
  description?: string
  actions_performed?: string
  notes?: string
}

interface ClientMaintenanceRequest {
  id: number
  request_type: string
  description?: string
  preferred_date?: string
  equipment_type?: string
  plan_type?: string
  status: string
  created_at: string
}

interface ClientPayment {
  id: number
  payment_type: string
  amount: number
  method?: string
  status: string
  provider_ref?: string
  created_at: string
}

interface ActivityLogEntry {
  id: number
  action: string
  category: string
  details?: string
  created_at: string
}

export const EspaceClientPage = ({ error, success, tab, redirect, loggedIn, fixUrl, sessionClientId, clientName, clientPhone, clientEmail, clientQuartier, clientOrders, clientRdvs, clientSince, clientMaintenanceContracts, clientMaintenanceVisits, clientMaintenanceRequests, clientPayments, clientActivityLog }: {
  error?: string
  success?: string
  tab?: string
  redirect?: string
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
  clientMaintenanceContracts?: ClientMaintenanceContract[]
  clientMaintenanceVisits?: ClientMaintenanceVisit[]
  clientMaintenanceRequests?: ClientMaintenanceRequest[]
  clientPayments?: ClientPayment[]
  clientActivityLog?: ActivityLogEntry[]
}) => {
  if (loggedIn) {
    return <>
      <script dangerouslySetInnerHTML={{ __html: `history.replaceState({},'','/espace-client');` }} />
      <ClientDashboard
        clientName={clientName || 'Client'}
        clientPhone={clientPhone || ''}
        clientEmail={clientEmail || ''}
        clientQuartier={clientQuartier || ''}
        orders={clientOrders || []}
        rdvs={clientRdvs || []}
        clientSince={clientSince || ''}
        maintenanceContracts={clientMaintenanceContracts || []}
        maintenanceVisits={clientMaintenanceVisits || []}
        maintenanceRequests={clientMaintenanceRequests || []}
        payments={clientPayments || []}
        activityLog={clientActivityLog || []}
      />
    </>
  }
  return <ClientLogin error={error} success={success} defaultTab={tab} redirect={redirect} />
}

const ClientLogin = ({ error, success, defaultTab, redirect }: { error?: string; success?: string; defaultTab?: string; redirect?: string }) => (
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

          {success && (
            <div class="mb-5 rounded-xl p-3 flex items-center space-x-2 text-sm" style="background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.3); color:#16a34a;">
              <i class="fas fa-check-circle"></i>
              <span>{success}</span>
            </div>
          )}

          {/* Formulaire Connexion */}
          <div id="form-login" style={defaultTab === 'signup' ? 'display:none;' : ''}>
            <form method="post" action="/api/login" class="space-y-4">
              {redirect && <input type="hidden" name="redirect" value={redirect} />}
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Email ou téléphone</label>
                <input type="text" name="identifier" required placeholder="email@exemple.com ou 55 99 64 18"
                  autocomplete="username" class="w-full rounded-xl px-4 py-3 text-sm transition-all outline-none" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" />
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Mot de passe</label>
                <div class="relative">
                  <input type="password" name="password" required placeholder="••••••••"
                    autocomplete="current-password" class="w-full rounded-xl px-4 py-3 pr-12 text-sm transition-all outline-none" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" id="pwd-input" />
                  <button type="button" onclick="togglePwd()" class="absolute right-4 top-1/2 -translate-y-1/2" style="color:#94a3b8;">
                    <i class="fas fa-eye text-sm" id="eye-icon"></i>
                  </button>
                </div>
              </div>
              <button type="submit" class="w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all hover:-translate-y-0.5" style="background:linear-gradient(135deg,#03045e,#0077b6); box-shadow:0 8px 24px rgba(0,119,182,0.35);">
                <i class="fas fa-sign-in-alt"></i>
                <span>Se connecter</span>
              </button>
              <div class="text-center mt-3">
                <a href="/espace-client/reset-password" class="text-xs font-medium hover:underline" style="color:#0077b6;">
                  <i class="fas fa-lock mr-1"></i>Mot de passe oublié ?
                </a>
              </div>
            </form>
          </div>

          {/* Formulaire Inscription */}
          <div id="form-signup" style={defaultTab === 'signup' ? '' : 'display:none;'}>
            <form method="post" action="/api/register" class="space-y-4">
              {redirect && <input type="hidden" name="redirect" value={redirect} />}
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Nom complet <span style="color:#e11d48;">*</span></label>
                <input type="text" name="name" required placeholder="Votre nom et prénom"
                  autocomplete="name" class="w-full rounded-xl px-4 py-3 text-sm outline-none" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" />
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Téléphone (Whatsapp) <span style="color:#e11d48;">*</span></label>
                <div class="flex rounded-xl overflow-hidden" style="border:1.5px solid rgba(0,119,182,0.2);">
                  <div class="flex items-center px-3 text-sm font-bold" style="background:rgba(0,119,182,0.06); color:#0077b6; border-right:1px solid rgba(0,119,182,0.15); white-space:nowrap;">
                    🇧🇫 +226
                  </div>
                  <input type="tel" name="phone" required placeholder="55 99 64 18"
                    autocomplete="tel" class="flex-1 px-4 py-3 text-sm outline-none" style="background:#f8fbff; color:#03045e;" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Email <span style="color:#94a3b8; font-weight:400;">(optionnel)</span></label>
                  <input type="email" name="email" placeholder="votre@email.com"
                    autocomplete="email" class="w-full rounded-xl px-4 py-3 text-sm outline-none" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" />
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
                  <input type="password" name="password" required placeholder="••••••••" minlength={8}
                    autocomplete="new-password" class="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" id="pwd-signup" />
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

          {/* Séparateur */}
          <div class="flex items-center my-5">
            <div class="flex-1 h-px" style="background:rgba(0,119,182,0.15);"></div>
            <span class="px-3 text-xs font-medium" style="color:#94a3b8;">ou</span>
            <div class="flex-1 h-px" style="background:rgba(0,119,182,0.15);"></div>
          </div>

          {/* Google OAuth */}
          <a href={redirect ? `/api/auth/google?redirect=${encodeURIComponent(redirect)}` : '/api/auth/google'} class="w-full flex items-center justify-center space-x-3 py-3.5 rounded-2xl font-semibold text-sm transition-all hover:-translate-y-0.5" style="background:#ffffff; border:1.5px solid #e2e8f0; color:#334155; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            <span>Continuer avec Google</span>
          </a>
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
    pending: 'En attente', paid: 'Payée', en_livraison: 'En livraison', livre: 'Livrée',
    validation_terrain: 'Visite terrain', devis_en_attente: 'Devis en attente', devis_valide: 'Devis validé',
    devis_refuse: 'Devis refusé', validated: 'Validée', installing: 'En installation',
    installed: 'Installée', cancelled: 'Annulée', refunded: 'Remboursée'
  }
  return map[status] || status
}
function orderStatusColor(status: string): string {
  if (status === 'installed') return 'color:#34d399; background:rgba(52,211,153,0.12);'
  if (status === 'paid' || status === 'validated' || status === 'devis_valide') return 'color:#38bdf8; background:rgba(56,189,248,0.12);'
  if (status === 'en_livraison' || status === 'installing') return 'color:#a78bfa; background:rgba(167,139,250,0.12);'
  if (status === 'livre') return 'color:#2dd4bf; background:rgba(45,212,191,0.12);'
  if (status === 'devis_en_attente' || status === 'validation_terrain') return 'color:#f59e0b; background:rgba(245,158,11,0.12);'
  if (status === 'cancelled' || status === 'devis_refuse') return 'color:#f87171; background:rgba(248,113,113,0.12);'
  if (status === 'refunded') return 'color:#7c3aed; background:rgba(124,58,237,0.12);'
  return 'color:#fbbf24; background:rgba(251,191,36,0.12);'
}
function orderStepIndex(status: string): number {
  const steps = ['pending', 'paid', 'en_livraison', 'livre', 'validation_terrain', 'installed']
  const idx = steps.indexOf(status)
  if (status === 'devis_en_attente' || status === 'devis_valide' || status === 'devis_refuse') return 4
  if (status === 'validated' || status === 'installing') return 4.5
  return idx >= 0 ? idx : 0
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

// Payment status helpers
function paymentStatusLabel(status: string): string {
  const map: Record<string, string> = { pending: 'En attente', processing: 'En cours', completed: 'Payé', failed: 'Échoué', refunded: 'Remboursé', cancelled: 'Annulé' }
  return map[status] || status
}
function paymentStatusColor(status: string): string {
  if (status === 'completed') return 'color:#16a34a; background:rgba(22,163,74,0.12);'
  if (status === 'failed' || status === 'cancelled') return 'color:#ef4444; background:rgba(239,68,68,0.12);'
  if (status === 'refunded') return 'color:#7c3aed; background:rgba(124,58,237,0.12);'
  return 'color:#d97706; background:rgba(217,119,6,0.12);'
}
function paymentMethodLabel(method: string): string {
  const map: Record<string, string> = { orange_money: 'Orange Money', moov_money: 'Moov Money', wave: 'Wave', carte_bancaire: 'Carte bancaire', ligdicash: 'LigdiCash', cash: 'Espèces' }
  return map[method] || method
}
function activityCategoryIcon(category: string): string {
  const map: Record<string, string> = { auth: 'fa-sign-in-alt', order: 'fa-shopping-cart', payment: 'fa-credit-card', rdv: 'fa-calendar', maintenance: 'fa-tools', profile: 'fa-user', other: 'fa-circle' }
  return map[category] || 'fa-circle'
}
function activityCategoryColor(category: string): string {
  const map: Record<string, string> = { auth: '#0077b6', order: '#7c3aed', payment: '#16a34a', rdv: '#d97706', maintenance: '#0ea5e9', profile: '#64748b', other: '#94a3b8' }
  return map[category] || '#94a3b8'
}
function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return dateStr }
}

const ClientDashboard = ({ clientName, clientPhone, clientEmail, clientQuartier, orders, rdvs, clientSince, maintenanceContracts, maintenanceVisits, maintenanceRequests, payments, activityLog }: {
  clientName: string
  clientPhone: string
  clientEmail: string
  clientQuartier: string
  orders: ClientOrder[]
  rdvs: ClientRdv[]
  clientSince: string
  maintenanceContracts: ClientMaintenanceContract[]
  maintenanceVisits: ClientMaintenanceVisit[]
  maintenanceRequests: ClientMaintenanceRequest[]
  payments: ClientPayment[]
  activityLog: ActivityLogEntry[]
}) => {
  const initials = clientName.split(' ').map((n: string) => n[0] || '').join('').toUpperCase().slice(0, 2) || '?'
  const totalOrders = orders.length
  const installedCount = orders.filter(o => o.status === 'installed').length
  const pendingRdvs = rdvs.filter(r => r.status === 'pending' || r.status === 'confirmed')
  const nextRdv = pendingRdvs.length > 0 ? pendingRdvs[0] : null
  const activeContracts = maintenanceContracts.filter(c => c.status === 'active')
  const allMaintenanceItems = [...maintenanceVisits, ...maintenanceRequests].length

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

        {/* Profile completion banner for Google OAuth users missing phone/quartier */}
        {(!clientPhone || !clientQuartier) && (
          <div id="profile-completion-banner" class="mb-6 rounded-2xl p-5 reveal" style="background:linear-gradient(135deg,rgba(251,191,36,0.08),rgba(245,158,11,0.05)); border:1.5px solid rgba(251,191,36,0.3);">
            <div class="flex items-start space-x-4">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(251,191,36,0.15);">
                <i class="fas fa-user-edit text-lg" style="color:#f59e0b;"></i>
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-base mb-1" style="color:#92400e;">Complétez votre profil</h3>
                <p class="text-sm mb-4" style="color:#78716c;">
                  {!clientPhone && !clientQuartier
                    ? 'Ajoutez votre numéro de téléphone et votre quartier pour faciliter vos commandes et rendez-vous.'
                    : !clientPhone
                    ? 'Ajoutez votre numéro de téléphone pour que nous puissions vous contacter.'
                    : 'Ajoutez votre quartier pour faciliter les interventions.'}
                </p>
                <div class="space-y-3" id="profile-form-fields">
                  {!clientPhone && (
                    <div>
                      <label class="block text-xs font-semibold mb-1.5" style="color:#78716c;">Téléphone (WhatsApp)</label>
                      <div class="flex rounded-xl overflow-hidden" style="border:1.5px solid rgba(251,191,36,0.3); background:#fffbeb;">
                        <div class="flex items-center px-3 text-sm font-bold" style="color:#92400e; border-right:1px solid rgba(251,191,36,0.2); white-space:nowrap;">🇧🇫 +226</div>
                        <input type="tel" id="profile-phone" placeholder="55 99 64 18" class="flex-1 px-4 py-2.5 text-sm outline-none" style="background:transparent; color:#1c1917;" />
                      </div>
                    </div>
                  )}
                  {!clientQuartier && (
                    <div>
                      <label class="block text-xs font-semibold mb-1.5" style="color:#78716c;">Quartier / Secteur</label>
                      <input type="text" id="profile-quartier" placeholder="Ex: Ouaga 2000, Pissy, Dassasgho..." class="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style="border:1.5px solid rgba(251,191,36,0.3); background:#fffbeb; color:#1c1917;" />
                    </div>
                  )}
                  <button type="button" id="profile-save-btn" onclick="saveProfile()" class="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5" style="background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; box-shadow:0 4px 12px rgba(245,158,11,0.3);">
                    <i class="fas fa-save"></i>
                    <span>Enregistrer</span>
                  </button>
                  <div id="profile-save-status" class="text-sm font-medium hidden"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 reveal">
          {[
            { icon: "fa-shopping-bag",  color: "#0077b6", bg: "rgba(0,119,182,0.08)",   label: "Commandes",    val: String(totalOrders) },
            { icon: "fa-tools",         color: "#16a34a", bg: "rgba(22,163,74,0.08)",   label: "Installations", val: String(installedCount) },
            { icon: "fa-calendar-check",color: "#7c3aed", bg: "rgba(124,58,237,0.08)",  label: "Rendez-vous",   val: String(rdvs.length) },
            { icon: "fa-clock",         color: "#d97706", bg: "rgba(217,119,6,0.08)",   label: "RDV en cours",  val: String(pendingRdvs.length) },
            { icon: "fa-shield-alt",    color: "#0ea5e9", bg: "rgba(14,165,233,0.08)",  label: "Maintenance",   val: String(activeContracts.length) }
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
            <a href={`https://wa.me/22655996418?text=Bonjour MAASGA, je confirme mon RDV du ${nextRdv.date}`} target="_blank" rel="noopener noreferrer"
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
              <div class="space-y-4">
                {orders.map(o => {
                  const step = orderStepIndex(o.status)
                  const isCancelled = o.status === 'cancelled' || o.status === 'refunded'
                  const steps = [
                    { label: 'Commande', icon: 'fa-receipt', done: step >= 0 },
                    { label: 'Payée', icon: 'fa-credit-card', done: step >= 1 },
                    { label: 'Livraison', icon: 'fa-truck', done: step >= 2 },
                    { label: 'Livrée', icon: 'fa-box-open', done: step >= 3 },
                    { label: 'Validation', icon: 'fa-clipboard-check', done: step >= 4 },
                    { label: 'Installée', icon: 'fa-check-double', done: step >= 5 }
                  ]
                  return (
                    <div class="p-4 rounded-xl" style="background:#f0f7ff; border:1px solid rgba(0,119,182,0.1);">
                      {/* Header */}
                      <div class="flex items-center justify-between mb-3">
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

                      {/* Step Progress Bar */}
                      {!isCancelled && (
                        <div class="flex items-center gap-0 mb-3 px-1 overflow-x-auto" style="min-height:44px;">
                          {steps.map((s, i) => (
                            <div class="flex items-center" style="flex:1; min-width:0;">
                              <div class="flex flex-col items-center" style="min-width:28px;">
                                <div
                                  class="flex items-center justify-center rounded-full text-white"
                                  style={`width:24px;height:24px;font-size:10px; ${s.done ? 'background:linear-gradient(135deg,#0077b6,#00b4d8);' : 'background:#cbd5e1;'}`}
                                >
                                  <i class={`fas ${s.icon}`}></i>
                                </div>
                                <span class="text-center mt-1" style={`font-size:9px;line-height:1.1; ${s.done ? 'color:#0077b6;font-weight:700;' : 'color:#94a3b8;'}`}>{s.label}</span>
                              </div>
                              {i < steps.length - 1 && (
                                <div style={`flex:1;height:2px;margin:0 2px; ${steps[i+1].done ? 'background:#0077b6;' : 'background:#e2e8f0;'}`}></div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Cancelled / refunded banner */}
                      {isCancelled && (
                        <div class="flex items-center space-x-2 p-2.5 rounded-lg mb-3" style="background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.12);">
                          <i class="fas fa-times-circle text-sm" style="color:#ef4444;"></i>
                          <span class="text-xs font-semibold" style="color:#ef4444;">{o.status === 'refunded' ? 'Commande annulée — remboursement traité' : 'Commande annulée'}</span>
                        </div>
                      )}

                      {/* Action buttons depending on status */}
                      <div class="flex flex-wrap gap-2">
                        {o.status === 'en_livraison' && (
                          <button onclick={`confirmDelivery(${o.id})`} class="inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-2 rounded-lg text-white" style="background:linear-gradient(135deg,#059669,#10b981);">
                            <i class="fas fa-check"></i><span>Confirmer la réception</span>
                          </button>
                        )}
                        {o.status === 'devis_en_attente' && (
                          <>
                            <button onclick={`viewDevis(${o.id})`} class="inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-2 rounded-lg text-white" style="background:linear-gradient(135deg,#0077b6,#00b4d8);">
                              <i class="fas fa-file-invoice"></i><span>Voir le devis</span>
                            </button>
                          </>
                        )}
                        {(o.status === 'validation_terrain' || o.status === 'devis_en_attente' || o.status === 'devis_refuse') && (
                          <button onclick={`cancelInstallation(${o.id})`} class="inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-2 rounded-lg" style="background:rgba(239,68,68,0.08); color:#ef4444; border:1px solid rgba(239,68,68,0.15);">
                            <i class="fas fa-ban"></i><span>Annuler l'installation</span>
                          </button>
                        )}
                        {['paid', 'en_livraison', 'livre', 'validation_terrain', 'devis_en_attente', 'devis_refuse'].includes(o.status) && (
                          <button onclick={`cancelOrder(${o.id})`} class="inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-2 rounded-lg" style="background:rgba(127,29,29,0.06); color:#991b1b; border:1px solid rgba(127,29,29,0.12);">
                            <i class="fas fa-undo"></i><span>Annuler et rembourser</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
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
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 reveal">
            <a href="/rendez-vous" class="flex items-center justify-center space-x-2 p-4 rounded-2xl font-bold text-sm btn-primary text-white">
              <i class="fas fa-calendar-plus"></i><span>Nouveau RDV</span>
            </a>
            <a href="/contrat-maintenance" class="flex items-center justify-center space-x-2 p-4 rounded-2xl font-bold text-sm" style="background:rgba(14,165,233,0.08); color:#0ea5e9; border:1px solid rgba(14,165,233,0.15);">
              <i class="fas fa-shield-alt"></i><span>Maintenance</span>
            </a>
            <a href="/catalogue" class="flex items-center justify-center space-x-2 p-4 rounded-2xl font-bold text-sm" style="background:#f0f7ff; color:#0077b6; border:1px solid rgba(0,119,182,0.12);">
              <i class="fas fa-th-large"></i><span>Catalogue</span>
            </a>
            <a href={`https://wa.me/22655996418?text=Bonjour MAASGA, j'ai besoin d'aide.`} target="_blank" rel="noopener noreferrer" class="flex items-center justify-center space-x-2 p-4 rounded-2xl font-bold text-sm" style="background:rgba(37,211,102,0.08); color:#16a34a; border:1px solid rgba(37,211,102,0.15);">
              <i class="fab fa-whatsapp"></i><span>WhatsApp</span>
            </a>
          </div>

          {/* === ALERTE PROCHAINE MAINTENANCE === */}
          {maintenanceContracts.length > 0 && (() => {
            // Find next upcoming visit across all contracts
            const todayStr = new Date().toISOString().split('T')[0]
            const allUpcoming = maintenanceVisits
              .filter(v => (v.status === 'planifiee' || v.status === 'confirmee') && v.visit_date >= todayStr)
              .sort((a, b) => a.visit_date.localeCompare(b.visit_date))
            const nextVisit = allUpcoming[0]
            if (!nextVisit) return null
            const daysLeft = Math.ceil((new Date(nextVisit.visit_date).getTime() - new Date(todayStr).getTime()) / 86400000)
            const contract = maintenanceContracts.find(c => c.id === nextVisit.contract_id)
            const urgencyBg = daysLeft <= 1 ? 'linear-gradient(135deg,rgba(239,68,68,0.08),rgba(245,158,11,0.08))' : daysLeft <= 7 ? 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(14,165,233,0.05))' : 'linear-gradient(135deg,rgba(14,165,233,0.06),rgba(0,119,182,0.04))'
            const urgencyBorder = daysLeft <= 1 ? 'rgba(239,68,68,0.2)' : daysLeft <= 7 ? 'rgba(245,158,11,0.2)' : 'rgba(14,165,233,0.15)'
            const urgencyColor = daysLeft <= 1 ? '#ef4444' : daysLeft <= 7 ? '#d97706' : '#0077b6'
            const urgencyIcon = daysLeft <= 1 ? 'fa-exclamation-circle' : daysLeft <= 7 ? 'fa-bell' : 'fa-calendar-check'
            return (
              <div class="rounded-2xl p-5 reveal" style={`background:${urgencyBg}; border:1px solid ${urgencyBorder};`}>
                <div class="flex items-start space-x-3">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={`background:rgba(14,165,233,0.1);`}>
                    <i class={`fas ${urgencyIcon} text-xl`} style={`color:${urgencyColor};`}></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-bold" style={`color:${urgencyColor};`}>
                      {daysLeft === 0 ? "🔔 Maintenance aujourd'hui !" : daysLeft === 1 ? '🔔 Maintenance demain !' : `📅 Prochaine maintenance dans ${daysLeft} jours`}
                    </div>
                    <div class="text-xs mt-1" style="color:#64748b;">
                      <strong>{formatDate(nextVisit.visit_date)}</strong>
                      {contract && <span> · Contrat {contract.plan_type === 'trimestriel' ? 'Trimestriel' : contract.plan_type === 'semestriel' ? 'Semestriel' : 'Annuel'}</span>}
                    </div>
                    {allUpcoming.length > 1 && (
                      <div class="text-xs mt-1" style="color:#94a3b8;">+ {allUpcoming.length - 1} autre{allUpcoming.length > 2 ? 's' : ''} visite{allUpcoming.length > 2 ? 's' : ''} planifiée{allUpcoming.length > 2 ? 's' : ''}</div>
                    )}
                  </div>
                  <div class="text-center flex-shrink-0">
                    <div class="text-2xl font-black" style={`color:${urgencyColor};`}>{daysLeft === 0 ? "J" : `J-${daysLeft}`}</div>
                    <div class="text-xs" style="color:#94a3b8;">{daysLeft === 0 ? "Aujourd'hui" : daysLeft === 1 ? 'Demain' : 'jours'}</div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Contrats de maintenance */}
          <div class="glass-card rounded-2xl p-6 reveal">
            <div class="flex items-center justify-between mb-5">
              <h3 class="font-bold flex items-center space-x-2" style="color:#03045e;">
                <i class="fas fa-file-contract" style="color:#0ea5e9;"></i>
                <span>Mes contrats de maintenance</span>
              </h3>
              <span class="text-xs px-2.5 py-1 rounded-full font-bold" style="background:rgba(14,165,233,0.1); color:#0ea5e9;">{maintenanceContracts.length}</span>
            </div>
            {maintenanceContracts.length === 0 ? (
              <div class="text-center py-8">
                <i class="fas fa-shield-alt text-4xl mb-3" style="color:#cbd5e1;"></i>
                <p class="text-sm mb-2" style="color:#64748b;">Aucun contrat de maintenance actif</p>
                <p class="text-xs mb-4" style="color:#94a3b8;">Protégez votre climatisation avec un contrat de maintenance préventive</p>
                <a href="/contrat-maintenance" class="inline-flex items-center space-x-2 text-sm font-bold px-5 py-2.5 rounded-xl btn-primary text-white">
                  <i class="fas fa-plus"></i><span>Souscrire un contrat</span>
                </a>
              </div>
            ) : (
              <div class="space-y-4">
                {maintenanceContracts.map(mc => {
                  const progress = mc.total_visits > 0 ? Math.round((mc.completed_visits / mc.total_visits) * 100) : 0
                  const planLabels: Record<string, string> = { trimestriel: 'Trimestriel (3 visites/an)', semestriel: 'Semestriel ⭐ (2 visites/an)', annuel: 'Annuel Premium 🔥 (1 visite/an)' }
                  const statusLabels: Record<string, string> = { active: 'Actif', expired: 'Expiré', cancelled: 'Annulé' }
                  const statusColors: Record<string, string> = { active: 'color:#16a34a;background:rgba(22,163,74,0.1);', expired: 'color:#94a3b8;background:rgba(148,163,184,0.1);', cancelled: 'color:#ef4444;background:rgba(239,68,68,0.1);' }
                  // Find visits linked to this contract
                  const contractVisits = maintenanceVisits.filter(v => v.contract_id === mc.id)
                  const todayStr = new Date().toISOString().split('T')[0]
                  const upcomingVisits = contractVisits.filter(v => (v.status === 'planifiee' || v.status === 'confirmee')).sort((a, b) => a.visit_date.localeCompare(b.visit_date))
                  const completedVisits = contractVisits.filter(v => v.status === 'effectuee').sort((a, b) => b.visit_date.localeCompare(a.visit_date))
                  const cancelledVisits = contractVisits.filter(v => v.status === 'annulee')
                  const visitTypeLabels: Record<string, string> = { preventive: 'Préventive', occasionnelle: 'Occasionnelle', urgence: 'Urgence' }
                  return (
                    <div class="rounded-xl overflow-hidden" style="border:1px solid rgba(14,165,233,0.12);">
                      <div class="p-5" style="background:linear-gradient(135deg,rgba(14,165,233,0.04),rgba(0,119,182,0.04));">
                        <div class="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div class="text-sm font-bold" style="color:#03045e;">{planLabels[mc.plan_type] || mc.plan_type}</div>
                            <div class="text-xs mt-0.5" style="color:#64748b;">📅 {formatDate(mc.start_date)} → {formatDate(mc.end_date)} · <strong>12 mois</strong></div>
                            <div class="text-xs font-bold mt-1" style="color:#0077b6;">{mc.plan_price.toLocaleString()} FCFA</div>
                          </div>
                          <span class="text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap" style={statusColors[mc.status] || ''}>{statusLabels[mc.status] || mc.status}</span>
                        </div>
                        {/* Progress bar */}
                        <div class="mb-3">
                          <div class="flex items-center justify-between text-xs mb-1">
                            <span style="color:#64748b;">Visites effectuées</span>
                            <span class="font-bold" style="color:#0077b6;">{mc.completed_visits}/{mc.total_visits}</span>
                          </div>
                          <div class="w-full h-2.5 rounded-full" style="background:rgba(14,165,233,0.1);">
                            <div class="h-2.5 rounded-full transition-all" style={`width:${progress}%; background:linear-gradient(90deg,#0077b6,#00b4d8);`}></div>
                          </div>
                        </div>
                        {/* Facture PDF button */}
                        <a href={`/api/maintenance/invoice/${mc.id}`} target="_blank" rel="noopener" class="inline-flex items-center space-x-2 text-xs font-bold px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5" style="background:linear-gradient(135deg,#03045e,#0077b6); color:#fff; box-shadow:0 4px 12px rgba(0,119,182,0.25);">
                          <i class="fas fa-file-pdf"></i>
                          <span>Facture PDF</span>
                        </a>
                      </div>

                      {/* ===== Visites à venir ===== */}
                      {upcomingVisits.length > 0 && (
                        <div class="px-5 py-4" style="background:rgba(14,165,233,0.03); border-top:1px solid rgba(14,165,233,0.08);">
                          <div class="text-xs font-bold uppercase tracking-wide mb-3 flex items-center space-x-2" style="color:#0077b6;">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Visites à venir ({upcomingVisits.length})</span>
                          </div>
                          <div class="space-y-2">
                            {upcomingVisits.map((v, idx) => {
                              const daysLeft = Math.ceil((new Date(v.visit_date).getTime() - new Date(todayStr).getTime()) / 86400000)
                              const isImminent = daysLeft <= 7
                              const isToday = daysLeft <= 0
                              return (
                                <div class="flex items-center justify-between py-3 px-4 rounded-xl" style={isToday ? 'background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.15);' : isImminent ? 'background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.12);' : 'background:rgba(14,165,233,0.04); border:1px solid rgba(14,165,233,0.1);'}>
                                  <div class="flex items-center space-x-3">
                                    <div class="w-8 h-8 rounded-lg flex items-center justify-center" style={isToday ? 'background:rgba(239,68,68,0.1);' : isImminent ? 'background:rgba(245,158,11,0.1);' : 'background:rgba(14,165,233,0.08);'}>
                                      <span class="text-xs font-black" style={`color:${isToday ? '#ef4444' : isImminent ? '#d97706' : '#0077b6'};`}>#{idx + 1}</span>
                                    </div>
                                    <div>
                                      <div class="text-sm font-semibold" style="color:#03045e;">{visitTypeLabels[v.visit_type] || v.visit_type}</div>
                                      <div class="text-xs" style="color:#64748b;">{formatDate(v.visit_date)}</div>
                                    </div>
                                  </div>
                                  <div class="text-right">
                                    <div class="text-xs font-bold px-2.5 py-1 rounded-full" style={isToday ? 'background:rgba(239,68,68,0.1); color:#ef4444;' : isImminent ? 'background:rgba(245,158,11,0.1); color:#d97706;' : 'background:rgba(14,165,233,0.08); color:#0077b6;'}>
                                      {isToday ? "Aujourd'hui !" : daysLeft === 1 ? 'Demain' : `J-${daysLeft}`}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* ===== Visites effectuées ===== */}
                      {completedVisits.length > 0 && (
                        <div class="px-5 py-4" style="background:rgba(22,163,74,0.02); border-top:1px solid rgba(22,163,74,0.08);">
                          <div class="text-xs font-bold uppercase tracking-wide mb-3 flex items-center space-x-2" style="color:#16a34a;">
                            <i class="fas fa-check-double"></i>
                            <span>Visites effectuées ({completedVisits.length})</span>
                          </div>
                          <div class="space-y-2">
                            {completedVisits.map(v => (
                              <div class="flex items-center justify-between py-2.5 px-4 rounded-xl" style="background:rgba(22,163,74,0.04); border:1px solid rgba(22,163,74,0.1);">
                                <div class="flex items-center space-x-3">
                                  <i class="fas fa-check-circle" style="color:#16a34a; font-size:0.85rem;"></i>
                                  <div>
                                    <div class="text-xs font-semibold" style="color:#03045e;">{visitTypeLabels[v.visit_type] || v.visit_type}</div>
                                    <div class="text-xs" style="color:#64748b;">{formatDate(v.visit_date)}{v.technician ? ` · Tech: ${v.technician}` : ''}</div>
                                    {v.actions_performed && <div class="text-xs mt-0.5" style="color:#94a3b8;">{v.actions_performed}</div>}
                                  </div>
                                </div>
                                <span class="text-xs px-2 py-0.5 rounded-full font-bold" style="color:#16a34a;background:rgba(22,163,74,0.1);">✓ Effectuée</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ===== Visites annulées ===== */}
                      {cancelledVisits.length > 0 && (
                        <div class="px-5 py-3" style="background:rgba(239,68,68,0.02); border-top:1px solid rgba(239,68,68,0.06);">
                          <div class="text-xs font-bold uppercase tracking-wide mb-2 flex items-center space-x-2" style="color:#94a3b8;">
                            <i class="fas fa-ban"></i>
                            <span>Annulées ({cancelledVisits.length})</span>
                          </div>
                          <div class="space-y-1">
                            {cancelledVisits.map(v => (
                              <div class="flex items-center justify-between py-1.5 px-3 rounded-lg" style="background:rgba(239,68,68,0.03);">
                                <span class="text-xs" style="color:#94a3b8;">{formatDate(v.visit_date)} — {visitTypeLabels[v.visit_type] || v.visit_type}</span>
                                <span class="text-xs px-2 py-0.5 rounded-full font-bold" style="color:#ef4444;background:rgba(239,68,68,0.1);">Annulée</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Historique maintenance */}
          {(maintenanceVisits.length > 0 || maintenanceRequests.length > 0) && (
            <div class="glass-card rounded-2xl p-6 reveal">
              <div class="flex items-center justify-between mb-5">
                <h3 class="font-bold flex items-center space-x-2" style="color:#03045e;">
                  <i class="fas fa-history" style="color:#7c3aed;"></i>
                  <span>Historique maintenance</span>
                </h3>
                <span class="text-xs px-2.5 py-1 rounded-full font-bold" style="background:rgba(124,58,237,0.1); color:#7c3aed;">{allMaintenanceItems}</span>
              </div>

              {/* Maintenance visits */}
              {maintenanceVisits.length > 0 && (
                <div class="mb-4">
                  <div class="text-xs font-bold uppercase tracking-wide mb-3" style="color:#64748b;">Visites techniques</div>
                  <div class="space-y-2">
                    {maintenanceVisits.map(v => {
                      const visitTypeLabels: Record<string, string> = { preventive: 'Préventive', occasionnelle: 'Occasionnelle', urgence: 'Urgence' }
                      const visitTypeIcons: Record<string, string> = { preventive: 'fa-check-circle', occasionnelle: 'fa-wrench', urgence: 'fa-exclamation-triangle' }
                      const visitTypeColors: Record<string, string> = { preventive: '#16a34a', occasionnelle: '#0077b6', urgence: '#ef4444' }
                      const visitStatusLabels: Record<string, string> = { planifiee: 'Planifiée', confirmee: 'Confirmée', effectuee: 'Effectuée', annulee: 'Annulée' }
                      return (
                        <div class="p-3 rounded-xl" style="background:rgba(124,58,237,0.03); border:1px solid rgba(124,58,237,0.08);">
                          <div class="flex items-start justify-between gap-2">
                            <div class="flex items-start space-x-2">
                              <i class={`fas ${visitTypeIcons[v.visit_type] || 'fa-wrench'} mt-0.5`} style={`color:${visitTypeColors[v.visit_type] || '#64748b'}; font-size:0.75rem;`}></i>
                              <div>
                                <div class="text-sm font-semibold" style="color:#03045e;">{visitTypeLabels[v.visit_type] || v.visit_type}</div>
                                <div class="text-xs" style="color:#64748b;">{formatDate(v.visit_date)}{v.technician ? ` · Tech: ${v.technician}` : ''}</div>
                                {v.actions_performed && <div class="text-xs mt-1" style="color:#94a3b8;">{v.actions_performed}</div>}
                              </div>
                            </div>
                            <span class="text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap" style={v.status === 'effectuee' ? 'color:#16a34a;background:rgba(22,163,74,0.1);' : v.status === 'annulee' ? 'color:#ef4444;background:rgba(239,68,68,0.1);' : 'color:#d97706;background:rgba(217,119,6,0.1);'}>{visitStatusLabels[v.status] || v.status}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Maintenance requests */}
              {maintenanceRequests.length > 0 && (
                <div>
                  <div class="text-xs font-bold uppercase tracking-wide mb-3" style="color:#64748b;">Mes demandes</div>
                  <div class="space-y-2">
                    {maintenanceRequests.map(r => {
                      const reqTypeLabels: Record<string, string> = { occasionnelle: 'Maintenance ponctuelle', urgence: 'Urgence', contrat: 'Souscription contrat' }
                      const reqStatusLabels: Record<string, string> = { pending: 'En attente', contacted: 'Contacté', scheduled: 'Planifié', done: 'Terminé', cancelled: 'Annulé' }
                      const reqStatusColors: Record<string, string> = { pending: 'color:#d97706;background:rgba(217,119,6,0.1);', contacted: 'color:#0077b6;background:rgba(0,119,182,0.1);', scheduled: 'color:#7c3aed;background:rgba(124,58,237,0.1);', done: 'color:#16a34a;background:rgba(22,163,74,0.1);', cancelled: 'color:#ef4444;background:rgba(239,68,68,0.1);' }
                      return (
                        <div class="p-3 rounded-xl" style="background:rgba(217,119,6,0.03); border:1px solid rgba(217,119,6,0.08);">
                          <div class="flex items-start justify-between gap-2">
                            <div>
                              <div class="text-sm font-semibold" style="color:#03045e;">{reqTypeLabels[r.request_type] || r.request_type}</div>
                              <div class="text-xs" style="color:#64748b;">#{r.id} · {formatDate(r.created_at)}{r.equipment_type ? ` · ${r.equipment_type}` : ''}{r.plan_type ? ` · ${r.plan_type}` : ''}</div>
                              {r.description && <div class="text-xs mt-1" style="color:#94a3b8;">{r.description}</div>}
                            </div>
                            <span class="text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap" style={reqStatusColors[r.status] || ''}>{reqStatusLabels[r.status] || r.status}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mes paiements */}
          <div class="glass-card rounded-2xl p-6 reveal">
            <div class="flex items-center justify-between mb-5">
              <h3 class="font-bold flex items-center space-x-2" style="color:#03045e;">
                <i class="fas fa-credit-card" style="color:#16a34a;"></i>
                <span>Mes paiements</span>
              </h3>
              <span class="text-xs px-2.5 py-1 rounded-full font-bold" style="background:rgba(22,163,74,0.1); color:#16a34a;">{payments.length}</span>
            </div>
            {payments.length === 0 ? (
              <div class="text-center py-8">
                <i class="fas fa-receipt text-4xl mb-3" style="color:#cbd5e1;"></i>
                <p class="text-sm" style="color:#64748b;">Aucun paiement enregistré</p>
              </div>
            ) : (
              <div class="space-y-3">
                {payments.map(p => (
                  <div class="flex items-center justify-between p-4 rounded-xl" style="background:rgba(22,163,74,0.03); border:1px solid rgba(22,163,74,0.1);">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(22,163,74,0.08);">
                        <i class="fas fa-money-bill-wave" style="color:#16a34a; font-size:0.85rem;"></i>
                      </div>
                      <div>
                        <div class="text-sm font-semibold" style="color:#03045e;">
                          {p.payment_type === 'order' ? 'Commande' : p.payment_type === 'maintenance' ? 'Contrat maintenance' : p.payment_type}
                        </div>
                        <div class="text-xs" style="color:#64748b;">
                          {paymentMethodLabel(p.method ?? '')} · {formatDate(p.created_at)}
                          {p.provider_ref && <span> · Réf: {p.provider_ref}</span>}
                        </div>
                      </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                      <div class="text-sm font-bold" style="color:#03045e;">{p.amount.toLocaleString()} FCFA</div>
                      <span class="text-xs px-2.5 py-0.5 rounded-full font-bold" style={paymentStatusColor(p.status)}>{paymentStatusLabel(p.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Journal d'activité (immutable) */}
          <div class="glass-card rounded-2xl p-6 reveal">
            <div class="flex items-center justify-between mb-5">
              <h3 class="font-bold flex items-center space-x-2" style="color:#03045e;">
                <i class="fas fa-stream" style="color:#7c3aed;"></i>
                <span>Journal d'activité</span>
              </h3>
              <span class="text-xs px-2.5 py-1 rounded-full font-bold" style="background:rgba(124,58,237,0.1); color:#7c3aed;">{activityLog.length}</span>
            </div>
            {activityLog.length === 0 ? (
              <div class="text-center py-8">
                <i class="fas fa-list text-4xl mb-3" style="color:#cbd5e1;"></i>
                <p class="text-sm" style="color:#64748b;">Aucune activité enregistrée</p>
              </div>
            ) : (
              <div class="relative">
                {/* Timeline line */}
                <div class="absolute left-4 top-0 bottom-0 w-0.5" style="background:rgba(124,58,237,0.1);"></div>
                <div class="space-y-0">
                  {activityLog.slice(0, 20).map((entry, idx) => (
                    <div class="flex items-start space-x-4 py-3 relative">
                      {/* Timeline dot */}
                      <div class="relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={`background:${activityCategoryColor(entry.category)}15; border:2px solid ${activityCategoryColor(entry.category)}30;`}>
                        <i class={`fas ${activityCategoryIcon(entry.category)}`} style={`color:${activityCategoryColor(entry.category)}; font-size:0.65rem;`}></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium" style="color:#1e293b;">{entry.action}</div>
                        {entry.details && <div class="text-xs mt-0.5" style="color:#94a3b8;">{entry.details}</div>}
                        <div class="text-xs mt-0.5" style="color:#cbd5e1;">{formatDateTime(entry.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {activityLog.length > 20 && (
                  <div class="text-center py-3">
                    <span class="text-xs" style="color:#94a3b8;">+ {activityLog.length - 20} activités antérieures</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile completion script */}
      <script dangerouslySetInnerHTML={{ __html: `
        function saveProfile() {
          var btn = document.getElementById('profile-save-btn');
          var status = document.getElementById('profile-save-status');
          var phoneEl = document.getElementById('profile-phone');
          var quartierEl = document.getElementById('profile-quartier');
          
          var phone = phoneEl ? phoneEl.value.trim().replace(/\\s+/g, '') : '';
          var quartier = quartierEl ? quartierEl.value.trim() : '';
          
          if (!phone && !quartier) {
            status.textContent = 'Veuillez remplir au moins un champ.';
            status.style.color = '#ef4444';
            status.classList.remove('hidden');
            return;
          }
          
          if (phone && !/^\\d{8}$/.test(phone.replace(/^\\+?226/, ''))) {
            status.textContent = 'Numéro invalide (8 chiffres requis, ex: 70000000)';
            status.style.color = '#ef4444';
            status.classList.remove('hidden');
            return;
          }
          
          btn.disabled = true;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Enregistrement...</span>';
          status.classList.add('hidden');
          
          fetch('/api/client/update-profile', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone, quartier: quartier })
          })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.success) {
              status.textContent = '\\u2705 Profil mis à jour ! La page va se recharger...';
              status.style.color = '#16a34a';
              status.classList.remove('hidden');
              setTimeout(function() { window.location.reload(); }, 1200);
            } else {
              status.textContent = data.error || 'Erreur lors de la mise à jour.';
              status.style.color = '#ef4444';
              status.classList.remove('hidden');
              btn.disabled = false;
              btn.innerHTML = '<i class="fas fa-save"></i><span>Enregistrer</span>';
            }
          })
          .catch(function() {
            status.textContent = 'Erreur réseau. Réessayez.';
            status.style.color = '#ef4444';
            status.classList.remove('hidden');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i><span>Enregistrer</span>';
          });
        }

        // ─── Order action functions ───
        function confirmDelivery(orderId) {
          if (!confirm('Confirmez-vous la réception de votre commande #' + orderId + ' ?')) return;
          fetch('/api/order/confirm-delivery', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId })
          }).then(function(r) { return r.json(); }).then(function(d) {
            if (d.success) { alert('Livraison confirmée !'); window.location.reload(); }
            else alert(d.error || 'Erreur');
          }).catch(function() { alert('Erreur réseau'); });
        }

        function viewDevis(orderId) {
          fetch('/api/order/' + orderId + '/devis', { credentials: 'same-origin' })
            .then(function(r) { return r.json(); })
            .then(function(d) {
              if (!d.devis || d.devis.length === 0) { alert('Aucun devis disponible.'); return; }
              var dv = d.devis[0];
              var items = [];
              try { items = JSON.parse(dv.items || '[]'); } catch(e) {}
              var itemsHtml = items.length > 0 ? items.map(function(it) {
                return '<tr><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">' + (it.name||it.label||'-') + '</td><td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:right;">' + (it.amount||it.price||0).toLocaleString() + ' FCFA</td></tr>';
              }).join('') : '<tr><td colspan="2" style="padding:6px 10px;color:#94a3b8;">Détail non disponible</td></tr>';

              var modal = document.createElement('div');
              modal.id = 'devis-modal';
              modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;';
              modal.innerHTML = '<div style="background:white;border-radius:16px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;padding:24px;">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
                + '<h3 style="font-size:16px;font-weight:700;color:#03045e;">Devis #' + dv.id + '</h3>'
                + '<button onclick="document.getElementById(\'devis-modal\').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#94a3b8;">&times;</button></div>'
                + '<p style="font-size:14px;font-weight:600;color:#334155;margin-bottom:4px;">' + (dv.title||'Devis') + '</p>'
                + (dv.description ? '<p style="font-size:12px;color:#64748b;margin-bottom:12px;">' + dv.description + '</p>' : '')
                + '<table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:12px;"><thead><tr style="background:#f0f7ff;"><th style="padding:6px 10px;text-align:left;">Élément</th><th style="padding:6px 10px;text-align:right;">Montant</th></tr></thead><tbody>' + itemsHtml + '</tbody></table>'
                + '<div style="text-align:right;font-size:18px;font-weight:800;color:#0077b6;margin-bottom:16px;">' + dv.total_amount.toLocaleString() + ' FCFA</div>'
                + (dv.status === 'sent' || dv.status === 'pending' ? '<div style="display:flex;gap:8px;">'
                  + '<button onclick="validateDevis(' + dv.id + ')" style="flex:1;padding:10px;border-radius:10px;border:none;background:linear-gradient(135deg,#059669,#10b981);color:white;font-weight:700;font-size:13px;cursor:pointer;"><i class="fas fa-check" style="margin-right:4px;"></i>Valider</button>'
                  + '<button onclick="refuseDevis(' + dv.id + ')" style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.06);color:#ef4444;font-weight:700;font-size:13px;cursor:pointer;"><i class="fas fa-times" style="margin-right:4px;"></i>Refuser</button>'
                  + '</div>' : '<div style="text-align:center;padding:8px;border-radius:8px;font-size:12px;font-weight:700;' + (dv.status === 'validated' ? 'background:rgba(16,185,129,0.08);color:#059669;">Devis validé ✓' : dv.status === 'refused' ? 'background:rgba(239,68,68,0.08);color:#ef4444;">Devis refusé' : 'color:#64748b;">Statut: ' + dv.status) + '</div>')
                + '</div>';
              document.body.appendChild(modal);
              modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
            }).catch(function() { alert('Erreur réseau'); });
        }

        function validateDevis(devisId) {
          if (!confirm('Valider ce devis ? L\\'installation pourra commencer.')) return;
          fetch('/api/order/devis/validate', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ devis_id: devisId })
          }).then(function(r) { return r.json(); }).then(function(d) {
            if (d.success) { alert('Devis validé !'); window.location.reload(); }
            else alert(d.error || 'Erreur');
          }).catch(function() { alert('Erreur réseau'); });
        }

        function refuseDevis(devisId) {
          var reason = prompt('Motif du refus (optionnel) :');
          if (reason === null) return;
          fetch('/api/order/devis/refuse', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ devis_id: devisId, reason: reason })
          }).then(function(r) { return r.json(); }).then(function(d) {
            if (d.success) { alert('Devis refusé.'); window.location.reload(); }
            else alert(d.error || 'Erreur');
          }).catch(function() { alert('Erreur réseau'); });
        }

        function cancelInstallation(orderId) {
          if (!confirm('Annuler l\\'installation pour la commande #' + orderId + ' ? Vous garderez le produit.')) return;
          fetch('/api/order/cancel-installation', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId })
          }).then(function(r) { return r.json(); }).then(function(d) {
            if (d.success) { alert('Installation annulée.'); window.location.reload(); }
            else alert(d.error || 'Erreur');
          }).catch(function() { alert('Erreur réseau'); });
        }

        function cancelOrder(orderId) {
          var reason = prompt('Êtes-vous sûr de vouloir annuler la commande #' + orderId + ' et demander un remboursement ?\\nMotif (optionnel) :');
          if (reason === null) return;
          fetch('/api/order/cancel-order', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, reason: reason })
          }).then(function(r) { return r.json(); }).then(function(d) {
            if (d.success) { alert(d.message || 'Commande annulée.'); window.location.reload(); }
            else alert(d.error || 'Erreur');
          }).catch(function() { alert('Erreur réseau'); });
        }

        // ─── Payment success banner ───
        if (window.location.search.includes('payment=success')) {
          var banner = document.createElement('div');
          banner.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;background:linear-gradient(135deg,#059669,#10b981);color:white;padding:14px 28px;border-radius:16px;font-weight:700;font-size:14px;box-shadow:0 8px 30px rgba(5,150,105,0.3);display:flex;align-items:center;gap:10px;';
          banner.innerHTML = '<i class="fas fa-check-circle" style="font-size:18px;"></i> Paiement confirmé ! Votre commande est en cours de traitement.';
          document.body.appendChild(banner);
          setTimeout(function() { banner.style.transition='opacity 0.5s'; banner.style.opacity='0'; setTimeout(function(){banner.remove();},500); }, 5000);
          history.replaceState({}, '', '/espace-client');
        }
      `}} />
    </Layout>
  )
}
