import { describe, it, expect, vi } from 'vitest'
import { StorageService } from '../services/storage.service'

describe('StorageService (Cloudflare R2)', () => {
  it('throws error when R2 bucket is not configured', async () => {
    const service = new StorageService()
    const dummyBuffer = new Uint8Array([1, 2, 3]).buffer
    await expect(service.uploadImage(dummyBuffer, 'image/jpeg')).rejects.toThrow(
      'Stockage Cloudflare R2 non configuré'
    )
  })

  it('uploads image successfully to R2 bucket', async () => {
    const putMock = vi.fn().mockResolvedValue({})
    const mockBucket: any = {
      put: putMock,
      get: vi.fn(),
      delete: vi.fn(),
    }

    const service = new StorageService(mockBucket)
    const dummyBuffer = new Uint8Array([1, 2, 3]).buffer
    const result = await service.uploadImage(dummyBuffer, 'image/png', 'produits', 'https://maasga.com')

    expect(putMock).toHaveBeenCalledTimes(1)
    expect(result.url).toMatch(/^https:\/\/maasga\.com\/media\/produits\/.+\.png$/)
    expect(result.key).toMatch(/^produits\/.+\.png$/)
  })

  it('deletes image by key or URL from R2 bucket', async () => {
    const deleteMock = vi.fn().mockResolvedValue({})
    const mockBucket: any = {
      put: vi.fn(),
      get: vi.fn(),
      delete: deleteMock,
    }

    const service = new StorageService(mockBucket)

    // Delete by key
    const successKey = await service.deleteImage('produits/123-abc.jpg')
    expect(successKey).toBe(true)
    expect(deleteMock).toHaveBeenCalledWith('produits/123-abc.jpg')

    // Delete by URL
    const successUrl = await service.deleteImage('https://maasga.com/media/marques/lg/logo.png')
    expect(successUrl).toBe(true)
    expect(deleteMock).toHaveBeenCalledWith('marques/lg/logo.png')
  })
})
