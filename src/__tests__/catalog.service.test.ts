import { describe, it, expect, beforeEach } from 'vitest'
import { products } from '../data/products'
import {
  mapProductRow,
  ensureCatalogFresh,
  bumpContentVersion,
  getContentVersion,
  __resetCatalogStateForTests,
} from '../services/catalog.service'

/** Faux D1 minimal : une table products + une valeur content_version. */
function fakeDb(rows: any[], initialVersion = '1') {
  const state = { version: initialVersion, productQueries: 0, rows }
  const db: any = {
    prepare(sql: string) {
      let args: any[] = []
      const stmt = {
        bind(...a: any[]) { args = a; return stmt },
        async first() {
          if (sql.includes('FROM site_settings')) return { value: state.version }
          return null
        },
        async all() {
          if (sql.includes('FROM products')) { state.productQueries++; return { results: state.rows } }
          return { results: [] }
        },
        async run() {
          if (sql.includes('INSERT INTO site_settings')) state.version = args[1]
          return { meta: {} }
        },
      }
      return stmt
    },
  }
  return { db, state }
}

const row = (id: number, price: number) => ({
  id, name: `Clim ${id}`, brand: 'LG', model: 'X', btu: 9000, price, stock: 2,
  surface_min: 10, surface_max: 20, energy_class: 'A', description: '',
  inverter: 1, available: 1, features: '["a"]', tech_specs: null, media_urls: 'oops',
})

describe('catalog.service', () => {
  beforeEach(() => {
    __resetCatalogStateForTests()
    products.length = 0
  })

  it('mapProductRow convertit les booléens et tolère un JSON invalide', () => {
    const p = mapProductRow(row(1, 100))
    expect(p.inverter).toBe(true)
    expect(p.available).toBe(true)
    expect(p.features).toEqual(['a'])
    expect(p.media).toEqual([])
    expect(p.techSpecs).toBeUndefined()
  })

  it('ne recharge pas le catalogue tant que la version ne change pas', async () => {
    const { db, state } = fakeDb([row(1, 100)])
    await ensureCatalogFresh(db)
    await ensureCatalogFresh(db)
    expect(state.productQueries).toBe(1)
    expect(products).toHaveLength(1)
  })

  it('recharge le catalogue après bumpContentVersion', async () => {
    const { db, state } = fakeDb([row(1, 100)])
    await ensureCatalogFresh(db)
    state.rows = [row(1, 150), row(2, 200)]
    await bumpContentVersion(db)
    await ensureCatalogFresh(db)
    expect(state.productQueries).toBe(2)
    expect(products.map(p => p.price)).toEqual([150, 200])
    expect(await getContentVersion(db)).toBe(state.version)
  })

  it('remplace le tableau en place (les imports existants restent valides)', async () => {
    const ref = products
    const { db } = fakeDb([row(3, 1)])
    await ensureCatalogFresh(db)
    expect(ref).toBe(products)
    expect(ref[0].id).toBe(3)
  })
})
