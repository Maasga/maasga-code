// Helper pour hybride en-mémoire + D1
// Pendant la transition, les données sont en mémoire ET dans D1

import type { D1Database } from '@cloudflare/workers-types'

export class HybridData {
  private db: D1Database | null = null
  private inMemory: boolean = true

  constructor(db?: D1Database) {
    this.db = db || null
    this.inMemory = true // mode hybride
  }

  async initializeFromDB() {
    if (!this.db) return
    try {
      console.log('Initializing data from D1...')
      // À tester apres la migration
    } catch (error) {
      console.error('Error initializing from DB:', error)
    }
  }

  // Les données restent en mémoire (arrays) mais sont aussi sauvegardées en D1
  // getters et setters peuvent sync avec D1
}
