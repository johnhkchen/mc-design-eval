import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Federal Home Loan Bank Board: 1930s stripped-Classical office block in pale limestone
// (calcite, stone brick), dark polished-diorite piers, glazed bays, five storeys of
// 3 blocks each on a shared datum so storey lines run true across the whole plan.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC61210";
const W = 47, H = 27, D = 33;
const STOREY = 3;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const c of cells) cellMap.set(key(c[0], c[1]), c);
const has = (x, z) => cellMap.has(key(x, z));

// Shared datum: storey lines are absolute, so every cell's floors line up.
const D0 = Math.min(...cells.map((c) => c[2]));
const TOP_MAX = D0 + Math.floor((H - 3 - D0) / STOREY) * STOREY;
const isFloorLine = (y) => (y - D0) % STOREY === 0;

// Depth from the footprint edge: 0 = facade ring, 1 = air-gap ring, 2+ = solid core.
const depth = new Map();
const queue = [];
for (const c of cells) {
  const [x, z] = c;
  if (!has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1)) {
    depth.set(key(x, z), 0);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [nx, nz] of [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]) {
    const k = key(nx, nz);
    if (has(nx, nz) && !depth.has(k)) { depth.set(k, d + 1); queue.push([nx, nz]); }
  }
}

// Lidar roof snapped to the shared storey grid, clamped to the volume.
function topFor(gr, roof) {
  let top = D0 + Math.round((roof - D0) / STOREY) * STOREY;
  top = Math.max(top, gr + 2 * STOREY);
  return Math.min(top, TOP_MAX);
}

// Entrance: the south front, centred on its edge cells.
const southXs = cells.filter(([x, z]) => !has(x, z + 1)).map(([x]) => x);
const cxSouth = southXs.length ? Math.round((Math.min(...southXs) + Math.max(...southXs)) / 2) : 23;
const DOOR_HALF = 1;

for (const [x, z, ground, roofRaw] of cells) {
  const d = depth.get(key(x, z)) ?? 0;
  const gr = Math.max(0, Math.min(ground, H - 6));
  const topY = topFor(gr, roofRaw);

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Interior core: solid, invisible.
  if (d >= 2) {
    for (let y = gr; y < topY; y++) g.set(x, y, z, "stone_bricks");
    // Roof plant: 2x2 blocks in clusters, set well back from the parapet.
    if (d >= 3 && x % 9 >= 4 && x % 9 <= 5 && z % 9 >= 4 && z % 9 <= 5) {
      g.set(x, topY, z, "light_gray_concrete");
      g.set(x, topY + 1, z, "light_gray_concrete");
    }
    continue;
  }

  // Air-gap ring: floor slabs on the shared storey lines, air between, roof slab on top.
  if (d === 1) {
    const doorHere = !has(x, z + 1) === false && z === cells.reduce((m, c) => Math.max(m, c[1]), 0) - 1
      && Math.abs(x - cxSouth) <= DOOR_HALF;
    for (let y = gr; y < topY; y++) {
      if (isFloorLine(y) || y === topY - 1) {
        if (doorHere && y - gr <= 2) continue; // doorway passage
        g.set(x, y, z, "smooth_stone");
      }
    }
    // Warm light behind glass on the second and fourth storeys.
    const warmSpot = (x + z) % 5 === 0;
    if (warmSpot) {
      for (let s = 1; s < 5; s++) {
        const yl = D0 + s * STOREY + 1;
        if (yl > gr && yl < topY - 1) g.set(x, yl, z, "glowstone");
      }
    }
    continue;
  }

  // Facade ring (d === 0). Orientation from which neighbours are missing.
  const missingX = !has(x + 1, z) || !has(x - 1, z);
  const missingZ = !has(x, z + 1) || !has(x, z - 1);
  const corner = missingX && missingZ;
  const southFace = !has(x, z + 1);
  const isPier = corner || (missingZ ? x % 4 === 0 : z % 4 === 0);
  const isDoor = southFace && Math.abs(x - cxSouth) <= DOOR_HALF;
  const isDoorTrim = southFace && Math.abs(x - cxSouth) === DOOR_HALF + 1;
  const isLintel = southFace && Math.abs(x - cxSouth) <= DOOR_HALF + 1;

  for (let y = gr; y < topY - 1; y++) {
    const rel = y - gr;

    // Base course at grade.
    if (rel === 0) {
      if (isDoor) continue; // doorway opening
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Door surround and lintel over the entrance.
    if (isDoor && rel <= 2) continue;
    if (isDoorTrim && rel <= 2) { g.set(x, y, z, "chiseled_stone_bricks"); continue; }
    if (isLintel && rel === 3) { g.set(x, y, z, "stone_bricks"); continue; }

    if (isPier) { g.set(x, y, z, "polished_diorite"); continue; }

    if (isFloorLine(y)) {
      g.set(x, y, z, "calcite"); // storey line / spandrel
    } else {
      g.set(x, y, z, "glass_pane"); // glazed bay
    }
  }

  // Cornice course and parapet cap.
  g.set(x, topY - 1, z, "stone_bricks");
  g.set(x, topY, z, "stone_brick_wall");
}

g.save(`${DIR}/${ID}.nbt`);
