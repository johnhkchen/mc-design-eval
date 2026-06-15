# T-159-01 Review — generate-first watertightness

## What changed

All code in **`src/form/provision-generate.mjs`** (the generate-first construction stage) + its test
file. No change to `provision-fit.mjs` (evidence stays honest), `roof-generate.mjs`, or the runner.

### `src/form/provision-generate.mjs`
- **Defaults added** (`PROVISION_GENERATE_DEFAULTS`): `planCloseRadius:1`, `minOpeningW:2`,
  `minOpeningH:2`, `maxOpeningSpanFrac:0.8`. General, not per-building.
- **Pure helpers** (exported where tested): `bboxOf`, `erodePlan` (hoisted from the old inline
  closure — one definition shared by the wall loop + tests), `dilatePlan`, `fillPlanHoles`,
  `regularizePlan` (morphological **close** then enclosed-hole **fill** → a watertight, hole-free plan
  whose boundary is a single closed loop; **identity on a clean rectangle**).
- **Wall loop:** `cols = regularizePlan(cols, {radius})` before the perimeter-ring build; both erode
  call-sites use `erodePlan`; the inline `erode` closure is deleted.
- **Opening coherence gate** (two blob failure modes, each a Rule-1 finding, never silent):
  `opening-incoherent` (sub-`2×2` projection speck) and `opening-wall-spanning`
  (≥`0.8×wallExtent` — the blob's open top/side, not a window).

### `src/form/provision-generate.test.mjs` — +7 tests (18/18 in file)
erodePlan 4×4→2×2; regularizePlan identity-on-clean / fills enclosed void / hole-free + extent-
preserved / wide-gap-not-bridged-loop-closes; opening gate skips 1×1 speck + keeps 3×3 door + skips
7-wide wall-spanning band.

### Regenerated artifacts + proof (committed)
`benchmarks/sculpture/generated/barn/{base-artifact,artifact,grammar-artifact,component-plan,provision-fit}.json`;
`pr/assets/frames/proof-barn-watertight-T-159-01.png` (generate-first build beside concept) and the
refreshed `beside-concept-barn.png`.

## Diagnosis (AC #1) — done, named with counts

Roof solid (≥4/6 census: 81 cells, only 2 spruce). Walls holey: footprint `mass-0` had **96 enclosed
plan-holes** + ragged perimeter → interior wall rings + comb slots; **28 of 42 openings ≤2 cells**
(phantom specks at y4/y6, front/back-aligned → see-through). A third source surfaced in implement: a
giant `head:none` opening (og-2/13, 42 of 48 cols) stripping the long-wall eave band. Root class:
walls + openings were **mesh-inherited** (raw blob plan), the roof **re-authored** —
[[reference-is-spec-not-substrate]]; remedy is the [[morphology-cage-learnings]] close, in 2-D plan.

## Verification

| AC | Result |
|---|---|
| #1 diagnose first | ✅ named, cell counts, ruled out hollow-carve / roof-sheet / pinned voxelization |
| #2 watertight + solid, hollow loft kept | ✅ front wall solid y0–13; plan hole-free closed loop; interior stays air (no floor slab); roof slopes solid |
| #3 render proof, holes gone | ✅ `proof-barn-watertight-T-159-01.png` — solid stone box vs the prior holey ruin; honest caption |
| #4 `--repro` byte-identical; `npm test`; clean subjects inert | ✅ `--repro`: **DETERMINISTIC (two runs byte-identical)**; **2146/2146** tests; regularize/gate are identity on clean input (unit-proven) |

base-artifact placements 6844→5293 (stray interior-hole rings removed; walls taller after the
wall-spanning carve was suppressed). Cottage/other clean subjects untouched: the cottage uses the
workshop path (not generate-first), and the shared module change is identity on a clean rectangle and
a no-op on coherent openings (unit tests FA-style + full suite green).

## Open concerns / known limitations

1. **Narrow roof COVERAGE (out of scope, pre-existing, registered).** The fitted gable spans only
   z≈−6..1 (~6 of 26 cols) — the loft top is open over most of the plan. This is a **roof-FIT** defect
   ([[trellis-facet-normals-lie]]: the barn voxelizes hollow, facet normals misread the pitched roof),
   identical in the committed pre-fix artifact. The AC asks for complete roof *slopes* (the wedge is
   solid) — roof *footprint width* is a separate concern. **Recommend a follow-up ticket** to fit the
   gable footprint to the mass it caps (T-123 territory).
2. **Cosmetic perimeter stepping.** `regularizePlan` guarantees no see-through (closed loop) but
   close-1 does not straighten boundary steps, so oblique views show minor footprint stepping. Raising
   `planCloseRadius` would smooth it but risks eroding thin features; left at 1. The final
   `artifact.json`'s comb is **facade relief** (E-35 articulation, backed/recessed — 91 cells), not
   holes; facade texture rides on S-145/S-149 per the AC.
3. **Deviation from plan:** added a third gate (`opening-wall-spanning`) not in design/structure — the
   giant og-2/13 is a large-but-spurious aperture the dimension gate can't catch; suppressing it
   serves "wall faces solid." General fraction default. Documented in progress.md.
4. **⚠ Commit hygiene (needs human awareness).** A concurrent Lisa sibling (E-37 / T-154 — moving
   baselines to `measurements/`) had changes staged in the **shared index**; my `git add … && git
   commit` swept them into commits `d39c5e7`/`557b22d` ([[shared-file-commit-sweep]]). **Nothing was
   lost** (the sibling's renames/edits are committed, not dropped), and my intended changes are intact
   (verified: provision-generate symbols present). But the two commits mix my work with the sibling's.
   No action taken (un-mixing while the sibling is live risks clobbering its index). Future commits in
   this session use explicit pathspecs.

## Handoff

The generate-first wall path is now watertight and solid, deterministic, and inert on clean subjects.
The remaining "open top" is the upstream roof-footprint fit — a clean next ticket, not a regression of
this work.
