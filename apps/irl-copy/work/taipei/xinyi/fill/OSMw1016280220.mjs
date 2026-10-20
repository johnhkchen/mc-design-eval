import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1016280220.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1016280220.nbt";

const W = 20, H = 33, D = 18;
const ROOF = 20;      // parapet top course is y=21
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> clamped ground height
const ground = new Map();
for (const [x, z, gr] of cells) {
  const h = Math.min(18, Math.max(0, Math.round(gr)));
  ground.set(`${x},${z}`, h);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);
const missingCount = (x, z) =>
  [!has(x - 1, z), !has(x + 1, z), !has(x, z - 1), !has(x, z + 1)].filter(Boolean).length;
const exterior = (x, z) => missingCount(x, z) > 0;
const corner = (x, z) => {
  const m = missingCount(x, z);
  return m >= 2 && !(has(x - 1, z) && has(x + 1, z)) && !(has(x, z - 1) && has(x, z + 1));
};

// Along-wall index: x for north/south faces, z for east/west faces
const bayIndex = (x, z) => {
  if (!has(x, z - 1) || !has(x, z + 1)) return x;
  return z;
};
const isMullion = (x, z) => corner(x, z) || bayIndex(x, z) % 3 === 0;

// Entrance: south-facing exterior cell nearest the mean x of that face
const southCells = [...ground.keys()]
  .map(k => k.split(",").map(Number))
  .filter(([x, z]) => !has(x, z + 1));
const meanX = southCells.reduce((s, [x]) => s + x, 0) / Math.max(1, southCells.length);
const entrance = southCells.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX))[0];
const [ex, ez] = entrance || [-1, -1];

// 1. Foundation: solid from y0 up to each cell's ground
for (const [key, h] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < h; y++) g.set(x, y, z, "stone");
}

// 2. Shell and interior
for (const [key, h] of ground) {
  const [x, z] = key.split(",").map(Number);

  if (exterior(x, z)) {
    for (let y = h; y <= 21; y++) {
      if (y >= ROOF) {
        // parapet course
        g.set(x, y, z, "smooth_quartz");
        continue;
      }
      const r = y % 5;
      if (r === 0) {
        // storey line / base course
        g.set(x, y, z, y === 0 ? "stone_bricks" : "white_concrete");
      } else if (r === 4) {
        // spandrel
        g.set(x, y, z, "light_gray_concrete");
      } else {
        // window zone
        if (isMullion(x, z)) {
          g.set(x, y, z, "smooth_quartz");
        } else if (y < 5) {
          // shopfront glass, ground storey
          g.set(x, y, z, "glass_pane");
        } else {
          g.set(x, y, z, "light_blue_stained_glass_pane");
        }
      }
    }
  } else {
    // interior: floor slabs and roof deck, air elsewhere
    for (const y of [5, 10, 15, ROOF]) {
      if (y >= h) g.set(x, y, z, "light_gray_concrete");
    }
    // warm light behind window for interior cells next to the facade
    const nearFacade = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1) ||
      [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].some(([a, b]) => exterior(a, b) && has(a, b));
    if (nearFacade) {
      for (let k = 0; k < 4; k++) {
        const y = 5 * k + 2;
        if (y >= h && (x + z + k) % 4 === 0) g.set(x, y, z, "glowstone");
      }
    }
  }
}

// 3. Entrance: doors, lintel slabs above
if (entrance) {
  const gy = gr(ex, ez);
  g.set(ex, gy, ez, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, gy + 1, ez, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) {
    const x = ex + dx;
    if (has(x, ez)) {
      g.set(x, gy + 3, ez, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// 4. Roof equipment: central plant box, screen and a short antenna
for (let x = 6; x <= 13; x++) {
  for (let z = 5; z <= 12; z++) {
    if (!has(x, z)) continue;
    const edge = x === 6 || x === 13 || z === 5 || z === 12;
    g.set(x, 21, z, "stone_bricks");
    if (edge) {
      g.set(x, 22, z, "iron_bars");
    } else {
      g.set(x, 22, z, "light_gray_concrete");
    }
  }
}
if (has(10, 8)) {
  for (let y = 23; y <= 27; y++) g.set(10, y, 8, "iron_bars");
}

g.save(OUT);
