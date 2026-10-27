// Way 306777514, Mt Eden / Eden Terrace: a 1930s reinforced-concrete commercial block, four storeys on a falling site.
// Cream plastered walls (smooth quartz) over a dark stone base; a stone shopfront with glass panes at street level and
// two doors on the north (street) front; a flat roof stepped in one cell at the outline; plant boxes on the roof;
// warm glowstone behind some upper windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_306777514.cells.json`, "utf8"));
const W = 41, D = 65, H = 31;
const LINES = [6, 10, 14];     // storey floors, absolute y above the lowest ground
const DOORS = [25, 33];        // entrances on the north front (z = 0)
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

const ground = Array.from({ length: W }, () => Array(D).fill(-1));
const roofLidar = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, gr, r] of cells) { ground[x][z] = gr; roofLidar[x][z] = r; }

const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[x][z] >= 0;
const boundary = (x, z) => Object.values(DIRS).some(([dx, dz]) => !inside(x + dx, z + dz));
// lidar roof (16-18 m-ish blocks) smoothed into two tiers: 16 on the front and lower edges, 18 for the mass,
// with the mass's outline cell stepped down to 16 so the top tier sets back
const top = (x, z) => {
  if (!inside(x, z)) return -1;
  let t = roofLidar[x][z] <= 16 ? 16 : 18;
  if (t === 18 && boundary(x, z)) t = 16;
  return t;
};

const g = new Voxels([W, H, D]);
const panes = [];        // upper-storey panes on the north and south faces, for the lamps behind them

// the wall block at (x, y, z); face is the exterior side it faces (null for a step inside the outline)
function wallAt(x, y, z, gr, t, face) {
  if (y === t) return ["stone_brick_slab", { type: "top", waterlogged: "false" }];          // coping
  if (LINES.includes(y) && y > gr + 1) return ["smooth_quartz_slab", { type: "bottom", waterlogged: "false" }]; // storey line
  if (face === "N" && z === 0 && DOORS.includes(x) && y <= gr + 2) {
    return ["dark_oak_door", { facing: "north", half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (!face) return ["smooth_quartz", null];                                               // step or a cell with no exterior side
  const c = face === "N" || face === "S" ? x : z;
  const pane = c % 4 === 1 || c % 4 === 2;                                                  // glass in a 2-on, 2-off pier rhythm
  if (y <= gr + 3) {                                                                        // street-level shopfront
    if (face === "N" && z === 0 && DOORS.includes(x) && y === gr + 3) return ["dark_oak_slab", { type: "bottom", waterlogged: "false" }];
    if (pane) return ["glass_pane", null];
    return ["polished_andesite", null];                                                     // stone piers and the base course
  }
  const L = Math.max(0, ...LINES.filter((l) => l <= y));
  const rel = y - L;
  if (pane && (rel === 1 || rel === 2)) return ["glass_pane", null];                       // two-high upper windows
  return ["smooth_quartz", null];
}

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = ground[x][z], t = top(x, z);
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");                             // foundation to the ground
  for (let y = gr + 1; y <= t; y++) {
    const out = Object.keys(DIRS).filter((k) => !inside(x + DIRS[k][0], z + DIRS[k][1]));
    const stepped = Object.keys(DIRS).some((k) => inside(x + DIRS[k][0], z + DIRS[k][1]) && top(x + DIRS[k][0], z + DIRS[k][1]) < y);
    if (out.length || stepped) {
      const face = out[0] ?? null;
      const [name, state] = wallAt(x, y, z, gr, t, face);
      g.set(x, y, z, name, state ?? undefined);
      if (name === "glass_pane" && y > gr + 3 && face && (face === "N" || face === "S")) panes.push([x, y, z, face]);
    } else if (y === t) {
      g.set(x, y, z, "stone");                                                              // flat roof, mid-grey so it reads from the air
    } else if (LINES.includes(y) && y > gr + 1) {
      g.set(x, y, z, "smooth_stone");                                                       // floor slab
    }                                                                                       // else air: the interior
  }
}

// warm light in some upper windows: a glowstone in the air just behind the glass
for (const [x, y, z, face] of panes) {
  if ((x * 7 + y * 3) % 5 !== 0) continue;
  const zin = face === "N" ? z + 1 : z - 1;
  if (inside(x, zin) && g.val(x, y, zin) === 0) g.set(x, y, zin, "glowstone");
}

// glass panes connect to whatever they stand against, as the game draws them
for (const [x, y, z] of panes) {
  const conn = (dx, dz) => (g.val(x + dx, y, z + dz) !== 0 ? "true" : "false");
  g.set(x, y, z, "glass_pane", { north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0), waterlogged: "false" });
}

// roof plant: two light plant boxes on the top tier
for (const [x0, z0] of [[10, 24], [22, 42]]) {
  for (let x = x0; x < x0 + 4; x++) for (let z = z0; z < z0 + 2; z++) {
    if (!inside(x, z) || top(x, z) !== 18) continue;
    g.set(x, 19, z, "smooth_quartz");
    g.set(x, 20, z, "iron_block");
  }
}

const res = g.save(`${DIR}/way_306777514.nbt`);
console.log(JSON.stringify({ blocks: res.blocks, palette: res.palette, panes: panes.length }));
