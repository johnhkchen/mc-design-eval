// 655 Fifth Avenue, 1912 commercial and office building: an 11-to-12-storey brick-and-terracotta loft in the Beaux-Arts
// commercial manner of its date. Footprint 36 x 14 (x along the avenue, low z = uptown). Lidar gives two tiers: the
// west and rear part at 38 blocks (12 storeys and a parapet), the east and north-east part at 35 (11 storeys). The lidar
// is smoothed by a 3x3 median and snapped to those two tiers, so the roof reads as clean flat tops, not the noise.
// Ground: the grade falls from 3 on the west to 0 at the north-east notch, so each cell fills stone from y 0 to its
// ground and the shopfront stands on that ground.
// Storeys: string courses at every 3 blocks from y 6 (the shop band runs from each cell's ground to y 6). Each upper
// storey is two window rows between smooth-stone string courses; piers of white terracotta every third block; a
// smooth-stone cornice and cap at the top. Windows are glass panes one block in from the face, with an air gap behind
// them (no interiors); a few gaps hold a glowstone lamp. The shopfronts are plinth, glass and granite piers, with a
// dark-oak door and lintel on the uptown frontage. A spruce water tower stands on the west roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035706.cells.json`, "utf8"));
const X = 36, Y = 50, Z = 14;
const SHOP = 6;   // first storey line: shop band from each cell's ground to y 6

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const groundOf = (x, z) => cell.get(`${x},${z}`).ground;

// Two roof tiers from the lidar: a 3x3 median of the valid readings (noise under 10 is dropped), snapped to 38 or 35.
const roofOf = new Map();
for (const [key, { roof }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = cell.get(`${x + dx},${z + dz}`);
    if (c && c.roof >= 10) near.push(c.roof);
  }
  near.sort((a, b) => a - b);
  const m = near.length ? near[near.length >> 1] : 35;
  roofOf.set(key, m >= 36 ? 38 : 35);
}
const topOf = (x, z) => (inFoot(x, z) ? roofOf.get(`${x},${z}`) : 0);

// A side is open to air at height y when the cell beside it is outside the footprint or has its roof below y.
const open = (x, y, z) => !inFoot(x, z) || y >= topOf(x, z);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
// Pane states: a pane on a face along x connects east-west; one on a face along z connects north-south.
const PANE = {
  N: { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" },
  S: { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" },
  W: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
  E: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
};

const g = new Voxels([X, Y, Z]);
const gaps = [];   // { x, y, z, inward: [dx, dz], lit } for the air gap behind each glazed face cell

// 1. Shell, cell by cell and row by row.
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  const G = groundOf(x, z), T = topOf(x, z);
  for (let y = 0; y < T; y++) {
    if (y < G) { g.set(x, y, z, "stone_bricks"); continue; }
    const face = faceOf(x, y, z);
    if (!face) {
      // Core: solid behind the skin, with the roof covering on the top.
      g.set(x, y, z, y === T - 1 ? "stone" : "stone_bricks");
      continue;
    }
    const along = face === "N" || face === "S" ? x : z;   // position along the facade
    const pier = along % 3 === 0;
    const [dx, dz] = DIRS[face];
    if (y < SHOP) {
      // Shopfront: granite plinth on the ground, granite piers, glass between, and the uptown door at x 7.
      const door = face === "N" && z === 0 && x === 7 && (y === G || y === G + 1);
      if (door) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === G ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === G) { g.set(x, y, z, "polished_granite"); continue; }
      if (pier) { g.set(x, y, z, "polished_granite"); continue; }
      if (face === "N" && z === 0 && x >= 6 && x <= 8 && y === 5) { g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }
      g.set(x, y, z, "glass");
      gaps.push({ x, y, z, inward: [-dx, -dz], lit: y === G + 1 && (x * 5 + z * 3) % 4 === 0 });
      continue;
    }
    // Upper storeys.
    if (y === T - 1) { g.set(x, y, z, "smooth_stone"); continue; }                     // cap
    if ((y - SHOP) % 3 === 0) { g.set(x, y, z, "smooth_stone"); continue; }             // string course and floor line
    if (pier) { g.set(x, y, z, "white_terracotta"); continue; }                         // pier
    g.set(x, y, z, "glass_pane", PANE[face]);
    gaps.push({ x, y, z, inward: [-dx, -dz], lit: (y - SHOP) % 3 === 1 && (x * 5 + z * 3) % 7 === 0 });
  }
}

// 2. Air gap behind each glazed cell (one block deep, no interior), with a glowstone lamp in some of them.
for (const { x, y, z, inward: [ix, iz], lit } of gaps) {
  const cx = x + ix, cz = z + iz;
  if (!inFoot(cx, cz) || y >= topOf(cx, cz)) continue;
  if (lit) g.set(cx, y, cz, "glowstone"); else g.set(cx, y, cz, "air");
}

// 3. Water tower on the west roof: a 3 x 3 spruce tank with its corners taken off, on a slab cap, standing on the roof.
const tower = [];
for (let z = 9; z <= 11; z++) for (let x = 3; x <= 5; x++) {
  if (!inFoot(x, z) || topOf(x, z) !== 38) continue;
  tower.push([x, z]);
}
const corner = (x, z) => (x === 3 || x === 5) && (z === 9 || z === 11);
for (const [x, z] of tower) {
  if (corner(x, z)) continue;
  for (let y = 38; y <= 40; y++) g.set(x, y, z, "spruce_planks");
  g.set(x, 41, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
}

// 4. Check: nothing floats. A floor slab over a glazing gap is the storey's floor, so it may overhang the gap; any
// other block with air under it is a gap that reached a window row beneath solid core, so the gap is closed with core.
let floats = 0, solid = 0, slabs = 0;
for (const [x, z] of [...cell.keys()].map((k) => k.split(",").map(Number))) {
  for (let y = 1; y < Y; y++) {
    if (!g.get(x, y, z) || g.get(x, y - 1, z)) continue;
    if ((y - SHOP) % 3 === 0 || y === SHOP) { slabs++; continue; }
    g.set(x, y - 1, z, "stone_bricks"); floats++;
  }
  for (let y = 0; y < Y; y++) if (g.get(x, y, z)) solid++;
}
for (const [x, z] of tower) {
  for (let y = 38; y < 42; y++) if (g.get(x, y, z) && !g.get(x, y - 1, z)) floats++;
}
const tops = [...new Set(cells.map(([x, z]) => topOf(x, z)))].sort((a, b) => a - b);
console.log(`cells ${cells.length}, roof tiers ${tops.join("/")}, solid ${solid}, floor slabs over the glazing gap ${slabs}, gaps closed under core ${floats}`);

const out = g.save(`${DIR}/NYC1035706.nbt`);
console.log(`wrote NYC1035706.nbt: ${out.blocks} blocks, palette ${out.palette}`);
