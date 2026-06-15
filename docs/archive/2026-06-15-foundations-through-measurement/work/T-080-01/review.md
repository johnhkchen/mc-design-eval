# Review — T-080-01 hollow-the-mass

Handoff for a human reviewer. What changed, how it's tested, what to watch.

## What this delivers

The **program path** that turns a watertight solid mass into a **hollow shell + structure** (E-23 / S-080) —
the missing piece before rooms can go in. Carving is deterministic; *what is safely hollowable* is the
scoped light-tier detector (T-082-01). Three pure capabilities + one metered runner:

- **`markHollowable`** — the removable set: the **enclosed mass** (reusing the single
  `surface-coherence.enclosedMassKeys` rule) minus protected **structure**, optionally eroded to keep a
  thicker `inset` wall and restricted to the detector's `regions`.
- **`carveArtifact`** — the carve, by **flatten-by-exclusion**. There is **no air op**
  (`facade-recess-by-exclusion`): a voxel is removed by *not placing it*. Expand → drop the carved keys →
  re-emit kept cells as `{op:"voxel"}`. `expandArtifact` is full-replace + order-independent, so the kept
  cells re-expand **byte-identically**; only existing block ids are copied → the artifact stays AJV-valid.
- **`exteriorHeld`** — the AC-#3 proof. Removable ⊆ enclosed ⊆ **non-skin**, so no front-most ortho surface
  voxel can change; `exteriorSurfaceDigest` over the 6 ortho views is equal before/after.

## Files

### Created
- `src/view/hollow-carve.mjs` — the carve ops + `cornerPostKeys` / `tallColumnKeys` (structure) +
  `cavityReport` / `exteriorSurfaceDigest` / `exteriorHeld` (proofs) + private `erodeKeys` / `columnExtents`.
  Pure: no model / GL / API-key import.
- `src/view/hollow-carve.test.mjs` — 17 tests on synthetic occupancy (the AC's "skin cells survive;
  enclosed cells removed; structure retained", no-air-op, exterior-held + a negative control, source guard).
- `benchmarks/sculpture/hollow-cottage.mjs` — the metered/GL runner (sealed cottage → read → light
  detector → pure carve → exterior-held proof → before/after renders + report + hollow artifact).
- `docs/active/work/T-080-01/{research,design,structure,plan,progress,review}.md`, `hollow-report.json`,
  `hollow-cottage-artifact.json`, `view-{before,after}-{threeQuarter,front,top}.png`.

### Modified
- `src/view/surface-coherence.mjs` — `enclosedMassKeys` made `export` (the single carve definition; no
  behaviour change; `watertightCheck` unchanged).
- `src/view/surface-coherence.test.mjs` — a test pinning the now-public `enclosedMassKeys`.
- `package.json` — `hollow:cottage` script.

## Acceptance criteria

- **AC #1 — mark the hollowable interior.** ✅ `markHollowable`: enclosed (all-6-neighbours, the shared
  rule) minus structure, region/inset aware. Live: detector (`claude-haiku-4-5`) `hollowable:true`, two
  regions, no blockers → **1100 enclosed**, **122 protected**, **973 marked**.
- **AC #2 — deterministic carve, skin preserved, structure kept.** ✅ `carveArtifact` flatten-by-exclusion.
  Unit-tested: skin cells survive, enclosed cells removed, `after === before − removed`, an explicit keep
  column survives, `cornerPostKeys`/`tallColumnKeys` retained, output is all `voxel` ops with no
  `minecraft:air`, blocks **and state** copied exactly.
- **AC #3 — exterior unchanged.** ✅ `exteriorHeld` proves the 6-ortho digest is invariant. Live: all three
  before/after renders are **byte-identical** (`cmp` clean) — the hollow is literally invisible from
  outside, so the resemblance verdict cannot regress. The runner *throws* if `held` is ever false.
- **AC #4 — record cavity + exterior-held proof.** ✅ `hollow-report.json`: `cavity {before:6438,
  removed:973, after:5465}`, `exteriorHeld.held:true` (digest 133 355 bytes both sides), per-band carve
  counts, watertight before/after, detector usage.
- **AC #5 — `npm test` green.** ✅ **932 tests pass** (was 916 at T-084; +16 new). Hollow artifact also
  passes the AJV gate (`validate-artifact.mjs --expect valid` → VALID).

## Test coverage

- **markHollowable:** inner-3³ on a 5³ box (none on the skin), `inset:2` erodes to the centre, `regions`
  restricts the y-band (+ `perBand`), a keep set protects + reports `protectedCount`.
- **carve:** skin survives / enclosed removed / exact count; explicit structure column retained;
  `cornerPostKeys` on a box; `tallColumnKeys` keeps a full-height post but not a short blob; all-voxel /
  no-air / state-copied; `carveOccupancy` ≡ re-expanding `carveArtifact`.
- **exterior proof:** interior carve → digest identical (`held:true`); a **skin** removal flips `held:false`
  (the digest actually discriminates); `cavityReport` arithmetic; empty/edge safe.
- **Purity:** source guard (no model / GL / API-key import), mirroring `surface-coherence.test.mjs`.
- **Gaps (by design):** the live `claude -p` detector call + the GL renders are metered/GL, not unit-tested
  — same excluded boundary as `surface-coherence.mjs`'s runner; covered by the `hollow:cottage` round-trip.

## Open concerns / notes for the reviewer

1. **The cottage is `watertight:false` before *and* after the carve — and that is correct.** It has real
   doors/windows (2507 of 3625 ray-interior cells reach outside). The carve does not change watertightness
   (it only removes enclosed mass, never the skin), and closing intended openings is the **strong-tier
   `seal-authoring`** job the routing table (T-082) reserves — out of this ticket. The carve is
   exterior-safe *regardless* of watertightness; watertightness governs whether the cavity is a usable
   sealed room, which is the next S-080 step. The runner feeds the **already-sealed** T-084 artifact so the
   precondition ("seal first") is honoured.
2. **`cornerPostKeys` returned 0 on the cottage** (not a bug). The footprint *bbox corners* are empty (the
   plan is non-rectangular), so structural protection came from `tallColumnKeys` (716 column voxels, 122
   enclosed). The runner composes `cornerPosts ∪ tallColumns` precisely so the geometry decides which
   contributes; both are unit-tested on a rectangular box where corners are occupied.
3. **The carved artifact is flattened to explicit voxels** (6597 placements → 5465 `voxel` ops). Compact
   `box`/`fill` ops are lost — an accepted trade for determinism + the no-air-op contract. The render is
   identical and the file re-validates. Re-compacting into primitives is possible future work, not needed
   for the measurement instrument.
4. **`tallColumnKeys` is geometry, not a metered judgement.** On an *articulated* build it protects genuine
   floor-to-roof members; on a fully-**solid** mass every column is full-height, so a caller there must use
   corner posts or the detector's `regions`/`inset` instead (documented in `design.md`). For this cottage
   the articulated path is correct.
5. **`inset` from the detector is honoured but was 1 here.** Erosion (`erodeKeys`) is unit-tested
   (`inset:2` → centre only); a future detector that asks for a thicker wall is already supported.

## Suggested verification by a reviewer

`npm test` (932 green) → `cmp docs/active/work/T-080-01/view-before-threeQuarter.png
docs/active/work/T-080-01/view-after-threeQuarter.png` (identical — the proof, visually) → skim
`hollow-report.json` (cavity 6438→5465, exteriorHeld true, watertight false) →
`node scripts/validate-artifact.mjs --expect valid docs/active/work/T-080-01/hollow-cottage-artifact.json`
→ optionally re-run `npm run hollow:cottage` (metered: one light `--model` detector call).
