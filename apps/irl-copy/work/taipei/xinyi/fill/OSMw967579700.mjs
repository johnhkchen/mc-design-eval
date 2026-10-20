import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw967579700";
const W = 2, H = 23, D = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Bounds-checked setter; props optional.
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const GLASS = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const PILLAR = { axis: "y" };
const DOOR_LO = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UP = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

// Mid-rise 1980s-style Taipei commercial block: quartz-tile walls, granite plinth,
// stone-brick cornice, red awning at the entrance, glass shopfront below,
// punched window grid above, a few warm lit windows, roof plant box.
for (const cell of cells) {
  const x = cell[0];
  const z = cell[1];
  const gr = Math.round(cell[2]);
  const b = gr + 1;      // first building block, stands on the ground
  const T = gr + 11;     // roof surface (about 11 blocks above lowest ground)

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Solid wall column from base to roof.
  for (let y = b; y <= T; y++) put(x, y, z, "quartz_block");

  // Plinth course.
  put(x, b, z, "polished_granite");

  for (let y = b; y <= T; y++) {
    const rel = y - b;

    // Storey lines (floor bands) at rel 4 and rel 9.
    if (rel === 4 || rel === 9) put(x, y, z, "polished_andesite");

    // Cornice / parapet at roof level.
    if (rel === 10) put(x, y, z, "stone_bricks");

    // Ground-floor shopfront glazing, rel 1..3, with quartz mullions.
    if (rel >= 1 && rel <= 3 && z >= 1 && z <= 21) {
      if (z % 4 === 2) put(x, y, z, "quartz_pillar", PILLAR);
      else put(x, y, z, "glass_pane", GLASS);
    }

    // Upper-storey window grid, rel 5..8.
    if (rel >= 5 && rel <= 8 && z >= 1 && z <= 21) {
      if (z % 4 === 2) put(x, y, z, "quartz_pillar", PILLAR);
      else if (rel === 6 && z % 6 === 3 && (x + z) % 2 === 0) put(x, y, z, "glowstone");
      else put(x, y, z, "glass_pane", GLASS);
    }

    // Entrance end (z = 0): glazed bay on the open side, red awning over the door line.
    if (z === 0 && rel >= 1 && rel <= 3 && x === 1) put(x, y, z, "glass_pane", GLASS);
    if (z <= 1 && rel === 4) put(x, y, z, "red_terracotta");
  }

  // Entrance door on the west-end column at z = 0.
  if (z === 0 && x === 0) {
    put(x, b, z, "dark_oak_door", DOOR_LO);
    put(x, b + 1, z, "dark_oak_door", DOOR_UP);
  }

  // Roof plant box on one column.
  if (z === 11 && x === 0) {
    put(x, T + 1, z, "light_gray_concrete");
    put(x, T + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
