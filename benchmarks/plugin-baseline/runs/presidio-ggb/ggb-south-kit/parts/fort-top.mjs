// Plot 0 fort towers and grounds (plan.md PARTS 2): three stair towers, the Fort Point Lighthouse on the NW lobe, the
// parade and landward paving, the seawall walk (left smooth stone), shore rocks, lamp posts and the parapet lanterns.
// Coordinates are plot 0's own; build.mjs shifts them into the grid. Every write goes into air, except the y 0 paving,
// which replaces the kit's ground course (the ground is laid before the parts and stays writable).
import { stairTower, lighthouse, rockCluster, lampPost, rng, STONE_BRICKS } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Fort footprint map (plan.md): 1 char = 2x2 blocks, map column c -> x 2c..2c+1, row r -> z 2r..2r+1.
const MAP = [
  "............###....#..",
  "..........###########.",
  ".........#############",
  ".......#####..#######.",
  "###..#####....######..",
  "########.......####...",
  "#######.........###...",
  ".######.........###...",
  "..#####.......#####...",
  "..###.......#######...",
  "..###.....########....",
  "..##.....########.....",
  "..###..########.......",
  "..###########.........",
  "..#########...........",
  "..#######.............",
  "..#####...............",
  "..####................",
  "...#..................",
];
const XMAX = 42;
const ZMAX = 36;
const ROWS = MAP.length;
const COLS = MAP[0].length;

// Footprints that the parapet and the lanterns leave alone: x0, z0, x1, z1 (inclusive).
const TOWERS = [[24, 0, 27, 3], [38, 2, 41, 5], [4, 32, 7, 35]];
const LIGHTHOUSE = [2, 10, 4, 12];
// the walk in front of the sally port (the entrance) stays clear of lamp posts
const SALLY_APPROACH = [25, 26, 28, 29];
const PARADE_POSTS = [[16, 12], [26, 12], [24, 8], [12, 20]];

const inBox = (x, z, [x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
const cellAt = (x, z) => (MAP[Math.floor(z / 2)] ?? "")[Math.floor(x / 2)];
const isFort = (x, z) => x >= 0 && z >= 0 && x <= XMAX && z <= ZMAX && cellAt(x, z) === "#";

// The parade is the '.' region the fort encloses: flood the map's open cells from its border, and what the flood
// cannot reach is inside the walls.
const reached = new Set();
const stack = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  if ((r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) && MAP[r][c] === ".") stack.push([c, r]);
}
while (stack.length) {
  const [c, r] = stack.pop();
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS || MAP[r][c] !== ".") continue;
  if (reached.has(`${c},${r}`)) continue;
  reached.add(`${c},${r}`);
  stack.push([c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]);
}
const isParade = (x, z) => {
  if (x < 0 || z < 0 || x > XMAX || z > ZMAX || isFort(x, z)) return false;
  const c = Math.floor(x / 2), r = Math.floor(z / 2);
  return MAP[r]?.[c] === "." && !reached.has(`${c},${r}`);
};

const nearFort = (x, z, d) => {
  for (let dx = -d; dx <= d; dx++) for (let dz = -d; dz <= d; dz++) if (isFort(x + dx, z + dz)) return true;
  return false;
};
// The seawall walk: open ground within 2 blocks of the fort (the parade is inside the walls, so it is not the walk).
const isWalk = (x, z) => !isFort(x, z) && !isParade(x, z) && nearFort(x, z, 2);
const inTower = (x, z) => TOWERS.some((b) => inBox(x, z, b)) || inBox(x, z, LIGHTHOUSE);

// The stair towers stand on the fort: their y 1..6 is the fort's solid wall, which the fort shell locked, so a tower
// writes only from y 7 up (the parapet line). Its lower quoins stay in the fort's wall.
const aboveRing = (g) => ({
  inBounds: (x, y, z) => g.inBounds(x, y, z),
  isAir: (x, y, z) => g.isAir(x, y, z),
  blockAt: (x, y, z) => g.blockAt(x, y, z),
  set: (x, y, z, ...rest) => { if (y >= 7) g.set(x, y, z, ...rest); },
});

// Shore rocks: open ground beyond the walk on the north (z <= 3) or west (x <= 1) strip, at most 30 % of the strip,
// as 2x2 clusters seeded from a fixed rng so the kit is reproducible.
function pickRocks() {
  const rand = rng(41);
  const strip = [];
  for (let z = 0; z <= ZMAX; z++) for (let x = 0; x <= XMAX; x++) {
    if (isFort(x, z) || isParade(x, z) || isWalk(x, z) || inTower(x, z)) continue;
    if (z <= 3 || x <= 1) strip.push([x, z]);
  }
  const cap = Math.floor(strip.length * 0.3);
  const chosen = new Set();
  const cells = [];
  for (const [x, z] of strip) {
    if (chosen.has(`${x},${z}`) || rand() >= 0.06) continue;
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const k = `${x + dx},${z + dz}`;
      if (cells.length >= cap || chosen.has(k) || !strip.some(([sx, sz]) => sx === x + dx && sz === z + dz)) continue;
      chosen.add(k);
      cells.push([x + dx, z + dz, rand() < 0.5 ? 1 : 2]);
    }
  }
  return cells;
}

export function build(g) {
  // stair towers: N x24..27 z0..3 (doorway south), E x38..41 z2..5 (south), SW x4..7 z32..35 (east, the deck side)
  stairTower(aboveRing(g), 24, 1, 0, "south", { over: true });
  stairTower(aboveRing(g), 38, 1, 2, "south", { over: true });
  stairTower(aboveRing(g), 4, 1, 32, "east", { over: true });

  // Fort Point Lighthouse on the top tier at the NW corner, y 7..14
  lighthouse(g, 2, 7, 10);

  // ground: parade and landward paving are stone bricks at y 0; the walk and the fort keep the smooth stone course
  const rocks = pickRocks();
  const rockSet = new Set(rocks.map(([x, z]) => `${x},${z}`));
  for (let z = 0; z <= ZMAX; z++) for (let x = 0; x <= XMAX; x++) {
    if (isFort(x, z) || rockSet.has(`${x},${z}`)) continue;
    // the parade keeps a smooth stone border along its walls, so from above it reads as one clean paved court
    if (isParade(x, z) && nearFort(x, z, 1)) continue;
    if (isParade(x, z) || !isWalk(x, z)) g.set(x, 0, z, STONE_BRICKS);
  }
  rockCluster(g, rocks, 1);

  // lamp posts: the parade posts, then one every ~8 blocks along the walk and paving (never on a rock)
  for (const [x, z] of PARADE_POSTS) lampPost(g, x, z, 1);
  const lamps = [...PARADE_POSTS];
  for (let z = 0; z <= ZMAX; z++) for (let x = 0; x <= XMAX; x++) {
    if (isFort(x, z) || isParade(x, z) || rockSet.has(`${x},${z}`) || inTower(x, z)) continue;
    if (inBox(x, z, SALLY_APPROACH) || lamps.some(([lx, lz]) => Math.hypot(lx - x, lz - z) < 8)) continue;
    lampPost(g, x, z, 1);
    lamps.push([x, z]);
  }

  // barbette lanterns standing on the deck (y 7) just inside the parapet, about every 6 blocks round the fort, so the
  // parapet's y 8 top line stays clean
  const tops = [];
  for (let z = 0; z <= ZMAX; z++) for (let x = 0; x <= XMAX; x++) {
    if (!isFort(x, z) || inTower(x, z) || !g.isAir(x, 7, z) || g.isAir(x, 6, z)) continue;
    if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => g.inBounds(x + dx, 8, z + dz) && !g.isAir(x + dx, 8, z + dz))) continue;
    if (tops.some(([tx, tz]) => Math.hypot(tx - x, tz - z) < 6)) continue;
    g.set(x, 7, z, ...B.lantern(false));
    tops.push([x, z]);
  }

  return g;
}
