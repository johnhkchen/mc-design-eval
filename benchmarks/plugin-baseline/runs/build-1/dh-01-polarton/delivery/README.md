# Polarton expansion: streets, pads and fences

Built on `input/polarton_expansion_001_xl.nbt` (93 × 35 × 90). Same size and frame as that export. Every coordinate
below is in the export's frame: x runs west to east, z north to south, and the lane surface is y 5.

## Files

The schematicannon reads every cell a schematic leaves out as air. So a file pasted with "Replace Solid with Empty" must
hold the whole of its box, untouched blocks included, or it wipes them.

1. **`landscape.nbt`** (61 × 25 × 90, 160 KB): the terraformed land.
   - **Paste:** with its lowest north-west corner at the export's corner **+ (21, 3, 0)**: x + 21, y + 3, z + 0. No rotation, **Replace Solid with Empty**.
   - **The box:** exactly what the earthworks touch. It holds every block in it, untouched ones included, with explicit air wherever earth or trees come out. Nothing below y 3, and no village columns (x 82 and east).
   - **Result:** it digs the landmass and lays the streets, pads, retaining walls, driveways, fences and tracks. No buildings.
2. **`kit-changes.nbt`** (93 × 41 × 90, 25 KB): the 8 buildings.
   - **Paste:** whenever you have the materials, at the export's own corner, no rotation, **Replace Solid with Solid**.
   - **No air in it:** that mode never clears, and the landscape already cleared everything the buildings need.
3. **`cannon-test.nbt`**: on flat ground, "Replace Solid with Empty". The corner stone should go and a cobblestone appear.

A simulated paste of 1 then 2 over the original export gives exactly `village.nbt`, block for block.

`not-for-the-cannon/` holds the changes-only files (`changes.nbt`, `village-changes.nbt`). They leave untouched cells
out, so "Replace with Empty" would wipe the hill and the village. Keep them for tools that skip missing cells, never the cannon.

- `after.nbt`, `village.nbt`: the whole area after the earthworks, and with the buildings (for checking and rendering).
- `layout.json`: streets (centre points with heights), module plots, extra plots. `report.json`: earthworks, walls, trees, driveways.

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
