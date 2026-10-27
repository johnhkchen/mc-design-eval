// Way 260089810, Mt Eden / Newton, Auckland: a 1980s concrete-frame office block on a basalt plinth, six storeys over a
// body, with a seven-storey crown set in from the edge and lower wings. The lidar roof is median-smoothed (5x5) and
// snapped to storey-grid tiers (4-block storeys from a base at y 4): 20 for the low wings and a lightwell, 24, 28 for the
// body (parapet to 30), and 32 for the crown where it sits 3 or more blocks in from the edge. The plinth fills y 0..3 under
// every cell, so the downhill side shows its extra course. Facade per storey: a light-grey spandrel, two rows of tinted glass
// between white concrete piers, and a quartz head band; the ground storey is glass between piers, with an oak door in the
// middle of the north face, and the base course is basalt. Interiors are air with a floor slab per storey; glowstone sits
// behind some windows. Plant boxes on the body roof, a sea lantern on a short mast over the crown.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260089810.cells.json", "utf8"));
const W = 50, D = 74, H = 44, BASE = 4, PLINTH = 4;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(null), R = grid(0);                                   // ground per cell (null = not footprint), lidar roof
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] !== null;

// lidar roof: 5x5 median over the footprint (kills the noise at corners and the roof-edge spikes)
const S = grid(0);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); S[x][z] = v[v.length >> 1];
}

// depth in from the outline (0 = edge ring), for the crown's setback
const INS = grid(-1), queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1)) { INS[x][z] = 0; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [nx, nz] of [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]) if (inside(nx, nz) && INS[nx][nz] < 0) { INS[nx][nz] = INS[x][z] + 1; queue.push([nx, nz]); }
}

// roof tiers, on the storey grid: 20, 24, 28, and the crown at 32 (three blocks in from the edge)
const T = grid(0);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const s = S[x][z];
  T[x][z] = s < 22 ? 20 : s < 27 ? 24 : s < 30 ? 28 : INS[x][z] >= 3 ? 32 : 28;
}

const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const edgeOut = (x, z) => DIRS.some(([, dx, dz]) => !inside(x + dx, z + dz));
// faces of a cell at height y that are open to the air: the outside, or a lower neighbouring tier's roof
const faces = (x, z, y) => {
  const out = [];
  for (const [n, dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz, o = !inside(nx, nz);
    if (o || y >= T[nx][nz]) out.push({ n, dx, dz, o });
  }
  return out;
};
const outFirst = (f) => f.find((e) => e.o) ?? f[0];

// the entrance: the north face cell nearest the middle of that face
const northFace = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1)) northFace.push([x, z]);
northFace.sort((a, b) => a[0] - b[0]);
const [doorX, doorZ] = northFace[northFace.length >> 1];

// the crown's deepest cell carries the mast
let crown = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && T[x][z] === 32 && (!crown || INS[x][z] > INS[crown[0]][crown[1]])) crown = [x, z];

// what a cell holds at height y: [block, state] or null (air)
const spec = (x, y, z) => {
  const t = T[x][z];
  if (y >= t) return y <= t + 1 && edgeOut(x, z) ? (y === t ? ["smooth_quartz"] : ["white_concrete"]) : null;   // parapet
  if (y < PLINTH) return ["stone_bricks"];                                                                       // basalt plinth
  const f = faces(x, z, y), shell = f.length > 0;
  if (y === t - 1) return [shell ? "white_concrete" : "light_gray_concrete"];                                     // cornice / roof slab
  if (y === BASE) return ["stone_bricks"];                                                                       // base course
  const off = (y - BASE) % 4;
  if (off === 0) return ["light_gray_concrete"];                                                                 // storey line: spandrel / floor slab
  if (!shell) return null;                                                                                       // interior air
  if (off === 3) return ["smooth_quartz"];                                                                       // head band
  if (x === doorX && z === doorZ && y <= BASE + 2) {                                                             // door, y 5 and 6
    const half = y === BASE + 1 ? "lower" : "upper";
    return ["oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" }];
  }
  const e = outFirst(f), bay = e.dx === 0 ? x : z;
  return bay % 3 === 0 ? ["white_concrete"] : ["light_blue_stained_glass"];                                     // pier or glass
};

const g = new Voxels([W, H, D]);
const glow = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  for (let y = 0; y <= T[x][z] + 1; y++) {
    const sp = spec(x, y, z);
    if (!sp) continue;
    g.set(x, y, z, sp[0], sp[1]);
    // glowstone behind some windows: the interior cell opposite the glass, if it is air
    if (sp[0] === "light_blue_stained_glass" && (x * 31 + z * 17 + y * 7) % 6 === 0) {
      const e = outFirst(faces(x, z, y));
      glow.push([x - e.dx, y, z - e.dz]);
    }
  }
}
for (const [x, y, z] of glow) if (inside(x, z) && spec(x, y, z) === null) g.set(x, y, z, "glowstone");

// roof plant: 2x2 boxes of plant on the body roof, set in from the edge
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && T[x][z] === 28 && INS[x][z] >= 2 && x % 8 >= 3 && x % 8 <= 4 && z % 8 >= 3 && z % 8 <= 4) {
  g.set(x, 28, z, "gray_concrete"); g.set(x, 29, z, "gray_concrete");
}

// the crown's mast: iron bars and a sea lantern for the dusk
if (crown) {
  const [cx, cz] = crown;
  for (let y = 32; y <= 34; y++) g.set(cx, y, cz, "iron_bars");
  g.set(cx, 35, cz, "sea_lantern");
}

const summary = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260089810.nbt");
console.log(JSON.stringify({ tiers: [20, 24, 28, 32].map((t) => [t, cells.filter(([x, z]) => T[x][z] === t).length]), glow: glow.length, ...summary }));
