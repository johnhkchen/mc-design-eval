// A 1980s Auckland office block: a 15-storey pale-concrete slab with a 17-storey crown at its west end, 3-storey podium
// wings on the north-east and south-west, and a commercial ground floor. Pale precast piers and spandrels, tinted blue
// glass, a dark stone base and ground-floor shopfronts; a door on the south face; a plant room on the crown.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_884055551.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_884055551.nbt";
const X = 30, Z = 32, Y = 81;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// The lidar roof height smoothed into flat 4-block storey tiers (the noise round each tier is absorbed).
const tier = (h) => h <= 6 ? 4 : h <= 10 ? 8 : h <= 15 ? 12 : h <= 19 ? 16 : h <= 23 ? 20 : h <= 27 ? 24 : h <= 33 ? 28
  : h <= 37 ? 36 : h <= 44 ? 40 : h <= 55 ? 52 : h <= 58 ? 56 : h <= 65 ? 60 : 68;

const top = new Map();                                    // "x,z" -> tier top (roof surface height)
for (const [x, z, , roof] of cells) top.set(`${x},${z}`, tier(roof));
const topAt = (x, z) => top.get(`${x},${z}`) ?? -1;      // -1 outside the footprint
const DIRS = [[1, 0, "x+"], [-1, 0, "x-"], [0, 1, "z+"], [0, -1, "z-"]];
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => topAt(x + dx, z + dz) <= y).map(d => d[2]);
const outside = (x, z) => DIRS.some(([dx, dz]) => topAt(x + dx, z + dz) === -1);

// The west-east window bays: a pier every third block, glass between, a few glowstone panes lit behind the glass.
const lit = (x, y, z) => (x * 73 + y * 31 + z * 17) % 23 === 0;
const glazing = (x, y, z) => (x + z) % 3 === 0 ? "light_gray_concrete" : lit(x, y, z) ? "glowstone" : "light_blue_stained_glass";

// The skin of an exposed face at height y (storey = 4 blocks; o = offset within the storey).
function skin(x, y, z, T, dirs) {
  const o = y % 4, storey = (y - o) / 4;
  if (y === T - 1) return "smooth_quartz";                                    // cornice
  if (storey === 0 && o === 0) return "polished_andesite";                    // plinth
  if (storey === 0 && o === 1) return "polished_andesite";                    // base course
  const corner = dirs.some(d => d[0] === "x") && dirs.some(d => d[0] === "z");
  if (o === 0) return "smooth_quartz";                                        // storey line
  if (o === 3) return storey === 0 ? "smooth_quartz" : "white_concrete";      // spandrel / shopfront lintel
  return corner ? "light_gray_concrete" : glazing(x, y, z);                   // window grid, corner piers
}

// The entrance: a door on the south face of the main slab, lantern above, glass flanks.
const DOOR_FACING = { "x+": "west", "x-": "east", "z+": "north", "z-": "south" };
function pickEntrance() {
  const cand = cells.map(([x, z]) => [x, z]).filter(([x, z]) => topAt(x, z) >= 52 && topAt(x, z + 1) === -1);
  if (!cand.length) return null;
  cand.sort((a, b) => a[0] - b[0]);
  const [x, z] = cand[Math.floor(cand.length / 2)];
  return { x, z, facing: DOOR_FACING["z+"] };
}
const door = pickEntrance();
const doorAt = (x, y, z) => door && x === door.x && z === door.z && y >= 1 && y <= 3;
const flank = (x, z) => door && z === door.z && Math.abs(x - door.x) === 1 && topAt(x, z) >= 52;

const g = new Voxels([X, Y, Z]);

// Every footprint column: a floor slab per storey, a roof at its top, and the skin wherever a side is exposed (the
// outside, or a lower neighbour's roof). Interior is air behind the glass; the storey slabs carry it all.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const T = topAt(x, z);
  for (let y = 0; y < T; y++) {
    const dirs = exposed(x, y, z);
    if (dirs.length) {
      if (doorAt(x, y, z)) {
        const half = y === 1 ? "lower" : "upper";
        if (y === 3) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        else g.set(x, y, z, "dark_oak_door", { facing: door.facing, half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (flank(x, z) && y === 1) { g.set(x, y, z, "polished_andesite"); continue; }
      if (flank(x, z) && y === 2) { g.set(x, y, z, "light_blue_stained_glass"); continue; }
      if (flank(x, z) && y === 3) { g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
      g.set(x, y, z, skin(x, y, z, T, dirs));
    } else if (y % 4 === 0) g.set(x, y, z, "smooth_stone");                  // interior storey slab
    else if (y === T - 1) g.set(x, y, z, T === 12 ? "moss_block" : "gray_concrete");   // roof: the podium is planted
  }
  if (outside(x, z)) g.set(x, T, z, "light_gray_concrete");                  // parapet on the outer edge
}

// The crown's plant room: a 5 x 5 box on the 68-block roof, with a lightning rod on its roof.
// A plant box from y = T0 to T1 on a roof: a base course, walls (glazed louvres or solid) and a cornice; its roof at roofY.
const plantOK = (x0, x1, z0, z1, t) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (topAt(x, z) !== t) return false; return true; };
const box = (x0, x1, z0, z1, T0, T1, roofY, wall) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    if (!edge) { g.set(x, roofY, z, "gray_concrete"); continue; }
    for (let y = T0; y < T1; y++) g.set(x, y, z, y === T0 || y === T1 - 1 ? "smooth_quartz" : wall(x, y, z));
    g.set(x, roofY, z, "smooth_quartz");
  }
};
if (plantOK(4, 8, 16, 20, 68)) {
  box(4, 8, 16, 20, 68, 72, 71, glazing);
  for (let y = 72; y <= 74; y++) g.set(6, y, 18, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}
if (plantOK(14, 16, 12, 13, 60)) box(14, 16, 12, 13, 60, 62, 61, () => "light_gray_concrete");

// Solids with no way down to the ground would float: flood-fill from y = 0 through solid blocks, count the rest.
const solid = (x, y, z) => g.get(x, y, z) !== null;
const seen = new Set(); const stack = [];
const key = (x, y, z) => `${x},${y},${z}`;
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (solid(x, 0, z)) { stack.push([x, 0, z]); seen.add(key(x, 0, z)); }
while (stack.length) {
  const [x, y, z] = stack.pop();
  for (const [dx, dy, dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
    const nx = x + dx, ny = y + dy, nz = z + dz;
    if (ny < 0 || ny >= Y || !solid(nx, ny, nz) || seen.has(key(nx, ny, nz))) continue;
    seen.add(key(nx, ny, nz)); stack.push([nx, ny, nz]);
  }
}
let total = 0, floating = 0;
g.forEachCell((i) => { total++; });
for (let x = 0; x < X; x++) for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) if (solid(x, y, z) && !seen.has(key(x, y, z))) floating++;

const r = g.save(OUT);
console.log(`way_884055551: ${r.blocks} blocks, ${r.palette} block states, floating ${floating}, entrance ${door ? `${door.x},${door.z}` : "none"}`);
