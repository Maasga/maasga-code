import type { D1Database } from '@cloudflare/workers-types'

export interface ProductRecord {
  id: number
  name: string
  brand: string
  model?: string | null
  description?: string | null
  price: number
  price_wholesale?: number | null
  category: string
  power_cv?: string | null
  btu?: number | null
  stock: number
  image_url?: string | null
  gallery?: string | null // JSON string or comma-separated
  is_active: number // 1 or 0
  created_at: string
  updated_at: string
}

export interface CreateProductInput {
  name: string
  brand: string
  model?: string | null
  description?: string | null
  price: number
  price_wholesale?: number | null
  category: string
  power_cv?: string | null
  btu?: number | null
  stock?: number
  image_url?: string | null
  gallery?: string | null
  is_active?: number
}

export interface UpdateProductInput {
  name?: string
  brand?: string
  model?: string | null
  description?: string | null
  price?: number
  price_wholesale?: number | null
  category?: string
  power_cv?: string | null
  btu?: number | null
  stock?: number
  image_url?: string | null
  gallery?: string | null
  is_active?: number
}

export class ProductRepository {
  constructor(private readonly db: D1Database) {}

  async findAll(options?: {
    activeOnly?: boolean
    category?: string
    powerCv?: string
    limit?: number
    offset?: number
  }): Promise<ProductRecord[]> {
    let query = 'SELECT * FROM products WHERE 1=1'
    const params: any[] = []

    if (options?.activeOnly) {
      query += ' AND is_active = 1'
    }
    if (options?.category) {
      query += ' AND LOWER(category) = LOWER(?)'
      params.push(options.category)
    }
    if (options?.powerCv) {
      query += ' AND LOWER(power_cv) = LOWER(?)'
      params.push(options.powerCv)
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
    const result = await (params.length > 0 ? stmt.bind(...params) : stmt).all<ProductRecord>()
    return result.results || []
  }

  async findById(id: number): Promise<ProductRecord | null> {
    const result = await this.db
      .prepare('SELECT * FROM products WHERE id = ?')
      .bind(id)
      .first<ProductRecord>()
    return result || null
  }

  async create(input: CreateProductInput): Promise<ProductRecord | null> {
    const now = new Date().toISOString()
    const result = await this.db
      .prepare(`
        INSERT INTO products (
          name, brand, model, description, price, price_wholesale,
          category, power_cv, btu, stock, image_url, gallery, is_active,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        input.name,
        input.brand,
        input.model ?? null,
        input.description ?? null,
        input.price,
        input.price_wholesale ?? null,
        input.category,
        input.power_cv ?? null,
        input.btu ?? null,
        input.stock ?? 0,
        input.image_url ?? null,
        input.gallery ?? null,
        input.is_active ?? 1,
        now,
        now
      )
      .run()

    if (result.meta?.last_row_id) {
      return this.findById(Number(result.meta.last_row_id))
    }
    return null
  }

  async update(id: number, input: UpdateProductInput): Promise<boolean> {
    const fields: string[] = []
    const params: any[] = []

    const allowedKeys: (keyof UpdateProductInput)[] = [
      'name', 'brand', 'model', 'description', 'price', 'price_wholesale',
      'category', 'power_cv', 'btu', 'stock', 'image_url', 'gallery', 'is_active'
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

    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`
    const result = await this.db.prepare(query).bind(...params).run()
    return (result.meta?.changes ?? 0) > 0
  }

  async updateStock(id: number, delta: number): Promise<boolean> {
    const now = new Date().toISOString()
    const result = await this.db
      .prepare(`
        UPDATE products 
        SET stock = MAX(0, stock + ?), updated_at = ?
        WHERE id = ?
      `)
      .bind(delta, now, id)
      .run()
    return (result.meta?.changes ?? 0) > 0
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM products WHERE id = ?')
      .bind(id)
      .run()
    return (result.meta?.changes ?? 0) > 0
  }

  async count(options?: { activeOnly?: boolean }): Promise<number> {
    const query = options?.activeOnly
      ? 'SELECT COUNT(*) as total FROM products WHERE is_active = 1'
      : 'SELECT COUNT(*) as total FROM products'
    const result = await this.db.prepare(query).first<{ total: number }>()
    return result?.total ?? 0
  }
}
