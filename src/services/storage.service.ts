import type { R2Bucket, R2ObjectBody } from '@cloudflare/workers-types'

export interface UploadResult {
  url: string
  key: string
  deleteUrl?: string
}

export class StorageService {
  constructor(
    private readonly r2Bucket?: R2Bucket,
    private readonly imgbbApiKey?: string
  ) {}

  async uploadImage(
    fileBuffer: ArrayBuffer | Uint8Array,
    mimeType: string,
    folder: string = 'uploads',
    baseUrl: string = 'https://maasga-website.pages.dev'
  ): Promise<UploadResult> {
    if (this.r2Bucket) {
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

    if (this.imgbbApiKey) {
      return this.uploadToImgBB(fileBuffer, mimeType)
    }

    throw new Error('Aucun service de stockage disponible (R2 ou IMGBB non configuré)')
  }

  async getImage(key: string): Promise<R2ObjectBody | null> {
    if (!this.r2Bucket) return null
    if (!key || key.includes('..')) return null
    return (await this.r2Bucket.get(key)) as R2ObjectBody | null
  }

  async deleteImage(key: string): Promise<boolean> {
    if (!this.r2Bucket || !key) return false
    await this.r2Bucket.delete(key)
    return true
  }

  private async uploadToImgBB(
    fileBuffer: ArrayBuffer | Uint8Array,
    mimeType: string
  ): Promise<UploadResult> {
    const uint8 = fileBuffer instanceof Uint8Array ? fileBuffer : new Uint8Array(fileBuffer)
    let binary = ''
    const len = uint8.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i])
    }
    const base64 = btoa(binary)

    const formData = new FormData()
    formData.append('image', base64)

    const resp = await fetch(`https://api.imgbb.com/1/upload?key=${this.imgbbApiKey}`, {
      method: 'POST',
      body: formData,
    })

    if (!resp.ok) {
      throw new Error(`ImgBB upload failed with status ${resp.status}`)
    }

    const data: any = await resp.json()
    if (!data.success) {
      throw new Error(`ImgBB upload failed: ${data.error?.message || 'unknown error'}`)
    }

    return {
      url: data.data.url,
      key: data.data.id || '',
      deleteUrl: data.data.delete_url || '',
    }
  }
}
