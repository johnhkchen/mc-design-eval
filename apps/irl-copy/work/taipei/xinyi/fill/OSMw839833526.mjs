import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833526";
const W = 16, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup and lowest ground (y 0 reference for the building's storeys).
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const B = Math.min(...cells.map((c) => c[2]));   // base of the ground floor
const ROOF = B + 10;                              // top roof/cornice course (roof top = B + 11)

// Two storeys of 5 blocks: ground floor shopfront band (rel 0..4), upper storey (rel 5..9), cornice (rel 10).
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const faceOrder = ["south", "east", "north", "west"];
const faceVec = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exteriorFaces = (x, z) =>
  faceOrder.filter((f) => {
    const [dx, dz] = faceVec[f];
    return !has(x + dx, z + dz);
  });

// Facade block for a perimeter cell on a given face at absolute height y.
// u is the position along the face (x for north/south faces, z for east/west faces).
function facade(face, u, y, gy, isFront) {
  const rel = y - B;
  if (y === gy || rel === 0) return ["stone_bricks"];           // base course
  if (rel === 10) return ["smooth_stone"];                       // cornice / parapet cap
  if (rel === 5) return ["smooth_stone"];                       // storey line
  const col = u % 3 !== 0;                                       // window column vs pier

  if (rel < 5) {                                                 // ground floor
    if (isFront) {
      if (rel === 3) return ["red_concrete"];                    // canopy band over shopfront
      if (rel === 4) return ["white_concrete"];
      if (u % 6 === 3) {                                         // entrance door
        return rel === 1
          ? ["oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" }]
          : ["oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" }];
      }
      return rel <= 2 ? ["glass"] : ["white_concrete"];          // shop glazing
    }
    if (rel === 4) return ["white_concrete"];
    if (col && rel === 2) return ["light_blue_stained_glass"];   // window glass
    if (col && (rel === 1 || rel === 3)) return ["light_gray_concrete"]; // sill / head frames
    return ["white_concrete"];
  }

  // Upper storey, rel 6..9
  if (rel === 6 || rel === 8) return col ? ["light_gray_concrete"] : ["white_concrete"];
  if (rel === 7) return col ? ["light_blue_stained_glass"] : ["white_concrete"];
  return ["white_concrete"];
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = exteriorFaces(x, z);
  const perimeter = faces.length > 0;
  const face = perimeter ? faces[0] : null;
  const isFront = face === "south";
  const u = face === "north" || face === "south" ? x : z;

  for (let y = gr; y <= ROOF; y++) {
    if (perimeter) {
      const [id, props] = facade(face, u, y, gr, isFront);
      put(x, y, z, id, props);
    } else {
      // Interior: no air-filled rooms beyond floor slabs and roof.
      if (y === gr || y === B + 5) put(x, y, z, "smooth_stone");
      else if (y === ROOF) put(x, y, z, "light_gray_concrete");
    }
  }

  // Roof equipment on interior roof cells: small mechanical plant boxes.
  if (!perimeter && x % 5 === 2 && z % 4 === 1) {
    put(x, B + 11, z, "light_gray_concrete");
    put(x, B + 12, z, "gray_concrete");
  }
}

// Warm lanterns behind the upper-storey glazing on interior cells.
for (const [x, z, gr] of cells) {
  const perimeter = exteriorFaces(x, z).length > 0;
  if (!perimeter && gr <= B + 5 && (x + z) % 5 === 0) {
    put(x, B + 6, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
