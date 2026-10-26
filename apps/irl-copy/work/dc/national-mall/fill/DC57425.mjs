// 1020 19th St NW (Commercial-Office-Large), Foggy Bottom: a 1970s-era limestone-clad office block, seven storeys on
// a stepped massing (lidar roof heights, 3x3-median smoothed, snapped to tiers 3 / 12 / 15 / 18 / 21). Storeys are
// 3 blocks, anchored to absolute y so the storey lines run level across tiers: y % 3 == 0 is a calcite spandrel,
// y = roof-1 a smooth-quartz cornice, the rest is glazing with polished-andesite mullions every third bay. Interior
// cells are air except one floor slab per storey and the roof slab, so the glass has an air gap behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC57425.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 28, D = 32, H = 33;
const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const at = (x, z) => raw.get(key(x, z));

// lidar noise: the 3x3 median of the roof heights (footprint cells only), then snapped to the massing tiers
const snap = (r) => (r <= 4 ? 3 : r <= 13 ? 12 : r <= 16 ? 15 : r <= 19 ? 18 : 21);
const median = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = at(x + dx, z + dz); if (c) v.push(c.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const roof = new Map(cells.map(([x, z]) => [key(x, z), snap(median(x, z))]));

// faces: +x, -x, +z, -z. A face is exposed when the cell beside it is outside the footprint or lower.
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z) => {
  const r = roof.get(key(x, z));
  return DIRS.map(([dx, dz]) => { const n = roof.get(key(x + dx, z + dz)); return n === undefined || n < r; });
};

const CALCITE = "calcite", QUARTZ = "smooth_quartz", FRAME = "polished_andesite", GLASS = "light_blue_stained_glass";
const FOUNDATION = "stone_bricks", FLOOR = "smooth_stone", ROOF = "light_gray_concrete";
const DOOR = "oak_door", LANTERN = "lantern", MECH = "light_gray_concrete";

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const gr = at(x, z).g, r = roof.get(key(x, z));
  const [e, w, s, n] = exposed(x, z);
  const perim = e || w || s || n;
  const corner = (e || w) && (s || n);
  const bay = (s || n) && !(e || w) ? x : z;   // the bay index along the exposed face
  for (let y = 0; y < r; y++) {
    if (y < gr) { put(x, y, z, FOUNDATION); continue; }
    if (perim) {
      if (y === r - 1) put(x, y, z, QUARTZ);                    // cornice / parapet cap
      else if (y === 0) put(x, y, z, FRAME);                    // base course (shopfront plinth)
      else if (y % 3 === 0) put(x, y, z, CALCITE);              // storey line
      else if (corner || bay % 3 === 0) put(x, y, z, FRAME);    // mullion
      else put(x, y, z, GLASS);                                 // glazing, air behind
    } else {
      if (y === r - 1) put(x, y, z, ROOF);
      else if (y === gr || y % 3 === 0) put(x, y, z, FLOOR);
      else if (y % 3 === 2 && y <= r - 2 && (x * 7 + z * 5 + y) % 13 === 0) put(x, y, z, LANTERN, { hanging: "true" });
    }
  }
}

// entrance on the south face: double doors under a lintel, and a canopy band (dark slabs) over the bays of the door
for (const x of [4, 5]) {
  const hinge = x === 4 ? "left" : "right";
  put(x, 0, 28, DOOR, { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  put(x, 1, 28, DOOR, { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
  put(x, 2, 28, CALCITE);
}
for (const x of [3, 4, 5, 6]) put(x, 3, 28, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

// roof plant: a penthouse on the tower roof and a plant box on the north wing
for (const [x0, z0, y0] of [[8, 19, 21], [20, 3, 15]]) {
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) for (let y = y0; y < y0 + 2; y++) put(x0 + dx, y, z0 + dz, MECH);
}

const res = g.save(`${DIR}/DC57425.nbt`);
console.log(JSON.stringify(res));
