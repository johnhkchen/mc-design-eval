import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw538458232: no record. Read as a 2-storey, 1980s-90s Taipei commercial block:
// white tiled concrete frame, light-grey cornice and floor bands, a shopfront
// ground floor with a central entrance, a parapet roof with plant, and a small
// penthouse. Roof deck sits at +10 from the lowest ground (11 blocks tall).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458232";
const W = 20, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const b = Math.min(...cells.map((c) => c[2]));   // lowest ground
const ROOF = b + 10;                              // parapet top; roof deck at ROOF-1

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Depth: 0 = perimeter (facade), 1 = air gap behind facade, 2+ = solid mass.
const depth = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1)) {
    depth.set(key(x, z), 0);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !depth.has(key(nx, nz))) {
      depth.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}

// Outward faces per perimeter cell (order: north, south, west, east).
function outwardFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

// Pick the entrance: the middle cell of the face with the most perimeter cells,
// preferring the south (street-side) face on ties.
const faceCount = { north: [], south: [], west: [], east: [] };
for (const [x, z] of cells) {
  if (depth.get(key(x, z)) !== 0) continue;
  for (const f of outwardFaces(x, z)) faceCount[f].push([x, z]);
}
let entranceDir = "south";
for (const f of ["south", "north", "east", "west"]) {
  if (faceCount[f].length > faceCount[entranceDir].length) entranceDir = f;
}
const entList = faceCount[entranceDir].slice().sort((a, b2) =>
  entranceDir === "north" || entranceDir === "south" ? a[0] - b2[0] : a[1] - b2[1]
);
const entrance = entList.length ? entList[Math.floor(entList.length / 2)] : null;
const entKey = entrance ? key(entrance[0], entrance[1]) : null;

// Facade material for a perimeter cell at height y.
function facadeBlock(x, z, y, gr, faces) {
  if (y === ROOF) return { id: "smooth_quartz" };                 // parapet cap
  if (y === b + 9) return { id: "light_gray_concrete" };          // cornice band
  if (y === b + 5) return { id: "light_gray_concrete" };          // floor line
  const corner = faces.length > 1;
  const face = faces[0];
  const idx = face === "north" || face === "south" ? x : z;
  const pier = corner || idx % 3 === 0;

  if (y < b + 5) {                                               // ground floor
    if (y === gr) return { id: "polished_andesite" };            // base course
    if (y === b + 4) return { id: "gray_concrete" };             // fascia
    if (pier) return { id: "white_concrete" };
    return { id: "glass" };                                      // shopfront
  }
  // upper storey
  if (pier) return { id: "white_concrete" };
  if (y === b + 8) return { id: "light_gray_concrete" };         // spandrel
  return { id: "light_blue_stained_glass" };                     // window
}

for (const [x, z, gr] of cells) {
  const d = depth.get(key(x, z));

  // Foundation under the cell up to its own ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (d === 0) {
    const faces = outwardFaces(x, z);
    const isEnt = key(x, z) === entKey;
    for (let y = gr; y <= ROOF; y++) {
      if (isEnt && y === gr) {
        put(x, y, z, "oak_door", {
          facing: entranceDir, half: "lower", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (isEnt && y === gr + 1) {
        put(x, y, z, "oak_door", {
          facing: entranceDir, half: "upper", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      const { id } = facadeBlock(x, z, y, gr, faces);
      put(x, y, z, id);
    }
    // Entrance lintel band over the door.
    if (isEnt) put(x, b + 4, z, "gray_concrete");
  } else if (d === 1) {
    // Air gap behind the facade, with floor slab and roof deck.
    for (let y = gr; y <= ROOF; y++) {
      if (y === b + 5) put(x, y, z, "light_gray_concrete");
      else if (y === b + 9) put(x, y, z, "gray_concrete");
      // else air
    }
    // Warm light behind some windows (glowstone upstairs, lanterns downstairs).
    if (gr <= b + 7 && (x + z) % 6 === 1) put(x, b + 7, z, "glowstone");
    if (gr <= b + 4 && (x + 2 * z) % 5 === 0) {
      put(x, b + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  } else {
    // Solid interior mass with roof deck and some roof plant.
    for (let y = gr; y <= ROOF; y++) {
      if (y === b + 5) put(x, y, z, "light_gray_concrete");
      else if (y === b + 9) put(x, y, z, "gray_concrete");
      else if (y <= b + 8) put(x, y, z, "white_concrete");
      else if (y === ROOF && (3 * x + 5 * z) % 11 === 0) put(x, y, z, "iron_block");
    }
    // Penthouse block in the middle of the roof.
    if (d >= 3 && x >= 5 && x <= 14 && z >= 4 && z <= 11) {
      for (let y = ROOF; y <= ROOF + 1; y++) put(x, y, z, "light_gray_concrete");
      put(x, ROOF + 2, z, "smooth_quartz");
      if ((x + z) % 4 === 0) put(x, ROOF + 1, z, "light_blue_stained_glass");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
