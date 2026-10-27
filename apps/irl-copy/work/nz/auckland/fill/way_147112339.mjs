// Britomart Car Park: a concrete deck car park on a stone base, its street faces open ribbon bays of grey glass, the
// ground storey a shopfront with doors. The footprint is the lidar's cells; the roof is snapped to 4-block storeys and
// smoothed by a majority over 5x5 so the tiers are flat, with a lift plant room and light poles on the top tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_147112339.cells.json`, "utf8"));

const W = 151, D = 92, H = 28;
const g = new Voxels([W, H, D]);

const key = (x, z) => x * 1000 + z;
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(key(x, z), { ground, roof });
const inFp = (x, z) => fp.has(key(x, z));

// roof tiers: lidar roof snapped to whole 4-block storeys (lowest tier 8), then a 5x5 majority so the tiers are flat
const snap = (r) => Math.max(8, 4 * Math.round(r / 4));
const raw = new Map();
for (const [k, c] of fp) raw.set(k, snap(c.roof));
const tierMap = new Map();
for (const [x, z] of cells) {
  const own = raw.get(key(x, z));
  const votes = new Map();
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const k = key(x + dx, z + dz); if (!raw.has(k)) continue;
    const t = raw.get(k); votes.set(t, (votes.get(t) || 0) + 1);
  }
  let best = own, n = votes.get(own) || 0;
  for (const [t, v] of votes) if (v > n) { best = t; n = v; }
  tierMap.set(key(x, z), best);
}
const T = (x, z) => tierMap.get(key(x, z));

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const FACING = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };
// the exposed direction of a cell: a side on the footprint's edge, or a side that steps down to a lower tier; null if core
function outward(x, z) {
  for (const [dx, dz] of DIRS) if (!inFp(x + dx, z + dz)) return [dx, dz];
  const t = T(x, z);
  for (const [dx, dz] of DIRS) if (T(x + dx, z + dz) < t) return [dx, dz];
  return null;
}
const isPillar = (x, z) => x % 6 === 0 && z % 6 === 0;

const extra = new Map();      // "x,y,z" -> [block, state]: lights, doors and hoods, written last
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const addExtra = (x, y, z, block, state) => extra.set(`${x},${y},${z}`, [block, state]);

const paneState = (dx, dz) => (dz !== 0
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

function facade(x, y, z, [dx, dz], t) {
  const i = dx !== 0 ? z : x;
  const s = Math.floor((y - 4) / 4);
  const r = y % 4;
  if (s === 0) {                                           // ground storey: shopfront, doors, base of the bays
    if (i % 48 === 21) {
      const facing = FACING[`${dx},${dz}`];
      const half = y === 5 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
      if (y === 5) addExtra(x, 7, z, "stone_brick_stairs", { facing, half: "top", shape: "straight", waterlogged: "false" });
      return;
    }
    if (i % 6 === 0) return put(x, y, z, "light_gray_concrete");
    put(x, y, z, "glass_pane", paneState(dx, dz));
    if (y === 5 && i % 12 === 9) addExtra(x - dx, y, z - dz, "glowstone");
    return;
  }
  if (i % 6 === 0) return put(x, y, z, "light_gray_concrete");   // piers between the bays
  put(x, y, z, "light_gray_stained_glass_pane", paneState(dx, dz));
  if (r === 1 && ((s % 2 === 0 && i % 12 === 9) || (s % 2 === 1 && i % 12 === 3))) addExtra(x - dx, y, z - dz, "glowstone");
}

for (const [x, z] of cells) {
  const t = T(x, z);
  const o = outward(x, z);
  for (let y = 0; y < 4; y++) put(x, y, z, "stone_bricks");        // base course on the foundation, over every ground
  for (let y = 4; y < t; y++) {
    if (y === t - 1) { put(x, y, z, o ? "stone_bricks" : "stone"); continue; }   // parapet and roof deck
    const r = y % 4;
    if (r === 0) { put(x, y, z, "white_concrete"); continue; }                           // floor slab, every storey
    if (!o) { if (isPillar(x, z)) put(x, y, z, "light_gray_concrete"); continue; }        // core: columns on the bay grid
    if (r === 3) { put(x, y, z, "white_concrete"); continue; }                           // spandrel under each band
    facade(x, y, z, o, t);
  }
}

// lights and entrance parts go in after the solids, so they override what the storey pass laid down
for (const [k, [block, state]] of extra) { const [x, y, z] = k.split(",").map(Number); put(x, y, z, block, state); }

// the lift plant room and light poles on the top tier
const top = cells.filter(([x, z]) => T(x, z) === 20);
const mx = top.reduce((a, [x]) => a + x, 0) / top.length, mz = top.reduce((a, [, z]) => a + z, 0) / top.length;
const clear5 = (x, z) => { for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (!inFp(x + dx, z + dz) || T(x + dx, z + dz) !== 20) return false; return true; };
const box = top.map(([x, z]) => [Math.hypot(x - mx, z - mz), x, z]).sort((a, b) => a[0] - b[0]).find(([, x, z]) => clear5(x, z));
const inBox = (x, z) => box && Math.abs(x - box[1]) <= 2 && Math.abs(z - box[2]) <= 2;
if (box) {
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    for (let y = 20; y <= 22; y++) put(box[1] + dx, y, box[2] + dz, "light_gray_concrete");
    put(box[1] + dx, 23, box[2] + dz, "stone_bricks");
  }
}
for (const [x, z] of top) {
  if (outward(x, z) || inBox(x, z) || x % 20 !== 10 || z % 20 !== 10) continue;
  for (let y = 20; y <= 22; y++) put(x, y, z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  put(x, 23, z, "lantern", { hanging: "false" });
}

g.save(`${DIR}/way_147112339.nbt`);
console.log("blocks", g.count(), "palette", g.palette.length - 1);
