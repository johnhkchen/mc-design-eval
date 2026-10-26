// DC58676: a 1930s stripped-classical federal office block on the Mall's north-east flank. Calcite (Indiana-limestone)
// walls on a granite plinth, a 3-block storey rhythm with a string course at each floor, a 3x5 tower rising from the
// main block's roof, a portico on the south face. Floors and roofs are solid across the footprint; walls only where a
// cell's outer face is exposed, so the inside is air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC58676.cells.json`, "utf8"));
const SIZE = [25, 26, 32];

const FLOORS = [1, 4, 7, 10];                    // ground slab, then one slab per storey
const WINDOW_LAYERS = [2, 3, 5, 6, 8, 9, 12];   // storey air: window bands
const DOOR_Z = 13, DOOR_X = [13, 14];
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Each cell's top solid layer. The lidar roof (11..14) is smoothed into three tiers: a 3x5 tower at 13, the rest at
// 10 (the lower wings, roof 11) or 11 (the main block, roof 12 to 13).
const cols = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, , r] of cells) {
  const tower = x >= 19 && x <= 21 && z >= 7 && z <= 11;
  cols.set(key(x, z), { T: tower ? 13 : r <= 11 ? 10 : 11 });
}
const colAt = (x, z) => cols.get(key(x, z));
const outsideNb = (x, z) => NB.some(([dx, dz]) => !colAt(x + dx, z + dz));
const lowerNb = (x, z, y) => NB.some(([dx, dz]) => { const n = colAt(x + dx, z + dz); return n && n.T < y; });
const outsideCount = (x, z) => NB.filter(([dx, dz]) => !colAt(x + dx, z + dz)).length;

const put = new Map();                           // "x,y,z" -> { block, state }
const set = (x, y, z, block, state) => put.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => put.has(`${x},${y},${z}`);

for (const k of cols.keys()) {
  const [x, z] = k.split(",").map(Number);
  const { T } = colAt(x, z);
  const outside = outsideNb(x, z);
  const floors = new Set([1, ...FLOORS, T]);     // a step down to a lower neighbour's roof is also a deck
  for (const [dx, dz] of NB) { const n = colAt(x + dx, z + dz); if (n && n.T < T) floors.add(n.T); }

  set(x, 0, z, "granite");                       // foundation under the whole footprint
  for (let y = 1; y <= T; y++) {
    if (floors.has(y)) {
      const block = y === 1 ? "polished_granite" : y === T ? "smooth_stone" : outside ? "smooth_quartz" : "smooth_stone";
      set(x, y, z, block);
      continue;
    }
    if (!outside && !lowerNb(x, z, y)) continue; // interior air
    const pier = (x + z) % 3 === 0;
    const corner = outsideCount(x, z) >= 2;
    const glass = WINDOW_LAYERS.includes(y) && !pier && !corner;
    set(x, y, z, glass ? "glass_pane" : "calcite");
  }
  if (outside || lowerNb(x, z, T)) set(x, T + 1, z, "calcite");          // parapet on the edges
  else if (T === 11 && x % 6 === 2 && z % 7 === 3) set(x, T + 1, z, "iron_block"); // roof plant, sparse
  else if (T === 13 && x === 20 && z === 9) set(x, T + 1, z, "iron_block");
}

// Entrance on the south face: a double door, then a portico projecting onto a granite stoop.
for (const x of DOOR_X) {
  const hinge = x === DOOR_X[0] ? "left" : "right";
  set(x, 2, DOOR_Z, "iron_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  set(x, 3, DOOR_Z, "iron_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
}
for (let x = 12; x <= 15; x++) {
  set(x, 0, 14, "granite");
  set(x, 1, 14, "polished_granite");
  set(x, 4, 14, "smooth_stone");                 // canopy, carried by the building's floor slab and two columns
}
for (const x of [12, 15]) { set(x, 2, 14, "calcite"); set(x, 3, 14, "calcite"); }
for (const x of [13, 14]) set(x, 3, 14, "lantern", { hanging: "true", waterlogged: "false" });

// Warm light: some windows get a glowstone just inside, in the air behind the glass.
for (const [k] of cols) {
  const [x, z] = k.split(",").map(Number);
  const { T } = colAt(x, z);
  for (const y of [5, 6, 8, 9]) {
    const pane = put.get(`${x},${y},${z}`);
    if (!pane || pane.block !== "glass_pane" || (x * 7 + z * 3 + y) % 9 !== 0) continue;
    for (const [dx, dz] of NB) {
      const n = colAt(x + dx, z + dz);
      if (!n || n.T < y || has(x + dx, y, z + dz)) continue;
      if (outsideNb(x + dx, z + dz) || lowerNb(x + dx, z + dz, y) || y === T) continue;
      set(x + dx, y, z + dz, "glowstone");
      break;
    }
  }
}

// Panes join their neighbours: another pane, a wall or a slab on each side.
const joins = (x, y, z) => { const p = put.get(`${x},${y},${z}`); return !!p && !["lantern", "iron_door"].includes(p.block); };
for (const [k, p] of put) {
  if (p.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const t = (b) => (b ? "true" : "false");
  p.state = { north: t(joins(x, y, z - 1)), south: t(joins(x, y, z + 1)), east: t(joins(x + 1, y, z)), west: t(joins(x - 1, y, z)), waterlogged: "false" };
}

const g = new Voxels(SIZE);
for (const [k, { block, state }] of put) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, block, state); }
const out = g.save(`${DIR}/DC58676.nbt`);
console.log("wrote", out);
