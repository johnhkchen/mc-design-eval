import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618832";
const W = 20, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height (third number)
const key = (x, z) => `${x},${z}`;
const groundAt = new Map();
for (const [x, z, gy] of cells) groundAt.set(key(x, z), gy);
const has = (x, z) => groundAt.has(key(x, z));

// Outward directions (north = -z, south = +z, west = -x, east = +x)
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// Faces of a cell that border the outside of the footprint
const facesOf = (x, z) =>
  Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));

// Choose the front (longest exposed run) and its entrance cell
const faceCount = { north: [], south: [], west: [], east: [] };
for (const [x, z] of cells) {
  const fs = facesOf(x, z);
  for (const f of fs) if (fs.length === 1) faceCount[f].push([x, z]);
}
let front = "south";
for (const f of Object.keys(faceCount))
  if (faceCount[f].length > faceCount[front].length) front = f;
const frontCells = faceCount[front].slice().sort((a, b) =>
  front === "north" || front === "south" ? a[0] - b[0] : a[1] - b[1]);
const doorCell = frontCells.length
  ? frontCells[Math.floor(frontCells.length / 2)]
  : null;
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

const paneProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const lampAt = (x, y, z) => vox.set(x, y, z, "glowstone");

for (const [x, z, gy0] of cells) {
  const gy = Math.max(0, Math.min(gy0, 4)); // floor level of ground storey
  const faces = facesOf(x, z);
  const perimeter = faces.length > 0;
  const corner = faces.length >= 2;
  const face = faces[0];

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy0; y++) vox.set(x, y, z, "stone_bricks");

  // Ground floor slab / base course
  if (perimeter) vox.set(x, gy, z, "polished_granite");
  else vox.set(x, gy, z, "smooth_stone");

  if (perimeter) {
    const coord = face === "north" || face === "south" ? x : z;
    const isPier = corner || coord % 3 === 0;
    const isDoor = key(x, z) === doorKey;
    const lit = !corner && ((x * 7 + z * 3) % 4 === 0);
    const inward = face ? [x - DIRS[face][0], z - DIRS[face][1]] : null;
    const inwardOK = inward && has(inward[0], inward[1]);

    // Ground storey (storefront)
    for (let y = gy + 1; y <= 3; y++) {
      if (y > 10) break;
      if (isDoor && y <= gy + 2) {
        if (y === gy + 1) {
          vox.set(x, y, z, "dark_oak_door", {
            facing: front, half: "lower", hinge: "left",
            open: "false", powered: "false",
          });
        } else {
          vox.set(x, y, z, "dark_oak_door", {
            facing: front, half: "upper", hinge: "left",
            open: "false", powered: "false",
          });
        }
      } else if (isDoor && y === 3) {
        // Hanging lantern over the entrance, fixed under the fascia
        vox.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else if (isPier) {
        vox.set(x, y, z, "white_concrete");
      } else {
        vox.set(x, y, z, "cyan_stained_glass_pane", paneProps(face));
      }
    }
    if (!isDoor && !isPier && inwardOK && lit && gy + 1 <= 3) {
      lampAt(inward[0], gy + 1, inward[1]);
    }
    if (4 >= gy + 1) vox.set(x, 4, z, "polished_andesite");

    // Floor slab / spandrel band at y 5
    vox.set(x, 5, z, "light_gray_concrete");

    // Upper storey y 6..9
    vox.set(x, 6, z, isPier ? "white_concrete" : "light_gray_concrete");
    for (const y of [7, 8]) {
      if (isPier) vox.set(x, y, z, "white_concrete");
      else vox.set(x, y, z, "cyan_stained_glass_pane", paneProps(face));
    }
    vox.set(x, 9, z, "light_gray_concrete");
    if (!isPier && inwardOK && lit) lampAt(inward[0], 6, inward[1]);

    // Roof slab and parapet
    vox.set(x, 10, z, "smooth_stone");
    vox.set(x, 11, z, "white_concrete");
  } else {
    // Interior: no walls, only floor slabs at storey lines
    vox.set(x, 5, z, "smooth_stone");
    vox.set(x, 10, z, "smooth_stone");

    // Rooftop air-conditioning units on some interior roof cells
    if ((x * 5 + z * 3) % 11 === 0) vox.set(x, 11, z, "iron_block");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
