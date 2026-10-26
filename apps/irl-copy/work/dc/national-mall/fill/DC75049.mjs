// DC75049: a 1930s Federal-style commercial block on the Mall's flank: granite plinth, Indiana-limestone shell
// (calcite piers, smooth-quartz bands), gray glass windows in quartz frames, a stepped massing that follows the lidar
// roof in clean tiers (8-block core, 7 setback, 5 and 3 wings), a parapet and rooftop plant. Hollow: one-block air
// gap behind each window, a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75049.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75049.nbt";

const X = 8, Y = 20, Z = 9;
const fp = new Map(cells.map(([x, z, g, R]) => [`${x},${z}`, { g, R }]));
const inFp = (x, z) => fp.has(`${x},${z}`);

// lidar roof -> clean tier: 8 core, the east edge steps down to 7, the lower wings sit at 5 and 3
const tierTop = (R, x) => {
  if (R >= 8) return 8;
  if (R === 7) return x === 7 ? 7 : 8;
  if (R >= 5) return 5;
  if (R === 4) return 4;
  return 3;
};

const B = new Map();
const put = (x, y, z, block, state, extra = {}) => B.set(`${x},${y},${z}`, { block, state, ...extra });
const solid = (x, y, z) => B.has(`${x},${y},${z}`);

for (const [x, z, g, R] of cells) {
  const T = tierTop(R, x);
  const shell = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inFp(x + dx, z + dz));
  const horiz = !inFp(x, z - 1) || !inFp(x, z + 1);           // exposed on a north or south face: the run runs along x
  const idx = horiz ? x : z;                                    // bay index along that facade
  for (let y = 0; y < T; y++) {
    if (y < g || y === 0) { put(x, y, z, "polished_andesite"); continue; }  // foundation fill, then the grey stone base
    if (!shell) {
      if (y === T - 1 || (y === 4 && T - 1 > 4)) put(x, y, z, "smooth_stone");  // roof slab and storey floor
      else if (y === 3 && T >= 5 && (x + 2 * z) % 5 === 0) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;                                                                 // otherwise air: the gap behind the glass
    }
    if (y === 1) { put(x, y, z, "polished_andesite"); continue; }             // plinth
    if (y === T - 1) {                                                        // cornice, or the parapet on the tallest tier
      put(x, y, z, T === 8 && idx % 2 === 1 ? "calcite" : "smooth_quartz");   // parapet panels alternate with piers
      continue;
    }
    if (y === 2 || y === 5) {                                                 // window row: a pane on odd bays, a pier otherwise
      if (idx % 2 === 1) put(x, y, z, "gray_stained_glass_pane", null, { pane: true, face: horiz ? "h" : "v" });
      else put(x, y, z, "quartz_pillar", { axis: "y" });                     // pilasters between the bays
      continue;
    }
    put(x, y, z, "smooth_quartz");                                            // lintel, string course and cornice bands
  }
}

// entrance on the north frontage, with a glazed shopfront either side of it
put(3, 1, 0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(3, 2, 0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [4, 5, 6]) put(x, 2, 0, "glass");

// rooftop plant room on the core, standing on the roof slab
for (const [x, z] of [[2, 2], [3, 2], [2, 3], [3, 3]]) {
  put(x, 8, z, "stone_bricks");
  put(x, 9, z, "stone_bricks");
}

// panes connect to the neighbours on their own face
for (const [key, c] of B) {
  if (!c.pane) continue;
  const [x, y, z] = key.split(",").map(Number);
  const h = c.face === "h";
  c.state = {
    north: String(!h && solid(x, y, z - 1)),
    south: String(!h && solid(x, y, z + 1)),
    east: String(h && solid(x + 1, y, z)),
    west: String(h && solid(x - 1, y, z)),
    waterlogged: "false",
  };
  c.block = "gray_stained_glass_pane";
}

const g = new Voxels([X, Y, Z]);
for (const [key, c] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, c.block, c.state);
}
const out = g.save(OUT);
console.log(JSON.stringify(out));
