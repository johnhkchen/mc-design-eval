import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499732.cells.json`, "utf8"));

const W = 7, D = 11, H = 17;
const g = new Voxels([W, H, D]);

const cellMap = new Map();
for (const [x, z, gr, roof] of cells) cellMap.set(`${x},${z}`, { gr, roof });

const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const roofRef = roofs[Math.floor(roofs.length / 2)];   // median lidar roof height
const maxGround = Math.max(...cells.map((c) => c[2]));

// Single-storey shop-house: eave course sits so that the pitched roof
// finishes close to the lidar roof height (about 5 blocks above lowest ground).
let E = Math.max(roofRef - 3, maxGround + 4);
E = Math.min(E, 12);

// Pitch across the 7-wide span (ridge along z): 0,1,2,3,2,1,0
const hOf = (x) => Math.min(x, 6 - x);

const wall = "stone_bricks";
const trim = "chiseled_stone_bricks";
const shopWood = "dark_oak_planks";

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const c = cellMap.get(`${x},${z}`);
    if (!c) continue;
    const gr = c.gr;
    const perimeter = x === 0 || x === W - 1 || z === 0 || z === D - 1;
    const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

    // Foundation from y 0 up to this cell's ground
    for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

    // Base course / interior floor at ground
    g.set(x, gr, z, perimeter ? "cobblestone" : "smooth_stone");

    if (perimeter) {
      for (let y = gr + 1; y <= E - 1; y++) {
        let id = wall;
        if (y === E - 1 || corner) {
          id = trim;                                   // cornice course and corner pillars
        } else if (x === 0) {
          // Front: shopfront with entrance on the ground storey
          if (y <= gr + 2 && z >= 2 && z <= 8) {
            if (z === 2 || z === 8) id = shopWood;
            else if (z === 5) id = null;               // door placed below
            else id = "glass";
          } else if (y >= gr + 2 && z % 2 === 1) {
            id = "glass";                              // upper windows on front
          }
        } else if (x === W - 1) {
          // Back: windows
          if (z % 2 === 1 && y >= gr + 1 && y <= E - 2) id = "glass";
        } else {
          // Long ends (z = 0 / z = 10): windows
          if (x % 2 === 0 && y >= gr + 1 && y <= E - 2) id = "glass";
        }
        if (id === null) continue;
        g.set(x, y, z, id);
      }
    }

    // Solid infill under the pitched roof
    const h = hOf(x);
    for (let y = E; y < E + h; y++) g.set(x, y, z, wall);

    // Roof covering
    if (x === 3) {
      g.set(x, E + 3, z, "deepslate_tiles");           // ridge
    } else {
      g.set(x, E + h, z, "deepslate_tile_stairs", {
        facing: x < 3 ? "west" : "east",
        half: "bottom",
        shape: "straight",
        waterlogged: "false",
      });
    }
  }
}

// Entrance door on the front (x = 0), z = 5, on the ground storey
const front = cellMap.get("0,5");
if (front) {
  const gy = front.gr;
  g.set(0, gy + 1, 5, "oak_door", {
    facing: "west", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(0, gy + 2, 5, "oak_door", {
    facing: "west", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Small canopy over the door
  for (let z = 4; z <= 6; z++) {
    g.set(0, gy + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Warm lights behind shopfront glass
const lc = cellMap.get("1,4");
if (lc && lc.gr + 1 <= E - 2) {
  g.set(1, lc.gr + 1, 4, "shroomlight");
  g.set(1, lc.gr + 1, 6, "shroomlight");
}
const bc = cellMap.get("1,8");
if (bc && bc.gr + 1 <= E - 2) g.set(1, bc.gr + 1, 8, "glowstone");

g.save(`${DIR}/FR301499732.nbt`);
