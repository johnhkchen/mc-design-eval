// DC57277: a 10 x 14 Federal-style office block on the Mall (Beaux-Arts, 1910s-30s), white limestone
// (calcite) walls on a stone-brick plinth, quartz pilasters on a 3-bay rhythm, smooth-stone string courses
// and cornice. The lidar roof is stepped into three flat tiers: an 8-block centre pavilion, 6-block shoulders,
// and 4-block wings. Hollow: an air gap behind the glass and a floor slab per storey, no furnished interior.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC57277.cells.json`, "utf8"));   // [x, z, ground, roof]

// lidar roof height -> clean flat tier (8 centre, 6 shoulders, 4 wings)
const tier = (r) => (r >= 7 ? 8 : r >= 5 ? 6 : 4);
const TOP = new Map();
for (const [x, z, , roof] of cells) TOP.set(`${x},${z}`, tier(roof));
const top = (x, z) => TOP.get(`${x},${z}`) ?? 0;   // 0 outside the footprint

// storey lines: a band (string course) at each floor; the top row is the cornice / roof deck
const bands = (t) => (t === 8 ? [3, 6] : t === 6 ? [3] : []);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a face is open at height y when the neighbour column does not reach y (outside counts as 0)
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => top(x + dx, z + dz) <= y);

const g = new Voxels([10, 20, 14]);
const glass = [];
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);

for (const [x, z, ground, roof] of cells) {
  const t = tier(roof);
  for (let y = 0; y < t; y++) {
    if (y < ground || y === 0) { put(x, y, z, "stone_bricks"); continue; }     // plinth / base course
    if (y === t - 1) { put(x, y, z, "smooth_stone"); continue; }                // cornice / roof deck
    const ex = exposed(x, z, y);
    if (bands(t).includes(y)) { put(x, y, z, "smooth_stone"); continue; }       // string course
    if (!ex.length) {                                                           // interior: floor slab or air
      if (bands(t).includes(y)) put(x, y, z, "smooth_stone");
      continue;
    }
    const horiz = ex.some(([dx]) => dx !== 0);       // an x-facing face: bays run along z
    const vert = ex.some(([, dz]) => dz !== 0);      // a z-facing face: bays run along x
    const c = horiz ? z : x;
    const corner = horiz && vert;
    const front = z === 0 && vert;                   // the Mall front, entered at the centre
    const door = front && x === 5 && (y === 1 || y === 2);
    if (door) {
      const half = y === 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const pier = corner || c % 3 === 0 || (front && (c === 4 || c === 6));
    if (pier) put(x, y, z, "quartz_pillar", { axis: "y" });
    else { put(x, y, z, "glass_pane"); glass.push([x, y, z]); }
  }
}

// rooftop plant on the shoulder roofs (1 high, on the cap)
for (const [x, z] of [[3, 4], [3, 5], [7, 10], [7, 11]]) put(x, 6, z, "light_gray_concrete");

// warm lights standing on the floor just inside the front and back windows (air above a solid floor)
const lamp = (x, y, z) => {
  if (g.get(x, y, z) || !g.get(x, y - 1, z)) return;
  put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
};
for (let x = 0; x < 10; x++) for (const z of [1, 12]) {
  if (!top(x, z)) continue;
  for (const y of [1, 4]) if (top(x, z) > y + 1 && g.get(x, y, z) === null && g.get(x, y - 1, z) && x % 2 === 0) lamp(x, y, z);
}

// glass panes connect to the solid neighbours beside them (as the game would set them)
const solid = (b) => b && b.block !== "minecraft:glass_pane" && b.block !== "minecraft:dark_oak_door" && b.block !== "minecraft:lantern";
const link = (n) => (n && (n.block === "minecraft:glass_pane" || solid(n)) ? "true" : "false");
for (const [x, y, z] of glass) {
  const state = {
    east: link(g.get(x + 1, y, z)), west: link(g.get(x - 1, y, z)),
    north: link(g.get(x, y, z - 1)), south: link(g.get(x, y, z + 1)), waterlogged: "false",
  };
  put(x, y, z, "glass_pane", state);
}

g.save(`${DIR}/DC57277.nbt`);
