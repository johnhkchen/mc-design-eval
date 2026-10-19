// 590 Fifth Avenue, 1987 commercial and office building: a 73-block (about 81 m) glass-and-granite office tower on an
// 11-storey stone podium. Footprint 33 x 15 (x across the front, low x = west, high x = east = the 5th Avenue frontage
// with the main entrance; low z = north = the street face). Lidar roofs are smoothed into tiers: an 11-storey granite
// and limestone base (33) across the whole plot, a 5th Avenue street wall at 33 with a 37 pavilion at the north-east
// corner, a 15-storey west block (45) and a 22-storey north and east shoulder (66), and the south-west tower (70) with a
// 73 mechanical crown. The lidar's light court (roof 0) is open paving at ground. Podium and tower are one solid mass,
// faced by piers and bays: a granite base course, smooth limestone storey bands on the podium, light-grey spandrels
// and dark mullions on the blue glass curtain wall above it, a smooth stone cornice on every exposed roof edge. The
// glass sits on the outer face with an air slot behind it (no interiors) and some panes have glowstone in that slot.
// Ground floor: clear shopfronts on the street and avenue faces, a recessed glass entrance on the avenue with a granite
// canopy and two hanging lanterns. Roof terrace on the 5th Avenue wing with mechanical boxes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034485.cells.json`, "utf8"));
const X = 33, Y = 85, Z = 15;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);

// Tops (block heights above y 0), read off the lidar and smoothed into tiers. 0 = open ground (the court, or outside).
const PODIUM = 33;                                             // the stone base is everything below this
const roofAt = (x, z) => {
  if (!inFoot(x, z) || lidar(x, z) === 0) return 0;            // the light court is open paving
  if (x >= 30) return z <= 1 ? 37 : PODIUM;                    // 5th Avenue street wall, NE pavilion
  if (x <= 8 && z <= 8) return 45;                             // west block
  if ((z <= 5 && x >= 9) || (x >= 26 && x <= 29)) return lidar(x, z) < 50 ? 45 : 66;   // north and east shoulders
  if (x >= 6 && x <= 25 && z >= 6) {                           // south-west tower, notched cells step down to 45
    if (lidar(x, z) < 50) return 45;
    if (x >= 11 && x <= 14 && z >= 9 && z <= 12) return 73;    // mechanical crown
    return 70;
  }
  return 0;
};

const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const g = new Voxels([X, Y, Z]);

// Facing directions: E = high x, the 5th Avenue face with the entrance; W = low x; N = low z (the street); S = high z.
const DIRS = [{ n: "E", dx: 1, dz: 0 }, { n: "W", dx: -1, dz: 0 }, { n: "N", dx: 0, dz: -1 }, { n: "S", dx: 0, dz: 1 }];
// A cell at height y faces a direction when the cell beside it is open there (outside, court, or lower roof).
const open = (x, y, z) => roofAt(x, z) <= y;
const facesOf = (x, y, z) => DIRS.filter((d) => open(x + d.dx, y, z + d.dz));
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm panes

// 1. Solid mass: foundation from y 0 up to each cell's ground (all zero here, so nothing is filled), the core to the roof,
// a roof membrane on each top, and paving on the court.
for (const [x, z] of cols) {
  const { ground } = cell.get(`${x},${z}`), top = roofAt(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");
  if (!top) { g.set(x, 0, z, "stone_bricks"); continue; }
  for (let y = ground; y < top; y++) {
    const crown = top === 73 && y >= 70;
    g.set(x, y, z, y === top - 1 ? "gray_concrete" : crown ? "smooth_quartz" : y < PODIUM ? "stone" : "light_gray_concrete");
  }
}

// 2. Faces. Granite base course at y 0, a clear shopfront at y 1-2 on the ground floor, storey bands above it (smooth
// limestone on the podium, light-grey spandrels on the glass tower), piers every third column (granite on the podium,
// dark concrete mullions on the tower), blue glass between. The crown has one glass band in its penthouse storey.
const pier = (u) => u % 3 === 0;
const facade = (x, y, z, d, top) => {
  const u = d.dx === 0 ? x : z;                                // position along the face
  if (y === top - 1) return "smooth_stone";                    // cornice on every exposed roof edge
  if (y === 0) return "polished_granite";                      // base course
  if (top === 73 && y >= 70) return y === 71 ? "light_blue_stained_glass" : "smooth_quartz";
  if (y < PODIUM) {
    if (y < 3) return pier(u) ? "polished_granite" : "glass";  // shopfront
    if (y % 3 === 0) return "smooth_stone";
    return pier(u) ? "polished_granite" : "light_blue_stained_glass";
  }
  if (y % 3 === 0) return "light_gray_concrete";
  return pier(u) ? "gray_concrete" : "light_blue_stained_glass";
};

const windows = [];                                            // glass on the outer face, to get an air slot behind it
for (const [x, z] of cols) {
  const top = roofAt(x, z);
  for (let y = 0; y < top; y++) {
    const faces = facesOf(x, y, z);
    if (!faces.length) continue;
    const d = faces[0];                                        // a corner takes its first open face
    const block = facade(x, y, z, d, top);
    g.set(x, y, z, block);
    if (block === "glass" || block === "light_blue_stained_glass") windows.push({ x, y, z, d });
  }
}

// 3. The 5th Avenue entrance: a recess three blocks wide on the E face (x 32) at y 1-2, clear glass doors one block in,
// an empty lobby slot behind them, a granite canopy over the recess on the storey line, and two hanging lanterns.
for (const z of [6, 7, 8]) {
  for (const y of [1, 2]) {
    g.set(32, y, z, "air");
    g.set(31, y, z, "glass");
    g.set(30, y, z, "air");
  }
  g.set(32, 3, z, "polished_granite");
}
g.set(32, 2, 6, "lantern", { hanging: "true", waterlogged: "false" });
g.set(32, 2, 8, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Air slot and warm light behind the glass: one block in from each window pane, in the storey's glass rows only.
// Floor lines stay solid (the core is the slab). Cells that face the air are not touched.
for (const { x, y, z, d } of windows) {
  if (y % 3 === 0) continue;
  const ix = x - d.dx, iz = z - d.dz;
  if (!inFoot(ix, iz) || roofAt(ix, iz) <= y || facesOf(ix, y, iz).length) continue;
  const u = d.dx === 0 ? x : z;
  const k = DIRS.indexOf(d);
  g.set(ix, y, iz, lit(u, y, k) ? "glowstone" : "air");
}

// 5. Roof: two mechanical boxes on the 5th Avenue wing terrace, and a lantern on the crown.
for (const x of [30, 31]) for (const z of [5, 6]) for (const y of [PODIUM, PODIUM + 1]) g.set(x, y, z, "smooth_quartz");
g.set(12, 73, 10, "lantern", { hanging: "false", waterlogged: "false" });

const counts = g.save(`${DIR}/NYC1034485.nbt`);
console.log(`NYC1034485: ${counts.blocks} blocks, ${counts.palette} palette entries, ${windows.length} glazed faces`);
