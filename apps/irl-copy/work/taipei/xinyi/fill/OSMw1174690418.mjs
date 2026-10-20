import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1174690418";
const W = 20, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint: key "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// footprint extents
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// edge helpers
const exposed = (x, z) => ({
  mx: !has(x - 1, z), px: !has(x + 1, z),
  mz: !has(x, z - 1), pz: !has(x, z + 1),
});
const isEdge = (x, z) => {
  const e = exposed(x, z);
  return e.mx || e.px || e.mz || e.pz;
};

// entrance: middle cell of the south (+z) street face, non-corner
const southXs = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const e = exposed(x, z);
  if (e.pz && !((e.mx || e.px) && (e.mz || e.pz))) southXs.push(x);
}
southXs.sort((a, b) => a - b);
const doorX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : null;

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // foundation under the building, from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const e = exposed(x, z);
  const edge = e.mx || e.px || e.mz || e.pz;
  const corner = (e.mx || e.px) && (e.mz || e.pz);

  if (!edge) {
    // interior: floor slabs at storey lines and roof deck, air between
    put(x, gr + 0, z, "light_gray_concrete");
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "gray_concrete");

    // roof plant on the deck
    if (x % 5 === 2 && z % 4 === 1) {
      put(x, gr + 11, z, "light_gray_concrete");
    }

    // warm light behind the glazing on a few interior cells near the facade
    const nearEdge =
      (has(x - 1, z) && isEdge(x - 1, z)) || (has(x + 1, z) && isEdge(x + 1, z)) ||
      (has(x, z - 1) && isEdge(x, z - 1)) || (has(x, z + 1) && isEdge(x, z + 1));
    if (nearEdge && (x * 3 + z * 5) % 4 === 0) {
      put(x, gr + 7, z, "glowstone");
    }
    continue;
  }

  // facade cell
  const isDoor = !corner && e.pz && x === doorX;
  // bay index along the facade the cell belongs to
  const idx = (e.mz || e.pz) ? x - minX : z - minZ;
  const winBay = !corner && idx % 3 !== 0;

  for (let off = 0; off <= 10; off++) {
    const y = gr + off;
    let block = null;
    let props = null;

    if (off === 0) {
      block = "polished_granite";                       // base course
    } else if (off === 4) {
      block = "white_concrete";                         // lintel band
    } else if (off === 5) {
      block = "smooth_quartz";                          // storey line
    } else if (off === 9) {
      block = "white_concrete";                         // sill / cornice band
    } else if (off === 10) {
      block = "smooth_quartz";                          // parapet cap
    } else if (isDoor && off === 1) {
      block = "dark_oak_door";
      props = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
    } else if (isDoor && off === 2) {
      block = "dark_oak_door";
      props = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };
    } else if (isDoor && off === 3) {
      block = "light_blue_stained_glass";               // transom
    } else if (corner) {
      block = "white_concrete";                         // corner pilaster
    } else if (winBay) {
      block = "light_blue_stained_glass";               // glazing
    } else {
      block = off <= 3 ? "light_gray_concrete" : "white_concrete"; // piers
    }

    put(x, y, z, block, props);
  }

  // roof: edge cells already capped at offset 10; roof deck inside is at offset 10
}

g.save(`${dir}/${id}.nbt`);
