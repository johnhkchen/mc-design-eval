import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000088.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000088.nbt";

// 39 Washington Street, DUMBO: c.1904 brick commercial/loft building.
// Load footprint cells: [x, z, ground, roof] (tolerate object form too).
const raw = JSON.parse(readFileSync(SRC, "utf8"));
const rows = Array.isArray(raw) ? raw : (raw.cells ?? Object.values(raw));
const cellsArr = rows.map((r) =>
  Array.isArray(r) ? { x: r[0], z: r[1], g: r[2], r: r[3] }
                   : { x: r.x, z: r.z, g: r.ground, r: r.roof });

const W = 49, H = 41, D = 43;

const gmin = Math.min(...cellsArr.map((c) => c.g));
const roofs = cellsArr.map((c) => Math.round(c.r - gmin)).sort((a, b) => a - b);
const med = roofs[Math.floor(roofs.length / 2)];

const key = (x, z) => `${x},${z}`;
const F = new Map();
for (const c of cellsArr) {
  if (c.x < 0 || c.x >= W || c.z < 0 || c.z >= D) continue;
  const G = Math.max(0, Math.round(c.g - gmin));
  const R = Math.round(c.r - gmin);
  // Snap roofs to whole 3-block storey steps around the building's main roof:
  // lidar noise collapses into one flat roof, real setbacks stay as tiers.
  const steps = Math.max(-3, Math.min(3, Math.round((R - med) / 3)));
  let T = med + 3 * steps;
  T = Math.min(H - 6, Math.max(G + 8, T));
  F.set(key(c.x, c.z), { x: c.x, z: c.z, G, T });
}

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];

// Floor lines: ground floor (4 blocks, shopfront), then 3-block storeys, roof slab at T-2.
function floorsOf(c) {
  const s = [c.G];
  for (let y = c.G + 4; y < c.T - 2; y += 3) s.push(y);
  s.push(c.T - 2);
  return [...new Set(s)].sort((a, b) => a - b);
}

const g = new Voxels([W, H, D]);
const cells = [...F.values()];

// Pass 1: foundations, floor slabs, walls, parapet, interior roof cap.
for (const c of cells) {
  const { x, z, G, T } = c;
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");   // foundation
  c.fl = new Set(floorsOf(c));
  g.set(x, G, z, "smooth_stone");                               // ground floor slab

  c.exp = DIRS.filter((d) => !F.has(key(x + d.dx, z + d.dz)));
  c.perim = c.exp.length > 0;
  c.corner = c.exp.length >= 2;

  if (!c.perim) {
    for (const y of c.fl) if (y > G) g.set(x, y, z, "smooth_stone");
    g.set(x, T - 1, z, "stone");                                // roof cap
    continue;
  }
  for (let y = G + 1; y <= T - 1; y++) {
    if (y === T - 1) g.set(x, y, z, "stone_bricks");            // parapet cap
    else if (c.fl.has(y)) g.set(x, y, z, "smooth_stone");       // belt courses / cornice
    else g.set(x, y, z, "bricks");                              // red brick wall
  }
}

// Street entrance: the exposed face direction with the most single-face cells.
const counts = Object.fromEntries(DIRS.map((d) => [d.n, 0]));
for (const c of cells) if (c.exp.length === 1) counts[c.exp[0].n]++;
const entDir = DIRS.reduce((a, b) => (counts[b.n] > counts[a.n] ? b : a));
const entCands = cells
  .filter((c) => c.exp.length === 1 && c.exp[0].n === entDir.n)
  .sort((a, b) => (entDir.dx ? a.z - b.z : a.x - b.x));
const entCell = entCands[Math.floor(entCands.length / 2)];

// Pass 2: windows, shopfront, lit windows.
for (const c of cells) {
  if (c.exp.length !== 1) continue;
  const d = c.exp[0];
  const { x, z, G } = c;
  const u = d.dx !== 0 ? z : x;
  const m3 = ((u % 3) + 3) % 3;
  const fl = [...c.fl];

  for (let i = 0; i < fl.length - 1; i++) {
    const f = fl[i], nf = fl[i + 1];
    if (f === G) {
      g.set(x, G + 3, z, "stone_bricks");                       // shopfront lintel
      for (const y of [G + 1, G + 2]) if (m3 !== 0) g.set(x, y, z, "glass");
    } else {
      for (let y = f + 1; y <= nf - 1; y++) {
        if (m3 === 1) {
          g.set(x, y, z, "glass");
          const ix = x - d.dx, iz = z - d.dz;
          const inner = F.get(key(ix, iz));
          if (inner && !inner.perim && (u * 7 + y * 13 + x * 3 + z * 5) % 9 === 0) {
            g.set(ix, y, iz, "glowstone");
          }
        }
      }
    }
  }
}

// Entrance: stone surround (three cells wide), recessed dark-oak door, lantern-lit transom.
if (entCell) {
  const d = entDir;
  const x = entCell.x, z = entCell.z, G = entCell.G;
  const along = (k) => (d.dx !== 0 ? [x, z + k] : [x + k, z]);

  for (const k of [-1, 0, 1]) {
    const [ex, ez] = along(k);
    if (!F.has(key(ex, ez))) continue;
    for (const y of [G + 1, G + 2, G + 3]) g.set(ex, y, ez, "stone_bricks");
  }
  const props = (half) => ({
    facing: d.n, half, hinge: "left", open: "false", powered: "false",
  });
  g.set(x, G + 1, z, "dark_oak_door", props("lower"));
  g.set(x, G + 2, z, "dark_oak_door", props("upper"));
  g.set(x, G + 3, z, "stone_bricks");
  // Warm transom light above the door, set into the surround.
  g.set(x, G + 3, z, "glowstone");
}

// Pass 3: roof equipment on interior roof cells, spaced widely.
for (const c of cells) {
  if (c.perim) continue;
  if (c.x % 13 === 6 && c.z % 13 === 6) {
    g.set(c.x, c.T, c.z, "light_gray_concrete");
    g.set(c.x, c.T + 1, c.z, "light_gray_concrete");
  }
}

g.save(OUT);
