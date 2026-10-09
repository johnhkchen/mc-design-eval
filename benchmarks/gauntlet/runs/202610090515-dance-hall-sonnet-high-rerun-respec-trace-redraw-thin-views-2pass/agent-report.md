## Pass 1 (front)

Front pass is built: `round-1.nbt` is 27×30×35 with 0 refused writes, and `mcd check` reports a plain rear hall that isn't walkable inside. I rendered it and compared it to `trace.png` and the concept by eye. I did only one fix round (the marquee and glass classification), so these are looks-right checks, not a cell-by-cell diff.

- **Front:** `build.mjs` is generated from `trace.txt` and `depth.txt` by `frontFace()`. `depth.txt` column i is trace column x = i+1, so it is shifted one column left. Each cell gets its material-map block and sits at z = 5 − depth.
- **Marquee:** a four-tier gold step pyramid (z=1..4) under the stepped crest, built from `sea_lantern`, `diamond_block`, `emerald_block` and `honeycomb_block` as traced. Three hanging lanterns sit under the canopy.
- **Relief:** the fins and pilasters stand 1 proud. The wing slits, tower glass and spire slit are recessed 1, with stained glass backed by quartz. The doors are `dark_oak_door` with a trapdoor transom at y=2. The spire has cut-sandstone stairs and a slab tip.
- **Rear:** a plain hollow hall (z=11..34, flat roof at y=15) in `rearHall()`, separate from `frontFace()`, so pass 2 can change it.
- **Mismatches left:**
  - The depth map clamps the marquee at +2, so I projected it to z=1 (spec says z=0..3).
  - The doors sit at z=7 per `depth.txt`, where the spec says z=6.
  - The glass x/y is trace-faithful, so the left and right wing slits differ in colour.
  - There is no gold stair or slab, so the marquee roof is full blocks.

Files are in `…/202610090515-dance-hall-sonnet-high-rerun-respec-trace-redraw-thin-views-2pass/`:
- `build.mjs`
- `round-1.nbt`
- `r1-tiles/`

## Pass 2 (sides, back, roof)

Sides, back and roof are built and saved as `round-2.nbt`. A cell-by-cell comparison of the front elevation against `round-1.nbt` finds 0 differences, but the PNGs don't match byte-for-byte.
- **Form:** the side aisles (x=2..7) are low with a y=15 deck, because the front silhouette caps them there. The nave (x=8..18) carries the tall roof, stepped 20 → 18 → 17 along z, with a dark band at y=19 and a rear parapet. Nave clerestory panes sit at z=11, 14, 19 and 22.
- **Sides** (west wall, mirrored east): black plinth, sandstone ledge bands and a cornice lip, with piers 1 block proud at z=15, 18, 27, 31 and 33. There are two recessed quartz window bays (z=8..14 and 20..26) with black panes and a blue-glass mullion holding a glowstone lamp. Between the piers at z=16–17 sits a double dark-oak door with a stained slit above it, and a black slit at z=29.
- **Back:** piers at z=34, five recessed bays with black panes and blue transoms, a centre stage door, and a rear parapet. The wall plane is z=33 so the piers stay inside the 35-deep grid.
- **Checks:** 12,778 blocks and no refused writes. `mcd check` reports the build as not walkable end to end. I did not run `mcd check` against `round-1.nbt`, so I can't say whether that is new. Interiors are solid, since sides and back were the target.
- **Fixes along the way:**
  - Outer-column cells behind z=5 that the front elevation reads are restored after the rebuild.
  - I added a quartz band at y=13 on the piers; the old rear wall had been showing through there.
- **Not done:** the side-view silhouette is faithful, but the nave roof tops out at y=20 instead of the trace's y=21 coping. The side-trace PNG is compared by eye only, with no pixel diff.

Files are in `benchmarks/gauntlet/runs/202610090515-dance-hall-sonnet-high-rerun-respec-trace-redraw-thin-views-2pass`:
- `build2.mjs`
- `round-2.nbt`
- `r2-tiles/`
