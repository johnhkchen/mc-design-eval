# BUILD SPEC: Deepslate Holdings (Concord granary, adaptive reuse)

## 1. Identity
A tall deepslate-and-oak granary with a tiled gabled roof and a rooftop elevator head. A glazed stair shaft runs up the front-right corner. A white quartz entrance portico with a COMMUNITY SERVICES sign sits at street level.

## 2. Footprint and height
- The sheet wins over the stated 17×15×22. The trace grid gives **36 W × 25 D × 46 H** (spire and rail included).
- That is about 2.1× the stated width and height. Keep the sheet's proportions and do not squash any axis.
- Main block: x0–29 wide, roughly 20 deep. The shaft sits at x29–35.
- The portico and steps project about 5 blocks in front of the main wall.
- Front wall plane is at depth z≈5, with the portico and steps in front of it. The side silhouette comes from the side trace.

## 3. Zones and bays
**Vertical (y from ground):**
- Plinth: y0–2.
- Ground storey: y2–10.
- Sign and entablature band: y10–14.
- Storey 2: y14–21, windows at y15–20.
- Storey 3: y21–29, windows at y22–27.
- Cornice and frieze: y30–32.
- Roof: y32–39.
- Gable apex: y39, with a spire to y42.
- Elevator head: y36–43, with a rail on top.

**Bays (left to right):**
- Corner pier at x2–3.
- Window bay at x5–7.
- Pier at x9–10.
- Window bay at x12–14.
- Pier at x17.
- Window bay at x20–22.
- Pier at x24–25.
- Window bay at x26–27.
- Corner pier at x29.
- Glass shaft at x30–33, framed by oak at x29 and x34–35.

**Roof:**
- A pitched deepslate-tile roof runs behind a central front gable (x9–25). The gable has stepped oak-trimmed rakes, a slit window, and a spire.
- Hips step down toward the rear, as in the side silhouette.
- The elevator head is an 8×8 deepslate box at x23–31, set toward the back.

## 4. MATERIAL MAP

| Region | Block |
|---|---|
| Main wall field | `deepslate_bricks`, mixed with `cracked_deepslate_bricks` and `polished_deepslate` |
| Roof tiles, gable field | `deepslate_tile_stairs` and `deepslate_tile_slab` |
| Cornice, string courses, lintels, keystones | `polished_deepslate` and `chiseled_deepslate` |
| Oak piers (vertical) | `stripped_oak_log` |
| Sills, window mid-bands, gable rakes | `oak_planks` and `oak_slab` |
| Shutters and slits | `oak_trapdoor` |
| Base (mossy) | `stone_bricks`, `mossy_stone_bricks`, `cobbled_deepslate` |
| Portico, columns, sign band | `smooth_quartz`, `quartz_pillar`, `quartz_slab` |
| Clean glass | `glass_pane` |
| Shaft stairs | `quartz_stairs`, with `quartz_slab` landings |
| Entrance doors | `spruce_door` (or `oak_door`), double |
| Lamps | `lantern` and `sea_lantern` |
| Banners | `cyan_banner` (wall-mounted) |
| Planters | `oak_leaves`, `flowering_azalea`, `allium`, `peony` |
| Entrance steps | `stone_brick_stairs` and `smooth_stone` |
| Spire and rails | `oak_fence` and `lightning_rod` |
| Sign text | `oak_wall_sign`, glow-inked gold |

## 5. Features
- **Entrance:** the quartz portico spans x10–25, y2–14. Four quartz columns sit at x11, x14, x21, x24, with a 5-wide double door at x15–19 (3 tall). Glazed panes fill between the columns.
- **Sign:** the "DEEPSLATE HOLDINGS / COMMUNITY SERVICES" sign sits on the quartz band at y11–14, x12–23.
- **Banners:** cyan banners hang at x10 and x24, y5–9.
- **Steps:** x13–23, 5 risers up from the street, with oak handrails.
- **Lamps:** lantern posts at x8, x25 and x29. Wall lanterns sit beside each pier at y≈18.
- **Ground-floor windows:** x4–7 and x26–28, arched and 3 wide.
- **Upper windows:** 3 wide × 5 tall, in 2 rows (y15–20 and y22–27). Each has an oak sill, an oak mid-band and a lantern inside. Planters sit on the storey-2 sills at x6, x13 and x21.
- **Planters at grade:** trees at x2–4 and x27–29, flower beds at x8–10 and x22–25.
- **Elevator head:** a slit window (oak trapdoors) on its front face, with an `oak_fence` rail on the roof.

## 6. Depth plan
- **Piers:** +1, with their caps at +2.
- **Cornice and frieze:** +2 overhang.
- **Windows:** recessed −1, with a 1-deep reveal.
- **Sign band:** +2.
- **Portico:** columns +3 to +4, canopy +4, steps +5.
- **Stair shaft:**
  - Glass at +1 from the main wall.
  - Oak frames at +2.
  - Stairs rise inside in a zig-zag, one flight per storey.
  - The shaft is 3 deep along the side, with a side wall of glass.
- **Right (+x) wall:** oak chutes and balconies project 1–2 blocks at each storey. These are small oak-and-deepslate landings with fences, linked by external stair runs, and the dark vertical downpipe seam is `black_concrete` or `deepslate`.
- **Left wall:** plain `deepslate_bricks` with oak pier rhythm and sparse windows.
- **Rear:** plain, stepped to the side silhouette, with a small back door at x≈23, y2–4.
