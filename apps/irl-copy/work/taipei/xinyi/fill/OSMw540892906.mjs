import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540892906";
const W = 36, H = 23, D = 12;

// Footprint cells: [x, z, ground]. Accept either arrays or objects.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map(c => Array.isArray(c) ? c : [c.x, c.z, c.ground ?? c.g ?? c.y]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));
const maxZ = Math.max(...cells.map(c => c[1]));
const B = Math.min(...cells.map(c => c[2]));   // lowest ground under footprint
const TOP = B + 11;                            // roof surface, ~11 blocks above lowest ground

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Perimeter test: any side open to outside the footprint.
const edgeZof = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const edgeXof = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const isPerim = (x, z) => edgeXof(x, z) || edgeZof(x, z);

const paneAlongX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneAlongZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Foundations and building shell per footprint cell.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const start = Math.max(gr, B);

  if (!isPerim(x, z)) {
    // Interior: floor slab at grade, at upper storey line, and roof slab. Air elsewhere.
    for (let y = start; y < TOP; y++) {
      const h = y - B;
      if (y === start || h === 5 || h === 10) put(x, y, z, "smooth_stone");
    }
    continue;
  }

  const edgeZ = edgeZof(x, z);
  const edgeX = edgeXof(x, z);
  const corner = edgeX && edgeZ;
  let i, n, along;
  if (edgeZ) { i = x - minX; n = maxX - minX + 1; along = "x"; }
  else { i = z - minZ; n = maxZ - minZ + 1; along = "z"; }

  const frontEdge = edgeZ && z === minZ;
  const pier = corner || i === 0 || i === n - 1 || i % 4 === 0;
  const isDoor = frontEdge && !corner && (i === 6 || i === 29);
  const paneProps = along === "x" ? paneAlongX : paneAlongZ;

  // Inward neighbour (for interior warm lights behind glass).
  let inX = x, inZ = z;
  if (edgeZ) inZ = z === minZ ? z + 1 : z - 1;
  else inX = x === minX ? x + 1 : x - 1;
  const lightCell = !pier && has(inX, inZ) && !isPerim(inX, inZ);

  for (let y = start; y < TOP; y++) {
    const h = y - B;
    let id = null, props;

    if (h === 0) id = "stone_bricks";                       // base course
    else if (h === 3 || h === 5 || h === 9) id = "white_concrete"; // lintel / sill / lintel bands
    else if (h === 4) id = "light_gray_concrete";           // storey line
    else if (h === 10) id = "stone_bricks";                 // parapet cornice
    else if (h <= 2) {                                      // ground floor shopfront
      if (pier) id = "white_concrete";
      else if (isDoor && h === 1) { id = "dark_oak_door"; props = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }; }
      else if (isDoor && h === 2) { id = "dark_oak_door"; props = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }; }
      else { id = "glass_pane"; props = paneProps; }
    } else if (h >= 6 && h <= 8) {                          // upper floor windows
      if (pier) id = "white_concrete";
      else { id = "glass_pane"; props = paneProps; }
    }

    if (id) put(x, y, z, id, props);
  }

  // Warm lights behind some glass in the air gap.
  if (lightCell && i % 8 === 1) put(inX, 2 + B, inZ, "glowstone");
  if (lightCell && i % 8 === 5) put(inX, 7 + B, inZ, "shroomlight");
}

// 2. Rooftop units on the roof surface (interior cells only).
const unitCells = [
  [minX + 10, minZ + 3], [minX + 11, minZ + 3],
  [minX + 10, minZ + 4], [minX + 11, minZ + 4],
  [minX + 22, minZ + 6], [minX + 23, minZ + 6],
  [minX + 22, minZ + 7], [minX + 23, minZ + 7],
];
for (const [x, z] of unitCells) {
  if (!has(x, z) || isPerim(x, z)) continue;
  put(x, TOP, z, "light_gray_concrete");
  put(x, TOP + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
