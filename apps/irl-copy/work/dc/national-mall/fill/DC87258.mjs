import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87258.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87258.nbt";

// 1401 New York Ave NW: late-20th-century Class A office block, pale precast
// concrete piers and spandrels, tinted glass ribbon windows, polished granite
// base, flat parapet roof with low mechanical penthouses. Storeys are 3 blocks.
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 11, H = 33, D = 28;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(x + "," + z, { gr, rf });
const has = (x, z) => map.has(x + "," + z);

const FOUNDATION = "stone_bricks";
const BASE = "polished_granite";
const PIER = "smooth_quartz";
const SPANDREL = "calcite";
const GLASS = "light_blue_stained_glass_pane";
const ROOF = "light_gray_concrete";
const PARAPET = "smooth_quartz";
const PENTHOUSE = "stone_bricks";
const PENTHOUSE_CAP = "smooth_stone_slab";

const edgeOf = (x, z) => ({
  westE: !has(x - 1, z), eastE: !has(x + 1, z),
  northE: !has(x, z - 1), southE: !has(x, z + 1),
});

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const { gr, rf } = map.get(x + "," + z);
  const top = Math.max(rf, gr + 3); // roof surface level (exclusive)

  // foundation fills down to the lowest ground so nothing floats on slopes
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);

  const { westE, eastE, northE, southE } = edgeOf(x, z);
  const xFaces = northE || southE;   // pattern runs along x
  const zFaces = westE || eastE;     // pattern runs along z
  const edge = westE || eastE || northE || southE;
  const corner = xFaces && zFaces;
  const p = xFaces && !zFaces ? x : z;

  g.set(x, gr, z, BASE);

  for (let y = gr; y < top - 1; y++) {
    const rel = (y - gr) % 3;
    if (rel === 0) {
      if (y > gr) g.set(x, y, z, edge ? SPANDREL : "smooth_stone");
      continue;
    }
    if (!edge) continue; // interior air, no interiors
    if (corner) { g.set(x, y, z, PIER); continue; }
    const pier = p % 3 === 0;
    g.set(x, y, z, pier ? PIER : GLASS);
  }

  // roof cap and parapet at the top layer
  if (edge) {
    g.set(x, top - 1, z, PARAPET);
  } else {
    g.set(x, top - 1, z, ROOF);
    // low penthouses on a few interior cells: a stone box with a slab cap
    if ((x * 7 + z * 3) % 5 === 0 && top + 1 < H) {
      g.set(x, top, z, PENTHOUSE);
      g.set(x, top + 1, z, PENTHOUSE_CAP);
    }
  }
}

// warm lamps inside the interior cells behind the glass (standing on floors)
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const { gr, rf } = map.get(x + "," + z);
  const top = Math.max(rf, gr + 3);
  const { westE, eastE, northE, southE } = edgeOf(x, z);
  if (!(westE || eastE || northE || southE)) continue;
  let dx = 0, dz = 0;
  if (westE) dx = 1; else if (eastE) dx = -1;
  else if (northE) dz = 1; else if (southE) dz = -1;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  const inner = edgeOf(ix, iz);
  if (inner.westE || inner.eastE || inner.northE || inner.southE) continue;
  for (let k = 0; ; k++) {
    const fy = gr + 3 * k;
    if (fy + 2 >= top - 1) break;
    if (k % 2 === 0 && (x + z + k) % 3 === 0) g.set(ix, fy + 1, iz, "glowstone");
  }
}

// main entrance: the northernmost edge cell nearest the middle of the frontage
let door = null;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (!edgeOf(x, z).northE) continue;
  const score = [Math.abs(x - W / 2), z];
  if (!door || score[1] < door.score[1] ||
      (score[1] === door.score[1] && score[0] < door.score[0])) {
    door = { x, z, score };
  }
}
if (door) {
  const { x, z } = door;
  const gr = map.get(x + "," + z).gr;
  // recessed door bay: piers either side, canopy slab above
  g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 1]) {
    if (has(x + dx, z)) {
      g.set(x + dx, gr + 1, z, PIER);
      g.set(x + dx, gr + 2, z, PIER);
    }
  }
  if (gr + 3 < H) g.set(x, gr + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(OUT);
