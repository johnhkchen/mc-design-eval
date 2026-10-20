// Record: none. Lidar roof ~11 blocks above lowest ground: two storeys of ~5 blocks,
// a 1990s Xinyi-style commercial block. White concrete and smooth quartz frame,
// blue-tinted glass in a grid of concrete mullions, a stone plinth, a shopfront
// with a dark canopy band over the entrance, a cornice and a parapet, and a
// rooftop plant box. A few warm lights sit behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540296185";
const cells = JSON.parse(readFileSync(`${base}.cells.json`, "utf8"));

const W = 20, H = 23, D = 17;
const ROOF = 11;               // roof slab / parapet top, absolute y
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(key(x, z), Math.max(0, Math.min(gr, ROOF - 3)));
const isIn = (x, z) => gmap.has(key(x, z));
const gAt = (x, z) => gmap.get(key(x, z));

const GLASS = "light_blue_stained_glass";
const FRAME = "white_concrete";
const PLINTH = "polished_andesite";
const SPANDREL = "white_concrete";
const BAND = "smooth_quartz";
const CORNICE = "smooth_quartz";
const SLAB = "light_gray_concrete";
const FOUND = "stone_bricks";

// Pass 1: foundations, floor slabs, roof, walls and window grid.
for (const [x, z, gr] of cells) {
  const edgeN = !isIn(x, z - 1), edgeS = !isIn(x, z + 1);
  const edgeW = !isIn(x - 1, z), edgeE = !isIn(x + 1, z);
  const edge = edgeN || edgeS || edgeW || edgeE;
  const corner = (edgeN || edgeS) && (edgeW || edgeE);
  const along = (edgeN || edgeS) ? x : z;

  // Foundation fill up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // Ground-floor slab, upper-floor slab (if below the roof), and roof.
  g.set(x, gr, z, SLAB);
  if (gr + 5 < ROOF) g.set(x, gr + 5, z, SLAB);
  g.set(x, ROOF, z, edge ? CORNICE : SLAB);

  if (!edge) continue;

  // Facade stack, from plinth to parapet.
  for (let y = gr; y <= ROOF - 1; y++) {
    const r = y - gr;
    let id;
    if (r === 0) id = PLINTH;
    else if (r <= 3) id = (corner || along % 3 === 0) ? PLINTH : GLASS;
    else if (r === 4) id = SPANDREL;
    else if (r === 5) id = BAND;
    else if (y === ROOF - 1) id = CORNICE;
    else if (r <= 8) id = (corner || along % 3 === 0) ? FRAME : GLASS;
    else id = SPANDREL;
    g.set(x, y, z, id);
  }
}

// Pass 2: entrance on the north (z min) face, shopfront canopy band, and warm lights.
const zMin = Math.min(...cells.map(c => c[1]));
const xMin = Math.min(...cells.map(c => c[0]));
const xMax = Math.max(...cells.map(c => c[0]));
const zMax = Math.max(...cells.map(c => c[1]));

for (const [x, z, gr] of cells) {
  const edgeN = !isIn(x, z - 1), edgeS = !isIn(x, z + 1);
  const edgeW = !isIn(x - 1, z), edgeE = !isIn(x + 1, z);
  const edge = edgeN || edgeS || edgeW || edgeE;
  if (!edge) continue;

  // Canopy band over the entrance bay.
  if (edgeN && x >= 8 && x <= 10) {
    g.set(x, gr + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }

  // Entrance door at x = 9 on the north face.
  if (edgeN && x === 9) {
    g.set(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Warm lights just inside selected window bays.
for (const [x, z, gr] of cells) {
  const edgeN = !isIn(x, z - 1), edgeS = !isIn(x, z + 1);
  const edgeW = !isIn(x - 1, z), edgeE = !isIn(x + 1, z);
  const edge = edgeN || edgeS || edgeW || edgeE;
  if (!edge) continue;
  const corner = (edgeN || edgeS) && (edgeW || edgeE);
  if (corner) continue;
  const along = (edgeN || edgeS) ? x : z;
  if (along % 6 !== 2) continue;

  let ix = x, iz = z;
  if (edgeN) iz = z + 1;
  else if (edgeS) iz = z - 1;
  else if (edgeW) ix = x + 1;
  else if (edgeE) ix = x - 1;
  if (!isIn(ix, iz)) continue;
  const ig = gAt(ix, iz);
  // Interior cell is not on the edge (checked by neighbour presence).
  g.set(ix, ig + 2, iz, "glowstone");
  if (ig + 7 < ROOF - 1) g.set(ix, ig + 7, iz, "shroomlight");
}

// Rooftop plant box on the roof, standing on the roof slab.
for (let x = 4; x <= 8; x++) {
  for (let z = 10; z <= 12; z++) {
    if (!isIn(x, z)) continue;
    g.set(x, ROOF + 1, z, SLAB);
    g.set(x, ROOF + 2, z, SLAB);
  }
}
for (const x of [5, 7]) {
  for (const z of [10, 12]) {
    if (!isIn(x, z)) continue;
    g.set(x, ROOF + 3, z, "iron_block");
  }
}

g.save(`${base}.nbt`);
