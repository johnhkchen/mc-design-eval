import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1341343913";
const cells = JSON.parse(readFileSync(`${BASE}.cells.json`, "utf8"));

// Footprint 53 x 41; two storeys of 5 blocks, flat roof ~11 blocks above lowest ground.
const W = 53, D = 41, H = 23;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const L = Math.min(...cells.map((c) => c[2]));          // lowest ground = datum for storey lines

const DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
const outDirs = (x, z) =>
  Object.entries(DIRS).filter(([, [dx, dz]]) => !inFp(x + dx, z + dz)).map(([k]) => k);
const deep = (x, z) => {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (!inFp(x + dx, z + dz)) return false;
  return true;
};

// Storey plan (absolute y, datum L):
//  L .. L+4   ground storey (shopfront glazing L+1..L+3, lintel band L+4)
//  L+5        floor line / cornice course
//  L+6 .. L+8 upper storey glazing, L+9 spandrel
//  L+10       roof deck / parapet top, L+11 parapet cap (roof surface ~11)
const Y_LINTEL = L + 4, Y_FLOOR = L + 5, Y_SPAND = L + 9, Y_TOP = L + 10, Y_CAP = L + 11;
const GF = [L + 1, L + 3], UF = [L + 6, L + 8];

const paneFor = (od, color) => {
  const alongX = od.includes("n") || od.includes("s");
  return [`${color}_stained_glass_pane`, alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];
};

// Front door: outward-north face, the cell nearest the middle of the lowest-z run.
const northFace = cells.filter(([x, z]) => { const od = outDirs(x, z); return od.length === 1 && od[0] === "n"; });
let doorCell = null;
if (northFace.length) {
  const minZ = Math.min(...northFace.map((c) => c[1]));
  const row = northFace.filter((c) => c[1] === minZ);
  const midX = row.reduce((s, c) => s + c[0], 0) / row.length;
  doorCell = row.reduce((best, c) => (Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best));
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const od = outDirs(x, z);
  const exterior = od.length > 0;
  const corner = od.length > 1;
  const alongX = od.includes("n") || od.includes("s");
  const along = alongX ? x : z;
  const pillar = corner || along % 4 === 0;

  if (!exterior) {
    // Interior: floor slabs per storey, air between, roof deck on top.
    if (gr <= W) g.set(x, gr, z, "smooth_stone");
    if (Y_FLOOR > gr) g.set(x, Y_FLOOR, z, "smooth_stone");
    if (Y_TOP > gr) g.set(x, Y_TOP, z, "light_gray_concrete");
    continue;
  }

  // Exterior shell from the cell's ground up to the roof deck.
  for (let y = gr; y <= Y_TOP; y++) {
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }                  // plinth
    if (y === Y_TOP) { g.set(x, y, z, "smooth_quartz"); continue; }             // parapet top
    if (y === Y_LINTEL || y === Y_FLOOR) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (y === Y_SPAND) { g.set(x, y, z, "light_gray_concrete"); continue; }
    const inGF = y >= GF[0] && y <= GF[1];
    const inUF = y >= UF[0] && y <= UF[1];
    if (inGF || inUF) {
      if (pillar) { g.set(x, y, z, "light_gray_concrete"); continue; }
      const [id, p] = paneFor(od, inGF ? "light_blue" : "cyan");
      g.set(x, y, z, id, p);
      continue;
    }
    g.set(x, y, z, "white_concrete");
  }

  // Parapet cap.
  g.set(x, Y_CAP, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

  // Warm light behind some panes (inside the air gap).
  const [odx, odz] = DIRS[od[0]];
  const ix = x - odx, iz = z - odz;
  if (!pillar && inFp(ix, iz)) {
    if (along % 8 === 6) g.set(ix, GF[0] + 1, iz, "shroomlight");
    if (along % 8 === 2) g.set(ix, UF[0] + 1, iz, "glowstone");
  }
}

// Entrance door on the front (north) face, with a lintel above.
if (doorCell) {
  const [dx, dz] = doorCell;
  const yB = gnd(dx, dz) + 1;
  const dp = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(dx, yB, dz, "oak_door", { ...dp, half: "lower" });
  g.set(dx, yB + 1, dz, "oak_door", { ...dp, half: "upper" });
  g.set(dx, Y_LINTEL, dz, "smooth_quartz");
}

// Roof plant: 2x2 HVAC units on deep roof cells, and a stair/lift housing with a rod.
const HB = { x0: 22, x1: 28, z0: 16, z1: 22 };
let housingOk = true;
for (let x = HB.x0; x <= HB.x1 && housingOk; x++)
  for (let z = HB.z0; z <= HB.z1; z++) if (!inFp(x, z) || !deep(x, z)) { housingOk = false; break; }

for (const [x, z] of cells) {
  if (!deep(x, z)) continue;
  const inHousing = housingOk && x >= HB.x0 && x <= HB.x1 && z >= HB.z0 && z <= HB.z1;
  if (inHousing) continue;
  if (x % 10 >= 3 && x % 10 <= 4 && z % 9 >= 3 && z % 9 <= 4) {
    g.set(x, Y_CAP, z, "light_gray_concrete");
    g.set(x, Y_CAP + 1, z, "light_gray_concrete");
  }
}

if (housingOk) {
  for (let x = HB.x0; x <= HB.x1; x++)
    for (let z = HB.z0; z <= HB.z1; z++) {
      const edge = x === HB.x0 || x === HB.x1 || z === HB.z0 || z === HB.z1;
      for (let y = Y_CAP; y <= Y_CAP + 2; y++) if (edge) g.set(x, y, z, "white_concrete");
      g.set(x, Y_CAP + 3, z, "smooth_quartz");
    }
  g.set(25, Y_CAP + 4, 19, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${BASE}.nbt`);
