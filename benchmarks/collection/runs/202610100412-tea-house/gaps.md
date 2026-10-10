# Toolkit gaps (tea house)

- Needed an irimoya (hip-and-gable) roof with a taller front gablet and curved/upswept eaves; closest: `roof` style hip + `pediment` (flat-topped hip plateau, gable cut into the hip), `eave: flared` kicks only slightly; the eave corner tips were hand-placed full blocks.
- No East-Asian roof preset (`temple` is Greek: quartz, terracotta); I had to skip presets and use the raw `hip` + `pediment` options.
- `roof` has no pitch/height cap: a 9-wide span at 45 degrees overshoots the 9-block height limit; I tuned a numeric `pitch` by trial renders. A `maxHeight` option would help.
- Roof pitch 0.67-1.0 numbers give lumpy plateaus / odd rise rounding; `dutch-gable` produced a tower-like gablet and a slab ring (unusable on a 9x7 span).
- Pediment tympanum cannot take a lattice/timber-frame pattern; the kumiko window in the gable was hand-placed trapdoors.
- Shoji panels: no brush for paper screens (pale panel in dark frame with a lattice ranma band); `glazing grid` needs glass, so panels, posts and ranma were hand-placed; `mullions` would be the nearest.
- Engawa / veranda (raised deck with outer rail, posts carrying the eave, footings): all hand-placed; a `veranda` or `deck` brush with posts, rail gap for steps and footings would help.
- Stone lantern (toro) and maple are hand-built; `tree` supports only oak/birch/dark_oak/spruce/azalea (no red maple/autumn crown, no nether-wart/red leaf option).
- Stepping stones / garden path: `path` follows terrain and uses dirt_path; no stepping-stone mode with staggered slabs.
- Raised floor on footings with 1-block gap: nothing; hand-placed cobble pillars.
- Paper white renders light grey in `mcd render` (white concrete / wool); snow_block was the only clean white; a `palette` hint for paper/plaster blocks would help.
- `paint vary` wrote 0 cells on deepslate tiles (no visible variants); no roof-tile weathering for dark tiles.
- `finial` could not be used because the roof already reaches the 9-block height cap.
