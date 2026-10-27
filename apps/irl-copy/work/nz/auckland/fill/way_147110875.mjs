// Way 147110875, Auckland CBD: a 1990s glass-and-concrete office tower on a 32-block podium (about 27 storeys, 136 blocks
// to the plant screen). Lidar roof heights are median-smoothed and snapped to the 4-block storey grid: a podium at 32 on the
// low edge, mid-rise steps (64 to 100) where the lidar reads them, a 116 setback ring, and a 132 crown with a 136 plant screen
// set in 9 to 11 cells from the edge. Every column stands solid from y 0 to its ground (basalt-type foundation), then to its
// roof, so no tier floats. Facades: a basalt base course, a shopfront ground floor with a dark-oak door under a lintel, a
// 4-block storey rhythm (white spandrel at each floor line, blue-green glass between light-grey mullions every 3 cells),
// a cornice and parapet. Interiors are air behind the 1-cell skin with a floor slab per storey and a few glowstone lamps
// two cells in. Storey lines sit on absolute y multiples of 4 so every column lines up across the setbacks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147110875.cells.json", "utf8"));
const W = 73, D = 73, TOP = 148;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  if (edge) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// 3x3 median of the lidar roof, then tiers on the storey grid
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));   // column top (roof) above y 0
const tiers = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const s = median(x, z);
  let top = s < 60 ? 32 : s < 100 ? 4 * Math.round(s / 4) : s < 124 ? 116 : 132;
  top = Math.max(top, G[x][z] + 4);                              // at least one storey over the ground under the cell
  H[x][z] = top; tiers[top] = (tiers[top] || 0) + 1;
}
console.error("tiers", JSON.stringify(tiers));

const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
// the face a shell cell shows at height y: the first side with no footprint beside it, or a neighbour that stops below y
const faceAt = (x, z, y) => {
  for (const [k, dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inside(nx, nz)) return k;
    if (y >= G[nx][nz] && H[nx][nz] <= y) return k;
  }
  return null;
};

// the entrance: the north-facing street run's middle cell on the low ground, on a podium-height column
const north = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1) && G[x][z] <= 3 && H[x][z] >= 32) north.push([x, z]);
const door = north.length ? north[north.length >> 1] : null;
const doorKey = door ? `${door[0]},${door[1]}` : "";

const hash = (x, z, y) => ((x * 73856093) ^ (z * 19349663) ^ (y * 83492791)) >>> 0;
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

const g = new Voxels([W, TOP, D]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], ed = dist[x][z];
  const podium = top <= 32;
  const plantRing = top === 132 && ed >= 9 && ed <= 11;
  const roofTop = plantRing ? 136 : top;

  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < roofTop; y++) {
    const face = y < top ? faceAt(x, z, y) : null;
    const idx = face === "N" || face === "S" ? x : z;           // mullion grid along the face
    const pier = idx % 3 === 0;
    const rel = y - gr;                                          // 0 = base course

    // plant screen: iron louvres on the ring, concrete cap
    if (y >= top) {
      g.set(x, y, z, y === 135 || y === top ? "light_gray_concrete" : "iron_bars");
      continue;
    }

    if (y === top - 1) {                                         // roof: parapet cap on the rim, terrace or roof on the rest
      g.set(x, y, z, face ? "smooth_stone" : podium ? "moss_block" : "light_gray_concrete");
      continue;
    }
    if (face) {
      // the facade: shell cell
      if (door && x === door[0] && z === door[1] && (y === gr || y === gr + 1)) {
        g.set(x, y, z, "dark_oak_door", { ...DOOR, half: y === gr ? "lower" : "upper" });
        continue;
      }
      if (door && face === "N" && Math.abs(x - door[0]) <= 1 && z === door[1] && (y === gr + 2 || y === gr + 3)) {
        g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // canopy lintel over the door
        continue;
      }
      if (rel === 0) { g.set(x, y, z, "stone_bricks"); continue; }          // basalt base course
      if (rel < 4 && !podium) {                                            // shopfront: glass with dark-oak mullions
        g.set(x, y, z, pier ? "dark_oak_log" : "light_blue_stained_glass");
        continue;
      }
      if (y === top - 2) { g.set(x, y, z, "stone_bricks"); continue; }     // cornice course
      if (podium) {                                                       // podium: grey concrete bands, glass ribbon
        const band = y % 4 === 0 || y % 4 === 3;
        g.set(x, y, z, band || pier ? "light_gray_concrete" : "gray_stained_glass");
        continue;
      }
      if (y % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }     // spandrel at each storey line
      g.set(x, y, z, pier ? "light_gray_concrete" : "cyan_stained_glass");
      continue;
    }

    // interior: air behind the skin, a floor slab per storey, a few lamps two cells in
    if (y % 4 === 0 && y > gr) { g.set(x, y, z, "smooth_stone"); continue; }
    if (ed >= 3 && y % 4 === 2 && hash(x, z, y) % 9 === 0) { g.set(x, y, z, "glowstone"); continue; }
  }
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147110875.nbt");
console.error("saved", info, "door", doorKey || "none");
