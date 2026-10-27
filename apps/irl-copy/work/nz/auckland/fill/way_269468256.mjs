// Eden 5, Mt Eden (way 269468256): a five-storey 1960s reinforced-concrete office block on a basalt plinth, cream
// painted concrete with banded glass and dark mullions, a six-storey core on its high side (lidar roof 21+), a parapet
// and cornice, a recessed-lintel entrance on the north face, and plant boxes on the roof. Lidar roof heights are
// median-smoothed (3x3) and snapped to the 4-block storey grid. Every column is solid from y 0 to its ground and then
// up to its top, so nothing floats. Interiors are air with a floor slab per storey; some windows show glowstone or
// shroomlight behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269468256.cells.json", "utf8"));
const W = 67, D = 82, Y = 35;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under the cell, -1 = outside the footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};

// top of each column: the smoothed lidar roof on the storey grid (21 and up is the six-storey core), at least one storey above its ground
const T = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = median(x, z);
  const tier = r >= 21 ? 24 : Math.max(4, Math.round((r + 1) / 4) * 4);
  T[x][z] = Math.max(tier, 4 * Math.ceil((G[x][z] + 1) / 4));
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const air = (x, z, y) => inside(x, z) && y >= G[x][z] && y < T[x][z];
// a facade block: air at y with a face onto the street or onto open air above a lower neighbour
const wall = (x, z, y) => air(x, z, y) && DIRS.some(([dx, dz]) => !inside(x + dx, z + dz) || T[x + dx][z + dz] <= y);
// an enclosed room cell: air, not facade, not a floor slab or roof deck
const room = (x, z, y) => air(x, z, y) && !wall(x, z, y) && y % 4 !== 0 && y !== G[x][z] && y < T[x][z] - 1;

// entrance: a north-face wall cell on the lowest ground in the main body, the middle of that run
const ring = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (wall(x, z, G[x][z]) && !inside(x, z - 1)) ring.push([x, z]);
const northRun = ring.filter(([x, z]) => G[x][z] <= 1 && T[x][z] >= 20);
const doorCands = northRun.length ? northRun : ring.filter(([x, z]) => G[x][z] === 0);
const door = doorCands[doorCands.length >> 1];
const doorY = G[door[0]][door[1]];

const wallBlock = (x, z, y, gr, t) => {
  if (y - gr < 2) return "polished_blackstone_bricks";              // basalt plinth
  if (y === t - 1) return "smooth_stone";                            // parapet
  if (y === t - 2) return "light_gray_concrete";                     // cornice course
  if (y % 4 === 0) return "light_gray_concrete";                     // string course at each floor line
  if (y % 4 === 3) return "white_concrete";                          // spandrel under each window band
  return (x + z) % 3 === 0 ? "gray_concrete" : "light_blue_stained_glass";  // dark mullion, then a pair of panes
};

const g = new Voxels([W, Y, D]);
const lit = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const gr = G[x][z], t = T[x][z];
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");          // foundation: solid under the ground
  for (let y = gr; y < t; y++) {
    const onDoor = door && x === door[0] && z === door[1];
    if (onDoor && (y === doorY || y === doorY + 1)) {
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === doorY ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (door && z === door[1] && Math.abs(x - door[0]) <= 1 && y === doorY + 2) { g.set(x, y, z, "light_gray_concrete"); continue; }   // lintel over the door
    if (wall(x, z, y)) {
      g.set(x, y, z, wallBlock(x, z, y, gr, t));
      // some panes get a warm lamp in the room behind them
      const isGlass = y % 4 === 1 || y % 4 === 2;
      if (isGlass && (x + z) % 3 !== 0 && (x * 31 + z * 17 + y * 7) % 9 === 0) {
        const inward = DIRS.map(([dx, dz]) => [x + dx, z + dz]).find(([nx, nz]) => room(nx, nz, y));
        if (inward) lit.push([inward[0], y, inward[1], (x + z + y) % 2 ? "glowstone" : "shroomlight"]);
      }
    } else if (y === t - 1) g.set(x, y, z, "light_gray_concrete");        // roof deck
    else if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");    // floor slab
  }
}
for (const [x, y, z, b] of lit) g.set(x, y, z, b);

// the lantern in the entrance hall, just inside the door
if (room(door[0], door[1] + 1, doorY + 1)) g.set(door[0], doorY + 1, door[1] + 1, "lantern");

// roof plant: a few 3x3 lift-and-vent rooms, three blocks high with a parapet-coloured cap, set on the roof deck
let plant = 0;
for (let x = 0; x < W - 2; x++) for (let z = 0; z < D - 2; z++) {
  if (x % 23 !== 6 || z % 19 !== 5) continue;
  const t = T[x][z], cs = [];
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) cs.push([x + dx, z + dz]);
  if (!cs.every(([cx, cz]) => inside(cx, cz) && T[cx][cz] === t && !wall(cx, cz, t - 1))) continue;
  for (const [cx, cz] of cs) for (let y = t; y < t + 3; y++) g.set(cx, y, cz, y === t + 2 ? "smooth_stone" : "light_gray_concrete");
  plant++;
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269468256.nbt");
console.log(`way_269468256: ${out.blocks} blocks, palette ${out.palette}, door at ${door}, ${lit.length} lamps, ${plant} roof boxes`);
