import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC86603: 1420 K St NW, Washington DC. Mid-1980s speculative office block:
// precast white concrete piers and spandrels, tinted glass bands,
// granite base course, a street entrance on the south end,
// a granite cornice under the parapet, and low rooftop units.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86603";
const W = 5, H = 30, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(`${x},${z}`, { g: Math.round(gr), roof: Math.round(roof) });
}
const has = (x, z) => map.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const GLASS = "light_blue_stained_glass";
const PIER = "white_concrete";
const SLAB = "light_gray_concrete";
const BASE = "polished_granite";
const FOUND = "stone_bricks";

const storeysFor = (gr, roof) => {
  let n = Math.max(1, Math.round((roof - gr) / 3));
  return Math.min(n, Math.max(1, Math.floor((27 - gr) / 3)));
};

const tops = new Map();

for (const [key, { g: gr, roof }] of map) {
  const [x, z] = key.split(",").map(Number);
  const edgeX = x === 0 || x === W - 1;
  const edgeZ = z === 0 || z === D - 1;
  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const corner = edgeX && edgeZ;

  const n = storeysFor(gr, roof);
  const T = gr + 3 * n;
  tops.set(key, T);

  // Foundation under the cell up to its ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  // Body: each storey is 3 rows: r0 = floor/base line, r1-r2 = window band.
  for (let r = 0; r < 3 * n; r++) {
    const y = gr + r;
    const rm = r % 3;

    if (r === 0) {
      put(x, y, z, perim ? BASE : SLAB);
      continue;
    }
    if (rm === 0) {
      put(x, y, z, perim ? PIER : SLAB); // spandrel / floor slab
      continue;
    }
    if (!perim) continue; // interior air behind the glass

    let block;
    if (corner) {
      block = PIER;
    } else if (edgeZ) {
      // Narrow ends (5 wide): windows across, only corners are piers.
      if (z === D - 1 && x === 2) continue; // entrance, placed below
      block = GLASS;
    } else {
      // Long sides (17 long): alternate piers and glass by z.
      block = z % 2 === 0 ? PIER : GLASS;
    }
    put(x, y, z, block);

    // Sparse warm light behind some glass, middle row of a storey only.
    if (block === GLASS && rm === 1 && (x * 3 + z * 5 + r) % 13 === 0) {
      const dx = x === 0 ? 1 : x === W - 1 ? -1 : 0;
      const dz = z === 0 ? 1 : z === D - 1 ? -1 : 0;
      if (dx !== 0 || dz !== 0) put(x + dx, y, z + dz, "glowstone");
    }
  }

  // Roof slab at top of body.
  put(x, T, z, SLAB);

  // Granite cornice course just below the parapet, then the parapet.
  if (perim) {
    put(x, T, z, BASE);
    put(x, T + 1, z, PIER);
  }
}

// Street entrance on the south end (z = D-1, x = 2).
const eg = map.get(`2,${D - 1}`);
if (eg) {
  const gr = eg.g;
  put(2, gr + 1, D - 1, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(2, gr + 2, D - 1, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Warm lanterns in the lobby just inside the door.
  put(1, gr + 1, D - 2, "lantern", { hanging: "false", waterlogged: "false" });
  put(3, gr + 1, D - 2, "lantern", { hanging: "false", waterlogged: "false" });
}

// Low rooftop air-handling units on interior roof cells, one block high.
const units = [[1, 3], [2, 11]];
for (const [ux, uz] of units) {
  const cellsOk = [[ux, uz], [ux + 1, uz], [ux, uz + 1], [ux + 1, uz + 1]];
  if (!cellsOk.every(([a, b]) => has(a, b))) continue;
  const top = tops.get(`${ux},${uz}`);
  if (top === undefined || top + 1 > H - 1) continue;
  for (const [a, b] of cellsOk) put(a, top + 1, b, SLAB);
}

g.save(`${DIR}/${ID}.nbt`);
