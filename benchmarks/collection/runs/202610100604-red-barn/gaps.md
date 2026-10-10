# Toolkit gaps (red barn)

- Barn preset ships a 3x3 `lantern` tower (+4 tall): grid grew to 15x18x21. I passed `tower: null` and hand-built the cupola; no `cupola` option that is size-capped, and no weather-vane brush (closest: `finial`, `tower top: lantern`).
- Weather vane / anything taller than the roof: the 14-tall cap plus a gambrel (eave+6) left only y11..13, so the vane is a flat iron_bars cross; no way to ask `roof()` for a lower gambrel that keeps its break (`maxHeight 5` flattened it to a 45 degree pitch and `maxHeight 4` dropped the dormers).
- `roof()` called from code gives a red barn-red roof on a red wall without the CLI's contrast swap (the note only prints on the CLI); I passed `material: "slate"` by hand. Also `gable` defaulted to the verge quartz in code, giving an all-white gable, until I passed `gable: WALL`.
- Barn doors with a white X: hand-placed the diagonal cells; a 4x4 leaf reads as a checker. Needs a `brace` / `barn-door` brush (closest: `glazing grid`, `surround`).
- Hoist beam with chain and hanging bale: placed logs, `iron_chain` and a hay block by hand; `check` flags no orphan but nothing anchors the hay (closest: `fixture hang`).
- Hay stacks, barrel groups, fence runs with a gap: all hand-placed; `planter ground` is flowers only, no `props`/`fence` run brush.
- Dormer `window` option is a block name only (no frame, no shutters); dark panes vanish in a slate roof.
- `surround` has no wall-mounted "timber" preset without a window box beyond `box:false`; the one-block-thick wall needed hand-placed dark_oak_planks backing behind each pane so the hollow barn does not show sky through both sides.
- Overhang growth: roof() with the box at 15 wide forced a body of 11 wide; there is no "fit the overhang inside the box" option, so I had to hand-compute the body width.
- `fixture bracket` on the side man-door needed a 1-wide pier; `mcd check` has no fence-gate / gate-in-fence helper for the yard opening.
