import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499475";
const W = 16, H = 26, D = 41;
const DOOR_X = 7;

// ---- load footprint: [x, z, ground, roof] per cell ----
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? raw.footprint ?? []);

const key = (x, z) => `${x},${z}`;
const cells = new Map();
for (const c of list) {
  const [x, z, g, L] = c;
  cells.set(key(x, z), { g: Math.round(g ?? 0), L: L == null ? null : Math.round(L) });
}
const has = (x, z) => cells.has(key(x, z));
const cellAt = (x, z) => cells.get(key(x, z));

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Smoothed ridge rise above the eave (eave = ground + 10, two storeys of 5)
const rrCache = new Map();
function rr(x, z) {
  const k = key(x, z);
  if (rrCache.has(k)) return rrCache.get(k);
  let sum = 0, n = 0;
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const d = cellAt(x + dx, z + dz);
    if (!d) continue;
    const base = d.L == null ? 4 : d.L - (d.g + 10);
    sum += clamp(Math.round(base), 2, 5);
    n++;
  }
  const v = clamp(Math.round(sum / Math.max(1, n)), 2, 5);
  rrCache.set(k, v);
  return v;
}

// Absolute top (exclusive) of the roof column at (x,z)
function topOf(x, z) {
  const c = cellAt(x, z);
  const rise = Math.max(2, rr(x, z) - Math.floor(Math.abs(x - 7.5) / 2));
  return c.g + 10 + rise;
}

const isPerim = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !has(x + dx, z + dz));
const isCornerCell = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
const isWin = (x, z) => (x + z) % 3 === 1 && !isCornerCell(x, z);

// Entrance on the northern (lowest z) edge of the door column
let doorZ = null;
for (let z = 0; z < D; z++) if (has(DOOR_X, z)) { doorZ = z; break; }

// Inner neighbour used for a warm glowstone behind a window
function innerNeighbour(x, z) {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !isPerim(nx, nz)) return [nx, nz];
  }
  return null;
}

// ---- build ----
const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

for (const [k, c] of cells) {
  const [xs, zs] = k.split(",");
  const x = Number(xs), z = Number(zs);
  const g0 = c.g;
  const perim = isPerim(x, z);
  const T = topOf(x, z);

  // Foundation under the cell
  for (let y = 0; y < g0; y++) put(x, y, z, "stone");

  // Base course / ground floor slab
  put(x, g0, z, perim ? "polished_andesite" : "stone_bricks");

  if (perim) {
    const doorHere = x === DOOR_X && z === doorZ;
    // Door surround: pilasters flanking the entrance, lintel and lanterns above
    const doorSurround = doorZ !== null && z === doorZ && (x === DOOR_X - 1 || x === DOOR_X + 1);
    const doorLintelCol = doorZ !== null && z === doorZ && (x >= DOOR_X - 1 && x <= DOOR_X + 1);

    for (let y = g0 + 1; y <= g0 + 9; y++) {
      const rel = y - g0;

      if (doorHere && (rel === 1 || rel === 2)) {
        put(x, y, z, "oak_door", {
          facing: "north",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      if (doorSurround && (rel === 1 || rel === 2)) {
        put(x, y, z, "polished_andesite");
        continue;
      }

      if (doorLintelCol && rel === 3) {
        // Lintel band over the entrance; lanterns on the flanking columns
        if (doorHere) put(x, y, z, "red_terracotta");
        else put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
        continue;
      }

      if (rel === 5) { put(x, y, z, "red_terracotta"); continue; } // storey line

      const winRow = (rel >= 1 && rel <= 3) || (rel >= 6 && rel <= 8);
      if (winRow && isWin(x, z)) {
        put(x, y, z, "glass_pane");
        if (rel === 2 && (x + 2 * z) % 6 === 1) {
          const inner = innerNeighbour(x, z);
          if (inner) put(inner[0], y, inner[1], "glowstone");
        }
        continue;
      }
      put(x, y, z, "stone_bricks");
    }
  } else {
    // Interior: air between slabs, floor slab at the storey line
    put(x, g0 + 5, z, "stone_bricks");
  }

  // Ceiling / roof base (sits on walls and interior slabs)
  put(x, g0 + 10, z, "stone_bricks");

  // Roof mass in slate, stepped down to the eaves; top course as stairs on the outward edge
  const outDx = x < 7.5 ? -1 : 1;
  const nb = cellAt(x + outDx, z);
  const outwardLower = !nb || topOf(x + outDx, z) < T;
  const facing = x < 7.5 ? "west" : "east";
  for (let y = g0 + 11; y <= T - 1; y++) {
    if (y === T - 1 && outwardLower) {
      put(x, y, z, "deepslate_tile_stairs", {
        facing,
        half: "bottom",
        shape: "straight",
        waterlogged: "false",
      });
    } else {
      put(x, y, z, "deepslate_tiles");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
