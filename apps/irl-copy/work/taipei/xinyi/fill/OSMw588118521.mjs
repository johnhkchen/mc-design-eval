import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Decided as a late-1980s/1990s Taipei mid-rise office block:
// four storeys of 5 blocks, cream tiled and concrete facade, quartz mullions,
// cyan tinted glazing, a stone base course, a cornice and parapet, a street-side
// entrance with a lintel and hanging lanterns, and a central plant room on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588118521";
const W = 25, H = 34, D = 26;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const isCell = (x, z) => ground.has(key(x, z));
const isFacade = (x, z) =>
  !isCell(x - 1, z) || !isCell(x + 1, z) || !isCell(x, z - 1) || !isCell(x, z + 1);
const isCorner = (x, z) =>
  (!isCell(x - 1, z) || !isCell(x + 1, z)) && (!isCell(x, z - 1) || !isCell(x, z + 1));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: on the street side (the -z face), the two edge cells nearest the centre line.
const cx = (W - 1) / 2;
const northCells = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isCell(x, z - 1)) northCells.push([x, z]);
}
const doorSet = new Set();
const doorHinge = new Map();
if (northCells.length) {
  northCells.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
  const doorZ = northCells[0][1];
  const row = northCells
    .filter((c) => c[1] === doorZ)
    .sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx))
    .slice(0, 2)
    .sort((a, b) => a[0] - b[0]);
  row.forEach(([x, z], i) => {
    doorSet.add(key(x, z));
    doorHinge.set(key(x, z), i === 0 ? "left" : "right");
  });
}

// Plant room footprint on the roof (interior cells only).
const coreX = [8, 16], coreZ = [9, 16];
const inCore = (x, z) =>
  x >= coreX[0] && x <= coreX[1] && z >= coreZ[0] && z <= coreZ[1] && isCell(x, z) && !isFacade(x, z);

for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gr = ground.get(k);
  const fac = isFacade(x, z);
  const corner = isCorner(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Base course.
  put(x, gr, z, fac ? "stone_bricks" : "smooth_stone");

  for (let rel = 1; rel <= 22; rel++) {
    const y = gr + rel;

    if (rel === 21) {
      if (fac) put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      else if (inCore(x, z)) put(x, y, z, "smooth_stone");
      else put(x, y, z, "smooth_stone");
      continue;
    }

    if (rel === 22) {
      if (fac) put(x, y, z, "white_concrete");
      else if (inCore(x, z)) {
        // Plant room: solid roof slab under the walls is rel 22-23; walls at rel 24.
      }
      continue;
    }

    if (!fac) {
      // Interior: floor slabs, plant room, and lamps standing on floors behind glass.
      if ([1, 6, 11, 16].includes(rel)) put(x, y, z, "smooth_stone");
      if (rel === 2 || rel === 7 || rel === 12 || rel === 17) {
        const nearFacade =
          isFacade(x - 1, z) && isCell(x - 1, z) ||
          isFacade(x + 1, z) && isCell(x + 1, z) ||
          isFacade(x, z - 1) && isCell(x, z - 1) ||
          isFacade(x, z + 1) && isCell(x, z + 1);
        const s = (rel - 2) / 5;
        if (nearFacade && (x * 7 + z * 5 + s * 3) % 5 === 0) put(x, y, z, "glowstone");
      }
      continue;
    }

    // Facade rows.
    const w = (rel - 1) % 5; // 0 spandrel, 1-3 window band, 4 spandrel
    if (doorSet.has(k) && rel <= 4) {
      const hinge = doorHinge.get(k) || "left";
      if (rel === 1) {
        put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
      } else if (rel === 2) {
        put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
      } else if (rel === 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else {
        put(x, y, z, "light_gray_concrete");
      }
      continue;
    }

    if (w === 0 || w === 4 || corner && w === 0) {
      put(x, y, z, "light_gray_concrete");
    } else if (corner || (x + z) % 3 === 0) {
      put(x, y, z, "smooth_quartz");
    } else {
      const tint = (x + 2 * z) % 4 === 0 ? "light_blue_stained_glass" : "cyan_stained_glass";
      put(x, y, z, tint);
    }
  }

  // Plant room walls and roof.
  if (inCore(x, z)) {
    for (let rel = 22; rel <= 23; rel++) put(x, gr + rel, z, "light_gray_concrete");
    const perimeter = x === coreX[0] || x === coreX[1] || z === coreZ[0] || z === coreZ[1];
    if (perimeter) put(x, gr + 24, z, "smooth_quartz");
  }
}

// Roof air-conditioning units on the open roof, standing on the roof deck.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gr = ground.get(k);
  if (isFacade(x, z) || inCore(x, z)) continue;
  if ((x * 3 + z * 5) % 13 === 0) put(x, gr + 22, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
