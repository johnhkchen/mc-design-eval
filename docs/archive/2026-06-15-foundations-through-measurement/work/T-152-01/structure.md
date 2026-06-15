# T-152-01 — Structure: render-every-loop

File-level blueprint. The pure/injectable core lives under `src/view/` (so `npm test`'s
`src/**/*.test.mjs` glob covers it); the GL-using CLI runner lives under `benchmarks/sculpture/`
(beside the other milestone runners, not under the test glob). No new ceremony — one core module,
one runner, a handful of call-site wires.

## NEW — `src/view/render-beside.mjs` (the pure/injectable core)

The testable home. Imports the *authoritative* GL flags from the render module and the existing
composition primitives; exposes no GPU dependency in its pure exports.

Exports:

- `class GlUnavailableError extends Error` — `name = 'GlUnavailableError'`; message embeds the
  underlying `GL_LOAD_ERROR.message` (if any) **and the remedy** (consult the render module's probe,
  not a root `require('gl')`; rebuild `gl` in `render/` for a genuine GL-less host). `cause` set to
  the load error.
- `assertGlAvailable(flags)` — `flags` defaults to `{ GL_AVAILABLE, GL_LOAD_ERROR }` imported from
  `../../render/src/render.mjs`. Throws `GlUnavailableError` when `!flags.GL_AVAILABLE`; returns
  `true` otherwise. **The single GL consultation point** (Design 3) — call at the top of any
  render-bearing run.
- `composeBesideConcept({ conceptPanel, renderPanels, gutter })` — **pure** RGBA. Validates every
  panel shares dims, prepends `conceptPanel` to `renderPanels`, returns `composeSheet([concept,
  …renders], { gutter })`. No GL, no I/O.
- `renderBesideConcept(artifact, conceptPath, outPath, opts)` — the integrated path.
  `opts = { label='build', gutter, renderSeam, panel }`.
  1. `assertGlAvailable()` (unless `renderSeam` injected for tests bypasses — see below).
  2. `renderSeam(artifact, azimuths, { outDir })` (default = `renderViews` from `./multi-angle.mjs`,
     lazily imported so the module loads GL-free) → array of `{ angle, path }`.
  3. Decode each render PNG (`decodeImage`) + the concept → `resampleRgba(img, P, P, "aspect")`,
     `P = panel ?? RESEMBLANCE_DEFAULTS.panel`.
  4. `composeBesideConcept` → `encodeRgbaToPng` → `writeFile(outPath)`.
  5. Returns `{ outPath, panels: renders.length + 1, conceptPath }`.

Imports: `composeSheet`, `resampleRgba`, `RESEMBLANCE_DEFAULTS` from `../form/resemblance.mjs`;
`decodeImage` from `../color/palette-extract.mjs`; `encodeRgbaToPng` from
`../../render/src/headless-canvas.mjs`; `GL_AVAILABLE`, `GL_LOAD_ERROR` from
`../../render/src/render.mjs`; `renderViews` (lazy) from `./multi-angle.mjs`; `MULTI_ANGLE_GATE`
from `../config.mjs`. Mirrors `multi-angle.mjs`'s existing render-module import.

## NEW — `src/view/render-beside.test.mjs` (unit, GL-free)

Covered by `npm test`. Cases:

1. `assertGlAvailable({ GL_AVAILABLE: false, GL_LOAD_ERROR: new Error('no GPU') })` throws
   `GlUnavailableError`; `err.name === 'GlUnavailableError'`; message contains the remedy + "no GPU".
2. `assertGlAvailable({ GL_AVAILABLE: true })` returns `true`.
3. `composeBesideConcept` with 1 concept + 4 equal panels → result width
   `= 5*P + 4*gutter`, and the leftmost column pixels equal the concept panel (concept is first).
4. `composeBesideConcept` rejects mismatched panel dims (propagates `composeSheet`'s throw).
5. `renderBesideConcept` with a **fake `renderSeam`** (returns paths to tiny pre-written PNGs in a
   tmp dir) + a tiny concept PNG → writes a sheet of the expected dims; **never imports GL**. (The
   fake seam means `assertGlAvailable` must be skippable when a seam is injected — see Design note;
   implement as: assert only when `renderSeam` is the default real one, OR pass
   `opts.assertGl = false` in the test. Chosen: assert runs always but the test injects
   `opts.glFlags = { GL_AVAILABLE: true }` so no GPU is touched.)

Helper: write small solid-color PNGs via `encodeRgbaToPng` into `os.tmpdir()`; clean up after.

## NEW — `benchmarks/sculpture/render-beside.mjs` (the GL-using CLI runner)

Beside the milestone runners (not under the test glob — it needs GL). Responsibilities:

- Parse `--subject <key>` (required), `--out <path>` (optional; default
  `pr/assets/frames/beside-concept-<key>.png`).
- Resolve the subject from `SUBJECTS` (`./durable-skin.mjs`): the committed build artifact
  (`generated/<key>/artifact.json` when present, else `def.build`) and `def.concept`.
- `assertGlAvailable()` at the top → loud `GlUnavailableError` if the env truly lacks GL.
- `renderBesideConcept(artifact, conceptAbs, outAbs, { label: key })` (default real `renderViews`
  seam) → write the sheet, log the path + a one-line honest note.
- **Judge-free, no chain, no pin write** — reads the already-committed draft artifact.

Registry boilerplate (`ROOT`/`HERE`/`OUT_DIR`, `fileURLToPath`) copied from the sibling runners.

## NEW — package.json script

- `"render:beside": "node benchmarks/sculpture/render-beside.mjs"` — so `npm run render:beside --
  --subject barn` is the documented one-command judge-free render-beside-concept. (One line; the
  ticket's "reuse `--skip-gate` + the diff/sheet path" is honored by reusing `renderViews`; this
  command is the standalone entry the auto-wire also calls.)

## MODIFIED — `benchmarks/sculpture/generated-milestone.mjs`

- Import `assertGlAvailable`, `renderBesideConcept` from `../../src/view/render-beside.mjs`.
- `--skip-gate` branch (≈ lines 555–559): **before the early return**, call `assertGlAvailable()`
  then `renderBesideConcept(r1.styled, def.concept, join(FRAMES_DIR,
  `beside-concept-${def.key}.png`), { label: def.key })`. This makes the judge-free pass emit the
  textured render beside the concept — the AC1 "every creation run" hook for this runner. Log it.
  (Pinned subjects still throw earlier at the artifact persist — S-151's seam; the wire is correct
  and durable for unpinned/post-S-151 runs.)
- Gated path (≈ line 562–568): replace the silent `try/catch { sheets = { error } }` so a GL failure
  raises the named `GlUnavailableError` (surface loudly, AC2) rather than burying it in the record.
  Keep the successful-sheet recording unchanged.

## MODIFIED — `benchmarks/sculpture/challenge-milestone.mjs`

- At the top of the render block (before the `tryRenderAngle` calls, ≈ line 477), call
  `assertGlAvailable()` once so the *first* GL failure is the loud named error, not N swallowed
  per-angle `{ error }` records. Leave `tryRenderAngle`'s per-angle try/catch for genuinely
  per-angle issues, but GL-absence now fails fast and loud. Minimal, follows the pattern.

## NEW — `pr/assets/frames/beside-concept-barn.png` (the AC4 proof, committed)

Produced by `npm run render:beside -- --subject barn` from the committed
`generated/barn/artifact.json` (T-150-01 fix live) beside the barn concept. Committed binary.

## Ordering of changes

1. `src/view/render-beside.mjs` + test (pure core; `npm test` green first).
2. `package.json` script.
3. CLI runner `benchmarks/sculpture/render-beside.mjs`.
4. Generate the barn proof sheet (run the CLI; GL live here).
5. Wire `generated-milestone.mjs` + `challenge-milestone.mjs` (syntax-check; they need GL/chain to
   fully run, so verify by `node --check` + a dry import, not a full live chain).
6. Re-run `npm test`; commit.

## Out of scope (named, per Design)

- Pin-guard narrowing (S-151) — the barn proof avoids it by rendering the committed artifact.
- Glance-vs-concept gate semantics (S-153).
- A Playwright/Chromium GL backend — unneeded; GL is present.
- Workshop loop — already renders every round; not a defect site.
</content>
