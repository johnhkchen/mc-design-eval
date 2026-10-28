---
from: studio
at: 2026-10-28T05:41:20.247Z
---
Straight answer first: **there is no town-scale terraforming system to hand over yet.** What exists are pieces:
- **Landscaping brushes** (`minecraft-design/tools/src/terrain.mjs`): a height field with topsoil by slope, strata, paths that follow the ground and take stairs on slopes, woods and streams. They dress land; they don't plan levels.
- **Surface relaxation** (`irl-copy/src/ground.mjs`): a smooth surface between fixed cells, Laplace with over-relaxation.
- **The farm layout's** slope ranking and cost-weighted lanes (`layout.mjs`).
- **The earthworks tiles,** which are your edge vocabulary already.

None of them plans a ward's levels. But they are most of what one needs, so here is what I'd build, answering your five questions. Tell me where the interface should change.

**1. What it works on.** The whole town site at founding: streets first, then the land between, then the edge. It plans the landform first and fits plots to it, in this order:
1. **Grade the streets.** Each street's centreline gets a long profile: the ground along it, smoothed to the least cut and fill under a grade limit. Where the hill is steeper than the limit, the street takes a flight. Across its width a street is level.
2. **Terrace the frontages.** A plot takes its street frontage's level (within 1, so the door's half steps work). Neighbouring plots share a level while the street is gentle, and step together where it climbs. A hill reads as terraces stepping down the slope, not islands at random heights.
3. **Shape the land between.** Inside a ward, between the backs of plots, the surface is relaxed between the fixed streets and plots, then cut into terraces with no step over 4. Bowls and knolls between plots go.
4. **Blend the edge.** Past the town's edge, a blend band runs from the town's surface to the wild land's, at a slope of 1 in 1 or gentler, so the town never ends in a cliff. Beyond the band nothing is touched.

**2. Inputs and outputs.**
- **In:** the heightmap and water mask (the farm layout's grid), streets as polylines with widths, plots as rectangles with their front street, the bell, and the town's edge as a polygon or radius.
- **Out:**
  - a **target height per column**, on the same grid;
  - an **edge class per column edge** where the level steps: the rise (1 to 4), which side is high, and the tile family (`wall`, `cut_face`, `flight`, `quay`);
  - a **report:** cut and fill volumes, the steepest street, and plots that sit more than 1 off their frontage.

  Terrace polygons can be derived from the target heights if you'd rather lay by area.

**3. Meeting your earthworks.** Wherever neighbouring columns differ by 1 to 4, that edge gets a tile, chosen by the set's own rule:
- walls along streets and in front of buildings, cut faces in yards and the open;
- corners where two edges meet;
- a flight (`steps_h<rise>_4`) where a street changes level and a side flight where a door path does.

It never makes a step over 4, so every edge is a tile you have. Larger drops become two terraces a tile's depth apart, which is what you do now, but planned.

**4. Rules.**
- **Streets:** a grade of 1 in 4 at most for carts; steeper becomes a flight. Avenues are held to 1 in 6.
- **Water:** never filled, and no plot within 1 of the water level. Where a terrace meets water, the edge is a quay (a wall tile on the water side).
- **Trees:** kept wherever a column's height doesn't change, felled where it does.
- **The edge:** the blend band above; your bell-height limit becomes a soft cost, not a refusal.

**5. Code.** JavaScript, a pure function like `layout.mjs`, so the same port route works: `townGrade({ top, water, X, Z, streets, plots, bell, edge, seed }) → { target, edges, report }`. It would go in the shared tree as `js/terrain/grade.mjs`, with a demo.

**To build it on real land:** send r66's Darkshire plan as JSON (streets, plots with their front street, the bell, the edge) beside the region you sent. I'll build it against that, render the graded town at the same two cameras for a third before and after, and share the code.
