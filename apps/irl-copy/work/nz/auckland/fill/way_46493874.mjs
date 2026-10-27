// Skhy Tower Apartments: a 2000s concrete-framed apartment tower on a volcanic basalt base, the glass-and-precast type that
// went up on the Auckland fringe (Eden Terrace, Newton) in the boom years. The lidar roof reads as a 15-storey slab (roof 60)
// with a 16-storey core (roof 66) rising from its middle, and 4-storey wings on the west and east flanks. The roof is
// median-smoothed (7x7) and quantised to 2-block steps; each storey is 4 blocks with a floor slab on every line at a multiple
// of 4, and each column is solid from y 0 up to its roof, so every storey stands on the one below and nothing hangs.
// The facade is a 1-block skin of pale frame and blue-tinted glazing (mullions every third block, dark spandrels), a 1-block
// air gap behind the glass with warm glowstone in some bays, and a solid core. Ground floor: basalt base course, shopfront
// glazing, a dark fascia, and two doors under a pale lintel. The roof has a coping, plant boxes and a lightning-rod mast.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_46493874.cells.json", "utf8"));

const W = 69, D = 38, H = 79, N = W * D;
const idx = (x, z) => z * W + x;
const inGrid = (x, z) => x >= 0 && z >= 0 && x < W && z < D;

// a deterministic hash for the scattered details (which bays are tinted, which rooms are lit)
const hh = (...a) => { let h = 2166136261; for (const v of a) h = Math.imul(h ^ v, 16777619); return h >>> 0; };

// the palette: pale precast frame, dark spandrels, blue-tinted glass, basalt base, a light roof membrane
const FRAME = "white_concrete", SPAN = "gray_concrete", SLAB = "smooth_quartz", CORE = "light_gray_concrete";
const ROOF = "light_gray_concrete", BASE = "deepslate_bricks", FOUND = "stone_bricks";
const LIGHT = "glowstone";

const inF = new Uint8Array(N), G = new Int32Array(N), R = new Int32Array(N);
for (const [x, z, g, r] of cells) { const i = idx(x, z); inF[i] = 1; G[i] = g; R[i] = r; }
const at = (x, z) => inGrid(x, z) && inF[idx(x, z)] === 1;

// 1. The roof: a 7x7 median over footprint cells, quantised to 2-block steps, never below four blocks above its ground.
const T = new Int32Array(N);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i]) continue;
  const v = [];
  for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) if (at(x + dx, z + dz)) v.push(R[idx(x + dx, z + dz)]);
  v.sort((a, b) => a - b);
  T[i] = Math.max(2 * Math.round(v[v.length >> 1] / 2), G[i] + 4);
}
const Tmax = Math.max(...Array.from(T).filter((_, i) => inF[i]));

// 2. Depth from the outside: 1 = the facade ring, 2 = the air gap behind it, 3+ = the solid core.
const dist = new Int32Array(N).fill(-1), q = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i]) continue;
  if (!at(x - 1, z) || !at(x + 1, z) || !at(x, z - 1) || !at(x, z + 1)) { dist[i] = 1; q.push(i); }
}
for (let h = 0; h < q.length; h++) {
  const i = q[h], x = i % W, z = (i / W) | 0;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (!at(x + dx, z + dz)) continue;
    const j = idx(x + dx, z + dz);
    if (dist[j] < 0) { dist[j] = dist[i] + 1; q.push(j); }
  }
}

// The outward faces a block at (x, y, z) shows: a side with no footprint beside it, or whose roof is below y.
const SIDES = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const faces = (x, y, z) => SIDES.filter(([dx, dz]) => !at(x + dx, z + dz) || y >= T[idx(x + dx, z + dz)]);

// Storey lines: every multiple of 4 that is clear of the ground course and below the roof.
const isLine = (y, g, t) => y % 4 === 0 && y > g + 2 && y < t;

// 3. The entrances: a door on the north face and one on the west, near the middle of each face, in a glazed ground bay
// that has room for two door blocks under the fascia. Each gets a pale lintel over three bays and a warm light inside.
const doors = new Map(), canopy = new Set(), glow = new Set();
const pickDoor = (side, [dx, dz]) => {
  const cand = [];
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const i = idx(x, z); if (!inF[i] || dist[i] !== 1) continue;
    const g = G[i], f = faces(x, g + 1, z);
    if (f.length !== 1 || f[0][2] !== side) continue;
    const along = dz !== 0 ? x : z;
    cand.push({ x, z, g, along, t: T[i] });
  }
  if (!cand.length) return null;
  const mid = cand.reduce((s, c) => s + c.along, 0) / cand.length;
  cand.sort((a, b) => Math.abs(a.along - mid) - Math.abs(b.along - mid));
  for (const c of cand) {
    const fl = 4 * (Math.floor((c.g + 2) / 4) + 1), tt = fl - 1;          // the ground storey's last row (the fascia)
    if (fl >= c.t || c.g + 2 >= tt || c.along % 3 === 0) continue;         // room for two door blocks, not a mullion
    if (c.along < 2 || c.along > (dz !== 0 ? W : D) - 3) continue;
    return { ...c, tt, dx, dz, side };
  }
  return null;
};
for (const side of SIDES.slice(0, 1).concat(SIDES.slice(2, 3))) {
  const e = pickDoor(side[2], [side[0], side[1]]);
  if (!e) continue;
  const { x, z, g, tt, dx, dz } = e;
  doors.set(idx(x, z), { facing: side[2], g });
  for (const s of [-1, 0, 1]) {                                            // the lintel over the bay, three blocks wide
    const cx = dz !== 0 ? x + s : x, cz = dz !== 0 ? z : z + s;
    if (at(cx, cz)) canopy.add(idx(cx, cz));
  }
  glow.add(`${x - dx},${g + 1},${z - dz}`); glow.add(`${x - dx},${g + 2},${z - dz}`);   // the lobby light, inside the air gap
}

// 4. The mechanical plant: boxes on the tallest core, and a lightning-rod mast at its middle.
const plant = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i] || T[i] !== Tmax || dist[i] < 4) continue;
  if (x % 8 >= 3 && x % 8 <= 4 && z % 8 >= 3 && z % 8 <= 4) plant.push([x, z]);
}
let mast = null;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i] || T[i] !== Tmax || dist[i] < 4) continue;
  if (!mast || Math.hypot(x - 34, z - 19) < Math.hypot(mast[0] - 34, mast[1] - 19)) mast = [x, z];
}

const vox = new Voxels([W, H, D]);
const counts = {};
const put = (x, y, z, block, state) => { vox.set(x, y, z, block, state); counts[block] = (counts[block] || 0) + 1; };

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i]) continue;
  const g = G[i], t = T[i];

  // the foundation: solid from y 0 to the ground
  for (let y = 0; y < g; y++) put(x, y, z, FOUND);

  for (let y = g; y < t; y++) {
    const f = faces(x, y, z), ex = f.length > 0;

    // the door blocks: a lower and upper half on the entrance bays
    const d = doors.get(i);
    if (d && ex && (y === g + 1 || y === g + 2)) {
      put(x, y, z, "iron_door", { facing: d.facing, half: y === g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === g) { put(x, y, z, ex ? BASE : CORE); continue; }                    // the basalt base course
    if (isLine(y, g, t)) { put(x, y, z, ex ? SLAB : CORE); continue; }            // a floor slab, solid across
    if (y === t - 1) { put(x, y, z, ex ? SLAB : ROOF); continue; }               // the coping, or the roof membrane
    const top = isLine(y + 1, g, t);                                             // the storey's last row, a spandrel
    const tt = 4 * (Math.floor((g + 2) / 4) + 1) - 1;                            // the ground storey's fascia row
    if (ex) {
      if (y === tt && canopy.has(i)) { put(x, y, z, SLAB); continue; }            // the lintel over an entrance
      if (top) { put(x, y, z, SPAN); continue; }
      if (f.length >= 2) { put(x, y, z, FRAME); continue; }                       // a corner column
      const [dx, dz] = f[0];
      const along = dz !== 0 ? x : z;
      if (along % 3 === 0) { put(x, y, z, FRAME); continue; }                    // a mullion between bays
      // a pane, joined to its neighbours along the wall
      const glass = hh(x, y, z) % 5 === 0 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
      const sides = dz !== 0 ? { north: "false", south: "false", east: "true", west: "true" }
                             : { north: "true", south: "true", east: "false", west: "false" };
      put(x, y, z, glass, sides);
      continue;
    }
    // inside: the air gap behind the glass (lit in some bays), or the solid core
    if (dist[i] === 2 && !top && y > g) {
      if (glow.has(`${x},${y},${z}`) || hh(x, y, z) % 9 === 0) put(x, y, z, LIGHT);
      continue;
    }
    put(x, y, z, CORE);
  }

  // the plant boxes on the tallest core, and the mast's base, sit on the roof membrane
  if (plant.some(([px, pz]) => px === x && pz === z)) {
    put(x, t, z, "light_gray_concrete"); put(x, t + 1, z, "light_gray_concrete");
  }
  if (mast && mast[0] === x && mast[1] === z) {
    for (let y = t; y < t + 5; y++) put(x, y, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

const info = vox.save(DIR + "way_46493874.nbt");
console.log(`Skhy Tower Apartments: ${info.blocks} blocks, ${info.palette} palette entries, roof ${Tmax}, doors ${doors.size}`);
console.log(JSON.stringify(counts));
