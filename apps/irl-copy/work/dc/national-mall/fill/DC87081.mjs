import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87081.cells.json`, "utf8"));

const W = 9, H = 22, D = 12;
const g = new Voxels([W, H, D]);

const cm = new Map();
for (const [x, z, gr, r] of cells) cm.set(`${x},${z}`, { gr, r });
const has = (x, z) => cm.has(`${x},${z}`);
const isPerim = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// y 0 = lowest ground under the footprint
let y0 = Infinity;
for (const c of cm.values()) y0 = Math.min(y0, c.gr);
if (!isFinite(y0)) y0 = 0;

// Smooth the lidar roof to one flat parapet height (median, floor 10)
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)] ?? 10;
const ROOF = Math.min(Math.max(medRoof, 10), H - 4);

const DOOR_X = 4, DOOR_Z = 0;
// Pilaster columns on the long faces, and window bays between them
const isPilaster = (x, z, perim) => perim && (
  (z === 0 || z === 11) && (x === 2 || x === 6) ||
  (x === 0 || x === 8) && (z === 4 || z === 8)
);

// Pass 1: structure
for (const [x, z, grRaw] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const G = grRaw - y0;
  const R = ROOF;
  const perim = isPerim(x, z);
  const corner = isCorner(x, z);

  // Foundation and base course
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, G, z, "polished_granite");

  if (!perim) {
    // Floors and ceiling: solid slabs stand on the walls, never floating
    if (G + 4 <= R - 3) g.set(x, G + 4, z, "smooth_quartz");
    g.set(x, R - 2, z, "smooth_quartz");
    g.set(x, R - 1, z, "oxidized_copper");
    continue;
  }

  // Perimeter wall: quartz with a storey band at G+4
  for (let y = G + 1; y <= R - 3; y++) {
    if (corner) g.set(x, y, z, "quartz_pillar", { axis: "y" });
    else if (y === G + 4) g.set(x, y, z, "smooth_quartz");
    else g.set(x, y, z, "quartz_block");
  }
  // Cornice and parapet at the smoothed roof height
  g.set(x, R - 2, z, "smooth_quartz");
  g.set(x, R - 1, z, "quartz_slab", { type: "top", waterlogged: "false" });
}

// Pass 2: openings, pilasters, entrance, lights
for (const [x, z, grRaw] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const G = grRaw - y0;
  const R = ROOF;
  const perim = isPerim(x, z);
  const corner = isCorner(x, z);
  if (!perim) continue;

  // Pilasters: taller quartz columns stepping up the wall
  if (!corner && isPilaster(x, z, perim)) {
    for (let y = G + 1; y <= R - 3; y++) g.set(x, y, z, "quartz_pillar", { axis: "y" });
    continue;
  }

  // Regular window bays: two courses tall, lower and upper storey
  if (!corner) {
    const nearDoor = z === DOOR_Z && Math.abs(x - DOOR_X) <= 1;
    if (!nearDoor) {
      for (let y = G + 2; y <= G + 3 && y <= R - 4; y++) g.set(x, y, z, "glass");
      for (let y = G + 5; y <= R - 4; y++) g.set(x, y, z, "glass");
    }
  }

  // Entrance: dark oak door, lintel, flanking lanterns
  if (x === DOOR_X && z === DOOR_Z) {
    g.set(x, G + 1, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false"
    });
    g.set(x, G + 2, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false"
    });
    g.set(x, G + 3, z, "quartz_block");
    if (has(x - 1, z)) g.set(x - 1, G + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
    if (has(x + 1, z)) g.set(x + 1, G + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 3: central roof lantern cupola, sitting on the roof deck
const cupolaCells = [[4, 5], [4, 6], [3, 5], [5, 5], [3, 6], [5, 6]];
for (const [x, z] of cupolaCells) {
  if (!has(x, z) || isPerim(x, z)) continue;
  g.set(x, ROOF - 1, z, "quartz_block");
  g.set(x, ROOF, z, "quartz_block");
  g.set(x, ROOF + 1, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  g.set(x, ROOF + 2, z, "glass");
}
// Cupola roof cap; only on cells that exist in the footprint
if (has(4, 5) && !isPerim(4, 5)) g.set(4, ROOF + 3, 5, "oxidized_copper");

// Warm interior light: hanging lanterns under the ceiling
for (const [x, z, grRaw] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  if (isPerim(x, z)) continue;
  const G = grRaw - y0;
  if (((x === 2 || x === 6) && z === 4) || (x === 4 && z === 8)) {
    if (ROOF - 3 > G + 1) g.set(x, ROOF - 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC87081.nbt`);
