import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1079143.cells.json`, "utf8"));
const g = new Voxels([100, 60, 67]);

// ---- footprint bookkeeping -------------------------------------------------
const K = (x, z) => x + "," + z;
const map = new Map();
for (const c of cells) {
  const x = Math.round(c[0]);
  const z = Math.round(c[1]);
  const gr = Math.max(0, Math.round(c[2]));
  // roof from lidar, clamped to the build box, always a few blocks above ground
  let roof = Math.min(56, Math.round(c[3]));
  if (roof < gr + 4) roof = gr + 4;
  map.set(K(x, z), { x, z, gr, roof });
}
const has = (x, z) => map.has(K(x, z));
const cellList = [...map.values()];

function isBoundary(c) {
  return !has(c.x + 1, c.z) || !has(c.x - 1, c.z) || !has(c.x, c.z + 1) || !has(c.x, c.z - 1);
}

// outward normal and along-wall coordinate for a boundary cell
function facade(c) {
  if (!has(c.x, c.z - 1)) return { nx: 0, nz: -1, t: c.x };
  if (!has(c.x, c.z + 1)) return { nx: 0, nz: 1, t: c.x };
  if (!has(c.x - 1, c.z)) return { nx: -1, nz: 0, t: c.z };
  return { nx: 1, nz: 0, t: c.z };
}

// main entrance on the lowest-z edge, centred along x
const frontZ = Math.min(...cellList.map((c) => c.z));
const frontXs = cellList.filter((c) => c.z === frontZ).map((c) => c.x).sort((a, b) => a - b);
const medX = frontXs[Math.floor(frontXs.length / 2)];

// ---- build -----------------------------------------------------------------
for (const c of cellList) {
  const { x, z, gr, roof } = c;
  const top = roof;
  const boundary = isBoundary(c);

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!boundary) {
    // interior: floor slabs per storey, air between, solid roof deck
    for (let y = gr; y < top; y++) {
      const rel = y - gr;
      if (rel % 2 === 0 || y >= top - 2) g.set(x, y, z, "light_gray_concrete");
    }
    g.set(x, top, z, "gray_concrete");

    // rooftop plant: solid 3x3 mechanical boxes on a loose grid
    const mx = ((x % 14) + 14) % 14;
    const mz = ((z % 14) + 14) % 14;
    if (mx >= 5 && mx <= 7 && mz >= 5 && mz <= 7) {
      g.set(x, top + 1, z, "light_gray_concrete");
      g.set(x, top + 2, z, "light_gray_concrete");
      if (mx === 6 && mz === 6) g.set(x, top + 3, z, "iron_block");
    }
    continue;
  }

  // facade (boundary) column: a single wall block per y
  const { nx, nz, t } = facade(c);
  const inwardX = x - nx;
  const inwardZ = z - nz;
  const inwardInterior = has(inwardX, inwardZ) && !isBoundary(map.get(K(inwardX, inwardZ)));
  const dx = Math.abs(x - medX);
  const isEntrance = z === frontZ && dx <= 1;
  const isSurround = z === frontZ && dx === 2;

  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    let id;
    if (y === top - 1) {
      // parapet / cornice cap
      id = "smooth_stone";
    } else if (isEntrance && rel <= 1) {
      // glazed entrance bay
      id = "tinted_glass";
    } else if (isEntrance && rel === 2) {
      // entrance lintel
      id = "polished_granite";
    } else if (isSurround && rel <= 2) {
      // granite surround framing the entrance
      id = "polished_granite";
    } else if (rel === 0) {
      // base course
      id = "stone_bricks";
    } else if (rel % 2 === 0) {
      // storey line / spandrel
      id = "light_gray_concrete";
    } else {
      // window band with concrete piers every 4 blocks
      if (((t % 4) + 4) % 4 === 0) id = "gray_concrete";
      else id = "cyan_stained_glass";
    }
    g.set(x, y, z, id);

    // warm light behind some glass panes
    const isWindowRow = rel > 0 && rel % 2 === 1 && y !== top - 1;
    if (isWindowRow && id === "cyan_stained_glass" && inwardInterior) {
      const lit = (x * 7 + z * 13 + y * 5) % 17 === 0;
      if (lit) g.set(inwardX, y, inwardZ, (x + y) % 2 === 0 ? "glowstone" : "shroomlight");
    }
  }
}

g.save(`${DIR}/NYC1079143.nbt`);
