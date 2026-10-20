import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE94-0007-19F: 2005 Xinyi office/residential tower, 19 storeys (~5 blocks each).
// Curtain-wall shaft of light-blue glass in white-concrete piers, granite base with a
// shopfront, stepped crown (setbacks at 80 and 88), roof plant, lit mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0007-19F";
const W = 32, H = 105, D = 43;
const ROOF = 92;   // main roof surface, ~93 blocks above lowest ground
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const k = (x, z) => `${x},${z}`;
const GR = new Map();
for (const [x, z, gr] of cells) GR.set(k(x, z), Math.round(gr));

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance in cells from the footprint edge (edge cells = 1).
const dist = new Map();
const q = [];
for (const [x, z] of cells) {
  if (NB.some(([dx, dz]) => !GR.has(k(x + dx, z + dz)))) {
    dist.set(k(x, z), 1);
    q.push([x, z]);
  }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i];
  const d = dist.get(k(x, z));
  for (const [dx, dz] of NB) {
    const nk = k(x + dx, z + dz);
    if (GR.has(nk) && !dist.has(nk)) {
      dist.set(nk, d + 1);
      q.push([x + dx, z + dz]);
    }
  }
}
const dOf = (x, z) => dist.get(k(x, z)) ?? 1;
const gOf = (x, z) => GR.get(k(x, z));

// Stepped crown: outer ring tops at 80, middle at 88, core at ROOF.
function baseTop(x, z) {
  const d = dOf(x, z);
  const t = d <= 2 ? 80 : d <= 5 ? 88 : ROOF;
  return Math.max(t, gOf(x, z) + STOREY);
}
// Roof plant ring on the core tier.
function isPenthouse(x, z) {
  const d = dOf(x, z);
  return d >= 8 && d <= 10 && baseTop(x, z) === ROOF;
}
function colTop(x, z) {
  return baseTop(x, z) + (isPenthouse(x, z) ? 4 : 0);
}

// A cell's side is exposed at height y if the neighbour is outside the footprint
// or does not reach y.
function exposed(x, z, y) {
  if (y >= colTop(x, z)) return false;
  return NB.some(([dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    if (!GR.has(k(nx, nz))) return true;
    return colTop(nx, nz) < y;
  });
}

// Facade material for an exposed cell at height y.
function facadeBlock(x, z, y) {
  const g = gOf(x, z);
  const rel = y - g;
  const south = !GR.has(k(x, z + 1));
  if (rel < STOREY) {
    // Ground storey: granite base course, shopfront glass, entrance.
    if (rel === 0) return ["polished_granite"];
    if (rel === 4) return ["polished_granite"];          // canopy / lintel band
    if (south && (x === 15 || x === 16) && (rel === 1 || rel === 2)) {
      return ["dark_oak_door", {
        facing: "south",
        half: rel === 1 ? "lower" : "upper",
        hinge: x === 15 ? "right" : "left",
        open: "false",
        powered: "false",
      }];
    }
    if ((x + z) % 4 === 0) return ["polished_granite"];
    return ["light_blue_stained_glass"];
  }
  // Tower storeys: slab band, glass with white-concrete piers, spandrel.
  const r = rel % STOREY;
  if (r === 0) return ["white_concrete"];
  if (r === 4) return ["light_gray_concrete"];
  if ((x + z) % 4 === 0) return ["white_concrete"];
  return ["light_blue_stained_glass"];
}

// Warm lamps behind some tower glass: inward neighbour of a lit window.
const lit = new Set();
for (const [x, z] of cells) {
  const g = gOf(x, z);
  const top = colTop(x, z);
  for (let y = g + STOREY; y < top; y++) {
    const rel = y - g;
    if (rel % STOREY !== 2) continue;
    if (!exposed(x, z, y)) continue;
    if ((x * 7 + z * 11 + y * 13) % 5 !== 0) continue;
    const out = NB.find(([dx, dz]) => !GR.has(k(x + dx, z + dz)));
    const src = out ?? NB.find(([dx, dz]) => GR.has(k(x + dx, z + dz)) && !exposed(x + dx, z + dz, y));
    if (!src) continue;
    const ix = x - src[0], iz = z - src[1];
    if (GR.has(k(ix, iz)) && !exposed(ix, iz, y)) lit.add(`${ix},${y},${iz}`);
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z] of cells) {
  const gr = gOf(x, z);
  const bt = baseTop(x, z);
  const top = colTop(x, z);
  const pH = isPenthouse(x, z);

  // Foundation from y 0 to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  for (let y = gr; y <= top && y < H; y++) {
    if (y === bt || y === top) {
      put(x, y, z, "light_gray_concrete");               // roof / floor slab
    } else if (exposed(x, z, y)) {
      const [id, props] = facadeBlock(x, z, y);
      put(x, y, z, id, props);
    } else {
      const rel = y - gr;
      if (rel % STOREY === 0) put(x, y, z, "white_concrete");   // storey floor slab
      else if (lit.has(`${x},${y},${z}`)) put(x, y, z, "glowstone");
      // otherwise air: behind the glass
    }
  }

  // Parapet on outer edges of the open roof.
  if (!pH) {
    const edgeRoof = NB.some(([dx, dz]) => {
      const nx = x + dx, nz = z + dz;
      return !GR.has(k(nx, nz)) || colTop(nx, nz) < top;
    });
    if (edgeRoof) put(x, top + 1, z, "white_concrete");
  }
}

// Roof mast on the highest central cell, with a warm aviation light at the tip.
let best = null;
for (const [x, z] of cells) {
  if (colTop(x, z) !== ROOF) continue;
  if (!best || dOf(x, z) > dOf(best[0], best[1])) best = [x, z];
}
if (best) {
  const [mx, mz] = best;
  for (let y = ROOF + 1; y <= 103; y++) put(mx, y, mz, "lightning_rod", { facing: "up" });
  put(mx, 104, mz, "sea_lantern");
}

g.save(`${DIR}/${ID}.nbt`);
