import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Lidar gives roof ~24 blocks above lowest ground, footprint 23 x 106.
// Read as a late-1980s/1990s Taipei mid-rise commercial-office block: 5 storeys of
// white tiled concrete, glass window bands between pillars, a granite base course,
// a shopfront entrance on the z=0 street face, a stone cornice and parapet, and
// rooftop plant in the middle. Storeys are 5 blocks, so floors sit at y = 5, 10, 15, 20
// and the roof at y = 24.

const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw588111958.cells.json", "utf8")
);

const W = 23, H = 36, D = 106;
const ROOF_Y = 24;
const PARAPET_Y = 25;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.max(0, Math.min(ROOF_Y, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));
const gr_of = (x, z) => ground.get(key(x, z));
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// deterministic pseudo-random for lit windows
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 11;

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Body: shell on perimeter cells, floor slabs and roof on interior cells.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);

  if (!isPerim(x, z)) {
    // Interior: floor slabs at each storey line and the roof slab. No interior air gap is
    // needed beyond this; glass sits on the shell.
    for (const fy of [5, 10, 15, 20]) if (fy >= gr) g.set(x, fy, z, "light_gray_concrete");
    if (ROOF_Y >= gr) g.set(x, ROOF_Y, z, "light_gray_concrete");
    continue;
  }

  // Outward normal (which street face this cell belongs to) and along-face coordinate u.
  let nx = 0, nz = 0, u;
  if (!has(x - 1, z)) { nx = -1; u = z; }
  else if (!has(x + 1, z)) { nx = 1; u = z; }
  else if (!has(x, z - 1)) { nz = -1; u = x; }
  else { nz = 1; u = x; }
  const corner = (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

  // Entrance on the z=0 face, centred on x=11.
  const isEntranceZone = z === 0 && x >= 9 && x <= 13;

  for (let y = gr; y <= PARAPET_Y; y++) {
    if (y === PARAPET_Y) { g.set(x, y, z, "white_concrete"); continue; }   // parapet
    if (y === ROOF_Y) { g.set(x, y, z, "smooth_stone"); continue; }        // cornice line

    // Entrance: glass and doors, dark granite base.
    if (isEntranceZone && y < 5) {
      if (y <= 1) { g.set(x, y, z, "polished_granite"); continue; }
      if (y === 4) { g.set(x, y, z, "white_concrete"); continue; }
      if (x === 11 && y <= gr + 1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      g.set(x, y, z, "glass");
      continue;
    }

    if (y <= 1) { g.set(x, y, z, "polished_granite"); continue; }          // base course

    const r = y % 5;
    if (r === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }        // floor/spandrel line
    if (r === 4) { g.set(x, y, z, "white_concrete"); continue; }            // lintel / beam

    // Window zone (r = 1..3): pillars every third block along the face, glass between.
    const pillar = corner || (u % 3 === 0);
    if (pillar) { g.set(x, y, z, "white_concrete"); continue; }
    g.set(x, y, z, "glass");

    // Warm light just inside some windows (air gap behind the glass, light on the inner cell).
    if (hash(x, y, z) === 0) {
      const ix = x - nx, iz = z - nz;
      if (has(ix, iz) && (gr_of(ix, iz) ?? 99) <= y) g.set(ix, y, iz, "shroomlight");
    }
  }
}

// 3. Rooftop plant: a central block of machine housing on the roof slab.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (isPerim(x, z)) continue;
  if (x >= 7 && x <= 15 && z >= 40 && z <= 56 && ROOF_Y >= gr) {
    const rim = x === 7 || x === 15 || z === 40 || z === 56;
    g.set(x, 25, z, rim ? "smooth_stone" : "light_gray_concrete");
    g.set(x, 26, z, rim ? "white_concrete" : "smooth_stone");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw588111958.nbt");
