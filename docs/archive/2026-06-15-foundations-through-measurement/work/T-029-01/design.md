# T-029-01 — Design: sculptor consolidation

Decisions for wiring the full staged loop, proving the form boundary, and recording the result. Grounded
in research.md: the six modules exist and are tested; this phase decides *how they compose into one
demonstrated loop* and *how the boundary is enforced*, not new capability.

## D1 — A thin `staged-loop.mjs` harness vs. wiring only in a test

**Options.** (a) Wire the chain *only* inside a test file. (b) Add a small `staged-loop.mjs` module that
composes massing→material→relief(+critic) and export it from the barrel; the test drives it.

**Decision: (b) — a thin `staged-loop.mjs`.** Rationale:
- The ticket says "**wire** and demonstrate the full staged loop" — a loop that only exists inside a test
  is demonstrated but not *wired* (no reusable composition for S-029's consumer or a later live run).
- It makes the "single import site" claim literally true: the consolidated `stagedSculpt` / `runStagedLoop`
  come from `index.mjs` alongside the passes, so a downstream caller imports the whole spine from one path.
- It keeps the test about *assertions*, not *composition* — the wiring is the deliverable, the test guards
  it. Mirrors how E-10's consolidation produced a usable boundary, not just a passing test.

The harness must add **no new capability** — it only sequences the existing public functions. If it needed
logic beyond sequencing + a baseline metric, that would be a sign a pass is incomplete (out of scope here).

## D2 — Harness shape: two entry points

**Decision.** `staged-loop.mjs` exports:
- `stagedSculpt(source, intent = {})` → `{ state, proportions, metrics, baseline }`. Runs `mass` →
  `material` → `relief` over a `MassingSource`, returning the relief-locked state, its proportions, its
  `reliefMetrics`, and the **massing-only baseline metrics** for the less-flat comparison. **No render, no
  model** — pure, fast, always runnable in `npm test`.
- `runStagedLoop(source, { brief, intent, render, diagnose })` → `{ state, artifact, proportions, metrics,
  baseline, diagnosis, render }`. Calls `stagedSculpt`, compiles via `compileRelief`, then
  `reviewBuildState` with injectable `render`/`diagnose` (defaults = the live GL + BAML leaves). Returns
  the compiled artifact + the recorded diagnosis.

**Why split.** The pure `stagedSculpt` is what the unit test and any non-rendering consumer want; the full
`runStagedLoop` adds the critic and the live seams. Injectable render/diagnose is the established
`reviewBuildState` contract — the test stubs diagnose (BAML is unrunnable in CI) and can pass the live or a
stub render. Keeping the baseline inside `stagedSculpt` means the "less flat" claim travels with the loop,
not just the test.

**Rejected:** one monolithic `runStagedLoop` that always renders. It would force GL into the pure path and
couple the metric demonstration to a GPU. The pure/live split is the same layering the whole spine uses.

## D3 — How the passes compose (the lock chain, unchanged)

`stagedSculpt` is exactly:
```
const { state: m, proportions } = mass(source);          // locks occupied
const skinned = material(m, intent);                      // locks material over locked occupied
const relieved = relief(skinned, intent);                 // locks relief over locked material
```
`intent` threads to both material and relief (each reads only its own sub-key: `intent.material` /
`intent.relief`), so one intent object configures the whole loop. No new locking, no new stage — the
orchestrator already enforces additivity. The harness must **not** re-lock or re-order; it relies on the
passes' own `runStages` calls. This keeps the P14 cure intact and is the thing the loop demonstrates.

## D4 — The "less flat" metric and what to cite

**Decision: cite `reliefMetrics`.** Baseline = `reliefMetrics(massingState)` (massing-only): all cells
`relief === 0` → `coverage === 0`, `variance === 0`, `range === 0`. Composed = `reliefMetrics(reliefState)`:
`coverage > 0` and `variance > 0` once any feature is relieved. The AC's "measurably less flat (cite the
metric)" is satisfied by asserting `composed.variance > baseline.variance` and `composed.coverage >
baseline.coverage` (i.e. `0`). This is the metric `relief.mjs` was built to provide and that the critic's
`flat→relief` route is judged against — no new metric is invented. The demo records the actual numbers.

**Rejected:** block-count or pixel-diff of two renders as the metric. Pixel diffing needs GL on the hot
path and is noisy; `reliefMetrics` is a deterministic, pure projection of the state — the honest signal.

## D5 — Rendering for AC #1 ("renders")

**Decision: a GL-gated render tier in the test**, mirroring `orbit.test.mjs`. Compile the composed state
(`compileRelief`), validate through the AJV gate, then — when `GL_AVAILABLE` — call `renderArtifact` and
assert a valid, non-trivial PNG; `t.skip(reason)` otherwise. GL is present on this machine, so the loop
renders for real here; CI without GL still passes (skips with a captured reason). This is the same two-tier
discipline every render-touching test uses, and it keeps "renders" honest without a hard GPU dependency in
the default suite.

## D6 — The diagnose seam in the demonstration

**Decision: stub `diagnose` deterministically; render live.** The BAML categorical judge needs metered
`claude -p` and a tsx subprocess — not runnable in `npm test` (research: it is explicitly *not* unit-tested,
"demonstrated in consolidation"). So the *demonstrated loop* in the test:
- renders live (GL here) to prove the composed artifact renders, and
- feeds a **representative stub diagnosis** to the pure router to record the routing behavior.

Because the composed facade is **textured + relieved**, a `flat` defect on it routes to **relief** (the
state-driven disambiguation: not un-textured → wants depth, not more material), and a clean diagnosis
(`[]`) is the "no defect" path. Both are recorded. The *live BAML* judge is left as a documented manual
step (it costs metered tokens) — the wiring is in place (`runStagedLoop` defaults to `defaultDiagnose`), it
simply is not exercised in the automated suite. This matches T-026's explicit design.

**Rejected:** running the real BAML judge in the test. It is non-deterministic, metered, and slow — it would
make `npm test` flaky and costly, violating the suite's GL/BAML-free contract.

## D7 — The boundary check (AC #2)

**Decision: a static import-scan test, `reuse-boundary.test.mjs` under `src/sculptor/`**, modeled exactly
on `src/color/reuse-boundary.test.mjs`. For each middle/review module (`material.mjs`, `relief.mjs`,
`review.mjs`, `compile.mjs`, and the spine leaves), extract every import specifier and assert **none**
references a concept-grid module (`image-grid`, `palette-extract`, `nano-banana`, `expand`, the grid
script). Additionally assert positively that `MassingSource` is the documented form seam and that
`conceptGridSource` is the *only* place the grid's `{grid, n, m}` shape is read (a scan of `massing.mjs`).

**Why static, not a functional GLB stub.** AC #2 is "no concept-grid-specific import" — an import-graph
property, provably by scanning specifiers (the E-10 precedent). A functional "GLB drop-in" proof is nice
but a GLB voxelizer does not exist yet (E-09 stage 4); the honest, enforceable claim now is the import
boundary plus a *demonstration* that a hand-built non-grid `MassingSource` (plain `{width, height,
occupied()}`, no grid array) flows through the whole loop unchanged. **Decision: include that functional
demonstration too** — feed `stagedSculpt` a literal `MassingSource` with no grid anywhere, proving the
middle/review never needed the grid. Static scan + functional proof = the same two-pronged enforcement
E-10's boundary test uses.

## D8 — The journal section (AC #3)

**Decision: append `## E-11 — staged-sculptor consolidation (S-029, T-029-01)`** to design-learnings.md,
in the style of the terminal E-10 section (line 1242). It states: the spine + lock chain (the P14 cure),
the two seed passes (material-noise, relief), the **less-flat result with the actual `reliefMetrics`
numbers**, the recorded critic diagnosis, and the **input-agnostic / GLB-reuse** statement backed by the
boundary test. No new principle number (the P-series is the temple-facade prompting corpus); a named
section is the right altitude, matching the E-09/E-10 consolidation sections.

## D9 — Barrel + README

`index.mjs` gains the two `staged-loop.mjs` exports (single import site). `src/sculptor/README.md` gains a
short "The full loop (T-029)" note + a boundary line. Small, additive, no behavior change.

## Risks / mitigations

- **A sibling pass turns out incomplete when wired.** → Then the wiring exposes a real gap; document as a
  deviation and fix minimally. Expectation from research: none — each pass round-trips through the AJV gate
  already.
- **GL flakiness in the render tier.** → Gated + skippable; the pure assertions (metric, AJV, routing) are
  the load-bearing ones and are GPU-free.
- **Boundary test too strict (false positive on a legit future import).** → Denylist is concept-grid
  modules only, with a comment to review any addition deliberately (E-10 precedent).
