import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw542608953.cells.json`, "utf8"));

// 23 x 23 x 15 footprint box. Record: ~11 blocks to roof above lowest ground,
// so a two-storey (5 blocks per storey) mid-century concrete shophouse with
// a shopfront ground floor, a glazed upper storey, cornice and parapet.
const W = 23, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const ROOF = 10;   // roof slab layer (top of storey 2 + cornice)
const PARAPET = 11; // parapet course on the edge
const FLOOR2 = 5;   // storey line between floors
const SPAN = 9;     // spandrel below the upper window band

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const groundOf = (x, z) => G.get(`${x},${z}`);
const set = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const missing = (x, z) => [!has(x - 1, z), !has(x + 1, z), !has(x, z - 1), !has(x, z + 1)];
const faceCount = (x, z) => missing(x, z).filter(Boolean).length;
const isEdge = (x, z) => faceCount(x, z) > 0;

// Front (street) face: the north (z-min) side where it is exposed.
const frontCells = cells
  .filter(([x, z]) => !has(x, z - 1))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const doorX = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;

for (const [x, z, gr] of cells) {
  const ground = gr;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const m = faceCount(x, z);
  const corner = m >= 2;
  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  // Position along the exposed face, used for mullion rhythm.
  const u = zFace ? x : z;
  const mullion = corner || u % 2 === 0;

  // Interior floor slabs at each storey line (no interiors, just slabs).
  if (!edge) {
    set(x, FLOOR2, z, "smooth_stone");
  }

  // Roof slab over the whole footprint.
  set(x, ROOF, z, "smooth_stone");

  if (edge) {
    for (let y = ground; y < ROOF; y++) {
      let id = "white_concrete";
      if (y === ground) id = "gray_concrete";              // base course
      else if (y === FLOOR2) id = "smooth_stone";          // storey belt
      else if (y >= 1 && y <= 4 && y > ground) {           // ground floor shopfront
        id = mullion ? "white_concrete" : "glass";
      } else if (y >= 6 && y <= 8) {                       // upper window band
        id = mullion ? "white_concrete" : "light_blue_stained_glass";
      } else if (y === SPAN) id = "white_concrete";        // spandrel
      set(x, y, z, id);
    }
    // Parapet course on the edge.
    set(x, PARAPET, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

    // Warm light behind some upper windows.
    if (!corner && !mullion) {
      let dx = 0, dz = 0;
      if (!has(x - 1, z)) dx = 1;
      else if (!has(x + 1, z)) dx = -1;
      else if (!has(x, z - 1)) dz = 1;
      else dz = -1;
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && !isEdge(ix, iz) && (u % 4 === 1)) {
        set(ix, 7, iz, "glowstone");
      }
    }
  }

  // Rooftop plant boxes on interior cells.
  if (!edge && (x * 3 + z * 5) % 7 === 0) {
    set(x, PARAPET, z, "light_gray_concrete");
  }
}

// Entrance on the street face: double door with a small canopy-ledge above.
if (doorX !== null) {
  const z = 0;
  const gr = groundOf(doorX, z);
  if (gr !== undefined) {
    set(doorX, gr, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    set(doorX, gr + 1, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Lantern over the door, a warm light at dusk.
    set(doorX, gr + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/OSMw542608953.nbt`);
