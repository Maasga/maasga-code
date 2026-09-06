import { orders, appointments } from '../data/store';
import type { Order, Appointment } from '../data/store';

// Fonction synchrone (pas un hook React) — ce projet utilise Hono SSR, pas React.
export const useAdminCommandesData = () => {
  const onlineOrders: Order[] = orders.filter(o =>
    !o.appointment_id && (o.type === 'vente' || o.type === 'commande')
  );
  const terrainOrders: Order[] = orders.filter(o => !!o.appointment_id);
  const pendingAppointments: Appointment[] = appointments.filter(a => a.status === 'pending');

  return {
    onlineOrders,
    terrainOrders,
    pendingAppointments,
    paymentsByOrder: {} as Record<number, any>,
    loading: false,
    error: null as string | null,
  };
};
