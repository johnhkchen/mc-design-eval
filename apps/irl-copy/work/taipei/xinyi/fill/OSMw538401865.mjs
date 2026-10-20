import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1990s-2000s: two storeys of 5 blocks, a
// white tiled wall with quartz storey lines, tinted glazing in a 3-block bay rhythm,
// a gray plinth, a shopfront-height ground storey, a parapet cornice, and roof plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538401865";
const W = 28, H = 23, D = 18;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const grounds = new Map();
for (const [x, z, gr] of raw) grounds.set(`${x},${z}`, gr);
const minG = Math.min(...grounds.values());

const inFp = (x, z) => grounds.has(`${x},${z}`);
const gnd = (x, z) => grounds.get(`${x},${z}`) - minG;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const missing = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const pane = (x, y, z, n, s, e, w) =>
  put(x, y, z, "cyan_stained_glass_pane", {
    north: String(n), south: String(s), east: String(e), west: String(w), waterlogged: "false",
  });

// Main entrance: middle of the north (min z) street face.
const northCells = [];
for (const [key] of grounds) {
  const [x, z] = key.split(",").map(Number);
  if (!inFp(x, z - 1)) northCells.push(x);
}
northCells.sort((a, b) => a - b);
const doorX = northCells.length ? northCells[Math.floor(northCells.length / 2)] : null;
const doorZ = doorX === null ? null : [...grounds.keys()]
  .map(k => k.split(",").map(Number))
  .find(([x, z]) => x === doorX && !inFp(x, z - 1))?.[1];

for (const [key, rawGr] of grounds) {
  const [x, z] = key.split(",").map(Number);
  const gr = gnd(x, z);
  const ms = missing(x, z);
  const edge = ms.length > 0;
  const corner = ms.length >= 2;

  // Foundation, ground floor slab.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "polished_andesite");

  // Storey slabs and roof deck (interior spans supported by walls).
  put(x, gr + 5, z, "light_gray_concrete");
  put(x, gr + 10, z, "light_gray_concrete");

  // Roof plant on some interior roof cells.
  if (!edge && (x * 3 + z * 7) % 13 === 0) {
    put(x, gr + 11, z, "gray_concrete");
  }

  if (!edge) continue;

  // Exterior wall: one block thick, so the edge cell is the facade.
  const [mdx, mdz] = ms[0];
  const t = mdx !== 0 ? z : x; // position along the face
  const isMullion = corner || t % 3 === 0;
  const isDoor = !corner && mdz === -1 && x === doorX && z === doorZ;

  // Storey line and cornice.
  put(x, gr + 5, z, "quartz_block");
  put(x, gr + 4, z, "white_concrete");
  put(x, gr + 9, z, "white_concrete");
  put(x, gr + 10, z, "smooth_stone");

  // Ground storey plinth.
  if (!isDoor) put(x, gr + 1, z, "gray_concrete");

  // Storey windows (ground: gr+2..3, upper: gr+6..8).
  const windowLevels = [gr + 2, gr + 3, gr + 6, gr + 7, gr + 8];
  for (const y of windowLevels) {
    if (isDoor && (y === gr + 2)) continue;
    if (corner || isMullion) {
      put(x, y, z, "white_concrete");
    } else {
      const nWin = inFp(x + (mdx !== 0 ? 0 : 1), z + (mdx !== 0 ? 1 : 0));
      const pW = inFp(x, z - 1), pS = inFp(x, z + 1);
      const pE = inFp(x + 1, z), pWst = inFp(x - 1, z);
      if (mdx !== 0) pane(x, y, z, pW, pS, false, false);
      else pane(x, y, z, false, false, pE, pWst);
      // Warm light behind the glass, inside the footprint.
      if (((x * 5 + z * 3 + y) % 5) === 0 && (y === gr + 2 || y === gr + 6)) {
        const ix = x - mdx, iz = z - mdz;
        if (inFp(ix, iz) && missing(ix, iz).length === 0) {
          put(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // Ground storey fascia above the shopfronts.
  if (!isDoor) put(x, gr + 4, z, "white_concrete");

  // Entrance: iron door with a glass fanlight above.
  if (isDoor) {
    const facing = "north";
    put(x, gr + 1, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    pane(x, gr + 3, z, false, false, false, false);
  }
}

g.save(`${DIR}/${ID}.nbt`);
