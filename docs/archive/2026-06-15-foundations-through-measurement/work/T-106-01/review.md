# T-106-01 component-aware-skinning — Review

Self-assessment / handoff. The E-24/E-26 skin chain now CONSUMES the component layer (T-103
records, T-104 roof programs, T-105 shaped heads) at four seams, with the occupancy derivation as
the recorded fallback; all three subjects ran the consuming chain end-to-end; the church refusal
point was re-measured and its residual named with a measured cause.

## What changed

**Created**
- `src/view/reconstruct-compose.mjs` (+8 tests) — pure delta-composition: roof + shaped artifacts
  (both pinned to the same regularized shell) diffed and composed; overlap THROWS naming both
  deltas (tripwire, no merge policy); empty list is a byte-identical passthrough.
- `src/view/component-plan.mjs` (+13 tests) — the consumption plan: roof program (SHAPED course
  cells as the paint-protection set; full delta + fitted gable footprints as the conformance
  target), frame recipe (corner columns from slab intersections, crown under the defined roof),
  wall-face predicate, `wallTop` (the defined wall/roof boundary), `bandFloorLines` (storey lines
  from the concept-band boundaries), `planCensusZoneOf` (program cells census as roof; off-slab
  and classified-frame cells as `<band>:offslab`/`:frame` — measured, never gated),
  `programConformance`, serialize/revive (the gate re-runs the SAME op). Pin mismatch THROWS.
- `benchmarks/sculpture/component-skin.mjs` + `reskin:{cottage,gatehouse,church}` — the T-106
  orchestrator/record: component-layer pins, milestone distillation, per-band wall-field
  decomposition, zone-map re-pin (`zone-map/<subj>.reconstructed.json` — NEW records; the
  committed zone-map/v1 describes the unchanged standalone E-24 path).

**Modified**
- `benchmarks/sculpture/challenge-milestone.mjs` — the reconstruct stage in `runChain`: load the
  committed component layer, verify every pin against the IN-CHAIN regularized shell (drift
  THROWS), compose, write `reconstructed-artifact.json` + the serialized plan (post-skin, so it
  carries the ARBITRATED wallTop), feed buildSkin via the existing disk seam.
- `benchmarks/sculpture/durable-skin.mjs` (buildSkin) — all seams behind `def.componentPlan`
  (null = byte-for-byte today's path, proven by `skin:cottage --repro/--offline` against the
  committed record): program-cell region in fill/salt + splat skip; course family into the roof
  zone's own vocabulary; conformance check replaces basin-fill on the program footprint; plan
  census at all three gate sites; wall-top pin with ATTEMPT-LADDER arbitration (rejected by
  extraction readability → occupancy wins, named); gate failures carry the failing band's census
  decomposition (the AC #4 "measured cause" lands in pipeline-failed records).
- `benchmarks/sculpture/placement-grammar.mjs` / `src/form/placement-grammar.mjs` — `frames`
  override consumed verbatim (`frame.source` recorded); grammarStage threads the plan (frames,
  effective wallTop, band floor lines, plan census with `:frame` routing).
- `benchmarks/sculpture/styled-milestone.mjs` — plan through grammar AND settle; settle is now a
  fixpoint of BOTH ops the kit-presence checker re-runs, converging by the CHECKER'S criteria
  (frame wants + foreign fill + gating dressing slots; own-vocab residue and the lintel/sill ↔
  run-rule ping-pong are its tolerated classes).
- `benchmarks/sculpture/multi-angle-gate.mjs` — revives the persisted plan beside the artifact:
  pinned upperTop, component frames + band floor lines for kit-presence, plan census per view,
  `definedCells` (reconstruction edits ∪ raw-base cells) for blocked-mount tolerance.
- `src/form/kit-presence.mjs` — `frames` passthrough + `definedCells`: a shutter mount blocked
  entirely by DEFINED geometry is a named reduction like no-jamb; junk still gates.
- `src/view/opening-dressing.mjs` — blocked-shutter conflicts carry their positions.
- `src/view/surface-pattern.mjs`, `src/view/face-paint.mjs` — `regions`/`skip` (default-inert).
- Registries: church's component layer pins the chain-canonical caged shell
  (`durable-skin.SUBJECTS.church.regularizedShell` consumed by roof/shaped/components runners) —
  the standalone T-102 artifact was cut from the stale pre-cage-wiring challenge shell.

**Committed evidence**: `component-skin/*`, refreshed `styled/{cottage,gatehouse}*` +
`challenge/church*` + re-cut `components|shaped|roof/church*`, `zone-map/*.reconstructed.json`,
`multi-angle/*-styled*`, frames. Commits: 9 feature + this docs commit, all path-scoped.

## Acceptance criteria

1. **Consumption seams, each unit-tested vs the occupancy fallback** ✅ — roof courses follow the
   generated planes (program region + conformance replacing the sampled-top basin-fill); frame
   lines from component edges (slab-intersection corners, crown under the defined roof; floorLine
   from the concept-band boundaries — the occupancy storey scan reads every layer of a cage-solid
   shell as a floor, 1456 phantom beam cells on the first caged-grammar pass); wall fields are the
   slab faces (gate census over the defined field; `:offslab`/`:frame` measured in the same
   record); zone maps re-derived in-chain and re-pinned where bands shifted (wallTop pins the
   y-mapping; `zone-map/<subj>.reconstructed.json` with embedded diffs). Per-seam record-vs-
   fallback test pairs in component-plan.test.mjs (equality on clean geometry, divergence under
   noise).
2. **Graceful fallback, recorded** ✅ — absent records are named findings
   (`roof-program-missing/-fallback`, `component-record-missing`, …); plan-less subjects are the
   untouched code path: `skin:cottage --repro` and `--offline` re-verify the committed durable-skin
   record byte-identically. Pin mismatches THROW (drift never degrades) — exercised live by the
   church (stale standalone-regularize pins caught; upstream re-cut, not relaxed).
3. **Full re-skin of all three** ✅ — cottage + gatehouse through the styled chain (grammar,
   dressing, settle, kit-aware gate): chains COMPLETE, double-run byte-identical, fresh-process
   `--repro` REPRODUCES; **kit presence PASSES on the cottage** (and the gatehouse). Church
   through the challenge chain (kit-less by registry — kit extraction needs a zone-map record;
   styled:church remains kit-blocked, named). Gate verdicts: FAIL on resemblance only (below).
4. **Church band0 re-measured** ✅ (the honest-finding branch) — on the reconstructed shell the
   refusal reproduces at stone=0.327 < 0.5, and the record now carries its measured cause: the
   DEFINED wall field (2082 cells) is 59% polished_basalt / 33% stone, with on-slab ≈ off-slab
   composition — the residual is NOT blob noise (T-106's removal target) but a material-assignment
   divergence: the concept band declares stone dominant while the provisioned wall is
   basalt-dominant, kept as a legitimate declared secondary by the fill's own rules. The milestone
   decides what follows (an E-21/value-true assignment question, or a kit for the church).
5. **Named chain, no subject constants, tests green** ✅ — `reskin:*` over the component-aware
   `styled:*`/`challenge:*`; subjects are registry data (incl. the church shell override);
   `npm test` 1364 pass / 0 fail.

## Test coverage

23 new unit tests (reconstruct-compose 8, component-plan 13, opening-dressing/grammar additions)
plus default-inert pins in the three paint-op suites. Integration is the live runners' hard
asserts (pins, double-run byte-identity, fresh-process repro, THROW gates), the established
pattern. **Gaps**: `frameLinesFromComponent` against a REAL multi-mass record is exercised live
(gatehouse/church) but not unit-fixtured; the settle's tolerated-residue convergence is proven
live (gatehouse) — a synthetic ping-pong fixture would pin it; `component-skin.mjs` itself has no
unit tests (pure distillation, mirrors sibling runners).

## Open concerns (for the human reviewer)

1. **Resemblance verdicts are FAIL on all gated subjects — roof form at oblique views.** The
   pinned T-097 stair-lens gap (prismarine-viewer renders no stair states): the judge sees a
   notched solid wedge where the program placed stair courses. Geometry is proven by the
   unmapped-state THROW gate + the pure-rasterizer IoU; pixels are the lens's debt. S-107 owns the
   re-verdict; if it needs stair pixels, the lens fix (E-22-class) comes first.
2. **The blocked-shutter tolerance** (defined-geometry mounts) is a semantic widening of the
   kit-presence contract, scoped to component subjects (`definedCells` null elsewhere). The
   cottage opening it tolerates was ALWAYS untreatable (raw-base timber occupies the mount; the
   old run tolerated it via a no-jamb accident of the blob). Worth a look at whether
   "raw-base cells" is the right defined set or too generous.
3. **Stale E-25 challenge records** (`challenge/{cottage,gatehouse}.json`) diverge under
   `--repro` by design — the chain now composes the reconstruction. Left as committed T-095
   evidence; re-running would refresh them at the cost of two judge runs. The styled records
   supersede them as the canonical chain outputs.
4. **Church's standalone T-102 record is stale evidence**: regularize/church/artifact.json was
   cut from the pre-cage-wiring challenge shell; its expect pins describe that input, so it
   cannot be re-run against today's chain shell. The component layer now pins
   `challenge/church/shell-artifact.json` (chain-canonical, reproduced every run). If T-102's
   census evidence should track the new shell, that's a small upstream ticket (new expect pins).
5. **Church roof program is a named FALLBACK** — every fitted gable pair is INSANE on the blob
   geometry (ridge below eave, sub-minRun runs) and there is no kit family. The church composes
   shaped-only. Unblocking it needs either a better component fit (T-103 alignment on the church)
   or a church kit; both are downstream calls.
6. **The settle's tolerated ping-pong** (lintel/sill vs the fill's run rule) is now an explicit,
   recorded steady-state (`settle.tolerated`). If a future ticket wants lintels to SURVIVE the
   fill, the fix is declaring them (a region or run-rule extension), not loosening the checker.
7. **Working-tree hygiene**: sibling-session noise (`.lisa*`, tickets) never staged; all commits
   path-scoped.

## Commits

`reconstruct-compose` → `component-plan` → `bd6cd9d` inert params → `8db75f7` buildSkin seams →
`4a5172a` reconstruct stage → `0853909` styled+gate consumption → step-7 runner → `a041c84`
arbitration/settle/cause/canonical-shell → `557a2f8` evidence → this docs commit.
