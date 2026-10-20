import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey 1970s-80s Taipei street-front commercial block: cream quartz-tile
// facade, granite base, light-grey storey lines, glazed bays, cornice and parapet,
// flat roof with plant boxes. Each cell is its own column on its own ground.
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/OSMw539951332.cells.json`, "utf8"));

const W = 23, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundAt = new Map();
for (const [x, z, gr] of cells) groundAt.set(key(x, z), gr);
const inside = (x, z) => groundAt.has(key(x, z));

// outward normals: [dx, dz, name]
const NORMALS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const exposedFaces = (x, z) => NORMALS.filter(([dx, dz]) => !inside(x + dx, z + dz));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Front entrance: south-facing exposed cell nearest the middle of the width.
let front = null;
for (const [x, z] of groundAt.keys().map(k => k.split(",").map(Number))) {
  if (!exposedFaces(x, z).some(([, dz]) => dz === 1)) continue;
  if (!front || Math.abs(x - 11) < Math.abs(front[0] - 11)) front = [x, z];
}

// Facade material for an exposed wall cell at storey level rel (0 = its ground).
function facadeBlock(x, z, rel, face, gr) {
  const [dx] = face;
  const idx = dx !== 0 ? z : x;              // position along the wall
  const isBay = idx % 3 === 1;               // window bay vs quartz pier
  const isFront = front && x === front[0] && z === front[1] && face[2] === 1 || (front && x === front[0] && z === front[1]);

  if (rel === 0) return { id: "polished_granite" };            // base course
  if (rel === 4 || rel === 5) return { id: "light_gray_concrete" }; // storey line / spandrel
  if (rel === 9) return { id: "smooth_quartz" };              // cornice band
  if (rel === 10) return { id: "smooth_quartz" };             // parapet

  if (rel >= 1 && rel <= 3) {                                 // ground storey
    if (isFront && rel === 1) return { id: "oak_door", props: { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" } };
    if (isFront && rel === 2) return { id: "oak_door", props: { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" } };
    if (isFront && rel === 3) return { id: "lantern", props: { hanging: "true" } };
    if (!isBay) return { id: "smooth_quartz" };
    return { id: "light_blue_stained_glass" };
  }
  if (rel >= 6 && rel <= 8) {                                 // upper storey
    if (!isBay) return { id: "smooth_quartz" };
    return { id: "light_blue_stained_glass" };
  }
  return null;
}

// Pass 1: columns and envelope.
const lightSpots = [];
for (const [x, z, gr] of cells) {
  // foundation, solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = exposedFaces(x, z);
  if (faces.length > 0) {
    const face = faces[0];
    for (let rel = 0; rel <= 10; rel++) {
      const b = facadeBlock(x, z, rel, face, gr);
      if (b) put(x, gr + rel, z, b.id, b.props);
    }
    // warm light behind every other upper-storey window
    const [dx, dz] = face;
    const idx = dx !== 0 ? z : x;
    if (idx % 3 === 1 && idx % 6 === 1) lightSpots.push([x - dx, z - dz, gr]);
  } else {
    // interior: ground deck, storey-two floor deck, roof deck
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 9, z, "light_gray_concrete");
    // roof plant on a few interior cells
    if (x % 7 === 4 && z % 5 === 2) put(x, gr + 10, z, "iron_block");
  }
}

// Pass 2: warm light in the upper storey, just inside the glazed bays.
for (const [x, z, gr] of lightSpots) {
  if (!inside(x, z)) continue;
  if (exposedFaces(x, z).length > 0) continue;
  put(x, gr + 7, z, "glowstone");
}

g.save(`${dir}/OSMw539951332.nbt`);
