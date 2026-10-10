## Pass 1 (front)

Round 1's front is built and saved as `round-1.nbt` (26×19×24, no stairs, slabs or other non-full blocks). It matches the trace on the outline, the 2 storeys, the 3 arcade bays, the central door, the 4 upper windows and the depth layers.

- **Defining shapes:**
  - **Arcade arches:** the 3 arches use `arch` with a full-block profile, but they are 4, 6 and 4 wide, not about 7, because I followed the trace's glazed openings.
  - **Other brushes:** the pediment (`stepGable`, 10 wide, 4 high), the roof (`hipRoof`), the timber pilasters (`fins`) and the cornice all use their named brushes. Each brush's stair and slab output is converted to full blocks.
- **Depth and relief:** these come from the depth map. The steps are proud, the piers are +1, the sign band is +1, the shopfront glass is recessed 2 and the upper windows 1–2, and the tympanum is recessed 1. The `PERMIT OFFICE` sign has cyan end caps, and the right upper window has closed shutters.
- **Colour:** `palette-check.mjs` gives mean ΔE 11, so the under-10 target is not met, and 5 of 48 zones still drift. Two are the sky-coloured top corners, which compare the render background rather than the building. One is the pediment zone, where the concept's grey is lighter than my build's. The last is the lobby seen through the shopfront glass. I added a birch-plank backdrop there, and the checker now says it is slightly too light.
- **Deviations:**
  - **Lobby backdrop:** it is not in the spec's material map.
  - **Gold cross:** it is a 2×2 gold block, not a cross shape.
  - **Corner chimney stacks:** they are 2 wide at y16 with a single block at y17, per the trace.
  - **Placeholder roof deck:** the hipped roof covers only x=5–20, with a bare stone-brick deck beyond it, as the stub for the next pass.
- **Not built:** lanterns, banners, planters, the door's gold handles, and the sign and plaque lettering are left for the detail pass.
- **Files:** `build.mjs` keeps the front in `frontFace()` (`groundFloor`, `upperFloor`, `roofAndStacks`, `cornicePediment`) and the stub volume in `bodyAndSides()`. Renders are in `r1-tiles/`.

## Pass 2 (sides, back, roof)

Round-2 is built and saved as `round-2.nbt` (generator: `build2.mjs`). It loads `round-1.nbt` and leaves it byte-identical.

- **Sides and back:** both sides use the same layout, with the east side mirroring the west.
  - **Ground floor:** an arcade of three quartz arches with oak piers, glass set back one block, and light-blue mullions.
  - **Upper floor:** polished-deepslate window surrounds, oak pilasters and corner posts, and an oak dentil frieze.
  - **Back:** same layout, plus a spruce double door with a quartz step. I added a birch lobby wall behind the glass and weathering on the plinth.
- **Roof:** the round-1 low hip stays. I added a slate gutter deck behind a stone coping on the sides and back, stepped the back eave in, and put a copper-capped chimney at the back of the west side (x=2, z=19–20).
- **Front:** the front elevation is nearly but not exactly round-1. The only difference is 94 px (about 0.1%) of the 300×300 elevation, in a 10×17 px patch on the left glazed bay. The cause is the birch lobby wall behind the side glass. Starting that wall at z=8 shrank the difference from 968 px but did not remove it. Dropping the lobby wall from the sides would remove it, at the cost of the first side bay seeing through to the sky. Palette ΔE is 11, the same as round-1.
- **Chimney:** it is shorter than the concept's. Anything taller would show in the front elevation or break the 19-tall limit, so it tops out level with the roof plateau.
- **Not done:**
  - I did not run `mcd check`.
  - I looked at the right-elevation, back and front-left renders, but did not compare each side against `side-trace.png` cell by cell.
  - Side piers and frames are recessed inside the 22-wide footprint, not proud of it. A proud side relief would have shown on the front elevation.

Renders are in `r2-tiles/`.
