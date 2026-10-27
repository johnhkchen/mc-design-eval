// Mt Eden / Eden Terrace, Auckland: a 1960s-70s four-storey concrete office block over a shopfront ground floor.
// Pale precast concrete with white string courses and piers, dark spandrels, blue-tinted glass, a flat roof behind a
// parapet. The lidar roof is flat at 19 (one 11 is noise and is smoothed out). Storey lines are absolute, so the block
// stays level while the ground falls from 0 (north-west, the street and the entrance) to 6 (south-east).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291249513.cells.json", "utf8"));

const X = 35, Y = 32, Z = 42;
const ROOF = 19;                 // flat roof height above y 0 (lidar), parapet cap sits on row 19
const ROOF_SLAB = ROOF - 1;      // roof deck, row 18
const FLOORS = [2, 6, 10, 14];   // storey slabs: ground floor on row 2, then every 4 rows

const foot = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inFoot = (x, z) => foot.has(`${x},${z}`);
const groundAt = (x, z) => foot.get(`${x},${z}`);
const isRing = (x, z) => !inFoot(x - 1, z) || !inFoot(x + 1, z) || !inFoot(x, z - 1) || !inFoot(x, z + 1);

// Interior: the foundation (below the cell's ground, and the 2-row plinth), the floor slabs, the roof deck. The rest is air.
function interiorBlock(y, gr) {
  if (y < gr || y < 2) return "stone_bricks";
  if (FLOORS.includes(y)) return "light_gray_concrete";
  if (y === ROOF_SLAB) return "smooth_stone";        // pale roof deck: reads from the rim above
  return null;
}

// Outer shell, row by row: foundation below ground, plinth, string course, then per storey spandrel + glass,
// with white piers on the bay lines. The ground floor is shopfront glass over a dark fascia.
function shellBlock(y, gr, pier) {
  if (y < gr) return "stone_bricks";
  if (y < 2) return "smooth_stone";
  if (y === ROOF_SLAB) return "white_concrete";      // cornice
  if (y === ROOF) return "light_gray_concrete";      // parapet cap
  if (FLOORS.includes(y)) return "white_concrete";   // string course
  if (pier) return "white_concrete";
  const F = Math.max(...FLOORS.filter((f) => f < y));
  const off = y - F;                                 // 1..3 inside a storey
  if (F === 2 && off === 3) return "gray_concrete";  // shopfront fascia
  if (F !== 2 && off === 1) return "gray_concrete";  // spandrel under each window band
  return "light_blue_stained_glass";
}

const v = new Voxels([X, Y, Z]);
let lamps = 0;

for (const [x, z, gr] of cells) {
  const ew = !inFoot(x - 1, z) || !inFoot(x + 1, z);   // a face looking east or west
  const ns = !inFoot(x, z - 1) || !inFoot(x, z + 1);   // a face looking north or south
  const ring = ew || ns;
  const pier = (ns && x % 3 === 0) || (ew && z % 3 === 0) || (ew && ns);

  if (!ring) {
    for (let y = 0; y < ROOF; y++) { const b = interiorBlock(y, gr); if (b) v.set(x, y, z, b); }
    continue;
  }
  for (let y = 0; y <= ROOF; y++) {
    if (x === 10 && z === 0 && (y === 3 || y === 4)) {          // the entrance door, centre of the north face
      const half = y === 3 ? "lower" : "upper";
      v.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    v.set(x, y, z, shellBlock(y, gr, pier));
  }
}

// Entrance canopy: a solid hood over the doorway, from the wall line out one cell, held by the shell at either end.
for (let x = 9; x <= 11; x++) v.set(x, 5, 1, "gray_concrete");
// A hanging lantern under the hood, lighting the lobby.
v.set(10, 4, 1, "lantern", { hanging: "true" });

// Warm light behind some top-row glass on the upper storeys: a hanging lantern from the slab above, in the room behind.
for (const [x, z, gr] of cells) {
  if (!isRing(x, z)) continue;
  const ew = !inFoot(x - 1, z) || !inFoot(x + 1, z);
  const ns = !inFoot(x, z - 1) || !inFoot(x, z + 1);
  const pier = (ns && x % 3 === 0) || (ew && z % 3 === 0) || (ew && ns);
  if (pier) continue;
  for (const F of FLOORS.filter((f) => f >= 6)) {
    const y = F + 3;
    if (y < gr || (x * 5 + z * 3 + F) % 4 !== 0) continue;
    const inward = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => [x + dx, z + dz])
      .find(([nx, nz]) => inFoot(nx, nz) && !isRing(nx, nz));
    if (!inward) continue;
    v.set(inward[0], y, inward[1], "lantern", { hanging: "true" });
    lamps++;
  }
}

// Roof plant: a lift and plant box on the roof deck, in the middle of the footprint, all cells interior.
const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length, cz = cells.reduce((s, [, z]) => s + z, 0) / cells.length;
let best = null;
for (let x0 = 0; x0 + 4 <= X; x0++) for (let z0 = 0; z0 + 3 <= Z; z0++) {
  let ok = true;
  for (let x = x0; x < x0 + 4 && ok; x++) for (let z = z0; z < z0 + 3 && ok; z++) if (!inFoot(x, z) || isRing(x, z)) ok = false;
  if (!ok) continue;
  const d = Math.hypot(x0 + 1.5 - cx, z0 + 1 - cz);
  if (!best || d < best.d) best = { x0, z0, d };
}
if (best) {
  for (let x = best.x0; x < best.x0 + 4; x++) for (let z = best.z0; z < best.z0 + 3; z++) {
    v.set(x, ROOF, z, "light_gray_concrete");
    v.set(x, ROOF + 1, z, "light_gray_concrete");
    v.set(x, ROOF + 2, z, "white_concrete");
  }
}

const r = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291249513.nbt");
console.log(`way_291249513: ${r.blocks} blocks, palette ${r.palette}, ${lamps} shell lanterns, plant at ${best ? `${best.x0},${best.z0}` : "none"}`);
