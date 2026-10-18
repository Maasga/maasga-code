import type { D1Database } from '@cloudflare/workers-types'

export type AppointmentStatus = 'pending' | 'confirmed' | 'done' | 'cancelled'

export interface AppointmentRecord {
  id: number
  client_id?: number | null
  name: string
  phone: string
  quartier: string
  date: string
  heure_debut: string
  heure_fin?: string | null
  type: string
  notes?: string | null
  latitude?: number | null
  longitude?: number | null
  adresse_precise?: string | null
  status: AppointmentStatus
  created_at: string
  updated_at?: string | null
}

export interface CreateAppointmentInput {
  client_id?: number | null
  name: string
  phone: string
  quartier: string
  date: string
  heure_debut?: string
  heure_fin?: string
  type: string
  notes?: string | null
  latitude?: number | null
  longitude?: number | null
  adresse_precise?: string | null
  status?: AppointmentStatus
}

export interface UpdateAppointmentInput {
  name?: string
  phone?: string
  quartier?: string
  date?: string
  heure_debut?: string
  heure_fin?: string | null
  type?: string
  notes?: string | null
  latitude?: number | null
  longitude?: number | null
  adresse_precise?: string | null
  status?: AppointmentStatus
}

export class AppointmentRepository {
  constructor(private readonly db: D1Database) {}

  async findAll(options?: {
    status?: string
    date?: string
    limit?: number
    offset?: number
  }): Promise<AppointmentRecord[]> {
    let query = 'SELECT * FROM appointments WHERE 1=1'
    const params: any[] = []

    if (options?.status) {
      query += ' AND status = ?'
      params.push(options.status)
    }
    if (options?.date) {
      query += ' AND date = ?'
      params.push(options.date)
    }

    query += ' ORDER BY date DESC, heure_debut ASC, created_at DESC'

    if (typeof options?.limit === 'number') {
      query += ' LIMIT ?'
      params.push(options.limit)
      if (typeof options?.offset === 'number') {
        query += ' OFFSET ?'
        params.push(options.offset)
      }
    }

    const stmt = this.db.prepare(query)
    const result = await (params.length > 0 ? stmt.bind(...params) : stmt).all<AppointmentRecord>()
    return result.results || []
  }

  async findById(id: number): Promise<AppointmentRecord | null> {
    const result = await this.db
      .prepare('SELECT * FROM appointments WHERE id = ?')
      .bind(id)
      .first<AppointmentRecord>()
    return result || null
  }

  async findByPhone(phone: string): Promise<AppointmentRecord[]> {
    const result = await this.db
      .prepare('SELECT * FROM appointments WHERE phone = ? ORDER BY date DESC, created_at DESC')
      .bind(phone)
      .all<AppointmentRecord>()
    return result.results || []
  }

  async findByClientId(clientId: number): Promise<AppointmentRecord[]> {
    const result = await this.db
      .prepare('SELECT * FROM appointments WHERE client_id = ? ORDER BY date DESC, created_at DESC')
      .bind(clientId)
      .all<AppointmentRecord>()
    return result.results || []
  }

  async findByDateRange(startDate: string, endDate: string): Promise<AppointmentRecord[]> {
    const result = await this.db
      .prepare('SELECT * FROM appointments WHERE date >= ? AND date <= ? ORDER BY date ASC, heure_debut ASC')
      .bind(startDate, endDate)
      .all<AppointmentRecord>()
    return result.results || []
  }

  async create(input: CreateAppointmentInput): Promise<AppointmentRecord | null> {
    const now = new Date().toISOString()
    const result = await this.db
      .prepare(`
        INSERT INTO appointments (
          client_id, name, phone, quartier, date,
          heure_debut, heure_fin, type, notes,
          latitude, longitude, adresse_precise,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        input.client_id ?? null,
        input.name,
        input.phone,
        input.quartier,
        input.date,
        input.heure_debut || '08:00',
        input.heure_fin || '18:00',
        input.type || 'installation',
        input.notes ?? null,
        input.latitude ?? null,
        input.longitude ?? null,
        input.adresse_precise ?? null,
        input.status || 'pending',
        now,
        now
      )
      .run()

    if (result.meta?.last_row_id) {
      return this.findById(Number(result.meta.last_row_id))
    }
    return null
  }

  async updateStatus(id: number, status: AppointmentStatus): Promise<boolean> {
    const now = new Date().toISOString()
    const result = await this.db
      .prepare('UPDATE appointments SET status = ?, updated_at = ? WHERE id = ?')
      .bind(status, now, id)
      .run()
    return (result.meta?.changes ?? 0) > 0
  }

  async reschedule(
    id: number,
    date: string,
    heureDebut: string,
    heureFin?: string
  ): Promise<boolean> {
    const now = new Date().toISOString()
    const result = await this.db
      .prepare(`
        UPDATE appointments 
        SET date = ?, heure_debut = ?, heure_fin = COALESCE(?, heure_fin), updated_at = ?
        WHERE id = ?
      `)
      .bind(date, heureDebut, heureFin ?? null, now, id)
      .run()
    return (result.meta?.changes ?? 0) > 0
  }

  async update(id: number, input: UpdateAppointmentInput): Promise<boolean> {
    const fields: string[] = []
    const params: any[] = []

    const allowedKeys: (keyof UpdateAppointmentInput)[] = [
      'name', 'phone', 'quartier', 'date', 'heure_debut', 'heure_fin',
      'type', 'notes', 'latitude', 'longitude', 'adresse_precise', 'status'
    ]

    for (const key of allowedKeys) {
      if (input[key] !== undefined) {
        fields.push(`${key} = ?`)
        params.push(input[key])
      }
    }

    if (fields.length === 0) return false

    fields.push('updated_at = ?')
    params.push(new Date().toISOString())
    params.push(id)

    const query = `UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`
    const result = await this.db.prepare(query).bind(...params).run()
    return (result.meta?.changes ?? 0) > 0
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM appointments WHERE id = ?')
      .bind(id)
      .run()
    return (result.meta?.changes ?? 0) > 0
  }

  async countByStatus(): Promise<Record<string, number>> {
    const result = await this.db
      .prepare('SELECT status, COUNT(*) as count FROM appointments GROUP BY status')
      .all<{ status: string; count: number }>()

    const counts: Record<string, number> = {}
    for (const row of result.results || []) {
      counts[row.status] = row.count
    }
    return counts
  }
}
