import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537991763";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 12;
const g = new Voxels([W, H, D]);

// Helpers
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));
const minG = Math.min(...ground.values());

// Roof sits about 11 blocks above the lowest ground; cells on higher ground get at least a 6-block wall
const ROOF = minG + 11;

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Find the entrance: exposed north face (z-1 missing), middle cell
const northFace = cells.filter(([x, z]) => !has(x, z - 1)).map(([x]) => x).sort((a, b) => a - b);
const doorX = northFace.length ? northFace[Math.floor(northFace.length / 2)] : null;
const doorZ = doorX !== null ? cells.find(([x, z]) => x === doorX && !has(x, z - 1))[1] : null;

for (const [x, z, gr] of cells) {
  const T = Math.max(ROOF, gr + 6); // roof slab top for this cell

  const exN = !has(x, z - 1), exS = !has(x, z + 1);
  const exW = !has(x - 1, z), exE = !has(x + 1, z);
  const perim = exN || exS || exW || exE;
  const corner = (exN || exS) && (exW || exE);
  const alongX = exN || exS;
  const i = alongX ? x : z;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / base course
  put(x, gr, z, perim ? "polished_granite" : "smooth_stone");

  // Interior floor slab at the first storey line
  if (!perim && gr + 5 < T) put(x, gr + 5, z, "smooth_stone");

  if (perim) {
    for (let y = gr + 1; y <= T - 1; y++) {
      const rel = y - gr;
      let b;
      if (rel <= 3) {
        // Shopfront: glass band between stone pillars
        b = (corner || i % 3 === 0) ? "polished_andesite" : "glass";
      } else if (rel === 4) {
        b = "smooth_stone"; // shopfront lintel
      } else if (rel === 5) {
        b = "smooth_stone"; // storey line
      } else if (rel === 6 || rel === 9) {
        b = "white_concrete"; // sill / lintel frames
      } else if (rel <= 8) {
        if (corner || i % 3 === 0) b = "white_concrete";
        else if ((i + rel) % 5 === 0) b = "glowstone"; // warm lit window
        else b = "glass_pane";
      } else {
        b = "white_concrete"; // upper wall up to cornice
      }
      put(x, y, z, b);
    }

    // Parapet and cap
    put(x, T + 1, z, "white_concrete");
    put(x, T + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Roof slab
  put(x, T, z, "light_gray_concrete");

  // Roof equipment: air-conditioning plant on some interior roof cells
  if (!perim && (x + z) % 4 === 0) put(x, T + 1, z, "iron_block");

  // Entrance on the north face
  if (doorX !== null && x === doorX && z === doorZ) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
