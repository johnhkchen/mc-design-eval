import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343768";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 33, D = 22;
const gmap = new Map();
let maxG = 0;
for (const [x, z, g] of cells) {
  gmap.set(`${x},${z}`, g);
  maxG = Math.max(maxG, g);
}
const H = Math.max(23, maxG + 13);
const g3 = new Voxels([W, H, D]);

const inside = (x, z) => gmap.has(`${x},${z}`);
function faces(x, z) {
  const f = [];
  if (!inside(x, z - 1)) f.push("N");
  if (!inside(x, z + 1)) f.push("S");
  if (!inside(x - 1, z)) f.push("W");
  if (!inside(x + 1, z)) f.push("E");
  return f;
}

// Entrance: the south-facing exterior cell nearest the middle of that wall
const southXs = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!inside(x, z + 1)) southXs.push(x);
}
let doorX = -1;
if (southXs.length) {
  const mid = (Math.min(...southXs) + Math.max(...southXs)) / 2;
  doorX = southXs.reduce((best, x) => (Math.abs(x - mid) < Math.abs(best - mid) ? x : best));
}

const doorLower = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
const doorUpper = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };

for (const [x, z, g] of cells) {
  const fs = faces(x, z);
  const ext = fs.length > 0;

  // Foundation below the building
  for (let y = 0; y < g; y++) g3.set(x, y, z, "stone_bricks");
  // Ground floor slab / base course
  g3.set(x, g, z, ext ? "stone_bricks" : "smooth_stone");

  if (!ext) {
    // Interior: floor slabs only, no air-blocking walls
    g3.set(x, g + 5, z, "light_gray_concrete");
    g3.set(x, g + 10, z, "smooth_stone");
    // Roof plant units
    if (x % 7 === 3 && z % 6 === 2) g3.set(x, g + 11, z, "light_gray_concrete");
    continue;
  }

  const xFace = fs.includes("E") || fs.includes("W");
  const zFace = fs.includes("N") || fs.includes("S");
  const corner = xFace && zFace;
  const along = xFace && !zFace ? z : x;
  const pier = corner || along % 4 === 0;
  const isDoor = fs.includes("S") && !xFace && x === doorX;

  // Ground storey: shopfront glazing with piers, entrance door
  if (isDoor) {
    g3.set(x, g + 1, z, "oak_door", doorLower);
    g3.set(x, g + 2, z, "oak_door", doorUpper);
    g3.set(x, g + 3, z, "light_blue_stained_glass");
  } else {
    for (let y = g + 1; y <= g + 3; y++) {
      g3.set(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
    }
  }

  // Fascia / storey line
  g3.set(x, g + 4, z, "stone_bricks");
  g3.set(x, g + 5, z, "smooth_stone");

  // Upper storey: windows with sills and heads, piers between
  g3.set(x, g + 6, z, pier ? "white_concrete" : "light_gray_concrete");
  for (let y = g + 7; y <= g + 8; y++) {
    g3.set(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
  }
  g3.set(x, g + 9, z, pier ? "white_concrete" : "light_gray_concrete");

  // Cornice and parapet
  g3.set(x, g + 10, z, "stone_bricks");
  g3.set(x, g + 11, z, "white_concrete");

  // Warm lights behind some upper-storey windows
  if (!pier && along % 3 === 0) {
    const f0 = fs[0];
    const inner = {
      N: [x, z + 1],
      S: [x, z - 1],
      W: [x + 1, z],
      E: [x - 1, z],
    }[f0];
    if (inner && inside(...inner) && faces(...inner).length === 0) {
      g3.set(inner[0], g + 7, inner[1], "glowstone");
    }
  }
}

g3.save(`${DIR}/${ID}.nbt`);
