import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833608";
const W = 19, H = 23, D = 25;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Materials: a 1980s Taipei commercial block, cream tiled facade over a granite-look base,
// tinted blue-green glazing, quartz piers, flat roof with parapet and plant boxes.
const FOUNDATION = "stone_bricks";
const BASE = "polished_andesite";
const WALL = "smooth_quartz";
const PIER = "white_concrete";
const STOREY_LINE = "white_concrete";
const FLOOR = "light_gray_concrete";
const GLASS = "cyan_stained_glass";
const PARAPET = "smooth_quartz_slab";
const PLANT = "light_gray_concrete";
const LIGHT = "shroomlight";

// Edge / corner tests on the footprint
const missingCount = (x, z) =>
  (has(x - 1, z) ? 0 : 1) + (has(x + 1, z) ? 0 : 1) +
  (has(x, z - 1) ? 0 : 1) + (has(x, z + 1) ? 0 : 1);
const isEdge = (x, z) => missingCount(x, z) > 0;

// Entrance: on the north (z-min) edge, nearest the middle of the footprint
let doorCell = null;
{
  const xs = cells.map(c => c[0]);
  const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
  let best = Infinity;
  for (const [x, z, gy] of cells) {
    if (has(x, z - 1)) continue;
    const d = Math.abs(x - midX);
    if (d < best) { best = d; doorCell = [x, z, gy]; }
  }
}

for (const [x, z, gy] of cells) {
  // Foundation: solid from y=0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, FOUNDATION);

  // Base course at ground level
  put(x, gy, z, BASE);

  const edge = isEdge(x, z);
  const corner = missingCount(x, z) >= 2;
  const k = x + z;
  const pier = corner || k % 3 === 0;

  // Storey floor slabs at gy+5 and gy+10 (the roof deck sits at gy+10)
  for (const fy of [gy + 5, gy + 10]) {
    put(x, fy, z, edge ? STOREY_LINE : FLOOR);
  }

  if (edge) {
    // Ground storey shopfront: glazing with quartz piers
    for (let y = gy + 1; y <= gy + 4; y++) {
      put(x, y, z, pier ? WALL : GLASS);
    }
    // Upper storey: window grid
    for (let y = gy + 6; y <= gy + 9; y++) {
      put(x, y, z, pier ? PIER : GLASS);
    }
    // Parapet band and cap
    put(x, gy + 11, z, PARAPET, { type: "top", waterlogged: "false" });
  } else {
    // Interior: air behind the glass, with warm lights set back from the windows
    if (k % 5 === 0) {
      put(x, gy + 2, z, LIGHT);
      put(x, gy + 7, z, LIGHT);
    }
    // Roof plant boxes
    if (x % 5 === 2 && z % 6 === 3) {
      put(x, gy + 11, z, PLANT);
      put(x, gy + 12, z, PLANT);
    }
  }
}

// Entrance door (overrides the shopfront glass at the door cell)
if (doorCell) {
  const [dx, dz, dg] = doorCell;
  put(dx, dg + 1, dz, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(dx, dg + 2, dz, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Lantern over the entrance, inside the lobby
  put(dx, dg + 3, dz + 1, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
