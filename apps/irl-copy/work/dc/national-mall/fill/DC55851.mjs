// DC55851: a red-brick commercial block on the National Mall's flank (early-20th-century Federal/Beaux-Arts office).
// The footprint is notched, so walls follow each cell's exposed sides, not the bounding box. The lidar roof is flat at
// 5 blocks, so the massing is one flat tier: a stone plinth, two storeys of windows split by a quartz string course,
// a quartz cornice, a stone roof deck and rooftop units. The street is the long west face (x=0): a shopfront on the
// ground floor with the entrance at z=4. Nothing overhangs the footprint.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC55851.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const W = 4, D = 11;

// One flat tier: the lidar roof reads 5 everywhere, so the top course (cornice + roof deck) is layer 4.
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const H = roofs[Math.floor(roofs.length / 2)];
if (H !== 5) throw new Error(`layout is built for a roof at 5 blocks, lidar says ${H}`);
const TOP = H - 1;

// Layers: 0 plinth (also each cell's foundation), 1 ground-floor windows, 2 string course and upper floor slab,
// 3 upper-floor windows, 4 cornice and roof deck.
const PLINTH = 0, GF = 1, STRING = 2, UF = 3;

const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => fp.has(`${x},${z}`);
const exposure = (x, z) => ({ W: !has(x - 1, z), E: !has(x + 1, z), N: !has(x, z - 1), S: !has(x, z + 1) });

// Openings on exposed walls, by cell and storey: g = glass pane, d = door (ground floor), p = brick pier.
// A cell exposed on two perpendicular sides is a quoin (quartz corner); the rest of the exposed cells are below.
const OPEN = {
  // west face, the street: shopfront below, windows above, entrance at z=4
  "0,2": { GF: "g", UF: "g" }, "0,3": { GF: "g", UF: "g" }, "0,4": { GF: "d", UF: "g" },
  "0,5": { GF: "g", UF: "p" }, "0,6": { GF: "g", UF: "g" }, "0,7": { GF: "p", UF: "p" },
  // east wing, the short front (x=3)
  "3,2": { GF: "p", UF: "g" }, "3,3": { GF: "g", UF: "g" },
  // notch face in the east (x=2, z=5..9)
  "2,5": { GF: "g", UF: "p" }, "2,6": { GF: "p", UF: "g" }, "2,7": { GF: "g", UF: "p" },
  "2,8": { GF: "p", UF: "g" }, "2,9": { GF: "g", UF: "p" },
  // the rear tail's west face, and the north face of the notch
  "1,9": { GF: "g", UF: "p" }, "1,1": { GF: "g", UF: "g" },
  // the south end is only two cells wide: brick and glass there, not a blank quartz corner
  "1,10": { GF: "g", UF: "g" }, "2,10": { GF: "p", UF: "g" },
};
const PLAIN_END = new Set(["1,10", "2,10"]);
// Lamps in the air gap, each behind a pane (interior cells only)
const GLOW = [[1, 1, 3], [1, 1, 6], [1, 3, 6], [2, 3, 3]];
// Rooftop units on the deck (above the lidar line, on interior roof cells)
const UNITS = [[1, TOP + 1, 4], [2, TOP + 1, 3], [1, TOP + 1, 7]];

const g = new Voxels([W, 17, D]);
const placed = new Map();                                  // "x,y,z" -> block name, for the pane joins
const put = (x, y, z, block, state) => { placed.set(`${x},${y},${z}`, block); g.set(x, y, z, block, state); };
const solidAt = (x, y, z) => { const b = placed.get(`${x},${y},${z}`); return !!b && b !== "dark_oak_door" && b !== "glowstone"; };
// A pane joins the solid blocks and panes on its own wall's plane, never the air in front of or behind it.
function paneState(x, y, z, alongZ) {
  const a = alongZ ? [x, y, z - 1] : [x - 1, y, z], b = alongZ ? [x, y, z + 1] : [x + 1, y, z];
  const ja = solidAt(...a), jb = solidAt(...b);
  return alongZ
    ? { north: String(ja), south: String(jb), east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: String(jb), west: String(ja), waterlogged: "false" };
}
const doorState = (half, facing) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

// Pass 1: foundations, plinth, string course, walls, quoins and doors; glass is marked, not yet joined.
const glass = [];
for (const [x, z, ground] of cells) {
  const e = exposure(x, z), key = `${x},${z}`;
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");        // foundation up to the cell's ground
  put(x, PLINTH, z, "stone_bricks");                                     // plinth and ground-storey floor
  const exposedAny = e.W || e.E || e.N || e.S;
  const corner = (e.W || e.E) && (e.N || e.S) && !PLAIN_END.has(key);
  if (!exposedAny) { put(x, STRING, z, "oak_planks"); put(x, TOP, z, "smooth_stone"); continue; }
  put(x, STRING, z, corner ? "smooth_quartz" : "bricks");                // the storey line on the walls; the quoins stay quartz
  put(x, TOP, z, "smooth_quartz");                                       // the cornice
  for (const [row, rk] of [[GF, "GF"], [UF, "UF"]]) {
    if (corner) { put(x, row, z, "smooth_quartz"); continue; }
    const kind = (OPEN[key] ?? { GF: "p", UF: "p" })[rk];
    if (kind === "g") { put(x, row, z, "glass_pane"); glass.push([x, row, z, !(e.N || e.S)]); }
    else if (kind === "d") { put(x, row, z, "dark_oak_door", doorState("lower", e.W ? "west" : "east")); put(x, row + 1, z, "dark_oak_door", doorState("upper", e.W ? "west" : "east")); }
    else put(x, row, z, "bricks");
  }
}

// Pass 2: the panes take their joins from the finished walls.
for (const [x, row, z, alongZ] of glass) g.set(x, row, z, "glass_pane", paneState(x, row, z, alongZ));

// Lamps behind the glass, and the rooftop units.
for (const [x, y, z] of GLOW) g.set(x, y, z, "glowstone");
for (const [x, y, z] of UNITS) g.set(x, y, z, "light_gray_concrete");

const out = g.save(`${DIR}/DC55851.nbt`);
console.log(`DC55851.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
