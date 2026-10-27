// AA Insurance, Auckland: a nine-storey 1970s-80s concrete-frame office block around a ground-level court.
// Footprint 45 x 77 blocks; the lidar roof puts the main slab at 36 blocks (9 storeys of 4), with a 38-block plant
// zone on the west side. Cells the lidar reads as open ground (roof within a block of the ground) are a paved court.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_260089805.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([45, 51, 77]);

const K = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, ground, roof]) => [K(x, z), { x, z, ground, roof }]));

// the lidar roof, median-smoothed over the 3 x 3 footprint neighbourhood: noise out, edges kept
const medianRoof = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = raw.get(K(x + dx, z + dz)); if (c) v.push(c.roof); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};

// massing: T = the top of the column (roof surface), null = open ground. Tiers are whole storeys (4 blocks)
const cell = new Map();
for (const { x, z, ground, roof } of raw.values()) {
  const s = medianRoof(x, z);
  let T = null;
  if (s - ground > 1) T = s >= 37.5 ? 38 : s >= 33 ? 36 : Math.max(4 * Math.round(s / 4), ground + 4);
  cell.set(K(x, z), { x, z, gr: ground, T });
}
const topOf = (c) => c.T ?? c.gr + 1;   // an open cell's surface is its ground block
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the outward faces of a building cell at height y: outside the footprint, or a neighbour that stands lower there
const outs = (c, y) => DIRS.filter(([dx, dz]) => { const n = cell.get(K(c.x + dx, c.z + dz)); return !n || y >= topOf(n); });
// a pier every third block along a face; the other bays are glass with frames
const isPier = (c, [dx]) => (dx !== 0 ? c.z : c.x) % 3 === 0;

// 1. ground and foundations: open ground is grass on dirt to its ground; the building stands on stone to its ground
for (const c of cell.values()) {
  if (c.T === null) { for (let y = 0; y <= c.gr; y++) g.set(c.x, y, c.z, y === c.gr ? "grass_block" : "dirt"); continue; }
  for (let y = 0; y < c.gr; y++) g.set(c.x, y, c.z, "stone_bricks");
}

// 2. the building: storey slabs at every fourth block, the roof slab on top, a shell of facade one block thick with
//    the cells behind it left as air (an air gap behind the glass)
for (const c of cell.values()) {
  if (c.T === null) continue;
  for (let y = c.gr; y < c.T; y++) {
    const o = outs(c, y), shell = o.length > 0;
    const slab = y === c.gr || y === c.T - 1 || y % 4 === 0;
    if (!shell && !slab) continue;
    let b;
    if (!shell) b = "light_gray_concrete";
    else if (y === c.T - 1) b = "smooth_stone";            // cornice
    else if (y === c.gr) b = "stone_bricks";              // base course
    else if (y % 4 === 0) b = "smooth_stone";             // storey string course
    else if (y % 4 === 3) b = "white_concrete";           // spandrel under each floor line
    else if (isPier(c, o[0])) b = "light_gray_concrete";  // piers stand proud of the glass
    else {
      // glass sits one block in, so the piers and spandrels cast a reveal; a thin wing with no cell behind keeps its glass in the shell
      const [dx, dz] = o[0], r2 = cell.get(K(c.x - dx, c.z - dz));
      const recessed = r2 && r2.T !== null && y >= r2.gr && y < r2.T && !outs(r2, y).length;
      if (recessed) { g.set(r2.x, y, r2.z, "light_blue_stained_glass"); continue; }
      b = "light_blue_stained_glass";
    }
    g.set(c.x, y, c.z, b);
  }
}

// 3. warm light: glowstone behind some glass bays, in the air gap behind the recessed glass
for (const c of cell.values()) {
  if (c.T === null) continue;
  for (let y = c.gr + 1; y < c.T - 1; y++) {
    if (y % 4 === 0 || y % 4 === 3) continue;
    const o = outs(c, y);
    if (!o.length || isPier(c, o[0]) || (c.x * 5 + c.z * 3 + y) % 9 !== 0) continue;
    const [dx, dz] = o[0], r2 = cell.get(K(c.x - dx, c.z - dz)), ic = cell.get(K(c.x - 2 * dx, c.z - 2 * dz));
    if (!r2 || !ic || r2.T === null || ic.T === null || y < ic.gr || y >= ic.T || outs(r2, y).length || outs(ic, y).length) continue;
    g.set(ic.x, y, ic.z, "glowstone");
  }
}

// 4. entrance on the street (+z) face, the bay nearest the middle: double doors, a canopy band over them
const doorCand = [...cell.values()]
  .filter((c) => c.T !== null && c.T > c.gr + 4 && !cell.get(K(c.x, c.z + 1)) && outs(c, c.gr + 1).some(([dx, dz]) => dx === 0 && dz === 1))
  .sort((a, b) => Math.abs(a.x - 22) - Math.abs(b.x - 22));
if (doorCand.length) {
  const d = doorCand[0], door = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(d.x, d.gr + 1, d.z, "dark_oak_door", { ...door, half: "lower" });
  g.set(d.x, d.gr + 2, d.z, "dark_oak_door", { ...door, half: "upper" });
  for (let x = d.x - 2; x <= d.x + 2; x++) {
    const n = cell.get(K(x, d.z));
    if (n && n.T !== null && n.T > d.gr + 3) g.set(x, d.gr + 3, d.z, "smooth_stone_slab", { type: "top" });
  }
}

// 5. the plant rooftop: a few 3 x 3 roof-plant boxes on the 36 slab, set in from the parapet
for (const c of cell.values()) {
  if (c.T !== 36 || c.x % 10 !== 5 || c.z % 9 !== 4) continue;
  const block = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) block.push(cell.get(K(c.x + dx, c.z + dz)));
  if (block.some((n) => !n || n.T !== 36 || outs(n, 35).length)) continue;
  for (const n of block) for (let y = 36; y <= 37; y++) g.set(n.x, y, n.z, "light_gray_concrete");
}

// 6. the court: a few trees on the open ground, only where the whole crown stays in open footprint
const open = (x, z) => { const n = cell.get(K(x, z)); return !!n && n.T === null; };
for (const c of cell.values()) {
  if (c.T !== null || c.x % 8 !== 4 || c.z % 10 !== 5) continue;
  const crown = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (Math.abs(dx) + Math.abs(dz) <= 2) crown.push([c.x + dx, c.z + dz]);
  if (!crown.every(([x, z]) => open(x, z)) || !open(c.x, c.z)) continue;
  for (let y = c.gr + 1; y <= c.gr + 2; y++) g.set(c.x, y, c.z, "oak_log", { axis: "y" });
  for (const [x, z] of crown) {
    if (Math.abs(x - c.x) + Math.abs(z - c.z) <= 1) g.set(x, c.gr + 3, z, "oak_leaves", { persistent: "true", distance: "1" });
    g.set(x, c.gr + 4, z, "oak_leaves", { persistent: "true", distance: "1" });
  }
  g.set(c.x, c.gr + 5, c.z, "oak_leaves", { persistent: "true", distance: "1" });
}

const stats = g.save(`${DIR}/way_260089805.nbt`);
console.log(JSON.stringify(stats));
