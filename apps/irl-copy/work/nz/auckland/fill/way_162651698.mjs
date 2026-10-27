// Kiwi on Queen (way 162651698): an 11-storey concrete-frame office block of the 1960s-70s on Queen Street. A basalt
// (polished andesite) podium of two storeys with a shopfront on the street and a basalt string course at 8; above it a
// ribbon of blue-tinted glass set one block back between light-grey piers and white spandrels, a white string course on
// each floor line. The outer band stops at 40 (a terrace with planters, a white parapet); the core is stepped in and
// rises to 44 as a louvred plant crown under a roof cap (the lidar's 43-44). Interiors are air behind the glass with a
// floor slab per storey and a column grid; warm glowstone behind about one pane in five.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162651698.cells.json", "utf8"));
const W = 34, D = 46, TOP = 46;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, gr, r] of cells) { G[x][z] = gr; R[x][z] = r; }
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

// median-smoothed lidar roof (the edge cells read low where the lidar clips a wall), then tiers
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const TOPY = Array.from({ length: W }, () => Array(D).fill(0));   // top of the body (exclusive)
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const m = median(x, z), d = dist[x][z];
  // crown: the core (more than 3 blocks in) under the lidar's 40+ rises to 44; the outer band stops at 40; low lidar
  // reads (under 32) are a lower wing at 24; two storeys over the ground at least
  let top = m < 32 ? 24 : (d >= 4 && m >= 40) ? 44 : 40;
  top = Math.max(top, G[x][z] + 8);
  TOPY[x][z] = top;
  tierCount[top] = (tierCount[top] || 0) + 1;
}
const crown = (x, z) => TOPY[x][z] === 44;

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACE_FACING = { N: "north", S: "south", W: "west", E: "east" };
const outward = (x, z) => Object.keys(DIRS).filter(k => !inside(x + DIRS[k][0], z + DIRS[k][1]));
// along-face coordinate: x on the north and south faces, z on the east and west (corners take x)
const faceU = (x, z) => (outward(x, z).some(k => k === "N" || k === "S") ? x : z);
// the cell one block in from a ring cell, against its outward face
const inward = (x, z, n) => { const k = outward(x, z)[0]; return [x - DIRS[k][0] * n, z - DIRS[k][1] * n]; };

// entrance: the outer face with the most street-level (low ground) cells; a 2-wide door at the middle of its run
const runs = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && dist[x][z] === 1 && G[x][z] <= 2)
  for (const k of outward(x, z)) (runs[k] ||= []).push(faceU(x, z));
let entranceFace = "N";
for (const k of Object.keys(runs)) if (runs[k].length > (runs[entranceFace]?.length ?? 0)) entranceFace = k;
const us = (runs[entranceFace] || []).sort((a, b) => a - b);
const doorU = us.length ? [us[us.length >> 1], us[us.length >> 1] + 1] : [-9, -9];
const onEntranceFace = (x, z) => dist[x][z] === 1 && outward(x, z).includes(entranceFace);
const isDoor = (x, z) => onEntranceFace(x, z) && doorU.includes(faceU(x, z));
const isFlank = (x, z) => onEntranceFace(x, z) && (faceU(x, z) === doorU[0] - 1 || faceU(x, z) === doorU[1] + 1);

// one kind per facade block: a ring cell at height y is deck, door, base, string, spandrel, pier, or window (a recess)
const ringKind = (x, z, y) => {
  const gr = G[x][z], top = TOPY[x][z];
  if (y === 39 || y === top - 1) return "deck";
  if (y === gr + 1 && y < 4) return isDoor(x, z) ? "door" : "base";
  if (isDoor(x, z) && (y === gr + 2 || y === gr + 3)) return y === gr + 2 ? "door" : "lintel";
  if (y % 4 === 0) return "string";
  if (y % 4 === 3) return "spandrel";
  if (faceU(x, z) % 4 === 0 || isFlank(x, z)) return "pier";
  const [ix, iz] = inward(x, z, 1);   // a window needs its glass one block in; otherwise it stays solid
  return inside(ix, iz) && dist[ix][iz] === 2 ? "window" : "pier";
};

// the glass sits one block back from the ring (a recess the piers and spandrels stand proud of), with glowstone one
// block behind it in about one pane in five
const frac = (n) => n - Math.floor(n);
const glass = new Set(), lights = new Set();
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && dist[x][z] === 1) {
  for (let y = G[x][z] + 1; y < TOPY[x][z]; y++) {
    if (ringKind(x, z, y) !== "window") continue;
    const [ix, iz] = inward(x, z, 1);
    if (!inside(ix, iz)) continue;
    glass.add(`${ix},${y},${iz}`);
    if (frac(Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453) > 0.8) {
      const [lx, lz] = inward(x, z, 2);
      if (inside(lx, lz)) lights.add(`${lx},${y},${lz}`);
    }
  }
}

const g = new Voxels([W, TOP, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = TOPY[x][z], d = dist[x][z], ring = d === 1, cr = crown(x, z);
  const u = faceU(x, z);
  // foundation: solid from y 0 up to the cell's ground, so nothing floats on the slope; the street edge is basalt
  for (let y = 0; y <= gr; y++) put(x, y, z, ring ? "polished_andesite" : "stone");

  for (let y = gr + 1; y < top; y++) {
    // the deck under every tier: the body's top at 39 (the crown's floor), the roof of each wing at top - 1
    if (y === 39 || y === top - 1) {
      put(x, y, z, ring || (cr && d === 4) ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    // crown: louvred plant on the core's outer ring, 40 to 42, a column grid inside
    if (cr && y >= 40) {
      if (d === 4) put(x, y, z, u % 3 === 0 ? "light_gray_concrete" : "gray_concrete");
      else if (d >= 5 && x % 6 === 3 && z % 6 === 3) put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (ring) {
      const kind = ringKind(x, z, y);
      if (kind === "door") put(x, y, z, "dark_oak_door", { facing: FACE_FACING[entranceFace], half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else if (kind === "base" || kind === "lintel") put(x, y, z, "polished_andesite");
      else if (kind === "string") put(x, y, z, y < 12 ? "polished_andesite" : "white_concrete");
      else if (kind === "spandrel") put(x, y, z, y < 8 ? "polished_andesite" : "white_concrete");
      else if (kind === "pier") put(x, y, z, y < 8 ? "polished_andesite" : "light_gray_concrete");
      // a window: the recess is air here; the glass is one block in
      continue;
    }

    // interior: glass behind the recess, air, a floor slab per storey, a column grid, warm light behind some panes
    const key = `${x},${y},${z}`;
    if (glass.has(key)) put(x, y, z, y < 4 ? "glass" : "light_blue_stained_glass");
    else if (d >= 3 && x % 6 === 3 && z % 6 === 3) put(x, y, z, "light_gray_concrete");
    else if (y % 4 === 0 && y >= 4 && y <= 36) put(x, y, z, "light_gray_concrete");
    else if (lights.has(key)) put(x, y, z, "glowstone");
    // terraces on the outer band's roof: planters at a few spots, standing on the deck
    else if (y === 40 && d <= 3 && !cr && (x * 5 + z * 3) % 13 === 0) put(x, y, z, "oak_leaves", { persistent: "true", distance: "7" });
  }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162651698.nbt");
console.log(JSON.stringify({ tiers: tierCount, entranceFace, doorU, glass: glass.size, lights: lights.size, ...stats }));
