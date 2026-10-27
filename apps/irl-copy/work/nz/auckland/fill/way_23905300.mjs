// Science Centre 301 (way 23905300): a late-twentieth-century commercial mid-rise, read from the lidar record: a 48-block
// office slab (12 storeys of 4 blocks) over a basalt plinth, a 52-block core rising one storey higher, and lower
// 12- and 40-block wings. Pale precast concrete piers and spandrels with blue-glass bands, a dark basalt base and
// plinth, a stepped cornice and a plant room on the core. Storeys are aligned to absolute y so every line runs level
// across the footprint; each column is solid from y 0 up to its own top, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const W = 79, D = 71, MAX_Y = 64;
const cells = JSON.parse(readFileSync(`${DIR}/way_23905300.cells.json`, "utf8"));

// the footprint as grids: inF[x][z], ground G, lidar roof R
const grid = (v) => Array.from({ length: W }, () => new Array(D).fill(v));
const inF = grid(false), G = grid(0), R = grid(0);
for (const [x, z, g, r] of cells) { inF[x][z] = true; G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && inF[x][z];
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];   // [outward x, outward z, facing]

// tiers: the lidar roof medianed over a 5x5 window, quantised to 4-block storeys, at least one storey above the ground
const T = grid(0);
for (const [x, z, g] of cells) {
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) vals.push(R[x + dx][z + dz]);
  vals.sort((a, b) => a - b);
  const m = vals[vals.length >> 1];
  T[x][z] = Math.max(4 * Math.ceil((g + 1) / 4), 4 * Math.round(m / 4));
}

// setbacks: the core (tier 52) steps back a storey on its outer ring, so it rises from the 48 slab in a stepped
// profile rather than a single cliff; depth is counted in from the edge of the core
const core = (x, z) => inside(x, z) && T[x][z] >= 52;
const depth = grid(Infinity), queue = [];
for (const [x, z, g] of cells) if (T[x][z] >= 52 && DIRS.some(([dx, dz]) => !core(x + dx, z + dz))) { depth[x][z] = 1; queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (core(nx, nz) && depth[nx][nz] === Infinity) { depth[nx][nz] = depth[x][z] + 1; queue.push([nx, nz]); }
  }
}

// column tops: the tier, the core's outer ring one storey lower, capped under the world's top
const H = grid(0);
for (const [x, z, g] of cells) {
  let h = T[x][z];
  if (h >= 52 && depth[x][z] <= 1) h -= 4;
  H[x][z] = Math.min(Math.max(h, g + 4), MAX_Y - 6);
}

// a cell is outside the building at height y when it is off the footprint or its column has stopped below y
const outsideAt = (x, z, y) => !inside(x, z) || y >= H[x][z];
const exposedAt = (x, z, y) => DIRS.filter(([dx, dz]) => outsideAt(x + dx, z + dz, y));
const isShell = (x, z, y) => exposedAt(x, z, y).length > 0;

// the entrance: the outward side with the most ground-level wall, and the middle of its run
const counts = {};
for (const [x, z] of cells) {
  if (H[x][z] - G[x][z] < 4) continue;
  for (const [dx, dz, name] of exposedAt(x, z, G[x][z])) (counts[name] ||= []).push([x, z, dx, dz]);
}
const best = Object.values(counts).sort((a, b) => b.length - a.length)[0];
const run = best.slice().sort((a, b) => (a[2] !== 0 ? a[1] - b[1] : a[0] - b[0]));
const [ex0, ez0, odx, odz] = run[run.length >> 1];
const alongStep = odx !== 0 ? [0, 1] : [1, 0];
const facing = DIRS.find(([dx, dz]) => dx === odx && dz === odz)[2];
const entranceY = G[ex0][ez0];

const v = new Voxels([W, MAX_Y, D]);
const lights = [];
const roofCover = "light_gray_concrete";

for (const [x, z] of cells) {
  const gr = G[x][z], top = H[x][z];
  for (let y = 0; y < gr; y++) v.set(x, y, z, "polished_basalt");                    // foundation to the lowest ground under it
  for (let y = gr; y < top; y++) {
    const ex = exposedAt(x, z, y);
    const [dx, dz] = ex[0] ?? [0, 0];
    const along = dx !== 0 ? z : x;
    if (y === top - 1) {                                                              // cornice on the wall, roof membrane inside
      v.set(x, y, z, ex.length ? "smooth_stone" : roofCover);
    } else if (ex.length) {
      if (y === gr) v.set(x, y, z, "deepslate_bricks");                              // basalt plinth course
      else if (y < gr + 4 && y === gr + 3) v.set(x, y, z, "smooth_stone");           // ground-storey lintel band
      else if (y < gr + 4) {                                                          // shopfront: glass between piers
        if (along % 3 === 0) v.set(x, y, z, "stone_bricks");
        else v.set(x, y, z, "light_blue_stained_glass");
      } else if (y % 4 === 0) v.set(x, y, z, "smooth_quartz");                       // floor line
      else if (y % 4 === 3) v.set(x, y, z, "white_concrete");                        // precast spandrel
      else if (along % 3 === 0) v.set(x, y, z, "light_gray_concrete");               // precast pier
      else {
        v.set(x, y, z, "light_blue_stained_glass");
        if (y % 4 === 1 && (along * 7 + y * 3) % 5 === 0) lights.push([x - dx, y, z - dz]);   // a lamp behind some glass
      }
    } else if (y === gr || y % 4 === 0) {
      v.set(x, y, z, "smooth_stone");                                                // floor slab, one per storey
    }
  }
}

// the lamps go in the air behind the glass: only where the cell is inside and not wall
for (const [x, y, z] of lights) if (inside(x, z) && y >= G[x][z] && y < H[x][z] && !isShell(x, z, y)) v.set(x, y, z, "glowstone");

// parapet coping on the perimeter of the roof, and a plant room on the deep core
for (const [x, z] of cells) {
  const top = H[x][z];
  if (isShell(x, z, top - 1)) v.set(x, top, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  if (T[x][z] >= 52 && depth[x][z] >= 2 && x % 13 >= 4 && x % 13 <= 6 && z % 11 >= 3 && z % 11 <= 5) {
    v.set(x, top, z, "white_concrete");
    v.set(x, top + 1, z, "white_concrete");
  }
}

// entrance: a dark oak door in a stone surround, a lintel and a canopy with a lantern under it
const [ax, az] = alongStep;
const door = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
v.set(ex0, entranceY, ez0, "dark_oak_door", door("lower"));
v.set(ex0, entranceY + 1, ez0, "dark_oak_door", door("upper"));
for (const k of [-1, 1]) for (let dy = 0; dy <= 2; dy++) {
  const px = ex0 + k * ax, pz = ez0 + k * az;
  if (isShell(px, pz, entranceY + dy)) v.set(px, entranceY + dy, pz, "stone_bricks");
}
v.set(ex0, entranceY + 2, ez0, "stone_bricks");                                         // lintel over the door
for (let k = -1; k <= 1; k++) v.set(ex0 + odx + k * ax, entranceY + 3, ez0 + odz + k * az, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
v.set(ex0 + odx, entranceY + 2, ez0 + odz, "lantern", { hanging: "true", waterlogged: "false" });

const out = v.save(`${DIR}/way_23905300.nbt`);
const tops = {}; for (const [x, z] of cells) tops[H[x][z]] = (tops[H[x][z]] || 0) + 1;
console.log(`cells ${cells.length}, lamps ${lights.length}, entrance facing ${facing} at (${ex0},${entranceY},${ez0}), tops ${JSON.stringify(tops)}`);
console.log(`saved ${out.blocks} blocks, palette ${out.palette}`);
