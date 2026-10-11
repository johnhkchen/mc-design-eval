# Toolkit gaps hit while building the painted lady

- Turret cap over a mansard roof: `mcd roof` on the turret footprint strips every roof cell above the eave in its footprint (it left a pit in the mansard); I called the library `roof()` for the cap instead (after a clean CLI dry run). Closest: `--keep`, but it splits the main footprint into an L and puts the dormers on the wrong face.
- `mcd roof --keep` re-splits the footprint into rectangles; dormers then land on the largest rect's inner face (dormer dropped warning) rather than the street face.
- The mansard preset always removes what is above the eave over the footprint, so a turret that rises through the roof has to be rebuilt after it (turret-top.mjs). Closest: `keep`, no "pass through" option.
- Tower-cap preset gives no way to turn off or recolour its lucarne except `dormer: {wall}`; palette `copper` ends in an orange exposed-copper brim, so I passed a custom mix and replaced the oxidized slabs by hand.
- Round turret windows: `surround` assumes a flat wall; its hood/sill ends hang in air beside a curved tube (orphans), so I deleted them by hand. Closest: `surround plain`.
- `surround classical` jambs are wall cells, so windows closer than 4 apart merge into a solid white wall; I used a hand-written hood + sill + open trapdoor shutter trim (flank()) for the flanks. Closest: `surround timber`/`plain`.
- No fish-scale shingle brush: the pink band is hand-placed stairs with the low step facing out (loop over exterior cells). Closest: `paint ... courses`.
- No sunburst / fan ornament brush: the gold sunburst in the porch gable is hand-placed bamboo blocks and stairs.
- Turned porch posts and spindle frieze: hand-placed fences and stair brackets. Closest: `pilaster ... profile timber` (log post, wrong look).
- Canted bay: no brush for a chamfered/splayed bay; built from fills (3-wide front + 1-wide splays). Closest: `setbacks`.
- A small gabled hood over the bay and the back stoop is `gableRoof`, which has no even-span gable-end decoration and no dormer-style window.
- Hedge: `planter ground` refuses leaves, so the hedge and flower beds are hand loops.
- Interior behind glass: transparent panes show empty rooms (brown floors, ceilings); no "curtain" or interior-fill brush, so a hall back wall and pale floors were hand-placed.
- `mcd roof --front` wants "north", not "n" (the render flag takes "n"); `--front n` crashed in dormersOn with an unhelpful TypeError.
- `palette` outlier flags treat any non-blue/non-quartz accent (corner boards, wood deck, slabs) as stray, so I recoloured to stone bricks/quartz instead of the more period-accurate wood.
