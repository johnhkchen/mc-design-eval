// Carlton Pines: a 1970s reinforced-concrete apartment block on Mt Eden's slope. Five storeys at most, rendered in
// white plaster over a basalt plinth, with smooth-quartz floor slabs, light-grey spandrels, and light-blue glazing in
// three-bay windows between white piers. The massing follows the lidar roof (3x3 smoothed, quantised to 4-block
// storeys that start at each cell's own ground), so the downhill side carries its extra storeys and the tiers step in
// as they rise. Every column is solid from y 0 to its top, so no tier floats. Interiors are solid core with a one-block
// air gap behind each window; some gaps hold glowstone. The entrance is a dark oak door on the lowest street edge.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const NAME = "way_769193362";
const cells = JSON.parse(readFileSync(`${DIR}/${NAME}.cells.json`, "utf8"));

const X = 26, Y = 34, Z = 31;
const STOREY = 4;        // blocks per storey
const MAX_STOREYS = 5;   // lidar roof tops out at 20 above y 0; a 5th storey on the ground-0 cells makes 20
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const k3 = (x, y, z) => `${x},${y},${z}`;

// ---- footprint, smoothed storeys ------------------------------------------------------------------
const G = Array.from({ length: X }, () => Array(Z).fill(null));
for (const [x, z, ground, roof] of cells) G[x][z] = { ground, roof };
const inF = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && G[x][z] !== null;
const ground = (x, z) => G[x][z].ground;

// A cell's storey count: the mean lidar roof of its 3x3 footprint neighbourhood, less its ground, in whole storeys.
const storeys = Array.from({ length: X }, () => Array(Z).fill(0));
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!inF(x + dx, z + dz)) continue;
    sum += G[x + dx][z + dz].roof; n++;
  }
  const s = Math.round((sum / n - ground(x, z)) / STOREY);
  storeys[x][z] = Math.min(MAX_STOREYS, Math.max(1, s));
}
// Then a 3x3 median over the storey counts: a lone lidar spike is a chimney-thin column, not a storey.
const raw = storeys.map((c) => c.slice());
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) vals.push(raw[x + dx][z + dz]);
  vals.sort((a, b) => a - b);
  storeys[x][z] = vals[vals.length >> 1];
}
const top = (x, z) => ground(x, z) + STOREY * storeys[x][z];   // roof surface: y of the first air block above the column

// ---- exposure and facade roles ---------------------------------------------------------------------
// Air is anything outside the footprint, or above a neighbour's roof. Foundation and core are solid.
const air = (x, y, z) => !inF(x, z) || y >= top(x, z);
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => air(x + dx, y, z + dz));
// A corner (two exposures) or every fourth cell along a wall is a white pier; the rest of a wall is glazing.
const pier = (x, z, ex) => {
  if (ex.length >= 2) return true;
  const [dx] = ex[0];
  const along = dx !== 0 ? z : x;
  return along % 4 === 0;
};
// A storey: floor slab at its base, two window rows, a spandrel at its top. Base offset from the cell's ground.
const row = (x, y, z) => (y - ground(x, z)) % STOREY;     // 0 slab, 1-2 windows, 3 spandrel
const windowRow = (x, y, z) => { const r = row(x, y, z); return r === 1 || r === 2; };

// ---- entrance: a door on the lowest street edge with a room behind it -------------------------------
let door = null;
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z) || ground(x, z) > 1) continue;
  const y = ground(x, z) + 1;
  const ex = exposed(x, y, z);
  if (ex.length !== 1 || pier(x, z, ex)) continue;
  const [dx, dz] = ex[0];
  if (!inF(x - dx, z - dz) || exposed(x - dx, y, z - dz).length) continue;
  const score = ground(x, z) * 10 + (dz === 1 ? 1 : 0);
  if (!door || score < door.score) door = { x, z, facing: FACING[`${dx},${dz}`], dx, dz, score };
}
const isDoor = (x, y, z) => door && x === door.x && z === door.z && (y === ground(x, z) + 1 || y === ground(x, z) + 2);

// ---- the air gap behind each window (a lamp goes in some) ----------------------------------------------
const gap = new Map();   // "x,y,z" -> lit (true: a lamp sits in the gap)
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  for (let y = ground(x, z); y < top(x, z); y++) {
    if (!windowRow(x, y, z) || isDoor(x, y, z)) continue;
    const ex = exposed(x, y, z);
    if (!ex.length || pier(x, z, ex)) continue;
    for (const [dx, dz] of ex) {
      const ix = x - dx, iz = z - dz;
      if (!inF(ix, iz) || y < ground(ix, iz) || y >= top(ix, iz) || exposed(ix, y, iz).length) continue;
      const lit = (x * 7 + y * 11 + z * 13) % 5 === 0;
      const key = k3(ix, y, iz);
      gap.set(key, (gap.get(key) || false) || lit);
    }
  }
}

// ---- the building ----------------------------------------------------------------------------------
const g = new Voxels([X, Y, Z]);
const panes = [];
let lamps = 0;
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  const gr = ground(x, z), T = top(x, z);
  for (let y = 0; y < T; y++) {
    if (y < gr) { g.set(x, y, z, "stone"); continue; }                              // basalt foundation up to the ground
    const ex = exposed(x, y, z), facade = ex.length > 0;
    if (y === T - 1) { g.set(x, y, z, facade ? "stone_bricks" : "smooth_stone"); continue; }   // parapet / roof deck
    if (isDoor(x, y, z)) {
      if (y === gr + 1) g.set(x, y, z, "dark_oak_door", { facing: door.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, "dark_oak_door", { facing: door.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const r = row(x, y, z);
    if (r === 0) {                                                                  // floor slab / base course
      if (!facade) g.set(x, y, z, "stone");
      else g.set(x, y, z, y === gr ? "polished_andesite" : "smooth_quartz");
      continue;
    }
    if (r === 3) { if (facade) g.set(x, y, z, "light_gray_concrete"); else g.set(x, y, z, "stone"); continue; }
    // window rows
    if (!facade) {
      const lit = gap.get(k3(x, y, z));
      if (lit === undefined) g.set(x, y, z, "stone");                               // solid core
      else if (lit) { g.set(x, y, z, "glowstone"); lamps++; }                       // a lamp behind the glass
      continue;                                                                     // else air: the gap behind a pane
    }
    if (pier(x, z, ex)) { g.set(x, y, z, "white_concrete"); continue; }
    g.set(x, y, z, "light_blue_stained_glass_pane", {});
    panes.push([x, y, z]);
  }
}

// Panes join their neighbours in the wall plane, as a glazing bar would.
for (const [x, y, z] of panes) {
  const link = (dx, dz) => (g.get(x + dx, y, z + dz)?.block.endsWith("stained_glass_pane") ? "true" : "false");
  g.set(x, y, z, "light_blue_stained_glass_pane", { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0), waterlogged: "false" });
}

// Roof plant on the tallest tier: a 3 x 3 stone-rimmed box, two blocks high, standing on the roof deck.
const maxTop = Math.max(...cells.map(([x, z]) => top(x, z)));
let hub = null;
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z) || top(x, z) !== maxTop) continue;
  const n = [-1, 0, 1].flatMap((dx) => [-1, 0, 1].map((dz) => inF(x + dx, z + dz) && top(x + dx, z + dz) === maxTop ? 1 : 0)).reduce((a, b) => a + b, 0);
  if (!hub || n > hub.n) hub = { x, z, n };
}
if (hub) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
  const x = hub.x + dx, z = hub.z + dz;
  if (!inF(x, z) || top(x, z) !== maxTop) continue;
  const rim = dx !== 0 || dz !== 0;
  g.set(x, maxTop, z, rim ? "stone_bricks" : "light_gray_concrete");
  g.set(x, maxTop + 1, z, rim ? "stone_bricks" : "light_gray_concrete");
}

const stats = g.save(`${DIR}/${NAME}.nbt`);
console.log(JSON.stringify({ ...stats, cells: cells.length, maxTop, panes: panes.length, lamps, door, plant: hub }));
