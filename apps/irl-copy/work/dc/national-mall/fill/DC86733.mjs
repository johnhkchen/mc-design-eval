// DC86733: a Federal-era limestone office block on the Mall's flank, four storeys to a cornice with a
// tower set back in the middle. Calcite and smooth-quartz walls on a granite plinth; string courses at y4 and y8;
// a window bay every four cells (pier, two-cell window, spandrel); a few lit windows; a north entrance under a hood;
// a parapet on each tier's edge and a copper-capped penthouse on the body roof. Interiors are air (glass has air
// behind it) with a floor slab at each storey line.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86733.cells.json`, "utf8"));

const W = 16, H = 27, D = 13;

// lidar roof heights (12..16, noisy) -> three clean tiers: the tower (16), the wing (14), the body (13)
const tier = (r) => (r >= 15 ? 16 : r === 14 ? 14 : 13);
const top = new Map();
for (const [x, z, , r] of cells) top.set(`${x},${z}`, tier(r));
// a cell's top height (0 outside the footprint); open = nothing solid on that side at height y
const T = (x, z) => top.get(`${x},${z}`) ?? 0;
const open = (x, z, y) => T(x, z) <= y;

const g = new Voxels([W, H, D]);

// glass pane joined along the wall it sits in
function pane(alongX) {
  const on = "true", off = "false";
  return { east: alongX ? on : off, west: alongX ? on : off, north: alongX ? off : on, south: alongX ? off : on, waterlogged: "false" };
}

// the facade block of a wall cell; a = its position along the face (x on north/south faces, z on east/west)
function facade(y, t, a, alongX) {
  if (y === t - 1 || y === 3 || y === 4 || y === 8) return { block: "smooth_quartz" };   // cornice, head course, string courses
  const ground = y <= 2;
  const bay = a % 4;                                                                     // 0 pier, 1-2 window, 3 spandrel
  if (bay === 0) return { block: ground ? "polished_granite" : "smooth_quartz" };
  if (bay === 3) return { block: ground ? "polished_granite" : "calcite" };
  const lit = Math.floor(a / 4) % 4 === 1 && (y === 2 || y === 6 || y === 10);
  if (lit) return { block: "glowstone" };
  return { block: "glass_pane", state: pane(alongX) };
}

for (const [x, z] of cells) {
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }                     // plinth on the lowest ground
    const n = open(x, z - 1, y), s = open(x, z + 1, y), w = open(x - 1, z, y), e = open(x + 1, z, y);
    if (!(n || s || w || e)) {
      // no wall here: a floor slab at each storey line and the roof deck, air between
      if (y === 4 || y === 8 || y === 12 || y === t - 1) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const alongX = n || s;
    const f = facade(y, t, alongX ? x : z, alongX);
    g.set(x, y, z, f.block, f.state);
  }
  // parapet on the outer edge of each tier's roof
  if (open(x, z - 1, t - 1) || open(x, z + 1, t - 1) || open(x - 1, z, t - 1) || open(x + 1, z, t - 1)) {
    g.set(x, t, z, "smooth_quartz_slab", { type: "bottom" });
  }
}

// north entrance: a pair of iron doors in a granite surround, under a stair hood at y4
for (const x of [10, 11]) {
  const hinge = x === 10 ? "left" : "right";
  g.set(x, 1, 0, "iron_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, 2, 0, "iron_door", { half: "upper", hinge, powered: "false" });
}
for (let y = 1; y <= 3; y++) g.set(9, y, 0, "polished_granite");
for (let x = 9; x <= 12; x++) g.set(x, 4, 0, "polished_granite_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" });

// roof penthouse on the body (copper cap), standing on the deck at y12
for (const [x, z] of [[4, 9], [5, 9], [4, 10], [5, 10]]) {
  for (const y of [13, 14]) g.set(x, y, z, "calcite");
  g.set(x, 15, z, "oxidized_cut_copper_slab", { type: "bottom" });
}

const out = `${DIR}/DC86733.nbt`;
console.log(g.save(out));
