// CommandesKPIs — Hono JSX SSR (pas React).
// Calcul des KPIs côté serveur à partir des commandes passées en props.
import type { Order } from '../../data/store';

interface CommandesKPIsProps {
  orders: Order[];
}

export const CommandesKPIs = ({ orders }: CommandesKPIsProps) => {
  const totalOrders = orders.length;
  const paidOrders = orders.filter(o =>
    o.status === 'confirme' || o.status === 'en_livraison' || o.status === 'livre'
  ).length;
  const installedOrders = orders.filter(o => o.status === 'livre').length;
  const pendingOnline = orders.filter(o =>
    !o.appointment_id && (o.type === 'vente' || o.type === 'commande') && o.status === 'en_attente'
  ).length;
  const estimatedCA = orders.reduce((sum, o) => sum + (o.total_price || 0), 0);

  const kpis = [
    { label: 'Total commandes', val: totalOrders,  icon: 'fa-shopping-bag',    bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)',  color: '#60a5fa' },
    { label: 'Payées',          val: paidOrders,   icon: 'fa-credit-card',     bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  color: '#34d399' },
    { label: 'Installées',      val: installedOrders, icon: 'fa-tools',        bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.2)',  color: '#38bdf8' },
    { label: 'En attente',      val: pendingOnline, icon: 'fa-hourglass-half', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)',  color: '#fbbf24' },
    { label: 'CA total',        val: estimatedCA.toLocaleString('fr-FR') + ' F', icon: 'fa-coins', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', color: '#fbbf24' },
  ];

  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {kpis.map((kpi, i) => (
        <div key={i} class="rounded-xl p-4" style="background: var(--admin-accent-light); border: 1px solid var(--admin-border);">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--admin-accent-light);">
              <i class={`fas ${kpi.icon} text-lg`} style={`color:${kpi.color};`}></i>
            </div>
            <div>
              <div class="text-xl font-bold leading-none" style="color: var(--admin-text-primary);">{kpi.val}</div>
              <div class="text-xs mt-0.5" style="color: var(--admin-text-muted);">{kpi.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
