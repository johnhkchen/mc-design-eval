// 55 West 47th Street, 1963 office block (Midtown). Read from the lidar roof per cell: a 3x3 median over the
// footprint (holes filled from neighbours) gives flat tiers at 9 (3 storeys), 24 (8 storeys, the podium and the south
// wing), 33 (11 storeys, the office slab) and 36 (the crown, 12 storeys and a parapet, 37 blocks in all).
// Every storey is 3 blocks: a solid spandrel course at 3s (floor and spandrel together), two window rows above it.
// The outer ring is a one-block shell; behind its glass is air, and lights sit in some of those air gaps on the
// floor slab. The deck of each tier is solid, so each storey stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034472.cells.json`, "utf8"));
const W = 24, D = 28, HEIGHT = 49;

// Lidar roof per cell: holes (0) filled from their neighbours, then a 3x3 median to lose the noise.
const R = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, , r] of cells) R[z][x] = r;
const near = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const a = R[z + dz]?.[x + dx]; if (a) v.push(a);
  }
  return v;
};
const median = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
for (let pass = 0; pass < 3; pass++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!R[z][x]) { const v = near(x, z); if (v.length) R[z][x] = median(v); }
}
const S = Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => median(near(x, z))));

// Flat tiers: the roof height of each cell's solid deck is T; its parapet (if on the edge) sits at T.
const tierOf = (r) => (r <= 12 ? 9 : r <= 28 ? 24 : r <= 35 ? 33 : 36);
const T = S.map((row) => row.map(tierOf));
const top = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : T[z][x]);

// Neighbours that leave the cell open at height y: outside the footprint, or lower than y.
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z, y) => SIDES.filter(([dx, dz]) => top(x + dx, z + dz) <= y);
const axisOf = ([dx]) => (dx ? "z" : "x");   // a wall facing east or west runs along z; facing north or south along x

const g = new Voxels([W, HEIGHT, D]);
const lights = [];

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const H = T[z][x];
  for (let y = 0; y <= H; y++) {
    const ex = exposed(x, z, H - 1);      // the ring: any side with nothing above the deck next door
    if (y === H) { if (ex.length) g.set(x, y, z, "smooth_quartz"); continue; }   // parapet on the edge
    if (y === H - 1) { g.set(x, y, z, ex.length ? "smooth_quartz" : "gray_concrete"); continue; }   // cornice / roof deck
    const sides = exposed(x, z, y);
    if (y % 3 === 0) {                                // storey line: spandrel and floor slab
      g.set(x, y, z, y === 0 && sides.length ? "polished_andesite" : "white_concrete");
      if (sides.length === 1 && sides[0][1] === 1 && y === 3 && x >= 9 && x <= 12) g.set(x, y, z, "polished_andesite"); // door lintel
      continue;
    }
    if (!sides.length) continue;                      // interior: air (lights are placed behind the glass below)
    if (sides.length >= 2) { g.set(x, y, z, "smooth_quartz"); continue; }   // corner pier
    const [side] = sides;
    const along = axisOf(side) === "x" ? x : z;
    const ground = y < 3;
    if (ground && side[1] === 1 && (x === 10 || x === 11)) continue;       // entrance opening on the 47th Street side
    if (along % 3 === 0) { g.set(x, y, z, ground ? "polished_andesite" : "iron_block"); continue; }   // mullion
    g.set(x, y, z, ground ? "glass" : "gray_stained_glass");
    // warm light in some windows: in the air behind the glass, on the floor slab of its storey
    const ix = x - side[0], iz = z - side[1];
    if (y % 3 === 1 && top(ix, iz) > y && exposed(ix, iz, y).length === 0) lights.push([ix, y, iz, (x * 73 + y * 151 + z * 37) % 17]);
  }
}
for (const [x, y, z, h] of lights) {
  if (h === 0 || h === 14) g.set(x, y, z, "glowstone");
  else if (h === 5) g.set(x, y, z, "lantern");
  else if (h === 11) g.set(x, y, z, "shroomlight");
}

// Entrance on 47th Street: hanging lanterns under the lintel, in the air just inside the opening.
for (const x of [10, 11]) g.set(x, 2, 26, "lantern", { hanging: "true" });

// Roof plant on the crown: one-block units standing on the deck, with air between.
for (let z = 1; z < D - 1; z++) for (let x = 1; x < W - 1; x++) {
  if (T[z][x] === 36 && !exposed(x, z, 35).length && (x * 5 + z * 3) % 13 === 0) g.set(x, 36, z, "light_gray_concrete");
}

const file = `${DIR}/NYC1034472.nbt`;
const out = g.save(file);
console.log(`wrote ${file}: ${out.blocks} blocks, palette ${out.palette}, top y ${Math.max(...T.flat())}`);
