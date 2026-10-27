// Way 332241877, Auckland: a three-storey 1930s brick commercial block on a sloping site. Brick walls on a
// stone plinth, cream string courses and cornice, steel-frame windows with white mullions, a shopfront on the
// flat (north) side with a recessed door and canopy, and a flat roof with a plant box behind the parapet.
// The roof is smoothed from the lidar's 10/11 into two flat tiers; the ground steps 0 to 1 on the south half.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241877.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..25, z 0..21

const k = (x, z) => `${x},${z}`;
const info = new Map(cells.map(([x, z, g, r]) => [k(x, z), { g, r }]));
const inFp = (x, z) => info.has(k(x, z));

// Smooth the roof: mean of the 3x3 footprint neighbourhood, then one of two flat tiers (roof surface at 10 or 11)
const tier = new Map();
for (const [x, z] of Array.from(info.keys(), (s) => s.split(",").map(Number))) {
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = info.get(k(x + dx, z + dz)); if (c) { sum += c.r; n++; }
  }
  tier.set(k(x, z), sum / n >= 10.5 ? 11 : 10);
}

// The faces a footprint cell shows to the outside: [name, outward normal dx, dz]
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const exposed = (x, z) => FACES.filter(([, dx, dz]) => !inFp(x + dx, z + dz));
const perimeter = (x, z) => exposed(x, z).length > 0;

const g = new Voxels([26, 24, 22]);
const put = (x, y, z, b, st) => { if (inFp(x, z)) g.set(x, y, z, b, st); };
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
const faceOffset = { N: 0, S: 2, W: 1, E: 3 };

for (const [x, z, ground] of cells) {
  const R = tier.get(k(x, z));       // roof surface above y 0
  const T = R - 1;                   // top of the roof slab; the parapet sits on R
  const g0 = ground;
  const floors = [g0, g0 + 4, g0 + 8].filter((f) => f <= T);
  const faces = exposed(x, z);
  const edge = faces.length > 0;
  const [face, dx, dz] = faces[0] ?? [];
  const faceName = face ?? "";
  const u = face === "N" || face === "S" ? x : z;

  for (let y = 0; y <= R; y++) {
    if (y < g0) { put(x, y, z, "stone_bricks"); continue; }                      // foundation under the cell's own ground
    if (y === R) { if (edge) put(x, y, z, "bricks"); continue; }                 // parapet on the perimeter only
    if (y === T) { put(x, y, z, edge ? "smooth_quartz" : "stone"); continue; }    // cornice / roof covering
    if (floors.includes(y)) { put(x, y, z, "smooth_stone"); continue; }          // floor slab per storey
    if (!edge) continue;                                                          // interior: air behind the glass
    const below = floors.filter((f) => f <= y);
    const fl = below[below.length - 1];
    const s = floors.indexOf(fl);
    const rel = y - fl;
    const shop = s === 0 && g0 === 0;
    if (rel === 1) { put(x, y, z, s === 0 ? "polished_andesite" : "smooth_quartz"); continue; }   // string course / plinth
    // rows 2 and 3 of a storey: windows in a 5-cell bay pattern, or a shopfront on the flat side
    const p = (u + faceOffset[faceName]) % 5;
    if (shop && faceName === "N" && x === 5 && rel === 2) { put(x, y, z, "dark_oak_door", doorState("upper")); continue; }
    if (shop && faceName === "N" && x === 5 && rel === 1) { put(x, y, z, "dark_oak_door", doorState("lower")); continue; }
    if (shop && faceName === "N" && x >= 4 && x <= 6 && rel === 3) { put(x, y, z, "smooth_quartz"); continue; }   // canopy over the door
    if (shop) { put(x, y, z, p === 0 || p === 4 ? "dark_oak_planks" : "glass"); continue; }
    if (p === 0) { put(x, y, z, "bricks"); continue; }
    if (p === 1 || p === 4) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "glass");
    // some windows lit from behind: one cell inside the glass, if that cell is interior
    const hash = (x * 7 + z * 13 + y * 3 + faceOffset[faceName]) % 10;
    if (hash === 0 || hash === 5) {
      const ix = x - dx, iz = z - dz;
      if (inFp(ix, iz) && !perimeter(ix, iz)) g.set(ix, y, iz, hash === 0 ? "glowstone" : "shroomlight");
    }
  }
}

// Roof equipment: a plant box and a smaller housing on the roof of the upper tier, set back from the parapet
const boxCells = [];
for (const [x, z] of Array.from(info.keys(), (s) => s.split(",").map(Number))) {
  if (x >= 9 && x <= 14 && z >= 7 && z <= 11 && tier.get(k(x, z)) === 11 && !perimeter(x, z)) boxCells.push([x, z]);
}
for (const [x, z] of boxCells) g.set(x, 11, z, "gray_concrete");
for (const [x, z] of boxCells) if (x >= 10 && x <= 12 && z >= 8 && z <= 10) g.set(x, 12, z, "gray_concrete");

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241877.nbt");
console.log(JSON.stringify({ footprint: cells.length, ...stats }));
