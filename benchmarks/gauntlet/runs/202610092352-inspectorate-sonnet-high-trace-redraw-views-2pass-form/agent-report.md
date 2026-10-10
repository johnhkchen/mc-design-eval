## Pass 1 (front)

`round-1.nbt` is saved (26×19×27) and `build.mjs` is in the run directory; the front matches the tracing in the `r1-tiles` renders. `front()` and `body()` are separate functions, so the next pass can change the sides, back and roof without touching the front. I did not run `mcd check`.

- **Matches:** the outline and roofline (hip steps y16–17, finials, stepped pediment with a 2×2 `gold_block` cross) and the storeys. Also the 2-wide upper windows at c5–6, 10–11, 14–15, 19–20, the stepped side arches (4 wide, 2 at the head), the central double door with side lights and transom, and the sign with `light_blue_concrete` caps. Relief and materials follow the spec's map (`deepslate_bricks` and `cracked_deepslate_bricks` wall field, `stripped_oak_log` pilasters and dentils, `quartz_pillar` piers).
- **Where I overrode the spec:** the oak pilasters and finial posts go at c9 and c16 from the tracing, not x=7 and 8 from the spec. The sign sits at y8 where the tracing puts it, not y8–9. I also made the centre pilaster 2 wide `stripped_oak_log`, because the concept and redraw show it as oak even though the tracing averages it to grey.
- **Depth map:** its arcade rows are about one row off from the tracing, so I applied it by feature rather than by raw row. Values used: pilasters +1, sign and steps +2, windows and glazing −2, jambs −1.
- **Deferred as detail, not placed:** lanterns, banners, brackets, stairs (arch spandrels are plain stepped quartz), shutters, window frames and mullions, and the sign and plaque lettering.
- **Remaining mismatches:** the upper windows read dark blue because the glass sits over `black_concrete`. The central bay is open behind the door. I added a quartz backdrop behind the two side arches so their glass reads light blue.
- **Plain volume:** a 22-wide hollow body with a flat deck at y15 and a two-course hip stub on top. No chimney.

## Pass 2 (sides, back, roof)

Round 2 is built and saved as `round-2.nbt`, with `round-1.nbt` untouched. The build script is `build2.mjs` and the renders are in `r2-tiles/`. I compared the right elevation and front-right 3/4 render against the traces by eye, but only at 300–420 px, so fine detail wasn't checked.

- **Sides (mirrored):** each side has a 2-thick wall, 3 bays of 4 cells, and piers at z=11–12, 17–18 and 23–25 (dark oak below, oak pilasters above). The arcade storey has carved arch openings (4 wide, stepping to 2 at y7) with glazing set back 2. A quartz band sits at y8 and a stone string course at y9. The upper storey has three 2-wide recessed windows with blackstone frames, proud lintels and oak dentils on the frieze at y14.
- **Back:** a quartz arcade storey with doak piers, a string course, and the upper storey's oak pilasters and four 2-wide windows. There is a centred dark-oak double door with a two-step stoop and four small ground-floor windows.
- **Roof:** a stepped deepslate-tile hip in two courses (y16 x4–21, y17 x6–19). I mirrored the front finials onto the back corners and posts, and added a copper-capped chimney at the back on the right-when-facing-front (−x) side.
- **Roof deviates from spec/concept:** it is two courses, not the spec's three (y16–18). The grid is 19 tall, and a y18 course would sit visibly behind the front pediment. The chimney cap is at y18, not y19, for the same reason. The 3/4 view reads as a flat plate rather than a ridge, so the roof is the biggest remaining mismatch.
- **Front elevation:** I diffed it against a fresh round-1 render. The facade cells are unchanged. It differs in a 1-cell edge column per side (the proud side relief), the roof (chimney and 1-cell wider course), and the lit-quartz back wall showing through the front glass around the door transom.
- **Not done:** I didn't run `mcd check`, and the side/back openings have no further craft (no lanterns, brackets or banners; that's the later detail pass).
