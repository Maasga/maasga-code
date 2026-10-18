import type { D1Database } from '@cloudflare/workers-types'

export interface SavTicketRecord {
  id: number
  client_id?: number | null
  client_name: string
  client_phone: string
  equipment_name: string
  brand?: string | null
  problem_type?: string | null
  description: string
  priority: 'basse' | 'normale' | 'haute' | 'urgente'
  status: 'ouvert' | 'en_cours' | 'en_attente_piece' | 'resolu' | 'ferme'
  assigned_to?: string | null
  resolution_notes?: string | null
  created_at: string
  updated_at: string
}

export interface SavMessageRecord {
  id: number
  ticket_id: number
  sender_type: 'client' | 'admin'
  sender_name: string
  message: string
  created_at: string
}

export class SavRepository {
  constructor(private readonly db: D1Database) {}

  async findTickets(options?: {
    status?: string
    clientId?: number
    priority?: string
    limit?: number
    offset?: number
  }): Promise<SavTicketRecord[]> {
    let query = 'SELECT * FROM sav_tickets WHERE 1=1'
    const params: any[] = []

    if (options?.status) {
      query += ' AND status = ?'
      params.push(options.status)
    }
    if (options?.clientId) {
      query += ' AND client_id = ?'
      params.push(options.clientId)
    }
    if (options?.priority) {
      query += ' AND priority = ?'
      params.push(options.priority)
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
    const result = await (params.length > 0 ? stmt.bind(...params) : stmt).all<SavTicketRecord>()
    return result.results || []
  }

  async findTicketById(id: number): Promise<SavTicketRecord | null> {
    const result = await this.db
      .prepare('SELECT * FROM sav_tickets WHERE id = ?')
      .bind(id)
      .first<SavTicketRecord>()
    return result || null
  }

  async createTicket(input: Partial<SavTicketRecord>): Promise<SavTicketRecord | null> {
    const now = new Date().toISOString()
    const result = await this.db
      .prepare(`
        INSERT INTO sav_tickets (
          client_id, client_name, client_phone, equipment_name,
          brand, problem_type, description, priority,
          status, assigned_to, resolution_notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        input.client_id ?? null,
        input.client_name,
        input.client_phone,
        input.equipment_name,
        input.brand ?? null,
        input.problem_type ?? null,
        input.description,
        input.priority ?? 'normale',
        input.status ?? 'ouvert',
        input.assigned_to ?? null,
        input.resolution_notes ?? null,
        now,
        now
      )
      .run()

    if (result.meta?.last_row_id) {
      return this.findTicketById(Number(result.meta.last_row_id))
    }
    return null
  }

  async updateTicketStatus(
    id: number,
    status: string,
    resolutionNotes?: string
  ): Promise<boolean> {
    const now = new Date().toISOString()
    let query = 'UPDATE sav_tickets SET status = ?, updated_at = ?'
    const params: any[] = [status, now]

    if (resolutionNotes !== undefined) {
      query += ', resolution_notes = ?'
      params.push(resolutionNotes)
    }

    query += ' WHERE id = ?'
    params.push(id)

    const result = await this.db.prepare(query).bind(...params).run()
    return (result.meta?.changes ?? 0) > 0
  }

  async assignTicket(id: number, assignedTo: string): Promise<boolean> {
    const now = new Date().toISOString()
    const result = await this.db
      .prepare('UPDATE sav_tickets SET assigned_to = ?, updated_at = ? WHERE id = ?')
      .bind(assignedTo, now, id)
      .run()
    return (result.meta?.changes ?? 0) > 0
  }

  async getMessages(ticketId: number): Promise<SavMessageRecord[]> {
    const result = await this.db
      .prepare('SELECT * FROM sav_messages WHERE ticket_id = ? ORDER BY created_at ASC')
      .bind(ticketId)
      .all<SavMessageRecord>()
    return result.results || []
  }

  async addMessage(
    ticketId: number,
    senderType: 'client' | 'admin',
    senderName: string,
    message: string
  ): Promise<SavMessageRecord | null> {
    const now = new Date().toISOString()
    const result = await this.db
      .prepare(`
        INSERT INTO sav_messages (ticket_id, sender_type, sender_name, message, created_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(ticketId, senderType, senderName, message, now)
      .run()

    if (result.meta?.last_row_id) {
      const msg = await this.db
        .prepare('SELECT * FROM sav_messages WHERE id = ?')
        .bind(Number(result.meta.last_row_id))
        .first<SavMessageRecord>()
      return msg || null
    }
    return null
  }
}
