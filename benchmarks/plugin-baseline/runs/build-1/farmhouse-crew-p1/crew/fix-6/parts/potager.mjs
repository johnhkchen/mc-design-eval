// PART 3: POTAGER (the walled garden: walls, gate, paths, the four raised beds with crops, the well at the centre).
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
import { GARDEN, BEDS, WELL, plantedBed, gate, OPENINGS, isOpening, lantern, wallBlock, B, roof } from "../vocab.mjs";

// The vocab well() with a plain-material roof: its roof texture picks off-palette ids (mud_brick_stairs, birch_trapdoor).
function well(g, { cx, cz, y = 1 }) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!dx && !dz) { g.set(cx, y, cz, "water", { level: "0" }); continue; }
    g.set(cx + dx, y, cz + dz, dx && dz ? "mossy_stone_bricks" : "stone_bricks");
  }
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) for (let k = 1; k <= 3; k++) g.set(cx + dx, y + k, cz + dz, ...B.log("dark_oak", "y"));
  for (const dx of [-1, 0, 1]) g.set(cx + dx, y + 3, cz, ...B.log("spruce", "x"));
  g.set(cx, y + 2, cz, ...B.chain("y")); g.set(cx, y + 1, cz, "cauldron");
  roof(g, [[cx - 1, cz - 1, cx + 1, cz + 1]], "pyramid", { y: y + 4, material: "spruce", overhang: 1, texture: false, edges: false });
  g.set(cx, y + 4, cz, "spruce_planks");   // the pyramid's centre course, so the apex has support
}

export function build(g) {
  const { x0, x1, z0, z1 } = GARDEN;

  // 1. paths (ground layer, y=0)
  for (let z = 5; z <= 31; z++) for (let x = 28; x <= 30; x++) g.set(x, 0, z, x === 29 ? "bricks" : "gravel");
  for (let x = 21; x <= 37; x++) for (let z = 14; z <= 16; z++) g.set(x, 0, z, z === 15 ? "bricks" : "gravel");
  for (let x = 21; x <= 37; x++) for (const z of [5, 25, 26]) g.set(x, 0, z, "gravel");
  for (let x = 28; x <= 30; x++) for (let z = 14; z <= 16; z++) g.set(x, 0, z, "bricks");
  for (let z = 12; z <= 18; z++) g.set(19, 0, z, "gravel");

  // 2. garden wall: rough stone y=1..3, stone-brick slab cap y=4, 1 thick, on the four lines (openings left unset)
  const wallCells = new Map();
  for (let x = x0; x <= x1; x++) { wallCells.set(`${x},${z0}`, [x, z0]); wallCells.set(`${x},${z1}`, [x, z1]); }
  for (let z = z0; z <= z1; z++) { wallCells.set(`${x0},${z}`, [x0, z]); wallCells.set(`${x1},${z}`, [x1, z]); }
  for (const [x, z] of wallCells.values()) {
    for (let y = 1; y <= 3; y++) if (!isOpening(x, y, z)) g.set(x, y, z, wallBlock(x, y, z));
    if (!isOpening(x, 4, z)) g.set(x, 4, z, ...B.slab("stone_brick", "bottom"));
  }

  // 3. gate: stone-brick pillars, spruce beam, oak gate in the gap, lanterns
  for (const pz of [14, 16]) for (let y = 1; y <= 5; y++) g.set(20, y, pz, "stone_bricks");
  g.set(20, 5, 15, "spruce_planks");
  gate(g, { x: 20, y: 1, z: 15, face: "west" });
  lantern(g, 20, 4, 15, true);
  lantern(g, 20, 6, 14);
  lantern(g, 20, 6, 16);

  // 4. raised beds
  plantedBed(g, { ...BEDS.NW, rows: ["wheat", "carrots", "potatoes", "beetroots"], water: [[24, 9], [24, 10]], ripeness: "ripe" });
  plantedBed(g, { ...BEDS.NE, rows: ["beetroots", "potatoes", "carrots", "wheat"], water: [[34, 9], [34, 10]], ripeness: "ripe" });
  plantedBed(g, { ...BEDS.SW, rows: ["potatoes", "beetroots", "wheat", "carrots"], water: [[24, 20], [24, 21]], ripeness: "mixed" });
  plantedBed(g, { ...BEDS.SE, rows: ["carrots", "wheat", "beetroots", "potatoes"], water: [[34, 20], [34, 21]], ripeness: "mixed" });

  // 5. well at the crossing
  well(g, { cx: WELL.cx, cz: WELL.cz });
}
