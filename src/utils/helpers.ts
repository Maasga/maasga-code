// Sécurité : échappement HTML pour prévenir les XSS
export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// Décode les entités produites par escapeHtml. Sert uniquement à rattraper les
// lignes historiques stockées déjà échappées : le stockage se fait désormais en
// texte brut et l'échappement est appliqué au rendu (une seule couche).
export function unescapeHtml(str: string): string {
  return str.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&')
}

// Normalise un champ texte libre destiné à la base : retire les caractères de
// contrôle (hors tabulation et retours à la ligne), coupe les espaces de bord et
// borne la longueur pour qu'un formulaire public ne serve pas à gonfler la base.
// N'échappe PAS le HTML — sinon on stocke `&#39;` et le rendu l'affiche tel quel.
export function sanitizeText(value: unknown, maxLength = 500): string {
  const s = typeof value === 'string' ? value : value != null ? String(value) : ''
  let out = ''
  for (const ch of s) {
    const code = ch.codePointAt(0) as number
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) continue
    if (code === 127) continue
    out += ch
  }
  return out.trim().slice(0, maxLength)
}

// Email format validation
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Burkina Faso phone validation (8 digits, optional +226 prefix)
export function isValidPhone(phone: string): boolean {
  return /^(\+?226)?[0-9]{8}$/.test(phone.replace(/[\s\-]/g, ''))
}

// Normalize phone to 8-digit local format (strip spaces, dashes, +226 prefix)
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-]/g, '').replace(/^\+?226/, '')
}

// Validate image file magic bytes to prevent Content-Type spoofing
export function validateImageMagicBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true
  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return true
  // WebP: RIFF....WEBP
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true
  return false
}
