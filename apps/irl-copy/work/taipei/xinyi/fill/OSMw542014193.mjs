import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542014193.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542014193.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 15, H = 23, D = 31;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const S = new Set(cells.map(([x, z]) => key(x, z)));
const inside = (x, z) => S.has(key(x, z));
const isEdge = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

// Entrance: the edge cell on the minimum-z face nearest the mean x of that face.
const minZ = Math.min(...cells.map(([, z]) => z));
const faceX = cells.filter(([x, z]) => z === minZ && isEdge(x, z)).map(([x]) => x);
const entranceX = faceX.length
  ? Math.round(faceX.reduce((a, b) => a + b, 0) / faceX.length)
  : -1;

const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };
const PILLAR = { axis: "y" };

for (const [x, z, b] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);

  if (!edge) {
    // Interior: floor slabs per storey, roof slab, air between. No furnishing.
    g.set(x, b, z, "smooth_stone");
    g.set(x, b + 5, z, "smooth_stone");
    g.set(x, b + 10, z, "light_gray_concrete");
    // Warm light just behind some upper windows.
    if ((x * 7 + z * 3) % 5 === 0) g.set(x, b + 7, z, "shroomlight");
    continue;
  }

  // Facade: base course.
  g.set(x, b, z, "stone_bricks");

  const pier = (x + z) % 3 === 0;
  const isEntrance = z === minZ && x === entranceX;

  // Ground floor shopfront (b+1..b+3).
  if (isEntrance) {
    g.set(x, b + 1, z, "dark_oak_door", DOOR_LOWER);
    g.set(x, b + 2, z, "dark_oak_door", DOOR_UPPER);
    g.set(x, b + 3, z, "smooth_quartz");
    // Lantern on the floor just inside the entrance.
    if (inside(x, z + 1) && !isEdge(x, z + 1)) {
      g.set(x, b + 1, z + 1, "lantern", { hanging: "false", waterlogged: "false" });
    }
  } else {
    for (let dy = 1; dy <= 3; dy++) {
      g.set(x, b + dy, z, pier ? "quartz_pillar" : "glass", pier ? PILLAR : undefined);
    }
  }

  // Lintel band and storey line.
  g.set(x, b + 4, z, "smooth_quartz");
  g.set(x, b + 5, z, "smooth_quartz");

  // Upper storey windows (b+6..b+8) with quartz piers.
  for (let dy = 6; dy <= 8; dy++) {
    g.set(x, b + dy, z, pier ? "quartz_pillar" : "light_blue_stained_glass", pier ? PILLAR : undefined);
  }

  // Head band, cornice, parapet cap.
  g.set(x, b + 9, z, "smooth_quartz");
  g.set(x, b + 10, z, "smooth_quartz");
  g.set(x, b + 11, z, "quartz_slab", SLAB_BOTTOM);
}

// Roof plant: a small penthouse block set on the interior roof, away from the parapet.
for (const [x, z, b] of cells) {
  if (isEdge(x, z)) continue;
  if (x >= 5 && x <= 9 && z >= 11 && z <= 19) {
    g.set(x, b + 11, z, "white_concrete");
    g.set(x, b + 12, z, "white_concrete");
  }
}
// Roof plant cap, only where the penthouse sits on a real roof cell.
for (const [x, z, b] of cells) {
  if (isEdge(x, z)) continue;
  if (x >= 5 && x <= 9 && z >= 11 && z <= 19) {
    g.set(x, b + 13, z, "smooth_stone_slab", SLAB_BOTTOM);
  }
}

g.save(OUT);
