// The stair-lens patch (E-27 T-107-01).
//
// prismarine-viewer 1.33.0's getModelVariants (viewer/lib/models.js) short-circuits
// "air-like" blocks with a SUBSTRING check: `block.name.includes('air')`. Every
// `*_stairs` block name contains that substring ("st-AIR-s"), so the mesher returned
// zero variants for every stair at every state — the T-097 "stairs-invisible" finding.
// The block models were always present in public/blocksStates/<version>.json; only the
// lookup dropped them. This is a LENS defect (E-22 class): placement, read-back, and
// occupancy metrics were always correct; pixels lied.
//
// The patch narrows the check to the three real air blocks. It runs as render/'s
// `postinstall` (idempotent), and `src/lens-guard.mjs` THROWS before any render if the
// installed file still carries the buggy pattern — a fresh unpatched install fails
// loudly instead of silently re-breaking the lens.

import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const BUGGY_PATTERN = "if (block.name.includes('air')) return []"
export const FIXED_PATTERN =
  "if (block.name === 'air' || block.name === 'cave_air' || block.name === 'void_air') return []"

/**
 * Pure core: replace the substring air-check with the exact-name check.
 * Idempotent — already-patched input comes back unchanged. Unknown input THROWS
 * (the viewer drifted under us; never guess at a lens).
 *
 * @param {string} src - models.js source text
 * @returns {{ src: string, changed: boolean }}
 */
export function patchSource (src) {
  if (src.includes(FIXED_PATTERN)) return { src, changed: false }
  if (!src.includes(BUGGY_PATTERN)) {
    throw new Error(
      'patch-viewer-lens: neither the buggy nor the fixed air-check found in models.js — ' +
      'prismarine-viewer changed; re-verify the stair lens before rendering (T-107-01)'
    )
  }
  return { src: src.replace(BUGGY_PATTERN, FIXED_PATTERN), changed: true }
}

/** Resolve the installed models.js from render/'s own dependency tree. */
export function modelsPath () {
  const require = createRequire(import.meta.url)
  const pkg = require.resolve('prismarine-viewer/package.json')
  return join(dirname(pkg), 'viewer', 'lib', 'models.js')
}

function main () {
  const path = modelsPath()
  const before = readFileSync(path, 'utf8')
  const { src, changed } = patchSource(before)
  if (changed) {
    writeFileSync(path, src)
    console.log(`patched: ${path}`)
  } else {
    console.log(`already-patched: ${path}`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
