import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541376801";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 23, D = 20;
const v = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const inFoot = (x, z) => G.has(`${x},${z}`);
const groundAt = (x, z) => G.get(`${x},${z}`);
const maxG = Math.max(...cells.map(c => c[2]));

// Record: roof about 11 above lowest ground. Keep that, but never let the roof
// sit closer than two storeys above the highest ground under the footprint.
const TOP = Math.min(21, Math.max(11, maxG + 10)); // parapet course at y = TOP

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) v.set(x, y, z, id, props);
  else v.set(x, y, z, id);
};

// Exterior faces of a footprint cell: which sides have no neighbour.
function facesOf(x, z) {
  const f = [];
  if (!inFoot(x, z - 1)) f.push("N"); // street-facing front
  if (!inFoot(x, z + 1)) f.push("S");
  if (!inFoot(x - 1, z)) f.push("W");
  if (!inFoot(x + 1, z)) f.push("E");
  return f;
}

const DOOR_X = 4;
const GLASS = "light_blue_stained_glass";
const PANE = "light_blue_stained_glass_pane";
const WALL = "white_concrete";
const FLOOR = "light_gray_concrete";
const BASE = "smooth_stone";

for (const [x, z, gr] of cells) {
  const faces = facesOf(x, z);
  const exterior = faces.length > 0;
  const face = faces.includes("N") ? "N" : faces.includes("S") ? "S" : faces[0];

  // Foundation fills from y 0 up to this cell's ground, so nothing floats on a slope.
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  // Floor slab at each storey line (solid, so the structure reads as stacked storeys).
  put(x, gr, z, FLOOR);
  put(x, gr + 5, z, FLOOR);

  // Roof deck.
  put(x, TOP - 1, z, BASE);

  if (!exterior) continue;

  // Parapet course.
  put(x, TOP, z, WALL);
  // Cornice band just under the parapet.
  put(x, TOP - 2, z, FLOOR);

  // Position along the face, used for window rhythm.
  const u = (face === "N" || face === "S") ? x : z;
  const isPier = (u === 0 || u === (face === "N" || face === "S" ? W - 1 : D - 1));

  // Ground storey: shopfront on the street front, glazed bays elsewhere.
  for (let y = gr + 1; y <= gr + 4; y++) {
    if (face === "N") {
      if (x === DOOR_X) {
        if (y === gr + 1) put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (y === gr + 2) put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        else if (y === gr + 3) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        else put(x, y, z, WALL);
      } else if (isPier) {
        put(x, y, z, WALL);
      } else if (y <= gr + 3) {
        put(x, y, z, GLASS);
      } else {
        put(x, y, z, WALL);
      }
    } else {
      // Side and rear faces: ground floor windows on a 2-block rhythm.
      const winRow = y === gr + 2 || y === gr + 3;
      if (winRow && u % 2 === 1 && !isPier) put(x, y, z, PANE, { east: "true", west: "true", north: "true", south: "true", waterlogged: "false" });
      else put(x, y, z, WALL);
    }
  }

  // Shopfront sign / awning band over the ground storey on the street front.
  if (face === "N") put(x, gr + 4, z, "red_concrete");

  // Upper storey: window bands with mullions, storey line already set at gr+5.
  for (let y = gr + 6; y <= TOP - 3; y++) {
    const winRow = y === gr + 7 || y === gr + 8;
    if (winRow && u % 2 === 1 && !isPier) {
      put(x, y, z, PANE, { east: "true", west: "true", north: "true", south: "true", waterlogged: "false" });
      // Warm light behind some glass: glowstone one block inside the footprint.
      if ((u + y) % 4 === 0) {
        let nx = x, nz = z;
        if (face === "N") nz = z + 1;
        else if (face === "S") nz = z - 1;
        else if (face === "W") nx = x + 1;
        else if (face === "E") nx = x - 1;
        if (inFoot(nx, nz)) put(nx, y, nz, "glowstone");
      }
    } else {
      put(x, y, z, WALL);
    }
  }
}

// Roof equipment: AC units and a water tank, only where they fit under the height limit.
const acCells = [[2, 3], [3, 3], [2, 4]];
for (const [x, z] of acCells) {
  if (inFoot(x, z) && TOP + 1 < H) {
    put(x, TOP, z, "iron_block");
  }
}
if (TOP + 2 < H) {
  for (let x = 5; x <= 7; x++) {
    for (let z = 12; z <= 14; z++) {
      if (inFoot(x, z)) {
        put(x, TOP, z, "oak_planks");
        put(x, TOP + 1, z, "oak_planks");
      }
    }
  }
}

v.save(`${DIR}/${ID}.nbt`);
