// DC71056: Government Printing Office, 700 North Capitol St NW, as a 1.21.1 module. Read as its 1903 Industrial-Light
// self: a brick shell on a stone plinth, sandstone string courses and cornice, steel-sash windows in brick piers, a
// bronze-doored entrance on the North Capitol (west) front, and setback tiers from the lidar roof. Lidar roof heights
// are snapped to tiers of 4, 10, 13, 17, 20 and 22 blocks (a 3x3 majority smooths single-cell noise). Storeys are 3
// blocks: a sandstone string course and two rows of window. Edge cells (the outer ring, and any cell standing above a
// lower neighbour) are solid facade from y 0 to their roof; the interior is hollow with a floor slab per storey, so
// the windows have an air gap behind them and nothing stands on air below the ring.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC71056.cells.json`, "utf8"));
const W = 71, D = 50, Y = 30;
const TIERS = [4, 10, 13, 17, 20, 22];

const G = Array.from({ length: W }, () => Array(D).fill(null));
const R = Array.from({ length: W }, () => Array(D).fill(null));
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] !== null;

// Lidar roof -> nearest tier (ties go up). Then two passes where each cell takes the majority tier of its 3x3,
// keeping its own on a tie: single-cell noise and one-cell ledges drop out, leaving clean flat tiers.
const snap = (r) => TIERS.reduce((best, t) => (Math.abs(t - r) <= Math.abs(best - r) ? t : best));
const majority = (T) => T.map((col, x) => col.map((t, z) => {
  if (t === null) return null;
  const votes = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!inFp(x + dx, z + dz)) continue;
    const v = T[x + dx][z + dz]; votes.set(v, (votes.get(v) ?? 0) + 1);
  }
  let best = t, n = -1;
  for (const [v, c] of votes) if (c > n || (c === n && v === t)) { best = v; n = c; }
  return best;
}));
const H = majority(majority(majority(G.map((col, x) => col.map((g, z) => (g === null ? null : snap(R[x][z])))))));

// The sides a cell faces air on: outside the footprint, or onto a lower neighbouring tier.
const SIDES = [["E", 1, 0], ["W", -1, 0], ["S", 0, 1], ["N", 0, -1]];
const EX = G.map((col, x) => col.map((g, z) => {
  if (g === null) return null;
  return SIDES.filter(([, dx, dz]) => !inFp(x + dx, z + dz) || H[x + dx][z + dz] < H[x][z]).map(([s]) => s);
}));
const ring = (x, z) => EX[x][z].length > 0;

// Palette
const PLINTH = "stone_bricks";        // foundation, base course, quoins, jambs
const BRICK = "bricks";               // walls and piers
const BAND = "smooth_sandstone";      // string courses and cornice (cream stone)
const SLAB = "stone";                 // interior floor slabs and the roof membrane
const GLASS = "glass_pane";           // steel sash
const LAMP = "glowstone";             // lit offices behind some windows
const DOOR = "iron_door";             // bronze doors

const V = new Voxels([W, Y, D]);

// The facade of an edge cell at height y: plinth, band, quoin, window (steel sash in a 4-bay rhythm) or brick pier.
// Windows set a glowstone in the room behind them now and then.
function facade(x, y, z, e) {
  const g = G[x][z], off = (y - g) % 3;
  const onX = e.includes("E") || e.includes("W");     // a face that runs along z
  const onZ = e.includes("N") || e.includes("S");     // a face that runs along x
  if (y === g) return V.set(x, y, z, PLINTH);
  if (off === 0) return V.set(x, y, z, BAND);
  if (onX && onZ) return V.set(x, y, z, PLINTH);
  const bay = onX ? z : x;
  if (off === 1 || off === 2) {
    if (bay % 4 === 1 || bay % 4 === 2) {
      const pane = onX
        ? { north: "true", south: "true", east: "false", west: "false" }
        : { east: "true", west: "true", north: "false", south: "false" };
      V.set(x, y, z, GLASS, pane);
      const [dx, dz] = onX ? (e.includes("E") ? [-1, 0] : [1, 0]) : (e.includes("S") ? [0, -1] : [0, 1]);
      const ix = x + dx, iz = z + dz;
      if (off === 1 && inFp(ix, iz) && !ring(ix, iz) && (bay + y + 2 * x + z) % 7 === 0) V.set(ix, y, iz, LAMP);
      return;
    }
  }
  return V.set(x, y, z, BRICK);
}

const cellsIn = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inFp(x, z)) cellsIn.push([x, z]);

for (const [x, z] of cellsIn) {
  const g = G[x][z], h = H[x][z], e = EX[x][z], edge = e.length > 0;
  for (let y = 0; y < g; y++) V.set(x, y, z, PLINTH);                    // foundation under the lower ground
  for (let y = g; y < h; y++) {
    if (y === h - 1) { V.set(x, y, z, edge ? BAND : SLAB); continue; }   // roof, cornice on the edge
    if (edge) { facade(x, y, z, e); continue; }
    if ((y - g) % 3 === 0) V.set(x, y, z, SLAB);                         // floor slab per storey
    else if (x % 6 === 3 && z % 6 === 3) V.set(x, y, z, PLINTH);         // structural column in the hollow
  }
}

// Main entrance: the middle of the North Capitol face of the 17-block block, two bronze door leaves in a stone
// surround, a hanging lantern in the hall behind (hung from the storey slab above, so it stands on something).
const mainWest = cellsIn.filter(([x, z]) => EX[x][z].includes("W") && H[x][z] === 17);
const zs = mainWest.map(([, z]) => z).sort((a, b) => a - b);
const zMid = zs[zs.length >> 1];
const [xd, zd] = mainWest.reduce((best, c) => (Math.abs(c[1] - zMid) < Math.abs(best[1] - zMid) ? c : best));
const gd = G[xd][zd];
for (const dz of [-1, 1]) for (const y of [gd + 1, gd + 2]) V.set(xd, y, zd + dz, PLINTH);
const door = { facing: "east", hinge: "left", open: "false", powered: "false" };
V.set(xd, gd + 1, zd, DOOR, { ...door, half: "lower" });
V.set(xd, gd + 2, zd, DOOR, { ...door, half: "upper" });
V.set(xd + 1, gd + 2, zd, "lantern", { hanging: "true", waterlogged: "false" });

// Roof: two brick stacks and small HVAC boxes on the 17 roof, a penthouse on the 22 tower if a 3x3 of it is clear.
const roof17 = cellsIn.filter(([x, z]) => !ring(x, z) && H[x][z] === 17);
for (const [x, z] of roof17) {
  if (x % 9 === 4 && z % 9 === 4) {
    for (let y = 17; y <= 20; y++) V.set(x, y, z, BRICK);
    V.set(x, 21, z, BAND);
  }
}
const tower = cellsIn.filter(([x, z]) => H[x][z] === 22);
const towerKey = new Set(tower.map(([x, z]) => `${x},${z}`));
const pent = tower.find(([x, z]) => {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (!towerKey.has(`${x + dx},${z + dz}`) || ring(x + dx, z + dz)) return false;
  return true;
});
if (pent) {
  const [px, pz] = pent;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    for (const y of [22, 23]) {
      const edge = Math.abs(dx) === 1 || Math.abs(dz) === 1;
      if (edge) V.set(px + dx, y, pz + dz, BRICK);
    }
    V.set(px + dx, 24, pz + dz, BAND);
  }
  V.set(px, 23, pz - 1, GLASS, { north: "false", south: "false", east: "true", west: "true" });
}

const stats = V.save(`${DIR}/DC71056.nbt`);
const tierCount = {};
for (const [x, z] of cellsIn) tierCount[H[x][z]] = (tierCount[H[x][z]] ?? 0) + 1;
console.log(JSON.stringify({ ...stats, tiers: tierCount, door: [xd, gd + 1, zd], penthouse: pent ?? null }));
