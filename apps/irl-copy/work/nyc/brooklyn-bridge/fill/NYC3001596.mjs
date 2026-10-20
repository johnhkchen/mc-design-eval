import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001596.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001596.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 17, H = 28, D = 33;
const g = new Voxels([W, H, D]);

// Materials: Brooklyn Heights 1831 Greek Revival, red brick with brownstone-coloured trim
const BRICK = "bricks";
const TRIM = "smooth_sandstone";       // brownstone-toned bands, quoins, cornice, surrounds
const TRIM_SLAB = "smooth_sandstone_slab";
const FOUND = "stone_bricks";          // rusticated foundation
const FLOOR = "smooth_stone";          // floor slabs
const ROOF = "stone";                  // roof deck
const GLASS = "glass";
const LIGHT = "glowstone";             // warm light behind some glass

const key = (x, z) => x + "," + z;
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(key(x, z), { gr, rf });
const inside = (x, z) => map.has(key(x, z));

// Global storey grid: lines fall on the same absolute y across the whole building
const G0 = Math.min(...cells.map(c => c[2]));

// Roof: 5x5 box mean of lidar, quantised to two-block storeys so tiers read cleanly
const info = new Map();
for (const [x, z, gr] of cells) {
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const c = map.get(key(x + dx, z + dz));
    if (c) { sum += c.rf; n++; }
  }
  let R = Math.round((sum / n) / 2) * 2;
  R = Math.max(gr + 4, Math.min(H - 4, R));
  info.set(key(x, z), { x, z, gr, R });
}

// Street door: a -z face cell nearest the middle of the width
let doorCell = null, best = Infinity;
for (const c of info.values()) {
  if (!inside(c.x, c.z - 1)) {
    const d = Math.abs(c.x - 8);
    if (d < best) { best = d; doorCell = c; }
  }
}

const isLine = (y) => (y - G0) % 2 === 0;

for (const c of info.values()) {
  const { x, z, gr, R } = c;
  const mN = !inside(x, z - 1), mS = !inside(x, z + 1);
  const mW = !inside(x - 1, z), mE = !inside(x + 1, z);
  const perim = mN || mS || mW || mE;
  const corner = (mN || mS) && (mW || mE);

  // Inward direction for warm light behind glass
  let ix = 0, iz = 0;
  if (mN) iz = 1; else if (mS) iz = -1; else if (mW) ix = 1; else if (mE) ix = -1;

  // Foundation from y0 to ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  for (let y = gr; y <= R - 1; y++) {
    // Ground floor level
    if (y === gr) {
      g.set(x, y, z, perim ? TRIM : FLOOR);
      continue;
    }
    // Roof cap / main cornice
    if (y === R - 1) {
      g.set(x, y, z, perim ? TRIM : ROOF);
      continue;
    }
    // Projecting cornice course under the cap
    if (y === R - 2 && perim) {
      if (corner) g.set(x, y, z, TRIM);
      else g.set(x, y, z, TRIM_SLAB, { type: "bottom", waterlogged: "false" });
      continue;
    }

    if (perim) {
      if (corner) {
        // Trim quoins at corners, full height
        g.set(x, y, z, TRIM);
      } else if (isLine(y)) {
        // Storey line
        g.set(x, y, z, TRIM);
      } else {
        // Window row
        const u = (mN || mS) ? x : z;
        if (u % 2 === 1) {
          g.set(x, y, z, GLASS);
          const rel = y - G0;
          const lit = (rel === 3 && u % 6 === 1) || (rel === 7 && u % 4 === 3);
          if (lit && (ix || iz) && inside(x + ix, z + iz)) {
            g.set(x + ix, y, z + iz, LIGHT);
          }
        } else {
          g.set(x, y, z, BRICK);
        }
      }
      continue;
    }

    // Interior: floor slabs only on the global storey lines, air between
    if (isLine(y)) g.set(x, y, z, FLOOR);
  }
}

// Entrance: oak door centred on the -z street face, with a trim surround and lintel
if (doorCell) {
  const { x, z, gr, R } = doorCell;
  if (R - 2 > gr + 3) {
    const facing = "north";
    // Flanking pilasters
    for (const dx of [-1, 1]) {
      if (inside(x + dx, z)) {
        g.set(x + dx, gr + 1, z, TRIM);
        g.set(x + dx, gr + 2, z, TRIM);
      }
    }
    // Door
    g.set(x, gr + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    // Lintel across the surround
    for (const dx of [-1, 0, 1]) {
      if (inside(x + dx, z)) g.set(x + dx, gr + 3, z, TRIM);
    }
    // Lanterns just inside the hall
    if (inside(x, z + 1)) g.set(x, gr + 1, z + 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// A few chimneys on the roof deck, away from the edge
for (const [cx, cz] of [[4, 10], [12, 22], [8, 16]]) {
  const c = info.get(key(cx, cz));
  if (c && c.R + 3 <= H) {
    const { R } = c;
    g.set(cx, R, cz, BRICK);
    g.set(cx, R + 1, cz, BRICK);
    g.set(cx, R + 2, cz, TRIM);
  }
}

g.save(OUT);
