import { useEffect, useState } from 'react';
import { orders, appointments, payments } from '../data/store';
import { Order, Appointment } from '../data/store';

// Custom hook for fetching and transforming commandes data
export const useAdminCommandesData = () => {
  const [data, setData] = useState({
    onlineOrders: [] as Order[],
    terrainOrders: [] as Order[],
    pendingAppointments: [] as Appointment[],
    paymentsByOrder: {} as Record<number, any>,
    loading: false,
    error: null as string | null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        // Simulate async data fetching (in real app, this would be API calls)
        // For now, we'll use the existing data from stores
        await new Promise(resolve => setTimeout(resolve, 100));

        // Separate commandes en ligne vs commandes terrain
        const onlineOrders = orders.filter(o =>
          !o.appointment_id && (o.type === 'vente' || o.type === 'commande')
        );

        const terrainOrders = orders.filter(o => o.appointment_id);
        const pendingAppointments = appointments.filter(a => a.status === 'pending');

        // Map des paiements par order_id pour affichage rapide
        const paymentsByOrder: Record<number, any> = {};
        payments.forEach((p: any) => { if (p.order_id) paymentsByOrder[p.order_id] = p });

        setData({
          onlineOrders,
          terrainOrders,
          pendingAppointments,
          paymentsByOrder,
          loading: false,
          error: null,
        });
      } catch (err) {
        setData(prev => ({ ...prev, loading: false, error: err instanceof Error ? err.message : 'Unknown error' }));
      }
    };

    fetchData();
  }, [orders, appointments, payments]); // Re-fetch when these change

  return data;
};