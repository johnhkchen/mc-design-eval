import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538459510";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// 17 x 23 x 10: two storeys of 5 blocks, parapet to y=11, plus rooftop plant.
const W = 17, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => ground.has(key(x, z));

const put = (x, y, z, block, props) => {
  if (!has(x, z) || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Edge test: a cell is on the perimeter if any side has no footprint neighbour.
const sides = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const isEdge = (x, z) => { const s = sides(x, z); return s.N || s.S || s.W || s.E; };

// Entrance: on the north-facing edge, nearest to the middle of the 17-block front.
const northCells = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => !has(x, z - 1));
northCells.sort((a, b) => Math.abs(a[0] - 8) - Math.abs(b[0] - 8) || a[0] - b[0]);
const doorX = northCells.length ? northCells[0][0] : -1;
const doorZ = northCells.length ? northCells[0][1] : -1;

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(3, gr0));
  const s = sides(x, z);
  const edge = s.N || s.S || s.W || s.E;
  const corner = (s.N || s.S) && (s.W || s.E);
  const idx = (s.N || s.S) ? x : z;
  const win = edge && !corner && idx % 2 === 1;
  const isDoor = x === doorX && z === doorZ;

  // Plinth: solid foundation from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= 11; y++) {
    if (y === gr) {
      put(x, y, z, edge ? "stone_bricks" : "smooth_stone");
    } else if (y <= 3) {
      // Ground-floor shopfront: glass with white piers, door at entrance.
      if (!edge) continue;
      if (isDoor && (y === gr + 1 || y === gr + 2)) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          half, facing: "north", hinge: "left", open: "false", powered: "false",
        });
      } else if (corner || !win || (isDoor && y === gr + 3)) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane");
      }
    } else if (y === 4) {
      if (edge) put(x, y, z, "white_concrete");
    } else if (y === 5) {
      // Storey line / floor slab across the whole footprint.
      put(x, y, z, "smooth_stone");
    } else if (y <= 8) {
      if (edge) {
        put(x, y, z, win ? "light_blue_stained_glass_pane" : "white_concrete");
      } else if (y === 6 && (x * 3 + z) % 5 === 0) {
        // Warm light sitting on the upper floor slab, seen through the glass.
        put(x, y, z, "glowstone");
      }
    } else if (y === 9) {
      if (edge) put(x, y, z, "white_concrete");
    } else if (y === 10) {
      // Cornice on the perimeter, roof slab inside.
      put(x, y, z, edge ? "smooth_stone" : "light_gray_concrete");
    } else if (y === 11) {
      // Parapet.
      if (edge) put(x, y, z, "white_concrete");
    }
  }
}

// Rooftop plant: two stacked boxes on the roof slab, interior cells only.
for (const [x, z] of cells) {
  if (isEdge(x, z)) continue;
  if (x >= 4 && x <= 6 && z >= 3 && z <= 5) {
    put(x, 11, z, "gray_concrete");
    if (x === 5 && z === 4) {
      put(x, 12, z, "smooth_stone");
    } else {
      put(x, 12, z, "gray_concrete");
    }
  }
}

g.save(`${dir}/${id}.nbt`);
