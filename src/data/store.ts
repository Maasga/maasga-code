export interface Review {
  id: number
  name: string
  note: number
  comment: string
  date: string
  service: string
  approved: boolean
}

export interface Appointment {
  id: number
  name: string
  phone: string
  quartier: string
  date: string
  heure_debut: string
  heure_fin: string
  type: 'devis' | 'installation'
  notes: string
  latitude?: number | null
  longitude?: number | null
  adresse_precise?: string
  status: 'pending' | 'confirmed' | 'done'
  created_at: string
}

export interface Client {
  id: number
  name: string
  email: string
  phone: string
  quartier: string
  password_hash: string
  type_demande: string
  notes: string
  created_at: string
}

export interface Order {
  id: number
  appointment_id: number | null
  client_id?: number | null
  product_id?: number | null
  quantity?: number
  client_name: string
  client_phone: string
  client_email?: string | null
  quartier: string | null
  type: 'devis' | 'installation' | 'vente' | 'commande'
  status: 'pending' | 'validation_terrain' | 'validated' | 'installed' | 'cancelled'
  notes?: string | null
  total_price?: number
  installation_price?: number
  created_at: string
}

// Données en mémoire (remplacer par D1 en production)
export const reviews: Review[] = []

export const appointments: Appointment[] = []

export const orders: Order[] = []
export const clients: Client[] = []
