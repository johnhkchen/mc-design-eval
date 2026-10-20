import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 8 x 21 footprint, roof ~21 blocks above lowest ground.
// Read as a late-20th-century Xinyi mid-rise: four storeys of about 5 blocks,
// a pale tiled concrete frame with tinted glazing, a stone plinth, a
// projecting-looking cornice and parapet, and a mechanical box on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280261";
const W = 8, H = 33, D = 21;
const TOP = 20;          // top course of the wall (parapet); roof deck sits here too
const FLOOR_LINES = [0, 5, 10, 15, 20];

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const rows = raw.map((c) =>
  Array.isArray(c) ? { x: c[0], z: c[1], gr: c[2] } : { x: c.x, z: c.z, gr: c.ground ?? c[2] }
);
const minGr = Math.min(...rows.map((r) => r.gr));
const gmap = new Map();
for (const r of rows) {
  const gr = Math.min(12, Math.max(0, r.gr - minGr));
  gmap.set(`${r.x},${r.z}`, gr);
}
const has = (x, z) => gmap.has(`${x},${z}`);
const groundOf = (x, z) => gmap.get(`${x},${z}`);

const exposure = (x, z) => ({
  w: !has(x - 1, z),
  e: !has(x + 1, z),
  n: !has(x, z - 1),
  s: !has(x, z + 1),
});

const g = new Voxels([W, H, D]);

// Material palette
const FOUNDATION = "stone_bricks";
const BASE = "polished_andesite";
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const DECK = "light_gray_concrete";

for (const [key, gr] of gmap) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposure(x, z);
  const boundary = ex.w || ex.e || ex.n || ex.s;
  const corner = (ex.w || ex.e) && (ex.n || ex.s);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);

  if (!boundary) {
    // Interior: floor slabs per storey and roof deck only, air between
    for (const fl of FLOOR_LINES.slice(1)) {
      if (fl >= gr) g.set(x, fl, z, DECK);
    }
    // Warm light behind the glass on the first wall ring, in some bays
    for (let k = 0; k < 4; k++) {
      const y = 5 * k + 2;
      if (y < gr || y > TOP) continue;
      const nearWest = x === 1 && has(0, z) && z % 4 === 2;
      const nearEast = x === W - 2 && has(W - 1, z) && z % 4 === 1;
      if (nearWest || nearEast) g.set(x, y, z, "glowstone");
    }
    continue;
  }

  // Boundary: wall ring from ground to top
  for (let y = gr; y <= TOP; y++) {
    const r = y % 5;
    let id = null;
    let props;

    if (y === gr) {
      id = BASE;                       // base course at ground
    } else if (y === TOP) {
      id = WALL;                       // parapet
    } else if (y === TOP - 1) {
      id = BAND;                       // cornice band
    } else if (r === 0 || r === 4) {
      id = BAND;                       // storey lines / lintels
    } else {
      // glazing zone (r = 1..3)
      const alongZ = (ex.w || ex.e) && !(ex.n || ex.s);
      const pos = alongZ ? z : x;
      const mullion = corner || pos % 3 === 0;
      id = mullion ? WALL : GLASS;
    }
    g.set(x, y, z, id, props);
  }

  // Shopfront door on the front (z = 0) face
  if (ex.n && x === 3 && gr + 2 < TOP - 1) {
    g.set(x, gr + 1, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Canopy over the entrance, sitting on the door head in the wall plane
for (let x = 2; x <= 5; x++) {
  if (!has(x, 0)) continue;
  const gr = groundOf(x, 0);
  if (gr + 3 <= TOP - 2) {
    g.set(x, gr + 3, 0, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Roof plant box on the deck, only where the footprint allows
for (let x = 2; x <= 5; x++) {
  for (let z = 5; z <= 9; z++) {
    if (!has(x, z)) continue;
    const ex = exposure(x, z);
    if (ex.w || ex.e || ex.n || ex.s) continue;
    for (let y = TOP + 1; y <= TOP + 2; y++) g.set(x, y, z, BAND);
    g.set(x, TOP + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Lanterns on the parapet corners for warmth at dusk
for (const [key] of gmap) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposure(x, z);
  if ((ex.w || ex.e) && (ex.n || ex.s)) {
    g.set(x, TOP + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
