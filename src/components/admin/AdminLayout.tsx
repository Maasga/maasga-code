// Admin Layout & Security Attributes Escapers
import { maintenanceDueCount, pendingMaintenanceContractsCount, pendingMaintenanceRequestsCount, pendingMaintenanceContracts, notifications } from '../../data/store'
import { SITE_URL } from '../../types'

// HELPERS SÉCURITÉ
// ============================================================

// Sérialise une valeur pour intégration dans un bloc <script>.
// JSON.stringify échappe les guillemets mais PAS `<`, donc un `</script>` présent
// dans une donnée utilisateur fermerait la balise et permettrait l'injection HTML.
// On neutralise aussi U+2028/U+2029, qui sont des fins de ligne pour le parseur JS.
const SCRIPT_UNSAFE_CHARS = /[<>\u2028\u2029]/g
const SCRIPT_CHAR_ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
}
export const jsonForScript = (v: any): string =>
  JSON.stringify(v).replace(SCRIPT_UNSAFE_CHARS, (ch) => SCRIPT_CHAR_ESCAPES[ch])

// Échappe une valeur destinée à un littéral JS entre apostrophes placé dans un
// attribut HTML (onclick="...maFonction('ICI')..."). Le navigateur décode les
// entités HTML AVANT de parser le JS, donc l'échappement HTML de JSX ne protège
// pas le littéral : il faut neutraliser \ ' et les fins de ligne nous-mêmes.
const JS_LITERAL_UNSAFE = /[\\'\r\n\u2028\u2029]/g
const JS_LITERAL_ESCAPES: Record<string, string> = {
  '\\': '\\\\',
  "'": "\\'",
  '\r': '\\r',
  '\n': '\\n',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
}
export const jsAttr = (v: any): string =>
  (v === null || v === undefined ? '' : String(v)).replace(JS_LITERAL_UNSAFE, (ch) => JS_LITERAL_ESCAPES[ch])

// Échappeur HTML côté client, à injecter dans les blocs <script> qui construisent
// du HTML par concaténation. Volontairement autonome (aucune dépendance à l'ordre
// d'exécution des scripts) et préfixé `_` pour ne pas entrer en conflit avec le
// `esc()` du AdminLayout, qui est déclaré après le contenu des pages.
export const CLIENT_ESC_HELPER = `
        function _esc(s) { var d = document.createElement('div'); d.textContent = (s === null || s === undefined) ? '' : String(s); return d.innerHTML; }
`

// ============================================================
// LAYOUT ADMIN
// ============================================================

export const AdminLayout = ({ children, activePage = "" }: { children: any; activePage?: string }) => (
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Admin MAASGA - Back-office</title>
      <link rel="stylesheet" href="/static/tailwind.css" />
      <link rel="stylesheet" href="/static/admin-tokens.css" />
      <link rel="stylesheet" href="/static/style.css" />
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
      <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        .admin-sidebar { background: linear-gradient(180deg, #0f1a2e 0%, #1a3478 100%); }
        .nav-item { transition: all 0.2s; padding: 0.625rem 0.75rem; border-radius: 0.75rem; display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; font-weight: 500; color: #93c5fd; }
        .nav-item:hover { background: rgba(255,255,255,0.12); color: white; }
        .nav-item.active { background: rgba(255,255,255,0.2); color: white; font-weight: 600; }
        .card-shadow { box-shadow: var(--admin-shadow-card); background: var(--admin-card-bg); border: 1px solid var(--admin-border); }
        .input-field { border: 1.5px solid var(--admin-border); transition: all 0.2s; background: var(--admin-card-bg); color: var(--admin-text-primary); border-radius: 0.75rem; padding: 0.625rem 1rem; width: 100%; }
        .input-field:focus { outline: none; border-color: var(--admin-accent); background: var(--admin-card-bg); box-shadow: 0 0 0 3px rgba(3,105,161,0.15); }
        .input-field::placeholder { color: var(--admin-text-muted); }
        .badge-pending { background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); }
        .badge-confirmed { background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid rgba(52,211,153,0.3); }
        .badge-done { background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); }
        .badge-cancelled { background: rgba(248,113,113,0.15); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
        .admin-ui .btn-primary { background: var(--admin-btn-primary-bg); color: white; transition: all 0.2s; box-shadow: 0 4px 12px rgba(3,105,161,0.25); }
        .admin-ui .btn-primary:hover { opacity: 0.92; transform: translateY(-1px); }
        .stat-card { background: var(--admin-card-bg); border-radius: 1rem; padding: 1.25rem; border: 1px solid var(--admin-border); box-shadow: var(--admin-shadow-card); transition: transform 0.2s, box-shadow 0.2s; color: var(--admin-text-primary); }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(3,105,161,0.12); }
        @media (max-width: 768px) { .admin-sidebar { transform: translateX(-100%); position: fixed; transition: transform 0.3s; z-index: 50; } .admin-sidebar.open { transform: translateX(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .fade-in-up { animation: fadeInUp 0.5s ease-out both; }
        .fade-in { animation: fadeIn 0.4s ease-out both; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .hover-lift { transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease; }
        .hover-lift:hover { transform: translateY(-1.5px); box-shadow: 0 4px 10px rgba(3,105,161,0.08), 0 1px 3px rgba(3,105,161,0.04); }
        .admin-table tr { transition: background 0.15s; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }

        /* ===== MOBILE COMPACT OVERRIDES ===== */
        @media (max-width: 639px) {
          /* Prevent any horizontal scroll */
          body, main { max-width: 100vw; overflow-x: hidden; }

          /* Compact table cells */
          table th, table td { padding: 0.35rem 0.35rem !important; font-size: 0.68rem !important; line-height: 1.25 !important; }
          table th { font-size: 0.6rem !important; }

          /* Compact stat cards */
          .stat-card { padding: 0.65rem !important; border-radius: 0.75rem !important; }
          .stat-card .text-2xl, .stat-card .text-xl { font-size: 1.1rem !important; }
          .stat-card .text-xs { font-size: 0.6rem !important; }

          /* Compact cards with p-5 / p-6 */
          .card-shadow { padding: 0.75rem !important; }

          /* Compact input fields */
          .input-field { padding: 0.4rem 0.65rem !important; font-size: 0.75rem !important; border-radius: 0.5rem !important; }

          /* Compact nav items */
          .nav-item { padding: 0.5rem 0.625rem; font-size: 0.8rem; gap: 0.5rem; }

          /* Smaller buttons */
          .btn-primary { font-size: 0.75rem; }

          /* Smaller badges */
          .badge-pending, .badge-confirmed, .badge-done, .badge-cancelled { font-size: 0.6rem !important; padding: 0.15rem 0.4rem !important; }

          /* Reduce whitespace-nowrap on table cells to allow wrapping */
          table td, table th { white-space: normal !important; word-break: break-word; }
        }
      `}} />
    </head>
    <body class="admin-ui min-h-screen flex overflow-x-hidden" style="background: var(--admin-bg);">

      {/* Overlay mobile */}
      <div id="sidebar-overlay" class="fixed inset-0 bg-black/50 z-40 hidden md:hidden" onclick="toggleSidebar()"></div>

      {/* Sidebar */}
      <aside id="admin-sidebar" class="admin-sidebar w-64 fixed left-0 top-0 bottom-0 text-white flex flex-col z-50">
        <div class="p-5 border-b border-white/10">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background-color:rgba(255,255,255,0.05);">
              <i class="fas fa-snowflake text-white text-lg"></i>
            </div>
            <div>
              <div class="font-bold text-base" style="color:var(--admin-text-primary)">MAASGA</div>
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
            { href: "/admin/paiements", icon: "fa-credit-card", label: "Paiements", key: "paiements" },
            { href: "/admin/clients", icon: "fa-users", label: "Clients", key: "clients" },
            { href: "/admin/maintenance", icon: "fa-tools", label: "Maintenance", key: "maintenance" },
            { href: "/admin/sav", icon: "fa-headset", label: "SAV / Tickets", key: "sav" },
            { href: "/admin/messages", icon: "fa-envelope", label: "Messages", key: "messages" },
            { href: "/admin/avis", icon: "fa-star", label: "Avis clients", key: "avis" },
            { href: "/admin/realisations", icon: "fa-images", label: "Réalisations", key: "realisations" },
            { href: "/admin/audit-log", icon: "fa-clipboard-list", label: "Audit / Logs", key: "audit-log" },
            { href: "/admin/notifications", icon: "fa-bell", label: "Notifications", key: "notifications" },
                        { href: "/admin/banners", icon: "fa-images", label: "Bannières & Marques", key: "banners" },
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
              {n.key === 'maintenance' && (maintenanceDueCount + pendingMaintenanceContractsCount + pendingMaintenanceRequestsCount) > 0 && (
                <span class="ml-auto text-white text-xs rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center font-bold" style="background:#0284c7;">
                  {maintenanceDueCount + pendingMaintenanceContractsCount + pendingMaintenanceRequestsCount}
                </span>
              )}
              {n.key === 'commandes' && orders.filter(o => o.status === 'en_attente').length > 0 && (
                <span class="ml-auto bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {orders.filter(o => o.status === 'en_attente').length}
                </span>
              )}
              {n.key === 'notifications' && notifications.filter(notif => !notif.read).length > 0 && (
                <span class="ml-auto bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {notifications.filter(notif => !notif.read).length}
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
          <a href="/" target="_blank" rel="noopener noreferrer" class="nav-item text-xs">
            <i class="fas fa-external-link-alt w-5 text-center"></i>
            <span>Voir le site public</span>
          </a>
          <form method="post" action="/api/admin/logout">
            <button type="submit" class="nav-item text-xs text-red-300 hover:text-red-200 w-full">
              <i class="fas fa-sign-out-alt w-5 text-center"></i>
              <span>Déconnexion</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main class="md:ml-64 flex-1 min-h-screen overflow-x-hidden">
        {/* Top bar */}
        <header class="px-2 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-30" style="background:rgba(255,255,255,0.92); backdrop-filter:blur(12px); border-bottom:1px solid var(--admin-border);">
          <div class="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <button onclick="toggleSidebar()" class="md:hidden text-gray-500 hover:text-gray-300 p-1.5">
              <i class="fas fa-bars"></i>
            </button>
            <div class="min-w-0">
              <h1 class="font-bold text-sm sm:text-base leading-none truncate" style="color: var(--admin-text-primary)">
                {activePage === 'dashboard' ? 'Tableau de bord' :
                 activePage === 'produits' ? 'Gestion Produits' :
                 activePage === 'rdv' ? 'Rendez-vous' :
                 activePage === 'clients' ? 'Clients' :
                 activePage === 'commandes' ? 'Commandes' :
                 activePage === 'avis' ? 'Avis Clients' :
                 activePage === 'banners' ? 'Bannières & Marques' : 'MAASGA Admin'}
              </h1>
              <div class="text-xs mt-0.5" style="color: var(--admin-text-muted)">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            {/* Global search */}
            <div class="hidden md:block relative" id="global-search-container">
              <input id="global-search-input" type="text" placeholder="Rechercher partout..." autocomplete="off"
                class="w-64 rounded-xl px-3 py-1.5 pl-8 text-xs" style="background:rgba(241,245,249,0.8); border:1px solid var(--admin-border); color: var(--admin-text-primary);"
                oninput="globalSearch(this.value)" onfocus="document.getElementById('global-search-results').classList.remove('hidden')" />
              <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
              <div id="global-search-results" class="hidden absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50 max-h-96 overflow-y-auto shadow-2xl" style="background: var(--admin-card-bg); border:1px solid var(--admin-border);"></div>
            </div>
            <div class="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium" style="background: var(--admin-success-light); color: var(--admin-success);">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Système actif</span>
            </div>
            {/* Notification bell */}
            <div class="relative" id="notif-bell-container">
              <button onclick="toggleNotifPanel()" class="p-2 rounded-lg hover:bg-white/5 transition-colors relative" style="color:#64748b;" title="Notifications">
                <i class="fas fa-bell text-sm"></i>
                <span id="notif-badge" class="hidden absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold" style="font-size:9px;"></span>
              </button>
              <div id="notif-panel" class="hidden absolute top-full right-0 mt-1 w-80 rounded-xl overflow-hidden z-50 shadow-2xl" style="background: var(--admin-card-bg); border:1px solid var(--admin-border);">
                <div class="flex items-center justify-between px-4 py-3" style="border-bottom:1px solid var(--admin-border)">
                  <span class="text-xs font-bold text-white">Notifications</span>
                  <div class="flex gap-2">
                    <button onclick="markAllNotifRead()" class="text-xs text-cyan-400 hover:underline">Tout lire</button>
                    <a href="/admin/notifications" class="text-xs text-cyan-400 hover:underline">Voir tout</a>
                  </div>
                </div>
                <div id="notif-list" class="max-h-64 overflow-y-auto">
                  <div class="p-4 text-xs text-gray-500 text-center">Chargement...</div>
                </div>
              </div>
            </div>
            <a href="/admin/parametres" title="Paramètres" class="p-2 rounded-lg hover:bg-white/5 transition-colors" style="color:#64748b;">
              <i class="fas fa-cog text-sm"></i>
            </a>
            <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-sky-500 rounded-full flex items-center justify-center">
              <i class="fas fa-user-shield text-white text-xs"></i>
            </div>
          </div>
        </header>
        <div class="p-2 sm:p-4 md:p-6">
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

        // Session countdown (86400s = 24h, matches token expiry)
        (function() {
          const el = document.getElementById('session-countdown');
          if (!el) return;
          const loginTime = parseInt(sessionStorage.getItem('maasga_login_ts') || '0') || Date.now();
          sessionStorage.setItem('maasga_login_ts', String(loginTime));
          function update() {
            const elapsed = Math.floor((Date.now() - loginTime) / 1000);
            const remaining = 86400 - elapsed;
            if (remaining <= 0) { el.textContent = 'Session expirée'; el.style.color = '#f87171'; return; }
            const h = Math.floor(remaining / 3600);
            const m = Math.floor((remaining % 3600) / 60);
            el.textContent = 'Expire dans ' + h + 'h' + String(m).padStart(2,'0');
            if (remaining < 1800) el.style.color = '#fbbf24';
          }
          update();
          setInterval(update, 10000); // Mise à jour toutes les 10s pour éviter le lag d'affichage
        })();

        // Global search — construction DOM sécurisée (pas de innerHTML avec données serveur)
        var _searchTimeout;
        function esc(s) { var d = document.createElement('div'); d.textContent = String(s||''); return d.innerHTML; }
        function globalSearch(q) {
          clearTimeout(_searchTimeout);
          var box = document.getElementById('global-search-results');
          if (!q || q.length < 2) { box.classList.add('hidden'); return; }
          _searchTimeout = setTimeout(function() {
            fetch('/api/admin/search?q=' + encodeURIComponent(q)).then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function(data) {
              box.innerHTML = '';
              if (!data.length) {
                var empty = document.createElement('div');
                empty.className = 'p-4 text-xs text-gray-500 text-center';
                empty.textContent = 'Aucun résultat';
                box.appendChild(empty);
                box.classList.remove('hidden');
                return;
              }
              var typeIcons = {Produit:'fa-box',Client:'fa-user',RDV:'fa-calendar',Commande:'fa-shopping-cart',Ticket:'fa-headset'};
              var typeColors = {Produit:'#60a5fa',Client:'#34d399',RDV:'#fbbf24',Commande:'#a78bfa',Ticket:'#fb923c'};
              var frag = document.createDocumentFragment();
              data.forEach(function(r) {
                var a = document.createElement('a');
                // r.url vient du serveur — on valide que c'est un chemin relatif
                a.href = (r.url && /^\\/[a-zA-Z0-9\\/_-]/.test(r.url)) ? r.url : '#';
                a.className = 'flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-gray-800/50';
                var icon = document.createElement('i');
                icon.className = 'fas ' + (typeIcons[r.type]||'fa-circle') + ' text-sm';
                icon.style.color = typeColors[r.type]||'#94a3b8';
                var info = document.createElement('div');
                info.className = 'flex-1 min-w-0';
                var label = document.createElement('div');
                label.className = 'text-xs text-white font-medium truncate';
                label.textContent = r.label || '';
                var sub = document.createElement('div');
                sub.className = 'text-xs text-gray-500 truncate';
                sub.textContent = r.sub || '';
                info.appendChild(label);
                info.appendChild(sub);
                var badge = document.createElement('span');
                badge.className = 'text-xs px-2 py-0.5 rounded-lg flex-shrink-0';
                badge.style.cssText = 'background:rgba(148,163,184,0.1); color:' + (typeColors[r.type]||'#94a3b8') + ';';
                badge.textContent = r.type || '';
                a.appendChild(icon);
                a.appendChild(info);
                a.appendChild(badge);
                frag.appendChild(a);
              });
              box.appendChild(frag);
              box.classList.remove('hidden');
            }).catch(function() {});
          }, 250);
        }
        // Close search results on outside click
        document.addEventListener('click', function(e) {
          var c = document.getElementById('global-search-container');
          if (c && !c.contains(e.target)) {
            document.getElementById('global-search-results').classList.add('hidden');
          }
        });

        // Notification bell
        function loadNotifCount() {
          fetch('/api/admin/notifications/count').then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function(d) {
            var badge = document.getElementById('notif-badge');
            if (d.count > 0) { badge.textContent = d.count > 9 ? '9+' : d.count; badge.classList.remove('hidden'); badge.classList.add('flex'); }
            else { badge.classList.add('hidden'); badge.classList.remove('flex'); }
          }).catch(function(){});
        }
        function toggleNotifPanel() {
          var panel = document.getElementById('notif-panel');
          if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            loadNotifList();
          } else { panel.classList.add('hidden'); }
        }
        function loadNotifList() {
          fetch('/api/admin/notifications').then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function(data) {
            var list = data.notifications || (Array.isArray(data) ? data : []);
            var el = document.getElementById('notif-list');
            if (!list.length) { el.innerHTML = '<div class="p-4 text-xs text-gray-500 text-center">Aucune notification</div>'; return; }
            var typeIcons = {order:'fa-shopping-cart',rdv:'fa-calendar',review:'fa-star',contact:'fa-envelope',sav:'fa-headset',client:'fa-user-plus',payment:'fa-credit-card',product:'fa-box',maintenance:'fa-tools'};
            var typeColors = {order:'#a78bfa',rdv:'#fbbf24',review:'#f472b6',contact:'#60a5fa',sav:'#fb923c',client:'#34d399',payment:'#10b981',product:'#38bdf8',maintenance:'#f59e0b'};
            var html = '';
            list.slice(0, 15).forEach(function(n) {
              var icon = typeIcons[n.type] || 'fa-bell';
              var color = typeColors[n.type] || '#94a3b8';
              var ago = timeAgo(n.created_at);
              html += '<div class="flex items-start gap-3 px-4 py-3 border-b border-gray-800/50' + (n.read ? '' : ' bg-[rgba(3,105,161,0.04)]') + '">'
                + '<i class="fas ' + icon + ' text-sm mt-0.5" style="color:' + color + ';"></i>'
                + '<div class="flex-1 min-w-0">'
                + '<div class="text-xs' + (n.read ? ' opacity-60' : ' font-medium') + '" style="color:var(--admin-text-primary)">' + escapeHtml(n.summary) + '</div>'
                + '<div class="text-xs text-gray-500 mt-0.5">' + ago + '</div>'
                + '</div>'
                + (n.read ? '' : '<div class="w-2 h-2 bg-cyan-400 rounded-full mt-1 flex-shrink-0"></div>')
                + '</div>';
            });
            el.innerHTML = html;
          }).catch(function(){});
        }
        function markAllNotifRead() {
          fetch('/api/admin/notifications/mark-read', {method:'POST'}).then(function() {
            loadNotifCount(); loadNotifList();
          });
        }
        function escapeHtml(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
        function timeAgo(dt) {
          var diff = (Date.now() - new Date(dt).getTime()) / 1000;
          if (diff < 60) return "\u00C0 l'instant";
          if (diff < 3600) return Math.floor(diff/60) + ' min';
          if (diff < 86400) return Math.floor(diff/3600) + ' h';
          return Math.floor(diff/86400) + ' j';
        }
        // Close notif panel on outside click
        document.addEventListener('click', function(e) {
          var nc = document.getElementById('notif-bell-container');
          if (nc && !nc.contains(e.target)) { document.getElementById('notif-panel').classList.add('hidden'); }
        });
        // Load notif count on page load
        loadNotifCount();
        setInterval(loadNotifCount, 30000);
      `}} />

      {/* Admin Toast System */}
      <div id="toast-container" class="fixed top-4 right-4 z-[99999] flex flex-col gap-3 pointer-events-none" style="max-width:380px;"></div>
      <script dangerouslySetInnerHTML={{ __html: `
        window.showToast = function(msg, type) {
          type = type || 'info';
          var colors = {
            success: 'linear-gradient(135deg, var(--admin-success), #10b981)',
            error: 'linear-gradient(135deg, var(--admin-danger), #ef4444)',
            warning: 'linear-gradient(135deg, var(--admin-warning), #f59e0b)',
            info: 'linear-gradient(135deg, var(--admin-info), #3b82f6)'
          };
          var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
          var container = document.getElementById('toast-container');
          var el = document.createElement('div');
          el.className = 'pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-medium';
          el.style.cssText = 'background:' + (colors[type]||colors.info) + ';animation:slideIn .35s ease-out;border:1px solid rgba(255,255,255,0.15);';
          var icon = document.createElement('i');
          icon.className = 'fas ' + (icons[type]||icons.info) + ' text-lg opacity-90';
          var span = document.createElement('span');
          span.textContent = msg;
          el.appendChild(icon);
          el.appendChild(span);
          container.appendChild(el);
          setTimeout(function() {
            el.style.transition = 'opacity .3s, transform .3s';
            el.style.opacity = '0';
            el.style.transform = 'translateX(60px)';
            setTimeout(function() { el.remove(); }, 300);
          }, 4000);
        };

        // ─── Reusable Admin Table Pagination ───
        // Usage: add data-paginate="20" on any <tbody> to paginate its rows
        window.adminPaginate = function() {
          document.querySelectorAll('tbody[data-paginate]').forEach(function(tbody) {
            var perPage = parseInt(tbody.dataset.paginate) || 20;
            var rows = Array.from(tbody.querySelectorAll('tr'));
            if (rows.length <= perPage) return;
            var page = 1;
            var totalPages = Math.ceil(rows.length / perPage);

            // Create pagination container
            var pDiv = document.createElement('div');
            pDiv.className = 'flex items-center justify-center gap-2 flex-wrap mt-4 mb-2';
            var tableParent = tbody.closest('.overflow-x-auto') || tbody.closest('table').parentElement;
            tableParent.parentElement.insertBefore(pDiv, tableParent.nextSibling);

            function render() {
              rows.forEach(function(r, i) {
                var p = Math.floor(i / perPage) + 1;
                r.style.display = p === page ? '' : 'none';
              });
              var html = '';
              var btnBase = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ';
              var btnActive = 'background:linear-gradient(135deg,#2563eb,#0284c7); color:white;';
              var btnNormal = 'background:rgba(56,189,248,0.08); color:#93c5fd; border:1px solid rgba(56,189,248,0.15);';
              var btnOff = 'background:rgba(255,255,255,0.03); color:#475569; cursor:not-allowed;';
              html += '<button class="' + btnBase + '" style="' + (page<=1?btnOff:btnNormal) + '"' + (page<=1?' disabled':'') + ' data-pg="' + (page-1) + '"><i class="fas fa-chevron-left"></i></button>';
              for (var i = 1; i <= totalPages; i++) {
                if (totalPages > 7 && i > 2 && i < totalPages-1 && Math.abs(i-page) > 1) {
                  if (i===3||i===totalPages-2) html += '<span class="px-1" style="color:#475569;">…</span>';
                  continue;
                }
                html += '<button class="' + btnBase + '" style="' + (i===page?btnActive:btnNormal) + '" data-pg="'+i+'">'+i+'</button>';
              }
              html += '<button class="' + btnBase + '" style="' + (page>=totalPages?btnOff:btnNormal) + '"' + (page>=totalPages?' disabled':'') + ' data-pg="' + (page+1) + '"><i class="fas fa-chevron-right"></i></button>';
              html += '<span class="text-xs ml-2" style="color:#64748b;">' + rows.length + ' éléments</span>';
              pDiv.innerHTML = html;
              pDiv.querySelectorAll('button[data-pg]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                  var np = parseInt(btn.dataset.pg);
                  if (np >= 1 && np <= totalPages) { page = np; render(); }
                });
              });
            }
            render();
          });
        };
        document.addEventListener('DOMContentLoaded', function() { window.adminPaginate(); });
      `}} />
    </body>
  </html>
)

// ============================================================