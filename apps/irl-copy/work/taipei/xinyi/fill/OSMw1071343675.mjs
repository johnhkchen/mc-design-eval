import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 12 x 10 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, late-1970s/80s Taipei mid-rise: granite base course,
// cream smooth-quartz tile walls, light-grey spandrels, ribbon glazing in
// piers, flat deck with parapet and a rooftop water tank.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343675";
const W = 12, H = 23, D = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gr_of = (x, z) => ground.get(`${x},${z}`);

const minG = Math.min(...cells.map((c) => c[2]));
const ROOF = minG + 10;   // flat deck top course (solid across footprint)
const PAR = ROOF + 1;     // parapet on perimeter
const S1 = minG + 5;      // storey 2 floor line

// Outward faces of a cell: -z north, +z south, -x west, +x east.
function outward(x, z) {
  const d = [];
  if (!has(x, z - 1)) d.push("north");
  if (!has(x, z + 1)) d.push("south");
  if (!has(x - 1, z)) d.push("west");
  if (!has(x + 1, z)) d.push("east");
  return d;
}

// Facade material for a single-face wall cell.
// idx = position along the wall (x for north/south faces, z for east/west).
function facade(y, idx) {
  if (y <= minG + 1) return "polished_granite";          // base course
  if (y === S1 || y === S1 + 1) return "light_gray_concrete"; // storey line
  let band = 0;
  if (y >= minG + 2 && y <= minG + 4) band = 1;
  else if (y >= minG + 7 && y <= minG + 9) band = 2;
  else return "smooth_quartz";
  if (idx % 3 === 0) return "smooth_quartz";              // piers / mullions
  if (band === 1 && y === minG + 3 && idx % 6 === 1) return "glowstone"; // warm lit bay
  if (band === 2 && y === minG + 8 && idx % 6 === 4) return "glowstone";
  return "glass_pane";
}

// 1. Foundations and per-cell body.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floors: ground slab per cell and storey floor slab.
  g.set(x, gr, z, "light_gray_concrete");
  if (S1 >= gr && S1 < ROOF) g.set(x, S1, z, "light_gray_concrete");

  const dirs = outward(x, z);
  if (dirs.length === 0) continue; // interior: air gap between slabs

  for (let y = gr; y < ROOF; y++) {
    if (y === gr && y <= minG + 1) { g.set(x, y, z, "polished_granite"); continue; }
    if (dirs.length > 1) {
      // Corner column: solid pier, reads as a clean vertical edge.
      g.set(x, y, z, y <= minG + 1 ? "polished_granite" : (y === S1 || y === S1 + 1) ? "light_gray_concrete" : "smooth_quartz");
      continue;
    }
    const face = dirs[0];
    const idx = (face === "north" || face === "south") ? x : z;
    g.set(x, y, z, facade(y, idx));
  }

  // Roof deck and parapet.
  g.set(x, ROOF, z, "light_gray_concrete");
  if (dirs.length > 0) g.set(x, PAR, z, "smooth_quartz");
}

// 2. Entrance: oak doors in the middle of the south-facing wall, at street level.
const southCells = cells
  .filter(([x, z]) => outward(x, z).includes("south"))
  .sort((a, b) => a[0] - b[0]);
if (southCells.length) {
  const [dx, dz, dgr] = southCells[Math.floor(southCells.length / 2)];
  const lower = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
  const upper = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };
  g.set(dx, dgr, dz, "oak_door", lower);
  g.set(dx, dgr + 1, dz, "oak_door", upper);
  // Entrance head course over the door (granite lintel).
  g.set(dx, dgr + 2, dz, "polished_granite");
}

// 3. Rooftop water tank: 2x2 on the deck, placed on the interior cell nearest centre.
const cx = (W - 1) / 2, cz = (D - 1) / 2;
const interior = cells
  .filter(([x, z]) => outward(x, z).length === 0 && has(x + 1, z) && has(x, z + 1) && has(x + 1, z + 1))
  .sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz));
if (interior.length) {
  const [tx, tz] = interior[0];
  for (const [ax, az] of [[tx, tz], [tx + 1, tz], [tx, tz + 1], [tx + 1, tz + 1]]) {
    if (!has(ax, az)) continue;
    g.set(ax, PAR, az, "white_concrete");
    g.set(ax, PAR + 1, az, "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
