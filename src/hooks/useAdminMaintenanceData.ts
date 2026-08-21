import { useEffect, useState } from 'react';

// Types for maintenance data (based on what we see in the admin maintenance page)
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
  created_by?: string; // Who created the request (staff or 'Client')
  updated_by?: string; // Who last updated it
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceVisit {
  id: number;
  client_name?: string;
  client_phone?: string;
  contract_id?: number;
  visit_type: 'preventive' | 'occasionnelle' | 'urgence';
  visit_date: string;
  status: 'planifiee' | 'confirmee' | 'effectuee' | 'annulee';
  technician?: string;
  actions_performed?: string;
  notes?: string;
  created_by?: string; // Who created the visit
  updated_by?: string; // Who validated/updated it
  created_at?: string;
  updated_at?: string;
}

// Mock data - in a real app, this would come from API endpoints
const mockContracts: MaintenanceContract[] = [];
const mockRequests: MaintenanceRequest[] = [];
const mockVisits: MaintenanceVisit[] = [];

export const useAdminMaintenanceData = () => {
  const [data, setData] = useState({
    contracts: [] as MaintenanceContract[],
    requests: [] as MaintenanceRequest[],
    visits: [] as MaintenanceVisit[],
    loading: false,
    error: null as string | null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        // Simulate async data fetching
        await new Promise(resolve => setTimeout(resolve, 100));

        // In a real app, we would fetch from API endpoints like:
        // const [contractsRes, requestsRes, visitsRes] = await Promise.all([
        //   fetch('/api/admin/maintenance/contracts'),
        //   fetch('/api/admin/maintenance/requests'),
        //   fetch('/api/admin/maintenance/visits')
        // ]);

        // For now, we'll use mock data or empty arrays
        // The actual data is passed as props to the component in the current implementation
        setData({
          contracts: mockContracts,
          requests: mockRequests,
          visits: mockVisits,
          loading: false,
          error: null,
        });
      } catch (err) {
        setData(prev => ({ ...prev, loading: false, error: err instanceof Error ? err.message : 'Unknown error' }));
      }
    };

    fetchData();
  }, []); // Empty deps for now - in reality would depend on refresh triggers

  return data;
};