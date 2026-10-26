import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1625 Massachusetts Ave NW: a 1920s-style brick apartment block with limestone trim, five storeys at the core
// (15 blocks, the lidar roof), four on the wings (12), a stepped tower crown, a plinth, and a mechanical penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73934.cells.json`, "utf8"));

const W = 21, H = 27, D = 18;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, gr, roof]) => [key(x, z), { gr, roof }]));
const has = (x, z) => raw.has(key(x, z));
const ALL = cells.map(([x, z]) => [x, z]);
const SIDES = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const ORTHO = Object.values(SIDES);

// ---- tiers: smooth the lidar roof over 3x3 into two flat levels (wings 12, tower 15) ----
const tier = new Map();
for (const [x, z] of ALL) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = raw.get(key(x + dx, z + dz)); if (o) { s += o.roof; n++; }
  }
  tier.set(key(x, z), s / n >= 13.5 ? 15 : 12);
}
// the tower keeps its full height only in its core; its outer ring steps back to the wing level (a setback)
const isCore = (x, z) => tier.get(key(x, z)) === 15 && ORTHO.every(([dx, dz]) => has(x + dx, z + dz) && tier.get(key(x + dx, z + dz)) === 15);
const HT = new Map(ALL.map(([x, z]) => [key(x, z), isCore(x, z) ? 15 : 12]));
const height = (x, z) => (has(x, z) ? HT.get(key(x, z)) : 0);

// a voxel is shell (facade) when some side faces air: outside the footprint, or a neighbour lower than this course
function exposed(x, y, z) {
  for (const [d, [dx, dz]] of Object.entries(SIDES)) if (height(x + dx, z + dz) <= y) return d;
  return null;
}

// ---- pass 1: the facade shell (plinth, storey lines, piers, glass, cornice, entrance) ----
const ENTRANCE = { x: 6, z: 0, side: "N" };    // a pier column on the north front, mid-width
const gaps = new Set(), glow = new Set(), parapet = new Set();
const k3 = (x, y, z) => `${x},${y},${z}`;

for (const [x, z] of ALL) {
  const h = HT.get(key(x, z));
  for (let y = 0; y < h; y++) {
    const d = exposed(x, y, z); if (!d) continue;
    const along = d === "N" || d === "S" ? x : z;
    const storey = Math.floor(y / 3), row = y % 3, top = y === h - 1;
    if (x === ENTRANCE.x && z === ENTRANCE.z && d === ENTRANCE.side && (y === 1 || y === 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }           // plinth
    if (top || row === 0) { g.set(x, y, z, "calcite"); continue; }           // cornice and storey line (sill + spandrel)
    if (along % 3 === 0) { g.set(x, y, z, storey === 0 ? "stone_bricks" : "bricks"); continue; }   // piers, base in stone
    const ns = d === "N" || d === "S";
    g.set(x, y, z, "light_blue_stained_glass_pane", { north: String(!ns), south: String(!ns), east: String(ns), west: String(ns), waterlogged: "false" });
    // the room behind the glass: one air cell (or a glowstone lamp) in front of the solid floor and ceiling
    const [dx, dz] = SIDES[d], ix = x - dx, iz = z - dz;
    if (has(ix, iz) && height(ix, iz) > y && !exposed(ix, y, iz)) {
      gaps.add(k3(ix, y, iz));
      if (row === 1 && (x + z + storey) % 4 === 0) glow.add(k3(ix, y, iz));
    }
  }
  // parapet on the wing's outer edge, standing on the cornice
  if (h === 12 && ORTHO.some(([dx, dz]) => !has(x + dx, z + dz))) parapet.add(key(x, z));
}

// the entrance lobby: the air cells behind the door, under the storey line
gaps.add(k3(ENTRANCE.x, 1, ENTRANCE.z + 1)); gaps.add(k3(ENTRANCE.x, 2, ENTRANCE.z + 1));

// ---- pass 2: the solid body behind the shell, with the air gaps and lamps; the roof surface on top ----
for (const [x, z] of ALL) {
  const h = HT.get(key(x, z));
  for (let y = 0; y < h; y++) {
    if (exposed(x, y, z)) continue;
    if (gaps.has(k3(x, y, z))) continue;
    if (glow.has(k3(x, y, z))) { g.set(x, y, z, "glowstone"); continue; }
    g.set(x, y, z, y === h - 1 ? "smooth_stone" : "stone");
  }
}

// ---- the parapet: low walls on the wing edge at y 12, connected to their neighbours ----
for (const k of parapet) {
  const [x, z] = k.split(",").map(Number);
  const conn = (dx, dz) => (parapet.has(key(x + dx, z + dz)) ? "low" : "none");
  g.set(x, 12, z, "stone_brick_wall", { up: "true", north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0) });
}

// ---- the mechanical penthouse: a 3 x 3 box on the tower core, nearest its centre ----
const coreCells = ALL.filter(([x, z]) => HT.get(key(x, z)) === 15);
const mx = coreCells.reduce((s, [x]) => s + x, 0) / coreCells.length;
const mz = coreCells.reduce((s, [, z]) => s + z, 0) / coreCells.length;
let best = null;
for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) {
  let ok = true;
  for (let dx = -1; dx <= 1 && ok; dx++) for (let dz = -1; dz <= 1 && ok; dz++) ok = HT.get(key(x + dx, z + dz)) === 15;
  if (!ok) continue;
  const d2 = (x - mx) ** 2 + (z - mz) ** 2;
  if (!best || d2 < best.d2) best = { x, z, d2 };
}
if (best) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const x = best.x + dx, z = best.z + dz;
    g.set(x, 15, z, "stone_bricks"); g.set(x, 16, z, "stone_bricks");
    g.set(x, 17, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.set(best.x + dx, 18, best.z + dz, "lantern", { hanging: "false", waterlogged: "false" });
}

// ---- the entrance lobby: one air cell behind the door, with a hanging lamp under the storey line ----
g.set(ENTRANCE.x, 2, ENTRANCE.z + 1, "lantern", { hanging: "true", waterlogged: "false" });

const stats = g.save(`${DIR}/DC73934.nbt`);
console.log("wrote DC73934.nbt", stats, "gaps", gaps.size, "glow", glow.size, "parapet", parapet.size, "penthouse", best);
