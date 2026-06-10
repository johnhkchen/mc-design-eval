# T-090-01 full-shell-zone-fill — Design

Goal: fill each structural zone's **6-dir-exposed** shell with its dominant material (preserving
declared secondaries and declared sub-regions), wire it into the spray-paint pipeline, prove it on the
cottage with exposure-band histograms and oblique renders.

## Decision 1 — Where the pure op lives: extend `zone-fill.mjs` with a `skin` option

Options considered:

- **(a) New module `full-shell-fill.mjs`.** Rejected: it would refork `inRun`, the policy validation,
  the placement emission, and the census — five near-identical copies of T-085-01 logic. The only
  difference from `zoneFill` is *which voxels are enumerated*.
- **(b) Change `surfaceVoxelEntries` to 6-dir exposure.** Rejected: it is THE canonical projection-skin
  iterator with a live external consumer (`surface-pattern.mjs`, T-087-01, in flight on a parallel
  thread). Changing its semantics changes `stripStraySalt`'s domain under that ticket's feet.
- **(c) CHOSEN: add a new pure generator `exposedVoxelEntries(occ)` (any-of-6-faces-air test, yields the
  same `{key, voxel, block}` shape) and a `skin: "projection" | "exposure"` option (default
  `"projection"`) on `zoneFill` and `surfaceZoneHistogram`.** Additive: every existing caller and all
  existing tests are untouched; the fill/census logic is written once; the two skins share one policy
  engine. An unknown `skin` value throws (same fail-fast style as `resolveDir`).

`exposedVoxelEntries` iterates `occ.cells` (deterministic insertion order) and yields any cell with at
least one of its 6 neighbors unoccupied — exactly the ticket's definition. It takes no `faces` param:
the 6-face test is fixed by spec. `-y`-only-exposed cells (e.g. the y=min underside) are included —
render-invisible recolors, harmless, and they match the ticket's own measurement definition; excluding
them would make the recorded histograms incomparable with the AC numbers. Hollow-interior skins are
also included by this definition; on the cottage the exterior-reachable delta is 10 cells (research §3),
and interior-aware filling is explicitly deferred (it belongs with the E-23 interior path, where
exterior dominants on interior walls would be *wrong*, not missing). Recorded as a known limit.

## Decision 2 — Replace the wall-field fill, don't stack a second stage

The projection skin is a strict subset of the 6-dir exposed set (research §3: every projected cell's
camera-side neighbor is air). So `zoneFill(..., {skin:"exposure"})` does everything the E-24 stage did
plus the missed cells — running both would emit ~2,450 redundant placements and two `fill` records.
**§0c becomes the one fill stage, switched to `skin:"exposure"`** ("replacing" per the ticket's
implementer's-call clause; recorded in the runner comment and the JSON record as `fill.skin`).

The old projection-skin fill is kept *as a replay* (like the §2b splat-only baseline): the runner
computes `zoneFill(occ, {skin:"projection"})` on the sealed build to produce the **before** build for
the AC #3 histogram and the AC #4 before-render — the "old fill" baseline reproduced by the pipeline,
not by checking out an old artifact (E-24 Rule 1).

## Decision 3 — Declared sub-regions: an explicit `regions` option on `zoneFill`

The chimney survives today via runs of roof-preserve cobble/bricks, but AC #1 names **declared
sub-regions** as a distinct mechanism, and runs-preservation is the wrong tool for it: a sub-region
keeps its material *because it is a declared design element*, not because it happens to form a ≥minRun
component (a 1-cell finial, or a chimney whose material is the *displaced field* of its zone, would
both be destroyed by the runs rule). Design:

```
zoneFill(occ, { zoneOf, zones, regions?: [{ name, contains: (voxel) => boolean }], ... })
```

A surface voxel matched by any region is KEPT unconditionally (before zone policy is consulted); kept
counts attribute to a `byRegion: {name: cells}` tally in the return. Regions are *declared by the
caller* (runner/design-doc territory) — the pure op stays subject-free (E-25 Rule 3). The cottage
runner declares none (its chimney is already covered by preserve-runs, and inventing a chimney bbox in
the runner would be a subject constant of exactly the kind E-25 bans); the mechanism is exercised by
unit tests on synthetic occupancy, satisfying AC #1 as written. Rejected alternative — auto-detecting
"the chimney" geometrically: out of scope, subject-shaped, and E-21's material map is the proper future
source of declared regions.

## Decision 4 — Census/coverage basis switches to exposure everywhere in the runner

The recorded coverage (`zones.coverage`), the T-088-01 gate inputs (splat-only replay, final skin,
front-candidate precondition), and the new band histograms all move to
`surfaceZoneHistogram(..., {skin:"exposure"})`. Rationale: the projection census just declared the
upper band 71% plaster while the camera saw 32% (research §3) — it is the same lying-instrument problem
as `render-aliasing-not-material-speckle`; the exposure census is the camera's truth. Predicted
post-fill dominant fractions (upper ≈.84, roof ≈.81, base ≈.64) all clear the 0.5 gate; the splat-only
replay fails it even harder (its upper plaster is sub-0.13 on the larger census). Both ways of the
T-088-01 proof survive. The record gains `coverage.skin: "exposure"` so the basis change is explicit;
offline replay compares recorded values against each other, so old records still verify (their numbers
were projection-based and internally consistent; the skip-if-absent precedent covers the new fields).

## Decision 5 — Cottage policy: `dark_oak_log` joins roof preserve

179 exposed roof-zone cells are dark_oak_log (gable timber framing classified "roof" by `y>=upperTop`;
research §5). Under the current policy the full-shell fill would recolor visible timber to spruce —
destroying a declared secondary, the exact thing AC #1 says to preserve. The upper zone already
preserves logs as the timber frame; the gable is that frame continued. So
`ZONE_POLICY.roof.preserve += dark_oak_log` (runner-owned subject config, where the policy already
lives — not a pure-op constant). With it, predicted roof after-composition: spruce ≈81%, logs ≈7.5%,
dark_oak_planks ≈2.1%, cobble (chimney) ≈9% → **roof-materials fraction (dominant+preserve) ≈100%,
comfortably ≥90%** even *without* excepting the chimney. Upper stone residue → 0% (stone is the
displaced field, not preserved in "upper").

## Decision 6 — Evidence wiring (AC #3, #4)

- **Band histograms**: `zones.bands = { skin: "exposure", before, after }`, computed with
  `dominantCoverage(surfaceZoneHistogram(build, zoneOf, {skin:"exposure"}), ZONE_POLICY)` on the
  *projection-fill replay* (before) and the final painted build (after). Bands = `zoneOf` zones — the
  same floor-line-bounded classification the fill uses (storeyDivide=7 / upperTop=14 reproduce the
  ticket's y-bands). Plus `zones.bands.acceptance = { roofMaterialsFraction, upperStoneFraction }`
  where roof-materials = dominant + preserve counts over the roof zone total. The live run **throws**
  if roofMaterialsFraction < 0.9 or upperStoneFraction > 0.05 (the E-24 hard-guard precedent: a
  marginal number cannot silently ship); `--offline` asserts the same from the record, skip-if-absent.
- **Oblique renders**: after the final commit step, render the before-replay and the painted build at
  `"-x-z"` (azimuth 225°, a diagonal the old fill failed on) via the existing `tryRenderFace`-style
  best-effort path (`renderViews` accepts the named diag). Files
  `cottage/view-oblique225-{before,after}.png`; recorded under `renders` with a GL-unavailable
  degradation note (same policy as face renders). Ensure the two evidence PNGs are committed (adjust
  the dedicated gitignore entry if it would catch them) — the render is the evidence (E-25 Rule 1).

## Rejected alongside

- **Switching `FILL_FACES` to include `-y`**: orthogonal knob, changes T-087's domain; not needed once
  exposure skin exists.
- **Exterior-reachable flood as the exposure test**: more code, 10-cell delta on the subject, and the
  padded-AABB flood belongs with the future hollow-interior story; the ticket's spec is plain 6-face.
- **Per-face hill-climb on oblique renders**: the gate stack is untouched; this ticket only fixes what
  the fill *covers* and what the census *sees*.

## Risk notes

- The exposure census counts ~2.2× the projection census; any consumer comparing absolute `total`s
  across records will see a step change — mitigated by the explicit `skin` field in the record.
- T-087-01 is concurrently wiring `surface-pattern.mjs` into a runner; this design touches
  `zone-fill.mjs` additively and `spray-paint.mjs` substantively. If T-087 lands spray-paint wiring
  first, rebase the runner edits (the lock serializes commits; the seams don't overlap functionally).
- Spruce eave/verge cells *outside* the roof zone (3.6% spruce in base) get recolored to stone — they
  are in the base zone by geometry. Acceptable: same behavior as E-24 for projected cells; visible
  effect checked in the render evidence.
