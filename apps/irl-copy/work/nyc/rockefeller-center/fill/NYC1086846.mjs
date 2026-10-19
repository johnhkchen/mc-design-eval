// 19 West 44th Street, 1916: a 7 x 9 block commercial and office building of brick over a granite base, three storeys
// of offices on a street front, two-storey wings, a shopfront with a central door, and a setback penthouse. Lidar roof
// heights are smoothed into three tiers (11, 8, 3); cells with no lidar roof are a light court left open.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1086846.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 7, Z = 9;

// Lidar roof -> clean tiers: a tower (3 storeys + cornice), a two-storey wing, a one-storey corner.
const tier = (r) => (r <= 0 ? 0 : r <= 2 ? 3 : r >= 10 ? 11 : 8);
const H = Array.from({ length: X }, () => Array(Z).fill(0));
const G = Array.from({ length: X }, () => Array(Z).fill(0));
for (const [x, z, ground, roof] of cells) { H[x][z] = tier(roof); G[x][z] = ground; }
const h = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : H[x][z]);

// Penthouse: a 2 x 2 stair-and-lift box on the tower roof, set in from the cornice.
const PH = new Set(["2,5", "3,5", "2,6", "3,6"]);

const blocks = new Map();
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const get = (x, y, z) => blocks.get(`${x},${y},${z}`);

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const top = H[x][z];
  if (!top) continue;
  // Foundation: solid from the bottom up to this cell's own ground (zero here, so nothing to fill).
  for (let y = 0; y < G[x][z]; y++) put(x, y, z, "stone_bricks");

  const exposedZ = h(x, z - 1) < top || h(x, z + 1) < top;   // street or rear face
  const exposedX = h(x - 1, z) < top || h(x + 1, z) < top;   // side face
  const perimeter = exposedZ || exposedX;
  // A cell with no built neighbour is a lone stub (a stair or lift shaft): solid masonry, not glass, so it reads as
  // a chimney rising from the court rather than a stack of loose blocks.
  const lone = h(x - 1, z) === 0 && h(x + 1, z) === 0 && h(x, z - 1) === 0 && h(x, z + 1) === 0;

  for (let y = 0; y < top; y++) {
    const cap = y === top - 1;
    if (cap) { put(x, y, z, "smooth_stone"); continue; }
    if (!perimeter) {
      // Interior: solid floor slabs, air between, nothing on the glass side.
      if (y === 0 || y === 3 || y === 6 || y === 9) put(x, y, z, "smooth_stone");
      continue;
    }
    // Facade: a granite base, storey bands at 3 / 6 / 9, bricks with glass panes between.
    const winCol = exposedZ ? x % 2 === 1 : z % 2 === 0;
    if (y === 0) { put(x, y, z, "polished_granite"); continue; }
    if (y === 2) { put(x, y, z, "smooth_stone"); continue; }
    if (y === 3 || y === 6) { put(x, y, z, "smooth_stone"); continue; }
    if (y === 9) { put(x, y, z, "stone_bricks"); continue; }
    if (y === 1 || y === 4 || y === 5 || y === 7 || y === 8) {
      put(x, y, z, winCol && !lone ? "glass_pane" : "bricks");
    }
  }
}

// Street front: a central door under a timber canopy band, shopfront glass either side.
if (H[3][Z - 1]) {
  put(3, 0, Z - 1, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(3, 1, Z - 1, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const x of [2, 3, 4]) if (H[x][Z - 1]) put(x, 2, Z - 1, "spruce_planks");
}

// Penthouse: glass clerestory on a stone-brick box with a stone cap.
for (const k of PH) {
  const [x, z] = k.split(",").map(Number);
  put(x, 11, z, "glass_pane");
  put(x, 12, z, "stone_bricks");
  put(x, 13, z, "smooth_stone");
}

// Warm light behind some interior windows (glowstone on the floor slab, inside the air gap).
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const top = H[x][z];
  if (!top || PH.has(`${x},${z}`)) continue;
  const interior = h(x, z - 1) >= top && h(x, z + 1) >= top && h(x - 1, z) >= top && h(x + 1, z) >= top;
  if (!interior || (x + z) % 2 !== 1) continue;
  if (top >= 8) put(x, 4, z, "glowstone");
  if (top >= 11 && (x + 2 * z) % 3 === 0) put(x, 7, z, "glowstone");
}

// Glass panes connect to any neighbour that is a pane or a solid block, so the frames read as one grid.
const solid = (x, y, z) => { const b = get(x, y, z); return !!b && b.block !== "glass_pane"; };
const pane = (x, y, z) => get(x, y, z)?.block === "glass_pane";
const link = (x, y, z) => ({
  east: String(pane(x + 1, y, z) || solid(x + 1, y, z)),
  west: String(pane(x - 1, y, z) || solid(x - 1, y, z)),
  north: String(pane(x, y, z - 1) || solid(x, y, z - 1)),
  south: String(pane(x, y, z + 1) || solid(x, y, z + 1)),
  waterlogged: "false",
});
for (const [k, v] of blocks) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  v.state = link(x, y, z);
}

const g = new Voxels([X, 14, Z]);
for (const [k, v] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = `${DIR}/NYC1086846.nbt`;
const r = g.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
