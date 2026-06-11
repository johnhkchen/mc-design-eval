// Import-time tripwire for the stair-lens patch (E-27 T-107-01).
//
// The mesher runs inside worker_threads workers that require('./models') straight from
// the prismarine-viewer package directory, so the fix must live ON DISK (an in-process
// monkey-patch never reaches the workers). This guard makes the dependency explicit:
// any module that can render imports this for side effect, and an unpatched install
// THROWS before a single pixel is produced through the broken lens.

import { readFileSync } from 'node:fs'
import { BUGGY_PATTERN, modelsPath } from '../scripts/patch-viewer-lens.mjs'

export function assertLensPatched () {
  const src = readFileSync(modelsPath(), 'utf8')
  if (src.includes(BUGGY_PATTERN)) {
    throw new Error(
      'stair-lens unpatched: prismarine-viewer would mesh every *_stairs block as air ' +
      '(T-097). Run `npm install` in render/ — postinstall applies the lens patch ' +
      '(scripts/patch-viewer-lens.mjs).'
    )
  }
}

assertLensPatched()
