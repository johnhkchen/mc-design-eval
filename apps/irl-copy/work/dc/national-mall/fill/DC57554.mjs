import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1930s Federal-era Neoclassical office block (Federal Triangle idiom): pale limestone walls, pilasters
// on a 3-bay rhythm, tall windows in three storeys over a rusticated base, a parapet, a recessed entrance
// on the north notch, and a small penthouse lantern over the lidar's 12-block core.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC57554.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC57554.nbt";

const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => foot.has(`${x},${z}`);
const DIRS = { "-z": [0, -1], "+z": [0, 1], "-x": [-1, 0], "+x": [1, 0] };

const WALL = "calcite", PIER = "smooth_quartz", BELT = "stone", BASE = "stone_bricks", HEAD = "chiseled_stone_bricks";
const FLOOR = "stone", PARAPET = "smooth_quartz", GLASS = "light_blue_stained_glass_pane", LIGHT = "glowstone";
const SOLID = new Set([WALL, PIER, BELT, BASE, HEAD, FLOOR, "iron_block"]);
const FLOORS = new Set([0, 4, 7, 10]);              // floor slabs: y0 ground, belts at 4 and 7, deck at 10
const WINDOW_ROWS = new Set([1, 2, 5, 6, 8, 9]);    // three storeys of two-high glass under their headers/belts
const PIER_X = new Set([0, 3, 6, 9]), PIER_Z = new Set([0, 3, 7, 10]);   // pilaster bays along each face
const CORE = (x, z) => x >= 3 && x <= 6 && z >= 5 && z <= 8;             // lidar's 12-block core, squared off

const B = new Map();                                // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => B.get(`${x},${y},${z}`);

const exposure = (x, z) => Object.keys(DIRS).filter(d => !inFoot(x + DIRS[d][0], z + DIRS[d][1]));
// the face a perimeter cell is read on: a z-facing face wins at corners (the front), else the x-facing one
const faceOf = (exp) => exp.find(d => d[1] === "z") ?? exp[0];
const isPier = (exp, x, z) => (faceOf(exp)[1] === "z" ? PIER_X.has(x) : PIER_Z.has(z));

// 1. shell: every footprint cell from ground to its roof tier, with the storey rows
for (const [key, { ground }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const top = CORE(x, z) ? 12 : 11;                  // lidar: 11 across the block, 12 over the core
  for (let y = 0; y < ground; y++) put(x, y, z, BASE);
  const exp = exposure(x, z), perim = exp.length > 0;
  for (let y = ground; y < top; y++) {
    if (!perim) { if (FLOORS.has(y)) put(x, y, z, FLOOR); continue; }
    if (y === 0) put(x, y, z, BASE);                 // base course
    else if (y === 4 || y === 7) put(x, y, z, BELT); // storey lines
    else if (y === 10) put(x, y, z, PARAPET);        // parapet
    else if (isPier(exp, x, z)) put(x, y, z, PIER);  // pilasters
    else if (y === 3) put(x, y, z, HEAD);            // ground-storey header
    else if (WINDOW_ROWS.has(y)) put(x, y, z, GLASS);
    else put(x, y, z, WALL);
  }
}

// 2. penthouse over the core: a ring of stone with a glowing lantern in the middle
for (let z = 5; z <= 8; z++) for (let x = 3; x <= 6; x++) {
  const edge = x === 3 || x === 6 || z === 5 || z === 8;
  put(x, 11, z, edge ? PARAPET : LIGHT);
}

// 3. roof plant on the deck
for (const [x, z] of [[2, 3], [8, 3], [2, 8]]) put(x, 11, z, "iron_block");

// 4. entrance: the north notch at x 7 is the porch; double door in its back row, stone lintel above
put(7, 1, 1, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(7, 2, 1, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// 5. warm light: glowstone one cell inside some windows, leaving the air gap behind the glass
for (const [key, v] of [...B]) {
  if (v.block !== GLASS) continue;
  const [x, y, z] = key.split(",").map(Number);
  if (![1, 5, 8].includes(y) || (x * 3 + y * 5 + z * 7) % 4 !== 0) continue;
  const exp = exposure(x, z), f = faceOf(exp);
  if (!f) continue;
  const ix = x - DIRS[f][0], iz = z - DIRS[f][1];
  if (inFoot(ix, iz) && exposure(ix, iz).length === 0 && !at(ix, y, iz)) put(ix, y, iz, LIGHT);
}

// 6. glass panes connect to whatever stands beside them, so the bays read as continuous frames
const conn = (x, y, z, dx, dz) => { const n = at(x + dx, y, z + dz); return !!n && (n.block === GLASS || SOLID.has(n.block) || n.block === LIGHT); };
for (const [key, v] of B) {
  if (v.block !== GLASS) continue;
  const [x, y, z] = key.split(",").map(Number);
  v.state = {
    north: String(conn(x, y, z, 0, -1)), south: String(conn(x, y, z, 0, 1)),
    east: String(conn(x, y, z, 1, 0)), west: String(conn(x, y, z, -1, 0)), waterlogged: "false",
  };
}

const g = new Voxels([10, 24, 11]);
for (const [key, { block, state }] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const r = g.save(OUT);
console.log(`DC57554: ${r.blocks} blocks, ${r.palette} palette entries -> ${OUT}`);
