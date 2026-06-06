// T-044-01 live proof — observeRegion crops a section of a committed sculpture (AC #4).
//
// GL-gated, mirroring render-tool.test.mjs: the crop render needs a GPU, so these tests skip (with the
// captured reason) when headless GL is unavailable. This is the ONE live render for the ticket — the
// region addressing + lock are proven purely in src/revise/region.test.mjs (no GL). Here we prove the
// observe path end-to-end: select a region of the committed koi sculpture, render a TIGHT CROP framed on
// its sub-bounds (framedCamera, via render.mjs's opts.bounds), and assert a correct, tighter-than-whole PNG.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

// The committed sculpture named in the ticket (render/ → repo root).
function koiArtifact () {
  const p = fileURLToPath(new URL('../../benchmarks/sculpture/runs/009-vConcept-a-koi-fish/artifact.json', import.meta.url))
  return JSON.parse(readFileSync(p, 'utf8'))
}

const out = (n) => fileURLToPath(new URL(`../out/observe-${n}.png`, import.meta.url))

test('observeRegion: a tight crop on the koi head end renders to a correct PNG (AC #3, #4)', async (t) => {
  const { GL_AVAILABLE, GL_LOAD_ERROR } = await import('../src/render-tool.mjs')
  if (!GL_AVAILABLE) {
    t.skip('headless GL unavailable: ' + (GL_LOAD_ERROR && GL_LOAD_ERROR.message))
    return
  }
  const { selectRegion, observeRegion, subBoundsOf } = await import('../../src/revise/region.mjs')

  const koi = koiArtifact()
  // The head/eye end of the koi sits at min-x — select it as an explicit bbox.
  const R = selectRegion(koi, { bbox: { min: [-15, 2, -13], max: [-8, 13, 3] } })
  assert.ok(R.placements.length > 0, 'the head-end region selects ≥1 placement')

  const report = await observeRegion(koi, R, { outPath: out('koi-head') })

  assert.equal(report.path, out('koi-head'), 'returns the written crop path')
  assert.ok(existsSync(report.path), 'the crop PNG exists on disk')
  const buf = readFileSync(report.path)
  assert.ok(buf.subarray(0, 8).equals(PNG_SIG), 'valid PNG signature')
  assert.ok(report.bytes > 2000, `non-trivial crop PNG (got ${report.bytes} bytes)`)
  assert.deepEqual(report.bounds, subBoundsOf(R), 'framed on R sub-bounds')
})

test('observeRegion: the crop frames TIGHTER than the whole build (smaller sphere radius)', async (t) => {
  const { GL_AVAILABLE, GL_LOAD_ERROR } = await import('../src/render-tool.mjs')
  if (!GL_AVAILABLE) {
    t.skip('headless GL unavailable: ' + (GL_LOAD_ERROR && GL_LOAD_ERROR.message))
    return
  }
  const { selectRegion, observeRegion } = await import('../../src/revise/region.mjs')
  const { boundingSphere } = await import('../src/camera.mjs')
  const { artifactBounds } = await import('../../src/revise/region.mjs')

  const koi = koiArtifact()
  const R = selectRegion(koi, { part: 'top' })
  await observeRegion(koi, R, { outPath: out('koi-top') })

  // The crop's framing sphere (on R) must be smaller than the whole build's — that is what makes it a crop.
  const cropR = boundingSphere(R.subBounds).radius
  const wholeR = boundingSphere(artifactBounds(koi)).radius
  assert.ok(cropR < wholeR, `crop radius ${cropR.toFixed(2)} < whole-build radius ${wholeR.toFixed(2)}`)
})
