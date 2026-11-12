// Schémas de validation partagés (formulaires publics, API).
// Une seule source de vérité pour les contraintes : longueurs, formats, valeurs autorisées.
import { z } from 'zod'
import { isValidEmail, isValidPhone, sanitizeText } from '../utils/helpers'

/** Chaîne nettoyée (caractères de contrôle retirés) + trim + longueur max. */
const text = (max: number) =>
  z.preprocess((v) => (v == null ? '' : sanitizeText(v, max * 4).trim()), z.string().max(max, `Texte trop long (${max} caractères max).`))

const required = (label: string, max: number) => text(max).pipe(z.string().min(1, `${label} est obligatoire.`))

export const phoneBF = required('Le téléphone', 20)
  .refine(isValidPhone, 'Numéro de téléphone invalide (8 chiffres requis).')

const optionalPhone = text(20).refine((v) => !v || isValidPhone(v), 'Numéro de téléphone invalide (8 chiffres requis).')
const optionalEmail = text(160).refine((v) => !v || isValidEmail(v), 'Adresse email invalide.')

const isoDate = text(10).refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)), 'Date invalide.')
const hhmm = (fallback: string) => text(5).transform((v) => v || fallback).refine((v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v), 'Heure invalide.')

const coord = (min: number, max: number) => z.preprocess(
  (v) => { const n = parseFloat(String(v ?? '')); return Number.isFinite(n) ? n : null },
  z.number().min(min).max(max).nullable()
)

const intIn = (min: number, max: number, fallback: number) => z.preprocess(
  (v) => { const n = parseInt(String(v ?? ''), 10); return Number.isFinite(n) ? n : fallback },
  z.number().int().min(min).max(max)
)

/** Champ « piège à robots » : doit rester vide. */
const honeypot = text(200).optional()

const todayIso = () => new Date().toISOString().slice(0, 10)

export const RDV_TYPES = ['devis', 'installation', 'entretien', 'depannage'] as const

export const rdvSchema = z.object({
  website: honeypot,
  name: required('Le nom', 120),
  phone: phoneBF,
  email: optionalEmail,
  quartier: required('Le quartier', 120),
  date: isoDate.refine((d) => d >= todayIso(), 'La date doit être aujourd’hui ou plus tard.'),
  heure_debut: hhmm('08:00'),
  heure_fin: hhmm('18:00'),
  type: text(20).transform((v) => (RDV_TYPES as readonly string[]).includes(v.toLowerCase()) ? v.toLowerCase() as typeof RDV_TYPES[number] : 'devis' as const),
  notes: text(2000),
  latitude: coord(-90, 90),
  longitude: coord(-180, 180),
  adresse_precise: text(300),
  product_id: z.preprocess((v) => { const n = parseInt(String(v ?? ''), 10); return Number.isFinite(n) && n > 0 ? n : null }, z.number().int().nullable()),
  surface_hint: text(20),
  btu_hint: text(20),
}).refine((d) => d.heure_fin > d.heure_debut, { message: 'L’heure de fin doit suivre l’heure de début.', path: ['heure_fin'] })

export const avisSchema = z.object({
  website: honeypot,
  name: required('Le nom', 80),
  note: intIn(1, 5, 5),
  comment: required('Le commentaire', 1500).pipe(z.string().min(10, 'Le commentaire doit faire au moins 10 caractères.')),
  service: text(80),
})

export const contactSchema = z.object({
  website: honeypot,
  name: required('Le nom', 120),
  email: optionalEmail,
  phone: optionalPhone,
  message: required('Le message', 3000),
})

export const stockAlertSchema = z.object({
  product_id: intIn(1, Number.MAX_SAFE_INTEGER, 0).refine((n) => n > 0, 'Produit invalide.'),
  phone: phoneBF,
})

export const maintenanceRequestSchema = z.object({
  website: honeypot,
  name: required('Le nom', 120),
  phone: phoneBF,
  email: optionalEmail,
  quartier: text(120),
  plan_type: text(40).transform((v) => v.toLowerCase()),
  request_type: text(20).transform((v) => v.toLowerCase()),
  description: text(2000),
  preferred_date: text(10).refine((v) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))), 'Date invalide.'),
  equipment_type: text(80),
  nb_climatiseurs: intIn(1, 500, 1),
  frequence_visites: text(40).transform((v) => v || 'Confort'),
  type_etablissement: text(80),
  exigences: text(1000),
}).transform((d) => ({ ...d, request_type: d.request_type || (d.plan_type ? 'contrat' : 'occasionnelle') }))
  .refine((d) => ['occasionnelle', 'urgence', 'contrat'].includes(d.request_type), { message: 'Type de demande invalide.', path: ['request_type'] })

/** Résultat d'une validation : données typées, ou premier message d'erreur lisible. */
export type Validated<T> = { ok: true; data: T } | { ok: false; error: string }

export function validate<S extends z.ZodTypeAny>(schema: S, input: unknown): Validated<z.output<S>> {
  const r = schema.safeParse(input ?? {})
  if (r.success) return { ok: true, data: r.data }
  return { ok: false, error: r.error.issues[0]?.message || 'Données invalides.' }
}
