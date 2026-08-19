// Database access layer for D1
import type { D1Database } from '@cloudflare/workers-types'

export interface DbContext {
  DB: D1Database
}

// ============================================================
// APPOINTMENTS
// ============================================================

export async function getAppointments(db: D1Database) {
  const result = await db.prepare('SELECT * FROM appointments ORDER BY created_at DESC').all()
  return result.results || []
}

export async function getAppointmentById(db: D1Database, id: number) {
  const result = await db.prepare('SELECT * FROM appointments WHERE id = ?').bind(id).first()
  return result
}

export async function createAppointment(db: D1Database, data: any) {
  const result = await db.prepare(`
    INSERT INTO appointments (name, phone, quartier, date, heure_debut, heure_fin, type, notes, latitude, longitude, adresse_precise, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.name,
    data.phone,
    data.quartier,
    data.date,
    data.heure_debut || '08:00',
    data.heure_fin || '18:00',
    data.type,
    data.notes || null,
    data.latitude || null,
    data.longitude || null,
    data.adresse_precise || null,
    'pending',
    new Date().toISOString()
  ).run()
  
  return result
}

export async function updateAppointmentStatus(db: D1Database, id: number, status: string) {
  const result = await db.prepare(`
    UPDATE appointments 
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).bind(status, new Date().toISOString(), id).run()
  
  return result
}

// ============================================================
// ORDERS
// ============================================================

export async function getOrders(db: D1Database) {
  const result = await db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
  return result.results || []
}

export async function getOrdersByAppointmentId(db: D1Database, appointmentId: number) {
  const result = await db.prepare('SELECT * FROM orders WHERE appointment_id = ? ORDER BY created_at DESC').bind(appointmentId).all()
  return result.results || []
}

export async function getOrdersByStatus(db: D1Database, status: string) {
  const result = await db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').bind(status).all()
  return result.results || []
}

export async function getOrdersByClientId(db: D1Database, clientId: number) {
  const result = await db.prepare('SELECT * FROM orders WHERE client_id = ? ORDER BY created_at DESC').bind(clientId).all()
  return result.results || []
}

export async function createOrder(db: D1Database, data: any) {
  try {
    const result = await db.prepare(`
      INSERT INTO orders (
        client_id,
        appointment_id,
        product_id,
        quantity,
        client_name,
        client_phone,
        client_email,
        quartier,
        type,
        status,
        notes,
        total_price,
        installation_price,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.client_id || null,
      data.appointment_id || null,
      data.product_id || null,
      data.quantity || 1,
      data.client_name,
      data.client_phone,
      data.client_email || null,
      data.quartier || null,
      data.type || 'vente',
      data.status || 'en_attente',
      data.notes || null,
      data.total_price || 0,
      data.installation_price || 50000,
      new Date().toISOString(),
      new Date().toISOString()
    ).run()
    
    return result
  } catch (error) {
    console.error('Erreur création order D1:', error)
    throw error
  }
}

export async function updateOrderStatus(db: D1Database, orderId: number, status: string) {
  try {
    const result = await db.prepare(`
      UPDATE orders 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `).bind(status, new Date().toISOString(), orderId).run()
    
    return result
  } catch (error) {
    console.error('Erreur mise à jour order D1:', error)
    throw error
  }
}

export async function deleteOrder(db: D1Database, orderId: number) {
  try {
    const result = await db.prepare('DELETE FROM orders WHERE id = ?').bind(orderId).run()
    return result
  } catch (error) {
    console.error('Erreur suppression order D1:', error)
    throw error
  }
}

// ============================================================
// PRODUCTS
// ============================================================

export async function getProducts(db: D1Database) {
  const result = await db.prepare('SELECT * FROM products WHERE available = 1').all()
  return (result.results || []).map((p: any) => ({
    ...p,
    features: p.features ? (() => { try { return JSON.parse(p.features) } catch { return [] } })() : [],
    techSpecs: p.tech_specs ? (() => { try { return JSON.parse(p.tech_specs) } catch { return undefined } })() : undefined,
    media: p.media_urls ? (() => { try { return JSON.parse(p.media_urls) } catch { return [] } })() : []
  }))
}

export async function getProductById(db: D1Database, id: number) {
  const result = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first()
  return result
}

export async function createProduct(db: D1Database, data: any) {
  const result = await db.prepare(`
    INSERT INTO products (name, brand, model, btu, price, stock, surface_min, surface_max, energy_class, description, inverter, available, warranty, features, image, imageUrl, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.name,
    data.brand,
    data.model,
    data.btu,
    data.price,
    data.stock,
    data.surface_min || 10,
    data.surface_max || 25,
    data.energy_class || 'A++',
    data.description,
    data.inverter ? 1 : 0,
    data.stock > 0 ? 1 : 0,
    data.warranty || '1 an constructeur',
    data.features ? JSON.stringify(data.features) : null,
    data.image || '❄️',
    data.imageUrl,
    new Date().toISOString()
  ).run()
  
  return result
}

export async function updateProduct(db: D1Database, id: number, data: any) {
  const result = await db.prepare(`
    UPDATE products 
    SET name = ?, brand = ?, model = ?, btu = ?, price = ?, stock = ?, surface_min = ?, surface_max = ?, energy_class = ?, description = ?, inverter = ?, available = ?, warranty = ?, features = ?, imageUrl = ?, updated_at = ?
    WHERE id = ?
  `).bind(
    data.name,
    data.brand,
    data.model,
    data.btu,
    data.price,
    data.stock,
    data.surface_min,
    data.surface_max,
    data.energy_class,
    data.description,
    data.inverter ? 1 : 0,
    data.stock > 0 ? 1 : 0,
    data.warranty,
    data.features ? JSON.stringify(data.features) : null,
    data.imageUrl,
    new Date().toISOString(),
    id
  ).run()
  
  return result
}

export async function deleteProduct(db: D1Database, id: number) {
  const result = await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
  return result
}

// ============================================================
// REVIEWS
// ============================================================

export async function getReviews(db: D1Database, approvedOnly = true) {
  const query = approvedOnly 
    ? 'SELECT * FROM reviews WHERE approved = 1 ORDER BY date DESC'
    : 'SELECT * FROM reviews ORDER BY date DESC'
  const result = await db.prepare(query).all()
  return (result.results || []).map((r: any) => ({
    ...r,
    note: typeof r.note === 'string' ? parseInt(r.note, 10) : Number(r.note),
    approved: r.approved === 1 || r.approved === true
  }))
}

export async function createReview(db: D1Database, data: any) {
  const result = await db.prepare(`
    INSERT INTO reviews (name, note, comment, date, service, approved)
    VALUES (?, ?, ?, ?, ?, 0)
  `).bind(
    data.name,
    data.note,
    data.comment,
    data.date,
    data.service
  ).run()

  return result
}

export async function approveReview(db: D1Database, id: number) {
  const result = await db.prepare('UPDATE reviews SET approved = 1 WHERE id = ?').bind(id).run()
  return result
}

export async function deleteReview(db: D1Database, id: number) {
  const result = await db.prepare('DELETE FROM reviews WHERE id = ?').bind(id).run()
  return result
}

// ============================================================
// CLIENTS
// ============================================================

export async function getClients(db: D1Database) {
  const result = await db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all()
  return result.results || []
}

export async function getClientById(db: D1Database, id: number) {
  const result = await db.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first()
  return result
}

export async function createClient(db: D1Database, data: any) {
  try {
    // Chercher un client existant par telephone ou email
    let existing = null
    if (data.phone) {
      existing = await db.prepare('SELECT id FROM clients WHERE phone = ?').bind(data.phone).first()
    }
    if (!existing && data.email) {
      existing = await db.prepare('SELECT id FROM clients WHERE email = ?').bind(data.email).first()
    }
    
    if (existing) {
      // Mettre a jour au lieu de creer
      await db.prepare(`
        UPDATE clients 
        SET name = ?, email = COALESCE(?, email), quartier = COALESCE(NULLIF(?, ''), quartier), adresse_precise = COALESCE(?, adresse_precise), latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude), type_demande = ?, notes = COALESCE(?, notes), product_id = COALESCE(?, product_id), updated_at = ?
        WHERE id = ?
      `).bind(
        data.name, data.email || null, data.quartier || '', data.adresse_precise || null,
        data.latitude || null, data.longitude || null, data.type_demande, data.notes || null,
        data.product_id || null, new Date().toISOString(), (existing as any).id
      ).run()
      return existing
    }
    
    // Generer un phone unique si absent (pour la contrainte UNIQUE)
    const phone = data.phone || ('auto_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6))
    
    // Creer nouveau client
    const result = await db.prepare(`
      INSERT INTO clients (name, phone, email, quartier, adresse_precise, latitude, longitude, type_demande, notes, product_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.name, phone, data.email || null, data.quartier || '', data.adresse_precise || null,
      data.latitude || null, data.longitude || null, data.type_demande, data.notes || null,
      data.product_id || null, new Date().toISOString(), new Date().toISOString()
    ).run()
    
    return result
  } catch (error) {
    console.error('Erreur createClient:', error)
    throw error
  }
}

export async function deleteClient(db: D1Database, clientId: number) {
  try {
    const result = await db.prepare('DELETE FROM clients WHERE id = ?').bind(clientId).run()
    return result
  } catch (error) {
    console.error('Erreur suppression client D1:', error)
    throw error
  }
}

// ============================================================
// QUARTIERS
// ============================================================

export async function getQuartiers(db: D1Database) {
  const result = await db.prepare('SELECT * FROM quartiers ORDER BY arrondissement, name').all()
  return result.results || []
}

export async function getQuartiersByArrondissement(db: D1Database, arrondissement: number) {
  const result = await db.prepare('SELECT * FROM quartiers WHERE arrondissement = ? ORDER BY name').bind(arrondissement).all()
  return result.results || []
}

export async function createQuartier(db: D1Database, name: string, arrondissement: number, latitude?: number, longitude?: number) {
  const result = await db.prepare(`
    INSERT INTO quartiers (name, arrondissement, latitude, longitude)
    VALUES (?, ?, ?, ?)
  `).bind(name, arrondissement, latitude || null, longitude || null).run()
  return result
}
