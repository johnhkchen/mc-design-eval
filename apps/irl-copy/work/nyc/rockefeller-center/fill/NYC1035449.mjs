// 605 Fifth Avenue, 1930: a mixed residential and commercial block of the setback years. A calcite shell on a granite
// base, quartz storey belts and a cornice, calcite piers framing glass windows set one block back, shopfronts on the
// ground floor of both long faces and a recessed entrance on the south face under a dark marquee. The lidar gives two
// tiers (a 7-storey wing and an 8-storey main body) and a copper-roofed penthouse set back from the street walls. The
// footprint cells with no lidar roof are a ground-level court, paved, with azaleas.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035449.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 27, Z = 7, Y = 29;
const g = new Voxels([X, Y, Z]);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const cellOf = (x, z) => at.get(`${x},${z}`);
const built = (x, z) => (cellOf(x, z)?.roof ?? 0) > 0;                       // a cell the lidar reads a roof over

// Tiers: the 5x5 median of the roof reads (wide enough that the lidar noise between parapets and plant goes), snapped
// down to a storey line (21 for the wing, 24 for the main body).
const medianRoof = (x, z) => {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (built(x + dx, z + dz)) v.push(cellOf(x + dx, z + dz).roof);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const mainDeck = (x, z) => (medianRoof(x, z) >= 24 ? 24 : 21);

// Distance in cells from the outside edge: the penthouse sits two or more cells in from every street wall.
const dist = new Map(), queue = [];
for (const [x, z, , roof] of cells) if (roof > 0 && DIRS.some(([dx, dz]) => !built(x + dx, z + dz))) { dist.set(`${x},${z}`, 1); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(`${x},${z}`);
  for (const [dx, dz] of DIRS) if (built(x + dx, z + dz) && !dist.has(`${x + dx},${z + dz}`)) { dist.set(`${x + dx},${z + dz}`, d + 1); queue.push([x + dx, z + dz]); }
}
const tallInside = cells.filter(([x, z, , roof]) => roof > 0 && mainDeck(x, z) === 24 && dist.get(`${x},${z}`) >= 2).map(([x]) => x).sort((a, b) => a - b);
const cx = tallInside[tallInside.length >> 1];
const pent = (x, z) => built(x, z) && mainDeck(x, z) === 24 && dist.get(`${x},${z}`) >= 2 && Math.abs(x - cx) <= 3;

const deck = (x, z) => mainDeck(x, z) + (pent(x, z) ? 3 : 0);                // the roof surface block, cornice on the edge
const top = (x, z) => deck(x, z) + (pent(x, z) ? 1 : 2);                     // exclusive: the main parapet is one block above the deck
const faces = (x, z) => DIRS
  .filter(([dx, dz]) => !built(x + dx, z + dz) || top(x + dx, z + dz) < top(x, z))
  .map(([dx, dz]) => ({ dx, dz, lo: built(x + dx, z + dz) ? deck(x + dx, z + dz) + 1 : 1 }));
const interior = (x, z) => built(x, z) && faces(x, z).length === 0;

const pane = (f) => (f.dz !== 0
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
// A window: the opening is air in the wall, the glass sits one block in, and a lit window has a lantern hung one block
// further in, under the next floor, so there is an air gap behind the glass.
const lit = (x, z, k) => (x * 7 + z * 3 + k * 5) % 5 === 0;
const opening = (x, y, z, f, glass, lamp) => {
  const ix = x - f.dx, iz = z - f.dz;
  if (!interior(ix, iz)) { g.set(x, y, z, glass, pane(f)); return; }        // no room to recess: the pane sits flush
  g.set(x, y, z, "air");
  g.set(ix, y, iz, glass, pane(f));
  if (lamp && interior(x - 2 * f.dx, z - 2 * f.dz)) g.set(x - 2 * f.dx, y, z - 2 * f.dz, "lantern", { hanging: "true", waterlogged: "false" });
};

// 1. Each footprint cell: granite foundation and base, a floor slab per storey, the roof deck (copper on the penthouse).
//    Cells with no lidar roof are the court: paving, and azaleas on a loose grid.
for (const [x, z, ground, roof] of cells) {
  if (!(roof > 0)) { g.set(x, 0, z, "stone_bricks"); if ((x + z) % 4 === 0) g.set(x, 1, z, "flowering_azalea"); continue; }
  for (let y = 0; y < Math.max(1, ground); y++) g.set(x, y, z, "polished_granite");
  for (let k = 1; 3 * k <= deck(x, z); k++) g.set(x, 3 * k, z, 3 * k === deck(x, z) && pent(x, z) ? "oxidized_copper" : "smooth_stone");
}

// 2. Facades: every exposed face of a built cell, from its lowest wall line up to its top. Belts every storey, piers on
//    a three-block bay, glass between; the ground floor is a shopfront on the two long faces and a granite wall elsewhere.
const ENTRANCE = { z: 6, xs: [6, 7, 8, 9, 10], door: 8 };
for (const [x, z, , roof] of cells) {
  if (!(roof > 0)) continue;
  const fs = faces(x, z);
  if (!fs.length) continue;
  const D = deck(x, z), T = top(x, z), corner = fs.length >= 2;
  const lo = Math.min(...fs.map((f) => f.lo));
  for (let y = lo; y < T; y++) {
    const f = fs[0];
    const k = Math.floor(y / 3);
    if (y === D) { g.set(x, y, z, "smooth_quartz"); continue; }                 // cornice
    if (y === D + 1) { g.set(x, y, z, "calcite"); continue; }                    // parapet
    if (corner) { g.set(x, y, z, y % 3 === 0 ? "smooth_quartz" : "calcite"); continue; }
    const front = f.dz === 1 && z === ENTRANCE.z && ENTRANCE.xs.includes(x);
    if (front && y === 3) { g.set(x, y, z, "polished_blackstone"); continue; }  // marquee over the entrance
    if (y % 3 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }             // storey belt
    if (y < 3) {                                                                 // ground floor
      if (front) {
        if (x === ENTRANCE.door) { g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        if (x === 7 || x === 9) { g.set(x, y, z, "air"); continue; }             // the vestibule, open to the street
        g.set(x, y, z, "polished_granite"); continue;
      }
      if (f.dz === 0) { g.set(x, y, z, "polished_granite"); continue; }        // short ends: a solid base
      const u = x;
      if (u % 3 === 0) { g.set(x, y, z, "polished_granite"); continue; }
      opening(x, y, z, f, "glass_pane", lit(x, z, k) && y === 2);
      continue;
    }
    const u = f.dz !== 0 ? x : z;
    if (u % 3 === 0) { g.set(x, y, z, "calcite"); continue; }                  // pier
    opening(x, y, z, f, "gray_stained_glass_pane", lit(x, z, k) && y === 3 * k + 2);
  }
}
// The lantern in the vestibule: hung under the marquee, one block in from the entrance.
g.set(ENTRANCE.door, 2, ENTRANCE.z - 1, "lantern", { hanging: "true", waterlogged: "false" });

// 3. Roof: a few flues on the wing roof, set in from the parapet, and the penthouse cornice is already on its edge.
for (const [x, z, , roof] of cells) {
  if (!(roof > 0) || pent(x, z) || mainDeck(x, z) !== 21 || dist.get(`${x},${z}`) < 2) continue;
  if ((x * 3 + z) % 7 === 0) { g.set(x, 22, z, "bricks"); g.set(x, 23, z, "bricks"); }
}

const { blocks, palette } = g.save(`${DIR}/NYC1035449.nbt`);
const tiers = Array.from({ length: Z }, (_, z) => Array.from({ length: X }, (_, x) => (!built(x, z) ? (cellOf(x, z) ? "." : " ") : pent(x, z) ? "P" : mainDeck(x, z) === 24 ? "M" : "w")).join(""));
console.log(`saved NYC1035449.nbt: ${blocks} blocks, ${palette} palette entries`);
console.log(`tiers (P penthouse, M main 24, w wing 21, . court, space outside):\n${tiers.join("\n")}`);
