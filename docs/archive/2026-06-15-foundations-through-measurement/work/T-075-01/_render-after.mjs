// Throwaway proof harness (T-075-01): re-render the EXISTING scale-64 gatehouse artifact with
// the fixed (supersampled) lens. Same artifact.json, same BUILDING_VIEW_3Q — only the lens
// changed. Also reports a high-frequency-energy comparison vs the committed (aliased) before.png
// so the "static dropped" claim is quantified, not just eyeballed.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderArtifact } from '../../../../render/src/render-tool.mjs'
import { BUILDING_VIEW_3Q } from '../../../../src/building.mjs'
import { highFreqEnergy } from '../../../../src/render-supersample.mjs'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const artifact = JSON.parse(readFileSync(new URL('../../../../benchmarks/sculpture/building/scale-64/artifact.json', import.meta.url), 'utf8'))

const outPath = HERE + 'after.png'
const t0 = Date.now()
const rep = await renderArtifact(artifact, { outPath, view: BUILDING_VIEW_3Q })
console.log('rendered', rep.placed, 'blocks →', rep.path, `(${rep.bytes} bytes, ${rep.view.width || 512}px, ${Date.now() - t0}ms)`)

// Quantify static: HF energy of before (aliased) vs after (fixed). Lower = less static.
const canvasPkg = (await import('canvas')).default
const { createCanvas, loadImage } = canvasPkg
async function hf (p) {
  const img = await loadImage(readFileSync(p))
  const cv = createCanvas(img.width, img.height)
  const ctx = cv.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const { data } = ctx.getImageData(0, 0, img.width, img.height)
  return { e: highFreqEnergy(data, img.width, img.height), w: img.width, h: img.height }
}
const before = await hf(HERE + 'before.png')
const after = await hf(outPath)
console.log(`before: ${before.w}x${before.h} HF=${before.e.toFixed(1)}`)
console.log(`after : ${after.w}x${after.h} HF=${after.e.toFixed(1)}`)
console.log(`HF reduction: ${(100 * (1 - after.e / before.e)).toFixed(1)}%`)
