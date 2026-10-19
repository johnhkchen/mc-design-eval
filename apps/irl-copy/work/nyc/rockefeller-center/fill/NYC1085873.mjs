// 45 West 44th Street, 1999 commercial and office building: a Midtown office tower of blue glass on a granite base.
// Footprint 33 x 34 (low z = north = the 44th Street frontage). The lidar roof reads as four tiers stepping up to a
// 94-block core: 13-block podium (the north entrance notch and the east-south courtyard wing), 67-block wings at the
// west and east ends, 85-block shoulders, a 91-block core and a 94-block south tower, with a small penthouse on the
// 94 tier. Lidar dropouts inside the mass are filled from their neighbours; open ground stays paved at y = ground.
// Storeys run on a 3-block rhythm from y 1 (slab row, then two window rows). Base (y < 13): polished granite with grey
// glass and granite piers, a shopfront ground floor and a dark-oak door in a canopy at the north entrance. Tower:
// light-grey spandrels, blue glass panes, iron mullions, a smooth-stone cornice on each tier. Glass has an air gap
// behind it (no interiors), and some panes have glowstone in that gap. Everything else is solid, so no tier floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1085873.cells.json`, "utf8"));
const X = 33, Y = 107, Z = 34;

const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inFoot = (x, z) => cell.has(key(x, z));

// 1. Lidar roof with dropouts: a cell under 10 that has at least 6 built neighbours takes their median.
const built = (x, z) => [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
  .map(([dx, dz]) => [x + dx, z + dz]).filter(([a, b]) => inFoot(a, b)).map(([a, b]) => cell.get(key(a, b)).roof).filter((r) => r >= 10);
const roofOf = new Map();
for (const [k, { roof }] of cell) {
  const [x, z] = k.split(",").map(Number);
  let r = roof;
  if (r < 10) { const n = built(x, z).sort((p, q) => p - q); if (n.length >= 6) r = n[n.length >> 1]; }
  roofOf.set(k, r);
}

// 2. Lidar roof to clean tiers (block tops, each on the 3-block storey rhythm: top - 1 = 3n + 0 or 3n + 2 for the cornice).
const topOf = (x, z) => {
  const k = key(x, z);
  if (!cell.has(k)) return 0;
  const r = roofOf.get(k);
  return r < 10 ? 0 : r < 20 ? 13 : r < 76 ? 67 : r < 89 ? 85 : r < 93 ? 91 : 94;
};

// Outward faces: N = low z (the 44th Street frontage), S = rear, W/E = the side walls.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const PANE = {
  N: { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" },   // pane on a face along x
  S: { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" },
  W: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },   // pane on a face along z
  E: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
};
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows
const BASE_TOP = 13;                                          // the granite base is y < 13

const g = new Voxels([X, Y, Z]);
const facade = new Set();                                     // "x,y,z" of exposed wall cells (their inward cells are not pockets)
const pockets = [];                                           // [x, y, z, lit] air gaps behind glass, set last

// Facade block for an exposed cell at height y on face d.
const wall = (x, y, z, d, T) => {
  const u = d === "N" || d === "S" ? x : z;
  const base = y < BASE_TOP;
  const rel = (y - 1) % 3;                                    // 0 = slab row, 1-2 = window rows (y >= 1)
  if (rel === 0) return { block: base ? "polished_granite" : "light_gray_concrete" };
  if (u % 3 === 0) return { block: base ? "polished_granite" : "iron_block" };   // piers and mullions
  return { block: base ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane", state: PANE[d], glass: true };
};

// 3. Cells: foundation to ground, paving or the solid mass up to the tier top, cornice on each top, glass on the faces.
for (const [k, { ground }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const T = topOf(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  if (!T) { g.set(x, ground, z, "smooth_stone"); continue; }
  for (let y = ground; y < T; y++) {
    if (y === T - 1) { g.set(x, y, z, "smooth_stone"); continue; }          // cornice or roof cover
    const open = Object.entries(DIRS).filter(([, [dx, dz]]) => !inFoot(x + dx, z + dz) || topOf(x + dx, z + dz) <= y).map(([d]) => d);
    if (!open.length) { g.set(x, y, z, "gray_concrete"); continue; }        // solid core
    const d = open[0], [dx, dz] = DIRS[d];
    const w = wall(x, y, z, d, T);
    let block = w.block, state = w.state;
    // The entrance: a dark-oak door at x 16 on the north face, shopfront glass either side, a canopy above.
    if (d === "N" && z === 0 && y <= 2 && x === 16) {
      block = "dark_oak_door";
      state = { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    }
    if (d === "N" && z === 0 && y === 3 && x >= 15 && x <= 17) { block = "dark_oak_slab"; state = { type: "bottom", waterlogged: "false" }; }
    g.set(x, y, z, block, state);
    facade.add(`${x},${y},${z}`);
    if (w.glass && !(d === "N" && z === 0 && x === 16 && y <= 2)) {
      const ix = x - dx, iz = z - dz;
      if (inFoot(ix, iz) && topOf(ix, iz) > y) pockets.push([ix, y, iz, lit(u(x, z, d), y, 0)]);
    }
  }
}
function u(x, z, d) { return d === "N" || d === "S" ? x : z; }

// 4. Air behind the glass (glowstone behind some panes), skipping any cell that is itself a wall.
for (const [x, y, z, isLit] of pockets) {
  if (facade.has(`${x},${y},${z}`)) continue;
  if (isLit) g.set(x, y, z, "glowstone"); else g.set(x, y, z, "air");
}

// 5. Entrance: the door's inside is air, and a lobby pocket behind the shopfront.
for (let y = 1; y <= 2; y++) g.set(16, y, 1, "air");

// 6. Roof equipment on the 94 tier: a penthouse with louvred sides and a granite cap, standing on the tier.
for (let x = 18; x <= 21; x++) for (let z = 11; z <= 14; z++) {
  if (topOf(x, z) !== 94) continue;
  const edge = x === 18 || x === 21 || z === 11 || z === 14;
  for (let y = 94; y < 97; y++) {
    if (!edge) { g.set(x, y, z, "air"); continue; }
    g.set(x, y, z, y === 95 && (x + z) % 2 === 0 ? "iron_bars" : "light_gray_concrete");
  }
  g.set(x, 97, z, "polished_granite");
}

const result = g.save(`${DIR}/NYC1085873.nbt`);
console.log(JSON.stringify(result));
