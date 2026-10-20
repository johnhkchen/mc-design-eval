import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458222";
const W = 21, H = 23, D = 30;

// Footprint: [x, z, ground] per cell
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let F = -Infinity;                       // floor level = highest ground under the footprint
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, gy);
  if (gy > F) F = gy;
}
const has = (x, z) => ground.has(`${x},${z}`);
if (F + 11 > H - 1) throw new Error(`roof at ${F + 11} exceeds grid height ${H}`);

const g = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward directions: a face is exterior when its neighbour is not in the footprint.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
const outFaces = (x, z) =>
  Object.keys(DIRS).filter((k) => !has(x + DIRS[k][0], z + DIRS[k][1]));

// Main (street) facade: south if it exists, else north. Door sits on its middle column.
const front = cells.some(([x, z]) => outFaces(x, z).includes("S")) ? "S" : "N";
const frontXs = cells
  .filter(([x, z]) => outFaces(x, z).includes(front))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

for (const [x, z] of cells) {
  // Foundation: solid from y 0 up to the floor level under every cell.
  for (let y = 0; y < F; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at ground, 2nd floor and roof (interior and edge alike).
  put(x, F, z, "smooth_stone");
  put(x, F + 5, z, "smooth_stone");
  put(x, F + 10, z, "light_gray_concrete");

  const faces = outFaces(x, z);
  if (faces.length === 0) {
    // Interior: air above the slabs, with a few rooftop AC units.
    if ((x * 5 + z * 7) % 11 === 0) put(x, F + 11, z, "iron_block");
    continue;
  }

  // Edge cell: pick the front face if exterior there, else the first exterior face.
  const f = faces.includes(front) ? front : faces[0];
  const i = f === "N" || f === "S" ? x : z;       // index along the facade
  const d = DIRS[f];
  const inX = x - d[0], inZ = z - d[1];           // inward neighbour
  const inwardIsInterior = has(inX, inZ) && outFaces(inX, inZ).length === 0;
  const isDoor = faces.includes(front) && x === doorX;
  const pier = i % 3 === 0;

  const paneProps =
    f === "N" || f === "S"
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let r = 0; r <= 10; r++) {
    const y = F + r;
    if (r === 0) {
      put(x, y, z, "stone_bricks");                                   // base course
    } else if (r <= 3) {
      if (isDoor && r <= 2) {
        const doorProps = { facing: FACING[f], hinge: "left", open: "false", powered: "false" };
        put(x, y, z, "dark_oak_door", { ...doorProps, half: r === 1 ? "lower" : "upper" });
      } else if (r === 3 && isDoor) {
        put(x, y, z, "glass_pane", paneProps);                        // transom over door
      } else if (pier) {
        put(x, y, z, "white_concrete");                               // shopfront pier
      } else {
        put(x, y, z, "glass_pane", paneProps);                        // shopfront glazing
      }
    } else if (r === 4) {
      put(x, y, z, "red_concrete");                                   // fascia band
    } else if (r === 5) {
      put(x, y, z, "smooth_stone");                                   // storey belt course
    } else if (r <= 8) {
      if (pier) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", paneProps);
        // Warm light behind selected 2nd-floor windows (one-cell air gap at the glass).
        if (r === 7 && i % 6 === 1 && inwardIsInterior) {
          put(inX, F + 7, inZ, "glowstone");
        }
      }
    } else if (r === 9) {
      put(x, y, z, "smooth_quartz");                                   // cornice
    } else if (r === 10) {
      put(x, y, z, "white_concrete");                                  // parapet
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
