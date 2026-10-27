// Way 269465504, Auckland: a 1960s concrete-frame office block on a basalt-look plinth, four storeys on the main roof with
// a stepped core and three on the wings, a flat roof with plant boxes. Lidar roofs are median-smoothed into three flat
// tiers (14 wings, 16 main, 18 core). Storey lines sit on absolute heights (4, 8, 12, 16), so the downhill side shows its
// extra storeys above a stone foundation that is solid down to each cell's ground. The facade: a white concrete band at
// each floor line, blue glass ribbons with white piers every third block, light grey spandrels, quoins at the corners,
// a glass lobby with a door and canopy on the north face, lanterns just behind some windows. A 6-block column grid
// carries the floor slabs inside; the air between is the interior.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465504.cells.json", "utf8"));
const W = 83, D = 67, Y = 30;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, gr, r] of cells) { G[x][z] = gr; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const FACES = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const exposed = (x, z) => FACES.filter(([dx, dz]) => !inside(x + dx, z + dz));

// depth: 1 on the outside ring, deeper inwards (BFS through the footprint)
const depth = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && exposed(x, z).length) { depth[x][z] = 1; queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !depth[nx][nz]) { depth[nx][nz] = depth[x][z] + 1; queue.push([nx, nz]); }
  }
}

// roof tiers: the 3x3 median of the lidar roof, snapped to three flat levels
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const m = median(x, z);
  T[x][z] = m >= 17 ? 18 : m >= 15 ? 16 : 14;
}

const FLOORS = [4, 8, 12, 16];                          // storey lines (absolute y): a band row at each
const FRAME = "white_concrete", SPANDREL = "light_gray_concrete", GLASS = "light_blue_stained_glass";
const BASE = "stone_bricks", SLAB = "light_gray_concrete", COLUMN = "light_gray_concrete";
const DECK = "gray_concrete", CAP = "smooth_stone", PLANT = "light_gray_concrete";
const LANTERN = { hanging: "false", waterlogged: "false" };
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const isColumn = (x, z) => x % 6 === 3 && z % 6 === 3;
const storeyLine = (y) => { let f = null; for (const v of FLOORS) if (y >= v) f = v; return f; };

const g = new Voxels([W, Y, D]);

// the lobby: the north-face ring cell (ground at most 6) nearest the middle of the face
const northRing = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++)
  if (inside(x, z) && depth[x][z] === 1 && !inside(x, z - 1) && G[x][z] <= 6) northRing.push([x, z]);
northRing.sort((a, b) => a[0] - b[0]);
const [xd, zE] = northRing.length ? northRing[northRing.length >> 1] : [-99, -99];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], t = T[x][z];
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);      // foundation: solid from y 0 up to the cell's ground
  if (depth[x][z] === 1) {
    const faces = exposed(x, z), corner = faces.length > 1;
    const u = faces[0][1] !== 0 ? x : z;                    // position along the face: piers every third block
    for (let y = gr; y < t; y++) {
      const f = storeyLine(y), rel = f === null ? -1 : y - f;
      let b;
      if (f === null) b = BASE;                             // plinth course under the first storey line
      else if (rel === 0) b = FRAME;
      else if (rel === 3) b = SPANDREL;
      else b = corner || u % 3 === 0 ? FRAME : GLASS;
      g.set(x, y, z, b);
    }
    g.set(x, t, z, FRAME);                                   // parapet and cap
    g.set(x, t + 1, z, CAP);
  } else {
    for (const f of FLOORS) if (f >= gr && f < t) g.set(x, f, z, SLAB);   // a slab per storey on the column grid
    g.set(x, t, z, DECK);                                    // flat roof
    if (isColumn(x, z)) for (let y = gr; y < t; y++) g.set(x, y, z, COLUMN);
    const plantCell = depth[x][z] >= 4 && t >= 16 && x % 12 >= 4 && x % 12 <= 7 && z % 12 >= 4 && z % 12 <= 7;
    if (plantCell) for (let y = t + 1; y <= t + 2; y++) g.set(x, y, z, PLANT);
  }
}

// warm lanterns just inside some glass panes: a lantern stands on the storey slab below its window
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || depth[x][z] !== 1) continue;
  const faces = exposed(x, z);
  if (faces.length !== 1) continue;
  const [dx, dz] = faces[0], gr = G[x][z], t = T[x][z];
  const u = dx !== 0 ? z : x, ix = x - dx, iz = z - dz;
  if (depth[ix]?.[iz] !== 2 || isColumn(ix, iz)) continue;
  for (const f of FLOORS) {
    const y = f + 1;
    if (y < gr || y >= t || u % 3 === 0) continue;
    if ((x * 31 + z * 17 + f) % 5 === 0) g.set(ix, y, iz, "lantern", LANTERN);
  }
}

// the lobby: glass between white piers under a canopy, with the door in the middle
if (northRing.length) {
  const gr = G[xd][zE];
  for (let x = xd - 3; x <= xd + 3; x++) {
    if (!inside(x, zE)) continue;
    const dxl = x - xd;
    if (Math.abs(dxl) === 2) for (let y = gr; y <= gr + 2; y++) g.set(x, y, zE, FRAME);
    else if (dxl !== 0) for (let y = gr; y <= gr + 2; y++) g.set(x, y, zE, GLASS);
    else { g.set(x, gr + 2, zE, FRAME); }                    // lintel over the door
    if (inside(x, zE + 1)) g.set(x, gr + 3, zE + 1, SPANDREL);
    g.set(x, gr + 3, zE, SPANDREL);                          // canopy across the bay, on the piers
  }
  g.set(xd, gr, zE, "iron_door", doorState("lower"));
  g.set(xd, gr + 1, zE, "iron_door", doorState("upper"));
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465504.nbt";
const info = g.save(out);
console.log(`way_269465504: ${info.blocks} blocks, ${info.palette} palette entries -> ${out}`);
