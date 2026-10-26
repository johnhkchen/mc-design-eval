import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87029.cells.json`, "utf8"));

// Special Purpose-Misc, 201 17th St NW. Roof ~3 blocks above lowest ground.
// Read as a single-storey brick-and-stone building: stone base, stone piers between
// glass bays, a central street door, a stone cornice and parapet, warm lanterns.
const W = 6, H = 15, D = 6;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cm = new Map(cells.map(([x, z, gr, roof]) => [key(x, z), { gr, roof }]));
const has = (x, z) => cm.has(key(x, z));

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

// Roof follows lidar, with at least 4 wall rows so the door is 2 blocks tall.
const roofTop = Math.max(...cells.map(([x, z, gr, roof]) => Math.max(roof, gr + 4)));
const roofCap = roofTop - 1;
const doorX = minX + 2;          // street face (z = minZ): door at x=2, glass at x=3, piers at x=1,4

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => (x === minX || x === maxX) && (z === minZ || z === maxZ);

for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  const corner = isCorner(x, z);
  const street = z === minZ && edge && !corner;

  // Foundation under the ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floor: stone base course on the perimeter, oak planks inside.
  g.set(x, gr, z, edge ? "stone_bricks" : "oak_planks");

  if (edge) {
    // Stone base course one row above the floor, brick above.
    const wallTop = roofTop - 2;
    for (let y = gr + 1; y <= wallTop; y++) {
      if (corner) {
        g.set(x, y, z, "stone_bricks");
        continue;
      }
      // Piers at the bay joints (non-corner positions 1 and 4), full height stone.
      const pier = (x === minX + 1 || x === maxX - 1) && !street
                || (street && (x === minX + 1 || x === maxX - 1));
      if (pier) {
        g.set(x, y, z, "stone_bricks");
        continue;
      }
      // Street door (lower and upper halves) at doorX.
      if (street && x === doorX) {
        if (y === gr + 1) {
          g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (y === gr + 2) {
          g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else {
          g.set(x, y, z, "stone_bricks");
        }
        continue;
      }
      // Glass bays between piers: two rows of glass, brick above and below.
      if (y === gr + 1 || y === gr + 2) {
        g.set(x, y, z, "glass");
      } else {
        g.set(x, y, z, "bricks");
      }
    }
    // Lintel / storey line above the windows.
    if (!corner) g.set(x, wallTop, z, "stone_bricks");
    // Cornice course and parapet.
    g.set(x, roofCap, z, "stone_bricks");
    g.set(x, roofTop, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Interior: air gap, roof deck above.
    g.set(x, roofCap, z, "smooth_stone");
  }
}

// Warm lanterns inside, behind the street glass.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z) && z === minZ + 1 && (x === minX + 1 || x === maxX - 1)) {
    g.set(x, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof vent: a small chiseled-stone plinth on an interior roof cell.
const vx = minX + 2, vz = maxZ - 1;
if (has(vx, vz) && !isEdge(vx, vz)) {
  g.set(vx, roofCap + 1, vz, "chiseled_stone_bricks");
}

g.save(`${DIR}/DC87029.nbt`);
