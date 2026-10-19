// 153 West 44th Street, Hudson Theatre (NYC individual and interior landmark), a 1988 commercial and office building:
// a 24-block (about 27 m) eight-storey Postmodern office block on a polished-granite base. Footprint 23 x 39 (x across
// the front, low z = north = the street frontage with the entrance). The lidar roof is smoothed (3x3 median) into flat
// tiers on the storey grid: 24 (two crowns, the east one carrying a 3-block mechanical penthouse), 21, 15, 12, 9, 6.
// Every column is solid from y 0 to its tier, so nothing floats. Faces: granite base course (y 0), clear shopfronts with
// granite pilasters (y 1-2), then light-blue tinted glass in grid bays (mullions every third column) over light-grey
// spandrels at every storey line (y 3, 6, ...), a two-block granite cornice and parapet. Each glass pane has an air
// gap one block behind it, floored by the storey slab; a few gaps hold glowstone. A recessed entrance (two iron doors
// under a granite lintel) opens into a two-deep lobby. Open court cells are smooth stone paving.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1076172.cells.json`, "utf8"));
const X = 23, Y = 36, Z = 39;

const lidar = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const inFoot = (x, z) => lidar.has(`${x},${z}`);
const raw = (x, z) => (inFoot(x, z) ? lidar.get(`${x},${z}`) : 0);

// Neighbours of a cell with a lidar roof; a lidar hole inside the walls (5+ built neighbours) is built, not a pit.
const near = (x, z) => { const out = []; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const r = raw(x + dx, z + dz); if (r > 0) out.push(r); } return out; };
const built = (x, z) => inFoot(x, z) && (raw(x, z) > 0 || near(x, z).length - (raw(x, z) > 0 ? 1 : 0) >= 5);
const median = (a) => a.slice().sort((p, q) => p - q)[a.length >> 1];
const tierOf = (L) => (L >= 23 ? 24 : L >= 19 ? 21 : L >= 14 ? 15 : L >= 11 ? 12 : L >= 7 ? 9 : 6);
const roofAt = (x, z) => (built(x, z) ? tierOf(median(near(x, z))) : 0);

// Penthouse: the 3 x 3 block of 24-tier cells nearest the east edge (a mechanical box, 3 blocks, on the east crown).
let pent = null;
for (let z = 1; z < Z - 1; z++) for (let x = 1; x < X - 1; x++) {
  let ok = true;
  for (let dz = -1; dz <= 1 && ok; dz++) for (let dx = -1; dx <= 1 && ok; dx++) if (roofAt(x + dx, z + dz) !== 24) ok = false;
  if (ok && (!pent || x > pent.x)) pent = { x, z };
}
const inPent = (x, z) => pent && Math.abs(x - pent.x) <= 1 && Math.abs(z - pent.z) <= 1;

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const ORDER = ["N", "S", "W", "E"];
const g = new Voxels([X, Y, Z]);
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm panes

// 1. Core: solid columns from y 0 to each tier, a gravel-grey roof covering on top, paving on the court cells.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  const top = roofAt(x, z);
  if (!top) { g.set(x, 0, z, "smooth_stone"); continue; }
  for (let y = 0; y < top; y++) g.set(x, y, z, y === top - 1 ? "gray_concrete" : "stone");
}

// 2. Faces. Each exposed face cell takes a band by height: granite base, shopfront, then the grid of glass bays and
// spandrels. The cell behind a pane is air (or glowstone), so the glass has a gap and no interior.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const top = roofAt(x, z);
  if (!top) continue;
  for (let y = 0; y < top; y++) {
    const k = ORDER.findIndex((d) => roofAt(x + DIRS[d][0], z + DIRS[d][1]) <= y);
    if (k < 0) continue;
    const [dx, dz] = DIRS[ORDER[k]];
    const u = dx === 0 ? x : z;                       // position along the face
    const ix = x - dx, iz = z - dz;                   // the cell one block in, behind the face
    let block, gap = null;
    if (y === 0 || y === top - 1) block = "polished_granite";            // base course, cornice
    else if (y < 3) {                                                    // shopfront
      block = u % 3 === 0 ? "polished_granite" : "glass";
      if (u % 3 !== 0) gap = lit(u, y, k) ? "glowstone" : "air";
    }
    else if (y % 3 === 0) block = "light_gray_concrete";                  // storey spandrel = floor line
    else if (u % 3 === 0) block = "light_gray_concrete";                  // mullion
    else { block = "light_blue_stained_glass"; gap = lit(u, y, k) ? "glowstone" : "air"; }
    g.set(x, y, z, block);
    if (gap && inFoot(ix, iz)) g.set(ix, y, iz, gap);
  }
}

// 3. Parapet: a granite rim one block above every roof edge (any neighbour lower).
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const top = roofAt(x, z);
  if (!top || inPent(x, z)) continue;
  const edge = ORDER.some((d) => roofAt(x + DIRS[d][0], z + DIRS[d][1]) < top);
  if (edge) g.set(x, top, z, "polished_granite");
}

// 4. Penthouse: a 3-block mechanical box with glass on the ring at mid-height and a stone cap.
if (pent) {
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const x = pent.x + dx, z = pent.z + dz, edge = Math.abs(dx) === 1 || Math.abs(dz) === 1;
    for (let y = 24; y <= 26; y++) g.set(x, y, z, y === 26 ? "smooth_stone" : y === 25 && edge ? "light_blue_stained_glass" : "light_gray_concrete");
  }
}

// 5. Entrance: a recessed bay on the street face (low z) at x 10-11, granite jambs and a lintel, two iron doors and
// a two-deep lobby of air behind them.
for (const x of [9, 12]) for (const y of [1, 2]) g.set(x, y, 0, "polished_granite");
for (let x = 9; x <= 12; x++) g.set(x, 3, 0, "polished_granite");
g.set(10, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(10, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(11, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(11, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
for (const x of [10, 11]) for (const z of [1, 2]) for (const y of [1, 2]) g.set(x, y, z, "air");
g.set(10, 1, 2, "glowstone"); g.set(11, 1, 2, "glowstone");

const r = g.save(`${DIR}/NYC1076172.nbt`);
console.log(`NYC1076172: ${r.blocks} blocks, palette ${r.palette}, penthouse at ${pent ? `${pent.x},${pent.z}` : "none"}`);
