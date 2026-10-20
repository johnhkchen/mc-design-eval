import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458223";
const W = 16, H = 23, D = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, p) => {
  if (!inB(x, y, z)) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};
const key = (x, z) => `${x},${z}`;

// Footprint and per-cell ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
if (ground.size === 0) {
  g.save(`${DIR}/${ID}.nbt`);
} else {
  const minG = Math.min(...ground.values());
  // Roof about 11 blocks above the lowest ground: walls run rel 0..10
  const T = minG + 11;

  const inFoot = (x, z) => ground.has(key(x, z));
  const isEdge = (x, z) =>
    !inFoot(x - 1, z) || !inFoot(x + 1, z) || !inFoot(x, z - 1) || !inFoot(x, z + 1);

  // Facade by height relative to lowest ground
  const lit = (x, z) => (x * 3 + z) % 5 === 0;
  const facade = (rel, x, z) => {
    const pier = (x + z) % 2 === 0;
    switch (true) {
      case rel === 0: return "polished_granite";                       // base course
      case rel <= 3: return pier ? "stone_bricks" : "light_blue_stained_glass"; // shopfront
      case rel === 4: return "red_concrete";                           // signage band / lintel
      case rel === 5: return "light_gray_concrete";                    // sill
      case rel <= 8:
        if (pier) return "white_concrete";
        return lit(x, z) ? "glowstone" : "gray_stained_glass";         // upper storey windows
      case rel === 9: return "white_concrete";                         // spandrel
      default: return "light_gray_concrete";                           // cornice / coping
    }
  };

  // 1) Foundations under every cell
  for (const [k, gr] of ground) {
    const [x, z] = k.split(",").map(Number);
    for (let y = 0; y < gr; y++) put(x, y, z, "smooth_stone");
  }

  // 2) Ground floor slab on every cell
  for (const [k, gr] of ground) {
    const [x, z] = k.split(",").map(Number);
    put(x, gr, z, "polished_andesite");
  }

  // 3) Walls on boundary cells, floor slabs and roof on all cells
  for (const [k, gr] of ground) {
    const [x, z] = k.split(",").map(Number);
    if (isEdge(x, z)) {
      for (let y = gr; y <= T - 1; y++) {
        put(x, y, z, facade(y - minG, x, z));
      }
    } else {
      // interior: no room fill, only floor slabs per storey and roof
      if (5 + minG >= gr) put(x, minG + 5, z, "white_concrete");
      put(x, minG + 10, z, "light_gray_concrete");
    }
  }

  // 4) Rooftop plant enclosure on some interior cells (above the roof)
  for (const [k, gr] of ground) {
    const [x, z] = k.split(",").map(Number);
    if (isEdge(x, z)) continue;
    if (x >= 4 && x <= 6 && z >= 3 && z <= 5) {
      for (let y = T; y <= T + 1; y++) put(x, y, z, "light_gray_concrete");
    }
  }

  // 5) Entrance on the street-facing (lowest z) edge, near the middle
  const frontZ = Math.min(...[...ground.keys()].map((k) => Number(k.split(",")[1])));
  const frontXs = [...ground.keys()]
    .map((k) => k.split(",").map(Number))
    .filter(([x, z]) => z === frontZ)
    .map(([x]) => x);
  if (frontXs.length) {
    const mid = (Math.min(...frontXs) + Math.max(...frontXs)) / 2;
    const ex = frontXs.reduce((best, x) => (Math.abs(x - mid) < Math.abs(best - mid) ? x : best));
    const gr = ground.get(key(ex, frontZ));
    // clear the shopfront cell and place a door with lintel above
    put(ex, gr + 1, frontZ, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(ex, gr + 2, frontZ, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(ex, gr + 3, frontZ, "red_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
