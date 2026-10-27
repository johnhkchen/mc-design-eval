// Madison House, Auckland (way 270499623): a 1970s-80s concrete-frame office block, ten storeys (40 blocks) on the
// lidar's flat roof, with a lower three-storey-and-a-bit wing (36) on the north-west edge where the lidar reads 37-38.
// Roof heights are 3x3 median-smoothed and snapped to the 4-block storey grid: the core and the south-east (39-40) rise
// to 40, the north-west strip (37-38) stops at 36. Facade: a white-concrete pier every third bay, light-grey spandrels
// at each floor line and a dark cap on the parapet, blue and grey glass between the piers, a base course and a glass
// shopfront on the ground floor, a dark-oak entrance on the north face under a stone canopy. Each storey is solid
// concrete with a one-cell air gap behind the glass (lit with glowstone and shroomlight in some bays), so every floor
// sits on the solid storey below. Plant boxes on the roof; foundations fill from y 0 to the cell's ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270499623.cells.json", "utf8"));
const W = 39, D = 28, TOP = 53;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
let minX = W, minZ = D;
for (const [x, z] of cells.map(c => [c[0], c[1]])) { minX = Math.min(minX, x); minZ = Math.min(minZ, z); }

// distance from the outside ring (1 on the edge), BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const edge = Object.values(DIRS).some(([dx, dz]) => !inside(x + dx, z + dz));
  if (edge) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of Object.values(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed roof, then two tiers: the tower (40) and the north-west wing (36)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));
const tiers = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  H[x][z] = median(x, z) >= 39 ? 40 : 36;
  tiers[H[x][z]] = (tiers[H[x][z]] || 0) + 1;
}

// the entrance: on the north face, at the lowest ground there, the middle of that run (the street side)
const northFace = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1)) northFace.push([x, z]);
const centreX = (minX + Math.max(...cells.map(c => c[0]))) / 2;
const northRun = northFace.filter(([x, z]) => G[x][z] <= 1 && Math.abs(x - centreX) <= 8);
const [ex, ez] = northRun.length ? northRun.reduce((a, b) => Math.abs(b[0] - centreX) < Math.abs(a[0] - centreX) ? b : a) : [-1, -1];

// the faces of a cell that are exposed at height y: to the outside, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// what the skin shows at a cell's outward face (null = not skin); a pure function of (x, z, y), so a neighbour can be read
const skinKind = (x, z, y) => {
  if (!inside(x, z) || y < G[x][z] || y >= H[x][z]) return null;
  const faces = exposed(x, z, y);
  if (!faces.length) return null;
  const g = G[x][z], h = H[x][z];
  const isEntrance = x === ex && z === ez;
  if (isEntrance && y === 1) return { kind: "door", lower: true, faces };     // the entrance: door, then the canopy row above
  if (isEntrance && y === 2) return { kind: "door", lower: false, faces };
  if (isEntrance && y === 3) return { kind: "canopy", faces };
  if (y === h - 1) return { kind: "cap", block: "gray_concrete", faces };
  if (y === h - 2) return { kind: "spandrel", block: "light_gray_concrete", faces };
  if (y < 4) {                                                       // ground storey: base course, shopfront, lintel
    if (y === g) return { kind: "base", block: "polished_andesite", faces };
    if (y === 3) return { kind: "lintel", block: "light_gray_concrete", faces };
  } else if (y % 4 === 0 || y % 4 === 3) return { kind: "spandrel", block: "light_gray_concrete", faces };
  if (faces.length >= 2) return { kind: "pier", block: "white_concrete", faces };
  const along = faces.some(k => k === "N" || k === "S") ? x - minX : z - minZ;
  if (along % 3 === 0) return { kind: "pier", block: "white_concrete", faces };
  return { kind: "window", faces };
};

// an interior cell behind a window (in front of nothing else): the one-cell air gap
const isGlazed = (k) => k && (k.kind === "window" || k.kind === "door");
const gapBehind = (x, z, y) => {
  if (skinKind(x, z, y)) return false;
  return Object.values(DIRS).some(([dx, dz]) => isGlazed(skinKind(x + dx, z + dz, y)));
};

const g = new Voxels([W, TOP, D]);
const DOOR_FACING = "north";
let lit = 0, air = 0, cellsDone = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const gr = G[x][z], h = H[x][z];
  for (let y = 0; y < h; y++) {
    if (y < gr) { g.set(x, y, z, "polished_andesite"); continue; }                 // foundation to the lidar ground
    const k = skinKind(x, z, y);
    if (k) {
      if (k.kind === "door") {
        g.set(x, y, z, "dark_oak_door", { facing: DOOR_FACING, half: k.lower ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (k.kind === "canopy") {
        g.set(x, y, z, "stone_brick_stairs", { facing: DOOR_FACING, half: "top", shape: "straight", waterlogged: "false" });
      } else if (k.kind === "window") {
        const glass = hash(x, y, z) % 7 === 0 ? "gray_stained_glass" : "light_blue_stained_glass";
        g.set(x, y, z, glass);
      } else {
        g.set(x, y, z, k.block);
      }
      continue;
    }
    if (gapBehind(x, z, y)) {                                                        // air behind the glass, some lit
      const row = y % 4;
      const glazedNear = Object.values(DIRS).some(([dx, dz]) => isGlazed(skinKind(x + dx, z + dz, y)));
      if (glazedNear && hash(x, y, z) % 5 === 0 && y < h - 2 && row !== 0 && row !== 3) {
        g.set(x, y, z, "glowstone"); lit++;
      } else if (glazedNear && y < 4 && hash(x, y, z) % 4 === 0) {
        g.set(x, y, z, "shroomlight"); lit++;
      } else air++;
      continue;
    }
    g.set(x, y, z, y === h - 1 ? "gray_concrete" : "light_gray_concrete");  // structural core, roof membrane on top
    cellsDone++;
  }
}

// canopy over the entrance: the two skin cells beside the door on the canopy row, as the same overhang
if (ex >= 0) for (const dx of [-1, 1]) {   // the canopy reaches a bay either side of the door
  const nx = ex + dx; const k = skinKind(nx, ez, 3);
  if (k && k.kind === "lintel") g.set(nx, 3, ez, "stone_brick_stairs", { facing: DOOR_FACING, half: "top", shape: "straight", waterlogged: "false" });
}

// roof plant: 2x2 boxes on the tower's flat roof, set in from the parapet (distance 5 or more)
let plant = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && H[x][z] === 40 && dist[x][z] >= 5 && x % 6 === 2 && z % 6 === 2) {
  const cs = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (cs.every(([cx, cz]) => inside(cx, cz) && H[cx][cz] === 40 && dist[cx][cz] >= 4)) {
    for (const [cx, cz] of cs) {
      g.set(cx, 40, cz, "smooth_stone"); g.set(cx, 41, cz, "smooth_stone");
    }
    g.set(x, 42, z, "gray_concrete"); plant++;
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270499623.nbt";
const res = g.save(out);
console.log(JSON.stringify({ tiers, entrance: [ex, ez], lit, air, core: cellsDone, plant, saved: res }));
