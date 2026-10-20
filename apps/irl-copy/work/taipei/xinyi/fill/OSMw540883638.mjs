import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883638";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 18 x 21, roof 11 blocks above lowest ground: a two-storey
// white-tiled commercial block with a stone base, light-blue glazing,
// white pillars, and a light-grey parapet cornice.
const W = 18, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr] of cells) map.set(`${x},${z}`, gr);
const has = (x, z) => map.has(`${x},${z}`);
const ground = (x, z) => map.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Pass 1: foundations, floor slabs, walls, parapet, cornice.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const xf = !has(x - 1, z) || !has(x + 1, z); // wall faces along x
  const zf = !has(x, z - 1) || !has(x, z + 1); // wall faces along z
  const pillar = edge && ((xf && z % 3 === 0) || (zf && x % 3 === 0) || (xf && zf));

  // Storey slabs: ground floor, first floor, roof slab on wall tops.
  g.set(x, gr, z, edge ? "stone_bricks" : "smooth_stone");
  g.set(x, gr + 5, z, "white_concrete");
  g.set(x, gr + 10, z, "light_gray_concrete");

  if (edge) {
    // Ground floor shopfront: glazing with pillars, transom band.
    for (const y of [gr + 1, gr + 2, gr + 3]) {
      g.set(x, y, z, pillar ? "white_concrete" : "light_blue_stained_glass");
    }
    g.set(x, gr + 4, z, "white_concrete");

    // Second floor windows, sill/head band.
    for (const y of [gr + 6, gr + 7, gr + 8]) {
      g.set(x, y, z, pillar ? "white_concrete" : "light_blue_stained_glass");
    }
    g.set(x, gr + 9, z, "white_concrete");

    // Parapet on the roof edge.
    g.set(x, gr + 11, z, "white_concrete");
  }
}

// Pass 2: entrance on the south (+z) face, centre of the frontage.
const mid = Math.floor(W / 2);
for (const x of [mid - 2, mid - 1]) {
  const z = [...map.keys()]
    .map((k) => k.split(",").map(Number))
    .filter(([cx]) => cx === x)
    .map(([, cz]) => cz)
    .filter((cz) => !has(x, cz + 1))[0];
  if (z === undefined) continue;
  const gr = ground(x, z);
  g.set(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Pass 3: warm lights behind glass, and roof plant.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;

  // Inward direction from the first missing neighbour.
  let dx = 0, dz = 0;
  if (!has(x - 1, z)) dx = 1;
  else if (!has(x + 1, z)) dx = -1;
  else if (!has(x, z - 1)) dz = 1;
  else if (!has(x, z + 1)) dz = -1;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isEdge(ix, iz) || ground(ix, iz) !== gr) continue;

  // Ground floor glowstone behind a shopfront window.
  if ((x + z) % 5 === 0 && !(x % 3 === 0 && dz !== 0) && !(z % 3 === 0 && dx !== 0)) {
    g.set(ix, gr + 1, iz, "glowstone");
  }
  // First floor lantern standing on the slab, behind a window.
  if ((x + z) % 4 === 1 && !(x % 3 === 0 && dz !== 0) && !(z % 3 === 0 && dx !== 0)) {
    g.set(ix, gr + 6, iz, "lantern", { hanging: "false" });
  }
}

// Roof plant: two small stone housings on the interior roof.
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if (x >= 5 && x <= 6 && z >= 7 && z <= 8) {
    g.set(x, gr + 11, z, "light_gray_concrete");
    g.set(x, gr + 12, z, "stone_bricks");
  }
  if (x >= 11 && x <= 12 && z >= 13 && z <= 14) {
    g.set(x, gr + 11, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
