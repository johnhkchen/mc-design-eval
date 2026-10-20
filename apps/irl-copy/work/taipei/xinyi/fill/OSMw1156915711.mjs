import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1156915711";
const W = 12, H = 23, D = 19;

// Two-storey 1980s-90s Xinyi mid-rise: white tiled concrete frame, stone base and cornice,
// glass window bands with concrete mullions, a recessed entrance on the north (street) face,
// and a small rooftop plant box.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pass 1: foundation, floor slabs, walls, storey lines, cornice, parapet, windows, interior lights.
for (const [x, z, gr] of cells) {
  const ext = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  const edge = ext.length > 0;
  const corner = ext.length >= 2;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Base course / ground floor slab.
  put(x, gr, z, edge ? "stone_bricks" : "light_gray_concrete");

  // Interior floor slabs (second floor and roof slab) for non-edge cells.
  if (!edge) {
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "light_gray_concrete");
  }

  if (!edge) continue;

  // Exterior wall column from above the base to the parapet.
  for (let y = gr + 1; y <= gr + 11; y++) put(x, y, z, "white_concrete");

  // Spandrels under each window band, cornice at the roof line.
  put(x, gr + 4, z, "light_gray_concrete");
  put(x, gr + 9, z, "light_gray_concrete");
  put(x, gr + 10, z, "stone_bricks");

  // Windows: glass panes between concrete mullions, two storeys.
  for (const [dx, dz] of ext.length === 1 ? [[ext[0][0], ext[0][1]]] : []) {
    const idx = dx !== 0 ? z : x;
    const pillar = corner || idx % 3 === 0;
    for (let s = 0; s < 2; s++) {
      const b = gr + 5 * s;
      for (let y = b + 1; y <= b + 3; y++) {
        put(x, y, z, pillar ? "white_concrete" : "glass_pane");
      }
      // Warm light behind some windows, on the interior floor.
      if (!pillar && idx % 6 === 1) {
        const ix = x - dx, iz = z - dz;
        if (has(ix, iz)) {
          if (s === 0) put(ix, b + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
          else put(ix, b + 1, iz, "shroomlight");
        }
      }
    }
  }
  if (corner) {
    for (let y = gr + 1; y <= gr + 11; y++) put(x, y, z, "white_concrete");
  }
}

// Pass 2: recessed entrance on the north (street) face, nearest to the middle.
const doorX = Math.floor(W / 2);
const northEdge = cells
  .filter(([x, z]) => !has(x, z - 1))
  .sort((a, b) => Math.abs(a[0] - doorX) - Math.abs(b[0] - doorX) || a[0] - b[0]);
if (northEdge.length) {
  const [dx, dz, dg] = northEdge[0];
  put(dx, dg + 1, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dg + 2, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lintel over the door.
  put(dx, dg + 3, dz, "light_gray_concrete");
  // Lanterns flanking the entrance inside the shopfront.
  if (has(dx - 1, dz + 1)) put(dx - 1, dg + 1, dz + 1, "lantern", { hanging: "false", waterlogged: "false" });
  if (has(dx + 1, dz + 1)) put(dx + 1, dg + 1, dz + 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// Pass 3: rooftop plant box and AC unit on the roof slab of an interior cell.
const acX = 4, acZ = Math.floor(D / 2);
if (has(acX, acZ)) {
  const gr = ground.get(`${acX},${acZ}`);
  const edge = DIRS.some(([dx, dz]) => !has(acX + dx, acZ + dz));
  if (!edge) {
    put(acX, gr + 11, acZ, "iron_block");
    if (has(acX + 1, acZ)) put(acX + 1, gr + 11, acZ, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
