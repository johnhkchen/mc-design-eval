import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${dir}/FR301499675.cells.json`, "utf8"));

const g = new Voxels([6, 17, 6]);

// Footprint bounds and lookup
const has = new Set(cells.map(([x, z]) => `${x},${z}`));
const exists = (x, z) => has.has(`${x},${z}`);
const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));
const maxZ = Math.max(...cells.map(c => c[1]));
const span = maxX - minX;
const maxG = Math.max(...cells.map(c => c[2]));
const maxR = Math.max(...cells.map(c => c[3]));

// Single storey house: the wall top follows the lidar roof (about 5 blocks above y0),
// never dropping below the highest ground so the walls stay clear of the foundation.
const W = Math.max(maxG + 2, maxR - 2);

const WALL = "stone_bricks";
const FOUND = "stone";
const FLOOR = "stone_bricks";
const ROOF = "deepslate_tile_stairs";
const ROOF_FILL = "stone_bricks";

const pane = (ew) => ew
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const lx = x - minX;
  const lz = z - minZ;
  const perim = !exists(x - 1, z) || !exists(x + 1, z) || !exists(x, z - 1) || !exists(x, z + 1);
  const onZFace = lz === 0 || lz === span; // wall runs east-west here

  // Foundation up to ground, then floor slab at ground level
  for (let y = 0; y < gr; y++) g.set(lx, y, lz, FOUND);
  g.set(lx, gr, lz, FLOOR);

  // Walls
  if (perim) {
    for (let y = gr + 1; y <= W - 1; y++) g.set(lx, y, lz, WALL);
  }

  if (perim) {
    const cornerOrEdge = (lx === 0 || lx === span) && (lz === 0 || lz === span);
    const inBand = (y) => y >= gr + 2 && y <= W - 2;
    const doorX = 2;
    if (lz === span && lx === doorX && !cornerOrEdge) {
      // Entrance on the south face, centred, with a stone step
      g.set(lx, gr + 1, lz, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(lx, gr + 2, lz, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (!cornerOrEdge) {
      // Window grid on odd indices along each face
      const idx = onZFace ? lx : lz;
      if (idx % 2 === 1) {
        for (let y = gr + 2; y <= W - 2; y++) {
          if (inBand(y)) g.set(lx, y, lz, "glass_pane", pane(onZFace));
        }
      }
    }
  }

  // Ceiling over interior cells (below roof)
  if (!perim) {
    g.set(lx, W, lz, FLOOR);
    if (lx === 1 && lz === 2 && W - 2 >= gr + 2) g.set(lx, gr + 2, lz, "glowstone");
  }

  // Gable roof with ridge along Z: solid fill under stairs, stair on top
  const d = Math.min(lx, span - lx);
  const facing = lx <= span / 2 ? "west" : "east";
  for (let y = W; y < W + d; y++) g.set(lx, y, lz, ROOF_FILL);
  g.set(lx, W + d, lz, ROOF, { facing, half: "bottom", shape: "straight", waterlogged: "false" });
}

g.save(`${dir}/FR301499675.nbt`);
