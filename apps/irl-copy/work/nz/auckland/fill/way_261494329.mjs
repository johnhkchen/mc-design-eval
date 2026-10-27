import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 261494329: a 1930s red-brick commercial block. Two storeys of brick on a stone plinth with plaster string courses
// and a parapet, flat roofs with roof plant, shopfronts on the west and north streets, and two stepped office towers
// on the east edge where the lidar rises to 15 blocks (smoothed to a 16 core over a 12 setback). Glass in every window,
// glowstone lit rooms behind some of them. Storey lines sit on 0, 4, 8, 12 across the whole footprint.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_261494329.cells.json`, "utf8"));

const PODIUM = 8, SETBACK = 12, TOP = 16;
const TOWERS = [
  { core: [111, 114, 16, 20], ring: [110, 115, 15, 21] },   // NE tower
  { core: [114, 116, 29, 35], ring: [113, 117, 28, 37] },   // E tower
];
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const inBox = (x, z, [x0, x1, z0, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
const key = (x, z) => `${x},${z}`;

// the footprint, each cell with its smoothed roof: podium 8, towers 16 (cores) and 12 (setbacks)
const fp = new Map();
for (const [x, z] of cells) {
  let roof = PODIUM;
  for (const t of TOWERS) {
    if (inBox(x, z, t.core)) roof = TOP;
    else if (inBox(x, z, t.ring)) roof = SETBACK;
  }
  fp.set(key(x, z), { roof });
}
const roofAt = (x, z) => fp.get(key(x, z))?.roof ?? -1;   // -1 = outside the footprint
// the faces of a cell at height y that look onto air: outside, or onto a neighbour with no block at that height
const exposedAt = (x, z, y) => Object.keys(DIRS).filter((f) => roofAt(x + DIRS[f][0], z + DIRS[f][1]) <= y);

const SHOP = ["W", "N"];   // the west and north faces are the street fronts
const pane = (face) =>
  face === "N" || face === "S"
    ? { north: "false", east: "true", south: "false", west: "true", waterlogged: "false" }
    : { north: "true", east: "false", south: "true", west: "false", waterlogged: "false" };
// one door per street front: west face at every 14th row, north face at every 20th column
const doorAt = (x, z, face) =>
  (face === "W" && z % 14 === 7 && roofAt(x - 1, z) < 0) || (face === "N" && x % 20 === 10 && roofAt(x, z - 1) < 0);

const g = new Voxels([118, 28, 65]);

for (const [k, { roof }] of fp) {
  const [x, z] = k.split(",").map(Number);
  g.set(x, 0, z, "stone_bricks");                                  // plinth, sits on the lowest ground
  for (let y = 1; y < roof; y++) {
    const faces = exposedAt(x, z, y);
    if (y === roof - 1) {                                          // roof: a parapet on the outer edge, flat roof inside
      const outside = faces.some((f) => roofAt(x + DIRS[f][0], z + DIRS[f][1]) < 0);
      if (outside) g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y % 4 === 0) {                                             // floor line: a plaster string course on the outside
      g.set(x, y, z, faces.length ? "smooth_quartz" : "smooth_stone");
      continue;
    }
    if (!faces.length) continue;                                   // room air, behind the walls
    const face = ["W", "N", "E", "S"].find((f) => faces.includes(f));
    const shop = y < 4 && SHOP.includes(face);
    if (shop && y === 3) { g.set(x, y, z, "dark_oak_planks"); continue; }   // shopfront fascia
    if (shop && doorAt(x, z, face) && y <= 2) {
      g.set(x, y, z, "oak_door", {
        facing: face === "W" ? "west" : "north", half: y === 1 ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (y % 4 === 3) { g.set(x, y, z, "bricks"); continue; }      // spandrel above each window band
    const u = face === "N" || face === "S" ? x : z;
    const pier = shop ? u % 6 === 0 : u % 3 === 0;
    if (pier) { g.set(x, y, z, shop ? "stone_bricks" : "bricks"); continue; }
    g.set(x, y, z, "glass_pane", pane(face));
    if ((x * 7 + z * 13 + y * 5) % 9 === 0) {                      // a lit room behind some windows
      const [ox, oz] = DIRS[face];
      const ix = x - ox, iz = z - oz;
      if (roofAt(ix, iz) > y && !exposedAt(ix, iz, y).length) g.set(ix, y, iz, "glowstone");
    }
  }
}

// roof plant: 2x2 units on the podium roof, only where the roof and its ring are flat
for (const [k, { roof }] of fp) {
  const [x, z] = k.split(",").map(Number);
  if (roof !== PODIUM || x % 13 !== 4 || z % 11 !== 5) continue;
  let flat = true;
  for (let dx = -1; dx <= 2; dx++) for (let dz = -1; dz <= 2; dz++) if (roofAt(x + dx, z + dz) !== PODIUM) flat = false;
  if (!flat) continue;
  for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) g.set(x + dx, PODIUM, z + dz, "iron_block");
}

// a stair-and-lift overrun on the NE tower roof
for (const x of [112, 113]) for (const z of [17, 18]) {
  g.set(x, TOP, z, "iron_block");
  g.set(x, TOP + 1, z, "iron_block");
}

const out = g.save(`${DIR}/way_261494329.nbt`);
console.log(`way_261494329.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
