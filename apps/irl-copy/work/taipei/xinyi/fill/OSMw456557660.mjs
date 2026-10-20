import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1980s Taipei office block: four storeys of 5 blocks, pale tiled
// concrete with light-grey storey bands, blue-tinted glass in pier-divided
// window strips, a shopfront ground storey, a parapet, and a rooftop plant box
// with a rod.
const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw456557660.cells.json", "utf8")
);

const W = 20, H = 33, D = 12;
const TOP = 20;      // parapet block (height 21 from lowest ground)
const ROOF = 19;     // roof slab / cornice band
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const has = (x, z) => gmap.has(`${x},${z}`);

const glassZ = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const glassX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Interior cells that sit directly behind a window column get a warm lamp.
function behindWindow(x, z) {
  if (z === 1 && x >= 1 && x <= 18 && x % 3 !== 0) return true;
  if (z === 10 && x >= 1 && x <= 18 && x % 3 !== 0) return true;
  if (x === 1 && z >= 1 && z <= 10 && z % 3 !== 0) return true;
  if (x === 18 && z >= 1 && z <= 10 && z % 3 !== 0) return true;
  return false;
}

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const base = Math.max(1, Math.round(gr));
  const perim = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !has(x + dx, z + dz));

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < base && y < H; y++) g.set(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs and roof only, air otherwise.
    for (let y = base; y <= ROOF; y++) {
      if (y === ROOF || y % 5 === 0) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (y < ROOF) {
        const s = Math.floor(y / 5);
        const lampY = 5 * s + 2;
        if (y === lampY && s >= 0 && behindWindow(x, z) && (x + z + s) % 4 === 0) {
          g.set(x, y, z, "glowstone");
        }
      }
    }
    continue;
  }

  // Perimeter shell from base up to the parapet.
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  for (let y = base; y <= TOP; y++) {
    if (corner) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (y === TOP) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (y === ROOF || y % 5 === 0 || y % 5 === 4) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    // Window rows (y%5 in 1..3).
    const onZFace = z === 0 || z === D - 1;
    const onXFace = x === 0 || x === W - 1;
    if (onZFace) {
      if (x % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }
      if (z === 0 && x === 10 && base === 1 && (y === 1 || y === 2)) {
        g.set(x, y, z, "oak_door", {
          facing: "north", half: y === 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      g.set(x, y, z, "light_blue_stained_glass_pane", glassZ);
    } else if (onXFace) {
      if (z % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }
      g.set(x, y, z, "light_blue_stained_glass_pane", glassX);
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }
}

// Rooftop plant box and antenna, on the interior roof slab.
for (let x = 7; x <= 12; x++) {
  for (let z = 4; z <= 7; z++) {
    for (let y = TOP; y <= 22; y++) {
      g.set(x, y, z, y === 22 ? "smooth_quartz" : "light_gray_concrete");
    }
  }
}
for (const y of [23, 24]) {
  g.set(9, y, 5, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw456557660.nbt");
