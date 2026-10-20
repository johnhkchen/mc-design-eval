import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833623";
const W = 22, H = 23, D = 24;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Cell classification: edge cells carry the facade, interior cells carry floor slabs and roof.
const isEdge = (x, z) => !(has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1));

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    // Interior: floor slabs per storey, roof deck, no interior volume kept.
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
    put(x, gr + 11, z, "gray_concrete");
    // Roof equipment: cooling towers / plant boxes on a grid.
    if (x % 6 === 3 && z % 6 === 3) {
      put(x, gr + 12, z, "iron_block");
      put(x, gr + 13, z, "light_gray_concrete");
    }
    if (x % 6 === 0 && z % 6 === 0) {
      put(x, gr + 12, z, "chain");
    }
    continue;
  }

  // Edge cell: determine outward normal from the missing neighbour.
  let n;
  if (!has(x, z + 1)) n = [0, 1];
  else if (!has(x, z - 1)) n = [0, -1];
  else if (!has(x + 1, z)) n = [1, 0];
  else n = [-1, 0];

  // Position along the wall.
  const t = n[0] !== 0 ? z : x;
  const isFront = n[0] === 0 && n[1] === 1;
  const isEntrance = isFront && (x === 10 || x === 11);
  // Inward neighbour, used for warm light behind glass.
  const ix = x - n[0], iz = z - n[1];
  const inwardInterior = has(ix, iz) && !isEdge(ix, iz);

  for (let y = gr; y <= gr + 10; y++) {
    if (y === gr) {
      // Base course.
      put(x, y, z, "stone_bricks");
    } else if (y <= gr + 4) {
      // Ground floor shopfront.
      if (isEntrance) {
        if (y === gr + 4) put(x, y, z, "lantern", { hanging: "true" });
        // else leave open as the doorway
      } else if (t % 4 === 0) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass");
      }
    } else if (y === gr + 5) {
      // Storey line / spandrel.
      put(x, y, z, "white_concrete");
    } else if (y <= gr + 9) {
      // Upper storey windows with mullions.
      if (t % 4 === 0) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane");
      }
      // Warm light behind selected windows.
      if (t % 4 === 2 && y === gr + 7 && inwardInterior) {
        put(ix, y, iz, "glowstone");
      }
    } else if (y === gr + 10) {
      // Cornice.
      put(x, y, z, "smooth_stone");
    }
  }

  // Parapet.
  put(x, gr + 11, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
