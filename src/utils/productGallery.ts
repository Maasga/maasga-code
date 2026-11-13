// Écriture de la galerie (images annexes) d'un produit en D1.
//
// La galerie vit dans `products.media_urls` (migration 0019). Certaines bases ont
// aussi une colonne alias `gallery` (écrite par l'admin mobile), mais AUCUNE
// migration ne la crée : sur une base qui ne l'a pas, un `UPDATE … gallery = ?`
// échoue (« no such column ») et l'affectation d'images annexes est perdue.
// On détecte donc la colonne une fois par isolate et on ne l'écrit que si elle existe.

let hasGalleryColumn: boolean | null = null

export async function productsHaveGalleryColumn(db: any): Promise<boolean> {
  if (hasGalleryColumn !== null) return hasGalleryColumn
  try {
    const row = await db.prepare(
      "SELECT COUNT(*) AS n FROM pragma_table_info('products') WHERE name = 'gallery'"
    ).first() as any
    hasGalleryColumn = Number(row?.n) > 0
  } catch {
    hasGalleryColumn = false
  }
  return hasGalleryColumn
}

/** Liste des colonnes galerie à lire dans un SELECT (`media_urls` + `gallery` si présente). */
export async function gallerySelectColumns(db: any): Promise<string> {
  return (await productsHaveGalleryColumn(db)) ? 'media_urls, gallery' : 'media_urls'
}

/** Parse la galerie d'une ligne produit (tableau, jamais null). */
export function parseGallery(row: any): any[] {
  try {
    const list = JSON.parse(row?.media_urls || row?.gallery || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/** Enregistre la galerie d'un produit (media_urls, et gallery si la colonne existe). */
export async function saveProductGallery(db: any, productId: number, gallery: any[]): Promise<void> {
  const json = JSON.stringify(gallery)
  const now = new Date().toISOString()
  if (await productsHaveGalleryColumn(db)) {
    await db.prepare('UPDATE products SET media_urls = ?, gallery = ?, updated_at = ? WHERE id = ?')
      .bind(json, json, now, productId).run()
  } else {
    await db.prepare('UPDATE products SET media_urls = ?, updated_at = ? WHERE id = ?')
      .bind(json, now, productId).run()
  }
}

/** Pour les tests uniquement. */
export function _resetGalleryColumnCache(): void {
  hasGalleryColumn = null
}
