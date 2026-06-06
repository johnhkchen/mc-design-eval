# T-047-01 — research: GLB seam + the honest form-revision demo

Epic **E-15**, terminal. Two deliverables: (1) a **form-target interface** the revision loop's accept
step consults — concept/heuristic today, a documented GLB adapter point for later, swappable with **no
change** to observe/diagnose/accept; (2) an **honest demo + number** — the full loop on koi + heart,
before/after IoU + a categorical verdict vs the E-13 baseline, with the residual shown not hidden (mirrors
E-14's value-true consolidation). This maps what exists.

## The loop and its accept step (where the target plugs in)

`src/revise/loop.mjs` — `reviseLoop(artifact, opts)` (loop.mjs:61). PURE control flow over injectable
seams; never mutates the input. Per region: select R → (optional `observe`) → `diagnose` → up to
`perRegion` scoped tweaks → **re-score** → **accept-if-strictly-improved** (`after > before + epsilon`,
loop.mjs:127) else roll back → lock R. Three seams keep it deterministic-by-default yet live-capable:
- `score(artifact, R) => number|Promise<number>` — the FORM number. Default `liveFormScore()`.
- `diagnose(artifact, R, observation?)` — default `proceduralDiagnose` (model-free).
- `observe(artifact, R)` — optional live render feeding a model critic; default undefined.

**The accept gate is purely numerical** (loop.mjs:117–137): it compares `scoreBefore` vs `scoreAfter`,
two numbers from `score`. The loop has **no notion of a "target"** — the reference is encapsulated
entirely inside the `score` seam. That is the insertion point: the target lives in `score`, consulted at
accept time, and the loop body stays untouched.

### Where the form target lives today — `liveFormScore`

`liveFormScore(cfg)` (loop.mjs:162) returns `async (artifact, R) => number`:
1. requires `cfg.conceptPath` (throws otherwise, loop.mjs:164);
2. lazy-imports the render + form stack (keeps loop.mjs top-level GL-free — enforced by loop.test group LE);
3. `observeRegion(artifact, R, {outPath, view, width, height})` renders the R-framed crop to a temp PNG;
4. `formFidelityFromPair(outPath, cfg.conceptPath, {grid, fit, region})` → returns `regionIoU` (if
   `cfg.region`) or whole-object `iou` (loop.mjs:180–181).

So **the "form target" today is a concept PNG path** (`cfg.conceptPath`) plus the silhouette-IoU metric.
It is a *string captured in a closure*, not an interface. The whole-object IoU vs the Nano-Banana concept
is the accept signal; a true per-region-vs-region IoU needs a 3-D→2-D projection of the target (deferred).

## The form metric (T-043-01) — the number the target produces

`src/form/form-fidelity.mjs`:
- `formFidelity(renderImg, conceptImg, opts)` (line 244) → `{schema, grid, fit, iou, regionIoU?, render,
  concept}`. `iou` whole-object; `regionIoU` if `opts.region` (a normalized 2-D bbox).
- `formFidelityFromPair(renderPath, conceptPath, opts)` (line 290) — the only async point (decodes two
  PNGs, no GL). `iou(a,b)` (line 178) = |∩|/|∪| over normalized G×G silhouette masks.
- Silhouettes via background segmentation: render sky-blue (`RENDER_BG`), concept black (`CONCEPT_BG`);
  normalize bbox-crop → `fit:"aspect"` (proportion-preserving) into a 128×128 grid.
- Pure (buffers/masks), no GL, no RNG. Imports nothing from the loop.

This module is the *engine* the form-target wraps. A GLB target would feed a **different** target
silhouette into the same `iou()` — the metric is target-source-agnostic.

## The E-13 baseline (the "before") — committed numbers exist

`benchmarks/sculpture/form-baseline.json` (gen `form-baseline.mjs`): whole-object IoU over all 13 E-13
runs. Mean **0.479**. The two ticket subjects:
- **koi** — run `009-vConcept-a-koi-fish`, **IoU 0.481**.
- **heart** — run `006-vConcept-an-anatomically-correct-human-heart`, **IoU 0.347**.

These are T-043-01's baselines and serve as the demo's "before." Their `artifact.json`, `concept.png`,
`render-3q.png` are committed under `benchmarks/sculpture/runs/<run>/`.

## The demo already half-exists — `form-revise-ab` (T-046-01)

`benchmarks/sculpture/form-revise-ab.mjs` runs the loop with the **LLM block-editor** (`makeFormEditor`)
behind the accept-gate over a curated form region of koi + heart, saving before/proposed/after renders
and emitting `form-revise-ab.{json,md}`. **GL + metered** (claude -p), run-on-demand, *not* in `npm test`.
Its committed result (the honest residual already on disk):

| subject | region IoU before | region IoU after | whole before | whole after | proposed whole | kept? |
|---|---:|---:|---:|---:|---:|:--:|
| koi  | 0.455 | 0.455 | 0.481 | 0.481 | 0.481 | ✗ rolled-back |
| heart| 0.384 | 0.379 | 0.347 | 0.347 | 0.345 | ✗ rolled-back |

Both **rolled back**: the LLM edit did not raise the per-region accept signal (heart's *regressed*
0.384→0.379, and its whole IoU *regressed* 0.347→0.345 — the cage correctly refused it). `before.png`
and `after.png` are byte-identical per subject (no change kept); `proposed.png` shows what the model built.
**This is the honest number E-15 lands on**: the gap is measured, the cage refuses to fake an
improvement it can't earn. What's missing for T-047-01: the **form-target interface** wired into this
harness, and a **categorical verdict vs the E-13 baseline**.

## The honesty templates to mirror (E-14)

- `docs/knowledge/design-learnings.md` §E-14 (line 1458): before/after table + "The … close (headline)"
  + "Honest notes — where it *didn't* help, and what it cost" + a one-sentence summary. The categorical
  verdict there is **deterministic**, not a model call: `verdictOf(gateBefore, gateAfter, closure)` in
  `codesign-ab.mjs:41` → `closed | narrowed | already-near-true`. The form analogue is a verdict over
  IoU-vs-baseline, computed offline.
- `pr/assets/value-true.md`: the E-12 beat — number table, the hero before→after pair, an honest caveat
  block, a "Suggested E-12 beat." Frames live in `pr/assets/frames/` (e.g. `value-moai-v1/v2.png`); a
  prior `pair-koi-009.png` / `pair-heart-006.png` already exist.

## Constraints / assumptions surfaced

- **No signature change** to observe/diagnose/accept (AC #1). The target must enter through `score` /
  `liveFormScore(cfg)` config — backward-compatible with every existing caller (`conceptPath` callers in
  the two live tests + the demo harness must keep working unchanged).
- **No GLB / TRELLIS code** (explicitly out of scope) — only a documented adapter point that throws.
- **The live demo is GL + metered.** GL works in this environment (probed: a 1-voxel render succeeded);
  the LLM-edit route needs claude -p. The committed `form-revise-ab.*` numbers are real measured loop
  outputs — the consolidated verdict can be computed **offline** from them + the baseline (no model re-run,
  no fabrication).
- `npm test` runs `src/**/*.test.mjs` (pure, no GL/model). New tests must be pure. Loop pure tests inject
  a synthetic `score`, so they never touch `liveFormScore` — the refactor is safe by construction.
- The whole-object IoU is the only honest accept signal today (region-vs-region needs the 3-D target).
  That tension is exactly what the GLB seam exists to resolve later — worth stating in the interface doc.
