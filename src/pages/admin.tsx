import { products } from '../data/products'
import { reviews, appointments, orders, clients } from '../data/store'

// ============================================================
// LAYOUT ADMIN
// ============================================================

const AdminLayout = ({ children, activePage = "" }: { children: any; activePage?: string }) => (
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Admin MAASGA - Back-office</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
      <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .admin-sidebar { background: linear-gradient(180deg, #0f1a2e 0%, #1a3478 100%); }
        .nav-item { transition: all 0.2s; padding: 0.625rem 0.75rem; border-radius: 0.75rem; display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; font-weight: 500; color: #93c5fd; }
        .nav-item:hover { background: rgba(255,255,255,0.12); color: white; }
        .nav-item.active { background: rgba(255,255,255,0.2); color: white; font-weight: 600; }
        .card-shadow { box-shadow: 0 2px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(56,189,248,0.06); }
        .input-field { border: 1.5px solid rgba(56,189,248,0.18); transition: all 0.2s; background: rgba(15,23,42,0.7); color: #e0f0ff; border-radius: 0.75rem; padding: 0.625rem 1rem; width: 100%; }
        .input-field:focus { outline: none; border-color: #38bdf8; background: rgba(15,23,42,0.9); box-shadow: 0 0 0 3px rgba(56,189,248,0.15); }
        .input-field::placeholder { color: #64748b; }
        .badge-pending { background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); }
        .badge-confirmed { background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid rgba(52,211,153,0.3); }
        .badge-done { background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); }
        .badge-cancelled { background: rgba(248,113,113,0.15); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
        .btn-primary { background: linear-gradient(135deg, #2563eb, #0284c7); color: white; transition: all 0.2s; }
        .btn-primary:hover { opacity: 0.92; transform: translateY(-1px); }
        .stat-card { background: #111827; border-radius: 1rem; padding: 1.25rem; border: 1px solid rgba(56,189,248,0.1); box-shadow: 0 2px 20px rgba(0,0,0,0.3); transition: transform 0.2s, box-shadow 0.2s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.4); }
        @media (max-width: 768px) { .admin-sidebar { transform: translateX(-100%); position: fixed; transition: transform 0.3s; z-index: 50; } .admin-sidebar.open { transform: translateX(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .fade-in-up { animation: fadeInUp 0.5s ease-out both; }
        .fade-in { animation: fadeIn 0.4s ease-out both; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
        .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.4); }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0b1120; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #2a4a6f; }
        .admin-table tr { transition: background 0.15s; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
      `}} />
    </head>
    <body class="min-h-screen flex" style="background:#0b1120;">

      {/* Overlay mobile */}
      <div id="sidebar-overlay" class="fixed inset-0 bg-black/50 z-40 hidden md:hidden" onclick="toggleSidebar()"></div>

      {/* Sidebar */}
      <aside id="admin-sidebar" class="admin-sidebar w-64 fixed left-0 top-0 bottom-0 text-white flex flex-col z-50">
        <div class="p-5 border-b border-white/10">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <i class="fas fa-snowflake text-white text-lg"></i>
            </div>
            <div>
              <div class="font-bold text-white text-base">MAASGA</div>
              <div class="text-xs text-blue-300">Back-office Admin</div>
            </div>
          </div>
        </div>

        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { href: "/admin", icon: "fa-tachometer-alt", label: "Dashboard", key: "dashboard" },
            { href: "/admin/produits", icon: "fa-boxes", label: "Produits & Stock", key: "produits" },
            { href: "/admin/rdv", icon: "fa-calendar-alt", label: "Rendez-vous", key: "rdv" },
            { href: "/admin/devis", icon: "fa-file-invoice-dollar", label: "Devis", key: "devis" },
            { href: "/admin/commandes", icon: "fa-shopping-cart", label: "Commandes", key: "commandes" },
            { href: "/admin/clients", icon: "fa-users", label: "Clients", key: "clients" },
            { href: "/admin/avis", icon: "fa-star", label: "Avis clients", key: "avis" },
            { href: "/admin/parametres", icon: "fa-cog", label: "Paramètres", key: "parametres" },
          ].map(n => (
            <a href={n.href} class={`nav-item ${activePage === n.key ? 'active' : ''}`}>
              <i class={`fas ${n.icon} w-5 text-center text-sm`}></i>
              <span>{n.label}</span>
              {n.key === 'rdv' && appointments.filter(a => a.status === 'pending').length > 0 && (
                <span class="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {appointments.filter(a => a.status === 'pending').length}
                </span>
              )}
              {n.key === 'avis' && reviews.filter(r => !r.approved).length > 0 && (
                <span class="ml-auto bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {reviews.filter(r => !r.approved).length}
                </span>
              )}
            </a>
          ))}
        </nav>

        <div class="p-4 border-t border-white/10 space-y-2">
          <div class="flex items-center space-x-2 px-3 py-2 rounded-xl" style="background:rgba(255,255,255,0.06);">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
              <i class="fas fa-user-shield text-white text-xs"></i>
            </div>
            <div class="min-w-0">
              <div class="text-xs font-bold text-white truncate">Administrateur</div>
              <div class="text-xs text-blue-300/70" id="session-countdown">Session active</div>
            </div>
          </div>
          <a href="/" target="_blank" class="nav-item text-xs">
            <i class="fas fa-external-link-alt w-5 text-center"></i>
            <span>Voir le site public</span>
          </a>
          <a href="/api/admin/logout" class="nav-item text-xs text-red-300 hover:text-red-200">
            <i class="fas fa-sign-out-alt w-5 text-center"></i>
            <span>Déconnexion</span>
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main class="md:ml-64 flex-1 min-h-screen">
        {/* Top bar */}
        <header class="px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30" style="background:rgba(11,17,32,0.92); backdrop-filter:blur(20px); border-bottom:1px solid rgba(56,189,248,0.1);">
          <div class="flex items-center space-x-3">
            <button onclick="toggleSidebar()" class="md:hidden text-gray-500 hover:text-gray-300 p-2">
              <i class="fas fa-bars"></i>
            </button>
            <div>
              <h1 class="font-bold text-white text-base leading-none">
                {activePage === 'dashboard' ? 'Tableau de bord' :
                 activePage === 'produits' ? 'Gestion Produits' :
                 activePage === 'rdv' ? 'Rendez-vous' :
                 activePage === 'clients' ? 'Clients' :
                 activePage === 'commandes' ? 'Commandes' :
                 activePage === 'avis' ? 'Avis Clients' : 'MAASGA Admin'}
              </h1>
              <div class="text-xs text-gray-400 mt-0.5">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <div class="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium" style="background:rgba(16,185,129,0.12); color:#34d399;">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Système actif</span>
            </div>
            <a href="/admin/parametres" title="Paramètres" class="p-2 rounded-lg hover:bg-white/5 transition-colors" style="color:#64748b;">
              <i class="fas fa-cog text-sm"></i>
            </a>
            <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-sky-500 rounded-full flex items-center justify-center">
              <i class="fas fa-user-shield text-white text-xs"></i>
            </div>
          </div>
        </header>
        <div class="p-4 md:p-6">
          {children}
        </div>
      </main>

      <script dangerouslySetInnerHTML={{ __html: `
        function toggleSidebar() {
          const sb = document.getElementById('admin-sidebar');
          const overlay = document.getElementById('sidebar-overlay');
          sb.classList.toggle('open');
          overlay.classList.toggle('hidden');
        }

        // Session countdown (28800s = 8h)
        (function() {
          const el = document.getElementById('session-countdown');
          if (!el) return;
          const loginTime = parseInt(sessionStorage.getItem('maasga_login_ts') || '0') || Date.now();
          sessionStorage.setItem('maasga_login_ts', String(loginTime));
          function update() {
            const elapsed = Math.floor((Date.now() - loginTime) / 1000);
            const remaining = 28800 - elapsed;
            if (remaining <= 0) { el.textContent = 'Session expirée'; el.style.color = '#f87171'; return; }
            const h = Math.floor(remaining / 3600);
            const m = Math.floor((remaining % 3600) / 60);
            el.textContent = 'Expire dans ' + h + 'h' + String(m).padStart(2,'0');
            if (remaining < 1800) el.style.color = '#fbbf24';
          }
          update();
          setInterval(update, 60000);
        })();
      `}} />

      {/* Admin Toast System */}
      <div id="toast-container" class="fixed top-4 right-4 z-[99999] flex flex-col gap-3 pointer-events-none" style="max-width:380px;"></div>
      <script dangerouslySetInnerHTML={{ __html: `
        window.showToast = function(msg, type) {
          type = type || 'info';
          var colors = {
            success: 'linear-gradient(135deg,#059669,#10b981)',
            error: 'linear-gradient(135deg,#dc2626,#ef4444)',
            warning: 'linear-gradient(135deg,#d97706,#f59e0b)',
            info: 'linear-gradient(135deg,#2563eb,#3b82f6)'
          };
          var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
          var container = document.getElementById('toast-container');
          var el = document.createElement('div');
          el.className = 'pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-medium';
          el.style.cssText = 'background:' + (colors[type]||colors.info) + ';animation:slideIn .35s ease-out;border:1px solid rgba(255,255,255,0.15);';
          el.innerHTML = '<i class="fas ' + (icons[type]||icons.info) + ' text-lg opacity-90"></i><span>' + msg + '</span>';
          container.appendChild(el);
          setTimeout(function() {
            el.style.transition = 'opacity .3s, transform .3s';
            el.style.opacity = '0';
            el.style.transform = 'translateX(60px)';
            setTimeout(function() { el.remove(); }, 300);
          }, 4000);
        };
      `}} />
    </body>
  </html>
)

// ============================================================
// PAGE DASHBOARD
// ============================================================

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
    : '5.0'
  const estimatedCA = products.reduce((s, p) => s + (p.price * Math.max(0, 8 - p.stock)), 0)

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
              <div class="flex items-center justify-between rounded-xl p-3" style="background:rgba(15,23,42,0.6); border:1px solid rgba(220,38,38,0.15);">
                <div>
                  <span class="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mr-2" style="background:rgba(220,38,38,0.2); color:#f87171;">NOUVEAU</span>
                  <span class="font-semibold text-gray-200">{a.name}</span>
                  <span class="text-xs text-gray-400 ml-2">
                    ?? {a.quartier} · ?? {a.date} · {a.type === 'devis' ? 'Devis' : 'Installation'}
                  </span>
                </div>
                <span class="text-xs text-gray-400">{a.phone}</span>
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

      {/* KPIs */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in-up">
        {[
          { icon: "fa-calendar-check", color: "from-blue-500 to-blue-600", label: "RDV en attente", val: String(pendingRdv), sub: `${appointments.length} total · ${doneRdv} effectués`, href: "/admin/rdv" },
          { icon: "fa-boxes", color: "from-orange-500 to-red-500", label: "Alertes stock", val: String(lowStock + outOfStock), sub: `${outOfStock} rupture(s) · ${lowStock} limité(s)`, href: "/admin/produits" },
          { icon: "fa-star", color: "from-yellow-400 to-amber-500", label: "Avis en attente", val: String(pendingReviews), sub: `${approvedReviews} publiés · ${avgNote}/5`, href: "/admin/avis" },
          { icon: "fa-chart-line", color: "from-green-500 to-emerald-600", label: "CA estimé", val: `${Math.round(estimatedCA / 1000)}K`, sub: "FCFA · ventes estimées", href: "/admin/commandes" }
        ].map(k => (
          <a href={k.href} class="stat-card hover-lift block">
            <div class={`w-10 h-10 bg-gradient-to-br ${k.color} rounded-xl flex items-center justify-center mb-3`}>
              <i class={`fas ${k.icon} text-white text-sm`}></i>
            </div>
            <div class="text-2xl font-bold text-white mb-0.5">{k.val}</div>
            <div class="text-sm font-medium text-gray-400">{k.label}</div>
            <div class="text-xs text-gray-400 mt-1">{k.sub}</div>
          </a>
        ))}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 fade-in-up delay-1">
        {/* Stats cette semaine */}
        <div class="rounded-2xl p-6 card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
          <h3 class="font-bold text-white mb-4 flex items-center space-x-2">
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
              <div class="rounded-xl p-3 flex items-center space-x-3" style="background:rgba(255,255,255,0.03); border:1px solid rgba(148,180,220,0.08);">
                <i class={`fas ${s.icon} text-lg`} style={`color:${s.color};`}></i>
                <div>
                  <div class="text-xl font-bold text-white leading-none">{s.val}</div>
                  <div class="text-xs text-gray-400 mt-0.5">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Mini bar chart - derniers 7 jours RDV */}
          <div>
            <div class="text-xs text-gray-500 mb-2">RDV par jour (7 derniers jours)</div>
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
        <div class="rounded-2xl p-6 card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
          <h3 class="font-bold text-white mb-4 flex items-center space-x-2">
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
              <div><div class="text-sm font-medium text-gray-200">Paramètres du site</div><div class="text-xs text-gray-500">Mot de passe, configuration</div></div>
              <i class="fas fa-chevron-right text-xs text-gray-600 ml-auto"></i>
            </a>
            <a href="/api/admin/logout" class="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-red-900/10 transition-colors">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(239,68,68,0.1);"><i class="fas fa-sign-out-alt text-red-400 text-sm"></i></div>
              <div><div class="text-sm font-medium text-red-400">Déconnexion</div><div class="text-xs text-gray-500">Fermer la session admin</div></div>
            </a>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 fade-in-up delay-1">
        {/* Alertes stock */}
        <div class="rounded-2xl  p-6 card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-bold text-white flex items-center space-x-2">
              <i class="fas fa-exclamation-triangle text-orange-500"></i>
              <span>Alertes stock</span>
            </h3>
            <a href="/admin/produits" class="text-xs text-primary-600 font-medium">Gérer</a>
          </div>
          {products.filter(p => p.stock <= 3).length === 0 ? (
            <div class="text-center py-6 text-gray-400">
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
                      <div class="text-sm font-semibold text-gray-200 leading-tight">{p.name}</div>
                      <div class="text-xs text-gray-400">{p.brand} · {p.btu.toLocaleString()} BTU</div>
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
        <div class="rounded-2xl  p-6 card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-bold text-white flex items-center space-x-2">
              <i class="fas fa-calendar-alt text-primary-500"></i>
              <span>Rendez-vous récents</span>
            </h3>
            <a href="/admin/rdv" class="text-xs text-primary-600 font-medium">Voir tout</a>
          </div>
          {appointments.length === 0 ? (
            <p class="text-sm text-gray-400 text-center py-4">Aucun rendez-vous</p>
          ) : (
            <div class="space-y-3">
              {appointments.slice(-4).reverse().map(a => (
                <div class="flex items-center justify-between p-3 rounded-xl" style="background:rgba(15,23,42,0.5); border:1px solid rgba(148,180,220,0.08);">
                  <div>
                    <div class="text-sm font-semibold text-gray-200">{a.name}</div>
                    <div class="text-xs text-gray-400">{a.date} · {a.quartier} · <span class="capitalize">{a.type}</span></div>
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

      {/* Tableau produits */}
      <div class="rounded-2xl  p-6 card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-bold text-white flex items-center space-x-2">
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
                  <th class="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr class="border-b border-gray-800 hover:bg-cyan-900/10 transition-colors">
                  <td class="py-3 px-3">
                    <div class="flex items-center space-x-2">
                      <span class="text-xl">{p.image}</span>
                      <span class="font-medium text-gray-200 text-xs leading-tight max-w-32">{p.name}</span>
                    </div>
                  </td>
                  <td class="py-3 px-3 text-xs text-gray-400 font-medium">{p.brand}</td>
                  <td class="py-3 px-3 text-xs text-gray-400">{p.btu.toLocaleString()}</td>
                  <td class="py-3 px-3 text-xs font-semibold text-gray-200">{p.price.toLocaleString()} F</td>
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

    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-white">Gestion des produits</h2>
        <p class="text-sm text-gray-400 mt-1">{products.length} produits au catalogue · {products.filter(p => p.available && p.stock > 0).length} disponibles</p>
      </div>
      <button onclick="document.getElementById('add-product-modal').classList.remove('hidden')"
        class="btn-primary font-semibold px-5 py-2.5 rounded-xl flex items-center space-x-2 text-sm shadow-md">
        <i class="fas fa-plus"></i>
        <span class="hidden sm:inline">Ajouter un produit</span>
        <span class="sm:hidden">Ajouter</span>
      </button>
    </div>

    {/* Résumé stock */}
    <div class="grid grid-cols-3 gap-4 mb-6">
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

    <div class="rounded-2xl  card-shadow overflow-hidden" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b border-gray-700/50" style="background:#0e1726;">
            <tr>
              {["Produit", "Marque", "BTU", "Prix", "Stock", "Inverter", "Image", "Actions"].map(h => (
                <th class="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700/30">
            {products.map(p => (
              <tr class="hover:bg-cyan-900/10 transition-colors">
                <td class="py-4 px-4">
                  <div class="flex items-center space-x-3 min-w-0">
                    {(p as any).imageUrl
                      ? <img src={(p as any).imageUrl} alt={p.name} class="w-10 h-10 object-contain rounded-lg border flex-shrink-0" style="background:rgba(15,23,42,0.5); border-color:rgba(148,180,220,0.12);" />
                      : <span class="text-2xl flex-shrink-0">{p.image}</span>
                    }
                    <div class="min-w-0">
                      <div class="font-semibold text-gray-200 text-xs leading-tight truncate max-w-36">{p.name}</div>
                      <div class="text-xs text-gray-500">{p.model}</div>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-4 text-gray-400 text-xs font-medium whitespace-nowrap">{p.brand}</td>
                <td class="py-4 px-4 text-gray-400 text-xs whitespace-nowrap">{p.btu.toLocaleString()}</td>
                <td class="py-4 px-4 font-semibold text-gray-200 text-xs whitespace-nowrap">{p.price.toLocaleString()} F</td>
                <td class="py-4 px-4">
                  <form method="post" action="/api/admin/produit/stock" class="flex items-center space-x-2">
                    <input type="hidden" name="id" value={String(p.id)} />
                    <input type="number" name="stock" value={String(p.stock)} min="0" max="99"
                      class={`w-16 border rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-none focus:border-blue-500 transition-colors ${p.stock === 0 ? 'border-red-500/40 text-red-400' : p.stock <= 3 ? 'border-orange-500/40 text-orange-400' : 'border-green-500/40 text-green-400'}`} style="background:rgba(15,23,42,0.7);" />
                    <button type="submit" class="text-xs text-blue-400 hover:text-blue-300 px-2 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap" style="background:rgba(59,130,246,0.12);">MAJ</button>
                  </form>
                </td>
                <td class="py-4 px-4">
                  <span class={`text-xs px-2.5 py-1 rounded-full font-semibold ${p.inverter ? 'text-blue-400' : 'text-gray-500'}`} style={p.inverter ? 'background:rgba(59,130,246,0.12);' : 'background:rgba(148,163,184,0.1);'}>
                    {p.inverter ? 'Oui' : 'Non'}
                  </span>
                </td>
                {/* Colonne image upload */}
                <td class="py-4 px-4">
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
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center space-x-1">
                    <a href={`/catalogue?product=${p.id}`} target="_blank" class="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg transition-colors" style="" title="Voir">
                      <i class="fas fa-eye text-xs"></i>
                    </a>
                    <button 
                      onclick={`editProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}', '${p.brand}', '${p.model}', ${p.btu}, ${p.price}, ${p.stock}, '${p.energy_class}', ${p.surface_min || ''}, ${p.surface_max || ''}, '${p.description.replace(/'/g, "\\'")}', ${p.inverter}, '${JSON.stringify(p.features).replace(/'/g, "\\'")}', '${JSON.stringify(p.techSpecs || {}).replace(/'/g, "\\'")}'  , '${JSON.stringify(p.media || []).replace(/'/g, "\\'")}')`}
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
      <div class="rounded-3xl p-8 w-full max-w-xl shadow-2xl max-h-screen overflow-y-auto" style="background:#111827; border:1px solid rgba(56,189,248,0.12);">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-bold text-white text-lg">
            <i class="fas fa-plus-circle text-primary-600 mr-2"></i>Ajouter un produit
          </h3>
          <button onclick="document.getElementById('add-product-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-300 p-1">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <form method="post" action="/api/admin/produit/add" enctype="multipart/form-data" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Nom du produit *</label>
              <input type="text" name="name" required placeholder="Ex: Climatiseur Split Inverter 12000 BTU" class="input-field text-sm" />
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">
                <i class="fas fa-image text-purple-500 mr-1"></i>Photo du produit
              </label>
              <div class="flex items-center space-x-3">
                <label class="flex-1 cursor-pointer border-2 border-dashed rounded-xl p-3 text-center transition-all" style="border-color:rgba(168,85,247,0.3); background:transparent;" onmouseover="this.style.borderColor='rgba(168,85,247,0.5)'" onmouseout="this.style.borderColor='rgba(168,85,247,0.3)'">
                  <i class="fas fa-cloud-upload-alt text-purple-400 text-xl mb-1"></i>
                  <p class="text-xs text-purple-400 font-medium">Cliquer pour choisir une image</p>
                  <p class="text-xs text-gray-500">JPG, PNG, WEBP (max 2 Mo)</p>
                  <input type="file" name="image" accept="image/*" class="hidden"
                    onchange="const r=new FileReader();r.onload=e=>{document.getElementById('preview-img').src=e.target.result;document.getElementById('preview-img').classList.remove('hidden')};r.readAsDataURL(this.files[0])" />
                </label>
                <img id="preview-img" src="" alt="Aperçu" class="hidden w-16 h-16 object-contain rounded-xl border border-gray-700/50" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Marque *</label>
              <input type="text" name="brand" required placeholder="Ex: SAMSUNG, LG, DAIKIN" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Modèle / Référence</label>
              <input type="text" name="model" placeholder="Ex: AR12TX..." class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Puissance BTU *</label>
              <select name="btu" required class="input-field text-sm">
                <option value="9000">9 000 BTU</option>
                <option value="12000" selected>12 000 BTU</option>
                <option value="18000">18 000 BTU</option>
                <option value="24000">24 000 BTU</option>
                <option value="30000">30 000 BTU</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Prix FCFA *</label>
              <input type="number" name="price" required min="0" placeholder="Ex: 280000" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Stock initial *</label>
              <input type="number" name="stock" required min="0" value="0" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Classe énergie</label>
              <select name="energy_class" class="input-field text-sm">
                <option value="A">A</option><option value="A+">A+</option>
                <option value="A++" selected>A++</option><option value="A+++">A+++</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Surface min m²</label>
              <input type="number" name="surface_min" min="1" placeholder="Ex: 15" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Surface max m²</label>
              <input type="number" name="surface_max" min="1" placeholder="Ex: 25" class="input-field text-sm" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Description</label>
            <textarea name="description" rows={2} placeholder="Description technique du produit..." class="input-field text-sm resize-none"></textarea>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Mentions / Fonctionnalités</label>
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
          <div class="pt-4" style="border-top:1px solid rgba(56,189,248,0.15);">
            <button type="button" onclick="this.nextElementSibling.classList.toggle('hidden')"
              class="w-full flex items-center justify-between text-sm font-semibold mb-3 focus:outline-none" style="color:#38bdf8;">
              <span><i class="fas fa-microchip mr-2"></i>Caractéristiques techniques (optionnel)</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div class="hidden">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Source de courant</label>
                  <input type="text" name="power_source" placeholder="ex: 220V/1Ph/50Hz" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Capacité refroidissement</label>
                  <input type="text" name="cooling_capacity" placeholder="ex: 3500 W" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Puissance refroid. entrée</label>
                  <input type="text" name="cooling_input_power" placeholder="ex: 1150 W" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Courant nominal refroid.</label>
                  <input type="text" name="nominal_cooling_current" placeholder="ex: 5.5 A" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Max. Conso. entrée</label>
                  <input type="text" name="max_input_consumption" placeholder="ex: 1400 W" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Courant max</label>
                  <input type="text" name="max_current" placeholder="ex: 6.5 A" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Courant de démarrage</label>
                  <input type="text" name="starting_current" placeholder="ex: 45 A" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Type de compresseur</label>
                  <input type="text" name="compressor_type" placeholder="ex: Rotatif" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Débit d'air intérieur</label>
                  <input type="text" name="indoor_airflow" placeholder="ex: 600 m³/h" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Bruit intérieur</label>
                  <input type="text" name="indoor_noise" placeholder="ex: 26-42 dB(A)" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Type de réfrigérant</label>
                  <input type="text" name="refrigerant_type" placeholder="ex: R32" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Pression de conception</label>
                  <input type="text" name="design_pressure" placeholder="ex: 4.3/1.9 MPa" class="input-field text-sm" />
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Température de fonctionnement</label>
                  <input type="text" name="operating_temp" placeholder="ex: -15°C · 50°C" class="input-field text-sm" />
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Température ambiante (refroid.)</label>
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
              <div id="media-add-preview" class="grid grid-cols-4 gap-2 mb-3"></div>
              <input type="hidden" name="media_json" id="add-media-json" value="[]" />
              <p class="text-xs text-gray-500 italic">Extensions : JPG, PNG, WEBP (images), MP4, WebM (vidéos). Max 10 fichiers, 50 Mo chacun.</p>
            </div>
          </div>

          <div class="flex items-center space-x-6">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" name="inverter" id="inverter-check" class="accent-blue-600 w-4 h-4" />
              <span class="text-sm text-gray-300 font-medium">Technologie Inverter</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" name="available" id="available-check" checked class="accent-green-600 w-4 h-4" />
              <span class="text-sm text-gray-300 font-medium">Disponible à la vente</span>
            </label>
          </div>
          <div class="flex space-x-3 pt-2">
            <button type="button" onclick="document.getElementById('add-product-modal').classList.add('hidden')"
              class="flex-1 border-2 border-gray-600 text-gray-400 font-semibold py-3 rounded-xl text-sm hover:bg-cyan-900/10 transition-colors">
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
      <div class="rounded-3xl p-8 w-full max-w-xl shadow-2xl max-h-screen overflow-y-auto" style="background:#111827; border:1px solid rgba(56,189,248,0.12);">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-bold text-white text-lg">
            <i class="fas fa-edit-circle text-primary-600 mr-2"></i>Modifier le produit
          </h3>
          <button onclick="document.getElementById('edit-product-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-300 p-1">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <form id="edit-form" method="post" action="/api/admin/produit/update" enctype="multipart/form-data" class="space-y-4">
          <input type="hidden" id="edit-id" name="id" />
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Nom du produit *</label>
              <input type="text" id="edit-name" name="name" required placeholder="Ex: Climatiseur Split Inverter 12000 BTU" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Marque *</label>
              <input type="text" id="edit-brand" name="brand" required placeholder="Ex: SAMSUNG" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Modèle / Référence</label>
              <input type="text" id="edit-model" name="model" placeholder="Ex: AR12TX..." class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Puissance BTU *</label>
              <select id="edit-btu" name="btu" required class="input-field text-sm">
                <option value="9000">9 000 BTU</option>
                <option value="12000">12 000 BTU</option>
                <option value="18000">18 000 BTU</option>
                <option value="24000">24 000 BTU</option>
                <option value="30000">30 000 BTU</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Prix FCFA *</label>
              <input type="number" id="edit-price" name="price" required min="0" placeholder="Ex: 280000" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Stock *</label>
              <input type="number" id="edit-stock" name="stock" required min="0" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Classe énergie</label>
              <select id="edit-energy_class" name="energy_class" class="input-field text-sm">
                <option value="A">A</option><option value="A+">A+</option>
                <option value="A++">A++</option><option value="A+++">A+++</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Surface min m²</label>
              <input type="number" id="edit-surface_min" name="surface_min" min="1" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Surface max m²</label>
              <input type="number" id="edit-surface_max" name="surface_max" min="1" class="input-field text-sm" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Description</label>
            <textarea id="edit-description" name="description" rows={2} placeholder="Description technique du produit..." class="input-field text-sm resize-none"></textarea>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Mentions / Fonctionnalités</label>
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
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Source de courant</label>
                  <input type="text" id="edit-power_source" name="power_source" placeholder="ex: 220V/1Ph/50Hz" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Capacité refroidissement</label>
                  <input type="text" id="edit-cooling_capacity" name="cooling_capacity" placeholder="ex: 3500 W" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Puissance refroid. entrée</label>
                  <input type="text" id="edit-cooling_input_power" name="cooling_input_power" placeholder="ex: 1150 W" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Courant nominal refroid.</label>
                  <input type="text" id="edit-nominal_cooling_current" name="nominal_cooling_current" placeholder="ex: 5.5 A" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Max. Conso. entrée</label>
                  <input type="text" id="edit-max_input_consumption" name="max_input_consumption" placeholder="ex: 1400 W" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Courant max</label>
                  <input type="text" id="edit-max_current" name="max_current" placeholder="ex: 6.5 A" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Courant de démarrage</label>
                  <input type="text" id="edit-starting_current" name="starting_current" placeholder="ex: 45 A" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Type de compresseur</label>
                  <input type="text" id="edit-compressor_type" name="compressor_type" placeholder="ex: Rotatif" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Débit d'air intérieur</label>
                  <input type="text" id="edit-indoor_airflow" name="indoor_airflow" placeholder="ex: 600 m³/h" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Bruit intérieur</label>
                  <input type="text" id="edit-indoor_noise" name="indoor_noise" placeholder="ex: 26-42 dB(A)" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Type de réfrigérant</label>
                  <input type="text" id="edit-refrigerant_type" name="refrigerant_type" placeholder="ex: R32" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Pression de conception</label>
                  <input type="text" id="edit-design_pressure" name="design_pressure" placeholder="ex: 4.3/1.9 MPa" class="input-field text-sm" />
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Température de fonctionnement</label>
                  <input type="text" id="edit-operating_temp" name="operating_temp" placeholder="ex: -15°C · 50°C" class="input-field text-sm" />
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-semibold text-gray-400 mb-1">Température ambiante (refroid.)</label>
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
              <div id="media-edit-preview" class="grid grid-cols-4 gap-2 mb-3"></div>
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
            <span>\${f}</span>
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

      function previewMediaEdit() {
        const input = document.getElementById('media-edit-input');
        const previewContainer = document.getElementById('media-edit-preview');
        previewContainer.innerHTML = '';
        window.editMediaArray = [];

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
                window.editMediaArray.push(mediaItem);
                document.getElementById('edit-media-json').value = JSON.stringify(window.editMediaArray);

                const thumb = document.createElement('div');
                thumb.className = 'relative rounded-lg overflow-hidden group';
                thumb.style.aspectRatio = '1/1';
                thumb.style.background = '#0a1628';
                thumb.innerHTML = '<img src="' + e.target.result + '" class="w-full h-full object-cover" />' +
                  '<button type="button" onclick="removeMediaEdit(' + (window.editMediaArray.length - 1) + ')" class="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">&times;</button>' +
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
              window.editMediaArray.push(mediaItem);
              document.getElementById('edit-media-json').value = JSON.stringify(window.editMediaArray);

              const thumb = document.createElement('div');
              thumb.className = 'relative rounded-lg overflow-hidden group';
              thumb.style.aspectRatio = '1/1';
              thumb.style.background = '#0a1628';
              thumb.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#000;"><i class="fas fa-play" style="color:#38bdf8;font-size:1.5rem;"></i></div>' +
                '<button type="button" onclick="removeMediaEdit(' + (window.editMediaArray.length - 1) + ')" class="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">&times;</button>' +
                '<span class="absolute bottom-1 left-1 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">VID</span>';
              previewContainer.appendChild(thumb);
            };
            reader.readAsDataURL(file);
          }
        });
      }

      function removeMediaAdd(index) {
        window.addMediaArray.splice(index, 1);
        document.getElementById('add-media-json').value = JSON.stringify(window.addMediaArray);
        previewMediaAdd();
      }

      function removeMediaEdit(index) {
        window.editMediaArray.splice(index, 1);
        document.getElementById('edit-media-json').value = JSON.stringify(window.editMediaArray);
        previewMediaEdit();
      }

      function loadMediaForEdit(mediaJson) {
        window.editMediaArray = JSON.parse(mediaJson || '[]');
        const previewContainer = document.getElementById('media-edit-preview');
        previewContainer.innerHTML = '';

        window.editMediaArray.forEach((item, idx) => {
          const thumb = document.createElement('div');
          thumb.className = 'relative rounded-lg overflow-hidden group';
          thumb.style.aspectRatio = '1/1';
          thumb.style.background = '#0a1628';
          thumb.innerHTML = \`
            \${item.type === 'image' 
              ? '<img src="' + item.url + '" class="w-full h-full object-cover" />'
              : '<video src="' + item.url + '" class="w-full h-full object-cover" style="background:#000;"></video>'
            }
            <button type="button" onclick="removeMediaEdit(\${idx})" 
              class="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
              ·
            </button>
            <span class="absolute bottom-1 left-1 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">\${item.type === 'image' ? 'IMG' : 'VID'}</span>
          \`;
          previewContainer.appendChild(thumb);
        });
        document.getElementById('edit-media-json').value = JSON.stringify(window.editMediaArray);
      }
    `}} />
  </AdminLayout>
)

// ============================================================
// PAGE RDV
// ============================================================

export const AdminRDVPage = ({ filterStatus }: { filterStatus?: string }) => {
  const filtered = filterStatus && filterStatus !== 'all'
    ? appointments.filter(a => a.status === filterStatus)
    : appointments

  return (
    <AdminLayout activePage="rdv">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-xl font-bold text-white">Gestion des rendez-vous</h2>
          <p class="text-sm text-gray-500 mt-1">{filtered.length} rendez-vous · {appointments.filter(a => a.status === 'pending').length} en attente</p>
        </div>
        <div class="flex flex-wrap gap-2 items-center">
          <button onclick="document.getElementById('add-rdv-modal').classList.remove('hidden')"
            class="btn-primary font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 text-xs shadow-md">
            <i class="fas fa-plus"></i>
            <span>Ajouter RDV</span>
          </button>
          {[
            { s: '', label: 'Tous', count: appointments.length },
            { s: 'pending', label: 'En attente', count: appointments.filter(a => a.status === 'pending').length },
            { s: 'confirmed', label: 'Confirmés', count: appointments.filter(a => a.status === 'confirmed').length },
            { s: 'done', label: 'Effectués', count: appointments.filter(a => a.status === 'done').length }
          ].map(f => (
            <a href={`/admin/rdv${f.s ? '?status=' + f.s : ''}`}
              class={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-colors flex items-center space-x-1.5 ${(filterStatus || '') === f.s ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-700 text-gray-400 hover:bg-cyan-900/10'}`} style={(filterStatus || '') !== f.s ? 'background:rgba(15,23,42,0.5);' : ''}>
              <span>{f.label}</span>
              {f.count > 0 && <span class={`text-xs rounded-full w-4 h-4 flex items-center justify-center ${(filterStatus || '') === f.s ? 'bg-white text-primary-600' : ''}`} style={(filterStatus || '') !== f.s ? 'background:rgba(148,180,220,0.1);' : ''}>{f.count}</span>}
            </a>
          ))}
        </div>
      </div>

      {/* Barre de recherche RDV */}
      <div class="mb-4 relative">
        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none"></i>
        <input type="text" id="rdv-search" placeholder="Rechercher par nom, téléphone, quartier..."
          oninput="filterRDVList(this.value)"
          class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm input-field" />
      </div>

      {filtered.length === 0 ? (
        <div class="rounded-2xl  p-12 text-center card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
          <i class="fas fa-calendar-times text-3xl text-gray-300 mb-3"></i>
          <p class="text-gray-400">Aucun rendez-vous dans cette catégorie</p>
        </div>
      ) : (
        <div class="space-y-4">
          {filtered.map(a => (
            <div class="rdv-card rounded-2xl p-5 card-shadow" data-search={`${a.name} ${a.phone} ${a.quartier}`.toLowerCase()} style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-start space-x-4">
                  <div class={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${a.type === 'devis' ? '' : ''}`} style={a.type === 'devis' ? 'background:rgba(59,130,246,0.15);' : 'background:rgba(16,185,129,0.15);'}>
                    <i class={`fas ${a.type === 'devis' ? 'fa-clipboard-check text-blue-400' : 'fa-tools text-green-400'} text-lg`}></i>
                  </div>
                  <div>
                    <div class="flex items-center space-x-2 mb-1">
                      <h4 class="font-bold text-white cursor-pointer hover:text-blue-300 transition-colors" onclick={`showRdvDetail(${JSON.stringify(a).replace(/"/g, '&quot;')})`} title="Voir détails client">{a.name} <i class="fas fa-eye text-xs text-blue-400 ml-1"></i></h4>
                      <span class={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.status === 'pending' ? 'badge-pending' : a.status === 'confirmed' ? 'badge-confirmed' : 'badge-done'}`}>
                        {a.status === 'pending' ? 'En attente' : a.status === 'confirmed' ? 'Confirmé' : 'Effectué'}
                      </span>
                    </div>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span><i class="fas fa-phone mr-1 text-gray-400"></i>{a.phone}</span>
                      <span><i class="fas fa-map-marker-alt mr-1 text-gray-400"></i>{a.quartier}</span>
                      <span><i class="fas fa-calendar mr-1 text-gray-400"></i>{a.date}</span>
                      {(a.heure_debut || a.heure_fin) && <span><i class="fas fa-clock mr-1 text-gray-400"></i>{a.heure_debut}–{a.heure_fin}</span>}
                      <span><i class="fas fa-tag mr-1 text-gray-400"></i>{a.type === 'devis' ? 'Devis/Dimensionnement' : 'Installation'}</span>
                    </div>
                    {a.notes && <div class="mt-1 text-xs text-gray-400 italic">{a.notes}</div>}
                  </div>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                  {/* Actions statut */}
                  {a.status !== 'confirmed' && (
                    <form method="post" action="/api/admin/rdv/update">
                      <input type="hidden" name="id" value={String(a.id)} />
                      <input type="hidden" name="status" value="confirmed" />
                      <button type="submit" class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(16,185,129,0.15); color:#34d399;">
                        <i class="fas fa-check mr-1"></i>Confirmer
                      </button>
                    </form>
                  )}
                  {a.status !== 'done' && (
                    <form method="post" action="/api/admin/rdv/update">
                      <input type="hidden" name="id" value={String(a.id)} />
                      <input type="hidden" name="status" value="done" />
                      <button type="submit" class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(59,130,246,0.15); color:#60a5fa;">
                        <i class="fas fa-flag-checkered mr-1"></i>Effectué
                      </button>
                    </form>
                  )}
                  <a href={`https://wa.me/${a.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Bonjour ' + a.name + ', votre RDV MAASGA du ' + a.date + ' à ' + a.quartier + ' est confirmé. Besoin de renseignements ?')}`} target="_blank"
                    class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(37,211,102,0.15); color:#25D366;" title="Contacter via WhatsApp">
                    <i class="fab fa-whatsapp mr-1"></i>WA
                  </a>
                  <a href={`/admin/devis/new?rdvId=${a.id}`}
                    class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(239,68,68,0.12); color:#f87171;">
                    <i class="fas fa-file-invoice-dollar mr-1"></i>Devis
                  </a>
                  <form method="post" action="/api/admin/rdv/delete" style="display:inline" onsubmit="return confirm('Êtes-vous sûr de vouloir supprimer ce RDV ?')">
                    <input type="hidden" name="id" value={String(a.id)} />
                    <button type="submit" class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(239,68,68,0.15); color:#f87171;">
                      <i class="fas fa-trash mr-1"></i>Supprimer
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ajout RDV */}
      <div id="add-rdv-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div class="rounded-3xl p-8 w-full max-w-xl shadow-2xl my-8" style="background:#111827; border:1px solid rgba(56,189,248,0.12);">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-white text-lg">Ajouter un rendez-vous</h3>
            <button onclick="document.getElementById('add-rdv-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-300 p-1">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <form method="post" action="/api/admin/rdv/add" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="block text-xs font-semibold text-gray-400 mb-1.5">Nom client *</label>
                <input type="text" name="name" required placeholder="Ex: Moussa Traoré" class="input-field text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1.5">Téléphone *</label>
                <input type="tel" name="phone" required placeholder="+226 XX XX XX XX" class="input-field text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1.5">Quartier *</label>
                <input type="text" name="quartier" required placeholder="Ex: Paspanga" class="input-field text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1.5">Date *</label>
                <input type="date" name="date" required class="input-field text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1.5">Heure début</label>
                <input type="time" name="heure_debut" value="08:00" class="input-field text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1.5">Heure fin</label>
                <input type="time" name="heure_fin" value="18:00" class="input-field text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1.5">Type *</label>
                <select name="type" required class="input-field text-sm">
                  <option value="devis">Devis/Dimensionnement</option>
                  <option value="installation">Installation</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1.5">Latitude</label>
                <input type="number" name="latitude" step="0.0001" placeholder="12.3656" class="input-field text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1.5">Longitude</label>
                <input type="number" name="longitude" step="0.0001" placeholder="-1.5197" class="input-field text-sm" />
              </div>
              <div class="col-span-2">
                <label class="block text-xs font-semibold text-gray-400 mb-1.5">Notes</label>
                <textarea name="notes" placeholder="Remarques complémentaires..." class="input-field text-sm" rows={3}></textarea>
              </div>
            </div>
            <button type="submit" class="btn-primary w-full py-3 rounded-xl font-semibold text-sm mt-6">
              <i class="fas fa-check mr-2"></i>Ajouter RDV
            </button>
          </form>
        </div>
      </div>
      {/* Modal Détail RDV */}
      <div id="rdv-detail-modal" class="hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div class="rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" style="background:#111827; border:1px solid rgba(56,189,248,0.2);">
          <div class="flex items-center justify-between px-6 py-4" style="background:rgba(59,130,246,0.1); border-bottom:1px solid rgba(56,189,248,0.15);">
            <h3 class="font-bold text-white text-lg flex items-center space-x-2">
              <i class="fas fa-calendar-alt text-blue-400"></i>
              <span>Détails du rendez-vous</span>
            </h3>
            <button onclick="document.getElementById('rdv-detail-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-200 p-1 transition-colors">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div class="flex items-center space-x-4">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold" style="background:rgba(59,130,246,0.2); color:#60a5fa;" id="rdv-detail-avatar"></div>
              <div>
                <div class="text-lg font-bold text-white" id="rdv-detail-name"></div>
                <div class="text-sm text-blue-300" id="rdv-detail-type"></div>
              </div>
              <div class="ml-auto" id="rdv-detail-badge"></div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl p-3" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,180,220,0.1);">
                <div class="text-xs text-gray-500 mb-1"><i class="fas fa-phone mr-1"></i>Téléphone</div>
                <div class="text-sm font-semibold text-gray-200" id="rdv-detail-phone"></div>
              </div>
              <div class="rounded-xl p-3" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,180,220,0.1);">
                <div class="text-xs text-gray-500 mb-1"><i class="fas fa-map-marker-alt mr-1"></i>Quartier</div>
                <div class="text-sm font-semibold text-gray-200" id="rdv-detail-quartier"></div>
              </div>
              <div class="rounded-xl p-3" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,180,220,0.1);">
                <div class="text-xs text-gray-500 mb-1"><i class="fas fa-calendar mr-1"></i>Date</div>
                <div class="text-sm font-semibold text-gray-200" id="rdv-detail-date"></div>
              </div>
              <div class="rounded-xl p-3" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,180,220,0.1);">
                <div class="text-xs text-gray-500 mb-1"><i class="fas fa-clock mr-1"></i>Horaire</div>
                <div class="text-sm font-semibold text-gray-200" id="rdv-detail-heure"></div>
              </div>
              <div class="rounded-xl p-3" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,180,220,0.1);">
                <div class="text-xs text-gray-500 mb-1"><i class="fas fa-globe mr-1"></i>Localisation GPS</div>
                <div class="text-sm font-semibold text-gray-200" id="rdv-detail-gps"></div>
              </div>
              <div class="rounded-xl p-3" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,180,220,0.1);">
                <div class="text-xs text-gray-500 mb-1"><i class="fas fa-calendar-plus mr-1"></i>Créé le</div>
                <div class="text-sm font-semibold text-gray-200" id="rdv-detail-created"></div>
              </div>
            </div>
            <div id="rdv-detail-adresse-row" class="rounded-xl p-3 hidden" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,180,220,0.1);">
              <div class="text-xs text-gray-500 mb-1"><i class="fas fa-home mr-1"></i>Adresse précise</div>
              <div class="text-sm font-semibold text-gray-200" id="rdv-detail-adresse"></div>
            </div>
            <div id="rdv-detail-notes-row" class="rounded-xl p-3 hidden" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,180,220,0.1);">
              <div class="text-xs text-gray-500 mb-1"><i class="fas fa-sticky-note mr-1"></i>Notes</div>
              <div class="text-sm text-gray-300 italic" id="rdv-detail-notes"></div>
            </div>
          </div>
          <div class="px-6 pb-6 flex gap-3">
            <a id="rdv-detail-wa" href="#" target="_blank" class="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors" style="background:rgba(37,211,102,0.15); color:#25D366; border:1px solid rgba(37,211,102,0.25);">
              <i class="fab fa-whatsapp mr-2"></i>WhatsApp
            </a>
            <button onclick="document.getElementById('rdv-detail-modal').classList.add('hidden')" class="flex-1 text-sm font-semibold py-2.5 rounded-xl transition-colors" style="background:rgba(148,163,184,0.1); color:#94a3b8;">
              Fermer
            </button>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function filterRDVList(q) {
          q = q.toLowerCase().trim();
          document.querySelectorAll('.rdv-card').forEach(function(card) {
            var ds = card.getAttribute('data-search') || '';
            card.style.display = (!q || ds.includes(q)) ? '' : 'none';
          });
        }
        function showRdvDetail(a) {
          var badgeClass = a.status === 'pending' ? 'badge-pending' : a.status === 'confirmed' ? 'badge-confirmed' : 'badge-done';
          var badgeLabel = a.status === 'pending' ? 'En attente' : a.status === 'confirmed' ? 'Confirmé' : 'Effectué';
          document.getElementById('rdv-detail-avatar').textContent = (a.name || '?').charAt(0).toUpperCase();
          document.getElementById('rdv-detail-name').textContent = a.name || '-';
          document.getElementById('rdv-detail-type').textContent = a.type === 'devis' ? 'Devis / Dimensionnement' : 'Installation';
          document.getElementById('rdv-detail-badge').innerHTML = '<span class="text-xs px-3 py-1 rounded-full font-semibold ' + badgeClass + '">' + badgeLabel + '</span>';
          document.getElementById('rdv-detail-phone').textContent = a.phone || '-';
          document.getElementById('rdv-detail-quartier').textContent = a.quartier || '-';
          document.getElementById('rdv-detail-date').textContent = a.date || '-';
          var heure = (a.heure_debut && a.heure_fin) ? (a.heure_debut + ' – ' + a.heure_fin) : (a.heure_debut || a.heure_fin || '-');
          document.getElementById('rdv-detail-heure').textContent = heure;
          document.getElementById('rdv-detail-gps').textContent = (a.latitude && a.longitude) ? (a.latitude + ', ' + a.longitude) : 'Non renseigné';
          document.getElementById('rdv-detail-created').textContent = a.created_at || '-';
          var adresseRow = document.getElementById('rdv-detail-adresse-row');
          if (a.adresse_precise) { adresseRow.classList.remove('hidden'); document.getElementById('rdv-detail-adresse').textContent = a.adresse_precise; } else { adresseRow.classList.add('hidden'); }
          var notesRow = document.getElementById('rdv-detail-notes-row');
          if (a.notes) { notesRow.classList.remove('hidden'); document.getElementById('rdv-detail-notes').textContent = a.notes; } else { notesRow.classList.add('hidden'); }
          var phone = (a.phone || '').replace(/\\D/g, '');
          document.getElementById('rdv-detail-wa').href = 'https://wa.me/' + phone + '?text=' + encodeURIComponent('Bonjour ' + a.name + ', votre RDV MAASGA du ' + a.date + ' est confirmé.');
          document.getElementById('rdv-detail-modal').classList.remove('hidden');
        }
      ` }} />
    </AdminLayout>
  )
}

// ============================================================
// PAGE CLIENTS
// ============================================================

export const AdminClientsPage = () => {
  return (
    <AdminLayout activePage="clients">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-white">Gestion des clients</h2>
          <p class="text-sm text-gray-400 mt-1">{clients.length} clients enregistrés</p>
        </div>
        <button onclick="document.getElementById('add-client-modal').classList.remove('hidden')"
          class="btn-primary font-semibold px-5 py-2.5 rounded-xl flex items-center space-x-2 text-sm shadow-md">
          <i class="fas fa-plus"></i>
          <span>Ajouter client</span>
        </button>
        <button onclick="exportClientsCSV()" class="text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
          <i class="fas fa-file-csv"></i>
          <span>Export CSV</span>
        </button>
      </div>

      {/* Barre de recherche clients */}
      <div class="mb-4 relative">
        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none"></i>
        <input type="text" id="client-search" placeholder="Rechercher par nom, téléphone, email, quartier..."
          oninput="filterClientsList(this.value)"
          class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm input-field" />
      </div>

      <div class="rounded-2xl  card-shadow overflow-hidden" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="border-b" style="background:#0e1726;">
              <tr>
                {["Nom", "Email", "Téléphone", "Quartier", "Source", "RDVs", "Créé le", "Actions"].map(h => (
                  <th class="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/30">
              {clients.map(client => {
                const srcMap: Record<string, { label: string; style: string }> = {
                  devis: { label: 'RDV Devis', style: 'background:rgba(56,189,248,0.12); color:#38bdf8;' },
                  installation: { label: 'RDV Install.', style: 'background:rgba(52,211,153,0.12); color:#34d399;' },
                  commande: { label: 'Commande', style: 'background:rgba(167,139,250,0.12); color:#a78bfa;' },
                  contact: { label: 'Contact', style: 'background:rgba(251,191,36,0.12); color:#fbbf24;' },
                  connexion: { label: 'Inscription', style: 'background:rgba(244,114,182,0.12); color:#f472b6;' }
                }
                const src = srcMap[client.type_demande] || { label: client.type_demande || 'Manuel', style: 'background:rgba(148,163,184,0.1); color:#94a3b8;' }
                return (
                <tr class="client-row hover:bg-cyan-900/10 transition-colors" data-search={`${client.name} ${client.phone} ${client.email || ''} ${client.quartier || ''} ${client.type_demande || ''}`.toLowerCase()}>
                  <td class="py-4 px-4">
                    <div class="flex items-center space-x-3">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background:rgba(59,130,246,0.15);">
                        <span class="text-blue-400 font-bold text-xs">{client.name.charAt(0)}</span>
                      </div>
                      <span class="font-semibold text-gray-200">{client.name}</span>
                    </div>
                  </td>
                  <td class="py-4 px-4 text-gray-400 text-xs">{client.email || '-'}</td>
                  <td class="py-4 px-4 text-gray-400 text-xs">{client.phone}</td>
                  <td class="py-4 px-4 text-gray-400 text-xs">{client.quartier || '-'}</td>
                  <td class="py-4 px-4">
                    <span class="text-xs font-bold px-2 py-1 rounded-full" style={src.style}>{src.label}</span>
                  </td>
                  <td class="py-4 px-4">
                    <span class="text-xs font-bold px-2 py-1 rounded-full" style={appointments.filter(a => a.phone === client.phone).length > 0 ? 'background:rgba(56,189,248,0.12); color:#38bdf8;' : 'background:rgba(148,163,184,0.1); color:#94a3b8;'}>{appointments.filter(a => a.phone === client.phone).length}</span>
                  </td>
                  <td class="py-4 px-4 text-gray-500 text-xs">{client.created_at}</td>
                  <td class="py-4 px-4">
                    <div class="flex items-center space-x-1">
                      <button
                        onclick={`showClientDetail(${JSON.stringify(client).replace(/"/g, '&quot;')})`}
                        class="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg transition-colors" title="Voir détails">
                        <i class="fas fa-eye text-xs"></i>
                      </button>
                      <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Bonjour ' + client.name + ', MAASGA vous contacte.')}`} target="_blank"
                        class="text-green-400 hover:text-green-300 p-1.5 rounded-lg transition-colors" title="WhatsApp">
                        <i class="fab fa-whatsapp text-xs"></i>
                      </a>
                      <button 
                        onclick={`editClient(${client.id}, '${client.name.replace(/'/g, "\\'")}', '${client.email}', '${client.phone}', '${client.quartier}')`}
                        class="text-orange-400 hover:text-orange-300 p-1.5 rounded-lg transition-colors" title="Modifier">
                        <i class="fas fa-edit text-xs"></i>
                      </button>
                      <button class="text-red-400 hover:text-red-300 p-1.5 rounded-lg transition-colors" title="Supprimer"
                        onclick={`if(confirm('Supprimer ce client ?')) { document.getElementById('del-client-${client.id}').submit(); }`}>
                        <i class="fas fa-trash text-xs"></i>
                      </button>
                      <form id={`del-client-${client.id}`} method="post" action="/api/admin/client/delete" class="hidden">
                        <input type="hidden" name="id" value={String(client.id)} />
                      </form>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ajout client */}
      <div id="add-client-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="rounded-3xl p-8 w-full max-w-md shadow-2xl" style="background:#111827; border:1px solid rgba(56,189,248,0.12);">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-white text-lg">Ajouter un client</h3>
            <button onclick="document.getElementById('add-client-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-300 p-1">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <form method="post" action="/api/admin/client/add" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Nom complet *</label>
              <input type="text" name="name" required placeholder="Ex: Moussa Traoré" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
              <input type="email" name="email" placeholder="Ex: client@example.com" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Téléphone *</label>
              <input type="tel" name="phone" required placeholder="Ex: +226 XX XX XX XX" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Quartier</label>
              <input type="text" name="quartier" placeholder="Ex: Paspanga" class="input-field text-sm" />
            </div>
            <button type="submit" class="btn-primary w-full py-3 rounded-xl font-semibold text-sm mt-6">
              <i class="fas fa-check mr-2"></i>Ajouter client
            </button>
          </form>
        </div>
      </div>

      {/* Modal modifier client */}
      <div id="edit-client-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="rounded-3xl p-8 w-full max-w-md shadow-2xl" style="background:#111827; border:1px solid rgba(56,189,248,0.12);">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-white text-lg">Modifier client</h3>
            <button onclick="document.getElementById('edit-client-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-300 p-1">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <form method="post" action="/api/admin/client/update" class="space-y-4">
            <input type="hidden" id="edit-client-id" name="id" />
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Nom complet *</label>
              <input type="text" id="edit-client-name" name="name" required class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
              <input type="email" id="edit-client-email" name="email" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Téléphone *</label>
              <input type="tel" id="edit-client-phone" name="phone" required class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Quartier</label>
              <input type="text" id="edit-client-quartier" name="quartier" class="input-field text-sm" />
            </div>
            <button type="submit" class="btn-primary w-full py-3 rounded-xl font-semibold text-sm mt-6">
              <i class="fas fa-save mr-2"></i>Mettre à jour
            </button>
          </form>
        </div>
      </div>

      {/* Modal Détail Client */}
      <div id="client-detail-modal" class="hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div class="rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" style="background:#111827; border:1px solid rgba(56,189,248,0.2);">
          <div class="flex items-center justify-between px-6 py-4" style="background:rgba(59,130,246,0.1); border-bottom:1px solid rgba(56,189,248,0.15);">
            <h3 class="font-bold text-white text-lg flex items-center space-x-2">
              <i class="fas fa-user text-blue-400"></i>
              <span>Fiche client</span>
            </h3>
            <button onclick="document.getElementById('client-detail-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-200 p-1 transition-colors">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div class="flex items-center space-x-4">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold" style="background:rgba(59,130,246,0.2); color:#60a5fa;" id="client-detail-avatar"></div>
              <div>
                <div class="text-lg font-bold text-white" id="client-detail-name"></div>
                <div class="text-sm" id="client-detail-source"></div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl p-3" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,180,220,0.1);">
                <div class="text-xs text-gray-500 mb-1"><i class="fas fa-phone mr-1"></i>Téléphone</div>
                <div class="text-sm font-semibold text-gray-200" id="client-detail-phone"></div>
              </div>
              <div class="rounded-xl p-3" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,180,220,0.1);">
                <div class="text-xs text-gray-500 mb-1"><i class="fas fa-envelope mr-1"></i>Email</div>
                <div class="text-sm font-semibold text-gray-200" id="client-detail-email"></div>
              </div>
              <div class="rounded-xl p-3" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,180,220,0.1);">
                <div class="text-xs text-gray-500 mb-1"><i class="fas fa-map-marker-alt mr-1"></i>Quartier</div>
                <div class="text-sm font-semibold text-gray-200" id="client-detail-quartier"></div>
              </div>
              <div class="rounded-xl p-3" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,180,220,0.1);">
                <div class="text-xs text-gray-500 mb-1"><i class="fas fa-calendar-plus mr-1"></i>Inscrit le</div>
                <div class="text-sm font-semibold text-gray-200" id="client-detail-created"></div>
              </div>
              <div class="col-span-2 rounded-xl p-3" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,180,220,0.1);">
                <div class="text-xs text-gray-500 mb-1"><i class="fas fa-tag mr-1"></i>Type de demande initiale</div>
                <div class="text-sm font-semibold text-gray-200" id="client-detail-type"></div>
              </div>
            </div>
            <div id="client-detail-notes-row" class="rounded-xl p-3 hidden" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,180,220,0.1);">
              <div class="text-xs text-gray-500 mb-1"><i class="fas fa-sticky-note mr-1"></i>Notes</div>
              <div class="text-sm text-gray-300 italic" id="client-detail-notes"></div>
            </div>
          </div>
          <div class="px-6 pb-6 flex gap-3">
            <a id="client-detail-wa" href="#" target="_blank" class="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors" style="background:rgba(37,211,102,0.15); color:#25D366; border:1px solid rgba(37,211,102,0.25);">
              <i class="fab fa-whatsapp mr-2"></i>WhatsApp
            </a>
            <button onclick="document.getElementById('client-detail-modal').classList.add('hidden')" class="flex-1 text-sm font-semibold py-2.5 rounded-xl transition-colors" style="background:rgba(148,163,184,0.1); color:#94a3b8;">
              Fermer
            </button>
          </div>
        </div>
      </div>

      <script>{`
        function editClient(id, name, email, phone, quartier) {
          document.getElementById('edit-client-id').value = id;
          document.getElementById('edit-client-name').value = name;
          document.getElementById('edit-client-email').value = email;
          document.getElementById('edit-client-phone').value = phone;
          document.getElementById('edit-client-quartier').value = quartier;
          document.getElementById('edit-client-modal').classList.remove('hidden');
        }
        function showClientDetail(c) {
          var srcLabels = { devis:'RDV Devis', installation:'RDV Installation', commande:'Commande', contact:'Contact', connexion:'Inscription' };
          var srcColors = { devis:'color:#38bdf8;', installation:'color:#34d399;', commande:'color:#a78bfa;', contact:'color:#fbbf24;', connexion:'color:#f472b6;' };
          document.getElementById('client-detail-avatar').textContent = (c.name || '?').charAt(0).toUpperCase();
          document.getElementById('client-detail-name').textContent = c.name || '-';
          document.getElementById('client-detail-source').innerHTML = '<span class="text-xs font-semibold px-2 py-0.5 rounded-full" style="background:rgba(56,189,248,0.1);' + (srcColors[c.type_demande] || 'color:#94a3b8;') + '">' + (srcLabels[c.type_demande] || c.type_demande || 'Manuel') + '</span>';
          document.getElementById('client-detail-phone').textContent = c.phone || '-';
          document.getElementById('client-detail-email').textContent = c.email || '-';
          document.getElementById('client-detail-quartier').textContent = c.quartier || '-';
          document.getElementById('client-detail-created').textContent = c.created_at || '-';
          document.getElementById('client-detail-type').textContent = srcLabels[c.type_demande] || c.type_demande || 'Manuel';
          var notesRow = document.getElementById('client-detail-notes-row');
          if (c.notes) { notesRow.classList.remove('hidden'); document.getElementById('client-detail-notes').textContent = c.notes; } else { notesRow.classList.add('hidden'); }
          var phone = (c.phone || '').replace(/\\D/g, '');
          document.getElementById('client-detail-wa').href = 'https://wa.me/' + phone + '?text=' + encodeURIComponent('Bonjour ' + c.name + ', MAASGA vous contacte.');
          document.getElementById('client-detail-modal').classList.remove('hidden');
        }
        function filterClientsList(q) {
          q = q.toLowerCase().trim();
          document.querySelectorAll('.client-row').forEach(function(row) {
            var ds = row.getAttribute('data-search') || '';
            row.style.display = (!q || ds.includes(q)) ? '' : 'none';
          });
        }
        function exportClientsCSV() {
          const headers = ['Nom', 'Email', 'Téléphone', 'Quartier', 'RDVs', 'Créé le'];
          const rows = [headers];
          document.querySelectorAll('.client-row').forEach(function(row) {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 6) {
              rows.push([cells[0].textContent.trim(), cells[1].textContent.trim(), cells[2].textContent.trim(), cells[3].textContent.trim(), cells[4].textContent.trim(), cells[5].textContent.trim()]);
            }
          });
          const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
          const a = document.createElement('a');
          a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
          a.download = 'clients_maasga.csv';
          a.click();
        }
      `}</script>
    </AdminLayout>
  )
}

// ============================================================
// PAGE COMMANDES
// ============================================================

export const AdminCommandesPage = () => {
  const totalOrders = orders.length
  const validatedOrders = orders.filter(o => o.status === 'validated' || o.status === 'installed').length
  const installedOrders = orders.filter(o => o.status === 'installed').length
  const pendingOrders = orders.filter(o => o.status === 'validation_terrain').length
  const estimatedCA = products.reduce((s, p) => s + (p.price * Math.max(0, 8 - p.stock)), 0)

  return (
  <AdminLayout activePage="commandes">
    <div class="mb-6">
      <h2 class="text-xl font-bold text-white">Gestion des commandes</h2>
      <p class="text-sm text-gray-400 mt-1">Suivi des commandes en cours et historique</p>
    </div>

    {/* KPIs commandes */}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[
        { label: "Total commandes", val: totalOrders, icon: "fa-shopping-bag", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)", color: "#60a5fa" },
        { label: "Validées", val: validatedOrders, icon: "fa-check-double", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", color: "#34d399" },
        { label: "Install\u00e9es", val: installedOrders, icon: "fa-tools", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.2)", color: "#38bdf8" },
        { label: "CA estim\u00e9", val: estimatedCA.toLocaleString('fr-FR') + ' F', icon: "fa-coins", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.2)", color: "#fbbf24" }
      ].map(s => (
        <div class="rounded-xl p-4 card-shadow" style={`background:${s.bg}; border:1px solid ${s.border};`}>
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={`background:${s.bg};`}>
              <i class={`fas ${s.icon} text-lg`} style={`color:${s.color};`}></i>
            </div>
            <div>
              <div class="text-xl font-bold text-white leading-none">{s.val}</div>
              <div class="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Processus de commande */}
    <div class="rounded-2xl p-5 mb-6" style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2);">
      <h4 class="font-semibold text-blue-300 mb-3 flex items-center space-x-2">
        <i class="fas fa-info-circle text-blue-400"></i>
        <span>Processus commande MAASGA</span>
      </h4>
      <div class="flex flex-wrap gap-2 items-center text-sm text-blue-300">
        {[
          "1. Demande RDV",
          "?",
          "2. Visite terrain",
          "?",
          "3. Validation",
          "?",
          "4. Création commande",
          "?",
          "5. Sélection produit",
          "?",
          "6. Installation"
        ].map((step, i) => (
          step === "?" ? <i class="fas fa-arrow-right text-blue-500/50 text-xs"></i> :
          <span class="px-3 py-1.5 rounded-lg font-medium text-xs" style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.2); color:#93c5fd;">{step}</span>
        ))}
      </div>
    </div>

    {/* SECTION 1: RDV En attente de validation terrain */}
    <div class="rounded-2xl card-shadow overflow-hidden mb-6" style="background:rgba(234,179,8,0.06); border:2px solid rgba(234,179,8,0.25);">
      <div class="p-5 flex items-center justify-between" style="border-bottom:1px solid rgba(234,179,8,0.15);">
        <div>
          <h3 class="font-bold text-white flex items-center space-x-2">
            <i class="fas fa-map text-yellow-500"></i>
            <span>Validation terrain - RDV en attente</span>
          </h3>
          <p class="text-xs text-gray-400 mt-0.5">Visitez le client et validez pour créer la commande</p>
        </div>
        <span class="text-lg font-bold text-yellow-400 px-3 py-1 rounded-lg" style="background:rgba(234,179,8,0.12);">{appointments.filter(a => a.status === 'pending').length}</span>
      </div>
      {appointments.filter(a => a.status === 'pending').length > 0 ? (
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead style="background:rgba(234,179,8,0.08);">
              <tr>
                {["Client", "Téléphone", "Quartier", "Date RDV", "Type", "Localisation", "Action"].map(h => (
                  <th class="text-left py-3 px-4 text-xs font-semibold text-yellow-400/80 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/30">
              {appointments.filter(a => a.status === 'pending').map(a => (
                <tr class="hover:bg-yellow-900/10 transition-colors">
                  <td class="py-3 px-4 font-semibold text-gray-200">{a.name}</td>
                  <td class="py-3 px-4 text-xs text-gray-400">{a.phone}</td>
                  <td class="py-3 px-4 text-xs text-gray-400"><i class="fas fa-map-marker-alt text-primary-500 mr-1"></i>{a.quartier}</td>
                  <td class="py-3 px-4 text-xs text-gray-400">{a.date}</td>
                  <td class="py-3 px-4">
                    <span class={`text-xs px-2 py-1 rounded-full font-medium ${a.type === 'devis' ? '' : ''}`} style={a.type === 'devis' ? 'background:rgba(59,130,246,0.15); color:#60a5fa;' : 'background:rgba(16,185,129,0.15); color:#34d399;'}>
                      {a.type === 'devis' ? 'Devis' : 'Installation'}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    {a.latitude && a.longitude ? (
                      <span class="text-xs text-green-400 font-medium"><i class="fas fa-check-circle text-green-400 mr-1"></i>Localisé</span>
                    ) : (
                      <span class="text-xs text-gray-500">·</span>
                    )}
                  </td>
                  <td class="py-3 px-4">
                    <button onclick={`clickClientRow(${a.id})`} class="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap">
                      <i class="fas fa-eye mr-1"></i>Voir détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div class="p-8 text-center" style="background:rgba(15,23,42,0.4);">
          <i class="fas fa-check-circle text-3xl text-green-400 mb-3"></i>
          <p class="text-gray-400 font-medium">Aucun RDV en attente de validation</p>
        </div>
      )}
    </div>

    {/* SECTION 2: Commandes créées */}
    <div class="rounded-2xl  card-shadow overflow-hidden" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
      <div class="p-5 flex items-center justify-between" style="border-bottom:1px solid rgba(148,180,220,0.08);">
        <div>
          <h3 class="font-semibold text-gray-200 flex items-center space-x-2">
            <i class="fas fa-shopping-cart text-primary-500"></i>
            <span>Commandes actives</span>
          </h3>
          <p class="text-xs text-gray-500 mt-0.5">Commandes créées depuis la validation terrain</p>
        </div>
        <span class="text-sm font-bold px-3 py-1 rounded-lg" style="color:#38bdf8; background:rgba(56,189,248,0.1);">{orders.length} commandes</span>
      </div>
      {orders.length > 0 ? (
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="" style="background:#0e1726;">
              <tr>
                {["#ID", "Client", "Type", "Quartier", "Statut", "Créée le", "Actions"].map(h => (
                  <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/30">
              {orders.map(o => (
                <tr class="hover:bg-cyan-900/10 transition-colors">
                  <td class="py-3 px-4 text-xs text-gray-500 font-mono font-bold">#CMD-{String(o.id).padStart(4, '0')}</td>
                  <td class="py-3 px-4">
                    <div class="font-semibold text-gray-200 text-sm">{o.client_name}</div>
                    <div class="text-xs text-gray-500">{o.client_phone}</div>
                  </td>
                  <td class="py-3 px-4">
                    <span class={`text-xs px-2 py-1 rounded-full font-medium ${o.type === 'devis' ? '' : ''}`} style={o.type === 'devis' ? 'background:rgba(59,130,246,0.15); color:#60a5fa;' : 'background:rgba(16,185,129,0.15); color:#34d399;'}>
                      {o.type === 'devis' ? 'Devis' : 'Installation'}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-xs text-gray-400"><i class="fas fa-map-marker-alt text-primary-500 mr-1"></i>{o.quartier}</td>
                  <td class="py-3 px-4">
                    <span class={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      o.status === 'validated' ? '' :
                      o.status === 'installed' ? '' :
                      ''
                    }`} style={o.status === 'validated' ? 'background:rgba(16,185,129,0.15); color:#34d399;' : o.status === 'installed' ? 'background:rgba(59,130,246,0.15); color:#60a5fa;' : 'background:rgba(148,163,184,0.1); color:#94a3b8;'}>
                      {o.status === 'validated' ? '? Validée' : o.status === 'installed' ? '?? Installée' : o.status}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                  <td class="py-3 px-4 flex gap-2">
                    <a href={`/api/devis/${o.appointment_id}`} target="_blank" class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap" style="background:rgba(239,68,68,0.12); color:#f87171;">
                      <i class="fas fa-file-pdf mr-1"></i>Devis
                    </a>
                    <div class="flex items-center gap-2">
                      <select name={`status-${o.id}`} onchange={`updateOrderStatus(${o.id}, this.value)`} class="text-xs border px-2 py-1.5 rounded-lg font-medium cursor-pointer" style="background:rgba(59,130,246,0.1); border-color:rgba(59,130,246,0.25); color:#60a5fa;">
                        <option value="validation_terrain" selected={o.status === 'validation_terrain'}>Validation terrain</option>
                        <option value="validated" selected={o.status === 'validated'}>Validée</option>
                        <option value="installed" selected={o.status === 'installed'}>Installée</option>
                        <option value="cancelled" selected={o.status === 'cancelled'}>Annulée</option>
                      </select>
                    </div>
                    <form method="post" action="/api/admin/commande/delete" style="display:inline" onsubmit="return confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')">
                      <input type="hidden" name="id" value={String(o.id)} />
                      <button type="submit" class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap" style="background:rgba(239,68,68,0.15); color:#f87171;">
                        <i class="fas fa-trash mr-1"></i>Supprimer
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div class="p-12 text-center">
          <i class="fas fa-inbox text-3xl text-gray-300 mb-3"></i>
          <p class="text-gray-400">Aucune commande pour le moment</p>
          <p class="text-xs text-gray-500 mt-2">Les commandes apparaîtront ici dès qu'un RDV sera validé</p>
        </div>
      )}
    </div>

    {/* Statistiques rapides */}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {[
        { label: "RDV en attente", val: appointments.filter(a => a.status === 'pending').length, icon: "fa-hourglass-half", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.2)", iconColor: "text-yellow-400" },
        { label: "RDV en cours", val: appointments.filter(a => a.status === 'confirmed').length, icon: "fa-tools", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)", iconColor: "text-blue-400" },
        { label: "Installations faites", val: appointments.filter(a => a.status === 'done').length, icon: "fa-check-circle", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", iconColor: "text-green-400" },
        { label: "Commandes totales", val: orders.length, icon: "fa-shopping-bag", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.2)", iconColor: "text-purple-400" }
      ].map(s => (
        <div class="rounded-xl p-4 text-center card-shadow" style={`background:${s.bg}; border:1px solid ${s.border};`}>
          <i class={`fas ${s.icon} ${s.iconColor} text-xl mb-2`}></i>
          <div class="text-xl font-bold text-white">{typeof s.val === 'number' ? s.val : s.val}</div>
          <div class="text-xs text-gray-400 mt-1">{s.label}</div>
        </div>
      ))}
    </div>

    {/* MODAL DÉTAILS CLIENT - COMMANDES */}
    <div id="client-detail-modal-cmd" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="rounded-2xl  w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        {/* Header */}
        <div class="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between rounded-t-2xl">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
              <i class="fas fa-user text-lg"></i>
            </div>
            <div>
              <h2 id="cmd-client-name" class="text-2xl font-bold"></h2>
              <p id="cmd-client-phone" class="text-sm text-blue-100"></p>
            </div>
          </div>
          <button onclick="closeClientModalCmd()" class="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Contenu */}
        <div class="p-6 space-y-6">
          {/* Infos principales */}
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="rounded-xl p-4" style="background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.2);">
              <div class="text-xs text-gray-400 uppercase font-semibold">Quartier</div>
              <div id="cmd-client-quartier" class="text-lg font-bold text-white mt-1"></div>
            </div>
            <div class="rounded-xl p-4" style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2);">
              <div class="text-xs text-gray-400 uppercase font-semibold">Date RDV</div>
              <div id="cmd-client-date" class="text-lg font-bold text-white mt-1"></div>
            </div>
            <div class="rounded-xl p-4" style="background:rgba(249,115,22,0.1); border:1px solid rgba(249,115,22,0.2);">
              <div class="text-xs text-gray-400 uppercase font-semibold">Type</div>
              <div id="cmd-client-type" class="text-lg font-bold text-white mt-1"></div>
            </div>
          </div>

          {/* Carte Google Maps */}
          <div class="rounded-xl overflow-hidden" style="height: 300px; background:#0e1726; border:1px solid rgba(148,180,220,0.1);">
            <iframe id="cmd-client-map-iframe" width="100%" height="100%" style="border:0" loading="lazy"></iframe>
          </div>

          {/* Coordonnées */}
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs text-gray-400 uppercase font-semibold">Latitude</label>
              <div id="cmd-client-latitude" class="font-mono text-sm text-gray-300 p-2 rounded mt-1" style="background:rgba(15,23,42,0.5);"></div>
            </div>
            <div>
              <label class="text-xs text-gray-400 uppercase font-semibold">Longitude</label>
              <div id="cmd-client-longitude" class="font-mono text-sm text-gray-300 p-2 rounded mt-1" style="background:rgba(15,23,42,0.5);"></div>
            </div>
          </div>

          {/* Adresse précise */}
          <div>
            <label class="text-xs text-gray-400 uppercase font-semibold">Adresse précise</label>
            <div id="cmd-client-address" class="text-sm text-gray-300 p-3 rounded mt-1" style="background:rgba(15,23,42,0.5);"></div>
          </div>

          {/* Notes complémentaires */}
          <div id="cmd-client-notes-container" class="hidden">
            <label class="text-xs text-gray-400 uppercase font-semibold">Notes</label>
            <div id="cmd-client-notes" class="text-sm text-gray-300 p-3 rounded mt-1" style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2);"></div>
          </div>

          {/* Statut RDV */}
          <div class="rounded-xl p-4" style="background:rgba(168,85,247,0.08); border:1px solid rgba(168,85,247,0.2);">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-gray-400 uppercase font-semibold">Statut RDV</div>
                <div id="cmd-client-status" class="text-lg font-bold text-white mt-1"></div>
              </div>
              <div id="cmd-client-status-icon" class="text-3xl"></div>
            </div>
          </div>

          {/* Actionner la commande */}
          <div id="cmd-order-action-container" class="rounded-xl p-6" style="background:rgba(16,185,129,0.08); border:2px solid rgba(16,185,129,0.25);">
            <h3 class="font-semibold text-gray-200 flex items-center space-x-2 mb-3">
              <i class="fas fa-check-circle text-green-400 text-lg"></i>
              <span>Validation terrain</span>
            </h3>
            <p class="text-sm text-gray-400 mb-4">Marquer la visite comme terminée et initier le processus de commande</p>
            <button onclick="validateVisitCmd()" class="w-full font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 mb-3" style="background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.35); color:#60a5fa;">
              <i class="fas fa-eye"></i>
              <span>Valider la visite (sans commande)</span>
            </button>
            <button onclick="validateTerrainCmd()" class="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2">
              <i class="fas fa-check"></i>
              <span>Validation terrain terminée - Créer la commande</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <script dangerouslySetInnerHTML={{ __html: `
      // Données des rendez-vous pour la page Commandes
      const appointmentsDataCmd = ${JSON.stringify(appointments)};
      let currentAppointmentCmd = null;

      function clickClientRow(appointmentId) {
        const appointment = appointmentsDataCmd.find(a => a.id === appointmentId);
        if (!appointment) {
          console.error('RDV non trouvé:', appointmentId);
          return;
        }
        currentAppointmentCmd = appointment;
        
        document.getElementById('cmd-client-name').textContent = appointment.name;
        document.getElementById('cmd-client-phone').textContent = appointment.phone;
        document.getElementById('cmd-client-quartier').textContent = appointment.quartier;
        document.getElementById('cmd-client-date').textContent = appointment.date;
        document.getElementById('cmd-client-type').textContent = appointment.type === 'devis' ? 'Demande de devis' : 'Installation';
        
        // Statut avec emoji
        const statusMap = {
          'pending': { text: 'En attente de confirmation', emoji: '×' },
          'confirmed': { text: '? Confirmé - En cours', emoji: '×' },
          'done': { text: '?? Installé - Terminé', emoji: '✔' }
        };
        const status = statusMap[appointment.status] || { text: appointment.status, emoji: '✔' };
        document.getElementById('cmd-client-status').textContent = status.text;
        document.getElementById('cmd-client-status-icon').textContent = status.emoji;
        
        // Géolocalisation - Carte Google Maps
        if (appointment.latitude && appointment.longitude) {
          const lat = appointment.latitude;
          const lng = appointment.longitude;
          const mapSrc = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3955.2640370741093!2d' + lng + '!3d' + lat + '!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sfr!2sbf!4v1635345345';
          document.getElementById('cmd-client-map-iframe').src = mapSrc;
          document.getElementById('cmd-client-latitude').textContent = lat.toFixed(6);
          document.getElementById('cmd-client-longitude').textContent = lng.toFixed(6);
        } else {
          document.getElementById('cmd-client-map-iframe').src = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3955.2640370741093!2d-1.5209262!3d12.365069!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1sOuagadougou!2sBurkina%20Faso!5e0!3m2!1sfr!2sfr!4v1635345345';
          document.getElementById('cmd-client-latitude').textContent = 'Non défini';
          document.getElementById('cmd-client-longitude').textContent = 'Non défini';
        }
        
        // Adresse précise
        if (appointment.adresse_precise) {
          document.getElementById('cmd-client-address').textContent = appointment.adresse_precise;
        } else {
          document.getElementById('cmd-client-address').textContent = '' + (appointment.quartier || 'Position non enregistrée');
        }
        
        // Notes
        if (appointment.notes) {
          document.getElementById('cmd-client-notes-container').classList.remove('hidden');
          document.getElementById('cmd-client-notes').textContent = appointment.notes;
        } else {
          document.getElementById('cmd-client-notes-container').classList.add('hidden');
        }
        
        // Afficher/masquer le bouton de validation terrain selon le statut
        const orderActionContainer = document.getElementById('cmd-order-action-container');
        if (appointment.status === 'confirmed' || appointment.status === 'done') {
          orderActionContainer.classList.add('hidden');
        } else {
          orderActionContainer.classList.remove('hidden');
        }
        
        document.getElementById('client-detail-modal-cmd').classList.remove('hidden');
      }

      function closeClientModalCmd() {
        document.getElementById('client-detail-modal-cmd').classList.add('hidden');
        currentAppointmentCmd = null;
      }

      function validateTerrainCmd() {
        if (!currentAppointmentCmd) return;
        
        fetch('/api/admin/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointment_id: currentAppointmentCmd.id,
            client_name: currentAppointmentCmd.name,
            client_phone: currentAppointmentCmd.phone,
            quartier: currentAppointmentCmd.quartier,
            type: currentAppointmentCmd.type
          })
        })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            showToast('Commande créée avec succès ! Le statut du RDV passe à "Confirmé"', 'success');
            closeClientModalCmd();
            window.location.reload();
          } else {
            showToast('Erreur: ' + (data.error || 'Impossible de créer la commande'), 'error');
          }
        })
        .catch(e => showToast('Erreur: ' + e.message, 'error'));
      }

      function validateVisitCmd() {
        if (!currentAppointmentCmd) return;
        if (!confirm('Confirmer la visite sans créer de commande ? Le RDV sera marqué comme effectué.')) return;

        fetch('/api/admin/rdv/validate-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointment_id: currentAppointmentCmd.id })
        })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            showToast('Visite validée ! Le RDV est maintenant marqué comme effectué.', 'success');
            closeClientModalCmd();
            window.location.reload();
          } else {
            showToast('Erreur: ' + (data.error || 'Impossible de valider la visite'), 'error');
          }
        })
        .catch(e => showToast('Erreur: ' + e.message, 'error'));
      }

      // Fermer la modal en cliquant dehors
      document.getElementById('client-detail-modal-cmd').addEventListener('click', function(e) {
        if (e.target === this) closeClientModalCmd();
      });

      // Fonction pour mettre · jour le statut d'une commande
      function updateOrderStatus(orderId, newStatus) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/api/admin/commande/update-statut';
        
        const idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'id';
        idInput.value = String(orderId);
        
        const statusInput = document.createElement('input');
        statusInput.type = 'hidden';
        statusInput.name = 'status';
        statusInput.value = newStatus;
        
        form.appendChild(idInput);
        form.appendChild(statusInput);
        document.body.appendChild(form);
        form.submit();
      }
    `}} />
  </AdminLayout>
  )
}

// ============================================================
// PAGE AVIS
// ============================================================

export const AdminAvisPage = ({ success, deleted }: { success?: string; deleted?: string } = {}) => (
  <AdminLayout activePage="avis">
    {(success || deleted) && (
      <div class={`mb-6 rounded-xl p-4 flex items-center space-x-2 border`} style={success ? 'background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.3);' : 'background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.3);'}>
        <i class={`fas ${success ? 'fa-check-circle text-green-400' : 'fa-trash text-red-400'}`}></i>
        <span class={`font-medium text-sm ${success ? 'text-green-300' : 'text-red-300'}`}>
          {success ? 'Avis approuvé et publié.' : 'Avis supprimé.'}
        </span>
      </div>
    )}

    <div class="mb-6">
      <h2 class="text-xl font-bold text-white">Modération des avis</h2>
      <p class="text-sm text-gray-400 mt-1">
        {reviews.filter(r => !r.approved).length} en attente · {reviews.filter(r => r.approved).length} publiés
      </p>
    </div>

    {/* En attente de modération */}
    {reviews.filter(r => !r.approved).length > 0 && (
      <div class="mb-8">
        <h3 class="font-semibold text-gray-200 mb-4 flex items-center space-x-2">
          <span class="w-2 h-2 bg-orange-400 rounded-full"></span>
          <span>En attente de modération ({reviews.filter(r => !r.approved).length})</span>
        </h3>
        <div class="space-y-4">
          {reviews.filter(r => !r.approved).map(r => (
            <div class="rounded-2xl  p-5 card-shadow border-l-4 border-orange-400" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
              <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-2">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center" style="background:rgba(249,115,22,0.15);">
                      <span class="text-orange-400 font-bold text-sm">{r.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div class="font-semibold text-gray-200 text-sm">{r.name}</div>
                      <div class="text-xs text-gray-400">{r.date} · {r.service}</div>
                    </div>
                    <div class="flex space-x-0.5 ml-2">
                      {[1,2,3,4,5].map(s => (
                        <i class={`fas fa-star text-sm ${s <= r.note ? 'text-yellow-400' : 'text-gray-200'}`}></i>
                      ))}
                    </div>
                  </div>
                  <p class="text-sm text-gray-400 leading-relaxed italic">"{r.comment}"</p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <form method="post" action="/api/admin/avis/approve">
                    <input type="hidden" name="id" value={String(r.id)} />
                    <button type="submit" class="text-xs px-4 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(16,185,129,0.15); color:#34d399;">
                      <i class="fas fa-check mr-1"></i>Approuver
                    </button>
                  </form>
                  <form method="post" action="/api/admin/avis/reject">
                    <input type="hidden" name="id" value={String(r.id)} />
                    <button type="submit" class="text-xs px-4 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(239,68,68,0.15); color:#f87171;"
                      onclick="return confirm('Supprimer définitivement cet avis ?')">
                      <i class="fas fa-trash mr-1"></i>Rejeter
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Avis approuvés */}
    <div>
      <h3 class="font-semibold text-gray-200 mb-4 flex items-center space-x-2">
        <span class="w-2 h-2 bg-green-400 rounded-full"></span>
        <span>Avis publiés ({reviews.filter(r => r.approved).length})</span>
      </h3>
      {reviews.filter(r => r.approved).length === 0 ? (
        <div class="rounded-2xl  p-10 text-center card-shadow text-gray-400" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
          <i class="fas fa-star text-3xl mb-3"></i>
          <p>Aucun avis publié pour le moment</p>
        </div>
      ) : (
        <div class="rounded-2xl  card-shadow overflow-hidden" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="border-b border-gray-700/50" style="background:#0e1726;">
                <tr>
                  {["Client", "Note", "Commentaire", "Service", "Date", "Actions"].map(h => (
                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-700/30">
                {reviews.filter(r => r.approved).map(r => (
                  <tr class="hover:bg-cyan-900/10 transition-colors">
                    <td class="py-3 px-4 font-semibold text-gray-200 text-sm">{r.name}</td>
                    <td class="py-3 px-4">
                      <div class="flex space-x-0.5">
                        {[1,2,3,4,5].map(s => (
                          <i class={`fas fa-star text-xs ${s <= r.note ? 'text-yellow-400' : 'text-gray-200'}`}></i>
                        ))}
                      </div>
                    </td>
                    <td class="py-3 px-4 text-xs text-gray-400 max-w-xs truncate italic">"{r.comment}"</td>
                    <td class="py-3 px-4 text-xs text-gray-500">{r.service}</td>
                    <td class="py-3 px-4 text-xs text-gray-400">{r.date}</td>
                    <td class="py-3 px-4">
                      <form method="post" action="/api/admin/avis/reject">
                        <input type="hidden" name="id" value={String(r.id)} />
                        <button type="submit" class="text-xs text-red-500 hover:text-red-700 font-medium"
                          onclick="return confirm('Retirer cet avis ?')">
                          <i class="fas fa-trash"></i>
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </AdminLayout>
)
// ============================================================
// PAGE PARAMÈTRES
// ============================================================

export const AdminParametresPage = ({ success, error }: { success?: string; error?: string } = {}) => (
  <AdminLayout activePage="parametres">
    <div class="mb-6">
      <h2 class="text-xl font-bold text-white">Paramètres du site</h2>
      <p class="text-sm text-gray-400 mt-1">Configuration, sécurité et gestion du back-office</p>
    </div>

    {success && (
      <div class="mb-6 rounded-xl p-4 flex items-center space-x-3" style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3);">
        <i class="fas fa-check-circle text-green-400 text-lg"></i>
        <span class="text-green-300 font-medium text-sm">
          {success === 'pwd' ? 'Mot de passe mis à jour avec succès.' : 'Opération réussie.'}
        </span>
      </div>
    )}
    {error && (
      <div class="mb-6 rounded-xl p-4 flex items-center space-x-3" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3);">
        <i class="fas fa-exclamation-circle text-red-400 text-lg"></i>
        <span class="text-red-300 font-medium text-sm">
          {error === 'wrong_current' ? 'Mot de passe actuel incorrect.' :
           error === 'mismatch' ? 'Les mots de passe ne correspondent pas.' :
           error === 'too_short' ? 'Le mot de passe doit faire au moins 8 caractères.' :
           error === 'username_short' ? "Le nom d'utilisateur doit faire au moins 3 caractères." :
           'Une erreur est survenue.'}
        </span>
      </div>
    )}

    <div class="max-w-2xl space-y-6">

      {/* Changer mot de passe */}
      <div class="rounded-2xl p-6 card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <div class="flex items-center space-x-3 mb-5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(59,130,246,0.15);">
            <i class="fas fa-lock text-blue-400"></i>
          </div>
          <div>
            <h3 class="font-bold text-white">Sécurité — Mot de passe admin</h3>
            <p class="text-xs text-gray-400">Modifiez le mot de passe de connexion au back-office</p>
          </div>
        </div>
        <form method="post" action="/api/admin/change-password" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Mot de passe actuel *</label>
            <input type="password" name="current_password" required placeholder="Votre mot de passe actuel" class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Nouvel identifiant <span class="text-gray-500">(optionnel, laisser vide pour garder l'actuel)</span></label>
            <input type="text" name="new_username" placeholder="admin" minlength={3} class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Nouveau mot de passe *</label>
            <input type="password" name="new_password" required placeholder="Minimum 8 caractères" minlength={8} class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Confirmer le nouveau mot de passe *</label>
            <input type="password" name="confirm_password" required placeholder="Répéter le nouveau mot de passe" class="input-field text-sm" />
          </div>
          <button type="submit" class="btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center space-x-2">
            <i class="fas fa-save"></i>
            <span>Mettre à jour le mot de passe</span>
          </button>
        </form>
      </div>

      {/* Informations site */}
      <div class="rounded-2xl p-6 card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <div class="flex items-center space-x-3 mb-5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(16,185,129,0.15);">
            <i class="fas fa-store text-green-400"></i>
          </div>
          <div>
            <h3 class="font-bold text-white">Informations MAASGA</h3>
            <p class="text-xs text-gray-400">Données de contact et horaires affichés sur le site</p>
          </div>
        </div>
        <div class="space-y-3">
          {[
            { icon: "fa-phone", label: "Téléphone", val: "+226 55 99 64 18", color: "text-cyan-400" },
            { icon: "fa-map-marker-alt", label: "Localisation", val: "Ouagadougou, Burkina Faso", color: "text-red-400" },
            { icon: "fa-clock", label: "Horaires", val: "Lundi–Dimanche · 8h00–18h00", color: "text-yellow-400" },
            { icon: "fa-envelope", label: "Email", val: "contact@maasga.com", color: "text-blue-400" },
          ].map(info => (
            <div class="flex items-center space-x-4 p-3 rounded-xl" style="background:rgba(255,255,255,0.03); border:1px solid rgba(148,180,220,0.08);">
              <i class={`fas ${info.icon} ${info.color} w-5 text-center`}></i>
              <div>
                <div class="text-xs text-gray-500 font-medium">{info.label}</div>
                <div class="text-sm text-gray-200 font-semibold">{info.val}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistiques globales */}
      <div class="rounded-2xl p-6 card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <div class="flex items-center space-x-3 mb-5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(168,85,247,0.15);">
            <i class="fas fa-database text-purple-400"></i>
          </div>
          <div>
            <h3 class="font-bold text-white">État de la base de données</h3>
            <p class="text-xs text-gray-400">Récapitulatif des données enregistrées</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          {[
            { label: "Produits", val: products.length, icon: "fa-boxes", color: "#38bdf8" },
            { label: "Clients", val: clients.length, icon: "fa-users", color: "#34d399" },
            { label: "Rendez-vous", val: appointments.length, icon: "fa-calendar-alt", color: "#fbbf24" },
            { label: "Avis", val: reviews.length, icon: "fa-star", color: "#f87171" },
          ].map(s => (
            <div class="flex items-center space-x-3 p-3 rounded-xl" style="background:rgba(255,255,255,0.03); border:1px solid rgba(148,180,220,0.08);">
              <i class={`fas ${s.icon} text-base`} style={`color:${s.color};`}></i>
              <div>
                <div class="text-lg font-bold text-white leading-none">{s.val}</div>
                <div class="text-xs text-gray-400">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone dangereuse */}
      <div class="rounded-2xl p-6 card-shadow" style="background:rgba(239,68,68,0.05); border:1px solid rgba(239,68,68,0.2);">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(239,68,68,0.15);">
            <i class="fas fa-exclamation-triangle text-red-400"></i>
          </div>
          <div>
            <h3 class="font-bold text-red-400">Zone dangereuse</h3>
            <p class="text-xs text-gray-400">Actions irréversibles — À utiliser avec précaution</p>
          </div>
        </div>
        <div class="space-y-3">
          <div class="p-4 rounded-xl" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.15);">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-semibold text-red-300 text-sm">Réinitialiser les données de démo</div>
                <div class="text-xs text-gray-400 mt-0.5">Supprime tous les RDV, clients et avis de test</div>
              </div>
              <button onclick="confirmReset()" class="text-xs px-4 py-2 rounded-xl font-semibold" style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3);">
                <i class="fas fa-trash mr-1"></i>Réinitialiser
              </button>
            </div>
          </div>
          <div class="p-4 rounded-xl" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.15);">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-semibold text-red-300 text-sm">Déconnexion forcée</div>
                <div class="text-xs text-gray-400 mt-0.5">Invalider la session admin en cours</div>
              </div>
              <a href="/api/admin/logout" class="text-xs px-4 py-2 rounded-xl font-semibold" style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3);">
                <i class="fas fa-sign-out-alt mr-1"></i>Déconnecter
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>

    <script dangerouslySetInnerHTML={{ __html: `
      function confirmReset() {
        if (confirm('ATTENTION : Cette action va supprimer toutes les données de démonstration.\\nVoulez-vous continuer ?')) {
          if (confirm('Dernière confirmation : Supprimer définitivement les données de démo ?')) {
            window.location.href = '/api/admin/reset-demo';
          }
        }
      }
    ` }} />
  </AdminLayout>
)

// ============================================================
// ADMIN DEVIS LIST PAGE
// ============================================================
export const AdminDevisListPage = ({ devisData = [] }: { devisData: any[] }) => (
  <AdminLayout activePage="devis">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-white">Devis clients</h2>
        <p class="text-sm text-gray-500 mt-1">
          {devisData.length} devis · {devisData.filter((d:any) => d.status === 'sent').length} en attente · {devisData.filter((d:any) => d.status === 'accepted').length} acceptés
        </p>
      </div>
      <a href="/admin/devis/new" class="btn-primary font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 text-xs shadow-md">
        <i class="fas fa-plus"></i>
        <span>Nouveau devis</span>
      </a>
    </div>

    {devisData.length === 0 ? (
      <div class="rounded-2xl p-16 text-center card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <i class="fas fa-file-invoice-dollar text-5xl text-gray-700 mb-4"></i>
        <p class="text-gray-400 mb-2 font-semibold">Aucun devis créé</p>
        <p class="text-gray-600 text-sm mb-6">Créez un devis depuis la page Rendez-vous après une visite technique</p>
        <a href="/admin/rdv" class="text-xs px-5 py-2.5 rounded-xl font-semibold" style="background:rgba(56,189,248,0.1); color:#38bdf8; border:1px solid rgba(56,189,248,0.2);">
          <i class="fas fa-calendar-alt mr-2"></i>Voir les rendez-vous
        </a>
      </div>
    ) : (
      <div class="space-y-3">
        {devisData.map((d: any) => {
          const daysLeft = Math.max(0, Math.floor((new Date(d.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          const isExpired = d.status !== 'accepted' && d.status !== 'refused' && d.expires_at && new Date(d.expires_at) < new Date()
          const effectiveStatus = isExpired ? 'expired' : d.status
          const statusLabel: Record<string,string> = { draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté ✓', refused: 'Refusé', expired: 'Expiré' }
          const statusStyle: Record<string,string> = {
            draft: 'background:rgba(148,180,220,0.12); color:#94a3b8; border:1px solid rgba(148,180,220,0.2);',
            sent: 'background:rgba(251,191,36,0.12); color:#fbbf24; border:1px solid rgba(251,191,36,0.25);',
            accepted: 'background:rgba(52,211,153,0.12); color:#34d399; border:1px solid rgba(52,211,153,0.25);',
            refused: 'background:rgba(248,113,113,0.12); color:#f87171; border:1px solid rgba(248,113,113,0.25);',
            expired: 'background:rgba(107,114,128,0.12); color:#6b7280; border:1px solid rgba(107,114,128,0.2);'
          }
          return (
            <div class="rounded-2xl p-5 card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-start space-x-4">
                  <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(239,68,68,0.1);">
                    <i class="fas fa-file-invoice-dollar text-red-400 text-lg"></i>
                  </div>
                  <div>
                    <div class="flex items-center flex-wrap gap-2 mb-1">
                      <span class="font-bold text-white">{d.numero}</span>
                      <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={statusStyle[effectiveStatus] || statusStyle.draft}>{statusLabel[effectiveStatus] || effectiveStatus}</span>
                    </div>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span><i class="fas fa-user mr-1.5 text-gray-400"></i>{d.client_name}</span>
                      <span><i class="fas fa-phone mr-1.5 text-gray-400"></i>{d.client_phone}</span>
                      {d.produit_nom && <span><i class="fas fa-box mr-1.5 text-gray-400"></i>{d.produit_nom}</span>}
                      {d.total_ht > 0 && <span style="color:#38bdf8;" class="font-semibold"><i class="fas fa-money-bill-wave mr-1.5"></i>{Number(d.total_ht).toLocaleString('fr-FR')} FCFA</span>}
                    </div>
                    <div class="mt-1 flex flex-wrap gap-x-3 text-xs">
                      {d.status === 'sent' && !isExpired && <span style="color:#fbbf24;"><i class="fas fa-hourglass-half mr-1"></i>{daysLeft} jour{daysLeft > 1 ? 's' : ''} avant expiration</span>}
                      {isExpired && <span style="color:#f87171;"><i class="fas fa-exclamation-triangle mr-1"></i>Devis expiré</span>}
                      {d.accepted_at && <span style="color:#34d399;"><i class="fas fa-check-circle mr-1"></i>Accepté le {new Date(d.accepted_at).toLocaleDateString('fr-FR')}</span>}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <a href={`/devis/${d.token}`} target="_blank"
                    class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(56,189,248,0.12); color:#38bdf8; border:1px solid rgba(56,189,248,0.2);">
                    <i class="fas fa-eye mr-1"></i>Voir
                  </a>
                  <a href={`https://wa.me/${(d.client_phone || '').replace(/\D/g,'')}?text=${encodeURIComponent('Bonjour ' + d.client_name + ', votre devis MAASGA ' + d.numero + ' est disponible : https://maasga-website.pages.dev/devis/' + d.token)}`} target="_blank"
                    class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(37,211,102,0.12); color:#25D366; border:1px solid rgba(37,211,102,0.2);">
                    <i class="fab fa-whatsapp mr-1"></i>WA
                  </a>
                  {(d.status === 'draft' || d.status === 'sent') && (
                    <form method="post" action="/api/admin/devis/accept" style="display:inline">
                      <input type="hidden" name="id" value={String(d.id)} />
                      <button type="submit" class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(52,211,153,0.12); color:#34d399; border:1px solid rgba(52,211,153,0.2);">
                        <i class="fas fa-check mr-1"></i>Accepté
                      </button>
                    </form>
                  )}
                  <form method="post" action="/api/admin/devis/delete" style="display:inline" onsubmit="return confirm('Supprimer ce devis définitivement ?')">
                    <input type="hidden" name="id" value={String(d.id)} />
                    <button type="submit" class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2);">
                      <i class="fas fa-trash"></i>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )}
  </AdminLayout>
)

// ============================================================
// ADMIN DEVIS NEW/CREATE PAGE
// ============================================================
export const AdminDevisNewPage = ({ rdv, productsList = [], surface = '', btu = '', error }: { rdv?: any; productsList?: any[]; surface?: string; btu?: string; error?: string }) => (
  <AdminLayout activePage="devis">
    <div class="flex items-center space-x-3 mb-6">
      <a href="/admin/devis" class="text-gray-400 hover:text-white transition-colors p-1">
        <i class="fas fa-arrow-left"></i>
      </a>
      <div>
        <h2 class="text-xl font-bold text-white">Créer un devis</h2>
        <p class="text-sm text-gray-500 mt-0.5">{rdv ? `D'après le RDV de ${rdv.name} — ${rdv.quartier}` : 'Nouveau devis manuel'}</p>
      </div>
    </div>

    {error && (
      <div class="mb-6 rounded-xl p-4 flex items-center space-x-3" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3);">
        <i class="fas fa-exclamation-circle text-red-400"></i>
        <span class="text-red-300 text-sm">{error}</span>
      </div>
    )}

    <form method="post" action="/api/admin/devis/create" class="space-y-6 max-w-3xl">
      {rdv && <input type="hidden" name="rdv_id" value={String(rdv.id)} />}

      {/* Section client */}
      <div class="rounded-2xl p-6 card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <h3 class="font-bold text-white mb-4 flex items-center space-x-2">
          <i class="fas fa-user text-cyan-400"></i><span>Informations client</span>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Nom complet *</label>
            <input type="text" name="client_name" required placeholder="Nom et prénom" value={rdv ? rdv.name : ''} class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Téléphone *</label>
            <input type="tel" name="client_phone" required placeholder="+226 XX XX XX XX" value={rdv ? rdv.phone : ''} class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
            <input type="email" name="client_email" placeholder="client@email.com" value={rdv?.email || ''} class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Quartier / Zone</label>
            <input type="text" name="client_quartier" placeholder="Ex: Paspanga" value={rdv ? rdv.quartier : ''} class="input-field text-sm" />
          </div>
        </div>
      </div>

      {/* Section technique */}
      <div class="rounded-2xl p-6 card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <h3 class="font-bold text-white mb-4 flex items-center space-x-2">
          <i class="fas fa-ruler-combined text-cyan-400"></i><span>Données techniques</span>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Surface de la pièce (m²)</label>
            <input type="number" name="surface" min="1" max="500" step="0.5" placeholder="Ex: 20" value={surface} class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Puissance recommandée</label>
            <select name="btu_recommande" class="input-field text-sm">
              <option value="">Non défini</option>
              {[9000, 12000, 18000, 24000, 36000].map((b: number) => (
                <option value={String(b)} selected={btu === String(b)}>
                  {b.toLocaleString('fr-FR')} BTU / {b === 9000 ? '1 CV' : b === 12000 ? '1,5 CV' : b === 18000 ? '2 CV' : b === 24000 ? '3 CV' : '5 CV'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section produit & prix */}
      <div class="rounded-2xl p-6 card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <h3 class="font-bold text-white mb-4 flex items-center space-x-2">
          <i class="fas fa-box text-cyan-400"></i><span>Produit & Prestations</span>
        </h3>

        {productsList.length > 0 && (
          <div class="mb-5 rounded-xl p-4" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.15);">
            <label class="block text-xs font-semibold text-cyan-300 mb-2">
              <i class="fas fa-magic mr-1.5"></i>Sélectionner depuis le catalogue (pré-remplit les champs)
            </label>
            <select id="product-selector" onchange="fillProductFromCatalog(this)" class="input-field text-sm">
              <option value="">-- Choisir un produit du catalogue --</option>
              {productsList.map((p: any) => (
                <option value={String(p.id)}
                  data-nom={`${p.brand} ${p.model} – ${p.btu.toLocaleString('fr-FR')} BTU`}
                  data-prix={String(p.price)}
                  data-btu={String(p.btu)}
                  data-install={String(p.price_install || 50000)}>
                  {p.brand} {p.model} · {p.btu.toLocaleString('fr-FR')} BTU · {p.price.toLocaleString('fr-FR')} FCFA
                </option>
              ))}
            </select>
          </div>
        )}

        <div class="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Désignation produit / climatiseur *</label>
            <input type="text" name="produit_nom" id="produit_nom_input" required
              placeholder="Ex: Samsung Wind-Free 12 000 BTU 1,5 CV Inverter" class="input-field text-sm" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Prix unitaire (FCFA) *</label>
            <input type="number" name="produit_prix" id="produit_prix_input" required min="0"
              placeholder="Ex: 375 000" oninput="recalcTotal()" class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Quantité</label>
            <input type="number" name="produit_quantite" id="produit_quantite_input"
              value="1" min="1" max="20" oninput="recalcTotal()" class="input-field text-sm" />
          </div>
        </div>
        <div class="mb-5">
          <label class="block text-xs font-semibold text-gray-400 mb-1.5">Main d'œuvre / Installation (FCFA)</label>
          <input type="number" name="installation_prix" id="installation_prix_input"
            value="50000" min="0" oninput="recalcTotal()" class="input-field text-sm" />
        </div>

        <div class="mb-5">
          <label class="block text-xs font-semibold text-gray-400 mb-2">Accessoires & fournitures supplémentaires <span class="text-gray-600 font-normal">(optionnel)</span></label>
          <div class="space-y-2">
            {[1, 2, 3, 4, 5].map((i: number) => (
              <div class="grid grid-cols-5 gap-2">
                <div class="col-span-3">
                  <input type="text" name={`acc_nom_${i}`}
                    placeholder={i === 1 ? 'Ex: Tuyau cuivre 3m' : i === 2 ? 'Support mural' : i === 3 ? 'Câble électrique' : i === 4 ? 'Fluide R32 recharge' : 'Autre fourniture'}
                    class="input-field text-sm" />
                </div>
                <div class="col-span-2">
                  <input type="number" name={`acc_prix_${i}`}
                    placeholder="Prix FCFA" min="0" oninput="recalcTotal()" class="input-field text-sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 pt-4" style="border-top:1px solid rgba(148,180,220,0.1);">
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Remise (%)</label>
            <input type="number" name="remise" id="remise_input"
              value="0" min="0" max="50" oninput="recalcTotal()" class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Total estimé</label>
            <div id="total-display" class="rounded-xl px-4 py-3 text-right font-bold text-xl"
              style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.2); color:#38bdf8;">
              0 FCFA
            </div>
          </div>
        </div>
      </div>

      {/* Section message & validité */}
      <div class="rounded-2xl p-6 card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <h3 class="font-bold text-white mb-4 flex items-center space-x-2">
          <i class="fas fa-comment-alt text-cyan-400"></i><span>Message & Validité</span>
        </h3>
        <div class="mb-4">
          <label class="block text-xs font-semibold text-gray-400 mb-1.5">Message personnalisé pour le client <span class="text-gray-600 font-normal">(apparaît sur le devis)</span></label>
          <textarea name="message_client" rows={3} class="input-field text-sm resize-none"
            placeholder="Ex: Suite à notre visite technique, voici notre proposition...">
            {rdv ? `Suite à notre visite technique à ${rdv.quartier}, voici notre proposition de devis personnalisée. Ce devis est valable 30 jours. N'hésitez pas à nous contacter pour toute question au +226 55 99 64 18.` : ''}
          </textarea>
        </div>
        <div class="mb-4">
          <label class="block text-xs font-semibold text-gray-400 mb-1.5">Notes internes <span class="text-gray-600 font-normal">(non visibles par le client)</span></label>
          <textarea name="notes_internes" rows={2} placeholder="Observations techniques, contraintes, remarques d'installation..." class="input-field text-sm resize-none"></textarea>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-400 mb-1.5">Date d'expiration du devis</label>
          <input type="date" name="expires_at" id="expires_at_input" required class="input-field text-sm" />
          <p class="text-xs text-gray-600 mt-1"><i class="fas fa-info-circle mr-1"></i>Défaut : 30 jours à partir d'aujourd'hui</p>
        </div>
      </div>

      {/* Boutons submit */}
      <div class="flex flex-col sm:flex-row gap-3">
        <button type="submit" name="action" value="draft"
          class="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all"
          style="background:rgba(56,189,248,0.1); color:#38bdf8; border:1.5px solid rgba(56,189,248,0.3);">
          <i class="fas fa-save"></i>
          <span>Sauvegarder brouillon</span>
        </button>
        <button type="submit" name="action" value="send"
          class="flex-1 btn-primary py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg">
          <i class="fab fa-whatsapp text-green-300"></i>
          <span>Créer et envoyer par WhatsApp</span>
        </button>
      </div>
    </form>

    <script dangerouslySetInnerHTML={{ __html: `
      // Default expiry = today + 30 days
      (function() {
        var el = document.getElementById('expires_at_input');
        if (el && !el.value) {
          var d = new Date(); d.setDate(d.getDate() + 30);
          el.value = d.toISOString().split('T')[0];
        }
      })();

      function fillProductFromCatalog(sel) {
        var opt = sel.options[sel.selectedIndex];
        if (!opt || !opt.value) return;
        var nomEl = document.getElementById('produit_nom_input');
        var prixEl = document.getElementById('produit_prix_input');
        var installEl = document.getElementById('installation_prix_input');
        if (nomEl) nomEl.value = opt.dataset.nom || '';
        if (prixEl) prixEl.value = opt.dataset.prix || '';
        if (installEl && opt.dataset.install) installEl.value = opt.dataset.install;
        recalcTotal();
      }

      function recalcTotal() {
        var prix = parseFloat(document.querySelector('[name=produit_prix]') && document.querySelector('[name=produit_prix]').value) || 0;
        var qty = parseFloat(document.querySelector('[name=produit_quantite]') && document.querySelector('[name=produit_quantite]').value) || 1;
        var install = parseFloat(document.querySelector('[name=installation_prix]') && document.querySelector('[name=installation_prix]').value) || 0;
        var remise = parseFloat(document.querySelector('[name=remise]') && document.querySelector('[name=remise]').value) || 0;
        var accTotal = 0;
        for (var i = 1; i <= 5; i++) {
          var el = document.querySelector('[name=acc_prix_' + i + ']');
          if (el) accTotal += parseFloat(el.value) || 0;
        }
        var subtotal = (prix * qty) + install + accTotal;
        var discount = Math.round(subtotal * remise / 100);
        var total = subtotal - discount;
        var el = document.getElementById('total-display');
        if (el) el.textContent = total.toLocaleString('fr-FR') + ' FCFA';
      }
      recalcTotal();
    `}} />
  </AdminLayout>
)