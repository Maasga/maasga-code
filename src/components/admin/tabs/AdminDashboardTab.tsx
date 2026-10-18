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

export const AdminPage = () => {
  const totalProducts = products.length
  const availableProducts = products.filter(p => p.available && p.stock > 0).length
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 3).length
  const outOfStock = products.filter(p => p.stock === 0).length
  const pendingRdv = appointments.filter(a => a.status === 'pending').length
  const confirmedRdv = appointments.filter(a => a.status === 'confirmed').length
  const doneRdv = appointments.filter(a => a.status === 'done').length
  const approvedReviews = reviews.filter(r => r.approved).length
  const pendingReviews = reviews.filter(r => !r.approved).length
  const avgNote = approvedReviews > 0
    ? (reviews.filter(r => r.approved).reduce((s, r) => s + r.note, 0) / approvedReviews).toFixed(1)
    : '-'
  // CA réel basé sur les commandes (paid + validated + installed)
  const estimatedCA = orders
    .filter(o => ['confirme', 'en_livraison', 'livre'].includes(o.status))
    .reduce((s, o) => s + (o.total_price || 0), 0)

  // Stats cette semaine
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
  const rdvThisWeek = appointments.filter(a => a.created_at >= weekAgo).length
  const ordersThisWeek = orders.filter(o => o.created_at >= weekAgo).length

  // Chart: RDV par jour sur 7 derniers jours
  const rdvChartData = Array.from({length: 7}, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 86400000)
    const ds = d.toISOString().split('T')[0]
    return { day: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }), count: appointments.filter(a => a.date === ds).length }
  })

  return (
    <AdminLayout activePage="dashboard">
      {/* ALERTE RDV NOUVEAUX */}
      {pendingRdv > 0 && (
        <div class="mb-6 rounded-2xl p-5 border-2 animate-pulse fade-in-up" style="background:rgba(220,38,38,0.08); border-color:rgba(220,38,38,0.3);">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <i class="fas fa-bell text-white text-lg animate-bounce"></i>
              </div>
              <div>
                <h3 class="font-bold text-red-400 text-lg">Nouveaux rendez-vous en attente</h3>
                <p class="text-sm text-red-300/80 mt-0.5">{pendingRdv} rendez-vous à confirmer</p>
              </div>
            </div>
            <a href="/admin/rdv?status=pending" class="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-colors flex items-center space-x-2">
              <i class="fas fa-arrow-right"></i>
              <span>Voir les RDV</span>
            </a>
          </div>
          
          {/* Liste des RDV en attente */}
          <div class="mt-4 pt-4 space-y-2" style="border-top:1px solid rgba(220,38,38,0.2);">
            {appointments.filter(a => a.status === 'pending').slice(0, 3).map(a => (
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl p-3" style="background:rgba(220,38,38,0.05); border:1px solid rgba(220,38,38,0.15);">
                <div>
                  <span class="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mr-2" style="background:rgba(220,38,38,0.1); color:#dc2626;">NOUVEAU</span>
                  <span class="font-semibold" style="color:var(--admin-text-primary)">{a.name}</span>
                  <span class="text-xs ml-2" style="color:var(--admin-text-muted)">
                    ?? {a.quartier} · ?? {a.date} · {{ devis: 'Devis', installation: 'Installation', entretien: 'Entretien', depannage: 'Dépannage' }[a.type] || a.type}
                  </span>
                </div>
                <span class="text-xs" style="color:var(--admin-text-muted)">{a.phone}</span>
              </div>
            ))}
            {pendingRdv > 3 && (
              <a href="/admin/rdv?status=pending" class="block text-center text-xs text-red-600 font-semibold mt-2 hover:text-red-700">
                +{pendingRdv - 3} autres rendez-vous en attente
              </a>
            )}
          </div>
        </div>
      )}

      {/* ALERTE MAINTENANCE NOUVELLE */}
      {(pendingMaintenanceContractsCount + pendingMaintenanceRequestsCount) > 0 && (
        <div class="mb-6 rounded-2xl p-5 border-2 animate-pulse fade-in-up" style="background:rgba(14,165,233,0.08); border-color:rgba(14,165,233,0.35);">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 rounded-full flex items-center justify-center text-white" style="background:#0284c7;">
                <i class="fas fa-tools text-lg"></i>
              </div>
              <div>
                <h3 class="font-bold text-lg" style="color:var(--admin-text-primary);">Nouvelles souscriptions & demandes de maintenance</h3>
                <p class="text-sm mt-0.5" style="color:#0284c7;">
                  {pendingMaintenanceContractsCount} contrat(s) en attente d'activation · {pendingMaintenanceRequestsCount} demande(s) à traiter
                </p>
              </div>
            </div>
            <a href="/admin/maintenance" class="text-white font-semibold px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-colors flex items-center space-x-2" style="background:#0284c7;">
              <i class="fas fa-arrow-right"></i>
              <span>Gérer la maintenance</span>
            </a>
          </div>

          {/* Liste des contrats en attente */}
          {pendingMaintenanceContracts.length > 0 && (
            <div class="mt-4 pt-4 space-y-2" style="border-top:1px solid rgba(14,165,233,0.2);">
              {pendingMaintenanceContracts.slice(0, 3).map((c: any) => (
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl p-3" style="background:rgba(14,165,233,0.05); border:1px solid rgba(14,165,233,0.15);">
                  <div>
                    <span class="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mr-2" style="background:rgba(14,165,233,0.15); color:#0284c7;">NOUVEAU CONTRAT</span>
                    <span class="font-semibold" style="color:var(--admin-text-primary)">{c.client_name}</span>
                    <span class="text-xs ml-2" style="color:var(--admin-text-muted)">
                      Formule: {c.plan_type} · {(c.plan_price || 0).toLocaleString()} F CFA · {c.total_visits || 2} visites/an
                    </span>
                  </div>
                  <div class="flex items-center space-x-3">
                    <span class="text-xs" style="color:var(--admin-text-muted)">{c.client_phone}</span>
                    <a href="/admin/maintenance" class="text-xs font-bold px-3 py-1 rounded-lg text-white" style="background:#0284c7;">Activer</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 fade-in-up">
        {[
          { icon: "fa-calendar-check", color: "from-blue-500 to-blue-600", label: "RDV en attente", val: String(pendingRdv), sub: `${appointments.length} total · ${doneRdv} effectués`, href: "/admin/rdv" },
          { icon: "fa-tools", color: "from-sky-500 to-blue-600", label: "Maintenance", val: String(pendingMaintenanceContractsCount + pendingMaintenanceRequestsCount), sub: `${pendingMaintenanceContractsCount} contrat(s) · ${pendingMaintenanceRequestsCount} req`, href: "/admin/maintenance" },
          { icon: "fa-boxes", color: "from-orange-500 to-red-500", label: "Alertes stock", val: String(lowStock + outOfStock), sub: `${outOfStock} rupture(s) · ${lowStock} limité(s)`, href: "/admin/produits" },
          { icon: "fa-star", color: "from-yellow-400 to-amber-500", label: "Avis en attente", val: String(pendingReviews), sub: `${approvedReviews} publiés · ${avgNote}/5`, href: "/admin/avis" },
          { icon: "fa-chart-line", color: "from-green-500 to-emerald-600", label: "Chiffre d'affaires", val: `${Math.round(estimatedCA / 1000)}K`, sub: "FCFA · commandes validées", href: "/admin/commandes" }
        ].map(k => (
          <a href={k.href} class="stat-card hover-lift block">
            <div class={`w-10 h-10 bg-gradient-to-br ${k.color} rounded-xl flex items-center justify-center mb-3`}>
              <i class={`fas ${k.icon} text-white text-sm`}></i>
            </div>
            <div class="text-2xl font-bold mb-0.5" style="color:var(--admin-text-primary)">{k.val}</div>
            <div class="text-sm font-medium" style="color:var(--admin-text-muted)">{k.label}</div>
            <div class="text-xs mt-1" style="color:var(--admin-text-muted)">{k.sub}</div>
          </a>
        ))}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 fade-in-up delay-1">
        {/* Stats cette semaine */}
        <div class="rounded-2xl p-6 card-shadow" style="background: var(--admin-card-bg); border: 1px solid var(--admin-border);">
          <h3 class="font-bold mb-4 flex items-center space-x-2" style="color: var(--admin-text-primary)">
            <i class="fas fa-calendar-week text-cyan-400"></i>
            <span>Cette semaine</span>
          </h3>
          <div class="grid grid-cols-2 gap-4 mb-4">
            {[
              { label: "Nouveaux RDV", val: rdvThisWeek, icon: "fa-calendar-plus", color: "#38bdf8" },
              { label: "Commandes", val: ordersThisWeek, icon: "fa-shopping-cart", color: "#a78bfa" },
              { label: "En attente", val: pendingRdv, icon: "fa-hourglass-half", color: "#fbbf24" },
              { label: "Effectués", val: doneRdv, icon: "fa-flag-checkered", color: "#34d399" },
            ].map(s => (
              <div class="rounded-xl p-3 flex items-center space-x-3" style="background: var(--admin-card-bg); border: 1px solid var(--admin-border);">
                <i class={`fas ${s.icon} text-lg`} style={`color:${s.color};`}></i>
                <div>
                  <div class="text-xl font-bold leading-none" style="color: var(--admin-text-primary);">{s.val}</div>
                  <div class="text-xs mt-0.5" style="color: var(--admin-text-muted);">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Mini bar chart - derniers 7 jours RDV */}
          <div>
            <div class="text-xs mb-2" style="color:var(--admin-text-muted)">RDV par jour (7 derniers jours)</div>
            <canvas id="rdv-chart" height="60"></canvas>
            <script dangerouslySetInnerHTML={{ __html: `
              (function() {
                const data = ${JSON.stringify(rdvChartData)};
                const canvas = document.getElementById('rdv-chart');
                if (canvas && typeof Chart !== 'undefined') {
                  new Chart(canvas, {
                    type: 'bar',
                    data: {
                      labels: data.map(d => d.day),
                      datasets: [{ label: 'RDV', data: data.map(d => d.count), backgroundColor: 'rgba(56,189,248,0.45)', borderColor: '#38bdf8', borderWidth: 1, borderRadius: 4 }]
                    },
                    options: {
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { ticks: { color: '#64748b', font: { size: 9 } }, grid: { display: false } },
                        y: { ticks: { color: '#64748b', stepSize: 1, font: { size: 9 } }, grid: { color: 'rgba(148,180,220,0.06)' }, beginAtZero: true }
                      }
                    }
                  });
                }
              })();
            ` }} />
          </div>
        </div>

        {/* Actions rapides */}
        <div class="rounded-2xl p-6 card-shadow" style="background: var(--admin-card-bg); border: 1px solid var(--admin-border);">
          <h3 class="font-bold mb-4 flex items-center space-x-2" style="color: var(--admin-text-primary)">
            <i class="fas fa-bolt text-yellow-400"></i>
            <span>Actions rapides</span>
          </h3>
          <div class="grid grid-cols-2 gap-3">
            {[
              { href: "/admin/rdv", icon: "fa-calendar-plus", label: "Nouveau RDV", desc: "Ajouter manuellement", color: "from-blue-600 to-blue-700" },
              { href: "/admin/clients", icon: "fa-user-plus", label: "Nouveau client", desc: "Enregistrer un client", color: "from-green-600 to-emerald-700" },
              { href: "/admin/produits", icon: "fa-plus-circle", label: "Ajouter produit", desc: "Catalogue & stock", color: "from-purple-600 to-violet-700" },
              { href: "/admin/avis", icon: "fa-star", label: "Modérer avis", desc: `${pendingReviews} en attente`, color: pendingReviews > 0 ? "from-orange-500 to-red-600" : "from-gray-600 to-gray-700" },
            ].map(a => (
              <a href={a.href} class={`rounded-xl p-4 bg-gradient-to-br ${a.color} hover:opacity-90 transition-all hover-lift flex flex-col`}>
                <i class={`fas ${a.icon} text-white text-xl mb-2`}></i>
                <div class="font-semibold text-white text-sm">{a.label}</div>
                <div class="text-xs text-white/70 mt-0.5">{a.desc}</div>
              </a>
            ))}
          </div>
          <div class="mt-4 pt-4 space-y-2" style="border-top:1px solid rgba(56,189,248,0.08);">
            <a href="/admin/parametres" class="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(56,189,248,0.1);"><i class="fas fa-cog text-cyan-400 text-sm"></i></div>
              <div><div class="text-sm font-medium" style="color:var(--admin-text-primary)">Paramètres du site</div><div class="text-xs" style="color:var(--admin-text-muted)">Mot de passe, configuration</div></div>
              <i class="fas fa-chevron-right text-xs text-gray-600 ml-auto"></i>
            </a>
            <form method="post" action="/api/admin/logout">
              <button type="submit" class="w-full text-left flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-red-900/10 transition-colors">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(239,68,68,0.1);"><i class="fas fa-sign-out-alt text-red-400 text-sm"></i></div>
                <div><div class="text-sm font-medium text-red-400">Déconnexion</div><div class="text-xs" style="color:var(--admin-text-muted)">Fermer la session admin</div></div>
              </button>
            </form>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 fade-in-up delay-1">
        {/* Alertes stock */}
        <div class="rounded-2xl  p-6 card-shadow" style="background: var(--admin-card-bg); border: 1px solid var(--admin-border);">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-bold flex items-center space-x-2" style="color: var(--admin-text-primary)">
              <i class="fas fa-exclamation-triangle text-orange-500"></i>
              <span>Alertes stock</span>
            </h3>
            <a href="/admin/produits" class="text-xs text-primary-600 font-medium">Gérer</a>
          </div>
          {products.filter(p => p.stock <= 3).length === 0 ? (
            <div class="text-center py-6" style="color:var(--admin-text-muted)">
              <i class="fas fa-check-circle text-green-400 text-2xl mb-2"></i>
              <p class="text-sm">Tous les stocks sont OK</p>
            </div>
          ) : (
            <div class="space-y-3">
              {products.filter(p => p.stock <= 3).map(p => (
                <div class="flex items-center justify-between p-3 rounded-xl" style={`background:${p.stock === 0 ? 'rgba(239,68,68,0.08)' : 'rgba(249,115,22,0.08)'}; border:1px solid ${p.stock === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.2)'};`}>
                  <div class="flex items-center space-x-3">
                    <div class="text-2xl">{p.image}</div>
                    <div>
                      <div class="text-sm font-semibold leading-tight" style="color:var(--admin-text-primary)">{p.name}</div>
                      <div class="text-xs text-gray-400">{p.brand} · {p.btu ? p.btu.toLocaleString() : '-'} BTU</div>
                    </div>
                  </div>
                  <span class={`text-xs font-bold px-3 py-1.5 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {p.stock === 0 ? 'RUPTURE' : `Stock: ${p.stock}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RDV récents */}
        <div class="rounded-2xl  p-6 card-shadow" style="background: var(--admin-card-bg); border: 1px solid var(--admin-border);">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-bold flex items-center space-x-2" style="color: var(--admin-text-primary)">
              <i class="fas fa-calendar-alt text-primary-500"></i>
              <span>Rendez-vous récents</span>
            </h3>
            <a href="/admin/rdv" class="text-xs text-primary-600 font-medium">Voir tout</a>
          </div>
          {appointments.length === 0 ? (
            <p class="text-sm text-center py-4" style="color:var(--admin-text-muted)">Aucun rendez-vous</p>
          ) : (
            <div class="space-y-3">
              {appointments.slice(-4).reverse().map(a => (
                <div class="flex items-center justify-between p-3 rounded-xl" style="background: var(--admin-card-bg); border: 1px solid var(--admin-border);">
                  <div>
                    <div class="text-sm font-semibold" style="color: var(--admin-text-primary);">{a.name}</div>
                    <div class="text-xs" style="color: var(--admin-text-muted);">{a.date} · {a.quartier} · {{ devis: 'Devis', installation: 'Installation', entretien: 'Entretien', depannage: 'Dépannage' }[a.type] || a.type}</div>
                  </div>
                  <span class={`text-xs font-semibold px-2.5 py-1 rounded-full ${a.status === 'pending' ? 'badge-pending' : a.status === 'confirmed' ? 'badge-confirmed' : 'badge-done'}`}>
                    {a.status === 'pending' ? 'En attente' : a.status === 'confirmed' ? 'Confirmé' : 'Effectué'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* TABLEAU DE BORD FINANCIER                    */}
      {/* ============================================ */}
      {(() => {
        // Calculate monthly revenue data
        const now2 = new Date()
        const monthlyData: { month: string; label: string; revenue: number; count: number }[] = []
        for (let m = 5; m >= 0; m--) {
          const d = new Date(now2.getFullYear(), now2.getMonth() - m, 1)
          const yearMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
          const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
          const monthOrders = orders.filter(o => {
            if (!o.created_at) return false
            return String(o.created_at || '').startsWith(yearMonth) && ['confirme', 'en_livraison', 'livre'].includes(o.status)
          })
          monthlyData.push({ month: yearMonth, label, revenue: monthOrders.reduce((s, o) => s + (o.total_price || 0), 0), count: monthOrders.length })
        }
        const currentMonth = monthlyData[monthlyData.length - 1]
        const prevMonth = monthlyData[monthlyData.length - 2]
        const growth = prevMonth && prevMonth.revenue > 0 ? Math.round(((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100) : 0
        const avgMonthly = monthlyData.reduce((s, m) => s + m.revenue, 0) / Math.max(1, monthlyData.filter(m => m.revenue > 0).length)

        // Top products by revenue
        const productRevenue: Record<number, { name: string; revenue: number; count: number }> = {}
        orders.filter(o => ['confirme', 'en_livraison', 'livre'].includes(o.status)).forEach(o => {
          if (o.product_id) {
            if (!productRevenue[o.product_id]) {
              const p = products.find(p => p.id === o.product_id)
              productRevenue[o.product_id] = { name: p?.name || `Produit #${o.product_id}`, revenue: 0, count: 0 }
            }
            productRevenue[o.product_id].revenue += (o.total_price || 0)
            productRevenue[o.product_id].count++
          }
        })
        const topProducts = Object.values(productRevenue).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
        const maxRev = topProducts[0]?.revenue || 1

        return (
      <div class="rounded-2xl card-shadow overflow-hidden mb-6 fade-in-up delay-2" style="background: var(--admin-card-bg); border: 1px solid var(--admin-border);">
        <div class="p-5 flex items-center justify-between" style="border-bottom: 1px solid var(--admin-border);">
          <h3 class="font-bold flex items-center space-x-2" style="color: var(--admin-text-primary)">
            <i class="fas fa-chart-line text-green-400"></i>
            <span>Tableau de bord financier</span>
          </h3>
          <a href="/admin/commandes" class="text-xs text-green-400 font-medium">Voir commandes</a>
        </div>
        <div class="p-5">
          {/* KPIs financiers */}
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="rounded-xl p-4" style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2);">
              <div class="text-xs font-semibold mb-1" style="color:var(--admin-text-muted)">CA ce mois</div>
              <div class="text-xl font-bold text-green-400">{(currentMonth?.revenue || 0).toLocaleString()} F</div>
              <div class="text-xs mt-1" style={growth >= 0 ? 'color:#34d399;' : 'color:#f87171;'}>
                <i class={`fas fa-arrow-${growth >= 0 ? 'up' : 'down'} mr-1`}></i>{growth > 0 ? '+' : ''}{growth}% vs mois precedent
              </div>
            </div>
            <div class="rounded-xl p-4" style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2);">
              <div class="text-xs font-semibold mb-1" style="color:var(--admin-text-muted)">CA mois precedent</div>
              <div class="text-xl font-bold text-blue-400">{(prevMonth?.revenue || 0).toLocaleString()} F</div>
              <div class="text-xs mt-1" style="color:var(--admin-text-muted)">{prevMonth.count} commandes</div>
            </div>
            <div class="rounded-xl p-4" style="background:rgba(168,85,247,0.08); border:1px solid rgba(168,85,247,0.2);">
              <div class="text-xs font-semibold mb-1" style="color:var(--admin-text-muted)">CA total (6 mois)</div>
              <div class="text-xl font-bold text-purple-400">{estimatedCA.toLocaleString()} F</div>
              <div class="text-xs mt-1" style="color:var(--admin-text-muted)">{orders.filter(o => ['confirme','en_livraison','livre'].includes(o.status)).length} commandes</div>
            </div>
            <div class="rounded-xl p-4" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2);">
              <div class="text-xs font-semibold mb-1" style="color:var(--admin-text-muted)">Moyenne mensuelle</div>
              <div class="text-xl font-bold text-yellow-400">{Math.round(avgMonthly || 0).toLocaleString()} F</div>
              <div class="text-xs mt-1" style="color:var(--admin-text-muted)">sur les mois actifs</div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique CA mensuel */}
            <div>
              <div class="text-sm font-semibold mb-3" style="color:var(--admin-text-primary)"><i class="fas fa-chart-bar text-green-400 mr-2"></i>Evolution CA mensuel</div>
              <canvas id="ca-chart" height="140"></canvas>
              <script dangerouslySetInnerHTML={{ __html: `
                (function() {
                  var data = ${JSON.stringify(monthlyData)};
                  var canvas = document.getElementById('ca-chart');
                  if (canvas && typeof Chart !== 'undefined') {
                    new Chart(canvas, {
                      type: 'bar',
                      data: {
                        labels: data.map(function(d) { return d.label; }),
                        datasets: [{
                          label: 'CA (FCFA)',
                          data: data.map(function(d) { return d.revenue; }),
                          backgroundColor: 'rgba(16,185,129,0.4)',
                          borderColor: '#10b981',
                          borderWidth: 1,
                          borderRadius: 6
                        }]
                      },
                      options: {
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                          tooltip: { callbacks: { label: function(ctx) { return ctx.parsed.y.toLocaleString() + ' FCFA'; } } }
                        },
                        scales: {
                          x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } },
                          y: { ticks: { color: '#64748b', font: { size: 10 }, callback: function(v) { return (v/1000) + 'K'; } }, grid: { color: 'rgba(148,180,220,0.06)' }, beginAtZero: true }
                        }
                      }
                    });
                  }
                })();
              ` }} />
            </div>
            {/* Top produits */}
            <div>
              <div class="text-sm font-semibold mb-3" style="color:var(--admin-text-primary)"><i class="fas fa-trophy text-yellow-400 mr-2"></i>Top produits par revenus</div>
              {topProducts.length === 0 ? (
                <p class="text-xs py-4" style="color:var(--admin-text-muted)">Aucune commande validee</p>
              ) : (
                <div class="space-y-3">
                  {topProducts.map((tp, i) => (
                    <div class="flex items-center gap-3">
                      <span class="text-xs font-bold w-5" style="color:var(--admin-text-muted)">#{i + 1}</span>
                      <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-medium text-gray-300 truncate max-w-[180px]">{tp.name}</span>
                          <span class="text-xs font-bold text-green-400">{tp.revenue.toLocaleString()} F</span>
                        </div>
                        <div class="w-full h-2 rounded-full" style="background:rgba(16,185,129,0.1);">
                          <div class="h-2 rounded-full" style={`width:${Math.round((tp.revenue / maxRev) * 100)}%; background:linear-gradient(90deg,#10b981,#34d399);`}></div>
                        </div>
                        <div class="text-[10px] mt-0.5" style="color:var(--admin-text-muted)">{tp.count} vente(s)</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
        )
      })()}

      {/* Tableau produits */}
      <div class="rounded-2xl  p-6 card-shadow" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-bold flex items-center space-x-2" style="color:var(--admin-text-primary)">
            <i class="fas fa-trophy text-yellow-500"></i>
            <span>État du catalogue</span>
          </h3>
          <a href="/admin/produits" class="text-xs text-primary-600 font-medium">Gérer les produits</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-800">
                {["Produit", "Marque", "BTU", "Prix", "Stock", "Statut"].map(h => (
                  <th class="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider" style="color:var(--admin-text-muted)">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody data-paginate="10">
              {products.map(p => (
                <tr class="border-b border-gray-800 hover:bg-cyan-900/10 transition-colors">
                  <td class="py-3 px-3">
                    <div class="flex items-center space-x-2">
                      <span class="text-xl">{p.image}</span>
                      <span class="font-medium text-xs leading-tight max-w-32" style="color:var(--admin-text-primary)">{p.name}</span>
                    </div>
                  </td>
                  <td class="py-3 px-3 text-xs font-medium" style="color:var(--admin-text-muted)">{p.brand}</td>
                  <td class="py-3 px-3 text-xs" style="color:var(--admin-text-muted)">{p.btu ? p.btu.toLocaleString() : '-'}</td>
                  <td class="py-3 px-3 text-xs font-semibold" style="color:var(--admin-text-primary)">{(p.price || 0).toLocaleString()} F</td>
                  <td class="py-3 px-3">
                    <span class={`text-xs font-bold ${p.stock === 0 ? 'text-red-600' : p.stock <= 3 ? 'text-orange-500' : 'text-green-600'}`}>{p.stock}</span>
                  </td>
                  <td class="py-3 px-3">
                    <span class={`text-xs px-2 py-1 rounded-full font-semibold`} style={p.stock > 3 ? 'background:rgba(16,185,129,0.15); color:#34d399;' : p.stock > 0 ? 'background:rgba(249,115,22,0.15); color:#fb923c;' : 'background:rgba(239,68,68,0.15); color:#f87171;'}>
                      {p.stock > 3 ? 'En stock' : p.stock > 0 ? 'Limité' : 'Rupture'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}

// ============================================================
// PAGE PRODUITS
// ============================================================
