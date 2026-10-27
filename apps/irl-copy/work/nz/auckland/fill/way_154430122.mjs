import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1980s-90s concrete-and-glass office block: a stepped massing (the lidar roof quantized to clean tiers: 4-block
// steps for the one-storey wings, 8-block (two-storey) setbacks above), a stone foundation down to each cell's ground,
// storeys on one absolute grid of 4 blocks (slab, two rows of glass, a transom), a shopfront on the storey at the
// ground, a hollow shell with floor slabs, and a plant room on the tallest tier.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154430122.cells.json", "utf8"));
const X = 39, Z = 46, H = 62;

const G = Array.from({ length: X }, () => Array(Z).fill(null));     // ground: the foundation's top
const T = Array.from({ length: X }, () => Array(Z).fill(null));     // roof: the building's top (exclusive)
for (const [x, z, ground, roof] of cells) {
  const top = roof < 10 ? 4 * Math.round(roof / 4) : 8 * Math.round(roof / 8);
  G[x][z] = ground; T[x][z] = Math.max(top, ground + 4);
}
const inF = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && G[x][z] !== null;
// the sides of cell (x, z) at row y that face air: outside the footprint, or a neighbour whose roof is below y
const exposed = (x, z, y) => {
  const px = !inF(x + 1, z) || T[x + 1][z] <= y, nx = !inF(x - 1, z) || T[x - 1][z] <= y;
  const pz = !inF(x, z + 1) || T[x][z + 1] <= y, nz = !inF(x, z - 1) || T[x][z - 1] <= y;
  return { px, nx, pz, nz, out: px || nx || pz || nz, corner: (px || nx) && (pz || nz), alongZ: px || nx };
};

const v = new Voxels([X, H, Z]);
const M = {
  found: "stone_bricks", plinth: "polished_andesite", concrete: "white_concrete", spandrel: "light_gray_concrete",
  glass: "light_blue_stained_glass", roof: "gray_concrete", pier: "stone_bricks",
};
const DOOR = [14, 0];                                    // the north entrance, on the lowest ground

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  const gr = G[x][z], top = T[x][z];
  for (let y = 0; y < gr; y++) v.set(x, y, z, M.found);                 // foundation down to the ground
  for (let y = gr; y < top; y++) {
    const e = exposed(x, z, y), r = y % 4;
    if (y === top - 1) { v.set(x, y, z, e.out ? M.spandrel : M.roof); continue; }   // cornice or roof slab
    if (!e.out) { if (r === 0) v.set(x, y, z, M.spandrel); continue; }   // interior: a floor slab per storey, air between
    const bay = e.alongZ ? z : x, mull = bay % 3 === 0;                   // mullions every 3 blocks along the wall
    const shop = Math.floor(y / 4) === Math.floor(gr / 4) && y > gr;      // the storey on the ground: a shopfront
    if (y === gr) v.set(x, y, z, M.plinth);                               // base course
    else if (e.corner) v.set(x, y, z, M.concrete);                        // corner columns
    else if (shop) v.set(x, y, z, mull ? M.pier : M.glass);
    else if (r === 0) v.set(x, y, z, M.spandrel);
    else if (r === 3) v.set(x, y, z, M.concrete);
    else v.set(x, y, z, mull ? M.concrete : M.glass);
  }
  if (exposed(x, z, top - 1).out) v.set(x, top, z, M.concrete);          // parapet on the edge of each tier
}

// the entrance: a double-height-free door in the shopfront, with a lintel over it
const [dx, dz] = DOOR, dg = G[dx][dz];
v.set(dx, dg, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
v.set(dx, dg + 1, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [dx - 1, dx, dx + 1]) v.set(x, dg + 2, dz, "stone_brick_slab", { type: "top", waterlogged: "false" });

// warm light behind some glass: a glowstone in the air cell just inside the window
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  for (let y = G[x][z]; y < T[x][z]; y++) {
    const e = exposed(x, z, y);
    if (!e.out || e.corner || (x * 7 + z * 13 + y * 5) % 11 !== 0) continue;
    if (y % 4 === 0 || y === T[x][z] - 1 || y === G[x][z]) continue;
    const inward = e.px ? [x - 1, z] : e.nx ? [x + 1, z] : e.pz ? [x, z - 1] : [x, z + 1];
    const [nx, nz] = inward;
    if (inF(nx, nz) && G[nx][nz] <= y && T[nx][nz] > y && v.get(nx, y, nz) === null) v.set(nx, y, nz, "glowstone");
  }
}

// the plant room on the tallest tier: a 3 x 3 box with a mast, on a cell whose whole 3 x 3 sits on that top
const TM = Math.max(...T.flat().filter((t) => t !== null));
let plant = null;
for (let x = 1; x < X - 1 && !plant; x++) for (let z = 1; z < Z - 1 && !plant; z++) {
  let ok = true;
  for (let dx2 = -1; dx2 <= 1; dx2++) for (let dz2 = -1; dz2 <= 1; dz2++) if (!inF(x + dx2, z + dz2) || T[x + dx2][z + dz2] !== TM) ok = false;
  if (ok) plant = [x, z];
}
if (plant) {
  const [px, pz] = plant;
  for (let dx2 = -1; dx2 <= 1; dx2++) for (let dz2 = -1; dz2 <= 1; dz2++) {
    v.set(px + dx2, TM, pz + dz2, M.spandrel); v.set(px + dx2, TM + 1, pz + dz2, M.spandrel);
    v.set(px + dx2, TM + 2, pz + dz2, M.roof);
  }
  for (let y = TM + 3; y <= TM + 6; y++) v.set(px, y, pz, "iron_bars");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154430122.nbt";
const { blocks, palette } = v.save(out);
console.log(`way_154430122: ${blocks} blocks, ${palette} palette entries, top ${TM}, plant ${plant ? plant.join(",") : "none"} -> ${out}`);
