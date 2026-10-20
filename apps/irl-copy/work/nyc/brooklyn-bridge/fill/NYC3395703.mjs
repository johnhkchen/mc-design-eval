import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3395703.cells.json`, "utf8"));

const W = 5, H = 16, D = 6;
const g = new Voxels([W, H, D]);

// Per-cell ground, clamped so the house keeps two storeys above it
const raw = cells.map(([x, z, gr0, rf0]) => ({
  x, z,
  gr: Math.max(0, Math.min(Math.round(gr0), H - 6)),
  rf: Math.round(rf0),
}));

// Smooth the lidar roof into one flat tier: median roof, never below two storeys over the highest ground
const rfs = raw.map(c => c.rf).sort((a, b) => a - b);
const medianRf = rfs[Math.floor(rfs.length / 2)];
const gMax = Math.max(...raw.map(c => c.gr));
const roofY = Math.min(Math.max(medianRf, gMax + 4), H - 1);

const cm = new Map();
for (const c of raw) cm.set(`${c.x},${c.z}`, { gr: c.gr, roof: roofY });

const has = (x, z) => cm.has(`${x},${z}`);
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
function outward(x, z) {
  for (const [dx, dz] of DIRS) if (!has(x + dx, z + dz)) return [dx, dz];
  return null;
}
// Corner = exterior cell missing two orthogonal neighbours
function isCorner(x, z) {
  const miss = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz)).length;
  return miss >= 2;
}

// Pass 1: foundations, interior floors, interior roof, exterior cornice
for (const [key, { gr, roof }] of cm) {
  const [x, z] = key.split(",").map(Number);
  const exterior = outward(x, z) !== null;

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "oak_planks");
  if (gr + 2 < roof) g.set(x, gr + 2, z, "oak_planks");

  if (exterior) g.set(x, roof, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  else g.set(x, roof, z, "stone_bricks");
}

// Pass 2: exterior walls, base course, storey band, window grid
for (const [key, { gr, roof }] of cm) {
  const [x, z] = key.split(",").map(Number);
  const out = outward(x, z);
  if (!out) continue;
  const corner = isCorner(x, z);

  for (let y = gr; y < roof; y++) {
    const rel = y - gr;
    if (rel === 0) {
      g.set(x, y, z, "brown_terracotta");
    } else if (rel === 2) {
      g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    } else if (corner) {
      g.set(x, y, z, "stone_bricks");
    } else if (rel === 1 || rel === 3) {
      // window row: bright glass in a stone frame
      g.set(x, y, z, "light_blue_stained_glass");
      // warm light behind every other lower-row window
      if (rel === 1 && (x + 2 * z) % 4 === 0) {
        const ix = x - out[0], iz = z - out[1];
        if (has(ix, iz)) g.set(ix, y, iz, "glowstone");
      }
    } else {
      g.set(x, y, z, "bricks");
    }
  }
}

// Pass 3: centred street entrance on the -z face, with stoop and lintel
const front = [];
for (const [key, { gr }] of cm) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z - 1)) front.push([x, z, gr]);
}
front.sort((a, b) => a[0] - b[0]);
if (front.length) {
  const [fx, fz, fgr] = front[Math.floor(front.length / 2)];
  g.set(fx, fgr, fz, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
  g.set(fx, fgr + 1, fz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(fx, fgr + 2, fz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  if (fgr + 3 < roofY) g.set(fx, fgr + 3, fz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 4: one brick chimney on an interior roof cell
let chimney = null;
for (const [key, { roof }] of cm) {
  const [x, z] = key.split(",").map(Number);
  if (!outward(x, z) && (!chimney || (x + z) > (chimney.x + chimney.z))) chimney = { x, z, roof };
}
if (chimney) {
  g.set(chimney.x, chimney.roof, chimney.z, "bricks");
  if (chimney.roof + 1 < H) g.set(chimney.x, chimney.roof + 1, chimney.z, "bricks");
  if (chimney.roof + 2 < H) g.set(chimney.x, chimney.roof + 2, chimney.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/NYC3395703.nbt`);
