# BUILD SPEC: The Inspectorate

## 1. Identity
A two-storey Concord civic office in deepslate and oak, with a quartz-and-glass Permit Office shopfront and a pedimented central bay. The sheet is symmetric, so build the left and right sides as mirrors.

## 2. Footprint and height
- **Size from the sheet:** counting the front elevation gives **26 wide × 24 deep × 19 tall**. The stated 17×13×11 would squash the pediment, pinnacles and 2-block plinth, so the sheet's size wins.
- **Plinth and cornice** span the full 26 × 24.
- **Walls** are 22 wide (x=2..23), set 2 in from each plinth edge.
- **Side walls** are 24 deep. They repeat the front's rhythm of oak piers and deepslate-framed windows, with an open-arch arcade ground floor.

## 3. Zones, bays and roof
**Vertical, with y=0 at the ground:**
- y=0–1: deepslate plinth.
- y=2–8: quartz arcade and shopfront. Arch springs at y=6–8. The sign fascia is at y=8.
- y=9: string course and sills.
- y=10–13: upper floor. Windows are y=10–12 and lintels are y=13.
- y=14: frieze and plaque.
- y=15: cornice (x=1..24).
- y=16–18: roof, pediment and pinnacles.

**Bays, left to right in x:**
- Piers: 2–3, 8–9, 16–17, 22–23 (2 wide each).
- Glazed bays: 4–7 and 18–21 (4 wide each).
- Door bay: 10–15 (6 wide).

**Upper floor:**
- Oak corner posts at x=2 and x=23.
- Oak pilasters at x=9 and x=16, with a deepslate centre pier at x=12–13.
- Windows (2 wide × 3 tall) at x=5–6, 10–11, 14–15 and 19–20.

**Roof:**
- A low hipped roof of deepslate-tile stairs, stepped about one block per course.
- A central pediment spans x=7–18, y=15–18. Its apex is at y=18 and its stair-stepped raking edges are light stone brick.
- Pinnacles sit at x=2, 9, 16 and 23.
- A chimney with a copper cap stands at the back of the west side, around z=20.

## 4. Material map
| Region | Block |
|---|---|
| Upper wall field | `deepslate_bricks`, patched with `cracked_deepslate_bricks` and `cobbled_deepslate` |
| Plinth and base | `deepslate_bricks`, `cracked_deepslate_bricks`, `mossy_stone_bricks`, `moss_block` |
| Window surrounds and string course | `polished_deepslate`, `deepslate_tiles` |
| Cornice and pediment edge | `stone_bricks`, `stone_brick_stairs`, `stone_brick_slab` |
| Pediment face | `stone_bricks` |
| Roof | `deepslate_tile_stairs`, `deepslate_tile_slab`, ridge cap `stone_brick_slab` |
| Oak posts and pilasters | `stripped_oak_log`, with `oak_planks` capitals |
| Upper window glass | `black_stained_glass_pane` in `dark_oak_trapdoor` frames |
| Closed shutters | `dark_oak_trapdoor`, or `spruce_trapdoor` |
| Sill flower boxes | `oak_trapdoor` |
| Ground-floor piers, arches, fascia | `smooth_quartz`, `quartz_bricks`, `quartz_stairs` |
| Shopfront glazing | `glass_pane`, framed in `light_blue_stained_glass_pane` mullions |
| PERMIT OFFICE sign | `quartz_block` plate, `gold_block` letters, `cyan_concrete` end caps |
| INSPECTORATE plaque | `polished_deepslate` letters on `stone_bricks` |
| Doors | `spruce_door` (double), `gold_block` handles |
| Lanterns | `lantern`, hung on `chain` from `iron_bars` brackets |
| Banners | `cyan_banner` with a gold cross |
| Planters | `barrel` with `flowering_azalea_leaves` |
| Steps | `quartz_stairs` and `smooth_quartz` |
| Pediment cross | `gold_block` |
| Chimney | `stone_bricks` |
| Chimney cap | `copper_block` |

## 5. Features
- **Door:** double `spruce_door` at x=12–13, y=3–5, with a glass transom at y=6 inside a quartz arch.
- **Steps:** x=10–15, three quartz treads rising from y=0 to the sill at y=3, with cheek walls at x=9 and x=16.
- **Arches:** three quartz arches with stepped spandrels. The glass sits behind the arch line, and the quartz fascia runs above.
- **PERMIT OFFICE sign:** x=8–17, y=8, with cyan end caps at x=8 and x=17. Hang it just below the cornice string course.
- **INSPECTORATE plaque:** x=8–17, y=14, framed by square carved blocks at its ends. Put the gold cross at x=12–13, y=16.
- **Lanterns:** at x=8 and x=17, y=5–6 (the pier fronts), plus one hung inside the door arch.
- **Corner lanterns:** upper corners at x=2 and x=23, y=11–12.
- **Banners:** cyan banners hang at x=0–1 and x=24–25, y=3–6.
- **Planters:** at x=3, 7, 18 and 22 (y=2–3) and either side of the steps (x=9 and x=16).
- **Complaint box:** a `barrel` at x=17, y=1–2, with `white_carpet` paper spilling onto the steps.
- **Interior (visible through the glass):** `oak_planks` floor, a desk and warm lanterns.
- **Closed shutters:** the right upper window only (x=19–20).

## 6. Depth plan
Offsets are relative to the main wall plane. Unless noted, + is proud and − is recessed.
- **Plinth:** +1.
- **Steps:** +3.
- **Quartz piers:** +1.
- **Shopfront glass:** −1 behind the arch line.
- **Sign fascia:** +1.
- **Oak posts and pilasters:** +1.
- **Upper windows:** −1, with a sill at +1.
- **Pediment bay:** +1.
- **Plaque:** +1.
- **Cornice:** +2, 1 block beyond the walls on each side.
- **Roof eaves:** overhang by 1.
