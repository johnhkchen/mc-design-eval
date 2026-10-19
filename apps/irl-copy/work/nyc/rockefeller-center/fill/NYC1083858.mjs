// 550 Fifth Avenue, 1940: a Midtown Moderne office block. Twelve storeys of pale limestone piers and
// tinted glass over a granite plinth, stepping in from a four-storey-deep 24-block ring to an 11-storey core
// and a 12-storey east tower, with a flat roof, a parapet at every roof edge and a copper-capped penthouse.
// Lidar roof -> tiers: under 1 block is an open court, under 12 a two-storey wing, 35 and up the tower, the rest the core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1083858.cells.json`, "utf8"));
const W = 28, D = 14, Y = 48;

const tier = (r) => (r < 1 ? 0 : r < 12 ? 6 : r >= 35 ? 36 : 33);
const groundOf = Array.from({ length: D }, () => Array(W).fill(0));
const roofOf = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, g, r] of cells) { groundOf[z][x] = g; roofOf[z][x] = tier(r); }

// Edge cells (distance 0 from the footprint outline) step down to 24 so the street ring reads as a setback base.
const inset = (x, z) => Math.min(x, z, W - 1 - x, D - 1 - z);
const H = Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => {
  const h = roofOf[z][x];
  return inset(x, z) === 0 && h > 24 ? 24 : h;
}));
const hz = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : H[z][x]);   // outside the footprint counts as nothing above

const g = new Voxels([W, Y, D]);

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const h = H[z][x];
  for (let y = 0; y < groundOf[z][x]; y++) g.set(x, y, z, "polished_granite");   // foundation (all zero here)
  g.set(x, 0, z, "polished_granite");                                             // granite plinth, courts included
  if (h === 0) continue;

  for (let y = 1; y < h; y++) {
    if (y % 3 === 0) { g.set(x, y, z, "smooth_stone"); continue; }               // storey floor, also the storey line
    const eW = hz(x - 1, z) <= y, eE = hz(x + 1, z) <= y;
    const eN = hz(x, z - 1) <= y, eS = hz(x, z + 1) <= y;
    if (!(eW || eE || eN || eS)) continue;                                      // interior: air, a floor slab per storey
    const exX = eW || eE, exZ = eN || eS;
    const ground = y < 3;
    const door = ground && eS && x === 10 && z === D - 1;
    if (door) { g.set(x, y, z, "iron_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (exX && exZ) { g.set(x, y, z, ground ? "polished_granite" : "calcite"); continue; }   // corner
    const i = exZ ? x : z;                                                       // position along the exposed face
    if (i % 3 === 0) { g.set(x, y, z, ground ? "polished_granite" : "calcite"); continue; }   // pier
    // A few windows lit from behind: clear glass over a glowstone in the air gap just inside it, so the warm light shows at dusk.
    const ix = x + (eE ? -1 : eW ? 1 : 0), iz = z + (eS ? -1 : eN ? 1 : 0);
    const lit = (x * 31 + z * 17 + y * 7) % (ground ? 4 : 5) === 0;
    const innerIsAir = ix >= 0 && iz >= 0 && ix < W && iz < D && hz(ix, iz) > y &&
      !(hz(ix - 1, iz) <= y || hz(ix + 1, iz) <= y || hz(ix, iz - 1) <= y || hz(ix, iz + 1) <= y);
    g.set(x, y, z, ground || (lit && innerIsAir) ? "glass" : "light_blue_stained_glass");
    if (lit && innerIsAir) g.set(ix, y, iz, "glowstone");
  }
  if (h > 0) g.set(x, h, z, "stone_bricks");                                      // roof slab, a floor line of its own
}

// Parapet on every roof edge: the footprint outline, and the edges where a tier steps down.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const h = H[z][x];
  if (h > 0 && (hz(x - 1, z) < h || hz(x + 1, z) < h || hz(x, z - 1) < h || hz(x, z + 1) < h)) g.set(x, h + 1, z, "stone_brick_wall");
}

// Penthouse: a 3x3 calcite box with a copper cap on the first flat 3x3 of the core, two cells in from the edge.
let placed = false;
for (let z = 2; z <= D - 5 && !placed; z++) for (let x = 2; x <= W - 5 && !placed; x++) {
  const h = H[z][x];
  if (h < 33) continue;
  let flat = true;
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) if (H[z + dz][x + dx] !== h) flat = false;
  if (!flat) continue;
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) {
    g.set(x + dx, h + 1, z + dz, "calcite");
    g.set(x + dx, h + 2, z + dz, "calcite");
    g.set(x + dx, h + 3, z + dz, "oxidized_copper");
  }
  placed = true;
}

const out = g.save(`${dir}/NYC1083858.nbt`);
console.log(JSON.stringify({ placed, ...out }));
