import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: a 1910s Edwardian brick commercial block (red brick piers, cream render over the window heads, a dark timber
// shopfront, a stone cornice) on the Eden Terrace side of the CBD. Lidar roof 11-12 over most of the footprint, 8-10 along
// the south-east and west edges: two flat tiers, a three-storey main body (top y 12) and a two-storey shop wing (top y 8).
// Each cell's roof is averaged over its 3 x 3 footprint neighbourhood before the tier is picked, so the lidar's stair-step
// noise gives clean tiers. Every column is solid from y 0 to its tier, with a one-block air gap behind each window.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const CELLS = `${DIR}/way_332241866.cells.json`;
const OUT = `${DIR}/way_332241866.nbt`;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([25, 25, 14]);

// Materials: red brick piers, cream render over the upper window heads, granite base, smooth stone cornice and sills,
// dark oak shopfront, grey bitumen roof deck, glass panes, warm glowstone (shopfronts) and shroomlights (upper floors).
const BRICK = "bricks", RENDER = "white_concrete", BAND = "smooth_stone", BASE = "polished_granite";
const FILL = "stone", ROOF = "gray_concrete", SHOP = "dark_oak_planks", GLASS = "glass_pane";
const GLOW_LOW = "glowstone", GLOW_UP = "shroomlight", PLANT = "light_gray_concrete";

const key = (x, z) => `${x},${z}`;
const roofAt = new Map();
for (const [x, z, , r] of cells) roofAt.set(key(x, z), r);
const inFoot = (x, z) => roofAt.has(key(x, z));

// Two flat tiers: a cell whose 3 x 3 mean roof is 10.5 or more is the three-storey body (top 12), else the two-storey wing (8).
const top = new Map();
for (const [x, z] of [...roofAt.keys()].map((k) => k.split(",").map(Number))) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFoot(x + dx, z + dz)) { s += roofAt.get(key(x + dx, z + dz)); n++; }
  top.set(key(x, z), s / n >= 10.5 ? 12 : 8);
}
const T = (x, z) => top.get(key(x, z));

// The faces of cell (x, z) open to the air at height y: off the footprint, or beside a cell that stops at or below y.
const DIRS = [[1, 0, "E"], [-1, 0, "W"], [0, 1, "S"], [0, -1, "N"]];
const faces = (x, z, y) => DIRS.filter(([dx, dz]) => !inFoot(x + dx, z + dz) || T(x + dx, z + dz) <= y);

// Window bays: along a face, cells 1 and 2 of every four are glass, 0 and 3 are brick piers.
const bay = (x, z, face) => { const u = face === "E" || face === "W" ? z : x; return [1, 2].includes(u % 4); };
const glassRow = (y) => y === 1 || y === 2 || (y >= 4 && [1, 2].includes((y - 4) % 4));

// The entrance: a dark oak door on the north face of cell (4, 1), facing out, with the shopfront either side.
const DOOR = { x: 4, z: 1 };

// The air gap behind each window pane: the cell inward of a glass cell, one block deep, air on its glass rows. A light
// sits in the gap on the lowest glass row of some windows.
const gap = new Set(), lights = new Map();
for (const [x, z] of roofAt.keys().map((k) => k.split(",").map(Number))) {
  for (let y = 0; y < T(x, z); y++) {
    const out = faces(x, z, y);
    if (out.length !== 1 || !glassRow(y) || !bay(x, z, out[0][2])) continue;
    if (x === DOOR.x && z === DOOR.z) continue;
    const [dx, dz] = out[0];
    const ix = x - dx, iz = z - dz;
    if (!inFoot(ix, iz) || T(ix, iz) <= y || faces(ix, iz, y).length) continue;
    gap.add(`${ix},${y},${iz}`);
    const bottom = y === 1 || y === 5;
    if (bottom && (x * 7 + z * 5 + y) % 3 === 0) lights.set(`${ix},${y},${iz}`, y < 4 ? GLOW_LOW : GLOW_UP);
  }
}

// The facade of an outer cell at height y, on a tier of height tc.
function facade(x, z, y, tc, out) {
  if (y === 0) return BASE;
  if (y === tc - 1) return BAND;                          // stone cornice on the outside
  if (x === DOOR.x && z === DOOR.z && out.some(([, , f]) => f === "N")) {
    if (y === 1) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (y === 2) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
    if (y === 3) return SHOP;
  }
  const bayOK = out.length === 1 && bay(x, z, out[0][2]);
  if (y < 4) {                                             // ground floor: shopfront under a fascia
    if (y === 3) return bayOK ? SHOP : BRICK;
    return bayOK ? GLASS : BRICK;
  }
  const r = (y - 4) % 4;                                   // upper floors: band, two glass rows, cream render header
  if (r === 0) return BAND;
  if (r === 3) return bayOK ? RENDER : BRICK;
  return bayOK ? GLASS : BRICK;
}

for (const [x, z] of roofAt.keys().map((k) => k.split(",").map(Number))) {
  const tc = T(x, z);
  for (let y = 0; y < tc; y++) {
    const gk = `${x},${y},${z}`;
    if (gap.has(gk)) { if (lights.has(gk)) g.set(x, y, z, lights.get(gk)); continue; }
    const out = faces(x, z, y);
    if (!out.length) {                                    // solid mass: the roof deck caps it, the rest is fill
      g.set(x, y, z, y === tc - 1 ? ROOF : FILL);
      continue;
    }
    const b = facade(x, z, y, tc, out);
    if (Array.isArray(b)) g.set(x, y, z, b[0], b[1]); else g.set(x, y, z, b);
  }
}

// Roof plant: paired units on the flat roof, where the top is clear of any step.
const plantAt = (x, z) => {
  const pair = [[x, z], [x + 1, z]];
  const ok = pair.every(([a, b]) => inFoot(a, b) && T(a, b) === T(x, z) && faces(a, b, T(a, b) - 1).length === 0);
  if (!ok) return false;
  for (const [a, b] of pair) g.set(a, T(x, z), b, PLANT);
  return true;
};
// Candidate spots on the roof decks: the body's interior top and the wing's, each unit two cells wide.
const spots = [[8, 4], [12, 5], [15, 6], [10, 6], [18, 7], [6, 7], [9, 7], [19, 9], [14, 4], [21, 6]].filter(([x, z]) => plantAt(x, z));

const counts = g.save(OUT);
const rows = [];
for (let z = 0; z < 14; z++) {
  let s = "";
  for (let x = 0; x < 25; x++) s += inFoot(x, z) ? (T(x, z) === 12 ? "T" : "w") : ".";
  rows.push(s);
}
console.log(JSON.stringify({ file: OUT, ...counts, plantSpots: spots, gaps: gap.size, lights: lights.size }));
console.log(rows.join("\n"));
