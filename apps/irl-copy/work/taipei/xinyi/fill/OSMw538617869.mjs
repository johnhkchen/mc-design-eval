import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538617869.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538617869.nbt";

// Record: 9 x 16 footprint, roof ~11 above lowest ground. Read as a two-storey
// 1980s Taipei commercial block: stone base, white tiled concrete walls, tinted
// glass windows in pier-and-spandrel grids, a red fascia over a glazed shopfront,
// a light-grey cornice and parapet, and a small rooftop plant enclosure.
const W = 9, H = 23, D = 16;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const k = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(k(x, z), Math.round(gr));

const has = (x, z) => ground.has(k(x, z));
const gnd = (x, z) => ground.get(k(x, z));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) =>
  Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));
const isPerim = (x, z) => exposed(x, z).length > 0;

const zMin = Math.min(...cells.map(c => c[1]));
const zMax = Math.max(...cells.map(c => c[1]));
const xMin = Math.min(...cells.map(c => c[0]));
const xMax = Math.max(...cells.map(c => c[0]));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const PANE = (n, s, e, w) => ({
  north: n ? "true" : "false",
  south: s ? "true" : "false",
  east: e ? "true" : "false",
  west: w ? "true" : "false",
  waterlogged: "false",
});

// Front = exposed north face on the street-side row (lowest z).
const isFront = (x, z) => exposed(x, z).includes("N") && z === zMin;
const frontCells = cells.filter(([x, z]) => isFront(x, z)).map(([x, z]) => x);
const doorX = frontCells.length
  ? frontCells.reduce((best, x) =>
      Math.abs(x - (xMin + xMax) / 2) < Math.abs(best - (xMin + xMax) / 2) ? x : best,
      frontCells[0])
  : null;
const isDoor = (x, z) => isFront(x, z) && x === doorX;

// Pick a rooftop plant enclosure centre: 3x3 of non-perimeter cells nearest the centroid.
const cx = (xMin + xMax) / 2, cz = (zMin + zMax) / 2;
let pen = null, penD = Infinity;
for (const [x, z] of cells) {
  let ok = true;
  for (let dx = -1; dx <= 1 && ok; dx++)
    for (let dz = -1; dz <= 1 && ok; dz++)
      if (!has(x + dx, z + dz) || isPerim(x + dx, z + dz)) ok = false;
  if (!ok) continue;
  const d = Math.hypot(x - cx, z - cz);
  if (d < penD) { penD = d; pen = [x, z]; }
}
const penKeys = new Set();
if (pen) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++)
  penKeys.add(k(pen[0] + dx, pen[1] + dz));

for (const [x, z] of cells) {
  const base = gnd(x, z);
  const perim = exposed(x, z);
  const per = perim.length > 0;
  const corner = perim.length >= 2;
  const face = perim[0];
  const front = per && !corner && face === "N" && z === zMin;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Ground-floor slab / base course.
  put(x, base, z, per ? "polished_andesite" : "smooth_stone");

  // Ground storey (base+1 .. base+4) and upper storey (base+5 .. base+9).
  if (per) {
    const along = face === "N" || face === "S" ? x : z;
    const mullion = corner || along % 3 === 0;

    for (let y = base + 1; y <= base + 9; y++) {
      if (y === base + 5) { put(x, y, z, "light_gray_concrete"); continue; }
      if (y === base + 9) { put(x, y, z, "light_gray_concrete"); continue; }

      if (y === base + 4) {
        put(x, y, z, front ? "red_concrete" : "white_concrete");
        continue;
      }

      const groundRow = y >= base + 1 && y <= base + 3;
      const upperRow = y >= base + 6 && y <= base + 8;

      if (front) {
        if (isDoor(x, z)) {
          if (y === base + 1 || y === base + 2) {
            put(x, y, z, "dark_oak_door", {
              facing: "north",
              half: y === base + 1 ? "lower" : "upper",
              hinge: "left",
              open: "false",
              powered: "false",
            });
          } else {
            put(x, y, z, "light_blue_stained_glass_pane", PANE(false, false, true, true));
          }
        } else {
          put(x, y, z, "light_blue_stained_glass_pane",
            PANE(false, false, has(x + 1, z) && isPerim(x + 1, z), has(x - 1, z) && isPerim(x - 1, z)));
        }
        continue;
      }

      if ((groundRow || upperRow) && !mullion) {
        const isNS = face === "N" || face === "S";
        const pn = !isNS && has(x, z - 1) && isPerim(x, z - 1);
        const ps = !isNS && has(x, z + 1) && isPerim(x, z + 1);
        const pe = isNS && has(x + 1, z) && isPerim(x + 1, z);
        const pw = isNS && has(x - 1, z) && isPerim(x - 1, z);
        put(x, y, z, "light_blue_stained_glass_pane", PANE(pn, ps, pe, pw));
      } else {
        put(x, y, z, "white_concrete");
      }
    }

    // Parapet and cornice.
    put(x, base + 10, z, "light_gray_concrete");
    put(x, base + 11, z, "smooth_quartz");
  } else {
    // Interior: floor slabs and roof deck only; air behind glass.
    put(x, base + 5, z, "light_gray_concrete");
    put(x, base + 10, z, "stone");
  }

  // Warm lights in some upper-storey windows, placed in the air gap just inside.
  if (per && !corner && !front && (x + z) % 3 === 0) {
    const face2 = perim[0];
    const inward = {
      N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0],
    }[face2];
    const ix = x + inward[0], iz = z + inward[1];
    if (has(ix, iz) && !isPerim(ix, iz)) {
      put(ix, base + 7, iz, "shroomlight");
    }
  }

  // Rooftop plant enclosure on top of the roof deck.
  if (penKeys.has(k(x, z))) {
    for (let y = base + 11; y <= base + 13; y++) put(x, y, z, "gray_concrete");
    put(x, base + 14, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(OUT);
