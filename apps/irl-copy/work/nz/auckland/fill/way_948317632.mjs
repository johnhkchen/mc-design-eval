// A three-storey brick commercial block (1920s stripped classical, Auckland): a two-storey podium over the whole
// footprint, a three-storey tower set back inside it, a smooth quartz cornice and parapet, a shopfront on the street (south)
// face with a timber door, and warm glowstone behind some windows. Massing is tiered from the lidar roof heights; every
// storey and tier stands on the one below, and the walls are built from the outside faces inward, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317632.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const byCell = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const has = (x, z) => byCell.has(key(x, z));
const G = (x, z) => byCell.get(key(x, z)).g;
const DIRS = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];
const OFF = Object.fromEntries(DIRS.map(([n, dx, dz]) => [n, [dx, dz]]));

// lidar roof at least 11 above the ground: three storeys, otherwise two (the lidar's 10-11 lower wings, smoothed to tiers)
const base = (x, z) => (byCell.get(key(x, z)).r - G(x, z) >= 11 ? 3 : 2);
const tower = (x, z) => has(x, z) && base(x, z) === 3 && DIRS.every(([, dx, dz]) => has(x + dx, z + dz) && base(x + dx, z + dz) === 3);
const nStor = (x, z) => (tower(x, z) ? 3 : 2);
const topOf = (x, z) => G(x, z) + 4 * nStor(x, z);   // the roof deck; the parapet sits one above

// the sides of a cell that face outside the building at height y: no neighbour, or one that does not reach y
function exposed(x, z, y) {
  const T = topOf(x, z), out = [];
  for (const [n, dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    const e = !has(nx, nz) || (y > T ? topOf(nx, nz) < T : y > topOf(nx, nz));
    if (e) out.push(n);
  }
  return out;
}

// the entrance: the south (street) face's ground bay nearest the middle of the front
const front = cells.filter(([x, z, gc]) => exposed(x, z, gc + 1).includes("south"));
const [doorX, doorZ] = front.reduce((a, b) => (Math.abs(b[0] - 5) < Math.abs(a[0] - 5) ? b : a));
const doorKey = key(doorX, doorZ);

const g = new Voxels([12, 26, 11]);
const windows = [];
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, gc] of cells) {
  const T = topOf(x, z);
  for (let y = 0; y <= T + 1; y++) {
    if (y < gc) { g.set(x, y, z, "stone"); continue; }            // foundation up to the ground
    const rel = y - gc, dirs = exposed(x, z, y);
    if (y === T + 1) { if (dirs.length) g.set(x, y, z, dirs.length > 1 ? "smooth_quartz" : "bricks"); continue; }
    if (rel % 4 === 0) {                                          // a floor slab, or a string course on the outside
      if (dirs.length) g.set(x, y, z, rel === 0 ? "polished_andesite" : "smooth_quartz");
      else g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (!dirs.length) continue;                                   // air behind the glass
    // a quoin only at a true footprint corner; a cell exposed on two sides at a setback step takes its street-ward face
    const outside = dirs.filter((n) => !has(x + OFF[n][0], z + OFF[n][1]));
    const corner = dirs.length > 1 && outside.length > 1;
    if (corner) { g.set(x, y, z, "smooth_quartz"); continue; }
    const [dir] = outside.length ? outside : dirs;
    const along = dir === "north" || dir === "south" ? x : z;     // position along the face
    const win = along % 2 === 1;
    const ground = rel < 4;
    const street = ground && dir === "south";
    if (street && key(x, z) === doorKey) {
      if (rel === 1) { g.set(x, y, z, "dark_oak_door", doorState("lower")); continue; }
      if (rel === 2) { g.set(x, y, z, "dark_oak_door", doorState("upper")); continue; }
      if (rel === 3) { g.set(x, y, z, "dark_oak_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" }); continue; }
    }
    if (ground && rel === 1) { g.set(x, y, z, "polished_andesite"); continue; }   // base course / shop bulkhead
    if (rel === 1) { g.set(x, y, z, win ? "smooth_quartz" : "bricks"); continue; }  // sills under the windows
    if (win) { g.set(x, y, z, "glass"); windows.push({ x, y, z, dir }); }
    else g.set(x, y, z, street ? "dark_oak_planks" : "bricks");   // shopfront mullions, or brick piers
  }
}

// warm light behind every third window: the cell just inside the glass, in the air gap
windows.forEach((w, i) => {
  if (i % 3) return;
  const [dx, dz] = OFF[w.dir], ix = w.x - dx, iz = w.z - dz;
  if (has(ix, iz) && g.get(ix, w.y, iz) === null) g.set(ix, w.y, iz, "glowstone");
});

// a plant room on the tower roof: a 2x2 of stone brick, the cell nearest the middle of the tower
const plant = cells.filter(([x, z]) => [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].every(([a, b]) => tower(a, b)));
if (plant.length) {
  const [px, pz] = plant.reduce((a, b) => (Math.hypot(b[0] + 0.5 - 5.5, b[1] + 0.5 - 5) < Math.hypot(a[0] + 0.5 - 5.5, a[1] + 0.5 - 5) ? b : a));
  const T = topOf(px, pz);
  for (const [a, b] of [[px, pz], [px + 1, pz], [px, pz + 1], [px + 1, pz + 1]]) {
    for (let y = T + 1; y <= T + 2; y++) g.set(a, y, b, "stone_bricks");
    g.set(a, T + 3, b, "smooth_quartz");
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317632.nbt";
const { blocks, palette } = g.save(out);
console.log(JSON.stringify({ footprint: cells.length, blocks, palette, door: [doorX, doorZ], windows: windows.length, out }));
