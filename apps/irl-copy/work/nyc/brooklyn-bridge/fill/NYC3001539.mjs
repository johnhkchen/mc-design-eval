import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001539";

// 1834 Federal / early Greek Revival rowhouse, Brooklyn Heights.
// Brick shell on a brownstone (brown terracotta) foundation, sandstone sills,
// one flat roof level behind a low stone parapet, symmetrical windows and a
// centred entrance on the street (min z) face.

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

const W = 6, H = 24, D = 10;
const g = new Voxels([W, H, D]);

const FOUND = "brown_terracotta";
const BRICK = "bricks";
const FLOOR = "smooth_stone";
const BASE = "stone_bricks";
const CORNICE = "smooth_sandstone";
const PARAPET_SLAB = "stone_brick_slab";
const GLASS = "glass";
const WARM = "yellow_stained_glass";
const INTERIOR_FLOOR = "oak_planks";

const key = (x, z) => x + "," + z;
const cellsMap = new Map();
for (const c of list) {
  const [x, z, gr] = c;
  cellsMap.set(key(x, z), { x, z, g0: Math.max(0, Math.round(gr)) });
}

const cellVals = [...cellsMap.values()];
const inF = (x, z) => cellsMap.has(key(x, z));
const minZ = Math.min(...cellVals.map((c) => c.z));
const minX = Math.min(...cellVals.map((c) => c.x));

// One storey grid for the whole building: lowest ground sets the band lines,
// and a single flat roof level (from the lidar median) removes the jagged skyline.
const gBase = Math.min(...cellVals.map((c) => c.g0));
const roofs = list.map((c) => Math.round(c[3])).sort((a, b) => a - b);
const roofMed = roofs[Math.floor(roofs.length / 2)];
const R = Math.min(H - 2, Math.max(gBase + 9, roofMed));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isBand = (y) => (y - gBase) % 3 === 0;

for (const c of cellVals) {
  const { x, z, g0 } = c;
  const perim = !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
  const front = z === minZ;
  const back = z === minZ + 9 || !inF(x, z + 1);
  const relX = x - minX;

  // 1. Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < g0; y++) put(x, y, z, FOUND);

  // 2. Base course / ground surface at the cell's own ground.
  put(x, g0, z, perim ? BASE : INTERIOR_FLOOR);

  // 3. Walls, storey bands and interior floor slabs on the global grid.
  for (let y = g0 + 1; y <= R - 2; y++) {
    if (isBand(y)) {
      put(x, y, z, FLOOR);
    } else if (perim) {
      put(x, y, z, BRICK);
    }
  }

  // 4. Cornice at R-1, low parapet slab at R on the perimeter, flat roof deck over all cells.
  put(x, R - 1, z, perim ? CORNICE : FLOOR);
  if (perim) {
    put(x, R, z, PARAPET_SLAB, { type: "bottom", waterlogged: "false" });
  } else {
    put(x, R, z, FLOOR);
  }

  // 5. Windows and entrance on the street face; plain windowed rear.
  if (perim && (front || back)) {
    const kMax = Math.floor((R - 4 - gBase) / 3);
    for (let k = 0; k <= kMax; k++) {
      const yb = gBase + 3 * k + 1;
      const yt = gBase + 3 * k + 2;
      if (yb <= g0) continue; // already foundation
      const isGround = k === 0;

      if (front && isGround) {
        if (relX === 2) {
          // Centred entrance door, flanked by sandstone pilasters.
          put(x, yb, z, "dark_oak_door", {
            facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
          });
          put(x, yt, z, "dark_oak_door", {
            facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
        if (relX === 3) {
          put(x, yb, z, CORNICE);
          put(x, yt, z, CORNICE);
          continue;
        }
      }

      const winCols = front ? (isGround ? [1, 4] : [1, 4]) : [1, 4];
      if (winCols.includes(relX)) {
        const warm = front && ((k === kMax && relX === 1) || (isGround && relX === 4));
        const pane = warm ? WARM : GLASS;
        put(x, yb, z, pane);
        put(x, yt, z, pane);
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
