import { Hono } from 'hono'
import type { HonoEnv } from '../../types'
import { mobileClientRouter } from './client.routes'
import { mobileAdminRouter } from './admin.routes'

export const mobileRouter = new Hono<HonoEnv>()

// Mount client and admin sub-routers under /api/mobile
mobileRouter.route('/api/mobile', mobileClientRouter)
mobileRouter.route('/api/mobile', mobileAdminRouter)

// Route /api/client for push-token and client mobile compatibility
mobileRouter.route('/api/client', mobileClientRouter)

export * from './client.routes'
export * from './admin.routes'
