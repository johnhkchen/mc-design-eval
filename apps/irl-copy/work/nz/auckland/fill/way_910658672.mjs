// Footprint 6 x 7 on Mt Eden's east-facing lower slope (lidar: ground 0-1 under it, roof 13 above y 0 everywhere, so the
// massing is one flat tier, not setbacks). Built as a three-storey brick commercial block of the 1920s-30s: a stone plinth,
// a shopfront on the street (north) face, brick upper floors with glass in alternating bays, stone string courses at each
// floor line, a cornice and a crenellated parapet, and a plant room on the roof. Interior air is kept behind the glass
// with a floor slab per storey, and warm lanterns sit in some of the rooms.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658672.cells.json", "utf8"));
const g = new Voxels([6, 26, 7]);

const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inside = (x, z) => foot.has(`${x},${z}`);
const ring = (x, z) => !(inside(x - 1, z) && inside(x + 1, z) && inside(x, z - 1) && inside(x, z + 1));
const top = Math.max(...cells.map((c) => c[3])) - 1;              // 12: the parapet's top layer (roof 13 = height above y 0)
const bay = (x, z) => (x + z) % 2 === 0;                          // alternating bays along every wall: glass or brick
const pier = (x, z) => ring(x, z) && (x + z) % 2 === 1;           // stone piers on the parapet, brick panels between

const SLABS = [0, 4, 8];                                          // floor lines: plinth/ground, first and second floor
const CORNICE = top - 1;                                          // 11
const DOOR = [3, 0];                                              // the street door, north face centre

for (const [x, z, ground] of cells) {
  const edge = ring(x, z);
  const north = z === 0;
  // floor slabs (interior air behind the glass), and the plinth on the ring (fills to the cell's ground under it)
  for (const y of SLABS) g.set(x, y, z, edge ? "stone_bricks" : "smooth_stone");   // ground 1 cells: the y 0 slab is their foundation
  // ground storey: shopfront glass on the street face, brick and stone elsewhere
  for (const y of [1, 2, 3]) {
    if (!edge) continue;
    if (north && [1, 2].includes(y) && !(x === DOOR[0] && z === DOOR[1])) { g.set(x, y, z, "glass_pane"); continue; }
    if (!north && y < 3 && bay(x, z)) { g.set(x, y, z, "glass_pane"); continue; }
    g.set(x, y, z, y === 3 && north ? "dark_oak_slab" : "stone_bricks", y === 3 && north ? { type: "bottom", waterlogged: "false" } : undefined);
  }
  // upper floors: brick walls, glass in alternating bays for the two windowed bands, stone lintels above each window
  for (const [lo, hi] of [[5, 7], [9, 11]]) {
    if (!edge) continue;
    for (let y = lo; y <= hi; y++) {
      if (y === 7 || y === 11) { g.set(x, y, z, "stone_bricks"); continue; }
      g.set(x, y, z, bay(x, z) ? "glass_pane" : "bricks");
    }
  }
  // cornice course and parapet on the ring, roof covering inside
  if (edge) {
    g.set(x, CORNICE, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    g.set(x, top, z, pier(x, z) ? "stone_bricks" : "bricks");   // parapet: stone piers between brick panels
  } else {
    g.set(x, CORNICE, z, "stone");
  }
}

// the street door: lower and upper halves, with a hood over it
g.set(DOOR[0], 1, DOOR[1], "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DOOR[0], 2, DOOR[1], "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(DOOR[0], 3, DOOR[1], "oak_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" });

// the plant room on the roof (interior cells only, standing on the roof covering)
for (const [x, z] of [[3, 2], [3, 3]]) if (!ring(x, z)) g.set(x, top, z, "iron_block");

// warm lights in some rooms: lanterns standing on the floor slabs, hanging under the slabs above, glowstone behind a glass bay
cells.forEach(([x, z]) => {
  if (ring(x, z)) return;
  if ((x + z) % 3 === 0) g.set(x, 5, z, "lantern", { hanging: "false", waterlogged: "false" });
  if ((x + z) % 3 === 1) g.set(x, 7, z, "lantern", { hanging: "true", waterlogged: "false" });
  if ((x + z) % 3 === 2) g.set(x, 9, z, "lantern", { hanging: "false", waterlogged: "false" });
});
g.set(3, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658672.nbt");
