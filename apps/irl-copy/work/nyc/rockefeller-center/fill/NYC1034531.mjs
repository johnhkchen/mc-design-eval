// St Thomas Church (1913, Cram, Goodhue & Ferguson), Fifth Avenue: a Romanesque Revival limestone church.
// Massing from the lidar roof, median-smoothed and quantised to four setback tiers; solid calcite walls on
// the footprint, a stone plinth and string courses, glass in a pier-and-window grid (each window carved one
// block deep so the glass sits in an air gap), a recessed central portal with doors, a rose window on the
// north front, and warm glowstone behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${HERE}/NYC1034531.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 69, D = 27, H = 56;

const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));

// Lidar noise -> flat tiers: 3x3 median of the roof, then the nearest setback height.
const TIERS = [[18, 15], [25, 21], [34, 30], [40, 36], [Infinity, 42]];
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = cell.get(key(x + dx, z + dz)); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  c.T = Math.max(TIERS.find(([lim]) => med < lim)[1], c.g + 4);     // top of the solid mass (exclusive)
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const V = new Voxels([W, H, D]);
const put = (x, y, z, b, s) => V.set(x, y, z, b, s);
const carve = (x, y, z, b = "air", s) => { if (cell.has(key(x, z))) put(x, y, z, b, s); };
const hasParapet = (x, z) => { const c = cell.get(key(x, z)); return Object.values(DIRS).some(([dx, dz]) => { const n = cell.get(key(x + dx, z + dz)); return !n || n.T < c.T; }); };
const paneState = (dn) => (dn === "N" || dn === "S" ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });

// Solid mass, foundation, roof cover, cornice and string courses, plus the exposed face of each cell.
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.T; y++) {
    if (y < c.g) { put(x, y, z, "stone_bricks"); continue; }
    if (y === c.T - 1) { put(x, y, z, "deepslate_tiles"); continue; }
    put(x, y, z, y === c.T - 2 ? "chiseled_stone_bricks" : "calcite");
  }
}

// Exposed faces: a face is exposed where the neighbour is missing or lower than this row.
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.T - 1; y++) {
    for (const [dn, [dx, dz]] of Object.entries(DIRS)) {
      const nb = cell.get(key(x + dx, z + dz));
      if (nb && y < nb.T) continue;                                     // covered by the neighbour's solid
      if (y < 2) { put(x, y, z, "stone_bricks"); continue; }            // plinth
      if (y === c.T - 2 || y % 3 === 2) { put(x, y, z, "chiseled_stone_bricks"); continue; }
      const i = dn === "N" || dn === "S" ? x : z;                        // along-the-face index: pier every 4th
      if (i % 4 === 0) { put(x, y, z, "calcite"); continue; }
      put(x, y, z, "glass_pane", paneState(dn));
      const bx = x - dx, bz = z - dz;                                    // one block behind the glass: air gap
      const behind = cell.get(key(bx, bz));
      if (behind && y < behind.T) {
        const lit = i % 8 === 2 && y % 6 === 0;                          // a few warm bays, not a scatter
        carve(bx, y, bz, lit ? "glowstone" : "air");
      }
    }
  }
}

// Parapet on the roof edge and at setbacks, on top of the roof cover.
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (hasParapet(x, z)) put(x, c.T, z, "stone_brick_wall", { up: "true" });
}

// Central portal on the north (street) front: a three-block recess with two doors and a stone trumeau.
const gP = cell.get(key(50, 0)).g;
for (let x = 49; x <= 51; x++) for (let z = 0; z <= 1; z++) for (let y = gP; y <= gP + 5; y++) carve(x, y, z);
for (let y = gP; y <= gP + 5; y++) for (const x of [48, 52]) for (const z of [0, 1]) put(x, y, z, "chiseled_stone_bricks");
for (let x = 48; x <= 52; x++) for (const z of [0, 1]) put(x, gP + 6, z, "chiseled_stone_bricks");
for (let y = gP; y <= gP + 5; y++) for (const z of [0, 1]) put(50, y, z, "chiseled_stone_bricks");
for (const [x, hinge] of [[49, "left"], [51, "right"]]) {
  put(x, gP, 1, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  put(x, gP + 1, 1, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}

// Rose window high on the north front, glass in a disc, glowstone at its heart.
const yR = cell.get(key(50, 0)).T - 6;
for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
  if (dx * dx + dy * dy > 5) continue;
  const full = { east: "true", west: "true", north: "true", south: "true", waterlogged: "false" };
  put(50 + dx, yR + dy, 0, "glass_pane", full);
  carve(50 + dx, yR + dy, 1, dx === 0 && dy === 0 ? "glowstone" : "air");
}

const stats = V.save(`${HERE}/NYC1034531.nbt`);
console.log(JSON.stringify({ cells: cells.length, top: Math.max(...[...cell.values()].map((c) => c.T)), ...stats }));
