# T-127-01 styled-house-milestone — Progress

Phase artifact 5/6. Step-by-step against plan.md.

## Step 1 — seed helpers + workshop registry derivation ✅
- `src/workshop/seed.mjs`: `PATTERN_BOOK_BUDGET` (rounds 6), `seedWorkshopProgram`
  (compile → declared budget → assert → realize → conformance; byte-stable `serialized`),
  `workshopSubjectsFrom` (durable-skin registry → workshop data rows, recognize predicate).
- `src/workshop/seed.test.mjs`: SEED1–6 (budget override, byte-stability, real-pack
  integration PASS, pack-invalid role throws, derivation predicate + real-registry leg).
- `benchmarks/sculpture/workshop.mjs`: SUBJECTS = explicit fixture + derived rows.
- **Deviation from structure.md (recorded)**: `seedWorkshopProgram` returns the conformance
  result instead of throwing on a conformance FAIL — the chain owns that verdict (honest
  pipeline-failed record); validation/role gates still throw. Structure said "throws on any
  gate failure"; returning is strictly more testable and the chain asserts `passed` itself.
- Verified: 56/56 workshop tests; `workshop:replay` BYTE-IDENTICAL + `workshop:offline` clean
  (fixture untouched by derivation); full `npm test` 1827/1827.

## Step 2 — chain runner + scripts + isolation extension ✅
- `benchmarks/sculpture/pattern-book.mjs`: live (verify sketch/recognition seams → seed with
  declared budget → spawn workshop CLI → chain record), `--repro`/`--offline` (byte-asserts +
  ledger replay + offlineAssert), pipeline-failed honesty, self-grep.
- isolation.test.mjs scans the chain runner (judge tokens absent — green); compare runner
  named as deliberately unscanned.
- npm scripts: `patternbook:{cottage,barn,repro,offline}`, `gate:patternbook:{cottage,barn}`
  (direct node, flags encoded — no `--` surface).
- Verified: isolation green; `--repro` pre-run fails HONESTLY naming the missing committed
  program; self-grep CLEAN; `npm test` 1827/1827.

## Step 5 (machinery, pulled forward while live runs cook) ✅
- `src/form/head-to-head.mjs` + 6 tests (gateRow quoting, outcome naming incl.
  coverage-rejected/unparsed, deltas arithmetic, refusal honesty, schema pin, md shape);
- `benchmarks/sculpture/pattern-book-compare.mjs` + `patternbook:compare` script — fails
  honestly when records are absent. Suite 1833/1833.
- Note: plan ordered this after Step 4; only the RUN depends on committed gate records, so the
  machinery landed early (deviation recorded, harmless).

## Step 3 — live chains (cottage, barn) ✅
- First cottage attempt: honest `pipeline-failed` at stage "seed" — the chain never mkdir'd
  `workshop/<key>/`. Fixed (mkdir before the seed write); failure path proven live.
- **Cottage**: workshop **done** at 6/6 — 5 accepted revisions (roof field/trim adjust +
  4 dark_oak_log timber-framing paints on -x/+z/corner/+x faces), conformance 6✓/0f every
  round. The model's own critique named the concept's signature (half-timbering) in round 1
  and pursued it to a declared done.
- **Barn**: workshop **budget-exhausted** at 6/6 — **0 accepted**: r1 roof-field adjust rolled
  back (courses-even 8736 findings — but NOTE: the model's r1 critique was WRONG, wanting
  spruce; r2 critique itself recognized dark_oak matched; the cage saved the build), r2 wagon-
  door head adjust rolled back (3 findings — the T-126 static-declarations limit, this time
  blocking a RIGHT read: concept shows wooden wagon doors), r3 re-recognize → unwired applier
  (S-125 seam, demand recorded a second time), r4–6 fixated on painting the same door bay
  (oak/dark_oak alternating) — every paint regressed declarations. Final build = seed draft.
- `patternbook:repro` + `patternbook:offline` byte-identical on both; uncommitted-chain
  subjects (gatehouse/church) SKIP with a note (the recognize --offline precedent; small
  runner fix committed with barn).

## Step 4 — frozen gate ×2 — IN PROGRESS
- **Cottage run 1 (superseded in place, never committed — the T-125 precedent)**: all four
  views coverage-REJECTED on the roof zone (own 0.22–0.41) — the build's 632 spruce_stairs
  roof courses were censused as foreign because the pattern-book chain persisted NO consumption
  plan; the roof course family enters the gate's vocabulary ONLY via componentPlan.roof.family
  (T-106/T-113 contract). Zero judge calls were spent.
- **Fix (chain-side, gate untouched)**: `componentPlanFrom(program)` in seed.mjs — roof.*
  element cells + course family from the program (the authority), persisted beside the final
  artifact; `--plan-only` backfill; repro re-derives + byte-compares the plan. SEED7/8 tests.
- **Cottage run 2 (the committed record)**: roof passes 1.0 everywhere; **band1 (upper storey)
  total=0 in all four views → coverage REJECT → FAIL, judge never called**. The 87 "band1"
  cells of run 1 were the gable triangles (program-owned roof); the true upper wall is fully
  occluded by eaves+jetty at the 30° contract elevation. The sheet confirms at a glance:
  concept = tall half-timbered upper storey, build = nearly all roof. The workshop's own
  critique named this proportion problem in rounds 1/2/4/6 and never reached for the geometry
  params (it painted) — a measured limit of the model's revision reach, recorded first-class.
- Barn gate convened 3:05pm.

## Step 3 — live chains (cottage, barn) — pending
## Step 4 — frozen gate ×2 — pending
## Step 5 — head-to-head composer — pending
## Step 6 — design-learnings + review — pending
