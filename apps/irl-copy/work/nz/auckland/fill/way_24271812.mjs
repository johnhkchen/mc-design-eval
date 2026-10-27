// WZ Building: a 1980s concrete-frame office tower, 13 storeys of 4 blocks on a stone lobby plinth, with a four-storey
// wing to the south-east. The lidar roof is smoothed by a 7x7 median and rounded to whole storeys; the outer two rings
// of the tower are set in by two storeys (a crown), so every storey stands on the one below. Facade: blue glass in a
// mullion grid of 3, grey spandrels, a light cap on the parapet, a dark-oak entrance with a hanging lantern, and warm
// glowstone just inside some windows. Interiors are air behind the glass, with a floor slab per storey.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24271812";
const cells = JSON.parse(readFileSync(`${FILE}.cells.json`, "utf8"));
const W = 69, D = 70, F0 = 8, STOREY = 4;                       // ground floor slab at y 8; storeys every 4 blocks

// footprint, lidar ground and roof per cell
const ground = Array.from({ length: W }, () => Array(D).fill(-1));
const roof = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, g, r] of cells) { ground[x][z] = g; roof[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && roof[x][z] >= 0;

// smoothed roof (median of the footprint within 3 cells, to lose the lidar's noise), then whole storeys
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const N = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z] of cells) {
  const v = [];
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (inside(x + dx, z + dz)) v.push(roof[x + dx][z + dz]);
  N[x][z] = Math.max(0, Math.round((median(v) - F0) / STOREY));
}

// edge distance: 0 on the outline, +1 per ring inward
const edge = Array.from({ length: W }, () => Array(D).fill(-1));
let frontier = [];
for (const [x, z] of cells) if (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1)) { edge[x][z] = 0; frontier.push([x, z]); }
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (let d = 0; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of DIRS) {
    const a = x + dx, b = z + dz;
    if (inside(a, b) && edge[a][b] < 0) { edge[a][b] = d + 1; next.push([a, b]); }
  }
  frontier = next;
}

// the crown: the outer two rings of the tower are set in by two storeys
const maxN = Math.max(...cells.map(([x, z]) => N[x][z]));
for (const [x, z] of cells) if (edge[x][z] <= 1 && N[x][z] >= 12) N[x][z] -= 2;

// the outward faces of a cell at storey k: neighbours outside the footprint, or with no storey k (the setbacks)
const outward = (x, z, k) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || N[x + dx][z + dz] <= k);
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// the entrance: on a south face of the lobby, the cell nearest x = 40 (else any lobby face)
const lobbyFaces = cells.filter(([x, z]) => N[x][z] >= 2 && outward(x, z, 0).length === 1);
const southDoors = lobbyFaces.filter(([x, z]) => outward(x, z, 0)[0].join() === "0,1");
const pool = southDoors.length ? southDoors : lobbyFaces;
const [ex, ez] = pool.reduce((best, c) => (Math.abs(c[0] - 40) < Math.abs(best[0] - 40) ? c : best), pool[0]);
const doorDir = outward(ex, ez, 0)[0];
const doorKey = `${ex},${ez}`;

// a rooftop plant room: the 5 x 5 block at the tower's centre that stands on the tallest storey, all its cells inside
const towerCells = cells.filter(([x, z]) => N[x][z] === maxN);
const cxAvg = towerCells.reduce((s, [x]) => s + x, 0) / towerCells.length, czAvg = towerCells.reduce((s, [, z]) => s + z, 0) / towerCells.length;
let plant = null;
for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) {
  let ok = true;
  for (let a = -2; a <= 2 && ok; a++) for (let b = -2; b <= 2 && ok; b++) ok = inside(x + a, z + b) && N[x + a][z + b] === maxN;
  if (ok && (!plant || Math.hypot(x - cxAvg, z - czAvg) < Math.hypot(plant[0] - cxAvg, plant[1] - czAvg))) plant = [x, z];
}

const g = new Voxels([69, 73, 70]);
const GLASS = "light_blue_stained_glass", FRAME = "white_concrete", SPAN = "gray_concrete", CAP = "light_gray_concrete";
const GLOW = "glowstone";

// base: foundation down to each cell's ground, then a stone plinth with a smooth base course up to the ground floor's slab
for (const [x, z, gr] of cells) {
  for (let y = 0; y < F0; y++) g.set(x, y, z, y < gr ? "stone" : (y === F0 - 1 ? "smooth_stone" : "stone_bricks"));
}

for (const [x, z] of cells) {
  const n = N[x][z];
  // floor slabs, one per storey, and the roof slab on top (a cell with no storeys is a plinth cap)
  for (let k = 0; k <= n; k++) g.set(x, F0 + STOREY * k, z, FRAME);
  for (let k = 0; k < n; k++) {
    const y0 = F0 + STOREY * k;
    const out = outward(x, z, k);
    if (out.length === 0) continue;                                     // interior: air behind the glass
    // a cell open on two faces (a corner, or a step of the diagonal wing) takes the window grid of its first face,
    // so the diagonal reads as glazing, not as a column per cell
    if (`${x},${z}` === doorKey && k === 0) continue;                  // the entrance is set below
    const [dx, dz] = out[0];
    const along = dz !== 0 ? x : z;                                     // the coordinate that runs along this face
    if (along % 3 === 0) {                                              // a mullion
      for (let y = y0 + 1; y <= y0 + 3; y++) g.set(x, y, z, FRAME);
      continue;
    }
    g.set(x, y0 + 1, z, GLASS); g.set(x, y0 + 2, z, GLASS);             // a pane of glass, with a grey spandrel under the next floor
    g.set(x, y0 + 3, z, SPAN);
    // warm light just inside some windows, standing on the floor
    const ix = x - dx, iz = z - dz;
    if (((along * 7 + k * 5 + x + z) % 9 === 0) && inside(ix, iz) && edge[ix][iz] >= 1 && N[ix][iz] > k) {
      g.set(ix, y0 + 1, iz, GLOW);
    }
  }
  // the parapet: a light cap on the outline, one block above the roof slab
  if (edge[x][z] === 0 && n >= 2) g.set(x, F0 + STOREY * n + 1, z, CAP);
}

// the entrance: a dark oak door on the lobby face, glass above it, and a lantern hanging from the storey line
const [dxE, dzE] = doorDir;
const facing = FACING[`${dxE},${dzE}`];
g.set(ex, F0, ez, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ex, F0 + 1, ez, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(ex, F0 + 2, ez, GLASS);
g.set(ex, F0 + 3, ez, "lantern", { hanging: "true" });

// the plant room: light walls with a band of glass, a solid cap, on the roof slab of the tallest storey
if (plant) {
  const [px, pz] = plant;
  const top = F0 + STOREY * maxN;
  for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
    const x = px + a, z = pz + b, edgeCell = Math.abs(a) === 2 || Math.abs(b) === 2;
    if (edgeCell) {
      g.set(x, top + 1, z, CAP);
      g.set(x, top + 2, z, Math.abs(a) === 2 && Math.abs(b) === 2 ? CAP : GLASS);
      g.set(x, top + 3, z, CAP);
    }
    g.set(x, top + 4, z, CAP);
  }
}

const info = g.save(`${FILE}.nbt`);
console.log(JSON.stringify({ cells: cells.length, maxStoreys: maxN, topY: F0 + STOREY * maxN + 4, door: [ex, ez], plant, ...info }));
