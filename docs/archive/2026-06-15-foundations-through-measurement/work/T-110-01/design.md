# T-110-01 church-unblock — Design

Two decisions to make: (D1) how the coverage census gains role-family identity, and (D2) how the
roof program becomes per-component. Plus the sequencing that makes the church chain reachable (D3)
and what "first verdicts" means operationally (D4).

## D1 — Census role-family identity

### Options considered

**A. Gate the live skin gates on the existing own-vocabulary metric** (`ownCoverage` +
`coverageGate(..., {metric:"own"})`). The band's own set (dominant ∪ preserve) is *by construction*
the material map's roles for that band, mapped through the one renaming point (`mapPolicy∘subK`) —
i.e. exactly "the intended role's block set at its naming seam". Monotonicity (own ⊇ dominant) is
already documented and unit-tested at the core level; the multi-angle gate moved to this metric at
T-101 and survived review. Both fractions ship for free (`ownCoverage` rows carry `dominantFraction`
AND `ownFraction`).

**B. A new role-family census keyed directly off the material map** (e.g. group map rows into
families and census family membership). Rejected: it creates a SECOND naming path from roles to
shipped blocks, parallel to `mapPolicy∘subK`. The kit-blind-gate class is precisely "two naming
paths disagree at a seam"; adding a third path invites the fourth instance. The map's role
information already flows into band policies via band-profile secondaries — reuse that artery.

**C. Re-point band0's dominant at the wall-body block** (would read basalt=0.588 ≥ 0.5). Rejected:
still a literal single-name gate; fails the moment a band legitimately splits its field across two
family members again. Also alters the zone-map derivation, which T-092/T-101 records pin.

**Decision: A.** It is the smallest change that makes the gate's question match the band's declared
vocabulary, it reuses the T-101 fix's proven machinery, and its monotone proof is structural.

### Scope of the metric switch (which gates move)

- `durable-skin.mjs` step 6 (front-candidate precondition) and step 9 (terminal gate): census via
  `ownCoverage`, gate via `metric:"own"`. The throw message reports **both** fractions
  (`stone=0.327 own=0.915`-style) plus the census decomposition it already carries.
- `placement-grammar.mjs` gate (re-asserted post-grammar and again in the settle fixpoint): same
  switch — otherwise the church chain passes the skin and re-throws one stage later. Its band
  evidence arithmetic (own-set fraction) is unchanged.
- **The splat-only baseline gate stays on `metric:"dominant"`.** It is a frozen counterfactual
  (the E-23 replay), kept on its historical metric exactly like the legacy replay keeps its
  historical zone source (durable-skin.mjs:511 precedent). Switching it could flip the baseline to
  PASS on some subject, violating the `--offline` invariant (`splatOnly.passed === false`) and
  muddying the "proof both ways" contrast. Its *census* still upgrades to `ownCoverage` so the
  record reports both fractions; only its gate metric is pinned, with a recorded note.
- `spray-paint.mjs` and other per-ticket measurement runners: untouched (committed measurements).
- The multi-angle gate already gates on own (T-101) — untouched. Thresholds (0.5), azimuths, judge:
  untouched (AC).

### Monotone proof (E-28 Rule 1)

Two layers, both in `npm test`:
1. Core-level: `coverageGate(metric:"own")` over `ownCoverage` passes whenever
   `coverageGate(metric:"dominant")` over the same census passes (property already asserted at
   T-101's tests; extend if any gap).
2. **Record replay**: a new test loads the committed `durable-skin/{cottage,gatehouse}.json`,
   `challenge/{cottage,gatehouse}.json`, and `styled/{cottage,gatehouse}.json` records, recomputes
   `ownCoverage` from each record's per-zone `byBlock` census + its shipped policy, and asserts the
   own-metric gate passes every zone the dominant-metric gate passed (and that the recorded
   `final.passed === true` records still pass under the new gate). This proves no previously
   passing record regresses — against the real committed data, not synthetic fixtures.

Committed records are not rewritten; old records lacking `ownFraction` stay valid because nothing
re-gates them (offline checks read recorded booleans).

## D2 — Per-component roof fit

### Options considered

**A. Group fitted gables by component mass and run the existing `swapRoof` ladder once per
component, sequentially threading the occupancy** (accepted swaps compose; rejected components fall
back named, per component). No change to roof-fit/roof-generate/roof-swap — the grouping is a new
small pure core, and the runner loops. `judgeVariant`'s carve is footprint-scoped and its cage is
whole-build, so a per-component swap is judged in the context of everything accepted so far — the
cage semantics we already trust.

**B. Teach `swapRoof` itself to partition by mass internally.** Rejected: those three cores are
T-108-01's live working set (collision), and it changes the ladder's contract for the committed
cottage/gatehouse records' semantics.

**C. Do the per-component split in the chain (`loadReconstruction`).** Rejected: the roof program
runner owns fit+swap; the chain only consumes its committed record (T-106 contract).

**Decision: A.** Sequencing order: components sorted primary-first (then by id) — the nave's large
mass establishes the silhouette before attached masses are judged against it; deterministic order,
recorded.

### New pure core: `src/form/component-roof.mjs`

`componentGableGroups({ record, gables, findings })` → `[{massId, role, gableIds, gables}]`:
resolves each gable's mass via its sides' `planeId` → `record.roofPlanes[].massId` (a gable pairing
planes from two masses is itself a named finding and groups with its first plane's mass), carries
per-mass insane gables too (their fallbacks are reported per component). Pure, unit-tested against
a synthetic record and the committed `components/church.json` (nave/tower split: roof-3/7 → mass-0,
roof-14/15 → mass-1).

### Runner change (`roof-program.mjs`)

- After `gablesFromRecord`: group via `componentGableGroups`; loop groups; per group call `swapRoof`
  on the current occ with only that group's gables (same family/refSils/regions/protect/chimney);
  if accepted, thread `swap.occ` forward.
- Record (additive, back-compatible): top-level `fit`/`family` unchanged; new
  `components: [{massId, role, gables, swap: {accepted, reasons, attempt, iou, fitError, census, …}}]`;
  top-level `swap` becomes the composition summary — `accepted = any component accepted`, reasons/
  findings concatenated with component prefixes, `attempts` preserved per component. `status` stays
  `"accepted" | "fallback"` (accepted iff any component accepted) so `loadReconstruction` and
  `roofPlanFromRecord` keep working unmodified (`fit.gables[].footprint.bbox` and `family` are
  already whole-record). The artifact is the final threaded occ rebuilt once.
- `assertAcceptance` budget: `6 ×` gables generated across accepted components (same geometric
  formula, summed).
- Committed cottage/gatehouse roof records remain valid: they predate `components` (absent field) and
  nothing re-reads them differently; their next live run would produce a single-group record with
  identical acceptance (single mass ⇒ one group ⇒ today's behavior), which the cottage `--repro`
  cannot certify against old shas if the record *shape* changed — note: `--repro` compares artifact
  sha + status only, both unchanged for single-mass subjects. Verified in plan.

### Course family for the church

Stays **kit-driven** (no new family source): D3 sequences church kit extraction *before* the roof
re-run, so `roofFamily` gets real rows (`dark_oak_planks` roof field ⇒ `dark_oak_stairs`/`dark_oak_slab`
exist in vocab). If the church kit lacks a roof cube row, every component falls back named — the
AC's tolerance-or-named-fallback contract, honestly recorded. No material-map fallback path is added
(same one-naming-path argument as D1/B).

## D3 — Making the chain reachable (sequencing)

1. **Census fix first** (D1). Unblocks `zone:map -- --subject church` (it calls `buildSkin`, which
   currently throws at band0).
2. `npm run zone:map -- --subject church` → committed `zone-map/church.json` (concept-derived; the
   chain keeps deriving live and auditing the diff — cottage precedent).
3. Add church row to `kit-extract.mjs` SUBJECTS (registry data); `npm run kit:extract --
   --subject=church` (one-time STRONG-tier LLM; raw reply committed) → `kit/church.{json,raw.json,md}`.
4. Registry update (`SUBJECTS.church`): `kitRecord: "kit/church.json"`,
   `zoneMapRecord: "zone-map/church.json"` (audit seam only — the chain passes `zoneMapRecord:null`).
5. D2 + `npm run roof:church` (family now derivable; per-component outcomes recorded; shell sha pin
   `50fce80f…` unaffected by kit/census, so `components/church.json` stays valid).
6. `npm run challenge:church` (resemblance gate) and `npm run styled:church` (the full AC3 chain:
   kit → shell → cage → reconstruct → skin → grammar → dressing → settle → **both gates**), plus
   `--repro` for the fresh-process determinism proof.

Note the kit overrides change the church skin's substitution (the renaming seam) — band dominants in
shipped space may shift from the T-107 census. The own-metric gate is driven by the same seam, so it
follows automatically; whatever residual remains is re-measured and named with its decomposition
(the AC's "or" branch).

## D4 — First verdicts, no re-rolls

The styled/challenge runs are executed ONCE live; their gate verdicts (PASS/FAIL/REFUSAL, per-view
gaps), contact sheets, and the kit report are committed as-is. No prompt/threshold/azimuth changes in
response to verdicts (T-111-01 owns closure). Expected-but-not-required outcome per current
evidence: skin passes own-gate (0.915), nave roof generates, tower falls back named, gate FAILs on
named form gaps — all acceptable AC4 outcomes so long as every stage outcome is named in the record.

## Boundaries honored

- No edits to `roof-fit.mjs` / `roof-generate.mjs` / `roof-swap.mjs` (+tests) — T-108-01's live set.
- `roof-program.mjs` edits additive and minimal (loop + record fields) — flagged in review.md for the
  T-108 merge.
- No subject-specific constants anywhere: church appears only as registry rows; grouping and census
  logic are generic over the component record and the policy vocabulary.
