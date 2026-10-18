import type { D1Database } from '@cloudflare/workers-types'

export interface ClientRecord {
  id: number
  firebase_uid?: string | null
  name: string
  phone: string
  email?: string | null
  quartier?: string | null
  address?: string | null
  push_token?: string | null
  is_admin?: number // 0 or 1
  role?: string | null
  created_at: string
  updated_at: string
}

export interface CreateClientInput {
  firebase_uid?: string | null
  name: string
  phone: string
  email?: string | null
  quartier?: string | null
  address?: string | null
  push_token?: string | null
  is_admin?: number
  role?: string | null
}

export interface UpdateClientInput {
  name?: string
  phone?: string
  email?: string | null
  quartier?: string | null
  address?: string | null
  push_token?: string | null
  is_admin?: number
  role?: string | null
}

export class ClientRepository {
  constructor(private readonly db: D1Database) {}

  async findAll(options?: {
    search?: string
    limit?: number
    offset?: number
  }): Promise<ClientRecord[]> {
    let query = 'SELECT * FROM clients WHERE 1=1'
    const params: any[] = []

    if (options?.search) {
      query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)'
      const pattern = `%${options.search}%`
      params.push(pattern, pattern, pattern)
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
    const result = await (params.length > 0 ? stmt.bind(...params) : stmt).all<ClientRecord>()
    return result.results || []
  }

  async findById(id: number): Promise<ClientRecord | null> {
    const result = await this.db
      .prepare('SELECT * FROM clients WHERE id = ?')
      .bind(id)
      .first<ClientRecord>()
    return result || null
  }

  async findByFirebaseUid(firebaseUid: string): Promise<ClientRecord | null> {
    const result = await this.db
      .prepare('SELECT * FROM clients WHERE firebase_uid = ?')
      .bind(firebaseUid)
      .first<ClientRecord>()
    return result || null
  }

  async findByPhone(phone: string): Promise<ClientRecord | null> {
    const result = await this.db
      .prepare('SELECT * FROM clients WHERE phone = ?')
      .bind(phone)
      .first<ClientRecord>()
    return result || null
  }

  async findByEmail(email: string): Promise<ClientRecord | null> {
    const result = await this.db
      .prepare('SELECT * FROM clients WHERE LOWER(email) = LOWER(?)')
      .bind(email)
      .first<ClientRecord>()
    return result || null
  }

  async create(input: CreateClientInput): Promise<ClientRecord | null> {
    const now = new Date().toISOString()
    const result = await this.db
      .prepare(`
        INSERT INTO clients (
          firebase_uid, name, phone, email, quartier,
          address, push_token, is_admin, role, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        input.firebase_uid ?? null,
        input.name,
        input.phone,
        input.email ?? null,
        input.quartier ?? null,
        input.address ?? null,
        input.push_token ?? null,
        input.is_admin ?? 0,
        input.role ?? 'client',
        now,
        now
      )
      .run()

    if (result.meta?.last_row_id) {
      return this.findById(Number(result.meta.last_row_id))
    }
    return null
  }

  async update(id: number, input: UpdateClientInput): Promise<boolean> {
    const fields: string[] = []
    const params: any[] = []

    const allowedKeys: (keyof UpdateClientInput)[] = [
      'name', 'phone', 'email', 'quartier', 'address', 'push_token', 'is_admin', 'role'
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

    const query = `UPDATE clients SET ${fields.join(', ')} WHERE id = ?`
    const result = await this.db.prepare(query).bind(...params).run()
    return (result.meta?.changes ?? 0) > 0
  }

  async updatePushToken(id: number, pushToken: string): Promise<boolean> {
    const now = new Date().toISOString()
    const result = await this.db
      .prepare('UPDATE clients SET push_token = ?, updated_at = ? WHERE id = ?')
      .bind(pushToken, now, id)
      .run()
    return (result.meta?.changes ?? 0) > 0
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM clients WHERE id = ?')
      .bind(id)
      .run()
    return (result.meta?.changes ?? 0) > 0
  }

  async count(): Promise<number> {
    const result = await this.db.prepare('SELECT COUNT(*) as total FROM clients').first<{ total: number }>()
    return result?.total ?? 0
  }
}
