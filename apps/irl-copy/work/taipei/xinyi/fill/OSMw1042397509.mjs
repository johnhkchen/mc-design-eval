import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1042397509.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1042397509.nbt";

const W = 25, H = 23, D = 16;
const ROOF = 10;          // roof slab layer; parapet sits at ROOF + 1 (y = 11)
const SIGN = 4;           // shopfront sign band
const FLOOR2 = 5;         // upper-storey floor line

const raw = JSON.parse(readFileSync(SRC, "utf8"));
const y0 = Math.min(...raw.map(c => c[2]));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> relative ground height
const foot = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of raw) {
  foot.set(`${x},${z}`, Math.max(0, Math.min(ROOF, gr - y0)));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const inF = (x, z) => foot.has(`${x},${z}`);
const cxMid = Math.round((minX + maxX) / 2);
const czMid = Math.round((minZ + maxZ) / 2);

const outwardOf = (x, z) => {
  const o = [];
  if (!inF(x, z - 1)) o.push("north");
  if (!inF(x, z + 1)) o.push("south");
  if (!inF(x - 1, z)) o.push("west");
  if (!inF(x + 1, z)) o.push("east");
  return o;
};
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// pass 1: envelope, foundations, floors
for (const [x, z] of raw) {
  const gr = foot.get(`${x},${z}`);
  // foundation from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const outs = outwardOf(x, z);
  const perim = outs.length > 0;
  const corner = outs.length >= 2;

  if (!perim) {
    // interior: floor slabs only, air otherwise
    if (gr <= ROOF) g.set(x, gr, z, "smooth_stone");
    if (FLOOR2 > gr) g.set(x, FLOOR2, z, "smooth_stone");
    g.set(x, ROOF, z, "smooth_stone");
    continue;
  }

  const face = outs[0];
  const span = (face === "north" || face === "south") ? maxX - minX : maxZ - minZ;
  const rel = (face === "north" || face === "south") ? x - minX : z - minZ;
  const pillar = corner || rel % 3 === 0 || rel === span;
  const isDoor = outs.includes("south") && x === cxMid && z === maxZ && gr <= 2;

  for (let y = gr; y <= ROOF + 1; y++) {
    if (isDoor && y === gr) {
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isDoor && y === gr + 1) {
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    let id;
    if (y === gr) id = "polished_andesite";                          // base course
    else if (y <= 3) id = pillar ? "white_concrete" : "glass";       // shopfront glazing
    else if (y === SIGN) id = "red_concrete";                        // sign band
    else if (y === FLOOR2) id = "light_gray_concrete";               // storey line
    else if (y === 6) id = pillar ? "white_concrete" : "light_gray_concrete"; // sill
    else if (y === 7 || y === 8) id = pillar ? "white_concrete" : "glass";   // upper glazing
    else if (y === 9) id = "white_concrete";                         // lintel
    else if (y === ROOF) id = "light_gray_concrete";                 // cornice
    else id = "white_concrete";                                      // parapet
    if (y === gr && gr > 3) continue;
    g.set(x, y, z, id);
  }
}

// pass 2: warm lights behind selected glass
for (const [x, z] of raw) {
  const gr = foot.get(`${x},${z}`);
  const outs = outwardOf(x, z);
  if (outs.length !== 1) continue;
  const face = outs[0];
  const span = (face === "north" || face === "south") ? maxX - minX : maxZ - minZ;
  const rel = (face === "north" || face === "south") ? x - minX : z - minZ;
  if (rel % 3 === 0 || rel === span) continue;
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  if (!inF(ix, iz) || outwardOf(ix, iz).length) continue;
  if (rel % 6 === 2) g.set(ix, 7, iz, "glowstone");                  // upper floor
  if (rel % 6 === 4) g.set(ix, gr + 1, iz, "lantern");               // shop interior
}

// pass 3: rooftop water tank on a stand
const isInterior = (x, z) => inF(x, z) && outwardOf(x, z).length === 0;
const tx0 = cxMid - 4, tz0 = czMid - 1;
let standOk = true;
for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) {
  if (!isInterior(tx0 + dx, tz0 + dz)) standOk = false;
}
if (standOk) {
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) {
    g.set(tx0 + dx, ROOF + 1, tz0 + dz, "stone_bricks");
  }
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    g.set(tx0 + dx, ROOF + 2, tz0 + dz, "iron_block");
    g.set(tx0 + dx, ROOF + 3, tz0 + dz, "iron_block");
  }
}

g.save(OUT);
