// 53 West 53rd Street, 2015 mixed residential and commercial tower: a 288-block (about 320 m) glass tower on a
// six-storey granite podium that runs the whole lot, with a 60-block residential wing on the south side and a 64-block
// bulkhead on it. The tower shaft steps back at 150 and 230 to a 288 roof, with a 294 mechanical crown. The lidar column
// reads about 1 block over most of this footprint (136 only at its west edge), which is not the record's roof, so the
// massing follows the record and the lidar is not used for height. Tiers nest, so each stands on the one below. Skin is
// blue glass in light-grey bands, with grey mullions every third block and an air gap and a floor slab behind it (no
// interiors). Lit panes are glowstone in the gap. The podium has a granite base, a glass shopfront, and a moss terrace
// on its roof. The street entrance is a recessed portico at z 0 (53rd Street side), with a dark oak door and lanterns.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1090777.cells.json`, "utf8"));
const X = 35, Y = 300, Z = 55;
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => cell.has(`${x},${z}`);
const groundAt = (x, z) => (inF(x, z) ? cell.get(`${x},${z}`).ground : 0);
const inBox = (x, z, [x0, x1, z0, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
const key = (x, y, z) => `${x},${y},${z}`;

// Roof tops (block heights above y 0), nested so every tier stands on the one below.
const roofAt = (x, z) => {
  if (!inF(x, z)) return 0;
  if (inBox(x, z, [14, 20, 18, 32])) return 294;   // mechanical crown
  if (inBox(x, z, [12, 22, 16, 34])) return 288;   // tower roof
  if (inBox(x, z, [10, 24, 14, 36])) return 230;   // second setback
  if (inBox(x, z, [8, 26, 12, 38])) return 150;    // first setback, the shaft
  if (z >= 39) return inBox(x, z, [2, 8, 44, 50]) ? 64 : 60;   // south wing and its bulkhead
  return 18;                                       // six-storey podium over the rest of the lot
};

const cols = [...cell.keys()].map((k) => k.split(",").map(Number))
  .map(([x, z]) => [x, z, roofAt(x, z), groundAt(x, z)]).filter(([, , r]) => r > 0);
const maxRoof = Math.max(...cols.map((c) => c[2]));

// Depth from the outside at height y: 1 = outer skin, 2 = the air gap behind it, 3 and more = solid core.
const depthAt = (y) => {
  const d = new Int32Array(X * Z).fill(-1);
  for (const [x, z, r, gr] of cols) if (y >= gr && y < r) d[z * X + x] = 0;
  const at = (x, z) => (x >= 0 && z >= 0 && x < X && z < Z ? d[z * X + x] : -1);
  const q = [];
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    if (d[z * X + x] !== 0) continue;
    if (dirs.some(([dx, dz]) => at(x + dx, z + dz) < 0)) { d[z * X + x] = 1; q.push([x, z]); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i], k = d[z * X + x];
    for (const [dx, dz] of dirs) if (at(x + dx, z + dz) === 0) { d[(z + dz) * X + x + dx] = k + 1; q.push([x + dx, z + dz]); }
  }
  return { at, exterior: (x, z) => dirs.find(([dx, dz]) => at(x + dx, z + dz) < 0) };
};

const KIND = (r) => (r <= 18 ? "podium" : r === 294 ? "mech" : r >= 150 ? "tower" : "wing");
const COVER = { podium: "moss_block", wing: "gray_concrete", tower: "gray_concrete", mech: "smooth_quartz" };
const CORNICE = { podium: "calcite", wing: "calcite", tower: "polished_andesite", mech: "smooth_quartz" };
const CORE = { podium: "stone_bricks", wing: "light_gray_concrete", tower: "light_gray_concrete", mech: "smooth_quartz" };
const GLASS = new Set(["glass", "light_blue_stained_glass"]);

// Outer skin on a face at height y (u = position along the face): base course, storey bands, mullions, glass.
const skin = (kind, y, top, u) => {
  if (y === top) return [CORNICE[kind]];
  if (kind === "mech") return ["smooth_quartz"];
  if (kind === "podium" && y === 1) return ["polished_andesite"];
  if (y % 3 === 0) return [kind === "podium" ? "polished_andesite" : "light_gray_concrete"];
  if (u % 3 === 0) return [kind === "podium" ? "polished_andesite" : "gray_concrete"];
  return [kind === "podium" ? "glass" : "light_blue_stained_glass"];
};

const plan = new Map();                    // "x,y,z" -> [block, state]
const put = (x, y, z, block, state) => plan.set(key(x, y, z), [block, state]);
const air2 = [];                           // air-gap cells that may hold a lit window

const maxY = maxRoof;
for (let y = 0; y < maxY; y++) {
  const { at, exterior } = depthAt(y);
  for (const [x, z, r, gr] of cols) {
    if (y >= r) continue;
    if (y < gr) { put(x, y, z, "stone_bricks"); continue; }   // foundation under the cell's ground
    const kind = KIND(r), top = r - 1, dep = at(x, z);
    if (dep === 1) {
      const [, dz] = exterior(x, z);
      put(x, y, z, skin(kind, y, top, dz ? x : z)[0]);
    } else if (y === top) put(x, y, z, COVER[kind]);     // roof cover (moss terrace on the podium)
    else if (dep >= 3 || kind === "mech") put(x, y, z, CORE[kind]);
    else if (y % 3 === 0) put(x, y, z, "light_gray_concrete");   // floor slab in each storey
    else air2.push([x, y, z]);
  }
}

// Warm light: glowstone in the gap behind some glass panes.
for (const [x, y, z] of air2) {
  const behindGlass = dirs.some(([dx, dz]) => GLASS.has(plan.get(key(x + dx, y, z + dz))?.[0]));
  if (behindGlass && (x * 5 + y * 7 + z * 3) % 11 === 0) put(x, y, z, "glowstone");
}

// Street entrance: a recessed portico on the z 0 face at x 15..19. Dark oak door at x 17, glass either side, lanterns
// hanging from the granite lintel at y 3.
for (const x of [15, 16, 17, 18, 19]) for (const y of [1, 2]) { plan.delete(key(x, y, 0)); }
for (const x of [15, 16, 18, 19]) { put(x, 1, 1, "polished_andesite"); put(x, 2, 1, "glass"); }
plan.delete(key(17, 1, 1)); plan.delete(key(17, 2, 1));
for (const x of [15, 16, 17, 18, 19]) put(x, 3, 0, "polished_andesite");
put(17, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(17, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(15, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
put(19, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });

const g = new Voxels([X, Y, Z]);
for (const [k, [block, state]] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const { blocks, palette } = g.save(`${DIR}/NYC1090777.nbt`);
console.log(`NYC1090777.nbt: ${blocks} blocks, palette ${palette}, roof ${maxRoof} blocks, footprint ${cols.length} cells`);
