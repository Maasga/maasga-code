import { describe, it, expect } from 'vitest'
import { validate, rdvSchema, avisSchema, contactSchema, stockAlertSchema, maintenanceRequestSchema } from '../validation/schemas'

const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

const rdv = (over: Record<string, unknown> = {}) => ({
  name: ' Awa ', phone: '70 12 34 56', quartier: 'Gounghin', date: tomorrow,
  heure_debut: '08:00', heure_fin: '12:00', type: 'Installation', ...over,
})

describe('rdvSchema', () => {
  it('accepte un RDV valide et normalise les champs', () => {
    const r = validate(rdvSchema, rdv({ latitude: '12.37', longitude: '-1.52', product_id: '4' }))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.name).toBe('Awa')
    expect(r.data.type).toBe('installation')
    expect(r.data.latitude).toBeCloseTo(12.37)
    expect(r.data.product_id).toBe(4)
  })
  it('remplace un type inconnu par « devis »', () => {
    const r = validate(rdvSchema, rdv({ type: 'hack' }))
    expect(r.ok && r.data.type).toBe('devis')
  })
  it('refuse une date passée', () => {
    expect(validate(rdvSchema, rdv({ date: yesterday }))).toMatchObject({ ok: false })
  })
  it('refuse une heure de fin avant le début', () => {
    expect(validate(rdvSchema, rdv({ heure_debut: '14:00', heure_fin: '09:00' }))).toMatchObject({ ok: false })
  })
  it('refuse un téléphone invalide avec un message en français', () => {
    expect(validate(rdvSchema, rdv({ phone: '123' }))).toEqual({ ok: false, error: 'Numéro de téléphone invalide (8 chiffres requis).' })
  })
  it('ignore des coordonnées hors bornes', () => {
    expect(validate(rdvSchema, rdv({ latitude: '999' }))).toMatchObject({ ok: false })
  })
})

describe('contactSchema', () => {
  it('limite la taille du message', () => {
    const r = validate(contactSchema, { name: 'A', message: 'x'.repeat(3001) })
    expect(r).toMatchObject({ ok: false })
  })
  it('retire les caractères de contrôle', () => {
    const r = validate(contactSchema, { name: 'A\u0000B', message: 'Bonjour' })
    expect(r.ok && r.data.name).toBe('AB')
  })
  it('exige nom et message', () => {
    expect(validate(contactSchema, {})).toEqual({ ok: false, error: 'Le nom est obligatoire.' })
  })
})

describe('avisSchema', () => {
  it('borne la note entre 1 et 5 et exige 10 caractères', () => {
    expect(validate(avisSchema, { name: 'A', note: '9', comment: 'Très bon service !' })).toMatchObject({ ok: false })
    expect(validate(avisSchema, { name: 'A', note: '4', comment: 'court' })).toMatchObject({ ok: false })
    expect(validate(avisSchema, { name: 'A', comment: 'Très bon service !' })).toMatchObject({ ok: true, data: { note: 5 } })
  })
})

describe('stockAlertSchema', () => {
  it('exige un produit et un téléphone valides', () => {
    expect(validate(stockAlertSchema, { product_id: '0', phone: '70123456' })).toMatchObject({ ok: false })
    expect(validate(stockAlertSchema, { product_id: '3', phone: '+22670123456' })).toMatchObject({ ok: true })
  })
})

describe('maintenanceRequestSchema', () => {
  it('déduit le type de demande depuis la formule', () => {
    const r = validate(maintenanceRequestSchema, { name: 'A', phone: '70123456', plan_type: 'Residentiel' })
    expect(r.ok && r.data.request_type).toBe('contrat')
    expect(r.ok && r.data.plan_type).toBe('residentiel')
    expect(r.ok && r.data.nb_climatiseurs).toBe(1)
  })
  it('refuse un type de demande inconnu', () => {
    expect(validate(maintenanceRequestSchema, { name: 'A', phone: '70123456', request_type: 'autre' })).toMatchObject({ ok: false })
  })
})
