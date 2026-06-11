# T-104-01 roof-as-program — Plan

Ordered steps; each is verifiable alone and commit-atomic. Pure cores first (synthetic-tested, no
GL), runner next, live evidence last — the epic's orchestration note ("GL-free where it counts").

## Step 1 — Export the cage's protect check
- `src/view/shell-regularize.mjs`: `protectViolations` → exported (JSDoc included, no behavior change).
- Verify: `node --test src/view/shell-regularize.test.mjs` (28 tests) unchanged-green.
- Commit: `feat(E-27 T-104-01): export protectViolations — the swap judge reuses the cage check`.
  (May fold into the Step 4 commit if trivially small.)

## Step 2 — Fit core (`src/form/roof-fit.mjs` + tests)
- Implement `ROOF_FIT_DEFAULTS`, `gablesFromRecord`, `evalSideHeight`, `programFitError` per
  structure.md §1. Findings vocabulary: `fit-source-voxel`, `glb-fit-missing` (pass-through),
  `roof-region-unfitted`, `gable-insane`, `overhang-unmeasured`.
- Tests (synthetic records, structure.md fixtures): pitch source selection at the 15° boundary;
  eaveY from eave cells; overhang vs wallSlabs and the null path; hip demand detection; sanity
  rejections; flat/unpaired planes named; determinism (two calls, deep-equal).
- Sanity probe (not a test): run `gablesFromRecord` over the committed cottage + gatehouse records
  in a scratch invocation; expect 2 gables each, findings for flat/fragment planes, cottage roof-4
  side routed to voxel source (glb gradient 7.47 fails sanity/agreement). Adjust defaults ONLY if a
  *main* gable is wrongly rejected — record the rationale in progress.md if so.
- Verify: `node --test src/form/roof-fit.test.mjs`.
- Commit: `feat(E-27 T-104-01): roof fit core — gables from the component record, fit error recorded`.

## Step 3 — Generator (`src/view/roof-generate.mjs` + tests)
- Implement `roofFamily`, `roofHeightfield`, `generateRoof`, `STAIR_FACING` per structure.md §2.
- Tests: family morphology + vocab gating; pitch-1 all-stair slope with correct facing per eave
  dir; pitch-0.5 slab steps; pitch-2 full-block risers; intersecting gables (valley owner, max
  rule); solid-infill invariant; footprint containment; CARD_ROWS-legal states; counts.
- Verify: `node --test src/view/roof-generate.test.mjs`; then `programFitError` of generated
  heights vs the synthetic specs ≤ tolerance (ties Step 2 to Step 3).
- Commit: `feat(E-27 T-104-01): roof generator — stair courses, slab half-steps, solid wedge`.

## Step 4 — Swap under the cage (`src/view/roof-swap.mjs` + tests)
- Implement `massView`, `chimneyColumns`, `roofBandCensus`, `swapRoof` per structure.md §3.
- Tests: accept path (band census →0; IoU vs synthetic refSils holds; closure no-regress; chimney
  byte-identical; reseat fills the gap and is listed); the three rollback paths (each returns the
  input occupancy identically + named reason); massView scope (non-roof fixtures stay dressed);
  banded census exclusions.
- Verify: `node --test src/view/roof-swap.test.mjs`; full `npm run test:unit` green.
- Commit: `feat(E-27 T-104-01): roof swap under the cage — carve, compose, judge, rollback, reseat`.

## Step 5 — Runner + scripts
- `benchmarks/sculpture/roof-program.mjs` per structure.md §4; `package.json` `roof:*` scripts.
- Verify without GL/judge cost: `npm run roof:cottage -- --repro` against… nothing yet — so first
  live run IS the verification (Step 6). Static check: `node --check`, and the deterministic core
  exercised by running the runner up to the record write.
- Commit: `feat(E-27 T-104-01): roof-program runner — registry-driven, deterministic, evidence-rendering`.

## Step 6 — Live evidence: cottage + gatehouse
- `npm run roof:cottage`, `npm run roof:gatehouse` (GL renders; no LLM judge in this runner).
- Inspect: per-gable fit errors + sources; cage IoU table (no azimuth below baseline − 0.02);
  closure; reseat counts; **generated-region roof-band spikes = 0** (asserted by the runner);
  whole-band number; unmapped = 0 (asserted); renders at 135/225/315 before/after; frames copied.
- `--repro` and `--offline` both clean afterwards.
- If the cage REJECTS on a real subject: the record + fallback status are still written — that is a
  valid Rule 1 outcome; document the named reasons in progress.md and review.md rather than tuning
  the instrument. (Tolerances may only change with rationale recorded BEFORE re-running.)
- Commit: `feat(E-27 T-104-01): cottage+gatehouse roofs rebuilt as programs — records, artifacts, frames`.

## Step 7 — Full verification + Review artifact
- `npm test` (schema self-tests + full unit glob) green; `git status` clean of strays.
- Write `progress.md` final state + `review.md` (changes, coverage, open concerns).
- Commit: `docs(E-27 T-104-01): RDSPI artifacts — roof-as-program (research→review)`.

## Testing strategy summary
- **Unit (in `npm test`)**: all three cores on synthetic specs — fit decisions, generator block/
  state correctness, swap judge accept/rollback. No GL, no committed-record dependence (records are
  inputs to the *runner*, not the cores).
- **Integration (live, metered-free)**: the runner on cottage + gatehouse — committed-input pins
  (component-record sha vs regularized artifact), double-run byte-identity, unmapped-empty world
  build, declared-target asserts, renders.
- **Not tested here**: the multi-angle LLM judge (S-107's re-verdict), skin-chain integration
  (S-106), church live run (script exists; record reality — 90k-line component record, tower —
  belongs with S-106/S-107 where its skin-gate unblock is measured).

## Risks & watchpoints
1. **IoU at 315°/135° may drop**: the spiky blob can accidentally out-score a clean wedge against
   the mesh silhouette. Tolerance is anchored to the input baseline (−0.02); a clean wedge following
   fitted planes should hold, but a rejection is recorded, not overridden.
2. **Cottage cross-gable composition**: roof-0/4 × roof-2/3 intersect; the max-height rule must
   produce the valley, and `programFitError` is measured per side over each plane's own extent.
3. **Gatehouse glbFit quality**: ridge pair roof-0/roof-4 is asymmetric (areas 247/19, roof-4 glb
   missing) — expect `fit-source-voxel` findings; that path is first-class, not exceptional.
4. **Stairs invisible in renders** (pinned lens gap): after-renders show the solid wedge with
   notch lines at stair treads; the record names the lens; placement is proven by the unmapped
   gate + states in the committed artifact. Do NOT attempt a viewer fix in this ticket.
5. **Protrusion-mass columns** are already absent from roof-plane extents (T-103 segmentation
   assigns them to their own mass), so the carve naturally avoids chimneys; `chimneyColumns` +
   protect is defense in depth, and gatehouse's three protrusion masses ride the same rule.
