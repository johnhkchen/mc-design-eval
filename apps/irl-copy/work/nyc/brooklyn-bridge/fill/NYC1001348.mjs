import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1001348.cells.json`, "utf8"));

// 247 Water Street, South Street Seaport, 1837: a four-storey Federal/Greek Revival
// brick tenement. Storeys are 3 blocks tall; stone trim (sills, lintels, cornice)
// in light quartz; a single street door on the low-z front.
const W = 9, H = 26, D = 15;
const g = new Voxels([W, H, D]);

const STOREY = 3;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(`${x},${z}`, { g: gr, r: rf });
const has = (x, z) => map.has(`${x},${z}`);
const faces = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isEdge = (x, z) => faces(x, z).length > 0;

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Snap each cell's lidar roof to whole storeys so the massing is clean tiers.
const top = new Map();
for (const [x, z, gr, rf] of cells) {
  const n = Math.max(1, Math.round((rf - gr) / STOREY));
  top.set(`${x},${z}`, Math.min(H - 1, gr + n * STOREY));
}

// Door: on the low-z edge, nearest the middle of the footprint.
let doorX = null;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (has(x, z - 1)) continue;
  if (doorX === null || Math.abs(x - 4) < Math.abs(doorX - 4)) doorX = x;
}

// Pass 1: foundations, floors, walls, windows, cornice, roof.
for (const [x, z, gr] of cells) {
  const r = top.get(`${x},${z}`);
  const fc = faces(x, z);
  const edge = fc.length > 0;
  const corner = fc.length >= 2;

  // Solid foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: air, with a floor plank on the ground line and each storey line.
    for (let y = gr; y < r - 1; y++) {
      if ((y - gr) % STOREY === 0) put(x, y, z, "spruce_planks");
    }
    put(x, r - 1, z, "stone");
    continue;
  }

  const [dx, dz] = fc[0];
  const along = dx !== 0 ? z : x;
  const paneProps = dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  for (let y = gr; y < r; y++) {
    const rel = y - gr;
    const k = Math.floor(rel / STOREY);
    const within = rel % STOREY;

    // Parapet cap.
    if (y === r - 1) {
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    // Cornice band under the parapet.
    if (y >= r - 3) {
      put(x, y, z, y === r - 3 ? "smooth_quartz" : "bricks");
      continue;
    }
    // Stone sill/lintel course at each storey line, and the base course.
    if (within === 0) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    if (corner) {
      put(x, y, z, "bricks");
      continue;
    }
    // Street door, ground floor, low-z face.
    if (k === 0 && dz === -1 && x === doorX) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: within === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    // Window bays on alternate columns, brick piers between.
    if (along % 2 === 1) {
      put(x, y, z, "glass_pane", paneProps);
    } else {
      put(x, y, z, "bricks");
    }
  }
}

// Pass 2: warm light behind some window bays, in the interior cell just inside the wall.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const fc = faces(x, z);
  if (fc.length !== 1) continue;
  const [dx, dz] = fc[0];
  const along = dx !== 0 ? z : x;
  const r = top.get(`${x},${z}`);
  for (let k = 0; ; k++) {
    const base = gr + k * STOREY;
    if (base + 2 >= r - 3) break;
    if ((along + k) % 3 !== 1) continue;
    if (k === 0 && dz === -1 && x === doorX) continue;
    const ix = x - dx, iz = z - dz;
    if (!has(ix, iz) || isEdge(ix, iz)) continue;
    put(ix, base + 1, iz, "glowstone");
  }
}

g.save(`${DIR}/NYC1001348.nbt`);
