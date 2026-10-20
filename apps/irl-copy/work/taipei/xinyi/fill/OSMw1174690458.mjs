import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey concrete shophouse block: white-tiled concrete frame,
// stone base and parapet, dark-timber shop sign band, glass shopfronts below,
// glazed window bays above, warm lit rooms behind some upper windows.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690458";
const W = 26, H = 23, D = 36;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minG = Infinity, minX = Infinity, maxX = -Infinity;
for (const [x, z, gy] of cells) {
  ground.set(key(x, z), gy);
  minG = Math.min(minG, gy);
  minX = Math.min(minX, x);
  maxX = Math.max(maxX, x);
}
const top = minG + 11;           // roof about 11 blocks above lowest ground
const cx = Math.floor((minX + maxX) / 2); // centre column for the street door

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const DIRS = [
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 1, dz: 0, name: "east" },
];

const inFoot = (x, z) => ground.has(key(x, z));
const exteriorFaces = (x, z) => DIRS.filter((f) => !inFoot(x + f.dx, z + f.dz));

// Pick the facade block for an exterior face at height y.
function facade(face, x, z, y, gy) {
  const rel = y - minG;
  const u = face.dz !== 0 ? x : z; // coordinate running along the face
  const window = u % 4 === 1 || u % 4 === 2;

  if (rel === 0) return { id: "stone_bricks" };
  if (rel === 4) return { id: "dark_oak_planks" };     // shop sign band
  if (rel === 5) return { id: "light_gray_concrete" }; // storey line
  if (rel === 9) return { id: "smooth_stone" };        // cornice
  if (rel === 10) return { id: "stone_bricks" };       // parapet

  if (rel >= 1 && rel <= 3) {                          // ground-floor shopfront
    if (face.name === "north" && x === cx) {
      if (rel === 1) return { id: "oak_door", props: { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" } };
      if (rel === 2) return { id: "oak_door", props: { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" } };
      return { id: "glass" };
    }
    return window ? { id: "glass" } : { id: "white_concrete" };
  }

  if (rel >= 6 && rel <= 8) {                          // upper storey bays
    return window ? { id: "glass" } : { id: "white_concrete" };
  }
  return { id: "white_concrete" };
}

// Pass 1: foundations, interior floor slabs and roof slabs.
for (const [x, z, gy] of cells) {
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");
  const exterior = exteriorFaces(x, z).length > 0;
  if (!exterior) {
    for (let y = gy; y < top; y++) {
      const rel = y - minG;
      if (rel === 0 || rel === 5) put(x, y, z, "smooth_stone");
      else if (rel === 10) put(x, y, z, "light_gray_concrete");
    }
    // rooftop plant units
    if (x % 7 === 3 && z % 9 === 4) put(x, top, z, "light_gray_concrete");
  }
}

// Pass 2: exterior walls with facade articulation.
for (const [x, z, gy] of cells) {
  const faces = exteriorFaces(x, z);
  if (faces.length === 0) continue;
  const order = ["north", "south", "west", "east"];
  faces.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  const face = faces[0];
  for (let y = gy; y < top; y++) {
    const b = facade(face, x, z, y, gy);
    put(x, y, z, b.id, b.props);
  }
}

// Pass 3: warm light behind selected upper-floor glass, in the interior cell one step inward.
for (const [x, z, gy] of cells) {
  const faces = exteriorFaces(x, z);
  if (faces.length === 0) continue;
  const face = faces[0];
  const u = face.dz !== 0 ? x : z;
  const y = minG + 7;
  if (u % 8 !== 1 || y < gy || y >= top) continue;
  const ix = x - face.dx, iz = z - face.dz;
  if (!inFoot(ix, iz)) continue;
  if (exteriorFaces(ix, iz).length > 0) continue;
  put(ix, y, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
