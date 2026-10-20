import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1188120077";
const W = 51, H = 23, D = 12;

// Record: no era given. Read as a two-storey (about 11 block) mid-century
// commercial block: white concrete frame, grey piers, blue-glass windows,
// a shopfront on the street face, a flat roof with a parapet and roof plant.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isInterior = (x, z) =>
  has(x, z) && has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z);

const lights = [];

for (const [x, z, gy] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Foundation from y 0 up to the ground under this cell.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone");

  const front = !has(x, z - 1);   // street face (z = 0 side)
  const back = !has(x, z + 1);
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const wall = front || back || west || east;

  // Floor slabs at ground, storey 2, and roof.
  put(x, gy, z, "light_gray_concrete");
  put(x, gy + 5, z, "light_gray_concrete");
  put(x, gy + 10, z, "light_gray_concrete");

  if (!wall) {
    // Roof plant on interior roof cells.
    if (x % 9 === 4 && z === 6) put(x, gy + 11, z, "iron_block");
    continue;
  }

  const alongX = front || back;           // wall runs along x
  const key = alongX ? x : z;
  const corner = (front || back) && (west || east);
  const pier = corner || key % 3 === 0;

  const storeys = [gy, gy + 5];           // storey floor levels
  for (const b of storeys) {
    // Base wall of white concrete for the whole storey.
    for (let y = b + 1; y <= b + 4; y++) put(x, y, z, "white_concrete");

    // Spandrel band under the head of the window.
    put(x, b + 4, z, "white_concrete");

    // Window rows: glass between piers.
    const isGround = b === gy;
    for (let y = b + 1; y <= b + 3; y++) {
      if (pier) {
        put(x, y, z, "gray_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }

    if (isGround && front && !pier) {
      // Shopfront glass sits from the floor up to the lintel; keep as glass.
    }
  }

  // Parapet on the perimeter at roof level.
  put(x, gy + 11, z, "white_concrete");

  // Entrances on the street face.
  if (front && (x === 6 || x === 44)) {
    put(x, gy + 1, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, gy + 2, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }

  // Candidate lamp spots behind ground-floor shopfront glass.
  if (front && !pier && !(x === 6 || x === 44) && isInterior(x, z + 1)) {
    if (x % 6 === 2) lights.push([x, gy + 2, z + 1]);
  }
}

// Warm lamps set behind some shopfront windows (air gap behind the glass).
for (const [x, y, z] of lights) {
  if (has(x, z) && !(x % 3 === 0)) put(x, y, z, "shroomlight");
}

g.save(`${DIR}/${ID}.nbt`);
