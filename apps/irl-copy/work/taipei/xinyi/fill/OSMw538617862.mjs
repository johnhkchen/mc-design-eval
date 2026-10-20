import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617862";
const W = 7, H = 23, D = 28;

// Reading: 7 x 28 footprint, roof ~11 blocks above lowest ground.
// Read as a 2-storey (5 blocks per storey) white-tile/concrete Xinyi low-rise
// with a dark-wood shopfront on the ground floor, glass-and-pier upper floor,
// a smooth-stone cornice, and a white parapet. Rooftop AC units and a water tank.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);
const minG = Math.min(...ground.values());
const L = (n) => minG + n;           // level relative to lowest ground
const TOP = L(11);                   // parapet layer
const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, b, st) => { if (inB(x, y, z)) g.set(x, y, z, b, st); };

// Pier columns on the long (x-facing) and end (z-facing) walls, corners always piers.
const isPier = (x, z, xFace) => xFace
  ? (z % 4 === 0 || z === 0 || z === D - 1)
  : (x % 3 === 0 || x === 0 || x === W - 1);

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const missX = !has(x - 1, z) || !has(x + 1, z);
  const missZ = !has(x, z - 1) || !has(x, z + 1);
  const edge = missX || missZ;
  const xFace = missX;

  // Base course on the perimeter, floor on the interior.
  put(x, gr, z, edge ? "polished_granite" : "smooth_stone");

  for (let y = gr + 1; y <= TOP; y++) {
    // Storey floor slabs, roof deck and cornice (same band across the whole plan).
    if (y === L(5) || y === L(10)) { put(x, y, z, "smooth_stone"); continue; }
    // Parapet on the perimeter only.
    if (y === L(11)) { if (edge) put(x, y, z, "white_concrete"); continue; }
    if (!edge) continue; // interior stays air behind the glass

    const pier = isPier(x, z, xFace);
    const k = xFace ? z : x; // bay index along the facade
    let b = "white_concrete";

    if (y < L(5)) {
      // Ground floor: shopfront glass between piers, dark wood lintel.
      if (y === L(4)) b = "dark_oak_planks";
      else if (!pier) b = "glass";
    } else if (y > L(5) && y < L(10)) {
      // Upper floor: sills and heads are white, glass pane in the middle.
      if (!pier && (y === L(7) || y === L(8))) b = "glass_pane";
    }

    // Entrance on the z=0 end wall.
    if (!xFace && z === 0 && x === 3 && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
      });
      continue;
    }

    put(x, y, z, b);

    // Warm light behind some glass (inward neighbour is the interior air).
    if (b === "glass" || b === "glass_pane") {
      const ix = xFace ? (x === 0 ? x + 1 : x - 1) : x;
      const iz = xFace ? z : (z === 0 ? z + 1 : z - 1);
      const lit = (y === L(7) && k % 8 === 2) || (y === gr + 2 && k % 8 === 5);
      if (lit && has(ix, iz) && y > gOf(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }
}

// Rooftop equipment on the roof deck (interior cells only).
const interior = (x, z) => has(x, z) && !(!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));
for (const [x, z] of [[1, 3], [2, 3], [1, 4], [2, 4]]) {
  if (interior(x, z)) put(x, L(11), z, "gray_concrete");
}
for (const [x, z] of [[4, 20], [5, 20], [4, 21], [5, 21]]) {
  if (interior(x, z)) {
    put(x, L(11), z, "white_concrete");
    put(x, L(12), z, "white_concrete");
    put(x, L(13), z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
