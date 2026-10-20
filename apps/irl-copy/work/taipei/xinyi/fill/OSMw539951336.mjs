import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951336";
const W = 13, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  cellMap.set(key(x, z), gr);
  minG = Math.min(minG, gr);
}
const inF = (x, z) => cellMap.has(key(x, z));
const gy = (x, z) => cellMap.get(key(x, z)) - minG;

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isEdge = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Street entrance: prefer the north (z-min) face, then south, west, east.
const faceFacing = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };
const faceOrder = [[0, -1], [0, 1], [-1, 0], [1, 0]];
let entry = null;
for (const [dx, dz] of faceOrder) {
  const cand = cells
    .filter(([x, z]) => isEdge(x, z) && !inF(x + dx, z + dz))
    .map(([x, z]) => ({ x, z }));
  if (cand.length) {
    cand.sort((a, b) => a.x - b.x || a.z - b.z);
    const mid = cand[Math.floor(cand.length / 2)];
    entry = { x: mid.x, z: mid.z, dx, dz, facing: faceFacing[`${dx},${dz}`] };
    break;
  }
}

const cellList = cells.map(([x, z]) => [x, z]);

// Pass 1: foundations, floors, roof deck, walls.
for (const [x, z] of cellList) {
  const G = gy(x, z);

  // Foundation fill up to ground, then floor surface.
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");
  put(x, G, z, "smooth_stone");

  // Storey-2 floor slab and roof deck on every footprint cell.
  put(x, G + 5, z, "light_gray_concrete");
  put(x, G + 10, z, "light_gray_concrete");

  if (!isEdge(x, z)) continue;

  const missing = DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
  const corner = missing.length >= 2;
  const pier = corner || (x + z) % 2 === 0;
  const isEntry = entry && x === entry.x && z === entry.z;

  // Storey 1: base course, shopfront glass with white piers, lintel.
  put(x, G + 1, z, "stone_bricks");
  if (!isEntry) {
    put(x, G + 2, z, pier ? "white_concrete" : "gray_stained_glass");
    put(x, G + 3, z, pier ? "white_concrete" : "gray_stained_glass");
  }
  put(x, G + 4, z, "white_concrete");

  // Storey 2: sill, upper windows with piers, lintel.
  put(x, G + 5, z, "light_gray_concrete");
  put(x, G + 6, z, "light_gray_concrete");
  put(x, G + 7, z, pier ? "white_concrete" : "light_blue_stained_glass");
  put(x, G + 8, z, pier ? "white_concrete" : "light_blue_stained_glass");
  put(x, G + 9, z, "white_concrete");

  // Cornice / parapet cap.
  put(x, G + 10, z, "smooth_quartz");

  // Entrance: double door, hanging lantern, canopy course.
  if (isEntry) {
    const props = { facing: entry.facing, hinge: "left", open: "false", powered: "false" };
    put(x, G + 1, z, "dark_oak_door", { ...props, half: "lower" });
    put(x, G + 2, z, "dark_oak_door", { ...props, half: "upper" });
    put(x, G + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    put(x, G + 4, z, "white_concrete");
  }

  // Warm light behind some upper/shop windows, inside the footprint.
  if (!pier && !isEntry && (x + z) % 3 === 0 && missing.length === 1) {
    const [mdx, mdz] = missing[0];
    const ix = x - mdx, iz = z - mdz;
    if (inF(ix, iz) && !isEdge(ix, iz)) {
      put(ix, G + 2, iz, "glowstone");
    }
  }
}

// Pass 2: rooftop plant on interior roof cells.
for (const [x, z] of cellList) {
  if (isEdge(x, z)) continue;
  if (x % 4 === 2 && z % 4 === 2) {
    const G = gy(x, z);
    put(x, G + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
