import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542683420";
const cells = JSON.parse(readFileSync(`${BASE}.cells.json`, "utf8"));

const W = 31, H = 23, D = 10;
const g = new Voxels([W, H, D]);

// Two-storey mid-century concrete shophouse block: white concrete walls,
// stone-brick plinth, smooth-stone storey lines, glass-pane bays, stone cornice.
// Roof sits 11 blocks above the lowest ground (levels 0..10 for the lowest cell).

const key = (x, z) => `${x},${z}`;
const occ = new Set(cells.map(([x, z]) => key(x, z)));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isEdge = (x, z) => DIRS.some(([dx, dz]) => !occ.has(key(x + dx, z + dz)));

for (const [x, z, ground0] of cells) {
  const ground = Math.max(0, Math.min(11, ground0)); // keep roof inside the 23-high volume
  const b = ground;                                  // storey-1 floor level for this cell

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const ph = x + z; // bay rhythm along the facade

  if (!edge) {
    // Interior: floor slabs and roof only, air between (no interiors modelled)
    g.set(x, b, z, "smooth_stone");
    g.set(x, b + 5, z, "smooth_stone");
    g.set(x, b + 10, z, "smooth_stone");
    // Roof plant on a few interior cells
    if (b + 11 <= H - 1 && x % 7 === 3 && z >= 3 && z <= 6) {
      g.set(x, b + 11, z, "light_gray_concrete");
    }
    continue;
  }

  // Facade column: solid wall with window bays, plinth, storey lines and cornice
  for (let y = b; y <= b + 10; y++) g.set(x, y, z, "white_concrete");

  // Stone-brick plinth course
  g.set(x, b, z, "stone_bricks");
  // Storey line between floors
  g.set(x, b + 5, z, "smooth_stone");
  // Cornice / parapet cap at roof level
  g.set(x, b + 10, z, "stone_brick_slab", { type: "top", waterlogged: "false" });

  const bay = ph % 3 === 1;

  // Ground floor: shopfront glazing in bays, solid piers between
  for (let y = b + 1; y <= b + 3; y++) {
    if (bay) g.set(x, y, z, "glass_pane", { waterlogged: "false" });
  }

  // Upper floor windows
  for (let y = b + 6; y <= b + 8; y++) {
    if (bay) g.set(x, y, z, "glass_pane", { waterlogged: "false" });
  }

  // A few warm-lit upper windows at dusk
  if (ph % 9 === 4) {
    g.set(x, b + 7, z, "shroomlight");
  }

  // Ground-floor entrance accent: warm light in the plinth-level bay near the middle
  if (x === Math.floor(W / 2) && bay) {
    g.set(x, b + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${BASE}.nbt`);
