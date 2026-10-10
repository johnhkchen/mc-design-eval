# Toolkit gaps (lighthouse + keeper's cottage)

- Rocky outcrop with a stepped stair flight, moss and ferns: hand-written height loop; `heightfield`/`strata` are for valleys, no "rock island with cut-in stair" preset. Closest: `heightfield` + `strata` + `path`.
- Alternating colour bands on a round tower: had to call `cylinder` once per band; no `bands` option takes a per-layer block list (only `every`). Closest: `cylinder bands`.
- Tower windows and door on a round wall: hand-placed frames, sills, lintels at the cardinal cells; `surround` is for flat walls. Closest: `surround`.
- Gallery railing round a circle: wrote the fence connection states by hand (`ring` only connects `*_wall`, not fences). Closest: `ring`.
- Corbelled gallery under a round tower (upside-down stairs with correct facing on a circle): hand-placed with a dominant-axis facing rule, diagonals are jagged. Closest: `cylinder taper`/`cornice`.
- Glass lantern room (round, panes + mullions + lamp): hand-placed ring of glass/iron bars/glowstone. No `lanternRoom` or glazed-drum brush. Closest: `cylinder hollow` + `glazing`.
- Mirroring a finished build in x: wrote my own mirror (flip facing, east/west keys, stair shape, door hinge) because `mirrorX` only mirrors writes made inside its callback. Closest: `mirrorX`.
- Porch awning (stairs on fence posts) + shutters (open trapdoors) + window box pots: all hand-placed. `surround timber` gave a window box but needs the glass set back with air; my windows are flush. Closest: `surround timber`, `planter`, `fixture`.
- Roof: `roof cottage` accepted the footprint but the pre-overlapped tower wall had to be built after it so the cylinder overwrites the buried roof end; no `keep`-style "clip roof against a tower" option. Chimney: 2x2 gets no flue/campfire or lantern top. Closest: `roof chimneys`.
- Sign/banner tasks (door sign, pennant) were not built: `plaque`/`signboard` unusable on curved walls.
