// Types for maintenance data
export interface MaintenanceContract {
  id: number;
  client_name?: string;
  client_phone?: string;
  client_id?: number;
  plan_type: string;
  plan_price?: number;
  start_date?: string;
  end_date?: string;
  status: 'en_attente' | 'contacte' | 'actif' | 'expire' | 'annule';
  total_visits?: number;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceRequest {
  id: number;
  client_name?: string;
  client_phone?: string;
  request_type: 'occasionnelle' | 'urgence' | 'contrat';
  equipment_type?: string;
  description?: string;
  status: 'pending' | 'contacted' | 'scheduled' | 'done' | 'cancelled';
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceVisit {
  id: number;
  contract_id?: number;
  client_name?: string;
  client_phone?: string;
  visit_date?: string;
  status: 'scheduled' | 'done' | 'cancelled' | 'missed';
  technician_name?: string;
  notes?: string;
  actions_performed?: string;
  checklist_data?: string;
  created_at?: string;
  updated_at?: string;
}

const normalizeVisitStatus = (status: string): string => {
  if (status === 'scheduled') return 'planifiee';
  if (status === 'done') return 'effectuee';
  return status;
};

// Fonction synchrone (pas un hook React) — Hono SSR ne supporte pas useState/useEffect.
// Les données maintenance sont passées en props par les routes admin de index.tsx via D1.
// Ce hook retourne des valeurs par défaut ; AdminMaintenancePage reçoit ses données
// directement en props (contracts, requests, visits) injectées par le handler de route.
export const useAdminMaintenanceData = () => {
  const rawVisits: MaintenanceVisit[] = [];
  return {
    contracts: [] as MaintenanceContract[],
    requests: [] as MaintenanceRequest[],
    visits: rawVisits.map(v => ({ ...v, status: normalizeVisitStatus(v.status) })),
    loading: false,
    error: null as string | null,
  };
};
