# T-064-01 — Progress

Plan steps 1–6. All landed.

- [x] Step 1 — texture variance in block table (data + builder) — `varianceOpaque` + `var` field; table
      regenerated, `lab`/`rgb` byte-stable. Distribution: min 0 / median 672 / p90 3859 / max 15253.
- [x] Step 2 — `nearestFlat` primitive (`cielab.mjs`, `FLAT_LAMBDA = 0.10`).
- [x] Step 3 — flat-preference snaps wired into `material-segment` fill/band (AC#1).
- [x] Step 4 — gated secondary `varCeiling = 1200` + `nearestFlat` in `palette-augment.mjs` (AC#1).
      Calibrated so coral_brain(1363)/mycelium(2483)/quartz_ore(7114) fall above; matte blocks below.
- [x] Step 5 — PCA/least-squares gradient direction + minRegion noise-vs-intent rule (AC#2, AC#3).
- [x] Step 5b — **keepFloor dual-gate refinement** (koi-speckle diagnostic). A distinct small region
      survives only when colour-distinct AND ≥ `keepFloor = 8` cells; sub-feature snap-flecks (3–7 cells)
      are absorbed. Halves speckle on the busy subjects with no manifest change.
- [x] Step 6 — live ×7 sweep + before/after recorded (AC#5).

## Deviation from plan

Plan Step 5 shipped `{absorbDE, tinyFloor}` only. The live koi build still carried excess speckle from
**colour-distinct but sub-feature** snap-flecks (3–7 cells) that the single distinctness gate kept. Added a
second gate `keepFloor = 8` (committed `1518c2d`) — a small region is intent only when it clears BOTH
distinctness and a feature-size floor. The Step-5 unit test (4-cell distinct spot "kept") was updated to a
9-cell spot, and a new test asserts a 4-cell distinct fleck is now absorbed.

The Step-6 sweep had to be **re-run**: the working-tree e18 artifacts predated `keepFloor`. Post-rerun
numbers below are the committed truth.

## Step 6 results — live sweep, scale 32, 7 subjects (R1→R2→E18)

| subject | form IoU | speckle | distinct | off-pal | value ΔE |
| ------- | -------- | ------- | -------- | ------- | -------- |
| dancing-man | 0.91→0.91→0.81 | 0.11→0.03→**0.01** | 5→5→5 | 0→973→**0** | 11.19→0→13.17 |
| moai | 0.56→0.56→0.40 | 0.17→0.06→**0.01** | 5→5→5 | 287→4163→**0** | 1→0→20.85 |
| pineapple | 0.91→0.91→0.85 | 0.11→0.04→**0.02** | 4→5→4 | 0→2939→**0** | 8.71→0→8.28 |
| bow-and-arrow | 0.47→0.47→0.53 | 0.11→0.03→**0.01** | 6→8→7 | 0→352→**0** | 1.1→0→5.44 |
| heart | 0.88→0.88→0.90 | 0.15→0.05→**0.02** | 7→7→7 | 1003→1108→**0** | 4.62→0→6.62 |
| mushroom | 0.98→0.98→0.93 | 0.06→0.03→**0.03** | 6→7→5 | 3734→9505→**0** | 7.17→0→6.04 |
| koi | 0.62→0.62→0.71 | 0.13→0.06→**0.05** | 5→8→5 | 0→1237→**0** | 4.53→0→17.55 |
| **AVG** | 0.76→0.76→0.73 | 0.12→0.04→**0.02** | 5.43→6.43→5.43 | 717.71→2896.71→**0** | 5.47→0→11.14 |

**Headlines:**
- **off-palette = 0 on every subject** (R2 leaked up to 9505 cells).
- **speckle E18 < R2 on all 7** — avg 0.04→0.02; biggest wins moai 0.058→0.006, heart 0.052→0.019.
- **the three named busy blocks are gone** — `dead_brain_coral_block` (1363) / `mycelium` (2483) /
  `nether_quartz_ore` (7114) all exceed varCeiling 1200 and no longer enter any manifest. One borderline
  secondary remains: mushroom now gets `dead_fire_coral_block` (var 1051, **below** the 1200 ceiling) as a
  GATED SECONDARY (it is NOT in the mushroom design-doc manifest = {red_concrete, bone_block, moss_block,
  white_concrete}). It replaced the busier `dead_brain_coral_block` + `mossy_stone_bricks` (1594) the
  prior build inserted, so the manifest is strictly flatter — but it is a real secondary insertion of a
  mildly-textured coral, flagged in review as the one ceiling judgement call.
- **form IoU unchanged by this ticket** — the change is segmentation-only (occupancy untouched); E18-vs-R1
  deltas (moai −0.17, dancing −0.10, etc.) predate T-064 and come from the thin voxelizer, not this work.
- **value ΔE up vs R2** — expected: R2's value ΔE is 0 by construction (it IS the value-true baseline);
  the absolute E18 numbers (6–21) are the honest drift of snapping to the design-doc palette. See review
  open concerns.

`npm test`: **665/665 green**. Commits: `1518c2d` (keepFloor), `c344674` (sweep).
