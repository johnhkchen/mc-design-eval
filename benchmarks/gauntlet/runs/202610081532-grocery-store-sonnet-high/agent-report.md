Both rounds are built and rendered. I think round 2 is the better one.

- **Built:** a 14×14 brick corner shop, written as code in `build.mjs` and mirrored across x. It has the shopfront, a sign over a recessed entrance, red and white awnings, three upper windows with shutters, lintels and flower boxes, a quartz cornice and parapet with a raised pediment, a chimney, and sidewalk props. I used the MATERIAL MAP block ids throughout. The two files are `round-1.nbt` and `round-2.nbt`, with renders in `r1-tiles/` and `r2-tiles/`.
- **Round 1 mismatches** (from `front-elevation.png`, `front-left.png` and `front-right.png`, read against the concept):
  - The awning dropped to y3 and hid the display windows and props.
  - The chimney, cobble patch and side windows were on the viewer's left. The spec says "east", but looking south from the north front, +x is on the viewer's left, and the concept shows them on the right.
  - The roof was a big dark-oak slab, not a parapet-hidden roof.
  - The cornice was one white band with no dark frieze between the white courses.
- **Round 2 fixes:**
  - The awning is now flat at y4, so the windows and props read.
  - The chimney, patch and trapdoor windows moved to the x=0 side, which is the viewer's right in the front elevation (the `front-right` tile).
  - The roof is stone brick.
  - The cornice has a dark-oak band between the white courses, and the parapet has white slab coping.
- **Where round 2 is still off:** the awning is a flat band with no slope, the "GROCERY" lettering is only a rough yellow-on-green pattern, and the 1-block chimney is thinner than the concept's. The upper windows and white lintels still read weakly, and the concept's lintels are bolder.
- **Spec deviations:**
  - The spec has the sign (y4–5) and the pediment (y5–6) competing for z0 at y5, so I put the sign at y4–5 and the pediment at y6.
  - The sidewalk extends 2 blocks in front rather than 1, so the props at z−2 have ground to stand on.
- **Check:** `mcd check` reports "walkable end to end: false", which I didn't investigate. I didn't run `mcd check` on round 1 or compare the two.
