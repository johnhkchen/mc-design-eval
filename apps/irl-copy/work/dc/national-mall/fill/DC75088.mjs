import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC75088.cells.json`, "utf8"));

// 700 13th St NW: Commercial office, c.1960s-70s Portland-stone-and-glass office block.
// Five storeys on a 4-block storey module, glass-and-pier facades, granite-like base,
// a central setback penthouse and rooftop mechanical boxes.
const W = 15, H = 32, D = 27;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(key(x, z), { g: Math.round(gr), r: Math.round(roof) });
}
const inFp = (x, z) => map.has(key(x, z));
const gOf = (x, z) => map.get(key(x, z)).g;

// Smoothed roof (3x3 mean within footprint), clamped so the penthouse fits in the grid.
function roofOf(x, z) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (inFp(x + dx, z + dz)) { s += map.get(key(x + dx, z + dz)).r; n++; }
  }
  const gr = gOf(x, z);
  return Math.min(24, Math.max(gr + 4, Math.round(s / n)));
}

// Core (penthouse footprint): inset from the building perimeter.
const inCore = (x, z) =>
  x >= 4 && x <= 10 && z >= 7 && z <= 19 &&
  inFp(x, z) && inFp(x - 1, z) && inFp(x + 1, z) && inFp(x, z - 1) && inFp(x, z + 1);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const doorP = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const gr = gOf(x, z);
  const R = roofOf(x, z);

  const east = !inFp(x + 1, z), west = !inFp(x - 1, z);
  const north = !inFp(x, z - 1), south = !inFp(x, z + 1);
  const onX = east || west, onZ = north || south;
  const edge = onX || onZ;
  const corner = onX && onZ;
  const core = inCore(x, z);

  // Foundation under the ground line.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (edge) {
    // Facade: base course, storey spandrels, glass bays with white piers.
    for (let y = gr; y <= R - 1; y++) {
      const rel = y - gr;
      let b;
      if (rel === 0) b = "polished_andesite";                       // base course
      else if (y === R - 1) b = "light_gray_concrete";              // cornice band
      else if (rel % 4 === 0) b = "light_gray_concrete";           // storey spandrel / floor line
      else if (corner) b = "smooth_quartz";                         // corner pier
      else {
        const p = onZ ? x : z;                                      // position along the face
        b = (p % 3 === 0) ? "smooth_quartz" : "glass";
      }
      put(x, y, z, b);

      // Warm lights behind some glass, on the floor slab of alternate storeys.
      if (!corner && rel % 4 === 1 && Math.floor(rel / 4) % 2 === 1) {
        const p = onZ ? x : z;
        if (b === "glass" && p % 6 === 1) {
          let ix = x, iz = z;
          if (north) iz = z + 1; else if (south) iz = z - 1;
          else if (east) ix = x - 1; else if (west) ix = x + 1;
          if (inFp(ix, iz)) put(ix, y, iz, "glowstone");
        }
      }
    }
    // Parapet on the roof edge.
    put(x, R, z, "smooth_quartz");

    // Street entrances on the two long faces at x = 7: stone surround, pilasters, keystoned lintel.
    if (north || south) {
      const facing = north ? "north" : "south";
      if (x === 6 || x === 8) {
        // Pilasters framing the door bay, full height of the storefront.
        for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "smooth_quartz");
      }
      if (x === 7) {
        put(x, gr + 1, z, "iron_door", doorP(facing, "lower"));
        put(x, gr + 2, z, "iron_door", doorP(facing, "upper"));
        put(x, gr + 3, z, "chiseled_stone_bricks");                 // keystone over door
      }
      if (x === 6 || x === 8) put(x, gr + 3, z, "smooth_quartz");
      if (x === 5 || x === 9) put(x, gr + 3, z, "smooth_stone");     // lintel returns
    }
  } else {
    // Interior: floor slabs at each storey line and a solid roof deck; air between (no rooms).
    for (let y = gr; y < R - 1; y++) {
      if ((y - gr) % 4 === 0) put(x, y, z, "light_gray_concrete");
    }
    put(x, R - 1, z, "smooth_stone");

    if (core) {
      // Central setback penthouse, standing on the roof deck.
      const coreEdge = !inCore(x + 1, z) || !inCore(x - 1, z) || !inCore(x, z + 1) || !inCore(x, z - 1);
      for (let y = R; y <= R + 3; y++) {
        if (!coreEdge) put(x, y, z, "white_concrete");
        else if (y === R) put(x, y, z, "smooth_quartz");
        else put(x, y, z, ((x + z) % 3 === 0) ? "smooth_quartz" : "glass");
      }
      put(x, R + 4, z, "smooth_quartz");
    } else if (x % 5 === 2 && z % 6 === 3) {
      // Rooftop mechanical plant boxes.
      put(x, R, z, "light_gray_concrete");
      put(x, R + 1, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/DC75088.nbt`);
