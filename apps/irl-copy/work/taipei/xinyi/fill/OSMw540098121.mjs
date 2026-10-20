import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540098121";
const W = 22, H = 23, D = 19;

// Levels (absolute y). Two-storey low commercial block, Xinyi, c. 1980s:
// glazed shopfront, tiled piers, red canopy band, upper windows, cornice, parapet.
const CANOPY = 4;   // red canopy band above shopfront
const FLOOR = 5;    // floor line / band between storeys
const SPAND = 9;    // spandrel under upper windows
const ROOF = 10;    // roof slab level and cornice band
const PARAPET = 11; // parapet wall
const CAP = 12;     // coping cap

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, gy);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const cx = (minX + maxX) / 2;
const cz = (minZ + maxZ) / 2;

const NB = [[0, -1], [0, 1], [1, 0], [-1, 0]];

const missingOf = (x, z) => NB.filter(([dx, dz]) => !has(x + dx, z + dz));

// Door on the north face (dz = -1), nearest to its centre
const northCells = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => {
    const m = missingOf(x, z);
    return m.length === 1 && m[0][1] === -1;
  });
let doorKey = null;
if (northCells.length) {
  const avg = northCells.reduce((s, [x]) => s + x, 0) / northCells.length;
  northCells.sort((a, b) => Math.abs(a[0] - avg) - Math.abs(b[0] - avg));
  doorKey = `${northCells[0][0]},${northCells[0][1]}`;
}

// Glow cells: inner cells directly behind selected upper-floor windows
const glowSet = new Set();
for (const [x, z] of cells) {
  const m = missingOf(x, z);
  if (m.length !== 1) continue;
  const [mdx, mdz] = m[0];
  if (x % 6 !== 2) continue;
  glowSet.add(`${x - mdx},${z - mdz}`);
}

const g = new Voxels([W, H, D]);

const pane = (x, z) => {
  const m = missingOf(x, z);
  const alongX = m[0][1] !== 0; // on north/south face: runs along x
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
};

for (const [x, z, gy] of cells) {
  const g0 = gy;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone");

  const missing = missingOf(x, z);

  if (missing.length === 0) {
    // Inner cell: floor slabs, roof slab, roof equipment, glow behind windows; otherwise air gap
    const key = `${x},${z}`;
    for (let y = g0; y <= CAP; y++) {
      if (y === g0 || y === FLOOR || y === ROOF) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (y === PARAPET && Math.abs(x - cx) <= 4 && Math.abs(z - cz) <= 3) {
        g.set(x, y, z, "gray_concrete");
      } else if (y === 7 && glowSet.has(key)) {
        g.set(x, y, z, "glowstone");
      }
    }
    continue;
  }

  // Ring (facade) cell
  const corner = missing.length >= 2;
  const onNS = missing.some(([, dz]) => dz !== 0); // north/south face
  const idx = onNS ? x : z;
  const pier = corner || idx % 3 === 0;
  const isDoor = doorKey === `${x},${z}`;

  for (let y = g0; y <= CAP; y++) {
    if (y < CANOPY) {
      if (y === g0) {
        g.set(x, y, z, "polished_andesite");
      } else if (isDoor && (y === g0 || y === g0 + 1)) {
        const half = y === g0 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (pier) {
        g.set(x, y, z, "white_terracotta");
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
    } else if (y === CANOPY) {
      g.set(x, y, z, "red_terracotta");
    } else if (y === FLOOR) {
      g.set(x, y, z, "stone_bricks");
    } else if (y >= 6 && y < SPAND) {
      if (pier) g.set(x, y, z, "white_terracotta");
      else g.set(x, y, z, "light_blue_stained_glass_pane", pane(x, z));
    } else if (y === SPAND) {
      g.set(x, y, z, pier ? "white_terracotta" : "white_concrete");
    } else if (y === ROOF) {
      g.set(x, y, z, "stone_bricks");
    } else if (y === PARAPET) {
      g.set(x, y, z, "white_terracotta");
    } else if (y === CAP) {
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
