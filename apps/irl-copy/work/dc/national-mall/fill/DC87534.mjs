import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87534";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 32, D = 18;
const g = new Voxels([W, H, D]);

// Palette: 1970s-80s Washington office block, pale precast/limestone-clad
// frame with blue-tinted glass bands and a stone base.
const WALL = "calcite";
const BASE = "stone_bricks";
const FRAME = "white_concrete";
const GLASS = "light_blue_stained_glass";
const FLOOR = "gray_concrete";
const ROOF = "light_gray_concrete";
const CORNICE = "smooth_stone_slab";
const WARM = "glowstone";

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, ground, roof] of cells) {
  map.set(key(x, z), { ground: Math.round(ground), roof: Math.round(roof) });
}
const has = (x, z) => map.has(key(x, z));

const xs = cells.map(c => c[0]);
const zs = cells.map(c => c[1]);
const xMin = Math.min(...xs), xMax = Math.max(...xs);
const zMin = Math.min(...zs), zMax = Math.max(...zs);
const xMid = Math.round((xMin + xMax) / 2);
const zMid = Math.round((zMin + zMax) / 2);

// Smooth lidar roof: average each cell with its footprint neighbours,
// then quantise to whole 4-block storeys.
const topOf = (x, z) => {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (has(x + dx, z + dz)) { sum += map.get(key(x + dx, z + dz)).roof; n++; }
  }
  const avg = sum / n;
  let top = Math.round(avg / 4) * 4;
  return Math.min(Math.max(top, map.get(key(x, z)).ground + 8), H - 4);
};

for (const [x, z] of [...map.keys()].map(k => k.split(",").map(Number))) {
  const { ground } = map.get(key(x, z));
  const top = topOf(x, z);

  const perimeter = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const isCorner = (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
  const isFront = !has(x, z - 1);
  const isEntranceX = Math.abs(x - xMid) <= 1;

  // Foundation from y 0 up to ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);

  for (let y = ground; y < top; y++) {
    const rel = (y - ground) % 4;
    const storey = Math.floor((y - ground) / 4);

    // Roof and parapet cap
    if (y === top - 1) {
      g.set(x, y, z, perimeter ? CORNICE : ROOF, perimeter ? { type: "top", waterlogged: "false" } : undefined);
      continue;
    }
    if (perimeter && y === top - 2) {
      g.set(x, y, z, WALL);
      continue;
    }

    if (!perimeter) {
      // Interior: air, with a floor slab at each storey line (no interior detail)
      if (y > ground && rel === 0) g.set(x, y, z, FLOOR);
      continue;
    }

    // Perimeter facade
    if (y === ground) {
      g.set(x, y, z, BASE);
      continue;
    }

    // Front entrance: doors and canopy
    if (isFront && isEntranceX && y - ground <= 2) {
      const half = y - ground === 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: "north", half, hinge: x < xMid ? "left" : "right",
        open: "false", powered: "false",
      });
      continue;
    }
    if (isFront && isEntranceX && y - ground === 3) {
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    // Storey band and spandrel
    if (rel === 0 || rel === 3) {
      g.set(x, y, z, WALL);
      continue;
    }

    // Window rows (rel 1 and 2) with mullions
    if (isCorner || x % 2 === 0) {
      g.set(x, y, z, FRAME);
    } else {
      const warm = ((x * 7 + z * 3 + storey * 5) % 11) === 0 && storey > 0;
      g.set(x, y, z, warm ? WARM : GLASS);
    }
  }

  // Roof plant: a penthouse on central cells, two blocks tall, set back from the parapet
  const cx = Math.abs(x - xMid), cz = Math.abs(z - zMid);
  if (cx <= 2 && cz <= 2 && top + 2 < H) {
    for (let y = top; y < top + 2; y++) g.set(x, y, z, ROOF);
  }
}

g.save(`${DIR}/${ID}.nbt`);
