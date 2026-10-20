# Plan: MarketFront and the Hillclimb Landing (Pike Place Market, Seattle)

## SITE

Two modules, each in its own local frame, built IN SITE ORIENTATION (they are never turned). Scale 1.4 blocks/m, Minecraft 1.21.1 blocks only.
Orientation, both plots: **-z = north-west** (towards the North Arcade), **+z = south** (Pike Street). **+x = east, uphill** (Pike Place, then 1st Ave). **-x = west, downhill** (Elliott Bay). The face that matters most is the **WEST face (-x)**: it looks over the bay and is the face of the hero render. The "street front faces north" convention does NOT apply here. The street side is east (+x), along Pike Place.
Rule for every mass: build only on footprint `#` cells. A rectangle below is the mass's box: drop any cells of it that fall off the footprint, and follow the footprint edge. Each mass goes down to the GROUND map value of its cells with solid footing (plinth material), so nothing floats. A floor below the ground on the uphill (east) side is fine: that is retained hill, so fill it solid. Every deck or roof stays at or above the ground of its cells.
Convention: "deck N" = the block layer at y N, so you walk at y N+1.

### Plot 0: MarketFront (x 0..127, z 0..339, height ≤ y 117, real roofs ≈ y 69)
Ground runs from 2–6 on the west edge to 26–38 on the east (Pike Place). The building is four west-facing tiers, each 7 blocks (5 m) high, stepping up the bluff. The deck of each tier is a terrace with a glass railing for the tier above. The top deck is the public plaza, flush with Pike Place.

| Mass | x0..x1 | z0..z1 | y | Notes |
|---|---|---|---|---|
| W0 Base terraces (landscape) | 0..20 | 147..244 | ground..deck 6 | grey retaining walls stepping in 2 courses (top courses at y 4 on x 0..6, at y 6 on x 7..20), planters on each, footprint-clipped |
| T1 Lower shop tier | 21..41 | 91..244 | ground..deck 13 | storefront floor deck 6. West face along the footprint edge (x 21 for z 126..244, x 28 for z 91..125, x 35 at z 77..90) |
| T2 Gallery tier | 42..69 | 63..230 | ground..deck 20 | floor deck 13. West face at x 42: the long glass gallery |
| T3 Plaza tier | 70..125 | 140..230 | ground..deck 28 | floor deck 20. Shops on its west face at x 70 (south of z 140) |
| T3N North hall (under the plaza) | 77..125 | 98..139 | ground..deck 28 | floor deck 22 (ground 21–23 at its west face x 77/84). One glass storey y 23..27 on its west face |
| P Main plaza (roof of T3/T3N) | 70..125 | 98..230 | deck 28, walk 29 | flush with Pike Place at the east edge (ground 27–28). Covers the T3 + T3N footprint |
| H Housing block | 42..62 | 70..132 | 21..41, parapet 42 | 3 storeys (floor decks 20, 27, 34; roof deck 41), stands on the T2 deck. A 3-deep balcony zone on its west face, x 39..41, on the T1 deck at y 14+ (front edge of the T2 terrace) |
| M1 Old market building (white brick) | 98..111 + 98..118 + 105..118 | 0..27 + 28..41 + 42..69 | ground (32–38)..roof deck 52, parapet 53–54 | 3 storeys over a Pike Place base: floor decks 34, 40, 46. The three boxes make one L-shaped body |
| M2 Pike Place stall shed | 119..125 | 70..97 | ground (30)..37 | 1-storey open market shed: floor deck 31, flat roof deck 37 |
| TW West stair tower | 14..20 | 189..202 | ground (2)..35 | concrete and glass, 7x14. Rises from W0 past the T1/T2 decks to 7 above the plaza (cap deck 35). A doorway to each deck on its east face |
| SH South hillclimb stair | 35..90 | 231..251 | ground..16 | broad stair climbing +x. Flights: x 35..62 z 238..244 (ground 2–8, steps y 3..9), landing x 63..69 deck 9, flight x 70..90 z 245..251 (steps y 10..16) up to T2/T3. Planters on both sides, footprint-clipped |
| S1 Plaza south edge | 91..104 | 217..230 | deck 28 | plaza continues. Glass rail on its south and west edges |
| K Pike St elevator kiosk | 105..111 + 98..104 | 301..335 + 322..335 | ground (19–24)..40 | concrete-and-glass lift and stair kiosk (the detached cells at the south end), flat cap deck 40 |

Plaza features (on deck 28, walk 29):

| Feature | x0..x1 | z0..z1 | y |
|---|---|---|---|
| Bronze pig sculpture ("Billie") | 100..103 | 170..171 | 29..31 (4 long, 2 wide, legs y 29, body y 30..31, snout at x 99) |
| Planter beds with grasses and small trees (raised 1, smooth-stone rim) | 76..81 / 88..93 / 108..113 | 150..157, 180..187, 210..215 (same z bands, each x band) | 29 |
| Benches (spruce stair rows facing west, set against the planters) | the west sides of the planters | as the planters | 29 |
| Deck boards (spruce strips, 3 wide, running along z) | 80..82, 94..96, 106..108 | 98..230 | 28 (part of the deck) |
| Glass railing along the whole west edge and the north and south edges of the plaza | x 70 (x 77/84 on T3N), etc. | | 29 |
| Lamp posts | every 9 along x 71 and x 124 | z 102, 111 … 228 | 29..32 |

### Plot 1: Hillclimb Landing and Overlook (x 0..80, z 0..132, height ≤ y 86)
The ground is almost flat: 0–2, rising to 3–5 at the east edge. This plot is all built-up terraces. The Overlook Walk comes in high from the east at the NE (z 18..44) and steps down SW to the landing plaza at the waterfront (low x, high z). Each terrace is 7 higher than the one below it.

| Mass | x0..x1 | z0..z1 | y | Notes |
|---|---|---|---|---|
| D3 Overlook deck | 45..77 | 18..44 | ground..deck 23 | the walk's landing. Its east edge at x 77 is where the bridge comes in from MarketFront (open, railed on the north and south). Footprint-clipped (to x 74 at z 33..44) |
| ET Elevator and stair tower | 63..71 | 48..59 | ground (4)..36 | concrete piers at the 4 corners, glass between them. Lift shaft x 66..68 z 51..56. Doorways at D0 level (west face, y 3..5), D2 (west face, y 17..19) and D3 (north face z 48, y 24..26) |
| D2 Upper terrace | 18..62 | 45..62 | ground..deck 16 | footprint-clipped (starts x 18 at z 45..47, x 12 at z 48..50, …) |
| D1 Middle terrace | 3..50 | 63..86 | ground..deck 9 | footprint-clipped |
| D0 Landing plaza (waterfront) | 0..44 | 87..131 | ground..deck 2 | lawn and paving with benches. Footprint-clipped (x 3..35 at z 105..122, x 3..23 z 123..128, x 9..20 z 129..131) |
| N North planted slope | 30..65 | 0..17 | ground..16 | landscape only: planted steps at deck 16 (z 12..17), deck 9 (z 6..11), deck 2 (z 0..5), each with a grey retaining face to the north. No walkway |
| S32 Grand stair D2→D3 | 45..53 | 45..51 | steps y 17..23 | 9 wide, climbs north (facing north). The y 23 step at z 45 is flush with D3 |
| S21 Stair D1→D2 | 24..32 | 63..69 | steps y 10..16 | 9 wide, climbs north. Top step at z 63, flush with D2 |
| S10 Stair D0→D1 | 12..20 | 87..93 | steps y 3..9 | 9 wide, climbs north. Top step at z 87, flush with D1 |
| Planted banks | along each terrace's south and west retaining faces, 3 deep, inside the lower terrace | | | grass_block, moss, tall grass, azalea, one small oak per ~12 cells |

The stairs zigzag west (x 45 → 24 → 12) as they descend, so the stair runs read as the concept's diagonal climb.

## ROOFS
- There are no pitched roofs. MarketFront is a stack of flat, occupied roof terraces: the roof of each tier is the deck of the next (decks 13, 20, 28). The roofs are part of each tier's shell, so no `$MCD roof` is needed. The parts build these decks by hand as flat slabs.
- Tier eaves: each tier's deck projects **1 block past its west face** (x 20 for T1, x 41 for T2, x 69 for T3, x 76/83 for T3N), as a timber canopy fascia. This is the brown shadow line over every glass storey in the concept.
- H housing: flat roof deck 41 with a `modern` (flat-parapet-modern) style parapet: smooth-stone coping at y 42, with a rooftop iron-bar rail. A green roof (moss_block + short_grass) inside the parapet.
- M1 old market building: flat roof deck 52 with a brick parapet y 53–54 and a smooth-quartz coping and cornice (stepped corbel: stair course y 52 projecting 1 on the west and east faces). Build it by hand or use the `modern` preset with quartz coping.
- M2 shed: flat roof deck 37 on spruce beams, projecting 2 east over Pike Place as a canopy (x 126..127, only where the footprint allows; otherwise flush).
- TW, ET, K towers: flat concrete caps (smooth_stone deck, polished_andesite parapet 1 high). The glass shafts run up to just under the cap.

## FACADES
West faces, bottom up (the hero view). Every tier shares one grammar so the whole west face reads as tiers of glass and timber:

| Band | y (relative to the tier floor deck F) | Material | Depth |
|---|---|---|---|
| Plinth / retaining wall | ground..F | stone_bricks body, polished_andesite cap course at F | flush with the face line |
| Storefront glass | F+1..F+5 | glass_pane between posts, set 1 IN from the face line (recessed) | -1 |
| Timber posts | F+1..F+5, every 5 blocks along z (z ≡ 0 mod 5) | stripped_spruce_log axis y | flush (0) |
| Timber canopy beam / fascia | F+6 | stripped_spruce_wood beam along z, spruce_slab (top) soffit behind it | +1 (the deck overhang) |
| Deck edge | F+7 = next deck | smooth_stone | +1 |
| Glass railing | F+8 | glass_pane, polished_andesite posts every 10 | on the deck edge |

- **T1 (x 21 face)**: lit glass stalls and shops. Every 3rd bay (15 blocks) is a gray_concrete metal-panel bay, full height, flush, with a lantern each side of it.
- **T2 (x 42 face)**: the long glass gallery. Glass runs the full storey F+1..F+5 with no breaks except the posts, and gray_concrete spandrel strips at F+1 (a 1-high kick panel, recessed -1 with the glass).
- **T3 and T3N (x 70 / 77 face)**: shops, as T1. Over every 2nd post, a spruce bracket under the canopy (an upside-down spruce_stairs at F+5, proud +1).
- **Downhill end faces** (north z 63..77 and south z 230..244 ends of each tier): stone_bricks plinth, then light_gray_concrete metal-panel wall with 2-wide glass windows every 5.
- **H housing, west face x 42** (balcony zone x 39..41): white_concrete body, flush. Vertical cladding strips of stripped_spruce_log (axis y) every 7 along z, proud +1 (the timber fins). Windows are 3 wide x 2 high per bay per storey (y F+2..F+3), set -1. Each storey has a balcony 2 deep (x 40..41) on its floor deck, with a smooth_stone_slab floor (top half), a glass_pane rail at F+1 and a spruce_trapdoor privacy screen at the bay ends. String course of smooth_stone at y 27 and y 34 (+0). North, south and east faces: white_concrete with the same window rhythm, no balconies.
- **M1 old market building** (all faces, the west face first, then north and east): quartz_bricks body (white brick). A plinth of polished_andesite from ground to y 34. A ground storey (y 35..39) of large shop windows 4 wide every 6, with spruce frames, at Pike Place level (east). Upper storeys (y 41..51): windows 2 wide x 3 high on a 4-block rhythm (2 wall, 2 window), set -1, with a smooth_quartz_slab sill under each and a smooth_quartz lintel over each. A string course of smooth_quartz at y 40 and y 46 (+0). Paired quoins of smooth_quartz at every corner. Cornice at y 52, quartz stairs +1, then the parapet.
- **M2 shed (east face to Pike Place)**: open stall front of spruce posts every 4, with a striped awning of red and white wool carpet on spruce_slab at y 36 (+1), and hanging lanterns.
- **TW / ET / K towers**: polished_andesite corner piers 2x2 (+0) running the full height, full `glass` between them (the elevator glass), and smooth_stone floor bands at every deck level. ET gets a "HILLCLIMB" sign band on its west face at y 30..34 (dark gray_concrete board, white letters). TW and K are glass only.
- **Retaining walls (W0, plot 1 terraces, SH)**: stone_bricks body with ~1 in 10 mossy_stone_bricks near the ground, a polished_andesite cap, and a planter trough on top (spruce_trapdoor rim, grass and azalea). Plot 1 walls are concrete, so use polished_andesite there instead of stone_bricks, with a smooth_stone cap.

## MATERIALS
All checked with `$MCD blocks --check` (all known in 1.21.1).

| Role | Block |
|---|---|
| Retaining walls / plinths (plot 0) | stone_bricks, mossy_stone_bricks (≤10%), polished_andesite caps |
| Concrete (plot 1 walls, tower piers, stair cheeks) | polished_andesite |
| Stair treads (all public stairs) | polished_andesite_stairs; landings smooth_stone |
| Decks / pavement / tier deck edges | smooth_stone (pavers); plaza decking strips spruce_planks |
| Grey metal panels | gray_concrete (dark accent), light_gray_concrete (end walls) |
| Timber (posts, beams, canopy fascias, fins) | stripped_spruce_log, stripped_spruce_wood; soffits spruce_slab; brackets spruce_stairs |
| Housing body | white_concrete; coping smooth_stone |
| Old market building | quartz_bricks body, smooth_quartz trim and quoins, polished_andesite plinth |
| Glass | glass_pane (storefronts, rails, windows); glass (tower shafts) |
| Rail posts / rooftop rail | polished_andesite posts; iron_bars rooftop rail |
| Pig sculpture | waxed_copper_block (bronze, never oxidises); waxed_cut_copper_stairs for the snout and feet |
| Interior glow behind glass (dusk) | shroomlight and ochre_froglight ceilings 1 inside the glass; lantern hanging under every canopy bay |
| Ground and planting | grass_block, moss_block, short_grass, tall_grass, azalea, flowering_azalea, oak_log + oak_leaves (persistent) small trees |
| Shop awning accent (M2) | red_wool / white_wool carpets on spruce_slab |

Colour scheme: grey stone base (60%), warm spruce timber and lit glass (30%), white housing and old brick above (10%, the skyline). At dusk the warm glass bands between the grey decks read from the bay.

## OPENINGS
Openings stay AIR in the shell. The glazier fills them later.

| Opening | Where | Size |
|---|---|---|
| T1 storefronts | x 21 (or the footprint edge), y 7..11, every bay between posts on z ≡ 0 mod 5, except the panel bays | 4 wide x 5 high |
| T1 shop doors | x 21, y 7..8 at z 151..152, 181..182, 211..212 | 2 wide x 2 high, double doors |
| T2 gallery | x 42, y 14..18, every bay between posts | 4 wide x 5 high |
| T2 gallery doors | x 42, y 14..15 at z 141..142, 196..197 | 2 x 2 |
| T3 shopfronts | x 70, y 21..25, bays between posts, z 140..230 | 4 x 5 |
| T3N hall glass | x 77/84, y 23..26, z 98..139 | 4 x 4 per bay |
| T3 doors | x 70, y 21..22 at z 161..162, 201..202 | 2 x 2 |
| H windows | x 42, y F+2..F+3 (F = 20, 27, 34), 3 wide per 7-bay | 3 x 2 |
| H balcony doors | x 42, y F+1..F+2, one per bay next to the window | 1 x 2 |
| M1 ground shopfronts | x 118 (east, z 28..69) and x 111 (east, z 0..27), y 35..38, every 6 | 4 x 4 |
| M1 upper windows | all faces, y 41..43 and 47..49, every 4 | 2 x 3 |
| Plaza entry from Pike Place | the open east edge of P, x 125, z 140..230 | flush, no wall |
| TW doors | east face x 20, y 7..8 / 14..15 / 21..22 / 29..30, z 195..196 | 2 x 2 |
| ET doors | see the ET row in SITE | 2 x 3 |
| K doors | west face x 105, y at ground+1, z 315..316 | 2 x 2 |

## RESERVED
- Pig sculpture: x 99..103, z 170..171, y 29..31 (left air on the plaza).
- Planter beds and the trees in them: the plaza planter boxes listed in SITE, y 29..34 above them, left air.
- Lift shaft interiors: TW x 16..18 z 194..197, ET x 66..68 z 51..56, K x 107..109 z 310..314, from the bottom deck to the cap (air, glass-walled).
- Stair cuts: S32, S21, S10, SH: the decks leave these boxes open above the step line. The stair part builds the steps and the solid under them.
- Lamp post bases: on the plaza at x 71 and x 124 on a 9 rhythm; on plot 1 at the stair heads (x 44 and 54 at z 44; x 23 and 33 at z 62; x 11 and 21 at z 86) and every 9 along the terrace rails.
- Canopy overhang cells (x 20, 41, 69, 76/83 at F+6..F+7): these belong to the timber canopy part, not the deck slab.

## FLOORS

| Mass | Floor decks (walk = +1) | Interior volume (exterior-only: lit 4-deep strip behind glass, rest solid or dark) |
|---|---|---|
| T1 | 6 | x 22..25 behind the glass, y 7..12 |
| T2 | 13 | x 43..46, y 14..19 |
| T3 / T3N | 20 / 22 | x 71..74 (78..81), y 21..27 / 23..27 |
| Plaza P | 28 | open air |
| H housing | 20, 27, 34; roof 41 | x 43..46 behind the windows, y 21..40 |
| M1 | 34 (Pike Place shops), 40, 46; roof 52 | 4 deep behind every face, y 35..51 |
| M2 | 31 | open shed, y 32..36 |
| Plot 1 terraces | D0 2, D1 9, D2 16, D3 23 | open air |
| ET / TW / K | stops at every deck they serve | the shafts only |

---
# DESIGNER SECTIONS

## PALETTE
Architect's ids kept exactly. Checked with `$MCD blocks --check`: all known except `polished_andesite_wall` and `smooth_stone_stairs`, which DO NOT exist: use `andesite_wall` for posts and rails, `stone_stairs`/`smooth_stone_slab` for stone steps.

| Role | Blocks |
|---|---|
| Plinth/retaining | stone_bricks, mossy_stone_bricks (<=10%, low), stone_brick_stairs, stone_brick_slab, polished_andesite (caps), polished_andesite_slab, polished_andesite_stairs |
| Decks/pavers | smooth_stone, smooth_stone_slab, spruce_planks (plaza strips) |
| Metal panels | gray_concrete, light_gray_concrete |
| Timber | stripped_spruce_log (axis y posts, axis z beams), stripped_spruce_wood, spruce_slab, spruce_stairs, spruce_trapdoor, spruce_fence, spruce_door |
| Housing | white_concrete, smooth_stone, iron_bars |
| Old market | quartz_bricks, smooth_quartz, smooth_quartz_slab, smooth_quartz_stairs, quartz_stairs |
| Glass | glass_pane (connected states), glass |
| Rails/posts | andesite_wall, iron_bars |
| Bronze | waxed_copper_block, waxed_cut_copper_stairs, waxed_cut_copper_slab |
| Dusk light | shroomlight, ochre_froglight, lantern (hanging true/false), iron_chain, candle (lit), campfire none |
| Planting | grass_block, moss_block, short_grass, tall_grass, azalea, flowering_azalea, oak_log, oak_leaves persistent=true |
| Awning | red_wool, white_wool, red_carpet, white_carpet |
| Lift | soul_sand, bubble_column drag=false, ladder (backup) |
| Signs | gray_concrete board, white_concrete letters (plaque), spruce_wall_sign |

## VOCABULARY
Every helper clips to the footprint and the ground map; fills downward from its base y to ground with its plinth block.
- `tierMass(g,{x0,x1,z0,z1,deck,body})`: solid fill ground..deck-1 of stone_bricks, layer deck smooth_stone, cap course polished_andesite at deck-1 on the face edges. West face line per plan.
- `retainingWall(g,{x,z0,z1,top})`: stone_bricks column, 1 in 10 mossy_stone_bricks below y+3, polished_andesite_slab cap, spruce_trapdoor (open) rim plus planter on top.
- `glassBay(g,{x,z0,F,kick})`: 4 wide x 5 high (F+1..F+5): glass_pane set 1 IN from the face, posts at z%5==0 `stripped_spruce_log axis=y` flush, panes with north/south connection states; `kick:true` adds gray_concrete at F+1 (T2). Panel bay variant: gray_concrete flush F+1..F+5 with a lantern each side.
- `timberPost(g,{x,z,y0,y1})`: stripped_spruce_log axis=y.
- `canopyBay(g,{x,z0,z1,F,bracket})`: stripped_spruce_wood axis=z at F+6 one block out (x-1), spruce_slab type=top soffit behind it, smooth_stone deck edge F+7 one out, lantern hanging=true under the beam mid-bay, spruce_stairs half=top facing east bracket at F+5 if `bracket`.
- `shopDoor(g,{x,z,y,facing:"west"})`: two spruce_door pairs (lower+upper, same facing, mirrored hinge).
- `balconyBay(g,{z0,F})`: x40..41 smooth_stone_slab type=top at F, glass_pane rail at F+1 on the west edge x40, spruce_trapdoor open screens at each bay end, door 1x2 into the wall, window 3x2 glass_pane at F+2..F+3 set -1.
- `quartzWindow(g,{face,pos,y})`: 2 wide x 3 high glass_pane set -1, smooth_quartz_slab type=bottom sill under it, smooth_quartz lintel row over.
- `cornice(g,{box,y})`: quartz_stairs half=bottom facing outward at y52 projecting 1, then quartz_bricks parapet y53..54, smooth_quartz coping.
- `awningStall(g,{x0,x1,z0,z1})`: posts every 4, spruce_slab y36 out 1, red_carpet/white_carpet alternating every 2 cells on it, hanging lantern under each bay.
- `deckStrip(g,{x0,x1,z0,z1,y:28})`: spruce_planks 3 wide strips.
- `glassRail(g,{from,to,y:29})`: glass_pane along an edge, andesite_wall post every 10 (1 high) with the pane connected.
- `planterBed(g,{x0,x1,z0,z1,y:29,tree})`: smooth_stone rim ring at y29, inside moss_block/grass_block at y29 floor level (interior filled to y29), short_grass/tall_grass/azalea/flowering_azalea at y30, if `tree`: oak_log x3 + oak_leaves persistent ring 2 radius at y32..34.
- `benchRow(g,{x,z0,len})`: spruce_stairs facing west half=bottom,, a gap every 6.
- `lampPost(g,{x,z,y})`: andesite_wall x3 (y..y+2) then lantern hanging=false on top (y+3 = 32).
- `bronzePig(g,{x:99,z:170,y:29})`: legs waxed_cut_copper_stairs at the 4 corners (y29), body waxed_copper_block x100..102 z170..171 y30..31, head x99 y30..31 with waxed_cut_copper_stairs snout facing west (head block), ears waxed_cut_copper_slab top on head y32; tail stair x103 y31.
- `towerShaft(g,{x0,x1,z0,z1,top,decks,doors})`: 2x2 polished_andesite piers at the four corners full height, `glass` between, smooth_stone floor bands at each deck, shaft interior air with soul_sand floor + bubble_column drag=false in one cell column, smooth_stone cap + polished_andesite parapet. Doorways as given in OPENINGS left air.
- `stairFlight(g,{from,facing,to,width,material:"polished_andesite_stairs"})`: use toolkit `flight`; solid under each tread; polished_andesite cheek 1 wide each side; smooth_stone landings.
- `terraceMass(g,{box,deck})`: polished_andesite wall ground..deck-1, smooth_stone deck, smooth_stone_slab seat rows, andesite_wall rail posts.
- `plantedBank(g,{box})`: grass_block with moss_block patches, tall_grass/azalea/flowering_azalea, small oak per ~12 cells.
- `glowStrip(g,{x0,x1,z0,z1,y})`: shroomlight/ochre_froglight alternating at the ceiling 1 inside the glass, candle (lit) on the sill row.
- `plaque(g,text,{face,at,width,height})` toolkit sign: HILLCLIMB on ET west face y30..34.

## ROOMS
Exterior-only. The only "rooms" are lit strips behind glass; each is 4 deep, dressed so it reads from the bay at dusk (counters, shelves, stalls, warm lights). The helper must leave air; stairs/doors keep the plan's reserved cells.

## PARTS
1. parts/shell0.mjs: tierMass x4, T3N, plaza deck, H, M1, M2 massing, retaining walls W0, footings per GROUND. Openings left air. Order by x.
2. parts/plot1.mjs: plot 1 all terraces, N slope, three zigzag stairs, planted banks, benches, lamps.
3. parts/towers.mjs: TW, K, SH stair, ET shell (plot 1 frame), via towerShaft/stairFlight.
4. parts/facades.mjs: glassBay/timberPost/canopyBay/shopDoor on T1..T3N, H balconies and fins, M1 windows/quoins/cornice, M2 awning.
5. parts/plaza.mjs: planters, trees, benches, deck strips, glass rails, lamp posts, bronze pig, S1 edge.
6. parts/dusk.mjs: glowStrip behind glass, lanterns, HILLCLIMB and market signs, candles in stalls; final check pass.

### Checklist
- [x] P1 shell0 [ ] P2 plot1 [x] P3 towers [ ] P4 facades [ ] P5 plaza [ ] P6 dusk

### Notes for workers
- Local frames: plot 0 x 0..127 z 0..339, plot 1 x 0..80 z 0..132; clip every box to the footprint `#` cells (1 char = 7 blocks plot 0, 3 blocks plot 1) and fill down to the GROUND map: never float, never bury. West face is the hero.
- Build in site orientation, no turning. West faces look -x: door and trapdoor facing west.
- Plaza walk is y29, flush with Pike Place at the east edge; glass rails at y29 on the edges only.
- Only 1.21.1 blocks. `polished_andesite_wall` and `smooth_stone_stairs` do not exist.
- Canopy cells (x 20, 41, 69, 76/83) belong to P4, not P1.
- Left air for P4/P5: openings, pig box, planters, lift shafts, stair cuts.
- Entrance: plaza opens at the east edge (no door); street is Pike Place at x126 y28.
- P1 note: tiers have a lit AIR strip behind the west face (T1/T2/T3 5 deep, T3N 8 deep, floor+1..roof-1), solid behind; end walls light_gray_concrete. H west wall (x42) has air door cells (F+1..F+2 at z0+1) and window cells (F+2..F+3 at z0+2..4) for bays z0=70+7k. M1: ring wall 1 thick, air strip 4 deep, face-cell openings air (windows 2 wide u%4>=2, east shopfronts u%6 1..4); floors y40/y46 are full smooth_stone (sill cells there are taken); M1 roof deck y52 interior, ring quartz_bricks at y52 (cornice parapet goes at y53+). H/M1 N/S/E windows not carved on H. M2 roof planks y37, beams y36 every 4.
