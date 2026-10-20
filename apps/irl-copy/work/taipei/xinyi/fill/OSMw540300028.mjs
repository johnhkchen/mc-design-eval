import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Decided from the lidar roof height (~11 blocks above lowest ground):
// a two-storey 1960s-70s Taipei commercial block. Cream tiled facade with white concrete
// mullions and sills, a ground-floor shopfront with one street entrance, a smooth-stone
// storey line and cornice, a parapet, and a small rooftop plant box.
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540300028.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540300028.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 17, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(x + "," + z, gr);
const has = (x, z) => gmap.has(x + "," + z);

// Faces on which a cell is exposed; u is the coordinate running along that face.
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push({ d: "N", u: x });
  if (!has(x, z + 1)) f.push({ d: "S", u: x });
  if (!has(x - 1, z)) f.push({ d: "W", u: z });
  if (!has(x + 1, z)) f.push({ d: "E", u: z });
  return f;
}

// Entrance on the north (-z, street) face, at the median bay.
const northUs = [];
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (!has(x, z - 1)) northUs.push(x);
}
northUs.sort((a, b) => a - b);
const doorU = northUs.length ? northUs[Math.floor(northUs.length / 2)] : null;

// Rooftop plant box centred on the footprint centroid.
let sx = 0, sz = 0;
for (const [x, z] of cells.map(([a, b]) => [a, b])) { sx += x; sz += z; }
const cx = Math.round(sx / cells.length), cz = Math.round(sz / cells.length);

const FOUNDATION = "stone_bricks";
const GLASS = "light_blue_stained_glass";
const FRAME = "white_concrete";

// Block for a boundary (facade) cell at height y, with ground level gr.
function facadeBlock(x, z, y, gr, fc) {
  const corner = fc.length > 1;
  const u = fc[0].u;
  const d = fc[0].d;
  const pillar = corner || (u % 3 === 0);
  const isDoor = !corner && d === "N" && u === doorU && gr <= 1;

  if (y === gr) return ["polished_andesite"];
  if (y <= 3) {
    if (isDoor) {
      if (y === gr + 1) return ["oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (y === gr + 2) return ["oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
      if (y === 3) return ["smooth_stone_slab", { type: "bottom" }];
    }
    if (pillar) return [FRAME];
    if (y > gr && y <= 2) return [GLASS];
    return [FRAME];
  }
  if (y === 4) return [FRAME];
  if (y === 5) return ["smooth_stone"];
  if (y <= 9) {
    if (pillar) return [FRAME];
    if (y === 6 || y === 9) return [FRAME];
    return [GLASS];
  }
  if (y === 10) return ["smooth_stone"];
  if (y === 11) return [FRAME];
  return null;
}

// Interior cells: only floor slabs and the roof deck; the air between is the gap behind the glass.
function interiorBlock(y, gr) {
  if (y === gr) return ["stone_bricks"];
  if (y === 5) return ["smooth_stone"];
  if (y === 10) return ["light_gray_concrete"];
  return null;
}

function put(x, y, z, b) {
  if (!b) return;
  if (b[1]) g.set(x, y, z, b[0], b[1]);
  else g.set(x, y, z, b[0]);
}

for (const [x, z, gr0] of cells) {
  const gr = Math.min(Math.max(gr0, 0), 10);
  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);

  const fc = faces(x, z);
  const bnd = fc.length > 0;

  for (let y = gr; y <= 10; y++) {
    if (bnd) put(x, y, z, facadeBlock(x, z, y, gr, fc));
    else put(x, y, z, interiorBlock(y, gr));
  }
  if (bnd) put(x, 11, z, facadeBlock(x, z, 11, gr, fc));
}

// Warm lights behind some upper-storey windows (interior air cell next to the glass).
for (const [x, z, gr0] of cells) {
  const fc = faces(x, z);
  if (!fc.length || fc.length > 1) continue;
  const f = fc[0];
  if (f.u % 6 !== 1) continue;
  let ix = x, iz = z;
  if (f.d === "N") iz = z + 1;
  else if (f.d === "S") iz = z - 1;
  else if (f.d === "W") ix = x + 1;
  else ix = x - 1;
  if (!has(ix, iz)) continue;
  if (faces(ix, iz).length) continue;
  const gr = Math.min(Math.max(gr0, 0), 10);
  if (7 <= gr) continue;
  g.set(ix, 7, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Rooftop plant box and lightning rod above the roof deck.
for (let x = cx - 1; x <= cx + 1; x++) {
  for (let z = cz - 1; z <= cz + 1; z++) {
    if (!has(x, z)) continue;
    if (faces(x, z).length) continue;
    g.set(x, 11, z, FRAME);
    g.set(x, 12, z, FRAME);
    g.set(x, 13, z, "smooth_stone_slab", { type: "bottom" });
  }
}
if (has(cx - 1, cz - 1) && !faces(cx - 1, cz - 1).length) {
  g.set(cx - 1, 14, cz - 1, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(OUT);
