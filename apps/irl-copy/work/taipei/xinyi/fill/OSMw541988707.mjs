import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988707";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 23, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const minG = Math.min(...ground.values());

// Vertical plan (1980s-90s Taipei low-rise commercial, 2 storeys, ~11 blocks)
const GF_TOP = minG + 5;   // floor slab between storeys
const ROOF = minG + 10;    // roof slab
const PARAPET = minG + 11; // top of parapet

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const DIRS = {
  W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1],
};
function exposedDirs(x, z) {
  return Object.keys(DIRS).filter(k => {
    const [dx, dz] = DIRS[k];
    return !has(x + dx, z + dz);
  });
}

// Pass 1: foundation, floor slabs, roof slab, roof plant
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  put(x, gr, z, "light_gray_concrete");          // ground plate
  if (GF_TOP > gr) put(x, GF_TOP, z, "light_gray_concrete"); // storey slab
  if (ROOF > gr) put(x, ROOF, z, "gray_concrete");           // roof slab
}

// Pass 2: facades on exposed edges
for (const [x, z, gr] of cells) {
  for (const side of exposedDirs(x, z)) {
    const along = side === "W" || side === "E" ? z : x;
    for (let y = gr; y <= PARAPET; y++) {
      let mat = null;
      if (y === gr) {
        mat = "polished_granite";                       // base course
      } else if (y < GF_TOP) {
        if (y === GF_TOP - 1) mat = "stone_bricks";     // ground lintel
        else if (along % 4 === 0) mat = "light_gray_concrete"; // pier
        else mat = "glass";                             // shopfront glazing
      } else if (y < ROOF) {
        if (y === GF_TOP || y === ROOF - 1) mat = "stone_bricks"; // spandrel bands
        else if (along % 4 === 0) mat = "white_concrete";         // tiled pier
        else mat = "glass";                                       // upper windows
      } else if (y === ROOF) {
        mat = "smooth_stone";                           // cornice
      } else if (y === PARAPET) {
        mat = "light_gray_concrete";                    // parapet cap
      }
      if (mat) put(x, y, z, mat);
    }
  }
}

// Pass 3: entrance on the north face, at the median bay
const northCells = cells
  .filter(([x, z]) => exposedDirs(x, z).includes("N"))
  .sort((a, b) => a[0] - b[0]);
if (northCells.length) {
  const [dx, dz, dgr] = northCells[Math.floor(northCells.length / 2)];
  const ex = dx, ez = dz, eg = dgr;
  put(ex, eg + 1, ez, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, eg + 2, ez, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Pass 4: warm light behind some windows (interior cells only)
for (const [x, z, gr] of cells) {
  for (const side of exposedDirs(x, z)) {
    const [ox, oz] = DIRS[side];
    const ix = x - ox, iz = z - oz;   // inward neighbour
    if (!has(ix, iz) || exposedDirs(ix, iz).length) continue;
    const along = side === "W" || side === "E" ? z : x;
    if (along % 8 === 2) put(ix, GF_TOP + 2, iz, "glowstone");
    if (along % 8 === 6 && GF_TOP - 2 > gr) put(ix, gr + 2, iz, "glowstone");
  }
}

// Pass 5: roof plant on interior roof cells
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (exposedDirs(x, z).length) continue;
  if ((x + z) % 5 === 2 && (x % 3) !== 0) put(x, ROOF + 1, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
