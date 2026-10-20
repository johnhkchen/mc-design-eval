import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833586";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 23, D = 21;
const ROOF = 11;          // parapet top, about 11 blocks above lowest ground
const FLOOR1 = 5;         // first floor line
const ROOF_SLAB = 10;     // roof deck
const g = new Voxels([W, H, D]);

// Footprint lookup
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

// Outward exposure of a footprint cell
function exposure(x, z) {
  return {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
}

// Pass 1: find the entrance cell on the north (min z) face, middle of its run
const northXs = [];
for (const [x, z] of cells) {
  if (!has(x, z - 1)) northXs.push(x);
}
northXs.sort((a, b) => a - b);
const doorX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : null;

// Pass 2: build each cell
for (const [x, z, gr0] of cells) {
  const base = Math.min(Math.max(0, Math.round(gr0)), ROOF - 1);
  const out = exposure(x, z);
  const perimeter = out.n || out.s || out.w || out.e;
  const corner = (out.n || out.s) && (out.w || out.e);
  // index along the facade that this cell sits on
  const idx = (out.n || out.s) ? x : z;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < base; y++) {
    g.set(x, y, z, "stone_bricks");
  }

  if (perimeter) {
    for (let y = base; y <= ROOF; y++) {
      let block = "white_concrete";
      let props = null;

      if (y === base) {
        block = "polished_granite";                       // base course
      } else if (y === ROOF) {
        block = "smooth_quartz";                          // parapet cap
      } else if (y === ROOF_SLAB) {
        block = "smooth_quartz";                          // cornice under parapet
      } else if (y === 9) {
        block = "light_gray_concrete";                    // upper lintel band
      } else if (y === FLOOR1) {
        block = "smooth_quartz";                          // storey band
      } else if (y < FLOOR1) {
        // ground storey: shopfront glazing with stone piers
        const glassRow = y <= base + 3;
        const pier = corner || idx % 4 === 0;
        if (glassRow && !pier) block = "cyan_stained_glass";
        else if (pier) block = "stone_bricks";
        else block = "light_gray_concrete";
      } else if (y === 6) {
        block = "light_gray_concrete";                    // upper sill band
      } else if (y === 7 || y === 8) {
        // upper storeys: window grid with piers
        if (corner || idx % 3 === 0) block = "white_concrete";
        else block = "light_blue_stained_glass";
      }

      // Entrance: double door at the middle of the north face
      if (doorX !== null && x === doorX && out.n && (y === base + 1 || y === base + 2) && y < FLOOR1) {
        block = "dark_oak_door";
        props = {
          facing: "north",
          half: y === base + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      }

      if (props) g.set(x, y, z, block, props);
      else g.set(x, y, z, block);
    }

    // Warm light behind some upper windows
    if (!corner) {
      let ix = x, iz = z;
      if (out.n) iz = z + 1;
      else if (out.s) iz = z - 1;
      else if (out.w) ix = x + 1;
      else if (out.e) ix = x - 1;
      if (has(ix, iz) && idx % 3 === 1) {
        g.set(ix, 7, iz, "glowstone");
      }
    }
  } else {
    // Interior: solid floor slabs only, air elsewhere (no interiors)
    if (base <= FLOOR1) g.set(x, base, z, "smooth_stone");
    if (FLOOR1 >= base) g.set(x, FLOOR1, z, "smooth_stone");
    g.set(x, ROOF_SLAB, z, "light_gray_concrete");        // roof deck
    // Roof plant: a few small units standing on the deck
    if ((x * 3 + z * 5) % 11 === 0 && x > 2 && x < W - 3 && z > 2 && z < D - 3) {
      g.set(x, ROOF, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
