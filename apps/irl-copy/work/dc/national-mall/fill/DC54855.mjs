import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC54855";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 31, D = 18;
const MAX_TOP = 26;
const g = new Voxels([W, H, D]);

// 1970s Connecticut Avenue office block: pale precast spandrels,
// tinted glazing, stone base and cornice.
const FOUND = "stone_bricks";
const BASE = "smooth_stone";
const SPAND = "light_gray_concrete";
const CORE = "light_gray_concrete";
const MULL = "white_concrete";
const GLASS = "light_blue_stained_glass";
const PARA = "white_concrete";
const CORN = "smooth_stone";
const MECH = "stone_bricks";
const MECH_GLASS = "light_blue_stained_glass";

const key = (x, z) => `${x},${z}`;
const M = new Map();
for (const [x, z, gr, ro] of cells) {
  M.set(key(x, z), { x, z, gr: Math.round(gr), ro: Math.round(ro) });
}
const has = (x, z) => M.has(key(x, z));

// Wider median smoothing (5x5) so lidar noise becomes clean tiers.
function smoothRoof(c) {
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const n = M.get(key(c.x + dx, c.z + dz));
    if (n) vals.push(n.ro);
  }
  vals.sort((a, b) => a - b);
  return vals[Math.floor(vals.length / 2)];
}

// Distance from the perimeter (0 = outer shell).
const dist = new Map();
const queue = [];
for (const c of M.values()) {
  const edge = !has(c.x + 1, c.z) || !has(c.x - 1, c.z) || !has(c.x, c.z + 1) || !has(c.x, c.z - 1);
  if (edge) { dist.set(key(c.x, c.z), 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d0 = dist.get(key(c.x, c.z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const k = key(c.x + dx, c.z + dz);
    if (M.has(k) && !dist.has(k)) {
      dist.set(k, d0 + 1);
      queue.push(M.get(k));
    }
  }
}

// Resolve tops: whole storeys (2 blocks) above each cell's own ground.
const info = new Map();
for (const c of M.values()) {
  const ro = smoothRoof(c);
  let n = Math.max(1, Math.round((ro - c.gr) / 2));
  n = Math.min(n, Math.floor((MAX_TOP - c.gr) / 2));
  const top = c.gr + 2 * n;
  info.set(key(c.x, c.z), { ...c, top, n, d: dist.get(key(c.x, c.z)) ?? 0 });
}

// Entrance bay on the north face (z = 0), centred.
const ENTRY_X = [7, 8, 9, 10];
const DOOR_X = 8;

for (const c of info.values()) {
  const { x, z, gr, top, d } = c;
  const onN = !has(x, z - 1), onS = !has(x, z + 1), onW = !has(x - 1, z), onE = !has(x + 1, z);
  const corner = (onN || onS) && (onW || onE);
  const isEntryFace = onN && ENTRY_X.includes(x);

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  for (let y = gr; y < top; y++) {
    const o = y - gr;
    const isTopCourse = y === top - 1;

    // Base course on the outer shell.
    if (o === 0) {
      g.set(x, y, z, d === 0 ? BASE : CORE);
      continue;
    }

    // Cornice band over the shell; roof slab over the interior.
    if (isTopCourse) {
      g.set(x, y, z, d === 0 ? CORN : CORE);
      continue;
    }

    if (d === 0) {
      // Entrance: door, lobby glass, mullions and a canopy band.
      if (isEntryFace && o <= 3) {
        if (x === DOOR_X && o === 1) {
          g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (x === DOOR_X && o === 2) {
          g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (o === 3) { g.set(x, y, z, CORN); continue; }     // canopy band
        if (x === ENTRY_X[0] || x === ENTRY_X[ENTRY_X.length - 1]) {
          g.set(x, y, z, MULL);
          continue;
        }
        if (o === 1) { g.set(x, y, z, GLASS); continue; }
      }

      if (o % 2 === 0) {
        g.set(x, y, z, SPAND);
      } else {
        // Window row with mullions every third bay.
        let idx = 0;
        if (corner) idx = -1;
        else if (onN || onS) idx = x;
        else idx = z;
        const mull = corner || idx % 3 === 0;
        g.set(x, y, z, mull ? MULL : GLASS);
      }
    } else if (d === 1) {
      // Air gap behind the glass; floor slab on even offsets.
      if (o % 2 === 0) {
        g.set(x, y, z, CORE);
      } else if ((x + z + o) % 4 === 0) {
        g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      }
    } else {
      g.set(x, y, z, CORE);
    }
  }

  // Two-block parapet on the outer shell.
  if (d === 0) {
    g.set(x, top, z, PARA);
    g.set(x, top + 1, z, CORN);
  }
}

// Rooftop mechanical penthouse: a stone box with a glazed band, sitting on
// each column's own roof slab so nothing floats.
for (const c of info.values()) {
  if (c.d >= 3 && c.x >= 5 && c.x <= 12 && c.z >= 5 && c.z <= 12) {
    const edge = c.d === 3 || c.x === 5 || c.x === 12 || c.z === 5 || c.z === 12;
    g.set(c.x, c.top, c.z, MECH);
    g.set(c.x, c.top + 1, c.z, edge ? MECH : MECH_GLASS);
    if (edge) g.set(c.x, c.top + 2, c.z, MECH);
  }
}

g.save(`${DIR}/${ID}.nbt`);
