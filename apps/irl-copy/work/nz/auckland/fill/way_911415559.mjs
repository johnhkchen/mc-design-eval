// Shortland & Fort, Auckland CBD: a late-20th-century glass-and-concrete office tower on a stone podium.
// Footprint 58 x 63 blocks, roof about 137 blocks above the lowest ground (lidar). Storeys are 4 blocks: a floor slab,
// then 3 rows of wall (two glass rows and a head band). The shell is hollow, one slab per storey, so there are no interiors.
// The lidar roof is smoothed (3x3 median) and snapped to a short list of storey-aligned tiers, which gives the setbacks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_911415559";
const cells = JSON.parse(readFileSync(`${base}.cells.json`, "utf8"));

const W = 58, D = 63, H = 149;
const g = new Voxels([W, H, D]);

const k2 = (x, z) => x * 100 + z;
const ground = new Map(), roofRaw = new Map();
for (const [x, z, gr, r] of cells) { ground.set(k2(x, z), gr); roofRaw.set(k2(x, z), r); }
const inside = (x, z) => ground.has(k2(x, z));

// 3x3 median of the lidar roof: one noisy cell does not make a spike
const median = (a) => a.slice().sort((p, q) => p - q)[Math.floor(a.length / 2)];
const roofSmooth = new Map();
for (const [k, r] of roofRaw) {
  const x = Math.floor(k / 100), z = k % 100, vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) vals.push(roofRaw.get(k2(x + dx, z + dz)));
  roofSmooth.set(k, median(vals));
}

// flat tiers: each cell's roof slab snaps to a storey-aligned level from this list (multiples of 4)
const TIERS = [16, 28, 40, 56, 72, 88, 104, 120, 136];
const cols = new Map();   // key -> { F0, T }: F0 = first storey floor (plinth below), T = roof slab y
for (const [k, s] of roofSmooth) {
  const F0 = Math.ceil(ground.get(k) / 4) * 4;
  const want = s - 1;                                       // roof slab y; the top surface is one above
  const ok = TIERS.filter((t) => t >= F0 + 4);
  const T = ok.reduce((best, t) => (Math.abs(t - want) < Math.abs(best - want) ? t : best));
  cols.set(k, { F0, T });
}
const colAt = (x, z) => cols.get(k2(x, z));

const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
// the sides of a cell at height y that face air: outside the footprint, or above a lower neighbour's roof
const sides = (x, z, y) => DIRS.filter(([, dx, dz]) => { const n = colAt(x + dx, z + dz); return !n || y > n.T; }).map(([s]) => s);
const outEdge = (x, z) => DIRS.some(([, dx, dz]) => !colAt(x + dx, z + dz));
const hash = (x, y, z) => (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 7;

// facade material for a wall cell (row 1-2 are glass rows, row 3 is the head band, row 0 is the storey line)
function facade(x, z, s, r, ext, T) {
  const ns = ext.includes("N") || ext.includes("S"), ew = ext.includes("E") || ext.includes("W");
  // no quoins: on a stepped footprint every edge cell looks like a corner, so the face went solid grey
  if (r === 3) return s === 0 ? "light_gray_concrete" : T <= 56 ? "stone_bricks" : "white_concrete";
  if ((ns ? x : z) % 3 === 0) return "light_gray_concrete";                    // mullion every third cell
  return "light_blue_stained_glass";
}

// entrances on the north and south faces of the ground storey: a door in the middle of a face, a dark canopy over it
const doorCells = new Set(), doors = [];
for (const side of ["N", "S"]) {
  const cand = [];
  for (const [k, { F0 }] of cols) {
    const x = Math.floor(k / 100), z = k % 100;
    const ext = sides(x, z, F0 + 1);
    if (ext.includes(side) && ext.length === 1 && x % 3 !== 0) cand.push([x, z]);
  }
  if (!cand.length) continue;
  cand.sort((a, b) => a[0] - b[0]);
  const [x, z] = cand[Math.floor(cand.length / 2)];
  const F0 = colAt(x, z).F0, facing = side === "N" ? "north" : "south";
  doors.push({ x, z, F0, side, facing });
  doorCells.add(k2(x, z) + "@" + F0);
}

// top tier: the interior cells of the highest tier, where plant and the mast go
const TOP = 136;
const topInterior = (x, z) => [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => { const n = colAt(x + dx, z + dz); return n && n.T === TOP; }));
const topCells = [...cols].map(([k, c]) => [Math.floor(k / 100), k % 100, c]).filter(([, , c]) => c.T === TOP);
const cx0 = topCells.reduce((a, [x]) => a + x, 0) / topCells.length, cz0 = topCells.reduce((a, [, z]) => a + z, 0) / topCells.length;
const anchor = topCells.filter(([x, z]) => topInterior(x, z)).sort((a, b) => Math.hypot(a[0] - cx0, a[1] - cz0) - Math.hypot(b[0] - cx0, b[1] - cz0))[0];
const [mx, mz] = anchor;

const windows = [];   // glass cells on the facade, with their outward sides, for the warm lights behind them
for (const [k, { F0, T }] of cols) {
  const x = Math.floor(k / 100), z = k % 100;
  const n = (T - F0) / 4;
  // plinth: solid stone from the bottom up to the first storey (the foundation on the downhill side)
  for (let y = 0; y < F0; y++) g.set(x, y, z, "stone_bricks");
  for (let s = 0; s < n; s++) {
    const b = F0 + 4 * s;
    const ext0 = sides(x, z, b);
    // the storey slab: a storey line on the outside, a floor inside
    g.set(x, b, z, ext0.length ? (s === 0 ? "stone_bricks" : "light_gray_concrete") : "smooth_stone");
    for (let r = 1; r <= 3; r++) {
      const y = b + r, ext = sides(x, z, y);
      if (!ext.length) continue;                                             // inside: air
      const doorHere = doorCells.has(k2(x, z) + "@" + F0) && s === 0 && r <= 2 && doors.some((d) => d.x === x && d.z === z);
      if (doorHere) continue;                                                // door set below
      const block = facade(x, z, s, r, ext, T);
      g.set(x, y, z, block);
      if (block === "light_blue_stained_glass") windows.push({ x, y, z, ext });
    }
  }
  // roof slab: the tier's top, a parapet and cornice where it meets the open air
  g.set(x, T, z, (x + z) % 2 ? "light_gray_concrete" : "smooth_stone");
  if (outEdge(x, z)) {
    g.set(x, T + 1, z, "light_gray_concrete");
    g.set(x, T + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  // terrace planters on the lower roofs that a taller tier steps above
  const stepped = DIRS.some(([, dx, dz]) => { const n = colAt(x + dx, z + dz); return n && n.T > T; });
  if (stepped && !outEdge(x, z) && (x + z) % 4 === 0) g.set(x, T + 1, z, "oak_leaves", { persistent: "true", waterlogged: "false" });
}

// the doors and their canopies (a dark band over the opening, on the ground storey's head row)
for (const d of doors) {
  g.set(d.x, d.F0 + 1, d.z, "dark_oak_door", { facing: d.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(d.x, d.F0 + 2, d.z, "dark_oak_door", { facing: d.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  const along = d.side === "N" || d.side === "S" ? [1, 0] : [0, 1];
  for (const o of [-1, 0, 1]) g.set(d.x + along[0] * o, d.F0 + 3, d.z + along[1] * o, "black_concrete");
}

// warm light: glowstone on the inside floor behind some of the glass
const doorInward = new Set(doors.map((d) => { const [ix, iz] = INWARD[d.side]; return k3(d.x + ix, d.F0 + 1, d.z + iz); }));
function k3(x, y, z) { return `${x},${y},${z}`; }
for (const w of windows) {
  if (hash(w.x, w.y, w.z) !== 0 || w.ext.length !== 1) continue;
  const [ix, iz] = INWARD[w.ext[0]], x = w.x + ix, z = w.z + iz, y = w.y;
  if (!colAt(x, z) || sides(x, z, y).length || doorInward.has(k3(x, y, z))) continue;
  g.set(x, y, z, "glowstone");
}

// roof plant: a box of louvred plant on the top tier, and a mast on the anchor cell
for (const [x, z] of topCells) {
  if (Math.abs(x - mx) > 6 || Math.abs(z - mz) > 4 || !topInterior(x, z)) continue;
  g.set(x, TOP + 1, z, "gray_concrete"); g.set(x, TOP + 2, z, "gray_concrete");
  g.set(x, TOP + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
for (let y = TOP + 4; y <= TOP + 10; y++) g.set(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// sanity: every solid block above the ground has something solid under it or beside it, and nothing is above the box
let solid = 0, hanging = 0;
const SOLID = (x, y, z) => g.val(x, y, z) !== 0;
g.forEachCell((i) => {
  solid++;
  const X = W, Y = H, x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
  if (y === 0) return;
  if (SOLID(x, y - 1, z)) return;
  if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => SOLID(x + dx, y, z + dz))) return;
  hanging++;
});
const saved = g.save(`${base}.nbt`);
console.log(JSON.stringify({ footprint: cells.length, solid, hanging, blocks: saved.blocks, palette: saved.palette, top: TOP + 10, doors: doors.length, windows: windows.length }));
