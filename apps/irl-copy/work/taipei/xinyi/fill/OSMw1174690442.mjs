import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block, Xinyi district, c. 1980s-90s:
// cream tiled/quartz walls, stone base, cornice and parapet, shopfront glass
// on the ground floor, paired upper windows, and a rooftop plant room.
// Roof sits about 11 blocks above the lowest ground (2 x 5-block storeys + parapet).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690442";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 23, D = 29;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

function put(x, y, z, b, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// Nearest interior footprint neighbour, used to put warm light just behind a window.
function interiorNb(x, z) {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !isPerim(nx, nz)) return [nx, nz];
  }
  return null;
}

// Entrance: the perimeter cell on the highest-z edge nearest the mean x of that edge.
let entrance = null;
{
  const perims = cells.filter(([x, z]) => isPerim(x, z));
  const maxZ = Math.max(...perims.map(([, z]) => z));
  const edge = perims.filter(([, z]) => z === maxZ);
  if (edge.length) {
    const meanX = edge.reduce((s, [x]) => s + x, 0) / edge.length;
    const best = edge.reduce((b, c) => (Math.abs(c[0] - meanX) < Math.abs(b[0] - meanX) ? c : b));
    entrance = [best[0], best[1]];
  }
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (!isPerim(x, z)) {
    // Interior: floor slabs per storey and roof slab, air gaps between.
    put(x, gr, z, "light_gray_concrete");
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "light_gray_concrete");

    // Rooftop plant boxes on a sparse grid.
    if (x % 7 === 3 && z % 9 === 4) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "light_gray_concrete");
    }

    // Warm light placed by the interior edge; actual glow positions are set from the facade pass.
    continue;
  }

  // Perimeter facade column.
  const pat = [1, 2].includes(((x + z) % 4 + 4) % 4); // paired window cells
  const isEntrance = entrance && entrance[0] === x && entrance[1] === z;

  put(x, gr, z, "stone_bricks");                            // base course

  // Ground floor shopfront.
  for (let o = 1; o <= 3; o++) {
    if (isEntrance) {
      put(x, gr + o, z, o <= 2 ? "light_blue_stained_glass" : "smooth_quartz");
    } else {
      put(x, gr + o, z, pat ? "cyan_stained_glass" : "smooth_quartz");
    }
  }

  put(x, gr + 4, z, "polished_andesite");                   // lower belt / canopy line
  put(x, gr + 5, z, "light_gray_concrete");                 // storey line

  // Upper storey windows with sills and lintels.
  put(x, gr + 6, z, pat ? "polished_andesite" : "smooth_quartz");
  put(x, gr + 7, z, pat ? "light_blue_stained_glass" : "smooth_quartz");
  put(x, gr + 8, z, pat ? "light_blue_stained_glass" : "smooth_quartz");
  put(x, gr + 9, z, pat ? "polished_andesite" : "smooth_quartz");

  put(x, gr + 10, z, "stone_bricks");                       // cornice
  put(x, gr + 11, z, "smooth_quartz");                      // parapet

  // Warm light behind selected windows.
  const nb = interiorNb(x, z);
  if (nb) {
    if (!isEntrance && pat && ((x * 5 + z * 2) % 5 === 0)) put(nb[0], gr + 2, nb[1], "glowstone");
    if (pat && ((x * 3 + z * 5) % 7 === 0)) put(nb[0], gr + 7, nb[1], "glowstone");
  }
}

// Entrance canopy projecting outward from the shopfront, attached to the wall.
if (entrance) {
  const [ex, ez] = entrance;
  const gr = ground.get(key(ex, ez));
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = 1; dz <= 2; dz++) {
      if (!has(ex + dx, ez + dz)) put(ex + dx, gr + 4, ez + dz, "gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
