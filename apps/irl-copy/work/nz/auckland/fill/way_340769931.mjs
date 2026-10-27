// GHD Centre, Auckland (way 340769931): a 1980s concrete-frame office block in the city's usual mid-rise idiom, white-painted
// concrete with blue-tinted glass bands and a dark basalt plinth and shopfront at the street. Lidar roofs are median-smoothed
// (5x5) and snapped to tiers on the 4-block storey grid: a 6-storey core (26) where the lidar reads 24+, a 5-storey mass
// (22) for 19-23, 4 storeys (18) and 3 (14) lower down, 2 (10) for the low rim. Each tier is a cornice and parapet over a
// flat roof cap; the core carries a plant room, the mid mass roof units. Facade: basalt base course, light-grey floor bands,
// white piers with blue glass, white spandrels, a dark-oak door on the lowest street face, glowstone behind some panes.
// Interiors are air, with a floor slab per storey; the foundation is solid from y 0 to each cell's ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_340769931.cells.json", "utf8"));
const W = 84, D_ = 95, H = 39;
const G = Array.from({ length: W }, () => Array(D_).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D_).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D_ && G[x][z] >= 0;

// 5x5 median of the lidar roof over footprint cells: noise out, the tiers' edges read as clean steps
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const RS = Array.from({ length: W }, () => Array(D_).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D_; z++) {
  if (!inside(x, z)) continue;
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) vals.push(R[x + dx][z + dz]);
  RS[x][z] = median(vals);
}

// tier: D = the deck (the cap's top), T = the top of the parapet. A cornice row at D, a parapet row at D+1.
const tierD = (r) => (r >= 24 ? 24 : r >= 19 ? 20 : r >= 14 ? 16 : r >= 10 ? 12 : 8);
const DECK = Array.from({ length: W }, () => Array(D_).fill(0));
const TOP = Array.from({ length: W }, () => Array(D_).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D_; z++) if (inside(x, z)) {
  const d = tierD(RS[x][z]);
  DECK[x][z] = Math.max(d, G[x][z] + 3);
  TOP[x][z] = DECK[x][z] + 2;
}

// a wall: an edge of the footprint, or beside a cell whose tier differs (a setback's riser)
const ring = (x, z) => {
  if (!inside(x, z)) return false;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (!inside(nx, nz) || TOP[nx][nz] !== TOP[x][z]) return true;
  }
  return false;
};
const RING = Array.from({ length: W }, (_, x) => Array.from({ length: D_ }, (_, z) => ring(x, z)));

// distance from the wall into the interior (0 on a wall), for the penthouse and the roof units
const dist = Array.from({ length: W }, () => Array(D_).fill(-1));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D_; z++) if (RING[x][z]) { dist[x][z] = 0; queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && dist[nx][nz] < 0) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// the entrance: a street-level wall cell on the footprint's edge, on the lowest ground, the middle of those candidates
const outwardOf = (x, z) => [[-1, 0, "east"], [1, 0, "west"], [0, -1, "south"], [0, 1, "north"]]
  .find(([dx, dz]) => !inside(x + dx, z + dz));                // the outward neighbour (the door faces in, so opposite)
const minG = Math.min(...cells.map(([, , g]) => g));
const candidates = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D_; z++) if (RING[x][z] && G[x][z] === minG && outwardOf(x, z)) candidates.push([x, z]);
candidates.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
const [EX, EZ] = candidates[candidates.length >> 1] ?? [-1, -1];
const EDOOR = outwardOf(EX, EZ);
const doorFacing = EDOOR ? { "-1,0": "east", "1,0": "west", "0,-1": "south", "0,1": "north" }[`${EDOOR[0]},${EDOOR[1]}`] : null;

const v = new Voxels([W, H, D_]);
const put = (x, y, z, b, st) => { if (y >= 0 && y < H) v.set(x, y, z, b, st); };

for (let x = 0; x < W; x++) for (let z = 0; z < D_; z++) {
  if (!inside(x, z)) continue;
  const g = G[x][z], deck = DECK[x][z], top = TOP[x][z];

  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < g; y++) put(x, y, z, y === 0 ? "polished_basalt" : "stone_bricks");

  if (RING[x][z]) {
    // which face: the rhythm runs along it (z on an east/west face, x on a north/south one)
    const xFace = !inside(x - 1, z) || !inside(x + 1, z) || TOP[x - 1]?.[z] !== top || TOP[x + 1]?.[z] !== top;
    const u = xFace ? z : x;
    const inward = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dz]) => inside(x + dx, z + dz) && !RING[x + dx][z + dz]);
    for (let y = g; y < top; y++) {
      const s = Math.floor(y / 4), yy = y % 4;
      if (y >= deck) { put(x, y, z, y === deck ? "light_gray_concrete" : "white_concrete"); continue; }  // cornice, parapet
      const pier = u % 4 === 3;
      let b;
      if (yy === 0) b = s === 0 ? "polished_basalt" : "light_gray_concrete";           // base course, floor band
      else if (yy === 3) b = s === 0 ? "polished_basalt" : "white_concrete";           // spandrel / shop header
      else b = pier ? (s === 0 ? "polished_basalt" : "white_concrete") : "light_blue_stained_glass";
      put(x, y, z, b);
      // the entrance: a dark-oak door (lower and upper) in the street bay, a lintel above it
      if (EX === x && EZ === z && y >= g && y <= g + 1 && s === 0) {
        if (y === g) put(x, y, z, "dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
      }
      if (EX === x && EZ === z && yy === 3 && s === 0) put(x, y, z, "smooth_stone_slab", { type: "bottom" });
      // a warm pane: a glowstone just inside the glass, in the air gap
      if (yy === 1 && !pier && inward && (x * 31 + z * 17 + y * 7) % 9 === 0) put(x + inward[0], y, z + inward[1], "glowstone");
    }
  } else {
    // interior: a floor slab per storey (above the ground), the roof cap on the deck
    for (let y = Math.max(g, 1); y < deck; y++) {
      if (y === deck - 1) put(x, y, z, "smooth_stone");
      else if (y % 4 === 0 && y > g) put(x, y, z, "light_gray_concrete");
    }
  }
}

// roof units: a plant room on the core's deck (inside the walls), and small units on the mid and low decks
for (let x = 0; x < W; x++) for (let z = 0; z < D_; z++) {
  if (!inside(x, z) || RING[x][z]) continue;
  const deck = DECK[x][z], d = dist[x][z];
  if (deck === 24 && d >= 5) { put(x, 24, z, "light_gray_concrete"); put(x, 25, z, "light_gray_concrete"); put(x, 26, z, "smooth_stone"); }
  else if (deck !== 24 && d >= 3 && x % 8 === 3 && z % 8 === 3) { put(x, deck, z, "light_gray_concrete"); put(x, deck + 1, z, "iron_block"); }
}

const info = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_340769931.nbt");
console.log(JSON.stringify({ entrance: [EX, EZ, doorFacing], blocks: info.blocks, palette: info.palette }));
