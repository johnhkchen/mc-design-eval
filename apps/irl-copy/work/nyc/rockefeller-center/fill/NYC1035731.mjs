// 43 East 53rd Street (NYC1035731): a 1990 midtown office tower. Granite base, a glass curtain wall above it
// (cyan vision glass, grey spandrels, light-concrete mullions), setbacks that follow the lidar roof, a lobby
// entrance on the south frontage and a rooftop penthouse with a mast. Built from the cells file: foundation
// to each cell's ground, a median-smoothed roof quantised to storey lines, and an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1035731.cells.json", "utf8"));

const X = 26, Z = 25, Y = 92;
const ground = Array.from({ length: Z }, () => Array(X).fill(0));
const roof = Array.from({ length: Z }, () => Array(X).fill(0));
for (const [x, z, g, r] of cells) { ground[z][x] = g; roof[z][x] = r; }
const inside = (x, z) => x >= 0 && x < X && z >= 0 && z < Z;

// Storey lines: 7 is the base (ground floor plus a tall lobby band), then one storey every 3 blocks: 10, 13 ... 79.
const LINES = [7];
for (let y = 10; y <= 79; y += 3) LINES.push(y);
const nearest = (m) => LINES.reduce((a, b) => (Math.abs(b - m) < Math.abs(a - m) ? b : a));

// Lidar noise: the 3x3 median of the roof. Roofs at ground (1 to 3) are open court or plaza, not building.
const median = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) v.push(roof[z + dz][x + dx]);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const open = Array.from({ length: Z }, () => Array(X).fill(false));
const top = Array.from({ length: Z }, () => Array(X).fill(0));   // solid layers y < top
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const m = median(x, z);
  open[z][x] = m <= 3;
  top[z][x] = open[z][x] ? ground[z][x] + 1 : nearest(m);
}
// A second pass over the tiers, among building neighbours only, drops one-block lidar fins that stand above their block.
const smoothed = top.map((row, z) => row.map((t, x) => {
  if (open[z][x]) return t;
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz) && !open[z + dz][x + dx]) v.push(top[z + dz][x + dx]);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
}));
for (let z = 0; z < Z; z++) top[z] = smoothed[z];
// Outside the footprint counts as lower than anything, so its faces are exterior.
const T = (x, z) => (inside(x, z) ? top[z][x] : 0);
const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposures = (x, z, y) => Object.keys(OUT).filter((d) => T(x + OUT[d][0], z + OUT[d][1]) <= y);

const g = new Voxels([X, Y, Z]);

// Facade by height: plinth at ground, shopfront to y 6, cornice at 6, then per storey a grey spandrel line at 7+3j,
// vision glass with light mullions every third block, and a cornice on the top layer.
const facadeBlock = (x, z, y, t, gr, d) => {
  const along = d === "N" || d === "S" ? x : z;
  if (y === gr) return "polished_granite";
  if (y < 6) return along % 3 === 0 ? "polished_granite" : "glass";
  if (y === 6 || y === t - 1) return "polished_granite";
  if ((y - 7) % 3 === 0) return "gray_concrete";
  return along % 3 === 0 ? "light_gray_concrete" : "cyan_stained_glass";
};

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const gr = ground[z][x];
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");          // foundation to the ground
  if (open[z][x]) { g.set(x, gr, z, "smooth_stone"); continue; }         // open court: paving
  const t = top[z][x];
  for (let y = gr; y < t; y++) {
    const d = exposures(x, z, y);
    if (d.length) g.set(x, y, z, facadeBlock(x, z, y, t, gr, d[0]));
    else if (y === gr || (y >= 7 && (y - 7) % 3 === 0) || y === t - 1) g.set(x, y, z, "smooth_stone");  // floors and roof
  }
}

// Warm lights behind some vision glass: a glowstone or shroomlight on the floor just inside the window.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const gr = ground[z][x];
  if (open[z][x]) continue;
  for (let y = 8; y < top[z][x]; y++) {
    if ((y - 7) % 3 !== 1) continue;                                       // first vision row of a storey
    const d = exposures(x, z, y);
    if (!d.length) continue;
    const along = d[0] === "N" || d[0] === "S" ? x : z;
    if (along % 3 === 0 || y === top[z][x] - 1) continue;                   // mullion or cornice, not glass
    if ((x * 5 + z * 7 + y) % 11 !== 0) continue;
    const xi = x - OUT[d[0]][0], zi = z - OUT[d[0]][1];                      // inward neighbour
    if (!inside(xi, zi) || open[zi][xi] || top[zi][xi] <= y + 1 || y < gr + 2) continue;
    if (exposures(xi, zi, y).length) continue;                              // must be room air, not wall
    g.set(xi, y, zi, (x + z + y) % 2 ? "glowstone" : "shroomlight");
  }
}

// Lobby on the south frontage: two double-hung bronze-style doors under a recessed portal, lanterns under the
// first-floor slab above it.
const doorY = (x) => ({ facing: "north", hinge: x === 10 ? "left" : "right", open: "false", powered: "false" });
for (const x of [10, 11]) {
  const gr = ground[24][x];
  g.set(x, gr, 24, "iron_door", { ...doorY(x), half: "lower" });
  g.set(x, gr + 1, 24, "iron_door", { ...doorY(x), half: "upper" });
  g.set(x, 6, 23, "lantern", { hanging: "true", waterlogged: "false" });
}

// Penthouse on the 79 tier: glass ring at 80, solid walls to 81, cap at 82, then a mast with a lightning rod.
for (let z = 10; z <= 12; z++) for (let x = 12; x <= 17; x++) {
  const ring = z === 10 || z === 12 || x === 12 || x === 17;
  for (let y = top[z][x]; y < 82; y++) {
    const block = y === 82 ? "polished_granite" : y === 80 && ring ? "cyan_stained_glass" : "light_gray_concrete";
    g.set(x, y, z, block);
  }
  g.set(x, 82, z, "polished_granite");
}
for (let y = 83; y <= 85; y++) g.set(14, y, 11, "iron_bars");
g.set(14, 86, 11, "lightning_rod");

console.log(g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1035731.nbt"));
