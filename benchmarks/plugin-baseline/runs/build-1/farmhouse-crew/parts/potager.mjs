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
import { GARDEN, BEDS, WELL, BRICK, TRIM, plantedBed, well, gate, OPENINGS, isOpening, lantern, wallBlock, B, stoneFill } from "../vocab.mjs";

export function build(g) {
  // 1. PATHS (y=0, ground layer)
  // N-S main path: x=28..30, z=5..31 gravel with centre line x=29 in bricks
  for (let z = GARDEN.z0; z <= GARDEN.z1; z++) {
    for (let x = 28; x <= 30; x++) {
      g.set(x, 0, z, x === 29 ? BRICK : "gravel");
    }
  }

  // E-W main path: z=14..16, x=21..37 gravel with centre line z=15 in bricks
  for (let x = 21; x <= 37; x++) {
    for (let z = 14; z <= 16; z++) {
      g.set(x, 0, z, z === 15 ? BRICK : "gravel");
    }
  }

  // Margins: z=5 and z=25 gravel
  for (let x = 21; x <= 37; x++) {
    g.set(x, 0, 5, "gravel");
    g.set(x, 0, 25, "gravel");
  }

  // Service walk: z=26 gravel
  for (let x = 21; x <= 37; x++) {
    g.set(x, 0, 26, "gravel");
  }

  // Plaza: x=28..30, z=14..16 all bricks
  for (let x = 28; x <= 30; x++) {
    for (let z = 14; z <= 16; z++) {
      g.set(x, 0, z, BRICK);
    }
  }

  // Yard strip: x=19, z=12..18 gravel
  for (let z = 12; z <= 18; z++) {
    g.set(19, 0, z, "gravel");
  }

  // 2. WALLS: y=1..3 rough stone, cap y=4 with stone_brick slab
  // West wall (x=20)
  for (let y = 1; y <= 3; y++) {
    for (let z = GARDEN.z0; z <= GARDEN.z1; z++) {
      if (!isOpening(20, y, z)) g.set(20, y, z, wallBlock(20, y, z));
    }
  }
  for (let z = GARDEN.z0; z <= GARDEN.z1; z++) {
    if (!isOpening(20, 4, z)) g.set(20, 4, z, ...B.slab("stone_brick", "bottom"));
  }

  // East wall (x=38)
  for (let y = 1; y <= 3; y++) {
    for (let z = GARDEN.z0; z <= GARDEN.z1; z++) {
      if (!isOpening(38, y, z)) g.set(38, y, z, wallBlock(38, y, z));
    }
  }
  for (let z = GARDEN.z0; z <= GARDEN.z1; z++) {
    if (!isOpening(38, 4, z)) g.set(38, 4, z, ...B.slab("stone_brick", "bottom"));
  }

  // North wall (z=4)
  for (let y = 1; y <= 3; y++) {
    for (let x = 20; x <= 38; x++) {
      if (!isOpening(x, y, 4)) g.set(x, y, 4, wallBlock(x, y, 4));
    }
  }
  for (let x = 20; x <= 38; x++) {
    if (!isOpening(x, 4, 4)) g.set(x, 4, 4, ...B.slab("stone_brick", "bottom"));
  }

  // South wall (z=32)
  for (let y = 1; y <= 3; y++) {
    for (let x = 20; x <= 38; x++) {
      if (!isOpening(x, y, 32)) g.set(x, y, 32, wallBlock(x, y, 32));
    }
  }
  for (let x = 20; x <= 38; x++) {
    if (!isOpening(x, 4, 32)) g.set(x, 4, 32, ...B.slab("stone_brick", "bottom"));
  }

  // 3. GATE: pillars, beam, gate, lanterns
  // Pillars at (20,1..5,14) and (20,1..5,16) in stone_bricks
  for (let y = 1; y <= 5; y++) {
    g.set(20, y, 14, TRIM);
    g.set(20, y, 16, TRIM);
  }

  // Spruce beam at (20,5,15)
  g.set(20, 5, 15, "spruce_planks");

  // Gate at (20,1,15)
  gate(g, { x: 20, y: 1, z: 15, face: "west" });

  // Hanging lantern from beam
  lantern(g, 20, 4, 15, true);

  // Standing lanterns on pillar tops
  lantern(g, 20, 6, 14, false);
  lantern(g, 20, 6, 16, false);

  // 4. RAISED BEDS with crops
  plantedBed(g, {
    ...BEDS.NW,
    rows: ["wheat", "carrots", "potatoes", "beetroots"],
    axis: "z",
    water: [[24, 9], [24, 10]],
    ripeness: "ripe"
  });

  plantedBed(g, {
    ...BEDS.NE,
    rows: ["beetroots", "potatoes", "carrots", "wheat"],
    axis: "z",
    water: [[34, 9], [34, 10]],
    ripeness: "ripe"
  });

  plantedBed(g, {
    ...BEDS.SW,
    rows: ["potatoes", "beetroots", "wheat", "carrots"],
    axis: "z",
    water: [[24, 20], [24, 21]],
    ripeness: "mixed"
  });

  plantedBed(g, {
    ...BEDS.SE,
    rows: ["carrots", "wheat", "beetroots", "potatoes"],
    axis: "z",
    water: [[34, 20], [34, 21]],
    ripeness: "mixed"
  });

  // 5. WELL at centre
  well(g, { cx: WELL.cx, cz: WELL.cz });
}
