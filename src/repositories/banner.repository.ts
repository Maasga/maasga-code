import type { D1Database } from '@cloudflare/workers-types'

export interface BannerRecord {
  id: number
  title?: string | null
  subtitle?: string | null
  image_url: string
  link_url?: string | null
  badge_text?: string | null
  display_order: number
  is_active: number // 1 or 0
  created_at: string
  updated_at: string
}

export interface BrandRecord {
  id: number
  name: string
  slug: string
  logo_url?: string | null
  description?: string | null
  display_order: number
  is_active: number
  created_at: string
  updated_at: string
}

export interface BrandMediaRecord {
  id: number
  brand_id: number
  title?: string | null
  media_type: 'image' | 'video' | 'pdf'
  media_url: string
  thumbnail_url?: string | null
  created_at: string
}

export class BannerRepository {
  constructor(private readonly db: D1Database) {}

  // ─── BANNERS ──────────────────────────────────────────────────────────────

  async findBanners(options?: { activeOnly?: boolean }): Promise<BannerRecord[]> {
    const query = options?.activeOnly
      ? 'SELECT * FROM banners WHERE is_active = 1 ORDER BY display_order ASC, created_at DESC'
      : 'SELECT * FROM banners ORDER BY display_order ASC, created_at DESC'

    const result = await this.db.prepare(query).all<BannerRecord>()
    return result.results || []
  }

  async findBannerById(id: number): Promise<BannerRecord | null> {
    const result = await this.db
      .prepare('SELECT * FROM banners WHERE id = ?')
      .bind(id)
      .first<BannerRecord>()
    return result || null
  }

  async createBanner(input: Partial<BannerRecord>): Promise<BannerRecord | null> {
    const now = new Date().toISOString()
    const result = await this.db
      .prepare(`
        INSERT INTO banners (
          title, subtitle, image_url, link_url, badge_text,
          display_order, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        input.title ?? null,
        input.subtitle ?? null,
        input.image_url,
        input.link_url ?? null,
        input.badge_text ?? null,
        input.display_order ?? 0,
        input.is_active ?? 1,
        now,
        now
      )
      .run()

    if (result.meta?.last_row_id) {
      return this.findBannerById(Number(result.meta.last_row_id))
    }
    return null
  }

  async updateBanner(id: number, input: Partial<BannerRecord>): Promise<boolean> {
    const fields: string[] = []
    const params: any[] = []

    const allowedKeys: (keyof BannerRecord)[] = [
      'title', 'subtitle', 'image_url', 'link_url', 'badge_text', 'display_order', 'is_active'
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

    const query = `UPDATE banners SET ${fields.join(', ')} WHERE id = ?`
    const result = await this.db.prepare(query).bind(...params).run()
    return (result.meta?.changes ?? 0) > 0
  }

  async deleteBanner(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM banners WHERE id = ?').bind(id).run()
    return (result.meta?.changes ?? 0) > 0
  }

  // ─── BRANDS ───────────────────────────────────────────────────────────────

  async findBrands(options?: { activeOnly?: boolean }): Promise<BrandRecord[]> {
    const query = options?.activeOnly
      ? 'SELECT * FROM brands WHERE is_active = 1 ORDER BY display_order ASC, name ASC'
      : 'SELECT * FROM brands ORDER BY display_order ASC, name ASC'

    const result = await this.db.prepare(query).all<BrandRecord>()
    return result.results || []
  }

  async findBrandById(id: number): Promise<BrandRecord | null> {
    const result = await this.db.prepare('SELECT * FROM brands WHERE id = ?').bind(id).first<BrandRecord>()
    return result || null
  }

  // ─── BRAND MEDIA ──────────────────────────────────────────────────────────

  async findBrandMedia(brandId: number): Promise<BrandMediaRecord[]> {
    const result = await this.db
      .prepare('SELECT * FROM brand_media WHERE brand_id = ? ORDER BY created_at DESC')
      .bind(brandId)
      .all<BrandMediaRecord>()
    return result.results || []
  }

  async createBrandMedia(input: Partial<BrandMediaRecord>): Promise<BrandMediaRecord | null> {
    const now = new Date().toISOString()
    const result = await this.db
      .prepare(`
        INSERT INTO brand_media (brand_id, title, media_type, media_url, thumbnail_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        input.brand_id,
        input.title ?? null,
        input.media_type ?? 'image',
        input.media_url,
        input.thumbnail_url ?? null,
        now
      )
      .run()

    if (result.meta?.last_row_id) {
      const media = await this.db
        .prepare('SELECT * FROM brand_media WHERE id = ?')
        .bind(Number(result.meta.last_row_id))
        .first<BrandMediaRecord>()
      return media || null
    }
    return null
  }

  async deleteBrandMedia(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM brand_media WHERE id = ?').bind(id).run()
    return (result.meta?.changes ?? 0) > 0
  }
}
