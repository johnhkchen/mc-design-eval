// Heritage Tower: a 1930s stepped Art Deco office block on the flank of Maungawhau, 14 storeys above a stone podium.
// The massing follows the lidar roof (median-smoothed over 7x7, quantised to 4-block storeys), so the tower stands on a
// podium with setback tiers and a small penthouse. Facade: cream terracotta piers and floor bands, grey spandrels,
// blue glass in bays of three, a stone base course and a shopfront ground floor with a recessed entrance on the south face.
// Every storey stands on the one below; the foundation is solid to each cell's ground; interiors are air behind the glass
// with a floor slab per storey and a few glowstone lamps.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24655194.cells.json", "utf8"));   // [x, z, ground, roof]
const W = 76, D = 57, H = 76;
const F0 = 7, STOREY = 4, MIN_N = 2, MAX_N = 14;     // storey datum (ground floor slab) at y 7; the lidar's roof 63 is storey 14

// footprint, lidar ground and roof per cell
const ground = Array.from({ length: W }, () => Array(D).fill(-1));
const roof = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, g, r] of cells) { ground[x][z] = g; roof[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[x][z] >= 0;

// storeys per cell: the lidar roof, median-smoothed over 7x7 footprint cells, then smoothed again so the tiers are clean
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const clamp = (v) => Math.min(MAX_N, Math.max(MIN_N, v));
const N0 = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z] of cells) {
  const v = [];
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (inside(x + dx, z + dz)) v.push(roof[x + dx][z + dz]);
  N0[x][z] = clamp(Math.floor((median(v) - F0) / STOREY));     // floor, not round: 59 to 61 are all one tier of 13
}
const N = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z] of cells) {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(N0[x + dx][z + dz]);
  N[x][z] = median(v);
}
const maxN = Math.max(...cells.map(([x, z]) => N[x][z]));

// a cell's exposed sides at storey k: neighbours outside the footprint, or with no storey k
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outward = (x, z, k) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || N[x + dx][z + dz] <= k);

const g = new Voxels([W, H, D]);
// storeys only stand above the ground: the foundation below each cell's ground is never replaced by a wall or floor
const put = (x, y, z, block, state) => { if (y >= ground[x][z]) g.set(x, y, z, block, state); };

// podium and foundation: solid from y 0 to the storey datum, with a polished base course on top
for (const [x, z, gr] of cells) {
  for (let y = 0; y < F0; y++) g.set(x, y, z, y === F0 - 1 ? "polished_andesite" : y < gr ? "stone" : "stone_bricks");
}

// the entrance: on the south face (outward +z) at the storey 0 cell nearest x = 38
const southFace = cells.filter(([x, z]) => outward(x, z, 0).some(([dx, dz]) => dx === 0 && dz === 1));
const doorX = southFace.map(([x]) => x).reduce((best, x) => (Math.abs(x - 38) < Math.abs(best - 38) ? x : best), southFace[0][0]);
const doorZ = southFace.filter(([x]) => x === doorX).reduce((m, [, z]) => Math.max(m, z), -1);

// storeys: a floor band across each cell, then the facade of each exposed side (piers every 4th cell, glass in bays of three,
// dark spandrel above), corner piers, and air behind the glass
const WHITE = "white_terracotta", SPAND = "gray_terracotta", GLASS = "light_blue_stained_glass", DARK = "polished_andesite";
for (let k = 0; k < maxN; k++) {
  for (const [x, z] of cells) {
    if (N[x][z] <= k) continue;
    const y0 = F0 + STOREY * k;
    const out = outward(x, z, k);
    put(x, y0, z, out.length ? WHITE : "smooth_stone");           // the floor line, or the slab of an interior storey
    if (out.length === 0) continue;                              // interior: air behind the glass
    if (out.length >= 2) {                                       // corner: a pier
      for (let y = y0 + 1; y <= y0 + 3; y++) put(x, y, z, WHITE);
      continue;
    }
    const [dx, dz] = out[0];
    const along = dz !== 0 ? x : z;                              // position along the face
    const pier = along % 4 === 0;
    const base = k === 0 ? DARK : WHITE;                         // the shopfront piers are dark
    for (let y = y0 + 1; y <= y0 + 2; y++) put(x, y, z, pier ? base : GLASS);
    put(x, y0 + 3, z, pier ? base : SPAND);
    // a warm lamp in some bays: glowstone on the room side of the glass
    const ix = x - dx, iz = z - dz;
    if (!pier && (x * 7 + z * 13 + k * 5) % 11 === 0 && inside(ix, iz) && outward(ix, iz, k).length === 0) {
      put(ix, y0 + 1, iz, "glowstone");
    }
  }
}

// the entrance: a recessed-looking door with piers either side and a stone hood over it
for (const dxo of [-1, 0, 1]) {
  put(doorX + dxo, F0 + 1, doorZ, DARK);
  put(doorX + dxo, F0 + 2, doorZ, DARK);
  put(doorX + dxo, F0 + 3, doorZ, "stone_brick_slab", { type: "top" });
}
put(doorX, F0 + 1, doorZ, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(doorX, F0 + 2, doorZ, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// roofs: a slab at each cell's top, a parapet on the outer edge, and a penthouse with plant rooms on the tallest cells
for (const [x, z] of cells) {
  const T = F0 + STOREY * N[x][z];
  put(x, T, z, "smooth_stone");
  if (outward(x, z, N[x][z]).length) put(x, T + 1, z, DARK);
  if (N[x][z] === MAX_N && x % 6 === 3 && z % 6 === 3 && outward(x, z, N[x][z]).length === 0) {
    for (let y = T + 1; y <= T + 3; y++) put(x, y, z, "gray_concrete");
    put(x, T + 4, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// a warm lamp on the parapet of each setback's corners
for (const [x, z] of cells) {
  const T = F0 + STOREY * N[x][z];
  if (N[x][z] === maxN && outward(x, z, N[x][z]).length >= 2 && (x + z) % 5 === 0) put(x, T + 1, z, "shroomlight");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24655194.nbt");
