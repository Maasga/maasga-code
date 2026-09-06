import type { D1Database } from '@cloudflare/workers-types'

// URL de base du site — à mettre à jour ici quand le domaine personnalisé sera configuré.
// Utilisé dans index.tsx (CORS, CSRF) et Layout.tsx (canonical, og:url).
export const SITE_URL = 'https://maasga-website.pages.dev'

export type HonoEnv = {
  Bindings: {
    DB?: D1Database
    ADMIN_SECRET?: string
    ADMIN_INITIAL_PASSWORD?: string
    GOOGLE_CLIENT_ID?: string
    GOOGLE_CLIENT_SECRET?: string
    TELEGRAM_BOT_TOKEN?: string
    TELEGRAM_CHAT_ID?: string
    ADMIN_EMAIL?: string
    ADMIN_WHATSAPP?: string
    BREVO_API_KEY?: string
    IMGBB_API_KEY?: string
  }
}
