import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542518740";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 20, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

// Distance from the outer edge of the footprint (0 = facade wall, 1 = air-gap ring, 2+ = solid core)
const dist = new Map();
const queue = [];
const nbrs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const edge = nbrs.some(([dx, dz]) => !ground.has(key(x + dx, z + dz)));
  if (edge) { dist.set(key(x, z), 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of nbrs) {
    const k = key(x + dx, z + dz);
    if (ground.has(k) && !dist.has(k)) {
      dist.set(k, d + 1);
      queue.push([x + dx, z + dz]);
    }
  }
}

const put = (x, y, z, b, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Front = south face (highest z). Door sits on the middle bay of that row.
const maxZ = Math.max(...cells.map(c => c[1]));
const frontXs = cells.filter(c => c[1] === maxZ).map(c => c[0]);
const doorX = frontXs.length ? Math.floor((Math.min(...frontXs) + Math.max(...frontXs)) / 2) : -1;

for (const [x, z, gr] of cells) {
  const d = dist.get(key(x, z));
  const bay = (((x + z) % 4) + 4) % 4;
  const roofY = gr + 10;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (d === 0) {
    // Facade wall
    put(x, gr, z, "stone_bricks"); // base course

    // Ground storey shopfronts (gr+1..gr+4)
    const isDoor = z === maxZ && x === doorX;
    for (let y = gr + 1; y <= gr + 4; y++) {
      if (isDoor) {
        if (y === gr + 1) put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (y === gr + 2) put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "light_blue_stained_glass");
      } else if (bay === 0) {
        put(x, y, z, "stone_bricks");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }

    // Storey line
    put(x, gr + 5, z, "smooth_stone");

    // Upper storey windows (gr+6..gr+8), piers, cornice band at gr+9
    for (let y = gr + 6; y <= gr + 8; y++) {
      if (bay === 0 || bay === 3) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass");
    }
    put(x, gr + 9, z, "smooth_stone");

    // Parapet / coping
    put(x, roofY, z, "smooth_stone");
  } else if (d === 1) {
    // Air gap behind the glass, with floor slabs and roof deck
    put(x, gr, z, "gray_concrete");
    put(x, gr + 5, z, "gray_concrete");
    put(x, roofY, z, "gray_concrete");
    // Warm lights behind some windows
    if ((x + z) % 8 === 5) put(x, gr + 2, z, "shroomlight");
    if ((x + z) % 8 === 1) put(x, gr + 7, z, "glowstone");
    if ((x + z) % 12 === 9) put(x, gr + 8, z, "glowstone");
  } else {
    // Solid core, roof deck on top
    for (let y = gr; y < roofY; y++) put(x, y, z, "stone");
    put(x, roofY, z, "gray_concrete");
  }

  // Roof equipment: a few small plant units on the deck, set back from the parapet
  if (d >= 3 && x % 6 === 3 && z % 6 === 3) {
    put(x, roofY + 1, z, "iron_block");
    put(x, roofY + 2, z, "light_gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);
