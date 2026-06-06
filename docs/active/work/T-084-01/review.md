# Review — T-084-01 surface-coherence-ops

Handoff for a human reviewer. What changed, how it's tested, what to watch.

## What this delivers

Three pure/deterministic **surface-coherence ops** over an occupancy — the **program path** for the
witnessed roof/wall defects (E-23 / S-084), and the **prerequisite for a safe hollow** (T-080-01):

- **`sealRoof`** — strip stray non-roof blocks (recolor → the dominant roof material) + seal enclosed roof
  holes → the roof reads **100% in one material**.
- **`sealWalls` / `sealWallFace`** — strip wrong-material **intrusions** (the embedded "random homes") +
  seal enclosed **skin holes** in each wall field.
- **`watertightCheck`** — flood-fill from **outside** the padded bbox; **watertight iff it reaches no
  interior void cell**. The T-080-01 invariant, reported pass/fail.

All three are append-only (recolor = a `{op:"voxel"}` at an existing pos under `expandArtifact`
last-write-wins; seal = an added voxel) — **no air op** (`facade-recess-by-exclusion`), never a delete, and
only ever places manifest materials so the artifact stays AJV-valid.

## Files

### Created
- `src/view/surface-coherence.mjs` — the ops + helpers (`overlay`, `applyDeltas`, `roofOutlineCoverage`,
  private `faceIntrusions`/`enclosedHoleCells`/`neighbourDepthW`/`enclosedMassKeys`/`rayInteriorAir`).
  Pure: no model/GL/API-key import.
- `src/view/surface-coherence.test.mjs` — 17 tests on synthetic occupancy (the AC's "holed shell seals;
  strays strip; breached shell fails", + integration + 3-D-breach + source guard).
- `benchmarks/sculpture/surface-coherence.mjs` — the metered/GL runner (cottage → read → light-tier
  detectors → pure ops → watertight check → before/after renders + report + sealed artifact).
- `docs/active/work/T-084-01/{research,design,structure,plan,progress,review}.md`,
  `surface-coherence-report.json`, `cottage-sealed-artifact.json`,
  `view-{before,after}-{top,threeQuarter}.png`.

### Modified
- `src/view/surface-grid.mjs` — `+orthoSpec`, `+cellWorldPos` (additive exports; no behaviour change).
- `src/view/structural-read.mjs` — exported `airComponents` (the one enclosed-vs-border definition).
- `src/view/{surface-grid,structural-read}.test.mjs` — tests for the new exports.
- `package.json` — `coherence:cottage` script.

## Acceptance criteria

- **AC #1 — watertight roof op.** ✅ `sealRoof`: strips strays + seals holes. Cottage: **62 strays → 0**,
  **coverage 0.793 → 1.0**, **1 hole filled**. Coverage is over the roof **outline** (filled ∪ enclosed
  holes), not the +y bbox (which counts non-roof corners), so 1.0 is meaningful.
- **AC #2 — coherent wall-skin op.** ✅ `sealWalls`: **100 embedded-speck intrusions stripped**, **8 skin
  holes sealed → 0** (per-face counts in the report). Intrusions are isolated specks (strict-majority field
  neighbours), so the cottage's intentional Tudor polychrome is preserved — see Concern 2.
- **AC #3 — watertight shell check.** ✅ `watertightCheck` reports pass/fail via a flood-fill from outside.
  Cottage: **false** (interior 3625, 2507 reachable) — honestly recorded; the cottage is an open building.
- **AC #4 — pure/deterministic + unit-tested; detectors are the metered calls.** ✅ 17 unit tests on
  synthetic occupancy; the two T-082 detectors are the live metered calls in the runner; the ops/check
  import no model/GL/API key (source guard test).
- **AC #5 — run on the cottage; record before/after; `npm test` green.** ✅ `npm run coherence:cottage`
  wrote the report + sealed artifact + before/after PNGs; **916 tests pass**.

## Test coverage

- **sealRoof:** strip a lone stray (+ coverage/strayCount), seal an enclosed hole while leaving bbox corners,
  explicit `strip` set, empty-safe.
- **sealWallFace/sealWalls:** strip an intrusion, seal an enclosed hole but **never an intended opening**
  (a doorway on the bottom border is left open), corner-voxel dedup across two faces, **speck-vs-band**
  (a timber band survives; only the embedded speck is stripped), `fieldMaterial` override.
- **watertightCheck:** intact solid box (pass), hollow box intact→breach→reseal (pass→fail→pass), explicit
  interior override, empty-safe.
- **Integration:** ops compose on a watertight hollow box without breaching it (recolors preserve the
  shell); the watertight check catches a 3-D breach the projection seals do not reach.
- **Exports:** `cellWorldPos` round-trips every filled ortho cell; `orthoSpec` throws on a diagonal;
  `airComponents` enclosed-vs-border classification.
- **Gaps (by design):** the live `claude -p` detector calls + GL renders are not unit-tested (metered/GL),
  covered by the `coherence:cottage` round-trip — same boundary as `detector-routing.mjs`.

## Open concerns / notes for the reviewer

1. **The cottage is not watertight (false), and that is the correct result.** 8 *enclosed-silhouette* skin
   holes were sealed, but the building has doors/windows/large openings (2507 of 3625 interior cells reach
   outside). The projection seals close silhouette defects; **closing the real openings is the strong-tier
   `seal-authoring` job** the routing table (T-082) already reserves. T-080-01 must treat `watertight:false`
   as "seal first, hollow second".
2. **Wall intrusions = embedded specks, not "every non-dominant cell".** The first run blanket-stripped 1548
   wall cells and flattened the polychrome; the shipped heuristic (strict-majority field neighbours) strips
   **100** genuine random-homes and keeps coherent material bands. This is conservative and **unscoped** —
   there is no wall-intrusion *detector* yet (T-082 shipped roof-patch + hollowable). Wiring a detector's
   cell set into the existing `strip` param is a one-call change and would make the strip a metered judgement
   rather than a geometric heuristic.
3. **Watertight interior is 6-ray containment, not the enclosed mass** (deviation from the design — see
   `progress.md` #1). The enclosed mass is tautologically sealed and cannot detect a breach; ray-based
   containment can. Reviewers should sanity-check the ray test on a non-convex build (an L-plan): a concavity
   open to the sky is correctly *not* interior (its +y ray escapes), so it won't be counted as a leak.
4. **Seal voxels sit flush with the front-most neighbour** (min-depth 4-neighbour's depth plane), so a hole
   in a sloped/eaved roof is closed on the local surface, not at a global roof height. Deterministic but
   geometry-naïve at a corner where two depth planes meet — acceptable for 1-cell holes, worth watching if a
   future build has multi-cell roof gaps.

## Suggested verification by a reviewer

`npm test` (916 green) → skim `surface-coherence-report.json` (roof coverage 0.793→1.0, walls 100 stripped /
8 sealed, watertight false with breach sample) → diff `view-before-top.png` vs `view-after-top.png` (the
grey roof "jumble" on the right is recolored to the warm roof material) → optionally re-run
`npm run coherence:cottage` (metered: light `--model` on the two detectors).
