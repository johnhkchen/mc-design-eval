// Regency Apartments: a 1960s–70s reinforced-concrete apartment block (six storeys on a 4-block grid, rendered
// white concrete, tinted glazing in aluminium-style grids, flat roof with a parapet). The lidar roof is smoothed
// into three flat tiers (wings 20, main 24, corner tower 28) and every air gap sits between solid storey bands.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020895.cells.json", "utf8"));   // [x, z, ground, roof]
const W = 43, D = 55;
const g = new Voxels([43, 42, 55]);

const ground = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, gr, roof] of cells) ground[z][x] = { gr, roof };
const inMask = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[z][x] !== null;

// lidar roof, 5x5 median over the footprint, then three flat tiers: wings 20, main 24, tower 28
const medianRoof = (x, z) => {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inMask(x + dx, z + dz)) v.push(ground[z + dz][x + dx].roof);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (r) => (r >= 27 ? 28 : r >= 23 ? 24 : 20);
const top = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inMask(x, z)) top[z][x] = tierOf(medianRoof(x, z));

// the building volume: a footprint cell is solid from y 0 to its top (foundation below its ground, body above)
const inV = (x, y, z) => inMask(x, z) && y >= 0 && y < top[z][x];
const DIRS = [{ n: "north", dx: 0, dz: -1 }, { n: "south", dx: 0, dz: 1 }, { n: "west", dx: -1, dz: 0 }, { n: "east", dx: 1, dz: 0 }];
const exposed = (x, y, z) => DIRS.filter((d) => !inV(x + d.dx, y, z + d.dz));
const outward = (x, z) => DIRS.filter((d) => !inMask(x + d.dx, z + d.dz));

// glazing: panes connect along the face, the wall's own cells are the piers and spandrels
const paneState = (d) => (d.dz !== 0
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// 1) body: foundation, facade skin, interior slabs; air only in the window rows (y % 4 = 1, 2)
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inMask(x, z)) continue;
  const gr = ground[z][x].gr, t = top[z][x];
  for (let y = 0; y < t; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }
    const ex = exposed(x, y, z);
    if (!ex.length) {                                   // interior: floor, spandrel and roof rows are solid; the rest is air
      if (y === t - 1) g.set(x, y, z, "smooth_stone");                 // flat roof, light enough to read from the air
      else if (y === gr || y % 4 === 0 || y % 4 === 3) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    const d = ex.find((e) => !inMask(x + e.dx, z + e.dz)) ?? ex[0];   // the outer edge first, then any other exposed face
    const u = d.dz !== 0 ? x : z;                       // position along the face
    if (y === t - 1) g.set(x, y, z, "light_gray_concrete");            // cornice
    else if (y === gr) g.set(x, y, z, "stone_bricks");                   // base course
    else if (y % 4 === 0) g.set(x, y, z, "light_gray_concrete");        // storey band
    else if (y % 4 === 3) g.set(x, y, z, "white_concrete");              // spandrel
    else if (u % 4 === 0) g.set(x, y, z, "white_concrete");              // pier between bays
    else g.set(x, y, z, "gray_stained_glass_pane", paneState(d));       // tinted glazing, three panes a bay
  }
}

// 2) parapet on the roof edge of every footprint cell
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inMask(x, z) && outward(x, z).length) g.set(x, top[z][x], z, "white_concrete");

// 3) entrance: a ground-level cell on the lowest face (south first), with a door, piers, a lintel and a lobby lamp
const faces = ["south", "north", "east", "west"];
let door = null;
for (const fn of faces) {
  const cand = [];
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (!inMask(x, z) || ground[z][x].gr !== 0) continue;
    const d = outward(x, z).find((o) => o.n === fn); if (!d) continue;
    cand.push({ x, z, d, u: d.dz !== 0 ? x : z });
  }
  if (!cand.length) continue;
  const us = cand.map((c) => c.u), mid = (Math.min(...us) + Math.max(...us)) / 2;
  door = cand.sort((a, b) => Math.abs(a.u - mid) - Math.abs(b.u - mid))[0];
  break;
}
if (door) {
  const { x, z, d, u } = door;
  const at = (k) => (d.dz !== 0 ? [u + k, z] : [x, u + k]);   // cells along the same face
  const doorState = (half) => ({ facing: d.n, half, hinge: "left", open: "false", powered: "false" });
  g.set(x, 1, z, "iron_door", doorState("lower"));
  g.set(x, 2, z, "iron_door", doorState("upper"));
  for (const k of [-1, 1]) {
    const [px, pz] = at(k);
    if (inMask(px, pz) && outward(px, pz).some((o) => o.n === d.n)) {
      g.set(px, 1, pz, "white_concrete"); g.set(px, 2, pz, "white_concrete"); g.set(px, 3, pz, "light_gray_concrete");
    }
  }
  g.set(x, 3, z, "light_gray_concrete");
  const ix = x - d.dx, iz = z - d.dz;
  if (inV(ix, 2, iz) && !exposed(ix, 2, iz).length) g.set(ix, 2, iz, "lantern", { hanging: "true", waterlogged: "false" });
}

// 4) warm light behind some windows: in the air gap, on a solid floor band, one per bay in a loose pattern
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inMask(x, z)) continue;
  for (let y = 1; y < top[z][x] - 1; y += 4) {                                // window rows start at y % 4 = 1
    const ex = exposed(x, y, z); if (!ex.length) continue;
    const d = ex.find((e) => !inMask(x + e.dx, z + e.dz)) ?? ex[0];
    const u = d.dz !== 0 ? x : z;
    if (u % 4 === 0 || (x * 31 + z * 17 + y * 7) % 5 !== 0) continue;
    const ix = x - d.dx, iz = z - d.dz;
    if (!inV(ix, y, iz) || exposed(ix, y, iz).length || ground[iz]?.[ix] == null) continue;
    const pick = (x + z + y) % 5;
    if (pick === 0) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    else if (pick === 1) g.set(ix, y, iz, "shroomlight");
    else g.set(ix, y, iz, "glowstone");
  }
}

// 5) roof: AC plant boxes on the main roof, a lift overrun on the tower roof
const edgeDist = (x, z) => {                              // how far in from the roof edge (Chebyshev, same tier)
  let best = 99;
  for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
    const nx = x + dx, nz = z + dz;
    if (!inMask(nx, nz) || top[nz][nx] !== top[z][x] || !outward(nx, nz).length) best = Math.min(best, Math.max(Math.abs(dx), Math.abs(dz)));
  }
  return best;
};
const plant = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inMask(x, z) && top[z][x] === 24 && edgeDist(x, z) >= 4) plant.push([x, z]);
const placed = [];
for (const [x, z] of plant) {
  if (placed.length >= 5) break;
  if (placed.some(([px, pz]) => Math.abs(px - x) < 6 && Math.abs(pz - z) < 6)) continue;
  const cells3 = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!cells3.every(([cx, cz]) => inMask(cx, cz) && top[cz][cx] === 24 && edgeDist(cx, cz) >= 2)) continue;
  for (const [cx, cz] of cells3) { g.set(cx, 24, cz, "smooth_stone"); g.set(cx, 25, cz, "smooth_stone"); }
  placed.push([x, z]);
}
const tower = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inMask(x, z) && top[z][x] === 28 && edgeDist(x, z) >= 2) tower.push([x, z]);
if (tower.length) {
  const [cx, cz] = tower[Math.floor(tower.length / 2)];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    g.set(cx + dx, 28, cz + dz, "light_gray_concrete"); g.set(cx + dx, 29, cz + dz, "light_gray_concrete");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020895.nbt");
