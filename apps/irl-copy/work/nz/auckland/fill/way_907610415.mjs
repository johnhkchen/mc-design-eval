// Gentrack: a late-1980s Auckland office block, four storeys on a stepped footprint. Precast light-grey panels between
// white concrete piers, tinted glass bands, a stone plinth and string courses, a recessed entrance on the longest street
// face, and a flat gravel-look roof with a parapet and two plant boxes. Each storey is 4 blocks; tiers follow the lidar
// roof height, quantised to whole storeys so the massing reads as clean flat tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_907610415.cells.json", "utf8"));

// footprint: ground from the lidar, and the roof rounded to storeys (4 blocks), at least one storey
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, H: Math.max(4, 4 * Math.floor((r + 2) / 4)) });
const at = (x, z) => fp.get(`${x},${z}`);
// a cell at height y is outside the building when it is off the footprint or its tier stands below y
const outside = (x, z, y) => { const c = at(x, z); return !c || y > c.H; };
const DIRS = [[0, -1, "north"], [1, 0, "east"], [0, 1, "south"], [-1, 0, "west"]];
const outDirs = (x, z, y) => DIRS.filter(([dx, dz]) => outside(x + dx, z + dz, y));
const exposed = (x, z, y) => outDirs(x, z, y).length > 0;
const corner = (x, z, y) => { const o = outDirs(x, z, y); return o.some(([dx]) => dx) && o.some(([, dz]) => dz); };
// the pier line along a facade: x on a north/south face, z on an east/west face
const alongPos = (x, z, y) => { const o = outDirs(x, z, y)[0]; return o[1] !== 0 ? x : z; };

const g = new Voxels([57, 29, 84]);
const lights = [];

// 1. the envelope, cell by cell: foundation, plinth, storeys (string course, spandrel, glass band with piers), cap, parapet
for (const [key, { g: ground, H }] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y <= H + 1; y++) {
    if (y === 0 || y < ground) { g.set(x, y, z, "stone_bricks"); continue; }
    if (y === H) { g.set(x, y, z, "stone"); continue; }
    if (y === H + 1) { if (exposed(x, z, y)) g.set(x, y, z, "smooth_stone"); continue; }
    if (y > H) continue;
    const ex = exposed(x, z, y), r = y % 4, k = Math.floor(y / 4);
    if (r === 0) { g.set(x, y, z, ex ? "smooth_stone" : "light_gray_concrete"); continue; }      // floor slab / string course
    if (!ex) {                                                                                 // interior: air behind the glass
      if (r === 2 && k >= 1 && (x * 31 + z * 17 + k * 7) % 5 === 0) lights.push([x, y, z]);
      continue;
    }
    if (corner(x, z, y)) { g.set(x, y, z, "white_concrete"); continue; }
    if (r === 1) { g.set(x, y, z, k === 0 ? "stone_bricks" : "light_gray_concrete"); continue; }   // plinth / spandrel
    if (alongPos(x, z, y) % 3 === 0) g.set(x, y, z, "white_concrete");                         // pier
    else g.set(x, y, z, "light_blue_stained_glass");                                          // window
  }
}

// 2. glowstone just inside some lit windows (warm light behind the glass)
for (const [x, y, z] of lights) {
  const o = outDirs(x, z, y); if (o.length !== 1) continue;
  const [dx, dz] = o[0]; const ix = x - dx, iz = z - dz;
  if (at(ix, iz) && at(ix, iz).H >= y && !exposed(ix, iz, y)) g.set(ix, y, iz, "glowstone");
}

// 3. the entrance: the longest straight run of street face, door in the middle, lintel over, recessed vestibule
let best = null;
for (const [dx, dz] of DIRS) {
  const cand = [];
  for (const key of fp.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (!corner(x, z, 2) && outDirs(x, z, 2).some(([ax, az]) => ax === dx && az === dz)) cand.push([x, z]);
  }
  const lineOf = ([x, z]) => (dz !== 0 ? z : x), alongOf = ([x, z]) => (dz !== 0 ? x : z);
  const lines = new Map();
  for (const c of cand) { const l = lineOf(c); if (!lines.has(l)) lines.set(l, []); lines.get(l).push(c); }
  for (const cs of lines.values()) {
    cs.sort((a, b) => alongOf(a) - alongOf(b));
    let run = [];
    for (const c of cs) {
      if (run.length && alongOf(c) !== alongOf(run[run.length - 1]) + 1) run = [];
      run.push(c);
      if (run.length >= 7 && (!best || run.length > best.run.length)) best = { run: [...run], dx, dz };
    }
  }
}
if (best) {
  const { run, dx, dz } = best;
  const trimmed = run.slice(2, -2);
  const [mx, mz] = run[Math.floor(run.length / 2)];
  const face = DIRS.find(([a, b]) => a === dx && b === dz)[2];
  // lintel over the entrance bay, two blocks back into the recess
  for (const [x, z] of trimmed) g.set(x, 3, z, "smooth_stone");
  for (const [x, z] of run) { if (!trimmed.some(([a, b]) => a === x && b === z)) g.set(x, 3, z, "light_gray_concrete"); }
  // recessed vestibule: the cell inside the door is air, with a hanging lantern under the lintel
  const ix = mx - dx, iz = mz - dz;
  for (const y of [1, 2]) g.set(ix, y, iz, "air");
  g.set(ix, 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
  // iron door, two halves, facing out
  const door = { facing: face, hinge: "left", open: "false", powered: "false" };
  g.set(mx, 1, mz, "iron_door", { ...door, half: "lower" });
  g.set(mx, 2, mz, "iron_door", { ...door, half: "upper" });
}

// 4. roof plant: two solid boxes on the top tier's core, with a stone cap
const core = [];
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (c.H === 16 && DIRS.every(([dx, dz]) => at(x + dx, z + dz) && at(x + dx, z + dz).H >= 16)) core.push([x, z]);
}
core.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const boxes = [];
const fits = (x0, z0) => { for (let x = x0; x < x0 + 5; x++) for (let z = z0; z < z0 + 3; z++) if (!core.some(([a, b]) => a === x && b === z)) return false; return true; };
for (const [x, z] of core) {
  if (boxes.length >= 2) break;
  if (!fits(x, z)) continue;
  if (boxes.length && Math.abs(boxes[0][0] - x) + Math.abs(boxes[0][1] - z) < 14) continue;
  boxes.push([x, z]);
}
for (const [x0, z0] of boxes) {
  for (let x = x0; x < x0 + 5; x++) for (let z = z0; z < z0 + 3; z++) {
    for (let y = 17; y <= 19; y++) g.set(x, y, z, y === 19 ? "smooth_stone" : "light_gray_concrete");
  }
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_907610415.nbt");
console.log(`way_907610415: ${cells.length} cells, ${lights.length} lit-window candidates, entrance ${best ? "placed" : "none"}, plant boxes ${boxes.length}, ${info.blocks} blocks, ${info.palette} palette`);
