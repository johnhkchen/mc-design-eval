# T-069-01 — surgical-refine-to-standard · Progress

## Status: implementation complete; live run executed; honest outcome recorded.

## Completed steps (per plan.md)

### Step 1 — Pure core `src/form/surgical-standard.mjs` ✅
The verdict/IoU trajectory analysis, the P14-safety check, the Strong+-vs-topping-out decision, the report
assembler. `categoryRank`, `meetsStandard`, `roundCell`, `verdictTrajectory`, `formIoUTrajectory`,
`editTraceRows`, `checkP14`, `toppingOutDetail`, `assessOutcome`, `assembleSurgicalStandard`. PURE — inlined
`boxesIntersect` (5 lines) to avoid the `tweak.mjs → sculptor/review.mjs` transitive import chain. Null-
tolerant; throws only on a non-array `rounds`/`trace`/`findings`.

### Step 2 — Pure tests `src/form/surgical-standard.test.mjs` + `npm test` ✅
19 cases covering every export: rank/standard ordering, trajectory ordering + null tolerance, edit-trace
procedural-vs-llm classification, the three P14 violation types + a clean trace, topping-out detail pick,
`assessOutcome` (reached mid-trajectory / topped-out-with-detail / all-rolled-back-at-baseline), the assemble
shape + both tables + the honest outcome paragraph + the findings section + throw-on-non-array. **`npm test`
786 pass, 0 fail** (was 767 pre-ticket; +19). — AC#4 (tests) met.
Commit `feat(E-20 T-069-01): pure surgical-standard analyzer … + 18 tests` (+1 findings test later).

### Step 3 — Impure runner `benchmarks/sculpture/surgical-standard.mjs` ✅
Composes the EXISTING seams verbatim (no loop/target/judge change — the E-16 seam invariant):
`reviseLoop` + `liveFormScore({ formTarget: glbFormTarget({ glbPath, buildBounds }) })` + `makeFormEditor`
(critic forces the LLM `detail` route) + `judgeRender` (categorical, median samples). Bounded rounds; drops
accepted regions each round (P14 across rounds); stops on Strong+ / dry / exhausted. Writes
`surgical-standard.{json,md}`, per-round `round-N/summary.json` (cell + trace + proposals), the refined
artifact + `pr/assets/frames/building-refined.png`. `--offline` re-derives the report from committed
summaries. Commit `feat(E-20 T-069-01): surgical-refine-to-standard runner …`.

### Step 4 — `package.json` + `.gitignore` ✅
Added `"surgical:standard"` script. `.gitignore`: the refined artifact (byte-identical to `best`) +
round renders are ignored; the round summaries + the report are committed.

### Step 5 — Live run executed ✅ (the honest measurement)
`npm run surgical:standard -- --rounds 1 --samples 3 --per-region 1` on `building/best` (57,202 blocks) +
`glb/stone-gatehouse.glb` + the run-015 design-doc brief. **EXIT 0.** Result recorded in
`surgical-standard.{md,json}`.

## Outcome (AC#3 — stated honestly)

**Topped out at `weak`** (baseline; did NOT reach Strong+). Trajectory: round 0 (baseline) weak @ IoU 0.929
→ round 1 weak @ 0.929 (unchanged). **All 4 fine-detail regions rolled back; 0 accepted.** P14-safety: SAFE.

**Why it topped out (measured, two compounding causes):**
1. **The per-region LLM block-edit route cannot run on the high-res build.** Every edit proposal failed —
   the `baml-revise` subprocess exited non-zero with a "prompt too long" BamlError (~1.25M tokens vs the 1M
   limit). A high-res region's placement list (tens of thousands of blocks at scale 64) overflows the model
   context. The E-15 surgical LLM-edit path was validated on ~32-block sculptures (hundreds of placements);
   it does **not** scale to the high-res building's region density. With no proposal, the loop has nothing to
   accept → the cage holds the build unchanged.
2. **The GLB form target lost the defining detail upstream (T-067).** TRELLIS dropped the arch voussoir ring,
   the gable ridge line, and the 1×3 slit windows, so even a working editor would get no per-region signal
   pulling toward those features — the form target cannot reward detail it does not itself contain. The judge
   notes corroborate: "no readable arch, no slit windows, no buttresses; the crown dissolves into noise."

## Deviations from plan

- **Resilient judge (added).** The metered `claude -p` judge flaked transiently on a 3-sample round, crashing
  the whole expensive run twice. Added a retry → single-sample → degrade-to-`unknown` ladder in `judgeWhole`
  so a flaky external call never discards a completed render+loop. The pure core already tolerates `unknown`.
- **Findings passthrough (added).** Extended the pure assembler with an optional `findings: string[]` →
  a "Findings (where/why quality tops out)" section, so the root cause is in the committed report headline,
  not just the prose. +1 test.
- **Refined artifact gitignored.** It is byte-identical to `building/best/artifact.json` (zero edits
  accepted), so a 7.6 MB duplicate is not re-committed (T-068 flagged repo size); equality documented.

## Commits
1. `feat(E-20 T-069-01): pure surgical-standard analyzer … + 18 tests`
2. `feat(E-20 T-069-01): surgical-refine-to-standard runner …`
3. `feat(E-20 T-069-01): live surgical refine-to-standard run + findings + resilient judge`
