import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588117324";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 1990s Taipei mid-rise office block: off-white tiled cladding, white piers,
// light-grey spandrels, blue-tinted glazing, a street-level shopfront with
// a central entrance, and a rooftop plant penthouse.
const W = 25, H = 34, D = 50;
const STOREYS = 4;      // 4 x 5 blocks = 20, plus 2 blocks of parapet = 22

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pass 1: foundations, floor slabs, roof slab.
for (const [x, z, o] of cells) {
  for (let y = 0; y < o; y++) put(x, y, z, "stone");
  for (let s = 0; s < STOREYS; s++) put(x, o + 5 * s, z, "smooth_quartz");
  put(x, o + 5 * STOREYS, z, "light_gray_concrete"); // roof slab at +20
}

// Pass 2: facade on perimeter cells.
const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const inwardOf = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

for (const [x, z, o] of cells) {
  const out = [];
  if (!has(x, z - 1)) out.push("north");
  if (!has(x, z + 1)) out.push("south");
  if (!has(x - 1, z)) out.push("west");
  if (!has(x + 1, z)) out.push("east");
  if (out.length === 0) continue;

  const face = out[0];
  const ns = face === "north" || face === "south";
  const along = ns ? x : z;
  const corner = out.length >= 2;
  const pier = corner || along % 3 === 0;
  const [ix, iz] = inwardOf[face];

  for (let r = 0; r <= 22; r++) {
    const y = o + r;
    if (r >= 21) {
      put(x, y, z, r === 22 ? "light_gray_concrete" : "smooth_quartz"); // parapet + cap
      continue;
    }
    if (r === 20) { put(x, y, z, "light_gray_concrete"); continue; }   // cornice
    const s = Math.floor(r / 5);
    const q = r % 5;
    if (q === 0) {
      put(x, y, z, r === 0 ? "stone_bricks" : "light_gray_concrete");   // base course / storey line
      continue;
    }
    if (q === 4) { put(x, y, z, "light_gray_concrete"); continue; }     // spandrel
    // q = 1..3: window band
    if (pier) {
      put(x, y, z, "white_concrete");
    } else if (s === 0) {
      put(x, y, z, "light_blue_stained_glass");                         // shopfront
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", ns ? paneNS : paneEW);
    }
    // warm light behind some glass (interior cell, which is air)
    if (!pier && q === 2 && (along + s) % 4 === 0 && has(x + ix, z + iz)) {
      put(x + ix, y, z + iz, "glowstone");
    }
  }
}

// Pass 3: central entrance on the north (minZ) street face, canopy and lantern.
const northRow = cells.filter(([, z]) => z === minZ).map(([x]) => x);
const nMin = Math.min(...northRow), nMax = Math.max(...northRow);
const xc = Math.floor((nMin + nMax) / 2);
const zN = minZ;
if (has(xc, zN)) {
  const o = gnd(xc, zN);
  put(xc, o + 1, zN, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(xc, o + 2, zN, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let x = xc - 2; x <= xc + 2; x++) {
    for (let z = zN; z <= zN + 1; z++) {
      if (has(x, z)) put(x, o + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  if (has(xc, zN + 1)) {
    put(xc, o + 3, zN + 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Pass 4: rooftop plant penthouse, set back from the street and the sides.
for (let x = minX + 4; x <= maxX - 4; x++) {
  for (let z = minZ + 6; z <= maxZ - 6; z++) {
    if (!has(x, z)) continue;
    const o = gnd(x, z);
    const edge = x === minX + 4 || x === maxX - 4 || z === minZ + 6 || z === maxZ - 6;
    if (edge) {
      for (let y = o + 21; y <= o + 23; y++) put(x, y, z, "white_concrete");
      if ((x + z) % 3 !== 0) {
        put(x, o + 22, z, "light_blue_stained_glass");
      }
    }
    put(x, o + 24, z, "light_gray_concrete"); // cap
  }
}

// Foundations stay under the penthouse cells too, since they stand on the roof slab.
g.save(`${DIR}/${ID}.nbt`);
