import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541864104";
const W = 14, D = 13, H = 23;

// Record: roof ~11 blocks above lowest ground. Reads as a two-storey mid-century
// commercial block (1970s-90s Taipei): white concrete frame, stone-bricked base,
// light-blue glazing in aluminium-style grids, a parapet and a plant penthouse.
const ROOF_TOP = 11;   // top of parapet course
const STOREY_LINE = 5; // storey floor line
const DECK = 10;       // roof deck / cornice course

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gy] of cells) ground.set(key(x, z), Math.round(gy));

const inFp = (x, z) => ground.has(key(x, z));
const gyOf = (x, z) => ground.get(key(x, z));
const NEIGH = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const exposedFaces = (x, z) =>
  NEIGH.filter(([dx, dz]) => !inFp(x + dx, z + dz));
const isPerimeter = (x, z) => exposedFaces(x, z).length > 0;
const isInterior = (x, z) => inFp(x, z) && !isPerimeter(x, z);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pane connections follow the wall axis so glass reads as a continuous grid.
const paneProps = (axis) =>
  axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "true", waterlogged: "false" };

function facadeSpec(y, u, axis, gy, corner) {
  if (y === ROOF_TOP) return { id: "stone_brick_slab", props: { type: "bottom", waterlogged: "false" } };
  if (y === DECK) return { id: "stone_bricks" };
  if (y === STOREY_LINE) return { id: "light_gray_concrete" };
  if (y > STOREY_LINE) {
    // upper storey: window grid, mullions every 3 blocks, spandrels top and bottom
    if (corner || u % 3 === 0) return { id: "white_concrete" };
    if (y === 6 || y === 9) return { id: "white_concrete" };
    return { id: "light_blue_stained_glass_pane", props: paneProps(axis) };
  }
  // ground floor shopfront: granite pilasters, plinth, glazing, lintel
  if (corner || u % 4 === 0) return { id: "polished_andesite" };
  if (y === gy + 1) return { id: "stone_bricks" };
  if (y === 4) return { id: "white_concrete" };
  return { id: "light_blue_stained_glass_pane", props: paneProps(axis) };
}

// 1. Foundations, floor slabs and roof deck on every footprint cell.
for (const [x, z, gy] of cells) {
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");
  put(x, gy, z, "smooth_stone");
  if (gy < STOREY_LINE) put(x, STOREY_LINE, z, "light_gray_concrete");
  if (gy < DECK) put(x, DECK, z, "light_gray_concrete");
}

// 2. Perimeter facades (walls from just above ground to parapet).
for (const [x, z, gy] of cells) {
  const faces = exposedFaces(x, z);
  if (faces.length === 0) continue;
  const corner = faces.length >= 2;
  const [dx, dz] = faces[0];
  const axis = dx !== 0 ? "z" : "x";
  const u = axis === "x" ? x : z;
  for (let y = gy + 1; y <= ROOF_TOP; y++) {
    const spec = facadeSpec(y, u, axis, gy, corner);
    put(x, y, z, spec.id, spec.props);
  }
}

// 3. Main entrance on the south face, centred.
{
  const dx = Math.floor(W / 2), dz = D - 1;
  if (inFp(dx, dz) && exposedFaces(dx, dz).some(([a, b]) => a === 0 && b === 1)) {
    const gy = gyOf(dx, dz);
    const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
    put(dx, gy + 1, dz, "dark_oak_door", { ...door, half: "lower" });
    put(dx, gy + 2, dz, "dark_oak_door", { ...door, half: "upper" });
    put(dx, gy + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 4. Warm light behind glass: glowstone on interior cells one step inside a window.
for (const [x, z, gy] of cells) {
  const faces = exposedFaces(x, z);
  if (faces.length !== 1) continue;
  const [dx, dz] = faces[0];
  const u = dx !== 0 ? z : x;
  const cx = x - dx, cz = z - dz;
  if (!isInterior(cx, cz)) continue;
  // upper windows
  if (u % 6 === 1) put(cx, 7, cz, "glowstone");
  // shopfront
  if (gy + 2 <= 4 && u % 8 === 2 && gy < 4) put(cx, gy + 2, cz, "glowstone");
}

// 5. Roof plant penthouse on interior cells near the centre, with a lightning rod.
for (const [x, z, gy] of cells) {
  if (!isInterior(x, z) || gy > DECK) continue;
  if (x < 4 || x > 8 || z < 4 || z > 7) continue;
  for (let y = ROOF_TOP; y <= ROOF_TOP + 2; y++) put(x, y, z, "light_gray_concrete");
  put(x, ROOF_TOP + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
if (isInterior(6, 5) && gyOf(6, 5) <= DECK) {
  put(6, ROOF_TOP + 4, 5, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  put(6, ROOF_TOP + 5, 5, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
