import { products } from '../data/products'
import { reviews, appointments, orders, clients, maintenanceDueCount, notifications } from '../data/store'

// ============================================================
// LAYOUT ADMIN
// ============================================================

const AdminLayout = ({ children, activePage = "" }: { children: any; activePage?: string }) => (
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Admin MAASGA - Back-office</title>
      <link rel="stylesheet" href="/static/tailwind.css" />
      <link rel="stylesheet" href="/static/style.css" />
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

          /* Modals: ensure they fit viewport */
          .rounded-3xl, .rounded-2xl { max-width: calc(100vw - 1rem) !important; }

          /* Reduce whitespace-nowrap on table cells to allow wrapping */
          table td, table th { white-space: normal !important; word-break: break-word; }
        }
      `}} />
    </head>
    <body class="min-h-screen flex overflow-x-hidden" style="background:#0b1120;">

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
            { href: "/admin/paiements", icon: "fa-credit-card", label: "Paiements", key: "paiements" },
            { href: "/admin/clients", icon: "fa-users", label: "Clients", key: "clients" },
            { href: "/admin/maintenance", icon: "fa-tools", label: "Maintenance", key: "maintenance" },
            { href: "/admin/sav", icon: "fa-headset", label: "SAV / Tickets", key: "sav" },
            { href: "/admin/messages", icon: "fa-envelope", label: "Messages", key: "messages" },
            { href: "/admin/avis", icon: "fa-star", label: "Avis clients", key: "avis" },
            { href: "/admin/audit-log", icon: "fa-clipboard-list", label: "Audit / Logs", key: "audit-log" },
            { href: "/admin/notifications", icon: "fa-bell", label: "Notifications", key: "notifications" },
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
              {n.key === 'maintenance' && maintenanceDueCount > 0 && (
                <span class="ml-auto text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold" style="background:#f59e0b;">
                  {maintenanceDueCount}
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
          <a href="/api/admin/logout" class="nav-item text-xs text-red-300 hover:text-red-200">
            <i class="fas fa-sign-out-alt w-5 text-center"></i>
            <span>Déconnexion</span>
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main class="md:ml-64 flex-1 min-h-screen overflow-x-hidden">
        {/* Top bar */}
        <header class="px-2 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-30" style="background:rgba(11,17,32,0.92); backdrop-filter:blur(20px); border-bottom:1px solid rgba(56,189,248,0.1);">
          <div class="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <button onclick="toggleSidebar()" class="md:hidden text-gray-500 hover:text-gray-300 p-1.5">
              <i class="fas fa-bars"></i>
            </button>
            <div class="min-w-0">
              <h1 class="font-bold text-white text-sm sm:text-base leading-none truncate">
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
            {/* Global search */}
            <div class="hidden md:block relative" id="global-search-container">
              <input id="global-search-input" type="text" placeholder="Rechercher partout..." autocomplete="off"
                class="w-64 rounded-xl px-3 py-1.5 pl-8 text-xs text-white" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.15);"
                oninput="globalSearch(this.value)" onfocus="document.getElementById('global-search-results').classList.remove('hidden')" />
              <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
              <div id="global-search-results" class="hidden absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50 max-h-96 overflow-y-auto shadow-2xl" style="background:#111827; border:1px solid rgba(56,189,248,0.2);"></div>
            </div>
            <div class="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium" style="background:rgba(16,185,129,0.12); color:#34d399;">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Système actif</span>
            </div>
            {/* Notification bell */}
            <div class="relative" id="notif-bell-container">
              <button onclick="toggleNotifPanel()" class="p-2 rounded-lg hover:bg-white/5 transition-colors relative" style="color:#64748b;" title="Notifications">
                <i class="fas fa-bell text-sm"></i>
                <span id="notif-badge" class="hidden absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold" style="font-size:9px;"></span>
              </button>
              <div id="notif-panel" class="hidden absolute top-full right-0 mt-1 w-80 rounded-xl overflow-hidden z-50 shadow-2xl" style="background:#111827; border:1px solid rgba(56,189,248,0.2);">
                <div class="flex items-center justify-between px-4 py-3 border-b border-gray-800">
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
                a.href = (r.url && /^\/[a-zA-Z0-9/_-]/.test(r.url)) ? r.url : '#';
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
              html += '<div class="flex items-start gap-3 px-4 py-3 border-b border-gray-800/50' + (n.read ? '' : ' bg-cyan-500/5') + '">'
                + '<i class="fas ' + icon + ' text-sm mt-0.5" style="color:' + color + ';"></i>'
                + '<div class="flex-1 min-w-0">'
                + '<div class="text-xs text-white' + (n.read ? ' opacity-60' : ' font-medium') + '">' + escapeHtml(n.summary) + '</div>'
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
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl p-3" style="background:rgba(15,23,42,0.6); border:1px solid rgba(220,38,38,0.15);">
                <div>
                  <span class="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mr-2" style="background:rgba(220,38,38,0.2); color:#f87171;">NOUVEAU</span>
                  <span class="font-semibold text-gray-200">{a.name}</span>
                  <span class="text-xs text-gray-400 ml-2">
                    ?? {a.quartier} · ?? {a.date} · {{ devis: 'Devis', installation: 'Installation', entretien: 'Entretien', depannage: 'Dépannage' }[a.type] || a.type}
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
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 fade-in-up">
        {[
          { icon: "fa-calendar-check", color: "from-blue-500 to-blue-600", label: "RDV en attente", val: String(pendingRdv), sub: `${appointments.length} total · ${doneRdv} effectués`, href: "/admin/rdv" },
          { icon: "fa-boxes", color: "from-orange-500 to-red-500", label: "Alertes stock", val: String(lowStock + outOfStock), sub: `${outOfStock} rupture(s) · ${lowStock} limité(s)`, href: "/admin/produits" },
          { icon: "fa-star", color: "from-yellow-400 to-amber-500", label: "Avis en attente", val: String(pendingReviews), sub: `${approvedReviews} publiés · ${avgNote}/5`, href: "/admin/avis" },
          { icon: "fa-chart-line", color: "from-green-500 to-emerald-600", label: "Chiffre d'affaires", val: `${Math.round(estimatedCA / 1000)}K`, sub: "FCFA · commandes validées", href: "/admin/commandes" }
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
                    <div class="text-xs text-gray-400">{a.date} · {a.quartier} · {{ devis: 'Devis', installation: 'Installation', entretien: 'Entretien', depannage: 'Dépannage' }[a.type] || a.type}</div>
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
            return o.created_at.startsWith(yearMonth) && ['confirme', 'en_livraison', 'livre'].includes(o.status)
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
      <div class="rounded-2xl card-shadow overflow-hidden mb-6 fade-in-up delay-2" style="background:#111827; border:1px solid rgba(16,185,129,0.15);">
        <div class="p-5 flex items-center justify-between" style="border-bottom:1px solid rgba(16,185,129,0.1);">
          <h3 class="font-bold text-white flex items-center space-x-2">
            <i class="fas fa-chart-line text-green-400"></i>
            <span>Tableau de bord financier</span>
          </h3>
          <a href="/admin/commandes" class="text-xs text-green-400 font-medium">Voir commandes</a>
        </div>
        <div class="p-5">
          {/* KPIs financiers */}
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="rounded-xl p-4" style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2);">
              <div class="text-xs text-gray-400 font-semibold mb-1">CA ce mois</div>
              <div class="text-xl font-bold text-green-400">{currentMonth.revenue.toLocaleString()} F</div>
              <div class="text-xs mt-1" style={growth >= 0 ? 'color:#34d399;' : 'color:#f87171;'}>
                <i class={`fas fa-arrow-${growth >= 0 ? 'up' : 'down'} mr-1`}></i>{growth > 0 ? '+' : ''}{growth}% vs mois precedent
              </div>
            </div>
            <div class="rounded-xl p-4" style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2);">
              <div class="text-xs text-gray-400 font-semibold mb-1">CA mois precedent</div>
              <div class="text-xl font-bold text-blue-400">{prevMonth.revenue.toLocaleString()} F</div>
              <div class="text-xs text-gray-500 mt-1">{prevMonth.count} commandes</div>
            </div>
            <div class="rounded-xl p-4" style="background:rgba(168,85,247,0.08); border:1px solid rgba(168,85,247,0.2);">
              <div class="text-xs text-gray-400 font-semibold mb-1">CA total (6 mois)</div>
              <div class="text-xl font-bold text-purple-400">{estimatedCA.toLocaleString()} F</div>
              <div class="text-xs text-gray-500 mt-1">{orders.filter(o => ['paid','validated','en_livraison','installed'].includes(o.status)).length} commandes</div>
            </div>
            <div class="rounded-xl p-4" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2);">
              <div class="text-xs text-gray-400 font-semibold mb-1">Moyenne mensuelle</div>
              <div class="text-xl font-bold text-yellow-400">{Math.round(avgMonthly).toLocaleString()} F</div>
              <div class="text-xs text-gray-500 mt-1">sur les mois actifs</div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique CA mensuel */}
            <div>
              <div class="text-sm font-semibold text-gray-300 mb-3"><i class="fas fa-chart-bar text-green-400 mr-2"></i>Evolution CA mensuel</div>
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
              <div class="text-sm font-semibold text-gray-300 mb-3"><i class="fas fa-trophy text-yellow-400 mr-2"></i>Top produits par revenus</div>
              {topProducts.length === 0 ? (
                <p class="text-xs text-gray-500 py-4">Aucune commande validee</p>
              ) : (
                <div class="space-y-3">
                  {topProducts.map((tp, i) => (
                    <div class="flex items-center gap-3">
                      <span class="text-xs font-bold text-gray-500 w-5">#{i + 1}</span>
                      <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-medium text-gray-300 truncate max-w-[180px]">{tp.name}</span>
                          <span class="text-xs font-bold text-green-400">{tp.revenue.toLocaleString()} F</span>
                        </div>
                        <div class="w-full h-2 rounded-full" style="background:rgba(16,185,129,0.1);">
                          <div class="h-2 rounded-full" style={`width:${Math.round((tp.revenue / maxRev) * 100)}%; background:linear-gradient(90deg,#10b981,#34d399);`}></div>
                        </div>
                        <div class="text-[10px] text-gray-500 mt-0.5">{tp.count} vente(s)</div>
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
            <tbody data-paginate="10">
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

    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 class="text-xl font-bold text-white">Gestion des produits</h2>
        <p class="text-sm text-gray-400 mt-1">{products.length} produits au catalogue · {products.filter(p => p.available && p.stock > 0).length} disponibles</p>
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
    <div class="mb-6 rounded-xl p-4 flex flex-wrap items-end gap-3" style="background:rgba(15,23,42,0.5); border:1px solid rgba(148,163,184,0.1);">
      <form method="post" action="/api/admin/stock/movement" class="flex flex-wrap items-end gap-3 w-full">
        <div>
          <label class="block text-xs text-gray-400 mb-1">Produit</label>
          <select name="product_id" required class="rounded-xl px-3 py-2 text-xs text-white" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.15);">
            {products.map(p => <option value={p.id}>{p.name} (stock: {p.stock})</option>)}
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">Type</label>
          <select name="type" class="rounded-xl px-3 py-2 text-xs text-white" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.15);">
            <option value="entree">Entrée (+)</option>
            <option value="sortie">Sortie (-)</option>
            <option value="ajustement">Ajustement</option>
            <option value="retour">Retour</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">Quantité (+/-)</label>
          <input name="quantity" type="number" required class="w-24 rounded-xl px-3 py-2 text-xs text-white" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.15);" placeholder="ex: 5 ou -2" />
        </div>
        <div class="flex-1 min-w-[120px]">
          <label class="block text-xs text-gray-400 mb-1">Raison</label>
          <input name="reason" class="w-full rounded-xl px-3 py-2 text-xs text-white" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.15);" placeholder="Réapprovisionnement, vente, etc." />
        </div>
        <button type="submit" class="btn-primary px-4 py-2 rounded-xl text-xs font-semibold"><i class="fas fa-exchange-alt mr-1"></i>Enregistrer</button>
      </form>
    </div>

    {/* Stock movements history (loaded via JS) */}
    <div class="mb-6">
      <button onclick="toggleStockHistory()" class="text-xs text-cyan-400 hover:underline mb-2"><i class="fas fa-history mr-1"></i>Voir l'historique des mouvements de stock</button>
      <div id="stock-history" class="hidden rounded-xl overflow-hidden" style="background:rgba(15,23,42,0.5); border:1px solid rgba(148,163,184,0.1);">
        <div id="stock-history-content" class="p-4 text-xs text-gray-400">Chargement...</div>
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
              + '<td class="py-2 px-3 text-gray-400">'+(m.created_at||'').substring(0,16)+'</td>'
              + '<td class="py-2 px-3 text-white">'+(m.product_name||'#'+m.product_id)+'</td>'
              + '<td class="py-2 px-3"><span style="color:'+(typeColors[m.movement_type]||'#94a3b8')+'">'+(typeLabels[m.movement_type]||m.movement_type)+'</span></td>'
              + '<td class="py-2 px-3 font-mono '+(m.quantity>0?'text-green-400':'text-red-400')+'">'+(m.quantity>0?'+':'')+m.quantity+'</td>'
              + '<td class="py-2 px-3 text-gray-500">'+m.stock_before+'</td>'
              + '<td class="py-2 px-3 text-white font-semibold">'+m.stock_after+'</td>'
              + '<td class="py-2 px-3 text-gray-400">'+(m.reason||'-')+'</td>'
              + '</tr>';
          });
          html += '</tbody></table>';
          c.innerHTML = html;
        }).catch(function(){ document.getElementById('stock-history-content').innerHTML = '<p class="text-red-400">Erreur de chargement</p>'; });
      }
    `}} />

    <div class="rounded-2xl  card-shadow overflow-hidden" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b border-gray-700/50" style="background:#0e1726;">
            <tr>
              {["Produit", "Marque", "BTU", "Prix", "Stock"].map(h => (
                <th class="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
              <th class="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Inverter</th>
              <th class="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Image</th>
              <th class="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700/30" data-paginate="20">
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
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center space-x-1">
                    <a href={`/catalogue?product=${p.id}`} target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg transition-colors" style="" title="Voir">
                      <i class="fas fa-eye text-xs"></i>
                    </a>
                    <button 
                      data-product={JSON.stringify({
                        id: p.id, name: p.name, brand: p.brand, model: p.model,
                        btu: p.btu, price: p.price, stock: p.stock, energy_class: p.energy_class,
                        surface_min: p.surface_min || '', surface_max: p.surface_max || '',
                        description: p.description, inverter: p.inverter,
                        features: p.features, techSpecs: p.techSpecs || {},
                        media: p.media || []
                      }).replace(/</g, '\\u003c')}
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
      <div class="rounded-3xl p-4 sm:p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto" style="background:#111827; border:1px solid rgba(56,189,248,0.12);">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-bold text-white text-lg">
            <i class="fas fa-plus-circle text-primary-600 mr-2"></i>Ajouter un produit
          </h3>
          <button onclick="document.getElementById('add-product-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-300 p-1">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <form method="post" action="/api/admin/produit/add" enctype="multipart/form-data" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Nom du produit *</label>
              <input type="text" name="name" required placeholder="Ex: Climatiseur Split Inverter 12000 BTU" class="input-field text-sm" />
            </div>
            <div class="sm:col-span-2">
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
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div id="media-add-preview" class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3"></div>
              <input type="hidden" name="media_json" id="add-media-json" value="[]" />
              <p class="text-xs text-gray-500 italic">Extensions : JPG, PNG, WEBP (images), MP4, WebM (vidéos). Max 10 fichiers, 50 Mo chacun.</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-4">
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
      <div class="rounded-3xl p-4 sm:p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto" style="background:#111827; border:1px solid rgba(56,189,248,0.12);">
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
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
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
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

    {/* Import en masse — Produits (Excel) */}
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    <div id="modal-import-masse" class="hidden fixed inset-0 bg-black/60 z-50 items-center justify-center p-4">
      <div class="w-full max-w-3xl rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto" style="background:#111827; border:1px solid rgba(168,85,247,0.15);">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-purple-400"></span>
            Import en masse — Produits
          </h2>
          <button id="btn-fermer-import-masse" class="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>

        <div id="zone-depot" class="rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors" style="border-color:rgba(168,85,247,0.3);">
          <p class="text-gray-300 text-sm mb-1">Glisse ton fichier <span class="text-white font-medium">.xlsx</span> ici, ou clique pour parcourir</p>
          <p class="text-gray-500 text-xs">Utilise le modèle "modele_import_produits_MAASGA.xlsx" pour être sûr que les colonnes matchent</p>
          <input id="input-fichier" type="file" accept=".xlsx,.xls" class="hidden" />
        </div>

        <div id="zone-apercu" class="hidden mt-5">
          <div id="resume-import" class="mb-3 text-sm"></div>
          <div class="max-h-72 overflow-auto rounded-xl" style="border:1px solid rgba(148,163,184,0.15);">
            <table class="w-full text-xs text-left">
              <thead class="text-gray-500 sticky top-0" style="background:rgba(15,23,42,0.9);">
                <tr>
                  <th class="px-3 py-2">#</th>
                  <th class="px-3 py-2">Nom</th>
                  <th class="px-3 py-2">Marque</th>
                  <th class="px-3 py-2">BTU</th>
                  <th class="px-3 py-2">Prix FCFA</th>
                  <th class="px-3 py-2">Stock</th>
                  <th class="px-3 py-2">Statut</th>
                </tr>
              </thead>
              <tbody id="tbody-apercu" class="divide-y divide-gray-700/30 text-gray-200"></tbody>
            </table>
          </div>

          <div class="mt-4 flex items-center justify-end gap-3">
            <button id="btn-annuler-import" class="rounded-xl px-4 py-2 text-sm text-gray-300 hover:text-white">Annuler</button>
            <button id="btn-confirmer-import" class="rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed">
              Confirmer l'import
            </button>
          </div>
        </div>

        <div id="zone-resultat" class="hidden mt-5 rounded-xl p-4 text-sm"></div>
      </div>
    </div>
    <script dangerouslySetInnerHTML={{__html: `
      (function () {
        const CATEGORIES_VALIDES = ["Mural/Split", "Cassette", "Gainable", "Colonne", "Multi-split", "Rooftop", "Industriel"];
        const MARQUES_VALIDES = ["Airwell", "LG", "Sharp", "Nasco", "Mona", "Solstar", "Boreal", "Roch"];
        const CLASSES_VALIDES = ["A", "A+", "A++", "A+++"];

        const modal = document.getElementById("modal-import-masse");
        const btnOuvrir = document.getElementById("btn-ouvrir-import-masse");
        const btnFermer = document.getElementById("btn-fermer-import-masse");
        const zoneDepot = document.getElementById("zone-depot");
        const inputFichier = document.getElementById("input-fichier");
        const zoneApercu = document.getElementById("zone-apercu");
        const resumeImport = document.getElementById("resume-import");
        const tbodyApercu = document.getElementById("tbody-apercu");
        const btnAnnuler = document.getElementById("btn-annuler-import");
        const btnConfirmer = document.getElementById("btn-confirmer-import");
        const zoneResultat = document.getElementById("zone-resultat");
        if (!modal || !btnOuvrir) return;

        let lignesParsees = [];

        function ouvrirModal() {
          modal.classList.remove("hidden");
          modal.classList.add("flex");
        }
        function fermerModal() {
          modal.classList.add("hidden");
          modal.classList.remove("flex");
          resetEtat();
        }
        function resetEtat() {
          lignesParsees = [];
          zoneApercu.classList.add("hidden");
          zoneResultat.classList.add("hidden");
          zoneDepot.classList.remove("hidden");
          tbodyApercu.innerHTML = "";
          inputFichier.value = "";
        }

        btnOuvrir.addEventListener("click", ouvrirModal);
        btnFermer.addEventListener("click", fermerModal);
        btnAnnuler.addEventListener("click", resetEtat);
        zoneDepot.addEventListener("click", function () { inputFichier.click(); });
        zoneDepot.addEventListener("dragover", function (e) { e.preventDefault(); zoneDepot.style.borderColor = "rgba(168,85,247,0.6)"; });
        zoneDepot.addEventListener("dragleave", function () { zoneDepot.style.borderColor = "rgba(168,85,247,0.3)"; });
        zoneDepot.addEventListener("drop", function (e) {
          e.preventDefault();
          zoneDepot.style.borderColor = "rgba(168,85,247,0.3)";
          if (e.dataTransfer.files.length) traiterFichier(e.dataTransfer.files[0]);
        });
        inputFichier.addEventListener("change", function (e) {
          if (e.target.files.length) traiterFichier(e.target.files[0]);
        });

        function traiterFichier(fichier) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const wb = XLSX.read(e.target.result, { type: "array" });
            const feuille = wb.Sheets["Produits"] || wb.Sheets[wb.SheetNames[0]];
            const donnees = XLSX.utils.sheet_to_json(feuille, { defval: "" });
            lignesParsees = donnees.map(mapperLigne).filter(function (l) { return l.nom !== ""; });
            afficherApercu();
          };
          reader.readAsArrayBuffer(fichier);
        }

        function mapperLigne(row) {
          function val(cle) { return row[cle] !== undefined ? String(row[cle]).trim() : ""; }
          return {
            nom: val("Nom du produit*"),
            categorie: val("Categorie*"),
            marque: val("Marque*"),
            modele: val("Modele / Reference"),
            puissanceBtu: Number(val("Puissance BTU*")) || null,
            prixFcfa: Number(val("Prix FCFA*")) || null,
            prixGrossisteFcfa: Number(val("Prix Grossiste FCFA")) || null,
            stockInitial: val("Stock initial*") !== "" ? Number(val("Stock initial*")) : null,
            classeEnergie: val("Classe energie"),
            surfaceMin: Number(val("Surface min m2")) || null,
            surfaceMax: Number(val("Surface max m2")) || null,
            inverter: val("Technologie Inverter").toLowerCase() === "oui",
            disponible: val("Disponible a la vente").toLowerCase() !== "non",
            description: val("Description"),
            mentions: val("Mentions / Fonctionnalites (separees par ;)").split(";").map(function (m) { return m.trim(); }).filter(Boolean)
          };
        }

        function validerLigneClient(l) {
          const erreurs = [];
          if (!l.nom) erreurs.push("nom manquant");
          if (!CATEGORIES_VALIDES.includes(l.categorie)) erreurs.push("catégorie invalide");
          if (!MARQUES_VALIDES.includes(l.marque)) erreurs.push("marque invalide");
          if (!l.puissanceBtu) erreurs.push("BTU invalide");
          if (!l.prixFcfa) erreurs.push("prix invalide");
          if (l.stockInitial === null) erreurs.push("stock invalide");
          if (l.classeEnergie && !CLASSES_VALIDES.includes(l.classeEnergie)) erreurs.push("classe d'énergie invalide");
          return erreurs;
        }

        function afficherApercu() {
          zoneDepot.classList.add("hidden");
          zoneApercu.classList.remove("hidden");
          tbodyApercu.innerHTML = "";

          let nbErreurs = 0;
          lignesParsees.forEach(function (l, i) {
            const erreurs = validerLigneClient(l);
            if (erreurs.length) nbErreurs++;
            const tr = document.createElement("tr");
            tr.innerHTML =
              '<td class="px-3 py-2">' + (i + 1) + '</td>' +
              '<td class="px-3 py-2">' + (l.nom || "-") + '</td>' +
              '<td class="px-3 py-2">' + (l.marque || "-") + '</td>' +
              '<td class="px-3 py-2">' + (l.puissanceBtu != null ? l.puissanceBtu : "-") + '</td>' +
              '<td class="px-3 py-2">' + (l.prixFcfa ? l.prixFcfa.toLocaleString("fr-FR") : "-") + '</td>' +
              '<td class="px-3 py-2">' + (l.stockInitial != null ? l.stockInitial : "-") + '</td>' +
              '<td class="px-3 py-2">' + (erreurs.length
                ? '<span class="text-red-400" title="' + erreurs.join(", ") + '">' + erreurs.length + ' erreur(s)</span>'
                : '<span class="text-emerald-400">OK</span>') + '</td>';
            tbodyApercu.appendChild(tr);
          });

          resumeImport.innerHTML = nbErreurs
            ? '<span class="text-red-400">' + nbErreurs + ' ligne(s) à corriger avant import — corrige ton fichier Excel et redépose-le.</span>'
            : '<span class="text-emerald-400">' + lignesParsees.length + ' produit(s) prêt(s) à importer.</span>';

          btnConfirmer.disabled = nbErreurs > 0;
        }

        btnConfirmer.addEventListener("click", function () {
          btnConfirmer.disabled = true;
          btnConfirmer.textContent = "Import en cours...";
          fetch("/api/admin/produits/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lignes: lignesParsees })
          }).then(function (r) { return r.json(); }).then(function (data) {
            zoneApercu.classList.add("hidden");
            zoneResultat.classList.remove("hidden");
            if (data.succes) {
              zoneResultat.className = "mt-5 rounded-xl p-4 text-sm";
              zoneResultat.style.cssText = "background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); color:#6ee7b7;";
              zoneResultat.textContent = data.message || (data.importes + " produit(s) importé(s) avec succès.");
              setTimeout(function () { window.location.reload(); }, 1500);
            } else {
              zoneResultat.className = "mt-5 rounded-xl p-4 text-sm";
              zoneResultat.style.cssText = "background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#fca5a5;";
              zoneResultat.textContent = data.message || "Échec de l'import. Vérifie ton fichier.";
            }
          }).catch(function () {
            zoneApercu.classList.add("hidden");
            zoneResultat.classList.remove("hidden");
            zoneResultat.className = "mt-5 rounded-xl p-4 text-sm";
            zoneResultat.style.cssText = "background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#fca5a5;";
            zoneResultat.textContent = "Erreur réseau pendant l'import. Réessaie.";
          }).finally(function () {
            btnConfirmer.disabled = false;
            btnConfirmer.textContent = "Confirmer l'import";
          });
        });
      })();
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
          <a href="/api/admin/export/rdv" class="text-xs px-3 py-2 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
            <i class="fas fa-file-csv"></i>
            <span>Export CSV</span>
          </a>
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

      {/* Barre de recherche RDV + toggle vue */}
      <div class="mb-4 flex gap-3 items-center">
        <div class="relative flex-1">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none"></i>
          <input type="text" id="rdv-search" placeholder="Rechercher par nom, téléphone, quartier..."
            oninput="filterRDVList(this.value)"
            class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm input-field" />
        </div>
        <div class="flex rounded-xl overflow-hidden" style="border:1px solid rgba(148,163,184,0.2);">
          <button onclick="toggleRDVView('list')" id="btn-view-list" class="px-3 py-2 text-xs font-semibold" style="background:rgba(59,130,246,0.2); color:#60a5fa;">
            <i class="fas fa-list"></i>
          </button>
          <button onclick="toggleRDVView('calendar')" id="btn-view-calendar" class="px-3 py-2 text-xs font-semibold" style="background:transparent; color:#94a3b8;">
            <i class="fas fa-calendar-alt"></i>
          </button>
        </div>
      </div>

      {/* VUE CALENDRIER */}
      <div id="rdv-calendar-view" class="hidden mb-6">
        <div class="rounded-2xl card-shadow overflow-hidden" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
          <div class="p-4 flex items-center justify-between" style="border-bottom:1px solid rgba(148,163,184,0.08);">
            <button onclick="changeCalendarMonth(-1)" class="px-3 py-1.5 rounded-lg text-sm font-medium" style="background:rgba(59,130,246,0.1); color:#60a5fa;">
              <i class="fas fa-chevron-left"></i>
            </button>
            <h3 id="calendar-month-label" class="text-lg font-bold text-white"></h3>
            <button onclick="changeCalendarMonth(1)" class="px-3 py-1.5 rounded-lg text-sm font-medium" style="background:rgba(59,130,246,0.1); color:#60a5fa;">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          <div class="p-4">
            <div class="grid grid-cols-7 gap-1 mb-2">
              {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => (
                <div class="text-center text-xs font-bold text-gray-500 py-2">{d}</div>
              ))}
            </div>
            <div id="calendar-grid" class="grid grid-cols-7 gap-1"></div>
          </div>
        </div>
        {/* Détail du jour sélectionné */}
        <div id="calendar-day-detail" class="hidden mt-4 rounded-2xl card-shadow p-5" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
          <h4 id="calendar-day-label" class="font-bold text-white mb-3"></h4>
          <div id="calendar-day-rdvs" class="space-y-2"></div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div id="rdv-list-view" class="rounded-2xl  p-12 text-center card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
          <i class="fas fa-calendar-times text-3xl text-gray-300 mb-3"></i>
          <p class="text-gray-400">Aucun rendez-vous dans cette catégorie</p>
        </div>
      ) : (
        <div id="rdv-list-view" class="space-y-4">
          {filtered.map(a => (
            <div class="rdv-card rounded-2xl p-5 card-shadow" data-search={`${a.name} ${a.phone} ${a.quartier}`.toLowerCase()} style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-start space-x-4">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                    devis: 'background:rgba(59,130,246,0.15)',
                    installation: 'background:rgba(16,185,129,0.15)',
                    entretien: 'background:rgba(139,92,246,0.15)',
                    depannage: 'background:rgba(239,68,68,0.15)'
                  }[a.type] || 'background:rgba(59,130,246,0.15)'}>
                    <i class={`fas ${{ devis: 'fa-clipboard-check text-blue-400', installation: 'fa-tools text-green-400', entretien: 'fa-wrench text-purple-400', depannage: 'fa-bolt text-red-400' }[a.type] || 'fa-calendar text-gray-400'} text-lg`}></i>
                  </div>
                  <div>
                    <div class="flex items-center space-x-2 mb-1">
                      <h4 class="font-bold text-white cursor-pointer hover:text-blue-300 transition-colors" onclick={`showRdvDetailById(${a.id})`} title="Voir détails client">{a.name} <i class="fas fa-eye text-xs text-blue-400 ml-1"></i></h4>
                      <span class={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.status === 'pending' ? 'badge-pending' : a.status === 'confirmed' ? 'badge-confirmed' : 'badge-done'}`}>
                        {a.status === 'pending' ? 'En attente' : a.status === 'confirmed' ? 'Confirmé' : 'Effectué'}
                      </span>
                    </div>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span><i class="fas fa-phone mr-1 text-gray-400"></i>{a.phone}</span>
                      <span><i class="fas fa-map-marker-alt mr-1 text-gray-400"></i>{a.quartier}</span>
                      <span><i class="fas fa-calendar mr-1 text-gray-400"></i>{a.date}</span>
                      {(a.heure_debut || a.heure_fin) && <span><i class="fas fa-clock mr-1 text-gray-400"></i>{a.heure_debut}–{a.heure_fin}</span>}
                      <span><i class="fas fa-tag mr-1 text-gray-400"></i>{{ devis: 'Devis/Dimensionnement', installation: 'Installation', entretien: 'Entretien', depannage: 'Dépannage' }[a.type] || a.type}</span>
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
                  <a href={`https://wa.me/${a.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Bonjour ' + a.name + ', votre RDV MAASGA du ' + a.date + ' à ' + a.quartier + ' est confirmé. Besoin de renseignements ?')}`} target="_blank" rel="noopener noreferrer"
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
        <div class="rounded-3xl p-4 sm:p-8 w-full max-w-xl shadow-2xl my-8 max-h-[90vh] overflow-y-auto" style="background:#111827; border:1px solid rgba(56,189,248,0.12);">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-white text-lg">Ajouter un rendez-vous</h3>
            <button onclick="document.getElementById('add-rdv-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-300 p-1">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <form method="post" action="/api/admin/rdv/add" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-gray-400 mb-1.5">Nom client *</label>
                <input type="text" name="name" required placeholder="Ex: Moussa Traoré" class="input-field text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1.5">Téléphone (Whatsapp) *</label>
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
                  <option value="devis">Devis / Dimensionnement</option>
                  <option value="installation">Installation</option>
                  <option value="entretien">Entretien / Maintenance</option>
                  <option value="depannage">Dépannage</option>
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
              <div class="sm:col-span-2">
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
        <div class="rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" style="background:#111827; border:1px solid rgba(56,189,248,0.2);">
          <div class="flex items-center justify-between px-4 sm:px-6 py-4" style="background:rgba(59,130,246,0.1); border-bottom:1px solid rgba(56,189,248,0.15);">
            <h3 class="font-bold text-white text-base sm:text-lg flex items-center space-x-2">
              <i class="fas fa-calendar-alt text-blue-400"></i>
              <span>Détails du rendez-vous</span>
            </h3>
            <button onclick="document.getElementById('rdv-detail-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-200 p-1 transition-colors">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <div class="p-4 sm:p-6 space-y-4">
            <div class="flex items-center space-x-4">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0" style="background:rgba(59,130,246,0.2); color:#60a5fa;" id="rdv-detail-avatar"></div>
              <div>
                <div class="text-lg font-bold text-white" id="rdv-detail-name"></div>
                <div class="text-sm text-blue-300" id="rdv-detail-type"></div>
              </div>
              <div class="ml-auto" id="rdv-detail-badge"></div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl p-3" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,180,220,0.1);">
                <div class="text-xs text-gray-500 mb-1"><i class="fas fa-phone mr-1"></i>Téléphone (Whatsapp)</div>
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

            {/* Fiche client section */}
            <div id="rdv-client-section" class="rounded-2xl overflow-hidden" style="border:1px solid rgba(56,189,248,0.18);">
              <div class="flex items-center justify-between px-4 py-2.5" style="background:rgba(56,189,248,0.08); border-bottom:1px solid rgba(56,189,248,0.12);">
                <span class="text-xs font-bold text-cyan-400"><i class="fas fa-user-circle mr-2"></i>Fiche client</span>
                <span id="rdv-client-status" class="text-xs text-gray-500">Chargement...</span>
              </div>
              <div id="rdv-client-body" class="p-4 space-y-3">
                <div class="flex justify-center py-2"><i class="fas fa-spinner fa-spin text-gray-500 text-lg"></i></div>
              </div>
            </div>
          </div>
          <div class="px-4 sm:px-6 pb-4 sm:pb-6 flex flex-wrap gap-3">
            <a id="rdv-detail-wa" href="#" target="_blank" rel="noopener noreferrer" class="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors" style="background:rgba(37,211,102,0.15); color:#25D366; border:1px solid rgba(37,211,102,0.25);">
              <i class="fab fa-whatsapp mr-2"></i>WhatsApp
            </a>
            <button onclick="document.getElementById('rdv-detail-modal').classList.add('hidden')" class="flex-1 text-sm font-semibold py-2.5 rounded-xl transition-colors" style="background:rgba(148,163,184,0.1); color:#94a3b8;">
              Fermer
            </button>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        // Calendar state
        var calRDVs = ${JSON.stringify(filtered.map(a => ({ id: a.id, name: a.name, phone: a.phone, quartier: a.quartier, date: a.date, heure_debut: a.heure_debut, heure_fin: a.heure_fin, status: a.status, type: a.type, notes: a.notes })))};
        // Full RDV data map (id -> rdv) for detail popup
        var _rdvMap = ${JSON.stringify(Object.fromEntries(filtered.map(a => [a.id, a])))};
        function showRdvDetailById(id) { var a = _rdvMap[id]; if (a) showRdvDetail(a); }
        var calMonth = new Date().getMonth();
        var calYear = new Date().getFullYear();

        function toggleRDVView(view) {
          var listEl = document.getElementById('rdv-list-view');
          var calEl = document.getElementById('rdv-calendar-view');
          var btnList = document.getElementById('btn-view-list');
          var btnCal = document.getElementById('btn-view-calendar');
          if (view === 'calendar') {
            if (listEl) listEl.classList.add('hidden');
            calEl.classList.remove('hidden');
            btnList.style.background = 'transparent'; btnList.style.color = '#94a3b8';
            btnCal.style.background = 'rgba(59,130,246,0.2)'; btnCal.style.color = '#60a5fa';
            renderCalendar();
          } else {
            if (listEl) listEl.classList.remove('hidden');
            calEl.classList.add('hidden');
            btnList.style.background = 'rgba(59,130,246,0.2)'; btnList.style.color = '#60a5fa';
            btnCal.style.background = 'transparent'; btnCal.style.color = '#94a3b8';
          }
        }

        function changeCalendarMonth(delta) {
          calMonth += delta;
          if (calMonth > 11) { calMonth = 0; calYear++; }
          if (calMonth < 0) { calMonth = 11; calYear--; }
          renderCalendar();
        }

        function renderCalendar() {
          var months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
          document.getElementById('calendar-month-label').textContent = months[calMonth] + ' ' + calYear;

          var firstDay = new Date(calYear, calMonth, 1).getDay();
          var startOffset = (firstDay === 0 ? 6 : firstDay - 1); // Monday-based
          var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
          var today = new Date();

          // Count RDVs per day
          var rdvByDay = {};
          calRDVs.forEach(function(r) {
            if (!r.date) return;
            var parts = r.date.split('-');
            if (parts.length < 3) return;
            var rYear = parseInt(parts[0]), rMonth = parseInt(parts[1]) - 1, rDay = parseInt(parts[2]);
            if (rYear === calYear && rMonth === calMonth) {
              if (!rdvByDay[rDay]) rdvByDay[rDay] = [];
              rdvByDay[rDay].push(r);
            }
          });

          var grid = document.getElementById('calendar-grid');
          var html = '';
          // Empty cells before 1st
          for (var i = 0; i < startOffset; i++) {
            html += '<div class="p-2 rounded-lg min-h-[60px]" style="background:rgba(15,23,42,0.3);"></div>';
          }
          for (var d = 1; d <= daysInMonth; d++) {
            var isToday = (d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear());
            var count = rdvByDay[d] ? rdvByDay[d].length : 0;
            var pending = rdvByDay[d] ? rdvByDay[d].filter(function(r){return r.status==='pending'}).length : 0;
            var bgStyle = isToday ? 'background:rgba(59,130,246,0.15); border:2px solid rgba(59,130,246,0.4);' : count > 0 ? 'background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2);' : 'background:rgba(15,23,42,0.4); border:1px solid rgba(148,163,184,0.05);';
            html += '<div class="p-2 rounded-lg min-h-[60px] cursor-pointer hover:scale-105 transition-transform" style="' + bgStyle + '" onclick="showCalendarDay(' + d + ')">';
            html += '<div class="text-xs font-bold ' + (isToday ? 'text-blue-400' : 'text-gray-400') + '">' + d + '</div>';
            if (count > 0) {
              html += '<div class="mt-1">';
              if (pending > 0) html += '<div class="text-[10px] px-1.5 py-0.5 rounded-full font-bold mb-0.5" style="background:rgba(251,191,36,0.15); color:#fbbf24;">' + pending + ' attente</div>';
              if (count - pending > 0) html += '<div class="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style="background:rgba(16,185,129,0.15); color:#34d399;">' + (count - pending) + ' confirm.</div>';
              html += '</div>';
            }
            html += '</div>';
          }
          grid.innerHTML = html;
        }

        function showCalendarDay(day) {
          var rdvs = [];
          calRDVs.forEach(function(r) {
            if (!r.date) return;
            var parts = r.date.split('-');
            if (parts.length < 3) return;
            if (parseInt(parts[0]) === calYear && parseInt(parts[1]) - 1 === calMonth && parseInt(parts[2]) === day) rdvs.push(r);
          });
          var months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
          document.getElementById('calendar-day-label').textContent = day + ' ' + months[calMonth] + ' ' + calYear + ' — ' + rdvs.length + ' RDV';
          var detail = document.getElementById('calendar-day-detail');
          var container = document.getElementById('calendar-day-rdvs');
          if (rdvs.length === 0) {
            container.innerHTML = '<p class="text-sm text-gray-500">Aucun RDV ce jour</p>';
          } else {
            container.innerHTML = rdvs.map(function(r) {
              var statusColor = r.status === 'pending' ? 'color:#fbbf24' : r.status === 'confirmed' ? 'color:#34d399' : 'color:#60a5fa';
              var statusLabel = r.status === 'pending' ? 'En attente' : r.status === 'confirmed' ? 'Confirmé' : 'Effectué';
              return '<div class="flex items-center justify-between p-3 rounded-xl" style="background:rgba(15,23,42,0.5); border:1px solid rgba(148,163,184,0.1);">' +
                '<div><span class="font-semibold text-white text-sm">' + r.name + '</span>' +
                '<span class="text-xs text-gray-500 ml-2">' + (r.heure_debut || '') + (r.heure_fin ? '–' + r.heure_fin : '') + '</span>' +
                '<div class="text-xs text-gray-500 mt-0.5"><i class="fas fa-map-marker-alt mr-1"></i>' + (r.quartier || '') + ' · ' + ({devis:'Devis',installation:'Installation',entretien:'Entretien',depannage:'Dépannage'}[r.type] || r.type) + '</div></div>' +
                '<span class="text-xs font-bold" style="' + statusColor + '">' + statusLabel + '</span></div>';
            }).join('');
          }
          detail.classList.remove('hidden');
        }

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
          document.getElementById('rdv-detail-type').textContent = {devis:'Devis / Dimensionnement',installation:'Installation',entretien:'Entretien / Maintenance',depannage:'Dépannage / Réparation urgente'}[a.type] || a.type;
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
          // Reset client section
          document.getElementById('rdv-client-status').textContent = 'Chargement...';
          document.getElementById('rdv-client-body').innerHTML = '<div class="flex justify-center py-2"><i class="fas fa-spinner fa-spin text-gray-500 text-lg"></i></div>';
          document.getElementById('rdv-detail-modal').classList.remove('hidden');
          // Fetch client info by phone
          fetch('/api/admin/clients/by-phone?phone=' + encodeURIComponent(a.phone || ''))
            .then(function(r){ return r.json(); })
            .then(function(d) {
              if (!d.found) {
                document.getElementById('rdv-client-status').innerHTML = '<span style="color:#f97316;"><i class="fas fa-exclamation-circle mr-1"></i>Pas de compte</span>';
                document.getElementById('rdv-client-body').innerHTML =
                  '<p class="text-xs text-gray-500 text-center py-2">Ce numéro n\'a pas de compte client enregistré.</p>' +
                  '<div class="flex justify-center"><a href="/admin/clients" class="text-xs px-3 py-1.5 rounded-xl font-semibold" style="background:rgba(59,130,246,0.15);color:#60a5fa;"><i class="fas fa-user-plus mr-1"></i>Créer un client</a></div>';
                return;
              }
              var cl = d.client;
              document.getElementById('rdv-client-status').innerHTML = '<span style="color:#34d399;"><i class="fas fa-check-circle mr-1"></i>Client enregistré</span>';
              var srcLabel = { website: 'Site web', referral: 'Parrainage', direct: 'Direct', social: 'Réseaux sociaux' };
              document.getElementById('rdv-client-body').innerHTML =
                '<div class="grid grid-cols-2 gap-2 text-xs">' +
                  '<div class="rounded-lg p-2" style="background:rgba(15,23,42,0.6);">' +
                    '<div class="text-gray-500 mb-0.5"><i class="fas fa-user mr-1"></i>Nom</div>' +
                    '<div class="font-semibold text-gray-200">' + (cl.name || '-') + '</div>' +
                  '</div>' +
                  '<div class="rounded-lg p-2" style="background:rgba(15,23,42,0.6);">' +
                    '<div class="text-gray-500 mb-0.5"><i class="fas fa-envelope mr-1"></i>Email</div>' +
                    '<div class="font-semibold text-gray-200 truncate">' + (cl.email || 'Non renseigné') + '</div>' +
                  '</div>' +
                  '<div class="rounded-lg p-2" style="background:rgba(15,23,42,0.6);">' +
                    '<div class="text-gray-500 mb-0.5"><i class="fas fa-home mr-1"></i>Adresse</div>' +
                    '<div class="font-semibold text-gray-200">' + (cl.address || cl.quartier || '-') + '</div>' +
                  '</div>' +
                  '<div class="rounded-lg p-2" style="background:rgba(15,23,42,0.6);">' +
                    '<div class="text-gray-500 mb-0.5"><i class="fas fa-calendar-alt mr-1"></i>Client depuis</div>' +
                    '<div class="font-semibold text-gray-200">' + (cl.created_at ? new Date(cl.created_at).toLocaleDateString('fr-FR') : '-') + '</div>' +
                  '</div>' +
                '</div>' +
                '<div class="flex gap-2 mt-2 text-xs">' +
                  '<div class="flex-1 rounded-lg p-2 text-center" style="background:rgba(59,130,246,0.1);">' +
                    '<div class="font-bold text-blue-300 text-base">' + (d.rdvCount || 0) + '</div>' +
                    '<div class="text-gray-500">RDV</div>' +
                  '</div>' +
                  '<div class="flex-1 rounded-lg p-2 text-center" style="background:rgba(16,185,129,0.1);">' +
                    '<div class="font-bold text-green-300 text-base">' + (d.orderCount || 0) + '</div>' +
                    '<div class="text-gray-500">Commandes</div>' +
                  '</div>' +
                  '<div class="flex-1 rounded-lg p-2 text-center" style="background:rgba(245,158,11,0.1);">' +
                    '<div class="font-bold text-amber-300 text-base">' + (d.contractCount || 0) + '</div>' +
                    '<div class="text-gray-500">Contrats</div>' +
                  '</div>' +
                '</div>' +
                '<div class="flex justify-end mt-1">' +
                  '<a href="/admin/clients" class="text-xs text-cyan-400 hover:underline"><i class="fas fa-external-link-alt mr-1"></i>Voir fiche complète</a>' +
                '</div>';
            })
            .catch(function() {
              document.getElementById('rdv-client-status').textContent = 'Erreur';
              document.getElementById('rdv-client-body').innerHTML = '<p class="text-xs text-red-400 text-center py-2">Impossible de charger la fiche client.</p>';
            });
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
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 class="text-xl font-bold text-white">Gestion des clients</h2>
          <p class="text-sm text-gray-400 mt-1">{clients.length} clients enregistrés</p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button onclick="document.getElementById('add-client-modal').classList.remove('hidden')"
            class="btn-primary font-semibold px-5 py-2.5 rounded-xl flex items-center space-x-2 text-sm shadow-md">
            <i class="fas fa-plus"></i>
            <span class="hidden sm:inline">Ajouter client</span>
            <span class="sm:hidden">Ajouter</span>
          </button>
          <a href="/api/admin/export/clients" class="text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
            <i class="fas fa-file-csv"></i>
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Pending Reset Codes */}
      <div id="reset-codes-panel" class="mb-4 rounded-2xl card-shadow p-4" style="background:#111827; border:1px solid rgba(251,191,36,0.2); display:none;">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-amber-400"><i class="fas fa-key mr-2"></i>Codes de réinitialisation en attente</h3>
          <button onclick="loadResetCodes()" class="text-xs text-gray-400 hover:text-white"><i class="fas fa-sync-alt mr-1"></i>Actualiser</button>
        </div>
        <div id="reset-codes-list" class="space-y-2 text-sm text-gray-300">
          <p class="text-xs text-gray-500">Chargement...</p>
        </div>
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
                <th class="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                <th class="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th class="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone</th>
                <th class="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Quartier</th>
                <th class="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Source</th>
                <th class="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">RDVs</th>
                <th class="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Créé le</th>
                <th class="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/30" data-paginate="20">
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
                <tr class="client-row hover:bg-cyan-900/10 transition-colors cursor-pointer" onclick={`showClientDetail(this)`} data-client={JSON.stringify(client).replace(/</g, '\u003c')} data-search={`${client.name} ${client.phone} ${client.email || ''} ${client.quartier || ''} ${client.type_demande || ''}`.toLowerCase()}>
                  <td class="py-4 px-4">
                    <div class="flex items-center space-x-3">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background:rgba(59,130,246,0.15);">
                        <span class="text-blue-400 font-bold text-xs">{client.name.charAt(0)}</span>
                      </div>
                      <span class="font-semibold text-gray-200">{client.name}</span>
                    </div>
                  </td>
                  <td class="py-4 px-4 text-gray-400 text-xs hidden md:table-cell">{client.email || '-'}</td>
                  <td class="py-4 px-4 text-gray-400 text-xs">{client.phone}</td>
                  <td class="py-4 px-4 text-gray-400 text-xs hidden lg:table-cell">{client.quartier || '-'}</td>
                  <td class="py-4 px-4 hidden sm:table-cell">
                    <span class="text-xs font-bold px-2 py-1 rounded-full" style={src.style}>{src.label}</span>
                  </td>
                  <td class="py-4 px-4 hidden lg:table-cell">
                    <span class="text-xs font-bold px-2 py-1 rounded-full" style={appointments.filter(a => a.phone === client.phone).length > 0 ? 'background:rgba(56,189,248,0.12); color:#38bdf8;' : 'background:rgba(148,163,184,0.1); color:#94a3b8;'}>{appointments.filter(a => a.phone === client.phone).length}</span>
                  </td>
                  <td class="py-4 px-4 text-gray-500 text-xs hidden md:table-cell">{client.created_at}</td>
                  <td class="py-4 px-4">
                    <div class="flex items-center space-x-1">
                      <button
                        onclick={`event.stopPropagation();showClientDetail(this.closest('tr'))`}
                        class="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg transition-colors" title="Voir détails">
                        <i class="fas fa-eye text-xs"></i>
                      </button>
                      <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Bonjour ' + client.name + ', MAASGA vous contacte.')}`} target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()"
                        class="text-green-400 hover:text-green-300 p-1.5 rounded-lg transition-colors" title="WhatsApp">
                        <i class="fab fa-whatsapp text-xs"></i>
                      </a>
                      <button 
                        onclick={`event.stopPropagation();editClient(${client.id}, '${client.name.replace(/'/g, "\\'")}', '${client.email}', '${client.phone}', '${client.quartier}')`}
                        class="text-orange-400 hover:text-orange-300 p-1.5 rounded-lg transition-colors" title="Modifier">
                        <i class="fas fa-edit text-xs"></i>
                      </button>
                      <button class="text-red-400 hover:text-red-300 p-1.5 rounded-lg transition-colors" title="Supprimer"
                        onclick={`event.stopPropagation();if(confirm('Supprimer ce client ?')) { document.getElementById('del-client-${client.id}').submit(); }`}>
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
        <div class="rounded-3xl p-4 sm:p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" style="background:#111827; border:1px solid rgba(56,189,248,0.12);">
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
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Téléphone (Whatsapp) *</label>
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
        <div class="rounded-3xl p-4 sm:p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" style="background:#111827; border:1px solid rgba(56,189,248,0.12);">
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
              <label class="block text-xs font-semibold text-gray-400 mb-1.5">Téléphone (Whatsapp) *</label>
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
        <div class="rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col" style="background:#111827; border:1px solid rgba(56,189,248,0.2); max-height:90vh;">
          {/* Header */}
          <div class="flex items-center justify-between px-4 sm:px-6 py-4 flex-shrink-0" style="background:rgba(59,130,246,0.1); border-bottom:1px solid rgba(56,189,248,0.15);">
            <h3 class="font-bold text-white text-lg flex items-center space-x-2">
              <i class="fas fa-user text-blue-400"></i>
              <span>Fiche client</span>
            </h3>
            <button onclick="document.getElementById('client-detail-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-200 p-1 transition-colors">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          {/* Tabs */}
          <div class="flex flex-shrink-0" style="background:#0e1726; border-bottom:1px solid rgba(56,189,248,0.1);">
            <button id="cd-tab-info" onclick="cdSwitchTab('info')" class="flex-1 py-3 text-xs font-semibold transition-colors cd-tab-active" style="color:#38bdf8; border-bottom:2px solid #38bdf8;">
              <i class="fas fa-id-card mr-1.5"></i>Informations
            </button>
            <button id="cd-tab-hist" onclick="cdSwitchTab('hist')" class="flex-1 py-3 text-xs font-semibold transition-colors" style="color:#64748b; border-bottom:2px solid transparent;">
              <i class="fas fa-history mr-1.5"></i>Historique
            </button>
          </div>
          {/* Body scrollable */}
          <div class="overflow-y-auto flex-1 p-4 sm:p-6">
            {/* Tab Informations */}
            <div id="cd-pane-info" class="space-y-4">
              <div class="flex items-center space-x-4">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0" style="background:rgba(59,130,246,0.2); color:#60a5fa;" id="client-detail-avatar"></div>
                <div>
                  <div class="text-lg font-bold text-white" id="client-detail-name"></div>
                  <div class="text-sm" id="client-detail-source"></div>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div class="rounded-xl p-3" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,180,220,0.1);">
                  <div class="text-xs text-gray-500 mb-1"><i class="fas fa-phone mr-1"></i>Téléphone (Whatsapp)</div>
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
            {/* Tab Historique */}
            <div id="cd-pane-hist" class="hidden space-y-5">
              <div id="cd-hist-loader" class="flex items-center justify-center py-10">
                <i class="fas fa-circle-notch fa-spin text-cyan-400 text-2xl mr-3"></i>
                <span class="text-gray-400 text-sm">Chargement...</span>
              </div>
              <div id="cd-hist-content" class="hidden space-y-5">
                {/* Maintenance */}
                <div>
                  <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                    <i class="fas fa-tools text-cyan-400"></i><span>Contrats de maintenance</span>
                    <span id="cd-contracts-count" class="ml-1 px-2 py-0.5 rounded-full text-xs" style="background:rgba(56,189,248,0.1); color:#38bdf8;"></span>
                  </div>
                  <div id="cd-contracts" class="space-y-2"></div>
                </div>
                {/* Visites */}
                <div>
                  <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                    <i class="fas fa-calendar-check text-green-400"></i><span>Visites techniques</span>
                    <span id="cd-visits-count" class="ml-1 px-2 py-0.5 rounded-full text-xs" style="background:rgba(52,211,153,0.1); color:#34d399;"></span>
                  </div>
                  <div id="cd-visits" class="space-y-2"></div>
                </div>
                {/* RDVs */}
                <div>
                  <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                    <i class="fas fa-calendar text-yellow-400"></i><span>Rendez-vous</span>
                    <span id="cd-rdvs-count" class="ml-1 px-2 py-0.5 rounded-full text-xs" style="background:rgba(251,191,36,0.1); color:#fbbf24;"></span>
                  </div>
                  <div id="cd-rdvs" class="space-y-2"></div>
                </div>
                {/* Devis */}
                <div>
                  <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                    <i class="fas fa-file-invoice text-purple-400"></i><span>Devis</span>
                    <span id="cd-devis-count" class="ml-1 px-2 py-0.5 rounded-full text-xs" style="background:rgba(167,139,250,0.1); color:#a78bfa;"></span>
                  </div>
                  <div id="cd-devis" class="space-y-2"></div>
                </div>
                {/* SAV */}
                <div>
                  <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                    <i class="fas fa-headset text-orange-400"></i><span>Tickets SAV</span>
                    <span id="cd-sav-count" class="ml-1 px-2 py-0.5 rounded-full text-xs" style="background:rgba(251,146,60,0.1); color:#fb923c;"></span>
                  </div>
                  <div id="cd-sav" class="space-y-2"></div>
                </div>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div class="px-4 sm:px-6 pb-4 sm:pb-5 pt-3 flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0" style="border-top:1px solid rgba(56,189,248,0.08);">
            <a id="client-detail-wa" href="#" target="_blank" rel="noopener noreferrer" class="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors" style="background:rgba(37,211,102,0.15); color:#25D366; border:1px solid rgba(37,211,102,0.25);">
              <i class="fab fa-whatsapp mr-2"></i>WhatsApp
            </a>
            <a id="client-detail-devis-btn" href="#" class="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors" style="background:rgba(56,189,248,0.1); color:#38bdf8; border:1px solid rgba(56,189,248,0.2);">
              <i class="fas fa-file-invoice mr-2"></i>Nouveau devis
            </a>
            <button onclick="document.getElementById('client-detail-modal').classList.add('hidden')" class="px-5 text-sm font-semibold py-2.5 rounded-xl transition-colors" style="background:rgba(148,163,184,0.1); color:#94a3b8;">
              Fermer
            </button>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function editClient(id, name, email, phone, quartier) {
          document.getElementById('edit-client-id').value = id;
          document.getElementById('edit-client-name').value = name;
          document.getElementById('edit-client-email').value = email;
          document.getElementById('edit-client-phone').value = phone;
          document.getElementById('edit-client-quartier').value = quartier;
          document.getElementById('edit-client-modal').classList.remove('hidden');
        }
        var _cdClientId = null;
        var _cdHistLoaded = false;
        function cdSwitchTab(tab) {
          var tabs = ['info', 'hist'];
          tabs.forEach(function(t) {
            var btn = document.getElementById('cd-tab-' + t);
            var pane = document.getElementById('cd-pane-' + t);
            if (t === tab) {
              btn.style.color = '#38bdf8'; btn.style.borderBottomColor = '#38bdf8';
              pane.classList.remove('hidden');
            } else {
              btn.style.color = '#64748b'; btn.style.borderBottomColor = 'transparent';
              pane.classList.add('hidden');
            }
          });
          if (tab === 'hist' && _cdClientId && !_cdHistLoaded) {
            loadClientHistory(_cdClientId);
          }
        }
        function loadClientHistory(id) {
          _cdHistLoaded = true;
          var loader = document.getElementById('cd-hist-loader');
          var content = document.getElementById('cd-hist-content');
          loader.classList.remove('hidden');
          content.classList.add('hidden');
          fetch('/api/admin/clients/' + id + '/detail').then(function(r) { return r.json(); }).then(function(d) {
            loader.classList.add('hidden');
            content.classList.remove('hidden');
            var planLabels = { trimestriel: 'Trimestriel', semestriel: 'Semestriel', annuel: 'Annuel' };
            var statusColors = { active: '#34d399', expired: '#f87171', cancelled: '#94a3b8', planifiee: '#fbbf24', realisee: '#34d399', annulee: '#f87171' };
            // Contracts
            var c = document.getElementById('cd-contracts');
            document.getElementById('cd-contracts-count').textContent = d.contracts.length;
            c.innerHTML = d.contracts.length ? d.contracts.map(function(x) {
              return '<div class="rounded-xl p-3 text-xs flex items-center justify-between" style="background:rgba(15,23,42,0.6);border:1px solid rgba(56,189,248,0.1);">'
                + '<div><span class="font-semibold text-gray-200">' + (planLabels[x.plan_type] || x.plan_type) + '</span>'
                + '<span class="ml-2 text-gray-500">' + (x.start_date||'') + ' → ' + (x.end_date||'') + '</span>'
                + '<span class="ml-2 text-gray-400">' + x.completed_visits + '/' + x.total_visits + ' visites</span></div>'
                + '<span class="px-2 py-0.5 rounded-full font-bold" style="background:rgba(52,211,153,0.1);color:' + (statusColors[x.status]||'#94a3b8') + ';">'
                + ((x.status==='active')?'Actif':(x.status==='expired')?'Expiré':'Annulé') + '</span></div>';
            }).join('') : '<p class="text-xs text-gray-600 py-2">Aucun contrat</p>';
            // Visits
            var v = document.getElementById('cd-visits');
            document.getElementById('cd-visits-count').textContent = d.visits.length;
            v.innerHTML = d.visits.length ? d.visits.map(function(x) {
              return '<div class="rounded-xl p-3 text-xs flex items-center justify-between" style="background:rgba(15,23,42,0.6);border:1px solid rgba(52,211,153,0.08);">'
                + '<div><span class="font-semibold text-gray-200">' + (x.visit_type==='preventive'?'Préventive':'Corrective') + '</span>'
                + '<span class="ml-2 text-gray-500">' + (x.visit_date||'') + '</span>'
                + (x.technician ? '<span class="ml-2 text-gray-500">— ' + x.technician + '</span>' : '') + '</div>'
                + '<span class="px-2 py-0.5 rounded-full font-bold" style="background:rgba(251,191,36,0.1);color:' + (statusColors[x.status]||'#94a3b8') + ';">'
                + ((x.status==='planifiee')?'Planifiée':(x.status==='realisee')?'Réalisée':'Annulée') + '</span></div>';
            }).join('') : '<p class="text-xs text-gray-600 py-2">Aucune visite</p>';
            // RDVs
            var r = document.getElementById('cd-rdvs');
            document.getElementById('cd-rdvs-count').textContent = d.rdvs.length;
            r.innerHTML = d.rdvs.length ? d.rdvs.map(function(x) {
              return '<div class="rounded-xl p-3 text-xs flex items-center justify-between" style="background:rgba(15,23,42,0.6);border:1px solid rgba(251,191,36,0.08);">'
                + '<div><span class="font-semibold text-gray-200">' + (x.type||'RDV') + '</span>'
                + '<span class="ml-2 text-gray-500">' + (x.date||'') + (x.heure_debut?' à '+x.heure_debut:'') + '</span></div>'
                + '<span class="text-xs" style="color:#fbbf24;">' + (x.status||'') + '</span></div>';
            }).join('') : '<p class="text-xs text-gray-600 py-2">Aucun rendez-vous</p>';
            // Devis
            var dv = document.getElementById('cd-devis');
            document.getElementById('cd-devis-count').textContent = d.devis.length;
            dv.innerHTML = d.devis.length ? d.devis.map(function(x) {
              var sc = {draft:'#94a3b8',sent:'#38bdf8',accepted:'#34d399',rejected:'#f87171',expired:'#f59e0b'};
              return '<div class="rounded-xl p-3 text-xs flex items-center justify-between" style="background:rgba(15,23,42,0.6);border:1px solid rgba(167,139,250,0.08);">'
                + '<div><span class="font-semibold text-gray-200">' + (x.numero||'#'+x.id) + '</span>'
                + '<span class="ml-2 text-gray-500">' + (x.produit_nom||'') + '</span>'
                + '<span class="ml-2 text-gray-400">' + (x.total_ht?(parseInt(x.total_ht).toLocaleString('fr-FR')+' F'):'') + '</span></div>'
                + '<span class="px-2 py-0.5 rounded-full font-bold text-xs" style="background:rgba(167,139,250,0.1);color:' + (sc[x.status]||'#94a3b8') + ';">' + (x.status||'') + '</span></div>';
            }).join('') : '<p class="text-xs text-gray-600 py-2">Aucun devis</p>';
            // SAV
            var s = document.getElementById('cd-sav');
            document.getElementById('cd-sav-count').textContent = d.sav.length;
            s.innerHTML = d.sav.length ? d.sav.map(function(x) {
              var pc = {haute:'#f87171',normale:'#fbbf24',basse:'#94a3b8'};
              return '<div class="rounded-xl p-3 text-xs" style="background:rgba(15,23,42,0.6);border:1px solid rgba(251,146,60,0.08);">'
                + '<div class="flex items-center justify-between mb-1">'
                + '<span class="font-semibold text-gray-200">' + (x.ticket_ref||'#'+x.id) + '</span>'
                + '<span class="px-2 py-0.5 rounded-full font-bold" style="background:rgba(251,146,60,0.1);color:' + (pc[x.priority]||'#94a3b8') + ';">' + (x.priority||'') + '</span></div>'
                + '<p class="text-gray-400">' + (x.subject||'') + '</p></div>';
            }).join('') : '<p class="text-xs text-gray-600 py-2">Aucun ticket SAV</p>';
          }).catch(function() {
            loader.classList.add('hidden');
            content.innerHTML = '<p class="text-center text-xs text-red-400 py-4"><i class="fas fa-exclamation-circle mr-1"></i>Erreur de chargement</p>';
            content.classList.remove('hidden');
          });
        }
        function showClientDetail(el) {
          var c;
          try { c = JSON.parse(el.getAttribute('data-client')); } catch(e) { console.error('showClientDetail parse error:', e); return; }
          _cdClientId = c.id || null;
          _cdHistLoaded = false;
          cdSwitchTab('info');
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
          document.getElementById('client-detail-devis-btn').href = '/admin/devis/new' + (c.id ? '?client_id=' + c.id : '');
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
          const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\\n');
          const a = document.createElement('a');
          a.href = 'data:text/csv;charset=utf-8,\\uFEFF' + encodeURIComponent(csv);
          a.download = 'clients_maasga.csv';
          a.click();
        }
        function loadResetCodes() {
          fetch('/api/admin/reset-codes').then(r => r.json()).then(function(data) {
            var panel = document.getElementById('reset-codes-panel');
            var list = document.getElementById('reset-codes-list');
            if (!data.codes || data.codes.length === 0) {
              panel.style.display = 'none';
              return;
            }
            panel.style.display = 'block';
            list.innerHTML = data.codes.map(function(c) {
              var mins = Math.max(0, Math.round((15*60*1000 - (Date.now() - c.created_at)) / 60000));
              var contact = c.phone || c.email || '-';
              return '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg" style="background:rgba(251,191,36,0.05); border:1px solid rgba(251,191,36,0.1);">'
                + '<div class="flex-1"><span class="font-mono text-amber-300 font-bold text-lg mr-3">' + c.code + '</span>'
                + '<span class="text-gray-400 text-xs">' + contact + '</span>'
                + '<span class="text-gray-600 text-xs ml-2">(' + mins + ' min restantes)</span></div>'
                + '<button onclick="sendResetCodeWA(\\'' + c.token + '\\')" class="text-xs px-3 py-1.5 rounded-lg font-semibold" style="background:#25d366; color:white;"><i class="fab fa-whatsapp mr-1"></i>Envoyer via WhatsApp</button>'
                + '</div>';
            }).join('');
          }).catch(function() {});
        }
        function sendResetCodeWA(token) {
          fetch('/api/admin/reset-codes/' + token + '/whatsapp').then(r => r.json()).then(function(data) {
            if (data.url) window.open(data.url, '_blank');
          }).catch(function() {});
        }
        loadResetCodes();
      ` }} />
    </AdminLayout>
  )
}

// ============================================================
// PAGE COMMANDES
// ============================================================

export const AdminCommandesPage = ({ payments = [] }: { payments?: any[] } = {}) => {
  // Séparer commandes en ligne vs commandes terrain
  const onlineOrders = orders.filter(o => !o.appointment_id && (o.type === 'vente' || o.type === 'commande'))
  const terrainOrders = orders.filter(o => o.appointment_id)
  const pendingAppointments = appointments.filter(a => a.status === 'pending')

  // Map des paiements par order_id pour affichage rapide
  const paymentsByOrder: Record<number, any> = {}
  payments.forEach((p: any) => { if (p.order_id) paymentsByOrder[p.order_id] = p })

  // KPIs
  const totalOrders = orders.length
  const paidOrders = orders.filter(o => o.status === 'confirme' || o.status === 'en_livraison' || o.status === 'livre').length
  const installedOrders = orders.filter(o => o.status === 'installed').length
  const pendingOnline = onlineOrders.filter(o => o.status === 'en_attente').length
  const estimatedCA = orders.reduce((sum, o) => sum + (o.total_price || 0), 0)

  // Helper: label et couleur du statut
  const statusInfo = (status: string, hasPayment: boolean) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      'en_attente': { label: '⏳ En attente', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
      'contacte': { label: '💬 Client contacté', color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' },
      'confirme': { label: '✅ Confirmée', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
      'en_livraison': { label: '🚚 En livraison', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
      'livre': { label: '🏠 Livrée & Installée', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
      'annule': { label: '❌ Annulée', color: '#f87171', bg: 'rgba(248,113,113,0.12)' }
    }
    return map[status] || { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' }
  }

  // Helper: label type
  const typeLabel = (type: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      'vente': { label: 'Achat en ligne', color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
      'commande': { label: 'Commande', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)' },
      'devis': { label: 'Devis', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)' },
      'installation': { label: 'Installation', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' }
    }
    return map[type] || { label: type, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' }
  }

  return (
  <AdminLayout activePage="commandes">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 class="text-xl font-bold text-white">Gestion des commandes</h2>
        <p class="text-sm text-gray-400 mt-1">Commandes en ligne, commandes terrain et historique</p>
      </div>
      <a href="/api/admin/export/orders" class="text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
        <i class="fas fa-file-csv"></i>
        <span>Export CSV</span>
      </a>
    </div>

    {/* KPIs commandes */}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {[
        { label: "Total commandes", val: totalOrders, icon: "fa-shopping-bag", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)", color: "#60a5fa" },
        { label: "Payées", val: paidOrders, icon: "fa-credit-card", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", color: "#34d399" },
        { label: "Installées", val: installedOrders, icon: "fa-tools", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.2)", color: "#38bdf8" },
        { label: "En attente", val: pendingOnline, icon: "fa-hourglass-half", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.2)", color: "#fbbf24" },
        { label: "CA total", val: estimatedCA.toLocaleString('fr-FR') + ' F', icon: "fa-coins", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.2)", color: "#fbbf24" }
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

    {/* Deux processus possibles */}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="rounded-2xl p-4" style="background:rgba(52,211,153,0.08); border:1px solid rgba(52,211,153,0.2);">
        <h4 class="font-semibold text-green-300 mb-2 flex items-center space-x-2 text-sm">
          <i class="fas fa-shopping-cart text-green-400"></i>
          <span>Processus achat en ligne</span>
        </h4>
        <div class="flex flex-wrap gap-1.5 items-center text-xs text-green-300">
          {["Commande", "→", "Paiement", "→", "Livraison", "→", "Validation", "→", "Devis", "→", "Installation", "→", "SAV gratuit"].map((step) => (
            step === "→" ? <i class="fas fa-arrow-right text-green-500/50 text-[10px]"></i> :
            <span class="px-2 py-1 rounded-lg font-medium" style="background:rgba(52,211,153,0.12); border:1px solid rgba(52,211,153,0.2);">{step}</span>
          ))}
        </div>
      </div>
      <div class="rounded-2xl p-4" style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2);">
        <h4 class="font-semibold text-blue-300 mb-2 flex items-center space-x-2 text-sm">
          <i class="fas fa-map-marked-alt text-blue-400"></i>
          <span>Processus terrain (RDV)</span>
        </h4>
        <div class="flex flex-wrap gap-1.5 items-center text-xs text-blue-300">
          {["RDV", "→", "Visite", "→", "Validation", "→", "Commande", "→", "Devis", "→", "Installation"].map((step) => (
            step === "→" ? <i class="fas fa-arrow-right text-blue-500/50 text-[10px]"></i> :
            <span class="px-2 py-1 rounded-lg font-medium" style="background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.2);">{step}</span>
          ))}
        </div>
      </div>
    </div>

    {/* ============================================ */}
    {/* SECTION 1: COMMANDES EN LIGNE (catalogue)   */}
    {/* ============================================ */}
    <div class="rounded-2xl card-shadow overflow-hidden mb-6" style="background:rgba(52,211,153,0.06); border:2px solid rgba(52,211,153,0.25);">
      <div class="p-5 flex items-center justify-between" style="border-bottom:1px solid rgba(52,211,153,0.15);">
        <div>
          <h3 class="font-bold text-white flex items-center space-x-2">
            <i class="fas fa-shopping-cart text-green-400"></i>
            <span>Commandes en ligne</span>
          </h3>
          <p class="text-xs text-gray-400 mt-0.5">Achats depuis le catalogue — paiement direct, pas de validation terrain</p>
        </div>
        <span class="text-lg font-bold text-green-400 px-3 py-1 rounded-lg" style="background:rgba(52,211,153,0.12);">{onlineOrders.length}</span>
      </div>
      {onlineOrders.length > 0 ? (
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead style="background:rgba(52,211,153,0.08);">
              <tr>
                <th class="text-left py-3 px-4 text-xs font-semibold text-green-400/80 uppercase tracking-wider hidden lg:table-cell">#ID</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-green-400/80 uppercase tracking-wider">Client</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-green-400/80 uppercase tracking-wider hidden md:table-cell">Produit / Notes</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-green-400/80 uppercase tracking-wider">Montant</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-green-400/80 uppercase tracking-wider hidden md:table-cell">Paiement</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-green-400/80 uppercase tracking-wider">Statut</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-green-400/80 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-green-400/80 uppercase tracking-wider hidden sm:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/30" data-paginate="15">
              {onlineOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(o => {
                const payment = paymentsByOrder[o.id]
                const si = statusInfo(o.status, !!payment)
                const paymentStatus = payment ? (payment.status === 'completed' ? '✅ Payé' : payment.status === 'pending' ? '⏳ En attente' : payment.status === 'failed' ? '❌ Échoué' : payment.status) : '—'
                const paymentColor = payment ? (payment.status === 'completed' ? '#34d399' : payment.status === 'pending' ? '#fbbf24' : '#f87171') : '#94a3b8'
                return (
                <tr class="hover:bg-green-900/10 transition-colors" data-order-id={String(o.id)}>
                  <td class="py-3 px-4 text-xs text-gray-500 font-mono font-bold hidden lg:table-cell">#CMD-{String(o.id).padStart(4, '0')}</td>
                  <td class="py-3 px-4">
                    <div class="font-semibold text-gray-200 text-sm">{o.client_name}</div>
                    <div class="text-xs text-gray-500">{o.client_phone}</div>
                  </td>
                  <td class="py-3 px-4 text-xs text-gray-400 max-w-[200px] truncate hidden md:table-cell">{o.notes || '—'}</td>
                  <td class="py-3 px-4 text-sm font-bold text-white">{o.total_price ? o.total_price.toLocaleString('fr-FR') + ' F' : '—'}</td>
                  <td class="py-3 px-4 hidden md:table-cell">
                    <span class="text-xs font-semibold" style={`color:${paymentColor};`}>{paymentStatus}</span>
                    {payment?.method && <div class="text-[10px] text-gray-500 mt-0.5">{payment.method}</div>}
                  </td>
                  <td class="py-3 px-4">
                    <span class="status-badge text-xs px-2.5 py-1 rounded-full font-semibold" style={`background:${si.bg}; color:${si.color};`}>{si.label}</span>
                  </td>
                  <td class="py-3 px-4 text-xs text-gray-500 hidden sm:table-cell">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                  <td class="py-3 px-4 hidden sm:table-cell">
                    <div class="flex items-center gap-2 flex-wrap">
                      {/* Status dropdown — contextual next steps only */}
                      <select data-order-id={String(o.id)} name={`status-${o.id}`} onchange={`updateOrderStatus(${o.id}, this.value)`} class="text-xs border px-2 py-1.5 rounded-lg font-medium cursor-pointer" style="background:rgba(59,130,246,0.1); border-color:rgba(59,130,246,0.25); color:#60a5fa;">
                        <option value={o.status} selected>
                          {({ en_attente:'⏳ En attente', contacte:'💬 Client contacté', confirme:'✅ Confirmée', en_livraison:'🚚 En livraison', livre:'🏠 Livrée & Installée', annule:'❌ Annulée' } as Record<string,string>)[o.status] || o.status}
                        </option>
                        {o.status === 'en_attente' && <option value="contacte">→ Marquer contacté</option>}
                        {o.status === 'contacte' && <option value="confirme">→ Marquer confirmée</option>}
                        {o.status === 'confirme' && <option value="en_livraison">→ Envoyer en livraison</option>}
                        {o.status === 'en_livraison' && <option value="livre">→ Marquer livrée & installée</option>}
                        {o.status !== 'livre' && o.status !== 'annule' && <option value="annule">⛔ Annuler</option>}
                      </select>
                      {/* Créer devis pour cette commande */}
                      {(o.status === 'livre' || o.status === 'validation_terrain' || o.status === 'paid') && (
                        <button onclick={`openDevisModal(${o.id}, '${o.client_name.replace(/'/g, "\\'")}', '${o.client_phone}')`} class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap" style="background:rgba(245,158,11,0.12); color:#f59e0b; border:1px solid rgba(245,158,11,0.2);">
                          <i class="fas fa-file-invoice-dollar mr-1"></i>Créer devis
                        </button>
                      )}
                      <a href={`/api/order/invoice/${o.id}`} target="_blank" rel="noopener noreferrer" class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap" style="background:rgba(16,185,129,0.12); color:#34d399;">
                        <i class="fas fa-file-invoice mr-1"></i>Facture
                      </a>
                      <a href={`/admin/devis/new?order_id=${o.id}`} class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap" style="background:rgba(239,68,68,0.12); color:#f87171;">
                        <i class="fas fa-file-pdf mr-1"></i>Devis
                      </a>
                      <form method="post" action="/api/admin/commande/delete" style="display:inline" onsubmit="return confirm('Supprimer cette commande ?')">
                        <input type="hidden" name="id" value={String(o.id)} />
                        <button type="submit" class="text-xs px-2 py-1.5 rounded-lg font-medium" style="background:rgba(239,68,68,0.15); color:#f87171;">
                          <i class="fas fa-trash"></i>
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      ) : (
        <div class="p-8 text-center" style="background:rgba(15,23,42,0.4);">
          <i class="fas fa-shopping-cart text-3xl text-gray-600 mb-3"></i>
          <p class="text-gray-400">Aucune commande en ligne pour le moment</p>
        </div>
      )}
    </div>

    {/* ============================================ */}
    {/* SECTION 2: Commandes TERRAIN (depuis RDV)    */}
    {/* ============================================ */}
    <div class="rounded-2xl card-shadow overflow-hidden mb-6" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
      <div class="p-5 flex items-center justify-between" style="border-bottom:1px solid rgba(148,180,220,0.08);">
        <div>
          <h3 class="font-semibold text-gray-200 flex items-center space-x-2">
            <i class="fas fa-map-marked-alt text-blue-400"></i>
            <span>Commandes terrain</span>
          </h3>
          <p class="text-xs text-gray-500 mt-0.5">Créées depuis la validation terrain d'un RDV</p>
        </div>
        <span class="text-sm font-bold px-3 py-1 rounded-lg" style="color:#38bdf8; background:rgba(56,189,248,0.1);">{terrainOrders.length}</span>
      </div>
      {terrainOrders.length > 0 ? (
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead style="background:#0e1726;">
              <tr>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">#ID</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Quartier</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/30" data-paginate="15">
              {terrainOrders.map(o => {
                const si = statusInfo(o.status, false)
                const tl = typeLabel(o.type)
                return (
                <tr class="hover:bg-cyan-900/10 transition-colors">
                  <td class="py-3 px-4 text-xs text-gray-500 font-mono font-bold hidden lg:table-cell">#CMD-{String(o.id).padStart(4, '0')}</td>
                  <td class="py-3 px-4">
                    <div class="font-semibold text-gray-200 text-sm">{o.client_name}</div>
                    <div class="text-xs text-gray-500">{o.client_phone}</div>
                  </td>
                  <td class="py-3 px-4 hidden sm:table-cell">
                    <span class="text-xs px-2 py-1 rounded-full font-medium" style={`background:${tl.bg}; color:${tl.color};`}>{tl.label}</span>
                  </td>
                  <td class="py-3 px-4 text-xs text-gray-400 hidden md:table-cell"><i class="fas fa-map-marker-alt text-primary-500 mr-1"></i>{o.quartier}</td>
                  <td class="py-3 px-4">
                    <span class="text-xs px-2.5 py-1 rounded-full font-semibold" style={`background:${si.bg}; color:${si.color};`}>{si.label}</span>
                  </td>
                  <td class="py-3 px-4 text-xs text-gray-500 hidden md:table-cell">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                  <td class="py-3 px-4 hidden sm:table-cell">
                    <a href={`/api/order/invoice/${o.id}`} target="_blank" rel="noopener noreferrer" class="text-xs px-2.5 py-1.5 rounded-lg font-medium" style="background:rgba(16,185,129,0.12); color:#34d399;">
                      <i class="fas fa-file-invoice mr-1"></i>Facture
                    </a>
                    {o.appointment_id && (
                      <a href={`/api/devis/${o.appointment_id}`} target="_blank" rel="noopener noreferrer" class="text-xs px-2.5 py-1.5 rounded-lg font-medium" style="background:rgba(239,68,68,0.12); color:#f87171;">
                        <i class="fas fa-file-pdf mr-1"></i>Devis
                      </a>
                    )}
                    <select name={`status-${o.id}`} onchange={`updateOrderStatus(${o.id}, this.value)`} class="text-xs border px-2 py-1.5 rounded-lg font-medium cursor-pointer" style="background:rgba(59,130,246,0.1); border-color:rgba(59,130,246,0.25); color:#60a5fa;">
                      <option value="validation_terrain" selected={o.status === 'validation_terrain'}>Validation terrain</option>
                      <option value="validated" selected={o.status === 'validated'}>Validée</option>
                      <option value="devis_en_attente" selected={o.status === 'devis_en_attente'}>Devis en attente</option>
                      <option value="devis_valide" selected={o.status === 'devis_valide'}>Devis validé</option>
                      <option value="installing" selected={o.status === 'installing'}>En installation</option>
                      <option value="installed" selected={o.status === 'installed'}>Installée</option>
                      <option value="cancelled" selected={o.status === 'cancelled'}>Annulée</option>
                    </select>
                    {(o.status === 'validated' || o.status === 'validation_terrain') && (
                      <button onclick={`openDevisModal(${o.id}, '${o.client_name.replace(/'/g, "\\'")}', '${o.client_phone}')`} class="text-xs px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap" style="background:rgba(245,158,11,0.12); color:#f59e0b; border:1px solid rgba(245,158,11,0.2);">
                        <i class="fas fa-file-invoice-dollar mr-1"></i>Devis
                      </button>
                    )}
                    <form method="post" action="/api/admin/commande/delete" style="display:inline" onsubmit="return confirm('Supprimer ?')">
                      <input type="hidden" name="id" value={String(o.id)} />
                      <button type="submit" class="text-xs px-2 py-1.5 rounded-lg font-medium" style="background:rgba(239,68,68,0.15); color:#f87171;">
                        <i class="fas fa-trash"></i>
                      </button>
                    </form>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      ) : (
        <div class="p-8 text-center">
          <i class="fas fa-inbox text-3xl text-gray-600 mb-3"></i>
          <p class="text-gray-400">Aucune commande terrain</p>
        </div>
      )}
    </div>

    {/* ============================================ */}
    {/* SECTION 3: RDV en attente (pour terrain)     */}
    {/* ============================================ */}
    <div class="rounded-2xl card-shadow overflow-hidden mb-6" style="background:rgba(234,179,8,0.06); border:2px solid rgba(234,179,8,0.25);">
      <div class="p-5 flex items-center justify-between" style="border-bottom:1px solid rgba(234,179,8,0.15);">
        <div>
          <h3 class="font-bold text-white flex items-center space-x-2">
            <i class="fas fa-map text-yellow-500"></i>
            <span>RDV en attente de validation terrain</span>
          </h3>
          <p class="text-xs text-gray-400 mt-0.5">Visitez le client et validez pour créer une commande terrain</p>
        </div>
        <span class="text-lg font-bold text-yellow-400 px-3 py-1 rounded-lg" style="background:rgba(234,179,8,0.12);">{pendingAppointments.length}</span>
      </div>
      {pendingAppointments.length > 0 ? (
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead style="background:rgba(234,179,8,0.08);">
              <tr>
                <th class="text-left py-3 px-4 text-xs font-semibold text-yellow-400/80 uppercase tracking-wider">Client</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-yellow-400/80 uppercase tracking-wider hidden sm:table-cell">Téléphone</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-yellow-400/80 uppercase tracking-wider hidden md:table-cell">Quartier</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-yellow-400/80 uppercase tracking-wider hidden sm:table-cell">Date RDV</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-yellow-400/80 uppercase tracking-wider hidden lg:table-cell">Type</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-yellow-400/80 uppercase tracking-wider hidden lg:table-cell">Localisation</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-yellow-400/80 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/30" data-paginate="10">
              {pendingAppointments.map(a => (
                <tr class="hover:bg-yellow-900/10 transition-colors">
                  <td class="py-3 px-4 font-semibold text-gray-200">{a.name}</td>
                  <td class="py-3 px-4 text-xs text-gray-400 hidden sm:table-cell">{a.phone}</td>
                  <td class="py-3 px-4 text-xs text-gray-400 hidden md:table-cell"><i class="fas fa-map-marker-alt text-primary-500 mr-1"></i>{a.quartier}</td>
                  <td class="py-3 px-4 text-xs text-gray-400 hidden sm:table-cell">{a.date}</td>
                  <td class="py-3 px-4 hidden lg:table-cell">
                    <span class="text-xs px-2 py-1 rounded-full font-medium" style={a.type === 'devis' ? 'background:rgba(59,130,246,0.15); color:#60a5fa;' : 'background:rgba(16,185,129,0.15); color:#34d399;'}>
                      {a.type === 'devis' ? 'Devis' : 'Installation'}
                    </span>
                  </td>
                  <td class="py-3 px-4 hidden lg:table-cell">
                    {a.latitude && a.longitude ? (
                      <span class="text-xs text-green-400 font-medium"><i class="fas fa-check-circle mr-1"></i>Localisé</span>
                    ) : (
                      <span class="text-xs text-gray-500">—</span>
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

    {/* Statistiques rapides */}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {[
        { label: "Commandes en ligne", val: onlineOrders.length, icon: "fa-shopping-cart", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.2)", iconColor: "text-green-400" },
        { label: "Commandes terrain", val: terrainOrders.length, icon: "fa-map-marked-alt", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)", iconColor: "text-blue-400" },
        { label: "RDV en attente", val: pendingAppointments.length, icon: "fa-hourglass-half", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.2)", iconColor: "text-yellow-400" },
        { label: "Installations faites", val: orders.filter(o => o.status === 'installed').length, icon: "fa-check-circle", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", iconColor: "text-green-400" }
      ].map(s => (
        <div class="rounded-xl p-4 text-center card-shadow" style={`background:${s.bg}; border:1px solid ${s.border};`}>
          <i class={`fas ${s.icon} ${s.iconColor} text-xl mb-2`}></i>
          <div class="text-xl font-bold text-white">{typeof s.val === 'number' ? s.val : s.val}</div>
          <div class="text-xs text-gray-400 mt-1">{s.label}</div>
        </div>
      ))}
    </div>

    {/* MODAL DÉTAILS CLIENT - COMMANDES (pour RDV uniquement) */}
    <div id="client-detail-modal-cmd" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="rounded-2xl w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
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
          <div class="rounded-xl overflow-hidden" style="height: 300px; background:#0e1726; border:1px solid rgba(148,180,220,0.1);">
            <iframe id="cmd-client-map-iframe" width="100%" height="100%" style="border:0" loading="lazy"></iframe>
          </div>
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
          <div>
            <label class="text-xs text-gray-400 uppercase font-semibold">Adresse précise</label>
            <div id="cmd-client-address" class="text-sm text-gray-300 p-3 rounded mt-1" style="background:rgba(15,23,42,0.5);"></div>
          </div>
          <div id="cmd-client-notes-container" class="hidden">
            <label class="text-xs text-gray-400 uppercase font-semibold">Notes</label>
            <div id="cmd-client-notes" class="text-sm text-gray-300 p-3 rounded mt-1" style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2);"></div>
          </div>
          <div class="rounded-xl p-4" style="background:rgba(168,85,247,0.08); border:1px solid rgba(168,85,247,0.2);">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-gray-400 uppercase font-semibold">Statut RDV</div>
                <div id="cmd-client-status" class="text-lg font-bold text-white mt-1"></div>
              </div>
              <div id="cmd-client-status-icon" class="text-3xl"></div>
            </div>
          </div>
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
      const appointmentsDataCmd = ${JSON.stringify(appointments)};
      let currentAppointmentCmd = null;

      function clickClientRow(appointmentId) {
        const appointment = appointmentsDataCmd.find(a => a.id === appointmentId);
        if (!appointment) return;
        currentAppointmentCmd = appointment;
        document.getElementById('cmd-client-name').textContent = appointment.name;
        document.getElementById('cmd-client-phone').textContent = appointment.phone;
        document.getElementById('cmd-client-quartier').textContent = appointment.quartier;
        document.getElementById('cmd-client-date').textContent = appointment.date;
        document.getElementById('cmd-client-type').textContent = appointment.type === 'devis' ? 'Demande de devis' : 'Installation';
        const statusMap = { 'pending': { text: 'En attente de confirmation', emoji: '⏳' }, 'confirmed': { text: 'Confirmé', emoji: '✅' }, 'done': { text: 'Terminé', emoji: '✔' } };
        const status = statusMap[appointment.status] || { text: appointment.status, emoji: '' };
        document.getElementById('cmd-client-status').textContent = status.text;
        document.getElementById('cmd-client-status-icon').textContent = status.emoji;
        if (appointment.latitude && appointment.longitude) {
          document.getElementById('cmd-client-map-iframe').src = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3955!2d' + appointment.longitude + '!3d' + appointment.latitude + '!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sfr!2sbf';
          document.getElementById('cmd-client-latitude').textContent = appointment.latitude.toFixed(6);
          document.getElementById('cmd-client-longitude').textContent = appointment.longitude.toFixed(6);
        } else {
          document.getElementById('cmd-client-map-iframe').src = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3955!2d-1.5209!3d12.3651!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1sOuagadougou!2sBurkina%20Faso!5e0!3m2!1sfr!2sfr';
          document.getElementById('cmd-client-latitude').textContent = 'Non défini';
          document.getElementById('cmd-client-longitude').textContent = 'Non défini';
        }
        document.getElementById('cmd-client-address').textContent = appointment.adresse_precise || appointment.quartier || 'Non défini';
        if (appointment.notes) {
          document.getElementById('cmd-client-notes-container').classList.remove('hidden');
          document.getElementById('cmd-client-notes').textContent = appointment.notes;
        } else {
          document.getElementById('cmd-client-notes-container').classList.add('hidden');
        }
        document.getElementById('cmd-order-action-container').classList.toggle('hidden', appointment.status === 'confirmed' || appointment.status === 'done');
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
        }).then(r => r.json()).then(data => {
          if (data.success) {
            showToast('Commande terrain créée avec succès !', 'success');
            closeClientModalCmd();
            window.location.reload();
          } else {
            showToast('Erreur: ' + (data.error || 'Impossible de créer la commande'), 'error');
          }
        }).catch(e => showToast('Erreur: ' + e.message, 'error'));
      }

      function validateVisitCmd() {
        if (!currentAppointmentCmd) return;
        if (!confirm('Confirmer la visite sans créer de commande ?')) return;
        fetch('/api/admin/rdv/validate-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointment_id: currentAppointmentCmd.id })
        }).then(r => r.json()).then(data => {
          if (data.success) {
            showToast('Visite validée !', 'success');
            closeClientModalCmd();
            window.location.reload();
          } else {
            showToast('Erreur: ' + (data.error || 'Impossible de valider'), 'error');
          }
        }).catch(e => showToast('Erreur: ' + e.message, 'error'));
      }

      document.getElementById('client-detail-modal-cmd')?.addEventListener('click', function(e) {
        if (e.target === this) closeClientModalCmd();
      });

      function updateOrderStatus(orderId, newStatus) {
        var sel = document.querySelector('select[data-order-id="' + orderId + '"]');
        if (sel) { sel.disabled = true; sel.style.opacity = '0.5'; }
        var fd = new FormData();
        fd.append('id', String(orderId));
        fd.append('status', String(newStatus));
        fetch('/api/admin/commande/update-statut', { method: 'POST', body: fd, credentials: 'same-origin' })
          .then(function(r) {
            // Expect redirect (3xx) or 200 — any non-5xx is a success
            if (r.ok || r.redirected || r.status < 500) {
              showToast('Statut mis à jour ✓', 'success');
              // Update badge in row without page reload
              var row = document.querySelector('tr[data-order-id="' + orderId + '"]');
              if (row) {
                var badge = row.querySelector('.status-badge');
                var statusLabels = { pending:'En attente', paid:'Payée', en_livraison:'En livraison', livre:'Livrée',
                  validation_terrain:'Visite terrain', devis_en_attente:'Devis en attente', devis_valide:'Devis validé',
                  devis_refuse:'Devis refusé', validated:'Validée', installing:'En installation',
                  installed:'Installée', cancelled:'Annulée', refunded:'Remboursée' };
                if (badge) badge.textContent = statusLabels[newStatus] || newStatus;
              }
            } else {
              showToast('Erreur mise à jour statut', 'error');
            }
            if (sel) { sel.disabled = false; sel.style.opacity = ''; }
          })
          .catch(function(e) {
            showToast('Erreur réseau: ' + e.message, 'error');
            if (sel) { sel.disabled = false; sel.style.opacity = ''; }
          });
      }

      function openDevisModal(orderId, clientName, clientPhone) {
        var existing = document.getElementById('devis-create-modal');
        if (existing) existing.remove();
        var modal = document.createElement('div');
        modal.id = 'devis-create-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;';
        modal.innerHTML = '<div style="background:#1e293b;border-radius:16px;max-width:520px;width:100%;max-height:90vh;overflow-y:auto;padding:24px;border:1px solid rgba(59,130,246,0.2);">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
          + '<h3 style="font-size:16px;font-weight:700;color:white;">Créer un devis — Commande #' + orderId + '</h3>'
          + '<button onclick="document.getElementById(\'devis-create-modal\').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#94a3b8;">&times;</button></div>'
          + '<p style="font-size:12px;color:#94a3b8;margin-bottom:16px;">Client: ' + clientName + ' (' + clientPhone + ')</p>'
          + '<form method="POST" action="/api/admin/order/create-devis">'
          + '<input type="hidden" name="order_id" value="' + orderId + '">'
          + '<div style="margin-bottom:12px;"><label style="font-size:12px;font-weight:600;color:#cbd5e1;display:block;margin-bottom:4px;">Titre du devis</label>'
          + '<input type="text" name="title" value="Devis installation climatiseur" required style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid rgba(59,130,246,0.25);background:rgba(15,23,42,0.6);color:white;font-size:13px;"></div>'
          + '<div style="margin-bottom:12px;"><label style="font-size:12px;font-weight:600;color:#cbd5e1;display:block;margin-bottom:4px;">Description</label>'
          + '<textarea name="description" rows="2" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid rgba(59,130,246,0.25);background:rgba(15,23,42,0.6);color:white;font-size:13px;" placeholder="Détails de l\'installation..."></textarea></div>'
          + '<div style="margin-bottom:12px;"><label style="font-size:12px;font-weight:600;color:#cbd5e1;display:block;margin-bottom:4px;">Éléments (JSON)</label>'
          + '<textarea name="items" rows="3" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid rgba(59,130,246,0.25);background:rgba(15,23,42,0.6);color:white;font-size:12px;font-family:monospace;" placeholder=\'[{"name":"Installation split","amount":50000},{"name":"Support mural","amount":15000}]\'>[{"name":"Installation climatiseur","amount":50000}]</textarea></div>'
          + '<div style="margin-bottom:12px;"><label style="font-size:12px;font-weight:600;color:#cbd5e1;display:block;margin-bottom:4px;">Montant total (FCFA)</label>'
          + '<input type="number" name="total_amount" required min="1000" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid rgba(59,130,246,0.25);background:rgba(15,23,42,0.6);color:white;font-size:13px;" placeholder="50000"></div>'
          + '<div style="margin-bottom:16px;"><label style="font-size:12px;font-weight:600;color:#cbd5e1;display:block;margin-bottom:4px;">Notes admin (optionnel)</label>'
          + '<input type="text" name="admin_notes" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid rgba(59,130,246,0.25);background:rgba(15,23,42,0.6);color:white;font-size:13px;" placeholder="Notes internes..."></div>'
          + '<button type="submit" style="width:100%;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;font-weight:700;font-size:14px;cursor:pointer;"><i class="fas fa-paper-plane" style="margin-right:6px;"></i>Envoyer le devis au client</button>'
          + '</form></div>';
        document.body.appendChild(modal);
        modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
      }
    `}} />
  </AdminLayout>
  )
}

// ============================================================
// PAGE AVIS
// ============================================================

export const AdminAvisPage = ({ success, deleted, allReviews = [] }: { success?: string; deleted?: string; allReviews?: any[] } = {}) => {
  const pending = allReviews.filter((r: any) => !r.approved)
  const approved = allReviews.filter((r: any) => r.approved)
  return (
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
        {pending.length} en attente · {approved.length} publiés
      </p>
    </div>

    {/* En attente de modération */}
    {pending.length > 0 && (
      <div class="mb-8">
        <h3 class="font-semibold text-gray-200 mb-4 flex items-center space-x-2">
          <span class="w-2 h-2 bg-orange-400 rounded-full"></span>
          <span>En attente de modération ({pending.length})</span>
        </h3>
        <div class="space-y-4">
          {pending.map((r: any) => (
            <div class="rounded-2xl p-5 card-shadow border-l-4 border-orange-400" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
              <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-2">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center" style="background:rgba(249,115,22,0.15);">
                      <span class="text-orange-400 font-bold text-sm">{(r.name || '?').charAt(0)}</span>
                    </div>
                    <div>
                      <div class="font-semibold text-gray-200 text-sm">{r.name}</div>
                      <div class="text-xs text-gray-400">{r.date} · {r.service}</div>
                    </div>
                    <div class="flex space-x-0.5 ml-2">
                      {[1,2,3,4,5].map(s => (
                        <i class={`fas fa-star text-sm ${s <= r.note ? 'text-yellow-400' : 'text-gray-600'}`}></i>
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

    {pending.length === 0 && (
      <div class="mb-8 rounded-xl p-5 text-center" style="background:rgba(16,185,129,0.05); border:1px solid rgba(16,185,129,0.15);">
        <i class="fas fa-check-circle text-green-400 text-2xl mb-2"></i>
        <p class="text-green-300 text-sm font-medium">Aucun avis en attente de modération</p>
      </div>
    )}

    {/* Avis approuvés */}
    <div>
      <h3 class="font-semibold text-gray-200 mb-4 flex items-center space-x-2">
        <span class="w-2 h-2 bg-green-400 rounded-full"></span>
        <span>Avis publiés ({approved.length})</span>
      </h3>
      {approved.length === 0 ? (
        <div class="rounded-2xl p-10 text-center card-shadow text-gray-400" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
          <i class="fas fa-star text-3xl mb-3"></i>
          <p>Aucun avis publié pour le moment</p>
        </div>
      ) : (
        <div class="rounded-2xl card-shadow overflow-hidden" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="border-b border-gray-700/50" style="background:#0e1726;">
                <tr>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Commentaire</th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Service</th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-700/30" data-paginate="15">
                {approved.map((r: any) => (
                  <tr class="hover:bg-cyan-900/10 transition-colors">
                    <td class="py-3 px-4 font-semibold text-gray-200 text-sm">{r.name}</td>
                    <td class="py-3 px-4">
                      <div class="flex space-x-0.5">
                        {[1,2,3,4,5].map(s => (
                          <i class={`fas fa-star text-xs ${s <= r.note ? 'text-yellow-400' : 'text-gray-600'}`}></i>
                        ))}
                      </div>
                    </td>
                    <td class="py-3 px-4 text-xs text-gray-400 max-w-xs truncate italic hidden md:table-cell">"{r.comment}"</td>
                    <td class="py-3 px-4 text-xs text-gray-500 hidden sm:table-cell">{r.service}</td>
                    <td class="py-3 px-4 text-xs text-gray-400 hidden sm:table-cell">{r.date}</td>
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
}
// ============================================================
// PAGE PARAMÈTRES
// ============================================================

export const AdminParametresPage = ({ success, error, siteSettings = {} }: { success?: string; error?: string; siteSettings?: Record<string, string> } = {}) => {
  const s = (key: string, fallback: string = '') => siteSettings[key] || fallback
  return (
  <AdminLayout activePage="parametres">
    <div class="mb-6">
      <h2 class="text-xl font-bold text-white">Paramètres du site</h2>
      <p class="text-sm text-gray-400 mt-1">Configuration, sécurité et gestion du back-office</p>
    </div>

    {success && (
      <div class="mb-6 rounded-xl p-4 flex items-center space-x-3" style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3);">
        <i class="fas fa-check-circle text-green-400 text-lg"></i>
        <span class="text-green-300 font-medium text-sm">
          {success === 'pwd' ? 'Mot de passe mis à jour avec succès.' : success === 'settings' ? 'Paramètres du site enregistrés.' : 'Opération réussie.'}
        </span>
      </div>
    )}
    {error && (
      <div class="mb-6 rounded-xl p-4 flex items-center space-x-3" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3);">
        <i class="fas fa-exclamation-circle text-red-400 text-lg"></i>
        <span class="text-red-300 font-medium text-sm">
          {error === 'wrong_current' ? 'Mot de passe actuel incorrect.' :
           error === 'mismatch' ? 'Les mots de passe ne correspondent pas.' :
           error === 'too_short' ? 'Le mot de passe doit faire au moins 12 caractères.' :
           error === 'rate_limited' ? 'Trop de tentatives. Réessayez dans 15 minutes.' :
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
            <input type="password" name="new_password" required placeholder="Minimum 12 caractères" minlength={12} class="input-field text-sm" />
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

      {/* Informations site — Éditables */}
      <div class="rounded-2xl p-6 card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <div class="flex items-center space-x-3 mb-5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(16,185,129,0.15);">
            <i class="fas fa-store text-green-400"></i>
          </div>
          <div>
            <h3 class="font-bold text-white">Informations MAASGA</h3>
            <p class="text-xs text-gray-400">Modifiez les données de contact et horaires affichés sur le site</p>
          </div>
        </div>
        <form method="post" action="/api/admin/site-settings" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5"><i class="fas fa-building mr-1 text-cyan-400"></i>Nom entreprise</label>
              <input name="company_name" value={s('company_name', 'MAASGA')} class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5"><i class="fas fa-phone mr-1 text-cyan-400"></i>Téléphone (Whatsapp)</label>
              <input name="phone" value={s('phone', '+226 55 99 64 18')} class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5"><i class="fas fa-envelope mr-1 text-blue-400"></i>Email</label>
              <input name="email" type="email" value={s('email', 'maasgabf@gmail.com')} class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5"><i class="fab fa-whatsapp mr-1 text-green-400"></i>WhatsApp</label>
              <input name="whatsapp" value={s('whatsapp', '+226 55 99 64 18')} class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5"><i class="fas fa-map-marker-alt mr-1 text-red-400"></i>Adresse</label>
              <input name="address" value={s('address', 'Ouagadougou, Burkina Faso')} class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5"><i class="fas fa-clock mr-1 text-yellow-400"></i>Horaires</label>
              <input name="hours" value={s('hours', 'Lundi–Dimanche · 8h00–18h00')} class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5"><i class="fab fa-facebook mr-1 text-blue-500"></i>Facebook (URL)</label>
              <input name="facebook" value={s('facebook', '')} placeholder="https://facebook.com/..." class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5"><i class="fab fa-instagram mr-1 text-pink-400"></i>Instagram (URL)</label>
              <input name="instagram" value={s('instagram', '')} placeholder="https://instagram.com/..." class="input-field text-sm" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5"><i class="fas fa-quote-left mr-1 text-purple-400"></i>Slogan</label>
            <input name="slogan" value={s('slogan', 'Solutions énergétiques solaires professionnelles')} class="input-field text-sm" />
          </div>
          <button type="submit" class="btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center space-x-2">
            <i class="fas fa-save"></i>
            <span>Enregistrer les paramètres</span>
          </button>
        </form>
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

      {/* Sauvegarde / Backup */}
      <div class="rounded-2xl p-6 card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <div class="flex items-center space-x-3 mb-5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(168,85,247,0.15);">
            <i class="fas fa-download text-purple-400"></i>
          </div>
          <div>
            <h3 class="font-bold text-white">Sauvegarde des données</h3>
            <p class="text-xs text-gray-400">Téléchargez une copie complète de toutes les données</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-3">
          <a href="/api/admin/backup" class="text-xs px-5 py-2.5 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(168,85,247,0.12); color:#a78bfa; border:1px solid rgba(168,85,247,0.2);">
            <i class="fas fa-database"></i>
            <span>Export JSON complet</span>
          </a>
          <a href="/api/admin/export/clients" class="text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
            <i class="fas fa-users"></i>
            <span>Clients CSV</span>
          </a>
          <a href="/api/admin/export/orders" class="text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
            <i class="fas fa-shopping-cart"></i>
            <span>Commandes CSV</span>
          </a>
          <a href="/api/admin/export/tickets" class="text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
            <i class="fas fa-headset"></i>
            <span>Tickets CSV</span>
          </a>
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
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="font-semibold text-red-300 text-sm">Réinitialiser les données de démo</div>
                <div class="text-xs text-gray-400 mt-0.5">Supprime tous les RDV, clients et avis de test</div>
              </div>
              <button onclick="confirmReset()" class="text-xs px-4 py-2 rounded-xl font-semibold whitespace-nowrap flex-shrink-0" style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3);">
                <i class="fas fa-trash mr-1"></i>Réinitialiser
              </button>
            </div>
          </div>
          <div class="p-4 rounded-xl" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.15);">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="font-semibold text-red-300 text-sm">Déconnexion forcée</div>
                <div class="text-xs text-gray-400 mt-0.5">Invalider la session admin en cours</div>
              </div>
              <a href="/api/admin/logout" class="text-xs px-4 py-2 rounded-xl font-semibold whitespace-nowrap flex-shrink-0 text-center" style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3);">
                <i class="fas fa-sign-out-alt mr-1"></i>Déconnecter
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>

    <script dangerouslySetInnerHTML={{ __html: `
      function confirmReset() {
        if (confirm('ATTENTION : Cette action va supprimer toutes les données (RDV, commandes, clients, avis, produits).\\nVoulez-vous continuer ?')) {
          if (confirm('Dernière confirmation : Supprimer définitivement toutes les données ?')) {
            fetch('/api/admin/reset-db', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ confirm: 'REINITIALISER' })
            })
            .then(r => r.json())
            .then(data => {
              if (data.success) {
                showToast(data.message || 'Base de données réinitialisée.', 'success');
                setTimeout(() => window.location.reload(), 1500);
              } else {
                showToast(data.error || 'Erreur lors de la réinitialisation.', 'error');
              }
            })
            .catch(() => showToast('Erreur réseau.', 'error'));
          }
        }
      }
    ` }} />
  </AdminLayout>
  )
}

// ============================================================
// ADMIN DEVIS LIST PAGE
// ============================================================
export const AdminDevisListPage = ({ devisData = [], rdvsPending = [] }: { devisData: any[]; rdvsPending?: any[] }) => (
  <AdminLayout activePage="devis">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
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

    {/* Rendez-vous de type devis en attente */}
    {rdvsPending.length > 0 && (
      <div class="mb-8">
        <div class="flex items-center space-x-2 mb-3">
          <i class="fas fa-calendar-check text-yellow-400 text-sm"></i>
          <h3 class="text-sm font-bold text-yellow-300">RDV devis en attente de traitement ({rdvsPending.length})</h3>
        </div>
        <div class="space-y-2">
          {rdvsPending.map((r: any) => (
            <div class="rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style="background:rgba(251,191,36,0.06); border:1px solid rgba(251,191,36,0.2);">
              <div class="flex items-center space-x-3">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(251,191,36,0.12);">
                  <i class="fas fa-clipboard-check text-yellow-400 text-sm"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-white text-sm">{r.name}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full" style="background:rgba(251,191,36,0.12); color:#fbbf24; border:1px solid rgba(251,191,36,0.25);">RDV #{r.id}</span>
                  </div>
                  <div class="flex flex-wrap gap-x-3 text-xs text-gray-500 mt-0.5">
                    <span><i class="fas fa-phone mr-1"></i>{r.phone}</span>
                    <span><i class="fas fa-map-marker-alt mr-1"></i>{r.quartier}</span>
                    <span><i class="fas fa-calendar mr-1"></i>{r.date}</span>
                    {r.notes && <span class="italic text-gray-600">{r.notes.substring(0, 40)}{r.notes.length > 40 ? '…' : ''}</span>}
                  </div>
                </div>
              </div>
              <a href={`/admin/devis/new?rdvId=${r.id}`}
                class="text-xs px-4 py-2 rounded-xl font-semibold whitespace-nowrap flex-shrink-0" style="background:rgba(251,191,36,0.12); color:#fbbf24; border:1px solid rgba(251,191,36,0.25);">
                <i class="fas fa-file-invoice-dollar mr-1.5"></i>Créer le devis
              </a>
            </div>
          ))}
        </div>
      </div>
    )}

    {devisData.length === 0 ? (
      <div class="rounded-2xl p-16 text-center card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <i class="fas fa-file-invoice-dollar text-5xl text-gray-700 mb-4"></i>
        <p class="text-gray-400 mb-2 font-semibold">Aucun devis créé</p>
        <p class="text-gray-600 text-sm mb-6">Créez un devis depuis les RDV ci-dessus ou avec le bouton "Nouveau devis"</p>
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
                  <a href={`/devis/${d.token}`} target="_blank" rel="noopener noreferrer"
                    class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(56,189,248,0.12); color:#38bdf8; border:1px solid rgba(56,189,248,0.2);">
                    <i class="fas fa-eye mr-1"></i>Voir
                  </a>
                  <a href={`/devis/${d.token}/pdf`} target="_blank" rel="noopener noreferrer"
                    class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(99,102,241,0.12); color:#818cf8; border:1px solid rgba(99,102,241,0.2);">
                    <i class="fas fa-file-pdf mr-1"></i>PDF
                  </a>
                  <a href={`https://wa.me/${(d.client_phone || '').replace(/\D/g,'')}?text=${encodeURIComponent('Bonjour ' + d.client_name + ', votre devis MAASGA ' + d.numero + ' est disponible : https://maasga-website.pages.dev/devis/' + d.token)}`} target="_blank" rel="noopener noreferrer"
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
export const AdminDevisNewPage = ({ rdv, productsList = [], clientsList = [], surface = '', btu = '', error, orderId, ticket, contract, clientData }: { rdv?: any; productsList?: any[]; clientsList?: any[]; surface?: string; btu?: string; error?: string; orderId?: number; ticket?: any; contract?: any; clientData?: any }) => {
  const ctx = ticket ? 'sav' : contract ? 'maintenance' : orderId ? 'commande' : rdv ? 'rdv' : 'manuel'
  const pc = rdv || (ticket ? { name: ticket.client_name, phone: ticket.client_phone, email: ticket.client_email || '', quartier: '' } : contract ? { name: contract.client_name, phone: contract.client_phone, email: '', quartier: '' } : clientData ? { name: clientData.name, phone: clientData.phone, email: clientData.email || '', quartier: clientData.quartier || '' } : null)
  return (
  <AdminLayout activePage="devis">
    <div class="flex items-center space-x-3 mb-6">
      <a href="/admin/devis" class="text-gray-400 hover:text-white transition-colors p-1">
        <i class="fas fa-arrow-left"></i>
      </a>
      <div>
        <h2 class="text-xl font-bold text-white">{ctx === 'sav' ? 'Devis réparation SAV' : ctx === 'maintenance' ? 'Devis entretien planifié' : 'Créer un devis'}</h2>
        <p class="text-sm text-gray-500 mt-0.5">{ctx === 'sav' && ticket ? `Ticket ${ticket.ticket_ref||'#'+(ticket.id||'')} — ${ticket.subject||''}` : ctx === 'maintenance' && contract ? `Contrat ${contract.plan_type||''} — ${contract.client_name||''}` : orderId ? `Commande #CMD-${String(orderId).padStart(4,'0')} — ${rdv?.name||''}` : rdv ? `D'après le RDV de ${rdv.name} — ${rdv.quartier}` : 'Nouveau devis manuel'}</p>
      </div>
    </div>

    {error && (
      <div class="mb-6 rounded-xl p-4 flex items-center space-x-3" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3);">
        <i class="fas fa-exclamation-circle text-red-400"></i>
        <span class="text-red-300 text-sm">{error}</span>
      </div>
    )}

    {ctx === 'rdv' && rdv && (
      <div class="mb-4 rounded-xl p-4 flex items-start space-x-3" style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.2);">
        <i class="fas fa-calendar-check mt-0.5" style="color:#38bdf8;"></i>
        <div class="text-sm"><span class="font-semibold text-cyan-300">RDV associé :</span>
          <span class="text-gray-300 ml-2">{rdv.date} {rdv.heure_debut ? 'à ' + rdv.heure_debut : ''} · {rdv.type || 'Visite'} · {rdv.quartier}</span>
          {rdv.notes && <p class="text-xs text-gray-500 mt-1 line-clamp-2"><i class="fas fa-sticky-note mr-1"></i>{rdv.notes}</p>}
        </div>
      </div>
    )}
    {ctx === 'sav' && ticket && (
      <div class="mb-4 rounded-xl p-4" style="background:rgba(251,146,60,0.08);border:1px solid rgba(251,146,60,0.25);">
        <div class="flex items-center space-x-2 mb-2">
          <i class="fas fa-tools" style="color:#fb923c;"></i>
          <span class="font-semibold text-orange-300 text-sm">Ticket SAV : {ticket.ticket_ref || '#'+(ticket.id||'')}</span>
          <span class="text-xs px-2 py-0.5 rounded-full font-bold ml-auto" style="background:rgba(251,146,60,0.15);color:#fb923c;">{ticket.priority}</span>
        </div>
        <p class="text-sm text-gray-300 font-medium">{ticket.subject}</p>
        {ticket.description && <p class="text-xs text-gray-400 mt-1">{ticket.description}</p>}
      </div>
    )}
    {ctx === 'maintenance' && contract && (
      <div class="mb-4 rounded-xl p-4" style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);">
        <div class="flex items-center space-x-2 mb-1">
          <i class="fas fa-shield-alt" style="color:#34d399;"></i>
          <span class="font-semibold text-emerald-300 text-sm">Contrat de maintenance — {contract.plan_type}</span>
          <span class="text-xs px-2 py-0.5 rounded-full ml-auto" style="background:rgba(52,211,153,0.12);color:#34d399;">{contract.completed_visits}/{contract.total_visits} visites</span>
        </div>
        <p class="text-xs text-gray-500">{contract.start_date} → {contract.end_date}</p>
      </div>
    )}
    {ctx === 'commande' && (
      <div class="mb-4 rounded-xl p-4 flex items-center space-x-3" style="background:rgba(167,139,250,0.08);border:1px solid rgba(167,139,250,0.2);">
        <i class="fas fa-shopping-cart" style="color:#a78bfa;"></i>
        <span class="font-semibold text-purple-300 text-sm">Commande en ligne #CMD-{String(orderId||0).padStart(4,'0')}</span>
      </div>
    )}
    <form method="post" action="/api/admin/devis/create" class="space-y-6 max-w-3xl">
      {rdv && rdv.id && <input type="hidden" name="rdv_id" value={String(rdv.id)} />}
      {orderId && <input type="hidden" name="order_id" value={String(orderId)} />}
      {ticket && <input type="hidden" name="ticket_id" value={String(ticket.id)} />}
      {contract && <input type="hidden" name="contract_id" value={String(contract.id)} />}

      {/* Section client */}
      <div class="rounded-2xl p-6 card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <h3 class="font-bold text-white mb-4 flex items-center space-x-2">
          <i class="fas fa-user text-cyan-400"></i><span>Informations client</span>
        </h3>

        {/* Sélecteur client existant */}
        {clientsList.length > 0 && !rdv && (
          <div class="mb-4 rounded-xl p-3" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.15);">
            <label class="block text-xs font-semibold text-cyan-300 mb-2">
              <i class="fas fa-search mr-1.5"></i>Choisir un client existant (pré-remplit les champs)
            </label>
            <select id="client-selector" onchange="fillClientFields(this)" class="input-field text-sm">
              <option value="">-- Sélectionner un client --</option>
              {clientsList.map((cl: any) => (
                <option value={String(cl.id)}
                  data-name={cl.name || ''}
                  data-phone={cl.phone || ''}
                  data-email={cl.email || ''}
                  data-quartier={cl.quartier || ''}>
                  {cl.name} · {cl.phone}{cl.quartier ? ` · ${cl.quartier}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Nom complet *</label>
            <input type="text" id="client_name_input" name="client_name" required placeholder="Nom et prénom" value={pc ? pc.name : ''} class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Téléphone (Whatsapp) *</label>
            <input type="tel" id="client_phone_input" name="client_phone" required placeholder="+226 XX XX XX XX" value={pc ? pc.phone : ''} class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
            <input type="email" id="client_email_input" name="client_email" placeholder="client@email.com" value={pc?.email || ''} class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Quartier / Zone</label>
            <input type="text" id="client_quartier_input" name="client_quartier" placeholder="Ex: Paspanga" value={pc ? pc.quartier : ''} class="input-field text-sm" />
          </div>
        </div>
      </div>

      {/* Section technique — only for installation/RDV/commande contexts */}
      {(ctx === 'rdv' || ctx === 'commande' || ctx === 'manuel') && (
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
      )}

      {/* Section produit & prix */}
      <div class="rounded-2xl p-6 card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <h3 class="font-bold text-white mb-4 flex items-center space-x-2">
          <i class="fas fa-box text-cyan-400"></i><span>{ctx === 'sav' ? "Pièces & Main d'œuvre" : ctx === 'maintenance' ? "Interventions & Main d'œuvre" : 'Produit & Prestations'}</span>
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
          <label class="block text-xs font-semibold text-gray-400 mb-1.5">{ctx === 'sav' ? "Main d'œuvre réparation (FCFA)" : ctx === 'maintenance' ? 'Prestation entretien (FCFA)' : "Main d'œuvre / Installation (FCFA)"}</label>
          <input type="number" name="installation_prix" id="installation_prix_input"
            value={ctx === 'maintenance' ? '15000' : '50000'} min="0" oninput="recalcTotal()" class="input-field text-sm" />
        </div>

        <div class="mb-5">
          <label class="block text-xs font-semibold text-gray-400 mb-2">Fournitures supplémentaires <span class="text-gray-600 font-normal">(optionnel)</span></label>
          <div id="acc-container" class="space-y-2">
            <div class="grid grid-cols-12 gap-2 acc-row">
              <div class="col-span-7"><input type="text" name="acc_nom_1" placeholder="Désignation" class="input-field text-sm" /></div>
              <div class="col-span-4"><input type="number" name="acc_prix_1" placeholder="Prix FCFA" min="0" oninput="recalcTotal()" class="input-field text-sm" /></div>
              <div class="col-span-1 flex items-center justify-center"><button type="button" class="text-red-400 hover:text-red-300 text-sm" onclick="removeAcc(this)" title="Supprimer"><i class="fas fa-times"></i></button></div>
            </div>
          </div>
          <button type="button" onclick="addAcc()" class="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1" style="background:rgba(56,189,248,0.08); color:#38bdf8; border:1px solid rgba(56,189,248,0.15);">
            <i class="fas fa-plus"></i><span>Ajouter une ligne</span>
          </button>
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
        {ctx === 'manuel' && (
          <div class="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5"><i class="fas fa-map-signs mr-1.5" style="color:#fbbf24;"></i>Origine de la demande</label>
              <select name="origine" class="input-field text-sm">
                <option value="">Non précisé</option>
                <option value="appel">Appel entrant</option>
                <option value="visite">Visite physique</option>
                <option value="recommandation">Recommandation</option>
                <option value="reseaux">Réseaux sociaux</option>
                <option value="publicite">Publicité</option>
                <option value="bouche_a_oreille">Bouche-à-oreille</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1.5"><i class="fas fa-exclamation-triangle mr-1.5" style="color:#f87171;"></i>Niveau d'urgence</label>
              <select name="urgence" class="input-field text-sm">
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="tres_urgent">Très urgent</option>
              </select>
            </div>
          </div>
        )}
        <div class="mb-4">
          <label class="block text-xs font-semibold text-gray-400 mb-1.5">Message personnalisé pour le client <span class="text-gray-600 font-normal">(apparaît sur le devis)</span></label>
          <textarea name="message_client" rows={3} class="input-field text-sm resize-none"
            placeholder="Ex: Suite à notre visite technique, voici notre proposition...">{ctx === 'sav' && ticket ? `Suite à l'analyse du ticket ${ticket.ticket_ref||''} — "${ticket.subject||''}", voici notre devis de réparation. Ce devis est valable 30 jours. Contactez-nous au +226 55 99 64 18 pour accord.` : ctx === 'maintenance' && contract ? `Dans le cadre de votre contrat de maintenance ${contract.plan_type}, voici le devis pour la prochaine intervention planifiée. Ce devis est valable 30 jours.` : rdv ? `Suite à notre visite technique à ${rdv.quartier}, voici notre proposition de devis personnalisée. Ce devis est valable 30 jours. N'hésitez pas à nous contacter pour toute question au +226 55 99 64 18.` : ''}</textarea>
        </div>
        <div class="mb-4">
          <label class="block text-xs font-semibold text-gray-400 mb-1.5">Notes internes <span class="text-gray-600 font-normal">(non visibles par le client)</span></label>
          <textarea name="notes_internes" rows={2} placeholder={ctx === 'sav' ? "Diagnostic, pièces identifiées, technicien assigné..." : ctx === 'maintenance' ? "Points d'entretien, filtres à vérifier, niveaux fluide..." : "Observations techniques, contraintes, remarques d'installation..."} class="input-field text-sm resize-none">{ctx === 'sav' && ticket ? `Ref. ticket: ${ticket.ticket_ref||'#'+(ticket.id||'')}` : ctx === 'maintenance' && contract ? `Ref. contrat #${contract.id}` : ''}</textarea>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-400 mb-1.5">Date d'expiration du devis</label>
          <input type="date" name="expires_at" id="expires_at_input" required class="input-field text-sm" />
          <p class="text-xs text-gray-600 mt-1"><i class="fas fa-info-circle mr-1"></i>Défaut : 30 jours à partir d'aujourd'hui</p>
        </div>
      </div>

      {/* Boutons submit */}
      <div class="flex flex-col sm:flex-row gap-3">
        <button type="button" onclick="previewDevisPDF()" 
          class="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all"
          style="background:rgba(139,92,246,0.1); color:#a78bfa; border:1.5px solid rgba(139,92,246,0.3);">
          <i class="fas fa-eye"></i>
          <span>Prévisualiser PDF</span>
        </button>
        <button type="submit" name="action" value="draft"
          class="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all"
          style="background:rgba(56,189,248,0.1); color:#38bdf8; border:1.5px solid rgba(56,189,248,0.3);">
          <i class="fas fa-save"></i>
          <span>Brouillon</span>
        </button>
        <button type="submit" name="action" value="send"
          class="flex-1 btn-primary py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg">
          <i class="fab fa-whatsapp text-green-300"></i>
          <span>Créer et envoyer</span>
        </button>
      </div>
    </form>

    {/* Preview modal */}
    <div id="preview-modal" class="fixed inset-0 z-50 hidden" style="background:rgba(0,0,0,0.8); backdrop-filter:blur(4px);">
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between px-5 py-3" style="background:#0f172a; border-bottom:1px solid rgba(56,189,248,0.15);">
          <h3 class="text-sm font-bold text-white flex items-center space-x-2"><i class="fas fa-file-pdf" style="color:#a78bfa;"></i><span>Prévisualisation du devis</span></h3>
          <button type="button" onclick="closePreview()" class="p-2 rounded-lg hover:bg-white/10 transition-colors"><i class="fas fa-times text-gray-400"></i></button>
        </div>
        <div class="flex-1 overflow-auto p-4"><iframe id="preview-iframe" style="width:100%;height:100%;min-height:80vh;border:none;border-radius:12px;background:white;"></iframe></div>
      </div>
    </div>

    <script dangerouslySetInnerHTML={{ __html: `
      var accCounter = 1;

      // Default expiry = today + 30 days
      (function() {
        var el = document.getElementById('expires_at_input');
        if (el && !el.value) {
          var d = new Date(); d.setDate(d.getDate() + 30);
          el.value = d.toISOString().split('T')[0];
        }
      })();

      function fillClientFields(sel) {
        var opt = sel.options[sel.selectedIndex];
        if (!opt || !opt.value) return;
        document.getElementById('client_name_input').value = opt.dataset.name || '';
        document.getElementById('client_phone_input').value = opt.dataset.phone || '';
        document.getElementById('client_email_input').value = opt.dataset.email || '';
        document.getElementById('client_quartier_input').value = opt.dataset.quartier || '';
      }

      function fillProductFromCatalog(sel) {
        var opt = sel.options[sel.selectedIndex];
        if (!opt || !opt.value) return;
        document.getElementById('produit_nom_input').value = opt.dataset.nom || '';
        document.getElementById('produit_prix_input').value = opt.dataset.prix || '';
        var installEl = document.getElementById('installation_prix_input');
        if (installEl && opt.dataset.install) installEl.value = opt.dataset.install;
        recalcTotal();
      }

      function addAcc() {
        accCounter++;
        var container = document.getElementById('acc-container');
        var row = document.createElement('div');
        row.className = 'grid grid-cols-12 gap-2 acc-row';
        row.innerHTML = '<div class="col-span-7"><input type="text" name="acc_nom_' + accCounter + '" placeholder="Désignation" class="input-field text-sm" /></div>' +
          '<div class="col-span-4"><input type="number" name="acc_prix_' + accCounter + '" placeholder="Prix FCFA" min="0" oninput="recalcTotal()" class="input-field text-sm" /></div>' +
          '<div class="col-span-1 flex items-center justify-center"><button type="button" class="text-red-400 hover:text-red-300 text-sm" onclick="removeAcc(this)" title="Supprimer"><i class="fas fa-times"></i></button></div>';
        container.appendChild(row);
      }

      function removeAcc(btn) {
        var rows = document.querySelectorAll('.acc-row');
        if (rows.length <= 1) return;  // keep at least one
        btn.closest('.acc-row').remove();
        recalcTotal();
      }

      function recalcTotal() {
        var prix = parseFloat((document.querySelector('[name=produit_prix]')||{}).value) || 0;
        var qty = parseFloat((document.querySelector('[name=produit_quantite]')||{}).value) || 1;
        var install = parseFloat((document.querySelector('[name=installation_prix]')||{}).value) || 0;
        var remise = parseFloat((document.querySelector('[name=remise]')||{}).value) || 0;
        var accTotal = 0;
        document.querySelectorAll('.acc-row input[type=number]').forEach(function(el) {
          accTotal += parseFloat(el.value) || 0;
        });
        var subtotal = (prix * qty) + install + accTotal;
        var discount = Math.round(subtotal * remise / 100);
        var total = subtotal - discount;
        document.getElementById('total-display').textContent = total.toLocaleString('fr-FR') + ' FCFA';
      }

      function previewDevisPDF() {
        // Collect form data
        var form = document.querySelector('form[action*=devis]');
        var fd = new FormData(form);
        fd.set('action', 'preview');
        // Post to preview endpoint
        fetch('/api/admin/devis/preview', { method: 'POST', body: fd })
          .then(function(r) { return r.text(); })
          .then(function(html) {
            var iframe = document.getElementById('preview-iframe');
            iframe.srcdoc = html;
            document.getElementById('preview-modal').classList.remove('hidden');
          })
          .catch(function(e) { alert('Erreur de prévisualisation: ' + e.message); });
      }

      function closePreview() {
        document.getElementById('preview-modal').classList.add('hidden');
      }
      document.getElementById('preview-modal').addEventListener('click', function(e) {
        if (e.target === this) closePreview();
      });

      recalcTotal();
    `}} />
  </AdminLayout>
  )
}


// ============================================================
// ADMIN DEVIS DETAIL PAGE
// ============================================================

export const AdminDevisDetailPage = ({ devis, publicUrl, notify, emailOk, emailErr }: { devis: any; publicUrl: string; notify?: string; emailOk?: boolean; emailErr?: string }) => {
  const statusColors: Record<string,string> = { draft: '#94a3b8', sent: '#fbbf24', accepted: '#34d399', refused: '#f87171', expired: '#f97316' }
  const statusLabels: Record<string,string> = { draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté', refused: 'Refusé', expired: 'Expiré' }
  return (
    <AdminLayout activePage="devis">
      <div class="max-w-3xl mx-auto space-y-6">
        {notify && <div class="rounded-xl p-4 text-sm" style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:#34d399;">{notify}</div>}
        {emailOk && <div class="rounded-xl p-4 text-sm" style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:#34d399;">Email envoyé avec succès.</div>}
        {emailErr && <div class="rounded-xl p-4 text-sm" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171;">Erreur email : {emailErr}</div>}
        <div class="rounded-2xl p-6" style="background:#111827;border:1px solid rgba(56,189,248,0.1);">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-white">Devis {devis?.numero}</h2>
            <span class="text-xs px-3 py-1 rounded-full font-semibold" style={`background:rgba(148,163,184,0.1);color:${statusColors[devis?.status]||'#94a3b8'}`}>{statusLabels[devis?.status]||devis?.status}</span>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><span class="text-gray-500">Client :</span> <span class="text-white">{devis?.client_name}</span></div>
            <div><span class="text-gray-500">Téléphone :</span> <span class="text-white">{devis?.client_phone}</span></div>
            <div><span class="text-gray-500">Total :</span> <span class="text-cyan-400 font-bold">{devis?.total?.toLocaleString()} FCFA</span></div>
            <div><span class="text-gray-500">Date :</span> <span class="text-white">{devis?.created_at ? new Date(devis.created_at).toLocaleDateString('fr-FR') : '-'}</span></div>
          </div>
          <div class="flex flex-wrap gap-3 mt-4">
            <a href={publicUrl} target="_blank" class="btn-secondary text-sm px-4 py-2 rounded-xl"><i class="fas fa-eye mr-2"></i>Voir le devis</a>
            <form method="post" action="/api/admin/devis/send-email" style="display:inline;">
              <input type="hidden" name="token" value={devis?.token} />
              <button type="submit" class="btn-primary text-sm px-4 py-2 rounded-xl"><i class="fas fa-envelope mr-2"></i>Envoyer par email</button>
            </form>
            <a href="/admin/devis" class="text-sm px-4 py-2 rounded-xl" style="background:rgba(148,163,184,0.1);color:#94a3b8;"><i class="fas fa-arrow-left mr-2"></i>Retour</a>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

// ============================================================
// ADMIN PAIEMENTS PAGE
// ============================================================

export const AdminPaiementsPage = ({ payments = [], stats }: { payments: any[]; stats?: { total: number; pending: number; completed: number; failed: number; revenue: number } }) => {
  const s = stats || { total: payments.length, pending: 0, completed: 0, failed: 0, revenue: 0 }
  return (
  <AdminLayout activePage="paiements">
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 fade-in-up">
        <div>
          <h2 class="text-xl font-bold text-white">Paiements</h2>
          <p class="text-sm text-blue-300/60 mt-1">Suivi et gestion de tous les paiements</p>
        </div>
        <a href="/api/admin/export/payments" class="text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
          <i class="fas fa-file-csv"></i>
          <span>Export CSV</span>
        </a>
      </div>

      {/* Stats cards */}
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 fade-in-up delay-1">
        {[
          { icon: 'fa-receipt', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', label: 'Total', val: String(s.total) },
          { icon: 'fa-clock', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', label: 'En attente', val: String(s.pending) },
          { icon: 'fa-check-circle', color: '#34d399', bg: 'rgba(52,211,153,0.15)', label: 'Complétés', val: String(s.completed) },
          { icon: 'fa-times-circle', color: '#f87171', bg: 'rgba(248,113,113,0.15)', label: 'Échoués', val: String(s.failed) },
          { icon: 'fa-money-bill-wave', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', label: 'Revenu', val: s.revenue.toLocaleString() + ' F' },
        ].map(c => (
          <div class="stat-card">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" style={`background:${c.bg};`}>
                <i class={`fas ${c.icon}`} style={`color:${c.color};`}></i>
              </div>
              <div>
                <div class="text-xs font-medium" style="color:#64748b;">{c.label}</div>
                <div class="text-xl font-bold text-white">{c.val}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div class="flex gap-2 flex-wrap fade-in-up delay-2">
        {[
          { href: '/admin/paiements', label: 'Tous', active: true },
          { href: '/admin/paiements?status=pending', label: 'En attente' },
          { href: '/admin/paiements?status=completed', label: 'Payés' },
          { href: '/admin/paiements?status=failed', label: 'Échoués' },
        ].map(f => (
          <a href={f.href} class="px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={f.active ? 'background:rgba(56,189,248,0.2); color:#38bdf8; border:1px solid rgba(56,189,248,0.3);' : 'background:rgba(255,255,255,0.05); color:#94a3b8; border:1px solid rgba(255,255,255,0.08);'}>{f.label}</a>
        ))}
      </div>

      {/* Table */}
      <div class="rounded-2xl overflow-hidden fade-in-up delay-3" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        {payments.length === 0 ? (
          <div class="text-center py-16">
            <i class="fas fa-receipt text-4xl mb-3" style="color:#1e3a5f;"></i>
            <p class="text-sm" style="color:#64748b;">Aucun paiement enregistré</p>
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="admin-table w-full text-sm">
              <thead>
                <tr style="background:rgba(15,23,42,0.8); border-bottom:1px solid rgba(56,189,248,0.08);">
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider hidden lg:table-cell">ID</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Client</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider hidden sm:table-cell">Type</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Montant</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider hidden md:table-cell">Méthode</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Statut</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider hidden lg:table-cell">Réf.</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th class="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody data-paginate="15">
                {payments.map((p: any) => {
                  const statusMap: Record<string,{label:string;cls:string}> = {
                    pending: { label: 'En attente', cls: 'badge-pending' },
                    processing: { label: 'En cours', cls: 'badge-pending' },
                    completed: { label: 'Payé', cls: 'badge-confirmed' },
                    failed: { label: 'Échoué', cls: 'badge-cancelled' },
                    refunded: { label: 'Remboursé', cls: 'badge-done' },
                    cancelled: { label: 'Annulé', cls: 'badge-cancelled' },
                  }
                  const st = statusMap[p.status] || { label: p.status, cls: 'badge-pending' }
                  const methodMap: Record<string,string> = { orange_money: 'Orange Money', moov_money: 'Moov Money', wave: 'Wave', carte_bancaire: 'Carte', ligdicash: 'LigdiCash', cash: 'Espèces' }
                  const typeMap: Record<string,string> = { order: 'Commande', maintenance: 'Maintenance' }
                  return (
                    <tr style="border-bottom:1px solid rgba(56,189,248,0.05);" class="hover:bg-white/5">
                      <td class="px-5 py-3 font-mono text-xs text-blue-300 hidden lg:table-cell">#{p.id}</td>
                      <td class="px-5 py-3">
                        <div class="font-semibold text-white text-sm">{p.client_name || '—'}</div>
                        <div class="text-xs" style="color:#64748b;">{p.client_phone || ''}</div>
                      </td>
                      <td class="px-5 py-3 text-sm text-blue-200 hidden sm:table-cell">{typeMap[p.payment_type] || p.payment_type}</td>
                      <td class="px-5 py-3 font-bold text-white">{(p.amount || 0).toLocaleString()} F</td>
                      <td class="px-5 py-3 text-sm hidden md:table-cell" style="color:#94a3b8;">{methodMap[p.method] || p.method}</td>
                      <td class="px-5 py-3"><span class={`text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span></td>
                      <td class="px-5 py-3 text-xs font-mono hidden lg:table-cell" style="color:#64748b;">{p.provider_ref || '—'}</td>
                      <td class="px-5 py-3 text-xs hidden md:table-cell" style="color:#94a3b8;">{p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                      <td class="px-5 py-3">
                        <span class="text-xs" style="color:#475569;">—</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </AdminLayout>
  )
}


// ============================================================
// ADMIN MAINTENANCE PAGE
// ============================================================

export const AdminMaintenancePage = ({ contracts = [], requests = [], visits = [] }: { contracts: any[]; requests: any[]; visits: any[] }) => {
  const activeContracts = contracts.filter((c: any) => c.status === 'active').length
  const totalRequests = requests.length
  const pendingRequests = requests.filter((r: any) => r.status === 'pending').length
  const totalVisits = visits.length

  // Visites dues/en retard (date passée et toujours planifiée)
  const today = new Date().toISOString().split('T')[0]
  const dueVisits = visits.filter((v: any) => v.status === 'planifiee' && v.visit_date <= today)
  const upcomingVisits = visits.filter((v: any) => v.status === 'planifiee' && v.visit_date > today)

  const fmtDate = (d: string) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return d }
  }

  return (
  <AdminLayout activePage="maintenance">
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 fade-in-up">
        <div>
          <h2 class="text-xl font-bold text-white">Maintenance</h2>
          <p class="text-sm text-blue-300/60 mt-1">Contrats, demandes et visites de maintenance</p>
        </div>
      </div>

      {/* ===== NOTIFICATION BANNER : Visites à effectuer ===== */}
      {dueVisits.length > 0 && (
        <div class="rounded-2xl p-5 fade-in-up" style="background:linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1)); border:1px solid rgba(245,158,11,0.3);">
          <div class="flex items-start space-x-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(245,158,11,0.2);">
              <i class="fas fa-bell text-lg" style="color:#f59e0b;"></i>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-white flex items-center space-x-2">
                <span>🔔 {dueVisits.length} visite{dueVisits.length > 1 ? 's' : ''} à effectuer !</span>
              </h3>
              <p class="text-sm mt-1" style="color:#fbbf24;">Les visites suivantes ont atteint leur date prévue et doivent être validées après réalisation.</p>
              <div class="mt-3 space-y-2">
                {dueVisits.map(v => {
                  const contract = contracts.find((c: any) => c.id === v.contract_id)
                  const daysOverdue = Math.floor((new Date(today).getTime() - new Date(v.visit_date).getTime()) / 86400000)
                  return (
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 px-3 rounded-xl" style="background:rgba(0,0,0,0.2); border:1px solid rgba(245,158,11,0.15);">
                      <div class="flex items-center space-x-3 min-w-0">
                        <i class="fas fa-exclamation-triangle text-sm" style="color:#f59e0b;"></i>
                        <div class="min-w-0">
                          <div class="text-sm font-semibold text-white truncate">
                            {v.client_name || (contract ? contract.client_name : `Client #${v.client_id}`)}
                            <span class="text-xs font-normal ml-2" style="color:#94a3b8;">{v.client_phone}</span>
                          </div>
                          <div class="text-xs" style="color:#fbbf24;">
                            Prévue le {fmtDate(v.visit_date)} {daysOverdue > 0 ? `(${daysOverdue}j de retard)` : "(aujourd'hui)"}
                            {contract && <span> · Contrat {contract.plan_type}</span>}
                          </div>
                        </div>
                      </div>
                      <button type="button" class="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0" style="background:rgba(52,211,153,0.15); color:#34d399; border:1px solid rgba(52,211,153,0.3);" onclick={`openValidationModal(${v.id}, '${(v.client_name || '').replace(/'/g, "\\'")}', '${v.visit_date}', ${v.contract_id || 0})`}>
                        <i class="fas fa-check mr-1"></i>Valider
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 fade-in-up delay-1">
        {[
          { icon: 'fa-file-contract', color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)', label: 'Contrats actifs', val: String(activeContracts) },
          { icon: 'fa-bell', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'À effectuer', val: String(dueVisits.length) },
          { icon: 'fa-calendar-alt', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', label: 'À venir', val: String(upcomingVisits.length) },
          { icon: 'fa-exclamation-circle', color: '#f87171', bg: 'rgba(248,113,113,0.15)', label: 'Demandes en attente', val: String(pendingRequests) },
          { icon: 'fa-clipboard-check', color: '#34d399', bg: 'rgba(52,211,153,0.15)', label: 'Visites total', val: String(totalVisits) },
        ].map(c => (
          <div class="stat-card">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" style={`background:${c.bg};`}>
                <i class={`fas ${c.icon}`} style={`color:${c.color};`}></i>
              </div>
              <div>
                <div class="text-xs font-medium" style="color:#64748b;">{c.label}</div>
                <div class="text-xl font-bold text-white">{c.val}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Contrats ===== */}
      <div class="rounded-2xl overflow-hidden fade-in-up delay-2" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <div class="px-5 py-4" style="border-bottom:1px solid rgba(56,189,248,0.08);">
          <h3 class="font-bold text-white flex items-center space-x-2">
            <i class="fas fa-file-contract text-sm" style="color:#0ea5e9;"></i>
            <span>Contrats de maintenance</span>
            <span class="ml-2 text-xs px-2 py-0.5 rounded-full" style="background:rgba(14,165,233,0.15); color:#38bdf8;">{contracts.length}</span>
          </h3>
        </div>
        {contracts.length === 0 ? (
          <div class="text-center py-12">
            <i class="fas fa-file-contract text-3xl mb-3" style="color:#1e3a5f;"></i>
            <p class="text-sm" style="color:#64748b;">Aucun contrat enregistré</p>
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="admin-table w-full text-sm">
              <thead>
                <tr style="background:rgba(15,23,42,0.8); border-bottom:1px solid rgba(56,189,248,0.08);">
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider hidden lg:table-cell">ID</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Client</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider hidden md:table-cell">Formule</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider hidden md:table-cell">Prix</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider hidden lg:table-cell">Période</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Visites</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Statut</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider hidden sm:table-cell">Actions</th>
                </tr>
              </thead>
              <tbody data-paginate="10">
                {contracts.map((c: any) => {
                  const planLabels: Record<string,string> = { trimestriel: 'Trimestriel (3/an)', semestriel: 'Semestriel (2/an)', annuel: 'Annuel (1/an)' }
                  const statusBadge: Record<string,{l:string;c:string}> = { active: {l:'Actif',c:'badge-confirmed'}, expired: {l:'Expiré',c:'badge-done'}, cancelled: {l:'Annulé',c:'badge-cancelled'} }
                  const sb = statusBadge[c.status] || {l:c.status,c:'badge-pending'}
                  const contractVisits = visits.filter((v: any) => v.contract_id === c.id)
                  const completedCount = contractVisits.filter((v: any) => v.status === 'effectuee').length
                  const upcomingCount = contractVisits.filter((v: any) => v.status === 'planifiee' || v.status === 'confirmee').length
                  const cvUpcoming = contractVisits.filter((v: any) => v.status === 'planifiee' || v.status === 'confirmee').sort((a: any, b: any) => a.visit_date.localeCompare(b.visit_date))
                  const cvDone = contractVisits.filter((v: any) => v.status === 'effectuee').sort((a: any, b: any) => b.visit_date.localeCompare(a.visit_date))
                  const progress = (c.total_visits || 0) > 0 ? Math.round((completedCount / c.total_visits) * 100) : 0
                  return (
                    <>
                    <tr style="border-bottom:1px solid rgba(56,189,248,0.05);" class="hover:bg-white/5 cursor-pointer" onclick={`var el=document.getElementById('cv-${c.id}');el.classList.toggle('hidden');this.querySelector('.expand-icon').classList.toggle('fa-chevron-right');this.querySelector('.expand-icon').classList.toggle('fa-chevron-down');`}>
                      <td class="px-5 py-3 font-mono text-xs text-blue-300 hidden lg:table-cell">
                        <i class="fas fa-chevron-right expand-icon text-xs mr-1" style="color:#64748b;"></i>#{c.id}
                      </td>
                      <td class="px-5 py-3">
                        <div class="text-white text-sm font-semibold">{c.client_name || c.client_phone || `Client #${c.client_id}`}</div>
                        {c.client_phone && <div class="text-xs" style="color:#64748b;">{c.client_phone}</div>}
                      </td>
                      <td class="px-5 py-3 text-sm text-blue-200 hidden md:table-cell">{planLabels[c.plan_type] || c.plan_type}</td>
                      <td class="px-5 py-3 font-bold text-white hidden md:table-cell">{(c.plan_price || 0).toLocaleString()} F</td>
                      <td class="px-5 py-3 text-xs hidden lg:table-cell" style="color:#94a3b8;">
                        {c.start_date ? new Date(c.start_date).toLocaleDateString('fr-FR') : '—'} → {c.end_date ? new Date(c.end_date).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td class="px-5 py-3">
                        <div class="flex items-center space-x-2">
                          <div class="w-16 h-2 rounded-full" style="background:rgba(14,165,233,0.1);">
                            <div class="h-2 rounded-full" style={`width:${progress}%; background:linear-gradient(90deg,#0077b6,#00b4d8);`}></div>
                          </div>
                          <span class="text-sm text-blue-200 font-bold">{completedCount}/{c.total_visits || 0}</span>
                        </div>
                        {upcomingCount > 0 && <div class="text-xs mt-0.5" style="color:#f59e0b;"><i class="fas fa-clock mr-1"></i>{upcomingCount} à venir</div>}
                      </td>
                      <td class="px-5 py-3"><span class={`text-xs font-bold px-2.5 py-1 rounded-full ${sb.c}`}>{sb.l}</span></td>
                      <td class="px-5 py-3 hidden sm:table-cell">
                        <a href={`/admin/devis/new?contract_id=${c.id}`} class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap" style="background:rgba(52,211,153,0.1);color:#34d399;border:1px solid rgba(52,211,153,0.2);">
                          <i class="fas fa-file-invoice-dollar mr-1"></i>Devis
                        </a>
                      </td>
                    </tr>
                    {/* Expandable visits detail row */}
                    <tr id={`cv-${c.id}`} class="hidden">
                      <td colspan={8} class="px-5 py-4" style="background:rgba(14,165,233,0.03); border-bottom:2px solid rgba(14,165,233,0.1);">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Upcoming visits */}
                          <div>
                            <div class="text-xs font-bold uppercase tracking-wide mb-2 flex items-center space-x-1" style="color:#f59e0b;">
                              <i class="fas fa-calendar-alt"></i>
                              <span>Visites à venir ({cvUpcoming.length})</span>
                            </div>
                            {cvUpcoming.length === 0 ? (
                              <div class="text-xs py-2" style="color:#64748b;">Aucune visite planifiée</div>
                            ) : (
                              <div class="space-y-1.5">
                                {cvUpcoming.map((v: any, idx: number) => {
                                  const dLeft = Math.ceil((new Date(v.visit_date).getTime() - new Date(today).getTime()) / 86400000)
                                  const isDue = dLeft <= 0
                                  return (
                                    <div class="flex items-center justify-between py-2 px-3 rounded-lg" style={isDue ? 'background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2);' : 'background:rgba(14,165,233,0.05); border:1px solid rgba(14,165,233,0.1);'}>
                                      <div class="flex items-center space-x-2">
                                        <span class="text-xs font-black w-5 h-5 rounded flex items-center justify-center" style={isDue ? 'background:rgba(245,158,11,0.2); color:#f59e0b;' : 'background:rgba(14,165,233,0.1); color:#0ea5e9;'}>{idx + 1}</span>
                                        <span class="text-sm text-white">{fmtDate(v.visit_date)}</span>
                                      </div>
                                      <div class="flex items-center space-x-2">
                                        <span class="text-xs px-2 py-0.5 rounded-full font-bold" style={isDue ? 'background:rgba(245,158,11,0.15); color:#f59e0b;' : 'background:rgba(14,165,233,0.1); color:#0ea5e9;'}>
                                          {isDue ? (dLeft === 0 ? "Aujourd'hui" : `${Math.abs(dLeft)}j retard`) : `J-${dLeft}`}
                                        </span>
                                        {isDue && (
                                          <button type="button" class="text-xs font-bold px-2 py-1 rounded-lg" style="background:rgba(52,211,153,0.15); color:#34d399; border:1px solid rgba(52,211,153,0.3);" onclick={`openValidationModal(${v.id}, '${(v.client_name || c.client_name || '').replace(/'/g, "\\'")}', '${v.visit_date}', ${c.id})`}>
                                            <i class="fas fa-check mr-1"></i>Valider
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                          {/* Completed visits */}
                          <div>
                            <div class="text-xs font-bold uppercase tracking-wide mb-2 flex items-center space-x-1" style="color:#34d399;">
                              <i class="fas fa-check-double"></i>
                              <span>Visites effectuées ({cvDone.length})</span>
                            </div>
                            {cvDone.length === 0 ? (
                              <div class="text-xs py-2" style="color:#64748b;">Aucune visite effectuée</div>
                            ) : (
                              <div class="space-y-1.5">
                                {cvDone.map((v: any) => (
                                  <div class="flex items-center justify-between py-2 px-3 rounded-lg" style="background:rgba(52,211,153,0.05); border:1px solid rgba(52,211,153,0.1);">
                                    <div class="flex items-center space-x-2">
                                      <i class="fas fa-check-circle text-xs" style="color:#34d399;"></i>
                                      <span class="text-sm text-white">{fmtDate(v.visit_date)}</span>
                                      {v.technician && <span class="text-xs" style="color:#64748b;">· {v.technician}</span>}
                                    </div>
                                    {v.actions_performed && <span class="text-xs truncate max-w-[200px]" style="color:#94a3b8;">{v.actions_performed}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Visites techniques ===== */}
      <div class="rounded-2xl overflow-hidden fade-in-up delay-2" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <div class="px-5 py-4 flex items-center justify-between" style="border-bottom:1px solid rgba(56,189,248,0.08);">
          <h3 class="font-bold text-white flex items-center space-x-2">
            <i class="fas fa-clipboard-check text-sm" style="color:#34d399;"></i>
            <span>Visites techniques</span>
            <span class="ml-2 text-xs px-2 py-0.5 rounded-full" style="background:rgba(52,211,153,0.15); color:#34d399;">{visits.length}</span>
          </h3>
          {dueVisits.length > 0 && (
            <span class="text-xs px-3 py-1 rounded-full font-bold animate-pulse" style="background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid rgba(245,158,11,0.3);">
              <i class="fas fa-bell mr-1"></i>{dueVisits.length} à valider
            </span>
          )}
        </div>
        {visits.length === 0 ? (
          <div class="text-center py-12">
            <i class="fas fa-clipboard-check text-3xl mb-3" style="color:#1e3a5f;"></i>
            <p class="text-sm" style="color:#64748b;">Aucune visite enregistrée</p>
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="admin-table w-full text-sm">
              <thead>
                <tr style="background:rgba(15,23,42,0.8); border-bottom:1px solid rgba(56,189,248,0.08);">
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">ID</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Client</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Contrat</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Type</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Date prévue</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Technicien</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Statut</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody data-paginate="10">
                {visits.map((v: any) => {
                  const visitTypeLabels: Record<string,string> = { preventive: 'Préventive', occasionnelle: 'Occasionnelle', urgence: 'Urgence' }
                  const statusBadge: Record<string,{l:string;c:string}> = {
                    planifiee: {l:'Planifiée',c:'badge-pending'},
                    confirmee: {l:'Confirmée',c:'badge-done'},
                    effectuee: {l:'Effectuée',c:'badge-confirmed'},
                    annulee: {l:'Annulée',c:'badge-cancelled'}
                  }
                  const sb = statusBadge[v.status] || {l:v.status,c:'badge-pending'}
                  const isDue = v.status === 'planifiee' && v.visit_date <= today
                  const contract = contracts.find((c: any) => c.id === v.contract_id)
                  return (
                    <tr style={`border-bottom:1px solid rgba(56,189,248,0.05);${isDue ? ' background:rgba(245,158,11,0.05);' : ''}`} class="hover:bg-white/5">
                      <td class="px-5 py-3 font-mono text-xs text-blue-300">#{v.id}</td>
                      <td class="px-5 py-3">
                        <div class="text-white text-sm font-semibold">{v.client_name || (contract ? contract.client_name : '—')}</div>
                        <div class="text-xs" style="color:#64748b;">{v.client_phone || (contract ? contract.client_phone : '')}</div>
                      </td>
                      <td class="px-5 py-3 text-xs text-blue-200">
                        {v.contract_id ? `#${v.contract_id}` : '—'}
                        {contract && <div class="text-xs" style="color:#64748b;">{contract.plan_type}</div>}
                      </td>
                      <td class="px-5 py-3 text-sm text-blue-200">{visitTypeLabels[v.visit_type] || v.visit_type}</td>
                      <td class="px-5 py-3">
                        <span class={`text-sm ${isDue ? 'font-bold' : ''}`} style={isDue ? 'color:#f59e0b;' : 'color:white;'}>
                          {v.visit_date ? new Date(v.visit_date).toLocaleDateString('fr-FR') : '—'}
                        </span>
                        {isDue && <div class="text-xs font-bold" style="color:#ef4444;">⚠️ Échue</div>}
                      </td>
                      <td class="px-5 py-3 text-sm" style="color:#94a3b8;">
                        {v.technician || '—'}
                      </td>
                      <td class="px-5 py-3"><span class={`text-xs font-bold px-2.5 py-1 rounded-full ${sb.c}`}>{sb.l}</span></td>
                      <td class="px-5 py-3">
                        {(v.status === 'planifiee' || v.status === 'confirmee') && (
                          <div class="flex gap-1">
                            <button type="button" class="p-2 rounded-lg hover:bg-green-500/20 transition-colors" title="Valider l'entretien" onclick={`openValidationModal(${v.id}, '${(v.client_name || '').replace(/'/g, "\\'")}', '${v.visit_date}', ${v.contract_id || 0})`}>
                              <i class="fas fa-check-circle text-sm" style="color:#34d399;"></i>
                            </button>
                            <form method="post" action="/admin/maintenance/update-visit" style="display:inline;">
                              <input type="hidden" name="visit_id" value={v.id} />
                              <input type="hidden" name="status" value="annulee" />
                              <button type="submit" class="p-2 rounded-lg hover:bg-red-500/20 transition-colors" title="Annuler" onclick="return confirm('Annuler cette visite ?')">
                                <i class="fas fa-times text-sm" style="color:#f87171;"></i>
                              </button>
                            </form>
                          </div>
                        )}
                        {v.status === 'effectuee' && (
                          <span class="text-xs" style="color:#34d399;"><i class="fas fa-check-double mr-1"></i>Validée</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Demandes de maintenance ===== */}
      <div class="rounded-2xl overflow-hidden fade-in-up delay-3" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <div class="px-5 py-4" style="border-bottom:1px solid rgba(56,189,248,0.08);">
          <h3 class="font-bold text-white flex items-center space-x-2">
            <i class="fas fa-inbox text-sm" style="color:#fbbf24;"></i>
            <span>Demandes de maintenance</span>
            <span class="ml-2 text-xs px-2 py-0.5 rounded-full" style="background:rgba(251,191,36,0.15); color:#fbbf24;">{requests.length}</span>
          </h3>
        </div>
        {requests.length === 0 ? (
          <div class="text-center py-12">
            <i class="fas fa-inbox text-3xl mb-3" style="color:#1e3a5f;"></i>
            <p class="text-sm" style="color:#64748b;">Aucune demande de maintenance</p>
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="admin-table w-full text-sm">
              <thead>
                <tr style="background:rgba(15,23,42,0.8); border-bottom:1px solid rgba(56,189,248,0.08);">
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">ID</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Client</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Type</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Équipement</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Description</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Statut</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Date</th>
                  <th class="text-left px-5 py-3 font-semibold text-blue-300/80 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody data-paginate="10">
                {requests.map((r: any) => {
                  const typeLabels: Record<string,string> = { occasionnelle: 'Ponctuelle', urgence: 'Urgence', contrat: 'Contrat' }
                  const statusBadge: Record<string,{l:string;c:string}> = { pending:{l:'En attente',c:'badge-pending'}, contacted:{l:'Contacté',c:'badge-done'}, scheduled:{l:'Planifié',c:'badge-confirmed'}, done:{l:'Terminé',c:'badge-confirmed'}, cancelled:{l:'Annulé',c:'badge-cancelled'} }
                  const sb = statusBadge[r.status] || {l:r.status,c:'badge-pending'}
                  return (
                    <tr style="border-bottom:1px solid rgba(56,189,248,0.05);" class="hover:bg-white/5">
                      <td class="px-5 py-3 font-mono text-xs text-blue-300">#{r.id}</td>
                      <td class="px-5 py-3">
                        <div class="text-white text-sm font-semibold">{r.client_name || '—'}</div>
                        <div class="text-xs" style="color:#64748b;">{r.client_phone || ''}</div>
                      </td>
                      <td class="px-5 py-3 text-sm text-blue-200">{typeLabels[r.request_type] || r.request_type}</td>
                      <td class="px-5 py-3 text-xs" style="color:#94a3b8;">{r.equipment_type || '—'}</td>
                      <td class="px-5 py-3 text-xs max-w-xs truncate" style="color:#94a3b8;">{r.description || '—'}</td>
                      <td class="px-5 py-3"><span class={`text-xs font-bold px-2.5 py-1 rounded-full ${sb.c}`}>{sb.l}</span></td>
                      <td class="px-5 py-3 text-xs" style="color:#94a3b8;">{r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                      <td class="px-5 py-3">
                        {r.status === 'pending' && (
                          <div class="flex gap-1">
                            <form method="post" action="/admin/maintenance/update-request" style="display:inline;">
                              <input type="hidden" name="request_id" value={r.id} />
                              <input type="hidden" name="status" value="contacted" />
                              <button type="submit" class="p-2 rounded-lg hover:bg-blue-500/20 transition-colors" title="Marquer contacté">
                                <i class="fas fa-phone text-xs" style="color:#38bdf8;"></i>
                              </button>
                            </form>
                            <form method="post" action="/admin/maintenance/update-request" style="display:inline;">
                              <input type="hidden" name="request_id" value={r.id} />
                              <input type="hidden" name="status" value="scheduled" />
                              <button type="submit" class="p-2 rounded-lg hover:bg-green-500/20 transition-colors" title="Planifier">
                                <i class="fas fa-calendar-check text-xs" style="color:#34d399;"></i>
                              </button>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

    {/* ===== MODAL VALIDATION VISITE ===== */}
    <div id="validation-modal" class="fixed inset-0 z-50 hidden" style="background:rgba(0,0,0,0.7); backdrop-filter:blur(4px);">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="w-full max-w-lg rounded-2xl p-6" style="background:#111827; border:1px solid rgba(56,189,248,0.15); box-shadow:0 25px 50px rgba(0,0,0,0.5);">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-bold text-white flex items-center space-x-2">
              <i class="fas fa-check-circle" style="color:#34d399;"></i>
              <span>Valider l'entretien</span>
            </h3>
            <button type="button" onclick="closeValidationModal()" class="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <i class="fas fa-times text-gray-400"></i>
            </button>
          </div>
          <div id="modal-visit-info" class="mb-4 p-3 rounded-xl" style="background:rgba(14,165,233,0.08); border:1px solid rgba(14,165,233,0.15);">
          </div>
          <form method="post" action="/admin/maintenance/validate-visit" class="space-y-4">
            <input type="hidden" name="visit_id" id="modal-visit-id" />
            <div>
              <label class="block text-xs font-semibold text-blue-300/80 mb-1.5">Technicien</label>
              <input type="text" name="technician" placeholder="Nom du technicien" class="input-field" required />
            </div>
            <div>
              <label class="block text-xs font-semibold text-blue-300/80 mb-1.5">Actions réalisées</label>
              <textarea name="actions_performed" rows={3} placeholder="Nettoyage filtres, recharge gaz, vérification..." class="input-field" style="resize:vertical;" required></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="gas_recharged" value="1" class="w-4 h-4 rounded" style="accent-color:#0ea5e9;" />
                <span class="text-sm text-gray-300">Gaz rechargé</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="filters_cleaned" value="1" class="w-4 h-4 rounded" style="accent-color:#0ea5e9;" />
                <span class="text-sm text-gray-300">Filtres nettoyés</span>
              </label>
            </div>
            <div>
              <label class="block text-xs font-semibold text-blue-300/80 mb-1.5">Notes supplémentaires</label>
              <textarea name="notes" rows={2} placeholder="Remarques, état de l'équipement..." class="input-field" style="resize:vertical;"></textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-2">
              <button type="button" onclick="closeValidationModal()" class="px-4 py-2.5 text-sm font-medium rounded-xl transition-colors" style="background:rgba(255,255,255,0.08); color:#94a3b8;">
                Annuler
              </button>
              <button type="submit" class="btn-primary px-5 py-2.5 text-sm font-bold rounded-xl flex items-center space-x-2">
                <i class="fas fa-check-circle"></i>
                <span>Confirmer l'entretien</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <script dangerouslySetInnerHTML={{ __html: `
      function openValidationModal(visitId, clientName, visitDate, contractId) {
        document.getElementById('modal-visit-id').value = visitId;
        var d = visitDate ? new Date(visitDate).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }) : '—';
        document.getElementById('modal-visit-info').innerHTML = 
          '<div class="text-sm text-white font-semibold">' + (clientName || 'Client') + '</div>' +
          '<div class="text-xs" style="color:#94a3b8;">Visite #' + visitId + ' · Prévue le ' + d + (contractId ? ' · Contrat #' + contractId : '') + '</div>';
        document.getElementById('validation-modal').classList.remove('hidden');
      }
      function closeValidationModal() {
        document.getElementById('validation-modal').classList.add('hidden');
      }
      document.getElementById('validation-modal').addEventListener('click', function(e) {
        if (e.target === this) closeValidationModal();
      });
    `}} />
  </AdminLayout>
  )
}

// ============================================================
// PAGE ADMIN MESSAGES
// ============================================================

export const AdminMessagesPage = ({ messages = [], unreadCount = 0, success, deleted }: { messages: any[]; unreadCount?: number; success?: string; deleted?: string }) => {
  return (
  <AdminLayout activePage="messages">
    <div class="space-y-6">
      {/* Header */}
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-3">
            <i class="fas fa-envelope text-blue-400"></i>
            Messages de contact
            {unreadCount > 0 && (
              <span class="bg-red-500 text-white text-sm font-bold rounded-full px-2.5 py-0.5">{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</span>
            )}
          </h1>
          <p class="text-sm text-gray-400 mt-1">{messages.length} message{messages.length !== 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div class="p-4 rounded-xl text-sm" style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); color:#34d399;">
          <i class="fas fa-check-circle mr-2"></i>Action effectuée avec succès.
        </div>
      )}
      {deleted && (
        <div class="p-4 rounded-xl text-sm" style="background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.3); color:#fbbf24;">
          <i class="fas fa-trash mr-2"></i>Message supprimé.
        </div>
      )}

      {/* Messages list */}
      {messages.length === 0 ? (
        <div class="text-center py-20 rounded-2xl" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
          <i class="fas fa-inbox text-5xl text-gray-600 mb-4"></i>
          <p class="text-gray-400 text-lg">Aucun message reçu</p>
          <p class="text-gray-500 text-sm mt-2">Les messages envoyés via le formulaire de contact apparaîtront ici.</p>
        </div>
      ) : (
        <div class="space-y-3">
          {messages.map((m: any) => (
            <div
              class="rounded-xl p-5 transition-all hover:shadow-lg"
              style={`background:${m.is_read ? '#111827' : '#0f1d35'}; border:1px solid ${m.is_read ? 'rgba(56,189,248,0.08)' : 'rgba(59,130,246,0.3)'};`}
            >
              <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-3">
                  {!m.is_read && (
                    <span class="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" title="Non lu"></span>
                  )}
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={`background:${m.is_read ? 'rgba(100,116,139,0.15)' : 'rgba(59,130,246,0.15)'};`}>
                    <i class={`fas fa-user text-sm ${m.is_read ? 'text-gray-500' : 'text-blue-400'}`}></i>
                  </div>
                  <div>
                    <h3 class={`font-semibold ${m.is_read ? 'text-gray-300' : 'text-white'}`}>{m.name}</h3>
                    <div class="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-0.5">
                      {m.phone && (
                        <span><i class="fas fa-phone mr-1"></i>{m.phone}</span>
                      )}
                      {m.email && (
                        <span><i class="fas fa-envelope mr-1"></i>{m.email}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span class="text-xs text-gray-500">
                    <i class="fas fa-clock mr-1"></i>
                    {m.created_at ? new Date(m.created_at + 'Z').toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </span>
                  {m.is_read ? (
                    <span class="text-xs px-2 py-0.5 rounded-full" style="background:rgba(100,116,139,0.15); color:#94a3b8;">Lu</span>
                  ) : (
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium" style="background:rgba(59,130,246,0.15); color:#60a5fa;">Nouveau</span>
                  )}
                </div>
              </div>

              {/* Message body */}
              <div class="rounded-lg p-4 mb-3" style="background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05);">
                <p class="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{m.message}</p>
              </div>

              {/* Actions */}
              <div class="flex flex-wrap items-center gap-2">
                {!m.is_read ? (
                  <form method="post" action={`/api/admin/messages/${m.id}/read`} style="display:inline;">
                    <button type="submit" class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors" style="background:rgba(16,185,129,0.1); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
                      <i class="fas fa-check mr-1"></i>Marquer comme lu
                    </button>
                  </form>
                ) : (
                  <form method="post" action={`/api/admin/messages/${m.id}/unread`} style="display:inline;">
                    <button type="submit" class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors" style="background:rgba(59,130,246,0.1); color:#60a5fa; border:1px solid rgba(59,130,246,0.2);">
                      <i class="fas fa-envelope mr-1"></i>Marquer non lu
                    </button>
                  </form>
                )}
                {m.phone && (
                  <a href={`tel:${m.phone}`} class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors" style="background:rgba(16,185,129,0.1); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
                    <i class="fas fa-phone mr-1"></i>Appeler
                  </a>
                )}
                {m.email && (
                  <a href={`mailto:${m.email}`} class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors" style="background:rgba(56,189,248,0.1); color:#38bdf8; border:1px solid rgba(56,189,248,0.2);">
                    <i class="fas fa-envelope mr-1"></i>Email
                  </a>
                )}
                {m.phone && (
                  <a href={`https://wa.me/${m.phone.replace(/[^0-9+]/g, '')}`} target="_blank" rel="noopener noreferrer" class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors" style="background:rgba(37,211,102,0.1); color:#25d366; border:1px solid rgba(37,211,102,0.2);">
                    <i class="fab fa-whatsapp mr-1"></i>WhatsApp
                  </a>
                )}
                <form method="post" action={`/api/admin/messages/${m.id}/delete`} style="display:inline;" onsubmit="return confirm('Supprimer ce message ?')">
                  <button type="submit" class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors" style="background:rgba(239,68,68,0.1); color:#f87171; border:1px solid rgba(239,68,68,0.2);">
                    <i class="fas fa-trash mr-1"></i>Supprimer
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </AdminLayout>
  )
}

// ============================================================
// ADMIN RÉALISATIONS PAGE
// ============================================================

const categoryLabels: Record<string, string> = {
  climatisation: 'Climatisation',
  ventilation: 'Ventilation',
  chambre_froide: 'Chambre froide',
  maintenance: 'Maintenance',
  commercial: 'Commercial',
  residentiel: 'R\u00e9sidentiel'
}

export const AdminRealisationsPage = ({ realisations = [], success, error }: { realisations: any[]; success?: string | null; error?: string | null }) => {
  const totalVisible = realisations.filter((r: any) => r.is_visible).length
  const totalFeatured = realisations.filter((r: any) => r.is_featured).length

  return (
  <AdminLayout activePage="realisations">
    <div class="mb-6">
      <h2 class="text-xl font-bold text-white">Gestion des r\u00e9alisations</h2>
      <p class="text-sm text-gray-400 mt-1">Ajoutez et g\u00e9rez vos projets termin\u00e9s visibles sur le site</p>
    </div>

    {success && (
      <div class="mb-4 p-3 rounded-lg text-sm font-medium" style="background:rgba(22,163,74,0.15); color:#22c55e; border:1px solid rgba(22,163,74,0.3);">
        <i class="fas fa-check-circle mr-2"></i>
        {success === 'added' ? 'R\u00e9alisation ajout\u00e9e avec succ\u00e8s' : success === 'updated' ? 'R\u00e9alisation mise \u00e0 jour' : success === 'deleted' ? 'R\u00e9alisation supprim\u00e9e' : 'Op\u00e9ration r\u00e9ussie'}
      </div>
    )}
    {error && (
      <div class="mb-4 p-3 rounded-lg text-sm font-medium" style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3);">
        <i class="fas fa-exclamation-circle mr-2"></i>Erreur : {error}
      </div>
    )}

    {/* KPIs */}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {[
        { label: 'Total', val: realisations.length, icon: 'fa-images', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
        { label: 'Visibles', val: totalVisible, icon: 'fa-eye', color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
        { label: 'En vedette', val: totalFeatured, icon: 'fa-star', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' }
      ].map(s => (
        <div class="rounded-xl p-4 card-shadow" style={`background:${s.bg}; border:1px solid ${s.border};`}>
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style={`background:${s.bg};`}>
              <i class={`fas ${s.icon} text-lg`} style={`color:${s.color};`}></i>
            </div>
            <div>
              <div class="text-xl font-bold text-white">{s.val}</div>
              <div class="text-xs text-gray-400">{s.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Formulaire d'ajout */}
    <div class="rounded-2xl card-shadow overflow-hidden mb-6" style="background:#111827; border:1px solid rgba(16,185,129,0.2);">
      <div class="p-5" style="border-bottom:1px solid rgba(16,185,129,0.15);">
        <h3 class="font-semibold text-white flex items-center space-x-2">
          <i class="fas fa-plus-circle text-green-400"></i>
          <span>Ajouter une r\u00e9alisation</span>
        </h3>
      </div>
      <form method="post" action="/api/admin/realisations/add" class="p-5 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-gray-400 mb-1 font-semibold">Titre *</label>
            <input type="text" name="title" required placeholder="Ex: Installation Split 18000 BTU" class="w-full px-3 py-2 rounded-lg text-sm text-white" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,163,184,0.2);" />
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1 font-semibold">Cat\u00e9gorie</label>
            <select name="category" class="w-full px-3 py-2 rounded-lg text-sm text-white" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,163,184,0.2);">
              <option value="climatisation">Climatisation</option>
              <option value="ventilation">Ventilation</option>
              <option value="chambre_froide">Chambre froide</option>
              <option value="maintenance">Maintenance</option>
              <option value="commercial">Commercial</option>
              <option value="residentiel">R\u00e9sidentiel</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1 font-semibold">Description</label>
          <textarea name="description" rows={3} placeholder="D\u00e9crivez le projet r\u00e9alis\u00e9..." class="w-full px-3 py-2 rounded-lg text-sm text-white" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,163,184,0.2); resize:vertical;"></textarea>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs text-gray-400 mb-1 font-semibold">Client</label>
            <input type="text" name="client_name" placeholder="Nom du client" class="w-full px-3 py-2 rounded-lg text-sm text-white" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,163,184,0.2);" />
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1 font-semibold">Quartier</label>
            <input type="text" name="quartier" placeholder="Ex: Ouaga 2000" class="w-full px-3 py-2 rounded-lg text-sm text-white" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,163,184,0.2);" />
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1 font-semibold">Date r\u00e9alisation</label>
            <input type="date" name="date_realisation" class="w-full px-3 py-2 rounded-lg text-sm text-white" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,163,184,0.2);" />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-gray-400 mb-1 font-semibold">URL de l'image</label>
            <input type="url" name="image_url" placeholder="https://..." class="w-full px-3 py-2 rounded-lg text-sm text-white" style="background:rgba(15,23,42,0.6); border:1px solid rgba(148,163,184,0.2);" />
          </div>
          <div class="flex items-end">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" name="is_featured" value="1" class="rounded" />
              <span class="text-sm text-gray-300"><i class="fas fa-star text-yellow-400 mr-1"></i>Mettre en vedette</span>
            </label>
          </div>
        </div>
        <button type="submit" class="px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:scale-105" style="background:linear-gradient(135deg,#10b981,#059669);">
          <i class="fas fa-plus mr-2"></i>Ajouter la r\u00e9alisation
        </button>
      </form>
    </div>

    {/* Liste des réalisations */}
    <div class="rounded-2xl card-shadow overflow-hidden" style="background:#111827; border:1px solid rgba(59,130,246,0.1);">
      <div class="p-5" style="border-bottom:1px solid rgba(148,163,184,0.08);">
        <h3 class="font-semibold text-white flex items-center space-x-2">
          <i class="fas fa-list text-blue-400"></i>
          <span>Toutes les r\u00e9alisations ({realisations.length})</span>
        </h3>
      </div>
      {realisations.length === 0 ? (
        <div class="p-8 text-center">
          <i class="fas fa-images text-3xl text-gray-600 mb-3"></i>
          <p class="text-gray-400">Aucune r\u00e9alisation pour le moment</p>
        </div>
      ) : (
        <div class="divide-y divide-gray-700/30">
          {realisations.map((r: any) => (
            <div class="p-5 hover:bg-blue-900/10 transition-colors">
              <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <h4 class="font-bold text-white text-sm">{r.title}</h4>
                    {r.is_featured ? <span class="text-xs px-2 py-0.5 rounded-full font-medium" style="background:rgba(251,191,36,0.15); color:#fbbf24;"><i class="fas fa-star mr-1"></i>Vedette</span> : null}
                    {!r.is_visible ? <span class="text-xs px-2 py-0.5 rounded-full font-medium" style="background:rgba(239,68,68,0.15); color:#f87171;"><i class="fas fa-eye-slash mr-1"></i>Masqu\u00e9</span> : null}
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium" style="background:rgba(59,130,246,0.15); color:#60a5fa;">{categoryLabels[r.category] || r.category}</span>
                  </div>
                  {r.description && <p class="text-xs text-gray-400 mb-2 line-clamp-2">{r.description}</p>}
                  <div class="flex flex-wrap gap-3 text-xs text-gray-500">
                    {r.client_name && <span><i class="fas fa-user mr-1"></i>{r.client_name}</span>}
                    {r.quartier && <span><i class="fas fa-map-marker-alt mr-1"></i>{r.quartier}</span>}
                    {r.date_realisation && <span><i class="fas fa-calendar mr-1"></i>{r.date_realisation}</span>}
                  </div>
                </div>
                {r.image_url && (
                  <img src={r.image_url} alt={r.title} class="w-20 h-20 rounded-lg object-cover flex-shrink-0" style="border:1px solid rgba(148,163,184,0.15);" />
                )}
              </div>
              <div class="flex items-center gap-2 mt-3">
                <button onclick={`document.getElementById('edit-form-${r.id}').classList.toggle('hidden')`} class="text-xs px-3 py-1.5 rounded-lg font-medium" style="background:rgba(59,130,246,0.1); color:#60a5fa; border:1px solid rgba(59,130,246,0.2);">
                  <i class="fas fa-edit mr-1"></i>Modifier
                </button>
                <form method="post" action="/api/admin/realisations/delete" style="display:inline" onsubmit="return confirm('Supprimer cette r\u00e9alisation ?')">
                  <input type="hidden" name="id" value={String(r.id)} />
                  <button type="submit" class="text-xs px-3 py-1.5 rounded-lg font-medium" style="background:rgba(239,68,68,0.1); color:#f87171; border:1px solid rgba(239,68,68,0.2);">
                    <i class="fas fa-trash mr-1"></i>Supprimer
                  </button>
                </form>
              </div>
              {/* Formulaire d'\u00e9dition inline (cach\u00e9) */}
              <form id={`edit-form-${r.id}`} method="post" action="/api/admin/realisations/update" class="hidden mt-4 p-4 rounded-xl space-y-3" style="background:rgba(15,23,42,0.5); border:1px solid rgba(148,163,184,0.1);">
                <input type="hidden" name="id" value={String(r.id)} />
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" name="title" value={r.title} required class="w-full px-3 py-2 rounded-lg text-sm text-white" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.2);" />
                  <select name="category" class="w-full px-3 py-2 rounded-lg text-sm text-white" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.2);">
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <option value={k} selected={r.category === k}>{v}</option>
                    ))}
                  </select>
                </div>
                <textarea name="description" rows={2} class="w-full px-3 py-2 rounded-lg text-sm text-white" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.2); resize:vertical;">{r.description || ''}</textarea>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="text" name="client_name" value={r.client_name || ''} placeholder="Client" class="w-full px-3 py-2 rounded-lg text-sm text-white" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.2);" />
                  <input type="text" name="quartier" value={r.quartier || ''} placeholder="Quartier" class="w-full px-3 py-2 rounded-lg text-sm text-white" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.2);" />
                  <input type="date" name="date_realisation" value={r.date_realisation || ''} class="w-full px-3 py-2 rounded-lg text-sm text-white" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.2);" />
                </div>
                <input type="url" name="image_url" value={r.image_url || ''} placeholder="URL image" class="w-full px-3 py-2 rounded-lg text-sm text-white" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.2);" />
                <div class="flex items-center gap-4">
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" name="is_featured" value="1" checked={!!r.is_featured} />
                    <span class="text-sm text-gray-300">En vedette</span>
                  </label>
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" name="is_visible" value="1" checked={!!r.is_visible} />
                    <span class="text-sm text-gray-300">Visible</span>
                  </label>
                </div>
                <button type="submit" class="px-4 py-2 rounded-lg text-sm font-bold text-white" style="background:linear-gradient(135deg,#3b82f6,#2563eb);">
                  <i class="fas fa-save mr-1"></i>Enregistrer
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  </AdminLayout>
  )
}

// ============================================================
// SAV / Tickets Support
// ============================================================

const ticketCategoryLabels: Record<string, { label: string; icon: string; color: string }> = {
  panne: { label: 'Panne', icon: 'fa-exclamation-triangle', color: '#f87171' },
  garantie: { label: 'Garantie', icon: 'fa-shield-alt', color: '#60a5fa' },
  installation: { label: 'Installation', icon: 'fa-tools', color: '#a78bfa' },
  maintenance: { label: 'Maintenance', icon: 'fa-wrench', color: '#fbbf24' },
  reclamation: { label: 'Réclamation', icon: 'fa-flag', color: '#fb923c' },
  autre: { label: 'Autre', icon: 'fa-question-circle', color: '#94a3b8' }
}

const ticketStatusLabels: Record<string, { label: string; color: string; bg: string }> = {
  ouvert: { label: '🟢 Ouvert', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  en_cours: { label: '🔵 En cours', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  attente_client: { label: '🟡 Attente client', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  resolu: { label: '✅ Résolu', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  ferme: { label: '⚫ Fermé', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' }
}

const ticketPriorityLabels: Record<string, { label: string; color: string }> = {
  basse: { label: 'Basse', color: '#94a3b8' },
  normal: { label: 'Normal', color: '#60a5fa' },
  haute: { label: 'Haute', color: '#fb923c' },
  urgente: { label: 'Urgente', color: '#f87171' }
}

export const AdminSAVPage = ({ tickets = [], filterStatus = '' }: { tickets: any[]; filterStatus?: string }) => {
  const filtered = filterStatus ? tickets.filter((t: any) => t.status === filterStatus) : tickets
  const open = tickets.filter((t: any) => t.status === 'ouvert').length
  const inProgress = tickets.filter((t: any) => t.status === 'en_cours').length
  const waiting = tickets.filter((t: any) => t.status === 'attente_client').length
  const resolved = tickets.filter((t: any) => t.status === 'resolu' || t.status === 'ferme').length

  return (
  <AdminLayout activePage="sav">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl font-bold text-white"><i class="fas fa-headset mr-2 text-cyan-400"></i>SAV / Tickets Support</h2>
        <p class="text-sm text-gray-400 mt-1">{tickets.length} tickets · {open} ouverts · {inProgress} en cours</p>
      </div>
      <div class="flex gap-2">
        <a href="/api/admin/export/tickets" class="text-xs px-3 py-2 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
          <i class="fas fa-file-csv"></i>
          <span>Export CSV</span>
        </a>
        <button onclick="document.getElementById('create-ticket-modal').classList.remove('hidden')"
          class="btn-primary font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 text-xs shadow-md">
          <i class="fas fa-plus"></i>
          <span>Nouveau ticket</span>
        </button>
      </div>
    </div>

    {/* KPIs */}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {[
        { label: 'Ouverts', val: open, icon: 'fa-folder-open', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' },
        { label: 'En cours', val: inProgress, icon: 'fa-spinner', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
        { label: 'Attente client', val: waiting, icon: 'fa-clock', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
        { label: 'Résolus/Fermés', val: resolved, icon: 'fa-check-circle', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' }
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

    {/* Status filters */}
    <div class="flex flex-wrap gap-2 mb-6">
      {[
        { s: '', label: 'Tous', count: tickets.length },
        { s: 'ouvert', label: 'Ouverts', count: open },
        { s: 'en_cours', label: 'En cours', count: inProgress },
        { s: 'attente_client', label: 'Attente', count: waiting },
        { s: 'resolu', label: 'Résolus', count: tickets.filter((t: any) => t.status === 'resolu').length },
        { s: 'ferme', label: 'Fermés', count: tickets.filter((t: any) => t.status === 'ferme').length }
      ].map(f => (
        <a href={`/admin/sav${f.s ? '?status=' + f.s : ''}`}
          class={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-colors ${filterStatus === f.s ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-700 text-gray-400 hover:bg-cyan-900/10'}`}
          style={filterStatus !== f.s ? 'background:rgba(15,23,42,0.5);' : ''}>
          {f.label} ({f.count})
        </a>
      ))}
    </div>

    {/* Tickets list */}
    {filtered.length === 0 ? (
      <div class="text-center py-16 rounded-xl" style="background:rgba(15,23,42,0.5); border:1px solid rgba(148,163,184,0.1);">
        <i class="fas fa-headset text-3xl text-gray-600 mb-3"></i>
        <p class="text-gray-500">Aucun ticket{filterStatus ? ` avec ce statut` : ''}</p>
      </div>
    ) : (
      <div class="space-y-3">
        {filtered.map((t: any) => {
          const cat = ticketCategoryLabels[t.category] || ticketCategoryLabels.autre
          const st = ticketStatusLabels[t.status] || ticketStatusLabels.ouvert
          const pr = ticketPriorityLabels[t.priority] || ticketPriorityLabels.normal
          return (
          <a href={`/admin/sav/${t.id}`} class="block rounded-xl p-4 hover:scale-[1.005] transition-all cursor-pointer" style="background:rgba(15,23,42,0.5); border:1px solid rgba(148,163,184,0.1);">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <span class="text-xs font-mono px-2 py-0.5 rounded-lg" style="background:rgba(59,130,246,0.15); color:#60a5fa;">{t.ticket_ref}</span>
                  <span class="text-xs px-2 py-0.5 rounded-lg font-medium" style={`background:${st.bg}; color:${st.color};`}>{st.label}</span>
                  <span class="text-xs px-2 py-0.5 rounded-lg" style={`color:${pr.color};`}>
                    <i class="fas fa-flag mr-1"></i>{pr.label}
                  </span>
                </div>
                <h3 class="text-white font-semibold text-sm truncate">{t.subject}</h3>
                <div class="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                  <span><i class={`fas ${cat.icon} mr-1`} style={`color:${cat.color};`}></i>{cat.label}</span>
                  <span><i class="fas fa-user mr-1"></i>{t.client_name || t.client_phone}</span>
                  {t.product_info && <span><i class="fas fa-solar-panel mr-1"></i>{t.product_info}</span>}
                  <span><i class="fas fa-clock mr-1"></i>{t.created_at?.substring(0, 10)}</span>
                </div>
              </div>
              <i class="fas fa-chevron-right text-gray-600 mt-2"></i>
            </div>
          </a>
          )
        })}
      </div>
    )}

    {/* Modal création ticket */}
    <div id="create-ticket-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.7);">
      <div class="rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style="background:linear-gradient(135deg,#0f172a,#1e293b); border:1px solid rgba(148,163,184,0.15);">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-white"><i class="fas fa-plus-circle mr-2 text-cyan-400"></i>Nouveau ticket SAV</h3>
          <button onclick="document.getElementById('create-ticket-modal').classList.add('hidden')" class="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>
        <form method="post" action="/api/admin/sav/create" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-gray-400 mb-1">Nom client</label>
              <input name="client_name" class="w-full rounded-xl px-3 py-2 text-sm text-white" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.15);" />
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">Téléphone (Whatsapp) *</label>
              <input name="client_phone" required class="w-full rounded-xl px-3 py-2 text-sm text-white" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.15);" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-gray-400 mb-1">Catégorie</label>
              <select name="category" class="w-full rounded-xl px-3 py-2 text-sm text-white" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.15);">
                <option value="panne">Panne</option>
                <option value="garantie">Garantie</option>
                <option value="installation">Installation</option>
                <option value="maintenance">Maintenance</option>
                <option value="reclamation">Réclamation</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">Priorité</label>
              <select name="priority" class="w-full rounded-xl px-3 py-2 text-sm text-white" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.15);">
                <option value="basse">Basse</option>
                <option value="normal" selected>Normal</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">Produit concerné</label>
            <input name="product_info" class="w-full rounded-xl px-3 py-2 text-sm text-white" placeholder="Ex: Kit solaire 200W" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.15);" />
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">Sujet *</label>
            <input name="subject" required class="w-full rounded-xl px-3 py-2 text-sm text-white" placeholder="Résumé du problème" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.15);" />
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">Description *</label>
            <textarea name="description" required rows={4} class="w-full rounded-xl px-3 py-2 text-sm text-white" placeholder="Décrivez le problème en détail..." style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.15);"></textarea>
          </div>
          <button type="submit" class="btn-primary w-full py-2.5 rounded-xl font-semibold text-sm">
            <i class="fas fa-paper-plane mr-2"></i>Créer le ticket
          </button>
        </form>
      </div>
    </div>
  </AdminLayout>
  )
}

export const AdminSAVDetailPage = ({ ticket, messages = [] }: { ticket: any; messages: any[] }) => {
  const cat = ticketCategoryLabels[ticket.category] || ticketCategoryLabels.autre
  const st = ticketStatusLabels[ticket.status] || ticketStatusLabels.ouvert
  const pr = ticketPriorityLabels[ticket.priority] || ticketPriorityLabels.normal

  return (
  <AdminLayout activePage="sav">
    <div class="mb-6">
      <a href="/admin/sav" class="text-cyan-400 text-sm hover:underline mb-2 inline-block">
        <i class="fas fa-arrow-left mr-1"></i>Retour aux tickets
      </a>
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-mono px-2 py-0.5 rounded-lg" style="background:rgba(59,130,246,0.15); color:#60a5fa;">{ticket.ticket_ref}</span>
            <span class="text-xs px-2 py-0.5 rounded-lg font-medium" style={`background:${st.bg}; color:${st.color};`}>{st.label}</span>
            <span class="text-xs px-2 py-0.5 rounded-lg" style={`color:${pr.color};`}>
              <i class="fas fa-flag mr-1"></i>{pr.label}
            </span>
          </div>
          <h2 class="text-xl font-bold text-white">{ticket.subject}</h2>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main conversation area */}
      <div class="lg:col-span-2 space-y-4">
        {/* Original description */}
        <div class="rounded-xl p-5" style="background:rgba(15,23,42,0.5); border:1px solid rgba(148,163,184,0.1);">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style="background:rgba(59,130,246,0.2); color:#60a5fa;">
              <i class="fas fa-user"></i>
            </div>
            <div>
              <span class="text-white text-sm font-semibold">{ticket.client_name || ticket.client_phone}</span>
              <span class="text-gray-500 text-xs ml-2">{ticket.created_at}</span>
            </div>
          </div>
          <p class="text-gray-300 text-sm whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {/* Messages thread */}
        {messages.map((m: any) => (
          <div class="rounded-xl p-4" style={`background:${m.sender_type === 'admin' ? 'rgba(59,130,246,0.08)' : 'rgba(15,23,42,0.5)'}; border:1px solid ${m.sender_type === 'admin' ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.1)'};`}>
            <div class="flex items-center gap-2 mb-2">
              <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={`background:${m.sender_type === 'admin' ? 'rgba(59,130,246,0.2)' : 'rgba(52,211,153,0.2)'}; color:${m.sender_type === 'admin' ? '#60a5fa' : '#34d399'};`}>
                <i class={`fas ${m.sender_type === 'admin' ? 'fa-user-shield' : 'fa-user'}`}></i>
              </div>
              <span class="text-white text-sm font-medium">{m.sender_name || (m.sender_type === 'admin' ? 'Admin' : 'Client')}</span>
              <span class="text-gray-600 text-xs">{m.created_at}</span>
            </div>
            <p class="text-gray-300 text-sm whitespace-pre-wrap">{m.message}</p>
          </div>
        ))}

        {/* Reply form */}
        {(ticket.status !== 'ferme') && (
        <form method="post" action="/api/admin/sav/message" class="rounded-xl p-4" style="background:rgba(15,23,42,0.5); border:1px solid rgba(148,163,184,0.1);">
          <input type="hidden" name="ticket_id" value={ticket.id} />
          <label class="block text-xs text-gray-400 mb-2"><i class="fas fa-reply mr-1"></i>Répondre</label>
          <textarea name="message" required rows={3} class="w-full rounded-xl px-3 py-2 text-sm text-white mb-3" placeholder="Votre réponse..." style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.15);"></textarea>
          <button type="submit" class="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">
            <i class="fas fa-paper-plane mr-1"></i>Envoyer
          </button>
        </form>
        )}
      </div>

      {/* Sidebar: ticket info + actions */}
      <div class="space-y-4">
        {/* Ticket info card */}
        <div class="rounded-xl p-5" style="background:rgba(15,23,42,0.5); border:1px solid rgba(148,163,184,0.1);">
          <h3 class="text-sm font-bold text-white mb-3"><i class="fas fa-info-circle mr-1 text-cyan-400"></i>Informations</h3>
          <div class="space-y-2.5 text-xs">
            <div class="flex justify-between"><span class="text-gray-500">Client:</span><span class="text-white">{ticket.client_name || '-'}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Téléphone:</span><span class="text-white">{ticket.client_phone}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Catégorie:</span><span style={`color:${cat.color};`}><i class={`fas ${cat.icon} mr-1`}></i>{cat.label}</span></div>
            {ticket.product_info && <div class="flex justify-between"><span class="text-gray-500">Produit:</span><span class="text-white">{ticket.product_info}</span></div>}
            <div class="flex justify-between"><span class="text-gray-500">Créé le:</span><span class="text-white">{ticket.created_at?.substring(0, 10)}</span></div>
            {ticket.resolved_at && <div class="flex justify-between"><span class="text-gray-500">Résolu le:</span><span class="text-green-400">{ticket.resolved_at?.substring(0, 10)}</span></div>}
          </div>
        </div>

        {/* Status update form */}
        <a href={`/admin/devis/new?ticket_id=${ticket.id}`} class="rounded-xl p-4 flex items-center justify-center space-x-2 text-sm font-semibold transition-all w-full" style="background:rgba(251,146,60,0.1);border:1px solid rgba(251,146,60,0.3);color:#fb923c;">
          <i class="fas fa-file-invoice-dollar"></i>
          <span>Créer un devis réparation</span>
        </a>
        <form method="post" action="/api/admin/sav/update-status" class="rounded-xl p-5" style="background:rgba(15,23,42,0.5); border:1px solid rgba(148,163,184,0.1);">
          <h3 class="text-sm font-bold text-white mb-3"><i class="fas fa-edit mr-1 text-cyan-400"></i>Modifier le statut</h3>
          <input type="hidden" name="id" value={ticket.id} />
          <select name="status" class="w-full rounded-xl px-3 py-2 text-sm text-white mb-3" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.15);">
            {['ouvert', 'en_cours', 'attente_client', 'resolu', 'ferme'].map(s => (
              <option value={s} selected={ticket.status === s}>{(ticketStatusLabels[s] || { label: s }).label}</option>
            ))}
          </select>
          <label class="block text-xs text-gray-400 mb-1">Notes de résolution</label>
          <textarea name="resolution_notes" rows={3} class="w-full rounded-xl px-3 py-2 text-sm text-white mb-3" style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.15);">{ticket.resolution_notes || ''}</textarea>
          <button type="submit" class="bg-cyan-600 hover:bg-cyan-700 text-white w-full py-2 rounded-xl text-sm font-semibold transition-colors">
            <i class="fas fa-save mr-1"></i>Mettre à jour
          </button>
        </form>
      </div>
    </div>
  </AdminLayout>
  )
}

// ============================================================
// AUDIT LOG PAGE
// ============================================================
const logCategoryColors: Record<string, { color: string; bg: string; icon: string }> = {
  auth: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', icon: 'fa-sign-in-alt' },
  order: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', icon: 'fa-shopping-cart' },
  appointment: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', icon: 'fa-calendar' },
  review: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: 'fa-star' },
  maintenance: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: 'fa-tools' },
  payment: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', icon: 'fa-credit-card' },
  contact: { color: '#fb923c', bg: 'rgba(249,115,22,0.12)', icon: 'fa-envelope' },
  profile: { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', icon: 'fa-user' },
}

export const AdminAuditLogPage = ({ logs = [] }: { logs: any[] }) => {
  const categories = [...new Set(logs.map((l: any) => l.category).filter(Boolean))]

  return (
  <AdminLayout activePage="audit-log">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-white"><i class="fas fa-clipboard-list mr-2 text-cyan-400"></i>Journal d'activité</h2>
        <p class="text-sm text-gray-400 mt-1">{logs.length} entrées enregistrées</p>
      </div>
    </div>

    {/* Category summary */}
    <div class="flex flex-wrap gap-2 mb-6">
      {categories.map(cat => {
        const info = logCategoryColors[cat as string] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: 'fa-circle' }
        const count = logs.filter((l: any) => l.category === cat).length
        return (
        <span class="text-xs px-3 py-1.5 rounded-xl font-medium" style={`background:${info.bg}; color:${info.color};`}>
          <i class={`fas ${info.icon} mr-1`}></i>{String(cat)} ({count})
        </span>
        )
      })}
    </div>

    {/* Log entries */}
    {logs.length === 0 ? (
      <div class="text-center py-16 rounded-xl" style="background:rgba(15,23,42,0.5); border:1px solid rgba(148,163,184,0.1);">
        <i class="fas fa-clipboard-list text-3xl text-gray-600 mb-3"></i>
        <p class="text-gray-500">Aucune activité enregistrée</p>
      </div>
    ) : (
      <div class="rounded-2xl overflow-hidden card-shadow" style="background:#111827; border:1px solid rgba(56,189,248,0.1);">
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="border-b border-gray-700/50" style="background:#0e1726;">
              <tr>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Catégorie</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Détails</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">IP</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/30" data-paginate="30">
              {logs.map((l: any) => {
                const info = logCategoryColors[l.category] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: 'fa-circle' }
                return (
                <tr class="hover:bg-cyan-900/10 transition-colors">
                  <td class="py-3 px-4 text-gray-400 whitespace-nowrap">{(l.created_at || '').substring(0, 16)}</td>
                  <td class="py-3 px-4 text-white">{l.client_phone || `#${l.client_id}`}</td>
                  <td class="py-3 px-4 hidden sm:table-cell">
                    <span class="px-2 py-0.5 rounded-lg text-xs font-medium" style={`background:${info.bg}; color:${info.color};`}>
                      <i class={`fas ${info.icon} mr-1`}></i>{l.category || '-'}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-white font-medium">{l.action}</td>
                  <td class="py-3 px-4 text-gray-400 max-w-xs truncate hidden md:table-cell">{l.details || '-'}</td>
                  <td class="py-3 px-4 text-gray-600 font-mono text-xs hidden lg:table-cell">{l.ip_address || '-'}</td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </AdminLayout>
  )
}

/* ============= ADMIN NOTIFICATIONS PAGE ============= */
export const AdminNotificationsPage = ({ notifications = [] }: { notifications: any[] }) => {
  const unread = notifications.filter((n: any) => !n.read).length
  const typeIcons: Record<string, string> = { order: 'fa-shopping-cart', rdv: 'fa-calendar', review: 'fa-star', contact: 'fa-envelope', sav: 'fa-headset', client: 'fa-user', payment: 'fa-credit-card' }
  const typeColors: Record<string, string> = { order: '#a78bfa', rdv: '#fbbf24', review: '#f472b6', contact: '#60a5fa', sav: '#fb923c', client: '#34d399', payment: '#10b981' }

  return (
  <AdminLayout activePage="notifications">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 class="text-xl font-bold text-white"><i class="fas fa-bell mr-2 text-cyan-400"></i>Centre de notifications</h2>
        <p class="text-sm text-gray-400 mt-1">{notifications.length} notifications · {unread} non lues</p>
      </div>
      <button onclick="fetch('/api/admin/notifications/mark-read',{method:'POST'}).then(()=>location.reload())" class="px-4 py-2 rounded-xl text-xs font-bold text-white" style="background:linear-gradient(135deg,#0891b2,#06b6d4);">
        <i class="fas fa-check-double mr-2"></i>Tout marquer comme lu
      </button>
    </div>

    {/* Stats */}
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Total', val: notifications.length, color: '#38bdf8', icon: 'fa-bell' },
        { label: 'Non lues', val: unread, color: '#ef4444', icon: 'fa-envelope' },
        { label: 'Aujourd\'hui', val: notifications.filter((n: any) => n.created_at && n.created_at.startsWith(new Date().toISOString().slice(0,10))).length, color: '#10b981', icon: 'fa-clock' },
        { label: 'Types', val: [...new Set(notifications.map((n: any) => n.type))].length, color: '#a78bfa', icon: 'fa-layer-group' },
      ].map(s => (
        <div class="rounded-xl p-4" style={`background:rgba(15,23,42,0.5); border:1px solid ${s.color}20;`}>
          <div class="flex items-center gap-2 mb-2">
            <i class={`fas ${s.icon} text-sm`} style={`color:${s.color};`}></i>
            <span class="text-xs text-gray-400">{s.label}</span>
          </div>
          <div class="text-lg font-bold text-white">{s.val}</div>
        </div>
      ))}
    </div>

    {notifications.length === 0 ? (
      <div class="text-center py-16 rounded-xl" style="background:rgba(15,23,42,0.5); border:1px solid rgba(148,163,184,0.1);">
        <i class="fas fa-bell-slash text-3xl text-gray-600 mb-3"></i>
        <p class="text-gray-500">Aucune notification</p>
      </div>
    ) : (
      <div class="space-y-2">
        {notifications.map((n: any) => {
          const icon = typeIcons[n.type] || 'fa-bell'
          const color = typeColors[n.type] || '#94a3b8'
          return (
          <div class={`flex items-start gap-4 p-4 rounded-xl transition-colors ${n.read ? 'opacity-60' : ''}`} style={`background:${n.read ? 'rgba(15,23,42,0.3)' : 'rgba(6,182,212,0.05)'}; border:1px solid ${n.read ? 'rgba(148,163,184,0.08)' : 'rgba(56,189,248,0.15)'};`}>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={`background:${color}18;`}>
              <i class={`fas ${icon} text-sm`} style={`color:${color};`}></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class={`text-sm text-white ${n.read ? '' : 'font-semibold'}`}>{n.summary}</p>
              <div class="flex items-center gap-3 mt-1">
                <span class="text-xs text-gray-500">{(n.created_at || '').replace('T', ' ').substring(0, 16)}</span>
                <span class="text-xs px-2 py-0.5 rounded-lg font-medium" style={`background:${color}18; color:${color};`}>{n.type}</span>
              </div>
            </div>
            {!n.read && <div class="w-2.5 h-2.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>}
          </div>
          )
        })}
      </div>
    )}
  </AdminLayout>
  )
}