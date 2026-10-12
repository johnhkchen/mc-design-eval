// PART 3: POTAGER (the walled garden: walls, gate, gravel/brick paths, the four raised beds with crops, the well at the centre).
// Ticks elements.md: E9 (garden wall), E10 (gate + pillars + lanterns), E11 (paths), E12 (raised beds), E13 (crop rows), E14 (well).
// Import from ../vocab.mjs: GARDEN, BEDS, WELL, plantedBed, well, gate, OPENINGS, isOpening, lantern, B.
//
// Garden walls stand ON the lines x=20, x=38, z=4, z=32; interior is x=21..37, z=5..31; centre of the crossing is (29,15).
// BUILD, in this order:
//  1. PATHS first (ground layer y=0, replacing grass; later parts may not overwrite them so do it all here):
//     - N-S main path: x=28..30, z=5..31: gravel, with the centre line x=29 in BRICK-style: g.set(29,0,z,"bricks") for z=5..31.
//     - E-W main path: z=14..16, x=21..37: gravel, centre line z=15 in "bricks" for x=21..37.
//     - margins: z=5 and z=25 for x=21..37 gravel; the service walk z=26 for x=21..37 gravel.
//     - the plaza x=28..30, z=14..16 all "bricks" (the well stands on it).
//     - the strip x=19 (outside the wall), z=12..18: gravel (the yard path to the gate); and the front path later in part 6.
//  2. WALLS: y=1..3 stoneFill-style rough stone using wallBlock(x,y,z) from vocab (import it), cap y=4 with B.slab("stone_brick","bottom"),
//     along the four lines above, 1 thick. Leave isOpening cells unset (the gate gap at (20,1..4,15)).
//  3. GATE: pillars of "stone_bricks" at (20,1..5,14) and (20,1..5,16); a spruce_planks beam at (20,5,15); gate(g,{x:20,y:1,z:15,face:"west"});
//     lantern(g,20,4,15,true) hanging from the beam; a standing lantern on each pillar top is NOT needed (pillar tops at y=5, put
//     lantern(g,20,6,14) and (20,6,16)).
//  4. RAISED BEDS: for each of BEDS.NW, NE, SW, SE call plantedBed(g, {...bed, rows, water, ripeness}):
//       NW: rows ["wheat","carrots","potatoes","beetroots"], water [[24,9],[24,10]], "ripe"
//       NE: rows ["beetroots","potatoes","carrots","wheat"],  water [[34,9],[34,10]], "ripe"      (mirror of NW across x=29)
//       SW: rows ["potatoes","beetroots","wheat","carrots"],  water [[24,20],[24,21]], "mixed"
//       SE: rows ["carrots","wheat","beetroots","potatoes"],  water [[34,20],[34,21]], "mixed"
//     Each bed is 6 wide, 8 long: rim at the edge (planks y=1 + bottom slab y=2), farmland y=1, crops y=2, 4 crop columns, a 1x2 water pool.
//  5. WELL: well(g,{cx:29,cz:15}) (ring, posts, chain + bucket, pyramid roof at y=5..). It occupies x=27..31, z=13..17 incl. the roof overhang
//     at y>=5: nothing else is built in that column range above y=4.
//  6. Do NOT build the arches, espaliers, greenhouse, cold frame, shed (part 4). Do not build any lamp posts (part 4).
// Check: render the front-right and back-left isos; the four beds must read as striped crop rows with a pool each, paths crossing at the well.
import { GARDEN, BEDS, WELL, plantedBed, well, gate, OPENINGS, isOpening, lantern, wallBlock, B } from "../vocab.mjs";

export function build(g) {
  // TODO(worker): implement the spec above.
}
