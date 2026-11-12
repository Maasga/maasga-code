import { describe, it, expect, beforeEach } from 'vitest'
import { saveProductGallery, gallerySelectColumns, parseGallery, _resetGalleryColumnCache } from '../utils/productGallery'

// D1 minimal : `hasGallery` simule la présence (ou non) de la colonne alias `gallery`
function mockDb(hasGallery: boolean) {
  const writes: { query: string; params: any[] }[] = []
  const db: any = {
    prepare: (query: string) => ({
      first: async () => (query.includes('pragma_table_info') ? { n: hasGallery ? 1 : 0 } : null),
      bind: (...params: any[]) => ({
        run: async () => { writes.push({ query, params }); return { meta: { changes: 1 } } },
      }),
    }),
  }
  return { db, writes }
}

describe('productGallery', () => {
  beforeEach(() => _resetGalleryColumnCache())

  it('n’écrit que media_urls quand la colonne gallery n’existe pas', async () => {
    const { db, writes } = mockDb(false)
    await saveProductGallery(db, 7, [{ url: 'a.png' }])
    expect(writes).toHaveLength(1)
    expect(writes[0].query).not.toMatch(/gallery/)
    expect(writes[0].params[0]).toBe('[{"url":"a.png"}]')
    expect(writes[0].params.at(-1)).toBe(7)
    expect(await gallerySelectColumns(db)).toBe('media_urls')
  })

  it('écrit aussi gallery quand la colonne existe', async () => {
    const { db, writes } = mockDb(true)
    await saveProductGallery(db, 3, [])
    expect(writes[0].query).toMatch(/media_urls = \?, gallery = \?/)
    expect(await gallerySelectColumns(db)).toBe('media_urls, gallery')
  })

  it('parseGallery tolère JSON invalide et valeurs non-tableau', () => {
    expect(parseGallery({ media_urls: 'oops' })).toEqual([])
    expect(parseGallery({ media_urls: '{"a":1}' })).toEqual([])
    expect(parseGallery({ media_urls: null, gallery: '["x"]' })).toEqual(['x'])
  })
})
