// 485 Madison Avenue (1929, commercial/office). A stepped Midtown tower of the 1916-zoning-setback era: granite base,
// buff terracotta piers with glazed bays between storey lines, a cornice at every tier top, and a stepped Deco crown.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035474.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 34, D = 27, H = 96;
const STOREY = 3;
const PANE = "light_blue_stained_glass_pane";

const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => cell.has(key(x, z));

// Lidar roofs: drop the isolated low returns (roof < 5 is noise, not a roof), take the 3x3 median of the rest,
// and round to whole storeys so every tier has a flat top on a storey line.
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const top = new Map();
for (const [x, z] of [...cell.keys()].map((k) => k.split(",").map(Number))) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = cell.get(key(x + dx, z + dz)); if (n && n.r >= 5) v.push(n.r);
  }
  const h = v.length ? median(v) : 3;
  top.set(key(x, z), Math.max(STOREY, STOREY * Math.round(h / STOREY)));
}
const R = (x, z) => top.get(key(x, z));
const G = (x, z) => cell.get(key(x, z)).g;

// Which sides of the cell at height y face air: outside the footprint, a neighbour whose tier is below y, or
// a neighbour still on its foundation at y.
const exposed = (x, z, y) => {
  const e = { w: false, e: false, n: false, s: false };
  const dirs = [[-1, 0, "w"], [1, 0, "e"], [0, -1, "n"], [0, 1, "s"]];
  for (const [dx, dz, k] of dirs) {
    const nx = x + dx, nz = z + dz;
    if (!inside(nx, nz) || R(nx, nz) <= y || G(nx, nz) > y) e[k] = true;
  }
  return e;
};
const isShell = (e) => e.w || e.e || e.n || e.s;

const b = new Voxels([W, H, D]);
const glassState = (xFace) => (xFace
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

for (const [x, z, gr] of cells) {
  const r = R(x, z);
  for (let y = 0; y < gr; y++) b.set(x, y, z, "polished_granite");          // foundation under the cell
  for (let y = gr; y < r; y++) {
    const e = exposed(x, z, y);
    if (y === r - 1) { b.set(x, y, z, isShell(e) ? "smooth_quartz" : "smooth_stone"); continue; }   // cornice / roof
    if (!isShell(e)) { if (y % STOREY === 0) b.set(x, y, z, "smooth_stone"); continue; }         // slab, air between
    const xFace = e.w || e.e;                              // the wall runs along z here
    const along = xFace ? z : x;                           // bay position along that wall
    const pier = along % STOREY === 0;
    const s = Math.floor(y / STOREY), o = y % STOREY;
    if (o === 0) b.set(x, y, z, s === 0 ? "polished_granite" : "smooth_quartz");  // base course / storey line
    else if (pier) b.set(x, y, z, s === 0 ? "polished_granite" : "white_terracotta");
    else {
      b.set(x, y, z, PANE, glassState(xFace));
      // a warm light just behind some panes, in the room air behind the glass
      const inX = e.w ? x + 1 : e.e ? x - 1 : x, inZ = xFace ? z : e.n ? z + 1 : z - 1;
      const ie = inside(inX, inZ) ? exposed(inX, inZ, y) : null;
      if (o === 1 && (x * 5 + z * 3 + s) % 7 === 0 && ie && !isShell(ie) && R(inX, inZ) > y + 1)
        b.set(inX, y, inZ, (x + z) % 2 ? "glowstone" : "shroomlight");
    }
  }
}

// Recessed entrance on the west face: a 1-wide iron door in the shopfront with granite reveals and a lintel.
const doorZ = cells.filter(([x, z, g]) => x === 0 && g <= 1 && z >= 9 && z <= 17 && z % 3 === 1)[0];
if (!doorZ) throw new Error("no door cell on the west face");
const [dx0, dz0, dg] = doorZ;
const dState = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
for (const y of [1, 2]) b.set(dx0, y, dz0, "iron_door", dState(y === 1 ? "lower" : "upper"));
for (const y of [1, 2]) { b.set(dx0, y, dz0 - 1, "polished_granite"); b.set(dx0, y, dz0 + 1, "polished_granite"); }
b.set(dx0, 3, dz0, "smooth_quartz");

// Stepped Deco crown on the tallest tier: three nested setbacks, then a pinnacle and a lantern.
const maxR = Math.max(...top.values());
const tops = [...top].filter(([, v]) => v === maxR).map(([k]) => k.split(",").map(Number));
const cx = Math.round(tops.reduce((s, [x]) => s + x, 0) / tops.length);
const cz = Math.round(tops.reduce((s, [, z]) => s + z, 0) / tops.length);
if (maxR + 11 >= H) throw new Error(`crown reaches y=${maxR + 11}, above the ${H}-block build`);
for (let k = 0; k < 3; k++) {
  const hx = 3 - k, hz = 2 - k;
  for (const [x, z] of tops) {
    if (Math.abs(x - cx) > hx || Math.abs(z - cz) > hz) continue;
    for (let o = 0; o < STOREY; o++) b.set(x, maxR + STOREY * k + o, z, o === 0 ? "smooth_quartz" : "white_terracotta");
  }
}
for (let o = 9; o <= 10; o++) b.set(cx, maxR + o, cz, "smooth_quartz");
b.set(cx, maxR + 11, cz, "lantern", { hanging: "false", waterlogged: "false" });

const stats = b.save(`${DIR}/NYC1035474.nbt`);
console.log(JSON.stringify({ footprint: cells.length, maxRoof: maxR, crown: [cx, cz], ...stats }));
