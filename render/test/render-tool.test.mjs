// T-003-04 verification — the construct+render composition core (renderArtifact).
//
// GL-gated, mirroring view.test.mjs / scaffold.test.mjs: the actual render needs a GPU,
// so these tests skip (with the captured reason) when headless GL is unavailable. They
// prove the end-to-end seam — a real schema-valid artifact in, a correct PNG out (AC #4)
// — and that sequential renders share no state (AC #2).

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

// The shipped, schema-valid sample artifact (industrial house) — the canonical AC #4
// subject. Read from the top-level package via a relative URL (render/ → repo root).
function sampleArtifact () {
  const p = fileURLToPath(new URL('../../schema/examples/valid-industrial-house.json', import.meta.url))
  return JSON.parse(readFileSync(p, 'utf8'))
}

// A minimal one-block artifact, distinct from the sample, for the no-bleed check.
// Schema-valid placements use the same primitive shape the sample uses (op:'fill').
function oneBlockArtifact () {
  const a = sampleArtifact()
  return {
    ...a,
    metadata: { ...a.metadata, trial_id: 'one-block-probe' },
    placements: [{ op: 'fill', from: [0, 0, 0], to: [0, 0, 0], block: 'minecraft:stone' }]
  }
}

const out = (n) => fileURLToPath(new URL(`../out/test-tool-${n}.png`, import.meta.url))

test('renderArtifact: the sample artifact renders to a correct PNG (AC #1, #4)', async (t) => {
  const { GL_AVAILABLE, GL_LOAD_ERROR } = await import('../src/render-tool.mjs')
  if (!GL_AVAILABLE) {
    t.skip('headless GL unavailable: ' + (GL_LOAD_ERROR && GL_LOAD_ERROR.message))
    return
  }
  const { renderArtifact } = await import('../src/render-tool.mjs')

  const report = await renderArtifact(sampleArtifact(), { outPath: out('sample') })

  assert.equal(report.path, out('sample'), 'returns the written path (AC #1)')
  assert.ok(existsSync(report.path), 'the PNG exists on disk')
  const buf = readFileSync(report.path)
  assert.ok(buf.subarray(0, 8).equals(PNG_SIG), 'valid PNG signature (AC #4)')
  assert.ok(report.bytes > 2000, `non-trivial PNG (got ${report.bytes} bytes)`)
  assert.ok(report.placed > 0, `blocks were placed (got ${report.placed})`)
  assert.equal(report.unmapped.length, 0, 'the sample is fully mappable (no skipped blocks)')
  assert.ok(report.bounds, 'a non-empty build has bounds')
})

test('renderArtifact: sequential renders share no state (AC #2)', async (t) => {
  const { GL_AVAILABLE, GL_LOAD_ERROR } = await import('../src/render-tool.mjs')
  if (!GL_AVAILABLE) {
    t.skip('headless GL unavailable: ' + (GL_LOAD_ERROR && GL_LOAD_ERROR.message))
    return
  }
  const { renderArtifact } = await import('../src/render-tool.mjs')

  const a = await renderArtifact(sampleArtifact(), { outPath: out('seq-a') })
  const b = await renderArtifact(oneBlockArtifact(), { outPath: out('seq-b') })

  assert.notEqual(a.path, b.path, 'distinct output paths')
  // The fresh-world-per-call guarantee: the one-block render reflects ONLY its own
  // artifact (placed === 1), unaffected by the larger build rendered just before it.
  assert.equal(b.placed, 1, `one-block artifact places exactly one block (got ${b.placed})`)
  assert.ok(a.placed > 1, `the sample places many blocks (got ${a.placed})`)
})
