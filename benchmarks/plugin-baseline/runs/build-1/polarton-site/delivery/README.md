# Polarton expansion: streets, pads and fences

Built on `input/polarton_expansion_001_xl.nbt` (93 × 35 × 90). Same size and frame as that export. Every coordinate
below is in the export's frame: x runs west to east, z north to south, and the lane surface is y 5.

## Files

- `landscape.nbt`: the terraformed land alone, as a full-area schematic (93 × 35 × 90).
  - It includes the earthworks, streets, pads, walls, fences and tracks, and the village's 3 plots as they are.
  - It has explicit air in all 6,645 cells that were dug or cleared, so "Replace with Empty" takes the landmass away.
  - It has no new buildings: `kit-changes.nbt`, on the same corner, adds them later.
  - The landscape plus the kit changes equals `village.nbt` exactly.
- `kit-changes.nbt`: the 8 buildings alone, against the landscape.
- `village-changes.nbt`: landscape and buildings in one paste, against the original export.

- `changes.nbt`: only what changed.
  - 3,256 blocks placed.
  - 6,645 explicit air cells, where earth was dug or trees were cleared.
  - Vanilla blocks only.
- `after.nbt`: the whole area as it should look afterwards (for checking and rendering, not for pasting).
- `cannon-test.nbt`: 3 × 3 × 3. A stone floor with one corner cell explicit air, and one cobblestone above the middle.
- `layout.json`: streets (centre points with heights), module plots, extra plots.
- `report.json`: earthworks, walls, trees cleared, driveway checks.

## Pasting with the schematicannon

1. **Test the air handling first.** Paste `cannon-test.nbt` on flat ground with "Replace with Empty".
   - If the floor's corner block is removed, explicit air digs.
   - If it stays, the cannon skips air: nothing will be dug, and the streets and pads will sit on uncut ground.
2. **Paste `changes.nbt`** with its corner exactly where the export's corner was, with no rotation and no mirror.
   - The cannon only needs materials for what is placed. Nothing in it is modded.

## What it builds

- **Streets, 5 wide** like the lanes: gravel down the middle, dirt path either side, coarse dirt at the edges.
  - Lane 1 and lane 2 rise gently to the level contour street at +3.
  - A terrace road climbs west to the plateau street.
- **Climbs** go by half steps (mud brick slabs), at most 3 in a row, then a level landing at least 2 long.
  - Streets meet on level landings.
- **8 module plots, 12 × 14.**
  - Each is a level grass pad with a spruce fence and a 2-wide spruce gate.
  - Lantern posts stand at the front corners, as at the lane corners.
- **Driveways, 3 wide**, run from the street to every gate.
  - Each driveway holds to the approach standard: half steps only, flights of 3, then landings.
  - All 9 driveways (8 module plots and 1 small build) pass `approachReport`.
- **Retaining walls** (stone bricks, about a quarter mossy or cracked):
  - wherever neighbouring ground differs by 2 or more;
  - on the uphill bank of a cut;
  - as a plinth under a pad on fill.
- **Extra plots:**
  - 1 small build (8 × 10): pad, fence, driveway.
  - 3 farms: level, fenced.
  - 1 pasture: fenced, following the ground.
  - 8 parks: left as they are.
  - Farms and pastures set back from a street get a 2-wide coarse-dirt track.
- **Left alone:**
  - the stream side north of lane 1 (green space);
  - everything west of x 22 (mountainside and sinkhole);
  - the existing village (x 82 and east).
- **Trees** standing on or overhanging what was levelled were cleared:
  - 359 log blocks, with their own leaves;
  - leftover floating leaves and caps removed.

## Known small things

- **Driveway edges:** three driveway edges sit a block above or below the street cell beside them, a side edge rather than the way in.
- **Plot depth:** pads are 12 × 14. The kit modules' plot part is 15 deep with its own front fence, so dropping a module onto a pad means trimming its lane rows and its fence.
- **Kit porches:** the kit houses' porches still fail the approach standard (2-block rise by one stair and a jump).
