# T-175-01 — Plan: ordered, verifiable steps

Each step is committable. Testing strategy: the engine is proven by the `src/view/treatment-grammar.test.mjs`
unit suite on synthetic geometry (the AC's "geometry→edge-sets, unit-tested on square/rectangle/with-opening"
+ the recess/closure guards); the gatehouse proof is the **render** (the glance, AC #2/#4), judged by eye and
recorded honestly in FINDINGS.md. `npm test` must stay green and grow.

## Step 1 — the engine (`src/view/treatment-grammar.mjs`)

Write the module per `structure.md`:
- `TREATMENT_GRAMMAR_SCHEMA`.
- `deriveEdges(occ, {faces, floor, eaveY})` — private `faceSkinExtrema` (projectSurface first-hit, like
  `facade-articulation.faceSkin`) → footprint bbox + the 4 corner columns + `cornerKey` Set + top/bottom rows
  + band. Pure, returns plain JSON-able data.
- `composeTreatment(occ, spec, {faces, floor, eaveY, extractApertures, dressOpenings})` — layer order
  base→field(recess no-op)→corners(quoin)→top(surfaceRelief, cornerKey-excluded zoneOf)→opening(injected).
  `overlay` fold; accumulate placements + per-layer report; call `recessClosureGuard`; return
  `{occ, placements, edges, report, closure}`.
- `recessClosureGuard(before, after, {floor, eaveY})` — `ringIn` restricted to the before footprint bbox;
  `ok = closureOf(after') >= closureOf(before') && !droppedColumns.length`.
- Fail-loud validation: spec required; amplitude ints ≥ their floor; faces known (reuse the brushes'
  validators by delegating — the quoin/surfaceRelief calls already throw on bad input, but validate
  `spec`/`eaveY`/`floor` presence up front).

**Verify:** `node --check src/view/treatment-grammar.mjs`.

## Step 2 — the unit suite (`src/view/treatment-grammar.test.mjs`)

Write TG1–TG13 (structure.md coverage map). Fixtures: `boxStub(w,h,d)`, `boxWithOpening()`. Key assertions:
- derivation correct on square AND rectangle AND with-opening (TG1–3);
- compose places per layer, cornice excludes corners (TG4–5);
- recess-by-exclusion is additive only (TG6); guard ok on additive (TG7) and TRIPS on a synthesized carve
  (TG8 — teeth);
- `reliefNoRegress` in-plane preserved (TG9); idempotent (TG10); opening seam injected/absent (TG11);
  fail-loud (TG12); pure + serializable (TG13).

**Verify:** `node --test src/view/treatment-grammar.test.mjs` green, then full `npm test` green (baseline
~2249 → +13). Commit: `feat(T-175-01): compositional treatment grammar engine + edges-from-geometry + closure guard`.

## Step 3 — the serialized rustic gatehouse spec (`docs/active/work/T-175-01/rustic-gatehouse.treatment.json`)

The hand-authored spec at A's restraint:
- `base`: `{material:"stone_bricks", amplitude:{depth:1}}` (a water-table course).
- `field`: `{recess:true}`.
- `edges.corners`: `{material:"cobblestone", amplitude:{headerDepth:2}}` (full-height rubble quoins — the
  load-bearing detail; run derived = eaveY-floor+1).
- `edges.top`: `{material:"stone_bricks", amplitude:{depth:1, courses:1}}` (single eave band, corner-excluded).
- `edges.opening`: `{frame:"dark_oak_log", door:"spruce_door", light:"lantern"}` (the timber arch reveal).
- No mid-field belt / string course (B's busy tell — omitted by design).

**Verify:** `node -e 'JSON.parse(fs..)'` round-trips; matches the engine's expected shape.

## Step 4 — the runner (`experiments/eval-alignment/treatment-beside.mjs`)

Per structure.md: load faithful gatehouse + spec; render the **token baseline** (quoin run=4 hd=1) beside
concept → `baseline-beside.png`; `composeTreatment` with injected `extractApertures`/`dressOpenings` →
`rebuildArtifact` → render beside concept → `treatment-beside.png`. Print `report.byLayer`, `closure`, and a
`reliefNoRegress` verdict; assert `closure.ok`. (No judge, no chain, no pin write.)

**Verify:** `node --check experiments/eval-alignment/treatment-beside.mjs`.

## Step 5 — render the gatehouse (the proof)

Run the runner (GL available this session). Confirm:
- it completes, `closure.ok === true` (recess didn't reopen holes — AC),
- `report.byLayer` shows quoins + base + cornice + arch all placed (non-zero),
- the two PNGs land in the work dir.

**Verify:** open `treatment-beside.png` vs `baseline-beside.png` beside the concept; check the quoins, the
trim band, the recessed field, and the arched reveal all READ (AC #2).

## Step 6 — FINDINGS.md (the honest glance call — AC #4)

Record on the render: richer or busier? Localize (amplitude vs composition). Numbers: closure before/after,
per-layer cell counts, `reliefNoRegress` verdict. Note generalization: derivation tested on square+rectangle
(+ with-opening) → passes; two-mass/L-mass + gable untested → S-176 (named, not hidden). State the one taste
call the reviewer owns (A's hd2 vs B's hd3).

**Verify:** FINDINGS.md present; matches the renders. Commit:
`docs(T-175-01): rustic gatehouse treatment spec + render beside concept + FINDINGS`.

## Step 7 — Review (`review.md`)

Self-assess: files changed, test coverage + gaps, open concerns (busy ceiling, two-mass generalization,
roof/opening generalization deferred to S-176), what the human reviewer must check (the render + the hd2/hd3
taste call). `npm test` green count stated.

## Risks & mitigations
- **Reads busy** (the epic's #1 failure) — mitigated by A's restraint (no string course); if busy, say so on
  the render and localize (it is the honest, reportable outcome).
- **Recess reopens holes** — additive-only + `recessClosureGuard` (asserted in the runner, tested with teeth).
- **Cornice/quoin overlap** — fixed by the corner-excluded cornice zoneOf (TG5).
- **GL absent** — `assertGlAvailable` is loud; render path proven this session.
- **Brush-door tripwire** — the new module never imports `opening-dressing`; dressing injected (TG11).
