// Skhy Terrace Apartments: a 1990s-2000s Auckland apartment block, five storeys of render and aluminium glazing on a
// basalt base, with a thirteen-storey tower on its north-east corner. Massing from the lidar roof, snapped to four
// tiers (30 the block, 38 and 46 the tower's setbacks, 53 the crown), so each tier stands on the one below. Datum y 8
// (the highest ground under the footprint), storeys 4 blocks; below the datum every column is basalt, so nothing floats
// on the slope and the downhill side carries its plinth. Facades: smooth-quartz spandrels and dark aluminium panes on a
// 3-block mullion grid, a storey line of smooth stone; each pane has a sealed one-block air gap behind it with a warm
// light in some. Entrance on the west face: a three-cell glazed bay with a dark-oak canopy and a door.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_820877364.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..24, z 0..42

const DATUM = 8, STOREY = 4, BASE = "polished_blackstone_bricks";
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                             // east, west, south, north (+z is south)
const key = (x, z) => `${x},${z}`;
// the roof tiers: tops sit on storey lines (the 2 blocks above a storey's floor slab are its parapet)
const tierOf = (r) => (r >= 50 ? 53 : r >= 44 ? 46 : r >= 35 ? 38 : 30);

// lidar noise: a cell's roof is the median over its footprint neighbours (3 x 3), so one noisy cell cannot make a spike
// (the tower's core keeps its height; a mean would thin it out)
const roofAt = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const smoothRoof = (x, z) => {
  const rs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const r = roofAt.get(key(x + dx, z + dz)); if (r !== undefined) rs.push(r); }
  rs.sort((a, b) => a - b);
  return rs[Math.floor(rs.length / 2)];
};
// the tower is a thin lidar core: one ring of the block's cells beside a tower tier steps up to the 38 setback, so it
// reads as a body on a podium rather than a few spikes
const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const tier0 = new Map(cells.map(([x, z]) => [key(x, z), tierOf(smoothRoof(x, z))]));
const ring = (x, z) => DIRS8.some(([dx, dz]) => (tier0.get(key(x + dx, z + dz)) ?? 0) >= 46);
const top = new Map(), ground = new Map();
for (const [x, z, g] of cells) {
  const t = tier0.get(key(x, z));
  top.set(key(x, z), t === 30 && ring(x, z) ? 38 : t);
  ground.set(key(x, z), g);
}
const topOf = (x, z) => top.get(key(x, z)) ?? 0;                            // 0 outside the footprint: open to the air
// a face is exposed at height y when the cell beside it is outside the building or topped below y
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => topOf(x + dx, z + dz) <= y);
const storeyRow = (y) => (y - DATUM) % STOREY;                                // 0 floor slab, 1-2 glazing, 3 spandrel
const isCorner = (ex) => ex.length > 1;
const isMullion = (x, z, ex) => {
  if (isCorner(ex)) return true;
  const [dx] = ex[0];
  return (dx !== 0 ? z : x) % 3 === 0;                                       // a pier every third block along the face
};

// the entrance: the west-face cells on the glazed bay (median z of the west face at ground level)
const westFace = [...top.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => topOf(x - 1, z) === 0);
const zs = westFace.map(([, z]) => z).sort((a, b) => a - b);
const zMid = zs[Math.floor(zs.length / 2)];
const doorX = westFace.find(([, z]) => z === zMid)[0];
const isEntrance = (x, z) => x === doorX && Math.abs(z - zMid) <= 1 && topOf(x - 1, z) === 0;   // the three-cell bay

const g = new Voxels([25, 66, 43]);
const lit = [];
for (const [k, T] of top) {
  const [x, z] = k.split(",").map(Number), gr = ground.get(k);
  for (let y = 0; y < T; y++) {
    if (y < DATUM) { g.set(x, y, z, BASE); continue; }                       // foundation and plinth to the datum
    if (y === T - 1) { g.set(x, y, z, "gray_concrete"); continue; }          // roof slab
    const r = storeyRow(y);
    if (r === 0) { g.set(x, y, z, "smooth_stone"); continue; }               // floor slab, also the storey line on the face
    const ex = exposed(x, y, z);
    if (!ex.length) continue;                                                // the interior: air behind the glass
    if (y === DATUM + 3 && isEntrance(x, z)) { g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (r === 3) { g.set(x, y, z, "smooth_quartz"); continue; }             // spandrel under each window band
    if (isEntrance(x, z) && (y === DATUM + 1 || y === DATUM + 2)) {
      const half = y === DATUM + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: "west", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isMullion(x, z, ex)) { g.set(x, y, z, "polished_andesite"); continue; }
    // a pane joins its neighbours along the face: a west or east face runs north-south, a north or south face east-west
    const alongZ = ex[0][0] !== 0, state = { north: String(alongZ), south: String(alongZ), east: String(!alongZ), west: String(!alongZ), waterlogged: "false" };
    g.set(x, y, z, "gray_stained_glass_pane", state);
    if (r === 1) lit.push({ x, y, z, ex: ex[0] });
  }
}

// warm light in some windows: a lantern or shroomlight standing on the floor slab of the sealed air gap behind the pane
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
for (const { x, y, z, ex: [dx, dz] } of lit) {
  if (hash(x, y, z) % 6 !== 0) continue;
  const ix = x - dx, iz = z - dz;
  if (topOf(ix, iz) <= y || exposed(ix, y, iz).length) continue;
  g.set(ix, y, iz, hash(x, y, z) % 12 === 0 ? "shroomlight" : "lantern");
}

const stats = g.save(`${HERE}/way_820877364.nbt`);
console.log(`Skhy Terrace: ${cells.length} cells, ${stats.blocks} blocks, ${stats.palette} palette entries`);
