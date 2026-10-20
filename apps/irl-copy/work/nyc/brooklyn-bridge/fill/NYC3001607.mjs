import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001607";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 24, D = 12;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> { ground, roof }
const fp = new Map();
for (const [x, z, ground, roof] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  fp.set(`${x},${z}`, { ground: Math.max(0, Math.round(ground)), roof: Math.round(roof) });
}
const has = (x, z) => fp.has(`${x},${z}`);
const isPerimeter = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// One clean roof level for this walk-up (lidar noise smoothed to the median)
const roofs = [...fp.values()].map(v => v.roof).sort((a, b) => a - b);
const ROOF = Math.min(H - 3, roofs.length ? roofs[Math.floor(roofs.length / 2)] : 12);

// Front = z=0 row (street side). Entrance centred on it.
const DOOR_X = 2, DOOR_Z = 0;

// Is this perimeter cell a window bay? Bays alternate along each face,
// with brick piers at the corners and at alternate cells, so the grid is calm.
function isWindowBay(x, z) {
  const onFrontBack = z === 0 || z === D - 1;
  const onSides = x === 0 || x === W - 1;
  if (onFrontBack && !onSides) return x % 2 === 1;          // x = 1, 3 on front/back faces
  if (onSides && !onFrontBack) return z % 2 === 1;          // odd z on side faces
  return false;                                             // corners stay solid brick
}

for (const [key, { ground }] of fp) {
  const [x, z] = key.split(",").map(Number);
  const gr = Math.min(ground, H - 4);
  const r = Math.max(gr + 4, ROOF);
  const perim = isPerimeter(x, z);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floor slab at street level
  g.set(x, gr, z, perim ? "stone_bricks" : "spruce_planks");

  // Storeys: 2 blocks each. Offset 0 = spandrel/brick, offset 1 = window row.
  for (let y = gr + 1; y < r; y++) {
    const off = y - gr;
    if (perim) {
      const storeyLine = off % 2 === 0;   // floor line course in stone
      if (storeyLine) {
        g.set(x, y, z, "smooth_stone");
      } else if (isWindowBay(x, z)) {
        // Glass with a stone sill above the floor line, lit in a few bays on the front
        g.set(x, y, z, "glass_pane", {
          east: "false", west: "false", north: "false", south: "false", waterlogged: "false",
        });
      } else {
        g.set(x, y, z, "bricks");
      }
    } else if (off % 2 === 0) {
      // Interior: only floor slabs at storey lines
      g.set(x, y, z, "spruce_planks");
    }
  }

  // Cornice course under the roof on the perimeter
  if (perim) g.set(x, r - 1, z, "stone_bricks");

  // Roof deck
  g.set(x, r, z, "deepslate_tiles");

  // Continuous parapet on the perimeter
  if (perim && r + 1 < H) g.set(x, r + 1, z, "stone_bricks");
}

// Warm lights in a few front-face window rows (glowstone behind the glass line)
for (let x = 1; x <= 3; x += 2) {
  const gr = fp.get(`${x},0`)?.ground;
  if (gr === undefined) continue;
  const r = Math.max(gr + 4, ROOF);
  // Upper storey and one below, lit rows
  for (const off of [4, 8]) {
    const y = gr + off;
    if (y < r - 1) g.set(x, y, 0, "glowstone");
  }
}

// Entrance on the street front
{
  const gr = fp.get(`${DOOR_X},${DOOR_Z}`)?.ground;
  if (gr !== undefined) {
    // Door in the ground-floor wall, cleared above the floor line
    g.set(DOOR_X, gr + 1, DOOR_Z, "oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(DOOR_X, gr + 2, DOOR_Z, "oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Stone canopy over the door across the front bays
    for (let x = 1; x <= 3; x++) {
      g.set(x, gr + 3, DOOR_Z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
    // Lanterns hanging under the canopy flanking the door
    for (const x of [1, 3]) {
      g.set(x, gr + 2, DOOR_Z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
