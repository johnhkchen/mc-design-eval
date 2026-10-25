import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499702.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499702.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const W = 32, H = 35, D = 17;
const g = new Voxels([W, H, D]);

// Palette: 1930 commercial block, Norman granite and stone, glazed shopfronts.
const GRANITE = "granite";
const STONE = "stone_bricks";
const CHISEL = "chiseled_stone_bricks";
const FLOOR = "smooth_stone";
const GLASS = "glass";
const FRAME = "dark_oak_planks";
const CORNICE = "stone_brick_slab";
const DOOR = "dark_oak_door";

const key = (x, z) => `${x},${z}`;

// Per-cell massing: ground, and a flat roof top rounded from lidar (min two storeys, max 34).
const cellInfo = new Map();
let minZ = Infinity;
for (const [x, z, gr, roof] of cells) {
  const ground = Math.max(0, Math.round(gr));
  const top = Math.min(34, Math.max(ground + 10, Math.round(roof)));
  cellInfo.set(key(x, z), { ground, top });
  if (z < minZ) minZ = z;
}

const frontCells = cells.filter(c => c[1] === minZ).map(c => c[0]);
const frontMid = frontCells.length
  ? Math.round(frontCells.reduce((a, b) => a + b, 0) / frontCells.length)
  : Math.floor(W / 2);

// A wall voxel is exposed when a neighbour is absent or its roof is below this height.
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
function exposed(x, z, y) {
  for (const [dx, dz] of DIRS) {
    const nb = cellInfo.get(key(x + dx, z + dz));
    if (!nb) return true;
    if (y < nb.ground) continue;   // neighbour column is solid here
    if (y >= nb.top) return true;  // neighbour roof is below: this face is outside
  }
  return false;
}

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const { ground, top } = cellInfo.get(key(x, z));
  const capY = top - 1;

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, GRANITE);

  for (let y = ground; y < top; y++) {
    const rel = y - ground;
    const k = Math.floor(rel / 5);
    const r = rel % 5; // 0 floor line, 1-3 window band, 4 lintel/awning
    const ext = exposed(x, z, y);

    if (y === capY) {
      // Roof: cornice on exposed faces, flat roof slab inside.
      if (ext) g.set(x, y, z, CORNICE, { type: "bottom", waterlogged: "false" });
      else g.set(x, y, z, FLOOR);
      continue;
    }

    if (!ext) {
      // Interior: floor slabs and an occasional warm light set back from the glass.
      if (r === 0) g.set(x, y, z, FLOOR);
      else if (r === 2 && (x * 7 + z * 3 + k) % 9 === 0) g.set(x, y, z, "glowstone");
      continue;
    }

    // Exposed wall column.
    const mullion = x % 3 === 0;
    const onFront = z === minZ;

    if (r === 0) {
      // Storey band: a projecting-looking course on every floor line.
      g.set(x, y, z, k === 0 ? CHISEL : STONE);
      continue;
    }

    if (k === 0) {
      // Commercial ground floor: shopfront glazing, awning band, central entrance.
      if (r === 4) {
        const awning = onFront ? (x % 2 === 0 ? "red_wool" : "white_wool") : STONE;
        g.set(x, y, z, awning);
      } else if (onFront && x === frontMid && r <= 2) {
        const half = r === 1 ? "lower" : "upper";
        g.set(x, y, z, DOOR, { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      } else if (mullion) {
        g.set(x, y, z, FRAME);
      } else {
        g.set(x, y, z, GLASS);
      }
      continue;
    }

    if (r === 4) {
      // Lintel band above upper-floor windows.
      g.set(x, y, z, STONE);
      continue;
    }

    // Upper floors: window bays with stone mullions.
    if (mullion) g.set(x, y, z, STONE);
    else g.set(x, y, z, GLASS);
  }
}

g.save(OUT);
