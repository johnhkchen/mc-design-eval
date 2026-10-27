// Way 293127425: a 1980s office tower. A stone podium and shopfront, then pale precast piers between blue-tinted glass
// in 4-block storeys, a flat roof with a plant room and a lightning-rod mast. Each footprint cell is a column from its
// ground (a stone foundation under it) to its lidar roof snapped to a whole storey, so the setbacks are flat tiers and
// every storey, tier and roof stands on the one below. Facades are the cells with a side open to the air (outside the
// footprint, or above a lower neighbour's roof); the rest of the floor plate is air between the floor slabs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293127425.cells.json`, "utf8"));

const W = 33, H = 89, D = 38;
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const PANE = "light_blue_stained_glass_pane", PIER = "white_concrete", SLAB = "light_gray_concrete", STONE = "stone_bricks";

// per cell: ground g, and top t (exclusive) = the lidar roof snapped to a whole storey, at least one storey above the ground
const k = (x, z) => x * D + z;
const G = new Map(), T = new Map();
for (const [x, z, ground, roof] of cells) {
  G.set(k(x, z), ground);
  T.set(k(x, z), Math.max(4 * Math.max(1, Math.round(roof / 4)), (Math.floor(ground / 4) + 1) * 4));
}
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G.has(k(x, z));
const gOf = (x, z) => G.get(k(x, z)), tOf = (x, z) => T.get(k(x, z));
// the sides of a cell at row y that open to the air: outside the footprint, or above a lower neighbour's roof
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => !inFp(x + dx, z + dz) || y >= tOf(x + dx, z + dz));

// the door: the lowest street-side cell, the tallest of those
const lexLess = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i]; return false; };
function pickDoor() {
  let best = null;
  for (const key of G.keys()) {
    const x = Math.floor(key / D), z = key % D, g = gOf(x, z), t = tOf(x, z);
    const out = DIRS.filter(([, dx, dz]) => !inFp(x + dx, z + dz));
    if (!out.length) continue;
    const score = [g, -t, z, x];
    if (!best || lexLess(score, best.score)) best = { x, z, facing: out[0][0], score };
  }
  return best;
}
const door = pickDoor();

const v = new Voxels([W, H, D]);
const panes = [], lights = [];
const doorState = (half) => ({ facing: door.facing, half, hinge: "left", open: "false", powered: "false" });

for (const key of G.keys()) {
  const x = Math.floor(key / D), z = key % D, g = gOf(x, z), t = tOf(x, z);
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone");   // foundation, down to y 0
  for (let y = g; y < t; y++) {
    if (door.x === x && door.z === z && (y === g + 1 || y === g + 2)) {
      v.set(x, y, z, "oak_door", doorState(y === g + 1 ? "lower" : "upper"));
      continue;
    }
    const sides = exposed(x, z, y), ext = sides.length > 0;
    const shop = Math.floor(y / 4) === Math.floor((g + 1) / 4);   // the first storey above the base: the shopfront
    const r = y % 4;
    let b = null;
    if (y === t - 1) b = ext ? PIER : (t <= 24 ? STONE : SLAB);      // roof cap
    else if (y === t - 2 && ext) b = "smooth_stone";                  // cornice
    else if (y === g) b = STONE;                                      // base course
    else if (r === 0) b = shop ? STONE : SLAB;                        // floor slab; spandrel on the facade
    else if (!ext) b = null;                                          // air behind the glass
    else if (shop) b = r === 3 ? STONE : PANE;                        // open shopfront, no piers
    else if (r === 3) b = SLAB;                                       // head band
    else {
      // mullions every 3 cells along the wall (corners always a pier)
      const alongNS = sides.some(([, , dz]) => dz !== 0), alongEW = sides.some(([, dx]) => dx !== 0);
      const pier = alongNS && alongEW || (alongNS ? x % 3 === 0 : z % 3 === 0);
      b = pier ? PIER : PANE;
    }
    if (!b) continue;
    v.set(x, y, z, b);
    if (b === PANE) {
      panes.push([x, y, z]);
      if (r === 1 && (x * 31 + z * 17 + y * 7) % 7 === 0) {         // warm light behind some glass
        const [, dx, dz] = sides[0], ix = x - dx, iz = z - dz;
        if (inFp(ix, iz) && y >= gOf(ix, iz) && y < tOf(ix, iz) && !exposed(ix, iz, y).length) lights.push([ix, y, iz]);
      }
    }
  }
}
for (const [x, y, z] of lights) v.set(x, y, z, "glowstone");

// depth from the outside, to find the core for the plant room
const depth = new Map();
let frontier = [];
for (const key of G.keys()) {
  const x = Math.floor(key / D), z = key % D;
  if (DIRS.some(([, dx, dz]) => !inFp(x + dx, z + dz))) { depth.set(key, 0); frontier.push(key); }
}
for (let d = 0; frontier.length; d++) {
  const next = [];
  for (const key of frontier) {
    const x = Math.floor(key / D), z = key % D;
    for (const [, dx, dz] of DIRS) {
      const nk = k(x + dx, z + dz);
      if (inFp(x + dx, z + dz) && !depth.has(nk)) { depth.set(nk, d + 1); next.push(nk); }
    }
  }
  frontier = next;
}

// roof: plant room on the core of the top tier, a lightning-rod mast on it
const top = Math.max(...T.values());
const core = [...G.keys()].filter((key) => T.get(key) === top && (depth.get(key) ?? 0) >= 3);
for (const key of core) {
  const x = Math.floor(key / D), z = key % D;
  for (let y = top; y < top + 4; y++) v.set(x, y, z, y === top + 3 ? STONE : SLAB);
}
if (core.length) {
  const deepest = core.reduce((a, b) => (depth.get(b) > depth.get(a) ? b : a));
  const mx = Math.floor(deepest / D), mz = deepest % D;
  for (let y = top + 4; y < Math.min(top + 12, H); y++) v.set(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}
// roof boxes (air conditioning) on the low podium roofs
for (const key of G.keys()) {
  const x = Math.floor(key / D), z = key % D, t = tOf(x, z);
  if (t > 24 || exposed(x, z, t - 1).length || (x * 5 + z * 3) % 7 !== 0) continue;
  v.set(x, t, z, SLAB); v.set(x, t + 1, z, SLAB);
}

// glass panes: connect to the neighbours that are solid (piers, spandrels, other panes)
const solid = (x, y, z) => v.get(x, y, z) !== null;
for (const [x, y, z] of panes) {
  const st = Object.fromEntries(DIRS.map(([name, dx, dz]) => [name, solid(x + dx, y, z + dz) ? "true" : "false"]));
  v.set(x, y, z, PANE, { ...st, waterlogged: "false" });
}

const r = v.save(`${DIR}/way_293127425.nbt`);
console.log(`way_293127425.nbt: ${r.blocks} blocks, ${r.palette} palette entries, ${G.size} cells, top ${top}, door ${door.x},${door.z} facing ${door.facing}`);
