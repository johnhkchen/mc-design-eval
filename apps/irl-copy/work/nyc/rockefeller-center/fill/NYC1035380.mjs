// 545 Fifth Avenue (NYC 1035380), Commercial & Office, 1930. A 1930 setback office in Art Deco stone: a polished
// granite base course with shopfronts and two dark entrances on the Fifth Avenue face (x = 0), calcite walls with
// smooth-quartz piers, light-blue glass in 3-block storeys, and three setback tiers (44, 47, 50) with a penthouse and
// a lightning rod on the crown. The lidar roof is median-smoothed, then snapped to flat tiers on the storey grid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${HERE}/NYC1035380.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 41, D = 26, H = 62;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DOOR_Z = [5, 12];                                                            // two entrances on the x = 0 face

const GROUND = Array.from({ length: W }, () => Array(D).fill(null));
const RAW = Array.from({ length: W }, () => Array(D).fill(null));
for (const [x, z, g, r] of cells) { GROUND[x][z] = g; RAW[x][z] = r; }
const inFP = (x, z) => x >= 0 && z >= 0 && x < W && z < D && GROUND[x][z] !== null;

// 3x3 median of the lidar roof over the footprint (kills the lone spikes).
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFP(x + dx, z + dz)) v.push(RAW[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};

// Flat tiers on the storey grid: every top is 2 mod 3, so a floor slab sits 4 below it. 42-45 is the low wing (44),
// 46-49 the main block (47), 50 and over the crown (50). Roofs of 3 or less are open court (ground only).
const tierOf = (r) => (r >= 49.5 ? 50 : r >= 45.5 ? 47 : r >= 41.5 ? 44 : Math.max(8, 8 + 3 * Math.round((r - 8) / 3)));

const T = Array.from({ length: W }, () => Array(D).fill(null));    // top of each cell (= ground for an open court)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFP(x, z)) continue;
  const g = GROUND[x][z], r = median(x, z);
  T[x][z] = r <= 3 ? g : Math.max(g, tierOf(r));
}

// Faces a cell shows at height y: outside the footprint, or above a lower neighbour's top (a setback face).
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inFP(x + dx, z + dz) || y >= T[x + dx][z + dz]);
const isDoor = (x, z) => x === 0 && DOOR_Z.includes(z);
const doorZone = (x, z) => x === 0 && DOOR_Z.some((d) => Math.abs(z - d) <= 1);

const g = new Voxels([W, H, D]);
const PANES = [], GLASS = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFP(x, z)) continue;
  const gr = GROUND[x][z], t = T[x][z];
  if (t === gr) {                                                  // open court: paving on the foundation
    for (let y = 0; y < gr; y++) g.set(x, y, z, y === gr - 1 ? "smooth_stone" : "polished_granite");
    continue;
  }
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_granite");   // foundation, down to the lowest ground
  for (let y = gr; y < t; y++) {
    const ex = exposed(x, z, y);
    if (y === t - 1) { g.set(x, y, z, "light_gray_concrete"); continue; }   // roof cap on every cell
    if (!ex.length) {                                                       // interior: floor slabs only, air between
      if (y === gr || (y % 3 === 1 && y >= 4 && y <= t - 4)) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const alongX = ex.some(([dx]) => dx !== 0);                    // the face runs along z: piers by z
    const pier = (alongX ? z : x) % 3 === 0;
    if (y < 4) {                                                   // ground floor: base course, shopfronts, entrances
      if (isDoor(x, z) && y <= gr + 1) continue;                   // doors placed below
      if (y === gr || pier || doorZone(x, z)) g.set(x, y, z, "polished_granite");
      else { g.set(x, y, z, "light_blue_stained_glass"); GLASS.push([x, y, z, ex]); }
    } else if (y === t - 2) g.set(x, y, z, "smooth_quartz");        // cornice
    else if (y % 3 === 1) g.set(x, y, z, "polished_andesite");      // storey belt course
    else if (pier) g.set(x, y, z, "smooth_quartz");                  // piers are the window frames
    else { g.set(x, y, z, "light_blue_stained_glass_pane"); PANES.push([x, y, z]); GLASS.push([x, y, z, ex]); }
  }
}

// Entrances: dark oak doors in the Fifth Avenue wall, a black canopy band over them at the first floor line.
for (const dz of DOOR_Z) {
  const gr = GROUND[0][dz];
  const door = { facing: "west", hinge: "left", open: "false", powered: "false" };
  g.set(0, gr, dz, "dark_oak_door", { ...door, half: "lower" });
  g.set(0, gr + 1, dz, "dark_oak_door", { ...door, half: "upper" });
  for (const z of [dz - 1, dz, dz + 1]) g.set(0, 4, z, "black_concrete");
}

// Roof: a penthouse of two storeys on the crown's interior, a lightning rod on it; plant boxes on the wing roof.
const crown = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inFP(x, z) && T[x][z] === 50 && !exposed(x, z, 49).length) crown.push([x, z]);
if (crown.length) {
  const cx = Math.round(crown.reduce((s, [x]) => s + x, 0) / crown.length);
  const cz = Math.round(crown.reduce((s, [, z]) => s + z, 0) / crown.length);
  const inCrown = new Set(crown.map(([x, z]) => `${x},${z}`));
  for (let x = cx - 3; x <= cx + 3; x++) for (let z = cz - 2; z <= cz + 2; z++) {
    if (!inCrown.has(`${x},${z}`)) continue;
    g.set(x, 50, z, "smooth_quartz"); g.set(x, 51, z, "calcite"); g.set(x, 52, z, "light_gray_concrete");
  }
  g.set(cx, 53, cz, "lightning_rod", { facing: "up", powered: "false" });
}
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (inFP(x, z) && T[x][z] === 44 && !exposed(x, z, 43).length && x % 7 === 3 && z % 5 === 2) {
    g.set(x, 44, z, "bricks"); g.set(x, 45, z, "bricks");
  }
}

// Warm light: about one window in five has a glowstone on the room side of it, where the floor under it is solid.
for (const [x, y, z, ex] of GLASS) {
  if ((x * 7 + z * 3 + y) % 5 !== 0 || !(y % 3 === 2 || y === GROUND[x][z] + 1)) continue;
  const [dx, dz] = ex[0], ix = x - dx, iz = z - dz;
  if (!inFP(ix, iz) || y < GROUND[ix][iz] || y >= T[ix][iz] || exposed(ix, iz, y).length) continue;
  if (!g.get(ix, y - 1, iz)) continue;
  g.set(ix, y, iz, "glowstone");
}

// Panes take their connections from the neighbours (glass, piers and lights connect; air does not).
const has = (x, y, z) => g.get(x, y, z) !== null;
for (const [x, y, z] of PANES) {
  g.set(x, y, z, "light_blue_stained_glass_pane", {
    north: has(x, y, z - 1), south: has(x, y, z + 1), west: has(x - 1, y, z), east: has(x + 1, y, z), waterlogged: "false",
  });
}

const out = g.save(`${HERE}/NYC1035380.nbt`);
console.log(JSON.stringify({ footprint: cells.length, crown: crown.length, panes: PANES.length, ...out }));
