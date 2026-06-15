# T-137-01 visibility-aware-census — Plan

Each step is independently verifiable and committed atomically. Stage narrowly — sibling sessions
(T-135/T-136) have uncommitted files in this tree (`loop.test.mjs`, `bridge.mts`, `rerecognize.*`,
`model-tier.mjs`); never `git add -A`.

## Step 1 — pure core: `visibilityAwareCoverage` (face-resemblance.mjs)

Implement per structure.md: band classification (visible / not-visible-from-any-view /
not-on-skin), per-view aware gate via the UNTOUCHED `coverageGate` on the per-view subset,
excluded rows annotated (`status:"not-visible-from-view"`), legacy gate on the full set,
`visibility` cross-view block, `VISIBILITY_COVERAGE_SCHEMA`.

Verify: `node --test src/view/face-resemblance.test.mjs` (existing tests green before V-tests
added — proves coverageGate untouched).

## Step 2 — unit tests V1–V7 (face-resemblance.test.mjs)

Per structure.md. V6 is the structural monotone property (legacy pass ⇒ aware pass) over a case
grid crossing the threshold, the metric, and the three statuses.

Verify: `node --test src/view/face-resemblance.test.mjs`. Commit 1 (steps 1–2).

## Step 3 — replay + synthetic proofs (`src/view/visibility-monotone.test.mjs`)

- Replay every committed `multi-angle/*.json`: every view recorded `coverage.passed === true`
  must aware-pass (AC3 monotone over committed records).
- The T-127 witness assertion: cottage-patternbook flips to aware-pass ×4, band1 excluded per
  view, legacy still fails (both arithmetics).
- cottage-baseline guard: band1 there is VISIBLE (t290) and failing — aware must still fail those
  views (visibility-awareness pardons only invisibility).
- Synthetic ring fixture through real projections (`surfaceZoneHistogram` diag faces + exposure):
  hidden-but-exposed ⇒ named failure; declared-but-absent ⇒ not-on-skin exclusion.
  (Occupancy via `artifactOccupancy` on a literal placements array — check its exact API first.)

Verify: `node --test src/view/visibility-monotone.test.mjs`. Commit 2.

## Step 4 — gate runner wiring (benchmarks/sculpture/multi-angle-gate.mjs)

Exports (`GATE_SUBJECTS`, `deriveZones`, `policyInShippedPalette`); hoist the four per-view
censuses + exposure census above the render loop; one `visibilityAwareCoverage` call; per-view
`coverage` record shape gains `legacy`, record gains `visibility`; offline checker additive
presence-optional check; recordMd excluded-row rendering. No live gate execution.

Verify: `npm run gate:multi -- --subject cottage --label patternbook --offline` (and 2–3 other
committed records incl. synthetic-hut) — all still validate; `node --check` the runner.
Commit 3.

## Step 5 — witness runner (`benchmarks/sculpture/visibility-witness.mjs`) + scripts

Per structure.md. Artifact-pin check first; recorded-rows replay; exposure re-derivation with
totals cross-check (`censusCheck.drift` named, never silent); guarded writes to
`benchmarks/sculpture/visibility/`; `--repro`; self-grep. Add the three npm scripts.

Verify (the witness, AC2):
- `npm run visibility:cottage` — record written; headline shows legacy 0/4 → aware 4/4 views
  passing the precondition; band1 `not-visible-from-view` ×4, byBand `not-on-skin`,
  `visibility.passed: true` (no hidden-band failure); judge not called.
- `npm run visibility:all` — best-effort over every committed gate record; drift named per record.
- `npm run visibility:repro` — byte-identical re-derivation, exit 0.
Commit 4 (runner + scripts + committed witness records).

## Step 6 — full-suite + discipline sweep

- `npm test` green (note pre-existing failures if any — they must be absent or named with cause).
- `git diff --stat` of committed multi-angle records = empty (records untouched).
- Grep the diff for per-building constants (subject keys in src/ changes: none).
- Confirm no model-tier/OP_ROUTING change needed (no new model calls).

## Step 7 — progress.md (maintained throughout), review.md

review.md: changed files, AC-by-AC evidence (witness numbers, monotone proof, both arithmetics,
instrument-diff reasoning), test coverage and gaps, open concerns (e.g. T-138 must run the live
gate to emit the first both-arithmetic gate record; `not-on-skin` semantics flagged for the
reviewer). Final commit.

## Testing strategy summary

| layer | test | proves |
|---|---|---|
| pure unit | V1–V7 | semantics + structural monotone + both arithmetics |
| committed replay | visibility-monotone | AC3 monotone on real records; the T-127 flip; baseline guard |
| synthetic geometry | ring fixture | AC1's "invisible from ALL views = named failure" on real projections |
| witness runner | visibility:cottage / :repro | AC2 + reproducibility; committed pins untouched |
| offline re-assert | gate:multi --offline | committed records still valid under new runner code |

## Risks / contingencies

- `--all` witness drift on older records (challenge-repro-drift precedent): named `censusCheck.
  drift`, recorded — never regenerate gate pins.
- If `artifactOccupancy` requires full artifact shape (assertArtifact), build the ring fixture
  through the same helper the other view tests use (check zone-fill.test.mjs precedent first).
- Suite-wide test failures unrelated to this ticket (T-135/T-136 in flight): re-check `git stash`-
  free baseline by running the failing file from HEAD before attributing.
