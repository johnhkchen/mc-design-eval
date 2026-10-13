# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Plan: Greek Revival plantation house on the river ("plantation")

Identity: an Oak Alley-type antebellum mansion. A broad white two-storey block, raised on a red-brick base, fronted by eight colossal white columns
(2x2, 13 high) across a full-width double gallery. The gallery has an upper porch floor and white balustrades, and it all sits under one low slate hip
with a quartz dentil cornice, three front dormers and four brick chimneys. Tall black-shuttered windows, a wide central hall with a fanlit double door
on both floors. A rear T-wing holds a two-storey vaulted living room open to the kitchen. The grounds run from a gravel drive under an allee of eight
spreading live oaks to an oval forecourt. On the west is a formal boxwood parterre with a fountain, a glass greenhouse, and a white gazebo on the riverbank. On the east are a brick carriage house with a cupola,
a white guest cottage (the house in miniature), and flowering cherries on the lawns. At the back, a lawn runs to the river and a landing dock.

Site x 0..95, z 0..95, y -4..32. Front = NORTH (z0 = the county road edge). Ground: grass top at y0 (player stands y1). All ranges inclusive.
House: base y0..2, GROUND FLOOR y3 (stand y4), air y4..9, UPPER FLOOR y10 (stand y11), air y11..16, wall plate / gallery ceiling y17, roofs y18+.
House axis of symmetry x = 47.5 (pairs mirror as x <-> 95-x). Later parts only ADD into air: every opening/reserved cell below is left AIR by the shell.

## SITE (masses)
| mass | x | y | z | notes |
|---|---|---|---|---|
| boundary fence | 0..95 | 1 | 0 | `birch_fence` white picket line, gap x45..50 for the drive |
| gate piers | 43..44 and 51..52 | 0..4 | 0..1 | `bricks` 2x2 y0..3, cap `smooth_quartz` y4, standing `lantern` y5 |
| drive | 45..50 | 0 | 0..23 | `gravel`, edged both sides x44 and x51 with `smooth_stone` kerb (flush, y0) |
| allee oaks (8) | trunks 2x2 at x41..42 and x53..54 | 1..6 trunk | z2..3, 8..9, 14..15, 20..21 | live oaks: `dark_oak_log` trunk, crown y6..12, radius 5 (flattened dome, wider than tall), so crowns meet over the drive. Roots `podzol`/`coarse_dirt` patches round each trunk |
| forecourt | 37..58 | 0 | 24..31 | `gravel` oval (corners x37..38/57..58 at z24 and z31 stay grass); central lawn island x44..51 z26..29 `grass_block` with a ring of `flowering_azalea` and a stone urn on a pedestal at the centre (47..48, 27..28, y1..2) |
| front steps | 45..50 | 1..3 | 32..34 | `smooth_quartz_stairs` facing south (up toward the house): z32 at y1, z33 at y2, z34 at y3, solid `bricks` under. Cheek walls x44 and x51, z32..34, `bricks` y1..3 capped `smooth_quartz` y4 (z33..34); at z32 a `smooth_quartz` newel y4 with a standing `lantern` y5 |
| raised base (plinth) | 25..70 | 0..2 | 35..61 | `bricks` under the gallery and the main block; at the gallery front (z35) and sides it shows as a 3-high red-brick base with arched vents (see FACADES) |
| front gallery (double) | 25..70 | 3..17 | 35..41 | floor y3 (`smooth_quartz`) and upper porch floor y10 (`spruce_planks`, painted-porch look) over z35..41; gallery ceiling y17 (`smooth_quartz`) over z35..41 carries the roof eave; 10 colossal columns (RESERVED: P-col) |
| main block | 26..69 | 3..17 | 42..61 | 2 storeys, 44 x 20. Walls: front z42, back z61, ends x26 / x69, 1 thick. Wall plate y17 |
| rear wing (T) | 37..58 | 3..17 | 62..75 | 22 x 14. Walls x37, x58, z75; shares z61 with the main block (opened, see OPENINGS). West half is the vaulted living room, east half the kitchen with bedrooms over it |
| rear porch | 37..58 | 3..8 | 76..79 | one-storey porch: floor y3 `smooth_quartz` on `bricks` y0..2, 6 slim columns (1x1 `quartz_pillar` y4..7) at z79, x37, 41, 45, 50, 54, 58; beam y8; shed roof by hand (see ROOFS). Steps x45..50 z80..82 down to the lawn (z80 y3, z81 y2, z82 y1, facing north) |
| chimneys (4) | 33..34 and 61..62 | 0..28 | 46..47 and 56..57 | interior `bricks` stacks, 2x2, from a footing at y0, through both floors and the roof. Band `deepslate_bricks` y26; cap y28: a `brick_stairs` ring stepping out 1 (upside-down, resting on the stack's top course y27), with an open 1x1-flue look given by a `campfire` (lit) set in the top of the stack. Hearths face into the rooms at y4..5 and y11..12 (RESERVED: P-hearth) |
| garden door stoop | 23..25 | 1..3 | 50..53 | west end door: `smooth_quartz_stairs` x23 y1, x24 y2, x25 y3 landing, facing east, `bricks` under. Mirror on the east end x70..72 (facing west) to the carriage path |
| formal garden | 4..22 | 0..1 | 36..60 | parterre: `gravel` cross paths 3 wide (x12..14 full depth; z47..49 full width) + perimeter path 1 wide; 4 quadrant beds edged by boxwood hedges (`spruce_leaves` persistent, y1, 1 wide), filled with flowers (`peony`, `rose_bush`, `allium`, `lily_of_the_valley`) on `grass_block`; topiary cones (`spruce_leaves` y1..3) at the 4 inner bed corners. Path z47..49 continues east x15..22 to the west stoop |
| fountain | 10..16 | 0..3 | 45..51 | basin ring `smooth_quartz` at y1 (7x7, corners chamfered), water y1 inside (x11..15 z46..50, ground y0 = `smooth_stone` under), central plinth (13,48) `quartz_pillar` y1..2 + `water` source y3 spilling (or a `chiseled_quartz_block` urn). RESERVED: P-fountain |
| greenhouse | 4..21 | 0..9 | 64..75 | Victorian glasshouse: `bricks` dwarf wall y0..1, frame `smooth_quartz` posts every 3 (x4,7,10,13,16,19,21) y2..6, `glass` panels between, glass gable roof by hand (ridge along x at y9, z69..70). Door on the east face x21, z69..70, y2..4. Inside: planters (RESERVED) |
| gazebo | 10..16 | 0..9 | 78..84 | octagonal pavilion, centre (13,81): floor y1 `smooth_quartz` (octagon radius 3, raised 1 with a `smooth_quartz_stairs` step on the north side at (13,1,77)), 8 slim columns (`quartz_pillar` y2..5) on the octagon corners, `birch_fence` balustrade y2 between them except the north opening, frieze ring y6 `smooth_quartz`, roof octagonal cone/pyramid y7..9 (see ROOFS) with `lightning_rod` finial y10 |
| service lane | 59..85 | 0 | 28..30, then 83..85 x z31..39 | `gravel`, from the forecourt's east edge to the carriage house doors |
| carriage house | 76..91 | 0..10 | 40..53 | 16 x 14, `bricks`, floor y0 (`smooth_stone`), carriage storey y1..5, loft floor y6, loft y7..9, plate y10, hip roof y11+ with cupola. 3 arched carriage doors on the north face z40 |
| carriage yard | 76..91 | 0 | 34..39 | `gravel` apron in front of the doors (part of the lane) with a hitching rail (`dark_oak_fence` x78..80 z35, y1) |
| guest cottage | 76..87 | 0..7 | 64..75 | 12 x 12, white (`white_concrete`) on a `bricks` base y0..1; floor y1 (stand y2), air y2..5, plate y6, hip roof y7+. Front porch z60..63 x76..87: floor y1, 4 columns `quartz_pillar` y2..5 at x76, 80, 83, 87 z60 (1x1), beam y6 |
| cottage walk | 81..82 | 0 | 54..59 | `dirt_path` from the carriage yard south to the cottage porch steps (z59, slab y1) |
| back lawn | 0..95 | 0 | 76..84 | grass, path x46..49 `gravel` from the rear steps z83 to the dock |
| river bank | 0..95 | -1..0 | 85..86 | `sand` y0 at z85; `sand` y-1 at z86 (air above) |
| river | 0..95 | -4..-1 | 87..95 | bed `sand` y-4, `water` y-3..-1 (surface y-1, one below the lawn) |
| dock | 44..51 | -4..0 | 84..92 | `spruce_planks` deck y0 over z84..92, `spruce_log` posts (axis y) y-4..-1 at the 4 corners and every 4 cells; `spruce_fence` rail y1 on x44, x51 and z92 with a gap at z92 x47..48 (a `ladder` down the post face at x47 z92 to the water); lantern posts at (44,1,92) and (51,1,92) fence y1..2 + `lantern` y3 |
| flowering trees | cherries: (10,8), (22,16), (10,24), (85,8), (73,16), (88,22); magnolias at (24,64), (71,64) as `flowering_azalea_leaves` crowns on `oak_log` | `cherry_log` trunk 4..5 high, crown radius 3 of `cherry_leaves` (persistent). Front-lawn ones stay x≤30 / x≥65 (clear of the allee crowns x36..47 / x48..59) |
| lamp posts | along the drive at x44 / x51, z6, 12, 18 (between oaks); forecourt corners (37,24),(58,24); paths every 8-10 | `dark_oak_fence` y1..3 + `lantern` y4 on the kerb cell |

## ROOFS
Building type: a classical house seen from all sides with a low hip and dormers. The preset is `civic` (hip, `slate` palette, quartz dentil cornice) with the
pitch lowered to `half` and the pediment turned OFF (Greek Revival plantation houses of this type have a plain hip over the colonnade, no front pediment).
| call | footprint rects [x0,z0,x1,z1] (R0 first) | options |
|---|---|---|
| R-main | [[25,35,70,61],[37,62,58,75]] | `civic`, `{ y:18, style:"hip", pitch:"half", overhang:1, material:"slate", eave:"cornice", trim:"smooth_quartz", ridge:"slab", pediment:false, dormers:[{face:"north", count:3, style:"gable", width:3, height:3, window:"glass_pane", wall:"smooth_quartz"}, {face:"south", count:2, style:"gable", width:3, height:3, window:"glass_pane", wall:"smooth_quartz"}], keep:[{from:[33,0,46],to:[34,32,47]},{from:[33,0,56],to:[34,32,57]},{from:[61,0,46],to:[62,32,47]},{from:[61,0,56],to:[62,32,57]}], trusses:{material:"stripped_spruce_log"} }` |
| R-rearporch | [[37,76,58,79]] | by hand (P-porch part): a shed roof of `deepslate_tile_stairs` facing north (the high side against the wing wall z75), low at the eave (y9, z79..80) and high against the wall (y10, z76..78), with a 1-cell overhang to z80 and a `smooth_quartz_slab` fascia under the eave. Its top meets the wing wall below the main eave (y18): leave the wall above y10 whole |
| R-carriage | [[76,40,91,53]] | `civic`, `{ y:11, style:"hip", pitch:45, overhang:1, material:"slate", eave:"cornice", trim:"smooth_quartz", pediment:false, tower:{at:[83,46], size:3, height:4, top:"lantern", material:"smooth_quartz"} }` (a white louvred cupola with a lantern cap on the ridge; add a `lightning_rod` on the apex as a weathervane if the tool doesn't) |
| R-cottage | [[76,64,87,75],[76,60,87,63]] | `civic`, `{ y:7, style:"hip", pitch:"half", overhang:1, material:"slate", eave:"cornice", trim:"smooth_quartz", pediment:false, chimneys:[{at:[85,72], size:2, material:"bricks", rise:2}] }` (the porch is inside the hip footprint, the same roof-over-colonnade move as the main house. The porch beam y6 supports the eave) |
| R-gazebo | gazebo octagon | by hand: an octagonal ogee/pyramid of `deepslate_tile_stairs` stepping in 1 per course y7..9 from radius 4 (1 overhang) to the apex, with a `smooth_quartz_slab` eave ring under the first course, apex block `chiseled_quartz_block` y9 + `lightning_rod` y10. (Fallback: `roof(..., "pyramid", {y:7, pitch:45, material:"slate", overhang:1})` on the 7x7 square, then trim the corners) |
| R-greenhouse | [[4,64,21,75]] | by hand: glass gable, ridge along x at y9 (z69..70, `smooth_quartz` ridge beam), slopes of `glass` stepping 1 per row from y7 at z64/z75 (half-slab pitch is not possible in glass, so it is 1:1 with full `glass` blocks) with `smooth_quartz` rafters every 3 (on the posts), gable ends glazed |

Targets (dry-run R-main first, adjust only `pitch`): main hip ridge y24..26 along x ≈ 38..57 at z≈48. The rear wing hip joins it in valleys and stays below the main
ridge. Dormers sit low in the slope, centred over the gallery on the north (x≈36..38, 46..49, 57..59). Chimney stacks rise ≥2 above where they pass through (top y28).
The gallery is INSIDE the main roof: the roof eave line runs at y18 over the entablature at z35..36 and the overhang reaches z34 (over the top step).

## FACADES
### North (entrance) front: the money shot
| level | y | what | material | depth |
|---|---|---|---|---|
| base | 0..2 | brick plinth across x25..70 at z35, 6 arched vents (z35, y1, 1 wide, `iron_bars`) one per column bay, under the window bays | `bricks`; capped by the gallery floor edge y3 `smooth_quartz` | flush |
| gallery floor | 3 | floor edge reads as a white line | `smooth_quartz` | flush with base |
| colossal order | 4..16 | 8 columns, 2x2, at x25-26, 31-32, 37-38, 43-44, 51-52, 57-58, 63-64, 69-70, z35..36. Base y4 `smooth_quartz` (2x2 only, the floor stays walkable); shaft y5..15 `quartz_pillar` (axis y); capital y16 `chiseled_quartz_block` with upside-down `quartz_stairs` flaring out 1 on the north and south faces (Ionic volutes, proud +1) | quartz | +7 in front of the wall |
| upper porch | 10 | porch floor (`spruce_planks`) passes behind/among the columns, edge z35 shows as a white band: face cells z35 y10 = `smooth_quartz` (not planks) between columns | `smooth_quartz` fascia | flush |
| balustrade | 11 | `birch_fence` between columns on z35 (x27..30, 33..36, 39..42, 45..50, 53..56, 59..62, 65..68) with `smooth_quartz_slab` (top) rail y12; also on the gallery ends x25 and x70 at z37..41 | white | flush |
| ground-floor rail | 4 | same `birch_fence` + rail y5 on z35 between columns EXCEPT x45..50 (the steps) | white | flush |
| entablature | 17 | architrave/frieze band x24..71 z35..36 (projecting 0) and on the gallery ends x25/x70 z35..41 | `smooth_quartz` | flush with column faces |
| cornice | 18 | the roof tool's quartz dentil cornice | `smooth_quartz`, `quartz_stairs` | +1 |
| house wall (behind the gallery) | 3..17 | z42: plinth y3 `smooth_quartz` course; body `white_concrete`; window bays centred on the column gaps (2-wide windows, OPENINGS); string course at y10 (floor line) `smooth_quartz` full width; plate y17 `smooth_quartz` | white on white: relief from shutters, openings, pilasters | 0 |
| doorways | 4..8, 11..14 | the central bay x45..50: double door with sidelights and a transom (Greek Revival) on both floors; surround: `quartz_pillar` posts x45 and x50 y4..9 and y11..15, lintel `chiseled_quartz_block`+ `smooth_quartz` y9 / y15 x45..50 (with a `quartz_stairs` cornice cap upside-down, proud +1 into the gallery, at y9 x44..51) | quartz | +0 posts, +1 cap |
| shutters | at every front window | `dark_oak_trapdoor` open, lying flat on the wall in the cell in front of it (z41), 1 each side of every window, full window height | near-black | +1 |
| corners | | end walls' corners x26/x69 at z42 and z61: `quartz_pillar` corner pilasters 1x1 (in plane, y3..17) | quartz | 0 |

### East and West ends (x26 / x69)
Same base (bricks y0..2), white body, string course y10, plate y17, cornice from the roof. The gallery's end shows its 2 colossal columns and an open end with balustrades on both floors.
Windows: 3 bays per floor at z45..46, 51..52 (the garden door below on the ground floor), 58..59, with shutters in the cells x25 / x70. The chimney stacks rise inside the
roof at x33..34 / x61..62: on each end two stacks pierce the hip, symmetric.

### South (river) front
Main block back wall z61: windows in the bays that the rear wing doesn't cover (x28..29, 31..32, 34..35, 60..61, 63..64, 66..67), both floors, shutters at z62.
Rear wing: walls `white_concrete`, corner pilasters `quartz_pillar` (x37/x58 at z75), string course y10, plate y17. Its south face z75: the living room's tall Palladian window
(x40..45, y5..15) centred on its half; the kitchen half: 2 ground windows + 2 upper windows. Rear porch (one storey, slim quartz columns, shed roof) across z76..79.

### Auxiliaries
| building | facade |
|---|---|
| carriage house | `bricks` body, `stone_bricks` plinth course y0..1, `smooth_quartz` quoins (paired: 2 long/1 short) at the 4 corners, `smooth_quartz` string course y6. North face z40: 3 arched carriage doors (OPENINGS) with `smooth_quartz` voussoirs (upside-down `quartz_stairs` arch at y5..6); loft: 3 small windows y7..8 over the doors; hay door gable not needed (hip). Sides: 3 windows each. Cupola white on the ridge |
| guest cottage | the house in miniature: `white_concrete` body on `bricks` base y0..1, `quartz_pillar` corner pilasters, front porch of 4 columns under the hip, door centred (x81..82) with sidelights, 2 shuttered windows each side (dark oak shutters), chimney at the back |
| greenhouse | white quartz frame on a brick dwarf wall, all glass: reads as a light lantern among the hedges |
| gazebo | white columns, white balustrade, dark slate cap with a finial |

## MATERIALS (all checked with `mcd blocks --check`, OK)
| role | block id(s) | share / where |
|---|---|---|
| wall body (white, ~45%) | `white_concrete` | all house, wing and cottage walls. Flat bright white so that the creamier quartz trim and columns read as a separate layer |
| classical trim / columns (~15%) | `quartz_pillar`, `smooth_quartz`, `chiseled_quartz_block`, `quartz_stairs`, `smooth_quartz_slab`, `smooth_quartz_stairs` | columns, entablature, cornice, string courses, plate, door surrounds, sills, steps, floors of galleries, fountain |
| base (~8%) | `bricks`, `brick_stairs`, `brick_slab`; vent grilles `iron_bars` | raised plinth, chimneys, gate piers, step cheeks, carriage house body, greenhouse dwarf wall |
| chimney band | `deepslate_bricks` | one course below each cap |
| roof (~20%) | `slate` palette: `deepslate_tiles`, `deepslate_tile_stairs`, `deepslate_tile_slab`, `polished_deepslate`, `cobbled_deepslate` | all hips, gazebo cap, porch shed |
| shutters (accent, ~3%) | `dark_oak_trapdoor` (open) | every main-house and cottage window. Reads near-black against the white |
| doors | `dark_oak_door` | front and upper gallery doors, garden doors (dark doors in white surrounds) |
| glass | `glass_pane` (windows, sidelights, transoms), `glass` (greenhouse) | |
| porch floors / ceilings | `spruce_planks` (upper porch floor), `smooth_quartz` (ground gallery floor, gallery ceiling y17) | |
| balustrade | `birch_fence` + `smooth_quartz_slab` (type top) rail | |
| ground | `grass_block` with patches of `podzol`, `coarse_dirt`, `moss_block` under the oaks; `gravel` drive/forecourt/garden paths; `smooth_stone` kerbs; `dirt_path` minor walks; `sand` river bank | |
| trees | live oaks `dark_oak_log` + `dark_oak_leaves` (persistent), with some `vine` hanging from the crown undersides as Spanish moss; cherries `cherry_log` + `cherry_leaves`; magnolias `oak_log` + `flowering_azalea_leaves` | |
| hedges / topiary | `spruce_leaves` (persistent): dark boxwood green | |
| flowers | `peony`, `rose_bush`, `allium`, `lily_of_the_valley`, `poppy`, `flowering_azalea` | |
| water | `water` (river, fountain), `lily_pad` at the river edge west of the dock | |
| dock / fences | `spruce_planks`, `spruce_log`, `spruce_fence`; boundary `birch_fence`; hitching rail `dark_oak_fence` | |
| light | `lantern` only (no torches) | |

## OPENINGS (left AIR by the wall part; widths along the wall, y inclusive)
### Main block, north wall z42
| opening | x | y | notes |
|---|---|---|---|
| front door (ground) | 45..50 | 4..9 | x45 and x50 = surround posts (RESERVED P-door), x46 and x49 = sidelights y4..7, x47..48 = double `dark_oak_door` y4..5, transom y6..8 over x46..49 (`glass_pane`), lintel y9 |
| gallery door (upper) | 45..50 | 11..15 | same composition: doors x47..48 y11..12, sidelights x46/x49 y11..13, transom y13..14, lintel y15 |
| ground windows | 28..29, 34..35, 40..41, 54..55, 60..61, 66..67 | 4..8 | tall 2x5 (floor-length, opening onto the gallery), sill = the floor, lintel y9 `smooth_quartz` |
| upper windows | same x | 11..15 | 2x5, lintel y16 |
### Main block, ends x26 (west) and x69 (east)
| opening | z | y | notes |
|---|---|---|---|
| windows | 45..46, 58..59 | 5..8 and 12..15 | 2x4, sill y4 / y11 (`smooth_quartz_slab` top, outside at x25 / x70) |
| garden door W (x26) / service door E (x69) | 51..52 | 4..6 | double door, transom y7..8 (`glass_pane`) |
| upper window over it | 51..52 | 12..15 | |
### Main block, south wall z61
| opening | x | y |
|---|---|---|
| windows (exterior, outside the wing) | 29..30, 33..34, 61..62, 65..66 | 5..8 and 12..15 |
| hall → wing (interior, wall z61) | 45..50 | 4..9 | wide opening from the central hall into the living/kitchen wing |
| living → main (interior) | 39..43 | 4..9 | |
| kitchen → main (interior) | 52..55 | 4..6 | service passage |
| upper hall → rooms over kitchen (interior) | 52..53 | 11..13 | |
### Rear wing
| opening | where | x/z | y |
|---|---|---|---|
| living room Palladian window | south z75 | 40..45 (centre arched light x42..43 rises to y15; side lights x40..41, x44..45 y5..12) | 5..15 |
| living room west windows | west x37 | z65..66, 70..71 | 5..12 (tall 2x8, double-height room) |
| kitchen windows ground | south z75 | 50..51, 54..55 | 5..8 |
| bedroom windows upper | south z75 | 50..51, 54..55 | 12..15 |
| kitchen east windows | east x58 | z65..66, 70..71 | 5..8 and 12..15 |
| rear porch door | south z75 | 47..48 | 4..6 (double door, transom y7..8) between living and kitchen halves |
### Auxiliaries
| building | opening | coords |
|---|---|---|
| carriage house | 3 carriage doors, north z40 | x77..79, x82..85 (centre, 4 wide), x88..90; y1..4 open; y5 = lintel `smooth_quartz` with upside-down `quartz_stairs` in the top corners of each opening (a segmental arch look) |
| carriage house | loft windows north | x78, 83..84, 89 at y7..8 |
| carriage house | side windows | x76 and x91 at z43..44, 49..50, y2..4; personal door x91 z46..47 y1..3 |
| guest cottage | front door north z64 | x81..82 y2..4 (double, transom y5), sidelights x80, x83 y2..4 |
| guest cottage | windows | north z64 x77..78, 85..86 y2..4; east/west x76/x87 at z67..68, 71..72 y2..4; south z75 x79..80, 83..84 y2..4 |
| greenhouse | door | east face x21, z69..70, y2..4 |

## RESERVED (shell leaves AIR; the named part fills)
| id | cells | what fills it |
|---|---|---|
| P-col | x25-26, 31-32, 37-38, 43-44, 51-52, 57-58, 63-64, 69-70 × z35..36 × y4..16 (and y10 through the porch floor) | colossal columns (the porch floor part skips these cells) |
| P-cap | z34 and z37 cells beside each column at y16 | capital volute stairs (proud 1) |
| P-pil | corner cells x26 and x69 at z42 and z61, and x37 / x58 at z75, y3..17 | `quartz_pillar` corner pilasters in the wall plane |
| P-door | x45, x50 at z42, y4..9 and y11..15; lintels x45..50 y9, y15 | door surround |
| P-shutter | the cell in front of the wall each side of every window (z41 on the front, x25/x70 on the ends, z62 on the back, cottage likewise) | `dark_oak_trapdoor` shutters (open, flat on the wall) |
| P-hearth | firebox cells in the chimney stacks: the stack face toward each room, 1 wide × 1 deep × y4..5 (ground) and y11..12 (upper), on every room-facing side | campfire hearth, lintel stairs |
| P-stair | central hall x45..50, z50..60, y4..16 (the grand stair: two flights rising south from a shared landing, or a single straight flight z50..58 along x45..46 with a return; the upper floor y10 is left OPEN over x45..50 z50..59) | the grand stair (stair joiner) |
| P-vault | living room x38..47 z62..74 y10..17: NO upper floor here (double-height); the ceiling y17 may be replaced by a coved vault (upside-down stairs stepping in 1 per course from y15 at the walls) | vault by the interior part; roof trusses visible above if left open |
| P-fountain | x11..15 z46..50 y1..3 inside the basin | water and the centre jet |
| P-greenhouse | x5..20 z65..74 y1 | planting benches (top slabs) and potted plants |
| P-river | z87..95 y-4..-1 all x | water only; the dock posts at x44, 47, 48, 51 × z87, 91 |
| P-dock | x44..51 z84..92 y0 | dock deck (the bank part leaves these cells air) |
| allee | trunk cells listed in SITE, crowns radius 5 y6..12 | the gardener; nothing else built there |

## FLOORS (interior volumes for the room layout)
| mass | floor y (block) | stand | clear air | interior x × z |
|---|---|---|---|---|
| main block, ground | 3 | 4 | 4..9 | x27..68 × z43..60 (42 × 18). Central hall x45..50 the full depth, with the grand stair at its back (P-stair) |
| main block, upper | 10 | 11 | 11..16 | same; upper hall x45..50, open to the stair z50..59; front door at x47..48 onto the upper gallery |
| front gallery, ground | 3 | 4 | 4..9 | x25..70 × z35..41 |
| upper gallery (porch) | 10 | 11 | 11..16 | x25..70 × z35..41 (reached from the upper hall door, and from the master suite's front windows) |
| rear wing, living room | 3 | 4 | 4..16 (+ vault to y17 or into the roof) | x38..47 × z62..74, double height |
| rear wing, kitchen | 3 | 4 | 4..9 | x48..57 × z62..74, OPEN to the living room along x47/48 (no partition wall, at most a counter/island) |
| rear wing, upper | 10 | 11 | 11..16 | x48..57 × z62..74 (2 bedrooms + bath); a balcony rail at x48 y11 looking down into the vaulted living room |
| roof space | 17 | 18 | 18..25 | attic over the main block (trussed), not a room |
| carriage house | 0 | 1 | 1..5; loft 7..9 | x77..90 × z41..52; loft floor y6, ladder at x90 z52 |
| guest cottage | 1 | 2 | 2..5 | x77..86 × z65..74 (parlour + 1 bedroom + bath) |
| gazebo | 1 | 2 | 2..6 | octagon radius 3 around (13,81) |
| greenhouse | 0 (`gravel` path) | 1 | 1..8 | x5..20 × z65..74 |

Suggested room allocation (the second designer decides): ground: west front parlour/library, east front dining room (near the kitchen passage),
west rear guest bedroom (bedroom 8) + bath, east rear butler's pantry + powder room. Upper: master suite at the east front (x52..68 z43..52, 4 windows onto the
upper gallery) with its own bath behind it. Bedrooms 2-5 are the west front pair and the two rear rooms, with 2 hall baths. Bedrooms 6-7 and a bath are over the kitchen.


# DESIGNER SECTIONS (below the architect's form; nothing above is changed)

## PALETTE
Architect's MATERIALS kept exactly. Roles and variants (all ids checked with `mcd blocks --check`, none unknown):
- Wall body: `white_concrete`. Corner/trim: `quartz_pillar`, `smooth_quartz`, `chiseled_quartz_block`, `quartz_stairs`, `smooth_quartz_stairs`, `smooth_quartz_slab`, `quartz_slab`.
- Base: `bricks`, `brick_stairs`, `brick_slab`, `iron_bars`; chimney band `deepslate_bricks`; kerbs/hearth floor `smooth_stone`, `smooth_stone_slab`; carriage plinth `stone_bricks`.
- Roof (slate): `deepslate_tiles`, `deepslate_tile_stairs`, `deepslate_tile_slab`, `polished_deepslate`, `cobbled_deepslate`; trusses `stripped_spruce_log`.
- Joinery: `dark_oak_door`, `dark_oak_trapdoor` (shutters), `glass_pane`, `glass`, `dark_oak_fence`, `dark_oak_planks/slab/stairs` (furniture trim).
- Floors: ground hall `smooth_quartz` + `stone_bricks` checker, rooms `spruce_planks`, `oak_planks`; upper porch `spruce_planks`; carpets `red_carpet`,`blue_carpet`,`white_carpet`.
- Balustrade: `birch_fence`, `birch_fence_gate`, `smooth_quartz_slab`(top).
- Furniture/decor: `bookshelf` (library only), `barrel`, `chest`, `smoker`, `furnace`, `campfire`, `cauldron`, `water_cauldron`, `flower_pot`, `decorated_pot`, `candle`, `lantern`, `iron_chain`, `white_bed`, `red_bed`, `lectern`, `loom`, `composter`, `anvil`, `jukebox`, `bell`, `ladder`, `hay_block`, `lightning_rod`, `white_wool`, `red_wool`.
- Grounds: `grass_block`, `gravel`, `dirt_path`, `podzol`, `coarse_dirt`, `moss_block`, `sand`, `water`, `lily_pad`, `farmland`, `dark_oak_log`, `dark_oak_leaves`, `vine`, `cherry_log`, `cherry_leaves`, `oak_log`, `flowering_azalea_leaves`, `flowering_azalea`, `spruce_leaves`, `peony`, `rose_bush`, `allium`, `lily_of_the_valley`, `poppy`, `lilac`, `sunflower`, `spruce_log`, `spruce_fence`, `spruce_planks`, `spruce_slab`, `hanging_roots`.

## VOCABULARY
All helpers `(g, ...)` use the toolkit `B`/`g` API; write once in `vocab.mjs`, several sessions share it.
- `colossalColumn(g, x, z)`: 2x2 at (x..x+1, z..z+1): y4 `smooth_quartz` base; y5..15 `quartz_pillar` axis y; y16 `chiseled_quartz_block`; volutes: upside-down `quartz_stairs` (half top) at y16 on z-1 and z+2 sides, facing outward (north/south), plus x-1, x+2 for end columns.
- `galleryFloor(g)`: y3 `smooth_quartz` x25..70 z35..41; y10 `spruce_planks` z36..41 (edge row z35 `smooth_quartz`), skipping P-col cells; y17 `smooth_quartz` ceiling.
- `balustrade(g, x0, x1, z, y)`: `birch_fence` at y, `smooth_quartz_slab` type top at y+1 over each cell.
- `ventArch(g, x)`: z35 y1 `iron_bars`; y2 upside-down `brick_stairs` flanks.
- `fanlitDoor(g, y0)`: per plan OPENINGS door composition; doors both halves, facing north (out), hinges left/right mirrored; sidelights/transom `glass_pane`; surround `quartz_pillar`; lintel; proud cap `quartz_stairs` upside-down at z41.
- `tallWindow(g, x, z, face, y0, h)`: 2-wide `glass_pane` filling the opening, `smooth_quartz_slab` sill (top), `smooth_quartz` lintel.
- `shutterPair(g, x0, x1, y0, h, face)`: `shutter(...)` `dark_oak_trapdoor` open, flat on the wall one cell outside each side.
- `chimneyStack(g, x, z)`: 2x2 `bricks` y0..27; `deepslate_bricks` y26 ring; y27 upside-down `brick_stairs` ring stepping out; lit `campfire` (lit true) inside top, `hay_block` under it.
- `hearth(g, x, z, face, y)`: firebox in stack face: `smooth_stone` floor, lit `campfire` (non-walk-on), upside-down `brick_stairs` lintel y+2 on both sides, `smooth_quartz_slab` mantel.
- `grandStair(g)`: x45..46 z60→54 `smooth_quartz_stairs` facing north, step i at y4+i (z60-i), half bottom, `bricks`/`smooth_quartz` solid under; landing y10 z53; rail `birch_fence` + slab along x47 and hole edges.
- `vaultCove(g)`: living room y15..17, upside-down `quartz_stairs` stepping in 1/course from walls (x38,x47,z62,z74) to a flat `white_concrete` panel y17; plaster.
- `rearPorch(g)`: per plan SITE/ROOFS.
- `stoop(g, side)`: per plan garden door stoop.
- `liveOak(g, x, z)`: 2x2 `dark_oak_log` y1..6, crown flattened dome radius 5 y6..12 `dark_oak_leaves` persistent true (irregular edge, top y12 radius 3), `vine` hanging from underside at crown edge 2-4 long; `podzol`/`coarse_dirt` root patch.
- `cherryTree(g, x, z)`, `magnolia(g, x, z)`: per plan flowering trees.
- `driveStrip(g)`: `gravel` + `smooth_stone` kerbs.
- `forecourtOval(g)`, `urn(g, x, z)`: `smooth_quartz` pedestal y1, `chiseled_quartz_block` urn y2, `flowering_azalea` ring.
- `gatePier(g, x, z)`: 2x2 `bricks` y0..3, `smooth_quartz` cap y4, `lantern` y5.
- `lampPost(g, x, z)`: `dark_oak_fence` y1..3 + `lantern` y4 (hanging false).
- `parterreBed(g, x0, z0, x1, z1)`: `spruce_leaves` persistent hedge ring y1, flowers inside on grass_block, topiary cone corner.
- `fountain(g)`: per plan fountain row, `water` ring and jet.
- `gazebo(g)`, `greenhouse(g)`, `carriageHouse(g)`, `cottage(g)`: per plan rows; each with own roof and doors.
- `riverBand(g)`, `dock(g)`.
- `porchLantern(g, x, y, z)`: `iron_chain` y axis + `lantern` hanging true under the gallery ceiling.
- `bed(g,...)`, `shutter(g,...)`, `plaque`, `clock`: toolkit.

## ROOMS (inner air boxes; partitions are 1-thick `white_concrete`/plaster on the lines between)
Ground (floor y3, stand y4, air y4..9): west part x27..43, hall x45..50 (walls x44, x51), east part x52..68. Fronts z43..49 (wall z50), corridors z51..52 (wall z53), rears z54..60. Chimney stacks x33-34 / x61-62 at z46-47 and z56-57 stand in the rooms (their hearth faces the room centre).
Upper (floor y10, stand y11, air y11..16): same layout. Wing upper rooms x50..57. Details in the returned `rooms` list.
Interior doorways: hall west x44: z46..47 (parlour, 2 wide, y4..6), z51..52 (corridor, y4..6); hall east x51: z46..47 (dining), z51..52 (corridor). Corridor doors into rear rooms at z53; into front rooms at z50. Same on upper (y11..13).
Stairs: grand stair x45..46 z60→54, y4→10, landing z53; hole x45..46 z54..56 in the upper floor (shell leaves P-stair open; P4 closes the rest of y10 over x45..50 z50..59 except the hole). Ladder in carriage house x90 z52.
Entrance: the player stands on the gravel in front of the steps at (47,1,31).

## PARTS (12-minute jobs; the rooms are furnished by their own designers)
1. parts/shell.mjs, mansion masonry shell: base y0..2 with `ventArch`, main block and rear wing walls, string/plate courses, floors y3 and y10 (upper hole per P-stair, wing upper y10 over x48..57), partitions per ROOMS, interior doorways (air), all OPENINGS left air, pilasters, living room `vaultCove`, rear porch base.
2. parts/roofs.mjs, roofs and chimneys: roof.json R-main with dormers and trusses (`mcd roof --dry-run`), `chimneyStack` x4 + `hearth` in every room face (ground and upper), hand roof R-rearporch.
3. parts/colonnade.mjs, colonnade and galleries: `colossalColumn` x8, `galleryFloor`, `balustrade`, entablature, gallery ceiling, `porchLantern`, `rearPorch` and slim columns, `stoop` x2.
4. parts/joinery.mjs, joinery: `fanlitDoor` both floors, `tallWindow` all openings, `shutterPair`, garden/service doors, `grandStair` and its rail, front-hall chandelier chains.
5. parts/outbuildings.mjs: `carriageHouse` (with cupola), `cottage`, each with roof, doors, windows, shutters, chimney.
6. parts/grounds.mjs: drive, `liveOak` x8, forecourt, gate piers, boundary fence, `lampPost`s, formal garden, `fountain`, `greenhouse`, `gazebo`, flowering trees, river, dock, `frontSteps`.

Checklist: [ ] 1 shell  [ ] 2 roofs+chimneys  [ ] 3 colonnade  [ ] 4 joinery+stair  [ ] 5 outbuildings  [ ] 6 grounds

## NOTES FOR WORKERS
- Only add into air; leave every OPENINGS/RESERVED cell for its named part. Keep stack cells (`keep`) free in the roof.
- Mirror about x=47.5. Letters/words: none on this building.
- Run `$MCD check`, `$MCD fit`, `$MCD walk build.nbt --rooms rooms.json` after each part. Stand on full blocks only; no stairs on bottom slabs.
- Persistent leaves everywhere. Campfires lit only in stack tops and hearths (never where walked).
- The estate must stay within x0..95 z0..95.
```

### elements.md

```markdown
# REQUIRED ELEMENTS (checklist). Coordinates from plan.md. Part numbers: P1 shell, P2 roofs+chimneys, P3 colonnade+galleries, P4 joinery, P5 outbuildings, P6 grounds.

- [ ] **Colossal columns (8 stacks, 2x2, x25-26,31-32,37-38,43-44,51-52,57-58,63-64,69-70 z35..36)** (P3, `colossalColumn`): base y4 `smooth_quartz` 2x2; shaft y5..15 `quartz_pillar` axis y; capital y16 `chiseled_quartz_block` 2x2 + ring of upside-down `quartz_stairs` on z34 and z37 sides (half top, facing outward). Shaft passes through the y10 porch floor (floor skips those cells).
- [ ] **Double gallery** (P3, `galleryFloor`): ground floor y3 `smooth_quartz` x25..70 z35..41; upper porch floor y10 `spruce_planks` z36..41 with `smooth_quartz` edge at z35 y10; ceiling y17 `smooth_quartz` z35..41; entablature band y17 x24..71 z35..36 and ends x25/x70.
- [ ] **Balustrades** (P3, `balustrade`): `birch_fence` y11 + `smooth_quartz_slab` type top y12 between columns on z35 (upper) and fence y4 + slab y5 (ground, skip x45..50); also gallery ends x25/x70 z37..41.
- [ ] **Raised brick base with arched vents** (P1, `ventArch`): `bricks` y0..2, six vents at z35 y1 `iron_bars` flanked by upside-down `brick_stairs` lintel at y2.
- [ ] **Front steps and cheeks** (P6, `frontSteps`): per plan SITE row; `smooth_quartz_stairs` on bricks, newel + `lantern`.
- [ ] **Grand double front door x45..50** (P4, `fanlitDoor`): posts `quartz_pillar` x45/x50, sidelights `glass_pane` x46/x49, double `dark_oak_door` x47..48 (hinges mirrored), transom `glass_pane` y6..8, lintel `chiseled_quartz_block`+`smooth_quartz` y9, cap upside-down `quartz_stairs` y9 x44..51. Upper twin at y11..15 (door y11..12).
- [ ] **Tall shuttered windows** (P4, `tallWindow` + `shutterPair`): 2x5 on the front, 2x4 on ends; `glass_pane`, `smooth_quartz_slab` sill, `smooth_quartz` lintel; `dark_oak_trapdoor` open shutters each side, flat on the wall (use `shutter()`).
- [ ] **Low hipped slate roof, quartz dentil cornice** (P2): roof.json R-main exactly as plan ROOFS; trusses `stripped_spruce_log`.
- [ ] **Dormers x5** (P2): 3 north (x≈36..38,46..49,57..59), 2 south; gable dormers, `glass_pane`, `smooth_quartz` cheeks, slate hip cap.
- [ ] **Chimneys x4** (P2, `chimneyStack`): `bricks` 2x2 y0..28 at x33-34/61-62 z46-47/56-57, band `deepslate_bricks` y26, cap `brick_stairs` ring y27 (upside-down), lit `campfire` at y27 top (hay_block under for signal height). Roof stays whole round the stack.
- [ ] **Fireplaces (P-hearth)** (P2, `hearth`): firebox 1x1x2 in stack face toward room at y4..5, y11..12: floor `smooth_stone`, lit `campfire`, lintel upside-down `brick_stairs`, mantel `smooth_quartz_slab`.
- [ ] **Wide central hall** x45..50 z43..60, both floors, `grandStair` at the back (P4), marble floor `smooth_quartz`/`stone_bricks` checker (rooms designer).
- [ ] **Grand stair** (P4, `grandStair`): `smooth_quartz_stairs` x45..46 rising NORTH from z60 (y4) to z54 (y10), landing y10 z53; hole in upper floor x45..46 z54..56 with `birch_fence` rail; solid `bricks`/`quartz` core under steps; spruce rail band.
- [ ] **8 bedrooms** (guest ground; B2,B3,B4; master; B5; B6,B7 over kitchen) with `bed()` helper; **master suite** the largest (x52..63 z43..49, own bath x65..68, windows onto upper porch).
- [ ] **Bathrooms x5** (ensuite master; hall baths W x40..43 and E x63..68; guest; powder): `cauldron`/`water_cauldron` tub, `dark_oak_trapdoor` + `flower_pot` basin, `iron_bars` mirror... (room designers).
- [ ] **Kitchen** (x48..57 z62..74) with hearth, `smoker`, `furnace`, barrels, island; **open to the vaulted living room** along x47/48 (no wall).
- [ ] **Dining room** (x52..68 z43..49), long table, chairs, sideboard, chandelier of `iron_chain`+`lantern`.
- [ ] **Vaulted living room** (x38..47 z62..74, y4..16, open two storeys): coved vault y15..17 by upside-down `quartz_stairs` stepping in 1/course; Palladian window south; balcony rail x48 y11 from upper wing (P1 `vaultCove`).
- [ ] **Upper porch reached from upstairs hall** (door x47..48 z42 y11..12) (P4).
- [ ] **Drive + allee of 8 live oaks** (P6, `liveOak`, `driveStrip`): `gravel` x45..50 z0..23, `smooth_stone` kerbs, oaks per plan SITE, crowns meet; `vine` moss hanging.
- [ ] **Oval forecourt with lawn island, azaleas, urn** (P6, `forecourtOval`, `urn`).
- [ ] **Gate piers + boundary fence + lamp posts** (P6, `gatePier`, `lampPost`).
- [ ] **Carriage house** x76..91 z40..53 (P5, `carriageHouse`): bricks, 3 arched doors, loft, ladder, hip roof, cupola with `lightning_rod`.
- [ ] **Guest cottage** x76..87 z60..75 (P5, `cottage`): white miniature, 4-column porch, hip roof, chimney.
- [ ] **Gazebo** centre (13,81) (P6, `gazebo`): octagon floor, 8 columns, fence balustrade, stair-cone roof, rod.
- [ ] **Greenhouse** x4..21 z64..75 (P6, `greenhouse`): brick dwarf wall, quartz posts, glass, glass gable roof, benches.
- [ ] **Formal garden with hedged beds and fountain** x4..22 z36..60 (P6, `parterreBed`, `fountain`).
- [ ] **Flowering trees** (P6, `cherryTree`, `magnolia`).
- [ ] **River frontage, pond-like river, dock** (P6, `riverBand`, `dock`): sand bank, water y-3..-1, dock x44..51 z84..92.
- [ ] **Rear porch + steps** (P3, `rearPorch`): 6 slim `quartz_pillar` columns, shed roof of `deepslate_tile_stairs`, steps.
- [ ] **Garden-door stoops** W/E (P3, `stoop`).
- [ ] **Lighting**: hanging lanterns in hall (`chain`), porch lanterns (`lampPost`, `porchLantern`) (room designers + P6).
```

### rooms.json

```json
{"entrance":[47,1,31],"rooms":[{"name":"entrance hall","box":[45,4,43,50,9,60]},{"name":"parlour library","box":[27,4,43,43,9,49]},{"name":"dining room","box":[52,4,43,68,9,49]},{"name":"west ground corridor","box":[27,4,51,43,9,52]},{"name":"east ground corridor","box":[52,4,51,68,9,52]},{"name":"guest bedroom","box":[27,4,54,32,9,60]},{"name":"guest bath","box":[35,4,54,37,9,60]},{"name":"back hall morning room","box":[39,4,54,43,9,60]},{"name":"butler's pantry","box":[52,4,54,60,9,60]},{"name":"powder room","box":[63,4,54,68,9,60]},{"name":"living room","box":[38,4,62,47,16,74]},{"name":"kitchen","box":[48,4,62,57,9,74]},{"name":"upper hall and porch landing","box":[45,11,43,50,16,60]},{"name":"master bedroom","box":[52,11,43,63,16,49]},{"name":"master bath","box":[65,11,43,68,16,49]},{"name":"bedroom 2","box":[27,11,43,35,16,49]},{"name":"bedroom 3","box":[37,11,43,43,16,49]},{"name":"west upper corridor","box":[27,11,51,43,16,52]},{"name":"bedroom 4","box":[27,11,54,38,16,60]},{"name":"west hall bath","box":[40,11,54,43,16,60]},{"name":"east upper corridor and wing passage","box":[52,11,51,68,16,60]},{"name":"bedroom 5","box":[55,11,54,60,16,60]},{"name":"east hall bath","box":[63,11,54,68,16,60]},{"name":"wing balcony walk","box":[49,11,62,57,16,62]},{"name":"wing walkway","box":[49,11,63,49,16,74]},{"name":"bedroom 6","box":[51,11,64,57,16,68]},{"name":"bedroom 7","box":[51,11,70,57,16,74]},{"name":"upper porch","box":[25,11,35,70,16,41]},{"name":"ground gallery","box":[25,4,35,70,9,41]},{"name":"rear porch","box":[37,4,76,58,7,79]},{"name":"carriage bay","box":[77,1,41,90,5,52]},{"name":"carriage loft","box":[77,7,41,90,9,52]},{"name":"cottage parlour","box":[77,2,65,86,5,69]},{"name":"cottage bedroom","box":[77,2,71,82,5,74]},{"name":"cottage bath","box":[84,2,71,86,5,74]},{"name":"gazebo","box":[10,2,78,16,6,84]},{"name":"greenhouse","box":[5,1,65,20,8,74]}]}
```

### palette.json

```json
{"roles":{"wall":["white_concrete"],"trim":["quartz_pillar","smooth_quartz","smooth_quartz_slab","smooth_quartz_stairs","quartz_stairs","quartz_slab","chiseled_quartz_block"],"base":["bricks","brick_stairs","brick_slab","iron_bars","deepslate_bricks","smooth_stone","smooth_stone_slab","stone_bricks"],"roof":["deepslate_tiles","deepslate_tile_stairs","deepslate_tile_slab","polished_deepslate","cobbled_deepslate","stripped_spruce_log"],"joinery":["dark_oak_door","dark_oak_trapdoor","glass_pane","glass","dark_oak_fence","dark_oak_planks","dark_oak_slab","dark_oak_stairs","birch_fence","birch_fence_gate","spruce_fence"],"floor":["spruce_planks","oak_planks","spruce_slab","red_carpet","blue_carpet","white_carpet"],"ground":["grass_block","gravel","dirt_path","podzol","coarse_dirt","moss_block","sand","farmland","hanging_roots"],"water":["water","lily_pad"],"trees":["dark_oak_log","dark_oak_leaves","vine","cherry_log","cherry_leaves","oak_log","flowering_azalea_leaves","spruce_leaves","spruce_log"],"plants":["flowering_azalea","peony","rose_bush","allium","lily_of_the_valley","poppy","lilac","sunflower"],"light":["lantern"]},"objects":["barrel","chest","smoker","furnace","campfire","cauldron","water_cauldron","flower_pot","decorated_pot","candle","iron_chain","white_bed","red_bed","lectern","loom","composter","anvil","jukebox","bell","ladder","hay_block","lightning_rod","white_wool","red_wool","bookshelf"]}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which must read back as a structure, then replaces build.nbt.
set -eu
cd "$(dirname "$0")"
MCD_JS=/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs
tmp="build.tmp.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
node "$MCD_JS" info "$tmp" > /dev/null
mv "$tmp" build.nbt
echo "build.nbt written"
```

### build.mjs

```js
// Builds build.nbt from scratch: the site's ground, then every part in plan order (runParts locks each part's blocks).
// Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_SIZE, GROUND_Y } from "./vocab/base.mjs";
import * as shell from "./parts/shell.mjs";
import * as stairs from "./parts/stairs.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as colonnade from "./parts/colonnade.mjs";
import * as joinery from "./parts/joinery.mjs";
import * as outbuildings from "./parts/outbuildings.mjs";
import * as grounds from "./parts/grounds.mjs";
import * as room1 from "./parts/room-1.mjs";
import * as room2 from "./parts/room-2.mjs";
import * as room3 from "./parts/room-3.mjs";
import * as room4 from "./parts/room-4.mjs";
import * as room5 from "./parts/room-5.mjs";
import * as room6 from "./parts/room-6.mjs";
import * as room7 from "./parts/room-7.mjs";
import * as room8 from "./parts/room-8.mjs";
import * as room9 from "./parts/room-9.mjs";
import * as room10 from "./parts/room-10.mjs";
import * as room11 from "./parts/room-11.mjs";
import * as room12 from "./parts/room-12.mjs";
import * as room13 from "./parts/room-13.mjs";
import * as room14 from "./parts/room-14.mjs";
import * as room15 from "./parts/room-15.mjs";
import * as room16 from "./parts/room-16.mjs";
import * as room17 from "./parts/room-17.mjs";
import * as room18 from "./parts/room-18.mjs";
import * as room19 from "./parts/room-19.mjs";
import * as room20 from "./parts/room-20.mjs";
import * as room21 from "./parts/room-21.mjs";
import * as room22 from "./parts/room-22.mjs";
import * as room23 from "./parts/room-23.mjs";
import * as room24 from "./parts/room-24.mjs";
import * as room25 from "./parts/room-25.mjs";
import * as room26 from "./parts/room-26.mjs";
import * as room27 from "./parts/room-27.mjs";
import * as room28 from "./parts/room-28.mjs";
import * as room29 from "./parts/room-29.mjs";
import * as room30 from "./parts/room-30.mjs";
import * as room31 from "./parts/room-31.mjs";
import * as room32 from "./parts/room-32.mjs";
import * as room33 from "./parts/room-33.mjs";
import * as room34 from "./parts/room-34.mjs";
import * as room35 from "./parts/room-35.mjs";
import * as room36 from "./parts/room-36.mjs";
import * as room37 from "./parts/room-37.mjs";

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(1);
}

// The stair joiner carves its stairwells through the shell's floors (carve: true); every other part only adds into air.
const PARTS = [
  ["mansion shell", shell.build],
  ["stairs and ladders", stairs.build, { carve: true }],
  ["roofs and chimneys", roofs.build],
  ["colonnade and galleries", colonnade.build],
  ["joinery", joinery.build],
  ["outbuildings", outbuildings.build],
  ["grounds", grounds.build],
  ["room: entrance hall", room1.build],
  ["room: parlour library", room2.build],
  ["room: dining room", room3.build],
  ["room: west ground corridor", room4.build],
  ["room: east ground corridor", room5.build],
  ["room: guest bedroom", room6.build],
  ["room: guest bath", room7.build],
  ["room: back hall morning room", room8.build],
  ["room: butler's pantry", room9.build],
  ["room: powder room", room10.build],
  ["room: living room", room11.build],
  ["room: kitchen", room12.build],
  ["room: upper hall and porch landing", room13.build],
  ["room: master bedroom", room14.build],
  ["room: master bath", room15.build],
  ["room: bedroom 2", room16.build],
  ["room: bedroom 3", room17.build],
  ["room: west upper corridor", room18.build],
  ["room: bedroom 4", room19.build],
  ["room: west hall bath", room20.build],
  ["room: east upper corridor and wing passage", room21.build],
  ["room: bedroom 5", room22.build],
  ["room: east hall bath", room23.build],
  ["room: wing balcony walk", room24.build],
  ["room: wing walkway", room25.build],
  ["room: bedroom 6", room26.build],
  ["room: bedroom 7", room27.build],
  ["room: upper porch", room28.build],
  ["room: ground gallery", room29.build],
  ["room: rear porch", room30.build],
  ["room: carriage bay", room31.build],
  ["room: carriage loft", room32.build],
  ["room: cottage parlour", room33.build],
  ["room: cottage bedroom", room34.build],
  ["room: cottage bath", room35.build],
  ["room: gazebo", room36.build],
  ["room: greenhouse", room37.build],
];

function buildWith(roof) {
  const g = new Grid(SITE_SIZE);
  g.fill([0, GROUND_Y, 0], [SITE_SIZE[0] - 1, GROUND_Y, SITE_SIZE[2] - 1], "grass_block");
  runParts(g, PARTS, { palette: "palette.json", roof });
  return g;
}

// roof.json lays the roof on the shell's walls. While the shell is still a stub there are no walls to roof: build without it.
let g;
try {
  g = buildWith("roof.json");
} catch (e) {
  if (!/no walls found/.test(e.message)) throw e;
  console.log(`roof: skipped, ${e.message} (the shell has no walls yet)`);
  g = buildWith(undefined);
}

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Palette ids (palette.json's ids only), plan.md's site coordinates, and a seeded rng: every part imports from here.

// ---- site -------------------------------------------------------------------------------------------------------
// build.nbt has no negative y, so the grid is plan y 0..32. Plan y -4..-1 (the river bed, water and dock posts) can't be stored.

// ---- site -------------------------------------------------------------------------------------------------------
// build.nbt has no negative y, so the grid is plan y 0..32. Plan y -4..-1 (the river bed, water and dock posts) can't be stored.
export const SITE_SIZE = [96, 33, 96]; // grid size build.mjs makes: x 0..95, y 0..32, z 0..95 (plan.md SITE)

export const GROUND_Y = 0; // grass top; the player stands on y1

export const AXIS_X = 47.5; // house symmetry axis: x mirrors as 95 - x

export const FRONT = "north"; // z0 is the county road edge; the house faces north

export const ENTRANCE = [47, 1, 31]; // where the player stands on the gravel before the front steps

// floor levels (plan.md HOUSE)
export const GROUND_FLOOR_Y = 3; // ground floor; the air is y4..9

export const UPPER_FLOOR_Y = 10; // upper floor; the air is y11..16

export const PLATE_Y = 17; // wall plate and gallery ceiling

export const ROOF_Y = 18; // roofs start here

// masses, [x0, y0, z0, x1, y1, z1], inclusive (plan.md SITE)
export const HOUSE_MAIN = [26, 3, 42, 69, 17, 61];

export const REAR_WING = [37, 3, 62, 58, 17, 75];

export const FRONT_GALLERY = [25, 3, 35, 70, 17, 41];

export const PLINTH = [25, 0, 35, 70, 2, 61];

export const REAR_PORCH = [37, 3, 76, 58, 8, 79];

export const DRIVE = [45, 0, 0, 50, 0, 23];

export const FORECOURT = [37, 0, 24, 58, 0, 31];

export const FRONT_STEPS = [45, 1, 32, 50, 3, 34];

export const FORMAL_GARDEN = [4, 0, 36, 22, 1, 60];

export const FOUNTAIN = [10, 0, 45, 16, 3, 51];

export const GREENHOUSE = [4, 0, 64, 21, 9, 75];

export const GAZEBO = [10, 0, 78, 16, 9, 84];

export const CARRIAGE_HOUSE = [76, 0, 40, 91, 10, 53];

export const COTTAGE = [76, 0, 64, 87, 7, 75];

export const DOCK = [44, 0, 84, 51, 0, 92]; // deck only; the posts are below y0

// the four chimney stacks, 2x2 from (x, z); each runs y0..28
export const CHIMNEYS = [[33, 46], [33, 56], [61, 46], [61, 56]];

// the eight live oaks: trunks 2x2 at these x (west 41..42, east 53..54) and z (2..3, 8..9, 14..15, 20..21)
export const ALLEE_TRUNK_X = [41, 53];

export const ALLEE_TRUNK_Z = [2, 8, 14, 20];

// ---- palette ----------------------------------------------------------------------------------------------------
export const WHITE_CONCRETE = "white_concrete"; // wall body: house, wing, cottage

export const QUARTZ_PILLAR = "quartz_pillar"; // columns, corner pilasters, slim porch columns

export const SMOOTH_QUARTZ = "smooth_quartz"; // floors, plate, cornice, sills, steps, fountain

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab"; // sills, balustrade top, mantels

export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs"; // steps, grand stair, volutes

export const QUARTZ_STAIRS = "quartz_stairs"; // capital volutes, vault cove, proud caps

export const QUARTZ_SLAB = "quartz_slab"; // quartz trim slab

export const CHISELED_QUARTZ = "chiseled_quartz_block"; // capitals, urn, apex

export const BRICKS = "bricks"; // plinth, chimneys, gate piers, carriage body, greenhouse wall

export const BRICK_STAIRS = "brick_stairs"; // vent flanks, chimney caps, hearth lintels

export const BRICK_SLAB = "brick_slab"; // base caps

export const IRON_BARS = "iron_bars"; // vent grilles

export const DEEPSLATE_BRICKS = "deepslate_bricks"; // chimney band

export const SMOOTH_STONE = "smooth_stone"; // kerbs, hearth floors, carriage floor

export const SMOOTH_STONE_SLAB = "smooth_stone_slab"; // kerb caps, coping

export const STONE_BRICKS = "stone_bricks"; // carriage plinth, entrance hall checker

export const DEEPSLATE_TILES = "deepslate_tiles"; // slate roof

export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs"; // slate hip stairs, porch shed roof

export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab"; // slate slab courses

export const POLISHED_DEEPSLATE = "polished_deepslate"; // roof detail

export const COBBLED_DEEPSLATE = "cobbled_deepslate"; // roof mix

export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log"; // roof trusses

export const DARK_OAK_DOOR = "dark_oak_door"; // front, gallery, garden and service doors

export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor"; // shutters (open, flat on the wall)

export const GLASS_PANE = "glass_pane"; // windows, sidelights, transoms

export const GLASS = "glass"; // greenhouse panels

export const DARK_OAK_FENCE = "dark_oak_fence"; // lamp posts, hitching rail, furniture trim

export const DARK_OAK_PLANKS = "dark_oak_planks"; // furniture trim

export const DARK_OAK_SLAB = "dark_oak_slab"; // furniture trim

export const DARK_OAK_STAIRS = "dark_oak_stairs"; // furniture trim

export const BIRCH_FENCE = "birch_fence"; // balustrades, boundary picket line

export const BIRCH_FENCE_GATE = "birch_fence_gate"; // balustrade gates

export const SPRUCE_FENCE = "spruce_fence"; // dock rail

export const SPRUCE_PLANKS = "spruce_planks"; // upper porch floor, dock deck, room floors

export const SPRUCE_SLAB = "spruce_slab"; // dock and porch trim

export const OAK_PLANKS = "oak_planks"; // room floors

export const RED_CARPET = "red_carpet"; // rugs

export const BLUE_CARPET = "blue_carpet"; // rugs

export const WHITE_CARPET = "white_carpet"; // rugs

export const GRASS_BLOCK = "grass_block"; // lawns and the forecourt island

export const GRAVEL = "gravel"; // drive, forecourt oval, garden paths, service lane

export const DIRT_PATH = "dirt_path"; // minor walks

export const PODZOL = "podzol"; // root patches under the oaks

export const COARSE_DIRT = "coarse_dirt"; // root patches under the oaks

export const MOSS_BLOCK = "moss_block"; // root patches under the oaks

export const SAND = "sand"; // river bank

export const FARMLAND = "farmland"; // garden beds

export const HANGING_ROOTS = "hanging_roots"; // under the oaks

export const WATER = "water"; // river, fountain

export const LILY_PAD = "lily_pad"; // river edge

export const DARK_OAK_LOG = "dark_oak_log"; // live oak trunks

export const DARK_OAK_LEAVES = "dark_oak_leaves"; // live oak crowns (persistent)

export const VINE = "vine"; // Spanish moss under the crowns

export const CHERRY_LOG = "cherry_log"; // cherry trunks

export const CHERRY_LEAVES = "cherry_leaves"; // cherry crowns (persistent)

export const OAK_LOG = "oak_log"; // magnolia trunks

export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves"; // magnolia crowns

export const FLOWERING_AZALEA = "flowering_azalea"; // lawn ring, forecourt island

export const SPRUCE_LEAVES = "spruce_leaves"; // boxwood hedges (persistent)

export const SPRUCE_LOG = "spruce_log"; // dock posts (axis y)

export const PEONY = "peony"; // parterre flowers

export const ROSE_BUSH = "rose_bush"; // parterre flowers

export const ALLIUM = "allium"; // parterre flowers

export const LILY_OF_THE_VALLEY = "lily_of_the_valley"; // parterre flowers

export const POPPY = "poppy"; // parterre flowers

export const LILAC = "lilac"; // parterre flowers

export const SUNFLOWER = "sunflower"; // parterre flowers

export const LANTERN = "lantern"; // the only light outdoors and in the rooms (hanging: see porchLantern)

export const BARREL = "barrel"; // room storage and fittings

export const CHEST = "chest"; // dressers, fittings

export const SMOKER = "smoker"; // kitchen

export const FURNACE = "furnace"; // kitchen

export const CAMPFIRE = "campfire"; // chimney tops and hearths only, never where walked

export const CAULDRON = "cauldron"; // kitchen sink

export const WATER_CAULDRON = "water_cauldron"; // master bath tub

export const FLOWER_POT = "flower_pot"; // planters, basins

export const DECORATED_POT = "decorated_pot"; // planters

export const CANDLE = "candle"; // candles

export const IRON_CHAIN = "iron_chain"; // porch lanterns, hall chandelier

export const WHITE_BED = "white_bed"; // bedrooms

export const RED_BED = "red_bed"; // bedrooms

export const LECTERN = "lectern"; // library

export const LOOM = "loom"; // service rooms

export const COMPOSTER = "composter"; // kitchen garden

export const ANVIL = "anvil"; // service rooms

export const JUKEBOX = "jukebox"; // living room piano

export const BELL = "bell"; // carriage house

export const LADDER = "ladder"; // carriage loft, dock

export const HAY_BLOCK = "hay_block"; // carriage loft, stacks

export const LIGHTNING_ROD = "lightning_rod"; // cupola weathervane, gazebo finial

export const WHITE_WOOL = "white_wool"; // cushions

export const RED_WOOL = "red_wool"; // cushions

export const BOOKSHELF = "bookshelf"; // library only

// ---- rng ------------------------------------------------------------------------------------------------------
/** A seeded random source (mulberry32): rng(seed)() -> 0..1, the same sequence for the same seed. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// H1 helpers from plan.md VOCABULARY: colossalColumn, fanlitDoor, hearth, stoop, driveStrip, lampPost, greenhouse, dock.
//
// Every helper takes its position (and facing, where it has one) as arguments; nothing is fixed to a spot.
// Writes go only into AIR. A cell that already holds a block, or lies outside the grid, is left alone and returned
// as [x, y, z, block], so the caller can report it. Pass `over: GROUND_BLOCKS` only where the grounds part has laid
// ground that this helper is meant to replace. Fence and pane sides are read from the grid when the helper finishes,
// so lay the neighbours first. Leaves are persistent=true.

export const GROUND_BLOCKS = ["grass_block", "dirt", "coarse_dirt", "podzol", "moss_block", "gravel", "dirt_path", "sand", "water"];

/**
 * Colossal column: 2x2 at (x..x+1, z..z+1). `base` is the smooth_quartz plinth row (plan y4); the shaft runs
 * base+1..base+11 (quartz_pillar), the chiseled capital sits at base+12. Upside-down quartz_stairs volutes at the
 * capital row, lip pointing out: on the z-1 and z+2 sides by default; `volutes` adds "west"/"east" for end columns.
 * Footprint: x-1..x+2, z-1..z+2, rows base..base+12.
 */
export function colossalColumn(g, x, z, { base = 4, volutes = ["north", "south"], over = [] } = {})

/**
 * Double front door in a wall running along x, the opening's left surround post at x0 and its wall plane at z.
 * `facing` is the way the doors open onto (north or south). `height` is the opening: 6 on the ground floor (rows
 * y0..y0+5), 5 on the upper (plan OPENINGS). Posts, sidelights and transom are quartz_pillar and glass_pane; leaves are
 * dark_oak_door (both halves, hinges mirrored); lintel row smooth_quartz with a chiseled centre; a proud cap of
 * upside-down quartz_stairs one cell out from the wall on the lintel row.
 * Footprint: x0-1..x0+6, rows y0..y0+height-1, z and the cap row.
 */
export function fanlitDoor(g, x0, y0, z, facing = "north", { height = 6, over = [] } = {})

/**
 * Hearth in a chimney stack face. (x, z) is the firebox cell in the stack face, `y` its floor row, `face` the way it
 * opens into the room. Smooth_stone floor, lit campfire in the box, and a lintel of upside-down brick_stairs on the
 * row above with a smooth_quartz_slab mantel on top, across the firebox and its two lateral neighbours.
 * Footprint: the three cells across the face, rows y..y+3.
 */
export function hearth(g, x, z, face, y, { over = [] } = {})

/**
 * Garden-door stoop. (x, z0) is the first landing cell beside the door: a smooth_quartz landing at row y (plan y3),
 * two smooth_quartz_stairs steps going down away from the house, bricks under each. The run is `width` cells along z.
 * `facing` is the way the stoop rises, toward the door (east or west). Footprint: two cells out, rows 1..y, the run.
 */
export function stoop(g, x, z0, facing, { y = 3, width = 4, over = [] } = {})

/**
 * Gravel drive x0..x1 by z0..z1 on row y, with smooth_stone kerbs one cell out on each side (plan DRIVE, kerbs outside).
 * Footprint: x0-1..x1+1, row y, z0..z1.
 */
export function driveStrip(g, x0, z0, x1, z1, { y = 0, over = [] } = {})

/**
 * Lamp post at (x, z): dark_oak_fence on rows y..y+2 with a standing lantern on top at y+3 (plan: y1..3 + lantern y4).
 * Footprint: the one column, rows y..y+3.
 */
export function lampPost(g, x, z, { y = 1, over = [] } = {})

/**
 * Glasshouse over x0..x1 by z0..z1 (plan: x4..21 z64..75), floor row y. Gravel floor; brick dwarf wall on rows y..y+1
 * round the ring, with the threshold kept under the east door; smooth_quartz posts every 3 cells on the long walls
 * (rows y+2..y+6) and glass between; glazed gable ends; a glass roof that steps up from the eaves (row y+7) to a
 * smooth_quartz ridge at y+9 on the middle two rows; rafters of smooth_quartz on the posts; a double dark_oak_door
 * on the east face (rows y+1..y+2) with a glass transom; two benches of smooth_quartz_slab.
 * Footprint: x0..x1, rows y..y+9, z0..z1.
 */
export function greenhouse(g, x0, z0, x1, z1, { y = 0, over = [] } = {})

/**
 * Landing dock x0..x1 by z0..z1, deck on row y. Spruce-log posts on the rows below the deck, a spruce_fence rail on
 * row y+1 along both sides and the outer end (gap at x0+3..x0+4 for the ladder), lantern posts at the outer corners.
 * Posts and ladder sit below the deck: they are refused where the grid has no room below y0.
 * Footprint: x0..x1, rows y-4..y+3, z0..z1.
 */
export function dock(g, x0, z0, x1, z1, { y = 0, over = [] } = {})
```

### vocab/h2.mjs

```js
// Vocabulary helpers from plan.md VOCABULARY (second half): galleryFloor, tallWindow, grandStair, liveOak,
// forecourtOval, parterreBed, carriageHouse, porchLantern. Palette ids are literals; nothing is imported from vocab.mjs
// or the other vocab/ files. Every helper takes the grid first, then its position (and facing, where it has one), then
// an optional opts object, and returns { placed, skipped, box }: box is the footprint [x0, y0, z0, x1, y1, z1] it may
// write, and skipped counts cells it left alone because they were not air (opts.replace: true overwrites them, still
// inside the footprint). Writes outside the footprint throw, so nothing is ever placed under it: ground, sand and
// floors an earlier part owns stay as they are. Surface helpers (forecourtOval, parterreBed) write only their own y0
// layer, into air unless replace; pass replace when the lawn is already laid.

/**
 * Gallery floor of a colonnaded porch: y3 floor, y10 deck, y17 ceiling, over x0..x1 x z0..z1. The deck's z0 row is a
 * smooth_quartz edge, the rest spruce_planks. opts.skip: [x, z] anchors of 2x2 colossal columns, left open at the deck
 * (their shafts run through it); the floor and ceiling run over them.
 */
export function galleryFloor(g, x0, z0, x1, z1, { skip = [], replace = false } = {})

/**
 * A 2-wide, h-tall glass window in a wall. (x, z) is the opening's first cell on the wall plane: for a north or south
 * wall the opening runs x..x+1 with the wall at z; for an east or west wall it runs z..z+1 with the wall at x.
 * y0 is the glass's bottom row. A smooth_quartz_slab sill (top) sits at y0-1 and a smooth_quartz lintel at y0+h.
 * Pass sill: false where the sill row is already a floor (ground-floor windows: the floor is the sill). The
 * lintel and sill are wall cells the shell wrote, so they need replace: true.
 */
export function tallWindow(g, x, z, face, y0, h, { replace = false, sill = true } = {})

/**
 * The grand stair: a 2-wide flight that climbs north from (x..x+1, y0, zFoot) to a top step at zFoot - rise, with a
 * landing one north of the top (y = y0 + rise, z = zFoot - rise - 1). Step i is smooth_quartz_stairs (facing north,
 * half bottom) at y0+i, on a bricks core under it. The open side x+2 carries a birch_fence rail with a smooth_quartz
 * slab cap one row above, along the flight; the hole's south edge (z = top + 3) gets the same rail at the upper floor.
 */
export function grandStair(g, x, zFoot, { rise = 6, y0 = 4, replace = false } = {})

/**
 * A live oak at trunk (x..x+1, z..z+1): dark_oak_log trunk y1..6, a flattened crown of persistent dark_oak_leaves
 * radius 5 over y6..8, 4 over y9..11, 3 at y12, with an irregular edge. Vines hang 2-3 long down the outside of the
 * crown's edge, each one held by a leaf beside it. The root patch is not written: it would replace the ground (the
 * grounds part lays it).
 */
export function liveOak(g, x, z, opts = {})

/**
 * The oval forecourt on the surface y0 over the box x0..x1 x z0..z1: a superellipse of gravel, a grass_block island
 * centred in it (8 x 4 for a 22 x 8 box), a flowering_azalea ring round the island at y1, and a stone urn at its centre:
 * smooth_quartz pedestal y1 and chiseled_quartz_block urn y2, 2x2. Corners of the oval stay grass.
 */
export function forecourtOval(g, x0, z0, x1, z1, { replace = false } = {})

/**
 * One bed of the formal parterre over x0..x1 x z0..z1: a 1-wide spruce_leaves hedge ring at y1 (persistent), grass_block
 * inside on y0, flowers (allium, lily_of_the_valley, peony and rose_bush, the two tall ones over two rows) inside at y1,
 * and a 3-high topiary cone of spruce_leaves at the hedge corner opts.corner (ne, nw, se, sw; default se).
 */
export function parterreBed(g, x0, z0, x1, z1, { corner = "se", replace = false } = {})

/**
 * The carriage house on a 16 x 14 plan from (x0, z0), with its front on the north side only (facing "north"; other
 * facings throw). Body: stone_bricks plinth y0..1, bricks y2..9 with smooth_quartz quoins and a string course at y6,
 * smooth_quartz plate and loft-bay ceiling at y10, a smooth_stone floor at y0 and a spruce_planks loft floor at y6
 * with a ladder at (x0+14, z0+12). Three open carriage bays on the north wall (y1..4; a smooth_quartz lintel at y5 with
 * upside-down quartz_stairs at the corners), loft windows over them, side windows, and a dark_oak_door on the east
 * wall. Hip slate roof, 1 overhang, from y11, and a 3x3 smooth_quartz cupola with a lantern and lightning_rod at the ridge.
 */
export function carriageHouse(g, x0, z0, facing = "north", { replace = false } = {})

/**
 * A lantern hung from a ceiling: an iron_chain (axis y) at (x, y, z) right under the ceiling, and a hanging lantern
 * one cell below it, on the chain. The lantern hangs in the clear lane under the gallery ceiling (y16 for the upper
 * gallery).
 */
export function porchLantern(g, x, y, z, { replace = false } = {})
```

### vocab/h3.mjs

```js
// Plantation helpers from plan.md VOCABULARY. Each takes its position (and facing) as arguments and writes only into
// air: a cell that already holds a block (an earlier part's, the ground's, or one this helper just wrote) is skipped.
// Every helper returns { placed, skipped }.

/** Rail along x from x0 to x1 at z: birch_fence at y, smooth_quartz_slab (type top) at y+1 over each cell. */
export function balustrade(g, x0, x1, z, y)

/** Open dark_oak shutters for a window, flat on the wall, one cell outside each side. x0..x1 is the window's extent along
 *  the wall (x on a north/south front, z on an east/west one); wall is the wall's z (north/south) or x (east/west).
 *  h = height in cells. face = the way the wall looks. */
export function shutterPair(g, x0, x1, y0, h, face, wall)

/** Coved living-room vault over the interior box x0..x1, z0..z1: upside-down quartz_stairs against the walls at y0, one
 *  course in at y0+1, then a flat white_concrete panel at y0+2 over the rest. */
export function vaultCove(g, x0, x1, z0, z1, y0 = 15)

/** Flowering cherry at (x,z): cherry_log trunk y0..y0+4, a stepped round crown of persistent cherry_leaves (radius 3)
 *  around the trunk top. The trunk is kept where the crown would overlap it. */
export function cherryTree(g, x, z, y0 = 1)

/** Stone urn on a pedestal, 2x2 at (x..x+1, z..z+1): smooth_quartz pedestal at y0, chiseled_quartz_block urn at y0+1,
 *  a flowering_azalea ring on the cells around it at y0. */
export function urn(g, x, z, y0 = 1)

/** Fountain on a 7x7 basin, origin corner (x0, z0): smooth_quartz rim at y0 with chamfered (slab) corners, water inside
 *  it, a quartz_pillar plinth at the centre with a water jet on top at y0+2. The ground row (y0-1) is not written. */
export function fountain(g, x0, z0, y0 = 1)

/** White guest cottage (the house in miniature) with a 4-column porch, a hip roof and its shutters. (x0, z0) = the main
 *  block's min corner; y0 = the floor row (the ground row y0-1 is not written). Doors are dark_oak, windows glass_pane. */
export function cottage(g, x0, z0, facing = "north", y0 = 1)

/** Front steps: three smooth_quartz_stairs treads rising toward `facing`, the first at (x0, z0) at height y0, `width`
 *  treads across. Bricks under each tread, bricks cheek walls one cell out on each side, smooth_quartz caps, and a newel
 *  with a standing lantern at the bottom of each cheek. The ground row (y0-1) is not written. */
export function frontSteps(g, x0, z0, facing = "south", width = 6, y0 = 1)
```

### vocab/h4.mjs

```js
// vocab/h4.mjs: seven plantation helpers from plan.md VOCABULARY: ventArch, chimneyStack, rearPorch, magnolia,
// gatePier, gazebo, riverBand. Shared conventions:
//  - Positions are SITE coordinates as plan.md writes them (ground grass at y0, player stands y1). The build grid's
//    y origin is site y -4, so grid y = site y + SITE_Y (riverBand's bed at y-4 is grid 0).
//  - Each helper takes its position (and facing where it has one) as arguments and returns
//    { box, placed, skipped }: box = the footprint it may write (site coords, inclusive); placed = blocks written;
//    skipped = [x, y, z] cells refused (outside the box, outside the grid, or not air unless { overwrite: true }).
//    Nothing is written below box[1], so ground, sand and floors an earlier part owns are left alone.
//  - Stairs, slabs, pillars, logs and lanterns come from the build library's B helpers (they carry the states).
//  - Leaves are persistent=true (terrain.mjs convention).

export const SITE_Y = 4;

/**
 * The arched vent in the brick plinth: iron_bars in the opening at (x, y, z), a three-cell upside-down brick_stairs
 * lintel across it at y+1. face = the way the wall looks; the wall runs across that face (x for north/south).
 */
export function ventArch(g, x, z, { face = "north", y = 1, overwrite = false } = {})

/**
 * A 2x2 interior brick stack from y (default 0, site) up to y+27: deepslate_bricks band at y+26 with a hay_block under
 * the flue; a lit campfire in the top cell (the flue); an upside-down brick_stairs cap ring at y+27 stepping out.
 * (plan.md's SITE row says the cap sits at y28; VOCABULARY says y27, which is followed here.)
 */
export function chimneyStack(g, x, z, { y: y0 = 0, overwrite = false } = {})

/**
 * The one-storey rear porch against the wing wall at zWall, running to zFront (dir = the sign of zFront - zWall;
 * plan: zWall 75, zFront 79, south). Floor y0 (default 3) smooth_quartz over x0..x1; `posts` slim quartz_pillar posts
 * at zFront, y0+1..y0+4, spread evenly over x0..x1; beam y0+5; a shed roof of deepslate_tile_stairs, high at the wall
 * (y0+7) and low at the eave (y0+6) over zFront..zFront+dir, with a slab fascia under the one-cell overhang; three
 * smooth_quartz_stairs steps down to the lawn, 6 wide and centred on the porch, each with bricks under.
 */
export function rearPorch(g, x0, x1, zWall, zFront, { y0 = 3, posts = 6, overwrite = false } = {})

/**
 * A flowering magnolia on (x, z): oak_log trunk of `height` cells from y (default 1, on the grass), and a sphere of
 * flowering_azalea_leaves (radius 3, persistent) centred on the trunk top.
 */
export function magnolia(g, x, z, { y = 1, height = 5, overwrite = false } = {})

/**
 * A gate pier with its 2x2 base on (x, z): bricks from y (default 1, on the grass) for 4 courses, smooth_quartz cap at
 * y+4, a standing lantern on the cap at y+5. (plan.md's absolute y0 would replace the grass; the default stands on it.)
 */
export function gatePier(g, x, z, { y = 1, overwrite = false } = {})

/**
 * The garden pavilion centred on (cx, cz), per plan.md's gazebo row and R-gazebo. Octagon floor of smooth_quartz at y
 * (default 1); a smooth_quartz_stairs step on the `face` side (default north), open there; 8 quartz_pillar columns at
 * the octagon corners, y+1..y+4; birch_fence balustrade at y+1 round the rest; smooth_quartz frieze at y+5 with a
 * smooth_quartz_slab eave ring at radius 4; then three courses of deepslate_tile_stairs stepping in from radius 4 to 2
 * (solid fill inside), a chiseled_quartz_block apex at y+8 and a lightning_rod at y+9.
 */
export function gazebo(g, cx, cz, { y = 1, face = "north", overwrite = false } = {})

/**
 * The river edge from plan.md's SITE rows. Bank: sand at y0 on row zBank, sand at y-1 on zBank+1 with air above. River:
 * from zBank+2 to zEnd, air at y0, water at y-3..-1 (surface y-1), sand bed at y-4, x0..x1. Air only: carve the bank
 * and river first, or pass { overwrite: true }.
 */
export function riverBand(g, x0, x1, zBank, zEnd, { overwrite = false } = {})
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

/** A bed, both halves: foot at [x,y,z], the head one step toward facing (the pillow end), same colour and facing. */
export const bed = (g, [x, y, z], facing, color = "red") => ...

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
a **broken bed** (one half, or halves that don't match), a **floating shutter** (an open trapdoor with air behind
it), **bookshelf overuse** (more than 3 outside a library, study or office) and a **hallway to nowhere** (a hall with
one way in, or a long stretch no walk between its openings passes). The shop sockets' boxes are skipped.
Helpers that get it right: `bed(g, [x, y, z], facing, color)` (both halves), `shutter(g, [x, y, z], face, wood,
{ height })` (flat on the wall), `bannerWord(g, word, { center, face })` (letters in reading order).

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
