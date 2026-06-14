# T-152-01 — Research: render-every-loop

Epic **E-36** (de-freeze the creation loop) / Story **S-152**. Descriptive map of the render
seam, the judge-free chain points that currently defer or swallow the render, the "beside-concept"
composition pieces, and the GL-probe situation. No solutions here — that is Design.

## The ask (restated from the ticket)

1. **Auto render-beside-concept every creation run** — each judge-free pass emits a *textured*
   render placed *beside the concept*, reusing `--skip-gate` + the diff/sheet path, written to
   `pr/assets/`. No judge spawn, no billed run.
2. **"No GL" is a hard, surfaced failure** — checked at the *top* of any render-bearing run, named
   error + remedy; never a silent defer to a runbook.
3. **Environment fix** — diagnose why the agent env reported no GL when the host has it; record root
   cause + fix.
4. **Prove on the barn** — re-render barn (T-150-01 gable/overhang fix live) through the de-frozen
   judge-free path; commit a sheet beside the concept to `pr/assets/`; honest caption.
5. No judge run anywhere; `npm test` green; no new ceremony (E-36 Rule 2).

## The render seam (how a textured PNG is made)

- **`render/src/headless-canvas.mjs`** — the ONLY file that knows how a headless WebGL surface is
  obtained (`canvas@3` + `gl@8`, replicating the `node-canvas-webgl` trick). At import it runs a
  one-shot probe `createGLContext(1,1)`; on failure sets the exported **`GL_AVAILABLE = false`** and
  **`GL_LOAD_ERROR`**. This is the *authoritative* probe.
- **`render/src/render.mjs`** — `renderWorldToPng(world, center, opts)` and `renderBuild`. **Already
  hard-fails** at the bottom: `if (!GL_AVAILABLE) throw new Error('headless GL unavailable: ' + …)`
  (line 53). Re-exports `GL_AVAILABLE`, `GL_LOAD_ERROR`. Fixed render contract (512², SSAA×3,
  framed camera).
- **`render/src/render-tool.mjs`** — `renderArtifact(artifact, opts)`; re-exports the GL flags.
- **`src/view/multi-angle.mjs`** — `renderViews(artifact, angles, {outDir, label})` → one
  `renderArtifact` per azimuth. The shared "render the 4 gate azimuths" entry. Throws on unknown
  angle; otherwise propagates the render's GL throw.

So the low-level render is *already* a hard fail. **The defects are entirely in the callers** that
wrap it in best-effort `try/catch` or skip it under `--skip-gate`.

## The judge-free chain points (where the render is deferred / swallowed today)

1. **`benchmarks/sculpture/generated-milestone.mjs`** — the generate/chain runner (`generated:<subj>`).
   - `--skip-gate` (lines 555–559): persists chain artifacts (grammar/final at 548–549) then
     **returns before any render**. The cheap, judge-free path emits **no render at all** — this is
     the central gap. The textured `renderSheet` (line 564) lives only on the *gated* path, after
     `spawnGate`.
   - `renderSheet` (line 564) is wrapped in a `try/catch` that swallows GL errors into
     `sheets = { error }` — evidence, never surfaced loudly.
2. **`benchmarks/sculpture/challenge-milestone.mjs`** — `tryRenderAngle` (lines 119–127): the exact
   "silent defer" shape — `try { renderViews … } catch (e) { return { angle, error: e.message } }`.
   The record's md then prints "GL unavailable (…)". This is what let two loops "build machinery and
   never look."
3. **`benchmarks/sculpture/roof-diff.mjs`** — renders 4-azimuth *overlay* sheets **without GL** (a
   pure rasterizer is the lens) and commits `pr/assets/frames/roof-diff-<subj>-<path>.png`. This is
   the existing *beside* path the ticket names — but it is a region-diff overlay, **not** a textured
   render, and not beside the concept image.

## The "beside-concept" composition pieces (all already exist)

- **`renderSheet(artifact, label, subjDir)`** in `benchmarks/sculpture/placement-grammar.mjs:216` —
  renders the 4 gate azimuths via `renderViews`, resamples each to `RESEMBLANCE_DEFAULTS.panel`
  (512²) via `resampleRgba(img, P, P, "aspect")`, composes a 4-panel sheet via `composeSheet`,
  writes `<label>-sheet.png`. The shared evidence helper (workshop before/after reuse it).
- **`src/form/resemblance.mjs`** — `composeSheet(panels, {gutter})` lays equal-size panels left→right
  with a 40-grey separator (requires all panels share dims); `resampleRgba(img, W, H, "aspect")`
  fits any image into a square panel; `RESEMBLANCE_DEFAULTS = { panel: 512, gutter: 8 }`.
- **`src/color/palette-extract.mjs`** — `decodeImage(path)` → `{ data, width, height }` RGBA; loads
  the committed concept PNG.
- **`render/src/headless-canvas.mjs`** — `encodeRgbaToPng(data, w, h)` to write the sheet.
- The concept image is committed per subject in the registry: `SUBJECTS[<key>].concept`
  (barn → `runs/017-…-tithe-barn…/concept.png`, present, 692 KB).

**Composition recipe (latent in the codebase):** decode the concept → `resampleRgba` to a 512²
panel → prepend to the 4 render panels → `composeSheet` → `encodeRgbaToPng` → `pr/assets/`. Nothing
new is invented; the parts are wired the same way `renderSheet` already wires the 4 panels.

## The GL-probe situation (AC2 + AC3 root cause — verified live this session)

- Authoritative probe `GL_AVAILABLE` (imported from `render/src/render.mjs`): **`true`**,
  `GL_LOAD_ERROR: null`. The native module is built at
  `render/node_modules/gl/build/Release/webgl.node`.
- **`gl` is a dependency of the nested `render/` npm project, not the repo root.** Verified:
  - `require('gl')` **from the repo root → `MODULE_NOT_FOUND`** (false negative).
  - `require('gl')` resolved **from `render/src/` → resolves**.
  - `render/package.json` lists `gl`, `canvas`, `prismarine-viewer`, … as its own deps.
- **Root cause of "GL absent" in the prior loops:** a probe run from the repo cwd
  (`require('gl')` / `node -e` checking root `node_modules/gl`; cf. session obs "headless-gl
  MODULE_NOT_FOUND") resolves against the *root* project where `gl` is absent, and falsely concludes
  no GL. The env always had GL. The fix is to make every render-bearing run consult the *one
  authoritative probe* (the render module's `GL_AVAILABLE`) and never a hand-rolled root require —
  and to fail loudly with the remedy if it is genuinely false.

## The barn proof inputs (AC4)

- `benchmarks/sculpture/generated/barn/artifact.json` — regenerated 10:22 today with the T-150-01
  gable-end-as-wall + overhang fix (1.2 MB, ~7125 blocks). Already on disk, committed-as-draft.
- Concept: the barn registry `concept` path (present).
- Prior flat-barn evidence for the before/after story: `pr/assets/frames/roof-diff-barn-generated.png`
  (regenerated 10:23, 3124 px mismatch, 33.9 % roof share) and `multi-angle-barn-*` sheets.
- **Pin-guard caveat:** the `--skip-gate` chain *writes* `generated/barn/{grammar,artifact}.json`
  (lines 548–549) before its early return; those are pinned (E-36 evidence #1) → `PinGuardError`.
  Narrowing that guard is **S-151's** job, not this ticket. The barn proof can render *from the
  already-committed* `generated/barn/artifact.json* (no chain, no pin write), keeping S-152 a
  disjoint seam.

## The workshop loop (already renders — not a defect site)

- `src/workshop/loop.mjs` — pure control flow over injected seams; `render` arrives injected
  (line 107–116). `benchmarks/sculpture/workshop.mjs:209` and `geometry-levers.mjs:236` inject a
  `render` that calls `renderViews` **every round** and feeds the image to the model. The workshop
  path does **not** defer the render. So "every creation run" = the generate/chain runners
  (`generated`, `challenge`) are the gap; the workshop already looks. The concept is loaded there
  too (`conceptBuf`), so a beside-concept sheet is a natural reuse if desired, but the in-scope gap
  is the chain runners' judge-free path.

## Constraints / assumptions surfaced

- **E-36 Rule 2 — no new ceremony.** Favor a small shared helper + a few call-site wires over a new
  gate. Reuse `renderViews` / `composeSheet` / `decodeImage`, not a parallel render path.
- **Tests must not require GL.** Root `npm test` runs where GL may be absent; the GL-using helper
  must be testable through an *injected render seam* (the workshop pattern), and the GL-assert must
  be unit-testable by passing the flag in.
- **No judge anywhere** — reuse the `--skip-gate` / `renderViews` paths; never `spawnGate`.
- **Reproducibility-by-replay of committed measurements is untouched** — renders are a lens, never an
  input to a committed verdict (challenge-milestone already states this).
</content>
