// Sécurité : échappement HTML pour prévenir les XSS
export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
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
