import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020181";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Low-rise 1980s Xinyi commercial block: stone base, two storeys of
// white-framed glass bays, red shopfront fascia, cornice and parapet.
// Roof sits 11 blocks above the lowest ground.
const W = 14, H = 23, D = 9;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(key(x, z), gr);
const has = (x, z) => gmap.has(key(x, z));

const FACES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const facesOf = (x, z) =>
  Object.entries(FACES)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([n]) => n);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Street frontage = face carrying the most boundary cells
const faceCount = { north: 0, south: 0, west: 0, east: 0 };
for (const [x, z] of cells) for (const f of facesOf(x, z)) faceCount[f]++;
const front = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
const uOf = (face, x, z) => (face === "north" || face === "south" ? x : z);

// Entrance at the middle of the front face
const frontU = cells
  .filter(([x, z]) => facesOf(x, z).includes(front))
  .map(([x, z]) => uOf(front, x, z));
const doorU = Math.floor((Math.min(...frontU) + Math.max(...frontU)) / 2);

const paneProps = (face) => {
  const alongU = face === "north" || face === "south";
  return {
    north: alongU ? "false" : "true",
    south: alongU ? "false" : "true",
    east: alongU ? "true" : "false",
    west: alongU ? "true" : "false",
    waterlogged: "false",
  };
};

// Facade block for storey offset h (0..11) on a boundary cell
function facade(h, u, face, x, z) {
  const pier = u % 3 === 0;
  if (h === 0) return ["stone_bricks"];                       // base course
  if (h <= 3) {                                               // shopfront
    if (pier) return ["white_concrete"];
    if (u === doorU && face === front) {
      if (h === 1) return ["dark_oak_door", {
        facing: face, half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (h === 2) return ["dark_oak_door", {
        facing: face, half: "upper", hinge: "left", open: "false", powered: "false" }];
    }
    if (h === 3 && u % 6 === 1) return ["glowstone"];          // warm light
    return ["light_blue_stained_glass"];
  }
  if (h === 4) return ["red_concrete"];                       // shopfront fascia
  if (h === 5) return ["light_gray_concrete"];                // storey line
  if (h === 6) return ["white_concrete"];                     // sill spandrel
  if (h === 7 || h === 8) {                                   // upper windows
    if (pier) return ["white_concrete"];
    if (h === 7 && u % 9 === 2) return ["glowstone"];
    return ["glass_pane", paneProps(face)];
  }
  if (h === 9) return ["light_gray_concrete"];                // head band
  if (h === 10) return ["light_gray_concrete"];               // cornice
  return ["white_concrete"];                                  // parapet h=11
}

for (const [x, z, gr] of cells) {
  // foundation up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // floor slabs at ground, storey line and roof level
  const interiorFloor = (y) => put(x, gr + y, z, "light_gray_concrete");

  const fs = facesOf(x, z);
  if (fs.length === 0) {
    interiorFloor(0);
    interiorFloor(5);
    interiorFloor(10);
    // roof plant on interior roof cells
    if (x % 4 === 1 && z % 3 === 1) put(x, gr + 11, z, "iron_block");
    continue;
  }

  // single face per boundary cell: prefer the street face
  const face = fs.includes(front) ? front : fs[0];
  const u = uOf(face, x, z);
  for (let h = 0; h <= 11; h++) {
    const [id, props] = facade(h, u, face, x, z);
    put(x, gr + h, z, id, props);
  }
}

g.save(`${DIR}/${ID}.nbt`);
