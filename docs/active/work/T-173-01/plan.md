# T-173-01 — Plan

Ordered, independently-verifiable steps. Guard-before-spend throughout. Frozen instrument untouched;
`npm test` green at the end.

## Step 1 — Harness env gates (no spend)
Edit `experiments/eval-alignment/corpus-referee.mjs`:
- `CRATER_BUILD = process.env.CRATER_BUILD ?? "builds/gatehouse/new-roof"`.
- `CRATER_ONLY = process.env.CRATER_ONLY === "1"`.
- In `main()`: gate the corpus guard loops + the agreement/bake-off run + the baseline-load on
  `!CRATER_ONLY`; when skipped, set `agreement`/`bakeoff` to `{ skipped: "CRATER_ONLY" }` and still write
  `RESULTS`.
**Verify:** `node -c` / file parses; default path logic unchanged (read the diff).

## Step 2 — Guard the default build, crater-only (no spend)
`GUARD_ONLY=1 CRATER_ONLY=1 npm run corpus-referee`
**Verify:** prints the crater asset count, no corpus-pair demand, exits clean. Proves the CRATER_ONLY
guard branch is correct without spending.

## Step 3 — Stage the S-171 faithful build (no spend)
Create `builds/gatehouse/faithful/`:
- copy `benchmarks/sculpture/recognition/gatehouse.artifact.json` → `artifact.json`.
- copy each `recognition/view-gatehouse-{az}.png` → `view-{az}.png` (4 azimuths).
- write `SOURCE.md` (provenance one-liner).
**Verify:** `ls` shows 4 `view-*.png` + `artifact.json`; byte-identical to sources (`cmp`).

## Step 4 — Guard the staged faithful build (no spend)
`GUARD_ONLY=1 CRATER_ONLY=1 CRATER_BUILD=builds/gatehouse/faithful npm run corpus-referee`
**Verify:** crater assets all present (staged renders + 3 concepts), exits clean.

## Step 5 — Tests green before spend
`npm test`
**Verify:** 2242 pass / 0 fail (the harness is not imported by tests; this guards no collateral break).
Commit Steps 1–4: `feat(T-173-01): CRATER_BUILD/CRATER_ONLY env gates + staged faithful build`.

## Step 6 — PRIMARY crater run (SPEND ~8 calls)
```
CRATER_ONLY=1 CRATER_BUILD=builds/gatehouse/faithful \
REFEREE_OUT_DIR=docs/active/work/T-173-01 \
REFEREE_RESULTS=experiments/eval-alignment/results/corpus-referee-faithful.json \
npm run corpus-referee
```
**Verify:** `results/corpus-referee-faithful.json` written; read `crater.scores` {A,B,B2,C},
`crater.spreads`, `crater.verdict`, `crater.kindReliability`; `crater-*.png` beside composites in
`T-173-01/`. Record A vs B/B2/C and the per-item `kind`/`styleClass` audit trail.

## Step 7 — CONTRAST crater run (SPEND ~8 calls)
```
CRATER_ONLY=1 CRATER_BUILD=builds/gatehouse/roof-covering \
REFEREE_OUT_DIR=docs/active/work/T-173-01/contrast \
REFEREE_RESULTS=experiments/eval-alignment/results/corpus-referee-roofcovering.json \
npm run corpus-referee
```
**Verify:** `results/corpus-referee-roofcovering.json` written; read its `crater.scores`. This is the
basalt-walls build — predicted to re-floor MATCHED if material is the term's driver.

## Step 8 — Synthesize FINDINGS (no spend)
Write `docs/active/work/T-173-01/FINDINGS.md`:
- The spread table: PRIMARY A/B/B2/C and CONTRAST A/B/B2/C beside E-40 (2/0/2/0) and T-170-02
  (8/14/18/46); each spread vs ±12.
- **Does the crater separate?** Lead with the answer. If yes: matched ≫ wrong outside ±12 — the term
  works on a materially faithful build. If no: localize — MATCHED still capped (term *scale* gate) vs
  WRONG failed to cap (under-penalty); use the per-item `kind`/`styleClass` to say which.
- **Axis triangulation:** PRIMARY (stone walls, prism roof) vs CONTRAST (basalt walls, covering roof) —
  which faithfulness axis moved the crater.
- **The standing wall:** no single build is both materially + roof-form faithful (Option 3 deferred —
  two pipelines, conformance-gate + pin-rotation, scoped out by T-172-01). Name it; do not soften.
- **Recommendation:** promote / re-calibrate / do-not-promote, updated with this evidence.

## Step 9 — Tests green; commit; review
- `npm test` green.
- Commit evidence: `docs(T-173-01): faithful + roof-covering crater results, FINDINGS, beside PNGs`.
- Write `review.md` (handoff): files changed, test coverage + gaps, open concerns, AC checklist,
  anti-hedge note.

## Testing strategy
- **No new unit tests** — matches the no-test posture of the sibling experiment harnesses (the change is
  two env reads + draft evidence). The env gates' correctness is verified by the Step 2/4 GUARD_ONLY
  runs (both the default and faithful build) and by the default path staying byte-identical.
- **`npm test`** is the regression guard for the rest of the tree (the harness is not imported by tests,
  but a green run proves no collateral break).
- **Determinism caveat:** VOTES=2 live model calls — the *direction* (separates / does not) is the
  result, not a precise score; report scores as ±noise and lead with whether the spread clears 2·NOISE.

## Rollback / safety
- All output goes to env-overridden `RESULTS`/`OUT_DIR` files — the E-40 and T-170-02 baselines are
  never written.
- Default `CRATER_BUILD`/no-`CRATER_ONLY` path is unchanged → the committed baselines remain reproducible.
- If a run errors mid-spend, the asset guard already ran (no partial-asset surprise); re-run is idempotent
  (overwrites its own RESULTS).
