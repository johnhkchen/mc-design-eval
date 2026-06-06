// T-046-01 live proof — the LLM form-edit route drives the REAL ReviseRegion model call through the
// UNMODIFIED reviseLoop (optional, GL-gated + metered). Mirrors revise-loop.live.test.mjs.
//
// The CAGE and the editor's pure heart (op application, bounds, AJV, router, keep/roll-back) are proven
// with no GL/SDK in src/revise/form-edit.test.mjs. This one test proves the live seam actually wires end
// to end: observeRegion renders a region crop → defaultProposeEdit spawns the baml-revise.mts bridge →
// claude -p (subscription) returns a bounded edit → applied under the lock + AJV → liveFormScore renders
// + scores it → the accept-gate keeps/rolls it back. Skips (with the captured reason) when headless GL is
// unavailable OR no subscription is reachable; NOT part of `npm test`. Metered: one ReviseRegion call.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOI_DIR = '../../benchmarks/sculpture/runs/009-vConcept-a-koi-fish'
const koiArtifact = () =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`${KOI_DIR}/artifact.json`, import.meta.url)), 'utf8'))
const conceptPath = () => fileURLToPath(new URL(`${KOI_DIR}/concept.png`, import.meta.url))

test('form-edit: one live ReviseRegion round-trip runs through the loop on the koi', async (t) => {
  const { GL_AVAILABLE, GL_LOAD_ERROR } = await import('../src/render-tool.mjs')
  if (!GL_AVAILABLE) {
    t.skip('headless GL unavailable: ' + (GL_LOAD_ERROR && GL_LOAD_ERROR.message))
    return
  }
  const { reviseLoop, liveFormScore } = await import('../../src/revise/loop.mjs')
  const { observeRegion } = await import('../../src/revise/region.mjs')
  const { makeFormEditor } = await import('../../src/revise/form-edit.mjs')

  const koi = koiArtifact()
  // The koi's body region (the S-curve that flattens). Force a FORM route so the LLM editor runs (the
  // model-free proceduralDiagnose would otherwise route flat→relief/material, never to the LLM).
  const editor = makeFormEditor({
    critic: () => [{ defect: 'ringing', where: 'the swimming body', route: 'curve' }],
  })

  let proposeError = null
  let out
  try {
    out = await reviseLoop(koi, {
      regions: [{ bbox: { min: [-9, 1, -5], max: [2, 6, 5] } }],
      observe: (a, R) => observeRegion(a, R, { outPath: join(tmpdir(), `form-edit-crop-${Date.now()}.png`) }),
      diagnose: editor.diagnose,
      tweakFor: editor.tweakFor,
      score: liveFormScore({ conceptPath: conceptPath() }),
      budget: { maxIterations: 4, perRegion: 1 },
    })
  } catch (e) {
    proposeError = e
  }
  if (proposeError && /claude|subscription|baml|launch|spawn|logged in/i.test(proposeError.message)) {
    t.skip('no subscription/BAML reachable: ' + proposeError.message)
    return
  }
  assert.equal(proposeError, null, 'the live round-trip completed without an unexpected error')

  assert.equal(out.schema, 'revise-loop/v1')
  assert.equal(out.trace.length, 1, 'one region, one attempt → one trace entry')
  const e = out.trace[0]
  assert.equal(e.route, 'llm-edit', 'the form defect routed to the LLM editor')
  assert.equal(typeof e.scoreBefore, 'number', 'the live render produced a numeric before-score')
  assert.equal(typeof e.scoreAfter, 'number', 'and a numeric after-score (the LLM edit was scored)')
  assert.ok(e.scoreBefore >= 0 && e.scoreBefore <= 1, 'IoU before in [0,1]')
  assert.ok(e.scoreAfter >= 0 && e.scoreAfter <= 1, 'IoU after in [0,1]')
  assert.equal(typeof e.accepted, 'boolean', 'the accept-gate ran on real scores')
})
