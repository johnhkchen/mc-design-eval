import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62140.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62140.nbt";
const W = 19, D = 21, H = 32;

// 1701 Pennsylvania Ave NW: 1970s-80s Commercial-Office, ~10 storeys.
// Beige precast/quartz spandrels, quartz-brick piers, light-blue glazing,
// granite base course, quartz cornice, plant-screen roof.
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const map = new Map();
let g0 = Infinity;
for (const [x, z, gnd, roof] of cells) {
  map.set(key(x, z), { x, z, gnd, roof });
  if (gnd < g0) g0 = gnd;
}

// Smooth lidar roof heights over a wider neighbourhood, then quantise to
// even storey counts so the massing settles into clean tiers.
const info = new Map();
for (const { x, z, gnd } of map.values()) {
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const c = map.get(key(x + dx, z + dz));
    if (c) { sum += c.roof; n++; }
  }
  const gr = Math.round(gnd - g0);
  const roofS = sum / n;
  let floors = Math.round((roofS - gr) / 4) * 2;
  floors = Math.max(4, Math.min(10, floors));
  while (gr + 2 * floors > 26 && floors > 4) floors -= 2;
  const topY = gr + 2 * floors;
  info.set(key(x, z), { x, z, gr, floors, topY });
}

const g = new Voxels([W, H, D]);
const isCell = (x, z) => info.has(key(x, z));
const isPerimeter = (x, z) =>
  !(isCell(x - 1, z) && isCell(x + 1, z) && isCell(x, z - 1) && isCell(x, z + 1));

// Pass 1: foundations, facade and hollow interiors
for (const c of info.values()) {
  const { x, z, gr, topY } = c;
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  const perim = isPerimeter(x, z);
  for (let y = gr; y < topY; y++) {
    const r = y - gr;
    const s = Math.floor(r / 2);
    const off = r % 2;
    if (perim) {
      if (off === 0) {
        g.set(x, y, z, s === 0 ? "polished_granite" : "smooth_quartz");
      } else if ((x + z) % 3 === 0) {
        g.set(x, y, z, "quartz_bricks");
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
    } else if (off === 0) {
      g.set(x, y, z, "light_gray_concrete");
    }
  }
  // cornice / roof slab
  if (perim) {
    g.set(x, topY, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  } else {
    g.set(x, topY, z, "light_gray_concrete");
  }
  // plant screens: one low block on a sparse grid of interior roof cells
  if (!perim && (x * 3 + z * 7) % 13 === 0 && topY + 2 <= H - 1) {
    g.set(x, topY + 1, z, "smooth_quartz");
    g.set(x, topY + 2, z, "light_gray_concrete");
  }
}

// Pass 2: sparse warm glowstone just behind the glazing
for (const c of info.values()) {
  const { x, z, gr, floors } = c;
  if (isPerimeter(x, z)) continue;
  const nearPerim = isPerimeter(x - 1, z) || isPerimeter(x + 1, z) || isPerimeter(x, z - 1) || isPerimeter(x, z + 1);
  if (!nearPerim) continue;
  for (let s = 0; s < floors; s++) {
    if ((x * 5 + z * 3 + s) % 7 !== 0) continue;
    g.set(x, gr + 2 * s + 1, z, "glowstone");
  }
}

// Pass 3: centred entrance on the street face (z = 0) with a clear stone surround
const doorX = 9;
const ent = info.get(key(doorX, 0));
if (ent) {
  const { gr } = ent;
  // stone surround: piers either side, lintel over the door
  for (const x of [doorX - 2, doorX + 2]) {
    const c = info.get(key(x, 0));
    if (c) for (let y = gr; y <= gr + 3; y++) g.set(x, y, 0, "polished_granite");
  }
  g.set(doorX, gr + 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(doorX, gr + 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const x of [doorX - 1, doorX + 1]) {
    const c = info.get(key(x, 0));
    if (c) {
      g.set(x, gr + 1, 0, "light_blue_stained_glass");
      g.set(x, gr + 2, 0, "polished_granite");
    }
  }
  const top = info.get(key(doorX, 0));
  if (top) g.set(doorX, gr + 3, 0, "polished_granite");
}

g.save(OUT);
