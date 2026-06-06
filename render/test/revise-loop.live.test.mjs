// T-045-01 live proof — reviseLoop drives the REAL form-score render seam (optional, GL-gated).
//
// GL-gated, mirroring observe-region.test.mjs: the loop's default `liveFormScore` renders the artifact
// (headless GL) and scores its silhouette IoU against the committed concept image. The CAGE itself
// (convergence, accept-gate, spatial lock, determinism) is proven purely in src/revise/loop.test.mjs
// with no GL; this one test proves the live render-score seam actually wires end-to-end on a real
// sculpture. Skips (with the captured reason) when headless GL is unavailable; not part of `npm test`.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const KOI_DIR = '../../benchmarks/sculpture/runs/009-vConcept-a-koi-fish'
const koiArtifact = () =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`${KOI_DIR}/artifact.json`, import.meta.url)), 'utf8'))
const conceptPath = () => fileURLToPath(new URL(`${KOI_DIR}/concept.png`, import.meta.url))

test('reviseLoop: one live iteration renders + scores the koi via the real form seam', async (t) => {
  const { GL_AVAILABLE, GL_LOAD_ERROR } = await import('../src/render-tool.mjs')
  if (!GL_AVAILABLE) {
    t.skip('headless GL unavailable: ' + (GL_LOAD_ERROR && GL_LOAD_ERROR.message))
    return
  }
  const { reviseLoop, liveFormScore } = await import('../../src/revise/loop.mjs')

  const koi = koiArtifact()
  // One bbox region over the head end; a single attempt — we are proving the SCORE seam, not
  // hill-climbing or diagnosis. Force a relief route so the real render+score path runs (the koi head
  // is geometrically "clean" to the model-free proceduralDiagnose, so the default would skip scoring).
  const out = await reviseLoop(koi, {
    regions: [{ bbox: { min: [-15, 2, -13], max: [-8, 13, 3] } }],
    diagnose: () => [{ defect: 'flat', where: 'head', route: 'relief' }],
    score: liveFormScore({ conceptPath: conceptPath() }),
    budget: { maxIterations: 4, perRegion: 1 },
  })

  assert.equal(out.schema, 'revise-loop/v1')
  assert.equal(out.trace.length, 1, 'one region, one attempt → one trace entry')
  const e = out.trace[0]
  assert.equal(typeof e.scoreBefore, 'number', 'the live render produced a numeric before-score')
  assert.equal(typeof e.scoreAfter, 'number', 'and a numeric after-score')
  assert.ok(e.scoreBefore >= 0 && e.scoreBefore <= 1, 'IoU before in [0,1]')
  assert.ok(e.scoreAfter >= 0 && e.scoreAfter <= 1, 'IoU after in [0,1]')
  assert.equal(typeof e.accepted, 'boolean', 'the accept-gate ran on real scores')
})
