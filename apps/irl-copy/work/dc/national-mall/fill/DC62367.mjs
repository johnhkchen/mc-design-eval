// 611 N St NW (Special Purpose, misc.): a two-storey red-brick civic block with sandstone quoins and cornice, on a U-plan
// that opens south into a courtyard. Lidar is flat (ground 0, roof 4 everywhere), so the massing is one tier: a stone
// plinth at y 0, two storeys at y 1-2, and the cornice/roof at y 3, with two copper roof units on top at y 4.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC62367.cells.json`, "utf8"));

const W = 14, D = 10, H = 16;
const TOP = 4;                                    // lidar roof height above y 0
const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, gr, roof]) => [key(x, z), { gr: Math.round(gr), roof: Math.round(roof) }]));
const has = (x, z) => cell.has(key(x, z));
for (const { gr, roof } of cell.values()) if (gr !== 0 || roof !== TOP) throw new Error(`expected flat lidar, got ground ${gr} roof ${roof}`);

const P = new Map();                              // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => P.set(`${x},${y},${z}`, { block, state });

// an exposed face: a footprint cell with no footprint neighbour in direction (dx, dz)
const exposed = (x, z, dx, dz) => has(x, z) && !has(x + dx, z + dz);
// the run of cells sharing that face: u = index from the run's start, L = its length
function run(x, z, dx, dz) {
  const [sx, sz] = dx === 0 ? [1, 0] : [0, 1];
  let s = 0; while (exposed(x - sx * (s + 1), z - sz * (s + 1), dx, dz)) s++;
  let e = 0; while (exposed(x + sx * (e + 1), z + sz * (e + 1), dx, dz)) e++;
  return { u: s, L: s + e + 1 };
}

// wall role per exposed cell: quoin at run ends, a window every third cell (centred), brick between; quoin beats window
const role = new Map();
const rank = { brick: 0, window: 1, quoin: 2 };
const FACES = [[0, -1], [0, 1], [-1, 0], [1, 0]];
for (const k of cell.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (const [dx, dz] of FACES) {
    if (!exposed(x, z, dx, dz)) continue;
    const { u, L } = run(x, z, dx, dz);
    const r = u === 0 || u === L - 1 ? "quoin" : u % 3 === 2 ? "window" : "brick";
    if (!role.has(k) || rank[r] > rank[role.get(k)]) role.set(k, r);
  }
}
const isWall = (x, z) => role.has(key(x, z));
const DOOR_X = [6, 7];                            // the entrance: the central bay of the north face (z 0)

// ---- plinth, floors and walls ----
for (const k of cell.keys()) {
  const [x, z] = k.split(",").map(Number);
  put(x, 0, z, isWall(x, z) ? "polished_granite" : "stone_bricks");   // base course outside, floor slab inside
  if (isWall(x, z)) {
    const r = role.get(k);
    for (const y of [1, 2]) {
      if (r === "quoin") put(x, y, z, "smooth_sandstone");
      else if (r === "window") put(x, y, z, "glass_pane", { waterlogged: "false" });
      else put(x, y, z, "bricks");
    }
  } else {
    put(x, 2, z, "oak_planks");                   // upper floor slab, the core under the roof deck
  }
}

// ---- entrance: double dark oak doors in the north bay, a chiselled pediment over them ----
for (const x of DOOR_X) {
  const hinge = x === DOOR_X[0] ? "left" : "right";
  for (const [y, half] of [[1, "lower"], [2, "upper"]])
    put(x, y, 0, "dark_oak_door", { facing: "north", half, hinge, open: "false", powered: "false" });
}
for (let x = 5; x <= 8; x++) put(x, 3, 0, "chiseled_sandstone");

// ---- cornice and roof: the outer ring is a sandstone cornice at y 3, the core is a tar roof deck ----
for (const k of cell.keys()) {
  const [x, z] = k.split(",").map(Number);
  const pediment = z === 0 && x >= 5 && x <= 8;
  if (isWall(x, z) && !pediment) put(x, 3, z, "smooth_sandstone");
  else if (!isWall(x, z)) put(x, 3, z, "gray_concrete");
}

// ---- warm lights standing on the ground floor behind four north windows (air gap between glass and light) ----
for (const x of [2, 5, 8, 11]) put(x, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });

// ---- roof plant: two copper units on the roof deck ----
put(3, 4, 3, "waxed_oxidized_copper");
put(4, 4, 3, "waxed_oxidized_copper");

// ---- glass panes connect to the solid neighbours around them, as the game would draw them ----
const solidAt = (x, y, z) => { const p = P.get(`${x},${y},${z}`); return p && !["lantern", "dark_oak_door"].includes(p.block.replace("minecraft:", "")); };
for (const [k, p] of P) {
  if (p.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  p.state = {
    north: String(!!solidAt(x, y, z - 1) || P.get(`${x},${y},${z - 1}`)?.block === "glass_pane"),
    south: String(!!solidAt(x, y, z + 1) || P.get(`${x},${y},${z + 1}`)?.block === "glass_pane"),
    east: String(!!solidAt(x + 1, y, z) || P.get(`${x + 1},${y},${z}`)?.block === "glass_pane"),
    west: String(!!solidAt(x - 1, y, z) || P.get(`${x - 1},${y},${z}`)?.block === "glass_pane"),
    waterlogged: "false",
  };
}

// ---- write ----
const g = new Voxels([W, H, D]);
for (const [k, { block, state }] of P) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/DC62367.nbt`);
console.log(`DC62367.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
