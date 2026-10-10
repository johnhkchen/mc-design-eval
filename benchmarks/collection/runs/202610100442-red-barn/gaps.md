# Toolkit gaps (red barn)

- Gambrel over a gable-end show front: `roof()` has only a `granary` preset (ridge-along-x gable + monitor); I had to override to `style: gambrel`, `ridgeAxis: z`, `pitch: 1.5`, `lower: 2`, `upperPitch: 0.34`; no `barn` preset (closest: `granary`). A numeric `pitch` and `lower` were found only by reading roofs.mjs.
- Dormers on a gambrel: `dormers` accepts ONE face per roof() call, so symmetric east+west dormers (the concept's three per side) are not expressible; I dropped them (closest: `dormers`).
- Cupola with louvres, pyramid cap, weather vane: hand-built the 3x3 shaft and louvre trapdoors; the cap used `roof()` pyramid (3 layers at overhang 1, 2 at overhang 0, so it adds height); no `cupola` / `weathervane` brush (closest: `roof tower top lantern`, which is a hollow tower, and `finial`, which has no arrow).
- Big sliding doors with white X brace: hand-wrote the X as diagonal cells + recess; no `barn-door` / `brace` brush; on a 4x4 leaf the X is half the cells so it reads as a checker (closest: `glazing grid`, `surround`).
- Hoist beam + chain + hanging bale: placed logs, a stair bracket, `iron_chain` and a hay block by hand; `mcd check` flags the bale as an orphan; no `hoist` brush (closest: `attach lantern`).
- Hay bale stacks, barrel groups, fence runs with a gap at the path: all hand-placed; `planters` is windows/beds only, no prop-group or `fence` run brush (closest: `railing`, which works on a roof/top, not on grass).
- Grid growth fights the size cap: `roof()` overhang grows the grid (the first roof grew it 15x17x21 to 17x17x22 and shifted all coordinates); I used overhang 0 to stay in 15 wide, which loses the eave overhang and the barge board; no way to ask for 'overhang within the existing box by shrinking the body'.
- Eave brackets (dark stair corbels under the eave): not possible at overhang 0 and the box edge; `brackets` needs an overhang to hang under.
- Side-wall board-and-batten: red terracotta has no variant family, so `vary` / `weather` do nothing on the main wall; hand-placed dark oak posts on a rhythm (closest: `pilasters every n profile timber`, which grows the grid).
- Window treatment at 1-2 wide: `surround`/`glazing` are tuned for 3+ wide openings; used gray_stained_glass_pane with a dark_oak_planks backing so the hollow barn doesn't show sky through the glass. A `backing`/`reveal` option on openings would do it.
- `check` flags the one-block-thick top of the pyramid cap and the hay on its chain as orphans (both are intended).
- `palette` treated the recessed red door leaves as 'trim' on red walls (false flag until I changed the leaf block).
