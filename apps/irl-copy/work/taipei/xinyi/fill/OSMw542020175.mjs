import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020175";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 23 x 23 footprint. Read as a two-storey mid-century Taiwanese commercial block:
// white concrete frame, blue tinted glazing, shopfront ground storey, stone base,
// cornice and parapet with a rooftop water tank.
const W = 23, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const gk = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(gk(x, z), gr);
const has = (x, z) => ground.has(gk(x, z));
const minG = Math.min(...ground.values());

const R = minG + 11;   // roof top (about 11 blocks above lowest ground)
const S1 = minG + 5;   // first-floor line (storey 1 is about 5 blocks)

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Returns a block id for a facade cell at height y, or "air" for an opening.
function facadeBlock(x, z, y, gr) {
  const N = !has(x, z - 1), S = !has(x, z + 1);
  const Wd = !has(x - 1, z), E = !has(x + 1, z);
  const nsFace = N || S;
  const weFace = Wd || E;
  const bay = nsFace ? x : z;
  const pillar = (bay % 3 === 0) || (nsFace && weFace);
  const doorBay = S && x === 11;

  if (y === gr) return "smooth_stone";                       // base course

  if (y < S1) {                                              // ground storey: shopfront
    if (doorBay && y >= gr + 1 && y <= gr + 3) return "air";  // entrance opening
    if (doorBay && y === gr + 4) return "white_concrete";     // lintel over door
    return pillar ? "white_concrete" : "glass";
  }
  if (y === S1) return "light_gray_concrete";                 // storey line

  if (y <= R - 3) {                                           // upper storey
    if (y === S1 + 1) return "light_gray_concrete";           // window sill band
    return pillar ? "white_concrete" : "blue_stained_glass";
  }
  if (y === R - 2) return "smooth_quartz";                    // cornice
  if (y === R - 1) return "white_concrete";                   // parapet
  return "smooth_quartz";                                     // roof cap
}

// 1. Foundations and shell
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const N = !has(x, z - 1), S = !has(x, z + 1);
  const Wd = !has(x - 1, z), E = !has(x + 1, z);
  const facade = N || S || Wd || E;

  for (let y = gr; y <= R; y++) {
    if (facade) {
      const id = facadeBlock(x, z, y, gr);
      if (id === "air") put(x, y, z, "air");
      else put(x, y, z, id);
    } else {
      if (y === gr) put(x, y, z, "smooth_quartz");            // ground floor slab
      else if (y === S1 && gr < S1) put(x, y, z, "smooth_quartz"); // storey floor slab
      else if (y === R) put(x, y, z, "light_gray_concrete");  // roof slab
    }
  }
}

// 2. Warm lights just behind the glass (air gap sits between glass and light)
for (const [x, z, gr] of cells) {
  const N = !has(x, z - 1), S = !has(x, z + 1);
  const Wd = !has(x - 1, z), E = !has(x + 1, z);
  if (!(N || S || Wd || E)) continue;
  if (x === 0 || z === 0 || x === 22 || z === 22) { /* keep edge cells as shell */ }

  let dx = 0, dz = 0;
  if (N) dz = 1;
  else if (S) dz = -1;
  else if (Wd) dx = 1;
  else if (E) dx = -1;

  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  if (ix === x && iz === z) continue;

  const bay = (N || S) ? x : z;
  if (bay % 6 !== 1) continue;
  const interiorIsFacade = !has(ix + 1, iz) || !has(ix - 1, iz) || !has(ix, iz + 1) || !has(ix, iz - 1);
  if (interiorIsFacade) continue;

  const ly1 = gr + 2;
  if (ly1 > gr && ly1 < S1) put(ix, ly1, iz, "glowstone");
  const ly2 = S1 + 3;
  if (ly2 < R - 2) put(ix, ly2, iz, "glowstone");
}

// 3. Rooftop water tank (on the roof slab) and a small mechanical unit
const cx = 11, cz = 11;
let tankOk = true;
for (let dx = -1; dx <= 1; dx++)
  for (let dz = -1; dz <= 1; dz++)
    if (!has(cx + dx, cz + dz)) tankOk = false;
if (tankOk) {
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      for (let y = R + 1; y <= R + 3; y++)
        put(cx + dx, y, cz + dz, y === R + 3 ? "smooth_quartz" : "light_gray_concrete");
}
if (has(3, 3)) {
  put(3, R + 1, 3, "iron_block");
  put(3, R + 2, 3, "chain");
}

g.save(`${DIR}/${ID}.nbt`);
