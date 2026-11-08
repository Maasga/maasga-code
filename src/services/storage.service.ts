import type { R2Bucket, R2ObjectBody } from '@cloudflare/workers-types'

export interface UploadResult {
  url: string
  key: string
  deleteUrl?: string
}

export class StorageService {
  constructor(
    private readonly r2Bucket?: R2Bucket
  ) {}

  async uploadImage(
    fileBuffer: ArrayBuffer | Uint8Array,
    mimeType: string,
    folder: string = 'uploads',
    baseUrl: string = 'https://maasga-website.pages.dev'
  ): Promise<UploadResult> {
    if (!this.r2Bucket) {
      throw new Error('Stockage Cloudflare R2 non configuré')
    }

    const ext = mimeType === 'image/png' ? 'png'
      : mimeType === 'image/webp' ? 'webp'
      : mimeType === 'image/gif' ? 'gif'
      : mimeType === 'image/svg+xml' ? 'svg'
      : 'jpg'

    const randomSuffix = Math.random().toString(36).substring(2, 10)
    const key = `${folder}/${Date.now()}-${randomSuffix}.${ext}`

    await this.r2Bucket.put(key, fileBuffer, {
      httpMetadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    })

    const cleanBaseUrl = baseUrl.replace(/\/+$/, '')
    return {
      url: `${cleanBaseUrl}/media/${key}`,
      key,
      deleteUrl: '',
    }
  }

  async getImage(key: string): Promise<R2ObjectBody | null> {
    if (!this.r2Bucket) return null
    if (!key || key.includes('..')) return null
    return (await this.r2Bucket.get(key)) as R2ObjectBody | null
  }

  async deleteImage(keyOrUrl: string): Promise<boolean> {
    if (!this.r2Bucket || !keyOrUrl) return false
    let key = keyOrUrl
    if (key.includes('/media/')) {
      key = key.split('/media/')[1]
    }
    if (!key || key.includes('..')) return false
    try {
      await this.r2Bucket.delete(key)
      return true
    } catch (_) {
      return false
    }
  }
}
