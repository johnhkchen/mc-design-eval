import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s-style office/shop block: two storeys of light cladding, a
// stone base course, a shopfront entrance on the north (street) face, a
// white-pier window grid with glass panes, a parapet with coping, and roof
// plant. Roof sits about 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1024337095";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 23, D = 22;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const inF = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Boundary cell: at least one 4-neighbour is outside the footprint.
function boundary(x, z) {
  return inF(x, z) && (!inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1));
}
// Cells on a north/south-facing wall are indexed by x, others by z.
function faceX(x, z) {
  return !inF(x, z - 1) || !inF(x, z + 1);
}
function idx(x, z) {
  return faceX(x, z) ? x : z;
}
// Street (north) face: the outward side is missing its z-1 neighbour.
function northFace(x, z) {
  return boundary(x, z) && !inF(x, z - 1);
}
function frontEntrance(x, z) {
  return northFace(x, z) && x >= 8 && x <= 13;
}
function isDoor(x, z) {
  return northFace(x, z) && x === 10;
}
function bandOf(x, z, y) {
  const b = gnd(x, z);
  if (y >= b + 1 && y <= b + 3) return "g";
  if (y >= b + 6 && y <= b + 8) return "u";
  return null;
}
function windowCell(x, z, y) {
  if (!boundary(x, z)) return false;
  const band = bandOf(x, z, y);
  if (!band) return false;
  if (idx(x, z) % 3 === 0) return false;           // white piers / frames
  if (frontEntrance(x, z) && band === "g") return false; // shopfront zone
  return true;
}
function isLit(x, z, y) {
  const b = gnd(x, z);
  return windowCell(x, z, y) && y === b + 7 && idx(x, z) % 9 === 4;
}
function isPane(x, z, y) {
  return windowCell(x, z, y) && !isLit(x, z, y);
}

const onOff = (v) => (v ? "true" : "false");

for (const [x, z, b] of cells) {
  // Foundation: solid stone from y 0 up to the ground under this cell.
  for (let y = 0; y < b; y++) put(x, y, z, "stone");
  // Ground-floor slab / base level.
  put(x, b, z, "stone_bricks");
  // Storey-two floor slab across the footprint.
  put(x, b + 5, z, "smooth_stone");
  // Roof deck across the footprint.
  put(x, b + 10, z, "gray_concrete");

  if (boundary(x, z)) {
    for (let y = b + 1; y <= b + 11; y++) {
      if (y === b + 11) {
        put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
      if (y === b + 10) {
        put(x, y, z, "white_concrete"); // parapet
        continue;
      }
      if (isDoor(x, z) && (y === b + 1 || y === b + 2)) {
        put(x, y, z, "iron_door", {
          facing: "north",
          half: y === b + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (frontEntrance(x, z) && (x === 9 || x === 12) && y === b + 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      if (windowCell(x, z, y)) {
        if (isLit(x, z, y)) {
          put(x, y, z, "glowstone");
        } else {
          put(x, y, z, "light_blue_stained_glass_pane", {
            north: onOff(isPane(x, z - 1, y)),
            south: onOff(isPane(x, z + 1, y)),
            east: onOff(isPane(x + 1, z, y)),
            west: onOff(isPane(x - 1, z, y)),
            waterlogged: "false",
          });
        }
        continue;
      }
      if (y === b + 1) {
        put(x, y, z, "stone_bricks"); // base course
        continue;
      }
      // Piers are white concrete frames; infill is light grey cladding.
      put(x, y, z, idx(x, z) % 3 === 0 ? "white_concrete" : "light_gray_concrete");
    }
  } else {
    // Interior roof plant: small AC plinths on a grid.
    if (x % 6 === 3 && z % 6 === 3) {
      put(x, b + 11, z, "smooth_stone");
      put(x, b + 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
