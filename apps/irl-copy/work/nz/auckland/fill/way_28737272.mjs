// Auckland Transport, Auckland: a 1980s-90s concrete office block (basalt-stone base course, quartz piers, blue-glass
// curtain wall between light-grey spandrels, a stone cornice), 8 storeys of 4 blocks on a main tier to 37 and a lower
// wing to 34. Massing: the lidar roof, smoothed over a 5x5 window and snapped to two tiers. Each tier stands on a solid
// floor slab at every 4 blocks; the shell is the perimeter cells (glass is the wall itself, air behind it); interiors are air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_28737272.cells.json`, "utf8"));
const g = new Voxels([96, 49, 63]);

const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { x, z, ground, roof });

// Tier per cell: the lidar roof averaged over a 5x5 window, then one of two flat tops (solid through top - 1)
for (const c of cell.values()) {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const o = cell.get(key(c.x + dx, c.z + dz)); if (o) { s += o.roof; n++; }
  }
  c.top = s / n >= 35.5 ? 37 : 34;                          // main roof 37, lower wings 34
}

// A cell is shell when a side faces outside the footprint or a lower tier (the step of a setback is a wall too)
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const c of cell.values()) {
  c.exp = DIRS.filter(([dx, dz]) => { const o = cell.get(key(c.x + dx, c.z + dz)); return !o || o.top < c.top; });
  c.perim = c.exp.length > 0;
}

// Storeys sit on floor slabs at y = 4, 8, ... 32 (and 36 on the main roof); storey s spans rows 4s+1 .. 4s+3:
// spandrel, then two glass rows. The ground storey (s = 1) has a stone plinth row and a shopfront.
const PIER = "quartz_block", GLASS = "light_blue_stained_glass", SPAN = "light_gray_concrete", SLAB = "white_concrete";
const BASE = "stone_bricks", INNER_SLAB = "light_gray_concrete";

// Entrance: the southernmost run of shell cells facing +z on the main tier, nearest the footprint's middle
const cx = cells.reduce((a, [x]) => a + x, 0) / cells.length;
const southZ = Math.max(...[...cell.values()].filter(c => c.top === 37 && c.perim && c.exp.some(([, dz]) => dz === 1)).map(c => c.z));
const doorCands = [...cell.values()].filter(c => c.top === 37 && c.exp.length === 1 && c.exp[0][1] === 1 && c.z >= southZ - 3);
const door = doorCands.sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx))[0];
const entrance = new Set(door ? [-1, 0, 1].map(d => key(door.x + d, door.z)) : []);

// One facade block: piers every 3rd coordinate, glass between; corners are piers; a few glass bays light from behind
function facade(c, y) {
  const xExp = c.exp.some(([dx]) => dx), zExp = c.exp.some(([, dz]) => dz);
  const corner = xExp && zExp;
  const coord = xExp && !zExp ? c.z : c.x;                    // the wall runs along z for an x-facing side, else along x
  const bay = Math.floor(coord / 3), pier = coord % 3 === 0 || corner;
  const s = Math.floor(y / 4), local = y - 4 * s;
  if (s === 1 && local === 1) return { b: BASE };             // ground-floor plinth
  if (s === 1 && !pier) return { b: GLASS };                  // shopfront glass
  if (s === 1) return { b: PIER };
  if (y === c.top - 2) return { b: BASE };                    // cornice band under the roof cap
  if (local === 1) return { b: pier ? PIER : SPAN };          // spandrel between floors
  if (pier) return { b: PIER };
  return { b: GLASS, light: s % 2 === 0 && local === 2 && coord % 3 === 2 && bay % 3 === 1 ? c : null };
}

for (const c of cell.values()) {
  const cap = c.top - 1;
  for (let y = 0; y <= cap; y++) {
    if (y <= 4) { g.set(c.x, y, c.z, c.perim ? BASE : "stone"); continue; }     // basalt podium to the slab at 4
    const slab = y === cap || y % 4 === 0;
    if (slab) { g.set(c.x, y, c.z, y === cap ? (c.perim ? BASE : INNER_SLAB) : (c.perim ? SLAB : INNER_SLAB)); continue; }
    if (!c.perim || entrance.has(key(c.x, c.z)) && y <= 7) continue;   // air behind the glass; entrance drawn below
    const f = facade(c, y);
    g.set(c.x, y, c.z, f.b);
    if (f.light) {                                              // a glowstone lamp behind the glass, in the air gap
      const d = c.exp[0], ix = c.x - d[0], iz = c.z - d[1], inner = cell.get(key(ix, iz));
      if (c.exp.length === 1 && inner && !inner.perim) g.set(ix, y, iz, "glowstone");
    }
  }
}

// Entrance: a lobby of glass either side of a door, a stone lintel as the canopy over it, a lantern inside
if (door) {
  const z = door.z;
  for (const d of [-1, 0, 1]) {
    const x = door.x + d;
    if (!cell.has(key(x, z))) continue;
    g.set(x, 4, z, BASE);
    g.set(x, 5, z, BASE);
    g.set(x, 6, z, d === 0 ? "air" : GLASS);
    g.set(x, 7, z, BASE);
  }
  g.set(door.x, 5, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(door.x, 6, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  if (cell.has(key(door.x, z - 1))) g.set(door.x, 5, z - 1, "lantern");
}

// Roof plant: up to six boxes on the main roof, in from the edge, each 4 x 3 on the roof cap
const cap = 36;
const depth = new Map();                                       // distance in cells from the shell, on the main tier
const queue = [];
for (const c of cell.values()) if (c.top === 37 && c.perim) { depth.set(key(c.x, c.z), 0); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) {
    const o = cell.get(key(c.x + dx, c.z + dz));
    if (o && o.top === 37 && !depth.has(key(o.x, o.z))) { depth.set(key(o.x, o.z), d + 1); queue.push(o); }
  }
}
const boxes = [];
for (let x = 6; x < 96 && boxes.length < 6; x += 2) for (let z = 6; z < 63 && boxes.length < 6; z += 2) {
  const fits = [0, 1, 2, 3].every(dx => [0, 1, 2].every(dz => (depth.get(key(x + dx, z + dz)) ?? 0) >= 3));
  if (!fits || boxes.some(([bx, bz]) => Math.abs(bx - x) < 14 && Math.abs(bz - z) < 14)) continue;
  boxes.push([x, z]);
}
for (const [bx, bz] of boxes) {
  for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 3; dz++) {
    g.set(bx + dx, cap + 1, bz + dz, "light_gray_concrete");
    g.set(bx + dx, cap + 2, bz + dz, "light_gray_concrete");
    g.set(bx + dx, cap + 3, bz + dz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

const out = `${HERE}/way_28737272.nbt`;
const stats = g.save(out);
console.log(`way_28737272: ${stats.blocks} blocks, ${stats.palette} palette, door ${door ? `${door.x},${door.z}` : "none"}, ${boxes.length} roof boxes`);
