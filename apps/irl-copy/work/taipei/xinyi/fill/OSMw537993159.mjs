import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537993159";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 16 x 12, roof about 11 blocks above lowest ground.
// Reads as a two-storey 1990s commercial block: pale tiled concrete, tinted glass,
// a shopfront at street level, a cornice and a plant box on the roof.
const W = 16, H = 23, D = 12;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Perimeter cells and the direction(s) they face outward.
const missingOf = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isPerim = (x, z) => missingOf(x, z).length > 0;

// Door: centre-most cell on the south (z max) face.
const southCells = cells
  .filter(([x, z]) => z === Math.max(...cells.map(c => c[1])) && isPerim(x, z))
  .map(c => c[0])
  .sort((a, b) => a - b);
const zMax = Math.max(...cells.map(c => c[1]));
const doorX = southCells.length ? southCells[Math.floor(southCells.length / 2)] : -1;

// 1. Foundation, floor slabs, storey lines, roof slab.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_quartz");                  // ground floor slab
  put(x, gr + 5, z, "smooth_quartz");              // storey line / first floor slab
  put(x, gr + 10, z, "light_gray_concrete");       // roof slab
}

// 2. Walls: perimeter cells only.
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const miss = missingOf(x, z);
  // Along-face index: x on north/south faces, z on east/west faces.
  const onZFace = miss.some(([, dz]) => dz !== 0);
  const along = onZFace ? x : z;
  const pier = along % 3 === 0;
  const isDoorCell = onZFace && z === zMax && x === doorX;

  // Plinth at floor level.
  put(x, gr, z, "polished_andesite");

  // Storey 1 (rel 1..4): shopfront glazing, transom band at rel 4.
  for (let r = 1; r <= 3; r++) {
    const y = gr + r;
    if (isDoorCell && (r === 1 || r === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "south",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (pier) put(x, y, z, "white_concrete");
    else put(x, y, z, "glass_pane", PANE);
  }
  put(x, gr + 4, z, "white_concrete");              // band course

  // Storey 2 (rel 6..9): tinted glass windows between concrete piers.
  for (let r = 6; r <= 9; r++) {
    const y = gr + r;
    if (r === 9) { put(x, y, z, "white_concrete"); continue; }
    if (pier) put(x, y, z, "white_concrete");
    else put(x, y, z, "cyan_stained_glass_pane", PANE);
  }

  // Cornice and parapet.
  put(x, gr + 10, z, "smooth_quartz");
  put(x, gr + 11, z, "white_concrete");
}

// 3. Warm light behind some upper windows: glowstone one cell inside.
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const miss = missingOf(x, z);
  if (miss.length !== 1) continue;
  const onZFace = miss[0][1] !== 0;
  const along = onZFace ? x : z;
  const pier = along % 3 === 0;
  if (pier || along % 6 !== 1) continue;
  const [mdx, mdz] = miss[0];
  const ix = x - mdx, iz = z - mdz;          // inward neighbour
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  put(ix, gr + 7, iz, "glowstone");
}

// 4. Roof plant box on the roof slab, clear of the parapet.
for (let x = 5; x <= 10; x++) {
  for (let z = 4; z <= 7; z++) {
    if (!has(x, z) || isPerim(x, z)) continue;
    const gr = G(x, z);
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
