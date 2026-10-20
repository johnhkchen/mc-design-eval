import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw550577409";
const W = 33, H = 52, D = 22;
const ROOF = 40;          // roof about 40 blocks above the lowest ground
const CX = 16, CZ = 10;   // rooftop mast position
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;

// Footprint map: ground height per cell
const cell = new Map();
for (const [x, z, gr] of cells) {
  const g = Math.min(Math.max(0, Math.round(gr ?? 0)), 35);
  cell.set(key(x, z), { x, z, g, d: 0, top: 10 });
}
const has = (x, z) => cell.has(key(x, z));

// Inset distance from the footprint edge (boundary cells = 1)
const dist = new Map();
const queue = [];
for (const c of cell.values()) {
  if (NB.some(([dx, dz]) => !has(c.x + dx, c.z + dz))) {
    dist.set(key(c.x, c.z), 1);
    queue.push(c);
  }
}
while (queue.length) {
  const cur = queue.shift();
  const dc = dist.get(key(cur.x, cur.z));
  for (const [dx, dz] of NB) {
    const k = key(cur.x + dx, cur.z + dz);
    if (has(cur.x + dx, cur.z + dz) && !dist.has(k)) {
      dist.set(k, dc + 1);
      queue.push(cell.get(k));
    }
  }
}

// Setback tiers: podium to 10, middle tier to 25, tower top to 40
for (const c of cell.values()) {
  c.d = dist.get(key(c.x, c.z)) ?? 1;
  let T = c.d >= 6 ? ROOF : c.d >= 3 ? 25 : 10;
  T = Math.max(T, Math.min(ROOF, Math.ceil((c.g + 5) / 5) * 5));
  c.top = T;
}

// Entrance on the street (minimum z) face, nearest the centre
let minZ = Infinity;
for (const c of cell.values()) minZ = Math.min(minZ, c.z);
let DOOR_X = null, best = Infinity;
for (const c of cell.values()) {
  if (c.z === minZ && Math.abs(c.x - 16) < best) {
    best = Math.abs(c.x - 16);
    DOOR_X = c.x;
  }
}
const DOOR_Z = minZ;

function present(x, z, y) {
  const c = cell.get(key(x, z));
  return !!c && c.top > y && c.g <= y;
}
function isExt(x, z, y) {
  if (!present(x, z, y)) return false;
  return NB.some(([dx, dz]) => !present(x + dx, z + dz, y));
}
function nearExt(x, z, y) {
  return NB.some(([dx, dz]) => isExt(x + dx, z + dz, y));
}
function parapetEdge(c) {
  return NB.some(([dx, dz]) => {
    const n = cell.get(key(c.x + dx, c.z + dz));
    return !n || n.top < c.top;
  });
}

// Returns [blockId, props?] or null for air
function blockAt(c, y) {
  const { x, z, g, top } = c;

  // Foundation below ground
  if (y < g) return ["stone_bricks"];

  // Roof slab at each tier's top
  if (y === top) return ["smooth_quartz"];

  // Above the roof: parapet, rooftop plant and mast on the top tier
  if (y > top) {
    if (y === top + 1 && parapetEdge(c)) return ["smooth_quartz"];
    if (top === ROOF && c.d >= 8) {
      if (y <= 44) return ["light_gray_concrete"];
      if (x === CX && z === CZ && y <= 49) return ["lightning_rod"];
    }
    return null;
  }

  // Body of the building
  const ext = isExt(x, z, y);
  const floorLine = y === g || y % 5 === 0;

  if (!ext) {
    if (!present(x, z, y)) return null;
    if (floorLine) return ["smooth_quartz"];                 // floor slab
    if (y % 5 === 2 && nearExt(x, z, y) && (x * 7 + z * 13 + y) % 4 === 0) {
      return ["glowstone"];                                  // lamp behind glass
    }
    return null;                                             // air gap
  }

  const podium = y < 10;
  if (y === g) return ["stone_bricks"];                      // base course

  // Street entrance with canopy lantern
  if (z === DOOR_Z && x === DOOR_X && g <= 2) {
    if (y === g + 1 || y === g + 2) {
      return ["spruce_door", {
        facing: "north",
        half: y === g + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      }];
    }
    if (y === g + 3) return ["lantern", { hanging: "true", waterlogged: "false" }];
  }

  if (floorLine) return ["white_concrete"];                  // storey line

  const o = y % 5;
  if (o === 4) return [podium ? "smooth_quartz" : "light_gray_concrete"]; // spandrel

  // Window band: mullions on a 3-block grid, glazing between
  const zFace = !present(x, z - 1, y) || !present(x, z + 1, y);
  const xFace = !present(x - 1, z, y) || !present(x + 1, z, y);
  if ((zFace && x % 3 === 0) || (xFace && z % 3 === 0)) return ["white_concrete"];
  return [podium ? "glass" : "cyan_stained_glass"];
}

const out = new Voxels([W, H, D]);
for (const c of cell.values()) {
  for (let y = 0; y < H; y++) {
    const b = blockAt(c, y);
    if (!b) continue;
    if (b[1]) out.set(c.x, y, c.z, b[0], b[1]);
    else out.set(c.x, y, c.z, b[0]);
  }
}

out.save(`${DIR}/${ID}.nbt`);
