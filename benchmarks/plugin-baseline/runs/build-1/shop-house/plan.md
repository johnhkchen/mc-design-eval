# Plan: shop house with back return and kitchen garden (butcher's copy)

A generic red-brick shop house, the kind repeated down any high street: a tall shopfront under a painted
fascia and striped awning, two storeys of the family's home above with white-trimmed sash windows, a steep
dark-slate FRONT GABLE to the street, and a lower two-storey **back return** (rear wing) on the west half that
makes the L. The east half of the plot behind the house is the fenced vegetable garden, reached from the
kitchen's back door and by a side passage with a gate from the street.

Orientation: the street is NORTH (-z), x runs along the street. All coordinates are world. The sockets are in
sockets.json (`sockets layout --face north --at 18,5,6 --units "DS"`) and are never moved.

## SITE

| item | x | y | z | note |
|---|---|---|---|---|
| lot | 0..27 | 0..34 | 0..38 | |
| ground fill | 0..27 | 0..4 | 3..38 | `dirt` (stone y 0..2), solid everywhere except inside the socket boxes and pits |
| lot surface (garden, passage, strips) | 0..27 | 5 | 6..38 | `grass_block` with patches; people stand at y 6 = shop-floor level |
| road | 0..27 | 4 | 0..2 | `andesite`, ground below; people on it stand at y 5 |
| kerb | 0..27 | 5 | 3 | `polished_andesite` |
| pavement | 0..27 | 5 | 4..5 | `smooth_stone`; x 10..18 z 4..5 y 6..8 is the counters' keep-clear (nothing) |
| **main body** (shop + 2 home storeys) | 4..19 | 5..23 walls, roof to ~33 | 5..22 | outer walls x 4 (W), x 19 (E), z 5 (front), z 22 (rear); front wall upstairs 2 thick (z 5..6, y 14..23) |
| shop / tenant unit (A1 + A2) | 10..18 | 5..12 | 6..21 | wall lines x 10, 14, 18; counter edge z 6; fascia line z 5 |
| lobby bay (home entrance + stair) | 5..8 (walls x 4, x 9) | 5..12 | 6..21 | its own 6-wide front bay x 4..9, west of the shop |
| service aisle (keeper route) | 10..13 z 16..21, and 10..18 z 20..21 | 6..12 | | behind back walls A2 z 15 and A1 z 19; ceiling = floor y 13 |
| aisle partitions | x 14 z 19 and x 18 z 19 | 5..12 | | `bricks`, close the gaps beside A1's back wall |
| **back return (rear wing)** | 4..11 | 5..18 walls, roof to ~23 | 22..30 | walls x 4, x 11, z 30; shares the main body's rear wall z 22 |
| chimney E (main, external breast) | 20..21 | 5..31 | 13..14 | own footing on the ground at y 5, against the east wall x 19 |
| chimney S (wing kitchen, external breast) | 7..8 | 5..26 | 31..32 | own footing, against the wing's south gable z 30 |
| side passage | 20..25 | 5 | 6..21 | `dirt_path`/`gravel` mixed, pavement to the garden gate |
| west strip | 0..3 | 5 | 6..21 | grass, a `spruce_fence` along x 1 z 6..21 and z 6 x 1..3 (closes it from the pavement) |
| garden fence | x 26 z 6..37; z 37 x 1..26; x 1 z 22..37; z 22 x 20..25 | 6 | | `spruce_fence`, posts at corners; the house walls close the rest |
| garden gate | 22..23 | 6 | 22 | double `spruce_fence_gate`, facing z (passage → garden) |
| lamp post | 25 | 6..8 fence, lantern 9 | 21 | at the gate, passage side |
| path a (along the back wall) | 15..25 | 5 | 23..24 | `dirt_path`; links keeper door (x 16) and gate |
| path b (spine) | 18..19 | 5 | 25..36 | `dirt_path`, edged with `coarse_dirt` |
| path c (from the back door) | 12..17 | 5 | 27..28 | `dirt_path`, widening to 3 at x 12 (z 26..28) at the door step |
| bed 1 | 13..16 | 5 farmland, 6 crops | 30..35 | water source x 14 z 32 (y 5); carrots / potatoes |
| bed 2 | 21..24 | 5 / 6 | 30..32 | water x 22 z 31; beetroots |
| bed 3 | 21..24 | 5 / 6 | 25..28 | water x 22 z 26; wheat |
| bed 4 (herbs, behind the wing) | 2..9 | 5 / 6 | 34..35 | water x 5 z 34; potatoes; bed edges `spruce_slab` (bottom) on grass round each bed |
| fruit tree | trunk 23 | 6..10 `oak_log` | 35 | crown of persistent `oak_leaves` x 21..25 z 33..37 y 9..13 |
| compost + stores | 12..14 | 6 | 23..24 | `composter` ×2, `barrel`s, against the rear wall (off path a) |
| water butt | 12 | 6 | 29 | `cauldron` (water_cauldron level 3) at the wing corner, under the eave |
| bench | 12 | 6 | 25 | spruce stair facing east, beside the back door |

Socket envelopes (fixed): A1 deep box x 15..17 y 1..11 z 6..18, back wall z 19, pit y 0, hopper 16,5,9;
A2 shallow box x 11..13 y 1..10 z 6..14, back wall z 15, ceiling y 11, hoppers z 9. Wall lines (glass) x 18 and
x 14 at z 6..18 y 1..11, x 10 at z 6..14 y 1..10. Keep clear: x 10..18, y 6..8, z 4..5.

## ROOFS

| roof | form | where | height |
|---|---|---|---|
| main roof | `$MCD roof` preset **shop** (steep front gable to the street), dark-slate mix | footprint x 4..19, z 5..22, `ridgeAxis` z, `front` n, `y` 24 | eaves course y 24 on x 4 / x 19; overhang 2 (spans 16): eaves to x 2 and x 21, verges to z 3 (over the pavement, high above it) and z 24; ridge over x 11.5 at about y 32–33, `ridge` slab |
| side dormers | from the preset (span 13+), one per side slope | centred z 13..14 on W and E slopes (not over chimney E: keep) | in the lower slope |
| main gables (z 5 front, z 22 rear) | `gable: "bricks"` (the wall continues); `verge: "dark_oak"` | triangle y 24..~32 | loft windows kept open (see `keep`) |
| back return roof | `$MCD roof` preset **cottage**, its own roof.json rect | footprint x 4..11, z 23..30 (NOT z 22: the main rear wall stays whole), `ridgeAxis` z, `front` s, `y` 19 | eaves y 19 on x 4 / x 11, overhang 1 (to x 3 / x 12 and z 31); ridge over x 7.5 about y 23, runs into the main rear gable below its verge; `gable: "bricks"` |
| trusses | `"trusses": {"material": "stripped_dark_oak_log"}` on the main roof (open loft over the y 23 ceiling) | | |
| keep (both roof.json) | chimney E x 20..21 z 13..14 y 22..31; chimney S x 7..8 z 31..32 y 18..26; loft windows x 11..12 y 26..27 at z 5 and z 22; wing gable window x 7..8 y 20..21 z 30 | | |

Material: mix `deepslate_tiles` 50 / `cobbled_deepslate` 30 / `polished_deepslate` 20, eave `polished_deepslate`,
ridge `deepslate_tile_slab`. Dark slate over red brick clears the contrast rule. Where the wing roof meets the
main rear wall the slates butt the brick (no flashing part needed); nothing built by hand.

## FACADES

### North (street) front, z 5 — base to top
| zone | y | what | material / depth |
|---|---|---|---|
| plinth | 5..6 | x 4..9 and x 19 at z 5 (not under the open shop front) | base, flush |
| shopfront pilasters | 5..12 | x 9 and x 19 at z 4 (1 proud), `stripped_dark_oak_log` axis y; capital y 12 = `dark_oak_planks` with an upside-down `dark_oak_stairs` at z 3 | shopfront, +1 |
| corner pier W | 5..12 | x 4 z 5, quoins (trim) paired y 7-8, 11-12 | trim, flush |
| open shop front | 6..8 | x 10..18 over the counters, OPEN (no glass, no frame, no pier: wall lines are in the keep-clear) | air (engineer's) |
| fascia (name board) | 9..12 | x 10..18 z 5, one continuous 9 x 4 board (closes A1 / A2 fascia cells) | `red_nether_bricks`, flush; "BUTCHER" in white banner letters at z 4, y 10..12 (`plaque`, `material: null`) |
| fascia consoles | 9..12 | the pilaster capitals at x 9 and x 19 frame the board's ends | shopfront |
| awning | 9 | x 10..18 at z 4 alternating `red_wool` / `white_wool` per column (butcher's stripe), open `dark_oak_trapdoor` valance at z 3 y 9 | +1 / +2, starts at y 9 (≥ y 4 above the shop floor) |
| hanging shop sign | 10 | `dark_oak_hanging_sign` "BUTCHER" at x 20 z 3 on a `dark_oak_fence` arm x 20 z 3..4 y 11 off the x 19 pilaster | accent, outside the keep-clear |
| lobby bay | 6..12 | x 5..8 brick; door x 6..7 (see OPENINGS); hood of `dark_oak_slab` (bottom) x 5..8 z 4 y 9 on two upside-down `dark_oak_stairs` at x 5 and x 8 z 4 y 8; lanterns hanging under the hood ends x 5 and x 8 y 8 at z 3 | joinery, +1 |
| shop cornice | 13 | x 4..19 at z 4: `smooth_quartz_stairs` upside-down facing south (into the wall), over the pilasters too | trim, +1 |
| first floor | 14..17 | brick, 3 windows 2 wide (x 6..7, 11..12, 16..17), glass recessed at z 6 (reveal z 5 air), lintel `smooth_quartz` z 5 y 17 x 5..8 / 10..13 / 15..18 (1 wider each side) | walls; windows −1 |
| string course | 18 | x 4..19 z 5, `smooth_quartz`, flush; sill `smooth_quartz_slab` (top) at z 4 under each 2nd-floor window | trim |
| second floor | 19..22 | same three windows y 19..21, lintels y 22; shutters: open `dark_oak_trapdoor`s at z 4 beside each window (x 5/8, 10/13, 15/18) | windows −1, shutters +1 |
| eaves band | 23 | x 4..19 z 5 `smooth_quartz` flush (gable foot) | trim |
| quoins | 13..23 | x 4 and x 19 at z 5 and on the side faces z 6: `smooth_quartz`, paired 2 high every other pair (y 14-15, 18-19, 22-23) | trim, flush |
| front gable | 24..~32 | brick triangle from the roof tool; loft window x 11..12 y 26..27 glass, `smooth_quartz` sill slab y 25 z 4 and lintel y 28 | walls |

The front is mirror-symmetric about x 11.5 from y 13 up; the shopfront is framed by the two dark-oak pilasters
x 9 / x 19 with the lobby door as a lesser bay on the west.

### East side, x 19 (seen down the passage)
Plinth y 5..6; blank brick at the shop storey (wall line x 18 behind it); windows y 14..16 and y 19..21 at
z 9..10 and z 17..18 (2 wide, glass at x 19, quoin-trim lintel); chimney E breast x 20..21 z 13..14 proud by 2,
`bricks` with a `deepslate_bricks` band at y 29, cap ring of `brick_slab` (top) stepping out 1 (x 19..22,
z 12..15) at y 31 except the flue; `hay_block` y 30 + lit signal `campfire` y 31 at x 21 z 14. Dormer above.

### West side, x 4
Plinth; blank brick to y 12 (lobby); windows y 14..16 and y 19..21 at z 9 and z 18 (1 wide); quoins at both corners.
Side dormer above.

### Rear, z 22 (garden face)
Plinth y 5..6; keeper's door x 16; a small window x 12 y 7..8 lighting the aisle; upstairs windows x 13..14 and
x 16..17 at y 14..16 and y 19..21 with `smooth_quartz` lintels; rear gable with loft window x 11..12 y 26..27.

### Back return (wing), x 4..11 z 22..30
Brick, plinth y 5..6, `smooth_quartz` eaves band y 18 at z 30 and on x 4 / x 11. East face x 11: kitchen window
z 24..25 y 7..9, back door z 27, upstairs windows z 24..25 and z 27..28 y 14..16. South gable z 30: chimney S breast
x 7..8 z 31..32 (`bricks`, band `deepslate_bricks` y 24, `brick_slab` cap ring at y 26 stepping out to x 6..9
z 30..33 on the free sides, `hay_block` y 25 + lit signal `campfire` y 26 at x 8 z 32); windows x 5 and x 10 at
y 14..16; gable window x 7..8 y 20..21 is behind the stack: leave it out (keep is for the stack only). West face x 4:
window z 26..27 y 14..16.

## MATERIALS

| role | block | why |
|---|---|---|
| walls (~60%) | `bricks` | warm red high-street brick, reads red at distance |
| trim (~20%) | `smooth_quartz`, `smooth_quartz_stairs`, `smooth_quartz_slab` | white painted dressings: cornice, string course, lintels, quoins; strong contrast on brick |
| shopfront frame / joinery | `stripped_dark_oak_log` (pilasters), `dark_oak_planks`, `dark_oak_stairs`, `dark_oak_slab`, `dark_oak_door`, `dark_oak_trapdoor`, `dark_oak_fence`, `dark_oak_hanging_sign` | dark painted timber framing the shop and the openings |
| fascia (the tenant's colour) | `red_nether_bricks` | deep butcher's maroon board, white letters |
| awning (tenant accent) | `red_wool` + `white_wool` | red-and-white butcher's stripe |
| base / plinth | `polished_deepslate`, `polished_deepslate_stairs` | dark plinth, ties to the roof |
| roof | `deepslate_tiles` / `cobbled_deepslate` / `polished_deepslate` mix, `deepslate_tile_slab` ridge, `dark_oak` verges | dark slate over red brick |
| chimneys | `bricks`, band `deepslate_bricks`, cap `brick_slab`, `hay_block` + `campfire` | |
| glass | `glass_pane` | |
| street | `andesite` road, `polished_andesite` kerb, `smooth_stone` pavement | |
| ground / garden | `grass_block` with `coarse_dirt`, `podzol` patches; `dirt_path`, `gravel`; `farmland`, `water`; crops `carrots`, `potatoes`, `beetroots`, `wheat`; `spruce_fence`, `spruce_fence_gate`, `spruce_slab` bed edges; `oak_log` + `oak_leaves` (persistent) | |
| shop display (sockets.json) | A1 `pink_terracotta` (pork); A2 stalls `pink_terracotta`, `brown_mushroom_block` (baked chicken), `red_terracotta` (steak); machines in `dark_oak` | written in sockets.json `display` / `wood` |

All ids checked with `$MCD blocks --check` (all known). Reskin = swap walls / trim / fascia+awning / roof; the
fascia, awning, hanging sign and display are the only tenant-specific parts.

## OPENINGS

| opening | x | y | z | size |
|---|---|---|---|---|
| shop front (open counters) | 10..18 | 6..8 | 5 | continuous, the engineer's |
| home front door (double) | 6..7 | 6..7 | 5 | `dark_oak_door` pair facing north, hinges outward; fanlight `glass_pane` y 8 |
| lobby window (stair light) | 6..7 | 10..11 | 5 | 2 x 2, above the hood |
| keeper's door (lobby → aisle) | 9 | 6..7 | 20 | 1 x 2, in the lobby's east wall |
| keeper's rear door (aisle → garden) | 16 | 6..7 | 22 | 1 x 2, step = path a |
| aisle window | 12 | 7..8 | 22 | 1 x 2 |
| lobby → wing door | 6 | 6..7 | 22 | 1 x 2 |
| wing back door (kitchen → garden) | 11 | 6..7 | 27 | 1 x 2, faces east |
| kitchen window | 11 | 7..9 | 24..25 | 2 x 3 |
| first-floor front windows | 6..7, 11..12, 16..17 | 14..16 | glass z 6 | 2 x 3 |
| second-floor front windows | 6..7, 11..12, 16..17 | 19..21 | glass z 6 | 2 x 3 |
| front loft window | 11..12 | 26..27 | 5 | 2 x 2 |
| east windows | 19 | 14..16 and 19..21 | 9..10, 17..18 | 2 x 3 |
| west windows | 4 | 14..16 and 19..21 | 9, 18 | 1 x 3 |
| rear windows | 13..14, 16..17 | 14..16 and 19..21 | 22 | 2 x 3 |
| rear loft window | 11..12 | 26..27 | 22 | 2 x 2 |
| main ↔ wing upstairs door | 7 | 14..15 | 22 | 1 x 2 |
| wing upstairs windows | 11 (z 24..25, 27..28); 5 and 10 (z 30); 4 (z 26..27) | 14..16 | | 2 x 3 east, 1 x 3 others |

## RESERVED

| cells | for |
|---|---|
| socket boxes, pits y 0, back walls (A1 z 19, A2 z 15), A2 ceiling y 11, wall lines x 10/14/18 | runParts / redstone fit-out only |
| keep-clear x 10..18, y 6..8, z 4..5 | nothing at all |
| fascia x 10..18 y 9..12 z 5; letters / awning x 10..18 y 9..12 z 3..4; hanging sign x 20 y 10..11 z 3..4 | shopfront part (decorator + sign writer) |
| service aisle x 10..13 z 16..21 and x 10..18 z 20..21, y 6..12 | clear keeper route, lit (lanterns hung from the y 13 floor) |
| stair flight 1 | x 7..8, steps y 6..12 at z 9..15 rising south (`facing` south), arriving on the y 13 floor at z 16; well open at y 13 over x 7..8 z 10..15 |
| stair flight 2 | x 5..6, steps y 14..17 at z 15..12 rising north, from the y 13 floor at z 16; arrives on y 18 at z 11; well open at y 18 over x 5..6 z 12..16; rail (`dark_oak_fence`) on the open sides above |
| lobby lane | x 5..6 z 6..21 at y 6..8 (door → keeper's door → wing door) |
| loft hatch | x 16 y 23 z 20 (ladder on the rear wall x 16 z 21 y 19..22, trapdoor in the ceiling) |
| chimney stacks | E x 20..21 z 13..14 y 5..31; S x 7..8 z 31..32 y 5..26 (roof keep) |
| fireplaces | main: first-floor hearth only (x 18 is a wall line below y 12), firebox x 18 z 13..14 y 14..15 against the breast, flue through x 19 into chimney E; wing kitchen range x 7..8 z 29 y 6..7 (firebox into the south wall) |
| garden water cells | x 14 z 32, x 22 z 31, x 22 z 26, x 5 z 34 at y 5 (the ground leaves them) |
| loft windows, pilasters x 9 / x 19 z 4 y 5..12, shop cornice z 4 y 13 | later parts stand on / fill these; the shell leaves them |

## FLOORS

| storey | floor block y | interior y | volume |
|---|---|---|---|
| shop storey: shop (sockets + aisle) | 5 | 6..12 | x 10..18 z 6..21 |
| shop storey: lobby / stair hall | 5 | 6..12 | x 5..8 z 6..21 |
| shop storey: wing kitchen + scullery | 5 | 6..12 (beamed ceiling at y 12) | x 5..10 z 23..29 |
| first floor (home: living room front, kitchen-dining via wing) | 13 | 14..17 | main x 5..18 z 7..21; wing x 5..10 z 23..29 (sitting room) |
| second floor (bedrooms: parents front, 2 children rear, bath) | 18 | 19..22 | main x 5..18 z 7..21 |
| loft (storage, open trusses) | 23 (ceiling of the 2nd floor) | 24..~31 | under the main roof, by ladder hatch |
| garden | 5 (surface) | 6 up | x 12..25 z 23..36, plus x 2..10 z 31..36 behind the wing |

Wing ground floor is level with the shop floor (y 5) and the garden (y 5): the back door steps straight onto
path c. The main body's floor above the sockets is y 13 (sockets need 12+), giving a tall shop storey and a
4-row fascia.

---
# DESIGNER SECTIONS

## PALETTE
| role | block | variants |
|---|---|---|
| walls | `bricks` | `brick_stairs`, `brick_slab`, `brick_wall` |
| trim | `smooth_quartz` | `smooth_quartz_stairs`, `smooth_quartz_slab` |
| plinth | `polished_deepslate` | `polished_deepslate_stairs` |
| shopfront/joinery | `stripped_dark_oak_log`, `dark_oak_planks` | `dark_oak_stairs/slab/door/trapdoor/fence/fence_gate/hanging_sign/wall_sign/pressure_plate` |
| fascia | `red_nether_bricks` | letters `white_banner` |
| awning | `red_wool`, `white_wool` | |
| roof | `deepslate_tiles`, `cobbled_deepslate`, `polished_deepslate` | `deepslate_tile_slab`, `deepslate_tile_stairs`, truss `stripped_dark_oak_log` |
| chimney | `bricks`, `deepslate_bricks`, `brick_slab` | `hay_block`, `campfire` (lit, signal_fire true) |
| glass | `glass_pane` | |
| interior floors | shop aisle `stone_bricks`; lobby `spruce_planks`; living/dining/bedrooms `oak_planks`; kitchen `bricks` slabs-free flagstone `stone_bricks`; bath `smooth_quartz`; loft `spruce_planks` | |
| interior furniture | `spruce_*`, `oak_*`, `barrel`, `bookshelf`, `red_bed`, `red_carpet`, `white_carpet`, `furnace`, `smoker`, `blast_furnace`, `crafting_table`, `cauldron`, `candle`, `flower_pot`, `lantern`, `iron_chain` | |
| garden | `grass_block`, `coarse_dirt`, `podzol`, `dirt_path`, `gravel`, `farmland`, `water`, `carrots`, `potatoes`, `beetroots`, `wheat`, `spruce_fence`, `spruce_fence_gate`, `spruce_slab`, `composter`, `barrel`, `water_cauldron`, `oak_log`, `oak_leaves` | |
| street | `andesite`, `polished_andesite`, `smooth_stone` | |
| tenant (swap on reskin) | `red_nether_bricks`, `red_wool`, display blocks | |
All ids checked with `$MCD blocks --check` (only the generic "bed" is not an id: use `red_bed`).

## VOCABULARY
- `brickWall(box, plinth=true)`: `bricks` body, `polished_deepslate` y5..6, openings left as air.
- `quoinPair(x,z,y)`: two `smooth_quartz` blocks stacked, every other pair.
- `cornice(x0,x1,z,y)`: `smooth_quartz_stairs` half top, facing into wall.
- `pilaster(x,z)`: log axis y y5..11, `dark_oak_planks` y12, upside-down `dark_oak_stairs` at z-1.
- `fascia(x0,x1,y0,y1,name,material)`: `red_nether_bricks` board flush z5; `plaque(g,name,{material:null})` at z4; tenant-swappable.
- `awning(x0,x1,z,y,colA,colB)`: alternating wool columns; valance of open trapdoors one out.
- `hangingSign(x,z,y,text)`: fence arm to pilaster + `dark_oak_hanging_sign` text.
- `hood(x0,x1)`: slab bottom on two upside-down stairs, lanterns hanging at ends.
- `sashWindow(face,x,y,w,h)`: pane connections set, recess 1, lintel quartz, top-slab sill.
- `shutterPair(x,y,face)`: open `dark_oak_trapdoor` flat to wall each side.
- `doorPair(x,y,z,facing)`: both halves, matching hinge, `dark_oak_door`.
- `setDisplay(socket, blocks)`, `setWood(wood)`: sockets.json edit.
- `aislePartition`: bricks x14,x18 z19 y5..12.
- `chimneyStack(x,z,base,bandY,hayY,capY)`: 2x2 bricks, band, brick_slab cap one out, hay_block, lit signal campfire.
- `hearth(x,y,z,facing)`: stone floor, lit campfire, upside-down stair lintel, flue.
- `stairFlight(x,z,y0,y1,dir)`: `spruce_stairs` facing = walking-up direction, half bottom, slab stringer, fence rail on open sides with a gap at top.
- `ladderHatch(x,z,y0,y1)`: ladders away from wall, open trapdoor at top.
- `hangLantern(x,y,z)`: lantern hanging=true below a block or iron_chain.
- `gardenBed(x0,z0,x1,z1,waterAt,crop)`: farmland, water cell, crops above, `spruce_slab` bottom border.
- `pathRun(pts,width)`, `fenceRun(pts)`, `gateDouble(x,z,facing)`, `lampPost(x,z)`, `fruitTree(x,z)`, `compostStore`, `waterButt`, `bench`.
- Furniture for designers: `butcherBlock` (log + pressure plate/cleaver), `meatRail` (iron chain + red candles), `settle`, `bunk`, `table(fence+slab)`, `chair(stairs)`.

## ROOMS
(inner air boxes; first-floor y14..17, second y19..22)
1. Lobby / stair hall (ground): [5,6,6,8,12,21], family hall: lane x5..6; doors north double x6..7 z5, keeper's x9 z20, wing x6 z22.
2. Keeper's aisle: [10,6,16,13,12,21] plus [14,6,20,18,12,21]; doors x9 z20 (lobby), x16 z22 rear.
3. Wing kitchen & scullery: [5,6,23,10,12,29]; back door x11 z27, door x6 z22.
4. Stair hall, first floor: [5,14,7,8,17,21] with wells.
5. Living room: [9,14,7,18,17,15]; hearth x18 z13..14; door x9 z~12 to hall.
6. Dining room: [9,14,16,18,17,21]; door x9 z18 to hall.
7. Wing sitting room: [5,14,23,10,17,29]; door x7 z22 y14..15.
8. Second-floor hall: [5,19,7,8,22,16]; landing x5..6.
9. Parents' bedroom: [9,19,7,18,22,11]; door x17 z12 off corridor.
10. Corridor: [9,19,13,18,22,13]; door x9 z13 from hall.
11. Child's room A: [9,19,15,13,22,21]; door x11 z14.
12. Child's room B: [15,19,15,18,22,21]; door x16 z14.
13. Bathroom: [5,19,18,8,22,21]; door x7 z17 y19..20.
14. Loft: [7,24,8,16,27,21] open trusses, ladder x16 z21, hatch 16,23,20.

## PARTS
1. Masonry shell — `parts/shell.mjs`: site fill, street, walls main/wing, floors y13/18/23, partitions, plinth, quoins, strings, openings as air, aisle partitions.
2. Roofs — `parts/roof.mjs`: roof.json main + wing, keeps, trusses, dry-run.
3. Stairs and joinery — `parts/joinery.mjs`: stair flights, wells, rails, ladder, interior doors, glazing, doors, shutters.
4. Shopfront — `parts/shopfront.mjs`: pilasters, fascia + letters, awning, hanging sign, hood, cornice, sockets.json display/wood.
5. Chimneys, hearths, lights — `parts/hearth.mjs`: both stacks, hearths, aisle lanterns, door lanterns.
6. Grounds — `parts/garden.mjs`: all of SITE garden/passage/fence/gate/tree/stores.

## Checklist
- [x] shell  - [ ] roofs  - [x] joinery  - [ ] shopfront  - [ ] hearth  - [ ] grounds

## Notes
- Never write into socket boxes, keep-clear x10..18 y6..8 z4..5; run `$MCD sockets check`, `$MCD check`, `$MCD walk --rooms`.
- Leave chimney keep cells; breasts stand on ground footings.
- Reskin: swap walls/trim/fascia/awning/roof/display only.
- Joinery: loft ladder moved to x15 z21 y19..24 (x16 is under the rear windows), floor cell 15,23,21 cut, guard trapdoor 16,23,21; second-well rail stops at z15 so the bathroom door x7 z17 stays reachable.
