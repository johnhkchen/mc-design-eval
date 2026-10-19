// 7 West 51st Street, 1941 commercial and office building: a 14 x 27 block lot of limestone-coloured piers and
// spandrels, glass in the window bays, a granite base and shopfront, and a double-door entrance on the south front.
// Massing: the lidar roof snapped to clean tiers (9 / 18 / 24 / 30 / 39 / 45 / 47), holes filled from their
// neighbours, one majority pass to clear speckle, and a 3-block mechanical penthouse on the tower. Each storey is
// three blocks: a spandrel row (solid), then two window rows. Piers every third block on each face. The skin is one
// block thick, glass flush with the piers, with a one-block air gap behind the glass; behind that is a solid core
// with a floor course per storey (no rooms). Every solid block has a solid block under it, so each storey, setback
// and roof stands on the one below. Warm glowstone sits in the core behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034514.cells.json`, "utf8"));
const X = 14, Y = 59, Z = 27;

const N4 = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const foot = Array.from({ length: Z }, () => Array(X).fill(false));
const lidar = Array.from({ length: Z }, () => Array(X).fill(0));
for (const [x, z, , roof] of cells) { foot[z][x] = true; lidar[z][x] = roof; }
const inFoot = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && foot[z][x];

// Holes in the lidar (roof 0 inside the lot) take the median of their built neighbours.
const filled = lidar.map((r) => r.slice());
for (const [x, z, , roof] of cells) if (!roof) {
  const n = N4.filter(([dx, dz]) => inFoot(x + dx, z + dz) && lidar[z + dz][x + dx] > 0)
    .map(([dx, dz]) => lidar[z + dz][x + dx]).sort((a, b) => a - b);
  filled[z][x] = n.length ? n[n.length >> 1] : 0;
}

// Clean tiers: each roof's block height, snapped to a storey-multiple tier.
const tier = (L) => (L <= 10 ? 9 : L <= 18 ? 18 : L <= 26 ? 24 : L <= 34 ? 30 : L <= 41 ? 39 : L <= 46 ? 45 : 47);
let top = Array.from({ length: Z }, (_, z) => Array.from({ length: X }, (_, x) => (inFoot(x, z) ? tier(filled[z][x]) : 0)));
// One majority pass: a cell that differs from at least three of its five (itself and four neighbours) takes the majority.
top = top.map((r, z) => r.map((t, x) => {
  if (!inFoot(x, z)) return 0;
  const vals = [t, ...N4.filter(([dx, dz]) => inFoot(x + dx, z + dz)).map(([dx, dz]) => top[z + dz][x + dx])];
  const count = new Map(); for (const v of vals) count.set(v, (count.get(v) || 0) + 1);
  const [mode, n] = [...count].sort((a, b) => b[1] - a[1])[0];
  return n >= 3 ? mode : t;
}));
// Mechanical penthouse on the tower: three blocks more over its 3 x 3 middle.
for (let z = 7; z <= 9; z++) for (let x = 10; x <= 12; x++) if (top[z][x] === 47) top[z][x] = 50;

const built = (x, y, z) => inFoot(x, z) && y < top[z][x];
// depth[y][z][x]: 1 = touches open air (the skin), 2 = one block in, 3+ = core; 0 = not built at that height.
const depth = [];
for (let y = 0; y < Y; y++) {
  const d = Array.from({ length: Z }, () => Array(X).fill(0));
  const q = [];
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    if (built(x, y, z) && N4.some(([dx, dz]) => !built(x + dx, y, z + dz))) { d[z][x] = 1; q.push([x, z]); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i];
    for (const [dx, dz] of N4) {
      const nx = x + dx, nz = z + dz;
      if (built(nx, y, nz) && !d[nz][nx]) { d[nz][nx] = d[z][x] + 1; q.push([nx, nz]); }
    }
  }
  depth.push(d);
}
const D = (x, y, z) => (built(x, y, z) ? depth[y][z][x] : 0);

// The open direction(s) of a skin cell: one for a face, two at a corner. A depth-2 cell faces its depth-1 neighbour.
const outOf = (x, y, z) => {
  if (D(x, y, z) === 1) return N4.filter(([dx, dz]) => !built(x + dx, y, z + dz));
  const n = N4.find(([dx, dz]) => D(x + dx, y, z + dz) === 1);
  return n ? [n] : [];
};
// Piers sit on every third block of each face (x on the north and south fronts, z on the east and west), and at corners.
const isPier = (x, z, out) => out.length !== 1 || (out[0][1] !== 0 ? x : z) % 3 === 0;
const storeyRow = (y) => y % 3 === 0;   // spandrel / floor line

const S = (block, state) => ({ block, state });
const M = { granite: "polished_granite", limestone: "smooth_quartz", roof: "gray_concrete", core: "stone",
  floor: "smooth_stone", glass: "light_blue_stained_glass_pane", lamp: "glowstone" };
const paneState = (dz) => (dz !== 0
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// Warm light: a core block one in behind a glass pane, on one in five panes (a deterministic pick).
const glowBehind = (x, y, z) => N4.some(([dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  if (D(nx, y, nz) !== 2) return false;
  const o = outOf(nx, y, nz)[0];
  return o && o[0] === -dx && o[1] === -dz && !storeyRow(y) && (nx * 7 + nz * 13 + y * 5) % 5 === 0;
});

// The entrance on the south front (z 26), with a lobby behind it (z 25, x 4-7, open to the sky above the doors).
// Doors at x 5-6, sidelights at x 4 and 7 are ordinary window bays; lanterns stand in the lobby. undefined = no override.
const entrance = (x, y, z) => {
  if (z === 26 && (x === 5 || x === 6) && (y === 1 || y === 2)) {
    return S("dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: x === 5 ? "left" : "right", open: "false", powered: "false" });
  }
  if (z === 25 && (x === 5 || x === 6) && y === 1) return S("lantern", { hanging: "false", waterlogged: "false" });
  if (z === 25 && x >= 4 && x <= 7 && y >= 1) return null;
  return undefined;
};

function blockAt(x, y, z) {
  if (!built(x, y, z)) return null;
  const e = entrance(x, y, z); if (e !== undefined) return e;
  const t = top[z][x], d = D(x, y, z);
  if (y === 0) return S(d <= 2 ? M.granite : M.floor);               // base course and floor
  if (d >= 3) {                                                       // core: a floor course per storey, glowstone behind some glass
    if (y === t - 1) return S(M.roof);
    if (y % 3 === 1 && glowBehind(x, y, z)) return S(M.lamp);
    return S(storeyRow(y) ? M.floor : M.core);
  }
  const out = outOf(x, y, z), pier = isPier(x, z, out);
  if (d === 2) return pier ? S(y < 3 ? M.granite : M.limestone) : null;   // the air gap behind the glass
  // The skin (depth 1): the parapet and cornice, spandrels, piers, and glass in the window bays.
  if (y === t - 1) return S(M.limestone);
  if (y === t - 2) return S(M.granite);
  if (storeyRow(y)) return S(y === 3 ? M.granite : M.limestone);
  if (pier) return S(y < 3 ? M.granite : M.limestone);
  return S(M.glass, paneState(out[0][1]));
}

// Stacking: no air may sit under a block in its column. Where a skin course rises over a gap (a setback edge), fill the
// gap so the course stands on something.
const B = Array.from({ length: Z }, (_, z) => Array.from({ length: X }, (_, x) => Array.from({ length: Y }, (_, y) => blockAt(x, y, z))));
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const col = B[z][x];
  let h = -1; for (let y = 0; y < Y; y++) if (col[y]) h = y;
  for (let y = 0; y < h; y++) if (!col[y]) col[y] = S(M.core);
}

const g = new Voxels([X, Y, Z]);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = 0; y < Y; y++) {
  const b = B[z][x][y];
  if (b) g.set(x, y, z, b.block, b.state);
}

// Nothing floats: every block above y 0 has a block under it.
let floating = 0;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = 1; y < Y; y++) {
  if (B[z][x][y] && !B[z][x][y - 1]) {
    if (floating < 8) console.log("floating?", x, y, z, B[z][x][y].block);
    floating++;
  }
}
const saved = g.save(`${DIR}/NYC1034514.nbt`);
console.log(`NYC1034514: ${saved.blocks} blocks, palette ${saved.palette}, floating ${floating}, tallest ${Math.max(...top.flat())}`);
