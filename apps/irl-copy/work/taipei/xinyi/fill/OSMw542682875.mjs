import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682875";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 11;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height of that cell
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

// Faces: name, dx, dz (the neighbour direction that is outside when exposed)
const FACES = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const exposed = (x, z) => FACES.filter(([, dx, dz]) => !has(x + dx, z + dz));

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Entrance: on the south-exposed edge (largest z), nearest the middle in x
const southCells = cells.filter(([x, z]) => exposed(x, z).some((f) => f[0] === "south"));
let entrance = null;
if (southCells.length) {
  const xs = southCells.map((c) => c[0]).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  const sorted = [...southCells].sort((a, b) => (b[1] - a[1]) || (Math.abs(a[0] - mid) - Math.abs(b[0] - mid)));
  entrance = { x: sorted[0][0], z: sorted[0][1] };
}

const GLASS_SHOP = "glass";
const GLASS_UPPER = "light_blue_stained_glass";
const MULLION = "white_concrete";

for (const [x, z, gr] of cells) {
  // Foundation up to the cell's ground, then ground-floor slab
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");

  const ex = exposed(x, z);
  const isExt = ex.length > 0;

  if (isExt) {
    // Base course
    put(x, gr + 1, z, "polished_andesite");

    // Facade rhythm: mullion every third cell along the face
    const face = ex.find((f) => f[0] === "north" || f[0] === "south") ?? ex[0];
    const idx = (face[0] === "north" || face[0] === "south") ? x : z;
    const win = idx % 3 !== 0;

    if (win) {
      put(x, gr + 2, z, GLASS_SHOP);
      put(x, gr + 3, z, GLASS_SHOP);
      put(x, gr + 6, z, GLASS_UPPER);
      put(x, gr + 7, z, GLASS_UPPER);
      put(x, gr + 8, z, GLASS_UPPER);
    } else {
      for (const y of [gr + 2, gr + 3, gr + 6, gr + 7, gr + 8]) put(x, y, z, MULLION);
    }

    // Storey lines, lintels, cornice, parapet
    put(x, gr + 4, z, "light_gray_concrete");
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 9, z, MULLION);
    put(x, gr + 10, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    put(x, gr + 11, z, MULLION);

    // Warm light behind every other upper window, in the interior air cell
    if (win && idx % 2 === 0) {
      const [, dx, dz] = face;
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && exposed(ix, iz).length === 0) {
        put(ix, groundAt(ix, iz) + 7, iz, "glowstone");
      }
    }
  } else {
    // Interior cell: floor slab at storey line and roof deck, air between
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
  }

  // Rooftop plant room in the middle of the roof
  if (!isExt && x >= 6 && x <= 12 && z >= 3 && z <= 7) {
    put(x, gr + 11, z, "light_gray_concrete");
    if (x >= 8 && x <= 10 && z >= 4 && z <= 6) {
      put(x, gr + 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Entrance: double-height door, canopy with lantern, drawn last so it overrides the facade
if (entrance) {
  const { x: ex, z: ez } = entrance;
  const gr = groundAt(ex, ez);
  put(ex, gr + 1, ez, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, gr + 2, ez, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ex, gr + 3, ez, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
