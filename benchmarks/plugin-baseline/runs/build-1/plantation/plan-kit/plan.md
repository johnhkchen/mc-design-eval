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
