import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Commercial mid-rise, two storeys plus parapet (roof about 11 blocks above the lowest ground),
// in the white-tiled and glazed style common along Xinyi Road in the 1990s and 2000s.
// Long 121 x 29 frontage: a granite base, a shopfront band at ground, glazed upper storey,
// smooth-quartz storey lines and cornice, and a parapet with roof plant behind it.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1385375983";
const W = 121, H = 23, D = 29;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;
const minG = Math.min(...list.map(c => c[2]));

// footprint: "x,z" -> ground height relative to the lowest ground under the building
const ground = new Map();
for (const [x, z, gr] of list) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, gr - minG);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

// exterior faces: a side is exterior when the neighbouring cell is outside the footprint
const FACES = {
  N: { dx: 0, dz: -1, inX: 0, inZ: 1, facing: "north", axis: "x" },
  S: { dx: 0, dz: 1, inX: 0, inZ: -1, facing: "south", axis: "x" },
  W: { dx: -1, dz: 0, inX: 1, inZ: 0, facing: "west", axis: "z" },
  E: { dx: 1, dz: 0, inX: -1, inZ: 0, facing: "east", axis: "z" },
};
const facesOf = (x, z) =>
  Object.values(FACES).filter(f => has(x,z) && !has(x + f.dx, z + f.dz)).map(f => f);
const isB = (x, z) => has(x, z) && facesOf(x, z).length > 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const pane = f => f.axis === "x"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const door = (f, half) => ({ facing: f.facing, half, hinge: "left", open: "false", powered: "false" });

const cells = [...ground.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr };
});

// Pass 1: foundation, floor slab per storey, roof deck over the whole footprint
for (const { x, z, gr } of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");   // foundation up to ground
  put(x, gr + 5, z, "white_concrete");                          // second-floor slab
  put(x, gr + 10, z, "gray_concrete");                          // roof deck
}

// Pass 2: facade shell on boundary cells, then articulation
for (const { x, z, gr } of cells) {
  const faces = facesOf(x, z);
  if (!faces.length) continue;

  // default column: white wall, granite base, storey lines, cornice, parapet
  for (let h = 0; h <= 11; h++) {
    let id = "white_concrete";
    if (h === 0) id = "polished_granite";
    else if (h === 4 || h === 9) id = "smooth_quartz";
    else if (h === 10) id = "smooth_quartz";
    put(x, gr + h, z, id);
  }

  for (const f of faces) {
    const u = f.axis === "x" ? x : z;
    const ix = x + f.inX, iz = z + f.inZ;
    const inner = has(ix, iz) && !isB(ix, iz);

    // parapet alternating pattern
    put(x, gr + 11, z, u % 2 === 0 ? "smooth_quartz" : "white_concrete");

    // ground storey: shopfront glass, piers, entrances
    const entrance = u % 30 === 15;
    if (entrance) {
      put(x, gr + 1, z, "dark_oak_door", door(f, "lower"));
      put(x, gr + 2, z, "dark_oak_door", door(f, "upper"));
      put(x, gr + 3, z, "white_concrete");
    } else if (u % 6 === 0) {
      for (let h = 1; h <= 3; h++) put(x, gr + h, z, "white_concrete");
    } else {
      for (let h = 1; h <= 3; h++) put(x, gr + h, z, "glass_pane", pane(f));
    }

    // upper storey: framed glazing with piers
    for (let h = 6; h <= 8; h++) {
      if (u % 6 === 0) put(x, gr + h, z, "white_concrete");
      else put(x, gr + h, z, "light_blue_stained_glass_pane", pane(f));
    }

    // warm light behind glass (air gap sits in the interior cell)
    if (inner && u % 6 === 4) put(ix, gr + 6, iz, "glowstone");
    if (inner && !entrance && u % 18 === 10) put(ix, gr, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 3: roof plant on deep interior cells (two cells in from any facade)
for (const { x, z, gr } of cells) {
  if (isB(x, z)) continue;
  const deep = [[1,0],[-1,0],[0,1],[0,-1]].every(([a,b]) => !isB(x + a, z + b) && has(x + a, z + b));
  if (!deep) continue;
  if ((x % 20 === 6 || x % 20 === 7) && z % 9 === 4) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
