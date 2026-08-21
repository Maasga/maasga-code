import { useState, useEffect } from 'react';
import { Order } from '../data/store';

interface CommandesKPIsProps {
  orders: Order[];
  payments: any[];
}

interface KPI {
  label: string;
  val: string | number;
  icon: string;
  bg: string;
  border: string;
  color: string;
  trend?: {
    value: number; // percentage change
    label: string; // e.g., "vs last month"
    isPositive: boolean;
  };
}

export const CommandesKPIs = ({ orders, payments }: CommandesKPIsProps) => {
  // In a real app, we would fetch historical data to calculate trends
  // For now, we'll simulate some trend data
  const [trends, setTrends] = useState<Record<string, { value: number; label: string; isPositive: boolean }>>({});

  useEffect(() => {
    // Simulate fetching trend data
    const simulateTrends = () => {
      setTrends({
        totalOrders: { value: 12, label: 'vs mois précédent', isPositive: true },
        paidOrders: { value: 8, label: 'vs mois précédent', isPositive: true },
        installedOrders: { value: 5, label: 'vs mois précédent', isPositive: true },
        pendingOnline: { value: -5, label: 'vs mois précédent', isPositive: false }, // Negative is good for pending
        estimatedCA: { value: 15, label: 'vs mois précédent', isPositive: true }
      });
    };

    simulateTrends();
  }, []);

  // KPIs calculations
  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.status === 'confirme' || o.status === 'en_livraison' || o.status === 'livre').length;
  const installedOrders = orders.filter(o => o.status === 'livre').length;
  const pendingOnline = orders.filter(o => !o.appointment_id && (o.type === 'vente' || o.type === 'commande') && o.status === 'en_attente').length;
  const estimatedCA = orders.reduce((sum, o) => sum + (o.total_price || 0), 0);

  const kpis: KPI[] = [
    {
      label: "Total commandes",
      val: totalOrders,
      icon: "fa-shopping-bag",
      bg: "rgba(59,130,246,0.1)",
      border: "rgba(59,130,246,0.2)",
      color: "#60a5fa",
      trend: trends.totalOrders
    },
    {
      label: "Payées",
      val: paidOrders,
      icon: "fa-credit-card",
      bg: "rgba(16,185,129,0.1)",
      border: "rgba(16,185,129,0.2)",
      color: "#34d399",
      trend: trends.paidOrders
    },
    {
      label: "Installées",
      val: installedOrders,
      icon: "fa-tools",
      bg: "rgba(56,189,248,0.1)",
      border: "rgba(56,189,248,0.2)",
      color: "#38bdf8",
      trend: trends.installedOrders
    },
    {
      label: "En attente",
      val: pendingOnline,
      icon: "fa-hourglass-half",
      bg: "rgba(251,191,36,0.1)",
      border: "rgba(251,191,36,0.2)",
      color: "#fbbf24",
      trend: trends.pendingOnline
    },
    {
      label: "CA total",
      val: estimatedCA.toLocaleString('fr-FR') + ' F',
      icon: "fa-coins",
      bg: "rgba(251,191,36,0.1)",
      border: "rgba(251,191,36,0.2)",
      color: "#fbbf24",
      trend: trends.estimatedCA
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {kpis.map((kpi, index) => (
        <div key={index} className="rounded-xl p-4 card-shadow" style={{ background: kpi.bg, border: `1px solid ${kpi.border}` }}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: kpi.bg }}>
              <i className={`fas ${kpi.icon} text-lg`} style={{ color: kpi.color }}></i>
            </div>
            <div>
              <div className="text-xl font-bold text-white leading-none">{kpi.val}</div>
              <div className="text-xs text-gray-400 mt-0.5">{kpi.label}</div>
              {kpi.trend && (
                <div className="flex items-center space-x-1 text-xs mt-1">
                  {kpi.trend.isPositive ? (
                    <i className="fas fa-arrow-up text-green-400"></i>
                  ) : (
                    <i className="fas fa-arrow-down text-red-400"></i>
                  )}
                  <span className="ml-1">{Math.abs(kpi.trend.value)}% {kpi.trend.label}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};