// NYC1087733: 10 West 49th Street, 1950 commercial and office block. Eight storeys of pale limestone-clad office
// on a granite base, steel-framed ribbon windows with iron mullions, a smooth-stone parapet and cornice, and a
// gravel roof with one mechanical box. The street front is the south face (z 27): a glazed shopfront on a granite
// base with a central iron door and warm lamps behind the glass. Lidar gives one flat roof tier for the whole lot.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 17, D = 28;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1087733.cells.json`, "utf8"));

// Footprint and lidar roof per cell. Readings under 12 are drop-outs at the ground (the north edge, one pit at
// (14, 26)); they take the median of their built neighbours. The block then sits on one flat tier: the median.
const fp = Array.from({ length: D }, () => Array(W).fill(false));
const raw = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, , r] of cells) { fp[z][x] = true; raw[z][x] = r; }
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && fp[z][x];
const median = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const all = [];
const sm = Array.from({ length: D }, () => Array(W).fill(null));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!fp[z][x]) continue;
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const xx = x + dx, zz = z + dz;
    if (inFp(xx, zz) && raw[zz][xx] >= 12) near.push(raw[zz][xx]);
  }
  sm[z][x] = raw[z][x] >= 12 ? raw[z][x] : (near.length ? median(near) : 24);
  all.push(sm[z][x]);
}
const H = Math.round(median(all));          // flat roof tier: solid up to H-1, parapet at H, cornice at H+1
const TOP = H - 1;                          // roof surface (gravel) and the top window row
const STREET_Z = D - 1;                     // south face: 49th Street frontage

// Outward faces of a footprint cell: [dx, dz] pointing at a missing cell.
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const outs = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));

// Position of a face cell along its face, and the first and last cell of that face run.
const runs = new Map();
const key = (n, x, z) => (n[0] !== 0 ? `${n[0]},x${x}` : `${n[1]},z${z}`);
const along = (n, x, z) => (n[0] !== 0 ? z : x);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!fp[z][x]) continue;
  for (const n of outs(x, z)) {
    const k = key(n, x, z), t = along(n, x, z), r = runs.get(k) ?? { lo: t, hi: t };
    r.lo = Math.min(r.lo, t); r.hi = Math.max(r.hi, t); runs.set(k, r);
  }
}

const PANE = "light_blue_stained_glass_pane";
const BARS = "iron_bars";
// Panes and bars join along their face: an east/west face runs along z, a north/south face along x.
const joins = (n) => (n[0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
const doorHalf = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

const g = new Voxels([17, 37, 28]);
const carve = [];      // window pockets (inward cell, y) and lamps, placed after the solid pass
const lamps = [];

// Pass 1: the solid mass, the roof surface and the facade.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!fp[z][x]) continue;
  const os = outs(x, z);
  if (!os.length) {                          // interior: solid to the roof surface
    for (let y = 0; y < TOP; y++) g.set(x, y, z, "stone");
    g.set(x, TOP, z, "gravel");
    continue;
  }
  const corner = os.length >= 2;
  const n = os[0];
  const street = n[1] === 1 && z === STREET_Z;
  const r = runs.get(key(n, x, z));
  const t = along(n, x, z);
  for (let y = 0; y < TOP + 1; y++) {
    let b = "calcite", s = null, pane = false;
    if (street && (y === 1 || y === 2)) {    // shopfront: granite piers, glass, central iron door
      if (x === 7 || x === 16) b = "polished_granite";
      else if (x === 11) { b = "iron_door"; s = doorHalf(y === 1 ? "lower" : "upper"); }
      else if (x === 10 || x === 12) { b = BARS; s = joins(n); }
      else { b = PANE; s = joins(n); pane = true; }
    } else if (y === 0) {
      b = "polished_granite";                // base course
    } else if (y % 3 === 0) {
      b = street && y === 3 ? "polished_granite" : "smooth_stone";   // storey lines; sign band over the shop
    } else if (corner || t === r.lo || t === r.hi) {
      b = "calcite";                         // piers
    } else if ((t - r.lo) % 3 === 0) {
      b = BARS; s = joins(n);                // mullions: the frame between panes
    } else {
      b = PANE; s = joins(n); pane = true;   // the glass
    }
    g.set(x, y, z, b, s ?? undefined);
    // Behind a pane: an air pocket one cell deep, within the window band, never through the roof row.
    if (pane && y !== TOP) {
      carve.push([x - n[0], y, z - n[1]]);
      const storey = Math.floor(y / 3);
      if (street && y === 1 && (x === 8 || x === 14)) lamps.push(["glowstone", null, x - n[0], y, z - n[1]]);
      else if (!street && y % 3 === 1 && storey >= 1 && (t + 2 * storey) % 4 === 3)
        lamps.push(["lantern", { hanging: "false", waterlogged: "false" }, x - n[0], y, z - n[1]]);
    }
  }
  // Parapet, then a cornice slab on it.
  g.set(x, H, z, "smooth_stone");
  g.set(x, H + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Roof plant: one iron mechanical box on the gravel, inside the parapet.
for (let y = H; y <= H + 1; y++) for (let z = 9; z <= 11; z++) for (let x = 5; x <= 7; x++) g.set(x, y, z, "iron_block");

// Pass 2: pockets behind the glass, then the lamps in them.
for (const [x, y, z] of carve) g.set(x, y, z, "air");
for (const [b, s, x, y, z] of lamps) g.set(x, y, z, b, s ?? undefined);

const out = `${DIR}/NYC1087733.nbt`;
const res = g.save(out);
console.log(JSON.stringify({ roofTier: H, cells: cells.length, ...res, file: out }));
