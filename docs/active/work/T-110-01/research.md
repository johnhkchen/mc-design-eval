# T-110-01 church-unblock — Research

Descriptive map of everything the ticket touches. No solutions proposed here (those are design.md).

## 1. The two recorded failure causes (evidence)

`benchmarks/sculpture/reconstructed/church.json` (committed at T-107-01) records the church chain as
`status: pipeline-failed, stage: skin`, with findings:

1. **`chain-refused`** — `coverage gate FAILED on the final skin: band0 stone=0.327 < 0.5`, census:
   `band0={total:2082, byBlock:{polished_basalt:1225, stone:681, black_stained_glass:100, dark_oak_planks:76}}`
   plus `band0:offslab={total:5109, byBlock:{polished_basalt:3525, stone:1270, ...}}`.
   (1225+681)/2082 = **0.915 stone-family**; the gate counted only the literal name `stone`.
2. **`roof-program-fallback`** — `roof/church.json` is `status: "fallback"`; all four ladder rungs
   rejected with `"nothing generated (no sane in-tolerance gable or no kit family)"`.

## 2. Where the literal-name census lives (cause 1)

### The gate path
- `benchmarks/sculpture/durable-skin.mjs` `buildSkin()`:
  - step 6 front-candidate precondition: `dominantCoverage(...)` + `coverageGate(cov, {threshold, zones: policyS})`
    (durable-skin.mjs:495–497) — metric defaults to `"dominant"`.
  - step 9 terminal gate: same pair at durable-skin.mjs:566–568; failure throws at :578 with the
    full failing-zone census (`:offslab`/`:frame` complements included, T-106-01).
  - splat-only baseline gate at :520–522 (expected `passed:false`, asserted by `--offline` :655).
- `benchmarks/sculpture/placement-grammar.mjs:145–147` — `grammarStage` **re-asserts the same gate**
  after frame/fill (and again in the styled settle pass). If only durable-skin moves, the church
  chain re-throws here.
- `benchmarks/sculpture/multi-angle-gate.mjs:355–357` — **already** uses
  `ownCoverage` + `coverageGate(..., {metric:"own"})` (the T-101 fix; per-view coverage).
- `benchmarks/sculpture/spray-paint.mjs` — historical per-ticket measurement record (T-090);
  project convention is that those runners stay untouched as committed measurements.

### The pure cores (already exist, E-26/T-101)
- `src/view/zone-fill.mjs`: `surfaceZoneHistogram` (block census per zone), `dominantCoverage`
  (decorates with one intended dominant), **`ownCoverage`** (:238) — adds `own` (dominant ∪ preserve,
  the zone's declared vocabulary) and `ownFraction`; documented **strictly monotone** (own ⊇ dominant);
  rows carry BOTH `dominantFraction` and `ownFraction`.
- `src/view/face-resemblance.mjs`: `coverageGate(coverage, {threshold, zones, metric})` (:78) with
  `metric: "dominant" | "own"`; `"own"` gates on `ownFraction`. `DEFAULT_COVERAGE_THRESHOLD = 0.5`.
- Both have unit tests (`zone-fill.test.mjs`, `face-resemblance.test.mjs`).

### Why band0 holds two stone blocks (mechanism of the bug)
- The zone map is concept-derived: `extractConceptZoneMap` (src/color/band-profile.mjs) reads bands
  off the concept; each band gets a `dominantBlock` plus `secondaries` — **both resolved from the
  committed material map's roles** (band-profile.mjs:339–369). `zonesFromBands`
  (src/view/zone-map.mjs:51) turns these into `{dominant, preserve: secondaries, splat}` policies.
- `material-map/church.json` assigns TWO stone-family roles that share band rows: "structural wall
  body" = `cobblestone` (walls) and "corner quoins / plinth course" = `stone_bricks` (corners-edges,
  base).
- The naming seam: `mapPolicy(policyNamed, subK)` (durable-skin.mjs:216, applied at :434) maps the
  named policy through the **value-true substitution + kit overrides** (`subK`). For the church run,
  value-true switched `cobblestone→polished_basalt` and `stone_bricks→stone`. band0's dominant became
  `stone`; `polished_basalt` sits in band0's **preserve** (the fill kept it in runs — which is why
  59% of the band survived the base coat as basalt).
- So the band's *own* vocabulary (dominant + preserve) already IS "the intended role's block set at
  its naming seam"; only the gate's metric ignores it. This is the third kit-blind-gate instance
  (T-095 kit-renamed bands censused 0; T-101 dominant-only rejected the styling — fixed for the
  multi-angle gate's per-view coverage but not for the T-088 terminal/front gates).

### Census zone names
`planCensusZoneOf` (src/view/component-plan.mjs:332) routes roof-program cells to `roof` and
off-slab wall cells to `<band>:offslab`; offslab/frame zones have no policy entry so they are
measured, never gated (durable-skin.mjs:459 comment). Gated zones = `Object.keys(policyS)`.

## 3. Where the whole-mass roof fit lives (cause 2)

- Runner: `benchmarks/sculpture/roof-program.mjs` (`npm run roof:church`). Flow: read regularized
  shell (`SUBJECTS.church.regularizedShell = challenge/church/shell-artifact.json`, sha-pinned to
  `components/church.json` `source.sha256`) → `gablesFromRecord(record)` → `roofFamily(kit, vocab)`
  → ONE `swapRoof(occ, {gables: fit.gables, family, refSils, regions, protect, chimney})`.
- `gablesFromRecord` (src/form/roof-fit.mjs:209) pairs **all** reciprocal pitched planes in the
  record into gables — no mass awareness in the *invocation*; however every roof plane in
  `component-record/v1` carries `massId`, so a gable's component is derivable from its sides'
  planes.
- `components/church.json` masses: `mass-0` primary y0–23 (**nave**, roof-0..11), `mass-1` attached
  y0–32 (**tower**, roof-12..15), `mass-2` attached y7 (roof-16), `mass-3/4` protrusions. Church fit
  produced 3 gables: `gable-roof-1-roof-5` (nave, insane), `gable-roof-3-roof-7` (**nave, sane**),
  `gable-roof-14-roof-15` (tower, insane: "no sane pitch (voxel 19, glb 189.361)").
- `swapRoof` (src/view/roof-swap.mjs:243) runs a 4-rung attempt ladder; each rung is
  `judgeVariant` (:127): `gatedGenerate` over **all sane gables at once**, then carve+compose+cage.
  `judgeVariant`'s carve is **footprint-scoped** (`activeCols` from the generated heightfield,
  :143–155) and the cage checks are whole-build (silhouette IoU at 4 azimuths vs `refSils`, closure
  no-regress, protect). Nothing in it prevents sequential per-gable-set invocations on the threaded
  occupancy.
- The church rejection is the `!gen.cells.length` branch (roof-swap.mjs:138–140): **no kit family**
  — `roofFamily` (src/view/roof-generate.mjs:45) derives the course family only from kit rows
  (`formClass:"cube"`, `whereUsed` includes `"roof"`), and `SUBJECTS.church.kitRecord` is `null`.
  Even the sane nave gable cannot generate without a family. So cause 2 has two strands:
  (a) one whole-mass invocation, all-or-nothing accept; (b) no church kit ⇒ no course family.

### Roof record consumption downstream
- `challenge-milestone.mjs` `loadReconstruction` (:227) reads `roof/<subj>.json` +
  `roof/<subj>/artifact.json`; requires `roofRecord.status === "accepted" && roofRecord.swap?.accepted`.
- `roofPlanFromRecord` (src/view/component-plan.mjs:55) consumes `record.status`, `record.swap.accepted`,
  `record.family` (field/stairs/slab), `record.fit.gables[].footprint.bbox`, plus the artifact delta.
  Committed cottage/gatehouse roof records use this exact shape and must remain valid.

## 4. The chain the church must complete (AC3)

`npm run styled:church` = `styled-milestone.mjs`: kit record (read-only) → `runChain` (exported from
challenge-milestone: provision → shell integrity → T-102 cage → T-106 reconstruct → buildSkin with
the component plan) → `grammarStage` (T-098) → opening dressing (T-099, treatments **from the kit**)
→ grammar settle fixpoint (T-100) → kit-aware multi-angle gate (`multi-angle-gate.mjs --label styled`;
**both gates**: resemblance AND kit presence; exit 0/1/2). styled-milestone fails honestly on a
**missing kit record**. `challenge:church` is the kit-less subchain (its gate is resemblance-only).

### Kit extraction (AC3 "first time reachable")
- `benchmarks/sculpture/kit-extract.mjs` (`npm run kit:extract`, supports `--subject=<k>`): one-time
  STRONG-tier LLM call via the `claude -p` shim, verbatim reply committed as `kit/<subj>.raw.json`;
  `--offline` reproduces `kit/<subj>.json` byte-identically. It has its **own SUBJECTS table**
  (cottage, gatehouse only — no church row).
- Hard input: a **committed concept-derived `zone-map/v1` record** — `bandRefsFromZoneRecord`
  (src/form/kit.mjs:117) throws otherwise. `zone-map/church.json` does not exist.
- `npm run zone:map -- --subject church` would derive one (zone-map.mjs uses the durable-skin
  registry; church `build: challenge/church/base-artifact.json` is committed) — but it calls
  `buildSkin(def)` which currently **throws at the same band0 gate**, so it is blocked behind the
  census fix. (Obs 13400: church zone-map was explicitly deferred for this reason.)
- Once `kit/church.json` exists, registering `kitRecord` on `SUBJECTS.church` feeds: the skin's kit
  overrides (renaming seam), `roofFamily`, dressing treatments, and the kit-presence gate.

## 5. Sibling-ticket boundaries (E-28 runs T-108-01 in parallel)

- **T-108-01 (gable-and-verge-fit) is live right now** (observations 14222/14224 at 9:28pm name its
  research). Its modules: `src/form/roof-fit.mjs`, `src/view/roof-generate.mjs`,
  `src/view/roof-swap.mjs` (+ the cottage/gatehouse roof runs). T-109-01 (ridge/silhouette) follows
  it on the same cores. **T-110-01 must not modify those three pure cores or their tests.**
- Shared-file risk: `benchmarks/sculpture/roof-program.mjs` — T-108 will likely re-run/extend the
  same runner. Lisa's DAG declared the tickets parallel (same-file edits would be a missing edge);
  commit-lock serializes commits but not semantics. T-110 edits there should be additive and minimal.
- T-111-01 (closure milestone) owns re-judging everything; T-110 records the church's **first**
  verdicts only (AC4: no re-rolls).

## 6. Constraints and conventions in force

- **E-28 Rule 1 discipline** (per AC1): monotone proof (every previously passing view/record still
  passes, test-asserted), both fractions in new records, committed records untouched and still
  valid, thresholds/azimuths/judge untouched, reasoning recorded.
- Monotone replay material exists: committed `durable-skin/{cottage,gatehouse}.json`,
  `challenge/{cottage,gatehouse}.json`, `styled/{cottage,gatehouse}.json` all carry per-zone
  `byBlock` censuses plus the shipped policy (`fill.policy` / `skin` equivalents) — enough to
  recompute `ownCoverage` from committed data in a unit test without GL.
- Determinism: every chain stage double-runs byte-identical; `--repro` / `--offline` re-assertion;
  GL renders and the judge are evidence/verdict, never decision inputs. LLM calls allowed only as
  one-time committed records (the kit) and the pinned gate judge.
- Registry-only generalization (E-25 Rule 3): runners carry no subject keys/branches; church changes
  go in SUBJECTS tables (durable-skin, kit-extract) as data.
- `npm test` = the pure suites (root 1364 + render 46 at T-107); runners are *not* in `npm test`.
- The seam invariant: decisions in unit-tested `src/` cores; `benchmarks/sculpture/*.mjs` is impure
  wiring.

## 7. Open facts a later phase must respect

- The offline check `gateSplatOnly: rec.coverageGate?.splatOnly?.passed === false` (durable-skin:655)
  assumes the splat-only baseline keeps failing; a metric change applied to the baseline could make
  it pass on some subject and trip `--offline` on *new* records.
- `zone:map church` derives bands from the **base** artifact while the chain derives them live from
  the reconstructed build (chain passes `zoneMapRecord: null` and only audits the diff via
  `zoneMapVsCommitted`) — the cottage/gatehouse precedent; divergence is recorded, not gated.
- The tower gable (`gable-roof-14-roof-15`) is insane on *fit grounds* (voxel pitch 19, glb 189°) —
  per-component invocation will likely yield nave=generated / tower=named-fallback; the AC accepts
  named fallbacks per component ("fit errors (or named fallbacks) recorded per component").
- Shell sha `50fce80f…` is unaffected by any of this (kit/census touch the skin only; provision uses
  the material map), so the component/roof record pins stay valid.
