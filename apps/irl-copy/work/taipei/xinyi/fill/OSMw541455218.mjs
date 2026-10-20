import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw541455218: 10 x 18 footprint, roof about 11 blocks above the lowest ground.
// Read as a 1980s-90s Taipei mid-rise commercial block: polished-andesite base,
// white tiled walls, quartz bands and cornice, tinted glass bays, a shopfront entrance
// on the north street face, and a flat roof with a small plant enclosure.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455218";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 23, D = 18;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => G.has(`${x},${z}`);
const groundOf = (x, z) => G.get(`${x},${z}`);

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const minG = Math.min(...cells.map((c) => Math.round(c[2])));
const R = minG + 11;                       // flat parapet row shared by all cells
const isPerim = (x, z) =>
  !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// Faces that are exposed to the outside for a footprint cell.
function faces(x, z) {
  const f = [];
  if (!has(x - 1, z)) f.push({ dx: 1, dz: 0, u: z - minZ });
  if (!has(x + 1, z)) f.push({ dx: -1, dz: 0, u: z - minZ });
  if (!has(x, z - 1)) f.push({ dx: 0, dz: 1, u: x - minX });
  if (!has(x, z + 1)) f.push({ dx: 0, dz: -1, u: x - minX });
  return f;
}

// Entrance: north face (z-1 missing), on the lowest ground, nearest the centre.
const cx = (minX + maxX) / 2;
let doorX = null, doorZ = null, best = Infinity;
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  if (has(x, z - 1)) continue;
  const score = Math.abs(x - cx) + (gr === minG ? 0 : 100);
  if (score < best) { best = score; doorX = x; doorZ = z; }
}

// Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");
}

// Main shell, one column per footprint cell.
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  if (gr >= R) continue;
  const perim = isPerim(x, z);
  const fc = faces(x, z);
  const isDoor = perim && x === doorX && z === doorZ;

  for (let y = gr; y <= R && y < H; y++) {
    const rel = y - gr;

    if (!perim) {
      // Interior: floor slabs and roof slab only, air elsewhere (no interiors).
      if (rel === 0) g.set(x, y, z, "polished_andesite");
      else if (y === R - 1) g.set(x, y, z, "light_gray_concrete");
      else if (rel % 5 === 0 && y < R - 1) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Perimeter facade.
    if (rel === 0) { g.set(x, y, z, "polished_andesite"); continue; }
    if (y === R) { g.set(x, y, z, "white_concrete"); continue; }          // parapet
    if (y === R - 1) { g.set(x, y, z, "smooth_quartz"); continue; }       // cornice
    if (rel % 5 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }     // storey band

    if (isDoor) {
      if (rel === 1) { g.set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (rel === 2) { g.set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (rel === 3 || rel === 4) { g.set(x, y, z, "smooth_quartz"); continue; }
    }

    if (fc.length >= 2) { g.set(x, y, z, "white_concrete"); continue; }   // corner column

    const f = fc[0];
    const mullion = f.u % 3 === 0;
    if (mullion) { g.set(x, y, z, "white_concrete"); continue; }
    const ground = rel < 5;
    g.set(x, y, z, ground ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane");
  }
}

// Warm lights behind some glass: place in the interior air cell inside the window.
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  if (gr >= R || !isPerim(x, z)) continue;
  const fc = faces(x, z);
  if (fc.length !== 1) continue;
  const f = fc[0];
  if (f.u % 3 === 0) continue;
  const ix = x + f.dx, iz = z + f.dz;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  if (f.u % 6 === 1) {
    const y = gr + 2;
    if (y < R - 1) g.set(ix, y, iz, "glowstone");
  }
  if (f.u % 6 === 4) {
    const y = gr + 7;
    if (y < R - 1) g.set(ix, y, iz, "shroomlight");
  }
}

// Roof plant enclosure: a low block on the roof, inside the footprint.
if (R + 2 < H) {
  for (const [x, z, gr0] of cells) {
    const gr = Math.round(gr0);
    if (gr > R - 2 || isPerim(x, z)) continue;
    const rx = x - minX, rz = z - minZ;
    if (rx >= 3 && rx <= 6 && rz >= 6 && rz <= 11) g.set(x, R, z, "gray_concrete");
    if (rx >= 3 && rx <= 4 && rz >= 6 && rz <= 7) g.set(x, R + 1, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
