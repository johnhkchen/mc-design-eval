// 5 East 51st Street, 1930, a mixed residential and commercial building: an 8-storey cream-terracotta block (north part,
// 25 blocks, the street-facing half) stepping down to 7 storeys (22 blocks) at the south end, with a 3-storey lower lobby
// bay on the 51st Street front (lidar 9-10) and a notch of open ground at the NE corner (x 5..7, z 0..6). The footprint is
// the lidar cells: solid from y 0 (the lowest ground) up to each tier, so the uphill south side sits on its foundation.
// Storey lines every 3 blocks (the ground storey 4): a granite base course, a cream belt course at each floor line, two
// rows of grey glass between piers (the piers and belts are the frame), a shopfront with a black canopy over the lobby door,
// and a cornice cap at each tier top. Behind every window the core is air (no interiors), with a floor slab per storey;
// one window in five is lit by glowstone behind the glass. The north tier's roof carries a louvred penthouse.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035467.cells.json`, "utf8"));
const X = 8, Y = 37, Z = 27;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const ground = (x, z) => cell.get(`${x},${z}`).ground;

// Roof tiers, read from the lidar's median rather than cell by cell: the north part (z 0..16) rises to 25, the south part
// (z 17..26, lidar 21..23) to 22, and the lobby bay at the street front (x 3..4, z 0, lidar 9..10) to 10.
const top = (x, z) => (x >= 3 && x <= 4 && z === 0 ? 10 : z >= 17 ? 22 : 25);

// Floor lines: storey k starts at LINES[k]. Storey 0 is the 4-block ground floor (base course, shop glass, lintel).
const LINES = [0, 4, 7, 10, 13, 16, 19, 22];
const storeyOf = (y) => LINES.reduce((k, line, i) => (y >= line ? i : k), 0);

// Outward directions of the lot; a cell's facade faces every side that has no building next to it at that height.
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !inFoot(x + dx, z + dz) || top(x + dx, z + dz) <= y);

// Piers stand at the corners and at x 0, 3, 7 on the street faces, and every third cell on the side walls.
const PIERS_X = [0, 3, 7];

// The lobby on the street front: door (lower and upper half), a black canopy over it and the shop next to it.
const special = new Map([
  ["3,1,0", { block: "dark_oak_door", state: { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" } }],
  ["3,2,0", { block: "dark_oak_door", state: { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" } }],
  ["2,3,0", { block: "black_concrete" }],
  ["3,3,0", { block: "black_concrete" }],
]);

const g = new Voxels([X, Y, Z]);
const openBehind = [];   // window cells: the core behind the glass is air (or glowstone), no interiors
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [key] of cell) {
  const [x, z] = key.split(",").map(Number);
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    const sp = special.get(`${x},${y},${z}`);
    if (sp) { put(x, y, z, sp.block, sp.state); continue; }
    const out = exposed(x, y, z);
    if (!out.length) { put(x, y, z, y === t - 1 ? "smooth_stone" : "stone"); continue; }   // core and roof deck
    if (y < ground(x, z)) { put(x, y, z, "polished_granite"); continue; }                   // foundation below the ground
    if (y === t - 1) { put(x, y, z, "smooth_quartz"); continue; }                           // cornice cap
    const k = storeyOf(y), r = y - LINES[k];
    if (r === 0) { put(x, y, z, k === 0 ? "polished_granite" : "smooth_quartz"); continue; }   // base and belt courses
    if (out.length > 1) { put(x, y, z, "white_terracotta"); continue; }                     // corner pier
    const [dx, dz] = out[0];
    const along = dx !== 0 ? z : x;                                                          // index along the face
    const pier = dx !== 0 ? along % 3 === 0 || along === 26 : PIERS_X.includes(along);
    if (pier) { put(x, y, z, "white_terracotta"); continue; }
    put(x, y, z, k === 0 ? "light_blue_stained_glass" : "gray_stained_glass");
    const warm = (along + 2 * y) % 5 === 0;
    openBehind.push([x - dx, y, z - dz, warm]);
  }
}

// The core behind the glass: air in a window's inner cell (a warm window gets glowstone there), leaving the floor slabs.
for (const [x, y, z, warm] of openBehind) {
  if (warm) put(x, y, z, "glowstone"); else put(x, y, z, "air");
}

// Louvred penthouse on the north tier's roof, centred on the street-facing part: solid, louvres on its sides, a cap.
for (let x = 2; x <= 4; x++) for (let z = 5; z <= 9; z++) {
  put(x, 25, z, "white_terracotta");
  const edge = x === 2 || x === 4 || z === 5 || z === 9, corner = (x === 2 || x === 4) && (z === 5 || z === 9);
  put(x, 26, z, edge && !corner ? "iron_bars" : "white_terracotta");
  put(x, 27, z, "smooth_quartz");
}

const out = `${DIR}/NYC1035467.nbt`;
const { blocks, palette } = g.save(out);
console.log(`built NYC1035467: ${blocks} blocks, ${palette} palette entries -> ${out}`);
