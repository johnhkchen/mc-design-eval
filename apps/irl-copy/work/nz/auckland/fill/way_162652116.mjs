import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Ascotia Off Queen: a 1980s eleven-storey office block on Queen Street. Concrete frame, light-grey piers and white floor
// bands, tinted blue glass in between, a dark plinth and a stepped roof: three flat tiers (lidar 37 / 40 / 43 blocks)
// with a plant room on the top tier. Storey lines sit on a shared 4-block grid from y 0, so each footprint cell's
// plinth runs up to the next storey line, and the downhill (north) side shows its storeys down to the street.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162652116.cells.json", "utf8"));
const g = new Voxels([27, 56, 28]);

const at = new Map();                                    // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) at.set(x + "," + z, { ground, roof });
const near = (x, z) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].filter(([a, b]) => at.has(a + "," + b));
const inFoot = (x, z) => at.has(x + "," + z);

// Smooth the lidar roof: 3x3 median over the footprint (drops the stray edge returns), then three flat tiers.
const tierTop = new Map();                               // cap block y of each cell's roof tier
for (const [key] of at) {
  const [x, z] = key.split(",").map(Number), vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFoot(x + dx, z + dz)) vals.push(at.get((x + dx) + "," + (z + dz)).roof);
  vals.sort((p, q) => p - q);
  const s = vals[vals.length >> 1];
  tierTop.set(key, s <= 38 ? 36 : s <= 41 ? 40 : 43); // roof surfaces at 37, 41, 44 blocks above y 0
}
const topOf = (x, z) => tierTop.get(x + "," + z);
const floorUp = (ground) => 4 * Math.ceil(ground / 4); // plinth runs to the next storey line at or above the ground

// A wall face is exposed where the neighbour is outside the footprint or stands lower than this height (a setback).
const exposed = (x, z, y) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]
  .some(([a, b]) => !inFoot(a, b) || y > topOf(a, b));
const outer = (x, z) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].some(([a, b]) => !inFoot(a, b));

// The entrance: north wall, ground level, centre bay of the street run (the downhill side).
const DOOR = [16, 1];
const bayGlass = (x, z) => (Math.floor((x + z) / 3) % 2 ? "cyan_stained_glass" : "light_blue_stained_glass");

for (const [key, { ground }] of at) {
  const [x, z] = key.split(",").map(Number);
  const F = floorUp(ground), T = topOf(x, z);
  for (let y = 0; y <= T; y++) {
    if (y < F) { g.set(x, y, z, "stone_bricks"); continue; }          // plinth to the storey line
    if (y === T) { g.set(x, y, z, "gray_concrete"); continue; }       // roof membrane
    if (y === T - 1) { g.set(x, y, z, "light_gray_concrete"); continue; } // top storey ceiling beam
    if (y % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }  // floor band, every storey
    if (!exposed(x, z, y)) continue;                                  // interior: air behind the glass
    const storey = Math.floor(y / 4), row = y % 4;
    if (row === 3) {                                                  // spandrel; the entrance band is a canopy fascia
      const canopy = storey === 0 && (x === 15 || x === 16 || x === 17 || x === 18) && z === 1;
      g.set(x, y, z, canopy ? "stone_brick_slab" : storey === 0 ? "stone_bricks" : "light_gray_concrete",
        canopy ? { type: "top", waterlogged: "false" } : undefined);
      continue;
    }
    if (storey === 0 && x === DOOR[0] && z === DOOR[1]) {            // the door, lower and upper halves
      if (row === 1) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      if (row === 2) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if ((x + z) % (storey === 0 ? 6 : 3) === 0) g.set(x, y, z, "light_gray_concrete"); // pier between bays; shopfront glass is wider
    else g.set(x, y, z, bayGlass(x, z));                           // glazed bay
  }
  if (outer(x, z)) g.set(x, T + 1, z, "light_gray_concrete");       // parapet on the street edge
}

// Warm light behind some glass: glowstone on the floor of an interior bay, one block in from a lit window.
for (const [key, { ground }] of at) {
  const [x, z] = key.split(",").map(Number), F = floorUp(ground), T = topOf(x, z);
  for (let y = F + 1; y < T - 1; y++) {
    if (y % 4 !== 1 || !exposed(x, z, y) || (x + z) % 3 === 0) continue;
    if ((x * 5 + z * 3 + Math.floor(y / 4) * 7) % 8 !== 0) continue;
    for (const [a, b] of near(x, z)) {
      const Fn = floorUp(at.get(a + "," + b).ground), Tn = topOf(a, b);
      if (exposed(a, b, y) || y < Fn || y >= Tn - 1) continue;
      g.set(a, y, b, "glowstone"); break;
    }
  }
}

// Plant room on the top tier: a solid box with a glazed band near its roof, standing on the tier cap.
for (let x = 11; x <= 14; x++) for (let z = 16; z <= 18; z++) {
  if (!inFoot(x, z) || topOf(x, z) !== 43) continue;
  g.set(x, 44, z, "light_gray_concrete"); g.set(x, 45, z, outer(x, z) ? "light_blue_stained_glass" : "light_gray_concrete");
  g.set(x, 46, z, "gray_concrete");
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162652116.nbt");
console.log("saved", out);
