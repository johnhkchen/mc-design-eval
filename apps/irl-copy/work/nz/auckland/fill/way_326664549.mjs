// way 326664549: a 1930s brick-and-plaster block (stripped-classical, Auckland's inter-war flats and offices), 4 storeys
// on the high core, 3 on the wing, 2 on the low corner. Hollow shell: a solid floor slab every 4 blocks, air between,
// red brick walls with cream plaster piers, spandrels and string courses, glass panes in the bays, a cream cornice and
// parapet, a shopfront and a door on the lowest street face, glowstone lamps behind some panes, and a roof plant on the core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_326664549.cells.json`, "utf8"));   // [x, z, ground, roof] per cell
const X = 42, Z = 39, Y = 29;

// footprint: ground (-1 = not in footprint), and the lidar roof height (absolute y)
const ground = Array.from({ length: X }, () => Array(Z).fill(-1));
const lidar = Array.from({ length: X }, () => Array(Z).fill(0));
for (const [x, z, gr, roof] of cells) { ground[x][z] = gr; lidar[x][z] = roof; }
const inF = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && ground[x][z] >= 0;

// Clean tiers: the 5x5 mean of the lidar roof, snapped to a 16 core, a 12 wing and an 8 corner (surface heights).
// TOP is the index of the roof block; the parapet/cornice runs one above it on outward faces.
const TOP = Array.from({ length: X }, () => Array(Z).fill(-1));
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  let s = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inF(x + dx, z + dz)) { s += lidar[x + dx][z + dz]; n++; }
  const m = s / n;
  const surface = m >= 14.5 ? 16 : m >= 11.5 ? 12 : 8;
  TOP[x][z] = surface - 1;
}

const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const topOf = (x, z) => (inF(x, z) ? TOP[x][z] : -1);
const outward = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
// a wall block: exposed to air on some side (outside the footprint, or beside a lower tier)
const isShell = (x, y, z) => DIRS.some(([dx, dz]) => topOf(x + dx, z + dz) < y);

const g = new Voxels([X, Y, Z]);
const lamps = [];

// the entrance: the lowest-ground cell on the north (street) face, nearest the middle of the face
const north = cells.filter(([x, z]) => z === Math.min(...cells.map(c => c[1])) && !inF(x, z - 1));
const door = north.reduce((best, c) => (!best || c[2] < best[2] || (c[2] === best[2] && Math.abs(c[0] - 19) < Math.abs(best[0] - 19)) ? c : best), null);

for (const [x, z, G] of cells) {
  const T = TOP[x][z];
  const faces = outward(x, z);
  const alongX = !inF(x, z - 1) || !inF(x, z + 1);   // bays run along x on north/south faces, along z on east/west
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");                       // foundation, solid up to the ground
  for (let y = G; y <= T; y++) {
    if (!isShell(x, y, z)) {
      if (y === T) g.set(x, y, z, "smooth_stone");                                  // flat roof over the room
      else if (y % 4 === 0) g.set(x, y, z, "stone_bricks");                         // floor slab per storey
      continue;                                                                     // else air: the room behind the wall
    }
    const along = alongX ? x : z;
    const bay = along % 3 !== 0;                                                   // two panes, then a brick pier
    if (y === G) g.set(x, y, z, "polished_andesite");                              // base course
    else if (y === T) g.set(x, y, z, "smooth_quartz");                             // cornice
    else if (y % 4 === 0) g.set(x, y, z, "smooth_quartz");                         // string course per storey
    else if (y % 4 === 3 || !bay) g.set(x, y, z, "bricks");                        // spandrel and brick piers
    else {
      const shop = y < 4 && faces.length > 0;
      g.set(x, y, z, shop ? "glass" : "glass_pane");
      const out = faces[0];
      if (out && (x + y * 3 + z * 5) % 6 === 0) lamps.push([x - out[0], y, z - out[1]]);   // glowstone behind some panes
    }
  }
  if (faces.length && T + 1 < Y) g.set(x, T + 1, z, "smooth_quartz");             // parapet on the outer edge
}

// lamps go in after the room cells are placed, so they are never overwritten; only into empty room cells
for (const [x, y, z] of lamps) if (inF(x, z) && g.get(x, y, z) === null) g.set(x, y, z, "glowstone");

// entrance: a door on the street face, pilasters either side, the lintel above is already the spandrel
const [dx0, dz0, dg0] = door;
g.set(dx0, dg0, dz0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx0, dg0 + 1, dz0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const dx of [-1, 1]) if (inF(dx0 + dx, dz0)) g.set(dx0 + dx, dg0, dz0, "smooth_quartz");

// roof plant on the core: a flat plant box set in from the parapet, with one brick flue
const core = cells.filter(([x, z]) => TOP[x][z] === 15);
const cx = Math.round(core.reduce((s, c) => s + c[0], 0) / core.length);
const cz = Math.round(core.reduce((s, c) => s + c[1], 0) / core.length);
const coreIn = (x, z) => inF(x, z) && TOP[x][z] === 15;
let plant = 0;
for (let x = cx - 2; x <= cx + 2; x++) for (let z = cz - 1; z <= cz + 1; z++) {
  let inset = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (!coreIn(x + dx, z + dz)) inset = false;
  if (!inset) continue;
  g.set(x, 16, z, "stone_bricks"); plant++;
}
for (let y = 17; y <= 18; y++) for (const [x, z] of [[cx + 3, cz - 1], [cx + 4, cz - 1], [cx + 3, cz], [cx + 4, cz]])
  if (coreIn(x, z)) g.set(x, y, z, "bricks");
for (let x = cx + 3; x <= cx + 4; x++) for (let z = cz - 1; z <= cz; z++) if (coreIn(x, z)) g.set(x, 16, z, "stone_bricks");

const { blocks, palette } = g.save(`${DIR}/way_326664549.nbt`);
const tiers = { 16: 0, 12: 0, 8: 0 };
for (const [x, z] of cells) tiers[TOP[x][z] + 1]++;
console.log(JSON.stringify({ cells: cells.length, tiers, door: [dx0, dz0, dg0], plantCells: plant, lamps: lamps.length, blocks, palette }));
