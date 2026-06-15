# T-029-01 — Review: sculptor consolidation

Handoff for the terminal E-11 link. This is a **consolidation**: it wires the five existing sculptor
modules into one demonstrated loop, proves the form boundary, and writes the journal. No new design
capability; no existing module's behavior changed.

## What changed

**New:**
- `src/sculptor/staged-loop.mjs` (~110 lines) — the wired loop. `stagedSculpt(source, intent)` sequences
  `mass → material → relief` (pure: no render, no model) and returns the relief-locked state, its
  `reliefMetrics`, and the massing-only `baseline`. `lessFlat(baseline, metrics)` names the verdict.
  `runStagedLoop(source, opts)` adds `compileRelief` + the diagnostic critic (`reviewBuildState`, with
  render/diagnose injectable). Imports **only** the spine + passes — no concept-grid module.
- `src/sculptor/staged-loop.test.mjs` (7 tests, AC #1) — lock chain + order; the less-flat metric; the
  AJV gate on the composed artifact; the stubbed-critic routing (`flat → relief`, clean `→ []`); the
  gridless-source drop-in; and a **GL-gated live render** of the composed artifact.
- `src/sculptor/reuse-boundary.test.mjs` (4 tests, AC #2) — static import scan (no concept-grid import in
  the middle/review/spine), the color-engine boundary, `conceptGridSource` as the sole grid reader, and a
  functional gridless-`MassingSource` proof.

**Modified (additive only):**
- `src/sculptor/index.mjs` — export `stagedSculpt, runStagedLoop, lessFlat` (single import site preserved).
- `src/sculptor/README.md` — a "The full loop (T-029)" bullet + the `MassingSource`-only boundary line.
- `docs/knowledge/design-learnings.md` — the `## E-11 — staged-sculptor consolidation` section (AC #3).

**Unchanged:** `build-state`, `orchestrator`, `compile`, `massing`, `material`, `relief`, `review` — public
signatures untouched, as the consolidation invariant requires.

Committed: `ac2636d` (feat + tests + journal + README).

## Acceptance criteria

- **AC #1 — end-to-end run, valid artifact, renders, measurably less flat, diagnosis recorded.** ✅
  `runStagedLoop` runs massing→material→relief→critic on a 4×5 facade (18 occupied cells). The composed
  build compiles to a **valid `DesignArtifact`** (live AJV gate, 3-block manifest, voxels at z=−1 and z=+1)
  and **renders** to a valid PNG (GL-gated, ran here). **Less flat (cited metric `reliefMetrics`):** baseline
  `coverage 0 / variance 0 / range 0` → composed `coverage 0.17 / variance 0.16 / range 2`. **Critic
  diagnosis recorded:** `flat` on the textured+relieved facade routes to `relief`; a clean render → `[]`.
- **AC #2 — no concept-grid import; `MassingSource` only; GLB drop-in.** ✅ `reuse-boundary.test.mjs`
  statically asserts the middle/review/spine import no `image-grid` / `palette-extract` / `nano-banana` /
  `expand` / `briefs` module, that `conceptGridSource` (massing.mjs) is the only grid-shape reader, and
  functionally runs a gridless `MassingSource` through the entire loop to a valid artifact.
- **AC #3 — staged-sculptor journal section.** ✅ Added to `design-learnings.md`: the spine + lock chain
  (P14 cure), the two seed passes, the less-flat result with the actual numbers, the recorded diagnosis, and
  the input-agnostic / GLB-reuse statement.
- **AC #4 — `npm test` green.** ✅ **302/302** (was 291 after T-028/T-032; +11 = 7 + 4 new tests).

## Test coverage

- **Pure, always-run (load-bearing):** the lock chain & order, the less-flat metric (baseline vs composed),
  the AJV round-trip, the stubbed-critic routing, the gridless drop-in, and the static import scan. These
  carry every AC's substance and need no GPU/model.
- **GL-gated (run here, self-skips headless):** the live render of the composed artifact — AC #1's "renders".
- **Coverage gaps (intentional):**
  - The **live BAML categorical judge** (`defaultDiagnose`) is not exercised by `npm test` — it is metered,
    non-deterministic, and slow. The wiring defaults to it (`runStagedLoop` → `defaultDiagnose`); the suite
    stubs `diagnose`. This matches T-026's explicit "live path demonstrated in consolidation" design — but
    "demonstrated" here means the *render* is live and the *routing* is exercised with a representative stub,
    not that the model judge ran in CI. A human wanting the full live loop runs `runStagedLoop` with no
    `diagnose` override (costs metered tokens).
  - The journal's numbers come from the deterministic in-suite `tinyGrid` fixture, not a live concept-image
    run — the honest, reproducible signal for an automated suite.

## Open concerns / notes for a reviewer

- **None blocking.** The consolidation found no gap in any sibling pass — each round-trips through the AJV
  gate as built, so no spine module needed a change (the predicted outcome).
- **The GLB drop-in is proven structurally, not yet end-to-end with a real GLB.** `MassingSource` is the only
  seam and the boundary test enforces it, but E-09's GLB voxelizer does not exist yet — when it lands, it
  emits the `{width, height, occupied()}` contract and the boundary test guarantees the middle/review stay
  unchanged. The claim is "drop-in by construction + enforced boundary", not "a GLB was run".
- **`render/out/test-staged-loop.png`** is written by the GL-gated test under the gitignored `render/out/` —
  not committed, regenerated on each GL run.
- The critic's `flat→relief` vs `flat→material` disambiguation is state-driven and unit-tested in
  `review.test.mjs`; the consolidation exercises the `relief` branch (textured+relieved build). The
  `material` branch (un-textured build) is covered there, not re-asserted here.

## Verification commands

```
node --test src/sculptor/staged-loop.test.mjs      # AC #1 (incl. live GL render)
node --test src/sculptor/reuse-boundary.test.mjs   # AC #2
npm test                                            # AC #4 — 302/302
```

E-11's staged-sculptor framework is complete: a locked, additive, input-agnostic loop that takes a form to a
measurably-less-flat, valid, renderable build and routes its own critique back to the responsible pass.
