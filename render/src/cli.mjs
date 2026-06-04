// `npm run render:sample` — the demonstrable entrypoint (AC #4).
//
// Builds the sample world and renders it to out/sample.png. This is the artifact a
// human runs to *see* the scaffold working end to end: version pin → in-memory world
// → headless WebGL → correct PNG.

import { fileURLToPath } from 'node:url'
import { buildSampleWorld } from './world.mjs'
import { renderWorldToPng, GL_AVAILABLE, GL_LOAD_ERROR } from './render.mjs'

const outPath = fileURLToPath(new URL('../out/sample.png', import.meta.url))

if (!GL_AVAILABLE) {
  console.error('headless GL is unavailable in this environment, cannot render:')
  console.error('  ' + (GL_LOAD_ERROR && GL_LOAD_ERROR.message))
  console.error('See README.md for the Playwright/Chromium fallback.')
  process.exit(1)
}

const { world, center } = await buildSampleWorld()
const buffer = await renderWorldToPng(world, center, { outPath })
console.log(`wrote ${outPath} (${buffer.length} bytes)`)

// prismarine-viewer holds worker threads open; exit explicitly once the PNG is written.
process.exit(0)
