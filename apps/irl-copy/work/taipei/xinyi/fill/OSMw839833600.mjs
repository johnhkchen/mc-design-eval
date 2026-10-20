import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833600";
const W = 19, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Safe setter (ignores anything outside the volume)
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Front = northern-most row (smallest z); entrance at the middle of that row.
let frontZ = Infinity;
for (const [x, z] of cells) frontZ = Math.min(frontZ, z);
const frontXs = cells.filter(([, z]) => z === frontZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

// Outward/inward directions for an edge cell
function missingDirs(x, z) {
  const out = [];
  if (!has(x - 1, z)) out.push([-1, 0]);
  if (!has(x + 1, z)) out.push([1, 0]);
  if (!has(x, z - 1)) out.push([0, -1]);
  if (!has(x, z + 1)) out.push([0, 1]);
  return out;
}

for (const [cx, cz, cg] of cells) {
  const x = cx, z = cz, gr = Math.round(cg);
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Base course / ground slab
  put(x, gr, z, edge ? "granite" : "smooth_stone");

  // Storey floor slab between the two storeys (gr+5)
  put(x, gr + 5, z, edge ? "light_gray_concrete" : "smooth_stone");

  // Roof slab with cornice on the edge (gr+10)
  put(x, gr + 10, z, edge ? "light_gray_concrete" : "smooth_stone");

  if (!edge) {
    // Roof plant: small mechanical boxes on a sparse grid
    if (x % 5 === 2 && z % 5 === 2) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "white_concrete");
    }
    continue;
  }

  // Parapet on the perimeter
  put(x, gr + 11, z, "white_concrete");

  // Walls, two storeys of 5 blocks (slab at base, dy 1..4 storey body)
  const dirs = missingDirs(x, z);
  for (let s = 0; s < 2; s++) {
    const b = gr + 5 * s;
    for (let dy = 1; dy <= 4; dy++) {
      const y = b + dy;
      const isDoor = s === 0 && x === doorX && z === frontZ && dy <= 3;
      if (isDoor) continue; // open entrance

      const pillar = (x + z) % 3 === 0;
      if (pillar) {
        put(x, y, z, "light_gray_concrete");
        continue;
      }

      if (dy === 1) {
        put(x, y, z, s === 0 ? "smooth_stone" : "white_concrete");
      } else if (dy === 4) {
        put(x, y, z, s === 0 ? "light_gray_concrete" : "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane");
      }
    }

    // Warm light behind some glass, in the interior cell next to the window
    const lit = s === 0 ? (x + z) % 6 === 0 : (x + z) % 6 === 1;
    if (lit && !(x === doorX && z === frontZ)) {
      for (const [dx, dz] of dirs) {
        const ix = x - dx, iz = z - dz;
        if (has(ix, iz) && !isEdge(ix, iz)) {
          put(ix, b + 2, iz, s === 0 ? "glowstone" : "shroomlight");
        }
      }
    }
  }
}

// Entrance: a lantern just inside the door, on the floor slab
{
  const inZ = frontZ + 1;
  if (has(doorX, inZ)) {
    const gr = Math.round(ground.get(`${doorX},${inZ}`));
    put(doorX, gr + 1, inZ, "lantern", { hanging: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
