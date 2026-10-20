import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw540883622";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 9, H = 23, D = 5;
const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Footprint lookup: "x,z" -> ground y (block index of the cell's lowest ground)
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const has = (x, z) => gmap.has(`${x},${z}`);

// Facade material language: base course, two storeys of glazing bands
// separated by white concrete spandrels, cornice and a stone parapet cap.
for (const [x, z, gr] of cells) {
  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const onNS = z === 0 || z === D - 1;           // wall runs along x
  const along = onNS ? x : z;                    // position along that wall
  const mullion = corner || along % 2 === 0;     // alternating window bays
  const frontWall = z === 0;                     // street frontage (north side)

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (perim) {
    // Base course
    put(x, gr, z, "polished_andesite");

    // Storey 1 glazing (shopfront)
    for (const y of [gr + 1, gr + 2, gr + 3]) {
      put(x, y, z, mullion ? "white_concrete" : "glass");
    }
    // Storey 1 lintel
    put(x, gr + 4, z, "white_concrete");
    // Storey 2 floor spandrel
    put(x, gr + 5, z, "white_concrete");

    // Storey 2 glazing
    for (const y of [gr + 6, gr + 7, gr + 8]) {
      put(x, y, z, mullion ? "white_concrete" : "glass");
    }
    // Storey 2 sill / head
    put(x, gr + 9, z, "white_concrete");

    // Cornice and parapet cap
    put(x, gr + 10, z, "smooth_stone");
    put(x, gr + 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

    // Entrance door on the frontage, centred
    if (frontWall && x === 4) {
      // Remove the glass block so the door sits in an opening
      const dProps = { facing: "north", hinge: "left", open: "false", powered: "false" };
      put(x, gr + 1, z, "oak_door", { ...dProps, half: "lower" });
      put(x, gr + 2, z, "oak_door", { ...dProps, half: "upper" });
    }

    // Warm light behind some storey-2 glazing: glowstone in the interior cell
    if (!corner && !mullion && (x + z) % 4 === 1) {
      let ix = x, iz = z;
      if (z === 0) iz = 1;
      else if (z === D - 1) iz = D - 2;
      else if (x === 0) ix = 1;
      else if (x === W - 1) ix = W - 2;
      if (has(ix, iz) && (ix !== x || iz !== z)) put(ix, gr + 7, iz, "glowstone");
    }
  } else {
    // Interior: floor slabs only, air gap behind the glass
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    // Roof deck
    put(x, gr + 10, z, "smooth_stone");
  }
}

// Roof plant: a small mechanical box on the roof, set on the roof deck
const plant = [[2, 2], [3, 2]];
for (const [x, z] of plant) {
  if (!has(x, z)) continue;
  const gr = gmap.get(`${x},${z}`);
  put(x, gr + 11, z, "light_gray_concrete");
}

// Ensure top plant layer doesn't float: only placed on roof deck cells above
g.save(`${dir}/${id}.nbt`);
