// Compile le JS client et produit un manifeste d'assets versionnés.
//
// Pourquoi : /static/* est servi avec `Cache-Control: immutable, max-age=30j`.
// Sans empreinte dans l'URL, un visiteur pouvait garder l'ancien CSS/JS jusqu'à
// 30 jours après un déploiement. Chaque URL porte désormais ?v=<hash du contenu>.
import { build } from 'esbuild'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const p = (rel) => root + rel

const entries = [
  { entry: 'src/client/site.js', out: 'public/static/js/site.js' },
]

mkdirSync(p('public/static/js'), { recursive: true })
for (const e of entries) {
  await build({
    entryPoints: [p(e.entry)],
    outfile: p(e.out),
    // Pas de bundle ni de format : le fichier reste un script classique dont les
    // fonctions de premier niveau restent globales (appelées par des onclick).
    bundle: false,
    minify: true,
    target: ['es2019', 'safari13'],
    legalComments: 'none',
    logLevel: 'warning',
  })
}

const hash = (rel) => createHash('sha256').update(readFileSync(p(rel))).digest('hex').slice(0, 10)

// Empreinte de chaque .css/.js servi depuis public/static
const versions = {}
const walk = (dir) => {
  for (const ent of readdirSync(p(dir), { withFileTypes: true })) {
    const rel = `${dir}/${ent.name}`
    if (ent.isDirectory()) walk(rel)
    else if (/\.(css|js)$/.test(ent.name)) versions['/' + rel.slice('public/'.length)] = hash(rel)
  }
}
walk('public/static')

const v = (path) => `${path}?v=${versions[path]}`
const manifest = {
  siteJs: v('/static/js/site.js'),
  tailwindCss: v('/static/tailwind.css'),
  styleCss: v('/static/style.css'),
}

mkdirSync(p('src/generated'), { recursive: true })
writeFileSync(p('src/generated/asset-manifest.ts'), `// Fichier généré par scripts/build-assets.mjs — ne pas modifier.
export const ASSET_VERSIONS: Record<string, string> = ${JSON.stringify(versions, null, 2)}

export const ASSETS = ${JSON.stringify(manifest, null, 2)} as const

/** URL versionnée d'un fichier de public/static (cache immutable côté navigateur). */
export const asset = (path: string): string =>
  ASSET_VERSIONS[path] ? \`\${path}?v=\${ASSET_VERSIONS[path]}\` : path
`)
console.log(`[assets] ${Object.keys(versions).length} fichiers versionnés`)
