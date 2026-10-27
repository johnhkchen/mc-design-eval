// Auckland Town Hall (way 23904006): an Edwardian civic block of rendered cream stone on a dark basalt plinth, with a
// copper-capped drum rising from the central mass. Storeys are 4 blocks, aligned to absolute y so every facade line
// runs level across the footprint; the roof heights come from the lidar, medianed and quantised to storey steps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const W = 99, D = 106, MAX_Y = 62;
const cells = JSON.parse(readFileSync(`${DIR}/way_23904006.cells.json`, "utf8"));

// the footprint as grids: in[x][z], ground G, lidar roof R
const grid = (v) => Array.from({ length: W }, () => new Array(D).fill(v));
const inF = grid(false), G = grid(0), R = grid(0);
for (const [x, z, g, r] of cells) { inF[x][z] = true; G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && inF[x][z];
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];   // [outward x, outward z, facing]

// roof tiers: the lidar roof medianed over a 5x5 window, then quantised to 4-block storeys above the ground
const T = grid(0);
for (const [x, z, g] of cells) {
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) vals.push(R[x + dx][z + dz]);
  vals.sort((a, b) => a - b);
  const m = vals[vals.length >> 1];
  T[x][z] = Math.max(4 * Math.ceil((g + 1) / 4), 4 * Math.round(m / 4));
}

// depth in from the footprint's edge (1 on the edge): the central mass rises a drum on top of its tier
const depth = grid(Infinity), queue = [];
for (const [x, z] of cells) if (DIRS.some(([dx, dz]) => !inside(x + dx, z + dz))) { depth[x][z] = 1; queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && depth[nx][nz] === Infinity) { depth[nx][nz] = depth[x][z] + 1; queue.push([nx, nz]); }
  }
}

// column tops: the tier, plus a copper drum (4, then 8 more) over the central mass where the tier is 44 high or more
const H = grid(0);
for (const [x, z] of cells) {
  let h = T[x][z];
  if (h >= 44) { const d = depth[x][z]; if (d >= 8) h += 8; else if (d >= 5) h += 4; }
  H[x][z] = Math.min(h, MAX_Y - 2);
}

// a cell is outside the building at height y when it is off the footprint or its own column has stopped below y
const outsideAt = (x, z, y) => !inside(x, z) || y >= H[x][z];
const exposedAt = (x, z, y) => DIRS.filter(([dx, dz]) => outsideAt(x + dx, z + dz, y));
const isShell = (x, z, y) => exposedAt(x, z, y).length > 0;

// the entrance: the outward direction with the most ground-level wall, and the middle of its run
const counts = {};
for (const [x, z] of cells) {
  if (H[x][z] - G[x][z] < 4) continue;
  for (const [dx, dz, name] of exposedAt(x, z, G[x][z])) counts[name] = (counts[name] || []).concat([[x, z, dx, dz]]);
}
const best = Object.values(counts).sort((a, b) => b.length - a.length)[0];
const run = best.slice().sort((a, b) => (a[2] !== 0 ? a[1] - b[1] : a[0] - b[0]));
const [ex0, ez0, odx, odz] = run[run.length >> 1];
const alongStep = odx !== 0 ? [0, 1] : [1, 0];
const facing = DIRS.find(([dx, dz]) => dx === odx && dz === odz)[2];
const entranceY = G[ex0][ez0];

const v = new Voxels([W, MAX_Y, D]);
const lights = [];
const roofCover = (x, z) => (H[x][z] >= 44 ? "oxidized_cut_copper" : "deepslate_tiles");

for (const [x, z] of cells) {
  const gr = G[x][z], top = H[x][z];
  for (let y = 0; y < gr; y++) v.set(x, y, z, "stone_bricks");                           // foundation to the lowest ground under it
  for (let y = gr; y < top; y++) {
    const ex = exposedAt(x, z, y);
    if (y === top - 1) {                                                                  // cornice on the wall, roof cover inside
      v.set(x, y, z, ex.length ? "stone_bricks" : roofCover(x, z));
    } else if (ex.length) {
      if (y === gr || y % 4 === 0) v.set(x, y, z, "stone_bricks");                       // plinth and string courses
      else if (y % 4 === 3) v.set(x, y, z, "smooth_quartz");                             // spandrel under each window band
      else {
        const [dx, dz] = ex[0];
        const along = dx !== 0 ? z : x;
        if (along % 3 === 0) v.set(x, y, z, "quartz_pillar");                           // piers between the windows
        else {
          v.set(x, y, z, "light_blue_stained_glass");
          if (y % 4 === 1 && (along * 7 + y * 3) % 5 === 0) lights.push([x - dx, y, z - dz]);   // a lamp behind some glass
        }
      }
    } else if (y % 4 === 0) {
      v.set(x, y, z, "smooth_stone");                                                      // floor slab, one per storey
    }
  }
}

// the lamps go in the air behind the glass: only where the cell is inside and not wall
for (const [x, y, z] of lights) if (inside(x, z) && y >= G[x][z] && y < H[x][z] && !isShell(x, z, y)) v.set(x, y, z, "glowstone");

// entrance: a dark oak door, stone surround, and a hood with a lantern under it
const [ax, az] = alongStep;
const door = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
v.set(ex0, entranceY, ez0, "dark_oak_door", door("lower"));
v.set(ex0, entranceY + 1, ez0, "dark_oak_door", door("upper"));
for (const k of [-1, 1]) for (let dy = 0; dy <= 2; dy++) {
  const px = ex0 + k * ax, pz = ez0 + k * az;
  if (isShell(px, pz, entranceY + dy)) v.set(px, entranceY + dy, pz, "stone_bricks");
}
v.set(ex0, entranceY + 2, ez0, "stone_bricks");                                          // lintel over the door
for (let k = -1; k <= 1; k++) v.set(ex0 + odx + k * ax, entranceY + 3, ez0 + odz + k * az, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
v.set(ex0 + odx, entranceY + 2, ez0 + odz, "lantern", { hanging: "true", waterlogged: "false" });

const out = v.save(`${DIR}/way_23904006.nbt`);
const tops = {}; for (const [x, z] of cells) tops[H[x][z]] = (tops[H[x][z]] || 0) + 1;
console.log(`cells ${cells.length}, lamps ${lights.length}, entrance facing ${facing} at (${ex0},${entranceY},${ez0}), tops ${JSON.stringify(tops)}`);
console.log(`saved ${out.blocks} blocks, palette ${out.palette}`);
