// Back-office : point d'entrée qui assemble les routeurs par domaine.
// L'ordre de montage reprend l'ordre de déclaration d'origine des groupes.
import { Hono } from 'hono'
import type { HonoEnv } from '../../types'
import { adminAuthRouter } from './auth.routes'
import { adminNotificationsRouter } from './notifications.routes'
import { adminMaintenanceRouter } from './maintenance.routes'
import { adminDevisRouter } from './devis.routes'
import { adminCatalogueRouter } from './catalogue.routes'
import { adminContenuRouter } from './contenu.routes'
import { adminSavRouter } from './sav.routes'
import { adminCrmRouter } from './crm.routes'
import { adminPagesRouter } from './pages.routes'

export const adminRouter = new Hono<HonoEnv>()
adminRouter.route('', adminAuthRouter)
adminRouter.route('', adminNotificationsRouter)
adminRouter.route('', adminMaintenanceRouter)
adminRouter.route('', adminDevisRouter)
adminRouter.route('', adminCatalogueRouter)
adminRouter.route('', adminContenuRouter)
adminRouter.route('', adminSavRouter)
adminRouter.route('', adminCrmRouter)
adminRouter.route('', adminPagesRouter)

export { adminAuth } from './shared'
