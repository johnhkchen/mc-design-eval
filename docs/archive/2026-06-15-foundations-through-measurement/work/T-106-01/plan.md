# T-106-01 component-aware-skinning — Plan

Eight steps, each commit-atomic, tests green at every boundary (`npm test`, currently 1341 pass).
Steps 1–3 are pure foundations (parallel-safe but committed in order), 4–6 wire the chain, 7 adds
the runner, 8 is the live evidence run. Honest-failure contingencies are written next to the step
that can hit them.

## Step 1 — reconstruct-compose pure core

**Build:** `src/view/reconstruct-compose.mjs` (`occupancyDelta`, `composeReconstruction`) +
`reconstruct-compose.test.mjs`.

**Tests:** delta of identical artifacts is empty; changed/added/removed each exercised; two
disjoint deltas compose with stats per delta; overlapping deltas THROW naming both deltas and
sample keys; empty delta list returns byte-identical artifact JSON (serialize both, compare
strings — the double-run sha contract depends on this); deterministic placement order (compose
twice, compare serialization).

**Verify:** `npm test` green. **Commit:** `feat(E-27 T-106-01): reconstruct-compose — delta diff,
disjoint composition, passthrough proven`.

## Step 2 — component-plan pure core

**Build:** `src/view/component-plan.mjs` (`buildComponentPlan`, `roofPlanFromRecord`,
`frameLinesFromComponent`, `wallFacePredicate`, `splitZoneOf`, `programConformance`) + tests.

**Tests (the AC's per-seam record-vs-fallback pairs live here):**
- plan: each record absent → that member null + named finding; pin mismatch → THROW; roof record
  with `status:"fallback"` → roof null + `roof-program-fallback` finding.
- frames: synthetic gabled box with a hand-written component record → `frameLinesFromComponent`
  output equals `frameLines(occ, …)` on the clean geometry (they should agree when occupancy is
  noise-free — that equality IS the seam's correctness argument); add a noise spike to the box →
  occupancy path drifts, component path doesn't (the ticket's prediction in miniature);
  `floorLine` source always "occupancy".
- wallFaces: on-slab cells true, interior/off-plane false, bounds clipped; `splitZoneOf`:
  histogram over split zones re-aggregates exactly to the unsplit histogram (partition proof).
- conformance: program-true synthetic roof → 0 deviations; one perturbed column → that column
  named with want/got.

**Verify:** `npm test`. **Commit:** `feat(E-27 T-106-01): component-plan — per-seam definitions
with named occupancy fallback`.

## Step 3 — inert parameter additions

**Build:** `stripStraySalt` `regions` (surface-pattern.mjs), `paintFace` `skip` (face-paint.mjs),
`placementGrammar` `frames` override + `frameSource` record field (src/form/placement-grammar.mjs).

**Tests:** for each — default-absent behavior byte-identical on an existing-style fixture
(regression pin), then the new behavior: region cell never recolored even when isolated speck;
skipped voxel counted, not painted; provided `frames` used verbatim and `frameSource` recorded.

**Verify:** `npm test` — every pre-existing test untouched and green (the default-inert claim).
**Commit:** `feat(E-27 T-106-01): region/skip/frames seams — default-inert parameters in the three
paint ops`.

## Step 4 — buildSkin seams (durable-skin.mjs)

**Build:** `def.componentPlan` threading: roof-program region into the T-090 fill + splat skip +
stray-salt regions; `programConformance` replacing basin-fill on the program footprint
(off-footprint unchanged); roof-family preserve extension at the renaming point; `splitZoneOf`
census for both T-088 gate sites; `seamSources`/`wallField`/`conformance` in the return record.

**Tests:** unit tests where practical (the seam helpers are already covered in step 2); the
buildSkin-level proof is integration: `npm run zone:map -- --offline` style checks aren't enough,
so add one focused test file `src/view/component-plan.integration.test.mjs` driving a miniature
synthetic chain (tiny artifact + tiny plan) through `zoneFill`+census composition to prove: (a)
plan absent ⇒ outputs deep-equal the no-plan call; (b) plan present ⇒ stair cell survives fill,
offslab zone appears in census, gate consumes only banded zones.

**Verify:** `npm test`; `npm run skin:cottage -- --repro` (no plan in that runner — must still
re-verify the committed record byte-identically: the AC's fallback clause, checked early).
**Commit:** `feat(E-27 T-106-01): buildSkin consumes the component plan — protected roof program,
defined wall-field census, conformance over basin-fill`.

## Step 5 — runChain reconstruct stage (challenge-milestone.mjs)

**Build:** post-shell sha → `loadReconstruction` (record reads, pin verify THROW, deltas, compose,
write `reconstructed-artifact.json`) → plan → `buildSkin` on the composed path; `reconstruction` +
`componentPlan` in the return; honest-failure stage name `"reconstruct"`.

**Verify:** `npm test`; `npm run challenge:cottage -- --offline` (sha bookkeeping consistent);
then a LIVE `npm run challenge:cottage` — expected to produce a *new* final sha (the chain now
composes the roof+shaped deltas); the run must pass its own gates. Contingency: if the T-088 gate
or band evidence fails on the reconstructed cottage (gable-end planks moved band composition),
that is a real finding — stop, record it in progress.md, and decide between (a) the wall-field
census already explains it (likely: planks are off-slab or roof-banded) and (b) a genuine seam
bug. Do not tune.
**Commit:** `feat(E-27 T-106-01): reconstruct stage — pinned roof+shaped deltas composed into the
chain behind the disk seam`.

## Step 6 — grammar/styled threading

**Build:** `grammarStage` accepts `componentPlan` (frames); `styledChain` passes it to grammar AND
the settle loop (same op, same source — the fixpoint must not flip derivations between passes);
styled record carries `reconstruction`/`seamSources`/`frameSource`.

**Verify:** `npm test`; live `npm run styled:cottage` — full chain, gate spawned; **kit presence
must PASS** (AC #3's survival claim). Contingency: settle non-convergence with component frames
means the frame read is unstable against dressing edits — since component frames don't re-read
occupancy, convergence should *improve*; if it doesn't, that's a wiring bug (fix, never widen the
4-iteration bound). **Commit:** `feat(E-27 T-106-01): styled chain component-aware — frames from
the record through grammar and settle`.

## Step 7 — component-skin runner + scripts

**Build:** `benchmarks/sculpture/component-skin.mjs` + `reskin:*` scripts + `.gitignore` stanza.
Registry: cottage/gatehououse → styled chain, church → challenge chain (kit-less). Record per
structure.md (`component-skin/v1`), double-run sha, `--repro`, `--offline`, zone-map re-pin write
with embedded `diffZoneMaps` + `repinnedBy`.

**Verify:** `npm test`; `node benchmarks/sculpture/component-skin.mjs --subject cottage --offline`
exercises arg/IO paths without GL. **Commit:** `feat(E-27 T-106-01): reskin:* runner — seam
provenance, wall-field decomposition, zone-map re-pin protocol`.

## Step 8 — live evidence runs (dependency order) + records

1. `npm run roof:church` — first execution; expect the named `kit-roof-field-missing` full-block
   fallback (null kit) and a cage verdict. Contingency: swap rejected on all rungs →
   `status:"fallback"`, church composes shaped-only; recorded, still a valid AC #4 run (the
   residual explanation will name it).
2. `npm run reskin:cottage` then `reskin:gatehouse` — full styled re-skin on reconstructed
   shells; kit presence PASS required on cottage; zone-map re-pins committed where bands shifted
   (expect cottage band1 shift per T-095 concern #4; gatehouse TBD).
3. `npm run reskin:church` — the band0 re-measure. Either outcome is completion: gate PASS (then
   also commit church's first zone-map record; styled:church remains kit-blocked — named finding
   with the now-unblocked path) or named residual with the on-slab/offslab measured cause.
4. `--repro` re-run of each new record (byte-identity); `npm test` final.
5. Commit artifacts/records/frames path-scoped (sibling-session hygiene: never `git add -A`);
   then the docs commit for the RDSPI artifacts.

## Testing strategy summary

- **Unit (steps 1–3):** pure cores + parameter inertness; synthetic fixtures only; every named
  finding code exercised; the four AC seams each have a record-vs-fallback test pair.
- **Integration (steps 4–6):** the miniature synthetic chain test + the live runners' own hard
  asserts (pins, double-run byte identity, THROW gates) — the established E-25..27 pattern where
  the runner IS the integration test.
- **Regression:** `skin:cottage --repro` (record-less path byte-identical), full `npm test` at
  every commit, kit presence on cottage at step 6/8.
- **Out of scope, recorded:** stair pixels in renders (T-097 lens gap — geometry proven by state
  gates + IoU, not pixels); kit extraction for church (live-model stage, milestone's call).

## Risks named up front

- In-chain regularized shell sha ≠ committed `regularize/<subj>/artifact.json` sha (the pin all
  reconstructions carry). If they diverge the reconstruct stage THROWS by design — fix is to
  re-run the upstream runners against the true chain shell, not to relax the pin. Checked first
  thing in step 5 verification.
- Frame coordinates: component records were cut from the regularized shell; the reconstructed
  shell moves roof-band cells. `roofline` must come from the roof *program* (not the record's
  pre-swap eave cells) on roof-swapped subjects — handled in `frameLinesFromComponent` source
  selection; a test pins it.
- Dressing meets arches (gatehouse): aperture reference is the RAW base (unchanged), and rebuilt
  arch heads may conflict with treatment placements — `dressOpenings` records conflicts; they are
  evidence, not errors. Watch gatehouse kit presence for arch-adjacent gaps.
