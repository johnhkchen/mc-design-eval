import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const IN = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw535167420.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw535167420.nbt";

// Footprint 16 x 19. Late-20th-century Taipei mid-rise: five storeys of
// painted concrete with a grid of window bays, a shopfront ground storey,
// a plain parapet roof and a rooftop water tank.
const cells = JSON.parse(readFileSync(IN, "utf8"));
const W = 16, H = 38, D = 19;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const ROOF = 26;     // roof slab, roughly 26 blocks above lowest ground
const PARAPET = 27;  // parapet course
const CAP = 28;      // parapet cap slab
const mod = (a, n) => ((a % n) + n) % n;
const put = (x, y, z, id, props) => (props ? g.set(x, y, z, id, props) : g.set(x, y, z, id));
const key = (x, z) => `${x},${z}`;

// Entrance: front (south, +z) exposed cell nearest the middle of the frontage.
let entryKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (has(x, z + 1)) continue;
    const d = Math.abs(x - (W - 1) / 2);
    if (d < best) { best = d; entryKey = key(x, z); }
  }
}

for (const [x, z, gr] of cells) {
  const ex = { N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) };
  const exposed = Object.keys(ex).filter((k) => ex[k]);
  const isExt = exposed.length > 0;
  const corner = exposed.length >= 2;
  const alongX = ex.N || ex.S;
  const idx = alongX ? x : z;
  const pier = corner || idx % 3 === 0;
  const isEntry = key(x, z) === entryKey;

  for (let y = 0; y <= CAP; y++) {
    // Foundation: solid from 0 up to this cell's ground.
    if (y <= gr) { put(x, y, z, "stone_bricks"); continue; }

    // Entrance door and canopy-side lower storey.
    if (isEntry && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }

    // Roof slab at ROOF; parapet and cap sit on the exterior ring.
    if (y === ROOF) { put(x, y, z, isExt ? "white_concrete" : "light_gray_concrete"); continue; }
    if (y === PARAPET) { if (isExt) put(x, y, z, "white_concrete"); continue; }
    if (y === CAP) { if (isExt) put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (y > ROOF) continue;

    const rel = mod(y - 1, 5);

    // Floor lines (spandrel slab) on every cell, interior included.
    if (rel === 0) { put(x, y, z, "light_gray_concrete"); continue; }

    // Interior is air: an air gap behind the glass.
    if (!isExt) continue;

    // Ground storey: full shopfront glass between piers.
    if (y <= 4) { put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass"); continue; }

    // Storey-top band just under the next floor line.
    if (rel === 4) { put(x, y, z, y === 5 ? "smooth_stone" : "white_concrete"); continue; }

    // Window frame bands above and below the glass.
    if (rel === 1 || rel === 3) { put(x, y, z, pier ? "white_concrete" : "light_gray_concrete"); continue; }

    // Glass row: warm light behind some panes at dusk.
    if (pier) { put(x, y, z, "white_concrete"); continue; }
    const floorIdx = Math.floor((y - 1) / 5);
    const warm = (idx + floorIdx) % 4 === 1;
    put(x, y, z, warm ? "yellow_stained_glass" : "light_blue_stained_glass");
  }
}

// Rooftop water tank: 3x3 ring on the roof slab with a slab lid.
{
  let anchor = null;
  let best = Infinity;
  const cx = (W - 3) / 2, cz = (D - 3) / 2;
  for (let x0 = 1; x0 <= W - 4; x0++) {
    for (let z0 = 1; z0 <= D - 4; z0++) {
      let ok = true;
      for (let x = x0 - 1; x <= x0 + 3 && ok; x++)
        for (let z = z0 - 1; z <= z0 + 3 && ok; z++)
          if (!has(x, z)) ok = false;
      if (!ok) continue;
      const d = Math.hypot(x0 - cx, z0 - cz);
      if (d < best) { best = d; anchor = [x0, z0]; }
    }
  }
  if (anchor) {
    const [x0, z0] = anchor;
    for (let x = x0; x <= x0 + 2; x++) {
      for (let z = z0; z <= z0 + 2; z++) {
        for (let y = PARAPET; y <= 30; y++) {
          const ring = x === x0 || x === x0 + 2 || z === z0 || z === z0 + 2;
          if (ring) put(x, y, z, "smooth_stone");
        }
        put(x, 31, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      }
    }
    // Lightning rod on an interior roof cell clear of the tank.
    let rodCell = null;
    for (const [x, z] of cells) {
      const interior = has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);
      const inTank = x >= x0 - 1 && x <= x0 + 3 && z >= z0 - 1 && z <= z0 + 3;
      if (interior && !inTank) { rodCell = [x, z]; break; }
    }
    if (rodCell) {
      for (let y = PARAPET; y <= 30; y++) {
        put(rodCell[0], y, rodCell[1], "lightning_rod", { facing: "up", powered: "false" });
      }
    }
  }
}

g.save(OUT);
