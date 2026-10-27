// A 1930s reinforced-concrete commercial block on Mt Eden's slope: a 4-storey plastered body (smooth quartz over
// basalt-stone foundations) with a 5th storey on the north-east tower; the lower storeys are a shopfront and the
// downhill side carries a stone base. Storeys stand on floor lines every 4 blocks from FL; the interior is solid core
// with a one-block air gap behind each window; glowstone lamps sit in some of the gaps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const NAME = "way_1014529243";
const cells = JSON.parse(readFileSync(`${DIR}/${NAME}.cells.json`, "utf8"));

const X = 32, Y = 35, Z = 40;
const FL = 2;            // ground-floor datum: the floor line of storey 0
const TOP_MAIN = 18;     // lidar tier of the body (roof surface at y 18)
const TOP_TOWER = 22;    // lidar tier of the north-east tower (roof surface at y 22)
const BAY = 4;           // three glass bays, then a pier

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const AROUND = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const k3 = (x, y, z) => `${x},${y},${z}`;

// ---- footprint and lidar tiers ------------------------------------------------------------------
const G = Array.from({ length: X }, () => Array(Z).fill(null));
for (const [x, z, ground, roof] of cells) G[x][z] = { ground, roof };
const inF = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && G[x][z] !== null;
const ground = (x, z) => G[x][z].ground;

// Lidar roofs are noisy: a cell is tower when it reads 21+ (20 when most neighbours do); stubs under 15 take the
// majority of their neighbours' tier.
const tower = Array.from({ length: X }, () => Array(Z).fill(false));
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  const r = G[x][z].roof;
  const nb = AROUND.map(([dx, dz]) => [x + dx, z + dz]).filter(([a, b]) => inF(a, b));
  const n = nb.filter(([a, b]) => G[a][b].roof >= 21).length;
  tower[x][z] = r >= 21 || (r === 20 && n >= 3) || (r < 15 && n * 2 > nb.length);
}
// A tower cell with a non-tower neighbour is the setback ring: it stops at the body's roof, the rest climbs on.
const top = Array.from({ length: X }, () => Array(Z).fill(0));
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  const ring = tower[x][z] && DIRS.some(([dx, dz]) => !(inF(x + dx, z + dz) && tower[x + dx][z + dz]));
  top[x][z] = tower[x][z] && !ring ? TOP_TOWER : TOP_MAIN;
}

// The sides of cell (x, y, z) that face air: outside the footprint, or a neighbour whose building stops below y.
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz) || top[x + dx][z + dz] <= y);
// Storey rhythm: floor line at FL + 4k, two window rows, then a spandrel; the top layer of the building is the roof.
const floorLine = (y) => (y - FL) % 4 === 0;
const windowBand = (y) => [1, 2].includes((y - FL) % 4);
const spandrel = (y) => (y - FL) % 4 === 3;
// Facade piers: a wall running along z is barred every BAY cells in z, one along x is barred every BAY in x; a stepped
// (diagonal) face exposes both, so its bays run along the diagonal instead of making every cell a corner pier.
const pier = (x, z, ex) => {
  const ax = ex.some(([dx]) => dx !== 0), az = ex.some(([, dz]) => dz !== 0);
  if (ax && az) return (x + z) % BAY === 0;
  return ax ? z % BAY === 0 : x % BAY === 0;
};

// The entrance: a single-sided ground-floor cell on the lowest street edge with a room behind it, not a pier.
let door = null;
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z) || ground(x, z) > 3) continue;
  const ex = exposed(x, FL, z);
  if (ex.length !== 1 || pier(x, z, ex)) continue;
  const [dx, dz] = ex[0];
  if (!inF(x - dx, z - dz) || exposed(x - dx, FL + 1, z - dz).length) continue;
  const score = Math.abs(ground(x, z) - FL) * 10 - (dz === 1 ? 1 : 0);
  if (!door || score < door.score) door = { x, z, facing: FACING[`${dx},${dz}`], dx, dz, score };
}

// Window cells (glass or the door's glazing) and the air gap behind each: the inward neighbour, when it is not wall.
const windowAt = (x, y, z) => {
  if (!inF(x, z) || y < Math.max(FL, ground(x, z)) || y >= top[x][z] || !windowBand(y)) return false;
  if (door && x === door.x && z === door.z) return true;
  const ex = exposed(x, y, z);
  return ex.length > 0 && !pier(x, z, ex);
};
const gap = new Map();   // "x,y,z" -> lit (true when a lamp goes in it)
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) for (let y = FL; y < TOP_TOWER; y++) {
  if (!windowAt(x, y, z)) continue;
  const isDoor = door && x === door.x && z === door.z;
  const lit = !isDoor && (x * 7 + y * 11 + z * 13) % 5 === 0;
  for (const [dx, dz] of exposed(x, y, z)) {
    const ix = x - dx, iz = z - dz;
    if (!inF(ix, iz) || y < ground(ix, iz) || y >= top[ix][iz] || exposed(ix, y, iz).length) continue;
    const key = k3(ix, y, iz);
    gap.set(key, (gap.get(key) || false) || lit);
  }
}

// ---- the building --------------------------------------------------------------------------------
const g = new Voxels([X, Y, Z]);
const panes = [];
let lamps = 0;
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  const gr = ground(x, z), T = top[x][z];
  for (let y = 0; y < T; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }                 // foundation up to the ground
    if (y < FL) { g.set(x, y, z, "polished_andesite"); continue; }            // stone base course
    const ex = exposed(x, y, z), facade = ex.length > 0;
    if (y === T - 1) { g.set(x, y, z, facade ? "stone_bricks" : "smooth_stone"); continue; }   // parapet / roof deck
    if (door && x === door.x && z === door.z && y <= FL + 2) {
      if (y === FL) g.set(x, y, z, "polished_andesite_stairs", { facing: door.facing, half: "bottom", shape: "straight", waterlogged: "false" });
      else g.set(x, y, z, "dark_oak_door", { facing: door.facing, half: y === FL + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (floorLine(y)) { g.set(x, y, z, facade ? "quartz_bricks" : "smooth_quartz"); continue; }
    if (!facade) {
      const lit = gap.get(k3(x, y, z));
      if (lit === undefined) g.set(x, y, z, "stone");                        // solid core
      else if (lit) { g.set(x, y, z, "glowstone"); lamps++; }                // a lamp behind the glass
      continue;                                                              // else air: the gap behind a pane
    }
    if (spandrel(y)) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (pier(x, z, ex)) { g.set(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
    g.set(x, y, z, "light_blue_stained_glass_pane", {});
    panes.push([x, y, z]);
  }
}

// Panes join their neighbours in the wall plane, as a real glazing bar would.
for (const [x, y, z] of panes) {
  const link = (dx, dz) => (g.get(x + dx, y, z + dz) ? "true" : "false");
  g.set(x, y, z, "light_blue_stained_glass_pane", { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0), waterlogged: "false" });
}

// Roof plant on the body (a 5 x 5 box, two layers, rimmed in stone) and a little vent block on the tower roof.
for (let x = 12; x <= 16; x++) for (let z = 14; z <= 18; z++) {
  if (!inF(x, z) || top[x][z] !== TOP_MAIN) continue;
  const rim = x === 12 || x === 16 || z === 14 || z === 18;
  g.set(x, TOP_MAIN, z, rim ? "stone_bricks" : "smooth_quartz");
  g.set(x, TOP_MAIN + 1, z, rim ? "stone_bricks" : "smooth_quartz");
}
for (const [x, z] of [[27, 6], [28, 6], [27, 7], [28, 7]]) {
  if (inF(x, z) && top[x][z] === TOP_TOWER) g.set(x, TOP_TOWER, z, "stone_bricks");
}

const stats = g.save(`${DIR}/${NAME}.nbt`);
console.log(JSON.stringify({ ...stats, panes: panes.length, lamps, door, body: "18", tower: "22" }));
