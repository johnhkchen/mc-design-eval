import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1930s Federal-style Neoclassical office block (the Federal Triangle idiom): granite plinth, rusticated ground
// floor, limestone upper storeys on 3-block bays with quartz pilasters, string courses and a cornice, copper-capped
// tower tiers. Lidar roof heights are smoothed and snapped to four clean tiers (8, 10, 12, 14).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC71634.cells.json`, "utf8"));

const W = 44, H = 26, D = 28;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr: Math.max(0, Math.round(gr)), roof });
const has = (x, z) => raw.has(key(x, z));
const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// ---- depth from the outside: 0 = facade shell, 1 = air gap behind it, 2+ = solid core ----
const depth = new Map();
const queue = [];
for (const k of raw.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (NB4.some(([dx, dz]) => !has(x + dx, z + dz))) { depth.set(k, 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [dx, dz] of NB4) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !depth.has(key(nx, nz))) { depth.set(key(nx, nz), d + 1); queue.push([nx, nz]); }
  }
}

// ---- roof: 3x3 mean of lidar, snapped to the nearest tier (ties go up) ----
const TIERS = [8, 10, 12, 14];
const tierOf = (v) => {
  let best = TIERS[0];
  for (const t of TIERS) {
    const dt = Math.abs(t - v), db = Math.abs(best - v);
    if (dt < db || (dt === db && t > best)) best = t;
  }
  return best;
};
const top = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const o = raw.get(key(x + dx, z + dz));
      if (o) { sum += o.roof; n++; }
    }
  const R = Math.max(tierOf(sum / n), c.gr + 4);
  top.set(k, { gr: c.gr, R });
}

// ---- palette ----
const WALL = "calcite";            // limestone upper storeys
const GROUND = "stone_bricks";     // rusticated ground floor
const PLINTH = "polished_granite"; // base course
const PILASTER = "quartz_pillar";
const STRING = "smooth_stone";     // string courses, floor slabs, lintels
const CORNICE = { block: "stone_brick_slab", state: { type: "top", waterlogged: "false" } };
const CORE = "stone_bricks";
const ROOF = "smooth_stone";
const COPPER = "oxidized_cut_copper";
const GLASS = "glass_pane";
const FOUNDATION = "stone_bricks";

// Storey lines: the ground floor sits on gr; the upper floors on these rows (3-block bays, windows on the two between).
const STOREY_LINES = [4, 7, 10, 13];
const isString = (y) => STOREY_LINES.includes(y);
const windowRow = (y, gr) => {
  const base = y < 4 ? gr : Math.max(...STOREY_LINES.filter((s) => s <= y));
  return y - base === 1 || y - base === 2;
};

// Which outward face a facade cell is on (north, south, west, east), and its position along that face.
const faceOf = (x, z) => {
  const faces = [];
  if (!has(x, z - 1)) faces.push("n");
  if (!has(x, z + 1)) faces.push("s");
  if (!has(x - 1, z)) faces.push("w");
  if (!has(x + 1, z)) faces.push("e");
  return { faces, face: faces[0] };
};
const INWARD = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };

const glassCells = [];
const litIn = [];

// ---- pass 1: foundation, columns, facades, interiors, roof ----
for (const [k, c] of top) {
  const [x, z] = k.split(",").map(Number);
  const { gr, R } = c;
  const d = depth.get(k);
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);

  if (d === 0) {
    const { faces, face } = faceOf(x, z);
    const along = face === "n" || face === "s" ? x : z;
    const corner = faces.length > 1;
    const pier = corner || along % 3 === 0;
    for (let y = gr; y < R; y++) {
      if (y === R - 1) { g.set(x, y, z, CORNICE.block, CORNICE.state); continue; }
      if (y === gr) { g.set(x, y, z, PLINTH); continue; }
      if (isString(y)) { g.set(x, y, z, STRING); continue; }
      if (pier) { g.set(x, y, z, PILASTER); continue; }
      if (windowRow(y, gr)) {
        g.set(x, y, z, GLASS, {});
        glassCells.push([x, y, z]);
        if ((along * 7 + y * 3) % 7 === 0) litIn.push([x, y, z, face]);
        continue;
      }
      g.set(x, y, z, y < 4 ? GROUND : WALL);
    }
  } else {
    for (let y = gr; y < R; y++) {
      if (y === R - 1) {
        g.set(x, y, z, R >= 14 ? COPPER : ROOF);
      } else if (d >= 2) {
        g.set(x, y, z, CORE);
      } else if (y === gr || isString(y)) {
        g.set(x, y, z, STRING);
      }
    }
  }
}

// ---- pass 2: lit windows, with a glowstone in the air gap behind the glass ----
for (const [x, y, z, face] of litIn) {
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  if (has(ix, iz) && depth.get(key(ix, iz)) === 1) g.set(ix, y, iz, "glowstone");
}

// ---- pass 3: the entrance, on the longest run of the north face, inside the ground floor ----
{
  const runs = [];
  for (const [k, c] of top) {
    const [x, z] = k.split(",").map(Number);
    if (!has(x, z - 1) && has(x, z + 1) && depth.get(k) === 0) runs.push({ x, z, gr: c.gr });
  }
  // longest contiguous run along one row
  let best = null;
  const seen = new Set();
  for (const r of runs) {
    const kk = key(r.x, r.z);
    if (seen.has(kk)) continue;
    let a = r.x, b = r.x;
    while (runs.some((q) => q.x === a - 1 && q.z === r.z)) a--;
    while (runs.some((q) => q.x === b + 1 && q.z === r.z)) b++;
    for (let x = a; x <= b; x++) seen.add(key(x, r.z));
    const len = b - a + 1;
    if (!best || len > best.len) best = { a, b, z: r.z, len, gr: r.gr };
  }
  const ex = Math.floor((best.a + best.b) / 2), ez = best.z, gr = best.gr;
  // pilasters flanking the doorway
  for (const x of [ex - 1, ex + 1]) {
    for (let y = gr + 1; y <= gr + 2; y++) if (has(x, ez)) g.set(x, y, ez, PILASTER);
  }
  // doorway: iron doors, two tall, on the plinth
  const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(ex, gr + 1, ez, "iron_door", { ...door, half: "lower" });
  g.set(ex, gr + 2, ez, "iron_door", { ...door, half: "upper" });
  // lintel carrying the storey line
  for (let x = ex - 2; x <= ex + 2; x++) if (has(x, ez)) g.set(x, gr + 3, ez, STRING);
  // a lantern standing in the air gap just inside the doors
  if (depth.get(key(ex, ez + 1)) === 1) g.set(ex, gr + 1, ez + 1, "lantern", { hanging: "false" });
}

// ---- pass 4: roof equipment on the mid tiers (AC plant boxes, away from the edges) ----
for (const [k, c] of top) {
  const [x, z] = k.split(",").map(Number);
  if (depth.get(k) < 2 || c.R >= 14) continue;
  if ((x * 5 + z * 11) % 23 !== 0) continue;
  g.set(x, c.R, z, "iron_block");
}

// ---- pass 5: panes join their neighbours (glass or any solid block), so each reads as a window line ----
const PASS_NO_CONNECT = /(slab|stairs|door|lantern|air)/;
for (const [x, y, z] of glassCells) {
  const link = (nx, ny, nz) => {
    const nb = g.get(nx, ny, nz);
    if (!nb) return "false";
    if (nb.block.endsWith("glass_pane")) return "true";
    return PASS_NO_CONNECT.test(nb.block) ? "false" : "true";
  };
  g.set(x, y, z, GLASS, {
    north: link(x, y, z - 1), south: link(x, y, z + 1),
    east: link(x + 1, y, z), west: link(x - 1, y, z), waterlogged: "false",
  });
}

g.save(`${DIR}/DC71634.nbt`);
