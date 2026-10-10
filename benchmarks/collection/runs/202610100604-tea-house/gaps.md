# Toolkit gaps (tea house)

- Shoji screens (white paper in a dark kumiko grid): no brush; hand-built as a snow_block backing with a dark_oak_fence grid in front (fences connect into a lattice). `glazing grid` / `mullions` need glass, and white stained glass shows the dark interior instead of reading as paper.
- Engawa/veranda (deck ring, lip posts, beam ring, rail with an entry gap, footings): all hand-placed; a `veranda` brush (posts aligned to the wall posts, rail gap for steps, footings) would help.
- Raised floor on stone footings: nothing; hand-placed pillars. The 9-block cap leaves only 3-4 roof courses once the footing + deck take two layers.
- `teahouse` preset: low pitch and `maxHeight = 0.6 x wallH` give a flat lid; I had to override pitch, maxHeight, material and ridge by spec (preset ridge is light stone-brick, which reads as white horns on the upturned corners). A `ridge`/`corner` dark option on the preset would help.
- Roof overhang is not clamped to the grid: the rafter-tail row spilled one cell past the 11-deep plot; I copied the build into a trimmed grid by hand (`g.resize` cannot shrink).
- `pediment` makes a small tympanum (5 wide, 2 high) that cannot take a lattice window; the kumiko window in the gablet was hand-placed fences over snow.
- Sub-grid height is not exposed: `Grid.isAir` is correct but a `/air/` regex on block ids matches "st-AIR-s" (stairs) and silently drops roof stairs; it cost me a whole copy pass.
- `surround` (timber) and `planter` on a doorway/ground wrote nothing or outside the grid for an open doorway in a wall with no glass; no brush for a door frame on an open bay or for a ground bed in front of a deck.
- Stone lantern (toro), stepping stones and the maple are hand-built; `tree` has no red/autumn crown; no stepping-stone path mode (staggered slabs).
- Noren (door curtain): a wall banner needs a block behind it, and an open doorway has none; no hanging-banner-from-lintel helper.
- `mcd render` paints white snow_block pale grey in shade; no way to tell the renderer what "paper" should look like.
