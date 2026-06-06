# T-029-01 — Plan: sculptor consolidation

Ordered, independently-verifiable steps. Each ends green and is commit-sized. AC map at the end.

## Step 1 — `staged-loop.mjs`: the wired harness

**Do:** create `src/sculptor/staged-loop.mjs` exporting `stagedSculpt(source, intent)`, `lessFlat(baseline,
metrics)`, and `async runStagedLoop(source, opts)`. Sequence the existing public passes only
(`mass → material → relief`), compute `baseline`/`metrics` via `reliefMetrics`, compile via `compileRelief`,
and call `reviewBuildState` with injectable `render`/`diagnose`. Header documents the lock chain (P14 cure)
and the single `MassingSource` form seam.

**Verify:** `node -e` smoke — run `stagedSculpt` over a 3×3 literal `MassingSource`, print
`state.locked` (expect `occupied,material,relief`) and `metrics`. No assertion file yet; just confirm it
runs and locks all three fields.

## Step 2 — barrel export

**Do:** add `export { stagedSculpt, runStagedLoop, lessFlat } from "./staged-loop.mjs";` to `index.mjs`.

**Verify:** `node -e "import('./src/sculptor/index.mjs').then(m => console.log(typeof m.runStagedLoop))"`
prints `function`. Single import site holds.

## Step 3 — `staged-loop.test.mjs` (AC #1)

**Do:** create the test with:
- `tinyGrid()` fixture → real `conceptGridSource` adapter; `gridlessSource()` literal `MassingSource`;
  an `intent` with one explicit `relief.features` window recess.
- Pure assertions: full lock chain present + ordered (`lockLog`); **less-flat metric** (`baseline` zero,
  `metrics.variance>0 && coverage>0`, `lessFlat().isLessFlat`); **AJV gate** on `compileRelief` output
  (ok, multi-block manifest, a placement at `z===-1`); **stubbed loop** routing (`flat`→`relief`; `[]`→
  empty); **gridless source** yields the same locked chain.
- GL-gated render tier: skip when `!GL_AVAILABLE`; else assert a valid non-trivial PNG from `renderArtifact`.

**Verify:** `node --test src/sculptor/staged-loop.test.mjs` — all green; render tier runs (GL present here).
Capture the printed `metrics`/`baseline` numbers and the routed diagnosis for the journal (Step 7).

## Step 4 — `reuse-boundary.test.mjs` (AC #2)

**Do:** create the static + functional boundary guard. `importSpecifiers` extractor; `CONCEPT_GRID_DENYLIST`;
static scan of `material/relief/review/compile/orchestrator/build-state`; assert geometry/spine are
`../color/`-free and `material`'s only cross-dir import is the portable engine; assert `conceptGridSource`
(massing.mjs) is the sole grid-shape reader; functional drop-in proof (literal `MassingSource` → full loop →
`parseArtifact().ok`) with no concept-grid import in this test's graph.

**Verify:** `node --test src/sculptor/reuse-boundary.test.mjs` — green. Deliberately temporarily add an
`import "./image-grid-does-not-exist"`-style denylisted specifier to a scanned module in a scratch check to
confirm the test *fails* (then revert) — proves the guard bites. (Optional sanity, not committed.)

## Step 5 — README

**Do:** add the "The full loop (T-029)" bullet + the `MassingSource`-only boundary line to
`src/sculptor/README.md`.

**Verify:** read-back; no code impact.

## Step 6 — full suite

**Do:** run `npm test`.

**Verify:** green; record the new total (prior baseline was 291/291 per the session log after T-028/T-032;
expect +N from the two new test files). Capture the exact count for the journal.

## Step 7 — journal (AC #3)

**Do:** append `## E-11 — staged-sculptor consolidation (S-029, T-029-01)` to `design-learnings.md` using
the **captured numbers** from Steps 3 & 6: the spine + lock chain (P14 cure), the two seed passes, the
less-flat result (actual `coverage`/`variance` for composed vs the all-zero baseline), the recorded critic
diagnosis (the `flat→relief` routing demonstrated), and the input-agnostic / GLB-reuse statement (boundary
test). End with the `npm test` count.

**Verify:** read-back for accuracy against the captured run output; numbers must match what the test
actually produced (no invented figures).

## Step 8 — commit

**Do:** commit the implementation (`staged-loop.mjs`, the two tests, `index.mjs`, `README.md`) and the
journal together (or in two commits: code, then docs), with a `feat(sculptor)` / `docs` message scoped to
T-029-01. Branch: `main` is the working branch per the repo convention for these tickets; commit only when
the suite is green.

## Testing strategy (what is and isn't covered)

- **Unit / pure (always run):** the lock chain, the less-flat metric, the AJV round-trip, the routing, the
  gridless-source drop-in, and the static import scan. These are the load-bearing AC checks and are
  GPU/model-free.
- **GL-gated (run here, skipped in headless CI):** the live render of the composed artifact — AC #1's
  "renders", proven for real on this machine, gracefully skipped elsewhere.
- **Not automated (documented manual step):** the live BAML categorical judge (`defaultDiagnose`). It is
  metered + non-deterministic; the wiring defaults to it but the suite stubs diagnose. Recorded as a known
  limitation in review.md, consistent with T-026's design.

## AC coverage map

- **AC #1** (end-to-end run, valid artifact, renders, measurably less flat, diagnosis recorded) → Steps 1,
  3 (pure metric + AJV + stubbed routing + GL render) and the captured numbers in Step 7.
- **AC #2** (no concept-grid import; `MassingSource` only; GLB drop-in) → Step 4 (static scan + functional
  proof).
- **AC #3** (staged-sculptor journal section) → Step 7.
- **AC #4** (`npm test` green) → Step 6.

## Rollback / risk

Each step is additive (new files + two append-only edits). If the render tier flakes, it self-skips; if a
boundary assertion is too strict it fails loudly at Step 4 (tune the denylist, never the modules). No
existing module is modified, so there is nothing to roll back in the spine — worst case is reverting the
two new test files and the harness.
