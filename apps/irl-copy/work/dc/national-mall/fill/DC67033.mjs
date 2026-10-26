// 1200 block H St NW (vacant, abutting): a c. 1925 five-storey red-brick commercial block with pale limestone trim,
// a glazed shopfront on its north (street) face and a Classical stone cornice. The lidar roof is stepped into four
// tiers from its 3x3 median: a 16-block nave (five storeys), 14-block shoulders (four), 12-block wings (four) and 6 and
// 3-block low ends and an inner light court (two and one). A penthouse with a stone cap sits on the nave and two rooftop
// units on the south-west wing. Every cell is solid from y 0 to its top, with a floor course at each storey line, so
// nothing floats; windows are glass panes in brick piers with an air gap behind them and warm lanterns in some.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC67033.cells.json`, "utf8"));

const W = 35, H = 28, D = 18;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, , roof]) => [key(x, z), roof]));

// ---- massing: 3x3 median of the lidar roof, snapped to flat tiers (a 1-block noise cell does not make a tier) ----
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const tier = (m) => (m >= 15 ? 16 : m >= 13 ? 14 : m >= 9 ? 12 : m >= 5 ? 6 : 3);
const top = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const r = raw.get(key(x + dx, z + dz)); if (r !== undefined) near.push(r);
  }
  top.set(key(x, z), tier(median(near)));
}
const T = (x, z) => top.get(key(x, z)) ?? -1;   // -1 = outside the footprint

// A cell's open sides at row y: the neighbour is outside the footprint or stands lower than y.
const DIRS = [["N", 0, -1], ["S", 0, 1], ["E", 1, 0], ["W", -1, 0]];
const sides = (x, z, y) => DIRS.filter(([, dx, dz]) => T(x + dx, z + dz) <= y).map(([d]) => d);

const BRICK = "bricks", TRIM = "calcite", PLINTH = "polished_granite", CORNICE = "stone_bricks";
const SOLID = "stone", DECK = "smooth_stone", BOARD = "spruce_planks", PANE = "glass_pane";
const DOOR_X = 17;   // the one street entrance, centred on the north face

const hash = (x, y, z, m, k) => ((x * 31 + y * 17 + z * 11 + k) % m + m) % m;

// The exterior role of a window-row cell (y % 3 === 1): corner quoin, pier, pane, or a boarded pane.
const windowOrPier = (x, z, y, ns) => {
  const pier = ns ? x % 3 === 0 : z % 3 === 0;
  if (pier) return [z === 0 && ns && y === 1 ? PLINTH : BRICK];
  return hash(x, y, z, 37, 0) === 0 ? [BOARD] : [PANE];
};

// ---- one cell's block at (x, y, z), as [name, state?], or null for air ----
function role(x, z, y) {
  const t = T(x, z);
  if (t < 0 || y >= t) return null;
  const sd = sides(x, z, y);
  const out = sd.length > 0;
  const ew = sd.some((s) => s === "E" || s === "W");
  const ns = sd.some((s) => s === "N" || s === "S");

  // the street entrance: two-leaf oak door with a stone surround, in the shopfront bay
  if (z === 0 && x === DOOR_X && (y === 1 || y === 2)) {
    return ["dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (y === 0) return [out ? PLINTH : SOLID];                   // plinth course, foundation under the ground
  if (y === t - 1) return [out ? CORNICE : DECK];               // cornice / parapet, roof deck inside
  if (y % 3 === 0) return [out ? TRIM : SOLID];                 // floor course at each storey line
  if (y % 3 === 1) {                                            // window rows
    if (out) {
      if (ew && ns) return [TRIM];                              // quoins at the corners
      return windowOrPier(x, z, y, ns);
    }
    // not on the face: the air gap behind the glass, lit by a hanging lantern in some bays
    const behindGlass = DIRS.some(([, dx, dz]) => T(x + dx, z + dz) > y && sides(x + dx, z + dz, y).length > 0);
    if (behindGlass && hash(x, y, z, 7, 0) === 0) return ["lantern", { hanging: "true", waterlogged: "false" }];
    return behindGlass ? null : [SOLID];
  }
  // spandrel rows (y % 3 === 2): brick, a transom of glass in the shopfront, quoins at the corners
  if (out) {
    if (ew && ns) return [TRIM];
    if (y === 2 && z === 0 && ns) return [x % 3 === 0 ? PLINTH : PANE];
    return [BRICK];
  }
  return [SOLID];
}

// ---- penthouse: a stone-capped box set back on the nave's roof, x 10..15, z 3..6, y 16..18 ----
const PH = { x0: 10, x1: 15, z0: 3, z1: 6, y0: 16, y1: 18 };
function penthouse(x, y, z) {
  if (x < PH.x0 || x > PH.x1 || z < PH.z0 || z > PH.z1 || y < PH.y0 || y > PH.y1) return null;
  const ring = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
  const corner = (x === PH.x0 || x === PH.x1) && (z === PH.z0 || z === PH.z1);
  if (y === PH.y0) return [ring ? TRIM : SOLID];
  if (y === PH.y1) return [ring ? CORNICE : DECK];
  if (ring) return [corner ? TRIM : PANE];                      // glass band in the middle storey
  return null;                                                   // air gap behind the glass
}

// ---- place everything, then connect the panes to their neighbours ----
const placed = new Map();
const put = (x, y, z, name, state) => {
  if (!g.inBounds(x, y, z)) return;
  g.set(x, y, z, name, state);
  placed.set(`${x},${y},${z}`, name);
};
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  for (let y = 0; y < H; y++) {
    const r = role(x, z, y);
    if (r) put(x, y, z, r[0], r[1]);
  }
}
for (let y = PH.y0; y <= PH.y1; y++) for (let z = PH.z0; z <= PH.z1; z++) for (let x = PH.x0; x <= PH.x1; x++) {
  const r = penthouse(x, y, z);
  if (r) put(x, y, z, r[0], r[1]);
}
// rooftop units: two iron boxes on the south-west wing's roof (its top is 12, the cells at 4..5 x 14..15)
for (const x of [4, 5]) for (const z of [14, 15]) for (const y of [12, 13]) put(x, y, z, "iron_block");

// a pane joins each neighbour that is a block (panes, piers, walls); lanterns and doors do not connect
const joins = (x, y, z) => { const n = placed.get(`${x},${y},${z}`); return n !== undefined && n !== "lantern" && !n.endsWith("_door") ? "true" : "false"; };
for (const [k, name] of placed) {
  if (name !== PANE) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, PANE, {
    north: joins(x, y, z - 1), south: joins(x, y, z + 1), east: joins(x + 1, y, z), west: joins(x - 1, y, z), waterlogged: "false",
  });
}

g.save(`${DIR}/DC67033.nbt`);
