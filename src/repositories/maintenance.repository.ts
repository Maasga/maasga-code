import type { D1Database } from '@cloudflare/workers-types'

export interface MaintenanceRequestRecord {
  id: number
  client_id?: number | null
  name: string
  phone: string
  email?: string | null
  quartier?: string | null
  request_type: 'occasionnelle' | 'urgence' | 'contrat'
  description?: string | null
  preferred_date?: string | null
  equipment_type?: string | null
  plan_type?: string | null
  status: 'pending' | 'contacted' | 'scheduled' | 'done' | 'cancelled'
  admin_notes?: string | null
  created_at: string
  updated_at: string
}

export interface MaintenanceContractRecord {
  id: number
  client_id?: number | null
  client_name: string
  client_phone: string
  plan_type: 'trimestriel' | 'semestriel' | 'annuel'
  plan_price: number
  start_date: string
  end_date: string
  status: 'active' | 'expired' | 'cancelled'
  total_visits: number
  completed_visits: number
  next_visit_date?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface MaintenanceVisitRecord {
  id: number
  contract_id?: number | null
  client_id?: number | null
  client_name?: string | null
  client_phone?: string | null
  visit_type: 'preventive' | 'occasionnelle' | 'urgence'
  visit_date: string
  status: 'scheduled' | 'done' | 'cancelled'
  technician?: string | null
  description?: string | null
  actions_performed?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export class MaintenanceRepository {
  constructor(private readonly db: D1Database) {}

  // ─── REQUESTS ─────────────────────────────────────────────────────────────

  async findRequests(options?: {
    status?: string
    clientId?: number
    limit?: number
    offset?: number
  }): Promise<MaintenanceRequestRecord[]> {
    let query = 'SELECT * FROM maintenance_requests WHERE 1=1'
    const params: any[] = []

    if (options?.status) {
      query += ' AND status = ?'
      params.push(options.status)
    }
    if (options?.clientId) {
      query += ' AND client_id = ?'
      params.push(options.clientId)
    }

    query += ' ORDER BY created_at DESC'

    if (typeof options?.limit === 'number') {
      query += ' LIMIT ?'
      params.push(options.limit)
      if (typeof options?.offset === 'number') {
        query += ' OFFSET ?'
        params.push(options.offset)
      }
    }

    const stmt = this.db.prepare(query)
    const result = await (params.length > 0 ? stmt.bind(...params) : stmt).all<MaintenanceRequestRecord>()
    return result.results || []
  }

  async findRequestById(id: number): Promise<MaintenanceRequestRecord | null> {
    const result = await this.db
      .prepare('SELECT * FROM maintenance_requests WHERE id = ?')
      .bind(id)
      .first<MaintenanceRequestRecord>()
    return result || null
  }

  async createRequest(input: Partial<MaintenanceRequestRecord>): Promise<MaintenanceRequestRecord | null> {
    const now = new Date().toISOString()
    const result = await this.db
      .prepare(`
        INSERT INTO maintenance_requests (
          client_id, name, phone, email, quartier,
          request_type, description, preferred_date, equipment_type,
          plan_type, status, admin_notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        input.client_id ?? null,
        input.name,
        input.phone,
        input.email ?? null,
        input.quartier ?? null,
        input.request_type ?? 'occasionnelle',
        input.description ?? null,
        input.preferred_date ?? null,
        input.equipment_type ?? null,
        input.plan_type ?? null,
        input.status ?? 'pending',
        input.admin_notes ?? null,
        now,
        now
      )
      .run()

    if (result.meta?.last_row_id) {
      return this.findRequestById(Number(result.meta.last_row_id))
    }
    return null
  }

  async updateRequestStatus(id: number, status: string, adminNotes?: string): Promise<boolean> {
    const now = new Date().toISOString()
    let query = 'UPDATE maintenance_requests SET status = ?, updated_at = ?'
    const params: any[] = [status, now]

    if (adminNotes !== undefined) {
      query += ', admin_notes = ?'
      params.push(adminNotes)
    }

    query += ' WHERE id = ?'
    params.push(id)

    const result = await this.db.prepare(query).bind(...params).run()
    return (result.meta?.changes ?? 0) > 0
  }

  // ─── CONTRACTS ────────────────────────────────────────────────────────────

  async findContracts(options?: {
    status?: string
    clientId?: number
  }): Promise<MaintenanceContractRecord[]> {
    let query = 'SELECT * FROM maintenance_contracts WHERE 1=1'
    const params: any[] = []

    if (options?.status) {
      query += ' AND status = ?'
      params.push(options.status)
    }
    if (options?.clientId) {
      query += ' AND client_id = ?'
      params.push(options.clientId)
    }

    query += ' ORDER BY created_at DESC'
    const stmt = this.db.prepare(query)
    const result = await (params.length > 0 ? stmt.bind(...params) : stmt).all<MaintenanceContractRecord>()
    return result.results || []
  }

  async findContractById(id: number): Promise<MaintenanceContractRecord | null> {
    const result = await this.db
      .prepare('SELECT * FROM maintenance_contracts WHERE id = ?')
      .bind(id)
      .first<MaintenanceContractRecord>()
    return result || null
  }

  async createContract(input: Partial<MaintenanceContractRecord>): Promise<MaintenanceContractRecord | null> {
    const now = new Date().toISOString()
    const result = await this.db
      .prepare(`
        INSERT INTO maintenance_contracts (
          client_id, client_name, client_phone, plan_type,
          plan_price, start_date, end_date, status,
          total_visits, completed_visits, next_visit_date, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        input.client_id ?? null,
        input.client_name,
        input.client_phone,
        input.plan_type ?? 'trimestriel',
        input.plan_price ?? 0,
        input.start_date,
        input.end_date,
        input.status ?? 'active',
        input.total_visits ?? 0,
        input.completed_visits ?? 0,
        input.next_visit_date ?? null,
        input.notes ?? null,
        now,
        now
      )
      .run()

    if (result.meta?.last_row_id) {
      return this.findContractById(Number(result.meta.last_row_id))
    }
    return null
  }

  // ─── VISITS ───────────────────────────────────────────────────────────────

  async findVisits(options?: {
    contractId?: number
    clientId?: number
    status?: string
  }): Promise<MaintenanceVisitRecord[]> {
    let query = 'SELECT * FROM maintenance_visits WHERE 1=1'
    const params: any[] = []

    if (options?.contractId) {
      query += ' AND contract_id = ?'
      params.push(options.contractId)
    }
    if (options?.clientId) {
      query += ' AND client_id = ?'
      params.push(options.clientId)
    }
    if (options?.status) {
      query += ' AND status = ?'
      params.push(options.status)
    }

    query += ' ORDER BY visit_date ASC'
    const stmt = this.db.prepare(query)
    const result = await (params.length > 0 ? stmt.bind(...params) : stmt).all<MaintenanceVisitRecord>()
    return result.results || []
  }

  async createVisit(input: Partial<MaintenanceVisitRecord>): Promise<MaintenanceVisitRecord | null> {
    const now = new Date().toISOString()
    const result = await this.db
      .prepare(`
        INSERT INTO maintenance_visits (
          contract_id, client_id, client_name, client_phone,
          visit_type, visit_date, status, technician,
          description, actions_performed, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        input.contract_id ?? null,
        input.client_id ?? null,
        input.client_name ?? null,
        input.client_phone ?? null,
        input.visit_type ?? 'preventive',
        input.visit_date,
        input.status ?? 'scheduled',
        input.technician ?? null,
        input.description ?? null,
        input.actions_performed ?? null,
        input.notes ?? null,
        now,
        now
      )
      .run()

    if (result.meta?.last_row_id) {
      const visit = await this.db
        .prepare('SELECT * FROM maintenance_visits WHERE id = ?')
        .bind(Number(result.meta.last_row_id))
        .first<MaintenanceVisitRecord>()
      return visit || null
    }
    return null
  }
}
