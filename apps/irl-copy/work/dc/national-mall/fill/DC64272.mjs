// DC64272: a mid-century (1960s) buff-brick office block with limestone trim, 10th St SW. Three storeys in the lidar's
// five-block body (plinth, shopfront, string course, two upper windows), a one-block raised parapet over the corner
// pavilions and the central band, and a two-deep limestone cornice round the perimeter. The street face is x=0 (36 long,
// with a glazed entrance); the rear face x=18 is glazed too; the two ends abut neighbours and are blank.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC64272.cells.json`, "utf8"));
const X = 19, Z = 36, Y = 8;

const ground = Array.from({ length: Z }, () => Array(X).fill(0));
const roof = Array.from({ length: Z }, () => Array(X).fill(0));
for (const [x, z, gr, r] of cells) { ground[z][x] = gr; roof[z][x] = r; }
const inFoot = (x, z) => x >= 0 && x < X && z >= 0 && z < Z && roof[z][x] > 0;

const BRICK = "bricks", STONE = "stone_bricks", LIMESTONE = "smooth_stone", ROOF = "gray_concrete";
const GLASS = "glass_pane", PLANT = "light_gray_concrete";
const SLAB = { block: "smooth_stone_slab", state: { type: "bottom", waterlogged: "false" } };

const entrance = (z) => z >= 15 && z <= 20;      // street entrance bay, x = 0
const pier = (z) => z === 0 || z === 35 || z % 3 === 0;
const ring = (x, z) => x === 0 || x === 18 || z === 0 || z === 35;
const inset = (x, z) => x <= 1 || x >= 17 || z <= 1 || z >= 34;   // the two-deep band that carries the cornice

// What a street or rear facade cell is at height y (0..4). Entrance first: doors, shopfront, lintel.
function facade(x, y, z) {
  if (y === 0) return { block: STONE };
  if (z === 15 || z === 20) return { block: LIMESTONE };
  if (x === 0 && entrance(z)) {
    if (y === 3) return { block: LIMESTONE };
    if (y === 4) return { block: GLASS };
    if (z === 17 || z === 18) {                    // double iron doors, two blocks high
      return { block: "iron_door", state: { facing: "west", half: y === 1 ? "lower" : "upper", hinge: z === 17 ? "left" : "right", open: "false", powered: "false" } };
    }
    return { block: GLASS };                       // shopfront glass either side of the doors
  }
  if (y === 2) return { block: LIMESTONE };        // string course / fascia, the full face
  if (pier(z)) return { block: BRICK };
  return { block: GLASS };                         // a window bay (upper glass sits on the fascia sill)
}

const g = new Voxels([X, Y, Z]);
const glassAt = new Set(), key = (x, y, z) => `${x},${y},${z}`;
const faceCells = [];                               // [x, y, z, block] for every facade cell, glass placed last

for (const [x, z, gr] of cells) {
  const top = roof[z][x];
  for (let y = 0; y < gr; y++) g.set(x, y, z, STONE);                     // foundation up to this cell's ground
  for (let y = gr; y < top; y++) {
    if (ring(x, z) && y < 5) {
      const f = facade(x, y, z);
      if (f.block === GLASS) glassAt.add(key(x, y, z));
      faceCells.push([x, y, z, f]);
      continue;
    }
    if (inset(x, z)) { g.set(x, y, z, BRICK); continue; }                  // the band behind the face (gaps cut later)
    if (y === top - 1) {
      // Raised tiers (roof 6) get a parapet on the rim and a membrane inside; the lidar 5 roof is a membrane.
      const rim = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inFoot(x + dx, z + dz) || roof[z + dz][x + dx] < top);
      g.set(x, y, z, top === 6 && rim ? LIMESTONE : ROOF);
      continue;
    }
    g.set(x, y, z, BRICK);
  }
  // Two-deep cornice on the roof-5 perimeter: slab lip on the outside, full block behind it.
  if (top === 5 && inset(x, z)) {
    if (ring(x, z)) g.set(x, 5, z, SLAB.block, SLAB.state);
    else g.set(x, 5, z, LIMESTONE);
  }
}

for (const [x, y, z, f] of faceCells) {
  if (f.block === GLASS) {
    // Panes join their neighbours along the face (both street and rear faces run along z).
    const n = glassAt.has(key(x, y, z - 1)), s = glassAt.has(key(x, y, z + 1));
    g.set(x, y, z, GLASS, { north: String(n), south: String(s), east: "false", west: "false", waterlogged: "false" });
  } else {
    g.set(x, y, z, f.block, f.state);
  }
}

// Air behind each window (one cell deep, sealed by the cap above and the floor slab below), the vestibule behind
// the doors, and a warm light in some of them.
const inward = (x) => (x === 0 ? 1 : 17);
for (const [x, y, z, f] of faceCells) {
  if (f.block !== GLASS || (x !== 0 && x !== 18)) continue;
  g.set(inward(x), y, z, "air");
}
for (let y = 1; y <= 2; y++) for (const z of [17, 18]) g.set(1, y, z, "air");   // vestibule
for (const [x, y, z, f] of faceCells) {
  if (f.block !== GLASS || (x !== 0 && x !== 18)) continue;
  const shop = x === 0 && entrance(z) && y <= 2;
  if (shop ? z === 16 || z === 19 : (z * 7 + y * 5) % 9 === 0) g.set(inward(x), y, z, "glowstone");
}

// Roof plant: two packaged units on the roof-5 body, standing on the membrane.
for (const [x, z] of [[6, 8], [7, 8], [6, 9], [7, 9], [12, 24], [13, 24]]) g.set(x, 5, z, PLANT);

const out = `${DIR}/DC64272.nbt`;
const info = g.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, ${info.palette} palette entries`);
