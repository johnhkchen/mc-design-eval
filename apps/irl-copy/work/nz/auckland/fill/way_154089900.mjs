// Sofitel Auckland Viaduct Harbour (way 154089900): a late-1990s hotel on the reclaimed Viaduct Harbour edge, a cream
// render-and-glass block of five storeys (4 blocks each) with a parapet, on a stone plinth at the lowest ground. The
// lidar roof (median of 3x3, rounded to the storey grid) gives one main deck at y 20 (a 22-block top with the parapet)
// and lower wings stepping down to 16, 12 and 8: setbacks, each standing on the roof slab below. Storey lines are the
// multiples of 4, so every floor, string course and roof stands on what is under it. The shell is one block thick:
// glass panes in white-concrete bays (3 blocks: a pier and two panes), spandrels as frames, quartz string courses, and
// an air gap behind each pane with a glowstone in some of them. The ground storey is a glazed lobby with no piers, the
// entrance a dark-oak door under a short canopy on posts, with a lantern hanging from it. The roof carries a plant room
// with a flat cap and two lanterns. No interiors: the floor slab per storey is the only thing behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089900.cells.json", "utf8"));
const W = 107, D = 85, H = 35;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// median of the 3x3 lidar roofs (noise out), then the storey line of the main roof slab (rounded to the 4-block grid)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const DECK = Array.from({ length: W }, () => Array(D).fill(0)); // y of each cell's roof slab (a multiple of 4)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) DECK[x][z] = Math.max(4, 4 * Math.round((median(x, z) - 2) / 4));
const top = (x, z) => DECK[x][z] + 1;                         // blocks run up to and including the roof slab

// faces of a cell exposed at height y: outside the footprint, or beside a neighbour with no block at y
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => !inside(x + dx, z + dz) || top(x + dx, z + dz) <= y);
const paneState = (dz) => (dz !== 0                                  // a face running along x: panes join east-west
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// the entrance: the middle of the longest run of street-level (ground 0 or 1) outer wall on one side
const sides = { N: [], S: [], W: [], E: [] };
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || G[x][z] > 1) continue;
  for (const [side, dx, dz] of DIRS) if (!inside(x + dx, z + dz)) sides[side].push([x, z]);
}
const [doorSide] = Object.entries(sides).sort((a, b) => b[1].length - a[1].length)[0];
const outward = DIRS.find(([s]) => s === doorSide), [, odx, odz] = outward;
const run = sides[doorSide].sort((a, b) => (odz !== 0 ? a[0] - b[0] : a[1] - b[1]));
const [dxc, dzc] = run[run.length >> 1];
const facing = { N: "north", S: "south", W: "west", E: "east" }[doorSide];
const alongX = odz !== 0 ? 1 : 0, alongZ = odz !== 0 ? 0 : 1; // the wall line's direction
const inwardX = -odx, inwardZ = -odz;

// the roof's depth from its outer edge: the plant room sits at the deepest cell of the main deck
const depth = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (inside(x, z) && DIRS.some(([, dx, dz]) => !inside(x + dx, z + dz))) { depth[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [, dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !depth[nx][nz]) { depth[nx][nz] = depth[x][z] + 1; queue.push([nx, nz]); }
  }
}
const MAIN = 20;
let plant = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (inside(x, z) && DECK[x][z] === MAIN && (!plant || depth[x][z] > depth[plant[0]][plant[1]])) plant = [x, z];
}
const plantBox = [];
if (plant) for (let x = plant[0] - 3; x <= plant[0] + 3; x++) for (let z = plant[1] - 2; z <= plant[1] + 2; z++) {
  if (inside(x, z) && DECK[x][z] === MAIN) plantBox.push([x, z]);
}
const plantRing = (x, z) => x === plant[0] - 3 || x === plant[0] + 3 || z === plant[1] - 2 || z === plant[1] + 2;

const v = new Voxels([W, H, D]);
const glowAt = [];                                     // lights just inside a glazed bay, placed after the shell
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const d = DECK[x][z], t = top(x, z);
  for (let y = 0; y < t; y++) {
    const ext = exposed(x, z, y);
    if (y === 0) { v.set(x, y, z, ext.length ? "polished_andesite" : "light_gray_concrete"); continue; }   // plinth and floor
    if (y === d) { v.set(x, y, z, ext.length ? "smooth_quartz" : "light_gray_concrete"); continue; }     // roof slab, cornice edge
    if (y % 4 === 0) { v.set(x, y, z, ext.length ? "smooth_quartz" : "light_gray_concrete"); continue; } // string course / floor slab
    if (!ext.length) continue;                         // interior air
    if (ext.length > 1) { v.set(x, y, z, "white_concrete"); continue; }   // corner column
    const [[, dx, dz]] = ext;
    const k = y % 4, along = dz !== 0 ? x : z;
    if (k === 3) { v.set(x, y, z, "white_concrete"); continue; }        // spandrel, the frame under each window
    if (y >= 4 && along % 3 === 0) { v.set(x, y, z, "white_concrete"); continue; }   // mullion pier (the lobby has none)
    v.set(x, y, z, "light_blue_stained_glass_pane", paneState(dz));
    if (k === 2 && (x * 7 + z * 13 + y * 5) % 9 === 0) glowAt.push([x - dx, y, z - dz]);
  }
  // the parapet: a course on the roof's outer edge, standing on the roof slab
  if (exposed(x, z, t).length) v.set(x, t, z, "smooth_quartz");
}

// interior air behind the glass, lit by glowstone just behind some panes
for (const [gx, gy, gz] of glowAt) if (inside(gx, gz) && !v.val(gx, gy, gz)) v.set(gx, gy, gz, "glowstone");

// the entrance: a dark-oak door in the middle of the street run, under a canopy on two posts, lit by a hanging lantern
v.set(dxc, 1, dzc, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
v.set(dxc, 2, dzc, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
for (const a of [-1, 0, 1]) {
  const x = dxc + a * alongX + inwardX, z = dzc + a * alongZ + inwardZ;
  if (!inside(x, z)) continue;
  v.set(x, 3, z, "smooth_stone");                      // canopy: framed by the lintel at the wall
  if (a !== 0) { v.set(x, 1, z, "polished_andesite"); v.set(x, 2, z, "polished_andesite"); }   // posts
  else v.set(x, 2, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// the roof plant room: a cap on white-concrete walls, lanterns on the corners
if (plant) {
  for (const [x, z] of plantBox) {
    if (plantRing(x, z)) for (const y of [21, 22]) v.set(x, y, z, "smooth_quartz");   // walls; the inside is air
    v.set(x, 23, z, "light_gray_concrete");
  }
  for (const [x, z] of [[plant[0] - 3, plant[1] - 2], [plant[0] + 3, plant[1] + 2]]) {
    if (inside(x, z)) v.set(x, 24, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

const info = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089900.nbt");
console.log(`way_154089900: ${info.blocks} blocks, ${info.palette} palette entries; entrance on the ${doorSide} side`);
