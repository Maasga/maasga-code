import type { D1Database } from '@cloudflare/workers-types'

export type HonoEnv = {
  Bindings: {
    DB?: D1Database
    ADMIN_SECRET?: string
    ADMIN_INITIAL_PASSWORD?: string
    GOOGLE_CLIENT_ID?: string
    GOOGLE_CLIENT_SECRET?: string
    LIGDICASH_API_KEY?: string
    LIGDICASH_AUTH_TOKEN?: string
    TELEGRAM_BOT_TOKEN?: string
    TELEGRAM_CHAT_ID?: string
    ADMIN_EMAIL?: string
    ADMIN_WHATSAPP?: string
    BREVO_API_KEY?: string
  }
}
