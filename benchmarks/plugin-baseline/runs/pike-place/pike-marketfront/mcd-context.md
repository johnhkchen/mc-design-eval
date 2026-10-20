# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
- [ ] P1 shell0 [ ] P2 plot1 [ ] P3 towers [ ] P4 facades [ ] P5 plaza [ ] P6 dusk

### Notes for workers
- Local frames: plot 0 x 0..127 z 0..339, plot 1 x 0..80 z 0..132; clip every box to the footprint `#` cells (1 char = 7 blocks plot 0, 3 blocks plot 1) and fill down to the GROUND map: never float, never bury. West face is the hero.
- Build in site orientation, no turning. West faces look -x: door and trapdoor facing west.
- Plaza walk is y29, flush with Pike Place at the east edge; glass rails at y29 on the edges only.
- Only 1.21.1 blocks. `polished_andesite_wall` and `smooth_stone_stairs` do not exist.
- Canopy cells (x 20, 41, 69, 76/83) belong to P4, not P1.
- Left air for P4/P5: openings, pig box, planters, lift shafts, stair cuts.
- Entrance: plaza opens at the east edge (no door); street is Pike Place at x126 y28.
```

### elements.md

```markdown
# REQUIRED ELEMENTS (checklist)

Frames: plot 0 local x 0..127 z 0..339; plot 1 local x 0..80 z 0..132. Everything clipped to the footprint `#` cells and footed down to the GROUND map. Part ids: P1 shell0, P2 plot1, P3 towers, P4 facades, P5 plaza, P6 dusk.

| # | Element | Construction (block by block) | Coordinates (plan.md) | Part | Vocab |
|---|---|---|---|---|---|
| 1 | Four west-facing tiers (W0 base, T1, T2, T3) | solid masonry mass: stone_bricks body (<=10% mossy_stone_bricks low down), polished_andesite cap course at deck, smooth_stone deck slab layer; fill ground..deck solid on the uphill side | W0 x0..20 z147..244 deck6; T1 x21..41 deck13; T2 x42..69 deck20; T3 x70..125 deck28 | P1 | retainingWall, tierMass |
| 2 | Rooftop plaza | smooth_stone deck y28, spruce_planks strips 3 wide along z, walk y29, flush with Pike Place | x70..125 z98..230 | P1 deck, P5 strips | deckStrip |
| 3 | Glass railing, plaza edges | glass_pane y29 (1 high on deck edge) + polished_andesite post every 10 (andesite_wall stands in: polished_andesite_wall does NOT exist) | x70 (77/84 on T3N), north and south edges | P5 | glassRail |
| 4 | Bronze pig "Billie" | waxed_copper_block body 3x2 at y30..31 (x100..102), head waxed_copper_block at x99 y30..31, snout waxed_cut_copper_stairs facing west at x99 y30 (bottom half), legs 4 corner waxed_cut_copper_stairs/ blocks at y29, ears two waxed_cut_copper_slab top on head, tail waxed_cut_copper_stairs at x103 y31 | x99..103 z170..171 y29..31 | P5 | bronzePig |
| 5 | Planters with grasses + small trees, benches | rim = smooth_stone full block ring 1 high at y29, inside moss_block/grass_block at y29, short_grass/tall_grass/azalea at y30; small oak (oak_log x3 + persistent leaves) in every 2nd bed; bench = spruce_stairs facing west, half bottom, on the west side, a row 6 long | beds x76..81/88..93/108..113 at z150..157,180..187,210..215 | P5 | planterBed, benchRow, plazaTree |
| 6 | Lamp posts | andesite_wall x3 + lantern on top, hanging=false | x71 and x124 every 9 z102..228, y29..32 | P5 | lampPost |
| 7 | West glass tiers (stalls, long gallery) | glass_pane F+1..F+5 recessed 1 between stripped_spruce_log posts every 5 (z%5==0), gray_concrete kick strip at F+1 on T2, every 3rd T1/T3 bay gray_concrete panel | T1 x21 F6; T2 x42 F13; T3 x70 F20; T3N x77/84 F22 | P4 | glassBay, timberPost |
| 8 | Timber canopy fascia | stripped_spruce_wood beam axis z at F+6 out 1 block, spruce_slab (top) soffit, hanging lantern under every bay, spruce_stairs (upside down) bracket on every 2nd post on T3 | x20,41,69,76/83 | P4 | canopyBay |
| 9 | Shop doors | spruce_door pairs (both halves, same facing west, hinge mirrored) in the openings | OPENINGS table | P4 | shopDoor |
| 10 | Housing block with balconies | white_concrete body, stripped_spruce_log fins every 7 proud 1, windows 3x2 with glass_pane, balconies x40..41 smooth_stone_slab(top) floor, glass_pane rail, spruce_trapdoor screens, smooth_stone string courses y27,y34, moss_block + short_grass green roof y41 inside smooth_stone parapet 42 + iron_bars | x42..62 z70..132 y21..42 | P1 shell, P4 detail | balconyBay |
| 11 | Old white-brick market building M1 | quartz_bricks body, polished_andesite plinth to y34, 4-wide shopfronts with spruce frames, 2x3 windows with smooth_quartz_slab sill + smooth_quartz lintel, string courses y40,y46, quartz_stairs cornice y52 +1, parapet y53..54, paired smooth_quartz quoins | x98..118 z0..69 y..54 | P1 shell, P4 windows | quartzWindow, cornice |
| 12 | M2 Pike Place stall shed | spruce posts (stripped_spruce_log) every 4, flat spruce_slab roof y37, red/white wool-carpet striped awning on spruce_slab y36 +1, hanging lanterns | x119..125 z70..97 | P4 | awningStall |
| 13 | West stair tower TW | polished_andesite 2x2 corner piers, full `glass` between, smooth_stone floor bands each deck, 3x4 lift shaft interior air, soul_sand + bubble_column (drag false) water elevator, cap smooth_stone + polished_andesite parapet | x14..20 z189..202 y..35 | P3 | towerShaft |
| 14 | Pike St elevator kiosk K | same grammar as TW, glass only | x105..111 z301..335, x98..104 z322..335 y..40 | P3 | towerShaft |
| 15 | South hillclimb stair SH | polished_andesite_stairs facing east (flight 1 facing +x), polished_andesite cheek walls, smooth_stone landing, planters both sides | x35..90 z231..251 | P3 | stairFlight |
| 16 | Overlook deck D3, terraces D2/D1/D0 | plot 1: polished_andesite walls ground..deck, smooth_stone deck, smooth_stone_slab seats, steps y3..9 etc. | plan Plot 1 table | P2 | terraceMass |
| 17 | Zigzag stairs S32/S21/S10 | polished_andesite_stairs facing north, 9 wide, cheeks polished_andesite, top step flush | plan Plot 1 table | P2 | stairFlight |
| 18 | Elevator + stair tower ET + "HILLCLIMB" sign | piers + glass as TW; dark gray_concrete board y30..34 west face with white letters via plaque() | x63..71 z48..59 | P3 shell, P6 sign | towerShaft, plaque |
| 19 | Planted slopes / banks | grass_block, moss_block, short_grass, tall_grass, azalea, flowering_azalea, small oak every ~12 cells | plot 1 banks, N slope | P2 | plantedBank |
| 20 | Dusk glow | shroomlight/ochre_froglight ceiling 1 inside glass, lit lanterns, glow behind panes, lit candles in stalls | behind every glass band | P6 | glowStrip |
| 21 | Rooftop neon-like signs | HILLCLIMB band; "PIKE PLACE MARKET" style banner letters on M1 parapet (plaque, banner style) | M1 y53..54 | P6 | plaque |
```

### rooms.json

```json
{"entrance":[125,29,185],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{"roles":{"plinth":["stone_bricks","mossy_stone_bricks","stone_brick_stairs","stone_brick_slab","polished_andesite","polished_andesite_slab","polished_andesite_stairs"],"decks":["smooth_stone","smooth_stone_slab","stone_stairs","spruce_planks"],"metal_panels":["gray_concrete","light_gray_concrete"],"timber":["stripped_spruce_log","stripped_spruce_wood","spruce_slab","spruce_stairs","spruce_trapdoor","spruce_fence","spruce_door"],"housing":["white_concrete","iron_bars"],"old_market":["quartz_bricks","smooth_quartz","smooth_quartz_slab","smooth_quartz_stairs","quartz_stairs"],"glass":["glass_pane","glass"],"rails_posts":["andesite_wall","iron_bars"],"bronze":["waxed_copper_block","waxed_cut_copper_stairs","waxed_cut_copper_slab"],"dusk_light":["shroomlight","ochre_froglight","lantern","chain","candle"],"planting":["grass_block","moss_block","short_grass","tall_grass","azalea","flowering_azalea","oak_log","oak_leaves"],"awning":["red_wool","white_wool","red_carpet","white_carpet"],"lift":["soul_sand","bubble_column","ladder"],"signs":["gray_concrete","white_concrete","spruce_wall_sign"],"Concrete structure and older white masonry":["light_gray_concrete","quartz_bricks"],"Grey panels, window surrounds and coping":["polished_andesite","polished_andesite_stairs","polished_andesite_slab"],"Terrace foundations, retaining walls and stairs":["stone_bricks","stone_brick_stairs","stone_brick_slab","stone_brick_wall"],"Flat roofs, plaza paving and slab ramps":["smooth_stone","smooth_stone_slab"],"Timber structure, eaves, decking, benches and planter trim":["stripped_spruce_log","spruce_planks","spruce_stairs","spruce_slab","spruce_fence","spruce_trapdoor","spruce_door"],"Gallery windows, tower glazing and railings":["glass","glass_pane","yellow_stained_glass","iron_bars"],"Exterior and window lighting":["lantern","sea_lantern"],"Landscaping and planted terraces":["grass_block","moss_block","oak_leaves","short_grass","tall_grass","fern","flower_pot","potted_fern"],"Shallow visible market displays":["barrel","chest","bookshelf","spruce_planks","spruce_slab"],"Copper pig sculpture":["cut_copper","cut_copper_stairs","cut_copper_slab"]},"objects":["lantern","sea_lantern","glass","glass_pane","yellow_stained_glass","iron_bars","spruce_door","barrel","chest","bookshelf","spruce_stairs","spruce_slab","spruce_fence","spruce_trapdoor","stripped_spruce_log","spruce_planks","stone_brick_stairs","stone_brick_slab","stone_brick_wall","smooth_stone_slab","polished_andesite_stairs","polished_andesite_slab","grass_block","moss_block","oak_leaves","short_grass","tall_grass","fern","flower_pot","potted_fern","cut_copper","cut_copper_stairs","cut_copper_slab"]}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: node build.mjs writes a temp file, which replaces build.nbt in one move.
set -eu
cd "$(dirname "$0")"
TMP=$(mktemp ./.build.XXXXXX)
trap 'rm -f "$TMP"' EXIT
node build.mjs "$TMP"
chmod 644 "$TMP"
mv "$TMP" build.nbt
```

### build.mjs

```js
// MarketFront and the Hillclimb Landing: one grid in site coordinates (see vocab/base.mjs), the ground under each plot's
// footprint, then every part in plan.md order. Usage: node build.mjs <out.nbt>   (make.sh runs it into a temp file)
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import {
  SITE_SIZE, PLOT0, PLOT1, PLOT0_SIZE, PLOT1_SIZE, onFootprint, groundAt, GRASS_BLOCK,
} from "./vocab/base.mjs";

// the terrain under the buildings: not a palette block (no part builds with it), so it is not checked against palette.json
const DIRT = "dirt";

const PARTS = [
  ["Shell and massing", "parts/shell0.mjs"],
  ["Hillclimb landing", "parts/plot1.mjs"],
  ["Towers and stairs", "parts/towers.mjs"],
  ["Facades and fittings", "parts/facades.mjs"],
  ["Plaza and grounds", "parts/plaza.mjs"],
  ["Dusk lighting and signs", "parts/dusk.mjs"],
];

// The ground: under each footprint cell with ground above y 0, solid dirt up to a grass surface at the ground height.
// Laid before the parts, so no part is locked out of it; each part footings down to it and fills its own plinth.
function layGround(g) {
  let cells = 0;
  for (const [plot, origin, size] of [[0, PLOT0, PLOT0_SIZE], [1, PLOT1, PLOT1_SIZE]]) {
    for (let lx = 0; lx < size.x; lx++) for (let lz = 0; lz < size.z; lz++) {
      if (!onFootprint(plot, lx, lz)) continue;
      const h = groundAt(plot, lx, lz), x = origin[0] + lx, z = origin[2] + lz;
      for (let y = 0; y < h; y++) { g.set(x, y, z, y === h - 1 ? GRASS_BLOCK : DIRT); cells++; }
    }
  }
  return cells;
}

// A part that does not load (its file is missing, or it imports a helper not written yet) is left out, not fatal:
// the stub stands in and the report says so. A part that loads and throws while building still fails the run.
async function loadPart(name, file, log) {
  try {
    const mod = await import(new URL(file, import.meta.url));
    if (typeof mod.build === "function") return mod.build;
    log(`part ${name}: SKIPPED (${file} exports no build())`);
  } catch (e) {
    log(`part ${name}: SKIPPED (${file} did not load: ${String(e.message).split("\n")[0]})`);
  }
  return () => {};
}

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

const list = [];
for (const [name, file] of PARTS) list.push([name, await loadPart(name, file, console.log)]);

const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
console.log(`ground: ${layGround(g)} cells under the footprints`);
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}: ${g.cells.size} blocks in a ${SITE_SIZE.join(" x ")} grid`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for every part: palette names, the site frame, the plots' footprint and ground maps, a seeded rng.
// Site frame: x east, y up, z south; 1.4 blocks per metre; 1.21.1 block ids. Parts write in SITE coordinates; the
// plan.md coordinates of each plot are plot-LOCAL, so add the plot's origin (PLOT0 or PLOT1) to them.

// Site grid size in blocks: world x 151..359, z 146..485, y 0..117.

// Site grid size in blocks: world x 151..359, z 146..485, y 0..117.
export const SITE_SIZE = [209, 118, 340];

// Plot origins in site coordinates: plot 0 local (0,0,0) and plot 1 local (0,0,0) (plot 0 world x232 z146; plot 1 world x151 z286).
export const PLOT0 = [81, 0, 0];

export const PLOT1 = [0, 0, 140];

// Plot sizes in blocks (local x, z) and highest allowed y, as plan.md states them.
export const PLOT0_SIZE = { x: 128, z: 340, top: 117 };

export const PLOT1_SIZE = { x: 81, z: 133, top: 86 };

// Deck heights (y of the deck; walk = deck + 1) from plan.md: MarketFront tiers, the plaza, housing, M1, plot 1 terraces.
export const DECKS = {
  W0: 6, T1: 13, T2: 20, T3: 28, T3N: 22, PLAZA: 28, PLAZA_WALK: 29, H_FLOORS: [20, 27, 34], H_ROOF: 41,
  M1_FLOORS: [34, 40, 46], M1_ROOF: 52, M2_FLOOR: 31, M2_ROOF: 37, TOWER_CAP: 35, K_CAP: 40,
  D0: 2, D1: 9, D2: 16, D3: 23, PLOT1_STAIR_TOPS: [9, 16, 23],
};

// Palette: the palette.json ids as named constants (1.21.1). Groups follow palette.json's roles.
// plinth
export const STONE_BRICKS = "stone_bricks";

export const MOSSY_STONE_BRICKS = "mossy_stone_bricks";

export const STONE_BRICK_STAIRS = "stone_brick_stairs";

export const STONE_BRICK_SLAB = "stone_brick_slab";

export const POLISHED_ANDESITE = "polished_andesite";

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";

export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";

// decks
export const SMOOTH_STONE = "smooth_stone";

export const SMOOTH_STONE_SLAB = "smooth_stone_slab";

export const STONE_STAIRS = "stone_stairs";

export const SPRUCE_PLANKS = "spruce_planks";

// metal_panels
export const GRAY_CONCRETE = "gray_concrete";

export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";

// timber
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";

export const STRIPPED_SPRUCE_WOOD = "stripped_spruce_wood";

export const SPRUCE_SLAB = "spruce_slab";

export const SPRUCE_STAIRS = "spruce_stairs";

export const SPRUCE_TRAPDOOR = "spruce_trapdoor";

export const SPRUCE_FENCE = "spruce_fence";

export const SPRUCE_DOOR = "spruce_door";

// housing
export const WHITE_CONCRETE = "white_concrete";

export const IRON_BARS = "iron_bars";

// old_market
export const QUARTZ_BRICKS = "quartz_bricks";

export const SMOOTH_QUARTZ = "smooth_quartz";

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";

export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";

export const QUARTZ_STAIRS = "quartz_stairs";

// glass
export const GLASS_PANE = "glass_pane";

export const GLASS = "glass";

// rails_posts
export const ANDESITE_WALL = "andesite_wall";

// bronze
export const WAXED_COPPER_BLOCK = "waxed_copper_block";

export const WAXED_CUT_COPPER_STAIRS = "waxed_cut_copper_stairs";

export const WAXED_CUT_COPPER_SLAB = "waxed_cut_copper_slab";

// dusk_light
export const SHROOMLIGHT = "shroomlight";

export const OCHRE_FROGLIGHT = "ochre_froglight";

export const LANTERN = "lantern";

export const CHAIN = "chain";

export const CANDLE = "candle";

// planting
export const GRASS_BLOCK = "grass_block";

export const MOSS_BLOCK = "moss_block";

export const SHORT_GRASS = "short_grass";

export const TALL_GRASS = "tall_grass";

export const AZALEA = "azalea";

export const FLOWERING_AZALEA = "flowering_azalea";

export const OAK_LOG = "oak_log";

export const OAK_LEAVES = "oak_leaves";

// awning
export const RED_WOOL = "red_wool";

export const WHITE_WOOL = "white_wool";

export const RED_CARPET = "red_carpet";

export const WHITE_CARPET = "white_carpet";

// lift
export const SOUL_SAND = "soul_sand";

export const BUBBLE_COLUMN = "bubble_column";

export const LADDER = "ladder";

// signs
export const SPRUCE_WALL_SIGN = "spruce_wall_sign";

// Footprint of plot 0: 1 char = 7x7 blocks, '#' = build here. Rows run along +z (north at row 0), columns along +x (west at column 0).
export const FOOT0 = [

// Ground height above y 0 per 7x7 cell of plot 0 (blocks; 0 = no ground in that cell). Same layout as FOOT0.
export const GROUND0 = [

// Footprint of plot 1: 1 char = 3x3 blocks, '#' = build here. Rows along +z, columns along +x.
export const FOOT1 = [

// Ground height above y 0 per 3x3 cell of plot 1 (blocks; 0 = no ground). Same layout as FOOT1.
export const GROUND1 = [

// The map cell size of each plot, in blocks.
export const CELL = { 0: 7, 1: 3 };

// Footprint test for a plot-LOCAL block (plot 0 or 1): true when its cell is '#' on the footprint map.
export function onFootprint(plot, x, z)

// Ground height (blocks above y 0) at a plot-LOCAL block (plot 0 or 1); 0 outside the map.
export function groundAt(plot, x, z)

// Seeded rng: rng(seed)() returns a float in [0, 1) (mulberry32); the same seed gives the same sequence.
export function rng(seed)
```

### vocab/h1.mjs

```js
// Helpers for MarketFront and the Hillclimb Landing (plan.md VOCABULARY, one function per name).
// Every helper takes its position as arguments and writes only inside its own footprint, only into air: a cell that
// already holds a block is skipped and counted, never overwritten (an earlier part owns it). Each returns { placed, skipped }.
// Stone-bearing helpers take ground (a number, or (x, z) => y) and inside (x, z) => bool to clip to the footprint.

/** One solid tier: body (stone_bricks) from the ground up to deck-1, polished_andesite cap course at deck-1 on the face
 *  edges, smooth_stone deck layer at y = deck. Fills down from the base to ground, so nothing floats. */
export function tierMass(g, { x0, x1, z0, z1, deck, body = "stone_bricks", ground = 0, inside = () => ...

/** A stripped spruce post from y0 to y1 (inclusive), axis y. */
export function timberPost(g, { x, z, y0, y1 })

/** One 7-long balcony bay on the west face of the housing: x-2..x-1 a top smooth_stone_slab floor at F, a glass_pane rail
 *  at F+1 on the outer edge, open spruce_trapdoor screens at both bay ends, a spruce_door (both halves) in the wall at
 *  F+1..F+2, and a 3 x 2 glass_pane window set one IN from the wall (x+1) at F+2..F+3. x is the wall's face line (42). */
export function balconyBay(g, { z0, F, x = 42 })

/** A market stall shed front on the east face (x1): spruce posts every 4 along z from y floor+1 to floor+4, a spruce_slab
 *  awning (top half) at floor+5 one block out (x1+1), red and white carpets alternating every 2 cells on it at floor+6,
 *  and a hanging lantern under each bay (hung from the awning). floor is the shed's floor deck (31). */
export function awningStall(g, { x0, x1, z0, z1, floor = 31 })

/** A raised planter bed: a smooth_stone rim ring at y, moss_block/grass_block soil at y inside it, and plants at y+1
 *  (azalea, flowering_azalea, short_grass in a pattern). tree: an oak trunk (3 logs, y+1..y+3) in the centre with a
 *  persistent oak_leaves crown (radius 2, narrowing to 1 at the top) at y+3..y+5. The bed is at least 5 wide for a tree. */
export function planterBed(g, { x0, x1, z0, z1, y = 29, tree = false })

/** The bronze pig "Billie", anchored at its snout column x (head, x..x+4 long, z..z+1 wide, y..y+3 high): four waxed cut
 *  copper stair feet at y, a waxed copper body at x+1..x+3 y+1..y+2, a waxed copper head column at x (snout stairs facing
 *  west at y+1, the head block at y+2), two waxed cut copper slab ears on the head at y+3, a tail stair at x+4 y+2. */
export function bronzePig(g, { x = 99, z = 170, y = 29 } = {})

/** A built-up terrace: polished_andesite from the ground up to deck-1 (solid, so nothing floats), smooth_stone deck at
 *  y = deck, a row of smooth_stone_slab seats at deck+1 along the inner x0+1 edge, and andesite_wall rail posts at
 *  deck+1 on the box's corners and every 10 along its edges. box = { x0, x1, z0, z1 }. */
export function terraceMass(g, { box, deck, ground = 0, inside = () => ...

/** Lettering on a dark gray_concrete board with white_concrete letters, on the wall at `at` (the wall cell; width runs
 *  along the wall, height up). Wraps the toolkit plaque. Air only by default: the board style recolours the wall it
 *  sits on, so that needs replace: true (the ET sign on its west face is the one that does). */
export function plaque(g, text, { face, at, width, height, replace = false })
```

### vocab/h2.mjs

```js
// H2 helpers from plan.md VOCABULARY: retainingWall, canopyBay, quartzWindow, deckStrip, benchRow, towerShaft,
// plantedBank. Each takes its position as arguments and writes only through scope(): a cell is written only if it is
// inside the helper's own box, not in `skip`, and is air (or one of the `over` ids). Anything else is counted in
// `refused` and left alone, so a helper never touches the ground, a floor or an earlier part's blocks. Each returns
// { placed, refused }. Block ids and states are 1.21.1 (B.* from the build library, plus the few written out here).

/** Retaining wall on a west (or east) edge: two-wide stone column at x (and x+in), cap slab at top, open spruce
 *  trapdoor rim at top+1 on the face, grass planter behind it. base = lowest stone (default top-3). */
export function retainingWall(g, { x, z0, z1, top, base = top - 3, face = "west", over = [] })

/** Timber canopy for one bay on a west (or east) face at storey floor F: beam out 1 at F+6 (x+out), soffit slab at x,
 *  smooth_stone deck edge at F+7, a hanging lantern from the beam, and a bracket on every 2nd post when `bracket`. */
export function canopyBay(g, { x, z0, z1, F, face = "west", bracket = true, over = [] })

/** Two-wide, three-high window set 1 in from a face: glass panes, smooth_quartz_slab sill under, smooth_quartz lintel over.
 *  at = the face line (x for west/east, z for north/south); pos = the first cell along the face; y = bottom of the glass. */
export function quartzWindow(g, { face, at, pos, y, over = [] })

/** Spruce plank strips 3 wide along z on the plaza deck at y (28): they replace the pavers under them. strips = the
 *  x where each strip starts (default every 14 from x0). over defaults to smooth_stone, the deck they replace. */
export function deckStrip(g, { x0, x1, z0, z1, y = 28, strips = [], over = ["smooth_stone"] })

/** A row of spruce stair seats along z at (x, y, z0..z0+len-1), facing `facing` (the toolkit's back side); every 6th cell
 *  is left open. Writes only at y, so the 2-high lane above the seats stays clear. */
export function benchRow(g, { x, z0, len, y = 29, facing = "west", over = [] })

/** Lift tower over the box, from base (air above the ground) to the smooth_stone cap at top, parapet at top+1.
 *  2x2 polished_andesite piers at the corners, glass between them, smooth_stone floor bands at the decks. The lift is
 *  the centre cell: soul_sand at base, a drag-free bubble column up to the cap, left open through the bands. doors: cells
 *  left air (the openings). */
export function towerShaft(g, { x0, x1, z0, z1, base, top, decks = [], doors = [], over = [] })

/** Planted bank over the box, with grass_block at y, moss patches, low planting at y+1 and one small oak per 12 cells
 *  (trunk y+1..y+3, persistent leaves around y+3..y+4). Trees go in first, so plants never take a trunk cell. */
export function plantedBank(g, { x0, x1, z0, z1, y, over = [] })
```

### vocab/h3.mjs

```js
// Helpers from plan.md VOCABULARY (glassBay, shopDoor, cornice, glassRail, lampPost, stairFlight, glowStrip).
// Every helper takes its own position (and facing) as arguments, writes only inside the footprint it returns
// as `box`, and writes only into air unless { replace: true }. A refused write is listed in `refused`, never forced.

/** A glass bay on a west-facing wall. x is the face line: posts (z % 5 == 0) sit flush on it, panes 1 in at x + 1.
 *  Covers z0..z0+4 and F+1..F+5. kick: a gray_concrete kick row at F+1 (T2). panel: a flush gray_concrete panel
 *  instead of glass (its lanterns sit outside this footprint: the caller lights them). */
export function glassBay(g, { x, z0, F, kick = false, panel = false, replace = false })

/** A double door in a west-facing opening: two leaves side by side along z, hinges mirrored, each lower + upper half.
 *  (x, z) is the first leaf's cell at the bottom; the second leaf is at z + 1. */
export function shopDoor(g, { x, z, y, facing = "west", material = "spruce", replace = false })

/** A stepped quartz course at y projecting 1 on the west and east faces of box (plan M1), then a quartz_bricks
 *  parapet at y+1..y+2 around the box and a smooth_quartz coping at y+3. box: { x0, x1, z0, z1 }. The corbel
 *  stairs face outward, as plan.md says (the toolkit's cornice note says into the wall; see the summary). */
export function cornice(g, { box: w, y, replace = false })

/** A glass rail along one edge at y (the deck edge, walk level): from and to are [x, z] on one line (x or z equal).
 *  glass_pane between andesite_wall posts every 10 cells (the first at from). Panes connect to their neighbours
 *  along the rail only. */
export function glassRail(g, { from: [x0, z0], to: [x1, z1], y = 29, replace = false })

/** A lamp post: andesite_wall x3 at y..y+2 with a standing lantern on top (y+3). */
export function lampPost(g, { x, z, y, replace = false })

/** A stair flight a player walks up without jumping (toolkit flight: from = first step's cell, facing = the way you
 *  walk up, to = the upper floor's layer). Solid polished_andesite under every tread down to the first solid block,
 *  a 1-wide polished_andesite cheek each side, and a smooth_stone landing at the top. Stays in air: the toolkit's
 *  flight runs through guard(), which refuses every write into a non-air cell. */
export function stairFlight(g, { from: [x, y, z], facing, to, width = 1, material = "polished_andesite_stairs", replace = false })

/** Lit strip behind glass: shroomlight / ochre_froglight alternating on the ceiling row y over x0..x1 x z0..z1, and a
 *  candle (lit) on the sill row y-1 along the glass-side column x0, every 3 cells, only where a block holds it.
 *  The strip is at most 4 deep (plan ROOMS). */
export function glowStrip(g, { x0, x1, z0, z1, y, replace = false })
```

## The build library (/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs): outline

### build.mjs (library)

```js
// Authoring builds as CODE: design one bay, tile it; mirror for symmetry; protect function with a guard.
// Coordinate bookkeeping is where design time and errors go — write a short generator script with these helpers
// instead of typing hundreds of coordinates.
//
//   import { load, Grid, guard, tile, mirrorX, B, face } from "<plugin>/tools/src/build.mjs"
//   const g = guard(load("in.nbt"))                 // refuses writes into functional cells (see check.mjs)
//   runParts(g, [["shell", shellPart], ["porch", porchPart]], { palette: "palette.json" })  // later parts only add
//   tile(g, { from: 1, step: 4, count: 5, axis: "z" }, (z) => bay(g, z))
//   g.save("out.nbt")

// ---- directions -------------------------------------------------------------------------------------------------
export const DIRS = { north: [0, 0, -1], south: [0, 0, 1], west: [-1, 0, 0], east: [1, 0, 0] };

export const OPPOSITE = { north: "south", south: "north", east: "west", west: "east", up: "down", down: "up" };

export const face = {
  opposite: (f) => ...
  cw: (f) => ...
  ccw: (f) => ...
  mirrorX: (f) => ...
  mirrorZ: (f) => ...
};

// ---- block helpers: return [block, state] pairs for g.set(x, y, z, ...B.stairs(...)) ----------------------------
// Stairs `facing` = the side of the full-height back; a cornice/bracket lip toward the street uses
// facing = the INWARD direction with half: "top".
export const B = {
  stairs: (mat, facing, half = "bottom", shape = "straight") => ...
  slab: (mat, type = "bottom") => ...
  log: (mat, axis = "y") => ...
  wood: (mat, axis = "y") => ...
  pillar: (block, axis = "y") => ...
  trapdoor: (mat, facing, half = "bottom", open = false) => ...
  door: (mat, facing, half = "lower", hinge = "left") => ...
  fence: (mat) => ...
  wall: (mat) => ...
  pane: (block = "glass_pane") => ...
  lantern: (hanging = false) => ...
  chain: (axis = "y", version26 = true) => ...
  wallTorch: (facing) => ...
  block: (name) => ...
  banner: (color, patterns = [], { wall = true, facing = "north", rotation = 0, legacy = false } = {}) => ...
  sign: (wood = "oak", lines = [], { wall = true, facing = "north", rotation = 0, hanging = false, color = "black", glow = false, back = [], dataVersion = 4189 } = {}) => ...
};

// ---- placement helpers ------------------------------------------------------------------------------------------
/** Call fn(pos, i) for count positions from `from`, `step` apart (the bay rhythm). */
export function tile(_g, { from = 0, step, count, to }, fn)

/** Run `paint(set)` twice: as written, and mirrored across x = cx (x' = 2cx - x), flipping east/west facings. */
export function mirrorX(g, cx, paint)

export function mirrorZ(g, cz, paint)

/** Hollow box: walls (and optional floor/ceiling) of a cuboid. */
export function shell(g, a, b, block, { floor = true, ceiling = true, state } = {})

/** Set a box to air (carving). Air is stored, so it clears the cell when the structure is placed. */
export const carve = (g, a, b) => ...

/** Replace only where the current block matches `from` (a name or a predicate). */
export function replace(g, a, b, from, block, state)

/**
 * Wrap a grid so writes into protected cells are refused (counted, never thrown), so a decor script cannot
 * break function. protect: Set of "x,y,z" — default: the grid's own functional cells and the cells that must stay
 * clear around them (check.mjs functionalCells). `g.refused` lists what was blocked; report it.
 */
export function guard(g, protect)

/**
 * Draw blocks from text, the way Litematica stores a schematic (a palette, then one index per cell): one character per
 * block, a legend for the characters. Far fewer tokens than a set() per block, and the layout is visible as written.
 *   layers(g, [x, y, z], { "#": "oak_planks", "b": ["red_bed", { facing: "south", part: "head" }], "c": "chest" }, [
 *     ["#####", "#b c#", "#b  #"],      // y: rows run along +x, successive rows along +z
 *     ["#####", "#   #", "#   #"],      // y + 1 ...
 *   ])
 * A single layer may be passed as one array of rows. Characters not in the legend (space, ".") are left as they are.
 * Writes go through g.set, so runParts' lock and palette report apply. Returns the number of blocks placed.
 */
export function layers(g, [x0, y0, z0], legend, rowsOrLayers)

/**
 * Run a build's parts in order so each part can only ADD to what earlier parts built: a write into a cell an earlier
 * part placed (air included, so no carving) is refused, counted, never thrown, so a later part can't knock holes in
 * a wall. Cells set before runParts (the ground) stay writable: farmland and paths may replace grass. With a palette
 * (palette.json, or its object: { roles: { role: [blocks] }, objects: [blocks] }), every block placed outside it is
 * reported. Prints one line per part, writes the reports to `report` (default parts-report.json; null for none) and
 * returns them.
 * roof: a roof spec (roof.json, as for `mcd roof --spec`) laid right after the FIRST part (the shell), so every later
 * part builds around the finished roof instead of the roof tool clearing the attic, gables and lofts after them. No
 * file yet (the roof part writes it, maybe in another copy at the same time): skipped with a note, never an error.
 * sockets.json in the working directory (or reserve: a layout or path; null for none) reserves the redstone shops'
 * envelopes: every write into one is refused. A part given { carve: true } (the stair joiner) may cut through earlier parts' floors and ceilings for its
 * stairwells: cells with air straight above or below. Walls stay refused.
 *   runParts(g, [["shell", shell.build], ["stairs", stairs.build, { carve: true }], ["garden", garden.build]],
 *     { palette: "palette.json", roof: "roof.json" })
 */
export function runParts(g, list, { palette, roof, reserve, log = console.log, report = "parts-report.json" } = {})

/** Lettering in a band: plaque(g, "LEAGUE HALL", { at, face, width, height, letter?, material?, frame?, style?, relief? }) */
export const plaque = (g, text, o) => ...

/** A bed, both halves: foot at [x,y,z], the head one step toward facing (the pillow end), same colour and facing.
 *  Both cells must be air (a bed never replaces a wall block); the head goes against a solid wall, never a window or
 *  a door. Returns true when placed, false (placing nothing) when a cell is taken. */
export const bed = (g, [x, y, z], facing, color = "red") => ...

/** A straight flight of stairs a player walks up without jumping: from = the first step's cell (standing on the lower
 *  floor), facing = the way you walk up, to = the y of the UPPER FLOOR's own block layer. The last step is set in that
 *  layer, flush with the floor you step out onto, so a storey of h (floor to floor) takes h steps. Clears 2 blocks of
 *  headroom over every step (cutting the floor above where the flight passes) and hangs an upside-down stair under each
 *  step as a stringer. width runs to the right of facing. Returns { steps, landing: [x,y,z] (feet on the upper floor), notes }. */
export const flight = (g, { from: [x, y, z], facing, to, material = "oak", width = 1, stringer = true }) => ...

/** A hearth and its chimney: the fire at the BOTTOM, smoke up a flue, the stack set INTO the wall so the room loses no
 *  space. Give wall = [x, floor level, z], a cell of the outside wall at the hearth's floor level, and into = the side the
 *  room is on: the campfire goes one cell OUTSIDE the wall (an exterior chimney), the wall cell becomes the hearth's
 *  mouth with a lintel over it, and the flue rises outside the wall with the house wall as its room side. (Or give
 *  at = the campfire's cell and open = the side its mouth faces, for an interior chimney set into a partition.)
 *  top = the flue's last course (1-2 over the roof where it leaves it; the mouth is open above). The flue is a 1 x 1
 *  column of air walled on all four sides at every level: the house wall below the roof, and from the roof up the
 *  chimney's own masonry (never the roof's tiles), or with thin: "iron" | "copper" | a wood, an open trapdoor lying
 *  flat against the flue where there is only air beside it (a slim pipe above the roof). Build it after the roof.
 *  It lays its own footing down to the ground and overwrites what is in its cells: call it directly, never through a
 *  helper that writes only into air (that helper refuses the whole stack over one filled cell). */
export const chimney = (g, { wall, into, at, open = "south", top, material = "bricks", thin = null, lintel = true, roofY }) => ...

/** A window shutter: an open trapdoor in the cell in front of the wall (on the face side), lying flat against it.
 *  face: the way the wall looks (north for a north front); the trapdoor's facing is the face, so it lies on the wall. */
export const shutter = (g, [x, y, z], face, wood = "spruce", { height = 1 } = {}) => ...

/** A word in banner letters hung on a board, in reading order for its face: bannerWord(g, "BUTCHER", { center: [14, 10, 4], face: "north" }). */
export const bannerWord = (g, word, o) => ...

/** The sockets' fit-out (glass wall lines and back walls, spawn-proof pit floor, counters): fitSockets(g, layout, { counter, glass }) */
export const fitSockets = (g, layout, o) => ...

/** A clock face on a tower: clock(g, { center, face, radius?: 2-4, dial?, bezel?, hands?, time?: "10:10", out?: 0|1 }) */
export const clock = (g, o) => ...

/** A shop sign: signboard(g, "BAKERY", { at, face, mode: "wall"|"hanging", width?, height?, wood? }) */
export const signboard = (g, text, o) => ...

/** Banners along a row: bunting(g, { from, to, face, colors?, every?, pattern? }) */
export const bunting = (g, o) => ...

/** A profiled pilaster: pilaster(g, { at, face, height, width?, out?, material?, profile?, shoulder? }) */
export const pilaster = (g, o) => ...

/** An opening surround: surround(g, { at, face, width, height, preset?, trim?, keystone?, reveal?, door?, arch? }) */
export const surround = (g, o) => ...

/** Glazing: glazing(g, { at, face, width, height, preset: grid|shopfront|transom|sidelights, frame?, door? }) */
export const glazing = (g, o) => ...

/** A light fitting: fixture(g, { at, face, mount: bracket|arm|top|hang, lamp? }) */
export const fixture = (g, o) => ...

/** A planter: planter(g, { at, face, width, kind: box|ground, depth?, plants? }) */
export const planter = (g, o) => ...
```

## The toolkit reference (references/toolkit.md)

# Toolkit reference

`MCD="node ${CLAUDE_PLUGIN_ROOT}/tools/bin/mcd.mjs"` — pure Node 20+, no install. First use downloads the
Minecraft client jar for the needed version from Mojang (sha1-verified) into `~/.cache/minecraft-design/`, or
uses `$MC_CLIENT_JAR`, the official launcher's or Prism Launcher's local jars. Nothing copyrighted ships here.

## Coordinates and facing (read this once)

- Files: every command reads a structure `.nbt` or a Litematica `.litematic` (all regions, in one box); `g.save()`
  and `mcd convert` write either, by extension. Block-entity data and entities survive both ways.
- Structure-local: `x` east, `y` up, `z` south. `0 ≤ x < size[0]` etc.
- Conventional front for new builds: **north (−z)**, the street at `z < 0`. `mcd render` auto-detects the front
  from exposed windows/doors; override with `--front n|s|e|w`.
- Walking into a building that faces north, you face **south (+z)**; east (+x) is on your **left**.
- `facing` on blocks:
  - **stairs**: the side of the full-height back. A cornice/bracket whose lip points at the street:
    `half: "top"`, `facing` = the direction *into* the wall. A roof slope rising to the north: `facing: "north"`.
  - **trapdoor**: the side it hinges from when open; closed `half: "top"` sits in the top of the cell.
  - **wall torch / wall sign / wall banner**: the direction it *points out* (away from the wall).
  - **repeater / comparator**: `facing` points toward the *input* (signal flows the opposite way).
  - **logs**: `axis: x|y|z`.
- `mcd states <block>` lists every valid property and value for a block in the target version; `mcd blocks
  --grep <re>` lists valid ids (ids change: 26.x renamed `chain` → `iron_chain`); `mcd blocks --check a,b,c` says
  which ids are real and suggests near names for the rest. Use them instead of guessing.
- `mcd walk build.nbt --rooms rooms.json` floods the cells a player can stand in (jump one up with headroom, drop up
  to three, through doors and gates, up ladders, vines, scaffolding and water columns such as a soul-sand water
  elevator) from the entrance and says, per room box, whether it's reached, unreachable, or
  partly blocked by furniture. rooms.json: `{"entrance": [x,y,z], "rooms": [{"name", "box": [x0,y0,z0,x1,y1,z1]}]}`.
- `mcd rooms build.nbt --rooms rooms.json [--only name,...] [--out rooms.png]` shows every room: a dollhouse view
  (everything above the room cut away, from a front corner) and, for rooms 5+ wide both ways, an eye view inside.
- `layers(g, [x, y, z], legend, rows)` (build library) draws blocks from text the way Litematica stores them: a
  legend of characters, one character per block, rows along +x, successive rows along +z, layer by layer. Use it for any
  layout of many different blocks (a furnished room, a facade panel); it costs a fraction of a set() per block.
  `mcd plan build.nbt --rooms rooms.json [--only name]` prints each room's floor as that grid ('#' wall, 'D' doorway,
  'W' window, 'o' already there, '.' free floor) with the origin to pass to layers().
- `mcd room build.nbt --rooms rooms.json --only "<room>"` is a room designer's one check after each rebuild: the walk
  verdict with the floor cells a player can't reach (marked `x` on the floor grid, which shows the furniture as `o`),
  the light levels at the feet, and lantern spots (hanging under the ceiling where there's headroom, else against a
  wall) that would lift the dark and dim cells to 8+. Exits 1 until the room is walkable with no dark cell.
- `mcd light build.nbt --rooms rooms.json [--only name]` (or `--y <feet y>` for a whole floor level) maps block light
  the way the game spreads it (each source at its vanilla level, one less per block, stopped by full blocks): each
  floor cell's level as 0-9/A-F, with min, mean and the DARK (0, mobs spawn) and dim (1-7) counts. Design lighting
  with it: the renderer has no night.

## Commands

| Command | Does |
|---|---|
| `render <f.nbt> [--out s.png] [--front d] [--ground y] [--cut y] [--eye x,y,z --look x,y,z [--label t]]... [--view "name:x,y,z->x,y,z"]... [--tiles dir]` | The look sheet: 3 street views at eye height, 4 elevations, 2 front-corner isos, optional cutaway and interior eye views. `--view` adds a named exterior camera with sun shadows (e.g. `"downstream:28,14.5,40->31,18,22"`, the iconic view of a house over a waterfall). `--tiles` also writes each view as its own PNG (zoom into one with Read). |
| `compare <before> <after> [--out c.png]` | Before \| after sheets side by side, same cameras. |
| `convert <in> <out>` | Structure `.nbt` ↔ Litematica `.litematic`, by extension (schematic version 7 for 1.20.5+, 6 before). Use `.litematic` for builds over 48 blocks a side, which a structure block can't place in one go. |
| `roof <in.nbt> <out.nbt> --style <s> [--pitch p] [--eave e] [--material m] [--ridge r] [--dormers 2:e] [--pediment n] [--tower x,z,w,h,top] [--chimney x,z] [--keep box] [--spec roof.json]` / `roof <in.nbt> --detect` | Re-roof a build by style name: detects the eave and footprint, strips the old roof, builds the new one (see roofs.md). `--detect` only reports what it found. |
| `check <f.nbt> [after.nbt] [--contract c.json] [--site site.json] [--json]` | (A contract file adds to the automatic redstone protection.) Census, walkability, largest blank surfaces (interior and exterior separately); with two files the FUNCTION report: protected cells unchanged, keep-clear cells clear, warnings for new conductive/triggering/feeding neighbours. `--site` adds the landscape checks (see landscaping.md). Exit 1 on any violation. |
| `info <f.nbt>` | Size, DataVersion → version, census, block entities, functional cell count, unknown block ids. |
| `blocks [--grep re]` / `states <block>` | Valid ids / states for the version. |
| `new <build.mjs> [--from in.nbt] [--size x,y,z] [--out out.nbt]` | Scaffold a generator script wired to the build library (with `--from`, writes are guarded). |
| `concept "<subject>" --out c.png [--size s] [--palette p] [--provider codex\|gemini] [--ref img]... [--model m] [--raw]` | A builder's reference sheet (front elevation + 3/4, one scale, no scene). Codex CLI image tool when installed (ChatGPT plan, no key, ~1 min; `--ref` redraws from a given image), else Gemini (`GEMINI_API_KEY`, Nano Banana 2.1 by default). Measured: this prompt shape matters more than the model; 2–3 candidates across providers, picked against the brief, add useful variety. |
| `assets [--version v]` | Pre-fetch the client jar. |

Version: `--version` › `$MCD_VERSION` › the file's DataVersion › latest release.

Render notes: no light engine (light sources show as blocks, not glow); interior eye views skip sun shadows;
block-entity blocks (chests, signs, beds, banners, heads) render as simple textured boxes; entities (item
frames, armour stands) are not drawn. Keep `--look` inside the build for interior views.

## Build library (`tools/src/build.mjs`)

```js
import { load, Grid, guard, tile, mirrorX, mirrorZ, shell, carve, replace, B, face, DIRS } from ".../tools/src/build.mjs";
const g = guard(load("in.nbt"));          // or: new Grid([w, h, d], { dataVersion })
g.set(x, y, z, ...B.stairs("dark_oak", "south", "top"));   // [block, state] helpers: stairs slab log wood trapdoor door fence wall lantern chain wallTorch pane block
g.fill([x0, y0, z0], [x1, y1, z1], "stone_bricks");
tile(g, { from: 1, step: 4, to: 19 }, (z, i) => bay(z, i));  // the bay rhythm
mirrorX(g, cx, (set) => set(x, y, z, block, state));          // symmetric pair, facings mirrored
shell(g, a, b, "spruce_planks", { floor: true, ceiling: false });
carve(g, a, b);                            // stores air (clears the cell on placement)
replace(g, a, b, "spruce_planks", "stone_bricks");
g.save("out.nbt");                          // never overwrite the input
console.log(g.refused);                     // guarded writes that were refused (report them)
```

Shape brushes (also exported from `build.mjs`): curved forms — `dome`, `cylinder`, `minaret`, `arch` (+ `circleCells`,
`ring`, `disc`, `revolve`) — see `shapes-curved.md`; massing — `setbacks`, `gableRoof`, `hipRoof`, `fins`, `parapet`,
`cornice`, `falseFront`, `stepGable` — see `shapes-massing.md`. Each is `fn(g, opts)`, writes through `g.set` (so
`guard()` still protects function), and returns `{cells, refused, bounds}`.

`guard(grid)` refuses writes into the grid's functional cells and their keep-clear cells (or a set you pass);
it never throws — check `g.refused`. `runParts(g, [["shell", shell.build], ["garden", garden.build]], { palette:
"palette.json" })` runs a build's parts in order so each can only add into air: writes into an earlier part's cells
(air included) are refused and reported, the ground laid before it stays writable, and blocks outside the palette
are reported per part. With `roof: "roof.json"` (a `mcd roof --spec` file) it lays the roof right after the first
part, so later parts build around it instead of the roof tool clearing attics and gables after them; no file yet means
the roof is skipped with a note. A part given `{ carve: true }` as a third element (the stair joiner) may cut through
earlier floors and ceilings (cells with air straight above or below), never walls. `mcd reskin in.nbt out.nbt --swap
spruce=dark_oak,red=blue[,bricks=mud_bricks] [--box ...]` swaps materials on a finished build, form for form, states
kept (a wood or dye word swaps every block named with it; a full block id swaps itself and its stairs, slab and wall);
`mcd variant <run> --name n [--swap ...] [--roof '{json}']` does it into `<run>/variants/n/` with a card, re-running
the build's code when the roof changes. `mcd overworld palette.json [--write]` lists (drops) nether and end blocks. The Grid keeps block-entity NBT (sign text, chest contents) and entities and
writes them back unchanged; cells you don't touch round-trip byte-for-byte.

Grow the box with `g.resize([w, h, d], [dx, dy, dz])` (a shift grows toward −); a shift moves every coordinate,
so re-derive any contract coordinates after shifting.

## Banners, signs and other block entities

Banners, signs, chests, beds, bells, mob heads, decorated pots and shulker boxes are entity-rendered in vanilla, and
`mcd render` draws them with their entity models and textures:
- **Banners:** the cloth in its base colour plus every dyed pattern from the block entity.
- **Signs:** their text, glowing text drawn brighter.
- **Other entity-rendered blocks:** a neutral box, listed under `unknownBlocks` as "entity-rendered, approximated".

Author banners and signs with the build helpers. Each returns `[block, state, nbt]` with valid block-entity NBT
that round-trips through save and load:

```js
g.set(x, y, z, ...B.banner("cyan", [["stripe_center", "white"], ["border", "black"]], { facing: "north" }));   // wall banner
g.set(x, y, z, ...B.banner("red", [["cross", "yellow"]], { wall: false, rotation: 8 }));                       // standing, faces north
g.set(x, y, z, ...B.sign("spruce", ["PERMIT", "OFFICE"], { facing: "north", color: "black", glow: false }));
```
- **Banner patterns:** `stripe_center`, `stripe_top`, `stripe_bottom`, `stripe_left`, `stripe_right`,
  `stripe_middle`, `border`, `curly_border`, `cross`, `straight_cross`, `rhombus`, `circle`, `flower`, `globe`,
  `gradient`, `gradient_up`, `half_horizontal`, `half_vertical`, `triangle_top`, `triangle_bottom`, `bricks`,
  `small_stripes`, `diagonal_left`, `diagonal_right` (the full list is under `textures/entity/banner/`).
- **Colours:** the 16 dye names.
- **NBT format:** banners use the 1.20.5+ `patterns` list (`legacy: true` writes the older `Patterns` /
  `Pattern` / `Color` form). Sign text is written as JSON components below data version 4325 (1.21.5) and as plain
  string components from 1.21.5 on (`dataVersion` option; the grid's default is 1.21.4).
- **Standing `rotation`:** 0 faces south, 4 west, 8 north, 12 east. Wall banners and signs hang on the block behind
  them and face `facing`.

## How things sit: `mcd fit`

`$MCD fit build.nbt --rooms rooms.json` (and the FIT lines of `$MCD room`) lists what a player sees wrong from inside,
each with its cell: anything **on a bottom slab** (half a block of air under it), floor decor **floating** over air,
a **broken bed** (one half, or halves that don't match), a **bed in the wall** (set into the wall line), a **bed
against an opening** (its head at a window, a pane or a door, or at nothing), a **bed backwards** (foot against the
wall, head out in the room), **stairs end short** (a walked flight whose top step is a full block under the floor it
leads to: a jump), a **chimney fire** fault (a campfire on top of a stack, shut in a stack with no
firebox mouth, its smoke blocked before the sky, a flue open at the side, or roof tiles walling the flue), a
**chimney in the room** (a hearth or flue in a room's floor space instead of set into the wall), a **floating shutter** (an open trapdoor with air behind it), **bookshelf overuse** (more
than 3 outside a library, study or office) and a **hallway to nowhere** (a hall with one way in, or a long stretch no
walk between its openings passes). With `street` in rooms.json it also walks the **way in**, street to main door (with `entrances`, each building's or
module's, from the street straight in front of it),
and lists a **steep approach** (a stair or a full-block step on it, more than 3 half-steps without a 2-long landing,
1 wide, or no level cell before the door): the approach standard, `$MCD approach` alone. The shop sockets' boxes are skipped.
Helpers that get it right: `bed(g, [x, y, z], facing, color)` (both halves; refuses a cell that isn't air and returns
false), `flight(g, { from, facing, to, material, width })` (a flight whose last step is in the upper floor's own layer,
headroom cut, stringer under it), `chimney(g, { wall: [x, floorY, z], into, top, material, thin })` (an exterior chimney: the fire
just outside the wall, its mouth cut through it, hay in the floor, a 1 x 1 air flue to the sky, masonry through the
roof, thin trapdoors above it, its own footing; call it directly, never through an air-only helper), `shutter(g, [x, y, z], face, wood, { height })`
(flat on the wall), `bannerWord(g, word, { center, face })` (letters in reading order).

## Review card

One image of a build for a glance or a reviewer (prints one JSON object; non-zero exit and a stderr message on error):

- `mcd card <f.nbt> --out card.png [--tiles dir] [--front n] [--reuse]` — render (close-ups, `MCD_TILE_SCALE=2`) and compose the card (street | front-left, front-right | back, plus the roof close-up row; tiles fit 700x700, white). `--reuse` skips the render when `dir/street.png` exists. `{"card","tiles","views":[...]}`
- `mcd card <f.nbt> --out eye.png --tiles dir --layout eye` — the eye-level card: only what a player sees from the ground (street | down-the-street left, right | back), sky trimmed, so a roof weighs what it weighs in the game.

## Inspection

Cheap, deterministic checks to run after every pass, before judging a render by eye. Each has `--json`.

- **Glance and close-ups** — `$MCD render house.nbt --closeups --tiles tiles/` adds a row of tiles to the sheet: a
  *glance* tile (the street view at 320 px: what reads at a glance) and close-ups at ≥ 12 px per block of the
  entrance (door cells), the eave band, each facade's busiest region, and every small feature visible from outside
  (signs, banners, lanterns, pots, finials). Each tile is labelled with what it frames and its px/block; the JSON lists
  the box and side of each. For any other spot:
  `$MCD zoom house.nbt --at 12,3,0 [--radius 3] [--from n|s|e|w] [--out zoom.png]` (default side: the one with a clear
  line of sight, front first; cells far in front of the spot are left out so they cannot hide it).
- **Change report** — `$MCD diff before.nbt after.nbt --png diff.png [--json] [--fail-empty]`: changed cells by kind
  (added / removed / replaced / state) and block, their groups and boxes, the faces they show on, how many are enclosed
  (never show) or interior-only; with `--png`, changed pixels per standard view and a BEFORE | AFTER pair cropped to
  the change for the two views that changed most. `--fail-empty` exits 1 when nothing changed, when no view shows a
  pixel of the change, or when every changed cell is enclosed — a pass that wrote nothing is a failure, not a no-op.
- **Palette** — `$MCD palette house.nbt`: visible blocks classed into roles by where they sit (walls field, trim and
  edges, roof, base, openings, accents, plants), each with its main materials and measured tone (texture average
  from the client jar). Flags, each with a concrete suggestion: roof in the walls' tone; trim invisible on its wall
  (`trim: stone_bricks on stone_bricks walls -> tuff_bricks or smooth_stone`); an outlier block used a handful of
  times that clashes with everything around it; more than 3 accent colour families; dark detail on a dark ground
  (or light on light).
- **Structure** — `$MCD check house.nbt` now always reports STRUCTURE: floating groups (not connected to the
  lowest layer through face or edge contact), unsupported hanging/mounted blocks (a hanging lantern with nothing
  above, a standing banner or lantern on air, a wall sign with nothing behind), orphans (one block sticking out
  sideways or dangling, touching the build on one face), and enclosed cells (a change there never shows; with two
  files, how many changed cells are enclosed). Report only; the exit code is unchanged.
