// Neo Apartments, Auckland (way 925448696): a U-plan mid-rise apartment block on a basalt plinth, 26 blocks to the roof
// (about 21 m above its lowest ground): a 3-block ground storey (lobby and shopfront glazing) over four 4-block residential
// storeys, a light-grey cornice and a cream parapet. The lidar roof is median-smoothed and snapped to even blocks, so the
// wings stay flat tiers. Facade: cream render with 4-block window rhythm (light-grey mullion piers every 4 blocks, glass
// bands, render head), corner piers, a double entrance on the street side with stone-brick steps, glowstone behind some
// panes. Interiors are a 1-block air gap behind the glass with a floor slab per storey; the rest is solid, so every tier
// stands on what is below it. A lift overrun with a glass band sits on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_925448696.cells.json", "utf8"));
const W = 62, D = 56, TOP = 39;
const FLOORS = [8, 12, 16, 20];      // absolute storey lines: the ground storey runs from its ground up to 8
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));

const G = grid(-1), R0 = grid(0);     // G: ground (foundation top), -1 = not footprint; R0: lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R0[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// roof: 3x3 median, snapped to even blocks, at least 3 above the ground under the cell
const R = grid(0);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R0[x + dx][z + dz]);
  v.sort((a, b) => a - b);
  R[x][z] = Math.max(2 * Math.round(v[v.length >> 1] / 2), G[x][z] + 3);
}

// a cell is solid at height y while y < its roof; the walls are its exposed faces at that height
const present = (x, z, y) => inside(x, z) && y < R[x][z];
const exposedDirs = (x, z, y) => Object.keys(DIRS).filter(k => !present(x + DIRS[k][0], z + DIRS[k][1], y));
// how many cells in a row share this face direction at height y (the length of the wall it sits in)
const alongRun = (x, z, y, dir) => {
  const [sx, sz] = dir === "N" || dir === "S" ? [1, 0] : [0, 1];
  let n = 1;
  for (const s of [1, -1]) for (let i = 1; ; i++) {
    const nx = x + sx * i * s, nz = z + sz * i * s;
    if (!inside(nx, nz) || !exposedDirs(nx, nz, y).includes(dir)) break;
    n++;
  }
  return n;
};

// depth from the outside at each height: 1 = facade, 2 = the air gap behind it, 3+ = solid
const distAt = (y) => {
  const d = grid(0), q = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (present(x, z, y) && exposedDirs(x, z, y).length) { d[x][z] = 1; q.push([x, z]); }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i];
    for (const [dx, dz] of Object.values(DIRS)) {
      const nx = x + dx, nz = z + dz;
      if (present(nx, nz, y) && !d[nx][nz]) { d[nx][nz] = d[x][z] + 1; q.push([nx, nz]); }
    }
  }
  return d;
};
const DIST = Array.from({ length: 40 }, (_, y) => distAt(y));

// the entrance: the longest run of street-side cells (north edge, low ground, tall enough) gets a double door in its middle
const runs = [];
for (let z = 0; z < D; z++) {
  let run = [];
  for (let x = 0; x <= W; x++) {
    const ok = x < W && inside(x, z) && !inside(x, z - 1) && G[x][z] <= 5 && R[x][z] >= 16;
    if (ok) run.push([x, z]); else { if (run.length >= 2) runs.push(run); run = []; }
  }
}
runs.sort((a, b) => b.length - a.length);
const door = runs.length ? runs[0] : null;
const doorPair = door ? [door[(door.length >> 1) - 1], door[door.length >> 1]] : [];
const hingeOf = new Map(doorPair.map(([x, z], i) => [`${x},${z}`, i === 0 ? "left" : "right"]));
const entrance = (x, z) => hingeOf.has(`${x},${z}`);

// the building's own storey base for a cell at height y: its ground or the floor line below
const baseOf = (x, z, y) => {
  let base = G[x][z];
  for (const f of FLOORS) if (f > G[x][z] && f <= y && f < R[x][z] - 2) base = f;
  return base;
};

const g = new Voxels([W, TOP, D]);
const glowAt = [];                   // [x, y, z] of an air-gap cell behind a lit window, placed after the walls
const WINDOW_GLASS = "light_blue_stained_glass", MULLION = "light_gray_concrete", RENDER = "smooth_quartz";

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const gr = G[x][z], top = R[x][z];
  for (let y = 0; y < top; y++) {
    const d = DIST[y][x][z];
    const dirs = d === 1 ? exposedDirs(x, z, y) : [];
    if (y < gr) { g.set(x, y, z, d === 1 ? "polished_basalt" : "stone"); continue; }
    if (y === gr && entrance(x, z)) {
      g.set(x, y, z, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
      continue;
    }
    if (y === gr) { g.set(x, y, z, d === 1 ? "polished_basalt" : "smooth_stone"); continue; }
    if (y === top - 1) { g.set(x, y, z, d === 1 ? RENDER : "gray_concrete"); continue; }
    if (y === top - 2) { g.set(x, y, z, d === 1 ? MULLION : "stone"); continue; }
    if (FLOORS.includes(y)) { g.set(x, y, z, d === 1 ? MULLION : "smooth_stone"); continue; }
    if (d >= 3) { g.set(x, y, z, "stone"); continue; }
    if (d === 2) continue;                       // the air gap behind the glass
    if (d !== 1) continue;

    // facade rows of a storey: window rows k = 1, 2 with a pier every 4 blocks along the face, k = 3 the render head
    const base = baseOf(x, z, y), k = y - base;
    const corner = dirs.some(v => v === "N" || v === "S") && dirs.some(v => v === "E" || v === "W");
    const t = dirs[0] === "N" || dirs[0] === "S" ? x : z;
    const pier = corner || t % 4 === 0;
    const ground = base === gr && gr < 8;

    if (entrance(x, z) && dirs.includes("N") && (y === gr + 1 || y === gr + 2)) {
      const hinge = hingeOf.get(`${x},${z}`);
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr + 1 ? "lower" : "upper", hinge, open: "false", powered: "false" });
      continue;
    }
    // a face only one or two blocks long (a stair step of the outline) reads as solid wall, not as scattered glass
    if (!corner && alongRun(x, z, y, dirs[0]) < 3) { g.set(x, y, z, k === 1 && !ground ? MULLION : RENDER); continue; }
    if (ground) { g.set(x, y, z, pier ? MULLION : WINDOW_GLASS); continue; }
    if (k === 3) { g.set(x, y, z, RENDER); continue; }
    g.set(x, y, z, pier ? MULLION : WINDOW_GLASS);
    if (!pier && k === 1 && (x * 7 + z * 13 + y * 5) % 6 === 0) {
      const [dx, dz] = DIRS[dirs[0]];
      glowAt.push([x - dx, y, z - dz]);       // inward cell behind this pane
    }
  }
}

// the entrance's lantern inside the lobby, standing on the floor slab behind the door
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (entrance(x, z)) {
  g.set(x, G[x][z] + 1, z + 1, "lantern", { hanging: "false", waterlogged: "false" });
}
for (const [x, y, z] of glowAt) if (inside(x, z) && DIST[y][x][z] === 2) g.set(x, y, z, "glowstone");

// the lift overrun and its plant room on the south wing's roof: a concrete base, a glass band, a cap
for (let x = 7; x <= 13; x++) for (let z = 36; z <= 41; z++) if (inside(x, z) && R[x][z] === 26) {
  const ring = x === 7 || x === 13 || z === 36 || z === 41;
  g.set(x, 26, z, MULLION);
  if (ring) g.set(x, 27, z, WINDOW_GLASS);
  g.set(x, 28, z, RENDER);
}

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_925448696.nbt");
console.log(`way_925448696: ${blocks} blocks, palette ${palette}, roof ${Math.min(...R.flat())}..${Math.max(...R.flat())}, entrance ${doorPair.length ? doorPair.map(c => `(${c})`).join(" ") : "none"}`);
