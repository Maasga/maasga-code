import type { D1Database } from '@cloudflare/workers-types'

export type OrderStatus = 'en_attente' | 'contacte' | 'confirme' | 'en_livraison' | 'livre' | 'annule'

export interface OrderRecord {
  id: number
  client_id?: number | null
  appointment_id?: number | null
  product_id?: number | null
  quantity: number
  client_name: string
  client_phone: string
  client_email?: string | null
  quartier?: string | null
  status: OrderStatus
  type: string
  notes?: string | null
  total_price: number
  installation_price: number
  admin_notes?: string | null
  delivered_at?: string | null
  installed_at?: string | null
  created_at: string
  updated_at: string
  // Product joined fields if joined
  product_name?: string | null
  product_brand?: string | null
  product_image_url?: string | null
}

export interface CreateOrderInput {
  client_id?: number | null
  appointment_id?: number | null
  product_id?: number | null
  quantity?: number
  client_name: string
  client_phone: string
  client_email?: string | null
  quartier?: string | null
  status?: OrderStatus
  type?: string
  notes?: string | null
  total_price?: number
  installation_price?: number
  admin_notes?: string | null
}

export interface UpdateOrderInput {
  status?: OrderStatus
  quantity?: number
  client_name?: string
  client_phone?: string
  client_email?: string | null
  quartier?: string | null
  notes?: string | null
  total_price?: number
  installation_price?: number
  admin_notes?: string | null
  delivered_at?: string | null
  installed_at?: string | null
}

export class OrderRepository {
  constructor(private readonly db: D1Database) {}

  async findAll(options?: {
    status?: string
    clientId?: number
    limit?: number
    offset?: number
  }): Promise<OrderRecord[]> {
    let query = `
      SELECT o.*, p.name as product_name, p.brand as product_brand, p.image_url as product_image_url
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE 1=1
    `
    const params: any[] = []

    if (options?.status) {
      query += ' AND o.status = ?'
      params.push(options.status)
    }
    if (options?.clientId) {
      query += ' AND o.client_id = ?'
      params.push(options.clientId)
    }

    query += ' ORDER BY o.created_at DESC'

    if (typeof options?.limit === 'number') {
      query += ' LIMIT ?'
      params.push(options.limit)
      if (typeof options?.offset === 'number') {
        query += ' OFFSET ?'
        params.push(options.offset)
      }
    }

    const stmt = this.db.prepare(query)
    const result = await (params.length > 0 ? stmt.bind(...params) : stmt).all<OrderRecord>()
    return result.results || []
  }

  async findById(id: number): Promise<OrderRecord | null> {
    const result = await this.db
      .prepare(`
        SELECT o.*, p.name as product_name, p.brand as product_brand, p.image_url as product_image_url
        FROM orders o
        LEFT JOIN products p ON o.product_id = p.id
        WHERE o.id = ?
      `)
      .bind(id)
      .first<OrderRecord>()
    return result || null
  }

  async findByClientId(clientId: number): Promise<OrderRecord[]> {
    const result = await this.db
      .prepare(`
        SELECT o.*, p.name as product_name, p.brand as product_brand, p.image_url as product_image_url
        FROM orders o
        LEFT JOIN products p ON o.product_id = p.id
        WHERE o.client_id = ?
        ORDER BY o.created_at DESC
      `)
      .bind(clientId)
      .all<OrderRecord>()
    return result.results || []
  }

  async findByPhone(phone: string): Promise<OrderRecord[]> {
    const result = await this.db
      .prepare(`
        SELECT o.*, p.name as product_name, p.brand as product_brand, p.image_url as product_image_url
        FROM orders o
        LEFT JOIN products p ON o.product_id = p.id
        WHERE o.client_phone = ?
        ORDER BY o.created_at DESC
      `)
      .bind(phone)
      .all<OrderRecord>()
    return result.results || []
  }

  async create(input: CreateOrderInput): Promise<OrderRecord | null> {
    const now = new Date().toISOString()
    const result = await this.db
      .prepare(`
        INSERT INTO orders (
          client_id, appointment_id, product_id, quantity,
          client_name, client_phone, client_email, quartier,
          status, type, notes, total_price, installation_price,
          admin_notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        input.client_id ?? null,
        input.appointment_id ?? null,
        input.product_id ?? null,
        input.quantity ?? 1,
        input.client_name,
        input.client_phone,
        input.client_email ?? null,
        input.quartier ?? null,
        input.status ?? 'en_attente',
        input.type ?? 'commande',
        input.notes ?? null,
        input.total_price ?? 0,
        input.installation_price ?? 0,
        input.admin_notes ?? null,
        now,
        now
      )
      .run()

    if (result.meta?.last_row_id) {
      return this.findById(Number(result.meta.last_row_id))
    }
    return null
  }

  async updateStatus(id: number, status: OrderStatus, adminNotes?: string): Promise<boolean> {
    const now = new Date().toISOString()
    let query = 'UPDATE orders SET status = ?, updated_at = ?'
    const params: any[] = [status, now]

    if (status === 'livre') {
      query += ', delivered_at = COALESCE(delivered_at, ?)'
      params.push(now)
    }

    if (adminNotes !== undefined) {
      query += ', admin_notes = ?'
      params.push(adminNotes)
    }

    query += ' WHERE id = ?'
    params.push(id)

    const result = await this.db.prepare(query).bind(...params).run()
    return (result.meta?.changes ?? 0) > 0
  }

  async update(id: number, input: UpdateOrderInput): Promise<boolean> {
    const fields: string[] = []
    const params: any[] = []

    const allowedKeys: (keyof UpdateOrderInput)[] = [
      'status', 'quantity', 'client_name', 'client_phone', 'client_email',
      'quartier', 'notes', 'total_price', 'installation_price', 'admin_notes',
      'delivered_at', 'installed_at'
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

    const query = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`
    const result = await this.db.prepare(query).bind(...params).run()
    return (result.meta?.changes ?? 0) > 0
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM orders WHERE id = ?')
      .bind(id)
      .run()
    return (result.meta?.changes ?? 0) > 0
  }

  async countByStatus(): Promise<Record<string, number>> {
    const result = await this.db
      .prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status')
      .all<{ status: string; count: number }>()

    const counts: Record<string, number> = {}
    for (const row of result.results || []) {
      counts[row.status] = row.count
    }
    return counts
  }
}
