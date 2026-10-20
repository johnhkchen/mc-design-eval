import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407650494";
const W = 105, H = 23, D = 38;
const ROOF = 11;       // roof slab level from lidar (about 11 above lowest ground)
const CORNICE = 10;    // top of the upper storey, cornice band
const SPANDREL = 5;    // storey line between the two floors

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const G = (x, z) => ground.get(key(x, z));
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// The street face is the outward +z side (highest z with no neighbour).
const onStreetFace = (x, z) => !has(x, z + 1);

// Along-face coordinate: x on north/south faces, z on east/west faces.
const alongOf = (x, z) => (!has(x, z - 1) || !has(x, z + 1)) ? x : z;

function facadeBlock(x, z, y, gr) {
  const along = alongOf(x, z);
  const m = along % 4;                       // bay position
  const entrance = onStreetFace(x, z) && along % 24 >= 9 && along % 24 <= 12;

  if (y === gr) return entrance ? "smooth_quartz" : "polished_andesite"; // base course
  if (y === SPANDREL || y === CORNICE) return "smooth_quartz";            // storey line, cornice

  if (y < SPANDREL) {
    if (entrance) {
      if (y === gr + 4) return "smooth_quartz";      // lintel over entrance
      if (along % 24 === 9 || along % 24 === 12) return "quartz_pillar";  // entrance jambs
      return "glass";                                 // doorway glazing
    }
    if (m === 0) return "quartz_pillar";              // mullions
    return "light_blue_stained_glass";                // shopfront glazing
  }
  return m === 0 ? "quartz_pillar" : "light_blue_stained_glass";
}

// Pass 1: foundation, floors, walls, storey slabs, roof.
for (const [x, z, gr] of cells) {
  const perim = isPerim(x, z);

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");   // foundation
  g.set(x, gr, z, perim ? "polished_andesite" : "smooth_quartz"); // ground floor

  if (perim) {
    for (let y = gr + 1; y <= CORNICE; y++) {
      g.set(x, y, z, facadeBlock(x, z, y, gr));
    }
    g.set(x, ROOF, z, "smooth_quartz");       // parapet
    g.set(x, ROOF + 1, z, "smooth_quartz");
  } else {
    if (SPANDREL > gr) g.set(x, SPANDREL, z, "smooth_quartz");
    if (CORNICE > gr) g.set(x, CORNICE, z, "smooth_quartz");
    g.set(x, ROOF, z, "gray_concrete");       // roof deck
  }
}

// Pass 2: warm lights behind the glass, and entrance lanterns inside.
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const along = alongOf(x, z);
  let ix = x, iz = z;
  if (!has(x, z - 1)) iz = z + 1;
  else if (!has(x, z + 1)) iz = z - 1;
  else if (!has(x - 1, z)) ix = x + 1;
  else ix = x - 1;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  const igr = G(ix, iz);

  const entrance = onStreetFace(x, z) && along % 24 >= 9 && along % 24 <= 12;
  if (entrance) {
    // Lanterns standing on the inner floor, one per entrance bay.
    if (along % 24 === 10 && gr + 1 > igr) g.set(ix, gr + 1, iz, "lantern");
    continue;
  }
  if (along % 8 !== 2) continue;
  for (const y of [gr + 2, 7]) {
    if (y > igr && y > gr && y < CORNICE && y !== SPANDREL) g.set(ix, y, iz, "glowstone");
  }
}

// Pass 3: roof plant and parapet lanterns.
function box(x0, x1, z0, z1, y0, y1, block) {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      if (!has(x, z)) continue;
      for (let y = y0; y <= y1; y++) g.set(x, y, z, block);
    }
}
box(10, 18, 6, 12, ROOF + 1, ROOF + 3, "light_gray_concrete");  // mechanical plant
box(60, 72, 20, 28, ROOF + 1, ROOF + 4, "light_gray_concrete"); // cooling towers
box(40, 50, 14, 20, ROOF + 1, ROOF + 2, "stone_bricks");        // roof-top plant

for (const [x, z] of cells) {
  if (!isPerim(x, z)) continue;
  const along = alongOf(x, z);
  if (along % 12 === 6) g.set(x, ROOF + 2, z, "lantern");
}

g.save(`${DIR}/${ID}.nbt`);
