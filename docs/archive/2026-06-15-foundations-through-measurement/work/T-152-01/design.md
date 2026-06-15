# T-152-01 — Design: render-every-loop

Decisions for the four ACs, grounded in Research. The codebase already owns every primitive; the
work is *wiring* + *one hard-fail guard* + *diagnosis*, not a new render path (E-36 Rule 2).

## Decision 1 — One authoritative GL assert, surfaced loudly

**Chosen.** A tiny exported guard `assertGlAvailable()` that imports the *authoritative*
`GL_AVAILABLE` / `GL_LOAD_ERROR` from the render module and, when false, throws a **named
`GlUnavailableError`** carrying the underlying load error **and the remedy** (build `gl` in
`render/`; check you are consulting the render module's probe, not a root `require('gl')`). Called at
the **top of every render-bearing run** before any expensive work.

- *Why named + remedy:* AC2 demands "a named error (and the remedy)". A bare throw from deep in
  `renderWorldToPng` is generic and easy to swallow; a top-of-run `GlUnavailableError` cannot be
  mistaken for a chain failure (E-36 evidence: a swallowed pin refusal masqueraded as a record-write
  error — same anti-pattern, surfaced here instead of hidden).
- *Why a separate guard, not just the existing throw in `renderWorldToPng`:* the existing throw fires
  *late* (after the chain ran) and the callers `try/catch` it into evidence. The guard fires *early*
  and is the thing call-sites are told to call, replacing the swallow.

**Rejected — rely on `renderWorldToPng`'s existing throw.** It is late, generic, and is exactly what
today's `try/catch` swallows. Keeping only that throw fails AC2's "checked at the top … named error".

**Rejected — a Playwright/Chromium fallback to *obtain* GL.** Out of scope: GL is already available
(Decision 3). Adding a second render backend is the heavy ceremony E-36 forbids. The seam in
`headless-canvas.mjs` documents that path for a real GL-less host; we do not need it.

## Decision 2 — A shared `renderBesideConcept` helper + a thin CLI

**Chosen.** New module `benchmarks/sculpture/render-beside.mjs` exporting:

- `assertGlAvailable(flags?)` — Decision 1's guard. `flags` injectable (`{ GL_AVAILABLE,
  GL_LOAD_ERROR }`) so unit tests exercise both branches without a GPU; defaults to the real import.
- `composeBesideConcept({ conceptPanel, renderPanels, gutter })` — **pure** RGBA composition: the
  concept panel prepended to the render panels via `composeSheet`. No GL, no I/O → unit-testable.
- `renderBesideConcept(artifact, conceptPath, outPath, { label, renderSeam })` — the integrated
  path: assert GL → render the 4 gate azimuths (default seam = `renderViews`) → resample each +
  the decoded concept to `RESEMBLANCE_DEFAULTS.panel` → `composeBesideConcept` → `encodeRgbaToPng`
  → write `outPath`. `renderSeam` is injectable (workshop pattern) so tests pass a fake.
- A thin CLI: `node render-beside.mjs --subject <key> [--out <path>]` → loads the committed artifact
  + concept from the `durable-skin` `SUBJECTS` registry, writes
  `pr/assets/frames/beside-concept-<key>.png`. Judge-free, no chain, no pin write — the standalone
  proof path (AC4) and a reusable command.

- *Why a new file, not extend `placement-grammar.mjs`:* `renderSheet` there is the 4-panel sheet;
  beside-concept is a distinct concern (concept I/O + the GL assert) used by *multiple* runners
  (generated, and the standalone proof). A small dedicated module keeps the wiring obvious and gives
  a clean unit-test target. It is *one* file, not a subsystem — within Rule 2.
- *Why reuse `renderViews` as the default seam:* it is the existing "4 gate azimuths" textured-render
  entry; no parallel render path is introduced.
- *Why inject the render seam:* root `npm test` may run GL-less; the pure composition + the assert
  are the only testable units, and the workshop already proves injection is the project idiom.

**Rejected — reuse `roof-diff`'s pure-rasterizer sheet as "the render".** It is a region-diff
overlay, not a *textured* render, and not beside the *concept*. AC1 says "judge-free **textured**
render placed **beside the concept**" — the overlay fails both words.

**Rejected — fold concept-beside into `renderSheet`.** Would change a widely-reused helper's output
shape (it is consumed by workshop before/after sheets and the gated generated path), rippling into
committed records. Additive new helper is lower blast-radius.

## Decision 3 — Environment fix = consult the one authoritative probe (no binary to install)

**Chosen.** Record the verified root cause: `gl` lives in the **nested `render/` project**, so a probe
from the repo root (`require('gl')`) returns `MODULE_NOT_FOUND` — a *false negative*. GL was always
available (`render/src` `GL_AVAILABLE: true`; `webgl.node` built). The "fix" is therefore **process,
not packaging**: every render-bearing run consults `GL_AVAILABLE` *imported from the render module*
(which resolves `gl` correctly), never a hand-rolled root require; `assertGlAvailable` *is* that
single consultation point. The remedy string in the error names the rebuild command for the genuine
GL-less case.

- *Why not add `gl` to the root `package.json`:* it would duplicate a heavy native dep across two
  projects (cf. memory: parallel roots duplicate shared deps), and does not address the real
  defect — the *wrong probe*. The render module is the seam that owns GL; the root must defer to it.

**Rejected — a `predev`/postinstall that rebuilds `gl` at root.** Solves a non-problem (the binary
is built) and adds install ceremony.

## Decision 4 — Wire the auto-render into the generate chain's judge-free path

**Chosen.** In `generated-milestone.mjs`, the `--skip-gate` branch (the judge-free creation pass)
calls `assertGlAvailable()` then `renderBesideConcept(r1.styled, def.concept, <pr/assets path>)`
*before* its early return — so the cheap path now **always** emits a textured render beside the
concept. Replace the gated path's swallowing `try/catch` around `renderSheet` so a GL failure is the
named error, not silent `sheets={error}` (the surface-loudly rule), while keeping the sheet on the
record. The challenge runner's `tryRenderAngle` swallow is narrowed the same way: assert GL at the
top of the render block so the first failure is loud (a follow-the-pattern change, kept minimal).

- *Scope guard:* the `--skip-gate` chain *writes* the pinned `generated/<subj>/{grammar,artifact}.json`
  *before* the early return, so on a *pinned* subject it throws `PinGuardError` (S-151's seam). The
  **barn proof renders from the already-committed artifact via the standalone CLI** — no chain, no
  pin write — keeping S-152 disjoint from S-151. The skip-gate wiring is still landed (it is the
  durable "render every loop" hook for unpinned/future runs and post-S-151 runs); the proof simply
  does not depend on un-pinning.

**Rejected — make the barn proof re-run the full `generated:barn` chain.** Blocks on the pin-guard
that S-151 owns; would couple two independent stories and tempt a `--rotate-pins` judge-touching run.
Rendering the committed draft artifact proves the de-frozen *render* path without entangling pins.

## Decision 5 — Honest barn caption (AC4)

The committed barn build is rough. The sheet's caption (in the work-dir note / commit message) names
what reads right (stone gable end, overhanging roof per T-150-01) **and** what still reads wrong
(coarse fills, timber doors not yet legible, proportions). This is creation feedback, not a verdict
(no judge). Memory: *glance beats gate* — the sheet is the glance.

## Test strategy (Plan expands)

- Unit: `assertGlAvailable` throws `GlUnavailableError` (named, remedy in message) when
  `{GL_AVAILABLE:false}` injected; passes when true. `composeBesideConcept` places the concept panel
  first and yields `panels.length+1` columns at the right total width (pure, no GL).
- Unit: `renderBesideConcept` with a **fake render seam** (returns canned panel paths/buffers) writes
  a sheet without touching GL — proves injection + the I/O wiring.
- Live (GL-gated, skip when absent): render the barn beside concept end-to-end; assert the PNG
  exists and is non-trivial. Mirrors the existing `GL_AVAILABLE` skip idiom in `render/test/*`.
- `npm test` green; no judge spawned anywhere.
</content>
