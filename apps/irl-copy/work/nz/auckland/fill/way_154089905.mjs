// SO/ Auckland: a hotel tower of the 2000s, pale concrete and blue-tinted glass on a five-storey podium, with three
// setbacks to a plant-room crown. Massing from the lidar roof heights (median-smoothed, so the noise cells read as the
// tiers they sit in): podium 0..19 over the whole footprint, tower 20..39, mid 40..59, crown 60..77 on the core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089905.cells.json", "utf8"));
const W = 42, L = 45, H = 91;
const g = new Voxels([W, H, L]);

const WALL = "white_concrete", PILASTER = "light_gray_concrete", DARK = "gray_concrete", GLASS = "light_blue_stained_glass";
const FLOOR = "smooth_stone", LAMP = "glowstone", DOOR = "glass";

const DIRS = [
  { n: "north", dx: 0, dz: -1 }, { n: "south", dx: 0, dz: 1 },
  { n: "east", dx: 1, dz: 0 }, { n: "west", dx: -1, dz: 0 },
];

// footprint and the lidar roof per cell
const F = new Uint8Array(W * L), roof = new Float32Array(W * L);
for (const [x, z, , r] of cells) { F[z * W + x] = 1; roof[z * W + x] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < L;
const has = (S, x, z) => inside(x, z) && S[z * W + x] === 1;

// 3x3 median of the footprint's roofs: a stray 4 or a 31 becomes the tier it sits in
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const smooth = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (has(F, x + dx, z + dz)) v.push(roof[(z + dz) * W + x + dx]);
  return median(v);
};

const B = new Uint8Array(W * L);            // tower: roof above 50 blocks (about 40 m)
for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) if (has(F, x, z) && smooth(x, z) >= 50) B[z * W + x] = 1;
const erode = (S) => {
  const o = new Uint8Array(W * L);
  for (let z = 0; z < L; z++) for (let x = 0; x < W; x++)
    if (has(S, x, z) && has(S, x - 1, z) && has(S, x + 1, z) && has(S, x, z - 1) && has(S, x, z + 1)) o[z * W + x] = 1;
  return o;
};
const C = erode(B), D = erode(erode(erode(B)));   // mid tier one cell in; crown three cells in

// the outward faces of a cell of region S (a corner has two)
const shellOf = (S, x, z) => DIRS.filter((d) => !has(S, x + d.dx, z + d.dz));

// the entrance: the podium face with the most exposed cells, centred on its run
const ENT = (() => {
  const count = { north: [], south: [], east: [], west: [] };
  for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
    if (!has(F, x, z)) continue;
    const f = shellOf(F, x, z);
    if (f.length !== 1) continue;
    count[f[0].n].push(f[0].n === "north" || f[0].n === "south" ? x : z);
  }
  const best = Object.entries(count).sort((a, b) => b[1].length - a[1].length)[0];
  const us = best[1].sort((a, b) => a - b);
  return { dir: best[0], u: us[us.length >> 1] };
})();
const isEntrance = (face, u) => face && face.n === ENT.dir && Math.abs(u - ENT.u) <= 1;

// one tier: storeys of four blocks from yLo to the cap at yHi - 1 (the tier's roof), a floor slab at each storey
// line, glass in the middle two rows of each storey, a head band above, pilasters at the corners
function tier(R, yLo, yHi, { podium = false } = {}) {
  for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
    if (!has(R, x, z)) continue;
    const faces = shellOf(R, x, z);
    const shell = faces.length > 0, corner = faces.length > 1, face = faces[0];
    const u = face && (face.n === "north" || face.n === "south") ? x : z;
    for (let y = yLo; y < yHi; y++) {
      let b = null;
      if (y === yHi - 1) b = shell ? PILASTER : DARK;                  // the roof: cornice on the edge, terrace beyond
      else if (y % 4 === 0) b = shell ? (podium && y === 0 ? DARK : PILASTER) : FLOOR;   // plinth, floor line, slab
      else if (!shell) b = null;                                       // the air gap behind the glass
      else if (corner) b = PILASTER;
      else if (podium && y === 3 && isEntrance(face, u)) b = DARK;     // the entrance's lintel canopy
      else if (podium && isEntrance(face, u)) b = y <= 2 && u === ENT.u ? DOOR : null;
      else if (y % 4 === 3) b = WALL;                                  // head band
      else b = u % 3 === 0 ? PILASTER : GLASS;                         // mullion, or pane
      if (b) g.set(x, y, z, b);
      // a warm light on the floor behind some panes: it stands on the slab below
      if (b === GLASS && y % 4 === 1 && (x * 31 + z * 17 + y * 7) % 7 === 0 && face) {
        const ix = x - face.dx, iz = z - face.dz;
        if (has(R, ix, iz) && !shellOf(R, ix, iz).length) g.set(ix, y, iz, LAMP);
      }
    }
  }
}

// a one-block parapet on the outer edge of a terrace: the parent tier's exposed cells that the child does not cover
function parapet(P, R, y) {
  for (let z = 0; z < L; z++) for (let x = 0; x < W; x++)
    if (has(P, x, z) && !has(R, x, z) && shellOf(P, x, z).length) g.set(x, y, z, PILASTER);
}

// 1. the podium over the whole footprint, from the ground: a foundation under each cell up to its own ground
for (const [x, z, gnd] of cells) for (let y = 0; y < gnd; y++) g.set(x, y, z, WALL);   // all zero here: the lot is level
tier(F, 0, 20, { podium: true });
parapet(F, B, 20);

// 2. the tower, the mid tier and the crown, each standing on the one below
tier(B, 20, 40);
parapet(B, C, 40);
tier(C, 40, 60);
parapet(C, D, 60);
tier(D, 60, 78);

// 3. the crown's plant room, on the roof
let cx = 0, cz = 0, n = 0;
for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) if (has(D, x, z)) { cx += x; cz += z; n++; }
cx = Math.round(cx / n); cz = Math.round(cz / n);
for (let z = cz - 2; z <= cz + 2; z++) for (let x = cx - 2; x <= cx + 2; x++) {
  if (!has(D, x, z)) continue;
  g.set(x, 78, z, WALL);
  g.set(x, 79, z, PILASTER);
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089905.nbt";
const { blocks, palette } = g.save(out);
console.log(`way_154089905: ${blocks} blocks, ${palette} palette entries -> ${out}`);
