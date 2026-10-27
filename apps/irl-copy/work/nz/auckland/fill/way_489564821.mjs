// Northern Roller Milling Co., Auckland (way 489564821): an early-20th-century flour mill, read from the record as a brick
// and stone-banded mill with a tall grain-storage tower at its south-east end. The lidar roof reads 8 blocks over most of the
// footprint (flush with the foundation top, so each wing gets two storeys minimum), 12-20 on the north-east and north-west
// steps, and 43-47 on the tower. Tops are median-smoothed and snapped to a 4-block storey grid (storey lines at y = 0 mod 4);
// the tower is one diagonal strip flat at 44; the wings step down round it. The facade is a brick skin with
// stone belts and lintels at every storey line, glass windows between brick piers on a 3-block bay, a stone plinth and shop
// glass at the ground storey, a dark-oak door on the longest street face, glowstone behind some lower-window panes. Interiors are a
// solid core with an air gap behind the glass, so every storey stands on the one below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_489564821.cells.json", "utf8"));
const W = 45, D = 36, H = 59;
const G = Array.from({ length: D }, () => Array(W).fill(-1));   // ground (foundation top) by [z][x], -1 = not footprint
const R = Array.from({ length: D }, () => Array(W).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[z][x] = g; R[z][x] = r; }
const inM = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[z][x] >= 0;

// --- massing: smoothed, storey-snapped tops (multiples of 4) ---
const ceil4 = (v) => Math.ceil(v / 4) * 4, round4 = (v) => Math.round(v / 4) * 4;
const T = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inM(x, z)) continue;
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inM(x + dx, z + dz)) vals.push(R[z + dz][x + dx]);
  vals.sort((a, b) => a - b);
  T[z][x] = Math.max(round4(vals[vals.length >> 1]), ceil4(G[z][x] + 8), 12);   // at least two storeys above the foundation
}
// the grain tower: cells at 36+ are the tower, a diagonal strip about four cells wide, flat at 44
const TW = T.map((row, z) => row.map((t, x) => inM(x, z) && t >= 36));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (TW[z][x]) T[z][x] = 44;

// --- one storey grid: floor lines at G and every 4; windows on the two middle rows of each storey ---
const groundEnd = (g) => (g % 4 === 0 ? g + 4 : ceil4(g));   // the ground storey runs from its foundation top to the next line
const DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
const exposedDirs = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d], nx = x + dx, nz = z + dz;
  return !inM(nx, nz) || y >= T[nz][nx];       // open air beyond the footprint, or above the neighbour's top
});
const inside = (x, z, y) => inM(x, z) && y >= G[z][x] && y < T[z][x];
const isSkin = (x, z, y) => inside(x, z, y) && exposedDirs(x, z, y).length > 0;
const isWindowRow = (x, z, y) => y !== G[z][x] && (y % 4 === 1 || y % 4 === 2);
const isGap = (x, z, y) => {
  if (!inside(x, z, y) || isSkin(x, z, y) || !isWindowRow(x, z, y)) return false;
  return Object.values(DIRS).some(([dx, dz]) => isSkin(x + dx, z + dz, y));
};

// --- the entrance: the middle of the longest run of exposed ground-storey wall on any face, facing out ---
const FACE = { n: "north", s: "south", e: "east", w: "west" };
let door = null;
for (const d of Object.keys(FACE)) {
  const alongN = d === "n" || d === "s";
  const cells = [];
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const y = G[z][x] + 1;
    if (inM(x, z) && isSkin(x, z, y) && exposedDirs(x, z, y).includes(d)) cells.push([x, z]);
  }
  const lines = new Map();
  for (const c of cells) { const k = alongN ? c[1] : c[0]; if (!lines.has(k)) lines.set(k, []); lines.get(k).push(alongN ? c[0] : c[1]); }
  for (const [k, us] of lines) {
    us.sort((a, b) => a - b);
    let run = [us[0]];
    const flush = () => {
      if (!door || run.length > door.run) {
        const mid = run[run.length >> 1];
        door = { run: run.length, face: d, x: alongN ? mid : k, z: alongN ? k : mid };
      }
    };
    for (let i = 1; i < us.length; i++) {
      if (us[i] === us[i - 1] + 1) run.push(us[i]); else { flush(); run = [us[i]]; }
    }
    flush();
  }
}

// --- build ---
const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const doorState = (half) => ({ facing: FACE[door.face], half, hinge: "left", open: "false", powered: "false" });
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inM(x, z)) continue;
  const gr = G[z][x], top = T[z][x], ge = groundEnd(gr);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");                 // the foundation under the cell
  for (let y = gr; y < top; y++) {
    if (isSkin(x, z, y)) {
      const dirs = exposedDirs(x, z, y);
      const alongX = dirs.includes("n") || dirs.includes("s");          // the face's along-wall coordinate
      const u = alongX ? x : z;
      const ground = y < ge;
      if (y === top - 1) put(x, y, z, "smooth_stone");                  // coping
      else if (isWindowRow(x, z, y)) {
        if (u % 3 === 0) put(x, y, z, ground ? "stone_bricks" : "bricks"); // pier
        else put(x, y, z, "glass");
      } else put(x, y, z, ground ? "stone_bricks" : "smooth_stone");    // plinth, belt course, lintel
    } else if (y === top - 1) put(x, y, z, "stone");                    // the roof membrane
    else if (isGap(x, z, y)) {
      if (y % 4 === 1 && hash(x, y, z) % 5 === 0) put(x, y, z, "glowstone"); // a warm lamp behind some panes
    } else put(x, y, z, "bricks");                                      // the solid core, invisible inside
  }
}

// the door, its stone surround, and the lintel above it
const dg = G[door.z][door.x];
for (const half of ["lower", "upper"]) put(door.x, dg + (half === "lower" ? 1 : 2), door.z, "dark_oak_door", doorState(half));
const alongDoor = door.face === "n" || door.face === "s" ? [1, 0] : [0, 1];   // the wall's along-face step
for (const sgn of [-1, 1]) {
  const fx = door.x + sgn * alongDoor[0], fz = door.z + sgn * alongDoor[1];
  if (!isSkin(fx, fz, dg + 1)) continue;                               // only the wall's own cells get the surround
  for (const y of [dg + 1, dg + 2]) put(fx, y, fz, "stone_bricks");
}

// roof plant: two iron-block housings on the tower's flat 44 top, where a 2x2 patch is all 44
const vents = [];
for (let z = 1; z < D - 2 && vents.length < 2; z++) for (let x = 1; x < W - 2 && vents.length < 2; x++) {
  const patch = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => [x + dx, z + dz]);
  if (!patch.every(([px, pz]) => inM(px, pz) && T[pz][px] === 44)) continue;
  if (vents.some(([vx, vz]) => Math.abs(vx - x) < 6 && Math.abs(vz - z) < 6)) continue;
  vents.push([x, z]);
}
for (const [vx, vz] of vents) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) for (let y = 44; y < 46; y++) put(vx + dx, y, vz + dz, "iron_block");

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_489564821.nbt");
console.log(`way_489564821: ${blocks} blocks, palette ${palette}, door at x${door.x} z${door.z}, roof vents ${vents.length}`);
