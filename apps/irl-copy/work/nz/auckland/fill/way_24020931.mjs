// Auckland way 24020931 (Mt Eden / Eden Terrace side of the CBD): read from the lidar record as a 1970s concrete-frame
// office block on a basalt-look plinth. The lidar's roof is level at about 30 (seven storeys of 4 blocks, the roof slab
// at y 29), with a plant-room core rising to 36 that is set back one roof cell from the edge, and lower wings where the
// lidar drops. Pale precast piers and spandrels frame blue-tinted glass bands; a cornice and a parapet cap the slab, a
// louvred plant room tops the core, and an entrance on the longest street face has a canopy and lanterns. Every cell is
// solid from y 0 up to its ground; each storey's floor slab is solid over the whole footprint, so nothing floats.
// Interiors are air behind the glass, with lanterns hanging from the ceilings in some bays.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const W = 77, H = 48, D = 83;
const cells = JSON.parse(readFileSync(`${DIR}/way_24020931.cells.json`, "utf8"));

const k2 = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;
// [outward dx, outward dz, the pane/door property name for that direction]
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const NAME = Object.fromEntries(DIRS.map(([dx, dz, n]) => [`${dx},${dz}`, n]));

// the footprint: lidar ground (third number) and roof (fourth) per cell
const R = new Map(), G = new Map();
for (const [x, z, g, r] of cells) { R.set(k2(x, z), r); G.set(k2(x, z), g); }
const inF = (x, z) => R.has(k2(x, z));
const ring = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));

// the lidar roof medianed over a 5 x 5 window: the noise goes, the tiers stay
const medianRoof = (x, z) => {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inF(x + dx, z + dz)) v.push(R.get(k2(x + dx, z + dz)));
  v.sort((a, b) => a - b); return v[v.length >> 1];
};

// depth in from the outside edge (1 = ring), by breadth-first search from the ring
const depth = new Map(), queue = [];
for (const [x, z] of cells) if (ring(x, z)) { depth.set(k2(x, z), 1); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = depth.get(k2(x, z));
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz, kk = k2(nx, nz);
    if (inF(nx, nz) && !depth.has(kk)) { depth.set(kk, d + 1); queue.push([nx, nz]); }
  }
}

// each cell's top surface (exclusive): the main slab at 30, a plant core at 36 set back from the edge, wings at 4-block storeys
const TOP = new Map(), CORE = new Set();
for (const [x, z] of cells) {
  const kk = k2(x, z), rs = medianRoof(x, z);
  if (rs >= 32 && depth.get(kk) >= 2) { TOP.set(kk, 36); CORE.add(kk); }
  else if (rs >= 26) TOP.set(kk, 30);
  else TOP.set(kk, 2 + 4 * Math.min(6, Math.max(1, Math.round((rs - 2) / 4))));
}

// floor slabs at y 1, 5, 9 ... (every storey), the roof slab at top - 1; the core's plant room has only its roof slab
const slabRows = (T) => {
  const s = new Set([T - 1]);
  for (let y = 1; y <= Math.min(T - 1, 29); y += 4) s.add(y);
  return s;
};

// the directions in which a wall at height y faces air: outside the footprint, or over a neighbour whose top is lower
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz) || y >= TOP.get(k2(x + dx, z + dz)));

// the facade block for a wall cell: piers every 4 blocks along the wall (and at corners), spandrels under the glass,
// blue panes between, a cornice band under the roof, a louvred plant room on the core
const wallBlock = (x, y, z, T, dirs) => {
  const [dx] = dirs[0];
  const along = dx !== 0 ? z : x;
  const pier = dirs.length > 1 || along % 4 === 0;
  const k = Math.floor((y - 2) / 4), r = (y - 2) - 4 * k;
  if (T === 36) {
    if (y === 34) return "smooth_stone";
    if (y === 30 || pier) return "light_gray_concrete";
    return "iron_bars";
  }
  if (y === 28) return "smooth_stone";
  if (pier) return "light_gray_concrete";
  if (k === 0 && r === 0) return "stone_bricks";
  if (r === 0) return "white_concrete";
  return "light_blue_stained_glass_pane";
};

const B = new Map();   // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => B.set(k3(x, y, z), { block, state });

// the solid: foundation, floor slabs over the whole footprint, facade walls on the exposed faces
for (const [x, z, g] of cells) {
  const kk = k2(x, z), T = TOP.get(kk), edge = ring(x, z), slabs = slabRows(T);
  for (let y = 0; y <= g; y++) put(x, y, z, "stone_bricks");
  for (let y = 1; y < T; y++) {
    if (slabs.has(y)) {
      const roof = y === T - 1;
      if (edge) put(x, y, z, y === 1 ? "stone_bricks" : roof ? "smooth_stone" : "white_concrete");
      else put(x, y, z, roof ? "stone" : "light_gray_concrete");
      continue;
    }
    const dirs = exposed(x, z, y);
    if (dirs.length) put(x, y, z, wallBlock(x, y, z, T, dirs));
  }
  if (edge && T === 30) put(x, 30, z, "stone_bricks");   // the parapet on the main slab's edge
}

// the entrance: the middle of the longest single-face run of ground-level outside walls, kept off the volume's edge
const runs = new Map();
for (const [x, z] of cells) {
  if (!ring(x, z)) continue;
  const dirs = exposed(x, z, 2);
  if (dirs.length !== 1) continue;
  const [dx, dz] = dirs[0];
  if (inF(x + dx, z + dz)) continue;
  const ok = x + 2 * dx >= 0 && z + 2 * dz >= 0 && x + 2 * dx < W && z + 2 * dz < D;
  if (!ok) continue;
  const key = `${dx},${dz}`;
  runs.set(key, [...(runs.get(key) || []), [x, z, dx, dz]]);
}
const [, faceCells] = [...runs.entries()].sort((a, b) => b[1].length - a[1].length)[0];
const alongOf = ([x, z, dx]) => (dx !== 0 ? z : x);
const meanAlong = faceCells.reduce((s, c) => s + alongOf(c), 0) / faceCells.length;
const [ex, ez, dx, dz] = faceCells.sort((a, b) => Math.abs(alongOf(a) - meanAlong) - Math.abs(alongOf(b) - meanAlong))[0];

put(ex, 2, ez, "iron_door", { facing: NAME[`${-dx},${-dz}`], half: "lower", hinge: "left", open: "false", powered: "false" });
put(ex, 3, ez, "iron_door", { facing: NAME[`${-dx},${-dz}`], half: "upper", hinge: "left", open: "false", powered: "false" });
put(ex, 4, ez, "light_blue_stained_glass_pane");   // the transom over the door

// the canopy: 3 wide, 2 out, on the first-floor line, its outer corners on posts; a lantern hangs under its middle
const perp = [Math.abs(dz), Math.abs(dx)];
for (const o of [1, 2]) for (const a of [-1, 0, 1]) {
  const px = ex + dx * o + perp[0] * a, pz = ez + dz * o + perp[1] * a;
  if (!inF(px, pz)) put(px, 5, pz, "smooth_stone");
}
for (const a of [-1, 1]) {
  const px = ex + dx * 2 + perp[0] * a, pz = ez + dz * 2 + perp[1] * a;
  for (let y = 1; y <= 4; y++) put(px, y, pz, "stone_bricks");
}
put(ex + dx, 4, ez + dz, "lantern", { hanging: "true", waterlogged: "false" });

// lanterns hanging from the ceilings behind some panes (in the air gap, under a floor slab, never on a pane's own cell)
for (const [x, z] of cells) {
  if (!ring(x, z)) continue;
  for (let k = 1; k <= 6; k++) {
    const y = 4 * k + 4;
    const pane = B.get(k3(x, y, z));
    if (!pane || !pane.block.includes("pane")) continue;
    const dirs = exposed(x, z, y);
    if (dirs.length !== 1) continue;
    const [odx, odz] = dirs[0];
    const ix = x - odx, iz = z - odz;
    if (!inF(ix, iz) || B.has(k3(ix, y, iz))) continue;
    const along = odx !== 0 ? z : x;
    if ((Math.floor(along / 4) + k) % 3 !== 0) continue;
    if (!slabRows(TOP.get(k2(ix, iz))).has(y + 1)) continue;
    put(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// two roof plant boxes on the main slab, well inside the parapet, clear of the core
const boxes = [];
for (const [x, z] of cells) {
  if (boxes.length >= 2) break;
  let ok = true;
  for (let dx = 0; dx < 4 && ok; dx++) for (let dz = 0; dz < 3 && ok; dz++) {
    const kk = k2(x + dx, z + dz);
    if (!inF(x + dx, z + dz) || TOP.get(kk) !== 30 || depth.get(kk) < 4) ok = false;
  }
  if (ok && boxes.every((b) => Math.abs(b.x - x) + Math.abs(b.z - z) > 20)) boxes.push({ x, z });
}
for (const { x, z } of boxes) for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 3; dz++) {
  put(x + dx, 30, z + dz, "light_gray_concrete");
  put(x + dx, 31, z + dz, "smooth_stone");
}

// panes and bars join their neighbours the way the game draws them: to panes, bars and solid blocks, not doors or lanterns
const PANE = /_stained_glass_pane$|^iron_bars$/;
const FULL = (b) => !/(pane|bars|lantern|door|slab|stairs|trapdoor)/.test(b);
for (const [key, v] of B) {
  if (!PANE.test(v.block)) continue;
  const [x, y, z] = key.split(",").map(Number), st = {};
  for (const [dx, dz, n] of DIRS) {
    const nb = B.get(k3(x + dx, y, z + dz));
    st[n] = nb && (PANE.test(nb.block) || FULL(nb.block)) ? "true" : "false";
  }
  v.state = st;
}

const g = new Voxels([W, H, D]);
for (const [key, v] of B) { const [x, y, z] = key.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
const out = g.save(`${DIR}/way_24020931.nbt`);

const tops = {};
for (const t of TOP.values()) tops[t] = (tops[t] || 0) + 1;
console.log(JSON.stringify({ cells: cells.length, core: CORE.size, tops, entrance: [ex, ez, dx, dz], boxes, ...out }));
