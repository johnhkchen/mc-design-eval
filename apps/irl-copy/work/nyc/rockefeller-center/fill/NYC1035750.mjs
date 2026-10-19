// 65 East 54 Street, 1920: a mixed residential and commercial mid-rise in brick on a granite base, limestone (calcite)
// string courses, quoins and copings, with a ground-floor shopfront on the street face. The lidar roofs are quantized to
// storey tiers (every tier top sits on a storey line, 3 blocks a storey), so every column stands solid from its foundation
// to its top; the interior is an air gap behind a one-block shell with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1035750.cells.json`, "utf8"));
const X = 6, Z = 24, Y = 34;
const TIERS = [13, 16, 19, 22];                       // storey lines: a tier top is 3k+1 so its top row is a floor line
const key = (x, z) => `${x},${z}`;
const nearestTier = (r) => TIERS.reduce((a, b) => (Math.abs(b - r) < Math.abs(a - r) ? b : a));

// Building cells get a tier top; open ground at lidar height (roof = ground) is paving; roof 0 is nothing at all.
const raw = new Map(), paving = new Set();
for (const [x, z, gr, roof] of cells) {
  if (roof > gr && roof >= 2) raw.set(key(x, z), { g: gr, t: nearestTier(roof) });
  else if (roof === gr && gr === 1) paving.add(key(x, z));
}
// One majority pass: a lone tier step that three of its four neighbours disagree with is lidar noise.
const top = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => raw.get(key(x + dx, z + dz))?.t);
  const other = nb.filter((t) => t !== undefined && t !== c.t);
  const majority = other.length >= 3 && other.every((t) => t === other[0]) ? other[0] : c.t;
  top.set(k, { g: c.g, t: majority });
}
// Penthouse on the 19 tier: a 2 x 2 box of roof equipment rising to 22.
for (const [x, z] of [[2, 19], [3, 19], [2, 20], [3, 20]]) top.get(key(x, z)).t = 22;

// Solid height of a cell's column for neighbour tests: a building's top, 1 for paving (its ground), 0 for nothing.
const solidTop = (x, z) => {
  if (x < 0 || z < 0 || x >= X || z >= Z) return 0;
  const k = key(x, z);
  if (top.has(k)) return top.get(k).t;
  return paving.has(k) ? 1 : 0;
};

const FACES = [[1, 0, "E"], [-1, 0, "W"], [0, 1, "S"], [0, -1, "N"]];
const plan = new Map();                               // "x,y,z" -> { block, state, face } for shell and floor cells
const put = (x, y, z, block, state, face) => plan.set(`${x},${y},${z}`, { block, state, face });
const interior = [];                                  // window-row cells inside the shell, decided once the panes are placed

// Paving: the open ground at lidar height, one block of stone under the sidewalk level.
for (const k of paving) { const [x, z] = k.split(",").map(Number); put(x, 0, z, "stone_bricks"); }

for (const [k, { g: gr, t }] of top) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < t; y++) {
    const faces = FACES.filter(([dx, dz]) => y >= solidTop(x + dx, z + dz)).map(([, , f]) => f);
    const isTop = y === t - 1;
    if (!faces.length && !isTop) {                    // interior: a floor slab per storey, air between
      if (y % 3 === 0) put(x, y, z, "smooth_stone");
      else interior.push([x, y, z]);
      continue;
    }
    const exposed = faces.length > 0;
    if (isTop) { put(x, y, z, exposed ? "calcite" : "smooth_stone", null, faces[0]); continue; }   // coping or roof covering
    if (y === 0) { put(x, y, z, "polished_granite"); continue; }                                // base course
    if (y % 3 === 0) { put(x, y, z, "calcite", null, faces[0]); continue; }                   // string course
    if (faces.length >= 2) { put(x, y, z, "calcite", null, faces[0]); continue; }              // limestone quoin
    const f = faces[0];
    if (f === "S" && z === Z - 1 && y < 3) continue;                                          // shopfront: below
    const u = f === "S" || f === "N" ? x : z;
    if (u % 3 === 0) { put(x, y, z, "bricks", null, f); continue; }                            // brick pier
    put(x, y, z, "glass_pane", null, f);                                                       // window pane
  }
}

// Shopfront on the street face (z = 23): granite bulkhead, display glass, a canopy over the door, lanterns hanging.
const sx = Z - 1;
for (let x = 0; x < X; x++) {
  if (!top.has(key(x, sx))) continue;
  if (x === 2) {                                                                               // entrance door
    put(x, 1, sx, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }, "S");
    put(x, 2, sx, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }, "S");
  } else if (x === 0 || x === X - 1) {                                                        // shop piers
    put(x, 1, sx, "polished_granite", null, "S"); put(x, 2, sx, "calcite", null, "S");
  } else {
    put(x, 1, sx, "polished_granite", null, "S");
    if (x === 3) put(x, 2, sx, "lantern", { hanging: "true" }, "S");
    else put(x, 2, sx, "glass_pane", null, "S");
  }
}
for (let x = 1; x <= 3; x++) put(x, 3, sx, "dark_oak_slab", { type: "bottom" }, "S");       // canopy over the door

// The air gap is one cell deep behind each pane; the rest of the interior is a solid core, so the glass never shows
// straight through the building to the sky on the far side.
const GLAZING = new Set(["glass_pane", "lantern", "dark_oak_door"]);
for (const [x, y, z] of interior) {
  const behindGlass = FACES.some(([dx, dz]) => GLAZING.has(plan.get(`${x + dx},${y},${z + dz}`)?.block));
  if (!behindGlass) put(x, y, z, "stone_bricks");
}

// Warm light behind some panes: a glowstone in the air gap just inside a lower-row window.
for (const [k, c] of plan) {
  if (c.block !== "glass_pane" || c.face === undefined) continue;
  const [x, y, z] = k.split(",").map(Number);
  if (y % 3 !== 1 || (x * 31 + y * 17 + z * 13) % 7 !== 0) continue;
  const [dx, dz] = { E: [-1, 0], W: [1, 0], S: [0, -1], N: [0, 1] }[c.face];
  const ik = `${x + dx},${y},${z + dz}`;
  if (!plan.has(ik)) plan.set(ik, { block: "glowstone", state: null, face: undefined });
}

const g = new Voxels([X, Y, Z]);
for (const [k, c] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, c.block, c.state ?? undefined);
}
const out = `${dir}/NYC1035750.nbt`;
const { blocks, palette } = g.save(out);
console.log(`wrote ${out}: ${blocks} blocks, ${palette} palette entries`);
