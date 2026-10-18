import { Hono } from 'hono'
import type { HonoEnv } from '../../types'
import { mobileClientRouter } from './client.routes'
import { mobileAdminRouter } from './admin.routes'

export const mobileRouter = new Hono<HonoEnv>()

// Mount client and admin sub-routers
mobileRouter.route('/', mobileClientRouter)
mobileRouter.route('/', mobileAdminRouter)

export * from './client.routes'
export * from './admin.routes'
