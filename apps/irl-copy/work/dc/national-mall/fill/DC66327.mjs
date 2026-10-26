// DC66327: a 1930s Classical office block of pale limestone on a stepped plan, with a central tower over a 10-block
// podium and an 11-block wing. Roof heights come from the lidar, smoothed by a 3x3 mean and quantised to three flat
// tiers (10, 11, 12). Storey lines every 3 blocks (a solid string course, then a 2-block window band); each column is
// solid from y 0 up to its tier, so nothing floats. Perimeter walls are one block thick with an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC66327.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC66327.nbt";

// footprint: "x,z" -> lidar roof height above y 0
const roof = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const inFp = (x, z) => roof.has(`${x},${z}`);

// tiers: 3x3 mean of the lidar roof, quantised to 10 (podium), 11 (wing), 12 (tower); then a second 3x3 mean over
// those tiers so the flat roof regions are contiguous rather than a speckle of single cells
const mean3 = (src, x, z) => {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const r = src(`${x + dx},${z + dz}`); if (r !== undefined) { s += r; n++; }
  }
  return s / n;
};
const once = new Map();
for (const k of roof.keys()) {
  const [x, z] = k.split(",").map(Number), m = mean3((q) => roof.get(q), x, z);
  once.set(k, m >= 11.3 ? 12 : m >= 10.4 ? 11 : 10);
}
const tierOf = new Map();
for (const k of roof.keys()) {
  const [x, z] = k.split(",").map(Number), m = mean3((q) => once.get(q), x, z);
  tierOf.set(k, Math.round(m));
}
const H = (x, z) => tierOf.get(`${x},${z}`) ?? 0;

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the outward faces of a cell at height y: a neighbour that is off the footprint, or one whose tier is below y
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz) || H(x + dx, z + dz) <= y);

const g = new Voxels([13, 24, 11]);
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); placed.add(`${x},${y},${z}`); };
const placed = new Set();

const PLINTH = "stone_bricks", STRING = "quartz_bricks", PARAPET = "smooth_quartz", PIER = "quartz_pillar";
const GLASS = "glass", FLOOR = "stone", ROOF = "smooth_stone";

// 1. the massing: every column solid from 0 up to its tier, with the window bands, string courses and cornices
for (const k of roof.keys()) {
  const [x, z] = k.split(",").map(Number), h = H(x, z);
  for (let y = 0; y < h; y++) {
    const out = exposed(x, z, y);
    const top = y === h - 1;
    if (y === 0) {                                             // plinth / base course
      put(x, y, z, out.length ? PLINTH : FLOOR);
    } else if (y % 3 === 0 || top) {                            // storey line or roof edge: solid
      if (out.length) put(x, y, z, top ? PARAPET : STRING);
      else put(x, y, z, top ? ROOF : FLOOR);
    } else if (out.length) {                                    // window band: piers and glass
      if (out.length >= 2) put(x, y, z, PIER, { axis: "y" });   // corners
      else {
        const [dx, dz] = out[0];
        const idx = dz !== 0 ? x : z;                           // position along the wall
        if (idx % 2 === 0) put(x, y, z, PIER, { axis: "y" });
        else put(x, y, z, GLASS);
      }
    }                                                           // else: air behind the glass, between the floor slabs
  }
}

// 2. the entrance: a door on the north (z = 0) face in the pier at x = 8, with its lintel the string course above
put(8, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(8, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// 3. warm light behind some windows: a lamp in the air cell just inside the glass
let lamps = 0;
for (const k of roof.keys()) {
  const [x, z] = k.split(",").map(Number), h = H(x, z);
  for (let y = 1; y < h - 1; y++) {
    if (y % 3 === 0) continue;
    const out = exposed(x, z, y);
    if (out.length !== 1) continue;
    const [dx, dz] = out[0];
    const idx = dz !== 0 ? x : z;
    if (idx % 2 === 0) continue;                                // a pier, not glass
    const ix = x - dx, iz = z - dz;
    if (!inFp(ix, iz) || placed.has(`${ix},${y},${iz}`)) continue;
    if ((idx + Math.floor(y / 3) * 2 + (dz !== 0 ? 0 : 1)) % 5 !== 0) continue;
    put(ix, y, iz, y >= 9 ? "shroomlight" : "glowstone");
    lamps++;
  }
}

// 4. roof plant on the podium and the wing: iron boxes on the open roof, well inside the edge
let plant = 0;
for (const k of roof.keys()) {
  const [x, z] = k.split(",").map(Number), h = H(x, z);
  if (h !== 10 || (x % 3 !== 1) || (z % 3 !== 1)) continue;
  const inner = DIRS.every(([dx, dz]) => inFp(x + dx, z + dz) && H(x + dx, z + dz) >= h);
  if (!inner) continue;
  put(x, h, z, "iron_block");
  plant++;
}

const stats = g.save(OUT);
const sheet = [];
for (let z = 0; z < 11; z++) {
  let row = "";
  for (let x = 0; x < 13; x++) row += inFp(x, z) ? String(H(x, z) % 10) : ".";
  sheet.push(row);
}
console.log(`tiers (digit = tier mod 10):\n${sheet.join("\n")}`);
console.log(`lamps ${lamps}, plant ${plant}, saved`, stats);
