// 1717 R St NW: a 1920s-era brick apartment block (Dupont Circle), four storeys over a stone plinth with a
// penthouse elevator cupola on the lidar's 9-block core. Storeys are 2 blocks: a pane row over a calcite string course.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70466.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inF = (x, z) => F.has(key(x, z));
const perimeter = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
// the lidar's 9-block cells are one 3x3 core (x3..5, z9..11); the rest of the roof is 8, so the stray 9s are noise
const core = (x, z) => x >= 3 && x <= 5 && z >= 9 && z <= 11;
const center = (x, z) => x === 4 && z === 10;
const door = (x, y, z) => z === 14 && (x === 4 || x === 5) && (y === 1 || y === 2);

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);

// glass bays read as windows: a brick pier at the corners and every fourth cell along a face, glass between
const pierCell = (x, z) => {
  const zFace = !inF(x, z - 1) || !inF(x, z + 1);
  const coord = zFace ? x : z;
  return coord % 4 === 0;
};
// a room cell directly behind a perimeter glass pane: its light shows through the glass
const behindGlass = (x, z) => !perimeter(x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => perimeter(x + dx, z + dz) && inF(x + dx, z + dz) && !pierCell(x + dx, z + dz));

for (const [x, z, ground] of cells) {
  const isCore = core(x, z);
  const top = isCore ? 8 : 7;
  const per = perimeter(x, z);
  for (let y = 0; y <= top; y++) {
    // ground floor level: the stone plinth where the ground is 1 (the foundation), a glazed basement row where it is 0 (downhill)
    if (y === 0) {
      if (ground === 1) put(x, y, z, "stone_bricks");
      else if (per) pierCell(x, z) ? put(x, y, z, "bricks") : put(x, y, z, "glass_pane");
      continue;
    }
    // floor slabs (string courses on the outside, slabs inside) at 1, 3, 5, 7
    if (y % 2 === 1) {
      if (isCore && y === 7) put(x, y, z, "smooth_stone");
      else if (isCore && y === 8 && center(x, z)) put(x, y, z, "lantern", { hanging: "false" });
      else if (isCore && y === 8) put(x, y, z, "calcite");
      else if (y === 7 && per) put(x, y, z, "calcite");
      else if (y !== 7 && per) put(x, y, z, "calcite");
      else put(x, y, z, "smooth_stone");
      continue;
    }
    // window rows at 2, 4, 6: glass panes between brick piers, the entrance doors on the street front
    if (door(x, y, z)) {
      const hinge = x === 4 ? "left" : "right";
      put(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge, open: "false", powered: "false" });
      continue;
    }
    if (isCore) {
      if (center(x, z)) continue;                       // the elevator shaft
      put(x, y, z, "bricks");
      continue;
    }
    if (per) {
      pierCell(x, z) ? put(x, y, z, "bricks") : put(x, y, z, "glass_pane");
      continue;
    }
    // interior: air behind the glass, with some warm lights in the rooms that face the street
    if (behindGlass(x, z) && (x * 3 + z * 5 + y) % 11 === 0) put(x, y, z, "glowstone");
    else if (behindGlass(x, z) && (x + 2 * z + y) % 13 === 0) put(x, y, z, "lantern", { hanging: "false" });
  }
}

// roof equipment: two HVAC housings on the roof deck
put(6, 8, 1, "light_gray_concrete");
put(7, 8, 1, "light_gray_concrete");
put(1, 8, 13, "iron_block");

// glass panes join the neighbouring panes and piers, as they would in the world
const joins = (x, y, z) => { const p = at(x, y, z); return !!p && (p.block === "glass_pane" || p.block === "bricks" || p.block === "calcite" || p.block === "stone_bricks" || p.block === "smooth_stone"); };
for (const [k, p] of plan) {
  if (p.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  p.state = { north: String(joins(x, y, z - 1)), south: String(joins(x, y, z + 1)), east: String(joins(x + 1, y, z)), west: String(joins(x - 1, y, z)), waterlogged: "false" };
}

const g = new Voxels([10, 21, 15]);
for (const [k, p] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, p.block, p.state);
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70466.nbt");
